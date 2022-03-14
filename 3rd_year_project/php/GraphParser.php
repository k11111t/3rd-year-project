<?php
    namespace App\PHP;

    include_once "Node.php";
    include_once "Graph.php";

    use \App\PHP\Node as Node;
    use \App\PHP\Graph as Graph;
    
    class GraphParser{
        public $floor_name;
        public $path;

        function __construct(){
        }

        function setFloorName($new_floor_name){
            $this->floor_name = $new_floor_name;
        }

        function getFloorName(){
            return $this->floor_name;
        }

        function setPath($path){
            $this->path = $path;
        }

        function getPath(){
            return $this->path;
        }

        //dont test
        function setUpGraphFromFile($floor_name, $path){
            $this->floor_name = $floor_name;
            $this->path = $path;

            $all_nodes = $this->getAllNodes($this->floor_name);
            $graph = new Graph();
            $graph->addMultipleNodesToGraph($all_nodes);
            $this->setAllNeighbours($this->floor_name, $graph);

            return $graph;
        }

        //dont test
        function getAllNodes($floor_name){
            $failure = false;
            $corridor_nodes_file_path = $this->path.$floor_name."/corridor_nodes.geojson";
            $room_nodes_file_path = $this->path.$floor_name."/room_nodes.geojson";

            $corridor_nodes_file = file_get_contents($corridor_nodes_file_path);
            if($corridor_nodes_file != false){
                $corridor_nodes = self::getNodesFromFileContents($corridor_nodes_file);
            }
            else{
                echo "Failed to get nodes, File not found at: " . $corridor_nodes_file_path;
                $failure = true;
            }

            $room_nodes_file = file_get_contents($room_nodes_file_path);
            if($room_nodes_file != false){
                $room_nodes = self::getNodesFromFileContents($room_nodes_file);
            }
            else{
                echo "Failed to get nodes, File not found at: " . $room_nodes_file_path;
                $failure = true;
            }
        
            if($failure == true){
                return [];
            }
            $all_nodes = array_merge($corridor_nodes, $room_nodes);
            return $all_nodes;
        }

        static function getNodesFromFileContents($file_contents){
            $json_data = json_decode($file_contents, null);

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

        //dont test
        function setAllNeighbours($floor_name, $graph){
            $corridor_eddes_file_path = $this->path.$floor_name."/corridor_edges.geojson";
            $room_edges_file_path = $this->path.$floor_name."/room_edges.geojson";

            if($corridor_eddes_file = file_get_contents($corridor_eddes_file_path)){
                self::addNeighboursToGraphFromFile($corridor_eddes_file, $graph);
            }
            else{
                echo("Failed to set neighbours, File not found at: " . $corridor_eddes_file_path);
            }

            if($room_edges_file = file_get_contents($room_edges_file_path)){
                self::addNeighboursToGraphFromFile($room_edges_file, $graph);
            }
            else{
                echo("Failed to set neighbours, File not found at: " . $room_edges_file_path);
            }          
        }

        static function addNeighboursToGraphFromFile($file_contents, $graph){
            $json_data = json_decode($file_contents, null);

            $features = $json_data->features;

            foreach($features as $key=>$value){
                $feature_properties = $value->properties;
                $start_node = $feature_properties->i;
                $end_node = $feature_properties->j;
                $edge_weight = $feature_properties->length;

                $graph->addNeighbourToNode($start_node, $end_node, $edge_weight);
            }
        }

        static function storeGraphIntoFile($file_path, $graph){
            file_put_contents($file_path, json_encode($graph, JSON_PRETTY_PRINT));
        }

    }
?>