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
let gameEnded = false;

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
        // console.log(enemies);
    }

    if (data.type === 'updateNextPlayerCells') {
        let sq = data.cell;
        if (sq.owner !== player.name) {
            grid[sq.x][sq.y].owner = sq.owner;
            grid[sq.x][sq.y].fresh = sq.fresh;
            grid[sq.x][sq.y].claimed = sq.claimed;
        }
    }

    if (data.type === 'WonGame') {
        let p = data.player;
        gameEnded = true;
        console.log(p.name + ' WON');
    }

    if (data.type === 'updateCurrentPlayerCells') {
        let sq = data.cell;
        if (sq.owner !== player.name) {
            grid[sq.x][sq.y].owner = sq.owner;
            grid[sq.x][sq.y].fresh = sq.fresh;
            grid[sq.x][sq.y].claimed = sq.claimed;
        }
    }

    if (data.type === 'playerDead') {
        if (data.player.name === player.name) {
            player.dead = data.player.dead;
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
        level.checkWinCondition();
    };

    level.checkWinCondition = () => {
        if (!player.dead && enemies.every((enemy) => enemy.dead)) {
            level.noLoop();
            ws.send(JSON.stringify({ type: 'WonGame', data: player }));
        } else if (gameEnded) {
            level.noLoop();
        }
    };

    level.windowResized = () => {
        let containerWidth = level.select('#canvas-container').width;
        level.resizeCanvas(containerWidth, level.select('#canvas-container').height);
        level.updateGridSize();
    };

    level.drawPlayers = () => {
        if (!player.dead) {
            level.fill(player.color.r, player.color.g, player.color.b);
            level.rect(grid[player.x][player.y].posX, grid[player.x][player.y].posY, player.size, gridSize);
        }

        if (enemies.length > 0) {
            enemies.forEach((enemy) => {
                if (!enemy.dead) {
                    level.fill(enemy.color.r, enemy.color.g, enemy.color.b);
                    level.rect(grid[enemy.x][enemy.y].posX, grid[enemy.x][enemy.y].posY, enemy.size, gridSize);
                }
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

        grid[randomX][randomY].owner = username;
        grid[randomX][randomY].fresh = false;
        grid[randomX][randomY].claimed = true;
        ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: grid[randomX][randomY] }));
    };

    level.playerController = () => {
        level.checkBase();
        level.playerMovement();
        level.drawPlayers();
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
        if (player.dead) return;
        let currentSquare = grid[player.x][player.y];
        let nextSquare = level.playerDirection();

        // Move the player to the next square if it's not occupied and not null
        if (nextSquare) {
            if (nextSquare.fresh && nextSquare.owner === username) {
                level.playerDeath();
                return false;
            } else if (!currentSquare.fresh) {
                player.trail.push(currentSquare);
            }
            if (!currentSquare.claimed) {
                currentSquare.fresh = true;
            }
            level.killEnemy(nextSquare);
            if (nextSquare.owner !== player.name && nextSquare.claimed) nextSquare.claimed = false;
            nextSquare.owner = username;
            player.x = nextSquare.x;
            player.y = nextSquare.y;
            ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: currentSquare }));
            ws.send(JSON.stringify({ type: 'updateNextPlayerCells', data: nextSquare }));
        }
        return true;
    };

    level.playerDeath = () => {
        player.dead = true;
        console.log(username + ' is dead');
        for (let i = 0; i < numColumns; i++) {
            for (let j = 0; j < numRows; j++) {
                if ((grid[i][j].fresh || grid[i][j].claimed || grid[i][j].owner !== 'none') && player.name === grid[i][j].owner) {
                    grid[i][j].fresh = false;
                    grid[i][j].claimed = false;
                    grid[i][j].owner = 'none';
                    ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: grid[i][j] }));
                }
            }
        }
    };

    level.killEnemy = (sq) => {
        if (sq.fresh && sq.owner !== player.name) {
            console.log('killing ' + sq.owner);
            const enemy = enemies.find((enemy) => enemy.name === sq.owner);
            if (enemy) {
                enemy.dead = true;
                sq.fresh = true;
                sq.owner = player.name;
                for (let i = 0; i < numColumns; i++) {
                    for (let j = 0; j < numRows; j++) {
                        if ((grid[i][j].fresh || grid[i][j].claimed || grid[i][j].owner !== 'none') && enemy.name === grid[i][j].owner) {
                            grid[i][j].fresh = false;
                            grid[i][j].claimed = false;
                            grid[i][j].owner = 'none';
                            ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: grid[i][j] }));
                        }
                    }
                }
                ws.send(JSON.stringify({ type: 'playerDead', data: enemy }));
            }
        }
    };

    level.checkBase = () => {
        if (grid[player.x][player.y].claimed && grid[player.x][player.y].owner === player.name) {
            console.log('FILL for ' + username);
            player.cellsToFill = level.fillLoop(player.trail);
            if (player.cellsToFill.length < 1) player.trail = [];
            player.cellsToFill.forEach((cell) => {
                cell.claimed = true;
                cell.fresh = false;
                cell.owner = username;
                ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: cell }));
            });
            return true;
        } else {
            return false;
        }
    };

    level.fillLoop = (Trail) => {
        let gotCells = [];
        const minX = Math.min(...Trail.map((pos) => pos.x));
        const maxX = Math.max(...Trail.map((pos) => pos.x));
        const minY = Math.min(...Trail.map((pos) => pos.y));
        const maxY = Math.max(...Trail.map((pos) => pos.y));

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                if (level.fillGrid(x, y, Trail)) {
                    gotCells.push(grid[x][y]);
                }
            }
        }
        Trail.forEach((cell) => {
            if (!gotCells.includes(cell)) {
                gotCells.push(cell);
            }
        });
        return gotCells;
    };

    level.fillGrid = (x, y, Trail) => {
        let intersections = 0;
        for (let i = 0; i < Trail.length; i++) {
            const start = Trail[i];
            const end = Trail[(i + 1) % Trail.length];

            if ((start.y <= y && end.y > y) || (end.y <= y && start.y > y)) {
                const intersectX = start.x + ((y - start.y) * (end.x - start.x)) / (end.y - start.y);
                if (intersectX < x) {
                    intersections++;
                }
            }
        }
        return intersections % 2 !== 0;
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
                level.text(square.x + ',' + square.y + (square.owner !== 'none' ? ' O' : ''), square.posX + gridSize / 2, square.posY + gridSize / 2);

                if (square.owner === player.name) {
                    if (square.fresh && !square.claimed) {
                        level.fill(player.color.r, player.color.g, player.color.b, 150);
                        level.rect(square.posX, square.posY, gridSize, gridSize);
                    } else if (square.claimed) {
                        level.fill(player.color.r - 20, player.color.g - 20, player.color.b - 20);
                        level.rect(square.posX, square.posY, gridSize, gridSize);
                    }
                } else if (square.owner !== 'none') {
                    if (enemies.length > 0) {
                        const enemy = enemies.find((enemy) => square.owner === enemy.name);
                        if (square.fresh && !square.claimed) {
                            level.fill(enemy.color.r, enemy.color.g, enemy.color.b, 150);
                            level.rect(square.posX, square.posY, gridSize, gridSize);
                        } else if (square.claimed) {
                            level.fill(enemy.color.r - 20, enemy.color.g - 20, enemy.color.b - 20);
                            level.rect(square.posX, square.posY, gridSize, gridSize);
                        }
                    }
                }
            }
        }
    };
};
