/** Game furniture id → Fish-pack / GLB asset id (files in /furniture/*.glb). */
export const FURNITURE_MODEL_ID: Record<string, string> = {
  'bold-chair': 'bold-chair-blue',
  'subway-sign': 'subway-sign',
  'basketball-lamp': 'basketball-ceiling-lamp',
  'cube-table': 'chelebi-rubik-table',
  'locker-tv': 'locker-tv-stand',
  'floor-cushions': 'floor-cushions',
  'elephant-statue': 'elephant-statue',
  'tuktuk-sofa': 'tuk-tuk-sofa',
  'spirit-house': 'wall-shrine',
  'plastic-stool': 'plastic-stool',
  chihuahua: 'chihuahua-plushie',
  'hammock-chair': 'serape-hammock-chair',
  'beach-mat': 'woven-beach-mat',
  chiminea: 'clay-chiminea',
  'cactus-lamp': 'neon-cactus-lamp',
  'lantern-lamp': 'rice-paper-floor-lamp',
  'gourd-table': 'gourd-side-table',
  'bamboo-couch': 'bamboo-slat-couch',
  'water-lotus': 'potted-water-lotus',
  'lion-head': 'lion-dance-wall-head',
  'gondola-couch': 'gondola-couch',
  'cheese-light': 'cheese-ceiling-light',
  'cocoa-table': 'hot-chocolate-side-table',
  'st-bernard': 'st-bernard-plushie',
  'ski-rack': 'ski-pole-coat-rack',
  'topiary-couch': 'bibendum-topiary-couch',
  bouquet: 'bouquet-potted-plant',
  'fountain-statue': 'tiered-fountain',
  'street-lamp': 'streetlight-floor-lamp',
  'telephone-box': 'telephone-box-coat-rack',
};

/** World units per metre so pieces fill the dollhouse without dwarfing the room. */
export const FURNITURE_WORLD_SCALE = 1.72;

export function furnitureModelUrl(gameId: string): string {
  const model = FURNITURE_MODEL_ID[gameId];
  if (!model) throw new Error(`No GLB mapped for furniture "${gameId}"`);
  return `/furniture/${model}.glb`;
}
