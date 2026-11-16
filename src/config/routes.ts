import { ROUTE_PAIRS } from '@/config/route-map';
import { getSiteConfig, INTL_LOCALES, INTL_ORIGIN, isNlSite } from '@/config/site';

/** Turns a Next path pattern into a matcher: `/a/:id/b` -> /^\/a\/([^/]+)\/b$/. */
function matcher(pattern: string): RegExp {
  const src = pattern
    .split('/')
    .map((seg) => (seg.startsWith(':') ? '([^/]+)' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^${src}$`);
}

const NL_TO_EN = ROUTE_PAIRS.map(([nl, en]) => ({ re: matcher(nl), en }));

/**
 * The public URL path for an internal (Dutch-folder) path on the current site.
 * Identity on NL. On intl `/quizzen` becomes `/quizzes`, `/bijbelquiz/x` becomes
 * `/bible-quiz/x`. Query and hash are kept; unknown paths pass through unchanged.
 */
export function localizePath(path: string): string {
  if (isNlSite()) return path;
  const cut = path.search(/[?#]/);
  const base = cut === -1 ? path : path.slice(0, cut);
  const rest = cut === -1 ? '' : path.slice(cut);
  const trimmed = base.length > 1 ? base.replace(/\/$/, '') : base;
  for (const { re, en } of NL_TO_EN) {
    const m = re.exec(trimmed);
    if (!m) continue;
    let i = 1;
    return en.replace(/:[A-Za-z]+/g, () => m[i++]) + rest;
  }
  return path;
}

/**
 * Metadata `alternates` for a page that exists in every language. Identity on
 * NL (canonical only, the Dutch HTML stays as it was). On intl it adds `hreflang`
 * links to the same page in each language plus `x-default` (English). Pages whose
 * slugs differ per language (quizzes) keep a plain canonical.
 */
export function pageAlternates(path: string): { canonical: string; languages?: Record<string, string> } {
  const canonical = localizePath(path);
  if (isNlSite()) return { canonical };
  const tail = canonical === '/' ? '' : canonical;
  const languages: Record<string, string> = {};
  for (const l of INTL_LOCALES) languages[l] = `${INTL_ORIGIN}${l === 'en' ? '' : `/${l}`}${tail}` || INTL_ORIGIN;
  languages['x-default'] = `${INTL_ORIGIN}${tail}`;
  return { canonical, languages };
}

/**
 * Absolute URL for an internal (Dutch-folder) path, for server redirects and
 * URLs handed to Stripe. NL: on the given origin, path unchanged (as before).
 * Intl: on the site's base URL, which carries the language prefix
 * (`https://biblequizzes.app/de`), with the localized path. Without this a
 * redirect from the German build would leave out `/de` and land on English.
 */
export function siteUrl(path: string, nlOrigin: string): URL {
  if (isNlSite()) return new URL(path, nlOrigin);
  return new URL(`${getSiteConfig().baseUrl}${localizePath(path)}`);
}
