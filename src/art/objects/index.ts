import type { PainterMap, PainterSpec } from './common';
import { nycPainters } from './nyc';
import { marketPainters } from './market';
import { seasidePainters } from './seaside';
import { paddyPainters } from './paddy';
import { alpinePainters } from './alpine';
import { gardenPainters } from './garden';
import { furniturePainters } from './furniture';
import { P } from '../paint/color';

export type { PainterSpec } from './common';

/** A star used for the "page complete" celebration shape. */
const celebrationPainters: PainterMap = {
  'celebration-star': {
    w: 1.2,
    h: 1.15,
    paint(b) {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.6 : 0.26;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push([0.6 + Math.cos(a) * r, 0.62 + Math.sin(a) * r]);
      }
      b.paint(b.poly(pts, { smooth: true, wobble: 0.5 }), P.butter, { mottle: 1 });
      b.glow(0.45, 0.45, 0.25, P.pink, 0.6);
      b.glow(0.75, 0.8, 0.22, P.apricot, 0.6);
    },
  },

  /** Storybook paintbrush for the loading veil. */
  'loading-brush': {
    w: 1.55,
    h: 0.72,
    paint(b) {
      // Wooden handle
      b.paint(
        b.poly(
          [
            [0.12, 0.28],
            [0.95, 0.22],
            [1.02, 0.32],
            [0.98, 0.42],
            [0.14, 0.48],
            [0.08, 0.38],
          ],
          { smooth: true, wobble: 0.35 },
        ),
        P.wood,
        { mottle: 0.55, light: 0.35, shadow: 0.25, rim: 0.14 },
      );
      b.line(
        [
          [0.18, 0.3],
          [0.9, 0.26],
        ],
        P.cream,
        0.03,
        { wobble: 0.2, alpha: 0.55 },
      );
      // Metal ferrule
      b.paint(b.ellipse(1.08, 0.34, 0.09, 0.14, 0.3), P.stone, { mottle: 0.35, light: 0.4, rim: 0.15 });
      b.line(
        [
          [1.02, 0.24],
          [1.14, 0.24],
        ],
        P.slate,
        0.018,
        { wobble: 0 },
      );
      b.line(
        [
          [1.02, 0.44],
          [1.14, 0.44],
        ],
        P.slate,
        0.018,
        { wobble: 0 },
      );
      // Soft bristles with a lick of paint
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const y = 0.18 + t * 0.34;
        const tip = 1.42 + Math.sin(t * Math.PI) * 0.04;
        b.line(
          [
            [1.14, y],
            [tip, y + (t - 0.5) * 0.06],
          ],
          i % 2 ? P.woodDeep : '#8a6a52',
          0.028,
          { wobble: 0.45, alpha: 0.9 },
        );
      }
      b.paint(b.ellipse(1.38, 0.22, 0.12, 0.07, 0.4), P.rose, { mottle: 0.5, light: 0.3, rim: 0.1 });
      b.paint(b.ellipse(1.4, 0.34, 0.1, 0.06, 0.3), P.sky, { mottle: 0.45, rim: 0.1 });
      b.paint(b.ellipse(1.36, 0.44, 0.11, 0.06, 0.35), P.butter, { mottle: 0.4, rim: 0.1 });
      b.glow(1.3, 0.28, 0.18, P.peach, 0.45);
    },
  },

  /** Rising sun for apartment morning lighting. */
  'time-morning': {
    w: 1.05,
    h: 0.95,
    paint(b) {
      b.paint(b.ellipse(0.52, 0.78, 0.48, 0.12, 0.4), P.lilac, { mottle: 0.3, alpha: 0.55, rim: 0 });
      b.paint(b.ellipse(0.52, 0.62, 0.36, 0.28, 0.35), P.peach, { mottle: 0.45, light: 0.35, rim: 0.1 });
      b.paint(b.ellipse(0.52, 0.58, 0.24, 0.2, 0.3), P.butter, { mottle: 0.35, light: 0.4, rim: 0.08 });
      for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) {
        const x0 = 0.52 + Math.cos(a - Math.PI / 2) * 0.28;
        const y0 = 0.55 + Math.sin(a - Math.PI / 2) * 0.22;
        const x1 = 0.52 + Math.cos(a - Math.PI / 2) * 0.46;
        const y1 = 0.55 + Math.sin(a - Math.PI / 2) * 0.38;
        b.line([[x0, y0], [x1, y1]], P.apricot, 0.035, { wobble: 0.35, alpha: 0.85 });
      }
      b.line([[0.08, 0.78], [0.96, 0.78]], P.inkSoft, 0.04, { wobble: 0.2, alpha: 0.35 });
      b.glow(0.45, 0.5, 0.22, P.butter, 0.55);
    },
  },

  /** Full sun for apartment day lighting. */
  'time-day': {
    w: 1.05,
    h: 1.05,
    paint(b) {
      b.paint(b.circle(0.52, 0.52, 0.26, 0.25), P.butter, { mottle: 0.5, light: 0.4, rim: 0.12 });
      b.paint(b.circle(0.52, 0.52, 0.16, 0.2), P.yellow, { mottle: 0.35, light: 0.35, rim: 0.08 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        b.line(
          [
            [0.52 + Math.cos(a) * 0.32, 0.52 + Math.sin(a) * 0.32],
            [0.52 + Math.cos(a) * 0.48, 0.52 + Math.sin(a) * 0.48],
          ],
          i % 2 ? P.apricot : P.peach,
          0.04,
          { wobble: 0.4, alpha: 0.9 },
        );
      }
      b.glow(0.42, 0.42, 0.28, P.peach, 0.5);
      b.glow(0.6, 0.58, 0.18, P.rose, 0.35);
    },
  },

  /** Crescent moon for apartment night lighting. */
  'time-night': {
    w: 1.05,
    h: 1.05,
    paint(b) {
      const crescent: [number, number][] = [];
      for (let i = 0; i <= 18; i++) {
        const t = -0.85 + (i / 18) * 1.7;
        crescent.push([0.48 + Math.cos(t) * 0.3, 0.52 + Math.sin(t) * 0.3]);
      }
      for (let i = 18; i >= 0; i--) {
        const t = -0.7 + (i / 18) * 1.4;
        crescent.push([0.62 + Math.cos(t) * 0.22, 0.48 + Math.sin(t) * 0.22]);
      }
      b.paint(b.poly(crescent, { smooth: true, wobble: 0.25 }), P.periwinkle, { mottle: 0.45, light: 0.3, rim: 0.12 });
      b.paint(b.circle(0.42, 0.44, 0.045, 0.2), P.lavender, { mottle: 0.2, rim: 0 });
      for (const [x, y, r] of [[0.22, 0.26, 0.028], [0.3, 0.78, 0.022], [0.82, 0.68, 0.02]] as const) {
        b.paint(b.circle(x, y, r, 0.2), P.butter, { mottle: 0.2, rim: 0 });
      }
      b.glow(0.4, 0.4, 0.22, P.lavender, 0.5);
      b.glow(0.7, 0.62, 0.16, P.skyPale, 0.35);
    },
  },
};

export const PAINTERS: PainterMap = {
  ...nycPainters,
  ...marketPainters,
  ...seasidePainters,
  ...paddyPainters,
  ...alpinePainters,
  ...gardenPainters,
  ...furniturePainters,
  ...celebrationPainters,
};

export function getPainter(key: string): PainterSpec {
  const painter = PAINTERS[key];
  if (!painter) throw new Error(`No painter registered for "${key}"`);
  return painter;
}
