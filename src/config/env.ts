const flag = (value: string | undefined, fallback: boolean) =>
  value === undefined || value === '' ? fallback : value.toLowerCase() === 'true';

const params = new URLSearchParams(window.location.search);

export const config = {
  /** Ask the dev/preview server to synthesize words that have no pre-generated clip. */
  ttsProxy: flag(import.meta.env.VITE_ENABLE_TTS_PROXY, true),
  /** Use the browser's speech synthesis when no recorded audio is available. */
  speechFallback: flag(import.meta.env.VITE_ENABLE_SPEECH_FALLBACK, true),
  /** `?renderer=webgl` in the URL also forces the fallback renderer. */
  forceWebGL: flag(import.meta.env.VITE_FORCE_WEBGL, false) || params.get('renderer') === 'webgl',
};
