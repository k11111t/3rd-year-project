async function init(){  
    console.log("init start");
    
    const initial_map_attributes = {
        "lat" : 53.46750771428495,
        "lng" : -2.233885992091956,
        "rotation_angle" : -28.55,
        "zoom" : 18.9,
    }
    //html
    {
    //create menu
    createMapMenu();
    //create map div
    createMapDiv();
    }
    //hard coded room names
    var all_floor_names = ["Kilburn_2", "Kilburn_1", "Kilburn_LF", "Kilburn_G"];

    //create map
    var map = createMap(initial_map_attributes);
    //create navigation controls
    addNavigationControl(map);   
    //create reset button
    createResetPositionButton(map, initial_map_attributes);

    //load map
    await loadMap(map, all_floor_names);
}

//load file stuff

async function getJsonDataFromFile(file_path){
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

    return fetch(url)
    .then(response => {
        if(!response.ok){
            throw new Error("URL not found at, " + url);
        }
        return response.json();
    });
}

//map stuff

function createMap(initial_map_attributes){
    //sk.eyJ1IjoidmhkYW5nIiwiYSI6ImNrdzlxMjlzdjBiamwydnFsczFzcWh6NG4ifQ.Rykts7uD3lREfUElWufoQQ
    mapboxgl.accessToken = 'pk.eyJ1IjoidmhkYW5nIiwiYSI6ImNrdnllMml5ODBxd2YydXFpaGZuM3VxZGEifQ.ATaKwz3pOdOc8Xtr0n7CfA';

    var map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/vhdang/ckw9zkrqr7es315mi4atlpunw', // style URL
        center: [initial_map_attributes["lng"], initial_map_attributes["lat"]], // starting position [lng, lat]
        zoom: initial_map_attributes["zoom"], // starting zoom
        bearing: initial_map_attributes["rotation_angle"]
    });

    return map;
}

async function loadMap(map, all_floor_names){
    map.on('load', async () => {
        const path_to_root = "../";
        const dataset_ids = await getJsonDataFromFile(path_to_root + "data/MapboxAPI/dataset_ids.json");
        //load all the data
        var all_floors_geojson_data = {};
        var all_floors_rooms_centroid_data = {};
        var all_floors_corridor_data = {};
        var all_floors_structure_data = {};
        var all_floors_structures_centroid_data = {};
        //load json data
        for (const floor_name of all_floor_names){
            //load room data
            // var file_name = path_to_root.concat("data/GeoJsonData/").concat(floor_name).concat("-final.geojson");
            // all_floors_geojson_data[floor_name] = await getJsonData(file_name);
            all_floors_geojson_data[floor_name] = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_rooms")); 

            //load room centroids
            // file_name = path_to_root.concat("data/GeoJsonCentroidData/").concat(floor_name).concat("_centroids.geojson");
            // all_floors_rooms_centroid_data[floor_name] = await getJsonData(file_name);
            all_floors_rooms_centroid_data[floor_name] = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_room_centroids")); 

            //load corridors
            // file_name = path_to_root.concat("data/GeoJsonStructureData/").concat(floor_name).concat("_corridors.geojson");
            // all_floors_corridor_data[floor_name] = await getJsonData(file_name);
            all_floors_corridor_data[floor_name] = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_corridors"));

            //load structures
            // file_name = path_to_root.concat("data/GeoJsonStructureData/").concat(floor_name).concat("_structures.geojson");
            // all_floors_structure_data[floor_name] = await getJsonData(file_name);
            all_floors_structure_data[floor_name] = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_structures"));

            //load structure centroids
            // file_name = path_to_root.concat("data/GeoJsonStructureCentroidData/").concat(floor_name).concat("_structure_centroids.geojson");
            // all_floors_structures_centroid_data[floor_name] = await getJsonData(file_name);
            all_floors_structures_centroid_data[floor_name] = await getJsonDataFromCloud(dataset_ids, floor_name.concat("_structure_centroids"));
        }

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
            {
                map.addSource(room_data_source, {
                    'type': 'geojson',
                    'data': all_floors_geojson_data[floor_name]
                });

                map.addSource(room_labels_data_source, {
                    'type': 'geojson',
                    'data': all_floors_rooms_centroid_data[floor_name]
                });

                map.addSource(corridor_data_source, {
                    'type': 'geojson',
                    'data': all_floors_corridor_data[floor_name]
                });

                map.addSource(structures_data_source, {
                    'type': 'geojson',
                    'data': all_floors_structure_data[floor_name]
                });

                map.addSource(structure_label_data_source, {
                    'type': 'geojson',
                    'data': all_floors_structures_centroid_data[floor_name]
                });
            }
            
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
                        'visibility' : _visibility
                    },
                    'paint': {
                        'line-color': 'white',
                        'line-width': 3
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
                        'visibility' : _visibility
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
                        'fill-color': '#0080ff', // blue color fill
                        'fill-opacity': 0.5
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
                        'visibility': _visibility,
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
                const layer_lables_name = floor_name.concat("_room_labels");
                map.addLayer({
                    'id': layer_lables_name,
                    'type': 'symbol',
                    'source': room_labels_data_source,
                    'layout':{
                        'visibility': _visibility,
                        'text-field': ['match', ['get', 'name'],
                                        '.', '',
                                        ['get', 'name']],
                        'text-ignore-placement' : true,
                        'text-justify' : "center",
                        'text-size' : 12,
                        'text-rotation-alignment' : "map",
                        'text-rotate' : -28.5
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

function addNavigationControl(map){
    const nav = new mapboxgl.NavigationControl({
        visualizePitch: true
        });
    map.addControl(nav, "bottom-right");
}

function createResetPositionButton(map, initial_map_attributes){

    function resetPosition(){
        map.setCenter([initial_map_attributes["lng"], initial_map_attributes["lat"]]);
        map.setBearing(initial_map_attributes["rotation_angle"]);
        map.setZoom(initial_map_attributes["zoom"]);
        map.setPitch(0, 0);
    }

    const reset_button = new MapboxGLButtonControl({
        className: "mapbox-gl-draw_polygon",
        title: "Reset Position",
        eventHandler: resetPosition
      });

    map.addControl(reset_button, "bottom-right");
}

//HTML stuff

function createMapDiv(){
    var map_div = document.createElement('div');
    map_div.id = "map";
    document.getElementById("main_div").appendChild(map_div);
}

function createMapMenu(){
    var menu_nav = document.createElement('nav');
    menu_nav.id = "menu";
    menu_nav.className = "menu";
    document.getElementById("main_div").appendChild(menu_nav);
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