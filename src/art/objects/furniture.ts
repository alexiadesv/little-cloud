import type { Brush } from '../paint/brush';
import { P, mix, shade } from '../paint/color';
import { type PainterMap, windows } from './common';

type Pt = [number, number];

function legs(b: Brush, xs: number[], y: number, h: number, color: string = P.charcoal) {
  for (const x of xs) b.paint(b.rect(x, y, 0.06, h, 0.02, 0.2), color, { mottle: 0.3 });
}

function seat(b: Brush, x: number, y: number, w: number, h: number, color: string) {
  b.paint(b.rect(x, y, w, h, 0.06, 0.3), color, { mottle: 0.5, light: 0.25, rim: 0.12 });
}

/**
 * Soft velvety tube for the Bold Chair — shaded sausage strokes that read
 * like BIG-GAME's knitted tubular frame.
 */
function tube(b: Brush, pts: Pt[], width: number, color: string) {
  b.line(pts, shade(color, -0.38), width * 1.18, { wobble: 0.05, cap: 'round' });
  b.line(pts, shade(color, -0.12), width * 1.06, { wobble: 0.04, cap: 'round' });
  b.line(pts, color, width, { wobble: 0.03, cap: 'round' });
  b.line(
    pts.map(([x, y]) => [x - width * 0.18, y - width * 0.22]),
    mix(color, P.white, 0.48),
    width * 0.34,
    { wobble: 0.02, cap: 'round', alpha: 0.82 },
  );
  b.line(
    pts.map(([x, y]) => [x - width * 0.08, y - width * 0.1]),
    mix(color, P.white, 0.22),
    width * 0.14,
    { wobble: 0.02, cap: 'round', alpha: 0.55 },
  );
}

function footCap(b: Brush, x: number, y: number, r: number, color: string) {
  b.paint(b.ellipse(x, y + r * 0.35, r * 1.05, r * 0.42, 0.2), shade(color, -0.35), { mottle: 0.2, rim: 0 });
  b.paint(b.circle(x, y, r, 0.2), color, { mottle: 0.35, light: 0.2, rim: 0.1 });
  b.glow(x - r * 0.25, y - r * 0.3, r * 0.35, P.white, 0.35);
}

