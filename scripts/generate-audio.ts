/**
 * Pre-generates every pronunciation with Fish Audio into public/audio so the
 * game can be deployed as static files without exposing an API key.
 *
 *   npm run generate:audio                 # missing files only
 *   npm run generate:audio -- --force      # regenerate everything
 *   npm run generate:audio -- --lang=es,fr --only=car,taxi
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';
import { GREETINGS, LANGUAGE_CODES, isLangCode } from '../src/data/languages';
import { LEVELS, NARRATION, wordFor } from '../src/data/levels';
import type { LangCode } from '../src/data/types';
import { cachedSynthesize, readFishConfig } from '../server/fishAudio';

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]?.split(',').filter(Boolean);
const force = args.includes('--force');
const langs = (flag('lang') ?? LANGUAGE_CODES).filter(isLangCode);
const only = flag('only');

const root = process.cwd();
const outDir = path.join(root, 'public', 'audio');
const cacheDir = path.join(root, '.cache', 'tts');

const cfg = readFishConfig(loadEnv('development', root, ''));
if (!cfg) {
  console.error('FISH_AUDIO_API_KEY is missing. Copy .env.example to .env.local and add your key.');
  process.exit(1);
}

interface Job {
  lang: LangCode;
  text: string;
  file: string;
}

const jobs: Job[] = [];
for (const level of LEVELS) {
  for (const obj of level.objects) {
    if (only && !only.includes(obj.id)) continue;
    for (const lang of langs) jobs.push({ lang, text: wordFor(obj, lang), file: path.join(outDir, lang, `${obj.id}.mp3`) });
  }
}
if (!only) {
  for (const lang of langs.filter((l) => l === 'en' || l === 'en-gb')) {
    for (const line of NARRATION) jobs.push({ lang, text: line.text, file: path.join(outDir, lang, `narration-${line.id}.mp3`) });
  }
  for (const lang of langs) jobs.push({ lang, text: GREETINGS[lang], file: path.join(outDir, lang, 'greeting.mp3') });
}

const todo = jobs.filter((j) => force || !existsSync(j.file));
console.log(`☁  ${jobs.length} clips in the book, ${todo.length} to generate (model ${cfg.model}).`);

let done = 0;
let failed = 0;
async function worker() {
  for (let job = todo.shift(); job; job = todo.shift()) {
    try {
      const audio = await cachedSynthesize(cfg!, job.text, job.lang, cacheDir);
      await mkdir(path.dirname(job.file), { recursive: true });
      await writeFile(job.file, audio);
      done++;
      console.log(`  ✓ ${job.lang}  ${job.text}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${job.lang}  ${job.text}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
await Promise.all(Array.from({ length: 3 }, worker));

// The manifest tells the client which clips exist, so it never probes for 404s.
const files: string[] = [];
for (const lang of LANGUAGE_CODES) {
  const dir = path.join(outDir, lang);
  if (!existsSync(dir)) continue;
  for (const f of await readdir(dir)) if (f.endsWith('.mp3')) files.push(`${lang}/${f.replace(/\.mp3$/, '')}`);
}
await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), model: cfg.model, files }, null, 2));
console.log(`☁  Done: ${done} generated, ${failed} failed. Manifest lists ${files.length} clips.`);
if (failed) process.exitCode = 1;
