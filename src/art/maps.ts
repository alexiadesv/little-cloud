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
  b.paint(sea, mix(P.sky, P.teal, 0.5), { mottle: 1.6, shadow: 0, light: 0, rim: 0 });
  const g = b.ctx.createLinearGradient(0, b.y(0), 0, b.y(SHORE));
  g.addColorStop(0, rgba('#3a62b5', 0.55));
  g.addColorStop(1, rgba('#5fd3c4', 0.35));
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

  // Tiled promenade from the front of the page up to the juice bar.
  const promenade = b.poly([[0.04, 1.02], [0.12, 1.02], [0.23, 0.46], [0.16, 0.46]], { wobble: 0.6 });
  b.paint(promenade, P.cream, { mottle: 0.8, light: 0.2, rim: 0.15 });
  b.ctx.save();
  b.ctx.clip(promenade.path);
  for (let y = 0.46; y < 1.02; y += 0.035) {
    const t = (y - 0.46) / 0.56;
    const left = 0.16 - t * 0.12;
    b.line([[left - 0.01, y], [left + 0.1, y]], '#3a62b5', 0.0025, { alpha: 0.5 });
    for (const [k, c] of [[0.25, '#3a62b5'], [0.75, '#f5a524']] as [number, string][]) {
      const x = left + 0.075 * k;
      b.flat(b.poly([[x, y + 0.008], [x + 0.008, y + 0.0175], [x, y + 0.027], [x - 0.008, y + 0.0175]], { wobble: 0 }), (Math.round(y / 0.035) % 2 ? c : '#e0478f'), 0.75);
    }
  }
  b.ctx.restore();

  // Wet sand under the shower, and footprints wandering to the water.
  b.paint(b.ellipse(0.4, 0.45, 0.06, 0.025, 1.2), shade(P.sandDeep, -0.05), { mottle: 0.6, rim: 0, alpha: 0.7 });
  for (let i = 0; i < 8; i++) {
    const x = 0.5 + i * 0.03 + Math.sin(i * 1.7) * 0.01;
    const y = 0.95 - i * 0.055;
    b.paint(b.ellipse(x + (i % 2) * 0.012, y, 0.006, 0.01), P.sandDeep, { mottle: 0.2, rim: 0, alpha: 0.7 });
  }

  // Marigold petals scattered by the food stalls.
  b.speckle(b.rect(0.0, 0.45, 0.35, 0.3, 0, 0), '#f5a524', 70, 0.004, 0.8);
  b.speckle(b.rect(0.8, 0.42, 0.2, 0.2, 0, 0), '#e0478f', 40, 0.004, 0.8);

  atmosphere(b, [P.white, P.skyPale, P.peach, P.butter], 16, 0.2);
};

