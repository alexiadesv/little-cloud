import { furnitureById } from '../data/furniture';
import { game } from '../game/controller';
import { useGame } from '../game/store';
import { CheckIcon, CloseIcon, RotateIcon } from './icons';

export function PlacementMenu() {
  const holdingId = useGame((s) => s.holdingId);
  const selectedId = useGame((s) => s.selectedId);
  const id = holdingId ?? selectedId;
  const item = id ? furnitureById.get(id) : null;
  if (!item) return null;

  const placing = !!holdingId;
  const wallPiece = item.kind === 'wall';
  const btn =
    'flex items-center gap-1.5 rounded-full bg-[#fbf6ec] px-3.5 py-2 text-sm font-semibold text-[#3d3a5c] shadow-[var(--shadow-paper)] transition hover:-translate-y-0.5 hover:bg-white active:scale-95';
  const primaryBtn =
    'flex items-center gap-1.5 rounded-full bg-[#3d3a5c] px-3.5 py-2 text-sm font-semibold text-[#fbf6ec] shadow-[var(--shadow-paper)] transition hover:-translate-y-0.5 hover:bg-[#4a4670] active:scale-95';

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      <p className="paper rounded-full px-4 py-1.5 text-sm text-ink shadow-[var(--shadow-lift)]">
        {placing ? 'Placing' : 'Selected'} <span className="font-semibold">{item.name}</span>
        {placing
          ? wallPiece
            ? ' — drag along the wall (up, down, or to another wall)'
            : ' — drag around the room'
          : ' — drag to move, or use the buttons'}
      </p>
      <div className="paper flex flex-wrap items-center justify-center gap-2 rounded-full px-2 py-2 shadow-[var(--shadow-lift)]">
        <button type="button" className={btn} onClick={() => game.rotateHeld()}>
          <RotateIcon className="size-4" />
          {wallPiece ? 'Other wall' : 'Rotate'}
        </button>
        {placing ? (
          <button type="button" className={primaryBtn} onClick={() => game.confirmPlace()}>
            <CheckIcon className="size-4" />
            Place
          </button>
        ) : (
          <button type="button" className={btn} onClick={() => game.startMove()}>
            Move
          </button>
        )}
        <button type="button" className={btn} onClick={() => game.putAway()}>
          <CloseIcon className="size-4" />
          Put away
        </button>
      </div>
    </div>
  );
}
