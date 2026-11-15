import test from 'node:test';
import assert from 'node:assert/strict';
import { INTL_BOOK_TABLES, INTL_CODES, INTL_ALIASES } from '../src/lib/book-names-intl';
import { toBookCode } from '../src/lib/book-canon';

test('every table has 66 titles and shorts', () => {
  for (const [lang, t] of Object.entries(INTL_BOOK_TABLES)) {
    assert.equal(t.titles.length, 66, lang);
    assert.equal(t.shorts.length, 66, lang);
  }
});

test('titles resolve to their own code in every language', () => {
  for (const [lang, t] of Object.entries(INTL_BOOK_TABLES)) {
    INTL_CODES.forEach((code, i) => {
      assert.equal(toBookCode(t.titles[i]), code, `${lang}: ${t.titles[i]}`);
    });
  }
});

test('no short form maps to two different books within a language', () => {
  for (const [lang, t] of Object.entries(INTL_BOOK_TABLES)) {
    const seen = new Map<string, string>();
    t.shorts.forEach((s, i) => {
      const key = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, '');
      const prev = seen.get(key);
      assert.ok(!prev || prev === INTL_CODES[i], `${lang}: "${s}" clashes`);
      seen.set(key, INTL_CODES[i]);
    });
  }
  assert.ok(Object.keys(INTL_ALIASES).length > 200);
});
