/**
 * How a quiz is named inside Samen spelen: "Johannes 6 - Brood voor 5000",
 * with a three-letter badge ("Joh") in front of it, as the designs draw the
 * quiz picker and the quiz card in the waiting room.
 *
 * Quiz titles in the database carry no book ("Brood voor 5000"); the chapter
 * comes from the questions (`resolveQuizPassage`). A title that already names
 * its book ("Handelingen 4") is left alone.
 */

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function quizDisplayTitle(title: string, passageLabel: string | null | undefined): string {
  const clean = (title || '').trim();
  if (!passageLabel) return clean;
  const book = passageLabel.replace(/\s+\d+$/, '');
  if (normalize(clean).startsWith(normalize(book))) return clean;
  return `${passageLabel} - ${clean}`;
}

/** "Johannes" -> "Joh", "1 Samuël" -> "1Sa", no book -> first letters of the title. */
export function quizBadge(title: string, passageLabel: string | null | undefined): string {
  const source = passageLabel ? passageLabel.replace(/\s+\d+$/, '') : (title || '').trim();
  const numbered = source.match(/^(\d)\s*(\p{L}+)/u);
  if (numbered) {
    return `${numbered[1]}${numbered[2].slice(0, 2)}`;
  }
  const word = source.match(/\p{L}+/u)?.[0] ?? '';
  if (!word) return '?';
  const letters = Array.from(word).slice(0, 3).join('');
  return letters.charAt(0).toLocaleUpperCase('nl-NL') + letters.slice(1).toLocaleLowerCase('nl-NL');
}

export function questionCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'vraag' : 'vragen'}`;
}

export function pointsLabel(points: number, short = false): string {
  if (short) return `${points} pt`;
  return `${points} ${points === 1 ? 'punt' : 'punten'}`;
}
