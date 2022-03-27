async function init(){    
    const initial_map_attributes = {
        "lat" : 53.46750771428495,
        "lng" : -2.233885992091956,
        "rotation_angle" : -28.55,
        "zoom" : 18.8,
        "token" : "pk.eyJ1IjoidmhkYW5nIiwiYSI6ImNrdnllMml5ODBxd2YydXFpaGZuM3VxZGEifQ.ATaKwz3pOdOc8Xtr0n7CfA",
        "south_west_bounding_box" : [ -2.234137140059635, 53.467059668074938 ],
        "north_east_bounding_box" : [ -2.233617400269494, 53.467950914900705 ]
    }

    //hard coded room names
    var all_floor_names = ["Kilburn_2", "Kilburn_1", "Kilburn_LF", "Kilburn_G"];

    //create map
    var map = createMap(initial_map_attributes);

    addMapButtons(map, initial_map_attributes);

    //load map
    await loadEverything(map, all_floor_names);
}

//load file stuff

async function getJsonDataFromURL(file_path){
    return fetch(file_path)
    .then(response => {
        if(!response.ok){
            throw new Error("File not found at " + file_path);
        }
        return response.json();
    });
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

    return getJsonDataFromURL(url);
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

//map stuff
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

function addMapButtons(map, initial_map_attributes){
    const buttons_position = "top-left";
    addFullscreenButton(map, buttons_position);
    addNavigationControl(map, buttons_position);
    addResetPositionButton(map, buttons_position, initial_map_attributes);
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

async function getMapboxEncoding(floor_name, func){
    const path_to_root = "../";
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = function() {
        var mapbox_encodings = this.responseText;
        //console.log("json:", mapbox_encodings);
        mapbox_encodings = JSON.parse(mapbox_encodings);
        func(mapbox_encodings);
    }
    xmlhttp.open("GET", path_to_root + "php/return_mapbox_encodings.php?floor_name="+floor_name);
    xmlhttp.send();
}

async function loadEverything(map, all_floor_names){
    //const path_to_root = "../";
    //const dataset_ids = await getJsonDataFromURL(path_to_root + "data/MapboxAPI/dataset_ids.json");
    await getMapboxEncoding("all", async function(dataset_ids){
        map.on("style.load", async () => {

        
    for (const floor_name of all_floor_names){
        //load room data URL
        const rooms_url = getDatasetURL(dataset_ids, floor_name.concat("_rooms")); 
        //load room centroids URL
        const rooms_centroid_url = getDatasetURL(dataset_ids, floor_name.concat("_room_centroids")); 
        //load corridors URL
        const corridors_url = getDatasetURL(dataset_ids, floor_name.concat("_corridors"));
        //load structures URL
        const structures_url = getDatasetURL(dataset_ids, floor_name.concat("_structures"));
        //load structure centroids URL
        const structures_centroid_url = getDatasetURL(dataset_ids, floor_name.concat("_structure_centroids"));

        const room_data_source = floor_name.concat("_room_data");
        const room_labels_data_source = floor_name.concat("_label_data");
        const corridor_data_source = floor_name.concat("_corridor_data");
        const structures_data_source = floor_name.concat("_structure_data");
        const structure_label_data_source = floor_name.concat("_structure_label_data");

        map.addSource(room_data_source, {
            'type': 'geojson',
            'data': rooms_url
        });

        map.addSource(room_labels_data_source, {
            'type': 'geojson',
            'data': rooms_centroid_url
        });

        map.addSource(corridor_data_source, {
            'type': 'geojson',
            'data': corridors_url
        });

        map.addSource(structures_data_source, {
            'type': 'geojson',
            'data': structures_url
        });

        map.addSource(structure_label_data_source, {
            'type': 'geojson',
            'data': structures_centroid_url
        });
    }
    });
    await loadMap(map, all_floor_names);
    });
}

async function loadMap(map, all_floor_names){
    map.on('load', async () => {
        //set to the first layer - inital value
        var _visibility = "visible";
        //add layers for each floor
        for (const floor_name of all_floor_names){
            //Kilburn_G_polygon_data - stores the GeoJSON data about the polygons
            const room_data_source = floor_name.concat("_room_data");
            const room_labels_data_source = floor_name.concat("_label_data");
            const corridor_data_source = floor_name.concat("_corridor_data");
            const structures_data_source = floor_name.concat("_structure_data");
            const structure_label_data_source = floor_name.concat("_structure_label_data");
            
            //add layer for corridors
            {
                const layer_corridors_name = floor_name.concat("_corridors");
                map.addLayer({
                    'id': layer_corridors_name,
                    'type': 'fill',
                    'source': corridor_data_source, // reference the data source
                    'layout': {
                        'visibility' : _visibility
                    },
                    'paint': {
                        'fill-color': ['match', ['get', 'type'],
                                        'corridor', '#808080',
                                        'wall', '#282828',
                                        '#282828'], 
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
                        'visibility' : _visibility
                    },
                    'paint': {
                        'line-color': 'white',
                        'line-width': 2
                    }
                });
            }

            //add layer for structures
            {
                const layer_structures_name = floor_name.concat("_structures");
                map.addLayer({
                    'id': layer_structures_name,
                    'type': 'fill',
                    'source': structures_data_source, // reference the data source
                    'layout': {
                        'visibility' : _visibility
                    },
                    'paint': {
                        'fill-color': ['match', ['get', 'type'],
                                        'IT Services', 'transparent',
                                        'exit', 'transparent',
                                        '#404040'], 
                        'fill-opacity': 1
                    }
                });

                //adds layer for outline of structures
                const layer_structures_lines_name = floor_name.concat("_structure_outlines");
                map.addLayer({
                    'id': layer_structures_lines_name,
                    'type': 'line',
                    'source': structures_data_source,
                    'layout': {
                        'visibility' : _visibility
                    },
                    'paint': {
                        'line-color': ['match', ['get', 'type'],
                                        'IT Services', 'transparent',
                                        'exit', ' transparent',
                                        'white'],
                        'line-width': 2
                    }
                });
            }

            //add layer for rooms
            {
                const layer_rooms_name = floor_name.concat("_rooms");
                map.addLayer({
                    'id': layer_rooms_name,
                    'type': 'fill',
                    'source': room_data_source, // reference the data source
                    'layout': {
                        'visibility' : _visibility
                    },
                    'paint': {
                        'fill-color': '#660099', 
                        'fill-opacity': 1
                    }
                });

                //adds layer for outline around the rooms
                const layer_rooms_lines_name = floor_name.concat("_room_outlines");
                map.addLayer({
                    'id': layer_rooms_lines_name,
                    'type': 'line',
                    'source': room_data_source,
                    'layout': {
                        'visibility' : _visibility
                    },
                    'paint': {
                        'line-color': '#FFFFFF',
                        'line-width': 2
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
                        'visibility': _visibility ,
                        'icon-image': 
                            ['match', ['get', 'type'],
                                    'exit', 'big-exit',
                                    'stairs', 'big-stairs',
                                    'mens_bathroom', 'big-mens-toilet',
                                    'womens_bathroom', 'big-womens-toilet',
                                    'accessible_bathroom', 'big-accessible-toilet',
                                    'lift', 'big-elevator',
                                    'accessible_lift', 'big-elevator',
                                    ''
                            ],
                        'icon-size': 0.4,
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
                    },
                    "paint":{
                        "icon-color" : "white" ,
                        "text-color" : "white"
                    }
                });

                //adds layer for labels of rooms
                const layer_lables_name = floor_name.concat("_room_labels");
                map.addLayer({
                    'id': layer_lables_name,
                    'type': 'symbol',
                    'source': room_labels_data_source,
                    'layout':{
                        'visibility': _visibility ,
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

            _visibility = "none";
            //visible_layer = floor_name;
        }

        setUpAfterLoadMap(map, all_floor_names);
    });
}

function setUpAfterLoadMap(map, all_floor_names){
    addMapMenuButtons(map, all_floor_names);
    onChangeFontColour(map, all_floor_names);
    onChangeFontSize(map, all_floor_names);
    onChangeRoomColour(map, all_floor_names);
}

function addMapMenuButtons(map, all_floor_names){
    map.on('idle', () => {
        //check if layers were added
        //make buttons, skip if they already exist, this should run only once at the loading of the page
        for(const id of all_floor_names){
            if(map.getLayer(id.concat("_rooms")) == null) {
                //wait here
                throw new Error("Map layers not loaded");
            }
            //check if buttons already exist
            if (document.getElementById(id)) {
                continue;
            }
            
            //create buttons
            const link = document.createElement('a');
            link.id = id;
            link.href = '#';
            link.textContent = id.replace("_", " ");
            link.className = '';
            //hard code for Kilburn_2
            if(link.id === all_floor_names[0]){
                link.className = "active";
            }

            // Show or hide layer when the toggle is clicked.
            link.onclick = function (e) {
                //_layer, outline, labels
                const chosen_layer = this.id;
                // e.preventDefault();
                // e.stopPropagation();
                
                const visibility = map.getLayoutProperty(
                    chosen_layer.concat("_rooms"),
                    'visibility'
                );
                
                // Toggle layer visibility by changing the layout object's visibility property.
                //if the layer is visible, do nothing
                if (visibility === 'visible') {
                    //do nothing
                    this.className = 'active';
                //if the layer is not visible, set other floors to invisible and set itself to visible
                } else {
                    for(const other_floor of all_floor_names){
                        setVisibility(map, other_floor, "none");
                        const other_button = document.getElementById(other_floor);
                        other_button.className = '';
                    }
                    this.className = 'active';
                    setVisibility(map, chosen_layer, "visible");
                }
            };
            const map_menu = document.getElementById('menu');
            map_menu.appendChild(link);
        }
    });
}

function setVisibility(map, layer_name, visibility){
    map.setLayoutProperty(layer_name.concat("_corridors"), 'visibility', visibility);
    map.setLayoutProperty(layer_name.concat("_corridor_outlines"), 'visibility', visibility);
    map.setLayoutProperty(layer_name.concat("_structures"), 'visibility', visibility);
    map.setLayoutProperty(layer_name.concat("_structure_outlines"), 'visibility', visibility);
    map.setLayoutProperty(layer_name.concat("_rooms"), 'visibility', visibility);
    map.setLayoutProperty(layer_name.concat("_room_outlines"), 'visibility', visibility);
    map.setLayoutProperty(layer_name.concat("_structure_labels"), 'visibility', visibility);
    map.setLayoutProperty(layer_name.concat("_room_labels"), 'visibility', visibility);
}

function onChangeFontColour(map, all_floor_names){
    var colour_picker = document.getElementById("font_colour");
    
    colour_picker.onchange = function(){
        for(const floor_name of all_floor_names){
            const layer_name = floor_name.concat("_room_labels");
            map.setPaintProperty(layer_name, 'text-color', colour_picker.value);
        }
    }
}

function onChangeFontSize(map, all_floor_names){
    var font_size_slider = document.getElementById("font_size");
    
    font_size_slider.onchange = function(){
        for(const floor_name of all_floor_names){
            const layer_name = floor_name.concat("_room_labels");
            map.setLayoutProperty(layer_name, 'text-size', parseInt(font_size_slider.value));
        }
        
    }
}

function onChangeRoomColour(map, all_floor_names){
    var colour_picker = document.getElementById("room_colour");
    
    colour_picker.onchange = function(){
        for(const floor_name of all_floor_names){
            const layer_name = floor_name.concat("_rooms");
            map.setPaintProperty(layer_name, 'fill-color', colour_picker.value);
        }
    }
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