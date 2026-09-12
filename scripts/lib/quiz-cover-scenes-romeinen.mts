/**
 * Covers for the Romeinen series, one scene per quiz part - each part is one
 * chapter of the letter (deel 1 = Romans 1, ... deel 16 = Romans 16).
 *
 * Base hue 210 (blue/violet, distinct from the Johannes/Lucas/Matteus warm
 * hues), drifting two degrees per part (part 16 lands on 240). Romans is a
 * letter, not a narrative, so each scene is the concrete image the chapter
 * itself reaches for - the potter and the clay, the root and the branches,
 * the living sacrifice, the sword of the magistrate, Phoebe's letter to
 * Rome - rather than an invented episode.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  boat,
  chainLinks,
  cityWall,
  citySkyline,
  columns,
  crowd,
  ellipse,
  gateArch,
  goblet,
  loaf,
  path,
  person,
  rect,
  sandal,
  scroll,
  shafts,
  shrub,
  tablets,
  tent,
  throne,
  tree,
} from './quiz-cover-primitives.mjs';

/** A potter's wheel with a half-formed vessel on it - Romans 9, the potter and the clay. */
function potterWheel(x: number, y: number, s: number, wheelFill: string, clayFill: string): string {
  return (
    ellipse(x, y, 62 * s, 16 * s, wheelFill) +
    rect(x - 34 * s, y - 20 * s, 68 * s, 20 * s, wheelFill) +
    ellipse(x, y - 20 * s, 34 * s, 10 * s, wheelFill, { opacity: 0.85 }) +
    path(
      `M ${x - 24 * s} ${y - 24 * s} Q ${x - 32 * s} ${y - 78 * s} ${x} ${y - 96 * s}` +
        ` Q ${x + 32 * s} ${y - 78 * s} ${x + 24 * s} ${y - 24 * s} Z`,
      clayFill,
    ) +
    ellipse(x, y - 24 * s, 24 * s, 6 * s, clayFill, { opacity: 0.7 })
  );
}

/** A simple raised stone altar block - Romans 12, the living sacrifice. */
function altar(x: number, y: number, s: number, fill: string): string {
  return (
    path(`M ${x - 66 * s} ${y} L ${x - 50 * s} ${y - 44 * s} L ${x + 50 * s} ${y - 44 * s} L ${x + 66 * s} ${y} Z`, fill) +
    rect(x - 58 * s, y - 54 * s, 116 * s, 12 * s, fill)
  );
}

/** An upright sword, point up - Romans 13, the authority that bears it. */
function sword(x: number, y: number, s: number, fill: string): string {
  return (
    path(`M ${x} ${y - 128 * s} L ${x + 10 * s} ${y - 52 * s} L ${x - 10 * s} ${y - 52 * s} Z`, fill) +
    rect(x - 5 * s, y - 52 * s, 10 * s, 24 * s, fill) +
    rect(x - 28 * s, y - 34 * s, 56 * s, 10 * s, fill) +
    rect(x - 6 * s, y - 24 * s, 12 * s, 24 * s, fill) +
    ellipse(x, y, 12 * s, 6 * s, fill)
  );
}

