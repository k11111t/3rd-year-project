//global variables, use with caution!
var selected_room_name = "";
var selected_week = 0;
//change these according to the year
const SEM_1_NUM_WEEKS = 13;
const SEM_2_NUM_WEEKS = 24;
const SEMESTER_OFFSET = 20;

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
    //create map div
    createMapDiv();
    //picker for semester & link it to showTimetable()
    createSemesterPicker();
    //picker for week & link it to showTimetable()
    createWeekPicker();
    //create room picker
    createRoomPicker();
    //timetable div
    createTimetableDiv(); 
    
    //create map
    var map = createMap(initial_map_attributes);
    //add navigation control - zoom, pan
    addNavigationControl(map);
    //reset button to reset the position of the map
    createResetPositionButton(map, initial_map_attributes);
    //load map
    await loadMap(map, floor_name);
    //button to show availability of rooms
    //createToggleAvailabilityButton(map);   
}

//can be used for cloud or local files
async function getJsonDataFromURL(file_path){
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
    return await getJsonDataFromURL(url);
}

async function showTimetable(str, week_number){
    selected_room_name = str;
    const path_to_root = "../";
    if(str==""){
        var timetable = document.getElementById("timetable");
        timetable.innerHTML = "";
        return;
    }
    
    //find the correct name in the json file
    const name_mappings = await getJsonDataFromURL(path_to_root + "data/TimetableData/mappings/map_to_db.json");
    var db_name = name_mappings[str];
    //if there is no mapping - no data in database about the room
    if (db_name == null){ db_name = ""; }
    //load php script
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function(){
        document.getElementById("timetable").innerHTML = this.responseText;
    }
    xhttp.open("GET", path_to_root + "php/print_timetable.php?room=" + db_name + "&week_number=" + week_number + "&room_name=" + str);
    xhttp.send();

    //update the room selector
    var room_picker = document.getElementById("room_picker");
    var counter = 0;
    for(var option of room_picker.options){
        if(option.value === str){
            room_picker.selectedIndex = counter;
            break;
        }
        room_picker.selectedIndex = 0;
        counter++;
    }
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
    const semester_num = parseInt(document.getElementById("semester_picker").value);
    const week_num = parseInt(document.getElementById("week_picker").value);
    const real_week_num = (semester_num-1)*SEMESTER_OFFSET + week_num;
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
        map.addControl(new mapboxgl.FullscreenControl(), "bottom-right");
    map.addControl(nav, "bottom-right");
}

async function addDataSources(map, floor_name){
//get dataset ids from a file
    const path_to_root = "../";
    const dataset_ids = await getJsonDataFromURL(path_to_root + "data/MapboxAPI/dataset_ids.json");
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
    const rooms_data_source = floor_name.concat("_room_data");
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
}

