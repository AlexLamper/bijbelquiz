/**
 * Which site this build is.
 *
 * One codebase serves two sites:
 * - `nl`   - www.bijbelquiz.com (the default; must stay byte-for-byte the same)
 * - `intl` - biblequizzes.app (English on the root, other languages in /es, /pt, ...)
 *
 * The site is chosen at build time with the `SITE` env var, so each site is its
 * own Vercel project. A mistake in the intl build can never reach the NL deploy.
 *
 * Plan and checklist: I18N-ROADMAP.md
 */

export type SiteId = 'nl' | 'intl';

export interface SiteConfig {
  id: SiteId;
  brand: string;
  baseUrl: string;
  defaultLocale: string;
  /** Locales served by this site. The default locale lives on the root path. */
  locales: readonly string[];
  supportEmail: string;
  /**
   * While false, every page sends `noindex` and robots.txt disallows all.
   * Keeps the intl site out of Google until it has real, non-Dutch content -
   * otherwise it would be a duplicate of bijbelquiz.com.
   */
  indexable: boolean;
}

const NL: SiteConfig = {
  id: 'nl',
  brand: 'BijbelQuiz',
  baseUrl: 'https://www.bijbelquiz.com',
  defaultLocale: 'nl',
  locales: ['nl'],
  supportEmail: 'info@bijbelquiz.com',
  indexable: true,
};

/** Domain of the international site; every language lives on it. */
export const INTL_ORIGIN = 'https://biblequizzes.app';

/**
 * The languages of the intl site, in rollout order. English is on the root;
 * every other language is a path prefix (`/es`) and its own build/deployment:
 * `SITE=intl SITE_LOCALE=es` (Next `basePath: '/es'`), proxied from the English
 * project with a rewrite. Add a language here only when its dictionary,
 * content and Bible text are ready.
 */
export const INTL_LOCALES = ['en', 'es', 'pt', 'de', 'fr'] as const;

function intlLocale(): string {
  // NEXT_PUBLIC_SITE_LOCALE is set from SITE_LOCALE in next.config.ts (see getSiteId).
  const raw = process.env.NEXT_PUBLIC_SITE_LOCALE ?? process.env.SITE_LOCALE ?? 'en';
  return (INTL_LOCALES as readonly string[]).includes(raw) ? raw : 'en';
}

function intlConfig(): SiteConfig {
  const locale = intlLocale();
  return {
    id: 'intl',
    brand: 'Bible Quizzes',
    // The prefix is part of the base URL, so canonicals, the sitemap and invite
    // links of the Spanish build all point at biblequizzes.app/es/...
    baseUrl: locale === 'en' ? INTL_ORIGIN : `${INTL_ORIGIN}/${locale}`,
    defaultLocale: locale,
    locales: INTL_LOCALES,
    supportEmail: 'info@biblequizzes.app',
    indexable: process.env.SITE_INDEXABLE === 'true',
  };
}

export function getSiteId(): SiteId {
  // NEXT_PUBLIC_SITE is set from SITE in next.config.ts so client components
  // (which cannot read SITE) resolve the same site. Literal access is required
  // for Next to inline it into the client bundle.
  const site = process.env.NEXT_PUBLIC_SITE ?? process.env.SITE;
  return site === 'intl' ? 'intl' : 'nl';
}

export function getSiteConfig(): SiteConfig {
  return getSiteId() === 'intl' ? intlConfig() : NL;
}

export const isNlSite = (): boolean => getSiteId() === 'nl';
