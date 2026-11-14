/**
 * The site's navigation, shared by the header, the phone menu and the footer
 * so a route is renamed in one place.
 */
export interface NavLink {
  /** i18n key (see src/i18n), translated where the link is rendered. */
  labelKey: string;
  href: string;
  /** Other route prefixes that count as this item, e.g. a quiz page for
   *  "Quizzen". */
  also?: string[];
}

export const MAIN_NAV: NavLink[] = [
  { labelKey: 'bq.nav.quizzes', href: '/quizzen', also: ['/quiz', '/bijbelquiz'] },
  // Samen spelen took the place of Duels, as in the app: a group playing
  // together gets far more play than two players taking turns.
  { labelKey: 'bq.nav.playTogether', href: '/samen-spelen' },
  { labelKey: 'bq.nav.leaderboard', href: '/ranglijst' },
  { labelKey: 'bq.nav.premium', href: '/premium' },
];

/** A group `titleKey` of 'brand' renders the site's brand name. */
export const FOOTER_NAV: { titleKey: string; links: NavLink[] }[] = [
  {
    titleKey: 'bq.nav.groupPlay',
    links: [
      { labelKey: 'bq.nav.quizzes', href: '/quizzen' },
      { labelKey: 'bq.nav.playTogether', href: '/samen-spelen' },
      { labelKey: 'bq.nav.leaderboard', href: '/ranglijst' },
    ],
  },
  {
    titleKey: 'brand',
    links: [
      { labelKey: 'bq.nav.premium', href: '/premium' },
      { labelKey: 'bq.nav.groupLicense', href: '/groepslicentie' },
      { labelKey: 'bq.nav.help', href: '/hulp' },
      { labelKey: 'bq.nav.contact', href: '/contact' },
    ],
  },
  {
    titleKey: 'bq.nav.groupLegal',
    links: [
      { labelKey: 'bq.nav.privacy', href: '/privacybeleid' },
      { labelKey: 'bq.nav.terms', href: '/voorwaarden' },
      { labelKey: 'bq.nav.deleteAccount', href: '/account-verwijderen' },
    ],
  },
];

export const ACCOUNT_NAV: NavLink[] = [
  { labelKey: 'bq.nav.dashboard', href: '/dashboard' },
  { labelKey: 'bq.nav.profile', href: '/profiel' },
  { labelKey: 'bq.nav.settings', href: '/instellingen' },
];

/** True when `pathname` is `href` (or one of `also`) or lives under it. */
export function isActivePath(pathname: string | null, href: string, also: string[] = []): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return [href, ...also].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
