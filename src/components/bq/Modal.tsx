'use client';

import * as React from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { IconButton } from './Button';

/**
 * Dialogs on top of a dimmed canvas. `presentation="center"` is a white card
 * in the middle (confirmations, the paywall); `presentation="sheet"` slides
 * up from the bottom edge (the phone menu, pickers). Built on Radix Dialog
 * for focus trapping, Escape and aria wiring.
 *
 * `dismissible={false}` removes the close button and ignores outside clicks,
 * for the locked paywall after the third free quiz.
 */
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** Visually hide the title (it stays for screen readers). */
  hideTitle?: boolean;
  description?: React.ReactNode;
  presentation?: 'center' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
  /** Buttons at the bottom, laid out right-aligned (stacked on phones). */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const SIZE = { sm: 'm:max-w-[420px]', md: 'm:max-w-[520px]', lg: 'm:max-w-[680px]' } as const;

export function Modal({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  presentation = 'center',
  size = 'md',
  dismissible = true,
  footer,
  children,
  className,
}: ModalProps) {
  const sheet = presentation === 'sheet';
  return (
    <Dialog.Root open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1B1A18]/55 animate-fade-in" />
        <div
          className={cn(
            'fixed inset-0 z-50 flex',
            sheet ? 'items-end justify-center m:items-center' : 'items-end justify-center p-0 m:items-center m:p-6',
          )}
        >
          <Dialog.Content
            onPointerDownOutside={(event) => {
              if (!dismissible) event.preventDefault();
            }}
            onEscapeKeyDown={(event) => {
              if (!dismissible) event.preventDefault();
            }}
            className={cn(
              'relative flex w-full max-h-[92dvh] flex-col overflow-y-auto bg-card text-ink shadow-float outline-none',
              'rounded-t-[20px] m:rounded-[20px] border border-line',
              sheet ? 'animate-sheet-in m:animate-fade-up' : 'animate-sheet-in m:animate-fade-up',
              SIZE[size],
              className,
            )}
          >
            <div className="flex flex-col gap-2 px-6 pt-6 m:px-7 m:pt-7">
              <Dialog.Title className={cn('m-0 pr-10 font-display text-[26px] font-semibold leading-8', hideTitle && 'sr-only')}>
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="m-0 text-base leading-6 font-semibold text-ink-muted">{description}</Dialog.Description>
              )}
            </div>
            {children && <div className="px-6 pb-6 pt-4 m:px-7 m:pb-7 flex flex-col gap-4">{children}</div>}
            {footer && (
              <div className="flex flex-col-reverse gap-2.5 border-t border-line-soft px-6 py-4 m:flex-row m:justify-end m:px-7">
                {footer}
              </div>
            )}
            {dismissible && (
              <Dialog.Close asChild>
                <IconButton aria-label="Sluiten" shape="round" size="md" className="absolute right-4 top-4 m:right-5 m:top-5">
                  <X className="size-5" strokeWidth={2.2} />
                </IconButton>
              </Dialog.Close>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A trigger that opens the modal it wraps; convenience for simple cases. */
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;
