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

        
        $threshold_big = 0.05;
        $distance = $dijkstra->getDistanceBetween2NodesAccurate($start_node, $end_node);
        //check the distance between the 2 nodes, check if they are more than 50m apart, if it is do special case
        if($floor == "Kilburn_2" && $distance > $threshold_big){
            
            $junction_top = "corridor89";
            $junction_bot = "corridor36";
            $junction_mid = "corridor109";
            $junction_right = "corridor68";
            $junction_left = "corridor13";

            $junction_array = [$junction_top, $junction_bot, $junction_mid, $junction_left, $junction_right];
                
            //check 14 configs
            $junction_distances = [];
            foreach($junction_array as $key => $value){
                $junction_distances[$value]
                    = $dijkstra->getDistanceBetween2NodesAccurate($start_node, $value)
                    + $dijkstra->getDistanceBetween2NodesAccurate($end_node, $value);
            }

            $min = 99999;
            $min_key = $junction_mid;
            foreach($junction_distances as $key => $value){
                if($min > $value){
                    $min = $value;
                    $min_key = $key;
                }
            }

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