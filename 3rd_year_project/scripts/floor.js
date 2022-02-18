//global variables, use with caution!
var selected_room_name = "";
var selected_week = 0;

async function init(){  
    //get the room name from the URL
    const floor_name = getFloorName();
    //set title
    document.title = floor_name.replace("_", " ");
    //static map attributes
    const initial_map_attributes = {
        "lat" : 53.46750771428495,
        "lng" : -2.233885992091956,
        "rotation_angle" : -28.55,
        "zoom" : 18.8,
        "token" : "pk.eyJ1IjoidmhkYW5nIiwiYSI6ImNrdnllMml5ODBxd2YydXFpaGZuM3VxZGEifQ.ATaKwz3pOdOc8Xtr0n7CfA"
    }
    //create HTML elements
    {
        //create map div
        createMapDiv();
        //picker for semester & link it to showTimetable()
        createSemesterPicker();
        //picker for week & link it to showTimetable()
        createWeekPicker();
        //timetable div
        createTimetableDiv();  
    }

    //create map
    var map = createMap(initial_map_attributes);
    //load map
    await loadMap(map, floor_name);
    //button to show availability of rooms
    createToggleAvailabilityButton(map);
    //set up on click event to call the php code
    setOnClickMap(map, floor_name);
    //add navigation control - zoom, pan
    addNavigationControl(map);
    //reset button to reset the position of the map
    createResetPositionButton(map, initial_map_attributes);
}

async function getJsonDataFromFile(file_path){
    //load files locally
    return fetch(file_path)
    .then(response => {
        if(!response.ok){
            throw new Error("File not found at " + file_path);
        }
        return response.json();
    })
}

async function getJsonDataFromCloud(dataset_ids, dataset_name){
    //get dataset id
    const dataset_id = dataset_ids[dataset_name];
    if(dataset_id == null){
        console.log("id not found " + dataset_name)
    }
    var url = "https://api.mapbox.com/datasets/v1/vhdang/"
        +dataset_id
        +"/features"
        +"?access_token="
        +mapboxgl.accessToken;
    //return dataset from cloud
    return fetch(url)
    .then(response => {
        if(!response.ok){
            throw new Error("URL not found at, " + url);
        }
        return response.json();
    });
}

async function showTimetable(str, week_number){
    const path_to_root = "../";
    if(str==""){
        var timetable = document.getElementById("timetable");
        timetable.innerHTML = "";
        return;
    }
    //find the correct name in the json file
    const name_mappings = await getJsonDataFromFile(path_to_root + "/data/TimetableData/map_to_db.json");
    var db_name = name_mappings[str]
    if (db_name == null){
        db_name = "";
    }
    //load php script
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function(){
        document.getElementById("timetable").innerHTML = this.responseText;
    }
    xhttp.open("GET", path_to_root + "php/print_timetable.php?room=" + db_name + "&week_number=" + week_number + "&room_name=" + str);
    xhttp.send();
}

function getFloorName(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const floor_from_url = urlParams.get('floor');
    if(floor_from_url == null){
        throw new Error("Floor name is empty") ;
    }
    return floor_from_url;
}

//change this semester_offset according to the teaching year
function getWeekNumber(){
    const semester_offset = 20;
    const semester_num = parseInt(document.getElementById("semester_picker").value);
    const week_num = parseInt(document.getElementById("week_picker").value);
    const real_week_num = (semester_num-1)*semester_offset + week_num;
    selected_week = real_week_num;
    return real_week_num;
}

function createMap(initial_map_attributes){
    //sk.eyJ1IjoidmhkYW5nIiwiYSI6ImNrdzlxMjlzdjBiamwydnFsczFzcWh6NG4ifQ.Rykts7uD3lREfUElWufoQQ
    mapboxgl.accessToken = initial_map_attributes["token"];
    
    var map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/vhdang/ckw9zkrqr7es315mi4atlpunw', // style URL
        center: [initial_map_attributes["lng"], initial_map_attributes["lat"]], // starting position [lng, lat]
        zoom: initial_map_attributes["zoom"], // starting zoom
        bearing:  initial_map_attributes["rotation_angle"]
    });

    return map;
}

function addNavigationControl(map){
    const nav = new mapboxgl.NavigationControl({
        visualizePitch: true
        });
    map.addControl(nav, "bottom-right");
}

