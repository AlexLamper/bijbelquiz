import * as React from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * One answer option in the quiz player, a duel or a room: 88px tall, 22px
 * bold, white with the 3px edge. After answering, the right one turns green,
 * a wrong pick turns coral and the rest fade. `selected` is the pending pick
 * in a room before the result is in.
 */
export type AnswerState = 'idle' | 'selected' | 'correct' | 'wrong' | 'muted';

export interface AnswerButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  state?: AnswerState;
  children: React.ReactNode;
  /** Shown as a small tag inside, e.g. an opponent's avatar in a duel. */
  corner?: React.ReactNode;
}

const STATE = {
  idle: 'bg-card text-ink border-line border-b-edge hover:border-lapis hover:border-b-lapis-edge hover:bg-lapis-tint',
  selected: 'bg-lapis-tint text-lapis-edge border-2 border-lapis border-b-4 border-b-lapis-edge',
  correct: 'bg-green text-white border-green-edge border-b-green-edge',
  wrong: 'bg-coral-strong text-white border-coral-edge border-b-coral-edge',
  muted: 'bg-card text-ink-faint border-line border-b-edge',
} as const;

export const AnswerButton = React.forwardRef<HTMLButtonElement, AnswerButtonProps>(function AnswerButton(
  { state = 'idle', corner, className, disabled, children, ...props },
  ref,
) {
  const locked = state !== 'idle';
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-disabled={locked || disabled || undefined}
      className={cn(
        'relative flex min-h-[88px] w-full items-center justify-center gap-2 rounded-[14px] border border-b-[3px] px-5 py-3',
        'text-[22px] font-extrabold leading-tight text-center transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
        'disabled:pointer-events-none',
        locked && 'pointer-events-none',
        STATE[state],
        className,
      )}
      {...props}
    >
      {state === 'correct' && <Check className="size-6 shrink-0" strokeWidth={3} aria-hidden="true" />}
      {state === 'wrong' && <X className="size-6 shrink-0" strokeWidth={3} aria-hidden="true" />}
      <span className="min-w-0 break-words">{children}</span>
      {corner && <span className="absolute right-2.5 top-2.5">{corner}</span>}
    </button>
  );
});

/** The 2-column answer grid (1 column on phones for long answers). */
export function AnswerGrid({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" aria-label="Antwoorden" className={cn('grid grid-cols-1 gap-3.5 m:grid-cols-2', className)} {...props}>
      {children}
    </div>
  );
}
