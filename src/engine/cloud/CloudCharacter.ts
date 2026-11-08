import * as THREE from 'three';
import { CloudFace } from './CloudFace';
import type { ParticleParams, ParticleSystem } from './ParticleSystem';
import type { ShapeTargets } from './shapes';

type CloudState = 'cloud' | 'shape';

const CLOUD_PARAMS: ParticleParams = {
  stiffness: 9,
  damping: 4.2,
  turbulence: 0.45,
  burst: 0,
  size: 0.22,
  opacity: 1,
  colorRate: 3.2,
};

const SHAPE_PARAMS: ParticleParams = {
  ...CLOUD_PARAMS,
  stiffness: 15,
  damping: 4.6,
  turbulence: 0.1,
  size: 0.078,
  colorRate: 3.8,
};

const approach = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

/**
 * Little Cloud: a particle body, a painted face and a soft ground shadow.
 * It wanders near its home spot, flies over to things the child taps and
 * reshapes its particles into their silhouettes.
 */
export class CloudCharacter {
  readonly root = new THREE.Group();
  private readonly body = new THREE.Group();
  readonly face = new CloudFace();
  readonly shadow: THREE.Mesh;

  private state: CloudState = 'cloud';
  private readonly position: THREE.Vector3;
  private readonly velocity = new THREE.Vector3();
  private readonly goal: THREE.Vector3;
  private home: THREE.Vector3;
  private readonly params: ParticleParams = { ...CLOUD_PARAMS };
  private burst = 0;
  private swirl = 0;
  private squash = 0;
  private squashVel = 0;
  private lookWorld: THREE.Vector3 | null = null;
  private drift = 1;
  private readonly tmp = new THREE.Vector3();

  constructor(
    readonly particles: ParticleSystem,
    private readonly cloudTargets: ShapeTargets,
    shadowTexture: THREE.Texture,
    home: THREE.Vector3,
  ) {
    this.home = home.clone();
    this.position = home.clone().add(new THREE.Vector3(0, 4, 0));
    this.goal = home.clone();
    this.body.add(particles.object, this.face.group);
    this.root.add(this.body);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0.5 }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = -4;
  }

  get isShape() {
    return this.state === 'shape';
  }

  get worldPosition(): THREE.Vector3 {
    return this.position;
  }

  setHome(home: THREE.Vector3) {
    this.home = home.clone();
    if (this.state === 'cloud') this.goal.copy(home);
  }

  morphTo(targets: ShapeTargets, at: THREE.Vector3) {
    this.state = 'shape';
    this.particles.setTargets(targets);
    this.goal.copy(at);
    this.burst = 7;
    this.swirl = 1.6;
    this.face.surprise(0.6);
  }

  morphToCloud() {
    if (this.state === 'cloud') return;
    this.state = 'cloud';
    this.particles.setTargets(this.cloudTargets);
    this.goal.copy(this.home);
    this.burst = 3.5;
    this.swirl = 0.9;
  }

  /** Fly off-page (used between pages) or back. */
  flyTo(point: THREE.Vector3) {
    this.goal.copy(point);
  }

  poke() {
    this.squashVel += 9;
    this.face.surprise(0.9);
    this.burst = Math.max(this.burst, 2);
  }

  /** How far the cloud meanders from home. Larger on the title page. */
  setDrift(amount: number) {
    this.drift = amount;
  }

  lookAt(point: THREE.Vector3 | null) {
    this.lookWorld = point ? point.clone() : null;
  }

  /** Bounding sphere for tap detection. */
  hitSphere(): THREE.Sphere {
    return new THREE.Sphere(this.position, this.state === 'cloud' ? 1.35 : 1.6);
  }

  update(dt: number, time: number, camera: THREE.Camera) {
    const wander = (this.state === 'cloud' ? 1 : 0.15) * this.drift;
    this.tmp.set(
      Math.sin(time * 0.21) * 1.1 * wander,
      Math.sin(time * 0.53) * 0.18 * wander,
      Math.sin(time * 0.17 + 1) * 0.55 * wander,
    );
    const target = this.tmp.add(this.goal);
    const accel = target.sub(this.position).multiplyScalar(6.5).addScaledVector(this.velocity, -4.6);
    this.velocity.addScaledVector(accel, dt);
    this.position.addScaledVector(this.velocity, dt);

    this.root.position.copy(this.position);
    this.root.quaternion.copy(camera.quaternion);

    this.squashVel += (-this.squash * 90 - this.squashVel * 9) * dt;
    this.squash += this.squashVel * dt;
    const breathe = this.state === 'cloud' ? Math.sin(time * 0.8) * 0.018 : 0;
    this.body.scale.set(1 + breathe + this.squash * 0.08, 1 + breathe - this.squash * 0.12, 1);
    this.body.position.y = Math.sin(time * 1.3) * 0.07;
    const lean = THREE.MathUtils.clamp(-this.velocity.x * 0.07, -0.25, 0.25);
    this.body.rotation.z = approach(this.body.rotation.z, lean, 5, dt);

    const goalParams = this.state === 'cloud' ? CLOUD_PARAMS : SHAPE_PARAMS;
    this.burst *= Math.exp(-5 * dt);
    this.swirl *= Math.exp(-1.6 * dt);
    const p = this.params;
    p.stiffness = approach(p.stiffness, goalParams.stiffness, 3, dt);
    p.damping = goalParams.damping;
    p.size = approach(p.size, goalParams.size, this.state === 'shape' ? 2.2 : 1.6, dt);
    p.turbulence = goalParams.turbulence + this.swirl;
    p.colorRate = goalParams.colorRate;
    p.burst = this.burst;
    p.opacity = 1;
    this.particles.update(dt, time, p);

    this.face.opacity = approach(this.face.opacity, this.state === 'cloud' ? 1 : 0, this.state === 'cloud' ? 2.5 : 8, dt);
    if (this.lookWorld) {
      const local = this.lookWorld.clone().project(camera).sub(this.position.clone().project(camera));
      this.face.lookTowards(local.x * 3, local.y * 3);
    } else {
      this.face.lookTowards(Math.sin(time * 0.4) * 0.3, -0.2);
    }
    this.face.update(dt);

    const height = Math.max(0.5, this.position.y);
    const spread = this.state === 'cloud' ? 3.4 : 3.0;
    this.shadow.position.set(this.position.x, 0.03, this.position.z + 0.15);
    this.shadow.scale.set(spread, spread * 0.45, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(1.6 / height, 0.12, 0.42);
  }

  dispose() {
    this.particles.dispose();
    this.face.dispose();
    this.shadow.geometry.dispose();
    (this.shadow.material as THREE.Material).dispose();
  }
}
