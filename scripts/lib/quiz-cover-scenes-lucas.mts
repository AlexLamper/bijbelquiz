/**
 * Covers for the Lucas series, one scene per quiz part.
 *
 * Base hue around 120, drifting a few degrees per part.
 * See `quiz-cover-scenes.mts` for the house style and the core set this
 * module is merged into.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  basket,
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
  cypress,
  donkey,
  dove,
  dunes,
  ellipse,
  fish,
  flame,
  gateArch,
  goblet,
  houseBlock,
  lamp,
  loaf,
  mat,
  ox,
  palm,
  path,
  person,
  rays,
  rect,
  reeds,
  ring,
  rotate,
  roundStone,
  scroll,
  shafts,
  sheaf,
  smokeColumn,
  templeFront,
  tombMound,
  tower,
  trail,
  tree,
  vineRow,
  wheat,
} from './quiz-cover-primitives.mjs';

/** A grazing sheep: round body, small head, four short legs. `y` is the ground. */
function sheep(x: number, y: number, s: number, fill: string): string {
  return (
    ellipse(x, y - 22 * s, 26 * s, 16 * s, fill) +
    rect(x - 18 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x - 8 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x + 6 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x + 16 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    ellipse(x - 30 * s, y - 30 * s, 9 * s, 7 * s, fill)
  );
}

/** A pig seen from the side, snout first. `y` is the ground. */
function pig(x: number, y: number, s: number, fill: string, o?: { opacity?: number }): string {
  const g =
    ellipse(x, y - 20 * s, 30 * s, 17 * s, fill) +
    rect(x - 20 * s, y - 12 * s, 6 * s, 12 * s, fill, { rx: 2 * s }) +
    rect(x - 6 * s, y - 12 * s, 6 * s, 12 * s, fill, { rx: 2 * s }) +
    rect(x + 8 * s, y - 12 * s, 6 * s, 12 * s, fill, { rx: 2 * s }) +
    rect(x + 20 * s, y - 12 * s, 6 * s, 12 * s, fill, { rx: 2 * s }) +
    ellipse(x - 34 * s, y - 24 * s, 13 * s, 10 * s, fill) +
    rect(x - 50 * s, y - 27 * s, 8 * s, 7 * s, fill, { rx: 2 * s }) +
    ellipse(x - 34 * s, y - 34 * s, 4 * s, 6 * s, fill);
  return o?.opacity !== undefined ? `<g opacity="${o.opacity}">${g}</g>` : g;
}

/** A small dog, head low, tail up. `y` is the ground. */
function dog(x: number, y: number, s: number, fill: string): string {
  return (
    ellipse(x, y - 18 * s, 22 * s, 10 * s, fill) +
    rect(x - 16 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x - 6 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x + 6 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x + 14 * s, y - 14 * s, 5 * s, 14 * s, fill, { rx: 2 * s }) +
    ellipse(x - 30 * s, y - 20 * s, 11 * s, 7 * s, fill) +
    ellipse(x - 34 * s, y - 27 * s, 4 * s, 6 * s, fill) +
    rotate(-40, x + 22 * s, y - 20 * s, rect(x + 20 * s, y - 22 * s, 4 * s, 18 * s, fill, { rx: 2 * s }))
  );
}

/** A low table on two legs. `y` is the ground; the top sits at `y - 44 * s`. */
function table(x: number, y: number, w: number, s: number, fill: string): string {
  return (
    rect(x - w / 2, y - 44 * s, w, 12 * s, fill) +
    rect(x - w / 2 + 16 * s, y - 32 * s, 10 * s, 32 * s, fill) +
    rect(x + w / 2 - 26 * s, y - 32 * s, 10 * s, 32 * s, fill)
  );
}

export const LUCAS_SCENES: Record<string, Scene> = {
  // 1: Gabriel appears to Zacharias at the altar of incense
  'lucas-bijbelquiz-deel-1': {
    hue: 120,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 860, sunY: 250, sunR: 110, far: 'none', ground: 'flat', horizon: 512 }),
      columns(200, 512, 1.0, c.p.near, 2),
      columns(1230, 512, 1.0, c.p.near, 2),
      rect(600, 452, 120, 60, c.p.near),
      rect(590, 444, 140, 12, c.p.near),
      smokeColumn(c.rand, 660, 430, 0.9, c.p.light),
      flame(660, 446, 0.5, c.p.accent),
      c.soft(880, 380, 170, 0.2),
      angel(880, 512, 1.15, c.p.light, { opacity: 0.85 }),
      person(470, 512, 1.15, c.p.fore, 'kneel'),
      fg(c, 684, 14),
    ],
  },
  // 2: Mary greets Elizabeth in the hill country
  'lucas-bijbelquiz-deel-2': {
    hue: 122,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 244, far: 'ridge', horizon: 474 }),
      trail(300, H, 640, 480, 120, c.p.mid, { opacity: 0.5 }),
      houseBlock(c.rand, 1000, 478, 0.85, c.p.near),
      tree(340, 480, 1.1, c.p.near),
      person(560, 482, 1.3, c.p.fore, 'walk'),
      person(760, 482, 1.25, c.p.near, 'raise'),
      fg(c, 674, 20),
    ],
  },
  // 3: the angel over the shepherds in the fields of Bethlehem
  'lucas-bijbelquiz-deel-3': {
    hue: 124,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 800, sunY: 260, sunR: 130, far: 'dunes', stars: 60 }),
      citySkyline(c.rand, 1180, G - 20, 0.7, c.p.far, 5, { opacity: 0.6 }),
      c.soft(800, 280, 220, 0.24),
      rays(c.rand, 800, 290, 360, c.p.glow, 12, { opacity: 0.14 }),
      angel(800, 388, 1.0, c.p.light, { opacity: 0.92 }),
      person(420, G + 6, 1.15, c.p.fore, 'kneel'),
      person(540, G + 2, 1.3, c.p.fore, 'raise'),
      person(1010, G + 8, 1.05, c.p.near, 'stand'),
      sheep(300, G + 14, 1.0, c.p.near),
      sheep(660, G + 18, 0.9, c.p.near),
      sheep(1110, G + 20, 0.9, c.p.near),
      fg(c, 678, 18),
    ],
  },
  // 4: John baptizes Jesus in the Jordan, the dove descends
  'lucas-bijbelquiz-deel-4': {
    hue: 126,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 236, rays: true, ground: 'water', far: 'dunes', horizon: 452 }),
      person(760, 500, 1.3, c.p.near, 'raise'),
      person(880, 500, 1.3, c.p.near, 'stand'),
      dove(820, 300, 1.2, c.p.light, { opacity: 0.9 }),
      shafts(820, 60, 200, 230, c.p.glow, 3),
      reeds(c.rand, 1200, 508, 1.1, c.p.fore, 7),
      crowd(c.rand, 420, 486, 0.7, c.p.near, 4, 200),
      fg(c, 690, 12),
    ],
  },
  // 5: the temptation in the wilderness, the tempter points at the kingdoms
  'lucas-bijbelquiz-deel-5': {
    hue: 128,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 250, far: 'dunes' }),
      citySkyline(c.rand, 1150, G - 26, 0.6, c.p.far, 6, { opacity: 0.5 }),
      dunes(c.rand, 496, 40, c.p.near, { opacity: 0.6, segs: 3 }),
      person(560, G + 8, 1.35, c.p.near, 'stand'),
      person(760, G + 6, 1.4, c.p.fore, 'point'),
      circle(430, G + 20, 16, c.p.fore),
      circle(470, G + 26, 12, c.p.fore),
      fg(c, 676, 20),
    ],
  },
  // 6: the miraculous catch of fish, Peter kneels in the boat
  'lucas-bijbelquiz-deel-6': {
    hue: 130,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, ground: 'water', far: 'dunes', horizon: 448 }),
      boat(740, 500, 1.6, c.p.near, false),
      person(660, 478, 1.05, c.p.fore, 'kneel'),
      person(830, 478, 1.15, c.p.fore, 'stand'),
      fish(1020, 520, 0.6, c.p.accent),
      fish(1110, 556, 0.5, c.p.accentDeep),
      fish(500, 540, 0.55, c.p.accent),
      fish(400, 574, 0.45, c.p.accentDeep),
      fg(c, 692, 12),
    ],
  },
  // 7: the disciples pluck grain on the sabbath
  'lucas-bijbelquiz-deel-7': {
    hue: 132,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'ridge' }),
      wheat(300, G + 30, 0.9, c.p.crop, 7),
      wheat(560, G + 36, 0.85, c.p.crop, 5),
      wheat(1160, G + 30, 0.9, c.p.crop, 6),
      person(700, G + 10, 1.25, c.p.fore, 'bow'),
      person(820, G + 8, 1.3, c.p.fore, 'stand'),
      person(1000, G + 8, 1.2, c.p.near, 'point'),
      fg(c, 676, 20),
    ],
  },
  // 8: the young man of Nain raised from the bier at the town gate
  'lucas-bijbelquiz-deel-8': {
    hue: 134,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 244, far: 'none', ground: 'flat', horizon: 508 }),
      gateArch(1080, 508, 1.1, c.p.near),
      person(800, 508, 1.05, c.p.near, 'carry'),
      person(960, 508, 1.05, c.p.near, 'carry'),
      mat(880, 396, 1.2, c.p.accent),
      person(890, 396, 0.8, c.p.fore, 'sit'),
      person(560, 508, 1.3, c.p.fore, 'raise'),
      person(430, 508, 1.05, c.p.fore, 'kneel'),
      fg(c, 682, 16),
    ],
  },
  // 9: the sinful woman anoints Jesus' feet at Simon's table
  'lucas-bijbelquiz-deel-9': {
    hue: 136,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 250, far: 'none', ground: 'flat', horizon: 510 }),
      columns(230, 510, 1.0, c.p.near, 2),
      table(760, 510, 360, 1.1, c.p.near),
      goblet(700, 462, 0.9, c.p.accent),
      loaf(820, 462, 0.9, c.p.accent),
      person(960, 510, 1.15, c.p.near, 'sit'),
      person(560, 510, 1.2, c.p.near, 'sit'),
      person(430, 510, 1.05, c.p.fore, 'kneel'),
      fg(c, 682, 16),
    ],
  },
  // 10: the sower scatters seed, the birds come for the path
  'lucas-bijbelquiz-deel-10': {
    hue: 138,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 240, far: 'ridge' }),
      trail(1000, H, 1180, G, 120, c.p.mid, { opacity: 0.45 }),
      wheat(360, G + 26, 0.9, c.p.crop, 6),
      wheat(520, G + 32, 0.75, c.p.crop, 4),
      person(760, G + 8, 1.35, c.p.fore, 'point'),
      circle(880, 400, 4, c.p.fore),
      circle(920, 428, 4, c.p.fore),
      circle(960, 412, 4, c.p.fore),
      circle(990, 446, 4, c.p.fore),
      bird(1060, 330, 1.2, c.p.fore),
      bird(1140, 300, 1.0, c.p.fore),
      bird(1110, 370, 0.9, c.p.fore),
      fg(c, 676, 20),
    ],
  },
  // 11: the herd of swine rushes down the slope into the lake
  'lucas-bijbelquiz-deel-11': {
    hue: 140,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 240, ground: 'water', far: 'ridge', horizon: 486 }),
      path(`M -80 500 L 700 500 C 760 470 820 420 900 400 L 1000 420 L 1000 560 L -80 560 Z`, c.p.mid),
      tombMound(200, 500, 0.7, c.p.near, c.p.fore),
      person(500, 500, 1.3, c.p.fore, 'point'),
      person(400, 504, 1.05, c.p.near, 'kneel'),
      pig(700, 500, 1.0, c.p.near),
      pig(790, 468, 0.95, c.p.near),
      pig(870, 436, 0.9, c.p.near),
      rotate(38, 980, 450, pig(980, 450, 0.9, c.p.near)),
      rotate(62, 1080, 520, pig(1080, 520, 0.85, c.p.near, { opacity: 0.8 })),
      fg(c, 692, 12),
    ],
  },
  // 12: five loaves and two fish feed the five thousand, twelve baskets are left
  'lucas-bijbelquiz-deel-12': {
    hue: 142,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 248, rays: true, far: 'ridge' }),
      crowd(c.rand, 1000, G + 6, 0.75, c.p.near, 8, 400),
      person(520, G + 4, 1.35, c.p.fore, 'raise'),
      loaf(640, G + 12, 1.1, c.p.accent),
      loaf(700, G + 14, 1.0, c.p.accent),
      fish(790, G + 6, 0.55, c.p.accentDeep),
      basket(300, G + 20, 0.9, c.p.near),
      basket(380, G + 24, 0.8, c.p.near),
      basket(240, G + 28, 0.75, c.p.near),
      fg(c, 676, 20),
    ],
  },
  // 13: the transfiguration, a cloud overshadows the mountain
  'lucas-bijbelquiz-deel-13': {
    hue: 144,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 300, sunR: 140, far: 'ridge', stars: 30 }),
      c.soft(704, 320, 200, 0.22),
      cloudBank(c.rand, 704, 250, 1.8, c.p.light, { opacity: 0.32 }),
      person(704, G, 1.4, c.p.light, 'raise', { opacity: 0.95 }),
      person(590, G + 6, 1.05, c.p.light, 'stand', { opacity: 0.5 }),
      person(820, G + 6, 1.05, c.p.light, 'stand', { opacity: 0.5 }),
      person(380, G + 16, 1.0, c.p.fore, 'kneel'),
      person(470, G + 20, 0.95, c.p.fore, 'bow'),
      person(1010, G + 18, 1.0, c.p.fore, 'kneel'),
      fg(c, 678, 18),
    ],
  },
  // 14: the good Samaritan lifts the wounded man onto his donkey
  'lucas-bijbelquiz-deel-14': {
    hue: 146,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, far: 'ridge' }),
      trail(400, H, 1100, G - 10, 130, c.p.mid, { opacity: 0.5 }),
      person(1060, G - 4, 0.8, c.p.near, 'walk'),
      donkey(900, G + 10, 1.15, c.p.near),
      person(560, G + 16, 1.25, c.p.fore, 'fallen'),
      person(690, G + 8, 1.25, c.p.fore, 'bow'),
      fg(c, 674, 20),
    ],
  },
  // 15: the friend at midnight knocks for three loaves
  'lucas-bijbelquiz-deel-15': {
    hue: 148,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 280, sunY: 232, sunR: 56, far: 'none', ground: 'flat', horizon: 508 }),
      houseBlock(c.rand, 900, 508, 1.05, c.p.near),
      rect(838, 452, 18, 20, c.p.light, { opacity: 0.55 }),
      person(700, 508, 1.25, c.p.fore, 'point'),
      loaf(520, 508, 0.9, c.p.accent),
      loaf(580, 510, 0.8, c.p.accent),
      loaf(460, 510, 0.8, c.p.accent),
      fg(c, 682, 16),
    ],
  },
  // 16: the sign of Jonah, a great fish off the shore of Nineveh
  'lucas-bijbelquiz-deel-16': {
    hue: 150,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 246, ground: 'water', far: 'dunes', horizon: 446 }),
      citySkyline(c.rand, 1120, 446, 0.85, c.p.far, 7, { opacity: 0.65 }),
      fish(880, 540, 1.5, c.p.near),
      dunes(c.rand, 566, 24, c.p.mid, { segs: 3 }),
      person(420, 574, 1.3, c.p.fore, 'point'),
      crowd(c.rand, 240, 580, 0.8, c.p.fore, 3, 140),
      fg(c, 692, 12),
    ],
  },
  // 17: the rich fool plans bigger barns after the great harvest
  'lucas-bijbelquiz-deel-17': {
    hue: 152,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 248, far: 'dunes', horizon: 476 }),
      houseBlock(c.rand, 1000, 478, 1.05, c.p.near),
      houseBlock(c.rand, 1240, 480, 0.8, c.p.near, { opacity: 0.8 }),
      sheaf(360, 482, 0.85, c.p.crop),
      sheaf(450, 486, 0.75, c.p.crop),
      sheaf(280, 488, 0.7, c.p.crop),
      person(660, 482, 1.3, c.p.fore, 'point'),
      bird(560, 300, 1.1, c.p.fore, { opacity: 0.7 }),
      bird(620, 270, 0.9, c.p.fore, { opacity: 0.6 }),
      fg(c, 674, 20),
    ],
  },
  // 18: the watchful servants wait with lamps lit for their master
  'lucas-bijbelquiz-deel-18': {
    hue: 154,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', stars: 24, far: 'none', ground: 'flat', horizon: 510 }),
      gateArch(1120, 510, 1.15, c.p.near),
      c.soft(760, 410, 200, 0.2),
      person(640, 510, 1.15, c.p.near, 'stand'),
      person(760, 510, 1.15, c.p.near, 'stand'),
      person(880, 510, 1.15, c.p.near, 'stand'),
      lamp(568, 416, 0.7, c.p.fore, c.p.accent),
      lamp(688, 416, 0.7, c.p.fore, c.p.accent),
      lamp(808, 416, 0.7, c.p.fore, c.p.accent),
      trail(200, H, 420, 510, 110, c.p.mid, { opacity: 0.4 }),
      person(330, 510, 1.2, c.p.fore, 'walk'),
      fg(c, 682, 16),
    ],
  },
  // 19: the barren fig tree, the gardener asks for one more year
  'lucas-bijbelquiz-deel-19': {
    hue: 156,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 244, far: 'dunes' }),
      vineRow(c.rand, 860, G + 6, 1.0, c.p.near, 6),
      tree(560, G + 4, 1.5, c.p.near),
      person(700, G + 12, 1.1, c.p.fore, 'kneel'),
      basket(780, G + 20, 0.8, c.p.accent),
      person(400, G + 10, 1.3, c.p.fore, 'point'),
      fg(c, 676, 20),
    ],
  },
  // 20: the great banquet, the poor and the lame are brought in from the streets
  'lucas-bijbelquiz-deel-20': {
    hue: 158,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 280, sunY: 246, far: 'none', ground: 'flat', horizon: 512 }),
      table(500, 512, 440, 1.1, c.p.near),
      goblet(380, 464, 0.9, c.p.accent),
      loaf(500, 464, 0.9, c.p.accent),
      goblet(610, 464, 0.85, c.p.accent),
      person(400, 512, 1.1, c.p.near, 'sit'),
      person(630, 512, 1.1, c.p.near, 'sit'),
      gateArch(1180, 512, 1.15, c.p.near),
      person(800, 512, 1.25, c.p.fore, 'point'),
      person(930, 512, 1.05, c.p.fore, 'walk'),
      person(1040, 512, 0.95, c.p.fore, 'bow'),
      fg(c, 684, 14),
    ],
  },
  // 21: the lost son comes home to his father
  'lucas-bijbelquiz-deel-21': {
    hue: 160,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 248, rays: true, far: 'dunes', horizon: 474 }),
      houseBlock(c.rand, 1060, 478, 0.95, c.p.near),
      trail(250, H, 560, 480, 140, c.p.mid, { opacity: 0.5 }),
      person(560, 482, 1.25, c.p.fore, 'kneel'),
      person(720, 482, 1.35, c.p.fore, 'raise'),
      ring(766, 300, 0.8, c.p.accent),
      ox(300, 484, 0.75, c.p.near, { opacity: 0.85 }),
      fg(c, 674, 20),
    ],
  },
  // 22: Lazarus lies at the rich man's gate
  'lucas-bijbelquiz-deel-22': {
    hue: 162,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 248, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 1020, 512, 1.15, c.p.near),
      gateArch(760, 512, 1.15, c.p.near),
      columns(1230, 512, 0.9, c.p.near, 2),
      person(960, 512, 1.15, c.p.fore, 'stand'),
      goblet(1030, 512, 0.8, c.p.accent),
      person(500, 512, 1.3, c.p.fore, 'fallen'),
      dog(380, 512, 1.0, c.p.fore),
      dog(620, 512, 0.85, c.p.fore),
      fg(c, 684, 14),
    ],
  },
  // 23: the ten lepers, one Samaritan turns back to give thanks
  'lucas-bijbelquiz-deel-23': {
    hue: 164,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'ridge' }),
      trail(1000, H, 1180, G, 130, c.p.mid, { opacity: 0.45 }),
      person(560, G + 6, 1.35, c.p.fore, 'stand'),
      person(680, G + 10, 1.05, c.p.fore, 'kneel'),
      person(880, G + 10, 0.95, c.p.near, 'walk'),
      person(950, G + 4, 1.0, c.p.near, 'walk'),
      person(1030, G + 12, 0.9, c.p.near, 'walk'),
      person(1100, G + 2, 1.0, c.p.near, 'walk'),
      person(1170, G + 10, 0.9, c.p.near, 'walk'),
      person(1240, G + 6, 0.95, c.p.near, 'walk'),
      fg(c, 676, 20),
    ],
  },
  // 24: the Pharisee and the tax collector pray in the temple
  'lucas-bijbelquiz-deel-24': {
    hue: 166,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 240, far: 'none', ground: 'flat', horizon: 510 }),
      templeFront(704, 510, 1.6, c.p.near, 9),
      person(600, 510, 1.3, c.p.fore, 'raise'),
      person(1080, 510, 1.1, c.p.fore, 'bow'),
      fg(c, 682, 16),
    ],
  },
  // 25: Zacchaeus in the sycamore
  'lucas-bijbelquiz-deel-25': {
    hue: 168,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 244, far: 'dunes', horizon: 476 }),
      citySkyline(c.rand, 1180, 476, 0.7, c.p.far, 5, { opacity: 0.55 }),
      tree(820, 480, 1.8, c.p.near),
      rect(690, 360, 100, 12, c.p.near, { rx: 6 }),
      person(700, 362, 0.75, c.p.fore, 'sit'),
      person(560, 482, 1.3, c.p.fore, 'point'),
      crowd(c.rand, 340, 486, 0.85, c.p.near, 4, 200),
      fg(c, 674, 20),
    ],
  },
  // 26: the entry into Jerusalem, cloaks and branches on the road
  'lucas-bijbelquiz-deel-26': {
    hue: 170,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 244, rays: true, far: 'ridge', horizon: 476 }),
      cityWall(1160, 476, 0.9, c.p.near, 320, { opacity: 0.8 }),
      gateArch(1160, 476, 0.9, c.p.near),
      rect(560, 470, 180, 10, c.p.accent, { opacity: 0.8 }),
      rect(780, 474, 140, 9, c.p.accent, { opacity: 0.7 }),
      donkey(680, 482, 1.2, c.p.near),
      person(660, 430, 0.85, c.p.fore, 'stand'),
      palm(360, 482, 0.85, c.p.near),
      crowd(c.rand, 920, 486, 0.75, c.p.near, 5, 220),
      fg(c, 674, 20),
    ],
  },
  // 27: the wicked tenants cast the son out of the vineyard
  'lucas-bijbelquiz-deel-27': {
    hue: 172,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1070, sunY: 250, far: 'dunes' }),
      tower(1120, G + 4, 0.9, c.p.near),
      vineRow(c.rand, 240, G + 8, 1.0, c.p.near, 5),
      vineRow(c.rand, 800, G + 12, 0.9, c.p.near, 4),
      person(560, G + 20, 1.2, c.p.fore, 'fallen'),
      person(700, G + 8, 1.25, c.p.fore, 'raise'),
      person(800, G + 10, 1.15, c.p.fore, 'point'),
      fg(c, 676, 20),
    ],
  },
  // 28: render to Caesar, Jesus holds up the denarius
  'lucas-bijbelquiz-deel-28': {
    hue: 174,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      columns(1130, 512, 1.0, c.p.near, 3),
      person(620, 512, 1.35, c.p.fore, 'point'),
      coin(720, 386, 2.2, c.p.accent),
      crowd(c.rand, 940, 514, 0.95, c.p.near, 4, 200),
      fg(c, 684, 14),
    ],
  },
  // 29: not one stone left upon another, Jesus foretells the temple's fall
  'lucas-bijbelquiz-deel-29': {
    hue: 176,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, clouds: 4, far: 'none', ground: 'flat', horizon: 512 }),
      templeFront(960, 512, 1.25, c.p.near, 7),
      person(480, 512, 1.3, c.p.fore, 'point'),
      person(380, 512, 1.15, c.p.fore, 'stand'),
      person(600, 512, 1.1, c.p.fore, 'stand'),
      fg(c, 684, 14),
    ],
  },
  // 30: the last supper, the bread and the cup
  'lucas-bijbelquiz-deel-30': {
    hue: 178,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', stars: 10, far: 'none', ground: 'flat', horizon: 512 }),
      columns(170, 512, 1.0, c.p.near, 2),
      columns(1240, 512, 1.0, c.p.near, 2),
      c.soft(704, 420, 260, 0.2),
      table(704, 512, 640, 1.15, c.p.near),
      person(704, 512, 1.3, c.p.fore, 'raise'),
      goblet(600, 462, 1.0, c.p.accent),
      loaf(810, 462, 1.0, c.p.accent),
      person(440, 512, 1.05, c.p.near, 'sit'),
      person(540, 512, 1.05, c.p.near, 'sit'),
      person(870, 512, 1.05, c.p.near, 'sit'),
      person(970, 512, 1.05, c.p.near, 'sit'),
      fg(c, 684, 14),
    ],
  },
  // 31: Gethsemane, an angel strengthens Jesus while the disciples sleep
  'lucas-bijbelquiz-deel-31': {
    hue: 180,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1080, sunY: 234, sunR: 56, far: 'ridge' }),
      cypress(300, G + 6, 1.0, c.p.near),
      tree(1000, G + 4, 1.2, c.p.near),
      c.soft(640, 380, 170, 0.18),
      angel(660, G + 2, 1.0, c.p.light, { opacity: 0.7 }),
      person(540, G + 8, 1.2, c.p.fore, 'kneel'),
      person(860, G + 14, 1.1, c.p.fore, 'fallen'),
      person(1180, G + 12, 0.95, c.p.near, 'sit'),
      flame(1320, 380, 0.35, c.p.accent, { opacity: 0.8 }),
      flame(1360, 396, 0.3, c.p.accent, { opacity: 0.7 }),
      fg(c, 676, 20),
    ],
  },
  // 32: Simon of Cyrene carries the cross behind Jesus, the women weep
  'lucas-bijbelquiz-deel-32': {
    hue: 182,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 246, clouds: 3, far: 'ridge' }),
      cityWall(240, G - 6, 0.85, c.p.far, 300, { opacity: 0.6 }),
      trail(400, H, 1000, G, 140, c.p.mid, { opacity: 0.45 }),
      person(880, G + 4, 1.25, c.p.fore, 'walk'),
      rotate(30, 600, G + 30, cross(600, G + 30, 1.2, c.p.fore)),
      person(660, G + 8, 1.2, c.p.fore, 'carry'),
      person(440, G + 14, 1.0, c.p.near, 'bow'),
      person(520, G + 16, 0.95, c.p.near, 'kneel'),
      fg(c, 676, 20),
    ],
  },
  // 33: the crucifixion, darkness over the land
  'lucas-bijbelquiz-deel-33': {
    hue: 184,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 320, sunY: 236, sunR: 60, clouds: 5, far: 'ridge' }),
      rect(0, 0, W, H, c.p.fore, { opacity: 0.28 }),
      dunes(c.rand, 470, 30, c.p.near, { segs: 3, opacity: 0.6 }),
      cross(704, G - 10, 1.15, c.p.fore),
      cross(520, G, 0.8, c.p.near, { opacity: 0.85 }),
      cross(900, G, 0.8, c.p.near, { opacity: 0.85 }),
      person(620, G + 16, 1.0, c.p.fore, 'kneel'),
      person(1090, G + 18, 0.85, c.p.near, 'stand'),
      person(1160, G + 22, 0.8, c.p.near, 'bow'),
      fg(c, 676, 20),
    ],
  },
  // 34: the empty tomb at dawn, two men in shining garments
  'lucas-bijbelquiz-deel-34': {
    hue: 186,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, sunR: 84, rays: true, far: 'ridge' }),
      tombMound(880, G, 1.05, c.p.near, c.p.light),
      roundStone(1110, G, 0.95, c.p.near),
      c.soft(880, 400, 150, 0.2),
      angel(800, G + 2, 0.95, c.p.light, { opacity: 0.85 }),
      angel(960, G + 2, 0.95, c.p.light, { opacity: 0.85 }),
      person(480, G + 8, 1.15, c.p.fore, 'kneel'),
      person(580, G + 6, 1.2, c.p.fore, 'raise'),
      person(400, G + 10, 1.1, c.p.fore, 'stand'),
      fg(c, 674, 20),
    ],
  },
  // 35: the road to Emmaus, the village ahead as evening falls
  'lucas-bijbelquiz-deel-35': {
    hue: 188,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 250, sunR: 74, rays: true, far: 'ridge', horizon: 474 }),
      citySkyline(c.rand, 1150, 474, 0.75, c.p.far, 5, { opacity: 0.6 }),
      trail(300, H, 1040, 478, 150, c.p.mid, { opacity: 0.5 }),
      person(560, 486, 1.2, c.p.fore, 'walk'),
      person(660, 482, 1.3, c.p.fore, 'walk'),
      person(760, 486, 1.2, c.p.fore, 'walk'),
      cypress(260, 482, 0.9, c.p.near),
      fg(c, 674, 20),
    ],
  },
};
