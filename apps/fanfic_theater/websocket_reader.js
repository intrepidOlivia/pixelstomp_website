// const DOMAIN = '138.68.243.184';
const DOMAIN = 'localhost';
const PORT = '8080';
const socket = new WebSocket(`ws://${DOMAIN}:${PORT}/`, );
let socketOpen = false;
let currentIndex = 0;

const TEXT_CONTAINER_SELECTOR = '#chatlog'
const CLIENT_LIST_SELECTOR = '.clientList';
const WHITESPACE = /[\r\n]+/;

socket.addEventListener('open', (openEvent) => {
    socketOpen = true;
    socket.send(JSON.stringify({ message: 'Connection opened.'}));
    window.addEventListener('keyup', submitChangedIndex);
});

socket.addEventListener('message', (messageEvent) => {
    const messageString = messageEvent.data;
    let message;
    try {
        message = JSON.parse(messageString);
    } catch {
        throw new Error('Websocket message could not be parsed:', messageString);
    }
    if (message.alert) {
        // show alert modal (already on the page)
        // showModal(getUsernameModal());
        document.querySelector('#username_input').focus();
        return;
    }

    // format the selected paragraph
    const div = document.querySelector(TEXT_CONTAINER_SELECTOR);
    div.innerHTML = formatText(message.text, message.index);
    currentIndex = message.index;

    // populate the list of clients
    const clientList = document.querySelector(CLIENT_LIST_SELECTOR);
    clientList.innerHTML = formatClientList(message.allClients);
});

socket.addEventListener('close', () => {
    socketOpen = false;
    window.alert('Websocket closed!');
});

/**
 * @param {KeyboardEvent} event 
 * @returns {void}
 */
function submitChangedIndex(event) {
    event.preventDefault();
    let modifier = null;
    if (event.key == 'ArrowUp') {
        // direction = 'up';
        modifier = -1;
    }
    if (event.key == 'ArrowDown') {
        // direction = 'down';
        modifier = 1;
    }
    if (modifier == null) {
        return;
    }

    if (socketOpen) {
        socket.send(JSON.stringify({ changeIndex: currentIndex + modifier }));
    } else {
        window.alert('Socket was unexpectedly closed. Please refresh the page.');
    }
}

/**
 * @param {number} index 
 */
function doManualSelect(index) {
    if (socketOpen) {
        socket.send(JSON.stringify({ changeIndex: index }));
    } else {
        window.alert('Socket was unexpectedly closed. Please refresh the page.');
    }
}

function submitUsername(event) {
    event.preventDefault();
    if (socketOpen) {
        const input = document.querySelector('#username_input');
        const message = { username: input.value};
        socket.send(JSON.stringify(message));
        closeModal();
        return false;
    } else {
        window.alert('Session was unexpectedly closed. Please refresh the page.')
    }
}

function closeModal() {
    const modal = document.querySelector('#usernameModal');
    modal.classList.add('hidden');
}

/**
 * @param {Array<string>} clientList 
 * @returns {string}
 */
function formatClientList(clientList) {
    return clientList.map(client => {
        return `<p class="clientName">${client}</p>`
    }).join("");
}

/**
 * @param {string} text 
 * @param {number} activeIndex 
 * @returns {string}
 */
 function formatText(text, activeIndex) {
    const paragraphs = text.split(WHITESPACE);
    return paragraphs.map((p, i) => {
        if (i < activeIndex) {
            return `<p class="ficParagraph alreadyReadP"><span class="p_selector" onclick="doManualSelect(${i})">></span>${p}</p>`;
        }
        if (i === activeIndex) {
            return `<p class="ficParagraph selectedP">${p}</p>`;
        }
        return `<p class="ficParagraph unreadP"><span class="p_selector" onclick="doManualSelect(${i})">></span>${p}</p>`;
    }).join("");
}

function openPasteModal() {
    document.querySelector('#ficSubmitModal').classList.remove('hidden');
}

function closePasteModal() {
    document.querySelector('#ficSubmitModal').classList.add('hidden');
}

// DEPRECATED UNTIL FURTHER NOTICE
// Fanfic utilizes Cloudflare to circumvent automated network requests.
// function submitFicURL(submitEvent) {
//     submitEvent.preventDefault();
//     // Check that URL is valid
//     const urlInput = document.querySelector('#fic_url');
//     const url = urlInput.value;
//     const ficInfo = getFanficNetId(url);
//     // makeHTTPRequest(`http://${DOMAIN}:${PORT}/fanfic/url_submit`)
//     if (ficInfo) {
//         fetch(
//             `http://${DOMAIN}:${PORT}/fanfic/url_submit`,
//             {
//                 method: 'POST',
//                 body: JSON.stringify(ficInfo)
//             })
//             .then(response => {
//                 console.log('received response:', response);
//             });
//     }
    
//     return false;
// }

// NOT IN USE
// function getFanficNetId(url) {
//     if (url.includes('fanfiction.net')) {
//         const splitURL = url.split('/');
//         const storyIndicator = splitURL[3];
//         if (storyIndicator !== 's') {
//             window.alert('That is not a valid fanfic URL.');
//             return null;
//         }
//         const id = splitURL[4];
//         const chapter = splitURL[5];
//         return { id, chapter };
//     } else {
//         window.alert('That is not a valid fanfiction.net URL!');
//     }
//     return null;
// }

function submitFicText(event) {
    event.preventDefault();
    const textArea = document.getElementById('ficText');
    const fanficText = textArea.value;
    if (fanficText.length > 0) {
        fetch(`http://${DOMAIN}:${PORT}/fanfic/fic_submit`,
        { 
            method: 'POST',
            body: JSON.stringify(
                { text: fanficText }
                )
        })
        .then(response => {
            console.log('response:', response);
            closePasteModal();
            return false;
        })
        .catch(err => {
            window.alert('There was an error when trying to submit a new fic:' + err);
        });
    }
}
