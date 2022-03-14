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
        $shortest_path = $dijkstra->executeDijkstra();
        $coordinates_array = $dijkstra->getCoordinatesFromPath($shortest_path);
        $mapbox_obj = Dijkstra::createGeoJSONStringLineObject($coordinates_array);
        echo $mapbox_obj;
    }

?>