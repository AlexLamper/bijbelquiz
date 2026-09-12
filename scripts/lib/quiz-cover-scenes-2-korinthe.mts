/**
 * Covers for the 2 Korinthe series, one scene per quiz part.
 *
 * 2 Korinthe is Paulus' most personal letter - comfort in affliction, the
 * treasure in jars of clay, reconciliation, the collection for Jerusalem,
 * spiritual warfare, the vision of the third heaven and the thorn in the
 * flesh, and the closing call to self-examination.
 *
 * Base hue 280 (a deep purple/magenta, distinct from Romeinen, 1 Korinthe and
 * Galaten), drifting two degrees per part. See `quiz-cover-scenes.mts` for
 * the house style and the core set this module is merged into.
 */

import {
  H,
  W,
  basket,
  boat,
  circle,
  cityWall,
  columns,
  coin,
  crowd,
  ellipse,
  goat,
  hand,
  ox,
  path,
  person,
  prisonBars,
  rays,
  rect,
  rotate,
  scroll,
  shafts,
  sheaf,
  smokeColumn,
  streaks,
  swell,
  tablets,
  templeFront,
  tent,
  tower,
  tri,
  wheat,
} from './quiz-cover-primitives.mjs';
import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

// ── motifs composed for this series ─────────────────────────────────────────

/** A clay jar: rounded belly, narrow neck, a lip - the treasure in earthen vessels. */
function clayJar(x: number, y: number, s: number, fill: string, o?: { opacity?: number }): string {
  const g =
    ellipse(x, y - 42 * s, 36 * s, 48 * s, fill) +
    rect(x - 11 * s, y - 96 * s, 22 * s, 30 * s, fill, { rx: 4 * s }) +
    ellipse(x, y - 96 * s, 15 * s, 6 * s, fill) +
    path(`M ${r1(x - 24 * s)} ${r1(y - 30 * s)} q ${r1(-10 * s)} ${r1(10 * s)} ${r1(-2 * s)} ${r1(26 * s)}`, 'none').replace(
      'fill="none"',
      `fill="none" stroke="${fill}" stroke-width="${r1(3 * s)}" stroke-linecap="round" opacity="0.6"`,
    );
  return o ? `<g opacity="${o.opacity ?? 1}">${g}</g>` : g;
}

/** An ox and a goat sharing one crossbar - the unequal yoke. */
function unequalYoke(x: number, y: number, s: number, fill: string): string {
  const oxX = x - 60 * s;
  const goatX = x + 60 * s;
  return (
    ox(oxX, y, s * 0.9, fill) +
    goat(goatX, y + 6 * s, s * 0.72, fill) +
    rect(oxX - 26 * s, y - 74 * s, goatX - oxX + 52 * s, 9 * s, fill, { rx: 3 * s })
  );
}

/** A short barbed twig standing upright - the thorn in the flesh. */
function thornSprig(x: number, y: number, s: number, fill: string): string {
  const spine = path(`M ${r1(x)} ${r1(y)} L ${r1(x - 6 * s)} ${r1(y - 84 * s)}`, 'none').replace(
    'fill="none"',
    `fill="none" stroke="${fill}" stroke-width="${r1(4 * s)}" stroke-linecap="round"`,
  );
  const barb = (t: number, dir: number) =>
    tri(
      x - 6 * s * t,
      y - 84 * s * t,
      x - 6 * s * t + dir * 22 * s,
      y - 84 * s * t - 8 * s,
      x - 6 * s * t + dir * 6 * s,
      y - 84 * s * t + 10 * s,
      fill,
    );
  return spine + barb(0.3, 1) + barb(0.55, -1) + barb(0.8, 1);
}

// ── scenes ──────────────────────────────────────────────────────────────────

