const nameSpan = document.getElementById('alias');
const playerList = document.getElementById('playerList');
username = 'UUID';
ws = new WebSocket('wss://node51.webte.fei.stuba.sk:702/wss');

ws.onopen = function (e) {};

ws.onmessage = function (e) {
    data = JSON.parse(e.data);
    console.log(data);
    window.data = data;
    if (data.uuid) {
        nameSpan.innerHTML = `@${data.uuid}`;
        username = data.uuid;
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
    }
};

document.getElementById('start-game').addEventListener('click', function () {
    ws.send(JSON.stringify({ type: 'startGame' }));
});

ws.onclose = function (e) {};
