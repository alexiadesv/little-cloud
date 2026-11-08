import { isEnglish } from '../data/languages';
import { LEVELS, translationFor } from '../data/levels';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { CloseIcon, SpeakerIcon } from './icons';

const nameSize = (name: string) =>
  name.length <= 9 ? 'text-4xl sm:text-5xl' : name.length <= 13 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl';

/** The word the cloud just became: chosen language on top, English underneath. */
export function WordCard() {
  const cardId = useGame((s) => s.cardId);
  const language = useGame((s) => s.language);
  const level = useGame((s) => LEVELS[s.levelIndex]);
  const thumb = useGame((s) => (cardId ? s.thumbs[cardId] : undefined));
  const obj = level.objects.find((o) => o.id === cardId);
  if (!obj) return null;

  const t = isEnglish(language) ? null : translationFor(obj, language);
  const spoken = t?.text ?? obj.name;

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
          {t ? (
            <>
              <h3 dir="auto" className={`display-soft leading-tight text-balance text-raspberry ${nameSize(t.text)}`}>
                {t.text}
              </h3>
              {(t.reading || t.romanized) && (
                <p className="mt-0.5 text-lg leading-snug text-ink-soft">
                  {t.reading && <span>{t.reading}</span>}
                  {t.reading && t.romanized && <span className="px-1.5 opacity-40">·</span>}
                  {t.romanized && <span className="italic">{t.romanized}</span>}
                </p>
              )}
              <p className="mt-1 text-base leading-snug text-ink-soft sm:text-lg">{obj.name}</p>
            </>
          ) : (
            <h3 className={`display-soft leading-tight text-balance text-ink ${nameSize(obj.name)}`}>{obj.name}</h3>
          )}
        </div>
        <button
          onClick={() => void game.replay()}
          aria-label={`Hear "${spoken}" again`}
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
