/**
 * Covers for the Leviticus series, one scene per quiz. Each quiz covers one
 * chapter: `leviticus-bijbelquiz-deel-<n>` is chapter n (1-27).
 *
 * Base hue 60, drifting two degrees per chapter (chapter 27 lands on 112).
 * See `quiz-cover-scene-kit.mts` for the house style. Leviticus is law, not
 * narrative, so most covers pick a concrete symbol of the chapter (the altar,
 * the tabernacle court, the priest's garments, a feast) and vary mood and
 * composition so the series does not repeat itself. Motifs the shared kit
 * lacks live in `quiz-cover-motifs-leviticus-numeri.mts`.
 *
 * Chapters: het brandoffer van runderen, klein vee en vogels (1); het
 * spijsoffer van meelbloem, olie en wierook (2); het dankoffer, de hand op de
 * kop van het dier (3); het zondoffer, buiten het leger verbrand (4); offers
 * naar draagkracht: lam, twee tortelduiven of meelbloem (5); het vuur zal
 * gedurig op het altaar branden (6); het beweegoffer (7); de zalving van
 * Aaron (8); vuur van de HEERE verteert het offer, het volk valt neer (9);
 * het vreemde vuur van Nadab en Abihu (10); reine en onreine dieren (11);
 * reiniging na een geboorte (12); de melaatse buiten het leger (13); de
 * levende vogel vrijgelaten over het veld (14); wassen, onrein tot de avond
 * (15); de bok voor Azazel (16); offeren alleen aan de deur van de tent
 * (17); niet doen naar de werken van Egypte en Kanaan (18); de hoeken van het
 * veld voor de arme en de vreemdeling (19); Molech en de straffen (20); de
 * heiligheid van de hogepriester (21); offerdieren zonder gebrek (22); het
 * loofhuttenfeest (23); de toonbroden en de kandelaar (24); de bazuin van het
 * jubeljaar (25); regen op zijn tijd en de oogst (26); het tiende dat onder de
 * roede doorgaat (27).
 */

