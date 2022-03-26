<?php
    namespace App\PHP;

    class EncodingsParser{

        static function parseEncodingsFromJSONFile($file_path){
            $connection = connectToDatabase();
            self::readJSONFileIntoDB($connection, $file_path);
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
    
        static function readJSONFileIntoDB($connection, $file_path){
            if(!file_exists($file_path)){
                $connection->close();
                die("File not found at: " . $file_path);
            }
    
            $json_file = file_get_contents($file_path);
            $json_data = json_decode($json_file, null);

            foreach($json_data as $key=>$value){
                $sql_select_encoding = 
                "SELECT * FROM mapbox_encodings WHERE layer_name='$key'";
                try{
                    $result = $connection->query($sql_select_encoding);
                }
                catch (Exception $e){
                    echo "Failed to fetch encoding: " .$e->getMessage();
                }
                
                if($result->num_rows != 0){
                    echo "Encoding insertion failed, duplicate of ". $key ." found<br>";
                    continue;
                }

                $sql_insert_encoding = 
                "INSERT INTO mapbox_encodings (layer_name, `encoding`) VALUES ('$key', '$value')
                ";
                try{
                    if($connection->query($sql_insert_encoding) === TRUE){
                        echo "Successful encoding insertion<br>";
                    }
                    else{
                        echo "SQL Error: " . $sql_insert_encoding . "<br>" . $connection->error;
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