// A sensible RNG
class SeededRNG
{
  constructor(seed = Date.now())
  {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next()
  {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

// Define a function that uses the seeded RNG
let rng;
const frand = () => rng.next();

// Gaussian RNG
function grand(mean = 0, stdDev = 1)
{
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = frand(); // Converting [0,1) to (0,1)
  while (u2 === 0) u2 = frand();
  const R = Math.sqrt(-2.0 * Math.log(u1));
  const theta = 2.0 * Math.PI * u2;
  return mean + stdDev * R * Math.cos(theta);
}
