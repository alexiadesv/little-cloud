import type { Brush } from './paint/brush';
import { P, mix, rgba, shade } from './paint/color';
import { range } from './paint/random';

export type MapPainter = (b: Brush) => void;

/** Big airbrushed patches of light and shade, like the reference painting's sky. */
function atmosphere(b: Brush, tints: string[], count = 14, alpha = 0.22) {
  for (let i = 0; i < count; i++) {
    b.glow(b.rng(), b.rng(), range(b.rng, 0.12, 0.32), tints[i % tints.length], alpha * range(b.rng, 0.5, 1));
  }
}

function crosswalkBars(b: Brush, bars: [number, number, number, number][]) {
  for (const [x, y, w, h] of bars) b.paint(b.rect(x, y, w, h, 0.004, 0.8), P.cream, { mottle: 0.3, shadow: 0.1, rim: 0.05, alpha: 0.88 });
}

const nyc: MapPainter = (b) => {
  const walkBack = P.lilac;
  const walkFront = '#efc6c8';
  const road = P.sky;

  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), walkBack, { mottle: 1.2, shadow: 0.05, light: 0.05, rim: 0 });

  // Construction zone (back-left) and building shadow line.
  const zone = b.rect(-0.02, -0.02, 0.29, 0.21, 0.01, 2);
  b.paint(zone, P.peach, { mottle: 1.4, rim: 0.15 });
  b.speckle(zone, P.apricot, 260, 0.004, 0.5);
  b.speckle(zone, P.woodDeep, 120, 0.003, 0.3);
  b.paint(b.rect(-0.02, -0.02, 1.04, 0.05, 0, 2), P.lavenderDeep, { mottle: 0.6, alpha: 0.35, rim: 0 });

  // Avenue.
  const avenue = b.rect(-0.02, 0.19, 1.04, 0.32, 0.0, 1.2);
  b.paint(avenue, road, { mottle: 1.5, shadow: 0.12, light: 0.1, rim: 0.12 });
  for (let x = 0.02; x < 1; x += 0.08) b.paint(b.rect(x, 0.346, 0.045, 0.01, 0.004, 0.5), P.butter, { mottle: 0.2, rim: 0, alpha: 0.85 });
  crosswalkBars(b, Array.from({ length: 7 }, (_, i) => [0.29, 0.205 + i * 0.043, 0.12, 0.022] as [number, number, number, number]));
  b.paint(b.ellipse(0.82, 0.43, 0.025, 0.012), shade(road, -0.25), { mottle: 0.3, rim: 0.1, alpha: 0.7 });
  b.paint(b.ellipse(0.12, 0.26, 0.025, 0.012), shade(road, -0.25), { mottle: 0.3, rim: 0.1, alpha: 0.7 });

  // Front sidewalk, then the cross street running to the front edge.
  b.paint(b.rect(-0.02, 0.51, 1.04, 0.17, 0, 1.2), walkFront, { mottle: 1.2, rim: 0.1 });
  b.paint(b.rect(0.42, 0.5, 0.22, 0.52, 0.0, 1.2), road, { mottle: 1.5, shadow: 0.1, rim: 0.12 });
  crosswalkBars(b, Array.from({ length: 5 }, (_, i) => [0.445 + i * 0.04, 0.53, 0.022, 0.12] as [number, number, number, number]));
  for (let y = 0.72; y < 1; y += 0.08) b.paint(b.rect(0.527, y, 0.01, 0.045, 0.004, 0.5), P.butter, { mottle: 0.2, rim: 0, alpha: 0.85 });

  // Curbs.
  for (const y of [0.19, 0.51]) b.line([[-0.02, y], [1.02, y]], P.white, 0.007, { alpha: 0.75 });
  b.line([[0.42, 0.51], [0.42, 1.02]], P.white, 0.007, { alpha: 0.75 });
  b.line([[0.64, 0.51], [0.64, 1.02]], P.white, 0.007, { alpha: 0.75 });

  // Plaza with pavers (front-left).
  const plaza = b.rect(-0.02, 0.68, 0.44, 0.34, 0.01, 1.5);
  b.paint(plaza, '#f3e3c9', { mottle: 1.2, rim: 0.12 });
  b.ctx.save();
  b.ctx.clip(plaza.path);
  for (let y = 0.7; y < 1; y += 0.045) b.line([[-0.02, y], [0.44, y]], P.sandDeep, 0.002, { alpha: 0.45 });
  for (let x = 0.0; x < 0.44; x += 0.06) b.line([[x, 0.68], [x, 1.02]], P.sandDeep, 0.002, { alpha: 0.35 });
  b.ctx.restore();
  b.paint(b.ellipse(0.2, 0.92, 0.07, 0.03, 1), shade('#f3e3c9', -0.12), { mottle: 0.6, rim: 0, alpha: 0.7 });

  // Pocket park (front-right).
  const park = b.rect(0.64, 0.68, 0.38, 0.34, 0.02, 2);
  b.paint(park, P.mint, { mottle: 1.6, rim: 0.15 });
  b.line([[0.64, 0.98], [0.75, 0.86], [0.88, 0.82], [1.02, 0.7]], P.cream, 0.035, { alpha: 0.9, wobble: 1.5 });
  for (const [x, y, r] of [[0.71, 0.74, 0.04], [0.95, 0.94, 0.05], [0.93, 0.76, 0.03], [0.7, 0.93, 0.03]] as [number, number, number][]) {
    b.paint(b.circle(x, y, r, 1.6), P.leaf, { mottle: 1.2, rim: 0.2 });
  }
  b.speckle(park, P.pink, 70, 0.004, 0.7);
  b.speckle(park, P.butter, 50, 0.004, 0.7);

  // A few sidewalk cracks.
  for (let x = 0.3; x < 1; x += 0.1) b.line([[x, 0.05], [x, 0.18]], shade(walkBack, -0.15), 0.002, { alpha: 0.5 });
  for (let x = 0.05; x < 1; x += 0.1) if (x < 0.42 || x > 0.64) b.line([[x, 0.52], [x, 0.67]], shade(walkFront, -0.15), 0.002, { alpha: 0.5 });

  atmosphere(b, [P.white, P.skyPale, P.lavender, P.pink], 16, 0.2);
};

