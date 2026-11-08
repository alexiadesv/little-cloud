import { apartmentLevel } from './levels/apartment.ts';
import type { FurnitureDef, FurnitureKind, GameObjectDef, LevelDef, LevelId, PlacedFurniture } from './types.ts';

/** Dollhouse room: floor is MAP_SIZE across, walls stand this high. */
export const ROOM_WALL_H = 4.55;
export const ROOM_CEILING = 4.55;
export const ROTATE_STEP = Math.PI / 4;

export const FURNITURE: FurnitureDef[] = [
  // Busy Downtown Avenue
  { id: 'bold-chair', emoji: '🪑', name: 'Bold Chair', source: 'nyc', art: 'bold-chair', size: 3.15, kind: 'floor' },
  { id: 'subway-sign', emoji: '🪧', name: 'Subway sign', source: 'nyc', art: 'subway-sign', size: 2.1, kind: 'wall' },
  { id: 'basketball-lamp', emoji: '🏀', name: 'Basketball lamp', source: 'nyc', art: 'basketball-lamp', size: 3.55, kind: 'ceiling', glow: true },
  { id: 'cube-table', emoji: '🧊', name: 'Cube coffee table', source: 'nyc', art: 'cube-table', size: 2.45, kind: 'floor' },
  { id: 'locker-tv', emoji: '📺', name: 'Locker TV stand', source: 'nyc', art: 'locker-tv', size: 3.2, kind: 'floor' },

  // Tropical Night Market
  { id: 'floor-cushions', emoji: '🟪', name: 'Floor cushions', source: 'market', art: 'floor-cushions', size: 1.15, kind: 'floor' },
  { id: 'elephant-statue', emoji: '🐘', name: 'Elephant statue', source: 'market', art: 'elephant-statue', size: 2.0, kind: 'floor' },
  { id: 'tuktuk-sofa', emoji: '🛋️', name: 'Tuk-tuk sofa', source: 'market', art: 'tuktuk-sofa', size: 2.95, kind: 'floor' },
  { id: 'spirit-house', emoji: '🛕', name: 'Spirit house', source: 'market', art: 'spirit-house', size: 2.05, kind: 'floor' },
  { id: 'plastic-stool', emoji: '🪑', name: 'Plastic stool', source: 'market', art: 'plastic-stool', size: 1.35, kind: 'floor' },

  // Fiesta Beach
  { id: 'chihuahua', emoji: '🐶', name: 'Chihuahua plushie', source: 'seaside', art: 'chihuahua', size: 1.25, kind: 'floor' },
  { id: 'hammock-chair', emoji: '🏖️', name: 'Hammock chair', source: 'seaside', art: 'hammock-chair', size: 2.85, kind: 'floor' },
  { id: 'beach-mat', emoji: '🧺', name: 'Beach mat', source: 'seaside', art: 'beach-mat', size: 1.0, kind: 'floor' },
  { id: 'chiminea', emoji: '🔥', name: 'Clay chiminea', source: 'seaside', art: 'chiminea', size: 2.45, kind: 'floor' },
  { id: 'cactus-lamp', emoji: '🌵', name: 'Cactus lamp', source: 'seaside', art: 'cactus-lamp', size: 3.0, kind: 'floor' },

  // Rice Paddy Farm
  { id: 'lantern-lamp', emoji: '🏮', name: 'Rice-paper lamp', source: 'paddy', art: 'lantern-lamp', size: 2.9, kind: 'floor' },
  { id: 'gourd-table', emoji: '🎃', name: 'Gourd table', source: 'paddy', art: 'gourd-table', size: 1.45, kind: 'floor' },
  { id: 'bamboo-couch', emoji: '🎋', name: 'Bamboo couch', source: 'paddy', art: 'bamboo-couch', size: 2.9, kind: 'floor' },
  { id: 'water-lotus', emoji: '🪷', name: 'Water lotus', source: 'paddy', art: 'water-lotus', size: 1.8, kind: 'floor' },
  { id: 'lion-head', emoji: '🦁', name: 'Lion dance head', source: 'paddy', art: 'lion-head', size: 2.0, kind: 'wall' },

  // Alpine Wonderland
  { id: 'gondola-couch', emoji: '🚡', name: 'Gondola couch', source: 'alpine', art: 'gondola-couch', size: 3.0, kind: 'floor' },
  { id: 'cheese-light', emoji: '🧀', name: 'Cheese light', source: 'alpine', art: 'cheese-light', size: 2.5, kind: 'ceiling', glow: true },
  { id: 'cocoa-table', emoji: '☕', name: 'Cocoa can table', source: 'alpine', art: 'cocoa-table', size: 1.55, kind: 'floor' },
  { id: 'st-bernard', emoji: '🐕', name: 'St. Bernard plushie', source: 'alpine', art: 'st-bernard', size: 1.7, kind: 'floor' },
  { id: 'ski-rack', emoji: '🎿', name: 'Ski-pole rack', source: 'alpine', art: 'ski-rack', size: 3.15, kind: 'floor' },

  // Winding Garden
  { id: 'topiary-couch', emoji: '🌳', name: 'Topiary couch', source: 'garden', art: 'topiary-couch', size: 2.95, kind: 'floor' },
  { id: 'bouquet', emoji: '💐', name: 'Flower bouquet', source: 'garden', art: 'bouquet', size: 2.0, kind: 'floor' },
  { id: 'fountain-statue', emoji: '⛲', name: 'Tiered fountain', source: 'garden', art: 'fountain-statue', size: 2.65, kind: 'floor' },
  { id: 'street-lamp', emoji: '💡', name: 'Street-light lamp', source: 'garden', art: 'street-lamp', size: 3.35, kind: 'floor' },
  { id: 'telephone-box', emoji: '☎️', name: 'Telephone-box rack', source: 'garden', art: 'telephone-box', size: 3.2, kind: 'floor' },
];

