import { NextResponse } from 'next/server';

import { dutchReference, dutchReferenceString } from '@/lib/daytext-reference';

interface DayTextPayload {
  book?: string;
  chapter?: number;
  verse?: number;
  verse_end?: number | string;
  version?: string;
  text?: string;
  reference?: string;
}

function toReference(payload: DayTextPayload): string {
  // BijbelAPI names the book in English ("Proverbs"); the site shows Dutch.
  if (payload.reference && payload.reference.trim().length > 0) {
    return dutchReferenceString(payload.reference);
  }

  if (payload.book && payload.chapter && payload.verse) {
    return dutchReference({ book: payload.book, chapter: payload.chapter, verse: payload.verse, verseEnd: payload.verse_end });
  }

  return 'Dagtekst';
}

export async function GET() {
  try {
    const apiKey =
      process.env.BIJBEL_API_KEY ||
      process.env.BIJBELAPI_KEY ||
      process.env.NEXT_PUBLIC_BIJBEL_API_KEY ||
      '';

    const response = await fetch('https://bijbelapi.com/api/daytext?version=bb', {
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`BijbelAPI daytext request failed with ${response.status}`);
    }

    const payload = (await response.json()) as DayTextPayload;

    return NextResponse.json({
      source: 'bijbelapi',
      reference: toReference(payload),
      text: payload.text || '',
      version: payload.version || 'bb',
      docsUrl: 'https://www.bijbelapi.com/docs',
    });
  } catch (error) {
    console.error('[BIJBELAPI_DAYTEXT_GET]', error);
    return NextResponse.json(
      {
        source: 'fallback',
        reference: 'Psalm 119:105',
        text: 'Uw woord is een lamp voor mijn voet en een licht op mijn pad.',
        version: 'bb',
        docsUrl: 'https://www.bijbelapi.com/docs',
      },
      { status: 200 }
    );
  }
}
