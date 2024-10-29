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
    <h2 class='patient'>Patient:</h2>
<?php
 $dir = './DATA/'; 
 $files = scandir($dir);
 $options = '';
 foreach ($files as $file)
 {
   if (strpos($file, '.csv'))
   {
     $option_value = $file;
     $option_text = substr($file, 0, -4);
     $options .= "<option value='$option_value'>$option_text</option>"; 
   }
 }
 echo "<select id='files' required='' onchange='remsel()'>";
 echo "<option value='' disabled='' selected=''>Select a patient</option>";
 echo "$options</select>";
?>
    <button id='getdata' disabled onclick="doLoad()">Get Data</button>
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
<!--
     <tr><td colspan=2><h4>Early stopping parameters</h4></td></tr>
     <tr><td><span title="Number of epochs with no improvement before training is terminated to prevent overfitting.">Patience</span>:</td><td><input id='patience' value='10'/></td></tr>
     <tr><td><span title="Percentage of training data for use in monitoring to prevent overfitting.">Validation %</span>:</td><td><input id='validation' value='25'/></td></tr> -->
<!--     <tr><td>&nbsp;</td><td><button id='doPredict' disabled onclick="doPredict()">Run model</button> -->
<script lang='javascript'>
function chooseGRU()
{
  if (document.getElementById("useTF").checked) doPredict();
  else runGRUNetwork();
}
</script>
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
