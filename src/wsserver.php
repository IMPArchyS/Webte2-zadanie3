<?php
use Workerman\Worker;
use Workerman\Connection\TcpConnection;
use Workerman\Lib\Timer;

require_once __DIR__ . '/vendor/autoload.php';

$ws_worker = new Worker("websocket://0.0.0.0:8282");
$ws_worker->count = 1; // 1 proces

$userList = array();
$userColors = array();
$colors = ['red', 'green', 'yellow', 'blue', "pink", "orange"];
$timer_id = null;
$countdown_id = null;

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
$ws_worker->onMessage = function ($connection, $data) use ($ws_worker, &$userList, &$timer_id, &$countdown_id) {
    $message = json_decode($data);

    if ($message->type === 'startGame') {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'startGame']));
        }
        $time_interval = 10;
        $timer_id = Timer::add($time_interval, function () use ($ws_worker, &$userList) {
            // Get the number of users
            $numUsers = count($userList);
            $cellsToSend = array ();
            // Generate random x and y coordinates for each user
            for ($i = 0; $i < $numUsers; $i++) {
                $cell = [
                    'x' => rand(0, 9), // Replace 100 with the maximum x value
                    'y' => rand(0, 9), // Replace 100 with the maximum y value
                    'user' => array_values($userList)[$i]
                ];
                $cellsToSend[] = $cell;
            }
            $message = json_encode(['type' => 'SpawnCell', 'cells' => $cellsToSend]);
            foreach ($ws_worker->connections as $conn) {
                $conn->send($message);
            }
        });
        $countdown = 120; // Replace with the desired countdown duration
        $countdown_id = Timer::add(1, function () use ($ws_worker, &$countdown) {
            // Decrement the countdown
            $countdown--;

            // Send the current countdown value to the clients
            $message = json_encode(['type' => 'countdown', 'value' => $countdown]);
            foreach ($ws_worker->connections as $conn) {
                $conn->send($message);
            }

            // If the countdown has reached 0, stop the timer
            if ($countdown <= 0) {
                Timer::del($GLOBALS['countdown_id']);
            }
        });
    }

    if ($message->type === "startGrid") {
        foreach ($ws_worker->connections as $conn) {
            $grid = $message->data;
            $conn->send(json_encode(['type' => 'startGrid', "grid" => $grid]));
        }
    }

    if ($message->type === "updateCell") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'updateCell', "cell" => $message->data]));
        }
    }

    if ($message->type === "playerDead") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'playerDead', "player" => $message->data]));
        }
    }

    if ($message->type === "WonGame") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'WonGame', "player" => $message->data]));
        }
        if ($timer_id)
            Timer::del($timer_id);
        if ($countdown_id)
            Timer::del($countdown_id);
    }

    if ($message->type === "TimeOver") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'TimeOver', "player" => $message->data]));
        }
        if ($timer_id)
            Timer::del($timer_id);
        if ($countdown_id)
            Timer::del($countdown_id);
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

    if ($message->type === "updateOpponent") {
        foreach ($ws_worker->connections as $conn) {
            $conn->send(json_encode(['type' => 'updateOpponent', "player" => $message->data]));
        }
    }
};

$ws_worker->onClose = function ($connection) use ($ws_worker, &$userList, &$userColors, &$timer_id, &$countdown_id) {
    unset ($ws_worker->connections[$connection->id]);
    unset ($userList[$connection->uuid]);
    unset ($userColors[$connection->uuid]);
    foreach ($ws_worker->connections as $conn) {
        $conn->send(json_encode(["users" => $userList]));
    }
    if ($timer_id)
        Timer::del($timer_id);

    if ($countdown_id)
        Timer::del($countdown_id);
};

// Run the worker
Worker::runAll();