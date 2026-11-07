import type { Brush } from '../paint/brush';
import { P, mix, shade } from '../paint/color';
import { type PainterMap, type PainterSpec, canopy, wheel } from './common';

type Pt = [number, number];

const SKIN = '#e9b48f';
const BULB_COLORS = [P.butter, P.pink, P.skyLight, P.apricot];

/** Points along a string hanging between two posts. */
function sag(x0: number, y0: number, x1: number, y1: number, depth: number, n = 16): Pt[] {
  return Array.from({ length: n + 1 }, (_, i): Pt => {
    const t = i / n;
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * depth];
  });
}

function bulb(b: Brush, x: number, y: number, r: number, color: string) {
  b.glow(x, y, r * 4, color, 0.55);
  b.flat(b.circle(x, y, r, 0.2), shade(color, 0.45));
}

/** Round rice-paper lantern, the small pastel kind strung over the market. */
function globe(b: Brush, x: number, y: number, r: number, color: string) {
  b.glow(x, y, r * 2.6, color, 0.45);
  b.paint(b.circle(x, y, r, 0.3), color, { mottle: 0.4, light: 0.5, shadow: 0.1, rim: 0.1 });
  b.glow(x, y, r * 0.6, '#fffaf0', 0.6);
  for (const dy of [-0.45, 0, 0.45]) {
    const half = r * Math.sqrt(1 - dy * dy) * 0.92;
    b.line([[x - half, y + dy * r], [x + half, y + dy * r]], shade(color, -0.25), r * 0.08, { alpha: 0.45, wobble: 0 });
  }
}

/** Red plastic stool, the seat of every Thai street-food stall. */
function stool(b: Brush, x: number, base: number, s: number, color: string) {
  b.paint(b.poly([[x - s * 0.42, base], [x - s * 0.3, base - s * 0.85], [x + s * 0.3, base - s * 0.85], [x + s * 0.42, base]], { wobble: 0.3 }), color, { mottle: 0.4 });
  b.flat(b.ellipse(x, base - s * 0.3, s * 0.13, s * 0.17, 0.2), shade(color, -0.4), 0.75);
  b.paint(b.ellipse(x, base - s * 0.87, s * 0.38, s * 0.1, 0.3), shade(color, 0.2), { mottle: 0.3, rim: 0.1 });
}

/** A pointed leaf blade from (x, y) at `angle` from vertical. */
function blade(b: Brush, x: number, y: number, angle: number, len: number, width: number, color: string) {
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const px = -dy;
  const py = dx;
  const m = 0.35;
  b.paint(
    b.poly(
      [
        [x + px * width * 0.5, y + py * width * 0.5],
        [x + dx * len * m + px * width, y + dy * len * m + py * width],
        [x + dx * len, y + dy * len],
        [x + dx * len * m - px * width, y + dy * len * m - py * width],
        [x - px * width * 0.5, y - py * width * 0.5],
      ],
      { wobble: 0.3 },
    ),
    color,
    { mottle: 0.5, rim: 0.15, shadow: 0.2 },
  );
}

function stripedAwning(b: Brush, x0: number, x1: number, top: number, bottom: number, colors: [string, string], stripes = 8) {
  const w = (x1 - x0) / stripes;
  for (let i = 0; i < stripes; i++) {
    const a = x0 + i * w;
    const c = colors[i % 2];
    b.paint(b.poly([[a + 0.03, top], [a + w + 0.03, top], [a + w, bottom], [a, bottom]], { wobble: 0.3 }), c, { mottle: 0.3, rim: 0.1 });
    b.paint(b.ellipse(a + w / 2, bottom, w / 2, 0.05, 0.2), c, { mottle: 0.2, rim: 0 });
  }
}

// --- Stalls ------------------------------------------------------------------

interface StallSpec {
  awning: [string, string];
  counter: string;
  sign: string;
  signColor: string;
  /** Wares on the counter; the counter top is at y = 0.98. */
  goods(b: Brush): void;
  /** Things hanging from the awning frame. */
  hang?(b: Brush): void;
}

const STALL_W = 2.1;
const STALL_H = 1.65;
const STALL_BACK = mix(P.plum, P.night, 0.35);

function stall(spec: StallSpec): PainterSpec {
  return {
    w: STALL_W,
    h: STALL_H,
    paint(b) {
      const W = STALL_W;
      b.paint(b.rect(0.12, 0.3, W - 0.24, 0.72, 0.02, 0.4), STALL_BACK, { mottle: 1, light: 0.1 });
      b.glow(W / 2, 0.66, 0.75, P.apricot, 0.55);
      for (const x of [0.1, W - 0.16]) b.paint(b.rect(x, 0.28, 0.06, STALL_H - 0.3, 0.02, 0.3), P.woodDeep, { mottle: 0.3, rim: 0.1 });
      for (const x of [0.5, W / 2, W - 0.5]) {
        b.line([[x, 0.32], [x, 0.42]], P.inkSoft, 0.01, { wobble: 0 });
        bulb(b, x, 0.45, 0.035, P.butter);
      }
      spec.hang?.(b);
      stripedAwning(b, -0.02, W + 0.02, 0.02, 0.3, spec.awning);
      spec.goods(b);
      const counter = b.rect(0.06, 0.98, W - 0.12, STALL_H - 0.98, 0.03, 0.5);
      b.paint(counter, spec.counter, { mottle: 0.9 });
      b.paint(b.rect(0.0, 0.93, W, 0.08, 0.02, 0.4), shade(spec.counter, 0.35), { mottle: 0.3 });
      const board = b.rect(W / 2 - 0.46, 1.12, 0.92, 0.3, 0.06, 0.4);
      b.paint(board, P.cream, { mottle: 0.3, rim: 0.15 });
      b.text(spec.sign, W / 2, 1.27, 0.12, spec.signColor, { weight: 700, maxWidth: 0.8 });
    },
  };
}

function dragonFruit(b: Brush, x: number, y: number) {
  b.paint(b.ellipse(x, y, 0.09, 0.11, 0.4), P.magenta, { mottle: 0.5, light: 0.3, rim: 0.2 });
  for (const [dx, dy, a] of [[-0.07, -0.04, -0.9], [0.07, -0.02, 0.9], [-0.06, 0.05, -1.2], [0.05, 0.07, 1.1], [0, -0.1, 0]] as [number, number, number][]) {
    blade(b, x + dx, y + dy, a, 0.06, 0.018, P.leaf);
  }
}

function rambutan(b: Brush, x: number, y: number) {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.line([[x + Math.cos(a) * 0.04, y + Math.sin(a) * 0.04], [x + Math.cos(a + 0.3) * 0.07, y + Math.sin(a + 0.3) * 0.07]], i % 3 ? P.ember : P.leaf, 0.01, { wobble: 0 });
  }
  b.paint(b.circle(x, y, 0.05, 0.4), P.ember, { mottle: 0.4, light: 0.3, rim: 0.2 });
}

function mangosteen(b: Brush, x: number, y: number) {
  b.paint(b.circle(x, y, 0.055, 0.3), mix(P.plum, P.night, 0.3), { mottle: 0.4, light: 0.35, rim: 0.2 });
  b.paint(b.ellipse(x, y - 0.05, 0.035, 0.015, 0.2), P.leafDeep, { rim: 0 });
}

function elephant(b: Brush, x: number, base: number, s: number, color: string) {
  for (const dx of [-0.32, -0.12, 0.12, 0.3]) b.paint(b.rect(x + dx * s - 0.05 * s, base - 0.35 * s, 0.1 * s, 0.35 * s, 0.03 * s, 0.2), shade(color, -0.1), { mottle: 0.2, rim: 0.1 });
  b.paint(b.ellipse(x, base - 0.5 * s, 0.42 * s, 0.26 * s, 0.3), color, { mottle: 0.4 });
  b.paint(b.circle(x + 0.42 * s, base - 0.58 * s, 0.2 * s, 0.3), color, { mottle: 0.3 });
  b.line([[x + 0.58 * s, base - 0.5 * s], [x + 0.66 * s, base - 0.3 * s], [x + 0.6 * s, base - 0.2 * s]], color, 0.08 * s, { wobble: 0 });
  b.paint(b.ellipse(x + 0.32 * s, base - 0.56 * s, 0.12 * s, 0.17 * s, 0.2), shade(color, -0.15), { mottle: 0.2, rim: 0.1 });
  b.flat(b.circle(x + 0.48 * s, base - 0.64 * s, 0.025 * s, 0), P.ink);
  b.paint(b.ellipse(x - 0.05 * s, base - 0.72 * s, 0.24 * s, 0.07 * s, 0.2), P.magenta, { mottle: 0.2, rim: 0.1 });
}

// --- Carts -------------------------------------------------------------------

interface CartSpec {
  canopy: string[];
  body: string;
  sign: string;
  /** Wares behind the counter; the counter top is at y = 0.97. */
  goods(b: Brush): void;
}

const CART_W = 1.55;
const CART_H = 1.6;

/** Push cart with a little parasol, a lamp and a painted name board. */
function cart(b: Brush, spec: CartSpec) {
  b.line([[0.78, 0.36], [0.78, 0.66]], P.woodDeep, 0.03, { wobble: 0 });
  canopy(b, 0.78, 0.38, 0.06, 0.6, spec.canopy);
  bulb(b, 0.78, 0.5, 0.03, P.butter);
  spec.goods(b);
  b.paint(b.rect(0.14, 0.97, 1.28, 0.06, 0.02, 0.2), P.charcoal, { mottle: 0.3, rim: 0 });
  b.paint(b.rect(0.1, 1.03, 1.36, 0.34, 0.04, 0.4), spec.body, { mottle: 0.9 });
  b.line([[0.12, 1.08], [1.44, 1.08]], P.gold, 0.02, { wobble: 0 });
  b.text(spec.sign, 0.78, 1.23, 0.11, P.cream, { weight: 700 });
  b.line([[1.46, 1.12], [1.53, 0.98]], P.stone, 0.03, { wobble: 0 });
  wheel(b, 0.35, 1.42, 0.17, P.butter);
  wheel(b, 1.2, 1.42, 0.17, P.butter);
}

