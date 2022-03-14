<?php
namespace App\PHP;

    class Node{
        public $name;
        public $longitude;
        public $latitude;
        //list of neighbours is a dictionary, where the key is the name of the neighbour and the value is the distance to it
        public $list_of_neighbours;
        public static $INT_MAX = 999999;

        function __construct($name, $latitude, $longitude){
            $this->name = $name;
            $this->longitude = $longitude;
            $this->latitude = $latitude;
            $this->list_of_neighbours = array();
        }

        function addNeighbour($neighbour_name, $distance_to_neighbour){
            $this->list_of_neighbours[$neighbour_name]=$distance_to_neighbour;
        }

        function getNeighbours(){
            return $this->list_of_neighbours;
        }

        function setName($new_name){
            $this->name = $new_name;
        }

        function getName(){
            return $this->name;
        }

        function setLongitude($longitude){
            $this->longitude = $longitude;
        }

        function getLongitude(){
            return $this->longitude;
        }

        function setLatitude($latitude){
            $this->latitude = $latitude;
        }

        function getLatitude(){
            return $this->latitude;
        }

        function updateDistanceToNeighbour($neighbour_name, $new_distance){
            if(array_key_exists($neighbour_name, $this->list_of_neighbours)){
                $this->list_of_neighbours[$neighbour_name] = $new_distance;
            }
        }

        function getDistanceToNeighbour($neighbour_name){
            if(array_key_exists($neighbour_name, $this->list_of_neighbours)){
                return $this->list_of_neighbours[$neighbour_name];
            }
            return self::$INT_MAX;
        }
    }
?>