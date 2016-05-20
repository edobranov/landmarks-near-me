// Purpose:   	Front end data processing and Google Maps API rendering for index.html
// Author:  	EVGENI C. DOBRANOV
// Date:  	5/17/2016

// +-----------------------------------------+
// | LISTENERS FOR ALL BUTTONS AND TEXTBOXES |
// + ----------------------------------------+
function myListeners()
{
	$("#address").on('keydown', function(event) {
		$("#lat").val("");
		$("#lng").val("");
	});

	$("#lat").on('keydown', function(event) {
		$("#address").val("");
	});

	$("#lng").on('keydown', function(event) {
		$("#address").val("");
	});

	$("#coords").on('click', function(event) {
		event.preventDefault();
		getLocation();
	});

	$("#clear").on('click', function(event) {
		event.preventDefault();
		$("#lat").val("");
		$("#lng").val("");
	});

	$(".btn-lg").on('click', function(event) {
		event.preventDefault();
		resolveValues();
	});

	$("#previous").on('click', function(event) {
		event.preventDefault();
		previousRequests();
	});
}

// +-------------------------------------------------------+
// | SET MAP PARAMETERS AND CREATE ERMPTY ARRAY OF MARKERS |
// + ------------------------------------------------------+
function renderMap()
{
	myMap = new google.maps.Map(document.getElementById('map_canvas'),
		{
			zoom: 		6,
			center: 	new google.maps.LatLng (42.010321, -74.531338),
			mapTypeId: 	google.maps.MapTypeId.ROADMAP
		});

	myMarkers = [];
}

// +--------------------------------------------------+
// | GET THE USER'S LOCATION AND CALL centerAndMark() |
// + -------------------------------------------------+
function getLocation()
{
	if (navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(function(position)
		{
			$("#lat").val(position.coords.latitude.toFixed(7));
			$("#lng").val(position.coords.longitude.toFixed(7));

			var myCoords = new google.maps.LatLng(
			{
				lat: Number($("#lat").val()),
				lng: Number($("#lng").val())
			});

			centerAndMark(myCoords);
		})
	}

	else { alert("Agh, your browser's a tad old for location services. Try just entering stuff instead, sorry!"); }
}

// +-------------------------------------------------+
// | PROCESS EITHER THE ADDRESS -OR- THE COORDINATES |
// + ------------------------------------------------+
function resolveValues()
{
	// Instantiate the geocoder that will translate between addresses and coordinates
	var geocoder = new google.maps.Geocoder();

	// Do this stuff if the address is valid and any one of the coordinates is 0 or a non-number value
	// (i.e. - processing for the address box given that the coordinates aren't capable of being processed)
	if ($("#address").val() && (isNaN(Number($("#lat").val())) || isNaN(Number($("#lng").val())) ||
		Number($("#lat").val()) == 0 || Number($("#lng").val()) == 0))
	{
		// Geocode the address into coordinates using Google Maps API
		geocoder.geocode( { 'address' : $("#address").val() }, function(results, status)
		{
			// If status code is OK and there's an address to be found
			if (status == google.maps.GeocoderStatus.OK && results[0])
			{
				var myCoords	= results[0]["geometry"]["location"];
				var myLat 		= myCoords.lat();
				var myLng 		= myCoords.lng();
				
				$("#lat").val(myLat.toFixed(7));	// Populate the latitude box
				$("#lng").val(myLng.toFixed(7));	// Populate the longitude box

				centerAndMark(myCoords);	// Call this function (center on the address, etc.)
				sendToServer(myCoords);		// Call this function (send coordinates to the server)
			}

			// Bad status handling
			else if (status == "ZERO_RESULTS")
				alert("Whoops, no results were found! Try again by changing the address around a bit.");
			else if (status == "OVER_QUERY_LIMIT")
				alert("Whoops, the query limit was exceeded!");
			else if (status == "REQUEST_DENIED")
				alert("Whoops, the request was denied :(");
			else if (status == "INVALID_REQUEST")
				alert("Whoops, the request was invalid on my end of things. Contact me if this happened!");
			else
				alert("Whoops, the geocode was not successful for the following reason: " + status);
		})
	}

	// Do this stuff if the coordinates are valid numbers and non-zero
	// (i.e. - will supercede anything in the address box)
	else if ( !isNaN(Number($("#lat").val())) && !isNaN(Number($("#lng").val())) && 
		Number($("#lat").val()) != 0 && Number($("#lng").val()) != 0)
	{
		// Create LatLng object from values in coordinate boxes
		var myCoords = new google.maps.LatLng(
		{
				lat: Number($("#lat").val()),
				lng: Number($("#lng").val())
		});

		// Do reverse-geocoding to get an address out of the coordinates
		geocoder.geocode( { 'location' : myCoords }, function(results, status)
		{
			// If status is OK and there's a result, populate the address box with it
			if (status == google.maps.GeocoderStatus.OK && results[0])
				$("#address").val(results[0].formatted_address);
			// Otherwise do error handling
			else if (status == "ZERO_RESULTS")
				$("#address").val("No nearby addresses found :(");
			else if (status == "OVER_QUERY_LIMIT")
				alert("Whoops, the query limit was exceeded!");
			else if (status == "REQUEST_DENIED")
				alert("Whoops, the request was denied :(");
			else if (status == "INVALID_REQUEST")
				alert("Whoops, the request was invalid on my end of things. Contact me if this happened!");
			else
				alert("Whoops, the geocode was not successful for the following reason: " + status);

		});

		centerAndMark(myCoords);	// Call this function (center on the address, etc.)
		sendToServer(myCoords); 	// Call this function (send coordinates to the server)
	}
	
	// Otherwise the elements MUST be invalid, so let the user know
	else {
		alert("Please enter valid fields! (at least the address -OR- both coordinates as numbers :)");
	}
}

