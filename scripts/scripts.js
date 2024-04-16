let acronyms = {};

async function loadAcronyms()
{
  try
  {
    const response = await fetch("acronyms.csv");
    const data = await response.text();
    const lines = data.split('\n');

    lines.forEach(line => 
    {
      // Match the key and value, accounting for optional double quotes
      const match = line.match(/^"?(.+?)"?,\s*"?(.*?)"?$/);
      if (match) 
      {
        const key = match[1];
        const value = match[2];
        acronyms[key] = value;
      }
    });
  }
  catch (error)
  {
    console.error('Error fetching or parsing acronyms:', error);
  }
}

window.addEventListener("load", function()
{
  loadAcronyms();
});

function saveAll()
{
  savedata = JSON.stringify(
  {
    data:data,
    reData:reData,
    yResult:yResult,
    xMinMax:xMinMax,
    yMinMax:yMinMax,
    file:document.getElementById('files').value,
    checkboxes:document.getElementById('checkboxes').innerHTML,
    checked:(() => {let a=[]; [...document.getElementById('checkboxes').children].forEach((c,i) => {if (c.children[0].checked) a.push(i);});return a;})(),
    step:document.getElementById('timeStep').value,
    stDev:document.getElementById('stDev').value,
    startTime:document.getElementById('startTime').value,
    endTime:document.getElementById('endTime').value,
    depcols:document.getElementById('depcol').innerHTML,
    depcol:document.getElementById('depcol').value,
    window:document.getElementById('window').value,
    seed:document.getElementById('seed').value,
    batches:document.getElementById('batches').value,
    neurons:document.getElementById('neurons').value,
    epochs:document.getElementById('epochs').value,
    learnrate:document.getElementById('learnrate').value,
    train:document.getElementById('training').value,
    patience:document.getElementById('patience').value,
    validation:document.getElementById('validation').value,
    output:document.getElementById('output').innerHTML,
    result:document.getElementById('result').innerHTML,
    adam:document.getElementById('useAdam').checked,
    beta1:document.getElementById('beta1').value,
    beta2:document.getElementById('beta2').value,
    epsilon:document.getElementById('epsilon').value
  });
  let blob = new Blob([savedata], {type: "application/json"});
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download=document.title + ".json";
  a.click();
}

function loadAll()
{
  let fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json, application/json";
  fileInput.addEventListener("change", () =>
  { 
    let file = fileInput.files[0];
    document.title = file.name.replace(/.json$/,"");
    document.querySelector("h1").innerText = document.title;
    let reader = new FileReader();
    reader.addEventListener("load", () =>
    {
      let savedata = JSON.parse(reader.result);
      data = savedata.data;
      reData = savedata.reData;
      if (savedata.yResult != undefined) yResult = savedata.yResult;
      xMinMax = savedata.xMinMax;
      yMinMax = savedata.yMinMax;
      document.getElementById('files').value = savedata.file;
      document.getElementById('checkboxes').innerHTML = savedata.checkboxes;
      savedata.checked.forEach(i => {document.getElementById('checkboxes').children[i].children[0].checked = true;});
      if (savedata.result != undefined)
        document.getElementById('theResult').innerHTML = savedata.result;
      document.getElementById('timeStep').value = savedata.step;
      document.getElementById('stDev').value = savedata.stDev;
      document.getElementById('startTime').value = savedata.startTime;
      document.getElementById('endTime').value = savedata.endTime;
      document.getElementById('depcol').innerHTML = savedata.depcols;
      document.getElementById('depcol').value = savedata.depcol;
      document.getElementById('window').value = savedata.window;
      document.getElementById('batches').value = savedata.batches;
      document.getElementById('neurons').value = savedata.neurons;
      document.getElementById('epochs').value = savedata.epochs;
      if (savedata.learnrate != undefined) document.getElementById('learnrate').value = savedata.learnrate;
      document.getElementById('training').value = savedata.train;
      if (savedata.patience != undefined) document.getElementById('patience').value = savedata.patience;
      if (savedata.validation != undefined) document.getElementById('validation').value = savedata.validation;
      if (savedata.seed != undefined) document.getElementById('seed').value = savedata.seed;
      else document.getElementById('validation').value = 0;
      document.getElementById('output').innerHTML = savedata.output;
      document.getElementById('result').innerHTML = savedata.result;

      const adam = savedata.adam != undefined ? savedata.adam : false;
      document.getElementById('useAdam').checked = adam;
      document.getElementById('beta1').disabled = !adam;
      document.getElementById('beta2').disabled = !adam;
      document.getElementById('epsilon').disabled = !adam;
      document.getElementById('beta1').value = savedata.beta1 != undefined ? savedata.beta1 : 0.9;
      document.getElementById('beta2').value = savedata.beta2 != undefined ? savedata.beta2 : 0.999;
      document.getElementById('epsilon').value = savedata.epsilon != undefined ? savedata.epsilon : 1e-8;

      document.getElementById('getdata').disabled = false;
      document.getElementById('doResample').disabled = false;
      document.getElementById('doPredict').disabled = false;

      document.querySelectorAll("#checkboxes input").forEach(item =>
      {
        item.addEventListener("click", onCheck);
      });

      doPlot();
      doRePlot();
      if (savedata.yResult != undefined) plotResult();

      fileInput.remove();
    });
    reader.readAsText(file);
  });
  fileInput.click();
}

