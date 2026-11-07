import { LEVELS } from '../data/levels';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { StarIcon } from './icons';

/** Pages with this many words get a two-row tray. */
export const isCrowded = (words: number) => words > 16;

/** The row of words on this page: shadows until found, full colour afterwards. */
export function DiscoveryTray() {
  const level = useGame((s) => LEVELS[s.levelIndex]);
  const found = useGame((s) => s.discovered[level.id]) ?? [];
  const thumbs = useGame((s) => s.thumbs);
  const cardId = useGame((s) => s.cardId);
  const total = level.objects.length;
  const twoRows = isCrowded(total);

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:p-5">
      <div className="paper animate-float-in pointer-events-auto flex max-w-full items-center gap-3 rounded-[2rem] py-2 pr-2 pl-4 sm:gap-4 sm:pl-5">
        <div className="shrink-0 text-center leading-tight">
          <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-ink-soft uppercase">Found</p>
          <p className="display-soft text-2xl text-ink">
            {found.length}
            <span className="text-base text-ink-soft">/{total}</span>
          </p>
        </div>
        <ul
          className={`min-w-0 gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] ${twoRows ? 'grid grid-flow-col grid-rows-2' : 'flex sm:gap-2'}`}
          aria-label="Words on this page"
        >
          {level.objects.map((obj) => {
            const isFound = found.includes(obj.id);
            const active = cardId === obj.id;
            const thumb = thumbs[obj.id];
            return (
              <li key={obj.id} className="shrink-0">
                <button
                  onClick={() => game.trayTap(obj.id)}
                  aria-label={isFound ? `${obj.name} — hear it again` : 'A word still hiding on the page — tap for a hint'}
                  title={isFound ? obj.name : 'Still hiding! Tap for a hint'}
                  className={`relative grid place-items-center rounded-2xl transition duration-200 hover:-translate-y-0.5 ${twoRows ? 'size-11 sm:size-12' : 'size-12 sm:size-14'} ${
                    active ? 'bg-butter/70 ring-2 ring-butter' : isFound ? 'bg-white/80' : 'bg-lilac/50'
                  }`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      draggable={false}
                      className={`size-[85%] object-contain transition duration-500 ${isFound ? 'animate-pop' : 'opacity-25 brightness-0'}`}
                    />
                  ) : (
                    <span className="size-6 rounded-full bg-lavender/40" />
                  )}
                  {isFound && <StarIcon className="absolute -top-1 -right-1 size-4 text-butter drop-shadow-[0_1px_1px_rgba(61,58,92,0.4)]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
