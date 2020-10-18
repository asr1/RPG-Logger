<?php
include('config.php');

$playerid = $_GET['playerid'];
$year = $_GET['year'].'%';

$query =  $mysqli->prepare(" select name, count(name) as c from playerplays as pp inner join playerplays as pp2 on pp2.playid=pp.playid and pp.playerid <> pp2.playerid inner join players pl on pp2.playerid=pl.id inner join plays on plays.id = pp.playid where pp.playerid=? and dateplayed like ? and pp2.playerid <> 16 group by name order by c desc limit 5;");
$query->bind_param("ss", $playerid, $year);
$query->execute();
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
?>