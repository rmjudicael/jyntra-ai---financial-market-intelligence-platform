import assert from 'node:assert';
import { detectChatLanguage } from '../src/utils/detectLanguage';

/**
 * Multilingual language detection.
 * Goal: a short message without accent should still be recognized
 * in the correct language, and no Latin language should "steal" the message
 * from another.
 */
const cases: Array<[string, string]> = [
  // French / English / Malagasy
  ['Bonjour, explique-moi le BOS', 'fr'],
  ['Explique-moi la différence entre BOS et CHoCH', 'fr'],
  ['Explain the difference between BOS and CHoCH', 'en'],
  ['What is an order block?', 'en'],
  ['Bonsoir, can you explain the market structure please?', 'en'],
  ['Salama, inona ny BOS?', 'mg'],
  // Spanish / Portuguese
  ['Explícame qué es un Order Block', 'es'],
  ['Explícame la diferencia entre BOS y CHoCH', 'es'],
  ['¿Qué es un order block?', 'es'],
  ['O que é um Order Block?', 'pt'],
  ['Qual é a diferença entre BOS e CHoCH?', 'pt'],
  // German / Italian / Dutch
  ['Was ist ein Fair Value Gap?', 'de'],
  ['Was ist ein Order Block?', 'de'],
  ["Spiegami cos'è un Order Block", 'it'],
  ["Che cos'è un Order Block?", 'it'],
  ['Leg mij uit wat een Fair Value Gap is', 'nl'],
  ['Wat is een order block?', 'nl'],
  // Indonesian / Malay / Turkish / Polish / Romanian
  ['Apa itu Order Block?', 'id'],
  ['Apa itu order block?', 'id'],
  ['Apakah itu order block?', 'ms'],
  ['Order Block nedir?', 'tr'],
  ['Merhaba, order block nedir?', 'tr'],
  ['Co to jest Order Block?', 'pl'],
  ['Czym jest Order Block?', 'pl'],
  ['Bună, ce este un order block?', 'ro'],
  // Nordic / Czech / Hungarian / Swahili / Vietnamese
  ['Vad är ett Fair Value Gap?', 'sv'],
  ['Hvad er en Order Block?', 'da'],
  ['Hva er en Order Block?', 'no'],
  ['Mikä on Order Block?', 'fi'],
  ['Co je Order Block?', 'cs'],
  ['Mi az az Order Block?', 'hu'],
  ['Order Block ni nini?', 'sw'],
  ['Giải thích Order Block là gì', 'vi'],
  // Non-Latin scripts
  ['BOSとCHoCHの違いを説明して', 'ja'],
  ['안녕하세요, 오더 블록이 뭐예요?', 'ko'],
  ['你好，请解释订单块', 'zh'],
  ['ما هو البريك أوف ستراكتشر؟', 'ar'],
  ['مرحبا، كيف حالك؟', 'ar'],
  ['Привет, что такое ордер блок?', 'ru'],
  ['Привіт, що таке ордер блок?', 'uk'],
  ['Γεια σου, τι είναι το order block;', 'el'],
];

let failed = 0;
for (const [text, expected] of cases) {
  const got = detectChatLanguage(text);
  if (got !== expected) {
    failed += 1;
    console.error(`FAIL detectChatLanguage(${JSON.stringify(text)}) = ${got}, attendu ${expected}`);
  }
}

// An empty message or a single ambiguous word should fall back cleanly.
assert.equal(detectChatLanguage('ok'), 'fr');
assert.equal(detectChatLanguage('   '), 'fr');
assert.equal(detectChatLanguage('', 'en'), 'en');

assert.equal(failed, 0, `${failed} cas de détection de langue en échec`);
console.log(`detectLanguage: ${cases.length}/${cases.length} cas OK`);
