const SERVER_URL = 'http://138.68.243.184:8080';
// const SERVER_URL = 'http://localhost:8080';

// STORAGE VARIABLES
let videoID = '';
let videoComments = [];
const loading = document.getElementById('loadingBar');
let username;
let commenterMap = {};

// GENERAL YOUTUBE UTILITIES
// -------------------------

function getVideoID(url) {
	let found;
	if (url.includes('youtube.com')) {
		// do regex for v=
		let findVideoID = new RegExp(/(v=).+?((?=&)|$)/);
		found = findVideoID.exec(url);
		found[0] = found[0].substring(2);
	} else {
		// do regex for shortened version
		let findVideoID = new RegExp(/(be\/)(.+)/);
		found = findVideoID.exec(url);
		found = found[0].substring(3).split('?');	// remove any parameters
	}

	if (found) {
		return found[0];
	}
	return null;
}

function makeHTTPRequest(url, method) {
	return new Promise(function (resolve, reject) {
		let request = new XMLHttpRequest();
		request.open(method, url);
		request.onload = (loadEvent) => resolve(loadEvent.target.responseText);
		request.onerror = (e) => reject(e);
		request.send();
	});
}

function displayError(message, divId = 'commentSearchWrapper') {
	const error = document.createElement('div');
	error.id = 'errorMessage';
	error.style.color = 'red';
	error.innerHTML = message;
	error.remove = () => { document.getElementById(divId).removeChild(error); }
	loading.style.display = 'none';		// hide loading bar
	document.getElementById(divId).appendChild(error);
}

function clearError() {
	const error = document.getElementById('errorMessage');
	error && error.remove();
}

// YOUTUBE REQUEST FUNCTIONS
// -------------------------

async function getChannelId(videoId) {
	const path = `${SERVER_URL}/youtube/channel?v=${videoId}`;
	return makeHTTPRequest(path, 'GET');
}

function onCommentSearch() {
	const searchValue = document.getElementById('urlInput').value;
	let found = getVideoID(searchValue);
	if (found) {
		loading.style.display = 'block';	// show loading bar
		videoID = found;
		retrieveAllComments(found);
	}
}

function retrieveAllComments(videoID) {
	console.log('video ID to search:', videoID);
	url = `${SERVER_URL}/youtube/comments?v=${videoID}`;
	makeHTTPRequest(url, 'GET')
		.then((result) => {
			const resultObj = JSON.parse(result);

			// handle error or clear any previous error
			if (resultObj.error) {
				throw resultObj.error;
			} else {
				clearError();
			}

			// The response is an array of threads, which are arrays of comments.
			// Each comment contains a snippet, which contains an textOriginal property, which is the comment's text.
			// Each comment's snippet also contains author and date information
			displayComments(resultObj);
		})
		.catch((err) => {
			console.warn('processing error:', err);
			displayError(`There was an error processing the request: ${err.message || JSON.stringify(err)}`);
		});
}

function displayComments(comments) {
	loading.style.display = 'none';		// hide loading bar
	videoComments = comments;
	const box = document.getElementById('commentsBox');

	// clear any previous data
	box.innerHTML = '';
	commenterMap = {};

	box.style.display = 'block';
	box.innerHTML = formatComments(comments);
	document.getElementById('commentSearch').style.display = 'block';	// show the comment search section
}

// SIDE EFFECT: Displays the number of comments found.
function formatComments(comments) {
	let html = '';
	let count = 0;
	comments.forEach((thread) => {
		thread.forEach((comment, index) => {
			const authorId = comment.snippet.authorChannelId.value;
			const authorUrl = comment.snippet.authorChannelUrl;
			const authorName = comment.snippet.authorDisplayName;
			const commentText = comment.snippet.textOriginal

			// display comments
			html += `<p>${index === 0 ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'}<a href="${authorUrl}"><strong>${authorName}</strong></a>:<br/>`;
			html += `${index === 0 ? '&nbsp;&nbsp;' : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}<a href="${getCommentLink(videoID, comment.id)}">${commentText}</a></p>`;

			// gather list of comment authors
			if (commenterMap[authorId]) {
				commenterMap[authorId].comments.push(comment);
			} else {
				commenterMap[authorId] = { name: authorName, url: authorUrl, comments: [comment]};
			}

			count++;
		});
	});

	displayCommentCount(count);
	return html;
}

