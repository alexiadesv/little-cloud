import { languageInfo } from '../data/languages';
import { LEVELS } from '../data/levels';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { CloseIcon, SpeakerIcon } from './icons';

const nameSize = (name: string) =>
  name.length <= 9 ? 'text-4xl sm:text-5xl' : name.length <= 13 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl';

/** The word the cloud just became: English name, translation and pronunciation hint. */
export function WordCard() {
  const cardId = useGame((s) => s.cardId);
  const language = useGame((s) => s.language);
  const level = useGame((s) => LEVELS[s.levelIndex]);
  const thumb = useGame((s) => (cardId ? s.thumbs[cardId] : undefined));
  const obj = level.objects.find((o) => o.id === cardId);
  if (!obj) return null;

  const t = language === 'en' ? null : obj.translations[language];
  const lang = languageInfo(language);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[7.5rem] z-30 flex justify-center px-4 sm:bottom-[8.5rem]">
      <article
        key={obj.id}
        aria-live="polite"
        className="paper animate-float-in pointer-events-auto relative flex w-full max-w-md items-center gap-4 rounded-[2rem] p-3 pr-5"
      >
        <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-sky-pale/70 sm:size-24">
          {thumb && <img src={thumb} alt="" className="size-[88%] object-contain" draggable={false} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`display-soft leading-tight text-balance text-ink ${nameSize(obj.name)}`}>{obj.name}</h3>
          {t && (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-ink-soft">
              <span className="text-2xl font-semibold text-raspberry">{t.text}</span>
              {t.reading && <span className="text-base">{t.reading}</span>}
              {t.romanized && <span className="text-base italic">{t.romanized}</span>}
              <span className="text-xs tracking-wide uppercase opacity-70">{lang.native}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => void game.replay()}
          aria-label={`Hear "${obj.name}" again`}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-sky text-white shadow-[var(--shadow-paper)] transition hover:-translate-y-0.5 hover:bg-[#5a9fd4] active:scale-95"
        >
          <SpeakerIcon className="size-7" />
        </button>
        <button
          onClick={() => game.dismissCard()}
          aria-label="Close"
          className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full bg-white text-ink-soft shadow-[var(--shadow-paper)] transition hover:text-ink"
        >
          <CloseIcon className="size-4" />
        </button>
      </article>
    </div>
  );
}
