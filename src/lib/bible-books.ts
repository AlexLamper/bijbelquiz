/**
 * The 66 books in canonical order, with the Dutch titles the site uses.
 *
 * Codes are the OSIS-style ones from `book-canon.ts`, which is what every
 * question's `refBook` carries. This table exists so a page can lay the whole
 * Bible out - by testament, by group, in order, with chapter counts - and
 * hang quizzes on it, rather than only listing the books that happen to have
 * quizzes today.
 */

import { getSiteConfig, isNlSite } from '@/config/site';
import { INTL_BOOK_TABLES, type IntlNameLocale } from './book-names-intl';

export type Testament = 'OT' | 'NT';

export type BookGroupId =
  | 'wet'
  | 'geschiedenis'
  | 'poezie'
  | 'grote-profeten'
  | 'kleine-profeten'
  | 'evangelien'
  | 'handelingen'
  | 'brieven-paulus'
  | 'algemene-brieven'
  | 'openbaring';

export interface BookGroup {
  id: BookGroupId;
  label: string;
  testament: Testament;
}

export interface BibleBook {
  code: string;
  title: string;
  /** Shorter form for tight layouts: "1 Kor.", "Openb." */
  short: string;
  /** URL-safe form of `title`, e.g. "1-samuel", "hooglied". */
  slug: string;
  testament: Testament;
  group: BookGroupId;
  chapters: number;
}


/** English titles and short forms (intl site), in canonical order, keyed by code. */
const EN_CODES = [
  'GEN', 'EXOD', 'LEV', 'NUM', 'DEUT', 'JOSH', 'JUDG', 'RUTH', '1SAM', '2SAM', '1KGS', '2KGS', '1CHR', '2CHR', 'EZRA', 'NEH', 'ESTH', 'JOB', 'PS', 'PROV',
  'ECCL', 'SONG', 'ISA', 'JER', 'LAM', 'EZEK', 'DAN', 'HOS', 'JOEL', 'AMOS', 'OBAD', 'JONAH', 'MIC', 'NAH', 'HAB', 'ZEPH', 'HAG', 'ZECH', 'MAL',
  'MATT', 'MARK', 'LUKE', 'JOHN', 'ACTS', 'ROM', '1COR', '2COR', 'GAL', 'EPH', 'PHIL', 'COL', '1THESS', '2THESS', '1TIM', '2TIM', 'TITUS', 'PHLM',
  'HEB', 'JAS', '1PET', '2PET', '1JOHN', '2JOHN', '3JOHN', 'JUDE', 'REV',
];
const EN_TITLES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];
const EN_SHORT = [
  'Gen.', 'Ex.', 'Lev.', 'Num.', 'Deut.', 'Josh.', 'Judg.', 'Ruth', '1 Sam.', '2 Sam.', '1 Kgs.', '2 Kgs.', '1 Chr.', '2 Chr.', 'Ezra', 'Neh.', 'Esth.', 'Job', 'Ps.', 'Prov.',
  'Eccl.', 'Song', 'Isa.', 'Jer.', 'Lam.', 'Ezek.', 'Dan.', 'Hos.', 'Joel', 'Amos', 'Obad.', 'Jonah', 'Mic.', 'Nah.', 'Hab.', 'Zeph.', 'Hag.', 'Zech.', 'Mal.',
  'Matt.', 'Mark', 'Luke', 'John', 'Acts', 'Rom.', '1 Cor.', '2 Cor.', 'Gal.', 'Eph.', 'Phil.', 'Col.', '1 Thess.', '2 Thess.', '1 Tim.', '2 Tim.', 'Titus', 'Phlm.',
  'Heb.', 'Jas.', '1 Pet.', '2 Pet.', '1 John', '2 John', '3 John', 'Jude', 'Rev.',
];
/** Language of the book names: 'nl' on the Dutch site, otherwise the intl build's locale. */
const NAME_LOCALE: string = isNlSite() ? 'nl' : getSiteConfig().defaultLocale;
const OTHER = NAME_LOCALE in INTL_BOOK_TABLES ? INTL_BOOK_TABLES[NAME_LOCALE as IntlNameLocale] : null;
const EN_BY_CODE = new Map(
  EN_CODES.map((code, i) => [code, OTHER ? { title: OTHER.titles[i], short: OTHER.shorts[i] } : { title: EN_TITLES[i], short: EN_SHORT[i] }]),
);

