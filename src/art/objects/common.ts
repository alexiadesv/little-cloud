import type { Brush } from '../paint/brush';
import { P, shade } from '../paint/color';

export interface PainterSpec {
  /** Width/height of the artwork's content box in painter units. The base sits at y = h. */
  w: number;
  h: number;
  paint(b: Brush): void;
}

export type PainterMap = Record<string, PainterSpec>;

export function wheel(b: Brush, cx: number, cy: number, r: number, hub: string = P.stone) {
  b.paint(b.circle(cx, cy, r, 0.5), P.charcoal, { mottle: 0.5, light: 0.15 });
  b.paint(b.circle(cx, cy, r * 0.52, 0.4), hub, { mottle: 0.4, rim: 0.2 });
  b.flat(b.circle(cx, cy, r * 0.16, 0.2), shade(hub, -0.4));
  b.glow(cx - r * 0.3, cy - r * 0.35, r * 0.35, '#ffffff', 0.35);
}

/** A grid of soft-edged windows with cream frames, optionally lit. */
export function windows(
  b: Brush,
  x: number,
  y: number,
  cols: number,
  rows: number,
  w: number,
  h: number,
  gapX: number,
  gapY: number,
  { glass = P.skyPale, frame = P.cream, lit = 0.25 }: { glass?: string; frame?: string; lit?: number } = {},
) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + c * (w + gapX);
      const wy = y + r * (h + gapY);
      b.flat(b.rect(wx - 0.025, wy - 0.025, w + 0.05, h + 0.05, 0.02, 0.4), frame, 0.95);
      const isLit = b.rng() < lit;
      b.paint(b.rect(wx, wy, w, h, 0.015, 0.3), isLit ? P.butter : glass, { mottle: 0.6, shadow: 0.2, rim: 0.1 });
      b.line([[wx + w / 2, wy], [wx + w / 2, wy + h]], frame, 0.018, { wobble: 0.2, alpha: 0.85 });
      b.glow(wx + w * 0.3, wy + h * 0.3, w * 0.4, '#ffffff', 0.35);
    }
  }
}

/** Umbrella canopy seen from the side: one gore per colour, from the tip down to a scalloped rim. */
export function canopy(b: Brush, cx: number, rimY: number, topY: number, rx: number, colors: string[]) {
  const n = colors.length;
  // Gore seams are meridians running from the tip down to the rim.
  const seam = (x: number) =>
    Array.from({ length: 7 }, (_, k): [number, number] => {
      const th = (k / 6) * (Math.PI / 2);
      return [cx + (x - cx) * Math.sin(th), rimY - (rimY - topY) * Math.cos(th)];
    });
  for (let i = 0; i < n; i++) {
    const x0 = cx - rx + (2 * rx * i) / n;
    const x1 = cx - rx + (2 * rx * (i + 1)) / n;
    const pts = [...seam(x0), [(x0 + x1) / 2, rimY + rx * 0.08] as [number, number], ...seam(x1).reverse().slice(0, -1)];
    b.paint(b.poly(pts, { smooth: false, wobble: 0.4 }), colors[i], { mottle: 0.6, rim: 0.12 });
  }
}

export function ripple(b: Brush, cx: number, cy: number, rx: number, ry: number, color: string = P.skyLight) {
  b.paint(b.ellipse(cx, cy, rx, ry, 1.5), color, { mottle: 0.8, light: 0.3, shadow: 0.1, rim: 0.12, alpha: 0.85 });
  b.line([[cx - rx * 0.6, cy], [cx - rx * 0.1, cy - ry * 0.25]], P.white, 0.025, { alpha: 0.7 });
  b.line([[cx + rx * 0.15, cy + ry * 0.2], [cx + rx * 0.6, cy]], P.white, 0.022, { alpha: 0.6 });
}
