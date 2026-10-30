/**
 * Covers for the Amos series, one scene per quiz. Each quiz covers one
 * chapter: `amos-bijbelquiz-deel-<n>` is chapter n (1-9).
 *
 * Base hue 200, drifting two degrees per chapter (chapter 9 lands on 216).
 * See `quiz-cover-scene-kit.mts` for the house style; the extra motifs live
 * in `quiz-cover-motifs-spreuken-openbaring.mts`.
 *
 * Chapters: de veeherder uit Tekoa, vuur over Damaskus en de steden rondom
 * (1); zij verkopen de nooddruftige om een paar schoenen (2); de leeuw
 * brult, zal men met de bazuin blazen in een stad? (3); de koeien van Basan,
 * bereid u om uw God te ontmoeten, Hij die de dageraad tot duisternis maakt
 * (4); laat het recht daarhenen rollen als water, Hij die het Zevengesternte
 * en de Orion maakt (5); wee de gerusten te Sion, liggend op ivoren bedden
 * (6); het paslood in de hand des Heeren (7); een korf met zomervruchten (8);
 * de vervallen hut van David weer opgericht, de bergen druipen van zoete wijn
 * (9).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  basket,
  brickWall,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  coin,
  columns,
  ellipse,
  fireBed,
  grapes,
  ox,
  path,
  person,
  rect,
  shafts,
  shrub,
  tent,
  tree,
  vineRow,
} from './quiz-cover-primitives.mjs';
import { mix } from './cover-options/shapes.mjs';
import {
  booth,
  bowl,
  flipX,
  harp,
  lamb,
  paleTone,
  plumbLine,
  sandalPair,
  shofar,
  staffBearer,
  standingLion,
  star,
  stroke,
  wallTone,
} from './quiz-cover-motifs-spreuken-openbaring.mjs';

/** A rising column of smoke built from soft ellipses. */
function smokePlume(x: number, y: number, h: number, w: number, fill: string, opacity: number, drift = 0): string {
  const out: string[] = [];
  const n = 8;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    out.push(ellipse(x + drift * t * t, y - t * h, w * (0.45 + t * 0.7), w * (0.3 + t * 0.35), fill));
  }
  return `<g opacity="${opacity}">${out.join('')}</g>`;
}

/** A couch of ivory: a long seat with a raised head end and short legs. */
function ivoryCouch(x: number, y: number, w: number, fill: string): string {
  return (
    rect(x - w / 2, y - 34, w, 16, fill, { rx: 6 }) +
    path(`M ${x - w / 2} ${y - 30} L ${x - w / 2 - 6} ${y - 70} C ${x - w / 2 + 6} ${y - 78} ${x - w / 2 + 22} ${y - 66} ${x - w / 2 + 18} ${y - 30} Z`, fill) +
    rect(x - w / 2 + 6, y - 20, 9, 20, fill) +
    rect(x + w / 2 - 15, y - 20, 9, 20, fill)
  );
}

