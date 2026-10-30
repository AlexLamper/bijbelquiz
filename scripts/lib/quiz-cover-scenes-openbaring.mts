/**
 * Covers for the Openbaring series, one scene per quiz. Each quiz covers one
 * chapter: `openbaring-bijbelquiz-deel-<n>` is chapter n (1-22).
 *
 * Base hue 10, drifting two degrees per chapter (chapter 22 lands on 52).
 * The visions are drawn as symbols in light; God is never drawn as a person
 * (His throne carries only light), Christ is a plain silhouette like any
 * other figure, and the beasts stay distant silhouettes. See
 * `quiz-cover-scene-kit.mts` for the house style; the extra motifs live in
 * `quiz-cover-motifs-spreuken-openbaring.mts`.
 *
 * Chapters: de Verheerlijkte tussen de zeven gouden kandelaren (1); wees
 * getrouw tot de dood, de kroon des levens (2); Ik sta aan de deur en Ik klop
 * (3); de troon in de hemel, de regenboog, de ouderlingen werpen hun kronen
 * neer (4); het Lam en het boek met zeven zegels (5); de vier ruiters (6);
 * de grote schare met palmtakken (7); het gouden altaar en het reukwerk (8);
 * de rook uit de put des afgronds en de sprinkhanen (9); de sterke engel op
 * zee en land met het geopende boekje (10); het meten van de tempel en de
 * twee getuigen (11); de vrouw bekleed met de zon en de draak (12); het
 * beest uit de zee (13); Een op de witte wolk met de scherpe sikkel (14); de
 * glazen zee en de citers Gods (15); de fiolen van de toorn uitgegoten (16);
 * de vrouw op het beest met de gouden drinkbeker (17); de rook van Babylons
 * brand, de zeelieden staan van verre (18); de Ruiter op het witte paard
 * (19); de engel met de sleutel en de grote keten (20); het nieuwe Jeruzalem
 * daalt neer uit de hemel (21); de rivier en de boom des levens (22).
 */

import { mix } from './cover-options/shapes.mjs';
import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  W,
  angel,
  circle,
  citySkyline,
  cloudBank,
  crown,
  ellipse,
  fireBed,
  goblet,
  horse,
  path,
  person,
  rays,
  rotate,
  scroll,
  shafts,
  ship,
  streaks,
  swarm,
  swell,
  templeFront,
  throne,
  tree,
  wheat,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  beast,
  bolt,
  bowl,
  chain,
  flipX,
  goldenCity,
  harp,
  key,
  lamb,
  lampstand,
  moon,
  openScroll,
  paleTone,
  palmFrond,
  rainbow,
  sealedScroll,
  sickle,
  staffBearer,
  star,
  stroke,
  trumpet,
} from './quiz-cover-motifs-spreuken-openbaring.mjs';

/** Fruit on the crown of a `tree(x, y, s)`: offsets in the tree's own units. */
function treeFruit(x: number, y: number, s: number, fill: string): string {
  const k = s * 0.56;
  const spots: [number, number][] = [
    [-74, -100], [-44, -128], [-12, -106], [18, -142], [48, -114], [80, -98], [2, -154], [-30, -88], [36, -90], [-62, -126], [62, -136], [-20, -150],
  ];
  return spots.map(([dx, dy]) => circle(x + dx * k, y + dy * k, 7.5 * k, fill)).join('');
}

/** A rising column of smoke built from soft ellipses. */
function smokePlume(x: number, y: number, h: number, w: number, fill: string, opacity: number, drift = 0): string {
  const out: string[] = [];
  const n = 9;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    out.push(ellipse(x + drift * t * t, y - t * h, w * (0.45 + t * 0.7), w * (0.3 + t * 0.35), fill));
  }
  return `<g opacity="${opacity}">${out.join('')}</g>`;
}

/** A rider seated on a `horse(x, y, s)`. */
function rider(x: number, y: number, s: number, fill: string): string {
  const k = s * 1.3;
  return person(x + 4 * k, y - 62 * k, s * 0.62, fill, 'sit');
}

