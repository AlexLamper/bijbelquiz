/**
 * Covers for the 1 Timotheus series, one scene per chapter (each quiz part
 * follows the chapter of the same number).
 *
 * Base hue around 220-246, blue/indigo - distinct from Kolossenzen and from
 * the violets used for 1&2 Korinthe. See `quiz-cover-scene-kit.mts` for the
 * house style and `quiz-cover-scenes-galaten.mts` for the pattern this module
 * follows. Chapters: valse leraren en de wet tegenover genade, Paulus als de
 * eerste der zondaren (1); gebed voor alle mensen en overheden (2);
 * ambtsvereisten voor opziener en diaken (3); afval in latere tijden en
 * Timotheus als voorbeeld ondanks zijn jeugd (4); weduwen en ouderlingen eren
 * (5); rijkdom als wortel van alle kwaad en de goede strijd des geloofs (6).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  chainLinks,
  coin,
  columns,
  crown,
  crowd,
  flame,
  gateArch,
  houseBlock,
  person,
  scroll,
  trail,
} from './quiz-cover-primitives.mjs';

export const TIM1_SCENES: Record<string, Scene> = {
  // 1: valse leraren en de wet - Paulus, de eerste der zondaren, door genade aangesteld
  '1-timotheus-bijbelquiz-deel-1': {
    hue: 220,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      person(900, G + 10, 1.0, c.p.near, 'point', { opacity: 0.7 }),
      scroll(950, 365, 0.55, c.p.accentDeep),
      person(600, G + 14, 1.35, c.p.fore, 'kneel'),
      c.soft(600, 330, 180, 0.24),
      fg(c, 684, 14),
    ],
  },
  // 2: gebed voor alle mensen en voor overheden en allen die in hoogheid zijn
  '1-timotheus-bijbelquiz-deel-2': {
    hue: 224,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 220, sunR: 78, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      crown(1120, G - 30, 0.6, c.p.accent, { opacity: 0.6 }),
      crowd(c.rand, 620, G + 14, 0.9, c.p.near, 5, 300),
      person(704, G + 14, 1.25, c.p.fore, 'raise'),
      fg(c, 684, 14),
    ],
  },
  // 3: ambtsvereisten voor opziener en diaken - een huis goed bestierend
  '1-timotheus-bijbelquiz-deel-3': {
    hue: 228,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 940, 512, 1.05, c.p.near),
      person(700, 512, 1.3, c.p.fore, 'stand'),
      person(560, 512, 1.05, c.p.near, 'sit', { opacity: 0.8 }),
      fg(c, 684, 14),
    ],
  },
  // 4: afval in latere tijden voorzegd - Timotheus, voorbeeld voor de gelovigen ondanks zijn jeugd
  '1-timotheus-bijbelquiz-deel-4': {
    hue: 232,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, clouds: 3, far: 'none', ground: 'flat', horizon: 512 }),
      person(500, 512, 0.95, c.p.mid, 'walk', { opacity: 0.55 }),
      scroll(760, 420, 0.7, c.p.accent),
      person(760, 512, 1.35, c.p.fore, 'raise'),
      fg(c, 684, 14),
    ],
  },
  // 5: weduwen die weduwen zijn eren - de ouderlingen die wel arbeiden dubbele eer waardig
  '1-timotheus-bijbelquiz-deel-5': {
    hue: 236,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 244, far: 'ridge' }),
      person(420, G + 8, 1.05, c.p.near, 'sit', { opacity: 0.85 }),
      person(560, G + 10, 1.0, c.p.near, 'sit', { opacity: 0.75 }),
      person(880, G + 14, 1.35, c.p.fore, 'stand'),
      coin(880, G - 30, 1.4, c.p.accent),
      fg(c, 676, 20),
    ],
  },
  // 6: rijkdom als wortel van alle kwaad; de goede strijd des geloofs strijden
  '1-timotheus-bijbelquiz-deel-6': {
    hue: 240,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 240, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      chainLinks(420, G - 20, 1.1, c.p.accentDeep, { opacity: 0.65 }),
      coin(420, G - 60, 1.5, c.p.accent, { opacity: 0.65 }),
      person(900, G + 12, 1.35, c.p.fore, 'raise'),
      crown(900, G - 130, 0.6, c.p.accent),
      fg(c, 684, 14),
    ],
  },
};
