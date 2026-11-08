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

/** Default Little Cloud English kid voice — always used for the English name after a foreign word. */
export const LITTLE_CLOUD_VOICE_ID = '273667dee5fd4723a9f8a71c2cd4ab6c';

/** Every Fish reference id shipped with the book (for API allow-lists). */
export function knownVoiceIds(): Set<string> {
  return new Set([LITTLE_CLOUD_VOICE_ID, ...LANGUAGES.map((l) => l.voiceId)]);
}

/** English first, then family groups (Romance, Germanic, then eastward). */
export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English (US)', native: 'English (US)', bcp47: 'en-US', fishTag: 'en', voiceId: LITTLE_CLOUD_VOICE_ID },
  { code: 'en-gb', label: 'English (UK)', native: 'English (UK)', bcp47: 'en-GB', fishTag: 'en', voiceId: 'acd7a95d3bae4fe3a5f32d978bcb2b38' },
  { code: 'es', label: 'Spanish', native: 'Español', bcp47: 'es-ES', fishTag: 'es', voiceId: '27d46c97c2ea4e4bac31d768b3da84a9' },
  { code: 'pt', label: 'Portuguese', native: 'Português', bcp47: 'pt-BR', fishTag: 'pt', voiceId: '84a1321c863e4423b86a126a6899d457' },
  { code: 'fr', label: 'French', native: 'Français', bcp47: 'fr-FR', fishTag: 'fr', voiceId: '50d573b7169e4234a7d45c39f9f2cf97' },
  { code: 'it', label: 'Italian', native: 'Italiano', bcp47: 'it-IT', fishTag: 'it', voiceId: 'f7380380517d497abdf9dfd961668a4f' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', bcp47: 'nl-NL', fishTag: 'nl', voiceId: 'c1171fbe63c640fcac2616c6233dc9cc' },
  { code: 'de', label: 'German', native: 'Deutsch', bcp47: 'de-DE', fishTag: 'de', voiceId: 'ea1e936718d34b13acb54b7173aab4c5' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά', bcp47: 'el-GR', fishTag: 'el', voiceId: '6045815e284b40ce9b4a12278c48e20b' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', bcp47: 'tr-TR', fishTag: 'tr', voiceId: '3d771c6fb2ed46b58ae1d4463358a295' },
  { code: 'ru', label: 'Russian', native: 'Русский', bcp47: 'ru-RU', fishTag: 'ru', voiceId: '62aa549338bb4a70ae1d94b20868326a' },
  { code: 'ar', label: 'Arabic', native: 'العربية', bcp47: 'ar-SA', fishTag: 'ar', voiceId: '460ee53807924634a4a0bf2efe268f71' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', bcp47: 'hi-IN', fishTag: 'hi', voiceId: 'c46d16b60d95486ca9df93b877defc64' },
  { code: 'th', label: 'Thai', native: 'ไทย', bcp47: 'th-TH', fishTag: 'th', voiceId: '8847e3e47e2a418ab8cb68c501e768dd' },
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

/** Short hello Little Cloud says on Go Explore / title tap. */
export const GREETINGS: Record<LangCode, string> = {
  en: "Hi! I'm Little Cloud. Tap anything you see, and I'll turn into it!",
  'en-gb': "Hi! I'm Little Cloud. Tap anything you see, and I'll turn into it!",
  es: '¡Hola! Soy Little Cloud. ¡Toca lo que veas y me convertiré en ello!',
  fr: 'Salut ! Je suis Little Cloud. Touche ce que tu vois, et je me transformerai !',
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

/** Spoken when visiting Little Cloud’s apartment. */
export const APARTMENT_LINES: Record<LangCode, string> = {
  en: "Welcome to my home! Pick a treasure, drag it where you like, then tap Place.",
  'en-gb': "Welcome to my home! Pick a treasure, drag it where you like, then tap Place.",
  es: '¡Bienvenido a mi casa! Elige un tesoro, arrástralo donde quieras y toca Colocar.',
  fr: 'Bienvenue chez moi ! Choisis un trésor, glisse-le où tu veux, puis appuie sur Placer.',
  de: 'Willkommen bei mir zu Hause! Such einen Schatz, zieh ihn hin, wo du magst, und tippe auf Platzieren.',
  zh: '欢迎来到我的家！选一件宝物，拖到你喜欢的地方，再点放置。',
  ja: 'わたしの家へようこそ！たからものを選んで、好きなところにドラッグして、「置く」を押してね。',
  th: 'ยินดีต้อนรับสู่บ้านของฉัน! เลือกสมบัติ ลากไปที่ที่ชอบ แล้วกดวาง',
  ko: '우리 집에 온 걸 환영해! 보물을 고르고 원하는 곳으로 드래그한 다음 놓기를 눌러줘.',
  vi: 'Chào mừng đến nhà mình! Chọn một món bảo vật, kéo đến chỗ bạn thích, rồi nhấn Đặt.',
  pt: 'Bem-vindo à minha casa! Escolha um tesouro, arraste para onde quiser e toque em Colocar.',
  nl: 'Welkom in mijn huis! Kies een schat, sleep hem waar je wilt, en tik op Plaatsen.',
  tr: 'Evime hoş geldin! Bir hazine seç, istediğin yere sürükle, sonra Yerleştir’e dokun.',
  ar: 'مرحباً في بيتي! اختر كنزاً، اسحبه إلى المكان الذي تحب، ثم اضغط وضع.',
  hi: 'मेरे घर में स्वागत है! कोई ख़ज़ाना चुनो, जहाँ चाहो वहाँ खींचो, फिर रखो दबाओ।',
  it: 'Benvenuto a casa mia! Scegli un tesoro, trascinalo dove vuoi e poi tocca Posiziona.',
  el: 'Καλώς ήρθες στο σπίτι μου! Διάλεξε έναν θησαυρό, σύρε τον όπου θέλεις και πάτα Τοποθέτηση.',
  ru: 'Добро пожаловать ко мне домой! Выбери сокровище, перетащи куда хочешь и нажми Поставить.',
};

export function greetingFor(code: LangCode): string {
  return GREETINGS[code] ?? GREETINGS.en;
}

export function apartmentLineFor(code: LangCode): string {
  return APARTMENT_LINES[code] ?? APARTMENT_LINES.en;
}
