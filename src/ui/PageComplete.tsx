import { LEVELS } from '../data/levels';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { ArrowIcon, StarIcon } from './icons';

export function PageComplete() {
  const open = useGame((s) => s.pageComplete);
  const levelIndex = useGame((s) => s.levelIndex);
  if (!open) return null;

  const level = LEVELS[levelIndex];
  const next = LEVELS[levelIndex + 1];

  return (
    <div className="animate-fade-in absolute inset-0 z-40 grid place-items-center bg-paper/30 p-4 backdrop-blur-[2px]">
      <section role="dialog" aria-labelledby="page-complete-title" className="paper animate-float-in w-full max-w-md rounded-[2.5rem] px-8 py-9 text-center">
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <StarIcon
              key={i}
              className={`animate-pop size-12 text-butter drop-shadow-[0_4px_6px_rgba(214,170,60,0.45)] ${i === 1 ? '-mt-2.5' : ''}`}
              style={{ animationDelay: `${0.15 + i * 0.15}s` }}
            />
          ))}
        </div>
        <h2 id="page-complete-title" className="display-soft mt-4 text-4xl text-ink italic">
          {next ? 'Hooray!' : 'The End'}
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-ink-soft">
          {next
            ? `You found all ${level.objects.length} words on “${level.title}”.`
            : 'You found every word in the whole book. Little Cloud is so proud of you!'}
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          {next ? (
            <button
              onClick={() => void game.goToLevel(levelIndex + 1)}
              className="inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-lg font-semibold text-cream shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 active:scale-95"
            >
              Turn the page: {next.title}
              <ArrowIcon className="size-5" />
            </button>
          ) : (
            <button
              onClick={() => void game.restartBook()}
              className="rounded-full bg-ink px-8 py-4 text-lg font-semibold text-cream shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 active:scale-95"
            >
              Read the book again
            </button>
          )}
          <button onClick={() => useGame.getState().set({ pageComplete: false })} className="text-sm text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink">
            Stay on this page
          </button>
        </div>
      </section>
    </div>
  );
}
