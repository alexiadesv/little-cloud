import * as THREE from 'three';
import { type ArtImage, type LevelArt, celebrationArt, renderPageShadow, renderSoftEllipse } from '../art/assets';
import { furnitureById, furnitureWidth, ROOM_PITCH_MAX, ROOM_PITCH_MIN, ROOM_WALL_H } from '../data/furniture';
import type { LevelDef } from '../data/types';
import { MapBoard } from './board';
import { CloudCharacter } from './cloud/CloudCharacter';
import { cloudShape, silhouetteShape } from './cloud/shapes';
import { FurniturePiece } from './FurniturePiece';
import { MAP_SIZE, PropCard, TILT } from './props';
import { type Backend, type RendererHandle, createRenderer } from './renderer';
import { ROOM_BACKDROP, type RoomTime } from '../data/roomTime';
import { ApartmentRoom, type StageGround } from './room';

export type StageProp = PropCard | FurniturePiece;

export interface ApartmentHit {
  x: number;
  z: number;
  /** World height along a wall, useful for hanging pieces. */
  y: number;
  wall?: 'back' | 'left' | 'right';
}

export interface EngineEvents {
  hover: (id: string | null) => void;
  select: (id: string) => void;
  pokeDecor: () => void;
  pokeCloud: () => void;
  /** Empty-surface tap in the apartment. */
  place: (hit: ApartmentHit) => void;
  /** Drag a placed piece, or the ghost (id is null). */
  drag: (id: string | null, hit: ApartmentHit) => void;
  dragEnd: (id: string | null, hit: ApartmentHit) => void;
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
  board: StageGround;
  props: StageProp[];
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
    place: new Set(),
    drag: new Set(),
    dragEnd: new Set(),
  };
  private page: Page | null = null;
  private leaving: Page[] = [];
  private hovered: StageProp | null = null;
  private inputEnabled = true;
  private insets = { top: 80, bottom: 140, left: 16, right: 16 };
  private apartmentMode = false;
  private roomTime: RoomTime = 'day';
  private roomYaw = 0;
  private roomPitch = 0;
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
  private ghost: StageProp | null = null;
  private dragId: string | null | undefined;
  private dragMoved = false;
  private orbiting = false;
  private lampGlow: THREE.Texture | null = null;
  private readonly resizeObserver: ResizeObserver;
  private readonly reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  private disposed = false;
  private pageGen = 0;

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
    const gen = ++this.pageGen;
    this.hideGhost();
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
      if (gen !== this.pageGen || this.disposed) return;
    }

    const root = new THREE.Group();
    const atHome = level.id === 'apartment';
    if (atHome) {
      root.rotation.order = 'YXZ';
      root.rotation.y = this.roomYaw;
      root.rotation.x = this.roomPitch;
    } else {
      this.roomYaw = 0;
      this.roomPitch = 0;
    }
    const board: StageGround =
      atHome && art.room
        ? new ApartmentRoom(art.room, this.pageShadow, this.renderer.maxAnisotropy, this.roomTime)
        : new MapBoard(art.map, this.pageShadow, this.renderer.maxAnisotropy);
    root.add(board.group);
    const props: StageProp[] = [];
    const addCard = (id: string | null, a: ArtImage, position: [number, number], size: number, lift?: number, rotation = 0) => {
      // Back-to-front pop-up order, like unfolding a pop-up book.
      const delay = 0.35 + (position[1] + 0.5) * 0.6 + Math.random() * 0.12;
      const card = new PropCard({
        id,
        art: a,
        position,
        size,
        lift,
        anisotropy: this.renderer.maxAnisotropy,
        shadowTexture: this.contactShadow,
        appearDelay: delay,
        rotation,
      });
      card.discovered = id !== null && seen.has(id);
      props.push(card);
      root.add(card.root);
    };
    const addFurniture = (id: string, position: [number, number], size: number, lift?: number, rotation = 0) => {
      const def = furnitureById.get(id);
      const piece = new FurniturePiece({
        id,
        position,
        height: size,
        width: furnitureWidth(id),
        lift,
        rotation,
        appearDelay: 0.08,
        shadowTexture: this.contactShadow,
        glow: !!def?.glow,
        glowTexture: this.lampTex(),
      });
      piece.discovered = true;
      props.push(piece);
      root.add(piece.root);
    };
    if (atHome) {
      for (const o of level.objects) addFurniture(o.id, o.position, o.size, o.lift, o.rotation ?? 0);
    } else {
      level.decor.forEach((d, i) => addCard(null, art.decor[i], d.position, d.size, d.lift));
      for (const o of level.objects) addCard(o.id, art.objects.get(o.id)!, o.position, o.size, o.lift, o.rotation ?? 0);
    }

    if (gen !== this.pageGen || this.disposed) {
      board.dispose();
      props.forEach((p) => p.dispose());
      return;
    }

    this.scene.add(root);
    this.page = { level, board, props, root };
    this.backdropGoal.set(atHome ? ROOM_BACKDROP[this.roomTime] : level.backdrop);
    if (atHome) {
      // Park clearly outside the right wall — never inside the dollhouse volume.
      this.cloudHome.set(MAP_SIZE * 0.92, 5.5, MAP_SIZE * 0.2);
      this.cloud.setDrift(0.7);
    } else {
      this.cloudHome.set(CLOUD_X, this.restingHeight(props.filter((p): p is PropCard => p instanceof PropCard)), CLOUD_Z);
      this.cloud.setDrift(1);
    }
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
  private stageFor(card: StageProp) {
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
    await wait(900);
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

  setInsets(top: number, bottom: number, left = 16, right = left) {
    this.insets = { top, bottom, left, right };
    this.fitCamera();
  }

  /** Drift farther across the sky while the title page is open. */
  setMenuMode(on: boolean) {
    this.cloud.setDrift(on ? 2.6 : 1);
  }

  setApartmentMode(on: boolean) {
    this.apartmentMode = on;
    if (!on) {
      this.hideGhost();
      this.setFurnitureSelected(null);
      this.roomYaw = 0;
      this.roomPitch = 0;
      this.cloud.setDrift(1);
    }
  }

  setRoomTime(mode: RoomTime) {
    this.roomTime = mode;
    this.page?.board.setTimeOfDay?.(mode);
    if (this.apartmentMode) this.backdropGoal.set(ROOM_BACKDROP[mode]);
  }

  private applyRoomOrbit() {
    if (!this.page || !this.apartmentMode) return;
    this.page.root.rotation.order = 'YXZ';
    this.page.root.rotation.y = this.roomYaw;
    this.page.root.rotation.x = this.roomPitch;
  }

  /** Orbit the dollhouse around its centre (radians). */
  setRoomYaw(yaw: number) {
    this.roomYaw = yaw;
    this.applyRoomOrbit();
  }

  nudgeRoomYaw(delta: number) {
    this.setRoomYaw(this.roomYaw + delta);
  }

  getRoomYaw() {
    return this.roomYaw;
  }

  /** Tilt the dollhouse up/down (radians, clamped). */
  setRoomPitch(pitch: number) {
    this.roomPitch = Math.max(ROOM_PITCH_MIN, Math.min(ROOM_PITCH_MAX, pitch));
    this.applyRoomOrbit();
  }

  nudgeRoomPitch(delta: number) {
    this.setRoomPitch(this.roomPitch + delta);
  }

  getRoomPitch() {
    return this.roomPitch;
  }

  /** Snap the dollhouse to a named view-cube face (Revit-style). */
  setRoomView(face: 'front' | 'back' | 'left' | 'right' | 'top' | 'home') {
    const views = {
      home: { yaw: 0, pitch: 0 },
      front: { yaw: 0, pitch: 0 },
      back: { yaw: Math.PI, pitch: 0 },
      left: { yaw: Math.PI / 2, pitch: 0 },
      right: { yaw: -Math.PI / 2, pitch: 0 },
      top: { yaw: this.roomYaw, pitch: ROOM_PITCH_MAX },
    } as const;
    const next = views[face];
    this.roomYaw = next.yaw;
    this.roomPitch = next.pitch;
    this.applyRoomOrbit();
  }

  addFurniture(id: string, _art: ArtImage | null, position: [number, number], size: number, lift?: number, rotation = 0) {
    if (!this.page) return;
    this.removeFurniture(id);
    const def = furnitureById.get(id);
    const piece = new FurniturePiece({
      id,
      position,
      height: size,
      width: furnitureWidth(id),
      lift,
      rotation,
      appearDelay: 0.02,
      shadowTexture: this.contactShadow,
      glow: !!def?.glow,
      glowTexture: this.lampTex(),
    });
    piece.discovered = true;
    this.page.props.push(piece);
    this.page.root.add(piece.root);
  }

  moveFurniture(id: string, position: [number, number], lift?: number) {
    const card = this.card(id);
    card?.moveTo(position);
    if (lift !== undefined && card && 'setLift' in card) card.setLift(lift);
  }

  setFurnitureRotation(id: string, rotation: number) {
    this.card(id)?.setRotation(rotation);
  }

  setFurnitureLift(id: string, lift: number) {
    const card = this.card(id);
    if (card && 'setLift' in card) card.setLift(lift);
  }

  setFurnitureSelected(id: string | null) {
    for (const p of this.page?.props ?? []) p.setSelected(p.id === id);
  }

  showGhost(id: string, _art: ArtImage | null, position: [number, number], size: number, lift: number, rotation: number) {
    this.hideGhost();
    if (!this.page) return;
    const def = furnitureById.get(id);
    const piece = new FurniturePiece({
      id,
      position,
      height: size,
      width: furnitureWidth(id),
      lift,
      rotation,
      appearDelay: 0,
      preview: true,
      shadowTexture: this.contactShadow,
      glow: !!def?.glow,
      glowTexture: this.lampTex(),
    });
    piece.discovered = true;
    piece.appearNow();
    this.ghost = piece;
    this.page.root.add(piece.root);
  }

  moveGhost(position: [number, number], lift?: number) {
    this.ghost?.moveTo(position);
    if (lift !== undefined && this.ghost && 'setLift' in this.ghost) this.ghost.setLift(lift);
  }

  rotateGhost(rotation: number) {
    this.ghost?.setRotation(rotation);
  }

  hideGhost() {
    if (!this.ghost) return;
    this.page?.root.remove(this.ghost.root);
    this.ghost.dispose();
    this.ghost = null;
  }

  private lampTex() {
    this.lampGlow ??= this.texture(renderSoftEllipse(128, '#ffb060', 0.7, 0.42));
    return this.lampGlow;
  }

  removeFurniture(id: string) {
    if (!this.page) return;
    const i = this.page.props.findIndex((p) => p.id === id);
    if (i < 0) return;
    const card = this.page.props[i];
    this.page.props.splice(i, 1);
    this.page.root.remove(card.root);
    card.dispose();
  }

  /** Raycast the dollhouse floor and three interior walls (room-local). */
  private pickApartmentHit(): ApartmentHit | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const half = MAP_SIZE / 2;
    const root = this.page?.root;
    const toLocal = (world: THREE.Vector3) => (root ? root.worldToLocal(world.clone()) : world.clone());

    type Cand = { point: THREE.Vector3; dist: number; wall?: ApartmentHit['wall'] };
    const cands: Cand[] = [];
    const floorHit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), floorHit)) {
      const local = toLocal(floorHit);
      if (Math.abs(local.x) <= half * 0.96 && Math.abs(local.z) <= half * 0.96 && local.y > -0.5) {
        cands.push({ point: local, dist: this.camera.position.distanceTo(floorHit) });
      }
    }

    const walls: { wall: ApartmentHit['wall']; plane: THREE.Plane; inBounds: (p: THREE.Vector3) => boolean }[] = [
      {
        wall: 'back',
        plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), half),
        inBounds: (p) => Math.abs(p.x) <= half * 0.96 && p.y >= 0 && p.y <= ROOM_WALL_H,
      },
      {
        wall: 'left',
        plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), half),
        inBounds: (p) => Math.abs(p.z) <= half * 0.96 && p.y >= 0 && p.y <= ROOM_WALL_H,
      },
      {
        wall: 'right',
        plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), half),
        inBounds: (p) => Math.abs(p.z) <= half * 0.96 && p.y >= 0 && p.y <= ROOM_WALL_H,
      },
    ];

    for (const wall of walls) {
      // Transform plane into world if the room is rotated.
      const normal = wall.plane.normal.clone();
      const anchor = normal.clone().multiplyScalar(-wall.plane.constant);
      if (root) {
        normal.transformDirection(root.matrixWorld);
        root.localToWorld(anchor);
      }
      const worldPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, anchor);
      const worldHit = new THREE.Vector3();
      if (!this.raycaster.ray.intersectPlane(worldPlane, worldHit)) continue;
      const local = toLocal(worldHit);
      if (!wall.inBounds(local)) continue;
      cands.push({ point: local, dist: this.camera.position.distanceTo(worldHit), wall: wall.wall });
    }

    if (!cands.length) return null;
    cands.sort((a, b) => a.dist - b.dist);
    const nearest = cands[0].dist;
    // Prefer a wall when it's nearly as close as the floor — lets signs slide up/down.
    const best = cands.find((c) => c.wall && c.dist <= nearest * 1.2) ?? cands[0];
    return {
      x: best.point.x / MAP_SIZE,
      z: best.point.z / MAP_SIZE,
      y: Math.max(0, best.point.y),
      wall: best.wall,
    };
  }

  private updatePointer(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  private pick(): { card: StageProp | null; cloud: boolean } {
    if (!this.page) return { card: null, cloud: false };
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const cards = this.page.props.concat(this.ghost ? [this.ghost] : []).filter((p) => p.isInteractive);
    const targets = cards.map((p) => (p instanceof FurniturePiece ? p.root : p.mesh));
    const hits = this.raycaster.intersectObjects(targets, true);
    let card: StageProp | null = null;
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      let c: StageProp | undefined;
      while (obj) {
        c = obj.userData.card as StageProp | undefined;
        if (c) break;
        obj = obj.parent;
      }
      if (c && c.accepts(hit.uv)) {
        card = c;
        break;
      }
    }
    const sphere = this.cloud.hitSphere();
    // Room view sits farther back — give taps a little more room to land.
    if (this.apartmentMode) sphere.radius *= 1.45;
    const cloudHit = this.raycaster.ray.intersectSphere(sphere, new THREE.Vector3());
    const cloud = !!cloudHit && (!card || hits.length === 0 || cloudHit.distanceTo(this.camera.position) < hits[0].distance);
    return { card: cloud ? null : card, cloud };
  }

  private setHovered(card: StageProp | null) {
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
    if (!this.reducedMotion && this.dragId === undefined && !this.orbiting) this.parallaxGoal.set(this.pointer.x, this.pointer.y);
    if (!this.inputEnabled) return;
    if (this.apartmentMode && this.orbiting && this.downAt) {
      const dx = e.clientX - this.downAt.x;
      const dy = e.clientY - this.downAt.y;
      if (Math.hypot(dx, dy) > 4) this.dragMoved = true;
      this.nudgeRoomYaw(dx * 0.005);
      this.nudgeRoomPitch(dy * 0.004);
      this.downAt = { x: e.clientX, y: e.clientY };
      this.renderer.domElement.style.cursor = 'grabbing';
      return;
    }
    if (this.apartmentMode && this.downAt && this.dragId !== undefined) {
      const dist = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
      if (dist > 8) this.dragMoved = true;
      if (this.dragMoved) {
        const hit = this.pickApartmentHit();
        if (hit) {
          this.renderer.domElement.style.cursor = 'grabbing';
          this.emit('drag', this.dragId, hit);
        }
      }
      return;
    }
    if (e.pointerType === 'touch') return;
    const { card, cloud } = this.pick();
    this.setHovered(card);
    if (cloud || card) this.renderer.domElement.style.cursor = 'pointer';
    else if (this.apartmentMode) this.renderer.domElement.style.cursor = 'grab';
  };

  private onPointerDown = (e: PointerEvent) => {
    this.downAt = { x: e.clientX, y: e.clientY };
    this.dragMoved = false;
    this.dragId = undefined;
    this.orbiting = false;
    if (!this.inputEnabled || !this.apartmentMode) return;
    this.updatePointer(e);
    const { card, cloud } = this.pick();
    // Cloud taps should speak, not start a room orbit.
    if (cloud) return;
    if (card?.id) this.dragId = card.id;
    else if (this.ghost) this.dragId = null;
    else this.orbiting = true;
    try {
      this.renderer.domElement.setPointerCapture(e.pointerId);
    } catch {
      /* some browsers deny capture on implicit pointer */
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const down = this.downAt;
    this.downAt = null;
    const dragged = this.dragMoved;
    const dragId = this.dragId;
    const wasOrbit = this.orbiting;
    this.dragMoved = false;
    this.dragId = undefined;
    this.orbiting = false;
    if (!down || !this.inputEnabled) return;
    this.updatePointer(e);
    if (this.apartmentMode && wasOrbit) {
      if (!dragged) {
        const hit = this.pickApartmentHit();
        if (hit) this.emit('place', hit);
      }
      return;
    }
    if (this.apartmentMode && dragged) {
      const hit = this.pickApartmentHit();
      if (hit && dragId !== undefined) this.emit('dragEnd', dragId, hit);
      return;
    }
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return;
    const { card, cloud } = this.pick();
    if (cloud) {
      this.cloud.poke();
      this.emit('pokeCloud');
    } else if (card?.id) {
      this.emit('select', card.id);
    } else if (card) {
      card.poke();
      this.emit('pokeDecor');
    } else if (this.apartmentMode) {
      const hit = this.pickApartmentHit();
      if (hit) this.emit('place', hit);
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
    let tallBack = this.apartmentMode ? ROOM_WALL_H : 2.5;
    for (const p of this.page?.props ?? []) if (p.root.position.z < -3) tallBack = Math.max(tallBack, p.height + p.lift);
    const pts = [
      new THREE.Vector3(-half, 0, -half),
      new THREE.Vector3(half, 0, -half),
      new THREE.Vector3(-half, 0, half),
      new THREE.Vector3(half, 0, half),
      new THREE.Vector3(-half * 0.8, tallBack, -half),
      new THREE.Vector3(half * 0.8, tallBack, -half),
      this.cloudHome.clone().setY(this.cloudHome.y + CLOUD_TOP),
    ];
    if (this.apartmentMode) {
      pts.push(new THREE.Vector3(-half, ROOM_WALL_H, -half), new THREE.Vector3(half, ROOM_WALL_H, half * 0.2));
    }
    return pts;
  }

  private fitCamera() {
    const { w, h } = this.size;
    const cam = this.camera;
    cam.clearViewOffset();
    const dir = new THREE.Vector3(0, Math.sin(ELEVATION), Math.cos(ELEVATION));
    const pts = this.framingPoints();
    const allowX = 2 - ((this.insets.left + this.insets.right) * 2) / w;
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
    // targetC* is the free-region centre in NDC (−1…1). Positive offsetY moves
    // content up; positive offsetX moves content left — so X uses the flipped delta.
    const targetCX = (this.insets.left - this.insets.right) / w;
    const targetCY = (this.insets.bottom - this.insets.top) / h;
    const contentCX = (b.minX + b.maxX) / 2;
    const contentCY = (b.minY + b.maxY) / 2;
    cam.setViewOffset(
      w,
      h,
      ((contentCX - targetCX) * w) / 2,
      ((targetCY - contentCY) * h) / 2,
      w,
      h,
    );
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
      this.ghost?.update(dt, t, this.camera);
      this.page.board.update(dt);
      if (this.apartmentMode) this.page.board.updateFacingWall?.(this.camera);
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
    if (this.apartmentMode) this.keepCloudOutsideRoom();
    this.updateBackdrop(dt);
    this.renderer.render(this.scene, this.camera);
  };

  /** Nudge Little Cloud back out if drift carries it into the dollhouse box. */
  private keepCloudOutsideRoom() {
    const p = this.cloud.worldPosition;
    const limit = MAP_SIZE * 0.52;
    if (Math.abs(p.x) < limit && Math.abs(p.z) < limit) {
      this.cloud.flyTo(this.cloudHome);
    }
  }

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
    this.hideGhost();
    this.cloud.dispose();
    this.contactShadow.dispose();
    this.pageShadow.dispose();
    this.lampGlow?.dispose();
    this.renderer.dispose();
  }
}
