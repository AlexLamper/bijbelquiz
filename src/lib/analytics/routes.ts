/**
 * The site's route inventory, and the normaliser that maps a URL onto it.
 *
 * Two jobs.
 *
 * The normaliser runs on the client before a `page_view` is sent. Reporting on
 * raw URLs is useless - every quiz slug becomes its own row and the top of the
 * list is whichever quiz happens to be popular, not which *kind* of screen
 * carries the traffic - so the dynamic segment is replaced by its pattern and
 * kept separately in `param` for the reads that want it back.
 *
 * The inventory runs on the server, and exists to answer a question the event
 * stream cannot answer on its own: which pages nobody visits. Events only tell
 * you about screens that *were* opened. Subtracting them from a list of every
 * screen that exists is what turns the report into "these four pages had no
 * visitors at all this month".
 *
 * The list is maintained by hand rather than read off the filesystem, because
 * a production build does not ship `src/app`. Adding a route without adding it
 * here costs nothing except that the route will not appear in the unused list
 * until someone visits it - it still gets counted the moment it has traffic.
 */

export type RouteGroup = 'public' | 'app' | 'account' | 'admin';

export interface SiteRoute {
  /** Route pattern, matching what `normalizePath` produces. */
  path: string;
  /** How it is called in the product, in Dutch, for the admin tables. */
  label: string;
  group: RouteGroup;
  /** Reachable without an account. Zero traffic on these is a marketing problem. */
  publicFacing: boolean;
}

export const ROUTE_GROUP_LABELS: Record<RouteGroup, string> = {
  public: 'Publiek',
  app: 'App',
  account: 'Account',
  admin: 'Beheer',
};

export const SITE_ROUTES: SiteRoute[] = [
  { path: '/', label: 'Landingspagina', group: 'public', publicFacing: true },
  { path: '/quizzen', label: 'Quizoverzicht', group: 'app', publicFacing: true },
  { path: '/quizzen/aanmaken', label: 'Quiz aanmaken', group: 'app', publicFacing: false },
  { path: '/quiz/[id]', label: 'Quiz startscherm', group: 'app', publicFacing: true },
  { path: '/quiz/[id]/beoordeling', label: 'Quiz-analyse', group: 'app', publicFacing: false },
  { path: '/bijbelquiz/[slug]', label: 'SEO-quizpagina', group: 'public', publicFacing: true },
  { path: '/dashboard', label: 'Dashboard', group: 'app', publicFacing: false },
  { path: '/ranglijst', label: 'Ranglijst', group: 'app', publicFacing: false },
  { path: '/profiel', label: 'Profiel', group: 'account', publicFacing: false },
  { path: '/samen-spelen', label: 'Samen spelen', group: 'app', publicFacing: false },
  { path: '/samen-spelen/[roomCode]', label: 'Spelkamer', group: 'app', publicFacing: false },
  { path: '/samen-spelen/[roomCode]/lobby', label: 'Spellobby', group: 'app', publicFacing: false },
  { path: '/samen-spelen/[roomCode]/spel', label: 'Live spel', group: 'app', publicFacing: false },
  { path: '/samen-spelen/[roomCode]/uitslag', label: 'Speluitslag', group: 'app', publicFacing: false },
  { path: '/premium', label: 'Premium', group: 'public', publicFacing: true },
  { path: '/premium/succes', label: 'Premium gelukt', group: 'account', publicFacing: false },
  { path: '/groepslicentie', label: 'Groepslicentie', group: 'public', publicFacing: true },
  { path: '/inloggen', label: 'Inloggen', group: 'account', publicFacing: true },
  { path: '/registreren', label: 'Registreren', group: 'account', publicFacing: true },
  { path: '/instellingen', label: 'Instellingen', group: 'account', publicFacing: false },
  { path: '/settings', label: 'Instellingen (oud pad)', group: 'account', publicFacing: false },
  { path: '/account-verwijderen', label: 'Account verwijderen', group: 'account', publicFacing: false },
  { path: '/hulp', label: 'Hulp', group: 'public', publicFacing: true },
  { path: '/contact', label: 'Contact', group: 'public', publicFacing: true },
  { path: '/foutmelding', label: 'Foutmelding', group: 'public', publicFacing: true },
  { path: '/privacybeleid', label: 'Privacybeleid', group: 'public', publicFacing: true },
  { path: '/voorwaarden', label: 'Voorwaarden', group: 'public', publicFacing: true },
  { path: '/beheer', label: 'Beheer', group: 'admin', publicFacing: false },
  { path: '/beheer/funnel', label: 'Beheer · funnel', group: 'admin', publicFacing: false },
  { path: '/beheer/statistieken', label: 'Beheer · statistieken', group: 'admin', publicFacing: false },
  { path: '/beheer/quizzen', label: 'Beheer · quizzen', group: 'admin', publicFacing: false },
  { path: '/beheer/quizzen/aanmaken', label: 'Beheer · quiz aanmaken', group: 'admin', publicFacing: false },
  { path: '/beheer/quizzen/[id]/bewerken', label: 'Beheer · quiz bewerken', group: 'admin', publicFacing: false },
];