function normalize(min, max, tick)
{
  if (min > max) [min, max] = [max, min];
  if (max < 0) max = 0;
  if (min > 0) min = 0;
  const mag = Math.max(Math.abs(min), Math.abs(max));
  let l = Math.floor(Math.log10(mag) + 1e-10);
  max *= 10 ** (-l);
  min *= 10 ** (-l);
  if (Math.abs(max) > 8) max = Math.sign(max) * 10;
  else if (Math.abs(max) > 5) max = Math.sign(max) * 8;
  else if (Math.abs(max) > 3) max = Math.sign(max) * 5;
  else if (Math.abs(max) > 2) max = Math.sign(max) * 3;
  else if (Math.abs(max) > 1) max = Math.sign(max) * 2;
  else max = Math.sign(max);
  if (Math.abs(min) > 8) min = Math.sign(min) * 10;
  else if (Math.abs(min) > 5) min = Math.sign(min) * 8;
  else if (Math.abs(min) > 3) min = Math.sign(min) * 5;
  else if (Math.abs(min) > 2) min = Math.sign(min) * 3;
  else if (Math.abs(min) > 1) min = Math.sign(min) * 2;
  else min = Math.sign(min);
  max = Math.floor(max * 10 ** l + 0.5);
  min = Math.floor(min * 10 ** l + 0.5);
  if (max == min) max = min + 1;

  if (tick > 10) tick = 10;
  let step = (max - min) / tick;
  l = Math.floor(Math.log10(step) + 1e-10);
  step *= 10 ** (-l);
  if (step > 10) step = 10;
  else if (step > 5) step = 5;
  else if (step > 2) step = 2;
  else step = 1;
  step *= 10 ** l;
  tick = (max - min) / step;

  return [min, max, tick];
}

