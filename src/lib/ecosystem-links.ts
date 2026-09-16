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
 * The welcome offer for BijbelQuiz players: the first month of BijbelStudie Pro
 * for free.
 *
 * It is a Stripe promotion code in BijbelStudie's account, typed in at its own
 * checkout (which has `allow_promotion_codes` on). Nothing on BijbelStudie's
 * side knows about BijbelQuiz, so the redemption count of this code in Stripe is
 * also the only place a paying subscriber can be traced back to this site - the
 * utm parameters below arrive, but BijbelStudie does not record them.
 *
 * A fixed EUR 9,99 off the first invoice rather than 100% off one month: on the
 * monthly plan that is the same free month, and on the annual plan it is
 * EUR 9,99 off the year instead of a free year. The copy says both.
 *
 * `scripts/create-bijbelstudie-promo.ts` creates the code from these values.
 * The offer only shows once `NEXT_PUBLIC_BIJBELSTUDIE_PROMO_ENABLED` is `true`,
 * so a deploy can never advertise a code that does not exist in Stripe yet.
 */
export const STUDIE_PROMO_CODE = 'BIJBELQUIZ';
export const STUDIE_PROMO_AMOUNT_OFF_CENTS = 999;
/** Stripe refuses the code after this moment, and the site stops showing it. */
export const STUDIE_PROMO_EXPIRES_AT = '2027-03-31T23:59:59+02:00';
export const STUDIE_PROMO_MAX_REDEMPTIONS = 250;

export interface StudiePromo {
  code: string;
  headline: string;
  terms: string;
}

export function studiePromo(
  now: number = Date.now(),
  enabled: string | undefined = process.env.NEXT_PUBLIC_BIJBELSTUDIE_PROMO_ENABLED,
): StudiePromo | null {
  if (enabled !== 'true') return null;
  if (now > Date.parse(STUDIE_PROMO_EXPIRES_AT)) return null;

  return {
    code: STUDIE_PROMO_CODE,
    headline: 'Je eerste maand Pro gratis',
    terms:
      'Voor nieuwe Pro-abonnees, bij het afrekenen op bijbelstudie.io. Kies je een jaarabonnement, dan krijg je €9,99 korting. Geldig t/m 31 maart 2027.',
  };
}

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
  /** The main button of the popup after finishing a quiz. */
  'interstitial',
  /** The Pro link beside the promo code in that popup. */
  'interstitial_offer',
  /** The hint under the start button, before the first question. */
  'quiz_intro',
  /** The scoreboard at the end of a multiplayer game. */
  'multiplayer_end',
  /** The block on the public home page. */
  'landing',
  /** The closing line of the home page. */
  'landing_cta',
  /** The block in the signed-in dashboard. */
  'dashboard',
  /** The main button on `/bijbelstudie`, the page that explains the tool. */
  'studie_page',
  /** The Pro link beside the promo code on that page. */
  'studie_page_offer',
  /** A search on `/quizzen` that found nothing. */
  'quiz_list_empty',
  /** The help centre. */
  'help',
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
  HEB: 'Hebree\u00EBn',
  JAS: 'Jakobus',
  '1PET': '1 Petrus',
  '2PET': '2 Petrus',
  '1JOHN': '1 Johannes',
  '2JOHN': '2 Johannes',
  '3JOHN': '3 Johannes',
  JUDE: 'Judas',
  REV: 'Openbaring',
};

/**
 * Canonical book code to the folder name of BijbelStudie's Statenvertaling,
 * which is what `/lezen?book=` has to match.
 *
 * Not the same list as `STUDIE_BOOK_NAMES` above: those are readable Dutch names
 * for labels ("Lees 1 Korinthe 13"), these are the exact folder spellings the
 * reader looks up, quirks included ("2 Corinthiër", "Filémon", "Haggaï").
 * Sending the label spelling used to open Genesis 1 for a dozen books. Copied
 * from `CANONICAL_NL` in BijbelStudie's `lib/book-mapping.ts`; keep them equal.
 */
