<?php
    include_once "../php/GraphParser.php";
    //include_once "../php/Graph.php";
    include_once "../php/timetable_CSV_parser.php";
    include_once "../php/MappingsParser.php";
    include_once "../php/EncodingsParser.php";

    use \App\PHP\GraphParser;
    use \App\PHP\MappingsParser;
    use \App\PHP\EncodingsParser;
    //use \App\PHP\Graph;

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
        parseCSVToDatabaseFromFile($csv_path);
    }

    function parseMappings($mappings_path){
        MappingsParser::parseMappingsFromJSONFile($mappings_path);
    }

    function parseEncodings($encodings_path){
        EncodingsParser::parseEncodingsFromJSONFile($encodings_path);
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
            else if(isset($_GET["mappings"])){
                $mappings_path = $_GET["mappings"];
                parseMappings($mappings_path);
            }
            else if(isset($_GET["encodings"])){
                $encodings_path = $_GET["encodings"];
                parseEncodings($encodings_path);
            }
        }
        
    }

    
    
?>