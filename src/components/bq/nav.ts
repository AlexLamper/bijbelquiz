/**
 * The site's navigation, shared by the header, the phone menu and the footer
 * so a route is renamed in one place.
 */
export interface NavLink {
  label: string;
  href: string;
  /** Other route prefixes that count as this item, e.g. a quiz page for
   *  "Quizzen". */
  also?: string[];
}

export const MAIN_NAV: NavLink[] = [
  { label: 'Quizzen', href: '/quizzen', also: ['/quiz', '/bijbelquiz'] },
  { label: 'Duels', href: '/duels' },
  { label: 'Samen spelen', href: '/samen-spelen' },
  { label: 'Ranglijst', href: '/ranglijst' },
  { label: 'Premium', href: '/premium' },
];

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: 'Spelen',
    links: [
      { label: 'Quizzen', href: '/quizzen' },
      { label: 'Duels', href: '/duels' },
      { label: 'Samen spelen', href: '/samen-spelen' },
      { label: 'Ranglijst', href: '/ranglijst' },
    ],
  },
  {
    title: 'BijbelQuiz',
    links: [
      { label: 'Premium', href: '/premium' },
      { label: 'Groepslicentie', href: '/groepslicentie' },
      { label: 'Hulp', href: '/hulp' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Juridisch',
    links: [
      { label: 'Privacybeleid', href: '/privacybeleid' },
      { label: 'Voorwaarden', href: '/voorwaarden' },
      { label: 'Account verwijderen', href: '/account-verwijderen' },
    ],
  },
];

export const ACCOUNT_NAV: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profiel', href: '/profiel' },
  { label: 'Instellingen', href: '/instellingen' },
];

/** True when `pathname` is `href` (or one of `also`) or lives under it. */
export function isActivePath(pathname: string | null, href: string, also: string[] = []): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return [href, ...also].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
