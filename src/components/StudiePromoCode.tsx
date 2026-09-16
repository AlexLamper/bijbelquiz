'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { track } from '@/lib/analytics/client';
import type { StudieLinkSurface } from '@/lib/ecosystem-links';
import { cn } from '@/lib/utils';

interface StudiePromoCodeProps {
  code: string;
  /** Where the code was copied from, for the same per-placement read as the links. */
  surface: StudieLinkSurface;
  className?: string;
}

/**
 * The promo code, with a button that copies it.
 *
 * The code has to be typed into Stripe's checkout on another site, so the one
 * thing this can do to help is put it on the clipboard. The copy is also the
 * last step this site can see: whether it was then used only shows up as a
 * redemption in BijbelStudie's Stripe.
 */
export default function StudiePromoCode({ code, surface, className }: StudiePromoCodeProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    []
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // No clipboard access (an old browser, or an insecure context in dev).
      // The code is `select-all`, so a tap still selects it for a manual copy.
      return;
    }

    setCopied(true);
    track('bijbelstudie_code_copied', { surface });

    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex h-11 items-stretch overflow-hidden rounded-md border border-rule-strong bg-paper',
        className
      )}
    >
      <span className="flex min-w-0 flex-1 select-all items-center px-3.5 font-mono text-[15px] font-medium tracking-[0.14em] text-ink">
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="inline-flex shrink-0 items-center gap-1.5 border-l border-rule-strong bg-paper-sunken px-3.5 text-sm font-medium text-ink transition-colors hover:bg-paper-raised"
      >
        {copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Gekopieerd' : 'Kopieer'}
      </button>
    </div>
  );
}
