import * as THREE from 'three';
import { createCanvas, ctx2d } from '../../art/paint/canvas';
import { applyGrain } from '../../art/paint/finish';

type Mouth = 'smile' | 'wow';

function texture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function eyeTexture() {
  const c = createCanvas(96, 112);
  const ctx = ctx2d(c);
  ctx.fillStyle = '#3d3a5c';
  ctx.beginPath();
  ctx.ellipse(48, 58, 34, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(60, 40, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(36, 76, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  applyGrain(c, { seed: 3, amount: 0.04 });
  return texture(c);
}

function mouthTexture(kind: Mouth) {
  const c = createCanvas(128, 96);
  const ctx = ctx2d(c);
  ctx.strokeStyle = '#3d3a5c';
  ctx.fillStyle = '#3d3a5c';
  ctx.lineCap = 'round';
  ctx.lineWidth = 11;
  if (kind === 'smile') {
    ctx.beginPath();
    ctx.arc(64, 22, 36, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(64, 50, 18, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f08aa8';
    ctx.beginPath();
    ctx.ellipse(64, 62, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return texture(c);
}

function cheekTexture() {
  const c = createCanvas(96, 96);
  const ctx = ctx2d(c);
  const g = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  g.addColorStop(0, 'rgba(240,138,168,0.75)');
  g.addColorStop(1, 'rgba(240,138,168,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 96);
  return texture(c);
}

/** The cloud's face: blinking eyes that follow what the child is pointing at. */
export class CloudFace {
  readonly group = new THREE.Group();
  private readonly eyes = new THREE.Group();
  private readonly eyeMeshes: THREE.Mesh[] = [];
  private readonly mouth: THREE.Mesh;
  private readonly mouths: Record<Mouth, THREE.Texture>;
  private readonly materials: THREE.MeshBasicMaterial[] = [];
  private nextBlink = 2;
  private blinkT = -1;
  private look = new THREE.Vector2();
  private lookGoal = new THREE.Vector2();
  private mouthTimer = 0;
  opacity = 1;

  constructor() {
    const eyeTex = eyeTexture();
    const cheekTex = cheekTexture();
    this.mouths = { smile: mouthTexture('smile'), wow: mouthTexture('wow') };

    const mat = (map: THREE.Texture) => {
      const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false });
      this.materials.push(m);
      return m;
    };

    for (const x of [-0.27, 0.27]) {
      const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.19), mat(eyeTex));
      eye.position.set(x, 0.06, 0);
      eye.renderOrder = 7;
      this.eyes.add(eye);
      this.eyeMeshes.push(eye);
    }
    for (const x of [-0.48, 0.48]) {
      const cheek = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), mat(cheekTex));
      cheek.position.set(x, -0.1, -0.01);
      cheek.renderOrder = 6;
      this.group.add(cheek);
    }
    this.mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.195), mat(this.mouths.smile));
    this.mouth.position.set(0, -0.12, 0);
    this.mouth.renderOrder = 7;
    this.group.add(this.eyes, this.mouth);
    this.group.position.set(0.05, 0.02, 0.82);
  }

  /** Direction to look, in the face's local screen-aligned space (-1..1). */
  lookTowards(x: number, y: number) {
    this.lookGoal.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  }

  surprise(seconds = 0.9) {
    this.mouthTimer = seconds;
  }

  update(dt: number) {
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blinkT = 0;
      this.nextBlink = 2.2 + Math.random() * 3.5;
    }
    let sy = 1;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const p = this.blinkT / 0.16;
      sy = p < 1 ? Math.abs(1 - p * 2) * 0.9 + 0.1 : 1;
      if (p >= 1) this.blinkT = -1;
    }
    for (const eye of this.eyeMeshes) eye.scale.y = sy;

    this.look.lerp(this.lookGoal, 1 - Math.exp(-6 * dt));
    this.eyes.position.set(this.look.x * 0.06, this.look.y * 0.04, 0);

    this.mouthTimer -= dt;
    const map = this.mouthTimer > 0 ? this.mouths.wow : this.mouths.smile;
    const mouthMat = this.mouth.material as THREE.MeshBasicMaterial;
    if (mouthMat.map !== map) mouthMat.map = map;

    for (const m of this.materials) m.opacity = this.opacity;
    this.group.visible = this.opacity > 0.01;
  }

  dispose() {
    for (const m of this.materials) {
      m.map?.dispose();
      m.dispose();
    }
    this.mouths.wow.dispose();
    this.mouths.smile.dispose();
  }
}
