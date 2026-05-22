'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BibleVerseDisplayProps {
  reference: string;
  className?: string;
}

interface VerseResult {
  text: string;
  reference: string;
  version: string;
}

// Session-level cache: avoids re-fetching the same reference within one page visit
const verseCache = new Map<string, VerseResult | 'error'>();

export default function BibleVerseDisplay({ reference, className }: BibleVerseDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerseResult | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  async function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    // Already fetched successfully
    if (result) {
      setExpanded(true);
      return;
    }

    // Check session cache first
    const cached = verseCache.get(reference);
    if (cached === 'error') {
      // Previously failed — just expand without showing an error to the user
      setExpanded(true);
      setFetchFailed(true);
      return;
    }
    if (cached) {
      setResult(cached);
      setExpanded(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/bible/verse?ref=${encodeURIComponent(reference)}&version=sv`
      );

      if (!res.ok) throw new Error(`${res.status}`);

      const data = (await res.json()) as VerseResult;
      verseCache.set(reference, data);
      setResult(data);
      setExpanded(true);
    } catch {
      verseCache.set(reference, 'error');
      setFetchFailed(true);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn('mt-3', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1.5 rounded border border-[#d7e1ee] bg-white px-2.5 py-1 text-xs font-medium text-[#355384] transition-colors',
          'hover:bg-[#f0f5ff] hover:border-[#b5c8e8] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
          loading && 'cursor-wait opacity-70',
        )}
        aria-expanded={expanded}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <BookOpen className="h-3 w-3" aria-hidden />
        )}
        Referentie: {reference}
        {!loading && (
          expanded
            ? <ChevronUp className="h-3 w-3 ml-0.5" aria-hidden />
            : <ChevronDown className="h-3 w-3 ml-0.5" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="mt-2 rounded-md border border-[#d7e1ee] bg-[#f8fbff] px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/60">
          {result && !fetchFailed ? (
            <>
              <p className="font-serif text-sm italic leading-relaxed text-[#1f3a5c] dark:text-zinc-200">
                &ldquo;{result.text}&rdquo;
              </p>
              <p className="mt-2 text-[11px] font-medium text-[#607597] dark:text-zinc-400">
                {result.reference} &middot; Statenvertaling
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {reference}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
