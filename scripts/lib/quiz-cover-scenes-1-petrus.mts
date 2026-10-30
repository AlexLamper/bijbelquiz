/**
 * Covers for the 1 Petrus series, one scene per quiz. Each quiz covers one
 * chapter: `1-petrus-bijbelquiz-deel-<n>` is chapter n (1-5).
 *
 * Base hue 220, drifting two degrees per chapter (chapter 5 lands on 228).
 * See `quiz-cover-scene-kit.mts` for the house style.
 *
 * Chapters: de beproeving van het geloof, kostelijker dan goud dat door vuur
 * beproefd wordt (1); levende stenen op de uitverkoren, kostelijke hoeksteen
 * (2); acht zielen behouden door het water - de ark als beeld van de doop (3);
 * "zijt nuchter en waakt in de gebeden" (4); weidt de kudde Gods, de duivel
 * gaat om als een briesende leeuw (5).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { brickWall, dove, houseBlock, person, rect, reeds, swell } from './quiz-cover-primitives.mjs';
import { ark, at, mix } from './cover-options/shapes.mjs';
import { crook, fig, furnace, lamb, oilLamp, prowlingLion, wallTone } from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

export const PETRUS1_SCENES: Record<string, Scene> = {
  // 1: "the trial of your faith, much more precious than of gold that perisheth, though it be tried with fire"
  '1-petrus-bijbelquiz-deel-1': {
    hue: 220,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1130, sunY: 240, far: 'ridge', ground: 'flat', horizon: 500 }),
      c.soft(730, 300, 120, 0.6, c.p.accent),
      furnace(730, 520, 1.55, wallTone(c, 0.42), c.p.accentDeep, c.p.near, c.p.accent),
      fig(460, 524, 1.4, c.p.fore, 'reach'),
      fg(c, 686, 14),
    ],
  },

  // 2: "ye also, as lively stones, are built up a spiritual house" - on the chief corner stone, elect and precious
  '1-petrus-bijbelquiz-deel-2': {
    hue: 222,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      brickWall(c.rand, 570, 516, 2.3, wallTone(c, 0.4), 5, 6),
      rect(500, 446, 70, 70, c.p.accent, { rx: 3 }),
      fig(360, 522, 1.3, c.p.fore, 'reach'),
      person(1110, 520, 1.25, c.p.fore, 'carry'),
      rect(1080, 326, 60, 32, wallTone(c, 0.48), { rx: 3 }),
      fg(c, 686, 14),
    ],
  },

  // 3: in the days of Noah, while the ark was a preparing, eight souls were saved by water - the like figure whereunto even baptism doth also now save us
  '1-petrus-bijbelquiz-deel-3': {
    hue: 224,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 300, sunR: 64, far: 'none', ground: 'water', horizon: 478 }),
      at(620, 516, 1.45, ark(c.p.accent, mix(c.p.accent, c.p.fore, 0.28))),
      swell(c.rand, 528, c.p.far),
      dove(930, 300, 1.15, c.p.light),
    ],
  },

  // 4: "the end of all things is at hand: be ye therefore sober, and watch unto prayer"
  '1-petrus-bijbelquiz-deel-4': {
    hue: 226,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1170, sunY: 210, sunR: 44, far: 'ridge', ground: 'flat', horizon: 500 }),
      houseBlock(c.rand, 1060, 500, 0.95, c.p.near, { opacity: 0.8 }),
      person(320, 520, 1.25, c.p.near, 'stand'),
      c.soft(730, 470, 150, 0.55),
      fig(570, 526, 1.45, c.p.fore, 'kneel'),
      oilLamp(730, 526, 1.15, c.p.near, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 5: "feed the flock of God" - "your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour"
  '1-petrus-bijbelquiz-deel-5': {
    hue: 228,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 260, far: 'ridge', horizon: 480 }),
      reeds(c.rand, 1210, 512, 1.15, c.p.near, 8),
      prowlingLion(1100, 508, 0.95, c.p.near),
      lamb(560, 516, 0.95, c.p.light, c.p.near),
      lamb(680, 524, 1.05, c.p.light, c.p.near),
      lamb(790, 512, 0.85, c.p.light, c.p.near, { flip: true }),
      lamb(870, 530, 0.95, c.p.light, c.p.near, { flip: true }),
      fig(400, 524, 1.4, c.p.fore, 'stand'),
      crook(462, 526, 0.92, c.p.accent),
      fg(c, 686, 14),
    ],
  },
};
