/**
 * The six sample quizzes every cover option is rendered for, so the options
 * are compared like with like, and the brand colours they are built from.
 *
 * The slugs are real slugs from `src/lib/quiz-covers.generated.ts`; the
 * subject of each one is the chapter its current scene was drawn for (see the
 * comments in `scripts/lib/quiz-cover-scenes*.mts`).
 */

export type Group = 'wet' | 'poezie' | 'profeten' | 'evangelien' | 'brieven' | 'thema';

export type Sample = {
  slug: string;
  /** Card kicker, as the 2.0 quiz card shows it. */
  reference: string;
  title: string;
  /** Which kind of quiz this sample stands for. */
  kind: string;
  group: Group;
  /** The chapter number as a graphic element (option D); null for themes. */
  chapter: number | null;
  book: string;
};

export const SAMPLES: Sample[] = [
  { slug: 'exodus-bijbelquiz-deel-3', reference: 'Exodus 3', title: 'De brandende braamstruik', kind: 'OT-verhaal', group: 'wet', chapter: 3, book: 'Exodus' },
  { slug: 'johannes-bijbelquiz-deel-6', reference: 'Johannes 6', title: 'Brood voor 5000', kind: 'NT-verhaal', group: 'evangelien', chapter: 6, book: 'Johannes' },
  { slug: 'prediker-bijbelquiz-deel-3', reference: 'Prediker 3', title: 'Alles heeft zijn tijd', kind: 'Poëzie', group: 'poezie', chapter: 3, book: 'Prediker' },
  { slug: 'jesaja-bijbelquiz-deel-2', reference: 'Jesaja 6', title: 'Jesaja ziet de troon', kind: 'Profeet', group: 'profeten', chapter: 6, book: 'Jesaja' },
  { slug: '1-korinthe-bijbelquiz-deel-13', reference: '1 Korinthe 13', title: 'Het grootste is de liefde', kind: 'Brief van Paulus', group: 'brieven', chapter: 13, book: '1 Korinthe' },
  { slug: 'algemene-bijbelkennis', reference: 'Thema', title: 'Algemene bijbelkennis', kind: 'Algemeen / thema', group: 'thema', chapter: null, book: 'Thema' },
];

/** The 2.0 tokens (docs/web-2/HANDOFF.md "Ontwerp-tokens"). */
export const BRAND = {
  bg: '#ECEAE4',
  card: '#FFFFFF',
  line: '#DEDBD3',
  ink: '#1F1D1A',
  lapis: '#35548C',
  lapisDeep: '#263E69',
  lapisTint: '#EAEEF7',
  gold: '#E9B12E',
  coral: '#D9734F',
  coralDeep: '#B4502B',
  green: '#3F6B4F',
};

/** Which Bible book belongs to which group, for when an option scales to every quiz. */
export const GROUP_OF_BOOK: Record<string, Group> = {
  genesis: 'wet', exodus: 'wet', ruth: 'wet', esther: 'wet',
  prediker: 'poezie', hooglied: 'poezie', klaagliederen: 'poezie', spreuken: 'poezie', psalmen: 'poezie',
  jesaja: 'profeten', daniel: 'profeten', jona: 'profeten', habakuk: 'profeten',
  matteus: 'evangelien', marcus: 'evangelien', lucas: 'evangelien', johannes: 'evangelien', handelingen: 'evangelien',
};

export const GROUP_LABEL: Record<Group, string> = {
  wet: 'Wet en geschiedenis',
  poezie: 'Poëzie en wijsheid',
  profeten: 'Profeten',
  evangelien: 'Evangeliën en Handelingen',
  brieven: 'Brieven',
  thema: "Thema's",
};
