import * as constants from './Constants.js';

const nameSpan = document.getElementById('alias');
const nameSpanG = document.getElementById('aliasGame');
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

const numColumns = 10;
const numRows = 10;
const margin = 20;

let grid = [];
let gridSize = 0;
let xOffset = 0;
let yOffset = 0;

let player = {
    name: '',
    x: 0,
    y: 0,
    size: 0,
    facing: 0,
    trail: [],
    cellsToFill: [],
    claimedCells: [],
    color: { r: 0, g: 0, b: 0 },
    dead: false,
};

let enemies = [];

let ws = new WebSocket('wss://node51.webte.fei.stuba.sk:702/wss');

ws.onopen = function (e) {};

ws.onmessage = function (e) {
    let data = JSON.parse(e.data);
    //console.log(data);
    window.data = data;
    if (data.uuid) {
        nameSpan.innerHTML = `@${data.uuid}`;
        username = data.uuid;
        nameSpanG.innerHTML = '@' + username;
    }
    if (data.color) {
        userColor = data.color;
        player.color = availColors[userColor];
        nameSpanG.classList.add('imp-' + userColor);
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
        let p5level = new p5(sketch);
    }

    if (data.type === 'initPlayers') {
        console.log('INIT PLAYERS');
        if (data.player.name !== username) {
            enemies.push(data.player);
        }
        console.log(enemies);
    }
    if (data.type === 'updatePlayerCells') {
        let sq = data.cell;
        if (sq.owner !== player.name) {
            grid[sq.x][sq.y].owner = sq.owner;
            grid[sq.x][sq.y].fresh = sq.fresh;
            grid[sq.x][sq.y].claimed = sq.claimed;
        }
    }

    if (data.type === 'gotPlayer') {
        if (data.player.name !== username) {
            const existingEnemy = enemies.find((enemy) => enemy.name === data.player.name);
            if (existingEnemy) {
                existingEnemy.x = data.player.x;
                existingEnemy.y = data.player.y;
                existingEnemy.size = gridSize;
                existingEnemy.facing = data.player.facing;
                existingEnemy.trail = data.player.trail;
                existingEnemy.cellsToFill = data.player.cellsToFill;
                existingEnemy.claimedCells = data.player.claimedCells;
                existingEnemy.color = data.player.color;
                existingEnemy.dead = data.player.dead;
            }
        }
    }
};

document.getElementById('start-game').addEventListener('click', function () {
    ws.send(JSON.stringify({ type: 'startGame' }));
});

ws.onclose = function (e) {};

