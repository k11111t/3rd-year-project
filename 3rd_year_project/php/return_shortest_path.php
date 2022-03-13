<?php
    $INT_MAX = 99;

    class GeoJSONObject{
        public $type;
        public $geometry;
        function __construct($nodes_array){
            $this->type = "Feature";
            $this->geometry = array();
            $this->geometry["type"] = "LineString";
            $this->geometry["coordinates"] = $nodes_array;
        }
    }
    
    main();

    function main(){
        if(!(isset($_GET["floor"]) && isset($_GET["start"]) && isset($_GET["end"]))){
            return;
        }
        //get floor name
        $floor = $_GET["floor"];
        //get start node
        $start_node = $_GET["start"];
        //get end node
        $end_node = $_GET["end"];
        try{
            $file_path = "../data/GraphsData/".$floor."/graph.json";
            $graph = loadGraphFromFile($file_path);
            $shortest_path = executeDijkstra($start_node, $end_node, $graph);
            if(empty($shortest_path)){
                echo createGeoJSONStringLineObject([]);
            }
            else{
                $coordinates_array = getCoordinatesFromPath($shortest_path, $graph);
                $mapbox_obj = createGeoJSONStringLineObject($coordinates_array);
                echo $mapbox_obj;
            }
        }catch (Exception $e){
            echo createGeoJSONStringLineObject([]);
        }
        
    }

    function loadGraphFromFile($file_path){
        if(!file_exists($file_path)){
			die("File not found");
		}

        $json_file = file_get_contents($file_path);
        $json_data = json_decode($json_file, null);

        return $json_data;
    }

    function executeDijkstra($start_node_name, $end_node_name, $graph){
        $list_of_nodes = $graph->list_of_nodes;
        
        $tentative_distances = initialiseTentativeDistances($start_node_name, $list_of_nodes);
        $predecessor_map = initialisePredecessorMap($start_node_name, $list_of_nodes);
        $finished_nodes = initialiseFinishedNodes($list_of_nodes);

        //this should be PQ
        $unfinished_nodes = array();
        array_push($unfinished_nodes, $start_node_name);

        do{
            $current_node_name = array_pop($unfinished_nodes);
            if($current_node_name == null){
                //there is no path
                return array();
            }

            if($current_node_name == $end_node_name){
                //there is path
                break;
            }

            $finished_nodes[$current_node_name] = true;

            //relaxation
            $current_node = $list_of_nodes->$current_node_name;
            $neighbours = $current_node->list_of_neighbours;
            foreach($neighbours as $neighbour_name => $distance_to_neighbour){
                $new_tentative_distance = $tentative_distances[$current_node_name] + $distance_to_neighbour;

                if(!$finished_nodes[$neighbour_name]){
                    //check if the neighbour is already in the unfinished nodes!!
                    if(!in_array($neighbour_name, $unfinished_nodes, true)){
                        array_push($unfinished_nodes, $neighbour_name);
                    }
                }

                if($tentative_distances[$neighbour_name] > $new_tentative_distance){
                    $tentative_distances[$neighbour_name] = $new_tentative_distance;
                    $predecessor_map[$neighbour_name] = $current_node_name;
                }
            }
        }
        while(!empty($unfinished_nodes));

        $path = returnPathFromPredecessorMap($start_node_name, $end_node_name, $predecessor_map);

        return $path;
    }

    function initialiseTentativeDistances($start_node_name, $list_of_nodes){
        global $INT_MAX;
        $tentative_distances = array();
        foreach($list_of_nodes as $key=>$value){
            $tentative_distances[$key] = $INT_MAX;
        }
        $tentative_distances[$start_node_name] = 0;

        return $tentative_distances;
    }

    function initialisePredecessorMap($start_node_name, $list_of_nodes){
        $predecessor_map = array();
        foreach($list_of_nodes as $key=>$value){
            $predecessor_map[$key] = null;
        }
        $predecessor_map[$start_node_name] = $start_node_name;

        return $predecessor_map;
    }

    function initialiseFinishedNodes($list_of_nodes){
        $finished_nodes = array();
        foreach($list_of_nodes as $key=>$value){
            $finished_nodes[$key] = false;
        }

        return $finished_nodes;
    }

    function returnPathFromPredecessorMap($start_node_name, $end_node_name, $predecessor_map){
        $path = array();
        array_push($path, $end_node_name);
        $current_node_name = $predecessor_map[$end_node_name];
        while($current_node_name != $start_node_name){
            array_push($path, $current_node_name);
            $current_node_name = $predecessor_map[$current_node_name];
        }
        array_push($path, $start_node_name);

        return $path;
    }   

    function getCoordinatesFromPath($path, $graph){
        $list_of_nodes = $graph->list_of_nodes;
        $coordinates_array = array();

        foreach($path as $key=>$node_name){
            $node = $list_of_nodes->$node_name;
            $lat = $node->latitude;
            $lng = $node->longitude;
            array_push($coordinates_array, [$lat, $lng]);
        }

        return $coordinates_array;
    }

    function createGeoJSONStringLineObject($nodes_array){
        $mapbox_obj = json_encode(new GeoJSONObject($nodes_array));
        return $mapbox_obj;
    }

    

?>