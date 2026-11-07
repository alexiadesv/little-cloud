import { game } from '../game/controller';
import { useGame } from '../game/store';
import { CloudIcon } from './icons';
import { LanguagePicker } from './LanguagePicker';

export function TitleScreen() {
  const loading = useGame((s) => s.loading);
  const backend = useGame((s) => s.backend);
  const found = useGame((s) => Object.values(s.discovered).reduce((n, l) => n + l.length, 0));
  const ready = !loading.active && backend !== null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-paper/45 p-4 backdrop-blur-[3px]">
      <section className="paper animate-float-in relative w-full max-w-xl rounded-[2.5rem] px-6 pt-14 pb-8 text-center sm:px-12">
        <CloudIcon className="animate-bob absolute -top-10 left-1/2 w-28 -translate-x-1/2 text-white drop-shadow-[0_10px_18px_rgba(106,95,168,0.35)]" />
        <p className="text-sm font-medium tracking-[0.3em] text-ink-soft uppercase">A storybook of words</p>
        <h1 className="display-soft mt-2 text-6xl leading-none text-ink italic sm:text-7xl">
          Little <span className="text-sky">Cloud</span>
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-lg leading-relaxed text-ink-soft">
          Tap anything you see, and Little Cloud will change into its shape and say its name.
        </p>

        <div className="mt-7">
          <p className="mb-3 text-sm font-semibold text-ink-soft">I want to learn words in…</p>
          <LanguagePicker variant="chips" />
        </div>

        <button
          onClick={() => game.start()}
          disabled={!ready}
          className="group mt-9 inline-flex items-center gap-3 rounded-full bg-ink px-9 py-4 text-xl font-semibold text-cream shadow-[var(--shadow-lift)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4a4670] active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          {ready ? (found > 0 ? 'Keep reading' : 'Open the book') : 'Painting the pages…'}
          <span className="inline-block transition group-hover:translate-x-1" aria-hidden>
            ✦
          </span>
        </button>

        {backend && (
          <p className="mt-6 text-xs text-ink-soft/80">
            Painted live with {backend === 'webgpu' ? 'WebGPU' : 'WebGL'}
            {found > 0 && (
              <>
                {' · '}
                <button className="underline decoration-dotted underline-offset-4 hover:text-ink" onClick={() => void game.restartBook()}>
                  start the book again
                </button>
              </>
            )}
          </p>
        )}
      </section>
    </div>
  );
}
