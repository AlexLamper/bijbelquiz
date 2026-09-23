/**
 * Covers for the Klaagliederen series that are not in the core table.
 * Chapters 1-4 (`klaagliederen-bijbelquiz-deel-1..4`) live in
 * `quiz-cover-scenes.mts`; chapter 5 was added later and lives here.
 * `klaagliederen-bijbelquiz-deel-<n>` is chapter n.
 *
 * Hue continues the warm end of the core set (chapter 4 is 44). See
 * `quiz-cover-scene-kit.mts` for the house style.
 *
 * Chapter 5: het slotgebed "Gedenk, HEERE, wat ons geschied is"; de kroon
 * onzes hoofds is afgevallen, om den berg Sions die verwoest is lopen de
 * vossen, maar "Gij, HEERE, blijft in eeuwigheid; Uw troon is van geslacht
 * tot geslacht", en "Bekeer ons, HEERE, tot U".
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  brickWall,
  circle,
  crown,
  ellipse,
  person,
  rotate,
  shafts,
  throne,
  tri,
} from './quiz-cover-primitives.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A round-capped stroke. */
function line(x1: number, y1: number, x2: number, y2: number, w: number, fill: string): string {
  return `<path d="M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round"/>`;
}

/** A fox trotting to the left, brush out behind. `y` is the ground. */
function fox(x: number, y: number, s: number, fill: string): string {
  const by = y - 22 * s;
  return [
    ellipse(x, by, 28 * s, 10 * s, fill),
    circle(x - 32 * s, by - 8 * s, 9 * s, fill),
    tri(x - 38 * s, by - 11 * s, x - 56 * s, by - 4 * s, x - 36 * s, by - 1 * s, fill),
    tri(x - 39 * s, by - 13 * s, x - 37 * s, by - 29 * s, x - 30 * s, by - 15 * s, fill),
    tri(x - 31 * s, by - 15 * s, x - 26 * s, by - 29 * s, x - 23 * s, by - 12 * s, fill),
    line(x - 18 * s, by + 5 * s, x - 24 * s, y, 3.4 * s, fill),
    line(x - 10 * s, by + 6 * s, x - 5 * s, y, 3.4 * s, fill),
    line(x + 14 * s, by + 6 * s, x + 9 * s, y, 3.4 * s, fill),
    line(x + 20 * s, by + 5 * s, x + 27 * s, y, 3.4 * s, fill),
    rotate(-16, x + 26 * s, by, ellipse(x + 50 * s, by, 26 * s, 8 * s, fill)),
  ].join('');
}

export const KLAAGLIEDEREN_SCENES: Record<string, Scene> = {
  // 5: "Gij, HEERE, blijft in eeuwigheid; Uw troon is van geslacht tot geslacht" - the throne above ruined Zion, foxes on the mountain, the fallen crown, the closing prayer
  'klaagliederen-bijbelquiz-deel-5': {
    hue: 48,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 190, sunR: 96, far: 'ridge', horizon: 480 }),
      shafts(704, 120, 380, 360, c.p.glow, 5),
      throne(704, 290, 0.8, c.p.light, { opacity: 0.55 }),
      brickWall(c.rand, 280, 500, 1.0, c.p.near, 3, 4),
      brickWall(c.rand, 470, 496, 1.0, c.p.near, 2, 2),
      fox(430, 504, 1.0, c.p.fore),
      rotate(-24, 590, 540, crown(590, 540, 0.5, c.p.accentDeep)),
      person(900, G + 60, 1.2, c.p.fore, 'kneel'),
      person(1010, G + 62, 1.1, c.p.fore, 'kneel'),
      person(1110, G + 58, 1.15, c.p.fore, 'raise'),
      fg(c, 686, 14),
    ],
  },
};
