/**
 * Covers for the short prophets that have their own quiz series but only a
 * few chapters each: Joel (1-3), Obadja (1), Nahum (1-3), Zefanja (1-3),
 * Haggai (1-2) and Maleachi (1-4). One scene per quiz, chapter n is
 * `<book>-bijbelquiz-deel-<n>`.
 *
 * Base hue 160 for Joel, then each book starts ten further on, two degrees
 * per chapter. See `quiz-cover-scene-kit.mts` for the house style; the extra
 * motifs are in `quiz-cover-motifs-ezechiel-kleine-profeten.mts`.
 *
 * Chapters: Joel - de sprinkhanenplaag, kale vijgebomen en verdorde oogst
 * (1); blaast de bazuin op Sion, Ik zal Mijn Geest uitstorten (2); het dal
 * der beslissing, slaat de sikkel aan (3). Obadja - Edom, al zettet gij uw
 * nest tussen de sterren (1). Nahum - de voeten van wie het goede
 * boodschapt op de bergen, storm over Nineve (1); de wagens razen, de
 * schilden rood gemaakt (2); de verwoeste bloedstad, de vijgebomen met de
 * eerste vijgen (3). Zefanja - Jeruzalem met lantaarnen doorzocht (1);
 * kudden liggen in de puinhopen, roerdomp en uil in de kapitelen (2);
 * juicht, dochter Sions (3). Haggai - brengt hout en bouwt het huis (1); de
 * heerlijkheid van dit laatste huis, Zerubbabel als een zegelring (2).
 * Maleachi - het blinde en kreupele offer op het altaar (1); het verbond met
 * Levi, de lippen des priesters bewaren de wetenschap (2); brengt al de
 * tienden, de vensteren des hemels geopend (3); de Zon der gerechtigheid
 * met genezing onder Zijn vleugelen, de kalveren huppelen (4).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  W,
  basket,
  brickWall,
  citySkyline,
  cityWall,
  circle,
  cloudBank,
  columns,
  crowd,
  ellipse,
  fireBed,
  gateArch,
  houseBlock,
  path,
  person,
  rays,
  rect,
  ring,
  rotate,
  shafts,
  sheaf,
  smokeColumn,
  streaks,
  swarm,
  templeFront,
  tent,
  tree,
  wheat,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  bar,
  bareTree,
  calf,
  chariotTeam,
  lantern,
  lyingSheep,
  lyre,
  mirror,
  nest,
  openScroll,
  raw,
  rockFacade,
  sheepAt,
  shield,
  shofar,
  sickle,
  eagle,
  wingedSun,
} from './quiz-cover-motifs-ezechiel-kleine-profeten.mjs';

export const KLEINE_PROFETEN_SCENES: Record<string, Scene> = {
  // ── Joel ──────────────────────────────────────────────────────────────────

  // Joel 1: the locusts have eaten the land - the fig tree barked and white, the harvest withered; the priests mourn
  'joel-bijbelquiz-deel-1': {
    hue: 160,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 240, far: 'ridge' }),
      c.veil(0, W, c.p.fore, 0.14),
      swarm(c.rand, 140, 130, 1140, 260, 1.6, c.p.fore, 120, 'locust'),
      bareTree(1010, G + 54, 1.3, c.p.near),
      bareTree(1200, G + 40, 0.9, c.p.near, { opacity: 0.85 }),
      ...[0, 1, 2, 3, 4].map((i) => rotate((i % 2 ? 1 : -1) * (34 + (i % 3) * 12), 520 + i * 74, G + 78, wheat(520 + i * 74, G + 78, 0.85, c.p.accent, 3))),
      person(320, G + 72, 1.5, c.p.fore, 'bow'),
      fg(c, 700, 12),
    ],
  },

  // Joel 2: "Blaast de bazuin te Sion" - and "Ik zal Mijn Geest uitstorten op alle vlees"
  'joel-bijbelquiz-deel-2': {
    hue: 162,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 260, sunR: 66, rays: true, far: 'ridge' }),
      shafts(704, 40, 680, 420, c.p.glow, 7),
      path('M 340 530 C 440 420 540 384 620 380 C 700 384 800 420 900 530 Z', c.p.mid),
      person(620, 388, 1.1, c.p.fore, 'stand'),
      shofar(628, 252, 0.62, c.p.accent),
      crowd(c.rand, 704, G + 84, 1.05, c.p.fore, 7, 760),
      fg(c, 708, 10),
    ],
  },

  // Joel 3: the multitudes in the valley of decision - "Slaat de sikkel aan, want de oogst is rijp"
  'joel-bijbelquiz-deel-3': {
    hue: 164,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 70, far: 'none' }),
      path(`M -20 280 C 200 300 420 380 640 ${G + 20} L -20 ${G + 40} Z`, c.p.mid),
      path(`M ${W + 20} 280 C 1208 300 988 380 768 ${G + 20} L ${W + 20} ${G + 40} Z`, c.p.mid),
      crowd(c.rand, 704, G + 6, 0.5, c.p.far, 14, 420),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => wheat(230 + i * 44, G + 84 - (i % 2) * 8, 0.95, c.p.crop, 3)),
      rotate(12, 640, G + 96, sickle(640, G + 96, 1.15, c.p.accent)),
      ...[0, 1, 2].map((i) => wheat(980 + i * 50, G + 86, 0.8, c.p.crop, 3)),
      fg(c, 708, 10),
    ],
  },

  // ── Obadja ────────────────────────────────────────────────────────────────

  // Obadja 1: Edom in the clefts of the rock - "al zettet gij uw nest tussen de sterren, Ik zal u van daar nederstorten"
  'obadja-bijbelquiz-deel-1': {
    hue: 174,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', stars: 64 }),
      raw(`M 600 ${G + 70} L 660 380 L 720 320 L 760 250 L 840 222 L 940 216 L 1000 240 L 1060 320 L 1130 400 L 1220 ${G + 70} Z`, c.p.mid),
      raw('M 760 250 L 840 222 L 860 300 L 800 360 Z', '#FFFFFF', 0.08),
      rockFacade(900, 500, 0.95, c.p.near, c.p.fore),
      nest(910, 222, 0.95, c.p.accent),
      eagle(460, 270, 0.62, c.p.fore),
      fg(c, 700, 12),
    ],
  },

  // ── Nahum ─────────────────────────────────────────────────────────────────

  // Nahum 1: whirlwind and storm over Nineveh - "Ziet op de bergen de voeten desgenen, die het goede boodschapt"
  'nahum-bijbelquiz-deel-1': {
    hue: 184,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 220, far: 'dunes', clouds: 1 }),
      cloudBank(c.rand, 1060, 220, 1.5, c.p.fore, { opacity: 0.4 }),
      streaks(c.rand, 900, 230, 340, 240, c.p.fore, 40, { opacity: 0.3 }),
      ziggurat(1060, G + 4, 0.9, c.p.far, 4, { opacity: 0.75 }),
      citySkyline(c.rand, 1060, G + 6, 0.6, c.p.far, 7, { opacity: 0.65 }),
      path(`M -20 400 C 160 372 360 380 520 440 C 620 480 700 540 780 ${G + 120} L -20 ${G + 120} Z`, c.p.mid),
      person(400, 412, 1.4, c.p.fore, 'walk'),
      rotate(-14, 470, 284, openScroll(470, 300, 0.42, c.p.accent, c.p.accentDeep, c.p.accentDeep)),
      fg(c, 708, 10),
    ],
  },

  // Nahum 2: the attack on Nineveh - the chariots rage in the streets, "het schild zijner helden is rood gemaakt"
  'nahum-bijbelquiz-deel-2': {
    hue: 186,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 270, sunR: 64, far: 'dunes' }),
      smokeColumn(c.rand, 1150, 250, 1.0, c.p.fore),
      cityWall(1170, G + 26, 1.2, c.p.near, 400),
      gateArch(1100, G + 26, 1.0, c.p.near),
      mirror(560, chariotTeam(560, G + 74, 1.0, c.p.fore)),
      ...[0, 1, 2].map((i) => person(780 + i * 96, G + 76 - (i % 2) * 6, 1.15, c.p.fore, 'walk')),
      ...[0, 1, 2].map((i) => shield(806 + i * 96, G - 8 - (i % 2) * 6, 30, c.p.accent, c.p.accentDeep)),
      shield(560, G - 24, 26, c.p.accent, c.p.accentDeep),
      fg(c, 706, 10),
    ],
  },

  // Nahum 3: woe to the bloody city - her strongholds like fig trees with the first-ripe figs, her people scattered on the mountains
  'nahum-bijbelquiz-deel-3': {
    hue: 188,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 250, far: 'ridge' }),
      smokeColumn(c.rand, 900, 280, 1.1, c.p.fore),
      ziggurat(900, G + 10, 1.05, c.p.mid, 3),
      rect(820, G - 120, 30, 34, c.p.mid),
      columns(1150, G + 16, 0.9, c.p.near, 2),
      rotate(70, 1230, G + 20, rect(1220, G - 70, 18, 90, c.p.near)),
      ...[0, 1, 2, 3].map((i) => person(560 + i * 50, G - 34 + (i % 2) * 8, 0.36, c.p.far, 'walk')),
      tree(400, G + 76, 1.6, c.p.fore),
      ...[[340, 438], [390, 420], [440, 432], [470, 458], [360, 464], [420, 470], [310, 452]].map(([x, y]) => circle(x, y, 11, c.p.accent)),
      fg(c, 708, 10),
    ],
  },

  // ── Zefanja ───────────────────────────────────────────────────────────────

  // Zefanja 1: the day of the LORD - "Ik zal Jeruzalem met lantaarnen doorzoeken"
  'zefanja-bijbelquiz-deel-1': {
    hue: 198,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 530, stars: 40 }),
      citySkyline(c.rand, 704, 360, 0.9, c.p.far, 9, { opacity: 0.6 }),
      houseBlock(c.rand, 300, 540, 1.6, c.p.near),
      houseBlock(c.rand, 1110, 540, 1.5, c.p.near),
      c.soft(790, 440, 200, 0.55, c.p.accent),
      person(704, 556, 1.55, c.p.fore, 'point'),
      bar(783, 452, 786, 458, 4, c.p.fore),
      lantern(786, 560, 0.95, c.p.fore, c.p.accent),
      fg(c, 708, 10),
    ],
  },

  // Zefanja 2: the cities of the nations made a desolation - flocks lie down in her midst, the owl lodges on the capitals
  'zefanja-bijbelquiz-deel-2': {
    hue: 200,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 280, sunR: 66, far: 'dunes' }),
      columns(560, G + 40, 1.4, c.p.near, 3),
      rect(500, G - 116, 120, 14, c.p.near),
      rotate(-14, 760, G + 40, rect(720, G + 14, 90, 26, c.p.near)),
      ellipse(528, G - 132, 15, 20, c.p.fore),
      circle(528, G - 156, 11, c.p.fore),
      lyingSheep(780, G + 74, 1.0, c.p.light, c.p.near),
      lyingSheep(900, G + 66, 0.9, c.p.light, c.p.near),
      lyingSheep(360, G + 74, 0.95, c.p.light, c.p.near),
      tent(1080, G + 50, 0.95, c.p.near),
      fireBed(c.rand, 1180, G + 66, 0.5, c.p.accent, 4),
      fg(c, 706, 10),
    ],
  },

  // Zefanja 3: "Zingt vrolijk, gij dochter Sions! ... Hij zal Zich over u verblijden met gejuich"
  'zefanja-bijbelquiz-deel-3': {
    hue: 202,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 270, sunR: 70, rays: true, far: 'ridge' }),
      cityWall(1010, G + 20, 1.0, c.p.mid, 560),
      gateArch(1010, G + 20, 0.95, c.p.near),
      person(560, G + 76, 1.25, c.p.fore, 'raise'),
      person(880, G + 76, 1.2, c.p.fore, 'raise'),
      person(1040, G + 80, 0.82, c.p.fore, 'raise'),
      person(720, G + 78, 1.5, c.p.fore, 'carry'),
      lyre(722, G + 6, 0.86, c.p.accent),
      fg(c, 706, 10),
    ],
  },

  // ── Haggai ────────────────────────────────────────────────────────────────

  // Haggai 1: "Klimt op het gebergte, en brengt hout aan, en bouwt dit huis" - the work on the temple begins
  'haggai-bijbelquiz-deel-1': {
    hue: 212,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, sunR: 64, far: 'ridge' }),
      tree(240, G + 4, 0.7, c.p.mid),
      tree(330, G + 8, 0.6, c.p.mid),
      brickWall(c.rand, 760, G + 60, 2.3, c.p.near, 4, 7),
      rect(800, G - 160, 12, 220, c.p.fore),
      rect(1150, G - 160, 12, 220, c.p.fore),
      rect(790, G - 160, 374, 10, c.p.fore),
      rect(790, G - 80, 374, 8, c.p.fore),
      person(980, G - 92, 0.75, c.p.fore, 'stand'),
      person(420, G + 74, 1.4, c.p.fore, 'carry'),
      person(620, G + 76, 1.4, c.p.fore, 'carry'),
      rect(360, G - 110, 330, 18, c.p.accent, { rx: 6 }),
      fg(c, 706, 10),
    ],
  },

  // Haggai 2: "De heerlijkheid van dit laatste huis zal groter zijn dan van het eerste" - and Zerubbabel made as a signet ring
  'haggai-bijbelquiz-deel-2': {
    hue: 214,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 640, sunY: 250, sunR: 100, rays: true, far: 'ridge' }),
      c.soft(640, 330, 260, 0.45),
      templeFront(640, G + 40, 1.55, c.p.near, 6),
      rect(960, 520, 160, 46, c.p.near, { rx: 4 }),
      ring(1040, 470, 1.6, c.p.accent),
      person(330, G + 78, 1.35, c.p.fore, 'stand'),
      fg(c, 708, 10),
    ],
  },

  // ── Maleachi ──────────────────────────────────────────────────────────────

  // Maleachi 1: "Gij brengt het blinde ten offer ... het kreupele en het kranke" - while from sunrise to sunset His Name is great
  'maleachi-bijbelquiz-deel-1': {
    hue: 224,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 440, sunR: 72, rays: true, far: 'dunes' }),
      smokeColumn(c.rand, 700, 260, 0.9, c.p.fore),
      altar(700, G + 68, 1.25, c.p.near),
      fireBed(c.rand, 700, G + 68 - 116, 0.85, c.p.accent, 5),
      person(510, G + 76, 1.45, c.p.fore, 'stand'),
      sheepAt(930, G + 74, 0.95, c.p.light, c.p.near, true),
      mirror(1080, person(1080, G + 76, 1.35, c.p.fore, 'point')),
      fg(c, 706, 10),
    ],
  },

  // Maleachi 2: the covenant with Levi - "de lippen des priesters zullen de wetenschap bewaren"
  'maleachi-bijbelquiz-deel-2': {
    hue: 226,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 480, sunY: 250, sunR: 90, far: 'dunes', ground: 'flat', horizon: 520 }),
      templeFront(1120, 520, 1.0, c.p.mid, 5),
      person(500, 552, 1.6, c.p.fore, 'stand'),
      openScroll(510, 476, 0.55, c.p.accent, c.p.accentDeep, c.p.accentDeep),
      person(760, 552, 1.05, c.p.fore, 'sit'),
      person(870, 556, 1.1, c.p.fore, 'sit'),
      person(980, 552, 1.0, c.p.fore, 'sit'),
      fg(c, 706, 10),
    ],
  },

  // Maleachi 3: "Brengt al de tienden in het schathuis ... of Ik u niet opendoe de vensteren des hemels"
  'maleachi-bijbelquiz-deel-3': {
    hue: 228,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge' }),
      cloudBank(c.rand, 560, 190, 1.2, c.p.light, { opacity: 0.75 }),
      cloudBank(c.rand, 1020, 196, 1.2, c.p.light, { opacity: 0.75 }),
      c.soft(790, 230, 220, 0.6),
      shafts(790, 200, 360, 300, c.p.glow, 6),
      houseBlock(c.rand, 1010, G + 50, 1.2, c.p.near),
      sheaf(1160, G + 60, 0.8, c.p.crop),
      sheaf(1230, G + 64, 0.7, c.p.crop),
      person(600, G + 76, 1.5, c.p.fore, 'carry'),
      basket(600, G - 34, 1.25, c.p.accent),
      fg(c, 706, 10),
    ],
  },

  // Maleachi 4: "U, die Mijn Naam vreest, zal de Zon der gerechtigheid opgaan, en er zal genezing zijn onder Zijn vleugelen"
  'maleachi-bijbelquiz-deel-4': {
    hue: 230,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge' }),
      c.soft(704, 330, 340, 0.6),
      rays(c.rand, 704, 330, 760, c.p.light, 16, { opacity: 0.3 }),
      wingedSun(704, 316, 58, c.p.accent, c.p.accentDeep),
      houseBlock(c.rand, 260, G + 40, 0.8, c.p.mid),
      calf(520, G + 74, 1.2, c.p.fore),
      calf(860, G + 60, 1.0, c.p.fore),
      mirror(1080, calf(1080, G + 76, 1.1, c.p.fore)),
      fg(c, 706, 10),
    ],
  },
};
