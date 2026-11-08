import * as THREE from 'three';
import { ROOM_CEILING, ROOM_WALL_H } from '../data/furniture';
import { MAP_SIZE, artTexture } from './props';

export interface RoomTextures {
  floor: HTMLCanvasElement;
  back: HTMLCanvasElement;
  side: HTMLCanvasElement;
  ceiling: HTMLCanvasElement;
  door: HTMLCanvasElement;
}

export interface StageGround {
  readonly group: THREE.Group;
  fadeOut(): void;
  readonly faded: boolean;
  update(dt: number): void;
  dispose(): void;
}

/** Open-front dollhouse: floor, three upright walls, a ceiling, and a standing door. */
export class ApartmentRoom implements StageGround {
  readonly group = new THREE.Group();
  private readonly fadeMats: THREE.MeshBasicMaterial[] = [];
  private readonly lambert: THREE.MeshLambertMaterial[] = [];
  private readonly meshes: THREE.Mesh[] = [];
  private readonly textures: THREE.Texture[] = [];
  private opacity = 0;
  private goal = 1;

  constructor(art: RoomTextures, shadowTexture: THREE.Texture, anisotropy: number) {
    const half = MAP_SIZE / 2;
    const h = ROOM_WALL_H;
    const yMid = h / 2;

    const floor = this.panel(art.floor, anisotropy, MAP_SIZE, MAP_SIZE);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    const back = this.panel(art.back, anisotropy, MAP_SIZE, h);
    back.position.set(0, yMid, -half);

    const left = this.panel(art.side, anisotropy, MAP_SIZE, h);
    left.rotation.y = Math.PI / 2;
    left.position.set(-half, yMid, 0);

    const right = this.panel(art.side, anisotropy, MAP_SIZE, h);
    right.rotation.y = -Math.PI / 2;
    right.position.set(half, yMid, 0);

    const ceiling = this.panel(art.ceiling, anisotropy, MAP_SIZE, MAP_SIZE);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ROOM_CEILING;

    const door = this.panel(art.door, anisotropy, 1.55, 3.15);
    door.rotation.y = -Math.PI / 2;
    door.position.set(half - 0.08, 3.15 / 2, 1.15);

    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0 });
    this.fadeMats.push(shadowMat);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE * 1.28, MAP_SIZE * 1.28), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.15, -0.85, 0.4);
    shadow.renderOrder = -20;
    this.meshes.push(shadow);

    const ambient = new THREE.AmbientLight(0xfff4e8, 0.95);
    const hemi = new THREE.HemisphereLight(0xfffaf2, 0xc4a88a, 0.5);
    const sun = new THREE.DirectionalLight(0xffe6c8, 0.55);
    sun.position.set(2.5, 6.5, 4.5);

    this.group.add(shadow, floor, back, left, right, ceiling, door, ambient, hemi, sun);
  }

  private panel(canvas: HTMLCanvasElement, anisotropy: number, w: number, h: number) {
    const tex = artTexture(canvas, anisotropy);
    this.textures.push(tex);
    const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: false });
    this.lambert.push(mat);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    this.meshes.push(mesh);
    return mesh;
  }

  fadeOut() {
    this.goal = 0;
  }

  get faded() {
    return this.goal === 0 && this.opacity < 0.02;
  }

  update(dt: number) {
    this.opacity += (this.goal - this.opacity) * (1 - Math.exp(-(this.goal ? 3 : 5) * dt));
    const o = this.goal === 1 ? 1 : this.opacity;
    for (const m of this.fadeMats) m.opacity = o * 0.85;
    for (const m of this.lambert) {
      m.opacity = o;
      m.transparent = o < 0.98;
    }
    this.group.position.y = (1 - this.opacity) * (this.goal ? -0.6 : -0.3);
  }

  dispose() {
    for (const m of [...this.fadeMats, ...this.lambert]) {
      m.map?.dispose();
      m.dispose();
    }
    for (const t of this.textures) t.dispose();
    for (const mesh of this.meshes) mesh.geometry.dispose();
  }
}
