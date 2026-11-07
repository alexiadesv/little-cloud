import { type Ctx, withBlur } from './canvas';
import { rgba, shade } from './color';
import { type Rng, range, wobble1D } from './random';

type Pt = [number, number];

/** A painted region: its Path2D plus a pixel-space bounding box. */
export interface Shape {
  path: Path2D;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PaintOptions {
  /** Strength of the gouache blotches inside the shape (0 = flat). */
  mottle?: number;
  /** Strength of the lavender shadow pooling at the bottom. */
  shadow?: number;
  /** Strength of the warm highlight at the top. */
  light?: number;
  /** Strength of the darker watercolor rim. */
  rim?: number;
  alpha?: number;
}

export interface LineOptions {
  alpha?: number;
  wobble?: number;
  cap?: CanvasLineCap;
}

/**
 * Paints organic, slightly wobbly shapes in "unit" coordinates.
 * One unit = `scale` pixels; (0,0) is the top-left of the content box.
 */
export class Brush {
  constructor(
    readonly ctx: Ctx,
    readonly scale: number,
    readonly ox: number,
    readonly oy: number,
    readonly rng: Rng,
  ) {}

  x(u: number) {
    return this.ox + u * this.scale;
  }

  y(v: number) {
    return this.oy + v * this.scale;
  }

  /** Wobble amplitude in pixels for a given strength. */
  private amp(strength: number) {
    return strength * Math.max(1.2, this.scale * 0.01);
  }

  private resample(points: Pt[], closed: boolean, step: number): Pt[] {
    const out: Pt[] = [];
    const n = points.length;
    const edges = closed ? n : n - 1;
    for (let i = 0; i < edges; i++) {
      const a = points[i];
      const b = points[(i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const segs = Math.max(1, Math.ceil(len / step));
      for (let s = 0; s < segs; s++) {
        const t = s / segs;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    if (!closed) out.push(points[n - 1]);
    return out;
  }

  private jitter(points: Pt[], closed: boolean, strength: number, maxAmp = Infinity): Pt[] {
    if (strength <= 0) return points;
    const noise = wobble1D(this.rng);
    const amp = Math.min(this.amp(strength), maxAmp);
    const wavelength = Math.max(18, this.scale * 0.12);
    let dist = 0;
    return points.map((p, i) => {
      const prev = points[closed ? (i - 1 + points.length) % points.length : Math.max(0, i - 1)];
      const next = points[closed ? (i + 1) % points.length : Math.min(points.length - 1, i + 1)];
      if (i > 0) dist += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
      let nx = -(next[1] - prev[1]);
      let ny = next[0] - prev[0];
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      const o = noise(dist / wavelength) * amp;
      return [p[0] + nx * o, p[1] + ny * o];
    });
  }

  private build(points: Pt[], closed: boolean, smooth: boolean): Path2D {
    const path = new Path2D();
    const n = points.length;
    if (n < 2) return path;
    if (!smooth) {
      path.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < n; i++) path.lineTo(points[i][0], points[i][1]);
      if (closed) path.closePath();
      return path;
    }
    const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const start = mid(points[n - 1], points[0]);
      path.moveTo(start[0], start[1]);
      for (let i = 0; i < n; i++) {
        const m = mid(points[i], points[(i + 1) % n]);
        path.quadraticCurveTo(points[i][0], points[i][1], m[0], m[1]);
      }
      path.closePath();
    } else {
      path.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < n - 1; i++) {
        const m = mid(points[i], points[i + 1]);
        path.quadraticCurveTo(points[i][0], points[i][1], m[0], m[1]);
      }
      path.lineTo(points[n - 1][0], points[n - 1][1]);
    }
    return path;
  }

  private shapeFrom(points: Pt[], smooth: boolean, wobble: number): Shape {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minDim = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const pts = this.jitter(this.resample(points, true, 5), true, wobble, Math.max(0.8, minDim * 0.09) * wobble);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of pts) {
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
    return { path: this.build(pts, true, smooth), x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  /** Polygon in unit coordinates. `smooth` rounds the corners into blobby curves. */
  poly(points: Pt[], { smooth = false, wobble = 1 }: { smooth?: boolean; wobble?: number } = {}): Shape {
    return this.shapeFrom(points.map(([u, v]) => [this.x(u), this.y(v)]), smooth, wobble);
  }

  rect(x: number, y: number, w: number, h: number, r = 0.04, wobble = 1): Shape {
    const rr = Math.min(r, w / 2, h / 2);
    const pts: Pt[] = [];
    const corner = (cx: number, cy: number, a0: number) => {
      for (let i = 0; i <= 6; i++) {
        const a = a0 + (i / 6) * (Math.PI / 2);
        pts.push([this.x(cx + Math.cos(a) * rr), this.y(cy + Math.sin(a) * rr)]);
      }
    };
    corner(x + w - rr, y + rr, -Math.PI / 2);
    corner(x + w - rr, y + h - rr, 0);
    corner(x + rr, y + h - rr, Math.PI / 2);
    corner(x + rr, y + rr, Math.PI);
    return this.shapeFrom(pts, false, wobble);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, wobble = 1, rotation = 0): Shape {
    const steps = Math.max(24, Math.round(((rx + ry) * this.scale) / 4));
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const pts: Pt[] = [];
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const ex = Math.cos(a) * rx;
      const ey = Math.sin(a) * ry;
      pts.push([this.x(cx + ex * cos - ey * sin), this.y(cy + ex * sin + ey * cos)]);
    }
    return this.shapeFrom(pts, true, wobble);
  }

  circle(cx: number, cy: number, r: number, wobble = 1): Shape {
    return this.ellipse(cx, cy, r, r, wobble);
  }

  /** Fill with gouache-like mottling, a warm top light and a lavender bottom shadow. */
  paint(shape: Shape, color: string, opts: PaintOptions = {}): Shape {
    const { mottle = 1, shadow = 0.32, light = 0.22, rim = 0.28, alpha = 1 } = opts;
    const { ctx, rng } = this;
    const { x, y, w, h } = shape;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill(shape.path);
    ctx.clip(shape.path);

    const blotches = Math.round(2 + 5 * mottle);
    const big = Math.max(w, h);
    for (let i = 0; i < blotches && mottle > 0; i++) {
      const cx = x + rng() * w;
      const cy = y + rng() * h;
      const r = range(rng, 0.25, 0.65) * big;
      const c = shade(color, (rng() - 0.5) * 0.34 * mottle);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, rgba(c, 0.55));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }

    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, rgba(shade(color, 0.6), light));
    g.addColorStop(0.42, rgba(color, 0));
    g.addColorStop(1, rgba(shade(color, -0.55), shadow));
    ctx.fillStyle = g;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

    if (rim > 0) {
      withBlur(ctx, Math.max(1, Math.min(w, h) * 0.02), () => {
        ctx.strokeStyle = rgba(shade(color, -0.35), rim);
        ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.07);
        ctx.stroke(shape.path);
      });
    }
    ctx.restore();
    return shape;
  }

