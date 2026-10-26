import * as React from 'react';
import { BookOpen, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Pill } from './Pill';

/**
 * What a free player sees instead of an explanation: the Bible reference
 * stays readable, the explanation is blurred underneath a small lock and a
 * Premium button. The blurred text is placeholder prose, never the real
 * explanation, so it cannot be read through the blur or in the DOM.
 */
export interface PremiumLockProps {
  /** "Johannes 6:9" - shown as a readable chip. */
  reference?: string | null;
  referenceHref?: string;
  /** Where the Premium button goes. */
  premiumHref?: string;
  onPremiumClick?: () => void;
  title?: string;
  description?: string;
  /** Lines of blurred placeholder text. */
  lines?: 2 | 3;
  className?: string;
}

const PLACEHOLDER = [
  'De uitleg bij dit antwoord vertelt wat er in het bijbelgedeelte gebeurt en waarom dit antwoord klopt.',
  'Met Premium lees je bij elke vraag de uitleg en de bijbeltekst erbij, zo vaak je wilt.',
  'Zo onthoud je het verhaal beter en leer je bij elke quiz iets nieuws.',
];

export function PremiumLock({
  reference,
  referenceHref,
  premiumHref = '/premium',
  onPremiumClick,
  title = 'Uitleg is Premium',
  description = 'Lees bij elk antwoord waarom het klopt, met de bijbeltekst erbij.',
  lines = 2,
  className,
}: PremiumLockProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {reference && (
        <Pill tone="lapis" size="lg" icon={<BookOpen className="size-4" strokeWidth={2.2} />} href={referenceHref}>
          {reference}
        </Pill>
      )}
      <div className="relative overflow-hidden rounded-[12px] border border-line-soft bg-chip/60 p-4">
        <p aria-hidden="true" className="m-0 select-none text-[15px] leading-[22px] font-semibold text-ink-soft blur-[6px]">
          {PLACEHOLDER.slice(0, lines).join(' ')}
        </p>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-card border border-line text-ink-soft">
            <Lock className="size-4" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="text-[15px] font-extrabold text-ink">{title}</span>
          <span className="sr-only">{description}</span>
          {onPremiumClick ? (
            <Button variant="gold" size="sm" onClick={onPremiumClick}>
              Premium
            </Button>
          ) : (
            <Button variant="gold" size="sm" href={premiumHref}>
              Premium
            </Button>
          )}
        </div>
      </div>
      <p className="m-0 text-[13px] font-semibold text-ink-muted">{description}</p>
    </div>
  );
}
