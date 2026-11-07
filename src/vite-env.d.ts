/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_TTS_PROXY?: string;
  readonly VITE_ENABLE_SPEECH_FALLBACK?: string;
  readonly VITE_FORCE_WEBGL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
