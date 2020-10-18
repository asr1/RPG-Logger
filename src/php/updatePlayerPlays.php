<?php

include('config.php');
$playId = $_GET['playId'];
$playerId = $_GET['playerId'];

$query="insert ignore into playerplays (playid, playerid) values ('$playId', '$playerId')";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $json_response;
?>