function plotDatasets(datasets, xMin, xMax, yMin, yMax, width, height, options = {})
{
  // Default options
  const defaultOptions =
  {
    drawAxes: true,
    axisLabels: { x: 'x', y: 'y' },
    plotStyles: datasets.map(() =>
    ({color: 'steelblue', lineWidth: 1.5, lineStyle: 'solid' })),
    tickCount: { x: 5, y: 5 },
    backgroundColor: 'white',
    axisColor: 'black',
  };

  // Merge user options with default options
  options = { ...defaultOptions, ...options };

  [xMin, xMax, options.tickCount.x] = normalize(xMin, xMax, options.tickCount.x);
  [yMin, yMax, options.tickCount.y] = normalize(yMin, yMax, options.tickCount.y);

  // Create an SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  // Set background color
  svg.style.backgroundColor = options.backgroundColor;
  // Create scales for the x and y axes
  const xScale = x => (x - xMin) / (xMax - xMin) * width;
  const yScale = y => height - (y - yMin) / (yMax - yMin) * height;
  if (options.drawAxes)
  {
    // Draw x-axis
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", xScale(xMin));	
    xAxis.setAttribute("y1", yScale(yMin));	// Use 0 for zero crossing axes
    xAxis.setAttribute("x2", xScale(xMax));
    xAxis.setAttribute("y2", yScale(yMin));	// Use 0 for zero crossing axes
    xAxis.setAttribute("stroke", options.axisColor);
    xAxis.setAttribute("stroke-width", 1);
    svg.appendChild(xAxis);
    // Draw y-axis
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", xScale(xMin));	// Use 0 for zero crossing axes
    yAxis.setAttribute("y1", yScale(yMin));
    yAxis.setAttribute("x2", xScale(xMin));	// Use 0 for zero crossing axes
    yAxis.setAttribute("y2", yScale(yMax));
    yAxis.setAttribute("stroke", options.axisColor);
    yAxis.setAttribute("stroke-width", 1);
    svg.appendChild(yAxis);
    // Add axis labels
    const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabel.textContent = options.axisLabels.x;
    xLabel.setAttribute("x", xScale(xMax) - 40);
    xLabel.setAttribute("y", yScale(yMin) - 5);	// Use 0 for zero crossing axes
    xLabel.style.fill = options.axisColor;
    xLabel.style.fontFamily = "serif";
    svg.appendChild(xLabel);
    const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yLabel.textContent = options.axisLabels.y;
    yLabel.setAttribute("x", xScale(xMin) + 5);	// Use 0 for zero crossing axes
    yLabel.setAttribute("y", yScale(yMax) + 10);
    yLabel.style.fill = options.axisColor;
    yLabel.style.fontFamily = "serif";
    svg.appendChild(yLabel);
    // Add tickmarks and tick labels
    for (let i = 1; i < options.tickCount.x; i++)
    {
      const xStep = (xMax - xMin) / options.tickCount.x;
      let xPos = xMin + i * xStep;
      xPos = xStep * Math.floor(xPos / xStep);
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", xScale(xPos));
      tick.setAttribute("y1", yScale(yMin) - 5);	// Use 0 for zero crossing axes
      tick.setAttribute("x2", xScale(xPos));
      tick.setAttribute("y2", yScale(yMin) + 5);	// Use 0 for zero crossing axes
      tick.setAttribute("stroke", options.axisColor);
      tick.setAttribute("stroke-width", 1);
      svg.appendChild(tick);
      const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tickLabel.textContent = xPos.toFixed(2);
      tickLabel.setAttribute("x", xScale(xPos) - 10);
      tickLabel.setAttribute("y", yScale(yMin) - 10);	// Use 0 for zero crossing axes
      tickLabel.style.fill = options.axisColor;
      tickLabel.style.fontFamily = "serif";
      svg.appendChild(tickLabel);
    }
    for (let i = 1; i < options.tickCount.y; i++)
    {
      const yStep = (yMax - yMin) / options.tickCount.y;
      let yPos = yMin + i * yStep;
      yPos = yStep * Math.floor(yPos / yStep);
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", xScale(xMin) - 5);	// Use 0 for zero crossing axes
      tick.setAttribute("y1", yScale(yPos));
      tick.setAttribute("x2", xScale(xMin) + 5);	// Use 0 for zero crossing axes
      tick.setAttribute("y2", yScale(yPos));
      tick.setAttribute("stroke", options.axisColor);
      tick.setAttribute("stroke-width", 1);
      svg.appendChild(tick);
      const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tickLabel.textContent = yPos.toFixed(2);
      tickLabel.setAttribute("x", xScale(xMin) + 10);	// Use 0 for zero crossing axes
      tickLabel.setAttribute("y", yScale(yPos) + 5);
      tickLabel.style.fill = options.axisColor;
      tickLabel.style.fontFamily = "serif";
      svg.appendChild(tickLabel);
    }
  }

  datasets.forEach((data, index) =>
  {
    const pathData = data.map((d, i) =>
    {
      if (isNaN(d.y)) return "";
      const x = xScale(d.x);
      const y = yScale(d.y);
      return (i === 0 ? "M" : "L") + x + "," + y;
    }).join(" ");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", options.plotStyles[index].color);
    path.setAttribute("opacity", options.plotStyles[index].opacity);
    path.setAttribute("stroke-width", options.plotStyles[index].lineWidth);
    path.setAttribute("stroke-dasharray", options.plotStyles[index].lineStyle === 
   'dashed' ? '4, 4' : '');
    svg.appendChild(path);
  });
  return svg;
}

