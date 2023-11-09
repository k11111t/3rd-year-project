# 3rd year project
 My final year project for my university degree.
 
 Web application displays the map of the Kilburn building (Computer Science building on the University of Manchester campus). 
 
- The application provides timetable information and availability of rooms and finds the shortest path between rooms.
- The indoor map model was created based on the floor plan and the internal graph representation of the traversable footpath was modelled in QGIS and exported in the GeoJSON format.
- MapboxAPI was used on the front end to visualise this data, the data is stored externally on the MapboxAPI cloud.
- Optimised the A* shortest path algorithms using a bidirectional search and the heuristic function.
- Created relational SQL databases and shortest path search algorithm on the back end and managed asynchronous calls to the Mapbox API and the database on the front end.
- Applied unit testing to verify the algorithm’s correctness and user testing to ensure the optimal User Experience

Preview of how the floor layout was modelled:
![image](https://github.com/k11111t/3rd-year-project/assets/68909530/6029d309-72f7-47e3-b04a-40c2adb53b33)

Preview of how the traversible path was modelled:
![image](https://github.com/k11111t/3rd-year-project/assets/68909530/ea2c2474-80d3-473b-9f1c-c18c67d2deae)

Web app preview:
![image](https://github.com/k11111t/3rd-year-project/assets/68909530/f25e1ab5-e16d-48e2-9ddc-fd9c0fb8c10e)




