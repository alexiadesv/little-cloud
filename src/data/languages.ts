import type { LangCode } from './types.ts';

export interface LanguageInfo {
  code: LangCode;
  /** Name of the language in English. */
  label: string;
  /** Name of the language in itself. */
  native: string;
  /** BCP-47 tag for speech synthesis and Fish Audio text normalization. */
  bcp47: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', native: 'English', bcp47: 'en-US' },
  { code: 'es', label: 'Spanish', native: 'Español', bcp47: 'es-ES' },
  { code: 'fr', label: 'French', native: 'Français', bcp47: 'fr-FR' },
  { code: 'de', label: 'German', native: 'Deutsch', bcp47: 'de-DE' },
  { code: 'zh', label: 'Chinese', native: '中文', bcp47: 'zh-CN' },
  { code: 'ja', label: 'Japanese', native: '日本語', bcp47: 'ja-JP' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function languageInfo(code: LangCode): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isLangCode(value: unknown): value is LangCode {
  return typeof value === 'string' && (LANGUAGE_CODES as string[]).includes(value);
}
