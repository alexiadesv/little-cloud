import { game } from '../game/controller';
import { useGame } from '../game/store';
import { LanguagePicker } from './LanguagePicker';

export function TitleScreen() {
  const loading = useGame((s) => s.loading);
  const backend = useGame((s) => s.backend);
  const ready = !loading.active && backend !== null;
  const powered = backend === 'webgl' ? 'WebGL' : 'WebGPU';

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col lg:flex-row">
      {/* Copy + language + CTAs on the left; map fills the right. */}
      <section className="pointer-events-auto relative flex w-full flex-col justify-between gap-6 bg-gradient-to-r from-paper via-paper/95 to-paper/70 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5 sm:px-8 lg:h-full lg:w-[min(40%,26rem)] lg:max-w-sm lg:bg-gradient-to-r lg:from-paper lg:via-paper/90 lg:to-transparent lg:px-9 lg:py-8">
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-ink-soft uppercase">A storybook of words</p>
          <h1 className="display-soft mt-2 text-4xl leading-[0.95] text-ink italic sm:text-5xl lg:text-[3.35rem]">
            Little <span className="text-sky">Cloud</span>
          </h1>

          <p className="mt-5 text-sm leading-relaxed text-ink sm:text-[0.95rem]">
            Tap anything you see. Little Cloud flies over, becomes its shape, and says its name. Find every word on a page to unlock five treasures, then furnish Little Cloud’s home.
          </p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-ink">I want to practice words in…</p>
            <LanguagePicker variant="dropdown" />
          </div>

          <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:items-start">
            <button
              onClick={() => game.start()}
              disabled={!ready}
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink px-8 py-3.5 text-xl font-semibold text-cream shadow-[var(--shadow-lift)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4a4670] active:scale-95 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-12"
            >
              {ready ? 'Go Explore' : 'Painting the pages…'}
              <span className="inline-block transition group-hover:translate-x-1" aria-hidden>
                ✦
              </span>
            </button>
            <button
              onClick={() => void game.goToApartment()}
              disabled={!ready}
              className="text-sm font-semibold text-ink underline decoration-dotted underline-offset-4 hover:text-raspberry disabled:opacity-50"
            >
              Visit Little Cloud’s Home
            </button>
            <button
              onClick={() => void game.restartBook()}
              className="text-[0.7rem] tracking-wide text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
            >
              Reset the story
            </button>
          </div>
        </div>

        <footer className="hidden lg:block">
          <p className="text-[0.7rem] leading-relaxed text-ink-soft">
            Inspired by the children’s book <span className="italic">Little Cloud</span> by Eric Carle.
          </p>
          <p className="mt-1 text-[0.65rem] tracking-wide text-ink-soft/75">Powered by {powered}, Cursor, and Fish Audio</p>
        </footer>
      </section>

      {/* Map side: scene shows through. */}
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-end px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 lg:px-8 lg:pb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-paper/40 to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper/50 via-paper/20 to-transparent lg:hidden" />

        <footer className="pointer-events-none relative z-10 mt-4 text-center lg:hidden">
          <p className="text-[0.65rem] leading-relaxed text-ink-soft">
            Inspired by <span className="italic">Little Cloud</span> by Eric Carle · {powered}
          </p>
        </footer>
      </section>
    </div>
  );
}
