// Filename:  		server.js
// Description:   	An app that shows landmarks near the user
// Author:  		EVGENI C. DOBRANOV
// Date:  			5/17/2016

var express 	= require('express');		// Calls the express module (returns an exports object)
var app 		= express();				// Defines our app using express
var bodyParser	= require('body-parser');	// To use HTTP query or post parameters

// Initialize the body parser (lets us get data from POST) and CORS for cross domain accessing of data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(request, response, next) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// Initialize the MongoDB client and establish a connection to the database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHW_URL || 'mongodb://localhost/landmarks-near-me';
var MongoClient = require('mongodb').MongoClient, format = ('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

// +------------------------------------+
// | SERVE THE STATIC HTML LANDING PAGE |
// +------------------------------------+
app.use(express.static(__dirname + '/public'));

// +-------------------------------------------+
// | POST ROUTE FOR SENDING LOCATION TO SERVER |
// + ------------------------------------------+
app.post('/sendLocation', function(request, response)
{
	// Store the three primary credentials
	var lat 	= request.body.lat;
	var lng 	= request.body.lng;
	var radius	= request.body.radius;	// Radius in miles

	// If any one of them is invalid, don't process the bad data!
	if (isNaN(lat) || isNaN(lng))
		response.send('{"error":"Whoops, something is wrong with your data!"}');
	else
	{
		var JSONarray = {};		// Empty JSON array (to be returned later)

		// Going to insert this into the checkins
		var toInsert = {"lat": lat, "lng": lng, "radius": radius, "created_at": Date() };

		// Insert the above info into the "checkins" collection in the database
		db.collection('checkins').insert(toInsert);

		// To retrieve the relevant data from the landmarks, start with 2dsphere Mongo indexing
		db.collection('landmarks').createIndex({'geometry':"2dsphere"}, function(err)
		{
			if (err) throw err;

			// Query the landmarks within desired number of mile of the coordinates
			var cursor = db.collection('landmarks').find(
			{ geometry:
				{ $near:
					{ $geometry:
						{ type : "Point", coordinates: [Number(lng), Number(lat)] },
							$maxDistance: radius * 1609.344	// Radius is now in meters
					}
				}
			});

			// Turns the previous query into a JSON string and sends it in the response
			cursor.toArray(function(err, docs)
			{			
				if (err) throw (err);

				JSONarray["landmarks"] = docs;
				response.send(JSON.stringify(JSONarray));
			});
		});

	}
});

// GET route for the default landing page (return an HTML page)
app.get('/previousRequests', function(request, response)
{
	// Initialize some formatting for the page
	var page = 	"<!DOCTYPE HTML>" +
				"<html>" +
					"<head>" +
						"<title>Previous Requests</title>" +
					"</head>" +
					"<body>" +
						"<h1>Previous Requests Made On This Website</h1><hr>";

	// Find all the documents in the "checkins" collection
	var cursor = db.collection('checkins').find();

	// Turn the cursor into an array, and loop through backwards, adding each document
	cursor.toArray(function(err, docs)
	{
		for (var i = docs.length - 1; i >= 0; i--)
			{
			page += "<p><b style='color:blue';>" + docs[i].lat + ", " + docs[i].lng + "</b> searched for a " +
					docs[i].radius + " mile radius on " + docs[i].created_at + "</p><hr>";
		}

		page += "</body></html>";	// Add closing tags
		response.send(page);		// Return the page to the user
	});
});

// Find the port number, and start the server on that port
var port = process.env.PORT || 5000
app.listen(port);
console.log("Magic happens on port " + port);