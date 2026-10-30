/**
 * Covers for the Genesis series, one scene per quiz. Each quiz covers one
 * chapter: `genesis-bijbelquiz-deel-<n>` is chapter n (1-50).
 *
 * Base hue 60, drifting two degrees per chapter (chapter 50 lands on 158).
 * See `quiz-cover-scene-kit.mts` for the house style; the motifs this series
 * adds (altars, Noah's ark, the rainbow, the ladder, camels, sheep, the coat)
 * live in `quiz-cover-motifs-genesis-exodus.mts`. The older standalone
 * `genesis` cover (the boat on the water at dawn) stays in the core table.
 *
 * Chapters: the creation, sun, moon and stars over land and sea (1); the
 * garden of Eden with the tree of life and the river (2); the serpent and the
 * fruit (3); the offerings of Cain and Abel (4); the generations from Adam,
 * Enoch who walked with God (5); Noah building the ark (6); the animals go in,
 * the rain begins (7); the dove with the olive leaf (8); the rainbow (9); the
 * sons of Noah spread over the earth (10); the tower of Babel (11); Abram's
 * call and journey (12); Abram and Lot part ways (13); Melchizedek's bread and
 * wine (14); count the stars (15); Hagar at the spring (16); Abraham on his
 * face, the covenant (17); the three visitors at Mamre (18); fire on Sodom
 * (19); Abimelech returns Sarah with gifts (20); Hagar and Ishmael sent away
 * (21); the ram in the thicket (22); the cave of Machpelah (23); Rebekah at
 * the well (24); the red stew (25); Isaac's wells and hundredfold harvest
 * (26); the stolen blessing (27); Jacob's ladder (28); Jacob rolls the stone
 * from the well for Rachel (29); the speckled flocks and peeled rods (30);
 * the heap of witness at Gilead (31); wrestling at the Jabbok (32); Jacob and
 * Esau embrace (33); Shechem (34); Rachel's grave on the way to Bethlehem
 * (35); the kings of Edom (36); Joseph's coat and the pit (37); Judah's
 * pledge (38); Joseph flees from Potiphar's house (39); the cupbearer's and
 * baker's dreams (40); Pharaoh's cows and ears of grain (41); the brothers
 * bow before Joseph (42); the meal with Benjamin (43); the silver cup (44);
 * the wagons from Egypt (45); Israel goes down to Egypt (46); the granaries in
 * the famine (47); Jacob's hands on Ephraim and Manasseh (48); the lion
 * of Judah and the scepter (49); the burial procession to Canaan (50).
 */

import { mix } from './cover-options/shapes.mjs';
import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  banner,
  basket,
  bird,
  chariot,
  circle,
  citySkyline,
  cityWall,
  coin,
  columns,
  crescent,
  crowd,
  crown,
  cypress,
  donkey,
  dove,
  ellipse,
  fireBed,
  fish,
  flame,
  gateArch,
  goat,
  goblet,
  grapes,
  horse,
  lamp,
  lion,
  loaf,
  ox,
  palm,
  path,
  person,
  prisonBars,
  pyramids,
  ram,
  rays,
  rect,
  river,
  rotate,
  roundStone,
  scepter,
  shafts,
  sheaf,
  ship,
  shrub,
  smokeColumn,
  streaks,
  stump,
  sunDisc,
  throne,
  tombMound,
  trail,
  tree,
  vineRow,
  well,
  wheat,
  witheredPlant,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  arkFrame,
  bed,
  bier,
  bow,
  bundle,
  cairn,
  camel,
  camelResting,
  cloak,
  coat,
  cow,
  curve,
  embrace,
  flipX,
  granary,
  jar,
  ladder,
  noahArk,
  nomadTent,
  peeledRod,
  pit,
  pot,
  rainbow,
  robed,
  sack,
  sheep,
  signet,
  spear,
  spottedSheep,
  standingStone,
  starField,
  stroke,
  sword,
  table,
  wagon,
  waterSkin,
  wrestle,
} from './quiz-cover-motifs-genesis-exodus.mjs';

