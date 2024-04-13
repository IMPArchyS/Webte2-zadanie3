import * as constants from './Constants.js';
$(function () {
    const nameSpan = document.getElementById('alias');
    const nameSpanG = document.getElementById('aliasGame');
    const playerList = document.getElementById('playerList');
    const timerSpan = document.getElementById('timerSpan');
    const gameOverModal = $('#gameOverModal');
    const gameOverModalText = $('#WinnerAlias');
    gameOverModal.modal({ backdrop: 'static', keyboard: false });

    const maxTime = 900;
    let username = 'UUID';
    let userColor;
    let availColors = {
        red: { r: 230, g: 58, b: 58 },
        green: { r: 64, g: 196, b: 64 },
        yellow: { r: 255, g: 255, b: 0 },
        blue: { r: 55, g: 108, b: 255 },
        pink: { r: 255, g: 192, b: 203 },
        orange: { r: 255, g: 165, b: 0 },
    };

    const tileAmmount = 10;
    const margin = 20;
    let timer;

    let grid = [];
    let gridSize = 0;
    let xOffset = 0;
    let yOffset = 0;
    let gameEnded = false;
    let playerInit = false;

    let player = {
        name: '',
        x: 0,
        y: 0,
        size: 0,
        facing: 0,
        trail: [],
        cellsToFill: [],
        lastFilledCells: [],
        claimedCells: [],
        color: { r: 0, g: 0, b: 0 },
        dead: false,
    };

    let enemies = [];

    let countdown = (seconds) => {
        let counter = seconds;

        let interval = setInterval(() => {
            if (counter <= 0) {
                clearInterval(interval);
                timerSpan.innerHTML = 'OVER';
                ws.send(JSON.stringify({ type: 'TimeOver', data: player }));
            } else {
                timerSpan.innerHTML = counter;
                counter--;
            }
        }, 1000);
        return interval;
    };
    timerSpan.innerHTML = maxTime;
    function findWinnerColor(p) {
        if (p && p.color) {
            let winnerColorKey = Object.keys(availColors).find(
                (key) => availColors[key] && p.color.r === availColors[key].r && p.color.g === availColors[key].g && p.color.b === availColors[key].b
            );
            if (winnerColorKey) {
                return winnerColorKey;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

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
            $('#menuContainer').addClass('d-none');
            $('#headerSockets').addClass('d-none');
            $('#canvas-container').removeClass('d-none');
            let p5level = new p5(sketch);
        }

        if (data.type === 'initPlayers') {
            if (data.player.name !== username) {
                enemies.push(data.player);
            }
        }

        if (data.type === 'updateNextPlayerCells') {
            let sq = data.cell;
            grid[sq.x][sq.y].owner = sq.owner;
            grid[sq.x][sq.y].fresh = sq.fresh;
            grid[sq.x][sq.y].claimed = sq.claimed;
        }

        if (data.type === 'updateCurrentPlayerCells') {
            let sq = data.cell;
            grid[sq.x][sq.y].owner = sq.owner;
            grid[sq.x][sq.y].fresh = sq.fresh;
            grid[sq.x][sq.y].claimed = sq.claimed;
        }

        if (data.type === 'WonGame') {
            let p = data.player;
            gameEnded = true;
            let winnerColor = findWinnerColor(p);
            gameOverModalText.addClass('imp-' + winnerColor);
            gameOverModalText.text(p.name);
            gameOverModal.modal('show');
            console.log(p.name + ' WON');
        }

        if (data.type === 'TimeOver') {
            gameEnded = true;
            let maxClaimedCells = 0;
            let winners = [];

            enemies.push(player);
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.claimedCells.length > maxClaimedCells) {
                    maxClaimedCells = enemy.claimedCells.length;
                    winners = [enemy];
                } else if (enemy.claimedCells.length === maxClaimedCells) {
                    winners.push(enemy);
                }
            }
            // Remove the player from the enemies array
            enemies.pop();
            if (winners.length === 1) {
                console.log(winners[0].name + ' WON');
                gameOverModal.modal('show');

                let winnerColor = findWinnerColor(winners[0]);

                gameOverModalText.addClass('imp-' + winnerColor);
                gameOverModalText.text(winners[0].name);
            } else if (winners.length > 1) {
                gameOverModal.modal('show');
                gameOverModalText.text('NOBODY');
                for (let i = 0; i < winners.length; i++) {
                    console.log(winners[i].name);
                }
            }
        }

        if (data.type === 'playerDead') {
            if (data.player.name === player.name) {
                player.dead = data.player.dead;
            }
        }

        if (data.type === 'updateOpponent') {
            console.log('Updating Opponent');
            if (data.player.name === username) {
                if (player) {
                    player.cellsToFill = data.player.cellsToFill;
                    player.lastFilledCells = data.player.lastFilledCells;
                    player.claimedCells = data.player.claimedCells;
                    player.trail = data.player.trail;
                    player.color = data.player.color;
                    player.dead = data.player.dead;
                }
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
                    existingEnemy.lastFilledCells = data.player.lastFilledCells;
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

        /// base p5 function for initialisation of the canvas
        level.setup = () => {
            timer = countdown(maxTime);
            let canvas = level.createCanvas(window.innerWidth, window.innerHeight);
            canvas.parent('canvas-container').addClass('impCanvas');
            level.windowResized();
            level.createGrid();
            level.createPlayer();
            ws.send(JSON.stringify({ type: 'initPlayers', data: player }));
            level.frameRate(constants.PLAYER_SPEED);
        };

        /// Base p5 function for drawing each frame
        level.draw = () => {
            level.background(50, 50, 50, 255);
            level.playerController();
            ws.send(JSON.stringify({ type: 'player', data: player }));
            level.drawGrid();
            level.drawPlayers();
            level.checkWinCondition();
            window.p = player;
        };

        /// Base p5 function if window is resized
        level.windowResized = () => {
            let containerWidth = level.select('#canvas-container').width;
            level.resizeCanvas(containerWidth, level.select('#canvas-container').height);
            level.updateGridSize();
        };

        /// Function for checking if one player is alive
        level.checkWinCondition = () => {
            if (!player.dead && enemies.every((enemy) => enemy.dead) && enemies.length > 0) {
                if (timer) clearInterval(timer);
                level.noLoop();
                ws.send(JSON.stringify({ type: 'WonGame', data: player }));
            } else if (gameEnded) {
                if (timer) clearInterval(timer);
                level.noLoop();
            }
        };

        /// Function for drawing players to the grid
        level.drawPlayers = () => {
            // Draw Player if not dead
            if (!player.dead) {
                // Player Outline (darker color)
                level.fill(player.color.r - 100, player.color.g - 100, player.color.b - 100);
                level.rect(grid[player.x][player.y].posX, grid[player.x][player.y].posY, gridSize, gridSize);
                // Player body
                level.noStroke();
                level.fill(player.color.r, player.color.g, player.color.b);
                level.rect(grid[player.x][player.y].posX + 5, grid[player.x][player.y].posY + 5, gridSize - 10, gridSize - 10);
                level.stroke(125);
                level.drawFacing(player);
            }
            // Draw Enemies
            if (enemies.length > 0) {
                enemies.forEach((enemy) => {
                    if (!enemy.dead) {
                        // Enemy Outline (darker color)
                        level.fill(enemy.color.r - 100, enemy.color.g - 100, enemy.color.b - 100);
                        level.rect(grid[enemy.x][enemy.y].posX, grid[enemy.x][enemy.y].posY, gridSize, gridSize);
                        // Enemy Body
                        level.noStroke();
                        level.fill(enemy.color.r, enemy.color.g, enemy.color.b);
                        level.rect(grid[enemy.x][enemy.y].posX + 5, grid[enemy.x][enemy.y].posY + 5, gridSize - 10, gridSize - 10);
                        level.stroke(125);
                        level.drawFacing(enemy);
                    }
                });
            }
        };

        /// Function for drawing a triangle to know the player facing direction
        level.drawFacing = (entity) => {
            level.noStroke();
            level.fill(entity.color.r - 100, entity.color.g - 100, entity.color.b - 100);
            let triangleSize = gridSize / 2;
            let triangleX = grid[entity.x][entity.y].posX + gridSize / 2;
            let triangleY = grid[entity.x][entity.y].posY + gridSize / 2;
            switch (entity.facing) {
                case 'N':
                    level.triangle(
                        triangleX,
                        triangleY - triangleSize / 2,
                        triangleX - triangleSize / 2,
                        triangleY + triangleSize / 2,
                        triangleX + triangleSize / 2,
                        triangleY + triangleSize / 2
                    );
                    break;
                case 'S':
                    level.triangle(
                        triangleX,
                        triangleY + triangleSize / 2,
                        triangleX - triangleSize / 2,
                        triangleY - triangleSize / 2,
                        triangleX + triangleSize / 2,
                        triangleY - triangleSize / 2
                    );
                    break;
                case 'W':
                    level.triangle(
                        triangleX - triangleSize / 2,
                        triangleY,
                        triangleX + triangleSize / 2,
                        triangleY - triangleSize / 2,
                        triangleX + triangleSize / 2,
                        triangleY + triangleSize / 2
                    );
                    break;
                case 'E':
                    level.triangle(
                        triangleX + triangleSize / 2,
                        triangleY,
                        triangleX - triangleSize / 2,
                        triangleY - triangleSize / 2,
                        triangleX - triangleSize / 2,
                        triangleY + triangleSize / 2
                    );
                    break;
            }
            level.stroke(125);
        };

        /// Function for creating the player at a random position
        level.createPlayer = () => {
            // set random location that isnt occupied
            let randomX, randomY, randomFacing;
            do {
                randomX = Math.floor(Math.random() * tileAmmount);
                randomY = Math.floor(Math.random() * tileAmmount);
                randomFacing = ['N', 'S', 'W', 'E'][Math.floor(Math.random() * 4)];
            } while (grid[randomX][randomY].owner !== 'none');
            // init player
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
            // set the cell to occupied for base drawing point
            grid[randomX][randomY].owner = username;
            grid[randomX][randomY].fresh = false;
            grid[randomX][randomY].claimed = true;
            player.claimedCells.push(grid[randomX][randomY]);
            ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: grid[randomX][randomY] }));
            playerInit = true;
        };

        /// Function for bundling player functions
        level.playerController = () => {
            level.checkBase();
            level.playerMovement();
            level.playerCells();
        };

        /// Function for updating the number of cells the player owns
        level.playerCells = () => {
            // check if cells in the claimed array are still owned by the player
            for (let i = player.claimedCells.length - 1; i >= 0; i--) {
                let sq = player.claimedCells[i];
                if (sq.owner !== username || !sq.claimed) {
                    player.claimedCells.splice(i, 1);
                }
            }
            if (player.claimedCells.length < 1 && playerInit) level.playerDeath();
            ws.send(JSON.stringify({ type: 'player', data: player }));
        };

        /// Function for setting the player direction
        level.playerDirection = () => {
            let nextSquare;
            // keyboard input either WASD or ARROWS
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

        /// Function for moving the player
        level.playerMovement = () => {
            if (player.dead) return;
            let currentSquare = grid[player.x][player.y];
            let nextSquare = level.playerDirection();

            // Move the player to the next square if it's not occupied and not null
            if (nextSquare) {
                // if the player hits his trail the player dies
                if (nextSquare.fresh && nextSquare.owner === username) {
                    level.playerDeath();
                    return false;
                } else if (!currentSquare.fresh) {
                    // if cell is empty add to the trail
                    if (currentSquare.claimed && currentSquare.owner !== player.name) {
                        const enemy = enemies.find((enemy) => enemy.name === currentSquare.owner);
                        if (enemy) {
                            if (enemy.trail.some((cell) => cell.x === currentSquare.x && cell.y === currentSquare.y)) {
                                const index = enemy.trail.findIndex((cell) => cell.x === currentSquare.x && cell.y === currentSquare.y);
                                enemy.trail.splice(index, 1);
                                ws.send(JSON.stringify({ type: 'updateOpponent', data: enemy }));
                            }
                        }
                    }
                    if (!player.trail.some((cell) => cell.x === currentSquare.x && cell.y === currentSquare.y)) {
                        player.trail.push(currentSquare);
                    }
                }
                if (!currentSquare.claimed) {
                    // if the cell isnt claimed add as fresh for the ability to crash on it
                    currentSquare.fresh = true;
                }
                // check if enemy is on the cell and update player position
                level.killEnemy(nextSquare);
                if (nextSquare.owner !== player.name && nextSquare.claimed) {
                    nextSquare.claimed = false;
                }
                nextSquare.owner = username;
                player.x = nextSquare.x;
                player.y = nextSquare.y;
                ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: currentSquare }));
                ws.send(JSON.stringify({ type: 'updateNextPlayerCells', data: nextSquare }));
            }
            return true;
        };

        /// Function for destroying the player and removing his cells
        level.playerDeath = () => {
            player.dead = true;
            console.log(username + ' is dead');
            for (let i = 0; i < tileAmmount; i++) {
                for (let j = 0; j < tileAmmount; j++) {
                    if ((grid[i][j].fresh || grid[i][j].claimed || grid[i][j].owner !== 'none') && player.name === grid[i][j].owner) {
                        grid[i][j].fresh = false;
                        grid[i][j].claimed = false;
                        grid[i][j].owner = 'none';
                        ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: grid[i][j] }));
                    }
                }
            }
        };

        /// Function for destroying the enemy that the player hit
        level.killEnemy = (sq) => {
            // if player is on fresh cell
            if ((sq.fresh || !sq.claimed) && sq.owner !== player.name) {
                const enemy = enemies.find((enemy) => enemy.name === sq.owner);
                // if the owner is an enemy destroy him and set his cells to not occupied
                if (enemy) {
                    console.log('killing ' + sq.owner);
                    enemy.dead = true;
                    sq.fresh = true;
                    sq.owner = player.name;
                    for (let i = 0; i < tileAmmount; i++) {
                        for (let j = 0; j < tileAmmount; j++) {
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

        /// Function for checking if the player was in the base to fill his cells
        level.checkBase = () => {
            if (grid[player.x][player.y].claimed && grid[player.x][player.y].owner !== 'none') {
                player.cellsToFill = level.fillLoop(player.trail);
                if (player.cellsToFill.length < 1) player.trail = [];
                player.cellsToFill.forEach((cell) => {
                    cell.claimed = true;
                    cell.fresh = false;
                    cell.owner = username;
                    ws.send(JSON.stringify({ type: 'updateCurrentPlayerCells', data: cell }));
                });
                player.claimedCells.push(...player.cellsToFill.filter((cell) => !player.claimedCells.includes(cell)));
                player.cellsToFill = [];
                player.trail = [];
                return true;
            } else {
                return false;
            }
        };

        /// Function to determine each cell in the inside of the player trail
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

        /// Function for helping to determine each cell inside the player trail
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

        /// Function for creating the base responsive grid
        level.createGrid = () => {
            // calculate the grid size to fit the screen
            gridSize = Math.min(level.width - margin * 2, level.height - margin * 2) / Math.max(tileAmmount, tileAmmount);
            xOffset = margin + (level.width - gridSize * tileAmmount - margin * 2) / 2;
            yOffset = margin + (level.height - gridSize * tileAmmount - margin * 2) / 2;
            for (let i = 0; i < tileAmmount; i++) {
                grid[i] = [];
                for (let j = 0; j < tileAmmount; j++) {
                    // create each cell and set its atributes
                    let x = xOffset + i * gridSize;
                    let y = yOffset + j * gridSize;

                    let square = {
                        x: i,
                        y: j,
                        owner: 'none',
                        fresh: false,
                        claimed: false,
                        special: false,
                        posX: x,
                        posY: y,
                        size: gridSize,
                    };
                    grid[i][j] = square;
                }
            }
        };

        /// Function for updating the grid size on window resize
        level.updateGridSize = () => {
            if (grid.length > 0) {
                gridSize = Math.min(level.width - margin * 2, level.height - margin * 2) / Math.max(tileAmmount, tileAmmount);
                xOffset = margin + (level.width - gridSize * tileAmmount - margin * 2) / 2;
                yOffset = margin + (level.height - gridSize * tileAmmount - margin * 2) / 2;
                for (let i = 0; i < tileAmmount; i++) {
                    for (let j = 0; j < tileAmmount; j++) {
                        let x = xOffset + i * gridSize;
                        let y = yOffset + j * gridSize;
                        grid[i][j].size = gridSize;
                        grid[i][j].posX = x;
                        grid[i][j].posY = y;
                    }
                }
            }
        };

        /// Function for drawing the grid and coloring the player cells
        level.drawGrid = () => {
            level.stroke(125);
            level.strokeWeight(1);

            for (let i = 0; i < tileAmmount; i++) {
                for (let j = 0; j < tileAmmount; j++) {
                    // if the cell isnt yet occupied by a player
                    let square = grid[i][j];
                    level.noFill();

                    level.rect(square.posX, square.posY, gridSize, gridSize);

                    // if the player is the current client
                    if (square.owner === player.name) {
                        if (square.fresh && !square.claimed) {
                            level.fill(player.color.r, player.color.g, player.color.b, 150);
                            level.rect(square.posX, square.posY, gridSize, gridSize);
                        } else if (square.claimed) {
                            level.fill(player.color.r - 20, player.color.g - 20, player.color.b - 20);
                            level.rect(square.posX, square.posY, gridSize, gridSize);
                        }
                    } else if (square.owner !== 'none') {
                        // if the player is another client
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
                    level.textAlign(level.CENTER, level.CENTER);
                    level.text(
                        square.x + ',' + square.y + (square.owner !== 'none' ? ' O' : ''),
                        square.posX + gridSize / 2,
                        square.posY + gridSize / 2
                    );
                    if (square.special) {
                        level.fill(200);
                        level.rect(square.posX, square.posY, gridSize, gridSize);
                    }
                }
            }
        };
    };
    window.grid = grid;
    window.p = player;
    window.e = enemies;
});
