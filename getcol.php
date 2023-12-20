<?php
$file = $_GET['file']; 
$csv = fopen("./DATA/".$file, 'r');
echo json_encode(fgetcsv($csv));
?>
