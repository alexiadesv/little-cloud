import * as THREE from 'three';
import { ROOM_WALL_H } from '../data/furniture';
import { ROOM_LIGHTS, type RoomTime } from '../data/roomTime';
import { MAP_SIZE, artTexture } from './props';

export interface RoomTextures {
  floor: HTMLCanvasElement;
  back: HTMLCanvasElement;
  side: HTMLCanvasElement;
  left: HTMLCanvasElement;
  front: HTMLCanvasElement;
  ceiling: HTMLCanvasElement;
  door: HTMLCanvasElement;
}

export type RoomWallFace = 'front' | 'back' | 'left' | 'right';

export interface StageGround {
  readonly group: THREE.Group;
  fadeOut(): void;
  readonly faded: boolean;
  update(dt: number): void;
  dispose(): void;
  setTimeOfDay?(mode: RoomTime): void;
  updateFacingWall?(camera: THREE.Camera): void;
}

/** Open-top dollhouse: floor, four walls (camera-facing wall hides), no roof. */
export class ApartmentRoom implements StageGround {
  readonly group = new THREE.Group();
  private readonly fadeMats: THREE.MeshBasicMaterial[] = [];
  private readonly lambert: THREE.MeshLambertMaterial[] = [];
  private readonly meshes: THREE.Mesh[] = [];
  private readonly textures: THREE.Texture[] = [];
  private readonly walls: Record<RoomWallFace, THREE.Mesh>;
  private readonly ambient: THREE.AmbientLight;
  private readonly hemi: THREE.HemisphereLight;
  private readonly sun: THREE.DirectionalLight;
  private readonly windowLight: THREE.PointLight;
  private readonly fill: THREE.PointLight;
  private opacity = 0;
  private goal = 1;
  private time: RoomTime = 'day';
  private hiddenWall: RoomWallFace = 'front';

  constructor(art: RoomTextures, shadowTexture: THREE.Texture, anisotropy: number, time: RoomTime = 'day') {
    const half = MAP_SIZE / 2;
    const h = ROOM_WALL_H;
    const yMid = h / 2;

    const floor = this.panel(art.floor, anisotropy, MAP_SIZE, MAP_SIZE);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    const back = this.panel(art.back, anisotropy, MAP_SIZE, h);
    back.position.set(0, yMid, -half);

    const left = this.panel(art.left, anisotropy, MAP_SIZE, h);
    left.rotation.y = Math.PI / 2;
    left.position.set(-half, yMid, 0);

    const right = this.panel(art.side, anisotropy, MAP_SIZE, h);
    right.rotation.y = -Math.PI / 2;
    right.position.set(half, yMid, 0);

    // Solid fourth wall — hidden when it faces the camera so the room stays open.
    const front = this.panel(art.side, anisotropy, MAP_SIZE, h);
    front.rotation.y = Math.PI;
    front.position.set(0, yMid, half);

    this.walls = { front, back, left, right };

    this.windowLight = new THREE.PointLight(0xfff2d8, 1.55, 18, 2);
    this.windowLight.position.set(-half + 0.6, h * 0.55, 0.2);

    this.fill = new THREE.PointLight(0xfff8ee, 1.1, 22, 1.6);
    this.fill.position.set(0, h * 0.62, 0.15);

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

    this.ambient = new THREE.AmbientLight(0xfff4e8, 1.25);
    this.hemi = new THREE.HemisphereLight(0xfffaf2, 0xc4a88a, 0.55);
    this.sun = new THREE.DirectionalLight(0xffe6c8, 0.7);
    this.sun.position.set(2.5, 6.5, 4.5);

    this.group.add(
      shadow,
      floor,
      back,
      left,
      right,
      front,
      door,
      this.ambient,
      this.hemi,
      this.sun,
      this.windowLight,
      this.fill,
    );
    this.setTimeOfDay(time);
    this.walls.front.visible = false;
  }

  /** Hide the wall that currently faces the camera so the child can see inside. */
  updateFacingWall(camera: THREE.Camera) {
    let hide: RoomWallFace = 'front';
    let best = Infinity;
    const at = new THREE.Vector3();
    for (const face of Object.keys(this.walls) as RoomWallFace[]) {
      this.walls[face].getWorldPosition(at);
      const d = at.distanceToSquared(camera.position);
      if (d < best) {
        best = d;
        hide = face;
      }
    }
    if (hide === this.hiddenWall) return;
    this.walls[this.hiddenWall].visible = true;
    this.walls[hide].visible = false;
    this.hiddenWall = hide;
  }

  setTimeOfDay(mode: RoomTime) {
    this.time = mode;
    const preset = ROOM_LIGHTS[mode];
    this.ambient.color.setHex(preset.ambient.color);
    this.ambient.intensity = preset.ambient.intensity;
    this.hemi.color.setHex(preset.hemi.sky);
    this.hemi.groundColor.setHex(preset.hemi.ground);
    this.hemi.intensity = preset.hemi.intensity;
    this.sun.color.setHex(preset.sun.color);
    this.sun.intensity = preset.sun.intensity;
    this.sun.position.set(...preset.sun.position);
    this.windowLight.color.setHex(preset.window.color);
    this.windowLight.intensity = preset.window.intensity;
    this.fill.color.setHex(preset.fill.color);
    this.fill.intensity = preset.fill.intensity;
  }

  getTimeOfDay() {
    return this.time;
  }

  private panel(canvas: HTMLCanvasElement, anisotropy: number, w: number, h: number) {
    const tex = artTexture(canvas, anisotropy);
    this.textures.push(tex);
    const mat = new THREE.MeshLambertMaterial({
      map: tex,
      transparent: false,
      side: THREE.DoubleSide,
    });
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
