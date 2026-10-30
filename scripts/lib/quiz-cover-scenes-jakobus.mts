/**
 * Covers for the Jakobus series, one scene per quiz. Each quiz covers one
 * chapter: `jakobus-bijbelquiz-deel-<n>` is chapter n (1-5).
 *
 * Base hue 260, drifting two degrees per chapter (chapter 5 lands on 268).
 * See `quiz-cover-scene-kit.mts` for the house style.
 *
 * Chapters: de twijfelaar is als een golf der zee, de kroon des levens voor
 * wie de verzoeking verdraagt (1); geloof zonder werken is dood - brood voor
 * de broeder die naakt is en gebrek heeft (2); de tong is een vuur, een klein
 * vuur steekt een groot bos aan (3); "heden of morgen zullen wij naar die stad
 * reizen" - uw leven is een damp (4); de landman wacht geduldig op de vroege
 * en de spade regen (5).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  boat,
  citySkyline,
  cloudBank,
  crown,
  ellipse,
  fireBed,
  flame,
  houseBlock,
  loaf,
  person,
  rotate,
  shafts,
  smokeColumn,
  streaks,
  swell,
  trail,
  tree,
  wheat,
} from './quiz-cover-primitives.mjs';
import { fig, figWith, moneyBag } from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

export const JAKOBUS_SCENES: Record<string, Scene> = {
  // 1: "he that wavereth is like a wave of the sea driven with the wind and tossed" - and the crown of life for him who endures
  'jakobus-bijbelquiz-deel-1': {
    hue: 260,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 960, sunY: 200, clouds: 3, far: 'none', ground: 'swell', horizon: 470 }),
      streaks(c.rand, 120, 140, 700, 300, c.p.light, 40, { opacity: 0.3 }),
      shafts(960, 100, 220, 260, '#FFFFFF', 4),
      c.soft(960, 290, 170, 0.55),
      crown(960, 330, 0.95, c.p.accent),
      rotate(-18, 500, 500, boat(500, 500, 1.4, c.p.near, true)),
      swell(c.rand, 522, c.p.far),
    ],
  },

  // 2: faith without works is dead - "if a brother or sister be naked and destitute of daily food, and ye give them not..."
  'jakobus-bijbelquiz-deel-2': {
    hue: 262,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'ridge', horizon: 480 }),
      houseBlock(c.rand, 1110, 488, 0.95, c.p.near, { opacity: 0.75 }),
      fig(500, 522, 1.38, c.p.fore, 'reach'),
      loaf(602, 450, 1.35, c.p.accent),
      fig(750, 530, 1.25, c.p.fore, 'sit'),
      fg(c, 686, 14),
    ],
  },

  // 3: "the tongue is a fire" - behold, how great a forest a little fire kindles
  'jakobus-bijbelquiz-deel-3': {
    hue: 264,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 240, sunY: 290, far: 'ridge', horizon: 476 }),
      smokeColumn(c.rand, 1060, 360, 1.5, c.p.mid),
      tree(700, 490, 0.95, c.p.near),
      tree(820, 480, 1.1, c.p.near),
      tree(950, 488, 1.2, c.p.near),
      tree(1080, 478, 1.05, c.p.near),
      tree(1210, 486, 1.15, c.p.near),
      fireBed(c.rand, 1060, 492, 1.15, c.p.accent, 9),
      flame(580, 524, 0.4, c.p.accent),
      person(340, 524, 1.35, c.p.fore, 'point'),
      fg(c, 686, 14),
    ],
  },

  // 4: "go to now, ye that say, today or tomorrow we will go into such a city ... what is your life? It is even a vapour"
  'jakobus-bijbelquiz-deel-4': {
    hue: 266,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 270, far: 'ridge', horizon: 480 }),
      citySkyline(c.rand, 1050, 480, 0.85, c.p.far, 6, { opacity: 0.75 }),
      ellipse(940, 456, 560, 34, '#FFFFFF', { opacity: 0.55 }),
      trail(560, H, 1000, 480, 110, '#FFFFFF', { opacity: 0.3 }),
      figWith(540, 524, 1.4, c.p.fore, 'reach', moneyBag(86, -92, 0.95, c.p.accent)),
      ellipse(600, 506, 460, 34, '#FFFFFF', { opacity: 0.4 }),
      ellipse(820, 540, 520, 26, '#FFFFFF', { opacity: 0.3 }),
      fg(c, 686, 14),
    ],
  },

  // 5: "the husbandman waiteth for the precious fruit of the earth, and hath long patience for it, until he receive the early and latter rain"
  'jakobus-bijbelquiz-deel-5': {
    hue: 268,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 280, sunY: 240, far: 'dunes', ground: 'flat', horizon: 492 }),
      cloudBank(c.rand, 1060, 220, 1.5, c.p.near, { opacity: 0.45 }),
      cloudBank(c.rand, 900, 254, 1.1, c.p.near, { opacity: 0.35 }),
      streaks(c.rand, 860, 250, 430, 250, c.p.near, 42, { opacity: 0.3 }),
      wheat(660, 524, 0.6, c.p.accent, 5),
      wheat(790, 526, 0.64, c.p.accent, 5),
      wheat(920, 524, 0.6, c.p.accent, 5),
      wheat(1050, 528, 0.64, c.p.accent, 5),
      wheat(1180, 524, 0.58, c.p.accent, 5),
      fig(440, 524, 1.4, c.p.fore, 'staff'),
      fg(c, 686, 14),
    ],
  },
};
