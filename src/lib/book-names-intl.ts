/**
 * Book names for the non-English intl sites, in canonical order (the same order
 * as EN_CODES in bible-books.ts). Titles follow the public-domain Bible each
 * language ships with (Reina-Valera 1909, Almeida, Luther 1912, Louis Segond
 * 1910); `short` is the usual abbreviation of that tradition.
 */
export type IntlNameLocale = 'es' | 'pt' | 'de' | 'fr';

export interface IntlBookTable {
  titles: string[];
  shorts: string[];
  groups: Record<string, string>;
  genres: Record<string, string>;
}

const groupKeys = ['wet', 'geschiedenis', 'poezie', 'grote-profeten', 'kleine-profeten', 'evangelien', 'handelingen', 'brieven-paulus', 'algemene-brieven', 'openbaring'];
const genreKeys = ['wet', 'geschiedenis', 'poezie-wijsheid', 'grote-profeten', 'kleine-profeten', 'evangelien-handelingen', 'brieven-van-paulus', 'brieven-openbaring'];
const zip = (keys: string[], values: string[]): Record<string, string> => Object.fromEntries(keys.map((k, i) => [k, values[i]]));

export const INTL_BOOK_TABLES: Record<IntlNameLocale, IntlBookTable> = {
  es: {
    titles: [
      'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
      'Eclesiastés', 'Cantar de los Cantares', 'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
      'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios', 'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón',
      'Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis',
    ],
    shorts: [
      'Gn', 'Éx', 'Lv', 'Nm', 'Dt', 'Jos', 'Jue', 'Rt', '1 S', '2 S', '1 R', '2 R', '1 Cr', '2 Cr', 'Esd', 'Neh', 'Est', 'Job', 'Sal', 'Pr',
      'Ec', 'Cnt', 'Is', 'Jer', 'Lm', 'Ez', 'Dn', 'Os', 'Jl', 'Am', 'Abd', 'Jon', 'Miq', 'Nah', 'Hab', 'Sof', 'Hag', 'Zac', 'Mal',
      'Mt', 'Mr', 'Lc', 'Jn', 'Hch', 'Ro', '1 Co', '2 Co', 'Gá', 'Ef', 'Fil', 'Col', '1 Ts', '2 Ts', '1 Ti', '2 Ti', 'Tit', 'Flm',
      'Heb', 'Stg', '1 P', '2 P', '1 Jn', '2 Jn', '3 Jn', 'Jud', 'Ap',
    ],
    groups: zip(groupKeys, ['Ley', 'Historia', 'Poesía y sabiduría', 'Profetas mayores', 'Profetas menores', 'Evangelios', 'Hechos', 'Cartas de Pablo', 'Cartas generales', 'Apocalipsis']),
    genres: zip(genreKeys, ['Ley', 'Historia', 'Poesía y sabiduría', 'Profetas mayores', 'Profetas menores', 'Evangelios y Hechos', 'Cartas de Pablo', 'Cartas y Apocalipsis']),
  },
  pt: {
    titles: [
      'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios',
      'Eclesiastes', 'Cantares de Salomão', 'Isaías', 'Jeremias', 'Lamentações', 'Ezequiel', 'Daniel', 'Oseias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias',
      'Mateus', 'Marcos', 'Lucas', 'João', 'Atos', 'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom',
      'Hebreus', 'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João', 'Judas', 'Apocalipse',
    ],
    shorts: [
      'Gn', 'Êx', 'Lv', 'Nm', 'Dt', 'Js', 'Jz', 'Rt', '1 Sm', '2 Sm', '1 Rs', '2 Rs', '1 Cr', '2 Cr', 'Ed', 'Ne', 'Et', 'Jb', 'Sl', 'Pv',
      'Ec', 'Ct', 'Is', 'Jr', 'Lm', 'Ez', 'Dn', 'Os', 'Jl', 'Am', 'Ob', 'Jn', 'Mq', 'Na', 'Hc', 'Sf', 'Ag', 'Zc', 'Ml',
      'Mt', 'Mc', 'Lc', 'Jo', 'At', 'Rm', '1 Co', '2 Co', 'Gl', 'Ef', 'Fp', 'Cl', '1 Ts', '2 Ts', '1 Tm', '2 Tm', 'Tt', 'Fm',
      'Hb', 'Tg', '1 Pe', '2 Pe', '1 Jo', '2 Jo', '3 Jo', 'Jd', 'Ap',
    ],
    groups: zip(groupKeys, ['Lei', 'História', 'Poesia e sabedoria', 'Profetas maiores', 'Profetas menores', 'Evangelhos', 'Atos', 'Cartas de Paulo', 'Cartas gerais', 'Apocalipse']),
    genres: zip(genreKeys, ['Lei', 'História', 'Poesia e sabedoria', 'Profetas maiores', 'Profetas menores', 'Evangelhos e Atos', 'Cartas de Paulo', 'Cartas e Apocalipse']),
  },
  de: {
    titles: [
      '1. Mose', '2. Mose', '3. Mose', '4. Mose', '5. Mose', 'Josua', 'Richter', 'Rut', '1. Samuel', '2. Samuel', '1. Könige', '2. Könige', '1. Chronik', '2. Chronik', 'Esra', 'Nehemia', 'Ester', 'Hiob', 'Psalmen', 'Sprüche',
      'Prediger', 'Hoheslied', 'Jesaja', 'Jeremia', 'Klagelieder', 'Hesekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadja', 'Jona', 'Micha', 'Nahum', 'Habakuk', 'Zefanja', 'Haggai', 'Sacharja', 'Maleachi',
      'Matthäus', 'Markus', 'Lukas', 'Johannes', 'Apostelgeschichte', 'Römer', '1. Korinther', '2. Korinther', 'Galater', 'Epheser', 'Philipper', 'Kolosser', '1. Thessalonicher', '2. Thessalonicher', '1. Timotheus', '2. Timotheus', 'Titus', 'Philemon',
      'Hebräer', 'Jakobus', '1. Petrus', '2. Petrus', '1. Johannes', '2. Johannes', '3. Johannes', 'Judas', 'Offenbarung',
    ],
    shorts: [
      '1 Mo', '2 Mo', '3 Mo', '4 Mo', '5 Mo', 'Jos', 'Ri', 'Rut', '1 Sam', '2 Sam', '1 Kön', '2 Kön', '1 Chr', '2 Chr', 'Esra', 'Neh', 'Est', 'Hiob', 'Ps', 'Spr',
      'Pred', 'Hld', 'Jes', 'Jer', 'Klgl', 'Hes', 'Dan', 'Hos', 'Joel', 'Am', 'Obd', 'Jona', 'Mi', 'Nah', 'Hab', 'Zef', 'Hag', 'Sach', 'Mal',
      'Mt', 'Mk', 'Lk', 'Joh', 'Apg', 'Röm', '1 Kor', '2 Kor', 'Gal', 'Eph', 'Phil', 'Kol', '1 Thess', '2 Thess', '1 Tim', '2 Tim', 'Tit', 'Phlm',
      'Hebr', 'Jak', '1 Petr', '2 Petr', '1 Joh', '2 Joh', '3 Joh', 'Jud', 'Offb',
    ],
    groups: zip(groupKeys, ['Gesetz', 'Geschichte', 'Poesie und Weisheit', 'Große Propheten', 'Kleine Propheten', 'Evangelien', 'Apostelgeschichte', 'Briefe des Paulus', 'Allgemeine Briefe', 'Offenbarung']),
    genres: zip(genreKeys, ['Gesetz', 'Geschichte', 'Poesie und Weisheit', 'Große Propheten', 'Kleine Propheten', 'Evangelien und Apostelgeschichte', 'Briefe des Paulus', 'Briefe und Offenbarung']),
  },
  fr: {
    titles: [
      'Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome', 'Josué', 'Juges', 'Ruth', '1 Samuel', '2 Samuel', '1 Rois', '2 Rois', '1 Chroniques', '2 Chroniques', 'Esdras', 'Néhémie', 'Esther', 'Job', 'Psaumes', 'Proverbes',
      'Ecclésiaste', 'Cantique des Cantiques', 'Ésaïe', 'Jérémie', 'Lamentations', 'Ézéchiel', 'Daniel', 'Osée', 'Joël', 'Amos', 'Abdias', 'Jonas', 'Michée', 'Nahum', 'Habacuc', 'Sophonie', 'Aggée', 'Zacharie', 'Malachie',
      'Matthieu', 'Marc', 'Luc', 'Jean', 'Actes', 'Romains', '1 Corinthiens', '2 Corinthiens', 'Galates', 'Éphésiens', 'Philippiens', 'Colossiens', '1 Thessaloniciens', '2 Thessaloniciens', '1 Timothée', '2 Timothée', 'Tite', 'Philémon',
      'Hébreux', 'Jacques', '1 Pierre', '2 Pierre', '1 Jean', '2 Jean', '3 Jean', 'Jude', 'Apocalypse',
    ],
    shorts: [
      'Gn', 'Ex', 'Lv', 'Nb', 'Dt', 'Jos', 'Jg', 'Rt', '1 S', '2 S', '1 R', '2 R', '1 Ch', '2 Ch', 'Esd', 'Né', 'Est', 'Job', 'Ps', 'Pr',
      'Ec', 'Ct', 'És', 'Jé', 'Lm', 'Éz', 'Dn', 'Os', 'Jl', 'Am', 'Ab', 'Jon', 'Mi', 'Na', 'Ha', 'So', 'Ag', 'Za', 'Ml',
      'Mt', 'Mc', 'Lc', 'Jn', 'Ac', 'Rm', '1 Co', '2 Co', 'Ga', 'Ép', 'Ph', 'Col', '1 Th', '2 Th', '1 Ti', '2 Ti', 'Tt', 'Phm',
      'Hé', 'Jc', '1 P', '2 P', '1 Jn', '2 Jn', '3 Jn', 'Jud', 'Ap',
    ],
    groups: zip(groupKeys, ['Loi', 'Histoire', 'Poésie et sagesse', 'Grands prophètes', 'Petits prophètes', 'Évangiles', 'Actes', 'Épîtres de Paul', 'Épîtres générales', 'Apocalypse']),
    genres: zip(genreKeys, ['Loi', 'Histoire', 'Poésie et sagesse', 'Grands prophètes', 'Petits prophètes', 'Évangiles et Actes', 'Épîtres de Paul', 'Épîtres et Apocalypse']),
  },
};

