import test from 'node:test';
import assert from 'node:assert/strict';

import {
  dominantPassage,
  passageFromBookName,
  passageFromQuestion,
  studieLinkForPassage,
  studieReadHref,
} from '@/lib/ecosystem-links';

/**
 * These links are the product now, so the thing worth pinning is that they
 * point at a chapter BijbelStudie can actually open. A wrong book name does
 * not throw anywhere - it lands the reader on the wrong page, quietly, which
 * is the failure mode this file exists to catch.
 */

test('books the two projects spell differently come out in BijbelStudie spelling', () => {
  // Every one of these is a name bijbelquiz writes one way and bijbelstudie
  // another; the canonical code in between is the whole point of book-canon.
  assert.deepEqual(passageFromBookName('Matteus', 5), { book: 'Mattheüs', chapter: 5 });
  assert.deepEqual(passageFromBookName('Mattheus', 5), { book: 'Mattheüs', chapter: 5 });
  assert.deepEqual(passageFromBookName('Marcus', 1), { book: 'Markus', chapter: 1 });
  assert.deepEqual(passageFromBookName('Lucas', 2), { book: 'Lukas', chapter: 2 });
  assert.deepEqual(passageFromBookName('Ezechiel', 37), { book: 'Ezechiël', chapter: 37 });
  assert.deepEqual(passageFromBookName('1 Korintiers', 13), { book: '1 Korinthe', chapter: 13 });
});

test('an unknown book or a missing chapter yields no passage rather than a guess', () => {
  assert.equal(passageFromBookName('Sirach', 1), null);
  assert.equal(passageFromBookName('Genesis', 0), null);
  assert.equal(passageFromBookName(null, 3), null);
  assert.equal(passageFromBookName('Genesis', null), null);
});

test('a question uses its stored reference fields when it has them', () => {
  assert.deepEqual(
    passageFromQuestion({ refBook: 'GEN', refChapter: 3, bibleReference: 'Genesis 3:15' }),
    { book: 'Genesis', chapter: 3 },
  );
});

test('a question written before the reference hook falls back to parsing the string', () => {
  assert.deepEqual(
    passageFromQuestion({ bibleReference: 'Johannes 3:16' }),
    { book: 'Johannes', chapter: 3 },
  );
  assert.equal(passageFromQuestion({ bibleReference: '' }), null);
  assert.equal(passageFromQuestion({}), null);
});

test('the passage of a quiz is the chapter most of its questions point at', () => {
  const questions = [
    { refBook: 'GEN', refChapter: 3 },
    { refBook: 'GEN', refChapter: 3 },
    { refBook: 'GEN', refChapter: 1 },
    { refBook: null, refChapter: null },
  ];

  assert.deepEqual(dominantPassage(questions), { book: 'Genesis', chapter: 3 });
  assert.equal(dominantPassage([]), null);
  assert.equal(dominantPassage([{ bibleReference: 'onzin' }]), null);
});

test('the read link carries the chapter and the attribution', () => {
  const href = studieReadHref(
    { book: 'Genesis', chapter: 3 },
    { surface: 'explanation', quizSlug: 'genesis-deel-1' },
  );
  const url = new URL(href);

  assert.equal(url.origin, 'https://www.bijbelstudie.io');
  assert.equal(url.pathname, '/lezen');
  assert.equal(url.searchParams.get('book'), 'Genesis');
  assert.equal(url.searchParams.get('chapter'), '3');
  assert.equal(url.searchParams.get('utm_source'), 'bijbelquiz');
  assert.equal(url.searchParams.get('utm_medium'), 'explanation');
  assert.equal(url.searchParams.get('utm_campaign'), 'genesis-deel-1');
});

test('a quiz without a resolvable chapter still gets a link', () => {
  // Sending nobody anywhere is the one outcome that cannot be right: the whole
  // change is about not dropping a reader at the end of a quiz.
  const link = studieLinkForPassage(null, { surface: 'result_primary' });
  const url = new URL(link.href);

  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('utm_medium'), 'result_primary');
  assert.equal(link.passage, null);
  assert.ok(link.label.includes('BijbelStudie'));
});

test('a diacritic in the book name survives the query string intact', () => {
  const url = new URL(studieReadHref({ book: 'Mattheüs', chapter: 5 }, { surface: 'review' }));
  assert.equal(url.searchParams.get('book'), 'Mattheüs');
});
