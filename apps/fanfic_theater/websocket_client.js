const DOMAIN = '138.68.243.184';
const socket = new WebSocket(`ws://${DOMAIN}:8080/`, );
let socketOpen = false;

const TEXT_CONTAINER_SELECTOR = '#chatlog'
const CLIENT_LIST_SELECTOR = '.clientList';
const WHITESPACE = '\r\n\r\n';

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
        document.querySelector('input').focus();
        return;
    }

    // format the selected paragraph
    const div = document.querySelector(TEXT_CONTAINER_SELECTOR);
    div.innerHTML = formatText(message.text, message.index);

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
    let direction;
    if (event.key == 'ArrowUp') {
        direction = 'up';
    }
    if (event.key == 'ArrowDown') {
        direction = 'down';
    }
    if (direction == null) {
        return;
    }

    if (socketOpen) {
        socket.send(JSON.stringify({ shiftIndex: direction }));
    } else {
        window.alert('Socket was unexpectedly closed. Please refresh the page.');
    }
}

function submitUsername() {
    if (socketOpen) {
        const input = document.querySelector('input');
        const message = { username: input.value};
        socket.send(JSON.stringify(message));
        closeModal();
        return false;
    } else {
        window.alert('Session was unexpectedly closed. Please refresh the page.')
    }
}

function closeModal() {
    const modal = document.querySelector('.modalWrapper');
    document.body.removeChild(modal);
}

/**
 * @param {string} text 
 * @param {number} activeIndex 
 * @returns {string}
 */
function formatText(text, activeIndex) {
    const paragraphs = text.split(WHITESPACE);
    return paragraphs.map((p, i) => {
        if (i === activeIndex) {
            return `<p class="selectedParagraph">${p}</p>`;
        } else {
            return `<p>${p}</p>`;
        }
    }).join("");
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
