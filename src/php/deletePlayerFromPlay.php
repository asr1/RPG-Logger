<?php

include('config.php');
$playid = $_GET['playid'];
$playerid = $_GET['playerid'];

$query="delete from playerplays where playid='$playid' and playerid='$playerid'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);

$query="delete from playerplays where playid = '$id'";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
echo $result;
?>