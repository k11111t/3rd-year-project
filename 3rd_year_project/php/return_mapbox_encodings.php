<?php
    main();

    function main(){
        if(!isset($_GET["floor_name"]) && !isset($_GET["layer_name"])){
            die("");
        }

        $connection = connectToDatabase();
        if(isset($_GET["layer_name"])){
            $layer_name = $_GET["layer_name"];
            echo getMapboxEncodingForLayer($connection, $layer_name);
        }
        else if(isset($_GET["floor_name"])){
            $floor_name = $_GET["floor_name"];
            if($floor_name == "all"){
                echo getMapboxEncodingForAllFloors($connection);
            }
            else{
                echo getMapboxEncodingForFloor($connection, $floor_name);
            }
        }
        
        $connection->close();
    }

    function connectToDatabase(){
        $servername = "localhost";
        $username = "root";
        $password = "";
        $dbname = "kilburn_timetables";

        // Create connection
        try{
            $conn = new mysqli($servername, $username, $password, $dbname);
        }
        catch (Exception $e){
            die("Database connection failed: " . $e->getMessage() . "<br>");
        }

        // Check connection
        if ($conn->connect_error) {
            die("Database connection failed: " . $conn->connect_error . "<br>");
        }
        else{
            //echo "Connected to DB successfully<br>"
            ;
        }
        return $conn;
    }

    function getMapboxEncodingForLayer($connection, $layer_name){
        $sql_select = 
        "SELECT `encoding` FROM mapbox_encodings WHERE layer_name='$layer_name'";

        $result = $connection->query($sql_select);
        if($result->num_rows == 0){
            //echo "No room unavailable";
            return "";
        }
        else{
            return $result->fetch_assoc()["encoding"];
        }
    }

    function getMapboxEncodingForFloor($connection, $floor_name){
        $layers_to_get = [];
        $layers_to_get[] = $floor_name . "_rooms";
        $layers_to_get[] = $floor_name . "_room_centroids";
        $layers_to_get[] = $floor_name . "_corridors";
        $layers_to_get[] = $floor_name . "_structures";
        $layers_to_get[] = $floor_name . "_structure_centroids";
        
        $sql_select = 
        "SELECT `layer_name`, `encoding` FROM mapbox_encodings WHERE `layer_name` IN (". "'" . implode("','", $layers_to_get). "'" .")";

        $result = $connection->query($sql_select);
        if($result->num_rows == 0){
            //echo "No room unavailable";
            return "";
        }
        else{
            $layers_encodings = [];
            while($row = $result->fetch_assoc()){
                $layers_encodings[$row["layer_name"]] =$row["encoding"];
            }
        }

        return json_encode($layers_encodings);
    }

    function getMapboxEncodingForAllFloors($connection){
        $sql_select = 
        "SELECT `layer_name`, `encoding` FROM mapbox_encodings";

        $result = $connection->query($sql_select);
        if($result->num_rows == 0){
            //echo "No room unavailable";
            return "";
        }
        else{
            $layers_encodings = [];
            while($row = $result->fetch_assoc()){
                $layers_encodings[$row["layer_name"]] =$row["encoding"];
            }
        }

        return json_encode($layers_encodings);
    }
?>