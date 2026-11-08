import { furnitureById } from '../data/furniture';
import type { DecorDef, GameObjectDef, LevelDef, ObjectAsset } from '../data/types';
import { Brush } from './paint/brush';
import { createCanvas, ctx2d, drawBlurred } from './paint/canvas';
import { hexToRgb } from './paint/color';
import { applyGrain, featherSquare, finishArt, grainBlock } from './paint/finish';
import { hashString, rngFor } from './paint/random';
import { getPainter, type PainterSpec } from './objects';
import { MAP_PAINTERS } from './maps';
import { ROOM_PAINTERS, type RoomPainter } from './room';

/** Pixels per painter unit for object artwork. */
const PX_PER_UNIT = 280;
/** Transparent margin around painted content (painter units) so halos aren't clipped. */
const MARGIN = 0.16;

export interface HitMask {
  w: number;
  h: number;
  data: Uint8Array;
}

export interface ArtImage {
  canvas: HTMLCanvasElement;
  /** Content box in art units; the object's base sits at the bottom of the content box. */
  contentW: number;
  contentH: number;
  /** Transparent padding around the content, in art units. */
  margin: number;
  hitMask: HitMask;
}

export interface RoomArt {
  floor: HTMLCanvasElement;
  back: HTMLCanvasElement;
  side: HTMLCanvasElement;
  left: HTMLCanvasElement;
  front: HTMLCanvasElement;
  ceiling: HTMLCanvasElement;
  door: HTMLCanvasElement;
}

export interface LevelArt {
  map: HTMLCanvasElement;
  objects: Map<string, ArtImage>;
  decor: ArtImage[];
  thumbs: Record<string, string>;
  room?: RoomArt;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  fontsReady ??= document.fonts?.load('700 48px "Fredoka Variable"').catch(() => undefined) ?? Promise.resolve();
  return fontsReady;
}

export function renderPainter(spec: PainterSpec, key: string, flip = false): ArtImage {
  const W = (spec.w + MARGIN * 2) * PX_PER_UNIT;
  const H = (spec.h + MARGIN * 2) * PX_PER_UNIT;
  const raw = createCanvas(W, H);
  const ctx = ctx2d(raw);
  if (flip) {
    ctx.translate(raw.width, 0);
    ctx.scale(-1, 1);
  }
  const brush = new Brush(ctx, PX_PER_UNIT, MARGIN * PX_PER_UNIT, MARGIN * PX_PER_UNIT, rngFor(key));
  spec.paint(brush);
  const canvas = finishArt(raw, { seed: hashString(key) });
  return { canvas, contentW: spec.w, contentH: spec.h, margin: MARGIN, hitMask: buildHitMask(canvas) };
}

/** Low-resolution alpha mask, dilated so small fingers can still hit thin objects. */
export function buildHitMask(canvas: HTMLCanvasElement, maxSize = 72): HitMask {
  const s = maxSize / Math.max(canvas.width, canvas.height);
  const w = Math.max(4, Math.round(canvas.width * s));
  const h = Math.max(4, Math.round(canvas.height * s));
  const small = createCanvas(w, h);
  const ctx = ctx2d(small, true);
  ctx.drawImage(canvas, 0, 0, w, h);
  const alpha = ctx.getImageData(0, 0, w, h).data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = alpha[i * 4 + 3] > 70 ? 1 : 0;
  const data = new Uint8Array(w * h);
  const r = 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let hit = 0;
      for (let dy = -r; dy <= r && !hit; dy++) {
        for (let dx = -r; dx <= r && !hit; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && solid[yy * w + xx]) hit = 1;
        }
      }
      data[y * w + x] = hit;
    }
  }
  return { w, h, data };
}

/** True when the hit mask is solid at texture coordinates (u, v) with v = 0 at the bottom. */
export function hitTest(mask: HitMask, u: number, v: number): boolean {
  const x = Math.floor(u * mask.w);
  const y = Math.floor((1 - v) * mask.h);
  if (x < 0 || y < 0 || x >= mask.w || y >= mask.h) return false;
  return mask.data[y * mask.w + x] === 1;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  return img;
}

const isJpeg = (src: string) => /\.jpe?g($|\?)/i.test(src);

function averageCorners(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const pts = [0, w - 1, (h - 1) * w, h * w - 1];
  const sum = [0, 0, 0];
  for (const p of pts) for (let c = 0; c < 3; c++) sum[c] += data[p * 4 + c];
  return [sum[0] / 4, sum[1] / 4, sum[2] / 4];
}

/** Keys a flat paper background out of opaque artwork (JPGs) with a soft ramp. */
function keyBackground(canvas: HTMLCanvasElement, keyColor: string | undefined, tolerance: number) {
  const ctx = ctx2d(canvas, true);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const key = keyColor ? hexToRgb(keyColor) : averageCorners(d, canvas.width, canvas.height);
  const lo = tolerance * 441;
  const hi = tolerance * 2.2 * 441;
  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.hypot(d[i] - key[0], d[i + 1] - key[1], d[i + 2] - key[2]);
    const t = Math.max(0, Math.min(1, (dist - lo) / (hi - lo)));
    d[i + 3] = d[i + 3] * t * t * (3 - 2 * t);
  }
  ctx.putImageData(img, 0, 0);
}