/** Canonical codes in the order of the tables above. */
export const INTL_CODES = [
  'GEN', 'EXOD', 'LEV', 'NUM', 'DEUT', 'JOSH', 'JUDG', 'RUTH', '1SAM', '2SAM', '1KGS', '2KGS', '1CHR', '2CHR', 'EZRA', 'NEH', 'ESTH', 'JOB', 'PS', 'PROV',
  'ECCL', 'SONG', 'ISA', 'JER', 'LAM', 'EZEK', 'DAN', 'HOS', 'JOEL', 'AMOS', 'OBAD', 'JONAH', 'MIC', 'NAH', 'HAB', 'ZEPH', 'HAG', 'ZECH', 'MAL',
  'MATT', 'MARK', 'LUKE', 'JOHN', 'ACTS', 'ROM', '1COR', '2COR', 'GAL', 'EPH', 'PHIL', 'COL', '1THESS', '2THESS', '1TIM', '2TIM', 'TITUS', 'PHLM',
  'HEB', 'JAS', '1PET', '2PET', '1JOHN', '2JOHN', '3JOHN', 'JUDE', 'REV',
] as const;

const norm = (name: string): string =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();

/** Normalised es/pt/de/fr titles and abbreviations to canonical code. Used by `toBookCode` as a fallback. */
export const INTL_ALIASES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const table of Object.values(INTL_BOOK_TABLES)) {
    INTL_CODES.forEach((code, i) => {
      for (const name of [table.titles[i], table.shorts[i]]) {
        const key = norm(name);
        // First language wins; a clash across languages is caught by tests/book-names-intl.test.ts.
        if (!(key in out)) out[key] = code;
      }
    });
  }
  return out;
})();
