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
        $threshold_big = 0.04;
        $threshold_small = 0.02;
        $distance = $dijkstra->getDistanceBetween2NodesAccurate($start_node, $end_node);
        //check the distance between the 2 nodes, check if they are more than 50m apart, if it is do special case
        // die($distance);

        if($floor == "Kilburn_2" && $distance > $threshold_big){
            $junction_top = "corridor89"; $junction_bot = "corridor36"; $junction_mid = "corridor109"; $junction_right = "corridor68"; $junction_left = "corridor13";

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
            $start_to_junction_distance = 0;
            $end_node_junction_proximity = NULL;
            $end_to_junction_distance = 0;
            //assumes that a point cannot be part of 2 different junctions - not possible
            foreach($junction_array as $junction_name){
                $dist_1 = $dijkstra->getDistanceBetween2NodesAccurate($start_node, $junction_name);
                $dist_2 = $dijkstra->getDistanceBetween2NodesAccurate($end_node, $junction_name);

                if($dist_1 < $threshold_small){
                    $start_node_junction_proximity = $junction_name;
                    $start_to_junction_distance = $dist_1;
                }
                if($dist_2 < $threshold_small){
                    $end_node_junction_proximity = $junction_name;
                    $end_to_junction_distance = $dist_2;
                }
            }

            $points_near_junction = FALSE;

            //check if 1 node is near a junction - decrease the change of picking that junction node
            if($start_node_junction_proximity == NULL xor $end_node_junction_proximity == NULL){
                $points_near_junction = TRUE;
                $junction_node = $start_node_junction_proximity == NULL ? $end_node_junction_proximity : $start_node_junction_proximity;
                if($junction_node != $junction_mid){
                    $junction_weights[$junction_node] *= 1.3;
                }else{
                    //prefer mid if one of them is mid junction
                    $junction_weights[$junction_node] *= 0.1;
                }
                    
            }

            //check if 2 nodes are near a junction - use one of the junction points
            if($start_node_junction_proximity != NULL and $end_node_junction_proximity != NULL){
                //if they are left and right
                $points_near_junction = TRUE;
                if(($start_node_junction_proximity == $junction_left && $end_node_junction_proximity == $junction_right) || 
                    ($end_node_junction_proximity == $junction_left && $start_node_junction_proximity == $junction_right)){
                    $junction_weights[$start_node_junction_proximity] *= 10;
                    $junction_weights[$end_node_junction_proximity] *= 10;
                    $junction_weights[$junction_mid] *= 10;
                }
                else{
                    //if one of the junctions is a mid junction, then do not use either of the junction
                    //prefer the top and bot junction
                    if($start_node_junction_proximity == $junction_mid or $end_node_junction_proximity == $junction_mid){
                        $junction_weights[$start_node_junction_proximity] *= 10;
                        $junction_weights[$end_node_junction_proximity] *= 10;
                        $junction_weights[$junction_top] *= 0.1;
                        $junction_weights[$junction_bot] *= 0.1;
                    }
                    //if none of the junctions are the mid junctions, then use one of the junctions - the one that is further away
                    else{
                        if($start_to_junction_distance > $end_to_junction_distance){
                            $junction_weights[$start_node_junction_proximity] *= 0.1;
                        }
                        else {
                            $junction_weights[$end_node_junction_proximity] *= 0.1;
                        }
                    }
                }
            }

            //if the points are not near junction, then prefer the mid junction
            if($points_near_junction == FALSE){
                $junction_weights[$junction_mid] *= 0.95;
            }

            //change weight for each junction
            foreach($junction_distances as $junction_name => $distance){
                // echo($junction_name . " " . $junction_weights[$junction_name] . "\n");
                $junction_distances[$junction_name] *= $junction_weights[$junction_name];
                // echo($junction_name . " " . $junction_distances[$junction_name] . "\n");
            }

            $min = 99999;
            $min_key = $junction_mid;
            $min_2 = 99999;
            $min_2_key = $junction_mid;

            foreach($junction_distances as $key => $value){
                //check the distance of the nodes from the junction
                //if the point is too close then it defeats the purpose
                
                if($min > $value){
                    $min_2 = $min;
                    $min_2_key = $min_key;
                    $min = $value;
                    $min_key = $key;
                }
                else if($min_2 > $value and $min_2 != $min){
                    $min_2 = $value;
                    $min_2_key = $key;
                }
            }

            //check if the difference is too small - then prefer the other path
            // die($min - $min_2);
            //prefer the non mid point
            $min_diff = 0.005;
            if(abs($min - $min_2) < $min_diff 
                and $min_key == $junction_mid 
                and $points_near_junction == TRUE){
                $min_key = $min_2_key;
            }

            // die($min_key."\n");

            //call dijkstra to the nearest junction from start node and end node
            $dijkstra1 = new Dijkstra($min_key, $start_node, $graph);
            $dijkstra2 = new Dijkstra($min_key, $end_node, $graph);
            $shortest_path1 = $dijkstra1->executeDijkstra();
            $shortest_path2 = $dijkstra2->executeDijkstra();

            // print_r($shortest_path1); print_r($shortest_path2);

            //checks if there are duplicate entries - the junction makes the path too long -> remove the redundant bit
            $i = 1;
            $counter = 0;
            $end_connector = "random_key";
            if(!empty($shortest_path1) and!empty($shortest_path2) ){
                while($shortest_path1[count($shortest_path1) - $i] == $shortest_path2[count($shortest_path2) - $i]){
                    $end_connector = $shortest_path1[count($shortest_path1) - $i];
                    array_splice($shortest_path1, count($shortest_path1) - $i, 1);
                    array_splice($shortest_path2, count($shortest_path2) - $i, 1);
                    $counter++;
                }

                // print($counter);print_r($shortest_path1); print_r($shortest_path2);

                if(
                    ($end_connector == $min_key and $counter == 1) or 
                    // ($end_connector == $min_key and $counter == 1) or
                    (count($shortest_path1) == 1 or count($shortest_path2) == 1)){
                        array_push($shortest_path1, $end_connector);
                        array_push($shortest_path2, $end_connector);
                }
            }

            //concatenate the 2 shortest paths
            $merged_array = array_merge($shortest_path1, array_reverse($shortest_path2));

            
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