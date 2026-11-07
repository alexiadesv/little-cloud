import * as THREE from 'three';
import { type ArtImage, type LevelArt, celebrationArt, renderPageShadow, renderSoftEllipse } from '../art/assets';
import type { LevelDef } from '../data/types';
import { MapBoard } from './board';
import { CloudCharacter } from './cloud/CloudCharacter';
import { cloudShape, silhouetteShape } from './cloud/shapes';
import { MAP_SIZE, PropCard, TILT } from './props';
import { type Backend, type RendererHandle, createRenderer } from './renderer';

export interface EngineEvents {
  hover: (id: string | null) => void;
  select: (id: string) => void;
  pokeDecor: () => void;
  pokeCloud: () => void;
}

type Listener<K extends keyof EngineEvents> = EngineEvents[K];

export interface EngineOptions {
  container: HTMLElement;
  forceWebGL?: boolean;
  clearColor?: string;
}

const CLOUD_X = 0.4;
const CLOUD_Z = -3.2;
/** Resting height range: the cloud floats just clear of the page's skyline, within these bounds. */
const CLOUD_MIN_Y = 3.4;
const CLOUD_MAX_Y = 4.9;
/** Top of the cloud's puffs above its centre. */
const CLOUD_TOP = 1.15;
const CLOUD_AWAY = new THREE.Vector3(0, 11, -6);
const FOV = 30;
const ELEVATION = THREE.MathUtils.degToRad(48);
const LOOK_AT = new THREE.Vector3(0, 0.9, 0.2);
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Page {
  level: LevelDef;
  board: MapBoard;
  props: PropCard[];
  root: THREE.Group;
}

