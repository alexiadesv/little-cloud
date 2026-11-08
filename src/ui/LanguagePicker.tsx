import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, languageInfo } from '../data/languages';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { ChevronIcon, GlobeIcon } from './icons';

/** Compact HUD chip, or a full-width title-page dropdown. */
export function LanguagePicker({ variant }: { variant: 'menu' | 'dropdown' }) {
  const language = useGame((s) => s.language);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = languageInfo(language);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  const englishFirst = variant === 'dropdown';
  const list = (
    <ul
      role="listbox"
      aria-label="Language to practice"
      className={`absolute z-30 max-h-64 w-64 overflow-y-auto overscroll-contain rounded-3xl p-2 ${
        englishFirst
          ? 'top-[calc(100%+0.5rem)] left-0 w-full border border-ink/10 bg-white shadow-[0_16px_40px_-18px_rgb(61_58_92_/_0.45)]'
          : 'paper top-14 right-0'
      }`}
    >
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
            <span className="font-semibold">{englishFirst ? l.label : l.native}</span>
            {l.native !== l.label && <span className="text-xs opacity-70">{englishFirst ? l.native : l.label}</span>}
          </button>
        </li>
      ))}
    </ul>
  );

  if (variant === 'dropdown') {
    return (
      <div ref={ref} className="relative w-full">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-12 w-full items-center justify-between gap-3 rounded-full border-2 border-ink/15 bg-white px-5 text-left text-ink shadow-[0_8px_24px_-16px_rgb(61_58_92_/_0.45)] transition hover:border-ink/30"
        >
          <span className="flex min-w-0 items-center gap-3">
            <GlobeIcon className="size-5 shrink-0 text-sky" />
            <span className="truncate font-semibold">{current.label}</span>
          </span>
          <ChevronIcon className={`size-4 shrink-0 text-ink-soft transition ${open ? '-rotate-90' : 'rotate-90'}`} />
        </button>
        {open && list}
      </div>
    );
  }

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
        <span className="max-w-[7rem] truncate font-semibold">{current.native}</span>
      </button>
      {open && list}
    </div>
  );
}
