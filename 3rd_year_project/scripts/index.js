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
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
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
        map.on("idle", async () => {
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

                const rooms_data_source = floor_name.concat("_room_data");
                const room_labels_data_source = floor_name.concat("_label_data");
                const corridor_data_source = floor_name.concat("_corridor_data");
                const structures_data_source = floor_name.concat("_structure_data");
                const structure_label_data_source = floor_name.concat("_structure_label_data");

                if(map.getSource(rooms_data_source) == null){
                    map.addSource(rooms_data_source, {
                        'type': 'geojson',
                        'data': rooms_url
                    });
                }
                
                if(map.getSource(room_labels_data_source) == null){
                    map.addSource(room_labels_data_source, {
                        'type': 'geojson',
                        'data': rooms_centroid_url
                    });
                }

                if(map.getSource(corridor_data_source) == null){
                    map.addSource(corridor_data_source, {
                        'type': 'geojson',
                        'data': corridors_url
                    });
                }

                if(map.getSource(structures_data_source) == null){
                    map.addSource(structures_data_source, {
                        'type': 'geojson',
                        'data': structures_url
                    });
                }

                if(map.getSource(structure_label_data_source) == null){
                    map.addSource(structure_label_data_source, {
                        'type': 'geojson',
                        'data': structures_centroid_url
                    });
                }
            }
        });
        loadMap(map, all_floor_names);
    });
}

function loadMap(map, all_floor_names){
    map.on('sourcedata', async () => {
        //set to the first layer - inital value

        //add layers for each floor
        var ready_state = true;

        for (const floor_name of all_floor_names){
            var _visibility = "none";
            if(floor_name == all_floor_names[0]){
                _visibility = "visible";
            }            
            
            //Kilburn_G_polygon_data - stores the GeoJSON data about the polygons
            const rooms_data_source = floor_name.concat("_room_data");
            const room_labels_data_source = floor_name.concat("_label_data");
            const corridor_data_source = floor_name.concat("_corridor_data");
            const structures_data_source = floor_name.concat("_structure_data");
            const structure_label_data_source = floor_name.concat("_structure_label_data");

            if (!((map.getSource(rooms_data_source) && map.isSourceLoaded(rooms_data_source)) &&
                (map.getSource(room_labels_data_source) && map.isSourceLoaded(room_labels_data_source)) &&
                (map.getSource(corridor_data_source) && map.isSourceLoaded(corridor_data_source)) &&
                (map.getSource(structures_data_source) && map.isSourceLoaded(structures_data_source)) &&
                (map.getSource(structure_label_data_source) && map.isSourceLoaded(structure_label_data_source)
                ))){
                    //console.log("source not loaded");
                    continue;
                }
            
            //add layer for corridors
            {
                const layer_corridors_name = floor_name.concat("_corridors");
                if(map.getLayer(layer_corridors_name) == null){
                    map.addLayer({
                        'id': layer_corridors_name,
                        'type': 'fill',
                        'source': corridor_data_source, // reference the data source
                        'layout': {
                            'visibility' : _visibility
                        },
                        'paint': {
                            'fill-color': ['match', ['get', 'type'],
                                            'corridor', '#A9A9A9',
                                            'wall', '#484848',
                                            '#484848'], 
                            'fill-opacity': ['match', ['get', 'type'],
                            'roof', 0.5,
                            1
                        ]
                        }
                    });
                }else{
                    ready_state = false;
                }
                
                //add layer for corridor outlines
                const layer_corridors_lines_name = floor_name.concat("_corridor_outlines");
                if(map.getLayer(layer_corridors_lines_name) == null){
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
                }else{
                    ready_state = false;
                }
            }

            //add layer for structures
            {
                const layer_structures_name = floor_name.concat("_structures");
                if(map.getLayer(layer_structures_name) == null){
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
                                            '#696969'], 
                            'fill-opacity': 1
                        }
                    });
                }else{
                    ready_state = false;
                }

                //adds layer for outline of structures
                const layer_structures_lines_name = floor_name.concat("_structure_outlines");
                if(map.getLayer(layer_structures_lines_name) == null){
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
                }else{
                    ready_state = false;
                }
            }

            //add layer for rooms
            {
                const layer_rooms_name = floor_name.concat("_rooms");
                if(map.getLayer(layer_rooms_name) == null){
                    map.addLayer({
                        'id': layer_rooms_name,
                        'type': 'fill',
                        'source': rooms_data_source, // reference the data source
                        'layout': {
                            'visibility' : _visibility
                        },
                        'paint': {
                            'fill-color': '#660099', 
                            
                            'fill-opacity': ['match', ['get', 'name'],
                                        'Courtyard', 0.8,
                                        1
                                        ]
                        }
                    });
                }else{
                    ready_state = false;
                }

                //adds layer for outline around the rooms
                const layer_rooms_lines_name = floor_name.concat("_room_outlines");
                if(map.getLayer(layer_rooms_lines_name) == null){
                    map.addLayer({
                        'id': layer_rooms_lines_name,
                        'type': 'line',
                        'source': rooms_data_source,
                        'layout': {
                            'visibility' : _visibility
                        },
                        'paint': {
                            'line-color': '#FFFFFF',
                            'line-width': 2
                        }
                    });
                }else{
                    ready_state = false;
                }
            }

            //add layer for labels and icons
            {
                //adds layer for labels of structures
                const layer_structures_labels_name = floor_name.concat("_structure_labels");
                if(map.getLayer(layer_structures_labels_name) == null){
                    map.addLayer({
                        'id': layer_structures_labels_name,
                        'type': 'symbol',
                        'source': structure_label_data_source,
                        'layout':{
                            'visibility': _visibility ,
                            'icon-image': 
                                ['match', ['get', 'type'],
                                        'exit', 'big-exit',
                                        'stairs', 'big-stairs-2',
                                        'mens_bathroom', 'big-mens-toilet',
                                        'womens_bathroom', 'big-womens-toilet',
                                        'accessible_bathroom', 'big-accessible-toilet',
                                        'lift', 'big-lift',
                                        'accessible_lift', 'big-accessible-lift',
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
                }else{
                    ready_state = false;
                }

                //adds layer for labels of rooms
                const layer_lables_name = floor_name.concat("_room_labels");
                if(map.getLayer(layer_lables_name) == null){
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
                }else{
                    ready_state = false;
                }
            }
            //visible_layer = floor_name;
        }
    });

    map.on("idle", ()=>{
        for(var flr_name of all_floor_names){
            if(map.getLayer(flr_name.concat("_rooms")) == null){
                return;
            }
        }

        setUpAfterLoadMap(map, all_floor_names); 
    });
}

