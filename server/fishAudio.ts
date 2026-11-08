import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GREETINGS, LANGUAGE_CODES, languageInfo } from '../src/data/languages.ts';
import { LEVELS, NARRATION, wordFor } from '../src/data/levels/index.ts';
import type { LangCode } from '../src/data/types.ts';

const API_URL = 'https://api.fish.audio/v1/tts';

/** Little Cloud's own voice model on Fish Audio; FISH_AUDIO_VOICE_ID overrides it. */
export const LITTLE_CLOUD_VOICE = '273667dee5fd4723a9f8a71c2cd4ab6c';

export interface FishConfig {
  apiKey: string;
  model: string;
  defaultVoice: string;
  voices: Partial<Record<LangCode, string>>;
  speed: number;
}

export class FishAudioError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function readFishConfig(env: Record<string, string | undefined>): FishConfig | null {
  const apiKey = env.FISH_AUDIO_API_KEY?.trim();
  if (!apiKey) return null;
  const voices: Partial<Record<LangCode, string>> = {};
  for (const lang of LANGUAGE_CODES) {
    const info = languageInfo(lang);
    const envKey = `FISH_AUDIO_VOICE_ID_${lang.replace('-', '_').toUpperCase()}`;
    voices[lang] = env[envKey]?.trim() || info.voiceId;
  }
  const speed = Number(env.FISH_AUDIO_SPEED ?? '0.9');
  return {
    apiKey,
    model: env.FISH_AUDIO_MODEL?.trim() || 's2.1-pro',
    defaultVoice: env.FISH_AUDIO_VOICE_ID?.trim() || LITTLE_CLOUD_VOICE,
    voices,
    speed: Number.isFinite(speed) ? Math.min(2, Math.max(0.5, speed)) : 0.9,
  };
}

export async function synthesize(cfg: FishConfig, text: string, lang: LangCode): Promise<Buffer> {
  const voice = cfg.voices[lang] ?? languageInfo(lang).voiceId ?? cfg.defaultVoice;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      model: cfg.model,
    },
    body: JSON.stringify({
      text,
      reference_id: voice,
      format: 'mp3',
      mp3_bitrate: 128,
      normalize: true,
      language: languageInfo(lang).fishTag,
      latency: 'normal',
      prosody: { speed: cfg.speed, volume: 0 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new FishAudioError(res.status, `Fish Audio responded ${res.status}: ${detail.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const inflight = new Map<string, Promise<Buffer>>();

/** Synthesizes once per (model, voice, speed, language, text) and keeps the MP3 on disk. */
export function cachedSynthesize(cfg: FishConfig, text: string, lang: LangCode, cacheDir: string): Promise<Buffer> {
  const voice = cfg.voices[lang] ?? languageInfo(lang).voiceId ?? cfg.defaultVoice;
  const key = createHash('sha1').update(JSON.stringify([cfg.model, voice, cfg.speed, lang, text])).digest('hex');
  const existing = inflight.get(key);
  if (existing) return existing;
  const file = path.join(cacheDir, `${key}.mp3`);
  const job = (async () => {
    try {
      return await readFile(file);
    } catch {
      const audio = await synthesize(cfg, text, lang);
      await mkdir(cacheDir, { recursive: true });
      await writeFile(file, audio);
      return audio;
    }
  })();
  inflight.set(key, job);
  job.finally(() => inflight.delete(key)).catch(() => undefined);
  return job;
}

/** Every phrase the game can ask for, so the proxy can't be used as a general-purpose TTS. */
export function vocabulary(): Map<LangCode, Set<string>> {
  const vocab = new Map<LangCode, Set<string>>(LANGUAGE_CODES.map((l) => [l, new Set<string>()]));
  for (const level of LEVELS) {
    for (const obj of level.objects) {
      for (const lang of LANGUAGE_CODES) vocab.get(lang)!.add(wordFor(obj, lang));
    }
  }
  for (const line of NARRATION) {
    vocab.get('en')!.add(line.text);
    vocab.get('en-gb')!.add(line.text);
  }
  for (const lang of LANGUAGE_CODES) vocab.get(lang)!.add(GREETINGS[lang]);
  return vocab;
}