const styles =
[
  { color: 'steelblue', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
  { color: 'red', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
  { color: 'green', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
  { color: 'orange', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
  { color: 'purple', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
  { color: 'darkgray', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
  { color: 'brown', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
  { color: 'black', lineWidth: 0.5, lineStyle: 'solid', opacity: 1 },
];

onCheck = function()
{
  let i = 0;
  for (let item of document.getElementById('checkboxes').children)
  {
    if (item.querySelector('input').checked)
    {
      item.querySelector('span').style.color = styles[i++].color;
      item.querySelector('span').style.opacity = 1;
    }
    else
    {
      item.querySelector('span').style.color = 'white';
      item.querySelector('span').style.opacity = 0;
    }
  }
  document.getElementById("getdata").disabled = document.querySelectorAll('#checkboxes input[type="checkbox"]:checked').length == 0;
}

var data = [];
var xMinMax = [];
var yMinMax = [];
var reData;
var yResult;

doPlot = function()
{
  const options =
  {
    drawAxes: true,
    axisLabels: { x: 'hours', y: 'values' },
    plotStyles: styles,
    tickCount: { x: 5, y: 5 },
    backgroundColor: '#F8F8F8',
    axisColor: 'black',
  };

  var svgData = plotDatasets(data, xMinMax[0], xMinMax[1], yMinMax[0], yMinMax[1],800,400, options);
  var thePlot = document.getElementById('thePlot');
  thePlot.innerHTML = "";
  thePlot.appendChild(svgData);
}

doLoad = function()
{
  let labels = [];
  let promises = [];
  const file = document.querySelector("#files").value;

  data = [];
  xMinMax = [];
  yMinMax = [];

  document.body.style.cursor = 'wait';
  document.getElementById('overlay').style.display = 'block';

  document.getElementById('depcol').innerHTML = "";

  let i = 0;
  document.querySelectorAll("#checkboxes input").forEach(item =>
  {
    if (item.checked)
    {
      const label = item.value;

      let option = document.createElement("option");
      option.innerText = label;
      option.value = i++;
      document.getElementById('depcol').appendChild(option);

      promises.push(
        fetch(`getdata.php?file=${file}&column=${label}`)
        .then(res => res.json())
        .then(values =>
        {
          data.push(values);
          labels.push(label);
          xMinMax.push(values.reduce((a, b) => [Math.min(a[0], b.x), Math.max(a[1], b.x)], [values[0].x, values[0].x]));
          yMinMax.push(values.reduce((a, b) => [Math.min(a[0], b.y), Math.max(a[1], b.y)], [values[0].x, values[0].y]));
        })
      );
    }
  });

  Promise.all(promises).then(() =>
  {
    // All fetches have completed!

    const combined = data.map((item, index) =>
    {
      return { label: labels[index], data: item };
    });

    // Sort the combined array based on the label
    combined.sort((a, b) => a.label.localeCompare(b.label));

    // Separate the combined array back into data and labels arrays
    labels = combined.map(item => item.label);
    data = combined.map(item => item.data);

    xMinMax = xMinMax.reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])], [xMinMax[0][0], xMinMax[0][1]]);
    yMinMax = yMinMax.reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])], [yMinMax[0][0], yMinMax[0][1]]);

    document.getElementById('endTime').value = -Math.floor(-xMinMax[1]);

    doPlot();
    document.body.style.cursor = '';
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('doResample').disabled = false;
  });
}

function remsel()
{
  document.title = "MIMIC-high-cadence-" + document.querySelector("#files").value.substr(0,8) + "-1";
  document.querySelector("h1").innerText = document.title;

  document.getElementById('files').querySelector('option:first-child').removeAttribute('selected');
  getColumns();
  document.getElementById("getdata").disabled = true;
  document.getElementById('doResample').disabled = true;
  document.getElementById('doPredict').disabled = true;
}


function doWork(e)
{
  function gaussianWeight(distance, stdDev)
  {
    return Math.exp(-0.5 * Math.pow(distance / stdDev, 2));
  }

  function resampleData(data, resolution, stdDev, startTime, endTime)
  {
    // if (startTime < data[0].x) startTime = data[0].x;
    startTime = Math.floor(startTime / resolution) * resolution;
    if (endTime > data[data.length - 1].x) endTime = data[data.length - 1].x;
    endTime = -Math.floor(-endTime / resolution) * resolution;

    // Initialize the resampled array
    const resampled = [];

    // Define a threshold for the Gaussian weight below which we stop considering points
    const weightThreshold = 1e-12;

    // Function to perform binary search
    function binarySearchClosest(array, target)
    {
      let start = 0;
      let end = array.length - 1;
      let bestIndex = -1;
      let bestDist = Infinity;
  
      while (start <= end)
      {
        let mid = Math.floor((start + end) / 2);
        let dist = Math.abs(array[mid].x - target);
        if (dist < bestDist)
        {
          bestDist = dist;
          bestIndex = mid;
        }
        if (array[mid].x < target)
        {
          start = mid + 1;
        }
        else if (array[mid].x > target)
        {
          end = mid - 1;
        }
        else
        {
          return mid; // Exact match found
        }
      }
      return bestIndex; // Return the index of the closest element
    }
  
    // Loop over the desired timestamps
    for (let t = startTime; t <= endTime; t += resolution)
    {
      let weightedSum = 0;
      let weightSum = 0;
  
      // Find the closest data point to the timestamp t using binary search
      const closestIndex = binarySearchClosest(data, t);
  
      // Sample nearby points on both sides of t
      for (let i = closestIndex; i < data.length; i++)
      {
        const distance = Math.abs(data[i].x - t);
        const weight = gaussianWeight(distance, stdDev);
        if (weight < weightThreshold) break; // Stop if weight is too small
        weightedSum += data[i].y * weight;
        weightSum += weight;
      }
      for (let i = closestIndex - 1; i >= 0; i--)
      {
        const distance = Math.abs(data[i].x - t);
        const weight = gaussianWeight(distance, stdDev);
        if (weight < weightThreshold) break; // Stop if weight is too small
        weightedSum += data[i].y * weight;
        weightSum += weight;
      }
  
      // Compute the weighted average for the current timestamp
      const weightedAverage = weightedSum / weightSum;
  
      // Add the resampled point to the array
      resampled.push({ x: t, y: weightedAverage });
    }
  
    return resampled;
  }

  if (e.data.cmd === 'run')
  {
    let reData = [];
    let data = e.data.data;
    let startTime = e.data.start;
    let endTime = e.data.end;
    let resolution = e.data.res;
    let stDev = e.data.stDev;

    data.forEach(item =>
    {
      reData.push(resampleData(item, resolution, stDev, startTime, endTime));
    });
    self.postMessage(reData);
  }
}