async function loadMap(map, floor_name){
    map.on('load', async () => {
        /*---data sources---*/
        const rooms_data_source = floor_name.concat("_room_data");
        const labels_data_source = floor_name.concat("_label_data");
        const corridor_data_source = floor_name.concat("_corridor_data");
        const structures_data_source = floor_name.concat("_structure_data");
        const structure_label_data_source = floor_name.concat("_structure_label_data");
        await addDataSources(map, floor_name);

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

            //adds layer for outline of structures
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
            //add layers for structures 
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
            //layer with actual rooms
            const layer_rooms_name = floor_name.concat("_rooms");
            map.addLayer({
                'id': layer_rooms_name,
                'type': 'fill',
                'source': rooms_data_source, // reference the data source
                'layout': {
                    'visibility' : "visible"
                },
                'paint': {
                    'fill-color': "blue",
                    'fill-opacity': 1,
                },
            });

            //layer that highlights the searched rooms
            const search_layer_rooms_name = floor_name.concat("_rooms_search");
            map.addLayer({
                'id': search_layer_rooms_name,
                'type': 'fill',
                'source': rooms_data_source, // reference the data source
                'layout': {
                    'visibility' : "none"
                },
                'paint': {
                    'fill-color': 'yellow',
                    'fill-opacity': 1
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

        //add extruded layers
        {
            //add layer for extruded corridors
            const layer_corridors_extruded_name = floor_name.concat("_corridors_extruded");
            map.addLayer({
                'id': layer_corridors_extruded_name,
                'type': 'fill-extrusion',
                'source': corridor_data_source, // reference the data source
                'layout': {
                    'visibility' : "none"
                },
                'paint': {
                    'fill-extrusion-color': ['match', ['get', 'type'],
                                    'corridor', '#d5d5d5',
                                    'wall', 'grey',
                                    'grey'], 
                    'fill-extrusion-opacity': 1,
                    'fill-extrusion-height': ['match', ['get', 'type'],
                                                'corridor', 0,
                                                'wall', 3,
                                                0
                                            ]
                }
            });

            //add layer for extruded structures
            const layer_structures_extruded_name = floor_name.concat("_structures_extruded");
            map.addLayer({
                'id': layer_structures_extruded_name,
                'type': 'fill-extrusion',
                'source': structures_data_source, // reference the data source
                'layout': {
                    'visibility' : "none"
                },
                'paint': {
                    'fill-extrusion-color': ['match', ['get', 'type'],
                                    'IT Services', 'transparent',
                                    'exit', 'transparent',
                                    'stairs', '#677578',
                                    'mens_bathroom', 'blue',
                                    'womens_bathroom', 'red',
                                    'accessible_bathroom', 'green',
                                    'lift', '#677578',
                                    'accessible_lift', '#677578',
                                    'grey'], 
                    'fill-extrusion-height': ['match', ['get', 'type'],
                                    'mens_bathroom', 3,
                                    'womens_bathroom', 3,
                                    'accessible_bathroom', 3,
                                    'lift', 3,
                                    'accessible_lift', 3,
                                    0
                                    ],

                    'fill-extrusion-opacity': 1,
                    'fill-extrusion-vertical-gradient' : true
                }
            });

            //layer to show the extruded rooms
            const layer_rooms_extruded_name = floor_name.concat("_rooms_extruded");
            map.addLayer({
                'id': layer_rooms_extruded_name,
                'type': 'fill-extrusion',
                'source': rooms_data_source, // reference the data source
                'layout': {
                    'visibility' : "none"
                },
                'paint': {
                    'fill-extrusion-height': 3,
                    'fill-extrusion-color': "blue",
                    'fill-extrusion-opacity': 1,
                    'fill-extrusion-vertical-gradient' : true
                },
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
                    'icon-image': 
                        ['match', ['get', 'type'],
                                'exit', 'entrance',
                                'stairs', 'rail',
                                'mens_bathroom', 'mens_toilet',
                                'womens_bathroom', 'scooter',
                                'accessible_bathroom', 'star',
                                'lift', 'village',
                                'accessible_lift', 'water',
                                ''
                        ],
                    'text-field':
                        ['match', ['get', 'type'],
                                'IT Services', 'IT Services',
                                ''
                        ],
                    //when the text overlaps, only one is displayed
                    //'text-ignore-placement' : true,
                    'icon-allow-overlap' : true,
                    'text-justify' : "center",
                    'text-size' : 12,
                    //rotation of the text can be locked
                    'text-rotation-alignment' : "viewport", 
                    //'text-rotate' : -28.55
                }
            });

            //adds layer for labels of rooms
            const layer_lables_name = floor_name.concat("_room_labels");
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
                    //'text-ignore-placement' : true,
                    'text-allow-overlap' : true,
                    'text-justify' : "center",
                    'text-size' : 12,
                    'text-max-width': 1,
                    //rotation of the text can be locked
                    'text-rotation-alignment' : "viewport", 
                    //'text-rotate' : -28.55
                },
                'paint':{
                    'text-color' : "white"
                }
            });
        }

        /* depends on the loaded data */
        setUpAfterLoadMap(map, floor_name);
    });
}

