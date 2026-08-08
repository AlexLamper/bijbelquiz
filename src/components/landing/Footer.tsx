import Link from 'next/link';

const columns = [
  {
    title: 'Quizzen',
    links: [
      { href: '/quizzen', label: 'Alle Quizzen' },
      { href: '/ranglijst', label: 'Ranglijst' },
      { href: '/samen-spelen', label: 'Samen spelen' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/inloggen', label: 'Inloggen' },
      { href: '/registreren', label: 'Registreren' },
      { href: '/premium', label: 'Premium' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Informatie',
    links: [
      { href: '/hulp', label: 'Helpcentrum' },
      { href: '/contact', label: 'Contact' },
      { href: '/foutmelding', label: 'Bug report' },
      { href: '/privacybeleid', label: 'Privacybeleid' },
      { href: '/voorwaarden', label: 'Algemene Voorwaarden' },
    ],
  },
  {
    title: 'Meer van ons',
    links: [
      { href: 'https://www.bijbel-studie.com', label: 'Bijbel Studie', external: true },
      { href: 'https://www.bijbelapi.com/docs', label: 'BijbelAPI', external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          <div className="col-span-2 min-w-0 sm:col-span-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative h-7 w-7">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/Logo%20-%20dark.svg" alt="" className="h-7 w-7 object-contain dark:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/Logo%20-%20light.svg" alt="" className="hidden h-7 w-7 object-contain dark:block" />
              </div>
              <span className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                Bijbel<span className="text-lapis">Quiz</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Test je Bijbelkennis en leer meer over de schrift met onze interactieve quizzen.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      {...('external' in link && link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="text-ink-soft transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-rule pt-6 text-xs text-ink-muted md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} BijbelQuiz. Alle rechten voorbehouden.</p>
          <p>
            BijbelQuiz wordt technisch ondersteund door de Nederlandse BijbelAPI. Gemaakt door{' '}
            <span className="text-ink-soft">Alex Lamper</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
