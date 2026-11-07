import { P, shade } from '../paint/color';
import { type PainterMap, canopy, person, ripple } from './common';

function star(cx: number, cy: number, outer: number, inner: number, rotation = -Math.PI / 2): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
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
      canopy(b, 0.8, 0.62, 0.1, 0.78, [P.rose, P.cream, P.sky, P.cream, P.rose, P.cream]);
      b.paint(b.circle(0.8, 0.08, 0.05), P.raspberry, { rim: 0 });
    },
  },

  sandcastle: {
    w: 1.25,
    h: 0.98,
    paint(b) {
      const sand = P.sandDeep;
      const tower = (x: number, y: number, w: number, h: number) => {
        b.paint(b.rect(x, y, w, h, 0.03, 1.2), sand, { mottle: 1 });
        for (let i = 0; i < 3; i++) b.paint(b.rect(x + i * (w / 2.5), y - 0.07, w / 5, 0.09, 0.015), sand, { mottle: 0.4 });
      };
      tower(0.08, 0.42, 0.28, 0.56);
      tower(0.89, 0.42, 0.28, 0.56);
      tower(0.4, 0.22, 0.45, 0.76);
      b.paint(b.rect(0.0, 0.74, 1.25, 0.24, 0.06, 1.5), sand, { mottle: 1 });
      b.paint(b.poly([[0.52, 0.98], [0.52, 0.76], [0.62, 0.68], [0.72, 0.76], [0.72, 0.98]], { smooth: true }), shade(sand, -0.3), { mottle: 0.4 });
      b.line([[0.625, 0.18], [0.625, 0.0]], P.woodDeep, 0.02);
      b.paint(b.poly([[0.63, 0.0], [0.8, 0.05], [0.63, 0.1]], { wobble: 0.3 }), P.rose, { rim: 0 });
      b.paint(b.circle(0.22, 0.6, 0.04), P.pink, { rim: 0.1 });
      b.paint(b.circle(1.03, 0.62, 0.04), P.lilac, { rim: 0.1 });
      b.paint(b.circle(0.5, 0.4, 0.035), P.cream, { rim: 0.1 });
      b.speckle(b.rect(0, 0.2, 1.25, 0.8, 0, 0), shade(sand, -0.3), 90, 0.008, 0.4);
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
      const towel = b.poly([[0.24, 0.1], [1.06, 0.1], [1.26, 0.5], [0.04, 0.5]], { wobble: 0.4 });
      b.paint(towel, P.rose, { mottle: 0.5, light: 0.3 });
      b.ctx.save();
      b.ctx.clip(towel.path);
      for (let i = 0; i < 9; i++) {
        const t = (i + 0.5) / 9;
        const c = i % 3 === 0 ? P.cream : i % 3 === 1 ? P.butter : P.skyLight;
        b.line([[0.24 + t * 0.82, 0.08], [0.04 + t * 1.22, 0.52]], c, 0.035, { wobble: 0.2, alpha: 0.9 });
      }
      b.ctx.restore();
      for (let x = 0.08; x < 1.24; x += 0.045) b.line([[x, 0.5], [x - 0.006, 0.54]], P.cream, 0.008, { wobble: 0 });
      for (let x = 0.26; x < 1.06; x += 0.04) b.line([[x, 0.1], [x + 0.004, 0.065]], P.cream, 0.007, { wobble: 0 });
      b.paint(b.poly([[1.02, 0.1], [1.06, 0.1], [1.14, 0.26], [0.96, 0.22]], { wobble: 0.3 }), shade(P.rose, -0.15), { rim: 0.1 });
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
      person(b, 0.3, 1.22, 1.18, { skin: '#c98a63', hair: P.charcoal, top: P.teal, bottom: P.skyDeep, hands: [[0.06, 0.74], [0.53, 0.72]] });
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
        b.paint(part, P.teal, { mottle: 0.4 });
        b.ctx.save();
        b.ctx.clip(part.path);
        for (let x = 0.0; x < 1.6; x += 0.16) b.paint(b.rect(x, 0, 0.07, 0.9, 0, 0.2), P.cream, { mottle: 0.2, rim: 0 });
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
      // Counter with a sign and fruit on top.
      const counter = b.rect(0.12, 1.2, 1.96, 0.78, 0.03, 0.5);
      b.paint(counter, P.teal, { mottle: 0.8 });
      for (let x = 0.2; x < 2.06; x += 0.16) b.line([[x, 1.22], [x, 1.96]], shade(P.teal, -0.15), 0.01, { alpha: 0.5 });
      b.paint(b.rect(0.06, 1.14, 2.08, 0.08, 0.02, 0.3), P.cream, { mottle: 0.3 });
      b.paint(b.rect(0.6, 1.36, 1.0, 0.34, 0.08, 0.3), P.cream, { mottle: 0.3, rim: 0.15 });
      b.text('JUICE', 1.1, 1.54, 0.2, P.orange, { weight: 800 });
      b.paint(b.circle(0.4, 1.06, 0.08, 0.3), P.orange, { mottle: 0.4, light: 0.4 });
      b.paint(b.circle(0.52, 1.08, 0.065, 0.3), P.yellow, { mottle: 0.4, light: 0.4 });
      b.paint(b.poly([[1.84, 1.14], [2.06, 1.14], [1.95, 0.98]], { smooth: true }), P.rose, { rim: 0.12 });
      b.paint(b.poly([[1.86, 1.14], [2.04, 1.14], [1.95, 1.06]], { smooth: true }), P.leaf, { rim: 0 });
      for (const [x, c] of [[1.12, P.orange], [1.28, P.pink], [1.44, P.yellow]] as [number, string][]) {
        b.paint(b.poly([[x - 0.045, 0.96], [x + 0.045, 0.96], [x + 0.035, 1.14], [x - 0.035, 1.14]], { wobble: 0.2 }), c, { mottle: 0.3, rim: 0.15 });
        b.line([[x + 0.01, 0.97], [x + 0.04, 0.88]], P.white, 0.012, { wobble: 0 });
      }
      for (let i = 0; i < 9; i++) {
        const x = 0.3 + i * 0.2;
        b.paint(b.poly([[x - 0.07, 0.6], [x + 0.07, 0.6], [x, 0.72]], { wobble: 0.2 }), [P.rose, P.butter, P.sky][i % 3], { rim: 0.1 });
      }
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
      const bag = b.poly([[0.1, 0.36], [0.86, 0.36], [0.78, 0.88], [0.18, 0.88]], { wobble: 0.4 });
      b.paint(bag, '#e3b878', { mottle: 0.8 });
      b.ctx.save();
      b.ctx.clip(bag.path);
      for (let y = 0.4; y < 0.9; y += 0.06) b.line([[0, y], [1, y + 0.01]], shade('#e3b878', -0.18), 0.012, { alpha: 0.6 });
      for (let x = 0.1; x < 0.9; x += 0.06) b.line([[x, 0.36], [x - 0.02, 0.9]], shade('#e3b878', 0.15), 0.008, { alpha: 0.5 });
      b.paint(b.rect(0, 0.5, 1, 0.08, 0, 0.3), P.rose, { mottle: 0.3, rim: 0 });
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
};
