/**
 * Covers for Psalmen 1-50, one scene per quiz. Each quiz covers one psalm:
 * `psalmen-bijbelquiz-deel-<n>` is Psalm n.
 *
 * Base hue 140, drifting two degrees per psalm (Psalm 50 lands on 238). See
 * `quiz-cover-scene-kit.mts` for the house style. The psalms are poetry, so
 * each cover draws the psalm's central image rather than a story moment.
 * Motifs that are not in the shared library live in
 * `quiz-cover-motifs-psalmen-1.mts`.
 *
 * Psalms: de boom geplant aan waterbeken, het kaf (1); de Koning gezalfd op
 * Sion, de volken woeden (2); David op de vlucht voor Absalom, "Gij zijt een
 * schild voor mij" (3); "in vrede zal ik neerliggen en slapen" (4); het
 * morgengebed naar Gods heilig paleis (5); "ik doornat mijn bedstede met mijn
 * tranen" (6); "doe mij recht, HEERE" - de weegschaal (7); de maan en de
 * sterren, "wat is de mens" (8); de troon bereid ten gerichte (9); de
 * goddeloze loert als een leeuw, het verborgen net (10); "vlucht als een
 * vogel naar uw gebergte" (11); zilver zevenmaal gelouterd in de smeltkroes
 * (12); "hoe lang, HEERE?" (13); de HEERE ziet neer op de mensenkinderen, de
 * verlossing uit Sion (14); wie zal wonen in Uw tent op Uw heilige berg (15);
 * de snoeren zijn mij gevallen in lieflijke plaatsen (16); verberg mij onder
 * de schaduw Uwer vleugelen (17); de HEERE is mijn steenrots en mijn burg
 * (18); de hemelen vertellen Gods eer, de zon als een bruidegom, de wet (19);
 * "dezen vermelden van wagens", wij steken de vaandelen op (20); een kroon van
 * zuiver goud op zijn hoofd (21); de lijdenspsalm, het lot over het gewaad
 * (22); de HEERE is mijn Herder (23); heft uw hoofden op, gij poorten (24);
 * "maak mij Uw wegen bekend" (25); ik was mijn handen in onschuld (26); de
 * HEERE is mijn Licht, al legert zich een leger tegen mij (27); "weid hen en
 * draag hen" (28); de stem des HEEREN breekt de cederen (29); de rouwklage
 * veranderd in een rei (30); "wees mij een sterke rots, een vast huis" (31);
 * niet als een paard met toom en gebit (32); de harp van tien snaren, de zee
 * als op een hoop (33); de Engel des HEEREN legert Zich rondom (34); grijp
 * schild en rondas, de vijand als kaf (35); de fontein des levens (36); de
 * zachtmoedigen beerven de aarde, de grote boom is er niet meer (37); mijn
 * ongerechtigheden als een zware last (38); de mens wandelt als een schaduw
 * (39); uit de ruisende kuil op een rots, een nieuw lied (40); die mijn brood
 * at, heeft de hiel opgeheven (41); het hert dat schreeuwt naar de
 * waterstromen (42); zend Uw licht en Uw waarheid naar Uw altaar (43); als
 * schapen ter slachting, verstrooid (44); het lied voor de Koning en Zijn
 * bruid, de rechte scepter (45); God is ons een toevlucht, Hij verbrandt de
 * wagens met vuur (46); God vaart op met geklank der bazuin (47); de stad des
 * groten Konings, telt haar torens (48); de rijke neemt niets mee in het graf
 * (49); de beesten op duizend bergen, offer Gode dank (50).
 */

import { base, fg, type C, type Scene } from './quiz-cover-scene-kit.mjs';
import { mix } from './cover-options/shapes.mjs';
import {
  H,
  W,
  angel,
  banner,
  brickWall,
  chariot,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  columns,
  crowd,
  crown,
  cross,
  dove,
  ellipse,
  fireBed,
  goblet,
  horse,
  houseBlock,

  lion,
  ox,
  path,
  person,
  rays,
  rect,
  rotate,
  scepter,
  shafts,
  smokeColumn,
  streaks,
  stump,
  templeFront,
  tent,
  tombMound,
  tower,
  tree,
  tri,
  vineRow,
  wheat,
  window as windowFrame,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  arkOfCovenant,
  bigThrone,
  blaze,
  bolt,
  bow,
  bowedFig,
  brokenLoaf,
  burdened,
  caveMouth,
  cedar,
  coinHeap,
  cord,
  fig,
  fruitTree,
  furnace,
  harp,
  hart,
  hourglass,
  kneel,
  lawBook,
  laver,
  lyre,
  netDome,
  prowlingLion,
  road,
  robe,
  scales,
  rock,
  sheepAt,
  shelterWings,
  shepherdWithLamb,
  shield,
  shofar,
  sleeper,
  spear,
  star,
  table,
  timbrel,
  wheel,
} from './quiz-cover-motifs-psalmen-1.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Scale of an option-A figure drawn with `fig()` / `person()` at s: local units to scene pixels. */
const K = 134 / 204;

/** Rock and hill colours: the landscape layers pulled toward the silhouette colour. */
const rockC = (c: C, t = 0.22) => mix(c.a.near, c.a.figure, t);
const hillC = (c: C) => mix(c.a.near, c.a.mid, 0.45);

/** A round-capped stroke. */
function stroke(d: string, fill: string, w: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

/** The pediment of `templeFront(x, y, s, _, cols)` alone, to lay the accent over it. */
function pediment(x: number, y: number, s: number, fill: string, cols = 6): string {
  const w = 26 * s * cols;
  return tri(x - w / 2 - 16 * s, y - 108 * s, x, y - 150 * s, x + w / 2 + 16 * s, y - 108 * s, fill);
}

/** A few white crest lines over a patch of water. */
function crests(rand: () => number, x0: number, x1: number, y0: number, y1: number, n: number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const y = y0 + ((y1 - y0) * (i + 0.5)) / n;
    const x = x0 + rand() * (x1 - x0 - 80);
    const len = 40 + rand() * 70;
    out.push(stroke(`M ${r1(x)} ${r1(y)} q ${r1(len / 2)} -6 ${r1(len)} 0`, '#FFFFFF', 3.5, 0.6));
  }
  return out.join('');
}

