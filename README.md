# Virtual map of Kilburn
 My final year project for my BSc in Computer Science at University of Manchester - dissertation.

 ## Tech Stack:
 - Frontend: HTML | JS | CSS | MapboxAPI
 - Backend: PHP | SQL | JSON

## Description
 
 Web application displays the map of the Kilburn building (Computer Science building on the University of Manchester campus). 
 
- The application provides timetable information and availability of rooms and finds the shortest path between rooms.
- The indoor map model was created based on the floor plan and the internal graph representation of the traversable footpath was modelled in QGIS and exported in the GeoJSON format.
- MapboxAPI was used on the front end to visualise this data, the data is stored externally on the MapboxAPI cloud.
- Optimised the A* shortest path algorithms using a bidirectional search and the heuristic function.
- Created relational SQL databases and shortest path search algorithm on the back end and managed asynchronous calls to the Mapbox API and the database on the front end.
- Applied unit testing to verify the algorithm’s correctness and user testing to ensure the optimal User Experience

## Data modelling

- Preview of how the floor layout was modelled:<br>
<img src='https://github.com/k11111t/3rd-year-project/assets/68909530/6029d309-72f7-47e3-b04a-40c2adb53b33' width='80%' />

- Preview of how the traversible path was modelled:
<img src='https://github.com/k11111t/3rd-year-project/assets/68909530/ea2c2474-80d3-473b-9f1c-c18c67d2deae' width='80%' />

## Main page:
- user can browse through the different floors of the Kilburn building
- they can move, rotate, zoom on the map 
<img src='https://github.com/user-attachments/assets/764d4ca7-231a-4c97-9eb6-e8527b0feb76' width='80%' />

## Specific Floor page:
- user can search for a room by its name
- the matching rooms are highlighted <br>
<img src='https://github.com/user-attachments/assets/760b0091-c4e0-4f54-b402-d8aa46fdb8ed' width='80%' /> <br>

- they can also look at the timetable and availability of the rooms <br>
<img src='https://github.com/user-attachments/assets/4143e402-04e5-441f-bf12-75b4331ab96d' width='80%' /> <br>
- user can find a shortest path between 2 rooms <br>
<img src='https://github.com/user-attachments/assets/47c7e6e6-e3d0-4f8d-8ac6-c75b6de2aa55' width='80%' /> <br>
- the user can also change the attributes of the map, to accomodate their accessibility needs <br>
<img src='https://github.com/user-attachments/assets/5fab0e42-4e3d-4ba2-9b16-1e671a5facc4' width='80%' /> <br>
