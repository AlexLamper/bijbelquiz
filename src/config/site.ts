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

const INTL: SiteConfig = {
  id: 'intl',
  brand: 'Bible Quizzes',
  baseUrl: 'https://biblequizzes.app',
  defaultLocale: 'en',
  // Rollout order: en first; es, pt, de, fr follow. Add a locale here only
  // when its content and translations are ready.
  locales: ['en'],
  supportEmail: 'info@biblequizzes.app',
  indexable: process.env.SITE_INDEXABLE === 'true',
};

export function getSiteId(): SiteId {
  return process.env.SITE === 'intl' ? 'intl' : 'nl';
}

export function getSiteConfig(): SiteConfig {
  return getSiteId() === 'intl' ? INTL : NL;
}

export const isNlSite = (): boolean => getSiteId() === 'nl';
