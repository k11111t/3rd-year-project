<?php
    include_once "Dijkstra.php";

    use \App\PHP\Dijkstra;

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

        if($floor == "" || $start_node == "" || $end_node == ""){
            die(Dijkstra::createGeoJSONStringLineObject([]));
        }

        $file_path = "../data/GraphsData/".$floor."/graph.json";
        $graph = Dijkstra::returnGraphFromFile($file_path);
        $dijkstra = new Dijkstra($start_node, $end_node, $graph);

        //change these thresholds accordingly
        $threshold_big = 0.06;
        $threshold_small = 0.025;
        $distance = $dijkstra->getDistanceBetween2NodesAccurate($start_node, $end_node);
        //check the distance between the 2 nodes, check if they are more than 50m apart, if it is do special case
        //echo($distance);

        if($floor == "Kilburn_2" && $distance > $threshold_big){
            $junction_top = "corridor89"; $junction_bot = "corridor35"; $junction_mid = "corridor109"; $junction_right = "corridor68"; $junction_left = "corridor13";

            $junction_array = [$junction_top, $junction_bot, $junction_mid, $junction_left, $junction_right];
            $junction_weights = [$junction_top => 1, $junction_bot => 1, $junction_mid => 1, $junction_left => 1, $junction_right => 1];
                
            //calculate distances between the nodes and junctions
            $junction_distances = [];
            foreach($junction_array as $junction_name){
                $junction_distances[$junction_name]
                    = $dijkstra->getDistanceBetween2NodesAccurate($start_node, $junction_name)
                    + $dijkstra->getDistanceBetween2NodesAccurate($end_node, $junction_name);
            }

            //find if there are any junctions in proximity of rooms, save the distances
            $start_node_junction_proximity = NULL;
            $junction_1_distance = 0;
            $end_node_junction_proximity = NULL;
            $junction_2_distance = 0;
            //assumes that a point cannot be part of 2 different junctions - not possible
            foreach($junction_array as $junction_name){
                $dist_1 = $dijkstra->getDistanceBetween2NodesAccurate($start_node, $junction_name);
                $dist_2 = $dijkstra->getDistanceBetween2NodesAccurate($end_node, $junction_name);

                if($dist_1 < $threshold_small){
                    $start_node_junction_proximity = $junction_name;
                    $junction_1_distance = $dist_1;
                }
                if($dist_2 < $threshold_small){
                    $end_node_junction_proximity = $junction_name;
                    $junction_2_distance = $dist_2;
                }
            }

            //check if 1 node is near a junction - dont use that junction point
            if($start_node_junction_proximity == NULL xor $end_node_junction_proximity == NULL){
                if($end_node_junction_proximity == NULL){
                    if($start_node_junction_proximity != $junction_mid)
                        $junction_weights[$start_node_junction_proximity] *= 9;
                }
                else if ($start_node_junction_proximity == NULL){
                    if($end_node_junction_proximity != $junction_mid)
                        $junction_weights[$end_node_junction_proximity] *= 9;
                }
            }

            //check if 2 nodes are near a junction - use one of the junction points
            if($start_node_junction_proximity != NULL and $end_node_junction_proximity != NULL){
                //if they are left and right
                if(($start_node_junction_proximity == $junction_left && $end_node_junction_proximity == $junction_right) || 
                    ($end_node_junction_proximity == $junction_left && $start_node_junction_proximity == $junction_right)){
                    $junction_weights[$start_node_junction_proximity] *= 9;
                    $junction_weights[$end_node_junction_proximity] *= 9;
                    $junction_weights[$junction_mid] *= 9;
                }
                else{
                    //use one of the junctions
                    if($junction_1_distance < $junction_2_distance){
                        $junction_weights[$start_node_junction_proximity] *= 0.1;
                        $junction_weights[$end_node_junction_proximity] *= 9;
                    }
                    else{
                        $junction_weights[$end_node_junction_proximity] *= 0.1;
                        $junction_weights[$start_node_junction_proximity] *= 9;
                    }
                }
            }

            //change weight for each junction
            foreach($junction_distances as $junction_name => $distance){
                $junction_distances[$junction_name] *= $junction_weights[$junction_name];
            }

            $min = 99999;
            $min_key = $junction_mid;

            foreach($junction_distances as $key => $value){
                //check the distance of the nodes from the junction
                //if the point is too close then it defeats the purpose
                if($min > $value){
                    $min = $value;
                    $min_key = $key;
                }
            }
            //die($min_key);

            //call 2x dijkstra to the nearest junction and concatenate the output
            $dijkstra1 = new Dijkstra($start_node, $min_key, $graph);
            $dijkstra2 = new Dijkstra($min_key, $end_node, $graph);
            $shortest_path1 = $dijkstra1->executeDijkstra();
            $shortest_path2 = $dijkstra2->executeDijkstra();

            $merged_array = array_merge($shortest_path2, $shortest_path1);
            
            $coordinates_array = $dijkstra->getCoordinatesFromPath($merged_array);
            $mapbox_obj = Dijkstra::createGeoJSONStringLineObject($coordinates_array);
            echo $mapbox_obj;
        }
        else{
            
            $shortest_path = $dijkstra->executeDijkstra();
            $coordinates_array = $dijkstra->getCoordinatesFromPath($shortest_path);
            $mapbox_obj = Dijkstra::createGeoJSONStringLineObject($coordinates_array);
            echo $mapbox_obj;
        }
    }

?>