import { loadApartmentArt, loadLevelArt, type LevelArt } from '../art/assets';
import { furnitureThumbDataUrl } from '../art/furnitureThumbs';
import { audio } from '../audio/AudioEngine';
import { sfx } from '../audio/sfx';
import { prefetchObjects, primeSpeech, say, sayNarration, sayObject, stopSpeech } from '../audio/speech';
import { config } from '../config/env';
import {
  apartmentScene,
  furnitureById,
  furnitureFor,
  furnitureLift,
  ROOM_ORBIT_STEP,
  ROTATE_STEP,
  snapFurnitureFor,
  wrapRotation,
  type FurniturePose,
} from '../data/furniture';
import { apartmentLineFor, greetingFor } from '../data/languages';
import { LEVELS, NARRATION } from '../data/levels';
import type { LangCode } from '../data/types';
import { Engine, type ApartmentHit } from '../engine/Engine';
import { preloadFurnitureModels } from '../engine/FurniturePiece';
import { currentLevel, foundOn, isPageComplete, useGame } from './store';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const narration = (id: string) => NARRATION.find((n) => n.id === id)!;
const TOUR_FIRST_MS = 5200;
const TOUR_DWELL_MS = 7800;

/**
 * Game flow: tap → cloud flies over and becomes the object → the word card
 * appears and the name is spoken → the cloud puffs back into a cloud.
 * Every async step checks a sequence number so a new tap cleanly interrupts.
 */
class GameController {
  private engine: Engine | null = null;
  private seq = 0;
  private loadSeq = 0;
  private unsubs: (() => void)[] = [];
  private insets: [number, number, number?, number?] = [84, 150];
  private showing: 'book' | 'apartment' = 'book';
  private ghostPose: FurniturePose = { position: [0, 0.08], rotation: 0, lift: 0 };
  private menuTour = false;
  private tourIndex = 0;
  private tourTimer: ReturnType<typeof setTimeout> | null = null;

  async mount(container: HTMLElement): Promise<() => void> {
    let engine: Engine;
    try {
      engine = await Engine.create({ container, forceWebGL: config.forceWebGL });
    } catch (err) {
      console.error(err);
      useGame.getState().set({ engineError: 'This browser could not start the 3D storybook. Please try a recent Chrome, Edge, Safari or Firefox.' });
      return () => {};
    }
    this.engine = engine;
    engine.setInsets(...this.insets);
    if (import.meta.env.DEV) Object.assign(window, { __littleCloud: { game: this, engine, store: useGame } });
    useGame.getState().set({ backend: engine.backend, engineError: null });
    this.unsubs = [
      engine.on('select', (id) => void this.select(id)),
      engine.on('pokeCloud', () => void this.onPokeCloud()),
      engine.on('pokeDecor', () => sfx.tick()),
      engine.on('place', (hit) => this.apartmentPlace(hit)),
      engine.on('drag', (id, hit) => this.apartmentDrag(id, hit)),
      engine.on('dragEnd', (id, hit) => this.apartmentDrag(id, hit, true)),
    ];
    engine.setMenuMode(useGame.getState().screen === 'title');
    void this.openLevel(useGame.getState().levelIndex).then(() => this.maybeStartMenuTour());
    return () => {
      this.stopMenuTour();
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      engine.dispose();
      if (this.engine === engine) this.engine = null;
    };
  }

  setInsets(top: number, bottom: number, left?: number, right?: number) {
    this.insets = [top, bottom, left, right];
    this.engine?.setInsets(top, bottom, left, right);
  }

  /** "Go Explore" — the first user gesture, which also unlocks audio. */
  start() {
    this.cancelMenuTour();
    audio.unlock();
    audio.setMuted(useGame.getState().muted);
    primeSpeech();
    this.engine?.setMenuMode(false);
    this.engine?.setApartmentMode(false);
    const saved = useGame.getState().levelIndex;
    const lang = useGame.getState().language;
    useGame.getState().set({ screen: 'playing', holdingId: null });
    sfx.pageTurn();
    // Speak in the language the child picked on the title screen.
    void say(greetingFor(lang), lang, 'greeting');
    void this.openLevel(saved).then(() => {
      if (useGame.getState().screen !== 'playing') return;
      void prefetchObjects(currentLevel().objects, useGame.getState().language);
    });
  }

