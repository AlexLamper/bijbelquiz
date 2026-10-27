'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * "Op deze pagina": the sticky table of contents of the legal pages. The
 * section in view is marked (lapis tint and a 3px bar), following the scroll.
 */
export function LegalToc({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        const first = sections.find((section) => visible.get(section.id));
        if (first) setActive(first.id);
      },
      { rootMargin: '-80px 0px -55% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-labelledby="toc-title"
      className="sticky top-6 hidden flex-col gap-1.5 rounded-[16px] border border-line bg-card px-2 pb-2.5 pt-[18px] m:flex"
    >
      <span id="toc-title" className="px-3 pb-1 text-[13px] font-extrabold text-ink-muted">
        Op deze pagina
      </span>
      <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
        {sections.map((section) => {
          const current = section.id === active;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={current ? 'true' : undefined}
                onClick={() => setActive(section.id)}
                className={cn(
                  'flex min-h-10 items-center rounded-r-[10px] border-l-[3px] py-2 pl-[9px] pr-3 text-[15px] leading-5 no-underline',
                  current
                    ? 'border-l-lapis bg-lapis-tint font-extrabold text-lapis-edge hover:text-lapis-edge'
                    : 'border-l-transparent font-bold text-ink-soft hover:text-ink',
                )}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
