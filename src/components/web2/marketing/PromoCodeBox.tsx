'use client';

import * as React from 'react';

import { track } from '@/lib/analytics/client';
import type { StudieLinkSurface } from '@/lib/ecosystem-links';
import { CheckIcon, CopyIcon } from './icons';

/**
 * The BijbelStudie promo code with a "Kopieer" button, in the 2.0 style
 * (52px field, the code spaced out, a grey button on the right). Same
 * behaviour as `StudiePromoCode`: copies to the clipboard and records
 * `bijbelstudie_code_copied`; without clipboard access the code stays
 * `select-all` for a manual copy.
 */
export function PromoCodeBox({ code, surface }: { code: string; surface: StudieLinkSurface }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    track('bijbelstudie_code_copied', { surface });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-[52px] items-stretch overflow-hidden rounded-[12px] border border-input-line">
      <span className="flex min-w-0 flex-1 select-all items-center px-4 text-[17px] font-extrabold tracking-[0.12em] text-ink">
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="flex shrink-0 items-center gap-1.5 border-0 border-l border-input-line bg-chip px-4 text-[15px] font-extrabold text-ink hover:bg-line-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lapis"
      >
        {copied ? <CheckIcon size={16} className="text-green" /> : <CopyIcon size={16} className="text-lapis" />}
        {copied ? 'Gekopieerd' : 'Kopieer'}
      </button>
    </div>
  );
}
