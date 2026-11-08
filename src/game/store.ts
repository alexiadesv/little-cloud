import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { furnitureFor, isFurnitureId, sanitizePlaced } from '../data/furniture';
import { LEVELS } from '../data/levels';
import { isLangCode } from '../data/languages';
import { isRoomTime, type RoomTime } from '../data/roomTime';
import type { LangCode, LevelId, PlacedFurniture } from '../data/types';
import type { Backend } from '../engine/renderer';

export type Phase = 'idle' | 'transforming' | 'speaking' | 'celebrating';
export type Screen = 'title' | 'playing' | 'apartment';

interface GameState {
  screen: Screen;
  levelIndex: number;
  language: LangCode;
  muted: boolean;
  /** Living-room lighting: morning, day, or night. */
  roomTime: RoomTime;
  /** levelId -> discovered object ids, in discovery order. */
  discovered: Record<string, string[]>;
  unlockedFurniture: string[];
  placedFurniture: PlacedFurniture[];
  /** Furniture piece the child is about to put down. */
  holdingId: string | null;
  /** Placed piece whose options menu is open. */
  selectedId: string | null;
  holdingRotation: number;
  /** Pieces just awarded on the current page-complete card. */
  justUnlocked: string[];

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
  /** Awards a region's five pieces the first time that page is finished. */
  unlockFurniture: (levelId: LevelId) => string[];
  holdFurniture: (id: string | null) => void;
  placeFurniture: (
    id: string,
    position: [number, number],
    rotation?: number,
    lift?: number,
    wall?: PlacedFurniture['wall'],
  ) => void;
  moveFurniture: (id: string, position: [number, number], lift?: number, wall?: PlacedFurniture['wall']) => void;
  rotateFurniture: (id: string, rotation: number) => void;
  pickUpFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  /** Reconcile unlocked furniture with completed pages (discovered words). */
  syncFurnitureUnlocks: () => string[];
  resetProgress: () => void;
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(isFurnitureId))];
}

function unlocksFromProgress(discovered: Record<string, string[]>) {
  const ids: string[] = [];
  for (const level of LEVELS) {
    if (level.objects.every((o) => (discovered[level.id] ?? []).includes(o.id))) {
      ids.push(...furnitureFor(level.id).map((f) => f.id));
    }
  }
  return uniqueIds(ids);
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      levelIndex: 0,
      language: 'es',
      muted: false,
      roomTime: 'day',
      discovered: {},
      unlockedFurniture: [],
      placedFurniture: [],
      holdingId: null,
      selectedId: null,
      holdingRotation: 0,
      justUnlocked: [],

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
      unlockFurniture: (levelId) => {
        if (levelId === 'apartment') return [];
        const have = new Set(get().unlockedFurniture);
        const pieces = furnitureFor(levelId).map((f) => f.id);
        const added = pieces.filter((id) => !have.has(id));
        if (added.length) {
          set({ unlockedFurniture: [...get().unlockedFurniture, ...added], justUnlocked: added });
          return added;
        }
        // Re-completing still highlights the region's treasures on the celebration card.
        set({ justUnlocked: pieces });
        return [];
      },
      syncFurnitureUnlocks: () => {
        const unlockedFurniture = uniqueIds([...get().unlockedFurniture, ...unlocksFromProgress(get().discovered)]);
        const prev = get().unlockedFurniture;
        if (unlockedFurniture.length !== prev.length || unlockedFurniture.some((id, i) => id !== prev[i])) {
          set({ unlockedFurniture });
        }
        return unlockedFurniture;
      },
      holdFurniture: (id) => set({ holdingId: id, selectedId: null, holdingRotation: id ? get().holdingRotation : 0 }),
      placeFurniture: (id, position, rotation = get().holdingRotation, lift, wall) => {
        if (!get().unlockedFurniture.includes(id)) return;
        set({
          placedFurniture: [
            ...get().placedFurniture.filter((p) => p.id !== id),
            { id, position, rotation, lift, wall },
          ],
          holdingId: null,
          selectedId: id,
        });
      },
      moveFurniture: (id, position, lift, wall) => {
        set({
          placedFurniture: get().placedFurniture.map((p) =>
            p.id === id ? { ...p, position, lift: lift ?? p.lift, wall: wall ?? p.wall } : p,
          ),
        });
      },
      rotateFurniture: (id, rotation) => {
        set({
          placedFurniture: get().placedFurniture.map((p) => (p.id === id ? { ...p, rotation } : p)),
        });
      },
      pickUpFurniture: (id) => {
        const row = get().placedFurniture.find((p) => p.id === id);
        set({
          placedFurniture: get().placedFurniture.filter((p) => p.id !== id),
          holdingId: id,
          selectedId: null,
          holdingRotation: row?.rotation ?? 0,
        });
      },
      selectFurniture: (id) => set({ selectedId: id, holdingId: id ? null : get().holdingId }),
      resetProgress: () =>
        set({
          discovered: {},
          levelIndex: 0,
          pageComplete: false,
          unlockedFurniture: [],
          placedFurniture: [],
          holdingId: null,
          selectedId: null,
          holdingRotation: 0,
          justUnlocked: [],
        }),
    }),
    {
      name: 'little-cloud-progress',
      version: 6,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        levelIndex: s.levelIndex,
        language: s.language,
        muted: s.muted,
        roomTime: s.roomTime,
        discovered: s.discovered,
        unlockedFurniture: s.unlockedFurniture,
        placedFurniture: s.placedFurniture,
      }),
      merge: (persisted, current) => {
        const { unlocked: _legacy, ...p } = (persisted ?? {}) as Partial<GameState> & { unlocked?: number };
        const discovered = p.discovered ?? current.discovered;
        const unlockedFurniture = uniqueIds([...(p.unlockedFurniture ?? []), ...unlocksFromProgress(discovered)]);
        const placedFurniture = sanitizePlaced(p.placedFurniture).filter((row) => unlockedFurniture.includes(row.id));
        return {
          ...current,
          ...p,
          language: isLangCode(p.language) ? p.language : current.language,
          roomTime: isRoomTime(p.roomTime) ? p.roomTime : current.roomTime,
          levelIndex: Math.min(Math.max(0, p.levelIndex ?? 0), LEVELS.length - 1),
          discovered,
          unlockedFurniture,
          placedFurniture,
          holdingId: null,
          selectedId: null,
          holdingRotation: 0,
          justUnlocked: [],
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

export function hasFurniture(id: string) {
  return useGame.getState().unlockedFurniture.includes(id);
}
