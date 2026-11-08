import type { Brush } from './paint/brush';
import { P, mix, shade } from './paint/color';

export type RoomPainter = (b: Brush) => void;

const wallColor = () => '#ffffff';

function pane(b: Brush, x: number, y: number, w: number, h: number) {
  b.paint(b.rect(x, y, w, h, 0.01, 0.3), mix(P.skyLight, P.white, 0.35), { mottle: 0.4, light: 0.45, rim: 0.1 });
  b.line([[x + w / 2, y], [x + w / 2, y + h]], mix(P.cream, P.wood, 0.15), 0.012, { wobble: 0 });
  b.line([[x, y + h / 2], [x + w, y + h / 2]], mix(P.cream, P.wood, 0.15), 0.012, { wobble: 0 });
  b.paint(b.rect(x - 0.012, y + h - 0.02, w + 0.024, 0.04, 0.004, 0.2), mix(P.wood, P.cream, 0.35), { mottle: 0.25 });
  b.glow(x + w * 0.3, y + h * 0.3, w * 0.35, P.white, 0.32);
}

/** White back wall — no windows (the only window is on the left wall). */
export const paintBackWall: RoomPainter = (b) => {
  const wall = wallColor();
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), wall, { mottle: 0.2, light: 0.08, rim: 0 });
  b.paint(b.rect(-0.02, 0.92, 1.04, 0.1, 0, 0.4), mix(P.white, P.cream, 0.15), { mottle: 0.15, rim: 0.04 });
  b.line([[-0.02, 0.92], [1.04, 0.92]], mix(P.cream, P.sand, 0.35), 0.008, { alpha: 0.35, wobble: 0 });
};

/** Plain white side wall (right / shared). */
export const paintSideWall: RoomPainter = (b) => {
  const wall = wallColor();
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), wall, { mottle: 0.18, light: 0.06, rim: 0 });
  b.paint(b.rect(-0.02, 0.92, 1.04, 0.1, 0, 0.4), mix(P.white, P.cream, 0.15), { mottle: 0.15, rim: 0.04 });
  b.line([[-0.02, 0.92], [1.04, 0.92]], mix(P.cream, P.sand, 0.35), 0.008, { alpha: 0.35, wobble: 0 });
};

/** Left wall with the single living-room window. */
export const paintLeftWall: RoomPainter = (b) => {
  paintSideWall(b);
  pane(b, 0.28, 0.22, 0.44, 0.48);
  b.glow(0.42, 0.38, 0.22, P.butter, 0.22);
};

/** Front wall with a wide doorway so you can still look inside. */
export const paintFrontWall: RoomPainter = (b) => {
  paintSideWall(b);
  // Soft wood doorframe around the opening.
  b.paint(b.rect(0.16, 0.18, 0.68, 0.08, 0.02, 0.3), mix(P.wood, P.cream, 0.35), { mottle: 0.3, rim: 0.08 });
  b.paint(b.rect(0.16, 0.18, 0.08, 0.8, 0.02, 0.3), mix(P.wood, P.cream, 0.35), { mottle: 0.3, rim: 0.08 });
  b.paint(b.rect(0.76, 0.18, 0.08, 0.8, 0.02, 0.3), mix(P.wood, P.cream, 0.35), { mottle: 0.3, rim: 0.08 });
  // Cut the doorway out of the wall texture.
  b.ctx.save();
  b.ctx.globalCompositeOperation = 'destination-out';
  b.flat(b.rect(0.24, 0.26, 0.52, 0.76, 0.03, 0.2), '#000');
  b.ctx.restore();
};

export const paintCeiling: RoomPainter = (b) => {
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), mix(P.white, P.cream, 0.4), { mottle: 0.4, light: 0.2, rim: 0 });
  for (let x = 0.12; x < 1; x += 0.24) {
    b.line([[x, -0.02], [x, 1.04]], mix(P.cream, P.wood, 0.18), 0.016, { alpha: 0.22, wobble: 0.12 });
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
  left: paintLeftWall,
  front: paintFrontWall,
  ceiling: paintCeiling,
  door: paintDoor,
};
