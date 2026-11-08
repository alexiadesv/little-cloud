import type { Brush } from './paint/brush';
import { P, mix, shade } from './paint/color';

export type RoomPainter = (b: Brush) => void;

const wallColor = () => mix(P.cream, P.peach, 0.16);

function pane(b: Brush, x: number, y: number, w: number, h: number) {
  b.paint(b.rect(x, y, w, h, 0.01, 0.3), mix(P.skyLight, P.white, 0.25), { mottle: 0.45, light: 0.4, rim: 0.12 });
  b.line([[x + w / 2, y], [x + w / 2, y + h]], mix(P.cream, P.wood, 0.2), 0.012, { wobble: 0 });
  b.line([[x, y + h / 2], [x + w, y + h / 2]], mix(P.cream, P.wood, 0.2), 0.012, { wobble: 0 });
  b.paint(b.rect(x - 0.012, y + h - 0.02, w + 0.024, 0.04, 0.004, 0.2), P.wood, { mottle: 0.3 });
  b.glow(x + w * 0.3, y + h * 0.3, w * 0.35, P.white, 0.28);
}

/** Cream back wall with two windows looking out. */
export const paintBackWall: RoomPainter = (b) => {
  const wall = wallColor();
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), wall, { mottle: 0.85, light: 0.12, rim: 0 });
  pane(b, 0.14, 0.18, 0.28, 0.42);
  pane(b, 0.58, 0.18, 0.28, 0.42);
  b.paint(b.rect(-0.02, 0.9, 1.04, 0.12, 0, 0.4), mix(P.wood, P.cream, 0.35), { mottle: 0.4, rim: 0.08 });
  b.line([[-0.02, 0.9], [1.04, 0.9]], shade(P.wood, -0.1), 0.01, { alpha: 0.7, wobble: 0 });
  b.glow(0.28, 0.32, 0.2, P.butter, 0.16);
  b.glow(0.72, 0.32, 0.18, P.butter, 0.12);
};

/** Side walls: plaster and a skirting board. */
export const paintSideWall: RoomPainter = (b) => {
  const wall = wallColor();
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), wall, { mottle: 0.8, light: 0.1, rim: 0 });
  b.paint(b.rect(-0.02, 0.9, 1.04, 0.12, 0, 0.4), mix(P.wood, P.cream, 0.35), { mottle: 0.4, rim: 0.08 });
  b.line([[-0.02, 0.9], [1.04, 0.9]], shade(P.wood, -0.1), 0.01, { alpha: 0.7, wobble: 0 });
  b.paint(b.rect(0.42, 0.08, 0.18, 0.08, 0.02, 0.3), mix(P.blush, P.cream, 0.4), { mottle: 0.4, rim: 0.1, alpha: 0.7 });
};

export const paintCeiling: RoomPainter = (b) => {
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), mix(P.cream, P.white, 0.35), { mottle: 0.55, light: 0.15, rim: 0 });
  for (let x = 0.12; x < 1; x += 0.24) {
    b.line([[x, -0.02], [x, 1.04]], mix(P.cream, P.wood, 0.25), 0.018, { alpha: 0.35, wobble: 0.15 });
  }
};

/** Upright wooden door with a round window. */
export const paintDoor: RoomPainter = (b) => {
  b.paint(b.rect(0.04, 0.02, 0.92, 0.96, 0.04, 0.25), P.wood, { mottle: 0.55, light: 0.22, rim: 0.12 });
  b.paint(b.rect(0.14, 0.12, 0.72, 0.38, 0.03, 0.25), shade(P.wood, -0.08), { mottle: 0.4, rim: 0.1 });
  b.paint(b.rect(0.14, 0.56, 0.72, 0.34, 0.03, 0.25), shade(P.wood, -0.05), { mottle: 0.4, rim: 0.1 });
  b.paint(b.ellipse(0.5, 0.3, 0.2, 0.16, 0.3), mix(P.skyLight, P.butter, 0.25), { mottle: 0.4, light: 0.4, rim: 0.12 });
  b.glow(0.44, 0.26, 0.1, P.white, 0.4);
  b.flat(b.circle(0.78, 0.58, 0.045, 0), P.gold);
  b.glow(0.76, 0.56, 0.04, P.white, 0.5);
};

export const ROOM_PAINTERS = {
  back: paintBackWall,
  side: paintSideWall,
  ceiling: paintCeiling,
  door: paintDoor,
};
