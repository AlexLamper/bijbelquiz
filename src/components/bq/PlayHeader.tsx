import * as React from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Container } from './Container';
import { Logo } from './Logo';

/**
 * The slim header of the play screens (duel, samen spelen): the logo on the
 * left and one round "verlaten" button on the right, nothing else to click
 * away to. Pages under a chromeless route render this themselves.
 */
export interface PlayHeaderProps {
  leaveLabel: string;
  /** Either a link... */
  leaveHref?: string;
  /** ...or a handler, for a confirmation dialog first. */
  onLeave?: () => void;
  /** Something in the middle, such as a room code. Hidden on phones; the
   *  page shows it under the header instead, as the designs do. */
  children?: React.ReactNode;
  /** Icon before the label; a log-out arrow unless the design asks otherwise
   *  (duels use a cross). */
  icon?: React.ReactNode;
  className?: string;
}

export function PlayHeader({ leaveLabel, leaveHref, onLeave, children, icon, className }: PlayHeaderProps) {
  const leaveIcon = icon ?? <LogOut className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />;
  const leaveClass =
    'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-card pl-3 pr-4 text-[15px] font-bold text-ink-soft no-underline hover:bg-chip hover:text-ink';
  return (
    <header className={cn('shrink-0 border-b border-line bg-card', className)}>
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <Logo />
        {children && <div className="hidden min-w-0 flex-1 text-center m:block">{children}</div>}
        {leaveHref ? (
          <Link href={leaveHref} className={leaveClass}>
            {leaveIcon}
            {leaveLabel}
          </Link>
        ) : (
          <button type="button" onClick={onLeave} className={leaveClass}>
            {leaveIcon}
            {leaveLabel}
          </button>
        )}
      </Container>
    </header>
  );
}
