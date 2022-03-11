<?php
    class Node{
        public $name;
        public $longitude;
        public $latitude;
        //list of neighbours is a dictionary, where the key is the name of the neighbour and the value is the distance to it
        public $list_of_neighbours; 

        function __construct($name, $latitude, $longitude){
            $this->name = $name;
            $this->longitude = $longitude;
            $this->latitude = $latitude;
            $this->list_of_neighbours = array();
        }

        function addNeighbour($neighbour_name, $distance_to_neighbour){
            $this->list_of_neighbours[$neighbour_name]=$distance_to_neighbour;
        }
    }

    class Graph{
        //list of nodes is a dictionary, where the keys are the nodes and the values are the objects associated to the name
        public $list_of_nodes;

        function __construct(){
            $this->list_of_nodes = array();
        }

        function addNode($name, $node){
            $this->list_of_nodes[$name] = $node;
        }

        function addNodesToGraph($list_of_nodes){
            foreach($list_of_nodes as $value){
                $this->addNode($value->name, $value);
            }
        }

        function getNodeByName($name){
            return $this->list_of_nodes[$name];
        }

        function addNeighbourToNode($name, $neighbour_name, $distance){
            $this->list_of_nodes[$name]->addNeighbour($neighbour_name, $distance);
        }
    }

    main();
    
    function main(){
        $floor = "Kilburn_G";
        $graph = new Graph();      
        $graph->addNodesToGraph(getAllNodes($floor));
        setAllNeighbours($floor, $graph);

        $graph_file_path = "../data/GraphsData/".$floor."/graph.json";
        storeGraphIntoFile($graph_file_path, $graph);
        
    }

    function getAllNodes($floor_name){
        $corridor_nodes_file_path = "../data/GraphsData/".$floor_name."/corridor_nodes.geojson";
        $room_nodes_file_path = "../data/GraphsData/".$floor_name."/room_nodes.geojson";
        $corridor_nodes = getNodesFromFile($corridor_nodes_file_path);
        $room_nodes = getNodesFromFile($room_nodes_file_path);
        $all_nodes = array_merge($corridor_nodes, $room_nodes);

        return $all_nodes;
    }

    function getNodesFromFile($file_path){
        if(!file_exists($file_path)){
			die("File not found");
		}

        $json_file = file_get_contents($file_path);
        $json_data = json_decode($json_file, null);

        $features = $json_data->features;

        $list_of_nodes = array();

        foreach($features as $key=>$value){
            $feature_properties = $value->properties;
            $feature_name = $feature_properties->name;
            $feature_geometry = $value->geometry;
            $coordinates = $feature_geometry->coordinates;

            $new_node = new Node($feature_name, $coordinates[0], $coordinates[1]);
            array_push($list_of_nodes, $new_node);
        }

        return $list_of_nodes;
    }

    function setAllNeighbours($floor_name, $graph){
        $corridor_eddes_file_path = "../data/GraphsData/".$floor_name."/corridor_edges.geojson";
        $room_eddes_file_path = "../data/GraphsData/".$floor_name."/room_edges.geojson";
        addNeighboursToGraphFromFile($corridor_eddes_file_path, $graph);
        addNeighboursToGraphFromFile($room_eddes_file_path, $graph);
    }

    function addNeighboursToGraphFromFile($file_path, $graph){
        if(!file_exists($file_path)){
			die("File not found");
		}

        $json_file = file_get_contents($file_path);
        $json_data = json_decode($json_file, null);

        $features = $json_data->features;

        foreach($features as $key=>$value){
            $feature_properties = $value->properties;
            $start_node = $feature_properties->i;
            $end_node = $feature_properties->j;
            $edge_weight = $feature_properties->length;

            $graph->addNeighbourToNode($start_node, $end_node, $edge_weight);
        }
    }

    function storeGraphIntoFile($file_path, $graph){
        file_put_contents($file_path, json_encode($graph, JSON_PRETTY_PRINT));
    }

?>