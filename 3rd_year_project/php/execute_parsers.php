

<?php
    include_once "../php/GraphParser.php";
    include_once "../php/Graph.php";
    include_once "../php/timetable_CSV_parser.php";

    use \App\PHP\GraphParser;
    use \App\PHP\Graph;

    main();

    function parseGraph($floor_name, $path_to_floor_name_folder){
        $graph_parser = new GraphParser();
    
        //load nodes
        $graph = $graph_parser->setUpGraphFromFile($floor_name, $path_to_floor_name_folder);

        //store graph
        $graph_file_path = $path_to_floor_name_folder.$floor_name."/graph.json";
        if(!empty($graph->getListOfNodes())){
            GraphParser::storeGraphIntoFile($graph_file_path, $graph);
            echo "Parsing successful graph was stored in: " . $graph_file_path;
            //return graph
            echo "<pre>";
            print_r($graph);
            echo "</pre>";
        }
        else{
            echo "<br>Failed to store Graph in: ".$graph_file_path;
        }
    }

    function parseCSVintoDB($csv_path){
        $_GLOBALS["VERBOSE"] = 0;
        parseCSVToDatabaseFromFile($csv_path);
    }

    function main(){
        if($_SERVER['REQUEST_METHOD'] === 'GET'){
            if(isset($_GET["floor"]) && isset($_GET["path"])){
                $floor = $_GET["floor"];
                $route = $_GET["path"];
                parseGraph($floor, $route);
            }
            else if(isset($_GET["csv"])){
                $csv_path = $_GET["csv"];
                parseCSVintoDB($csv_path);
            }
        }
        
    }

    
    
?>