# Landmarks Near Me

### Author

Evgeni Dobranov

### Description

A web app that offers location services (intended for places generally northeast of Pennsylvania) and displays landmarks near that location from the NPS.
A user can enter a search address just like on Google Maps, or directly input coordinates (including their own ones using the button below the search box). Inputting into either the address box -OR- either of the coordinates boxes will clear the other. If both are filled in after a search, the coordinates take priority.

### Technologies Used

##### Front End

* __Bootstrap__ (huge leverage in designing the interface)
* __Google Maps API__ (Map rendering and marking, Regular & Reverse Geocoding)
* __JavaScript__ + __jQuery__ (All around data processing and event handling)
* __AJAX__ (XMLHttpRequest Object and communicating with backend)

##### Back End

* __Node.js__ + __Express Framework__ (Core runtime environment & server framework)
* __MongoDB__ (Database for storing JSON landmark data and checkins - used via Node.js driver here)
* __HerokuApp__ (cloud PaaS for hosting)

### Structure Overview

The user is shown an index.html page with search boxes & buttons on the left, and a map on the right. All of the search boxes & buttons have event listeners bound to them, which trigger functions in render.js

The main functionality lies behind the "Find the landmarks!" button, which calls a function in render.js that resolves the values into coordinates (if they're not already coordinates), and sends either the address entered -OR- the coordinates to server.js via the /sendLocation route. The server.js file then searches the MongoDB database for the pre-stored JSON file containing the landmarks, and returns the relevant ones as a JSON string.

Now render.js loops through the landmarks and creates an info window, markers, etc. and drops them onto the map. From here, the user can look at these markers for more info or simply enter a new location query.