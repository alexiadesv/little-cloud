import { game } from '../game/controller';
import { useGame } from '../game/store';
import { FurnitureTray } from './FurnitureTray';
import { PageTabs } from './Hud';
import { CloudIcon, DoorIcon, HomeIcon, SpeakerIcon, SpeakerOffIcon } from './icons';
import { LanguagePicker } from './LanguagePicker';
import { RoomTimeSlider } from './RoomTimeSlider';
import { RoomViewCube } from './RoomViewCube';

export function ApartmentHud() {
  const muted = useGame((s) => s.muted);

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <div className="paper animate-float-in pointer-events-auto flex min-w-0 items-center gap-3 rounded-full py-1.5 pr-5 pl-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-pale">
              <CloudIcon className="w-7 text-white drop-shadow-[0_2px_3px_rgba(79,143,208,0.45)]" />
            </span>
            <h2 className="display-soft min-w-0 truncate text-lg text-ink italic sm:text-xl">Little Cloud’s Home</h2>
          </div>
          <div className="pointer-events-auto">
            <RoomTimeSlider />
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <div className="hidden sm:block">
            <PageTabs />
          </div>
          <LanguagePicker variant="menu" />
          <button onClick={() => void game.goToApartment()} aria-label="Little Cloud’s Home" aria-current="page" className="paper-button grid size-12 place-items-center bg-ink text-cream">
            <DoorIcon className="size-6" />
          </button>
          <button onClick={() => game.goHome()} aria-label="Back to menu" className="paper-button grid size-12 place-items-center text-ink">
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
      <RoomViewCube />
      <FurnitureTray />
    </>
  );
}
