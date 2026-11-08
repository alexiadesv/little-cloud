import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFishConfig } from '../../server/fishAudio.ts';

/** GET /api/tts/status — tells the client whether Fish Audio is available on this deploy. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const cfg = readFishConfig(process.env);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ enabled: !!cfg, model: cfg?.model ?? null });
}
