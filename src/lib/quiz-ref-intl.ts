/**
 * Strict Bible-reference parsing for the non-Dutch quiz libraries.
 *
 * The Dutch parser accepts almost any text as a book name; for the quiz
 * pipeline that is too lenient. Here the book must be the canonical title of
 * the language (`INTL_BOOK_TABLES`, or the English title for `en`), so a
 * reference that is misspelled, abbreviated or in the wrong language fails.
 */
import { INTL_BOOK_TABLES, INTL_CODES, type IntlNameLocale } from '@/lib/book-names-intl';
import { apiBookName } from '@/lib/bible-books';

export interface StrictRef {
  /** Book as BijbelAPI/data files key it (English). */
  apiBook: string;
  chapter: number;
  verse: number;
  endVerse: number;
}

const EN_TITLE_TO_CODE = new Map<string, string>(INTL_CODES.map((code) => [apiBookName(code) ?? '', code]));

/** canonical title of a language -> OSIS code */
function titleToCode(lang: string, title: string): string | null {
  if (lang === 'en') return EN_TITLE_TO_CODE.get(title) ?? null;
  const table = INTL_BOOK_TABLES[lang as IntlNameLocale];
  if (!table) return null;
  const i = table.titles.indexOf(title);
  return i >= 0 ? INTL_CODES[i] : null;
}

/** "Johannes 3:16-18" -> parts, or an error message. Ranges stay inside one chapter. */
export function parseStrictRef(lang: string, ref: string): StrictRef | string {
  const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/);
  if (!m) return 'must look like "<Book> <chapter>:<verse>" or "<Book> <chapter>:<from>-<to>"';
  const code = titleToCode(lang, m[1]);
  if (!code) return `"${m[1]}" is not a canonical book title in "${lang}"`;
  const chapter = Number(m[2]);
  const verse = Number(m[3]);
  const endVerse = m[4] ? Number(m[4]) : verse;
  if (endVerse < verse) return 'verse range runs backwards';
  return { apiBook: apiBookName(code) as string, chapter, verse, endVerse };
}
