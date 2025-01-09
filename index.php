<!DOCTYPE html>
<html lang="en">
<head>
 <title>MIMIC high-cadence</title>
 <link rel="stylesheet" href="css/styles.css?v=47" type="text/css" />
 <script src="scripts/scripts.js"></script>
 <script src="scripts/matrix.js"></script>
 <script src="scripts/rungru.js"></script>
</head>
<body>
 <div id="overlay"></div>
 <div class='loadsave'>
  <button id="load" onClick="loadAll()">Load</button>
  <button id="save" onClick="saveAll()">Save</button>
  <br/><span class='version'>Version 0.9.4</span>
 </div>

 <h1>MIMIC high-cadence data sets</h1>

 <table class='main'>
  <tr>
   <td>

<?php
$mimic_iv_dir = './DATA/';
$mimic_iii_file = './DATA/MIMICIII/RECORDS-numerics';

// Function to read MIMIC-III patient IDs
function readMIMICIIIPatientIDs($file)
{
  $ids = [];
  if (($handle = fopen($file, "r")) !== FALSE)
  {
    while (($line = fgets($handle)) !== false)
    {
      $parts = explode('/', trim($line));
      $id = substr(end($parts), 0, 7); // Extract 7-digit ID
      $ids[] = $id;
    }
    fclose($handle);
  }
  return $ids;
}

$mimic_iii_ids = readMIMICIIIPatientIDs($mimic_iii_file);

// MIMIC-IV files
$mimic_iv_files = array_filter(scandir($mimic_iv_dir), function($file)
{
  return strpos($file, '.csv') !== false;
});

// Generate MIMIC-IV options
$mimic_iv_options = '';
foreach ($mimic_iv_files as $file)
{
  $option_value = $file;
  $option_text = substr($file, 0, -4);
  $mimic_iv_options .= "<option value='$option_value'>$option_text</option>";
}

// Generate MIMIC-III first select options
$mimic_iii_first_options = '';
$first_digits = array_unique(array_map(function($id) { return substr($id, 0, 3); }, $mimic_iii_ids));
sort($first_digits);
foreach ($first_digits as $digits)
{
  $mimic_iii_first_options .= "<option value='$digits'>$digits</option>";
}

?>

    <h2 class='patient'>Patient:</h2>
    <div>
     <label><input type="radio" name="mimic_version" value="iii" onchange="toggleMIMICVersion()"> MIMIC-III</label><br/>

     <div id="mimic_iii_selection" style="display: none;">
      <select class='psel' id='mimic_iii_first' onchange='updateMIMICIIISecond()'>
        <option value='' disabled='' selected=''>Select first 3 digits</option>
        <?php echo $mimic_iii_first_options; ?>
      </select><br/>
      <select class='psel' id='mimic_iii_second' disabled onchange='updateMIMICIIIThird()'>
        <option value='' disabled='' selected=''>Select next 2 digits</option>
      </select><br/>
      <select class='psel' id='mimic_iii_third' disabled onchange='setMIMICIIISelection()'>
        <option value='' disabled='' selected=''>Select last 2 digits</option>
      </select>
     </div>

     <label><input type="radio" name="mimic_version" value="iv" checked onchange="toggleMIMICVersion()"> MIMIC-IV</label>

     <div id="mimic_iv_selection">
      <select class='psel' id='files' required='' onchange='remsel()'>
        <option value='' disabled='' selected=''>Select a patient</option>
        <?php echo $mimic_iv_options; ?>
      </select>
     </div>

    </div>


    <script lang='javascript'>

