/**
 * Covers for the 1 Koningen series, one scene per quiz. Each quiz covers one
 * chapter: `1-koningen-bijbelquiz-deel-<n>` is chapter n (1-22).
 *
 * Base hue 20, drifting two degrees per chapter. See
 * `quiz-cover-scene-kit.mts` for the house style; the motifs this book needs
 * beyond the primitives (temple, altar, cherubim, bronze sea, golden calf,
 * raven, ...) live in `quiz-cover-motifs-koningen-kron1.mts`.
 *
 * Chapters: Salomo op de muilezel gezalfd bij Gihon (1); David sterft, zijn
 * laatste opdracht aan Salomo (2); het oordeel van Salomo over de twee
 * moeders (3); ieder onder zijn wijnstok en vijgenboom (4); cederhout van
 * Hiram over zee (5); de gouden cherubs in het heilige der heiligen (6); de
 * koperen zee op twaalf runderen (7); de wolk vult het huis, Salomo's gebed
 * (8); de schepen van Ezeon-Geber halen goud uit Ofir (9); de koningin van
 * Scheba met haar kamelen (10); Ahia scheurt de mantel in twaalf stukken (11);
 * de gouden kalveren te Bethel en Dan (12); de leeuw en de ezel bij de man
 * Gods (13); Jerobeams vrouw vermomd bij de blinde Ahia (14); Asa hakt het
 * afgodsbeeld om bij de Kidron (15); Zimri en het brandende paleis te Tirza
 * (16); de raven bij de beek Krith (17); vuur van de HEERE op de Karmel (18);
 * Elia bij de spelonk op de Horeb (19); twee kleine kudden geiten tegenover
 * Syrie (20); de wijngaard van Naboth (21); schapen zonder herder, Achab valt
 * bij Ramoth (22).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  bird,
  boat,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  columns,
  crowd,
  crown,
  donkey,
  ellipse,
  fireBed,
  flame,
  houseBlock,
  lion,
  loaf,
  palm,
  path,
  person,
  rect,
  river,
  rotate,
  ship,
  shafts,
  shrub,
  smokeColumn,
  streaks,
  tent,
  throne,
  trail,
  tree,
  vineRow,
  water,
  window as windowFrame,
  basket,
  chariot,
  horse,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  arbor,
  bed,
  bronzeSea,
  camel,
  campTent,
  cedar,
  cherubPair,
  clothPieces,
  figureAt,
  goldenCalf,
  horn,
  idol,
  ingots,
  logPile,
  mirror,
  lying,
  mantle,
  personLeft,
  pitcher,
  raven,
  rubble,
  sheep,
  solomonTemple,
  spear,
  stoneAltar,
  sword,
  vine,
  wallTone,
} from './quiz-cover-motifs-koningen-kron1.mjs';

export const KONINGEN1_SCENES: Record<string, Scene> = {
  // 1: Salomo rijdt op Davids muilezel naar Gihon en Zadok zalft hem met de hoorn met olie
  '1-koningen-bijbelquiz-deel-1': {
    hue: 20,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 240, rays: true, far: 'ridge', horizon: 478 }),
      citySkyline(c.rand, 1160, 474, 0.7, c.p.far, 5, { opacity: 0.7 }),
      ellipse(250, 552, 150, 18, c.p.water),
      ellipse(250, 548, 110, 8, c.p.crest, { opacity: 0.4 }),
      crowd(c.rand, 1110, 532, 0.9, c.p.near, 4, 220),
      donkey(560, 544, 1.35, c.p.fore),
      person(570, 456, 1.1, c.p.fore, 'sit'),
      c.soft(600, 330, 120, 0.35),
      person(722, 546, 1.55, c.p.fore, 'raise'),
      rotate(-55, 672, 318, mirror(672, horn(672, 318, 0.8, c.p.accent))),
      circle(590, 340, 6, c.p.accent),
      fg(c, 692, 14),
    ],
  },

  // 2: "Ik ga de weg der ganse aarde" - David op zijn sterfbed, Salomo knielt, de kroon ligt klaar
  '1-koningen-bijbelquiz-deel-2': {
    hue: 22,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 300, far: 'none', ground: 'flat', horizon: 520 }),
      columns(190, 520, 1.5, c.p.near, 1, { opacity: 0.8 }),
      columns(1230, 520, 1.5, c.p.near, 1, { opacity: 0.8 }),
      c.soft(1120, 300, 200, 0.35),
      bed(600, 532, 1.45, c.p.near),
      lying(616, 471, 1.35, c.p.fore),
      rect(330, 438, 80, 94, c.p.near, { rx: 4 }),
      crown(370, 424, 0.62, c.p.accent),
      personLeft(930, 534, 1.55, c.p.fore, 'kneel'),
      fg(c, 694, 12),
    ],
  },

  // 3: "Deelt het levende kind in tweeen" - Salomo op de troon, de soldaat met het zwaard, de twee moeders
  '1-koningen-bijbelquiz-deel-3': {
    hue: 24,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'flat', horizon: 520 }),
      columns(170, 520, 1.4, c.p.near, 1, { opacity: 0.75 }),
      columns(1240, 520, 1.4, c.p.near, 1, { opacity: 0.75 }),
      throne(360, 522, 1.35, c.p.near),
      person(360, 486, 1.25, c.p.fore, 'sit'),
      crown(360, 352, 0.34, c.p.near),
      person(620, 524, 1.5, c.p.fore, 'stand'),
      sword(676, 410, 1.15, c.p.accent),
      personLeft(860, 526, 1.45, c.p.fore, 'kneel'),
      person(1060, 524, 1.45, c.p.fore, 'carry'),
      ellipse(1060, 436, 20, 13, c.p.light),
      fg(c, 694, 12),
    ],
  },

  // 4: "Juda en Israel woonden zeker, een iegelijk onder zijn wijnstok en onder zijn vijgenboom"
  '1-koningen-bijbelquiz-deel-4': {
    hue: 26,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 250, far: 'none', ground: 'water', horizon: 452 }),
      boat(1190, 452, 0.6, c.p.near, true, { opacity: 0.6 }),
      path(`M -20 520 C 220 488 520 486 800 500 C 1040 512 1240 492 ${W + 20} 500 L ${W + 20} ${H} L -20 ${H} Z`, c.p.mid),
      tree(980, 540, 1.75, c.p.near),
      arbor(520, 546, 1.3, c.p.near, c.p.mid, c.p.accent),
      person(430, 548, 1.3, c.p.fore, 'sit'),
      person(560, 550, 1.25, c.p.fore, 'sit'),
      person(650, 552, 0.82, c.p.fore, 'sit'),
      fg(c, 696, 12),
    ],
  },

  // 5: Hiram laat de cederen van de Libanon vellen en als vlotten over de zee drijven naar Salomo
  '1-koningen-bijbelquiz-deel-5': {
    hue: 28,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1100, sunY: 230, far: 'ridge', ground: 'water', horizon: 470 }),
      path(`M -40 470 C 120 380 260 330 380 344 C 470 356 520 420 560 470 L 560 ${H} L -40 ${H} Z`, c.p.mid),
      cedar(200, 420, 0.9, c.p.near),
      cedar(330, 374, 1.0, c.p.near),
      cedar(450, 430, 0.75, c.p.near, { opacity: 0.9 }),
      person(560, 512, 1.15, c.p.fore, 'carry'),
      rect(700, 500, 330, 22, c.p.accent, { rx: 10 }),
      rect(716, 478, 300, 22, c.p.accent, { rx: 10 }),
      rect(700, 500, 330, 4, c.p.accentDeep, { opacity: 0.6 }),
      person(900, 480, 1.15, c.p.fore, 'stand'),
      rect(946, 330, 6, 196, c.p.fore),
      ship(1200, 482, 0.6, c.p.near, c.p.light, { opacity: 0.7 }),
      water(c.rand, 530, c.p.water, c.p.crest, 2),
    ],
  },

  // 6: In het heilige der heiligen twee cherubs van olijfhout, met goud overtrokken, de vleugels raken elkaar
  '1-koningen-bijbelquiz-deel-6': {
    hue: 30,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 530 }),
      rect(120, 140, 1170, 390, wallTone(c.p.near), { opacity: 0.5 }),
      rect(120, 140, 1170, 22, wallTone(c.p.near), { opacity: 0.7 }),
      palm(200, 500, 0.9, c.p.mid, { opacity: 0.3 }),
      palm(1210, 500, 0.9, c.p.mid, { opacity: 0.3 }),
      c.soft(704, 360, 380, 0.65),
      cherubPair(704, 532, 1.2, c.p.accent),
      fg(c, 700, 10),
    ],
  },

  // 7: De koperen zee op twaalf runderen voor het huis des HEEREN, met de pilaren Jachin en Boaz
  '1-koningen-bijbelquiz-deel-7': {
    hue: 32,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'dunes', ground: 'flat', horizon: 516 }),
      solomonTemple(1050, 516, 0.9, c.p.near, c.p.fore),
      c.soft(580, 360, 260, 0.35),
      bronzeSea(580, 536, 1.0, c.p.accent, c.p.accentDeep, c.p.fore),
      person(250, 538, 1.35, c.p.fore, 'point'),
      fg(c, 694, 12),
    ],
  },

  // 8: "De wolk vervulde het huis des HEEREN" - Salomo spreidt zijn handen uit voor het altaar
  '1-koningen-bijbelquiz-deel-8': {
    hue: 34,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 860, sunY: 220, far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(860, 300, 340, 0.6),
      solomonTemple(860, 506, 0.92, c.p.near, c.p.light),
      cloudBank(c.rand, 860, 230, 1.6, '#FFFFFF', { opacity: 0.75 }),
      cloudBank(c.rand, 980, 300, 1.0, '#FFFFFF', { opacity: 0.6 }),
      shafts(860, 120, 260, 360, c.p.light, 5),
      altar(470, 530, 1.1, c.p.near),
      fireBed(c.rand, 470, 448, 0.75, c.p.accent, 5),
      person(300, 534, 1.32, c.p.fore, 'raise'),
      crowd(c.rand, 1180, 540, 0.8, c.p.near, 4, 180),
      fg(c, 694, 12),
    ],
  },

  // 9: Salomo's schepen te Ezeon-Geber aan de Schelfzee halen goud uit Ofir
  '1-koningen-bijbelquiz-deel-9': {
    hue: 36,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 290, far: 'dunes', ground: 'water', horizon: 448 }),
      ship(900, 476, 1.2, c.p.fore, c.p.light),
      ship(1180, 460, 0.7, c.p.near, c.p.light, { opacity: 0.75 }),
      path(`M -20 504 C 160 488 360 486 560 506 C 640 516 680 548 700 ${H} L -20 ${H} Z`, c.p.mid),
      ingots(470, 528, 0.95, c.p.accent),
      person(330, 530, 1.25, c.p.fore, 'carry'),
      rect(306, 434, 48, 14, c.p.accent, { rx: 3 }),
      palm(200, 520, 1.1, c.p.near),
      fg(c, 700, 12),
    ],
  },

  // 10: De koningin van Scheba komt met kamelen, beladen met specerijen, goud en edelgesteente
  '1-koningen-bijbelquiz-deel-10': {
    hue: 38,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 300, sunR: 66, far: 'dunes', horizon: 474 }),
      path('M 860 486 C 960 400 1060 380 1180 384 C 1260 388 1320 420 1380 486 Z', c.p.mid),
      citySkyline(c.rand, 1120, 386, 0.75, c.p.near, 5),
      cityWall(1120, 404, 0.7, c.p.near, 300),
      camel(320, 524, 0.85, c.p.near, c.p.accent, { opacity: 0.85 }),
      camel(500, 530, 1.0, c.p.fore, c.p.accent),
      person(700, 532, 1.3, c.p.fore, 'walk'),
      rect(690, 330, 20, 18, c.p.fore, { rx: 4 }),
      fg(c, 690, 14),
    ],
  },

  // 11: Ahia scheurt zijn nieuwe kleed in twaalf stukken: "Neem u tien stukken"
  '1-koningen-bijbelquiz-deel-11': {
    hue: 40,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 230, clouds: 3, far: 'ridge', horizon: 472 }),
      citySkyline(c.rand, 1120, 472, 0.6, c.p.far, 5, { opacity: 0.6 }),
      person(460, 536, 1.55, c.p.fore, 'raise'),
      clothPieces(c.rand, 620, 390, 1.15, c.p.accent, 10, 230),
      clothPieces(c.rand, 460, 300, 0.95, c.p.accent, 2, 70),
      personLeft(880, 538, 1.5, c.p.fore, 'point'),
      fg(c, 692, 16),
    ],
  },

  // 12: Jerobeam maakt twee gouden kalveren: "Ziedaar uw goden, Israel" - het ene te Bethel, het andere te Dan
  '1-koningen-bijbelquiz-deel-12': {
    hue: 42,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 300, far: 'ridge', horizon: 474 }),
      path('M 500 500 C 580 430 640 410 760 408 C 880 410 940 440 1020 500 Z', c.p.mid),
      goldenCalf(1190, 452, 0.38, c.p.accent, c.p.near, { opacity: 0.8 }),
      goldenCalf(760, 420, 1.0, c.p.accent, c.p.near),
      altar(960, 430, 0.6, c.p.near),
      smokeColumn(c.rand, 960, 360, 1.0, c.p.fore),
      person(420, 530, 1.32, c.p.fore, 'point'),
      person(600, 520, 1.0, c.p.fore, 'bow'),
      person(680, 536, 0.95, c.p.fore, 'bow'),
      fg(c, 690, 14),
    ],
  },

  // 13: De man Gods uit Juda ligt op de weg; de leeuw en de ezel staan erbij en de leeuw eet niet
  '1-koningen-bijbelquiz-deel-13': {
    hue: 44,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 260, far: 'ridge', horizon: 472 }),
      trail(240, H, 980, 472, 160, c.p.light, { opacity: 0.35 }),
      citySkyline(c.rand, 1110, 472, 0.55, c.p.far, 4, { opacity: 0.6 }),
      shrub(1230, 504, 1.2, c.p.near),
      lion(470, 536, 1.5, c.p.accent),
      person(720, 548, 1.2, c.p.fore, 'fallen'),
      donkey(950, 540, 1.25, c.p.fore),
      fg(c, 694, 14),
    ],
  },

  // 14: Jerobeams vrouw, verkleed, komt met broden en een kruik honing bij de blinde profeet Ahia te Silo
  '1-koningen-bijbelquiz-deel-14': {
    hue: 46,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 290, far: 'dunes', horizon: 474 }),
      houseBlock(c.rand, 1020, 524, 1.45, c.p.near),
      rect(1050, 440, 54, 84, c.p.fore, { opacity: 0.55 }),
      person(930, 534, 1.3, c.p.fore, 'sit'),
      rect(890, 470, 6, 66, c.p.fore),
      person(620, 538, 1.5, c.p.fore, 'carry'),
      basket(620, 448, 1.15, c.p.accent),
      loaf(600, 412, 0.55, c.p.accent),
      pitcher(644, 414, 0.62, c.p.accent),
      tree(300, 528, 1.2, c.p.near),
      fg(c, 694, 14),
    ],
  },

  // 15: Asa hakt het gruwelijke beeld van zijn moeder Maacha om en verbrandt het aan de beek Kidron
  '1-koningen-bijbelquiz-deel-15': {
    hue: 48,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 230, far: 'none', ground: 'flat', horizon: 500 }),
      path('M 760 506 C 860 400 960 360 1100 350 C 1220 344 1320 380 1460 420 L 1460 506 Z', c.p.mid),
      cityWall(1110, 362, 0.8, c.p.near, 360),
      citySkyline(c.rand, 1110, 314, 0.6, c.p.near, 5),
      path(`M -40 586 C 300 566 700 560 1000 572 C 1200 580 1340 576 ${W + 40} 570 L ${W + 40} 610 C 1000 604 400 612 -40 616 Z`, c.p.water),
      rotate(24, 760, 540, idol(760, 540, 1.25, c.p.accent)),
      rubble(c.rand, 780, 548, 160, 1, c.p.near, 5),
      person(500, 544, 1.55, c.p.fore, 'raise'),
      crown(500, 300, 0.3, c.p.fore),
      fg(c, 700, 10),
    ],
  },

  // 16: Zimri ziet dat de stad Tirza ingenomen is en steekt het koningshuis boven zich in brand
  '1-koningen-bijbelquiz-deel-16': {
    hue: 50,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 480 }),
      smokeColumn(c.rand, 720, 260, 2.0, c.p.light),
      c.soft(720, 380, 280, 0.45, c.p.accent),
      houseBlock(c.rand, 720, 500, 2.0, c.p.near),
      windowFrame(660, 430, 0.5, c.p.near, c.p.accent),
      windowFrame(790, 430, 0.5, c.p.near, c.p.accent),
      fireBed(c.rand, 720, 302, 1.5, c.p.accent, 8),
      fireBed(c.rand, 860, 210, 0.9, c.p.accent, 3),
      campTent(240, 532, 0.9, c.p.near, c.p.fore),
      campTent(1180, 536, 0.95, c.p.near, c.p.fore),
      person(380, 540, 1.2, c.p.fore, 'stand'),
      spear(420, 548, 0.85, c.p.fore),
      personLeft(1040, 544, 1.2, c.p.fore, 'stand'),
      spear(1000, 552, 0.85, c.p.fore),
      fg(c, 694, 12),
    ],
  },

  // 17: Elia aan de beek Krith; de raven brengen hem brood en vlees, des morgens en des avonds
  '1-koningen-bijbelquiz-deel-17': {
    hue: 52,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 330, far: 'none', horizon: 480 }),
      path('M -40 120 C 120 180 300 320 420 520 L -40 520 Z', c.p.mid),
      path(`M ${W + 40} 140 C 1300 200 1120 320 1000 520 L ${W + 40} 520 Z`, c.p.mid),
      path(`M 300 540 C 500 520 900 520 1100 540 C 1000 570 600 576 300 540 Z`, c.p.water),
      person(430, 548, 1.6, c.p.fore, 'kneel'),
      raven(780, 330, 1.3, c.p.fore),
      circle(674, 325, 13, c.p.accent),
      raven(1010, 250, 0.9, c.p.fore, { opacity: 0.85 }),
      circle(937, 246, 9, c.p.accent),
      fg(c, 696, 12),
    ],
  },

  // 18: Elia op de Karmel: "Toen viel het vuur des HEEREN, en verteerde het brandoffer, en het hout, en de stenen"
  '1-koningen-bijbelquiz-deel-18': {
    hue: 54,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 760, sunY: 120, clouds: 2, far: 'ridge', horizon: 472 }),
      path('M 380 500 C 480 420 580 390 760 386 C 940 390 1040 420 1140 500 Z', c.p.mid),
      shafts(760, 80, 160, 330, c.p.light, 5),
      c.soft(760, 330, 220, 0.55, c.p.accent),
      ellipse(760, 392, 150, 16, c.p.water),
      stoneAltar(760, 392, 1.0, c.p.near),
      fireBed(c.rand, 760, 306, 1.4, c.p.accent, 7),
      person(420, 532, 1.35, c.p.fore, 'raise'),
      person(1060, 530, 0.95, c.p.fore, 'bow'),
      person(1150, 536, 0.9, c.p.fore, 'bow'),
      person(1240, 528, 0.85, c.p.fore, 'fallen'),
      fg(c, 692, 14),
    ],
  },

  // 19: Elia bij de spelonk op de Horeb: storm, aardbeving, vuur - en een zachte stille stem; hij bewindt zijn aangezicht met zijn mantel
  '1-koningen-bijbelquiz-deel-19': {
    hue: 56,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 260, far: 'none', horizon: 486 }),
      streaks(c.rand, 600, 120, 760, 300, c.p.light, 40, { opacity: 0.5 }),
      path('M 40 540 C 120 360 260 160 420 140 C 560 130 700 260 820 540 Z', c.p.mid),
      path('M 330 540 L 330 420 C 330 360 470 360 470 420 L 470 540 Z', c.p.fore, { opacity: 0.75 }),
      c.soft(980, 330, 220, 0.4),
      person(470, 542, 1.3, c.p.fore, 'stand'),
      mantle(470, 362, 0.95, c.p.accent),
      rubble(c.rand, 760, 548, 220, 1.1, c.p.near, 8),
      fg(c, 694, 14),
    ],
  },

  // 20: Israel legert zich tegenover Syrie als twee kleine kudden geiten, maar de Syriers vervullen het land
  '1-koningen-bijbelquiz-deel-20': {
    hue: 58,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 230, sunY: 230, far: 'ridge', horizon: 470 }),
      ...[780, 900, 1020, 1140, 1260].map((tx, i) => campTent(tx, 488 + (i % 2) * 6, 0.45, c.p.far)),
      crowd(c.rand, 1010, 506, 0.55, c.p.far, 16, 560),
      crowd(c.rand, 1000, 520, 0.62, c.p.near, 12, 520),
      chariot(1180, 532, 0.6, c.p.near),
      horse(1080, 532, 0.55, c.p.near),
      crowd(c.rand, 330, 538, 1.1, c.p.fore, 3, 120),
      crowd(c.rand, 560, 542, 1.1, c.p.fore, 3, 120),
      rect(442, 318, 6, 226, c.p.fore),
      path('M 448 322 L 534 338 L 512 366 L 534 394 L 448 378 Z', c.p.accent),
      fg(c, 696, 14),
    ],
  },

  // 21: De wijngaard van Naboth naast het paleis van Achab te Jizreel
  '1-koningen-bijbelquiz-deel-21': {
    hue: 60,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'dunes', horizon: 470 }),
      houseBlock(c.rand, 1110, 500, 1.35, c.p.near),
      windowFrame(1080, 438, 0.6, c.p.near, c.p.light),
      person(1080, 420, 0.46, c.p.fore, 'point'),
      vine(260, 500, 0.85, c.p.near, c.p.accent),
      vine(420, 504, 0.85, c.p.near, c.p.accent),
      vine(580, 508, 0.85, c.p.near, c.p.accent),
      vine(330, 556, 1.15, c.p.fore, c.p.accent),
      vine(540, 560, 1.15, c.p.fore, c.p.accent),
      person(800, 546, 1.5, c.p.fore, 'stand'),
      fg(c, 700, 12),
    ],
  },

  // 22: "Ik zag gans Israel verstrooid op de bergen als schapen die geen herder hebben" - Achab valt bij Ramoth in Gilead
  '1-koningen-bijbelquiz-deel-22': {
    hue: 62,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 330, sunR: 64, far: 'ridge', horizon: 476 }),
      chariot(1040, 476, 0.6, c.p.near, { opacity: 0.7 }),
      horse(960, 476, 0.5, c.p.near, { opacity: 0.7 }),
      path('M -40 520 C 160 440 340 420 520 450 C 640 470 700 500 760 530 L -40 560 Z', c.p.mid),
      sheep(290, 476, 1.0, c.p.light, c.p.fore),
      sheep(470, 452, 0.85, c.p.light, c.p.fore, true),
      sheep(640, 500, 1.0, c.p.light, c.p.fore),
      sheep(880, 536, 1.15, c.p.light, c.p.fore, true),
      sheep(400, 548, 1.25, c.p.light, c.p.fore, true),
      rotate(-22, 680, 580, crown(680, 580, 0.8, c.p.accent)),
      fg(c, 704, 10),
    ],
  },
};
