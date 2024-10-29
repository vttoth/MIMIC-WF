class GRUNetwork
{
  constructor(input_size, hidden_size, num_layers, sequence_length, options = {})
  {
    this.stopWorker = false;

    this.input_size = input_size;
    this.hidden_size = hidden_size;
    this.num_layers = num_layers;
    this.sequence_length = sequence_length;

    this.learning_rate_decay_factor = options.learning_rate_decay_factor || 0.9;
    this.min_learning_rate = options.min_learning_rate || 0.05;
    this.min_loss_improvement = options.min_loss_improvement || 0.00001;
    this.patience = options.patience || 10;
    this.patience_counter = 0;

    this.early_stopping_patience = options.early_stopping_patience || 10;
    this.early_stopping_counter = 0;

    this.beta1 = options.beta1;
    this.beta2 = options.beta2;
    this.epsilon = options.epsilon || 1e-15;

    this.gru_cells = Array(num_layers).fill().map((_, i) =>
      Array(sequence_length).fill().map(() =>
        new GRUCell(i === 0 ? input_size : hidden_size, hidden_size)
      )
    );

    this.Wo = new Matrix(1, hidden_size);
    this.bo = new Matrix(1, 1);

    this.Wo.XGrandomize(hidden_size, 1);
    this.bo.grandomize(0, 0.25);
  }

  log(text, type, progressCallback)
  {
    console.log(text);
    if (typeof document !== 'undefined') document.getElementById("output").innerText += text + "\n";
    if (progressCallback) { progressCallback(text, type); }
  }

  forward(inputs, ht_prev)
  {
    if (inputs.length !== this.sequence_length)
    {
      throw new Error('Input sequence length does not match the network sequence length');
    }

    const outputs = [];
    for (let t = 0; t < this.sequence_length; ++t)
    {
      let input = inputs[t];
      for (let i = 0; i < this.num_layers; ++i)
      {
        ht_prev[i] = this.gru_cells[i][t].forward(input, ht_prev[i]);
        input = ht_prev[i];
      }
      const output = this.Wo.multiply(input).add(this.bo);
      outputs.push(output);
    }
    return outputs;
  }

  mse_loss(predictions, targets)
  {
    if (predictions.length !== targets.length)
    {
      throw new Error('Predictions and targets must have the same length');
    }

    let loss = 0.0;
    for (let i = 0; i < predictions.length; ++i)
    {
      const diff = predictions[i].subtract(targets[i]);
      for (let j = 0; j < diff.rows; ++j)
      {
        for (let k = 0; k < diff.cols; ++k)
        {
          loss += diff.data[j][k] * diff.data[j][k];
        }
      }
    }
    return loss / predictions.length;
  }

//  backward(dht, input, cells, t, dWz_accum, dUz_accum, dbz_accum, dWr_accum, dUr_accum, dbr_accum, dWh_accum, dUh_accum, dbh_accum, clip_threshold)
  backward(Dht, Drt, Dzt, Dh_candidate, input, cells, t, dWz_accum, dUz_accum, dbz_accum, dWr_accum, dUr_accum, dbr_accum, dWh_accum, dUh_accum, dbh_accum, clip_threshold)
  {
    for (let i = this.num_layers - 1; i >= 0; --i)
    {
      const xt = (i === 0) ? input : cells[i - 1][t].ht;
      const cell = cells[i][t];

      const ht_prev = cell.ht_prev;
      const zt = cell.zt;
      const rt = cell.rt;
      const h_candidate = cell.h_candidate;
      const dht = Dht[i];
      const dzt = Dzt[i];
      const dh_candidate = Dh_candidate[i];
      const drt = Drt[i];

//      const dzt = dht.elementMultiply(h_candidate.subtract(ht_prev)).elementMultiply(zt.applyFunction(GRUNetwork.sigmoid_derivative));
      dWz_accum[i] = dWz_accum[i].add(dzt.multiply(xt.transpose()));
      dUz_accum[i] = dUz_accum[i].add(dzt.multiply(ht_prev.transpose()));
      dbz_accum[i] = dbz_accum[i].add(dzt);

//      const dh_candidate = dht.elementMultiply(zt.subtract(zt.elementMultiply(h_candidate.elementMultiply(h_candidate))));

//      const drt = dh_candidate.elementMultiply(cell.Uh.transpose().multiply(ht_prev)).elementMultiply(rt.applyFunction(GRUNetwork.sigmoid_derivative));
      dWr_accum[i] = dWr_accum[i].add(drt.multiply(xt.transpose()));
      dUr_accum[i] = dUr_accum[i].add(drt.multiply(ht_prev.transpose()));
      dbr_accum[i] = dbr_accum[i].add(drt);

      dWh_accum[i] = dWh_accum[i].add(dh_candidate.multiply(xt.transpose()));
      dUh_accum[i] = dUh_accum[i].add(dh_candidate.multiply(ht_prev.elementMultiply(rt).transpose()));
      dbh_accum[i] = dbh_accum[i].add(dh_candidate);

      const grad_norm = Math.sqrt(
        dWz_accum[i].squaredNorm() + dUz_accum[i].squaredNorm() + dbz_accum[i].squaredNorm() +
        dWr_accum[i].squaredNorm() + dUr_accum[i].squaredNorm() + dbr_accum[i].squaredNorm() +
        dWh_accum[i].squaredNorm() + dUh_accum[i].squaredNorm() + dbh_accum[i].squaredNorm()
      );

      if (grad_norm > clip_threshold)
      {
        const scale_factor = clip_threshold / grad_norm;
        dWz_accum[i] = dWz_accum[i].multiply(scale_factor);
        dUz_accum[i] = dUz_accum[i].multiply(scale_factor);
        dbz_accum[i] = dbz_accum[i].multiply(scale_factor);
        dWr_accum[i] = dWr_accum[i].multiply(scale_factor);
        dUr_accum[i] = dUr_accum[i].multiply(scale_factor);
        dbr_accum[i] = dbr_accum[i].multiply(scale_factor);
        dWh_accum[i] = dWh_accum[i].multiply(scale_factor);
        dUh_accum[i] = dUh_accum[i].multiply(scale_factor);
        dbh_accum[i] = dbh_accum[i].multiply(scale_factor);
      }

//      dht = cell.Uz.transpose().multiply(dzt).add(cell.Ur.transpose().multiply(drt)).add(cell.Uh.transpose().multiply(dh_candidate.elementMultiply(rt)));
    }
  }

  static sigmoid_derivative(sig)
  {
    return sig * (1 - sig);
  }

  static tanh_derivative(t)
  {
    return 1 - t * t;
  }

  train(input_sequences, target_sequences, initial_learning_rate, epochs, clip_threshold, progressCallback, runOnTimer = true)
  {
    let best_loss = 9e99;
    let last_loss = 9e99;
    let best_gru_cells = null;
    let best_Wo = null;
    let best_bo = null;
    let best_epoch = 0;

    let learning_rate = initial_learning_rate;

    let mWz, mUz, mbz, mWr, mUr, mbr, mWh, mUh, mbh, mWo, mbo;
    let vWz, vUz, vbz, vWr, vUr, vbr, vWh, vUh, vbh, vWo, vbo;

    const beta1 = this.beta1;
    const beta2 = this.beta2;
    const epsilon = this.epsilon;

    if (beta1 > 0 || beta2 > 0)
    {
      mWz = Array(this.num_layers).fill().map((_, j) =>
      {
        const input_size_layer = j === 0 ? this.input_size : this.hidden_size;
        return new Matrix(this.hidden_size, input_size_layer, 0.0);
      });
      mUz = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, this.hidden_size, 0.0));
      mbz = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, 1, 0.0));
      mWr = Array(this.num_layers).fill().map((_, j) =>
      {
        const input_size_layer = j === 0 ? this.input_size : this.hidden_size;
        return new Matrix(this.hidden_size, input_size_layer, 0.0);
      });
      mUr = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, this.hidden_size, 0.0));
      mbr = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, 1, 0.0));
      mWh = Array(this.num_layers).fill().map((_, j) =>
      {
        const input_size_layer = j === 0 ? this.input_size : this.hidden_size;
        return new Matrix(this.hidden_size, input_size_layer, 0.0);
      });
      mUh = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, this.hidden_size, 0.0));
      mbh = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, 1, 0.0));
      mWo = new Matrix(this.Wo.rows, this.Wo.cols, 0.0);
      mbo = new Matrix(this.bo.rows, this.bo.cols, 0.0);

      vWz = Array(this.num_layers).fill().map((_, j) =>
      {
        const input_size_layer = j === 0 ? this.input_size : this.hidden_size;
        return new Matrix(this.hidden_size, input_size_layer, 0.0);
      });
      vUz = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, this.hidden_size, 0.0));
      vbz = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, 1, 0.0));
      vWr = Array(this.num_layers).fill().map((_, j) =>
      {
        const input_size_layer = j === 0 ? this.input_size : this.hidden_size;
        return new Matrix(this.hidden_size, input_size_layer, 0.0);
      });
      vUr = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, this.hidden_size, 0.0));
      vbr = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, 1, 0.0));
      vWh = Array(this.num_layers).fill().map((_, j) =>
      {
        const input_size_layer = j === 0 ? this.input_size : this.hidden_size;
        return new Matrix(this.hidden_size, input_size_layer, 0.0);
      });
      vUh = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, this.hidden_size, 0.0));
      vbh = Array(this.num_layers).fill().map(() => new Matrix(this.hidden_size, 1, 0.0));
      vWo = new Matrix(this.Wo.rows, this.Wo.cols, 0.0);
      vbo = new Matrix(this.bo.rows, this.bo.cols, 0.0);
    }

    function doEpoch(gnet, epoch)
    {
      const ht_prevs = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, 1));

      let total_loss = 0.0;

      const dWo_accum = new Matrix(gnet.Wo.rows, gnet.Wo.cols, 0.0);
      const dbo_accum = new Matrix(gnet.bo.rows, gnet.bo.cols, 0.0);

      for (let i = 0; i < input_sequences.length; ++i)
      {
        const outputs = [];
        const hidden_states = [];

        for (let t = 0; t < gnet.sequence_length; ++t)
        {
          let input = input_sequences[i][t];
          for (let j = 0; j < gnet.num_layers; ++j)
          {
            input = gnet.gru_cells[j][t].forward(input, ht_prevs[j]);
            ht_prevs[j] = input;
          }
          hidden_states.push(input);

          const output = gnet.Wo.multiply(input).add(gnet.bo);
          outputs.push(output);
        }

//        total_loss += gnet.mse_loss(outputs, target_sequences[i]);

        const dWz_accum = Array(gnet.num_layers).fill().map((_, j) =>
        {
          const input_size_layer = j === 0 ? gnet.input_size : gnet.hidden_size;
          return new Matrix(gnet.hidden_size, input_size_layer, 0.0);
        });
        const dUz_accum = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, gnet.hidden_size, 0.0));
        const dbz_accum = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, 1, 0.0));
        const dWr_accum = Array(gnet.num_layers).fill().map((_, j) =>
        {
          const input_size_layer = j === 0 ? gnet.input_size : gnet.hidden_size;
          return new Matrix(gnet.hidden_size, input_size_layer, 0.0);
        });
        const dUr_accum = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, gnet.hidden_size, 0.0));
        const dbr_accum = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, 1, 0.0));
        const dWh_accum = Array(gnet.num_layers).fill().map((_, j) =>
        {
          const input_size_layer = j === 0 ? gnet.input_size : gnet.hidden_size;
          return new Matrix(gnet.hidden_size, input_size_layer, 0.0);
        });
        const dUh_accum = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, gnet.hidden_size, 0.0));
        const dbh_accum = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, 1, 0.0));

