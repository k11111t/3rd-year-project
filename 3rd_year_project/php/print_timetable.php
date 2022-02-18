<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta http-equiv='X-UA-Compatible' content='IE=edge'>
    <title></title>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    
</head>
<body>
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
        echo $displayed_room_name . "<br>";
        $connection = connectToDatabase();
        $activity_ids = getActivityIDs($connection, $week_number, $db_room_name);
        buildVerticalTimetable($connection, $activity_ids);
        //buildHorizontalTimetable($connection, $activity_ids);
    }

    function buildVerticalTimetable($connection, $activity_ids_list){
        //activities info stores the information for each activity in $activity_ids_list
        //it is ordered by start_time to speed up the search process
        $activities_info = array();
        $sql_get_activities = "SELECT * FROM activities WHERE activities.activity_id IN ('" . implode("', '", $activity_ids_list) ."') 
        ORDER BY activities.start_time";
        $activities_rows =$connection->query($sql_get_activities);
        if($activities_rows->num_rows == 0){
            echo "Timetable not found<br>";
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
        echo "<table class='timetable'>";
        for($i=0; $i < count($time_scale); $i++){
            echo "<tr>";
            for($j=0; $j< count($days_in_week); $j++){
                if($i==0){
                    echo "<td class='cell'>" . $days_in_week[$j] . "</td>";
                }
                else{
                    if($j == 0) {
                        echo "<td class='head_cell'>". $time_scale[$i] . ":00" ."</td>";
                        continue;
                    }
                    // when $i is n then the correct index is at $i
                    $nine_am = 9; 
                    $new_index = $i;
                    foreach($activities_info as $index => $activity_info){
                        //change formatting of time if it is less than 10am
                        $string_time = strval($time_scale[$new_index]).':00:00';
                        if($time_scale[$new_index] <= $nine_am) {
                            $string_time = "0".$string_time;
                        }

                        //change formatting of time if it is less than 10am
                        $string_time_plus_one = "";
                        if($new_index+1 < count($time_scale)){
                            $string_time_plus_one = strval($time_scale[$new_index+1]).':00:00';
                            if($time_scale[$new_index+1] <= $nine_am) $string_time_plus_one = "0" . $string_time_plus_one;
                        }
                        
                        //check if the activity's start time matches or if the end time matches
                        //also check if the week matches with the activity
                        if(
                            (strval($activity_info['start_time']) == $string_time || 
                            ($new_index+1 < count($time_scale) && //check for bounds
                            strval($activity_info['end_time']) == $string_time_plus_one)
                            )
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

    function buildHorizontalTimetable($connection, $activity_ids_list){

        $activities_info = array();
        $sql_get_activities = "SELECT * FROM activities WHERE activities.activity_id IN ('" . implode("', '", $activity_ids_list) ."') 
        ORDER BY activities.start_time";
        $activities_rows =$connection->query($sql_get_activities);
        if($activities_rows->num_rows == 0){
            echo "Timetable not found<br>";
            return;
        }
        else{
            while($row = $activities_rows->fetch_assoc()){
                $activities_info[] = $row;
                //echo print_r($row) . "<br>";
            }
        }
        
        $time_scale = range(9, 18);
        $days = [
            '',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday'
        ];

        echo "<table class='timetable'>";
        for($i=0; $i < count($days); $i++){
            echo "<tr>";
            echo "<td class='cell'>". $days[$i] ."</td>";
            for($j=0; $j< count($time_scale); $j++){
                if($i==0){
                    echo "<td class='cell'>" . $time_scale[$j] . ":00" . "</td>";
                }
                else{
                    foreach($activities_info as $index => $activity_info){
                        $string_time = strval($time_scale[$j]).':00:00';
                        if($time_scale[$j] < 10) $string_time = "0".$string_time;

                        if($j != 9){
                            $string_time_plus_one = strval($time_scale[$j+1]).':00:00'; 
                            if($time_scale[$j+1] < 10) $string_time_plus_one = "0" . $string_time_plus_one;
                        }
                        

                        if(
                            ((strval($activity_info['start_time']) == $string_time || 
                            ($j!=9 && strval($activity_info['end_time']) == $string_time_plus_one)
                            ))
                             && $activity_info['week_day'] == $days[$i]){
                            echo "<td class='cell'>". $activity_info['activity_name'] ."</td>";
                            break;
                        }
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
			echo "Timetable not found (Room ID not in Database) <br>";
			exit(0);
		}
		$room_id = $room_id_row->fetch_assoc()["room_id"];

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
            echo "Connected successfully<br>";
        }
        return $conn;
    }

?>