<?php
    namespace App\PHP;
    
    include_once "Node.php";

    use \App\PHP\Node as Node;
    

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

    class Dijkstra{
        public $start_node_name;
        public $end_node_name;
        
        public $graph;
        public $list_of_nodes;

        public $tentative_distances;
        public $predecessor_map;
        public $finished_nodes;
        public $unfinished_nodes;

        function __construct($start_node, $end_node, $graph){
            //in case user passes in Graph class
            $graph = json_decode(json_encode($graph));
            $this->start_node_name = $start_node;
            $this->end_node_name = $end_node;
            $this->graph = $graph;
            $this->list_of_nodes = $graph->list_of_nodes;

            $this->tentative_distances = self::initialiseTentativeDistances($this->start_node_name, $this->list_of_nodes);
            $this->predecessor_map = self::initialisePredecessorMap($this->start_node_name, $this->list_of_nodes);
            $this->finished_nodes = self::initialiseFinishedNodes($this->list_of_nodes);
            $this->unfinished_nodes = array();
        }

        //dont test
        static function returnGraphFromFile($file_path){
            if(!file_exists($file_path)){
                //file not found
                //echo "File not found at: " . $file_path;
                die(self::createGeoJSONStringLineObject([]));
            }
    
            $json_file = file_get_contents($file_path);
            $json_data = json_decode($json_file, null);
    
            return $json_data;
        }

        function executeDijkstra(){
            //this should be PQ
            
            array_push($this->unfinished_nodes, $this->start_node_name);
    
            do{
                $current_node_name = array_pop($this->unfinished_nodes);
                if($current_node_name == null){
                    //there is no path
                    return [];
                }
    
                // //include this only when there is PQ implementation
                // if($current_node_name == $end_node_name){
                //     //there is path
                //     break;
                // }
    
                $this->finished_nodes[$current_node_name] = true;
                $this->relaxFromNode($current_node_name);
            }
            while(!empty($this->unfinished_nodes));
    
            $path = $this->returnPathFromPredecessorMap($this->start_node_name, $this->end_node_name, $this->predecessor_map);
    
            return $path;
        }

        function relaxFromNode($current_node_name){
            //relaxation
            $current_node = $this->list_of_nodes->$current_node_name;
            //print_r($current_node);
            $neighbours = $current_node->list_of_neighbours;
            foreach($neighbours as $neighbour_name => $distance_to_neighbour){
                $new_tentative_distance = $this->tentative_distances[$current_node_name] + $distance_to_neighbour;

                if(!$this->finished_nodes[$neighbour_name]){
                    //check if the neighbour is already in the unfinished nodes!!
                    if(!in_array($neighbour_name, $this->unfinished_nodes, true)){
                        array_push($this->unfinished_nodes, $neighbour_name);
                    }
                }
                if($this->tentative_distances[$neighbour_name] > $new_tentative_distance){
                    $this->tentative_distances[$neighbour_name] = $new_tentative_distance;
                    $this->predecessor_map[$neighbour_name] = $current_node_name;
                }
            }
        }

        static function initialiseTentativeDistances($start_node_name, $list_of_nodes){
            $tentative_distances = array();
            foreach($list_of_nodes as $key=>$value){
                $tentative_distances[$key] = Node::$INT_MAX;
            }
            $tentative_distances[$start_node_name] = 0;
    
            return $tentative_distances;
        }

        static function initialisePredecessorMap($start_node_name, $list_of_nodes){
            $predecessor_map = array();
            foreach($list_of_nodes as $key=>$value){
                $predecessor_map[$key] = null;
            }
            $predecessor_map[$start_node_name] = $start_node_name;
    
            return $predecessor_map;
        }

        static function initialiseFinishedNodes($list_of_nodes){
            $finished_nodes = array();
            foreach($list_of_nodes as $key=>$value){
                $finished_nodes[$key] = false;
            }
    
            return $finished_nodes;
        }

        static function returnPathFromPredecessorMap($start_node_name, $end_node_name, $predecessor_map){
            $path = array();
            array_push($path, $end_node_name);
            $current_node_name = $predecessor_map[$end_node_name];
            while($current_node_name != $start_node_name){
                if(in_array($current_node_name, $path)){
                    //there is cycle
                    return [];
                }
                if($current_node_name == null){
                    //there is no path
                    return [];
                }
                array_push($path, $current_node_name);
                $current_node_name = $predecessor_map[$current_node_name];
            }
            array_push($path, $start_node_name);
    
            return $path;
        }  

        //dont test this
        function getCoordinatesFromPath($path){
            $coordinates_array = array();
    
            foreach($path as $key=>$node_name){
                $node = $this->list_of_nodes->$node_name;
                $lat = $node->latitude;
                $lng = $node->longitude;
                array_push($coordinates_array, [$lat, $lng]);
            }
    
            return $coordinates_array;
        }

        static function createGeoJSONStringLineObject($nodes_array){
            $mapbox_obj = json_encode(new GeoJSONObject($nodes_array));
            return $mapbox_obj;
        }
    }

?>