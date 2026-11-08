import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { game } from '../game/controller';

type Face = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
type SnapFace = 'front' | 'back' | 'left' | 'right' | 'top';

/** Classic Rubik face colours. */
const FACE_COLOR: Record<Face, string> = {
  front: '#c41e3a',
  back: '#ff5800',
  right: '#009b48',
  left: '#0051ba',
  top: '#ffffff',
  bottom: '#ffd500',
};

const SIZE = 3.25; // rem
const HALF = SIZE / 2;
const BASE_TILT = -24; // deg — matches the resting isometric lean

type Vec3 = [number, number, number];

const FACE_META: { id: Face; snap?: SnapFace; normal: Vec3; center: Vec3 }[] = [
  { id: 'front', snap: 'front', normal: [0, 0, 1], center: [0, 0, 1] },
  { id: 'back', snap: 'back', normal: [0, 0, -1], center: [0, 0, -1] },
  { id: 'right', snap: 'right', normal: [1, 0, 0], center: [1, 0, 0] },
  { id: 'left', snap: 'left', normal: [-1, 0, 0], center: [-1, 0, 0] },
  { id: 'top', snap: 'top', normal: [0, 1, 0], center: [0, 1, 0] },
  { id: 'bottom', normal: [0, -1, 0], center: [0, -1, 0] },
];

function rotY([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

function rotX([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

/** CSS `rotateX(rx) rotateY(ry)` applies Y first, then X. */
function orient(v: Vec3, rx: number, ry: number): Vec3 {
  return rotX(rotY(v, ry), rx);
}

/**
 * Pick the visible cube face under the pointer (3D-aware, not DOM hit order).
 */
function pickFace(clientX: number, clientY: number, rect: DOMRect, yaw: number, pitch: number): SnapFace | null {
  const rx = ((BASE_TILT - pitch * (180 / Math.PI)) * Math.PI) / 180;
  const ry = ((-yaw * (180 / Math.PI)) * Math.PI) / 180;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const half = Math.max(rect.width, rect.height) / 2;
  const px = (clientX - cx) / half;
  const py = -(clientY - cy) / half;

  let best: SnapFace | null = null;
  let bestScore = -Infinity;
  for (const face of FACE_META) {
    if (!face.snap) continue;
    const n = orient(face.normal, rx, ry);
    if (n[2] < 0.2) continue; // facing away from the viewer
    const c = orient(face.center, rx, ry);
    const persp = 8 / (8 + c[2]);
    const sx = c[0] * persp;
    const sy = c[1] * persp;
    const dist = Math.hypot(px - sx, py - sy);
    const score = n[2] * 1.6 - dist;
    if (score > bestScore) {
      bestScore = score;
      best = face.snap;
    }
  }
  return best;
}

function Stickers({ color }: { color: string }) {
  return (
    <div className="pointer-events-none grid h-full w-full grid-cols-3 grid-rows-3 gap-[2px] bg-ink/80 p-[2px]">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="rounded-[1px]" style={{ background: color }} />
      ))}
    </div>
  );
}

/**
 * Small Rubik-style view cube: drag to spin the apartment, click a face to snap.
 */
export function RoomViewCube() {
  const [{ yaw, pitch }, setOrbit] = useState(() => game.getRoomOrbit());
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; face: SnapFace | null } | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next = game.getRoomOrbit();
      setOrbit((prev) => (prev.yaw === next.yaw && prev.pitch === next.pitch ? prev : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = rootRef.current?.getBoundingClientRect();
    const face = rect ? pickFace(e.clientX, e.clientY, rect, yaw, pitch) : null;
    drag.current = { x: e.clientX, y: e.clientY, moved: false, face };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    d.x = e.clientX;
    d.y = e.clientY;
    // Dragging the cube spins the room the same way.
    game.nudgeRoomOrbit(dx * 0.014, dy * 0.012);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!d || d.moved) return;
    const rect = rootRef.current?.getBoundingClientRect();
    const face = (rect && pickFace(e.clientX, e.clientY, rect, yaw, pitch)) || d.face;
    if (face) game.setRoomView(face);
  };

  const faceStyle = (transform: string): CSSProperties => ({
    transform,
    width: `${SIZE}rem`,
    height: `${SIZE}rem`,
    backfaceVisibility: 'hidden',
  });

  return (
    <div className="pointer-events-auto absolute bottom-[5.75rem] left-3 z-20 sm:bottom-28 sm:left-5">
      <div
        ref={rootRef}
        className="cursor-grab touch-none active:cursor-grabbing [perspective:420px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="group"
        aria-label="Room view cube — drag to spin, tap a face to snap"
      >
        <div
          className="relative [transform-style:preserve-3d]"
          style={{
            width: `${SIZE}rem`,
            height: `${SIZE}rem`,
            transform: `rotateX(${BASE_TILT - pitch * (180 / Math.PI)}deg) rotateY(${-yaw * (180 / Math.PI)}deg)`,
          }}
        >
          {(
            [
              ['front', `translateZ(${HALF}rem)`],
              ['back', `rotateY(180deg) translateZ(${HALF}rem)`],
              ['right', `rotateY(90deg) translateZ(${HALF}rem)`],
              ['left', `rotateY(-90deg) translateZ(${HALF}rem)`],
              ['top', `rotateX(90deg) translateZ(${HALF}rem)`],
              ['bottom', `rotateX(-90deg) translateZ(${HALF}rem)`],
            ] as const
          ).map(([face, transform]) => (
            <div key={face} className="absolute inset-0 overflow-hidden rounded-[2px] shadow-sm" style={faceStyle(transform)}>
              <Stickers color={FACE_COLOR[face]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
