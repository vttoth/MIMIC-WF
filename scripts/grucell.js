class GRUCell {
  constructor(input_size, hidden_size) {
    this.input_size = input_size;
    this.hidden_size = hidden_size;

    this.Wz = new Matrix(hidden_size, input_size);
    this.Uz = new Matrix(hidden_size, hidden_size);
    this.bz = new Matrix(hidden_size, 1);

    this.Wr = new Matrix(hidden_size, input_size);
    this.Ur = new Matrix(hidden_size, hidden_size);
    this.br = new Matrix(hidden_size, 1);

    this.Wh = new Matrix(hidden_size, input_size);
    this.Uh = new Matrix(hidden_size, hidden_size);
    this.bh = new Matrix(hidden_size, 1);

    this.Wz.randomize(input_size, hidden_size);
    this.Uz.randomize(hidden_size, hidden_size);
    this.bz.randomize(1, hidden_size);
    this.Wr.randomize(input_size, hidden_size);
    this.Ur.randomize(hidden_size, hidden_size);
    this.br.randomize(1, hidden_size);
    this.Wh.randomize(input_size, hidden_size);
    this.Uh.randomize(hidden_size, hidden_size);
    this.bh.randomize(1, hidden_size);
  }

  forward(xt, ht_prev) {
    this.zt = this.Wz.multiply(xt).add(this.Uz.multiply(ht_prev)).add(this.bz).applyFunction(GRUCell.sigmoid);
    this.rt = this.Wr.multiply(xt).add(this.Ur.multiply(ht_prev)).add(this.br).applyFunction(GRUCell.sigmoid);
    this.h_candidate = this.Wh.multiply(xt).add(this.Uh.multiply(ht_prev.elementMultiply(this.rt))).add(this.bh).applyFunction(Math.tanh);
    this.ht = this.zt.elementMultiply(this.h_candidate).add(ht_prev.subtract(this.zt.elementMultiply(ht_prev)));

    this.ht_prev = ht_prev;

    return this.ht;
  }

  static sigmoid(x) {
    if (x < -40) return 0.0;
    else if (x > 40) return 1.0;
    else return 1.0 / (1.0 + Math.exp(-x));
  }
}
