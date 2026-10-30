/**
 * Covers for the Jozua series, one scene per quiz. Each quiz covers one
 * chapter: `jozua-bijbelquiz-deel-<n>` is chapter n (1-24).
 *
 * Base hue 140, drifting two degrees per chapter (chapter 24 lands on 186).
 * See `quiz-cover-scene-kit.mts` for the house style; motifs this book needs
 * beyond the shared primitives live in `quiz-cover-motifs-deut-jozua.mts`.
 *
 * Chapters: Jozua aan de Jordaan met het wetboek, "wees sterk en heb goeden
 * moed" (1); Rachab en het scharlaken snoer in het venster (2); de priesters
 * met de ark staan in de Jordaan, het water staat als een hoop (3); de twaalf
 * stenen te Gilgal (4); de Vorst van het heir des HEEREN met het getrokken
 * zwaard (5); de muren van Jericho vallen bij het geklank der bazuinen (6);
 * Achans verborgen goud onder zijn tent (7); Jozua strekt de spies uit naar
 * Ai (8); de Gibeonieten met beschimmeld brood (9); zon, sta stil te Gibeon
 * (10); de wagens met vuur verbrand bij de wateren van Merom (11); de
 * eenendertig verslagen koningen (12); er blijft nog zeer veel lands over,
 * het erfdeel aan de overzijde (13); Kaleb: "geef mij dit gebergte" (14);
 * Achsa vraagt om waterbronnen (15); het lot van Efraim (16); "gij zult het
 * woud uithouwen" (17); de tabernakel te Silo (18); het lot voor de overige
 * stammen (19); de vrijsteden, de doodslager in de poort (20); de steden van
 * de Levieten verspreid door het land (21); het altaar Ed aan de Jordaan (22);
 * de oude Jozua neemt afscheid (23); de steen onder de eik te Sichem, "ik en
 * mijn huis" (24).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { box, mix } from './cover-options/shapes.mjs';
import {
  H,
  banner,
  chariot,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  coin,
  crowd,
  crown,
  cypress,
  donkey,
  ellipse,
  fireBed,
  gateArch,
  loaf,
  ox,
  palm,
  path,
  person,
  rect,
  river,
  rngFor,
  rotate,
  sandal,
  scroll,
  sheaf,
  smokeColumn,
  streaks,
  stump,
  tent,
  tower,
  trail,
  tree,
  window as windowFrame,
} from './quiz-cover-primitives.mjs';
import {
  arkOfCovenant,
  axe,
  cairn,
  figureA,
  hamlet,
  hornedAltar,
  jar,
  javelin,
  kneelA,
  moon,
  nomadTent,
  plough,
  sheepA,
  shofar,
  stele,
  sword,
  tabernacle,
} from './quiz-cover-motifs-deut-jozua.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A round-capped line. */
function line(x1: number, y1: number, x2: number, y2: number, w: number, fill: string, opacity = 1): string {
  return (
    `<path d="M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}" fill="none" stroke="${fill}" stroke-width="${r1(w)}"` +
    ` stroke-linecap="round"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`
  );
}