function setUpAfterLoadMap(map, all_floor_names){
    addMapMenuButtons(map, all_floor_names);
    onChangeFontColour(map, all_floor_names);
    onChangeFontSize(map, all_floor_names);
    onChangeRoomColour(map, all_floor_names);
    onChangeIconSize(map, all_floor_names);
    onChangeFontBoldness(map, all_floor_names);
    onResetSettings();
}

function addMapMenuButtons(map, all_floor_names){
    //console.log("add Map menu buttons called");
    //map.on('idle', () => {
        //check if layers were added
        //make buttons, skip if they already exist, this should run only once at the loading of the page
        for(const id of all_floor_names){
            if(map.getLayer(id.concat("_rooms")) == null) {
                //wait here
                //console.log("there is no layer", id)
                continue;
                //throw new Error("Map layers not loaded");
            }
            //check if buttons already exist
            if (document.getElementById(id) != null) {
                //console.log("there is already a button", id)
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

            console.log("on click set for ", id);
            // Show or hide layer when the toggle is clicked.
            link.onclick = function (e) {
                //_layer, outline, labels
                const chosen_layer = this.id;
                // e.preventDefault();
                // e.stopPropagation();
                
                const visibility = 
                    map.getLayoutProperty(
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
    //});
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

function onChangeIconSize(map, all_floor_names){
    var icon_size_slider = document.getElementById("icon_size");
    
    icon_size_slider.onchange = function(){
        for(const floor_name of all_floor_names){
            const layer_name = floor_name.concat("_structure_labels");
            map.setLayoutProperty(layer_name, 'icon-size', parseInt(icon_size_slider.value)/10);
        }
        
    }
}

function onChangeFontBoldness(map, all_floor_names){
    var font_boldness_slider = document.getElementById("font_boldness");

    font_boldness_slider.onchange = function(){
        //values from 0 to 2
        var font = ["Open Sans Regular","Arial Unicode MS Regular"]
        switch(parseInt(font_boldness_slider.value)){
            case 0: font = ["Open Sans Regular","Arial Unicode MS Regular"]
            break;
            case 1: font = ["Open Sans Semibold","Arial Unicode MS Regular"]
            break;
            case 2: font = ["Open Sans Bold","Arial Unicode MS Regular"]
            break;
        }

        for(const floor_name of all_floor_names){
            const layer_name = floor_name.concat("_room_labels");
            map.setLayoutProperty(layer_name, 'text-font', font);
        }
        
    }
}

function onResetSettings(){
    document.getElementById("reset_settings").onclick = function(){
        var colour_picker = document.getElementById("font_colour");
        colour_picker.value = "#ffffff";
        colour_picker.onchange();
        var font_size_slider = document.getElementById("font_size");
        font_size_slider.value = 12;
        font_size_slider.onchange();
        var icon_size_slider = document.getElementById("icon_size");
        icon_size_slider.value = 4;
        icon_size_slider.onchange();
        var room_colour_picker = document.getElementById("room_colour");
        room_colour_picker.value = "#660099";
        room_colour_picker.onchange();
        var font_boldness_picker = document.getElementById("font_boldness");
        font_boldness_picker.value = 0;
        font_boldness_picker.onchange();
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