export class Engine {
  readonly backend: Backend;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 200);
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly parallax = new THREE.Vector2();
  private readonly parallaxGoal = new THREE.Vector2();
  private readonly cloud: CloudCharacter;
  private readonly contactShadow: THREE.Texture;
  private readonly pageShadow: THREE.Texture;
  private readonly listeners: { [K in keyof EngineEvents]: Set<Listener<K>> } = {
    hover: new Set(),
    select: new Set(),
    pokeDecor: new Set(),
    pokeCloud: new Set(),
  };
  private page: Page | null = null;
  private leaving: Page[] = [];
  private hovered: PropCard | null = null;
  private inputEnabled = true;
  private insets = { top: 80, bottom: 140, side: 16 };
  private size = { w: 1, h: 1 };
  private fitDistance = 30;
  private readonly baseCamPos = new THREE.Vector3();
  private readonly cloudHome = new THREE.Vector3(CLOUD_X, CLOUD_MAX_Y, CLOUD_Z);
  /** Page colour behind the map; eases towards each level's backdrop. */
  private readonly backdrop = new THREE.Color();
  private readonly backdropGoal = new THREE.Color();
  private time = 0;
  private last = performance.now();
  private nextInvite = 4;
  private downAt: { x: number; y: number } | null = null;
  private readonly resizeObserver: ResizeObserver;
  private readonly reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  private disposed = false;

  private constructor(
    private readonly container: HTMLElement,
    private readonly renderer: RendererHandle,
  ) {
    this.backend = renderer.backend;
    this.contactShadow = this.texture(renderSoftEllipse(128, '#6a5fa8', 0.42, 0.45));
    this.pageShadow = this.texture(renderPageShadow(512));

    const count = renderer.particleCount;
    const cloudTargets = cloudShape(count);
    const particles = renderer.createParticles(count, cloudTargets);
    this.cloud = new CloudCharacter(particles, cloudTargets, this.texture(renderSoftEllipse(128, '#6a5fa8', 0.5, 0.4)), this.cloudHome);
    this.scene.add(this.cloud.root, this.cloud.shadow);

    const el = renderer.domElement;
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointerleave', this.onPointerLeave);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    renderer.setAnimationLoop(this.frame);
  }

  static async create(opts: EngineOptions): Promise<Engine> {
    const clearColor = opts.clearColor ?? '#f6f3ec';
    const renderer = await createRenderer({ container: opts.container, clearColor, forceWebGL: opts.forceWebGL });
    const engine = new Engine(opts.container, renderer);
    engine.backdrop.set(clearColor);
    engine.backdropGoal.set(clearColor);
    return engine;
  }

  on<K extends keyof EngineEvents>(event: K, listener: EngineEvents[K]): () => void {
    (this.listeners[event] as Set<EngineEvents[K]>).add(listener);
    return () => (this.listeners[event] as Set<EngineEvents[K]>).delete(listener);
  }

  private emit<K extends keyof EngineEvents>(event: K, ...args: Parameters<EngineEvents[K]>) {
    for (const l of this.listeners[event]) (l as (...a: Parameters<EngineEvents[K]>) => void)(...args);
  }

  private texture(canvas: HTMLCanvasElement) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // --- Pages -------------------------------------------------------------

  /** Turns to a new page: the old one folds away, the new one pops up card by card. */
  async showLevel(level: LevelDef, art: LevelArt, discovered: Iterable<string>) {
    const seen = new Set(discovered);
    if (this.page) {
      const old = this.page;
      old.board.fadeOut();
      old.props.forEach((p, i) => p.hide(i * 0.015));
      this.leaving.push(old);
      this.page = null;
      this.cloud.morphToCloud();
      this.cloud.flyTo(CLOUD_AWAY);
      await wait(650);
    }

    const root = new THREE.Group();
    const board = new MapBoard(art.map, this.pageShadow, this.renderer.maxAnisotropy);
    root.add(board.group);
    const props: PropCard[] = [];
    const add = (id: string | null, a: ArtImage, position: [number, number], size: number, lift?: number) => {
      // Back-to-front pop-up order, like unfolding a pop-up book.
      const delay = 0.35 + (position[1] + 0.5) * 0.6 + Math.random() * 0.12;
      const card = new PropCard({ id, art: a, position, size, lift, anisotropy: this.renderer.maxAnisotropy, shadowTexture: this.contactShadow, appearDelay: delay });
      card.discovered = id !== null && seen.has(id);
      props.push(card);
      root.add(card.root);
    };
    level.decor.forEach((d, i) => add(null, art.decor[i], d.position, d.size, d.lift));
    for (const o of level.objects) add(o.id, art.objects.get(o.id)!, o.position, o.size, o.lift);

    this.scene.add(root);
    this.page = { level, board, props, root };
    this.backdropGoal.set(level.backdrop);
    this.cloudHome.setY(this.restingHeight(props));
    this.fitCamera();
    this.cloud.setHome(this.cloudHome);
    this.cloud.flyTo(this.cloudHome);
    await wait(1300);
  }

  /**
   * Height at which the resting cloud clears every card standing behind it on
   * screen, so it never covers something a child might want to tap.
   */
  private restingHeight(props: PropCard[]) {
    const tanE = Math.tan(ELEVATION);
    let skyline = 0;
    for (const p of props) {
      const { x, z } = p.root.position;
      if (Math.abs(x - CLOUD_X) > 2.4) continue;
      // Cards lean back, so their tops sit higher on screen than their height alone suggests.
      const topY = p.lift + p.height * Math.cos(TILT);
      const topZ = z - p.height * Math.sin(TILT);
      skyline = Math.max(skyline, topY + (CLOUD_Z - topZ) * tanE);
    }
    return THREE.MathUtils.clamp(skyline + 0.7, CLOUD_MIN_Y, CLOUD_MAX_Y);
  }

  setDiscovered(ids: Iterable<string>) {
    const seen = new Set(ids);
    for (const p of this.page?.props ?? []) if (p.id) p.discovered = seen.has(p.id);
  }

  hint(id: string) {
    const card = this.card(id);
    if (!card) return;
    card.hint();
    this.cloud.lookAt(card.top());
    setTimeout(() => this.cloud.lookAt(this.hovered?.top() ?? null), 1500);
  }

  private card(id: string) {
    return this.page?.props.find((p) => p.id === id);
  }

  // --- Cloud -------------------------------------------------------------

  /** Where the cloud hovers while showing an object's shape: near it, but always on stage. */
  private stageFor(card: PropCard) {
    const p = card.root.position;
    return new THREE.Vector3(
      THREE.MathUtils.clamp(p.x * 0.6, -2.3, 2.3),
      3.3,
      THREE.MathUtils.clamp(p.z * 0.4 - 0.9, -2.4, 0.4),
    );
  }

  /** Reshapes the cloud into the object's silhouette. Resolves once the shape has settled. */
  async transformInto(id: string, art: ArtImage) {
    const card = this.card(id);
    const at = card ? this.stageFor(card) : this.cloudHome.clone();
    card?.hop();
    this.cloud.lookAt(null);
    this.cloud.morphTo(silhouetteShape(art, this.renderer.particleCount), at);
    await wait(1500);
  }

  async celebrate() {
    this.cloud.morphTo(silhouetteShape(celebrationArt(), this.renderer.particleCount, 2.6, 2.6), this.cloudHome.clone().setY(3.6));
    for (const [i, p] of (this.page?.props ?? []).entries()) setTimeout(() => p.hop(), i * 70);
    await wait(1600);
  }

  restoreCloud() {
    this.cloud.morphToCloud();
  }

  // --- Input -------------------------------------------------------------

  setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;
    if (!enabled) this.setHovered(null);
  }

  setInsets(top: number, bottom: number, side = 16) {
    this.insets = { top, bottom, side };
    this.fitCamera();
  }

  private updatePointer(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  private pick(): { card: PropCard | null; cloud: boolean } {
    if (!this.page) return { card: null, cloud: false };
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.page.props.filter((p) => p.isInteractive).map((p) => p.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);
    let card: PropCard | null = null;
    for (const hit of hits) {
      const c = hit.object.userData.card as PropCard;
      if (c.accepts(hit.uv)) {
        card = c;
        break;
      }
    }
    const cloudHit = this.raycaster.ray.intersectSphere(this.cloud.hitSphere(), new THREE.Vector3());
    const cloud = !!cloudHit && (!card || hits.length === 0 || cloudHit.distanceTo(this.camera.position) < hits[0].distance);
    return { card: cloud ? null : card, cloud };
  }

  private setHovered(card: PropCard | null) {
    if (card === this.hovered) return;
    if (this.hovered) this.hovered.hovered = false;
    this.hovered = card;
    if (card) card.hovered = true;
    this.renderer.domElement.style.cursor = card ? 'pointer' : 'default';
    this.cloud.lookAt(card?.top() ?? null);
    this.emit('hover', card?.id ?? null);
  }

  private onPointerMove = (e: PointerEvent) => {
    this.updatePointer(e);
    if (!this.reducedMotion) this.parallaxGoal.set(this.pointer.x, this.pointer.y);
    if (!this.inputEnabled || e.pointerType === 'touch') return;
    const { card, cloud } = this.pick();
    this.setHovered(card);
    if (cloud) this.renderer.domElement.style.cursor = 'pointer';
  };

  private onPointerDown = (e: PointerEvent) => {
    this.downAt = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent) => {
    const down = this.downAt;
    this.downAt = null;
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12 || !this.inputEnabled) return;
    this.updatePointer(e);
    const { card, cloud } = this.pick();
    if (cloud) {
      this.cloud.poke();
      this.emit('pokeCloud');
    } else if (card?.id) {
      this.emit('select', card.id);
    } else if (card) {
      card.poke();
      this.emit('pokeDecor');
    }
  };

  private onPointerLeave = () => {
    this.parallaxGoal.set(0, 0);
    this.setHovered(null);
  };

  // --- Camera ------------------------------------------------------------

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.size = { w, h };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setSize(w, h, dpr);
    this.camera.aspect = w / h;
    this.cloud.particles.setViewport(h * dpr, FOV);
    this.fitCamera();
  }

  /** Points that must stay visible: the map, the tallest cards and the cloud's stage. */
  private framingPoints() {
    const half = MAP_SIZE / 2;
    let tallBack = 2.5;
    for (const p of this.page?.props ?? []) if (p.root.position.z < -3) tallBack = Math.max(tallBack, p.height + p.lift);
    return [
      new THREE.Vector3(-half, 0, -half),
      new THREE.Vector3(half, 0, -half),
      new THREE.Vector3(-half, 0, half),
      new THREE.Vector3(half, 0, half),
      new THREE.Vector3(-half * 0.8, tallBack, -half),
      new THREE.Vector3(half * 0.8, tallBack, -half),
      this.cloudHome.clone().setY(this.cloudHome.y + CLOUD_TOP),
    ];
  }

  private fitCamera() {
    const { w, h } = this.size;
    const cam = this.camera;
    cam.clearViewOffset();
    const dir = new THREE.Vector3(0, Math.sin(ELEVATION), Math.cos(ELEVATION));
    const pts = this.framingPoints();
    const allowX = 2 - (this.insets.side * 4) / w;
    const allowY = 2 - ((this.insets.top + this.insets.bottom) * 2) / h;

    const measure = (dist: number) => {
      cam.position.copy(LOOK_AT).addScaledVector(dir, dist);
      cam.lookAt(LOOK_AT);
      cam.updateMatrixWorld();
      cam.updateProjectionMatrix();
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of pts) {
        const v = p.clone().project(cam);
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      }
      return { minX, maxX, minY, maxY };
    };

    let lo = 6, hi = 120;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const b = measure(mid);
      if (b.maxX - b.minX <= allowX * 0.96 && b.maxY - b.minY <= allowY * 0.96) hi = mid;
      else lo = mid;
    }
    this.fitDistance = hi;
    const b = measure(hi);
    this.baseCamPos.copy(cam.position);

    // Centre the framed content inside the area not covered by the HUD.
    const targetCY = ((this.insets.bottom - this.insets.top) / h);
    const contentCY = (b.minY + b.maxY) / 2;
    const contentCX = (b.minX + b.maxX) / 2;
    cam.setViewOffset(w, h, (contentCX * w) / 2, ((targetCY - contentCY) * h) / 2, w, h);
  }

  // --- Loop --------------------------------------------------------------

  private frame = () => {
    if (this.disposed) return;
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    this.time += dt;
    const t = this.time;

    // Gentle parallax: the camera drifts a little with the pointer.
    this.parallax.lerp(this.parallaxGoal, 1 - Math.exp(-2.5 * dt));
    const drift = this.fitDistance * 0.012;
    this.camera.position.copy(this.baseCamPos);
    this.camera.position.x += this.parallax.x * drift + Math.sin(t * 0.15) * drift * 0.3;
    this.camera.position.y += this.parallax.y * drift * 0.6;
    this.camera.lookAt(LOOK_AT);

    if (this.page) {
      for (const p of this.page.props) p.update(dt, t, this.camera);
      this.page.board.update(dt);
      this.inviteTick(dt);
    }
    for (const old of this.leaving) {
      for (const p of old.props) p.update(dt, t, this.camera);
      old.board.update(dt);
    }
    this.leaving = this.leaving.filter((old) => {
      if (!old.board.faded) return true;
      this.scene.remove(old.root);
      old.board.dispose();
      old.props.forEach((p) => p.dispose());
      return false;
    });

    this.cloud.update(dt, t, this.camera);
    this.updateBackdrop(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateBackdrop(dt: number) {
    const c = this.backdrop;
    const g = this.backdropGoal;
    if (Math.abs(c.r - g.r) + Math.abs(c.g - g.g) + Math.abs(c.b - g.b) < 1e-4) return;
    c.lerp(g, 1 - Math.exp(-2 * dt));
    this.renderer.setClearColor(c);
  }

  /** Every few seconds an undiscovered card does a tiny hop to invite a tap. */
  private inviteTick(dt: number) {
    this.nextInvite -= dt;
    if (this.nextInvite > 0) return;
    this.nextInvite = 4 + Math.random() * 3;
    const waiting = this.page!.props.filter((p) => p.id && !p.discovered && p.isInteractive);
    if (waiting.length && !this.cloud.isShape) waiting[Math.floor(Math.random() * waiting.length)].hop();
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointerleave', this.onPointerLeave);
    for (const page of [this.page, ...this.leaving]) {
      if (!page) continue;
      page.board.dispose();
      page.props.forEach((p) => p.dispose());
    }
    this.cloud.dispose();
    this.contactShadow.dispose();
    this.pageShadow.dispose();
    this.renderer.dispose();
  }
}
