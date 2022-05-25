//---------------
//PAGE SCRIPT
//---------------

const SERVER_URL = 'http://138.68.243.184:8080';
// const SERVER_URL = 'http://localhost:8080';

//Initializes account type enum for method selection later
var AccountType = {
    FACEBOOK: 1,
    TWITTER: 2
};
var account;
var friendCoordList;
var twitterToken;
var coordsFound, coordsNeeded;
var coordsTotal;                //Used to store the total amount of requests needed to be made, decremented every time a coordinate could not be retrieved

//--------------------
//FUNCTION DECLARATIONS
//--------------------

//Initiates the app using the function contained in the attached script file.
function InitiateApp() {

    if (account === AccountType.FACEBOOK) {
        Output("Sorry, Facebook search is currently non-functioning.");
    }
    else if (account === AccountType.TWITTER) {
        EnableTwitterUsernameInput();
    }
}

//Initializes the search bar into which the user can input a location to search for friends
function InitializeSearchBar() {
    document.getElementById('searchUI').style.visibility = 'visible';
    DisableTwitterUsernameInput();
    //TODO: Hide all social media input elements, not just Twitter
    document.getElementById('submit').disabled = false;
    document.getElementById('searchbar').focus();
}

//Puts the array of objects that includes friends' coordinate values along with their usernames and listed location into the coordsNeeded variable
//and initiates the rate-limited search for coordinates in the list
function GetFriendsCoords(friendList, callback) {
    coordsFound = new Array();
    coordsNeeded = new Array();

    //Fill stack with friends
    for (i = 0; i < friendList.length; i++) {
      if (friendList[i].location.length > 0) {
        coordsNeeded.push(friendList[i]);
      }
    }

    coordsTotal = coordsNeeded.length;

    GetCoordsRateLimited(coordsFound, coordsNeeded, callback);
}

function TrimFriendsList(friendList)
{
    var fullList = friendList;
    var newList = new Array();

    for (i = 0; i < fullList.length; i++)
    {
        if (fullList[i].coords != null)
        {
            newList.push(fullList[i]);
        }
    }

    return newList;
}

/*
TWITTER FUNCTIONS
-----------------
*/

//Retrieves the Twitter user name from the search bar and initializes the search for the user's friends
function TwitterSubmitClick() {
    //Retrieve user name from search bar
    var username = encodeURIComponent(document.getElementById("txt-twitter-input").value);
    if (username.trim() === "") {
        Output("No user name was entered.");
        return;
    }

    //Locate user account
    console.log("Attempting to locate user account...");
    var userAccount;

    RetrieveTwitterUser(twitterToken, username, function (result) {

        userAccount = JSON.parse(result);
        console.log(userAccount);

        Output('User found: ' + userAccount.screen_name );
        Output('Number of friends: ' + userAccount.friends_count)

        if (userAccount.protected) {
          Output('User account is private. Friends of this user will not be able to be searched for their location. Please try another username.');
          return;
        }

        DisplayLoadingBar();

        //Identify friends
        FindTwitterFriends(username, function (result) {

            //A list of twitter users and their locations will be returned here

            var twitterFriends = JSON.parse(result);

            GetFriendsCoords(twitterFriends, function (result) {

                HideLoadingBar();

                //The same list of twitter users will be returned, with the addition of a coordinates property
                friendCoordList = TrimFriendsList(result);
                Output("A total of " + friendCoordList.length + " friends' coordinates were located.");
                //console.log(result);

                InitializeSearchBar();

            });

        });
    });
}

function FindTwitterFriends(username, callback) {

    RetrieveTwitterFriends(username, function (result) {
        console.log('Retrieving Twitter friends...');

        if (result.length == 0) {
            console.log('No friends retrieved.');
        }
        else {
            callback(result);
        }

    });

}

function GetFriendLocations(twitterFriendList, getCoords)
{
    //TEMPORARY
    testarray = new Array();
    var test = { "name": "Marisha", "location": "Seattle, WA" };
    testarray.push(test);

    getCoords(testarray);
//    return testarray;

}

function TwitterInit()
{
    document.getElementById('init-instructions').className+= " disabledDiv";   //Hides initial instructions
    account = AccountType.TWITTER;

    InitiateApp();

}

//Passed the script that holds the function to retrieve the bearer token
function AuthTwitterApp(callback) {
    //Send the credentials to the Twitter API with an HTTP POST request
    //This function is found in the twitter-authenticate.js script retrieved from the server.
    GetTwitterToken(function (token) {

        twitterToken = token;

        //TEMPORARY
        console.log('Twitter token retrieved as ' + twitterToken);

        if (twitterToken.length == 0) {
            console.log('No bearer token was retrieved.');
            callback(false);
        }

        //If a success response is received, return true
        callback(true);

    });

}

function Output(string, id) {
    var outbox = document.getElementById('output-log');
    var para = document.createElement('p');
    para.id = id || Date.now();
    para.textContent = string;
    outbox.appendChild(para);
}

