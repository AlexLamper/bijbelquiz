import { BIBLE_BOOKS, bookByName } from '@/lib/bible-books';

/**
 * BijbelAPI's day text names the book in English ("Proverbs 30:5"), whatever
 * translation the text itself is in. The site is Dutch, so the reference is
 * shown with the Dutch title ("Spreuken 30:5").
 */

/** The 66 English book names, in the same canonical order as `BIBLE_BOOKS`. */
const ENGLISH_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const DUTCH_BY_ENGLISH = new Map<string, string>(ENGLISH_NAMES.map((name, i) => [key(name), BIBLE_BOOKS[i]?.title ?? name]));
DUTCH_BY_ENGLISH.set('psalm', DUTCH_BY_ENGLISH.get('psalms')!);
DUTCH_BY_ENGLISH.set('songofsongs', DUTCH_BY_ENGLISH.get('songofsolomon')!);
DUTCH_BY_ENGLISH.set('revelations', DUTCH_BY_ENGLISH.get('revelation')!);

/** "Spreuken" for "Proverbs"; a Dutch name is kept; an unknown one is returned as given. */
export function dutchBookName(book: string): string {
  const trimmed = book.trim();
  return DUTCH_BY_ENGLISH.get(key(trimmed)) ?? bookByName(trimmed)?.title ?? trimmed;
}

/** "Spreuken 30:5", "Psalm 23:1-3" from the day text's parts. */
export function dutchReference(parts: {
  book: string;
  chapter: string | number;
  verse: string | number;
  verseEnd?: string | number | null;
}): string {
  const name = dutchBookName(parts.book);
  // One psalm is "Psalm 23", not "Psalmen 23".
  const book = name === 'Psalmen' ? 'Psalm' : name;
  const end = parts.verseEnd != null && String(parts.verseEnd) !== String(parts.verse) ? `-${parts.verseEnd}` : '';
  return `${book} ${parts.chapter}:${parts.verse}${end}`;
}

/** A whole reference string ("Proverbs 30:5") with its book name in Dutch. */
export function dutchReferenceString(reference: string): string {
  const match = reference.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!match) return reference;
  const [, book, chapter, verse, verseEnd] = match;
  if (!verse) return `${dutchBookName(book)} ${chapter}`;
  return dutchReference({ book, chapter, verse, verseEnd });
}
