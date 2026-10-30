/**
 * Covers for the Ezechiel series, one scene per quiz. Each quiz covers one
 * chapter: `ezechiel-bijbelquiz-deel-<n>` is chapter n (1-48).
 *
 * Base hue 10, drifting two degrees per chapter. See
 * `quiz-cover-scene-kit.mts` for the house style; the motifs this series
 * needed beyond the primitives are in
 * `quiz-cover-motifs-ezechiel-kleine-profeten.mts`.
 *
 * Chapters: het visioen bij de Chebar, de raderen en de dieren (1); de
 * roeping en de boekrol (2); de rol gegeten (3); Jeruzalem op een tichelsteen
 * belegerd (4); het afgeschoren haar en het zwaard (5); tegen de bergen
 * Israels (6); het einde komt (7); de gruwelen in de tempel, de
 * zonaanbidders (8); de man met het schrijfgereedschap tekent de zuchtenden
 * (9); de heerlijkheid boven de cherubs, de vurige kolen (10); een nieuw hart
 * (11); de bagage door de muur (12); de gepleisterde muur in de hagel (13);
 * Noach, Daniel en Job (14); het wijnstokhout in het vuur (15); de vondelinge
 * in het veld (16); de twee arenden en de wijnstok (17); de onrijpe druiven
 * (18); de jonge leeuw gevangen (19); onder de roede doorgaan (20); het
 * zwaard en de koning op de tweesprong (21); de smeltoven (22); de beker van
 * Oholiba (23); de kokende pot (24); Rabba een stal der kemelen (25); Tyrus
 * een rots om netten te spreiden (26); Tyrus het prachtige schip (27); de val
 * van de koning van Tyrus (28); de draak in de Nijl (29); de gebroken arm van
 * Farao (30); de ceder geveld (31); de hemel verduisterd boven Egypte (32);
 * de wachter (33); de goede Herder (34); het gebergte Seir (35); de bergen
 * Israels bloeien weer (36); het dal der dorre beenderen (37); Gog trekt op
 * (38); de wapens verbrand (39); de man met het meetriet (40); het heilige der
 * heiligen, cherubs en palmen (41); de priesterkamers en de muur rondom (42);
 * de heerlijkheid keert terug, het altaar (43); de gesloten oostpoort (44);
 * de rechte weegschaal (45); de vorst in de poort (46); de rivier uit de
 * tempel (47); de stad: De HEERE is aldaar (48).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  banner,
  basket,
  fish,
  bird,
  boat,
  cityWall,
  citySkyline,
  cloudBank,
  coin,
  colossus,
  columns,
  crowd,
  crown,
  ellipse,
  fireBed,
  flame,
  gateArch,
  goblet,
  grapes,
  houseBlock,
  horse,
  lion,
  palm,
  path,
  person,
  prisonBars,
  pyramids,
  rays,
  rect,
  reeds,
  ridge,
  river,
  rotate,
  scroll,
  shafts,
  ship,
  shrub,
  smokeColumn,
  stars,
  streaks,
  swell,
  templeFront,
  tent,
  throne,
  tower,
  trail,
  tree,
  vineRow,
  wheat,
  sheaf,
  brickWall,
  circle,
  forkedRoad,
  water,
} from './quiz-cover-primitives.mjs';
import { at, ark as aArk, scrollShape } from './cover-options/shapes.mjs';
import {
  altar,
  axe,
  bar,
  bone,
  brokenSword,
  bundle,
  camel,
  cauldron,
  cedar,
  cityTile,
  closedGate,
  crocodile,
  crook,
  eagle,
  furnace,
  heartAt,
  hungNet,
  infant,
  jar,
  openScroll,
  livingCreature,
  lyingSheep,
  mirror,
  raw,
  rockFacade,
  scales,
  sheepAt,
  shield,
  shofar,
  staffBearer,
  stoneHeart,
  stroke,
  sword,
  taper,
  vineStem,
  weaponPile,
  wheelInWheel,
} from './quiz-cover-motifs-ezechiel-kleine-profeten.mjs';

/** A land band in front of water or a flat plain: the near bank. */
function bank(y: number, fill: string): string {
  return path(`M -20 ${y} C 300 ${y - 14} 520 ${y + 10} 760 ${y} C 1000 ${y - 10} 1200 ${y + 6} ${W + 20} ${y - 4} L ${W + 20} ${H} L -20 ${H} Z`, fill);
}

