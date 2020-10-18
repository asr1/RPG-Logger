<?php

include('config.php');
$playId = $_GET['playid'];
$campaignid = $_GET['campaignid'];


$query="update plays set campaignid = '$campaignid' where id= '$playId'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $json_response;
?>