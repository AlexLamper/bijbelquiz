/**
 * Turns the Bijbelstudie preferences on a user document into an actual ordered
 * list of quizzes, with the reason for each pick.
 *
 * The settings page asks three questions - how often you read, how you rate
 * your own knowledge, and which parts of the Bible interest you. Storing those
 * answers and then ranking every quiz identically for everybody is worse than
 * not asking: it teaches the reader that the form does nothing. This module is
 * the reader of those fields, and every scoring rule below maps back to one of
 * them.
 *
 * Deliberately pure and dependency-free: the same function runs on the
 * dashboard (server render), in the quiz overview (passed down as props) and
 * behind `/api/quizzes/recommended` for the Flutter app, so all three surfaces
 * recommend the same thing in the same order.
 */

import type { UserOnboardingSettings } from '@/lib/user-settings';

/** The interest checkboxes, single source of truth for settings UI + scoring. */
export const INTEREST_OPTIONS = [
  { value: 'oude-testament', label: 'Oude Testament' },
  { value: 'nieuwe-testament', label: 'Nieuwe Testament' },
  { value: 'evangelien', label: 'Evangelien' },
  { value: 'profeten', label: 'Profeten' },
  { value: 'wijsheid', label: 'Wijsheid & Spreuken' },
  { value: 'personen', label: 'Bijbelse personen' },
] as const;

export type InterestValue = (typeof INTEREST_OPTIONS)[number]['value'];

const INTEREST_LABELS = new Map<string, string>(
  INTEREST_OPTIONS.map((option) => [option.value, option.label])
);

export function interestLabel(value: string): string {
  return INTEREST_LABELS.get(value) || value;
}

/**
 * How an interest finds its quizzes.
 *
 * `categorySlugs` is the strong signal - the editor filed the quiz under that
 * category on purpose. `keywords` is the fallback for a library that grows
 * faster than its category list: "Jesaja Deel 1" is a prophets quiz whether or
 * not anybody ever created a `profeten` category.
 */
const INTEREST_MATCHERS: Record<
  InterestValue,
  { categorySlugs: string[]; keywords: string[] }
> = {
  'oude-testament': {
    categorySlugs: ['oude-testament'],
    keywords: [
      'oude testament', 'genesis', 'exodus', 'leviticus', 'numeri', 'deuteronomium',
      'jozua', 'richteren', 'ruth', 'samuel', 'koningen', 'kronieken', 'ezra',
      'nehemia', 'ester', 'job', 'psalm', 'schepping', 'noach', 'abraham', 'mozes',
      'david', 'salomo', 'israel',
    ],
  },
  'nieuwe-testament': {
    categorySlugs: ['nieuwe-testament'],
    keywords: [
      'nieuwe testament', 'handelingen', 'romeinen', 'korinthe', 'galaten',
      'efeze', 'filippenzen', 'kolossenzen', 'tessalonicenzen', 'timotheus',
      'titus', 'filemon', 'hebreeen', 'jakobus', 'petrus', 'johannes', 'judas',
      'openbaring', 'paulus', 'apostel', 'gemeente',
    ],
  },
  evangelien: {
    categorySlugs: ['leven-van-jezus', 'nieuwe-testament', 'wonderen-en-tekenen'],
    keywords: [
      'evangelie', 'evangelien', 'mattheus', 'marcus', 'lucas', 'johannes',
      'jezus', 'christus', 'gelijkenis', 'wonder', 'kruis', 'opstanding',
      'bergrede', 'discipel',
    ],
  },
  profeten: {
    categorySlugs: ['oude-testament', 'personen-in-de-bijbel'],
    keywords: [
      'profeet', 'profeten', 'jesaja', 'jeremia', 'ezechiel', 'daniel', 'hosea',
      'joel', 'amos', 'obadja', 'jona', 'micha', 'nahum', 'habakuk', 'sefanja',
      'haggai', 'zacharia', 'maleachi', 'elia', 'elisa',
    ],
  },
  wijsheid: {
    categorySlugs: ['studie', 'algemeen'],
    keywords: [
      'wijsheid', 'spreuken', 'prediker', 'hooglied', 'psalmen', 'psalm', 'job',
      'wijsheidsliteratuur', 'levenslessen', 'bijbelstudie',
    ],
  },
  personen: {
    categorySlugs: ['personen-in-de-bijbel', 'vrouwen-in-de-bijbel'],
    keywords: [
      'personen', 'koningen', 'apostelen', 'vrouwen', 'helden', 'martelaren',
      'abraham', 'mozes', 'david', 'petrus', 'paulus', 'maria', 'ruth', 'ester',
      'jozef', 'jakob',
    ],
  },
};

