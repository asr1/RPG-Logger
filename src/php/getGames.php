<?php
include('config.php');

//Sort by most popular
//$query = select * from games inner join plays on games.id = plays.gameid group by name order by count(name) desc

// Sort alphabetic
$query='select name, id
		from games
		order by name desc
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