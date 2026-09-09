/**
 * Links from BijbelQuiz into the rest of the ecosystem.
 *
 * BijbelQuiz no longer sells anything to an individual reader. Its job is to be
 * a good free quiz *and* to hand the reader to BijbelStudie at the moment they
 * are most likely to want it - which is right after a question they got wrong,
 * about a passage they now know they do not know.
 *
 * That handover only works if the link is about the passage they just played.
 * "Bekijk ook BijbelStudie" pointing at a homepage is an advert; "Lees Genesis
 * 3 met uitleg" pointing at that chapter is the next step of the same thought.
 * Every question already carries `refBook` / `refChapter` (see
 * `database/models/Quiz.ts`), and `refBook` is a canonical code precisely
 * because the two projects spell several books differently - so the mapping
 * below is the last piece needed to build a real deep link.
 */

import { parseBibleReference } from './bible-reference';
import { toBookCode } from './book-canon';

export const BIJBEL_STUDIE_BASE_URL = 'https://www.bijbelstudie.io';
export const BIJBEL_API_BASE_URL = 'https://www.bijbelapi.com';

/**
 * Where a BijbelStudie link was shown.
 *
 * A closed set rather than free text: the whole point of measuring this is to
 * find out which of the handful of placements actually carries the traffic, and
 * that question is unanswerable if every component invents its own label.
 */
export const STUDIE_LINK_SURFACES = [
  /** Under the explanation of an answered question, during the quiz. */
  'explanation',
  /** The primary button on the result screen. */
  'result_primary',
  /** The "you got these wrong" call to action on the result screen. */
  'result_wrong_answers',
  /** Inside the post-quiz review list. */
  'review',
  /** The once-per-session card after finishing a quiz. */
  'interstitial',
  /** The scoreboard at the end of a multiplayer game. */
  'multiplayer_end',
  /** The block on the public home page. */
  'landing',
  /** The block in the signed-in dashboard. */
  'dashboard',
  'sidebar',
  'footer',
] as const;

export type StudieLinkSurface = (typeof STUDIE_LINK_SURFACES)[number];

/**
 * Canonical book code to the Dutch book name BijbelStudie's reader expects.
 *
 * The inverse of `book-canon.ts`, which maps every spelling either project uses
 * onto one code. Here exactly one spelling comes back out: BijbelStudie's, as
 * listed in its own `lib/book-mapping.ts`. Getting this wrong does not error -
 * it opens the reader on the wrong book - so the two lists must be kept equal.
 */
const STUDIE_BOOK_NAMES: Record<string, string> = {
  GEN: 'Genesis',
  EXOD: 'Exodus',
  LEV: 'Leviticus',
  NUM: 'Numeri',
  DEUT: 'Deuteronomium',
  JOSH: 'Jozua',
  JUDG: 'Richteren',
  RUTH: 'Ruth',
  '1SAM': '1 Samuel',
  '2SAM': '2 Samuel',
  '1KGS': '1 Koningen',
  '2KGS': '2 Koningen',
  '1CHR': '1 Kronieken',
  '2CHR': '2 Kronieken',
  EZRA: 'Ezra',
  NEH: 'Nehemia',
  ESTH: 'Esther',
  JOB: 'Job',
  PS: 'Psalmen',
  PROV: 'Spreuken',
  ECCL: 'Prediker',
  SONG: 'Hooglied',
  ISA: 'Jesaja',
  JER: 'Jeremia',
  LAM: 'Klaagliederen',
  EZEK: 'Ezechiël',
  DAN: 'Daniel',
  HOS: 'Hosea',
  JOEL: 'Joël',
  AMOS: 'Amos',
  OBAD: 'Obadja',
  JONAH: 'Jona',
  MIC: 'Micha',
  NAH: 'Nahum',
  HAB: 'Habakuk',
  ZEPH: 'Zefanja',
  HAG: 'Haggai',
  ZECH: 'Zacharia',
  MAL: 'Maleachi',
  MATT: 'Mattheüs',
  MARK: 'Markus',
  LUKE: 'Lukas',
  JOHN: 'Johannes',
  ACTS: 'Handelingen',
  ROM: 'Romeinen',
  '1COR': '1 Korinthe',
  '2COR': '2 Korinthe',
  GAL: 'Galaten',
  EPH: 'Efeze',
  PHIL: 'Filippenzen',
  COL: 'Kolossenzen',
  '1THESS': '1 Thessalonica',
  '2THESS': '2 Thessalonica',
  '1TIM': '1 Timotheüs',
  '2TIM': '2 Timotheüs',
  TITUS: 'Titus',
  PHLM: 'Filemon',
  HEB: 'Hebreeën',
  JAS: 'Jakobus',
  '1PET': '1 Petrus',
  '2PET': '2 Petrus',
  '1JOHN': '1 Johannes',
  '2JOHN': '2 Johannes',
  '3JOHN': '3 Johannes',
  JUDE: 'Judas',
  REV: 'Openbaring',
};

