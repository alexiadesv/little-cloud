import type { PainterMap, PainterSpec } from './common';
import { nycPainters } from './nyc';
import { marketPainters } from './market';
import { seasidePainters } from './seaside';
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
};

export const PAINTERS: PainterMap = { ...nycPainters, ...marketPainters, ...seasidePainters, ...celebrationPainters };

export function getPainter(key: string): PainterSpec {
  const painter = PAINTERS[key];
  if (!painter) throw new Error(`No painter registered for "${key}"`);
  return painter;
}
