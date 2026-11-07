import type { Brush } from '../paint/brush';
import { P, mix, shade } from '../paint/color';
import { type PainterMap, person, ripple, wheel } from './common';

type Pt = [number, number];

const WATER = mix(P.skyLight, P.sage, 0.35);
const RICE = '#9fd07f';
const STRAW = '#ecc978';
const STRAW_DEEP = '#cf9f55';
const MUD = '#a7806a';
const SKIN = '#d9a07c';

/** A pointed leaf from (x, y) at `angle` from vertical (0 = straight up). */
function leaf(b: Brush, x: number, y: number, angle: number, len: number, width: number, color: string) {
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const at = (t: number, s: number): Pt => [x + dx * len * t - dy * width * s, y + dy * len * t + dx * width * s];
  b.paint(
    b.poly([at(0, 0.3), at(0.2, 0.8), at(0.5, 1), at(0.8, 0.6), at(1, 0), at(0.8, -0.6), at(0.5, -1), at(0.2, -0.8), at(0, -0.3)], { wobble: 0.3 }),
    color,
    { mottle: 0.5, rim: 0.12, shadow: 0.15 },
  );
  b.line([at(0.05, 0), at(0.85, 0)], shade(color, -0.25), width * 0.15, { alpha: 0.55, wobble: 0 });
}

/** Palm frond: a drooping spine with leaflets combed out on both sides. */
function frond(b: Brush, x: number, y: number, angle: number, len: number, color: string) {
  const n = 9;
  const spine: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    spine.push([x + Math.sin(angle) * len * t, y - Math.cos(angle) * len * t + t * t * len * 0.45]);
  }
  for (let i = 1; i < n; i++) {
    const [sx, sy] = spine[i];
    const w = (1 - i / n) * 0.2 + 0.05;
    for (const s of [-1, 1]) {
      const a = angle + s * 0.75;
      b.line([[sx, sy], [sx + Math.sin(a) * w, sy - Math.cos(a) * w + w * 0.5]], i % 2 ? color : shade(color, -0.12), 0.035, { wobble: 0.2 });
    }
  }
  b.line(spine, shade(color, -0.25), 0.025, { wobble: 0.2 });
}

