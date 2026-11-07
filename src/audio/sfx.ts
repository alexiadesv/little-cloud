import { audio } from './AudioEngine';

/** Soft synthesized sound effects — no files needed, all gentle and short. */

function env(gain: GainNode, at: number, peak: number, attack: number, release: number) {
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
}

function tone(freq: number, at: number, { type = 'sine' as OscillatorType, peak = 0.2, attack = 0.01, release = 0.6, to }: { type?: OscillatorType; peak?: number; attack?: number; release?: number; to?: number } = {}) {
  const ctx = audio.context;
  const bus = audio.sfx;
  if (!ctx || !bus) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + attack + release * 0.6);
  env(g, at, peak, attack, release);
  osc.connect(g).connect(bus);
  osc.start(at);
  osc.stop(at + attack + release + 0.05);
}

let noiseBuffer: AudioBuffer | null = null;
function noise(at: number, duration: number, { from, to, q = 1.2, peak = 0.15, type = 'bandpass' as BiquadFilterType }: { from: number; to: number; q?: number; peak?: number; type?: BiquadFilterType }) {
  const ctx = audio.context;
  const bus = audio.sfx;
  if (!ctx || !bus) return;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, at);
  filter.frequency.exponentialRampToValueAtTime(to, at + duration);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + duration * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  src.connect(filter).connect(g).connect(bus);
  src.start(at);
  src.stop(at + duration + 0.05);
}

const now = () => audio.context?.currentTime ?? 0;

export const sfx = {
  /** Object tapped. */
  pop() {
    const t = now();
    tone(620, t, { peak: 0.18, release: 0.18, to: 260 });
  },
  /** The cloud swirls into a new shape. */
  whoosh() {
    const t = now();
    noise(t, 0.9, { from: 280, to: 2600, q: 0.8, peak: 0.12 });
    tone(880, t + 0.35, { type: 'triangle', peak: 0.05, release: 0.8, to: 1320 });
  },
  /** A brand-new word discovered. */
  chime() {
    const t = now();
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.085, { type: 'sine', peak: 0.11, release: 1.1 }));
  },
  /** Tapping the cloud itself. */
  boing() {
    const t = now();
    tone(240, t, { type: 'sine', peak: 0.2, release: 0.35, to: 520 });
    tone(520, t + 0.12, { type: 'triangle', peak: 0.06, release: 0.3, to: 300 });
  },
  /** Tapping scenery that isn't a word. */
  tick() {
    const t = now();
    tone(980, t, { type: 'triangle', peak: 0.07, release: 0.12 });
  },
  pageTurn() {
    const t = now();
    noise(t, 0.55, { from: 3200, to: 500, q: 0.6, peak: 0.1, type: 'lowpass' });
  },
  fanfare() {
    const t = now();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, t + i * 0.11, { type: 'triangle', peak: 0.1, release: 0.9 }));
    [523.25, 659.25, 783.99].forEach((f) => tone(f * 2, t + 0.7, { type: 'sine', peak: 0.06, release: 1.8 }));
  },
};
