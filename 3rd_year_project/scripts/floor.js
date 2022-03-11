//global variables, use with caution!
//var extruded = false;
//change these according to the year
const SEM_1_NUM_WEEKS = 13;
const SEM_2_NUM_WEEKS = 24;
//change this semester_offset according to the teaching year
//offset=number of weeks between end of semester 1 and start of semester 2
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
        "token" : "pk.eyJ1IjoidmhkYW5nIiwiYSI6ImNrdnllMml5ODBxd2YydXFpaGZuM3VxZGEifQ.ATaKwz3pOdOc8Xtr0n7CfA",
        // "south_west_bounding_box" : [ -2.234651807845978, 53.467057454528579 ],
        // "north_east_bounding_box" : [ -2.23311504310011,  53.467953309808209]
        "south_west_bounding_box" : [ -2.234137140059635, 53.467059668074938 ],
        "north_east_bounding_box" : [ -2.233617400269494, 53.467950914900705 ]
    }
    
    //create map
    var map = createMap(initial_map_attributes);
    //add navigation control - zoom, pan
    addMapButtons(map, initial_map_attributes);
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

async function getDatasetFromCloud(dataset_ids, dataset_name){
    //get dataset id
    const dataset_id = dataset_ids[dataset_name];
    if(dataset_id == null){
        console.log("id not found " + dataset_name);
        return null;
    }
    var url = "https://api.mapbox.com/datasets/v1/vhdang/"
        +dataset_id
        +"/features"
        +"?access_token="
        +mapboxgl.accessToken;
    //return dataset from cloud
    return await getJsonDataFromURL(url);
}

function getDatasetURL(dataset_ids, dataset_name){
    const dataset_id = dataset_ids[dataset_name];
    if(dataset_id == null){
        console.log("id not found " + dataset_name);
        return null;
    }
    var url = "https://api.mapbox.com/datasets/v1/vhdang/"
        +dataset_id
        +"/features"
        +"?access_token="
        +mapboxgl.accessToken;
    return url;
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

function getWeekNumber(){
    const semester_num = parseInt(document.getElementById("semester_picker").value);
    const week_num = parseInt(document.getElementById("week_picker").value);
    const real_week_num = (semester_num-1) * SEMESTER_OFFSET + week_num;
    return real_week_num;
}
function getSelectedRoom(){
    const room_picker_value = document.getElementById("room_picker").value;
    return room_picker_value;
}

async function updateTimetableContents(){
    const week_number = getWeekNumber();
    const selected_room_name = getSelectedRoom();

    //if room name is empty set the timetable to empty
    if(selected_room_name==""){
        var timetable = document.getElementById("timetable");
        timetable.innerHTML = "";
        return;
    }
    
    //find the correct name in the json file
    const path_to_root = "../";
    const name_mappings = await getJsonDataFromURL(path_to_root + "data/TimetableData/mappings/map_to_db.json");
    var db_name = name_mappings[selected_room_name];
    //if there is no mapping - no data in database about the room
    if (db_name == null){ db_name = ""; }

    //load php script
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function(){
        document.getElementById("timetable").innerHTML = this.responseText;
    }
    xhttp.open("GET", path_to_root + "php/print_timetable.php?room=" + db_name + "&week_number=" + week_number + "&room_name=" + selected_room_name);
    xhttp.send();
}

function createMap(initial_map_attributes){
    //sk.eyJ1IjoidmhkYW5nIiwiYSI6ImNrdzlxMjlzdjBiamwydnFsczFzcWh6NG4ifQ.Rykts7uD3lREfUElWufoQQ
    mapboxgl.accessToken = initial_map_attributes["token"];
    var map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/vhdang/ckw9zkrqr7es315mi4atlpunw', // style URL
    });
    map.fitBounds([initial_map_attributes["south_west_bounding_box"], initial_map_attributes["north_east_bounding_box"]], 
        {padding : -50,
         bearing : initial_map_attributes["rotation_angle"],
         pitch : 0});
    return map;
}

async function addDataSources(map, floor_name){
//get dataset ids from a file
    const path_to_root = "../";
    const dataset_ids = await getJsonDataFromURL(path_to_root + "data/MapboxAPI/dataset_ids.json");
    //load rooms polygons
    const rooms_data =  getDatasetURL(dataset_ids, floor_name.concat("_rooms"));
    //load points with labels (centroids of polygons)
    const centroid_data =  await getDatasetFromCloud(dataset_ids, floor_name.concat("_room_centroids"));
    //load corridor data
    const corridor_data =  getDatasetURL(dataset_ids, floor_name.concat("_corridors"));
    //load structure data
    const structure_data =  getDatasetURL(dataset_ids, floor_name.concat("_structures"));
    //load structure centroid data
    const structure_centroid_data =  getDatasetURL(dataset_ids, floor_name.concat("_structure_centroids"));

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
                    'icon-size': 1,
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
        map.resize();
        /* functions that depend on the loaded data */
        setUpAfterLoadMap(map);
    });
}

