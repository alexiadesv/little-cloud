import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LEVELS } from '../data/levels';
import { isLangCode } from '../data/languages';
import type { LangCode } from '../data/types';
import type { Backend } from '../engine/renderer';

export type Phase = 'idle' | 'transforming' | 'speaking' | 'celebrating';

interface GameState {
  screen: 'title' | 'playing';
  levelIndex: number;
  language: LangCode;
  muted: boolean;
  /** levelId -> discovered object ids, in discovery order. */
  discovered: Record<string, string[]>;

  backend: Backend | null;
  engineError: string | null;
  loading: { active: boolean; progress: number };
  thumbs: Record<string, string>;
  phase: Phase;
  /** Object whose word card is showing. */
  cardId: string | null;
  pageComplete: boolean;

  set: (patch: Partial<GameState>) => void;
  /** Returns true the first time an object is found. */
  discover: (levelId: string, id: string) => boolean;
  resetProgress: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      levelIndex: 0,
      language: 'es',
      muted: false,
      discovered: {},

      backend: null,
      engineError: null,
      loading: { active: true, progress: 0 },
      thumbs: {},
      phase: 'idle',
      cardId: null,
      pageComplete: false,

      set: (patch) => set(patch),
      discover: (levelId, id) => {
        const list = get().discovered[levelId] ?? [];
        if (list.includes(id)) return false;
        set({ discovered: { ...get().discovered, [levelId]: [...list, id] } });
        return true;
      },
      resetProgress: () => set({ discovered: {}, levelIndex: 0, pageComplete: false }),
    }),
    {
      name: 'little-cloud-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ levelIndex: s.levelIndex, language: s.language, muted: s.muted, discovered: s.discovered }),
      merge: (persisted, current) => {
        const { unlocked: _legacy, ...p } = (persisted ?? {}) as Partial<GameState> & { unlocked?: number };
        return {
          ...current,
          ...p,
          language: isLangCode(p.language) ? p.language : current.language,
          levelIndex: Math.min(Math.max(0, p.levelIndex ?? 0), LEVELS.length - 1),
        };
      },
    },
  ),
);

export const currentLevel = () => LEVELS[useGame.getState().levelIndex];

export function foundOn(levelId: string) {
  return useGame.getState().discovered[levelId] ?? [];
}

export function isPageComplete(levelIndex: number) {
  const level = LEVELS[levelIndex];
  return level.objects.every((o) => foundOn(level.id).includes(o.id));
}
