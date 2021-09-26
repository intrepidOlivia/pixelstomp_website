// Every few seconds, send a request to the server to see if the current URL has changed.

// If it has, replace the image with the new image

var checkUpdate = setInterval(checkForChanges, 5000);

function checkForChanges() {
  makeHTTPRequest('http://167.99.165.33/slideshow/active/current_image', 'GET', function () {
    if (this.readyState == 4) {
      if (new URL(this.responseText)) {
        document.getElementById("imgDisplay").src = this.responseText;
      }
    }

  });
}

function makeHTTPRequest(url, method, callback, errorCallback) {
    var request = new XMLHttpRequest();
    request.open(method, url);
    request.onreadystatechange = callback;
    request.send();
}

function displayError(err) {
    // var message = document.createElement('span');
    // message.innerHTML = err.message || 'There was an error establishing a connection with the server.';
    // document.body.appendChild(message);
    console.log(err.message || 'There was an error establishing a connection with the server.');
}
