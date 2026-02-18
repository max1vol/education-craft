export function hash2(x: number, z: number, seed: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 91.7) * 43758.5453123;
  return value - Math.floor(value);
}

export function hash3(x: number, y: number, z: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 151.3) * 43758.5453123;
  return value - Math.floor(value);
}

export function valueNoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = x - x0;
  const tz = z - z0;

  const a = hash2(x0, z0, seed);
  const b = hash2(x0 + 1, z0, seed);
  const c = hash2(x0, z0 + 1, seed);
  const d = hash2(x0 + 1, z0 + 1, seed);

  const ux = tx * tx * (3 - 2 * tx);
  const uz = tz * tz * (3 - 2 * tz);

  const ab = a + (b - a) * ux;
  const cd = c + (d - c) * ux;
  return ab + (cd - ab) * uz;
}

export function fbm(x: number, z: number, seed: number, octaves = 4): number {
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise(x * frequency, z * frequency, seed + i * 17) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return norm > 0 ? total / norm : 0;
}
