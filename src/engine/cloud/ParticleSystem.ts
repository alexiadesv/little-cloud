import type { Object3D } from 'three';
import type { ShapeTargets } from './shapes';

/** Simulation knobs shared by the WebGPU (TSL compute) and WebGL (CPU) implementations. */
export interface ParticleParams {
  /** Spring pull towards each particle's target. */
  stiffness: number;
  /** Velocity damping per second. */
  damping: number;
  /** Strength of the swirling flow field that keeps the cloud alive. */
  turbulence: number;
  /** Outward puff applied when the cloud starts a transformation. */
  burst: number;
  /** Base sprite size in world units. */
  size: number;
  /** Global opacity multiplier. */
  opacity: number;
  /** How quickly particle colors follow their targets (per second). */
  colorRate: number;
}

export interface ParticleSystem {
  readonly kind: 'gpu' | 'cpu';
  readonly count: number;
  readonly object: Object3D;
  setTargets(targets: ShapeTargets): void;
  update(dt: number, time: number, params: ParticleParams): void;
  /** Lets point-sprite implementations convert world size to pixels. */
  setViewport(heightPx: number, fovDeg: number): void;
  dispose(): void;
}

/** Per-particle random in 0..1, identical for both implementations. */
export function particleSeed(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
