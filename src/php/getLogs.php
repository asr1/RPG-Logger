<?php
include('config.php');

$query='select pl.id, gameid, g.name, dateplayed, length, campaignid, c.name as campaignName
		from plays pl
		inner join games g on g.id = pl.gameid
		inner join campaigns c on pl.campaignid = c.id
		order by id desc
		';
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