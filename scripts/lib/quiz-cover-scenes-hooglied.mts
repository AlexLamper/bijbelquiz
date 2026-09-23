/**
 * Covers for the Hooglied series, one scene per quiz. Each quiz covers one
 * chapter: `hooglied-bijbelquiz-deel-<n>` is chapter n (1-8).
 *
 * Base hue 338, the rose of the older `hooglied` covers, drifting two degrees
 * per chapter (chapter 8 lands on 352). See `quiz-cover-scene-kit.mts` for the
 * house style. The older `hooglied`, `hooglied-deel-1` and `hooglied-deel-2`
 * covers stay in the core table; their vineyard and walled garden come back
 * here in chapters 1 and 4.
 *
 * Chapters: de tenten van Kedar en de kudde bij de herderstenten (1); de
 * Liefste springt als een ree over de bergen, de winter is voorbij (2); 's
 * nachts zoeken in de stad, de wachters vinden haar (3); de besloten hof en
 * de verzegelde springader (4); de Liefste klopt 's nachts, zij opent te laat
 * (5); schoon als de maan, zuiver als de zon, schrikkelijk als slagorden met
 * banieren (6); gestalte als een palmboom, vroeg op naar de wijnbergen (7);
 * de liefde is sterk als de dood, vele wateren kunnen haar niet uitblussen (8).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  circle,
  citySkyline,
  cityWall,
  crescent,
  dove,
  ellipse,
  fireBed,
  flame,
  goat,
  grapes,
  houseBlock,
  palm,
  path,
  person,
  rect,
  rotate,
  streaks,
  swell,
  tent,
  tower,
  trail,
  tree,
  tri,
  vineRow,
  well,
  window as windowFrame,
} from './quiz-cover-primitives.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A round-capped stroke - legs, antlers, stems. */
function line(x1: number, y1: number, x2: number, y2: number, w: number, fill: string): string {
  return `<path d="M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round"/>`;
}

/** A hart in mid-leap, head to the left - "springende op de bergen". `y` is the ground under the leap. */
function deer(x: number, y: number, s: number, fill: string): string {
  const by = y - 58 * s;
  const g = [
    ellipse(x, by, 36 * s, 12 * s, fill),
    line(x - 26 * s, by - 4 * s, x - 44 * s, by - 30 * s, 9 * s, fill),
    ellipse(x - 50 * s, by - 34 * s, 12 * s, 7 * s, fill),
    tri(x - 42 * s, by - 38 * s, x - 36 * s, by - 50 * s, x - 34 * s, by - 38 * s, fill),
    line(x - 48 * s, by - 40 * s, x - 42 * s, by - 68 * s, 2.6 * s, fill),
    line(x - 45 * s, by - 55 * s, x - 32 * s, by - 62 * s, 2.4 * s, fill),
    line(x - 52 * s, by - 40 * s, x - 60 * s, by - 66 * s, 2.6 * s, fill),
    line(x - 57 * s, by - 55 * s, x - 70 * s, by - 58 * s, 2.4 * s, fill),
    ellipse(x + 36 * s, by - 8 * s, 6 * s, 4 * s, fill),
    line(x - 24 * s, by + 5 * s, x - 60 * s, by + 16 * s, 4 * s, fill),
    line(x - 20 * s, by + 7 * s, x - 52 * s, by + 26 * s, 4 * s, fill),
    line(x + 24 * s, by + 5 * s, x + 64 * s, by + 20 * s, 4 * s, fill),
    line(x + 20 * s, by + 7 * s, x + 56 * s, by + 30 * s, 4 * s, fill),
  ].join('');
  return rotate(10, x, by, g);
}

/** A lily of the valleys: stem, one leaf, a three-petalled cup. */
function lily(x: number, y: number, s: number, stem: string, bloom: string): string {
  const t = y - 40 * s;
  return (
    line(x, y, x, t, 2.6 * s, stem) +
    path(`M ${r1(x)} ${r1(y - 12 * s)} q ${r1(14 * s)} ${r1(-4 * s)} ${r1(18 * s)} ${r1(-20 * s)} q ${r1(-14 * s)} ${r1(4 * s)} ${r1(-18 * s)} ${r1(20 * s)} Z`, stem) +
    path(
      `M ${r1(x - 12 * s)} ${r1(t)} Q ${r1(x - 15 * s)} ${r1(t - 18 * s)} ${r1(x - 9 * s)} ${r1(t - 26 * s)}` +
        ` Q ${r1(x - 4 * s)} ${r1(t - 12 * s)} ${r1(x)} ${r1(t - 10 * s)} Q ${r1(x + 4 * s)} ${r1(t - 12 * s)} ${r1(x + 9 * s)} ${r1(t - 26 * s)}` +
        ` Q ${r1(x + 15 * s)} ${r1(t - 18 * s)} ${r1(x + 12 * s)} ${r1(t)} Q ${r1(x)} ${r1(t + 7 * s)} ${r1(x - 12 * s)} ${r1(t)} Z`,
      bloom,
    )
  );
}

