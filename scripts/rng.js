// A sensible RNG
class XorShiftRNG
{
  constructor(seed)
  {
    // Seed must be an array of 4 non-zero 32-bit integers.
    // Here we're just using the seed to fill the state with some initial values.
    this.state = [seed, seed << 10, seed >> 4, seed << 20];
  }

  // Xorshift* algorithm to generate the next random number
  next()
  {
    // Xorshift* 32-bit implementation
    let [x, y, z, w] = this.state;

    let t = x ^ (x << 11);
    x = y; y = z; z = w;
    w = w ^ (w >>> 19) ^ (t ^ (t >>> 8));

    this.state = [x, y, z, w];

    // Return a floating point number in [0, 1)
    return (w >>> 0) / 4294967296;
  }
}

// Usage:
//const seed = 123456789; // Replace with your desired seed
//const rng = new XorShiftRNG(seed);
let rng;

// Define a function that uses the seeded RNG
const frand = () => rng.next();

