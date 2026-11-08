import type { Brush } from '../paint/brush';
import { P, mix, shade } from '../paint/color';
import { type PainterMap, person, wheel } from './common';

type Pt = [number, number];

const IRON = '#6a6588';
const IRON_DEEP = '#4b4770';
const ROSE = P.raspberry;

function bloom(b: Brush, x: number, y: number, r: number, color: string) {
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    b.paint(b.circle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, 0.3), color, { mottle: 0.3, rim: 0.12 });
  }
  b.paint(b.circle(x, y, r * 0.32, 0.2), P.yellow, { rim: 0.1 });
}

function leaf(b: Brush, x: number, y: number, angle: number, len: number, width: number, color: string) {
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const at = (t: number, s: number): Pt => [x + dx * len * t - dy * width * s, y + dy * len * t + dx * width * s];
  b.paint(b.poly([at(0, 0.3), at(0.45, 1), at(1, 0), at(0.45, -1)], { wobble: 0.3 }), color, { mottle: 0.4, rim: 0.12 });
}

function vine(b: Brush, pts: Pt[], color: string = P.leafDeep) {
  b.line(pts, color, 0.04, { wobble: 0.5 });
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const side = i % 2 ? 1 : -1;
    leaf(b, x, y, side * (0.85 + (i % 3) * 0.25), 0.16, 0.05, i % 2 ? P.leaf : P.leafDeep);
    leaf(b, x + side * 0.03, y + 0.05, side * -0.7, 0.12, 0.04, P.leaf);
  }
}