  /** Flat fill, for small details where mottling would be noise. */
  flat(shape: Shape, color: string, alpha = 1): Shape {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fill(shape.path);
    this.ctx.restore();
    return shape;
  }

  /** A soft round stroke through unit-space points. Width is in units. */
  line(points: Pt[], color: string, width: number, { alpha = 1, wobble = 0.6, cap = 'round' }: LineOptions = {}) {
    const px = points.map(([u, v]) => [this.x(u), this.y(v)] as Pt);
    const pts = this.jitter(this.resample(px, false, 6), false, wobble);
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * this.scale;
    ctx.lineCap = cap;
    ctx.lineJoin = 'round';
    ctx.stroke(this.build(pts, false, true));
    ctx.restore();
  }

  /** Outline a shape. Width is in units. */
  stroke(shape: Shape, color: string, width: number, alpha = 1) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * this.scale;
    ctx.lineJoin = 'round';
    ctx.stroke(shape.path);
    ctx.restore();
  }

  /** Hand-lettered sign text centred on (cx, cy). Size is the cap height in units. */
  text(str: string, cx: number, cy: number, size: number, color: string, { weight = 600, alpha = 1, maxWidth }: { weight?: number; alpha?: number; maxWidth?: number } = {}) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${weight} ${size * this.scale * 1.35}px "Fredoka Variable", "Trebuchet MS", sans-serif`;
    ctx.translate(this.x(cx), this.y(cy));
    ctx.rotate((this.rng() - 0.5) * 0.04);
    ctx.fillText(str, 0, 0, maxWidth ? maxWidth * this.scale : undefined);
    ctx.restore();
  }

  /** Soft radial spot (cheeks, glints, light glows). */
  glow(cx: number, cy: number, r: number, color: string, alpha = 0.6) {
    const { ctx } = this;
    const X = this.x(cx);
    const Y = this.y(cy);
    const R = r * this.scale;
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, R);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(1, rgba(color, 0));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(X - R, Y - R, R * 2, R * 2);
    ctx.restore();
  }

  /** Scatter small dabs inside a shape (texture: bricks, leaves, sand…). */
  speckle(shape: Shape, color: string, count: number, size: number, alpha = 0.5) {
    const { ctx, rng } = this;
    ctx.save();
    ctx.clip(shape.path);
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const px = shape.x + rng() * shape.w;
      const py = shape.y + rng() * shape.h;
      const r = size * this.scale * range(rng, 0.5, 1.3);
      ctx.globalAlpha = alpha * range(rng, 0.4, 1);
      ctx.beginPath();
      ctx.ellipse(px, py, r, r * range(rng, 0.6, 1), rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Simple friendly face: two dot eyes with highlights and an optional smile. */
  face(cx: number, cy: number, spacing: number, eye: number, { smile = true, cheeks = true } = {}) {
    for (const s of [-1, 1]) {
      this.flat(this.ellipse(cx + s * spacing, cy, eye, eye * 1.15, 0.3), '#3d3a5c');
      this.flat(this.circle(cx + s * spacing + eye * 0.3, cy - eye * 0.35, eye * 0.33, 0), '#ffffff', 0.9);
      if (cheeks) this.glow(cx + s * spacing * 1.5, cy + eye * 1.8, eye * 1.6, '#f08aa8', 0.45);
    }
    if (smile) {
      this.line(
        [
          [cx - spacing * 0.45, cy + eye * 1.6],
          [cx, cy + eye * 2.4],
          [cx + spacing * 0.45, cy + eye * 1.6],
        ],
        '#3d3a5c',
        eye * 0.45,
        { wobble: 0 },
      );
    }
  }
}
