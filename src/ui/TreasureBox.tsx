import { useMemo, type CSSProperties } from 'react';
import type { FurnitureDef } from '../data/types';

const CONFETTI_COLORS = ['#6aaee0', '#e8658f', '#f6d77a', '#a8dcc6', '#b8a8e6', '#f5bf98', '#d93a6e', '#fff7e8', '#ff8fb3', '#7ad1c4'];

interface Piece {
  id: number;
  color: string;
  w: number;
  h: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  tx: number;
  ty: number;
  rot: number;
  round: boolean;
}

function burst(seed: string): Piece[] {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 0xffffffff;
  };
  const pieces: Piece[] = [];
  for (let i = 0; i < 72; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 120 + rand() * 220;
    pieces.push({
      id: i,
      color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      w: 8 + rand() * 10,
      h: 11 + rand() * 14,
      left: 35 + rand() * 30,
      top: 42 + rand() * 20,
      delay: rand() * 0.25,
      duration: 1.6 + rand() * 1.4,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist * 0.85 - 40,
      rot: (rand() - 0.5) * 900,
      round: rand() > 0.55,
    });
  }
  return pieces;
}

/** A 1×5 crate of unlocked furniture with fullscreen confetti. */
export function TreasureBox({ items, thumbs }: { items: FurnitureDef[]; thumbs: Record<string, string> }) {
  const seed = items.map((i) => i.id).join('|');
  const pieces = useMemo(() => burst(seed || 'treasures'), [seed]);
  if (items.length === 0) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
        {pieces.map((p) => (
          <span
            key={p.id}
            className={`confetti-piece absolute ${p.round ? 'rounded-full' : 'rounded-[1px]'}`}
            style={
              {
                width: p.w,
                height: p.round ? p.w : p.h,
                left: `${p.left}%`,
                top: `${p.top}%`,
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

      <div className="relative z-10 mt-5 w-[min(100%,28rem)]">
        <ul
          aria-label="New treasures"
          className="grid grid-cols-5 gap-1 rounded-[1.4rem] border-[3px] border-[#c9a07a] bg-[#f7ead0] p-1.5 shadow-[var(--shadow-lift)] sm:gap-1.5 sm:rounded-[1.65rem] sm:p-2"
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
    </>
  );
}