export const KORINTHE2_SCENES: Record<string, Scene> = {
  // 1: God comforts Paulus in all affliction, so he can comfort others
  '2-korinthe-bijbelquiz-deel-1': {
    hue: 280,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1000, sunY: 214, clouds: 3, far: 'ridge', horizon: 480 }),
      shafts(1000, 60, 200, 260, c.p.glow, 4),
      c.soft(1000, 244, 190, 0.3),
      person(430, G + 10, 1.25, c.p.fore, 'kneel'),
      person(560, G + 16, 1.05, c.p.near, 'fallen'),
      person(770, G + 8, 1.2, c.p.fore, 'raise'),
      fg(c, 680, 16),
    ],
  },
  // 2: forgiveness for the punished brother, the fragrance of Christ
  '2-korinthe-bijbelquiz-deel-2': {
    hue: 282,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 236, far: 'ridge' }),
      person(560, G + 8, 1.2, c.p.fore, 'kneel'),
      person(690, G + 4, 1.3, c.p.fore, 'stand'),
      c.soft(625, 350, 95, 0.34),
      hand(625, 350, 0.8, c.p.light, { opacity: 0.9 }),
      smokeColumn(c.rand, 1100, G + 10, 1.0, c.p.light),
      c.soft(1100, 300, 140, 0.3),
      fg(c, 676, 18),
    ],
  },
  // 3: the veil lifted from the face - ministry of the Spirit, not the letter
  '2-korinthe-bijbelquiz-deel-3': {
    hue: 284,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 226, rays: true, far: 'ridge' }),
      c.soft(704, 300, 220, 0.34),
      tablets(410, G + 8, 1.0, c.p.near, { opacity: 0.7 }),
      person(560, G + 6, 1.2, c.p.fore, 'stand'),
      rect(524, 300, 88, 172, c.p.light, { opacity: 0.22, rx: 24 }),
      person(870, G + 8, 1.25, c.p.fore, 'raise'),
      c.soft(870, 292, 110, 0.36),
      scroll(870, 292, 0.72, c.p.accent),
      fg(c, 674, 20),
    ],
  },
  // 4: treasure in jars of clay, the light of eternal glory shining through
  '2-korinthe-bijbelquiz-deel-4': {
    hue: 286,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 244, far: 'ridge', horizon: 480 }),
      rays(c.rand, 704, 190, 300, c.p.glow, 12, { opacity: 0.12 }),
      person(500, 484, 1.2, c.p.fore, 'carry'),
      c.soft(700, 420, 140, 0.42),
      clayJar(700, 486, 1.1, c.p.near),
      person(890, 486, 1.05, c.p.near, 'kneel'),
      fg(c, 680, 16),
    ],
  },
  // 5: the earthly tent versus the house from heaven, the ministry of reconciliation
  '2-korinthe-bijbelquiz-deel-5': {
    hue: 288,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 236, far: 'ridge' }),
      tent(320, G + 10, 1.0, c.p.near, { opacity: 0.85 }),
      c.soft(1080, 300, 170, 0.32),
      columns(1080, G + 6, 1.0, c.p.light, 3, { opacity: 0.55 }),
      person(610, G + 8, 1.15, c.p.fore, 'stand'),
      person(750, G + 4, 1.2, c.p.fore, 'point'),
      fg(c, 676, 18),
    ],
  },
  // 6: the unequal yoke, and the gemeente as the temple of the living God
  '2-korinthe-bijbelquiz-deel-6': {
    hue: 290,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 238, far: 'none', ground: 'flat', horizon: 512 }),
      unequalYoke(420, 512, 1.0, c.p.near),
      templeFront(1040, 512, 1.05, c.p.near, 6),
      person(770, 512, 1.15, c.p.fore, 'point'),
      fg(c, 684, 14),
    ],
  },
  // 7: godly sorrow that leads to repentance, comfort at the coming of Titus
  '2-korinthe-bijbelquiz-deel-7': {
    hue: 292,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 246, far: 'none', ground: 'swell', horizon: 440 }),
      boat(1020, 468, 1.3, c.p.near, true),
      person(1060, 452, 1.0, c.p.fore, 'stand'),
      person(560, G + 6, 1.15, c.p.fore, 'kneel'),
      c.soft(560, 360, 130, 0.3),
      person(700, G + 10, 1.1, c.p.near, 'walk'),
      swell(c.rand, 540, c.p.mid),
    ],
  },
  // 8: the Macedonian churches give beyond their means for the collection
  '2-korinthe-bijbelquiz-deel-8': {
    hue: 294,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 240, far: 'dunes' }),
      crowd(c.rand, 420, G + 10, 0.9, c.p.near, 5, 260),
      basket(760, G + 10, 1.1, c.p.near),
      coin(732, G - 30, 0.9, c.p.accent),
      coin(772, G - 40, 0.85, c.p.accent),
      coin(802, G - 22, 0.9, c.p.accent),
      person(920, G + 6, 1.2, c.p.fore, 'carry'),
      fg(c, 676, 18),
    ],
  },
  // 9: the cheerful giver, who sows bountifully for the saints
  '2-korinthe-bijbelquiz-deel-9': {
    hue: 296,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, rays: true, far: 'dunes' }),
      wheat(240, G + 10, 0.9, c.p.near, 6),
      sheaf(500, G + 10, 1.0, c.p.near),
      person(680, G + 6, 1.25, c.p.fore, 'raise'),
      basket(870, G + 10, 1.05, c.p.near),
      coin(850, G - 26, 0.85, c.p.accent),
      coin(890, G - 34, 0.8, c.p.accent),
      wheat(1140, G + 16, 0.95, c.p.fore, 6),
      fg(c, 676, 18),
    ],
  },
  // 10: the weapons of our warfare, strongholds pulled down, boasting rightly measured
  '2-korinthe-bijbelquiz-deel-10': {
    hue: 298,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 240, clouds: 3, far: 'ridge', horizon: 480 }),
      cityWall(1090, 486, 0.7, c.p.near, 260, { opacity: 0.6 }),
      rotate(-6, 1090, 486, tower(1090, 486, 0.95, c.p.near, { opacity: 0.75 })),
      rays(c.rand, 620, 214, 320, c.p.glow, 10, { opacity: 0.14 }),
      person(540, 488, 1.25, c.p.fore, 'raise'),
      person(660, 486, 1.15, c.p.fore, 'point'),
      fg(c, 680, 16),
    ],
  },
  // 11: false apostles, and the sufferings Paulus endured - shipwreck, danger, imprisonment
  '2-korinthe-bijbelquiz-deel-11': {
    hue: 300,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'none', ground: 'swell', horizon: 440 }),
      rotate(12, 780, 468, boat(780, 468, 1.35, c.p.near, false)),
      person(720, 452, 0.95, c.p.fore, 'fallen'),
      streaks(c.rand, 0, 100, W, 360, c.p.light, 50, { opacity: 0.3 }),
      prisonBars(370, 468, 1.05, c.p.near, false),
      person(370, 468, 1.0, c.p.fore, 'stand'),
      swell(c.rand, 540, c.p.mid),
    ],
  },
  // 12: caught up to the third heaven, and given a thorn in the flesh to keep him humble
  '2-korinthe-bijbelquiz-deel-12': {
    hue: 302,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 190, sunR: 150, far: 'none', ground: 'flat', horizon: 512, stars: 50 }),
      c.soft(704, 210, 260, 0.32),
      rays(c.rand, 704, 210, 380, c.p.glow, 14, { opacity: 0.16 }),
      person(704, 330, 1.1, c.p.light, 'raise', { opacity: 0.85 }),
      person(704, 512, 1.15, c.p.fore, 'kneel'),
      thornSprig(770, 500, 1.0, c.p.near),
      fg(c, 684, 14),
    ],
  },
  // 13: the closing call to self-examination, and the benediction of grace
  '2-korinthe-bijbelquiz-deel-13': {
    hue: 304,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 230, rays: true, far: 'ridge' }),
      person(690, G + 6, 1.3, c.p.fore, 'raise'),
      crowd(c.rand, 420, G + 10, 0.85, c.p.near, 5, 260),
      c.soft(690, 288, 120, 0.34),
      scroll(690, 288, 0.72, c.p.accent),
      fg(c, 676, 18),
    ],
  },
};
