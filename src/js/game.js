console.log('DEBUG TEST');

import * as constants from './Constants.js';

let sketch = (level) => {
    let numColumns = 15;
    let numRows = 15;
    let grid = [];
    let margin = 20;

    level.preload = () => {};

    level.setup = () => {
        let canvas = level.createCanvas(level.windowWidth, level.windowHeight);
        canvas.parent('canvas-container');
        level.windowResized();
    };

    level.draw = () => {
        level.background(50, 50, 50, 255);
        level.drawGrid();
    };

    level.windowResized = () => {
        let containerWidth = level.select('#canvas-container').width;
        let footerHeight = level.select('footer').height;
        level.resizeCanvas(containerWidth, level.windowHeight - footerHeight);
    };

    level.drawGrid = () => {
        let gridSize = Math.min(level.width - margin * 2, level.height - margin * 2) / Math.max(numColumns, numRows);
        let xOffset = margin + (level.width - gridSize * numColumns - margin * 2) / 2;
        let yOffset = margin + (level.height - gridSize * numRows - margin * 2) / 2;

        level.stroke(255);
        level.strokeWeight(1);

        for (let i = 0; i < numColumns; i++) {
            grid[i] = [];
            for (let j = 0; j < numRows; j++) {
                let x = xOffset + i * gridSize;
                let y = yOffset + j * gridSize;

                let square = {
                    x: i,
                    y: j,
                    owner: 'none',
                    posX: x,
                    posY: y,
                    size: gridSize,
                };
                grid[i][j] = square;
                level.noFill();
                level.rect(x, y, gridSize, gridSize);
                level.textAlign(level.CENTER, level.CENTER);
                level.text(square.x + ',' + square.y, x + gridSize / 2, y + gridSize / 2);
            }
        }
    };

    // TODO:
    level.createPlayer = () => {};

    level.playerMovement = () => {};

    console.log(grid);
};
let p5level = new p5(sketch);
