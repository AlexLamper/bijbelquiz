import * as React from 'react';
import Link from 'next/link';

import { Container } from '@/components/bq';
import { cn } from '@/lib/utils';
import { LegalToc } from './LegalToc';

/**
 * P-Juridisch: the shared layout of `/privacybeleid` and `/voorwaarden`.
 * Two tabs to switch documents, the title with its date line, a sticky table
 * of contents (desktop) and the document in one white card.
 */
export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const TABS = [
  { key: 'privacy', label: 'Privacybeleid', href: '/privacybeleid' },
  { key: 'voorwaarden', label: 'Voorwaarden', href: '/voorwaarden' },
] as const;

export function LegalPage({
  active,
  title,
  meta,
  sections,
}: {
  active: (typeof TABS)[number]['key'];
  title: string;
  meta: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <Container className="flex flex-col gap-8 pb-12 pt-6 m:pb-[88px] m:pt-10">
      <div className="flex flex-col items-start gap-5">
        <nav aria-label="Juridische documenten" className="flex gap-1 rounded-[12px] border border-line bg-card p-1">
          {TABS.map((tab) => {
            const current = tab.key === active;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex h-[38px] items-center rounded-[9px] px-4 text-[15px] no-underline',
                  current
                    ? 'bg-lapis-tint font-extrabold text-lapis-edge hover:text-lapis-edge'
                    : 'font-bold text-ink-soft hover:bg-chip hover:text-ink',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[32px] leading-10 m:text-[40px] m:leading-[48px]">{title}</h1>
          <p className="m-0 text-[15px] font-semibold text-ink-muted">{meta}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-0 m:grid-cols-[280px_minmax(0,1fr)] m:gap-10">
        <LegalToc sections={sections.map(({ id, title: sectionTitle }) => ({ id, title: sectionTitle }))} />

        <article className="flex flex-col gap-7 rounded-[16px] border border-line bg-card px-5 py-6 m:gap-10 m:px-16 m:py-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="flex max-w-[68ch] scroll-mt-6 flex-col gap-3">
              <h2 className="m-0 text-[22px] leading-7 m:text-[26px] m:leading-8">{section.title}</h2>
              {section.content}
            </section>
          ))}
        </article>
      </div>
    </Container>
  );
}

/** Body text of a legal section: 17/28, weight 500. */
export function LegalText({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-[17px] font-medium leading-7 text-ink [&_a]:font-bold [&_a]:underline">{children}</p>;
}

/** A list with the small lapis dots of the design. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-[17px] font-medium leading-7 text-ink">
          <span aria-hidden="true" className="mt-[11px] size-1.5 shrink-0 rounded-full bg-lapis" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
