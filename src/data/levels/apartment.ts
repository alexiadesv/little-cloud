import type { LevelDef } from '../types.ts';

/** The child's own room — not a numbered story page. */
export const apartmentLevel: LevelDef = {
  id: 'apartment',
  number: 0,
  title: 'My Apartment',
  subtitle: 'Find every word on a page, then bring the treasures home.',
  map: 'apartment',
  backdrop: '#efe6d6',
  decor: [],
  objects: [],
};