function startResample()
{
  document.body.style.cursor = 'wait';
  document.getElementById('overlay').style.display = 'block';

  let worker = new Worker(window.URL.createObjectURL(new Blob(["onmessage=" + doWork.toString()], {type: "text/javascript"})));

  worker.onerror = function(e)
  {
    console.log("There was an error in the worker (2).");
  }

  worker.onmessage = function(e)
  {
    reData = trimAndImputeData(e.data);
    doResample();
    document.getElementById('doPredict').disabled = false;
  }
  let startTime = document.getElementById('startTime').value;
  let endTime = document.getElementById('endTime').value;
  let resolution = document.getElementById('timeStep').value / 3600.0;
  let stDev = document.getElementById('stDev').value / 3600.0;
  worker.postMessage({cmd: 'run', data: data, start: startTime, end: endTime, res: resolution, stDev: stDev });
}

function doRePlot()
{
  const options =
  {
    drawAxes: true,
    axisLabels: { x: 'hours', y: 'values' },
    plotStyles: styles,
    tickCount: { x: 5, y: 5 },
    backgroundColor: '#F8F8F8',
    axisColor: 'black',
  };

  const svgData = plotDatasets(reData, xMinMax[0], xMinMax[1], yMinMax[0], yMinMax[1],800,400, options);
  let theSample = document.getElementById('theSample');
  theSample.innerHTML = "";
  theSample.appendChild(svgData);
}

function doResample()
{
  document.getElementById('theResult').innerHTML = "";
  document.getElementById('output').innerHTML = "";
  document.body.style.cursor = '';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('doPredict').disabled = false;

  doRePlot();
}

function removeUnits(acronymWithUnits)
{
  const match = acronymWithUnits.match(/^([^\[\]]+)(?:\s*\[.*\])?$/);
  if (match && match[1]) { return match[1].trim(); }
  return acronymWithUnits;
}

function getColumns()
{
  let select = document.querySelector("#files");
  let file = select.value;

  document.getElementById('thePlot').innerHTML = "";
  document.getElementById('theSample').innerHTML = "";
  document.getElementById('theResult').innerHTML = "";
  document.getElementById('output').innerHTML = "";
  let lbl = 1;

  fetch(`getcol.php?file=${file}`)
  .then(res => res.json())
  .then(columns =>
  {
    let checkboxes = document.querySelector("#checkboxes");
    checkboxes.innerHTML = "";

    columns.sort((a, b) => a.localeCompare(b));

    for (let column of columns)
    {
      if (column === "time") continue;
      let div = document.createElement("div");
      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = column;
      checkbox.id = "cb" + lbl;
      checkbox.addEventListener("click", onCheck);
      div.append(checkbox);
      //let label = document.createTextNode(column + " ");
      let label = document.createElement("label");
      label.innerText = column;
      label.setAttribute("for", "cb" + (lbl++));
      const acronym = acronyms[removeUnits(column)];
      if (acronym != undefined) label.setAttribute("title", acronym);
      div.append(label);
      let span = document.createElement("span");
      span.classList.add("legend");
      span.innerHTML = "&#9608;&#9608;&#9608;&#9608;&#9608;";
      div.append(span);
      checkboxes.append(div);
    }
  });
}