export const AMOS_SCENES: Record<string, Scene> = {
  // 1: "De woorden van Amos, die onder de veeherders was van Tekoa ... Ik zal een vuur zenden in het huis van Hazael"
  'amos-bijbelquiz-deel-1': {
    hue: 200,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 350, sunR: 50, far: 'ridge', ground: 'dunes', horizon: 482 }),
      smokePlume(1000, 440, 230, 90, mix(c.a.near, c.a.figure, 0.4), 0.45, -80),
      cityWall(1000, 486, 0.75, c.p.mid, 380),
      citySkyline(c.rand, 1000, 442, 0.6, c.p.mid, 5),
      fireBed(c.rand, 1000, 460, 0.9, c.p.accent, 10),
      staffBearer(430, 534, 1.4, c.p.fore),
      lamb(560, 538, 0.95, c.p.light, c.p.near),
      lamb(650, 544, 0.85, c.p.light, c.p.near),
      lamb(730, 536, 0.8, c.p.light, c.p.near),
      lamb(300, 546, 0.8, c.p.light, c.p.near, { flip: true }),
      fg(c, 692, 14),
    ],
  },

  // 2: "Omdat zij den rechtvaardige verkopen om geld, en den nooddruftige om een paar schoenen"
  'amos-bijbelquiz-deel-2': {
    hue: 202,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 250, far: 'dunes', ground: 'flat', horizon: 512 }),
      tent(1150, 516, 1.1, c.p.near, { opacity: 0.55 }),
      rect(560, 470, 300, 14, c.p.near, { rx: 3 }),
      rect(578, 484, 12, 46, c.p.near),
      rect(830, 484, 12, 46, c.p.near),
      coin(600, 458, 0.8, c.p.near),
      coin(628, 462, 0.7, c.p.near),
      coin(612, 440, 0.7, c.p.near),
      sandalPair(750, 470, 1.15, c.p.accent, c.p.accentDeep),
      flipX(960, person(960, 532, 1.35, c.p.fore, 'point')),
      person(420, 536, 1.25, c.p.fore, 'bow'),
      fg(c, 692, 12),
    ],
  },

  // 3: "Zal een leeuw brullen in het woud, als hij geen roof heeft? ... Zal men met de bazuin blazen in een stad, en het volk zal niet beven?"
  'amos-bijbelquiz-deel-3': {
    hue: 204,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', ground: 'dunes', horizon: 490 }),
      cityWall(1020, 504, 1.3, c.p.mid, 460),
      person(970, 426, 0.95, c.p.fore, 'stand'),
      shofar(984, 320, 0.62, c.p.accent),
      shrub(280, 544, 1.4, c.p.near),
      shrub(640, 548, 1.0, c.p.near),
      standingLion(450, 548, 1.15, c.p.near, undefined, { roar: true }),
      fg(c, 692, 14),
    ],
  },

  // 4: "Hoort dit woord, gij koeien van Basan, die op den berg van Samaria zijt ... Bereid u, o Israel, om uw God te ontmoeten!"
  'amos-bijbelquiz-deel-4': {
    hue: 206,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'dunes', horizon: 480 }),
      c.soft(1010, 300, 220, 0.4, c.p.accent),
      circle(1010, 300, 58, c.p.accent),
      cloudBank(c.rand, 1030, 336, 1.4, mix(c.a.near, c.a.figure, 0.35), { opacity: 0.9 }),
      cloudBank(c.rand, 760, 250, 1.1, mix(c.a.near, c.a.figure, 0.35), { opacity: 0.55 }),
      path('M 120 500 C 180 420 280 384 380 386 C 470 388 540 430 600 500 Z', c.p.mid),
      citySkyline(c.rand, 370, 392, 0.6, c.p.near, 5),
      ox(560, 540, 1.0, c.p.near),
      ox(770, 530, 0.85, c.p.near, { opacity: 0.9 }),
      ox(940, 544, 1.05, c.p.near),
      fg(c, 694, 14),
    ],
  },

  // 5: "Laat het oordeel daarhenen rollen als water, en de gerechtigheid als een sterke beek" - under the Seven Stars and Orion
  'amos-bijbelquiz-deel-5': {
    hue: 208,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', ground: 'dunes', horizon: 470, stars: 24 }),
      ...[[370, 262, 20], [410, 240, 15], [440, 272, 17], [400, 296, 13], [462, 228, 13], [340, 228, 12], [430, 312, 11]].map(([x, y, r]) => star(x, y, r, c.p.accent)),
      ...[[930, 220], [1060, 230], [968, 292], [994, 300], [1020, 308], [940, 380], [1060, 372]].map(([x, y]) => star(x, y, 9, c.p.light)),
      fg(c, 690, 14),
      path('M 690 474 L 720 474 C 760 540 860 600 960 800 L 440 800 C 560 600 650 540 690 474 Z', mix(c.p.water, '#8FA6D6', 0.35)),
      stroke('M 680 500 q 12 -6 24 0 q 12 6 24 0 M 640 548 q 20 -8 40 0 q 20 8 40 0 q 20 -8 40 0 M 600 606 q 26 -10 52 0 q 26 10 52 0 q 26 -10 52 0 q 26 10 52 0 M 540 680 q 34 -12 68 0 q 34 12 68 0 q 34 -12 68 0 q 34 12 68 0 q 34 -12 68 0', '#FFFFFF', 6, 0.8),
      path('M 380 800 C 440 680 520 610 560 600 C 600 620 600 700 560 800 Z', mix(c.a.near, c.a.figure, 0.35)),
      path('M 1020 800 C 980 700 900 640 860 630 C 830 650 840 720 880 800 Z', mix(c.a.near, c.a.figure, 0.35)),
      person(330, 560, 1.25, c.p.fore, 'raise'),
    ],
  },

  // 6: "Wee den gerusten te Sion ... die liggen op ivoren bedden, en zich uitstrekken op hun koetsen ... die wijn drinken uit schalen"
  'amos-bijbelquiz-deel-6': {
    hue: 210,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 380, sunR: 50, far: 'none', ground: 'flat', horizon: 512 }),
      columns(250, 512, 1.3, c.p.near, 2),
      columns(1160, 512, 1.3, c.p.near, 2),
      ivoryCouch(450, 534, 260, paleTone(c, 0.12)),
      person(420, 506, 1.0, c.p.fore, 'sit'),
      person(510, 506, 0.95, c.p.fore, 'sit'),
      ivoryCouch(960, 534, 220, paleTone(c, 0.12)),
      person(990, 506, 1.0, c.p.fore, 'sit'),
      harp(1070, 534, 0.75, c.p.near),
      rect(694, 452, 20, 82, c.p.near),
      rect(668, 528, 72, 8, c.p.near, { rx: 3 }),
      bowl(704, 456, 1.6, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 7: "Ziet, de Heere stond op een muur, met een paslood gemaakt; en een paslood was in Zijn hand"
  'amos-bijbelquiz-deel-7': {
    hue: 212,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'ridge', ground: 'flat', horizon: 512 }),
      c.soft(770, 130, 170, 0.6, '#FFFFFF'),
      shafts(770, 60, 120, 210, c.p.glow, 3),
      brickWall(c.rand, 806, 516, 1.9, wallTone(c), 9, 7),
      plumbLine(774, 100, 434, 1.3, c.p.near, c.p.accent),
      person(520, 532, 1.35, c.p.fore, 'point'),
      fg(c, 692, 12),
    ],
  },

  // 8: "Zie, er was een korf met zomervruchten ... Het einde is gekomen over Mijn volk Israel"
  'amos-bijbelquiz-deel-8': {
    hue: 214,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 240, far: 'dunes', ground: 'dunes', horizon: 480 }),
      tree(1080, 500, 1.25, c.p.near),
      basket(720, 546, 2.3, c.p.near),
      ...[[650, 472, 20], [690, 468, 22], [734, 470, 21], [776, 472, 20], [670, 444, 19], [714, 440, 21], [756, 446, 18], [694, 418, 17]].map(([x, y, r]) =>
        circle(x, y, r, c.p.accent),
      ),
      grapes(800, 470, 1.0, c.p.accent),
      person(480, 538, 1.3, c.p.fore, 'kneel'),
      fg(c, 692, 14),
    ],
  },

  // 9: "Te dien dage zal Ik de vervallen hut van David weder oprichten ... en de bergen zullen van zoeten wijn druipen"
  'amos-bijbelquiz-deel-9': {
    hue: 216,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 300, sunR: 56, rays: true, far: 'ridge', ground: 'dunes', horizon: 480 }),
      vineRow(c.rand, 830, 524, 1.15, c.p.mid, 6),
      booth(540, 536, 1.45, c.p.near, c.p.near),
      person(530, 536, 1.05, c.p.fore, 'sit'),
      grapes(640, 342, 1.35, c.p.accent),
      grapes(440, 340, 1.15, c.p.accent),
      fg(c, 692, 14),
    ],
  },
};