let sketch = (level) => {
    level.preload = () => {};

    level.setup = () => {
        let canvas = level.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent('canvas-container').addClass('impCanvas');
        level.windowResized();
        level.createGrid();
        level.createPlayer();
        ws.send(JSON.stringify({ type: 'initPlayers', data: player }));
        level.frameRate(constants.PLAYER_SPEED);
    };

    level.draw = () => {
        level.background(50, 50, 50, 255);
        level.playerController();
        ws.send(JSON.stringify({ type: 'player', data: player }));
        level.drawGrid();
    };

    level.windowResized = () => {
        let containerWidth = level.select('#canvas-container').width;
        level.resizeCanvas(containerWidth, level.select('#canvas-container').height);
        level.updateGridSize();
    };

    level.drawPlayers = () => {
        level.fill(player.color.r, player.color.g, player.color.b);
        level.rect(grid[player.x][player.y].posX, grid[player.x][player.y].posY, player.size, gridSize);

        if (enemies.length > 0) {
            enemies.forEach((enemy) => {
                level.fill(enemy.color.r, enemy.color.g, enemy.color.b);
                level.rect(grid[enemy.x][enemy.y].posX, grid[enemy.x][enemy.y].posY, enemy.size, gridSize);
            });
        }
    };

    level.createPlayer = () => {
        let randomX, randomY, randomFacing;
        do {
            randomX = Math.floor(Math.random() * numColumns);
            randomY = Math.floor(Math.random() * numRows);
            randomFacing = ['N', 'S', 'W', 'E'][Math.floor(Math.random() * 4)];
        } while (grid[randomX][randomY].owner !== 'none');

        player = {
            name: username,
            x: randomX,
            y: randomY,
            size: gridSize,
            facing: randomFacing,
            trail: [],
            cellsToFill: [],
            claimedCells: [],
            color: { r: player.color.r, g: player.color.g, b: player.color.b },
            dead: false,
        };
        console.log(player.name);

        // grid[randomX][randomY].owner = username;
        // grid[randomX][randomY].fresh = false;
        // grid[randomX][randomY].claimed = true;
    };

    level.playerController = () => {
        if (!player.dead) {
            //level.checkBase();
            if (level.playerMovement()) {
                level.drawPlayers();
            }
        }
    };

    level.playerDirection = () => {
        let nextSquare;

        level.keyPressed = () => {
            if (level.keyCode === constants.KEY_A || level.keyCode === level.LEFT_ARROW) {
                if (player.facing !== 'E') {
                    player.facing = 'W';
                }
            } else if (level.keyCode === constants.KEY_D || level.keyCode === level.RIGHT_ARROW) {
                if (player.facing !== 'W') {
                    player.facing = 'E';
                }
            } else if (level.keyCode === constants.KEY_W || level.keyCode === constants.UP_ARROW) {
                if (player.facing !== 'S') {
                    player.facing = 'N';
                }
            } else if (level.keyCode === constants.KEY_S || level.keyCode === constants.DOWN_ARROW) {
                if (player.facing !== 'N') {
                    player.facing = 'S';
                }
            }
        };
        // Determine the coordinates of the next square based on the player's facing direction
        switch (player.facing) {
            case 'N':
                nextSquare = grid[player.x][player.y - 1];
                break;
            case 'S':
                nextSquare = grid[player.x][player.y + 1];
                break;
            case 'W':
                nextSquare = grid[player.x - 1] ? grid[player.x - 1][player.y] : null;
                break;
            case 'E':
                nextSquare = grid[player.x + 1] ? grid[player.x + 1][player.y] : null;
                break;
        }
        return nextSquare;
    };

    level.playerMovement = () => {
        let currentSquare = grid[player.x][player.y];
        let nextSquare = level.playerDirection();

        // Move the player to the next square if it's not occupied and not null
        if (nextSquare) {
            if (nextSquare.fresh && nextSquare.owner === username) {
                level.playerDeath();
                return false;
            } else if (!currentSquare.fresh) {
                //playerTrail.push(currentSquare);
            }
            if (!currentSquare.claimed) {
                //currentSquare.fresh = true;
            }
            nextSquare.owner = username;
            player.x = nextSquare.x;
            player.y = nextSquare.y;
            ws.send(JSON.stringify({ type: 'updatePlayerCells', data: nextSquare }));
        }
        return true;
    };

    level.playerDeath = () => {
        player.dead = true;
        console.log(username + ' is dead');
        for (let i = 0; i < numColumns; i++) {
            for (let j = 0; j < numRows; j++) {
                if (grid[i][j].fresh || grid[i][j].claimed) {
                    grid[i][j].fresh = false;
                    grid[i][j].claimed = false;
                    grid[i][j].owner = 'none';
                }
            }
        }
    };

    level.createGrid = () => {
        gridSize = Math.min(level.width - margin * 2, level.height - margin * 2) / Math.max(numColumns, numRows);
        xOffset = margin + (level.width - gridSize * numColumns - margin * 2) / 2;
        yOffset = margin + (level.height - gridSize * numRows - margin * 2) / 2;
        for (let i = 0; i < numColumns; i++) {
            grid[i] = [];
            for (let j = 0; j < numRows; j++) {
                let x = xOffset + i * gridSize;
                let y = yOffset + j * gridSize;

                let square = {
                    x: i,
                    y: j,
                    owner: 'none',
                    fresh: false,
                    claimed: false,
                    posX: x,
                    posY: y,
                    size: gridSize,
                };
                grid[i][j] = square;
            }
        }
        //ws.send(JSON.stringify({ type: 'startingGrid', data: grid }));
    };

    level.updateGridSize = () => {
        if (grid.length > 0) {
            gridSize = Math.min(level.width - margin * 2, level.height - margin * 2) / Math.max(numColumns, numRows);
            xOffset = margin + (level.width - gridSize * numColumns - margin * 2) / 2;
            yOffset = margin + (level.height - gridSize * numRows - margin * 2) / 2;
            for (let i = 0; i < numColumns; i++) {
                for (let j = 0; j < numRows; j++) {
                    let x = xOffset + i * gridSize;
                    let y = yOffset + j * gridSize;
                    grid[i][j].size = gridSize;
                    grid[i][j].posX = x;
                    grid[i][j].posY = y;
                }
            }
        }
    };

    level.drawGrid = () => {
        level.stroke(255);
        level.strokeWeight(1);

        for (let i = 0; i < numColumns; i++) {
            for (let j = 0; j < numRows; j++) {
                let square = grid[i][j];
                level.noFill();
                level.rect(square.posX, square.posY, gridSize, gridSize);
                level.textAlign(level.CENTER, level.CENTER);
                level.text(square.x + ',' + square.y, square.posX + gridSize / 2, square.posY + gridSize / 2);

                if (square.fresh && !square.claimed) {
                    level.fill(player.color.r, player.color.g, player.color.b, 150);
                    level.rect(square.posX, square.posY, gridSize, gridSize);
                } else if (square.claimed) {
                    level.fill(player.color.r - 20, player.color.g - 20, player.color.b - 20);
                    level.rect(square.posX, square.posY, gridSize, gridSize);
                }
            }
        }
    };
};
