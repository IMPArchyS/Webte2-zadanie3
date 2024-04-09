<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/game.css">
    <script src="node_modules/p5/lib/p5.min.js"></script>
    <script type="module" src="js/Game.js"></script>
    <script src="node_modules/jquery/dist/jquery.min.js"></script>
    <script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
    <title>PaperSocketsGame</title>
</head>

<body>
    <div class="container my-2 impGame" id="canvas-container">
        <div class='impGUI text-center text-white impBold position-absolute bg-dark'>
            <div class="d-flex justify-content-between">
                <h4 class="impGUI text-center text-white impBold bg-dark">Your ID: <span
                        class="impPlayerTag impBold bg-dark" id="alias"></span></h4>
                <h4 class="impGUI text-center text-white impBold bg-dark">TIME LEFT:</h4>
            </div>
        </div>
    </div>
    <footer class="bg-dark text-white">
        <div class="container py-4 text-center">
            <p class="text-center"> 2024 Webové technológie 2</p>
        </div>
    </footer>
    <!--  game over modal  -->
</body>

</html>