/** `beginner|intermediate|advanced` as answered in settings, on the quiz scale. */
const KNOWLEDGE_TO_DIFFICULTY: Record<string, 'easy' | 'medium' | 'hard'> = {
  beginner: 'easy',
  intermediate: 'medium',
  advanced: 'hard',
};

/** Quiz documents use two vocabularies for the same three levels. */
function normalizeDifficulty(value: string | undefined): 'easy' | 'medium' | 'hard' | null {
  const key = (value || '').toLowerCase();
  if (key === 'easy' || key === 'beginner') return 'easy';
  if (key === 'medium' || key === 'intermediate') return 'medium';
  if (key === 'hard' || key === 'advanced') return 'hard';
  return null;
}

const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'makkelijk',
  medium: 'gemiddeld',
  hard: 'moeilijk',
};

const DIFFICULTY_RANK: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export const READING_FREQUENCY_LABELS: Record<string, string> = {
  daily: 'dagelijks',
  weekly: 'wekelijks',
  monthly: 'maandelijks',
  rarely: 'af en toe',
};

/**
 * Shape every surface already has: a lean quiz document with its category.
 *
 * `_id` and `categoryId` are left as `unknown` on purpose. Callers hand this
 * function raw Mongoose lean documents (where both are `ObjectId`s) as well as
 * serialised JSON (where both are strings), and the ranking reads neither as an
 * identifier - only the populated category's `slug` and `title` matter, and
 * those are narrowed below. Keeping the generic parameter means the caller's own
 * concrete type still comes back out of `recommendQuizzes`.
 */
export interface RecommendableQuiz {
  _id?: unknown;
  title: string;
  description?: string;
  difficulty?: string;
  isPremium?: boolean;
  slug?: string;
  categoryId?: unknown;
  questions?: unknown[];
  progress?: { attempts?: number } | null;
}

export interface Recommendation<T extends RecommendableQuiz> {
  quiz: T;
  score: number;
  /** Why this quiz, in the reader's words. At most two are worth showing. */
  reasons: string[];
}

/** The populated category, when there is one. An unpopulated id yields nothing. */
function categoryOf(quiz: RecommendableQuiz): { title?: unknown; slug?: unknown } | null {
  const category = quiz.categoryId;
  return category && typeof category === 'object' ? (category as { title?: unknown; slug?: unknown }) : null;
}

function categorySlugOf(quiz: RecommendableQuiz): string {
  const slug = categoryOf(quiz)?.slug;
  return typeof slug === 'string' ? slug.toLowerCase() : '';
}

function searchTextOf(quiz: RecommendableQuiz): string {
  const title = categoryOf(quiz)?.title;
  const categoryTitle = typeof title === 'string' ? title : '';

  return `${quiz.title} ${quiz.description || ''} ${categoryTitle}`.toLowerCase();
}

/** True when the reader has answered enough for a recommendation to mean anything. */
export function hasRecommendationProfile(
  onboarding: Partial<UserOnboardingSettings> | null | undefined
): boolean {
  if (!onboarding) return false;
  return (
    (Array.isArray(onboarding.interests) && onboarding.interests.length > 0) ||
    Boolean(onboarding.knowledgeLevel) ||
    Boolean(onboarding.bibleReadingFrequency)
  );
}

/**
 * One sentence naming the answers the ranking is based on, so the section is
 * accountable: a reader who disagrees with the list can see which of their own
 * answers produced it and go change that answer.
 */
