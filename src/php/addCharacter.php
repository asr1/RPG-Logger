<?php

include('config.php');
$name = $_GET['name'];
$class = $_GET['class'];
$id = $_GET['id'];

$query= $mysqli->prepare("insert into characters (name, class) values (?, ?)");
$query->bind_param("ss", $name, $class);
$query->execute();

$result = $query->get_result();
	$last_id = $mysqli->insert_id;
	$json_response = json_encode([$id, $last_id]);
	echo $json_response;

?>