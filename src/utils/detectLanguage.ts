/**
 * Détection locale de la langue d'un message utilisateur.
 *
 * Objectif : LYNARA répond dans la langue réellement utilisée par
 * l'utilisateur, y compris pour les messages mélangeant plusieurs langues,
 * sans imposer de sélecteur de langue.
 *
 * La détection est volontairement heuristique et locale : aucune donnée n'est
 * envoyée à un tiers. On procède en deux temps :
 *   1. détection d'écriture (Unicode) pour les langues non latines ;
 *   2. score de mots-outils / marqueurs fréquents pour les langues latines.
 * En cas d'ambiguïté, on retombe sur la langue d'interface.
 */

/** Codes de langue que le détecteur peut retourner. */
export type SupportedChatLang =
  | 'fr' | 'en' | 'mg' | 'es' | 'pt' | 'de' | 'it' | 'nl' | 'id' | 'ms'
  | 'vi' | 'tr' | 'pl' | 'ro' | 'sv' | 'da' | 'no' | 'fi' | 'cs' | 'hu'
  | 'ru' | 'uk' | 'bg' | 'ar' | 'fa' | 'he' | 'hi' | 'bn' | 'ta' | 'te'
  | 'th' | 'ja' | 'ko' | 'zh' | 'el' | 'sw' | 'af' | 'am' | 'km' | 'my'
  | 'si' | 'ka' | 'hy' | 'gu' | 'pa' | 'kn' | 'ml' | 'or' | 'lo';

interface LanguageMeta {
  label: string;
  bcp47: string;
}