export const PSALMEN1_SCENES: Record<string, Scene> = {
  // 1: "Hij zal zijn als een boom, geplant aan waterbeken" - and the ungodly as chaff the wind drives away
  'psalmen-bijbelquiz-deel-1': {
    hue: 140,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 250, far: 'ridge', horizon: 470 }),
      path(`M 900 474 C 960 500 900 524 780 546 C 640 572 560 610 520 ${H} L 800 ${H} C 800 640 860 590 940 560 C 1040 524 1060 494 990 474 Z`, c.p.water),
      crests(c.rand, 700, 980, 500, 600, 5),
      fruitTree(500, 580, 1.35, c.p.fore),
      ...[
        [-120, 14],
        [-70, -30],
        [-16, 22],
        [36, -44],
        [92, 4],
        [130, 44],
        [-86, 56],
        [2, -66],
        [62, 46],
        [-36, -16],
        [-136, 48],
        [100, -40],
      ].map(([dx, dy]) => circle(500 + dx * 1.35, 580 - 190 * 1.35 + dy * 1.35, 10, c.p.accent)),
      person(300, 590, 1.05, c.p.fore, 'sit'),
      streaks(c.rand, 1020, 330, 260, 150, mix(c.a.near, c.a.figure, 0.2), 26, { opacity: 0.5 }),
      fg(c, 692, 14),
    ],
  },

  // 2: "Waarom woeden de heidenen?" - "Ik toch heb Mijn Koning gezalfd over Sion", the kings of the earth gathered at its foot
  'psalmen-bijbelquiz-deel-2': {
    hue: 142,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, clouds: 3, far: 'none', horizon: 486 }),
      c.soft(704, 320, 240, 0.45),
      rock(704, 552, 780, 130, hillC(c)),
      citySkyline(c.rand, 704, 436, 0.8, c.p.mid, 5),
      cityWall(704, 440, 0.7, c.p.mid, 280),
      crown(704, 340, 0.85, c.p.accent),
      banner(220, 574, 1.15, c.p.fore, c.p.near),
      banner(1110, 572, 1.1, c.p.fore, c.p.near),
      rect(386, 400, 6, 176, c.p.fore),
      rect(1020, 404, 6, 170, c.p.fore),
      person(270, 578, 1.2, c.p.fore, 'point'),
      person(350, 572, 1.1, c.p.fore, 'raise'),
      person(440, 576, 1.05, c.p.near, 'stand'),
      person(980, 574, 1.05, c.p.near, 'stand'),
      person(1060, 576, 1.15, c.p.fore, 'raise'),
      person(1180, 580, 1.2, c.p.fore, 'point'),
      fg(c, 694, 14),
    ],
  },

  // 3: "Maar Gij, HEERE, zijt een schild voor mij" - David fleeing Jerusalem before Absalom
  'psalmen-bijbelquiz-deel-3': {
    hue: 144,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 240, far: 'ridge', horizon: 470 }),
      citySkyline(c.rand, 1040, 476, 0.7, c.p.far, 6, { opacity: 0.85 }),
      cityWall(1040, 482, 0.6, c.p.far, 360, { opacity: 0.85 }),
      person(300, 530, 0.9, c.p.far, 'walk'),
      person(380, 524, 0.85, c.p.far, 'walk'),
      person(450, 530, 0.8, c.p.far, 'walk'),
      fig(660, 566, 1.65, c.p.fore, 'shield'),
      shield(660 + 30 * 1.65 * K, 566 - 108 * 1.65 * K, 1.1, c.p.accent, c.p.accentDeep),
      fg(c, 692, 16),
    ],
  },

  // 4: "In vrede zal ik tegelijk neerliggen en slapen; want Gij alleen, HEERE, zult mij doen zeker wonen"
  'psalmen-bijbelquiz-deel-4': {
    hue: 146,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1090, sunY: 260, sunR: 52, far: 'dunes', horizon: 480 }),
      tree(300, 530, 1.7, c.p.near),
      c.soft(640, 470, 280, 0.3),
      sleeper(620, 580, 1.8, c.p.fore, c.p.light),
      c.soft(960, 540, 120, 0.4, c.p.accent),
      ellipse(960, 582, 60, 12, c.p.fore),
      fireBed(c.rand, 960, 574, 0.62, c.p.accent, 4),
      fg(c, 694, 12),
    ],
  },

  // 5: "Des morgens, HEERE, zult Gij mijn stem horen" - bowing toward the palace of His holiness at sunrise
  'psalmen-bijbelquiz-deel-5': {
    hue: 148,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 360, sunR: 70, rays: true, far: 'ridge', horizon: 476 }),
      templeFront(910, 480, 1.15, c.p.near, 6),
      pediment(910, 480, 1.15, c.p.accent),
      kneel(450, 566, 1.7, c.p.fore, 'forward'),
      fg(c, 692, 14),
    ],
  },

  // 6: "Ik doe mijn bed de ganse nacht zwemmen; ik doornat mijn bedstede met mijn tranen"
  'psalmen-bijbelquiz-deel-6': {
    hue: 150,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 520 }),
      rect(0, 280, W, 240, c.p.near),
      windowFrame(1060, 440, 1.3, c.p.fore, mix(c.a.skyTop, c.a.figure, 0.25)),
      circle(1080, 386, 15, c.p.light),
      rect(280, 498, 500, 22, c.p.fore, { rx: 5 }),
      rect(296, 516, 16, 54, c.p.fore),
      rect(748, 516, 16, 54, c.p.fore),
      rect(262, 420, 24, 150, c.p.fore, { rx: 5 }),
      bowedFig(470, 500, 1.85, c.p.fore),
      ...[
        [600, 452],
        [614, 476],
        [594, 488],
      ].map(([x, y]) => ellipse(x, y, 5, 8, c.p.light, { opacity: 0.9 })),
      c.soft(880, 400, 160, 0.5, c.p.accent),
      rect(874, 430, 12, 140, c.p.fore),
      rect(848, 564, 64, 10, c.p.fore, { rx: 3 }),
      blaze(896, 412, 50, c.p.accent, c.a.accent2),
      path('M 846 418 C 846 440 930 442 934 420 L 948 412 L 940 426 C 930 446 852 446 846 418 Z', c.p.fore),
      ellipse(890, 428, 46, 14, c.p.fore),
      rect(0, 566, W, H - 566, mix(c.a.ground, c.a.figure, 0.1)),
    ],
  },

  // 7: "Richt mij, HEERE, naar mijn gerechtigheid" - the scales of the righteous Judge
  'psalmen-bijbelquiz-deel-7': {
    hue: 152,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 780, sunY: 260, clouds: 4, far: 'ridge', horizon: 476 }),
      c.soft(780, 360, 220, 0.45),
      rock(780, 572, 300, 44, rockC(c, 0.3)),
      scales(780, 534, 1.0, c.p.accent, 0),
      kneel(430, 572, 1.6, c.p.fore, 'up'),
      fg(c, 692, 16),
    ],
  },

  // 8: "Als ik Uw hemel aanzie, de maan en de sterren die Gij bereid hebt: wat is de mens?"
  'psalmen-bijbelquiz-deel-8': {
    hue: 154,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1120, sunY: 290, sunR: 50, far: 'none', horizon: 486 }),
      star(700, 300, 28, c.p.accent),
      star(860, 372, 18, c.p.accent),
      star(560, 392, 15, c.p.accent),
      star(960, 278, 20, c.p.accent),
      star(440, 300, 13, c.p.accent),
      star(780, 440, 11, c.p.accent),
      rock(360, 570, 440, 96, rockC(c, 0.15)),
      person(360, 480, 1.4, c.p.fore, 'raise'),
      sheepAt(700, 572, 1.05, c.p.light, c.p.fore),
      sheepAt(820, 564, 0.95, c.p.light, c.p.fore, { flip: true }),
      ox(1100, 572, 0.75, c.p.near),
      fg(c, 694, 12),
    ],
  },

  // 9: "De HEERE zit als Koning in eeuwigheid; Hij heeft Zijn troon bereid ten gerichte" - the nations bowed before it
  'psalmen-bijbelquiz-deel-9': {
    hue: 156,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 260, rays: true, far: 'none', ground: 'flat', horizon: 520 }),
      c.soft(704, 380, 280, 0.5),
      bigThrone(704, 548, 1.0, c.p.accent, c.p.accentDeep),
      kneel(300, 570, 1.35, c.p.fore, 'forward'),
      kneel(430, 562, 1.15, c.p.near, 'pray'),
      kneel(1110, 570, 1.35, c.p.fore, 'forward', { flip: true }),
      kneel(980, 562, 1.15, c.p.near, 'pray', { flip: true }),
      fg(c, 698, 10),
    ],
  },

  // 10: "Hij loert in het verborgen, als een leeuw in zijn hol ... hij vangt de ellendige als hij hem trekt in zijn net"
  'psalmen-bijbelquiz-deel-10': {
    hue: 158,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 300, far: 'dunes', horizon: 470 }),
      rock(330, 578, 560, 290, rockC(c, 0.16)),
      caveMouth(350, 578, 280, 160, mix(c.a.near, c.a.figure, 0.55)),
      prowlingLion(360, 578, 0.82, c.p.fore),
      netDome(700, 580, 230, 66, c.p.accent, 3.5, 22),
      fig(980, 576, 1.6, c.p.fore, 'staff', { flip: true }),
      fg(c, 694, 14),
    ],
  },

  // 11: "Hoe zegt gij tot mijn ziel: Vlucht naar uw gebergte als een vogel?" - "Op de HEERE betrouw ik"
  'psalmen-bijbelquiz-deel-11': {
    hue: 160,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 230, far: 'none', horizon: 480 }),
      rock(1060, 520, 700, 250, mix(c.a.far, c.a.mid, 0.5)),
      rock(1240, 520, 360, 170, mix(c.a.far, c.a.mid, 0.8)),
      dove(930, 340, 1.8, c.p.accent),
      shafts(420, 60, 180, 470, c.p.glow, 4),
      rock(420, 580, 300, 50, rockC(c, 0.3)),
      person(420, 536, 1.55, c.p.fore, 'stand'),
      fg(c, 694, 14),
    ],
  },

  // 12: "De redenen des HEEREN zijn reine redenen, zilver gelouterd in een aarden smeltkroes, zevenmaal gezuiverd"
  'psalmen-bijbelquiz-deel-12': {
    hue: 162,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 230, far: 'dunes', horizon: 480 }),
      smokeColumn(c.rand, 680, 250, 1.3, c.p.fore),
      c.soft(680, 300, 160, 0.45, c.p.accent),
      furnace(680, 576, 1.3, rockC(c, 0.32), c.p.fore, c.p.accent, c.a.accent2),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => circle(640 + i * 13 + (i % 2) * 6, 270 - (i % 3) * 14 - i * 2, 4.5, c.a.accent2)),
      kneel(980, 578, 1.5, c.p.fore, 'forward', { flip: true }),
      fg(c, 694, 14),
    ],
  },

  // 13: "Hoe lang, HEERE, zult Gij mijner vergeten?" - waiting, until the light comes: "mijn hart zal zich verheugen in Uw heil"
  'psalmen-bijbelquiz-deel-13': {
    hue: 164,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 420, sunR: 66, rays: true, far: 'ridge', horizon: 480 }),
      hourglass(560, 574, 1.35, c.p.fore, mix(c.a.skyLow, '#FFFFFF', 0.6), c.p.accent),
      person(800, 580, 1.5, c.p.fore, 'sit'),
      fg(c, 696, 12),
    ],
  },

  // 14: "De HEERE heeft van den hemel neergezien op de mensenkinderen ... zij zijn allen afgeweken" - and salvation out of Sion
  'psalmen-bijbelquiz-deel-14': {
    hue: 166,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 2, far: 'ridge', horizon: 476 }),
      cloudBank(c.rand, 640, 150, 2.4, c.p.fore, { opacity: 0.3 }),
      shafts(640, 170, 300, 420, '#FFFFFF', 5),
      ellipse(640, 588, 170, 22, '#FFFFFF', { opacity: 0.35 }),
      rock(1150, 512, 300, 70, hillC(c)),
      templeFront(1150, 450, 0.55, c.p.near, 6),
      pediment(1150, 450, 0.55, c.p.accent),
      c.soft(1150, 400, 120, 0.4),
      ...[
        [210, 586, 1.3],
        [310, 566, 1.05],
        [400, 552, 0.85],
        [880, 552, 0.85],
        [960, 572, 1.1],
      ].map(([x, y, s], i) => person(x, y, s, s < 1 ? c.p.near : c.p.fore, i % 2 ? 'stand' : 'walk')),
      person(1060, 590, 1.3, c.p.fore, 'point'),
      fg(c, 694, 14),
    ],
  },

  // 15: "HEERE, wie zal verkeren in Uw tent? Wie zal wonen op de berg Uwer heiligheid?"
  'psalmen-bijbelquiz-deel-15': {
    hue: 168,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'none', horizon: 486 }),
      rock(840, 560, 720, 200, hillC(c)),
      path('M 470 610 L 560 610 C 650 530 730 450 852 366 L 836 364 C 700 430 600 510 470 610 Z', '#FFFFFF', { opacity: 0.45 }),
      c.soft(840, 330, 150, 0.45),
      tent(840, 368, 1.15, c.p.accent),
      person(440, 590, 1.45, c.p.fore, 'walk'),
      fg(c, 698, 12),
    ],
  },

  // 16: "De snoeren zijn mij gevallen in lieflijke plaatsen; ja, een schone erfenis is mij geworden"
  'psalmen-bijbelquiz-deel-16': {
    hue: 170,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 250, rays: true, far: 'dunes', horizon: 470 }),
      path('M 470 510 L 790 502 L 850 626 L 380 640 Z', mix(c.a.mid, c.a.accent2, 0.35)),
      path('M 790 502 L 1120 496 L 1270 616 L 850 626 Z', mix(c.a.near, c.a.accent2, 0.3)),
      vineRow(c.rand, 500, 590, 1.15, c.p.near, 5),
      wheat(920, 600, 0.6, c.p.crop, 5),
      wheat(1050, 596, 0.58, c.p.crop, 5),
      wheat(1170, 600, 0.56, c.p.crop, 4),
      cord(
        [
          [380, 640],
          [470, 510],
          [790, 502],
          [1120, 496],
          [1270, 616],
          [850, 626],
          [380, 640],
        ],
        c.p.accent,
        7,
        c.p.fore,
      ),
      cord(
        [
          [790, 502],
          [850, 626],
        ],
        c.p.accent,
        7,
        c.p.fore,
      ),
      person(250, 590, 1.55, c.p.fore, 'stand'),
      fg(c, 724, 8),
    ],
  },

  // 17: "Bewaar mij als de appel des oogs; verberg mij onder de schaduw Uwer vleugelen" - the enemy like a lion lurking
  'psalmen-bijbelquiz-deel-17': {
    hue: 172,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1160, sunY: 240, sunR: 40, far: 'ridge', horizon: 480 }),
      c.soft(600, 420, 280, 0.4),
      shelterWings(600, 330, 1.05, c.p.accent, 118, { opacity: 0.94 }),
      kneel(590, 576, 1.55, c.p.fore, 'pray'),
      prowlingLion(1060, 578, 0.9, c.p.fore, { flip: true }),
      fg(c, 694, 12),
    ],
  },

  // 18: "De HEERE is mijn steenrots, en mijn burg ... Hij trok mij op uit grote wateren"
  'psalmen-bijbelquiz-deel-18': {
    hue: 174,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'none', ground: 'swell', horizon: 470 }),
      bolt(1200, 120, 1.0, '#FFFFFF', 0.75),
      rock(820, H + 60, 460, 452, rockC(c, 0.2)),
      cityWall(820, 404, 0.6, c.p.accent, 210),
      tower(760, 408, 0.72, c.p.accent),
      tower(890, 408, 0.6, c.p.accent),
      rock(370, H + 60, 300, 350, rockC(c, 0.3)),
      person(370, 500, 1.35, c.p.fore, 'raise'),
    ],
  },

  // 19: "De hemelen vertellen Gods eer ... de zon is als een bruidegom" - and "de wet des HEEREN is volmaakt"
  'psalmen-bijbelquiz-deel-19': {
    hue: 176,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 410, sunR: 86, rays: true, far: 'dunes', horizon: 472, stars: 16 }),
      rock(704, 616, 420, 46, rockC(c, 0.25)),
      lawBook(704, 590, 0.78, c.p.accent, '#FFFFFF', c.p.fore),
      fg(c, 700, 10),
    ],
  },

  // 20: "Dezen vermelden van wagens, en genen van paarden; maar wij van de Naam des HEEREN" - the banners raised
  'psalmen-bijbelquiz-deel-20': {
    hue: 178,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'dunes', horizon: 470 }),
      horse(1010, 516, 0.95, c.p.far),
      chariot(1180, 516, 1.05, c.p.far),
      horse(1130, 500, 0.7, c.p.far, { opacity: 0.6 }),
      banner(330, 578, 1.25, c.p.fore, c.p.accent),
      banner(470, 574, 1.45, c.p.fore, c.p.accent),
      banner(610, 580, 1.25, c.p.fore, c.p.accent),
      person(290, 584, 1.25, c.p.fore, 'raise'),
      person(420, 580, 1.35, c.p.fore, 'stand'),
      person(560, 584, 1.25, c.p.fore, 'raise'),
      person(690, 580, 1.15, c.p.near, 'stand'),
      fg(c, 696, 12),
    ],
  },

  // 21: "Gij hebt een kroon van zuiver goud op zijn hoofd gezet" - the king rejoicing in God's strength
  'psalmen-bijbelquiz-deel-21': {
    hue: 180,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, rays: true, far: 'none', ground: 'flat', horizon: 520 }),
      columns(300, 520, 1.6, c.p.near, 2),
      columns(1110, 520, 1.6, c.p.near, 2),
      c.soft(704, 330, 180, 0.5),
      fig(704, 556, 1.7, c.p.fore, 'raise'),
      crown(704, 336, 0.52, c.p.accent),
      crowd(c.rand, 420, 570, 1.0, c.p.near, 3, 150),
      crowd(c.rand, 990, 570, 1.0, c.p.near, 3, 150),
      fg(c, 698, 10),
    ],
  },

  // 22: "Mijn God, mijn God, waarom hebt Gij mij verlaten?" - "zij werpen het lot over mijn gewaad"
  'psalmen-bijbelquiz-deel-22': {
    hue: 182,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'ridge', horizon: 476 }),
      rock(500, 556, 480, 76, rockC(c, 0.18)),
      cross(500, 490, 1.1, c.p.fore),
      robe(930, 576, 0.9, c.p.accent),
      kneel(800, 578, 1.3, c.p.fore, 'forward'),
      kneel(1060, 578, 1.3, c.p.fore, 'forward', { flip: true }),
      person(1180, 572, 1.15, c.p.near, 'stand'),
      fg(c, 694, 14),
    ],
  },

  // 23: "De HEERE is mijn Herder ... Hij voert mij zachtjes aan zeer stille wateren" - "Uw stok en Uw staf, die vertroosten mij"
  'psalmen-bijbelquiz-deel-23': {
    hue: 184,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'ridge', horizon: 470 }),
      ellipse(880, 502, 270, 22, c.p.water),
      crests(c.rand, 660, 1100, 496, 510, 2),
      fig(400, 576, 1.65, c.p.fore, 'staff', { staffFill: c.p.accent, crook: true }),
      sheepAt(600, 578, 1.15, c.p.light, c.p.fore),
      sheepAt(730, 566, 1.0, c.p.light, c.p.fore, { flip: true }),
      sheepAt(860, 584, 1.2, c.p.light, c.p.fore),
      sheepAt(1000, 570, 1.0, c.p.light, c.p.fore, { flip: true }),
      sheepAt(1130, 580, 1.1, c.p.light, c.p.fore),
      fg(c, 696, 14),
    ],
  },

  // 24: "Heft uw hoofden op, gij poorten ... opdat de Koning der ere inga!" - the ark carried up through the gates
  'psalmen-bijbelquiz-deel-24': {
    hue: 186,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 300, far: 'none', ground: 'flat', horizon: 520 }),
      rect(120, 340, 1180, 180, c.p.near),
      ...Array.from({ length: 22 }, (_, i) => rect(124 + i * 54, 322, 30, 20, c.p.near)),
      rect(490, 260, 130, 260, c.p.near),
      rect(788, 260, 130, 260, c.p.near),
      ...[0, 1, 2].map((i) => rect(490 + i * 50, 240, 30, 22, c.p.near)),
      ...[0, 1, 2].map((i) => rect(788 + i * 50, 240, 30, 22, c.p.near)),
      rect(620, 316, 168, 204, '#FFFFFF', { opacity: 0.9 }),
      c.soft(704, 420, 230, 0.6),
      rect(600, 290, 208, 22, c.p.near),
      path('M 620 318 L 566 296 L 566 548 L 620 520 Z', c.p.fore),
      path('M 788 318 L 842 296 L 842 548 L 788 520 Z', c.p.fore),
      person(546, 600, 1.25, c.p.fore, 'carry'),
      person(862, 600, 1.25, c.p.fore, 'carry'),
      arkOfCovenant(704, 600 - 98 * 1.25, 0.78, c.p.accent, c.p.accentDeep),
      fg(c, 704, 8),
    ],
  },

  // 25: "HEERE, maak mij Uw wegen bekend, leer mij Uw paden"
  'psalmen-bijbelquiz-deel-25': {
    hue: 188,
    mood: 'dawn',
    draw: (c) => {
      const way = road(520, 960, H + 10, 476, 320, 36, -170, 1, c.p.accent, 0.7);
      return [
        base(c, { sunX: 1000, sunY: 390, sunR: 60, rays: true, far: 'ridge', horizon: 472 }),
        fg(c, 700, 12),
        way.shape,
        fig(way.at(612), 612, 1.6, c.p.fore, 'staff'),
      ];
    },
  },

  // 26: "Ik was mijn handen in onschuld; alzo zal ik Uw altaar, HEERE, omgaan"
  'psalmen-bijbelquiz-deel-26': {
    hue: 190,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 250, far: 'dunes', horizon: 476 }),
      templeFront(1060, 482, 1.3, c.p.near, 6),
      laver(630, 590, 1.25, c.p.accent, '#FFFFFF'),
      fig(790, 566, 1.55, c.p.fore, 'reach', { flip: true }),
      ...[
        [702, 470],
        [710, 486],
        [698, 498],
      ].map(([x, y]) => ellipse(x, y, 3.5, 6, '#FFFFFF')),
      fg(c, 698, 12),
    ],
  },

  // 27: "De HEERE is mijn Licht en mijn Heil, voor wien zou ik vrezen? ... Al legert zich tegen mij een leger"
  'psalmen-bijbelquiz-deel-27': {
    hue: 192,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 34, far: 'ridge', horizon: 480 }),
      c.soft(950, 310, 300, 0.55, c.p.accent),
      rays(c.rand, 950, 310, 460, '#FFFFFF', 14, { opacity: 0.16 }),
      path('M 920 330 L 980 340 L 640 580 L 500 580 Z', '#FFFFFF', { opacity: 0.18 }),
      circle(950, 310, 46, c.p.accent),
      rock(580, 590, 320, 70, rockC(c, 0.25)),
      person(580, 528, 1.45, c.p.fore, 'raise'),
      tent(210, 574, 0.9, c.p.near),
      tent(330, 580, 0.72, c.p.near),
      tent(1090, 574, 0.9, c.p.near),
      tent(1220, 580, 0.75, c.p.near),
      rect(400, 470, 5, 110, c.p.near),
      rect(1010, 464, 5, 116, c.p.near),
      fg(c, 696, 12),
    ],
  },

  // 28: "Verlos Uw volk, en zegen Uw erfdeel; en weid hen, en draag hen tot in eeuwigheid"
  'psalmen-bijbelquiz-deel-28': {
    hue: 194,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 250, far: 'ridge', horizon: 470 }),
      shepherdWithLamb(704, 580, 1.75, c.p.fore, c.p.accent, c.p.accentDeep),
      sheepAt(440, 580, 1.0, c.p.light, c.p.fore),
      sheepAt(960, 584, 1.1, c.p.light, c.p.fore, { flip: true }),
      sheepAt(1090, 574, 0.95, c.p.light, c.p.fore, { flip: true }),
      fg(c, 696, 14),
    ],
  },

  // 29: "De stem des HEEREN is op de wateren ... De stem des HEEREN breekt de cederen"
  'psalmen-bijbelquiz-deel-29': {
    hue: 196,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 5, far: 'ridge', horizon: 470 }),
      streaks(c.rand, 0, 120, W, 440, c.p.light, 60, { opacity: 0.28 }),
      cedar(300, 548, 0.85, c.p.near),
      cedar(1120, 556, 0.95, c.p.near),
      cedar(1250, 548, 0.7, c.p.near),
      c.soft(700, 380, 170, 0.4, c.p.accent),
      cedar(690, 572, 1.05, c.p.fore, true),
      bolt(760, 90, 1.7, c.p.accent),
      fg(c, 696, 14),
    ],
  },

  // 30: "Gij hebt mijn rouwklage veranderd in een rei; Gij hebt mijn zak losgemaakt" - "des morgens is er gejuich"
  'psalmen-bijbelquiz-deel-30': {
    hue: 198,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1030, sunY: 400, sunR: 80, rays: true, far: 'dunes', horizon: 476 }),
      houseBlock(c.rand, 1190, 486, 1.0, c.p.near, { opacity: 0.9 }),
      fig(560, 572, 1.7, c.p.fore, 'raise'),
      timbrel(560 + 52 * 1.7 * K, 572 - 232 * 1.7 * K, 1.55, c.p.accent, '#FFFFFF'),
      robe(780, 584, 0.8, c.p.near),
      fg(c, 696, 12),
    ],
  },

  // 31: "Wees mij tot een sterke rots, tot een zeer vast huis" - "Gij verbergt hen in het verborgene Uws aangezichts"
  'psalmen-bijbelquiz-deel-31': {
    hue: 200,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 18, far: 'none', horizon: 486 }),
      rock(704, 590, 860, 300, rockC(c, 0.2)),
      caveMouth(704, 590, 300, 220, mix(c.a.near, c.a.figure, 0.5)),
      caveMouth(704, 590, 260, 196, c.p.accent),
      c.soft(704, 480, 170, 0.6),
      kneel(690, 590, 1.4, c.p.fore, 'pray'),
      streaks(c.rand, 0, 100, W, 520, c.p.light, 70, { opacity: 0.3 }),
      fg(c, 704, 10),
    ],
  },

  // 32: "Zijt niet als een paard, als een muilezel ... welks muil met toom en gebit moet gebonden worden" - "Ik zal u onderwijzen"
  'psalmen-bijbelquiz-deel-32': {
    hue: 202,
    mood: 'warm',
    draw: (c) => {
      const hx = 860 - 66 * 1.15 * 1.3;
      const hy = 572 - 84 * 1.15 * 1.3;
      const k = 1.6 * K;
      const handX = 540 + 80 * k;
      const handY = 572 - 103 * k;
      return [
        base(c, { sunX: 1180, sunY: 250, far: 'ridge', horizon: 470 }),
        horse(860, 572, 1.15, c.p.fore),
        `<ellipse cx="${r1(hx - 6)}" cy="${r1(hy + 2)}" rx="15" ry="11" fill="none" stroke="${c.p.accent}" stroke-width="7"/>`,
        stroke(`M ${r1(hx + 4)} ${r1(hy - 6)} L ${r1(hx + 24)} ${r1(hy - 30)}`, c.p.accent, 7),
        stroke(`M ${r1(handX)} ${r1(handY)} Q ${r1((handX + hx) / 2)} ${r1(handY + 34)} ${r1(hx - 16)} ${r1(hy + 8)}`, c.p.accent, 7),
        fig(540, 572, 1.6, c.p.fore, 'reach'),
        fg(c, 696, 14),
      ];
    },
  },

  // 33: "Speelt Hem op de harp van tien snaren" - "Hij vergadert de wateren der zee als op een hoop"
  'psalmen-bijbelquiz-deel-33': {
    hue: 204,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 250, far: 'none', ground: 'water', horizon: 466 }),
      path(`M 880 472 C 960 392 1110 372 1210 424 C 1250 446 1290 464 1340 472 Z`, mix(c.a.far, '#FFFFFF', 0.15)),
      stroke('M 900 456 C 980 400 1100 386 1200 428', '#FFFFFF', 4, 0.6),
      crests(c.rand, 900, 1300, 490, 560, 4),
      path(`M -20 530 C 220 506 520 516 760 556 C 830 568 860 620 880 ${H} L -20 ${H} Z`, mix(c.a.near, c.a.mid, 0.4)),
      harp(580, 562, 0.95, c.p.accent, '#FFFFFF'),
      kneel(410, 566, 1.4, c.p.fore, 'forward'),
    ],
  },

  // 34: "De Engel des HEEREN legert Zich rondom degenen die Hem vrezen, en Hij rukt hen uit" - the young lions lack and hunger
  'psalmen-bijbelquiz-deel-34': {
    hue: 206,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 300, sunY: 240, sunR: 40, far: 'dunes', horizon: 476 }),
      tent(560, 578, 1.7, c.p.accent),
      c.soft(860, 420, 220, 0.5),
      angel(870, 578, 1.35, c.p.light, { opacity: 0.92 }),
      lion(1190, 580, 0.6, c.p.near),
      fg(c, 696, 12),
    ],
  },

  // 35: "Grijp het schild en de rondas, en sta op tot mijn hulp" - "laat hen zijn als kaf voor de wind"
  'psalmen-bijbelquiz-deel-35': {
    hue: 208,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'ridge', horizon: 476 }),
      streaks(c.rand, 860, 360, 460, 200, c.p.light, 46, { opacity: 0.4 }),
      person(1030, 520, 0.75, c.p.far, 'walk'),
      person(1130, 512, 0.7, c.p.far, 'walk'),
      person(1230, 520, 0.65, c.p.far, 'walk'),
      kneel(540, 580, 1.5, c.p.fore, 'pray'),
      spear(820, 584, 0.85, c.p.fore, c.p.fore),
      shield(720, 500, 1.6, c.p.accent, c.p.accentDeep),
      fg(c, 696, 14),
    ],
  },

  // 36: "Want bij U is de fontein des levens; in Uw licht zien wij het licht"
  'psalmen-bijbelquiz-deel-36': {
    hue: 210,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 820, sunY: 210, rays: true, clouds: 2, far: 'ridge', horizon: 476 }),
      rock(880, 586, 560, 300, rockC(c, 0.15)),
      c.soft(840, 420, 190, 0.55),
      ellipse(840, 392, 18, 11, c.p.fore),
      path('M 826 394 C 820 450 810 520 788 584 L 852 584 C 856 520 854 450 854 394 Z', c.p.accent),
      ellipse(810, 590, 160, 16, c.p.accent),
      crests(c.rand, 700, 940, 584, 596, 2),
      kneel(560, 592, 1.45, c.p.fore, 'forward'),
      fg(c, 700, 12),
    ],
  },

  // 37: "De zachtmoedigen zullen de aarde beërven" - the ungodly spread like a green tree, "en ziet, hij was er niet meer"
  'psalmen-bijbelquiz-deel-37': {
    hue: 212,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 240, far: 'dunes', horizon: 472 }),
      stump(300, 580, 2.2, c.p.near),
      person(900, 572, 1.5, c.p.fore, 'stand'),
      wheat(780, 590, 0.95, c.p.accent, 6),
      wheat(1010, 586, 0.9, c.p.accent, 6),
      wheat(1170, 590, 0.85, c.p.accent, 5),
      fg(c, 700, 12),
    ],
  },

  // 38: "Mijn ongerechtigheden gaan over mijn hoofd; als een zware last zijn zij mij te zwaar" - friends standing far off
  'psalmen-bijbelquiz-deel-38': {
    hue: 214,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 476 }),
      person(260, 528, 0.95, c.p.far, 'stand'),
      person(340, 524, 0.9, c.p.far, 'stand'),
      person(1160, 528, 0.95, c.p.far, 'stand'),
      burdened(700, 584, 1.55, c.p.fore, c.p.accent),
      fg(c, 698, 14),
    ],
  },

  // 39: "Gewisselijk, een iegelijk mens wandelt als een schaduw" - "Ik ben een vreemdeling bij U, een bijwoner"
  'psalmen-bijbelquiz-deel-39': {
    hue: 216,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 410, sunR: 64, far: 'dunes', horizon: 476 }),
      circle(1110, 410, 42, c.p.accent),
      path('M 626 582 L 690 582 L 270 624 L 186 618 Z', c.p.fore, { opacity: 0.22 }),
      fig(650, 582, 1.6, c.p.fore, 'staff'),
      fg(c, 700, 12),
    ],
  },

  // 40: "Hij heeft mij uit een ruisende kuil, uit modderig slijk opgehaald; Hij heeft mijn voeten op een rots gesteld" - a new song
  'psalmen-bijbelquiz-deel-40': {
    hue: 218,
    mood: 'dawn',
    draw: (c) => {
      const k = 1.25 * K;
      return [
        base(c, { sunX: 1160, sunY: 300, rays: true, far: 'ridge', horizon: 476 }),
        ellipse(420, 588, 196, 44, mix(c.a.ground, c.a.figure, 0.35)),
        ellipse(420, 594, 166, 30, mix(c.a.figure, '#000000', 0.15)),
        ellipse(420, 604, 130, 14, mix(c.a.ground, c.a.figure, 0.55)),
        ...[
          [370, 602],
          [450, 606],
          [410, 598],
        ].map(([x, y]) => ellipse(x, y, 9, 4, mix(c.a.ground, c.a.figure, 0.3))),
        rock(800, 590, 320, 130, rockC(c, 0.2)),
        fig(800, 466, 1.25, c.p.fore, 'carry'),
        lyre(800, 466 - 100 * k + 34, 0.52, c.p.accent, '#FFFFFF'),
        fg(c, 706, 10),
      ];
    },
  },

  // 41: "Ook de man mijns vredes, op welken ik vertrouwde, die mijn brood at, heeft de verzenen tegen mij grotelijks verheven"
  'psalmen-bijbelquiz-deel-41': {
    hue: 220,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1150, sunY: 240, sunR: 40, far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(600, 470, 230, 0.4),
      table(610, 580, 280, 72, c.p.fore),
      brokenLoaf(610, 498, 1.4, c.p.accent, c.p.accentDeep),
      goblet(700, 508, 0.6, c.p.near),
      person(430, 584, 1.45, c.p.fore, 'sit'),
      person(1030, 570, 1.25, c.p.near, 'walk'),
      fg(c, 704, 8),
    ],
  },

  // 42: "Gelijk een hert schreeuwt naar de waterstromen, alzo schreeuwt mijn ziel tot U, o God!"
  'psalmen-bijbelquiz-deel-42': {
    hue: 222,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'ridge', horizon: 470 }),
      rock(1090, 586, 460, 300, rockC(c, 0.15)),
      path('M 1010 300 C 1000 380 1004 480 990 584 L 1052 584 C 1062 480 1054 380 1046 300 Z', '#FFFFFF', { opacity: 0.9 }),
      path(`M 990 578 C 900 584 760 584 650 598 C 570 608 520 626 480 660 L 610 660 C 650 636 710 622 790 614 C 890 604 980 600 1060 580 Z`, c.p.accent),
      crests(c.rand, 600, 980, 590, 640, 3),
      hart(560, 584, 1.25, c.p.fore),
      fg(c, 708, 10),
    ],
  },

  // 43: "Zend Uw licht en Uw waarheid, dat die mij leiden; dat die mij brengen tot de berg Uwer heiligheid ... tot Gods altaar"
  'psalmen-bijbelquiz-deel-43': {
    hue: 224,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 240, sunY: 260, far: 'none', horizon: 480 }),
      rock(950, 560, 640, 180, hillC(c)),
      path('M 480 640 L 580 640 C 700 540 820 460 962 386 L 940 384 C 790 446 640 540 480 640 Z', '#FFFFFF', { opacity: 0.4 }),
      path('M 920 336 L 960 336 L 600 600 L 520 590 Z', '#FFFFFF', { opacity: 0.2 }),
      path('M 940 336 L 990 340 L 680 610 L 610 606 Z', '#FFFFFF', { opacity: 0.16 }),
      c.soft(950, 320, 130, 0.5, c.p.accent),
      altar(950, 392, 0.5, c.p.fore, '#FFFFFF'),
      blaze(950, 332, 62, c.p.accent, c.a.accent2),
      person(500, 596, 1.4, c.p.fore, 'walk'),
      fg(c, 708, 10),
    ],
  },

  // 44: "Gij geeft ons over als schapen ter spijze, en Gij verstrooit ons onder de heidenen" - "Waak op, waarom zoudt Gij slapen, Heere?"
  'psalmen-bijbelquiz-deel-44': {
    hue: 226,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 476 }),
      brickWall(c.rand, 170, 576, 1.5, c.p.near, 6, 6),
      brickWall(c.rand, 440, 576, 1.5, c.p.near, 3, 2),
      rect(560, 450, 26, 128, c.p.near),
      rotate(-62, 600, 576, rect(600, 556, 24, 110, c.p.near)),
      stroke('M 590 588 L 790 572', c.p.fore, 7),
      path('M 786 566 C 820 556 860 572 880 562 C 900 574 880 590 850 594 C 820 598 800 590 786 584 Z', c.p.accent),
      kneel(900, 584, 1.45, c.p.fore, 'up', { flip: true }),
      sheepAt(1060, 568, 0.9, c.p.light, c.p.fore),
      sheepAt(1190, 556, 0.8, c.p.light, c.p.fore, { flip: true }),
      sheepAt(1120, 600, 1.0, c.p.light, c.p.fore, { flip: true }),
      fg(c, 698, 14),
    ],
  },

  // 45: "De scepter Uws koninkrijks is een rechte scepter" - the bride led to the King, the virgins behind her
  'psalmen-bijbelquiz-deel-45': {
    hue: 228,
    mood: 'gold',
    draw: (c) => {
      const k = 1.65 * K;
      const hx = 990 - 80 * k;
      const hy = 556 - 103 * k;
      return [
        base(c, { sun: 'glow', sunX: 1040, sunY: 250, far: 'none', ground: 'flat', horizon: 520 }),
        columns(1180, 520, 1.6, c.p.near, 3),
        rect(1050, 330, 260, 18, c.p.near),
        rect(860, 540, 450, 14, c.p.near),
        rect(880, 528, 410, 14, c.p.near),
        rotate(-48, hx, hy, scepter(hx, hy + 24, 1.0, c.p.accent)),
        fig(990, 556, 1.65, c.p.fore, 'reach', { flip: true }),
        crown(990, 556 - 204 * k + 12, 0.36, c.p.fore),
        person(690, 566, 1.45, c.p.fore, 'stand'),
        person(560, 562, 1.25, c.p.near, 'walk'),
        person(450, 558, 1.18, c.p.near, 'walk'),
        person(340, 562, 1.1, c.p.near, 'walk'),
        fg(c, 704, 8),
      ];
    },
  },

  // 46: "God is ons een Toevlucht en Sterkte ... de beekjes der rivier verblijden de stad Gods" - He breaks the bow and burns the chariots
  'psalmen-bijbelquiz-deel-46': {
    hue: 230,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'ridge', horizon: 470 }),
      rock(600, 512, 560, 110, hillC(c)),
      citySkyline(c.rand, 600, 406, 0.6, c.p.mid, 5),
      cityWall(600, 414, 0.75, c.p.mid, 320),
      tower(440, 418, 0.62, c.p.mid),
      tower(760, 418, 0.62, c.p.mid),
      path(`M 580 506 C 570 540 500 560 420 600 C 340 640 290 690 270 ${H} L 520 ${H} C 520 690 560 640 620 600 C 680 560 680 530 650 506 Z`, c.p.water),
      crests(c.rand, 400, 640, 560, 640, 3),
      rotate(-82, 900, 590, bow(900, 590, 0.62, c.p.fore, true)),
      stroke('M 960 600 L 1050 582', c.p.fore, 6),
      stroke('M 1062 586 L 1130 604', c.p.fore, 6),
      wheel(1160, 548, 40, c.p.fore),
      blaze(1160, 598, 110, c.p.accent, c.a.accent2),
      fg(c, 706, 10),
    ],
  },

  // 47: "God vaart op met gejuich, de HEERE met geklank der bazuin" - "Klapt in de handen, alle volken"
  'psalmen-bijbelquiz-deel-47': {
    hue: 232,
    mood: 'warm',
    draw: (c) => {
      const k = 1.45 * K;
      const mx = 430 + 16 * k;
      const my = 520 - 186 * k;
      return [
        base(c, { sun: 'glow', sunX: 760, sunY: 230, rays: true, far: 'dunes', horizon: 480 }),
        rock(430, 580, 400, 66, rockC(c, 0.22)),
        shofar(mx, my, 1.15, c.p.accent, { rot: 8 }),
        fig(430, 520, 1.45, c.p.fore, 'shield'),
        person(780, 582, 1.15, c.p.fore, 'raise'),
        person(880, 576, 1.05, c.p.near, 'raise'),
        person(980, 584, 1.2, c.p.fore, 'raise'),
        person(1080, 576, 1.0, c.p.near, 'raise'),
        person(1180, 582, 1.1, c.p.fore, 'raise'),
        fg(c, 700, 12),
      ];
    },
  },

  // 48: "Schoon van gelegenheid ... is de berg Sion, de stad des groten Konings" - "gaat rondom Sion, telt haar torens"
  'psalmen-bijbelquiz-deel-48': {
    hue: 234,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 240, far: 'dunes', horizon: 480 }),
      rock(704, 560, 860, 150, hillC(c)),
      cityWall(704, 448, 0.8, c.p.mid, 560),
      tower(450, 452, 0.62, c.p.mid),
      tower(570, 448, 0.7, c.p.mid),
      tower(840, 448, 0.7, c.p.mid),
      tower(960, 452, 0.62, c.p.mid),
      templeFront(704, 418, 0.75, c.p.mid, 6),
      pediment(704, 418, 0.75, c.p.accent),
      ...[300, 390, 480, 920, 1010, 1100].map((x, i) => person(x, 590 - (i % 2) * 6, 0.85, i % 2 ? c.p.near : c.p.fore, 'walk')),
      fg(c, 702, 12),
    ],
  },

  // 49: "Zij vertrouwen op hun vermogen ... hij zal bij zijn sterven niets meenemen" - "maar God zal mijn ziel verlossen uit het geweld des grafs"
  'psalmen-bijbelquiz-deel-49': {
    hue: 236,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 330, sunR: 60, far: 'ridge', horizon: 476 }),
      c.soft(900, 330, 220, 0.35),
      tombMound(900, 580, 1.4, rockC(c, 0.2), c.p.fore),
      coinHeap(520, 586, 1.25, c.p.accent, c.p.accentDeep),
      goblet(640, 586, 0.9, c.p.accent),
      fg(c, 700, 12),
    ],
  },

  // 50: "Al het gedierte des wouds is Mijne, de beesten op duizend bergen" - "Offer Gode dank", from the rising of the sun
  'psalmen-bijbelquiz-deel-50': {
    hue: 238,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 380, sunR: 70, rays: true, far: 'ridge', horizon: 470 }),
      ox(760, 496, 0.55, c.p.far),
      ox(880, 490, 0.5, c.p.far),
      ox(1000, 500, 0.55, c.p.far),
      ox(1200, 494, 0.5, c.p.far),
      ox(820, 566, 0.85, c.p.near),
      ox(1080, 572, 0.9, c.p.near),
      altar(420, 590, 1.0, rockC(c, 0.35), '#FFFFFF'),
      blaze(420, 468, 120, c.p.accent, c.a.accent2),
      fg(c, 704, 12),
    ],
  },
};