function applyMask(canvas: HTMLCanvasElement, mask: HTMLImageElement) {
  const m = createCanvas(canvas.width, canvas.height);
  const mctx = ctx2d(m, true);
  mctx.drawImage(mask, 0, 0, m.width, m.height);
  const md = mctx.getImageData(0, 0, m.width, m.height).data;
  const ctx = ctx2d(canvas, true);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (md[i] * 0.299 + md[i + 1] * 0.587 + md[i + 2] * 0.114) / 255;
    d[i + 3] = d[i + 3] * lum;
  }
  ctx.putImageData(img, 0, 0);
}

/** Loads illustrated JPG / PNG / WebP artwork and gives it the same treatment as painted art. */
export async function renderExternal(asset: ObjectAsset, key: string, flip = false): Promise<ArtImage> {
  const img = await loadImage(asset.src);
  const fit = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * fit);
  const h = Math.round(img.naturalHeight * fit);
  const body = createCanvas(w, h);
  const bctx = ctx2d(body, true);
  bctx.drawImage(img, 0, 0, w, h);
  if (asset.mask) applyMask(body, await loadImage(asset.mask));
  else if (asset.keyColor || isJpeg(asset.src)) keyBackground(body, asset.keyColor, asset.keyTolerance ?? 0.1);
  if (asset.overlay) bctx.drawImage(await loadImage(asset.overlay), 0, 0, w, h);

  const pad = Math.round(Math.max(w, h) * 0.06);
  const canvas = createCanvas(w + pad * 2, h + pad * 2);
  const ctx = ctx2d(canvas, true);
  if (flip) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  if (asset.grain !== false) drawBlurred(ctx, body, Math.max(w, h) * 0.012, 0.35, pad, pad);
  ctx.drawImage(body, pad, pad);
  if (asset.grain !== false) applyGrain(canvas, { seed: hashString(key), amount: 0.05, block: grainBlock(canvas.width) });

  const unit = h / 1; // content height = 1 art unit
  return { canvas, contentW: w / unit, contentH: 1, margin: pad / unit, hitMask: buildHitMask(canvas) };
}

async function renderItem(def: GameObjectDef | DecorDef, key: string): Promise<ArtImage> {
  if (def.asset) {
    try {
      return await renderExternal(def.asset, key, def.flip);
    } catch (err) {
      console.warn(`[art] Could not load "${def.asset.src}", painting "${def.art}" instead.`, err);
    }
  }
  return renderPainter(getPainter(def.art), key, def.flip);
}

