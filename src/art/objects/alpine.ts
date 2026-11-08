import type { Brush } from '../paint/brush';
import { P, mix, shade } from '../paint/color';
import { type PainterMap, windows } from './common';

type Pt = [number, number];

const SNOW = '#f4f7fb';
const ICE = '#b9dcf0';
const PINE = '#3f7a62';
const PINE_DEEP = '#2c5a48';
const BRICK = '#c46a62';
const WOOL = '#d93a6e';
const FUR = '#efe7dc';
const LIGHTS = [P.ember, P.gold, P.skyLight, P.raspberry, P.leaf, P.butter];

function bulb(b: Brush, x: number, y: number, color: string, r = 0.032) {
  b.glow(x, y, r * 5, color, 0.75);
  b.flat(b.circle(x, y, r, 0.2), shade(color, 0.5));
}

/** Fairy lights sagging between two points. */
function sagLights(b: Brush, x0: number, y0: number, x1: number, y1: number, depth: number, count: number) {
  const pts: Pt[] = Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * depth];
  });
  b.line(pts, P.charcoal, 0.01, { wobble: 0.2, alpha: 0.75 });
  for (let i = 1; i < count; i++) bulb(b, pts[i][0], pts[i][1], LIGHTS[i % LIGHTS.length], 0.026);
}

function wreath(b: Brush, cx: number, cy: number, r: number) {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.paint(b.circle(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72, r * 0.32, 0.3), i % 2 ? PINE : PINE_DEEP, { mottle: 0.3, rim: 0.1 });
  }
  b.paint(b.poly([[cx, cy - r * 0.15], [cx + r * 0.38, cy + r * 0.18], [cx - r * 0.38, cy + r * 0.18]], { wobble: 0.2 }), P.ember, { rim: 0.1 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    bulb(b, cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, P.gold, 0.018);
  }
}

function snowCap(b: Brush, pts: Pt[], color = SNOW) {
  b.paint(b.poly(pts, { smooth: true, wobble: 0.5 }), color, { mottle: 0.6, light: 0.4, rim: 0.1 });
}

function smoke(b: Brush, x: number, y: number) {
  for (const [dx, dy, r] of [[0, 0, 0.06], [0.04, -0.1, 0.07], [-0.02, -0.2, 0.08], [0.06, -0.3, 0.06]] as [number, number, number][]) {
    b.paint(b.circle(x + dx, y + dy, r, 0.6), '#e9e6ef', { rim: 0.12, alpha: 0.75 });
  }
}

function pine(b: Brush, x: number, base: number, h: number) {
  b.line([[x, base], [x, base - h * 0.25]], P.woodDeep, h * 0.06, { wobble: 0.2 });
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const top = base - h + t * h * 0.55;
    const w = h * (0.18 + t * 0.22);
    const y = top + h * 0.28;
    b.paint(b.poly([[x - w, y], [x, top], [x + w, y]], { wobble: 0.4 }), i % 2 ? PINE : PINE_DEEP, { mottle: 0.6, light: 0.2 });
    snowCap(b, [[x - w * 0.7, y - h * 0.04], [x, top + h * 0.04], [x + w * 0.7, y - h * 0.04], [x, y - h * 0.02]]);
    for (const s of [-0.55, 0, 0.55]) {
      const bx = x + s * w * 0.7;
      const by = top + h * 0.16;
      bulb(b, bx, by, LIGHTS[(i * 3 + (s > 0 ? 2 : s < 0 ? 0 : 1)) % LIGHTS.length], h * 0.018);
    }
  }
  b.paint(b.poly([[x, base - h - h * 0.04], [x - h * 0.05, base - h + h * 0.04], [x, base - h + h * 0.02], [x + h * 0.05, base - h + h * 0.04]], { wobble: 0.2 }), P.gold, { mottle: 0.3, light: 0.4 });
  b.glow(x, base - h, h * 0.12, P.gold, 0.7);
}

function flakeArm(b: Brush, cx: number, cy: number, a: number, len: number, color: string) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const at = (t: number, o: number): Pt => [cx + c * len * t - s * o, cy + s * len * t + c * o];
  b.line([at(0, 0), at(1, 0)], color, len * 0.08, { wobble: 0 });
  b.line([at(0.45, 0), at(0.7, len * 0.22)], color, len * 0.05, { wobble: 0 });
  b.line([at(0.45, 0), at(0.7, -len * 0.22)], color, len * 0.05, { wobble: 0 });
  b.line([at(0.75, 0), at(0.92, len * 0.14)], color, len * 0.04, { wobble: 0 });
  b.line([at(0.75, 0), at(0.92, -len * 0.14)], color, len * 0.04, { wobble: 0 });
}

