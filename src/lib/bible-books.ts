/**
 * The 66 books in canonical order, with the Dutch titles the site uses.
 *
 * Codes are the OSIS-style ones from `book-canon.ts`, which is what every
 * question's `refBook` carries. This table exists so a page can lay the whole
 * Bible out - by testament, by group, in order, with chapter counts - and
 * hang quizzes on it, rather than only listing the books that happen to have
 * quizzes today.
 */

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
  testament: Testament;
  group: BookGroupId;
  chapters: number;
}

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
];

const b = (
  code: string,
  title: string,
  short: string,
  testament: Testament,
  group: BookGroupId,
  chapters: number,
): BibleBook => ({ code, title, short, testament, group, chapters });

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
  b('HEB', 'Hebreeën', 'Hebr.', 'NT', 'algemene-brieven', 13),
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

/** The book for a canonical code, or null for anything unrecognised. */
export function bookByCode(code: string | null | undefined): BibleBook | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** Position in the canon, 0-based; 999 for unknown so it sorts last. */
export function bookOrder(code: string | null | undefined): number {
  if (!code) return 999;
  const index = BIBLE_BOOKS.findIndex((book) => book.code === code.toUpperCase());
  return index === -1 ? 999 : index;
}