export function makeThumb(art: ArtImage, size = 128): string {
  const s = size / Math.max(art.canvas.width, art.canvas.height);
  const c = createCanvas(art.canvas.width * s, art.canvas.height * s);
  ctx2d(c).drawImage(art.canvas, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

function mapResolution() {
  const small = Math.min(window.screen.width, window.screen.height) < 700;
  return small ? 1536 : 2048;
}

export async function renderMap(level: LevelDef): Promise<HTMLCanvasElement> {
  const S = mapResolution();
  const inset = Math.round(S * 0.03);
  const raw = createCanvas(S, S);
  const ctx = ctx2d(raw, true);

  if (level.mapAsset) {
    const img = await loadImage(level.mapAsset);
    ctx.drawImage(img, inset, inset, S - inset * 2, S - inset * 2);
  } else {
    const content = S - inset * 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset * 0.4, inset * 0.4, S - inset * 0.8, S - inset * 0.8);
    ctx.clip();
    MAP_PAINTERS[level.map](new Brush(ctx, content, inset, inset, rngFor(`map-${level.id}`)));
    ctx.restore();
  }

  const soft = createCanvas(S, S);
  drawBlurred(ctx2d(soft, true), raw, S * 0.0022, 1);
  applyGrain(soft, { seed: hashString(level.id), amount: 0.07, chroma: 0.8, dither: false, block: grainBlock(S) });
  featherSquare(soft, {
    seed: hashString(`edge-${level.id}`),
    feather: S * 0.02,
    wander: S * 0.012,
    radius: S * 0.035,
    inset: inset * 0.9,
  });
  return soft;
}

/** Contact shadow / page shadow textures. */
export function renderSoftEllipse(size: number, color: string, alpha: number, falloff = 0.5): HTMLCanvasElement {
  const c = createCanvas(size, size);
  const ctx = ctx2d(c);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const [r, gg, b] = hexToRgb(color);
  g.addColorStop(0, `rgba(${r},${gg},${b},${alpha})`);
  g.addColorStop(falloff, `rgba(${r},${gg},${b},${alpha * 0.55})`);
  g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export function renderPageShadow(size: number): HTMLCanvasElement {
  const c = createCanvas(size, size);
  const ctx = ctx2d(c);
  const pad = size * 0.16;
  ctx.fillStyle = 'rgba(92, 84, 150, 0.55)';
  ctx.beginPath();
  ctx.roundRect(pad, pad, size - pad * 2, size - pad * 2, size * 0.06);
  ctx.fill();
  const out = createCanvas(size, size);
  drawBlurred(ctx2d(out), c, size * 0.05, 1);
  return out;
}

const levelCache = new Map<string, Promise<LevelArt>>();

export function loadLevelArt(level: LevelDef, onProgress?: (fraction: number) => void): Promise<LevelArt> {
  const cached = levelCache.get(level.id);
  if (cached) {
    onProgress?.(1);
    return cached;
  }
  const job = (async () => {
    await ensureFonts();
    const total = level.objects.length + level.decor.length + 1;
    let done = 0;
    const tick = async () => {
      onProgress?.(++done / total);
      await nextFrame();
    };
    const map = await renderMap(level);
    await tick();
    const objects = new Map<string, ArtImage>();
    const thumbs: Record<string, string> = {};
    for (const obj of level.objects) {
      const art = await renderItem(obj, `obj-${obj.id}`);
      objects.set(obj.id, art);
      thumbs[obj.id] = makeThumb(art);
      await tick();
    }
    const decor: ArtImage[] = [];
    for (const [i, d] of level.decor.entries()) {
      decor.push(await renderItem(d, `decor-${level.id}-${i}-${d.art}`));
      await tick();
    }
    return { map, objects, decor, thumbs };
  })();
  levelCache.set(level.id, job);
  job.catch(() => levelCache.delete(level.id));
  return job;
}

let celebration: ArtImage | null = null;
export function celebrationArt(): ArtImage {
  celebration ??= renderPainter(getPainter('celebration-star'), 'celebration-star');
  return celebration;
}

let loadingBrush: ArtImage | null = null;
/** Painted paintbrush used on the loading veil. */
export function loadingBrushArt(): ArtImage {
  loadingBrush ??= renderPainter(getPainter('loading-brush'), 'loading-brush');
  return loadingBrush;
}

const timeIcons = new Map<string, string>();
/** Data-URL for a painted morning / day / night slider glyph. */
export function roomTimeIconUrl(key: 'time-morning' | 'time-day' | 'time-night'): string {
  const hit = timeIcons.get(key);
  if (hit) return hit;
  const url = renderPainter(getPainter(key), key).canvas.toDataURL('image/png');
  timeIcons.set(key, url);
  return url;
}

function renderRoomTexture(paint: RoomPainter, key: string, width: number, height: number) {
  const raw = createCanvas(width, height);
  const ctx = ctx2d(raw, true);
  paint(new Brush(ctx, width, 0, 0, rngFor(key)));
  const out = createCanvas(width, height);
  // Soften brush edges slightly — no film grain (it read as a grey cast on white walls).
  drawBlurred(ctx2d(out, true), raw, Math.max(1, width * 0.0012), 1);
  return out;
}

let roomCache: RoomArt | null = null;
let roomCacheKey = '';
export async function renderRoomArt(): Promise<RoomArt> {
  const key = 'v6-front-wall-doorway';
  if (roomCache && roomCacheKey === key) return roomCache;
  await ensureFonts();
  const S = mapResolution();
  roomCacheKey = key;
  roomCache = {
    floor: renderRoomTexture(MAP_PAINTERS.apartment, `room-floor-${key}`, S, S),
    back: renderRoomTexture(ROOM_PAINTERS.back, `room-back-${key}`, S, S),
    side: renderRoomTexture(ROOM_PAINTERS.side, `room-side-${key}`, S, S),
    left: renderRoomTexture(ROOM_PAINTERS.left, `room-left-${key}`, S, S),
    front: renderRoomTexture(ROOM_PAINTERS.front, `room-front-${key}`, S, S),
    ceiling: renderRoomTexture(ROOM_PAINTERS.ceiling, `room-ceiling-${key}`, S, S),
    door: renderRoomTexture(ROOM_PAINTERS.door, `room-door-${key}`, S, S),
  };
  return roomCache;
}

const furnitureCache = new Map<string, ArtImage>();

export function renderFurniture(id: string): ArtImage {
  const hit = furnitureCache.get(id);
  if (hit) return hit;
  const def = furnitureById.get(id);
  if (!def) throw new Error(`No furniture "${id}"`);
  const art = renderPainter(getPainter(def.art), `furn-v5-${id}`);
  furnitureCache.set(id, art);
  return art;
}

/** Room textures plus 3D-pack thumbnails for unlocked furniture. */
export async function loadApartmentArt(unlocked: string[], onProgress?: (fraction: number) => void): Promise<LevelArt> {
  await ensureFonts();
  const { furnitureThumbDataUrl } = await import('./furnitureThumbs');
  const total = unlocked.length + 1;
  let done = 0;
  const tick = async () => {
    onProgress?.(++done / total);
    await nextFrame();
  };
  const room = await renderRoomArt();
  await tick();
  const objects = new Map<string, ArtImage>();
  const thumbs: Record<string, string> = {};
  for (const id of unlocked) {
    thumbs[id] = furnitureThumbDataUrl(id);
    await tick();
  }
  return { map: room.floor, objects, decor: [], thumbs, room };
}
