<?php
include('config.php');

$playerid = $_GET['playerid'];
$year = $_GET['year'].'%';

$query =  $mysqli->prepare("select class, count(distinct characterid) from playerplays inner join plays on playerplays.playid = plays.id inner join characters on characters.id = characterid where playerid = ? and dateplayed like ? group by characterid;"); 
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