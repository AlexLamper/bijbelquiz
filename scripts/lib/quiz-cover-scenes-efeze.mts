/**
 * Covers for the Efeze series, one scene per quiz part - each part follows
 * one chapter of the letter (deel 1 = Efeze 1, ... deel 6 = Efeze 6).
 *
 * Base hue 168 (green/teal, distinct from the Johannes/Lucas/Matteus warm
 * hues and from Romeinen/Korinthe/Galaten's blue-violet family), drifting
 * two degrees per part (part 6 lands on 178). Efeze is a letter, so each
 * scene reaches for the concrete image the chapter itself uses - sealed
 * with the Spirit as a pledge, the dividing wall broken down, the mystery
 * revealed to Paul the prisoner, the gifts given to the body, walking as
 * children of light, the armour of God - rather than an invented episode.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  cityWall,
  crowd,
  dove,
  ellipse,
  gateArch,
  path,
  person,
  rect,
  ring,
  rotate,
  scroll,
  shafts,
  tri,
} from './quiz-cover-primitives.mjs';

/** A few tumbled stone fragments filling a breach - Efeze 2, the dividing wall broken down. */
function rubble(x: number, y: number, s: number, fill: string): string {
  return (
    rotate(-8, x - 30 * s, y - 12 * s, rect(x - 46 * s, y - 24 * s, 34 * s, 20 * s, fill)) +
    rotate(14, x + 4 * s, y - 6 * s, rect(x - 10 * s, y - 20 * s, 30 * s, 18 * s, fill)) +
    rotate(-16, x + 36 * s, y - 14 * s, rect(x + 20 * s, y - 26 * s, 28 * s, 18 * s, fill))
  );
}

/** A round shield held at the side - Efeze 6, the shield of faith. */
function shield(x: number, y: number, s: number, fill: string): string {
  return (
    path(
      `M ${x - 30 * s} ${y - 74 * s} L ${x + 30 * s} ${y - 74 * s} L ${x + 30 * s} ${y - 20 * s}` +
        ` Q ${x} ${y + 20 * s} ${x - 30 * s} ${y - 20 * s} Z`,
      fill,
    ) + ellipse(x, y - 46 * s, 10 * s, 22 * s, fill, { opacity: 0.55 })
  );
}

/** An upright sword, point up - Efeze 6, the sword of the Spirit. */
function swordUpright(x: number, y: number, s: number, fill: string): string {
  return (
    path(`M ${x} ${y - 128 * s} L ${x + 10 * s} ${y - 52 * s} L ${x - 10 * s} ${y - 52 * s} Z`, fill) +
    rect(x - 5 * s, y - 52 * s, 10 * s, 24 * s, fill) +
    rect(x - 28 * s, y - 34 * s, 56 * s, 10 * s, fill) +
    rect(x - 6 * s, y - 24 * s, 12 * s, 24 * s, fill) +
    ellipse(x, y, 12 * s, 6 * s, fill)
  );
}

/** A small flame-shaped light standing above a hand - one of the gifts given to the church. */
function giftFlame(x: number, y: number, s: number, fill: string): string {
  return tri(x - 8 * s, y, x, y - 26 * s, x + 8 * s, y, fill);
}

export const EFEZE_SCENES: Record<string, Scene> = {
  // 1: chosen before the foundation of the world, sealed with the Holy Spirit of promise, the pledge of our inheritance
  'efeze-bijbelquiz-deel-1': {
    hue: 168,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 232, sunR: 80, rays: true, far: 'none', ground: 'flat', horizon: 476 }),
      person(704, 484, 1.4, c.p.fore, 'raise'),
      dove(704, 320, 1.1, c.p.light),
      shafts(704, 100, 220, 200, c.p.glow, 4),
      ring(560, 480, 1.1, c.p.accent),
      fg(c, 676, 20),
    ],
  },

  // 2: the middle wall of partition broken down - Jew and Gentile made one new man, reconciled in one body
  'efeze-bijbelquiz-deel-2': {
    hue: 170,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 236, far: 'none', ground: 'flat', horizon: 512 }),
      cityWall(420, 512, 0.95, c.p.near, 260),
      cityWall(988, 512, 0.95, c.p.near, 260),
      rubble(704, 512, 1.1, c.p.near),
      gateArch(704, 512, 0.65, c.p.mid, { opacity: 0.55 }),
      person(600, 514, 1.15, c.p.fore, 'walk'),
      person(824, 514, 1.15, c.p.fore, 'point', { opacity: 0.95 }),
      fg(c, 686, 14),
    ],
  },

  // 3: the mystery made known to Paul by revelation - a prisoner of Christ Jesus for the Gentiles
  'efeze-bijbelquiz-deel-3': {
    hue: 172,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, far: 'ridge' }),
      person(620, G + 6, 1.25, c.p.fore, 'kneel'),
      scroll(760, G + 20, 0.6, c.p.accent),
      shafts(660, 100, 220, 250, c.p.glow, 4),
      crowd(c.rand, 1150, G + 12, 0.6, c.p.near, 3, 140),
      fg(c, 676, 20),
    ],
  },

  // 4: one body, one Spirit, one hope - Christ gave gifts to men, some apostles, some prophets, some pastors and teachers
  'efeze-bijbelquiz-deel-4': {
    hue: 174,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 212, sunR: 96, rays: true, far: 'none', ground: 'flat', horizon: 514 }),
      shafts(704, 70, 340, 260, c.p.glow, 5),
      crowd(c.rand, 704, 514, 0.85, c.p.near, 5, 420),
      person(704, 470, 1.05, c.p.fore, 'raise'),
      giftFlame(560, 300, 1.0, c.p.light),
      giftFlame(848, 292, 1.0, c.p.light),
      fg(c, 686, 14),
    ],
  },

  // 5: walk as children of light - the fruit of the light is in all goodness, righteousness and truth
  'efeze-bijbelquiz-deel-5': {
    hue: 176,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 230, sunR: 78, rays: true, far: 'ridge' }),
      person(560, G + 8, 1.35, c.p.fore, 'walk'),
      shafts(1000, 90, 260, 240, c.p.glow, 4),
      fg(c, 676, 20),
    ],
  },

  // 6: put on the whole armour of God, to stand against the wiles of the devil in the evil day
  'efeze-bijbelquiz-deel-6': {
    hue: 178,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, clouds: 3, far: 'ridge' }),
      person(704, G + 6, 1.35, c.p.fore, 'stand'),
      shield(608, G + 6, 1.15, c.p.near),
      swordUpright(824, G + 6, 1.5, c.p.accent),
      fg(c, 676, 20),
    ],
  },
};
