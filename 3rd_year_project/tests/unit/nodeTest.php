<?php

    class TestNode extends \PHPUnit\Framework\TestCase{
        public function testNodeSetName(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $new_name = "B";
            $node->setName($new_name);

            $this->assertEquals($node->getName(), $new_name);
        }
    
        public function testNodeSetLongitude(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);   

            $new_longitude = 100;
            $node->setLongitude($new_longitude);

            $this->assertEquals($node->getLongitude(), $new_longitude);
        }

        public function testNodeSetLatitude(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $new_latitude = 100;
            $node->setLatitude($new_latitude);

            $this->assertEquals($node->getLatitude(), $new_latitude);
        }

        public function testAddOneNeighbour(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $neighbour_name = "N";
            $distance_to_neighbour = 10;
            $node->addNeighbour($neighbour_name, $distance_to_neighbour);

            $this->assertTrue(array_key_exists($neighbour_name, $node->getNeighbours()));
            $this->assertEquals(1, count($node->getNeighbours()));
        }

        public function testNeighbourWeight(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $neighbour_name = "N";
            $distance_to_neighbour = 100;
            $node->addNeighbour($neighbour_name, $distance_to_neighbour);

            $this->assertTrue(array_key_exists($neighbour_name, $node->getNeighbours()));
            $this->assertEquals($distance_to_neighbour, $node->getNeighbours()[$neighbour_name]);
        }

        public function testAddMultipleNeighbours(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $neighbour_name = "N";
            $distance_to_neighbour = 10;
            $node->addNeighbour($neighbour_name, $distance_to_neighbour);

            $neighbour_name_2 = "M";
            $distance_to_neighbour_2 = 20;
            $node->addNeighbour($neighbour_name_2, $distance_to_neighbour_2);

            $this->assertTrue(array_key_exists($neighbour_name, $node->getNeighbours()));
            $this->assertTrue(array_key_exists($neighbour_name_2, $node->getNeighbours()));
            $this->assertEquals(2, count($node->getNeighbours()));
        }

        public function testUpdateDistanceToNeighbourValid(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $neighbour_name = "N";
            $distance_to_neighbour = 10;
            $node->addNeighbour($neighbour_name, $distance_to_neighbour);
            $this->assertTrue(array_key_exists($neighbour_name, $node->getNeighbours()));

            $new_distance_to_neighbour = 20;
            $node->updateDistanceToNeighbour($neighbour_name, $new_distance_to_neighbour);

            $this->assertEquals($new_distance_to_neighbour, $node->getNeighbours()[$neighbour_name]);
        }

        public function testUpdateDistanceToNeighbourInvalid(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $neighbour_name = "N";
            $distance_to_neighbour = 10;
            $node->addNeighbour($neighbour_name, $distance_to_neighbour);
            $this->assertTrue(array_key_exists($neighbour_name, $node->getNeighbours()));

            $new_distance_to_neighbour = 20;
            $invalid_name = "M";
            $node->updateDistanceToNeighbour($invalid_name, $new_distance_to_neighbour);

            $this->assertEquals($distance_to_neighbour, $node->getNeighbours()[$neighbour_name]);
        }

        public function testGetDistanceToNeighbour(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $neighbour_name = "N";
            $distance_to_neighbour = 10;
            $node->addNeighbour($neighbour_name, $distance_to_neighbour);
            $this->assertTrue(array_key_exists($neighbour_name, $node->getNeighbours()));

            $this->assertEquals($distance_to_neighbour, $node->getDistanceToNeighbour($neighbour_name));
        }

        public function testGetDistanceToNeighbourInvalid(){
            $name = "A";
            $longitude = 10;
            $latitude = 10;
            $node = new \App\PHP\Node($name, $latitude, $longitude);

            $neighbour_name = "N";
            $distance_to_neighbour = 10;
            $node->addNeighbour($neighbour_name, $distance_to_neighbour);
            $this->assertTrue(array_key_exists($neighbour_name, $node->getNeighbours()));

            $invalid_name = "C";
            $this->assertEquals(\App\PHP\Node::$INT_MAX, $node->getDistanceToNeighbour($invalid_name));
        }

    }


?>