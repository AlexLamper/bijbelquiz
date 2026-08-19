import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bible/chapter?book=Daniël&chapter=2 - a whole chapter, in order.
 *
 * Backs the "read the passage first" option on the quiz start screen. The
 * upstream chapter endpoint returns `verses` as an object keyed by verse
 * number, which has no guaranteed order once it becomes JSON, so the verses are
 * sorted numerically here rather than in every client that renders them.
 *
 * Cached for a day: chapter text does not change, and the quiz start screen is
 * one of the most-opened screens in the product.
 */

const BIJBEL_API_BASE = 'https://www.bijbelapi.com';

/** Longest chapter in the Bible is Psalm 119, at 176 verses. */
const MAX_VERSES = 200;

interface ChapterPayload {
  version?: string;
  book?: string;
  chapter?: string | number;
  verses?: Record<string, string> | Array<{ verse?: string | number; text?: string }>;
}

export interface ChapterVerse {
  verse: number;
  text: string;
}

function readVerses(payload: ChapterPayload): ChapterVerse[] {
  const raw = payload.verses;
  if (!raw) return [];

  const entries: ChapterVerse[] = Array.isArray(raw)
    ? raw.map((item) => ({
        verse: Number(item.verse),
        text: (item.text || '').trim(),
      }))
    : Object.entries(raw).map(([verse, text]) => ({
        verse: Number(verse),
        text: (text || '').trim(),
      }));

  return entries
    .filter((entry) => Number.isFinite(entry.verse) && entry.verse > 0 && entry.text.length > 0)
    .filter((entry) => entry.verse <= MAX_VERSES)
    .sort((a, b) => a.verse - b.verse);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const book = (searchParams.get('book') || '').trim();
  const chapter = Number.parseInt(searchParams.get('chapter') || '', 10);
  const version = searchParams.get('version') || 'sv';

  if (!book || !Number.isFinite(chapter) || chapter < 1) {
    return NextResponse.json({ error: 'book en chapter zijn verplicht' }, { status: 400 });
  }

  const url =
    `${BIJBEL_API_BASE}/api/chapter?book=${encodeURIComponent(book)}` +
    `&chapter=${chapter}&version=${encodeURIComponent(version)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(process.env.BIJBEL_API_KEY ? { 'x-api-key': process.env.BIJBEL_API_KEY } : {}),
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Hoofdstuk niet gevonden' }, { status: 404 });
    }

    const payload = (await response.json()) as ChapterPayload;
    const verses = readVerses(payload);

    if (verses.length === 0) {
      return NextResponse.json({ error: 'Hoofdstuk niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      book: payload.book || book,
      chapter,
      version,
      reference: `${book} ${chapter}`,
      verses,
    });
  } catch (error) {
    console.error('[BIBLE_CHAPTER_GET]', error);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
