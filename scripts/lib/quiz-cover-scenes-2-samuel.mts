/**
 * Covers for the 2 Samuel series, one scene per quiz. Each quiz covers one
 * chapter: `2-samuel-bijbelquiz-deel-<n>` is chapter n (1-24).
 *
 * Base hue 150, drifting two degrees per chapter (chapter 24 lands on 196).
 * See `quiz-cover-scene-kit.mts` for the house style; the motifs this series
 * adds live in `quiz-cover-motifs-richteren-samuel.mts`. Gold objects (the
 * ark, the golden shields, a crown of gold) use a mood with the gold accent.
 *
 * Chapters: Davids klaaglied over Saul en Jonathan, "hoe zijn de helden
 * gevallen" (1); twaalf tegen twaalf bij de vijver van Gibeon, Joab blaast de
 * bazuin (2); David weent achter de baar van Abner (3); de moordenaars van
 * Isboseth komen op het heetst van de dag als haalden zij tarwe (4); David
 * neemt de burg Sion in, Jeruzalem wordt de stad van David (5); David huppelt
 * voor de ark (6); Nathans profetie: "uw troon zal vast zijn tot in
 * eeuwigheid" (7); de gouden schilden naar Jeruzalem (8); Mefiboseth eet
 * altijd aan de tafel van de koning (9); Joab: "wees sterk", de Syriërs
 * vluchten (10); Uria draagt de brief naar Joab (11); Nathan: "Gij zijt die
 * man", het ooilam (12); het schaapscheerdersfeest te Baäl-Hazor (13); Joabs
 * gerstveld in brand (14); David gaat de Olijfberg op, het hoofd bedekt,
 * wenend (15); Simeï vloekt en werpt met stenen (16); de put te Bahurim met
 * gort erover gespreid (17); Absalom blijft met zijn haar in de eik hangen
 * (18); het veer over de Jordaan, Barzillai (19); de wijze vrouw op de muur
 * van Abel (20); Rizpa op de rots met haar zak (21); "de HEERE is mijn
 * steenrots en mijn burg ... mijn schild" (22); David giet het water uit de
 * put van Bethlehem uit voor de HEERE (23); de engel boven Jeruzalem, het
 * altaar op de dorsvloer van Arauna (24).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { at, city, mix } from './cover-options/shapes.mjs';
import {
  H,
  W,
  angel,
  banner,
  bird,
  boat,
  chariot,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  columns,
  crowd,
  crown,
  donkey,
  ellipse,
  fireBed,
  flame,
  goblet,
  horse,
  houseBlock,
  loaf,
  ox,
  path,
  rect,
  scroll,
  shafts,
  sheaf,
  smokeColumn,
  streaks,
  tent,
  throne,
  tree,
  wheat,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  ark,
  bier,
  blackTent,
  bow,
  coveredWell,
  fig,
  horn,
  jar,
  lyre,
  mirror,
  oak,
  sheepAt,
  shield,
  spear,
  stroke,
  sword,
} from './quiz-cover-motifs-richteren-samuel.mjs';

const K = 134 / 204;

export const SAMUEL2_SCENES: Record<string, Scene> = {
  // 1: David klaagt met dit klaaglied over Saul en Jonathan: "Hoe zijn de helden gevallen!" - de boog van Jonathan, Gilboa zonder dauw
  '2-samuel-bijbelquiz-deel-1': {
    hue: 150,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 400, sunR: 54, far: 'ridge', horizon: 482 }),
      bow(380, 470, 1.0, c.p.near),
      rect(376, 538, 8, 6, c.p.near),
      fig(560, 544, 1.6, c.p.fore, 'sit'),
      lyre(660, 544, 0.95, c.p.accent),
      fig(860, 540, 1.35, c.p.fore, 'kneel', { flip: true }),
      fig(980, 536, 1.2, c.p.near, 'kneelFwd', { flip: true }),
      fg(c, 694, 12),
    ],
  },

  // 2: twaalf tegen twaalf aan de vijver van Gibeon; aan het eind van de dag blaast Joab de bazuin
  '2-samuel-bijbelquiz-deel-2': {
    hue: 152,
    mood: 'day',
    draw: (c) => {
      const out = [base(c, { sunX: 1200, sunY: 230, far: 'ridge', horizon: 476 })];
      out.push(path('M 560 500 C 620 440 680 424 740 424 C 800 428 850 450 880 500 Z', c.p.mid));
      out.push(fig(720, 434, 1.2, c.p.fore, 'reach'));
      out.push(horn(720 + 80 * 1.2 * K + 20, 434 - 108 * 1.2 * K - 4, 0.8, c.p.accent, { rot: -24 }));
      out.push(ellipse(704, 560, 250, 36, mix(c.a.near, c.a.figure, 0.2)));
      out.push(ellipse(704, 556, 232, 28, c.p.water));
      out.push(stroke('M 560 556 q 40 -6 80 0 M 760 560 q 40 -6 80 0', c.p.light, 3, { opacity: 0.6 }));
      for (let i = 0; i < 4; i += 1) out.push(fig(250 + i * 68, 544 - (i % 2) * 6, 1.05, i % 2 ? c.p.near : c.p.fore, 'sit'));
      for (let i = 0; i < 4; i += 1) out.push(fig(960 + i * 68, 544 - (i % 2) * 6, 1.05, i % 2 ? c.p.near : c.p.fore, 'sit'));
      out.push(fg(c, 700, 10));
      return out;
    },
  },

  // 3: Abner wordt te Hebron begraven; de koning David gaat achter de baar en weent
  '2-samuel-bijbelquiz-deel-3': {
    hue: 154,
    mood: 'dusk',
    draw: (c) => {
      const s = 1.35;
      const shoulder = 536 - 104 * s * K;
      return [
        base(c, { sunX: 1190, sunY: 400, sunR: 54, far: 'ridge', horizon: 482 }),
        citySkyline(c.rand, 260, 486, 0.6, c.p.far, 5, { opacity: 0.85 }),
        fig(560, 536, s, c.p.fore, 'carry'),
        fig(770, 536, s, c.p.fore, 'carry'),
        bier(665, shoulder + 38 * 1.25, 1.25, c.p.fore, c.p.accent),
        fig(980, 540, 1.5, c.p.fore, 'walk', { flip: true }),
        fig(1110, 534, 1.2, c.p.near, 'walk', { flip: true }),
        fig(1220, 528, 1.05, c.p.near, 'walk', { flip: true, opacity: 0.9 }),
        fg(c, 694, 12),
      ];
    },
  },

  // 4: Rechab en Baäna komen op het heetst van de dag in het huis van Isboseth, als zouden zij tarwe halen
  '2-samuel-bijbelquiz-deel-4': {
    hue: 156,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 150, sunR: 60, rays: true, far: 'dunes', horizon: 484 }),
      houseBlock(c.rand, 1060, 524, 1.4, c.p.near),
      rect(1010, 430, 52, 94, mix(c.a.figure, '#000000', 0.1)),
      fig(930, 528, 1.05, c.p.fore, 'sit'),
      fig(480, 538, 1.5, c.p.fore, 'walk'),
      sheaf(540, 538 - 150 * 1.5 * K + 20, 0.62, c.p.accent),
      fig(680, 534, 1.45, c.p.fore, 'walk'),
      sheaf(740, 534 - 150 * 1.45 * K + 20, 0.6, c.p.accent),
      fg(c, 694, 12),
    ],
  },

  // 5: David neemt de burg Sion in; Jeruzalem wordt de stad Davids
  '2-samuel-bijbelquiz-deel-5': {
    hue: 158,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 230, rays: true, far: 'ridge', horizon: 478 }),
      path('M 520 520 C 600 420 700 380 820 378 C 940 380 1040 420 1120 520 Z', c.p.mid),
      at(820, 392, 1.05, city(c.rand, 190, mix(c.a.figure, c.a.near, 0.42), c.p.accent)),
      fig(420, 544, 1.6, c.p.fore, 'reach'),
      fig(290, 538, 1.25, c.p.near, 'shield'),
      fig(190, 532, 1.05, c.p.near, 'staff', { opacity: 0.9 }),
      fg(c, 694, 12),
    ],
  },

  // 6: de ark wordt opgebracht naar de stad Davids met geklank der bazuin, en David huppelt met alle macht voor het aangezicht des HEEREN
  '2-samuel-bijbelquiz-deel-6': {
    hue: 160,
    mood: 'warm',
    draw: (c) => {
      const s = 1.3;
      const shoulder = 532 - 150 * s * K;
      return [
        base(c, { sunX: 1190, sunY: 250, far: 'dunes', horizon: 480 }),
        citySkyline(c.rand, 1230, 484, 0.55, c.p.far, 4, { opacity: 0.8 }),
        fig(780, 532, s, c.p.fore, 'carry'),
        fig(1020, 532, s, c.p.fore, 'carry'),
        ark(900, shoulder + 36, 1.0, c.p.accent, { poles: true }),
        fig(640, 528, 1.1, c.p.near, 'reach'),
        horn(640 + 80 * 1.1 * K + 26, 528 - 108 * 1.1 * K - 6, 0.6, c.p.near, { rot: -20 }),
        fig(420, 540, 1.6, c.p.fore, 'raise'),
        fg(c, 694, 12),
      ];
    },
  },

  // 7: David zit voor het aangezicht des HEEREN: "Uw huis en uw koninkrijk zal bestendig zijn, uw troon vast tot in eeuwigheid"
  '2-samuel-bijbelquiz-deel-7': {
    hue: 162,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 516, stars: 80 }),
      blackTent(330, 516, 0.85, c.p.near),
      shafts(950, 60, 220, 360, c.p.light, 5),
      c.soft(950, 400, 230, 0.42),
      columns(950, 516, 1.6, c.p.near, 3),
      throne(950, 516, 1.15, c.p.accent),
      fig(680, 530, 1.55, c.p.fore, 'kneelUp'),
      fg(c, 700, 10),
    ],
  },

  // 8: David neemt de gouden schilden van de knechten van Hadadezer en brengt ze naar Jeruzalem
  '2-samuel-bijbelquiz-deel-8': {
    hue: 164,
    mood: 'dawn',
    draw: (c) => {
      const out = [
        base(c, { sunX: 260, sunY: 300, sunR: 54, far: 'ridge', horizon: 480 }),
        citySkyline(c.rand, 1200, 440, 0.7, c.p.near, 5),
        cityWall(1200, 516, 1.0, c.p.near, 300),
      ];
      const men: [number, number, number][] = [[960, 528, 1.2], [760, 534, 1.35], [540, 540, 1.5]];
      for (const [x, y, s] of men) {
        out.push(fig(x, y, s, c.p.fore, 'carry'));
        out.push(shield(x, y - 108 * s * K, 1.25 * s, c.p.accent));
      }
      out.push(horse(330, 536, 0.8, c.p.near, { opacity: 0.9 }));
      out.push(fg(c, 694, 12));
      return out;
    },
  },

  // 9: Mefiboseth, de zoon van Jonathan, lam aan beide voeten, eet altijd aan de tafel van de koning
  '2-samuel-bijbelquiz-deel-9': {
    hue: 166,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 240, far: 'none', ground: 'flat', horizon: 516 }),
      columns(230, 516, 1.6, c.p.near, 2),
      columns(1180, 516, 1.6, c.p.near, 2),
      c.soft(704, 420, 220, 0.38),
      rect(450, 446, 508, 14, c.p.fore, { rx: 4 }),
      rect(470, 460, 12, 56, c.p.fore),
      rect(926, 460, 12, 56, c.p.fore),
      loaf(570, 446, 0.85, c.p.accent),
      goblet(650, 446, 0.85, c.p.accent),
      loaf(760, 446, 0.85, c.p.accent),
      goblet(840, 446, 0.85, c.p.accent),
      fig(370, 488, 1.35, c.p.fore, 'sit'),
      stroke('M 418 520 L 404 400 M 396 404 L 414 400', c.p.fore, 6),
      fig(1040, 488, 1.45, c.p.fore, 'sit'),
      crown(1040, 488 - 120 * 1.45 * 0.95 + 6, 0.3, c.p.accent),
      fg(c, 700, 10),
    ],
  },

  // 10: Joab tegen de Syriërs en de Ammonieten: "Wees sterk, en laat ons sterk zijn voor ons volk"; de Syriërs vluchten
  '2-samuel-bijbelquiz-deel-10': {
    hue: 168,
    mood: 'storm',
    draw: (c) => {
      const s = 1.6;
      const hx = 430 + 80 * s * K;
      const hy = 540 - 103 * s * K;
      return [
        base(c, { sun: 'none', clouds: 3, far: 'dunes', horizon: 480 }),
        mirror(1000, horse(1000, 512, 0.7, c.p.mid) + chariot(1100, 512, 0.75, c.p.mid)),
        mirror(1180, horse(1180, 504, 0.55, c.p.mid, { opacity: 0.8 })),
        fig(280, 534, 1.25, c.p.near, 'shield'),
        fig(180, 528, 1.1, c.p.near, 'staff'),
        fig(430, 540, s, c.p.fore, 'reach'),
        sword(hx - 6, hy + 6, 1.0, c.p.accent, { rot: 58 }),
        fg(c, 694, 12),
      ];
    },
  },

  // 11: David schrijft een brief aan Joab en zendt die door de hand van Uria; David op het dak van zijn huis
  '2-samuel-bijbelquiz-deel-11': {
    hue: 170,
    mood: 'dusk',
    draw: (c) => {
      const wall = mix(c.a.mid, c.a.figure, 0.3);
      const s = 1.55;
      return [
        base(c, { sunX: 1190, sunY: 400, sunR: 54, far: 'none', ground: 'flat', horizon: 516 }),
        `<rect x="160" y="350" width="300" height="166" fill="${wall}"/>`,
        `<rect x="150" y="340" width="320" height="14" fill="${wall}"/>`,
        fig(330, 342, 1.0, c.p.fore, 'stand'),
        houseBlock(c.rand, 600, 516, 0.8, c.p.mid, { opacity: 0.75 }),
        tent(1110, 500, 0.45, c.p.far),
        tent(1190, 502, 0.42, c.p.far),
        smokeColumn(c.rand, 1150, 470, 0.9, c.p.fore),
        fig(820, 528, s, c.p.fore, 'walk'),
        scroll(820 + 46 * s * K + 20, 528 - 100 * s * K - 2, 0.55, c.p.accent),
        fg(c, 700, 10),
      ];
    },
  },

  // 12: Nathans gelijkenis van het ene ooilammetje: "Gij zijt die man!"; de kroon van Rabba op Davids hoofd
  '2-samuel-bijbelquiz-deel-12': {
    hue: 172,
    mood: 'warm',
    draw: (c) => {
      const ts = 1.2;
      const seat = 520 - 74 * ts;
      return [
        base(c, { sun: 'glow', sunX: 1040, sunY: 240, far: 'none', ground: 'flat', horizon: 520 }),
        columns(1220, 520, 1.6, c.p.near, 2),
        throne(930, 520, ts, mix(c.a.figure, c.a.near, 0.4)),
        fig(930, seat, 1.45, c.p.fore, 'sit'),
        crown(930, seat - 88 * 1.45 * 0.95 - 6, 0.3, c.p.accent),
        fig(560, 524, 1.6, c.p.fore, 'reach'),
        sheepAt(740, 528, 0.85, c.p.light, c.p.near),
        fg(c, 700, 10),
      ];
    },
  },

  // 13: het schaapscheerdersfeest van Absalom te Baäl-Hazor; de zonen des konings vluchten op hun muildieren
  '2-samuel-bijbelquiz-deel-13': {
    hue: 174,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 250, far: 'ridge', horizon: 482 }),
      blackTent(580, 528, 1.25, c.p.near),
      rect(470, 500, 200, 10, c.p.fore, { rx: 3 }),
      rect(486, 510, 8, 18, c.p.fore),
      rect(646, 510, 8, 18, c.p.fore),
      goblet(540, 500, 1.05, c.p.accent),
      goblet(610, 500, 0.95, c.p.accent),
      sheepAt(190, 540, 0.85, c.p.light, c.p.near),
      sheepAt(290, 548, 0.9, c.p.light, c.p.near),
      sheepAt(390, 542, 0.8, c.p.light, c.p.near),
      mirror(960, donkey(960, 540, 1.2, c.p.fore) + fig(960 - 2 * 1.56, 540 - 50 * 1.56, 1.02, c.p.fore, 'sit')),
      mirror(1170, donkey(1170, 528, 0.95, c.p.near) + fig(1170 - 2 * 1.235, 528 - 50 * 1.235, 0.8, c.p.near, 'sit')),
      fg(c, 694, 12),
    ],
  },

  // 14: Absalom laat Joabs gerstveld in brand steken; de wijze vrouw van Thekoa
  '2-samuel-bijbelquiz-deel-14': {
    hue: 176,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'ridge', horizon: 480 }),
      smokeColumn(c.rand, 900, 470, 1.6, c.p.fore),
      smokeColumn(c.rand, 1100, 470, 1.4, c.p.fore),
      wheat(820, 532, 0.85, c.p.crop, 8),
      wheat(1180, 528, 0.8, c.p.crop, 8),
      fireBed(c.rand, 1000, 534, 1.15, c.p.accent, 10),
      fig(420, 544, 1.6, c.p.fore, 'walk'),
      fig(600, 540, 1.5, c.p.fore, 'reach'),
      fg(c, 694, 12),
    ],
  },

  // 15: David gaat de Olijfberg op, het hoofd bedekt en barrevoets, al wenende; Zadok brengt de ark terug in de stad
  '2-samuel-bijbelquiz-deel-15': {
    hue: 178,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 230, sunY: 380, sunR: 50, far: 'none', horizon: 490 }),
      citySkyline(c.rand, 260, 470, 0.7, c.p.far, 5),
      cityWall(260, 494, 0.6, c.p.far, 300),
      fig(420, 516, 0.6, c.p.near, 'carry'),
      fig(500, 516, 0.6, c.p.near, 'carry'),
      ark(460, 516 - 150 * 0.6 * K + 36 * 0.5, 0.5, c.p.accent, { poles: true }),
      path(`M 560 ${H} L 600 540 C 700 470 860 400 1040 380 C 1200 366 1340 370 1440 372 L 1440 ${H} Z`, c.p.mid),
      tree(1180, 382, 0.85, c.p.near),
      tree(1320, 378, 0.75, c.p.near),
      fig(900, 420, 1.45, c.p.fore, 'carry'),
      fig(770, 472, 1.2, c.p.fore, 'walk'),
      fig(660, 518, 1.05, c.p.near, 'walk'),
      fg(c, 710, 10),
    ],
  },

  // 16: Simeï vloekt David en werpt met stenen en stof van de berghelling; "laat hem vloeken"
  '2-samuel-bijbelquiz-deel-16': {
    hue: 180,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'none', horizon: 490 }),
      path(`M 760 ${H} L 760 470 C 840 420 960 380 1080 376 C 1200 374 1320 380 1440 386 L 1440 ${H} Z`, c.p.mid),
      fig(1060, 384, 1.25, c.p.fore, 'raise'),
      circle(980, 300, 10, c.p.accent),
      circle(920, 340, 12, c.p.accent),
      circle(870, 300, 9, c.p.accent),
      circle(820, 360, 11, c.p.accent),
      cloudBank(c.rand, 960, 340, 0.6, c.p.light, { opacity: 0.4 }),
      fig(560, 544, 1.6, c.p.fore, 'walk', { flip: true }),
      fig(700, 540, 1.4, c.p.fore, 'stand'),
      sword(700 + 31 * 1.4 * K, 540 - 90 * 1.4 * K, 0.8, c.p.near, { rot: 20 }),
      fig(360, 538, 1.2, c.p.near, 'walk', { flip: true }),
      fg(c, 698, 12),
    ],
  },

  // 17: Jonathan en Ahimaaz verbergen zich in een put te Bahurim; de vrouw spreidt een deken erover met gort
  '2-samuel-bijbelquiz-deel-17': {
    hue: 182,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 270, sunY: 200, sunR: 38, far: 'ridge', horizon: 484 }),
      houseBlock(c.rand, 1150, 524, 1.15, c.p.near),
      coveredWell(720, 540, 1.75, c.p.near, c.p.accent),
      fig(540, 540, 1.5, c.p.fore, 'stand'),
      fig(950, 536, 1.4, c.p.fore, 'reach', { flip: true }),
      fig(1060, 530, 1.2, c.p.near, 'staff', { flip: true }),
      fg(c, 700, 10),
    ],
  },

  // 18: Absalom rijdt onder een grote eik door en blijft met zijn hoofd in de takken hangen; het muildier loopt onder hem weg
  '2-samuel-bijbelquiz-deel-18': {
    hue: 184,
    mood: 'day',
    draw: (c) => {
      const os = 1.9;
      const bx = 560 + 118 * os;
      const by = 540 - 96 * os;
      return [
        base(c, { sunX: 1200, sunY: 230, far: 'ridge', horizon: 482 }),
        oak(560, 540, os, c.p.near),
        stroke(`M ${bx - 60} ${by + 22} C ${bx - 50} ${by + 6} ${bx - 40} ${by} ${bx - 30} ${by - 4}`, c.p.accent, 6),
        stroke(`M ${bx - 52} ${by + 26} C ${bx - 40} ${by + 12} ${bx - 28} ${by + 6} ${bx - 18} ${by + 2}`, c.p.accent, 6),
        stroke(`M ${bx - 66} ${by + 30} C ${bx - 60} ${by + 16} ${bx - 52} ${by + 8} ${bx - 44} ${by + 2}`, c.p.accent, 5),
        fig(bx - 54, by + 166, 1.05, c.p.fore, 'raise'),
        mirror(1050, donkey(1050, 540, 1.05, c.p.fore)),
        fg(c, 694, 12),
      ];
    },
  },

  // 19: David keert terug; een veerschuit gaat over de Jordaan om des konings huisgezin over te zetten, de oude Barzillai neemt afscheid
  '2-samuel-bijbelquiz-deel-19': {
    hue: 186,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 350, sunR: 54, rays: true, far: 'ridge', ground: 'water', horizon: 476 }),
      path('M 900 500 C 1000 480 1200 474 1440 478 L 1440 506 C 1200 504 1000 510 900 512 Z', c.p.mid),
      crowd(c.rand, 1170, 500, 0.55, c.p.near, 7, 300),
      boat(720, 548, 1.7, c.p.accent, false),
      fig(650, 524, 0.95, c.p.fore, 'stand'),
      fig(720, 522, 1.0, c.p.fore, 'raise'),
      fig(790, 524, 0.9, c.p.fore, 'stand'),
      path(`M -20 560 C 120 540 300 548 420 590 C 470 610 490 680 500 ${H} L -20 ${H} Z`, c.p.mid),
      fig(300, 572, 1.5, c.p.fore, 'staff'),
      fg(c, 730, 10),
    ],
  },

  // 20: Joab belegert Abel-Beth-Maächa met een wal; een wijze vrouw roept van de muur
  '2-samuel-bijbelquiz-deel-20': {
    hue: 188,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 482 }),
      cityWall(1040, 528, 1.7, c.p.near, 480),
      fig(980, 528 - 60 * 1.7, 1.0, c.p.fore, 'reach', { flip: true }),
      path('M 560 540 C 640 520 720 480 800 448 L 820 540 Z', c.p.mid),
      fig(440, 540, 1.55, c.p.fore, 'stand'),
      banner(540, 544, 1.35, c.p.fore, c.p.accent),
      fig(300, 534, 1.2, c.p.near, 'shield'),
      fig(200, 528, 1.05, c.p.near, 'staff', { opacity: 0.9 }),
      fg(c, 694, 12),
    ],
  },

  // 21: Rizpa neemt een zak en spreidt die op de rots, van het begin van de gersteoogst tot het water van de hemel viel
  '2-samuel-bijbelquiz-deel-21': {
    hue: 190,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 260, far: 'dunes', horizon: 484 }),
      cloudBank(c.rand, 1140, 200, 1.2, c.p.fore, { opacity: 0.3 }),
      streaks(c.rand, 1000, 220, 300, 240, c.p.fore, 30, { opacity: 0.2 }),
      sheaf(250, 540, 0.9, c.p.crop),
      sheaf(350, 546, 0.8, c.p.crop),
      path('M 560 548 C 580 470 640 440 720 440 C 800 444 850 480 870 548 Z', c.p.mid),
      path('M 610 470 C 650 446 780 446 820 468 L 846 548 L 588 548 Z', c.p.accent),
      fig(720, 456, 1.3, c.p.fore, 'sit'),
      bird(900, 300, 2.2, c.p.fore, { opacity: 0.8 }),
      bird(980, 340, 1.8, c.p.fore, { opacity: 0.7 }),
      fg(c, 698, 12),
    ],
  },

  // 22: Davids lied: "De HEERE is mijn steenrots en mijn burg ... mijn God is mijn rots, mijn schild"; Hij trok mij op uit grote wateren
  '2-samuel-bijbelquiz-deel-22': {
    hue: 192,
    mood: 'dawn',
    draw: (c) => {
      const rock = mix(c.a.near, c.a.figure, 0.32);
      return [
        base(c, { sunX: 1060, sunY: 290, sunR: 58, rays: true, far: 'none', ground: 'swell', horizon: 520 }),
        `<path d="M 360 ${H} L 400 560 C 420 500 450 430 500 410 L 560 396 C 640 392 700 404 740 440 C 780 480 800 540 820 ${H} Z" fill="${rock}"/>`,
        fig(570, 404, 1.25, c.p.fore, 'raise'),
        shield(680, 372, 1.35, c.p.accent),
        rect(674, 392, 12, 14, rock),
        fg(c, 740, 10),
      ];
    },
  },

  // 23: drie helden halen water uit de put van Bethlehem; David giet het uit voor de HEERE
  '2-samuel-bijbelquiz-deel-23': {
    hue: 194,
    mood: 'warm',
    draw: (c) => {
      const s = 1.6;
      const hx = 600 + 80 * s * K;
      const hy = 540 - 103 * s * K;
      return [
        base(c, { sunX: 280, sunY: 250, far: 'ridge', horizon: 482 }),
        citySkyline(c.rand, 1230, 486, 0.5, c.p.far, 4, { opacity: 0.8 }),
        tent(1060, 494, 0.4, c.p.far),
        tent(1130, 498, 0.38, c.p.far),
        fig(600, 540, s, c.p.fore, 'reach'),
        jar(hx + 8, hy + 4, 1.1, c.p.accent, { rot: 120 }),
        stroke(`M ${hx + 40} ${hy + 24} C ${hx + 52} ${hy + 60} ${hx + 50} ${hy + 100} ${hx + 48} ${540}`, c.p.light, 6, { opacity: 0.7 }),
        fig(900, 544, 1.35, c.p.fore, 'kneel', { flip: true }),
        fig(1020, 540, 1.25, c.p.fore, 'kneel', { flip: true }),
        fig(1130, 536, 1.15, c.p.near, 'kneel', { flip: true }),
        fg(c, 696, 12),
      ];
    },
  },

  // 24: de engel strekt zijn hand uit over Jeruzalem; David bouwt een altaar op de dorsvloer van Arauna en de plaag houdt op
  '2-samuel-bijbelquiz-deel-24': {
    hue: 196,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1040, sunY: 240, far: 'ridge', horizon: 480 }),
      citySkyline(c.rand, 1060, 486, 0.75, c.p.far, 6),
      c.soft(1040, 320, 200, 0.4),
      angel(1040, 400, 0.95, c.p.light, { opacity: 0.9 }),
      sword(1040 + 50, 400 - 140 * 0.95 * K, 0.75, c.p.light, { rot: -50 }),
      ellipse(560, 548, 220, 26, c.p.mid, { opacity: 0.6 }),
      smokeColumn(c.rand, 560, 380, 1.1, c.p.fore),
      altar(560, 546, 1.3, c.p.near),
      flame(560, 426, 1.35, c.p.accent),
      fig(370, 550, 1.45, c.p.fore, 'kneelUp'),
      ox(780, 548, 0.8, c.p.near),
      fg(c, 698, 12),
    ],
  },
};
