<html>
<head>
<title>MIMIC high-cadence</title>
<link rel="stylesheet" href="css/styles.css?v=47" type="text/css" />
<script src="scripts/scripts.js"></script>
</head>
<body>
 <div id="overlay"></div>
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
     <tr><td>Sampling step (s):</td><td><input id='timeStep' value='30'/></td></tr>
     <tr><td>Standard deviation (s):</td><td><input id='stDev' value='30'/></td></tr>
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
     <tr><td>Window size:</td><td><input id='window' value='10'/></td></tr>
     <tr><td>Batch size:</td><td><input id='batches' value = '5'/></td></tr>
     <tr><td>Neurons:</td><td><input id='neurons' value = '5'/></td></tr>
     <tr><td>Epochs:</td><td><input id='epochs' value = '20'/></td></tr>
     <tr><td>Training %:</td><td><input id='training' value='25'/></td></tr>
     <tr><td>&nbsp;</td><td><button id='doPredict' disabled onclick="doPredict()">Run model</button>
    </table>
   </td>
   <td><div id='theResult'></div></td>
  </tr>
 </table>
 <div id='output'></div>
</body>
</html>
