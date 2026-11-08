import { furnitureById, furnitureFor } from '../data/furniture';
import { LEVELS } from '../data/levels';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { ArrowIcon } from './icons';
import { TreasureBox } from './TreasureBox';

export function PageComplete() {
  const open = useGame((s) => s.pageComplete);
  const levelIndex = useGame((s) => s.levelIndex);
  const justUnlocked = useGame((s) => s.justUnlocked);
  const thumbs = useGame((s) => s.thumbs);
  if (!open) return null;

  const level = LEVELS[levelIndex];
  const next = LEVELS[levelIndex + 1];
  const ids = justUnlocked.length ? justUnlocked : furnitureFor(level.id).map((f) => f.id);
  const treasures = ids.map((id) => furnitureById.get(id)).filter((f): f is NonNullable<typeof f> => !!f);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center px-4 pt-16 pb-32">
      <h2 id="page-complete-title" className="display-soft animate-pop text-4xl text-ink italic [text-shadow:0_1px_0_#fff,0_10px_28px_rgb(246_243_236)] sm:text-5xl">
        {next ? 'Hooray!' : 'The End'}
      </h2>
      <p className="mt-2 max-w-sm text-center text-base leading-snug text-ink [text-shadow:0_1px_0_#fff,0_8px_20px_rgb(246_243_236)] sm:text-lg">
        {next
          ? `You found every word on “${level.title}”. These treasures are for Little Cloud’s home.`
          : 'You found every word in the whole book. Take the last treasures home and make the room your own!'}
      </p>
      <TreasureBox items={treasures} thumbs={thumbs} />
      <div className="pointer-events-auto mt-6 flex flex-col items-center gap-2.5">
        {next ? (
          <button
            onClick={() => void game.goToLevel(levelIndex + 1)}
            className="inline-flex items-center gap-3 rounded-full bg-ink px-8 py-3.5 text-lg font-semibold text-cream shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 active:scale-95"
          >
            Turn the page: {next.title}
            <ArrowIcon className="size-5" />
          </button>
        ) : (
          <button
            onClick={() => void game.restartBook()}
            className="rounded-full bg-ink px-8 py-3.5 text-lg font-semibold text-cream shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 active:scale-95"
          >
            Read the book again
          </button>
        )}
        <button
          onClick={() => void game.goToApartment()}
          className="text-sm font-semibold text-ink underline decoration-dotted underline-offset-4 hover:text-raspberry"
        >
          Visit Little Cloud’s Home
        </button>
        <button
          onClick={() => useGame.getState().set({ pageComplete: false })}
          className="text-sm text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
        >
          Stay on this page
        </button>
      </div>
    </div>
  );
}
