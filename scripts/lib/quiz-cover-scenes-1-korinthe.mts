/**
 * Covers for the 1 Korinthe series, one scene per chapter (each quiz part
 * follows the chapter of the same number).
 *
 * Base hue around 256-286, violet - distinct from the greens/golds used for
 * Lucas/Matteus/Johannes. See `quiz-cover-scenes.mts` for the house style and
 * `quiz-cover-scenes-lucas.mts` for the pattern this module follows.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  angel,
  basket,
  citySkyline,
  cloudBank,
  columns,
  coin,
  crowd,
  crown,
  cross,
  flame,
  gateArch,
  goblet,
  lamp,
  loaf,
  ox,
  person,
  rect,
  ring,
  roundStone,
  scroll,
  shafts,
  smokeColumn,
  templeFront,
  tombMound,
  tongues,
  trail,
  wheat,
} from './quiz-cover-primitives.mjs';

/** A low table on two legs. `y` is the ground; the top sits at `y - 44 * s`. */
function table(x: number, y: number, w: number, s: number, fill: string): string {
  return (
    rect(x - w / 2, y - 44 * s, w, 12 * s, fill) +
    rect(x - w / 2 + 16 * s, y - 32 * s, 10 * s, 32 * s, fill) +
    rect(x + w / 2 - 26 * s, y - 32 * s, 10 * s, 32 * s, fill)
  );
}