export const GENESIS_SCENES: Record<string, Scene> = {
  // 1: "In den beginne schiep God den hemel en de aarde" - the great light and the small light, sea and dry land, birds and fish
  'genesis-bijbelquiz-deel-1': {
    hue: 60,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'water', horizon: 476 }),
      c.veil(760, 0, '#6A76A0', 0.42),
      starField(c.rand, 130, 600, 110, 330, 34, c.p.light),
      crescent(330, 220, 40, c.p.light),
      c.soft(870, 290, 260, 0.5),
      rays(c.rand, 870, 290, 520, c.p.light, 14, { opacity: 0.22 }),
      sunDisc(870, 290, 62, c.p.accent),
      path(`M 760 486 C 860 436 980 420 1100 430 C 1210 438 1300 456 ${W + 40} 466 L ${W + 40} ${H} L 760 ${H} Z`, c.p.mid),
      palm(1230, 452, 1.15, c.p.near),
      tree(1090, 438, 1.25, c.p.near),
      shrub(960, 452, 0.9, c.p.near),
      lion(1150, 470, 0.55, c.p.near),
      bird(560, 250, 1.6, c.p.fore, { opacity: 0.7 }),
      bird(640, 216, 1.2, c.p.fore, { opacity: 0.6 }),
      bird(700, 268, 1.0, c.p.fore, { opacity: 0.5 }),
      rotate(-24, 470, 520, fish(470, 520, 0.7, c.p.near)),
      fish(300, 590, 0.5, c.p.near, { opacity: 0.6 }),
    ],
  },

  // 2: the garden eastward in Eden - the tree of life in the midst of it, the river going out to water the garden, the man and the woman
  'genesis-bijbelquiz-deel-2': {
    hue: 62,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 236, far: 'ridge', horizon: 476 }),
      river(476, c.p.water, { opacity: 0.9 }),
      cypress(1240, 486, 1.0, c.p.mid),
      palm(1110, 490, 1.0, c.p.mid),
      tree(260, 496, 1.3, c.p.mid),
      tree(600, 520, 2.3, c.p.near),
      ...[
        [-70, -150],
        [-30, -196],
        [20, -170],
        [70, -214],
        [110, -160],
        [-100, -200],
        [40, -230],
        [-20, -128],
      ].map(([dx, dy]) => circle(600 + dx, 520 + dy, 11, c.p.accent)),
      lion(880, 528, 0.8, c.p.near),
      sheep(1010, 530, 0.85, c.p.crop, c.p.near),
      person(820, 530, 1.25, c.p.fore, 'stand'),
      person(920, 532, 1.18, c.p.fore, 'stand'),
      fg(c, 686, 16),
    ],
  },

  // 3: the serpent in the tree, the woman reaching for the fruit, the storm of the fall coming in
  'genesis-bijbelquiz-deel-3': {
    hue: 64,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 260, sunY: 250, clouds: 2, far: 'dunes', horizon: 486 }),
      c.veil(700, W, c.p.fore, 0.5),
      tree(800, 524, 2.4, c.p.far),
      rotate(-16, 790, 380, path('M 700 420 C 740 360 800 440 840 380 C 860 350 880 344 900 338', 'none').replace('fill="none"', `fill="none" stroke="${c.p.fore}" stroke-width="13" stroke-linecap="round"`)),
      circle(694, 348, 11, c.p.fore),
      circle(660, 420, 16, c.p.accent),
      rect(658, 400, 3, 8, c.p.fore),
      person(560, 528, 1.32, c.p.fore, 'point'),
      person(420, 528, 1.28, c.p.near, 'stand', { opacity: 0.9 }),
      fg(c, 686, 16),
    ],
  },

  // 4: Abel's offering accepted - the smoke goes straight up; Cain's sheaf lies on a cold altar
  'genesis-bijbelquiz-deel-4': {
    hue: 66,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 300, far: 'ridge', horizon: 482 }),
      shafts(500, 80, 140, 360, c.p.glow, 4),
      smokeColumn(c.rand, 500, 420, 1.6, c.p.light),
      altar(500, 520, 1.15, c.p.near),
      fireBed(c.rand, 500, 442, 0.95, c.p.accent, 5),
      person(350, 528, 1.25, c.p.fore, 'kneel'),
      altar(930, 520, 1.0, c.p.mid),
      sheaf(930, 452, 0.55, c.p.crop),
      path('M 950 430 C 1010 440 1080 470 1180 460 C 1100 480 1020 470 960 446 Z', c.p.light, { opacity: 0.4 }),
      person(1080, 528, 1.25, c.p.fore, 'stand'),
      sheep(260, 524, 0.7, c.p.crop, c.p.near),
      fg(c, 686, 16),
    ],
  },

  // 5: the generations from Adam to Noah - "en Henoch wandelde met God, en hij was niet meer"
  'genesis-bijbelquiz-deel-5': {
    hue: 68,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 490 }),
      path(`M 560 500 C 760 470 900 380 1060 360 C 1180 346 1300 360 ${W + 40} 380 L ${W + 40} ${H} L 560 ${H} Z`, c.p.mid),
      trail(260, 700, 1060, 360, 70, '#FFFFFF', { opacity: 0.35 }),
      c.soft(1180, 250, 260, 0.55),
      rays(c.rand, 1180, 250, 460, c.p.light, 12, { opacity: 0.2 }),
      sunDisc(1180, 250, 48, c.p.accent),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const t = i / 6;
        const x = 210 + t * 640;
        const y = 540 - t * 112;
        return person(x, y, 0.78 + t * 0.14, c.p.near, 'walk', { opacity: Math.round((0.35 + t * 0.55) * 100) / 100 });
      }),
      person(1010, 372, 1.0, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 6: "Maak u een ark van goferhout" - the ark half built, Noah bringing timber
  'genesis-bijbelquiz-deel-6': {
    hue: 70,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 236, far: 'ridge', horizon: 482 }),
      arkFrame(790, 528, 1.4, c.p.near, c.p.accent),
      person(930, 236, 0.62, c.p.fore, 'stand'),
      rotate(-62, 1100, 528, rect(1100, 492, 240, 7, c.p.near)),
      rotate(-62, 1130, 528, rect(1130, 492, 240, 7, c.p.near)),
      person(380, 532, 1.3, c.p.fore, 'carry'),
      rotate(-8, 380, 430, rect(270, 424, 230, 14, c.p.near, { rx: 4 })),
      stump(230, 536, 0.9, c.p.near),
      rect(470, 520, 140, 12, c.p.mid, { rx: 5 }),
      rect(480, 508, 120, 12, c.p.mid, { rx: 5 }),
      fg(c, 688, 16),
    ],
  },

  // 7: the animals go in two by two, and the rain begins to fall
  'genesis-bijbelquiz-deel-7': {
    hue: 72,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'dunes', horizon: 486 }),
      streaks(c.rand, 0, 80, W, 480, c.p.light, 90, { opacity: 0.35 }),
      noahArk(840, 516, 1.45, c.p.near, mix(c.a.near, c.a.figure, 0.35), c.p.accent),
      c.soft(905, 390, 70, 0.5),
      path('M 880 370 L 910 370 L 640 526 L 590 526 Z', c.p.near),
      ram(720, 458, 0.42, c.p.fore),
      ram(790, 420, 0.38, c.p.fore),
      horse(520, 528, 0.62, c.p.fore),
      horse(400, 532, 0.62, c.p.near),
      lion(290, 536, 0.55, c.p.near),
      dove(560, 320, 0.9, c.p.fore),
      dove(620, 296, 0.8, c.p.fore),
      fg(c, 700, 12),
      rect(0, 624, W, H - 624, c.p.water, { opacity: 0.7 }),
      stroke(160, 650, 520, 650, 4, c.p.light, { opacity: 0.6 }),
      stroke(760, 672, 1180, 672, 4, c.p.light, { opacity: 0.5 }),
    ],
  },

  // 8: the waters abate, the ark rests on the mountains, the dove returns with an olive leaf
  'genesis-bijbelquiz-deel-8': {
    hue: 74,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 250, rays: true, far: 'none', ground: 'water', horizon: 500 }),
      path('M 120 506 C 200 470 260 420 330 380 C 380 352 420 360 460 380 C 520 410 580 470 700 506 Z', c.p.mid),
      path('M 520 506 C 580 470 620 452 660 448 C 700 446 760 480 820 506 Z', mix(c.a.near, '#FFFFFF', 0.15)),
      noahArk(380, 382, 0.72, c.p.near, mix(c.a.near, c.a.figure, 0.35)),
      bird(1160, 330, 1.4, c.p.fore, { opacity: 0.6 }),
      c.soft(860, 330, 140, 0.4),
      flipX(860, dove(860, 330, 1.7, c.p.fore)),
      rotate(-20, 776, 324, ellipse(776, 324, 18, 8, c.p.accent)),
      rotate(20, 772, 336, ellipse(772, 336, 14, 6, c.p.accent)),
      stroke(786, 330, 760, 332, 3, c.p.accent),
    ],
  },

  // 9: "Mijn boog geef Ik in de wolken" - the rainbow over Noah and his family
  'genesis-bijbelquiz-deel-9': {
    hue: 76,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 214, clouds: 2, far: 'ridge', horizon: 484 }),
      rainbow(800, 500, 380, 24, [c.p.accent, mix(c.p.accent, c.a.accent2 ?? c.p.accent, 0.6), c.p.crop, c.p.light, c.p.water], 0.78),
      noahArk(1200, 440, 0.45, c.p.mid, mix(c.a.mid, c.a.figure, 0.3), undefined, { opacity: 0.8 }),
      altar(560, 524, 0.9, c.p.near),
      smokeColumn(c.rand, 560, 450, 1.1, c.p.light),
      person(700, 528, 1.3, c.p.fore, 'raise'),
      person(800, 530, 1.18, c.p.fore, 'stand'),
      person(880, 532, 1.1, c.p.near, 'stand'),
      person(960, 532, 1.05, c.p.near, 'stand'),
      sheep(1080, 534, 0.7, c.p.crop, c.p.near, true),
      fg(c, 688, 16),
    ],
  },

  // 10: the table of nations - Shem, Ham and Japheth's sons go out to their lands: Egypt, the cities of the east, the coastlands
  'genesis-bijbelquiz-deel-10': {
    hue: 78,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 214, far: 'none', horizon: 486 }),
      path(`M 940 488 C 1060 482 1200 478 ${W + 40} 482 L ${W + 40} 520 L 940 520 Z`, c.p.water),
      ship(1160, 476, 0.55, c.p.near, c.p.light),
      pyramids(330, 486, 1.1, c.p.far, { opacity: 0.8 }),
      ziggurat(704, 486, 0.62, c.p.far, 4, { opacity: 0.8 }),
      trail(704, H, 330, 488, 80, '#FFFFFF', { opacity: 0.35 }),
      trail(704, H, 704, 488, 80, '#FFFFFF', { opacity: 0.35 }),
      trail(704, H, 1080, 488, 80, '#FFFFFF', { opacity: 0.35 }),
      flipX(520, person(520, 556, 1.2, c.p.fore, 'walk')),
      flipX(560, banner(560, 556, 0.9, c.p.fore, c.p.accent)),
      person(704, 556, 1.22, c.p.fore, 'stand'),
      banner(732, 556, 0.9, c.p.fore, c.p.accent),
      person(890, 556, 1.2, c.p.fore, 'walk'),
      banner(920, 556, 0.9, c.p.fore, c.p.accent),
      fg(c, 700, 12),
    ],
  },

  // 11: the tower of Babel, its top unfinished, the builders scattered
  'genesis-bijbelquiz-deel-11': {
    hue: 80,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 320, far: 'dunes', horizon: 494 }),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(704 - (340 - i * 48) / 2, 516 - (i + 1) * 46, 340 - i * 48, 48, mix(c.a.near, c.a.figure, 0.45 + i * 0.05))),
      ...[0, 1, 2, 3, 4].map((i) => stroke(704 - (330 - i * 48) / 2, 512 - i * 46, 704 + (300 - i * 48) / 2, 474 - i * 46, 6, c.p.light, { opacity: 0.3 })),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(704 - (330 - i * 48) / 2 + 14, 516 - (i + 1) * 46 + 14, 10, 18, c.p.fore, { opacity: 0.5 })),
      rect(620, 204, 34, 30, c.p.accent),
      rect(658, 214, 34, 20, c.p.accent),
      rect(696, 196, 34, 38, c.p.accent),
      rect(734, 210, 34, 24, c.p.accent),
      rect(640, 176, 34, 26, c.p.accent),
      rect(700, 168, 30, 26, c.p.accent),
      stroke(604, 236, 604, 140, 5, c.p.fore),
      stroke(800, 236, 800, 150, 5, c.p.fore),
      stroke(596, 154, 808, 154, 5, c.p.fore),
      flipX(320, person(320, 530, 1.1, c.p.fore, 'walk')),
      flipX(230, person(230, 534, 0.95, c.p.near, 'walk')),
      person(1080, 530, 1.1, c.p.fore, 'walk'),
      person(1180, 534, 0.95, c.p.near, 'walk'),
      person(1260, 536, 0.85, c.p.near, 'walk', { opacity: 0.8 }),
      fg(c, 688, 16),
    ],
  },

  // 12: "Ga gij uit uw land" - Abram sets out with Sarai, Lot and the flocks, and builds an altar in the land
  'genesis-bijbelquiz-deel-12': {
    hue: 82,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 300, rays: true, far: 'ridge', horizon: 482 }),
      trail(300, H, 1100, 484, 90, '#FFFFFF', { opacity: 0.3 }),
      altar(1170, 486, 0.6, c.p.near),
      fireBed(c.rand, 1170, 444, 0.6, c.p.accent, 4),
      sheep(220, 538, 0.6, c.p.crop, c.p.near),
      sheep(300, 544, 0.55, c.p.crop, c.p.near),
      camel(450, 530, 0.95, c.p.near, true),
      donkey(610, 530, 0.85, c.p.fore),
      person(740, 528, 1.18, c.p.fore, 'walk'),
      robed(860, 526, 1.32, c.p.fore, 'staff'),
      fg(c, 690, 14),
    ],
  },

  // 13: Abram and Lot part - Lot chooses the well-watered plain of the Jordan toward Sodom, Abram stays in the hills
  'genesis-bijbelquiz-deel-13': {
    hue: 84,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      citySkyline(c.rand, 230, 500, 0.55, c.p.far, 4, { opacity: 0.8 }),
      path(`M 300 502 C 360 520 300 540 220 560 C 140 580 120 640 160 ${H} L 330 ${H} C 290 640 330 590 400 562 C 470 534 420 514 340 502 Z`, c.p.water),
      ...[440, 520, 380].map((x, i) => palm(x, 540 + i * 14, 0.75 + i * 0.08, c.p.mid)),
      tree(130, 520, 0.8, c.p.mid),
      tree(500, 600, 0.9, c.p.mid),
      path(`M 560 ${H} C 600 520 640 470 720 450 C 860 418 1060 400 1200 410 C 1300 418 1380 430 ${W + 40} 436 L ${W + 40} ${H} Z`, c.p.mid),
      nomadTent(1130, 418, 0.8, c.p.accent),
      sheep(980, 424, 0.55, c.p.crop, c.p.near),
      sheep(1040, 430, 0.5, c.p.crop, c.p.near),
      flipX(700, person(700, 462, 1.25, c.p.fore, 'point')),
      person(840, 444, 1.3, c.p.fore, 'stand'),
      fg(c, 700, 12),
    ],
  },

  // 14: Melchizedek, king of Salem, brings out bread and wine to Abram returning from the battle
  'genesis-bijbelquiz-deel-14': {
    hue: 86,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'ridge', horizon: 490 }),
      path('M 880 500 C 940 430 1040 400 1150 400 C 1250 400 1320 440 1380 500 Z', c.p.mid),
      cityWall(1140, 410, 0.7, c.p.near, 260),
      citySkyline(c.rand, 1140, 368, 0.55, c.p.near, 4),
      ...[240, 300, 360].map((x, i) => spear(x, 530 + i * 2, 150, 1, c.p.near)),
      crowd(c.rand, 300, 532, 0.95, c.p.near, 4, 170),
      person(560, 532, 1.25, c.p.fore, 'kneel'),
      robed(800, 530, 1.38, c.p.fore, 'bless'),
      goblet(868, 418, 1.15, c.p.accent),
      loaf(720, 530, 0.8, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 15: "Zie nu op naar den hemel, en tel de sterren" - Abram under the night sky; the burning torch between the pieces
  'genesis-bijbelquiz-deel-15': {
    hue: 88,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 90, far: 'ridge', horizon: 486 }),
      starField(c.rand, 300, 1200, 80, 320, 40, c.p.light),
      nomadTent(270, 524, 0.8, c.p.near),
      person(560, 528, 1.38, c.p.fore, 'raise'),
      ellipse(860, 528, 34, 10, c.p.near),
      ellipse(940, 532, 30, 9, c.p.near),
      ellipse(1080, 528, 34, 10, c.p.near),
      ellipse(1160, 532, 30, 9, c.p.near),
      smokeColumn(c.rand, 1010, 450, 1.0, c.p.light),
      rect(1006, 476, 8, 56, c.p.near),
      flame(1010, 480, 0.75, c.p.accent),
      c.soft(1010, 460, 80, 0.5),
      fg(c, 690, 14),
    ],
  },

  // 16: the angel of the LORD finds Hagar by the spring of water in the wilderness, on the way to Shur
  'genesis-bijbelquiz-deel-16': {
    hue: 90,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 330, far: 'dunes', horizon: 488 }),
      ellipse(720, 528, 120, 16, c.p.water),
      ellipse(720, 524, 90, 7, c.p.light, { opacity: 0.5 }),
      palm(840, 520, 1.1, c.p.near),
      palm(600, 516, 0.8, c.p.mid),
      person(470, 532, 1.3, c.p.fore, 'kneel'),
      jar(580, 540, 0.75, c.p.accent),
      c.soft(980, 390, 160, 0.4),
      angel(980, 520, 1.15, c.p.light, { opacity: 0.85 }),
      fg(c, 690, 14),
    ],
  },

  // 17: "Abram viel op zijn aangezicht" - the covenant: the father of many nations, a few stars still in the dawn
  'genesis-bijbelquiz-deel-17': {
    hue: 92,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', stars: 16, far: 'ridge', horizon: 488 }),
      c.soft(980, 230, 300, 0.75),
      c.soft(980, 230, 90, 0.9, c.p.light),
      rays(c.rand, 980, 230, 520, c.p.accent, 12, { opacity: 0.14 }),
      shafts(980, 200, 260, 330, c.p.glow, 5),
      nomadTent(250, 526, 0.85, c.p.near),
      nomadTent(420, 516, 0.5, c.p.mid, undefined, { opacity: 0.8 }),
      person(260, 530, 0.85, c.p.near, 'stand'),
      person(620, 536, 1.5, c.p.fore, 'bow'),
      fg(c, 690, 14),
    ],
  },

  // 18: three men at the tent under the oaks of Mamre; Abraham bows and sets bread before them
  'genesis-bijbelquiz-deel-18': {
    hue: 94,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 226, far: 'dunes', horizon: 490 }),
      tree(820, 520, 2.3, c.p.mid),
      nomadTent(260, 528, 0.85, c.p.near),
      person(300, 530, 0.85, c.p.near, 'stand', { opacity: 0.9 }),
      person(760, 530, 1.26, c.p.fore, 'stand'),
      person(860, 532, 1.3, c.p.fore, 'stand'),
      person(960, 530, 1.26, c.p.fore, 'stand'),
      person(520, 534, 1.3, c.p.fore, 'bow'),
      rect(600, 528, 110, 8, c.p.near, { rx: 3 }),
      loaf(630, 528, 0.75, c.p.accent),
      loaf(680, 528, 0.65, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 19: brimstone and fire on Sodom; Lot and his daughters flee, his wife looks back
  'genesis-bijbelquiz-deel-19': {
    hue: 96,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'dunes', horizon: 488 }),
      c.veil(500, W, c.p.accentDeep, 0.25),
      streaks(c.rand, 760, 80, 560, 380, c.p.accent, 40, { opacity: 0.5 }),
      citySkyline(c.rand, 1080, 492, 0.95, c.p.near, 6),
      fireBed(c.rand, 1080, 440, 1.5, c.p.accent, 8),
      smokeColumn(c.rand, 980, 380, 1.8, c.p.fore),
      smokeColumn(c.rand, 1180, 390, 1.6, c.p.fore),
      person(760, 532, 1.25, c.p.light, 'stand', { opacity: 0.85 }),
      flipX(470, person(470, 532, 1.3, c.p.fore, 'walk')),
      flipX(360, person(360, 534, 1.1, c.p.fore, 'walk')),
      flipX(270, person(270, 536, 1.05, c.p.fore, 'walk')),
      fg(c, 690, 14),
    ],
  },

  // 20: Abimelech, king of Gerar, gives Sarah back to Abraham with sheep, oxen and a thousand pieces of silver
  'genesis-bijbelquiz-deel-20': {
    hue: 98,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 236, far: 'none', ground: 'flat', horizon: 512 }),
      columns(1240, 512, 1.1, c.p.near, 2),
      throne(1050, 512, 1.0, c.p.near),
      person(1050, 512, 1.05, c.p.fore, 'sit'),
      crown(1050, 400, 0.32, c.p.near),
      person(640, 516, 1.3, c.p.fore, 'stand'),
      person(740, 516, 1.22, c.p.fore, 'stand'),
      ...[
        [870, 508],
        [900, 512],
        [884, 490],
        [920, 506],
        [905, 488],
      ].map(([x, y]) => coin(x, y, 1.0, c.p.accent)),
      ox(400, 520, 0.8, c.p.near),
      sheep(230, 520, 0.7, c.p.crop, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 21: early in the morning Abraham sends Hagar away with bread and a skin of water; she and the boy go into the wilderness of Beersheba
  'genesis-bijbelquiz-deel-21': {
    hue: 100,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 340, far: 'dunes', horizon: 488 }),
      trail(700, H, 1120, 490, 90, '#FFFFFF', { opacity: 0.3 }),
      nomadTent(270, 526, 0.9, c.p.near),
      person(430, 528, 1.25, c.p.fore, 'stand'),
      person(200, 530, 0.9, c.p.near, 'carry'),
      bundle(200, 452, 0.55, c.p.near),
      person(820, 530, 1.3, c.p.fore, 'walk'),
      waterSkin(806, 426, 1.0, c.p.accent),
      person(930, 532, 0.85, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 22: "God zal Zichzelf voorzien van een lam" - the altar on Moriah, the ram caught in the thicket by its horns
  'genesis-bijbelquiz-deel-22': {
    hue: 102,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 160, far: 'ridge', horizon: 500 }),
      shafts(704, 60, 300, 330, c.p.glow, 5),
      path('M 160 520 C 300 500 420 420 560 404 C 700 388 860 392 980 412 C 1100 432 1220 490 1320 520 Z', c.p.mid),
      altar(620, 418, 1.1, c.p.near),
      ...[0, 1, 2].map((i) => rect(560 + i * 6, 330 - i * 10, 120 - i * 12, 9, c.p.mid, { rx: 3 })),
      person(780, 412, 1.35, c.p.fore, 'raise'),
      person(470, 416, 1.0, c.p.fore, 'kneel'),
      shrub(1010, 420, 1.7, c.p.mid),
      ram(990, 424, 1.0, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 23: Sarah dies; Abraham weighs out four hundred shekels of silver for the cave of Machpelah
  'genesis-bijbelquiz-deel-23': {
    hue: 104,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 330, far: 'ridge', horizon: 488 }),
      tombMound(440, 520, 1.25, c.p.mid, c.p.fore),
      cypress(230, 520, 1.0, c.p.near),
      tree(640, 516, 1.1, c.p.near),
      person(820, 532, 1.25, c.p.fore, 'bow'),
      ...[
        [930, 522],
        [960, 526],
        [946, 506],
        [978, 512],
      ].map(([x, y]) => coin(x, y, 1.0, c.p.accent)),
      flipX(1060, person(1060, 530, 1.25, c.p.fore, 'point')),
      person(1160, 532, 1.1, c.p.near, 'stand'),
      person(1240, 534, 1.0, c.p.near, 'stand', { opacity: 0.85 }),
      fg(c, 690, 14),
    ],
  },

  // 24: at the well at evening Rebekah draws water for the servant's camels
  'genesis-bijbelquiz-deel-24': {
    hue: 106,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 320, far: 'dunes', horizon: 488 }),
      well(540, 528, 1.3, c.p.near),
      person(380, 530, 1.2, c.p.fore, 'stand'),
      rect(780, 514, 150, 16, c.p.near, { rx: 4 }),
      person(700, 530, 1.3, c.p.fore, 'point'),
      rotate(-70, 774, 432, jar(774, 456, 0.62, c.p.accent)),
      curve('M 806 448 C 820 470 826 490 830 512', 5, c.p.water),
      camelResting(1010, 532, 1.2, c.p.near),
      camelResting(1200, 536, 1.05, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 25: Esau, faint from the field, sells his birthright to Jacob for a pot of red stew
  'genesis-bijbelquiz-deel-25': {
    hue: 108,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'ridge', horizon: 490 }),
      nomadTent(1150, 528, 0.9, c.p.near),
      fireBed(c.rand, 760, 532, 0.55, c.p.accentDeep, 5),
      pot(760, 530, 1.25, c.p.accent, c.p.near),
      smokeColumn(c.rand, 760, 420, 0.9, c.p.light),
      robed(900, 530, 1.3, c.p.fore, 'reach'),
      person(500, 532, 1.3, c.p.fore, 'walk'),
      rotate(30, 470, 440, bow(470, 440, 1.0, c.p.fore)),
      fg(c, 690, 14),
    ],
  },

  // 26: Isaac sows in Gerar and reaps a hundredfold; his servants dig the wells - Esek, Sitna, Rehoboth
  'genesis-bijbelquiz-deel-26': {
    hue: 110,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 300, far: 'ridge', horizon: 482 }),
      well(1040, 486, 0.5, c.p.mid),
      person(1000, 488, 0.45, c.p.mid, 'point'),
      flipX(1080, person(1080, 488, 0.45, c.p.mid, 'point')),
      well(1240, 484, 0.4, c.p.mid, { opacity: 0.8 }),
      well(780, 528, 1.25, c.p.near),
      person(900, 532, 1.3, c.p.fore, 'stand'),
      person(650, 534, 1.0, c.p.fore, 'kneel'),
      ...[180, 250, 320, 390, 460].map((x, i) => wheat(x, 548 - (i % 2) * 6, 0.85, c.p.accent, 4)),
      fg(c, 690, 14),
    ],
  },

  // 27: blind Isaac blesses Jacob, who is dressed as Esau; Rebekah watches from the tent
  'genesis-bijbelquiz-deel-27': {
    hue: 112,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 260, far: 'none', ground: 'flat', horizon: 512 }),
      nomadTent(1040, 518, 2.0, c.p.mid),
      person(1040, 518, 0.82, c.p.near, 'stand'),
      bed(520, 520, 1.1, c.p.near),
      person(520, 486, 1.1, c.p.fore, 'sit'),
      stroke(536, 420, 640, 408, 12, c.p.fore),
      flipX(690, person(690, 522, 1.2, c.p.fore, 'kneel')),
      table(350, 524, 110, 0.9, c.p.near),
      goblet(350, 484, 1.2, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 28: Jacob asleep on a stone at Bethel; the ladder set up on the earth, its top reaching to heaven, the angels going up and down
  'genesis-bijbelquiz-deel-28': {
    hue: 114,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 60, far: 'ridge', horizon: 488 }),
      c.soft(920, 110, 260, 0.6),
      shafts(920, 70, 220, 300, c.p.glow, 5),
      ladder(700, 522, 930, 90, 86, 34, c.p.accent, 14),
      angel(764, 400, 0.42, c.p.light, { opacity: 0.85 }),
      angel(860, 238, 0.32, c.p.light, { opacity: 0.8 }),
      ellipse(580, 528, 34, 16, c.p.near),
      flipX(430, person(430, 536, 1.6, c.p.fore, 'fallen')),
      fg(c, 690, 14),
    ],
  },

  // 29: Jacob rolls the stone from the well's mouth and waters Laban's sheep as Rachel comes with the flock, at high noon
  'genesis-bijbelquiz-deel-29': {
    hue: 116,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 488 }),
      c.soft(704, 170, 200, 0.6),
      sunDisc(704, 170, 46, c.p.accent),
      pit(560, 534, 1.2, c.p.near, c.p.fore),
      roundStone(700, 534, 1.0, c.p.near),
      person(470, 534, 1.3, c.p.fore, 'point'),
      robed(960, 532, 1.25, c.p.fore, 'staff'),
      sheep(850, 536, 0.75, c.p.crop, c.p.near, true),
      sheep(1080, 534, 0.7, c.p.crop, c.p.near, true),
      sheep(1170, 540, 0.7, c.p.crop, c.p.near, true),
      person(240, 532, 0.95, c.p.near, 'sit'),
      sheep(320, 538, 0.6, c.p.crop, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 30: the peeled rods in the watering troughs, and the speckled and spotted flock that is Jacob's wage
  'genesis-bijbelquiz-deel-30': {
    hue: 118,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 250, far: 'dunes', horizon: 490 }),
      rect(560, 508, 300, 22, c.p.near, { rx: 5 }),
      rect(570, 506, 280, 6, c.p.water),
      ...[600, 650, 700, 750, 800].map((x, i) => peeledRod(x, 512, 150 + (i % 2) * 20, 1.1, c.p.accent, c.p.light, (i - 2) * 4)),
      spottedSheep(500, 534, 0.8, c.p.crop, c.p.near),
      spottedSheep(390, 538, 0.72, c.p.crop, c.p.near),
      spottedSheep(930, 536, 0.8, c.p.crop, c.p.near, true),
      goat(1060, 536, 0.55, c.p.near),
      robed(250, 532, 1.3, c.p.fore, 'staff'),
      fg(c, 690, 14),
    ],
  },

  // 31: on the mountains of Gilead Jacob and Laban raise a heap of stones and a pillar as a witness between them
  'genesis-bijbelquiz-deel-31': {
    hue: 120,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 330, far: 'ridge', horizon: 486 }),
      cairn(660, 530, 1.05, c.p.near),
      standingStone(810, 532, 1.45, c.p.accent),
      person(500, 532, 1.3, c.p.fore, 'raise'),
      person(960, 532, 1.3, c.p.fore, 'raise'),
      person(1080, 534, 1.05, c.p.near, 'stand'),
      person(1160, 536, 0.95, c.p.near, 'stand', { opacity: 0.85 }),
      camel(300, 530, 0.85, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 32: at the ford of the Jabbok Jacob wrestles with the Man until the dawn breaks
  'genesis-bijbelquiz-deel-32': {
    hue: 122,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', ground: 'water', horizon: 470 }),
      c.soft(1040, 400, 220, 0.6),
      rays(c.rand, 1040, 400, 520, c.p.light, 14, { opacity: 0.2 }),
      sunDisc(1040, 420, 52, c.p.accent),
      path(`M 940 476 C 1020 470 1100 470 1180 476 L 1180 480 L 940 480 Z`, c.p.water),
      path(`M -40 520 C 160 500 420 498 640 504 C 780 508 860 522 920 560 C 960 600 980 680 1000 ${H} L -40 ${H} Z`, c.p.mid),
      reedsSafe(c, 880, 540),
      wrestle(560, 526, 1.4, c.p.fore),
      nomadTent(250, 514, 0.5, c.p.near, undefined, { opacity: 0.8 }),
      fg(c, 720, 10),
    ],
  },

  // 33: Esau runs to meet Jacob and embraces him; Esau's four hundred men behind him, Jacob's household behind Jacob
  'genesis-bijbelquiz-deel-33': {
    hue: 124,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 236, far: 'dunes', horizon: 490 }),
      altar(560, 486, 0.45, c.p.mid),
      flame(560, 456, 0.5, c.p.accent),
      embrace(720, 532, 1.4, c.p.fore),
      ...[960, 1030, 1100, 1170, 1240].map((x, i) => spear(x, 532 + (i % 2) * 4, 160, 1, c.p.near)),
      crowd(c.rand, 1100, 532, 1.0, c.p.near, 5, 300),
      person(420, 532, 1.05, c.p.near, 'bow'),
      person(330, 532, 1.0, c.p.near, 'stand'),
      person(260, 534, 0.75, c.p.near, 'stand'),
      sheep(180, 538, 0.6, c.p.crop, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 34: Simeon and Levi come out of Shechem with their swords; smoke rises over the city, Jacob is troubled
  'genesis-bijbelquiz-deel-34': {
    hue: 126,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 488 }),
      smokeColumn(c.rand, 900, 400, 1.7, c.p.fore),
      smokeColumn(c.rand, 1120, 410, 1.5, c.p.fore),
      cityWall(1000, 500, 1.0, c.p.near, 440),
      gateArch(1000, 500, 0.9, c.p.fore),
      flipX(700, person(700, 530, 1.3, c.p.fore, 'walk')),
      rotate(-30, 660, 470, sword(660, 470, 0.9, c.p.accent)),
      flipX(580, person(580, 532, 1.25, c.p.fore, 'walk')),
      rotate(-30, 540, 474, sword(540, 474, 0.85, c.p.accent)),
      person(260, 532, 1.2, c.p.near, 'bow'),
      fg(c, 690, 14),
    ],
  },

  // 35: Rachel dies giving birth to Benjamin and is buried on the way to Ephrath; Jacob sets a pillar on her grave
  'genesis-bijbelquiz-deel-35': {
    hue: 128,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 350, far: 'ridge', horizon: 490 }),
      trail(800, H, 1120, 492, 80, '#FFFFFF', { opacity: 0.3 }),
      citySkyline(c.rand, 1150, 492, 0.45, c.p.far, 4, { opacity: 0.8 }),
      ellipse(640, 534, 110, 18, c.p.mid),
      standingStone(640, 526, 1.5, c.p.near),
      flipX(780, person(780, 534, 1.25, c.p.fore, 'kneel')),
      person(400, 532, 1.25, c.p.fore, 'carry'),
      bundle(398, 450, 0.85, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 36: the generations of Esau, who is Edom, and the kings who reigned in the mountains of Seir
  'genesis-bijbelquiz-deel-36': {
    hue: 130,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 260, far: 'dunes', horizon: 490 }),
      path(`M 700 500 C 760 380 840 300 960 270 C 1080 250 1200 300 1280 360 C 1330 400 1370 440 ${W + 40} 470 L ${W + 40} 520 L 700 520 Z`, c.p.mid),
      path('M 1000 500 C 1010 420 1060 380 1110 380 C 1160 380 1200 420 1210 500 Z', mix(c.a.near, c.a.figure, 0.3)),
      gateArch(1100, 500, 0.62, c.p.near),
      person(980, 520, 1.25, c.p.fore, 'stand'),
      crown(980, 352, 0.42, c.p.accent),
      camel(680, 530, 0.9, c.p.near, true),
      camel(470, 534, 0.8, c.p.near, true),
      person(800, 532, 1.1, c.p.fore, 'walk'),
      sheep(330, 538, 0.6, c.p.crop, c.p.near, true),
      fg(c, 690, 14),
    ],
  },

  // 37: Joseph's coat held up by his brothers beside the empty pit, and the Ishmaelite caravan on the road to Egypt
  'genesis-bijbelquiz-deel-37': {
    hue: 132,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'dunes', horizon: 490 }),
      camel(1050, 494, 0.55, c.p.mid, true),
      camel(1160, 494, 0.55, c.p.mid, true),
      camel(1270, 494, 0.55, c.p.mid, true),
      pit(500, 540, 1.1, c.p.near, c.p.fore),
      person(740, 532, 1.3, c.p.fore, 'raise'),
      coat(740, 470, 0.72, c.p.accent, c.p.crop),
      person(870, 534, 1.2, c.p.fore, 'point'),
      person(330, 534, 1.05, c.p.near, 'sit'),
      person(250, 532, 1.1, c.p.near, 'stand'),
      fg(c, 690, 14),
    ],
  },

  // 38: Judah gives Tamar his seal, its cord and his staff as a pledge at the gate of Enaim
  'genesis-bijbelquiz-deel-38': {
    hue: 134,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'ridge', horizon: 490 }),
      gateArch(980, 520, 1.25, c.p.near),
      person(860, 530, 1.15, c.p.fore, 'sit'),
      person(520, 532, 1.3, c.p.fore, 'point'),
      goat(380, 534, 0.6, c.p.near),
      signet(680, 470, 1.6, c.p.accent),
      rotate(16, 640, 534, rect(637, 380, 7, 154, c.p.near, { rx: 3 })),
      fg(c, 690, 14),
    ],
  },

  // 39: Joseph flees from Potiphar's house and leaves his garment behind
  'genesis-bijbelquiz-deel-39': {
    hue: 136,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 260, far: 'none', ground: 'flat', horizon: 512 }),
      pyramids(1170, 512, 0.9, c.p.far, { opacity: 0.7 }),
      rect(150, 300, 400, 212, c.p.near),
      rect(130, 286, 440, 18, c.p.near),
      columns(200, 512, 1.3, c.p.fore, 1),
      columns(500, 512, 1.3, c.p.fore, 1),
      rect(300, 380, 110, 132, c.p.fore, { opacity: 0.85 }),
      cloak(356, 500, 0.95, c.p.accent),
      person(760, 520, 1.38, c.p.fore, 'walk'),
      fg(c, 686, 14),
    ],
  },

  // 40: in the prison Joseph hears the cupbearer's dream of the vine and the cup, and the baker's of the three baskets
  'genesis-bijbelquiz-deel-40': {
    hue: 138,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 704, sunY: 180, sunR: 40, far: 'none', ground: 'flat', horizon: 512 }),
      prisonBars(704, 512, 1.6, c.p.near),
      c.soft(400, 320, 150, 0.4),
      c.soft(1010, 320, 150, 0.4),
      vineRow(c.rand, 340, 360, 0.9, c.p.light, 3),
      grapes(370, 352, 0.7, c.p.light),
      goblet(480, 380, 1.1, c.p.accent),
      basket(1010, 300, 0.7, c.p.light),
      basket(1010, 330, 0.7, c.p.light),
      basket(1010, 360, 0.7, c.p.light),
      bird(960, 240, 1.2, c.p.light),
      bird(1060, 226, 1.0, c.p.light),
      person(420, 528, 1.2, c.p.fore, 'sit'),
      robed(704, 530, 1.3, c.p.fore, 'bless'),
      person(1000, 528, 1.2, c.p.fore, 'sit'),
      fg(c, 690, 14),
    ],
  },

  // 41: Pharaoh's dream by the Nile - seven fat cows and seven lean, seven full ears and seven thin
  'genesis-bijbelquiz-deel-41': {
    hue: 140,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'dunes', horizon: 470 }),
      pyramids(1150, 470, 0.9, c.p.far, { opacity: 0.7 }),
      path(`M -40 480 C 300 474 700 486 ${W + 40} 476 L ${W + 40} 504 C 900 512 400 500 -40 506 Z`, c.p.water),
      ...[240, 380, 520].map((x) => cow(x, 546, 0.95, c.p.near)),
      ...[700, 830, 960].map((x) => cow(x, 540, 0.95, c.p.mid, true)),
      wheat(1120, 566, 1.35, c.p.accent, 4),
      witheredPlant(1220, 566, 1.5, c.p.mid),
      witheredPlant(1250, 560, 1.2, c.p.mid),
      fg(c, 696, 12),
    ],
  },

  // 42: the ten brothers bow with their faces to the earth before Joseph, the governor who sells the grain
  'genesis-bijbelquiz-deel-42': {
    hue: 142,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 230, far: 'none', ground: 'flat', horizon: 512 }),
      columns(1230, 512, 1.15, c.p.near, 2),
      rect(930, 470, 200, 44, c.p.near),
      throne(1030, 470, 0.8, c.p.near),
      person(1030, 470, 0.95, c.p.fore, 'sit'),
      ...[280, 380, 480, 580, 680, 780].map((x, i) => person(x, 520 + (i % 2) * 4, 1.05 + (i % 3) * 0.05, i % 2 ? c.p.near : c.p.fore, 'bow')),
      sack(880, 520, 0.85, c.p.accent),
      sack(830, 524, 0.7, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 43: the meal in Joseph's house - the brothers seated by age, Benjamin's portion five times as much
  'genesis-bijbelquiz-deel-43': {
    hue: 144,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      columns(170, 512, 1.15, c.p.near, 1),
      ...[400, 480, 560, 640, 720, 800, 880].map((x) => person(x, 486, 0.9, c.p.near, 'sit')),
      table(640, 530, 640, 1.2, c.p.fore),
      basket(640, 476, 0.8, c.p.accent),
      loaf(500, 476, 0.6, c.p.near),
      loaf(780, 476, 0.6, c.p.near),
      goblet(870, 476, 0.6, c.p.near),
      person(1150, 528, 1.25, c.p.fore, 'sit'),
      table(1150, 532, 180, 0.9, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 44: the steward finds the silver cup in Benjamin's sack; the brothers tear their clothes, Judah pleads
  'genesis-bijbelquiz-deel-44': {
    hue: 146,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'dunes', horizon: 490 }),
      columns(1230, 492, 0.75, c.p.far, 3, { opacity: 0.7 }),
      donkey(1060, 530, 0.85, c.p.near),
      sack(1040, 470, 0.55, c.p.near),
      sack(700, 532, 1.0, c.p.near),
      person(820, 530, 1.3, c.p.fore, 'raise'),
      goblet(860, 330, 1.1, c.p.accent),
      c.soft(860, 300, 70, 0.4),
      person(600, 532, 1.0, c.p.fore, 'stand'),
      person(460, 534, 1.25, c.p.fore, 'bow'),
      person(330, 532, 1.2, c.p.near, 'raise'),
      person(230, 534, 1.1, c.p.near, 'raise'),
      fg(c, 690, 14),
    ],
  },

  // 45: Jacob sees the wagons Joseph has sent from Egypt, and his spirit revives: "Jozef, mijn zoon, leeft nog"
  'genesis-bijbelquiz-deel-45': {
    hue: 148,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'ridge', horizon: 490 }),
      nomadTent(240, 530, 0.8, c.p.near),
      robed(420, 530, 1.35, c.p.fore, 'raise'),
      rect(690, 432, 130, 20, c.p.accent, { rx: 6 }),
      sack(730, 438, 0.5, c.p.accent),
      sack(780, 438, 0.45, c.p.accent),
      wagon(760, 530, 1.0, c.p.near),
      ox(590, 532, 0.62, c.p.near),
      wagon(1080, 520, 0.7, c.p.near, { opacity: 0.85 }),
      ox(960, 522, 0.45, c.p.near, { opacity: 0.85 }),
      person(900, 532, 1.1, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 46: Israel offers sacrifices at Beersheba and goes down to Egypt with all his household and his flocks
  'genesis-bijbelquiz-deel-46': {
    hue: 150,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 330, rays: true, far: 'dunes', horizon: 490 }),
      pyramids(1170, 490, 0.85, c.p.far, { opacity: 0.7 }),
      trail(240, H, 1080, 492, 120, '#FFFFFF', { opacity: 0.3 }),
      altar(240, 530, 0.95, c.p.near),
      fireBed(c.rand, 240, 466, 0.8, c.p.accent, 4),
      smokeColumn(c.rand, 240, 430, 1.0, c.p.light),
      robed(400, 532, 1.25, c.p.fore, 'staff'),
      wagon(560, 528, 0.75, c.p.near),
      person(690, 528, 1.1, c.p.fore, 'walk'),
      person(780, 524, 1.0, c.p.near, 'walk'),
      sheep(880, 524, 0.6, c.p.crop, c.p.near),
      sheep(950, 520, 0.55, c.p.crop, c.p.near),
      camel(1060, 516, 0.6, c.p.mid, true),
      fg(c, 690, 14),
    ],
  },

  // 47: the famine years - Joseph's granaries, the people bring their cattle for bread
  'genesis-bijbelquiz-deel-47': {
    hue: 152,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'dunes', horizon: 490 }),
      granary(880, 524, 1.15, c.p.near),
      granary(1020, 520, 1.25, c.p.near),
      granary(1160, 524, 1.1, c.p.near),
      path('M 770 534 C 800 480 860 470 900 470 C 940 470 990 490 1010 534 Z', c.p.accent),
      robed(700, 530, 1.3, c.p.fore, 'bless'),
      flipX(520, person(520, 532, 1.15, c.p.fore, 'walk')),
      ox(420, 534, 0.7, c.p.near),
      person(280, 534, 1.05, c.p.near, 'carry'),
      sack(280, 450, 0.55, c.p.near),
      sheep(190, 538, 0.6, c.p.crop, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 48: old Jacob, sitting up on his bed, lays his hands on the heads of Ephraim and Manasseh; Joseph stands by
  'genesis-bijbelquiz-deel-48': {
    hue: 154,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(1040, 400, 210, 0.55, c.p.accent),
      rect(1032, 420, 16, 104, c.p.near),
      lamp(1040, 418, 1.8, c.p.near, c.p.accent),
      bed(500, 526, 1.1, c.p.near),
      person(500, 494, 1.45, c.p.fore, 'sit'),
      flipX(600, person(600, 536, 1.0, c.p.fore, 'kneel')),
      flipX(690, person(690, 536, 1.0, c.p.mid, 'kneel')),
      stroke(522, 418, 594, 448, 12, c.p.fore),
      stroke(520, 404, 684, 444, 12, c.p.fore),
      circle(594, 448, 8, c.p.fore),
      circle(684, 444, 8, c.p.fore),
      person(850, 532, 1.35, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 49: "Juda is een jonge leeuw ... de scepter zal van Juda niet wijken" - the lion and the scepter; the twelve tribes' tents beyond
  'genesis-bijbelquiz-deel-49': {
    hue: 156,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'ridge', horizon: 488 }),
      ...Array.from({ length: 12 }, (_, i) => nomadTent(200 + i * 92, 490 + (i % 2) * 4, 0.2, c.p.far, undefined, { opacity: 0.85 })),
      vineRow(c.rand, 1020, 530, 0.95, c.p.near, 4),
      donkey(1230, 534, 0.7, c.p.near),
      lion(580, 544, 1.7, c.p.fore),
      rotate(10, 840, 546, scepter(840, 546, 2.1, c.p.accent)),
      fg(c, 692, 14),
    ],
  },

  // 50: the great company of Egypt carries Jacob up to Canaan to the cave of Machpelah
  'genesis-bijbelquiz-deel-50': {
    hue: 158,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 340, far: 'ridge', horizon: 490 }),
      tombMound(1180, 500, 0.75, c.p.mid, c.p.fore),
      flipX(290, chariot(340, 530, 0.95, c.p.near) + horse(220, 532, 0.62, c.p.near)),
      person(560, 530, 1.15, c.p.fore, 'walk'),
      person(760, 530, 1.15, c.p.fore, 'walk'),
      person(600, 534, 1.1, c.p.near, 'walk'),
      person(800, 534, 1.1, c.p.near, 'walk'),
      bier(680, 400, 0.95, c.p.accent),
      person(920, 532, 1.1, c.p.near, 'bow'),
      person(1020, 532, 1.05, c.p.near, 'walk', { opacity: 0.85 }),
      fg(c, 690, 14),
    ],
  },
};

/** Reeds along the near bank of the Jabbok, kept inside the frame. */
function reedsSafe(c: Parameters<Scene['draw']>[0], x: number, y: number): string {
  const out: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const px = x + i * 14;
    const h = 60 + c.rand() * 40;
    out.push(curve(`M ${px} ${y} Q ${px + 4} ${y - h * 0.6} ${px + 8} ${y - h}`, 3.4, c.p.near), ellipse(px + 8, y - h - 6, 4, 11, c.p.near));
  }
  return out.join('');
}
