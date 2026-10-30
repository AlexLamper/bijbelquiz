/**
 * Covers for the Nehemia series, one scene per quiz. Each quiz covers one
 * chapter: `nehemia-bijbelquiz-deel-<n>` is chapter n (1-13).
 *
 * Base hue 80, drifting two degrees per chapter (chapter 13 lands on 104).
 * See `quiz-cover-scene-kit.mts` for the house style; the walls, gatehouses,
 * pulpit and booths come from `quiz-cover-motifs-kron2-ezra-brieven.mts`.
 *
 * Chapters: Nehemia hoort van de verbrande poorten en bidt in Susan (1); de
 * nachtelijke rit langs de afgebroken muur (2); ieder bouwt zijn stuk, de
 * Schaapspoort krijgt haar deuren (3); met de ene hand werken, met de andere
 * het wapen, de bazuin bij Nehemia (4); woeker en schulden, het geld terug
 * (5); "ik doe een groot werk, ik kan niet afkomen" - de open brief van
 * Sanballat (6); wachters in de poorten, het geslachtsregister (7); Ezra leest
 * de wet voor op de houten preekstoel, loofhutten (8); de belijdenis, "des
 * nachts door een vuurkolom" (9); het verzegelde verbond (10); een op de tien
 * woont in Jeruzalem, de heilige stad (11); de inwijding van de muur, twee
 * lofkoren op de muur (12); de poorten dicht voor de sabbat, de kooplieden
 * buiten (13).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { basket, columns, crowd, donkey, flame, person, rect, tent, vineRow, path } from './quiz-cover-primitives.mjs';
import { at, city, openBook } from './cover-options/shapes.mjs';
import {
  booth,
  fig,
  figWith,
  fireColumn,
  flipX,
  gatehouse,
  lyrePlayer,
  moneyBag,
  oilLamp,
  openScroll,
  pulpit,
  seals,
  shield,
  spear,
  sword,
  trumpeter,
  wallRun,
  wallTone,
} from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

export const NEHEMIA_SCENES: Record<string, Scene> = {
  // 1: in Susan the palace Nehemia hears that the wall of Jerusalem is broken down; he sits down, weeps and prays
  'nehemia-bijbelquiz-deel-1': {
    hue: 80,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 300, sunR: 58, far: 'dunes', ground: 'flat', horizon: 500 }),
      columns(290, 500, 1.45, wallTone(c, 0.3), 3),
      rect(800, 290, 310, 210, wallTone(c, 0.2)),
      rect(890, 330, 130, 116, c.p.glow),
      rect(878, 322, 154, 12, wallTone(c, 0.4)),
      rect(952, 330, 6, 116, wallTone(c, 0.4)),
      person(470, 518, 1.12, c.p.near, 'point'),
      fig(680, 524, 1.45, c.p.fore, 'kneel'),
      c.soft(840, 480, 90, 0.55),
      oilLamp(820, 524, 0.95, c.p.near, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 2: Nehemia goes out by night on his beast and views the walls of Jerusalem, broken down, the gates consumed with fire
  'nehemia-bijbelquiz-deel-2': {
    hue: 82,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1190, sunY: 200, sunR: 42, far: 'ridge', horizon: 476 }),
      wallRun(150, 1330, 476, 104, wallTone(c, 0.3), { gaps: [[330, 470], [820, 930], [1110, 1190]], courses: c.p.light }),
      c.soft(720, 360, 130, 0.5),
      flipX(660, donkey(660, 552, 1.15, c.p.fore)),
      person(674, 494, 0.86, c.p.fore, 'sit'),
      rect(716, 384, 6, 100, c.p.near),
      flame(719, 392, 0.62, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 3: every family repairs the wall over against its own house; the priests build the Sheep Gate and set up its doors
  'nehemia-bijbelquiz-deel-3': {
    hue: 84,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      wallRun(150, 590, 500, 112, wallTone(c, 0.3), { courses: c.p.light }),
      wallRun(820, 1330, 500, 112, wallTone(c, 0.3), { gaps: [[1030, 1150]], courses: c.p.light }),
      gatehouse(704, 500, 1.1, wallTone(c, 0.38), { doors: c.p.accent, open: true, inside: c.p.glow }),
      person(340, 374, 0.85, c.p.fore, 'raise'),
      person(470, 374, 0.8, c.p.near, 'carry'),
      fig(1070, 518, 1.15, c.p.fore, 'kneelPlant'),
      person(1210, 518, 1.15, c.p.fore, 'carry'),
      rect(1182, 330, 56, 34, wallTone(c, 0.5), { rx: 3 }),
      fg(c, 686, 14),
    ],
  },

  // 4: the builders work with one hand and hold a weapon with the other, every one his sword girded; the trumpeter by Nehemia
  'nehemia-bijbelquiz-deel-4': {
    hue: 86,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 486 }),
      wallRun(100, 1330, 530, 106, wallTone(c, 0.3), { courses: c.p.light }),
      figWith(
        470,
        424,
        1.05,
        c.p.fore,
        'reach',
        `<rect x="64" y="-134" width="46" height="32" rx="3" fill="${wallTone(c, 0.52)}"/>` + sword(-34, -100, 0.62, c.p.near, { rot: 188 }),
      ),
      trumpeter(720, 424, 1.1, c.p.fore, c.p.accent),
      spear(980, 568, 1.05, c.p.fore),
      person(996, 568, 1.3, c.p.fore, 'stand'),
      shield(958, 556, 0.85, c.p.near, c.p.mid),
      fg(c, 694, 10),
    ],
  },

  // 5: the poor cry out over usury and mortgaged fields; Nehemia makes the nobles restore the money, the fields and the vineyards
  'nehemia-bijbelquiz-deel-5': {
    hue: 88,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'ridge', horizon: 480 }),
      vineRow(c.rand, 770, 488, 0.85, c.p.mid, 7),
      person(320, 520, 1.35, c.p.fore, 'raise'),
      fig(610, 520, 1.2, c.p.fore, 'reach'),
      moneyBag(706, 466, 1.0, c.p.accent),
      fig(830, 520, 1.15, c.p.near, 'reach', { flip: true }),
      person(920, 522, 0.72, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 6: Sanballat sends his servant with an open letter - "I am doing a great work, so that I cannot come down"
  'nehemia-bijbelquiz-deel-6': {
    hue: 90,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      wallRun(600, 1330, 512, 108, wallTone(c, 0.3), { courses: c.p.light }),
      gatehouse(1100, 512, 1.0, wallTone(c, 0.38), { doors: wallTone(c, 0.52), seam: wallTone(c, 0.62) }),
      fig(800, 404, 1.15, c.p.fore, 'bless', { flip: true }),
      figWith(450, 524, 1.32, c.p.fore, 'reach', openScroll(94, -100, 0.42, c.p.accent, c.p.accentDeep, c.p.accentDeep)),
      person(320, 520, 1.12, c.p.near, 'stand'),
      person(220, 524, 1.02, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 7: porters and watches in the gates - "let not the gates be opened until the sun be hot"; the register of the genealogy
  'nehemia-bijbelquiz-deel-7': {
    hue: 92,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 160, sunR: 60, far: 'ridge', ground: 'flat', horizon: 500 }),
      wallRun(820, 1330, 500, 112, wallTone(c, 0.3), { courses: c.p.light }),
      gatehouse(1040, 500, 1.02, wallTone(c, 0.38), { doors: wallTone(c, 0.52), seam: wallTone(c, 0.62) }),
      spear(890, 518, 0.95, c.p.fore),
      person(906, 518, 1.12, c.p.fore, 'stand'),
      spear(1186, 518, 0.95, c.p.fore),
      person(1202, 518, 1.12, c.p.fore, 'stand'),
      fig(560, 488, 1.05, c.p.fore, 'sit'),
      rect(450, 474, 220, 12, wallTone(c, 0.5), { rx: 3 }),
      rect(466, 486, 12, 32, wallTone(c, 0.5)),
      rect(642, 486, 12, 32, wallTone(c, 0.5)),
      at(560, 470, 0.42, openBook(c.p.accentDeep, c.p.accent, c.p.accentDeep)),
      person(330, 520, 1.15, c.p.near, 'stand'),
      person(250, 524, 0.78, c.p.near, 'stand'),
      person(180, 520, 1.05, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 8: Ezra the scribe stands on a pulpit of wood and reads the law; the people stand up and answer "Amen"; then they dwell in booths
  'nehemia-bijbelquiz-deel-8': {
    hue: 94,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 250, rays: true, far: 'ridge', ground: 'flat', horizon: 500 }),
      booth(1140, 508, 0.95, c.p.near, c.p.mid),
      booth(1290, 500, 0.7, c.p.near, c.p.mid, { opacity: 0.85 }),
      pulpit(520, 518, 1.05, c.p.near),
      figWith(520, 390, 1.0, c.p.fore, 'carry', openScroll(0, -80, 0.46, c.p.accent, c.p.accentDeep, c.p.accentDeep)),
      crowd(c.rand, 860, 522, 1.0, c.p.near, 5, 240),
      person(760, 548, 1.2, c.p.fore, 'raise'),
      fig(950, 556, 1.2, c.p.fore, 'bowed'),
      fg(c, 686, 14),
    ],
  },

  // 9: the people confess in sackcloth; the Levites recall how God led them "in the night by a pillar of fire"
  'nehemia-bijbelquiz-deel-9': {
    hue: 96,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 54, far: 'dunes', ground: 'flat', horizon: 500 }),
      c.soft(990, 330, 280, 0.55),
      tent(1220, 506, 0.85, c.p.near),
      fireColumn(990, 508, 300, 112, c.p.accent, c.p.crop),
      fig(290, 526, 1.25, c.p.fore, 'kneel'),
      fig(430, 530, 1.2, c.p.near, 'kneelUp'),
      fig(570, 528, 1.25, c.p.fore, 'bowed'),
      fig(710, 532, 1.1, c.p.near, 'kneel'),
      fg(c, 686, 14),
    ],
  },

  // 10: the princes, Levites and priests seal the covenant - the sealed writing, and the people's oath to walk in God's law
  'nehemia-bijbelquiz-deel-10': {
    hue: 98,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, far: 'none', ground: 'flat', horizon: 500 }),
      rect(500, 436, 400, 16, wallTone(c, 0.48), { rx: 3 }),
      rect(520, 452, 36, 66, wallTone(c, 0.48)),
      rect(844, 452, 36, 66, wallTone(c, 0.48)),
      openScroll(700, 438, 0.95, c.p.light, wallTone(c, 0.55), wallTone(c, 0.6)),
      seals(700, 452, 1.15, c.p.accentDeep, c.p.accent, 5),
      fig(420, 520, 1.25, c.p.fore, 'reach'),
      person(1010, 520, 1.2, c.p.fore, 'stand'),
      person(1110, 522, 1.1, c.p.near, 'stand'),
      person(1200, 520, 1.0, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 11: the rulers dwell at Jerusalem and the rest cast lots, one of ten to dwell in the holy city
  'nehemia-bijbelquiz-deel-11': {
    hue: 100,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 240, far: 'ridge', horizon: 480 }),
      at(704, 450, 1.1, city(c.rand, 190, wallTone(c, 0.34), c.p.accent)),
      path('M 220 506 C 380 410 560 382 704 380 C 860 382 1030 410 1190 506 Z', c.p.mid),
      fig(1010, 518, 1.2, c.p.fore, 'carry', { flip: true }),
      basket(1010, 380, 0.62, c.p.near),
      fig(1120, 522, 0.8, c.p.near, 'walk', { flip: true }),
      fig(1210, 518, 1.05, c.p.near, 'walk', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 12: at the dedication of the wall two great companies of thanksgiving go up on the wall with cymbals, psalteries and harps
  'nehemia-bijbelquiz-deel-12': {
    hue: 102,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 210, rays: true, far: 'dunes', horizon: 500 }),
      wallRun(100, 1330, 532, 112, wallTone(c, 0.3), { merlon: 0, courses: c.p.light }),
      rect(100, 412, 1230, 10, wallTone(c, 0.38)),
      fig(704, 420, 1.05, c.p.fore, 'raise'),
      lyrePlayer(580, 420, 0.95, c.p.fore, c.p.accent, { flip: true }),
      trumpeter(460, 420, 0.92, c.p.fore, c.p.accent, { flip: true }),
      fig(345, 420, 0.85, c.p.near, 'walk', { flip: true }),
      lyrePlayer(830, 420, 0.95, c.p.fore, c.p.accent),
      trumpeter(950, 420, 0.92, c.p.fore, c.p.accent),
      fig(1065, 420, 0.85, c.p.near, 'walk'),
      fg(c, 690, 12),
    ],
  },

  // 13: when the gates grow dark before the sabbath Nehemia has them shut; the merchants lodge outside the wall
  'nehemia-bijbelquiz-deel-13': {
    hue: 104,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 290, sunR: 56, far: 'ridge', ground: 'flat', horizon: 500 }),
      wallRun(150, 1330, 500, 120, wallTone(c, 0.32), { courses: c.p.light }),
      gatehouse(860, 500, 1.18, wallTone(c, 0.4), { doors: c.p.accent, seam: c.p.accentDeep }),
      fig(1110, 380, 0.9, c.p.fore, 'reach', { flip: true }),
      donkey(560, 566, 1.05, c.p.near),
      rect(530, 482, 70, 28, c.p.mid, { rx: 8 }),
      person(410, 566, 1.2, c.p.fore, 'stand'),
      basket(680, 572, 0.8, c.p.near),
      fg(c, 696, 10),
    ],
  },
};
