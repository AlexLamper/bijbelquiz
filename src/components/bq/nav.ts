/**
 * The site's navigation, shared by the header, the phone menu and the footer
 * so a route is renamed in one place.
 */
import { localizePath } from '@/config/routes';

export interface NavLink {
  /** i18n key (see src/i18n), translated where the link is rendered. */
  labelKey: string;
  href: string;
  /** Other route prefixes that count as this item, e.g. a quiz page for
   *  "Quizzen". */
  also?: string[];
}

export const MAIN_NAV: NavLink[] = [
  { labelKey: 'bq.nav.quizzes', href: localizePath('/quizzen'), also: [localizePath('/quiz'), localizePath('/bijbelquiz')] },
  // Samen spelen took the place of Duels, as in the app: a group playing
  // together gets far more play than two players taking turns.
  { labelKey: 'bq.nav.playTogether', href: localizePath('/samen-spelen') },
  { labelKey: 'bq.nav.leaderboard', href: localizePath('/ranglijst') },
  { labelKey: 'bq.nav.premium', href: localizePath('/premium') },
];

/** A group `titleKey` of 'brand' renders the site's brand name. */
export const FOOTER_NAV: { titleKey: string; links: NavLink[] }[] = [
  {
    titleKey: 'bq.nav.groupPlay',
    links: [
      { labelKey: 'bq.nav.quizzes', href: localizePath('/quizzen') },
      { labelKey: 'bq.nav.playTogether', href: localizePath('/samen-spelen') },
      { labelKey: 'bq.nav.leaderboard', href: localizePath('/ranglijst') },
    ],
  },
  {
    titleKey: 'brand',
    links: [
      { labelKey: 'bq.nav.premium', href: localizePath('/premium') },
      { labelKey: 'bq.nav.groupLicense', href: localizePath('/groepslicentie') },
      { labelKey: 'bq.nav.help', href: localizePath('/hulp') },
      { labelKey: 'bq.nav.contact', href: localizePath('/contact') },
    ],
  },
  {
    titleKey: 'bq.nav.groupLegal',
    links: [
      { labelKey: 'bq.nav.privacy', href: localizePath('/privacybeleid') },
      { labelKey: 'bq.nav.terms', href: localizePath('/voorwaarden') },
      { labelKey: 'bq.nav.deleteAccount', href: localizePath('/account-verwijderen') },
    ],
  },
];

export const ACCOUNT_NAV: NavLink[] = [
  { labelKey: 'bq.nav.dashboard', href: localizePath('/dashboard') },
  { labelKey: 'bq.nav.profile', href: localizePath('/profiel') },
  { labelKey: 'bq.nav.settings', href: localizePath('/instellingen') },
];

/** True when `pathname` is `href` (or one of `also`) or lives under it. */
export function isActivePath(pathname: string | null, href: string, also: string[] = []): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return [href, ...also].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
