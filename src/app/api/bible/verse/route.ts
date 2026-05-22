import { NextRequest, NextResponse } from 'next/server';
import { parseBibleReference, formatReferenceDisplay } from '@/lib/bible-reference';

const BIJBEL_API_BASE = 'https://bijbelapi.com';

function getApiKey(): string {
  return process.env.BIJBEL_API_KEY ?? '';
}

function apiFetch(url: string): Promise<Response> {
  const apiKey = getApiKey();
  return fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    next: { revalidate: 86400 },
  });
}

interface VersePayload {
  text?: string;
  book?: string;
  chapter?: number;
  verse?: number;
  version?: string;
}

interface PassageVerse {
  verse?: number;
  text?: string;
}

interface PassagePayload {
  verses?: PassageVerse[];
  text?: string;
}

interface ParseApiResult {
  book?: string;
  chapter?: number;
  verse?: number;
  endVerse?: number;
  isRange?: boolean;
}

async function fetchSingleVerse(book: string, chapter: number, verse: number, version: string): Promise<string | null> {
  const url = `${BIJBEL_API_BASE}/api/verse?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}&version=${version}`;
  const res = await apiFetch(url);
  if (!res.ok) return null;
  const payload = await res.json() as VersePayload;
  return payload.text?.trim() || null;
}

async function fetchPassage(book: string, chapter: number, verseStart: number, verseEnd: number, version: string): Promise<string | null> {
  const url = `${BIJBEL_API_BASE}/api/passage?book=${encodeURIComponent(book)}&chapter=${chapter}&verseStart=${verseStart}&verseEnd=${verseEnd}&version=${version}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    // Fallback: fetch each verse individually and join
    const texts: string[] = [];
    for (let v = verseStart; v <= verseEnd; v++) {
      const text = await fetchSingleVerse(book, chapter, v, version);
      if (text) texts.push(text);
    }
    return texts.length > 0 ? texts.join(' ') : null;
  }
  const payload = await res.json() as PassagePayload;
  // Passage response may have a single text field or an array of verses
  if (payload.text) return payload.text.trim();
  if (Array.isArray(payload.verses)) {
    return payload.verses.map((v) => v.text?.trim()).filter(Boolean).join(' ') || null;
  }
  return null;
}

async function parseViaApi(ref: string): Promise<ParseApiResult | null> {
  const url = `${BIJBEL_API_BASE}/api/parse/reference/${encodeURIComponent(ref)}`;
  try {
    const res = await apiFetch(url);
    if (!res.ok) return null;
    const data = await res.json() as ParseApiResult;
    if (!data.book || !data.chapter || !data.verse) return null;
    return data;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ref = searchParams.get('ref');
  const version = searchParams.get('version') || 'sv';

  if (!ref) {
    return NextResponse.json({ error: 'ref parameter required' }, { status: 400 });
  }

  try {
    // Step 1: Try local parser
    let parsed = parseBibleReference(ref);
    let resolvedRef = ref;

    // Step 2: Fallback to BijbelAPI parse endpoint
    if (!parsed) {
      const apiParsed = await parseViaApi(ref);
      if (apiParsed?.book && apiParsed.chapter && apiParsed.verse) {
        parsed = {
          book: apiParsed.book,
          chapter: apiParsed.chapter,
          verse: apiParsed.verse,
          endVerse: apiParsed.endVerse,
        };
      }
    }

    if (!parsed) {
      return NextResponse.json({ error: 'Could not parse reference' }, { status: 404 });
    }

    resolvedRef = formatReferenceDisplay(parsed);

    // Step 3: Fetch verse text
    let text: string | null = null;

    if (parsed.endVerse && parsed.endVerse !== parsed.verse) {
      text = await fetchPassage(parsed.book, parsed.chapter, parsed.verse, parsed.endVerse, version);
    } else {
      text = await fetchSingleVerse(parsed.book, parsed.chapter, parsed.verse, version);
    }

    if (!text) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 });
    }

    return NextResponse.json({
      text,
      reference: resolvedRef,
      version,
    });
  } catch (error) {
    console.error('[BIBLE_VERSE_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
