import type { ArtImage } from '../../art/assets';
import { createCanvas, ctx2d } from '../../art/paint/canvas';
import { mulberry32 } from '../../art/paint/random';

/** Target layout for every particle. Colors are sRGB 0..1 with alpha. */
export interface ShapeTargets {
  positions: Float32Array; // count * 3
  colors: Float32Array; // count * 4
}

const PUFFS: [number, number, number, number][] = [
  [-0.95, -0.08, 0.0, 0.5],
  [-0.42, 0.2, 0.06, 0.64],
  [0.22, 0.32, 0.0, 0.74],
  [0.82, 0.02, 0.02, 0.55],
  [0.02, -0.16, 0.14, 0.62],
  [-0.55, -0.24, -0.12, 0.46],
  [0.52, -0.22, -0.06, 0.5],
  [1.2, -0.22, 0.0, 0.32],
];
const FLAT_BOTTOM = -0.46;

function gaussian(rng: () => number) {
  return (rng() + rng() + rng() - 1.5) / 1.5;
}

/** A fluffy cumulus: denser near its surface so the outline reads, lavender underneath. */
export function cloudShape(count: number, seed = 7): ShapeTargets {
  const rng = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  let i = 0;
  while (i < count) {
    const x = (rng() * 2 - 1) * 1.6;
    const y = (rng() * 2 - 1) * 1.1;
    const z = (rng() * 2 - 1) * 0.8;
    if (y < FLAT_BOTTOM + (rng() - 0.5) * 0.06) continue;
    let depth = -1;
    for (const [cx, cy, cz, r] of PUFFS) {
      const d = Math.hypot(x - cx, y - cy, (z - cz) * 1.25) / r;
      if (d < 1) depth = Math.max(depth, 1 - d);
    }
    if (depth < 0) continue;
    if (rng() > Math.pow(1 - depth, 1.6) * 0.9 + 0.1) continue;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const under = Math.max(0, Math.min(1, (0.1 - y) / 0.6));
    let r = 1.0, g = 0.995, b = 0.98;
    r += (0.8 - r) * under * 0.7;
    g += (0.83 - g) * under * 0.7;
    b += (0.9 - b) * under * 0.7;
    // Like the book's collage cloud: white paper with diagonal grey crayon hatching and broad pale-blue paint swipes.
    const hatch = Math.sin((x * 0.9 - y) * 20 + Math.sin(y * 5 + x * 3) * 2);
    const swipe = Math.sin((x * 0.7 + y * 1.3) * 3.6 + 1.3) + Math.sin(x * 2.3 - y * 1.1) * 0.35;
    const mixTo = (tr: number, tg: number, tb: number, k: number) => {
      r += (tr - r) * k;
      g += (tg - g) * k;
      b += (tb - b) * k;
    };
    if (swipe > 0.95 && rng() < 0.75) mixTo(0.72, 0.86, 0.96, 0.6);
    else if (hatch > 0.5 && rng() < 0.65) mixTo(0.7, 0.72, 0.78, 0.45);
    colors[i * 4] = r;
    colors[i * 4 + 1] = g;
    colors[i * 4 + 2] = b;
    colors[i * 4 + 3] = 0.55 + rng() * 0.35;
    i++;
  }
  return { positions, colors };
}

const silhouetteCache = new WeakMap<ArtImage, Map<number, ShapeTargets>>();

/**
 * Samples the artwork's alpha into a flat, slightly thick point layout facing +Z,
 * with outline pixels weighted up so the silhouette stays recognizable.
 */
export function silhouetteShape(art: ArtImage, count: number, maxW = 3.3, maxH = 2.4): ShapeTargets {
  let perArt = silhouetteCache.get(art);
  const hit = perArt?.get(count);
  if (hit) return hit;

  const src = art.canvas;
  const s = 180 / Math.max(src.width, src.height);
  const w = Math.max(8, Math.round(src.width * s));
  const h = Math.max(8, Math.round(src.height * s));
  const small = createCanvas(w, h);
  const ctx = ctx2d(small, true);
  ctx.drawImage(src, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;

  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 115;
  const cells: number[] = [];
  const weights: number[] = [];
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(x, y)) continue;
      const edge = !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1);
      cells.push(y * w + x);
      weights.push(edge ? 3.2 : 1);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (cells.length === 0) return cloudShape(count);

  const cdf = new Float32Array(weights.length);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) cdf[i] = acc += weights[i];

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const scale = Math.min(maxW / bw, maxH / bh);
  const cx = minX + bw / 2;
  const cy = minY + bh / 2;
  const rng = mulberry32(count ^ (w * 7919 + h));
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const pick = rng() * acc;
    let lo = 0, hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < pick) lo = mid + 1;
      else hi = mid;
    }
    const cell = cells[lo];
    const px = (cell % w) + rng();
    const py = Math.floor(cell / w) + rng();
    positions[i * 3] = (px - cx) * scale;
    positions[i * 3 + 1] = -(py - cy) * scale;
    positions[i * 3 + 2] = gaussian(rng) * 0.12;
    const o = cell * 4;
    const pastel = 0.14;
    colors[i * 4] = (d[o] / 255) * (1 - pastel) + pastel;
    colors[i * 4 + 1] = (d[o + 1] / 255) * (1 - pastel) + pastel;
    colors[i * 4 + 2] = (d[o + 2] / 255) * (1 - pastel) + pastel;
    colors[i * 4 + 3] = 0.8 + rng() * 0.2;
  }

  const result = { positions, colors };
  if (!perArt) silhouetteCache.set(art, (perArt = new Map()));
  perArt.set(count, result);
  return result;
}