function setUpAfterLoadMap(map){
    //set up on click event to call the php code
    onRoomClick(map);
    //create search bar
    onKeyUpSearchBar(map);
    //populate room picker with data
    insertDataIntoRoomPickers(map);

    //set up search shortest path
    onClickFindPath(map)

    //set up side panel settings
    onChangeFontColour(map);
    onChangeFontSize(map)
    onChangeRoomColour(map);
}

function onRoomClick(map){
    //on click shows the name
    const layer_rooms_name = getFloorName().concat("_rooms");
    map.on('click', layer_rooms_name, async (e) => {
        //update the selected room
        const selected_room_name = e.features[0].properties.name;
        
        //update the room selector
        var room_picker = document.getElementById("room_picker");
        var counter = 0;
        for(var option of room_picker.options){
            if(option.value === selected_room_name){
                room_picker.selectedIndex = counter;
                break;
            }
            room_picker.selectedIndex = 0;
            counter++;
        }

        //show the timetable
        await updateTimetableContents();
    });

    //change mouse icon
    map.on('mouseenter', layer_rooms_name, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layer_rooms_name, () => {
        map.getCanvas().style.cursor = '';
    });
}

function onKeyUpSearchBar(map){
    var search_bar = document.getElementById("search_bar");
    const layer_name = getFloorName().concat("_rooms_search");
    search_bar.onkeyup = function (){
        const input_text = search_bar.value;
        map.getLayer(layer_name).visibility = "visible";
        if(input_text == ""){
            map.setFilter(layer_name, false);
            return;
        }
        map.setFilter(layer_name, false);
        map.setFilter(layer_name, ["in", input_text.toLowerCase(), ["downcase", ["get", "name"]]]);
    }
}

