<?php
    main();

    function main(){
        if(!isset($_GET['week_number']) || !isset($_GET['room']) || !isset($_GET['room_name'])){
            die("Error: Variables not set");
        }
        $week_number = intval($_GET['week_number']);
        $db_room_name = $_GET['room'];
        $displayed_room_name = $_GET['room_name'];
        // $week_number = 12;
        // $room_name = "Kilburn_TH 1.1";
        
        $connection = connectToDatabase();
        echo "<h3>". $displayed_room_name ."</h3>";
        $activity_ids = getActivityIDs($connection, $week_number, $db_room_name);
        echo "<p>room size: " . getRoomSize($connection, $db_room_name) . "<p>";
        buildVerticalTimetable($connection, $activity_ids);
    }

    function buildVerticalTimetable($connection, $activity_ids_list){
        //activities info stores the information for each activity in $activity_ids_list
        //it is ordered by start_time to speed up the search process
        $activities_info = array();
        $sql_get_activities = "SELECT * FROM activities WHERE activities.activity_id IN ('" . implode("', '", $activity_ids_list) ."') 
        ORDER BY activities.start_time";
        $activities_rows =$connection->query($sql_get_activities);
        if($activities_rows->num_rows == 0){
            echo "<p>Timetable not found</p>";
            return;
        }
        else{
            while($row = $activities_rows->fetch_assoc()){
                $activities_info[] = $row;
            }
        }

        $time_scale = range(8, 18);
        $days_in_week = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        //print the timetable with information from $activities_info
        echo "<table class='table table-bordered table-light' style='table-layout: fixed;
        word-wrap: break-word;'> ";
        for($i=0; $i < count($time_scale); $i++){
            echo "<tr>";
            for($j=0; $j< count($days_in_week); $j++){
                if($i==0){
                    echo "<th scope='col'>" . $days_in_week[$j] . "</td>";
                }
                else{
                    if($j == 0) {
                        echo "<td scope='row'>". $time_scale[$i] . ":00" ."</td>";
                        continue;
                    }
                    // when $i is n then the correct index is at $i
                    $nine_am = 9; 
                    $new_index = $i;
                    //checking for matching activity 
                    foreach($activities_info as $index => $activity_info){
                        //check if the activity's start time matches or if the end time matches
                        //also check if the week matches with the activity
                        $start_time = intval(substr($activity_info['start_time'], 0, 2));
                        $end_time = intval(substr($activity_info['end_time'], 0, 2));
                        if(($start_time <= $time_scale[$new_index] && $time_scale[$new_index] < $end_time)
                             && $activity_info['week_day'] == $days_in_week[$j]){
                            echo "<td class='cell'>". $activity_info['activity_name'] ."</td>";
                            break;
                        }
                        //add empty cell if nothing was found
                        else if($index === array_key_last($activities_info)){
                            echo "<td class='cell'>" . "</td>";
                        }
                    }
                }
            }
            echo "</tr>";
        }
        echo "</table>";
    }

    function getActivityIDs($connection, $week_number, $room_name){
        //get room id
		$sql_get_room_id = "SELECT room_id FROM rooms WHERE rooms.room_name='$room_name'";
		$room_id_row = $connection->query($sql_get_room_id);
		if($room_id_row->num_rows == 0) {
			echo "<p> Timetable not found </p>";
			exit(0);
		}
		$room_id = $room_id_row->fetch_assoc()["room_id"];

        //result array to return - returns all the activity ids associated with a room id and week number
        $activity_ids_list = array();
        $sql_get_activity_ids = "SELECT activity_id FROM timetables WHERE room_id=$room_id AND week_number=$week_number";
        $activity_ids_rows = $connection->query($sql_get_activity_ids);
        if($activity_ids_rows->num_rows > 0){
            while($row = $activity_ids_rows->fetch_assoc()){
                $activity_ids_list[] = $row["activity_id"];
            }
        }
        return $activity_ids_list;
    }

    function getRoomSize($connection, $room_name){
        //returns room size
        $sql_get_room_id = "SELECT room_id, size FROM rooms WHERE rooms.room_name='$room_name'";
		$room_id_row = $connection->query($sql_get_room_id);
		if($room_id_row->num_rows == 0) {
            return "";
			exit(0);
		}
        $row = $room_id_row->fetch_assoc();
        $room_size = $row["size"];
        return $room_size;
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

?>