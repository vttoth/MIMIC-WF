function generate_input_dataset(srcData, sequence_length, start_pct = 0, end_pct = 100)
{
  const dataset = [];
  const num_sequences = Math.floor(srcData[srcData.length-1].length / sequence_length);
  const start_sequence = Math.floor(num_sequences * start_pct / 100);
  const end_sequence = Math.floor(num_sequences * end_pct / 100);
  const dep_col = document.getElementById('depcol').value;
  const input_size = srcData.length - 1;
  for (let i = start_sequence; i < end_sequence; ++i)
  {
    const sequence = [];
    for (let j = 0; j < sequence_length; ++j)
    {
      const m = new Matrix(input_size, 1);
      let l = 0;
      for (let k = 0; k < srcData.length; ++k)
      {
        if (k == dep_col) continue;
        m.data[l++][0] = srcData[k][i * sequence_length + j].y;
      }
      sequence.push(m);
    }
    dataset.push(sequence);
  }
  return dataset;
}

function generate_output_dataset(srcData, sequence_length, start_pct = 0, end_pct = 100)
{
  const dataset = [];
  const num_sequences = Math.floor(srcData[srcData.length-1].length / sequence_length);
  const start_sequence = Math.floor(num_sequences * start_pct / 100);
  const end_sequence = Math.floor(num_sequences * end_pct / 100);
  const dep_col = document.getElementById('depcol').value;
  for (let i = start_sequence; i < end_sequence; ++i)
  {
    const sequence = [];
    for (let j = 0; j < sequence_length; ++j)
    {
      const m = new Matrix(1, 1, srcData[dep_col][i * sequence_length + j].y);
      sequence.push(m);
    }
    dataset.push(sequence);
  }
  return dataset;
}

