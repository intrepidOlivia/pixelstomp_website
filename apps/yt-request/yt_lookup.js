const SERVER_URL = 'http://138.68.243.184:8080';
// const SERVER_URL = 'http://localhost:8080';

// STORAGE VARIABLES
var videoID = '';
let videoComments = [];
const loading = document.getElementById('loadingBar');
let username;
let commenterMap = {};
let iframeApi;
let sortedComments;
let sortedCommentsHTML;
let msDiff;
let videoInfo;

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
	hideLoading()
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
		displayLoading();
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
	hideLoading();
	videoComments = comments;
	const box = document.getElementById('commentsBox');

	// clear any previous data
	box.innerHTML = '';
	commenterMap = {};

	box.style.display = 'block';
	box.innerHTML = formatThreads(comments);
	document.getElementById('commentSearch').style.display = 'block';	// show the comment search section
}

// SIDE EFFECT: Displays the number of comments found.
function formatThreads(comments) {
	let html = '';
	let count = 0;
	comments.forEach((thread) => {
		thread.forEach((comment, index) => {
			const { authorId, authorUrl, authorName, commentText } = getBasicCommentInfo(comment, index);

			// display comments
			html += getCommentHTML({authorUrl, authorName, id: comment.id, commentText}, index);

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

function getBasicCommentInfo(comment) {
	return {
		authorId: comment.snippet.authorChannelId.value,
		authorUrl: comment.snippet.authorChannelUrl,
		authorName: comment.snippet.authorDisplayName,
		commentText: comment.snippet.textOriginal,
		msDelay: 0,		// time comment was posted (in milliseconds) after video was pubished
		id: comment.id,
	};
}

// Include index to display in thread format (parent is index 0)
function getCommentHTML(comment, index) {
	return `<p key=${comment.id}>${index === 0 ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'}<a href="${comment.authorUrl}"><strong>${comment.authorName}</strong></a>:<br/>
	${index && index === 0 ? '&nbsp;&nbsp;' : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}<a href="${getCommentLink(videoID, comment.id)}">${comment.commentText}</a></p>`;
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
let displayCursor = 0;	// non-inclusive
function doCommentTheater() {
	displayCursor = 0;
	const input = document.getElementById("theaterInput");
	videoID = getVideoID(input.value);

	theaterMode();
	displayLoading();

	if (!iframeApi) {
		injectIframeApi();
	}

    get(`${SERVER_URL}/youtube/video?v=${videoID}`)
        .then(result => {
            videoInfo = result;
        })
		.then(() => {
            get(`${SERVER_URL}/youtube/getSortedComments?v=${videoID}`)
                .then(result => {
                    hideLoading();
                    sortedComments = result;
                    msDiff = new Date(sortedComments[sortedComments.length - 1].snippet.publishedAt) - new Date(sortedComments[0].snippet.publishedAt);
                    if (!msDiff) {
                        displayError(`An error was encountered while calculating temporal information: ${JSON.stringify(sortedComments)}`, 'commentTheaterWrapper');
                        return;
                    }

                    sortedCommentsHTML = sortedComments.map((comment) => getCommentHTML(getBasicCommentInfo(comment)));
                });
		})
}

function theaterMode(id='commentTheater') {
	const theater = document.getElementById(id);
	theater.style.visibility = "visible";
}

function theaterOff() {
	const theaters = Array.from(document.getElementsByClassName('theater'));
	theaters.forEach(t => {t.style.visibility = 'hidden'});
}

function injectIframeApi() {
	iframeApi = document.createElement("script");
	iframeApi.src = "yt_iframe_api.js";
	document.head.appendChild(iframeApi);
}

function displayLoading() {
	loading.style.visibility = "visible";
}

function hideLoading() {
	loading.style.visibility = "hidden";
}

let streamId;

function startCommentStream(player) {
	// displayCursor = 0;
	const duration = player.getDuration() * 1000;	// milliseconds
	const videoStart = new Date(videoInfo.items[0].snippet.publishedAt).getTime();

	const now = Date.now();
	const chatPeriod = now - videoStart;
	const temporalAdjustment = duration / chatPeriod;	// multiply millis by this number


	if (!streamId) {
		streamId = setInterval(() => {
			const timestamp = player.getMediaReferenceTime() * 1000;	// seconds

			let newComments = true;
			while (newComments) {
				for (let i = displayCursor; i < sortedComments.length; i++) {
					const commentPosted = new Date(sortedComments[i].snippet.publishedAt).getTime();
					const offset = commentPosted - videoStart;
					const chatCommentTime = offset * temporalAdjustment;
					if (timestamp < chatCommentTime) {
                        newComments = false;
                        break;
					}

					displayCursor++;
                    renderComments();
				}
			}
		}, 100);
	}
}

function stopCommentStream() {
	if (streamId) {
		clearInterval(streamId);
	}
}


function renderComments() {
	const commentDiv = document.getElementById('commentTheaterComments');
	commentDiv.innerHTML = sortedCommentsHTML.slice(0, displayCursor).join("");
    updateTheaterScroll();
}

function updateTheaterScroll() {
	console.log('scrolling down');
	const box = document.getElementById('commentTheaterComments');
	box.scrollTop = box.scrollHeight;
}