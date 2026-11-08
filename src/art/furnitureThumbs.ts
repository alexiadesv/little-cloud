import { createCanvas, ctx2d } from './paint/canvas';
import { FURNITURE_MODEL_ID } from '../data/furnitureModels';
import { furniture } from '../furniture-pack/catalog.ts';
import { renderCanvas } from '../furniture-pack/renderer.ts';

const thumbCache = new Map<string, string>();

/** Soft 3/4 view thumbnail of a pack mesh, used in trays and the unlock crate. */
export function furnitureThumbDataUrl(gameId: string, size = 160): string {
  const hit = thumbCache.get(gameId);
  if (hit) return hit;
  const modelId = FURNITURE_MODEL_ID[gameId];
  const asset = modelId ? furniture[modelId] : undefined;
  if (!asset) throw new Error(`No pack mesh for furniture "${gameId}"`);
  const canvas = createCanvas(size, size);
  const ctx = ctx2d(canvas, true);
  renderCanvas(ctx, asset.mesh, size, size, { yaw: -0.55, pitch: 0.38 }, true);
  const url = canvas.toDataURL('image/png');
  thumbCache.set(gameId, url);
  return url;
}
