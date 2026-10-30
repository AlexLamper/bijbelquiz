/**
 * Covers for the Spreuken series, one scene per quiz. Each quiz covers one
 * chapter: `spreuken-bijbelquiz-deel-<n>` is chapter n (1-31).
 *
 * Base hue 120, drifting two degrees per chapter (chapter 31 lands on 180).
 * Spreuken is poetry, so each cover draws the chapter's best-known image
 * rather than a person speaking. See `quiz-cover-scene-kit.mts` for the
 * house style; the extra motifs live in `quiz-cover-motifs-spreuken-openbaring.mts`.
 *
 * Chapters: de Wijsheid roept in de poorten (1); zoek haar als verborgen
 * schatten (2); Hij zal uw paden recht maken (3); het pad der rechtvaardigen
 * als het schijnende licht, vader en zoon (4); drink water uit uw eigen
 * bornput (5); ga tot de mier, gij luiaard (6); de jongeling voor het venster
 * in de schemering (7); de Wijsheid bij de schepping, de cirkel over de
 * afgrond (8); de Wijsheid bouwt haar huis met zeven pilaren en zet haar
 * tafel (9); die in de zomer vergadert is een verstandig zoon (10); een
 * volkomen weegsteen (11); die zijn land bebouwt wordt met brood verzadigd
 * (12); de begeerte die komt is een boom des levens (13); de wijze vrouw
 * bouwt haar huis, de dwaze breekt het af (14); beter een gerecht van groen
 * moes met liefde (15); de HEERE stiert zijn gang (16); de smeltkroes voor
 * het zilver, de oven voor het goud (17); de Naam des HEEREN is een sterke
 * toren (18); die zich des armen ontfermt, leent den HEERE (19); de koning op
 * de troon des gerichts (20); het paard bereid tegen de dag des strijds (21);
 * leer de jongen naar de eis zijns wegs (22); rijkdom maakt zich vleugels als
 * een arend (23); de akker van de luiaard (24); gouden appelen in zilveren
 * gebeeld werk (25); er is een felle leeuw op de weg (26); ijzer scherpt
 * ijzer (27); de rechtvaardige is moedig als een jonge leeuw (28); welgelukzalig
 * die de wet bewaart (29); de weg van een arend, een slang en een schip (30);
 * de deugdelijke huisvrouw, haar kaars gaat des nachts niet uit (31).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  banner,
  basket,
  brickWall,
  circle,
  citySkyline,
  cityWall,
  coin,
  columns,
  crowd,
  crown,
  cypress,
  ellipse,
  forkedRoad,
  goblet,
  horse,
  houseBlock,
  loaf,
  ox,
  palm,
  path,
  person,
  rect,
  serpent,
  shafts,
  sheaf,
  ship,
  shrub,
  smokeColumn,
  streaks,
  templeFront,
  tent,
  throne,
  tower,
  trail,
  tree,
  well,
  wheat,
} from './quiz-cover-primitives.mjs';
import {
  ant,
  balance,
  bowl,
  crucible,
  eagle,
  flipX,
  fruitBowl,
  gateWall,
  houseFront,
  jar,
  kiln,
  lampstand,
  loom,
  openScroll,
  paleTone,
  plough,
  ruinedHouse,
  stakedSapling,
  standingLion,
  star,
  stroke,
  sword,
  thistle,
  treasureChest,
  wallTone,
} from './quiz-cover-motifs-spreuken-openbaring.mjs';

/** Fruit on the crown of a `tree(x, y, s)`: offsets in the tree's own units. */
function treeFruit(x: number, y: number, s: number, fill: string): string {
  const k = s * 0.56;
  const spots: [number, number][] = [
    [-74, -100], [-44, -128], [-12, -106], [18, -142], [48, -114], [80, -98], [2, -154], [-30, -88], [36, -90], [-62, -126], [62, -136], [-20, -150],
  ];
  return spots.map(([dx, dy]) => circle(x + dx * k, y + dy * k, 7.5 * k, fill)).join('');
}