async function loadMap(map, floor_name){
    map.on('load', async () => {
        const path_to_root = "../";
        const dataset_ids = await getJsonDataFromFile(path_to_root + "data/MapboxDatasetAPI/dataset_ids.json");
        //load rooms polygons
        const rooms_data = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_rooms"));
        //load points with labels (centroids of polygons)
        const centroid_data = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_room_centroids"));
        //load corridor data
        const corridor_data = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_corridors"));
        //load structure data
        const structure_data = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_structures"));
        //load structure centroid data
        const structure_centroid_data = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_structure_centroids"));
        /*---data sources---*/
        const rooms_data_source = floor_name.concat("_polygon_data");
        const labels_data_source = floor_name.concat("_label_data");
        const corridor_data_source = floor_name.concat("_corridor_data");
        const structures_data_source = floor_name.concat("_structure_data");
        const structure_label_data_source = floor_name.concat("_structure_label_data");
        {
            //Kilburn_G_polygon_data - stores the GeoJSON data about the polygons
            map.addSource(rooms_data_source, {
                'type': 'geojson',
                'data': rooms_data
            });
            //Kilburn_G_label_data - stores the centroid positions of polygons
            map.addSource(labels_data_source, {
                'type': 'geojson',
                'data': centroid_data
            });
            //Kilburn_G_corridor_data
            map.addSource(corridor_data_source, {
                'type': 'geojson',
                'data': corridor_data
            });
            //Kilburn_G_structure_data - stores the data of structures
            map.addSource(structures_data_source, {
                'type': 'geojson',
                'data': structure_data
            });
            //Kilburn_G_structure_label_data contains the data of labels for structures
            map.addSource(structure_label_data_source, {
                'type': 'geojson',
                'data': structure_centroid_data
            });
        }

        /*---layers---*/
        //add layer for corridors
        {
            const layer_corridors_name = floor_name.concat("_corridors");
            map.addLayer({
                'id': layer_corridors_name,
                'type': 'fill',
                'source': corridor_data_source, // reference the data source
                'layout': {
                    'visibility' : "visible"
                },
                'paint': {
                    'fill-color': ['match', ['get', 'type'],
                                    'corridor', '#d5d5d5',
                                    'wall', 'grey',
                                    'grey'], 
                    'fill-opacity': 1
                }
            });
            
            //add layer for corridor outlines
            const layer_corridors_lines_name = floor_name.concat("_corridor_outlines");
            map.addLayer({
                'id': layer_corridors_lines_name,
                'type': 'line',
                'source': corridor_data_source,
                'layout': {
                    'visibility' : "visible"
                },
                'paint': {
                    'line-color': 'white',
                    'line-width': 3
                }
            });
        }  

        //adds layer for structures
        {
            const layer_structures_name = floor_name.concat("_structures");
            map.addLayer({
                'id': layer_structures_name,
                'type': 'fill',
                'source': structures_data_source, // reference the data source
                'layout': {
                    'visibility' : "visible"
                },
                'paint': {
                    'fill-color': ['match', ['get', 'type'],
                                    'IT Services', 'transparent',
                                    'exit', 'transparent',
                                    'stairs', '#677578',
                                    'mens_bathroom', 'blue',
                                    'womens_bathroom', 'red',
                                    'accessible_bathroom', 'green',
                                    'lift', '#677578',
                                    'accessible_lift', '#677578',
                                    'grey'], 
                    'fill-opacity': 0.5
                }
            });

            //adds layer for outline of structures
            const layer_structures_lines_name = floor_name.concat("_structure_outlines");
            map.addLayer({
                'id': layer_structures_lines_name,
                'type': 'line',
                'source': structures_data_source,
                'layout': {
                    'visibility' : "visible"
                },
                'paint': {
                    'line-color': ['match', ['get', 'type'],
                                    'IT Services', 'transparent',
                                    'exit', ' transparent',
                                    'white'],
                    'line-width': 3
                }
            });   
        }
        
        //adds layer for rooms
        {
            const layer_rooms_name = floor_name.concat("_rooms");
            map.addLayer({
                'id': layer_rooms_name,
                'type': 'fill',
                'source': rooms_data_source, // reference the data source
                'layout': {
                    'visibility' : "visible"
                },
                'paint': {
                    'fill-color': '#0080ff', // blue color fill
                    'fill-opacity': 0.5
                }
            });

            //adds layer for outline around the rooms
            const layer_rooms_lines_name = floor_name.concat("_room_outlines");
            map.addLayer({
                'id': layer_rooms_lines_name,
                'type': 'line',
                'source': rooms_data_source,
                'layout': {
                    'visibility' : "visible"
                },
                'paint': {
                    'line-color': '#FFFFFF',
                    'line-width': 3
                }
            });    
        }

        //add layer for labels and icons
        {
            //adds layer for labels of structures
            const layer_structures_labels_name = floor_name.concat("_structure_labels");
            map.addLayer({
                'id': layer_structures_labels_name,
                'type': 'symbol',
                'source': structure_label_data_source,
                'layout':{
                    'visibility': "visible",
                    'text-field': ['get', 'type'],
                    //when the text overlaps, only one is displayed
                    'text-ignore-placement' : true,
                    'text-justify' : "center",
                    'text-size' : 12,
                    //rotation of the text can be locked
                    'text-rotation-alignment' : "map", 'text-rotate' : -28.55
                }
            });

            //adds layer for labels of rooms
            const layer_lables_name = floor_name.concat("_labels");
            map.addLayer({
                'id': layer_lables_name,
                'type': 'symbol',
                'source': labels_data_source,
                'layout':{
                    'visibility': "visible",
                    'text-field': ['match', ['get', 'name'],
                                    '.', '',
                                    ['get', 'name']],
                    //when the text overlaps, only one is displayed
                    'text-ignore-placement' : true,
                    'text-justify' : "center",
                    'text-size' : 12,
                    //rotation of the text can be locked
                    'text-rotation-alignment' : "map", 'text-rotate' : -28.55
                }
            });
        }

    });
}