const STUDIE_READER_BOOKS: Record<string, string> = {
  GEN: 'Genesis',
  EXOD: 'Exodus',
  LEV: 'Leviticus',
  NUM: 'Numeri',
  DEUT: 'Deuteronomium',
  JOSH: 'Jozua',
  JUDG: 'Richteren',
  RUTH: 'Ruth',
  '1SAM': '1 Samuël',
  '2SAM': '2 Samuël',
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
  DAN: 'Daniël',
  HOS: 'Hosea',
  JOEL: 'Joël',
  AMOS: 'Amos',
  OBAD: 'Obadja',
  JONAH: 'Jona',
  MIC: 'Micha',
  NAH: 'Nahum',
  HAB: 'Habakuk',
  ZEPH: 'Zefanja',
  HAG: 'Haggaï',
  ZECH: 'Zacharia',
  MAL: 'Maleachi',
  MATT: 'Mattheüs',
  MARK: 'Markus',
  LUKE: 'Lukas',
  JOHN: 'Johannes',
  ACTS: 'Handelingen',
  ROM: 'Romeinen',
  '1COR': '1 Corinthiërs',
  '2COR': '2 Corinthiër',
  GAL: 'Galaten',
  EPH: 'Efeziërs',
  PHIL: 'Filippenzen',
  COL: 'Colossenzen',
  '1THESS': '1 Thessalonicenzen',
  '2THESS': '2 Thessalonicenzen',
  '1TIM': '1 Timotheüs',
  '2TIM': '2 Timotheüs',
  TITUS: 'Titus',
  PHLM: 'Filémon',
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

/** The translation whose folder names `STUDIE_READER_BOOKS` holds. */
export const STUDIE_READER_VERSION = 'statenvertaling';

const CODE_BY_STUDIE_BOOK_NAME = new Map(
  Object.entries(STUDIE_BOOK_NAMES).map(([code, name]) => [name, code]),
);

/**
 * The spelling `/lezen?book=` needs for any name of a book: one of this file's
 * labels, a canonical code, or anything `book-canon.ts` recognises. Unknown
 * names pass through unchanged; BijbelStudie resolves loose spellings too.
 */
export function studieReaderBookName(book: string): string {
  const code =
    CODE_BY_STUDIE_BOOK_NAME.get(book) ??
    (STUDIE_READER_BOOKS[book] ? book : null) ??
    toBookCode(book);
  return (code && STUDIE_READER_BOOKS[code]) || book;
}

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
  // Own-property attribution, not tracking. BijbelStudie does not record these
  // parameters today (checked 2026-09-16: no utm handling and no analytics
  // package in that repo), so what this site can measure ends at the click -
  // `bijbelstudie_click` here, and redemptions of `STUDIE_PROMO_CODE` in
  // BijbelStudie's Stripe. They stay on the link so that anything added over
  // there later has history to read from day one.
  url.searchParams.set('utm_source', 'bijbelquiz');
  url.searchParams.set('utm_medium', surface);
  if (quizSlug) url.searchParams.set('utm_campaign', quizSlug);
  return url.toString();
}

/** Deep link to a chapter in BijbelStudie's reader. */
export function studieReadHref(passage: StudiePassage, options: StudieLinkOptions): string {
  const url = new URL('/lezen', BIJBEL_STUDIE_BASE_URL);
  url.searchParams.set('book', studieReaderBookName(passage.book));
  url.searchParams.set('chapter', String(passage.chapter));
  // BijbelStudie only honoured `book`/`chapter` when `version` came with them;
  // without it the reader opened last-read or Genesis 1. It now accepts links
  // without one, but naming the translation the folder names belong to keeps
  // the link exact on any deploy.
  url.searchParams.set('version', STUDIE_READER_VERSION);
  return withCampaign(url, options);
}

/** Where to send a reader when no passage could be resolved. */
export function studieHomeHref(options: StudieLinkOptions): string {
  return withCampaign(new URL('/', BIJBEL_STUDIE_BASE_URL), options);
}

/** BijbelStudie's pricing page, where the promo code gets used. */
export function studiePricingHref(options: StudieLinkOptions): string {
  return withCampaign(new URL('/abonnement', BIJBEL_STUDIE_BASE_URL), options);
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
