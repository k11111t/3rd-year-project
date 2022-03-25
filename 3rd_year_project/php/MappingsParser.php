<?php
    namespace App\PHP;

    class MappingsParser{

        static function parseMappingsFromJSONFile($file_path){
            $connection = connectToDatabase();
            self::readJSONFileIntoDB($connection, $file_path);
            $connection->close();
        }
    
        static function connectToDatabase(){
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
    
        static function readJSONFileIntoDB($connection, $file_path){
            if(!file_exists($file_path)){
                $connection->close();
                die("File not found at: " . $file_path);
            }
    
            $json_file = file_get_contents($file_path);
            $json_data = json_decode($json_file, null);

            foreach($json_data as $key=>$value){
                $sql_select_mapping = 
                "SELECT * FROM DBmappings WHERE room_name='$key'";
                try{
                    $result = $connection->query($sql_select_mapping);
                }
                catch (Exception $e){
                    echo "Failed to fetch mapping: " .$e->getMessage();
                }
                
                if($result->num_rows != 0){
                    echo "Mapping insertion failed, duplicate of ". $key ." found<br>";
                    continue;
                }

                $sql_insert_mapping = 
                "INSERT INTO DBmappings (room_name, room_db_name) VALUES ('$key', '$value')
                ";
                try{
                    if($connection->query($sql_insert_mapping) === TRUE){
                        echo "Successful mapping insertion<br>";
                    }
                    else{
                        echo "SQL Error: " . $sql_insert_mapping . "<br>" . $connection->error;
                    }
                }
                catch (Exception $e){
                    echo "Mapping insertion failed: " . $e->getMessage() . "<br>";
                    continue;
                }
            }

        }
    }
?>