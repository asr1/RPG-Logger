<?php

include('config.php');
$id = $_GET['id'];

$query="delete from plays where id = '$id'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);

$query="delete from playerplays where playid = '$id'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
?>