import { base, fg, type C, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  cloudBank,
  crowd,
  dove,
  ellipse,
  fireBed,
  fish,
  goat,
  grapes,
  houseBlock,
  locust,
  ox,
  palm,
  path,
  person,
  pyramids,
  ram,
  rotate,
  shafts,
  sheaf,
  shrub,
  streaks,
  tent,
  tombMound,
  trail,
  tree,
  wheat,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import { at, bun, mix } from './cover-options/shapes.mjs';
import {
  altar,
  altarFire,
  bedouinTent,
  booth,
  censer,
  courtFence,
  dish,
  fallen,
  fig,
  idol,
  jar,
  kneel,
  lamb,
  menorah,
  moon,
  motherAndChild,
  priestGarb,
  rod,
  seated,
  sheepfold,
  shofar,
  showbreadTable,
  sickle,
  stroke,
  tabernacle,
} from './quiz-cover-motifs-leviticus-numeri.mjs';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Altar fire in the accent, with a lighter heart. */
function fire(c: C, x: number, y: number, s: number): string {
  return altarFire(x, y, s, c.p.accent, mix(c.p.accent, '#FFF1C8', 0.5), c.p.light);
}

/** The court's white linen, a touch warmer than paper white. */
const linen = (c: C) => mix(c.p.light, c.a.near, 0.18);

/** The court's posts: darker than the linen, lighter than a figure. */
const post = (c: C) => mix(c.p.near, linen(c), 0.3);

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

/** Short stubble strokes across a reaped field. */
function stubble(c: C, x0: number, x1: number, y0: number, y1: number, fill: string): string {
  const out: string[] = [];
  for (let y = y0; y <= y1; y += 14) {
    for (let x = x0 + c.rand() * 20; x < x1; x += 22 + c.rand() * 14) out.push(stroke(`M ${x.toFixed(0)} ${y} L ${(x + 2).toFixed(0)} ${y - 10}`, fill, 3, 0.55));
  }
  return out.join('');
}

// ── scenes ──────────────────────────────────────────────────────────────────

export const LEVITICUS_SCENES: Record<string, Scene> = {
  // 1: the burnt offering - the bronze altar ablaze, a bull brought from the herd, a lamb and a dove
  'leviticus-bijbelquiz-deel-1': {
    hue: 60,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 220, far: 'ridge', horizon: 470 }),
      smoke(c, 700, 330, 1.3),
      altar(700, 532, 1.5, c.p.near),
      fire(c, 700, 418, 1.25),
      lamb(440, 536, 1.05, c.p.near),
      dove(470, 330, 0.9, c.p.near, { opacity: 0.85 }),
      ox(1010, 538, 1.05, c.p.near),
      fig(1190, 540, 1.3, c.p.fore, 'staff', { flip: true }),
      fg(c, 684, 16),
    ],
  },

  // 2: the grain offering - fine flour on a pan with oil and frankincense, held out by a kneeling offerer before the ripe fields
  'leviticus-bijbelquiz-deel-2': {
    hue: 62,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 236, rays: true, far: 'dunes', horizon: 474 }),
      wheat(860, 540, 0.85, c.p.crop, 5),
      wheat(1010, 548, 1.0, c.p.crop, 7),
      wheat(1180, 556, 1.1, c.p.crop, 6),
      smoke(c, 690, 386, 0.9, 6, 0.45),
      jar(470, 560, 1.25, c.p.near),
      kneel(590, 562, 1.7, c.p.fore, 'forward'),
      dish(690, 472, 1.55, c.p.accent, c.p.light),
      fg(c, 686, 14),
    ],
  },

  // 3: the peace offering - the offerer lays his hand on the head of his goat before the altar; ox, sheep and goat
  'leviticus-bijbelquiz-deel-3': {
    hue: 64,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'none', ground: 'flat', horizon: 500 }),
      courtFence(704, 500, 1560, 1.1, linen(c), post(c)),
      smoke(c, 380, 360, 1.0, 6, 0.5),
      altar(380, 548, 1.35, c.p.near),
      fire(c, 380, 445, 1.0),
      fig(640, 552, 1.35, c.p.fore, 'reach'),
      goat(790, 556, 1.0, c.p.near),
      ram(1000, 552, 0.9, c.p.near),
      ox(1185, 556, 0.95, c.p.near),
      fg(c, 690, 12),
    ],
  },

  // 4: the sin offering - the bull carried outside the camp and burnt on the ash heap; the camp far off
  'leviticus-bijbelquiz-deel-4': {
    hue: 66,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 380, sunR: 60, far: 'dunes', horizon: 476 }),
      tent(900, 492, 0.55, c.p.far),
      tent(990, 486, 0.6, c.p.far),
      tent(1080, 494, 0.5, c.p.far),
      tent(1170, 488, 0.6, c.p.far),
      tent(1260, 494, 0.55, c.p.far),
      smoke(c, 450, 360, 1.3, 7, 0.5),
      ellipse(450, 540, 118, 24, mix(c.a.mid, '#FFFFFF', 0.3)),
      fire(c, 450, 530, 1.25),
      fig(760, 548, 1.35, c.p.fore, 'carry', { flip: true }),
      priestGarb(760, 548, 1.35, null, c.p.light, { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 5: offerings by what one can afford - a lamb, two turtledoves, or a tenth of fine flour
  'leviticus-bijbelquiz-deel-5': {
    hue: 68,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 220, far: 'dunes', horizon: 478 }),
      tabernacle(1190, 486, 0.6, c.p.mid, c.p.near),
      courtFence(1190, 498, 300, 0.6, linen(c), post(c)),
      fig(280, 552, 1.3, c.p.near, 'stand'),
      lamb(380, 556, 1.15, c.p.near),
      kneel(640, 562, 1.8, c.p.fore, 'up'),
      dove(740, 340, 1.2, c.p.accent),
      dove(840, 376, 1.05, c.p.accent),
      dish(990, 562, 1.4, c.p.near, c.p.light),
      fg(c, 688, 12),
    ],
  },

  // 6: "Het vuur zal gedurig op het altaar branden" - the altar fire kept through the night, the priest in linen carries out the ashes
  'leviticus-bijbelquiz-deel-6': {
    hue: 70,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 280, sunY: 210, sunR: 44, far: 'ridge', horizon: 476 }),
      moon(280, 210, 36, c.p.light),
      tabernacle(1140, 492, 0.85, c.p.mid, c.p.near),
      courtFence(1140, 506, 380, 0.8, linen(c), post(c)),
      c.soft(760, 400, 280, 0.4, c.p.accent),
      altar(760, 540, 1.6, c.p.near),
      fire(c, 760, 418, 1.35),
      fig(440, 552, 1.35, c.p.fore, 'carry', { flip: true }),
      priestGarb(440, 552, 1.35, null, c.p.light, { flip: true }),
      jar(440, 472, 0.6, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 7: the wave offering - the priest lifts the bread of the thank offering high before the LORD
  'leviticus-bijbelquiz-deel-7': {
    hue: 72,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 250, far: 'dunes', horizon: 480 }),
      tabernacle(330, 486, 0.95, c.p.mid, c.p.near),
      courtFence(330, 500, 360, 0.85, linen(c), post(c)),
      crowd(c.rand, 1060, 524, 0.75, c.p.mid, 5, 260),
      c.soft(704, 300, 160, 0.4),
      fig(704, 552, 1.5, c.p.fore, 'raise'),
      priestGarb(704, 552, 1.5, null, c.p.light),
      at(704, 304, 1.35, bun(c.p.accent, mix(c.p.accent, '#000000', 0.25))),
      fg(c, 686, 14),
    ],
  },

  // 8: the consecration of Aaron - Moses pours the anointing oil on Aaron's head; his four sons wait by the tabernacle
  'leviticus-bijbelquiz-deel-8': {
    hue: 74,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'ridge', horizon: 474 }),
      tabernacle(340, 484, 0.95, c.p.mid, c.p.near),
      courtFence(340, 498, 380, 0.85, linen(c), post(c)),
      person(960, 520, 0.85, c.p.near, 'stand', { opacity: 0.85 }),
      person(1040, 522, 0.85, c.p.near, 'stand', { opacity: 0.85 }),
      person(1120, 520, 0.85, c.p.near, 'stand', { opacity: 0.85 }),
      person(1200, 522, 0.85, c.p.near, 'stand', { opacity: 0.85 }),
      c.soft(660, 330, 120, 0.4),
      fig(640, 556, 1.45, c.p.fore, 'stand'),
      priestGarb(640, 556, 1.45, c.p.crop, c.p.light),
      fig(800, 560, 1.55, c.p.fore, 'raise'),
      shofar(778, 320, 0.62, c.p.accent, 196),
      ellipse(680, 346, 4, 6, c.p.accent),
      ellipse(668, 358, 3.5, 5, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 9: "Toen ging er vuur uit van het aangezicht des HEEREN" - fire from heaven consumes the offering, the people fall on their faces
  'leviticus-bijbelquiz-deel-9': {
    hue: 76,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 110, far: 'none', ground: 'flat', horizon: 500 }),
      shafts(704, 40, 360, 420, c.p.light, 5),
      c.soft(704, 380, 300, 0.4),
      altar(704, 548, 1.5, c.p.near),
      fire(c, 704, 434, 1.45),
      fallen(300, 560, 1.3, c.p.fore),
      fallen(450, 566, 1.15, c.p.fore),
      fallen(970, 566, 1.15, c.p.fore, { flip: true }),
      fallen(1120, 560, 1.3, c.p.fore, { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 10: Nadab and Abihu bring strange fire - their censers lie overturned before the tabernacle; Aaron sits silent
  'leviticus-bijbelquiz-deel-10': {
    hue: 78,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, far: 'ridge', clouds: 3, horizon: 476 }),
      c.soft(704, 360, 260, 0.5, c.p.light),
      tabernacle(704, 486, 1.25, c.p.mid, c.p.near),
      courtFence(704, 500, 660, 1.0, linen(c), post(c)),
      smoke(c, 470, 470, 1.0, 6, 0.45),
      censer(470, 572, 1.7, c.p.near, c.p.accent),
      rotate(-160, 920, 538, censer(920, 562, 1.7, c.p.near, null)),
      fireBed(c.rand, 1010, 578, 0.42, c.p.accent, 5),
      smoke(c, 1010, 500, 0.8, 6, 0.4),
      seated(250, 560, 1.25, c.p.fore),
      fg(c, 690, 12),
    ],
  },

  // 11: clean and unclean animals - what chews the cud and parts the hoof, fish with fins and scales, the locust
  'leviticus-bijbelquiz-deel-11': {
    hue: 80,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 220, far: 'dunes', horizon: 470 }),
      ellipse(380, 554, 200, 26, c.p.water),
      ellipse(380, 550, 150, 12, c.p.light, { opacity: 0.4 }),
      rotate(-28, 380, 500, fish(380, 500, 0.8, c.p.accent)),
      ellipse(330, 548, 26, 5, c.p.light, { opacity: 0.6 }),
      ox(790, 544, 1.05, c.p.near),
      ram(1050, 540, 0.95, c.p.near),
      locust(600, 566, 3.6, c.p.near),
      locust(1190, 572, 3.0, c.p.near),
      fg(c, 688, 14),
    ],
  },

  // 12: purification after childbirth - the mother brings her child, a lamb and a turtledove to the tabernacle
  'leviticus-bijbelquiz-deel-12': {
    hue: 82,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'ridge', horizon: 476 }),
      tabernacle(1040, 488, 0.95, c.p.mid, c.p.near),
      courtFence(1040, 502, 440, 0.85, linen(c), post(c)),
      motherAndChild(600, 552, 1.45, c.p.fore, c.p.light),
      lamb(760, 556, 1.0, c.p.near),
      dove(700, 330, 1.05, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 13: the leper outside the camp - he covers his lip and cries "Onrein!", his tent alone; the camp and its fire far off
  'leviticus-bijbelquiz-deel-13': {
    hue: 84,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1090, sunY: 250, far: 'dunes', clouds: 2, horizon: 480 }),
      tent(900, 500, 0.7, c.p.mid),
      tent(1000, 494, 0.8, c.p.mid),
      tent(1120, 502, 0.7, c.p.mid),
      tent(1230, 496, 0.8, c.p.mid),
      c.soft(1060, 486, 90, 0.45, c.p.accent),
      fireBed(c.rand, 1060, 506, 0.5, c.p.accent, 3),
      tent(250, 540, 1.1, c.p.mid),
      fig(400, 556, 1.4, c.p.fore, 'shield'),
      fg(c, 690, 12),
    ],
  },

  // 14: the cleansing of the healed leper - the living bird let go over the open field, the earthen vessel over running water
  'leviticus-bijbelquiz-deel-14': {
    hue: 86,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 236, far: 'ridge', horizon: 476 }),
      shrub(1120, 520, 1.3, c.p.mid),
      shrub(1220, 526, 1.0, c.p.mid),
      path('M 640 560 C 700 552 760 566 820 558 C 880 550 940 566 1000 560 L 1000 572 C 940 578 880 562 820 570 C 760 578 700 564 640 572 Z', c.p.water),
      kneel(420, 556, 1.25, c.p.near, 'pray'),
      fig(590, 556, 1.45, c.p.fore, 'raise'),
      priestGarb(590, 556, 1.45, null, c.p.light),
      jar(720, 560, 0.9, c.p.near),
      dove(830, 290, 1.5, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 15: "Hij zal zijn klederen wassen ... en onrein zijn tot aan den avond" - washing at the water's edge as the sun goes down
  'leviticus-bijbelquiz-deel-15': {
    hue: 88,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1010, sunY: 372, sunR: 64, far: 'ridge', ground: 'water', horizon: 470 }),
      ellipse(1010, 488, 120, 6, c.p.light, { opacity: 0.6 }),
      ellipse(1010, 510, 80, 5, c.p.light, { opacity: 0.45 }),
      ellipse(1010, 532, 50, 4, c.p.light, { opacity: 0.35 }),
      path(`M -20 510 C 160 500 380 506 520 530 C 600 546 640 600 660 ${H} L -20 ${H} Z`, c.p.mid),
      tent(260, 516, 0.9, c.p.near),
      jar(400, 556, 1.2, c.p.accent),
      kneel(510, 566, 1.5, c.p.fore, 'plant'),
      ellipse(612, 552, 40, 9, c.p.light, { opacity: 0.85 }),
      ellipse(620, 562, 64, 6, c.p.light, { opacity: 0.35 }),
      fg(c, 700, 10),
    ],
  },

  // 16: the Day of Atonement - the goat for Azazel sent away into the wilderness, bearing the people's sins
  'leviticus-bijbelquiz-deel-16': {
    hue: 90,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 320, sunR: 56, far: 'dunes', horizon: 470 }),
      tent(1180, 486, 0.45, c.p.far),
      tent(1250, 490, 0.5, c.p.far),
      tabernacle(1240, 474, 0.35, c.p.far, mix(c.p.far, c.p.mid, 0.5)),
      goat(760, 548, 1.3, c.p.accent),
      fig(1010, 552, 1.4, c.p.fore, 'reach', { flip: true }),
      fg(c, 686, 16),
    ],
  },

  // 17: offerings only at the door of the tent of meeting - a man leads his ox along the road to the tabernacle
  'leviticus-bijbelquiz-deel-17': {
    hue: 92,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 230, far: 'ridge', horizon: 466 }),
      trail(300, H, 880, 492, 110, c.p.light, { opacity: 0.4 }),
      tabernacle(880, 474, 0.95, c.p.mid, c.p.near),
      courtFence(880, 490, 540, 0.9, linen(c), post(c), c.p.accent),
      mirror(330, ox(330, 564, 1.0, c.p.near)),
      stroke('M 410 486 Q 470 506 520 478', c.p.fore, 3),
      fig(560, 562, 1.4, c.p.fore, 'walk'),
      fg(c, 690, 12),
    ],
  },

  // 18: "Gij zult niet doen naar de werken van het land Egypte ... noch Kanaan" - Israel's household between the two lands
  'leviticus-bijbelquiz-deel-18': {
    hue: 94,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 960, sunY: 240, sunR: 54, far: 'dunes', horizon: 474 }),
      pyramids(250, 486, 1.1, c.p.far, { opacity: 0.75 }),
      ziggurat(1190, 488, 0.75, c.p.far, 4, { opacity: 0.75 }),
      bedouinTent(704, 548, 1.25, c.p.accent),
      fig(500, 560, 1.4, c.p.fore, 'stand'),
      fig(900, 560, 1.3, c.p.fore, 'stand'),
      fig(975, 560, 0.8, c.p.fore, 'stand'),
      fg(c, 688, 14),
    ],
  },

  // 19: "Gij zult de hoeken uws velds niet ganselijk afmaaien" - the corner of the field left standing for the poor and the stranger
  'leviticus-bijbelquiz-deel-19': {
    hue: 96,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'dunes', horizon: 470 }),
      stubble(c, 120, 900, 506, 570, c.p.crop),
      sheaf(260, 548, 0.95, c.p.crop),
      sheaf(380, 554, 0.85, c.p.crop),
      fig(540, 558, 1.35, c.p.fore, 'reach', { flip: true }),
      sickle(470, 466, 0.8, c.p.fore, -30),
      kneel(850, 564, 1.3, c.p.fore, 'forward'),
      wheat(980, 560, 1.05, c.p.accent, 6),
      wheat(1110, 566, 1.15, c.p.accent, 6),
      wheat(1240, 562, 1.1, c.p.accent, 5),
      fg(c, 690, 12),
    ],
  },

  // 20: the penalties - Molech's idol and its fire on the high place, and the Israelite who turns his back on it
  'leviticus-bijbelquiz-deel-20': {
    hue: 98,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 250, far: 'ridge', clouds: 3, horizon: 478 }),
      ellipse(1040, 512, 280, 72, c.p.mid),
      idol(1010, 462, 1.25, c.p.near),
      dish(1130, 468, 0.7, c.p.near),
      fire(c, 1130, 456, 0.55),
      smoke(c, 1130, 380, 0.8, 6, 0.4),
      fig(470, 560, 1.45, c.p.fore, 'walk', { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 21: the holiness of the priests - the high priest in his breastplate keeps to the sanctuary while a funeral passes far off
  'leviticus-bijbelquiz-deel-21': {
    hue: 100,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 226, far: 'ridge', horizon: 474 }),
      tabernacle(360, 486, 1.0, c.p.mid, c.p.near),
      courtFence(360, 500, 420, 0.9, linen(c), post(c)),
      tombMound(1220, 512, 0.45, c.p.mid, c.p.near),
      person(900, 512, 0.75, c.p.mid, 'bow'),
      person(980, 512, 0.78, c.p.mid, 'walk'),
      person(1080, 512, 0.78, c.p.mid, 'walk'),
      path('M 950 446 L 1110 440 L 1110 450 L 950 456 Z', c.p.mid),
      fig(620, 560, 1.55, c.p.fore, 'stand'),
      priestGarb(620, 560, 1.55, c.p.accent, c.p.light),
      fg(c, 690, 12),
    ],
  },

  // 22: offerings without blemish - the priest kneels to look over the lamb chosen from the flock
  'leviticus-bijbelquiz-deel-22': {
    hue: 102,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 246, far: 'dunes', horizon: 472 }),
      lamb(940, 516, 0.75, c.p.mid, undefined, { flip: true }),
      lamb(1030, 520, 0.8, c.p.mid, undefined, { flip: true }),
      lamb(1120, 514, 0.7, c.p.mid, undefined, { flip: true }),
      lamb(1210, 522, 0.8, c.p.mid, undefined, { flip: true }),
      lamb(1070, 534, 0.85, c.p.mid),
      c.soft(720, 500, 150, 0.35),
      kneel(560, 562, 1.45, c.p.fore, 'forward'),
      lamb(730, 562, 1.4, c.p.accent, undefined, { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 23: the feasts of the LORD - the booths of the feast of tabernacles under the full moon, a lamp lit inside
  'leviticus-bijbelquiz-deel-23': {
    hue: 104,
    mood: 'night',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 206, sunR: 48, far: 'ridge', horizon: 478 }),
      palm(1070, 528, 1.15, c.p.near),
      palm(1200, 522, 0.95, c.p.near),
      booth(c.rand, 880, 530, 1.1, c.p.near, c.p.mid),
      c.soft(470, 520, 200, 0.55, c.p.accent),
      booth(c.rand, 470, 560, 1.7, c.p.near, c.p.mid),
      seated(410, 560, 1.05, c.p.fore),
      seated(530, 560, 0.85, c.p.fore),
      fireBed(c.rand, 470, 574, 0.5, c.p.accent, 4),
      fg(c, 690, 12),
    ],
  },

  // 24: the lamp and the showbread - the twelve loaves on the table before the veil, the lampstand burning beside it
  'leviticus-bijbelquiz-deel-24': {
    hue: 106,
    mood: 'warm',
    draw: (c) => {
      const cloth = mix(c.a.mid, c.a.near, 0.45);
      const pleats: string[] = [];
      for (let x = 140; x < 1300; x += 64) pleats.push(path(`M ${x} 180 L ${x + 20} 180 L ${x + 20} 524 L ${x} 524 Z`, mix(cloth, '#FFFFFF', 0.14)));
      return [
        base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 524 }),
        path('M 60 170 L 1350 170 L 1350 528 L 60 528 Z', cloth),
        pleats.join(''),
        path('M 60 150 L 1350 150 L 1350 196 L 60 196 Z', mix(cloth, c.a.figure, 0.3)),
        c.soft(400, 330, 220, 0.5),
        menorah(400, 556, 1.55, c.p.near, c.p.light),
        showbreadTable(860, 560, 1.7, c.p.near, c.p.accent),
        fg(c, 700, 10),
      ];
    },
  },

  // 25: the year of jubilee - the trumpet of the jubilee sounds over the resting land, liberty proclaimed
  'leviticus-bijbelquiz-deel-25': {
    hue: 108,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, rays: true, far: 'ridge', horizon: 476 }),
      ellipse(470, 528, 240, 64, c.p.mid),
      shrub(760, 540, 0.9, c.p.mid),
      shrub(840, 546, 0.7, c.p.mid),
      houseBlock(c.rand, 1170, 530, 0.8, c.p.near),
      fig(1000, 552, 1.15, c.p.near, 'walk'),
      fig(470, 480, 1.4, c.p.fore, 'shield'),
      shofar(484, 302, 0.95, c.p.accent, -16),
      fg(c, 688, 14),
    ],
  },

  // 26: "Zo zal Ik uw regen geven op zijn tijd" - rain on the fields, a laden vine and fig tree, a man at peace under them
  'leviticus-bijbelquiz-deel-26': {
    hue: 110,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 226, far: 'dunes', horizon: 470 }),
      cloudBank(c.rand, 380, 220, 1.5, c.p.light, { opacity: 0.85 }),
      streaks(c.rand, 230, 250, 320, 220, c.p.light, 40, { opacity: 0.55 }),
      wheat(300, 548, 1.0, c.p.crop, 7),
      path('M 560 470 L 860 470 L 860 478 L 560 478 Z', c.p.near),
      path('M 566 470 L 574 470 L 574 560 L 566 560 Z', c.p.near),
      path('M 846 470 L 854 470 L 854 560 L 846 560 Z', c.p.near),
      stroke('M 700 566 C 690 520 700 490 710 472', c.p.near, 14),
      ellipse(600, 452, 46, 24, c.p.near),
      ellipse(670, 444, 52, 28, c.p.near),
      ellipse(750, 446, 54, 28, c.p.near),
      ellipse(826, 454, 44, 22, c.p.near),
      grapes(626, 478, 1.15, c.p.accent),
      grapes(720, 482, 1.35, c.p.accent),
      grapes(812, 476, 1.1, c.p.accent),
      tree(1020, 548, 1.35, c.p.near),
      seated(1070, 560, 1.1, c.p.fore),
      fg(c, 688, 14),
    ],
  },

  // 27: "Al wat onder de roede doorgaat, het tiende zal den HEERE heilig zijn" - the tenth sheep marked as it passes under the shepherd's rod
  'leviticus-bijbelquiz-deel-27': {
    hue: 112,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 330, sunR: 56, far: 'ridge', horizon: 474 }),
      sheepfold(1110, 548, 380, 1.4, c.p.mid),
      lamb(1150, 500, 0.7, c.p.mid, undefined, { flip: true }),
      lamb(1060, 504, 0.65, c.p.mid, undefined, { flip: true }),
      lamb(560, 560, 1.0, c.p.near, undefined, { flip: true }),
      lamb(430, 556, 0.95, c.p.near, undefined, { flip: true }),
      lamb(780, 562, 1.1, c.p.accent, undefined, { flip: true }),
      fig(960, 562, 1.45, c.p.fore, 'reach', { flip: true }),
      rod(886, 466, 1, c.p.fore, 190, false, -84),
      fg(c, 690, 12),
    ],
  },
};
