import { tmpdir } from 'node:os';
import path from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isLangCode } from '../../src/data/languages.ts';
import type { LangCode } from '../../src/data/types.ts';
import { FishAudioError, cachedSynthesize, readFishConfig, vocabulary } from '../../server/fishAudio.ts';

const vocab = vocabulary();
const cacheDir = path.join(tmpdir(), 'little-cloud-tts');

/** GET /api/tts?lang=xx&text=...&voice=... — Fish Audio proxy for the Vercel deploy. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const cfg = readFishConfig(process.env);

  // Status probe (also served from /api/tts/status) so clients know Fish is wired.
  const wantsStatus =
    req.query.status === '1' ||
    req.query.status === 'true' ||
    (typeof req.query.lang !== 'string' && typeof req.query.text !== 'string');
  if (wantsStatus) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ enabled: !!cfg, model: cfg?.model ?? null });
    return;
  }

  if (!cfg) {
    res.status(503).json({ error: 'FISH_AUDIO_API_KEY is not configured' });
    return;
  }

  const lang = typeof req.query.lang === 'string' ? req.query.lang : '';
  const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
  if (!isLangCode(lang)) {
    res.status(400).json({ error: 'Unknown language' });
    return;
  }
  if (!vocab.get(lang as LangCode)?.has(text)) {
    res.status(404).json({ error: 'Not a word in this book' });
    return;
  }

  const voice = typeof req.query.voice === 'string' ? req.query.voice.trim() : undefined;

  try {
    const audio = await cachedSynthesize(cfg, text, lang as LangCode, cacheDir, voice);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(audio);
  } catch (err) {
    const status = err instanceof FishAudioError ? err.status : 500;
    console.error('[fish-tts]', err instanceof Error ? err.message : err);
    res.status(status === 401 || status === 402 ? status : 502).json({ error: 'Speech generation failed' });
  }
}
