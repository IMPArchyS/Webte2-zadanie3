<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/style.css">
    <script src="node_modules/p5/lib/p5.min.js"></script>
    <script src="node_modules/jquery/dist/jquery.min.js"></script>
    <script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
    <title>PaperSockets</title>
</head>

<body>
    <header>
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <h1 id="mainPageButton" class="navbar-brand impMainName ml-auto mx-auto impBold" href="../index.php">
                Paper Sockets</h1>
        </nav>
        </nav>
    </header>
    <div class="container mt-3 impContainer">
        <div class="row justify-content-center">
            <div class="col-md-12 d-flex flex-column justify-content-center">
                <h3 class="text-center text-white impBold">Your ID: <span class="impPlayerTag impBold"
                        id="alias"></span></h3>
                <h4 class="text-center impPlayers">Players :</h4>
                <div id="playerList" class="text-center my-1  "></div>
                <div class="col-4 mx-auto">
                    <button class="btn btn-primary w-100 impBold p-3 m-1" id="start-game">START GAME</button>
                </div>
            </div>
        </div>
    </div>
    </div>
    <footer class="bg-dark text-white">
        <div class="container py-4 text-center">
            <p class="text-center"> 2024 Webové technológie 2</p>
        </div>
    </footer>
</body>
<script src="js/lobby.js"></script>

</html>