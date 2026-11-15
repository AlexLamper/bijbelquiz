/**
 * English Bible text for the intl site: the World English Bible (WEB), which is
 * public domain, via bible-api.com (free, no key; rate limited to roughly 15
 * requests per 30 seconds per IP, so every call is cached for a day and the
 * quiz screens fetch each reference once). Swap the base URL for a self-hosted
 * copy of the same data if the limit ever bites; the shape stays the same.
 */
import { getSiteConfig } from '@/config/site';
import { apiBookName } from '@/lib/bible-books';
import { toBookCode } from '@/lib/book-canon';

const BASE = 'https://bible-api.com';
export const ENGLISH_VERSION = 'web';

/**
 * BijbelAPI version per language build. Spanish has no verified public-domain
 * text yet, so it (like English) reads the World English Bible.
 */
const VERSION_BY_LOCALE: Record<string, string> = { de: 'luth1912', fr: 'lsg1910', pt: 'blivre' };

/** The Bible version this build shows. */
export function bibleVersion(): string {
  return VERSION_BY_LOCALE[getSiteConfig().defaultLocale] ?? ENGLISH_VERSION;
}

/** Book name as BijbelAPI wants it (English), whatever language the book was written in. */
function apiBook(book: string): string {
  return apiBookName(toBookCode(book)) ?? book;
}

interface ApiVerse {
  verse: number;
  text: string;
}

interface ApiPayload {
  reference?: string;
  text?: string;
  verses?: ApiVerse[];
  translation_id?: string;
}

const OWN_API = 'https://www.bijbelapi.com';

function ownHeaders(): Record<string, string> {
  const key = process.env.BIJBEL_API_KEY ?? '';
  return { Accept: 'application/json', ...(key ? { 'x-api-key': key } : {}) };
}

/** Our own BijbelAPI first (`version=web`); null when it has no English text yet. */
async function ownChapter(book: string, chapter: number, version: string = ENGLISH_VERSION): Promise<{ verse: number; text: string }[] | null> {
  try {
    const res = await fetch(`${OWN_API}/api/chapter?book=${encodeURIComponent(apiBook(book))}&chapter=${chapter}&version=${version}`, {
      headers: ownHeaders(),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { version?: string; verses?: Record<string, string> };
    // The API silently falls back to its default (Dutch) translation when it does not know `web`.
    if (payload.version !== version || !payload.verses) return null;
    return Object.entries(payload.verses).map(([verse, text]) => ({ verse: Number(verse), text: String(text) }));
  } catch {
    return null;
  }
}

async function lookup(ref: string): Promise<ApiPayload | null> {
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(ref)}?translation=${ENGLISH_VERSION}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ApiPayload;
  } catch {
    return null;
  }
}

/** One reference ("John 3:16-18"): its text, collapsed onto a single line. */
export async function englishVerse(ref: string): Promise<{ text: string; reference: string; version: string } | null> {
  const version = bibleVersion();
  if (version !== ENGLISH_VERSION) {
    const m = ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
    const verses = m ? await ownChapter(m[1], Number(m[2]), version) : null;
    if (m && verses) {
      const from = m[3] ? Number(m[3]) : 1;
      const to = m[4] ? Number(m[4]) : m[3] ? from : Number.MAX_SAFE_INTEGER;
      const text = verses
        .filter((v) => v.verse >= from && v.verse <= to)
        .sort((a, b) => a.verse - b.verse)
        .map((v) => v.text.replace(/\s+/g, ' ').trim())
        .join(' ');
      if (text) return { text, reference: ref.trim(), version };
    }
    // Not available in this language: fall through to the English text.
  }
  const payload = await lookup(ref);
  const text = payload?.text?.replace(/\s+/g, ' ').trim();
  if (!payload || !text) return null;
  return { text, reference: payload.reference?.trim() || ref, version: ENGLISH_VERSION };
}

/** A whole chapter, verses in order. */
export async function englishChapter(
  book: string,
  chapter: number,
): Promise<{ book: string; chapter: number; version: string; reference: string; verses: { verse: number; text: string }[] } | null> {
  const version = bibleVersion();
  const local = version !== ENGLISH_VERSION ? await ownChapter(book, chapter, version) : null;
  const own = local ?? (await ownChapter(book, chapter));
  const payload = own ? { verses: own } : await lookup(`${apiBook(book)} ${chapter}`);
  const verses = (payload?.verses ?? [])
    .map((v) => ({ verse: Number(v.verse), text: (v.text || '').replace(/\s+/g, ' ').trim() }))
    .filter((v) => Number.isFinite(v.verse) && v.verse > 0 && v.text.length > 0)
    .sort((a, b) => a.verse - b.verse);
  if (verses.length === 0) return null;
  return { book, chapter, version: local ? version : ENGLISH_VERSION, reference: `${book} ${chapter}`, verses };
}