function setUpAfterLoadMap(map, floor_name){
    //set up on click event to call the php code
    setOnRoomClick(map, floor_name);
    //create search bar
    createSearchBar(map, floor_name);
    //populate room picker with data
    insertDataIntoRoomPicker(map, floor_name);

    createChangeFontColour(map);
    document.getElementById("main_div").appendChild(document.createElement('br'));
    createChangeFontSize(map)
    document.getElementById("main_div").appendChild(document.createElement('br'));
    createChangeRoomColour(map);
    document.getElementById("main_div").appendChild(document.createElement('br'));
    createToggle3DButton(map)
}

function setOnRoomClick(map, floor_name){
    //on click shows the name
    const layer_rooms_name = floor_name.concat("_rooms");
    map.on('click', layer_rooms_name, async (e) => {
        //show the timetable
        await showTimetable(e.features[0].properties.name, getWeekNumber());
    });
    //change mouse icon
    map.on('mouseenter', layer_rooms_name, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layer_rooms_name, () => {
        map.getCanvas().style.cursor = '';
    });
}

function createSearchBar(map, floor_name){
    var search_bar = document.getElementById("search_bar");
    const layer_name = floor_name.concat("_rooms_search");
    search_bar.onkeyup = function (){
        const input_text = document.getElementById("search_bar").value;
        map.getLayer(layer_name).visibility = "visible";
        if(input_text == ""){
            map.setFilter(layer_name, false);
            return;
        }
        map.setFilter(layer_name, false);
        map.setFilter(layer_name, ["in", input_text.toLowerCase(), ["downcase", ["get", "name"]]]);
    }
}

async function insertDataIntoRoomPicker(map, floor_name){
    var room_picker = document.getElementById("room_picker");
    var rooms_source = map.getSource(floor_name.concat("_label_data"));
    var list_of_features = rooms_source._data.features;

    const path_to_root = "../";
    const name_mappings = await getJsonDataFromURL(path_to_root + "data/TimetableData/mappings/map_to_db.json");
 
    var list_of_rooms = [];
    for(var f of list_of_features){
        const room_name = f.properties.name;
        // if(name_mappings[room_name] != null){
        //     list_of_rooms.push(room_name);
        // }
        if(room_name != ".") list_of_rooms.push(room_name);
    }
    list_of_rooms.push("");
    list_of_rooms.sort();

    for(var room_name of list_of_rooms){
        var room_option = document.createElement("option");
        room_option.value = room_name;
        room_option.innerHTML = room_name;
        room_picker.appendChild(room_option);
    }
}

function createMapDiv(){
    //create outer map div
    var outer_map_div = document.createElement('div');
    outer_map_div.id = "outer_map_div";

    //add search bar
    var search_bar = document.createElement('input');
    search_bar.type = "text";
    search_bar.id = "search_bar";

    var search_bar_div = document.createElement('div');
    search_bar_div.className = "filter-ctrl";
    search_bar_div.appendChild(search_bar);
    outer_map_div.appendChild(search_bar_div);

    //create div for a map
    var map_div = document.createElement("div");
    map_div.id = "map";
    outer_map_div.appendChild(map_div);

    document.getElementById("main_div").appendChild(outer_map_div);
}

function createSemesterPicker(){
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
            max_num_weeks = SEM_1_NUM_WEEKS;
        }
        else{
            max_num_weeks = SEM_2_NUM_WEEKS;
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
    week_picker.id = "week_picker";
    const max_num_weeks = SEM_1_NUM_WEEKS;
    for(var i=1; i<= max_num_weeks; i++){
        var week_num = document.createElement("option");
        week_num.value = i;
        week_num.innerHTML = i;
        week_picker.appendChild(week_num);
    }

    week_picker.onchange = async function(){
        await showTimetable(selected_room_name, getWeekNumber());
    }
    document.getElementById("main_div").appendChild(week_picker);
}