/** A bed of lilies along the ground. */
function lilyBed(rand: () => number, x: number, y: number, s: number, stem: string, bloom: string, n = 6): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(lily(x + i * 34 * s + (rand() - 0.5) * 10 * s, y + (rand() - 0.5) * 8 * s, s * (0.8 + rand() * 0.35), stem, bloom));
  }
  return out.join('');
}

/** A watchman's torch: pole with a flame on top. */
function torch(x: number, y: number, s: number, pole: string, fire: string): string {
  return rect(x - 3 * s, y - 120 * s, 6 * s, 120 * s, pole) + flame(x, y - 116 * s, s * 0.5, fire);
}

/** A war banner on a pole, cloth streaming right. */
function pennant(x: number, y: number, s: number, pole: string, cloth: string): string {
  return (
    rect(x - 3 * s, y - 150 * s, 6 * s, 150 * s, pole) +
    path(`M ${r1(x + 3 * s)} ${r1(y - 146 * s)} L ${r1(x + 70 * s)} ${r1(y - 132 * s)} L ${r1(x + 50 * s)} ${r1(y - 118 * s)} L ${r1(x + 72 * s)} ${r1(y - 102 * s)} L ${r1(x + 3 * s)} ${r1(y - 108 * s)} Z`, cloth)
  );
}

