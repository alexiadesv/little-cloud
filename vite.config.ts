import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fishTtsPlugin } from './server/vitePluginFishTts.ts';

export default defineConfig(({ mode }) => {
  // Load every variable (not only VITE_*) so the server-side TTS proxy can read
  // FISH_AUDIO_API_KEY without it ever being bundled into client code.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), fishTtsPlugin(env)],
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 2000,
    },
  };
});
