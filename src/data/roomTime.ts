/** Living-room daylight presets. */
export type RoomTime = 'morning' | 'day' | 'night';

export const ROOM_TIMES: RoomTime[] = ['morning', 'day', 'night'];

export function isRoomTime(value: unknown): value is RoomTime {
  return value === 'morning' || value === 'day' || value === 'night';
}

export const ROOM_TIME_LABEL: Record<RoomTime, string> = {
  morning: 'Morning',
  day: 'Day',
  night: 'Night',
};

/** Clear-color / page wash behind the dollhouse. */
export const ROOM_BACKDROP: Record<RoomTime, string> = {
  morning: '#f6e4d4',
  day: '#efe6d6',
  night: '#1c2034',
};

export interface RoomLightPreset {
  ambient: { color: number; intensity: number };
  hemi: { sky: number; ground: number; intensity: number };
  sun: { color: number; intensity: number; position: [number, number, number] };
  window: { color: number; intensity: number };
  /** Soft fill that lights the whole interior evenly. */
  fill: { color: number; intensity: number };
}

export const ROOM_LIGHTS: Record<RoomTime, RoomLightPreset> = {
  morning: {
    ambient: { color: 0xffe2c4, intensity: 1.2 },
    hemi: { sky: 0xffd4b0, ground: 0xe8b090, intensity: 0.58 },
    sun: { color: 0xffb878, intensity: 0.75, position: [3.2, 5.2, 3.4] },
    window: { color: 0xffc090, intensity: 1.75 },
    fill: { color: 0xfff0dc, intensity: 1.05 },
  },
  day: {
    ambient: { color: 0xfff4e8, intensity: 1.25 },
    hemi: { sky: 0xfffaf2, ground: 0xc4a88a, intensity: 0.55 },
    sun: { color: 0xffe6c8, intensity: 0.7, position: [2.5, 6.5, 4.5] },
    window: { color: 0xfff2d8, intensity: 1.55 },
    fill: { color: 0xfff8ee, intensity: 1.1 },
  },
  night: {
    ambient: { color: 0x9aa6cc, intensity: 0.48 },
    hemi: { sky: 0x5c668c, ground: 0x2e2842, intensity: 0.32 },
    sun: { color: 0x7a84b0, intensity: 0.18, position: [-2.2, 4.2, 2.2] },
    window: { color: 0x6a7ec8, intensity: 0.4 },
    fill: { color: 0xffd9a8, intensity: 1.45 },
  },
};
