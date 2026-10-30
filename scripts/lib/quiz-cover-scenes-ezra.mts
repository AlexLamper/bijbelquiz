/**
 * Covers for the Ezra series, one scene per quiz. Each quiz covers one
 * chapter: `ezra-bijbelquiz-deel-<n>` is chapter n (1-10).
 *
 * Base hue 60, drifting two degrees per chapter (chapter 10 lands on 78). See
 * `quiz-cover-scene-kit.mts` for the house style; temple, altar, trumpets and
 * scrolls come from `quiz-cover-motifs-kron2-ezra-brieven.mts`.
 *
 * Chapters: het decreet van Kores, de ballingen trekken op met de gouden vaten
 * (1); de lijst van wie terugkeerden, de karavaan door de woestijn (2); het
 * altaar en de grondlegging, priesters met trompetten, ouden die wenen (3);
 * de tegenstanders schrijven aan de koning, het werk ligt stil (4); Haggai en
 * Zacharia, de bouw gaat verder onder het oog van Thathnai (5); de tempel
 * voltooid en ingewijd (6); Arthahsasta geeft Ezra de brief (7); vasten aan
 * de rivier Ahava, de gewogen schatten (8); Ezra knielt bij het avondoffer
 * (9); de vergadering in de stromende regen (10).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  basket,
  columns,
  crowd,
  crown,
  donkey,
  goblet,
  horse,
  path,
  person,
  rect,
  smokeColumn,
  streaks,
  tent,
  throne,
  trail,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import {
  blaze,
  camel,
  fig,
  figWith,
  flipX,
  hornedAltar,
  letterRoll,
  openScroll,
  sanctuary,
  stoneAltar,
  trumpeter,
  wallRun,
  wallTone,
} from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

/** A long list unrolled from the hand down to the ground, in a figure's local units (hand of `reach` at 80, -103). */
function longList(paper: string, roll: string): string {
  let lines = '';
  for (let y = -96; y < -14; y += 12) lines += `<rect x="72" y="${y}" width="${36 - ((y / 12) % 2 ? 10 : 0)}" height="3" fill="${roll}" opacity="0.45"/>`;
  return (
    `<rect x="62" y="-112" width="56" height="112" fill="${paper}"/>` +
    `<rect x="56" y="-120" width="68" height="14" rx="7" fill="${roll}"/>` +
    `<rect x="56" y="-8" width="68" height="14" rx="7" fill="${roll}"/>` +
    lines
  );
}

/** The temple vessels: a wide bowl and a goblet held at the chest, in local units of `carry` (hands at 0, -104). */
function vessels(fill: string, deep: string): string {
  return (
    `<path d="M -52 -122 L 52 -122 C 48 -96 26 -84 0 -84 C -26 -84 -48 -96 -52 -122 Z" fill="${fill}"/>` +
    `<rect x="-56" y="-128" width="112" height="9" rx="4" fill="${fill}"/>` +
    `<rect x="-52" y="-112" width="104" height="4" fill="${deep}" opacity="0.5"/>` +
    goblet(26, -126, 0.95, fill)
  );
}

