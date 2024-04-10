<?php
use Workerman\Worker;
use Workerman\Connection\TcpConnection;

require_once __DIR__ . '/vendor/autoload.php';

$ws_worker = new Worker("websocket://0.0.0.0:8282");
$ws_worker->count = 1; // 1 proces

$userList = array();
$userColors = array();
$colors = ['red', 'green', 'yellow', 'blue', "pink", "orange"];

$grid = array();
$globalGrid = [];

$ws_worker->onConnect = function ($connection) use ($ws_worker, &$userList, &$colors, &$userColors) {
    $uuid = uniqid();
    $availableColors = array_diff($colors, $userColors);
    $randomColor = $availableColors[array_rand($availableColors)];
    $userColors[$connection->uuid] = $randomColor;
    $connection->send(json_encode(["uuid" => $uuid, "color" => $randomColor]));
    $userList[$uuid] = array ($uuid, $randomColor);
    $connection->uuid = $uuid;
    foreach ($ws_worker->connections as $conn) {
        $conn->send(json_encode(["users" => $userList]));
    }
};

// When receiving data from the client, return "hello $data" to the client
$ws_worker->onMessage = function (TcpConnection $connection, $data) use ($ws_worker, &$userList, &$grid, &$globalGrid) {
    $message = json_decode($data);
    if ($message->type === 'startGame') {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'startGame']));
        }
    }

    if ($message->type === "startGrid") {
        foreach ($ws_worker->connections as $conn) {
            $grid = $message->data;
            $conn->send(json_encode(['type' => 'startGrid', "grid" => $grid]));
        }
    }

    if ($message->type === "updateNextPlayerCells") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'updateNextPlayerCells', "cell" => $message->data]));
        }
    }

    if ($message->type === "playerDead") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'playerDead', "player" => $message->data]));
        }
    }

    if ($message->type === "updateCurrentPlayerCells") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'updateCurrentPlayerCells', "cell" => $message->data]));
        }
    }

    if ($message->type === "initPlayers") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'initPlayers', "player" => $message->data]));
        }
    }

    if ($message->type === "player") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'gotPlayer', "player" => $message->data]));
        }
    }
};

$ws_worker->onClose = function ($connection) use ($ws_worker, &$userList, &$userColors) {
    unset ($userList[$connection->uuid]);
    unset ($userColors[$connection->uuid]);
    foreach ($ws_worker->connections as $conn) {
        $conn->send(json_encode(["users" => $userList]));
    }
};

// Run the worker
Worker::runAll();