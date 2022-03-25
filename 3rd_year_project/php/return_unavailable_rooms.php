<?php
    main();


    function main(){
        if(!isset($_GET['week_num']) || !isset($_GET['day']) || !isset($_GET['hour'])){
            die(json_encode([]));
        }

        $week_num = intval($_GET['week_num']);
        $day = $_GET['day'];
        $hour = $_GET['hour'];

        $connection = connectToDatabase();

        $unavailable_rooms = getUnavailableRooms($connection, $week_num, $day, $hour);
        $real_unavailable_rooms = getMapNameUnavailableRooms($connection, $unavailable_rooms);

        echo json_encode($real_unavailable_rooms);
    }

    function connectToDatabase(){
        $servername = "localhost";
        $username = "root";
        $password = "";
        $dbname = "kilburn_timetables";

        // Create connection
        $conn = new mysqli($servername, $username, $password, $dbname);

        // Check connection
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error . "<br>");
        }
        else{
            //echo "Connected successfully<br>";
            ;
        }
        return $conn;
    }

    function getUnavailableRooms($connection, $week_num, $day, $hour){
        $str_hour = $hour.":00:00";
        if($hour == 23){
            $str_hour_end = ($hour+1).":00:00";
        }
        else{
            $str_hour_end = "00:00:00";
        }

        $get_activities_and_rooms_sql = 
        "SELECT DISTINCT rooms.room_name
        FROM rooms
        INNER JOIN timetables
        ON rooms.room_id IN (
            SELECT timetables.room_id
                FROM timetables
                INNER JOIN activities 
                ON (timetables.activity_id = activities.activity_id 
                    AND timetables.week_number = $week_num 
                    AND activities.week_day = '$day'
                    AND (activities.start_time = '$str_hour'
                    OR activities.end_time = '$str_hour_end')
                    )
                )";

        $rooms_rows = $connection->query($get_activities_and_rooms_sql);
        $unavailable_rooms = [];
        if($rooms_rows->num_rows == 0){
            //echo "No room unavailable";
            return [];
        }
        else{
            while($row = $rooms_rows->fetch_assoc()){
                $unavailable_rooms[] = $row["room_name"];
            }
        }

        return $unavailable_rooms;
    }

    function getMapNameUnavailableRooms($connection, $unavailable_rooms){

        $sql_get_real_names =
        "SELECT room_name FROM DBmappings WHERE room_db_name IN (". "'" . implode("', '", $unavailable_rooms). "'" .")";

        $real_unavailable_rooms = [];
        $rooms_rows = $connection->query($sql_get_real_names);
        if($rooms_rows->num_rows == 0){
            //echo "No room unavailable";
            return [];
        }
        else{
            while($row = $rooms_rows->fetch_assoc()){
                $real_unavailable_rooms[] = $row["room_name"];
            }
        }
        
        return $real_unavailable_rooms;
    }

?>