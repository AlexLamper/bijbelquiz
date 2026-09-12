/**
 * Covers for the 2 Thessalonicenzen series, one scene per quiz part.
 *
 * 2 Thessalonicenzen corrects a church unsettled about the day of the Lord:
 * vengeance in flaming fire at Christ's revealing, the man of sin who must
 * first be revealed once the restrainer is taken away, and the closing charge
 * that whoever will not work should not eat.
 *
 * Base hue 15 (orange/red, distinct from the other Pauline letters), drifting
 * a few degrees per part. See `quiz-cover-scenes-2-korinthe.mts` for the
 * house style this module follows.
 */

import { crowd, fireBed, person, rays, sheaf, tower } from './quiz-cover-primitives.mjs';
import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';

// ── scenes ──────────────────────────────────────────────────────────────────

export const THESS2_SCENES: Record<string, Scene> = {
  // 1: vengeance on the disobedient at the revealing of the Lord Jesus in flaming fire, glorified in his saints
  '2-thessalonicenzen-bijbelquiz-deel-1': {
    hue: 15,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 200, far: 'none', ground: 'flat', horizon: 500 }),
      rays(c.rand, 704, 220, 330, c.p.glow, 12, { opacity: 0.16 }),
      fireBed(c.rand, 704, 500, 1.1, c.p.accent),
      person(704, 486, 1.3, c.p.fore, 'raise'),
      crowd(c.rand, 500, G + 12, 0.85, c.p.near, 4, 220),
      fg(c, 684, 14),
    ],
  },
  // 2: the man of sin/lawlessness revealed only once the restrainer is taken out of the way, and the falling away first
  '2-thessalonicenzen-bijbelquiz-deel-2': {
    hue: 17,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'ridge', horizon: 480 }),
      tower(560, 486, 1.1, c.p.near, { opacity: 0.75 }),
      person(560, 486, 1.2, c.p.fore, 'stand'),
      person(760, 484, 1.1, c.p.fore, 'fallen'),
      fg(c, 680, 16),
    ],
  },
  // 3: withdraw from the disorderly, work quietly and eat your own bread - the one who will not work shall not eat
  '2-thessalonicenzen-bijbelquiz-deel-3': {
    hue: 19,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 240, far: 'dunes' }),
      sheaf(500, G + 10, 1.0, c.p.near),
      person(680, G + 6, 1.2, c.p.fore, 'carry'),
      person(900, G + 14, 1.05, c.p.near, 'sit', { opacity: 0.7 }),
      fg(c, 676, 18),
    ],
  },
};
