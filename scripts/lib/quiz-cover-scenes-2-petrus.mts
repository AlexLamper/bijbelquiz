/**
 * Covers for the 2 Petrus series, one scene per quiz. Each quiz covers one
 * chapter: `2-petrus-bijbelquiz-deel-<n>` is chapter n (1-3).
 *
 * Base hue 240, drifting two degrees per chapter. See
 * `quiz-cover-scene-kit.mts` for the house style.
 *
 * Chapters: wij waren aanschouwers van Zijn majesteit op de heilige berg, tot
 * de morgenster opgaat in uw harten (1); valse leraars - Sodom en Gomorra tot
 * as, de rechtvaardige Lot verlost (2); spotters, "een dag is bij de Heere als
 * duizend jaar", nieuwe hemelen en een nieuwe aarde (3).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { citySkyline, fireBed, path, person, rays, smokeColumn } from './quiz-cover-primitives.mjs';
import { at, hourglass, mix, star4 } from './cover-options/shapes.mjs';
import { fig } from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

export const PETRUS2_SCENES: Record<string, Scene> = {
  // 1: "we were eyewitnesses of his majesty ... with him in the holy mount" - until the day star arise in your hearts
  '2-petrus-bijbelquiz-deel-1': {
    hue: 240,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 50, far: 'none', ground: 'flat', horizon: 500 }),
      c.soft(704, 290, 300, 0.75, '#FFFFFF'),
      rays(c.rand, 704, 290, 320, '#FFFFFF', 12, { opacity: 0.2 }),
      path('M 300 506 C 450 430 590 352 704 346 C 820 352 960 430 1110 506 Z', c.p.mid),
      person(704, 352, 0.88, c.p.light, 'stand'),
      fig(560, 526, 1.1, c.p.fore, 'fallen'),
      fig(716, 530, 1.2, c.p.fore, 'bowed'),
      fig(880, 526, 1.05, c.p.near, 'fallen', { flip: true }),
      c.soft(1130, 220, 90, 0.6),
      at(1130, 220, 1, star4(44, c.p.accent)),
      fg(c, 686, 14),
    ],
  },

  // 2: God turned the cities of Sodom and Gomorrha into ashes, and delivered just Lot
  '2-petrus-bijbelquiz-deel-2': {
    hue: 242,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'dunes', horizon: 480 }),
      smokeColumn(c.rand, 1000, 360, 1.6, c.p.mid),
      smokeColumn(c.rand, 1170, 380, 1.3, c.p.mid),
      citySkyline(c.rand, 1070, 488, 0.95, c.p.near, 6),
      fireBed(c.rand, 1070, 474, 1.05, c.p.accent, 9),
      person(800, 508, 1.02, c.p.light, 'stand'),
      fig(300, 522, 1.3, c.p.fore, 'walk', { flip: true }),
      fig(420, 518, 1.05, c.p.near, 'walk', { flip: true }),
      fig(510, 520, 1.0, c.p.near, 'walk', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 3: "one day is with the Lord as a thousand years" - the Lord is not slack concerning his promise; new heavens and a new earth
  '2-petrus-bijbelquiz-deel-3': {
    hue: 244,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 330, sunR: 66, rays: true, stars: 18, far: 'ridge', horizon: 480 }),
      at(530, 526, 1.2, hourglass(c.p.near, mix(c.p.light, c.a.mid, 0.25), c.p.accent)),
      person(860, 524, 1.3, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },
};
