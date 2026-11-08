import { game } from '../game/controller';
import { useGame } from '../game/store';
import { LanguagePicker } from './LanguagePicker';

export function TitleScreen() {
  const loading = useGame((s) => s.loading);
  const backend = useGame((s) => s.backend);
  const ready = !loading.active && backend !== null;
  const powered = backend === 'webgl' ? 'WebGL' : 'WebGPU';

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col">
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-paper/70 via-paper/28 to-transparent" />

      <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-visible px-5 pt-[max(7rem,20vh)] pb-4 text-center">
        <p className="text-[0.7rem] font-medium tracking-[0.32em] text-ink-soft uppercase [text-shadow:0_1px_0_#fff]">A storybook of words</p>
        <h1 className="display-soft mt-1 text-5xl leading-none text-ink italic [text-shadow:0_1px_0_#fff,0_12px_32px_rgb(246_243_236)] sm:text-6xl">
          Little <span className="text-sky">Cloud</span>
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgb(246_243_236)] sm:text-lg">
          Explore the vast outdoors and watch Little Cloud transform. You can learn new words once Little Cloud changes shape.
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink [text-shadow:0_1px_0_#fff,0_8px_22px_rgb(246_243_236)] sm:text-base">
          Tap anything you see. Little Cloud flies over, becomes its shape, and says its name. Find every word on a page to unlock five treasures — then furnish Little Cloud’s home.
        </p>

        <div className="pointer-events-auto mt-6 w-full max-w-sm">
          <p className="mb-2 text-sm font-semibold text-ink">I want to practice words in…</p>
          <LanguagePicker variant="dropdown" />
        </div>

        <div className="pointer-events-auto mt-5 flex flex-col items-center">
          <button
            onClick={() => game.start()}
            disabled={!ready}
            className="group inline-flex items-center gap-3 rounded-full bg-ink px-10 py-3.5 text-xl font-semibold text-cream shadow-[var(--shadow-lift)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4a4670] active:scale-95 disabled:cursor-wait disabled:opacity-60"
          >
            {ready ? 'Go Explore' : 'Painting the pages…'}
            <span className="inline-block transition group-hover:translate-x-1" aria-hidden>
              ✦
            </span>
          </button>
          <button
            onClick={() => void game.goToApartment()}
            disabled={!ready}
            className="mt-3 text-sm font-semibold text-ink underline decoration-dotted underline-offset-4 hover:text-raspberry disabled:opacity-50"
          >
            Visit Little Cloud’s Home
          </button>
          <button
            onClick={() => void game.restartBook()}
            className="mt-4 text-[0.7rem] tracking-wide text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
          >
            Reset the story
          </button>
        </div>

        <footer className="mt-auto w-full max-w-lg pt-8">
          <p className="text-[0.7rem] leading-relaxed text-ink-soft/90 [text-shadow:0_1px_0_#fff]">
            Inspired by the children’s book <span className="italic">Little Cloud</span> by Eric Carle.
          </p>
          <p className="mt-1 text-[0.65rem] tracking-wide text-ink-soft/70">Powered by {powered}, Cursor, and Fish Audio</p>
        </footer>
      </div>
    </div>
  );
}