const ROUTE_LABELS = new Map(SITE_ROUTES.map((route) => [route.path, route.label]));

export function routeLabel(path: string): string | null {
  return ROUTE_LABELS.get(path) ?? null;
}

/**
 * Patterns whose dynamic segment must be collapsed, longest first so that
 * `/quiz/x/beoordeling` is not eaten by the `/quiz/x` rule above it.
 *
 * The capture group is the value kept as `param`.
 */
const DYNAMIC_ROUTES: Array<{ test: RegExp; pattern: string }> = [
  { test: /^\/quiz\/([^/]+)\/beoordeling$/, pattern: '/quiz/[id]/beoordeling' },
  { test: /^\/quiz\/([^/]+)$/, pattern: '/quiz/[id]' },
  { test: /^\/bijbelquiz\/([^/]+)$/, pattern: '/bijbelquiz/[slug]' },
  { test: /^\/samen-spelen\/([^/]+)\/lobby$/, pattern: '/samen-spelen/[roomCode]/lobby' },
  { test: /^\/samen-spelen\/([^/]+)\/spel$/, pattern: '/samen-spelen/[roomCode]/spel' },
  { test: /^\/samen-spelen\/([^/]+)\/uitslag$/, pattern: '/samen-spelen/[roomCode]/uitslag' },
  { test: /^\/samen-spelen\/([^/]+)$/, pattern: '/samen-spelen/[roomCode]' },
  { test: /^\/beheer\/quizzen\/([^/]+)\/(?:bewerken|edit)$/, pattern: '/beheer/quizzen/[id]/bewerken' },
  { test: /^\/beheer\/quizzen\/([^/]+)$/, pattern: '/beheer/quizzen/[id]' },
];

export interface NormalizedPath {
  /** The route pattern. Safe to group by. */
  path: string;
  /** The dynamic segment that was removed, or null for a static route. */
  param: string | null;
}

/**
 * Turn a pathname into the pattern the reports group by.
 *
 * Query strings and hashes are dropped on purpose. They carry campaign
 * parameters and paywall triggers, both of which are already recorded as their
 * own properties, and keeping them would fragment every row.
 */
export function normalizePath(pathname: string): NormalizedPath {
  let clean = (pathname || '/').split('?')[0].split('#')[0];

  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  if (!clean.startsWith('/')) {
    clean = `/${clean}`;
  }

  for (const route of DYNAMIC_ROUTES) {
    const match = clean.match(route.test);
    if (match) {
      return { path: route.pattern, param: match[1].slice(0, 80) };
    }
  }

  // An unknown path is still recorded rather than bucketed into "other": a
  // route that exists but is missing from the inventory above should show up
  // in the traffic table so it can be added, not disappear into a catch-all.
  return { path: clean.slice(0, 120), param: null };
}
