import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeRecommendationProfile,
  hasRecommendationProfile,
  INTEREST_OPTIONS,
  recommendQuizzes,
  type RecommendableQuiz,
} from '@/lib/quiz-recommendations';

/**
 * The reader-facing promise of this module is narrow but strict: the answers on
 * the settings page must visibly change the order of the list. The tests below
 * pin exactly that, because the failure mode is silent - a broken mapping still
 * returns six quizzes, just the same six for everybody.
 */

function quiz(partial: Partial<RecommendableQuiz> & { title: string }): RecommendableQuiz {
  return {
    _id: partial.title,
    difficulty: 'medium',
    questions: Array.from({ length: 10 }, (_, index) => ({ index })),
    ...partial,
  };
}

const LIBRARY: RecommendableQuiz[] = [
  quiz({
    title: 'Genesis',
    categoryId: { title: 'Oude Testament', slug: 'oude-testament' },
    difficulty: 'easy',
  }),
  quiz({
    title: 'Handelingen van de apostelen',
    categoryId: { title: 'Nieuwe Testament', slug: 'nieuwe-testament' },
    difficulty: 'hard',
  }),
  quiz({
    title: 'Spreuken',
    categoryId: { title: 'Studie', slug: 'studie' },
    difficulty: 'medium',
  }),
  quiz({
    title: 'Algemene Bijbelkennis',
    categoryId: { title: 'Algemeen', slug: 'algemeen' },
    difficulty: 'medium',
  }),
];

test('an interest promotes its own category to the top', () => {
  const [first] = recommendQuizzes(LIBRARY, {
    interests: ['nieuwe-testament'],
    knowledgeLevel: '',
    bibleReadingFrequency: '',
  });

  assert.equal(first.quiz.title, 'Handelingen van de apostelen');
  assert.ok(
    first.reasons.includes('Interesse: Nieuwe Testament'),
    `expected an interest reason, got ${JSON.stringify(first.reasons)}`,
  );
});

test('every interest option maps onto at least one category slug', () => {
  // A checkbox that matches nothing is worse than no checkbox: the reader ticks
  // it and the list does not move.
  for (const option of INTEREST_OPTIONS) {
    const ranked = recommendQuizzes(LIBRARY, {
      interests: [option.value],
      knowledgeLevel: '',
      bibleReadingFrequency: '',
    });

    assert.ok(
      ranked.some((entry) => entry.reasons.some((reason) => reason.includes(option.label))),
      `interest "${option.value}" matched nothing in the sample library`,
    );
  }
});

test('the self-rated level decides the difficulty that wins', () => {
  const beginner = recommendQuizzes(LIBRARY, {
    interests: [],
    knowledgeLevel: 'beginner',
    bibleReadingFrequency: '',
  });
  assert.equal(beginner[0].quiz.difficulty, 'easy');

  const advanced = recommendQuizzes(LIBRARY, {
    interests: [],
    knowledgeLevel: 'advanced',
    bibleReadingFrequency: '',
  });
  assert.equal(advanced[0].quiz.difficulty, 'hard');
});

test('a quiz already played twice ranks below an untouched one', () => {
  const played = quiz({
    title: 'Genesis herhaald',
    categoryId: { title: 'Oude Testament', slug: 'oude-testament' },
    difficulty: 'easy',
    progress: { attempts: 3 },
  });

  const ranked = recommendQuizzes([played, ...LIBRARY], {
    interests: ['oude-testament'],
    knowledgeLevel: 'beginner',
    bibleReadingFrequency: '',
  });

  const playedIndex = ranked.findIndex((entry) => entry.quiz.title === 'Genesis herhaald');
  const freshIndex = ranked.findIndex((entry) => entry.quiz.title === 'Genesis');

  assert.ok(freshIndex !== -1 && freshIndex < playedIndex, 'a fresh quiz must outrank a replayed one');
});

test('reading rhythm prefers short quizzes for occasional readers', () => {
  const long = quiz({
    title: 'Diepere Bijbelstudie',
    categoryId: { title: 'Studie', slug: 'studie' },
    questions: Array.from({ length: 20 }, (_, index) => ({ index })),
  });
  const short = quiz({
    title: 'Korte ronde',
    categoryId: { title: 'Studie', slug: 'studie' },
    questions: Array.from({ length: 8 }, (_, index) => ({ index })),
  });

  const rarely = recommendQuizzes([long, short], {
    interests: [],
    knowledgeLevel: '',
    bibleReadingFrequency: 'rarely',
  });
  assert.equal(rarely[0].quiz.title, 'Korte ronde');

  const daily = recommendQuizzes([short, long], {
    interests: [],
    knowledgeLevel: '',
    bibleReadingFrequency: 'daily',
  });
  assert.equal(daily[0].quiz.title, 'Diepere Bijbelstudie');
});

test('an empty profile is reported as having no profile', () => {
  assert.equal(
    hasRecommendationProfile({ interests: [], knowledgeLevel: '', bibleReadingFrequency: '' }),
    false,
  );
  assert.equal(describeRecommendationProfile({ interests: [], knowledgeLevel: '', bibleReadingFrequency: '' }), null);

  assert.equal(hasRecommendationProfile({ interests: ['profeten'] }), true);
});

test('the profile summary names the answers it used', () => {
  const summary = describeRecommendationProfile({
    interests: ['profeten'],
    knowledgeLevel: 'intermediate',
    bibleReadingFrequency: 'daily',
  });

  assert.ok(summary?.includes('Profeten'), summary || '(null)');
  assert.ok(summary?.includes('gemiddeld'), summary || '(null)');
  assert.ok(summary?.includes('dagelijks'), summary || '(null)');
});

test('the limit is respected and the order is stable', () => {
  const options = { interests: ['oude-testament'], knowledgeLevel: 'beginner', bibleReadingFrequency: 'weekly' };

  const first = recommendQuizzes(LIBRARY, options, { limit: 2 });
  const second = recommendQuizzes(LIBRARY, options, { limit: 2 });

  assert.equal(first.length, 2);
  assert.deepEqual(
    first.map((entry) => entry.quiz.title),
    second.map((entry) => entry.quiz.title),
  );
});
