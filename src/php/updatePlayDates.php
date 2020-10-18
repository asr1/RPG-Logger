<?php

include('config.php');
$playId = $_GET['playid'];
$datePlayed = $_GET['datePlayed'];


$query="update plays set dateplayed = '$datePlayed' where id= '$playId'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $datePlayed;
	//echo $json_response;
?>