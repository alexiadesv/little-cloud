export type Ctx = CanvasRenderingContext2D;

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function ctx2d(canvas: HTMLCanvasElement, willReadFrequently = false): Ctx {
  const ctx = canvas.getContext('2d', { willReadFrequently });
  if (!ctx) throw new Error('Canvas 2D is not available');
  return ctx;
}

let filterSupport: boolean | null = null;

/** Safari only recently gained `ctx.filter`; older engines need the shadow fallback. */
export function supportsCanvasFilter(): boolean {
  if (filterSupport !== null) return filterSupport;
  const ctx = ctx2d(createCanvas(4, 4));
  if (typeof ctx.filter !== 'string') return (filterSupport = false);
  ctx.filter = 'blur(2px)';
  return (filterSupport = ctx.filter === 'blur(2px)');
}

/** Draw `src` blurred by `px` pixels, using `ctx.filter` when available or a shadow trick otherwise. */
export function drawBlurred(
  ctx: Ctx,
  src: CanvasImageSource,
  px: number,
  alpha = 1,
  dx = 0,
  dy = 0,
  dw?: number,
  dh?: number,
) {
  const w = dw ?? (src as HTMLCanvasElement).width;
  const h = dh ?? (src as HTMLCanvasElement).height;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (px <= 0) {
    ctx.drawImage(src, dx, dy, w, h);
  } else if (supportsCanvasFilter()) {
    ctx.filter = `blur(${px}px)`;
    ctx.drawImage(src, dx, dy, w, h);
  } else {
    const scale = Math.max(1, px / 1.5);
    const tmp = createCanvas(w / scale, h / scale);
    const tctx = ctx2d(tmp);
    tctx.imageSmoothingQuality = 'high';
    tctx.drawImage(src, 0, 0, tmp.width, tmp.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmp, dx, dy, w, h);
  }
  ctx.restore();
}

/** Run drawing code with a blur filter (falls back to un-blurred drawing). */
export function withBlur(ctx: Ctx, px: number, draw: () => void) {
  ctx.save();
  if (supportsCanvasFilter() && px > 0) ctx.filter = `blur(${px}px)`;
  draw();
  ctx.restore();
}
