import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStrictRef } from '../src/lib/quiz-ref-intl';

test('strict refs: canonical titles only, mapped to the API book name', () => {
  assert.deepEqual(parseStrictRef('de', '1. Mose 1:3-5'), { apiBook: 'Genesis', chapter: 1, verse: 3, endVerse: 5 });
  assert.deepEqual(parseStrictRef('fr', 'Cantique des Cantiques 2:1'), { apiBook: 'Song of Solomon', chapter: 2, verse: 1, endVerse: 1 });
  assert.deepEqual(parseStrictRef('en', 'John 3:16'), { apiBook: 'John', chapter: 3, verse: 16, endVerse: 16 });
});

test('strict refs: wrong language, abbreviation or shape is rejected', () => {
  assert.equal(typeof parseStrictRef('de', 'Genesis 1:1'), 'string');
  assert.equal(typeof parseStrictRef('pt', 'Gn 1:1'), 'string');
  assert.equal(typeof parseStrictRef('fr', 'Jean 3'), 'string');
  assert.equal(typeof parseStrictRef('fr', 'Jean 3:16-12'), 'string');
});
