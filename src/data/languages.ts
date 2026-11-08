import type { ForeignLang, LangCode } from './types.ts';

export interface LanguageInfo {
  code: LangCode;
  /** Name of the language in English. */
  label: string;
  /** Name of the language in itself. */
  native: string;
  /** BCP-47 tag for speech synthesis and Fish Audio text normalization. */
  bcp47: string;
  /** Tag sent to Fish Audio's `language` field. */
  fishTag: string;
  /** Fish Audio reference voice for Little Cloud in this language. */
  voiceId: string;
}

/** English first, then family groups (Romance, Germanic, then eastward). */
export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English (US)', native: 'English (US)', bcp47: 'en-US', fishTag: 'en', voiceId: '273667dee5fd4723a9f8a71c2cd4ab6c' },
  { code: 'en-gb', label: 'English (UK)', native: 'English (UK)', bcp47: 'en-GB', fishTag: 'en', voiceId: 'acd7a95d3bae4fe3a5f32d978bcb2b38' },
  { code: 'es', label: 'Spanish', native: 'Español', bcp47: 'es-ES', fishTag: 'es', voiceId: '27d46c97c2ea4e4bac31d768b3da84a9' },
  { code: 'pt', label: 'Portuguese', native: 'Português', bcp47: 'pt-BR', fishTag: 'pt', voiceId: '84a1321c863e4423b86a126a6899d457' },
  { code: 'fr', label: 'French', native: 'Français', bcp47: 'fr-FR', fishTag: 'fr', voiceId: '2ee0172c13df4f3f82dcdaab3a08a1bc' },
  { code: 'it', label: 'Italian', native: 'Italiano', bcp47: 'it-IT', fishTag: 'it', voiceId: '810073cefa0149bca773378c61ec31b2' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', bcp47: 'nl-NL', fishTag: 'nl', voiceId: 'c1171fbe63c640fcac2616c6233dc9cc' },
  { code: 'de', label: 'German', native: 'Deutsch', bcp47: 'de-DE', fishTag: 'de', voiceId: '68bad40d2ff3463d8aae305a0e6daa44' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά', bcp47: 'el-GR', fishTag: 'el', voiceId: '6045815e284b40ce9b4a12278c48e20b' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', bcp47: 'tr-TR', fishTag: 'tr', voiceId: '3d771c6fb2ed46b58ae1d4463358a295' },
  { code: 'ru', label: 'Russian', native: 'Русский', bcp47: 'ru-RU', fishTag: 'ru', voiceId: '62aa549338bb4a70ae1d94b20868326a' },
  { code: 'ar', label: 'Arabic', native: 'العربية', bcp47: 'ar-SA', fishTag: 'ar', voiceId: '460ee53807924634a4a0bf2efe268f71' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', bcp47: 'hi-IN', fishTag: 'hi', voiceId: 'c46d16b60d95486ca9df93b877defc64' },
  { code: 'th', label: 'Thai', native: 'ไทย', bcp47: 'th-TH', fishTag: 'th', voiceId: '4f0fce282ecc483f8660d8a2a2dd115f' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', bcp47: 'vi-VN', fishTag: 'vi', voiceId: '4dc641f0fc7c4ffebf3619c6959c38bc' },
  { code: 'zh', label: 'Chinese', native: '中文', bcp47: 'zh-CN', fishTag: 'zh-CN', voiceId: 'e98e3279c6bc422f8b67d42f3d43bca5' },
  { code: 'ja', label: 'Japanese', native: '日本語', bcp47: 'ja-JP', fishTag: 'ja', voiceId: '7b057c33b9b241b282954ee216af9906' },
  { code: 'ko', label: 'Korean', native: '한국어', bcp47: 'ko-KR', fishTag: 'ko', voiceId: '185915e5a4414891ac8d2faa47ea66a6' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function languageInfo(code: LangCode): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isLangCode(value: unknown): value is LangCode {
  return typeof value === 'string' && (LANGUAGE_CODES as string[]).includes(value);
}

export function isEnglish(code: LangCode): code is 'en' | 'en-gb' {
  return code === 'en' || code === 'en-gb';
}

export function asForeign(code: LangCode): ForeignLang | null {
  return isEnglish(code) ? null : code;
}

/** Short hello Little Cloud says when tapped on the title page. */
export const GREETINGS: Record<LangCode, string> = {
  en: "Hi! I'm Little Cloud. Tap anything you see, and I'll turn into it!",
  'en-gb': "Hi! I'm Little Cloud. Tap anything you see, and I'll turn into it!",
  es: '¡Hola! Soy Little Cloud. ¡Toca lo que veas y me convertiré en ello!',
  fr: "Salut ! Je suis Little Cloud. Touche ce que tu vois, et je me transformerai !",
  de: 'Hallo! Ich bin Little Cloud. Tippe auf alles, was du siehst, und ich verwandle mich!',
  zh: '你好！我是小云朵。点你看见的东西，我会变成它！',
  ja: 'こんにちは！リトルクラウドだよ。見たものをタップすると、それに変身するよ！',
  th: 'สวัสดี! ฉันคือลิตเติ้ลคลาวด์ จิ้มสิ่งที่เห็นแล้วฉันจะกลายเป็นสิ่งนั้น!',
  ko: '안녕! 나는 리틀 클라우드야. 보이는 걸 누르면 그 모양으로 변할게!',
  vi: 'Xin chào! Mình là Little Cloud. Chạm vào thứ bạn thấy, mình sẽ biến thành nó!',
  pt: 'Oi! Eu sou a Little Cloud. Toque no que você ver, e eu me transformo nisso!',
  nl: 'Hoi! Ik ben Little Cloud. Tik op wat je ziet, en ik verander erin!',
  tr: 'Merhaba! Ben Little Cloud. Gördüğün şeye dokun, ben ona dönüşeyim!',
  ar: 'مرحباً! أنا ليتل كلاود. اضغط على أي شيء تراه وسأتحول إليه!',
  hi: 'नमस्ते! मैं लिटिल क्लाउड हूँ। जो दिखे उसे छुओ, मैं उसी में बदल जाऊँगी!',
  it: 'Ciao! Sono Little Cloud. Tocca quello che vedi e mi trasformo!',
  el: 'Γεια! Είμαι το Little Cloud. Πάτα ό,τι βλέπεις και θα γίνω αυτό!',
  ru: 'Привет! Я Little Cloud. Нажми на то, что видишь, и я превращусь в это!',
};

export function greetingFor(code: LangCode): string {
  return GREETINGS[code] ?? GREETINGS.en;
}
