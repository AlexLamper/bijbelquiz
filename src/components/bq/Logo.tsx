import Link from 'next/link';

import { cn } from '@/lib/utils';
import { LogoMark } from './icons';

interface WordmarkProps {
  /** Mark size in px; the wordmark scales with it (34 -> 22px text). */
  size?: number;
  /** Mark only, no wordmark. */
  compact?: boolean;
  className?: string;
}

/** The mark plus "BijbelQuiz", not a link: for use inside another link. */
export function Wordmark({ size = 34, compact = false, className }: WordmarkProps) {
  const fontSize = Math.round(size * (22 / 34));
  return (
    <span className={cn('inline-flex items-center gap-[7px] text-ink', className)}>
      <LogoMark size={size} />
      {!compact && (
        <span className="font-display font-semibold leading-none tracking-[-0.01em] whitespace-nowrap" style={{ fontSize }}>
          Bijbel<span className="text-lapis">Quiz</span>
        </span>
      )}
    </span>
  );
}

interface LogoProps extends WordmarkProps {
  /** Where the logo links to: `/` for visitors, `/dashboard` when signed in. */
  href?: string;
  'aria-label'?: string;
}

/** The BijbelQuiz mark plus wordmark, as a link. */
export function Logo({ href = '/', size, compact, className, ...rest }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={rest['aria-label'] ?? 'BijbelQuiz, naar de startpagina'}
      className={cn('inline-flex no-underline text-ink hover:text-ink', className)}
    >
      <Wordmark size={size} compact={compact} />
    </Link>
  );
}
