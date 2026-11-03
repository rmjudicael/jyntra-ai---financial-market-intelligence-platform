import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from './translations';

function keyPaths(obj: any, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keyPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

test('FR, EN (GB) and MG expose exactly the same translation keys', () => {
  const fr = keyPaths(translations.fr).sort();
  assert.deepEqual(keyPaths(translations.en).sort(), fr);
  assert.deepEqual(keyPaths(translations.mg).sort(), fr);
});

test('no translation value is empty, including LYNARA voice strings', () => {
  for (const lang of ['fr', 'en', 'mg'] as const) {
    for (const path of keyPaths(translations[lang])) {
      const value = path.split('.').reduce<any>((acc, k) => acc?.[k], translations[lang]);
      assert.equal(typeof value, 'string', `${lang}.${path}`);
      assert.ok((value as string).trim().length > 0, `${lang}.${path} is empty`);
    }
  }
});