const paddy: MapPainter = (b) => {
  type Pt = [number, number];
  const grass = mix(P.sage, P.mint, 0.45);
  const water = mix(P.skyLight, P.sage, 0.35);
  const earth = mix(P.sand, P.peach, 0.35);
  const mud = '#a7806a';
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), grass, { mottle: 1.4, shadow: 0.05, light: 0.08, rim: 0 });

  const tuft = (x: number, y: number) => {
    for (const dx of [-0.006, 0, 0.006]) b.line([[x, y], [x + dx, y - 0.016 + Math.abs(dx)]], dx ? P.leaf : P.leafDeep, 0.003, { wobble: 0 });
  };

  // Terraced hillside along the back left, each step holding a sliver of water.
  const step = (v: number, i: number) => (x: number) => v + Math.sin(x * 7 + i * 1.3) * 0.01;
  for (let i = 0; i < 4; i++) {
    const top = step(-0.02 + i * 0.055, i);
    const bottom = step(0.035 + i * 0.055, i + 1);
    const pts: Pt[] = [];
    for (let x = -0.02; x <= 0.66; x += 0.04) pts.push([x, top(x)]);
    for (let x = 0.66; x >= -0.02; x -= 0.04) pts.push([x, bottom(x)]);
    b.paint(b.poly(pts, { smooth: true, wobble: 0.8 }), i % 2 ? mix(P.leaf, P.sage, 0.4) : water, { mottle: 1, rim: 0.1, light: 0.15 });
    const edge: Pt[] = [];
    for (let x = -0.02; x <= 0.66; x += 0.04) edge.push([x, bottom(x)]);
    b.line(edge, P.leafDeep, 0.006, { alpha: 0.7 });
    b.line(edge.map(([x, y]): Pt => [x, y + 0.006]), P.cream, 0.003, { alpha: 0.5 });
    if (i % 2) for (let x = 0.02; x < 0.62; x += 0.03) tuft(x, top(x) + 0.035);
  }

  // Farmyard and garden on the right.
  const yard = b.rect(0.6, -0.02, 0.44, 0.82, 0.04, 1.5);
  b.paint(yard, earth, { mottle: 1.3, rim: 0.12 });
  b.speckle(yard, P.sandDeep, 300, 0.003, 0.5);
  b.paint(b.ellipse(0.72, 0.775, 0.06, 0.025, 1.2), mud, { mottle: 0.8, rim: 0, alpha: 0.85 });
  const garden = b.rect(0.58, 0.83, 0.44, 0.19, 0.02, 1.2);
  b.paint(garden, shade(mud, 0.25), { mottle: 1, rim: 0.12 });
  for (let y = 0.855; y < 1.01; y += 0.03) b.line([[0.6, y], [1.02, y]], shade(mud, -0.1), 0.005, { alpha: 0.6, wobble: 1 });
  for (let x = 0.62; x < 1; x += 0.035) tuft(x, 0.87 + ((x * 100) % 3) * 0.03);

  // The farm pond with lily pads, and the stream running down to the front.
  const stream: Pt[] = [[0.55, 0.34], [0.57, 0.48], [0.53, 0.6], [0.56, 0.74], [0.53, 0.88], [0.55, 1.03]];
  b.line(stream, shade(P.sky, 0.15), 0.07, { wobble: 1 });
  b.line(stream, P.sky, 0.05, { wobble: 1 });
  b.line(stream.map(([x, y]): Pt => [x - 0.01, y]), P.white, 0.004, { alpha: 0.5, wobble: 2 });
  const lake = b.ellipse(0.47, 0.3, 0.25, 0.085, 1.4);
  b.paint(lake, P.sky, { mottle: 1.4, light: 0.2, rim: 0.12 });
  b.stroke(lake, P.cream, 0.006, 0.6);
  for (let i = 0; i < 10; i++) {
    const x = range(b.rng, 0.27, 0.65);
    const y = range(b.rng, 0.25, 0.35);
    b.line([[x, y], [x + 0.025, y - 0.005], [x + 0.05, y]], P.white, 0.004, { alpha: 0.55 });
  }
  for (const [x, y] of [[0.3, 0.33], [0.68, 0.28], [0.34, 0.25]] as Pt[]) {
    b.paint(b.ellipse(x, y, 0.018, 0.01, 0.4), P.leaf, { mottle: 0.4, rim: 0.12 });
  }

  // Flooded rice paddies, bordered by grassy bunds.
  const plots: [number, number, number, number, boolean][] = [
    [0.02, 0.4, 0.22, 0.19, true],
    [0.26, 0.4, 0.22, 0.19, true],
    [0.02, 0.61, 0.22, 0.19, false],
    [0.26, 0.61, 0.22, 0.19, true],
  ];
  for (const [x, y, w, h, planted] of plots) {
    const plot = b.rect(x, y, w, h, 0.012, 1.2);
    b.paint(plot, water, { mottle: 1.2, light: 0.3, rim: 0.15 });
    b.ctx.save();
    b.ctx.clip(plot.path);
    for (let k = 0; k < 3; k++) {
      const ry = y + 0.04 + k * 0.06;
      b.line([[x + 0.03 + k * 0.04, ry], [x + 0.1 + k * 0.04, ry - 0.004]], P.white, 0.005, { alpha: 0.5 });
    }
    if (planted) {
      for (let ry = y + 0.03; ry < y + h; ry += 0.03) {
        for (let rx = x + 0.015; rx < x + w; rx += 0.025) tuft(rx + range(b.rng, -0.003, 0.003), ry);
      }
    }
    b.ctx.restore();
    b.stroke(plot, mix(P.leafDeep, mud, 0.3), 0.012, 0.85);
  }

  // Grassy front bank: a frog pond and wildflowers.
  const pond = b.ellipse(0.08, 0.9, 0.07, 0.04, 1.2);
  b.paint(pond, P.skyLight, { mottle: 0.8, light: 0.3, rim: 0.15 });
  b.paint(b.ellipse(0.12, 0.91, 0.02, 0.01, 0.4), P.leaf, { rim: 0.12 });
  const bank = b.rect(-0.02, 0.82, 0.58, 0.2, 0, 2);
  b.speckle(bank, P.pink, 50, 0.004, 0.8);
  b.speckle(bank, P.butter, 50, 0.004, 0.8);
  b.speckle(bank, P.white, 40, 0.003, 0.8);

  atmosphere(b, [P.white, P.butter, P.mint, P.skyPale], 14, 0.16);
};

