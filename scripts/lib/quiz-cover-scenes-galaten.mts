/**
 * Covers for the Galaten series - only five parts, one per chapter.
 *
 * Base hue 30 (warm amber, distinct from the cooler Romeinen / 1&2 Korinthe
 * hues), drifting a few degrees per part. See `quiz-cover-scene-kit.mts` for
 * the house style. Each scene is the one image its chapter turns on:
 * Paulus' roeping op de weg naar Damascus (1), de terechtwijzing van Petrus
 * in Antiochië (2), de wet als tuchtmeester die naar Christus toe leidt (3),
 * de Hagar-Sara allegorie van twee vrouwen en twee verbonden (4), en het
 * afgeworpen juk tegenover de vrucht van de Geest (5).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  chainLinks,
  columns,
  cross,
  crowd,
  gateArch,
  person,
  tablets,
  tent,
  tree,
  trail,
  vineRow,
  wheat,
} from './quiz-cover-primitives.mjs';

export const GALATEN_SCENES: Record<string, Scene> = {
  // 1: Paulus' roeping - struck down by light on the road, his companions reeling
  'galaten-bijbelquiz-deel-1': {
    hue: 30,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 660, sunY: 190, sunR: 92, rays: true, far: 'dunes', horizon: 480 }),
      c.soft(630, 300, 260, 0.4),
      trail(180, H, 1230, G, 140, c.p.mid, { opacity: 0.35 }),
      person(620, G + 16, 1.4, c.p.fore, 'fallen'),
      person(900, G + 6, 1.05, c.p.near, 'kneel', { opacity: 0.85 }),
      person(1010, G + 10, 0.95, c.p.near, 'raise', { opacity: 0.75 }),
      fg(c, 676, 20),
    ],
  },

  // 2: Paulus wederstaat Petrus in het openbaar te Antiochië
  'galaten-bijbelquiz-deel-2': {
    hue: 33,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 236, far: 'none', ground: 'flat', horizon: 512 }),
      columns(1220, 512, 0.9, c.p.near, 3),
      crowd(c.rand, 300, 514, 0.65, c.p.near, 3, 160),
      person(650, 514, 1.3, c.p.fore, 'point'),
      person(860, 514, 1.25, c.p.near, 'bow'),
      fg(c, 686, 14),
    ],
  },

  // 3: de wet als tuchtmeester - de gids met de tafelen leidt het kind naar de poort
  'galaten-bijbelquiz-deel-3': {
    hue: 36,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'dunes', horizon: 476 }),
      gateArch(1180, 476, 0.9, c.p.near),
      trail(260, H, 1180, 476, 120, c.p.mid, { opacity: 0.4 }),
      tablets(430, G - 44, 0.42, c.p.accent),
      person(500, G + 10, 1.3, c.p.fore, 'point'),
      person(660, G + 14, 0.85, c.p.near, 'walk'),
      fg(c, 674, 20),
    ],
  },

  // 4: Hagar en Sara - twee vrouwen, twee verbonden
  'galaten-bijbelquiz-deel-4': {
    hue: 39,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      tent(340, 512, 1.15, c.p.near),
      chainLinks(280, 460, 0.85, c.p.accentDeep, { opacity: 0.85 }),
      person(430, 512, 1.2, c.p.fore, 'sit'),
      columns(1080, 512, 1.0, c.p.near, 3),
      person(940, 512, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 5: de vrijheid in Christus - het juk afgeworpen, de vrucht van de Geest
  'galaten-bijbelquiz-deel-5': {
    hue: 42,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 236, rays: true, far: 'dunes', horizon: 474 }),
      vineRow(c.rand, 980, G + 10, 1.1, c.p.near, 5),
      tree(1180, G + 6, 1.2, c.p.near),
      person(520, G + 10, 1.35, c.p.fore, 'raise'),
      chainLinks(410, G - 4, 1.0, c.p.accentDeep, { opacity: 0.7 }),
      fg(c, 674, 20),
    ],
  },

  // 6: elkanders lasten dragen - wat de mens zaait, dat zal hij ook maaien; roemen alleen in het kruis
  'galaten-bijbelquiz-deel-6': {
    hue: 45,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 220, rays: true, far: 'dunes', horizon: 476 }),
      wheat(940, G + 6, 1.0, c.p.crop, 6),
      person(560, G + 14, 1.3, c.p.fore, 'carry'),
      cross(1160, G - 40, 1.0, c.p.near),
      fg(c, 674, 20),
    ],
  },
};
