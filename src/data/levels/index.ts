import { asForeign, isEnglish } from '../languages.ts';
import { LEXICON } from '../lexicon.ts';
import type { GameObjectDef, LangCode, LevelDef, NarrationLine, Translation } from '../types.ts';
import { nycLevel } from './nyc.ts';
import { marketLevel } from './market.ts';
import { seasideLevel } from './seaside.ts';
import { paddyLevel } from './paddy.ts';
import { alpineLevel } from './alpine.ts';
import { gardenLevel } from './garden.ts';

export const LEVELS: LevelDef[] = [nycLevel, marketLevel, seasideLevel, paddyLevel, alpineLevel, gardenLevel];

export const NARRATION: NarrationLine[] = [
  { id: 'intro', text: "Hi! I'm Little Cloud. Tap anything you see, and I'll turn into it!" },
  { id: 'page-complete', text: 'Hooray! You found everything on this page!' },
  { id: 'book-complete', text: 'The end! You found every word in the whole book!' },
  { id: 'apartment', text: "This is Little Cloud's home! Pick a treasure, drag it where you like, then tap Place." },
];

export function findObject(id: string): { level: LevelDef; object: GameObjectDef } | undefined {
  for (const level of LEVELS) {
    const object = level.objects.find((o) => o.id === id);
    if (object) return { level, object };
  }
  return undefined;
}

/** The translated word card for an object, or null when learning English. */
export function translationFor(object: GameObjectDef, lang: LangCode): Translation | null {
  const foreign = asForeign(lang);
  if (!foreign) return null;
  return object.translations[foreign] ?? LEXICON[object.id]?.[foreign] ?? { text: object.name };
}

/** The word a child should hear/see for an object in a given language. */
export function wordFor(object: GameObjectDef, lang: LangCode): string {
  if (isEnglish(lang)) return object.name;
  return translationFor(object, lang)!.text;
}