export const EZECHIEL_SCENES: Record<string, Scene> = {
  // 1: by the river Chebar - the wheel within a wheel beside the living creatures, the glory above
  'ezechiel-bijbelquiz-deel-1': {
    hue: 10,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'water', horizon: 440, stars: 30 }),
      c.soft(704, 170, 340, 0.55),
      shafts(704, 110, 560, 420, c.p.glow, 7),
      bank(504, c.p.mid),
      livingCreature(450, 520, 1.25, c.p.light, { opacity: 0.88 }),
      livingCreature(958, 520, 1.25, c.p.light, { opacity: 0.88 }),
      wheelInWheel(704, 524, 118, c.p.accent, c.p.light),
      person(250, 548, 1.15, c.p.fore, 'fallen'),
      fg(c, 692, 14),
    ],
  },

  // 2: "Mensenkind, sta op uw voeten" - the scroll written within and without, held out in the light
  'ezechiel-bijbelquiz-deel-2': {
    hue: 12,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 840, sunY: 210, sunR: 90, far: 'ridge' }),
      shafts(840, 90, 300, 330, c.p.glow, 5),
      c.soft(840, 330, 220, 0.45),
      openScroll(840, 440, 1.0, c.p.accent, c.p.accentDeep, c.p.accentDeep),
      person(500, G + 40, 1.45, c.p.fore, 'raise'),
      fg(c, 684, 16),
    ],
  },

  // 3: he eats the scroll and it is sweet as honey; then he sits seven days among the exiles at Tel-Abib
  'ezechiel-bijbelquiz-deel-3': {
    hue: 14,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 250, sunR: 64, far: 'dunes', ground: 'water', horizon: 450 }),
      bank(500, c.p.mid),
      reeds(c.rand, 1230, 512, 0.9, c.p.near, 7),
      person(910, 522, 0.85, c.p.near, 'sit', { opacity: 0.75 }),
      person(1010, 526, 0.95, c.p.near, 'sit', { opacity: 0.8 }),
      person(1110, 520, 0.8, c.p.near, 'sit', { opacity: 0.7 }),
      c.soft(640, 400, 190, 0.4),
      person(590, 552, 1.75, c.p.fore, 'kneel'),
      scroll(662, 398, 0.62, c.p.accent),
      fg(c, 694, 14),
    ],
  },

  // 4: Jerusalem scratched on a clay tile, the iron pan as a wall, the prophet lying on his side before it
  'ezechiel-bijbelquiz-deel-4': {
    hue: 16,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, sunR: 66, far: 'dunes', ground: 'flat', horizon: 500 }),
      cityTile(560, 530, 1.35, c.p.accent, c.p.accentDeep),
      tent(400, 532, 0.3, c.p.near),
      tent(720, 532, 0.3, c.p.near),
      raw('M 800 536 L 800 380 L 836 370 L 836 528 Z', c.p.near),
      mirror(1010, person(1010, 542, 1.35, c.p.fore, 'fallen')),
      fg(c, 690, 14),
    ],
  },

  // 5: hair shaved with a sword and weighed on a balance - a third burned, a third struck, a third to the wind
  'ezechiel-bijbelquiz-deel-5': {
    hue: 18,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1000, sunY: 230, far: 'ridge', clouds: 2 }),
      c.veil(0, W, c.p.fore, 0.16),
      fireBed(c.rand, 290, G + 46, 0.55, c.p.accentDeep, 4),
      person(540, G + 46, 1.5, c.p.fore, 'point'),
      rotate(48, 619, 413, sword(619, 413, 0.72, c.p.accent)),
      scales(930, G + 46, 0.95, c.p.near, 10),
      streaks(c.rand, 1060, 290, 240, 170, c.p.light, 18, { opacity: 0.35 }),
      fg(c, 690, 16),
    ],
  },

  // 6: "Zet uw aangezicht tegen de bergen Israels" - the altars on the high places broken, the idols thrown down
  'ezechiel-bijbelquiz-deel-6': {
    hue: 20,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1180, sunY: 220, far: 'ridge', clouds: 1 }),
      path('M 520 540 C 640 430 740 336 860 326 L 1100 326 C 1180 336 1260 430 1400 540 Z', c.p.mid),
      smokeColumn(c.rand, 900, 250, 0.7, c.p.fore),
      altar(900, 330, 0.95, c.p.near),
      rotate(-12, 1150, 330, rect(1136, 270, 28, 60, c.p.near)),
      rotate(82, 1000, 330, colossus(1000, 330, 0.48, c.p.accent, c.p.accent)),
      person(330, G + 50, 1.5, c.p.fore, 'point'),
      fg(c, 692, 14),
    ],
  },

  // 7: "Het einde komt" - the sun going down on the land, silver and gold thrown into the streets
  'ezechiel-bijbelquiz-deel-7': {
    hue: 22,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 760, sunY: 452, sunR: 84, rays: true, far: 'ridge' }),
      citySkyline(c.rand, 760, G, 0.75, c.p.far, 9, { opacity: 0.55 }),
      rotate(-70, 700, 560, goblet(700, 560, 1.2, c.p.accent)),
      coin(600, 548, 1.9, c.p.accent),
      coin(800, 566, 1.7, c.p.accent),
      coin(880, 540, 1.5, c.p.accent),
      coin(960, 572, 1.8, c.p.accent),
      coin(540, 578, 1.4, c.p.accent),
      person(370, 558, 1.5, c.p.fore, 'bow'),
      fg(c, 694, 12),
    ],
  },

  // 8: the abominations in the temple - men with their backs to the house of the LORD, bowing to the sun
  'ezechiel-bijbelquiz-deel-8': {
    hue: 24,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 290, sunR: 80, rays: true, far: 'dunes', ground: 'flat', horizon: 512 }),
      templeFront(320, 512, 1.5, c.p.near, 6),
      colossus(520, 512, 0.46, c.p.accent, c.p.accent),
      person(650, 524, 1.15, c.p.fore, 'bow'),
      person(770, 528, 1.05, c.p.fore, 'bow'),
      person(880, 522, 1.12, c.p.fore, 'bow'),
      person(990, 530, 1.0, c.p.fore, 'bow'),
      fg(c, 688, 14),
    ],
  },

  // 9: the man clothed in linen with the writer's inkhorn sets a mark on those who sigh and cry
  'ezechiel-bijbelquiz-deel-9': {
    hue: 26,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 260, far: 'none', ground: 'flat', horizon: 512 }),
      citySkyline(c.rand, 704, 442, 0.8, c.p.far, 11, { opacity: 0.7 }),
      cityWall(704, 512, 1.2, c.p.near, 1100),
      crowd(c.rand, 1110, 524, 0.8, c.p.mid, 6, 230),
      person(580, 536, 1.5, c.p.fore, 'point'),
      rect(536, 428, 20, 34, c.p.accent, { rx: 4 }),
      bar(546, 428, 560, 404, 4, c.p.accent),
      mirror(770, person(770, 538, 1.35, c.p.fore, 'kneel')),
      circle(772, 412, 5, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 10: the glory of the LORD over the cherubs and the wheels, fiery coals taken from between them
  'ezechiel-bijbelquiz-deel-10': {
    hue: 28,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 880, sunY: 220, sunR: 90, far: 'ridge' }),
      c.soft(880, 240, 280, 0.5),
      templeFront(360, G + 46, 1.45, c.p.near, 6),
      livingCreature(810, G + 20, 1.15, c.p.light, { opacity: 0.88 }),
      wheelInWheel(1040, G + 30, 86, c.p.light, c.p.glow, { opacity: 0.9 }),
      fireBed(c.rand, 924, G + 36, 0.85, c.p.accent, 5),
      fg(c, 688, 16),
    ],
  },

  // 11: "Ik zal het stenen hart uit hun vlees wegnemen en hun een vlesen hart geven"
  'ezechiel-bijbelquiz-deel-11': {
    hue: 30,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1130, sunY: 320, sunR: 70, far: 'ridge' }),
      citySkyline(c.rand, 1080, G, 0.55, c.p.far, 6, { opacity: 0.5 }),
      c.soft(720, 330, 210, 0.5),
      heartAt(720, 406, 1.25, c.p.accent),
      person(560, G + 56, 1.55, c.p.fore, 'kneel'),
      rotate(28, 930, 560, stoneHeart(930, 560, 0.72, c.p.far, c.p.light)),
      fg(c, 692, 14),
    ],
  },

  // 12: at dusk he digs through the wall and goes out with his baggage on his shoulder - a sign of the exile
  'ezechiel-bijbelquiz-deel-12': {
    hue: 32,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 740, sunY: 380, sunR: 70, far: 'none', ground: 'flat', horizon: 512 }),
      rect(-20, 300, W + 40, 212, c.p.near),
      ...[...Array(32).keys()].map((i) => rect(-10 + i * 46, 280, 24, 22, c.p.near)),
      raw('M 618 512 L 612 420 L 636 360 L 684 332 L 740 326 L 794 338 L 832 380 L 846 440 L 852 512 Z', c.p.glow),
      c.soft(735, 420, 150, 0.5),
      person(735, 520, 1.35, c.p.fore, 'walk'),
      bundle(768, 386, 0.62, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 13: the false prophets daub a crumbling wall with whitewash; the storm and great hailstones bring it down
  'ezechiel-bijbelquiz-deel-13': {
    hue: 34,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', clouds: 3 }),
      c.veil(0, W, c.p.fore, 0.22),
      streaks(c.rand, 420, 120, 900, 360, c.p.light, 46, { opacity: 0.35 }),
      rect(420, 350, 560, 176, c.p.near),
      rect(420, 350, 340, 176, '#FFFFFF', { opacity: 0.5 }),
      stroke('M 760 352 L 742 400 L 770 436 L 748 484 L 766 526', c.p.fore, 6),
      rotate(18, 1010, 520, rect(990, 470, 80, 50, c.p.near)),
      ...[...Array(16).keys()].map((i) => circle(470 + ((i * 97) % 820), 170 + ((i * 61) % 290), 6 + (i % 3) * 2, c.p.light, { opacity: 0.85 })),
      person(310, 548, 1.45, c.p.fore, 'point'),
      bar(386, 452, 430, 420, 6, c.p.fore),
      at(220, 548, 0.55, `<path d="M -40 -64 L 40 -64 L 32 0 L -32 0 Z" fill="${c.p.accent}"/>`),
      fg(c, 692, 14),
    ],
  },

  // 14: "al waren deze drie mannen Noach, Daniel en Job daarin" - three righteous men in the light, the land under judgement
  'ezechiel-bijbelquiz-deel-14': {
    hue: 36,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 90, far: 'ridge', clouds: 2 }),
      c.veil(0, 420, c.p.fore, 0.3),
      c.veil(W, 990, c.p.fore, 0.3),
      path('M 400 548 C 510 456 600 432 704 430 C 808 432 898 456 1008 548 Z', c.p.mid),
      c.soft(704, 360, 240, 0.5),
      person(604, 448, 1.15, c.p.fore, 'stand'),
      person(704, 438, 1.3, c.p.fore, 'raise'),
      person(804, 448, 1.15, c.p.fore, 'stand'),
      at(290, 532, 0.62, aArk(c.p.accent, c.p.accentDeep)),
      lion(1120, 540, 0.95, c.p.near),
      fg(c, 692, 14),
    ],
  },

  // 15: the wood of the vine is good for nothing but the fire - both ends burned, the middle charred
  'ezechiel-bijbelquiz-deel-15': {
    hue: 38,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 300, sunR: 66, far: 'ridge' }),
      citySkyline(c.rand, 1110, G, 0.55, c.p.far, 5, { opacity: 0.6 }),
      vineRow(c.rand, 170, G + 4, 0.7, c.p.mid, 4),
      smokeColumn(c.rand, 660, 420, 1.2, c.p.fore),
      fireBed(c.rand, 660, 546, 1.15, c.p.accent, 7),
      taper([430, 540], [560, 500], [740, 566], [900, 520], 22, 12, c.p.fore),
      taper([600, 526], [620, 500], [640, 492], [660, 470], 9, 4, c.p.fore),
      flame(440, 536, 0.75, c.p.accent),
      flame(890, 518, 0.7, c.p.accent),
      fg(c, 692, 14),
    ],
  },

  // 16: the foundling cast out in the open field - "Leef!" - and the LORD passed by in light
  'ezechiel-bijbelquiz-deel-16': {
    hue: 40,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 270, sunR: 60, far: 'dunes' }),
      shafts(704, 70, 260, 450, c.p.glow, 5),
      c.soft(704, 480, 220, 0.55),
      ellipse(704, 532, 190, 22, c.p.mid),
      infant(690, 524, 2.3, c.p.accent),
      shrub(390, 524, 1.0, c.p.near),
      shrub(1010, 528, 0.85, c.p.near),
      fg(c, 692, 14),
    ],
  },

  // 17: the riddle of the two great eagles - one carries off the top of the cedar, the vine spreads toward it
  'ezechiel-bijbelquiz-deel-17': {
    hue: 42,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 230, sunR: 60, far: 'ridge' }),
      cedar(1120, G + 40, 0.9, c.p.near, { tiers: 4 }),
      raw(`M 1112 ${G + 40 - 258 * 0.9} L 1120 ${G + 40 - 290 * 0.9} L 1128 ${G + 40 - 262 * 0.9} Z`, c.p.fore),
      eagle(1000, 230, 0.3, c.p.mid, { opacity: 0.7 }),
      rotate(-150, 690, 404, cedar(690, 404, 0.3, c.p.accent)),
      eagle(690, 310, 0.92, c.p.fore),
      vineStem(370, G + 66, 1.3, c.p.near),
      fg(c, 692, 14),
    ],
  },

  // 18: "De vaders hebben onrijpe druiven gegeten, en de tanden der kinderen zijn stomp geworden"
  'ezechiel-bijbelquiz-deel-18': {
    hue: 44,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 250, sunR: 64, far: 'dunes' }),
      vineStem(1010, G + 30, 1.05, c.p.mid, { opacity: 0.8 }),
      vineStem(1210, G + 24, 0.9, c.p.mid, { opacity: 0.7 }),
      person(540, G + 66, 1.75, c.p.fore, 'sit'),
      grapes(630, 440, 1.35, c.p.accent),
      person(780, G + 68, 0.95, c.p.fore, 'stand'),
      person(880, G + 70, 0.8, c.p.fore, 'stand'),
      fg(c, 692, 14),
    ],
  },

  // 19: lament for the princes - the young lion taken in a pit and brought away in a cage, the crown fallen
  'ezechiel-bijbelquiz-deel-19': {
    hue: 46,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 300, sunR: 64, far: 'ridge' }),
      lion(400, G + 40, 1.0, c.p.near, { opacity: 0.85 }),
      lion(760, G + 34, 0.9, c.p.fore),
      prisonBars(740, G + 40, 1.55, c.p.near),
      rect(620, G + 40, 240, 12, c.p.near),
      rotate(-24, 960, 554, crown(960, 554, 0.62, c.p.accent)),
      fg(c, 692, 14),
    ],
  },

  // 20: from Egypt through the wilderness - "Ik zal u onder de roede doen doorgaan"
  'ezechiel-bijbelquiz-deel-20': {
    hue: 48,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 250, sunR: 66, far: 'dunes' }),
      pyramids(260, G - 6, 0.8, c.p.far, { opacity: 0.6 }),
      tent(1150, G + 10, 0.7, c.p.near, { opacity: 0.75 }),
      tent(1260, G + 16, 0.55, c.p.near, { opacity: 0.65 }),
      person(470, G + 60, 1.5, c.p.fore, 'point'),
      bar(546, 444, 860, 448, 7, c.p.accent),
      sheepAt(640, G + 66, 0.95, c.p.light, c.p.near, true),
      sheepAt(760, G + 62, 1.0, c.p.light, c.p.near, true),
      sheepAt(880, G + 58, 0.9, c.p.light, c.p.near, true),
      sheepAt(980, G + 56, 0.8, c.p.light, c.p.near, true),
      fg(c, 694, 14),
    ],
  },

  // 21: the sword of the LORD sharpened and polished; the king of Babel at the parting of the two roads
  'ezechiel-bijbelquiz-deel-21': {
    hue: 50,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 980, sunY: 230, far: 'none', ground: 'flat', horizon: 486, clouds: 2 }),
      citySkyline(c.rand, 310, 486, 0.45, c.p.far, 4, { opacity: 0.6 }),
      citySkyline(c.rand, 1110, 486, 0.45, c.p.far, 4, { opacity: 0.6 }),
      forkedRoad(704, 486, c.p.light),
      c.soft(1000, 300, 170, 0.5),
      rotate(28, 1000, 450, sword(1000, 450, 0.95, c.p.accent)),
      person(704, 556, 1.4, c.p.fore, 'stand'),
      crown(704, 362, 0.3, c.p.fore),
      fg(c, 694, 12),
    ],
  },

  // 22: Israel become dross - silver, brass, iron and lead melted in the midst of the furnace
  'ezechiel-bijbelquiz-deel-22': {
    hue: 52,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 280, sunR: 60, far: 'ridge' }),
      cityWall(1110, G + 4, 0.8, c.p.near, 320),
      raw(`M 1020 ${G + 6} L 1028 ${G - 40} L 1050 ${G - 52} L 1080 ${G - 38} L 1090 ${G + 6} Z`, c.p.glow),
      smokeColumn(c.rand, 704, 300, 1.0, c.p.fore),
      c.soft(704, 470, 210, 0.45, c.p.accent),
      furnace(704, G + 64, 1.3, c.p.near, c.p.accent),
      fireBed(c.rand, 704, G + 64, 0.8, c.p.glow, 5),
      person(450, G + 66, 1.4, c.p.fore, 'point'),
      fg(c, 694, 14),
    ],
  },

  // 23: the two sisters Ohola and Oholiba - "gij zult den beker uwer zuster drinken"
  'ezechiel-bijbelquiz-deel-23': {
    hue: 54,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 270, sunR: 80, far: 'dunes' }),
      path('M 100 486 C 180 420 260 404 330 404 C 400 404 460 430 520 486 Z', c.p.mid),
      citySkyline(c.rand, 320, 412, 0.5, c.p.far, 4, { opacity: 0.75 }),
      path('M 880 486 C 960 420 1050 398 1120 398 C 1190 398 1260 430 1330 486 Z', c.p.mid),
      citySkyline(c.rand, 1110, 406, 0.55, c.p.far, 5, { opacity: 0.75 }),
      person(560, G + 60, 1.45, c.p.fore, 'stand'),
      mirror(820, person(820, G + 60, 1.45, c.p.fore, 'point')),
      goblet(690, G + 62, 1.7, c.p.accent),
      fg(c, 694, 14),
    ],
  },

  // 24: the boiling pot set on the fire, full of the choice pieces - the scum will not come off
  'ezechiel-bijbelquiz-deel-24': {
    hue: 56,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 280, sunR: 60, far: 'ridge' }),
      smokeColumn(c.rand, 680, 300, 1.1, c.p.fore),
      fireBed(c.rand, 680, G + 62, 1.0, c.p.accent, 7),
      cauldron(680, G + 60, 1.2, c.p.near),
      bone(640, G - 120, 60, -30, c.p.near),
      bone(720, G - 118, 54, 24, c.p.near),
      person(960, G + 60, 1.45, c.p.fore, 'stand'),
      fg(c, 694, 14),
    ],
  },

  // 25: against Ammon, Moab, Edom and the Philistines - Rabba made a stable for camels, the tents of the east
  'ezechiel-bijbelquiz-deel-25': {
    hue: 58,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 270, sunR: 66, far: 'dunes' }),
      columns(420, G + 16, 1.1, c.p.near, 3),
      rect(370, G - 90, 40, 106, c.p.near),
      rotate(80, 560, G + 30, rect(550, G - 70, 22, 100, c.p.near)),
      tent(1000, G + 20, 0.9, c.p.near),
      banner(1000, G - 50, 0.55, c.p.near, c.p.accent),
      camel(700, G + 62, 1.05, c.p.fore, true),
      camel(860, G + 56, 0.9, c.p.fore),
      fg(c, 694, 14),
    ],
  },

  // 26: Tyre made a bare rock in the midst of the sea, a place to spread nets
  'ezechiel-bijbelquiz-deel-26': {
    hue: 60,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, sunR: 62, far: 'none', ground: 'water', horizon: 440 }),
      path('M 380 540 C 440 470 520 430 640 420 L 900 420 C 1000 430 1060 470 1120 540 Z', c.p.mid),
      columns(520, 432, 0.7, c.p.near, 2),
      rect(980, 370, 18, 52, c.p.near),
      hungNet(760, 420, 260, 110, c.p.near, c.p.accent),
      boat(1210, 520, 0.8, c.p.near, false),
      fg(c, 700, 12),
    ],
  },

  // 27: Tyre as a glorious ship of cedar and fir, her sail of fine embroidered linen from Egypt
  'ezechiel-bijbelquiz-deel-27': {
    hue: 62,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 230, sunR: 66, far: 'none', ground: 'swell', horizon: 470, clouds: 1 }),
      boat(260, 486, 0.6, c.p.mid, true),
      boat(1180, 492, 0.7, c.p.mid, true),
      ...[0, 1, 2, 3].map((i) => bar(600 + i * 52, 530, 578 + i * 52, 566, 6, c.p.fore)),
      ship(704, 540, 1.65, c.p.fore, c.p.accent),
      fg(c, 712, 10),
    ],
  },

  // 28: the king of Tyre, "vol van wijsheid en volkomen van schoonheid", cast down - his crown of precious stones falls
  'ezechiel-bijbelquiz-deel-28': {
    hue: 64,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 220, far: 'none', ground: 'water', horizon: 450, clouds: 2 }),
      path('M 420 560 C 500 470 580 440 704 436 C 828 440 908 470 988 560 Z', c.p.mid),
      citySkyline(c.rand, 704, 440, 0.6, c.p.far, 5, { opacity: 0.55 }),
      throne(640, 444, 1.0, c.p.fore),
      rotate(38, 820, 520, crown(820, 520, 0.95, c.p.accent)),
      circle(900, 556, 8, c.p.accent),
      circle(760, 566, 7, c.p.accent),
      circle(960, 540, 6, c.p.accent),
      fg(c, 700, 12),
    ],
  },

  // 29: Pharaoh, the great dragon lying in the midst of his rivers - "Ik zal haken in uw kinnebakken leggen"
  'ezechiel-bijbelquiz-deel-29': {
    hue: 66,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, sunR: 60, far: 'dunes', ground: 'water', horizon: 450 }),
      pyramids(1120, 452, 0.9, c.p.far, { opacity: 0.7 }),
      reeds(c.rand, 240, 540, 1.1, c.p.near, 8),
      crocodile(760, 540, 1.35, c.p.fore),
      bar(518, 140, 518, 488, 3, c.p.accent, 0.7),
      stroke('M 518 470 L 518 512 Q 518 530 536 530 Q 552 530 552 514', c.p.accent, 8),
      reeds(c.rand, 1160, 560, 0.9, c.p.near, 6),
      fg(c, 704, 12),
    ],
  },

  // 30: the day of the LORD over Egypt, a day of clouds - "Ik heb den arm van Farao gebroken"
  'ezechiel-bijbelquiz-deel-30': {
    hue: 68,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 380, sunY: 250, far: 'dunes', clouds: 3 }),
      c.veil(W, 300, c.p.fore, 0.22),
      pyramids(980, G, 1.3, c.p.far, { opacity: 0.8 }),
      mirror(1060, person(1060, G + 72, 1.35, c.p.fore, 'fallen')),
      shield(1190, G + 58, 28, c.p.near),
      brokenSword(560, G + 80, 1.75, c.p.accent),
      fg(c, 694, 14),
    ],
  },

  // 31: Pharaoh likened to the great cedar of Lebanon, the birds in its boughs - and the axe at its root
  'ezechiel-bijbelquiz-deel-31': {
    hue: 70,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 250, sunR: 66, far: 'ridge' }),
      tree(360, G + 30, 0.9, c.p.mid),
      tree(1040, G + 26, 0.8, c.p.mid),
      cedar(704, G + 50, 1.0, c.p.fore),
      bird(640, 230, 1.4, c.p.fore),
      bird(780, 260, 1.2, c.p.fore),
      bird(860, 330, 1.0, c.p.fore),
      axe(860, G + 70, 0.95, c.p.accent),
      fg(c, 694, 14),
    ],
  },

  // 32: lament over Pharaoh - the sun covered with a cloud, the stars made dark, the dragon taken in a net
  'ezechiel-bijbelquiz-deel-32': {
    hue: 72,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, sunR: 70, far: 'dunes', stars: 0, ground: 'water', horizon: 452 }),
      cloudBank(c.rand, 704, 236, 1.3, c.p.fore, { opacity: 0.5 }),
      pyramids(330, 454, 0.8, c.p.far, { opacity: 0.7 }),
      bank(512, c.p.mid),
      crocodile(720, 548, 1.2, c.p.fore),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => stroke(`M ${480 + i * 60} 470 Q ${500 + i * 60} 520 ${470 + i * 64} 560`, c.p.accent, 4)),
      stroke('M 470 482 Q 720 452 980 482', c.p.accent, 5),
      stroke('M 466 520 Q 720 496 990 520', c.p.accent, 4),
      fg(c, 700, 12),
    ],
  },

  // 33: the watchman on the wall who sees the sword coming and blows the trumpet
  'ezechiel-bijbelquiz-deel-33': {
    hue: 74,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 230, sunR: 50, far: 'ridge' }),
      ...[0, 1, 2, 3, 4].map((i) => bar(240 + i * 76, G - 30, 246 + i * 76, G - 104, 3, c.p.mid)),
      ...[0, 1, 2, 3, 4].map((i) => horse(240 + i * 76, G + 8, 0.42, c.p.mid, { opacity: 0.85 })),
      ...[0, 1, 2, 3, 4].map((i) => person(244 + i * 76, G - 18, 0.36, c.p.mid, 'sit', { opacity: 0.85 })),
      cityWall(1080, G + 66, 1.15, c.p.near, 520),
      tower(860, G + 66, 1.4, c.p.near),
      person(860, G + 66 - 204, 0.86, c.p.fore, 'stand'),
      shofar(858, 236, 0.66, c.p.accent),
      fg(c, 694, 14),
    ],
  },

  // 34: against the shepherds who feed themselves - "Ik zal Mijn schapen weiden" - the good shepherd seeks the lost
  'ezechiel-bijbelquiz-deel-34': {
    hue: 76,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 260, sunR: 70, rays: true, far: 'ridge' }),
      path('M 820 520 C 900 440 980 410 1060 404 C 1140 410 1220 450 1300 520 Z', c.p.mid),
      sheepAt(1080, 410, 0.7, c.p.light, c.p.near),
      staffBearer(500, G + 64, 1.5, c.p.fore, c.p.accent),
      sheepAt(620, G + 70, 0.95, c.p.light, c.p.near),
      sheepAt(730, G + 64, 0.85, c.p.light, c.p.near, true),
      sheepAt(820, G + 72, 0.95, c.p.light, c.p.near),
      lyingSheep(370, G + 70, 0.9, c.p.light, c.p.near),
      fg(c, 694, 14),
    ],
  },

  // 35: against mount Seir - Edom's rock dwellings made a perpetual desolation
  'ezechiel-bijbelquiz-deel-35': {
    hue: 78,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'dunes', clouds: 2 }),
      c.veil(W, 400, c.p.fore, 0.25),
      path('M 380 560 L 480 380 L 560 330 L 640 270 L 760 250 L 860 290 L 960 260 L 1060 340 L 1160 420 L 1260 560 Z', c.p.mid),
      rockFacade(760, 520, 1.0, c.p.near, c.p.fore),
      fireBed(c.rand, 960, 274, 0.95, c.p.accent, 5),
      fireBed(c.rand, 560, 344, 0.8, c.p.accent, 4),
      smokeColumn(c.rand, 960, 190, 0.7, c.p.fore),
      fg(c, 694, 14),
    ],
  },

  // 36: "Gij bergen Israels, gij zult uw takken voortbrengen" - the land tilled and sown again, the cities inhabited
  'ezechiel-bijbelquiz-deel-36': {
    hue: 80,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, sunR: 64, far: 'ridge' }),
      houseBlock(c.rand, 1040, G - 4, 0.5, c.p.mid),
      houseBlock(c.rand, 1150, G + 2, 0.42, c.p.mid),
      tree(860, G + 6, 0.8, c.p.mid),
      tree(1260, G + 10, 0.7, c.p.mid),
      ...[0, 1, 2, 3, 4, 5].map((i) => wheat(560 + i * 70, G + 74 - (i % 2) * 6, 0.7, c.p.accent, 4)),
      person(380, G + 70, 1.45, c.p.fore, 'walk'),
      fg(c, 698, 12),
    ],
  },

  // 37: the valley of dry bones - "Gij dorre beenderen, hoort des HEEREN woord!" and the breath comes from the four winds
  'ezechiel-bijbelquiz-deel-37': {
    hue: 82,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 250, sunR: 60, rays: true, far: 'ridge' }),
      crowd(c.rand, 1080, G + 6, 0.7, c.p.far, 7, 300),
      ...[
        [560, 540, 70, 12], [660, 556, 60, -20], [760, 536, 80, 6], [860, 560, 64, 32], [960, 540, 70, -8],
        [610, 572, 54, 60], [720, 580, 66, -36], [820, 586, 58, 14], [920, 578, 50, 80], [1020, 566, 60, -18],
      ].map(([x, y, l, r]) => bone(x, y, l, r, c.p.light, { opacity: 0.92 })),
      ...[0, 1, 2].map((i) => stroke(`M ${480 + i * 40} ${300 + i * 34} C ${640 + i * 40} ${250 + i * 30} ${780 + i * 30} ${350 + i * 30} ${980 + i * 20} ${300 + i * 34}`, c.p.accent, 6 - i, 0.85)),
      person(330, G + 74, 1.5, c.p.fore, 'raise'),
      fg(c, 700, 12),
    ],
  },

  // 38: Gog of the land of Magog comes up with a great army, all of them riding on horses, with buckler and shield
  'ezechiel-bijbelquiz-deel-38': {
    hue: 84,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1180, sunY: 230, far: 'ridge', clouds: 3 }),
      c.veil(0, 900, c.p.fore, 0.26),
      ...[0, 1, 2, 3, 4, 5].map((i) => horse(300 + i * 150, G + 30 + (i % 2) * 10, 0.82, c.p.near, { opacity: 0.85 + (i % 2) * 0.15 })),
      ...[0, 1, 2, 3, 4, 5].map((i) => person(304 + i * 150, G - 32 + (i % 2) * 10, 0.62, c.p.fore, 'sit')),
      ...[0, 1, 2, 3, 4, 5].map((i) => shield(330 + i * 150, G - 40 + (i % 2) * 10, 20, c.p.fore, c.p.near)),
      banner(500, G + 20, 1.1, c.p.fore, c.p.accent),
      banner(950, G + 30, 1.0, c.p.fore, c.p.accent),
      fg(c, 694, 14),
    ],
  },

  // 39: Gog's weapons - shields, bows, arrows and spears - burned as firewood for seven years
  'ezechiel-bijbelquiz-deel-39': {
    hue: 86,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 270, sunR: 64, far: 'ridge' }),
      smokeColumn(c.rand, 760, 300, 1.2, c.p.fore),
      fireBed(c.rand, 760, G + 30, 1.3, c.p.accent, 7),
      weaponPile(760, G + 66, 1.15, c.p.near),
      person(1060, G + 64, 1.3, c.p.fore, 'carry'),
      person(1170, G + 62, 1.15, c.p.fore, 'stand'),
      bird(430, 240, 1.3, c.p.fore),
      bird(520, 280, 1.0, c.p.fore),
      fg(c, 696, 14),
    ],
  },

  // 40: on a very high mountain, a man like bronze with a line of flax and a measuring reed in the gate
  'ezechiel-bijbelquiz-deel-40': {
    hue: 88,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 240, sunR: 90, far: 'ridge' }),
      cityWall(700, G + 40, 1.1, c.p.mid, 760),
      gateArch(620, G + 40, 1.55, c.p.near),
      staffBearer(880, G + 66, 1.55, c.p.fore, c.p.accent),
      person(360, G + 68, 1.2, c.p.fore, 'stand'),
      fg(c, 696, 14),
    ],
  },

  // 41: the holy of holies; the walls carved with cherubs and palm trees, the doors of the temple
  'ezechiel-bijbelquiz-deel-41': {
    hue: 90,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 280, sunR: 90, far: 'none', ground: 'flat', horizon: 540 }),
      rect(-20, 250, W + 40, 290, c.p.mid),
      rect(-20, 236, W + 40, 18, c.p.near),
      palm(250, 520, 0.95, c.p.near, { opacity: 0.55 }),
      livingCreature(400, 520, 0.95, c.p.near, { opacity: 0.45 }),
      livingCreature(1010, 520, 0.95, c.p.near, { opacity: 0.45 }),
      palm(1160, 520, 0.95, c.p.near, { opacity: 0.55 }),
      c.soft(704, 400, 220, 0.4),
      rect(568, 290, 272, 250, c.p.near),
      raw('M 590 540 L 590 312 L 700 312 L 700 540 Z', c.p.accent),
      raw('M 708 540 L 708 312 L 818 312 L 818 540 Z', c.p.accent),
      palm(645, 520, 0.55, c.p.accentDeep, { opacity: 0.55 }),
      palm(763, 520, 0.55, c.p.accentDeep, { opacity: 0.55 }),
      fg(c, 704, 10),
    ],
  },

  // 42: the chambers of the priests in tiers, and the wall all around that separates the holy from the common
  'ezechiel-bijbelquiz-deel-42': {
    hue: 92,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, sunR: 62, far: 'ridge' }),
      templeFront(704, G - 6, 1.05, c.p.accent, 6),
      ...[0, 1, 2].map((i) => rect(300 + i * 30, G - 100 + i * 34, 240 - i * 60, 36, c.p.near, { opacity: 0.85 })),
      ...[0, 1, 2].map((i) => rect(868 + i * 30, G - 100 + i * 34, 240 - i * 60, 36, c.p.near, { opacity: 0.85 })),
      cityWall(704, G + 66, 1.0, c.p.near, 1020),
      gateArch(704, G + 66, 0.9, c.p.near),
      staffBearer(1210, G + 80, 1.1, c.p.fore, c.p.fore),
      fg(c, 700, 12),
    ],
  },

  // 43: the glory of the God of Israel comes from the way of the east and fills the house; the altar
  'ezechiel-bijbelquiz-deel-43': {
    hue: 94,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1220, sunY: 330, sunR: 84, rays: true, far: 'dunes', ground: 'flat', horizon: 512 }),
      shafts(1220, 300, 300, 250, c.p.glow, 5),
      templeFront(420, 512, 1.45, c.p.near, 6),
      smokeColumn(c.rand, 760, 280, 0.8, c.p.light),
      altar(760, 528, 1.2, c.p.accent),
      mirror(1010, person(1010, 538, 1.25, c.p.fore, 'fallen')),
      fg(c, 692, 14),
    ],
  },

  // 44: "Deze poort zal toegesloten zijn" - the east gate shut, for the LORD has entered by it
  'ezechiel-bijbelquiz-deel-44': {
    hue: 96,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 250, sunR: 80, rays: true, far: 'ridge' }),
      cityWall(704, G + 50, 1.2, c.p.mid, 1200),
      closedGate(704, G + 64, 1.25, c.p.near, c.p.accent),
      fg(c, 696, 14),
    ],
  },

  // 45: the holy portion of the land, and "een rechte weegschaal, een rechte efa en een rechte bath"
  'ezechiel-bijbelquiz-deel-45': {
    hue: 98,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 250, sunR: 64, far: 'dunes' }),
      ...[0, 1, 2, 3].map((i) => path(`M ${-20} ${G + 4 + i * 16} C 400 ${G - 6 + i * 16} 1000 ${G + 12 + i * 16} ${W + 20} ${G + i * 16} L ${W + 20} ${G + 10 + i * 16} C 1000 ${G + 20 + i * 16} 400 ${G + 4 + i * 16} -20 ${G + 12 + i * 16} Z`, c.p.crop)),
      templeFront(1060, G - 4, 0.6, c.p.mid, 5),
      rect(560, G + 34, 300, 36, c.p.near),
      scales(704, G + 36, 1.15, c.p.accent, -6),
      basket(420, G + 68, 1.0, c.p.near),
      fg(c, 698, 12),
    ],
  },

  // 46: the prince worships at the threshold of the gate on the sabbath; the lamb of the daily burnt offering
  'ezechiel-bijbelquiz-deel-46': {
    hue: 100,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 330, sunR: 70, far: 'none', ground: 'flat', horizon: 520 }),
      rect(-20, 280, W + 40, 240, c.p.mid),
      raw('M 560 520 L 560 380 A 144 144 0 0 1 848 380 L 848 520 Z', c.p.glow),
      smokeColumn(c.rand, 704, 330, 0.7, c.p.light),
      altar(704, 512, 0.7, c.p.near),
      fireBed(c.rand, 704, 448, 0.5, c.p.accent, 4),
      person(540, 548, 1.4, c.p.fore, 'bow'),
      crown(574, 444, 0.26, c.p.fore),
      lyingSheep(910, 548, 1.0, c.p.light, c.p.near),
      fg(c, 700, 12),
    ],
  },

  // 47: the river flowing out from under the threshold of the temple, trees on both banks, fruit every month
  'ezechiel-bijbelquiz-deel-47': {
    hue: 102,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, sunR: 62, far: 'ridge', horizon: 470 }),
      templeFront(640, 476, 0.7, c.p.near, 5),
      river(476, c.p.water),
      tree(380, 560, 1.15, c.p.near),
      tree(1020, 560, 1.2, c.p.near),
      tree(250, 600, 1.0, c.p.near, { opacity: 0.9 }),
      tree(1180, 604, 1.05, c.p.near, { opacity: 0.9 }),
      ...[[350, 488], [400, 470], [430, 498], [990, 478], [1040, 460], [1070, 488], [1000, 500]].map(([x, y]) => circle(x, y, 9, c.p.accent)),
      fish(704, 590, 0.42, c.p.near, { opacity: 0.6 }),
      fg(c, 712, 10),
    ],
  },

  // 48: the land divided among the tribes, the city with twelve gates - "De HEERE is aldaar"
  'ezechiel-bijbelquiz-deel-48': {
    hue: 104,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 100, rays: true, far: 'dunes' }),
      shafts(704, 120, 520, 300, c.p.glow, 7),
      citySkyline(c.rand, 704, G - 50, 1.15, c.p.far, 11, { opacity: 0.8 }),
      cityWall(704, G + 16, 1.6, c.p.near, 980),
      ...[440, 704, 968].map((x) => raw(`M ${x - 40} ${G + 16} L ${x - 40} ${G - 36} A 40 40 0 0 1 ${x + 40} ${G - 36} L ${x + 40} ${G + 16} Z`, c.p.accent)),
      ...[0, 1, 2, 3, 4].map((i) => path(`M -20 ${G + 40 + i * 30} C 400 ${G + 28 + i * 30} 1000 ${G + 50 + i * 30} ${W + 20} ${G + 36 + i * 30} L ${W + 20} ${G + 48 + i * 30} C 1000 ${G + 62 + i * 30} 400 ${G + 40 + i * 30} -20 ${G + 52 + i * 30} Z`, c.p.crop, { opacity: 0.8 })),
      fg(c, 704, 10),
    ],
  },
};
