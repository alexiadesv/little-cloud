import type { Brush } from '../paint/brush';
import { P, shade } from '../paint/color';
import { type PainterMap, canopy, person, ripple, wheel } from './common';

type Pt = [number, number];

/** Fiesta colours: hot pink, marigold, turquoise, lime and talavera blue. */
const ROSA = '#e0478f';
const MARIGOLD = '#f5a524';
const TURQUOISE = '#38b7ad';
const LIME = '#9ccc4e';
const TALAVERA = '#3a62b5';
const FIESTA = [ROSA, MARIGOLD, TURQUOISE, LIME, TALAVERA, P.yellow];

function star(cx: number, cy: number, outer: number, inner: number, rotation = -Math.PI / 2): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/** A sagging string of cut-paper flags with zig-zag hems and punched patterns. */
function papelPicado(b: Brush, x0: number, y0: number, x1: number, y1: number, count: number, size: number) {
  const at = (t: number): Pt => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * size * 0.45];
  b.line(Array.from({ length: 13 }, (_, i) => at(i / 12)), P.charcoal, size * 0.05, { wobble: 0.2, alpha: 0.7 });
  const w = size * 0.8;
  for (let i = 0; i < count; i++) {
    const [x, y] = at((i + 0.5) / count);
    const color = FIESTA[i % FIESTA.length];
    const pts: Pt[] = [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + size * 0.82]];
    for (let k = 3; k >= 0; k--) pts.push([x - w / 2 + (w * k) / 4, y + size * (k % 2 ? 1 : 0.82)]);
    b.paint(b.poly(pts, { wobble: 0.2 }), color, { mottle: 0.3, rim: 0.1 });
    const cut = shade(color, 0.6);
    b.flat(b.circle(x, y + size * 0.45, w * 0.15, 0.2), cut, 0.9);
    for (const s of [-1, 1]) b.flat(b.circle(x + s * w * 0.28, y + size * 0.45, w * 0.07, 0.2), cut, 0.9);
    b.flat(b.poly([[x, y + size * 0.1], [x + w * 0.12, y + size * 0.2], [x, y + size * 0.3], [x - w * 0.12, y + size * 0.2]], { wobble: 0 }), cut, 0.9);
  }
}

/** A cob of corn lying on its side, with grill marks and a curl of husk. */
function cob(b: Brush, cx: number, cy: number, len: number, rot: number) {
  const ry = len * 0.18;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const at = (x: number, y: number): Pt => [cx + x * c - y * s, cy + x * s + y * c];
  b.paint(b.poly([at(-len / 2, 0), at(-len * 0.75, -ry * 1.2), at(-len * 0.7, ry * 0.2), at(-len * 0.8, ry * 1.1)], { wobble: 0.3 }), '#b8c97a', { mottle: 0.3, rim: 0.1 });
  const body = b.ellipse(cx, cy, len / 2, ry, 0.3, rot);
  b.paint(body, P.yellow, { mottle: 0.4, light: 0.35 });
  for (let k = -1; k <= 1; k++) b.line([at(-len * 0.42, k * ry * 0.5), at(len * 0.42, k * ry * 0.5)], P.butter, ry * 0.25, { alpha: 0.8, wobble: 0 });
  for (let k = 0; k < 4; k++) {
    const x = -len * 0.3 + k * len * 0.2;
    b.line([at(x, -ry * 0.8), at(x + len * 0.05, ry * 0.8)], P.woodDeep, ry * 0.22, { alpha: 0.55, wobble: 0 });
  }
}

