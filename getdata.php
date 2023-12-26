<?php

$file = $_GET['file'];
$column = $_GET['column'];
//$file='80030009n.csv';
//$column='NBPd [mmHg]';

$hea = fopen("./HEAD/" . str_replace("n.csv", ".hea", $file), 'r');
$freq = 3.6e6;
while ($line = fgets($hea))
{
  if (preg_match("/^[^#]/", $line))
  {
    $fields = explode(" ", $line);
    $field2 = explode("/", $fields[2]);
    $freq = 3600.0 * $field2[1];
    break;
  } 
}
fclose($hea);

//echo "Factor is " . $freq . "\n";
//die;

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
      echo '{"x": ' . ($row[0] / $freq);
      echo ',"y": ' . $row[$index] . "}";
    }
}
echo "]";

?>