/** A passage, in the spelling BijbelStudie uses. */
export interface StudiePassage {
  /** BijbelStudie's Dutch book name, e.g. "Mattheüs". */
  book: string;
  chapter: number;
}

/**
 * The passage a question points at, ready to be linked.
 *
 * Prefers the stored `refBook` / `refChapter`, which the model derives and
 * canonicalises on save. Falls back to parsing the printed reference, because
 * questions written before that hook existed only carry the string.
 */
export function passageFromQuestion(question: {
  refBook?: string | null;
  refChapter?: number | null;
  bibleReference?: string | null;
}): StudiePassage | null {
  const code = question.refBook || toBookCode(parseReferenceBook(question.bibleReference));
  const chapter =
    typeof question.refChapter === 'number' && question.refChapter > 0
      ? question.refChapter
      : parseReferenceChapter(question.bibleReference);

  if (!code || !chapter) return null;

  const book = STUDIE_BOOK_NAMES[code];
  return book ? { book, chapter } : null;
}

/**
 * Re-spell a book name BijbelQuiz already resolved (a room's passage, a quiz
 * overview) into the one BijbelStudie's reader expects.
 */
export function passageFromBookName(
  book: string | null | undefined,
  chapter: number | null | undefined,
): StudiePassage | null {
  const code = toBookCode(book);
  if (!code || !chapter || chapter <= 0) return null;

  const studieBook = STUDIE_BOOK_NAMES[code];
  return studieBook ? { book: studieBook, chapter } : null;
}

function parseReferenceBook(reference?: string | null): string | null {
  if (!reference) return null;
  return parseBibleReference(reference)?.book ?? null;
}

function parseReferenceChapter(reference?: string | null): number | null {
  if (!reference) return null;
  return parseBibleReference(reference)?.chapter ?? null;
}

/**
 * The single passage a whole quiz is "about", for the result screen.
 *
 * The most-referenced book-and-chapter across the questions given, so a quiz
 * that walks through Genesis 3 links to Genesis 3 rather than to whichever
 * question happened to be last. Ties go to the first one seen, which is the
 * order the quiz was written in.
 */
export function dominantPassage(
  questions: Array<{
    refBook?: string | null;
    refChapter?: number | null;
    bibleReference?: string | null;
  }>,
): StudiePassage | null {
  const counts = new Map<string, { passage: StudiePassage; count: number }>();

  for (const question of questions) {
    const passage = passageFromQuestion(question);
    if (!passage) continue;

    const key = `${passage.book} ${passage.chapter}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { passage, count: 1 });
    }
  }

  let best: { passage: StudiePassage; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }

  return best?.passage ?? null;
}

interface StudieLinkOptions {
  surface: StudieLinkSurface;
  /** Slug of the quiz the reader came from, for campaign attribution. */
  quizSlug?: string | null;
}

function withCampaign(url: URL, { surface, quizSlug }: StudieLinkOptions): string {
  // Own-property attribution, not tracking: this is the only way to tell
  // whether the handover works at all, and BijbelStudie reads the same three
  // parameters on arrival.
  url.searchParams.set('utm_source', 'bijbelquiz');
  url.searchParams.set('utm_medium', surface);
  if (quizSlug) url.searchParams.set('utm_campaign', quizSlug);
  return url.toString();
}

/** Deep link to a chapter in BijbelStudie's reader. */
export function studieReadHref(passage: StudiePassage, options: StudieLinkOptions): string {
  const url = new URL('/lezen', BIJBEL_STUDIE_BASE_URL);
  url.searchParams.set('book', passage.book);
  url.searchParams.set('chapter', String(passage.chapter));
  return withCampaign(url, options);
}

/** Where to send a reader when no passage could be resolved. */
export function studieHomeHref(options: StudieLinkOptions): string {
  return withCampaign(new URL('/', BIJBEL_STUDIE_BASE_URL), options);
}

/**
 * The link and its label for a question or a whole quiz.
 *
 * Always returns something: a quiz whose questions carry no usable reference
 * still gets a link, it just cannot promise a chapter.
 */
export interface StudieLink {
  href: string;
  label: string;
  passage: StudiePassage | null;
}

export function studieLinkForPassage(
  passage: StudiePassage | null,
  options: StudieLinkOptions,
): StudieLink {
  if (!passage) {
    return {
      href: studieHomeHref(options),
      label: 'Verder lezen op BijbelStudie',
      passage: null,
    };
  }

  return {
    href: studieReadHref(passage, options),
    label: `Lees ${passage.book} ${passage.chapter} op BijbelStudie`,
    passage,
  };
}
