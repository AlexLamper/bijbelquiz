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

export const QUIZ_IMAGE_COUNT = 12;

const QUIZ_IMAGE_DIR = '/images/quizzes/';
const KNOWN_QUIZ_IMAGE = /^\/images\/quizzes\/img(\d+)\.png$/i;

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
 * exists. Order: explicit quiz image -> category image -> id-derived fallback.
 *
 * Takes `unknown` so it can be handed a Mongoose lean document, a plain API
 * shape, or an aggregation row without a cast at every call site.
 */
export function resolveQuizImageUrl(quiz: unknown): string {
  const q = (quiz ?? {}) as {
    _id?: unknown;
    id?: unknown;
    imageUrl?: unknown;
    image?: unknown;
    categoryImageUrl?: unknown;
  };

  const explicit = normalize(String(q.imageUrl ?? q.image ?? ''));
  if (explicit) return explicit;

  const category = normalize(String(q.categoryImageUrl ?? ''));
  if (category) return category;

  return fallbackQuizImageUrl(String(q._id ?? q.id ?? ''));
}