//Receives a string containing HTML and appends it to the document as a paragraph
function OutputHTML(htmlString, id) {
    var outbox = document.getElementById('output-log');
    var para = document.createElement('p');
    para.id = id || Date.now();
    para.innerHTML = htmlString;
    outbox.appendChild(para);
}

function removeHTML(id) {
    const segment = document.getElementById(id);
    if (segment) {
        segment.parentElement.removeChild(segment);
    }
}

/**
 * Clears all previous output from the 'output-log' element
 */
function clearOutput() {
    const o = document.getElementById('output-log');
    o.innerHTML = '';
}

function EnableSearchBars() {
    document.getElementById("submit").disabled = false;
    document.getElementById("btn-twitter-input").disabled = false;
}

//Returns true if username is formatted correctly, false if it is formatted incorrectly
function CheckTwitterInput(input)
{

}

/*
GEOCODING FUNCTIONS
-------------------
*/

//Handles the search when user inputs a location to search for
function SubmitSearch()
{
    var inputtext = document.getElementById('searchbar').value;

    // Delete previous content
    clearOutput();

    DisplayLoadingBar();

    SendGeocodingRequest(inputtext, function (searchedCoords) {

        var searchedLocation = {
            'name': inputtext,
            'coords': searchedCoords[0]
        };

        //For all friend coordinates, find friends within the radius
        var friendsInRadius = FindWithinRadius(searchedLocation, GetRadius(), friendCoordList);

        HideLoadingBar();

        console.log("Radius search completed.");

        //display the list of friends' usernames and locations to the user
        Output("Friends found within specified radius:", 'twitter_header');
        ListFriends(friendsInRadius,);

    });

}

//A function that receives a list of friends and their info and displays it along with the link
function ListFriends(friendsInRadius, id)
{
    for (i = 0; i < friendsInRadius.length; i++)
    {
        //Create a thing of html and append it to the document body
        var htmlString = '<a href="' + friendsInRadius[i].url + '">' + friendsInRadius[i].screen_name + '</a>';
        OutputHTML(htmlString, id);

    }
}

//Retrieves an array of location data found for the inputted location and sends it to the callback.
function GetSearchCoords(inputtext, callback)
{
    //Get the coordinates values for the entered location
    var addressobj = { "address": inputtext };
    var searchcoords;
    var geocoder = new window.google.maps.Geocoder;
    geocoder.geocode(addressobj, function (results, status) {

        if (status === google.maps.GeocoderStatus.OK)
        {
            if (results[0] === null) {
                Output("No results found.");
                return;
            }

            //Parse response
            //OutLog("Results found: " + results.length);
            Output("Locations found: ");

            searchedCoords = new Array();
            for (i = 0; i < results.length; i++) {
                foundLoc = new Object();
                foundLoc.name = results[i].formatted_address;
                foundLoc.coords = { "lat": results[i].geometry.location.lat(), "lng": results[i].geometry.location.lng() };
                searchedCoords.push(foundLoc);
                Output(foundLoc.name);
            }

            callback(searchedCoords);
        }

    });
}

//A recursive function that finds a limited number of coordinates at a time before waiting 1 second and then running itself again on the remaining items in coordsNeeded
//coordsFound should be an array of Friend objects, coordsNeeded should be a stack of Friend objects
function GetCoordsRateLimited(coordsFound, coordsNeeded, callback)
{
    //TODO: Set up this entire process as server-side rather than client-side, to avoid the rate limit imposed on a single session.

    var RATE_LIMIT = 25;

    var limit = 0;
    if (coordsNeeded.length <= RATE_LIMIT) {
        limit = coordsNeeded.length;
        //console.log("Fewer than " + RATE_LIMIT + " coordinate results need to be searched.");
    }
    else {
        limit = RATE_LIMIT;
        //console.log("More than " + RATE_LIMIT + " coordinate results need to be searched.");
    }

    while (limit > 0)
    {
        var friend = coordsNeeded.pop();

            getFriendCoordinates(friend, function (result, friend) {
                friend.coords = result;
                coordsFound.push(friend);
                if (coordsFound.length == coordsTotal) {
                    callback(coordsFound);
                    //return;
                }
        });

        limit--;
    }


    if (coordsNeeded.length == 0)
    {
        return;
    }
    else {
        setTimeout(function () { GetCoordsRateLimited(coordsFound, coordsNeeded, callback) }, 1000);
    }

}

function getFriendCoordinates(friend, callback)
{
    var location = friend.location;
    //retrieveCoordsFromAPI(location, function (result) {
    //    callback(result);
    //});
    SendGeocodingRequest(location, function (result) {
        callback(result, friend);
    });
}

