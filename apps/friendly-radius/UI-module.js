function EnableTwitterUsernameInput() {
	const userInput = document.getElementById('twitter-input');
	userInput.style.visibility = "unset";
}

function DisableTwitterUsernameInput() {
	const userInput = document.getElementById('twitter-input');
	userInput.style.visibility = "hidden";
}

function DisplayLoadingBar() {
	document.getElementById('loadingBar').style.visibility = "visible";
}

function HideLoadingBar() {
	document.getElementById('loadingBar').style.visibility = "hidden";
}