import * as THREE from 'three';
import type { ParticleSystem } from './cloud/ParticleSystem';
import type { ShapeTargets } from './cloud/shapes';
import { CpuParticles } from './cloud/CpuParticles';

export type Backend = 'webgpu' | 'webgl';

/** The bits of a renderer the engine needs, identical for both backends. */
export interface RendererHandle {
  readonly backend: Backend;
  readonly domElement: HTMLCanvasElement;
  readonly maxAnisotropy: number;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  setSize(width: number, height: number, pixelRatio: number): void;
  setClearColor(color: THREE.Color): void;
  setAnimationLoop(callback: ((time: number) => void) | null): void;
  createParticles(count: number, initial: ShapeTargets): ParticleSystem;
  /** Particle budget that keeps this backend at a smooth frame rate. */
  readonly particleCount: number;
  dispose(): void;
}

export interface RendererOptions {
  container: HTMLElement;
  clearColor: string;
  forceWebGL?: boolean;
}

interface CanvasOptions extends RendererOptions {
  canvas: HTMLCanvasElement;
}

function mountCanvas(container: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.className = 'block h-full w-full touch-none select-none outline-none';
  container.appendChild(canvas);
  return canvas;
}

interface GPULike {
  requestAdapter(options?: { powerPreference?: string }): Promise<unknown | null>;
}

export async function hasWebGPU(): Promise<boolean> {
  const gpu = (navigator as Navigator & { gpu?: GPULike }).gpu;
  if (!gpu) return false;
  try {
    return (await gpu.requestAdapter({ powerPreference: 'high-performance' })) !== null;
  } catch {
    return false;
  }
}

function isSmallDevice() {
  return Math.min(window.screen.width, window.screen.height) < 700 || (navigator.hardwareConcurrency ?? 8) <= 4;
}

async function createWebGPU(opts: CanvasOptions): Promise<RendererHandle | null> {
  const [{ WebGPURenderer }, { GpuParticles }] = await Promise.all([
    import('three/webgpu'),
    import('./cloud/GpuParticles'),
  ]);
  const renderer = new WebGPURenderer({ canvas: opts.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  await renderer.init();
  // WebGPURenderer silently switches to its own WebGL2 backend when WebGPU fails;
  // in that case use the dedicated WebGL path instead.
  if (!(renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend) {
    renderer.dispose();
    return null;
  }
  renderer.setClearColor(new THREE.Color(opts.clearColor), 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  return {
    backend: 'webgpu',
    domElement: renderer.domElement,
    maxAnisotropy: renderer.getMaxAnisotropy(),
    particleCount: isSmallDevice() ? 9000 : 16000,
    render: (scene, camera) => renderer.render(scene, camera),
    setSize: (w, h, dpr) => {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
    },
    setClearColor: (color) => renderer.setClearColor(color, 1),
    setAnimationLoop: (cb) => void renderer.setAnimationLoop(cb),
    createParticles: (count, initial) => new GpuParticles(renderer, count, initial),
    dispose: () => {
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function createWebGL(opts: CanvasOptions): RendererHandle {
  const renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(new THREE.Color(opts.clearColor), 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  return {
    backend: 'webgl',
    domElement: renderer.domElement,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    particleCount: isSmallDevice() ? 3500 : 6000,
    render: (scene, camera) => renderer.render(scene, camera),
    setSize: (w, h, dpr) => {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
    },
    setClearColor: (color) => renderer.setClearColor(color, 1),
    setAnimationLoop: (cb) => renderer.setAnimationLoop(cb),
    createParticles: (count, initial) => new CpuParticles(count, initial),
    dispose: () => {
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/** Creates a canvas inside `container` and the best renderer this browser supports. */
export async function createRenderer(opts: RendererOptions): Promise<RendererHandle> {
  if (!opts.forceWebGL && (await hasWebGPU())) {
    const canvas = mountCanvas(opts.container);
    try {
      const handle = await createWebGPU({ ...opts, canvas });
      if (handle) return handle;
    } catch (err) {
      console.warn('[renderer] WebGPU initialisation failed, falling back to WebGL.', err);
    }
    // A canvas keeps whichever context type it handed out first, so start fresh.
    canvas.remove();
  }
  return createWebGL({ ...opts, canvas: mountCanvas(opts.container) });
}
