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

export interface PersonStyle {
  skin: string;
  hair: string;
  top: string;
  bottom?: string;
  dress?: boolean;
  hat?: string;
  /** Where the hands are, so neighbours can hold hands. */
  hands: [[number, number], [number, number]];
}

export function person(b: Brush, x: number, base: number, h: number, o: PersonStyle) {
  const r = h * 0.12;
  const headY = base - h + r;
  const hip = base - h * 0.44;
  for (const s of [-1, 1]) {
    b.line([[x + s * h * 0.05, hip], [x + s * h * 0.06, base - h * 0.03]], o.skin, h * 0.065, { wobble: 0 });
    b.paint(b.ellipse(x + s * h * 0.075, base - h * 0.02, h * 0.05, h * 0.022, 0.2), o.top, { rim: 0 });
  }
  const shoulder = base - h * 0.72;
  for (const [i, s] of [[0, -1], [1, 1]] as const) {
    const [hx, hy] = o.hands[i];
    b.line([[x + s * h * 0.1, shoulder + h * 0.03], [hx, hy]], o.skin, h * 0.05, { wobble: 0 });
  }
  if (o.dress) {
    b.paint(b.poly([[x - h * 0.1, shoulder], [x + h * 0.1, shoulder], [x + h * 0.19, base - h * 0.3], [x - h * 0.19, base - h * 0.3]], { wobble: 0.3 }), o.top, { mottle: 0.5 });
    for (let i = 0; i < 4; i++) b.flat(b.circle(x - h * 0.08 + i * h * 0.055, base - h * (0.4 + (i % 2) * 0.12), h * 0.015, 0), P.cream, 0.85);
  } else {
    b.paint(b.rect(x - h * 0.11, hip - h * 0.04, h * 0.22, h * 0.14, h * 0.03, 0.3), o.bottom ?? o.top, { mottle: 0.4 });
    b.paint(b.rect(x - h * 0.11, shoulder, h * 0.22, hip - shoulder, h * 0.05, 0.3), o.top, { mottle: 0.5 });
  }
  b.paint(b.circle(x, headY, r, 0.2), o.skin, { mottle: 0.3, rim: 0.15 });
  b.paint(b.ellipse(x, headY - r * 0.45, r * 1.05, r * 0.65, 0.4), o.hair, { mottle: 0.3, rim: 0.1 });
  if (o.hat) {
    b.paint(b.ellipse(x, headY - r * 0.55, r * 1.9, r * 0.35, 0.3), o.hat, { mottle: 0.4, rim: 0.12 });
    b.paint(b.ellipse(x, headY - r * 0.9, r * 0.95, r * 0.6, 0.3), o.hat, { mottle: 0.4, rim: 0.12 });
    b.line([[x - r * 0.9, headY - r * 0.68], [x + r * 0.9, headY - r * 0.68]], P.rose, r * 0.18, { wobble: 0 });
  }
  for (const s of [-1, 1]) b.flat(b.circle(x + s * r * 0.36, headY + r * 0.12, r * 0.1, 0), P.ink);
  b.line([[x - r * 0.25, headY + r * 0.42], [x, headY + r * 0.56], [x + r * 0.25, headY + r * 0.42]], P.ink, r * 0.1, { wobble: 0 });
  for (const s of [-1, 1]) b.glow(x + s * r * 0.6, headY + r * 0.35, r * 0.25, P.rose, 0.35);
}