function createRoomPicker(){
    var room_picker = document.createElement("select");
    room_picker.id = "room_picker";
    document.getElementById("main_div").appendChild(room_picker);

    room_picker.onchange = async function(){
        //console.log(room_picker.value);
        await showTimetable(room_picker.value, selected_week);
    }
}

function createTimetableDiv(){
    var timetable_div = document.createElement("div");
    timetable_div.id = "timetable";
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

function createColourPicker(id, default_val){
    var colour_picker = document.createElement("input");
    colour_picker.type = "color";
    colour_picker.id = id;
    colour_picker.value = default_val;
    return colour_picker;
}

function createChangeFontColour(map){
    var colour_picker = createColourPicker("font-colour", "#ffffff");
    var font_colour_label = document.createElement("label");
    font_colour_label.innerHTML = "Change Font colour ";
    document.getElementById("main_div").appendChild(font_colour_label);
    document.getElementById("main_div").appendChild(colour_picker);
    
    const floor_name = getFloorName();
    const layer_name = floor_name.concat("_room_labels");
    colour_picker.onchange = function(){    
        map.setPaintProperty(layer_name, 'text-color', colour_picker.value);
    }
}

function createChangeFontSize(map){
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = 10;
    slider.max = 40;
    slider.value = 20;
    slider.id = "font-size";

    var font_size_label = document.createElement("label");
    font_size_label.innerHTML = "Change Font Size ";
    document.getElementById("main_div").appendChild(font_size_label);
    document.getElementById("main_div").appendChild(slider);

    const floor_name = getFloorName();
    const layer_name = floor_name.concat("_room_labels");

    slider.onchange = function(){
        map.setLayoutProperty(layer_name, 'text-size', parseInt(slider.value));
    }
}

function createChangeRoomColour(map){
    var colour_picker = createColourPicker("room-colour", "#ffffff");
    var room_colour_label = document.createElement("label");
    room_colour_label.innerHTML = "Change Room colour ";
    document.getElementById("main_div").appendChild(room_colour_label);
    document.getElementById("main_div").appendChild(colour_picker);
    
    const floor_name = getFloorName();
    const layer_name = floor_name.concat("_rooms");
    const layer_name_extruded = floor_name.concat("_rooms_extruded");
    colour_picker.onchange = function(){    
        map.setPaintProperty(layer_name, 'fill-color', colour_picker.value);
        map.setPaintProperty(layer_name_extruded, 'fill-extrusion-color', colour_picker.value);
    }
}

function createToggle3DButton(map){
    const floor_name = getFloorName();
    const room_layer_name = floor_name.concat("_rooms_extruded");
    const structure_layer_name = floor_name.concat("_structures_extruded");
    const corridors_layer_name = floor_name.concat("_corridors_extruded");

    var toggle_button = document.createElement("input");
    toggle_button.type = "checkbox";
    toggle_button.id = "toggle-3d";
    document.getElementById("main_div").appendChild(toggle_button);

    toggle_button.onclick = function(){
        if(toggle_button.checked == true){
            map.setLayoutProperty(room_layer_name, "visibility", "visible");
            map.setLayoutProperty(structure_layer_name, "visibility", "visible");
            map.setLayoutProperty(corridors_layer_name, "visibility", "visible");
        }
        else{
            map.setLayoutProperty(room_layer_name, "visibility", "none");
            map.setLayoutProperty(structure_layer_name, "visibility", "none");
            map.setLayoutProperty(corridors_layer_name, "visibility", "none");
        }
        
    }
}

function createToggleAvailabilityButton(map){
    var availability_button = document.createElement("input");
    availability_button.id = "show_availability";
    availability_button.value = "Toggle room availability";
    availability_button.type = "button";
    availability_button.onclick = toggleRoomAvailability(map);
    document.getElementById("main_div").appendChild(availability_button);

    availability_button.onclick = toggleRoomAvailability(map);
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