export const furniturePainters: PainterMap = {
  /**
   * Bold Chair by BIG-GAME — two continuous ultramarine tubes in 3/4 view:
   * backrest loop plunging into the front legs, seat U becoming the rear legs.
   */
  'bold-chair': {
    w: 1.72,
    h: 1.78,
    paint(b) {
      const blue = '#1f35ff';
      const w = 0.22;
      // Seat U → rear legs (farther / slightly darker).
      tube(
        b,
        [
          [0.18, 1.62],
          [0.22, 1.2],
          [0.28, 0.98],
          [0.48, 0.9],
          [0.78, 0.88],
          [1.12, 0.92],
          [1.3, 1.02],
          [1.38, 1.22],
          [1.42, 1.62],
        ],
        w * 0.96,
        shade(blue, -0.06),
      );
      footCap(b, 0.18, 1.64, 0.1, blue);
      footCap(b, 1.42, 1.64, 0.1, blue);

      // Tall backrest rectangle that becomes the front legs.
      tube(
        b,
        [
          [0.52, 1.64],
          [0.48, 1.15],
          [0.46, 0.62],
          [0.48, 0.28],
          [0.58, 0.14],
          [0.78, 0.1],
          [1.0, 0.12],
          [1.14, 0.24],
          [1.2, 0.55],
          [1.24, 1.05],
          [1.26, 1.64],
        ],
        w,
        blue,
      );
      footCap(b, 0.52, 1.66, 0.1, blue);
      footCap(b, 1.26, 1.66, 0.1, blue);

      // Where the seat nestles into the uprights.
      b.paint(b.circle(0.5, 0.92, 0.11, 0.2), blue, { mottle: 0.3, light: 0.15, rim: 0 });
      b.paint(b.circle(1.18, 0.94, 0.11, 0.2), blue, { mottle: 0.3, light: 0.15, rim: 0 });
      b.glow(0.78, 0.16, 0.16, P.white, 0.32);
      b.glow(0.55, 0.55, 0.12, mix(blue, P.white, 0.4), 0.3);
    },
  },

  'subway-sign': {
    w: 1.35,
    h: 1.0,
    paint(b) {
      b.paint(b.rect(0.06, 0.1, 1.22, 0.8, 0.05, 0.3), P.charcoal, { mottle: 0.4 });
      b.paint(b.rect(0.14, 0.18, 1.06, 0.64, 0.04, 0.3), '#1d4f91', { mottle: 0.3, light: 0.2 });
      b.paint(b.circle(0.4, 0.5, 0.2, 0.2), P.white, { rim: 0.1 });
      b.text('A', 0.4, 0.52, 0.2, '#1d4f91', { weight: 800 });
      b.text('SUBWAY', 0.86, 0.42, 0.11, P.white, { weight: 800, maxWidth: 0.65 });
      b.text('UPTOWN', 0.86, 0.62, 0.1, P.butter, { weight: 700, maxWidth: 0.6 });
    },
  },

  'basketball-lamp': {
    w: 1.9,
    h: 2.05,
    paint(b) {
      // Short ceiling mount + cord so the ball hangs under the ceiling plane.
      b.paint(b.ellipse(0.95, 0.06, 0.16, 0.05, 0.2), P.slate, { mottle: 0.3, rim: 0.1 });
      b.line([[0.95, 0.06], [0.95, 0.38]], P.charcoal, 0.035, { wobble: 0 });
      b.paint(b.ellipse(0.95, 0.4, 0.1, 0.04, 0.2), shade(P.charcoal, 0.15), { mottle: 0.2 });

      const cx = 0.95;
      const cy = 1.2;
      const r = 0.78;
      b.glow(cx, cy, r * 1.55, P.butter, 0.55);
      b.glow(cx, cy, r * 1.15, mix(P.orange, P.butter, 0.4), 0.62);
      b.glow(cx, cy + 0.35, r * 0.9, P.apricot, 0.35);
      b.paint(b.circle(cx, cy, r, 0.25), P.orange, { mottle: 0.45, light: 0.45, rim: 0.12 });
      b.paint(b.circle(cx, cy, r * 0.9, 0.2), mix(P.orange, P.butter, 0.28), { mottle: 0.3, light: 0.4, rim: 0 });
      b.line([[cx - r * 0.92, cy], [cx + r * 0.92, cy]], P.charcoal, 0.028, { wobble: 0 });
      b.line([[cx, cy - r * 0.92], [cx, cy + r * 0.92]], P.charcoal, 0.028, { wobble: 0 });
      b.line([[cx - r * 0.68, cy - r * 0.62], [cx, cy], [cx + r * 0.68, cy - r * 0.62]], P.charcoal, 0.024, { wobble: 0 });
      b.line([[cx - r * 0.68, cy + r * 0.62], [cx, cy], [cx + r * 0.68, cy + r * 0.62]], P.charcoal, 0.024, { wobble: 0 });
      b.glow(cx - 0.28, cy - 0.28, 0.32, P.white, 0.55);
      b.glow(cx, cy, 0.22, P.butter, 0.5);
    },
  },

  'cube-table': {
    w: 2.95,
    h: 1.72,
    paint(b) {
      const red = '#e02323';
      const ball = (x: number, y: number, r: number) => {
        b.paint(b.ellipse(x, y + r * 0.55, r * 1.1, r * 0.38, 0.25), shade(red, -0.4), { mottle: 0.2, rim: 0, alpha: 0.45 });
        b.paint(b.circle(x, y, r, 0.28), shade(red, -0.12), { mottle: 0.4, rim: 0.1 });
        b.paint(b.circle(x, y - 0.03, r * 0.88, 0.22), red, { mottle: 0.4, light: 0.42, rim: 0.1 });
        b.glow(x - r * 0.32, y - r * 0.38, r * 0.42, P.white, 0.55);
      };
      // Back legs peeking under the table, then big front balls.
      ball(0.58, 1.08, 0.3);
      ball(2.38, 1.06, 0.3);
      const cells = [P.raspberry, P.butter, P.skyDeep, P.leaf, P.orange, P.white, P.sky, P.gold, P.ember];
      b.paint(b.rect(0.3, 0.1, 2.35, 0.78, 0.1, 0.2), P.charcoal, { mottle: 0.3 });
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          b.paint(b.rect(0.42 + c * 0.72, 0.18 + r * 0.22, 0.66, 0.2, 0.04, 0.2), cells[r * 3 + c], { mottle: 0.3, light: 0.22, rim: 0.1 });
        }
      }
      b.glow(0.78, 0.22, 0.22, P.white, 0.28);
      ball(0.7, 1.38, 0.4);
      ball(2.22, 1.36, 0.4);
    },
  },

  'locker-tv': {
    w: 1.7,
    h: 1.55,
    paint(b) {
      b.paint(b.rect(0.1, 0.58, 1.5, 0.88, 0.05, 0.3), mix(P.slate, P.charcoal, 0.2), { mottle: 0.5, light: 0.15 });
      for (const x of [0.2, 0.86]) {
        b.paint(b.rect(x, 0.68, 0.54, 0.68, 0.04, 0.3), P.slate, { mottle: 0.4 });
        b.flat(b.circle(x + 0.44, 1.0, 0.04, 0), P.gold);
        for (let i = 0; i < 4; i++) b.line([[x + 0.08, 0.78 + i * 0.12], [x + 0.46, 0.78 + i * 0.12]], shade(P.slate, -0.2), 0.012, { wobble: 0 });
      }
      b.paint(b.rect(0.22, 0.08, 1.26, 0.52, 0.05, 0.3), P.charcoal, { mottle: 0.3 });
      b.paint(b.rect(0.3, 0.16, 1.1, 0.36, 0.03, 0.2), P.skyDeep, { mottle: 0.4, light: 0.28, rim: 0.1 });
      b.glow(0.7, 0.3, 0.22, P.skyLight, 0.5);
    },
  },

  'floor-cushions': {
    w: 1.15,
    h: 0.55,
    paint(b) {
      const colors = [P.magenta, P.gold, P.teal, P.raspberry];
      for (const [i, c] of colors.entries()) {
        const x = 0.16 + (i % 2) * 0.46;
        const y = 0.12 + Math.floor(i / 2) * 0.18;
        b.paint(b.ellipse(x, y, 0.28, 0.12, 0.4), c, { mottle: 0.45, light: 0.25, rim: 0.12 });
        b.paint(b.ellipse(x - 0.04, y - 0.02, 0.12, 0.05, 0.3), shade(c, 0.25), { rim: 0, alpha: 0.7 });
      }
    },
  },

  'elephant-statue': {
    w: 1.15,
    h: 1.05,
    paint(b) {
      const gold = P.gold;
      b.paint(b.ellipse(0.52, 0.62, 0.32, 0.22, 0.35), gold, { mottle: 0.45, light: 0.25 });
      b.paint(b.circle(0.78, 0.42, 0.16, 0.3), gold, { mottle: 0.4, light: 0.3, rim: 0.12 });
      b.paint(b.poly([[0.82, 0.5], [0.98, 0.78], [0.86, 0.82], [0.78, 0.56]], { smooth: true, wobble: 0.3 }), gold, { mottle: 0.3 });
      b.paint(b.ellipse(0.72, 0.28, 0.07, 0.12, 0.3), gold, { mottle: 0.3 });
      b.paint(b.ellipse(0.88, 0.3, 0.07, 0.12, 0.3), gold, { mottle: 0.3 });
      for (const x of [0.28, 0.44, 0.58, 0.7]) b.paint(b.rect(x, 0.78, 0.1, 0.22, 0.03, 0.2), shade(gold, -0.15), { mottle: 0.3 });
      b.flat(b.circle(0.84, 0.4, 0.018, 0), P.ink);
      b.paint(b.ellipse(0.52, 1.0, 0.38, 0.05, 0.5), P.wood, { mottle: 0.3, rim: 0 });
    },
  },

  'tuktuk-sofa': {
    w: 1.85,
    h: 1.22,
    paint(b) {
      b.paint(b.rect(0.12, 0.48, 1.2, 0.42, 0.08, 0.3), P.magenta, { mottle: 0.45, light: 0.25 });
      b.paint(b.rect(0.18, 0.18, 0.7, 0.38, 0.08, 0.3), P.gold, { mottle: 0.4, light: 0.3, rim: 0.1 });
      b.paint(b.poly([[1.2, 0.52], [1.2, 0.22], [1.62, 0.28], [1.7, 0.7]], { wobble: 0.3 }), P.teal, { mottle: 0.4, light: 0.25 });
      b.paint(b.rect(1.28, 0.38, 0.28, 0.16, 0.03, 0.2), P.skyPale, { mottle: 0.3, rim: 0.1, alpha: 0.85 });
      b.paint(b.circle(0.42, 1.02, 0.16, 0.3), P.charcoal, { mottle: 0.4 });
      b.paint(b.circle(1.42, 1.02, 0.18, 0.3), P.charcoal, { mottle: 0.4 });
      b.paint(b.rect(0.22, 0.52, 0.28, 0.16, 0.04, 0.2), P.cream, { mottle: 0.3 });
      b.paint(b.rect(0.58, 0.52, 0.28, 0.16, 0.04, 0.2), P.cream, { mottle: 0.3 });
    },
  },

  'spirit-house': {
    w: 0.95,
    h: 1.22,
    paint(b) {
      b.paint(b.rect(0.22, 0.92, 0.5, 0.22, 0.03, 0.3), P.gold, { mottle: 0.4 });
      b.paint(b.rect(0.28, 0.48, 0.38, 0.46, 0.04, 0.3), mix(P.cream, P.gold, 0.35), { mottle: 0.4, light: 0.25 });
      const roof = b.poly([[0.08, 0.52], [0.47, 0.08], [0.86, 0.52]], { wobble: 0.2 });
      b.paint(roof, P.terracotta, { mottle: 0.45, light: 0.2 });
      b.paint(b.rect(0.4, 0.62, 0.14, 0.22, 0.02, 0.2), P.woodDeep, { mottle: 0.3 });
      b.paint(b.circle(0.34, 0.42, 0.04, 0.2), P.raspberry, { rim: 0.1 });
      b.paint(b.circle(0.6, 0.42, 0.04, 0.2), P.gold, { rim: 0.1 });
      b.glow(0.47, 0.2, 0.1, P.butter, 0.4);
    },
  },

  'plastic-stool': {
    w: 0.78,
    h: 0.62,
    paint(b) {
      const c = P.ember;
      b.paint(b.ellipse(0.39, 0.16, 0.3, 0.1, 0.4), c, { mottle: 0.4, light: 0.3, rim: 0.12 });
      for (const x of [0.16, 0.56]) b.paint(b.rect(x, 0.18, 0.07, 0.38, 0.02, 0.2), shade(c, -0.1), { mottle: 0.3 });
      b.paint(b.ellipse(0.39, 0.56, 0.28, 0.06, 0.4), shade(c, -0.2), { mottle: 0.3, rim: 0 });
    },
  },

  chihuahua: {
    w: 0.85,
    h: 0.78,
    paint(b) {
      const fur = P.sandDeep;
      b.paint(b.ellipse(0.4, 0.52, 0.2, 0.14, 0.3), fur, { mottle: 0.4, light: 0.3 });
      b.paint(b.circle(0.58, 0.32, 0.14, 0.3), fur, { mottle: 0.4, light: 0.35, rim: 0.12 });
      b.paint(b.poly([[0.48, 0.22], [0.42, 0.02], [0.56, 0.18]], { wobble: 0.2 }), fur, { mottle: 0.3 });
      b.paint(b.poly([[0.66, 0.18], [0.78, 0.0], [0.72, 0.24]], { wobble: 0.2 }), fur, { mottle: 0.3 });
      b.paint(b.ellipse(0.7, 0.36, 0.05, 0.04, 0.2), P.pink, { rim: 0 });
      for (const s of [-1, 1]) b.flat(b.circle(0.58 + s * 0.05, 0.3, 0.016, 0), P.ink);
      b.paint(b.ellipse(0.22, 0.48, 0.05, 0.08, 0.3), fur, { mottle: 0.3 });
      b.paint(b.rect(0.32, 0.42, 0.16, 0.1, 0.03, 0.2), P.raspberry, { mottle: 0.3 });
    },
  },

  'hammock-chair': {
    w: 1.15,
    h: 1.42,
    paint(b) {
      b.paint(b.rect(0.5, 0.08, 0.08, 1.22, 0.03, 0.2), P.wood, { mottle: 0.4 });
      const sling = b.poly([[0.18, 0.42], [0.52, 0.28], [0.92, 0.5], [0.78, 1.12], [0.22, 1.02]], { smooth: true, wobble: 0.35 });
      b.paint(sling, P.ember, { mottle: 0.5, light: 0.25 });
      b.ctx.save();
      b.ctx.clip(sling.path);
      for (let i = 0; i < 7; i++) b.line([[0.1, 0.4 + i * 0.1], [1.0, 0.48 + i * 0.1]], i % 2 ? P.butter : P.teal, 0.045, { wobble: 0.2 });
      b.ctx.restore();
      b.paint(b.ellipse(0.54, 1.36, 0.22, 0.05, 0.4), P.woodDeep, { mottle: 0.3, rim: 0 });
    },
  },

  'beach-mat': {
    w: 1.45,
    h: 0.42,
    paint(b) {
      const mat = b.ellipse(0.72, 0.22, 0.66, 0.16, 0.6);
      b.paint(mat, mix(P.sand, P.gold, 0.35), { mottle: 0.6, rim: 0.12 });
      b.ctx.save();
      b.ctx.clip(mat.path);
      for (let i = 0; i < 14; i++) b.line([[0.08 + i * 0.1, 0.04], [0.08 + i * 0.1, 0.4]], shade(P.wood, 0.1), 0.012, { alpha: 0.55, wobble: 0.15 });
      b.ctx.restore();
      b.line([[0.12, 0.12], [1.32, 0.12], [1.32, 0.32], [0.12, 0.32]], P.terracotta, 0.02, { wobble: 0.2 });
    },
  },

  chiminea: {
    w: 0.85,
    h: 1.18,
    paint(b) {
      b.paint(b.ellipse(0.42, 1.1, 0.28, 0.07, 0.4), P.terracotta, { mottle: 0.4 });
      b.paint(b.poly([[0.16, 0.92], [0.22, 0.42], [0.62, 0.42], [0.68, 0.92]], { smooth: true, wobble: 0.3 }), P.terracotta, { mottle: 0.5, light: 0.2 });
      b.paint(b.rect(0.34, 0.12, 0.16, 0.34, 0.05, 0.3), P.terracotta, { mottle: 0.4 });
      b.paint(b.ellipse(0.42, 0.12, 0.12, 0.05, 0.3), P.terracotta, { mottle: 0.3, rim: 0.1 });
      const mouth = b.ellipse(0.42, 0.7, 0.14, 0.16, 0.3);
      b.paint(mouth, P.charcoal, { mottle: 0.3, rim: 0 });
      b.glow(0.42, 0.7, 0.16, P.orange, 0.55);
      b.paint(b.circle(0.4, 0.66, 0.05, 0.2), P.gold, { rim: 0 });
    },
  },

  'cactus-lamp': {
    w: 0.85,
    h: 1.48,
    paint(b) {
      b.paint(b.ellipse(0.42, 1.4, 0.22, 0.07, 0.4), P.terracotta, { mottle: 0.4, rim: 0.1 });
      b.paint(b.rect(0.28, 0.42, 0.28, 0.98, 0.12, 0.3), P.leaf, { mottle: 0.5, light: 0.25 });
      b.paint(b.rect(0.08, 0.62, 0.22, 0.16, 0.1, 0.3), P.leafDeep, { mottle: 0.4 });
      b.paint(b.rect(0.54, 0.72, 0.22, 0.14, 0.1, 0.3), P.leafDeep, { mottle: 0.4 });
      b.glow(0.42, 0.28, 0.22, '#7dffb0', 0.55);
      b.paint(b.ellipse(0.42, 0.32, 0.16, 0.12, 0.3), mix(P.leaf, '#b6ffd4', 0.4), { mottle: 0.3, light: 0.4, rim: 0.1 });
      for (const [x, y] of [[0.32, 0.7], [0.5, 0.9], [0.36, 1.1]] as Pt[]) b.line([[x, y], [x + 0.04, y - 0.04]], P.cream, 0.01, { wobble: 0 });
    },
  },

  'lantern-lamp': {
    w: 0.85,
    h: 1.42,
    paint(b) {
      b.paint(b.rect(0.38, 0.55, 0.08, 0.82, 0.03, 0.2), P.wood, { mottle: 0.4 });
      b.paint(b.ellipse(0.42, 1.36, 0.16, 0.05, 0.4), P.woodDeep, { mottle: 0.3 });
      b.paint(b.ellipse(0.42, 0.32, 0.28, 0.22, 0.3), P.cream, { mottle: 0.4, light: 0.35, rim: 0.12 });
      b.paint(b.rect(0.2, 0.28, 0.44, 0.08, 0.02, 0.2), P.wood, { mottle: 0.3 });
      b.line([[0.22, 0.2], [0.42, 0.08], [0.62, 0.2]], P.woodDeep, 0.03, { wobble: 0 });
      b.glow(0.42, 0.34, 0.28, P.butter, 0.5);
      windows(b, 0.28, 0.24, 2, 1, 0.12, 0.12, 0.06, 0, { glass: P.butter, frame: P.wood, lit: 1 });
    },
  },

  'gourd-table': {
    w: 0.95,
    h: 0.7,
    paint(b) {
      b.paint(b.ellipse(0.48, 0.42, 0.28, 0.22, 0.35), mix(P.gold, P.wood, 0.25), { mottle: 0.5, light: 0.3, rim: 0.12 });
      b.paint(b.ellipse(0.48, 0.18, 0.2, 0.14, 0.3), mix(P.gold, P.apricot, 0.3), { mottle: 0.4, light: 0.3, rim: 0.1 });
      b.paint(b.rect(0.44, 0.02, 0.08, 0.1, 0.03, 0.2), P.leafDeep, { mottle: 0.3 });
      b.paint(b.ellipse(0.48, 0.64, 0.32, 0.06, 0.4), P.wood, { mottle: 0.3, rim: 0 });
    },
  },

  'bamboo-couch': {
    w: 1.85,
    h: 1.05,
    paint(b) {
      const cane = '#c9b15a';
      legs(b, [0.16, 1.58], 0.72, 0.3, shade(cane, -0.2));
      seat(b, 0.08, 0.52, 1.68, 0.24, cane);
      b.paint(b.rect(0.08, 0.12, 1.68, 0.42, 0.06, 0.3), mix(cane, P.leaf, 0.15), { mottle: 0.45, light: 0.2 });
      for (let i = 0; i < 9; i++) b.line([[0.16 + i * 0.18, 0.14], [0.16 + i * 0.18, 0.5]], shade(cane, -0.2), 0.02, { wobble: 0.15 });
      b.paint(b.rect(0.16, 0.56, 0.48, 0.14, 0.05, 0.2), P.sage, { mottle: 0.3 });
      b.paint(b.rect(0.7, 0.56, 0.48, 0.14, 0.05, 0.2), P.sage, { mottle: 0.3 });
      b.paint(b.rect(1.24, 0.56, 0.42, 0.14, 0.05, 0.2), P.sage, { mottle: 0.3 });
    },
  },

  'water-lotus': {
    w: 0.95,
    h: 0.92,
    paint(b) {
      b.paint(b.ellipse(0.48, 0.82, 0.32, 0.1, 0.4), P.terracotta, { mottle: 0.4, rim: 0.1 });
      b.paint(b.ellipse(0.48, 0.74, 0.26, 0.08, 0.4), mix(P.skyLight, P.teal, 0.4), { mottle: 0.4, light: 0.35, rim: 0 });
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
        b.paint(b.ellipse(0.48 + Math.cos(a) * 0.16, 0.38 + Math.sin(a) * 0.12, 0.1, 0.16, 0.3, a), k % 2 ? P.pink : P.white, { mottle: 0.3, rim: 0.12 });
      }
      b.paint(b.circle(0.48, 0.4, 0.07, 0.2), P.gold, { rim: 0.1 });
      b.paint(b.ellipse(0.22, 0.62, 0.16, 0.05, 0.3), P.leaf, { mottle: 0.3, rim: 0.1 });
    },
  },

  'lion-head': {
    w: 1.05,
    h: 1.05,
    paint(b) {
      b.paint(b.circle(0.52, 0.52, 0.42, 0.4), P.gold, { mottle: 0.5, light: 0.25, rim: 0.12 });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        b.paint(b.circle(0.52 + Math.cos(a) * 0.4, 0.52 + Math.sin(a) * 0.4, 0.08, 0.3), k % 2 ? P.ember : P.gold, { mottle: 0.3, rim: 0.1 });
      }
      b.paint(b.ellipse(0.52, 0.5, 0.22, 0.2, 0.3), P.cream, { mottle: 0.3, rim: 0.1 });
      for (const s of [-1, 1]) {
        b.paint(b.ellipse(0.52 + s * 0.1, 0.46, 0.07, 0.08, 0.2), P.white, { rim: 0.1 });
        b.flat(b.circle(0.52 + s * 0.1, 0.47, 0.028, 0), P.ink);
      }
      b.paint(b.ellipse(0.52, 0.6, 0.08, 0.05, 0.2), P.raspberry, { rim: 0 });
      b.paint(b.poly([[0.42, 0.68], [0.52, 0.8], [0.62, 0.68]], { wobble: 0.2 }), P.ember, { mottle: 0.3 });
    },
  },

  'gondola-couch': {
    w: 1.85,
    h: 1.22,
    paint(b) {
      b.line([[0.2, 0.04], [1.64, 0.04]], P.charcoal, 0.04, { wobble: 0 });
      b.line([[0.48, 0.04], [0.48, 0.22]], P.charcoal, 0.02, { wobble: 0 });
      b.line([[1.36, 0.04], [1.36, 0.22]], P.charcoal, 0.02, { wobble: 0 });
      b.paint(b.rect(0.16, 0.22, 1.52, 0.18, 0.04, 0.2), P.raspberry, { mottle: 0.3 });
      b.paint(b.rect(0.12, 0.38, 1.6, 0.52, 0.1, 0.3), P.raspberry, { mottle: 0.45, light: 0.2 });
      b.paint(b.rect(0.28, 0.48, 0.42, 0.28, 0.04, 0.2), P.skyPale, { mottle: 0.3, rim: 0.1, alpha: 0.85 });
      b.paint(b.rect(1.14, 0.48, 0.42, 0.28, 0.04, 0.2), P.skyPale, { mottle: 0.3, rim: 0.1, alpha: 0.85 });
      b.paint(b.rect(0.22, 0.78, 0.5, 0.16, 0.04, 0.2), P.cream, { mottle: 0.3 });
      b.paint(b.rect(1.12, 0.78, 0.5, 0.16, 0.04, 0.2), P.cream, { mottle: 0.3 });
      b.paint(b.rect(0.78, 0.52, 0.28, 0.22, 0.03, 0.2), P.charcoal, { mottle: 0.3 });
    },
  },

  'cheese-light': {
    w: 1.15,
    h: 1.35,
    paint(b) {
      b.line([[0.58, 0.0], [0.58, 0.28]], P.charcoal, 0.028, { wobble: 0 });
      b.glow(0.58, 0.72, 0.55, P.gold, 0.45);
      const wedge = b.poly([[0.12, 1.05], [0.58, 0.28], [1.04, 1.05]], { wobble: 0.25 });
      b.paint(wedge, P.butter, { mottle: 0.5, light: 0.4, rim: 0.12 });
      b.paint(b.poly([[0.12, 1.05], [1.04, 1.05], [0.88, 1.28], [0.26, 1.28]], { wobble: 0.2 }), mix(P.gold, P.orange, 0.3), { mottle: 0.4 });
      for (const [x, y, r] of [[0.42, 0.72, 0.07], [0.68, 0.62, 0.055], [0.58, 0.9, 0.075]] as [number, number, number][]) {
        b.paint(b.circle(x, y, r, 0.3), shade(P.butter, -0.15), { rim: 0.1 });
      }
      b.glow(0.5, 0.7, 0.22, P.white, 0.4);
    },
  },

  'cocoa-table': {
    w: 0.85,
    h: 0.78,
    paint(b) {
      b.paint(b.ellipse(0.42, 0.22, 0.32, 0.1, 0.4), P.wood, { mottle: 0.4, rim: 0.1 });
      b.paint(b.rect(0.14, 0.22, 0.56, 0.42, 0.08, 0.3), mix(P.woodDeep, P.raspberry, 0.25), { mottle: 0.5, light: 0.2 });
      b.text('COCOA', 0.42, 0.44, 0.09, P.cream, { weight: 800, maxWidth: 0.46 });
      b.paint(b.ellipse(0.42, 0.64, 0.28, 0.08, 0.4), shade(P.woodDeep, -0.1), { mottle: 0.3, rim: 0 });
      b.glow(0.3, 0.3, 0.1, P.white, 0.3);
    },
  },

  'st-bernard': {
    w: 1.05,
    h: 0.92,
    paint(b) {
      const fur = mix(P.cream, P.sand, 0.2);
      b.paint(b.ellipse(0.42, 0.62, 0.28, 0.18, 0.35), fur, { mottle: 0.4, light: 0.25 });
      b.paint(b.circle(0.7, 0.4, 0.18, 0.3), fur, { mottle: 0.4, light: 0.3, rim: 0.12 });
      b.paint(b.ellipse(0.58, 0.28, 0.08, 0.14, 0.3), mix(fur, P.wood, 0.5), { mottle: 0.3 });
      b.paint(b.ellipse(0.8, 0.26, 0.08, 0.14, 0.3), mix(fur, P.wood, 0.5), { mottle: 0.3 });
      b.paint(b.ellipse(0.7, 0.46, 0.12, 0.08, 0.3), P.wood, { mottle: 0.3, rim: 0 });
      for (const s of [-1, 1]) b.flat(b.circle(0.7 + s * 0.06, 0.38, 0.018, 0), P.ink);
      b.paint(b.rect(0.34, 0.48, 0.22, 0.12, 0.04, 0.2), P.raspberry, { mottle: 0.3 });
      b.paint(b.rect(0.38, 0.4, 0.14, 0.1, 0.02, 0.2), P.cream, { mottle: 0.3 });
      b.paint(b.ellipse(0.18, 0.58, 0.08, 0.1, 0.3), mix(fur, P.wood, 0.4), { mottle: 0.3 });
    },
  },

  'ski-rack': {
    w: 0.85,
    h: 1.55,
    paint(b) {
      b.paint(b.rect(0.18, 1.38, 0.5, 0.12, 0.03, 0.2), P.wood, { mottle: 0.4 });
      for (const x of [0.28, 0.42]) {
        b.paint(b.rect(x, 0.08, 0.08, 1.32, 0.03, 0.2), P.skyDeep, { mottle: 0.4, light: 0.2 });
        b.paint(b.ellipse(x + 0.04, 0.08, 0.07, 0.05, 0.3), P.charcoal, { mottle: 0.3 });
      }
      b.paint(b.rect(0.22, 0.42, 0.4, 0.08, 0.03, 0.2), P.wood, { mottle: 0.3 });
      b.paint(b.rect(0.22, 0.92, 0.4, 0.08, 0.03, 0.2), P.wood, { mottle: 0.3 });
      b.line([[0.62, 0.22], [0.78, 1.28]], P.woodDeep, 0.03, { wobble: 0 });
      b.line([[0.7, 0.18], [0.86, 1.24]], P.wood, 0.03, { wobble: 0 });
    },
  },

  'topiary-couch': {
    w: 1.85,
    h: 1.18,
    paint(b) {
      const leaf = P.leaf;
      b.paint(b.circle(0.32, 0.42, 0.26, 0.4), leaf, { mottle: 0.55, light: 0.25, rim: 0.12 });
      b.paint(b.circle(0.7, 0.28, 0.22, 0.4), P.leafDeep, { mottle: 0.5, light: 0.25, rim: 0.12 });
      b.paint(b.circle(1.08, 0.4, 0.26, 0.4), leaf, { mottle: 0.55, light: 0.25, rim: 0.12 });
      b.paint(b.ellipse(0.7, 0.72, 0.72, 0.2, 0.4), mix(leaf, P.cream, 0.15), { mottle: 0.45, light: 0.2 });
      b.paint(b.rect(0.18, 0.78, 1.04, 0.16, 0.06, 0.3), P.sage, { mottle: 0.4 });
      legs(b, [0.22, 1.48], 0.9, 0.24, P.wood);
      b.paint(b.circle(0.32, 0.34, 0.06, 0.2), P.cream, { rim: 0.1 });
      b.paint(b.circle(1.08, 0.34, 0.06, 0.2), P.cream, { rim: 0.1 });
    },
  },

  bouquet: {
    w: 0.85,
    h: 1.12,
    paint(b) {
      b.paint(b.ellipse(0.42, 1.04, 0.18, 0.07, 0.4), P.terracotta, { mottle: 0.4, rim: 0.1 });
      b.paint(b.rect(0.3, 0.72, 0.24, 0.32, 0.04, 0.3), P.terracotta, { mottle: 0.4 });
      for (const [x, y] of [[0.3, 0.55], [0.42, 0.48], [0.54, 0.55], [0.36, 0.62], [0.5, 0.62]] as [number, number][]) {
        b.line([[0.42, 0.78], [x, y]], P.leafDeep, 0.02, { wobble: 0.3 });
      }
      const blooms: [number, number, string][] = [[0.26, 0.28, P.raspberry], [0.42, 0.16, P.pink], [0.6, 0.26, P.butter], [0.34, 0.4, P.lavender], [0.52, 0.4, P.white]];
      for (const [x, y, c] of blooms) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          b.paint(b.circle(x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05, 0.045, 0.3), c, { mottle: 0.3, rim: 0.1 });
        }
        b.paint(b.circle(x, y, 0.03, 0.2), P.gold, { rim: 0.1 });
      }
    },
  },

  'fountain-statue': {
    w: 0.95,
    h: 1.28,
    paint(b) {
      const stone = mix(P.stone, P.cream, 0.25);
      b.paint(b.ellipse(0.48, 1.18, 0.38, 0.09, 0.4), stone, { mottle: 0.4 });
      b.paint(b.ellipse(0.48, 1.08, 0.32, 0.08, 0.4), P.skyLight, { mottle: 0.4, light: 0.35, rim: 0 });
      b.paint(b.rect(0.4, 0.72, 0.16, 0.36, 0.04, 0.2), stone, { mottle: 0.4 });
      b.paint(b.ellipse(0.48, 0.72, 0.24, 0.07, 0.4), stone, { mottle: 0.4, rim: 0.1 });
      b.paint(b.ellipse(0.48, 0.66, 0.18, 0.05, 0.4), P.skyLight, { rim: 0 });
      b.paint(b.rect(0.42, 0.42, 0.12, 0.24, 0.03, 0.2), stone, { mottle: 0.3 });
      b.paint(b.ellipse(0.48, 0.4, 0.16, 0.05, 0.3), stone, { mottle: 0.3, rim: 0.1 });
      b.paint(b.ellipse(0.48, 0.36, 0.12, 0.04, 0.3), P.skyLight, { rim: 0 });
      b.line([[0.48, 0.36], [0.48, 0.14]], P.skyPale, 0.03, { alpha: 0.85, wobble: 0 });
      b.glow(0.48, 0.12, 0.08, P.white, 0.5);
      for (const s of [-1, 1]) b.line([[0.48, 0.2], [0.48 + s * 0.16, 0.34], [0.48 + s * 0.18, 0.66]], P.skyLight, 0.02, { alpha: 0.7 });
    },
  },

  'street-lamp': {
    w: 0.72,
    h: 1.7,
    paint(b) {
      b.paint(b.rect(0.3, 0.42, 0.1, 1.2, 0.03, 0.2), P.charcoal, { mottle: 0.4 });
      b.paint(b.ellipse(0.35, 1.62, 0.18, 0.06, 0.4), P.charcoal, { mottle: 0.3 });
      b.paint(b.poly([[0.12, 0.18], [0.58, 0.18], [0.48, 0.46], [0.22, 0.46]], { smooth: true, wobble: 0.2 }), P.butter, { mottle: 0.4, light: 0.45 });
      b.paint(b.poly([[0.1, 0.2], [0.35, 0.04], [0.6, 0.2]], { wobble: 0.2 }), P.charcoal, { mottle: 0.3 });
      b.glow(0.35, 0.28, 0.28, P.gold, 0.45);
    },
  },

  'telephone-box': {
    w: 0.95,
    h: 1.62,
    paint(b) {
      b.paint(b.rect(0.12, 0.18, 0.7, 1.36, 0.04, 0.3), P.raspberry, { mottle: 0.5, light: 0.15 });
      b.paint(b.rect(0.08, 0.08, 0.78, 0.16, 0.03, 0.2), P.raspberry, { mottle: 0.3 });
      b.text('TELEPHONE', 0.47, 0.16, 0.055, P.cream, { weight: 800, maxWidth: 0.7 });
      windows(b, 0.22, 0.32, 2, 3, 0.2, 0.18, 0.08, 0.08, { glass: P.skyPale, frame: P.cream, lit: 0.4 });
      b.paint(b.rect(0.34, 1.22, 0.26, 0.22, 0.03, 0.2), P.wood, { mottle: 0.3 });
      b.flat(b.circle(0.56, 1.34, 0.02, 0), P.gold);
      b.paint(b.rect(0.18, 1.48, 0.12, 0.08, 0.02, 0.2), P.charcoal, { mottle: 0.3 });
      b.paint(b.rect(0.64, 1.48, 0.12, 0.08, 0.02, 0.2), P.charcoal, { mottle: 0.3 });
    },
  },
};