export const SPREUKEN_SCENES: Record<string, Scene> = {
  // 1: "De opperste Wijsheid roept overluid buiten ... in de deuren der poorten" - Wisdom calling in the city gate
  'spreuken-bijbelquiz-deel-1': {
    hue: 120,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 220, far: 'ridge', ground: 'flat', horizon: 520 }),
      gateWall(704, 520, 0.95, wallTone(c), c.p.accent),
      c.soft(704, 430, 150, 0.4),
      person(704, 520, 1.35, c.p.fore, 'raise'),
      person(1000, 532, 1.0, c.p.near, 'walk'),
      person(1100, 536, 0.92, c.p.near, 'walk', { opacity: 0.9 }),
      person(410, 534, 1.0, c.p.near, 'stand'),
      fg(c, 692, 12),
    ],
  },

  // 2: "Indien gij haar zoekt als zilver, en naspeurt als verborgen schatten" - the treasure dug up
  'spreuken-bijbelquiz-deel-2': {
    hue: 122,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 250, far: 'ridge', ground: 'dunes', horizon: 480 }),
      path('M 820 536 C 870 440 980 392 1110 396 C 1210 400 1290 450 1330 536 Z', c.p.mid),
      ellipse(930, 536, 84, 16, c.p.near, { opacity: 0.45 }),
      c.soft(760, 440, 170, 0.45, c.p.accent),
      treasureChest(760, 534, 1.4, c.p.near, c.p.accent),
      stroke('M 960 420 L 930 528', c.p.near, 8),
      path('M 916 520 L 946 528 L 940 562 L 914 556 Z', c.p.near),
      person(590, 538, 1.45, c.p.fore, 'bow'),
      fg(c, 690, 14),
    ],
  },

  // 3: "Ken Hem in al uw wegen, en Hij zal uw paden recht maken" - one straight road toward the light
  'spreuken-bijbelquiz-deel-3': {
    hue: 124,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 250, sunR: 64, rays: true, far: 'ridge', ground: 'dunes', horizon: 470 }),
      cypress(450, 490, 1.0, c.p.near),
      cypress(390, 496, 0.8, c.p.near, { opacity: 0.85 }),
      tree(990, 492, 1.1, c.p.near),
      fg(c, 680, 16),
      trail(704, H + 10, 704, 474, 200, c.p.accent, { opacity: 0.55 }),
      person(704, 572, 1.25, c.p.fore, 'walk'),
    ],
  },

  // 4: "Hoort, gij kinderen, de tucht des vaders ... het pad der rechtvaardigen is gelijk het schijnende licht"
  'spreuken-bijbelquiz-deel-4': {
    hue: 126,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'dunes', horizon: 480 }),
      c.soft(990, 370, 280, 0.6),
      circle(990, 370, 54, c.p.accent),
      tree(290, 500, 1.15, c.p.near),
      person(560, 528, 1.4, c.p.fore, 'point'),
      person(714, 532, 0.88, c.p.fore, 'stand'),
      fg(c, 690, 14),
    ],
  },

  // 5: "Drink water uit uw bornput ... verblijd u over de huisvrouw uwer jeugd" - the couple at their own well
  'spreuken-bijbelquiz-deel-5': {
    hue: 128,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 240, far: 'dunes', ground: 'dunes', horizon: 480 }),
      palm(1000, 502, 1.25, c.p.near),
      palm(1100, 508, 1.0, c.p.near, { opacity: 0.9 }),
      well(690, 534, 1.75, c.p.near),
      ellipse(690, 475, 56, 9, c.p.water),
      jar(850, 536, 1.25, c.p.accent),
      person(430, 534, 1.35, c.p.fore, 'stand'),
      person(522, 536, 1.2, c.p.fore, 'stand'),
      fg(c, 690, 14),
    ],
  },

  // 6: "Ga tot de mier, gij luiaard! zie haar wegen en word wijs" - the ant at work, the sluggard asleep
  'spreuken-bijbelquiz-deel-6': {
    hue: 130,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'ridge', ground: 'dunes', horizon: 470 }),
      tree(1100, 490, 1.2, c.p.near),
      person(1040, 498, 0.85, c.p.near, 'fallen', { opacity: 0.85 }),
      path('M 170 566 C 210 504 290 488 350 490 C 410 494 460 522 490 566 Z', c.p.mid),
      ellipse(330, 506, 16, 7, c.p.fore, { opacity: 0.7 }),
      ant(500, 566, 0.5, c.p.near, c.p.accent, { flip: true }),
      ant(580, 566, 0.55, c.p.near, c.p.accent, { flip: true }),
      ant(820, 568, 2.5, c.p.fore, c.p.accent, { flip: true }),
      fg(c, 690, 14),
    ],
  },

  // 7: "Door het venster mijns huizes ... in de schemering, in den avond des daags" - the young man passing the lit window
  'spreuken-bijbelquiz-deel-7': {
    hue: 132,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1180, sunY: 210, sunR: 40, far: 'none', ground: 'flat', horizon: 512 }),
      citySkyline(c.rand, 1060, 512, 0.9, c.p.far, 6, { opacity: 0.7 }),
      c.soft(560, 400, 210, 0.4, c.p.accent),
      houseFront(540, 516, 1.25, wallTone(c), { door: c.p.accent, window: c.p.accent, lattice: wallTone(c) }),
      person(613, 516, 0.92, c.p.fore, 'stand'),
      person(900, 530, 1.3, c.p.fore, 'walk'),
      fg(c, 690, 12),
    ],
  },

  // 8: "Toen Hij de hemelen bereidde, was ik daar; toen Hij een cirkel beschreef over het vlak des afgronds"
  'spreuken-bijbelquiz-deel-8': {
    hue: 134,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 760, sunY: 320, sunR: 70, rays: true, far: 'ridge', ground: 'water', horizon: 470 }),
      `<ellipse cx="780" cy="530" rx="380" ry="40" fill="none" stroke="${c.p.accent}" stroke-width="6"/>`,
      path('M -20 600 C 80 540 190 500 290 506 C 370 512 420 560 460 660 L -20 660 Z', c.p.mid),
      person(270, 514, 1.2, c.p.fore, 'raise'),
      fg(c, 704, 10),
    ],
  },

  // 9: "De opperste Wijsheid heeft haar huis gebouwd, zij heeft haar zeven pilaren uitgehouwen ... zij heeft haar tafel toegericht"
  'spreuken-bijbelquiz-deel-9': {
    hue: 136,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 960, sunY: 220, far: 'dunes', ground: 'flat', horizon: 512 }),
      templeFront(960, 512, 1.5, c.p.near, 7),
      rect(380, 470, 260, 12, c.p.near, { rx: 3 }),
      rect(396, 482, 10, 46, c.p.near),
      rect(614, 482, 10, 46, c.p.near),
      loaf(440, 470, 0.85, c.p.near),
      loaf(510, 470, 0.7, c.p.near),
      goblet(588, 470, 1.35, c.p.accent),
      person(300, 528, 1.3, c.p.fore, 'point'),
      fg(c, 690, 12),
    ],
  },

  // 10: "Die in den zomer vergadert, is een verstandig zoon; die in den oogst vast slaapt, is een zoon die beschaamt"
  'spreuken-bijbelquiz-deel-10': {
    hue: 138,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 250, far: 'dunes', ground: 'dunes', horizon: 480 }),
      wheat(330, 520, 0.55, c.p.crop, 6),
      wheat(880, 516, 0.6, c.p.crop, 8),
      wheat(1080, 520, 0.55, c.p.crop, 7),
      person(1110, 540, 1.0, c.p.near, 'fallen'),
      person(540, 534, 1.35, c.p.fore, 'carry'),
      sheaf(660, 538, 1.05, c.p.accent),
      sheaf(760, 542, 0.85, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 11: "Een bedriegelijke weegschaal is den HEERE een gruwel; maar een volkomen weegsteen is Zijn welgevallen"
  'spreuken-bijbelquiz-deel-11': {
    hue: 140,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'ridge', ground: 'flat', horizon: 512 }),
      tent(1150, 516, 1.1, c.p.near, { opacity: 0.6 }),
      jar(1040, 520, 0.85, c.p.near),
      jar(1100, 522, 0.7, c.p.near),
      basket(1190, 524, 0.9, c.p.near),
      balance(704, 540, 1.3, c.p.near, c.p.accent),
      rect(580, 400, 22, 14, c.p.near, { rx: 2 }),
      rect(814, 396, 26, 18, c.p.near, { rx: 4 }),
      person(460, 534, 1.3, c.p.fore, 'stand'),
      flipX(940, person(940, 534, 1.3, c.p.fore, 'point')),
      fg(c, 690, 12),
    ],
  },

  // 12: "Die zijn land bebouwt, zal van brood verzadigd worden" - the ploughman behind the ox, bread at the field's edge
  'spreuken-bijbelquiz-deel-12': {
    hue: 142,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 320, sunR: 56, far: 'ridge', ground: 'flat', horizon: 500 }),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => stroke(`M ${560 + i * 70} 506 L ${200 + i * 190} 640`, c.p.near, 5, 0.18)),
      ox(650, 534, 1.1, c.p.near),
      flipX(800, plough(800, 536, 1.1, c.p.near)),
      person(880, 536, 1.25, c.p.fore, 'walk'),
      basket(360, 544, 1.1, c.p.near),
      loaf(340, 508, 0.8, c.p.accent),
      loaf(386, 510, 0.75, c.p.accent),
      loaf(362, 492, 0.7, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 13: "De begeerte, die komt, is een boom des levens" - the tree of life in fruit
  'spreuken-bijbelquiz-deel-13': {
    hue: 144,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 250, sunR: 56, rays: true, far: 'ridge', ground: 'dunes', horizon: 480 }),
      c.soft(720, 380, 260, 0.35),
      tree(720, 532, 2.5, c.p.near),
      treeFruit(720, 532, 2.5, c.p.accent),
      person(470, 534, 1.3, c.p.fore, 'point'),
      fg(c, 690, 14),
    ],
  },

  // 14: "Iedere wijze vrouw bouwt haar huis; maar de dwaze breekt het af met haar handen"
  'spreuken-bijbelquiz-deel-14': {
    hue: 146,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 330, sunR: 50, far: 'dunes', ground: 'dunes', horizon: 490 }),
      c.soft(470, 410, 150, 0.35, c.p.accent),
      houseFront(500, 528, 1.15, wallTone(c), { window: c.p.accent, lattice: wallTone(c) }),
      person(740, 534, 1.3, c.p.fore, 'carry'),
      rect(722, 432, 36, 20, c.p.near, { rx: 3 }),
      ruinedHouse(1040, 528, 1.05, wallTone(c, 0.22)),
      brickWall(c.rand, 640, 534, 0.8, c.p.near, 2, 2),
      fg(c, 690, 14),
    ],
  },

  // 15: "Beter is een gerecht van groen moes, waar liefde is, dan een gemeste os, en haat daarbij"
  'spreuken-bijbelquiz-deel-15': {
    hue: 148,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 320, sunR: 50, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 1200, 512, 0.9, c.p.near, { opacity: 0.65 }),
      ox(1090, 514, 0.75, c.p.near, { opacity: 0.55 }),
      rect(570, 470, 270, 14, c.p.near, { rx: 3 }),
      rect(586, 484, 12, 48, c.p.near),
      rect(812, 484, 12, 48, c.p.near),
      ellipse(672, 432, 20, 11, c.p.near),
      ellipse(706, 424, 22, 12, c.p.near),
      ellipse(738, 432, 19, 11, c.p.near),
      bowl(705, 470, 1.6, c.p.accent),
      person(478, 534, 1.45, c.p.fore, 'sit'),
      person(932, 534, 1.4, c.p.fore, 'sit'),
      fg(c, 690, 12),
    ],
  },

  // 16: "Het hart des mensen overdenkt zijn weg; maar de HEERE stiert zijn gang" - the traveller at the fork, a light over one way
  'spreuken-bijbelquiz-deel-16': {
    hue: 150,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', ground: 'flat', horizon: 480, stars: 14 }),
      c.veil(0, 640, c.p.fore, 0.22),
      fg(c, 690, 12),
      forkedRoad(704, 480, c.p.light),
      c.soft(1010, 300, 190, 0.5, c.p.accent),
      shafts(1010, 300, 150, 200, c.p.glow, 3),
      star(1010, 300, 44, c.p.accent),
      person(704, 566, 1.3, c.p.fore, 'stand'),
    ],
  },

  // 17: "De smeltkroes is voor het zilver, en de oven voor het goud; maar de HEERE proeft de harten"
  'spreuken-bijbelquiz-deel-17': {
    hue: 152,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'dunes', ground: 'flat', horizon: 512 }),
      smokeColumn(c.rand, 850, 250, 1.3, c.p.near),
      c.soft(850, 470, 160, 0.45, c.p.accent),
      kiln(850, 516, 1.35, c.p.near, c.p.accent),
      person(540, 532, 1.3, c.p.fore, 'carry'),
      crucible(650, 534, 1.4, c.p.near, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 18: "De Naam des HEEREN is een sterke toren; de rechtvaardige zal daarhenen lopen, en in een hoog vertrek gesteld worden"
  'spreuken-bijbelquiz-deel-18': {
    hue: 154,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'none', ground: 'dunes', horizon: 500 }),
      streaks(c.rand, 0, 100, 1408, 420, c.p.light, 60, { opacity: 0.3 }),
      path('M 640 540 C 700 470 790 446 880 446 C 980 446 1060 474 1120 540 Z', c.p.mid),
      stroke('M 600 548 C 700 520 780 500 860 460', c.p.light, 10, 0.45),
      tower(880, 458, 1.4, c.p.near),
      c.soft(880, 420, 80, 0.55, c.p.accent),
      path('M 866 458 L 866 424 C 866 408 894 408 894 424 L 894 458 Z', c.p.accent),
      person(560, 542, 1.3, c.p.fore, 'walk'),
      fg(c, 690, 12),
    ],
  },

  // 19: "Die zich des armen ontfermt, leent den HEERE" - bread for the poor man by the road
  'spreuken-bijbelquiz-deel-19': {
    hue: 156,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 250, far: 'ridge', ground: 'dunes', horizon: 480 }),
      cityWall(320, 494, 0.8, c.p.mid, 320, { opacity: 0.85 }),
      tree(1090, 502, 1.1, c.p.near),
      person(800, 534, 1.1, c.p.fore, 'sit'),
      bowl(860, 536, 0.45, c.p.near),
      person(620, 534, 1.35, c.p.fore, 'point'),
      loaf(702, 450, 0.9, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 20: "De koning, zittende op den troon des gerichts, verstrooit alle kwaad met zijn ogen"
  'spreuken-bijbelquiz-deel-20': {
    hue: 158,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(704, 320, 240, 0.45),
      columns(330, 512, 1.3, c.p.near, 2),
      columns(1080, 512, 1.3, c.p.near, 2),
      throne(704, 516, 1.7, wallTone(c, 0.45)),
      person(704, 404, 1.35, c.p.fore, 'sit'),
      crown(704, 278, 0.38, c.p.accent),
      person(470, 530, 1.15, c.p.fore, 'bow'),
      flipX(938, person(938, 530, 1.15, c.p.fore, 'bow')),
      fg(c, 690, 12),
    ],
  },

  // 21: "Het paard wordt bereid tegen den dag des strijds, maar de overwinning is des HEEREN"
  'spreuken-bijbelquiz-deel-21': {
    hue: 160,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 320, sunR: 56, far: 'ridge', ground: 'dunes', horizon: 480 }),
      shafts(704, 60, 320, 300, c.p.glow, 5),
      tent(1150, 502, 0.8, c.p.near, { opacity: 0.7 }),
      tent(1250, 506, 0.65, c.p.near, { opacity: 0.6 }),
      horse(720, 532, 1.5, c.p.near),
      person(470, 536, 1.3, c.p.fore, 'point'),
      banner(950, 536, 1.25, c.p.fore, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 22: "Leer den jongen de eerste beginselen naar den eis zijns wegs; als hij ook oud zal geworden zijn, zal hij daarvan niet afwijken"
  'spreuken-bijbelquiz-deel-22': {
    hue: 162,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'ridge', ground: 'dunes', horizon: 480 }),
      cypress(1110, 500, 1.35, c.p.near),
      tree(1210, 504, 1.0, c.p.near, { opacity: 0.9 }),
      stakedSapling(880, 538, 1.5, c.p.accent, c.p.near),
      person(590, 536, 1.4, c.p.fore, 'walk'),
      person(706, 538, 0.82, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 23: "Want die zal zichzelven gewisselijk vleugelen maken, gelijk een arend, en naar den hemel vliegen" - riches flying away
  'spreuken-bijbelquiz-deel-23': {
    hue: 164,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 220, far: 'dunes', ground: 'dunes', horizon: 480, clouds: 2 }),
      path('M 846 344 C 830 370 834 396 860 398 C 886 396 890 370 874 344 Z', c.p.accent),
      stroke('M 860 330 L 860 348', c.p.near, 4),
      eagle(860, 300, 0.7, c.p.near),
      coin(770, 410, 0.75, c.p.accent),
      coin(726, 448, 0.65, c.p.accent),
      coin(800, 460, 0.55, c.p.accent),
      person(530, 536, 1.4, c.p.fore, 'raise'),
      fg(c, 690, 14),
    ],
  },

  // 24: "Ik ging voorbij den akker eens luiaards ... hij was gans opgeschoten van distelen, en zijn stenen scheidsmuur was afgebroken"
  'spreuken-bijbelquiz-deel-24': {
    hue: 166,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 260, far: 'dunes', ground: 'dunes', horizon: 480 }),
      brickWall(c.rand, 250, 524, 1.1, c.p.mid, 4, 4),
      brickWall(c.rand, 420, 524, 1.1, c.p.mid, 2, 2),
      brickWall(c.rand, 900, 524, 1.1, c.p.mid, 3, 4),
      ellipse(520, 528, 22, 8, c.p.mid),
      ellipse(560, 532, 16, 6, c.p.mid),
      ellipse(860, 530, 18, 7, c.p.mid),
      thistle(470, 556, 1.05, c.p.near, c.p.accent),
      thistle(610, 552, 1.35, c.p.near, c.p.accent),
      thistle(720, 558, 1.1, c.p.near, c.p.accent),
      thistle(820, 552, 1.25, c.p.near, c.p.accent),
      shrub(1000, 548, 0.8, c.p.near),
      person(1120, 540, 1.05, c.p.fore, 'fallen'),
      fg(c, 692, 14),
    ],
  },

  // 25: "Een woord op zijn pas gesproken is als gouden appelen in zilveren gebeeld verheven werk"
  'spreuken-bijbelquiz-deel-25': {
    hue: 168,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(300, 512, 1.3, c.p.near, 2),
      columns(1110, 512, 1.3, c.p.near, 2),
      rect(646, 456, 116, 56, wallTone(c), { rx: 3 }),
      rect(636, 450, 136, 10, wallTone(c), { rx: 3 }),
      fruitBowl(704, 452, 1.15, paleTone(c, 0.2), c.p.accent),
      person(480, 528, 1.3, c.p.fore, 'point'),
      person(940, 528, 1.25, c.p.fore, 'stand'),
      fg(c, 690, 12),
    ],
  },

  // 26: "De luiaard zegt: Er is een felle leeuw op den weg ... Een deur keert om op haar herre, alzo de luiaard op zijn bed"
  'spreuken-bijbelquiz-deel-26': {
    hue: 170,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1180, sunY: 220, sunR: 40, far: 'none', ground: 'flat', horizon: 512 }),
      citySkyline(c.rand, 1010, 512, 0.8, c.p.far, 6, { opacity: 0.6 }),
      c.soft(470, 440, 150, 0.4, c.p.accent),
      houseFront(400, 516, 1.2, wallTone(c), { door: c.p.accent }),
      person(472, 516, 0.92, c.p.fore, 'stand'),
      standingLion(850, 536, 1.1, c.p.fore, wallTone(c, 0.7), { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 27: "Gelijk ijzer ijzer scherpt, zo scherpt een man het aangezicht zijns naasten"
  'spreuken-bijbelquiz-deel-27': {
    hue: 172,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 360, sunR: 50, far: 'ridge', ground: 'dunes', horizon: 480 }),
      c.soft(704, 360, 130, 0.6, c.p.accent),
      sword(591, 441, 1.0, c.p.near, { rot: -38 }),
      flipX(704, sword(591, 441, 1.0, c.p.near, { rot: -38 })),
      star(704, 356, 30, c.p.accent),
      star(676, 330, 12, c.p.accent),
      star(736, 334, 14, c.p.accent),
      star(722, 384, 10, c.p.accent),
      person(520, 532, 1.35, c.p.fore, 'point'),
      flipX(704, person(520, 532, 1.35, c.p.fore, 'point')),
      fg(c, 690, 14),
    ],
  },

  // 28: "De goddelozen vlieden, waar geen vervolger is; maar elk rechtvaardige is moedig als een jonge leeuw"
  'spreuken-bijbelquiz-deel-28': {
    hue: 174,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'ridge', ground: 'dunes', horizon: 480 }),
      path('M 500 548 C 530 480 600 456 700 452 C 800 448 870 484 910 548 Z', c.p.mid),
      standingLion(700, 470, 1.15, c.p.near, c.p.accent),
      person(220, 506, 0.72, c.p.near, 'walk', { opacity: 0.85 }),
      person(290, 510, 0.66, c.p.near, 'walk', { opacity: 0.8 }),
      fg(c, 690, 14),
    ],
  },

  // 29: "Als er geen profetie is, wordt het volk ontbloot; maar welgelukzalig is hij, die de wet bewaart"
  'spreuken-bijbelquiz-deel-29': {
    hue: 176,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 300, sunR: 56, far: 'ridge', ground: 'flat', horizon: 512 }),
      rect(626, 452, 156, 60, wallTone(c), { rx: 3 }),
      person(704, 454, 1.25, c.p.fore, 'raise'),
      openScroll(704, 272, 0.62, c.p.accent, c.p.accentDeep),
      crowd(c.rand, 390, 546, 0.95, c.p.near, 5, 300),
      crowd(c.rand, 1020, 546, 0.95, c.p.near, 5, 300),
      fg(c, 692, 12),
    ],
  },

  // 30: "De weg eens arends in den hemel, de weg ener slang op een steenrots, de weg eens schips in het hart der zee"
  'spreuken-bijbelquiz-deel-30': {
    hue: 178,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'none', ground: 'water', horizon: 470 }),
      ship(930, 508, 1.1, c.p.near, c.p.accent),
      eagle(640, 290, 0.5, c.p.near),
      path('M -20 560 C 100 520 220 452 340 448 C 440 446 500 500 540 640 L -20 640 Z', c.p.mid),
      serpent(320, 456, 0.85, c.p.fore),
      fg(c, 704, 10),
    ],
  },

  // 31: "Haar kaars gaat des nachts niet uit. Zij legt haar handen aan de spil" - the virtuous wife spinning by lamplight
  'spreuken-bijbelquiz-deel-31': {
    hue: 180,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1180, sunY: 210, sunR: 40, far: 'dunes', ground: 'flat', horizon: 512 }),
      houseFront(1130, 516, 0.85, wallTone(c), { window: wallTone(c, 0.5) }),
      c.soft(400, 380, 190, 0.6),
      lampstand(400, 532, 1.0, c.p.near, c.p.light),
      loom(760, 534, 1.2, c.p.near, c.p.accent, c.p.near),
      person(560, 534, 1.35, c.p.fore, 'point'),
      fg(c, 690, 12),
    ],
  },
};

