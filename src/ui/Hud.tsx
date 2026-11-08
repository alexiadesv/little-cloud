import { LEVELS } from '../data/levels';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { DiscoveryTray } from './DiscoveryTray';
import { CloudIcon, DoorIcon, HomeIcon, SpeakerIcon, SpeakerOffIcon } from './icons';
import { LanguagePicker } from './LanguagePicker';

export function PageTabs() {
  const levelIndex = useGame((s) => s.levelIndex);
  const discovered = useGame((s) => s.discovered);

  return (
    <nav aria-label="Pages" className="paper flex items-center gap-1 rounded-full p-1">
      {LEVELS.map((level, i) => {
        const active = i === levelIndex;
        const complete = (discovered[level.id]?.length ?? 0) === level.objects.length;
        return (
          <button
            key={level.id}
            aria-current={active ? 'page' : undefined}
            aria-label={`Page ${i + 1}: ${level.title}`}
            title={level.title}
            onClick={() => void game.goToLevel(i)}
            className={`relative grid size-10 place-items-center rounded-full text-base font-semibold transition duration-200 ${
              active ? 'bg-ink text-cream' : 'text-ink-soft hover:bg-lilac/70 hover:text-ink'
            }`}
          >
            {i + 1}
            {complete && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-cream bg-butter" />}
          </button>
        );
      })}
    </nav>
  );
}

export function Hud() {
  const level = useGame((s) => LEVELS[s.levelIndex]);
  const muted = useGame((s) => s.muted);
  const pageComplete = useGame((s) => s.pageComplete);

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="paper animate-float-in pointer-events-auto flex min-w-0 items-center gap-3 rounded-full py-1.5 pr-5 pl-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-pale">
            <CloudIcon className="w-7 text-white drop-shadow-[0_2px_3px_rgba(79,143,208,0.45)]" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-ink-soft uppercase">Page {level.number}</p>
            <h2 className="display-soft truncate text-lg text-ink italic sm:text-xl">{level.title}</h2>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <PageTabs />
          </div>
          <LanguagePicker variant="menu" />
          <button
            onClick={() => void game.goToApartment()}
            aria-label="Little Cloud’s Home"
            className="paper-button grid size-12 place-items-center text-ink"
          >
            <DoorIcon className="size-6 text-ink-soft" />
          </button>
          <button
            onClick={() => game.goHome()}
            aria-label="Back to menu"
            className="paper-button grid size-12 place-items-center text-ink"
          >
            <HomeIcon className="size-6 text-ink-soft" />
          </button>
          <button
            onClick={() => game.setMuted(!muted)}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            aria-pressed={!muted}
            className="paper-button grid size-12 place-items-center text-ink"
          >
            {muted ? <SpeakerOffIcon className="size-6 text-ink-soft" /> : <SpeakerIcon className="size-6 text-sky" />}
          </button>
        </div>
      </header>
      <div className="pointer-events-auto absolute top-[4.6rem] right-3 z-20 sm:hidden">
        <PageTabs />
      </div>
      {!pageComplete && <DiscoveryTray />}
    </>
  );
}