// --- Buildings -----------------------------------------------------------------

interface ShophouseSpec {
  wall: string;
  trim: string;
  awning: [string, string];
  board: string;
  sign: string;
}

const SHOP_W = 2.0;
const SHOP_H = 2.6;

/** Two-storey shophouse: lit shutters upstairs, a glowing open-fronted eatery below. */
function shophouse(s: ShophouseSpec): PainterSpec {
  return {
    w: SHOP_W,
    h: SHOP_H,
    paint(b) {
      const W = SHOP_W;
      const H = SHOP_H;
      const wall = b.rect(0, 0.2, W, H - 0.2, 0.03, 0.6);
      b.paint(wall, s.wall, { mottle: 1.3, shadow: 0.3, light: 0.1 });
      b.speckle(wall, shade(s.wall, -0.2), 120, 0.012, 0.3);
      b.paint(b.rect(-0.04, 0.1, W + 0.08, 0.16, 0.02, 0.4), s.trim, { mottle: 0.4 });

      for (let c = 0; c < 3; c++) {
        const x = 0.26 + c * 0.56;
        b.glow(x + 0.16, 0.66, 0.42, P.apricot, 0.35);
        b.paint(b.rect(x - 0.1, 0.42, 0.09, 0.5, 0.02, 0.3), s.trim, { mottle: 0.3, rim: 0.12 });
        b.paint(b.rect(x + 0.33, 0.42, 0.09, 0.5, 0.02, 0.3), s.trim, { mottle: 0.3, rim: 0.12 });
        b.paint(b.rect(x, 0.4, 0.32, 0.54, 0.12, 0.3), P.butter, { mottle: 0.6, shadow: 0.25, light: 0.4, rim: 0.12 });
        b.line([[x + 0.16, 0.42], [x + 0.16, 0.93]], shade(P.butter, -0.35), 0.012, { alpha: 0.5, wobble: 0 });
        b.paint(b.rect(x - 0.04, 0.94, 0.4, 0.08, 0.02, 0.3), P.woodDeep, { mottle: 0.3 });
        for (let k = 0; k < 4; k++) b.flat(b.circle(x + 0.02 + k * 0.1, 0.92, 0.035, 0.6), k % 2 ? P.leaf : P.pink);
      }

      const board = b.rect(0.14, 1.1, W - 0.28, 0.34, 0.05, 0.4);
      b.paint(board, s.board, { mottle: 0.6, light: 0.2 });
      b.stroke(board, P.gold, 0.02, 0.9);
      b.text(s.sign, W / 2, 1.27, 0.15, P.butter, { weight: 700, maxWidth: W - 0.5 });
      for (let x = 0.2; x < W - 0.15; x += 0.12) bulb(b, x, 1.07, 0.014, P.butter);

      stripedAwning(b, 0.04, W - 0.04, 1.5, 1.66, s.awning, 9);

      b.paint(b.rect(0.12, 1.72, W - 0.24, H - 1.72, 0.02, 0.4), '#f2b170', { mottle: 1, light: 0.3, shadow: 0.2 });
      b.glow(W / 2, 2.0, 0.8, P.butter, 0.55);
      const jars = [P.rose, P.leaf, P.skyLight, P.butter];
      for (const y of [1.88, 2.06]) {
        b.line([[0.2, y], [W - 0.2, y]], P.woodDeep, 0.02, { alpha: 0.8, wobble: 0.2 });
        for (let x = 0.26, k = 0; x < W - 0.3; x += 0.1, k++) b.flat(b.rect(x, y - 0.075, 0.055, 0.07, 0.015, 0.2), jars[k % 4]);
      }
      b.paint(b.rect(0.62, 2.28, 0.76, 0.05, 0.02, 0.3), P.cream, { mottle: 0.2, rim: 0.1 });
      for (const x of [0.68, 1.3]) b.line([[x, 2.33], [x, H - 0.02]], P.stone, 0.02, { wobble: 0 });
      stool(b, 0.42, H, 0.24, P.ember);
      stool(b, 1.58, H, 0.24, P.skyDeep);
      for (const x of [0.5, 1.0, 1.5]) {
        b.line([[x, 1.72], [x, 1.8]], P.inkSoft, 0.008, { wobble: 0 });
        bulb(b, x, 1.83, 0.025, P.butter);
      }
    },
  };
}

// --- Painters ------------------------------------------------------------------

