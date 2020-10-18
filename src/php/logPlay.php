<?php
include('config.php');

$gameid = $_GET['gameid'];
$date = $_GET['date'];
$length = $_GET['length'];
$campaignid = $_GET['campaignid'];


$query="insert into plays (gameid, dateplayed, length, campaignid) values ('$gameid','$date','$length','$campaignid')";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $json_response;
?>