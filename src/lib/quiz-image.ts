/**
 * Quiz cover images without cloud storage.
 *
 * Only `public/images/quizzes/img1.png` .. `img{QUIZ_IMAGE_COUNT}.png` exist on
 * disk. Quizzes get their `imageUrl` from a free-text admin field, so most
 * quizzes created after the initial seed have no image at all - on the website
 * that fell back to a book icon, and in the Flutter app to a broken image or a
 * `menu_book` placeholder.
 *
 * `resolveQuizImageUrl` closes that gap: an explicit `imageUrl` (or the
 * category's image) still wins, but a quiz without one is given a stable image
 * derived from its id, so every quiz has a cover, the same one every time, with
 * no database migration.
 */

import { coverForSlug } from './quiz-covers.generated';

export const QUIZ_IMAGE_COUNT = 12;

const QUIZ_IMAGE_DIR = '/images/quizzes/';
const KNOWN_QUIZ_IMAGE = /^\/images\/quizzes\/img(\d+)\.png$/i;

/** Where a quiz with no usable image of its own ends up. */
export const DEFAULT_QUIZ_IMAGE = `${QUIZ_IMAGE_DIR}img1.png`;

/** A bare file name, no directories and no traversal. */
const SAFE_IMAGE_FILE = /^[a-z0-9][a-z0-9._-]*\.(png|jpg|jpeg|webp)$/;

/** Stable, well-spread index in 1..QUIZ_IMAGE_COUNT for a given id string. */
export function quizImageIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % QUIZ_IMAGE_COUNT) + 1;
}

/** The deterministic fallback path for a quiz id. */
export function fallbackQuizImageUrl(id: string): string {
  return `${QUIZ_IMAGE_DIR}img${quizImageIndex(id || 'quiz')}.png`;
}

function normalize(raw: string): string | null {
  const value = raw.trim();
  if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
    return null;
  }

  // Absolute URL or already an absolute site path - trust it, except a
  // /images/quizzes/imgN.png that points past what exists on disk.
  if (/^https?:\/\//i.test(value)) return value;

  const withSlash = value.startsWith('/') ? value : `/${value.replace(/^public\//, '')}`;
  const known = withSlash.match(KNOWN_QUIZ_IMAGE);
  if (known) {
    const n = Number(known[1]);
    return n >= 1 && n <= QUIZ_IMAGE_COUNT ? withSlash : null;
  }

  // A bare filename - assume it belongs in the quizzes folder.
  if (!withSlash.slice(1).includes('/')) {
    return `${QUIZ_IMAGE_DIR}${withSlash.slice(1)}`;
  }

  return withSlash;
}

/**
 * Best available cover image for a quiz, guaranteed to resolve to a file that
 * exists. Order: explicit quiz image -> drawn cover for the slug -> category
 * image -> id-derived fallback.
 *
 * The slug step is what keeps a newly imported quiz from wearing its
 * category's picture. `assign-quiz-images.mts` writes `imageUrl` per quiz, but
 * only for quizzes that existed the last time somebody ran it; every quiz
 * added since fell through to the category and forty-two of them ended up
 * identical. The drawn covers are named after the slug, so the file on disk can
 * answer directly and a new quiz is correct as soon as its cover is rendered.
 *
 * Takes `unknown` so it can be handed a Mongoose lean document, a plain API
 * shape, or an aggregation row without a cast at every call site.
 */
export function resolveQuizImageUrl(quiz: unknown): string {
  const q = (quiz ?? {}) as {
    _id?: unknown;
    id?: unknown;
    slug?: unknown;
    imageUrl?: unknown;
    image?: unknown;
    categoryImageUrl?: unknown;
  };

  const explicit = normalize(String(q.imageUrl ?? q.image ?? ''));
  if (explicit) return explicit;

  const drawn = coverForSlug(typeof q.slug === 'string' ? q.slug : null);
  if (drawn) return drawn;

  const category = normalize(String(q.categoryImageUrl ?? ''));
  if (category) return category;

  return fallbackQuizImageUrl(String(q._id ?? q.id ?? ''));
}

/**
 * Sanitises an image path coming out of the database for a client that cannot
 * fall back on its own (the mobile app, the season banner).
 *
 * This used to be three copies of an `img1..img10` allowlist, which meant a
 * quiz with its own artwork - `/images/quizzes/marcus-bijbelquiz-deel-1.png` -
 * was silently replaced by img1. Any safe file name in the quizzes folder is
 * accepted now; the numbered files are still range-checked, because a stale
 * `img14.png` really does point at nothing.
 */
export function normalizeQuizImagePath(value?: string): string {
  const image = value?.trim();
  if (!image) return DEFAULT_QUIZ_IMAGE;

  const lower = image.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return image;
  if (!lower.startsWith(QUIZ_IMAGE_DIR)) return image;

  const fileName = lower.slice(QUIZ_IMAGE_DIR.length);
  if (!SAFE_IMAGE_FILE.test(fileName)) return DEFAULT_QUIZ_IMAGE;

  const numbered = fileName.match(/^img(\d+)\.png$/);
  if (numbered && Number(numbered[1]) > QUIZ_IMAGE_COUNT) return DEFAULT_QUIZ_IMAGE;

  return `${QUIZ_IMAGE_DIR}${fileName}`;
}
