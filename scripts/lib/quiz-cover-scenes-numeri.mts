/**
 * Covers for the Numeri series, one scene per quiz. Each quiz covers one
 * chapter: `numeri-bijbelquiz-deel-<n>` is chapter n (1-36).
 *
 * Base hue 120, drifting two degrees per chapter (chapter 36 lands on 190).
 * See `quiz-cover-scene-kit.mts` for the house style. Numeri is the book of
 * the camp on the move: the census and the camp order come back as tents,
 * banners and scrolls, the wilderness stories as their best-known moment.
 * Motifs the shared kit lacks live in `quiz-cover-motifs-leviticus-numeri.mts`.
 *
 * Chapters: de volkstelling in de woestijn Sinai (1); de legerorde rondom de
 * tabernakel, stam bij zijn banier (2); de Levieten en de losprijs van de
 * eerstgeborenen (3); de Kahathieten dragen de ark (4); het water der
 * ijvering (5); de priesterzegen "De HEERE zegene u" (6); de wagens en gaven
 * van de twaalf oversten (7); de zeven lampen van de kandelaar (8); de wolk
 * en het vuur over de tabernakel (9); de zilveren trompetten en het vertrek
 * (10); de kwakkelen (11); Mirjam wit als sneeuw buiten het leger (12); de
 * verspieders met de druiventros (13); Jozua en Kaleb tegenover het morrende
 * volk (14); de man die op de sabbat hout raapte (15); de aarde opent zich
 * onder Korach (16); de bloeiende staf van Aaron (17); de tienden van de
 * dorsvloer (18); de rode vaars (19); water uit de steenrots (20); de koperen
 * slang (21); Bileams ezelin en de Engel met het zwaard (22); Bileam bij de
 * zeven altaren (23); een ster uit Jakob (24); Pinehas met de spies (25); de
 * tweede telling in de vlakke velden van Moab (26); Mozes legt Jozua de
 * handen op (27); de dagelijkse offers en de nieuwe maan (28); de stieren van
 * het loofhuttenfeest (29); de gelofte van een dochter in haar vaders huis
 * (30); de buit van Midian en het goud voor de HEERE (31); Ruben en Gad bij
 * hun kudden aan de overzijde van de Jordaan (32); de reizen van Israel (33);
 * de grenzen van het land (34); de vrijstad (35); de dochters van Zelafead en
 * hun erfdeel (36).
 */

import { base, fg, type C, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  banner,
  basket,
  brickWall,
  cityWall,
  coin,
  crowd,
  donkey,
  dove,
  ellipse,
  gateArch,
  goblet,
  grapes,
  houseBlock,
  ox,
  palm,
  path,
  pyramids,
  ram,
  ring,
  rotate,
  serpent,
  shrub,
  streaks,
  tent,
  trail,
  tree,
  vineRow,
  wheat,
  window as windowFrame,
} from './quiz-cover-primitives.mjs';
import { mix } from './cover-options/shapes.mjs';
import {
  altar,
  altarFire,
  angelWithSword,
  arkOfCovenant,
  balance,
  bigStar,
  boundaryStone,
  booth,
  bronzeSerpent,
  buddingRod,
  censer,
  chasm,
  courtFence,
  coveredWagon,
  dish,
  dottedCurve,
  fallen,
  fig,
  firePillar,
  idol,
  jar,
  kneel,
  lamb,
  menorah,
  moon,
  openScroll,
  priestGarb,
  rockSpring,
  rod,
  seated,
  sheepfold,
  sticks,
  stroke,
  tabernacle,
  trumpet,
  spear,
} from './quiz-cover-motifs-leviticus-numeri.mjs';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Altar fire in the accent, with a lighter heart. */
function fire(c: C, x: number, y: number, s: number): string {
  return altarFire(x, y, s, c.p.accent, mix(c.p.accent, '#FFF1C8', 0.5), c.p.light);
}

/** The court's white linen and its posts. */
const linen = (c: C) => mix(c.p.light, c.a.near, 0.18);
const post = (c: C) => mix(c.p.near, linen(c), 0.3);

/** The tabernacle inside its court: the tent, then the linen fence in front. */
function sanctuary(c: C, x: number, y: number, s: number, fence: number, gate?: string, flip = false): string {
  return tabernacle(x, y - 12 * s, s, c.p.mid, c.p.near, { flip }) + courtFence(x, y, fence, 0.9 * s, linen(c), post(c), gate);
}

/** Soft white smoke rising from a point and drifting right. */
function smoke(c: C, x: number, y: number, s: number, n = 7, opacity = 0.55): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    out.push(ellipse(x + t * t * 90 * s + (c.rand() - 0.5) * 10 * s, y - t * 190 * s, (18 + t * 34) * s, (14 + t * 16) * s, c.p.light, { opacity: Math.round((opacity - t * opacity * 0.6) * 100) / 100 }));
  }
  return out.join('');
}

/** Mirror a fragment about the vertical line through x (for motifs that only face one way). */
const mirror = (x: number, inner: string) => `<g transform="translate(${2 * x} 0) scale(-1 1)">${inner}</g>`;

