import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FURNITURE_WORLD_SCALE, furnitureModelUrl } from '../data/furnitureModels';
import { MAP_SIZE } from './props';

const loader = new GLTFLoader();
const modelCache = new Map<string, Promise<THREE.Object3D>>();

function ensureModel(gameId: string): Promise<THREE.Object3D> {
  const hit = modelCache.get(gameId);
  if (hit) return hit;
  const job = loader.loadAsync(furnitureModelUrl(gameId)).then((gltf) => {
    const root = gltf.scene;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat && 'color' in mat) {
          mat.side = THREE.FrontSide;
          if ('metalness' in mat) (mat as THREE.MeshStandardMaterial).metalness = Math.min(0.15, (mat as THREE.MeshStandardMaterial).metalness ?? 0);
          if ('roughness' in mat) (mat as THREE.MeshStandardMaterial).roughness = Math.max(0.55, (mat as THREE.MeshStandardMaterial).roughness ?? 0.8);
        }
      }
    });
    // Centre XZ on the footprint; keep Y grounded at 0.
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= box.min.y;
    root.scale.setScalar(FURNITURE_WORLD_SCALE);
    return root;
  });
  modelCache.set(gameId, job);
  return job;
}

function loadModel(gameId: string): Promise<THREE.Object3D> {
  return ensureModel(gameId).then((m) => m.clone(true));
}

export interface FurniturePieceOptions {
  id: string;
  position: [number, number];
  lift?: number;
  rotation?: number;
  appearDelay?: number;
  preview?: boolean;
  selected?: boolean;
  glow?: boolean;
  /** Physical height in world units (scaled model). */
  height: number;
  /** Footprint width used for shadow sizing. */
  width: number;
  shadowTexture: THREE.Texture;
  glowTexture?: THREE.Texture;
}

/**
 * True 3D apartment furniture (GLB). Mirrors the PropCard surface Engine uses
 * for picking, dragging, selection and appearance.
 */
export class FurniturePiece {
  readonly id: string;
  readonly root = new THREE.Group();
  /** Proxy mesh for raycasts before / while the GLB streams in. */
  readonly mesh: THREE.Mesh;
  readonly height: number;
  readonly width: number;
  lift: number;

  hovered = false;
  discovered = true;
  preview = false;
  selected = false;

  private readonly yaw = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly shadow: THREE.Mesh;
  private readonly shadowMaterial: THREE.MeshBasicMaterial;
  private readonly proxyMaterial: THREE.MeshBasicMaterial;
  private model: THREE.Object3D | null = null;
  private facing = 0;
  private hover = 0;
  private wiggle = 0;
  private hopT = -1;
  private appear = 0;
  private appearDir: 1 | -1 = 1;
  private delay: number;
  private readonly phase = Math.random() * Math.PI * 2;
  private readonly lamp: THREE.PointLight | null = null;
  private readonly pool: THREE.Mesh | null = null;
  private readonly poolMaterial: THREE.MeshBasicMaterial | null = null;
  private disposed = false;

