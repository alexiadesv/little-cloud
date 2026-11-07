import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, languageInfo } from '../data/languages';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { GlobeIcon } from './icons';

/** Inline chips (title page) or a compact dropdown (HUD). */
export function LanguagePicker({ variant }: { variant: 'chips' | 'menu' }) {
  const language = useGame((s) => s.language);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  if (variant === 'chips') {
    return (
      <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Language to learn">
        {LANGUAGES.map((l) => {
          const active = l.code === language;
          return (
            <button
              key={l.code}
              role="radio"
              aria-checked={active}
              onClick={() => game.setLanguage(l.code)}
              className={`rounded-full px-4 py-2 text-base font-medium transition duration-200 ${
                active ? 'bg-ink text-cream shadow-[var(--shadow-paper)]' : 'paper-button text-ink-soft hover:text-ink'
              }`}
            >
              {l.native}
            </button>
          );
        })}
      </div>
    );
  }

  const current = languageInfo(language);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="paper-button flex h-12 items-center gap-2 pr-4 pl-3 text-ink"
      >
        <GlobeIcon className="size-5 text-sky" />
        <span className="hidden text-sm text-ink-soft sm:inline">Learning</span>
        <span className="font-semibold">{current.native}</span>
      </button>
      {open && (
        <ul role="listbox" aria-label="Language to learn" className="paper animate-float-in absolute top-14 right-0 z-30 w-48 rounded-3xl p-2">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === language}
                onClick={() => {
                  game.setLanguage(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left transition ${
                  l.code === language ? 'bg-sky-pale text-ink' : 'text-ink-soft hover:bg-lilac/60 hover:text-ink'
                }`}
              >
                <span className="font-semibold">{l.native}</span>
                <span className="text-xs opacity-70">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
