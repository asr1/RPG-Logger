<?php

include('config.php');
$pin =file_get_contents('php://input');
$hashed_pin = hash("md5", $pin, FALSE);

#echo (bool)($hashed_pin == "618aac5a90258ce3f2aa6c62f345f99c");
echo (bool)($hashed_pin == "5d7d4aca2337b6848e6c3453c6175b28");


?>