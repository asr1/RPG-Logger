<?php

include('config.php');
$query=" select name, players.id from players inner join playerplays on players.id=playerplays.playerid group by name order by count(name) desc";
$result = $mysqli->query($query) or die($mysqli->error.__LINE__);
$arr = array();
if($result->num_rows > 0){
	while($row = $result->fetch_assoc()){
		$arr[] = $row;
	}
}

#JSON-encode the response (necessary for interaction with angular)
$json_response = json_encode($arr);

echo $json_response;
?>