const market: MapPainter = (b) => {
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), mix(P.dusk, P.night, 0.35), { mottle: 1.5, shadow: 0.05, light: 0.05, rim: 0 });

  // Lantern-lit terrace in front of the restaurants.
  const terrace = b.rect(-0.02, -0.02, 1.04, 0.14, 0, 1.5);
  b.paint(terrace, '#d58a86', { mottle: 1.2, rim: 0.1 });
  b.ctx.save();
  b.ctx.clip(terrace.path);
  for (let x = 0; x < 1; x += 0.05) b.line([[x, -0.02], [x, 0.12]], shade('#d58a86', -0.2), 0.002, { alpha: 0.4 });
  b.ctx.restore();
  for (const u of [0.18, 0.54, 0.86]) b.glow(u, 0.09, 0.15, P.apricot, 0.55);

  // Back lane, where the tuk-tuk waits.
  const lane = b.rect(-0.02, 0.12, 1.04, 0.17, 0, 1.2);
  b.paint(lane, P.night, { mottle: 1.2, light: 0.1, rim: 0.1 });
  for (let x = 0.02; x < 1; x += 0.09) b.paint(b.rect(x, 0.2, 0.045, 0.01, 0.004, 0.5), P.butter, { mottle: 0.2, rim: 0, alpha: 0.8 });
  for (const y of [0.12, 0.29]) b.line([[-0.02, y], [1.02, y]], P.cream, 0.006, { alpha: 0.55 });
  b.glow(0.84, 0.23, 0.08, P.butter, 0.35);

  // Mats and light spill under each stall.
  for (const [u, v, c] of [[0.15, 0.33, P.rose], [0.89, 0.36, P.orange], [0.11, 0.61, P.teal], [0.9, 0.62, P.magenta]] as [number, number, string][]) {
    const mat = b.rect(u - 0.12, v - 0.04, 0.24, 0.09, 0.01, 1.2);
    b.paint(mat, c, { mottle: 0.8, rim: 0.12, alpha: 0.75 });
    b.ctx.save();
    b.ctx.clip(mat.path);
    for (let x = u - 0.11; x < u + 0.12; x += 0.03) b.line([[x, v - 0.04], [x, v + 0.05]], P.cream, 0.006, { alpha: 0.35 });
    b.ctx.restore();
    b.glow(u, v + 0.04, 0.13, P.apricot, 0.35);
  }

  // The busy pedestrian walkway: warm tiles, widening towards the canal.
  const walkColor = '#eaa77c';
  const walk = b.poly([[0.37, 0.29], [0.63, 0.29], [0.67, 0.9], [0.33, 0.9]], { wobble: 1.2 });
  b.paint(walk, walkColor, { mottle: 1.3, light: 0.15, shadow: 0.1, rim: 0.12 });
  b.ctx.save();
  b.ctx.clip(walk.path);
  for (let y = 0.3, row = 0; y < 0.9; y += 0.035, row++) {
    b.line([[0.3, y], [0.7, y]], shade(walkColor, -0.2), 0.0025, { alpha: 0.35 });
    for (let x = 0.31 + (row % 2) * 0.025; x < 0.7; x += 0.05) b.line([[x, y], [x, y + 0.035]], shade(walkColor, -0.2), 0.0025, { alpha: 0.3 });
  }
  b.ctx.restore();
  for (const v of [0.36, 0.5, 0.64, 0.78]) b.glow(0.5 + (b.rng() - 0.5) * 0.06, v, 0.1, P.butter, 0.4);

  // Seating spilling out around the umbrella table.
  for (const [u, v, c] of [[0.64, 0.6, P.ember], [0.76, 0.6, P.skyDeep], [0.7, 0.64, P.ember], [0.62, 0.53, P.skyDeep]] as [number, number, string][]) {
    b.paint(b.circle(u, v, 0.013, 0.4), c, { mottle: 0.3, rim: 0.2, alpha: 0.9 });
  }

  // Fairy lights strung across the walkway, seen from above.
  const colors = [P.butter, P.pink, P.skyLight, P.apricot];
  for (const v0 of [0.4, 0.55, 0.7]) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push([0.29 + t * 0.42, v0 + t * 0.02 + Math.sin(Math.PI * t) * 0.015]);
    }
    b.line(pts, P.inkSoft, 0.002, { alpha: 0.5 });
    pts.forEach(([u, v], i) => {
      b.glow(u, v, 0.018, colors[i % 4], 0.7);
      b.flat(b.circle(u, v, 0.004, 0), shade(colors[i % 4], 0.5));
    });
  }

  // Canal along the front edge, with lotus pads and floating krathongs.
  const canal = b.rect(-0.02, 0.9, 1.04, 0.14, 0, 1);
  b.paint(canal, '#5a86c8', { mottle: 1.4, light: 0.25, shadow: 0.05, rim: 0 });
  b.paint(b.rect(-0.02, 0.885, 1.04, 0.02, 0.004, 0.8), P.woodDeep, { mottle: 0.5, rim: 0 });
  for (let i = 0; i < 26; i++) {
    const u = b.rng();
    const v = range(b.rng, 0.92, 1.0);
    const c = [P.apricot, P.pink, P.butter, P.white][i % 4];
    b.line([[u, v], [u + 0.025, v - 0.004], [u + 0.05, v]], c, 0.004, { alpha: i % 4 === 3 ? 0.35 : 0.55 });
  }
  for (const [u, v] of [[0.08, 0.95], [0.17, 0.98], [0.86, 0.94], [0.94, 0.985], [0.26, 0.94]] as [number, number][]) {
    b.paint(b.circle(u, v, 0.022, 0.5), P.leaf, { mottle: 0.5, rim: 0.2 });
    b.line([[u, v], [u + 0.02, v - 0.006]], P.leafDeep, 0.004, { alpha: 0.7 });
  }
  b.paint(b.circle(0.175, 0.975, 0.009, 0.3), P.pink, { rim: 0 });
  b.paint(b.circle(0.865, 0.935, 0.009, 0.3), P.pink, { rim: 0 });
  for (const [u, v] of [[0.3, 0.965], [0.72, 0.955], [0.62, 0.995], [0.04, 0.99]] as [number, number][]) {
    b.glow(u, v, 0.05, P.apricot, 0.6);
    b.paint(b.circle(u, v, 0.018, 0.4), P.leafDeep, { mottle: 0.3, rim: 0.2 });
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      b.flat(b.circle(u + Math.cos(a) * 0.012, v + Math.sin(a) * 0.012, 0.007, 0.2), k % 2 ? P.pink : P.butter);
    }
    b.flat(b.circle(u, v, 0.005, 0), '#fffaf0');
  }

  // Little bridge where the walkway meets the canal.
  const bridge = b.rect(0.4, 0.875, 0.2, 0.14, 0.006, 0.6);
  b.paint(bridge, P.wood, { mottle: 0.8, rim: 0.2 });
  for (let x = 0.41; x < 0.6; x += 0.02) b.line([[x, 0.878], [x, 1.01]], P.woodDeep, 0.002, { alpha: 0.6 });
  for (const u of [0.4, 0.6]) b.line([[u, 0.875], [u, 1.015]], shade(P.wood, -0.3), 0.006, { alpha: 0.9 });

  // Night air stays deep: only a few warm glows, never pale washes.
  atmosphere(b, [P.apricot, P.pink, P.gold], 8, 0.1);
};

