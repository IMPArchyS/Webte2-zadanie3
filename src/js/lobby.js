import { startGame } from './MP.js';

const nameSpan = document.getElementById('alias');
const playerList = document.getElementById('playerList');
let username = 'UUID';
let userColor;
let availColors = {
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    pink: { r: 255, g: 192, b: 203 },
    orange: { r: 255, g: 165, b: 0 },
};
let ws = new WebSocket('wss://node51.webte.fei.stuba.sk:702/wss');

ws.onopen = function (e) {};

ws.onmessage = function (e) {
    let data = JSON.parse(e.data);
    console.log(data);
    window.data = data;
    if (data.uuid) {
        nameSpan.innerHTML = `@${data.uuid}`;
        username = data.uuid;
    }
    if (data.color) {
        userColor = data.color;
    }

    if (data.users) {
        playerList.innerHTML = '';
        for (let playerId in data.users) {
            const player = document.createElement('p');
            player.classList.add('m-0', 'text-white');
            player.textContent = playerId;
            playerList.appendChild(player);
        }
    }
    if (data.type === 'startGame') {
        console.log('GAME STARTED');
        $('#menuContainer').addClass('d-none');
        $('#headerSockets').addClass('d-none');
        $('#canvas-container').removeClass('d-none');
        startGame(username, ws, availColors[userColor]);
    }

    if (data.type === 'gotGrid') {
    }
};

document.getElementById('start-game').addEventListener('click', function () {
    ws.send(JSON.stringify({ type: 'startGame' }));
});

ws.onclose = function (e) {};
