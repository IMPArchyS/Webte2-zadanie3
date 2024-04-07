const nameSpan = document.getElementById('alias');
const playerList = document.getElementById('playerList');
username = 'UUID';
ws = new WebSocket('wss://node51.webte.fei.stuba.sk:702/wss');

ws.onopen = function (e) {};

ws.onmessage = function (e) {
    data = JSON.parse(e.data);
    if (data.uuid) {
        nameSpan.innerHTML = `@${data.uuid}`;
        username = data.uuid;
    }
    let playerData = JSON.parse(e.data);
    playerList.innerHTML = '';
    for (let playerId in playerData) {
        const player = document.createElement('p');
        player.classList.add('m-0', 'text-white');
        player.textContent = playerData[playerId];
        playerList.appendChild(player);
    }
};

ws.onclose = function (e) {
    ws.close();
};
