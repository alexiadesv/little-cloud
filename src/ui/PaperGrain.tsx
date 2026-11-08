import { useMemo } from 'react';
import { createCanvas, ctx2d } from '../art/paint/canvas';
import { mulberry32 } from '../art/paint/random';
import { useGame } from '../game/store';

/** Mid-grey pigment noise: neutral on average under soft-light, so it adds grain without dimming the page. */
function noiseTile(size: number, seed: number) {
  const canvas = createCanvas(size, size);
  const ctx = ctx2d(canvas);
  const img = ctx.createImageData(size, size);
  const rng = mulberry32(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (rng() + rng() + rng() - 1.5) * 110;
    const c = (rng() - 0.5) * 26;
    img.data[i] = v + c;
    img.data[i + 1] = v;
    img.data[i + 2] = v - c;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

const layer = 'pointer-events-none absolute inset-0 z-10';

/**
 * Pigment grain, paper fibres and a warm vignette laid over the whole page.
 * The layers must stay direct siblings of the stage: a wrapper with its own
 * stacking context would make them blend with nothing instead of the scene.
 * Softer in the apartment so the dollhouse stays bright.
 */
export function PaperGrain() {
  const screen = useGame((s) => s.screen);
  const tile = useMemo(() => noiseTile(192, 11), []);
  const soft = screen === 'apartment';
  return (
    <>
      <div
        aria-hidden
        className={`${layer} ${soft ? 'opacity-18' : 'opacity-45'} mix-blend-soft-light`}
        style={{ backgroundImage: `url(${tile})`, backgroundSize: '192px 192px' }}
      />
      <div
        aria-hidden
        className={`${layer} ${soft ? 'opacity-22' : 'opacity-60'} mix-blend-multiply`}
        style={{ backgroundImage: 'var(--grain)', backgroundSize: '220px 220px' }}
      />
      <div
        aria-hidden
        className={layer}
        style={{
          background: soft
            ? 'radial-gradient(120% 90% at 50% 45%, transparent 62%, rgb(214 204 230 / 0.14) 100%)'
            : 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgb(214 204 230 / 0.35) 100%)',
        }}
      />
    </>
  );
}
