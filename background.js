chrome.runtime.onMessage.addListener(handleMessage);

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
	}
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
			},
			body: (() => {
			        const formData = new FormData();
			        formData.append('url', url);
			        formData.append('type', 'ytdl');
			        formData.append('options[extension]', 'webm');
			        return formData;
			    })(),
			credentials: 'omit',
		};
		
		fetch(result.data.server + 'apps/ncdownloader/api/v1/download', requestOptions).catch(
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
				chrome.runtime.sendMessage({
					type: 'loggedin',
				});
				
			}
		}
	);
}

chrome.runtime.onInstalled.addListener( () => {
    chrome.contextMenus.create({
        id: 'ncdl',
	title: 'Send to NCDownloader',
	contexts: ['link'],
    });
});

chrome.contextMenus.onClicked.addListener( ( data, tab ) => {
	download(data.linkUrl);
} );
