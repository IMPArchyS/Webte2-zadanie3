<?php

$hostname = "mysql";
$username = "imp";
$password = "123";
$dbname = "webte2zadanie3";

define("HOSTNAME", "mysql");
define("USERNAME", "imp");
define("PASSWORD", "imP.weB2");
define("DBNAME", "webte2zadanie3");

$dbconfig = array(
    'hostname' => 'mysql',
    'username' => 'imp',
    'password' => 'imP.weB2',
    'dbname' => 'webte2zadanie3',
);

$conn = new PDO("mysql:host=$hostname;dbname=$dbname", $username, $password);

if (!$conn) {
    die("Connection failed: " . $conn->connect_error);
}