function idCompare(id1, id2) {
	return commenterMap[id1].name.localeCompare(commenterMap[id2].name);
}

function displayCommentCount(count) {
	const display = document.getElementById('commentCount');
	display.innerHTML = `Number of comments found: <strong>${count}</strong>`;
}

function commentSearch() {
	const input = document.getElementById('commentSearchInput').value;
	console.log('input:', input);
	const found = [];
	videoComments.forEach((thread) => {
		thread.forEach((comment) => {
			if (comment.snippet.textOriginal.toLowerCase().includes(input.toLowerCase())) {
				found.push(comment);
			}
		});
	});
	displaySearchResults(found);
}

function displaySearchResults(results) {
	let box = document.getElementById('commentSearchResults');
	box.innerHTML = '';
	let htmlDisplay = '';
	results.forEach((comment) => {
		htmlDisplay += `<p><a href="${getCommentLink(videoID, comment.id)}"><strong>${comment.snippet.authorDisplayName}</strong>: ${comment.snippet.textOriginal}</a></p>`;
	});
	document.getElementById('commentSearchResults').innerHTML = htmlDisplay;
}

function getCommentLink(videoID, commentId) {
	return `http://www.youtube.com/watch?v=${videoID}&lc=${commentId}`;
}

function displayLinks() {
	const linkInfos = gatherLinks();
	const table = document.createElement('table');
	table.className = "linkTable";
	const head = `<thead><tr> <th colspan="1">Link</th><th colspan="1">Full comment</th> </tr></thead>`;
	let rows = '';
	linkInfos.forEach((linkInfo) => {
		rows += `<tr><td class="linkTd">${linkInfo.link}</td><td class="linkContext linkTd">${linkInfo.comment.snippet.textOriginal}</td></tr>`;
	});
	table.innerHTML += head;
	table.innerHTML += rows;
	document.getElementById("displayLinkResults").appendChild(table);
}

function gatherLinks() {
	const links = [];
	videoComments.forEach((thread) => {
		thread.forEach((comment) => {
			if (comment.snippet.textOriginal.includes('http')) {
				let linkMatch = comment.snippet.textOriginal.match(/(http\S*)/);
				let linkHTML = `<a href="${linkMatch[0]}">${linkMatch[0]}</a>`;
				links.push({link: linkHTML, comment});
			}
		});
	});
	return links;
}

// THUMBNAIL LOOKUP
function thumbnailSearch() {
    let url = document.getElementById("thumbnail-id-input").value;
    const queryText = getVideoID(url);
    retrieveVideoThumbnailURL(queryText, function (url) {
        displayImage(url);
    });
}

function retrieveVideoThumbnailURL(ID, callback) {
	makeHTTPRequest(`${SERVER_URL}/youtube/thumbnail?v=${ID}`, 'GET')
		.then((result) => {
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
				console.warn('The following error was encountered: ', e.message);
				console.warn('The result received from the request server was: ', response.toString());
			}
		})
		.catch();

}

function displayImage(url) {
    let img = document.createElement("img");
    img.src = url;
    let div = document.getElementById('thumbnail_result');
    div.appendChild(img);
}

/**
 * LIVE COMMENT THEATER UTILITIES
 */

function doCommentTheater() {
	const input = document.getElementById("theaterInput");
	const vId = getVideoID(input.value);
	get(`${SERVER_URL}/youtube/getSortedComments?v=${vId}`)
		.then(sortedComments => {
			const msDiff = new Date(sortedComments[sortedComments.length - 1].snippet.publishedAt) - new Date(sortedComments[0].snippet.publishedAt);
			if (!msDiff) {
				displayError(`An error was encountered while calculating temporal information: ${JSON.stringify(sortedComments)}`, 'commentTheaterWrapper');
				return;
			}

			const hours = msDiff / 1000 / 60 / 60;

			console.log('Working with time differential of ' + msDiff + " milliseconds.");
			console.log(`(That's ${(hours).toFixed(2)} hours, ${(hours / 24).toFixed(2)} days, ${(hours / 24 / 365 * 12).toFixed(2)} months`);

			displayError("Player for Live Comment Theater is not yet implemented. Please check back again soon.", 'commentTheaterWrapper');
		});
}

function theaterMode() {

}

function theaterOff() {

}