export const EZRA_SCENES: Record<string, Scene> = {
  // 1: Kores proclaims the house of the LORD must be built; the exiles go up from Babylon with the vessels of gold and silver
  'ezra-bijbelquiz-deel-1': {
    hue: 60,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, sunR: 70, rays: true, far: 'dunes', horizon: 480 }),
      ziggurat(290, 486, 1.25, wallTone(c, 0.34)),
      trail(300, H, 1100, 480, 120, '#FFFFFF', { opacity: 0.3 }),
      fig(470, 506, 0.95, c.p.near, 'walk'),
      flipX(640, donkey(640, 510, 1.0, c.p.near)),
      rect(610, 442, 64, 26, c.p.mid, { rx: 8 }),
      fig(780, 512, 1.05, c.p.near, 'walk'),
      figWith(960, 520, 1.4, c.p.fore, 'carry', vessels(c.p.accent, c.p.accentDeep)),
      fg(c, 686, 14),
    ],
  },

  // 2: the number of the men of the people of Israel who came up out of the captivity - their horses, mules, camels and asses
  'ezra-bijbelquiz-deel-2': {
    hue: 62,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 240, far: 'dunes', horizon: 470 }),
      fig(560, 482, 0.72, c.p.near, 'walk', { opacity: 0.85 }),
      camel(690, 480, 0.78, c.p.near, { flip: true }),
      fig(800, 480, 0.7, c.p.near, 'walk', { opacity: 0.85 }),
      camel(920, 476, 0.7, c.p.near, { flip: true, opacity: 0.85 }),
      flipX(1060, donkey(1060, 478, 0.7, c.p.near, { opacity: 0.85 })),
      fig(1160, 474, 0.62, c.p.near, 'walk', { opacity: 0.8 }),
      fig(1240, 472, 0.58, c.p.near, 'walk', { opacity: 0.75 }),
      figWith(330, 524, 1.45, c.p.fore, 'reach', longList(c.p.accent, c.p.accentDeep)),
      fg(c, 686, 14),
    ],
  },

  // 3: they set the altar on its bases and lay the foundation of the temple; the priests with trumpets, the old men weep, the young shout for joy
  'ezra-bijbelquiz-deel-3': {
    hue: 64,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, far: 'ridge', ground: 'flat', horizon: 500 }),
      rect(700, 478, 520, 30, wallTone(c, 0.36)),
      rect(730, 462, 440, 18, wallTone(c, 0.42)),
      smokeColumn(c.rand, 560, 380, 0.9, c.p.mid),
      stoneAltar(560, 514, 1.05, wallTone(c, 0.45), c.p.light),
      trumpeter(820, 464, 1.15, c.p.fore, c.p.accent),
      trumpeter(960, 464, 1.08, c.p.fore, c.p.accent),
      trumpeter(1090, 466, 1.0, c.p.near, c.p.accent),
      fig(310, 524, 1.25, c.p.fore, 'bowed'),
      person(420, 518, 1.15, c.p.near, 'raise'),
      fg(c, 686, 14),
    ],
  },

  // 4: the adversaries write an accusation to Arthahsasta; the work of the house of God ceases
  'ezra-bijbelquiz-deel-4': {
    hue: 66,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 480 }),
      wallRun(220, 720, 506, 96, wallTone(c, 0.3), { gaps: [[420, 500]], merlon: 0, courses: c.p.light }),
      rect(250, 380, 8, 126, wallTone(c, 0.5)),
      rect(690, 380, 8, 126, wallTone(c, 0.5)),
      rect(244, 380, 460, 8, wallTone(c, 0.5)),
      basket(470, 530, 0.7, c.p.near),
      flipX(960, horse(960, 520, 1.1, c.p.near)),
      person(950, 456, 0.82, c.p.fore, 'sit'),
      letterRoll(1010, 376, 1.2, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 5: Haggai and Zacharia prophesy, the builders rise up again; Thathnai the governor comes to see who gave them leave
  'ezra-bijbelquiz-deel-5': {
    hue: 68,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 280, far: 'dunes', ground: 'flat', horizon: 500 }),
      wallRun(380, 900, 504, 120, wallTone(c, 0.3), { merlon: 0, courses: c.p.light }),
      rect(420, 362, 120, 24, wallTone(c, 0.3)),
      rect(760, 368, 100, 18, wallTone(c, 0.3)),
      person(600, 386, 0.88, c.p.fore, 'carry'),
      rect(578, 252, 44, 30, c.p.accent, { rx: 3 }),
      person(780, 518, 1.2, c.p.fore, 'carry'),
      rect(748, 330, 64, 40, c.p.accent, { rx: 3 }),
      fig(270, 520, 1.3, c.p.fore, 'bless'),
      horse(1120, 518, 1.0, c.p.near),
      person(1140, 462, 0.75, c.p.near, 'sit'),
      fg(c, 686, 14),
    ],
  },

  // 6: the house is finished by the decree of Darius, and the children of Israel keep the dedication with joy
  'ezra-bijbelquiz-deel-6': {
    hue: 70,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, rays: true, far: 'none', ground: 'flat', horizon: 500 }),
      sanctuary(620, 500, 1.15, wallTone(c, 0.24), '#FFFFFF'),
      c.soft(620, 430, 160, 0.55, '#FFFFFF'),
      path('M 590 500 L 590 380 L 562 388 L 562 506 Z', c.p.accent),
      path('M 650 500 L 650 380 L 678 388 L 678 506 Z', c.p.accent),
      crowd(c.rand, 300, 524, 0.95, c.p.near, 4, 200),
      person(900, 524, 1.25, c.p.fore, 'raise'),
      person(1010, 520, 1.12, c.p.near, 'raise'),
      person(1110, 524, 1.02, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 7: Ezra the scribe, ready in the law of Moses, comes up from Babylon with the letter king Arthahsasta gave him
  'ezra-bijbelquiz-deel-7': {
    hue: 72,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 200, far: 'none', ground: 'flat', horizon: 500 }),
      columns(230, 500, 1.4, wallTone(c, 0.3), 2),
      columns(1190, 500, 1.4, wallTone(c, 0.3), 2),
      rect(780, 488, 240, 14, wallTone(c, 0.42)),
      rect(800, 474, 200, 14, wallTone(c, 0.42)),
      throne(900, 474, 1.15, wallTone(c, 0.5)),
      fig(900, 414, 1.0, c.p.fore, 'sit'),
      crown(900, 317, 0.22, c.p.crop),
      letterRoll(760, 410, 1.3, c.p.accent),
      fig(560, 520, 1.4, c.p.fore, 'kneelFwd'),
      fg(c, 686, 14),
    ],
  },

  // 8: Ezra proclaims a fast by the river Ahava; the silver, gold and vessels are weighed into the hands of the priests
  'ezra-bijbelquiz-deel-8': {
    hue: 74,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 270, sunR: 66, far: 'dunes', ground: 'water', horizon: 430 }),
      path(`M -20 522 C 300 500 700 506 1000 518 C 1150 524 1300 518 ${W + 20} 512 L ${W + 20} ${H} L -20 ${H} Z`, c.p.mid),
      tent(1130, 524, 0.95, c.p.near),
      tent(1250, 518, 0.72, c.p.near, { opacity: 0.85 }),
      fig(300, 540, 1.3, c.p.fore, 'kneel'),
      fig(430, 536, 1.12, c.p.near, 'kneel'),
      goblet(620, 544, 1.5, c.p.accent),
      goblet(690, 548, 1.15, c.p.accent),
      rect(560, 540, 160, 10, c.p.accentDeep, { rx: 4 }),
      fig(900, 544, 1.25, c.p.fore, 'kneel', { flip: true }),
      fg(c, 704, 10),
    ],
  },

  // 9: at the evening sacrifice Ezra rises from his heaviness, falls on his knees and spreads out his hands to the LORD
  'ezra-bijbelquiz-deel-9': {
    hue: 76,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 220, sunY: 320, sunR: 60, far: 'ridge', ground: 'flat', horizon: 500 }),
      sanctuary(1070, 500, 0.85, wallTone(c, 0.24), c.p.glow),
      smokeColumn(c.rand, 830, 350, 0.75, c.p.mid),
      hornedAltar(830, 504, 0.72, c.p.near, c.p.fore),
      blaze(830, 432, 0.65, c.p.accent, c.p.crop),
      crowd(c.rand, 360, 518, 0.85, c.p.near, 4, 170),
      fig(590, 526, 1.5, c.p.fore, 'kneelUp'),
      fg(c, 686, 14),
    ],
  },

  // 10: all the men gather at Jerusalem and sit in the street of the house of God, trembling because of the great rain
  'ezra-bijbelquiz-deel-10': {
    hue: 78,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'none', ground: 'flat', horizon: 500 }),
      sanctuary(1130, 500, 0.8, wallTone(c, 0.24)),
      rect(560, 472, 160, 30, wallTone(c, 0.42)),
      figWith(640, 474, 1.2, c.p.fore, 'carry', openScroll(0, -78, 0.44, c.p.accent, c.p.accentDeep, c.p.accentDeep)),
      fig(300, 524, 0.9, c.p.near, 'sit'),
      fig(400, 520, 0.85, c.p.near, 'sit'),
      fig(830, 520, 0.85, c.p.near, 'sit'),
      fig(930, 524, 0.9, c.p.near, 'sit'),
      fig(350, 556, 1.05, c.p.fore, 'sit'),
      fig(470, 552, 1.0, c.p.fore, 'sit'),
      fig(800, 556, 1.05, c.p.fore, 'sit'),
      fig(920, 552, 1.0, c.p.fore, 'sit'),
      streaks(c.rand, 100, 100, W - 200, 470, c.p.light, 90, { opacity: 0.4 }),
      fg(c, 690, 12),
    ],
  },
};
