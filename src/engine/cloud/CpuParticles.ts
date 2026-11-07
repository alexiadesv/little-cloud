import * as THREE from 'three';
import { type ParticleParams, type ParticleSystem, particleSeed } from './ParticleSystem';
import type { ShapeTargets } from './shapes';

const vertexShader = /* glsl */ `
  attribute vec4 aColor;
  attribute float aSeed;
  uniform float uSize;
  uniform float uScale;
  varying vec4 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (0.6 + aSeed * 0.8) * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
    vColor = aColor;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec4 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = 1.0 - smoothstep(0.12, 0.5, d);
    float a = vColor.a * disc * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor.rgb, a);
  }
`;

/**
 * WebGL fallback: the same spring + flow-field simulation as the TSL compute
 * shader, run on the CPU and drawn as soft point sprites.
 */
export class CpuParticles implements ParticleSystem {
  readonly kind = 'cpu' as const;
  readonly object: THREE.Points;

  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly col: Float32Array;
  private readonly target: Float32Array;
  private readonly targetCol: Float32Array;
  private readonly seeds: Float32Array;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.ShaderMaterial;

  constructor(readonly count: number, initial: ShapeTargets) {
    this.pos = new Float32Array(initial.positions);
    this.vel = new Float32Array(count * 3);
    this.col = new Float32Array(initial.colors);
    this.target = new Float32Array(initial.positions);
    this.targetCol = new Float32Array(initial.colors);
    this.seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) this.seeds[i] = particleSeed(i);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uSize: { value: 0.15 },
        uScale: { value: 800 },
        uOpacity: { value: 1 },
      },
    });

    const points = new THREE.Points(this.geometry, this.material);
    points.frustumCulled = false;
    points.renderOrder = 5;
    points.raycast = () => {};
    this.object = points;
  }

  setTargets(targets: ShapeTargets) {
    this.target.set(targets.positions);
    this.targetCol.set(targets.colors);
  }

  setViewport(heightPx: number, fovDeg: number) {
    this.material.uniforms.uScale.value = heightPx / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }

  update(dt: number, time: number, params: ParticleParams) {
    const { pos, vel, col, target, targetCol, seeds, count } = this;
    const { stiffness, turbulence, burst } = params;
    const decay = Math.exp(-params.damping * dt);
    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      const o = i * 3;
      const px = pos[o], py = pos[o + 1], pz = pos[o + 2];
      const k = stiffness * (seed * 0.9 + 0.55);
      const phase = seed * 6.2831;
      let ax = (target[o] - px) * k + Math.sin(py * 1.7 + time * 0.9 + phase) * turbulence;
      let ay = (target[o + 1] - py) * k + Math.sin(pz * 1.9 + time * 1.1 + phase * 1.3) * turbulence;
      let az = (target[o + 2] - pz) * k + Math.sin(px * 1.5 + time * 0.8 + phase * 0.7) * turbulence;
      if (burst > 0) {
        const len = Math.max(Math.hypot(px, py, pz), 0.001);
        const b = (burst * (seed + 0.5)) / len;
        ax += px * b;
        ay += py * b;
        az += pz * b;
      }
      const vx = (vel[o] + ax * dt) * decay;
      const vy = (vel[o + 1] + ay * dt) * decay;
      const vz = (vel[o + 2] + az * dt) * decay;
      vel[o] = vx;
      vel[o + 1] = vy;
      vel[o + 2] = vz;
      pos[o] = px + vx * dt;
      pos[o + 1] = py + vy * dt;
      pos[o + 2] = pz + vz * dt;

      const c = i * 4;
      const t = 1 - Math.exp(-params.colorRate * dt * (seed + 0.5));
      col[c] += (targetCol[c] - col[c]) * t;
      col[c + 1] += (targetCol[c + 1] - col[c + 1]) * t;
      col[c + 2] += (targetCol[c + 2] - col[c + 2]) * t;
      col[c + 3] += (targetCol[c + 3] - col[c + 3]) * t;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.material.uniforms.uSize.value = params.size;
    this.material.uniforms.uOpacity.value = params.opacity;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