function trimAndImputeData(dataArrays)
{
  // Find the common start and end timestamps across all arrays
  const commonStart = Math.max(...dataArrays.map(arr => arr[0].x));
  const commonEnd = Math.min(...dataArrays.map(arr => arr[arr.length - 1].x));

  // Trim arrays to only include data within the common range
  const trimmedDataArrays = dataArrays.map(arr =>
    arr.filter(d => d.x >= commonStart && d.x <= commonEnd)
  );

  // Replace NaN values with the nearest non-NaN values
  const imputedDataArrays = trimmedDataArrays.map(arr =>
  {
    for (let i = 0; i < arr.length; i++)
    {
      if (isNaN(arr[i].y))
      {
        // Find the nearest non-NaN values to the left and right
        let left = i - 1, right = i + 1;
        while (left >= 0 && isNaN(arr[left].y)) left--;
        while (right < arr.length && isNaN(arr[right].y)) right++;

        // Calculate the distance-weighted average of the nearest non-NaN values
        const leftDist = left >= 0 ? arr[i].x - arr[left].x : Infinity;
        const rightDist = right < arr.length ? arr[right].x - arr[i].x : Infinity;
        const totalDist = leftDist + rightDist;

        // If both sides have non-NaN values, use a weighted average
        if (left >= 0 && right < arr.length)
        {
          arr[i].y = (arr[left].y * (rightDist / totalDist)) + (arr[right].y * (leftDist / totalDist));
        }
        else if (left >= 0)
        { // If only the left side has a non-NaN value, use it
          arr[i].y = arr[left].y;
        }
        else if (right < arr.length)
        { // If only the right side has a non-NaN value, use it
          arr[i].y = arr[right].y;
        }
      }
    }
    return arr;
  });

  return imputedDataArrays;
}
/*
function doPredict()
{
  const steps = 1*document.getElementById('window').value;
  const train = 1*document.getElementById('training').value;
  const epochs = 1*document.getElementById('epochs').value;
  const batches = 1*document.getElementById('batches').value;
  const neurons = 1*document.getElementById('neurons').value;
  const depcol = 1*document.getElementById('depcol').value;
  const patience = 1*document.getElementById('patience').value;
  const validation = 1*document.getElementById('validation').value;

  document.body.style.cursor = 'wait';
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('theResult').innerHTML = "";

  document.getElementById('output').innerText = "Preparing the data...";

  function prePredict(e)
  {
    let theEpoch = 0;
    async function runPrediction(xData, yData, xInput, train, steps, batches, epochs, neurons, patience, validation)
    {
      importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest");

      function normalizeAndPackageData(dataArrays, tLabel, vLabel, steps, batches)
      {
        // Normalize each data array individually
        const normalizedDataArrays = dataArrays.map(arr =>
        {
          const values = arr.map(d => d[vLabel]);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);
          return arr.map(d => (d[vLabel] - minValue) / (maxValue - minValue));
        });

        // Repackage the data for TensorFlow.js
        // Assuming each sub-array represents a feature dimension and all arrays are of the same length
        const numSamples = Math.floor(normalizedDataArrays[0].length / steps / batches) * batches;
        const numFeatures = normalizedDataArrays.length;
        const packagedData = [];

        for (let i = 0; i < numSamples; i++)
        {
          for (let j = 0; j < steps; j++)
          {
            for (let k = 0; k < numFeatures; k++)
            {
              packagedData.push(normalizedDataArrays[k][i*steps +j]);
            }
          }
        }

        // Convert to a 3D tensor: [numSamples, numTimeSteps, numFeatures]
        const tensorData = tf.tensor3d(packagedData, [numSamples, steps, numFeatures]);

        return tensorData;
      }

      // Define a sequential model
      const model = tf.sequential();

      // Add a GRU layer
      model.add(tf.layers.gru(
      {
        units: neurons,
        inputShape: [steps, xData.length],
        returnSequences: true, // Set to true if you want the output for each time step
        stateful: true,
        batchSize: batches,
        kernelInitializer: tf.initializers.heUniform({ seed: 42 }),
        recurrentInitializer: tf.initializers.heUniform({ seed: 24 }), // Set the seed for recurrent weights
        biasInitializer: 'zeros' // Typically biases are initialized to zeros
      }));
/--*
model.add(tf.layers.gru({
//  units: neurons,
  units: Math.max(2, Math.floor(neurons/2)),
  returnSequences: true,
  stateful: true,
  kernelInitializer: tf.initializers.heUniform({ seed: 42 }),
  recurrentInitializer: tf.initializers.heUniform({ seed: 24 }), // Set the seed for recurrent weights
  biasInitializer: 'zeros' // Typically biases are initialized to zeros
}));
*--/

      // Add a time-distributed dense layer to predict a sequence of 'z' values
      model.add(tf.layers.timeDistributed(
      {
        layer: tf.layers.dense(
        {
          units: 1,
          kernelInitializer: tf.initializers.heUniform({ seed: 48 })
        })
      }));

      self.postMessage({progress: "Compiling the model..."});

      // Compile the model
      model.compile(
      {
        loss: 'meanSquaredError',
        optimizer: 'adam'
      });

      if (false)
      {
        // Log the initial weights and biases for each layer
        model.layers.forEach((layer, index) =>
        {
          layer.getWeights().forEach((weightTensor, weightIndex) =>
          {
            // Print the weight tensor values to the console
            weightTensor.data().then(data =>
            {
              console.log(`Layer ${index} - Weight ${weightIndex}:`, Array.from(data));
            });
          });
        });
      }

      self.postMessage({progress: "Packaging the data..."});

      const trainSize = Math.floor(xData[0].length * (1 - 0.01*validation) / (steps*batches)) * (steps*batches);
console.log("trainSize = " + trainSize);
console.log("yData[0].length = " + yData[0].length);
      const trainXData = xData.map(a => a.slice(0, trainSize));
      const trainYData = yData.map(a => a.slice(0, trainSize));
      const valXData = xData.map(a => a.slice(trainSize));
      const valYData = yData.map(a => a.slice(trainSize));

      // Package and normalize data separately for training and validation
      let xs = normalizeAndPackageData(trainXData, "x", "y", steps, batches);
      let ys = normalizeAndPackageData(trainYData, "x", "y", steps, batches);
      let valXs = normalizeAndPackageData(valXData, "x", "y", steps, batches);
      let valYs = normalizeAndPackageData(valYData, "x", "y", steps, batches);
console.log("valXData[0].length = " + valXData[0].length);
      const doValidation = valXData[0].length >= steps*batches;

      self.postMessage({progress: "Training the model..."});

      // Define early stopping parameters
      const min_delta = 0;
      let bestValLoss = Number.POSITIVE_INFINITY;
      let epochsWithoutImprovement = 0;
      let bestWeights = null; // To store the best weights

      const modelParams =
      {
        epochs: epochs,
        batchSize: batches,
        shuffle: false,
        callbacks: 
        {
          onEpochBegin: () =>
          {
            model.resetStates();
          },
          onEpochEnd: (epoch, logs) =>
          {
            self.postMessage(
            {
              progress: `Epoch ${epoch}: ${doValidation ? "validation " : ""}loss = ${(doValidation ? logs.val_loss : logs.loss)}`
            });
            if (!doValidation)
            {
              theEpoch = epoch;
              return;
            }
            if (logs.val_loss < bestValLoss - min_delta)
            {
              bestValLoss = logs.val_loss;
              epochsWithoutImprovement = 0;
              // Save a copy of the current best weights
              bestWeights = model.getWeights().map(w => w.clone());
              theEpoch = epoch;
            }
            else
            {
              epochsWithoutImprovement++;
              if (epochsWithoutImprovement >= patience)
              {
                model.stopTraining = true; // Stop the training
                if (bestWeights)
                {
                  model.setWeights(bestWeights); // Restore the best weights
                  // Dispose the cloned tensors to free memory
                  bestWeights.forEach(w => w.dispose());
                }
              }
            }
          }
        }
      };

      if (doValidation) modelParams.validationData = [valXs, valYs];

      // Train the model
      await model.fit(xs, ys, modelParams);

      self.postMessage({progress: "Running the model..."});

      let testInput = normalizeAndPackageData(xInput, "x", "y", steps, batches);
      return result = model.predict(testInput, { batchSize: batches });
    }

    if (e.data.cmd === 'run')
    {
      let xData = [];
      let yData = [];
      let xInput = [];

      let reData = e.data.reData;
      let depcol = e.data.depcol;
      let train = e.data.train;
      let steps = e.data.steps;
      let batches = e.data.batches;
      let epochs = e.data.epochs;
      let neurons = e.data.neurons;
      let patience = e.data.patience;
      let validation = e.data.validation;

      for (let i = 0; i < reData.length; i++)
      {
        if (i == depcol) yData.push(reData[i].toSpliced(Math.floor(0.01*train*reData[i].length)));
        else
        {
          xData.push(reData[i].toSpliced(Math.floor(0.01*train*reData[i].length)));
          xInput.push(reData[i].toSpliced(0, Math.floor(0.01*train*reData[i].length)));
        }
      }

      self.postMessage({progress: "Running the predictor..."});

      runPrediction(xData, yData, xInput, train, steps, batches, epochs, neurons, patience, validation)
      .then(result =>
      {
        let yResult = [];
        let i = 0;
        function flatten(r)
        {
          for (let k = 0; k < r.length; k++)
          {
            if (Array.isArray(r[k])) flatten(r[k]);
            else
            {
              var v = r[k] * (maxValue - minValue) + minValue;
              yResult.push({x: xInput[0][i++].x, y: v});
            }
          }
        }
        const allValues = yData.reduce((acc, arr) => acc.concat(arr.map(d => d.y)), []);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const resultData = result.dataSync();
        result.dispose();
        flatten(resultData);
        self.postMessage({yResult: yResult, epochs: theEpoch});
      }).catch(error =>
      {
console.log(error);
        //self.postMessage({error: "An error has occured."});
        self.postMessage({error: error.toString().split('\n')[0]});
      });
    }
  }

  let worker = new Worker(window.URL.createObjectURL(new Blob(["onmessage=" + prePredict.toString()], {type: "text/javascript"})));

  worker.onerror = function(e)
  {
    console.log("There was an error in the worker (1).");
  }

  worker.onmessage = function(e)
  {
    if (e.data.progress != undefined)
    {
      document.getElementById('output').innerText = e.data.progress;
      // Great idea but we haven't run the model yet and it's costly to do so.
      //showResult(e.data.epochs);
      //plotResult();
      //document.getElementById('output').innerHTML += "<br/>" + e.data.progress;
      console.log(e.data.progress);
    }
    else if (e.data.error != undefined)
    {
      document.getElementById('output').innerHTML = "<span class='error'>" + e.data.error + "</span>";
      document.body.style.cursor = '';
      document.getElementById('overlay').style.display = 'none';
    }
    else
    {
      yResult = e.data.yResult;

      showResult(e.data.epochs);
      plotResult();
      document.body.style.cursor = '';
      document.getElementById('overlay').style.display = 'none';
    }
  }

  worker.postMessage(
  {
    cmd: 'run',
    reData: reData,
    depcol: depcol,
    train: train,
    steps: steps,
    batches: batches,
    epochs: epochs,
    neurons: neurons,
    patience: patience,
    validation: validation });
}

*/
/*
function showResult(maxEpoch)
{
  const depcol = 1*document.getElementById('depcol').value;
  let sumOfSquares = 0;
  let count = 0;
  let reDataIndex = 0;
  let sum = 0;
  let sum2 = 0;

  // Find the starting index in reData[depcol] that matches the first x in yResult
  while (reDataIndex < reData[depcol].length && Math.abs(reData[depcol][reDataIndex].x - yResult[0].x) >= 1e-12)
  {
    reDataIndex++;
  }

  // If we didn't find a match, throw an error
  if (reDataIndex >= reData[depcol].length)
  {
    throw new Error('No matching starting element found in reData[depcol]');
  }

  // Now iterate through yResult and the corresponding range in reData[depcol] simultaneously
  for (let i = 0; i < yResult.length; i++)
  {
    // Check if the x values match within the tolerance
    if (Math.abs(reData[depcol][reDataIndex].x - yResult[i].x) < 1e-12)
    {
      let difference = yResult[i].y - reData[depcol][reDataIndex].y;
      sumOfSquares += difference * difference;
      count++;
      sum += reData[depcol][reDataIndex].y;
      sum2 += reData[depcol][reDataIndex].y ** 2;
    } else {
      // If they don't match, we may have gone past the contiguous subset
      break;
    }
    reDataIndex++;
  }

  // Calculate the chi-squared per degree of freedom
  let degreesOfFreedom = count - 1; // Assuming one parameter fitted
  if (degreesOfFreedom <= 0)
  {
    throw new Error('Degrees of freedom must be positive');
  }
  let variance = (sum2 - sum**2 / count) / count;
  let chiSquaredPerDF = sumOfSquares / variance / degreesOfFreedom;
  document.getElementById('output').innerHTML =
    "(&chi;&sup2;)<sub>&nu;</sub> = " + chiSquaredPerDF.toPrecision(5) +
    " (epochs = " + (maxEpoch*1+1) + ")";
}
*/
function plotResult()
{
  const depcol = 1*document.getElementById('depcol').value;

  const options =
  {
    drawAxes: true,
    axisLabels: { x: 'hours', y: 'values' },
    plotStyles: [JSON.parse(JSON.stringify(styles[depcol])), JSON.parse(JSON.stringify(styles[depcol]))],
    tickCount: { x: 5, y: 5 },
    backgroundColor: '#F8F8F8',
    axisColor: 'black',
  };
  options.plotStyles[0].lineWidth = 0.25;
  options.plotStyles[0].opacity = 0.5;
  options.plotStyles[1].lineWidth = 1.5;

  const svgData = plotDatasets([reData[depcol], yResult], xMinMax[0], xMinMax[1], yMinMax[0], yMinMax[1],800,400, options);
  let theResult = document.getElementById('theResult');
  theResult.innerHTML = "";
  theResult.appendChild(svgData);
}

function onAdam()
{
  const checked = document.getElementById('useAdam').checked;
  console.log("ADAM is " + (checked ? "is" : "isn't") + " checked.");
  document.getElementById("beta1").disabled = !checked;
  document.getElementById("beta2").disabled = !checked;
  document.getElementById("epsilon").disabled = !checked;
}

window.onerror = function()
{
  console.log("There was a big honking error somewhere.");
}
