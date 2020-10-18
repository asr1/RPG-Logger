<?php
include('config.php');

$playerid = $_GET['playerid'];
$year = $_GET['year'].'%';

$query =  $mysqli->prepare("select dateplayed from playerplays pp inner join plays on plays.id=pp.playid inner join players pl on pp.playerid=pl.id inner join games ga on ga.id=plays.gameid where playerid=? and dateplayed like ?");
$query->bind_param("ss", $playerid, $year);
$query->execute();
#$mysqli->query($query) or die($mysqli->error.__LINE__);
$result = $query->get_result();
$arr = array();
while ($row = $result->fetch_array(MYSQLI_NUM)) {
  foreach ($row as $r) {
		$arr[] = $r;
	}
}

#JSON-encode the response (necessary for interaction with angular)
$json_response = json_encode($arr);

echo $json_response;
#echo $json_response;
?>