export type LangCode =
  | 'en'
  | 'en-gb'
  | 'es'
  | 'fr'
  | 'de'
  | 'zh'
  | 'ja'
  | 'th'
  | 'ko'
  | 'vi'
  | 'pt'
  | 'nl'
  | 'tr'
  | 'ar'
  | 'hi'
  | 'it'
  | 'el'
  | 'ru';
export type ForeignLang = Exclude<LangCode, 'en' | 'en-gb'>;

export interface Translation {
  text: string;
  /** Kana reading for Japanese words written with kanji. */
  reading?: string;
  /** Latin-alphabet pronunciation hint (pinyin / romaji). */
  romanized?: string;
}

/**
 * Optional external artwork for an object. When `src` is omitted the object is
 * painted procedurally by the painter named in `GameObjectDef.art`.
 *
 * - PNG / WebP with transparency are used as-is.
 * - JPG artwork has no alpha channel, so either supply a grayscale `mask`
 *   (white = visible) or let the loader key out the paper background
 *   (`keyColor`, defaulting to the average corner color).
 */
export interface ObjectAsset {
  src: string;
  mask?: string;
  /** Optional transparent overlay drawn on top (e.g. glints, outlines). */
  overlay?: string;
  keyColor?: string;
  /** 0..1 — how far from `keyColor` a pixel can be and still be keyed out. */
  keyTolerance?: number;
  /** Apply the storybook grain pass to the loaded artwork (default true). */
  grain?: boolean;
}

export interface GameObjectDef {
  /** Globally unique id; also the audio file name. */
  id: string;
  emoji: string;
  /** English name. */
  name: string;
  translations: Partial<Record<ForeignLang, Translation>>;
  /** Position on the map, -0.5..0.5 on both axes (x: left→right, z: back→front). */
  position: [x: number, z: number];
  /** Height of the standing illustration in world units. */
  size: number;
  /** Height above the ground (birds, jumping fish…). */
  lift?: number;
  /** Yaw in radians — used by furniture in the apartment. */
  rotation?: number;
  /** Procedural painter key (see src/art/objects). */
  art: string;
  flip?: boolean;
  asset?: ObjectAsset;
  /** Per-language audio overrides; default is /audio/{lang}/{id}.mp3. */
  audio?: Partial<Record<LangCode, string>>;
}

export interface DecorDef {
  art: string;
  position: [x: number, z: number];
  size: number;
  lift?: number;
  flip?: boolean;
  asset?: ObjectAsset;
}

export type LevelId = 'nyc' | 'market' | 'seaside' | 'paddy' | 'alpine' | 'garden' | 'apartment';

export type FurnitureKind = 'floor' | 'wall' | 'ceiling';

export interface FurnitureDef {
  id: string;
  emoji: string;
  name: string;
  /** Story page that awards this piece. */
  source: Exclude<LevelId, 'apartment'>;
  art: string;
  size: number;
  kind: FurnitureKind;
  lift?: number;
  /** Ceiling lamps that cast a warm glow in the room. */
  glow?: boolean;
}

export interface PlacedFurniture {
  id: string;
  position: [x: number, z: number];
  /** Yaw in radians. */
  rotation: number;
}

export interface LevelDef {
  id: LevelId;
  number: number;
  title: string;
  subtitle: string;
  /** Procedural map painter key (see src/art/maps). */
  map: string;
  /** Optional illustrated map image that replaces the procedural map. */
  mapAsset?: string;
  /** Page background behind the floating map. */
  backdrop: string;
  decor: DecorDef[];
  objects: GameObjectDef[];
}

export interface NarrationLine {
  id: string;
  text: string;
}