  constructor(opts: FurniturePieceOptions) {
    this.id = opts.id;
    this.lift = opts.lift ?? 0;
    this.height = opts.height;
    this.width = opts.width;
    this.delay = opts.appearDelay ?? 0.05;
    this.facing = opts.rotation ?? 0;
    this.preview = !!opts.preview;
    this.selected = !!opts.selected;

    this.proxyMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.4, opts.width), Math.max(0.4, opts.height), Math.max(0.4, opts.width * 0.7)), this.proxyMaterial);
    this.mesh.position.y = opts.height / 2;
    this.mesh.userData.piece = this;
    this.mesh.userData.card = this;

    this.shadowMaterial = new THREE.MeshBasicMaterial({
      map: opts.shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      color: new THREE.Color('#ffffff'),
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    const sw = Math.max(0.6, opts.width * 1.1);
    this.shadow.scale.set(sw, Math.min(sw * 0.4, 1.2), 1);
    this.shadow.renderOrder = -5;

    this.body.add(this.mesh);
    this.yaw.add(this.body);
    this.yaw.position.y = this.lift;
    this.root.add(this.shadow, this.yaw);
    this.root.position.set(opts.position[0] * MAP_SIZE, 0, opts.position[1] * MAP_SIZE);

    if (opts.glow) {
      this.lamp = new THREE.PointLight(0xffc078, this.preview ? 1.1 : 4.4, 12, 1.7);
      this.lamp.position.set(0, this.height * 0.55, 0.15);
      this.yaw.add(this.lamp);
      this.poolMaterial = new THREE.MeshBasicMaterial({
        map: opts.glowTexture ?? opts.shadowTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        color: new THREE.Color('#ffb060'),
      });
      this.pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.poolMaterial);
      this.pool.rotation.x = -Math.PI / 2;
      this.pool.position.y = 0.04;
      this.pool.scale.set(5.4, 5.4, 1);
      this.pool.renderOrder = -4;
      this.root.add(this.pool);
    }

    void loadModel(opts.id).then((model) => {
      if (this.disposed) {
        model.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach((mat) => mat?.dispose());
          }
        });
        return;
      }
      this.model = model;
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.userData.piece = this;
        if (m.isMesh) m.userData.card = this;
      });
      this.body.add(model);
      this.mesh.visible = false;
    });
  }

  moveTo(position: [number, number]) {
    this.root.position.set(position[0] * MAP_SIZE, 0, position[1] * MAP_SIZE);
  }

  setLift(lift: number) {
    this.lift = lift;
  }

  setRotation(rad: number) {
    this.facing = rad;
  }

  setPreview(on: boolean) {
    this.preview = on;
    if (this.lamp) this.lamp.intensity = on ? 1.1 : 4.4;
  }

  setSelected(on: boolean) {
    this.selected = on;
  }

  get isInteractive() {
    return this.appear > 0.85 && this.appearDir === 1;
  }

  top(target = new THREE.Vector3()) {
    return target.copy(this.root.position).setY(this.lift + this.height);
  }

  accepts(_uv: THREE.Vector2 | undefined) {
    return true;
  }

  hint() {
    this.wiggle = 1;
    this.hopT = 0;
  }

  hop() {
    if (this.hopT < 0) this.hopT = 0;
  }

  poke() {
    this.wiggle = Math.max(this.wiggle, 0.7);
  }

  hide(delay = 0) {
    this.appearDir = -1;
    this.delay = delay;
  }

  appearNow() {
    this.delay = 0;
    this.appear = 1;
    this.appearDir = 1;
  }

  update(dt: number, time: number, _camera: THREE.Camera) {
    if (this.delay > 0) this.delay -= dt;
    else this.appear = THREE.MathUtils.clamp(this.appear + (this.appearDir * dt) / 0.55, 0, 1);

    this.hover += ((this.hovered ? 1 : 0) - this.hover) * (1 - Math.exp(-12 * dt));
    this.wiggle *= Math.exp(-2.6 * dt);

    let hopY = 0;
    if (this.hopT >= 0) {
      this.hopT += dt;
      const p = this.hopT / 0.55;
      hopY = p < 1 ? Math.sin(p * Math.PI) * 0.28 * (1 - p * 0.3) : 0;
      if (p >= 1) this.hopT = -1;
    }

    this.yaw.rotation.y = this.facing;
    this.yaw.position.y = this.lift + hopY + this.hover * 0.05 + (this.selected ? 0.06 : 0);
    const s = (0.15 + 0.85 * this.appear) * (1 + this.hover * 0.04 + (this.selected ? 0.03 : 0));
    this.body.scale.setScalar(s);
    this.root.visible = this.appear > 0.001;

    if (this.model) {
      this.model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          if (!mat || !('opacity' in mat)) continue;
          const std = mat as THREE.MeshStandardMaterial;
          std.transparent = this.preview || this.appear < 0.98;
          std.opacity = (this.preview ? 0.72 : 1) * Math.min(1, this.appear);
        }
      });
    }

    this.shadowMaterial.opacity = Math.min(1, this.appear) * (0.5 + this.hover * 0.2) * (this.lift > 0.2 ? 0.45 : 1);
    if (this.poolMaterial) {
      const pulse = 0.55 + Math.sin(time * 2.2 + this.phase) * 0.1;
      this.poolMaterial.opacity = Math.min(1, this.appear) * (this.preview ? 0.28 : pulse);
      const pool = 5.2 + Math.sin(time * 1.6 + this.phase) * 0.25;
      this.pool?.scale.set(pool, pool, 1);
    }
    if (this.lamp && !this.preview) this.lamp.intensity = 4.2 + Math.sin(time * 2.2 + this.phase) * 0.45;
  }

  dispose() {
    this.disposed = true;
    this.proxyMaterial.dispose();
    this.mesh.geometry.dispose();
    this.shadow.geometry.dispose();
    this.shadowMaterial.dispose();
    if (this.lamp) this.lamp.dispose();
    if (this.pool) this.pool.geometry.dispose();
    this.poolMaterial?.dispose();
    // GLB geometries are shared via the model cache — only detach.
    this.model?.removeFromParent();
    this.model = null;
  }
}

export async function preloadFurnitureModels(ids: string[]) {
  await Promise.all(ids.map((id) => ensureModel(id)));
}