/** A tree with its roots showing at the base - Romans 11, the root and the branches. */
function rootedTree(x: number, y: number, s: number, fill: string): string {
  return (
    path(
      `M ${x - 6 * s} ${y} L ${x - 40 * s} ${y + 26 * s} M ${x} ${y} L ${x - 8 * s} ${y + 32 * s}` +
        ` M ${x + 6 * s} ${y} L ${x + 38 * s} ${y + 24 * s}`,
      'none',
    ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${6 * s}" stroke-linecap="round"`) +
    tree(x, y, s, fill)
  );
}

export const ROMEINEN_SCENES: Record<string, Scene> = {
  // 1: Paul, servant of Christ and called apostle, sets apart the gospel he writes to Rome
  'romeinen-bijbelquiz-deel-1': {
    hue: 210,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 234, sunR: 80, rays: true, far: 'none', ground: 'flat', horizon: 476 }),
      citySkyline(c.rand, 1120, 476, 0.85, c.p.far, 6, { opacity: 0.55 }),
      person(560, 484, 1.35, c.p.fore, 'raise'),
      scroll(760, 484, 0.65, c.p.accent),
      fg(c, 676, 20),
    ],
  },

  // 2: the one who judges another condemns himself - he does the same things
  'romeinen-bijbelquiz-deel-2': {
    hue: 212,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 238, far: 'none', ground: 'flat', horizon: 512 }),
      columns(280, 512, 1.0, c.p.near, 3),
      columns(1150, 512, 1.0, c.p.near, 3),
      person(620, 512, 1.3, c.p.fore, 'point'),
      person(820, 512, 1.15, c.p.fore, 'bow'),
      crowd(c.rand, 1000, 514, 0.7, c.p.near, 3, 140),
      fg(c, 686, 14),
    ],
  },

  // 3: none is righteous - but redemption through faith in Christ's blood, the Jews' great trust: God's own words
  'romeinen-bijbelquiz-deel-3': {
    hue: 214,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 240, clouds: 4, far: 'none', ground: 'flat', horizon: 514 }),
      tablets(704, 514, 0.85, c.p.accent),
      crowd(c.rand, 400, 516, 0.85, c.p.near, 4, 220),
      crowd(c.rand, 1010, 516, 0.85, c.p.near, 4, 220),
      person(560, 516, 1.05, c.p.fore, 'bow'),
      person(850, 516, 1.05, c.p.fore, 'bow'),
      fg(c, 686, 14),
    ],
  },

  // 4: Abraham believed God, counting the stars he was promised, before the law or circumcision
  'romeinen-bijbelquiz-deel-4': {
    hue: 216,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1080, sunY: 220, sunR: 56, far: 'ridge', stars: 90, ground: 'flat', horizon: 512 }),
      person(640, 512, 1.35, c.p.fore, 'raise'),
      tent(1160, 512, 1.0, c.p.near, { opacity: 0.6 }),
      fg(c, 686, 14),
    ],
  },

  // 5: justified by faith, we have peace with God through Jesus Christ
  'romeinen-bijbelquiz-deel-5': {
    hue: 218,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 234, sunR: 82, rays: true, far: 'ridge' }),
      person(704, G + 4, 1.4, c.p.fore, 'raise'),
      shafts(704, 90, 260, 220, c.p.glow, 4),
      fg(c, 676, 20),
    ],
  },

  // 6: baptized into his death and buried with him, so we may walk in newness of life
  'romeinen-bijbelquiz-deel-6': {
    hue: 220,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 236, rays: true, far: 'none', ground: 'water', horizon: 480 }),
      person(560, 488, 1.15, c.p.fore, 'kneel'),
      person(720, 486, 1.35, c.p.fore, 'raise'),
      c.soft(720, 400, 160, 0.22),
      fg(c, 690, 12),
    ],
  },

  // 7: bound to the law as long as we live, at war within, wretched and longing for deliverance
  'romeinen-bijbelquiz-deel-7': {
    hue: 222,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, far: 'ridge' }),
      person(600, G + 6, 1.3, c.p.fore, 'raise'),
      chainLinks(556, G - 4, 0.9, c.p.near),
      fg(c, 676, 20),
    ],
  },

  // 8: no condemnation in Christ Jesus, led by the Spirit, more than conquerors
  'romeinen-bijbelquiz-deel-8': {
    hue: 224,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 214, sunR: 100, rays: true, clouds: 2, far: 'ridge' }),
      shafts(704, 70, 340, 300, c.p.glow, 5),
      person(704, G + 6, 1.45, c.p.fore, 'raise'),
      fg(c, 676, 20),
    ],
  },

  // 9: the potter has the right over the clay - Paul's grief for Israel, and the sovereignty of the potter
  'romeinen-bijbelquiz-deel-9': {
    hue: 226,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 244, far: 'none', ground: 'flat', horizon: 512 }),
      person(660, 512, 1.3, c.p.fore, 'kneel'),
      potterWheel(800, 512, 1.35, c.p.near, c.p.accent),
      person(420, 512, 1.1, c.p.near, 'bow', { opacity: 0.85 }),
      fg(c, 686, 14),
    ],
  },

  // 10: faith comes by hearing, and how beautiful are the feet of those who bring good news
  'romeinen-bijbelquiz-deel-10': {
    hue: 228,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 238, far: 'ridge' }),
      person(560, G + 8, 1.35, c.p.fore, 'raise'),
      sandal(700, G + 38, 1.7, c.p.accent),
      sandal(790, G + 44, 1.4, c.p.accent, { opacity: 0.85 }),
      crowd(c.rand, 1000, G + 10, 0.8, c.p.near, 4, 200),
      fg(c, 676, 20),
    ],
  },

  // 11: if the root is holy, so are the branches - the wild olive grafted onto the natural tree
  'romeinen-bijbelquiz-deel-11': {
    hue: 230,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 244, far: 'dunes', horizon: 476 }),
      rootedTree(704, 484, 2.1, c.p.near),
      person(500, 486, 1.1, c.p.fore, 'kneel'),
      person(920, 486, 1.05, c.p.near, 'point'),
      fg(c, 674, 20),
    ],
  },

  // 12: present your bodies a living sacrifice, holy and acceptable - transformed, not conformed
  'romeinen-bijbelquiz-deel-12': {
    hue: 232,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 226, sunR: 90, rays: true, far: 'none', ground: 'flat', horizon: 514 }),
      altar(704, 514, 1.1, c.p.near),
      person(704, 470, 1.05, c.p.fore, 'raise'),
      shafts(704, 90, 230, 190, c.p.glow, 4),
      fg(c, 686, 14),
    ],
  },

  // 13: authorities are instituted by God and bear the sword - the night is far spent, the day is at hand
  'romeinen-bijbelquiz-deel-13': {
    hue: 234,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1100, sunY: 232, sunR: 76, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      throne(340, 512, 0.95, c.p.near),
      person(860, 512, 1.2, c.p.fore, 'stand'),
      sword(930, 512, 1.7, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 14: accept the one weak in faith, without quarreling over disputable matters
  'romeinen-bijbelquiz-deel-14': {
    hue: 236,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      rect(600, 486, 220, 26, c.p.near, { rx: 4 }),
      loaf(650, 486, 0.9, c.p.accent),
      goblet(760, 486, 0.85, c.p.accent),
      person(560, 512, 1.25, c.p.fore, 'sit'),
      person(880, 512, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 15: the strong ought to bear the weaknesses of the weak, not just please themselves
  'romeinen-bijbelquiz-deel-15': {
    hue: 238,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 248, far: 'ridge' }),
      person(660, G + 6, 1.35, c.p.fore, 'carry'),
      person(720, G + 16, 1.0, c.p.near, 'sit', { opacity: 0.9 }),
      shrub(1140, G + 4, 1.0, c.p.near),
      fg(c, 676, 20),
    ],
  },

  // 16: Phoebe, commended to the church, carries Paul's letter from Corinth's port to Rome
  'romeinen-bijbelquiz-deel-16': {
    hue: 240,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 236, rays: true, far: 'none', ground: 'water', horizon: 480 }),
      boat(920, 470, 1.15, c.p.near, true),
      person(560, 488, 1.3, c.p.fore, 'walk'),
      scroll(640, 488, 0.55, c.p.accent),
      gateArch(1220, 480, 0.8, c.p.far, { opacity: 0.75 }),
      cityWall(1300, 480, 0.6, c.p.far, 180, { opacity: 0.6 }),
      crowd(c.rand, 380, 488, 0.75, c.p.near, 3, 150),
      fg(c, 690, 12),
    ],
  },
};