  /** Close the book and float back to the title page. */
  goHome() {
    this.cancelMenuTour();
    this.seq++;
    stopSpeech();
    this.engine?.restoreCloud();
    this.engine?.setMenuMode(true);
    this.engine?.setApartmentMode(false);
    useGame.getState().set({ screen: 'title', pageComplete: false, phase: 'idle', cardId: null, holdingId: null, selectedId: null });
    sfx.pageTurn();
    if (this.showing === 'apartment') {
      void this.openLevel(useGame.getState().levelIndex).then(() => this.maybeStartMenuTour());
      return;
    }
    this.startMenuTour();
  }

  private onPokeCloud() {
    sfx.boing();
    const screen = useGame.getState().screen;
    if (screen !== 'title' && screen !== 'apartment') return;
    audio.unlock();
    audio.setMuted(useGame.getState().muted);
    primeSpeech();
    const lang = useGame.getState().language;
    if (screen === 'apartment') {
      void say(apartmentLineFor(lang), lang, 'apartment');
      return;
    }
    void say(greetingFor(lang), lang, 'greeting');
  }

  private async openLevel(index: number) {
    const engine = this.engine;
    if (!engine) return;
    const mine = ++this.loadSeq;
    const level = LEVELS[index];
    const store = useGame.getState();
    this.showing = 'book';
    this.tourIndex = index;
    engine.setApartmentMode(false);
    store.set({ loading: { active: true, progress: 0 } });
    const art = await loadLevelArt(level, (progress) => {
      if (mine === this.loadSeq) useGame.getState().set({ loading: { active: true, progress } });
    });
    if (mine !== this.loadSeq || engine !== this.engine) return;
    useGame.getState().set({ thumbs: { ...useGame.getState().thumbs, ...art.thumbs }, loading: { active: false, progress: 1 } });
    engine.setInputEnabled(false);
    await engine.showLevel(level, art, foundOn(level.id));
    if (mine !== this.loadSeq) return;
    engine.setInputEnabled(true);
    void prefetchObjects(level.objects, useGame.getState().language);

    // Paint the next page while the child plays on this one.
    const next = LEVELS[index + 1];
    if (next) {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
      idle(() => void loadLevelArt(next));
    }
  }

  async select(id: string) {
    const engine = this.engine;
    const store = useGame.getState();
    if (!engine) return;
    if (store.screen === 'apartment') {
      this.apartmentTap(id);
      return;
    }
    if (store.screen !== 'playing' || store.pageComplete) return;
    const level = currentLevel();
    const obj = level.objects.find((o) => o.id === id);
    if (!obj) return;

    const mine = ++this.seq;
    stopSpeech();
    store.set({ phase: 'transforming', cardId: null });
    sfx.pop();
    sfx.whoosh();

    const art = (await loadLevelArt(level)).objects.get(id)!;
    const transforming = engine.transformInto(id, art);
    await wait(400);
    if (mine !== this.seq) return;

    const isNew = useGame.getState().discover(level.id, id);
    engine.setDiscovered(foundOn(level.id));
    if (isNew) sfx.chime();
    const finishedPage = isNew && isPageComplete(useGame.getState().levelIndex);
    // Unlock as soon as the page is cleared — don't wait for speech / celebration.
    if (finishedPage) useGame.getState().unlockFurniture(level.id);
    useGame.getState().set({ phase: 'speaking', cardId: id });

    const spoken = sayObject(obj, useGame.getState().language);
    await transforming;
    if (mine !== this.seq) {
      if (finishedPage) void this.showPageComplete();
      return;
    }
    await spoken;
    if (mine !== this.seq) {
      if (finishedPage) void this.showPageComplete();
      return;
    }
    await wait(1900);
    this.release();
    if (finishedPage) await this.showPageComplete();
  }

  /** The cloud lets go of the shape and the word card slides away. */
  release() {
    this.engine?.restoreCloud();
    useGame.getState().set({ phase: 'idle', cardId: null });
  }

  dismissCard() {
    this.seq++;
    stopSpeech();
    this.release();
  }

  /** Show the treasure + confetti card immediately; thumbs fill in afterward. */
  private async showPageComplete() {
    const engine = this.engine;
    if (!engine) return;
    if (useGame.getState().pageComplete) {
      await engine.celebrate();
      return;
    }
    const last = useGame.getState().levelIndex === LEVELS.length - 1;
    const level = LEVELS[useGame.getState().levelIndex];
    useGame.getState().unlockFurniture(level.id);
    useGame.getState().syncFurnitureUnlocks();
    const showcase = furnitureFor(level.id).map((f) => f.id);
    useGame.getState().set({
      justUnlocked: showcase,
      phase: 'celebrating',
      pageComplete: true,
    });
    sfx.hooray();
    const line = narration(last ? 'book-complete' : 'page-complete');
    // Celebration lines are English-only copy for now.
    void sayNarration(line.id, line.text, 'en');
    // Paint thumbs after the card is on screen so confetti isn't delayed by raster work.
    void this.fillTreasureThumbs(showcase);
    await engine.celebrate();
  }

