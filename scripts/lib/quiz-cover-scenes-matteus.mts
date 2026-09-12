/**
 * Covers for the Matteus series, one scene per quiz part.
 *
 * Base hue 300, drifting two degrees per part (wrapping past 360).
 * See `quiz-cover-scenes.mts` for the house style and the core set this
 * module is merged into.
 */

import {
  H,
  W,
  angel,
  bird,
  boat,
  circle,
  cityWall,
  citySkyline,
  cloudBank,
  coin,
  columns,
  cross,
  crowd,
  crown,
  donkey,
  dove,
  dunes,
  ellipse,
  flame,
  gateArch,
  goblet,
  houseBlock,
  lamp,
  loaf,
  palm,
  path,
  person,
  prisonBars,
  ram,
  rays,
  rect,
  reeds,
  rotate,
  roundStone,
  scroll,
  shafts,
  shrub,
  streaks,
  swell,
  templeFront,
  throne,
  tombMound,
  tower,
  trail,
  tree,
  tri,
  vineRow,
  wheat,
} from './quiz-cover-primitives.mjs';
import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

// ── motifs composed for this series ─────────────────────────────────────────

/** A four-pointed star with shorter diagonals - the star over Bethlehem. */
function starBurst(x: number, y: number, s: number, fill: string): string {
  const long = 62 * s;
  const short = 26 * s;
  const w = 7 * s;
  return (
    tri(x - w, y, x, y - long, x + w, y, fill) +
    tri(x - w, y, x, y + long, x + w, y, fill) +
    tri(x, y - w, x - long, y, x, y + w, fill) +
    tri(x, y - w, x + long, y, x, y + w, fill) +
    rotate(45, x, y, tri(x - w * 0.7, y, x, y - short, x + w * 0.7, y, fill) + tri(x - w * 0.7, y, x, y + short, x + w * 0.7, y, fill) + tri(x, y - w * 0.7, x - short, y, x, y + w * 0.7, fill) + tri(x, y - w * 0.7, x + short, y, x, y + w * 0.7, fill)) +
    circle(x, y, 9 * s, fill)
  );
}

/** A key: ring on the left, shaft and two teeth to the right. */
function key(x: number, y: number, s: number, fill: string): string {
  return (
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(18 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(8 * s)}"/>` +
    rect(x + 16 * s, y - 5 * s, 92 * s, 10 * s, fill, { rx: 3 * s }) +
    rect(x + 82 * s, y + 3 * s, 9 * s, 20 * s, fill) +
    rect(x + 98 * s, y + 3 * s, 9 * s, 14 * s, fill)
  );
}

/** A camel walking left, head raised. */
function camel(x: number, y: number, s: number, fill: string): string {
  return (
    ellipse(x, y - 62 * s, 54 * s, 24 * s, fill) +
    circle(x - 16 * s, y - 86 * s, 22 * s, fill) +
    circle(x + 22 * s, y - 84 * s, 20 * s, fill) +
    rect(x - 44 * s, y - 62 * s, 9 * s, 62 * s, fill, { rx: 4 * s }) +
    rect(x - 24 * s, y - 62 * s, 9 * s, 62 * s, fill, { rx: 4 * s }) +
    rect(x + 12 * s, y - 62 * s, 9 * s, 62 * s, fill, { rx: 4 * s }) +
    rect(x + 34 * s, y - 62 * s, 9 * s, 62 * s, fill, { rx: 4 * s }) +
    path(
      `M ${r1(x - 40 * s)} ${r1(y - 76 * s)} L ${r1(x - 54 * s)} ${r1(y - 66 * s)} L ${r1(x - 84 * s)} ${r1(y - 124 * s)} L ${r1(x - 70 * s)} ${r1(y - 130 * s)} Z`,
      fill,
    ) +
    ellipse(x - 84 * s, y - 130 * s, 17 * s, 9 * s, fill) +
    tri(x - 76 * s, y - 136 * s, x - 70 * s, y - 148 * s, x - 66 * s, y - 134 * s, fill) +
    path(`M ${r1(x + 50 * s)} ${r1(y - 66 * s)} q ${r1(16 * s)} ${r1(10 * s)} ${r1(8 * s)} ${r1(34 * s)}`, 'none').replace(
      'fill="none"',
      `fill="none" stroke="${fill}" stroke-width="${r1(4 * s)}" stroke-linecap="round"`,
    )
  );
}

