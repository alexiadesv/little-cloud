import { furniture as packFurniture } from '../furniture-pack/catalog.ts';
import { apartmentLevel } from './levels/apartment.ts';
import { FURNITURE_MODEL_ID, FURNITURE_WORLD_SCALE } from './furnitureModels.ts';
import type { FurnitureDef, FurnitureKind, GameObjectDef, LevelDef, LevelId, PlacedFurniture, WallFace } from './types.ts';

/** Must match engine/props MAP_SIZE — kept local to avoid a circular import. */
const ROOM_MAP_SIZE = 10;

/** Dollhouse room: floor is MAP_SIZE across, walls stand this high. */
export const ROOM_WALL_H = 4.55;
export const ROOM_CEILING = 4.55;
export const ROTATE_STEP = Math.PI / 4;
/** Orbit the whole living room left/right. */
export const ROOM_ORBIT_STEP = Math.PI / 8;
export type { WallFace };

function packHeight(id: string, fallback: number) {
  const model = FURNITURE_MODEL_ID[id];
  const asset = model ? packFurniture[model] : undefined;
  return asset ? asset.size[1] * FURNITURE_WORLD_SCALE : fallback;
}

export const FURNITURE: FurnitureDef[] = [
  // Busy Downtown Avenue
  { id: 'bold-chair', emoji: '🪑', name: 'Bold Chair', source: 'nyc', art: 'bold-chair', size: packHeight('bold-chair', 2.2), kind: 'floor' },
  { id: 'subway-sign', emoji: '🪧', name: 'Subway sign', source: 'nyc', art: 'subway-sign', size: packHeight('subway-sign', 1.05), kind: 'wall' },
  { id: 'basketball-lamp', emoji: '🏀', name: 'Basketball lamp', source: 'nyc', art: 'basketball-lamp', size: packHeight('basketball-lamp', 2.0), kind: 'ceiling', glow: true },
  { id: 'cube-table', emoji: '🧊', name: 'Cube coffee table', source: 'nyc', art: 'cube-table', size: packHeight('cube-table', 1.0), kind: 'floor' },
  { id: 'locker-tv', emoji: '📺', name: 'Locker TV stand', source: 'nyc', art: 'locker-tv', size: packHeight('locker-tv', 2.55), kind: 'floor' },

  // Tropical Night Market
  { id: 'floor-cushions', emoji: '🟪', name: 'Floor cushions', source: 'market', art: 'floor-cushions', size: packHeight('floor-cushions', 0.8), kind: 'floor' },
  { id: 'elephant-statue', emoji: '🐘', name: 'Elephant statue', source: 'market', art: 'elephant-statue', size: packHeight('elephant-statue', 1.8), kind: 'floor' },
  { id: 'tuktuk-sofa', emoji: '🛋️', name: 'Tuk-tuk sofa', source: 'market', art: 'tuktuk-sofa', size: packHeight('tuktuk-sofa', 3.0), kind: 'floor' },
  { id: 'spirit-house', emoji: '🛕', name: 'Spirit house', source: 'market', art: 'spirit-house', size: packHeight('spirit-house', 2.8), kind: 'wall', lift: 0.35 },
  { id: 'plastic-stool', emoji: '🪑', name: 'Plastic stool', source: 'market', art: 'plastic-stool', size: packHeight('plastic-stool', 0.95), kind: 'floor' },

  // Fiesta Beach
  { id: 'chihuahua', emoji: '🐶', name: 'Chihuahua plushie', source: 'seaside', art: 'chihuahua', size: packHeight('chihuahua', 1.4), kind: 'floor' },
  { id: 'hammock-chair', emoji: '🏖️', name: 'Hammock chair', source: 'seaside', art: 'hammock-chair', size: packHeight('hammock-chair', 3.2), kind: 'floor' },
  { id: 'beach-mat', emoji: '🧺', name: 'Beach mat', source: 'seaside', art: 'beach-mat', size: packHeight('beach-mat', 0.1), kind: 'floor' },
  { id: 'chiminea', emoji: '🔥', name: 'Clay chiminea', source: 'seaside', art: 'chiminea', size: packHeight('chiminea', 2.2), kind: 'floor' },
  { id: 'cactus-lamp', emoji: '🌵', name: 'Cactus lamp', source: 'seaside', art: 'cactus-lamp', size: packHeight('cactus-lamp', 2.6), kind: 'floor' },

  // Rice Paddy Farm
  { id: 'lantern-lamp', emoji: '🏮', name: 'Rice-paper lamp', source: 'paddy', art: 'lantern-lamp', size: packHeight('lantern-lamp', 3.0), kind: 'floor' },
  { id: 'gourd-table', emoji: '🎃', name: 'Gourd table', source: 'paddy', art: 'gourd-table', size: packHeight('gourd-table', 1.0), kind: 'floor' },
  { id: 'bamboo-couch', emoji: '🎋', name: 'Bamboo couch', source: 'paddy', art: 'bamboo-couch', size: packHeight('bamboo-couch', 1.8), kind: 'floor' },
  { id: 'water-lotus', emoji: '🪷', name: 'Water lotus', source: 'paddy', art: 'water-lotus', size: packHeight('water-lotus', 1.5), kind: 'floor' },
  { id: 'lion-head', emoji: '🦁', name: 'Lion dance head', source: 'paddy', art: 'lion-head', size: packHeight('lion-head', 1.7), kind: 'wall', lift: 1.5 },

  // Alpine Wonderland
  { id: 'gondola-couch', emoji: '🚡', name: 'Gondola couch', source: 'alpine', art: 'gondola-couch', size: packHeight('gondola-couch', 2.6), kind: 'floor' },
  { id: 'cheese-light', emoji: '🧀', name: 'Cheese light', source: 'alpine', art: 'cheese-light', size: packHeight('cheese-light', 1.1), kind: 'ceiling', glow: true },
  { id: 'cocoa-table', emoji: '☕', name: 'Cocoa can table', source: 'alpine', art: 'cocoa-table', size: packHeight('cocoa-table', 1.1), kind: 'floor' },
  { id: 'st-bernard', emoji: '🐕', name: 'St. Bernard plushie', source: 'alpine', art: 'st-bernard', size: packHeight('st-bernard', 1.5), kind: 'floor' },
  { id: 'ski-rack', emoji: '🎿', name: 'Ski-pole rack', source: 'alpine', art: 'ski-rack', size: packHeight('ski-rack', 3.0), kind: 'floor' },

  // Winding Garden
  { id: 'topiary-couch', emoji: '🌳', name: 'Topiary couch', source: 'garden', art: 'topiary-couch', size: packHeight('topiary-couch', 2.4), kind: 'floor' },
  { id: 'bouquet', emoji: '💐', name: 'Flower bouquet', source: 'garden', art: 'bouquet', size: packHeight('bouquet', 1.7), kind: 'floor' },
  { id: 'fountain-statue', emoji: '⛲', name: 'Tiered fountain', source: 'garden', art: 'fountain-statue', size: packHeight('fountain-statue', 2.4), kind: 'floor' },
  { id: 'street-lamp', emoji: '💡', name: 'Street-light lamp', source: 'garden', art: 'street-lamp', size: packHeight('street-lamp', 3.7), kind: 'floor' },
  { id: 'telephone-box', emoji: '☎️', name: 'Telephone-box rack', source: 'garden', art: 'telephone-box', size: packHeight('telephone-box', 3.5), kind: 'floor' },
];

