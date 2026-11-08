import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { isLangCode } from '../src/data/languages.ts';
import { FishAudioError, cachedSynthesize, readFishConfig, vocabulary } from './fishAudio.ts';

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Serves `/api/tts?lang=xx&text=...` from the Vite dev and preview servers.
 * The Fish Audio key stays on the server; results are cached in `.cache/tts`.
 */
export function fishTtsPlugin(env: Record<string, string>): Plugin {
  const cfg = readFishConfig(env);
  const vocab = vocabulary();
  const cacheDir = path.resolve(process.cwd(), '.cache/tts');

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/status') return json(res, 200, { enabled: !!cfg, model: cfg?.model ?? null });
    if (url.pathname !== '/' || req.method !== 'GET') return next();
    if (!cfg) return json(res, 503, { error: 'FISH_AUDIO_API_KEY is not configured' });

    const lang = url.searchParams.get('lang');
    const text = url.searchParams.get('text')?.trim() ?? '';
    if (!isLangCode(lang)) return json(res, 400, { error: 'Unknown language' });
    if (!vocab.get(lang)?.has(text)) return json(res, 404, { error: 'Not a word in this book' });

    const voice = url.searchParams.get('voice');

    try {
      const audio = await cachedSynthesize(cfg, text, lang, cacheDir, voice);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(audio);
    } catch (err) {
      const status = err instanceof FishAudioError ? err.status : 500;
      console.error('[fish-tts]', err instanceof Error ? err.message : err);
      json(res, status === 401 || status === 402 ? status : 502, { error: 'Speech generation failed' });
    }
  };

  return {
    name: 'little-cloud:fish-tts',
    configureServer(server) {
      server.middlewares.use('/api/tts', handler);
      if (!cfg) server.config.logger.info('  ☁  Fish Audio key not set — using pre-generated audio or browser speech.');
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', handler);
    },
  };
}
