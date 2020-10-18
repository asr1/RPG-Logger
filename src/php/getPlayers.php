<?php

include('config.php');
$query=" select pl.name, pl.id, pp.playid, pp.playerid, pp.isgm, cc.name as charname, cc.class, cc.raceid, cc.id as characterid, r.name as race from players pl inner join playerplays pp left join characters cc on cc.id = pp.characterid left join races r on cc.raceid = r.id where pp.playerid = pl.id";
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