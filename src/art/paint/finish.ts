import { createCanvas, ctx2d, drawBlurred } from './canvas';
import { fbm2D, mulberry32 } from './random';

export interface GrainOptions {
  seed: number;
  /** Luminance noise strength (0..1). */
  amount?: number;
  /** Colored noise strength relative to `amount`. */
  chroma?: number;
  /** Turn soft alpha edges into a speckled, sprayed edge like the reference painting. */
  dither?: boolean;
  /**
   * Grain cell size in pixels. Textures are drawn several times smaller than
   * their resolution, so per-pixel grain would be averaged away by mipmaps.
   */
  block?: number;
}

/** Fast deterministic hash of a grain cell to 0..1. */
function cellNoise(x: number, y: number, seed: number) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ seed;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Suggested grain cell size for a texture that is `px` pixels across. */
export const grainBlock = (px: number) => Math.max(2, Math.round(px / 640));

/** Adds paper/pigment grain and speckles soft alpha edges, in place. */
export function applyGrain(canvas: HTMLCanvasElement, { seed, amount = 0.06, chroma = 0.5, dither = true, block = 1 }: GrainOptions) {
  const ctx = ctx2d(canvas, true);
  const { width: W, height: H } = canvas;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const lum = amount * 255 * 2;
  const chr = amount * chroma * 255;
  const fine = mulberry32(seed);
  for (let y = 0; y < H; y++) {
    const by = (y / block) | 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let a = d[i + 3];
      if (a === 0) continue;
      const bx = (x / block) | 0;
      if (dither && a < 250) {
        const t = a / 255;
        a = cellNoise(bx, by, seed ^ 0x51ed) < Math.pow(t, 0.85) ? a + (255 - a) * 0.55 : a * 0.2;
        d[i + 3] = a;
      }
      const n = (cellNoise(bx, by, seed) - 0.5) * lum + (fine() - 0.5) * lum * 0.35;
      const c = (cellNoise(bx, by, seed ^ 0xc0102) - 0.5) * chr;
      d[i] += n + c;
      d[i + 1] += n;
      d[i + 2] += n - c;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export interface FinishOptions {
  seed: number;
  /** Halo bleed strength (watercolor spreading past the edges). */
  bleed?: number;
  /** Softening blur relative to the canvas size. */
  soften?: number;
  grain?: number;
  dither?: boolean;
}

/**
 * Turns crisp painter output into the soft, grainy storybook look:
 * a blurred pigment halo underneath, a lightly softened body, then grain.
 */
export function finishArt(src: HTMLCanvasElement, { seed, bleed = 1, soften = 1, grain = 0.08, dither = true }: FinishOptions) {
  const out = createCanvas(src.width, src.height);
  const ctx = ctx2d(out, true);
  if (bleed > 0) drawBlurred(ctx, src, 9 * bleed, 0.5);
  drawBlurred(ctx, src, 1.6 * soften, 1);
  applyGrain(out, { seed, amount: grain, dither, block: Math.max(2, Math.round(Math.min(src.width, src.height) / 220)) });
  return out;
}

export interface FeatherOptions {
  seed: number;
  /** Width of the soft edge in pixels. */
  feather: number;
  /** How far the noisy edge wanders, in pixels. */
  wander: number;
  /** Corner radius in pixels. */
  radius: number;
  /** Inset of the square from the canvas border in pixels. */
  inset: number;
}

/** Gives a square canvas the torn-paper, sprayed edge of the reference illustration (in place). */
export function featherSquare(canvas: HTMLCanvasElement, { seed, feather, wander, radius, inset }: FeatherOptions) {
  const ctx = ctx2d(canvas, true);
  const { width: W, height: H } = canvas;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const noise = fbm2D(seed, 4);
  const block = grainBlock(W);
  const band = feather + wander * 1.2;
  const x0 = inset, y0 = inset, x1 = W - inset, y1 = H - inset;
  const freq = 1 / 38;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Signed distance to a rounded rectangle (positive inside).
      const qx = Math.max(x0 + radius - x, x - (x1 - radius), 0);
      const qy = Math.max(y0 + radius - y, y - (y1 - radius), 0);
      let dist: number;
      if (qx > 0 && qy > 0) dist = radius - Math.hypot(qx, qy);
      else dist = Math.min(x - x0, x1 - x, y - y0, y1 - y);
      const i = (y * W + x) * 4;
      if (dist > band) continue;
      const n = (noise(x * freq, y * freq) - 0.5) * 2 * wander;
      const t = Math.max(0, Math.min(1, (dist + n) / feather));
      let a = t * t * (3 - 2 * t);
      const r = cellNoise((x / block) | 0, (y / block) | 0, seed);
      if (a > 0.02 && a < 0.98) {
        a = r < a ? Math.min(1, a + 0.35) : a * 0.2;
      } else if (a <= 0.02 && dist + n > -wander * 0.8 && r < 0.03) {
        a = 0.45 + r * 12;
      }
      d[i + 3] = d[i + 3] * a;
    }
  }
  ctx.putImageData(img, 0, 0);
}
