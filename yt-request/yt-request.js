function buttonPress() {
    let queryText = document.getElementById("id-input").value;
    retrieveVideoThumbnailURL(queryText, function (url) {
        displayImage(url);
    });
}

function retrieveVideoThumbnailURL(ID, callback) {
    let request = new XMLHttpRequest();
    request.open('GET', 'http://138.68.243.184:8080/ytThumbnail?id=' + ID, true);
    request.onload = function () {
        if (request.status == 200) {
            let result = request.responseText;
            try {
                let objResult = JSON.parse(result);
                let thumbnails = objResult.items[0].snippet.thumbnails;
                if (thumbnails.maxres) {
                    callback(thumbnails.maxres.url)
                    return;
                }
                if (thumbnails.standard) {
                    callback(thumbnails.standard.url)
                    return;
                }
                if (thumbnails.high) {
                    callback(thumbnails.high.url)
                    return;
                }
                if (thumbnails.medium) {
                    callback(thumbnails.medium.url)
                    return;
                }
                if (thumbnails.default) {
                    callback(thumbnails.default.url);
                    return;
                }
            }
            catch (e) {
                callback('The following error was encountered: ' + e.message + '\n' +
                    'The result received from the request server was: ' + result.toString());
            }
        }
    };
    request.send();
}

function displayImage(url) {
    let img = document.createElement("img");
    img.src = url;
    let div = document.getElementById('result');
    div.appendChild(img);

}