const EN_GROUP_LABELS: Record<string, string> = {
  wet: 'Law', geschiedenis: 'History', poezie: 'Poetry and wisdom', 'grote-profeten': 'Major prophets',
  'kleine-profeten': 'Minor prophets', evangelien: 'Gospels', handelingen: 'Acts', 'brieven-paulus': 'Letters of Paul',
  'algemene-brieven': 'General letters', openbaring: 'Revelation',
};
const EN_GENRE_LABELS: Record<string, string> = {
  wet: 'Law', geschiedenis: 'History', 'poezie-wijsheid': 'Poetry & wisdom', 'grote-profeten': 'Major prophets',
  'kleine-profeten': 'Minor prophets', 'evangelien-handelingen': 'Gospels & Acts', 'brieven-van-paulus': 'Letters of Paul',
  'brieven-openbaring': 'Letters & Revelation',
};

export const BOOK_GROUPS: BookGroup[] = [
  { id: 'wet', label: 'Wet', testament: 'OT' },
  { id: 'geschiedenis', label: 'Geschiedenis', testament: 'OT' },
  { id: 'poezie', label: 'Poëzie en wijsheid', testament: 'OT' },
  { id: 'grote-profeten', label: 'Grote profeten', testament: 'OT' },
  { id: 'kleine-profeten', label: 'Kleine profeten', testament: 'OT' },
  { id: 'evangelien', label: 'Evangeliën', testament: 'NT' },
  { id: 'handelingen', label: 'Handelingen', testament: 'NT' },
  { id: 'brieven-paulus', label: 'Brieven van Paulus', testament: 'NT' },
  { id: 'algemene-brieven', label: 'Algemene brieven', testament: 'NT' },
  { id: 'openbaring', label: 'Openbaring', testament: 'NT' },
].map((g) => (isNlSite() ? g : { ...g, label: (OTHER?.groups ?? EN_GROUP_LABELS)[g.id] })) as BookGroup[];

/**
 * The 8 genre groupings the `/quizzen` overview page shows (one continuous-
 * canon layout), collapsing the 10 `BookGroupId`s used elsewhere on the site:
 * Evangeliën+Handelingen become one row, and Algemene brieven+Openbaring
 * become another.
 */
export type OverviewGenreId =
  | 'wet'
  | 'geschiedenis'
  | 'poezie-wijsheid'
  | 'grote-profeten'
  | 'kleine-profeten'
  | 'evangelien-handelingen'
  | 'brieven-van-paulus'
  | 'brieven-openbaring';

export interface OverviewGenre {
  id: OverviewGenreId;
  label: string;
  testament: Testament;
}

export const OVERVIEW_GENRES: OverviewGenre[] = [
  { id: 'wet', label: 'Wet', testament: 'OT' },
  { id: 'geschiedenis', label: 'Geschiedenis', testament: 'OT' },
  { id: 'poezie-wijsheid', label: 'Poëzie & wijsheid', testament: 'OT' },
  { id: 'grote-profeten', label: 'Grote profeten', testament: 'OT' },
  { id: 'kleine-profeten', label: 'Kleine profeten', testament: 'OT' },
  { id: 'evangelien-handelingen', label: 'Evangeliën & Handelingen', testament: 'NT' },
  { id: 'brieven-van-paulus', label: 'Brieven van Paulus', testament: 'NT' },
  { id: 'brieven-openbaring', label: 'Brieven & Openbaring', testament: 'NT' },
].map((g) => (isNlSite() ? g : { ...g, label: (OTHER?.genres ?? EN_GENRE_LABELS)[g.id] })) as OverviewGenre[];

const GROUP_TO_OVERVIEW_GENRE: Record<BookGroupId, OverviewGenreId> = {
  wet: 'wet',
  geschiedenis: 'geschiedenis',
  poezie: 'poezie-wijsheid',
  'grote-profeten': 'grote-profeten',
  'kleine-profeten': 'kleine-profeten',
  evangelien: 'evangelien-handelingen',
  handelingen: 'evangelien-handelingen',
  'brieven-paulus': 'brieven-van-paulus',
  'algemene-brieven': 'brieven-openbaring',
  openbaring: 'brieven-openbaring',
};

