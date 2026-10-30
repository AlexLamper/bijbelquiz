/**
 * Covers for the Zacharia series, one scene per quiz. Each quiz covers one
 * chapter: `zacharia-bijbelquiz-deel-<n>` is chapter n (1-14).
 *
 * Base hue 120, drifting two degrees per chapter. See
 * `quiz-cover-scene-kit.mts` for the house style; the extra motifs are in
 * `quiz-cover-motifs-ezechiel-kleine-profeten.mts`. The first six chapters
 * are night visions, so several are drawn in night or dusk light.
 *
 * Chapters: de man op het rode paard tussen de mirten (1); de man met het
 * meetsnoer, Jeruzalem zonder muren met een vurige muur rondom (2); Jozua de
 * hogepriester krijgt een reine hoed en schone klederen (3); de gouden
 * kandelaar en de twee olijfbomen (4); de vliegende rol (5); de vier wagens
 * tussen twee koperen bergen (6); doet waarachtig gericht en barmhartigheid
 * aan weduwe en wees (7); oude mannen en vrouwen op de straten, jongens en
 * meisjes spelend (8); uw Koning komt, rijdende op een ezel (9); de spade
 * regen en de kudde die vergaderd wordt (10); de dertig zilverlingen voor
 * de pottenbakker, de gebroken staven (11); Jeruzalem een drinkschaal der
 * zwijmeling voor de volken rondom (12); de geopende fontein en de verstrooide
 * schapen (13); de Olijfberg gespleten, levend water, de HEERE Koning over
 * de ganse aarde (14).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  W,
  angel,
  citySkyline,
  cityWall,
  cloudBank,
  coin,
  donkey,
  fireBed,
  gateArch,
  goblet,
  grapes,
  horse,
  houseBlock,
  loaf,
  path,
  person,
  rect,
  rotate,
  shafts,
  shrub,
  streaks,
  templeFront,
  tent,
  tree,
  wheat,
  circle,
  crown,
  ellipse,
} from './quiz-cover-primitives.mjs';
import {
  bar,
  bolt,
  chariotTeam,
  crook,
  frond,
  jar,
  lampstand,
  mirror,
  openScroll,
  raw,
  sheepAt,
  staffBearer,
  stroke,
} from './quiz-cover-motifs-ezechiel-kleine-profeten.mjs';

export const ZACHARIA_SCENES: Record<string, Scene> = {
  // 1: the first night vision - a man on a red horse among the myrtle trees in the hollow, red, sorrel and white horses behind him
  'zacharia-bijbelquiz-deel-1': {
    hue: 120,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 250, sunR: 70, far: 'ridge', stars: 18 }),
      horse(1010, G + 30, 0.9, c.p.mid, { opacity: 0.85 }),
      horse(1180, G + 26, 0.8, c.p.light, { opacity: 0.8 }),
      shrub(500, G + 66, 1.5, c.p.near),
      shrub(900, G + 70, 1.3, c.p.near),
      horse(720, G + 70, 1.35, c.p.accent),
      person(746, G - 6, 0.98, c.p.fore, 'sit'),
      shrub(620, G + 82, 1.1, c.p.fore),
      shrub(820, G + 86, 1.0, c.p.fore),
      person(290, G + 76, 1.3, c.p.fore, 'stand'),
      fg(c, 700, 12),
    ],
  },

  // 2: Jerusalem inhabited as towns without walls - "Ik zal haar zijn een vurige muur rondom"; the man with the measuring line
  'zacharia-bijbelquiz-deel-2': {
    hue: 122,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 760, sunY: 300, sunR: 90, far: 'ridge' }),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => fireBed(c.rand, 470 + i * 96, G - 4 - Math.sin((Math.PI * i) / 6) * 24, 0.62, c.p.accent, 5)),
      citySkyline(c.rand, 760, G + 20, 0.85, c.p.near, 7),
      c.soft(760, 380, 180, 0.4),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => fireBed(c.rand, 420 + i * 96, G + 60 + Math.sin((Math.PI * i) / 7) * 18, 0.78, c.p.accent, 5)),
      person(250, G + 76, 1.35, c.p.fore, 'point'),
      bar(326, G - 18, 410, G + 40, 3, c.p.fore),
      fg(c, 700, 12),
    ],
  },

  // 3: Joshua the high priest is stripped of his filthy garments and given a clean mitre - "een brand uit het vuur gerukt"
  'zacharia-bijbelquiz-deel-3': {
    hue: 124,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 480, sunY: 250, sunR: 90, far: 'dunes', ground: 'flat', horizon: 512 }),
      templeFront(1080, 512, 1.2, c.p.mid, 6),
      c.soft(480, 330, 220, 0.5),
      angel(470, 530, 1.35, c.p.light, { opacity: 0.9 }),
      person(720, 536, 1.5, c.p.fore, 'stand'),
      ellipse(720, 340, 24, 15, c.p.accent),
      rect(696, 344, 48, 12, c.p.accent, { rx: 4 }),
      raw('M 840 540 C 846 510 872 500 900 504 C 930 498 960 514 966 540 Z', c.p.near),
      stroke('M 860 530 Q 890 512 930 524', c.p.fore, 4, 0.5),
      fg(c, 692, 14),
    ],
  },

  // 4: the golden lampstand with its bowl and seven lamps, and the two olive trees beside it - "niet door kracht, maar door Mijn Geest"
  'zacharia-bijbelquiz-deel-4': {
    hue: 126,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 530, stars: 44 }),
      c.soft(704, 330, 300, 0.55),
      tree(410, 534, 2.1, c.p.near),
      tree(998, 534, 2.1, c.p.near),
      stroke('M 470 400 Q 600 380 690 300', c.p.accent, 4, 0.8),
      stroke('M 938 400 Q 808 380 718 300', c.p.accent, 4, 0.8),
      lampstand(704, 552, 0.98, c.p.accent, c.p.light, true),
      fg(c, 706, 10),
    ],
  },

  // 5: the flying scroll, twenty cubits long and ten wide, going out over the face of the whole land
  'zacharia-bijbelquiz-deel-5': {
    hue: 128,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 230, far: 'ridge', clouds: 2 }),
      houseBlock(c.rand, 500, G + 40, 0.8, c.p.near),
      houseBlock(c.rand, 1000, G + 36, 0.75, c.p.near),
      houseBlock(c.rand, 1180, G + 44, 0.6, c.p.near, { opacity: 0.85 }),
      streaks(c.rand, 300, 300, 260, 100, c.p.light, 12, { opacity: 0.35 }),
      c.soft(760, 300, 200, 0.4),
      rotate(-8, 760, 400, openScroll(760, 400, 1.15, c.p.accent, c.p.accentDeep, c.p.accentDeep)),
      person(300, G + 72, 1.35, c.p.fore, 'point'),
      fg(c, 698, 14),
    ],
  },

  // 6: four chariots coming out from between two mountains of brass - red, black, white and dappled horses
  'zacharia-bijbelquiz-deel-6': {
    hue: 130,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 300, sunR: 70, rays: true, far: 'none' }),
      raw(`M 160 ${G + 30} L 330 300 L 420 236 L 520 330 L 640 ${G + 30} Z`, c.p.accentDeep),
      raw(`M 768 ${G + 30} L 888 330 L 988 236 L 1078 300 L 1248 ${G + 30} Z`, c.p.accentDeep),
      raw('M 330 300 L 420 236 L 440 300 L 400 380 Z', '#FFFFFF', 0.18),
      raw('M 988 236 L 1078 300 L 1040 360 L 1000 300 Z', '#FFFFFF', 0.18),
      chariotTeam(690, G + 6, 0.62, c.p.mid, { opacity: 0.85 }),
      mirror(760, chariotTeam(760, G + 10, 0.62, c.p.mid, { opacity: 0.85 })),
      chariotTeam(560, G + 70, 0.95, c.p.fore),
      mirror(860, chariotTeam(860, G + 74, 0.95, c.p.fore)),
      fg(c, 700, 12),
    ],
  },

  // 7: "Doet waarachtig gericht, en bewijst weldadigheid" - bread for the widow and the fatherless, not empty fasting
  'zacharia-bijbelquiz-deel-7': {
    hue: 132,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 250, sunR: 64, far: 'dunes' }),
      houseBlock(c.rand, 300, G + 20, 0.9, c.p.mid),
      houseBlock(c.rand, 1130, G + 24, 0.8, c.p.mid),
      person(560, G + 70, 1.5, c.p.fore, 'point'),
      loaf(660, 432, 1.15, c.p.accent),
      mirror(800, person(800, G + 72, 1.4, c.p.fore, 'point')),
      person(910, G + 76, 0.8, c.p.fore, 'stand'),
      fg(c, 700, 12),
    ],
  },

  // 8: "Er zullen nog oude mannen en oude vrouwen zitten op de straten van Jeruzalem ... en jongens en meisjes spelende"
  'zacharia-bijbelquiz-deel-8': {
    hue: 134,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, sunR: 64, far: 'ridge' }),
      citySkyline(c.rand, 704, G - 2, 0.7, c.p.far, 11, { opacity: 0.6 }),
      houseBlock(c.rand, 260, G + 40, 1.0, c.p.mid),
      grapes(316, 410, 0.95, c.p.accent),
      person(430, G + 74, 1.3, c.p.fore, 'sit'),
      bar(470, G + 74, 490, G - 64, 6, c.p.fore),
      person(1060, G + 74, 1.25, c.p.fore, 'sit'),
      bar(1018, G + 74, 1000, G - 60, 6, c.p.fore),
      person(640, G + 80, 0.82, c.p.fore, 'raise'),
      person(740, G + 76, 0.78, c.p.fore, 'walk'),
      person(840, G + 82, 0.74, c.p.fore, 'raise'),
      fg(c, 702, 12),
    ],
  },

  // 9: "Zie, uw Koning zal u komen ... arm, en rijdende op een ezel" - welcomed at the gate with branches
  'zacharia-bijbelquiz-deel-9': {
    hue: 136,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 260, sunR: 66, rays: true, far: 'ridge' }),
      cityWall(1100, G + 30, 1.0, c.p.mid, 420),
      gateArch(1100, G + 30, 1.0, c.p.near),
      donkey(640, G + 72, 1.3, c.p.near),
      person(660, G + 72 - 66, 1.0, c.p.fore, 'sit'),
      person(900, G + 74, 1.25, c.p.fore, 'raise'),
      frond(944, 338, 1.0, c.p.accent, 20),
      person(1010, G + 80, 1.1, c.p.fore, 'stand'),
      frond(1050, 420, 0.9, c.p.accent, -24),
      fg(c, 702, 12),
    ],
  },

  // 10: "Begeert van den HEERE regen ten tijde van den spaden regen" - the LORD makes the lightnings, and whistles His flock together
  'zacharia-bijbelquiz-deel-10': {
    hue: 138,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 230, far: 'ridge' }),
      cloudBank(c.rand, 980, 210, 1.5, c.p.fore, { opacity: 0.35 }),
      streaks(c.rand, 820, 230, 360, 240, c.p.light, 40, { opacity: 0.45 }),
      bolt(1070, 220, 0.9, c.p.accent),
      ...[0, 1, 2, 3, 4, 5].map((i) => wheat(840 + i * 56, G + 72, 0.42, c.p.crop, 3)),
      sheepAt(520, G + 66, 0.9, c.p.light, c.p.near),
      sheepAt(620, G + 60, 0.8, c.p.light, c.p.near),
      sheepAt(700, G + 70, 0.95, c.p.light, c.p.near),
      staffBearer(370, G + 74, 1.45, c.p.fore),
      fg(c, 702, 12),
    ],
  },

  // 11: the two staves Beauty and Bands broken; thirty pieces of silver cast to the potter in the house of the LORD
  'zacharia-bijbelquiz-deel-11': {
    hue: 140,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 280, sunR: 64, far: 'dunes' }),
      houseBlock(c.rand, 1040, G + 30, 0.95, c.p.mid),
      jar(900, G + 64, 1.0, c.p.near),
      jar(980, G + 70, 0.8, c.p.near),
      jar(1120, G + 72, 0.9, c.p.near),
      person(480, G + 72, 1.5, c.p.fore, 'point'),
      ...[[606, 408], [660, 428], [712, 456], [752, 490], [786, 526], [820, 556], [760, 566]].map(([x, y], i) => coin(x, y, 1.35 + (i % 2) * 0.25, c.p.accent)),
      bar(300, G + 82, 380, G + 70, 7, c.p.near),
      bar(394, G + 86, 470, G + 92, 7, c.p.near),
      fg(c, 702, 12),
    ],
  },

  // 12: Jerusalem made a cup of trembling to all the peoples round about who lay siege to her
  'zacharia-bijbelquiz-deel-12': {
    hue: 142,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 760, sunY: 250, sunR: 80, far: 'ridge', clouds: 2 }),
      c.veil(0, 500, c.p.fore, 0.2),
      c.veil(W, 1000, c.p.fore, 0.2),
      path('M 470 500 C 560 400 650 370 760 366 C 870 370 960 400 1050 500 Z', c.p.mid),
      citySkyline(c.rand, 760, 380, 0.75, c.p.near, 6),
      cityWall(760, 404, 0.62, c.p.near, 380),
      tent(380, G + 30, 0.8, c.p.near),
      tent(1160, G + 30, 0.85, c.p.near),
      tent(1270, G + 36, 0.6, c.p.near, { opacity: 0.85 }),
      horse(250, G + 40, 0.7, c.p.near),
      goblet(560, G + 90, 2.2, c.p.accent),
      fg(c, 704, 10),
    ],
  },

  // 13: a fountain opened for sin and uncleanness - "sla den Herder, en de schapen zullen verstrooid worden"
  'zacharia-bijbelquiz-deel-13': {
    hue: 144,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 260, sunR: 64, far: 'ridge' }),
      raw('M 520 530 L 560 420 L 620 360 L 700 330 L 790 344 L 850 400 L 900 530 Z', c.p.mid),
      raw('M 690 400 L 718 400 L 730 520 L 676 520 Z', c.p.water),
      ellipse(704, 540, 150, 22, c.p.water),
      ellipse(704, 536, 110, 12, c.p.light, { opacity: 0.5 }),
      raw('M 684 396 Q 704 384 724 396 L 718 408 L 690 408 Z', c.p.fore, 0.5),
      stroke('M 704 396 C 690 370 650 362 626 384', c.p.light, 6, 0.85),
      stroke('M 704 396 C 718 370 758 362 782 384', c.p.light, 6, 0.85),
      ...[0, 1, 2, 3, 4].map((i) => circle(640 + i * 32, 516 - (i % 2) * 10, 6, c.p.light, { opacity: 0.8 })),
      sheepAt(260, G + 40, 0.75, c.p.light, c.p.near),
      sheepAt(400, G + 70, 0.85, c.p.light, c.p.near, true),
      sheepAt(1030, G + 66, 0.85, c.p.light, c.p.near),
      sheepAt(1200, G + 38, 0.7, c.p.light, c.p.near, true),
      rotate(76, 480, G + 98, crook(480, G + 98, 0.95, c.p.accent)),
      fg(c, 704, 10),
    ],
  },

  // 14: His feet stand on the Mount of Olives and it splits in two; living waters go out from Jerusalem - the LORD King over all the earth
  'zacharia-bijbelquiz-deel-14': {
    hue: 146,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 300, sunR: 100, rays: true, far: 'dunes' }),
      shafts(704, 140, 220, 340, c.p.glow, 5),
      raw(`M 140 ${G + 40} C 300 380 480 300 640 296 L 676 360 L 660 420 L 686 ${G + 40} Z`, c.p.mid),
      raw(`M 1268 ${G + 40} C 1108 380 928 300 768 296 L 734 360 L 750 420 L 724 ${G + 40} Z`, c.p.mid),
      tree(420, 384, 0.55, c.p.near),
      tree(520, 346, 0.5, c.p.near),
      tree(990, 384, 0.55, c.p.near),
      tree(890, 346, 0.5, c.p.near),
      c.soft(704, 360, 140, 0.6),
      raw(`M 686 ${G + 40} C 640 ${G + 60} 520 ${G + 70} 360 ${G + 100} L 380 ${G + 120} C 540 ${G + 92} 660 ${G + 84} 704 ${G + 70} Z`, c.p.water),
      raw(`M 724 ${G + 40} C 770 ${G + 60} 890 ${G + 70} 1050 ${G + 100} L 1030 ${G + 120} C 870 ${G + 92} 750 ${G + 84} 704 ${G + 70} Z`, c.p.water),
      crown(704, 236, 0.75, c.p.accent),
      fg(c, 706, 10),
    ],
  },
};