const alpine: MapPainter = (b) => {
  type Pt = [number, number];
  const snow = mix(P.night, P.periwinkle, 0.45);
  const ice = mix(P.skyDeep, P.night, 0.25);
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), snow, { mottle: 1.3, shadow: 0.08, light: 0.05, rim: 0 });

  // Moonlit mountain wall.
  const ridge: Pt[] = [[-0.02, 0.26], [0.12, 0.08], [0.28, 0.18], [0.48, 0.04], [0.7, 0.16], [0.88, 0.06], [1.02, 0.2], [1.02, 0.32], [-0.02, 0.32]];
  b.paint(b.poly(ridge, { smooth: true, wobble: 1.2 }), mix(P.night, P.slate, 0.35), { mottle: 1.1, light: 0.1, rim: 0.1 });
  b.paint(b.poly([[0.08, 0.14], [0.12, 0.08], [0.2, 0.16], [0.14, 0.22]], { smooth: true, wobble: 0.6 }), P.lilac, { mottle: 0.5, rim: 0 });
  b.paint(b.poly([[0.42, 0.12], [0.48, 0.04], [0.58, 0.14], [0.5, 0.2]], { smooth: true, wobble: 0.6 }), P.lilac, { mottle: 0.5, rim: 0 });
  b.paint(b.poly([[0.82, 0.12], [0.88, 0.06], [0.96, 0.16], [0.88, 0.22]], { smooth: true, wobble: 0.6 }), P.lilac, { mottle: 0.5, rim: 0 });
  b.glow(0.86, 0.05, 0.12, P.cream, 0.55);
  b.paint(b.circle(0.86, 0.05, 0.035, 0.3), P.cream, { mottle: 0.3, light: 0.5, rim: 0 });

  // Village terrace, lit from the cottage windows.
  const terrace = b.rect(0.52, 0.18, 0.5, 0.28, 0.02, 1.2);
  b.paint(terrace, mix(P.night, P.wood, 0.25), { mottle: 1.0, rim: 0.12 });
  b.speckle(terrace, P.gold, 80, 0.004, 0.5);
  b.glow(0.42, 0.12, 0.16, P.orange, 0.45);
  b.glow(0.86, 0.12, 0.16, P.gold, 0.5);

  // Frozen pond catching the village lights.
  const pond = b.ellipse(0.3, 0.38, 0.26, 0.1, 1.4);
  b.paint(pond, ice, { mottle: 1.2, light: 0.25, rim: 0.12 });
  b.stroke(pond, P.lilac, 0.008, 0.7);
  b.ctx.save();
  b.ctx.clip(pond.path);
  b.line([[0.12, 0.38], [0.28, 0.42], [0.44, 0.36]], P.gold, 0.006, { alpha: 0.55, wobble: 1 });
  b.glow(0.34, 0.36, 0.08, P.orange, 0.35);
  b.ctx.restore();

  // A packed snow path down the middle, washed with lamplight.
  const path: Pt[] = [[0.48, 0.32], [0.52, 0.5], [0.48, 0.68], [0.54, 0.86], [0.5, 1.03]];
  b.line(path, mix(P.night, P.stone, 0.5), 0.09, { wobble: 1.2 });
  b.line(path, mix(P.gold, snow, 0.7), 0.04, { wobble: 1.2 });

  // Pine shadows.
  for (const [x, y, r] of [[0.08, 0.22, 0.05], [0.18, 0.2, 0.04], [0.78, 0.24, 0.045], [0.94, 0.28, 0.05]] as [number, number, number][]) {
    b.paint(b.circle(x, y, r, 1.4), mix(P.leafDeep, P.night, 0.4), { mottle: 0.8, rim: 0.15 });
  }
  for (const [x, y, rx, ry] of [[0.12, 0.72, 0.1, 0.04], [0.88, 0.7, 0.12, 0.045], [0.2, 0.92, 0.14, 0.05], [0.78, 0.9, 0.11, 0.04]] as [number, number, number, number][]) {
    b.paint(b.ellipse(x, y, rx, ry, 1.2), mix(snow, P.white, 0.4), { mottle: 0.6, light: 0.2, rim: 0.1 });
  }

  // Pools of Christmas light on the snow, and tiny bulbs along the path.
  for (const [x, y, c] of [[0.42, 0.18, P.orange], [0.72, 0.22, P.gold], [0.18, 0.48, P.ember], [0.62, 0.58, P.gold], [0.78, 0.42, P.raspberry]] as [number, number, string][]) {
    b.glow(x, y, 0.12, c, 0.4);
  }
  const lights: Pt[] = [[0.46, 0.4], [0.5, 0.52], [0.48, 0.64], [0.52, 0.76], [0.5, 0.88]];
  for (let i = 0; i < lights.length; i++) {
    const [x, y] = lights[i];
    b.glow(x, y, 0.04, [P.gold, P.ember, P.skyLight, P.raspberry, P.butter][i], 0.7);
    b.flat(b.circle(x, y, 0.008, 0), shade([P.gold, P.ember, P.skyLight, P.raspberry, P.butter][i], 0.4));
  }

  b.speckle(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), P.white, 420, 0.0035, 0.65);
  atmosphere(b, [P.gold, P.orange, P.lavender, P.night], 10, 0.12);
};

