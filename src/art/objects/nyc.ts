import { P, shade } from '../paint/color';
import { type PainterMap, canopy, wheel, windows } from './common';

export const nycPainters: PainterMap = {
  car: {
    w: 1.8,
    h: 1.0,
    paint(b) {
      const body = P.rose;
      b.paint(b.poly([[0.38, 0.5], [0.58, 0.14], [1.18, 0.12], [1.46, 0.5]], { smooth: true, wobble: 0.8 }), body);
      b.paint(b.poly([[0.5, 0.47], [0.65, 0.22], [0.88, 0.21], [0.88, 0.47]], { wobble: 0.5 }), P.skyPale, { mottle: 0.5, rim: 0.1 });
      b.paint(b.poly([[0.96, 0.47], [0.96, 0.21], [1.15, 0.21], [1.34, 0.47]], { wobble: 0.5 }), P.skyPale, { mottle: 0.5, rim: 0.1 });
      b.paint(b.rect(0.04, 0.44, 1.72, 0.4, 0.16), body);
      b.line([[0.16, 0.6], [1.62, 0.6]], shade(body, 0.45), 0.03, { alpha: 0.6 });
      b.flat(b.rect(0.9, 0.52, 0.13, 0.035, 0.015), P.ink, 0.5);
      b.paint(b.ellipse(1.7, 0.56, 0.07, 0.06), P.butter, { mottle: 0.2, rim: 0 });
      b.glow(1.78, 0.56, 0.2, P.butter, 0.5);
      b.paint(b.ellipse(0.08, 0.56, 0.05, 0.05), P.raspberry, { mottle: 0.2, rim: 0 });
      wheel(b, 0.44, 0.82, 0.18);
      wheel(b, 1.36, 0.82, 0.18);
    },
  },

  taxi: {
    w: 1.75,
    h: 1.05,
    paint(b) {
      const body = P.yellow;
      b.paint(b.rect(0.72, 0.03, 0.34, 0.13, 0.04), P.cream, { mottle: 0.3 });
      b.text('TAXI', 0.89, 0.095, 0.075, P.ink, { weight: 700 });
      b.paint(b.poly([[0.36, 0.52], [0.56, 0.17], [1.16, 0.16], [1.42, 0.52]], { smooth: true, wobble: 0.8 }), body);
      b.paint(b.poly([[0.5, 0.5], [0.64, 0.26], [0.87, 0.25], [0.87, 0.5]], { wobble: 0.5 }), P.skyPale, { mottle: 0.5, rim: 0.1 });
      b.paint(b.poly([[0.95, 0.5], [0.95, 0.25], [1.13, 0.25], [1.31, 0.5]], { wobble: 0.5 }), P.skyPale, { mottle: 0.5, rim: 0.1 });
      b.paint(b.rect(0.04, 0.47, 1.66, 0.4, 0.16), body);
      for (let i = 0; i < 12; i++) {
        const x = 0.22 + i * 0.11;
        b.flat(b.rect(x, 0.62, 0.055, 0.05, 0.005, 0.2), i % 2 ? P.cream : P.ink, 0.85);
        b.flat(b.rect(x + 0.055, 0.67, 0.055, 0.05, 0.005, 0.2), i % 2 ? P.ink : P.cream, 0.85);
      }
      b.paint(b.ellipse(1.64, 0.58, 0.07, 0.06), P.white, { mottle: 0.2, rim: 0 });
      b.glow(1.72, 0.58, 0.2, P.butter, 0.45);
      wheel(b, 0.42, 0.86, 0.18);
      wheel(b, 1.32, 0.86, 0.18);
    },
  },

  'traffic-light': {
    w: 0.62,
    h: 1.75,
    paint(b) {
      b.paint(b.rect(0.26, 0.9, 0.1, 0.85, 0.03), P.slate, { mottle: 0.4 });
      b.paint(b.rect(0.17, 1.68, 0.28, 0.07, 0.03), P.charcoal, { mottle: 0.3 });
      b.paint(b.rect(0.08, 0.02, 0.46, 0.98, 0.12), P.charcoal, { mottle: 0.6, light: 0.18 });
      const lights: [string, number, number][] = [
        [P.raspberry, 0.2, 0.75],
        [P.apricot, 0.5, 0.35],
        [P.leaf, 0.8, 0.35],
      ];
      for (const [color, y, glow] of lights) {
        b.paint(b.poly([[0.12, y * 0.96 - 0.04], [0.5, y * 0.96 - 0.04], [0.45, y * 0.96 - 0.13], [0.17, y * 0.96 - 0.13]], { smooth: true }), shade(P.charcoal, -0.2), { mottle: 0.2 });
        b.paint(b.circle(0.31, y * 0.96 + 0.02, 0.13), color, { mottle: 0.4, light: 0.4, rim: 0.15 });
        b.glow(0.31, y * 0.96 + 0.02, 0.26, color, glow);
        b.glow(0.27, y * 0.96 - 0.02, 0.06, '#ffffff', 0.7);
      }
    },
  },

  'traffic-cone': {
    w: 0.62,
    h: 0.78,
    paint(b) {
      b.paint(b.rect(0.0, 0.66, 0.62, 0.12, 0.03), shade(P.orange, -0.1));
      b.paint(b.poly([[0.11, 0.69], [0.27, 0.03], [0.35, 0.03], [0.51, 0.69]], { wobble: 0.6 }), P.orange, { light: 0.3 });
      b.flat(b.poly([[0.21, 0.27], [0.41, 0.27], [0.44, 0.37], [0.18, 0.37]], { wobble: 0.4 }), P.cream, 0.95);
      b.flat(b.poly([[0.16, 0.48], [0.46, 0.48], [0.48, 0.57], [0.14, 0.57]], { wobble: 0.4 }), P.cream, 0.95);
      b.glow(0.26, 0.2, 0.08, '#ffffff', 0.5);
    },
  },

  crane: {
    w: 2.2,
    h: 3.4,
    paint(b) {
      const steel = P.yellow;
      const dark = shade(steel, -0.35);
      // Mast with lattice.
      b.paint(b.rect(0.62, 0.42, 0.2, 2.98, 0.02, 0.5), steel, { mottle: 0.5, rim: 0.2 });
      for (let y = 0.5; y < 3.3; y += 0.2) {
        b.line([[0.64, y], [0.8, y + 0.2]], dark, 0.025, { wobble: 0.2 });
        b.line([[0.8, y], [0.64, y + 0.2]], dark, 0.018, { wobble: 0.2, alpha: 0.6 });
      }
      // Jib and counter-jib.
      b.paint(b.rect(0.0, 0.38, 2.2, 0.1, 0.02, 0.5), steel, { mottle: 0.4, rim: 0.2 });
      for (let x = 0.05; x < 2.15; x += 0.14) b.line([[x, 0.39], [x + 0.07, 0.47]], dark, 0.02, { wobble: 0.1 });
      b.paint(b.rect(0.04, 0.48, 0.32, 0.26, 0.03), P.slate, { mottle: 0.5 });
      // Peak and tie lines.
      b.paint(b.poly([[0.62, 0.4], [0.72, 0.02], [0.82, 0.4]], { wobble: 0.4 }), steel, { mottle: 0.3 });
      b.line([[0.72, 0.04], [0.06, 0.39]], dark, 0.015, { wobble: 0.1 });
      b.line([[0.72, 0.04], [1.9, 0.39]], dark, 0.015, { wobble: 0.1 });
      // Cab.
      b.paint(b.rect(0.82, 0.48, 0.26, 0.24, 0.04), P.raspberry, { mottle: 0.4 });
      b.paint(b.rect(0.87, 0.52, 0.16, 0.1, 0.02), P.skyPale, { mottle: 0.2, rim: 0 });
      // Hook with a hanging beam.
      b.line([[1.8, 0.48], [1.8, 1.55]], P.charcoal, 0.018, { wobble: 0.1 });
      b.paint(b.rect(1.74, 1.52, 0.12, 0.08, 0.02), P.charcoal, { mottle: 0.2 });
      b.line([[1.8, 1.6], [1.8, 1.68], [1.74, 1.7]], P.charcoal, 0.03, { wobble: 0.1 });
      b.line([[1.8, 1.68], [1.5, 1.85]], P.charcoal, 0.012, { wobble: 0.1, alpha: 0.8 });
      b.line([[1.8, 1.68], [2.1, 1.85]], P.charcoal, 0.012, { wobble: 0.1, alpha: 0.8 });
      b.paint(b.rect(1.38, 1.84, 0.84, 0.12, 0.02), P.rose, { mottle: 0.5 });
      // Base block.
      b.paint(b.rect(0.42, 3.22, 0.6, 0.18, 0.03), P.stone, { mottle: 0.5 });
    },
  },

  'fire-truck': {
    w: 2.15,
    h: 1.1,
    paint(b) {
      const red = P.raspberry;
      b.paint(b.rect(0.05, 0.38, 1.5, 0.5, 0.08), red);
      b.paint(b.poly([[1.48, 0.88], [1.48, 0.22], [1.86, 0.22], [2.1, 0.55], [2.1, 0.88]], { smooth: true, wobble: 0.6 }), red);
      b.paint(b.poly([[1.6, 0.5], [1.6, 0.3], [1.82, 0.3], [1.98, 0.5]], { wobble: 0.4 }), P.skyPale, { mottle: 0.4, rim: 0.1 });
      b.paint(b.rect(1.66, 0.12, 0.16, 0.1, 0.04), P.skyLight, { mottle: 0.2 });
      b.glow(1.74, 0.14, 0.2, P.skyLight, 0.55);
      // Ladder.
      b.line([[0.12, 0.28], [1.42, 0.28]], P.cream, 0.035, { wobble: 0.3 });
      b.line([[0.12, 0.36], [1.42, 0.36]], P.cream, 0.035, { wobble: 0.3 });
      for (let x = 0.18; x < 1.42; x += 0.12) b.line([[x, 0.28], [x, 0.36]], P.cream, 0.025, { wobble: 0.1 });
      b.line([[0.08, 0.62], [2.06, 0.62]], P.cream, 0.04, { alpha: 0.9 });
      for (let x = 0.2; x < 1.4; x += 0.3) b.paint(b.rect(x, 0.45, 0.2, 0.12, 0.03), shade(red, -0.15), { mottle: 0.2, rim: 0.1 });
      b.paint(b.ellipse(2.05, 0.72, 0.05, 0.05), P.butter, { rim: 0 });
      b.glow(2.1, 0.72, 0.18, P.butter, 0.45);
      wheel(b, 0.38, 0.9, 0.19);
      wheel(b, 0.86, 0.9, 0.19);
      wheel(b, 1.78, 0.9, 0.19);
    },
  },

  mailbox: {
    w: 0.72,
    h: 0.88,
    paint(b) {
      const blue = P.skyDeep;
      b.paint(b.rect(0.1, 0.62, 0.08, 0.26, 0.02), shade(blue, -0.3), { mottle: 0.3 });
      b.paint(b.rect(0.54, 0.62, 0.08, 0.26, 0.02), shade(blue, -0.3), { mottle: 0.3 });
      b.paint(b.ellipse(0.36, 0.25, 0.32, 0.22), blue);
      b.paint(b.rect(0.04, 0.24, 0.64, 0.44, 0.04), blue);
      b.paint(b.rect(0.16, 0.34, 0.4, 0.06, 0.02), shade(blue, -0.45), { mottle: 0.1, rim: 0 });
      b.paint(b.circle(0.36, 0.52, 0.07), P.cream, { mottle: 0.2, rim: 0 });
      b.glow(0.2, 0.16, 0.12, '#ffffff', 0.35);
    },
  },

  'street-sign': {
    w: 1.0,
    h: 1.55,
    paint(b) {
      b.paint(b.rect(0.45, 0.06, 0.09, 1.49, 0.03), P.slate, { mottle: 0.4 });
      b.paint(b.circle(0.495, 0.06, 0.06), P.slate, { mottle: 0.2 });
      b.paint(b.rect(0.0, 0.14, 1.0, 0.22, 0.04), P.leafDeep, { mottle: 0.5, light: 0.25 });
      b.stroke(b.rect(0.03, 0.165, 0.94, 0.17, 0.03, 0.3), P.cream, 0.012, 0.8);
      b.text('BROADWAY', 0.5, 0.25, 0.085, P.cream, { weight: 700, maxWidth: 0.86 });
      b.paint(b.rect(0.2, 0.42, 0.6, 0.18, 0.04), P.leafDeep, { mottle: 0.5, light: 0.25 });
      b.text('5 AV', 0.5, 0.51, 0.08, P.cream, { weight: 700 });
      b.paint(b.rect(0.3, 1.47, 0.39, 0.08, 0.03), P.charcoal, { mottle: 0.3 });
    },
  },

  bus: {
    w: 2.35,
    h: 1.2,
    paint(b) {
      const body = P.cream;
      b.paint(b.rect(0.03, 0.08, 2.28, 0.92, 0.16), body, { shadow: 0.45 });
      b.paint(b.rect(0.03, 0.62, 2.28, 0.14, 0.02, 0.6), P.sky, { mottle: 0.6 });
      b.paint(b.rect(0.03, 0.08, 2.28, 0.1, 0.06, 0.4), P.sky, { mottle: 0.4 });
      for (let i = 0; i < 5; i++) b.paint(b.rect(0.14 + i * 0.33, 0.24, 0.27, 0.3, 0.04), P.skyPale, { mottle: 0.5, rim: 0.15 });
      b.paint(b.rect(1.85, 0.22, 0.4, 0.36, 0.06), P.skyPale, { mottle: 0.5, rim: 0.15 });
      b.paint(b.rect(1.86, 0.11, 0.36, 0.08, 0.02), P.butter, { mottle: 0.2, rim: 0 });
      b.text('M15', 2.04, 0.15, 0.05, P.ink, { weight: 700 });
      b.paint(b.rect(1.82, 0.6, 0.02, 0.3, 0.01), P.slate, { mottle: 0 });
      b.paint(b.ellipse(2.24, 0.82, 0.05, 0.05), P.butter, { rim: 0 });
      b.glow(2.3, 0.82, 0.18, P.butter, 0.45);
      wheel(b, 0.52, 1.0, 0.19);
      wheel(b, 1.78, 1.0, 0.19);
    },
  },

  bicycle: {
    w: 1.5,
    h: 1.0,
    paint(b) {
      const frame = P.raspberry;
      for (const cx of [0.33, 1.17]) {
        b.stroke(b.circle(cx, 0.68, 0.3, 0.3), P.charcoal, 0.055);
        b.stroke(b.circle(cx, 0.68, 0.25, 0.2), P.stone, 0.012, 0.7);
        for (let a = 0; a < Math.PI; a += Math.PI / 6) {
          b.line([[cx - Math.cos(a) * 0.25, 0.68 - Math.sin(a) * 0.25], [cx + Math.cos(a) * 0.25, 0.68 + Math.sin(a) * 0.25]], P.stone, 0.008, { wobble: 0, alpha: 0.7 });
        }
        b.flat(b.circle(cx, 0.68, 0.035, 0), P.charcoal);
      }
      const tube = 0.045;
      b.line([[0.33, 0.68], [0.68, 0.7]], frame, tube, { wobble: 0.2 });
      b.line([[0.33, 0.68], [0.6, 0.34]], frame, tube, { wobble: 0.2 });
      b.line([[0.68, 0.7], [0.58, 0.28]], frame, tube, { wobble: 0.2 });
      b.line([[0.6, 0.36], [1.02, 0.36]], frame, tube, { wobble: 0.2 });
      b.line([[0.68, 0.7], [1.02, 0.38]], frame, tube, { wobble: 0.2 });
      b.line([[1.02, 0.3], [1.17, 0.68]], frame, tube, { wobble: 0.2 });
      b.line([[1.02, 0.32], [0.98, 0.17], [1.12, 0.15]], P.charcoal, 0.035, { wobble: 0.2 });
      b.paint(b.ellipse(0.58, 0.25, 0.1, 0.04), P.ink, { mottle: 0.2, rim: 0 });
      b.paint(b.circle(0.68, 0.7, 0.06), P.stone, { mottle: 0.2, rim: 0 });
      b.paint(b.rect(1.06, 0.2, 0.26, 0.16, 0.03), P.wood, { mottle: 0.6 });
      b.paint(b.circle(1.12, 0.17, 0.05), P.pink, { rim: 0 });
      b.paint(b.circle(1.22, 0.15, 0.05), P.butter, { rim: 0 });
      b.paint(b.circle(1.28, 0.19, 0.04), P.rose, { rim: 0 });
    },
  },

  tree: {
    w: 1.5,
    h: 2.0,
    paint(b) {
      b.paint(b.poly([[0.62, 2.0], [0.68, 1.2], [0.6, 0.95], [0.72, 1.0], [0.75, 0.85], [0.8, 1.0], [0.92, 0.92], [0.84, 1.2], [0.9, 2.0]], { smooth: true }), P.woodDeep, { mottle: 0.7 });
      const blobs: [number, number, number, string][] = [
        [0.42, 0.85, 0.36, P.leafDeep],
        [1.08, 0.85, 0.36, P.leafDeep],
        [0.75, 0.95, 0.4, P.leaf],
        [0.5, 0.52, 0.38, P.leaf],
        [1.0, 0.5, 0.38, P.sage],
        [0.76, 0.3, 0.32, P.sage],
        [0.75, 0.62, 0.32, P.mint],
      ];
      for (const [x, y, r, c] of blobs) b.paint(b.circle(x, y, r, 1.6), c, { mottle: 1.2, shadow: 0.38 });
      const canopy = b.ellipse(0.75, 0.65, 0.7, 0.6, 0);
      b.speckle(canopy, P.mint, 40, 0.035, 0.45);
      b.speckle(canopy, P.leafDeep, 30, 0.03, 0.35);
      b.paint(b.circle(0.55, 0.62, 0.035), P.pink, { rim: 0 });
      b.paint(b.circle(0.98, 0.42, 0.035), P.pink, { rim: 0 });
      b.paint(b.circle(0.84, 0.88, 0.035), P.pink, { rim: 0 });
    },
  },

  dog: {
    w: 1.3,
    h: 0.95,
    paint(b) {
      const fur = P.apricot;
      const dark = shade(fur, -0.3);
      b.line([[0.22, 0.42], [0.1, 0.26], [0.14, 0.14]], fur, 0.08);
      b.paint(b.rect(0.3, 0.6, 0.11, 0.33, 0.05), dark, { mottle: 0.4 });
      b.paint(b.rect(0.8, 0.6, 0.11, 0.33, 0.05), dark, { mottle: 0.4 });
      b.paint(b.ellipse(0.6, 0.53, 0.42, 0.21), fur);
      b.paint(b.rect(0.42, 0.62, 0.11, 0.31, 0.05), fur, { mottle: 0.4 });
      b.paint(b.rect(0.92, 0.62, 0.11, 0.31, 0.05), fur, { mottle: 0.4 });
      b.paint(b.ellipse(0.65, 0.62, 0.25, 0.09), P.cream, { mottle: 0.3, alpha: 0.85, rim: 0 });
      b.paint(b.circle(1.03, 0.32, 0.22), fur);
      b.paint(b.ellipse(1.2, 0.4, 0.12, 0.085), P.cream, { mottle: 0.3 });
      b.flat(b.ellipse(1.29, 0.36, 0.045, 0.035), P.ink);
      b.paint(b.ellipse(0.9, 0.3, 0.08, 0.17, 1, 0.35), dark, { mottle: 0.4 });
      b.flat(b.ellipse(1.08, 0.28, 0.03, 0.035), P.ink);
      b.flat(b.circle(1.09, 0.27, 0.01, 0), '#fff', 0.9);
      b.paint(b.ellipse(1.2, 0.5, 0.035, 0.05), P.rose, { rim: 0 });
      b.line([[0.86, 0.46], [1.0, 0.5]], P.raspberry, 0.05);
      b.glow(1.12, 0.38, 0.06, P.pink, 0.5);
    },
  },

  'trash-can': {
    w: 0.62,
    h: 0.78,
    paint(b) {
      const can = P.sage;
      b.paint(b.poly([[0.06, 0.16], [0.56, 0.16], [0.5, 0.78], [0.12, 0.78]], { wobble: 0.6 }), can);
      for (let x = 0.15; x < 0.5; x += 0.07) b.line([[x, 0.2], [x + (0.31 - x) * 0.1, 0.74]], shade(can, -0.3), 0.014, { alpha: 0.6 });
      b.paint(b.ellipse(0.31, 0.15, 0.28, 0.07), shade(can, -0.15), { mottle: 0.3 });
      b.paint(b.rect(0.25, 0.04, 0.12, 0.06, 0.03), shade(can, -0.3), { mottle: 0.2 });
      b.paint(b.poly([[0.32, 0.14], [0.36, 0.0], [0.46, 0.05], [0.4, 0.15]], { smooth: true }), P.pink, { alpha: 0.8 });
    },
  },

  pedestrian: {
    w: 0.62,
    h: 1.2,
    paint(b) {
      const coat = P.lavender;
      const skin = '#f3c4a6';
      b.line([[0.28, 0.75], [0.16, 1.15]], P.charcoal, 0.09);
      b.line([[0.34, 0.75], [0.48, 1.14]], P.charcoal, 0.09);
      b.paint(b.ellipse(0.14, 1.16, 0.08, 0.04), P.ink, { rim: 0 });
      b.paint(b.ellipse(0.52, 1.15, 0.08, 0.04), P.ink, { rim: 0 });
      b.line([[0.42, 0.42], [0.52, 0.66]], shade(coat, -0.2), 0.08);
      b.paint(b.poly([[0.16, 0.38], [0.46, 0.38], [0.52, 0.84], [0.1, 0.84]], { smooth: true }), coat);
      b.line([[0.2, 0.42], [0.08, 0.66]], coat, 0.08);
      b.paint(b.circle(0.08, 0.68, 0.04), skin, { rim: 0 });
      b.paint(b.rect(0.44, 0.6, 0.14, 0.15, 0.03), P.butter, { mottle: 0.3 });
      b.line([[0.2, 0.38], [0.42, 0.38], [0.44, 0.52]], P.raspberry, 0.06);
      b.paint(b.circle(0.31, 0.24, 0.14), skin, { mottle: 0.4, rim: 0.15 });
      b.paint(b.ellipse(0.29, 0.14, 0.16, 0.08), P.woodDeep, { mottle: 0.4 });
      b.flat(b.circle(0.36, 0.24, 0.016, 0), P.ink);
      b.glow(0.38, 0.29, 0.04, P.rose, 0.5);
    },
  },

  // --- Decor -------------------------------------------------------------

  'building-brownstone': {
    w: 1.95,
    h: 2.7,
    paint(b) {
      const wall = P.salmon;
      b.paint(b.rect(0.0, 0.15, 1.95, 2.55, 0.03, 0.6), wall, { mottle: 1.3, shadow: 0.25 });
      b.paint(b.rect(-0.04, 0.05, 2.03, 0.16, 0.02, 0.5), shade(wall, 0.35), { mottle: 0.4 });
      b.speckle(b.rect(0, 0.2, 1.95, 2.5, 0, 0), shade(wall, -0.2), 160, 0.012, 0.35);
      windows(b, 0.2, 0.42, 3, 3, 0.36, 0.42, 0.22, 0.2, { lit: 0.2 });
      for (let c = 0; c < 3; c++) b.paint(b.rect(0.16 + c * 0.58, 1.3, 0.44, 0.08, 0.02), P.pink, { mottle: 0.5 });
      b.paint(b.poly([[0.62, 2.7], [0.72, 2.25], [1.23, 2.25], [1.33, 2.7]], { wobble: 0.5 }), P.stone, { mottle: 0.6 });
      for (let i = 1; i < 4; i++) b.line([[0.66 + i * 0.02, 2.25 + i * 0.11], [1.29 - i * 0.02, 2.25 + i * 0.11]], shade(P.stone, -0.3), 0.012);
      b.paint(b.rect(0.82, 1.8, 0.3, 0.45, 0.12), P.woodDeep, { mottle: 0.5 });
      b.flat(b.circle(1.07, 2.03, 0.02, 0), P.butter);
    },
  },

  'building-apartment': {
    w: 2.05,
    h: 3.5,
    paint(b) {
      const wall = P.lavender;
      // Water tower.
      b.line([[1.33, 0.62], [1.29, 0.82]], P.woodDeep, 0.025);
      b.line([[1.67, 0.62], [1.71, 0.82]], P.woodDeep, 0.025);
      b.line([[1.5, 0.62], [1.5, 0.82]], P.woodDeep, 0.02);
      b.paint(b.rect(1.3, 0.3, 0.4, 0.34, 0.06), P.wood, { mottle: 0.8 });
      for (let y = 0.38; y < 0.62; y += 0.08) b.line([[1.31, y], [1.69, y]], P.woodDeep, 0.01, { alpha: 0.6 });
      b.paint(b.poly([[1.26, 0.32], [1.5, 0.1], [1.74, 0.32]], { wobble: 0.5 }), P.woodDeep, { mottle: 0.5 });
      b.paint(b.rect(0.0, 0.8, 2.05, 2.7, 0.03, 0.6), wall, { mottle: 1.3 });
      b.paint(b.rect(-0.04, 0.74, 2.13, 0.12, 0.02, 0.4), shade(wall, 0.35), { mottle: 0.4 });
      windows(b, 0.18, 1.0, 4, 5, 0.3, 0.3, 0.17, 0.16, { lit: 0.25 });
      b.paint(b.rect(0.82, 3.0, 0.4, 0.5, 0.1), P.raspberry, { mottle: 0.4 });
      b.paint(b.rect(0.7, 2.86, 0.64, 0.14, 0.04), P.rose, { mottle: 0.4 });
    },
  },

  'building-shop': {
    w: 2.1,
    h: 2.5,
    paint(b) {
      const wall = P.skyLight;
      b.paint(b.rect(0.0, 0.1, 2.1, 2.4, 0.03, 0.6), wall, { mottle: 1.2 });
      b.paint(b.rect(-0.04, 0.02, 2.18, 0.14, 0.02, 0.4), shade(wall, 0.4), { mottle: 0.3 });
      windows(b, 0.24, 0.32, 3, 2, 0.38, 0.36, 0.28, 0.18, { lit: 0.3 });
      b.paint(b.rect(0.1, 1.3, 1.9, 0.22, 0.03), P.cream, { mottle: 0.4 });
      b.text('CAFÉ', 1.05, 1.41, 0.13, P.raspberry, { weight: 700 });
      // Striped awning.
      const stripes = 9;
      for (let i = 0; i < stripes; i++) {
        const x0 = 0.05 + (i * 2.0) / stripes;
        const x1 = 0.05 + ((i + 1) * 2.0) / stripes;
        b.paint(b.poly([[x0 + 0.02, 1.56], [x1 + 0.02, 1.56], [x1, 1.82], [x0, 1.82]], { wobble: 0.3 }), i % 2 ? P.cream : P.raspberry, { mottle: 0.3, rim: 0.1 });
        b.paint(b.ellipse((x0 + x1) / 2, 1.82, (x1 - x0) / 2, 0.05, 0.2), i % 2 ? P.cream : P.raspberry, { mottle: 0.2, rim: 0 });
      }
      b.paint(b.rect(0.12, 1.92, 1.1, 0.58, 0.03), P.skyPale, { mottle: 0.5 });
      b.paint(b.ellipse(0.4, 2.36, 0.14, 0.1), P.peach, { rim: 0.1 });
      b.paint(b.ellipse(0.75, 2.38, 0.12, 0.08), P.pink, { rim: 0.1 });
      b.paint(b.ellipse(1.0, 2.36, 0.12, 0.1), P.butter, { rim: 0.1 });
      b.glow(0.4, 2.1, 0.25, '#ffffff', 0.35);
      b.paint(b.rect(1.42, 1.92, 0.42, 0.58, 0.04), P.woodDeep, { mottle: 0.5 });
      b.paint(b.rect(1.49, 1.98, 0.28, 0.25, 0.03), P.skyPale, { mottle: 0.3, rim: 0 });
    },
  },

  'building-tall': {
    w: 1.8,
    h: 3.1,
    paint(b) {
      const wall = P.peach;
      b.paint(b.rect(0.6, 0.0, 0.6, 0.3, 0.04), shade(wall, 0.15), { mottle: 0.5 });
      b.paint(b.rect(0.35, 0.22, 1.1, 0.3, 0.04), wall, { mottle: 0.6 });
      b.paint(b.rect(0.1, 0.45, 1.6, 2.65, 0.03, 0.6), wall, { mottle: 1.3 });
      for (let c = 0; c < 5; c++) {
        b.paint(b.rect(0.24 + c * 0.28, 0.6, 0.14, 2.1, 0.03, 0.4), P.periwinkle, { mottle: 0.8, shadow: 0.2, rim: 0.15 });
        for (let y = 0.8; y < 2.7; y += 0.25) b.line([[0.24 + c * 0.28, y], [0.38 + c * 0.28, y]], P.cream, 0.02, { alpha: 0.7 });
      }
      b.paint(b.rect(0.65, 2.82, 0.5, 0.28, 0.08), P.rose, { mottle: 0.4 });
      b.paint(b.rect(0.5, 2.72, 0.8, 0.1, 0.03), P.raspberry, { mottle: 0.4 });
    },
  },

  'construction-barrier': {
    w: 1.1,
    h: 0.5,
    paint(b) {
      b.paint(b.rect(0.12, 0.2, 0.06, 0.3, 0.02), P.slate, { mottle: 0.2 });
      b.paint(b.rect(0.92, 0.2, 0.06, 0.3, 0.02), P.slate, { mottle: 0.2 });
      const board = b.rect(0.0, 0.08, 1.1, 0.18, 0.03);
      b.paint(board, P.cream, { mottle: 0.3 });
      b.ctx.save();
      b.ctx.clip(board.path);
      for (let x = -0.2; x < 1.2; x += 0.2) b.flat(b.poly([[x, 0.28], [x + 0.1, 0.28], [x + 0.2, 0.06], [x + 0.1, 0.06]], { wobble: 0.3 }), P.orange);
      b.ctx.restore();
      b.paint(b.circle(0.15, 0.04, 0.04), P.apricot, { rim: 0 });
      b.glow(0.15, 0.04, 0.1, P.butter, 0.5);
    },
  },

  'fire-hydrant': {
    w: 0.48,
    h: 0.5,
    paint(b) {
      const red = P.raspberry;
      b.paint(b.rect(0.06, 0.42, 0.36, 0.08, 0.02), shade(red, -0.2), { mottle: 0.3 });
      b.paint(b.rect(0.12, 0.14, 0.24, 0.3, 0.04), red);
      b.paint(b.ellipse(0.24, 0.13, 0.14, 0.09), red);
      b.paint(b.circle(0.24, 0.04, 0.04), shade(red, -0.15), { rim: 0 });
      b.paint(b.rect(0.0, 0.2, 0.12, 0.09, 0.03), red, { mottle: 0.3 });
      b.paint(b.rect(0.36, 0.2, 0.12, 0.09, 0.03), red, { mottle: 0.3 });
      b.glow(0.18, 0.16, 0.05, '#ffffff', 0.4);
    },
  },

  'lamp-post': {
    w: 0.55,
    h: 1.9,
    paint(b) {
      b.paint(b.rect(0.24, 0.32, 0.07, 1.5, 0.03), P.charcoal, { mottle: 0.4 });
      b.paint(b.rect(0.17, 1.78, 0.21, 0.12, 0.04), P.charcoal, { mottle: 0.3 });
      b.glow(0.275, 0.2, 0.35, P.butter, 0.45);
      b.paint(b.poly([[0.12, 0.08], [0.43, 0.08], [0.36, 0.32], [0.19, 0.32]], { smooth: true }), P.butter, { mottle: 0.3, light: 0.5 });
      b.paint(b.poly([[0.08, 0.1], [0.275, 0.0], [0.47, 0.1]], { smooth: true }), P.charcoal, { mottle: 0.2 });
    },
  },

  bench: {
    w: 1.2,
    h: 0.58,
    paint(b) {
      b.paint(b.rect(0.12, 0.3, 0.06, 0.28, 0.02), P.charcoal, { mottle: 0.2 });
      b.paint(b.rect(1.02, 0.3, 0.06, 0.28, 0.02), P.charcoal, { mottle: 0.2 });
      for (let i = 0; i < 2; i++) b.paint(b.rect(0.0, 0.02 + i * 0.1, 1.2, 0.07, 0.02), P.wood, { mottle: 0.5 });
      b.paint(b.rect(0.0, 0.28, 1.2, 0.07, 0.02), P.woodDeep, { mottle: 0.5 });
    },
  },

  // --- Park and plaza -----------------------------------------------------

  pond: {
    w: 1.6,
    h: 0.66,
    paint(b) {
      const bank = b.ellipse(0.8, 0.38, 0.78, 0.27, 1.2);
      b.paint(bank, P.sage, { mottle: 0.8, rim: 0.15 });
      const water = b.ellipse(0.8, 0.4, 0.68, 0.21, 1);
      b.paint(water, P.skyLight, { mottle: 1, light: 0.35 });
      b.ctx.save();
      b.ctx.clip(water.path);
      for (const [x, y] of [[0.4, 0.34], [0.9, 0.46], [1.2, 0.36]] as [number, number][]) {
        b.line([[x, y], [x + 0.08, y - 0.01], [x + 0.16, y]], P.white, 0.012, { alpha: 0.7 });
      }
      b.ctx.restore();
      for (const [x, y, r] of [[0.32, 0.44, 0.07], [1.3, 0.46, 0.06], [1.12, 0.3, 0.05]] as [number, number, number][]) {
        b.paint(b.ellipse(x, y, r, r * 0.45, 0.3), P.leaf, { mottle: 0.4, rim: 0.15 });
      }
      b.paint(b.circle(1.32, 0.43, 0.025, 0.2), P.pink, { rim: 0 });
      // A duck and her duckling.
      const duck = (x: number, y: number, s: number, body: string) => {
        b.paint(b.ellipse(x, y, 0.13 * s, 0.07 * s, 0.3), body, { mottle: 0.3 });
        b.paint(b.poly([[x - 0.12 * s, y - 0.02 * s], [x - 0.2 * s, y - 0.09 * s], [x - 0.1 * s, y - 0.06 * s]], { wobble: 0.2 }), body, { rim: 0 });
        b.paint(b.circle(x + 0.1 * s, y - 0.1 * s, 0.055 * s, 0.2), s > 0.8 ? P.leafDeep : body, { rim: 0.1 });
        b.paint(b.poly([[x + 0.14 * s, y - 0.1 * s], [x + 0.22 * s, y - 0.08 * s], [x + 0.14 * s, y - 0.06 * s]], { wobble: 0.1 }), P.orange, { rim: 0 });
        b.flat(b.circle(x + 0.11 * s, y - 0.115 * s, 0.012 * s, 0), P.ink);
      };
      duck(0.72, 0.4, 1, P.cream);
      duck(0.98, 0.43, 0.6, P.butter);
      for (let i = 0; i < 7; i++) b.line([[0.08 + i * 0.03, 0.4], [0.06 + i * 0.035, 0.18 + (i % 3) * 0.04]], i % 2 ? P.leafDeep : P.leaf, 0.016);
      b.paint(b.ellipse(0.1, 0.15, 0.02, 0.05, 0.2), P.woodDeep, { rim: 0 });
    },
  },

  fountain: {
    w: 1.15,
    h: 1.0,
    paint(b) {
      b.paint(b.ellipse(0.575, 0.84, 0.56, 0.15, 0.6), P.stone, { mottle: 0.6 });
      b.paint(b.ellipse(0.575, 0.8, 0.48, 0.1, 0.6), P.skyLight, { mottle: 0.6, light: 0.4 });
      b.paint(b.rect(0.03, 0.82, 1.09, 0.14, 0.05, 0.4), P.cream, { mottle: 0.5 });
      b.paint(b.rect(0.5, 0.42, 0.15, 0.42, 0.04, 0.3), P.cream, { mottle: 0.4 });
      b.paint(b.ellipse(0.575, 0.42, 0.26, 0.06, 0.4), P.cream, { mottle: 0.4, rim: 0.15 });
      b.paint(b.ellipse(0.575, 0.4, 0.21, 0.035, 0.4), P.skyLight, { rim: 0 });
      // Water arcs from the top spout down into both bowls.
      for (const s of [-1, 1]) {
        b.line([[0.575, 0.16], [0.575 + s * 0.12, 0.08], [0.575 + s * 0.22, 0.24], [0.575 + s * 0.26, 0.4]], P.skyLight, 0.03, { alpha: 0.85 });
        b.line([[0.575 + s * 0.26, 0.42], [0.575 + s * 0.38, 0.52], [0.575 + s * 0.42, 0.78]], P.skyLight, 0.025, { alpha: 0.75 });
      }
      b.line([[0.575, 0.4], [0.575, 0.12]], P.skyPale, 0.04, { alpha: 0.9 });
      for (const [x, y] of [[0.3, 0.7], [0.86, 0.66], [0.2, 0.6], [0.95, 0.58], [0.575, 0.06]] as [number, number][]) {
        b.paint(b.circle(x, y, 0.018, 0.2), P.white, { rim: 0.2 });
      }
    },
  },

  pigeon: {
    w: 0.62,
    h: 0.5,
    paint(b) {
      for (const x of [0.28, 0.36]) b.line([[x, 0.38], [x - 0.01, 0.48]], P.rose, 0.018, { wobble: 0 });
      b.paint(b.poly([[0.1, 0.3], [0.02, 0.24], [0.04, 0.34], [0.14, 0.36]], { smooth: true }), P.slate, { rim: 0 });
      b.paint(b.ellipse(0.3, 0.3, 0.2, 0.11, 0.3, -0.15), P.stone, { mottle: 0.5 });
      b.paint(b.ellipse(0.26, 0.28, 0.12, 0.07, 0.3, -0.3), P.slate, { mottle: 0.4, rim: 0.1 });
      for (const y of [0.3, 0.33]) b.line([[0.2, y], [0.32, y - 0.01]], P.charcoal, 0.01, { alpha: 0.6, wobble: 0 });
      b.paint(b.ellipse(0.46, 0.22, 0.07, 0.08, 0.2), P.teal, { mottle: 0.4, rim: 0 });
      b.paint(b.circle(0.5, 0.14, 0.065, 0.2), P.slate, { mottle: 0.3, rim: 0.1 });
      b.paint(b.poly([[0.55, 0.13], [0.62, 0.15], [0.55, 0.16]], { wobble: 0.1 }), P.butter, { rim: 0 });
      b.flat(b.circle(0.52, 0.12, 0.014, 0), P.ember);
    },
  },

  'hot-dog-stand': {
    w: 1.2,
    h: 1.35,
    paint(b) {
      b.line([[0.6, 0.2], [0.6, 0.6]], P.stone, 0.025, { wobble: 0 });
      canopy(b, 0.6, 0.24, 0.02, 0.55, [P.skyDeep, P.butter, P.skyDeep, P.butter, P.skyDeep, P.butter]);
      b.paint(b.rect(0.1, 0.58, 1.0, 0.5, 0.05, 0.4), P.cream, { mottle: 0.5 });
      b.paint(b.rect(0.1, 0.58, 1.0, 0.1, 0.04, 0.3), P.stone, { mottle: 0.3 });
      // A big painted hot dog on the side of the cart.
      b.paint(b.ellipse(0.6, 0.86, 0.3, 0.08, 0.3), P.apricot, { mottle: 0.4 });
      b.paint(b.ellipse(0.6, 0.83, 0.35, 0.045, 0.2), P.raspberry, { mottle: 0.3, rim: 0.1 });
      b.line([[0.34, 0.82], [0.42, 0.8], [0.5, 0.83], [0.58, 0.8], [0.66, 0.83], [0.74, 0.8], [0.84, 0.82]], P.yellow, 0.02, { wobble: 0 });
      b.paint(b.ellipse(0.6, 0.9, 0.3, 0.05, 0.3), shade(P.apricot, -0.08), { rim: 0 });
      b.paint(b.rect(0.12, 0.5, 0.2, 0.08, 0.02, 0.2), P.raspberry, { rim: 0 });
      b.paint(b.rect(0.88, 0.48, 0.08, 0.1, 0.02, 0.2), P.yellow, { rim: 0 });
      b.line([[1.1, 0.7], [1.2, 0.62]], P.charcoal, 0.03, { wobble: 0 });
      wheel(b, 0.3, 1.16, 0.17, P.stone);
      wheel(b, 0.92, 1.16, 0.17, P.stone);
      b.line([[0.6, 1.08], [0.6, 1.33]], P.charcoal, 0.03, { wobble: 0 });
    },
  },
};
