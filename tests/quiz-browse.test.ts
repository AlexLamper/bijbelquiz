import test from 'node:test';
import assert from 'node:assert/strict';

import {
  browseBook,
  continueInBook,
  pickPerTestament,
  pickPopular,
  referenceFor,
  searchQuizzes,
  themeGroups,
  type BrowseQuiz,
} from '@/lib/quiz-browse-shape';
import { quizzenHref, readQuizzenState } from '@/components/web2/browsing/quizzen-view';

function quiz(id: string, overrides: Partial<BrowseQuiz> & { bookCode?: string | null } = {}): BrowseQuiz {
  const { bookCode = null, ...rest } = overrides;
  const book = browseBook(bookCode);
  return {
    id,
    slug: id,
    title: id,
    description: null,
    reference: null,
    questionCount: 10,
    rewardXp: 50,
    cover: null,
    book,
    chapterFrom: book ? 1 : null,
    chapterTo: book ? 1 : null,
    category: null,
    isPremium: false,
    players: 0,
    progress: null,
    ...rest,
  };
}

function played(at: string) {
  return { attempts: 1, bestCorrect: 5, total: 10, lastPlayedAt: at };
}

test('referenceFor names the chapter of a short span and only the book of a long one', () => {
  assert.equal(referenceFor('Johannes', 6, 6), 'Johannes 6');
  assert.equal(referenceFor('Genesis', 6, 9), 'Genesis 6');
  assert.equal(referenceFor('Spreuken', 1, 22), 'Spreuken');
  assert.equal(referenceFor('Ruth', null, null), 'Ruth');
  assert.equal(referenceFor(null, 1, 1), null);
});

test('pickPopular orders by players and keeps the catalogue order on ties', () => {
  const list = [quiz('a'), quiz('b', { players: 3 }), quiz('c'), quiz('d', { players: 7 })];
  assert.deepEqual(pickPopular(list, 3).map((entry) => entry.id), ['d', 'b', 'a']);
  assert.deepEqual(pickPopular(list, 2, new Set(['d'])).map((entry) => entry.id), ['b', 'a']);
});

test('pickPerTestament takes one quiz per book, never one already shown', () => {
  const list = [
    quiz('gen-1', { bookCode: 'GEN', players: 1 }),
    quiz('gen-2', { bookCode: 'GEN', players: 4 }),
    quiz('ex-1', { bookCode: 'EXOD', players: 2 }),
    quiz('joh-1', { bookCode: 'JOHN', players: 9 }),
  ];
  assert.deepEqual(pickPerTestament(list, 'OT', 4).map((entry) => entry.id), ['gen-2', 'ex-1']);
  assert.deepEqual(pickPerTestament(list, 'OT', 4, new Set(['gen-2'])).map((entry) => entry.id), ['ex-1', 'gen-1']);
  assert.deepEqual(pickPerTestament(list, 'NT', 4).map((entry) => entry.id), ['joh-1']);
});

test('themeGroups groups quizzes without a book by category', () => {
  const list = [
    quiz('wie', { category: { slug: 'algemeen', title: 'Algemeen' } }),
    quiz('vrouwen', { category: { slug: 'themas', title: "Thema's" } }),
    quiz('meer', { category: { slug: 'algemeen', title: 'Algemeen' } }),
    quiz('joh', { bookCode: 'JOHN', category: { slug: 'nt', title: 'Nieuwe Testament' } }),
  ];
  const groups = themeGroups(list);
  assert.deepEqual(groups.map((group) => [group.key, group.quizzes.length]), [['algemeen', 2], ['themas', 1]]);
});

test('continueInBook offers the next unplayed chapter of the last book played', () => {
  const list = [
    quiz('joh-1', { bookCode: 'JOHN', chapterFrom: 1, chapterTo: 1, progress: played('2026-10-01T10:00:00.000Z') }),
    quiz('joh-2', { bookCode: 'JOHN', chapterFrom: 2, chapterTo: 2 }),
    quiz('joh-6', { bookCode: 'JOHN', chapterFrom: 6, chapterTo: 6, progress: played('2026-10-20T10:00:00.000Z') }),
    quiz('joh-11', { bookCode: 'JOHN', chapterFrom: 11, chapterTo: 11 }),
    quiz('dan-6', { bookCode: 'DAN', chapterFrom: 6, chapterTo: 6, progress: played('2026-10-10T10:00:00.000Z') }),
  ];
  const resume = continueInBook(list);
  assert.equal(resume?.next.id, 'joh-11');
  assert.equal(resume?.played, 2);
  assert.equal(resume?.total, 4);
});

test('continueInBook moves to an earlier book when the last one is finished, and is null without plays', () => {
  const list = [
    quiz('dan-6', { bookCode: 'DAN', chapterFrom: 6, chapterTo: 6, progress: played('2026-10-20T10:00:00.000Z') }),
    quiz('gen-1', { bookCode: 'GEN', chapterFrom: 1, chapterTo: 1, progress: played('2026-10-01T10:00:00.000Z') }),
    quiz('gen-3', { bookCode: 'GEN', chapterFrom: 3, chapterTo: 3 }),
  ];
  assert.equal(continueInBook(list)?.next.id, 'gen-3');
  assert.equal(continueInBook([quiz('gen-3', { bookCode: 'GEN' })]), null);
});

test('searchQuizzes ignores case and diacritics and needs every word', () => {
  const list = [
    quiz('leeuw', { title: 'In de leeuwenkuil', bookCode: 'DAN', reference: 'Daniël 6' }),
    quiz('kana', { title: 'De bruiloft in Kana', bookCode: 'JOHN', reference: 'Johannes 2' }),
  ];
  assert.deepEqual(searchQuizzes(list, 'daniel').map((entry) => entry.id), ['leeuw']);
  assert.deepEqual(searchQuizzes(list, 'BRUILOFT johannes').map((entry) => entry.id), ['kana']);
  assert.deepEqual(searchQuizzes(list, '   '), []);
});

test('the /quizzen query string round-trips and maps old category links', () => {
  const params = (search: string) => new URLSearchParams(search);
  assert.deepEqual(readQuizzenState(params('')), { view: { kind: 'overview' }, query: '' });
  assert.deepEqual(readQuizzenState(params('filter=nieuwe-testament')).view, { kind: 'testament', testament: 'NT' });
  assert.deepEqual(readQuizzenState(params('boek=Johannes')).view, { kind: 'book', slug: 'johannes' });
  assert.deepEqual(readQuizzenState(params('category=oude-testament')).view, { kind: 'testament', testament: 'OT' });
  assert.deepEqual(readQuizzenState(params('categorie=advent')).view, { kind: 'theme', key: 'advent' });
  assert.equal(quizzenHref({ kind: 'book', slug: 'johannes' }), '/quizzen?boek=johannes');
  assert.equal(quizzenHref({ kind: 'overview' }, ' jona '), '/quizzen?q=jona');
  assert.equal(quizzenHref({ kind: 'overview' }), '/quizzen');
});
