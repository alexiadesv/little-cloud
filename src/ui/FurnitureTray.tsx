import { useCallback, useEffect, useRef, useState, type WheelEvent } from 'react';
import { FURNITURE } from '../data/furniture';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { PlacementMenu } from './PlacementMenu';
import { ChevronIcon } from './icons';

/** Unlocked treasures the child can put down in the apartment. */
export function FurnitureTray() {
  const unlocked = useGame((s) => s.unlockedFurniture);
  const placed = useGame((s) => s.placedFurniture);
  const holdingId = useGame((s) => s.holdingId);
  const selectedId = useGame((s) => s.selectedId);
  const thumbs = useGame((s) => s.thumbs);
  const placedIds = new Set(placed.map((p) => p.id));
  const items = FURNITURE.filter((f) => unlocked.includes(f.id));

  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const ul = listRef.current;
    if (!ul) return;
    const left = ul.scrollLeft > 4;
    const right = ul.scrollLeft + ul.clientWidth < ul.scrollWidth - 4;
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
  }, []);

  useEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ul);
    return () => observer.disconnect();
  }, [unlocked.length, measure]);

  const page = (dir: -1 | 1) => {
    const ul = listRef.current;
    if (ul) ul.scrollBy({ left: dir * ul.clientWidth * 0.75, behavior: 'smooth' });
  };

  const onWheel = (e: WheelEvent<HTMLUListElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
  };

  const fade = `linear-gradient(to right, ${edges.left ? 'transparent, black 2rem' : 'black'}, ${edges.right ? 'black calc(100% - 2rem), transparent' : 'black'})`;
  const arrow = 'grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-lilac/70 hover:text-ink disabled:opacity-0';
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-3 sm:p-5">
      <PlacementMenu />
      <div className="paper animate-float-in pointer-events-auto flex max-w-full items-center gap-2 rounded-[2rem] py-2 pr-2 pl-4 sm:gap-3 sm:pl-5">
        <div className="shrink-0 text-center leading-tight">
          <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-ink-soft uppercase">Treasures</p>
          <p className="display-soft text-2xl text-ink">
            {placed.length}
            <span className="text-base text-ink-soft">/{items.length || 0}</span>
          </p>
        </div>
        {(edges.left || edges.right) && (
          <button onClick={() => page(-1)} disabled={!edges.left} aria-label="Earlier treasures" className={arrow}>
            <ChevronIcon className="size-5 rotate-180" />
          </button>
        )}
        {items.length === 0 ? (
          <p className="max-w-xs py-2 pr-3 text-sm leading-snug text-ink-soft">Find every word on a page to bring furniture home.</p>
        ) : (
          <ul
            ref={listRef}
            onScroll={measure}
            onWheel={onWheel}
            style={{ maskImage: fade, WebkitMaskImage: fade }}
            className="flex min-w-0 gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] sm:gap-2"
            aria-label="Furniture you can place"
          >
            {items.map((item) => {
              const isPlaced = placedIds.has(item.id);
              const active = holdingId === item.id || selectedId === item.id;
              const thumb = thumbs[item.id];
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    onClick={() => game.holdFurniture(item.id)}
                    aria-label={isPlaced ? `${item.name} — already in the room, tap to find it` : `Place ${item.name}`}
                    title={item.name}
                    aria-pressed={active}
                    className={`relative grid size-12 place-items-center rounded-2xl transition duration-200 hover:-translate-y-0.5 sm:size-14 ${
                      active ? 'bg-butter/70 ring-2 ring-butter' : isPlaced ? 'bg-white/80' : 'bg-lilac/50'
                    }`}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" draggable={false} className={`size-[85%] object-contain ${isPlaced ? 'opacity-55' : ''}`} />
                    ) : (
                      <span className="text-lg">{item.emoji}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {(edges.left || edges.right) && (
          <button onClick={() => page(1)} disabled={!edges.right} aria-label="More treasures" className={arrow}>
            <ChevronIcon className="size-5" />
          </button>
        )}
      </div>
    </footer>
  );
}
