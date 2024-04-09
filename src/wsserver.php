<?php
use Workerman\Worker;
use Workerman\Connection\TcpConnection;

require_once __DIR__ . '/vendor/autoload.php';

$ws_worker = new Worker("websocket://0.0.0.0:8282");
$ws_worker->count = 1; // 1 proces

$userList = array();

$userColors = array();
$colors = ['red', 'green', 'yellow', 'blue', "pink", "orange"];


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
$ws_worker->onMessage = function (TcpConnection $connection, $data) use ($ws_worker, &$userList) {
    $message = json_decode($data);
    if ($message->type === 'startGame') {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'startGame']));
        }
    }
    if ($message->type === "grid") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'gotGrid']));
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