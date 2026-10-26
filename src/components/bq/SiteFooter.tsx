import Link from 'next/link';

import { Container } from './Container';
import { Logo } from './Logo';
import { StoreBadges } from './StoreBadges';
import { FOOTER_NAV } from './nav';

/**
 * The white footer: logo and tagline with the store badges, three link
 * columns (two columns on phones, the brand block full width) and the
 * copyright line under a hairline.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-card">
      <Container className="pb-7 pt-12">
        <div className="grid grid-cols-2 gap-8 m:grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col gap-3.5 m:col-span-1">
            <Logo className="self-start" />
            <p className="m-0 text-[15px] leading-[22px] font-semibold text-ink-muted">Test je bijbelkennis met korte quizzen.</p>
            <StoreBadges className="mt-1" />
          </div>
          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3.5">
              <h2 className="m-0 font-sans text-xs font-extrabold uppercase tracking-[0.04em] text-ink-muted">{group.title}</h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[15px] font-semibold text-ink-soft no-underline hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-10 border-t border-line-soft pt-5 text-[13px] font-semibold text-ink-muted">© {year} BijbelQuiz</p>
      </Container>
    </footer>
  );
}
