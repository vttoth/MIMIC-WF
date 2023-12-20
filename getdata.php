<?php

$file = $_GET['file'];
$column = $_GET['column'];
//$file='80030009n.csv';
//$column='NBPd [mmHg]';

$csv = fopen("./DATA/" . $file, 'r');
$headers = fgetcsv($csv);

$index = array_search($column, $headers);

//echo "INDEX: " . $index . "\n";

$rows = [];
$count = 0;
echo "[";
while ($row = fgetcsv($csv)) {
    if (isset($row[$index]) && $row[$index] != "") {
      if ($count++ > 0) echo ",";
      echo '{"x": ' . ($row[0] / 3.6e6);
      echo ',"y": ' . $row[$index] . "}";
    }
}
echo "]";

?>
