export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFor(key: string): Rng {
  return mulberry32(hashString(key));
}

export const range = (rng: Rng, min: number, max: number) => min + (max - min) * rng();

/** Smooth periodic 1D noise built from a few random sines, roughly in -1..1. */
export function wobble1D(rng: Rng): (t: number) => number {
  const waves = Array.from({ length: 4 }, (_, i) => ({
    f: (i + 1) * range(rng, 0.8, 1.6),
    p: rng() * Math.PI * 2,
    a: 1 / (i + 1.4),
  }));
  const norm = waves.reduce((s, w) => s + w.a, 0);
  return (t: number) => waves.reduce((s, w) => s + Math.sin(t * w.f + w.p) * w.a, 0) / norm;
}

/** Tileable-ish 2D value noise with smooth interpolation, output 0..1. */
export function valueNoise2D(seed: number, gridSize = 64): (x: number, y: number) => number {
  const rng = mulberry32(seed);
  const grid = new Float32Array(gridSize * gridSize);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();
  const at = (ix: number, iy: number) =>
    grid[(((iy % gridSize) + gridSize) % gridSize) * gridSize + (((ix % gridSize) + gridSize) % gridSize)];
  return (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

export function fbm2D(seed: number, octaves = 4): (x: number, y: number) => number {
  const layers = Array.from({ length: octaves }, (_, i) => valueNoise2D(seed + i * 101));
  return (x: number, y: number) => {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;
    for (const n of layers) {
      sum += n(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return sum / norm;
  };
}