export const alpinePainters: PainterMap = {
  cabin: {
    w: 2.2,
    h: 2.15,
    paint(b) {
      b.paint(b.ellipse(1.1, 2.08, 1.05, 0.08, 1), SNOW, { mottle: 0.5, rim: 0 });
      const wall = b.rect(0.28, 0.95, 1.64, 0.95, 0.02, 0.4);
      b.paint(wall, P.wood, { mottle: 0.8, light: 0.2 });
      b.ctx.save();
      b.ctx.clip(wall.path);
      for (let y = 1.02; y < 1.9; y += 0.12) b.line([[0.28, y], [1.92, y]], P.woodDeep, 0.008, { alpha: 0.55 });
      b.ctx.restore();
      windows(b, 0.48, 1.12, 2, 1, 0.28, 0.28, 0.18, 0, { glass: P.butter, lit: 1, frame: P.cream });
      b.glow(0.62, 1.26, 0.32, P.orange, 0.85);
      b.glow(1.08, 1.26, 0.32, P.orange, 0.85);
      b.paint(b.rect(1.42, 1.28, 0.28, 0.62, 0.03, 0.3), shade(P.woodDeep, -0.1), { mottle: 0.4 });
      wreath(b, 1.56, 1.48, 0.12);
      b.flat(b.circle(1.66, 1.62, 0.022, 0), P.gold);
      const roof = b.poly([[0.04, 1.08], [1.1, 0.22], [2.16, 1.08]], { wobble: 0.4 });
      b.paint(roof, shade(P.woodDeep, -0.15), { mottle: 0.6 });
      snowCap(b, [[0.02, 1.0], [1.1, 0.14], [2.18, 1.0], [1.9, 1.12], [1.1, 0.42], [0.3, 1.12]]);
      sagLights(b, 0.18, 0.98, 1.1, 0.28, 0.08, 9);
      sagLights(b, 1.1, 0.28, 2.02, 0.98, 0.08, 9);
      b.paint(b.rect(1.52, 0.28, 0.18, 0.55, 0.02, 0.2), BRICK, { mottle: 0.5 });
      snowCap(b, [[1.46, 0.3], [1.61, 0.16], [1.76, 0.3]]);
      smoke(b, 1.62, 0.12);
      b.paint(b.rect(0.7, 1.72, 0.18, 0.12, 0.02, 0.2), P.ember, { mottle: 0.3 });
      b.paint(b.rect(0.92, 1.72, 0.18, 0.12, 0.02, 0.2), P.leafDeep, { mottle: 0.3 });
    },
  },

  cottage: {
    w: 2.05,
    h: 2.2,
    paint(b) {
      b.paint(b.ellipse(1.02, 2.14, 1.0, 0.07, 1), SNOW, { mottle: 0.5, rim: 0 });
      b.paint(b.rect(0.22, 0.92, 1.6, 1.08, 0.03, 0.4), P.cream, { mottle: 0.7, light: 0.25 });
      b.paint(b.rect(0.22, 1.72, 1.6, 0.12, 0.02, 0.3), P.raspberry, { mottle: 0.4 });
      windows(b, 0.4, 1.12, 2, 1, 0.26, 0.3, 0.22, 0, { glass: P.butter, lit: 1, frame: P.white });
      for (const x of [0.38, 0.86]) {
        b.paint(b.rect(x, 1.12, 0.05, 0.3, 0.01, 0.2), P.skyDeep, { mottle: 0.3 });
        b.paint(b.rect(x + 0.25, 1.12, 0.05, 0.3, 0.01, 0.2), P.skyDeep, { mottle: 0.3 });
      }
      b.glow(0.53, 1.26, 0.3, P.orange, 0.9);
      b.glow(1.01, 1.26, 0.3, P.orange, 0.9);
      b.paint(b.rect(1.28, 1.28, 0.32, 0.72, 0.04, 0.3), P.wood, { mottle: 0.4 });
      wreath(b, 1.44, 1.52, 0.11);
      b.paint(b.rect(1.38, 1.42, 0.08, 0.16, 0.02, 0.2), P.butter, { rim: 0.1 });
      const roof = b.poly([[0.02, 1.02], [1.02, 0.18], [2.02, 1.02]], { wobble: 0.3 });
      b.paint(roof, P.ember, { mottle: 0.6 });
      snowCap(b, [[0.0, 0.94], [1.02, 0.1], [2.04, 0.94], [1.72, 1.08], [1.02, 0.38], [0.32, 1.08]]);
      sagLights(b, 0.16, 0.92, 1.02, 0.24, 0.07, 8);
      sagLights(b, 1.02, 0.24, 1.88, 0.92, 0.07, 8);
      b.paint(b.rect(1.42, 0.22, 0.16, 0.5, 0.02, 0.2), shade(BRICK, -0.1), { mottle: 0.4 });
      snowCap(b, [[1.36, 0.24], [1.5, 0.1], [1.64, 0.24]]);
      smoke(b, 1.5, 0.06);
      for (const [x, c] of [[0.48, P.pink], [0.96, P.butter]] as [number, string][]) {
        b.paint(b.circle(x, 1.58, 0.04, 0.2), c, { rim: 0.1 });
        b.line([[x, 1.62], [x, 1.72]], P.leafDeep, 0.012, { wobble: 0 });
      }
    },
  },

  chimney: {
    w: 0.72,
    h: 1.55,
    paint(b) {
      smoke(b, 0.36, 0.22);
      b.paint(b.rect(0.16, 0.42, 0.4, 1.0, 0.03, 0.3), BRICK, { mottle: 0.6, light: 0.2 });
      b.ctx.save();
      b.ctx.clip(b.rect(0.16, 0.42, 0.4, 1.0, 0.03, 0.3).path);
      for (let y = 0.5; y < 1.4; y += 0.12) {
        b.line([[0.16, y], [0.56, y]], shade(BRICK, -0.25), 0.01, { alpha: 0.6, wobble: 0 });
        const ox = ((y * 10) | 0) % 2 ? 0.1 : 0;
        b.line([[0.16 + ox, y], [0.16 + ox, y + 0.12]], shade(BRICK, -0.25), 0.01, { alpha: 0.5, wobble: 0 });
      }
      b.ctx.restore();
      b.paint(b.rect(0.1, 0.38, 0.52, 0.12, 0.03, 0.2), shade(BRICK, -0.2), { mottle: 0.4 });
      snowCap(b, [[0.08, 0.4], [0.36, 0.26], [0.64, 0.4]]);
      b.paint(b.ellipse(0.36, 1.5, 0.34, 0.05, 0.6), SNOW, { mottle: 0.4, rim: 0 });
    },
  },

  'pine-tree': {
    w: 1.35,
    h: 2.45,
    paint(b) {
      pine(b, 0.68, 2.42, 2.35);
      b.paint(b.ellipse(0.68, 2.42, 0.4, 0.08, 1), SNOW, { mottle: 0.5, rim: 0 });
    },
  },

  'frozen-pond': {
    w: 1.7,
    h: 0.72,
    paint(b) {
      const bank = b.ellipse(0.85, 0.42, 0.82, 0.28, 1.2);
      b.paint(bank, SNOW, { mottle: 0.7, rim: 0.12 });
      const ice = b.ellipse(0.85, 0.44, 0.7, 0.22, 1);
      b.paint(ice, ICE, { mottle: 0.8, light: 0.45 });
      b.ctx.save();
      b.ctx.clip(ice.path);
      b.glow(0.85, 0.4, 0.32, P.gold, 0.4);
      b.line([[0.3, 0.4], [0.7, 0.5], [1.15, 0.38], [1.45, 0.48]], P.gold, 0.012, { alpha: 0.55, wobble: 0.3 });
      b.line([[0.4, 0.52], [0.9, 0.36], [1.3, 0.5]], P.skyPale, 0.01, { alpha: 0.7, wobble: 0.4 });
      b.stroke(b.ellipse(0.55, 0.46, 0.12, 0.05, 0.4), P.white, 0.008, 0.7);
      b.stroke(b.ellipse(1.15, 0.42, 0.1, 0.045, 0.4), P.white, 0.008, 0.7);
      b.paint(b.ellipse(1.38, 0.5, 0.08, 0.04, 0.4), mix(P.skyDeep, ICE, 0.4), { mottle: 0.3, rim: 0.15 });
      b.ctx.restore();
      snowCap(b, [[0.12, 0.34], [0.28, 0.22], [0.4, 0.34]]);
      snowCap(b, [[1.32, 0.3], [1.5, 0.18], [1.62, 0.32]]);
    },
  },

  snowman: {
    w: 1.05,
    h: 1.45,
    paint(b) {
      b.paint(b.ellipse(0.52, 1.4, 0.42, 0.06, 0.8), SNOW, { mottle: 0.4, rim: 0 });
      b.paint(b.circle(0.52, 1.12, 0.28, 0.4), SNOW, { mottle: 0.5, light: 0.35, shadow: 0.15 });
      b.paint(b.circle(0.52, 0.72, 0.22, 0.4), SNOW, { mottle: 0.5, light: 0.35 });
      b.paint(b.circle(0.52, 0.4, 0.16, 0.3), SNOW, { mottle: 0.4, light: 0.4 });
      b.line([[0.28, 0.72], [0.08, 0.58]], P.woodDeep, 0.03, { wobble: 0 });
      b.line([[0.76, 0.72], [0.96, 0.52]], P.woodDeep, 0.03, { wobble: 0 });
      for (const y of [0.62, 0.78, 0.94]) b.flat(b.circle(0.52, y, 0.022, 0), P.charcoal);
      b.paint(b.poly([[0.52, 0.42], [0.72, 0.4], [0.52, 0.46]], { wobble: 0.1 }), P.orange, { rim: 0 });
      for (const s of [-1, 1]) b.flat(b.circle(0.52 + s * 0.055, 0.36, 0.018, 0), P.ink);
      b.line([[0.44, 0.48], [0.52, 0.52], [0.6, 0.48]], P.ink, 0.012, { wobble: 0 });
      b.paint(b.ellipse(0.52, 0.26, 0.2, 0.05, 0.2), P.charcoal, { mottle: 0.3, rim: 0.1 });
      b.paint(b.rect(0.4, 0.08, 0.24, 0.2, 0.03, 0.3), P.charcoal, { mottle: 0.3 });
      b.line([[0.38, 0.52], [0.66, 0.52]], WOOL, 0.05, { wobble: 0 });
      b.line([[0.66, 0.52], [0.7, 0.72]], WOOL, 0.045, { wobble: 0.2 });
      sagLights(b, 0.22, 0.58, 0.82, 0.56, 0.12, 7);
      b.glow(0.52, 0.7, 0.28, P.gold, 0.35);
    },
  },

  snowflake: {
    w: 0.72,
    h: 0.72,
    paint(b) {
      const cx = 0.36;
      const cy = 0.36;
      b.glow(cx, cy, 0.32, P.skyPale, 0.55);
      for (let i = 0; i < 6; i++) flakeArm(b, cx, cy, (i / 6) * Math.PI * 2 - Math.PI / 2, 0.3, P.skyDeep);
      b.paint(b.circle(cx, cy, 0.05, 0.2), P.white, { rim: 0.15 });
      b.stroke(b.circle(cx, cy, 0.08, 0.2), P.skyLight, 0.012, 0.8);
    },
  },

  icicle: {
    w: 0.95,
    h: 1.05,
    paint(b) {
      b.paint(b.rect(0.04, 0.08, 0.88, 0.16, 0.02, 0.3), P.wood, { mottle: 0.5 });
      snowCap(b, [[0.0, 0.12], [0.2, 0.0], [0.48, 0.06], [0.78, 0.0], [0.96, 0.12], [0.96, 0.22], [0.0, 0.22]]);
      const drops: [number, number][] = [[0.16, 0.55], [0.32, 0.82], [0.48, 0.64], [0.64, 0.92], [0.8, 0.58]];
      for (const [x, h] of drops) {
        b.paint(b.poly([[x - 0.05, 0.22], [x + 0.05, 0.22], [x, 0.22 + h * 0.7]], { smooth: true, wobble: 0.2 }), ICE, { mottle: 0.4, light: 0.5, rim: 0.12 });
        b.line([[x - 0.01, 0.26], [x - 0.01, 0.22 + h * 0.5]], P.white, 0.012, { alpha: 0.8, wobble: 0 });
        b.glow(x, 0.28, 0.08, P.skyPale, 0.45);
      }
    },
  },

  snowdrift: {
    w: 1.35,
    h: 0.7,
    paint(b) {
      b.paint(b.ellipse(0.7, 0.62, 0.62, 0.1, 1), mix(ICE, P.slate, 0.2), { mottle: 0.5, rim: 0, alpha: 0.7 });
      snowCap(b, [[0.04, 0.64], [0.16, 0.32], [0.46, 0.08], [0.78, 0.16], [1.16, 0.38], [1.32, 0.64]]);
      b.paint(b.ellipse(0.58, 0.36, 0.22, 0.1, 0.5), P.skyPale, { mottle: 0.4, rim: 0, alpha: 0.7 });
      for (const x of [0.22, 0.5, 0.9]) b.line([[x, 0.34], [x + 0.1, 0.3], [x + 0.18, 0.36]], P.white, 0.014, { alpha: 0.85, wobble: 0.2 });
    },
  },

  sled: {
    w: 1.35,
    h: 0.7,
    paint(b) {
      b.line([[0.08, 0.52], [0.22, 0.62], [1.18, 0.62], [1.3, 0.48]], P.slate, 0.035, { wobble: 0 });
      b.line([[0.1, 0.42], [0.24, 0.52], [1.16, 0.52], [1.28, 0.38]], P.slate, 0.03, { wobble: 0 });
      for (const x of [0.38, 0.72, 1.04]) b.line([[x, 0.34], [x, 0.58]], P.woodDeep, 0.025, { wobble: 0 });
      const deck = b.poly([[0.18, 0.18], [1.22, 0.18], [1.16, 0.38], [0.22, 0.38]], { wobble: 0.3 });
      b.paint(deck, P.raspberry, { mottle: 0.5, light: 0.3 });
      b.line([[0.22, 0.28], [1.16, 0.28]], P.cream, 0.02, { wobble: 0.2 });
      b.paint(b.rect(0.28, 0.08, 0.16, 0.14, 0.03, 0.2), P.butter, { mottle: 0.3, rim: 0.1 });
    },
  },

  skis: {
    w: 0.7,
    h: 1.7,
    paint(b) {
      for (const [x, c] of [[0.2, P.skyDeep], [0.42, P.raspberry]] as [number, string][]) {
        b.paint(b.poly([[x - 0.07, 0.18], [x, 0.04], [x + 0.07, 0.18], [x + 0.06, 1.58], [x - 0.06, 1.58]], { smooth: true, wobble: 0.2 }), c, { mottle: 0.4, light: 0.3 });
        b.paint(b.rect(x - 0.055, 0.72, 0.11, 0.16, 0.02, 0.2), P.charcoal, { mottle: 0.3 });
        b.line([[x, 0.12], [x, 1.52]], P.cream, 0.012, { alpha: 0.7, wobble: 0 });
      }
      b.line([[0.08, 0.5], [0.14, 1.55]], P.woodDeep, 0.03, { wobble: 0 });
      b.line([[0.58, 0.46], [0.62, 1.55]], P.woodDeep, 0.03, { wobble: 0 });
      b.paint(b.circle(0.08, 0.48, 0.045, 0.2), P.charcoal, { rim: 0.1 });
      b.paint(b.circle(0.58, 0.44, 0.045, 0.2), P.charcoal, { rim: 0.1 });
      b.paint(b.ellipse(0.32, 1.66, 0.28, 0.04, 0.6), SNOW, { mottle: 0.4, rim: 0 });
    },
  },

  snowboard: {
    w: 0.55,
    h: 1.55,
    paint(b) {
      const board = b.poly([[0.18, 0.08], [0.38, 0.08], [0.46, 0.28], [0.46, 1.28], [0.38, 1.48], [0.18, 1.48], [0.1, 1.28], [0.1, 0.28]], { smooth: true, wobble: 0.3 });
      b.paint(board, P.skyDeep, { mottle: 0.5, light: 0.3 });
      b.ctx.save();
      b.ctx.clip(board.path);
      b.paint(b.rect(0, 0.5, 0.55, 0.18, 0, 0.2), P.butter, { mottle: 0.3, rim: 0 });
      b.paint(b.rect(0, 0.9, 0.55, 0.1, 0, 0.2), WOOL, { mottle: 0.3, rim: 0 });
      b.ctx.restore();
      for (const y of [0.55, 0.95]) b.paint(b.rect(0.16, y, 0.24, 0.1, 0.03, 0.2), P.charcoal, { mottle: 0.3 });
      b.paint(b.ellipse(0.28, 1.52, 0.22, 0.04, 0.6), SNOW, { mottle: 0.4, rim: 0 });
    },
  },

  'ice-skates': {
    w: 0.95,
    h: 0.72,
    paint(b) {
      const skate = (x: number, rot: number, boot: string) => {
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        const at = (px: number, py: number): Pt => [x + px * c - py * s, 0.32 + px * s + py * c];
        b.line([at(-0.18, 0.3), at(0.22, 0.3), at(0.28, 0.22)], P.slate, 0.028, { wobble: 0 });
        for (const t of [-0.12, 0.0, 0.12]) b.line([at(t, 0.22), at(t, 0.3)], P.slate, 0.012, { wobble: 0 });
        b.paint(b.poly([at(-0.16, 0.04), at(0.18, 0.02), at(0.2, 0.22), at(-0.14, 0.24)], { wobble: 0.2 }), boot, { mottle: 0.4, light: 0.25, rim: 0.12 });
        b.paint(b.ellipse(...at(0.14, 0.2), 0.08, 0.05, 0.3, rot), boot, { rim: 0.1 });
        b.line([at(-0.04, 0.08), at(-0.04, 0.2)], P.cream, 0.012, { wobble: 0 });
        b.line([at(0.06, 0.08), at(0.06, 0.2)], P.cream, 0.012, { wobble: 0 });
      };
      skate(0.28, -0.22, P.skyDeep);
      skate(0.64, 0.22, WOOL);
    },
  },

  mittens: {
    w: 0.82,
    h: 0.7,
    paint(b) {
      const mitt = (x: number, rot: number, color: string) => {
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        const at = (px: number, py: number): Pt => [x + px * c - py * s, 0.42 + px * s + py * c];
        b.paint(b.ellipse(...at(0, 0.02), 0.12, 0.18, 0.3, rot), color, { mottle: 0.4, light: 0.3 });
        b.paint(b.ellipse(...at(0.12, -0.02), 0.05, 0.09, 0.3, rot + 0.8), color, { mottle: 0.3, rim: 0.1 });
        b.paint(b.rect(at(-0.1, 0.16)[0], at(-0.1, 0.16)[1], 0.2, 0.1, 0.04, 0.2), P.cream, { mottle: 0.3, rim: 0.1 });
        b.line([at(-0.08, 0.2), at(0.08, 0.2)], shade(color, -0.2), 0.012, { wobble: 0 });
      };
      mitt(0.28, -0.35, WOOL);
      mitt(0.56, 0.4, P.skyDeep);
    },
  },

  scarf: {
    w: 1.15,
    h: 0.62,
    paint(b) {
      const bands = [WOOL, P.cream, P.skyDeep, P.butter, WOOL, P.skyDeep];
      const wrap = b.poly([[0.08, 0.16], [0.86, 0.1], [0.92, 0.32], [0.12, 0.38]], { wobble: 0.4 });
      b.paint(wrap, WOOL, { mottle: 0.4 });
      b.ctx.save();
      b.ctx.clip(wrap.path);
      for (let i = 0; i < bands.length; i++) b.line([[0.1 + i * 0.14, 0.08], [0.16 + i * 0.14, 0.42]], bands[i], 0.08, { wobble: 0.2 });
      b.ctx.restore();
      const tail = b.poly([[0.72, 0.28], [1.08, 0.34], [1.02, 0.56], [0.66, 0.48]], { wobble: 0.4 });
      b.paint(tail, P.skyDeep, { mottle: 0.4 });
      b.ctx.save();
      b.ctx.clip(tail.path);
      for (let i = 0; i < 4; i++) b.line([[0.7 + i * 0.08, 0.26], [0.64 + i * 0.08, 0.56]], bands[i], 0.06, { wobble: 0.2 });
      b.ctx.restore();
      for (let i = 0; i < 7; i++) b.line([[0.7 + i * 0.045, 0.5], [0.7 + i * 0.045, 0.6]], i % 2 ? WOOL : P.butter, 0.01, { wobble: 0 });
    },
  },

  boots: {
    w: 0.85,
    h: 0.72,
    paint(b) {
      const boot = (x: number, rot: number) => {
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        const at = (px: number, py: number): Pt => [x + px * c - py * s, 0.38 + px * s + py * c];
        b.paint(b.ellipse(...at(0.12, 0.18), 0.16, 0.07, 0.3, rot), P.charcoal, { mottle: 0.3, rim: 0.1 });
        b.paint(b.poly([at(-0.08, -0.16), at(0.08, -0.16), at(0.1, 0.16), at(-0.06, 0.18)], { wobble: 0.2 }), P.woodDeep, { mottle: 0.4, light: 0.2 });
        b.paint(b.rect(at(-0.1, -0.22)[0], at(-0.1, -0.22)[1], 0.2, 0.1, 0.04, 0.2), FUR, { mottle: 0.3, rim: 0.1 });
        for (const t of [0.0, 0.08]) b.line([at(0.02, t), at(0.08, t)], P.gold, 0.01, { wobble: 0 });
      };
      boot(0.28, -0.2);
      boot(0.58, 0.25);
    },
  },

  earmuffs: {
    w: 0.85,
    h: 0.62,
    paint(b) {
      b.line([[0.18, 0.28], [0.42, 0.08], [0.68, 0.28]], P.charcoal, 0.035, { wobble: 0 });
      for (const x of [0.18, 0.68]) {
        b.paint(b.circle(x, 0.34, 0.14, 0.3), WOOL, { mottle: 0.5, light: 0.3 });
        b.paint(b.circle(x, 0.34, 0.09, 0.3), FUR, { mottle: 0.4, rim: 0.12 });
      }
    },
  },

  sleigh: {
    w: 1.85,
    h: 1.05,
    paint(b) {
      b.line([[0.08, 0.78], [0.22, 0.92], [1.55, 0.92], [1.78, 0.7], [1.7, 0.62]], P.gold, 0.04, { wobble: 0 });
      b.line([[0.12, 0.66], [0.26, 0.8], [1.5, 0.8], [1.7, 0.6]], P.gold, 0.03, { wobble: 0 });
      for (const x of [0.45, 0.95, 1.4]) b.line([[x, 0.52], [x, 0.86]], P.gold, 0.02, { wobble: 0 });
      const body = b.poly([[0.18, 0.22], [1.22, 0.18], [1.55, 0.28], [1.48, 0.58], [0.22, 0.62]], { smooth: true, wobble: 0.4 });
      b.paint(body, P.raspberry, { mottle: 0.6, light: 0.3 });
      b.line([[0.22, 0.34], [1.4, 0.3]], P.gold, 0.02, { wobble: 0.2 });
      b.paint(b.rect(0.28, 0.38, 0.7, 0.16, 0.04, 0.3), P.cream, { mottle: 0.4, rim: 0.12 });
      snowCap(b, [[0.22, 0.22], [0.7, 0.1], [1.2, 0.16], [1.48, 0.26], [1.2, 0.28], [0.5, 0.28]]);
      sagLights(b, 0.28, 0.24, 1.4, 0.26, 0.08, 7);
      b.line([[1.52, 0.4], [1.78, 0.34]], P.gold, 0.025, { wobble: 0 });
      bulb(b, 1.72, 0.32, P.gold, 0.04);
    },
  },

  penguin: {
    w: 0.7,
    h: 0.92,
    paint(b) {
      b.paint(b.ellipse(0.35, 0.88, 0.22, 0.05, 0.6), ICE, { mottle: 0.4, rim: 0 });
      b.paint(b.ellipse(0.35, 0.55, 0.22, 0.32, 0.3), P.charcoal, { mottle: 0.4 });
      b.paint(b.ellipse(0.35, 0.6, 0.14, 0.24, 0.3), P.white, { mottle: 0.3, rim: 0.1 });
      for (const s of [-1, 1]) b.paint(b.ellipse(0.35 + s * 0.22, 0.58, 0.07, 0.16, 0.3, s * 0.4), P.charcoal, { mottle: 0.3, rim: 0.1 });
      b.paint(b.circle(0.35, 0.26, 0.14, 0.3), P.charcoal, { mottle: 0.3 });
      b.paint(b.ellipse(0.35, 0.3, 0.09, 0.07, 0.2), P.white, { rim: 0 });
      for (const s of [-1, 1]) {
        b.flat(b.circle(0.35 + s * 0.045, 0.24, 0.028, 0), P.white);
        b.flat(b.circle(0.35 + s * 0.045, 0.245, 0.014, 0), P.ink);
      }
      b.paint(b.poly([[0.35, 0.3], [0.5, 0.32], [0.35, 0.36]], { wobble: 0.1 }), P.orange, { rim: 0 });
      for (const s of [-1, 1]) b.paint(b.ellipse(0.35 + s * 0.1, 0.86, 0.08, 0.04, 0.2, s * 0.3), P.orange, { rim: 0.1 });
    },
  },

  reindeer: {
    w: 1.55,
    h: 1.35,
    paint(b) {
      const hide = '#c48a5a';
      for (const pts of [[[0.92, 0.18], [0.86, 0.02], [0.96, 0.1], [1.04, 0.0], [1.08, 0.16]], [[1.16, 0.2], [1.22, 0.02], [1.3, 0.12], [1.4, 0.0], [1.36, 0.18]]] as Pt[][]) {
        b.line(pts, P.woodDeep, 0.03, { wobble: 0 });
      }
      for (const x of [0.28, 0.52, 0.92, 1.14]) b.paint(b.rect(x, 0.78, 0.1, 0.48, 0.04, 0.2), shade(hide, -0.15), { mottle: 0.3 });
      b.paint(b.ellipse(0.72, 0.68, 0.5, 0.24, 0.3), hide, { mottle: 0.5, light: 0.25 });
      b.paint(b.ellipse(0.72, 0.78, 0.22, 0.08, 0.3), P.cream, { mottle: 0.3, rim: 0, alpha: 0.8 });
      b.line([[0.22, 0.6], [0.12, 0.82]], hide, 0.04, { wobble: 0.2 });
      b.paint(b.circle(1.16, 0.42, 0.16, 0.3), hide, { mottle: 0.4 });
      b.paint(b.ellipse(1.3, 0.52, 0.1, 0.08, 0.3), shade(hide, 0.15), { mottle: 0.3, rim: 0.1 });
      b.flat(b.circle(1.2, 0.38, 0.02, 0), P.ink);
      b.paint(b.ellipse(1.08, 0.34, 0.05, 0.08, 0.2), shade(hide, -0.2), { rim: 0.1 });
      b.line([[0.55, 0.48], [0.85, 0.48]], P.gold, 0.03, { wobble: 0 });
      b.paint(b.ellipse(0.7, 1.3, 0.55, 0.06, 0.8), SNOW, { mottle: 0.4, rim: 0 });
    },
  },

  rabbit: {
    w: 0.7,
    h: 0.72,
    paint(b) {
      b.paint(b.ellipse(0.34, 0.68, 0.28, 0.05, 0.6), SNOW, { mottle: 0.4, rim: 0 });
      for (const [x, a] of [[0.28, -0.15], [0.42, 0.15]] as [number, number][]) {
        b.paint(b.ellipse(x, 0.18, 0.05, 0.16, 0.2, a), SNOW, { mottle: 0.3, rim: 0.12 });
        b.paint(b.ellipse(x, 0.18, 0.025, 0.1, 0.2, a), P.pink, { rim: 0, alpha: 0.8 });
      }
      b.paint(b.ellipse(0.36, 0.5, 0.2, 0.14, 0.3), SNOW, { mottle: 0.4, light: 0.3 });
      b.paint(b.circle(0.42, 0.32, 0.12, 0.3), SNOW, { mottle: 0.3, rim: 0.12 });
      b.line([[0.18, 0.5], [0.08, 0.42]], SNOW, 0.04, { wobble: 0 });
      for (const s of [-1, 1]) b.flat(b.circle(0.4 + s * 0.04, 0.3, 0.016, 0), P.ink);
      b.paint(b.ellipse(0.48, 0.36, 0.025, 0.018, 0.2), P.pink, { rim: 0 });
      b.glow(0.46, 0.38, 0.04, P.rose, 0.45);
    },
  },

  'village-lantern': {
    w: 0.7,
    h: 1.45,
    paint(b) {
      b.line([[0.35, 0.7], [0.35, 1.42]], P.woodDeep, 0.05, { wobble: 0 });
      b.paint(b.ellipse(0.35, 1.42, 0.12, 0.03, 0.4), SNOW, { mottle: 0.3, rim: 0 });
      b.paint(b.rect(0.16, 0.22, 0.38, 0.1, 0.02, 0.2), P.gold, { mottle: 0.3 });
      b.line([[0.22, 0.16], [0.35, 0.04], [0.48, 0.16]], P.gold, 0.025, { wobble: 0 });
      b.glow(0.35, 0.48, 0.55, P.orange, 0.9);
      b.glow(0.35, 0.48, 0.28, P.gold, 0.7);
      const glass = b.rect(0.18, 0.32, 0.34, 0.38, 0.04, 0.3);
      b.paint(glass, P.butter, { mottle: 0.4, light: 0.5 });
      b.stroke(glass, P.gold, 0.02, 0.9);
      b.line([[0.35, 0.32], [0.35, 0.7]], P.gold, 0.012, { wobble: 0 });
      b.paint(b.rect(0.16, 0.68, 0.38, 0.08, 0.02, 0.2), P.gold, { mottle: 0.3 });
      snowCap(b, [[0.14, 0.22], [0.35, 0.1], [0.56, 0.22]]);
    },
  },

  fence: {
    w: 1.6,
    h: 0.55,
    paint(b) {
      for (const y of [0.18, 0.34]) b.line([[0.04, y], [1.56, y + 0.02]], P.wood, 0.035, { wobble: 0.3 });
      for (let x = 0.12; x < 1.55; x += 0.28) {
        b.paint(b.rect(x - 0.04, 0.08, 0.08, 0.42, 0.02, 0.3), P.woodDeep, { mottle: 0.4 });
        snowCap(b, [[x - 0.07, 0.12], [x, 0.0], [x + 0.07, 0.12]]);
      }
      sagLights(b, 0.1, 0.12, 1.5, 0.14, 0.1, 8);
    },
  },
};