export const KORINTHE1_SCENES: Record<string, Scene> = {
  // 1: divisions in Corinth - Paul, Apollos, Cefas, Christus. Paul appeals for unity.
  '1-korinthe-bijbelquiz-deel-1': {
    hue: 256,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'none', ground: 'flat', horizon: 512 }),
      columns(200, 512, 1.0, c.p.near, 2),
      columns(1220, 512, 1.0, c.p.near, 2),
      crowd(c.rand, 480, 512, 0.85, c.p.near, 4, 220),
      crowd(c.rand, 930, 512, 0.85, c.p.mid, 4, 220),
      person(704, 512, 1.3, c.p.fore, 'point'),
      scroll(704, 390, 0.7, c.p.accent),
      fg(c, 684, 14),
    ],
  },
  // 2: not with wisdom of words but the Spirit revealing the deep things of God
  '1-korinthe-bijbelquiz-deel-2': {
    hue: 258,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 250, sunR: 90, far: 'none', ground: 'flat', horizon: 512, stars: 46 }),
      cross(560, 512, 0.8, c.p.near, { opacity: 0.55 }),
      shafts(950, 20, 150, 190, c.p.glow, 5),
      person(950, 512, 1.3, c.p.fore, 'raise'),
      crowd(c.rand, 1160, 514, 0.8, c.p.near, 3, 160),
      fg(c, 684, 14),
    ],
  },
  // 3: you are God's field and building; the foundation is Christ; fire tests each one's work
  '1-korinthe-bijbelquiz-deel-3': {
    hue: 260,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 244, far: 'ridge' }),
      wheat(320, G + 30, 0.9, c.p.crop, 6),
      wheat(460, G + 34, 0.75, c.p.crop, 4),
      columns(900, G + 6, 1.0, c.p.near, 3),
      flame(900, G - 92, 0.9, c.p.accent),
      person(660, G + 10, 1.25, c.p.fore, 'point'),
      fg(c, 676, 20),
    ],
  },
  // 4: stewards of the mysteries, apostles made a spectacle before the world and the angels
  '1-korinthe-bijbelquiz-deel-4': {
    hue: 262,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1070, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      gateArch(1080, 512, 1.15, c.p.near),
      crowd(c.rand, 1160, 514, 0.7, c.p.near, 4, 200),
      c.soft(720, 300, 160, 0.2),
      angel(720, 300, 0.7, c.p.light, { opacity: 0.5 }),
      person(560, 512, 1.25, c.p.fore, 'stand'),
      scroll(560, 424, 0.65, c.p.accent),
      fg(c, 684, 14),
    ],
  },
  // 5: sexual immorality tolerated, hand the man over, purge the old leaven - Christ our Passover
  '1-korinthe-bijbelquiz-deel-5': {
    hue: 264,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 246, clouds: 3, far: 'none', ground: 'flat', horizon: 512 }),
      table(704, 512, 340, 1.05, c.p.near),
      goblet(620, 464, 0.9, c.p.accent),
      loaf(790, 464, 0.9, c.p.accent),
      flame(790, 418, 0.4, c.p.accentDeep, { opacity: 0.85 }),
      person(500, 512, 1.2, c.p.fore, 'point'),
      fg(c, 684, 14),
    ],
  },
  // 6: lawsuits before the unrighteous; your body is a temple of the Holy Spirit
  '1-korinthe-bijbelquiz-deel-6': {
    hue: 266,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 240, far: 'none', ground: 'flat', horizon: 510 }),
      templeFront(560, 510, 1.1, c.p.near, 7),
      c.soft(560, 380, 150, 0.22),
      person(560, 510, 1.15, c.p.fore, 'raise'),
      columns(1190, 510, 0.9, c.p.near, 2),
      person(1090, 510, 1.0, c.p.near, 'point'),
      person(1270, 510, 1.0, c.p.near, 'point'),
      fg(c, 682, 16),
    ],
  },
  // 7: marriage, the unmarried and the widows - concessions, not commands
  '1-korinthe-bijbelquiz-deel-7': {
    hue: 268,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'dunes', horizon: 500 }),
      person(660, 500, 1.5, c.p.fore, 'stand'),
      person(740, 500, 1.5, c.p.fore, 'stand'),
      ring(700, 268, 0.9, c.p.accent),
      person(1080, 504, 1.15, c.p.fore, 'stand', { opacity: 0.85 }),
      fg(c, 682, 16),
    ],
  },
  // 8: food offered to idols - the idol is nothing, but not everyone's conscience is strong
  '1-korinthe-bijbelquiz-deel-8': {
    hue: 270,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(980, 512, 1.0, c.p.near, 2),
      smokeColumn(c.rand, 980, 452, 0.8, c.p.light),
      person(800, 512, 1.05, c.p.near, 'sit'),
      loaf(840, 472, 0.7, c.p.accent),
      person(560, 512, 1.2, c.p.fore, 'bow'),
      fg(c, 684, 14),
    ],
  },
  // 9: an apostle's rights renounced; do not muzzle the ox; running the race for an incorruptible crown
  '1-korinthe-bijbelquiz-deel-9': {
    hue: 272,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 240, far: 'ridge' }),
      ox(360, G + 20, 0.9, c.p.near),
      wheat(510, G + 30, 0.7, c.p.crop, 4),
      person(820, G + 8, 1.3, c.p.fore, 'walk'),
      crown(1080, G - 40, 0.7, c.p.accent),
      fg(c, 676, 20),
    ],
  },
  // 10: the fathers under the cloud, through the sea, drinking from the rock that was Christ
  '1-korinthe-bijbelquiz-deel-10': {
    hue: 274,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, sunR: 80, rays: true, ground: 'water', far: 'dunes', horizon: 452 }),
      cloudBank(c.rand, 720, 220, 1.6, c.p.light, { opacity: 0.3 }),
      roundStone(1110, 452, 0.8, c.p.near),
      crowd(c.rand, 500, 460, 0.85, c.p.near, 6, 340),
      fg(c, 690, 12),
    ],
  },
  // 11: the Lord's Supper - the bread and the cup, done in remembrance of Him
  '1-korinthe-bijbelquiz-deel-11': {
    hue: 276,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', stars: 16, far: 'none', ground: 'flat', horizon: 512 }),
      columns(200, 512, 1.0, c.p.near, 2),
      columns(1220, 512, 1.0, c.p.near, 2),
      c.soft(704, 420, 220, 0.2),
      table(704, 512, 520, 1.1, c.p.near),
      person(704, 512, 1.25, c.p.fore, 'raise'),
      goblet(610, 462, 0.95, c.p.accent),
      loaf(800, 462, 0.95, c.p.accent),
      person(480, 512, 1.05, c.p.near, 'sit'),
      person(920, 512, 1.05, c.p.near, 'sit'),
      fg(c, 684, 14),
    ],
  },
  // 12: gifts of the Spirit distributed to each one, one body with many members
  '1-korinthe-bijbelquiz-deel-12': {
    hue: 278,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 260, sunR: 120, far: 'none', ground: 'flat', horizon: 512, stars: 26 }),
      c.soft(704, 300, 200, 0.22),
      tongues(c.rand, 704, 300, 0.9, c.p.accent, 7),
      crowd(c.rand, 704, 512, 0.95, c.p.near, 7, 420),
      fg(c, 684, 14),
    ],
  },
  // 13: love bears, believes, hopes, endures all things - and never fails
  '1-korinthe-bijbelquiz-deel-13': {
    hue: 280,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(704, 440, 220, 0.28),
      lamp(704, 470, 2.4, c.p.fore, c.p.accent),
      person(520, 512, 1.15, c.p.near, 'kneel'),
      person(900, 512, 1.15, c.p.near, 'stand'),
      fg(c, 684, 14),
    ],
  },
  // 14: prophecy builds up the church; tongues without interpretation leave the hearer a stranger
  '1-korinthe-bijbelquiz-deel-14': {
    hue: 282,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'none', ground: 'flat', horizon: 512 }),
      person(760, 512, 1.3, c.p.fore, 'raise'),
      shafts(760, 90, 130, 150, c.p.glow, 3),
      crowd(c.rand, 1050, 514, 0.8, c.p.near, 4, 220),
      person(430, 512, 1.05, c.p.near, 'stand', { opacity: 0.75 }),
      cloudBank(c.rand, 430, 340, 0.7, c.p.light, { opacity: 0.3 }),
      fg(c, 684, 14),
    ],
  },
  // 15: Christ is risen - the empty tomb, and the many witnesses who saw Him
  '1-korinthe-bijbelquiz-deel-15': {
    hue: 284,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, sunR: 84, rays: true, far: 'ridge' }),
      tombMound(860, G, 1.05, c.p.near, c.p.light),
      roundStone(1090, G, 0.95, c.p.near),
      c.soft(860, 400, 160, 0.22),
      person(480, G + 8, 1.2, c.p.fore, 'raise'),
      crowd(c.rand, 620, G + 10, 0.85, c.p.near, 5, 260),
      fg(c, 674, 20),
    ],
  },
  // 16: the collection for the saints, gathered and sent on toward Jerusalem
  '1-korinthe-bijbelquiz-deel-16': {
    hue: 286,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, far: 'dunes', horizon: 476 }),
      citySkyline(c.rand, 1180, 476, 0.95, c.p.far, 6, { opacity: 0.75 }),
      trail(300, H, 900, 478, 150, c.p.mid, { opacity: 0.5 }),
      person(560, 482, 1.25, c.p.fore, 'walk'),
      person(700, 486, 1.2, c.p.fore, 'carry'),
      basket(800, 486, 1.05, c.p.near),
      coin(800, 448, 1.5, c.p.accent),
      coin(840, 434, 1.15, c.p.accent, { opacity: 0.85 }),
      fg(c, 674, 20),
    ],
  },
};
