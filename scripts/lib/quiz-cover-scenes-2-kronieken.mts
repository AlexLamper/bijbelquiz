/**
 * Covers for the 2 Kronieken series, one scene per quiz. Each quiz covers one
 * chapter: `2-kronieken-bijbelquiz-deel-<n>` is chapter n (1-36).
 *
 * Base hue 140, drifting two degrees per chapter (chapter 36 lands on 210).
 * See `quiz-cover-scene-kit.mts` for the house style; the temple furniture,
 * walls, instruments and arms come from `quiz-cover-motifs-kron2-ezra-brieven.mts`.
 *
 * Chapters: Salomo's offer te Gibeon (1); ceders uit de Libanon (2); de twee
 * koperen pilaren Jachin en Boaz (3); de gegoten zee op twaalf runderen (4);
 * de ark in de tempel, de wolk vult het huis (5); Salomo's inwijdingsgebed op
 * het koperen podium (6); vuur uit de hemel op het brandoffer (7); de schepen
 * naar Ofir (8); de koningin van Scheba en de ivoren troon (9); de scheuring,
 * "naar uw tenten, Israel" (10); Rehabeam versterkt de steden (11); Sisak
 * neemt de gouden schilden mee (12); Abia's priesters blazen de trompetten
 * (13); Asa's gebed tegen het leger van Zerah (14); Maacha's afgodsbeeld
 * verbrand aan de Kidron (15); Asa's schat naar Ben-Hadad (16); Josafats
 * Levieten onderwijzen het wetboek (17); Micha: Israel als schapen zonder
 * herder (18); rechters in de poorten (19); de zangers voor het leger uit
 * (20); Joram en de lamp van David (21); Joas verborgen in de tempel (22); de
 * kroning van Joas (23); de kist van Joas (24); Amazia en de goden van Edom
 * (25); Uzzia met het reukwerkvat (26); Jothams torens en de bovenpoort (27);
 * Achaz sluit de tempeldeuren (28); Hizkia opent de deuren (29); de lopers met
 * de brieven voor het pascha (30); hopen tienden (31); de engel in het kamp
 * van Sanherib (32); Manasse in boeien (33); het gevonden wetboek (34); Josia's
 * pascha (35); de val van Jeruzalem (36).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  basket,
  chainLinks,
  chariot,
  citySkyline,
  cloudBank,
  coin,
  columns,
  crowd,
  crown,
  donkey,
  ellipse,
  fireBed,
  flame,
  horse,
  houseBlock,
  lion,
  palm,
  path,
  person,
  prisonBars,
  pyramids,
  rect,
  river,
  rotate,
  shafts,
  sheaf,
  ship,
  smokeColumn,
  streaks,
  stump,
  tent,
  throne,
  tower,
  trail,
  tree,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import { mix } from './cover-options/shapes.mjs';
import {
  arkOfCovenant,
  arrow,
  blaze,
  bronzeSea,
  camel,
  cedar,
  censer,
  chest,
  cookPot,
  fig,
  figWith,
  flipX,
  gatehouse,
  heap,
  hornedAltar,
  idol,
  jar,
  lamb,
  letterRoll,
  logRaft,
  lyrePlayer,
  oilLamp,
  openScroll,
  sanctuary,
  scales,
  shield,
  spear,
  stoneAltar,
  swaddled,
  sword,
  templePillar,
  trumpeter,
  wallRun,
  wallTone,
  yoke,
} from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

export const KRONIEKEN2_SCENES: Record<string, Scene> = {
  // 1: Salomo at the high place of Gibeon, a thousand burnt offerings on the bronze altar; that night God says "Ask what I shall give thee"
  '2-kronieken-bijbelquiz-deel-1': {
    hue: 140,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1180, sunY: 200, sunR: 44, far: 'ridge', horizon: 470 }),
      path('M 900 430 L 900 380 L 1000 362 L 1100 380 L 1100 430 Z', wallTone(c, 0.18)),
      path('M 340 480 C 460 420 600 404 760 402 C 920 404 1060 428 1180 480 Z', c.p.mid),
      shafts(470, 70, 150, 300, c.p.glow, 3),
      hornedAltar(760, 418, 1.15, c.p.near, c.p.fore),
      blaze(760, 302, 0.95, c.p.accent, c.p.crop),
      smokeColumn(c.rand, 760, 200, 1.1, c.p.light),
      fig(470, 476, 1.45, c.p.fore, 'kneelUp'),
      crown(472, 350, 0.25, c.p.crop),
      fg(c, 684, 14),
    ],
  },

  // 2: Salomo prepares to build: cedars hewn in Lebanon, carried by bearers, Huram's timber
  '2-kronieken-bijbelquiz-deel-2': {
    hue: 142,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 220, far: 'ridge', horizon: 470 }),
      path('M 40 560 C 140 450 280 350 430 342 C 560 338 640 410 720 480 L 720 800 L 40 800 Z', c.p.mid),
      cedar(240, 440, 1.25, c.p.near),
      cedar(400, 364, 1.0, c.p.near),
      cedar(560, 392, 0.85, c.p.near, { opacity: 0.85 }),
      stump(640, 486, 1.0, c.p.near),
      logRaft(820, 500, 1.0, c.p.accent, c.p.accentDeep),
      person(980, 506, 1.2, c.p.fore, 'walk'),
      person(1170, 506, 1.2, c.p.fore, 'walk'),
      rect(940, 372, 270, 22, c.p.accent, { rx: 11 }),
      fg(c, 684, 16),
    ],
  },

  // 3: the house of the LORD built on Moria, and before it the two bronze pillars, Jachin and Boaz
  '2-kronieken-bijbelquiz-deel-3': {
    hue: 144,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 230, sunR: 70, rays: true, far: 'dunes', ground: 'flat', horizon: 500 }),
      sanctuary(704, 500, 1.08, wallTone(c, 0.22), c.p.glow),
      templePillar(546, 512, 0.92, c.p.accent, c.p.accentDeep),
      templePillar(862, 512, 0.92, c.p.accent, c.p.accentDeep),
      person(300, 514, 1.2, c.p.fore, 'carry'),
      rect(270, 318, 60, 36, wallTone(c, 0.45), { rx: 3 }),
      fig(1110, 514, 1.2, c.p.fore, 'reach', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 4: the molten sea standing on twelve oxen, the basin for the priests to wash in
  '2-kronieken-bijbelquiz-deel-4': {
    hue: 146,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'ridge', ground: 'flat', horizon: 500 }),
      sanctuary(1140, 500, 0.82, wallTone(c, 0.2), c.p.glow),
      bronzeSea(680, 514, 1.42, c.p.accent, c.p.near, c.p.accentDeep),
      person(370, 514, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 5: the priests carry the ark into the house; the cloud of the glory of the LORD fills it
  '2-kronieken-bijbelquiz-deel-5': {
    hue: 148,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1020, sunY: 250, far: 'none', ground: 'flat', horizon: 500 }),
      sanctuary(1030, 500, 0.98, wallTone(c, 0.22), c.p.light),
      c.soft(1030, 300, 300, 0.6, '#FFFFFF'),
      cloudBank(c.rand, 1030, 300, 1.5, '#FFFFFF', { opacity: 0.85 }),
      cloudBank(c.rand, 980, 236, 1.1, '#FFFFFF', { opacity: 0.65 }),
      arkOfCovenant(600, 424, 1.02, c.p.accent, c.p.accentDeep),
      person(490, 514, 1.15, c.p.fore, 'walk'),
      person(712, 514, 1.15, c.p.fore, 'walk'),
      trumpeter(300, 514, 1.05, c.p.near, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 6: Salomo kneels on the bronze scaffold in the court and spreads his hands toward heaven
  '2-kronieken-bijbelquiz-deel-6': {
    hue: 150,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 220, sunR: 70, rays: true, far: 'none', ground: 'flat', horizon: 500 }),
      sanctuary(1100, 500, 0.88, wallTone(c, 0.2), c.p.glow),
      rect(600, 424, 220, 78, c.p.accent),
      rect(588, 412, 244, 14, c.p.accent, { rx: 3 }),
      rect(600, 450, 220, 6, c.p.accentDeep, { opacity: 0.5 }),
      fig(712, 414, 1.38, c.p.fore, 'kneelUp', { flip: true }),
      crown(710, 293, 0.24, c.p.crop),
      crowd(c.rand, 360, 522, 0.9, c.p.near, 5, 280),
      person(900, 524, 0.95, c.p.near, 'raise'),
      fg(c, 686, 14),
    ],
  },

  // 7: fire comes down from heaven and consumes the burnt offering; the people bow with their faces to the pavement
  '2-kronieken-bijbelquiz-deel-7': {
    hue: 152,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 130, far: 'ridge', ground: 'flat', horizon: 500 }),
      sanctuary(1130, 500, 0.78, wallTone(c, 0.2), c.p.light),
      shafts(704, 50, 280, 320, c.p.glow, 5),
      c.soft(704, 320, 240, 0.45),
      rotate(180, 650, 210, flame(650, 240, 0.7, c.p.accent, { opacity: 0.55 })),
      rotate(180, 760, 180, flame(760, 210, 0.55, c.p.accent, { opacity: 0.45 })),
      hornedAltar(704, 502, 1.25, c.p.near, c.p.fore),
      blaze(704, 378, 1.15, c.p.accent, c.p.crop),
      fig(420, 514, 1.25, c.p.fore, 'fallen'),
      fig(270, 520, 1.0, c.p.near, 'fallen'),
      fig(990, 516, 1.2, c.p.fore, 'fallen', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 8: Huram's ships sail with Salomo's servants to Ophir and bring back four hundred and fifty talents of gold
  '2-kronieken-bijbelquiz-deel-8': {
    hue: 154,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 240, far: 'dunes', ground: 'water', horizon: 470 }),
      path(`M 900 ${H} L 900 506 L 930 488 L ${W + 20} 488 L ${W + 20} ${H} Z`, wallTone(c, 0.12)),
      palm(1250, 490, 1.15, c.p.near),
      ship(620, 520, 1.45, c.p.near, c.p.light),
      chest(1010, 490, 1.05, c.p.accent, c.p.accentDeep, false),
      coin(1080, 482, 0.9, c.p.accent),
      coin(1102, 486, 0.8, c.p.accent),
      person(1160, 490, 1.15, c.p.fore, 'point'),
      fg(c, 702, 10),
    ],
  },

  // 9: the queen of Sheba comes with camels bearing spices and gold; Salomo's great throne of ivory overlaid with gold, lions on the steps
  '2-kronieken-bijbelquiz-deel-9': {
    hue: 156,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 250, far: 'dunes', ground: 'flat', horizon: 500 }),
      columns(1250, 500, 1.25, wallTone(c, 0.28), 2),
      rect(890, 488, 260, 14, wallTone(c, 0.42)),
      rect(910, 474, 220, 14, wallTone(c, 0.42)),
      rect(930, 460, 180, 14, wallTone(c, 0.42)),
      throne(1020, 462, 1.2, c.p.accent),
      fig(1020, 400, 1.0, c.p.fore, 'sit'),
      crown(1020, 303, 0.22, c.p.crop),
      lion(905, 488, 0.32, c.p.near),
      flipX(1135, lion(1135, 488, 0.32, c.p.near)),
      camel(290, 506, 1.0, c.p.near, { flip: true, opacity: 0.85 }),
      camel(490, 514, 1.18, c.p.near, { flip: true }),
      person(720, 514, 1.3, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 10: Rehabeam answers roughly - "my father made your yoke heavy" - and Israel goes to its tents
  '2-kronieken-bijbelquiz-deel-10': {
    hue: 158,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 476 }),
      rect(240, 444, 180, 36, wallTone(c, 0.35)),
      rect(226, 434, 208, 12, wallTone(c, 0.35), { rx: 3 }),
      person(330, 436, 1.3, c.p.fore, 'point'),
      crown(330, 274, 0.26, c.p.crop),
      tent(1130, 478, 0.95, c.p.near),
      tent(1250, 470, 0.7, c.p.near, { opacity: 0.8 }),
      tent(1020, 474, 0.6, c.p.near, { opacity: 0.7 }),
      person(660, 494, 1.0, c.p.near, 'walk'),
      person(770, 500, 1.1, c.p.fore, 'walk'),
      person(880, 490, 0.9, c.p.near, 'walk'),
      person(960, 496, 0.95, c.p.near, 'walk'),
      yoke(590, 590, 1.55, c.p.accent, true),
      fg(c, 690, 12),
    ],
  },

  // 11: Rehabeam builds cities for defence in Judah and fills them with captains and stores of food, oil and wine
  '2-kronieken-bijbelquiz-deel-11': {
    hue: 160,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      wallRun(600, 1330, 500, 112, wallTone(c, 0.28), { courses: c.p.light }),
      gatehouse(880, 500, 1.02, wallTone(c, 0.36), { inside: mix(c.a.near, c.a.figure, 0.45) }),
      spear(1036, 516, 0.85, c.p.fore),
      person(1050, 516, 1.15, c.p.fore, 'stand'),
      shield(1086, 504, 0.62, c.p.near),
      jar(400, 518, 0.92, c.p.accent),
      jar(476, 522, 1.08, c.p.accent),
      jar(548, 518, 0.86, c.p.accent),
      person(260, 518, 1.2, c.p.fore, 'carry'),
      jar(260, 362, 0.6, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 12: Sisak king of Egypt comes up against Jerusalem and carries away the treasures and the golden shields
  '2-kronieken-bijbelquiz-deel-12': {
    hue: 162,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 240, far: 'dunes', horizon: 476 }),
      pyramids(330, 470, 0.9, c.p.far, { opacity: 0.8 }),
      citySkyline(c.rand, 1190, 470, 0.55, c.p.far, 5, { opacity: 0.6 }),
      horse(500, 510, 1.05, c.p.near),
      chariot(690, 510, 1.1, c.p.near),
      person(690, 472, 0.95, c.p.fore, 'stand'),
      shield(730, 452, 0.5, c.p.accent),
      person(880, 514, 1.15, c.p.fore, 'walk'),
      shield(880, 470, 0.72, c.p.accent),
      person(1020, 510, 1.05, c.p.near, 'walk'),
      shield(1020, 472, 0.66, c.p.accent),
      fg(c, 684, 16),
    ],
  },

  // 13: Abia speaks from mount Zemaraim; the priests sound the trumpets, Judah shouts and God strikes Jerobeam's army
  '2-kronieken-bijbelquiz-deel-13': {
    hue: 164,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'ridge', horizon: 480 }),
      path('M 120 500 C 200 410 290 350 390 346 C 490 350 560 420 640 500 Z', c.p.mid),
      person(390, 350, 0.95, c.p.fore, 'raise'),
      crown(390, 231, 0.2, c.p.crop),
      spear(940, 494, 0.55, c.p.mid),
      spear(1010, 490, 0.55, c.p.mid),
      spear(1080, 494, 0.55, c.p.mid),
      spear(1150, 490, 0.55, c.p.mid),
      spear(1220, 494, 0.55, c.p.mid),
      crowd(c.rand, 1080, 496, 0.75, c.p.mid, 7, 300),
      trumpeter(640, 516, 1.25, c.p.fore, c.p.accent),
      trumpeter(790, 520, 1.12, c.p.fore, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 14: Asa cries to the LORD before the million-strong host of Zerah the Cushite - "it is nothing with Thee to help"
  '2-kronieken-bijbelquiz-deel-14': {
    hue: 166,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 220, far: 'dunes', ground: 'flat', horizon: 486 }),
      crowd(c.rand, 960, 488, 0.55, c.p.far, 18, 620),
      chariot(760, 488, 0.5, c.p.far),
      chariot(1150, 488, 0.5, c.p.far),
      shafts(470, 90, 160, 320, c.p.glow, 3),
      person(300, 518, 1.05, c.p.near, 'stand'),
      person(220, 522, 0.95, c.p.near, 'stand'),
      fig(470, 524, 1.45, c.p.fore, 'kneelUp'),
      crown(472, 398, 0.25, c.p.crop),
      spear(640, 528, 0.75, c.p.near, { rot: 8 }),
      shield(612, 530, 1.0, c.p.accent, c.p.light),
      fg(c, 686, 14),
    ],
  },

  // 15: Asa cuts down Maacha's idol, stamps it and burns it at the brook Kidron; the people swear the covenant
  '2-kronieken-bijbelquiz-deel-15': {
    hue: 168,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 270, far: 'ridge', horizon: 470 }),
      river(470, c.p.water, { opacity: 0.85 }),
      crowd(c.rand, 1050, 500, 0.9, c.p.near, 5, 260),
      smokeColumn(c.rand, 470, 430, 1.0, c.p.mid),
      rotate(-74, 470, 524, idol(470, 524, 0.85, c.p.near)),
      fireBed(c.rand, 470, 530, 0.95, c.p.accent, 6),
      person(260, 524, 1.3, c.p.fore, 'point'),
      crown(260, 362, 0.26, c.p.crop),
      fg(c, 686, 14),
    ],
  },

  // 16: Asa sends the silver and gold of the house of the LORD to Ben-Hadad of Syria at Damascus
  '2-kronieken-bijbelquiz-deel-16': {
    hue: 170,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 230, far: 'ridge', horizon: 476 }),
      citySkyline(c.rand, 1180, 470, 0.55, c.p.far, 5, { opacity: 0.7 }),
      columns(250, 500, 1.15, wallTone(c, 0.3), 3),
      person(390, 514, 1.25, c.p.fore, 'point'),
      crown(390, 358, 0.26, c.p.crop),
      flipX(700, donkey(700, 514, 1.15, c.p.near)),
      chest(700, 436, 0.78, c.p.accent, c.p.accentDeep, false),
      person(890, 514, 1.15, c.p.fore, 'walk'),
      fg(c, 686, 14),
    ],
  },

  // 17: Josafat sends princes and Levites through the cities of Judah to teach the people from the book of the law
  '2-kronieken-bijbelquiz-deel-17': {
    hue: 172,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'dunes', horizon: 480 }),
      houseBlock(c.rand, 1030, 486, 0.9, c.p.near, { opacity: 0.8 }),
      houseBlock(c.rand, 1210, 480, 0.75, c.p.near, { opacity: 0.7 }),
      figWith(470, 516, 1.35, c.p.fore, 'reach', openScroll(92, -84, 0.5, c.p.accent, c.p.accentDeep, c.p.accentDeep)),
      fig(690, 520, 0.95, c.p.near, 'sit'),
      fig(790, 516, 0.9, c.p.near, 'sit'),
      fig(890, 520, 0.95, c.p.near, 'sit'),
      fig(750, 546, 1.1, c.p.fore, 'sit'),
      fig(860, 550, 1.05, c.p.fore, 'sit'),
      fg(c, 686, 14),
    ],
  },

  // 18: Micha: "I saw all Israel scattered upon the mountains, as sheep that have no shepherd" - Achab falls by an arrow drawn at a venture
  '2-kronieken-bijbelquiz-deel-18': {
    hue: 174,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 300, sunR: 60, far: 'ridge', horizon: 470 }),
      path('M 60 540 C 260 430 480 410 700 440 C 880 466 1040 430 1360 448 L 1360 800 L 60 800 Z', c.p.mid),
      lamb(290, 476, 1.0, c.p.light, c.p.near),
      lamb(430, 448, 0.75, c.p.light, c.p.near),
      lamb(580, 452, 0.85, c.p.light, c.p.near, { flip: true }),
      lamb(880, 474, 0.9, c.p.light, c.p.near),
      lamb(1020, 452, 0.72, c.p.light, c.p.near, { flip: true }),
      lamb(1190, 466, 0.85, c.p.light, c.p.near),
      rotate(-20, 650, 566, crown(650, 566, 0.85, c.p.accent)),
      arrow(790, 470, 0.95, c.p.fore, { rot: 64 }),
      fg(c, 690, 12),
    ],
  },

  // 19: Josafat sets judges in the cities - "take heed: ye judge not for man but for the LORD, with Him is no respect of persons"
  '2-kronieken-bijbelquiz-deel-19': {
    hue: 176,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 230, far: 'ridge', ground: 'flat', horizon: 500 }),
      wallRun(840, 1330, 500, 118, wallTone(c, 0.28), { courses: c.p.light }),
      gatehouse(1040, 500, 1.0, wallTone(c, 0.36), { inside: mix(c.a.near, c.a.figure, 0.45) }),
      rect(560, 478, 250, 14, wallTone(c, 0.5), { rx: 3 }),
      rect(570, 490, 12, 22, wallTone(c, 0.5)),
      rect(790, 490, 12, 22, wallTone(c, 0.5)),
      fig(610, 482, 0.95, c.p.fore, 'sit'),
      fig(690, 482, 0.95, c.p.fore, 'sit'),
      fig(770, 482, 0.95, c.p.fore, 'sit'),
      scales(440, 514, 1.05, c.p.accent, -8),
      person(290, 516, 1.15, c.p.fore, 'point'),
      person(200, 520, 1.0, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 20: Josafat appoints singers to go before the army praising "the beauty of holiness" - the battle is the LORD's
  '2-kronieken-bijbelquiz-deel-20': {
    hue: 178,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 290, sunR: 70, rays: true, far: 'ridge', horizon: 480 }),
      spear(240, 500, 0.7, c.p.near),
      spear(310, 496, 0.7, c.p.near),
      spear(380, 500, 0.7, c.p.near),
      spear(450, 496, 0.7, c.p.near),
      crowd(c.rand, 345, 500, 0.95, c.p.near, 6, 260),
      lyrePlayer(620, 508, 1.05, c.p.near, c.p.accent),
      lyrePlayer(760, 512, 1.15, c.p.fore, c.p.accent),
      lyrePlayer(900, 516, 1.25, c.p.fore, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 21: Joram's wicked reign - yet the LORD would not destroy David's house, "as He promised to give a light to him and to his sons"
  '2-kronieken-bijbelquiz-deel-21': {
    hue: 180,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'ridge', ground: 'flat', horizon: 500 }),
      streaks(c.rand, 100, 120, W - 200, 380, c.p.light, 60, { opacity: 0.3 }),
      columns(330, 500, 1.3, wallTone(c, 0.3), 2),
      rotate(-82, 470, 500, rect(462, 380, 18, 120, wallTone(c, 0.3))),
      throne(1060, 500, 1.1, wallTone(c, 0.38), { opacity: 0.85 }),
      rect(630, 410, 150, 92, wallTone(c, 0.45)),
      rect(618, 398, 174, 14, wallTone(c, 0.45), { rx: 3 }),
      c.soft(740, 300, 200, 0.6),
      oilLamp(680, 398, 1.6, c.p.near, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 22: Athalia destroys the royal seed; Josabath steals the baby Joas away and hides him in the house of God
  '2-kronieken-bijbelquiz-deel-22': {
    hue: 182,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 290, sunY: 210, sunR: 42, far: 'none', ground: 'flat', horizon: 500 }),
      houseBlock(c.rand, 300, 500, 1.0, c.p.near, { opacity: 0.75 }),
      sanctuary(1050, 500, 0.98, wallTone(c, 0.24), c.p.glow),
      c.soft(1050, 450, 120, 0.5),
      figWith(740, 514, 1.32, c.p.fore, 'carry', swaddled(4, -118, 1.75, c.p.accent)),
      fg(c, 686, 14),
    ],
  },

  // 23: Jojada brings out the king's son by his pillar, puts the crown on him - "God save the king"
  '2-kronieken-bijbelquiz-deel-23': {
    hue: 184,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, rays: true, far: 'none', ground: 'flat', horizon: 500 }),
      templePillar(650, 514, 0.95, wallTone(c, 0.38), wallTone(c, 0.55)),
      spear(420, 516, 0.95, c.p.fore),
      person(436, 516, 1.12, c.p.near, 'stand'),
      spear(1110, 516, 0.95, c.p.fore),
      person(1126, 516, 1.12, c.p.near, 'stand'),
      person(760, 516, 0.82, c.p.fore, 'stand'),
      crown(760, 396, 0.48, c.p.accent),
      fig(900, 516, 1.3, c.p.fore, 'bless', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 24: Joas sets a chest with a hole in its lid at the gate of the house of the LORD; all the people bring in the tax
  '2-kronieken-bijbelquiz-deel-24': {
    hue: 186,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      gatehouse(450, 500, 1.08, wallTone(c, 0.3), { inside: c.p.glow }),
      chest(700, 518, 1.3, c.p.accent, c.p.accentDeep, true),
      fig(780, 518, 1.25, c.p.fore, 'reach', { flip: true }),
      coin(714, 404, 0.45, c.p.accent),
      person(920, 518, 1.1, c.p.near, 'carry'),
      basket(920, 370, 0.6, c.p.near),
      person(1040, 514, 1.0, c.p.near, 'stand'),
      person(1150, 514, 0.95, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 25: Amazia beats Edom in the Valley of Salt, then brings home their gods and bows down before them
  '2-kronieken-bijbelquiz-deel-25': {
    hue: 188,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'ridge', ground: 'flat', horizon: 486 }),
      ellipse(704, 560, 760, 74, '#FFFFFF', { opacity: 0.4 }),
      idol(390, 500, 0.8, c.p.accent, { opacity: 0.9 }),
      idol(640, 500, 0.8, c.p.accent, { opacity: 0.9 }),
      idol(515, 506, 1.0, c.p.accent),
      fig(840, 520, 1.3, c.p.fore, 'kneelFwd', { flip: true }),
      crown(838, 406, 0.24, c.p.crop),
      fig(1100, 516, 1.25, c.p.fore, 'reach', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 26: Uzzia goes into the temple to burn incense; the priests withstand him and leprosy rises in his forehead
  '2-kronieken-bijbelquiz-deel-26': {
    hue: 190,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 210, far: 'none', ground: 'flat', horizon: 500 }),
      columns(230, 500, 1.35, wallTone(c, 0.3), 2),
      columns(1190, 500, 1.35, wallTone(c, 0.3), 2),
      hornedAltar(700, 504, 0.78, c.p.near, c.p.fore),
      figWith(500, 516, 1.35, c.p.fore, 'reach', censer(80, -103, 1.05, c.p.accent, c.p.light)),
      crown(500, 347, 0.26, c.p.crop),
      person(880, 516, 1.25, c.p.fore, 'raise'),
      person(990, 516, 1.12, c.p.near, 'raise'),
      person(1080, 520, 1.0, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 27: Jotham builds the high gate of the house of the LORD, and castles and towers in the forests
  '2-kronieken-bijbelquiz-deel-27': {
    hue: 192,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, far: 'ridge', horizon: 476 }),
      path('M 820 500 C 900 420 1000 380 1100 376 C 1200 374 1280 400 1380 430 L 1380 800 L 820 800 Z', c.p.mid),
      tower(1080, 396, 0.9, wallTone(c, 0.38)),
      tree(980, 440, 0.95, c.p.near),
      tree(1180, 404, 0.85, c.p.near),
      tree(1290, 430, 0.9, c.p.near),
      wallRun(240, 480, 500, 100, wallTone(c, 0.28), { courses: c.p.light }),
      wallRun(720, 860, 500, 100, wallTone(c, 0.28), { courses: c.p.light }),
      gatehouse(600, 500, 1.15, wallTone(c, 0.36), { doors: c.p.accent, seam: c.p.accentDeep }),
      person(860, 516, 1.15, c.p.fore, 'carry'),
      rect(832, 324, 56, 34, wallTone(c, 0.5), { rx: 3 }),
      fg(c, 686, 14),
    ],
  },

  // 28: Achaz shuts up the doors of the house of the LORD and makes altars in every corner of Jerusalem
  '2-kronieken-bijbelquiz-deel-28': {
    hue: 194,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'dunes', ground: 'flat', horizon: 500 }),
      sanctuary(704, 500, 1.05, wallTone(c, 0.24), c.p.accent),
      path('M 664 500 L 664 410 A 40 40 0 0 1 744 410 L 744 500 Z', c.p.accent),
      rect(702, 374, 4, 126, c.p.accentDeep),
      rect(654, 438, 100, 12, c.p.accentDeep, { rx: 4 }),
      smokeColumn(c.rand, 280, 430, 0.9, c.p.fore),
      stoneAltar(280, 516, 0.62, wallTone(c, 0.45), c.p.light),
      fireBed(c.rand, 280, 466, 0.45, c.p.crop, 3),
      smokeColumn(c.rand, 1130, 430, 0.9, c.p.fore),
      stoneAltar(1130, 516, 0.62, wallTone(c, 0.45), c.p.light),
      fireBed(c.rand, 1130, 466, 0.45, c.p.crop, 3),
      person(440, 520, 1.2, c.p.fore, 'point'),
      crown(440, 370, 0.24, c.p.crop),
      fg(c, 686, 14),
    ],
  },

  // 29: Hizkia opens the doors of the house of the LORD and repairs them; the Levites carry the uncleanness out
  '2-kronieken-bijbelquiz-deel-29': {
    hue: 196,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 240, rays: true, far: 'none', ground: 'flat', horizon: 500 }),
      path('M 610 500 L 670 500 L 820 700 L 460 700 Z', '#FFFFFF', { opacity: 0.35 }),
      sanctuary(640, 500, 1.1, wallTone(c, 0.24), '#FFFFFF'),
      c.soft(640, 440, 150, 0.6, '#FFFFFF'),
      path('M 611 500 L 611 386 L 586 394 L 586 506 Z', c.p.accent),
      path('M 669 500 L 669 386 L 694 394 L 694 506 Z', c.p.accent),
      person(880, 516, 1.18, c.p.fore, 'carry'),
      basket(880, 364, 0.68, c.p.near),
      person(1010, 520, 1.05, c.p.near, 'carry'),
      basket(1010, 384, 0.6, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 30: runners go with letters from the king through all Israel, from Beersheba to Dan: "turn again unto the LORD" - come to the passover
  '2-kronieken-bijbelquiz-deel-30': {
    hue: 198,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 220, far: 'ridge', horizon: 470 }),
      trail(380, H, 1080, 470, 110, '#FFFFFF', { opacity: 0.4 }),
      citySkyline(c.rand, 1180, 470, 0.5, c.p.far, 4, { opacity: 0.7 }),
      citySkyline(c.rand, 260, 474, 0.45, c.p.far, 3, { opacity: 0.6 }),
      figWith(560, 520, 1.35, c.p.fore, 'bless', letterRoll(84, -174, 1.25, c.p.accent)),
      figWith(900, 492, 0.95, c.p.near, 'bless', letterRoll(84, -174, 1.25, c.p.accent)),
      fg(c, 686, 14),
    ],
  },

  // 31: the people bring in the tithes and lay them by heaps; Hizkia and the princes come and bless the LORD
  '2-kronieken-bijbelquiz-deel-31': {
    hue: 200,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      sanctuary(330, 500, 0.82, wallTone(c, 0.2), c.p.glow),
      heap(680, 518, 1.2, c.p.accent, c.p.accentDeep),
      heap(900, 522, 0.95, c.p.accent, c.p.accentDeep),
      person(1100, 520, 1.15, c.p.fore, 'carry'),
      sheaf(1100, 380, 0.75, c.p.crop),
      fig(520, 522, 1.25, c.p.fore, 'bless'),
      crown(520, 366, 0.24, c.p.crop),
      fg(c, 686, 14),
    ],
  },

  // 32: Sanherib besieges Jerusalem; the LORD sends an angel who cuts off the mighty men in the camp of the king of Assyria
  '2-kronieken-bijbelquiz-deel-32': {
    hue: 202,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1200, sunY: 190, sunR: 40, far: 'dunes', horizon: 480 }),
      path('M 1010 500 C 1060 440 1140 420 1240 418 C 1300 418 1360 430 1400 440 L 1400 800 L 1010 800 Z', c.p.mid),
      wallRun(1100, 1330, 432, 62, wallTone(c, 0.3)),
      tent(250, 498, 0.8, c.p.near),
      tent(380, 490, 0.62, c.p.near, { opacity: 0.85 }),
      tent(500, 500, 0.85, c.p.near),
      tent(640, 492, 0.6, c.p.near, { opacity: 0.85 }),
      tent(770, 500, 0.82, c.p.near),
      tent(900, 494, 0.62, c.p.near, { opacity: 0.85 }),
      c.soft(600, 270, 220, 0.45),
      angel(600, 360, 1.15, c.p.light, { opacity: 0.92 }),
      sword(680, 300, 0.85, c.p.accent, { rot: 18 }),
      fg(c, 686, 14),
    ],
  },

  // 33: Manasse is taken with hooks and fetters to Babylon; in his affliction he humbles himself and prays, and God hears him
  '2-kronieken-bijbelquiz-deel-33': {
    hue: 204,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 300, far: 'dunes', ground: 'flat', horizon: 500 }),
      ziggurat(1040, 500, 1.4, wallTone(c, 0.24)),
      prisonBars(330, 512, 1.5, wallTone(c, 0.45)),
      shafts(640, 70, 160, 330, c.p.glow, 3),
      fig(620, 520, 1.45, c.p.fore, 'kneelUp'),
      chainLinks(672, 400, 1.0, c.p.accent),
      chainLinks(560, 500, 0.85, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 34: Hilkia the priest finds the book of the law in the house of the LORD; Josia hears it and tears his clothes
  '2-kronieken-bijbelquiz-deel-34': {
    hue: 206,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 230, far: 'none', ground: 'flat', horizon: 500 }),
      sanctuary(1080, 500, 0.95, wallTone(c, 0.22), c.p.glow),
      c.soft(780, 300, 160, 0.55),
      figWith(780, 516, 1.35, c.p.fore, 'raise', openScroll(0, -218, 0.48, c.p.accent, c.p.accentDeep, c.p.accentDeep)),
      fig(540, 522, 1.4, c.p.fore, 'kneel'),
      crown(542, 396, 0.24, c.p.crop),
      fg(c, 686, 14),
    ],
  },

  // 35: Josia keeps a great passover - lambs from the flocks, roasted with fire, the singers in their place
  '2-kronieken-bijbelquiz-deel-35': {
    hue: 208,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 260, far: 'ridge', horizon: 480 }),
      lamb(260, 514, 1.0, c.p.light, c.p.near),
      lamb(360, 500, 0.82, c.p.light, c.p.near),
      lamb(420, 524, 1.1, c.p.light, c.p.near),
      blaze(660, 524, 0.95, c.p.accent, c.p.crop),
      cookPot(660, 470, 1.15, c.p.near),
      fireBed(c.rand, 660, 528, 0.55, c.p.accent, 5),
      smokeColumn(c.rand, 660, 380, 0.65, c.p.mid),
      person(880, 516, 1.25, c.p.fore, 'stand'),
      person(990, 520, 1.12, c.p.near, 'raise'),
      person(1090, 514, 1.0, c.p.near, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 36: the Chaldeans burn the house of God and break down the wall of Jerusalem; the rest are carried away to Babylon
  '2-kronieken-bijbelquiz-deel-36': {
    hue: 210,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 470 }),
      path('M 760 500 C 840 420 960 386 1080 384 C 1200 384 1300 410 1400 440 L 1400 800 L 760 800 Z', c.p.mid),
      sanctuary(1080, 404, 0.55, wallTone(c, 0.32)),
      wallRun(860, 1330, 420, 54, wallTone(c, 0.3), { gaps: [[960, 1010], [1190, 1240]] }),
      smokeColumn(c.rand, 1080, 300, 1.6, c.p.fore),
      fireBed(c.rand, 1080, 400, 0.9, c.p.accent, 7),
      fireBed(c.rand, 1220, 420, 0.6, c.p.accent, 4),
      fig(330, 516, 1.05, c.p.near, 'walk', { flip: true }),
      fig(440, 520, 1.15, c.p.fore, 'walk', { flip: true }),
      fig(550, 514, 1.0, c.p.near, 'walk', { flip: true }),
      spear(690, 520, 0.95, c.p.fore),
      person(676, 520, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },
};
