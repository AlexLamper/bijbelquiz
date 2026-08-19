import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveQuizPassage } from '@/lib/quiz-passage';

/**
 * The chapter offered before a quiz is derived, not stored. That makes the
 * failure mode "we offered the wrong chapter", which is worse than offering
 * none - so these tests pin the refusals as hard as the successes.
 */

function refs(...references: string[]) {
  return references.map((bibleReference) => ({ bibleReference }));
}

test('a quiz whose questions agree on one chapter offers it', () => {
  const passage = resolveQuizPassage(
    refs('Daniël 2:1', 'Daniël 2:14', 'Dan. 2:31', 'Daniël 2:47')
  );

  assert.equal(passage?.book, 'Daniël');
  assert.equal(passage?.chapter, 2);
  assert.equal(passage?.label, 'Daniël 2');
});

test('abbreviations and full names count as the same chapter', () => {
  const passage = resolveQuizPassage(refs('Gen. 1:1', 'Genesis 1:3', 'Gen 1:27'));

  assert.equal(passage?.label, 'Genesis 1');
  assert.equal(passage?.confidence, 1);
});

test('a quiz spanning many books offers nothing', () => {
  const passage = resolveQuizPassage(
    refs('Genesis 1:1', 'Exodus 3:2', 'Matteüs 5:9', 'Openbaring 21:1', 'Psalmen 23:1')
  );

  assert.equal(passage, null);
});

test('one stray chapter does not outvote the rest', () => {
  const passage = resolveQuizPassage(
    refs('Daniël 2:1', 'Daniël 2:5', 'Daniël 2:9', 'Daniël 2:20', 'Jesaja 6:1')
  );

  assert.equal(passage?.label, 'Daniël 2');
  assert.ok((passage?.confidence ?? 0) >= 0.6);
});

test('too few references is not enough to offer a chapter', () => {
  // Two matching references could just as easily be a coincidence in a quiz
  // that is mostly unreferenced.
  assert.equal(resolveQuizPassage(refs('Ruth 1:16', 'Ruth 1:17')), null);
});

test('unreferenced questions yield nothing rather than a guess', () => {
  assert.equal(resolveQuizPassage([{}, {}, {}, {}]), null);
  assert.equal(resolveQuizPassage(refs('', '  ', 'onzin zonder hoofdstuk')), null);
});