export function describeRecommendationProfile(
  onboarding: Partial<UserOnboardingSettings> | null | undefined
): string | null {
  if (!hasRecommendationProfile(onboarding)) return null;

  const parts: string[] = [];
  const interests = (onboarding?.interests || []).filter(Boolean);

  if (interests.length > 0) {
    parts.push(`je interesse in ${interests.slice(0, 3).map(interestLabel).join(', ')}`);
  }

  const level = KNOWLEDGE_TO_DIFFICULTY[onboarding?.knowledgeLevel || ''];
  if (level) parts.push(`je niveau (${DIFFICULTY_LABELS[level]})`);

  const frequency = READING_FREQUENCY_LABELS[onboarding?.bibleReadingFrequency || ''];
  if (frequency) parts.push(`je leesritme (${frequency})`);

  if (parts.length === 0) return null;

  const sentence =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} en ${parts[parts.length - 1]}`;

  return `Samengesteld op basis van ${sentence}.`;
}

export interface RecommendOptions {
  limit?: number;
  /** Locked premium quizzes rank lower but are never hidden: they convert. */
  isPremiumUser?: boolean;
}

/**
 * Rank quizzes for one reader.
 *
 * Weights are ordered by how much the reader actually told us: an explicit
 * interest outranks a difficulty guess, which outranks a reading-rhythm nudge.
 * Everything is additive and deterministic - the same profile and library
 * always produce the same list, which is what makes the feature debuggable.
 */
export function recommendQuizzes<T extends RecommendableQuiz>(
  quizzes: T[],
  onboarding: Partial<UserOnboardingSettings> | null | undefined,
  options: RecommendOptions = {}
): Recommendation<T>[] {
  const limit = options.limit ?? 6;
  const interests = (onboarding?.interests || []).filter(
    (value): value is InterestValue => value in INTEREST_MATCHERS
  );
  const targetDifficulty = KNOWLEDGE_TO_DIFFICULTY[onboarding?.knowledgeLevel || ''] ?? null;
  const frequency = onboarding?.bibleReadingFrequency || '';

  const scored = quizzes.map((quiz, index) => {
    const reasons: string[] = [];
    let score = 0;

    // ── Interests ─────────────────────────────────────────────────────────
    const slug = categorySlugOf(quiz);
    const haystack = searchTextOf(quiz);
    const matched: InterestValue[] = [];

    for (const interest of interests) {
      const matcher = INTEREST_MATCHERS[interest];
      if (matcher.categorySlugs.includes(slug)) {
        score += 6;
        matched.push(interest);
        continue;
      }
      if (matcher.keywords.some((keyword) => haystack.includes(keyword))) {
        score += 3;
        matched.push(interest);
      }
    }

    // Kept short on purpose: these are read as chips under a quiz tile, where a
    // full sentence turns into three wrapped lines and stops being scannable.
    // The section lead above them carries the full explanation.
    if (matched.length > 0) {
      reasons.push(`Interesse: ${interestLabel(matched[0])}`);
    }

    // ── Self-rated knowledge level ────────────────────────────────────────
    const difficulty = normalizeDifficulty(quiz.difficulty);
    if (targetDifficulty && difficulty) {
      const distance = Math.abs(DIFFICULTY_RANK[difficulty] - DIFFICULTY_RANK[targetDifficulty]);
      if (distance === 0) {
        score += 4;
        reasons.push(`Niveau: ${DIFFICULTY_LABELS[difficulty]}`);
      } else if (distance === 1) {
        score += 1;
      } else {
        score -= 2;
      }
    }

    // ── Reading rhythm ────────────────────────────────────────────────────
    // Somebody who reads daily is looking for depth; somebody who reads now
    // and then needs a quiz that fits in one sitting.
    const questionCount = quiz.questions?.length ?? 0;
    if (frequency === 'daily' && questionCount >= 12) {
      score += 2;
      reasons.push('Extra diepgang');
    } else if ((frequency === 'rarely' || frequency === 'monthly') && questionCount > 0 && questionCount <= 10) {
      score += 2;
      reasons.push('Kort en compact');
    }

    // ── Freshness ─────────────────────────────────────────────────────────
    const attempts = quiz.progress?.attempts ?? 0;
    if (attempts === 0) {
      score += 3;
      reasons.push('Nog niet gespeeld');
    } else if (attempts >= 2) {
      score -= 2;
    }

    // A quiz the reader cannot open yet is a weaker recommendation than one
    // they can start now, but it is still the honest next step for them.
    if (quiz.isPremium && options.isPremiumUser === false) {
      score -= 1;
    }

    return { quiz, score, reasons: reasons.slice(0, 2), index };
  });

  return scored
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .slice(0, limit)
    .map(({ quiz, score, reasons }) => ({ quiz, score, reasons }));
}