async function insertDataIntoRoomPickers(map){
    var room_picker = document.getElementById("room_picker");
    var start_room_picker = document.getElementById("start_position");
    var end_room_picker = document.getElementById("end_position");

    var rooms_source = map.getSource(getFloorName().concat("_label_data"));
    var list_of_features = rooms_source._data.features;
 
    var list_of_rooms = [];
    for(var f of list_of_features){
        const room_name = f.properties.name;
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

    for(var room_name of list_of_rooms){
        var room_option = document.createElement("option");
        room_option.value = room_name;
        room_option.innerHTML = room_name;
        start_room_picker.appendChild(room_option);
    }

    for(var room_name of list_of_rooms){
        var room_option = document.createElement("option");
        room_option.value = room_name;
        room_option.innerHTML = room_name;
        end_room_picker.appendChild(room_option);
    }
}

function onLoadWeekPicker(){
    var week_picker = document.getElementById("week_picker");
    for(var i=1; i<= SEM_1_NUM_WEEKS; i++){
        var week_num = document.createElement("option");
        week_num.value = i;
        week_num.innerHTML = "week " + i;
        week_picker.appendChild(week_num);
    }
}

async function onChangeSemesterPicker(){
    var semester_picker = document.getElementById("semester_picker");
    var max_num_weeks = 0;
    if(parseInt(semester_picker.value) == 1){
        max_num_weeks = SEM_1_NUM_WEEKS;
    }
    else if(parseInt(semester_picker.value) == 2){
        max_num_weeks = SEM_2_NUM_WEEKS;
    }

    //change the contents of week picker
    var week_picker = document.getElementById("week_picker");
    week_picker.innerHTML = "";
    for(var i=1; i<= max_num_weeks; i++){
        var week_num = document.createElement("option");
        week_num.value = i;
        week_num.innerHTML = "week " + i;
        week_picker.appendChild(week_num);
    }
    //show timetable
    await updateTimetableContents();
}

async function onChangeWeekPicker(){
    await updateTimetableContents();
}

async function onChangeRoomPicker(){
    await updateTimetableContents();
}

function addMapButtons(map, initial_map_attributes){
    const buttons_position = "top-left";
    addFullscreenButton(map, buttons_position);
    addNavigationControl(map, buttons_position);
    addResetPositionButton(map, buttons_position, initial_map_attributes);
    addToggle3DViewButton(map, buttons_position);
}

function addFullscreenButton(map, buttons_position){
    map.addControl(new mapboxgl.FullscreenControl(), buttons_position);
}

function addNavigationControl(map, buttons_position){
    const nav = new mapboxgl.NavigationControl({
        visualizePitch: true
        });
    map.addControl(nav, buttons_position);
}

function addResetPositionButton(map, buttons_position, initial_map_attributes){
    function resetPosition(){
        map.fitBounds([initial_map_attributes["south_west_bounding_box"], initial_map_attributes["north_east_bounding_box"]], 
        {padding: -50,
         bearing : initial_map_attributes["rotation_angle"],
         pitch : 0});
    }
    const reset_button = new MapboxMapButtonControl({
        icon: '<i class="bi bi-arrow-counterclockwise"></i>',
        title: "Reset Position",
        eventHandler: resetPosition
      });

    map.addControl(reset_button, buttons_position);
}

function addToggle3DViewButton(map, buttons_position){
    var extruded = false;
    function toggle3D(){
        extruded = !extruded;
        const floor_name = getFloorName();
        const room_layer_name = floor_name.concat("_rooms_extruded");
        const structure_layer_name = floor_name.concat("_structures_extruded");
        const corridors_layer_name = floor_name.concat("_corridors_extruded");

        if(extruded == true){
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
    var toggle_3D_button = new MapboxMapButtonControl({
        icon: '3D',
        title: "Toggle 3D",
        eventHandler: toggle3D
    });
    map.addControl(toggle_3D_button, buttons_position);
}

function onChangeFontColour(map){
    var colour_picker = document.getElementById("font_colour");
    const floor_name = getFloorName();
    const layer_name = floor_name.concat("_room_labels");
    colour_picker.onchange = function(){    
        map.setPaintProperty(layer_name, 'text-color', colour_picker.value);
    }
}

function onChangeFontSize(map){
    var font_size_slider = document.getElementById("font_size");
    const floor_name = getFloorName();
    const layer_name = floor_name.concat("_room_labels");
    font_size_slider.onchange = function(){
        map.setLayoutProperty(layer_name, 'text-size', parseInt(font_size_slider.value));
    }
}

function onChangeRoomColour(map){
    var colour_picker = document.getElementById("room_colour");
    const floor_name = getFloorName();
    const layer_name = floor_name.concat("_rooms");
    const layer_name_extruded = floor_name.concat("_rooms_extruded");
    colour_picker.onchange = function(){    
        map.setPaintProperty(layer_name, 'fill-color', colour_picker.value);
        map.setPaintProperty(layer_name_extruded, 'fill-extrusion-color', colour_picker.value);
    }
}

function onClickFindPath(map){
    //get floor name
    const find_path_button = document.getElementById("find_path");
    find_path_button.onclick = function(){
        //send request to PHP - with the 2 inputs
        getShortestPath(map);
    }
}

function getShortestPath(map){
    const floor_name = getFloorName();
    const start_node = document.getElementById("start_position").value;
    const end_node = document.getElementById("end_position").value;
    const path_to_root= "../"

    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = function() {
      const geojson_obj = JSON.parse(this.responseText);
      drawPath(map, geojson_obj);
    }
    xmlhttp.open("GET", path_to_root + "php/return_shortest_path.php?floor="+floor_name+ "&start=" + start_node + "&end=" + end_node);
    xmlhttp.send();
    
}

function drawPath(map, geojson_input){
    const floor_name = getFloorName();
    const search_layer_name = floor_name.concat("_search");
    const source_name = search_layer_name.concat("_source");

    if(map.getLayer(search_layer_name) != null){
        map.removeLayer(search_layer_name);
    }
    if(map.getSource(source_name) == null){
        map.addSource(source_name, {
            'type': 'geojson',
            'data': geojson_input
        });
    }
    else{
        map.getSource(source_name).setData(geojson_input);
    }
    

    
    map.addLayer({
        'id': search_layer_name,
        'type': 'line',
        'source': source_name, // reference the data source
        'layout': {
            'visibility' : "visible",
            'line-join' : "round",
        },
        'paint': {
            'line-color': "green",
            'line-width': 3
        }
    });
}

class MapboxMapButtonControl {
    constructor({
      icon = "",
      title = "",
      eventHandler = evtHndlr
    }) {
      this._icon = icon;
      this._title = title;
      this._eventHandler = eventHandler;
    }
  
    onAdd(map) {
        this.map = map;
        this._btn = document.createElement("button");
        this._btn.type = "button";
        this._btn.innerHTML = this._icon;
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