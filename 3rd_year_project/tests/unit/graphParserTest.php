<?php

    class TestGraphParser extends \PHPUnit\Framework\TestCase{
        public function testSetFloorName(){
            $floor_name = "Kilburn_G";
            $graph_parser = new \App\PHP\GraphParser($floor_name, "");
            $new_name = "Kilburn_1";

            $graph_parser->setFloorName($new_name);

            $this->assertEquals($new_name, $graph_parser->getFloorName());
        }

        public function testSetPath(){
            $floor_name = "Kilburn_G";
            $graph_parser = new \App\PHP\GraphParser($floor_name, "");
            
            $new_file_path = "../";

            $graph_parser->setPath($new_file_path);

            $this->assertEquals($new_file_path, $graph_parser->getPath());
        }

        public function testGetNodesFromFileContentsOneNode(){
            $floor_name = "Kilburn_G";
            $graph_parser = new \App\PHP\GraphParser($floor_name, "");
            $file_contents = '{
                "type": "FeatureCollection",
                "name": "Kilburn_G_corridor_nodes",
                "features": [
                { "type": "Feature",
                    "properties": { 
                         "name": "Node_1" 
                    }, "geometry": { 
                        "type": "Point", 
                        "coordinates": [ -2.23455302010034, 53.467617917301773 ] 
                    } 
                }]}
            ';

            $list_of_nodes = $graph_parser->getNodesFromFileContents($file_contents);

            $node = new \App\PHP\Node("Node_1", -2.23455302010034, 53.467617917301773);
            $graph = new \App\PHP\Graph();
            $graph->addOneNode($node);
            
            $this->assertEquals(array_values($graph->getListOfNodes()), $list_of_nodes);
        }

        public function testGetNodesFromFileContentsTwoNodes(){
            $floor_name = "Kilburn_G";
            $graph_parser = new \App\PHP\GraphParser($floor_name, "");
            $file_contents = '{
                "type": "FeatureCollection",
                "name": "Kilburn_G_corridor_nodes",
                "features": [
                { 
                    "type": "Feature",
                    "properties": { 
                         "name": "Node_1" 
                    }, 
                    "geometry": { 
                        "type": "Point", 
                        "coordinates": [ -2, 3 ] 
                    }
                },
                {
                    "type": "Feature",
                    "properties": { 
                         "name": "Node_2" 
                    }, 
                    "geometry": { 
                        "type": "Point", 
                        "coordinates": [ -1, 5 ]
                    }
                }
                ]}
            ';

            $list_of_nodes = $graph_parser->getNodesFromFileContents($file_contents);
            $node1 = new \App\PHP\Node("Node_1", -2, 3);
            $node2 = new \App\PHP\Node("Node_2", -1, 5);
            $graph = new \App\PHP\Graph();
            $graph->addMultipleNodesToGraph([$node1, $node2]);
            
            $this->assertEquals(array_values($graph->getListOfNodes()), $list_of_nodes);
        }

        public function testAddNeighboursToGraphFromFile(){
            $floor_name = "Kilburn_G";
            $graph_parser = new \App\PHP\GraphParser($floor_name, "");
            $graph = new \App\PHP\Graph();

            $node1_name = "One";
            $node1 = new \App\PHP\Node($node1_name, 0, 0);

            $node2_name = "Two";
            $node2 = new \App\PHP\Node($node2_name, 1, 1);

            $graph->addMultipleNodesToGraph([$node1, $node2]);

            $file_contents = '{
                "type": "FeatureCollection",
                "name": "Kilburn_G_corridor_door_edges",
                "features": [
                { 
                    "type": "Feature",
                    "properties": { 
                         "i": "One", 
                         "j": "Two", 
                         "length": 0.0019267537989211651
                    }
                }]}';

            $graph_parser->addNeighboursToGraphFromFile($file_contents, $graph);

            $node1_neighbours = $graph->getNodeByName($node1_name)->getNeighbours();

            $this->assertEquals($node1_neighbours, array($node2_name => 0.0019267537989211651));
        }
    }

?>