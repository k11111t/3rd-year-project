<?php

    class TestGraph extends \PHPUnit\Framework\TestCase{
        
        public function testAddOneNode(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);

            $graph->addOneNode($node);

            $this->assertEquals(1, count($graph->getListOfNodes()));
            $this->assertTrue(array_key_exists($node_name, $graph->getListOfNodes()));
            $this->assertEquals($node, $graph->getListOfNodes()[$node_name]);
        }

        public function testAddMultipleNodes(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);
            
            $node_name_2 = "B";
            $node_latitude_2 = 2;
            $node_longitude_2 = 4;
            $node_2 = new \App\PHP\Node($node_name_2, $node_latitude_2, $node_longitude_2);

            $graph->addMultipleNodesToGraph([$node, $node_2]);

            $this->assertEquals(2, count($graph->getListOfNodes()));
            $this->assertTrue(array_key_exists($node_name, $graph->getListOfNodes()));
            $this->assertTrue(array_key_exists($node_name_2, $graph->getListOfNodes()));
            $this->assertEquals($node, $graph->getListOfNodes()[$node_name]);
            $this->assertEquals($node_2, $graph->getListOfNodes()[$node_name_2]);
        }

        public function testGetNodeByNameValid(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);
            
            $graph->addOneNode($node);

            $this->assertEquals($node, $graph->getNodeByName($node_name));
        }

        public function testGetNodeByNameInvalid(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);
            
            $graph->addOneNode($node);
            $invalid_node_name = "B";

            $this->assertEquals(null, $graph->getNodeByName($invalid_node_name));
        }

        public function testAddNeighbourToNode(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);

            $neighbour_name = "B";
            $distance_to_neighbour = 10;

            $graph->addOneNode($node);
            $graph->addNeighbourToNode($node_name, $neighbour_name, $distance_to_neighbour);

            $this->assertTrue(array_key_exists($node_name, $graph->getListOfNodes()));
            $this->assertEquals(array($neighbour_name => $distance_to_neighbour), 
                $graph->getListOfNodes()[$node_name]->getNeighbours());
        }

        public function testupdateNodeDistanceToNeighbourValid(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);

            $neighbour_name = "B";
            $distance_to_neighbour = 10;

            $graph->addOneNode($node);
            $graph->addNeighbourToNode($node_name, $neighbour_name, $distance_to_neighbour);

            $new_distance = 100;
            $graph->updateNodeDistanceToNeighbour($node_name, $neighbour_name, $new_distance);

            $this->assertEquals($new_distance, $graph->getNodeDistanceToNeighbour($node_name, $neighbour_name));
        }

        public function testUpdateNodeDistanceToNeighbourInvalidNeighbour(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);

            $neighbour_name = "B";
            $distance_to_neighbour = 10;

            $graph->addOneNode($node);
            $graph->addNeighbourToNode($node_name, $neighbour_name, $distance_to_neighbour);

            $invalid_name = "C";
            $new_distance = 100;
            $graph->updateNodeDistanceToNeighbour($node_name, $invalid_name, $new_distance);

            $this->assertEquals($distance_to_neighbour, $graph->getNodeDistanceToNeighbour($node_name, $neighbour_name));
        }

        public function testUpdateNodeDistanceToNeighbourInvalidNodeName(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);

            $neighbour_name = "B";
            $distance_to_neighbour = 10;

            $graph->addOneNode($node);
            $graph->addNeighbourToNode($node_name, $neighbour_name, $distance_to_neighbour);

            $invalid_name = "C";
            $new_distance = 100;
            $graph->updateNodeDistanceToNeighbour($invalid_name, $neighbour_name, $new_distance);

            $this->assertEquals($distance_to_neighbour, $graph->getNodeDistanceToNeighbour($node_name, $neighbour_name));
        }

        public function testGetNodeDistanceToNeighbour(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);

            $neighbour_name = "B";
            $distance_to_neighbour = 10;

            $graph->addOneNode($node);
            $graph->addNeighbourToNode($node_name, $neighbour_name, $distance_to_neighbour);

            $this->assertEquals($distance_to_neighbour, $graph->getNodeDistanceToNeighbour($node_name, $neighbour_name));
        }
        
        public function testGetNodeDistanceToNeighbourInvalidNeighbour(){
            $graph = new \App\PHP\Graph();

            $node_name = "A";
            $node_latitude = 1;
            $node_longitude = 2;
            $node = new \App\PHP\Node($node_name, $node_latitude, $node_longitude);

            $neighbour_name = "B";
            $distance_to_neighbour = 10;

            $graph->addOneNode($node);
            $graph->addNeighbourToNode($node_name, $neighbour_name, $distance_to_neighbour);

            $invalid_name = "C";
            $this->assertEquals(\App\PHP\Node::$INT_MAX, $graph->getNodeDistanceToNeighbour($node_name, $invalid_name));
        }
    }

?>