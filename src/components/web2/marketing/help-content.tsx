import * as React from 'react';
import Link from 'next/link';

import StudieLink from '@/components/StudieLink';
import { BIJBEL_API_BASE_URL } from '@/lib/ecosystem-links';
import { getSiteConfig, isNlSite } from '@/config/site';
import { t } from '@/i18n';
import { rich } from '@/i18n/rich';
import type { FaqItem } from './FaqList';

/**
 * The help centre's questions. `text` is the plain answer (search and the
 * FAQPage structured data); `answer` is what the page shows, with links.
 * `featured` questions are the list of the design; the others only show up
 * when a topic is picked or a search finds them.
 */
export type HelpTopic = 'start' | 'quizzen' | 'samen' | 'premium' | 'account';

export interface HelpQuestion extends FaqItem {
  id: string;
  text: string;
  topics: HelpTopic[];
  featured?: boolean;
  /** About the Dutch sister products (BijbelStudie, BijbelAPI); hidden on the intl site. */
  nlOnly?: boolean;
}

const studieLinkClass = 'font-extrabold no-underline';

const brand = getSiteConfig().brand;

/** A question whose answer is plain text. */
function plain(id: string, key: string, topics: HelpTopic[], featured = false): HelpQuestion {
  const text = t(`help.q.${key}.a`);
  return { id, ...(featured ? { featured } : {}), topics, question: t(`help.q.${key}.q`, { brand }), text, answer: text };
}

/** A question whose answer has one or more links; `links` fills the {placeholders}. */
function linked(
  id: string,
  key: string,
  topics: HelpTopic[],
  links: Record<string, React.ReactNode>,
  extra: { featured?: boolean; nlOnly?: boolean } = {},
): HelpQuestion {
  return {
    id,
    ...extra,
    topics,
    question: t(`help.q.${key}.q`, { brand }),
    text: t(`help.q.${key}.text`),
    answer: rich(t(`help.q.${key}.a`), links),
  };
}

const ALL_HELP_QUESTIONS: HelpQuestion[] = [
  plain('gratis', 'free', ['start', 'premium'], true),
  plain('groep', 'group', ['samen'], true),
  plain('xp', 'xp', ['start', 'quizzen'], true),
  plain('vertaling', 'translation', ['quizzen'], true),
  plain('premium-opzeggen', 'cancel', ['premium'], true),
  linked('account-verwijderen', 'deleteAccount', ['account'], { link: <Link href="/account-verwijderen">{t('help.q.deleteAccount.link')}</Link> }, { featured: true }),
  linked(
    'bijbelstudie',
    'studie',
    ['quizzen'],
    {
      studie: <StudieLink passage={null} surface="help" label="BijbelStudie" icon={false} newTab className={studieLinkClass} />,
      about: <Link href="/bijbelstudie">{t('help.q.studie.about')}</Link>,
    },
    { featured: true, nlOnly: true },
  ),
  // Only shown for a topic or a search.
  linked('account-nodig', 'needAccount', ['start', 'account'], { link: <Link href="/registreren">{t('help.q.needAccount.link')}</Link> }),
  plain('telefoon', 'phone', ['start']),
  linked('uitleg', 'explanation', ['quizzen', 'premium'], { link: <Link href="/premium">{t('help.q.explanation.link')}</Link> }),
  linked('fout-in-vraag', 'mistake', ['quizzen'], { link: <Link href="/foutmelding#melden">{t('help.q.mistake.link')}</Link> }),
  linked('klas', 'class', ['samen', 'premium'], { link: <Link href="/groepslicentie">{t('help.q.class.link')}</Link> }),
  linked('privacy', 'privacy', ['account'], { link: <Link href="/privacybeleid">{t('help.q.privacy.link')}</Link> }),
  linked(
    'bijbelapi',
    'api',
    ['quizzen'],
    {
      link: (
        <a href={BIJBEL_API_BASE_URL} target="_blank" rel="noopener noreferrer">
          BijbelAPI
        </a>
      ),
    },
    { nlOnly: true },
  ),
];

export const HELP_QUESTIONS: HelpQuestion[] = ALL_HELP_QUESTIONS.filter((question) => isNlSite() || !question.nlOnly);

/** Search chips under the search box: each opens one answer. */
export const POPULAR_SEARCHES = [
  { label: t('help.popularSearches.cancel'), id: 'premium-opzeggen' },
  { label: t('help.popularSearches.join'), id: 'groep' },
];
