<?php

    class TestDijkstra extends \PHPUnit\Framework\TestCase{
        public $graph;
        public $list_of_node_names;
        public static $NUM_OF_NODES = 6;

        protected function setUp() : void {            
            $this->list_of_node_names = array();
            for($i=0; $i<self::$NUM_OF_NODES; $i++){
                array_push($this->list_of_node_names, "node_" . strval($i));
            }
            
            $list_of_nodes = array();
            foreach($this->list_of_node_names as $key=> $value){
                $list_of_nodes[$value] = new \App\PHP\Node($value, 0, 0);
            }

            $this->graph = new \App\PHP\Graph();
            $this->graph->addMultipleNodesToGraph($list_of_nodes);
        }

        public function testInitialiseTentativeDistances(){
            $index = 0 ;
            $start_node_name = $this->list_of_node_names[$index];
            $tentative_distances = \App\PHP\Dijkstra::initialiseTentativeDistances($start_node_name, $this->graph->getListOfNodes());
            
            for($i=1; $i<self::$NUM_OF_NODES; $i++){
                $this->assertEquals(\App\PHP\Node::$INT_MAX, $tentative_distances[$this->list_of_node_names[$i]]);
            }

            $this->assertEquals($tentative_distances[$start_node_name], 0);
        }

        public function testInitialisePredecessorMap(){
            $index = 0 ;
            $start_node_name = $this->list_of_node_names[$index];
            $predecessor_map = \App\PHP\Dijkstra::initialisePredecessorMap($start_node_name, $this->graph->getListOfNodes());

            for($i=1; $i<self::$NUM_OF_NODES; $i++){
                $this->assertNull($predecessor_map[$this->list_of_node_names[$i]]);
            }
            
            $this->assertEquals($predecessor_map[$start_node_name], $start_node_name);
        }

        public function testInitialiseFinishedNodes(){ 
            $finished_nodes = \App\PHP\Dijkstra::initialiseFinishedNodes($this->graph->getListOfNodes());

            foreach($finished_nodes as $key=>$value){
                $this->assertFalse($finished_nodes[$key]);
            }
        }

        public function testReturnPathFromPredecessorMapNoPath(){
            $start_node_name = "node_s";
            $end_node_name = "node_e";

            //make predecessor map without path
            $predecessor_map = array();
            $predecessor_map[$start_node_name] = $start_node_name;
            $predecessor_map[$end_node_name] = null;

            $path = \App\PHP\Dijkstra::returnPathFromPredecessorMap($start_node_name, $end_node_name, $predecessor_map);

            $this->assertEquals([], $path);
        }

        public function testReturnPathFromPredecessorMapCyclicPath(){
            $start_node_name = "node_s";
            $end_node_name = "node_e";
            $node1 = "node_1";
            $node2 = "node_2";

            //make cyclic predecessor map
            $predecessor_map = array();
            $predecessor_map[$start_node_name] = $start_node_name;
            $predecessor_map[$end_node_name] = $node2;
            $predecessor_map[$node2] = $node1;
            $predecessor_map[$node1] = $end_node_name;

            $path = \App\PHP\Dijkstra::returnPathFromPredecessorMap($start_node_name, $end_node_name, $predecessor_map);

            $this->assertEquals([], $path);
        }

        public function testReturnPathFromPredecessorMapNormalPath(){
            $start_node_name = "node_s";
            $end_node_name = "node_e";
            $node1 = "node_1";
            $node2 = "node_2";

            $predecessor_map = array();
            $predecessor_map[$start_node_name] = $start_node_name;
            $predecessor_map[$end_node_name] = $node1;
            $predecessor_map[$node1] = $node2;
            $predecessor_map[$node2] = $start_node_name;

            $path = \App\PHP\Dijkstra::returnPathFromPredecessorMap($start_node_name, $end_node_name, $predecessor_map);

            $this->assertEquals([$end_node_name, $node1, $node2, $start_node_name], $path);
        }

        public function testExecuteDijkstraNormal(){
            $list_of_nodes = $this->graph->getListOfNodes();
            $start_node = $this->list_of_node_names[0];
            $end_node = $this->list_of_node_names[self::$NUM_OF_NODES-1];

            $distance = 10;
            for($i=1; $i<self::$NUM_OF_NODES-1; $i++){
                $neighbour_name = $this->list_of_node_names[$i];
                $this->graph->addNeighbourToNode($start_node, $neighbour_name, $distance);
                $this->graph->addNeighbourToNode($neighbour_name, $end_node, $distance);
            }

            //overwrite the old distance
            $ideal_node = $this->list_of_node_names[1];
            $new_distance = 1;
            $this->graph->updateNodeDistanceToNeighbour($ideal_node, $end_node, $new_distance);

            $dijkstra = new \App\PHP\Dijkstra($start_node, $end_node, $this->graph);
            
            $shortest_path = $dijkstra->executeDijkstra();

            $this->assertEquals([$end_node, $ideal_node, $start_node], $shortest_path);
        }

        public function testExecuteDijkstraCyclic(){
            $list_of_nodes = $this->graph->getListOfNodes();
            $start_node = $this->list_of_node_names[0];
            $end_node = $this->list_of_node_names[self::$NUM_OF_NODES-1];

            $distance = 10;
            for($i=1; $i<self::$NUM_OF_NODES-1; $i++){
                $neighbour_name = $this->list_of_node_names[$i];
                $this->graph->addNeighbourToNode($start_node, $neighbour_name, $distance);
                $this->graph->addNeighbourToNode($neighbour_name, $end_node, $distance);
            }

            //overwrite the old distance
            $ideal_node = $this->list_of_node_names[1];
            $new_distance = 1;
            $this->graph->updateNodeDistanceToNeighbour($ideal_node, $end_node, $new_distance);

            $dijkstra = new \App\PHP\Dijkstra($start_node, $end_node, $this->graph);
            
            $shortest_path = $dijkstra->executeDijkstra();

            $this->assertEquals([$end_node, $ideal_node, $start_node], $shortest_path);
        }
    }

?>