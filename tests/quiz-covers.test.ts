import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { QUIZ_COVER_SLUGS, coverForSlug } from '@/lib/quiz-covers.generated';
import { quizThumbnailUrl, resolveQuizImageUrl } from '@/lib/quiz-image';

const root = process.cwd();
const coverDir = path.join(root, 'public/images/quizzes');

/**
 * The generated slug list is the runtime's only way of knowing which quizzes
 * have artwork, and nothing at runtime can check it - a browser cannot read
 * the folder. So it is checked here instead: a list that names a cover which
 * was never drawn puts a 404 on a quiz grid, silently.
 */

test('every slug in the generated list has a cover on disk', () => {
  const missing = [...QUIZ_COVER_SLUGS].filter(
    (slug) => !fs.existsSync(path.join(coverDir, `${slug}.png`)),
  );
  assert.deepEqual(missing, [], `no PNG for: ${missing.join(', ')}`);
});

test('every drawn cover is in the manifest the generator reads', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/quiz-image-prompts/manifest.json'), 'utf8'),
  ) as { quizzes: Array<{ slug: string }> };

  const inManifest = new Set(manifest.quizzes.map((q) => q.slug));
  const orphans = [...QUIZ_COVER_SLUGS].filter((slug) => !inManifest.has(slug));
  assert.deepEqual(orphans, [], `not in manifest: ${orphans.join(', ')}`);
});

test('the quizzes added after the last image assignment have their own cover', () => {
  // The forty-two that shared a category picture. Spot-checking the ends of
  // both series is enough to catch a regeneration that dropped them.
  for (const slug of [
    'jesaja-bijbelquiz-deel-3',
    'jesaja-bijbelquiz-deel-40',
    'klaagliederen-bijbelquiz-deel-1',
    'klaagliederen-bijbelquiz-deel-4',
  ]) {
    assert.equal(coverForSlug(slug), `/images/quizzes/${slug}.png`, slug);
  }
});

test('a quiz with no imageUrl gets the cover drawn for its slug', () => {
  assert.equal(
    resolveQuizImageUrl({ _id: 'abc', slug: 'klaagliederen-bijbelquiz-deel-2' }),
    '/images/quizzes/klaagliederen-bijbelquiz-deel-2.png',
  );
});

test('the category picture is only used when the slug has no cover', () => {
  // This is the bug the slug step exists to prevent: a whole category of new
  // quizzes rendering one identical image.
  assert.equal(
    resolveQuizImageUrl({
      _id: 'abc',
      slug: 'jesaja-bijbelquiz-deel-12',
      categoryImageUrl: '/images/quizzes/img2.png',
    }),
    '/images/quizzes/jesaja-bijbelquiz-deel-12.png',
  );

  assert.equal(
    resolveQuizImageUrl({
      _id: 'abc',
      slug: 'een-quiz-zonder-cover',
      categoryImageUrl: '/images/quizzes/img2.png',
    }),
    '/images/quizzes/img2.png',
  );
});

test("a quiz's own imageUrl still wins over the drawn cover", () => {
  assert.equal(
    resolveQuizImageUrl({
      _id: 'abc',
      slug: 'jesaja-bijbelquiz-deel-12',
      imageUrl: 'https://example.com/eigen-cover.png',
    }),
    'https://example.com/eigen-cover.png',
  );
});

test('an unknown slug falls through to the id-derived rotation', () => {
  const url = resolveQuizImageUrl({ _id: 'zzz', slug: 'bestaat-niet' });
  assert.match(url, /^\/images\/quizzes\/img\d+\.png$/);
});

test('a numbered placeholder in the database gives way to the drawn cover', () => {
  assert.equal(
    resolveQuizImageUrl({
      _id: 'abc',
      slug: 'jesaja-bijbelquiz-deel-12',
      imageUrl: '/images/quizzes/img4.png',
    }),
    '/images/quizzes/jesaja-bijbelquiz-deel-12.png',
  );
});

test('a placeholder stays when the quiz has no drawn cover', () => {
  assert.equal(
    resolveQuizImageUrl({ _id: 'abc', slug: 'bestaat-niet', imageUrl: '/images/quizzes/img4.png' }),
    '/images/quizzes/img4.png',
  );
});

test('every cover has a thumbnail on disk', () => {
  const missing = [...QUIZ_COVER_SLUGS].filter(
    (slug) => !fs.existsSync(path.join(coverDir, 'thumbs', `${slug}.webp`)),
  );
  assert.deepEqual(
    missing,
    [],
    `run scripts/generate-quiz-thumbnails.py - no thumbnail for: ${missing.join(', ')}`,
  );
});

test('thumbnail paths follow the cover path, and only for local covers', () => {
  assert.equal(
    quizThumbnailUrl('/images/quizzes/jesaja-bijbelquiz-deel-3.png'),
    '/images/quizzes/thumbs/jesaja-bijbelquiz-deel-3.webp',
  );
  assert.equal(quizThumbnailUrl('https://example.com/cover.png'), null);
  assert.equal(quizThumbnailUrl(''), null);
});
