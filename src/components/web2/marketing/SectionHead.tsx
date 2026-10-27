import * as React from 'react';

import { cn } from '@/lib/utils';

/** Section heading of the marketing pages: Fredoka 26/32 with a 17/26 muted line under it. */
export function SectionHead({
  title,
  subtitle,
  id,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <h2 id={id} className="m-0 text-[26px] leading-8">
        {title}
      </h2>
      {subtitle && <p className="m-0 max-w-[640px] text-[17px] font-semibold leading-[26px] text-ink-muted">{subtitle}</p>}
    </div>
  );
}
