const nameSpan = document.getElementById('alias');
username = 'UUID';
ws = new WebSocket('wss://node51.webte.fei.stuba.sk:702/wss');

ws.onopen = function (e) {};

ws.onmessage = function (e) {
    data = JSON.parse(e.data);
    if (data.uuid) {
        nameSpan.innerHTML = `Tvoj Alias: @${data.uuid}`;
        username = data.uuid;
        console.log(e.data);
    }
};
