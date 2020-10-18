<?php

include('config.php');
$name = $_GET['name'];

$query= $mysqli->prepare("insert into campaigns (name) values (?)");
$query->bind_param("s", $name);
$query->execute();
	$last_id = $mysqli->insert_id;
	$json_response = json_encode($last_id);
	echo $json_response;

?>