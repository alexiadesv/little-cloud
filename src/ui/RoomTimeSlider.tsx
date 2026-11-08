import { useMemo } from 'react';
import { roomTimeIconUrl } from '../art/assets';
import { ROOM_TIME_LABEL, ROOM_TIMES, type RoomTime } from '../data/roomTime';
import { game } from '../game/controller';
import { useGame } from '../game/store';

/** Whole control wash for the selected time of day. */
const SHELL: Record<RoomTime, string> = {
  morning: 'bg-[#f4a07a]/92 ring-[#e07850]/35',
  day: 'bg-[#f6d77a]/92 ring-[#e8b84a]/35',
  night: 'bg-[#8f9ad4]/92 ring-[#5c68a8]/40',
};

/** Painted morning / day / night picker — symbols only, no chip circles. */
export function RoomTimeSlider() {
  const roomTime = useGame((s) => s.roomTime);
  const icons = useMemo(
    () =>
      ({
        morning: roomTimeIconUrl('time-morning'),
        day: roomTimeIconUrl('time-day'),
        night: roomTimeIconUrl('time-night'),
      }) satisfies Record<RoomTime, string>,
    [],
  );

  return (
    <div
      className={`animate-float-in flex items-center gap-0.5 rounded-full px-2 py-1 shadow-[var(--shadow-paper)] ring-2 transition-colors duration-300 ${SHELL[roomTime]}`}
      role="group"
      aria-label="Time of day"
    >
      {ROOM_TIMES.map((mode) => {
        const on = roomTime === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => game.setRoomTime(mode)}
            aria-label={ROOM_TIME_LABEL[mode]}
            aria-pressed={on}
            title={ROOM_TIME_LABEL[mode]}
            className={`grid size-10 place-items-center transition active:scale-95 ${
              on ? 'scale-110 opacity-100' : 'opacity-55 hover:opacity-90'
            }`}
          >
            <img src={icons[mode]} alt="" aria-hidden draggable={false} className="h-8 w-8 select-none object-contain" />
          </button>
        );
      })}
    </div>
  );
}