export const seasidePainters: PainterMap = {
  lighthouse: {
    w: 1.3,
    h: 3.3,
    paint(b) {
      const tower = b.poly([[0.36, 3.0], [0.46, 0.85], [0.84, 0.85], [0.94, 3.0]], { wobble: 0.5 });
      b.paint(tower, P.cream, { mottle: 0.8 });
      b.ctx.save();
      b.ctx.clip(tower.path);
      for (let y = 1.05; y < 3.0; y += 0.5) b.paint(b.poly([[0.2, y + 0.08], [1.1, y - 0.04], [1.1, y + 0.2], [0.2, y + 0.3]], { wobble: 0.4 }), P.raspberry, { mottle: 0.6, rim: 0 });
      b.ctx.restore();
      b.paint(b.rect(0.58, 2.6, 0.16, 0.36, 0.08), P.woodDeep, { mottle: 0.3 });
      b.paint(b.rect(0.6, 1.6, 0.1, 0.16, 0.05), P.skyPale, { mottle: 0.2 });
      b.paint(b.rect(0.34, 0.8, 0.62, 0.08, 0.02), P.charcoal, { mottle: 0.3 });
      b.line([[0.36, 0.7], [0.94, 0.7]], P.charcoal, 0.02);
      for (let x = 0.4; x < 0.94; x += 0.1) b.line([[x, 0.7], [x, 0.8]], P.charcoal, 0.015);
      b.glow(0.65, 0.58, 0.55, P.butter, 0.55);
      b.paint(b.rect(0.48, 0.44, 0.34, 0.3, 0.04), P.butter, { mottle: 0.4, light: 0.5 });
      b.line([[0.65, 0.44], [0.65, 0.74]], P.charcoal, 0.015, { alpha: 0.7 });
      b.paint(b.poly([[0.42, 0.46], [0.65, 0.2], [0.88, 0.46]], { smooth: true }), P.raspberry, { mottle: 0.4 });
      b.paint(b.circle(0.65, 0.18, 0.04), P.charcoal, { rim: 0 });
      papelPicado(b, 0.22, 0.86, 1.08, 0.86, 6, 0.13);
      const rocks: [number, number, number, number][] = [[0.3, 3.1, 0.3, 0.2], [0.8, 3.12, 0.36, 0.18], [0.55, 3.18, 0.4, 0.12], [1.08, 3.18, 0.2, 0.12]];
      for (const [x, y, rx, ry] of rocks) b.paint(b.ellipse(x, y, rx, ry, 1.5), P.stone, { mottle: 1 });
    },
  },

  sailboat: {
    w: 1.6,
    h: 1.75,
    paint(b) {
      ripple(b, 0.8, 1.66, 0.8, 0.09);
      b.paint(b.poly([[0.05, 1.3], [1.55, 1.3], [1.32, 1.62], [0.24, 1.62]], { smooth: true, wobble: 0.6 }), P.skyDeep);
      b.line([[0.12, 1.4], [1.48, 1.4]], P.cream, 0.04, { alpha: 0.9 });
      b.paint(b.rect(0.74, 0.08, 0.05, 1.24, 0.02), P.woodDeep, { mottle: 0.3 });
      b.paint(b.poly([[0.82, 0.12], [0.82, 1.22], [1.45, 1.22]], { smooth: false, wobble: 0.8 }), P.cream, { mottle: 0.8, shadow: 0.25 });
      b.paint(b.poly([[0.7, 0.3], [0.7, 1.22], [0.18, 1.22]], { smooth: false, wobble: 0.8 }), P.peach, { mottle: 0.8, shadow: 0.25 });
      b.line([[0.86, 0.6], [1.2, 1.0]], P.pink, 0.04, { alpha: 0.6 });
      b.paint(b.poly([[0.79, 0.06], [1.02, 0.12], [0.79, 0.2]], { wobble: 0.4 }), P.rose, { rim: 0.1 });
    },
  },

  whale: {
    w: 1.7,
    h: 1.25,
    paint(b) {
      const blue = P.periwinkle;
      b.paint(b.poly([[0.2, 0.62], [0.06, 0.4], [0.14, 0.38], [0.24, 0.5], [0.3, 0.36], [0.38, 0.4], [0.3, 0.66]], { smooth: true }), blue);
      b.paint(b.poly([[0.26, 1.0], [0.4, 0.66], [0.8, 0.5], [1.3, 0.56], [1.6, 0.86], [1.62, 1.0]], { smooth: true, wobble: 0.6 }), blue);
      b.paint(b.poly([[0.62, 1.0], [0.9, 0.84], [1.4, 0.86], [1.6, 1.0]], { smooth: true }), P.skyPale, { mottle: 0.5 });
      for (let x = 0.95; x < 1.45; x += 0.1) b.line([[x, 0.88], [x + 0.02, 0.98]], shade(P.skyPale, -0.2), 0.012, { alpha: 0.6 });
      b.flat(b.circle(1.32, 0.72, 0.035, 0), P.ink);
      b.flat(b.circle(1.33, 0.71, 0.012, 0), '#fff', 0.9);
      b.glow(1.38, 0.82, 0.07, P.rose, 0.5);
      b.line([[1.22, 0.56], [1.18, 0.34], [1.06, 0.18]], P.skyLight, 0.05, { alpha: 0.85 });
      b.line([[1.22, 0.56], [1.26, 0.32], [1.38, 0.16]], P.skyLight, 0.05, { alpha: 0.85 });
      for (const [x, y] of [[1.02, 0.12], [1.42, 0.1], [1.22, 0.06], [1.12, 0.22], [1.34, 0.22]] as [number, number][]) {
        b.paint(b.circle(x, y, 0.045), P.skyPale, { mottle: 0.2, rim: 0.1 });
      }
      ripple(b, 0.9, 1.1, 0.85, 0.12);
    },
  },

  fish: {
    w: 0.95,
    h: 0.62,
    paint(b) {
      const body = P.orange;
      b.paint(b.poly([[0.22, 0.32], [0.04, 0.12], [0.06, 0.52]], { smooth: true }), shade(body, -0.1));
      b.paint(b.ellipse(0.52, 0.32, 0.36, 0.22), body);
      b.paint(b.poly([[0.42, 0.14], [0.52, 0.02], [0.66, 0.14]], { smooth: true }), shade(body, -0.1));
      for (const x of [0.4, 0.56]) b.line([[x, 0.14], [x - 0.03, 0.5]], P.cream, 0.04, { alpha: 0.8 });
      b.flat(b.circle(0.74, 0.27, 0.035, 0), P.ink);
      b.flat(b.circle(0.75, 0.26, 0.012, 0), '#fff', 0.9);
      b.line([[0.82, 0.38], [0.86, 0.4]], P.ink, 0.015);
      for (const [x, y, r] of [[0.92, 0.12, 0.03], [0.86, 0.04, 0.02], [0.2, 0.58, 0.025]] as [number, number, number][]) {
        b.paint(b.circle(x, y, r), P.skyLight, { mottle: 0.1, rim: 0.2 });
      }
    },
  },

  seagull: {
    w: 1.15,
    h: 0.7,
    paint(b) {
      b.paint(b.poly([[0.58, 0.36], [0.3, 0.08], [0.02, 0.06], [0.12, 0.14], [0.42, 0.42]], { smooth: true }), P.stone, { mottle: 0.6 });
      b.paint(b.poly([[0.02, 0.06], [0.12, 0.05], [0.16, 0.14], [0.08, 0.12]], { smooth: true }), P.charcoal, { rim: 0 });
      b.paint(b.ellipse(0.56, 0.44, 0.3, 0.13), P.white);
      b.paint(b.poly([[0.3, 0.42], [0.12, 0.38], [0.14, 0.5], [0.3, 0.5]], { smooth: true }), P.white);
      b.paint(b.circle(0.84, 0.36, 0.1), P.white);
      b.paint(b.poly([[0.92, 0.36], [1.08, 0.4], [0.92, 0.42]], { wobble: 0.2 }), P.yellow, { rim: 0 });
      b.flat(b.circle(0.86, 0.33, 0.018, 0), P.ink);
      b.paint(b.poly([[0.62, 0.38], [0.86, 0.12], [1.12, 0.04], [1.0, 0.16], [0.72, 0.44]], { smooth: true }), P.lilac, { mottle: 0.6 });
      b.paint(b.poly([[1.12, 0.04], [1.02, 0.06], [1.0, 0.16], [1.06, 0.12]], { smooth: true }), P.charcoal, { rim: 0 });
    },
  },

  'beach-umbrella': {
    w: 1.6,
    h: 1.85,
    paint(b) {
      b.paint(b.rect(0.77, 0.4, 0.06, 1.45, 0.02), P.cream, { mottle: 0.3 });
      b.paint(b.ellipse(0.8, 1.84, 0.12, 0.03), P.sandDeep, { rim: 0 });
      canopy(b, 0.8, 0.62, 0.1, 0.78, [ROSA, MARIGOLD, TURQUOISE, LIME, TALAVERA, P.yellow]);
      for (let i = 0; i < 16; i++) {
        const x = 0.06 + i * 0.099;
        b.line([[x, 0.64 + Math.sin((i / 15) * Math.PI) * 0.04], [x, 0.7 + Math.sin((i / 15) * Math.PI) * 0.04]], FIESTA[i % FIESTA.length], 0.018, { wobble: 0 });
      }
      b.paint(b.circle(0.8, 0.08, 0.05), ROSA, { rim: 0 });
    },
  },

  /** A stepped pyramid built from sand, with a little temple and a flag on top. */
  sandcastle: {
    w: 1.3,
    h: 1.0,
    paint(b) {
      const sand = P.sandDeep;
      for (let i = 0; i < 4; i++) {
        const half = 0.62 - i * 0.12;
        const top = 0.98 - (i + 1) * 0.17;
        b.paint(b.rect(0.65 - half, top, half * 2, 0.19, 0.02, 0.8), shade(sand, i % 2 ? 0.08 : 0), { mottle: 0.9, light: 0.2 });
        b.line([[0.67 - half, top + 0.01], [0.63 + half, top + 0.01]], shade(sand, 0.35), 0.012, { alpha: 0.8, wobble: 0.3 });
      }
      b.paint(b.poly([[0.55, 0.98], [0.59, 0.3], [0.71, 0.3], [0.75, 0.98]], { wobble: 0.3 }), shade(sand, -0.1), { mottle: 0.5, rim: 0.1 });
      for (let y = 0.34; y < 0.97; y += 0.05) b.line([[0.59 - (y - 0.3) * 0.06, y], [0.71 + (y - 0.3) * 0.06, y]], shade(sand, -0.3), 0.008, { alpha: 0.6, wobble: 0 });
      b.paint(b.rect(0.5, 0.12, 0.3, 0.19, 0.02, 0.6), sand, { mottle: 0.6, light: 0.3 });
      b.paint(b.rect(0.6, 0.19, 0.1, 0.12, 0.04, 0.2), shade(sand, -0.4), { rim: 0 });
      b.line([[0.65, 0.12], [0.65, 0.0]], P.woodDeep, 0.018, { wobble: 0 });
      b.paint(b.poly([[0.655, 0.0], [0.82, 0.04], [0.655, 0.09]], { wobble: 0.3 }), ROSA, { rim: 0 });
      for (const [x, y, c] of [[0.2, 0.9, P.pink], [1.1, 0.88, P.lilac], [0.36, 0.72, P.cream], [0.96, 0.55, P.pink]] as [number, number, string][]) {
        b.paint(b.circle(x, y, 0.035, 0.2), c, { rim: 0.1 });
      }
      b.speckle(b.rect(0, 0.1, 1.3, 0.9, 0, 0), shade(sand, -0.3), 90, 0.008, 0.4);
    },
  },

  crab: {
    w: 0.95,
    h: 0.6,
    paint(b) {
      const shell = P.raspberry;
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) b.line([[0.475 + s * 0.16, 0.4 + i * 0.03], [0.475 + s * (0.3 + i * 0.03), 0.48 + i * 0.03], [0.475 + s * (0.36 + i * 0.03), 0.58]], shade(shell, -0.1), 0.03);
        b.line([[0.475 + s * 0.18, 0.34], [0.475 + s * 0.3, 0.22]], shell, 0.045);
        b.paint(b.ellipse(0.475 + s * 0.34, 0.15, 0.1, 0.08, 1, s * 0.4), shell);
        b.flat(b.poly([[0.475 + s * 0.36, 0.1], [0.475 + s * 0.46, 0.04], [0.475 + s * 0.42, 0.14]], { wobble: 0.2 }), P.paper);
      }
      b.paint(b.ellipse(0.475, 0.38, 0.22, 0.14), shell);
      b.line([[0.42, 0.26], [0.4, 0.14]], shell, 0.025);
      b.line([[0.53, 0.26], [0.55, 0.14]], shell, 0.025);
      b.flat(b.circle(0.4, 0.13, 0.035, 0), P.white);
      b.flat(b.circle(0.55, 0.13, 0.035, 0), P.white);
      b.flat(b.circle(0.405, 0.135, 0.016, 0), P.ink);
      b.flat(b.circle(0.555, 0.135, 0.016, 0), P.ink);
      b.line([[0.43, 0.42], [0.475, 0.45], [0.52, 0.42]], P.ink, 0.014, { wobble: 0 });
    },
  },

  starfish: {
    w: 0.62,
    h: 0.62,
    paint(b) {
      const s = b.poly(star(0.31, 0.33, 0.3, 0.13, -Math.PI / 2 + 0.12), { smooth: true, wobble: 0.6 });
      b.paint(s, P.apricot, { mottle: 0.9 });
      b.speckle(s, P.cream, 26, 0.01, 0.8);
      b.flat(b.circle(0.27, 0.3, 0.018, 0), P.ink);
      b.flat(b.circle(0.35, 0.3, 0.018, 0), P.ink);
      b.line([[0.28, 0.37], [0.31, 0.39], [0.34, 0.37]], P.ink, 0.012, { wobble: 0 });
    },
  },

  seashell: {
    w: 0.58,
    h: 0.5,
    paint(b) {
      const pts: [number, number][] = [[0.29, 0.48]];
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI + 0.15 + (i / 14) * (Math.PI - 0.3);
        const r = 0.27 + (i % 2) * 0.02;
        pts.push([0.29 + Math.cos(a) * r, 0.36 + Math.sin(a) * r * 1.1]);
      }
      const shell = b.poly(pts, { smooth: true, wobble: 0.4 });
      b.paint(shell, P.blush, { mottle: 0.8 });
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + 0.35 + (i / 6) * (Math.PI - 0.7);
        b.line([[0.29, 0.46], [0.29 + Math.cos(a) * 0.24, 0.36 + Math.sin(a) * 0.27]], P.rose, 0.014, { alpha: 0.6 });
      }
      b.paint(b.poly([[0.22, 0.44], [0.29, 0.38], [0.36, 0.44], [0.29, 0.5]], { smooth: true }), shade(P.blush, -0.1), { mottle: 0.2 });
    },
  },

  // --- Decor -------------------------------------------------------------

  rock: {
    w: 0.95,
    h: 0.58,
    paint(b) {
      b.paint(b.ellipse(0.36, 0.36, 0.34, 0.22, 2), P.stone, { mottle: 1.2 });
      b.paint(b.ellipse(0.66, 0.42, 0.28, 0.16, 2), shade(P.stone, -0.1), { mottle: 1.2 });
      b.speckle(b.ellipse(0.48, 0.38, 0.46, 0.2, 0), P.slate, 30, 0.012, 0.4);
    },
  },

  'dune-grass': {
    w: 0.65,
    h: 0.55,
    paint(b) {
      b.paint(b.ellipse(0.32, 0.5, 0.3, 0.06, 1.4), P.sandDeep, { mottle: 0.6 });
      for (let i = 0; i < 9; i++) {
        const x = 0.1 + i * 0.055;
        const lean = (i - 4) * 0.035;
        b.line([[x, 0.5], [x + lean * 0.5, 0.25], [x + lean, 0.02 + (i % 3) * 0.06]], i % 2 ? P.sage : P.leaf, 0.022);
      }
    },
  },

  // --- Beach life -----------------------------------------------------------

  bucket: {
    w: 0.66,
    h: 0.64,
    paint(b) {
      b.line([[0.08, 0.28], [0.12, 0.12], [0.33, 0.05], [0.54, 0.12], [0.58, 0.28]], P.skyDeep, 0.022, { wobble: 0.2 });
      b.line([[0.42, 0.3], [0.58, 0.02]], P.butter, 0.04, { wobble: 0 });
      b.paint(b.ellipse(0.585, 0.02, 0.05, 0.035, 0.3, -0.5), P.yellow, { mottle: 0.2, rim: 0.15 });
      const pail = b.poly([[0.05, 0.28], [0.61, 0.28], [0.53, 0.63], [0.13, 0.63]], { wobble: 0.4 });
      b.paint(pail, P.sky, { mottle: 0.6 });
      b.ctx.save();
      b.ctx.clip(pail.path);
      b.paint(b.rect(0, 0.4, 0.66, 0.07, 0, 0.3), P.butter, { mottle: 0.3, rim: 0 });
      b.ctx.restore();
      b.paint(b.poly(star(0.33, 0.54, 0.06, 0.027), { smooth: true, wobble: 0.2 }), P.cream, { mottle: 0.2, rim: 0.1 });
      b.paint(b.ellipse(0.33, 0.28, 0.28, 0.055, 0.3), shade(P.sky, -0.2), { mottle: 0.2, rim: 0.1 });
      b.paint(b.ellipse(0.33, 0.29, 0.23, 0.035, 0.4), P.sandDeep, { mottle: 0.4, rim: 0 });
    },
  },

  'beach-towel': {
    w: 1.3,
    h: 0.56,
    paint(b) {
      // A striped serape spread on the sand.
      const towel = b.poly([[0.24, 0.1], [1.06, 0.1], [1.26, 0.5], [0.04, 0.5]], { wobble: 0.4 });
      b.paint(towel, ROSA, { mottle: 0.5, light: 0.3 });
      b.ctx.save();
      b.ctx.clip(towel.path);
      const bands = [MARIGOLD, P.cream, TURQUOISE, LIME, TALAVERA, P.yellow, TURQUOISE, MARIGOLD];
      for (let i = 0; i < bands.length; i++) {
        const t = (i + 0.5) / bands.length;
        b.line([[0.24 + t * 0.82, 0.08], [0.04 + t * 1.22, 0.52]], bands[i], 0.05, { wobble: 0.2, alpha: 0.95 });
        b.line([[0.27 + t * 0.82, 0.08], [0.08 + t * 1.22, 0.52]], P.charcoal, 0.006, { wobble: 0.2, alpha: 0.5 });
      }
      b.ctx.restore();
      for (const [top, bottom, dir] of [[[0.24, 0.1], [0.04, 0.5], -1], [[1.06, 0.1], [1.26, 0.5], 1]] as [Pt, Pt, number][]) {
        for (let t = 0.05; t < 1; t += 0.1) {
          const x = top[0] + (bottom[0] - top[0]) * t;
          const y = top[1] + (bottom[1] - top[1]) * t;
          b.line([[x, y], [x + dir * 0.05, y + 0.01]], P.cream, 0.008, { wobble: 0 });
        }
      }
    },
  },

  seaweed: {
    w: 0.82,
    h: 0.72,
    paint(b) {
      b.paint(b.ellipse(0.41, 0.66, 0.36, 0.06, 1), shade(P.sandDeep, -0.08), { mottle: 0.5, rim: 0, alpha: 0.8 });
      const strands: [number, number, number, string][] = [
        [0.24, 0.3, -0.9, '#7a9a55'],
        [0.36, 0.06, -0.3, P.leafDeep],
        [0.48, 0.12, 0.5, '#8aa35a'],
        [0.6, 0.32, 1.0, P.leafDeep],
        [0.42, 0.24, 0.1, P.leaf],
      ];
      for (const [x, top, lean, c] of strands) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          pts.push([x + Math.sin(t * 7 + x * 10) * 0.035 + lean * (1 - t) * 0.12, 0.66 - (0.66 - top) * (1 - t)]);
        }
        b.line(pts.reverse(), c, 0.06, { wobble: 0.3 });
        for (const [px, py] of pts.filter((_, i) => i % 3 === 1)) b.paint(b.circle(px + 0.03, py, 0.022, 0.2), shade(c, 0.2), { mottle: 0.2, rim: 0.2 });
      }
      for (const [x, y] of [[0.14, 0.62], [0.7, 0.64]] as [number, number][]) b.paint(b.ellipse(x, y, 0.05, 0.025, 0.3), P.cream, { rim: 0.2 });
    },
  },

  dock: {
    w: 2.6,
    h: 1.25,
    paint(b) {
      ripple(b, 1.3, 1.12, 1.3, 0.12, P.sky);
      for (const x of [0.2, 0.75, 1.3, 1.85, 2.4]) {
        b.paint(b.rect(x - 0.05, 0.5, 0.1, 0.66, 0.03, 0.3), P.woodDeep, { mottle: 0.5, rim: 0.12 });
        b.line([[x - 0.06, 1.0], [x + 0.06, 1.0]], P.skyPale, 0.02, { alpha: 0.7 });
      }
      for (let i = 0; i < 4; i++) {
        const x0 = 0.2 + i * 0.55;
        b.line([[x0, 0.56], [x0 + 0.55, 0.94]], shade(P.woodDeep, -0.1), 0.03, { alpha: 0.8 });
        b.line([[x0 + 0.55, 0.56], [x0, 0.94]], shade(P.woodDeep, -0.1), 0.03, { alpha: 0.8 });
      }
      const deck = b.poly([[0.12, 0.3], [2.48, 0.3], [2.58, 0.44], [0.02, 0.44]], { wobble: 0.3 });
      b.paint(deck, P.wood, { mottle: 0.7, light: 0.3 });
      for (let x = 0.12; x < 2.5; x += 0.12) b.line([[x, 0.3], [x - 0.09, 0.44]], P.woodDeep, 0.008, { alpha: 0.55, wobble: 0 });
      b.paint(b.rect(0.02, 0.44, 2.56, 0.1, 0.02, 0.3), shade(P.wood, -0.12), { mottle: 0.5 });
      // Ladder down into the water.
      for (const x of [0.36, 0.52]) b.line([[x, 0.44], [x, 1.1]], P.stone, 0.03, { wobble: 0 });
      for (let y = 0.62; y < 1.1; y += 0.12) b.line([[0.36, y], [0.52, y]], P.stone, 0.022, { wobble: 0 });
      // Post with a life ring, and a bollard with rope.
      b.paint(b.rect(2.16, 0.0, 0.08, 0.32, 0.02, 0.2), P.woodDeep, { mottle: 0.4 });
      b.paint(b.circle(2.2, 0.16, 0.13, 0.2), P.ember, { mottle: 0.3, rim: 0.15 });
      b.ctx.save();
      b.ctx.globalCompositeOperation = 'destination-out';
      b.flat(b.circle(2.2, 0.16, 0.065, 0), '#000');
      b.ctx.restore();
      for (const a of [0.4, 2.0, 3.6, 5.2]) {
        b.line([[2.2 + Math.cos(a) * 0.07, 0.16 + Math.sin(a) * 0.07], [2.2 + Math.cos(a) * 0.125, 0.16 + Math.sin(a) * 0.125]], P.white, 0.05, { wobble: 0 });
      }
      b.paint(b.rect(1.02, 0.18, 0.12, 0.14, 0.04, 0.2), P.charcoal, { mottle: 0.3 });
      b.paint(b.ellipse(1.08, 0.18, 0.09, 0.03, 0.2), P.slate, { rim: 0 });
      b.line([[1.14, 0.26], [1.4, 0.3], [1.6, 0.27]], P.sandDeep, 0.02, { wobble: 0.3 });
    },
  },

  family: {
    w: 1.35,
    h: 1.25,
    paint(b) {
      person(b, 0.3, 1.22, 1.18, { skin: '#c98a63', hair: P.charcoal, top: TURQUOISE, bottom: TALAVERA, hat: MARIGOLD, hands: [[0.06, 0.74], [0.53, 0.72]] });
      person(b, 0.75, 1.22, 1.0, { skin: '#f1c4a0', hair: '#a4643f', top: P.rose, dress: true, hat: P.butter, hands: [[0.53, 0.72], [0.95, 0.82]] });
      person(b, 1.1, 1.22, 0.64, { skin: '#e2a982', hair: '#6b4a3a', top: P.yellow, bottom: P.orange, hands: [[0.95, 0.82], [1.24, 0.98]] });
    },
  },

  'lounge-chair': {
    w: 1.5,
    h: 0.86,
    paint(b) {
      for (const [x0, x1] of [[0.16, 0.12], [0.9, 0.96]] as [number, number][]) b.line([[x0, 0.58], [x1, 0.84]], P.cream, 0.035, { wobble: 0 });
      b.line([[1.2, 0.36], [1.04, 0.84]], P.cream, 0.035, { wobble: 0 });
      const seat = b.poly([[0.06, 0.5], [1.02, 0.5], [1.04, 0.6], [0.06, 0.6]], { wobble: 0.3 });
      const back = b.poly([[0.98, 0.6], [1.0, 0.5], [1.34, 0.06], [1.44, 0.12]], { wobble: 0.3 });
      for (const part of [seat, back]) {
        b.paint(part, ROSA, { mottle: 0.4 });
        b.ctx.save();
        b.ctx.clip(part.path);
        for (let x = 0.0; x < 1.6; x += 0.16) b.paint(b.rect(x, 0, 0.07, 0.9, 0, 0.2), Math.round(x / 0.16) % 2 ? TURQUOISE : MARIGOLD, { mottle: 0.2, rim: 0 });
        b.ctx.restore();
      }
      b.paint(b.ellipse(1.28, 0.2, 0.12, 0.05, 0.3, -0.9), P.butter, { mottle: 0.3, rim: 0.15 });
      b.paint(b.rect(0.2, 0.42, 0.42, 0.09, 0.03, 0.3), P.pink, { mottle: 0.3, rim: 0.15 });
      b.line([[0.2, 0.46], [0.62, 0.46]], P.cream, 0.012, { alpha: 0.8 });
    },
  },

  'juice-bar': {
    w: 2.2,
    h: 2.0,
    paint(b) {
      for (const x of [0.22, 1.98]) b.paint(b.rect(x - 0.05, 0.5, 0.1, 1.48, 0.03, 0.3), P.wood, { mottle: 0.4, rim: 0.12 });
      b.paint(b.rect(0.28, 0.55, 1.64, 0.62, 0.02, 0.3), P.skyPale, { mottle: 0.6, light: 0.3 });
      // Menu board and blender behind the counter.
      b.paint(b.rect(1.3, 0.66, 0.5, 0.36, 0.04, 0.3), P.charcoal, { mottle: 0.3 });
      for (let i = 0; i < 3; i++) {
        b.paint(b.circle(1.38, 0.74 + i * 0.1, 0.025, 0.2), [P.orange, P.pink, P.leaf][i], { rim: 0 });
        b.line([[1.44, 0.74 + i * 0.1], [1.72, 0.74 + i * 0.1]], P.cream, 0.014, { alpha: 0.7 });
      }
      b.paint(b.rect(0.48, 0.82, 0.16, 0.26, 0.04, 0.2), P.skyLight, { alpha: 0.75, mottle: 0.2 });
      b.paint(b.rect(0.5, 0.96, 0.12, 0.12, 0.03, 0.2), P.orange, { rim: 0 });
      b.paint(b.rect(0.46, 1.08, 0.2, 0.08, 0.02, 0.2), P.slate, { rim: 0 });
      // Thatched roof with a fringe.
      const roof = b.poly([[0.0, 0.56], [1.1, 0.04], [2.2, 0.56]], { wobble: 0.6 });
      b.paint(roof, P.butter, { mottle: 1, shadow: 0.3 });
      b.ctx.save();
      b.ctx.clip(roof.path);
      for (let x = -0.2; x < 2.4; x += 0.07) b.line([[1.1, 0.04], [x, 0.6]], shade(P.sandDeep, -0.15), 0.008, { alpha: 0.5 });
      b.ctx.restore();
      for (let x = 0.02; x < 2.18; x += 0.05) b.line([[x, 0.54], [x + 0.01, 0.64 + (Math.round(x * 100) % 3) * 0.015]], P.sandDeep, 0.02, { wobble: 0 });
      // Talavera-tiled counter with a sign, fruit and big jars of agua fresca.
      const counter = b.rect(0.12, 1.2, 1.96, 0.78, 0.03, 0.5);
      b.paint(counter, P.cream, { mottle: 0.6 });
      b.ctx.save();
      b.ctx.clip(counter.path);
      for (let x = 0.12; x < 2.1; x += 0.196) {
        for (let y = 1.2; y < 2.0; y += 0.195) {
          const cx = x + 0.098;
          const cy = y + 0.098;
          b.stroke(b.rect(x + 0.01, y + 0.01, 0.176, 0.175, 0.01, 0.2), TALAVERA, 0.01, 0.7);
          b.flat(b.poly([[cx, cy - 0.06], [cx + 0.06, cy], [cx, cy + 0.06], [cx - 0.06, cy]], { wobble: 0.1 }), TALAVERA, 0.85);
          b.flat(b.circle(cx, cy, 0.022, 0), MARIGOLD, 0.95);
        }
      }
      b.ctx.restore();
      b.paint(b.rect(0.06, 1.14, 2.08, 0.08, 0.02, 0.3), TALAVERA, { mottle: 0.3 });
      b.paint(b.rect(0.6, 1.36, 1.0, 0.34, 0.08, 0.3), P.cream, { mottle: 0.3, rim: 0.15 });
      b.text('JUGOS', 1.1, 1.54, 0.2, ROSA, { weight: 800 });
      b.paint(b.circle(0.4, 1.06, 0.08, 0.3), P.orange, { mottle: 0.4, light: 0.4 });
      b.paint(b.circle(0.52, 1.08, 0.065, 0.3), LIME, { mottle: 0.4, light: 0.4 });
      b.paint(b.poly([[1.84, 1.14], [2.06, 1.14], [1.95, 0.98]], { smooth: true }), P.rose, { rim: 0.12 });
      b.paint(b.poly([[1.86, 1.14], [2.04, 1.14], [1.95, 1.06]], { smooth: true }), P.leaf, { rim: 0 });
      for (const [x, c] of [[1.02, ROSA], [1.26, LIME], [1.5, MARIGOLD]] as [number, string][]) {
        const jar = b.poly([[x - 0.08, 0.88], [x + 0.08, 0.88], [x + 0.1, 0.96], [x + 0.09, 1.14], [x - 0.09, 1.14], [x - 0.1, 0.96]], { smooth: true, wobble: 0.2 });
        b.paint(jar, P.skyPale, { alpha: 0.55, mottle: 0.2, rim: 0.2 });
        b.paint(b.poly([[x - 0.095, 0.96], [x + 0.095, 0.96], [x + 0.085, 1.12], [x - 0.085, 1.12]], { smooth: true, wobble: 0.2 }), c, { mottle: 0.4, light: 0.4, alpha: 0.9 });
        b.paint(b.ellipse(x, 0.875, 0.085, 0.02, 0.2), P.slate, { rim: 0 });
        b.line([[x + 0.03, 0.86], [x + 0.06, 0.78]], P.stone, 0.014, { wobble: 0 });
        b.line([[x - 0.06, 0.98], [x - 0.065, 1.08]], P.white, 0.012, { alpha: 0.6, wobble: 0 });
      }
      papelPicado(b, 0.06, 0.56, 2.14, 0.56, 9, 0.17);
    },
  },

  juice: {
    w: 0.62,
    h: 1.06,
    paint(b) {
      b.line([[0.36, 0.42], [0.46, 0.04]], P.rose, 0.03, { wobble: 0 });
      for (let y = 0.1; y < 0.42; y += 0.08) b.line([[0.45 - (y - 0.04) * 0.26, y], [0.44 - (y - 0.04) * 0.26, y + 0.035]], P.cream, 0.032, { wobble: 0 });
      canopy(b, 0.2, 0.3, 0.14, 0.12, [P.sky, P.butter, P.sky, P.butter]);
      b.line([[0.2, 0.3], [0.24, 0.46]], P.woodDeep, 0.012, { wobble: 0 });
      const glass = b.poly([[0.08, 0.36], [0.54, 0.36], [0.48, 1.04], [0.14, 1.04]], { wobble: 0.3 });
      b.paint(glass, P.skyPale, { alpha: 0.6, mottle: 0.2, rim: 0.2 });
      const juice = b.poly([[0.1, 0.46], [0.52, 0.46], [0.475, 1.0], [0.145, 1.0]], { wobble: 0.3 });
      b.paint(juice, P.orange, { mottle: 0.6, light: 0.4 });
      b.paint(b.ellipse(0.31, 0.46, 0.21, 0.035, 0.3), P.apricot, { rim: 0 });
      b.line([[0.17, 0.52], [0.2, 0.94]], P.white, 0.025, { alpha: 0.45 });
      // Orange wheel on the rim.
      b.paint(b.circle(0.54, 0.38, 0.1, 0.3), P.orange, { mottle: 0.3, rim: 0.15 });
      b.paint(b.circle(0.54, 0.38, 0.075, 0.2), P.butter, { mottle: 0.3, rim: 0 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        b.line([[0.54, 0.38], [0.54 + Math.cos(a) * 0.07, 0.38 + Math.sin(a) * 0.07]], P.cream, 0.008, { wobble: 0 });
      }
    },
  },

  'beach-trash-can': {
    w: 0.64,
    h: 0.86,
    paint(b) {
      const can = b.rect(0.06, 0.22, 0.52, 0.62, 0.06, 0.5);
      b.paint(can, P.sky, { mottle: 0.6 });
      b.ctx.save();
      b.ctx.clip(can.path);
      const wave: [number, number][] = [];
      for (let x = 0; x <= 0.64; x += 0.04) wave.push([x, 0.52 + Math.sin(x * 22) * 0.03]);
      b.line(wave, P.white, 0.05, { wobble: 0 });
      b.line(wave.map(([x, y]) => [x, y + 0.1] as [number, number]), P.skyPale, 0.04, { wobble: 0 });
      b.ctx.restore();
      b.paint(b.rect(0.02, 0.12, 0.6, 0.12, 0.05, 0.3), P.skyDeep, { mottle: 0.4 });
      b.paint(b.rect(0.24, 0.05, 0.16, 0.08, 0.03, 0.2), P.skyDeep, { mottle: 0.2 });
      b.paint(b.rect(0.18, 0.3, 0.28, 0.12, 0.04, 0.2), P.cream, { mottle: 0.2, rim: 0.1 });
      b.line([[0.24, 0.36], [0.4, 0.36]], P.skyDeep, 0.014, { wobble: 0 });
    },
  },

  shower: {
    w: 0.8,
    h: 1.62,
    paint(b) {
      b.paint(b.ellipse(0.4, 1.56, 0.36, 0.06, 1), P.skyLight, { mottle: 0.5, rim: 0, alpha: 0.7 });
      b.paint(b.rect(0.12, 1.44, 0.56, 0.12, 0.02, 0.3), P.wood, { mottle: 0.4 });
      for (let x = 0.18; x < 0.68; x += 0.09) b.line([[x, 1.45], [x, 1.55]], P.woodDeep, 0.01, { alpha: 0.6, wobble: 0 });
      b.paint(b.rect(0.34, 0.16, 0.12, 1.3, 0.04, 0.3), P.wood, { mottle: 0.5, rim: 0.15 });
      b.line([[0.4, 0.3], [0.4, 0.12], [0.16, 0.12], [0.16, 0.2]], P.stone, 0.035, { wobble: 0 });
      b.line([[0.4, 0.12], [0.64, 0.12], [0.64, 0.2]], P.stone, 0.035, { wobble: 0 });
      for (const x of [0.16, 0.64]) {
        b.paint(b.poly([[x - 0.08, 0.26], [x + 0.08, 0.26], [x + 0.04, 0.19], [x - 0.04, 0.19]], { wobble: 0.2 }), P.slate, { rim: 0.1 });
        for (let i = 0; i < 7; i++) {
          const dx = (i - 3) * 0.024;
          const y = 0.34 + ((i * 37) % 5) * 0.09;
          b.line([[x + dx, y], [x + dx * 1.3, y + 0.06]], P.skyDeep, 0.014, { alpha: 0.75, wobble: 0 });
        }
      }
      b.paint(b.circle(0.4, 0.86, 0.05, 0.2), P.ember, { rim: 0.15 });
    },
  },

  money: {
    w: 0.92,
    h: 0.56,
    paint(b) {
      const bill = (cx: number, cy: number, rot: number, color: string) => {
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        const at = (x: number, y: number): [number, number] => [cx + x * c - y * s, cy + x * s + y * c];
        b.paint(b.poly([at(-0.3, -0.14), at(0.3, -0.14), at(0.3, 0.14), at(-0.3, 0.14)], { wobble: 0.2 }), color, { mottle: 0.5, rim: 0.15 });
        b.stroke(b.poly([at(-0.26, -0.1), at(0.26, -0.1), at(0.26, 0.1), at(-0.26, 0.1)], { wobble: 0.1 }), shade(color, -0.25), 0.008, 0.7);
        b.paint(b.ellipse(...at(0, 0), 0.07, 0.08, 0.2, rot), shade(color, 0.25), { mottle: 0.2, rim: 0.1 });
        b.text('$', ...at(0, 0.005), 0.1, shade(color, -0.4), { weight: 800 });
      };
      bill(0.38, 0.26, -0.22, P.sage);
      bill(0.46, 0.3, 0.08, '#9fd3a8');
      for (const [x, y] of [[0.74, 0.5], [0.82, 0.46], [0.78, 0.4]] as [number, number][]) {
        b.paint(b.ellipse(x, y, 0.085, 0.045, 0.2), P.gold, { mottle: 0.3, light: 0.4, rim: 0.15 });
      }
      b.paint(b.circle(0.66, 0.44, 0.07, 0.2), P.stone, { mottle: 0.3, light: 0.5, rim: 0.15 });
    },
  },

  sunscreen: {
    w: 0.44,
    h: 0.92,
    paint(b) {
      b.paint(b.rect(0.12, 0.04, 0.2, 0.16, 0.04, 0.2), P.orange, { mottle: 0.3 });
      const bottle = b.poly([[0.1, 0.2], [0.34, 0.2], [0.42, 0.5], [0.4, 0.9], [0.04, 0.9], [0.02, 0.5]], { smooth: true, wobble: 0.3 });
      b.paint(bottle, P.butter, { mottle: 0.5, light: 0.35 });
      b.paint(b.circle(0.22, 0.52, 0.09, 0.2), P.orange, { mottle: 0.3, rim: 0.1 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        b.line([[0.22 + Math.cos(a) * 0.11, 0.52 + Math.sin(a) * 0.11], [0.22 + Math.cos(a) * 0.15, 0.52 + Math.sin(a) * 0.15]], P.orange, 0.016, { wobble: 0 });
      }
      b.paint(b.rect(0.06, 0.7, 0.32, 0.1, 0.03, 0.2), P.cream, { rim: 0.1 });
      b.text('SPF 50', 0.22, 0.755, 0.06, P.skyDeep, { weight: 800, maxWidth: 0.28 });
      b.paint(b.ellipse(0.38, 0.88, 0.06, 0.025, 0.4), P.white, { rim: 0.2 });
    },
  },

  'beach-bag': {
    w: 0.96,
    h: 0.9,
    paint(b) {
      b.line([[0.24, 0.38], [0.3, 0.06], [0.5, 0.04], [0.56, 0.38]], P.woodDeep, 0.03, { wobble: 0.2 });
      b.line([[0.42, 0.38], [0.5, 0.1], [0.68, 0.08], [0.74, 0.38]], P.wood, 0.03, { wobble: 0.2 });
      b.paint(b.rect(0.28, 0.2, 0.3, 0.26, 0.04, 0.4), P.skyLight, { mottle: 0.3 });
      for (let x = 0.3; x < 0.58; x += 0.07) b.line([[x, 0.22], [x, 0.44]], P.cream, 0.022, { wobble: 0 });
      // A woven market bag in fiesta stripes.
      const bag = b.poly([[0.1, 0.36], [0.86, 0.36], [0.78, 0.88], [0.18, 0.88]], { wobble: 0.4 });
      b.paint(bag, TURQUOISE, { mottle: 0.8 });
      b.ctx.save();
      b.ctx.clip(bag.path);
      for (const [y, c] of [[0.46, ROSA], [0.58, MARIGOLD], [0.7, LIME], [0.82, ROSA]] as [number, string][]) b.paint(b.rect(0, y, 1, 0.06, 0, 0.3), c, { mottle: 0.3, rim: 0 });
      for (let y = 0.4; y < 0.9; y += 0.03) b.line([[0, y], [1, y + 0.01]], P.white, 0.006, { alpha: 0.3 });
      for (let x = 0.1; x < 0.9; x += 0.05) b.line([[x, 0.36], [x - 0.02, 0.9]], shade(TURQUOISE, -0.2), 0.006, { alpha: 0.4 });
      b.ctx.restore();
      // Sunglasses hooked over the rim.
      for (const x of [0.62, 0.76]) b.paint(b.ellipse(x, 0.42, 0.065, 0.05, 0.2), P.charcoal, { mottle: 0.2, rim: 0.1 });
      b.line([[0.68, 0.41], [0.7, 0.41]], P.charcoal, 0.015, { wobble: 0 });
      b.flat(b.circle(0.6, 0.41, 0.015, 0), '#fff', 0.7);
      b.paint(b.poly(star(0.3, 0.7, 0.07, 0.03), { smooth: true, wobble: 0.2 }), P.apricot, { rim: 0.1 });
    },
  },

  'beach-ball': {
    w: 0.6,
    h: 0.6,
    paint(b) {
      const ball = b.circle(0.3, 0.3, 0.28, 0.2);
      b.paint(ball, P.white, { mottle: 0.3, light: 0.3 });
      b.ctx.save();
      b.ctx.clip(ball.path);
      const pole: [number, number] = [0.22, 0.14];
      const colors = [P.ember, P.yellow, P.sky, P.leaf];
      for (let i = 0; i < 4; i++) {
        const a0 = Math.PI * 0.1 + (i * Math.PI * 2) / 4;
        const a1 = a0 + Math.PI / 4.5;
        const far = 0.8;
        b.paint(b.poly([pole, [pole[0] + Math.cos(a0) * far, pole[1] + Math.sin(a0) * far], [pole[0] + Math.cos(a1) * far, pole[1] + Math.sin(a1) * far]], { wobble: 0.2 }), colors[i], { mottle: 0.4, rim: 0 });
      }
      b.ctx.restore();
      b.paint(b.circle(pole[0], pole[1], 0.045, 0.2), P.white, { rim: 0.1 });
      b.glow(0.2, 0.18, 0.1, '#ffffff', 0.5);
    },
  },

  'flip-flops': {
    w: 0.76,
    h: 0.46,
    paint(b) {
      const sandal = (cx: number, cy: number, rot: number, sole: string, strap: string) => {
        b.paint(b.ellipse(cx, cy, 0.1, 0.2, 0.4, rot), sole, { mottle: 0.4, rim: 0.2 });
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        const at = (x: number, y: number): [number, number] => [cx + x * c - y * s, cy + x * s + y * c];
        b.line([at(-0.08, 0.02), at(0, -0.12), at(0.08, 0.02)], strap, 0.03, { wobble: 0 });
        b.flat(b.circle(...at(0, -0.12), 0.018, 0), strap);
      };
      sandal(0.24, 0.24, -0.35, P.pink, P.skyDeep);
      sandal(0.52, 0.24, 0.25, P.skyLight, P.rose);
    },
  },

  surfboard: {
    w: 0.52,
    h: 1.52,
    paint(b) {
      const board = b.poly([[0.26, 0.02], [0.4, 0.3], [0.46, 0.8], [0.42, 1.36], [0.26, 1.42], [0.1, 1.36], [0.06, 0.8], [0.12, 0.3]], { smooth: true, wobble: 0.3 });
      b.paint(board, P.salmon, { mottle: 0.5, light: 0.4 });
      b.ctx.save();
      b.ctx.clip(board.path);
      b.paint(b.rect(0.2, 0, 0.12, 1.5, 0, 0.3), P.butter, { mottle: 0.3, rim: 0 });
      b.ctx.restore();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        b.paint(b.ellipse(0.26 + Math.cos(a) * 0.05, 0.62 + Math.sin(a) * 0.05, 0.05, 0.03, 0.2, a), P.white, { rim: 0.1 });
      }
      b.flat(b.circle(0.26, 0.62, 0.025, 0), P.yellow);
      b.paint(b.ellipse(0.26, 1.42, 0.3, 0.08, 1), P.sandDeep, { mottle: 0.6, rim: 0 });
    },
  },

  // --- Fiesta food and fun ----------------------------------------------------

  grill: {
    w: 1.3,
    h: 1.12,
    paint(b) {
      for (const [x, y, r] of [[0.42, 0.2, 0.07], [0.5, 0.1, 0.055], [0.86, 0.17, 0.06], [0.78, 0.06, 0.045]] as [number, number, number][]) {
        b.paint(b.circle(x, y, r, 0.5), '#e9e6ef', { rim: 0.12, alpha: 0.8 });
      }
      for (const [x0, x1] of [[0.24, 0.14], [1.06, 1.16], [0.52, 0.48], [0.78, 0.82]] as [number, number][]) b.line([[x0, 0.66], [x1, 1.1]], P.charcoal, 0.035, { wobble: 0 });
      b.line([[0.18, 0.92], [1.12, 0.92]], P.charcoal, 0.02, { wobble: 0 });
      b.paint(b.poly([[0.08, 0.44], [1.22, 0.44], [1.12, 0.72], [0.18, 0.72]], { wobble: 0.3 }), P.charcoal, { mottle: 0.5, light: 0.2 });
      b.glow(0.65, 0.44, 0.5, P.orange, 0.55);
      b.paint(b.ellipse(0.65, 0.46, 0.54, 0.055, 0.4), P.ember, { mottle: 0.6, light: 0.5, rim: 0 });
      b.speckle(b.ellipse(0.65, 0.46, 0.5, 0.04, 0.4), P.yellow, 40, 0.01, 0.9);
      b.line([[0.06, 0.42], [1.24, 0.42]], P.slate, 0.02, { wobble: 0 });
      for (let x = 0.12; x < 1.2; x += 0.08) b.line([[x, 0.38], [x, 0.46]], P.slate, 0.01, { wobble: 0 });
      for (const [x, rot] of [[0.3, -0.06], [0.56, 0.05], [0.82, -0.04], [1.06, 0.06]] as [number, number][]) cob(b, x, 0.34, 0.3, rot);
      for (const s of [-1, 1]) b.line([[0.65 + s * 0.6, 0.5], [0.65 + s * 0.66, 0.46]], P.charcoal, 0.03, { wobble: 0 });
    },
  },

  /** Elote: grilled corn on a stick with crema, cheese, chili and a squeeze of lime. */
  elote: {
    w: 0.58,
    h: 1.15,
    paint(b) {
      b.paint(b.ellipse(0.29, 1.1, 0.2, 0.045, 0.6), P.sandDeep, { mottle: 0.4, rim: 0 });
      b.line([[0.29, 0.74], [0.29, 1.1]], P.wood, 0.045, { wobble: 0 });
      const ear = b.ellipse(0.29, 0.42, 0.14, 0.35, 0.3);
      b.paint(ear, P.yellow, { mottle: 0.4, light: 0.35 });
      b.ctx.save();
      b.ctx.clip(ear.path);
      for (let y = 0.1; y < 0.78; y += 0.045) {
        for (let x = 0.17; x < 0.42; x += 0.045) b.flat(b.ellipse(x + ((y * 100) % 2) * 0.01, y, 0.018, 0.016, 0.1), P.butter, 0.8);
      }
      for (const y of [0.24, 0.46]) b.line([[0.15, y], [0.43, y + 0.04]], P.woodDeep, 0.018, { alpha: 0.45, wobble: 0 });
      b.ctx.restore();
      b.line([[0.18, 0.14], [0.4, 0.22], [0.17, 0.32], [0.41, 0.42], [0.17, 0.52], [0.4, 0.62]], P.cream, 0.035, { alpha: 0.95, wobble: 0.3 });
      b.speckle(ear, P.white, 45, 0.012, 0.95);
      b.speckle(ear, P.ember, 60, 0.007, 0.9);
      b.paint(b.poly([[0.32, 0.98], [0.5, 0.86], [0.54, 0.98]], { smooth: true, wobble: 0.2 }), LIME, { mottle: 0.3, rim: 0.12 });
      b.line([[0.36, 0.96], [0.5, 0.9]], shade(LIME, 0.4), 0.012, { wobble: 0 });
    },
  },

  'candy-seller': {
    w: 1.65,
    h: 1.75,
    paint(b) {
      b.line([[1.1, 0.3], [1.1, 1.0]], P.cream, 0.03, { wobble: 0 });
      canopy(b, 1.1, 0.4, 0.08, 0.5, [ROSA, MARIGOLD, TURQUOISE, LIME, ROSA, MARIGOLD]);
      papelPicado(b, 0.62, 0.42, 1.58, 0.42, 5, 0.1);
      person(b, 0.34, 1.72, 1.3, { skin: '#c98a63', hair: P.charcoal, top: TURQUOISE, bottom: TALAVERA, hat: P.butter, hands: [[0.12, 1.02], [0.58, 0.88]] });
      // A lollipop held out to a customer.
      b.line([[0.58, 0.9], [0.6, 0.72]], P.cream, 0.014, { wobble: 0 });
      b.paint(b.circle(0.6, 0.66, 0.07, 0.2), ROSA, { rim: 0.12 });
      b.line([[0.6, 0.66], [0.64, 0.64], [0.63, 0.6], [0.57, 0.62], [0.56, 0.68], [0.62, 0.72]], P.white, 0.012, { alpha: 0.85, wobble: 0 });
      // Jars of sweets and a cup of paletas on the cart.
      for (const [x, c1, c2] of [[0.8, ROSA, MARIGOLD], [0.98, LIME, P.pink], [1.16, TALAVERA, P.yellow], [1.34, MARIGOLD, TURQUOISE]] as [number, string, string][]) {
        b.paint(b.rect(x - 0.07, 0.86, 0.14, 0.18, 0.03, 0.2), P.skyPale, { alpha: 0.6, rim: 0.2 });
        for (let k = 0; k < 6; k++) b.paint(b.circle(x - 0.04 + (k % 3) * 0.04, 0.93 + Math.floor(k / 3) * 0.05, 0.022, 0.2), k % 2 ? c1 : c2, { rim: 0 });
        b.paint(b.rect(x - 0.075, 0.84, 0.15, 0.03, 0.01, 0.2), P.slate, { rim: 0 });
      }
      for (const [x, y, c] of [[1.46, 0.74, ROSA], [1.52, 0.8, MARIGOLD], [1.42, 0.82, LIME]] as [number, number, string][]) {
        b.line([[1.48, 1.0], [x, y]], P.cream, 0.012, { wobble: 0 });
        b.paint(b.circle(x, y, 0.045, 0.2), c, { rim: 0.12 });
      }
      b.paint(b.rect(1.4, 0.94, 0.16, 0.1, 0.02, 0.2), TURQUOISE, { rim: 0.1 });
      const cart = b.rect(0.66, 1.04, 0.94, 0.42, 0.04, 0.4);
      b.paint(cart, ROSA, { mottle: 0.6, light: 0.2 });
      b.paint(b.rect(0.62, 1.0, 1.02, 0.07, 0.02, 0.3), MARIGOLD, { mottle: 0.3 });
      b.paint(b.rect(0.78, 1.14, 0.7, 0.2, 0.05, 0.3), P.cream, { rim: 0.12 });
      b.text('DULCES', 1.13, 1.245, 0.12, ROSA, { weight: 800 });
      wheel(b, 0.84, 1.54, 0.16, MARIGOLD);
      wheel(b, 1.42, 1.54, 0.16, MARIGOLD);
    },
  },

  /** A hand-cranked music box painted like talavera tiles, with a twirling dancer. */
  'music-box': {
    w: 1.0,
    h: 1.0,
    paint(b) {
      const lid = b.poly([[0.2, 0.46], [0.86, 0.46], [0.92, 0.1], [0.26, 0.1]], { wobble: 0.2 });
      b.paint(lid, P.cream, { mottle: 0.4 });
      b.stroke(b.poly([[0.25, 0.42], [0.82, 0.42], [0.87, 0.14], [0.3, 0.14]], { wobble: 0.1 }), TALAVERA, 0.025, 0.9);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        b.paint(b.ellipse(0.56 + Math.cos(a) * 0.07, 0.28 + Math.sin(a) * 0.06, 0.035, 0.02, 0.1, a), TALAVERA, { rim: 0 });
      }
      b.flat(b.circle(0.56, 0.28, 0.03, 0), MARIGOLD);
      b.paint(b.poly([[0.12, 0.52], [0.8, 0.52], [0.88, 0.46], [0.2, 0.46]], { wobble: 0.2 }), ROSA, { mottle: 0.3, rim: 0.1 });
      // Folk dancer twirling her ribboned skirt.
      b.line([[0.5, 0.5], [0.5, 0.42]], P.gold, 0.015, { wobble: 0 });
      b.paint(b.poly([[0.5, 0.26], [0.66, 0.42], [0.58, 0.4], [0.5, 0.44], [0.42, 0.4], [0.34, 0.42]], { smooth: true, wobble: 0.2 }), ROSA, { mottle: 0.3, rim: 0.12 });
      for (const [i, c] of [MARIGOLD, TURQUOISE, LIME].entries()) b.line([[0.38 + i * 0.01, 0.39 - i * 0.03], [0.62 - i * 0.01, 0.39 - i * 0.03]], c, 0.014, { wobble: 0 });
      b.line([[0.5, 0.27], [0.4, 0.18]], '#c98a63', 0.014, { wobble: 0 });
      b.line([[0.5, 0.27], [0.6, 0.18]], '#c98a63', 0.014, { wobble: 0 });
      b.paint(b.rect(0.47, 0.2, 0.06, 0.08, 0.02, 0.2), P.white, { rim: 0.1 });
      b.paint(b.circle(0.5, 0.16, 0.035, 0.2), '#c98a63', { rim: 0.1 });
      b.paint(b.ellipse(0.5, 0.14, 0.04, 0.025, 0.2), P.charcoal, { rim: 0 });
      b.paint(b.circle(0.53, 0.12, 0.015, 0), ROSA, { rim: 0 });
      // The box itself, with tiles on the front and a crank on the side.
      b.paint(b.poly([[0.8, 0.52], [0.88, 0.46], [0.88, 0.84], [0.8, 0.92]], { wobble: 0.2 }), shade(P.wood, -0.15), { mottle: 0.4 });
      const front = b.rect(0.12, 0.52, 0.68, 0.4, 0.02, 0.3);
      b.paint(front, P.wood, { mottle: 0.6, light: 0.25 });
      for (const x of [0.2, 0.37, 0.54]) {
        b.paint(b.rect(x, 0.6, 0.15, 0.15, 0.01, 0.2), P.cream, { rim: 0.1 });
        b.flat(b.poly([[x + 0.075, 0.62], [x + 0.13, 0.675], [x + 0.075, 0.73], [x + 0.02, 0.675]], { wobble: 0 }), TALAVERA, 0.9);
        b.flat(b.circle(x + 0.075, 0.675, 0.018, 0), MARIGOLD);
      }
      b.flat(b.circle(0.46, 0.84, 0.018, 0), P.charcoal);
      for (const x of [0.18, 0.74]) b.paint(b.circle(x, 0.95, 0.035, 0.2), P.gold, { rim: 0.1 });
      b.line([[0.88, 0.66], [0.95, 0.62], [0.95, 0.54]], P.slate, 0.02, { wobble: 0 });
      b.paint(b.circle(0.95, 0.53, 0.025, 0.2), ROSA, { rim: 0 });
      // Notes drifting out.
      for (const [x, y, c] of [[0.9, 0.3, TALAVERA], [0.1, 0.24, ROSA], [0.97, 0.12, MARIGOLD]] as [number, number, string][]) {
        b.flat(b.ellipse(x, y, 0.028, 0.022, 0, -0.4), c);
        b.line([[x + 0.024, y], [x + 0.024, y - 0.1], [x + 0.06, y - 0.07]], c, 0.012, { wobble: 0 });
      }
    },
  },

  agave: {
    w: 0.95,
    h: 0.72,
    paint(b) {
      for (const [a, len, c] of [[-1.35, 0.42, '#6f9f8f'], [1.35, 0.42, '#6f9f8f'], [-0.9, 0.5, '#7fb3a0'], [0.9, 0.5, '#7fb3a0'], [-0.4, 0.6, '#8cc0ac'], [0.4, 0.6, '#8cc0ac'], [0, 0.66, '#7fb3a0']] as [number, number, string][]) {
        const dx = Math.sin(a);
        const dy = -Math.cos(a);
        b.paint(b.poly([[0.475 - dy * 0.05, 0.7 + dx * 0.05], [0.475 + dx * len, 0.7 + dy * len], [0.475 + dy * 0.05, 0.7 - dx * 0.05]], { wobble: 0.2 }), c, { mottle: 0.4, light: 0.3, rim: 0.15 });
      }
    },
  },

  nopal: {
    w: 0.85,
    h: 1.15,
    paint(b) {
      b.paint(b.ellipse(0.42, 1.1, 0.26, 0.05, 0.6), P.sandDeep, { mottle: 0.4, rim: 0 });
      const pads: [number, number, number, number, number][] = [[0.42, 0.84, 0.18, 0.25, 0], [0.24, 0.52, 0.14, 0.2, -0.4], [0.6, 0.48, 0.14, 0.2, 0.35], [0.46, 0.22, 0.11, 0.15, 0.1]];
      for (const [x, y, rx, ry, rot] of pads) {
        const pad = b.ellipse(x, y, rx, ry, 0.4, rot);
        b.paint(pad, P.leaf, { mottle: 0.5, light: 0.3 });
        b.speckle(pad, P.cream, 12, 0.008, 0.9);
      }
      for (const [x, y] of [[0.36, 0.08], [0.52, 0.07], [0.72, 0.3], [0.12, 0.36]] as Pt[]) b.paint(b.ellipse(x, y, 0.045, 0.06, 0.2), ROSA, { mottle: 0.3, rim: 0.12 });
    },
  },
};