// +------------------------------------------------------------------+
// | CENTER THE MAP OBJECT AND PROVIDE A MARKER AND ICON FOR THE USER |
// + -----------------------------------------------------------------+
function centerAndMark(myCoords)
{
	clearMarkers();				// Clear any previous markers from past searches

	myMap.setCenter(myCoords);	// Center on the desired coordinates

	// Create custom icon for the marker (see next variable)
	var myIcon = {
		url: "address_marker.png",
		scaledSize: new google.maps.Size(65, 65),
	}

	// Create custom marker (automatically placed using the constructor)
	var myMarker = new google.maps.Marker({
		position: myCoords,
		map: myMap,
		icon: myIcon,
		animation: google.maps.Animation.DROP,
		zIndex: 2,
		title: "You!"
	});

	// 
	//myMarker.setMap(myMap);
	myMap.setZoom(14);

	myMarkers.push(myMarker);
}

// +---------------------------------------------------------------------+
// | REMOVE ALL MARKERS AND EMPTY THE ARRAY OF MARKERS (FOR NEW QUERIES) |
// + --------------------------------------------------------------------+
function clearMarkers()
{
	for (var i = 0; i < myMarkers.length; i++)
		myMarkers[i].setMap(null);	// Removes appearance from the map

	myMarkers.length = 0;
}