export const furnitureById = new Map(FURNITURE.map((f) => [f.id, f]));

export function furnitureFor(source: LevelId): FurnitureDef[] {
  return FURNITURE.filter((f) => f.source === source);
}

export function isFurnitureId(value: unknown): value is string {
  return typeof value === 'string' && furnitureById.has(value);
}

export function furnitureLift(def: FurnitureDef): number {
  if (def.kind === 'ceiling') return Math.max(0.2, ROOM_CEILING - def.size - 0.02);
  if (def.kind === 'wall') return def.lift ?? 1.35;
  return def.lift ?? 0;
}

export function wrapRotation(rad: number) {
  const t = Math.PI * 2;
  return ((rad % t) + t) % t;
}

/** Keep furniture inside the dollhouse; snap wall pieces to the back wall. */
export function snapFurniture(kind: FurnitureKind, x: number, z: number): [number, number] {
  const clamp = (v: number, lo = -0.36, hi = 0.36) => Math.max(lo, Math.min(hi, v));
  if (kind === 'wall') return [clamp(x, -0.32, 0.32), -0.41];
  if (kind === 'ceiling') return [clamp(x, -0.34, 0.34), clamp(z, -0.3, 0.34)];
  return [clamp(x), clamp(z, -0.28, 0.36)];
}

export function apartmentScene(placed: PlacedFurniture[]): LevelDef {
  return {
    ...apartmentLevel,
    objects: placed.flatMap((p) => {
      const f = furnitureById.get(p.id);
      if (!f) return [];
      const object: GameObjectDef = {
        id: f.id,
        emoji: f.emoji,
        name: f.name,
        translations: {},
        position: p.position,
        size: f.size,
        lift: furnitureLift(f),
        art: f.art,
        rotation: p.rotation,
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
    const rotation = wrapRotation(Number((row as PlacedFurniture).rotation) || 0);
    seen.add(id);
    out.push({ id, position: snapFurniture(def.kind, x, z), rotation });
  }
  return out;
}