//        let dht = gnet.Wo.transpose().multiply(outputs[gnet.sequence_length - 1].subtract(target_sequences[i][gnet.sequence_length - 1]).multiply(2.0 / outputs.length));

        const Dht = Array.from(Array(gnet.sequence_length), () => new Array(gnet.num_layers).fill(0));
        const Drt = Array.from(Array(gnet.sequence_length), () => new Array(gnet.num_layers).fill(0));
        const Dzt = Array.from(Array(gnet.sequence_length), () => new Array(gnet.num_layers).fill(0));
        const Dh_candidate = Array.from(Array(gnet.sequence_length), () => new Array(gnet.num_layers).fill(0));

        const T = gnet.sequence_length - 1;
        const J = gnet.num_layers - 1;

        const cell = gnet.gru_cells[J][T];
        const ht_prev = cell.ht_prev;
        const zt = cell.zt;
        const rt = cell.rt;
        const h_candidate = cell.h_candidate;

        Dht[T][J] = gnet.Wo.transpose().multiply(outputs[T].subtract(target_sequences[i][T]).multiply(2.0 / outputs.length));
        Dzt[T][J] = Dht[T][J].elementMultiply(h_candidate.subtract(ht_prev)).elementMultiply(zt.applyFunction(GRUNetwork.sigmoid_derivative));
        Dh_candidate[T][J] = Dht[T][J].elementMultiply(zt.subtract(zt.elementMultiply(h_candidate.elementMultiply(h_candidate))));
        Drt[T][J] = Dh_candidate[T][J].elementMultiply(cell.Uh.transpose().multiply(ht_prev)).elementMultiply(rt.applyFunction(GRUNetwork.sigmoid_derivative));

        for (let j = J - 1; j >= 0; --j)
        {
          const cell = gnet.gru_cells[j][T];
          const ht_prev = cell.ht_prev;
          const zt = cell.zt;
          const rt = cell.rt;
          const h_candidate = cell.h_candidate;
          const pcell = gnet.gru_cells[j+1][T];
          const Wz = pcell.Wz;
          const Wr = pcell.Wr;
          const Wh = pcell.Wh;
          Dht[T][j] = Wz.transpose().multiply(Dzt[T][j+1]).add(Wr.transpose().multiply(Drt[T][j+1])).add(Wh.transpose().multiply(Dh_candidate[T][j+1]));
          Dzt[T][j] = Dht[T][j].elementMultiply(h_candidate.subtract(ht_prev)).elementMultiply(zt.applyFunction(GRUNetwork.sigmoid_derivative));
          Dh_candidate[T][j] = Dht[T][j].elementMultiply(zt.subtract(zt.elementMultiply(h_candidate.elementMultiply(h_candidate))));
          Drt[T][j] = Dh_candidate[T][j].elementMultiply(cell.Uh.transpose().multiply(ht_prev)).elementMultiply(rt.applyFunction(GRUNetwork.sigmoid_derivative));
        }

        for (let t = T - 1; t >= 0; --t)
        {
          for (let j = J; j >= 0; --j)
          {
            const cell = gnet.gru_cells[j][t];
            const ht_prev = cell.ht_prev;
            const zt = cell.zt;
            const rt = cell.rt;
             const h_candidate = cell.h_candidate;
            const Uz = cell.Uz;
            const Ur = cell.Ur;
            const Uh = cell.Uh;
            if (j < J)
            {
              const pcell = gnet.gru_cells[j+1][t];
              const Wz = pcell.Wz;
              const Wr = pcell.Wr;
              const Wh = pcell.Wh;
              Dht[t][j] = Wz.transpose().multiply(Dzt[t][j+1]).add(Wr.transpose().multiply(Drt[t][j+1])).add(Wh.transpose().multiply(Dh_candidate[t][j+1]));
            }
            else Dht[t][j] = Dht[T][j];
            Dht[t][j] = Dht[t][j].add(Uz.transpose().multiply(Dzt[t+1][j]).add(Ur.transpose().multiply(Drt[t+1][j])).add(Uh.transpose().multiply(Dh_candidate[t+1][j].elementMultiply(rt))));
            Dzt[t][j] = Dht[t][j].elementMultiply(h_candidate.subtract(ht_prev)).elementMultiply(zt.applyFunction(GRUNetwork.sigmoid_derivative));
            Dh_candidate[t][j] = Dht[t][j].elementMultiply(zt.subtract(zt.elementMultiply(h_candidate.elementMultiply(h_candidate))));
            Drt[t][j] = Dh_candidate[t][j].elementMultiply(Uh.transpose().multiply(ht_prev)).elementMultiply(rt.applyFunction(GRUNetwork.sigmoid_derivative));
          }
        }





        for (let t = gnet.sequence_length - 1; t >= 0; --t)
        {
          const d_output = outputs[t].subtract(target_sequences[i][t]).multiply(2.0 / outputs.length);
          dWo_accum.add(d_output.multiply(hidden_states[t].transpose()));
          dbo_accum.add(d_output);

//          gnet.backward(dht, input_sequences[i][t], gnet.gru_cells, t,
          gnet.backward(Dht[t], Drt[t], Dzt[t], Dh_candidate[t], input_sequences[i][t], gnet.gru_cells, t,
                        dWz_accum, dUz_accum, dbz_accum,
                        dWr_accum, dUr_accum, dbr_accum,
                        dWh_accum, dUh_accum, dbh_accum, clip_threshold);

//          dht = dht.add(gnet.Wo.transpose().multiply(d_output));
        }

        for (let j = 0; j < gnet.num_layers; ++j)
        {
          if (beta1 > 0 || beta2 > 0)
          {
            mWz[j] = mWz[j].multiply(beta1).add(dWz_accum[j].multiply(1 - beta1));
            mUz[j] = mUz[j].multiply(beta1).add(dUz_accum[j].multiply(1 - beta1));
            mbz[j] = mbz[j].multiply(beta1).add(dbz_accum[j].multiply(1 - beta1));
            mWr[j] = mWr[j].multiply(beta1).add(dWr_accum[j].multiply(1 - beta1));
            mUr[j] = mUr[j].multiply(beta1).add(dUr_accum[j].multiply(1 - beta1));
            mbr[j] = mbr[j].multiply(beta1).add(dbr_accum[j].multiply(1 - beta1));
            mWh[j] = mWh[j].multiply(beta1).add(dWh_accum[j].multiply(1 - beta1));
            mUh[j] = mUh[j].multiply(beta1).add(dUh_accum[j].multiply(1 - beta1));
            mbh[j] = mbh[j].multiply(beta1).add(dbh_accum[j].multiply(1 - beta1));

            vWz[j] = vWz[j].multiply(beta2).add(dWz_accum[j].elementMultiply(dWz_accum[j]).multiply(1 - beta2));
            vUz[j] = vUz[j].multiply(beta2).add(dUz_accum[j].elementMultiply(dUz_accum[j]).multiply(1 - beta2));
            vbz[j] = vbz[j].multiply(beta2).add(dbz_accum[j].elementMultiply(dbz_accum[j]).multiply(1 - beta2));
            vWr[j] = vWr[j].multiply(beta2).add(dWr_accum[j].elementMultiply(dWr_accum[j]).multiply(1 - beta2));
            vUr[j] = vUr[j].multiply(beta2).add(dUr_accum[j].elementMultiply(dUr_accum[j]).multiply(1 - beta2));
            vbr[j] = vbr[j].multiply(beta2).add(dbr_accum[j].elementMultiply(dbr_accum[j]).multiply(1 - beta2));
            vWh[j] = vWh[j].multiply(beta2).add(dWh_accum[j].elementMultiply(dWh_accum[j]).multiply(1 - beta2));
            vUh[j] = vUh[j].multiply(beta2).add(dUh_accum[j].elementMultiply(dUh_accum[j]).multiply(1 - beta2));
            vbh[j] = vbh[j].multiply(beta2).add(dbh_accum[j].elementMultiply(dbh_accum[j]).multiply(1 - beta2));
          }
          else
          {
            for (let cell of gnet.gru_cells[j])
            {
              cell.Wz = cell.Wz.subtract(dWz_accum[j].multiply(learning_rate));
              cell.Uz = cell.Uz.subtract(dUz_accum[j].multiply(learning_rate));
              cell.bz = cell.bz.subtract(dbz_accum[j].multiply(learning_rate));
              cell.Wr = cell.Wr.subtract(dWr_accum[j].multiply(learning_rate));
              cell.Ur = cell.Ur.subtract(dUr_accum[j].multiply(learning_rate));
              cell.br = cell.br.subtract(dbr_accum[j].multiply(learning_rate));
              cell.Wh = cell.Wh.subtract(dWh_accum[j].multiply(learning_rate));
              cell.Uh = cell.Uh.subtract(dUh_accum[j].multiply(learning_rate));
              cell.bh = cell.bh.subtract(dbh_accum[j].multiply(learning_rate));
            }
          }
        }
      }

      if (beta1 > 0 || beta2 > 0)
      {
        const beta1t = beta1 > 0 ? Math.pow(beta1, epoch + 1) : 0.0;
        const beta2t = beta2 > 0 ? Math.pow(beta2, epoch + 1) : 0.0;

        for (let j = 0; j < gnet.num_layers; ++j)
        {
          for (let cell of gnet.gru_cells[j])
          {
            const mWz_hat = mWz[j].divide(1 - beta1t);
            const mUz_hat = mUz[j].divide(1 - beta1t);
            const mbz_hat = mbz[j].divide(1 - beta1t);
            const mWr_hat = mWr[j].divide(1 - beta1t);
            const mUr_hat = mUr[j].divide(1 - beta1t);
            const mbr_hat = mbr[j].divide(1 - beta1t);
            const mWh_hat = mWh[j].divide(1 - beta1t);
            const mUh_hat = mUh[j].divide(1 - beta1t);
            const mbh_hat = mbh[j].divide(1 - beta1t);

            const vWz_hat = vWz[j].divide(1 - beta2t);
            const vUz_hat = vUz[j].divide(1 - beta2t);
            const vbz_hat = vbz[j].divide(1 - beta2t);
            const vWr_hat = vWr[j].divide(1 - beta2t);
            const vUr_hat = vUr[j].divide(1 - beta2t);
            const vbr_hat = vbr[j].divide(1 - beta2t);
            const vWh_hat = vWh[j].divide(1 - beta2t);
            const vUh_hat = vUh[j].divide(1 - beta2t);
            const vbh_hat = vbh[j].divide(1 - beta2t);

            cell.Wz = cell.Wz.subtract(mWz_hat.divide(vWz_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.Uz = cell.Uz.subtract(mUz_hat.divide(vUz_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.bz = cell.bz.subtract(mbz_hat.divide(vbz_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.Wr = cell.Wr.subtract(mWr_hat.divide(vWr_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.Ur = cell.Ur.subtract(mUr_hat.divide(vUr_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.br = cell.br.subtract(mbr_hat.divide(vbr_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.Wh = cell.Wh.subtract(mWh_hat.divide(vWh_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.Uh = cell.Uh.subtract(mUh_hat.divide(vUh_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
            cell.bh = cell.bh.subtract(mbh_hat.divide(vbh_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
          }
        }

        mWo = mWo.multiply(beta1).add(dWo_accum.multiply(1 - beta1));
        mbo = mbo.multiply(beta1).add(dbo_accum.multiply(1 - beta1));

        vWo = vWo.multiply(beta2).add(dWo_accum.elementMultiply(dWo_accum).multiply(1 - beta2));
        vbo = vbo.multiply(beta2).add(dbo_accum.elementMultiply(dbo_accum).multiply(1 - beta2));

        const mWo_hat = mWo.divide(1 - beta1t);
        const mbo_hat = mbo.divide(1 - beta1t);

        const vWo_hat = vWo.divide(1 - beta2t);
        const vbo_hat = vbo.divide(1 - beta2t);

        gnet.Wo = gnet.Wo.subtract(mWo_hat.divide(vWo_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
        gnet.bo = gnet.bo.subtract(mbo_hat.divide(vbo_hat.applyFunction(Math.sqrt).add(epsilon)).multiply(learning_rate));
      }
      else
      {
        gnet.Wo = gnet.Wo.subtract(dWo_accum.multiply(1.0 * learning_rate / input_sequences.length));
        gnet.bo = gnet.bo.subtract(dbo_accum.multiply(1.0 * learning_rate / input_sequences.length));
      }



      const ht_prev = Array(gnet.num_layers).fill().map(() => new Matrix(gnet.hidden_size, 1));
      for (let i = 0; i < input_sequences.length; ++i)
      {
        const outputs = [];
        for (let t = 0; t < gnet.sequence_length; ++t)
        {
          let input = input_sequences[i][t];
          for (let j = 0; j < gnet.num_layers; ++j)
          {
            input = gnet.gru_cells[j][t].forward(input, ht_prev[j]);
            ht_prev[j] = input;
          }
          const output = gnet.Wo.multiply(input).add(gnet.bo);
          outputs.push(output);
        }
        total_loss += gnet.mse_loss(outputs, target_sequences[i]);
      }

//progressCallback("", "mse_loss");



      total_loss /= input_sequences.length;
      gnet.log(`Epoch ${epoch+1} Loss: ${total_loss}`, 'done', progressCallback);

      if (total_loss < best_loss && !gnet.stopWorker)
      {
        best_epoch = epoch;
        best_loss = total_loss;
        best_gru_cells = gnet.gru_cells.map(layer => layer.map(cell => Object.assign(Object.create(Object.getPrototypeOf(cell)), cell)));
        best_Wo = new Matrix(gnet.Wo.rows, gnet.Wo.cols);
        best_Wo.data = gnet.Wo.data.map(row => [...row]);
        best_bo = new Matrix(gnet.bo.rows, gnet.bo.cols);
        best_bo.data = gnet.bo.data.map(row => [...row]);
        gnet.early_stopping_counter = 0;
      }
      else
      {
        gnet.early_stopping_counter++;
        if (gnet.early_stopping_counter >= gnet.early_stopping_patience || gnet.stopWorker) {
          gnet.gru_cells = best_gru_cells;
          gnet.Wo = best_Wo;
          gnet.bo = best_bo;
          //break;
          gnet.log(`Early stopping triggered after ${epoch+1} epochs.`, 'fini', progressCallback);
          return false;
        }
      }

      if (1.0 - total_loss / last_loss < gnet.min_loss_improvement)
      {
        gnet.patience_counter++;
        if (gnet.patience_counter >= gnet.patience && learning_rate > gnet.min_learning_rate)
        {
          learning_rate *= gnet.learning_rate_decay_factor;
          learning_rate = Math.max(learning_rate, gnet.min_learning_rate);
          gnet.log(`Learning rate adjusted to ${learning_rate} after ${epoch+1} epochs.`, 'done', progressCallback);
          gnet.patience_counter = 0;
        }
      }
      else
      {
        gnet.patience_counter = 0;
      }
      last_loss = total_loss;

      if (runOnTimer)
      {
        if (++epoch < epochs) setTimeout(function() { doEpoch(gnet, epoch); }, 0);
        else
        {
          if (best_gru_cells)
          {
            gnet.gru_cells = best_gru_cells;
            gnet.Wo = best_Wo;
            gnet.bo = best_bo;
          }
          gnet.log(`Completed (best epoch: ${best_epoch+1}).`, 'fini', progressCallback);
        }
      }
      else return true;
    }
    if (runOnTimer)
    {
      doEpoch(this, 0);
    }
    else
    {
      for (let epoch = 0; epoch < epochs; ++epoch) if (!doEpoch(this, epoch)) break;
    }
  }
}