/** A tall sewing needle standing on its point, eye at the top. */
function needle(x: number, y: number, s: number, fill: string, eye: string): string {
  const g =
    path(`M ${r1(x)} ${r1(y)} L ${r1(x - 8 * s)} ${r1(y - 60 * s)} L ${r1(x - 8 * s)} ${r1(y - 210 * s)} L ${r1(x + 8 * s)} ${r1(y - 210 * s)} L ${r1(x + 8 * s)} ${r1(y - 60 * s)} Z`, fill) +
    path(`M ${r1(x - 8 * s)} ${r1(y - 210 * s)} a ${r1(8 * s)} ${r1(8 * s)} 0 0 1 ${r1(16 * s)} 0 Z`, fill) +
    ellipse(x, y - 186 * s, 3.5 * s, 16 * s, eye);
  return rotate(-9, x, y, g);
}

/** A jagged bolt from a point downward. */
function lightning(x: number, y: number, s: number, fill: string, o = 0.8): string {
  return path(
    `M ${r1(x)} ${r1(y)} L ${r1(x - 26 * s)} ${r1(y + 80 * s)} L ${r1(x - 4 * s)} ${r1(y + 74 * s)} L ${r1(x - 34 * s)} ${r1(y + 170 * s)}` +
      ` L ${r1(x + 24 * s)} ${r1(y + 66 * s)} L ${r1(x + 2 * s)} ${r1(y + 72 * s)} L ${r1(x + 22 * s)} ${r1(y)} Z`,
    fill,
    { opacity: o },
  );
}

/** A torch: stick with a flame on top. `y` is the flame base. */
function torch(x: number, y: number, s: number, stick: string, fire: string): string {
  return rect(x - 3 * s, y, 6 * s, 120 * s, stick) + flame(x, y + 4 * s, 0.55 * s, fire);
}

/** A plain table: top slab with two legs. `y` is the table top. */
function table(x: number, y: number, w: number, h: number, fill: string): string {
  return rect(x - w / 2, y, w, 14, fill) + rect(x - w / 2 + 18, y + 14, 10, h - 14, fill) + rect(x + w / 2 - 28, y + 14, 10, h - 14, fill);
}

/** A bare tree: trunk and a few dead branches. */
function bareTree(x: number, y: number, s: number, fill: string): string {
  return (
    rect(x - 6 * s, y - 96 * s, 12 * s, 96 * s, fill) +
    rotate(-34, x, y - 70 * s, rect(x - 4 * s, y - 130 * s, 8 * s, 62 * s, fill, { rx: 3 * s })) +
    rotate(38, x, y - 82 * s, rect(x - 4 * s, y - 136 * s, 8 * s, 56 * s, fill, { rx: 3 * s })) +
    rotate(-12, x, y - 96 * s, rect(x - 3 * s, y - 130 * s, 6 * s, 36 * s, fill, { rx: 3 * s }))
  );
}

// ── scenes ──────────────────────────────────────────────────────────────────