function toggleMIMICVersion()
{
  var version = document.querySelector('input[name="mimic_version"]:checked').value;
  document.getElementById('mimic_iv_selection').style.display = version === 'iv' ? 'block' : 'none';
  document.getElementById('mimic_iii_selection').style.display = version === 'iii' ? 'block' : 'none';
  if (version === 'iv')
  {
      document.getElementById('files').disabled = false;
  }
  else
  {
    document.getElementById('files').disabled = true;
    document.getElementById('mimic_iii_first').selectedIndex = 0;
    document.getElementById('mimic_iii_second').innerHTML = '<option value="" disabled selected>Select next 2 digits</option>';
    document.getElementById('mimic_iii_second').disabled = true;
    document.getElementById('mimic_iii_third').innerHTML = '<option value="" disabled selected>Select last 2 digits</option>';
    document.getElementById('mimic_iii_third').disabled = true;
  }

  remsel();
}

function updateMIMICIIISecond()
{
  var firstDigits = document.getElementById('mimic_iii_first').value;
  var secondOptions = <?php echo json_encode(array_reduce($mimic_iii_ids, function($carry, $id)
  {
    $first = substr($id, 0, 3);
    $second = substr($id, 3, 2);
    if (!isset($carry[$first])) $carry[$first] = [];
    if (!in_array($second, $carry[$first])) $carry[$first][] = $second;
    sort($carry[$first]);
    return $carry;
  }, [])); ?>;
    
  var select = document.getElementById('mimic_iii_second');
  select.innerHTML = '<option value="" disabled selected>Select next 2 digits</option>';
  if (secondOptions[firstDigits])
  {
    secondOptions[firstDigits].forEach(function(digits)
    {
        select.innerHTML += '<option value="' + digits + '">' + digits + '</option>';
    });
    select.disabled = false;
  }
  else
  {
    select.disabled = true;
  }
  document.getElementById('mimic_iii_third').innerHTML = '<option value="" disabled selected>Select last 2 digits</option>';
  document.getElementById('mimic_iii_third').disabled = true;

  remsel();
}

function updateMIMICIIIThird()
{
  var firstDigits = document.getElementById('mimic_iii_first').value;
  var secondDigits = document.getElementById('mimic_iii_second').value;
  var thirdOptions = <?php echo json_encode(array_reduce($mimic_iii_ids, function($carry, $id)
  {
    $first = substr($id, 0, 3);
    $second = substr($id, 3, 2);
    $third = substr($id, 5, 2);
    if (!isset($carry[$first])) $carry[$first] = [];
    if (!isset($carry[$first][$second])) $carry[$first][$second] = [];
    if (!in_array($third, $carry[$first][$second])) $carry[$first][$second][] = $third;
    sort($carry[$first][$second]);
    return $carry;
  }, [])); ?>;
    
  var select = document.getElementById('mimic_iii_third');
  select.innerHTML = '<option value="" disabled selected>Select last 2 digits</option>';
  if (thirdOptions[firstDigits] && thirdOptions[firstDigits][secondDigits])
  {
    thirdOptions[firstDigits][secondDigits].forEach(function(digits)
    {
      select.innerHTML += '<option value="' + digits + '">' + digits + '</option>';
    });
    select.disabled = false;
  }
  else
  {
    select.disabled = true;
  }

  remsel();
}

function setMIMICIIISelection()
{
  var firstDigits = document.getElementById('mimic_iii_first').value;
  var secondDigits = document.getElementById('mimic_iii_second').value;
  var thirdDigits = document.getElementById('mimic_iii_third').value;
  var patientId = firstDigits + secondDigits + thirdDigits;
  console.log('Selected MIMIC-III patient ID:', patientId);
  // Here you can add code to handle the selected MIMIC-III patient ID

  remsel();
}

window.addEventListener("load", function()
{
  toggleMIMICVersion();
});


