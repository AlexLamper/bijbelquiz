/**
 * Covers for the 1 Johannes series, one scene per quiz. Each quiz covers one
 * chapter: `1-johannes-bijbelquiz-deel-<n>` is chapter n (1-5).
 *
 * Base hue 280, drifting two degrees per chapter (chapter 5 lands on 288).
 * See `quiz-cover-scene-kit.mts` for the house style.
 *
 * Chapters: God is licht - wandelen in het licht en gemeenschap met elkaar
 * (1); hebt de wereld niet lief, want de wereld gaat voorbij (2); niet zoals
 * Kain, wiens werken boos waren - de offers van Kain en Abel (3); God is
 * liefde, de volmaakte liefde drijft de vreze uit (4); dit is de overwinning
 * die de wereld overwint: ons geloof (5).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { H, banner, citySkyline, ellipse, path, rect, smokeColumn, trail } from './quiz-cover-primitives.mjs';
import { at, heart } from './cover-options/shapes.mjs';
import { blaze, fig, figWith, lamb, oilLamp, stoneAltar, wallTone } from './quiz-cover-motifs-kron2-ezra-brieven.mjs';

/** A few houses with domed roofs; the domes in `dome`. */
function domedTown(x: number, y: number, s: number, wall: string, dome: string): string {
  const out: string[] = [];
  for (const [dx, w, h] of [
    [-150, 70, 110],
    [-60, 92, 160],
    [50, 74, 120],
    [140, 62, 146],
  ] as const) {
    const bx = x + dx * s;
    const bw = w * s;
    const bh = h * s;
    out.push(rect(bx - bw / 2, y - bh, bw, bh, wall));
    out.push(path(`M ${bx - bw / 2} ${y - bh} A ${bw / 2} ${bw * 0.48} 0 0 1 ${bx + bw / 2} ${y - bh} Z`, dome));
  }
  return out.join('');
}

export const JOHANNES1_SCENES: Record<string, Scene> = {
  // 1: "God is light, and in him is no darkness at all" - if we walk in the light, we have fellowship one with another
  '1-johannes-bijbelquiz-deel-1': {
    hue: 280,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1010, sunY: 300, sunR: 80, rays: true, far: 'ridge', horizon: 480 }),
      trail(560, H, 1010, 480, 150, '#FFFFFF', { opacity: 0.45 }),
      figWith(560, 540, 1.38, c.p.fore, 'reach', oilLamp(84, -100, 0.7, c.p.near, c.p.accent)),
      fig(730, 520, 1.15, c.p.near, 'walk'),
      fg(c, 686, 14),
    ],
  },

  // 2: "love not the world, neither the things that are in the world ... and the world passeth away"
  '1-johannes-bijbelquiz-deel-2': {
    hue: 282,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 250, clouds: 2, far: 'dunes', horizon: 486 }),
      domedTown(1000, 490, 1.15, wallTone(c, 0.3), c.p.accent),
      ellipse(1000, 452, 380, 60, '#FFFFFF', { opacity: 0.45 }),
      ellipse(1040, 500, 420, 34, '#FFFFFF', { opacity: 0.4 }),
      c.veil(1400, 760, '#FFFFFF', 0.28),
      fig(470, 526, 1.42, c.p.fore, 'walk', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 3: "not as Cain, who was of that wicked one" - Abel's offering accepted, Cain's turned away
  '1-johannes-bijbelquiz-deel-3': {
    hue: 284,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 250, far: 'ridge', horizon: 480 }),
      smokeColumn(c.rand, 470, 360, 1.0, c.p.mid),
      stoneAltar(470, 522, 0.88, wallTone(c, 0.45), c.p.light),
      blaze(470, 450, 0.85, c.p.accent, c.p.crop),
      lamb(320, 524, 0.9, c.p.light, c.p.near),
      fig(620, 528, 1.25, c.p.fore, 'kneelUp', { flip: true }),
      stoneAltar(910, 522, 0.8, wallTone(c, 0.45), c.p.light),
      ellipse(960, 444, 60, 14, c.p.mid, { opacity: 0.4 }),
      ellipse(1030, 452, 70, 13, c.p.mid, { opacity: 0.3 }),
      ellipse(1110, 466, 70, 12, c.p.mid, { opacity: 0.22 }),
      fig(1080, 524, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 4: "God is love" - "herein is love, not that we loved God, but that he loved us"; perfect love casteth out fear
  '1-johannes-bijbelquiz-deel-4': {
    hue: 286,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 290, rays: true, far: 'ridge', horizon: 480 }),
      c.soft(704, 280, 210, 0.6),
      at(704, 300, 1.25, heart(c.p.accent)),
      fig(560, 524, 1.32, c.p.fore, 'reach'),
      fig(700, 528, 1.18, c.p.near, 'kneelFwd', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 5: "this is the victory that overcometh the world, even our faith"
  '1-johannes-bijbelquiz-deel-5': {
    hue: 288,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, far: 'ridge', horizon: 480 }),
      citySkyline(c.rand, 340, 488, 0.6, c.p.far, 5, { opacity: 0.7 }),
      path('M 560 506 C 680 450 800 404 900 400 C 1000 404 1110 450 1230 506 Z', c.p.mid),
      fig(880, 406, 1.1, c.p.fore, 'raise'),
      banner(948, 408, 1.4, c.p.fore, c.p.accent),
      fg(c, 686, 14),
    ],
  },
};
