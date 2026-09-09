'use client';

import { ArrowUpRight } from 'lucide-react';

import { track } from '@/lib/analytics/client';
import {
  studieLinkForPassage,
  type StudieLinkSurface,
  type StudiePassage,
} from '@/lib/ecosystem-links';

interface StudieLinkProps {
  /** The chapter to open. `null` falls back to the BijbelStudie home page. */
  passage: StudiePassage | null;
  surface: StudieLinkSurface;
  quizSlug?: string | null;
  /**
   * `primary` is the main next step on a screen and takes the reader with it.
   * `inline` sits beside something they are still doing - a question they just
   * answered - and opens in a new tab so the quiz survives.
   */
  variant?: 'primary' | 'inline';
  /** Overrides the generated "Lees <boek> <hoofdstuk> op BijbelStudie". */
  label?: string;
  className?: string;
}

const PRIMARY_CLASSES =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-lapis px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-lapis/90 sm:w-auto';

const INLINE_CLASSES =
  'inline-flex items-center gap-1.5 text-sm font-medium text-lapis underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-lapis';

/**
 * The one link that matters.
 *
 * Every route out of BijbelQuiz into BijbelStudie goes through here, so the
 * campaign parameters, the click event and the `rel` are decided once. In
 * particular the referrer is deliberately *not* stripped: `noreferrer` would
 * make every arrival on the other side look like direct traffic, which is
 * exactly the number this whole change exists to move.
 */
export default function StudieLink({
  passage,
  surface,
  quizSlug,
  variant = 'inline',
  label,
  className,
}: StudieLinkProps) {
  const link = studieLinkForPassage(passage, { surface, quizSlug });
  const opensNewTab = variant === 'inline';

  return (
    <a
      href={link.href}
      target={opensNewTab ? '_blank' : undefined}
      rel="noopener"
      data-skip-leave-guard
      data-analytics-id={`studie.${surface}`}
      onClick={() =>
        track('bijbelstudie_click', {
          surface,
          quizSlug: quizSlug || null,
          refBook: passage?.book || null,
          refChapter: passage?.chapter ?? null,
        })
      }
      className={className ?? (variant === 'primary' ? PRIMARY_CLASSES : INLINE_CLASSES)}
    >
      {label ?? link.label}
      <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
    </a>
  );
}