function setOnClickMap(map, floor_name){
    //on click shows the name
    const layer_rooms_name = floor_name.concat("_rooms");
    map.on('click', layer_rooms_name, async (e) => {
        //show the timetable
        selected_room_name = e.features[0].properties.name;
        await showTimetable(selected_room_name, getWeekNumber());
    });
    //change mouse icon
    map.on('mouseenter', layer_rooms_name, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layer_rooms_name, () => {
        map.getCanvas().style.cursor = '';
    });
}

function createMapDiv(){
    //create menu
    var menu_nav = document.createElement('nav');
    menu_nav.id = "menu";
    menu_nav.className = "menu";
    document.getElementById("main_div").appendChild(menu_nav);
    //create div for a map
    var map_div = document.createElement("div");
    map_div.id = "map";
    document.getElementById("main_div").appendChild(map_div);
}

function createSemesterPicker(){
    //static values:
    const sem1_max_num_weeks = 13;
    const sem2_max_num_weeks = 24;
    //create select html element
    var semester_picker = document.createElement('select');
    semester_picker.id = "semester_picker";
    //set options - semester 1 and 2
    var sem1 = document.createElement('option');
    sem1.value = "1";
    sem1.innerHTML = "Semester 1";
    var sem2 = document.createElement('option');
    sem2.value = "2";
    sem2.innerHTML = "Semester 2";
    semester_picker.appendChild(sem1);
    semester_picker.appendChild(sem2);
    //set on change - change week values
    var max_num_weeks = 0;
    semester_picker.onchange = async function(){
        if(semester_picker.value == 1){
            max_num_weeks = sem1_max_num_weeks;
        }
        else{
            max_num_weeks = sem2_max_num_weeks;
        }
        var week_picker = document.getElementById("week_picker");
        week_picker.innerHTML = "";
        for(var i=1; i<= max_num_weeks; i++){
            var week_num = document.createElement("option");
            week_num.value = i;
            week_num.innerHTML = i;
            week_picker.appendChild(week_num);
        }
        await showTimetable(selected_room_name, getWeekNumber());
    }
    document.getElementById("main_div").appendChild(semester_picker);
}

function createWeekPicker(){
    var week_picker = document.createElement("select");
    week_picker.id ="week_picker";
    const max_num_weeks = 13;
    for(var i=1; i<= max_num_weeks; i++){
        var week_num = document.createElement("option");
        week_num.value = i;
        week_num.innerHTML = i;
        week_picker.appendChild(week_num);
    }

    week_picker.onchange = async function(){
        //call showTimetable()
        await showTimetable(selected_room_name, getWeekNumber());
    }
    document.getElementById("main_div").appendChild(week_picker);
}

function createTimetableDiv(){
    var timetable_div = document.createElement("div");
    timetable_div.id = "timetable";
    timetable_div.float = "right";
    document.getElementById("main_div").appendChild(timetable_div);
}

function createResetPositionButton(map, initial_map_attributes){
    function resetPosition(){
        map.setCenter([initial_map_attributes["lng"], initial_map_attributes["lat"]]);
        map.setBearing(initial_map_attributes["rotation_angle"]);
        map.setZoom(initial_map_attributes["zoom"]);
        map.setPitch(0, 0);
    }
    const ctrlLine = new MapboxGLButtonControl({
        className: "mapbox-gl-draw_polygon",
        title: "Reset Position",
        eventHandler: resetPosition
      });

    map.addControl(ctrlLine, "bottom-right");
}

function createToggleAvailabilityButton(map){
    var availability_button = document.createElement("input");
    availability_button.id = "show_availability";
    availability_button.value = "Toggle room availability";
    availability_button.type = "button";
    availability_button.onclick = toggleRoomAvailability(map);
    document.getElementById("main_div").appendChild(availability_button);
    document.getElementById("main_div").appendChild(document.createElement('br'));
}

function toggleRoomAvailability(map){
    //get availability for the chosen semester and room
    
    //get list of all unavailable rooms

    const d = new Date();
    let current_time = d.getTime();
    selected_room_name;
    selected_week;

    //call PHP script that returns the list

    //create a layer on top
    const floor_name = getFloorName();
    map.getSource(floor_name.concat("_polygon_data"));
    //map.addLayer();
    //map.removeLayer();
}

class MapboxGLButtonControl {
    constructor({
      className = "",
      title = "",
      eventHandler = evtHndlr
    }) {
      this._className = className;
      this._title = title;
      this._eventHandler = eventHandler;
    }
  
    onAdd(map) {
      this._btn = document.createElement("button");
      this._btn.className = "mapboxgl-ctrl-icon" + " " + this._className;
      this._btn.type = "button";
      this._btn.title = this._title;
      this._btn.onclick = this._eventHandler;
  
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
      this._container.appendChild(this._btn);
  
      return this._container;
    }
  
    onRemove() {
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }
  }