function normalizeDataset(dataset)
{
  const normalizedDataset = [];
  const normalizationFactors = [];

  for (const series of dataset)
  {
    const yValues = series.map(point => point.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const range = maxY - minY;

    const normalizedSeries = series.map(point => ({
      x: point.x,
      y: (point.y - minY) / range
    }));

    normalizedDataset.push(normalizedSeries);
    normalizationFactors.push({ scale: range, bias: minY });
  }

  return { srcData: normalizedDataset, srcFactors: normalizationFactors };
}

let worker;

function runGRUNetwork()
{
  document.getElementById('doPredict').style.display = "none";
  document.getElementById('doInterrupt').style.display = "";

  const {srcData, srcFactors} = normalizeDataset(reData);

  const input_size = srcData.length - 1;
  const hidden_size = parseInt(document.getElementById('neurons').value);
  const num_layers = parseInt(document.getElementById('batches').value);
  const sequence_length = parseInt(document.getElementById('window').value);
  const seed = parseInt(document.getElementById('seed').value);
  const learning_rate_decay_factor = 0.9;
  const min_learning_rate = 0.05;
  const min_loss_improvement = 0.00001;
  const patience = 10;
  const early_stopping_patience = parseInt(document.getElementById('patience').value);
  const epochs = parseInt(document.getElementById('epochs').value);
  const learning_rate = parseFloat(document.getElementById('learnrate').value);
  const adam = document.getElementById('useAdam').checked;
  const beta1 = adam ? parseFloat(document.getElementById('beta1').value) : 0.0;
  const beta2 = adam ? parseFloat(document.getElementById('beta2').value) : 0.0;
  const epsilon = parseFloat(document.getElementById('epsilon').value);
  const clip_threshold = 1000;
  //const beta1 = 0.0;//9;
  //const beta2 = 0.0;//999;
  //const epsilon = 0.0; // 8;

  const options = {
    learning_rate_decay_factor,
    min_learning_rate,
    min_loss_improvement,
    patience,
    early_stopping_patience,
    beta1,
    beta2,
    epsilon
  };

  const training_pct = parseInt(document.getElementById('training').value);

  let train_set = generate_input_dataset(srcData, sequence_length, 0, training_pct);
  let target_set = generate_output_dataset(srcData, sequence_length, 0, training_pct);
  let test_set = generate_input_dataset(srcData, sequence_length, training_pct, 100);
  let predict_set = generate_output_dataset(srcData, sequence_length, training_pct, 100);

  function doGRU(e)
  {
    if (e.data.command == 'interrupt')
    {
      self.gru.stopWorker = true;
      return;
    }

    const { command, script_path, input_sequences, target_sequences, test_sequences, predict_sequences,
            initial_learning_rate, epochs, clip_threshold, options } = e.data;

    //console.log(options, JSON.stringify(options, null, 2));

    importScripts(script_path + "rng.js");
    importScripts(script_path + "matrix.js");
    importScripts(script_path + "grucell.js");
    importScripts(script_path + "grunet.js");

    rng = new XorShiftRNG(options.seed);
    //rng = new XorShift128Plus(options.seed);

    const input_size = options.input_size;
    const hidden_size = options.hidden_size;
    const num_layers = options.num_layers;
    const sequence_length = options.sequence_length;

    function copy_sequences(seq)
    {
      let result = [];
      for (let i = 0; i < seq.length; ++i)
      {
        let sequence = [];
        for (let j = 0; j < seq[i].length; ++j)
        {
          let val = new Matrix(seq[i][j].rows, seq[i][j].cols);
          val.data = seq[i][j].data;
          sequence.push(val);
        }
        result.push(sequence);
      }
      return result;
    }

    let train_set = copy_sequences(input_sequences);
    let target_set = copy_sequences(target_sequences);
    let test_set = copy_sequences(test_sequences);
    let predict_set = copy_sequences(predict_sequences);

    self.gru = new GRUNetwork(input_size, hidden_size, num_layers, sequence_length, options);

    function done(msg)
    {
    const ht_prev = Array(num_layers).fill().map(() => new Matrix(hidden_size, 1));
    const combined_set = [...train_set, ...test_set];

    const input_data = [];
    const actual_data = [];
    const predicted_data = [];

    for (let i = 0; i < combined_set.length; ++i)
    {
      const sequence = combined_set[i];
      const predictions = gru.forward(sequence, ht_prev);

      for (let t = 0; t < sequence.length; ++t)
      {
        const input_value = sequence[t].data[0][0];
        const actual_value = (i < target_set.length ? target_set[i] : predict_set[i - target_set.length])[t].data[0][0];
        const predicted_value = predictions[t].data[0][0];

        input_data.push({ x: t + i * sequence_length, y: input_value });
        actual_data.push({ x: t + i * sequence_length, y: actual_value });
        predicted_data.push({ x: t + i * sequence_length, y: predicted_value });
      }
    }
    self.postMessage({type: msg, xMax: combined_set.length * sequence_length,
                      datasets: [input_data, predicted_data, actual_data]});
    }

    gru.train(train_set, target_set, initial_learning_rate, epochs, clip_threshold, (text, type) =>
    {
      self.postMessage({ type: 'progress', text });
      done(type);
    });
    //done('fini');
  }

  worker = new Worker(window.URL.createObjectURL(new Blob(["onmessage=" + doGRU.toString()], {type: "text/javascript"})));
  worker.stopWorker = false;

  worker.addEventListener('message', function(e)
  {
    const depcol = 1*document.getElementById('depcol').value;

    if (e.data.type == 'progress')
    {
      const output = document.getElementById("output");
      output.innerText += e.data.text + '\n';
      output.scrollTop = output.scrollHeight;
    }
    else if (e.data.type == 'done' || e.data.type == 'fini')
    {
      if (e.data.type == 'fini')
      {
        document.getElementById('doPredict').style.display = "";
        document.getElementById('doInterrupt').style.display = "none";
      }

      const datasets = e.data.datasets; // [input_data, predicted_data, actual_data];

      // Denormalize the result
      for (let i = 0; i < datasets[1].length; i++)
      {
        const { scale, bias } = srcFactors[depcol];
        datasets[1][i].y = datasets[1][i].y * scale + bias;
        datasets[2][i].y = datasets[2][i].y * scale + bias;
      }

      yResult = datasets[1];
      let sumOfSquares = 0;
      let count = 0;
      let sum = 0;
      let sum2 = 0;

      // Now iterate through yResult and the corresponding range in reData[depcol] simultaneously
      for (let i = 0; i < yResult.length; i++)
      {
        // Check if the x values match within the tolerance
        {
          let difference = yResult[i].y - reData[depcol][i].y;
          sumOfSquares += difference * difference;
          count++;
          sum += reData[depcol][i].y;
          sum2 += reData[depcol][i].y ** 2;
        }
      }

      // Calculate the chi-squared per degree of freedom
      let degreesOfFreedom = count - 1; // Assuming one parameter fitted
      if (degreesOfFreedom <= 0)
      {
        throw new Error('Degrees of freedom must be positive');
      }
      let variance = (sum2 - sum**2 / count) / count;
      let chiSquaredPerDF = sumOfSquares / variance / degreesOfFreedom;
      document.getElementById('result').innerHTML =
        "(&chi;&sup2;)<sub>&nu;</sub> = " + chiSquaredPerDF.toPrecision(5);

      plotoptions =
        {
          drawAxes: true,
          axisLabels: { x: 'hours', y: 'values' },
          plotStyles: [JSON.parse(JSON.stringify(styles[parseInt(depcol)])), JSON.parse(JSON.stringify(styles[parseInt(depcol)]))],
          tickCount: { x: 5, y: 5 },
          backgroundColor: '#F8F8F8',
          axisColor: 'black',
        };
      plotoptions.plotStyles[0].lineWidth = 0.25;
      plotoptions.plotStyles[0].opacity = 0.5;
      plotoptions.plotStyles[1].lineWidth = 1.5;
      for (i = 0; i < datasets.length; i++)
      {
        for (j = 0; j < datasets[i].length; j++)
        {
          datasets[i][j].x = reData[0][j].x;
        }
      }
      document.getElementById('theResult').innerHTML = "";
      document.getElementById('theResult').appendChild(plotDatasets([reData[parseInt(depcol)], datasets[1]], xMinMax[0], xMinMax[1], yMinMax[0], yMinMax[1],800,400, plotoptions));
    }
  });

  worker.postMessage(
  {
    command: 'start',
    script_path: window.location.href.substring(0, window.location.href.lastIndexOf('/'))+"/scripts/",
    input_sequences: train_set,
    target_sequences: target_set,
    test_sequences: test_set,
    predict_sequences: predict_set,
    initial_learning_rate: learning_rate,
    epochs,
    clip_threshold,
    options:
    {
      seed,
      input_size,
      hidden_size,
      num_layers,
      sequence_length,
      learning_rate_decay_factor,
      min_learning_rate,
      min_loss_improvement,
      patience,
      early_stopping_patience,
      beta1,
      beta2,
      epsilon
    }
  });
}

function interruptRun()
{
  worker.postMessage({ command: 'interrupt' });
}

function clearLog()
{
  document.getElementById('output').innerText = "";
}
