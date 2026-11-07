import * as THREE from 'three';
import { createCanvas, ctx2d } from '../../art/paint/canvas';
import { mulberry32 } from '../../art/paint/random';

type Mouth = 'smile' | 'wow';
type Pt = [number, number];

function texture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cerulean poster paint, from thin wash to thick loaded bristles. */
const PAINT: [number, number, number][] = [
  [92, 168, 214],
  [62, 140, 200],
  [128, 192, 228],
  [44, 118, 182],
];

/**
 * A dry-brush stroke like the face in the book: a translucent wash under
 * separate bristle tracks that skip where the brush runs out of paint.
 */
function brushStroke(ctx: CanvasRenderingContext2D, path: (t: number) => Pt, width: number, seed: number) {
  const rng = mulberry32(seed);
  const steps = 40;
  const pts = Array.from({ length: steps + 1 }, (_, i) => path(i / steps));
  const normals = pts.map((_, i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(steps, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    return [-(by - ay) / len, (bx - ax) / len] as Pt;
  });
  const taper = (t: number) => 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15));
  const at = (i: number, offset: number): Pt => {
    const w = offset * taper(i / steps);
    return [pts[i][0] + normals[i][0] * w, pts[i][1] + normals[i][1] * w];
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(96, 170, 216, 0.42)';
  for (const k of [-0.25, 0, 0.25]) {
    ctx.lineWidth = width * 0.7;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const [x, y] = at(i, k * width);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const bristles = 14;
  for (let k = 0; k < bristles; k++) {
    const offset = ((k + 0.5) / bristles - 0.5) * width;
    const [r, g, b] = PAINT[Math.floor(rng() * PAINT.length)];
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + rng() * 0.45})`;
    ctx.lineWidth = (width / bristles) * (1.1 + rng() * 1.2);
    let drawing = false;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      // Edge bristles run dry sooner, leaving the streaky paper showing through.
      const dry = Math.abs(offset / width) * 0.5 + (i / steps) * 0.18;
      if (rng() < dry) {
        drawing = false;
        continue;
      }
      const [x, y] = at(i, offset + (rng() - 0.5) * 1.2);
      if (!drawing) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      drawing = true;
    }
    ctx.stroke();
  }
}

function eyeTexture(seed: number) {
  const c = createCanvas(192, 112);
  const ctx = ctx2d(c);
  brushStroke(ctx, (t) => [34 + t * 124, 62 - Math.sin(Math.PI * t) * 12 + t * 4], 54, seed);
  return texture(c);
}

function noseTexture() {
  const c = createCanvas(96, 96);
  const ctx = ctx2d(c);
  brushStroke(ctx, (t) => [32 + t * 30 - Math.sin(Math.PI * t) * 6, 24 + t * 46], 30, 21);
  return texture(c);
}

function mouthTexture(kind: Mouth) {
  const c = createCanvas(320, 128);
  const ctx = ctx2d(c);
  if (kind === 'smile') {
    // Long and a little lopsided, like it was painted in one happy swoop.
    brushStroke(ctx, (t) => [30 + t * 262, 38 + Math.sin(Math.PI * Math.pow(t, 0.9)) * 46 + Math.sin(t * 9) * 3], 38, 33);
  } else {
    brushStroke(ctx, (t) => [160 + Math.cos(t * Math.PI * 2.1 - 1.2) * 30, 64 + Math.sin(t * Math.PI * 2.1 - 1.2) * 36], 28, 44);
  }
  return texture(c);
}

/** The cloud's painted face, after the blue brush strokes in the book. Eyes blink and follow what the child points at. */
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
    this.mouths = { smile: mouthTexture('smile'), wow: mouthTexture('wow') };

    const mat = (map: THREE.Texture) => {
      const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false });
      this.materials.push(m);
      return m;
    };

    for (const [x, seed] of [[-0.36, 5], [0.38, 9]]) {
      const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.22), mat(eyeTexture(seed)));
      eye.position.set(x, 0.16, 0);
      eye.rotation.z = x < 0 ? 0.06 : -0.04;
      eye.renderOrder = 7;
      this.eyes.add(eye);
      this.eyeMeshes.push(eye);
    }
    const nose = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), mat(noseTexture()));
    nose.position.set(0.06, -0.02, 0);
    nose.renderOrder = 7;
    this.mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.38), mat(this.mouths.smile));
    this.mouth.position.set(0.02, -0.27, 0);
    this.mouth.renderOrder = 7;
    this.group.add(this.eyes, nose, this.mouth);
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
      const p = this.blinkT / 0.18;
      sy = p < 1 ? Math.abs(1 - p * 2) * 0.75 + 0.25 : 1;
      if (p >= 1) this.blinkT = -1;
    }
    for (const eye of this.eyeMeshes) eye.scale.y = sy;

    this.look.lerp(this.lookGoal, 1 - Math.exp(-6 * dt));
    this.eyes.position.set(this.look.x * 0.05, this.look.y * 0.03, 0);

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