export const furnitureById = new Map(FURNITURE.map((f) => [f.id, f]));

/** Footprint width in world units (from the 3D pack bounds). */
export function furnitureWidth(id: string): number {
  const model = FURNITURE_MODEL_ID[id];
  const asset = model ? packFurniture[model] : undefined;
  if (!asset) return furnitureById.get(id)?.size ?? 1;
  return Math.max(asset.size[0], asset.size[2]) * FURNITURE_WORLD_SCALE;
}

/** Depth along the facing axis (local +Z), in world units. */
export function furnitureDepth(id: string): number {
  const model = FURNITURE_MODEL_ID[id];
  const asset = model ? packFurniture[model] : undefined;
  return (asset?.size[2] ?? 0.2) * FURNITURE_WORLD_SCALE;
}

export function furnitureFor(source: LevelId): FurnitureDef[] {
  return FURNITURE.filter((f) => f.source === source);
}

export function isFurnitureId(value: unknown): value is string {
  return typeof value === 'string' && furnitureById.has(value);
}

export function furnitureLift(def: FurnitureDef, override?: number): number {
  if (def.kind === 'ceiling') return Math.max(0.2, ROOM_CEILING - def.size - 0.02);
  if (def.kind === 'wall') {
    const base = override ?? def.lift ?? 1.35;
    return clampWallLift(base, def.size);
  }
  return def.lift ?? 0;
}

