import { P, shade } from '../paint/color';
import { type PainterMap, canopy, ripple } from './common';

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

  bucket: {
    w: 0.45,
    h: 0.42,
    paint(b) {
      b.stroke(b.ellipse(0.22, 0.14, 0.17, 0.12, 0.3), P.slate, 0.015);
      b.paint(b.poly([[0.04, 0.14], [0.4, 0.14], [0.34, 0.42], [0.1, 0.42]], { wobble: 0.5 }), P.sky);
      b.paint(b.ellipse(0.22, 0.14, 0.18, 0.04), shade(P.sky, -0.25), { mottle: 0.2 });
      b.line([[0.36, 0.3], [0.44, 0.02]], P.butter, 0.03);
      b.paint(b.ellipse(0.44, 0.02, 0.04, 0.05), P.butter, { rim: 0 });
    },
  },
};