/** A free curve, round-capped. */
function curve(d: string, w: number, fill: string, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

/** The Jordan as a band across the plain, with a few white crests. */
function jordan(y: number, h: number, fill: string, crest: string): string {
  return (
    path(`M -20 ${y} C 300 ${y - 10} 640 ${y + 8} 960 ${y - 4} C 1140 ${y - 10} 1300 ${y} 1430 ${y - 4} L 1430 ${y + h} C 1100 ${y + h - 8} 760 ${y + h + 10} 420 ${y + h} C 240 ${y + h - 6} 100 ${y + h + 4} -20 ${y + h} Z`, fill) +
    line(220, y + h * 0.45, 340, y + h * 0.45, 4, crest, 0.7) +
    line(700, y + h * 0.55, 860, y + h * 0.55, 4, crest, 0.7) +
    line(1080, y + h * 0.4, 1180, y + h * 0.4, 4, crest, 0.7)
  );
}

export const JOZUA_SCENES: Record<string, Scene> = {
  // 1: "Dit boek der wet zal niet wijken van uw mond ... wees sterk en heb goeden moed" - Joshua at the Jordan, the land beyond
  'jozua-bijbelquiz-deel-1': {
    hue: 140,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 250, rays: true, far: 'ridge', horizon: 462 }),
      jordan(484, 28, c.p.water, c.p.light),
      palm(1000, 480, 0.62, c.p.mid),
      palm(1056, 476, 0.5, c.p.mid),
      tent(330, 530, 0.7, c.p.mid),
      tent(190, 562, 1.05, c.p.near),
      tent(360, 572, 0.85, c.p.near),
      figureA(640, 576, 1.55, c.p.fore, 'reach'),
      scroll(770, 466, 0.78, c.p.accent),
      fg(c, 702, 8),
    ],
  },

  // 2: "Gij zult dit snoer van scharlaken draad in het venster binden" - Rahab's window in the wall of Jericho, the spies away to the hills
  'jozua-bijbelquiz-deel-2': {
    hue: 142,
    mood: 'night',
    draw: (c) => {
      const wall = mix(c.a.mid, c.a.figure, 0.34);
      const house = mix(c.a.mid, c.a.figure, 0.48);
      const merlons: string[] = [];
      for (let x = 170; x < 800; x += 42) merlons.push(box(x, 316, 26, 20, wall));
      return [
        base(c, { sun: 'moon', sunX: 1150, sunY: 220, sunR: 46, far: 'ridge', horizon: 482 }),
        moon(1150, 220, 32, c.p.light),
        box(160, 334, 650, 200, wall),
        merlons.join(''),
        box(392, 236, 220, 100, house),
        box(380, 228, 244, 14, house, 3),
        windowFrame(500, 316, 0.72, c.p.fore, c.p.glow),
        c.soft(500, 290, 80, 0.3),
        curve('M 500 316 C 492 380 512 450 498 534', 13, c.p.accent),
        person(960, 548, 1.25, c.p.fore, 'walk'),
        person(1090, 538, 1.1, c.p.fore, 'walk'),
        fg(c, 696, 10),
      ];
    },
  },

  // 3: the priests with the ark stand on dry ground in the midst of the Jordan, the waters heaped up on the one side
  'jozua-bijbelquiz-deel-3': {
    hue: 144,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'ridge', horizon: 466 }),
      path('M 1010 610 C 996 510 1020 430 1080 386 C 1140 350 1240 336 1340 338 L 1340 610 Z', c.p.water),
      circle(1040, 470, 16, c.p.light, { opacity: 0.85 }),
      circle(1056, 434, 18, c.p.light, { opacity: 0.85 }),
      circle(1084, 400, 20, c.p.light, { opacity: 0.85 }),
      circle(1124, 376, 20, c.p.light, { opacity: 0.85 }),
      circle(1170, 360, 18, c.p.light, { opacity: 0.85 }),
      circle(1220, 350, 18, c.p.light, { opacity: 0.85 }),
      circle(1272, 344, 18, c.p.light, { opacity: 0.85 }),
      curve('M 1060 450 C 1120 400 1200 380 1300 376', 5, c.p.light, 0.7),
      curve('M 1050 510 C 1110 460 1200 440 1300 434', 5, c.p.light, 0.6),
      curve('M 1046 566 C 1110 520 1200 500 1300 494', 5, c.p.light, 0.5),
      crowd(c.rand, 330, 522, 0.85, c.p.near, 5, 300),
      person(600, 556, 1.3, c.p.fore, 'carry'),
      person(830, 556, 1.3, c.p.fore, 'carry'),
      arkOfCovenant(715, 466, 0.95, c.p.accent, c.p.fore),
      fg(c, 700, 8),
    ],
  },

  // 4: "Wat zijn u deze stenen?" - the twelve stones from the Jordan set up at Gilgal, the priests with the ark still in the river
  'jozua-bijbelquiz-deel-4': {
    hue: 146,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 220, sunY: 250, sunR: 56, far: 'dunes', horizon: 468 }),
      jordan(478, 24, c.p.water, c.p.light),
      person(1000, 500, 0.6, c.p.near, 'carry'),
      person(1110, 500, 0.6, c.p.near, 'carry'),
      arkOfCovenant(1055, 459, 0.45, c.p.accent, c.p.near),
      path('M 930 492 C 1000 486 1110 490 1190 486 L 1190 506 C 1110 510 1000 504 930 508 Z', c.p.water),
      line(980, 498, 1040, 498, 3, c.p.light, 0.8),
      line(1100, 497, 1160, 497, 3, c.p.light, 0.8),
      c.soft(744, 480, 200, 0.35),
      cairn(rngFor('gilgal'), 748, 562, 1.4, c.p.near),
      cairn(rngFor('gilgal'), 742, 556, 1.4, c.p.light),
      figureA(420, 560, 1.4, c.p.fore, 'reach'),
      person(520, 560, 0.8, c.p.fore, 'stand'),
      fg(c, 696, 10),
    ],
  },

  // 5: "Een Man stond tegenover hem, en Zijn zwaard was getrokken" - Joshua on his face before the Prince of the LORD's host
  'jozua-bijbelquiz-deel-5': {
    hue: 148,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 860, sunY: 260, far: 'dunes', horizon: 478 }),
      cityWall(1180, 482, 0.7, c.p.far, 260, { opacity: 0.65 }),
      c.soft(850, 380, 230, 0.45),
      figureA(850, 556, 1.5, c.p.fore, 'stand'),
      sword(880, 462, 1.05, c.p.accent, { rot: 18 }),
      kneelA(560, 560, 1.4, c.p.fore, 'forward'),
      sandal(380, 566, 0.6, c.p.fore),
      sandal(420, 572, 0.6, c.p.fore),
      fg(c, 700, 8),
    ],
  },

  // 6: "Het volk juichte met groot gejuich, en de muur viel onder zich" - the rams' horns and the falling walls of Jericho
  'jozua-bijbelquiz-deel-6': {
    hue: 150,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 960, sunY: 250, far: 'none', horizon: 492 }),
      path('M 600 504 C 700 452 820 432 1000 430 C 1180 432 1260 452 1340 504 Z', c.p.mid),
      rotate(-14, 760, 452, cityWall(850, 452, 1.0, c.p.near, 200)),
      rotate(16, 1240, 452, cityWall(1150, 452, 1.0, c.p.near, 180)),
      rotate(30, 1000, 440, tower(1000, 452, 0.8, c.p.near)),
      rotate(-20, 940, 470, rect(920, 450, 44, 26, c.p.near)),
      rotate(24, 1070, 476, rect(1050, 460, 40, 24, c.p.near)),
      cloudBank(c.rand, 980, 470, 1.7, c.p.light, { opacity: 0.75 }),
      figureA(220, 544, 1.1, c.p.near, 'carry'),
      shofar(226, 418, 0.9, c.p.accent),
      figureA(400, 558, 1.45, c.p.fore, 'carry'),
      shofar(408, 388, 1.25, c.p.accent),
      fg(c, 700, 8),
    ],
  },

  // 7: "Een schone Babylonische mantel, en tweehonderd sikkelen zilvers, en een gouden staaf" - Achan's treasure dug up before his tent
  'jozua-bijbelquiz-deel-7': {
    hue: 152,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 260, sunY: 240, clouds: 2, far: 'dunes', horizon: 476 }),
      nomadTent(720, 540, 1.25, c.p.near, c.p.fore),
      ellipse(720, 566, 150, 18, c.p.fore, { opacity: 0.6 }),
      rect(600, 520, 70, 34, c.p.mid, { rx: 6 }),
      rect(600, 530, 70, 5, c.p.light, { opacity: 0.6 }),
      rotate(-6, 720, 548, rect(670, 536, 120, 26, c.p.accent, { rx: 6 })),
      coin(812, 552, 0.85, c.p.light),
      coin(842, 556, 0.85, c.p.light),
      coin(826, 532, 0.85, c.p.light),
      figureA(1060, 560, 1.4, c.p.fore, 'reach', { flip: true }),
      kneelA(420, 566, 1.35, c.p.fore, 'forward'),
      fg(c, 700, 8),
    ],
  },

  // 8: "Strek de spies, die in uw hand is, uit naar Ai" - Joshua holds out the javelin, the city behind the ambush in smoke
  'jozua-bijbelquiz-deel-8': {
    hue: 154,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1220, sunY: 320, sunR: 54, far: 'dunes', horizon: 470 }),
      path('M 740 484 C 830 420 940 396 1050 394 C 1160 396 1240 424 1320 484 Z', c.p.mid),
      citySkyline(c.rand, 1050, 404, 0.6, c.p.near, 5),
      cityWall(1050, 420, 0.65, c.p.near, 230),
      smokeColumn(c.rand, 1020, 380, 2.2, c.p.fore),
      smokeColumn(c.rand, 1090, 370, 1.8, c.p.fore),
      ellipse(400, 580, 250, 70, c.p.near),
      figureA(400, 540, 1.5, c.p.fore, 'reach'),
      javelin(400, 486, 760, 352, 8, c.p.accent, c.p.accent),
      fg(c, 704, 8),
    ],
  },

  // 9: "Al het brood hunner teerkost was droog en beschimmeld" - the Gibeonites with worn sacks and old bread come to Joshua
  'jozua-bijbelquiz-deel-9': {
    hue: 156,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 230, far: 'ridge', horizon: 470 }),
      tent(200, 536, 0.9, c.p.near),
      person(330, 552, 1.15, c.p.near, 'stand'),
      figureA(460, 556, 1.4, c.p.fore, 'stand'),
      loaf(716, 474, 1.8, c.p.accent),
      line(690, 452, 700, 436, 5, c.p.accentDeep, 0.45),
      line(712, 456, 724, 434, 5, c.p.accentDeep, 0.45),
      line(736, 454, 746, 438, 5, c.p.accentDeep, 0.45),
      figureA(840, 556, 1.35, c.p.fore, 'reach', { flip: true }),
      donkey(1060, 552, 1.1, c.p.near),
      ellipse(1070, 474, 44, 26, c.p.mid),
      rect(1060, 456, 22, 18, c.p.light, { opacity: 0.5 }),
      fg(c, 700, 8),
    ],
  },

  // 10: "Zon, sta stil te Gibeon, en gij maan, in het dal van Ajalon!"
  'jozua-bijbelquiz-deel-10': {
    hue: 158,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 478 }),
      c.soft(520, 260, 280, 0.55),
      circle(520, 260, 60, c.p.accent),
      moon(1150, 250, 38, c.p.far),
      citySkyline(c.rand, 560, 470, 0.5, c.p.mid, 5),
      cityWall(560, 478, 0.55, c.p.mid, 200),
      streaks(c.rand, 960, 330, 320, 200, c.p.light, 26, { opacity: 0.45 }),
      figureA(860, 560, 1.5, c.p.fore, 'raise'),
      fg(c, 700, 8),
    ],
  },

  // 11: "Hun paarden zult gij ontzenuwen, en hun wagens met vuur verbranden" - the chariots burning by the waters of Merom
  'jozua-bijbelquiz-deel-11': {
    hue: 160,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 250, far: 'ridge', horizon: 480 }),
      ellipse(1010, 490, 330, 18, c.p.water),
      smokeColumn(c.rand, 600, 420, 2.4, c.p.fore),
      smokeColumn(c.rand, 860, 420, 2.0, c.p.fore),
      chariot(620, 556, 1.45, c.p.fore),
      fireBed(c.rand, 620, 470, 0.95, c.p.accent, 5),
      chariot(880, 534, 1.05, c.p.near),
      fireBed(c.rand, 880, 470, 0.7, c.p.accent, 4),
      figureA(300, 560, 1.4, c.p.fore, 'stand'),
      fg(c, 700, 8),
    ],
  },

  // 12: "Al de koningen tezamen eenendertig" - the crowns of the kings Moses and Joshua struck, laid out in rows
  'jozua-bijbelquiz-deel-12': {
    hue: 162,
    mood: 'dusk',
    draw: (c) => {
      const crowns: string[] = [];
      const rows: [number, number, number, number][] = [
        [10, 494, 0.32, 80],
        [10, 528, 0.4, 92],
        [9, 572, 0.5, 106],
      ];
      for (const [n, y, s, gap] of rows) {
        const x0 = 790 - ((n - 1) * gap) / 2;
        for (let i = 0; i < n; i += 1) crowns.push(crown(x0 + i * gap + (c.rand() - 0.5) * 8, y, s, c.p.accent));
      }
      return [
        base(c, { sunX: 1190, sunY: 300, sunR: 56, far: 'dunes', horizon: 476 }),
        crowns.join(''),
        figureA(240, 572, 1.45, c.p.fore, 'staff'),
        fg(c, 702, 8),
      ];
    },
  },

  // 13: "Gij zijt oud geworden ... en er blijft nog zeer veel lands over" - the old Joshua, the flocks of Reuben and Gad beyond the Jordan
  'jozua-bijbelquiz-deel-13': {
    hue: 164,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 236, far: 'ridge', horizon: 472 }),
      river(472, c.p.water, { opacity: 0.9 }),
      line(600, 500, 660, 500, 4, c.p.light, 0.8),
      line(540, 540, 630, 540, 4, c.p.light, 0.8),
      line(650, 566, 740, 566, 4, c.p.light, 0.8),
      line(480, 610, 600, 610, 4, c.p.light, 0.8),
      sheepA(960, 520, 0.8, c.p.light, c.p.fore, { flip: true }),
      sheepA(1060, 526, 0.9, c.p.light, c.p.fore, { flip: true }),
      sheepA(1160, 518, 0.75, c.p.light, c.p.fore, { flip: true }),
      sheepA(1010, 556, 0.95, c.p.light, c.p.fore, { flip: true }),
      banner(1220, 566, 1.0, c.p.fore, c.p.accent),
      rect(240, 540, 130, 40, c.p.near, { rx: 14 }),
      person(300, 566, 1.6, c.p.fore, 'sit'),
      line(370, 580, 370, 356, 8, c.p.fore),
      fg(c, 700, 8),
    ],
  },

  // 14: "Geef mij nu dit gebergte" - Caleb, eighty-five and strong, points up to Hebron on its mountain
  'jozua-bijbelquiz-deel-14': {
    hue: 166,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'none', horizon: 488 }),
      path('M 520 500 C 640 410 760 300 900 284 C 1040 300 1160 410 1330 500 Z', c.p.mid),
      c.soft(900, 300, 150, 0.4, c.p.accent),
      citySkyline(c.rand, 900, 300, 0.55, c.p.accent, 4),
      cityWall(900, 316, 0.55, c.p.accent, 170),
      trail(600, 590, 890, 318, 50, c.p.light, { opacity: 0.4 }),
      figureA(250, 566, 1.2, c.p.near, 'bless'),
      figureA(460, 570, 1.5, c.p.fore, 'reach'),
      fg(c, 702, 8),
    ],
  },

  // 15: "Geef mij ook waterbronnen" - Achsah alights from her ass; Caleb gives her the upper and the nether springs
  'jozua-bijbelquiz-deel-15': {
    hue: 168,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'dunes', horizon: 470 }),
      ellipse(930, 470, 90, 56, c.p.near),
      ellipse(1040, 500, 70, 40, c.p.near),
      ellipse(980, 566, 150, 20, c.p.water),
      ellipse(980, 562, 110, 9, c.p.light, { opacity: 0.7 }),
      curve('M 904 420 C 880 450 900 500 912 556', 10, c.p.light, 0.95),
      curve('M 944 420 C 968 452 950 500 958 556', 8, c.p.light, 0.9),
      curve('M 1050 466 C 1074 490 1060 530 1066 556', 8, c.p.light, 0.9),
      donkey(330, 556, 1.1, c.p.near),
      figureA(540, 566, 1.4, c.p.fore, 'reach'),
      jar(640, 572, 0.75, c.p.accent),
      figureA(1180, 566, 1.35, c.p.fore, 'staff'),
      fg(c, 702, 8),
    ],
  },

  // 16: "Het lot viel voor de kinderen van Jozef" - Ephraim takes up its portion, the first furrow in the golden field
  'jozua-bijbelquiz-deel-16': {
    hue: 170,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'ridge', horizon: 470 }),
      tree(240, 488, 1.0, c.p.mid),
      tree(330, 482, 0.8, c.p.mid),
      tree(1220, 486, 1.1, c.p.mid),
      path('M 400 500 L 1250 486 L 1300 610 L 340 620 Z', c.p.accent, { opacity: 0.55 }),
      line(470, 530, 1120, 520, 4, c.p.accentDeep, 0.35),
      line(450, 560, 1160, 548, 4, c.p.accentDeep, 0.35),
      line(430, 592, 1200, 578, 4, c.p.accentDeep, 0.35),
      ox(760, 566, 1.05, c.p.fore),
      plough(940, 580, 1.15, c.p.fore),
      figureA(1020, 582, 1.35, c.p.fore, 'walk'),
      fg(c, 706, 8),
    ],
  },

  // 17: "Gij zult het uithouwen" - the house of Joseph clears the wooded mountain for room
  'jozua-bijbelquiz-deel-17': {
    hue: 172,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 250, far: 'ridge', horizon: 476 }),
      path('M 640 500 C 760 420 880 380 1020 378 C 1160 382 1260 420 1340 500 Z', c.p.mid),
      cypress(820, 470, 1.0, c.p.near),
      tree(930, 430, 1.2, c.p.near),
      cypress(1030, 410, 1.1, c.p.near),
      tree(1140, 430, 1.3, c.p.near),
      cypress(1250, 460, 1.0, c.p.near),
      tree(1080, 490, 1.0, c.p.near),
      stump(640, 566, 1.15, c.p.near),
      figureA(420, 568, 1.5, c.p.fore, 'raise'),
      axe(458, 372, 0.95, c.p.fore, c.p.accent, { rot: 28 }),
      fg(c, 702, 8),
    ],
  },

  // 18: "De ganse vergadering ... vergaderde te Silo, en zij richtten aldaar de tent der samenkomst op"
  'jozua-bijbelquiz-deel-18': {
    hue: 174,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, rays: true, far: 'ridge', horizon: 482 }),
      ellipse(704, 548, 440, 86, c.p.mid),
      c.soft(760, 420, 220, 0.3),
      tabernacle(704, 510, 1.15, c.p.near, c.p.light, c.p.near, { tent: c.p.accent }),
      crowd(c.rand, 260, 566, 0.95, c.p.fore, 4, 220),
      person(1110, 566, 1.2, c.p.fore, 'walk'),
      person(1220, 560, 1.0, c.p.near, 'walk'),
      fg(c, 702, 8),
    ],
  },

  // 19: "Het lot ging uit" - the lots for the last six tribes cast before the LORD at Shiloh, their standards waiting
  'jozua-bijbelquiz-deel-19': {
    hue: 176,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'dunes', horizon: 476 }),
      banner(760, 520, 0.8, c.p.near, c.p.mid),
      banner(860, 512, 0.75, c.p.near, c.p.mid),
      banner(960, 520, 0.8, c.p.near, c.p.mid),
      banner(1060, 512, 0.75, c.p.near, c.p.mid),
      banner(1160, 520, 0.8, c.p.near, c.p.mid),
      banner(1250, 512, 0.75, c.p.near, c.p.mid),
      crowd(c.rand, 1000, 530, 0.7, c.p.near, 7, 480),
      figureA(380, 572, 1.5, c.p.fore, 'reach'),
      jar(450, 446, 0.95, c.p.near, { rot: 112 }),
      circle(574, 508, 15, c.p.accent),
      circle(596, 548, 16, c.p.accent),
      circle(632, 572, 17, c.p.accent),
      circle(668, 570, 15, c.p.accent),
      fg(c, 704, 8),
    ],
  },

  // 20: the cities of refuge - the slayer stands in the gate and tells his case to the elders of the city
  'jozua-bijbelquiz-deel-20': {
    hue: 178,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 320, sunR: 56, far: 'dunes', horizon: 480 }),
      cityWall(860, 540, 1.6, c.p.near, 760),
      c.soft(860, 450, 160, 0.5, c.p.accent),
      path('M 800 540 L 800 470 A 60 60 0 0 1 920 470 L 920 540 Z', c.p.accent),
      gateArch(860, 540, 1.6, c.p.fore),
      person(720, 546, 1.0, c.p.fore, 'sit'),
      person(1010, 546, 1.0, c.p.fore, 'sit'),
      trail(380, H, 860, 548, 140, c.p.light, { opacity: 0.35 }),
      kneelA(560, 578, 1.4, c.p.fore, 'up'),
      fg(c, 706, 8),
    ],
  },

  // 21: "Al de steden der Levieten ... acht en veertig steden met haar voorsteden" - towns scattered over the land, a Levite family on the way
  'jozua-bijbelquiz-deel-21': {
    hue: 180,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'ridge', horizon: 466 }),
      ellipse(250, 486, 150, 40, c.p.mid),
      ellipse(600, 470, 180, 44, c.p.mid),
      ellipse(940, 482, 160, 40, c.p.mid),
      ellipse(1220, 488, 140, 36, c.p.mid),
      hamlet(c.rand, 430, 444, 0.42, c.p.mid, c.p.accent),
      hamlet(c.rand, 1080, 448, 0.4, c.p.mid, c.p.accent),
      hamlet(c.rand, 250, 470, 0.7, c.p.near, c.p.accent),
      hamlet(c.rand, 600, 450, 0.85, c.p.near, c.p.accent),
      hamlet(c.rand, 940, 466, 0.75, c.p.near, c.p.accent),
      hamlet(c.rand, 1220, 474, 0.62, c.p.near, c.p.accent),
      figureA(640, 572, 1.35, c.p.fore, 'staff'),
      person(760, 576, 0.8, c.p.fore, 'walk'),
      sheepA(860, 580, 0.85, c.p.light, c.p.fore),
      sheepA(950, 586, 0.75, c.p.light, c.p.fore),
      fg(c, 708, 8),
    ],
  },

  // 22: "Een altaar, groot van aanzien" - the altar Ed on the bank of the Jordan, a witness between the tribes
  'jozua-bijbelquiz-deel-22': {
    hue: 182,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 250, far: 'ridge', horizon: 466 }),
      jordan(478, 26, c.p.water, c.p.light),
      c.soft(800, 420, 210, 0.35),
      hornedAltar(800, 556, 1.75, c.p.accent),
      person(360, 562, 1.3, c.p.fore, 'point'),
      crowd(c.rand, 230, 552, 0.85, c.p.near, 3, 120),
      figureA(1080, 562, 1.35, c.p.fore, 'raise'),
      person(1200, 558, 1.1, c.p.near, 'stand'),
      fg(c, 700, 8),
    ],
  },

  // 23: "Ik ga heden in den weg der ganse aarde" - the old Joshua's farewell to the elders as the sun goes down
  'jozua-bijbelquiz-deel-23': {
    hue: 184,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 484 }),
      c.soft(1080, 450, 300, 0.5),
      circle(1080, 466, 66, c.p.accent),
      path(`M -20 486 C 300 474 700 494 1000 482 C 1200 474 1320 484 1430 480 L 1430 ${H} L -20 ${H} Z`, c.p.mid),
      rect(490, 548, 140, 40, c.p.near, { rx: 14 }),
      person(560, 572, 1.65, c.p.fore, 'sit'),
      line(632, 588, 632, 360, 8, c.p.fore),
      person(330, 584, 1.25, c.p.near, 'sit'),
      person(790, 580, 1.25, c.p.near, 'sit'),
      person(910, 586, 1.15, c.p.near, 'sit'),
      fg(c, 706, 8),
    ],
  },

  // 24: "Maar ik en mijn huis, wij zullen den HEERE dienen" - and the great stone set up under the oak at Shechem
  'jozua-bijbelquiz-deel-24': {
    hue: 186,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 236, rays: true, far: 'ridge', horizon: 476 }),
      tree(880, 560, 2.7, c.p.near),
      stele(990, 568, 1.0, c.p.accent),
      figureA(560, 570, 1.5, c.p.fore, 'raise'),
      person(450, 570, 1.15, c.p.fore, 'stand'),
      person(380, 574, 0.75, c.p.fore, 'stand'),
      person(680, 574, 0.7, c.p.fore, 'stand'),
      crowd(c.rand, 1190, 556, 0.9, c.p.near, 4, 200),
      fg(c, 702, 8),
    ],
  },
};

