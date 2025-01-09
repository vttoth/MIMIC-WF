<?php
function downloadAndConvert($patientId)
{
  $file = $patientId . "n";
  $full = substr($patientId, 0, 2) . "/{$patientId}/{$file}";
  $baseUrl = "https://physionet.org/files/mimic3wdb/1.0/";

  // Download .dat file
  $datContent = file_get_contents("{$baseUrl}{$full}.dat?download");
  if ($datContent === false)
  {
    return false;
  }
  file_put_contents("./DATA/{$file}.dat", $datContent);

  // Download .hea file
  $heaContent = file_get_contents("{$baseUrl}{$full}.hea?download");
  if ($heaContent === false)
  {
    return false;
  }
  file_put_contents("./DATA/{$file}.hea", $heaContent);

  // Convert to CSV
  $output = [];
  $returnVar = 0;
  exec("./MIMIC-III/convert ./DATA/{$file} ./DATA/{$file}.csv", $output, $returnVar);

  if ($returnVar !== 0)
  {
    return false;
  }

  return true;
}

$file = $_GET['file'];
$csvPath = "./DATA/{$file}";

if (!file_exists($csvPath))
{
  $patientId = substr($file, 0, 7);
  if (!downloadAndConvert($patientId))
  {
    http_response_code(500);
    echo json_encode(["error" => "Failed to download or convert file"]);
    exit;
  }
}

$csv = fopen($csvPath, 'r');
if ($csv === false)
{
  http_response_code(500);
  echo json_encode(["error" => "Failed to open CSV file"]);
  exit;
}

echo json_encode(fgetcsv($csv));
fclose($csv);
?>
