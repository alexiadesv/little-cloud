import { useGame } from '../game/store';

/** Shown while a page's illustrations are being painted. */
export function LoadingVeil() {
  const loading = useGame((s) => s.loading);
  const screen = useGame((s) => s.screen);
  if (!loading.active || screen === 'title') return null;

  return (
    <div className="animate-fade-in pointer-events-none absolute inset-0 z-30 grid place-items-center">
      <div className="paper flex flex-col items-center gap-3 rounded-[2rem] px-8 py-6">
        <div className="relative h-10 w-24">
          <span className="animate-brush absolute top-1 left-1/2 block h-8 w-2.5 origin-bottom rounded-full bg-gradient-to-b from-rose via-peach to-[#c98f6b]" />
        </div>
        <p className="display-soft text-xl text-ink italic">Painting the page…</p>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-lilac/60">
          <div className="h-full rounded-full bg-gradient-to-r from-sky to-lavender transition-[width] duration-300" style={{ width: `${Math.round(loading.progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
