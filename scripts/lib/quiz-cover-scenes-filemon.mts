/**
 * Cover for Filemon - a single-part quiz, so a single hue is enough (no
 * series drift needed). Base hue 30, warm amber, matching the palette family
 * used for the other short Pauline letters (Galaten). See
 * `quiz-cover-scene-kit.mts` for the house style.
 *
 * The scene: Paulus, bound in de gevangenis, pleit voor de weggelopen slaaf
 * Onesimus - de brief die naar Filemon gaat wordt hem meegegeven.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { chainLinks, person, prisonBars, scroll } from './quiz-cover-primitives.mjs';

export const FILEMON_SCENES: Record<string, Scene> = {
  // 1: Paulus, gebonden in de gevangenis, pleit voor de weggelopen slaaf Onesimus en zendt hem de brief mee
  'filemon-bijbelquiz-deel-1': {
    hue: 30,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      prisonBars(500, 512, 1.3, c.p.near),
      chainLinks(500, 462, 1.0, c.p.fore, { opacity: 0.9 }),
      person(500, 512, 1.15, c.p.fore, 'sit'),
      person(900, 512, 1.3, c.p.near, 'walk', { opacity: 0.85 }),
      scroll(970, 448, 0.55, c.p.light),
      fg(c, 684, 14),
    ],
  },
};
