import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The page container of the designs: max-width 1200, 32px side padding on
 * desktop and 16px on phones. `width` narrows it for forms and the quiz
 * player.
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: 'default' | 'narrow' | 'form' | 'play' | 'wide';
  as?: 'div' | 'main' | 'section' | 'header' | 'footer' | 'nav';
}

const WIDTH = {
  default: 'max-w-[1200px]',
  /** Settings, legal pages. */
  narrow: 'max-w-[820px]',
  /** Sign-in and other single-card forms. */
  form: 'max-w-[560px]',
  /** The quiz player column. */
  play: 'max-w-[784px]',
  wide: 'max-w-[1400px]',
} as const;

export function Container({ width = 'default', as = 'div', className, children, ...props }: ContainerProps) {
  const Tag = as;
  return (
    <Tag className={cn('w-full mx-auto px-4 m:px-8', WIDTH[width], className)} {...props}>
      {children}
    </Tag>
  );
}

/**
 * Vertical rhythm for a page body: top 40 / bottom 72-80 on desktop, less on
 * phones, and a 28px gap between blocks, as every content page in the designs.
 */
export function PageBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-7 py-6 m:pt-10 m:pb-20', className)} {...props}>
      {children}
    </div>
  );
}