  private async fillTreasureThumbs(ids: string[]) {
    const thumbs = { ...useGame.getState().thumbs };
    for (const id of ids) {
      if (thumbs[id]) continue;
      try {
        thumbs[id] = furnitureThumbDataUrl(id);
        useGame.getState().set({ thumbs: { ...thumbs } });
      } catch (err) {
        console.warn(`[furniture] thumb failed for ${id}`, err);
      }
      await wait(0);
    }
  }

  rotateRoom(dir: -1 | 1 = 1) {
    this.engine?.nudgeRoomYaw(dir * ROOM_ORBIT_STEP);
    sfx.tick();
  }

  async replay() {
    const { cardId, language } = useGame.getState();
    const obj = currentLevel().objects.find((o) => o.id === cardId);
    if (obj) await sayObject(obj, language);
  }

  /** Tray buttons: replay a found word, or nudge the child towards an unfound one. */
  trayTap(id: string) {
    audio.unlock();
    const level = currentLevel();
    if (foundOn(level.id).includes(id)) void this.select(id);
    else {
      this.engine?.hint(id);
      sfx.tick();
    }
  }

  async goToLevel(index: number) {
    const { levelIndex, screen } = useGame.getState();
    if (index < 0 || index >= LEVELS.length) return;
    this.cancelMenuTour();
    this.seq++;
    stopSpeech();
    this.engine?.restoreCloud();
    this.engine?.setApartmentMode(false);
    useGame.getState().set({ screen: 'playing', pageComplete: false, phase: 'idle', cardId: null, holdingId: null, selectedId: null });
    if (index === levelIndex && screen === 'playing' && this.engine) return;
    sfx.pageTurn();
    useGame.getState().set({ levelIndex: index });
    await this.openLevel(index);
  }

  /** "Read again" at the end of the book, or reset from the title. */
  async restartBook() {
    const onTitle = useGame.getState().screen === 'title';
    this.cancelMenuTour();
    this.seq++;
    stopSpeech();
    this.engine?.restoreCloud();
    useGame.getState().resetProgress();
    useGame.getState().set({ phase: 'idle', cardId: null, pageComplete: false });
    this.engine?.setDiscovered([]);
    this.engine?.setApartmentMode(false);
    sfx.pageTurn();
    await this.openLevel(0);
    if (onTitle) {
      this.engine?.setMenuMode(true);
      this.maybeStartMenuTour();
    }
  }

  async goToApartment() {
    this.cancelMenuTour();
    this.seq++;
    stopSpeech();
    this.engine?.restoreCloud();
    this.engine?.setMenuMode(false);
    audio.unlock();
    primeSpeech();
    useGame.getState().set({ screen: 'apartment', pageComplete: false, phase: 'idle', cardId: null, holdingId: null, selectedId: null });
    sfx.pageTurn();
    await this.openApartment();
  }

  private async openApartment() {
    const engine = this.engine;
    if (!engine) return;
    const mine = ++this.loadSeq;
    this.showing = 'apartment';
    const unlocked = useGame.getState().syncFurnitureUnlocks();
    useGame.getState().set({ loading: { active: true, progress: 0 } });
    const art = await loadApartmentArt(unlocked, (progress) => {
      if (mine === this.loadSeq) useGame.getState().set({ loading: { active: true, progress } });
    });
    if (mine !== this.loadSeq || engine !== this.engine) return;
    useGame.getState().set({ thumbs: { ...useGame.getState().thumbs, ...art.thumbs }, loading: { active: true, progress: 0.92 } });
    await preloadFurnitureModels(unlocked);
    if (mine !== this.loadSeq || engine !== this.engine) return;
    useGame.getState().set({ loading: { active: false, progress: 1 } });
    const placed = useGame.getState().placedFurniture;
    const level = apartmentScene(placed);
    const pageArt: LevelArt = {
      map: art.map,
      decor: [],
      objects: new Map(
        placed.flatMap((p) => {
          const image = art.objects.get(p.id);
          return image ? [[p.id, image] as const] : [];
        }),
      ),
      thumbs: art.thumbs,
      room: art.room,
    };
    engine.setInputEnabled(false);
    engine.setApartmentMode(true);
    await engine.showLevel(level, pageArt, placed.map((p) => p.id));
    if (mine !== this.loadSeq) return;
    engine.setInputEnabled(true);
    const lang = useGame.getState().language;
    void say(apartmentLineFor(lang), lang, 'apartment');
  }