export function clampWallLift(lift: number, size: number) {
  const lo = 0.2;
  const hi = Math.max(lo, ROOM_WALL_H - size - 0.15);
  return Math.max(lo, Math.min(hi, lift));
}

export function wrapRotation(rad: number) {
  const t = Math.PI * 2;
  return ((rad % t) + t) % t;
}

export function wallRotation(wall: WallFace): number {
  if (wall === 'left') return Math.PI / 2;
  if (wall === 'right') return -Math.PI / 2;
  return 0;
}

export function nearestWall(x: number, z: number): WallFace {
  const dBack = Math.abs(z + 0.5);
  const dLeft = Math.abs(x + 0.5);
  const dRight = Math.abs(x - 0.5);
  if (dLeft <= dBack && dLeft <= dRight) return 'left';
  if (dRight <= dBack && dRight <= dLeft) return 'right';
  return 'back';
}

export interface FurniturePose {
  position: [number, number];
  rotation: number;
  lift: number;
  wall?: WallFace;
}

/**
 * Keep furniture inside the dollhouse. Wall pieces sit flush: the back of the
 * mesh kisses the wall plane (front of each GLB faces +Z / into the room).
 */
export function snapFurniture(
  kind: FurnitureKind,
  x: number,
  z: number,
  lift = 0,
  wall?: WallFace,
  size = 1.2,
  depth = 0.25,
): FurniturePose {
  const clamp = (v: number, lo = -0.36, hi = 0.36) => Math.max(lo, Math.min(hi, v));
  if (kind === 'wall') {
    const face = wall ?? nearestWall(x, z);
    const along = face === 'back' ? clamp(x, -0.34, 0.34) : clamp(z, -0.34, 0.34);
    // Map units from wall plane to the piece centre so the back face is flush.
    const inset = Math.max(0.012, depth / (2 * ROOM_MAP_SIZE) + 0.004);
    const edge = 0.5 - 0.001;
    const position: [number, number] =
      face === 'back'
        ? [along, -edge + inset]
        : face === 'left'
          ? [-edge + inset, along]
          : [edge - inset, along];
    return { position, rotation: wallRotation(face), lift: clampWallLift(lift, size), wall: face };
  }
  if (kind === 'ceiling') {
    return { position: [clamp(x, -0.34, 0.34), clamp(z, -0.3, 0.34)], rotation: 0, lift };
  }
  return { position: [clamp(x), clamp(z, -0.28, 0.36)], rotation: 0, lift: 0 };
}

export function snapFurnitureFor(def: FurnitureDef, x: number, z: number, lift?: number, wall?: WallFace): FurniturePose {
  return snapFurniture(def.kind, x, z, lift ?? furnitureLift(def), wall, def.size, furnitureDepth(def.id));
}

export function apartmentScene(placed: PlacedFurniture[]): LevelDef {
  return {
    ...apartmentLevel,
    objects: placed.flatMap((p) => {
      const f = furnitureById.get(p.id);
      if (!f) return [];
      const pose = f.kind === 'wall' ? snapFurnitureFor(f, p.position[0], p.position[1], p.lift, p.wall) : null;
      const object: GameObjectDef = {
        id: f.id,
        emoji: f.emoji,
        name: f.name,
        translations: {},
        position: pose?.position ?? p.position,
        size: f.size,
        lift: pose?.lift ?? p.lift ?? furnitureLift(f),
        art: f.art,
        rotation: pose?.rotation ?? p.rotation,
      };
      return [object];
    }),
  };
}

export function sanitizePlaced(list: unknown): PlacedFurniture[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: PlacedFurniture[] = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const id = (row as PlacedFurniture).id;
    const position = (row as PlacedFurniture).position;
    const def = furnitureById.get(id);
    if (!def || seen.has(id) || !Array.isArray(position) || position.length !== 2) continue;
    const x = Number(position[0]);
    const z = Number(position[1]);
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    const rawLift = Number((row as PlacedFurniture).lift);
    const wall = (row as PlacedFurniture).wall;
    const pose = snapFurnitureFor(
      def,
      x,
      z,
      Number.isFinite(rawLift) ? rawLift : furnitureLift(def),
      wall === 'back' || wall === 'left' || wall === 'right' ? wall : undefined,
    );
    seen.add(id);
    out.push({
      id,
      position: pose.position,
      rotation: def.kind === 'wall' ? pose.rotation : wrapRotation(Number((row as PlacedFurniture).rotation) || 0),
      lift: def.kind === 'floor' ? undefined : pose.lift,
      wall: pose.wall,
    });
  }
  return out;
}