export const MATTEUS_SCENES: Record<string, Scene> = {
  // 1: the angel appears to Joseph in a dream
  'matteus-bijbelquiz-deel-1': {
    hue: 300,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 250, sunY: 230, sunR: 52, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 1120, 512, 0.9, c.p.near, { opacity: 0.8 }),
      c.soft(860, 380, 180, 0.22),
      angel(860, 512, 1.15, c.p.light, { opacity: 0.82 }),
      rect(470, 500, 190, 12, c.p.near, { rx: 4 }),
      person(570, 502, 1.2, c.p.fore, 'fallen'),
      fg(c, 684, 14),
    ],
  },
  // 2: the magi follow the star to Bethlehem
  'matteus-bijbelquiz-deel-2': {
    hue: 302,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', stars: 60 }),
      c.soft(1040, 250, 200, 0.38),
      starBurst(1040, 250, 1.1, c.p.light),
      citySkyline(c.rand, 1180, G - 2, 0.75, c.p.far, 5, { opacity: 0.7 }),
      trail(320, H, 1120, G, 120, c.p.mid, { opacity: 0.45 }),
      camel(720, G + 8, 0.95, c.p.near),
      camel(580, G + 14, 0.85, c.p.fore),
      person(420, G + 12, 1.2, c.p.fore, 'point'),
      fg(c, 676, 20),
    ],
  },
  // 3: John baptises Jesus in the Jordan, the dove descends
  'matteus-bijbelquiz-deel-3': {
    hue: 304,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, rays: true, ground: 'water', far: 'dunes', horizon: 452 }),
      shafts(780, 60, 180, 240, c.p.glow, 3),
      dove(780, 292, 1.2, c.p.light, { opacity: 0.9 }),
      person(780, 508, 1.25, c.p.near, 'stand'),
      person(650, 500, 1.3, c.p.fore, 'point'),
      crowd(c.rand, 330, 500, 0.75, c.p.near, 4, 200),
      reeds(c.rand, 1180, 512, 1.1, c.p.fore, 8),
      fg(c, 690, 12),
    ],
  },
  // 4: the temptation in the wilderness
  'matteus-bijbelquiz-deel-4': {
    hue: 306,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 240, far: 'ridge' }),
      ellipse(600, G + 34, 280, 74, c.p.near, { opacity: 0.92 }),
      person(560, G - 30, 1.3, c.p.fore, 'raise'),
      person(700, G - 26, 1.2, c.p.fore, 'point'),
      roundStone(900, G + 12, 0.34, c.p.near),
      roundStone(960, G + 16, 0.28, c.p.near),
      roundStone(1010, G + 14, 0.36, c.p.near),
      fg(c, 674, 20),
    ],
  },
  // 5: the Sermon on the Mount - the crowd on the hillside
  'matteus-bijbelquiz-deel-5': {
    hue: 308,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 240, far: 'ridge', horizon: 480 }),
      ellipse(1010, 528, 380, 116, c.p.near, { opacity: 0.9 }),
      person(1010, 418, 1.25, c.p.fore, 'raise'),
      tree(1260, 470, 1.05, c.p.near),
      crowd(c.rand, 520, 490, 0.95, c.p.near, 9, 520),
      fg(c, 680, 16),
    ],
  },
  // 6: the lamp on the stand and the city on a hill
  'matteus-bijbelquiz-deel-6': {
    hue: 310,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, far: 'ridge', ground: 'flat', horizon: 516 }),
      ellipse(1080, 520, 300, 100, c.p.far, { opacity: 0.9 }),
      c.soft(1080, 420, 170, 0.26),
      citySkyline(c.rand, 1080, 426, 0.7, c.p.near, 6),
      rect(410, 508, 80, 10, c.p.fore),
      rect(444, 420, 12, 96, c.p.fore),
      rect(414, 414, 72, 8, c.p.fore),
      c.soft(500, 400, 130, 0.42),
      lamp(446, 414, 1.5, c.p.accent, c.p.light),
      person(640, 516, 1.05, c.p.fore, 'sit'),
      person(740, 516, 1.1, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },
  // 7: look at the birds of the air and the lilies of the field
  'matteus-bijbelquiz-deel-7': {
    hue: 312,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 240, far: 'dunes' }),
      bird(620, 262, 1.7, c.p.fore, { opacity: 0.7 }),
      bird(720, 300, 1.4, c.p.fore, { opacity: 0.6 }),
      bird(800, 246, 1.5, c.p.fore, { opacity: 0.65 }),
      person(430, G + 6, 1.3, c.p.fore, 'point'),
      crowd(c.rand, 940, G + 10, 0.8, c.p.near, 4, 200),
      shrub(1180, G + 8, 1.15, c.p.near),
      circle(1160, G - 20, 7, c.p.crop),
      circle(1196, G - 30, 7, c.p.crop),
      circle(1214, G - 10, 6, c.p.crop),
      shrub(1300, G + 12, 0.9, c.p.near),
      circle(1290, G - 12, 6, c.p.crop),
      fg(c, 674, 20),
    ],
  },
  // 8: the house on the rock stands in the storm, the house on sand falls
  'matteus-bijbelquiz-deel-8': {
    hue: 314,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'none', ground: 'flat', horizon: 520 }),
      path(`M 300 520 L 370 402 L 630 396 L 710 520 Z`, c.p.near),
      houseBlock(c.rand, 500, 402, 0.85, c.p.fore),
      rotate(9, 1000, 520, houseBlock(c.rand, 1000, 526, 0.8, c.p.near)),
      streaks(c.rand, 0, 110, W, 420, c.p.light, 70, { opacity: 0.32 }),
      fg(c, 686, 14),
    ],
  },
  // 9: Jesus asleep in the boat as the storm rises
  'matteus-bijbelquiz-deel-9': {
    hue: 316,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, clouds: 3, far: 'none', ground: 'swell', horizon: 440 }),
      boat(700, 470, 1.6, c.p.near, false),
      person(640, 458, 0.9, c.p.fore, 'fallen'),
      person(750, 452, 1.05, c.p.fore, 'raise'),
      person(810, 454, 1.0, c.p.fore, 'raise'),
      swell(c.rand, 540, c.p.mid),
      swell(c.rand, 608, c.p.fore),
      streaks(c.rand, 0, 100, W, 360, c.p.light, 40, { opacity: 0.22 }),
    ],
  },
  // 10: Matthew called at the tax booth
  'matteus-bijbelquiz-deel-10': {
    hue: 318,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 242, far: 'none', ground: 'flat', horizon: 512 }),
      citySkyline(c.rand, 1180, 512, 0.9, c.p.far, 5, { opacity: 0.6 }),
      person(830, 512, 1.2, c.p.fore, 'stand'),
      rect(720, 430, 220, 82, c.p.near),
      rect(700, 330, 12, 182, c.p.near),
      rect(950, 330, 12, 182, c.p.near),
      rect(690, 320, 282, 14, c.p.near),
      coin(780, 418, 1.1, c.p.accent),
      coin(822, 414, 1.0, c.p.accent),
      coin(862, 420, 1.2, c.p.accent),
      person(520, 512, 1.3, c.p.fore, 'point'),
      fg(c, 684, 14),
    ],
  },
  // 11: the twelve sent out two by two
  'matteus-bijbelquiz-deel-11': {
    hue: 320,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'ridge' }),
      trail(700, H, 1160, G - 10, 140, c.p.mid, { opacity: 0.5 }),
      person(430, G + 8, 1.35, c.p.fore, 'point'),
      person(640, G + 14, 1.1, c.p.near, 'walk'),
      person(695, G + 14, 1.05, c.p.near, 'walk'),
      person(800, G + 6, 0.95, c.p.near, 'walk'),
      person(845, G + 6, 0.9, c.p.near, 'walk'),
      person(940, G, 0.8, c.p.near, 'walk'),
      person(978, G, 0.78, c.p.near, 'walk'),
      person(1060, G - 6, 0.66, c.p.near, 'walk'),
      person(1092, G - 6, 0.62, c.p.near, 'walk'),
      fg(c, 676, 18),
    ],
  },
  // 12: John in prison sends his disciples to Jesus
  'matteus-bijbelquiz-deel-12': {
    hue: 322,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 246, far: 'none', ground: 'flat', horizon: 510 }),
      person(400, 510, 1.1, c.p.fore, 'stand'),
      prisonBars(400, 510, 1.2, c.p.near, false),
      person(700, 510, 1.15, c.p.fore, 'walk'),
      person(780, 510, 1.1, c.p.near, 'walk'),
      person(1080, 510, 1.25, c.p.fore, 'raise'),
      crowd(c.rand, 1200, 512, 0.75, c.p.near, 3, 150),
      fg(c, 684, 14),
    ],
  },
  // 13: the disciples pluck grain on the sabbath
  'matteus-bijbelquiz-deel-13': {
    hue: 324,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, rays: true, far: 'dunes' }),
      wheat(180, G + 12, 0.9, c.p.near, 5),
      wheat(300, G + 8, 0.85, c.p.near, 5),
      wheat(860, G + 12, 0.9, c.p.near, 5),
      wheat(980, G + 8, 0.9, c.p.near, 5),
      person(380, G + 6, 1.2, c.p.fore, 'point'),
      person(600, G + 10, 1.25, c.p.fore, 'walk'),
      person(710, G + 8, 1.15, c.p.fore, 'carry'),
      wheat(1120, G + 40, 1.15, c.p.fore, 7),
      wheat(1300, G + 50, 1.0, c.p.fore, 5),
      fg(c, 680, 16),
    ],
  },
  // 14: a tree is known by its fruit
  'matteus-bijbelquiz-deel-14': {
    hue: 326,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'ridge' }),
      tree(1000, G + 4, 1.6, c.p.near),
      circle(970, 350, 9, c.p.accent),
      circle(1020, 336, 9, c.p.accent),
      circle(1040, 384, 9, c.p.accent),
      circle(960, 396, 8, c.p.accent),
      circle(1002, 372, 8, c.p.accent),
      circle(1058, 356, 8, c.p.accent),
      bareTree(1230, G + 6, 1.05, c.p.fore),
      person(740, G + 8, 1.3, c.p.fore, 'point'),
      crowd(c.rand, 440, G + 10, 0.85, c.p.near, 3, 150),
      fg(c, 676, 18),
    ],
  },
  // 15: the sower scatters seed along the path
  'matteus-bijbelquiz-deel-15': {
    hue: 328,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 242, far: 'dunes' }),
      trail(240, H, 900, G, 120, c.p.mid, { opacity: 0.45 }),
      shrub(320, G + 8, 1.0, c.p.near),
      roundStone(440, G + 10, 0.3, c.p.near),
      person(600, G + 8, 1.3, c.p.fore, 'point'),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => circle(690 + i * 16, 372 + ((i * 7) % 3) * 16 + i * 4, 3.6, c.p.fore)),
      bird(880, 300, 1.3, c.p.fore, { opacity: 0.7 }),
      bird(950, 268, 1.1, c.p.fore, { opacity: 0.6 }),
      wheat(1120, G + 10, 0.95, c.p.near, 5),
      wheat(1240, G + 6, 0.9, c.p.near, 5),
      fg(c, 676, 18),
    ],
  },
  // 16: the treasure hidden in the field
  'matteus-bijbelquiz-deel-16': {
    hue: 330,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 248, far: 'ridge' }),
      tree(1100, G + 2, 1.5, c.p.near),
      bird(1150, 300, 1.1, c.p.fore, { opacity: 0.6 }),
      wheat(280, G + 10, 0.9, c.p.near, 6),
      ellipse(640, G + 18, 74, 14, c.p.fore),
      c.soft(640, G - 12, 120, 0.4),
      rect(608, G - 6, 64, 30, c.p.accentDeep),
      rect(602, G - 16, 76, 12, c.p.accent, { rx: 4 }),
      coin(626, G - 24, 0.8, c.p.accent),
      coin(652, G - 26, 0.8, c.p.accent),
      coin(640, G - 36, 0.7, c.p.accent),
      person(770, G + 8, 1.15, c.p.fore, 'kneel'),
      fg(c, 674, 20),
    ],
  },
  // 17: Jesus walks on the water, Peter sinks
  'matteus-bijbelquiz-deel-17': {
    hue: 332,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1090, sunY: 232, sunR: 58, far: 'none', ground: 'water', horizon: 450 }),
      boat(1000, 486, 1.5, c.p.near, false),
      person(1040, 472, 0.95, c.p.fore, 'raise'),
      person(975, 474, 0.9, c.p.fore, 'raise'),
      c.soft(560, 420, 170, 0.24),
      person(560, 498, 1.3, c.p.light, 'stand', { opacity: 0.95 }),
      person(720, 542, 1.05, c.p.fore, 'raise'),
      dunes(c.rand, 506, 14, c.p.water),
      fg(c, 692, 12),
    ],
  },
  // 18: the Canaanite woman kneels before Jesus
  'matteus-bijbelquiz-deel-18': {
    hue: 334,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 240, far: 'ridge', horizon: 474 }),
      citySkyline(c.rand, 1160, 474, 0.85, c.p.far, 6, { opacity: 0.6 }),
      person(470, 482, 1.1, c.p.near, 'stand'),
      person(560, 480, 1.15, c.p.near, 'point'),
      person(720, 480, 1.35, c.p.fore, 'stand'),
      person(860, 482, 1.1, c.p.fore, 'kneel'),
      fg(c, 674, 20),
    ],
  },
  // 19: the keys of the kingdom given to Peter on the rock
  'matteus-bijbelquiz-deel-19': {
    hue: 336,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, far: 'ridge' }),
      path(`M 880 ${G + 10} L 940 340 L 1120 330 L 1200 ${G + 10} Z`, c.p.near),
      crowd(c.rand, 380, G + 10, 0.85, c.p.near, 4, 200),
      person(640, G + 6, 1.35, c.p.fore, 'point'),
      c.soft(790, 322, 100, 0.4),
      key(756, 322, 1.0, c.p.accent),
      person(830, G + 8, 1.1, c.p.fore, 'kneel'),
      fg(c, 676, 18),
    ],
  },
  // 20: the transfiguration on the mountain
  'matteus-bijbelquiz-deel-20': {
    hue: 338,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 140, rays: true, far: 'ridge' }),
      path(`M 340 ${G + 12} L 610 342 L 800 342 L 1070 ${G + 12} Z`, c.p.near),
      cloudBank(c.rand, 704, 262, 1.4, c.p.light, { opacity: 0.3 }),
      c.soft(704, 300, 200, 0.32),
      person(620, 346, 0.95, c.p.light, 'stand', { opacity: 0.7 }),
      person(790, 346, 0.95, c.p.light, 'stand', { opacity: 0.7 }),
      person(704, 342, 1.15, c.p.light, 'raise', { opacity: 0.96 }),
      person(470, G + 2, 1.0, c.p.fore, 'bow'),
      person(950, G + 4, 1.0, c.p.fore, 'kneel'),
      person(1060, G + 10, 1.0, c.p.fore, 'fallen'),
      fg(c, 676, 18),
    ],
  },
  // 21: the shepherd goes after the one lost sheep
  'matteus-bijbelquiz-deel-21': {
    hue: 340,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 280, sunY: 246, far: 'ridge' }),
      ram(210, G + 6, 0.45, c.p.near),
      ram(290, G + 12, 0.5, c.p.near),
      ram(380, G + 8, 0.55, c.p.near),
      ram(460, G + 14, 0.5, c.p.near),
      person(660, G + 8, 1.3, c.p.fore, 'walk'),
      rect(712, G - 152, 5, 160, c.p.fore, { rx: 2 }),
      path(`M 960 ${G + 12} L 1010 396 L 1160 392 L 1210 ${G + 12} Z`, c.p.near),
      ram(1085, 396, 0.55, c.p.fore),
      fg(c, 676, 18),
    ],
  },
  // 22: a camel through the eye of a needle
  'matteus-bijbelquiz-deel-22': {
    hue: 342,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 240, far: 'dunes' }),
      person(300, G + 6, 1.3, c.p.fore, 'point'),
      camel(600, G + 8, 1.15, c.p.near),
      needle(880, G + 10, 1.0, c.p.fore, c.p.sky[1]),
      person(1250, G + 4, 1.1, c.p.near, 'walk'),
      fg(c, 674, 20),
    ],
  },
  // 23: the vineyard workers paid at evening
  'matteus-bijbelquiz-deel-23': {
    hue: 344,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1070, sunY: 250, far: 'dunes', horizon: 476 }),
      vineRow(c.rand, 60, 480, 0.9, c.p.near, 4),
      vineRow(c.rand, 900, 478, 1.1, c.p.near, 6),
      person(440, 484, 1.3, c.p.fore, 'point'),
      coin(524, 330, 1.0, c.p.accent),
      coin(552, 344, 0.9, c.p.accent),
      person(610, 486, 1.15, c.p.fore, 'stand'),
      person(690, 488, 1.1, c.p.near, 'stand'),
      person(760, 490, 1.05, c.p.near, 'carry'),
      person(830, 490, 1.0, c.p.near, 'stand'),
      fg(c, 676, 18),
    ],
  },
  // 24: the entry into Jerusalem on a donkey
  'matteus-bijbelquiz-deel-24': {
    hue: 346,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 190, sunY: 226, sunR: 62, rays: true, far: 'dunes', horizon: 478 }),
      cityWall(330, 478, 0.8, c.p.far, 420, { opacity: 0.55 }),
      gateArch(330, 478, 1.15, c.p.near),
      rect(430, 486, 90, 10, c.p.accent, { opacity: 0.6, rx: 3 }),
      rect(540, 492, 80, 9, c.p.accentDeep, { opacity: 0.6, rx: 3 }),
      donkey(700, 486, 1.15, c.p.near),
      person(720, 434, 0.85, c.p.fore, 'stand'),
      crowd(c.rand, 980, 486, 0.85, c.p.near, 6, 300),
      palm(1230, 484, 1.1, c.p.near),
      fg(c, 676, 18),
    ],
  },
  // 25: the tenants of the vineyard kill the son
  'matteus-bijbelquiz-deel-25': {
    hue: 348,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 242, far: 'ridge' }),
      tower(1090, G + 4, 1.05, c.p.near),
      vineRow(c.rand, 120, G + 8, 1.0, c.p.near, 5),
      person(620, G + 8, 1.25, c.p.fore, 'raise'),
      person(700, G + 8, 1.2, c.p.fore, 'raise'),
      person(850, G + 14, 1.15, c.p.near, 'fallen'),
      fg(c, 676, 18),
    ],
  },
  // 26: the wedding banquet of the king
  'matteus-bijbelquiz-deel-26': {
    hue: 350,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 240, far: 'none', ground: 'flat', horizon: 516 }),
      columns(200, 516, 1.05, c.p.near, 2),
      columns(1210, 516, 1.05, c.p.near, 2),
      throne(1000, 516, 0.95, c.p.near),
      person(1000, 516, 0.95, c.p.fore, 'sit'),
      crown(1000, 404, 0.3, c.p.accent),
      person(460, 516, 1.0, c.p.fore, 'sit'),
      person(640, 516, 1.0, c.p.fore, 'sit'),
      table(610, 430, 380, 86, c.p.near),
      goblet(500, 430, 0.9, c.p.accent),
      loaf(600, 430, 1.0, c.p.accent),
      goblet(700, 430, 0.9, c.p.accent),
      fg(c, 686, 14),
    ],
  },
  // 27: the greatest commandment - Jesus lifts the law before the Pharisees
  'matteus-bijbelquiz-deel-27': {
    hue: 352,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 246, far: 'none', ground: 'flat', horizon: 512 }),
      templeFront(1020, 512, 1.1, c.p.near, 6),
      person(420, 512, 1.2, c.p.fore, 'point'),
      person(580, 512, 1.3, c.p.fore, 'raise'),
      c.soft(580, 316, 110, 0.36),
      scroll(580, 316, 0.75, c.p.accent),
      crowd(c.rand, 800, 514, 0.8, c.p.near, 4, 180),
      fg(c, 684, 14),
    ],
  },
  // 28: woe to the Pharisees - whitewashed tombs
  'matteus-bijbelquiz-deel-28': {
    hue: 354,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1050, sunY: 240, clouds: 3, far: 'ridge', horizon: 480 }),
      tombMound(1270, 488, 0.6, c.p.light, c.p.near, { opacity: 0.8 }),
      tombMound(1060, 486, 0.7, c.p.light, c.p.near, { opacity: 0.85 }),
      tombMound(830, 484, 0.75, c.p.light, c.p.near, { opacity: 0.9 }),
      person(440, 486, 1.3, c.p.fore, 'point'),
      person(590, 488, 1.15, c.p.near, 'stand'),
      person(660, 488, 1.1, c.p.near, 'stand'),
      fg(c, 676, 18),
    ],
  },
  // 29: the temple's destruction foretold from the Mount of Olives
  'matteus-bijbelquiz-deel-29': {
    hue: 356,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1070, sunY: 246, far: 'ridge', horizon: 480 }),
      rect(800, 440, 400, 60, c.p.far, { opacity: 0.92 }),
      cityWall(1000, 440, 0.6, c.p.far, 380, { opacity: 0.92 }),
      templeFront(1000, 404, 0.7, c.p.far),
      ellipse(420, 560, 400, 116, c.p.near, { opacity: 0.92 }),
      tree(600, 470, 1.1, c.p.near),
      person(280, 458, 1.05, c.p.fore, 'stand'),
      person(380, 452, 1.25, c.p.fore, 'point'),
      person(480, 458, 1.0, c.p.fore, 'stand'),
      fg(c, 680, 16),
    ],
  },
  // 30: the Son of Man coming on the clouds with his angels
  'matteus-bijbelquiz-deel-30': {
    hue: 358,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, sunR: 160, far: 'ridge', stars: 50 }),
      lightning(300, 150, 1.0, c.p.light, 0.7),
      lightning(1150, 170, 0.9, c.p.light, 0.6),
      c.soft(704, 270, 270, 0.3),
      rays(c.rand, 704, 270, 420, c.p.glow, 16, { opacity: 0.2 }),
      cloudBank(c.rand, 704, 350, 1.8, c.p.light, { opacity: 0.35 }),
      angel(520, 356, 0.85, c.p.light, { opacity: 0.7 }),
      angel(890, 356, 0.85, c.p.light, { opacity: 0.7 }),
      person(704, 340, 1.05, c.p.light, 'raise', { opacity: 0.96 }),
      crowd(c.rand, 704, G + 10, 0.9, c.p.fore, 8, 560),
      fg(c, 676, 18),
    ],
  },
  // 31: the ten virgins with their lamps at the shut door
  'matteus-bijbelquiz-deel-31': {
    hue: 0,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 250, sunY: 232, sunR: 54, far: 'none', ground: 'flat', horizon: 512 }),
      path(`M 1091 512 L 1091 424 A 39 39 0 0 1 1169 424 L 1169 512 Z`, c.p.fore),
      gateArch(1130, 512, 1.15, c.p.near),
      ...[0, 1, 2, 3, 4].map((i) => person(240 + i * 62, 514, 0.95, c.p.near, 'stand')),
      ...[0, 1, 2, 3, 4].map((i) => lamp(268 + i * 62, 428, 0.5, c.p.near, c.p.near)),
      ...[0, 1, 2, 3, 4].map((i) => c.soft(742 + i * 70, 422, 60, 0.4)),
      ...[0, 1, 2, 3, 4].map((i) => person(700 + i * 70, 512, 1.0, c.p.fore, 'carry')),
      ...[0, 1, 2, 3, 4].map((i) => lamp(732 + i * 70, 424, 0.55, c.p.accent, c.p.light)),
      fg(c, 684, 14),
    ],
  },
  // 32: the anointing at Bethany
  'matteus-bijbelquiz-deel-32': {
    hue: 2,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 246, far: 'none', ground: 'flat', horizon: 516 }),
      columns(230, 516, 1.0, c.p.near, 2),
      person(640, 516, 1.15, c.p.fore, 'sit'),
      table(880, 436, 360, 80, c.p.near),
      loaf(800, 436, 1.0, c.p.accent),
      goblet(940, 436, 0.85, c.p.accent),
      rotate(44, 500, 516, person(500, 516, 1.15, c.p.fore, 'bow')),
      c.soft(600, 372, 90, 0.32),
      ellipse(588, 366, 16, 22, c.p.accent),
      rect(582, 338, 12, 14, c.p.accent),
      circle(612, 388, 3.5, c.p.accent),
      circle(620, 398, 3, c.p.accent),
      crowd(c.rand, 1170, 518, 0.8, c.p.near, 3, 150),
      fg(c, 686, 14),
    ],
  },
  // 33: Gethsemane - Jesus prays while the arrest party approaches with torches
  'matteus-bijbelquiz-deel-33': {
    hue: 4,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1090, sunY: 230, sunR: 54, far: 'ridge', stars: 60 }),
      tree(300, G + 4, 1.3, c.p.near),
      tree(1260, G + 2, 1.0, c.p.near),
      person(440, G + 14, 1.0, c.p.fore, 'fallen'),
      person(545, G + 18, 0.95, c.p.fore, 'fallen'),
      c.soft(660, 400, 130, 0.18),
      person(680, G + 8, 1.25, c.p.fore, 'kneel'),
      c.soft(1060, 330, 140, 0.26),
      torch(1010, 330, 1.0, c.p.near, c.p.accent),
      torch(1120, 342, 0.9, c.p.near, c.p.accent),
      crowd(c.rand, 1060, G + 10, 0.9, c.p.near, 5, 260),
      fg(c, 676, 18),
    ],
  },
  // 34: Pilate washes his hands as the crowd calls for Barabbas
  'matteus-bijbelquiz-deel-34': {
    hue: 6,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'none', ground: 'flat', horizon: 516 }),
      columns(1230, 516, 1.05, c.p.near, 2),
      rect(800, 470, 420, 46, c.p.near),
      throne(1000, 470, 0.85, c.p.near),
      person(1000, 470, 0.85, c.p.fore, 'sit'),
      rect(876, 410, 8, 60, c.p.near),
      ellipse(880, 408, 26, 8, c.p.accent),
      ellipse(880, 406, 18, 4, c.p.light),
      person(620, 516, 1.3, c.p.fore, 'stand'),
      crowd(c.rand, 340, 518, 0.95, c.p.near, 6, 300),
      fg(c, 686, 14),
    ],
  },
  // 35: the crucifixion in darkness at Golgotha
  'matteus-bijbelquiz-deel-35': {
    hue: 8,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 236, sunR: 70, clouds: 4, far: 'ridge' }),
      rect(0, 0, W, H, c.p.fore, { opacity: 0.3 }),
      ellipse(704, 522, 420, 92, c.p.near),
      cross(704, 436, 1.2, c.p.fore),
      cross(560, 446, 0.9, c.p.fore, { opacity: 0.85 }),
      cross(848, 446, 0.9, c.p.fore, { opacity: 0.85 }),
      person(400, 476, 0.95, c.p.fore, 'bow'),
      person(470, 470, 0.9, c.p.fore, 'kneel'),
      person(960, 470, 1.0, c.p.fore, 'stand'),
      rect(986, 300, 4, 176, c.p.fore),
      fg(c, 680, 16),
    ],
  },
  // 36: the empty tomb at dawn - the angel on the rolled-away stone
  'matteus-bijbelquiz-deel-36': {
    hue: 10,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 244, sunR: 84, rays: true, far: 'ridge' }),
      tombMound(700, G, 1.15, c.p.near, c.p.light),
      roundStone(930, G, 0.95, c.p.near),
      c.soft(930, 340, 150, 0.3),
      angel(930, G - 80, 0.85, c.p.light, { opacity: 0.92 }),
      person(1130, G + 10, 1.0, c.p.fore, 'fallen'),
      person(1240, G + 14, 0.95, c.p.fore, 'fallen'),
      person(430, G + 8, 1.15, c.p.fore, 'walk'),
      person(510, G + 6, 1.1, c.p.fore, 'walk'),
      fg(c, 674, 20),
    ],
  },
};
