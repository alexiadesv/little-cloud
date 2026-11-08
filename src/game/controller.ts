import { loadApartmentArt, loadLevelArt, makeThumb, renderFurniture, type LevelArt } from '../art/assets';
import { audio } from '../audio/AudioEngine';
import { sfx } from '../audio/sfx';
import { prefetchObjects, primeSpeech, say, sayNarration, sayObject, stopSpeech } from '../audio/speech';
import { config } from '../config/env';
import { apartmentScene, furnitureById, furnitureLift, ROTATE_STEP, snapFurniture, wrapRotation } from '../data/furniture';
import { greetingFor } from '../data/languages';
import { LEVELS, NARRATION } from '../data/levels';
import type { LangCode } from '../data/types';
import { Engine } from '../engine/Engine';
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
  private insets: [number, number] = [84, 150];
  private showing: 'book' | 'apartment' = 'book';
  private apartmentArt: LevelArt | null = null;
  private ghostPos: [number, number] = [0, 0.08];
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
      engine.on('place', (x, z) => this.apartmentPlace(x, z)),
      engine.on('drag', (id, x, z) => this.apartmentDrag(id, x, z)),
      engine.on('dragEnd', (id, x, z) => this.apartmentDrag(id, x, z, true)),
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

  setInsets(top: number, bottom: number) {
    this.insets = [top, bottom];
    this.engine?.setInsets(top, bottom);
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
    useGame.getState().set({ screen: 'playing', holdingId: null });
    sfx.pageTurn();
    void this.openLevel(saved).then(() => {
      if (useGame.getState().screen !== 'playing') return;
      void prefetchObjects(currentLevel().objects, useGame.getState().language);
      const intro = narration('intro');
      setTimeout(() => void sayNarration(intro.id, intro.text), 700);
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
    if (screen === 'apartment') {
      audio.unlock();
      primeSpeech();
      const line = narration('apartment');
      void sayNarration(line.id, line.text);
      return;
    }
    if (screen !== 'title') return;
    audio.unlock();
    audio.setMuted(useGame.getState().muted);
    primeSpeech();
    const lang = useGame.getState().language;
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
    useGame.getState().set({ phase: 'speaking', cardId: id });

    const spoken = sayObject(obj, useGame.getState().language);
    await transforming;
    if (mine !== this.seq) return;
    await spoken;
    if (mine !== this.seq) return;
    await wait(1900);
    if (mine !== this.seq) return;
    this.release();

    if (isNew && isPageComplete(useGame.getState().levelIndex)) await this.completePage(mine);
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

  private async completePage(mine: number) {
    const engine = this.engine;
    if (!engine) return;
    await wait(400);
    if (mine !== this.seq) return;
    const last = useGame.getState().levelIndex === LEVELS.length - 1;
    const level = LEVELS[useGame.getState().levelIndex];
    const awarded = useGame.getState().unlockFurniture(level.id);
    if (awarded.length) {
      const thumbs = { ...useGame.getState().thumbs };
      for (const id of awarded) thumbs[id] = makeThumb(renderFurniture(id));
      useGame.getState().set({ thumbs });
    }
    sfx.hooray();
    useGame.getState().set({ phase: 'celebrating', pageComplete: true });
    const line = narration(last ? 'book-complete' : 'page-complete');
    void sayNarration(line.id, line.text);
    await engine.celebrate();
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
    useGame.getState().set({ screen: 'apartment', pageComplete: false, phase: 'idle', cardId: null, holdingId: null, selectedId: null });
    sfx.pageTurn();
    await this.openApartment();
  }

  private async openApartment() {
    const engine = this.engine;
    if (!engine) return;
    const mine = ++this.loadSeq;
    this.showing = 'apartment';
    const store = useGame.getState();
    store.set({ loading: { active: true, progress: 0 } });
    const art = await loadApartmentArt(store.unlockedFurniture, (progress) => {
      if (mine === this.loadSeq) useGame.getState().set({ loading: { active: true, progress } });
    });
    if (mine !== this.loadSeq || engine !== this.engine) return;
    this.apartmentArt = art;
    useGame.getState().set({ thumbs: { ...useGame.getState().thumbs, ...art.thumbs }, loading: { active: false, progress: 1 } });
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
  }

  /** Put the currently held treasure down at map coordinates. */
  placeHeld(x: number, z: number) {
    this.apartmentPlace(x, z);
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
    this.beginHold(id, [0, 0.08], 0);
    sfx.tick();
  }

  rotateHeld() {
    const store = useGame.getState();
    if (store.holdingId) {
      const rotation = wrapRotation(store.holdingRotation + ROTATE_STEP);
      store.set({ holdingRotation: rotation });
      this.engine?.rotateGhost(rotation);
      sfx.tick();
      return;
    }
    if (!store.selectedId) return;
    const row = store.placedFurniture.find((p) => p.id === store.selectedId);
    if (!row) return;
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
    const art = this.apartmentArt?.objects.get(id);
    if (!def || !art) return;
    const position = snapFurniture(def.kind, this.ghostPos[0], this.ghostPos[1]);
    this.engine.hideGhost();
    this.engine.addFurniture(def.id, art, position, def.size, furnitureLift(def), store.holdingRotation);
    this.engine.setFurnitureSelected(def.id);
    store.placeFurniture(def.id, position, store.holdingRotation);
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
    this.beginHold(id, row.position, row.rotation);
    sfx.tick();
  }

  private beginHold(id: string, position: [number, number], rotation: number) {
    const def = furnitureById.get(id);
    const art = this.apartmentArt?.objects.get(id);
    if (!def || !art || !this.engine) return;
    const snapped = snapFurniture(def.kind, position[0], position[1]);
    this.ghostPos = snapped;
    useGame.getState().set({ holdingId: id, selectedId: null, holdingRotation: rotation });
    this.engine.setFurnitureSelected(null);
    this.engine.showGhost(id, art, snapped, def.size, furnitureLift(def), rotation);
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

  private apartmentPlace(x: number, z: number) {
    const store = useGame.getState();
    if (!store.holdingId) {
      store.selectFurniture(null);
      this.engine?.setFurnitureSelected(null);
      sfx.tick();
      return;
    }
    this.apartmentDrag(null, x, z);
  }

  private apartmentDrag(id: string | null, x: number, z: number, ended = false) {
    const store = useGame.getState();
    const moving = id && store.placedFurniture.some((p) => p.id === id) ? id : store.holdingId;
    if (!moving) return;
    const def = furnitureById.get(moving);
    if (!def || !this.engine) return;
    const position = snapFurniture(def.kind, x, z);
    if (store.holdingId === moving) {
      this.ghostPos = position;
      this.engine.moveGhost(position);
    } else {
      this.engine.moveFurniture(moving, position);
      if (ended) store.moveFurniture(moving, position);
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
