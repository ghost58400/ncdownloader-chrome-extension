chrome.runtime.onMessage.addListener(handleMessage);

let contextMenuItem = {
	id: 'ncdl',
	title: 'Send to NCDownloader',
	contexts: ['link'],
};

checkLoggedIn();

function handleMessage(msg) {
	switch (msg.type) {
		case 'login': {
			login(msg.url, msg.username, msg.password);
			break;
		}
		case 'download': {
			download(msg.url);
			break;
		}
		case 'loggedout': {
			checkLoggedIn();
			break;
		}
	}
}

function checkLoggedIn() {
	chrome.storage.local.get(['data']).then((result) => {
		if (result.data === undefined) {
			chrome.contextMenus.removeAll();
		} else {
			chrome.contextMenus.create(contextMenuItem);
			chrome.contextMenus.onClicked.addListener(function (data) {
				download(data.linkUrl);
			});
		}
	});
}

function download(url) {
	chrome.storage.local.get(['data']).then((result) => {
		if (result.data === undefined) {
			return;
		}

		var requestOptions = {
			method: 'POST',
			redirect: 'follow',
			headers: {
				Authorization: 'Basic ' + result.data.token,
				'Content-Type': 'multipart/form-data',
			},
			body: new FormData().append('url', url).append('type', 'ytdl').append('options[extension]', 'webm'),
		};
		
		fetch(result.data.server + '/apps/ncdownloader/api/v1/download', requestOptions).catch(
			(error) => console.log('error', error)
		);
	});
}

function login(url, username, password) {
	if (url.charAt(url.length - 1) != '/') {
		url += '/';
	}
	chrome.permissions.request(
		{
			origins: [url],
		},
		(granted) => {
			if (granted) {
				console.log('granted');

				chrome.storage.local.set({ data: {server: url, token: btoa(username + ":" + password)} });
				checkLoggedIn();
				chrome.runtime.sendMessage({
					type: 'loggedin',
				});
				
			}
		}
	);
}
