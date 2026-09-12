/**
 * Covers for the Titus series - only three parts, one per chapter.
 *
 * Base hue around 190-198, cyan - distinct from the blues/indigos used for
 * 1&2 Timotheus. See `quiz-cover-scene-kit.mts` for the house style.
 * Chapters: ambtsvereisten voor ouderlingen op Kreta, "Kretenzers zijn altijd
 * leugenaars" (1); gezond onderricht voor oud en jong, de genade Gods die
 * verschenen is aan alle mensen (2); gehoorzaam aan overheden, het bad der
 * wedergeboorte en vernieuwing door de Heilige Geest (3).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  boat,
  columns,
  crown,
  crowd,
  gateArch,
  goat,
  houseBlock,
  person,
  shafts,
  trail,
} from './quiz-cover-primitives.mjs';

export const TITUS_SCENES: Record<string, Scene> = {
  // 1: ambtsvereisten voor ouderlingen op Kreta; "Kretenzers zijn altijd leugenaars, kwade dieren, luie buiken"
  'titus-bijbelquiz-deel-1': {
    hue: 190,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, ground: 'water', far: 'none', horizon: 470 }),
      boat(1140, 470, 1.0, c.p.near, true, { opacity: 0.75 }),
      goat(320, G + 6, 0.85, c.p.near, { opacity: 0.6 }),
      person(680, G + 14, 1.05, c.p.near, 'sit', { opacity: 0.8 }),
      person(800, G + 12, 1.3, c.p.fore, 'stand'),
      fg(c, 674, 20),
    ],
  },
  // 2: gezond onderricht voor oud en jong; de genade Gods die verschenen is aan alle mensen tot zaligheid
  'titus-bijbelquiz-deel-2': {
    hue: 194,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 216, sunR: 82, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      person(500, 512, 0.9, c.p.near, 'sit', { opacity: 0.8 }),
      person(910, 512, 1.05, c.p.near, 'stand', { opacity: 0.75 }),
      c.soft(704, 300, 190, 0.28),
      person(704, 512, 1.35, c.p.fore, 'raise'),
      fg(c, 684, 14),
    ],
  },
  // 3: gehoorzaam aan overheden en machten; het bad der wedergeboorte en vernieuwing door de Heilige Geest
  'titus-bijbelquiz-deel-3': {
    hue: 198,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(1160, 512, 0.85, c.p.near, 2, { opacity: 0.7 }),
      crown(1160, 380, 0.5, c.p.accent, { opacity: 0.55 }),
      shafts(560, 210, 110, 200, c.p.glow, 4),
      person(560, 512, 1.35, c.p.fore, 'kneel'),
      fg(c, 684, 14),
    ],
  },
};
