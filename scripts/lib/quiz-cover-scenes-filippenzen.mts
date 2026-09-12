/**
 * Covers for the Filippenzen series, one scene per quiz part - each part
 * follows one chapter of the letter (deel 1 = Filippenzen 1, ... deel 4 =
 * Filippenzen 4).
 *
 * Base hue 45 (warm gold/amber, distinct from every other letter series so
 * far), drifting three degrees per part (part 4 lands on 54). Filippenzen is
 * Paul's letter of joy, so each scene reaches for the concrete image the
 * chapter itself uses - Paul in chains yet rejoicing, Christ emptying
 * himself even to death on a cross, the race toward the prize with the old
 * life left behind, the peace and contentment that pass understanding -
 * rather than an invented episode.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  basket,
  coin,
  crown,
  cross,
  forkedRoad,
  loaf,
  person,
  prisonBars,
  rays as raysPrim,
  shafts,
} from './quiz-cover-primitives.mjs';

export const FILIPPENZEN_SCENES: Record<string, Scene> = {
  // 1: for me to live is Christ - Paul in bonds, yet rejoicing that Christ is preached
  'filippenzen-bijbelquiz-deel-1': {
    hue: 45,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 246, far: 'ridge' }),
      prisonBars(824, G + 6, 1.1, c.p.near),
      person(824, G + 4, 1.05, c.p.fore, 'raise'),
      c.soft(824, 300, 220, 0.22),
      fg(c, 676, 20),
    ],
  },

  // 2: he emptied himself, took the form of a servant, and became obedient unto death, even the death of the cross
  'filippenzen-bijbelquiz-deel-2': {
    hue: 48,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1080, sunY: 220, sunR: 54, far: 'ridge', stars: 60, horizon: 512 }),
      cross(704, 512, 1.05, c.p.near),
      crown(704, 512, 0.85, c.p.accent, { opacity: 0.85 }),
      person(560, 512, 1.0, c.p.fore, 'bow'),
      fg(c, 686, 14),
    ],
  },

  // 3: forgetting what lies behind, pressing toward the mark for the prize of the high calling in Christ Jesus
  'filippenzen-bijbelquiz-deel-3': {
    hue: 51,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 230, sunR: 78, rays: true, far: 'dunes', horizon: 476 }),
      forkedRoad(704, 476, c.p.near),
      person(704, 484, 1.3, c.p.fore, 'walk'),
      raysPrim(c.rand, 1040, 320, 90, c.p.glow, 8, { opacity: 0.16 }),
      crown(1040, 320, 0.7, c.p.light, { opacity: 0.9 }),
      fg(c, 674, 20),
    ],
  },

  // 4: the peace of God which passes all understanding - content in whatsoever state, whether abased or abounding
  'filippenzen-bijbelquiz-deel-4': {
    hue: 54,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 236, far: 'none', ground: 'flat', horizon: 512 }),
      person(704, 512, 1.3, c.p.fore, 'sit'),
      c.soft(704, 380, 240, 0.26),
      loaf(600, 512, 0.75, c.p.accent),
      basket(824, 512, 0.75, c.p.accent, { opacity: 0.85 }),
      coin(896, 512, 0.6, c.p.light, { opacity: 0.75 }),
      shafts(704, 90, 200, 190, c.p.glow, 3),
      fg(c, 686, 14),
    ],
  },
};