export const marketPainters: PainterMap = {
  lantern: {
    w: 0.76,
    h: 1.36,
    paint(b) {
      const cx = 0.38;
      const red = P.ember;
      b.line([[cx, 0.0], [cx, 0.3]], P.gold, 0.02, { wobble: 0.2 });
      b.glow(cx, 0.66, 0.46, P.apricot, 0.55);
      b.paint(b.rect(cx - 0.13, 0.27, 0.26, 0.09, 0.03, 0.3), P.gold, { mottle: 0.4, rim: 0.15 });
      const body = b.ellipse(cx, 0.65, 0.36, 0.3, 0.4);
      b.paint(body, red, { mottle: 0.8, light: 0.35, shadow: 0.25, rim: 0.2 });
      b.ctx.save();
      b.ctx.clip(body.path);
      b.glow(cx, 0.68, 0.3, P.butter, 0.55);
      for (const k of [-2, -1, 0, 1, 2]) {
        const pts: Pt[] = [];
        for (let t = -1; t <= 1.001; t += 0.25) pts.push([cx + k * 0.15 * Math.sqrt(1 - t * t), 0.65 + t * 0.3]);
        b.line(pts, shade(red, -0.35), 0.012, { alpha: 0.55, wobble: 0.1 });
      }
      b.ctx.restore();
      b.paint(b.rect(cx - 0.12, 0.93, 0.24, 0.08, 0.03, 0.3), P.gold, { mottle: 0.4, rim: 0.15 });
      b.line([[cx, 1.0], [cx, 1.08]], P.gold, 0.02, { wobble: 0 });
      b.paint(b.poly([[cx - 0.035, 1.07], [cx + 0.035, 1.07], [cx + 0.075, 1.36], [cx - 0.075, 1.36]], { wobble: 0.3 }), red, { mottle: 0.3, rim: 0.1 });
      for (const dx of [-0.04, 0, 0.04]) b.line([[cx + dx * 0.5, 1.12], [cx + dx, 1.34]], shade(red, -0.3), 0.008, { alpha: 0.6, wobble: 0 });
      b.flat(b.circle(cx, 1.08, 0.03, 0.2), P.gold);
    },
  },

  noodles: {
    w: 1.05,
    h: 0.9,
    paint(b) {
      for (const [x, d] of [[0.32, 1], [0.5, -1], [0.7, 1]] as [number, number][]) {
        b.line([[x, 0.4], [x + 0.05 * d, 0.29], [x - 0.03 * d, 0.17], [x + 0.03 * d, 0.06]], P.white, 0.03, { alpha: 0.45 });
      }
      b.line([[0.62, 0.48], [0.9, 0.06]], P.wood, 0.03, { wobble: 0.1 });
      b.line([[0.68, 0.5], [0.99, 0.12]], shade(P.wood, -0.15), 0.03, { wobble: 0.1 });
      b.paint(b.ellipse(0.52, 0.5, 0.46, 0.08, 0.3), P.white, { mottle: 0.3, rim: 0.15 });
      b.paint(b.ellipse(0.52, 0.51, 0.41, 0.065, 0.3), P.apricot, { mottle: 0.8, light: 0.3, rim: 0.1 });
      for (let i = 0; i < 7; i++) {
        const x = 0.16 + i * 0.1;
        const y = 0.49 + (i % 2) * 0.02;
        b.line([[x, y], [x + 0.04, y - 0.025], [x + 0.08, y], [x + 0.12, y - 0.025]], P.butter, 0.016, { alpha: 0.95, wobble: 0.2 });
      }
      for (const dx of [-0.02, 0.01, 0.04]) b.line([[0.66 + dx, 0.5], [0.71 + dx, 0.4], [0.68 + dx, 0.32], [0.73 + dx, 0.24]], P.butter, 0.018, { wobble: 0.3 });
      b.paint(b.ellipse(0.34, 0.47, 0.06, 0.035, 0.3, -0.3), P.salmon, { mottle: 0.3, rim: 0.15 });
      b.paint(b.ellipse(0.48, 0.48, 0.055, 0.032, 0.3), P.white, { mottle: 0.2, rim: 0.1 });
      b.flat(b.circle(0.48, 0.475, 0.022, 0.2), P.yellow);
      for (const [x, y] of [[0.24, 0.5], [0.4, 0.5], [0.58, 0.47], [0.3, 0.46]] as Pt[]) b.flat(b.circle(x, y, 0.014, 0.2), P.leaf);
      b.flat(b.circle(0.56, 0.5, 0.013, 0.2), P.ember);

      const front: Pt[] = [];
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI;
        front.push([0.52 + Math.cos(a) * 0.46, 0.5 + Math.sin(a) * 0.3]);
      }
      const bowl = b.poly(front, { wobble: 0.4 });
      b.paint(bowl, P.white, { mottle: 0.5, shadow: 0.35 });
      b.ctx.save();
      b.ctx.clip(bowl.path);
      b.line([[0.06, 0.55], [0.52, 0.6], [0.98, 0.55]], P.skyDeep, 0.03, { wobble: 0.2 });
      for (let x = 0.18; x < 0.9; x += 0.12) b.flat(b.circle(x, 0.67 + Math.sin(x * 9) * 0.01, 0.022, 0.4), P.sky, 0.8);
      b.ctx.restore();
      b.paint(b.rect(0.36, 0.78, 0.32, 0.12, 0.03, 0.3), shade(P.white, -0.08), { mottle: 0.3, rim: 0.15 });
      b.line([[0.38, 0.84], [0.66, 0.84]], P.skyDeep, 0.014, { alpha: 0.7, wobble: 0 });
    },
  },

  mango: {
    w: 0.95,
    h: 0.78,
    paint(b) {
      // Long Thai mango lying on its side: round shoulder by the stem, curved beak at the tip.
      const body = b.poly(
        [
          [0.05, 0.5], [0.1, 0.34], [0.24, 0.24], [0.44, 0.2], [0.64, 0.23], [0.8, 0.33], [0.9, 0.47], [0.93, 0.6],
          [0.86, 0.64], [0.74, 0.6], [0.56, 0.64], [0.36, 0.73], [0.18, 0.72], [0.08, 0.64],
        ],
        { smooth: true, wobble: 0.3 },
      );
      b.paint(body, P.yellow, { mottle: 0.8, light: 0.3, shadow: 0.2 });
      b.ctx.save();
      b.ctx.clip(body.path);
      b.glow(0.14, 0.38, 0.26, P.leaf, 0.4);
      b.glow(0.78, 0.5, 0.32, P.orange, 0.8);
      b.glow(0.62, 0.36, 0.16, P.rose, 0.3);
      b.glow(0.42, 0.32, 0.14, '#ffffff', 0.45);
      b.ctx.restore();
      b.line([[0.36, 0.66], [0.6, 0.57], [0.8, 0.56]], shade(P.orange, -0.15), 0.008, { alpha: 0.35 });
      b.line([[0.14, 0.32], [0.1, 0.2]], P.woodDeep, 0.03);
      b.paint(b.ellipse(0.27, 0.16, 0.17, 0.055, 0.4, -0.35), P.leaf, { mottle: 0.5, rim: 0.15 });
      b.line([[0.11, 0.22], [0.42, 0.1]], P.leafDeep, 0.01, { alpha: 0.7, wobble: 0 });
    },
  },

  coconut: {
    w: 1.05,
    h: 0.8,
    paint(b) {
      const husk = '#9b6b52';
      const whole = b.circle(0.36, 0.44, 0.32, 0.6);
      b.paint(whole, husk, { mottle: 1.1 });
      b.ctx.save();
      b.ctx.clip(whole.path);
      for (let i = 0; i < 28; i++) {
        const x = 0.06 + b.rng() * 0.6;
        const y = 0.14 + b.rng() * 0.6;
        b.line([[x, y], [x + 0.05, y + 0.02]], shade(husk, -0.3), 0.008, { alpha: 0.5, wobble: 0 });
      }
      b.glow(0.26, 0.3, 0.12, '#ffffff', 0.25);
      b.ctx.restore();
      for (const [x, y] of [[0.3, 0.24], [0.39, 0.22], [0.35, 0.31]] as Pt[]) b.flat(b.circle(x, y, 0.025, 0.2), shade(husk, -0.5));

      const shell: Pt[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI;
        shell.push([0.7 + Math.cos(a) * 0.31, 0.56 + Math.sin(a) * 0.22]);
      }
      b.paint(b.poly(shell, { wobble: 0.4 }), husk, { mottle: 0.9 });
      b.paint(b.ellipse(0.7, 0.56, 0.31, 0.095, 0.3), shade(husk, -0.15), { mottle: 0.4, rim: 0.1 });
      b.paint(b.ellipse(0.7, 0.56, 0.27, 0.075, 0.3), P.white, { mottle: 0.3, shadow: 0.1, rim: 0.15 });
      b.paint(b.ellipse(0.7, 0.565, 0.19, 0.045, 0.3), shade(P.skyPale, 0.45), { mottle: 0.2, rim: 0.1 });
      b.glow(0.62, 0.55, 0.06, '#ffffff', 0.6);
    },
  },

  pineapple: {
    w: 0.78,
    h: 1.3,
    paint(b) {
      const cx = 0.39;
      const leaves: [number, number, string][] = [
        [-0.95, 0.3, P.leafDeep], [0.95, 0.3, P.leafDeep], [-0.6, 0.4, P.leaf], [0.6, 0.4, P.leaf],
        [-0.28, 0.48, P.leafDeep], [0.28, 0.48, P.leafDeep], [0, 0.52, P.leaf],
      ];
      for (const [a, len, c] of leaves) blade(b, cx, 0.56, a, len, 0.07, c);
      const gold = '#f2b54a';
      const body = b.ellipse(cx, 0.9, 0.3, 0.4, 0.5);
      b.paint(body, gold, { mottle: 0.9, light: 0.3 });
      b.ctx.save();
      b.ctx.clip(body.path);
      for (let x0 = cx - 1.0; x0 < cx + 0.6; x0 += 0.1) {
        b.line([[x0, 0.45], [x0 + 0.9, 1.35]], shade(gold, -0.35), 0.01, { alpha: 0.55, wobble: 0 });
        b.line([[x0, 1.35], [x0 + 0.9, 0.45]], shade(gold, -0.35), 0.01, { alpha: 0.55, wobble: 0 });
      }
      for (let y = 0.5, row = 0; y < 1.32; y += 0.1, row++) {
        for (let x = cx - 0.35 + (row % 2) * 0.05; x < cx + 0.35; x += 0.1) b.flat(b.circle(x, y, 0.012, 0), P.woodDeep, 0.8);
      }
      b.glow(cx - 0.12, 0.72, 0.16, '#ffffff', 0.3);
      b.glow(cx + 0.14, 1.1, 0.22, P.orange, 0.4);
      b.ctx.restore();
      for (const a of [-0.5, 0, 0.5]) blade(b, cx, 0.58, a, 0.14, 0.05, P.leaf);
    },
  },

  'mango-sticky-rice': {
    w: 1.2,
    h: 0.66,
    paint(b) {
      b.paint(b.rect(0.42, 0.58, 0.36, 0.08, 0.03, 0.3), shade(P.white, -0.1), { mottle: 0.2, rim: 0.15 });
      b.paint(b.ellipse(0.6, 0.54, 0.58, 0.1, 0.4), P.white, { mottle: 0.4, shadow: 0.3, rim: 0.2 });
      b.paint(b.ellipse(0.6, 0.52, 0.5, 0.075, 0.6), P.leaf, { mottle: 0.6, rim: 0.15 });
      b.line([[0.14, 0.52], [1.06, 0.52]], P.leafDeep, 0.008, { alpha: 0.6, wobble: 0.3 });

      const rice = b.poly([[0.12, 0.54], [0.15, 0.4], [0.24, 0.29], [0.38, 0.25], [0.5, 0.3], [0.56, 0.44], [0.55, 0.54]], { smooth: true, wobble: 0.6 });
      b.paint(rice, P.white, { mottle: 0.5, shadow: 0.3 });
      b.speckle(rice, P.cream, 70, 0.012, 0.8);
      b.speckle(rice, shade(P.white, -0.2), 30, 0.008, 0.5);
      b.line([[0.17, 0.37], [0.27, 0.32], [0.37, 0.36], [0.45, 0.31], [0.53, 0.38]], P.cream, 0.035, { alpha: 0.95 });
      for (let i = 0; i < 12; i++) b.flat(b.circle(0.22 + b.rng() * 0.28, 0.28 + b.rng() * 0.07, 0.01, 0.1), i % 2 ? P.butter : P.apricot);

      const mango = '#f5b83f';
      for (let i = 0; i < 4; i++) {
        const s = b.ellipse(0.66 + i * 0.1, 0.43 + i * 0.01, 0.12, 0.075, 0.4, -0.35 + i * 0.12);
        b.paint(s, i % 2 ? mango : shade(mango, 0.12), { mottle: 0.5, light: 0.4, rim: 0.2 });
      }
      b.glow(0.72, 0.38, 0.08, '#ffffff', 0.4);
    },
  },

  skewer: {
    w: 0.8,
    h: 1.3,
    paint(b) {
      const meat = '#c0714f';
      const glaze = '#d98a4e';
      const sticks: [number, string[]][] = [
        [-0.28, [glaze, P.leaf, glaze, P.ember]],
        [0.28, [P.salmon, glaze, P.salmon, glaze]],
        [0, [meat, meat, meat, meat]],
      ];
      const bx = 0.4;
      const by = 1.05;
      const len = 0.95;
      for (const [a, chunks] of sticks) {
        const dx = Math.sin(a);
        const dy = -Math.cos(a);
        b.line([[bx, by], [bx + dx * len, by + dy * len]], P.sand, 0.022, { wobble: 0.1 });
        chunks.forEach((c, i) => {
          const t = 0.4 + i * 0.15;
          const x = bx + dx * len * t;
          const y = by + dy * len * t;
          b.paint(b.ellipse(x, y, 0.075, 0.062, 0.6, a), c, { mottle: 0.6, light: 0.3, rim: 0.2 });
          b.glow(x - 0.02, y - 0.02, 0.03, '#ffffff', 0.4);
        });
      }
      b.paint(b.poly([[0.2, 0.98], [0.6, 0.98], [0.55, 1.3], [0.25, 1.3]], { wobble: 0.4 }), P.terracotta, { mottle: 0.6 });
      b.paint(b.ellipse(0.4, 0.98, 0.2, 0.04, 0.3), shade(P.terracotta, -0.25), { rim: 0 });
      b.line([[0.23, 1.12], [0.57, 1.12]], P.butter, 0.02, { alpha: 0.8, wobble: 0 });
    },
  },

  drink: {
    w: 0.62,
    h: 1.25,
    paint(b) {
      const tea = '#f08a3e';
      b.line([[0.4, 0.02], [0.35, 0.6]], P.rose, 0.05, { wobble: 0 });
      for (const y of [0.08, 0.2]) b.line([[0.395, y], [0.39, y + 0.05]], P.white, 0.05, { wobble: 0, alpha: 0.9, cap: 'butt' });
      const cup = b.poly([[0.04, 0.32], [0.58, 0.32], [0.5, 1.24], [0.12, 1.24]], { wobble: 0.4 });
      b.paint(cup, tea, { mottle: 0.8, light: 0.2, shadow: 0.3 });
      b.ctx.save();
      b.ctx.clip(cup.path);
      b.paint(b.rect(0, 0.3, 0.62, 0.2, 0, 1.5), P.cream, { mottle: 0.6, rim: 0 });
      b.line([[0.06, 0.52], [0.2, 0.46], [0.32, 0.56], [0.46, 0.48], [0.58, 0.54]], P.cream, 0.05, { alpha: 0.8 });
      b.glow(0.3, 0.75, 0.22, P.butter, 0.35);
      for (const [x, y] of [[0.18, 0.66], [0.38, 0.72], [0.26, 0.88]] as Pt[]) {
        b.paint(b.rect(x - 0.07, y - 0.06, 0.14, 0.12, 0.03, 0.4), P.white, { alpha: 0.35, mottle: 0, rim: 0.3 });
      }
      b.line([[0.12, 0.36], [0.18, 1.18]], P.white, 0.025, { alpha: 0.5, wobble: 0 });
      b.ctx.restore();
      const dome: Pt[] = [];
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI + (i / 14) * Math.PI;
        dome.push([0.31 + Math.cos(a) * 0.27, 0.32 + Math.sin(a) * 0.16]);
      }
      b.paint(b.poly(dome, { wobble: 0.3 }), P.white, { alpha: 0.45, mottle: 0.1, rim: 0.3, shadow: 0 });
      b.paint(b.ellipse(0.31, 0.32, 0.29, 0.035, 0.2), P.white, { alpha: 0.85, rim: 0.15, mottle: 0 });
      b.paint(b.rect(0.11, 0.9, 0.4, 0.15, 0.02, 0.3), P.pink, { mottle: 0.3, rim: 0.15 });
      b.text('♥', 0.31, 0.975, 0.07, P.raspberry, { weight: 700 });
    },
  },

  'tuk-tuk': {
    w: 2.0,
    h: 1.4,
    paint(b) {
      const body = P.skyDeep;
      const roof = P.magenta;
      for (const x of [0.24, 1.04, 1.5]) b.line([[x, 0.32], [x, 0.8]], P.charcoal, 0.03, { wobble: 0.1 });
      b.paint(b.rect(0.28, 0.44, 0.7, 0.3, 0.06, 0.4), P.ember, { mottle: 0.5, light: 0.3 });
      b.line([[0.3, 0.58], [0.96, 0.58]], shade(P.ember, -0.3), 0.012, { alpha: 0.5, wobble: 0 });
      const rear = b.poly([[0.12, 0.66], [0.22, 0.62], [1.12, 0.62], [1.18, 1.1], [0.2, 1.1], [0.1, 0.9]], { smooth: true, wobble: 0.4 });
      b.paint(rear, body, { mottle: 1 });
      b.line([[0.16, 0.8], [1.16, 0.8]], P.gold, 0.03, { wobble: 0.2 });
      b.line([[0.18, 0.92], [1.17, 0.92]], P.butter, 0.014, { alpha: 0.8, wobble: 0.2 });
      const cab = b.poly([[1.1, 0.72], [1.5, 0.68], [1.78, 0.86], [1.86, 1.06], [1.1, 1.1]], { smooth: true, wobble: 0.4 });
      b.paint(cab, body, { mottle: 0.8 });
      b.paint(b.poly([[1.44, 0.34], [1.56, 0.34], [1.68, 0.72], [1.52, 0.72]], { wobble: 0.2 }), P.skyPale, { alpha: 0.75, mottle: 0.3, rim: 0.15 });
      b.line([[1.56, 0.74], [1.68, 0.64]], P.charcoal, 0.025, { wobble: 0 });

      const top = b.poly([[0.1, 0.36], [0.18, 0.14], [1.52, 0.12], [1.64, 0.3], [1.62, 0.38], [0.12, 0.4]], { smooth: true, wobble: 0.4 });
      b.paint(top, roof, { mottle: 0.9, light: 0.35 });
      b.line([[0.24, 0.24], [1.5, 0.22]], P.gold, 0.02, { alpha: 0.85, wobble: 0.2 });
      for (let x = 0.16; x < 1.6; x += 0.1) b.paint(b.ellipse(x + 0.05, 0.4, 0.05, 0.035, 0.2), P.gold, { rim: 0, mottle: 0.2 });
      for (let x = 0.2; x < 1.6; x += 0.2) bulb(b, x, 0.46, 0.016, BULB_COLORS[Math.round(x * 5) % 4]);

      b.paint(b.circle(1.84, 0.9, 0.05, 0.2), P.butter, { rim: 0.1 });
      b.glow(1.9, 0.9, 0.22, P.butter, 0.55);
      b.paint(b.rect(0.2, 1.06, 1.6, 0.08, 0.03, 0.3), P.charcoal, { mottle: 0.3, rim: 0 });
      wheel(b, 0.5, 1.16, 0.24, P.stone);
      wheel(b, 1.62, 1.2, 0.2, P.stone);
    },
  },

  flower: {
    w: 0.9,
    h: 1.25,
    paint(b) {
      b.line([[0.45, 0.92], [0.42, 0.6], [0.4, 0.4]], P.leafDeep, 0.03);
      b.line([[0.46, 0.9], [0.62, 0.62], [0.72, 0.5]], P.leafDeep, 0.025);
      for (const [x, y, r] of [[0.26, 0.64, -0.6], [0.62, 0.76, 0.5], [0.3, 0.84, -0.3], [0.56, 0.6, -0.5], [0.72, 0.66, 0.9]] as [number, number, number][]) {
        b.paint(b.ellipse(x, y, 0.12, 0.055, 0.4, r), P.leaf, { mottle: 0.5, rim: 0.15 });
        b.line([[x - Math.cos(r) * 0.1, y - Math.sin(r) * 0.1], [x + Math.cos(r) * 0.1, y + Math.sin(r) * 0.1]], P.leafDeep, 0.008, { alpha: 0.7, wobble: 0 });
      }
      b.paint(b.ellipse(0.74, 0.46, 0.05, 0.08, 0.3, 0.5), P.rose, { mottle: 0.3, rim: 0.15 });
      b.paint(b.ellipse(0.72, 0.51, 0.04, 0.03, 0.2, 0.5), P.leaf, { rim: 0 });

      const cx = 0.38;
      const cy = 0.3;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        b.paint(b.ellipse(cx + Math.cos(a) * 0.13, cy + Math.sin(a) * 0.11, 0.15, 0.11, 0.5, a), P.rose, { mottle: 0.6, light: 0.3, rim: 0.2 });
      }
      b.glow(cx, cy, 0.13, P.raspberry, 0.85);
      b.line([[cx, cy], [cx + 0.1, cy - 0.12], [cx + 0.16, cy - 0.2]], P.pink, 0.016, { wobble: 0 });
      for (const [dx, dy] of [[0.16, -0.2], [0.13, -0.22], [0.18, -0.17]] as Pt[]) b.flat(b.circle(cx + dx, cy + dy, 0.022, 0.2), P.yellow);

      const pot = b.poly([[0.18, 0.92], [0.72, 0.92], [0.64, 1.25], [0.26, 1.25]], { wobble: 0.4 });
      b.paint(pot, P.skyDeep, { mottle: 0.8 });
      b.paint(b.rect(0.14, 0.88, 0.62, 0.08, 0.03, 0.3), shade(P.skyDeep, 0.3), { mottle: 0.3 });
      b.line([[0.22, 1.06], [0.3, 1.02], [0.38, 1.06], [0.46, 1.02], [0.54, 1.06], [0.62, 1.02], [0.68, 1.06]], P.white, 0.014, { alpha: 0.75, wobble: 0.1 });
    },
  },

  cat: {
    w: 0.8,
    h: 1.0,
    paint(b) {
      const fur = '#f4e7d3';
      const point = '#7a5a52';
      b.line([[0.56, 0.92], [0.72, 0.88], [0.76, 0.72], [0.7, 0.6]], point, 0.07);
      const body = b.poly([[0.16, 0.98], [0.14, 0.76], [0.22, 0.56], [0.36, 0.46], [0.5, 0.52], [0.62, 0.72], [0.62, 0.98]], { smooth: true, wobble: 0.4 });
      b.paint(body, fur, { mottle: 0.6, shadow: 0.35 });
      b.ctx.save();
      b.ctx.clip(body.path);
      b.glow(0.6, 0.86, 0.22, shade(point, 0.35), 0.35);
      b.ctx.restore();
      for (const x of [0.3, 0.46]) {
        b.line([[x, 0.7], [x, 0.93]], shade(fur, -0.2), 0.012, { alpha: 0.6, wobble: 0 });
        b.paint(b.ellipse(x, 0.96, 0.07, 0.04, 0.3), shade(point, 0.3), { rim: 0.1, mottle: 0.2 });
      }
      b.paint(b.poly([[0.2, 0.3], [0.19, 0.08], [0.35, 0.21]], { wobble: 0.2 }), point, { mottle: 0.3, rim: 0.1 });
      b.paint(b.poly([[0.41, 0.21], [0.57, 0.08], [0.56, 0.3]], { wobble: 0.2 }), point, { mottle: 0.3, rim: 0.1 });
      b.flat(b.poly([[0.23, 0.24], [0.22, 0.14], [0.3, 0.21]], { wobble: 0.1 }), P.pink, 0.8);
      b.flat(b.poly([[0.46, 0.21], [0.54, 0.14], [0.53, 0.24]], { wobble: 0.1 }), P.pink, 0.8);
      const head = b.ellipse(0.38, 0.34, 0.2, 0.17, 0.3);
      b.paint(head, fur, { mottle: 0.5 });
      b.ctx.save();
      b.ctx.clip(head.path);
      b.glow(0.38, 0.4, 0.14, point, 0.8);
      b.ctx.restore();
      for (const s of [-1, 1]) {
        const ex = 0.38 + s * 0.08;
        b.paint(b.ellipse(ex, 0.33, 0.042, 0.036, 0.2), P.skyLight, { rim: 0.2, mottle: 0.2 });
        b.flat(b.ellipse(ex, 0.33, 0.012, 0.03, 0.1), P.ink);
        b.flat(b.circle(ex + 0.012, 0.32, 0.009, 0), '#ffffff', 0.9);
        b.line([[0.38 + s * 0.07, 0.41], [0.38 + s * 0.24, 0.39]], P.white, 0.006, { alpha: 0.8, wobble: 0 });
        b.line([[0.38 + s * 0.07, 0.42], [0.38 + s * 0.23, 0.44]], P.white, 0.006, { alpha: 0.8, wobble: 0 });
      }
      b.flat(b.poly([[0.36, 0.385], [0.4, 0.385], [0.38, 0.41]], { wobble: 0 }), P.pink);
      b.line([[0.26, 0.5], [0.38, 0.535], [0.5, 0.5]], P.ember, 0.03, { wobble: 0.1 });
      b.paint(b.circle(0.38, 0.565, 0.03, 0.2), P.gold, { rim: 0.2 });
    },
  },

  fan: {
    w: 1.15,
    h: 0.95,
    paint(b) {
      const cx = 0.575;
      const cy = 0.66;
      const r0 = 0.16;
      const r1 = 0.55;
      const n = 12;
      const a0 = Math.PI + 0.2;
      const a1 = 2 * Math.PI - 0.2;
      const at = (a: number, r: number): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      for (let i = 0; i <= n; i++) b.line([[cx, cy], at(a0 + ((a1 - a0) * i) / n, r0 * 1.05)], P.woodDeep, 0.014, { wobble: 0 });
      for (let i = 0; i < n; i++) {
        const t0 = a0 + ((a1 - a0) * i) / n;
        const t1 = a0 + ((a1 - a0) * (i + 1)) / n;
        const base = mix(P.rose, P.plum, i / (n - 1));
        b.paint(b.poly([at(t0, r0), at(t0, r1), at((t0 + t1) / 2, r1 * 1.015), at(t1, r1), at(t1, r0)], { wobble: 0.2 }), i % 2 ? base : shade(base, 0.15), { mottle: 0.4, rim: 0.12, shadow: 0.15 });
      }
      const arc: Pt[] = [];
      for (let i = 0; i <= 20; i++) arc.push(at(a0 + 0.1 + ((a1 - a0 - 0.2) * i) / 20, r1 * 0.84));
      b.line(arc, P.gold, 0.016, { alpha: 0.9, wobble: 0.2 });
      for (const [a, r] of [[a0 + 0.5, 0.42], [a0 + 1.1, 0.36], [a0 + 1.7, 0.42], [a0 + 2.3, 0.36]] as Pt[]) {
        const [x, y] = at(a, r);
        for (let k = 0; k < 5; k++) b.flat(b.circle(x + Math.cos((k * 2 * Math.PI) / 5) * 0.025, y + Math.sin((k * 2 * Math.PI) / 5) * 0.025, 0.02, 0.2), P.cream, 0.9);
        b.flat(b.circle(x, y, 0.014, 0), P.gold);
      }
      for (const a of [a0, a1]) b.line([[cx, cy], at(a, r1 * 1.02)], P.woodDeep, 0.03, { wobble: 0 });
      b.paint(b.circle(cx, cy, 0.035, 0.2), P.gold, { rim: 0.2 });
      b.line([[cx, cy + 0.03], [cx + 0.02, cy + 0.12]], P.ember, 0.014, { wobble: 0 });
      b.paint(b.poly([[cx + 0.0, cy + 0.11], [cx + 0.045, cy + 0.11], [cx + 0.07, 0.95], [cx - 0.025, 0.95]], { wobble: 0.3 }), P.ember, { mottle: 0.3, rim: 0.1 });
    },
  },

  banana: {
    w: 1.05,
    h: 0.8,
    paint(b) {
      const fruit = (oy: number, turn: number, color: string) => {
        const cx = 0.55;
        const cy = -0.15 + oy;
        const R = 0.72;
        const left = Math.PI / 2 + 0.55 + turn;
        const right = Math.PI / 2 - 0.62 + turn;
        const outer: Pt[] = [];
        const inner: Pt[] = [];
        for (let i = 0; i <= 16; i++) {
          const t = i / 16;
          const a = left + (right - left) * t;
          const th = 0.13 * (0.35 + 0.65 * Math.sin(Math.PI * t));
          outer.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
          inner.push([cx + Math.cos(a) * (R - th), cy + Math.sin(a) * (R - th)]);
        }
        b.paint(b.poly([...outer, ...inner.reverse()], { smooth: true, wobble: 0.3 }), color, { mottle: 0.6, light: 0.35, rim: 0.2 });
        const ridge: Pt[] = [];
        for (let i = 2; i <= 14; i++) {
          const a = left + ((right - left) * i) / 16;
          ridge.push([cx + Math.cos(a) * (R - 0.045), cy + Math.sin(a) * (R - 0.045)]);
        }
        b.line(ridge, shade(color, -0.2), 0.008, { alpha: 0.45, wobble: 0 });
        const tip = outer[outer.length - 1];
        b.paint(b.ellipse(tip[0] - 0.01, tip[1] - 0.03, 0.025, 0.035, 0.2), P.woodDeep, { rim: 0 });
      };
      fruit(0.02, 0.08, shade(P.yellow, -0.2));
      fruit(0.11, 0.0, shade(P.yellow, -0.08));
      fruit(0.2, -0.05, P.yellow);
      b.paint(b.poly([[0.06, 0.4], [0.2, 0.38], [0.24, 0.62], [0.14, 0.66]], { smooth: true, wobble: 0.3 }), '#8f9a52', { mottle: 0.4, rim: 0.15 });
      b.paint(b.rect(0.04, 0.32, 0.1, 0.1, 0.03, 0.2), P.woodDeep, { mottle: 0.3 });
    },
  },

  basket: {
    w: 1.0,
    h: 0.9,
    paint(b) {
      const cane = '#d9a86c';
      const handle: Pt[] = [[0.16, 0.42], [0.2, 0.16], [0.5, 0.05], [0.8, 0.16], [0.84, 0.42]];
      b.line(handle, shade(cane, -0.25), 0.06);
      b.line(handle, shade(cane, 0.15), 0.025, { alpha: 0.8 });
      b.paint(b.ellipse(0.5, 0.42, 0.42, 0.09, 0.3), shade(cane, -0.4), { mottle: 0.4, rim: 0 });
      const body = b.poly([[0.08, 0.42], [0.5, 0.44], [0.92, 0.42], [0.86, 0.7], [0.74, 0.86], [0.5, 0.89], [0.26, 0.86], [0.14, 0.7]], { smooth: true, wobble: 0.4 });
      b.paint(body, cane, { mottle: 0.8 });
      b.ctx.save();
      b.ctx.clip(body.path);
      for (let y = 0.46, row = 0; y < 0.9; y += 0.07, row++) {
        b.line([[0.0, y], [1.0, y]], shade(cane, -0.3), 0.008, { alpha: 0.6, wobble: 0.1 });
        for (let x = 0.1 + (row % 2) * 0.04; x < 0.95; x += 0.08) b.line([[x, y + 0.012], [x, y + 0.058]], shade(cane, 0.25), 0.026, { alpha: 0.7, wobble: 0 });
      }
      b.ctx.restore();
      b.line([[0.07, 0.42], [0.5, 0.47], [0.93, 0.42]], shade(cane, 0.1), 0.045, { wobble: 0.2 });
      b.paint(b.ellipse(0.42, 0.08, 0.07, 0.04, 0.2, 0.4), P.rose, { mottle: 0.3, rim: 0.15 });
      b.paint(b.ellipse(0.58, 0.08, 0.07, 0.04, 0.2, -0.4), P.rose, { mottle: 0.3, rim: 0.15 });
      b.line([[0.48, 0.1], [0.44, 0.2]], P.rose, 0.02, { wobble: 0 });
      b.line([[0.52, 0.1], [0.56, 0.2]], P.rose, 0.02, { wobble: 0 });
      b.paint(b.circle(0.5, 0.08, 0.03, 0.2), shade(P.rose, -0.15), { rim: 0 });
    },
  },

  // --- Scenery ---------------------------------------------------------------

  'shophouse-noodle': shophouse({
    wall: mix(P.teal, P.night, 0.3),
    trim: P.cream,
    awning: [P.ember, P.cream],
    board: P.magenta,
    sign: 'ก๋วยเตี๋ยว',
  }),

  'shophouse-cafe': shophouse({
    wall: mix(P.rose, P.plum, 0.45),
    trim: P.butter,
    awning: [P.teal, P.cream],
    board: P.night,
    sign: 'ร้านอาหาร',
  }),

  'thai-pavilion': {
    w: 2.4,
    h: 2.3,
    paint(b) {
      const roof = '#d9603f';
      b.paint(b.rect(0.2, 1.08, 2.0, 1.14, 0.02, 0.4), mix(P.plum, P.night, 0.4), { mottle: 1 });
      b.glow(1.2, 1.62, 0.95, P.apricot, 0.6);
      b.glow(1.2, 1.55, 0.5, P.butter, 0.5);
      for (const x of [0.6, 1.8]) {
        b.paint(b.rect(x - 0.24, 1.86, 0.48, 0.05, 0.02, 0.3), P.cream, { mottle: 0.2, rim: 0.1 });
        b.line([[x, 1.9], [x, 2.18]], P.stone, 0.03, { wobble: 0 });
        stool(b, x - 0.3, 2.18, 0.2, P.ember);
        stool(b, x + 0.3, 2.18, 0.2, P.skyDeep);
      }
      for (const x of [0.22, 0.86, 1.48, 2.1]) b.paint(b.rect(x, 1.04, 0.08, 1.16, 0.02, 0.3), P.woodDeep, { mottle: 0.4, rim: 0.12 });
      b.paint(b.rect(0.04, 2.16, 2.32, 0.14, 0.02, 0.4), P.wood, { mottle: 0.6 });

      b.paint(b.poly([[0.0, 1.12], [0.3, 0.82], [2.1, 0.82], [2.4, 1.12]], { wobble: 0.4 }), roof, { mottle: 0.8 });
      b.line([[0.04, 1.1], [2.36, 1.1]], P.teal, 0.04, { wobble: 0.2 });
      b.paint(b.poly([[0.42, 0.88], [1.2, 0.12], [1.98, 0.88]], { wobble: 0.4 }), roof, { mottle: 0.8 });
      b.paint(b.poly([[0.66, 0.84], [1.2, 0.32], [1.74, 0.84]], { wobble: 0.3 }), P.gold, { mottle: 0.7, light: 0.3 });
      b.paint(b.poly([[0.86, 0.8], [1.2, 0.48], [1.54, 0.8]], { wobble: 0.3 }), mix(P.plum, P.night, 0.3), { mottle: 0.4 });
      b.flat(b.circle(1.2, 0.68, 0.05, 0.3), P.gold);
      b.line([[0.36, 0.9], [1.2, 0.1], [2.04, 0.9]], P.gold, 0.045, { wobble: 0.2 });
      b.line([[1.2, 0.12], [1.25, 0.02], [1.33, 0.0]], P.gold, 0.035, { wobble: 0 });
      b.line([[0.38, 0.9], [0.3, 0.84], [0.28, 0.76]], P.gold, 0.03, { wobble: 0 });
      b.line([[2.02, 0.9], [2.1, 0.84], [2.12, 0.76]], P.gold, 0.03, { wobble: 0 });

      const garland = sag(0.26, 1.16, 2.14, 1.16, 0.12, 18);
      b.line(garland, P.inkSoft, 0.008, { alpha: 0.7, wobble: 0.2 });
      const colors = [P.pink, P.butter, P.skyLight, P.lilac];
      for (let i = 2, k = 0; i < garland.length - 1; i += 3, k++) globe(b, garland[i][0], garland[i][1] + 0.06, 0.055, colors[k % 4]);
      b.paint(b.rect(0.86, 1.3, 0.68, 0.22, 0.04, 0.3), P.night, { mottle: 0.4, rim: 0.1 });
      b.stroke(b.rect(0.86, 1.3, 0.68, 0.22, 0.04, 0.3), P.gold, 0.015, 0.9);
      b.text('อร่อย', 1.2, 1.41, 0.1, P.butter, { weight: 700, maxWidth: 0.6 });
    },
  },

  'market-arch': {
    w: 2.6,
    h: 2.1,
    paint(b) {
      for (const x of [0.1, 2.38]) {
        b.paint(b.rect(x, 0.4, 0.12, 1.7, 0.03, 0.4), P.ember, { mottle: 0.6 });
        b.paint(b.rect(x - 0.03, 1.96, 0.18, 0.14, 0.03, 0.3), P.gold, { mottle: 0.4 });
        b.paint(b.rect(x - 0.02, 0.62, 0.16, 0.06, 0.02, 0.2), P.gold, { mottle: 0.3, rim: 0 });
      }
      const bunting = sag(0.2, 0.78, 2.42, 0.78, 0.16, 14);
      b.line(bunting, P.inkSoft, 0.008, { alpha: 0.7, wobble: 0.2 });
      const flags = [P.ember, P.butter, P.teal, P.pink, P.orange, P.plum];
      for (let i = 1; i < bunting.length - 1; i++) {
        const [x, y] = bunting[i];
        b.paint(b.poly([[x - 0.055, y], [x + 0.055, y], [x, y + 0.13]], { wobble: 0.2 }), flags[i % flags.length], { mottle: 0.3, rim: 0.1 });
      }
      const garland = sag(0.22, 0.96, 2.4, 0.96, 0.22, 18);
      b.line(garland, P.inkSoft, 0.008, { alpha: 0.7, wobble: 0.2 });
      const colors = [P.pink, P.butter, P.skyLight, P.lilac];
      for (let i = 2, k = 0; i < garland.length - 1; i += 2, k++) globe(b, garland[i][0], garland[i][1] + 0.07, 0.06, colors[k % 4]);

      const top: Pt[] = [];
      const bottom: Pt[] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        top.push([t * 2.6, 0.42 - Math.sin(Math.PI * t) * 0.3]);
        bottom.push([t * 2.6, 0.7 - Math.sin(Math.PI * t) * 0.14]);
      }
      const board = b.poly([...top, ...bottom.reverse()], { wobble: 0.4 });
      b.paint(board, P.plum, { mottle: 0.8, light: 0.25 });
      b.stroke(board, P.gold, 0.035, 0.95);
      b.text('ตลาดนัด', 1.3, 0.4, 0.17, P.butter, { weight: 700, maxWidth: 1.6 });
      for (let i = 1; i < top.length - 1; i += 2) bulb(b, top[i][0], top[i][1] - 0.01, 0.02, BULB_COLORS[i % 4]);
    },
  },

  'stall-wok': stall({
    awning: [P.ember, P.cream],
    counter: P.teal,
    sign: 'ผัดไทย',
    signColor: P.ember,
    hang(b) {
      for (const [x, len] of [[1.45, 0.3], [1.6, 0.24], [1.75, 0.34]] as Pt[]) {
        b.line([[x, 0.32], [x, 0.32 + len]], P.stone, 0.015, { wobble: 0 });
        b.paint(b.ellipse(x, 0.34 + len, 0.045, 0.03, 0.2), P.stone, { rim: 0.2, mottle: 0.2 });
      }
    },
    goods(b) {
      const cx = 0.72;
      b.paint(b.poly([[cx - 0.24, 0.98], [cx - 0.17, 0.82], [cx - 0.09, 0.9], [cx, 0.76], [cx + 0.09, 0.9], [cx + 0.17, 0.82], [cx + 0.24, 0.98]], { smooth: true, wobble: 0.5 }), P.orange, { mottle: 0.5, light: 0.5, shadow: 0, rim: 0 });
      b.glow(cx, 0.88, 0.32, P.butter, 0.65);
      const wok: Pt[] = [];
      for (let i = 0; i <= 14; i++) {
        const a = (i / 14) * Math.PI;
        wok.push([cx + Math.cos(a) * 0.36, 0.68 + Math.sin(a) * 0.14]);
      }
      b.paint(b.poly(wok, { wobble: 0.3 }), P.charcoal, { mottle: 0.4, light: 0.2 });
      for (const [dx, c] of [[-0.2, P.leaf], [-0.08, P.orange], [0.05, P.leaf], [0.16, P.ember], [-0.14, P.butter], [0.1, P.butter]] as [number, string][]) {
        b.flat(b.circle(cx + dx, 0.66 + Math.abs(dx) * 0.05, 0.03, 0.3), c);
      }
      b.line([[cx + 0.36, 0.7], [cx + 0.6, 0.62]], P.woodDeep, 0.03, { wobble: 0 });
      for (const d of [-1, 1]) b.line([[cx + d * 0.08, 0.6], [cx + d * 0.14, 0.46], [cx + d * 0.06, 0.32]], P.white, 0.03, { alpha: 0.35 });
      b.paint(b.rect(1.2, 0.66, 0.4, 0.32, 0.04, 0.3), P.stone, { mottle: 0.5, light: 0.3 });
      b.paint(b.ellipse(1.4, 0.66, 0.21, 0.04, 0.2), shade(P.stone, 0.3), { rim: 0.1 });
      b.line([[1.4, 0.6], [1.36, 0.46], [1.42, 0.34]], P.white, 0.03, { alpha: 0.35 });
      for (const [x, c] of [[1.7, P.ember], [1.8, P.butter], [1.9, P.leaf]] as [number, string][]) {
        b.paint(b.rect(x - 0.035, 0.74, 0.07, 0.24, 0.025, 0.2), c, { mottle: 0.3, rim: 0.15 });
        b.flat(b.rect(x - 0.015, 0.7, 0.03, 0.05, 0.01, 0), P.charcoal);
      }
    },
  }),

  'stall-fruit': stall({
    awning: [P.orange, P.cream],
    counter: P.plum,
    sign: 'ผลไม้',
    signColor: P.plum,
    goods(b) {
      b.paint(b.rect(0.2, 0.9, 1.7, 0.06, 0.02, 0.3), P.wood, { mottle: 0.3 });
      for (const [x, y] of [[0.32, 0.86], [0.5, 0.86], [0.68, 0.86], [0.41, 0.72], [0.59, 0.72]] as Pt[]) dragonFruit(b, x, y);
      for (const [x, y] of [[0.88, 0.88], [0.98, 0.88], [1.08, 0.88], [1.18, 0.88], [0.93, 0.8], [1.03, 0.8], [1.13, 0.8], [0.98, 0.72], [1.08, 0.72]] as Pt[]) rambutan(b, x, y);
      for (const [x, y] of [[1.34, 0.89], [1.46, 0.89], [1.58, 0.89], [1.4, 0.8], [1.52, 0.8], [1.46, 0.71]] as Pt[]) mangosteen(b, x, y);
      b.paint(b.rect(1.72, 0.72, 0.2, 0.2, 0.08, 0.3), P.ember, { mottle: 0.3 });
      b.paint(b.circle(1.82, 0.8, 0.07, 0.2), P.cream, { rim: 0.15, mottle: 0.1 });
      b.line([[1.82, 0.8], [1.86, 0.76]], P.ink, 0.01, { wobble: 0 });
      b.paint(b.ellipse(1.82, 0.69, 0.13, 0.03, 0.2), P.stone, { rim: 0.15 });
      for (const [x, label] of [[0.5, '฿20'], [1.03, '฿30']] as [number, string][]) {
        b.paint(b.rect(x - 0.09, 0.56, 0.18, 0.09, 0.02, 0.2), P.cream, { mottle: 0.1, rim: 0.1 });
        b.text(label, x, 0.605, 0.045, P.ink, { weight: 700 });
      }
    },
  }),

  'stall-sweets': stall({
    awning: [P.pink, P.white],
    counter: P.skyDeep,
    sign: 'ขนม',
    signColor: P.magenta,
    hang(b) {
      const bags = [P.butter, P.mint, P.pink, P.skyLight];
      for (let i = 0; i < 4; i++) {
        const x = 0.4 + i * 0.12;
        b.line([[x, 0.32], [x, 0.4]], P.inkSoft, 0.008, { wobble: 0 });
        b.paint(b.rect(x - 0.045, 0.4, 0.09, 0.14, 0.02, 0.3), bags[i], { alpha: 0.85, mottle: 0.3, rim: 0.15 });
      }
    },
    goods(b) {
      const candy = [P.rose, P.butter, P.mint, P.skyLight, P.orange];
      const lids = [P.rose, P.teal, P.butter, P.plum];
      for (let i = 0; i < 4; i++) {
        const x = 0.28 + i * 0.22;
        const jar = b.rect(x, 0.66, 0.17, 0.3, 0.05, 0.3);
        b.paint(jar, P.skyPale, { alpha: 0.6, mottle: 0.2, rim: 0.2 });
        b.ctx.save();
        b.ctx.clip(jar.path);
        for (let k = 0; k < 16; k++) b.flat(b.circle(x + 0.02 + b.rng() * 0.13, 0.76 + b.rng() * 0.2, 0.025, 0.2), candy[(k + i) % candy.length]);
        b.ctx.restore();
        b.paint(b.rect(x - 0.01, 0.62, 0.19, 0.05, 0.02, 0.2), lids[i], { mottle: 0.3, rim: 0.1 });
        b.glow(x + 0.05, 0.72, 0.05, '#ffffff', 0.5);
      }
      b.paint(b.rect(1.22, 0.92, 0.66, 0.05, 0.02, 0.3), P.stone, { mottle: 0.3 });
      for (let j = 0; j < 4; j++) {
        const x = 1.26 + j * 0.155;
        b.paint(b.rect(x, 0.78, 0.12, 0.14, 0.02, 0.2), P.pink, { mottle: 0.3, rim: 0.1 });
        for (const [y, c] of [[0.81, P.mint], [0.85, P.cream], [0.89, P.mint]] as [number, string][]) b.line([[x + 0.01, y], [x + 0.11, y]], c, 0.014, { wobble: 0, alpha: 0.9 });
      }
    },
  }),

  'stall-souvenir': stall({
    awning: [P.plum, P.butter],
    counter: P.rose,
    sign: 'ของฝาก',
    signColor: P.plum,
    hang(b) {
      const cloths = [P.teal, P.magenta, P.butter, P.skyLight, P.orange];
      b.line([[0.14, 0.36], [1.96, 0.36]], P.woodDeep, 0.02, { wobble: 0 });
      for (let i = 0; i < 5; i++) {
        const x = 0.22 + i * 0.35;
        const c = cloths[i];
        const cloth = b.rect(x, 0.36, 0.26, 0.5, 0.02, 0.5);
        b.paint(cloth, c, { mottle: 0.5, rim: 0.12 });
        b.ctx.save();
        b.ctx.clip(cloth.path);
        for (let y = 0.44; y < 0.86; y += 0.09) {
          b.line([[x, y], [x + 0.065, y - 0.03], [x + 0.13, y], [x + 0.195, y - 0.03], [x + 0.26, y]], shade(c, 0.45), 0.012, { alpha: 0.8, wobble: 0 });
          b.flat(b.circle(x + 0.13, y + 0.04, 0.014, 0), shade(c, -0.3), 0.7);
        }
        b.ctx.restore();
      }
    },
    goods(b) {
      elephant(b, 0.45, 0.98, 0.32, P.stone);
      elephant(b, 0.9, 0.98, 0.26, P.lilac);
      elephant(b, 1.3, 0.98, 0.3, P.peach);
      for (const [x, c] of [[1.62, P.teal], [1.74, P.gold], [1.86, P.magenta]] as [number, string][]) {
        b.paint(b.ellipse(x, 0.92, 0.06, 0.05, 0.2), c, { mottle: 0.2, rim: 0.2 });
        b.flat(b.ellipse(x, 0.92, 0.035, 0.028, 0.1), STALL_BACK);
      }
    },
  }),

  'food-cart': {
    w: CART_W,
    h: CART_H,
    paint(b) {
      cart(b, {
        canopy: [P.butter, P.rose, P.butter, P.rose, P.butter, P.rose],
        body: P.teal,
        sign: 'โรตี',
        goods(b) {
          const glass = b.rect(0.2, 0.62, 1.16, 0.36, 0.03, 0.3);
          b.paint(glass, P.skyPale, { alpha: 0.55, mottle: 0.2, rim: 0.25 });
          for (let i = 0; i < 4; i++) b.paint(b.ellipse(0.42, 0.92 - i * 0.04, 0.15, 0.03, 0.2), P.cream, { mottle: 0.2, rim: 0.15 });
          for (const x of [0.86, 0.98, 1.1]) b.paint(b.rect(x, 0.82, 0.08, 0.14, 0.02, 0.2), P.skyLight, { mottle: 0.2, rim: 0.15 });
          b.paint(b.rect(1.2, 0.86, 0.1, 0.1, 0.03, 0.2), P.butter, { rim: 0.15 });
          b.glow(0.5, 0.72, 0.1, '#ffffff', 0.45);
          b.line([[0.3, 0.94], [0.26, 0.84]], P.white, 0.02, { alpha: 0.35 });
        },
      });
    },
  },

  'ice-cream-cart': {
    w: CART_W,
    h: CART_H,
    paint(b) {
      cart(b, {
        canopy: [P.skyLight, P.cream, P.skyLight, P.cream, P.skyLight, P.cream],
        body: P.magenta,
        sign: 'ไอติม',
        goods(b) {
          for (const [x, c] of [[0.24, P.pink], [0.56, P.mint], [0.88, P.butter]] as [number, string][]) {
            b.paint(b.rect(x, 0.8, 0.26, 0.17, 0.03, 0.3), P.cream, { mottle: 0.3, rim: 0.15 });
            b.paint(b.ellipse(x + 0.13, 0.8, 0.12, 0.07, 0.4), c, { mottle: 0.4, rim: 0.15 });
            b.flat(b.circle(x + 0.1, 0.77, 0.018, 0), '#ffffff');
          }
          for (const x of [1.24, 1.34]) {
            b.paint(b.poly([[x - 0.045, 0.8], [x + 0.045, 0.8], [x, 0.96]], { wobble: 0.2 }), P.apricot, { mottle: 0.3, rim: 0.2 });
            b.paint(b.circle(x, 0.78, 0.045, 0.3), x < 1.3 ? P.pink : P.mint, { rim: 0.15 });
          }
        },
      });
    },
  },

  'market-umbrella': {
    w: 1.7,
    h: 1.6,
    paint(b) {
      b.paint(b.rect(0.83, 0.42, 0.04, 1.16, 0.02, 0.1), P.cream, { mottle: 0.2, rim: 0.15 });
      canopy(b, 0.85, 0.5, 0.06, 0.82, [P.orange, P.butter, P.orange, P.butter, P.orange, P.butter, P.orange, P.butter]);
      for (let x = 0.12; x < 1.62; x += 0.15) bulb(b, x, 0.58, 0.016, BULB_COLORS[Math.round(x * 7) % 4]);
      b.glow(0.85, 0.7, 0.45, P.butter, 0.45);
      b.paint(b.rect(0.82, 1.2, 0.06, 0.38, 0.02, 0.1), P.stone, { mottle: 0.2 });
      b.paint(b.ellipse(0.85, 1.58, 0.16, 0.03, 0.2), P.stone, { rim: 0.1 });
      b.paint(b.ellipse(0.85, 1.18, 0.42, 0.07, 0.3), P.cream, { mottle: 0.3, rim: 0.15 });
      stool(b, 0.3, 1.6, 0.42, P.ember);
      stool(b, 1.4, 1.6, 0.42, P.skyDeep);
    },
  },

  'potted-palm': {
    w: 1.3,
    h: 1.75,
    paint(b) {
      const fronds: [number, number, number][] = [[-1.2, 0.55, 0], [1.2, 0.55, 1], [-0.8, 0.7, 1], [0.8, 0.7, 0], [-0.35, 0.85, 0], [0.35, 0.85, 1], [0, 0.95, 0]];
      const greens = [mix(P.leaf, P.night, 0.15), mix(P.leafDeep, P.night, 0.2)];
      for (const [a, len, c] of fronds) {
        const bx = 0.65;
        const by = 1.32;
        const tip: Pt = [bx + Math.sin(a) * len, by - Math.cos(a) * len * 1.05 + Math.abs(a) * 0.18];
        const mid: Pt = [bx + Math.sin(a) * len * 0.45, by - Math.cos(a) * len * 0.8];
        b.line([[bx, by], mid, tip], greens[c], 0.022, { wobble: 0.1 });
        for (let t = 0.2; t < 0.95; t += 0.08) {
          const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mid[0] + t * t * tip[0];
          const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * mid[1] + t * t * tip[1];
          const l = 0.16 * (1 - t * 0.7);
          b.line([[x, y], [x - l * 0.7, y + l * 0.5]], greens[c], 0.016, { wobble: 0 });
          b.line([[x, y], [x + l * 0.7, y + l * 0.5]], greens[1 - c], 0.016, { wobble: 0 });
        }
      }
      for (const [x, y, c] of [[0.4, 0.8, P.butter], [0.85, 0.7, P.pink], [0.62, 0.55, P.skyLight], [0.3, 1.05, P.apricot], [1.0, 1.0, P.butter]] as [number, number, string][]) bulb(b, x, y, 0.02, c);
      const pot = b.poly([[0.38, 1.3], [0.92, 1.3], [0.84, 1.75], [0.46, 1.75]], { wobble: 0.4 });
      b.paint(pot, P.skyDeep, { mottle: 0.8 });
      b.paint(b.rect(0.34, 1.26, 0.62, 0.08, 0.03, 0.3), shade(P.skyDeep, 0.3), { mottle: 0.3 });
      b.line([[0.44, 1.5], [0.54, 1.46], [0.64, 1.5], [0.74, 1.46], [0.86, 1.5]], P.white, 0.016, { alpha: 0.75, wobble: 0.1 });
    },
  },

  'tropical-plant': {
    w: 1.2,
    h: 1.3,
    paint(b) {
      const leaves: [number, number, number, number][] = [[0.28, 0.5, 0.22, -0.6], [0.92, 0.48, 0.22, 0.6], [0.6, 0.3, 0.26, 0], [0.42, 0.72, 0.2, -0.9], [0.8, 0.74, 0.2, 0.9]];
      for (const [x, y, r] of leaves) b.line([[0.6, 1.0], [x, y + r * 0.6]], mix(P.leafDeep, P.night, 0.2), 0.022, { wobble: 0.2 });
      for (const [x, y, r, a] of leaves) {
        const c = mix(P.leaf, P.night, 0.15);
        const leaf = b.ellipse(x, y, r, r * 0.82, 0.6, a);
        b.paint(leaf, c, { mottle: 0.7, light: 0.25, rim: 0.2 });
        for (const s of [-1, 1]) {
          for (const k of [0.35, 0.65]) {
            const ang = a - Math.PI / 2 + s * (0.9 + k * 0.4);
            b.line([[x + Math.cos(ang) * r * 0.45, y + Math.sin(ang) * r * 0.45], [x + Math.cos(ang) * r * 1.02, y + Math.sin(ang) * r * 1.02]], shade(c, -0.3), 0.018, { alpha: 0.8, wobble: 0 });
          }
        }
        b.line([[x - Math.sin(a) * r * 0.9, y + Math.cos(a) * r * 0.9], [x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9]], shade(c, 0.25), 0.01, { alpha: 0.7, wobble: 0 });
      }
      const box = b.rect(0.14, 0.98, 0.92, 0.32, 0.03, 0.4);
      b.paint(box, P.wood, { mottle: 0.8 });
      for (const y of [1.08, 1.18]) b.line([[0.16, y], [1.04, y]], P.woodDeep, 0.01, { alpha: 0.5, wobble: 0 });
    },
  },

  'sign-board': {
    w: 0.62,
    h: 0.8,
    paint(b) {
      b.line([[0.12, 0.1], [0.04, 0.8]], P.woodDeep, 0.035, { wobble: 0 });
      b.line([[0.5, 0.1], [0.58, 0.8]], P.woodDeep, 0.035, { wobble: 0 });
      const board = b.rect(0.06, 0.06, 0.5, 0.54, 0.04, 0.3);
      b.paint(board, mix(P.night, P.charcoal, 0.4), { mottle: 0.6, light: 0.15 });
      b.stroke(board, P.wood, 0.03);
      b.text('อร่อย', 0.31, 0.24, 0.07, P.butter, { weight: 700, maxWidth: 0.42 });
      b.text('♥', 0.31, 0.42, 0.08, P.pink, { weight: 700 });
      for (const [x, y] of [[0.14, 0.42], [0.48, 0.38], [0.44, 0.52]] as Pt[]) b.text('✦', x, y, 0.035, P.skyLight, { weight: 400 });
      for (let x = 0.1; x < 0.56; x += 0.09) bulb(b, x, 0.05, 0.014, BULB_COLORS[Math.round(x * 11) % 4]);
    },
  },

  shopper: {
    w: 0.66,
    h: 1.25,
    paint(b) {
      const skirt = P.magenta;
      b.line([[0.28, 1.0], [0.24, 1.2]], SKIN, 0.05);
      b.line([[0.38, 1.0], [0.43, 1.2]], SKIN, 0.05);
      b.paint(b.ellipse(0.22, 1.21, 0.06, 0.03, 0.2), P.ink, { rim: 0 });
      b.paint(b.ellipse(0.46, 1.21, 0.06, 0.03, 0.2), P.ink, { rim: 0 });
      b.line([[0.42, 0.42], [0.5, 0.64]], SKIN, 0.055);
      const dress = b.poly([[0.18, 0.62], [0.46, 0.62], [0.54, 1.06], [0.12, 1.06]], { smooth: true, wobble: 0.4 });
      b.paint(dress, skirt, { mottle: 0.6 });
      b.speckle(dress, P.cream, 26, 0.012, 0.8);
      b.paint(b.poly([[0.2, 0.36], [0.44, 0.36], [0.48, 0.66], [0.16, 0.66]], { smooth: true, wobble: 0.3 }), P.butter, { mottle: 0.4 });
      b.line([[0.24, 0.38], [0.12, 0.62]], P.teal, 0.02, { wobble: 0 });
      const bag = b.rect(0.02, 0.6, 0.2, 0.24, 0.03, 0.3);
      b.paint(bag, P.teal, { mottle: 0.5 });
      for (const y of [0.66, 0.74]) b.line([[0.03, y], [0.21, y]], P.cream, 0.015, { alpha: 0.8, wobble: 0 });
      b.line([[0.22, 0.4], [0.14, 0.62]], P.butter, 0.06);
      b.paint(b.circle(0.32, 0.24, 0.12, 0.3), SKIN, { mottle: 0.3, rim: 0.12 });
      b.paint(b.ellipse(0.3, 0.16, 0.13, 0.07, 0.3), P.charcoal, { mottle: 0.3 });
      b.paint(b.circle(0.2, 0.18, 0.06, 0.3), P.charcoal, { mottle: 0.2 });
      b.paint(b.circle(0.4, 0.13, 0.03, 0.2), P.pink, { rim: 0 });
      b.flat(b.circle(0.37, 0.24, 0.014, 0), P.ink);
      b.glow(0.39, 0.29, 0.035, P.rose, 0.5);
    },
  },

  'shopper-kid': {
    w: 0.72,
    h: 1.2,
    paint(b) {
      b.line([[0.2, 0.36], [0.26, 0.55], [0.32, 0.74]], P.inkSoft, 0.008, { wobble: 0.3 });
      b.paint(b.ellipse(0.2, 0.2, 0.14, 0.17, 0.3), P.skyLight, { mottle: 0.4, light: 0.4, rim: 0.15 });
      b.glow(0.15, 0.13, 0.05, '#ffffff', 0.6);
      b.paint(b.poly([[0.18, 0.37], [0.22, 0.37], [0.2, 0.4]], { wobble: 0 }), P.skyLight, { rim: 0 });
      b.line([[0.42, 0.98], [0.4, 1.16]], SKIN, 0.05);
      b.line([[0.52, 0.98], [0.54, 1.16]], SKIN, 0.05);
      b.paint(b.ellipse(0.38, 1.17, 0.05, 0.025, 0.2), P.ember, { rim: 0 });
      b.paint(b.ellipse(0.56, 1.17, 0.05, 0.025, 0.2), P.ember, { rim: 0 });
      b.paint(b.rect(0.36, 0.88, 0.22, 0.12, 0.03, 0.3), P.skyDeep, { mottle: 0.3 });
      b.paint(b.poly([[0.36, 0.7], [0.58, 0.7], [0.6, 0.92], [0.34, 0.92]], { smooth: true, wobble: 0.3 }), P.orange, { mottle: 0.4 });
      b.line([[0.38, 0.74], [0.32, 0.74]], SKIN, 0.045);
      b.line([[0.56, 0.74], [0.6, 0.88]], SKIN, 0.045);
      b.paint(b.circle(0.47, 0.58, 0.12, 0.3), SKIN, { mottle: 0.3, rim: 0.12 });
      b.paint(b.ellipse(0.47, 0.5, 0.13, 0.06, 0.3), P.woodDeep, { mottle: 0.3 });
      b.face(0.47, 0.59, 0.045, 0.014);
    },
  },

  'sky-lantern': {
    w: 0.42,
    h: 0.6,
    paint(b) {
      b.glow(0.21, 0.32, 0.42, P.apricot, 0.5);
      const body = b.poly([[0.06, 0.1], [0.12, 0.03], [0.3, 0.03], [0.36, 0.1], [0.32, 0.5], [0.1, 0.5]], { smooth: true, wobble: 0.3 });
      b.paint(body, P.butter, { mottle: 0.6, light: 0.5, shadow: 0.1 });
      b.ctx.save();
      b.ctx.clip(body.path);
      b.glow(0.21, 0.46, 0.2, '#fff6d8', 0.8);
      b.ctx.restore();
      b.line([[0.1, 0.5], [0.21, 0.55]], P.woodDeep, 0.008, { wobble: 0 });
      b.line([[0.32, 0.5], [0.21, 0.55]], P.woodDeep, 0.008, { wobble: 0 });
      b.glow(0.21, 0.55, 0.08, P.orange, 0.8);
      b.flat(b.ellipse(0.21, 0.55, 0.03, 0.025, 0.2), P.orange);
    },
  },
};