function SendGeocodingRequest(location, callback)
{
    let httpReq = new XMLHttpRequest();
    let encodedLocation = encodeURIComponent(location.trim());
    httpReq.open('GET', `${SERVER_URL}/geocoding?location=` + encodedLocation);
    httpReq.onreadystatechange = function () {
        if (httpReq.readyState == 4 && httpReq.status == 200)
        {
            if (httpReq.responseText == "Not found due to exceeding query limit")
            {
                HideLoadingBar();
                Output("ERROR: The administrator's geolocation query limit has been exceeded. Please try again tomorrow.");
                return;
            }
            var result = JSON.parse(httpReq.responseText);
            callback(result);
        }
    };
    httpReq.send();
}

//Retrieves <= one set of coordinates from the Geocoding API for a provided location
function retrieveCoordsFromAPI(location, callback)
{
    var loc = location;
    var cb = callback;
    var locObj = { "address": location };
    var coords = new Array();
    console.log("Requesting coordinates for location " + location);
    geocoder = new google.maps.Geocoder;
    geocoder.geocode(locObj, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            //Will retrieve one set of coordinates at most
            var result = results[0];
            coords.push({ "lat": result.geometry.location.lat(), "lng": result.geometry.location.lng() });
            callback(coords);
        }
        else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT)
        {
            console.log("Rate limit exceeded when requesting coordinates for location " + loc + ". Trying again...");
            setTimeout(function () {retrieveCoordsFromAPI(loc, cb)}, 500);
        }
        else
        {
            console.log("Coordinates unavailable for '" + loc + "'");
            //Output("The following error resulted from the Geocoder request: " + status);
            callback(null);
        }
    });
}

//Returns the appropriate value for the radius selected in the select box.
function GetRadius()
{
    var selectbox = document.getElementById('radius');
    return selectbox.options[selectbox.selectedIndex].value;
}

//Receives a location, a radius, and an array of friends/coordinates,
//and returns a list of friends/coordinatesthat are within the radius.
function FindWithinRadius(searchedLocation, radius, friendCoordList)
{
    var friendsWithinRadius = new Array();

    for (k = 0; k < friendCoordList.length; k++)
    {
        searchlatlng = getLatLng(searchedLocation.coords);
        friendlatlng = getLatLng(friendCoordList[k].coords[0]);
        var distance = google.maps.geometry.spherical.computeDistanceBetween(searchlatlng, friendlatlng);
        var miDistance = convertToMiles(distance);

        console.log(friendCoordList[k].screen_name + " found to be " + miDistance + " miles away from " + searchedLocation.name);

        if (miDistance <= radius)
        {
            friendsWithinRadius.push(friendCoordList[k]);
        }

    }

    return friendsWithinRadius;
}

//Returns a LatLng object from the provided set of coordinates
function getLatLng(coords)
{
    return new google.maps.LatLng(coords.lat, coords.lng);
}

function convertToMiles(distance)
{
    return distance * 0.000621371;
}

/*
FACEBOOK FUNCTIONS
------------------
(Defunct until further notice)
*/

function FBLogin() {
    FB.login(function (response) {
        if (response.status === 'connected') {
            console.log("User logged into Facebook.");
            document.getElementById('init-instructions').style.visibility = 'hidden';   //Hides initial instructions
            account = AccountType.FACEBOOK;     //sets account type to FB
            InitiateApp();
        }
        else {
            console.log("User did not log into Facebook.");
        }
    },
        { scope: 'public_profile, user_friends' });

}

function FindFBFriends() {
    var fbfriends = new Array();
    var locations;
    var donePaging = false;
    FB.api('/me', { fields: 'taggable_friends' }, function (response) {

        fbfriends.push.apply(fbfriends, response.taggable_friends.data);
        GetAllFBPages(response.taggable_friends, fbfriends);

        //Don't put any subsequent code here: this is performing asynchronously

    });


}

function GetAllFBPages(response, fbfriends) {

    if (response.paging.next) {
        FB.api(response.paging.next, { fields: 'taggable_friends' }, function (response) {
            fbfriends.push.apply(fbfriends, response.data);
            GetAllFBPages(response, fbfriends);
        });
    }
    else {
        //Move to next step: collecting user id's
        FindFBFriendLocation(fbfriends);
    }

}

//Produces an array of Person objects that hold a name, a location name, and a set of coordinates
function FindFBFriendLocation(fbfriends) {
    var namesAndLocations;

}

//Inserts the Facebook SDK onto the webpage and loads the pixelstomp app.
function LoadFBSDK() {
    window.fbAsyncInit = function () {

        FB.init({
            appId: '288636264953620',   //This is the APP ID for the 'pixelstomp' app
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v2.10'
        });

        FB.AppEvents.logPageView();
    };
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];     //retrieves all scripts in the document
        if (d.getElementById(id)) { return; }           //If a script is called facebook-jssdk, the function returns. Otherwise:
        js = d.createElement(s); js.id = id;            //A script is created with the id facebook-jssdk.
        js.src = "http://connect.facebook.net/en_US/sdk.js"; //It is linked to the facebook SDK javascript file
        fjs.parentNode.insertBefore(js, fjs);           //inserts the facebook-jssdk SDK script before any other script file is run
        console.log("Facebook SDK was inserted into the document");
    }(document, 'script', 'facebook-jssdk'));
}
