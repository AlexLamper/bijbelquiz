import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveQuestionRefs, withDerivedRefs } from '@/lib/quiz-refs';
import {
  emptyQuiz,
  parseImport,
  slugify,
  toEditorQuiz,
  toPayload,
  validateQuiz,
} from '@/components/web2/beheer/quiz-editor-model';

test('deriveQuestionRefs parses the Bijbeltekst into canonical ref fields', () => {
  const refs = deriveQuestionRefs('Dan. 6:11-12');
  assert.equal(refs.refBook, 'DAN');
  assert.equal(refs.refChapter, 6);
  assert.equal(refs.refVerse, 11);
  assert.equal(refs.refVerseEnd, 12);
  assert.deepEqual(deriveQuestionRefs('geen tekst'), { refBook: null, refChapter: null, refVerse: null, refVerseEnd: null });
  assert.deepEqual(deriveQuestionRefs(''), { refBook: null, refChapter: null, refVerse: null, refVerseEnd: null });
});

test('withDerivedRefs keeps the other question fields', () => {
  const [question] = withDerivedRefs([{ _id: 'q1', text: 'Vraag?', bibleReference: 'Genesis 37:3' }]);
  assert.equal(question._id, 'q1');
  assert.equal(question.text, 'Vraag?');
  assert.equal(question.refBook, 'GEN');
  assert.equal(question.refChapter, 37);
});

test('slugify drops accents and punctuation', () => {
  assert.equal(slugify('Daniël en de leeuwenkuil!'), 'daniel-en-de-leeuwenkuil');
  assert.equal(slugify('  Genesis bijbelquiz - Hoofdstuk 37 '), 'genesis-bijbelquiz-hoofdstuk-37');
});

test('validateQuiz flags the old form limits and a missing correct answer', () => {
  const quiz = emptyQuiz();
  const errors = validateQuiz(quiz);
  assert.ok(errors.title && errors.slug && errors.description && errors.categoryId);
  assert.ok(errors['q.0.text']);
  assert.ok(errors['q.0.answers']);

  quiz.title = 'Daniël';
  quiz.slug = 'daniel';
  quiz.description = 'Tien vragen over Daniël.';
  quiz.categoryId = 'cat';
  quiz.questions[0].text = 'Wie werd in de kuil gegooid?';
  quiz.questions[0].answers.forEach((answer, index) => {
    answer.text = `A${index}`;
    answer.isCorrect = false;
  });
  assert.equal(validateQuiz(quiz)['q.0.answers'], 'Vink het goede antwoord aan.');
  quiz.questions[0].answers[1].isCorrect = true;
  assert.deepEqual(validateQuiz(quiz), {});
  quiz.slug = 'met spatie';
  assert.ok(validateQuiz(quiz).slug);
});

test('toEditorQuiz + toPayload keep question and answer ids', () => {
  const editor = toEditorQuiz({
    _id: 'quiz1',
    title: 'T',
    slug: 's',
    categoryId: { _id: 'cat1' },
    difficulty: 'hard',
    status: 'approved',
    questions: [{ _id: 'q1', text: 'Vraag', answers: [{ _id: 'a1', text: 'Ja', isCorrect: true }, { text: 'Nee' }] }],
  });
  assert.equal(editor.categoryId, 'cat1');
  assert.equal(editor.difficulty, 'hard');
  const payload = toPayload(editor);
  assert.equal(payload.questions[0]._id, 'q1');
  assert.equal(payload.questions[0].answers[0]._id, 'a1');
  assert.equal('_id' in payload.questions[0].answers[1], false);
  assert.equal('key' in payload.questions[0], false);
});

test('parseImport validates and resolves the category by title', () => {
  const json = JSON.stringify({
    title: 'Ruth en Naomi',
    description: 'Vragen over het boek Ruth.',
    categoryId: 'Oude Testament',
    questions: [{ text: 'Wie was Naomi?', answers: [{ text: 'Schoonmoeder', isCorrect: true }, { text: 'Zus' }] }],
  });
  const quiz = parseImport(json, [{ _id: 'c1', title: 'Oude Testament' }]);
  assert.equal(quiz.categoryId, 'c1');
  assert.equal(quiz.slug, 'ruth-en-naomi');
  assert.equal(quiz.questions[0].answers[0].isCorrect, true);
  assert.throws(() => parseImport('{nope', []), /Ongeldig JSON/);
  assert.throws(() => parseImport(JSON.stringify({ title: 'x' }), []), /Validatiefout/);
});