export function overviewGenreForGroup(group: BookGroupId): OverviewGenreId {
  return GROUP_TO_OVERVIEW_GENRE[group];
}

function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const b = (
  code: string,
  title: string,
  short: string,
  testament: Testament,
  group: BookGroupId,
  chapters: number,
): BibleBook => {
  // The site decides the language of the names; on NL this is the Dutch row as written.
  const en = isNlSite() ? undefined : EN_BY_CODE.get(code);
  const name = en?.title ?? title;
  return { code, title: name, short: en?.short ?? short, slug: slugify(name), testament, group, chapters };
};

export const BIBLE_BOOKS: BibleBook[] = [
  // ── Oude Testament ───────────────────────────────────────────────────────
  b('GEN', 'Genesis', 'Gen.', 'OT', 'wet', 50),
  b('EXOD', 'Exodus', 'Ex.', 'OT', 'wet', 40),
  b('LEV', 'Leviticus', 'Lev.', 'OT', 'wet', 27),
  b('NUM', 'Numeri', 'Num.', 'OT', 'wet', 36),
  b('DEUT', 'Deuteronomium', 'Deut.', 'OT', 'wet', 34),
  b('JOSH', 'Jozua', 'Joz.', 'OT', 'geschiedenis', 24),
  b('JUDG', 'Richteren', 'Richt.', 'OT', 'geschiedenis', 21),
  b('RUTH', 'Ruth', 'Ruth', 'OT', 'geschiedenis', 4),
  b('1SAM', '1 Samuel', '1 Sam.', 'OT', 'geschiedenis', 31),
  b('2SAM', '2 Samuel', '2 Sam.', 'OT', 'geschiedenis', 24),
  b('1KGS', '1 Koningen', '1 Kon.', 'OT', 'geschiedenis', 22),
  b('2KGS', '2 Koningen', '2 Kon.', 'OT', 'geschiedenis', 25),
  b('1CHR', '1 Kronieken', '1 Kron.', 'OT', 'geschiedenis', 29),
  b('2CHR', '2 Kronieken', '2 Kron.', 'OT', 'geschiedenis', 36),
  b('EZRA', 'Ezra', 'Ezra', 'OT', 'geschiedenis', 10),
  b('NEH', 'Nehemia', 'Neh.', 'OT', 'geschiedenis', 13),
  b('ESTH', 'Esther', 'Est.', 'OT', 'geschiedenis', 10),
  b('JOB', 'Job', 'Job', 'OT', 'poezie', 42),
  b('PS', 'Psalmen', 'Ps.', 'OT', 'poezie', 150),
  b('PROV', 'Spreuken', 'Spr.', 'OT', 'poezie', 31),
  b('ECCL', 'Prediker', 'Pred.', 'OT', 'poezie', 12),
  b('SONG', 'Hooglied', 'Hoogl.', 'OT', 'poezie', 8),
  b('ISA', 'Jesaja', 'Jes.', 'OT', 'grote-profeten', 66),
  b('JER', 'Jeremia', 'Jer.', 'OT', 'grote-profeten', 52),
  b('LAM', 'Klaagliederen', 'Klaagl.', 'OT', 'grote-profeten', 5),
  b('EZEK', 'Ezechiël', 'Ez.', 'OT', 'grote-profeten', 48),
  b('DAN', 'Daniël', 'Dan.', 'OT', 'grote-profeten', 12),
  b('HOS', 'Hosea', 'Hos.', 'OT', 'kleine-profeten', 14),
  b('JOEL', 'Joël', 'Joël', 'OT', 'kleine-profeten', 3),
  b('AMOS', 'Amos', 'Amos', 'OT', 'kleine-profeten', 9),
  b('OBAD', 'Obadja', 'Ob.', 'OT', 'kleine-profeten', 1),
  b('JONAH', 'Jona', 'Jona', 'OT', 'kleine-profeten', 4),
  b('MIC', 'Micha', 'Micha', 'OT', 'kleine-profeten', 7),
  b('NAH', 'Nahum', 'Nah.', 'OT', 'kleine-profeten', 3),
  b('HAB', 'Habakuk', 'Hab.', 'OT', 'kleine-profeten', 3),
  b('ZEPH', 'Zefanja', 'Zef.', 'OT', 'kleine-profeten', 3),
  b('HAG', 'Haggai', 'Hag.', 'OT', 'kleine-profeten', 2),
  b('ZECH', 'Zacharia', 'Zach.', 'OT', 'kleine-profeten', 14),
  b('MAL', 'Maleachi', 'Mal.', 'OT', 'kleine-profeten', 4),
  // ── Nieuwe Testament ─────────────────────────────────────────────────────
  b('MATT', 'Matteüs', 'Matt.', 'NT', 'evangelien', 28),
  b('MARK', 'Marcus', 'Marc.', 'NT', 'evangelien', 16),
  b('LUKE', 'Lucas', 'Luc.', 'NT', 'evangelien', 24),
  b('JOHN', 'Johannes', 'Joh.', 'NT', 'evangelien', 21),
  b('ACTS', 'Handelingen', 'Hand.', 'NT', 'handelingen', 28),
  b('ROM', 'Romeinen', 'Rom.', 'NT', 'brieven-paulus', 16),
  b('1COR', '1 Korintiërs', '1 Kor.', 'NT', 'brieven-paulus', 16),
  b('2COR', '2 Korintiërs', '2 Kor.', 'NT', 'brieven-paulus', 13),
  b('GAL', 'Galaten', 'Gal.', 'NT', 'brieven-paulus', 6),
  b('EPH', 'Efeziërs', 'Ef.', 'NT', 'brieven-paulus', 6),
  b('PHIL', 'Filippenzen', 'Fil.', 'NT', 'brieven-paulus', 4),
  b('COL', 'Kolossenzen', 'Kol.', 'NT', 'brieven-paulus', 4),
  b('1THESS', '1 Tessalonicenzen', '1 Tess.', 'NT', 'brieven-paulus', 5),
  b('2THESS', '2 Tessalonicenzen', '2 Tess.', 'NT', 'brieven-paulus', 3),
  b('1TIM', '1 Timoteüs', '1 Tim.', 'NT', 'brieven-paulus', 6),
  b('2TIM', '2 Timoteüs', '2 Tim.', 'NT', 'brieven-paulus', 4),
  b('TITUS', 'Titus', 'Tit.', 'NT', 'brieven-paulus', 3),
  b('PHLM', 'Filemon', 'Filem.', 'NT', 'brieven-paulus', 1),
  b('HEB', 'Hebree\u00EBn', 'Hebr.', 'NT', 'algemene-brieven', 13),
  b('JAS', 'Jakobus', 'Jak.', 'NT', 'algemene-brieven', 5),
  b('1PET', '1 Petrus', '1 Petr.', 'NT', 'algemene-brieven', 5),
  b('2PET', '2 Petrus', '2 Petr.', 'NT', 'algemene-brieven', 3),
  b('1JOHN', '1 Johannes', '1 Joh.', 'NT', 'algemene-brieven', 5),
  b('2JOHN', '2 Johannes', '2 Joh.', 'NT', 'algemene-brieven', 1),
  b('3JOHN', '3 Johannes', '3 Joh.', 'NT', 'algemene-brieven', 1),
  b('JUDE', 'Judas', 'Jud.', 'NT', 'algemene-brieven', 1),
  b('REV', 'Openbaring', 'Openb.', 'NT', 'openbaring', 22),
];

const BY_CODE = new Map(BIBLE_BOOKS.map((book) => [book.code, book]));
const BY_SLUG = new Map(BIBLE_BOOKS.map((book) => [book.slug, book]));

/** The book for a canonical code, or null for anything unrecognised. */
export function bookByCode(code: string | null | undefined): BibleBook | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** The book for a URL slug ("1-samuel"), or null for anything unrecognised. */
export function bookBySlug(slug: string | null | undefined): BibleBook | null {
  if (!slug) return null;
  return BY_SLUG.get(slug.toLowerCase()) ?? null;
}

/** The book for a display name ("Daniël", "1 Korintiërs"), or null for anything unrecognised. */
export function bookByName(name: string | null | undefined): BibleBook | null {
  if (!name) return null;
  return BY_SLUG.get(slugify(name)) ?? null;
}

/** Position in the canon, 0-based; 999 for unknown so it sorts last. */
export function bookOrder(code: string | null | undefined): number {
  if (!code) return 999;
  const index = BIBLE_BOOKS.findIndex((book) => book.code === code.toUpperCase());
  return index === -1 ? 999 : index;
}
