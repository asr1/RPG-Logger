<?php

include('config.php');
$playId = $_GET['playId'];
$playerId = $_GET['playerId'];
$isGm = $_GET['isGm'];
$charid = $_GET['charid'];

$query="insert into playerplays (playid, playerid, isgm, characterid) values ('$playId', '$playerId', '$isGm', '$charid')";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $json_response;
?>