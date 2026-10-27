'use client';

import { useState } from 'react';

export interface VerseResult {
  text: string;
  reference: string;
  version: string;
}

// Per page visit: the same reference is never fetched twice.
const verseCache = new Map<string, VerseResult | 'error'>();

interface VerseState {
  reference: string;
  open: boolean;
  loading: boolean;
  result: VerseResult | null;
  failed: boolean;
}

const closed = (reference: string): VerseState => ({ reference, open: false, loading: false, result: null, failed: false });

/**
 * The text of one Bible reference, fetched on demand (the "Lees Johannes 6:9"
 * chip). Free for everyone, as in the app: only the written explanation is
 * Premium.
 */
export function useVerse(reference: string) {
  const [state, setState] = useState<VerseState>(() => closed(reference));

  // A new question resets the chip.
  if (state.reference !== reference) setState(closed(reference));
  const current = state.reference === reference ? state : closed(reference);

  const toggle = async () => {
    if (current.open) {
      setState({ ...current, open: false });
      return;
    }
    const cached = verseCache.get(reference);
    if (cached) {
      setState({ reference, open: true, loading: false, result: cached === 'error' ? null : cached, failed: cached === 'error' });
      return;
    }
    setState({ ...current, loading: true });
    try {
      const response = await fetch(`/api/bible/verse?ref=${encodeURIComponent(reference)}&version=sv`);
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as VerseResult;
      verseCache.set(reference, data);
      setState({ reference, open: true, loading: false, result: data, failed: false });
    } catch {
      verseCache.set(reference, 'error');
      setState({ reference, open: true, loading: false, result: null, failed: true });
    }
  };

  return { ...current, toggle };
}
