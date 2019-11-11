/**
 * Usage:
 * get('http://url.com').then(response => { console.log(response) });
 */
function get(url) {
	return new Promise((resolve, reject) => {
		let request = new XMLHttpRequest();
		request.open('GET', url);
		request.onload = loadEvent => {
			const status = loadEvent.target.status;
			const responseText = loadEvent.target.responseText;
			if (status < 200 || status > 299) {
				reject(responseText);
				return;
			}

			try {
				const result = JSON.parse(responseText);
				resolve(result);
			} catch (err) {
				resolve(responseText);
			}
		};
		request.onerror = reject;
		request.send();
	});
}

/**
 * Usage: post('http://url.com', { payload: 'data'}).then(response => { console.log(response)});
 */
function post(url, body) {
	return new Promise((resolve, reject) => {
		let request = new XMLHttpRequest();
		request.open('POST', url);
		request.onload = loadEvent => {
			const responseText = loadEvent.target.responseText;

			try {
				const result = JSON.parse(responseText);
				resolve(result);
			} catch (err) {
				resolve(responseText);
			}
		};
		request.onerror = reject;
		request.send(JSON.stringify(body));
	});
}