function chooseGRU()
{
  if (document.getElementById("useTF").checked) doPredict();
  else runGRUNetwork();
}

    </script>

    <button id='getdata' class='getdata' disabled onclick="doLoad()">Get Data</button>
    <details open>
     <summary>Available values</summary>
     <div id="checkboxes"></div>
    </details>
   </td>
   <td><div id='thePlot'></div></td>
  </tr>
  <tr class='divider-top'><td colspan=2>&nbsp;</td></tr>
  <tr class='divider-bottom'><td colspan=2>&nbsp;</td></tr>
  <tr>
   <td>
    <h2>Smoothed resampling</h2>
    <table>
     <tr><td>Sampling step (s):</td><td><input id='timeStep' value='20'/></td></tr>
     <tr><td>Standard deviation (s):</td><td><input id='stDev' value='20'/></td></tr>
     <tr><td>Interval start (h):</td><td><input id='startTime' value = '0'/></td></tr>
     <tr><td>Interval end (h):</td><td><input id='endTime' /></td></tr>
     <tr><td>&nbsp;</td><td><button id='doResample' disabled onclick="startResample()">Resample</button>
    </table>
   </td>
   <td><div id='theSample'></div></td>
  </tr>
  <tr class='divider-top'><td colspan=2>&nbsp;</td></tr>
  <tr class='divider-bottom'><td colspan=2>&nbsp;</td></tr>
  <tr>
   <td>
    <h2>Modeling</h2>
    <table>
     <tr><td>Dependent column:</td><td><select id='depcol'></select></td></tr>
     <tr><td><span title="Random number generator initializer.">RNG seed</span>:</td><td><input id='seed' value='123456'/></td></tr>
     <tr><td><span title="The number of timestamps in a single sequence; should be long enough for patterns to emerge.">Window size</span>:</td><td><input id='window' value='5'/></td></tr>
     <tr><td><span title="The number of layers in the GRU network.">Number of layers</span>:</td><td><input id='batches' value = '1'/></td></tr>
     <tr><td><span title="A measure of the model's capacity to capture information at each time step.">Hidden units</span>:</td><td><input id='cells' value = '4'/></td></tr>
     <tr><td><span title="Maximum number of full passes through the training data during model training.">Epochs</span>:</td><td><input id='epochs' value = '100'/></td></tr>
     <tr><td><span title="Percentage of the dataset to be used to train the network.">Training %</span>:</td><td><input id='training' value='20'/></td></tr>
     <tr><td><span title="The rate at which new information is incorporated into the model during training.">Learning rate</span>:</td><td><input id='learnrate' value = '0.3'/></td></tr>
     <tr><td><span title="Number of epochs with no improvement before training is terminated to prevent overfitting.">Patience</span>:</td><td><input id='patience' value='10'/></td></tr>
     <tr><td><span title="The Adam optimizer"><label for='useAdam'>Use Adam optimizer</label></span>:</td><td><input id='useAdam' type='checkbox' onchange='onAdam()'/></td></tr>
     <tr><td class='subopt'><span title="The first parameter of the Adam optimizer.">&beta;<sub>1</sub></span>:</td><td><input id='beta1' value = '0.9' disabled/></td></tr>
     <tr><td class='subopt'><span title="The second parameter of the Adam optimizer.">&beta;<sub>2</sub></span>:</td><td><input id='beta2' value = '0.999' disabled/></td></tr>
     <tr><td class='subopt'><span title="The softening parameter of the Adam optimizer.">&epsilon;</span>:</td><td><input id='epsilon' value = '1e-8' disabled /></td></tr>

     <tr><td colspan=2>&nbsp;</td></tr>
     <tr><td><input type="checkbox" id="useTF"><label for="useTF">Use TensorFlow.js</label>&nbsp;&nbsp;&nbsp;</td><td><button id='doPredict' disabled onclick="chooseGRU()">Run model</button>
                            <button id='doInterrupt' style='display:none' onclick="interruptRun()">Terminate</button></td></tr>
    </table>
   </td>
   <td><div id='theResult'></div></td>
  </tr>
 </table>
 <button id='clearoutput' onclick="clearLog()">Clear</button>&nbsp;<span id='result'></span>
 <div id='output'></div>
</body>
</html>
