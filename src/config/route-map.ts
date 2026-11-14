/**
 * Dutch page folder <-> English public URL, for the intl site.
 *
 * Pure data with no imports, so `next.config.ts` can read it too. Each entry is
 * a path pattern (Next `:param` syntax) in the Dutch folder structure and the
 * English URL it is served at on biblequizzes.app. More specific patterns come
 * first. Dynamic parts (slugs, ids, room codes) are never translated.
 * `/beheer` (admin), `/api`, `/dashboard`, `/premium`, `/quiz/:id` and
 * `/contact` are the same on both sites.
 */
export const ROUTE_PAIRS: ReadonlyArray<readonly [nl: string, en: string]> = [
  ['/samen-spelen/:roomCode/spel', '/play-together/:roomCode/game'],
  ['/samen-spelen/:roomCode/uitslag', '/play-together/:roomCode/results'],
  ['/samen-spelen/:roomCode/lobby', '/play-together/:roomCode/lobby'],
  ['/samen-spelen/:roomCode', '/play-together/:roomCode'],
  ['/samen-spelen', '/play-together'],
  ['/premium/succes', '/premium/success'],
  ['/quiz/:id/beoordeling', '/quiz/:id/review'],
  ['/bijbelquiz/:slug', '/bible-quiz/:slug'],
  ['/quizzen', '/quizzes'],
  ['/ranglijst', '/leaderboard'],
  ['/hulp', '/help'],
  ['/groepslicentie', '/group-license'],
  ['/privacybeleid', '/privacy-policy'],
  ['/voorwaarden', '/terms'],
  ['/account-verwijderen', '/delete-account'],
  ['/inloggen', '/login'],
  ['/registreren', '/register'],
  ['/profiel', '/profile'],
  ['/instellingen', '/settings'],
  ['/wachtwoord-vergeten', '/forgot-password'],
  ['/wachtwoord-herstellen', '/reset-password'],
  ['/foutmelding', '/report-bug'],
];
