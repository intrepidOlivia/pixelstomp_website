// GLOBAL VARIABLE DECLARATIONS
// ----------------------------
var srcArray = [];
var currentIndex = 0;

// function displayError(error) {
//     //Displays a message at the top that describes the error
//     document.write(`The following error has occurred: ${error}`);
// }

// SLIDESHOW SETUP FUNCTION DECLARATIONS
// -------------------------------------

function loadSetupPage() {
    let activeSlideshow;

    // Load active slideshow from database
    getActiveSlideshow(function () {
        let result = JSON.parse(this.responseText);
        fillCurrentSlideshow(result);
        activeSlideshow = result.name;
    });

    // List all slideshows in dropdown menu
    getAllSlideshows(function () {
        let result = JSON.parse(this.responseText);
        let select = document.getElementById('slideshowSelect');
        result.forEach((slideshow) => {
            let option = document.createElement('option');
            option.value = slideshow.name;
            option.innerHTML = slideshow.name;
            select.add(option);
        });
        console.log('collection of options:', select.options);
        for (let i = 0; i < select.options.length; i ++) {
            if (select.options[i].value == activeSlideshow) {
                select.selectedIndex = i;
                break;
            }
        }
    })
}

function makeActive() {
    let slideshowName = document.getElementById('slideshowSelect').value;
    makeHTTPRequest(`http://167.99.165.33/slideshow/make_active?name=${slideshowName}`, 'POST', function () {
        if (this.status == 200) {
          // update box with success message
        }
    });
}

function fillCurrentSlideshow(slideshow) {
    document.getElementById('currentName').innerHTML = slideshow.name;
    let preview = document.getElementById('currentSlideshowPreview');
    preview.innerHTML = '';
    slideshow.images.split(',').forEach(url => {
        let img = document.createElement('img');
        img.src = url;
        img.height = 100;
        preview.appendChild(img);
    });
}

// When the user selects a slideshow, changes the values of the slideshow being displayed above.
function selectSlideshow() {
    let select = document.getElementById('slideshowSelect');
    let selectedValue = select.value;
    getSlideshow(selectedValue, function () {
        let result = JSON.parse(this.responseText);
        fillCurrentSlideshow(result);
    });
}

function initiateNewSlideshow() {
    // Remove the button and displays the div that contains the new slideshow form
    document.getElementById('button_newSlideShow').style.display = 'none';
    document.getElementById('newSlideshowForm').style.display = 'block';
}

function addNewSource() {
    // Inserts a new <tr> and image source input to the image sources table,
    // keeping the Add New Source button row at the bottom
    let srcTable = document.getElementById('imgSrcTable');
    let lastIndex = srcTable.rows.length;

    let newRow = srcTable.insertRow(lastIndex);
    newRow.className = 'imgSrc';
    newRow.id = 'imgSrcRow' + lastIndex;

    let cell1 = newRow.insertCell(0);
    let cell2 = newRow.insertCell(1);
    let cell3 = newRow.insertCell(2);

    cell1.innerHTML = 'Image Source: ';
    cell2.innerHTML = '<input type="text" name="imgSrc' + lastIndex + '" />';
    cell3.innerHTML = '<button id="remove' + lastIndex + '" onclick="removeSource(this)">-Remove</button>';
}

function removeSource(row) {
    //remove row from the HTML DOM
    let table = document.getElementById('imgSrcTable');
    let rowID = 'imgSrcRow' + row.id.split('remove')[1];
    table.deleteRow(rowID);
}

function submitNew() {
  const slideshowName = document.getElementById('newSlideshowName').value;
  if (slideshowName.trim() == '') {
    window.alert('Please enter a name for the slideshow you are creating.');
    return;
  }

    let newSlideShow = {};
    // New textarea section
    let inputBox = document.getElementById('urlInput');
    let urls = inputBox.value.split('\n');
    verifyImageURLs(urls, function (verified, url) {
      if (!verified) {
        window.alert(`The following URL was found to be invalid: '${url}'`);
        return;
      }

      let newSlideShow = {};
      newSlideShow.name = slideshowName;
      newSlideShow.images = inputBox.value.split('\n');
      newSlideShow.active = document.getElementById('makeActive').checked;
      createNewSlideshow(newSlideShow, function () {
        if (this.status == 200) {
          displayNewSuccess();
        } else {
          displayError(this.responseText);
        }
      });
      // TODO: Reset form
    });
}

function verifyImageURLs(urls, callback) {
  const urlsToProcess = urls.length;
  let urlsProcessed = 0;
  urls.forEach((url) => {
    makeHTTPRequest(url, 'GET', function () {
      if (this.status === 404) {
        callback(false, url);
      }
      urlsProcessed++;
      if (urlsProcessed == urlsToProcess) {
        callback(true);
      }
    }, function () {
      if (this.status === 404) {
        callback(false, url);
      }
      urlsProcessed++;
      if (urlsProcessed == urlsToProcess) {
        callback(true);
      }
    });
  });
}

function displayNewSuccess() {
  document.getElementById('newSlideshowForm').className += ' disabledDiv';
  document.getElementById('submitNew').display = 'none';

  let p = document.createElement('p');
  p.innerHTML = 'Success!';
  document.getElementById('newSlideShow').appendChild(p);
}

// ENDGAME SERVER CALLS
// ---------------------

function makeHTTPRequest(url, method, callback, errorCallback) {
    console.log('makeHttpRequest called for path ', url);
    let request = new XMLHttpRequest();
    request.open(method, url);
    request.onload = callback;
    request.onerror = errorCallback || displayError;
    request.send();
}

function getActiveSlideshow(callback) {
    makeHTTPRequest('http://167.99.165.33/slideshow/active',
        'GET',
        callback);
}

function createNewSlideshow(newSlideShow, callback) {
    makeHTTPRequest(`http://167.99.165.33/slideshow/create?name=${newSlideShow.name}&img=${newSlideShow.images.toString()}&active=${newSlideShow.active}`,
        'POST',
        callback || function () {
          displayError(this.responseText);
            console.log(this.responseText);
        });
}

function getAllSlideshows(callback) {
    makeHTTPRequest(
        'http://167.99.165.33/slideshow/all',
        'GET',
        callback);
}

function getSlideshow(slideshowName, callback) {
    makeHTTPRequest(`http://167.99.165.33/slideshow?name=${slideshowName}`,
        'GET',
        callback || function () {
            displayError(this.responseText);
            console.log(this.responseText);
        });
}

function displayError(err) {
    let message = document.createElement('span');
    message.innerHTML = err.message || err || 'There was an error establishing a connection with the server.';
    document.body.appendChild(message);
}
