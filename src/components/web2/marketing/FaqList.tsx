import * as React from 'react';

import { cn } from '@/lib/utils';
import { ChevronDownIcon } from './icons';

export interface FaqItem {
  /** Anchor id, so a link can open this answer (`/hulp#premium-opzeggen`). */
  id?: string;
  question: string;
  answer: React.ReactNode;
}

/**
 * The FAQ card of the landing and help pages: native `<details>` rows (64px,
 * 17px extrabold question), separated by the soft hairline; the first one
 * open, as in the designs. No JavaScript needed.
 */
export function FaqList({
  items,
  openFirst = true,
  openId,
  className,
}: {
  items: FaqItem[];
  openFirst?: boolean;
  /** Opens this item instead of the first. */
  openId?: string | null;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-[16px] border border-line bg-card', className)}>
      {items.map((item, index) => {
        const open = openId ? item.id === openId : openFirst && index === 0;
        return (
          <details
            key={item.id ?? item.question}
            id={item.id}
            open={open || undefined}
            className="group scroll-mt-24 border-b border-line-soft last:border-b-0"
          >
            <summary className="flex min-h-16 cursor-pointer items-center gap-4 px-[22px] py-[18px] text-[17px] font-extrabold text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lapis">
              <span className="min-w-0 flex-1">{item.question}</span>
              <ChevronDownIcon size={20} className="shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="max-w-[68ch] px-[22px] pb-5 text-base font-semibold leading-[25px] text-ink-soft [&_a]:font-extrabold [&_a]:no-underline">
              {item.answer}
            </div>
          </details>
        );
      })}
    </div>
  );
}
