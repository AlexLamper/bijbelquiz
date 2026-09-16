import { cn } from '@/lib/utils';

/**
 * BijbelStudie's app icon, drawn in this site's ink and paper.
 *
 * The same shape as `public/images/logo.svg` in the BijbelStudie repo (a
 * rounded square with one soft corner and a cross), so it is recognisably
 * their mark when a reader arrives there. The fills are tokens rather than
 * BijbelStudie's #262626 and #F9F9F9: in dark mode the square turns light and
 * the cross dark, where the hardcoded colours would draw a black tile on a
 * black page.
 */
export function BijbelStudieMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" aria-hidden className={cn('h-4 w-4 shrink-0', className)}>
      <path
        d="M0 10C0 4.477 4.477 0 10 0H50C55.523 0 60 4.477 60 10V40C60 51.046 51.046 60 40 60H10C4.477 60 0 55.523 0 50V10Z"
        className="fill-ink"
      />
      <rect x="26.045" y="6.696" width="7.909" height="47.753" rx="1" className="fill-paper" />
      <rect x="15.419" y="16.476" width="29.081" height="7.841" rx="1" className="fill-paper" />
    </svg>
  );
}

/** The mark with the name beside it, for the places that introduce the product. */
export function BijbelStudieLogo({
  size = 'md',
  className,
}: {
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BijbelStudieMark className={size === 'lg' ? 'h-9 w-9' : 'h-7 w-7'} />
      <span
        className={cn(
          'font-sans font-semibold tracking-[-0.02em] text-ink',
          size === 'lg' ? 'text-2xl' : 'text-lg'
        )}
      >
        BijbelStudie
      </span>
    </span>
  );
}
