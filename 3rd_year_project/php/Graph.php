<?php

namespace App\PHP;

    class Graph{
        //list of nodes is a dictionary, where the keys are the nodes and the values are the objects associated to the name
        public $list_of_nodes;

        function __construct(){
            $this->list_of_nodes = array();
        }

        function addOneNode($node){
            $this->list_of_nodes[$node->name] = $node;
        }

        function addMultipleNodesToGraph($list_of_nodes){
            //make sure there are no dupliate names
            foreach($list_of_nodes as $value){
                if(in_array($value->name, $this->list_of_nodes)){
                    ;
                }
                else{
                    $this->addOneNode($value);
                }
            }
        }

        function getNodeByName($name){
            if(array_key_exists($name, $this->list_of_nodes)){
                return $this->list_of_nodes[$name];
            }
            else{
                return null;
            }
            
        }

        function addNeighbourToNode($name, $neighbour_name, $distance){
            $this->list_of_nodes[$name]->addNeighbour($neighbour_name, $distance);
        }

        function getListOfNodes(){
            return $this->list_of_nodes;
        }

        function updateNodeDistanceToNeighbour($name, $neighbour_name, $new_distance){
            if(array_key_exists($name, $this->list_of_nodes)){
                $this->list_of_nodes[$name]->updateDistanceToNeighbour($neighbour_name, $new_distance);
            }
        }

        function getNodeDistanceToNeighbour($name, $neighbour_name){
            if(array_key_exists($name, $this->list_of_nodes)){
                return $this->list_of_nodes[$name]->getDistanceToNeighbour($neighbour_name);
            }
            return Node::$INT_MAX;
        }
    }
?>