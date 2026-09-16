import test from 'node:test';
import assert from 'node:assert/strict';

import {
  dominantPassage,
  passageFromBookName,
  passageFromQuestion,
  studieLinkForPassage,
  STUDIE_PROMO_CODE,
  STUDIE_PROMO_EXPIRES_AT,
  studiePricingHref,
  studiePromo,
  studieReadHref,
  studieReaderBookName,
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
  assert.equal(url.searchParams.get('version'), 'statenvertaling');
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

// BijbelStudie's Statenvertaling folder names, in canonical order - what
// /lezen?book= must match exactly (public/data/books-index.json over there).
const STATENVERTALING_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numeri', 'Deuteronomium', 'Jozua', 'Richteren', 'Ruth',
  '1 Samuël', '2 Samuël', '1 Koningen', '2 Koningen', '1 Kronieken', '2 Kronieken', 'Ezra',
  'Nehemia', 'Esther', 'Job', 'Psalmen', 'Spreuken', 'Prediker', 'Hooglied', 'Jesaja', 'Jeremia',
  'Klaagliederen', 'Ezechiël', 'Daniël', 'Hosea', 'Joël', 'Amos', 'Obadja', 'Jona', 'Micha',
  'Nahum', 'Habakuk', 'Zefanja', 'Haggaï', 'Zacharia', 'Maleachi', 'Mattheüs', 'Markus', 'Lukas',
  'Johannes', 'Handelingen', 'Romeinen', '1 Corinthiërs', '2 Corinthiër', 'Galaten',
  'Efeziërs', 'Filippenzen', 'Colossenzen', '1 Thessalonicenzen', '2 Thessalonicenzen',
  '1 Timotheüs', '2 Timotheüs', 'Titus', 'Filémon', 'Hebreeën', 'Jakobus', '1 Petrus',
  '2 Petrus', '1 Johannes', '2 Johannes', '3 Johannes', 'Judas', 'Openbaring',
];

const BOOK_CODES_IN_ORDER = [
  'GEN', 'EXOD', 'LEV', 'NUM', 'DEUT', 'JOSH', 'JUDG', 'RUTH', '1SAM', '2SAM', '1KGS', '2KGS',
  '1CHR', '2CHR', 'EZRA', 'NEH', 'ESTH', 'JOB', 'PS', 'PROV', 'ECCL', 'SONG', 'ISA', 'JER', 'LAM',
  'EZEK', 'DAN', 'HOS', 'JOEL', 'AMOS', 'OBAD', 'JONAH', 'MIC', 'NAH', 'HAB', 'ZEPH', 'HAG', 'ZECH',
  'MAL', 'MATT', 'MARK', 'LUKE', 'JOHN', 'ACTS', 'ROM', '1COR', '2COR', 'GAL', 'EPH', 'PHIL', 'COL',
  '1THESS', '2THESS', '1TIM', '2TIM', 'TITUS', 'PHLM', 'HEB', 'JAS', '1PET', '2PET', '1JOHN',
  '2JOHN', '3JOHN', 'JUDE', 'REV',
];

test('every book links to the exact Statenvertaling folder name BijbelStudie opens', () => {
  assert.equal(BOOK_CODES_IN_ORDER.length, 66);
  BOOK_CODES_IN_ORDER.forEach((code, i) => {
    const passage = passageFromQuestion({ refBook: code, refChapter: 1 });
    assert.ok(passage, code);
    const url = new URL(studieReadHref(passage, { surface: 'explanation' }));
    assert.equal(url.searchParams.get('book'), STATENVERTALING_BOOKS[i], code);
    assert.equal(url.searchParams.get('book')?.normalize('NFC'), url.searchParams.get('book'), code);
  });
});

test('the reported Hebreeen link and loose spellings resolve to reader names', () => {
  const url = new URL(
    studieReadHref({ book: 'Hebreeën', chapter: 9 }, { surface: 'explanation', quizSlug: 'hebreeen-bijbelquiz-deel-9' }),
  );
  assert.equal(url.searchParams.get('book'), 'Hebreeën');
  assert.equal(url.searchParams.get('chapter'), '9');
  assert.equal(studieReaderBookName('1 Korinthe'), '1 Corinthiërs');
  assert.equal(studieReaderBookName('1 Korintiers'), '1 Corinthiërs');
  assert.equal(studieReaderBookName('Filemon'), 'Filémon');
  assert.equal(studieReaderBookName('2COR'), '2 Corinthiër');
  assert.equal(studieReaderBookName('Onbekend'), 'Onbekend');
});

test('a diacritic in the book name survives the query string intact', () => {
  const url = new URL(studieReadHref({ book: 'Mattheüs', chapter: 5 }, { surface: 'review' }));
  assert.equal(url.searchParams.get('book'), 'Mattheüs');
});

test('the promo code only shows once it is switched on, and stops at its expiry', () => {
  // Switched off by default so a deploy cannot advertise a code that was never
  // created in BijbelStudie's Stripe.
  assert.equal(studiePromo(Date.parse('2026-10-01T12:00:00+02:00'), undefined), null);
  assert.equal(studiePromo(Date.parse('2026-10-01T12:00:00+02:00'), 'false'), null);

  const promo = studiePromo(Date.parse('2026-10-01T12:00:00+02:00'), 'true');
  assert.equal(promo?.code, STUDIE_PROMO_CODE);

  // The same moment Stripe stops accepting it.
  const expiry = Date.parse(STUDIE_PROMO_EXPIRES_AT);
  assert.ok(studiePromo(expiry, 'true'));
  assert.equal(studiePromo(expiry + 1000, 'true'), null);
});

test('the pricing link goes to the subscription page with the attribution', () => {
  const url = new URL(studiePricingHref({ surface: 'interstitial_offer', quizSlug: 'genesis-deel-1' }));

  assert.equal(url.origin, 'https://www.bijbelstudie.io');
  assert.equal(url.pathname, '/abonnement');
  assert.equal(url.searchParams.get('utm_medium'), 'interstitial_offer');
});
