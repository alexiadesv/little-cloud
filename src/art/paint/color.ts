export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function mix(a: string, b: string, t: number): string {
  return rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), t));
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
}

/** Storybook shadows lean towards periwinkle instead of black; highlights towards warm paper. */
const SHADOW = '#5b54a6';
const LIGHT = '#fffaf2';

/** amount > 0 lightens towards warm paper, amount < 0 darkens towards a lavender shadow. */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mix(hex, LIGHT, amount) : mix(hex, SHADOW, -amount);
}

/** Palette sampled from the reference painting and extended for the three pages. */
export const P = {
  paper: '#f6f3ec',
  cream: '#fbf6ec',
  white: '#fffdf8',
  ink: '#3d3a5c',
  inkSoft: '#5e5885',

  sky: '#6aaee0',
  skyLight: '#8fc6ea',
  skyPale: '#bfe0f2',
  skyDeep: '#4f8fd0',
  periwinkle: '#8aa6e6',

  lavender: '#b8a8e6',
  lavenderDeep: '#9585d4',
  lilac: '#d4c4ee',

  raspberry: '#d93a6e',
  rose: '#e8658f',
  pink: '#f2a7bf',
  blush: '#f6c6d2',

  salmon: '#f0a296',
  peach: '#f5bf98',
  apricot: '#f4a861',
  orange: '#ef9443',
  butter: '#f6d77a',
  yellow: '#f5c84c',

  mint: '#a8dcc6',
  sage: '#8fcaa8',
  leaf: '#6fbf93',
  leafDeep: '#4fa27f',
  teal: '#6cc0bd',

  sand: '#f3d9b1',
  sandDeep: '#e8c08e',
  wood: '#c98f6b',
  woodDeep: '#a46e57',
  stone: '#b9b3cf',
  slate: '#8d88ad',
  charcoal: '#4b4770',

  // Night market: lantern light against dusky violet.
  plum: '#8a62b0',
  dusk: '#6b5ca8',
  night: '#4f4b92',
  gold: '#f0b54a',
  ember: '#e6564f',
  magenta: '#cf4f93',
  terracotta: '#d9805f',
} as const;