export const OPENBARING_SCENES: Record<string, Scene> = {
  // 1: "Ik zag zeven gouden kandelaren, en in het midden van de zeven kandelaren Een, den Zoon des mensen gelijk"
  'openbaring-bijbelquiz-deel-1': {
    hue: 10,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 512, stars: 30 }),
      rays(c.rand, 704, 330, 520, '#FFFFFF', 18, { opacity: 0.16 }),
      c.soft(704, 350, 300, 0.7, '#FFFFFF'),
      ...[[250, 528, 0.95], [355, 520, 0.9], [460, 514, 0.85], [565, 508, 0.8]].map(([x, y, s]) => lampstand(x, y, s, c.p.accent, c.p.light)),
      ...[[843, 508, 0.8], [948, 514, 0.85], [1053, 520, 0.9]].map(([x, y, s]) => lampstand(x, y, s, c.p.accent, c.p.light)),
      person(704, 520, 1.45, c.p.fore, 'point'),
      ...[[792, 404], [806, 392], [820, 404], [800, 418], [816, 420], [830, 390], [834, 412]].map(([x, y]) => circle(x, y, 4, c.p.light)),
      flipX(1150, person(1150, 540, 1.0, c.p.fore, 'fallen')),
      fg(c, 692, 12),
    ],
  },

  // 2: "Wees getrouw tot den dood, en Ik zal u geven de kroon des levens" - to Smyrna by the sea
  'openbaring-bijbelquiz-deel-2': {
    hue: 12,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 240, far: 'none', ground: 'water', horizon: 470 }),
      citySkyline(c.rand, 1080, 472, 0.85, c.p.far, 6, { opacity: 0.8 }),
      shafts(704, 90, 220, 270, c.p.glow, 5),
      c.soft(704, 330, 170, 0.6),
      crown(704, 360, 0.95, c.p.accent),
      path(`M -20 534 C 200 510 500 504 760 516 C 1000 526 1200 524 ${W + 20} 514 L ${W + 20} 800 L -20 800 Z`, c.p.mid),
      person(690, 546, 1.35, c.p.fore, 'kneel'),
      fg(c, 704, 10),
    ],
  },

  // 3: "Zie, Ik sta aan de deur en Ik klop; indien iemand Mijn stem zal horen, en de deur opendoen"
  'openbaring-bijbelquiz-deel-3': {
    hue: 14,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1180, sunY: 210, sunR: 40, far: 'dunes', ground: 'flat', horizon: 512 }),
      path('M 330 516 L 330 352 L 640 352 L 640 516 Z', mix(c.a.mid, c.a.figure, 0.32)),
      path('M 316 352 L 654 352 L 654 330 L 316 330 Z', mix(c.a.mid, c.a.figure, 0.32)),
      path('M 560 516 L 560 432 C 560 400 616 400 616 432 L 616 516 Z', mix(c.a.mid, c.a.figure, 0.6)),
      stroke('M 566 516 C 556 470 580 450 572 420 M 612 516 C 622 480 600 460 608 430', mix(c.a.near, c.a.figure, 0.5), 5),
      c.soft(760, 450, 160, 0.55, c.p.accent),
      flipX(700, person(700, 528, 1.35, c.p.fore, 'point')),
      stroke('M 728 446 L 728 464', c.p.fore, 3),
      path('M 716 464 L 740 464 L 744 498 L 712 498 Z', c.p.accent),
      path('M 712 464 L 728 452 L 744 464 Z', c.p.fore),
      fg(c, 690, 12),
    ],
  },

  // 4: "Een troon was gezet in den hemel ... en een regenboog was rondom den troon" - the elders cast their crowns before it
  'openbaring-bijbelquiz-deel-4': {
    hue: 16,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'water', horizon: 500 }),
      c.soft(704, 330, 330, 0.8, '#FFFFFF'),
      rays(c.rand, 704, 330, 520, '#FFFFFF', 16, { opacity: 0.2 }),
      rainbow(704, 474, 250, 16, '#FFFFFF', 0.8),
      throne(704, 510, 1.5, mix(c.a.mid, c.a.figure, 0.45)),
      c.soft(704, 300, 110, 0.7, '#FFFFFF'),
      person(330, 528, 1.0, c.p.fore, 'bow'),
      person(450, 522, 0.92, c.p.fore, 'bow'),
      flipX(958, person(958, 522, 0.92, c.p.fore, 'bow')),
      flipX(1078, person(1078, 528, 1.0, c.p.fore, 'bow')),
      crown(405, 528, 0.3, c.p.accent),
      crown(520, 522, 0.28, c.p.accent),
      crown(888, 522, 0.28, c.p.accent),
      crown(1003, 528, 0.3, c.p.accent),
    ],
  },

  // 5: "Het Lam, dat geslacht is, is waardig te ontvangen ... het boek, met zeven zegelen verzegeld"
  'openbaring-bijbelquiz-deel-5': {
    hue: 18,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 220, far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(704, 300, 260, 0.6, '#FFFFFF'),
      throne(704, 516, 1.6, mix(c.a.mid, c.a.figure, 0.5)),
      lamb(704, 478, 1.5, c.p.light, c.p.near),
      sealedScroll(704, 330, 0.72, c.p.accent, c.p.fore),
      person(420, 530, 1.0, c.p.fore, 'bow'),
      harp(330, 532, 0.65, c.p.near),
      flipX(988, person(988, 530, 1.0, c.p.fore, 'bow')),
      harp(1078, 532, 0.65, c.p.near),
      fg(c, 690, 12),
    ],
  },

  // 6: "En ik zag, en ziet, een wit paard ... een ander paard, dat rood was ... een zwart paard ... een vaal paard"
  'openbaring-bijbelquiz-deel-6': {
    hue: 20,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 330, sunR: 50, far: 'ridge', ground: 'dunes', horizon: 480, clouds: 2 }),
      horse(1090, 504, 0.95, c.p.far, { opacity: 0.85 }),
      rider(1090, 504, 0.95, c.p.near),
      horse(870, 518, 1.05, c.p.fore),
      rider(870, 518, 1.05, c.p.fore),
      horse(650, 528, 1.12, c.p.accent),
      rider(650, 528, 1.12, c.p.fore),
      horse(420, 540, 1.2, paleTone(c, 0.12)),
      rider(420, 540, 1.2, c.p.fore),
      fg(c, 692, 14),
    ],
  },

  // 7: "Een grote schare ... staande voor den troon en voor het Lam, bekleed met lange witte klederen, en palmtakken waren in hun handen"
  'openbaring-bijbelquiz-deel-7': {
    hue: 22,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 220, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(704, 250, 260, 0.7, '#FFFFFF'),
      ...[300, 390, 480, 570, 660, 750, 840, 930, 1020, 1110].map((x, i) => person(x, 500 + (i % 2) * 4, 0.72, c.p.mid, 'raise', { opacity: 0.8 })),
      ...[300, 390, 480, 570, 660, 750, 840, 930, 1020, 1110].map((x, i) => palmFrond(x + 24, 500 + (i % 2) * 4 - 104, 0.5, c.p.accent, { opacity: 0.85 })),
      ...[250, 380, 510, 640, 770, 900, 1030, 1160].map((x, i) => person(x, 542 + (i % 2) * 6, 1.1, c.p.fore, 'raise')),
      ...[250, 380, 510, 640, 770, 900, 1030, 1160].map((x, i) => palmFrond(x + 36, 542 + (i % 2) * 6 - 156, 0.82, c.p.accent)),
      fg(c, 696, 10),
    ],
  },

  // 8: "Een andere engel kwam, en stond aan het altaar, hebbende een gouden wierookvat ... en de rook des reukwerks ging op"
  'openbaring-bijbelquiz-deel-8': {
    hue: 24,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'dunes', ground: 'flat', horizon: 512 }),
      smokePlume(704, 360, 230, 110, '#FFFFFF', 0.55, -40),
      c.soft(704, 430, 210, 0.55, c.p.accent),
      altar(704, 528, 1.5, c.p.accent),
      fireBed(c.rand, 704, 368, 0.42, c.p.light, 4),
      angel(940, 530, 1.15, c.p.near),
      angel(400, 514, 0.85, c.p.mid, { opacity: 0.85 }),
      trumpet(414, 410, 0.55, c.p.mid, { rot: -50, opacity: 0.85 }),
      angel(270, 504, 0.7, c.p.mid, { opacity: 0.65 }),
      trumpet(282, 418, 0.45, c.p.mid, { rot: -50, opacity: 0.65 }),
      fg(c, 692, 12),
    ],
  },

  // 9: "Hij opende den put des afgronds, en er ging een rook op uit den put ... en uit den rook kwamen sprinkhanen"
  'openbaring-bijbelquiz-deel-9': {
    hue: 26,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 220, far: 'ridge', ground: 'dunes', horizon: 490 }),
      c.veil(0, W, c.p.fore, 0.18),
      smokePlume(704, 500, 320, 140, mix(c.a.near, c.a.figure, 0.45), 0.55, 60),
      swarm(c.rand, 420, 220, 660, 190, 2.0, c.p.fore, 44, 'locust'),
      ellipse(704, 536, 140, 24, c.p.fore, { opacity: 0.85 }),
      ellipse(704, 530, 120, 14, mix(c.a.near, c.a.figure, 0.7)),
      key(830, 548, 0.75, c.p.accent, { rot: -12 }),
      fg(c, 692, 14),
    ],
  },

  // 10: "Een sterke engel ... en een regenboog was op zijn hoofd ... en hij zette zijn rechtervoet op de zee, en den linker op de aarde"
  'openbaring-bijbelquiz-deel-10': {
    hue: 28,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 230, far: 'none', ground: 'water', horizon: 480 }),
      path(`M 640 600 C 680 540 760 506 900 498 C 1100 490 1300 492 ${W + 20} 490 L ${W + 20} 800 L 560 800 Z`, c.p.mid),
      cloudBank(c.rand, 704, 470, 1.5, '#FFFFFF', { opacity: 0.6 }),
      c.soft(704, 340, 170, 0.6),
      rainbow(704, 336, 74, 9, '#FFFFFF', 0.85),
      angel(704, 560, 1.6, c.p.near),
      openScroll(860, 436, 0.42, c.p.accent, c.p.accentDeep),
      flipX(1040, person(1040, 540, 1.0, c.p.fore, 'point')),
    ],
  },

  // 11: "Mij werd gegeven een riet, een staf gelijk ... Meet den tempel Gods" - and the two witnesses, the two olive trees
  'openbaring-bijbelquiz-deel-11': {
    hue: 30,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 250, far: 'ridge', ground: 'flat', horizon: 512 }),
      templeFront(704, 506, 1.3, c.p.near, 6),
      tree(300, 522, 1.3, c.p.near),
      tree(1110, 522, 1.3, c.p.near),
      person(420, 532, 1.15, c.p.fore, 'stand'),
      person(990, 532, 1.15, c.p.fore, 'stand'),
      staffBearer(600, 544, 1.3, c.p.fore, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 12: "Een vrouw, bekleed met de zon, en de maan was onder haar voeten, en op haar hoofd een kroon van twaalf sterren" - and the dragon
  'openbaring-bijbelquiz-deel-12': {
    hue: 32,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 512, stars: 40 }),
      c.soft(460, 380, 260, 0.75, '#FFFFFF'),
      circle(460, 390, 104, '#FFFFFF', { opacity: 0.85 }),
      moon(460, 528, 54, '#FFFFFF', { rot: -90 }),
      person(460, 532, 1.4, c.p.fore, 'stand'),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = ((196 + i * (148 / 11)) * Math.PI) / 180;
        return circle(460 + Math.cos(a) * 46, 342 + Math.sin(a) * 46, 6, c.p.accent);
      }),
      streaks(c.rand, 1000, 120, 240, 150, c.p.light, 8, { opacity: 0.5 }),
      beast(1010, 544, 0.92, c.p.near, { heads: 7, wings: true, flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 13: "Ik zag uit de zee een beest opkomen, hebbende zeven hoofden en tien hoornen, en op zijn hoornen tien koninklijke hoeden"
  'openbaring-bijbelquiz-deel-13': {
    hue: 34,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'none', ground: 'swell', horizon: 470 }),
      beast(800, 640, 1.4, c.p.near, { heads: 7, crowns: c.p.accent }),
      swell(c.rand, 560, mix(c.a.far, '#FFFFFF', 0.25)),
      path('M -20 560 C 120 530 260 520 380 540 C 440 552 470 600 480 800 L -20 800 Z', c.p.mid),
      person(220, 546, 0.95, c.p.fore, 'bow'),
      person(330, 552, 1.0, c.p.fore, 'bow'),
    ],
  },

  // 14: "Een witte wolk, en Een zittende op de wolk, den Zoon des mensen gelijk ... en in Zijn hand een scherpe sikkel"
  'openbaring-bijbelquiz-deel-14': {
    hue: 36,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 300, far: 'dunes', ground: 'dunes', horizon: 490 }),
      ...[260, 400, 540, 680, 820, 960, 1100].map((x, i) => wheat(x, 548 + (i % 2) * 6, 0.62, c.p.crop, 6)),
      c.soft(704, 330, 220, 0.6, '#FFFFFF'),
      cloudBank(c.rand, 704, 372, 1.7, '#FFFFFF', { opacity: 0.92 }),
      person(694, 364, 1.2, c.p.fore, 'sit'),
      sickle(756, 330, 0.9, c.p.accent, { rot: 18 }),
      fg(c, 694, 12),
    ],
  },

  // 15: "Een glazen zee, gemengd met vuur, en die overwinning hadden ... staande aan de glazen zee, hebbende de citers Gods"
  'openbaring-bijbelquiz-deel-15': {
    hue: 38,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 290, sunR: 56, far: 'none', ground: 'water', horizon: 480 }),
      templeFront(704, 470, 0.7, c.p.mid, 6, { opacity: 0.6 }),
      smokePlume(704, 370, 150, 70, '#FFFFFF', 0.5),
      ...[[200, 520], [520, 560], [880, 530], [1180, 570], [380, 620], [1000, 640]].map(([x, y]) => ellipse(x, y, 90, 6, c.p.accent, { opacity: 0.45 })),
      ...[400, 590, 820, 1010].map((x, i) => person(x, 552 + (i % 2) * 6, 1.2, c.p.fore, 'stand')),
      ...[400, 590, 820, 1010].map((x, i) => harp(x + 50, 556 + (i % 2) * 6, 0.62, c.p.accent)),
    ],
  },

  // 16: "Gaat heen, en giet de fiolen van den toorn Gods uit op de aarde"
  'openbaring-bijbelquiz-deel-16': {
    hue: 40,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', ground: 'dunes', horizon: 490 }),
      citySkyline(c.rand, 1080, 494, 0.8, c.p.mid, 6, { opacity: 0.85 }),
      bolt(1010, 220, 0.9, '#FFFFFF', { opacity: 0.85 }),
      streaks(c.rand, 760, 220, 520, 280, c.p.light, 40, { opacity: 0.4 }),
      cloudBank(c.rand, 470, 344, 1.2, '#FFFFFF', { opacity: 0.75 }),
      angel(470, 340, 0.95, c.p.near),
      stroke('M 560 300 C 600 340 640 400 660 500', mix(c.a.near, c.a.figure, 0.4), 16, 0.45),
      bowl(540, 286, 1.0, c.p.accent, { rot: 128 }),
      fg(c, 692, 14),
    ],
  },

  // 17: "Een vrouw, zittende op een scharlakenrood beest ... hebbende een gouden drinkbeker in haar hand" - in the wilderness
  'openbaring-bijbelquiz-deel-17': {
    hue: 42,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 360, sunR: 54, far: 'dunes', ground: 'dunes', horizon: 490 }),
      beast(700, 548, 1.0, c.p.near, { heads: 7, fan: [-74, -6] }),
      person(648, 436, 1.1, c.p.fore, 'sit'),
      goblet(588, 350, 1.25, c.p.accent),
      fg(c, 694, 14),
    ],
  },

  // 18: "En zij zullen van verre staan ... ziende den rook harer brand" - Babylon burning, the sailors watching from the sea
  'openbaring-bijbelquiz-deel-18': {
    hue: 44,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'water', horizon: 470 }),
      c.soft(840, 420, 340, 0.45, c.p.accent),
      smokePlume(860, 440, 300, 170, mix(c.a.near, c.a.figure, 0.4), 0.5, -120),
      ziggurat(940, 474, 1.2, c.p.near),
      citySkyline(c.rand, 840, 474, 1.15, c.p.near, 9),
      fireBed(c.rand, 840, 452, 1.3, c.p.accent, 14),
      ship(360, 566, 0.9, c.p.fore, c.p.mid),
      person(320, 536, 0.5, c.p.fore, 'raise'),
      person(400, 536, 0.5, c.p.fore, 'stand'),
    ],
  },

  // 19: "Ik zag den hemel geopend, en ziet, een wit paard, en Die daarop zat, werd genaamd Getrouw en Waarachtig ... op Zijn hoofd vele koninklijke hoeden"
  'openbaring-bijbelquiz-deel-19': {
    hue: 46,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 150, far: 'none', ground: 'flat', horizon: 520, clouds: 3 }),
      shafts(704, 40, 420, 380, '#FFFFFF', 5),
      horse(1060, 476, 0.85, paleTone(c, 0.1), { opacity: 0.75 }),
      rider(1060, 476, 0.85, c.p.near),
      horse(1210, 486, 0.75, paleTone(c, 0.1), { opacity: 0.65 }),
      rider(1210, 486, 0.75, c.p.near),
      cloudBank(c.rand, 700, 540, 2.0, '#FFFFFF', { opacity: 0.55 }),
      horse(680, 530, 1.5, paleTone(c, 0.04)),
      rider(680, 530, 1.5, c.p.fore),
      crown(688, 296, 0.34, c.p.accent),
      fg(c, 700, 10),
    ],
  },

  // 20: "Een engel, nederdalende uit den hemel, hebbende den sleutel des afgronds, en een grote keten in zijn hand"
  'openbaring-bijbelquiz-deel-20': {
    hue: 48,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', ground: 'dunes', horizon: 490, stars: 30 }),
      c.soft(704, 300, 230, 0.6, '#FFFFFF'),
      ellipse(704, 548, 170, 30, c.p.fore, { opacity: 0.85 }),
      ellipse(704, 540, 146, 18, mix(c.a.near, c.a.figure, 0.75)),
      chain(682, 356, 640, 540, 1.1, c.p.near),
      angel(704, 424, 1.15, c.p.near),
      key(732, 364, 0.62, c.p.accent, { rot: 70 }),
      fg(c, 692, 14),
    ],
  },

  // 21: "Ik zag de heilige stad, het nieuwe Jeruzalem, nederdalende van God uit den hemel" - seen from a high mountain
  'openbaring-bijbelquiz-deel-21': {
    hue: 50,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', ground: 'dunes', horizon: 500 }),
      c.soft(800, 330, 380, 0.8, '#FFFFFF'),
      rays(c.rand, 800, 330, 620, '#FFFFFF', 18, { opacity: 0.2 }),
      cloudBank(c.rand, 800, 452, 1.8, '#FFFFFF', { opacity: 0.85 }),
      goldenCity(800, 440, 0.8, c.p.accent, '#FFFFFF'),
      path('M -20 620 C 80 540 190 466 290 460 C 370 456 440 520 520 640 Z', c.p.mid),
      angel(230, 466, 0.85, c.p.near),
      person(330, 470, 1.0, c.p.fore, 'point'),
      fg(c, 700, 10),
    ],
  },

  // 22: "Een zuivere rivier van het water des levens ... en aan deze en gene zijde der rivier was het hout des levens"
  'openbaring-bijbelquiz-deel-22': {
    hue: 52,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 330, rays: true, far: 'ridge', ground: 'dunes', horizon: 470 }),
      c.soft(704, 440, 260, 0.75, '#FFFFFF'),
      fg(c, 690, 14),
      path('M 690 474 L 718 474 C 742 540 820 600 900 800 L 500 800 C 580 600 666 540 690 474 Z', c.p.water),
      stroke('M 690 520 L 724 520 M 660 580 L 740 580 M 620 650 L 780 650', '#FFFFFF', 4, 0.6),
      tree(470, 552, 1.75, c.p.near),
      treeFruit(470, 552, 1.75, c.p.accent),
      tree(950, 552, 1.75, c.p.near),
      treeFruit(950, 552, 1.75, c.p.accent),
    ],
  },
};