const seaside: MapPainter = (b) => {
  // Sea at the back, sand in front.
  const SHORE = 0.37;
  const sea = b.rect(-0.02, -0.02, 1.04, SHORE + 0.05, 0, 0);
  b.paint(sea, P.sky, { mottle: 1.6, shadow: 0, light: 0, rim: 0 });
  const g = b.ctx.createLinearGradient(0, b.y(0), 0, b.y(SHORE));
  g.addColorStop(0, rgba(P.skyDeep, 0.6));
  g.addColorStop(1, rgba(P.teal, 0.25));
  b.ctx.fillStyle = g;
  b.ctx.fill(sea.path);
  for (let i = 0; i < 22; i++) {
    const x = b.rng();
    const y = range(b.rng, 0.03, SHORE - 0.05);
    b.line([[x, y], [x + 0.03, y - 0.008], [x + 0.06, y]], P.white, 0.005, { alpha: 0.55 });
  }

  const shoreLine = (x: number) => SHORE + Math.sin(x * 13) * 0.012;
  const shorePts: [number, number][] = [[-0.02, 1.02], [-0.02, SHORE + 0.03]];
  for (let x = 0; x <= 1.02; x += 0.06) shorePts.push([x, shoreLine(x)]);
  shorePts.push([1.02, 1.02]);
  const sand = b.poly(shorePts, { smooth: true, wobble: 1.5 });
  b.paint(sand, P.sand, { mottle: 1.4, light: 0.1, shadow: 0.12, rim: 0 });
  b.speckle(sand, P.sandDeep, 600, 0.003, 0.5);
  b.speckle(sand, P.white, 240, 0.003, 0.5);
  const foam: [number, number][] = [];
  for (let x = -0.02; x <= 1.02; x += 0.03) foam.push([x, shoreLine(x) - 0.002]);
  b.line(foam, P.white, 0.012, { alpha: 0.9, wobble: 1.5 });
  b.line(foam.map(([x, y]) => [x, y + 0.025] as [number, number]), P.sandDeep, 0.01, { alpha: 0.4, wobble: 2 });

  // Rocky point under the lighthouse.
  for (const [x, y, rx, ry] of [[0.1, 0.19, 0.11, 0.06], [0.19, 0.22, 0.07, 0.04], [0.03, 0.24, 0.06, 0.04]] as [number, number, number, number][]) {
    b.paint(b.ellipse(x, y, rx, ry, 2), P.stone, { mottle: 1.2, rim: 0.2 });
  }

  // Pier running out to sea behind the dock.
  const pier = b.rect(0.77, 0.08, 0.08, SHORE - 0.06, 0.005, 0.6);
  b.paint(pier, P.wood, { mottle: 0.8, rim: 0.2 });
  for (let y = 0.09; y < SHORE - 0.02; y += 0.022) b.line([[0.77, y], [0.85, y]], P.woodDeep, 0.002, { alpha: 0.6 });

  // Boardwalk from the front of the page up to the juice bar.
  const boards = b.poly([[0.04, 1.02], [0.12, 1.02], [0.23, 0.46], [0.16, 0.46]], { wobble: 0.6 });
  b.paint(boards, P.wood, { mottle: 0.8, light: 0.2, rim: 0.15 });
  b.ctx.save();
  b.ctx.clip(boards.path);
  for (let y = 0.47; y < 1.02; y += 0.025) b.line([[0.05, y], [0.3, y]], P.woodDeep, 0.002, { alpha: 0.5 });
  b.ctx.restore();

  // Wet sand under the shower, and footprints wandering to the water.
  b.paint(b.ellipse(0.4, 0.45, 0.06, 0.025, 1.2), shade(P.sandDeep, -0.05), { mottle: 0.6, rim: 0, alpha: 0.7 });
  for (let i = 0; i < 8; i++) {
    const x = 0.5 + i * 0.03 + Math.sin(i * 1.7) * 0.01;
    const y = 0.95 - i * 0.055;
    b.paint(b.ellipse(x + (i % 2) * 0.012, y, 0.006, 0.01), P.sandDeep, { mottle: 0.2, rim: 0, alpha: 0.7 });
  }

  atmosphere(b, [P.white, P.skyPale, P.peach, P.lilac], 16, 0.2);
};

export const MAP_PAINTERS: Record<string, MapPainter> = { nyc, market, seaside };
