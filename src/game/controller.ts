import { loadLevelArt } from '../art/assets';
import { audio } from '../audio/AudioEngine';
import { sfx } from '../audio/sfx';
import { prefetchObjects, primeSpeech, sayNarration, sayObject, stopSpeech } from '../audio/speech';
import { config } from '../config/env';
import { LEVELS, NARRATION } from '../data/levels';
import type { LangCode } from '../data/types';
import { Engine } from '../engine/Engine';
import { currentLevel, foundOn, isPageComplete, useGame } from './store';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const narration = (id: string) => NARRATION.find((n) => n.id === id)!;

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
      engine.on('pokeCloud', () => sfx.boing()),
      engine.on('pokeDecor', () => sfx.tick()),
    ];
    void this.openLevel(useGame.getState().levelIndex);
    return () => {
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

  /** "Open the book" — the first user gesture, which also unlocks audio. */
  start() {
    audio.unlock();
    audio.setMuted(useGame.getState().muted);
    primeSpeech();
    useGame.getState().set({ screen: 'playing' });
    sfx.pageTurn();
    void prefetchObjects(currentLevel().objects, useGame.getState().language);
    const intro = narration('intro');
    setTimeout(() => void sayNarration(intro.id, intro.text), 700);
  }

  private async openLevel(index: number) {
    const engine = this.engine;
    if (!engine) return;
    const mine = ++this.loadSeq;
    const level = LEVELS[index];
    const store = useGame.getState();
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
    if (!engine || store.screen !== 'playing' || store.pageComplete) return;
    const level = currentLevel();
    const obj = level.objects.find((o) => o.id === id);
    if (!obj) return;

    const mine = ++this.seq;
    stopSpeech();
    store.set({ phase: 'transforming', cardId: null });
    sfx.pop();
    sfx.whoosh();

    const art = (await loadLevelArt(level)).objects.get(id)!;
    await engine.transformInto(id, art);
    if (mine !== this.seq) return;

    const isNew = useGame.getState().discover(level.id, id);
    engine.setDiscovered(foundOn(level.id));
    if (isNew) sfx.chime();
    useGame.getState().set({ phase: 'speaking', cardId: id });

    await sayObject(obj, useGame.getState().language);
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
    await wait(700);
    if (mine !== this.seq) return;
    const last = useGame.getState().levelIndex === LEVELS.length - 1;
    useGame.getState().set({ phase: 'celebrating' });
    sfx.fanfare();
    const line = narration(last ? 'book-complete' : 'page-complete');
    void sayNarration(line.id, line.text);
    await engine.celebrate();
    if (mine !== this.seq) return;
    useGame.getState().set({ pageComplete: true });
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
    const { levelIndex } = useGame.getState();
    if (index < 0 || index >= LEVELS.length) return;
    this.seq++;
    stopSpeech();
    this.engine?.restoreCloud();
    useGame.getState().set({ pageComplete: false, phase: 'idle', cardId: null });
    if (index === levelIndex && this.engine) return;
    sfx.pageTurn();
    useGame.getState().set({ levelIndex: index });
    await this.openLevel(index);
  }

  /** "Read again" at the end of the book. */
  async restartBook() {
    const wasOn = useGame.getState().levelIndex;
    this.seq++;
    stopSpeech();
    this.engine?.restoreCloud();
    useGame.getState().resetProgress();
    useGame.getState().set({ phase: 'idle', cardId: null });
    this.engine?.setDiscovered([]);
    if (wasOn !== 0) {
      sfx.pageTurn();
      await this.openLevel(0);
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
}

export const game = new GameController();
