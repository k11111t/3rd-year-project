<?php
    main();

    function main(){
        if(!isset($_GET["room_name"])){
            die("");
        }
        $room_name = $_GET["room_name"];

        $connection = connectToDatabase();
        echo getDBMapping($connection, $room_name);
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

    function getDBMapping($connection, $room_name){
        $sql_select = 
        "SELECT room_db_name FROM DBmappings WHERE room_name='$room_name'";

        $mappings_rows = $connection->query($sql_select);
        if($mappings_rows->num_rows == 0){
            //echo "No room unavailable";
            return "";
        }
        else{
            return $mappings_rows->fetch_assoc()["room_db_name"];
        }
    }
?>