/** Métadonnées d'affichage et balise BCP-47 pour la synthèse vocale. */
export const LANGUAGE_META: Record<SupportedChatLang, LanguageMeta> = {
  fr: { label: 'Français', bcp47: 'fr-FR' },
  en: { label: 'English', bcp47: 'en-US' },
  mg: { label: 'Malagasy', bcp47: 'mg-MG' },
  es: { label: 'Español', bcp47: 'es-ES' },
  pt: { label: 'Português', bcp47: 'pt-BR' },
  de: { label: 'Deutsch', bcp47: 'de-DE' },
  it: { label: 'Italiano', bcp47: 'it-IT' },
  nl: { label: 'Nederlands', bcp47: 'nl-NL' },
  id: { label: 'Bahasa Indonesia', bcp47: 'id-ID' },
  ms: { label: 'Bahasa Melayu', bcp47: 'ms-MY' },
  vi: { label: 'Tiếng Việt', bcp47: 'vi-VN' },
  tr: { label: 'Türkçe', bcp47: 'tr-TR' },
  pl: { label: 'Polski', bcp47: 'pl-PL' },
  ro: { label: 'Română', bcp47: 'ro-RO' },
  sv: { label: 'Svenska', bcp47: 'sv-SE' },
  da: { label: 'Dansk', bcp47: 'da-DK' },
  no: { label: 'Norsk', bcp47: 'nb-NO' },
  fi: { label: 'Suomi', bcp47: 'fi-FI' },
  cs: { label: 'Čeština', bcp47: 'cs-CZ' },
  hu: { label: 'Magyar', bcp47: 'hu-HU' },
  ru: { label: 'Русский', bcp47: 'ru-RU' },
  uk: { label: 'Українська', bcp47: 'uk-UA' },
  bg: { label: 'Български', bcp47: 'bg-BG' },
  ar: { label: 'العربية', bcp47: 'ar-SA' },
  fa: { label: 'فارسی', bcp47: 'fa-IR' },
  he: { label: 'עברית', bcp47: 'he-IL' },
  hi: { label: 'हिन्दी', bcp47: 'hi-IN' },
  bn: { label: 'বাংলা', bcp47: 'bn-BD' },
  ta: { label: 'தமிழ்', bcp47: 'ta-IN' },
  te: { label: 'తెలుగు', bcp47: 'te-IN' },
  th: { label: 'ไทย', bcp47: 'th-TH' },
  ja: { label: '日本語', bcp47: 'ja-JP' },
  ko: { label: '한국어', bcp47: 'ko-KR' },
  zh: { label: '中文', bcp47: 'zh-CN' },
  el: { label: 'Ελληνικά', bcp47: 'el-GR' },
  sw: { label: 'Kiswahili', bcp47: 'sw-KE' },
  af: { label: 'Afrikaans', bcp47: 'af-ZA' },
  am: { label: 'አማርኛ', bcp47: 'am-ET' },
  km: { label: 'ខ្មែរ', bcp47: 'km-KH' },
  my: { label: 'မြန်မာ', bcp47: 'my-MM' },
  si: { label: 'සිංහල', bcp47: 'si-LK' },
  ka: { label: 'ქართული', bcp47: 'ka-GE' },
  hy: { label: 'Հայերեն', bcp47: 'hy-AM' },
  gu: { label: 'ગુજરાતી', bcp47: 'gu-IN' },
  pa: { label: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN' },
  kn: { label: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  ml: { label: 'മലയാളം', bcp47: 'ml-IN' },
  or: { label: 'ଓଡ଼ିଆ', bcp47: 'or-IN' },
  lo: { label: 'ລາວ', bcp47: 'lo-LA' },
};

/** Marqueurs malgaches très spécifiques : suffisent presque à eux seuls. */
const MG_STRONG = ['amin\'ny', 'ahoana', 'inona', 'izany', 'tsy', 'misaotra', 'salama', 'malagasy', 'manao ahoana'];

const MG_MARKERS = [
  'ny', 'amin', 'ary', 'izany', 'fa', 'tsy', 'ity', 'izy', 'izaho', 'misy',
  'rehetra', 've', 'ho', 'ao', 'eo', 'sy', 'dia', 'koa', 'mba', 'natao',
  'atao', 'iza', 'manao', 'misaotra', 'tompo', 'soa', 'ratsy', 'tsara',
  'ambany', 'ambony', 'vidiny', 'vola', 'fatiantoka', 'tombony', 'risika',
];

const FR_MARKERS = [
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'est', 'sont',
  'pour', 'avec', 'dans', 'sur', 'que', 'qui', 'quoi', 'comment', 'pourquoi',
  'quand', 'je', 'tu', 'nous', 'vous', 'il', 'elle', 'mon', 'ma', 'mes',
  'bonjour', 'salut', 'merci', 'analyse', 'graphique', 'risque', 'tendance',
  'position', 'marché', 'marche', 'trading', 'perte', 'gain', 'niveau',
  'prix', 'achat', 'vente', 'stop', 'objectif', 'capital', 'lot', 'pips',
  'est-ce', 'c\'est', 'peux', 'veux', 'être', 'avoir', 'plus', 'mais',
  'explique', 'expliquer', 'différence', 'entre', 'protéger', 'puis', 'donc',
  'aussi', 'très', 'bien', 'valeur', 'marché',
];

const EN_MARKERS = [
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of',
  'and', 'or', 'but', 'with', 'for', 'from', 'in', 'on', 'at', 'by', 'what',
  'how', 'why', 'when', 'where', 'should', 'could', 'would', 'can', 'will',
  'my', 'your', 'this', 'that', 'these', 'those', 'please', 'hello', 'thanks',
  'trade', 'market', 'chart', 'risk', 'trend', 'position', 'price', 'buy',
  'sell', 'stop', 'loss', 'target', 'capital', 'size', 'pips', 'want', 'need',
  'explain', 'difference', 'between', 'protect', 'market', 'value',
];

const ES_MARKERS = [
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y',
  'es', 'son', 'para', 'con', 'en', 'que', 'quién', 'como', 'cómo', 'por',
  'qué', 'cuándo', 'yo', 'tú', 'nosotros', 'vosotros', 'mi', 'tu', 'su',
  'hola', 'gracias', 'análisis', 'gráfico', 'riesgo', 'tendencia', 'posición',
  'precio', 'compra', 'venta', 'objetivo', 'pérdida', 'ganancia', 'mercado',
  'explícame', 'explicame', 'explica', 'explicar', 'diferencia', 'entre',
  'protege', 'proteger', 'capital', 'valor', 'cómo', 'porque',
];

const PT_MARKERS = [
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos',
  'das', 'e', 'é', 'são', 'para', 'com', 'em', 'que', 'quem', 'como', 'por',
  'quê', 'quando', 'eu', 'tu', 'nós', 'meu', 'minha', 'seu', 'sua', 'olá',
  'obrigado', 'obrigada', 'análise', 'gráfico', 'risco', 'tendência',
  'posição', 'preço', 'compra', 'venda', 'objetivo', 'perda', 'ganho', 'mercado',
  'explique', 'explicar', 'diferença', 'entre', 'proteger', 'capital', 'valor',
];

const DE_MARKERS = [
  'der', 'die', 'das', 'ein', 'eine', 'einer', 'und', 'ist', 'sind', 'für',
  'mit', 'in', 'auf', 'dass', 'wer', 'wie', 'warum', 'wann', 'ich', 'du',
  'wir', 'ihr', 'mein', 'meine', 'dein', 'hallo', 'danke', 'bitte', 'analyse',
  'chart', 'risiko', 'trend', 'position', 'preis', 'kaufen', 'verkaufen',
  'ziel', 'verlust', 'gewinn', 'markt', 'nicht', 'auch', 'aber',
  'erkläre', 'erklären', 'unterschied', 'zwischen', 'schützen', 'kapital',
];

const IT_MARKERS = [
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno', 'di', 'del', 'della',
  'e', 'è', 'sono', 'per', 'con', 'in', 'su', 'che', 'chi', 'come', 'perché',
  'quando', 'io', 'tu', 'noi', 'voi', 'mio', 'mia', 'tuo', 'ciao', 'grazie',
  'analisi', 'grafico', 'rischio', 'tendenza', 'posizione', 'prezzo',
  'acquisto', 'vendita', 'obiettivo', 'perdita', 'guadagno', 'mercato',
  'spiegami', 'spiegare', 'cos', 'cosa', 'differenza', 'tra', 'proteggere',
  'capitale', 'valore', 'questo', 'questa', 'non', 'più', 'anche', 'bene',
];

const NL_MARKERS = [
  'de', 'het', 'een', 'en', 'is', 'zijn', 'voor', 'met', 'in', 'op', 'dat',
  'wie', 'hoe', 'waarom', 'wanneer', 'ik', 'jij', 'wij', 'jullie', 'mijn',
  'jouw', 'hallo', 'dank', 'bedankt', 'analyse', 'grafiek', 'risico', 'trend',
  'positie', 'prijs', 'kopen', 'verkopen', 'doel', 'verlies', 'winst', 'markt',
  'leg', 'mij', 'uit', 'wat', 'dit', 'niet', 'kan', 'kun', 'wil', 'uitleggen',
  'verschil', 'tussen', 'beschermen', 'kapitaal', 'waarde',
];

const ID_MARKERS = [
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
  'saya', 'kamu', 'kami', 'kita', 'apa', 'bagaimana', 'mengapa', 'kapan',
  'halo', 'terima', 'kasih', 'analisis', 'grafik', 'risiko', 'tren', 'posisi',
  'harga', 'beli', 'jual', 'target', 'kerugian', 'keuntungan', 'pasar', 'tidak',
  'bisa', 'tolong', 'jelaskan', 'perbedaan', 'antara', 'kenapa', 'lindungi',
  'modal', 'nilai',
];

const MS_MARKERS = [
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
  'saya', 'awak', 'kami', 'kita', 'apa', 'bagaimana', 'mengapa', 'bila',
  'hai', 'terima', 'kasih', 'analisis', 'carta', 'risiko', 'trend', 'kedudukan',
  'harga', 'beli', 'jual', 'sasaran', 'kerugian', 'keuntungan', 'pasaran', 'tidak',
  'boleh', 'tolong', 'jelaskan', 'perbezaan', 'antara', 'kenapa', 'lindungi',
  'modal', 'nilai', 'apakah', 'ialah', 'tidak', 'boleh',
];

const VI_MARKERS = [
  'và', 'của', 'là', 'có', 'không', 'cho', 'với', 'trong', 'trên', 'một',
  'tôi', 'bạn', 'chúng', 'gì', 'như', 'thế', 'nào', 'tại', 'sao', 'khi',
  'xin', 'chào', 'cảm', 'ơn', 'phân', 'tích', 'biểu', 'đồ', 'rủi', 'ro',
  'xu', 'hướng', 'vị', 'thế', 'giá', 'mua', 'bán', 'mục', 'tiêu', 'lỗ', 'lãi',
];

const TR_MARKERS = [
  've', 'bir', 'bu', 'şu', 'o', 'ile', 'için', 'de', 'da', 'den', 'dan', 'mi',
  'mı', 'mu', 'mü', 'ne', 'nasıl', 'neden', 'ne zaman', 'ben', 'sen', 'biz',
  'siz', 'benim', 'senin', 'merhaba', 'teşekkür', 'analiz', 'grafik', 'risk',
  'trend', 'pozisyon', 'fiyat', 'alım', 'satım', 'hedef', 'zarar', 'kâr', 'piyasa',
  'nedir', 'nasıldır', 'değil', 'için', 'hakkında', 'açıkla', 'anlat',
];

const PL_MARKERS = [
  'i', 'w', 'z', 'na', 'do', 'od', 'po', 'przez', 'dla', 'jest', 'są', 'to',
  'ten', 'ta', 'te', 'co', 'kto', 'jak', 'dlaczego', 'kiedy', 'ja', 'ty', 'my',
  'wy', 'mój', 'moja', 'twój', 'cześć', 'dzięki', 'analiza', 'wykres', 'ryzyko',
  'trend', 'pozycja', 'cena', 'kupno', 'sprzedaż', 'cel', 'strata', 'zysk', 'rynek',
];

const RO_MARKERS = [
  'și', 'în', 'la', 'de', 'cu', 'pe', 'un', 'o', 'este', 'sunt', 'pentru',
  'din', 'care', 'ce', 'cine', 'cum', 'de ce', 'când', 'eu', 'tu', 'noi',
  'voi', 'meu', 'mea', 'salut', 'mulțumesc', 'analiză', 'grafic', 'risc',
  'tendință', 'poziție', 'preț', 'cumpărare', 'vânzare', 'țintă', 'pierdere',
];

const SV_MARKERS = [
  'och', 'i', 'att', 'det', 'en', 'ett', 'är', 'som', 'på', 'för', 'med',
  'av', 'till', 'från', 'vad', 'vem', 'hur', 'varför', 'när', 'jag', 'du',
  'vi', 'ni', 'min', 'din', 'hej', 'tack', 'analys', 'diagram', 'risk',
  'trend', 'position', 'pris', 'köp', 'sälj', 'mål', 'förlust', 'vinst', 'marknad',
];

const DA_MARKERS = [
  'og', 'i', 'at', 'det', 'en', 'et', 'er', 'som', 'på', 'for', 'med', 'af',
  'til', 'fra', 'hvad', 'hvem', 'hvordan', 'hvorfor', 'hvornår', 'jeg', 'du',
  'vi', 'I', 'min', 'din', 'hej', 'tak', 'analyse', 'diagram', 'risiko',
  'trend', 'position', 'pris', 'køb', 'salg', 'mål', 'tab', 'gevinst', 'marked',
];

const NO_MARKERS = [
  'og', 'i', 'at', 'det', 'en', 'et', 'er', 'som', 'på', 'for', 'med', 'av',
  'til', 'fra', 'hva', 'hvem', 'hvordan', 'hvorfor', 'når', 'jeg', 'du',
  'vi', 'dere', 'min', 'din', 'hei', 'takk', 'analyse', 'diagram', 'risiko',
  'trend', 'posisjon', 'pris', 'kjøp', 'salg', 'mål', 'tap', 'gevinst', 'marked',
];

const FI_MARKERS = [
  'ja', 'on', 'ei', 'se', 'että', 'joka', 'mutta', 'kun', 'niin', 'kuin',
  'mikä', 'kuka', 'miten', 'miksi', 'milloin', 'minä', 'sinä', 'me', 'te',
  'minun', 'sinun', 'hei', 'kiitos', 'analyysi', 'kaavio', 'riski', 'trendi',
  'positio', 'hinta', 'osto', 'myynti', 'tavoite', 'tappio', 'voitto', 'markkina',
];

const CS_MARKERS = [
  'a', 'v', 'na', 'do', 'od', 'po', 'pro', 'je', 'jsou', 'to', 'ten', 'ta',
  'ty', 'co', 'kdo', 'jak', 'proč', 'kdy', 'já', 'ty', 'my', 'vy', 'můj',
  'moje', 'ahoj', 'děkuji', 'analýza', 'graf', 'riziko', 'trend', 'pozice',
  'cena', 'nákup', 'prodej', 'cíl', 'ztráta', 'zisk', 'trh',
];

const HU_MARKERS = [
  'a', 'az', 'egy', 'és', 'van', 'vannak', 'de', 'hogy', 'ki', 'mi', 'hogyan',
  'miért', 'mikor', 'én', 'te', 'mi', 'ti', 'az én', 'a te', 'szia',
  'köszönöm', 'elemzés', 'grafikon', 'kockázat', 'trend', 'pozíció', 'ár',
  'vétel', 'eladás', 'cél', 'veszteség', 'nyereség', 'piac',
];

const SW_MARKERS = [
  'na', 'ya', 'wa', 'kwa', 'katika', 'ni', 'si', 'hii', 'hiyo', 'yake', 'yangu',
  'wangu', 'nini', 'nani', 'vipi', 'kwa nini', 'lini', 'mimi', 'wewe', 'sisi',
  'ninyi', 'habari', 'asante', 'uchambuzi', 'chati', 'hatari', 'mwelekeo',
  'nafasi', 'bei', 'nunua', 'uza', 'lengo', 'hasara', 'faida', 'soko',
];

// L'afrikaans partage beaucoup de mots-outils avec l'anglais, l'allemand et le
// néerlandais (« is », « was », « die », « van »…). On ne garde ici que les
// formes réellement distinctives, sinon un message allemand ou anglais court
// provoque une égalité et retombe sur la langue par défaut.
const AF_MARKERS = [
  'nie', 'ek', 'jy', 'ons', 'julle', 'hoekom', 'wanneer', 'dankie', 'baie',
  'watter', 'hulle', 'julle', 'waarom', 'analise', 'grafiek', 'risiko',
  'tendens', 'posisie', 'prys', 'koop', 'verkoop', 'teiken', 'verlies', 'wins',
];

/** Paires langue / marqueurs pour les langues à écriture latine. */
const LATIN_PROFILES: Array<{ code: SupportedChatLang; markers: string[] }> = [
  { code: 'mg', markers: MG_MARKERS },
  { code: 'fr', markers: FR_MARKERS },
  { code: 'en', markers: EN_MARKERS },
  { code: 'es', markers: ES_MARKERS },
  { code: 'pt', markers: PT_MARKERS },
  { code: 'de', markers: DE_MARKERS },
  { code: 'it', markers: IT_MARKERS },
  { code: 'nl', markers: NL_MARKERS },
  { code: 'id', markers: ID_MARKERS },
  { code: 'ms', markers: MS_MARKERS },
  { code: 'vi', markers: VI_MARKERS },
  { code: 'tr', markers: TR_MARKERS },
  { code: 'pl', markers: PL_MARKERS },
  { code: 'ro', markers: RO_MARKERS },
  { code: 'sv', markers: SV_MARKERS },
  { code: 'da', markers: DA_MARKERS },
  { code: 'no', markers: NO_MARKERS },
  { code: 'fi', markers: FI_MARKERS },
  { code: 'cs', markers: CS_MARKERS },
  { code: 'hu', markers: HU_MARKERS },
  { code: 'sw', markers: SW_MARKERS },
  { code: 'af', markers: AF_MARKERS },
];

interface ScriptRule {
  code: SupportedChatLang;
  test: RegExp;
}

/**
 * Détection par écriture. L'ordre importe : le japonais contient des kanji,
 * on teste donc les kanas avant le chinois. L'ukrainien et le bulgare
 * possèdent des lettres absentes du russe.
 */
const SCRIPT_RULES: ScriptRule[] = [
  { code: 'ja', test: /[\u3040-\u30ff]/ },
  { code: 'ko', test: /[\uac00-\ud7af\u1100-\u11ff]/ },
  { code: 'zh', test: /[\u4e00-\u9fff]/ },
  { code: 'uk', test: /[\u0456\u0457\u0454\u0491]/i },
  { code: 'bg', test: /[\u044a\u044c\u044e\u044f]/i },
  { code: 'ru', test: /[\u0400-\u04ff]/ },
  { code: 'fa', test: /[\u067e\u0686\u0698\u06af\u06cc]/ },
  { code: 'ar', test: /[\u0600-\u06ff]/ },
  { code: 'he', test: /[\u0590-\u05ff]/ },
  { code: 'hi', test: /[\u0900-\u097f]/ },
  { code: 'bn', test: /[\u0980-\u09ff]/ },
  { code: 'pa', test: /[\u0a00-\u0a7f]/ },
  { code: 'gu', test: /[\u0a80-\u0aff]/ },
  { code: 'or', test: /[\u0b00-\u0b7f]/ },
  { code: 'ta', test: /[\u0b80-\u0bff]/ },
  { code: 'te', test: /[\u0c00-\u0c7f]/ },
  { code: 'kn', test: /[\u0c80-\u0cff]/ },
  { code: 'ml', test: /[\u0d00-\u0d7f]/ },
  { code: 'si', test: /[\u0d80-\u0dff]/ },
  { code: 'th', test: /[\u0e00-\u0e7f]/ },
  { code: 'lo', test: /[\u0e80-\u0eff]/ },
  { code: 'my', test: /[\u1000-\u109f]/ },
  { code: 'ka', test: /[\u10a0-\u10ff]/ },
  { code: 'am', test: /[\u1200-\u137f]/ },
  { code: 'km', test: /[\u1780-\u17ff]/ },
  { code: 'el', test: /[\u0370-\u03ff]/ },
  { code: 'hy', test: /[\u0530-\u058f]/ },
];

/**
 * Tournures interrogatives propres à une langue : elles pèsent lourd car elles
 * ne se rencontrent pratiquement pas dans les langues voisines.
 */
const LATIN_STRONG_PHRASES: Array<{ code: SupportedChatLang; test: RegExp; weight: number }> = [
  { code: 'de', test: /\bwas (ist|sind)\b/, weight: 2 },
  { code: 'tr', test: /\b(nedir|nasıldır)\b/, weight: 2 },
  { code: 'pl', test: /\bczym jest\b/, weight: 2 },
  { code: 'id', test: /\bapa itu\b/, weight: 2 },
];

/** Lettres accentuées très discriminantes pour les langues latines. */
const LATIN_HINTS: Array<{ code: SupportedChatLang; test: RegExp; weight: number }> = [
  { code: 'vi', test: /[ăâđêôơư]|[ạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i, weight: 4 },
  { code: 'tr', test: /[ğıİşŞ]/, weight: 3 },
  { code: 'pl', test: /[ąćęłńóśźż]/i, weight: 3 },
  { code: 'ro', test: /[ăâîșț]/i, weight: 3 },
  { code: 'cs', test: /[ěščřžůťďň]/i, weight: 3 },
  { code: 'hu', test: /[őű]/i, weight: 4 },
  { code: 'de', test: /[ß]/, weight: 4 },
  { code: 'de', test: /[äöü]/i, weight: 1 },
  { code: 'es', test: /[ñ¿¡]/i, weight: 4 },
  { code: 'pt', test: /[ãõ]/i, weight: 4 },
  // `é`/`è` sont partagés par plusieurs langues latines : on ne les utilise
  // pas comme indice français, sinon l'espagnol ou l'italien basculent en FR.
  { code: 'fr', test: /[çœæàâêëîïôùûÿ]/i, weight: 2 },
  { code: 'sv', test: /[åäö]/i, weight: 1 },
  { code: 'da', test: /[æøå]/i, weight: 1 },
  { code: 'no', test: /[æøå]/i, weight: 1 },
  { code: 'fi', test: /[äö]/i, weight: 1 },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[’`´]/g, "'");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}']+/u)
    .filter(Boolean);
}

function score(tokens: string[], markers: string[]): number {
  const set = new Set(markers);
  let total = 0;
  for (const token of tokens) {
    if (set.has(token)) total += 1;
  }
  return total;
}

/**
 * Retourne la langue détectée.
 * `fallback` est utilisée si le message est trop court ou trop ambigu
 * (ex. « ok », « 1 », un simple emoji).
 */
export function detectChatLanguage(
  text: string,
  fallback: SupportedChatLang = 'fr',
): SupportedChatLang {
  const raw = (text || '').trim();
  if (!raw) return fallback;

  const lower = normalize(raw);
  const tokens = tokenize(raw);
  if (!tokens.length) return fallback;

  // 1) Écritures non latines : la présence de caractères suffit.
  for (const rule of SCRIPT_RULES) {
    if (rule.test.test(raw)) return rule.code;
  }

  // 2) Langues latines : score de mots-outils + indices accentués.
  const scores = new Map<SupportedChatLang, number>();
  for (const profile of LATIN_PROFILES) {
    scores.set(profile.code, score(tokens, profile.markers));
  }

  for (const hint of LATIN_HINTS) {
    if (hint.test.test(raw)) {
      scores.set(hint.code, (scores.get(hint.code) || 0) + hint.weight);
    }
  }

  // Marqueurs malgaches forts (expressions entières).
  if (MG_STRONG.some((marker) => lower.includes(marker))) {
    scores.set('mg', (scores.get('mg') || 0) + 3);
  }

  // Tournures d'interrogation très caractéristiques : elles départagent les
  // phrases courtes sans créer de collision avec les autres langues latines.
  for (const phrase of LATIN_STRONG_PHRASES) {
    if (phrase.test.test(lower)) {
      scores.set(phrase.code, (scores.get(phrase.code) || 0) + phrase.weight);
    }
  }

  let bestCode: SupportedChatLang = fallback;
  let bestScore = 0;
  let tie = false;

  for (const [code, value] of scores.entries()) {
    if (value > bestScore) {
      bestCode = code;
      bestScore = value;
      tie = false;
    } else if (value === bestScore && value > 0) {
      tie = true;
    }
  }

  // Un seul mot-outil commun (« a », « o », « i ») ne suffit pas.
  if (bestScore < 2) return fallback;
  if (tie) return fallback;
  return bestCode;
}

/** Convertit une langue courte en balise BCP-47 utilisée par la synthèse vocale. */
export function toBcp47(lang: SupportedChatLang): string {
  return LANGUAGE_META[lang]?.bcp47 || 'fr-FR';
}

/** Libellé court lisible pour l'interface. */
export function languageLabel(lang: SupportedChatLang): string {
  return LANGUAGE_META[lang]?.label || lang.toUpperCase();
}
