export interface ParsedReference {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
}

export const DUTCH_ABBREVIATIONS: Record<string, string> = {
  // Oude Testament
  'Gen.': 'Genesis', 'Gen': 'Genesis',
  'Ex.': 'Exodus', 'Ex': 'Exodus',
  'Lev.': 'Leviticus', 'Lev': 'Leviticus',
  'Num.': 'Numeri', 'Num': 'Numeri',
  'Deut.': 'Deuteronomium', 'Deut': 'Deuteronomium',
  'Joz.': 'Jozua', 'Joz': 'Jozua',
  'Richt.': 'Richteren', 'Recht.': 'Richteren',
  'Ruth': 'Ruth',
  '1 Sam.': '1 Samuël', '1 Sam': '1 Samuël',
  '2 Sam.': '2 Samuël', '2 Sam': '2 Samuël',
  '1 Kon.': '1 Koningen', '1 Kon': '1 Koningen',
  '2 Kon.': '2 Koningen', '2 Kon': '2 Koningen',
  '1 Kron.': '1 Kronieken', '1 Kron': '1 Kronieken',
  '2 Kron.': '2 Kronieken', '2 Kron': '2 Kronieken',
  'Ezra': 'Ezra',
  'Neh.': 'Nehemia', 'Neh': 'Nehemia',
  'Est.': 'Esther', 'Est': 'Esther',
  'Job': 'Job',
  'Ps.': 'Psalmen', 'Ps': 'Psalmen', 'Psalm': 'Psalmen',
  'Spr.': 'Spreuken', 'Spr': 'Spreuken',
  'Pred.': 'Prediker', 'Pred': 'Prediker',
  'Hoogl.': 'Hooglied', 'Hoogl': 'Hooglied',
  'Jes.': 'Jesaja', 'Jes': 'Jesaja',
  'Jer.': 'Jeremia', 'Jer': 'Jeremia',
  'Klaagl.': 'Klaagliederen', 'Klaagl': 'Klaagliederen',
  'Ezech.': 'Ezechiël', 'Ezech': 'Ezechiël', 'Ez.': 'Ezechiël',
  'Dan.': 'Daniël', 'Dan': 'Daniël',
  'Hos.': 'Hosea', 'Hos': 'Hosea',
  'Joël': 'Joël', 'Joel': 'Joël',
  'Am.': 'Amos', 'Am': 'Amos',
  'Ob.': 'Obadja', 'Ob': 'Obadja',
  'Jon.': 'Jona', 'Jon': 'Jona',
  'Mi.': 'Micha', 'Mi': 'Micha',
  'Nah.': 'Nahum', 'Nah': 'Nahum',
  'Hab.': 'Habakuk', 'Hab': 'Habakuk',
  'Zef.': 'Zefanja', 'Zef': 'Zefanja',
  'Hag.': 'Haggaï', 'Hag': 'Haggaï',
  'Zach.': 'Zacharia', 'Zach': 'Zacharia',
  'Mal.': 'Maleachi', 'Mal': 'Maleachi',
  // Nieuwe Testament
  'Matt.': 'Matteüs', 'Mat.': 'Matteüs', 'Mt.': 'Matteüs', 'Matt': 'Matteüs',
  'Mark.': 'Marcus', 'Mk.': 'Marcus', 'Mark': 'Marcus',
  'Luk.': 'Lucas', 'Lk.': 'Lucas', 'Luk': 'Lucas',
  'Joh.': 'Johannes', 'Joh': 'Johannes',
  'Hand.': 'Handelingen', 'Hand': 'Handelingen',
  'Rom.': 'Romeinen', 'Rom': 'Romeinen',
  '1 Kor.': '1 Korintiërs', '1 Kor': '1 Korintiërs',
  '2 Kor.': '2 Korintiërs', '2 Kor': '2 Korintiërs',
  'Gal.': 'Galaten', 'Gal': 'Galaten',
  'Ef.': 'Efeziërs', 'Ef': 'Efeziërs',
  'Fil.': 'Filippenzen', 'Fil': 'Filippenzen',
  'Kol.': 'Kolossenzen', 'Kol': 'Kolossenzen',
  '1 Tess.': '1 Tessalonicenzen', '1 Tess': '1 Tessalonicenzen',
  '2 Tess.': '2 Tessalonicenzen', '2 Tess': '2 Tessalonicenzen',
  '1 Tim.': '1 Timotheüs', '1 Tim': '1 Timotheüs',
  '2 Tim.': '2 Timotheüs', '2 Tim': '2 Timotheüs',
  'Tit.': 'Titus', 'Tit': 'Titus',
  'Filem.': 'Filemon', 'Filem': 'Filemon',
  'Hebr.': 'Hebreeën', 'Hebr': 'Hebreeën',
  'Jak.': 'Jakobus', 'Jak': 'Jakobus',
  '1 Petr.': '1 Petrus', '1 Petr': '1 Petrus',
  '2 Petr.': '2 Petrus', '2 Petr': '2 Petrus',
  '1 Joh.': '1 Johannes', '1 Joh': '1 Johannes',
  '2 Joh.': '2 Johannes', '2 Joh': '2 Johannes',
  '3 Joh.': '3 Johannes', '3 Joh': '3 Johannes',
  'Jud.': 'Judas', 'Jud': 'Judas',
  'Openb.': 'Openbaring', 'Openb': 'Openbaring', 'Op.': 'Openbaring',
};

function expandAbbreviation(raw: string): string {
  const trimmed = raw.trim();
  // Try longest match first to handle "1 Sam." before "Sam."
  const sorted = Object.keys(DUTCH_ABBREVIATIONS).sort((a, b) => b.length - a.length);
  for (const abbr of sorted) {
    if (trimmed.toLowerCase() === abbr.toLowerCase()) {
      return DUTCH_ABBREVIATIONS[abbr];
    }
  }
  return trimmed;
}

export function parseBibleReference(ref: string): ParsedReference | null {
  if (!ref || !ref.trim()) return null;

  // Handle semicolon/comma separated multiple refs: return first one
  const firstRef = ref.split(/[;,]/).at(0)?.trim();
  if (!firstRef) return null;

  // Match: optional number prefix + book name + chapter:verse(-endVerse)
  // Examples: "Genesis 1:1", "1 Samuël 17:50", "Dan. 12:13", "Genesis 6:13-14"
  const match = firstRef.match(
    /^(\d+\s+)?([A-Za-zÀ-ÿ]+\.?(?:\s[A-Za-zÀ-ÿ]+\.?)*)\s+(\d+):(\d+)(?:-(\d+))?$/
  );

  if (!match) return null;

  const prefix = match[1]?.trim() ?? '';           // "1", "2", etc.
  const bookRaw = (prefix ? `${prefix} ` : '') + match[2].trim();
  const chapter = parseInt(match[3], 10);
  const verse = parseInt(match[4], 10);
  const endVerse = match[5] ? parseInt(match[5], 10) : undefined;

  if (isNaN(chapter) || isNaN(verse)) return null;

  const book = expandAbbreviation(bookRaw);

  return { book, chapter, verse, endVerse };
}

export function formatReferenceDisplay(ref: ParsedReference): string {
  const range = ref.endVerse ? `-${ref.endVerse}` : '';
  return `${ref.book} ${ref.chapter}:${ref.verse}${range}`;
}
