<?php

include('config.php');
$playId = $_GET['playid'];
$playerId = $_GET['playerid'];
$charId = $_GET['charId'];


$query="update playerplays set characterid = '$charId' where playid = '$playId' and playerid = '$playerId'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $json_response;
?>