export const paddyPainters: PainterMap = {
  // --- Crops -------------------------------------------------------------

  rice: {
    w: 1.0,
    h: 1.05,
    paint(b) {
      ripple(b, 0.5, 0.97, 0.47, 0.07, WATER);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const x = 0.4 + t * 0.2;
        const lean = (t - 0.5) * 1.1 + (b.rng() - 0.5) * 0.2;
        const top = 0.22 + b.rng() * 0.2;
        b.line([[x, 0.97], [x + lean * 0.12, 0.62], [x + lean * 0.42, top]], [P.leafDeep, P.leaf, RICE][i % 3], 0.028, { wobble: 0.3 });
      }
      // Heads of ripening grain bowing over.
      for (const [x, y, dir] of [[0.22, 0.32, -1], [0.42, 0.2, -1], [0.58, 0.18, 1], [0.78, 0.3, 1]] as [number, number, number][]) {
        const pts = Array.from({ length: 6 }, (_, k): Pt => [x + dir * k * 0.03, y + k * k * 0.007]);
        b.line(pts, STRAW_DEEP, 0.012, { wobble: 0 });
        for (const [px, py] of pts.slice(1)) b.paint(b.ellipse(px, py + 0.012, 0.016, 0.026, 0.2, dir * 0.4), STRAW, { mottle: 0.3, rim: 0.12 });
      }
    },
  },

  corn: {
    w: 1.0,
    h: 1.7,
    paint(b) {
      for (const [x, top, c] of [[0.38, 0.32, P.leafDeep], [0.64, 0.16, P.leaf]] as [number, number, string][]) {
        b.line([[x, 1.7], [x + 0.01, top]], c, 0.05, { wobble: 0.2 });
        for (let k = 0; k < 5; k++) {
          const y = 1.5 - k * 0.24;
          if (y < top + 0.12) break;
          const side = k % 2 ? 1 : -1;
          leaf(b, x, y, side * (1.15 + (k % 3) * 0.2), 0.32, 0.045, k % 2 ? P.leaf : P.leafDeep);
        }
        for (let i = -2; i <= 2; i++) b.line([[x + 0.01, top], [x + i * 0.04, top - 0.12 + Math.abs(i) * 0.03]], STRAW_DEEP, 0.012, { wobble: 0.2 });
      }
      const ear = (x: number, y: number, a: number) => {
        const cob = b.ellipse(x, y, 0.06, 0.16, 0.3, a);
        b.paint(cob, P.yellow, { mottle: 0.4, light: 0.35 });
        b.speckle(cob, P.butter, 26, 0.012, 0.8);
        leaf(b, x - 0.02, y + 0.14, a - 0.35, 0.26, 0.05, mix(P.leaf, P.butter, 0.3));
        leaf(b, x + 0.02, y + 0.14, a + 0.3, 0.24, 0.045, mix(P.leaf, P.butter, 0.15));
        b.line([[x + Math.sin(a) * 0.15, y - 0.15], [x + Math.sin(a) * 0.22, y - 0.2]], STRAW_DEEP, 0.014);
      };
      ear(0.48, 0.84, 0.4);
      ear(0.74, 0.62, 0.4);
    },
  },

  pumpkin: {
    w: 0.9,
    h: 0.66,
    paint(b) {
      b.line([[0.04, 0.62], [0.16, 0.56], [0.3, 0.6]], P.leafDeep, 0.016);
      leaf(b, 0.14, 0.58, -1.1, 0.2, 0.08, P.leafDeep);
      for (const [dx, rx, sh] of [[-0.17, 0.16, -0.12], [0.17, 0.16, -0.12], [-0.08, 0.17, 0], [0.08, 0.17, 0], [0, 0.15, 0.12]] as [number, number, number][]) {
        b.paint(b.ellipse(0.5 + dx, 0.42, rx, 0.22, 0.4), shade(P.orange, sh), { mottle: 0.5, light: 0.3, rim: 0.12 });
      }
      b.paint(b.poly([[0.47, 0.23], [0.45, 0.12], [0.51, 0.08], [0.53, 0.23]], { wobble: 0.2 }), P.woodDeep, { rim: 0.1 });
      b.line([[0.52, 0.13], [0.6, 0.07], [0.66, 0.1], [0.63, 0.15]], P.leafDeep, 0.012, { wobble: 0 });
      b.glow(0.42, 0.32, 0.08, '#ffffff', 0.35);
    },
  },

  sunflower: {
    w: 0.72,
    h: 1.65,
    paint(b) {
      b.line([[0.38, 1.65], [0.35, 1.0], [0.37, 0.45]], P.leafDeep, 0.045, { wobble: 0.3 });
      leaf(b, 0.36, 1.18, -1.2, 0.3, 0.1, P.leaf);
      leaf(b, 0.36, 0.88, 1.25, 0.28, 0.09, P.leafDeep);
      const cx = 0.36;
      const cy = 0.3;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        b.paint(b.ellipse(cx + Math.cos(a) * 0.17, cy + Math.sin(a) * 0.17, 0.1, 0.045, 0.3, a), i % 2 ? P.yellow : P.butter, { mottle: 0.3, rim: 0.12 });
      }
      b.paint(b.circle(cx, cy, 0.13, 0.3), P.woodDeep, { mottle: 0.5, light: 0.2 });
      b.speckle(b.circle(cx, cy, 0.11, 0.2), shade(P.woodDeep, -0.4), 40, 0.008, 0.8);
    },
  },

  flowers: {
    w: 1.1,
    h: 0.78,
    paint(b) {
      for (let i = 0; i < 9; i++) leaf(b, 0.15 + i * 0.1, 0.77, (i - 4) * 0.25, 0.24 + (i % 3) * 0.05, 0.045, i % 2 ? P.leaf : P.leafDeep);
      const blooms: [number, number, number, string][] = [
        [0.22, 0.42, 0.08, P.pink],
        [0.4, 0.3, 0.09, P.butter],
        [0.58, 0.42, 0.085, P.lavender],
        [0.76, 0.28, 0.08, P.rose],
        [0.92, 0.46, 0.07, P.white],
        [0.32, 0.56, 0.065, P.white],
        [0.68, 0.58, 0.07, P.pink],
      ];
      for (const [x, y] of blooms) b.line([[x, y], [x + 0.01, 0.77]], P.leafDeep, 0.014, { wobble: 0.3 });
      for (const [x, y, r, c] of blooms) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
          b.paint(b.circle(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, 0.3), c, { mottle: 0.3, rim: 0.12 });
        }
        b.paint(b.circle(x, y, r * 0.35, 0.2), c === P.butter ? P.orange : P.yellow, { rim: 0.1 });
      }
    },
  },

  bamboo: {
    w: 1.1,
    h: 2.4,
    paint(b) {
      const culms: [number, number, number, string][] = [
        [0.3, 0.38, 0.22, P.leafDeep],
        [0.78, 0.84, 0.3, P.leafDeep],
        [0.56, 0.6, 0.05, P.leaf],
        [0.44, 0.4, 0.5, mix(P.leaf, P.butter, 0.25)],
      ];
      const along = (x0: number, x1: number, top: number, y: number) => x0 + ((x1 - x0) * (2.4 - y)) / (2.4 - top);
      for (const [x0, x1, top, color] of culms) {
        const w = 0.065;
        b.paint(b.poly([[x0 - w / 2, 2.4], [x1 - w * 0.4, top], [x1 + w * 0.4, top], [x0 + w / 2, 2.4]], { wobble: 0.2 }), color, { mottle: 0.5, light: 0.3 });
        for (let y = top + 0.25; y < 2.35; y += 0.28) {
          const x = along(x0, x1, top, y);
          b.line([[x - w * 0.55, y], [x + w * 0.55, y]], shade(color, -0.3), 0.018, { wobble: 0 });
          b.line([[x - w * 0.45, y - 0.025], [x + w * 0.45, y - 0.025]], shade(color, 0.3), 0.01, { alpha: 0.7, wobble: 0 });
        }
      }
      for (const [x0, x1, top] of culms) {
        for (let k = 0; k < 4; k++) {
          const y = top + 0.12 + k * 0.3;
          const x = along(x0, x1, top, y);
          const side = (k + Math.round(x0 * 10)) % 2 ? 1 : -1;
          for (let j = 0; j < 3; j++) leaf(b, x, y, side * (1.5 + j * 0.35 + b.rng() * 0.2), 0.22 - j * 0.03, 0.04, j % 2 ? P.leafDeep : P.leaf);
        }
      }
    },
  },

  // --- Animals -------------------------------------------------------------

  'water-buffalo': {
    w: 1.75,
    h: 1.2,
    paint(b) {
      const hide = '#7f7a9f';
      const dark = shade(hide, -0.25);
      b.line([[0.3, 0.5], [0.22, 0.7], [0.24, 0.86]], dark, 0.035, { wobble: 0.2 });
      b.paint(b.ellipse(0.24, 0.9, 0.035, 0.06, 0.3), dark, { rim: 0 });
      for (const x of [0.48, 1.02]) b.paint(b.rect(x, 0.7, 0.12, 0.42, 0.05, 0.3), dark, { mottle: 0.3 });
      b.paint(b.ellipse(0.8, 0.6, 0.5, 0.28, 0.4), hide, { mottle: 0.6, light: 0.25 });
      b.paint(b.ellipse(0.84, 0.76, 0.34, 0.08, 0.3), shade(hide, 0.2), { rim: 0, alpha: 0.6 });
      for (const x of [0.36, 1.12]) b.paint(b.rect(x, 0.72, 0.13, 0.42, 0.05, 0.3), hide, { mottle: 0.3 });
      // Big swept-back horns, then the head.
      for (const pts of [[[1.3, 0.48], [1.14, 0.42], [1.06, 0.3], [1.12, 0.2]], [[1.46, 0.46], [1.6, 0.38], [1.66, 0.26], [1.6, 0.17]]] as Pt[][]) {
        b.line(pts, P.cream, 0.065, { wobble: 0 });
        b.line(pts.slice(2), shade(P.cream, -0.1), 0.04, { wobble: 0 });
      }
      b.paint(b.ellipse(1.22, 0.52, 0.11, 0.05, 0.3, 0.4), dark, { mottle: 0.3, rim: 0.1 });
      b.paint(b.ellipse(1.39, 0.64, 0.17, 0.2, 0.3, -0.25), hide, { mottle: 0.4 });
      b.paint(b.ellipse(1.48, 0.78, 0.12, 0.085, 0.3), shade(hide, 0.35), { mottle: 0.3, rim: 0.1 });
      for (const x of [1.45, 1.53]) b.flat(b.ellipse(x, 0.79, 0.014, 0.02, 0), P.ink);
      b.flat(b.ellipse(1.43, 0.6, 0.025, 0.03, 0.2), P.ink);
      b.flat(b.circle(1.44, 0.59, 0.009, 0), '#ffffff', 0.9);
      // A white egret hitching a ride.
      for (const x of [0.66, 0.7]) b.line([[x, 0.3], [x, 0.34]], P.yellow, 0.012, { wobble: 0 });
      b.paint(b.ellipse(0.66, 0.26, 0.09, 0.05, 0.3, -0.15), P.white, { mottle: 0.3, rim: 0.15 });
      b.line([[0.72, 0.24], [0.76, 0.16], [0.79, 0.12]], P.white, 0.026, { wobble: 0 });
      b.paint(b.circle(0.8, 0.11, 0.03, 0.2), P.white, { rim: 0.15 });
      b.line([[0.82, 0.11], [0.89, 0.12]], P.yellow, 0.012, { wobble: 0 });
      b.flat(b.circle(0.805, 0.1, 0.007, 0), P.ink);
      ripple(b, 0.86, 1.12, 0.8, 0.08, WATER);
    },
  },

  duck: {
    w: 0.78,
    h: 0.62,
    paint(b) {
      ripple(b, 0.38, 0.54, 0.36, 0.07, P.skyLight);
      b.paint(b.poly([[0.12, 0.42], [0.04, 0.28], [0.22, 0.36]], { wobble: 0.2 }), P.cream, { rim: 0.12 });
      b.paint(b.ellipse(0.34, 0.44, 0.26, 0.12, 0.3), P.white, { mottle: 0.4, shadow: 0.25 });
      b.paint(b.ellipse(0.3, 0.42, 0.14, 0.06, 0.3, -0.15), P.cream, { mottle: 0.3, rim: 0.15 });
      b.line([[0.52, 0.4], [0.55, 0.28]], P.white, 0.09, { wobble: 0 });
      b.paint(b.circle(0.56, 0.22, 0.09, 0.2), P.white, { mottle: 0.3, rim: 0.15 });
      b.paint(b.ellipse(0.68, 0.25, 0.07, 0.03, 0.2), P.orange, { rim: 0.1 });
      b.flat(b.circle(0.58, 0.2, 0.016, 0), P.ink);
      b.glow(0.56, 0.27, 0.03, P.rose, 0.4);
    },
  },

  chicken: {
    w: 0.66,
    h: 0.72,
    paint(b) {
      const feather = P.terracotta;
      for (const x of [0.28, 0.36]) b.line([[x, 0.52], [x, 0.68], [x + 0.04, 0.7]], P.orange, 0.02, { wobble: 0 });
      b.paint(b.poly([[0.16, 0.38], [0.04, 0.16], [0.12, 0.2], [0.14, 0.1], [0.22, 0.2], [0.26, 0.34]], { wobble: 0.3 }), shade(feather, -0.2), { mottle: 0.4 });
      b.paint(b.ellipse(0.32, 0.4, 0.2, 0.15, 0.4), feather, { mottle: 0.5, light: 0.3 });
      b.paint(b.ellipse(0.3, 0.4, 0.11, 0.07, 0.3, 0.2), shade(feather, -0.15), { mottle: 0.3, rim: 0.1 });
      b.paint(b.circle(0.48, 0.24, 0.085, 0.2), feather, { mottle: 0.3, rim: 0.1 });
      for (const [x, y] of [[0.44, 0.15], [0.48, 0.135], [0.52, 0.15]] as Pt[]) b.paint(b.circle(x, y, 0.028, 0.2), P.ember, { rim: 0 });
      b.paint(b.ellipse(0.54, 0.32, 0.02, 0.035, 0.2), P.ember, { rim: 0 });
      b.paint(b.poly([[0.555, 0.23], [0.62, 0.25], [0.555, 0.27]], { wobble: 0.1 }), P.yellow, { rim: 0 });
      b.flat(b.circle(0.5, 0.22, 0.014, 0), P.ink);
    },
  },

  pig: {
    w: 0.98,
    h: 0.7,
    paint(b) {
      const skin = P.pink;
      b.paint(b.ellipse(0.48, 0.64, 0.46, 0.06, 1), MUD, { mottle: 0.8, rim: 0, alpha: 0.85 });
      for (const x of [0.22, 0.6]) b.paint(b.rect(x, 0.46, 0.09, 0.2, 0.04, 0.2), shade(skin, -0.12), { mottle: 0.3 });
      b.line([[0.14, 0.36], [0.07, 0.33], [0.06, 0.26], [0.12, 0.25], [0.13, 0.3], [0.08, 0.31]], shade(skin, -0.1), 0.018, { wobble: 0 });
      b.paint(b.ellipse(0.44, 0.4, 0.32, 0.19, 0.4), skin, { mottle: 0.5, light: 0.3 });
      for (const x of [0.3, 0.68]) b.paint(b.rect(x, 0.48, 0.1, 0.19, 0.04, 0.2), skin, { mottle: 0.3 });
      for (const [x, y, rx, ry] of [[0.3, 0.44, 0.06, 0.04], [0.5, 0.52, 0.05, 0.03], [0.42, 0.3, 0.03, 0.02], [0.33, 0.64, 0.06, 0.03]] as [number, number, number, number][]) {
        b.paint(b.ellipse(x, y, rx, ry, 0.6), MUD, { mottle: 0.4, rim: 0, alpha: 0.85 });
      }
      b.paint(b.poly([[0.68, 0.26], [0.66, 0.12], [0.77, 0.21]], { wobble: 0.2 }), shade(skin, -0.12), { rim: 0.1 });
      b.paint(b.circle(0.76, 0.34, 0.15, 0.3), skin, { mottle: 0.4 });
      b.paint(b.ellipse(0.9, 0.38, 0.06, 0.07, 0.2), shade(skin, -0.12), { rim: 0.1 });
      for (const x of [0.885, 0.915]) b.flat(b.ellipse(x, 0.38, 0.009, 0.016, 0), P.raspberry);
      b.flat(b.circle(0.8, 0.3, 0.018, 0), P.ink);
      b.glow(0.8, 0.4, 0.04, P.rose, 0.45);
    },
  },

  frog: {
    w: 0.64,
    h: 0.52,
    paint(b) {
      const green = '#7cc46a';
      b.paint(b.ellipse(0.32, 0.45, 0.3, 0.065, 0.8), P.leaf, { mottle: 0.5, rim: 0.15 });
      b.line([[0.32, 0.45], [0.54, 0.41]], P.leafDeep, 0.012, { alpha: 0.7, wobble: 0 });
      for (const s of [-1, 1]) b.paint(b.ellipse(0.32 + s * 0.15, 0.38, 0.08, 0.05, 0.3, s * 0.3), shade(green, -0.15), { mottle: 0.3, rim: 0.1 });
      b.paint(b.ellipse(0.32, 0.31, 0.16, 0.12, 0.3), green, { mottle: 0.4, light: 0.3 });
      b.paint(b.ellipse(0.32, 0.36, 0.09, 0.06, 0.2), P.butter, { rim: 0, alpha: 0.8 });
      for (const s of [-1, 1]) {
        b.paint(b.ellipse(0.32 + s * 0.08, 0.42, 0.035, 0.018, 0.2), green, { rim: 0.1 });
        b.paint(b.circle(0.32 + s * 0.09, 0.19, 0.055, 0.2), green, { rim: 0.1 });
        b.flat(b.circle(0.32 + s * 0.09, 0.185, 0.036, 0), P.white);
        b.flat(b.circle(0.32 + s * 0.09 + 0.005, 0.19, 0.019, 0), P.ink);
      }
      b.line([[0.25, 0.28], [0.32, 0.31], [0.39, 0.28]], P.ink, 0.01, { wobble: 0 });
      for (const s of [-1, 1]) b.glow(0.32 + s * 0.12, 0.29, 0.03, P.rose, 0.45);
    },
  },

  butterfly: {
    w: 0.64,
    h: 0.52,
    paint(b) {
      for (const s of [-1, 1]) {
        b.paint(b.ellipse(0.32 + s * 0.15, 0.2, 0.14, 0.13, 0.4, s * 0.5), P.orange, { mottle: 0.5, light: 0.3 });
        b.paint(b.ellipse(0.32 + s * 0.11, 0.38, 0.09, 0.08, 0.4, -s * 0.4), P.yellow, { mottle: 0.4 });
        b.flat(b.circle(0.32 + s * 0.16, 0.19, 0.035, 0.2), P.white, 0.9);
        b.flat(b.circle(0.32 + s * 0.24, 0.12, 0.022, 0.2), P.charcoal, 0.8);
        b.flat(b.circle(0.32 + s * 0.12, 0.38, 0.025, 0.2), P.rose, 0.9);
        b.line([[0.32, 0.15], [0.32 + s * 0.05, 0.07], [0.32 + s * 0.08, 0.04]], P.charcoal, 0.01, { wobble: 0 });
        b.flat(b.circle(0.32 + s * 0.08, 0.04, 0.015, 0), P.charcoal);
      }
      b.paint(b.ellipse(0.32, 0.29, 0.03, 0.14, 0.2), P.charcoal, { rim: 0 });
    },
  },

  dragonfly: {
    w: 0.92,
    h: 0.52,
    paint(b) {
      const wing = (x: number, y: number, rx: number, ry: number, rot: number) => {
        const s = b.ellipse(x, y, rx, ry, 0.3, rot);
        b.paint(s, P.skyPale, { mottle: 0.3, light: 0.5, rim: 0.15, alpha: 0.75 });
        b.stroke(s, P.skyDeep, 0.008, 0.6);
      };
      wing(0.5, 0.14, 0.055, 0.14, -0.3);
      wing(0.66, 0.14, 0.055, 0.14, 0.3);
      wing(0.5, 0.38, 0.05, 0.12, 0.3);
      wing(0.66, 0.38, 0.05, 0.12, -0.3);
      b.line([[0.06, 0.27], [0.56, 0.26]], P.teal, 0.04, { wobble: 0 });
      for (let x = 0.12; x < 0.52; x += 0.06) b.line([[x, 0.25], [x, 0.28]], shade(P.teal, -0.3), 0.008, { wobble: 0 });
      b.paint(b.ellipse(0.6, 0.26, 0.06, 0.045, 0.2), shade(P.teal, -0.1), { mottle: 0.3, rim: 0.1 });
      b.paint(b.circle(0.69, 0.26, 0.04, 0.2), P.teal, { rim: 0.1 });
      for (const y of [0.225, 0.295]) b.paint(b.circle(0.72, y, 0.028, 0.2), P.skyDeep, { light: 0.4, rim: 0.1 });
    },
  },

  farmer: {
    w: 0.9,
    h: 1.38,
    paint(b) {
      const x = 0.45;
      const base = 1.36;
      const h = 1.1;
      const r = h * 0.12;
      const headY = base - h + r;
      person(b, x, base, h, { skin: SKIN, hair: P.charcoal, top: P.skyDeep, bottom: P.inkSoft, hands: [[0.24, 0.92], [0.68, 0.86]] });
      // A bundle of rice seedlings ready for planting.
      for (let i = 0; i < 7; i++) b.line([[0.68 + (i - 3) * 0.008, 0.9], [0.68 + (i - 3) * 0.03, 0.64 - (i % 2) * 0.05]], i % 2 ? P.leaf : RICE, 0.014, { wobble: 0.2 });
      for (let i = 0; i < 4; i++) b.line([[0.68 + (i - 1.5) * 0.008, 0.9], [0.68 + (i - 1.5) * 0.02, 0.98]], MUD, 0.008, { wobble: 0.3 });
      b.line([[0.66, 0.86], [0.7, 0.86]], STRAW_DEEP, 0.02, { wobble: 0 });
      // Conical straw hat.
      const left: Pt = [x - r * 2.3, headY - r * 0.35];
      const right: Pt = [x + r * 2.3, headY - r * 0.35];
      const apex: Pt = [x, headY - r * 2.4];
      b.paint(b.poly([left, apex, right], { wobble: 0.3 }), STRAW, { mottle: 0.5, light: 0.3 });
      for (const t of [0.35, 0.6, 0.85]) {
        const lerp = (p: Pt): Pt => [apex[0] + (p[0] - apex[0]) * t, apex[1] + (p[1] - apex[1]) * t];
        b.line([lerp(left), lerp(right)], STRAW_DEEP, 0.008, { alpha: 0.7, wobble: 0 });
      }
      b.paint(b.ellipse(x, headY - r * 0.35, r * 2.3, r * 0.2, 0.2), STRAW_DEEP, { rim: 0.1 });
      ripple(b, x, base - 0.03, 0.38, 0.05, WATER);
    },
  },

  scarecrow: {
    w: 1.05,
    h: 1.5,
    paint(b) {
      b.line([[0.52, 0.3], [0.53, 1.5]], P.woodDeep, 0.05, { wobble: 0 });
      b.line([[0.08, 0.62], [0.98, 0.6]], P.woodDeep, 0.04, { wobble: 0 });
      for (const [x, y, s] of [[0.14, 0.64, -1], [0.92, 0.62, 1]] as [number, number, number][]) {
        for (let i = 0; i < 5; i++) b.line([[x, y], [x + s * 0.1, y - 0.06 + i * 0.035]], i % 2 ? STRAW : STRAW_DEEP, 0.014, { wobble: 0.2 });
      }
      for (let i = 0; i < 8; i++) b.line([[0.38 + i * 0.04, 1.02], [0.37 + i * 0.042, 1.13 + (i % 2) * 0.03]], i % 2 ? STRAW : STRAW_DEEP, 0.014, { wobble: 0.2 });
      b.paint(b.poly([[0.16, 0.56], [0.88, 0.54], [0.9, 0.7], [0.72, 0.7], [0.7, 1.04], [0.36, 1.04], [0.34, 0.7], [0.16, 0.72]], { wobble: 0.5 }), P.skyDeep, { mottle: 0.6 });
      b.paint(b.rect(0.41, 0.78, 0.1, 0.1, 0.01, 0.4), P.butter, { mottle: 0.3, rim: 0.1 });
      b.paint(b.rect(0.58, 0.88, 0.08, 0.08, 0.01, 0.4), P.rose, { mottle: 0.3, rim: 0.1 });
      for (const [x, y] of [[0.41, 0.83], [0.51, 0.83], [0.58, 0.92], [0.66, 0.92]] as Pt[]) b.line([[x - 0.012, y], [x + 0.012, y]], P.cream, 0.008, { wobble: 0 });
      b.paint(b.circle(0.52, 0.4, 0.15, 0.3), P.sand, { mottle: 0.5 });
      for (const x of [0.47, 0.58]) b.flat(b.circle(x, 0.38, 0.02, 0), P.ink);
      b.line([[0.44, 0.46], [0.52, 0.5], [0.6, 0.46]], P.woodDeep, 0.012, { wobble: 0 });
      for (const x of [0.46, 0.52, 0.58]) b.line([[x, 0.46], [x, 0.51]], P.woodDeep, 0.006, { wobble: 0 });
      b.glow(0.43, 0.44, 0.03, P.rose, 0.4);
      b.glow(0.62, 0.44, 0.03, P.rose, 0.4);
      b.paint(b.ellipse(0.52, 0.27, 0.26, 0.05, 0.3), STRAW, { mottle: 0.4, rim: 0.12 });
      b.paint(b.ellipse(0.52, 0.2, 0.13, 0.09, 0.3), STRAW, { mottle: 0.4, light: 0.3, rim: 0.12 });
      b.line([[0.4, 0.25], [0.64, 0.25]], P.ember, 0.025, { wobble: 0 });
    },
  },

  // --- Farm things ---------------------------------------------------------

  house: {
    w: 2.3,
    h: 2.2,
    paint(b) {
      const plank = P.wood;
      const dark = P.woodDeep;
      for (const x of [0.36, 0.8, 1.5, 1.94]) b.paint(b.rect(x - 0.04, 1.44, 0.08, 0.76, 0.02, 0.2), dark, { mottle: 0.4 });
      b.paint(b.ellipse(1.72, 2.06, 0.12, 0.13, 0.4), P.terracotta, { mottle: 0.5, light: 0.3 });
      b.paint(b.ellipse(1.72, 1.94, 0.08, 0.02, 0.2), shade(P.terracotta, -0.3), { rim: 0 });
      const wall = b.rect(0.36, 0.86, 1.58, 0.6, 0.02, 0.4);
      b.paint(wall, plank, { mottle: 0.8, light: 0.2 });
      b.ctx.save();
      b.ctx.clip(wall.path);
      for (let x = 0.42; x < 1.94; x += 0.08) b.line([[x, 0.86], [x, 1.46]], dark, 0.008, { alpha: 0.6 });
      b.ctx.restore();
      for (const x of [0.64, 1.66]) {
        b.paint(b.rect(x - 0.13, 1.02, 0.26, 0.2, 0.02, 0.3), '#5b4a6a', { mottle: 0.3, rim: 0.1 });
        for (const sx of [x - 0.24, x + 0.14]) b.paint(b.rect(sx, 1.0, 0.1, 0.24, 0.02, 0.3), P.teal, { mottle: 0.4 });
        b.paint(b.rect(x - 0.16, 1.22, 0.32, 0.06, 0.02, 0.3), P.terracotta, { mottle: 0.3 });
        for (let i = 0; i < 4; i++) b.paint(b.circle(x - 0.11 + i * 0.075, 1.2, 0.028, 0.3), i % 2 ? P.pink : P.butter, { rim: 0.1 });
      }
      b.paint(b.rect(1.03, 0.98, 0.26, 0.48, 0.03, 0.3), '#5b4a6a', { mottle: 0.3 });
      b.paint(b.rect(0.24, 1.44, 1.82, 0.08, 0.02, 0.3), dark, { mottle: 0.4 });
      for (const [x0, x1] of [[1.08, 1.0], [1.24, 1.32]]) b.line([[x0, 1.5], [x1, 2.18]], dark, 0.03, { wobble: 0 });
      for (let y = 1.62; y < 2.15; y += 0.13) {
        const t = (y - 1.5) / 0.68;
        b.line([[1.08 - 0.08 * t, y], [1.24 + 0.08 * t, y]], plank, 0.025, { wobble: 0 });
      }
      // Steep thatched roof with curling gable tips.
      const roof = b.poly([[0.02, 0.98], [0.38, 0.2], [1.92, 0.2], [2.28, 0.98]], { wobble: 0.5 });
      b.paint(roof, STRAW, { mottle: 0.9, light: 0.3 });
      b.ctx.save();
      b.ctx.clip(roof.path);
      for (let y = 0.3; y < 1.0; y += 0.1) b.line([[0, y], [2.3, y + 0.01]], STRAW_DEEP, 0.012, { alpha: 0.7, wobble: 1 });
      for (let i = 0; i < 70; i++) {
        const x = b.rng() * 2.3;
        const y = 0.22 + b.rng() * 0.74;
        b.line([[x, y], [x + 0.01, y + 0.06]], STRAW_DEEP, 0.006, { alpha: 0.5 });
      }
      b.ctx.restore();
      b.line([[0.02, 0.98], [2.28, 0.98]], STRAW_DEEP, 0.025, { wobble: 0.3 });
      b.line([[0.38, 0.2], [1.92, 0.2]], dark, 0.035, { wobble: 0 });
      for (const [x, s] of [[0.38, -1], [1.92, 1]] as [number, number][]) b.line([[x, 0.22], [x + s * 0.06, 0.1], [x + s * 0.02, 0.03]], dark, 0.03, { wobble: 0 });
    },
  },

  tractor: {
    w: 1.7,
    h: 1.4,
    paint(b) {
      const red = P.ember;
      for (const x of [0.34, 0.8]) b.line([[x, 0.2], [x, 0.78]], P.charcoal, 0.035, { wobble: 0 });
      b.paint(b.rect(0.22, 0.12, 0.7, 0.1, 0.03, 0.3), P.butter, { mottle: 0.4 });
      b.paint(b.rect(0.38, 0.38, 0.07, 0.26, 0.03, 0.2), P.charcoal, { mottle: 0.3 });
      b.paint(b.rect(0.38, 0.58, 0.24, 0.08, 0.03, 0.2), P.charcoal, { mottle: 0.3 });
      b.paint(b.poly([[0.62, 0.72], [0.74, 0.5], [1.45, 0.5], [1.58, 0.62], [1.6, 0.98], [0.62, 0.98]], { wobble: 0.3 }), red, { mottle: 0.6, light: 0.3 });
      for (let y = 0.66; y < 0.94; y += 0.06) b.line([[1.5, y], [1.58, y]], shade(red, -0.3), 0.012, { wobble: 0 });
      b.paint(b.circle(1.56, 0.58, 0.04, 0.2), P.butter, { rim: 0.1 });
      b.glow(1.6, 0.58, 0.08, P.butter, 0.6);
      b.paint(b.rect(1.2, 0.26, 0.05, 0.26, 0.02, 0.2), P.slate, { mottle: 0.3 });
      for (const [x, y, r] of [[1.24, 0.18, 0.05], [1.3, 0.1, 0.04], [1.38, 0.05, 0.03]] as [number, number, number][]) b.paint(b.circle(x, y, r, 0.4), P.white, { rim: 0.1, alpha: 0.8 });
      b.line([[0.8, 0.7], [0.72, 0.52]], P.charcoal, 0.025, { wobble: 0 });
      b.paint(b.ellipse(0.71, 0.5, 0.07, 0.025, 0.2, -0.3), P.charcoal, { rim: 0 });
      const fender = Array.from({ length: 13 }, (_, i): Pt => {
        const a = Math.PI + (i / 12) * Math.PI;
        return [0.48 + Math.cos(a) * 0.42, 1.04 + Math.sin(a) * 0.42];
      });
      b.line(fender, red, 0.08, { wobble: 0 });
      wheel(b, 0.48, 1.04, 0.36, P.butter);
      wheel(b, 1.36, 1.2, 0.2, P.butter);
    },
  },

  haystack: {
    w: 1.2,
    h: 1.05,
    paint(b) {
      b.line([[0.6, 0.02], [0.6, 0.3]], P.woodDeep, 0.03, { wobble: 0 });
      const stack = b.poly([[0.06, 1.04], [0.12, 0.7], [0.3, 0.38], [0.6, 0.2], [0.9, 0.38], [1.08, 0.7], [1.14, 1.04]], { smooth: true, wobble: 0.6 });
      b.paint(stack, STRAW, { mottle: 1, light: 0.3 });
      b.ctx.save();
      b.ctx.clip(stack.path);
      for (let i = 0; i < 90; i++) {
        const x = 0.06 + b.rng() * 1.08;
        const y = 0.22 + b.rng() * 0.82;
        const a = (x - 0.6) * 0.8;
        b.line([[x, y], [x + Math.sin(a) * 0.08, y + 0.1]], i % 3 ? STRAW_DEEP : P.butter, 0.008, { alpha: 0.7 });
      }
      b.ctx.restore();
      b.line([[0.16, 0.68], [0.6, 0.74], [1.04, 0.68]], STRAW_DEEP, 0.022, { wobble: 0.3 });
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        const x = 0.1 + t * 1.0;
        const y = 0.3 + Math.abs(t - 0.5) * 1.0;
        b.line([[x, y], [x + (t - 0.5) * 0.12, y - 0.06]], STRAW_DEEP, 0.008, { alpha: 0.8 });
      }
    },
  },

  wheelbarrow: {
    w: 1.3,
    h: 0.82,
    paint(b) {
      b.line([[0.04, 0.4], [0.5, 0.5]], P.wood, 0.035, { wobble: 0 });
      b.line([[0.42, 0.56], [0.38, 0.8]], P.charcoal, 0.03, { wobble: 0 });
      for (const [x, y, r, c] of [[0.5, 0.3, 0.1, P.leaf], [0.72, 0.25, 0.11, P.sage], [0.92, 0.3, 0.09, P.leaf]] as [number, number, number, string][]) {
        b.paint(b.circle(x, y, r, 0.4), c, { mottle: 0.5, light: 0.35 });
        b.line([[x - r * 0.5, y], [x, y - r * 0.4], [x + r * 0.5, y]], shade(c, -0.25), 0.008, { alpha: 0.7, wobble: 0 });
      }
      for (const [x, a] of [[0.62, -0.5], [0.82, 0.4]] as [number, number][]) {
        b.paint(b.poly([[x - 0.03, 0.3], [x + 0.03, 0.3], [x + Math.sin(a) * 0.18, 0.3 + Math.cos(a) * 0.04 - 0.18]], { wobble: 0.2 }), P.orange, { rim: 0.1 });
      }
      const tray = b.poly([[0.3, 0.32], [1.12, 0.3], [0.98, 0.6], [0.48, 0.62]], { wobble: 0.3 });
      b.paint(tray, P.teal, { mottle: 0.5, light: 0.3 });
      b.line([[0.3, 0.32], [1.12, 0.3]], shade(P.teal, 0.35), 0.03, { wobble: 0 });
      b.line([[0.98, 0.56], [1.06, 0.66]], P.charcoal, 0.03, { wobble: 0 });
      wheel(b, 1.06, 0.66, 0.15, P.butter);
    },
  },

  'watering-can': {
    w: 0.92,
    h: 0.72,
    paint(b) {
      const tin = P.skyDeep;
      b.line([[0.58, 0.58], [0.84, 0.26]], tin, 0.05, { wobble: 0 });
      b.paint(b.ellipse(0.85, 0.23, 0.065, 0.035, 0.2, -0.6), shade(tin, 0.2), { rim: 0.1 });
      for (const [x, y] of [[0.89, 0.32], [0.86, 0.4], [0.9, 0.46]] as Pt[]) b.paint(b.ellipse(x, y, 0.012, 0.02, 0.1), P.skyLight, { rim: 0 });
      b.line([[0.16, 0.36], [0.2, 0.16], [0.36, 0.1], [0.52, 0.16], [0.56, 0.36]], shade(tin, -0.2), 0.035, { wobble: 0 });
      b.paint(b.rect(0.12, 0.32, 0.5, 0.38, 0.06, 0.3), tin, { mottle: 0.5, light: 0.35 });
      b.paint(b.ellipse(0.37, 0.33, 0.25, 0.04, 0.2), shade(tin, 0.25), { rim: 0.1 });
      b.line([[0.13, 0.62], [0.61, 0.62]], shade(tin, -0.2), 0.02, { wobble: 0 });
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        b.paint(b.circle(0.37 + Math.cos(a) * 0.035, 0.47 + Math.sin(a) * 0.035, 0.028, 0.2), P.pink, { rim: 0 });
      }
      b.paint(b.circle(0.37, 0.47, 0.02, 0), P.butter, { rim: 0 });
    },
  },

  canoe: {
    w: 2.1,
    h: 0.72,
    paint(b) {
      ripple(b, 1.05, 0.62, 1.0, 0.09, P.skyLight);
      b.paint(b.poly([[0.04, 0.28], [0.5, 0.25], [1.05, 0.24], [1.6, 0.25], [2.06, 0.28], [1.6, 0.38], [1.05, 0.42], [0.5, 0.38]], { smooth: true, wobble: 0.3 }), shade(P.wood, -0.15), { mottle: 0.5, rim: 0.1 });
      for (const x of [0.62, 1.48]) b.line([[x, 0.26], [x, 0.39]], P.woodDeep, 0.04, { wobble: 0 });
      b.line([[0.8, 0.34], [1.62, 0.22]], P.wood, 0.03, { wobble: 0 });
      b.paint(b.ellipse(1.74, 0.2, 0.13, 0.05, 0.2, -0.15), P.wood, { mottle: 0.4, rim: 0.12 });
      b.paint(b.poly([[0.46, 0.27], [0.62, 0.12], [0.78, 0.27]], { wobble: 0.2 }), STRAW, { mottle: 0.4, rim: 0.12 });
      b.paint(b.ellipse(0.62, 0.27, 0.16, 0.025, 0.2), STRAW_DEEP, { rim: 0 });
      const hull = b.poly([[0.04, 0.28], [0.5, 0.38], [1.05, 0.42], [1.6, 0.38], [2.06, 0.28], [1.8, 0.5], [1.05, 0.58], [0.3, 0.5]], { smooth: true, wobble: 0.4 });
      b.paint(hull, P.terracotta, { mottle: 0.7, light: 0.2 });
      b.line([[0.18, 0.4], [0.6, 0.46], [1.05, 0.49], [1.5, 0.46], [1.9, 0.4]], P.butter, 0.025, { wobble: 0.2 });
      b.line([[0.04, 0.28], [0.5, 0.38], [1.05, 0.42], [1.6, 0.38], [2.06, 0.28]], shade(P.terracotta, 0.3), 0.02, { wobble: 0.2 });
    },
  },

  bridge: {
    w: 2.4,
    h: 1.0,
    paint(b) {
      ripple(b, 1.2, 0.92, 1.15, 0.08, P.skyLight);
      const arc = (t: number, lift: number): Pt => [0.08 + t * 2.24, 0.76 - Math.sin(Math.PI * t) * 0.32 - lift];
      for (const t of [0.22, 0.5, 0.78]) {
        const [x, y] = arc(t, 0);
        b.paint(b.rect(x - 0.03, y, 0.06, 0.94 - y, 0.02, 0.2), P.woodDeep, { mottle: 0.4 });
      }
      const rail = Array.from({ length: 13 }, (_, i) => arc(i / 12, 0.24));
      for (let i = 0; i <= 6; i++) {
        const [x, y] = arc(i / 6, 0);
        b.line([[x, y], [x, y - 0.26]], P.woodDeep, 0.03, { wobble: 0 });
      }
      b.line(rail, P.woodDeep, 0.035, { wobble: 0.2 });
      b.line(Array.from({ length: 13 }, (_, i) => arc(i / 12, 0.12)), P.wood, 0.02, { wobble: 0.2 });
      const top = Array.from({ length: 13 }, (_, i) => arc(i / 12, 0));
      const bottom = top.map(([x, y]): Pt => [x, y + 0.1]).reverse();
      b.paint(b.poly([...top, ...bottom], { smooth: true, wobble: 0.3 }), P.wood, { mottle: 0.6, light: 0.25 });
      for (let i = 1; i < 12; i++) {
        const [x, y] = arc(i / 12, 0);
        b.line([[x, y + 0.01], [x, y + 0.09]], P.woodDeep, 0.008, { alpha: 0.6, wobble: 0 });
      }
    },
  },

  // --- Scenery ---------------------------------------------------------------

  'coconut-palm': {
    w: 1.4,
    h: 2.3,
    paint(b) {
      const trunk: Pt[] = [[0.62, 2.3], [0.6, 1.6], [0.66, 0.9], [0.76, 0.42]];
      b.line(trunk, P.wood, 0.11, { wobble: 0.2 });
      for (let t = 0.1; t < 0.95; t += 0.07) {
        const y = 2.3 - t * 1.88;
        const x = 0.62 + (t > 0.5 ? (t - 0.5) * 0.3 : -t * 0.04);
        b.line([[x - 0.05, y], [x + 0.05, y - 0.01]], P.woodDeep, 0.01, { alpha: 0.7, wobble: 0 });
      }
      for (const a of [-2.2, -1.6, -0.9, -0.3, 0.4, 1.1, 1.7, 2.3]) frond(b, 0.76, 0.42, a, 0.6, a > 0 ? P.leaf : P.leafDeep);
      for (const [x, y] of [[0.72, 0.48], [0.82, 0.5], [0.77, 0.55]] as Pt[]) b.paint(b.circle(x, y, 0.045, 0.3), P.woodDeep, { mottle: 0.3, light: 0.3, rim: 0.1 });
    },
  },

  fence: {
    w: 1.7,
    h: 0.55,
    paint(b) {
      for (const y of [0.22, 0.38]) b.line([[0.04, y], [1.66, y + 0.01]], P.wood, 0.04, { wobble: 0.4 });
      for (let x = 0.1; x < 1.7; x += 0.3) {
        b.paint(b.poly([[x - 0.035, 0.55], [x - 0.035, 0.1], [x, 0.04], [x + 0.035, 0.1], [x + 0.035, 0.55]], { wobble: 0.3 }), P.woodDeep, { mottle: 0.4, light: 0.2 });
      }
      for (let x = 0.2; x < 1.6; x += 0.17) leaf(b, x, 0.55, (x % 0.34 > 0.17 ? 1 : -1) * 0.5, 0.12, 0.025, P.leaf);
    },
  },

  /** A little Thai spirit house on its post, hung with marigold garlands. */
  'spirit-house': {
    w: 0.8,
    h: 1.4,
    paint(b) {
      b.paint(b.rect(0.34, 0.74, 0.12, 0.66, 0.03, 0.3), P.cream, { mottle: 0.4 });
      b.paint(b.rect(0.12, 0.7, 0.56, 0.07, 0.02, 0.3), P.gold, { mottle: 0.3 });
      b.paint(b.rect(0.2, 0.42, 0.4, 0.3, 0.02, 0.3), P.ember, { mottle: 0.5, light: 0.2 });
      b.paint(b.rect(0.33, 0.5, 0.14, 0.22, 0.05, 0.2), P.gold, { mottle: 0.3, rim: 0.1 });
      for (const x of [0.22, 0.58]) b.line([[x, 0.42], [x, 0.72]], P.gold, 0.02, { wobble: 0 });
      b.paint(b.poly([[0.1, 0.44], [0.4, 0.14], [0.7, 0.44]], { wobble: 0.2 }), P.ember, { mottle: 0.4, light: 0.2 });
      b.paint(b.poly([[0.2, 0.3], [0.4, 0.06], [0.6, 0.3]], { wobble: 0.2 }), shade(P.ember, -0.15), { mottle: 0.4 });
      for (const [x, s] of [[0.1, -1], [0.7, 1], [0.2, -1], [0.6, 1]] as [number, number][]) {
        const y = x === 0.1 || x === 0.7 ? 0.44 : 0.3;
        b.line([[x, y], [x + s * 0.05, y - 0.06]], P.gold, 0.02, { wobble: 0 });
      }
      b.line([[0.4, 0.07], [0.4, 0.0]], P.gold, 0.02, { wobble: 0 });
      for (let i = 0; i < 6; i++) b.paint(b.circle(0.16 + i * 0.096, 0.8 + Math.sin((i / 5) * Math.PI) * 0.05, 0.03, 0.2), i % 2 ? P.orange : P.yellow, { rim: 0.1 });
    },
  },

  'banana-plant': {
    w: 1.3,
    h: 1.55,
    paint(b) {
      b.paint(b.poly([[0.56, 1.55], [0.6, 0.8], [0.7, 0.8], [0.74, 1.55]], { wobble: 0.3 }), mix(P.leaf, P.sage, 0.5), { mottle: 0.5, light: 0.2 });
      for (const [a, c] of [[-1.3, P.leafDeep], [1.35, P.leafDeep], [-0.6, P.leaf], [0.75, P.leaf], [0.1, mix(P.leaf, P.butter, 0.2)]] as [number, string][]) {
        leaf(b, 0.65, 0.86, a, 0.6, 0.14, c);
      }
      for (let i = 0; i < 6; i++) b.paint(b.ellipse(0.76 + (i % 3) * 0.04, 0.96 + Math.floor(i / 3) * 0.06, 0.02, 0.05, 0.2, 0.4), mix(P.yellow, P.leaf, 0.4), { rim: 0.1 });
      b.line([[0.8, 0.98], [0.84, 1.12]], P.leafDeep, 0.015, { wobble: 0 });
      b.paint(b.ellipse(0.85, 1.18, 0.035, 0.06, 0.2), P.plum, { mottle: 0.3, rim: 0.1 });
    },
  },
};
