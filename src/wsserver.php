<?php
use Workerman\Worker;
use Workerman\Connection\TcpConnection;

require_once __DIR__ . '/vendor/autoload.php';

$ws_worker = new Worker("websocket://0.0.0.0:8282");
$ws_worker->count = 1; // 1 proces

$userList = array();

$ws_worker->onConnect = function ($connection) use ($ws_worker, &$userList) {
    $uuid = uniqid();
    $connection->send(json_encode(["uuid" => $uuid]));
    $userList[$uuid] = $uuid;
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
};

$ws_worker->onClose = function ($connection) use ($ws_worker, &$userList) {
    unset ($userList[$connection->uuid]);
    foreach ($ws_worker->connections as $conn) {
        $conn->send(json_encode(["users" => $userList]));
    }
};

// Run the worker
Worker::runAll();