  holdFurniture(id: string) {
    audio.unlock();
    const store = useGame.getState();
    if (!store.unlockedFurniture.includes(id)) return;
    if (store.placedFurniture.some((p) => p.id === id)) {
      this.selectPlaced(id);
      return;
    }
    if (store.holdingId === id) {
      this.putAway();
      return;
    }
    this.beginHold(id, { position: [0, 0.08], rotation: 0, lift: furnitureLift(furnitureById.get(id)!), wall: 'back' });
    sfx.tick();
  }

  rotateHeld() {
    const store = useGame.getState();
    if (store.holdingId) {
      const def = furnitureById.get(store.holdingId);
      if (def?.kind === 'wall') {
        // Wall pieces face the room; cycle which wall instead of free yaw.
        const order = ['back', 'right', 'left'] as const;
        const i = order.indexOf((this.ghostPose.wall ?? 'back') as (typeof order)[number]);
        const wall = order[(i + 1) % order.length];
        this.applyGhostPose(snapFurnitureFor(def, this.ghostPose.position[0], this.ghostPose.position[1], this.ghostPose.lift, wall));
        sfx.tick();
        return;
      }
      const rotation = wrapRotation(store.holdingRotation + ROTATE_STEP);
      store.set({ holdingRotation: rotation });
      this.ghostPose = { ...this.ghostPose, rotation };
      this.engine?.rotateGhost(rotation);
      sfx.tick();
      return;
    }
    if (!store.selectedId) return;
    const row = store.placedFurniture.find((p) => p.id === store.selectedId);
    const def = row ? furnitureById.get(row.id) : undefined;
    if (!row || !def) return;
    if (def.kind === 'wall') {
      const order = ['back', 'right', 'left'] as const;
      const i = order.indexOf((row.wall ?? 'back') as (typeof order)[number]);
      const wall = order[(i + 1) % order.length];
      const pose = snapFurnitureFor(def, row.position[0], row.position[1], row.lift ?? furnitureLift(def), wall);
      this.engine?.moveFurniture(row.id, pose.position, pose.lift);
      this.engine?.setFurnitureRotation(row.id, pose.rotation);
      store.placeFurniture(row.id, pose.position, pose.rotation, pose.lift, pose.wall);
      store.selectFurniture(row.id);
      sfx.tick();
      return;
    }
    const rotation = wrapRotation(row.rotation + ROTATE_STEP);
    store.rotateFurniture(row.id, rotation);
    this.engine?.setFurnitureRotation(row.id, rotation);
    sfx.tick();
  }

  confirmPlace() {
    const store = useGame.getState();
    const id = store.holdingId;
    if (!id || !this.engine) return;
    const def = furnitureById.get(id);
    if (!def) return;
    const pose =
      def.kind === 'wall'
        ? this.ghostPose
        : {
            ...snapFurnitureFor(def, this.ghostPose.position[0], this.ghostPose.position[1], furnitureLift(def)),
            rotation: store.holdingRotation,
            lift: furnitureLift(def),
          };
    this.engine.hideGhost();
    this.engine.addFurniture(def.id, null, pose.position, def.size, pose.lift, pose.rotation);
    this.engine.setFurnitureSelected(def.id);
    store.placeFurniture(def.id, pose.position, pose.rotation, pose.lift, pose.wall);
    sfx.pop();
  }

  putAway() {
    const store = useGame.getState();
    const id = store.holdingId ?? store.selectedId;
    if (!id) return;
    this.engine?.hideGhost();
    this.engine?.removeFurniture(id);
    this.engine?.setFurnitureSelected(null);
    store.set({
      placedFurniture: store.placedFurniture.filter((p) => p.id !== id),
      holdingId: null,
      selectedId: null,
    });
    sfx.tick();
  }

  startMove() {
    const store = useGame.getState();
    const id = store.selectedId;
    const row = store.placedFurniture.find((p) => p.id === id);
    if (!id || !row) return;
    this.engine?.removeFurniture(id);
    store.pickUpFurniture(id);
    this.beginHold(id, {
      position: row.position,
      rotation: row.rotation,
      lift: row.lift ?? furnitureLift(furnitureById.get(id)!),
      wall: row.wall,
    });
    sfx.tick();
  }

  private applyGhostPose(pose: FurniturePose) {
    this.ghostPose = pose;
    useGame.getState().set({ holdingRotation: pose.rotation });
    this.engine?.moveGhost(pose.position, pose.lift);
    this.engine?.rotateGhost(pose.rotation);
  }

