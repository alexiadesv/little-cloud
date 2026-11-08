import { useMemo } from 'react';
import { loadingBrushArt } from '../art/assets';
import { useGame } from '../game/store';

/** Shown while a page's illustrations are being painted. */
export function LoadingVeil() {
  const loading = useGame((s) => s.loading);
  const screen = useGame((s) => s.screen);
  const brushSrc = useMemo(() => loadingBrushArt().canvas.toDataURL('image/png'), []);
  if (!loading.active || screen === 'title') return null;
  const label = screen === 'apartment' ? 'Painting your room…' : 'Painting the page…';

  return (
    <div className="animate-fade-in pointer-events-none absolute inset-0 z-30 grid place-items-center">
      <div className="paper flex flex-col items-center gap-3 rounded-[2rem] px-8 py-6">
        <div className="relative grid h-14 w-36 place-items-center">
          <img
            src={brushSrc}
            alt=""
            aria-hidden
            className="animate-brush h-12 w-auto origin-center select-none drop-shadow-[0_8px_16px_rgb(61_58_92_/_0.25)]"
            draggable={false}
          />
        </div>
        <p className="display-soft text-xl text-ink italic">{label}</p>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-lilac/60">
          <div className="h-full rounded-full bg-gradient-to-r from-sky to-lavender transition-[width] duration-300" style={{ width: `${Math.round(loading.progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
