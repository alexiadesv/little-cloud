import * as THREE from 'three/webgpu';
import {
  Fn,
  exp,
  float,
  instanceIndex,
  instancedArray,
  max,
  mix,
  sin,
  smoothstep,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import { type ParticleParams, type ParticleSystem, particleSeed } from './ParticleSystem';
import type { ShapeTargets } from './shapes';

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/**
 * Cloud particles simulated entirely on the GPU with a TSL compute shader and
 * drawn as instanced, camera-facing soft sprites.
 */
export class GpuParticles implements ParticleSystem {
  readonly kind = 'gpu' as const;
  readonly object: THREE.Sprite;

  private readonly posBuffer;
  private readonly targetBuffer;
  private readonly targetColorBuffer;
  private readonly computeNode;
  private readonly material: THREE.SpriteNodeMaterial;

  private readonly uTime = uniform(0);
  private readonly uDt = uniform(1 / 60);
  private readonly uStiffness = uniform(10);
  private readonly uDamping = uniform(4.5);
  private readonly uTurbulence = uniform(0.3);
  private readonly uBurst = uniform(0);
  private readonly uColorRate = uniform(3);
  private readonly uSize = uniform(0.15);
  private readonly uOpacity = uniform(1);

  constructor(
    private readonly renderer: THREE.WebGPURenderer,
    readonly count: number,
    initial: ShapeTargets,
  ) {
    const pos = new Float32Array(count * 4);
    const col = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 4] = initial.positions[i * 3];
      pos[i * 4 + 1] = initial.positions[i * 3 + 1];
      pos[i * 4 + 2] = initial.positions[i * 3 + 2];
      pos[i * 4 + 3] = particleSeed(i);
    }
    this.writeColors(col, initial.colors);

    this.posBuffer = instancedArray(pos, 'vec4');
    const velBuffer = instancedArray(count, 'vec4');
    this.targetBuffer = instancedArray(new Float32Array(pos), 'vec4');
    const colorBuffer = instancedArray(new Float32Array(col), 'vec4');
    this.targetColorBuffer = instancedArray(col, 'vec4');

    const { uTime, uDt, uStiffness, uDamping, uTurbulence, uBurst, uColorRate } = this;

    this.computeNode = Fn(() => {
      const p = this.posBuffer.element(instanceIndex);
      const v = velBuffer.element(instanceIndex);
      const target = this.targetBuffer.element(instanceIndex);
      const c = colorBuffer.element(instanceIndex);
      const tc = this.targetColorBuffer.element(instanceIndex);

      const seed = p.w.toVar();
      const position = p.xyz.toVar();
      const velocity = v.xyz.toVar();
      const phase = seed.mul(6.2831);

      const accel = target.xyz.sub(position).mul(uStiffness.mul(seed.mul(0.9).add(0.55))).toVar();
      const flow = vec3(
        sin(position.y.mul(1.7).add(uTime.mul(0.9)).add(phase)),
        sin(position.z.mul(1.9).add(uTime.mul(1.1)).add(phase.mul(1.3))),
        sin(position.x.mul(1.5).add(uTime.mul(0.8)).add(phase.mul(0.7))),
      );
      accel.addAssign(flow.mul(uTurbulence));
      const len = max(position.length(), float(0.001));
      accel.addAssign(position.div(len).mul(uBurst.mul(seed.add(0.5))));

      velocity.assign(velocity.add(accel.mul(uDt)).mul(exp(uDamping.negate().mul(uDt))));
      position.addAssign(velocity.mul(uDt));

      p.assign(vec4(position, seed));
      v.assign(vec4(velocity, 0));
      const k = float(1).sub(exp(uColorRate.negate().mul(uDt).mul(seed.add(0.5))));
      c.assign(mix(c, tc, k));
    })().compute(count);

    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
    const posAttr = this.posBuffer.toAttribute();
    const colAttr = colorBuffer.toAttribute();
    material.positionNode = posAttr.xyz;
    material.scaleNode = this.uSize.mul(posAttr.w.mul(0.8).add(0.6));
    const dist = uv().sub(0.5).length();
    const disc = float(1).sub(smoothstep(0.12, 0.5, dist));
    material.colorNode = vec4(colAttr.xyz, 1);
    material.opacityNode = colAttr.w.mul(disc).mul(this.uOpacity);
    this.material = material;

    const sprite = new THREE.Sprite(material);
    sprite.count = count;
    sprite.frustumCulled = false;
    sprite.renderOrder = 5;
    sprite.raycast = () => {};
    this.object = sprite;
  }

  private writeColors(out: Float32Array, srgb: Float32Array) {
    for (let i = 0; i < this.count; i++) {
      out[i * 4] = srgbToLinear(srgb[i * 4]);
      out[i * 4 + 1] = srgbToLinear(srgb[i * 4 + 1]);
      out[i * 4 + 2] = srgbToLinear(srgb[i * 4 + 2]);
      out[i * 4 + 3] = srgb[i * 4 + 3];
    }
  }

  setTargets(targets: ShapeTargets) {
    const t = this.targetBuffer.value.array as Float32Array;
    for (let i = 0; i < this.count; i++) {
      t[i * 4] = targets.positions[i * 3];
      t[i * 4 + 1] = targets.positions[i * 3 + 1];
      t[i * 4 + 2] = targets.positions[i * 3 + 2];
    }
    this.targetBuffer.value.needsUpdate = true;
    this.writeColors(this.targetColorBuffer.value.array as Float32Array, targets.colors);
    this.targetColorBuffer.value.needsUpdate = true;
  }

  update(dt: number, time: number, params: ParticleParams) {
    this.uTime.value = time;
    this.uDt.value = dt;
    this.uStiffness.value = params.stiffness;
    this.uDamping.value = params.damping;
    this.uTurbulence.value = params.turbulence;
    this.uBurst.value = params.burst;
    this.uColorRate.value = params.colorRate;
    this.uSize.value = params.size;
    this.uOpacity.value = params.opacity;
    this.renderer.compute(this.computeNode);
  }

  setViewport() {}

  dispose() {
    this.material.dispose();
    this.object.geometry.dispose();
    this.computeNode.dispose();
  }
}