const garden: MapPainter = (b) => {
  type Pt = [number, number];
  const lawn = mix(P.mint, P.sage, 0.25);
  const lawnDeep = mix(P.leafDeep, P.sage, 0.35);
  const lawnLight = mix(P.mint, P.butter, 0.12);
  const gravel = mix(P.sand, P.stone, 0.22);
  const cobble = mix(P.stone, P.sand, 0.45);

  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), lawn, { mottle: 1.6, shadow: 0.08, light: 0.12, rim: 0 });

  const tuft = (x: number, y: number, h = 0.016) => {
    for (const dx of [-0.007, 0, 0.007]) b.line([[x, y], [x + dx, y - h]], dx ? P.leaf : P.leafDeep, 0.0035, { wobble: 0 });
  };
  const clump = (x: number, y: number) => {
    b.paint(b.ellipse(x, y, 0.055, 0.028, 1.1), lawnDeep, { mottle: 0.7, rim: 0.08 });
    for (let k = 0; k < 5; k++) tuft(x + (k - 2) * 0.012, y + (k % 2) * 0.008, 0.02);
  };

  // Clipped lawn rings so the grass has a cut, tended look.
  for (const [x, y, rx, ry, c] of [
    [0.48, 0.34, 0.42, 0.28, lawnLight],
    [0.5, 0.36, 0.28, 0.18, mix(lawn, P.leaf, 0.25)],
    [0.22, 0.2, 0.16, 0.1, lawnDeep],
    [0.78, 0.22, 0.14, 0.09, lawnDeep],
    [0.18, 0.5, 0.15, 0.1, mix(lawn, P.leafDeep, 0.2)],
    [0.8, 0.48, 0.14, 0.09, lawnLight],
  ] as [number, number, number, number, string][]) {
    b.paint(b.ellipse(x, y, rx, ry, 1.3), c, { mottle: 1.1, light: 0.15, rim: 0.06, alpha: 0.85 });
  }

  const spiral = (cx: number, cy: number, r0: number, r1: number, turns: number, n: number, squash: number): Pt[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      const a = Math.PI / 2 + t * turns * Math.PI * 2;
      const r = r0 + (r1 - r0) * t;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * squash] as Pt;
    });

  const walk = spiral(0.48, 0.34, 0.055, 0.34, 2.15, 48, 0.78);
  const exit: Pt[] = [[0.48, 0.66], [0.44, 0.7], [0.4, 0.74], [0.36, 0.8]];
  const path = [...walk, ...exit];

  // Flower beds tucked between the spiral arms.
  const bed = (x: number, y: number, rx: number, ry: number, blooms: string[]) => {
    const patch = b.ellipse(x, y, rx, ry, 1.15);
    b.paint(patch, mix(P.wood, P.sage, 0.35), { mottle: 1, rim: 0.12 });
    b.speckle(patch, blooms[0], 90, 0.007, 0.8);
    b.speckle(patch, blooms[1], 60, 0.006, 0.75);
    if (blooms[2]) b.speckle(patch, blooms[2], 35, 0.005, 0.7);
  };
  const palettes: string[][] = [
    [P.raspberry, P.pink, P.rose],
    [P.lavender, P.lilac, P.lavenderDeep],
    [P.butter, P.apricot, P.yellow],
    [P.skyLight, P.lilac, P.pink],
    [P.white, P.pink, P.butter],
    [P.ember, P.raspberry, P.orange],
  ];
  for (let i = 6; i < walk.length - 4; i += 3) {
    const [x, y] = walk[i];
    const [x2, y2] = walk[i + 1];
    const nx = -(y2 - y);
    const ny = x2 - x;
    const len = Math.hypot(nx, ny) || 1;
    const side = i % 6 < 3 ? 1 : -1;
    const bx = x + (nx / len) * 0.09 * side;
    const by = y + (ny / len) * 0.09 * side;
    if (by > 0.66 || by < 0.06 || bx < 0.06 || bx > 0.92) continue;
    const p = palettes[i % palettes.length];
    bed(bx, by, 0.07 + (i % 4) * 0.012, 0.038 + (i % 3) * 0.008, p);
  }
  bed(0.12, 0.14, 0.1, 0.05, palettes[0]);
  bed(0.86, 0.16, 0.1, 0.048, palettes[1]);
  bed(0.1, 0.42, 0.09, 0.046, palettes[2]);
  bed(0.88, 0.4, 0.1, 0.05, palettes[3]);
  bed(0.14, 0.58, 0.08, 0.04, palettes[4]);
  bed(0.82, 0.56, 0.085, 0.042, palettes[0]);
  bed(0.48, 0.18, 0.08, 0.04, palettes[5]);
  bed(0.62, 0.5, 0.07, 0.036, palettes[1]);

  // Box hedges and round bushes.
  const hedgeStrip = (x: number, y: number, w: number, h: number) => {
    const shape = b.rect(x, y, w, h, 0.03, 1.1);
    b.paint(shape, P.leafDeep, { mottle: 0.9, light: 0.2, rim: 0.1 });
    b.speckle(shape, P.mint, 50, 0.007, 0.5);
  };
  hedgeStrip(0.04, 0.04, 0.3, 0.055);
  hedgeStrip(0.38, 0.03, 0.24, 0.05);
  hedgeStrip(0.68, 0.045, 0.28, 0.055);
  hedgeStrip(0.02, 0.62, 0.22, 0.045);
  hedgeStrip(0.72, 0.62, 0.22, 0.045);
  for (const [x, y, r] of [[0.08, 0.28, 0.045], [0.92, 0.3, 0.05], [0.06, 0.52, 0.04], [0.94, 0.5, 0.048], [0.3, 0.08, 0.038], [0.7, 0.09, 0.04]] as [number, number, number][]) {
    b.paint(b.circle(x, y, r, 1.2), P.leafDeep, { mottle: 0.8, light: 0.25, rim: 0.12 });
    b.paint(b.circle(x - r * 0.25, y - r * 0.2, r * 0.55, 0.8), P.leaf, { mottle: 0.5, rim: 0 });
    b.speckle(b.circle(x, y, r, 1), P.pink, 12, 0.006, 0.7);
  }

  // Spiral gravel walk, spilling onto the avenue.
  b.line(path, mix(gravel, P.wood, 0.2), 0.1, { wobble: 0.8 });
  b.line(path, gravel, 0.068, { wobble: 0.8 });
  b.line(path, mix(gravel, P.cream, 0.35), 0.02, { wobble: 0.9, alpha: 0.7 });

  const pool = b.ellipse(0.48, 0.34, 0.07, 0.032, 1.2);
  b.paint(pool, mix(P.skyLight, P.mint, 0.35), { mottle: 0.8, light: 0.4, rim: 0.12 });
  b.line([[0.43, 0.34], [0.48, 0.332], [0.53, 0.34]], P.white, 0.005, { alpha: 0.75, wobble: 0 });

  // Avenue across the front: cream sidewalk, then cobbles.
  const walkway = b.rect(-0.02, 0.68, 1.04, 0.08, 0, 1);
  b.paint(walkway, mix(P.sand, P.cream, 0.4), { mottle: 1.0, rim: 0.1 });
  b.ctx.save();
  b.ctx.clip(walkway.path);
  for (let x = 0; x < 1; x += 0.045) b.line([[x, 0.68], [x, 0.76]], shade(P.sand, -0.15), 0.002, { alpha: 0.4 });
  b.ctx.restore();
  b.line([[-0.02, 0.68], [1.02, 0.68]], P.cream, 0.008, { alpha: 0.8 });
  b.line([[-0.02, 0.76], [1.02, 0.76]], mix(P.stone, P.cream, 0.3), 0.01, { alpha: 0.85 });

  const road = b.rect(-0.02, 0.76, 1.04, 0.28, 0, 1);
  b.paint(road, cobble, { mottle: 1.4, shadow: 0.08, light: 0.08, rim: 0.08 });
  b.ctx.save();
  b.ctx.clip(road.path);
  for (let y = 0.78, row = 0; y < 1.04; y += 0.028, row++) {
    b.line([[-0.02, y], [1.04, y]], shade(cobble, -0.18), 0.002, { alpha: 0.4 });
    for (let x = (row % 2) * 0.02; x < 1.04; x += 0.04) {
      b.paint(b.rect(x, y, 0.032, 0.022, 0.004, 0.4), shade(cobble, row % 2 ? 0.08 : -0.08), { mottle: 0.3, rim: 0.05, alpha: 0.55 });
    }
  }
  b.ctx.restore();
  b.speckle(road, P.sandDeep, 220, 0.004, 0.45);
  b.speckle(road, P.cream, 80, 0.003, 0.4);

  // Pots along the sidewalk, seen from above.
  for (const [x, c] of [[0.1, P.raspberry], [0.22, P.pink], [0.7, P.ember], [0.82, P.raspberry], [0.94, P.pink]] as [number, string][]) {
    b.paint(b.circle(x, 0.72, 0.018, 0.5), P.terracotta, { mottle: 0.4, rim: 0.1 });
    b.paint(b.circle(x, 0.72, 0.012, 0.4), P.leafDeep, { mottle: 0.3, rim: 0 });
    b.paint(b.circle(x + 0.004, 0.716, 0.006, 0.3), c, { rim: 0 });
  }

  for (let i = 0; i < 70; i++) {
    const x = range(b.rng, 0.03, 0.97);
    const y = range(b.rng, 0.06, 0.66);
    tuft(x, y, range(b.rng, 0.012, 0.022));
  }
  for (const [x, y] of [[0.2, 0.3], [0.76, 0.28], [0.16, 0.48], [0.84, 0.46], [0.4, 0.12], [0.6, 0.58]] as Pt[]) clump(x, y);

  b.speckle(b.rect(-0.02, -0.02, 1.04, 0.7, 0, 0), P.pink, 140, 0.004, 0.7);
  b.speckle(b.rect(-0.02, -0.02, 1.04, 0.7, 0, 0), P.butter, 110, 0.004, 0.65);
  b.speckle(b.rect(-0.02, -0.02, 1.04, 0.7, 0, 0), P.white, 80, 0.0035, 0.6);
  atmosphere(b, [P.white, P.mint, P.pink, P.butter, P.cream], 16, 0.16);
};

