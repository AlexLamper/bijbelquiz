import test from 'node:test';
import assert from 'node:assert/strict';

import { bookCodeFromSlug, compareQuizOrder, sortQuizzes, titlePart } from '@/lib/quiz-order';
import { browseBook, sortByChapter, type BrowseQuiz } from '@/lib/quiz-browse-shape';

const chapterQuiz = (book: string, n: number) => ({
  title: `${book[0].toUpperCase()}${book.slice(1)} bijbelquiz - Hoofdstuk ${n}`,
  slug: `${book}-bijbelquiz-deel-${n}`,
});

test('chapters sort as numbers, not as text', () => {
  const shuffled = [100, 2, 10, 1, 23, 3, 150, 11].map((n) => chapterQuiz('psalmen', n));
  const order = sortQuizzes(shuffled, (q) => q).map((q) => titlePart(q.title));
  assert.deepEqual(order, [1, 2, 3, 10, 11, 23, 100, 150]);
});

test('books follow the canon, themes come after the books', () => {
  const list = [
    { title: 'Wie zei het?', slug: 'wie-zei-het' },
    chapterQuiz('openbaring', 1),
    chapterQuiz('johannes', 3),
    chapterQuiz('genesis', 2),
    chapterQuiz('1-korinthe', 13),
    chapterQuiz('genesis', 1),
  ];
  assert.deepEqual(
    sortQuizzes(list, (q) => q).map((q) => q.slug),
    [
      'genesis-bijbelquiz-deel-1',
      'genesis-bijbelquiz-deel-2',
      'johannes-bijbelquiz-deel-3',
      '1-korinthe-bijbelquiz-deel-13',
      'openbaring-bijbelquiz-deel-1',
      'wie-zei-het',
    ],
  );
});

test('older series slugs still find their book', () => {
  assert.equal(bookCodeFromSlug('1-korinthe-bijbelquiz-deel-4'), '1COR');
  assert.equal(bookCodeFromSlug('efeze-bijbelquiz-deel-2'), 'EPH');
  assert.equal(bookCodeFromSlug('2-timotheus-bijbelquiz-deel-1'), '2TIM');
  assert.equal(bookCodeFromSlug('1-samuel-bijbelquiz-deel-17'), '1SAM');
  assert.equal(bookCodeFromSlug('algemene-bijbelkennis'), null);
});

test('a known book wins over the slug; the title chapter wins over anything else', () => {
  // Same book: chapter 16 after chapter 15, even when told the books explicitly.
  assert.ok(compareQuizOrder({ ...chapterQuiz('jesaja', 16), book: 'ISA' }, { ...chapterQuiz('jesaja', 15), book: 'ISA' }) > 0);
});

test('the book view: whole-book quiz first, then the chapters, a story quiz at its chapter', () => {
  const book = browseBook('GEN');
  const card = (title: string, slug: string, chapterFrom: number, chapterTo = chapterFrom): BrowseQuiz => ({
    id: slug,
    slug,
    title,
    description: null,
    reference: null,
    questionCount: 10,
    rewardXp: 50,
    cover: null,
    book,
    chapterFrom,
    chapterTo,
    category: null,
    isPremium: false,
    players: 0,
    progress: null,
  });
  const sorted = sortByChapter([
    card('Genesis bijbelquiz - Hoofdstuk 10', 'genesis-bijbelquiz-deel-10', 10),
    // Cites chapter 1 as well; the title says 2, and 2 is where it belongs.
    card('Genesis bijbelquiz - Hoofdstuk 2', 'genesis-bijbelquiz-deel-2', 1, 2),
    card('De ark van Noach', 'genesis-6-de-ark-van-noach', 6, 7),
    card('Genesis', 'genesis', 1, 50),
    card('Genesis bijbelquiz - Hoofdstuk 1', 'genesis-bijbelquiz-deel-1', 1),
  ]);
  assert.deepEqual(
    sorted.map((q) => q.slug),
    ['genesis', 'genesis-bijbelquiz-deel-1', 'genesis-bijbelquiz-deel-2', 'genesis-6-de-ark-van-noach', 'genesis-bijbelquiz-deel-10'],
  );
});
