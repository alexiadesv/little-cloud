import { useMemo, type CSSProperties } from 'react';
import type { FurnitureDef } from '../data/types';

const CONFETTI_COLORS = ['#6aaee0', '#e8658f', '#f6d77a', '#a8dcc6', '#b8a8e6', '#f5bf98', '#d93a6e', '#fff7e8'];
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

type Side = (typeof SIDES)[number];

interface Piece {
  id: number;
  side: Side;
  color: string;
  w: number;
  h: number;
  along: number;
  delay: number;
  duration: number;
  tx: number;
  ty: number;
  rot: number;
  round: boolean;
}

function burst(): Piece[] {
  const pieces: Piece[] = [];
  let id = 0;
  for (const side of SIDES) {
    for (let i = 0; i < 14; i++) {
      const along = 4 + Math.random() * 92;
      const throwFar = 90 + Math.random() * 170;
      const drift = (Math.random() - 0.5) * 150;
      const tx = side === 'left' ? -throwFar : side === 'right' ? throwFar : drift;
      const ty = side === 'top' ? -throwFar : side === 'bottom' ? throwFar * 0.9 : drift * 0.75;
      pieces.push({
        id: id++,
        side,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        w: 7 + Math.random() * 9,
        h: 10 + Math.random() * 12,
        along,
        delay: Math.random() * 0.18,
        duration: 1.9 + Math.random() * 1.1,
        tx,
        ty,
        rot: (Math.random() - 0.5) * 780,
        round: Math.random() > 0.55,
      });
    }
  }
  return pieces;
}

const sideClass: Record<Side, string> = {
  top: 'top-0',
  right: 'right-0',
  bottom: 'bottom-0',
  left: 'left-0',
};

/** A 1×5 crate of unlocked furniture with confetti bursting from every side. */
export function TreasureBox({ items, thumbs }: { items: FurnitureDef[]; thumbs: Record<string, string> }) {
  const pieces = useMemo(burst, []);
  if (items.length === 0) return null;

  return (
    <div className="relative mt-5 w-[min(100%,28rem)]">
      <div className="confetti-layer pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden>
        {pieces.map((p) => (
          <span
            key={p.id}
            className={`confetti-piece absolute ${sideClass[p.side]} ${p.round ? 'rounded-full' : 'rounded-[1px]'}`}
            style={
              {
                width: p.w,
                height: p.round ? p.w : p.h,
                left: p.side === 'top' || p.side === 'bottom' ? `calc(${p.along}% - ${p.w / 2}px)` : undefined,
                top: p.side === 'left' || p.side === 'right' ? `calc(${p.along}% - ${(p.round ? p.w : p.h) / 2}px)` : undefined,
                background: p.color,
                boxShadow: '0 1px 0 rgb(255 255 255 / 0.55)',
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                '--rot': `${p.rot}deg`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <ul
        aria-label="New treasures"
        className="relative z-10 grid grid-cols-5 gap-1 rounded-[1.4rem] border-[3px] border-[#c9a07a] bg-[#f7ead0] p-1.5 shadow-[var(--shadow-lift)] sm:gap-1.5 sm:rounded-[1.65rem] sm:p-2"
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            title={item.name}
            className="animate-pop grid aspect-square place-items-center rounded-[1rem] bg-cream/90"
            style={{ animationDelay: `${0.08 + i * 0.08}s` }}
          >
            {thumbs[item.id] ? (
              <img src={thumbs[item.id]} alt={item.name} className="size-[86%] object-contain" draggable={false} />
            ) : (
              <span className="text-2xl" aria-hidden>
                {item.emoji}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