const apartment: MapPainter = (b) => {
  const floor = mix(P.sand, P.wood, 0.22);
  b.paint(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0), floor, { mottle: 1.1, shadow: 0.06, light: 0.08, rim: 0 });
  b.ctx.save();
  b.ctx.clip(b.rect(-0.02, -0.02, 1.04, 1.04, 0, 0).path);
  for (let y = 0.02; y < 1.02; y += 0.055) {
    b.line([[-0.02, y], [1.04, y]], shade(floor, -0.12), 0.003, { alpha: 0.38, wobble: 0.2 });
  }
  b.ctx.restore();

  const rug = b.ellipse(0.5, 0.56, 0.34, 0.24, 1.2);
  b.paint(rug, mix(P.rose, P.cream, 0.55), { mottle: 0.8, rim: 0.12 });
  b.paint(b.ellipse(0.5, 0.56, 0.27, 0.185, 1), mix(P.lilac, P.cream, 0.35), { mottle: 0.6, rim: 0 });
  b.line(
    Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2;
      return [0.5 + Math.cos(a) * 0.32, 0.56 + Math.sin(a) * 0.22] as [number, number];
    }),
    P.raspberry,
    0.008,
    { alpha: 0.45, wobble: 0.4 },
  );

  b.glow(0.28, 0.22, 0.2, P.butter, 0.2);
  b.glow(0.72, 0.22, 0.18, P.butter, 0.16);
  atmosphere(b, [P.white, P.peach, P.cream, P.lilac], 10, 0.14);
};

export const MAP_PAINTERS: Record<string, MapPainter> = { nyc, market, seaside, paddy, alpine, garden, apartment };
