import * as THREE from 'three';
import { MAP_SIZE, artTexture } from './props';
import type { StageGround } from './room';

/** The floating, feather-edged square illustration plus its soft page shadow. */
export class MapBoard implements StageGround {
  readonly group = new THREE.Group();
  private readonly mapMaterial: THREE.MeshBasicMaterial;
  private readonly shadowMaterial: THREE.MeshBasicMaterial;
  private readonly meshes: THREE.Mesh[] = [];
  private opacity = 0;
  private goal = 1;

  constructor(mapCanvas: HTMLCanvasElement, shadowTexture: THREE.Texture, anisotropy: number) {
    // The painted map has a ~3% transparent border for its feathered edge.
    const planeSize = MAP_SIZE / (1 - 0.06);
    this.mapMaterial = new THREE.MeshBasicMaterial({
      map: artTexture(mapCanvas, anisotropy),
      transparent: true,
      alphaTest: 0.01,
      opacity: 0,
    });
    const map = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), this.mapMaterial);
    map.rotation.x = -Math.PI / 2;
    map.renderOrder = -10;

    this.shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0 });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(planeSize * 1.32, planeSize * 1.32), this.shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.25, -0.9, 0.55);
    shadow.renderOrder = -20;

    this.meshes.push(map, shadow);
    this.group.add(shadow, map);
  }

  fadeOut() {
    this.goal = 0;
  }

  get faded() {
    return this.goal === 0 && this.opacity < 0.02;
  }

  update(dt: number) {
    this.opacity += (this.goal - this.opacity) * (1 - Math.exp(-(this.goal ? 3 : 5) * dt));
    this.mapMaterial.opacity = this.opacity;
    this.shadowMaterial.opacity = this.opacity * 0.85;
    this.group.position.y = (1 - this.opacity) * (this.goal ? -0.6 : -0.3);
  }

  dispose() {
    this.mapMaterial.map?.dispose();
    this.mapMaterial.dispose();
    this.shadowMaterial.dispose();
    for (const m of this.meshes) m.geometry.dispose();
  }
}