export const HOOGLIED_SCENES: Record<string, Scene> = {
  // 1: "Ik ben zwart, doch liefelijk, als de tenten van Kedar" - the vineyard keeper under the sun, the flock by the shepherds' tents
  'hooglied-bijbelquiz-deel-1': {
    hue: 338,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 226, sunR: 82, rays: true, far: 'dunes', horizon: 470 }),
      tent(250, 480, 1.15, c.p.near),
      tent(390, 482, 0.85, c.p.near, { opacity: 0.85 }),
      vineRow(c.rand, 1000, 504, 1.1, c.p.near, 5),
      goat(820, 500, 0.5, c.p.near),
      goat(900, 506, 0.46, c.p.near, { opacity: 0.85 }),
      goat(970, 498, 0.42, c.p.near, { opacity: 0.75 }),
      person(620, 506, 1.3, c.p.fore, 'stand'),
      fg(c, 676, 20),
    ],
  },

  // 2: "Zie, daar komt Hij, springende op de bergen" - the hart leaping over the hills, the lattice window, winter past
  'hooglied-bijbelquiz-deel-2': {
    hue: 340,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 250, sunR: 70, far: 'ridge', horizon: 474 }),
      deer(820, 392, 1.25, c.p.near),
      deer(1010, 418, 0.9, c.p.near),
      dove(560, 236, 0.75, c.p.light, { opacity: 0.85 }),
      rect(150, 330, 260, 160, c.p.near),
      rect(136, 316, 288, 18, c.p.near),
      windowFrame(280, 440, 1.0, c.p.fore, c.p.glow),
      tree(520, 486, 1.25, c.p.near),
      circle(496, 404, 5, c.p.accent),
      circle(540, 412, 5, c.p.accent),
      circle(518, 386, 5, c.p.accent),
      lilyBed(c.rand, 600, 520, 0.9, c.p.near, c.p.light, 7),
      fg(c, 680, 18),
    ],
  },

  // 3: "Op mijn leger in de nachten zocht ik Hem" - searching the city streets by night, the watchmen with their torches
  'hooglied-bijbelquiz-deel-3': {
    hue: 342,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1120, sunY: 200, sunR: 54, far: 'none', ground: 'flat', horizon: 512 }),
      citySkyline(c.rand, 704, 470, 1.0, c.p.mid, 11, { opacity: 0.8 }),
      cityWall(704, 512, 0.9, c.p.near, 1100, { opacity: 0.9 }),
      c.soft(470, 420, 130, 0.18),
      person(470, 512, 1.3, c.p.fore, 'walk'),
      c.soft(930, 380, 110, 0.3, c.p.accent),
      torch(960, 512, 1.1, c.p.fore, c.p.accent),
      person(910, 512, 1.25, c.p.fore, 'point'),
      person(1040, 512, 1.15, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 4: "Een besloten hof, een verzegelde springader" - the enclosed garden and sealed spring, David's tower hung with shields
  'hooglied-bijbelquiz-deel-4': {
    hue: 344,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 238, rays: true, far: 'ridge', horizon: 470 }),
      tower(240, 474, 1.25, c.p.mid, { opacity: 0.9 }),
      circle(226, 350, 7, c.p.accent, { opacity: 0.8 }),
      circle(254, 350, 7, c.p.accent, { opacity: 0.8 }),
      circle(226, 380, 7, c.p.accent, { opacity: 0.8 }),
      circle(254, 380, 7, c.p.accent, { opacity: 0.8 }),
      circle(240, 410, 7, c.p.accent, { opacity: 0.8 }),
      tree(560, 440, 1.1, c.p.mid),
      tree(900, 436, 1.2, c.p.mid),
      tree(1080, 440, 1.0, c.p.mid),
      cityWall(780, 486, 0.62, c.p.near, 620),
      well(760, 540, 1.05, c.p.fore),
      rect(712, 496, 96, 10, c.p.accent, { rx: 3 }),
      streaks(c.rand, 420, 160, 800, 140, c.p.light, 14, { opacity: 0.14 }),
      fg(c, 684, 16),
    ],
  },

  // 5: "Het is de stem mijns Liefsten, Die klopt: Doe Mij open" - the door at night, the Beloved already walking away
  'hooglied-bijbelquiz-deel-5': {
    hue: 346,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1080, sunY: 210, sunR: 50, far: 'dunes', ground: 'flat', horizon: 512 }),
      trail(470, 700, 1060, 512, 90, c.p.near, { opacity: 0.4 }),
      houseBlock(c.rand, 420, 512, 1.4, c.p.near),
      rect(398, 432, 44, 80, c.p.glow, { opacity: 0.75 }),
      person(420, 512, 0.62, c.p.fore, 'stand'),
      c.soft(420, 470, 120, 0.25),
      person(1010, 514, 1.0, c.p.fore, 'walk', { opacity: 0.7 }),
      cityWall(1200, 512, 0.6, c.p.mid, 260, { opacity: 0.7 }),
      fg(c, 686, 14),
    ],
  },

  // 6: "Schoon gelijk de maan, zuiver als de zon, schrikkelijk als slagorden met banieren" - dawn, moon and sun, the lily beds
  'hooglied-bijbelquiz-deel-6': {
    hue: 348,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 262, sunR: 76, rays: true, far: 'dunes', horizon: 470 }),
      crescent(300, 150, 34, c.p.light),
      pennant(820, 486, 0.8, c.p.near, c.p.accent),
      pennant(900, 482, 0.9, c.p.near, c.p.accent),
      pennant(990, 488, 0.8, c.p.near, c.p.accent),
      tree(260, 486, 1.2, c.p.near),
      person(520, 520, 1.3, c.p.fore, 'kneel'),
      lilyBed(c.rand, 330, 540, 1.0, c.p.near, c.p.light, 5),
      lilyBed(c.rand, 600, 546, 1.0, c.p.near, c.p.light, 6),
      fg(c, 684, 16),
    ],
  },

  // 7: "Deze uw lengte is te vergelijken bij een palmboom" - the palm with grape clusters, up early to the vineyards
  'hooglied-bijbelquiz-deel-7': {
    hue: 350,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 262, sunR: 70, rays: true, far: 'dunes', horizon: 470 }),
      houseBlock(c.rand, 1180, 470, 0.5, c.p.far, { opacity: 0.85 }),
      houseBlock(c.rand, 1270, 474, 0.42, c.p.far, { opacity: 0.8 }),
      trail(620, 700, 980, 474, 70, c.p.near, { opacity: 0.35 }),
      vineRow(c.rand, 760, 494, 0.8, c.p.mid, 6),
      palm(290, 520, 2.3, c.p.near),
      grapes(276, 356, 0.9, c.p.accent),
      grapes(336, 346, 0.8, c.p.accent),
      person(600, 530, 1.25, c.p.fore, 'walk'),
      person(680, 532, 1.2, c.p.fore, 'walk'),
      fg(c, 682, 18),
    ],
  },

  // 8: "Vele wateren zouden deze liefde niet kunnen uitblussen" - the flame above the flood; she comes up from the wilderness leaning on her Beloved
  'hooglied-bijbelquiz-deel-8': {
    hue: 352,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 880, sunY: 300, far: 'none', ground: 'water', horizon: 470 }),
      c.soft(880, 400, 250, 0.35, c.p.accent),
      ellipse(880, 500, 130, 34, c.p.near),
      fireBed(c.rand, 880, 496, 1.1, c.p.accent, 5),
      flame(880, 470, 1.7, c.p.light, { opacity: 0.55 }),
      swell(c.rand, 580, c.p.water, { opacity: 0.8 }),
      path('M -20 540 C 160 516 340 520 470 566 C 520 590 540 640 560 792 L -20 792 Z', c.p.mid),
      tree(150, 560, 1.2, c.p.near),
      person(260, 566, 1.2, c.p.fore, 'walk'),
      person(304, 566, 1.28, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },
};
