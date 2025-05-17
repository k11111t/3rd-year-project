# 3rd year project
 My final year project for my university degree.

 Tech Stack:
 - Frontend: HTML | JS | CSS | MapboxAPI
 - Backend: PHP | SQL | JSON
 
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

Main page:
- user can browse through the different floors of the Kilburn building
- they can move, rotate, zoom on the map
![Screenshot 2025-05-17 222635](https://github.com/user-attachments/assets/16495636-8ba1-4dc9-9d83-c651093d5f36)

Specific Floor page:
- user can search for a room by its name
- the matching rooms are highlighted
![Screenshot 2025-05-17 224201-cropped](https://github.com/user-attachments/assets/dac8d4fb-ff6b-4ebf-98f3-28c8391ce691)
- they can also look at the timetable and availability of the rooms
![Screenshot 2025-05-17 222745-cropped](https://github.com/user-attachments/assets/4143e402-04e5-441f-bf12-75b4331ab96d)
- user can find a shortest path between 2 rooms
![Screenshot 2025-05-17 222843-cropped](https://github.com/user-attachments/assets/9e2e2306-9a89-4955-95bb-a5c13c3817a1)
- the user can also change the attributes of the map, to accomodate their accessibility needs
![Screenshot 2025-05-17 223004-cropped](https://github.com/user-attachments/assets/79c76ef4-51c2-4e80-b92b-9c70424bb8c3)
