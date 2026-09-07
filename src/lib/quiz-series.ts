/**
 * Reading a quiz library by title.
 *
 * The library has grown past the point where a flat list is browsable: there
 * are twenty-odd "Handelingen" quizzes, and rendering them as twenty adjacent
 * cards means the reader scrolls through a whole book to reach the next one.
 * Titles already carry the structure - "Handelingen 5", "Daniel Deel 2" - so
 * the grouping is derived from them rather than added to the data model.
 *
 * Shared by the quiz library grid and the multiplayer quiz picker so both
 * search and group the same way.
 */

const ROMAN_PARTS: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6 };

/** Combining marks left behind by an NFD normalise. */
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Lowercase, strip diacritics, collapse whitespace - for search comparisons. */
export function normalizeSearchText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface QuizSeries {
  /** Title with the part marker removed, in its original casing. */
  label: string;
  /** Normalised `label`, safe to use as a map key. */
  key: string;
  /** Position within the series; 0 when the title carries no part marker. */
  part: number;
}

/**
 * Split a quiz title into the series it belongs to and its part number, so
 * "Daniel Deel 1" and "Daniel Deel 2" - and "Handelingen 4" and
 * "Handelingen 5" - are each recognised as one series.
 *
 * A leading number is never a part marker: "1 Korinthiers" is a book, not the
 * first part of "Korinthiers".
 */
export function readSeries(title: string): QuizSeries {
  const trimmed = (title || '').trim();
  const match =
    trimmed.match(/^(.*?)[\s\-:]*\b(?:deel|dl\.?|part|hoofdstuk|hfst\.?)\s*([0-9]+|[ivx]+)\s*$/i)
    || trimmed.match(/^(.*?)\s*\(\s*([0-9]+)\s*\)\s*$/)
    || trimmed.match(/^(.*?)\s+-\s+([0-9]+)\s*$/)
    || trimmed.match(/^(.*?[^\s\d])\s+([0-9]+)\s*$/);

  const base = match?.[1]?.trim();
  if (!match || !base) {
    return { label: trimmed, key: normalizeSearchText(trimmed), part: 0 };
  }

  const raw = match[2].toLowerCase();
  const part = /^[0-9]+$/.test(raw) ? Number(raw) : ROMAN_PARTS[raw] ?? 0;

  return { label: base, key: normalizeSearchText(base), part };
}

/** Keep the incoming order, but pull every part of a series together, in order. */
export function groupSeries<T extends { title: string }>(items: T[]): T[] {
  const firstSeen = new Map<string, number>();

  const decorated = items.map((item, index) => {
    const { key, part } = readSeries(item.title);
    if (!firstSeen.has(key)) {
      firstSeen.set(key, index);
    }
    return { item, key, part, index };
  });

  return decorated
    .sort((a, b) => {
      const groupA = firstSeen.get(a.key) ?? a.index;
      const groupB = firstSeen.get(b.key) ?? b.index;
      if (groupA !== groupB) return groupA - groupB;
      if (a.part !== b.part) return a.part - b.part;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

/**
 * How many quizzes a series needs before it is worth collapsing. A pair of
 * parts reads fine as two cards; twenty does not.
 */
export const MIN_SERIES_SIZE = 4;

export type SeriesEntry<T> =
  | { kind: 'quiz'; key: string; quiz: T }
  | { kind: 'series'; key: string; label: string; quizzes: T[] };

/**
 * Fold an ordered quiz list into entries, where a long run of same-series
 * quizzes becomes one collapsible entry. Order is preserved: a series lands
 * where its first member sat, and shorter series stay as ordinary cards.
 */
export function buildSeriesEntries<T extends { title: string }>(
  items: T[],
  keyOf: (item: T) => string,
): SeriesEntry<T>[] {
  const bySeries = new Map<string, T[]>();
  for (const item of items) {
    const { key } = readSeries(item.title);
    const bucket = bySeries.get(key);
    if (bucket) bucket.push(item);
    else bySeries.set(key, [item]);
  }

  const emitted = new Set<string>();
  const entries: SeriesEntry<T>[] = [];

  for (const item of items) {
    const { key, label } = readSeries(item.title);
    const members = bySeries.get(key) ?? [item];

    if (members.length < MIN_SERIES_SIZE) {
      entries.push({ kind: 'quiz', key: keyOf(item), quiz: item });
      continue;
    }

    if (emitted.has(key)) continue;
    emitted.add(key);
    entries.push({ kind: 'series', key: `series:${key}`, label, quizzes: members });
  }

  return entries;
}

/** Total quizzes represented by a list of entries. */
export function countEntryQuizzes<T>(entries: SeriesEntry<T>[]): number {
  return entries.reduce(
    (total, entry) => total + (entry.kind === 'series' ? entry.quizzes.length : 1),
    0,
  );
}
