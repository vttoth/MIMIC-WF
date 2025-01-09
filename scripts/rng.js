// rng.js : MIMIC GRU analysis
//
// Copyright (c) 2025 Viktor T. Toth
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
