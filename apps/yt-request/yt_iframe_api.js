// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
var player;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
	player = new YT.Player('commentTheaterPlayer', {
		// width: '90%',
		height: '40%',
		videoId: window.videoID,
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	// hideLoading();
	player = event.target;
	// retrieve the video info
	const vId = player.getVideoData().video_id;

}

function onPlayerStateChange(event) {
// PLAYER STATES:
// BUFFERING: 3
// CUED: 5
// ENDED: 0
// PAUSED: 2
// PLAYING: 1
// UNSTARTED: -1
	if (event.data == YT.PlayerState.PLAYING) {
		startCommentStream(player, );
		return;
	}

	if (event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.ENDED) {
		stopCommentStream(player);
		return;
	}
}
function stopVideo() {
	player.stopVideo();
}
