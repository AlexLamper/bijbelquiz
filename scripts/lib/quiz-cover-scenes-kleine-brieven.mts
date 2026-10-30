/**
 * Covers for the three one-chapter letters at the end of the New Testament:
 * 2 Johannes, 3 Johannes and Judas (one quiz each, `<book>-bijbelquiz-deel-1`).
 *
 * Base hue 300, two degrees apart. See `quiz-cover-scene-kit.mts` for the
 * house style.
 *
 * Chapters: de ouderling schrijft aan de uitverkoren vrouw en haar kinderen,
 * wandelen in waarheid en liefde (2 Johannes); Gajus ontvangt de reizende
 * broeders gastvrij, Diotrefes niet (3 Johannes); strijden voor het geloof,
 * dwaalleraars als wolken zonder water, ontwortelde bomen, wilde golven en
 * dwaalsterren - "die u machtig is van struikelen te bewaren" (Judas).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { houseBlock, path, person, streaks, swell } from './quiz-cover-primitives.mjs';
import { fallingStar, fig, figWith, letterRoll, oilLamp, uprootedTree } from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

export const KLEINE_BRIEVEN_SCENES: Record<string, Scene> = {
  // 2 Johannes: "the elder unto the elect lady and her children, whom I love in the truth" - the letter brought to her house
  '2-johannes-bijbelquiz-deel-1': {
    hue: 300,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 240, far: 'dunes', horizon: 486 }),
      houseBlock(c.rand, 1010, 500, 1.3, c.p.near),
      path('M 960 500 L 960 444 A 22 22 0 0 1 1004 444 L 1004 500 Z', c.p.glow),
      person(860, 518, 1.25, c.p.fore, 'stand'),
      person(780, 520, 0.72, c.p.near, 'stand'),
      person(930, 522, 0.66, c.p.near, 'stand'),
      figWith(560, 520, 1.32, c.p.fore, 'reach', letterRoll(92, -104, 1.25, c.p.accent)),
      fg(c, 686, 14),
    ],
  },

  // 3 Johannes: Gajus does faithfully whatever he does for the brethren and for strangers - received into his house
  '3-johannes-bijbelquiz-deel-1': {
    hue: 302,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 330, sunR: 56, far: 'ridge', horizon: 486 }),
      houseBlock(c.rand, 400, 504, 1.35, c.p.near),
      c.soft(452, 470, 110, 0.55),
      path('M 430 504 L 430 440 A 24 24 0 0 1 478 440 L 478 504 Z', c.p.glow),
      figWith(600, 520, 1.3, c.p.fore, 'reach', oilLamp(84, -100, 0.7, c.p.near, c.p.accent)),
      fig(800, 520, 1.25, c.p.fore, 'staff', { flip: true }),
      fig(930, 522, 1.12, c.p.near, 'staff', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // Judas: "raging waves of the sea, wandering stars ... trees whose fruit withereth, twice dead, plucked up by the roots" - and Him that is able to keep you from falling
  'judas-bijbelquiz-deel-1': {
    hue: 304,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, stars: 14, far: 'none', ground: 'swell', horizon: 470 }),
      streaks(c.rand, 600, 120, 700, 300, c.p.light, 36, { opacity: 0.28 }),
      fallingStar(920, 200, 1.0, c.p.light),
      fallingStar(1130, 160, 0.8, c.p.light),
      fallingStar(760, 140, 0.7, c.p.light),
      uprootedTree(930, 512, 1.15, c.p.near),
      swell(c.rand, 530, c.p.far),
      path('M 120 800 L 120 540 C 160 480 240 450 340 446 C 440 450 500 490 540 560 L 540 800 Z', c.p.mid),
      figWith(330, 452, 1.25, c.p.fore, 'bless', oilLamp(72, -160, 0.72, c.p.near, c.p.accent)),
      c.soft(390, 260, 90, 0.45),
    ],
  },
};
