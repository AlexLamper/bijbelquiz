/**
 * English Bible text for the intl site: the World English Bible (WEB), which is
 * public domain, via bible-api.com (free, no key; rate limited to roughly 15
 * requests per 30 seconds per IP, so every call is cached for a day and the
 * quiz screens fetch each reference once). Swap the base URL for a self-hosted
 * copy of the same data if the limit ever bites; the shape stays the same.
 */
const BASE = 'https://bible-api.com';
export const ENGLISH_VERSION = 'web';

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
  const payload = await lookup(`${book} ${chapter}`);
  const verses = (payload?.verses ?? [])
    .map((v) => ({ verse: Number(v.verse), text: (v.text || '').replace(/\s+/g, ' ').trim() }))
    .filter((v) => Number.isFinite(v.verse) && v.verse > 0 && v.text.length > 0)
    .sort((a, b) => a.verse - b.verse);
  if (verses.length === 0) return null;
  return { book, chapter, version: ENGLISH_VERSION, reference: `${book} ${chapter}`, verses };
}