  private beginHold(id: string, seed: FurniturePose) {
    const def = furnitureById.get(id);
    if (!def || !this.engine) return;
    const pose = snapFurnitureFor(def, seed.position[0], seed.position[1], seed.lift, seed.wall);
    if (def.kind !== 'wall') pose.rotation = seed.rotation;
    this.ghostPose = pose;
    useGame.getState().set({ holdingId: id, selectedId: null, holdingRotation: pose.rotation });
    this.engine.setFurnitureSelected(null);
    this.engine.showGhost(id, null, pose.position, def.size, pose.lift, pose.rotation);
  }

  private selectPlaced(id: string) {
    const store = useGame.getState();
    if (!store.placedFurniture.some((p) => p.id === id)) return;
    if (store.selectedId === id) {
      store.selectFurniture(null);
      this.engine?.setFurnitureSelected(null);
      sfx.tick();
      return;
    }
    this.engine?.hideGhost();
    store.selectFurniture(id);
    this.engine?.setFurnitureSelected(id);
    this.engine?.hint(id);
    sfx.tick();
  }

  private apartmentTap(id: string) {
    if (useGame.getState().holdingId === id) return;
    this.selectPlaced(id);
  }

  private apartmentPlace(hit: ApartmentHit) {
    const store = useGame.getState();
    if (!store.holdingId) {
      store.selectFurniture(null);
      this.engine?.setFurnitureSelected(null);
      sfx.tick();
      return;
    }
    this.apartmentDrag(null, hit);
  }

  private apartmentDrag(id: string | null, hit: ApartmentHit, ended = false) {
    const store = useGame.getState();
    const moving = id && store.placedFurniture.some((p) => p.id === id) ? id : store.holdingId;
    if (!moving) return;
    const def = furnitureById.get(moving);
    if (!def || !this.engine) return;
    // Wall pieces: finger height on the wall is the visual centre.
    const liftHint =
      def.kind === 'wall' ? (hit.wall ? hit.y - def.size * 0.45 : this.ghostPose.lift) : furnitureLift(def);
    const pose = snapFurnitureFor(def, hit.x, hit.z, liftHint, hit.wall ?? this.ghostPose.wall);
    if (def.kind !== 'wall') {
      pose.rotation =
        store.holdingId === moving
          ? store.holdingRotation
          : (store.placedFurniture.find((p) => p.id === moving)?.rotation ?? 0);
    }
    if (store.holdingId === moving) {
      this.applyGhostPose(pose);
    } else {
      this.engine.moveFurniture(moving, pose.position, pose.lift);
      this.engine.setFurnitureRotation(moving, pose.rotation);
      if (ended) store.moveFurniture(moving, pose.position, pose.lift, pose.wall);
    }
  }

  setLanguage(language: LangCode) {
    useGame.getState().set({ language });
    void prefetchObjects(currentLevel().objects, language);
    if (useGame.getState().cardId) void this.replay();
  }

  setMuted(muted: boolean) {
    audio.unlock();
    audio.setMuted(muted);
    useGame.getState().set({ muted });
  }

  private maybeStartMenuTour() {
    if (useGame.getState().screen === 'title') this.startMenuTour();
  }

  private startMenuTour() {
    this.stopMenuTour();
    this.menuTour = true;
    this.scheduleTour(TOUR_FIRST_MS);
  }

  private cancelMenuTour() {
    this.stopMenuTour();
    this.loadSeq++;
  }

  private stopMenuTour() {
    this.menuTour = false;
    if (this.tourTimer !== null) {
      clearTimeout(this.tourTimer);
      this.tourTimer = null;
    }
  }

  private scheduleTour(delay: number) {
    if (!this.menuTour) return;
    this.tourTimer = setTimeout(() => void this.advanceTour(), delay);
  }

  private async advanceTour() {
    if (!this.menuTour || useGame.getState().screen !== 'title') return;
    const next = (this.tourIndex + 1) % LEVELS.length;
    await this.showTourLevel(next);
    if (!this.menuTour || useGame.getState().screen !== 'title') return;
    this.scheduleTour(TOUR_DWELL_MS);
  }

  private async showTourLevel(index: number) {
    const engine = this.engine;
    if (!engine || !this.menuTour) return;
    const mine = ++this.loadSeq;
    const level = LEVELS[index];
    const art = await loadLevelArt(level);
    if (mine !== this.loadSeq || !this.menuTour || useGame.getState().screen !== 'title') return;
    this.tourIndex = index;
    this.showing = 'book';
    engine.setApartmentMode(false);
    await engine.showLevel(level, art, foundOn(level.id));
  }
}

export const game = new GameController();