export const gardenPainters: PainterMap = {
  rose: {
    w: 0.72,
    h: 1.15,
    paint(b) {
      b.line([[0.36, 1.12], [0.34, 0.42]], P.leafDeep, 0.035, { wobble: 0.3 });
      leaf(b, 0.34, 0.78, -1.2, 0.28, 0.08, P.leaf);
      leaf(b, 0.36, 0.58, 1.15, 0.24, 0.07, P.leafDeep);
      const layers: [number, string][] = [[0.22, shade(ROSE, -0.15)], [0.16, ROSE], [0.1, P.rose]];
      for (const [r, c] of layers) {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + r;
          b.paint(b.ellipse(0.36 + Math.cos(a) * r * 0.55, 0.32 + Math.sin(a) * r * 0.55, r * 0.45, r * 0.28, 0.3, a), c, { mottle: 0.3, rim: 0.12 });
        }
      }
      b.paint(b.circle(0.36, 0.32, 0.05, 0.2), P.gold, { rim: 0.1 });
    },
  },

  tulip: {
    w: 0.7,
    h: 1.05,
    paint(b) {
      for (const [x, c] of [[0.22, P.raspberry], [0.48, P.butter]] as [number, string][]) {
        b.line([[x, 1.02], [x + 0.01, 0.42]], P.leafDeep, 0.03, { wobble: 0.2 });
        leaf(b, x, 0.72, x < 0.3 ? -1.1 : 1.1, 0.22, 0.06, P.leaf);
        const cup = b.poly([[x - 0.1, 0.42], [x - 0.12, 0.2], [x - 0.04, 0.28], [x, 0.12], [x + 0.04, 0.28], [x + 0.12, 0.2], [x + 0.1, 0.42]], { smooth: true, wobble: 0.2 });
        b.paint(cup, c, { mottle: 0.4, light: 0.35, rim: 0.12 });
      }
    },
  },

  lavender: {
    w: 0.95,
    h: 0.85,
    paint(b) {
      for (let i = 0; i < 9; i++) {
        const x = 0.12 + i * 0.09;
        const top = 0.12 + (i % 3) * 0.08;
        b.line([[x, 0.82], [x + (i - 4) * 0.01, top]], P.leafDeep, 0.016, { wobble: 0.3 });
        for (let k = 0; k < 6; k++) {
          b.paint(b.ellipse(x + (i - 4) * 0.008, top + 0.06 + k * 0.055, 0.028, 0.022, 0.3), k % 2 ? P.lavender : P.lavenderDeep, { mottle: 0.3, rim: 0.1 });
        }
      }
    },
  },

  ivy: {
    w: 1.15,
    h: 1.7,
    paint(b) {
      vine(b, [[0.18, 1.68], [0.26, 1.18], [0.16, 0.74], [0.4, 0.4], [0.68, 0.18], [0.96, 0.48]], P.leafDeep);
      vine(b, [[0.52, 1.68], [0.6, 1.12], [0.78, 0.68], [0.56, 0.34], [0.9, 0.1]], P.leaf);
      vine(b, [[0.34, 1.68], [0.44, 1.22], [0.36, 0.82], [0.58, 0.52]], mix(P.leaf, P.leafDeep, 0.4));
      for (const [x, y, c] of [[0.2, 0.52, P.pink], [0.7, 0.08, ROSE], [0.96, 0.36, P.pink], [0.42, 0.7, P.white]] as [number, number, string][]) {
        bloom(b, x, y, 0.055, c);
      }
    },
  },

  'garden-arch': {
    w: 1.7,
    h: 2.05,
    paint(b) {
      const arch: Pt[] = Array.from({ length: 17 }, (_, i) => {
        const t = i / 16;
        const a = Math.PI * t;
        return [0.84 - Math.cos(a) * 0.62, 0.88 - Math.sin(a) * 0.74] as Pt;
      });
      b.line([[0.22, 2.02], [0.22, 0.88]], IRON_DEEP, 0.055, { wobble: 0 });
      b.line([[1.46, 2.02], [1.46, 0.88]], IRON_DEEP, 0.055, { wobble: 0 });
      b.line(arch, IRON_DEEP, 0.055, { wobble: 0 });
      b.line(arch.map(([x, y]): Pt => [x + (0.84 - x) * 0.18, y + 0.1]), IRON, 0.028, { wobble: 0 });
      for (let i = 2; i < 15; i += 2) {
        const [x, y] = arch[i];
        b.line([[x, y], [x, Math.min(2.0, y + 0.55)]], IRON, 0.016, { wobble: 0 });
        b.paint(b.circle(x, y + 0.02, 0.03, 0.2), IRON_DEEP, { rim: 0 });
      }
      vine(b, [[0.28, 1.7], [0.4, 1.15], [0.7, 0.55], [1.05, 0.7], [1.32, 1.2]], P.leafDeep);
      for (const [x, y, c] of [[0.48, 0.7, ROSE], [0.78, 0.48, P.pink], [1.12, 0.72, ROSE], [0.62, 1.05, P.white]] as [number, number, string][]) {
        bloom(b, x, y, 0.07, c);
      }
    },
  },

  gazebo: {
    w: 2.15,
    h: 2.15,
    paint(b) {
      for (const x of [0.28, 0.72, 1.42, 1.86]) b.paint(b.rect(x - 0.04, 0.95, 0.08, 1.12, 0.02, 0.2), P.cream, { mottle: 0.4 });
      b.paint(b.ellipse(1.08, 2.1, 0.95, 0.06, 1), P.sage, { mottle: 0.4, rim: 0 });
      const roof = b.poly([[0.08, 1.05], [1.08, 0.18], [2.08, 1.05]], { wobble: 0.3 });
      b.paint(roof, P.ember, { mottle: 0.6, light: 0.2 });
      b.paint(b.poly([[0.28, 1.0], [1.08, 0.38], [1.88, 1.0]], { wobble: 0.2 }), shade(P.ember, 0.15), { mottle: 0.4, rim: 0 });
      b.line([[0.08, 1.05], [2.08, 1.05]], P.cream, 0.03, { wobble: 0 });
      b.paint(b.circle(1.08, 0.16, 0.05, 0.2), P.gold, { rim: 0.1 });
      vine(b, [[0.3, 1.7], [0.38, 1.2], [0.55, 0.95], [0.8, 1.15]], P.leaf);
      bloom(b, 0.52, 1.0, 0.06, ROSE);
      bloom(b, 1.55, 1.12, 0.055, P.pink);
      b.paint(b.ellipse(1.08, 1.55, 0.28, 0.06, 0.3), P.wood, { mottle: 0.4, rim: 0.1 });
    },
  },

  willow: {
    w: 1.8,
    h: 2.4,
    paint(b) {
      b.paint(b.ellipse(0.9, 2.38, 0.5, 0.08, 1), P.sage, { mottle: 0.4, rim: 0 });
      b.line([[0.9, 2.35], [0.86, 0.7]], P.woodDeep, 0.12, { wobble: 0.3 });
      b.line([[0.86, 1.1], [0.5, 0.55]], P.wood, 0.05, { wobble: 0.3 });
      b.line([[0.86, 0.9], [1.28, 0.5]], P.wood, 0.05, { wobble: 0.3 });
      for (let i = 0; i < 14; i++) {
        const x0 = 0.25 + i * 0.1;
        const pts: Pt[] = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          pts.push([x0 + Math.sin(t * 5 + i) * 0.04, 0.35 + t * 1.55]);
        }
        b.line(pts, i % 2 ? P.leaf : P.leafDeep, 0.022, { wobble: 0.4, alpha: 0.9 });
      }
      b.paint(b.ellipse(0.9, 0.45, 0.7, 0.28, 0.8), mix(P.leaf, P.sage, 0.3), { mottle: 0.7, light: 0.25, rim: 0.1, alpha: 0.85 });
    },
  },

  hedge: {
    w: 1.7,
    h: 1.05,
    paint(b) {
      const bush = b.poly([[0.06, 1.02], [0.1, 0.55], [0.32, 0.22], [0.7, 0.12], [1.1, 0.22], [1.45, 0.5], [1.64, 1.02]], { smooth: true, wobble: 0.7 });
      b.paint(bush, P.leafDeep, { mottle: 0.8, light: 0.2 });
      b.paint(b.ellipse(0.85, 0.55, 0.7, 0.32, 0.8), P.leaf, { mottle: 0.6, light: 0.3, rim: 0, alpha: 0.85 });
      b.speckle(bush, P.mint, 40, 0.02, 0.5);
      for (const [x, y, c] of [[0.3, 0.4, P.pink], [0.72, 0.28, ROSE], [1.2, 0.38, P.butter]] as [number, number, string][]) bloom(b, x, y, 0.05, c);
    },
  },

  topiary: {
    w: 0.85,
    h: 1.7,
    paint(b) {
      b.paint(b.rect(0.36, 1.15, 0.12, 0.52, 0.03, 0.2), P.terracotta, { mottle: 0.4 });
      b.paint(b.ellipse(0.42, 1.66, 0.28, 0.05, 0.4), P.terracotta, { mottle: 0.3, rim: 0.1 });
      b.line([[0.42, 1.18], [0.42, 0.22]], P.woodDeep, 0.04, { wobble: 0 });
      for (const [y, r] of [[1.05, 0.16], [0.72, 0.2], [0.4, 0.16]] as [number, number][]) {
        b.paint(b.circle(0.42, y, r, 0.4), P.leafDeep, { mottle: 0.6, light: 0.25 });
        b.paint(b.circle(0.42 - r * 0.3, y - r * 0.25, r * 0.45, 0.3), P.leaf, { mottle: 0.4, rim: 0 });
      }
    },
  },

  'dog-walker': {
    w: 1.4,
    h: 1.48,
    paint(b) {
      person(b, 0.36, 1.45, 1.28, { skin: '#e8b896', hair: '#3d2a22', top: P.rose, dress: true, hat: P.cream, hands: [[0.18, 0.88], [0.78, 1.02]] });
      b.line([[0.78, 1.02], [0.98, 1.22], [1.18, 1.32]], P.charcoal, 0.016, { wobble: 0.2 });
      const fur = P.cream;
      b.paint(b.ellipse(1.14, 1.26, 0.16, 0.1, 0.3), fur, { mottle: 0.4 });
      b.paint(b.circle(1.28, 1.16, 0.085, 0.3), fur, { mottle: 0.3 });
      b.paint(b.circle(1.22, 1.08, 0.05, 0.3), fur, { mottle: 0.3 });
      b.paint(b.ellipse(1.36, 1.1, 0.04, 0.045, 0.2), fur, { rim: 0.1 });
      for (const x of [1.04, 1.18]) b.paint(b.rect(x, 1.32, 0.05, 0.12, 0.02, 0.2), shade(fur, -0.15), { mottle: 0.3 });
      b.flat(b.circle(1.32, 1.14, 0.012, 0), P.ink);
      b.line([[1.14, 1.18], [1.14, 1.24]], P.raspberry, 0.028, { wobble: 0 });
    },
  },

  bunny: {
    w: 0.92,
    h: 1.02,
    paint(b) {
      const fur = P.cream;
      const ear = (x: number, y: number, tilt: number) => {
        b.paint(b.ellipse(x, y, 0.07, 0.22, 0.3, tilt), fur, { mottle: 0.4, light: 0.3, rim: 0.12 });
        b.paint(b.ellipse(x + tilt * 0.04, y + 0.02, 0.032, 0.14, 0.2, tilt), P.pink, { mottle: 0.3, rim: 0 });
      };
      ear(0.34, 0.22, -0.28);
      ear(0.54, 0.18, 0.22);
      b.paint(b.ellipse(0.46, 0.72, 0.2, 0.16, 0.35), fur, { mottle: 0.45, light: 0.3 });
      b.paint(b.circle(0.44, 0.44, 0.16, 0.3), fur, { mottle: 0.4, light: 0.35, rim: 0.12 });
      b.paint(b.circle(0.72, 0.7, 0.055, 0.3), fur, { mottle: 0.3, light: 0.4, rim: 0.1 });
      for (const x of [0.34, 0.54]) b.paint(b.ellipse(x, 0.86, 0.07, 0.045, 0.25), shade(fur, -0.08), { mottle: 0.3, rim: 0.1 });
      b.paint(b.ellipse(0.38, 0.48, 0.055, 0.04, 0.3), P.blush, { rim: 0, alpha: 0.85 });
      b.paint(b.ellipse(0.52, 0.48, 0.055, 0.04, 0.3), P.blush, { rim: 0, alpha: 0.85 });
      for (const s of [-1, 1]) b.flat(b.circle(0.44 + s * 0.055, 0.42, 0.018, 0), P.ink);
      b.paint(b.ellipse(0.44, 0.5, 0.028, 0.02, 0.2), P.pink, { rim: 0 });
      b.line([[0.44, 0.52], [0.44, 0.58]], P.pink, 0.012, { wobble: 0 });
      b.paint(b.ellipse(0.48, 0.98, 0.28, 0.035, 0.6), P.sage, { mottle: 0.3, rim: 0 });
    },
  },

  'food-truck': {
    w: 2.15,
    h: 1.55,
    paint(b) {
      b.paint(b.rect(0.12, 0.48, 1.7, 0.72, 0.08, 0.4), P.cream, { mottle: 0.6, light: 0.25 });
      b.paint(b.rect(0.12, 0.48, 1.7, 0.16, 0.06, 0.3), P.teal, { mottle: 0.4 });
      b.paint(b.rect(0.28, 0.7, 0.7, 0.32, 0.04, 0.3), P.skyPale, { mottle: 0.3, rim: 0.15, alpha: 0.85 });
      b.paint(b.rect(1.12, 0.68, 0.55, 0.22, 0.04, 0.3), P.raspberry, { mottle: 0.3 });
      b.text('CRÊPES', 1.4, 0.8, 0.1, P.cream, { weight: 800, maxWidth: 0.5 });
      b.paint(b.ellipse(0.55, 0.92, 0.16, 0.04, 0.3), P.butter, { mottle: 0.3, rim: 0.1 });
      b.paint(b.rect(0.42, 0.94, 0.26, 0.08, 0.02, 0.2), P.slate, { rim: 0 });
      b.paint(b.circle(1.55, 0.58, 0.06, 0.2), P.skyDeep, { rim: 0.1 });
      b.paint(b.poly([[0.08, 0.52], [0.08, 0.28], [0.7, 0.18], [1.55, 0.28], [1.82, 0.52]], { wobble: 0.3 }), P.teal, { mottle: 0.5, light: 0.3 });
      b.paint(b.rect(1.72, 0.62, 0.28, 0.42, 0.04, 0.3), mix(P.cream, P.peach, 0.3), { mottle: 0.4 });
      wheel(b, 0.48, 1.32, 0.2, P.butter);
      wheel(b, 1.48, 1.32, 0.2, P.butter);
      bloom(b, 0.22, 0.42, 0.05, ROSE);
    },
  },

  'fruit-crates': {
    w: 1.15,
    h: 1.18,
    paint(b) {
      const crate = (x: number, y: number, w: number, h: number) => {
        b.paint(b.rect(x, y, w, h, 0.03, 0.3), P.wood, { mottle: 0.55, light: 0.2 });
        b.paint(b.rect(x, y, w, 0.08, 0.02, 0.2), P.woodDeep, { mottle: 0.4 });
        for (let i = 1; i < 4; i++) b.line([[x + 0.04, y + (h * i) / 4], [x + w - 0.04, y + (h * i) / 4]], shade(P.wood, -0.18), 0.018, { wobble: 0.15 });
        b.paint(b.rect(x, y, 0.06, h, 0.02, 0.2), shade(P.wood, -0.12), { mottle: 0.3 });
        b.paint(b.rect(x + w - 0.06, y, 0.06, h, 0.02, 0.2), shade(P.wood, -0.12), { mottle: 0.3 });
      };
      crate(0.12, 0.68, 0.9, 0.38);
      crate(0.2, 0.38, 0.78, 0.34);
      const apple = (x: number, y: number, r: number, color: string) => {
        b.paint(b.circle(x, y, r, 0.3), color, { mottle: 0.4, light: 0.35, rim: 0.12 });
        b.line([[x, y - r * 0.15], [x + r * 0.15, y - r * 1.15]], P.woodDeep, 0.018, { wobble: 0 });
        leaf(b, x + r * 0.12, y - r * 0.9, 0.9, r * 0.9, r * 0.28, P.leaf);
      };
      apple(0.38, 0.32, 0.1, ROSE);
      apple(0.58, 0.28, 0.11, P.raspberry);
      apple(0.76, 0.34, 0.09, P.ember);
      b.paint(b.circle(0.48, 0.62, 0.09, 0.3), P.orange, { mottle: 0.4, light: 0.3, rim: 0.12 });
      b.paint(b.circle(0.66, 0.58, 0.085, 0.3), P.apricot, { mottle: 0.4, light: 0.3, rim: 0.12 });
      b.paint(b.ellipse(0.86, 0.6, 0.07, 0.09, 0.3), P.yellow, { mottle: 0.4, light: 0.3, rim: 0.1 });
      for (const [x, y] of [[0.28, 0.62], [0.34, 0.56], [0.3, 0.5]] as Pt[]) {
        b.paint(b.circle(x, y, 0.035, 0.25), P.lavenderDeep, { mottle: 0.3, rim: 0.1 });
      }
    },
  },

  child: {
    w: 1.05,
    h: 1.28,
    paint(b) {
      person(b, 0.42, 1.24, 1.08, { skin: '#e2a982', hair: '#6b4a3a', top: P.skyDeep, bottom: P.charcoal, hands: [[0.22, 0.78], [0.58, 0.62]] });
      const fold = b.poly([[0.48, 0.62], [0.68, 0.28], [0.9, 0.52], [0.62, 0.7]], { smooth: true, wobble: 0.25 });
      b.paint(fold, P.butter, { mottle: 0.5, light: 0.35 });
      b.line([[0.54, 0.58], [0.7, 0.36], [0.82, 0.5]], shade(P.wood, 0.2), 0.018, { wobble: 0.2 });
      b.paint(b.ellipse(0.7, 0.46, 0.055, 0.035, 0.25), ROSE, { mottle: 0.3, rim: 0.1 });
      b.speckle(fold, P.white, 18, 0.01, 0.85);
      b.paint(b.ellipse(0.5, 1.24, 0.28, 0.035, 0.55), mix(P.stone, P.sand, 0.45), { mottle: 0.3, rim: 0 });
    },
  },

  teapot: {
    w: 0.95,
    h: 0.82,
    paint(b) {
      b.line([[0.16, 0.42], [0.1, 0.22], [0.28, 0.16], [0.42, 0.28]], P.teal, 0.04, { wobble: 0 });
      b.paint(b.ellipse(0.52, 0.48, 0.28, 0.22, 0.3), P.cream, { mottle: 0.5, light: 0.35 });
      b.paint(b.rect(0.42, 0.22, 0.2, 0.12, 0.04, 0.2), P.cream, { mottle: 0.3, rim: 0.1 });
      b.paint(b.ellipse(0.52, 0.22, 0.14, 0.04, 0.2), P.gold, { rim: 0.1 });
      b.line([[0.78, 0.42], [0.9, 0.34], [0.88, 0.52], [0.76, 0.56]], P.gold, 0.03, { wobble: 0 });
      bloom(b, 0.52, 0.5, 0.06, ROSE);
      b.paint(b.ellipse(0.38, 0.72, 0.12, 0.05, 0.3), P.cream, { mottle: 0.3, rim: 0.12 });
      b.paint(b.ellipse(0.62, 0.74, 0.1, 0.045, 0.3), P.cream, { mottle: 0.3, rim: 0.12 });
      b.paint(b.ellipse(0.5, 0.62, 0.08, 0.03, 0.2), P.skyPale, { rim: 0, alpha: 0.7 });
    },
  },

  picnic: {
    w: 1.45,
    h: 0.72,
    paint(b) {
      const cloth = b.poly([[0.08, 0.18], [1.28, 0.12], [1.38, 0.62], [0.04, 0.66]], { wobble: 0.4 });
      b.paint(cloth, P.cream, { mottle: 0.4 });
      b.ctx.save();
      b.ctx.clip(cloth.path);
      for (let i = 0; i < 8; i++) b.line([[0.1 + i * 0.18, 0.1], [0.02 + i * 0.18, 0.7]], i % 2 ? P.raspberry : P.skyDeep, 0.09, { wobble: 0.2 });
      b.ctx.restore();
      b.paint(b.ellipse(0.42, 0.4, 0.16, 0.1, 0.3), P.wood, { mottle: 0.4, rim: 0.12 });
      b.paint(b.rect(0.32, 0.22, 0.2, 0.16, 0.04, 0.3), P.woodDeep, { mottle: 0.4 });
      b.paint(b.ellipse(0.85, 0.4, 0.22, 0.08, 0.3, -0.2), P.sandDeep, { mottle: 0.4 });
      bloom(b, 1.12, 0.36, 0.055, ROSE);
    },
  },

  birdbath: {
    w: 0.9,
    h: 1.15,
    paint(b) {
      b.paint(b.ellipse(0.45, 1.1, 0.22, 0.05, 0.4), P.stone, { mottle: 0.4, rim: 0.1 });
      b.paint(b.rect(0.36, 0.62, 0.18, 0.48, 0.05, 0.3), P.stone, { mottle: 0.5 });
      b.paint(b.ellipse(0.45, 0.58, 0.38, 0.1, 0.4), P.stone, { mottle: 0.4, rim: 0.12 });
      b.paint(b.ellipse(0.45, 0.54, 0.3, 0.06, 0.4), P.skyLight, { mottle: 0.4, light: 0.4, rim: 0 });
      b.line([[0.3, 0.54], [0.4, 0.52], [0.52, 0.54]], P.white, 0.012, { alpha: 0.8, wobble: 0 });
      b.paint(b.ellipse(0.58, 0.42, 0.08, 0.05, 0.3), P.white, { mottle: 0.3, rim: 0.12 });
      b.paint(b.circle(0.64, 0.36, 0.04, 0.2), P.white, { rim: 0.1 });
      b.paint(b.poly([[0.67, 0.36], [0.76, 0.34], [0.67, 0.38]], { wobble: 0.1 }), P.orange, { rim: 0 });
    },
  },

  squirrel: {
    w: 0.72,
    h: 0.7,
    paint(b) {
      const fur = P.apricot;
      b.paint(b.poly([[0.12, 0.42], [0.04, 0.12], [0.22, 0.08], [0.28, 0.38]], { smooth: true, wobble: 0.3 }), fur, { mottle: 0.4 });
      b.paint(b.ellipse(0.4, 0.48, 0.18, 0.14, 0.3), fur, { mottle: 0.4, light: 0.3 });
      b.paint(b.circle(0.56, 0.32, 0.1, 0.3), fur, { mottle: 0.3 });
      b.paint(b.ellipse(0.52, 0.22, 0.04, 0.08, 0.2), fur, { rim: 0.1 });
      b.flat(b.circle(0.6, 0.3, 0.014, 0), P.ink);
      b.paint(b.ellipse(0.64, 0.36, 0.03, 0.02, 0.2), P.pink, { rim: 0 });
      b.paint(b.circle(0.66, 0.48, 0.04, 0.2), P.sandDeep, { mottle: 0.3 });
      b.paint(b.ellipse(0.38, 0.66, 0.22, 0.04, 0.6), P.sage, { mottle: 0.3, rim: 0 });
    },
  },

  bee: {
    w: 0.7,
    h: 0.5,
    paint(b) {
      const wing = (x: number, y: number, rot: number) => {
        b.paint(b.ellipse(x, y, 0.08, 0.14, 0.3, rot), P.skyPale, { mottle: 0.3, light: 0.5, rim: 0.15, alpha: 0.8 });
      };
      wing(0.28, 0.18, -0.4);
      wing(0.48, 0.16, 0.4);
      b.paint(b.ellipse(0.38, 0.3, 0.16, 0.1, 0.3), P.yellow, { mottle: 0.4 });
      for (const x of [0.3, 0.38, 0.46]) b.line([[x, 0.22], [x, 0.38]], P.charcoal, 0.018, { wobble: 0 });
      b.paint(b.circle(0.54, 0.28, 0.055, 0.2), P.charcoal, { rim: 0.1 });
      b.line([[0.58, 0.24], [0.64, 0.16]], P.charcoal, 0.01, { wobble: 0 });
      b.line([[0.58, 0.3], [0.66, 0.28]], P.charcoal, 0.01, { wobble: 0 });
    },
  },

  swing: {
    w: 1.35,
    h: 1.7,
    paint(b) {
      b.line([[0.18, 0.12], [0.18, 1.55]], P.woodDeep, 0.05, { wobble: 0 });
      b.line([[1.16, 0.12], [1.16, 1.55]], P.woodDeep, 0.05, { wobble: 0 });
      b.line([[0.12, 0.16], [1.22, 0.16]], P.wood, 0.06, { wobble: 0.2 });
      b.line([[0.42, 0.18], [0.4, 1.05]], P.charcoal, 0.018, { wobble: 0 });
      b.line([[0.94, 0.18], [0.96, 1.05]], P.charcoal, 0.018, { wobble: 0 });
      b.paint(b.rect(0.32, 1.02, 0.72, 0.12, 0.04, 0.3), P.wood, { mottle: 0.5, light: 0.3 });
      bloom(b, 0.22, 0.28, 0.055, ROSE);
      vine(b, [[1.16, 0.5], [1.28, 0.72], [1.18, 1.05]], P.leaf);
    },
  },

  statue: {
    w: 0.85,
    h: 1.45,
    paint(b) {
      const stone = P.stone;
      b.paint(b.rect(0.12, 1.22, 0.62, 0.18, 0.04, 0.3), shade(stone, -0.1), { mottle: 0.5 });
      b.paint(b.rect(0.22, 1.08, 0.42, 0.16, 0.03, 0.3), stone, { mottle: 0.4 });
      b.paint(b.ellipse(0.42, 0.88, 0.16, 0.22, 0.3), stone, { mottle: 0.5, light: 0.25 });
      b.paint(b.circle(0.42, 0.52, 0.12, 0.3), stone, { mottle: 0.4 });
      b.paint(b.ellipse(0.42, 0.4, 0.14, 0.06, 0.3), stone, { mottle: 0.3, rim: 0.1 });
      b.line([[0.28, 0.72], [0.16, 0.92]], stone, 0.04, { wobble: 0 });
      b.line([[0.56, 0.72], [0.7, 0.5]], stone, 0.04, { wobble: 0 });
      bloom(b, 0.72, 0.42, 0.05, ROSE);
      b.flat(b.circle(0.38, 0.5, 0.016, 0), shade(stone, -0.4));
      b.flat(b.circle(0.48, 0.5, 0.016, 0), shade(stone, -0.4));
    },
  },

  bush: {
    w: 1.15,
    h: 0.85,
    paint(b) {
      const shape = b.poly([[0.08, 0.82], [0.12, 0.48], [0.32, 0.18], [0.58, 0.1], [0.88, 0.22], [1.06, 0.5], [1.08, 0.82]], { smooth: true, wobble: 0.6 });
      b.paint(shape, P.leafDeep, { mottle: 0.8, light: 0.2 });
      b.paint(b.ellipse(0.58, 0.42, 0.42, 0.28, 0.7), P.leaf, { mottle: 0.6, light: 0.3, rim: 0, alpha: 0.9 });
      b.speckle(shape, P.mint, 36, 0.018, 0.55);
      for (const [x, y, c] of [[0.28, 0.34, P.pink], [0.52, 0.22, ROSE], [0.78, 0.32, P.raspberry], [0.4, 0.48, P.white], [0.7, 0.5, P.butter]] as [number, number, string][]) {
        bloom(b, x, y, 0.055, c);
      }
    },
  },

  'potted-plant': {
    w: 0.78,
    h: 1.15,
    paint(b) {
      b.paint(b.ellipse(0.4, 1.1, 0.28, 0.05, 0.4), mix(P.sage, P.stone, 0.3), { mottle: 0.3, rim: 0 });
      b.paint(b.poly([[0.22, 0.72], [0.58, 0.72], [0.54, 1.08], [0.26, 1.08]], { wobble: 0.2 }), P.terracotta, { mottle: 0.5, light: 0.25 });
      b.paint(b.ellipse(0.4, 0.72, 0.2, 0.06, 0.3), shade(P.terracotta, -0.15), { mottle: 0.3, rim: 0.1 });
      b.paint(b.ellipse(0.4, 0.7, 0.14, 0.04, 0.3), P.woodDeep, { mottle: 0.3, rim: 0 });
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + i * 0.28;
        leaf(b, 0.4, 0.68, a, 0.42, 0.08, i % 2 ? P.leaf : P.leafDeep);
      }
      bloom(b, 0.4, 0.28, 0.07, ROSE);
      bloom(b, 0.22, 0.4, 0.05, P.pink);
      bloom(b, 0.58, 0.38, 0.05, P.raspberry);
    },
  },

  geranium: {
    w: 0.85,
    h: 0.95,
    paint(b) {
      b.paint(b.rect(0.12, 0.62, 0.62, 0.28, 0.04, 0.3), P.terracotta, { mottle: 0.5, light: 0.25 });
      b.paint(b.ellipse(0.43, 0.62, 0.34, 0.07, 0.3), shade(P.terracotta, -0.1), { mottle: 0.3, rim: 0.1 });
      b.paint(b.ellipse(0.43, 0.9, 0.34, 0.06, 0.4), P.terracotta, { mottle: 0.3, rim: 0.1 });
      for (const [x, a] of [[0.22, -0.5], [0.36, -0.15], [0.5, 0.15], [0.64, 0.5]] as [number, number][]) {
        b.line([[x, 0.6], [x + a * 0.08, 0.28]], P.leafDeep, 0.02, { wobble: 0.2 });
        leaf(b, x, 0.42, a, 0.16, 0.05, P.leaf);
      }
      for (const [x, y] of [[0.22, 0.22], [0.4, 0.12], [0.58, 0.2], [0.34, 0.32], [0.52, 0.34]] as Pt[]) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          b.paint(b.circle(x + Math.cos(a) * 0.035, y + Math.sin(a) * 0.03, 0.028, 0.3), k % 2 ? P.ember : P.raspberry, { mottle: 0.3, rim: 0.1 });
        }
      }
    },
  },

  hydrangea: {
    w: 0.95,
    h: 1.2,
    paint(b) {
      b.line([[0.48, 1.16], [0.48, 0.55]], P.leafDeep, 0.045, { wobble: 0.2 });
      leaf(b, 0.48, 0.85, -1.1, 0.32, 0.09, P.leaf);
      leaf(b, 0.48, 0.7, 1.15, 0.28, 0.08, P.leafDeep);
      const mop = (cx: number, cy: number, color: string) => {
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2;
          b.paint(b.circle(cx + Math.cos(a) * 0.1, cy + Math.sin(a) * 0.08, 0.055, 0.3), k % 2 ? color : shade(color, 0.15), { mottle: 0.3, rim: 0.1 });
        }
        b.paint(b.circle(cx, cy, 0.045, 0.2), P.butter, { rim: 0.1 });
      };
      mop(0.32, 0.32, P.lilac);
      mop(0.62, 0.28, P.pink);
      mop(0.48, 0.48, P.skyLight);
    },
  },

  townhouse: {
    w: 1.55,
    h: 2.35,
    paint(b) {
      b.paint(b.rect(0.12, 0.55, 1.3, 1.72, 0.02, 0.3), P.cream, { mottle: 0.7, light: 0.2 });
      b.paint(b.rect(0.12, 2.12, 1.3, 0.12, 0.02, 0.2), mix(P.cream, P.stone, 0.3), { mottle: 0.4 });
      const roof = b.poly([[0.04, 0.62], [0.78, 0.12], [1.5, 0.62]], { wobble: 0.3 });
      b.paint(roof, mix(P.slate, P.charcoal, 0.2), { mottle: 0.5, light: 0.2 });
      b.paint(b.rect(1.1, 0.22, 0.14, 0.42, 0.02, 0.2), P.terracotta, { mottle: 0.4 });
      for (const [x, y] of [[0.28, 0.78], [0.88, 0.78], [0.28, 1.28], [0.88, 1.28]] as Pt[]) {
        b.paint(b.rect(x, y, 0.32, 0.34, 0.02, 0.3), P.skyPale, { mottle: 0.4, light: 0.3, rim: 0.12 });
        b.line([[x + 0.16, y], [x + 0.16, y + 0.34]], P.cream, 0.012, { wobble: 0 });
        b.line([[x, y + 0.17], [x + 0.32, y + 0.17]], P.cream, 0.012, { wobble: 0 });
      }
      b.paint(b.rect(0.22, 1.18, 1.1, 0.08, 0.02, 0.2), IRON, { mottle: 0.3 });
      for (let x = 0.28; x < 1.28; x += 0.1) b.line([[x, 1.18], [x, 1.32]], IRON, 0.012, { wobble: 0 });
      for (const x of [0.4, 0.72, 1.04]) {
        b.paint(b.rect(x - 0.08, 1.08, 0.16, 0.08, 0.02, 0.2), P.terracotta, { mottle: 0.3 });
        bloom(b, x, 1.04, 0.04, P.ember);
      }
      b.paint(b.rect(0.62, 1.72, 0.28, 0.52, 0.03, 0.3), P.wood, { mottle: 0.4 });
      b.paint(b.rect(0.68, 1.84, 0.16, 0.22, 0.02, 0.2), P.skyPale, { mottle: 0.3, rim: 0.1 });
      b.flat(b.circle(0.84, 2.0, 0.018, 0), P.gold);
      b.paint(b.rect(0.12, 0.55, 1.3, 0.08, 0.02, 0.2), P.raspberry, { mottle: 0.3 });
    },
  },

  'flower-bed': {
    w: 1.35,
    h: 0.58,
    paint(b) {
      const soil = b.ellipse(0.68, 0.4, 0.62, 0.16, 1);
      b.paint(soil, mix(P.wood, P.sage, 0.4), { mottle: 0.8, rim: 0.12 });
      for (let i = 0; i < 9; i++) {
        const x = 0.16 + i * 0.13;
        const y = 0.28 + (i % 2) * 0.08;
        const c = [ROSE, P.pink, P.butter, P.lavender, P.white, P.raspberry, P.lilac, P.apricot, P.ember][i];
        bloom(b, x, y, 0.055, c);
        leaf(b, x, y + 0.12, i % 2 ? -0.8 : 0.8, 0.12, 0.035, P.leaf);
      }
    },
  },
};