/** A row of tents along a line, alternating size a little. */
function tentRow(x0: number, x1: number, y: number, s: number, fill: string, n: number, dy = 6): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    out.push(tent(x0 + (x1 - x0) * t, y + (i % 2 ? dy : 0), s * (i % 2 ? 0.9 : 1), fill));
  }
  return out.join('');
}

// ── scenes ──────────────────────────────────────────────────────────────────

export const NUMERI_SCENES: Record<string, Scene> = {
  // 1: the census in the wilderness of Sinai - Moses with the open roll, the men of war lined up before the mountain
  'numeri-bijbelquiz-deel-1': {
    hue: 120,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 216, far: 'none', horizon: 474 }),
      path('M 60 486 C 180 420 260 330 360 270 C 400 246 430 250 460 276 C 520 234 560 230 600 262 C 700 340 800 420 960 486 Z', c.p.mid),
      seated(330, 560, 1.3, c.p.fore),
      path('M 380 520 L 560 520 L 560 530 L 380 530 Z', c.p.near),
      path('M 392 530 L 402 530 L 402 562 L 392 562 Z', c.p.near),
      path('M 538 530 L 548 530 L 548 562 L 538 562 Z', c.p.near),
      openScroll(470, 518, 0.95, c.p.accent, mix(c.p.accent, c.a.figure, 0.35)),
      fig(680, 560, 1.3, c.p.fore, 'stand'),
      spear(712, 560, 1.15, c.p.fore, 190),
      fig(790, 554, 1.18, c.p.near, 'stand'),
      fig(890, 548, 1.06, c.p.near, 'stand', { opacity: 0.92 }),
      spear(918, 548, 0.95, c.p.near, 190),
      fig(980, 542, 0.96, c.p.near, 'stand', { opacity: 0.86 }),
      fig(1060, 536, 0.86, c.p.near, 'stand', { opacity: 0.8 }),
      fig(1130, 530, 0.78, c.p.near, 'stand', { opacity: 0.74 }),
      fig(1195, 525, 0.7, c.p.near, 'stand', { opacity: 0.68 }),
      fg(c, 690, 12),
    ],
  },

  // 2: the camp around the tabernacle - every tribe by its own standard, the tents in rows on every side
  'numeri-bijbelquiz-deel-2': {
    hue: 122,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 224, far: 'dunes', horizon: 476 }),
      sanctuary(c, 704, 498, 0.85, 400),
      tentRow(170, 500, 492, 0.55, c.p.far, 5),
      tentRow(910, 1250, 492, 0.55, c.p.far, 5),
      banner(250, 498, 0.55, c.p.near, c.p.accent),
      banner(1180, 498, 0.55, c.p.near, c.p.accent),
      tentRow(160, 520, 552, 0.95, c.p.mid, 4, 8),
      tentRow(890, 1260, 552, 0.95, c.p.mid, 4, 8),
      banner(560, 566, 1.05, c.p.fore, c.p.accent),
      banner(830, 566, 1.05, c.p.fore, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 3: the Levites for the firstborn - the five shekels of the redemption money weighed out before the tabernacle
  'numeri-bijbelquiz-deel-3': {
    hue: 124,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 236, far: 'ridge', horizon: 474 }),
      sanctuary(c, 330, 500, 0.9, 420),
      fig(500, 560, 1.4, c.p.fore, 'reach'),
      priestGarb(500, 560, 1.4, null, c.p.light),
      balance(720, 566, 1.45, c.p.near, c.p.near, 9),
      coin(818, 474, 1.0, c.p.accent),
      coin(840, 470, 1.0, c.p.accent),
      coin(828, 454, 1.0, c.p.accent),
      coin(808, 458, 0.9, c.p.accent),
      coin(850, 452, 0.9, c.p.accent),
      fig(1010, 560, 1.3, c.p.fore, 'stand'),
      fig(1080, 560, 0.75, c.p.fore, 'stand'),
      fig(1170, 556, 1.2, c.p.near, 'stand', { opacity: 0.9 }),
      fig(1235, 556, 0.7, c.p.near, 'stand', { opacity: 0.9 }),
      fg(c, 690, 12),
    ],
  },

  // 4: the Kohathites bear the ark of the covenant on its poles; the Merarites follow with boards and pillars
  'numeri-bijbelquiz-deel-4': {
    hue: 126,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 226, far: 'dunes', horizon: 470 }),
      fig(1110, 540, 1.1, c.p.near, 'walk', { opacity: 0.9 }),
      rotate(-62, 1124, 432, path('M 1060 424 L 1200 424 L 1200 438 L 1060 438 Z', c.p.near)),
      fig(1230, 536, 1.0, c.p.near, 'walk', { opacity: 0.85 }),
      rotate(-62, 1242, 438, path('M 1176 430 L 1310 430 L 1310 444 L 1176 444 Z', c.p.near)),
      c.soft(700, 340, 170, 0.35),
      fig(500, 562, 1.42, c.p.fore, 'walk'),
      fig(900, 562, 1.42, c.p.fore, 'walk'),
      arkOfCovenant(700, 446, 1.3, c.p.accent, { poles: c.p.fore, poleLen: 235 }),
      fg(c, 690, 12),
    ],
  },

  // 5: the law of jealousy - the priest holds out the earthen vessel of bitter water before the woman, her head uncovered
  'numeri-bijbelquiz-deel-5': {
    hue: 128,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 360, sunR: 56, far: 'ridge', horizon: 474 }),
      sanctuary(c, 1060, 500, 0.9, 420),
      fig(420, 560, 1.35, c.p.fore, 'carry', { hood: false }),
      dish(420, 476, 0.6, c.p.near),
      fig(660, 562, 1.48, c.p.fore, 'reach', { flip: true }),
      priestGarb(660, 562, 1.48, null, c.p.light, { flip: true }),
      path('M 548 452 C 550 486 610 486 612 452 Z', c.p.accent),
      path('M 544 448 L 616 448 L 616 456 L 544 456 Z', c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 6: "De HEERE zegene u en behoede u" - Aaron lifts his hands over the people at sunrise
  'numeri-bijbelquiz-deel-6': {
    hue: 130,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 300, sunR: 64, rays: true, far: 'ridge', horizon: 476 }),
      ellipse(520, 512, 200, 50, c.p.mid),
      c.soft(520, 360, 170, 0.45),
      fig(520, 486, 1.5, c.p.fore, 'raise'),
      priestGarb(520, 486, 1.5, c.p.accent, c.p.light),
      kneel(300, 572, 1.05, c.p.near, 'up'),
      crowd(c.rand, 900, 566, 1.0, c.p.near, 6, 420),
      fg(c, 692, 12),
    ],
  },

  // 7: the leaders' gifts - covered wagons drawn by oxen, a prince going before with the golden dish full of incense
  'numeri-bijbelquiz-deel-7': {
    hue: 132,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 236, far: 'dunes', horizon: 474 }),
      sanctuary(c, 230, 498, 0.7, 300),
      ox(1000, 526, 0.62, c.p.mid),
      coveredWagon(1150, 524, 0.72, c.p.mid, mix(c.p.light, c.a.far, 0.3)),
      ox(590, 562, 1.0, c.p.near),
      coveredWagon(800, 562, 1.15, c.p.near, mix(c.p.light, c.a.far, 0.25)),
      fig(400, 564, 1.38, c.p.fore, 'raise', { flip: true }),
      dish(400, 382, 0.95, c.p.accent, mix(c.p.light, c.p.accent, 0.25)),
      fg(c, 692, 12),
    ],
  },

  // 8: "De zeven lampen zullen tegenover den kandelaar lichten" - Aaron lights the lamps of the golden lampstand
  'numeri-bijbelquiz-deel-8': {
    hue: 134,
    mood: 'dusk',
    draw: (c) => {
      const cloth = mix(c.a.near, c.a.figure, 0.18);
      const pleats: string[] = [];
      for (let x = 140; x < 1300; x += 64) pleats.push(path(`M ${x} 170 L ${x + 18} 170 L ${x + 18} 528 L ${x} 528 Z`, mix(cloth, '#FFFFFF', 0.1)));
      return [
        base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 528 }),
        path('M 60 160 L 1350 160 L 1350 532 L 60 532 Z', cloth),
        pleats.join(''),
        c.soft(680, 330, 300, 0.55),
        menorah(680, 566, 1.75, c.p.accent, c.p.light),
        fig(930, 572, 1.45, c.p.fore, 'raise', { flip: true }),
        priestGarb(930, 572, 1.45, null, c.p.light, { flip: true }),
        stroke('M 882 362 L 838 312', c.p.fore, 5),
        fg(c, 704, 10),
      ];
    },
  },

  // 9: "Des avonds was het over den tabernakel als de gedaante des vuurs" - the pillar of fire over the tabernacle, the camp asleep
  'numeri-bijbelquiz-deel-9': {
    hue: 136,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 476, stars: 60 }),
      c.soft(704, 300, 300, 0.5, c.p.accent),
      firePillar(704, 420, 300, 120, c.p.accent, mix(c.p.accent, '#FFF1C8', 0.5), c.p.light),
      sanctuary(c, 704, 512, 1.0, 470),
      tentRow(150, 470, 506, 0.7, c.p.mid, 4),
      tentRow(940, 1260, 506, 0.7, c.p.mid, 4),
      tentRow(190, 500, 566, 1.0, c.p.near, 3, 6),
      tentRow(910, 1230, 566, 1.0, c.p.near, 3, 6),
      fg(c, 692, 12),
    ],
  },

  // 10: the two silver trumpets sound and the camp sets out from the wilderness of Sinai
  'numeri-bijbelquiz-deel-10': {
    hue: 138,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 250, rays: true, far: 'ridge', horizon: 474 }),
      fig(820, 540, 0.95, c.p.near, 'walk', { opacity: 0.9 }),
      fig(900, 536, 0.88, c.p.near, 'walk', { opacity: 0.86 }),
      banner(950, 536, 0.75, c.p.near, c.p.near),
      fig(1000, 532, 0.82, c.p.near, 'walk', { opacity: 0.8 }),
      fig(1080, 528, 0.76, c.p.near, 'walk', { opacity: 0.76 }),
      fig(1150, 524, 0.7, c.p.near, 'walk', { opacity: 0.7 }),
      fig(1215, 520, 0.64, c.p.near, 'walk', { opacity: 0.66 }),
      fig(380, 562, 1.48, c.p.fore, 'shield'),
      priestGarb(380, 562, 1.48, null, c.p.light),
      trumpet(392, 386, 1.15, c.p.accent, -24),
      fig(560, 562, 1.38, c.p.fore, 'shield'),
      priestGarb(560, 562, 1.38, null, c.p.light),
      trumpet(572, 398, 1.05, c.p.accent, -18),
      fg(c, 690, 12),
    ],
  },

  // 11: the quails - a wind from the LORD drives them over the camp, the people gather them by the basketful
  'numeri-bijbelquiz-deel-11': {
    hue: 140,
    mood: 'day',
    draw: (c) => {
      const birds: string[] = [];
      for (let i = 0; i < 34; i += 1) {
        const x = 220 + c.rand() * 1040;
        const y = 170 + c.rand() * 230;
        birds.push(dove(x, y, 0.28 + c.rand() * 0.22, c.p.near, { opacity: Math.round((0.55 + c.rand() * 0.45) * 100) / 100 }));
      }
      return [
        base(c, { sunX: 1190, sunY: 216, far: 'dunes', clouds: 2, horizon: 476 }),
        streaks(c.rand, 120, 160, 1180, 300, c.p.light, 26, { opacity: 0.35 }),
        tentRow(170, 400, 504, 0.7, c.p.mid, 3),
        tentRow(1030, 1260, 504, 0.7, c.p.mid, 3),
        birds.join(''),
        dove(560, 548, 0.42, c.p.near),
        dove(980, 556, 0.4, c.p.near),
        kneel(560, 568, 1.4, c.p.fore, 'forward'),
        basket(700, 566, 1.35, c.p.accent),
        dove(684, 520, 0.36, c.p.near),
        dove(716, 516, 0.34, c.p.near),
        fig(880, 566, 1.4, c.p.fore, 'raise'),
        fg(c, 692, 12),
      ];
    },
  },

  // 12: Miriam struck white as snow, shut outside the camp seven days; Moses cries out for her
  'numeri-bijbelquiz-deel-12': {
    hue: 142,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1050, sunY: 250, far: 'dunes', clouds: 2, horizon: 478 }),
      sanctuary(c, 1040, 506, 0.85, 400, c.p.accent),
      tent(820, 520, 0.7, c.p.mid),
      tent(1270, 520, 0.7, c.p.mid),
      c.soft(330, 470, 150, 0.25, c.a.figure),
      fig(330, 564, 1.38, c.p.light, 'stand'),
      kneel(640, 568, 1.4, c.p.fore, 'up'),
      fg(c, 692, 12),
    ],
  },

  // 13: the twelve spies come back from the valley of Eshcol with one cluster of grapes on a pole between two men
  'numeri-bijbelquiz-deel-13': {
    hue: 144,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 236, far: 'ridge', horizon: 470 }),
      tree(1080, 500, 1.0, c.p.mid),
      tree(1220, 506, 0.85, c.p.mid),
      palm(220, 516, 0.95, c.p.mid),
      vineRow(c.rand, 980, 534, 0.7, c.p.mid, 5),
      fig(480, 566, 1.5, c.p.fore, 'walk'),
      fig(920, 566, 1.5, c.p.fore, 'walk'),
      stroke('M 440 420 L 970 420', c.p.fore, 10),
      stroke('M 700 420 L 700 436', c.p.fore, 6),
      grapes(700, 456, 2.5, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 14: Joshua and Caleb stand against the murmuring people, Moses and Aaron fall on their faces, the glory appears at the tabernacle
  'numeri-bijbelquiz-deel-14': {
    hue: 146,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 300, far: 'dunes', horizon: 476 }),
      c.soft(704, 420, 240, 0.5, c.p.accent),
      sanctuary(c, 704, 506, 0.9, 420, c.p.accent),
      crowd(c.rand, 300, 566, 1.05, c.p.near, 6, 330),
      fallen(640, 572, 1.05, c.p.fore),
      fallen(780, 574, 1.0, c.p.fore),
      fig(1010, 566, 1.42, c.p.fore, 'reach', { flip: true }),
      fig(1120, 566, 1.36, c.p.fore, 'stand'),
      fg(c, 692, 12),
    ],
  },

  // 15: the man found gathering sticks on the sabbath day
  'numeri-bijbelquiz-deel-15': {
    hue: 148,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 224, far: 'ridge', horizon: 474 }),
      tentRow(1020, 1270, 506, 0.7, c.p.mid, 3),
      fig(940, 556, 1.15, c.p.near, 'stand', { flip: true }),
      fig(1010, 556, 1.1, c.p.near, 'reach', { flip: true }),
      shrub(300, 556, 1.0, c.p.mid),
      stroke('M 330 566 L 380 560 M 760 572 L 800 562 M 770 566 L 790 552', c.p.near, 5),
      kneel(520, 570, 1.5, c.p.fore, 'plant'),
      sticks(650, 548, 1.05, c.p.accent, -6),
      fg(c, 692, 12),
    ],
  },

  // 16: Korah's rebellion - the ground splits under the tents of the rebels; the censers of the two hundred and fifty lie in the fire
  'numeri-bijbelquiz-deel-16': {
    hue: 150,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 236, far: 'ridge', clouds: 3, horizon: 476 }),
      rotate(-14, 600, 524, tent(600, 524, 1.0, c.p.mid)),
      rotate(12, 830, 526, tent(830, 526, 0.95, c.p.mid)),
      chasm(710, 552, 640, 1.6, mix(c.a.figure, c.a.near, 0.2)),
      fig(260, 566, 1.45, c.p.fore, 'reach'),
      censer(1080, 576, 1.05, c.p.near, c.p.accent),
      censer(1200, 572, 0.95, c.p.near, c.p.accent),
      censer(1140, 590, 1.1, c.p.near, c.p.accent),
      fg(c, 700, 10),
    ],
  },

  // 17: Aaron's rod among the twelve has budded, blossomed and borne almonds
  'numeri-bijbelquiz-deel-17': {
    hue: 152,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 246, far: 'none', ground: 'flat', horizon: 504 }),
      sanctuary(c, 704, 504, 0.75, 1500),
      c.soft(704, 380, 170, 0.5),
      rod(340, 566, 1, c.p.near, 200, false, -3),
      rod(410, 566, 1, c.p.near, 206, false, 2),
      rod(480, 566, 1, c.p.near, 198, false, -2),
      rod(550, 566, 1, c.p.near, 204, false, 3),
      rod(620, 566, 1, c.p.near, 200, false, -1),
      rod(788, 566, 1, c.p.near, 202, false, 2),
      rod(858, 566, 1, c.p.near, 198, false, -3),
      rod(928, 566, 1, c.p.near, 206, false, 1),
      rod(998, 566, 1, c.p.near, 200, false, -2),
      rod(1068, 566, 1, c.p.near, 204, false, 3),
      rod(1138, 566, 1, c.p.near, 198, false, -1),
      buddingRod(704, 566, 1.12, c.p.near, c.p.accent, 220),
      fg(c, 692, 12),
    ],
  },

  // 18: the tithes for the Levites "als koren van den dorsvloer" - the heap on the threshing floor, the tenth carried off
  'numeri-bijbelquiz-deel-18': {
    hue: 154,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 236, far: 'dunes', horizon: 474 }),
      ellipse(640, 560, 230, 30, mix(c.a.mid, '#FFFFFF', 0.3)),
      path('M 520 560 C 560 470 720 470 760 560 Z', c.p.accent),
      ox(1000, 548, 0.85, c.p.near),
      kneel(380, 572, 1.35, c.p.fore, 'forward'),
      basket(480, 570, 0.8, c.p.near),
      fig(880, 568, 1.42, c.p.fore, 'carry', { flip: true }),
      priestGarb(880, 568, 1.42, null, c.p.light, { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 19: the red heifer without blemish, on which never came yoke, led out of the camp
  'numeri-bijbelquiz-deel-19': {
    hue: 156,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 226, far: 'ridge', horizon: 474 }),
      tentRow(1050, 1270, 504, 0.65, c.p.mid, 3),
      tree(1180, 520, 0.8, c.p.mid),
      fig(480, 566, 1.45, c.p.fore, 'walk', { flip: true }),
      priestGarb(480, 566, 1.45, null, c.p.light, { flip: true }),
      stroke('M 452 470 Q 560 500 642 456', c.p.fore, 3),
      ox(760, 566, 1.35, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 20: water out of the rock - Moses strikes the rock with his rod and the water gushes out for the people and their cattle
  'numeri-bijbelquiz-deel-20': {
    hue: 158,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 330, sunR: 56, far: 'dunes', horizon: 476 }),
      rockSpring(470, 566, 1.3, mix(c.a.near, c.a.figure, 0.28), c.p.light),
      fig(780, 566, 1.45, c.p.fore, 'reach', { flip: true }),
      rod(706, 490, 1, c.p.accent, 170, false, -44),
      kneel(980, 570, 1.25, c.p.near, 'plant', { flip: true }),
      fig(1100, 566, 1.25, c.p.near, 'carry'),
      jar(1100, 488, 0.55, c.p.near),
      ox(1240, 562, 0.8, c.p.near),
      fg(c, 692, 12),
    ],
  },

  // 21: the bronze serpent on the pole - whoever was bitten and looked at it, lived
  'numeri-bijbelquiz-deel-21': {
    hue: 160,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 250, far: 'dunes', clouds: 2, horizon: 476 }),
      c.soft(704, 300, 200, 0.4),
      bronzeSerpent(704, 566, 1.25, c.p.near, c.p.accent),
      fallen(310, 576, 1.15, c.p.fore),
      kneel(480, 572, 1.35, c.p.fore, 'up'),
      fig(930, 566, 1.4, c.p.fore, 'raise'),
      fig(1060, 560, 1.15, c.p.near, 'stand', { opacity: 0.9 }),
      serpent(1170, 578, 0.42, c.p.near),
      serpent(220, 584, 0.38, c.p.near),
      fg(c, 700, 10),
    ],
  },

  // 22: Balaam's donkey sees the Angel of the LORD standing in the way with His sword drawn, between the vineyard walls
  'numeri-bijbelquiz-deel-22': {
    hue: 162,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 220, far: 'ridge', horizon: 472 }),
      vineRow(c.rand, 180, 516, 0.8, c.p.mid, 5),
      vineRow(c.rand, 930, 516, 0.8, c.p.mid, 6),
      brickWall(c.rand, 150, 538, 1.0, c.p.mid, 3, 12),
      brickWall(c.rand, 900, 538, 1.0, c.p.mid, 3, 13),
      c.soft(430, 400, 190, 0.6),
      angelWithSword(430, 566, 1.4, mix(c.p.light, c.a.far, 0.18), c.p.accent),
      donkey(800, 566, 1.15, c.p.near),
      seated(816, 486, 0.9, c.p.fore),
      rod(850, 440, 1, c.p.fore, 110, false, 34),
      fg(c, 692, 12),
    ],
  },

  // 23: on the heights of Baal, Balaam beside the seven altars looks down on Israel's camp and blesses where he was hired to curse
  'numeri-bijbelquiz-deel-23': {
    hue: 164,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 236, far: 'dunes', horizon: 500 }),
      tentRow(960, 1280, 528, 0.42, c.p.far, 7, 10),
      tentRow(1000, 1260, 556, 0.48, c.p.far, 5, 8),
      path(`M -20 476 L 760 470 C 830 478 880 530 920 600 L 960 ${H} L -20 ${H} Z`, c.p.mid),
      altar(170, 486, 0.42, c.p.near),
      fire(c, 170, 454, 0.32),
      altar(250, 484, 0.42, c.p.near),
      fire(c, 250, 452, 0.32),
      altar(330, 482, 0.42, c.p.near),
      fire(c, 330, 450, 0.32),
      altar(410, 482, 0.42, c.p.near),
      fire(c, 410, 450, 0.32),
      altar(490, 480, 0.42, c.p.near),
      fire(c, 490, 448, 0.32),
      altar(570, 480, 0.42, c.p.near),
      fire(c, 570, 448, 0.32),
      altar(650, 478, 0.42, c.p.near),
      fire(c, 650, 446, 0.32),
      fig(650, 520, 1.3, c.p.near, 'stand'),
      fig(790, 516, 1.45, c.p.fore, 'reach'),
      fg(c, 700, 10),
    ],
  },

  // 24: "Er zal een ster voortgaan uit Jakob" - the star over Israel's tents spread out like gardens by a river
  'numeri-bijbelquiz-deel-24': {
    hue: 166,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 480, stars: 60 }),
      c.soft(900, 290, 220, 0.6, c.p.accent),
      bigStar(900, 290, 1.25, c.p.accent),
      path(`M 560 520 C 760 506 1000 520 1300 512 L 1300 530 C 1000 538 760 526 560 538 Z`, c.p.water),
      tentRow(640, 1240, 508, 0.6, c.p.mid, 7, 6),
      palm(1260, 520, 0.8, c.p.near),
      tentRow(680, 1220, 572, 0.85, c.p.near, 5, 6),
      ellipse(330, 520, 210, 56, c.p.mid),
      fig(330, 492, 1.42, c.p.fore, 'raise'),
      fg(c, 700, 10),
    ],
  },

  // 25: Baal-Peor - while the people weep at the tabernacle door, Phinehas rises with the spear in his hand
  'numeri-bijbelquiz-deel-25': {
    hue: 168,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 290, sunY: 250, far: 'ridge', clouds: 3, horizon: 476 }),
      ellipse(1160, 506, 190, 44, c.p.mid),
      idol(1160, 476, 0.7, c.p.mid),
      sanctuary(c, 470, 506, 0.85, 400),
      kneel(330, 570, 1.1, c.p.near, 'pray'),
      kneel(450, 572, 1.05, c.p.near, 'forward'),
      kneel(570, 570, 1.1, c.p.near, 'pray'),
      fig(830, 568, 1.55, c.p.fore, 'walk'),
      spear(866, 568, 1.0, c.p.accent, 280, 10),
      fg(c, 692, 12),
    ],
  },

  // 26: the second census in the plains of Moab by the Jordan near Jericho - Moses and Eleazar with the roll of the new generation
  'numeri-bijbelquiz-deel-26': {
    hue: 170,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 290, sunR: 54, far: 'dunes', ground: 'flat', horizon: 486 }),
      path(`M 1000 486 L 1060 486 C 1100 540 1180 600 1320 ${H} L 1150 ${H} C 1060 620 1010 540 1000 486 Z`, c.p.water),
      cityWall(1220, 484, 0.45, c.p.far, 170),
      palm(1120, 500, 0.7, c.p.mid),
      palm(1300, 498, 0.65, c.p.mid),
      tentRow(140, 300, 512, 0.6, c.p.mid, 3),
      crowd(c.rand, 860, 556, 0.85, c.p.near, 5, 220),
      fig(410, 566, 1.45, c.p.fore, 'reach'),
      fig(660, 566, 1.45, c.p.fore, 'reach', { flip: true }),
      priestGarb(660, 566, 1.45, null, c.p.light, { flip: true }),
      openScroll(535, 494, 0.72, c.p.accent, mix(c.p.accent, c.a.figure, 0.35)),
      fg(c, 692, 12),
    ],
  },

  // 27: Moses lays his hands on Joshua before Eleazar and the whole congregation
  'numeri-bijbelquiz-deel-27': {
    hue: 172,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 240, rays: true, far: 'ridge', horizon: 474 }),
      crowd(c.rand, 1110, 540, 0.8, c.p.mid, 5, 240),
      fig(560, 566, 1.55, c.p.fore, 'reach'),
      kneel(668, 574, 1.4, c.p.fore, 'pray', { flip: true }),
      fig(880, 566, 1.42, c.p.fore, 'stand'),
      priestGarb(880, 566, 1.42, c.p.accent, c.p.light),
      fg(c, 692, 12),
    ],
  },

  // 28: the continual burnt offering morning and evening, and the offerings at the beginning of your months - sun, new moon and the altar
  'numeri-bijbelquiz-deel-28': {
    hue: 174,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 380, sunR: 56, far: 'dunes', horizon: 476 }),
      c.soft(1120, 260, 150, 0.45, c.p.accent),
      moon(1120, 260, 52, c.p.accent),
      smoke(c, 704, 420, 1.3, 8, 0.6),
      altar(704, 556, 1.4, c.p.near),
      c.soft(704, 440, 70, 0.4),
      lamb(500, 562, 1.15, c.p.near),
      lamb(910, 562, 1.15, c.p.near, undefined, { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 29: the feast of tabernacles - bullocks led up day after day to the altar beside the booths
  'numeri-bijbelquiz-deel-29': {
    hue: 176,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 224, far: 'ridge', horizon: 474 }),
      palm(200, 524, 1.0, c.p.mid),
      booth(c.rand, 300, 552, 1.1, c.p.near, c.p.mid),
      smoke(c, 1080, 360, 1.2, 7, 0.5),
      altar(1080, 560, 1.3, c.p.near),
      fire(c, 1080, 461, 1.05),
      mirror(860, ox(860, 566, 0.9, c.p.near)),
      mirror(690, ox(690, 562, 0.84, c.p.near, { opacity: 0.92 })),
      mirror(530, ox(530, 558, 0.78, c.p.near, { opacity: 0.84 })),
      fg(c, 692, 12),
    ],
  },

  // 30: a daughter's vow in her father's house - she makes her vow, the father hears it at his door
  'numeri-bijbelquiz-deel-30': {
    hue: 178,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 246, far: 'dunes', horizon: 476 }),
      houseBlock(c.rand, 1010, 560, 1.45, c.p.near),
      path('M 920 560 L 920 488 Q 940 470 960 488 L 960 560 Z', mix(c.a.figure, c.a.near, 0.15)),
      windowFrame(1060, 500, 0.62, c.p.near, c.p.accent),
      c.soft(1060, 476, 70, 0.4, c.p.accent),
      fig(860, 568, 1.4, c.p.fore, 'stand', { flip: true }),
      fig(610, 568, 1.32, c.p.fore, 'bless'),
      fg(c, 692, 12),
    ],
  },

  // 31: the spoil of Midian - the captains bring the gold, chains, bracelets and rings to Moses and Eleazar; the flocks behind
  'numeri-bijbelquiz-deel-31': {
    hue: 180,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 240, far: 'ridge', horizon: 474 }),
      sanctuary(c, 260, 500, 0.75, 320),
      lamb(930, 530, 0.7, c.p.mid),
      lamb(1010, 526, 0.72, c.p.mid, undefined, { flip: true }),
      lamb(1090, 532, 0.68, c.p.mid),
      lamb(1170, 526, 0.7, c.p.mid, undefined, { flip: true }),
      lamb(1240, 532, 0.66, c.p.mid),
      fig(430, 566, 1.4, c.p.fore, 'stand'),
      fig(530, 566, 1.45, c.p.fore, 'stand'),
      priestGarb(530, 566, 1.45, null, c.p.light),
      kneel(850, 574, 1.38, c.p.fore, 'forward', { flip: true }),
      ellipse(700, 566, 76, 14, c.p.accent),
      goblet(668, 560, 0.9, c.p.accent),
      goblet(728, 556, 0.75, c.p.accent),
      ring(700, 534, 0.55, c.p.accent),
      ring(764, 548, 0.45, c.p.accent),
      coin(640, 560, 0.8, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 32: Reuben and Gad keep their flocks in the pastures of Gilead east of the Jordan; their armed men go over before their brothers
  'numeri-bijbelquiz-deel-32': {
    hue: 182,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 226, far: 'ridge', horizon: 470 }),
      path(`M -20 500 C 300 490 700 506 1000 494 C 1180 488 1300 498 ${W + 20} 496 L ${W + 20} 516 C 1200 516 1000 512 700 524 C 400 528 200 516 -20 520 Z`, c.p.water),
      sheepfold(1080, 572, 400, 1.3, c.p.mid),
      lamb(1010, 548, 0.75, c.p.near),
      lamb(1100, 552, 0.8, c.p.near, undefined, { flip: true }),
      lamb(1180, 546, 0.72, c.p.near),
      ram(880, 572, 0.85, c.p.near),
      banner(760, 572, 1.2, c.p.fore, c.p.accent),
      fig(360, 572, 1.42, c.p.fore, 'walk', { flip: true }),
      spear(330, 572, 1.0, c.p.fore, 230, -4),
      fig(480, 572, 1.35, c.p.fore, 'walk', { flip: true }),
      spear(450, 572, 0.95, c.p.fore, 230, -4),
      fig(590, 572, 1.3, c.p.fore, 'walk', { flip: true }),
      spear(560, 572, 0.92, c.p.fore, 230, -4),
      fg(c, 698, 10),
    ],
  },

  // 33: the journeys of the children of Israel - the road from Egypt through the wilderness, camp after camp, to the Jordan
  'numeri-bijbelquiz-deel-33': {
    hue: 184,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 230, far: 'dunes', horizon: 470 }),
      pyramids(250, 482, 0.9, c.p.far, { opacity: 0.8 }),
      path('M 560 480 L 660 380 L 700 410 L 760 360 L 880 480 Z', c.p.far),
      cityWall(1210, 482, 0.5, c.p.far, 180),
      dottedCurve([[200, 600], [320, 470], [520, 620], [700, 520]], 16, 7, c.p.accent),
      dottedCurve([[700, 520], [860, 440], [960, 590], [1180, 494]], 16, 7, c.p.accent),
      tent(320, 548, 0.7, c.p.near),
      tent(560, 566, 0.75, c.p.near),
      tent(860, 512, 0.62, c.p.near),
      tent(1040, 538, 0.66, c.p.near),
      fig(1150, 520, 0.95, c.p.near, 'walk'),
      fg(c, 692, 12),
    ],
  },

  // 34: the borders of the land - "de grote zee zal u tot een grens zijn"; a boundary stone set up between the sea and the hills
  'numeri-bijbelquiz-deel-34': {
    hue: 186,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 230, far: 'ridge', horizon: 474 }),
      path(`M -20 474 L 560 474 C 520 510 470 560 430 ${H} L -20 ${H} Z`, c.p.water),
      stroke('M 140 500 q 30 -6 60 0 q 30 6 60 0 M 260 530 q 30 -6 60 0 q 30 6 60 0 M 120 566 q 30 -6 60 0 q 30 6 60 0', c.p.light, 4, 0.6),
      fig(600, 568, 1.42, c.p.fore, 'reach'),
      fig(1040, 568, 1.42, c.p.fore, 'reach', { flip: true }),
      stroke('M 680 470 Q 820 494 960 470', c.p.fore, 3),
      boundaryStone(820, 572, 1.35, c.p.accent),
      fg(c, 698, 10),
    ],
  },

  // 35: the cities of refuge - the manslayer runs up the road to the open gate, the avenger of blood far behind
  'numeri-bijbelquiz-deel-35': {
    hue: 188,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 330, sunR: 56, far: 'dunes', horizon: 476 }),
      path(`M 760 520 C 860 440 980 410 1080 404 C 1200 400 1300 430 ${W + 20} 470 L ${W + 20} ${H} L 760 ${H} Z`, c.p.mid),
      cityWall(1100, 424, 0.85, c.p.near, 300),
      gateArch(1100, 424, 0.55, c.p.accent),
      trail(560, H, 1100, 424, 70, c.p.light, { opacity: 0.45 }),
      fig(860, 548, 1.35, c.p.fore, 'walk'),
      fig(350, 574, 0.95, c.p.near, 'walk', { opacity: 0.75 }),
      fg(c, 698, 10),
    ],
  },

  // 36: the daughters of Zelophehad and their inheritance - five sisters before their own field, kept within their tribe
  'numeri-bijbelquiz-deel-36': {
    hue: 190,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 240, far: 'ridge', horizon: 474 }),
      wheat(860, 560, 1.0, c.p.accent, 6),
      wheat(990, 566, 1.1, c.p.accent, 6),
      wheat(1130, 562, 1.05, c.p.accent, 6),
      wheat(1250, 566, 1.0, c.p.accent, 5),
      boundaryStone(760, 572, 0.85, c.p.near),
      fig(260, 568, 1.3, c.p.fore, 'stand'),
      fig(350, 568, 1.36, c.p.fore, 'stand'),
      fig(440, 568, 1.3, c.p.fore, 'stand'),
      fig(530, 568, 1.34, c.p.fore, 'stand'),
      fig(620, 568, 1.4, c.p.fore, 'reach'),
      fg(c, 692, 12),
    ],
  },
};
