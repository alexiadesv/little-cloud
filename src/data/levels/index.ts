import type { GameObjectDef, LangCode, LevelDef, NarrationLine } from '../types.ts';
import { nycLevel } from './nyc.ts';
import { marketLevel } from './market.ts';
import { seasideLevel } from './seaside.ts';
import { paddyLevel } from './paddy.ts';
import { alpineLevel } from './alpine.ts';

export const LEVELS: LevelDef[] = [nycLevel, marketLevel, seasideLevel, paddyLevel, alpineLevel];

export const NARRATION: NarrationLine[] = [
  { id: 'intro', text: "Hi! I'm Little Cloud. Tap anything you see, and I'll turn into it!" },
  { id: 'page-complete', text: 'Hooray! You found everything on this page!' },
  { id: 'book-complete', text: 'The end! You found every word in the whole book!' },
];

export function findObject(id: string): { level: LevelDef; object: GameObjectDef } | undefined {
  for (const level of LEVELS) {
    const object = level.objects.find((o) => o.id === id);
    if (object) return { level, object };
  }
  return undefined;
}

/** The word a child should hear/see for an object in a given language. */
export function wordFor(object: GameObjectDef, lang: LangCode): string {
  return lang === 'en' ? object.name : object.translations[lang].text;
}