// +------------------------------------------------------------------+
// | CENTER THE MAP OBJECT AND PROVIDE A MARKER AND ICON FOR THE USER |
// + -----------------------------------------------------------------+
function sendToServer(myCoords)
{
	// New XMLHttpRequest object via AJAX
	var request = new XMLHttpRequest();
	// Open the POST route designated in server.js
	request.open("POST", "../sendLocation", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	// When the request receives a change in state and it's 4 (and request status is
	// 200), then call the addToMap() function which parses through the data
	request.onreadystatechange = function ()
	{
		if (request.readyState == 4 && request.status == 200)
			addToMap(request.responseText, myCoords);
	}

	// Send the desired values via POST (including the value from the slider)
	radius = document.getElementById("slider").value;
	request.send("lat=" + myCoords.lat() + "&lng=" + myCoords.lng() + "&radius=" + radius);
}

// +-------------------------------------------------------------+
// | PARSE THROUGH LANDMARK DATA AND ADD LANDMARK MARKERS TO MAP |
// + ------------------------------------------------------------+
function addToMap(data, myCoords)
{
	// Important to note that all info windows seen are actually just one info window,
	// which is repurposed for each marker
	var tempInfoWindow = new google.maps.InfoWindow();

	data = JSON.parse(data);	// Redefine the data as a parsed version (now an array)

	// If there are no landmarks, create a little "chat bubble" above the user's marker to let them know
	if (data["landmarks"].length == 0)
	{
		tempInfoWindow.setContent("<h4>Hmph, seems pretty lonely around here ... Try again!<br>" + 
									"(make sure to look in the northeastern US)</h4>");
		window.setTimeout(function(){
			tempInfoWindow.open(myMap, myMarkers[0]);
		}, 600);	
	}

	// Otherwise parse through the data and store all relevant information for each one
	else
	{
		for (var i = 0; i < data["landmarks"].length; i++)
		{
			var tempName 	 = data["landmarks"][i]["properties"]["Location_Name"];
			var tempDetails  = data["landmarks"][i]["properties"]["Details"];
			var tempLat 	 = data["landmarks"][i]["geometry"]["coordinates"]["1"];
			var tempLng 	 = data["landmarks"][i]["geometry"]["coordinates"]["0"];
			var tempDistance = coordDistance(myCoords.lat(), myCoords.lng(), tempLat, tempLng).toFixed(2);

			var tempDetails  = "<h4 style='color:blue;'>DISTANCE FROM YOU: " + tempDistance + " MILES AWAY</h4>" + tempDetails;
			
			var tempIcon = {
				url: "landmark_marker.png",
				scaledSize: new google.maps.Size(35, 35),
				origin: new google.maps.Point(0, 0),
				anchor: new google.maps.Point(0, 0)
			}

			// This function actually adds the markers to the map with small delays
			dropMarkersFancy(tempLat, tempLng, tempIcon, tempName, tempInfoWindow, tempDetails, tempDistance, i*120);
		}
	}
}

// +-----------------------------------------------------+
// | ADD MARKERS TO THE MAP WITH SMALL DELAYS IN BETWEEN |
// + ----------------------------------------------------+
function dropMarkersFancy(tempLat, tempLng, tempIcon, tempName, tempInfoWindow, tempDetails, tempDistance, timeout)
{
	// The delaying function (native to JavaScript)
	window.setTimeout(function()
	{
		// Create the temporary marker for the single landmark with relevant data
		var tempMarker = new google.maps.Marker(
		{
			position: {lat: tempLat, lng: tempLng},
			map: myMap,
			animation: google.maps.Animation.DROP,
			zIndex: 1,
			icon: tempIcon,
			title: tempName + "\n(" + tempDistance + " miles away)"
		});

		myMarkers.push(tempMarker);		// Add to the array (for removing later if need be)

		// Add a listener to the marker using JavaScript closure to avoid reference to just the last element in
		// the array (this listener will call displaySingleMarker() on click)
		tempMarker.addListener('click', function(tempMarker, tempInfoWindow, tempDetails) {
			return function()
			{
				displaySingleMarker(tempMarker, tempInfoWindow, tempDetails);
			}
		}(tempMarker, tempInfoWindow, tempDetails));

	}, timeout);
}

// +-------------------------------+
// | DISPLAYS JUST ONE INFO WINDOW |
// + ------------------------------+
function displaySingleMarker(tempMarker, tempInfoWindow, tempDetails)
{
	// This is migrated here to avoid conflict with tempInfoWindow in previous functions
	tempInfoWindow.setContent(tempDetails);
	tempInfoWindow.open(myMap, tempMarker);
}

// +------------------------------------------------------+
// | CALCULATES DISTANCE BETWEEN TWO COORDINATES ON EARTH |
// +------------------------------------------------------+
function coordDistance(currentLat, currentLng, tempLat, tempLng)
{
	// Formula and code found here:
	// http://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
	var R 		= 6371;
	var x1 		= tempLat - currentLat;
	var dLat 	= x1 * Math.PI / 180;
	var x2 		= tempLng - currentLng;
	var dLon	= x2 * Math.PI / 180;  
	var a 		= Math.sin(dLat/2) * Math.sin(dLat/2) + 
					Math.cos(currentLat * Math.PI / 180) * Math.cos(tempLat * 
					Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);  
	var c 		= 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d 		= R * c;

	return d * 0.621371;
}

// +------------------------------------------------------+
// | CALL SERVER TO SERVE HTML WITH ALL PREVIOUS REQUESTS |
// +------------------------------------------------------+
function previousRequests()
{
	//window.location.href = "/previousRequests";
	window.open("/previousRequests", '_blank');
}
