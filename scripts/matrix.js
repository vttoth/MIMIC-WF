class Matrix
{
  constructor(rows, cols, init = 0.0)
  {
    this.rows = rows;
    this.cols = cols;
    this.data = Array(rows).fill().map(() => Array(cols).fill(init));
  }

  add(other)
  {
    const result = new Matrix(this.rows, this.cols);
    if (typeof other === 'number')
    {
      for (let i = 0; i < this.rows; ++i)
      {
        for (let j = 0; j < this.cols; ++j)
        {
          result.data[i][j] = this.data[i][j] + other;
        }
      }
    }
    else
    {
      if (this.rows !== other.rows || this.cols !== other.cols)
      {
        throw new Error('Matrix dimensions must match for addition');
      }
      for (let i = 0; i < this.rows; ++i)
      {
        for (let j = 0; j < this.cols; ++j)
        {
          result.data[i][j] = this.data[i][j] + other.data[i][j];
        }
      }
    }
    return result;
  }

  divide(other)
  {
    const result = new Matrix(this.rows, this.cols);
    if (typeof other === 'number')
    {
      for (let i = 0; i < this.rows; ++i)
      {
        for (let j = 0; j < this.cols; ++j)
        {
          result.data[i][j] = this.data[i][j] / other;
        }
      }
    }
    else
    {
      if (this.rows !== other.rows || this.cols !== other.cols)
      {
        throw new Error('Matrix dimensions must match for element-wise division');
      }
      for (let i = 0; i < this.rows; ++i)
      {
        for (let j = 0; j < this.cols; ++j)
        {
          result.data[i][j] = this.data[i][j] / other.data[i][j];
        }
      }
    }

    return result;
  }

  multiply(other)
  {
    if (typeof other === 'number')
    {
      const result = new Matrix(this.rows, this.cols);
      for (let i = 0; i < this.rows; ++i)
      {
        for (let j = 0; j < this.cols; ++j)
        {
          result.data[i][j] = this.data[i][j] * other;
        }
      }
      return result;
    } else {
      if (this.cols !== other.rows)
      {
        throw new Error('Matrix dimensions must match for multiplication');
      }
      const result = new Matrix(this.rows, other.cols);
      for (let i = 0; i < this.rows; ++i)
      {
        for (let j = 0; j < other.cols; ++j)
        {
          for (let k = 0; k < this.cols; ++k)
          {
            result.data[i][j] += this.data[i][k] * other.data[k][j];
          }
        }
      }
      return result;
    }
  }

  applyFunction(func)
  {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        result.data[i][j] = func(this.data[i][j]);
      }
    }
    return result;
  }

  XGrandomize(fan_in, fan_out)
  {
    const limit = Math.sqrt(6.0 / (fan_in + fan_out));
    this.randomize(-limit, limit);
  }

  randomize(min, max)
  {
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        this.data[i][j] = frand() * (max - min) + min;
      }
    }
  }

  grandomize(mean, stdev)
  {
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        this.data[i][j] = grand(mean, stdev);
      }
    }
  }

  transpose() 
  {
    const result = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        result.data[j][i] = this.data[i][j];
      }
    }
    return result;
  }

  clip(norm)
  {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        if (this.data[i][j] > norm)
        {
          result.data[i][j] = norm;
        }
        else if (this.data[i][j] < -norm)
        {
          result.data[i][j] = -norm;
        }
        else
        {
          result.data[i][j] = this.data[i][j];
        }
      }
    }
    return result;
  }

  subtract(other)
  {
    if (this.rows !== other.rows || this.cols !== other.cols)
    {
      throw new Error('Matrix dimensions must match for subtraction');
    }
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        result.data[i][j] = this.data[i][j] - other.data[i][j];
      }
    }
    return result;
  }

  elementMultiply(other)
  {
    if (this.rows !== other.rows || this.cols !== other.cols)
    {
      throw new Error('Matrix dimensions must match for element-wise multiplication');
    }
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        result.data[i][j] = this.data[i][j] * other.data[i][j];
      }
    }
    return result;
  }

  squaredNorm()
  {
    let sum = 0.0;
    for (let i = 0; i < this.rows; ++i)
    {
      for (let j = 0; j < this.cols; ++j)
      {
        sum += this.data[i][j] * this.data[i][j];
      }
    }
    return sum;
  }
}
