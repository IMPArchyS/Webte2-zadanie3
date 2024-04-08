console.log('DEBUG TEST');

import * as constants from './Constants.js';

let username = 'UUID';

let sketch = (level) => {
    const numColumns = 10;
    const numRows = 10;
    const margin = 20;

    let grid = [];
    let gridSize = 0;
    let xOffset = 0;
    let yOffset = 0;

    let player;
    let playerTrail = [];
    let cellsToFill = [];

    level.preload = () => {};

    level.setup = () => {
        let canvas = level.createCanvas(level.windowWidth, level.windowHeight);
        canvas.parent('canvas-container');
        level.windowResized();
        level.createGrid();
        level.createPlayer();
    };

    level.draw = () => {
        level.background(50, 50, 50, 255);
        level.playerController();
        level.drawGrid();
    };

    level.windowResized = () => {
        let containerWidth = level.select('#canvas-container').width;
        let footerHeight = level.select('footer').height;
        level.resizeCanvas(containerWidth, level.windowHeight - footerHeight);
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

    level.playerController = () => {
        if (!player.dead) {
            level.checkBase();
            if (level.playerMovement()) {
                level.drawPlayer();
            }
        }
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
                playerTrail.push(currentSquare);
            }
            if (!currentSquare.claimed) currentSquare.fresh = true;
            nextSquare.owner = username;
            player.x = nextSquare.x;
            player.y = nextSquare.y;
        }
        let speed = constants.PLAYER_SPEED;
        level.frameRate(speed);
        return true;
    };

    level.checkBase = () => {
        if (grid[player.x][player.y].claimed) {
            console.log('FILL for ' + username);
            cellsToFill = level.fillGrid();
            cellsToFill.forEach((cell) => {
                cell.claimed = true;
                cell.fresh = false;
                cell.owner = username;
            });
            return true;
        } else {
            return false;
        }
    };

    level.fillGrid = () => {
        const cellsInside = [];
        const minX = Math.min(...playerTrail.map((square) => square.x));
        const maxX = Math.max(...playerTrail.map((square) => square.x));
        const minY = Math.min(...playerTrail.map((square) => square.y));
        const maxY = Math.max(...playerTrail.map((square) => square.y));

        for (let x = 0; x < numColumns; x++) {
            for (let y = 0; y < numRows; y++) {
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    cellsInside.push(grid[x][y]); // Or push the coordinates (x, y) if needed
                }
            }
        }

        return cellsInside;
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

    level.drawPlayer = () => {
        level.fill(255, 0, 0);
        level.rect(grid[player.x][player.y].posX, grid[player.x][player.y].posY, player.size, gridSize);
    };

    level.createPlayer = () => {
        let randomX, randomY, randomFacing;
        do {
            randomX = Math.floor(Math.random() * numColumns);
            randomY = Math.floor(Math.random() * numRows);
            randomFacing = ['N', 'S', 'W', 'E'][Math.floor(Math.random() * 4)];
        } while (grid[randomX][randomY].owner !== 'none');

        player = {
            x: randomX,
            y: randomY,
            size: gridSize,
            facing: randomFacing,
            dead: false,
        };

        grid[randomX][randomY].owner = username;
        grid[randomX][randomY].fresh = false;
        grid[randomX][randomY].claimed = true;
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
                    level.fill(150, 0, 0, 127);
                    level.rect(square.posX, square.posY, gridSize, gridSize);
                } else if (square.claimed) {
                    level.fill(200, 0, 0, 240);
                    level.rect(square.posX, square.posY, gridSize, gridSize);
                }
            }
        }
    };
};

let p5level = new p5(sketch);
