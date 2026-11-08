import * as THREE from 'three';
import type { ArtImage } from '../art/assets';
import { hitTest } from '../art/assets';

export const MAP_SIZE = 10;
/** Cards lean back a little, like a pop-up book page half open. */
export const TILT = 0.38;

const easeOutBack = (t: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function artTexture(canvas: HTMLCanvasElement, anisotropy: number) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export interface PropOptions {
  id: string | null;
  art: ArtImage;
  position: [number, number];
  size: number;
  lift?: number;
  anisotropy: number;
  shadowTexture: THREE.Texture;
  appearDelay: number;
  /** Apartment pieces stand in the room instead of billboarding toward the camera. */
  furniture?: boolean;
  rotation?: number;
  preview?: boolean;
  selected?: boolean;
  glow?: boolean;
  glowTexture?: THREE.Texture;
}

/** A standing, pop-up illustration with its own contact shadow and hit mask. */
export class PropCard {
  readonly id: string | null;
  readonly root = new THREE.Group();
  readonly mesh: THREE.Mesh;
  readonly height: number;
  readonly width: number;
  readonly lift: number;
  private readonly art: ArtImage;
  private readonly yaw = new THREE.Group();
  private readonly tilt = new THREE.Group();
  private readonly shadow: THREE.Mesh;
  private readonly material: THREE.MeshBasicMaterial;
  private readonly shadowMaterial: THREE.MeshBasicMaterial;

  private hover = 0;
  hovered = false;
  discovered = false;
  private glow = 0;
  private wiggle = 0;
  private hopT = -1;
  private appear = 0;
  private appearDir: 1 | -1 = 1;
  private delay: number;
  private readonly phase = Math.random() * Math.PI * 2;
  private readonly furniture: boolean;
  private facing = 0;
  preview = false;
  selected = false;
  private readonly lamp: THREE.PointLight | null = null;
  private readonly pool: THREE.Mesh | null = null;
  private readonly poolMaterial: THREE.MeshBasicMaterial | null = null;

  constructor(opts: PropOptions) {
    this.id = opts.id;
    this.art = opts.art;
    this.lift = opts.lift ?? 0;
    this.delay = opts.appearDelay;
    const k = opts.size / opts.art.contentH;
    const fullW = (opts.art.contentW + opts.art.margin * 2) * k;
    const fullH = (opts.art.contentH + opts.art.margin * 2) * k;
    this.height = opts.size;
    this.width = opts.art.contentW * k;

    const geometry = new THREE.PlaneGeometry(fullW, fullH);
    geometry.translate(0, fullH / 2 - opts.art.margin * k, 0);
    this.material = new THREE.MeshBasicMaterial({
      map: artTexture(opts.art.canvas, opts.anisotropy),
      transparent: true,
      alphaTest: 0.02,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
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
    const sw = Math.max(0.5, this.width * 1.05);
    this.shadow.scale.set(sw, Math.min(sw * 0.38, 1.1), 1);
    this.shadow.renderOrder = -5;

    this.furniture = !!opts.furniture;
    this.facing = opts.rotation ?? 0;
    this.preview = !!opts.preview;
    this.selected = !!opts.selected;
    this.tilt.add(this.mesh);
    this.yaw.add(this.tilt);
    this.yaw.position.y = this.lift;
    this.root.add(this.shadow, this.yaw);
    this.root.position.set(opts.position[0] * MAP_SIZE, 0, opts.position[1] * MAP_SIZE);
    this.tilt.rotation.x = -Math.PI / 2;

    if (opts.glow) {
      this.lamp = new THREE.PointLight(0xffc078, this.preview ? 1.1 : 4.4, 12, 1.7);
      this.lamp.position.set(0, this.height * 0.55, 0.2);
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
  }

  moveTo(position: [number, number]) {
    this.root.position.set(position[0] * MAP_SIZE, 0, position[1] * MAP_SIZE);
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

  /** Top-centre of the illustration in world space. */
  top(target = new THREE.Vector3()) {
    return target.copy(this.root.position).setY(this.lift + this.height);
  }

  /** Alpha-aware hit test using the intersection's texture coordinates. */
  accepts(uv: THREE.Vector2 | undefined) {
    return !!uv && hitTest(this.art.hitMask, uv.x, uv.y);
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

  update(dt: number, time: number, camera: THREE.Camera) {
    if (this.delay > 0) this.delay -= dt;
    else this.appear = THREE.MathUtils.clamp(this.appear + (this.appearDir * dt) / 0.7, 0, 1);
    const shown = this.appearDir === 1 ? easeOutBack(this.appear) : this.appear * this.appear;

    this.hover += ((this.hovered ? 1 : 0) - this.hover) * (1 - Math.exp(-12 * dt));
    this.glow += ((this.discovered ? 1 : 0) - this.glow) * (1 - Math.exp(-3 * dt));
    this.wiggle *= Math.exp(-2.6 * dt);

    let hopY = 0;
    if (this.hopT >= 0) {
      this.hopT += dt;
      const p = this.hopT / 0.55;
      hopY = p < 1 ? Math.sin(p * Math.PI) * 0.35 * (1 - p * 0.3) : 0;
      if (p >= 1) this.hopT = -1;
    }

    if (this.furniture) this.yaw.rotation.y = this.facing;
    else {
      const yaw = Math.atan2(camera.position.x - this.root.position.x, camera.position.z - this.root.position.z);
      this.yaw.rotation.y = yaw * 0.85;
    }
    const float = this.furniture ? 0 : this.lift > 0 ? Math.sin(time * 1.6 + this.phase) * 0.12 : 0;
    this.yaw.position.y = this.lift + float + hopY + this.hover * 0.06 + (this.selected ? 0.08 : 0);

    // Storybook cards lean back; furniture stands upright in the dollhouse.
    const lean = this.furniture ? 0 : TILT;
    this.tilt.rotation.x = -Math.PI / 2 + (Math.PI / 2 - lean) * shown;
    this.tilt.rotation.z = Math.sin(time * 16) * this.wiggle * 0.09;
    const s = 1 + this.hover * 0.07;
    this.tilt.scale.set(s, s, s);

    const c = 1 + this.hover * 0.1 + (this.selected ? 0.08 : 0);
    this.material.color.setRGB(c, c, c);
    this.material.opacity = this.preview ? 0.72 : 1;
    this.material.transparent = this.preview;
    this.mesh.visible = this.appear > 0.001;
    this.shadowMaterial.opacity = Math.min(1, this.appear) * (0.55 + this.hover * 0.25) * (this.lift > 0 ? 0.5 : 1);
    this.shadowMaterial.color.setRGB(1, 1 - this.glow * 0.02, 1 - this.glow * 0.45);
    if (this.poolMaterial) {
      const pulse = 0.55 + Math.sin(time * 2.2 + this.phase) * 0.1;
      this.poolMaterial.opacity = Math.min(1, this.appear) * (this.preview ? 0.28 : pulse);
      const pool = 5.2 + Math.sin(time * 1.6 + this.phase) * 0.25;
      this.pool?.scale.set(pool, pool, 1);
    }
    if (this.lamp && !this.preview) this.lamp.intensity = 4.2 + Math.sin(time * 2.2 + this.phase) * 0.45;
  }

  dispose() {
    this.material.map?.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.shadow.geometry.dispose();
    this.shadowMaterial.dispose();
    if (this.lamp) this.lamp.dispose();
    if (this.pool) {
      this.pool.geometry.dispose();
      this.poolMaterial?.dispose();
    }
  }
}
