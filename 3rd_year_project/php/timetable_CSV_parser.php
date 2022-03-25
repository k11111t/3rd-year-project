<?php
	$GLOBALS["DATABASE_ACCESS"] = TRUE;

	function parseCSVToDatabaseFromFile($file_path){
		
		$connection = connectToDatabase();
		readCSVandInsertIntoDB($connection, $file_path);
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
			echo "Connected to DB successfully<br>";
		}
		return $conn;
	}
	
	function readCSVandInsertIntoDB($connection, $file_path){
		if(!file_exists($file_path)){
			$connection->close();
			die("File not found at: " . $file_path);
		}
		
		if(($open = fopen($file_path, "r")) !== FALSE){
			echo "Opening file<br>";
			$counter = 0;
			while (($data = fgetcsv($open, 1000, ",")) !== FALSE) 
			{
				$counter++;
				if($counter == 1) continue;
				insertIntoDB($connection, $data);
			}
			fclose($open);
		}
		else{
			$connection->close();
			die("File failed to open");
		}
	}
	
	function insertIntoDB($connection, $value){
		$activity_name = $value[0]; //type: string
		//$module_name = $value[1]; //type: string
		//$activity_type_name = $value[2]; //type: string
		$start_time = $value[3] . ":00"; //type: time string
		$end_time = $value[4] . ":00"; //type: time string
		
		$scheduled_day = $value[5]; //type: enum string, make sure it is Monday-Friday format
		$week_pattern = getWeeks($value[6]); //type: list of integers
		//$activity_dates = getActivityDates($value[7]); //type: list of dates
		$room_size = intval($value[8]); //type: integer
		$room_name = $value[9]; //type: string
		
		insertActivity($connection, $activity_name, $start_time, $end_time, $scheduled_day);

		$separated_room_names = processRoomNames($room_name);
		
		//if there are more than rooms in the string
		if(gettype($separated_room_names) == "array"){
			foreach($separated_room_names as $r){
				insertRoom($connection, $r, $room_size);
				foreach($week_pattern as $week_number){
					insertTimetabledActivity($connection, $r, $activity_name, $week_number);
				}
			}
		}
		//if the string contains just one room
		else if(gettype($separated_room_names) == "string"){
			insertRoom($connection, $separated_room_names, $room_size);
			foreach($week_pattern as $week_number){
				insertTimetabledActivity($connection, $separated_room_names, $activity_name, $week_number);
			}
		}
			
	}
	
	function getWeeks($input_string){
		//decodes the intervals into a list of integers (week numbers)
		$list_of_weeks = array();
		// format of intervals:
		// e.g.: i-j,k-l,m
		$intervals = explode(",", $input_string);
		for($i=0; $i < count($intervals); $i++){
			$interval = explode("-", $intervals[$i]);
			$interval_start = intval($interval[0]);
			if(count($interval) > 1){
				$interval_end = intval($interval[1]);
				for($j=$interval_start; $j <= $interval_end; $j++){
					$list_of_weeks[] = $j;
				}
			}
			else{
				$list_of_weeks[] = $interval_start;
			}
		}
		return $list_of_weeks;
	}

	function getActivityDates($input_string){
		//parses a string of dates into a list of dates
		$activity_dates = explode(",", $input_string);
		for($i=0; $i < count($activity_dates); $i++){
			$activity_dates[$i] = str_replace("/", "-", $activity_dates[$i]);
		}
		return $activity_dates;
	}

	function processRoomNames($room_names_string){
		//check if string contains comma
		//case 3
		if(str_contains($room_names_string, ",")){
			$list_of_rooms = explode(",", $room_names_string);
			return array_map('trim', $list_of_rooms);
		}
		//case 1 and 2
		else if(str_contains($room_names_string, "+")){
			//case 2
			if(str_contains($room_names_string, "(") && str_contains($room_names_string, ")")){
				$temp_split = explode("(", $room_names_string);
				$room_name = trim($temp_split[0]);
				$room_numbers_string = trim($temp_split[1]);
				$room_numbers_string = str_replace(")", "", $room_numbers_string);
				$room_numbers = explode("+", $room_numbers_string);
				$result = array();
				foreach($room_numbers as $number){
					//check if name ends with a number
					$r = preg_match_all("/.*(\d+)$/", $room_name, $matches);
					if($r>0){
						$result[] = $room_name . trim($number);
					}
					else{
						$result[] = $room_name . ' ' . trim($number);
					}
				}
				return $result;
			}
			//case 1
			else{
				$room_name = trim(explode("_", $room_names_string)[0]) . "_";
				$room_names_string = str_replace($room_name, "", $room_names_string);
				$room_numbers = trim($room_names_string);
				$room_numbers = explode("+", $room_numbers);
				$result = array();
				foreach($room_numbers as $number){
					$result[] = $room_name . $number;
				}
				return $result;
			}
		}
		//normal string
		else{
			return $room_names_string;
		}
	}
	
	function insertRoom($connection, $room_name, $room_size){
		if($GLOBALS["DATABASE_ACCESS"] === FALSE) {return; }
		//inserts a room into a database

		//check if the room is unique
		//TO DO: UPDATE THE ROOM SIZE 
		$sql_select_request = "SELECT room_name, size FROM rooms WHERE room_name ='$room_name'";
		try{
			$result = $connection->query($sql_select_request);
		}
		catch (Exception $e){
			echo "Failed to fetch rooms: " .$e->getMessage();
		}
		
		if($result->num_rows != 0){
			echo "Room insertion failed, duplicate of ". $room_name ." found<br>";
			return;
		}

		//insert the room, if not unique exception is caught
		$sql_insert_request = "INSERT INTO rooms (room_name, size) VALUES ('$room_name', '$room_size')";
		try{
			if($connection->query($sql_insert_request) === TRUE){
				echo "Successful room insertion<br>";
			}
			else{
				echo "SQL Error: " . $sql_insert_request . "<br>" . $connection->error;
			}
		}
		catch (Exception $e){
			echo "Room insertion failed: " . $e->getMessage() . "<br>";
			return;
		}
	}

	function insertActivity($connection, $activity_name, $start_time, $end_time, $scheduled_day){
		if($GLOBALS["DATABASE_ACCESS"] === FALSE) {return; }
		//insert activity into a database
		//check for uniqueness of the activity - duplicates
		$sql_select_request = "SELECT activity_name, start_time, end_time, week_day
								FROM activities
								WHERE activity_name='$activity_name' AND 
										start_time='$start_time' AND 
										end_time='$end_time' AND 
										week_day='$scheduled_day'";
		try{
			$result = $connection->query($sql_select_request);
		}
		catch (Exception $e){
			echo "Activity duplicate check failed: " . $e->getMessage() . "<br>";
			return;
		}
		if($result->num_rows == 0){
			//insert if the entry is unique
			$sql_insert_request = "INSERT INTO activities (activity_name, start_time, end_time, week_day)
								VALUES ('$activity_name', '$start_time', '$end_time', '$scheduled_day')";
			try{
				if($connection->query($sql_insert_request) === TRUE){
					echo "Successful activity insertion<br>";
				}
				else{
					echo "SQL Error: " . $sql_insert_request . "<br>" . $connection->error;
				}
			}
			catch (Exception $e){
				echo "Activity insertion failed: " . $e->getMessage() . "<br>";
				return;
			}
		}
		else{
			echo "Failed to insert activity: " . "Duplicate found" . "<br>";
			return;
		}
		
	}
	
	function insertTimetabledActivity($connection, $room_name, $activity_name, $week_number){
		if($GLOBALS["DATABASE_ACCESS"] === FALSE) {
			return; 
		}
		//insert timetabled activity into the database
		//timetabled activity == activity in a room at a certain week

		//get room id
		$sql_get_room_id = "SELECT room_id FROM rooms WHERE rooms.room_name='$room_name'";
		$room_id_row = $connection->query($sql_get_room_id);
		if($room_id_row->num_rows == 0) {
			echo "Room ID not found<br>";
			return;
		}
		$room_id = $room_id_row->fetch_assoc()["room_id"];

		//get activity id
		$sql_get_activity_id = "SELECT activity_id FROM activities WHERE activities.activity_name='$activity_name'";
		$activity_id_row = $connection->query($sql_get_activity_id);
		if($activity_id_row->num_rows == 0){
			echo "Activity ID not found<br>";
			return;
		}
		$activity_id = $activity_id_row->fetch_assoc()["activity_id"];

		//insert
		$sql_insert_scheduled_activity = "INSERT INTO timetables(room_id, activity_id, week_number)
								VALUES ($room_id, $activity_id, $week_number)";
		try{
			if($connection->query($sql_insert_scheduled_activity) === TRUE){
				echo "Success: Scheduled activity added<br>";
			}
			else{
				echo "SQL Error: " . $sql_insert_scheduled_activity . "<br>" . $connection->error;
			}
		}
		catch (Exception $e){
			echo "Timetable activity insertion failed: " . $e->getMessage() . "<br>";
			return;
		}
		
	}
?>