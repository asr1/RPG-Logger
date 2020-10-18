<?php

include('config.php');
$playId = $_GET['playid'];
$isgm = $_GET['isgm'];
$playerid = $_GET['playerid'];


$query="update playerplays set isgm = '$isgm' where playid= '$playId' and playerid='$playerid'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $json_response;
?>