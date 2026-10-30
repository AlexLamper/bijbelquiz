/**
 * Covers for the 2 Koningen series, one scene per quiz. Each quiz covers one
 * chapter: `2-koningen-bijbelquiz-deel-<n>` is chapter n (1-25).
 *
 * Base hue 70, drifting two degrees per chapter. See
 * `quiz-cover-scene-kit.mts` for the house style and
 * `quiz-cover-motifs-koningen-kron1.mts` for the extra motifs.
 *
 * Chapters: vuur van de hemel op de hoofdmannen, Elia zit op de berg (1); Elia
 * met een wagen van vuur ten hemel, Elisa en de mantel (2); de groeven vol
 * water, rood als bloed in de morgenzon (3); de olie van de weduwe vult alle
 * vaten (4); Naaman dompelt zich zevenmaal in de Jordaan (5); het ijzer van
 * de bijl drijft (6); de vier melaatsen in de verlaten legerplaats (7);
 * Hazael met veertig kamelen, Elisa weent (8); Jehu rijdt onzinnig naar
 * Jizreel, Izebel aan het venster (9); Jehu breekt de Baalstempel af (10); de
 * kleine Joas gekroond bij de pilaar (11); de kist met het gat in het deksel
 * (12); de pijl des heils door het oostvenster (13); de distel en de ceder
 * (14); de kronen vallen: snelle troonswisselingen in Israel (15); Achaz' nieuwe
 * altaar naar het voorbeeld uit Damascus (16); Samaria valt, Israel in
 * ballingschap (17); Hizkia vermaalt de koperen slang (18); Hizkia spreidt de
 * brief uit voor de HEERE (19); de schaduw gaat tien treden terug (20);
 * Manasse's altaren voor het heir des hemels (21); het wetboek gevonden in het
 * huis des HEEREN (22); Josia breekt het altaar te Bethel af en verbrandt het
 * Asherabeeld (23); de vaten van het huis des HEEREN naar Babel (24); Jeruzalem
 * en de tempel verbrand (25).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  chariot,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  coin,
  crowd,
  crown,
  donkey,
  ellipse,
  fireBed,
  flame,
  goblet,
  horse,
  houseBlock,
  lamp,
  palm,
  path,
  person,
  rays,
  rect,
  rotate,
  scroll,
  shafts,
  shrub,
  smokeColumn,
  stars,
  streaks,
  stump,
  templeFront,
  tent,
  throne,
  tower,
  trail,
  tree,
  water,
  window as windowFrame,
  ziggurat,
  brickWall,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  arrow,
  axeHead,
  bed,
  bow,
  brokenColumn,
  bronzePillar,
  camel,
  campTent,
  cedar,
  figureAt,
  idol,
  ingots,
  jar,
  lying,
  mantle,
  mirror,
  moon,
  offeringChest,
  personLeft,
  pitcher,
  ripples,
  roundShield,
  royalThrone,
  rubble,
  scaffold,
  serpentPole,
  solomonTemple,
  spear,
  steps,
  stoneBlock,
  thistle,
  wallTone,
  wallWithWindow,
  whirlwind,
} from './quiz-cover-motifs-koningen-kron1.mjs';

export const KONINGEN2_SCENES: Record<string, Scene> = {
  // 1: "Ben ik een man Gods, zo dale vuur van den hemel" - Elia zit op de top van de berg, de derde hoofdman knielt
  '2-koningen-bijbelquiz-deel-1': {
    hue: 70,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 480, sunY: 150, clouds: 3, far: 'none', horizon: 480 }),
      path('M 760 500 C 860 400 960 330 1080 322 C 1200 320 1300 380 1440 500 Z', c.p.mid),
      person(1080, 346, 1.35, c.p.fore, 'sit'),
      shafts(480, 80, 160, 420, c.p.light, 4),
      smokeColumn(c.rand, 480, 400, 1.4, c.p.fore),
      c.soft(480, 470, 190, 0.5, c.p.accent),
      fireBed(c.rand, 480, 530, 1.5, c.p.accent, 7),
      rotate(-70, 640, 546, spear(640, 546, 0.8, c.p.near)),
      person(820, 544, 1.5, c.p.fore, 'bow'),
      person(240, 540, 1.1, c.p.near, 'walk', { opacity: 0.8 }),
      fg(c, 696, 14),
    ],
  },

  // 2: "Mijn vader, mijn vader! wagen Israels en zijn ruiters!" - Elia met een vurige wagen in een onweder ten hemel
  '2-koningen-bijbelquiz-deel-2': {
    hue: 72,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 920, sunY: 210, rays: true, far: 'ridge', horizon: 476 }),
      c.soft(920, 250, 320, 0.5, c.p.accent),
      whirlwind(760, 520, 250, 1.1, c.p.light),
      fireBed(c.rand, 1040, 290, 0.7, c.p.accent, 5),
      horse(800, 270, 1.2, c.p.accent),
      chariot(1000, 270, 1.25, c.p.accent),
      fireBed(c.rand, 700, 280, 0.5, c.p.accent, 3),
      rotate(-20, 570, 350, mantle(570, 350, 1.05, c.p.near)),
      person(370, 544, 1.6, c.p.fore, 'raise'),
      fg(c, 696, 14),
    ],
  },

  // 3: "De Moabieten zagen het water tegenover zich zo rood als bloed" - de groeven in het dal in de morgenzon
  '2-koningen-bijbelquiz-deel-3': {
    hue: 74,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 420, sunR: 70, rays: true, far: 'ridge', horizon: 470 }),
      ...[0, 1, 2, 3].map((i) => ellipse(560 + i * 40, 500 + i * 26, 120 + i * 50, 7 + i * 3, c.p.accent, { opacity: 0.9 })),
      ...[0, 1, 2].map((i) => ellipse(380 + i * 30, 520 + i * 30, 80 + i * 40, 6 + i * 3, c.p.accent, { opacity: 0.85 })),
      campTent(220, 482, 0.55, c.p.near, undefined, { opacity: 0.7 }),
      campTent(350, 478, 0.45, c.p.near, undefined, { opacity: 0.65 }),
      path('M 900 560 C 980 440 1100 400 1220 404 C 1320 408 1380 440 1440 470 L 1440 560 Z', c.p.mid),
      personLeft(1080, 420, 1.25, c.p.fore, 'point'),
      person(1180, 416, 1.15, c.p.fore, 'stand'),
      spear(1220, 424, 0.75, c.p.fore),
      fg(c, 700, 12),
    ],
  },

  // 4: "Giet in al die vaten" - de olie van de weduwe houdt niet op tot alle geleende vaten vol zijn
  '2-koningen-bijbelquiz-deel-4': {
    hue: 76,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 260, far: 'none', ground: 'flat', horizon: 520 }),
      houseBlock(c.rand, 1170, 520, 1.3, c.p.near, { opacity: 0.85 }),
      jar(720, 534, 1.05, c.p.accent),
      jar(840, 530, 0.95, c.p.accent),
      jar(940, 534, 0.9, c.p.accent),
      jar(1020, 522, 0.75, c.p.accent, { opacity: 0.85 }),
      jar(610, 534, 0.72, c.p.accent),
      person(450, 536, 1.55, c.p.fore, 'carry'),
      rotate(45, 452, 482, pitcher(452, 482, 1.1, c.p.fore)),
      path('M 528 448 C 540 452 556 456 600 466', 'none').replace('fill="none"', `fill="none" stroke="${c.p.accent}" stroke-width="6" stroke-linecap="round"`),
      person(1120, 540, 1.1, c.p.fore, 'carry'),
      jar(1120, 466, 0.5, c.p.accent),
      fg(c, 694, 12),
    ],
  },

  // 5: "Toen ging hij af en doopte zich zevenmaal in de Jordaan" - Naaman in het water, zijn wagen aan de oever
  '2-koningen-bijbelquiz-deel-5': {
    hue: 78,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1100, sunY: 260, rays: true, far: 'dunes', ground: 'water', horizon: 470 }),
      path(`M 880 530 C 960 490 1100 476 1260 478 C 1340 480 1400 486 ${W + 40} 490 L ${W + 40} ${H} L 860 ${H} Z`, c.p.mid),
      palm(1250, 488, 1.0, c.p.near),
      horse(980, 508, 0.9, c.p.fore),
      chariot(1110, 508, 0.95, c.p.fore),
      person(1210, 512, 1.0, c.p.fore, 'stand'),
      person(620, 600, 1.55, c.p.fore, 'raise'),
      rect(380, 520, 500, 140, c.p.water),
      ripples(620, 522, 1.2, c.p.accent, 4),
      water(c.rand, 548, c.p.water, c.p.crest, 3),
    ],
  },

  // 6: "Hij hieuw een hout af, en wierp het daarin, en deed het ijzer zwemmen"
  '2-koningen-bijbelquiz-deel-6': {
    hue: 80,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 230, far: 'dunes', ground: 'water', horizon: 470 }),
      path(`M -40 470 C 100 460 260 470 400 500 C 460 514 480 560 500 ${H} L -40 ${H} Z`, c.p.mid),
      tree(170, 474, 1.2, c.p.near),
      stump(330, 506, 0.7, c.p.near),
      person(420, 524, 1.55, c.p.fore, 'point'),
      ripples(800, 528, 1.0, c.p.light, 3),
      rotate(-6, 650, 536, rect(590, 532, 120, 9, c.p.fore, { rx: 4 })),
      axeHead(820, 506, 1.3, c.p.accent, c.p.fore),
      person(260, 506, 1.15, c.p.fore, 'raise'),
      water(c.rand, 566, c.p.water, c.p.crest, 2),
    ],
  },

  // 7: De vier melaatse mannen komen in de legerplaats der Syriers en zie, daar was niemand - zilver, goud en klederen
  '2-koningen-bijbelquiz-deel-7': {
    hue: 82,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 230, sunY: 360, sunR: 60, far: 'dunes', horizon: 476 }),
      campTent(1220, 500, 0.9, c.p.near, c.p.fore),
      campTent(820, 490, 0.7, c.p.near, c.p.fore, { opacity: 0.85 }),
      campTent(1030, 530, 1.25, c.p.near, c.p.fore),
      horse(700, 510, 0.75, c.p.near),
      donkey(1260, 540, 0.7, c.p.near, { opacity: 0.9 }),
      goblet(930, 548, 1.1, c.p.accent),
      coin(990, 546, 1.0, c.p.accent),
      coin(1018, 550, 1.0, c.p.accent),
      coin(1004, 530, 1.0, c.p.accent),
      ingots(1100, 554, 0.55, c.p.accent),
      person(320, 544, 1.35, c.p.fore, 'walk'),
      person(430, 548, 1.25, c.p.fore, 'walk'),
      person(530, 544, 1.2, c.p.fore, 'walk'),
      person(630, 548, 1.3, c.p.fore, 'point'),
      fg(c, 698, 12),
    ],
  },

  // 8: Hazael komt met een geschenk, een last van veertig kemelen; de man Gods weent
  '2-koningen-bijbelquiz-deel-8': {
    hue: 84,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 240, far: 'dunes', horizon: 472 }),
      citySkyline(c.rand, 1150, 470, 0.7, c.p.far, 6, { opacity: 0.7 }),
      camel(1080, 520, 0.8, c.p.near, c.p.accent, { opacity: 0.85 }),
      camel(900, 530, 1.0, c.p.fore, c.p.accent),
      personLeft(720, 538, 1.45, c.p.fore, 'point'),
      person(420, 540, 1.4, c.p.fore, 'bow'),
      tree(240, 520, 1.1, c.p.near),
      fg(c, 694, 14),
    ],
  },

  // 9: "Het rijden is als het rijden van Jehu, want hij rijdt onzinnig" - de wachter op de toren van Jizreel, Izebel aan het venster
  '2-koningen-bijbelquiz-deel-9': {
    hue: 86,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 220, far: 'dunes', horizon: 476 }),
      cloudBank(c.rand, 300, 470, 1.4, '#FFFFFF', { opacity: 0.8 }),
      cloudBank(c.rand, 420, 500, 1.0, '#FFFFFF', { opacity: 0.7 }),
      horse(600, 520, 1.1, c.p.fore),
      chariot(760, 520, 1.1, c.p.fore),
      person(760, 456, 0.85, c.p.fore, 'point'),
      tower(1120, 530, 1.9, c.p.near),
      windowFrame(1120, 430, 0.85, c.p.near, c.p.accent),
      person(1120, 232, 0.55, c.p.fore, 'point'),
      fg(c, 694, 14),
    ],
  },

  // 10: Jehu roeit de Baal uit: het opgerichte beeld van Baal verbrand, het huis van Baal afgebroken
  '2-koningen-bijbelquiz-deel-10': {
    hue: 88,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 230, clouds: 2, far: 'ridge', horizon: 480 }),
      rotate(6, 640, 500, templeFront(640, 500, 1.6, c.p.near, 6)),
      brokenColumn(420, 520, 1.2, c.p.near),
      rubble(c.rand, 640, 520, 420, 1.2, c.p.near, 10),
      smokeColumn(c.rand, 920, 320, 1.4, c.p.fore),
      c.soft(920, 470, 150, 0.45, c.p.accent),
      idol(920, 530, 1.05, c.p.near),
      fireBed(c.rand, 920, 532, 1.1, c.p.accent, 6),
      personLeft(1150, 540, 1.45, c.p.fore, 'point'),
      fg(c, 694, 14),
    ],
  },

  // 11: Jojada brengt de zevenjarige Joas voort, zet hem de kroon op: "Leve de koning!" - hij staat bij de pilaar
  '2-koningen-bijbelquiz-deel-11': {
    hue: 90,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'flat', horizon: 512 }),
      solomonTemple(704, 500, 0.9, c.p.near, c.p.fore, { pillars: false }),
      bronzePillar(520, 528, 1.0, c.p.fore),
      c.soft(660, 380, 160, 0.45),
      person(640, 530, 0.95, c.p.fore, 'stand'),
      crown(640, 380, 0.45, c.p.accent),
      person(780, 532, 1.45, c.p.fore, 'raise'),
      person(330, 540, 1.3, c.p.fore, 'stand'),
      spear(372, 548, 0.95, c.p.fore),
      roundShield(310, 460, 1.0, c.p.fore),
      person(1080, 540, 1.3, c.p.fore, 'stand'),
      spear(1038, 548, 0.95, c.p.fore),
      roundShield(1100, 460, 1.0, c.p.fore),
      fg(c, 694, 12),
    ],
  },

  // 12: Jojada nam een kist en boorde een gat in het deksel, en zette die bij het altaar - het geld voor het herstel van het huis
  '2-koningen-bijbelquiz-deel-12': {
    hue: 92,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      solomonTemple(1060, 512, 0.85, c.p.near, c.p.fore),
      scaffold(1060, 512, 300, 210, 1, c.p.fore, { opacity: 0.55 }),
      offeringChest(600, 532, 1.3, c.p.near, c.p.fore),
      coin(560, 380, 1.0, c.p.accent),
      coin(600, 400, 0.85, c.p.accent),
      coin(630, 360, 0.9, c.p.accent),
      person(420, 536, 1.5, c.p.fore, 'point'),
      person(780, 534, 1.35, c.p.fore, 'stand'),
      fg(c, 694, 12),
    ],
  },

  // 13: "Doe het venster open tegen het oosten ... Schiet! ... de pijl des heils des HEEREN" - Elisa legt zijn handen op des konings handen
  '2-koningen-bijbelquiz-deel-13': {
    hue: 94,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 330, sunR: 60, rays: true, far: 'ridge', horizon: 476 }),
      arrow(1180, 300, 1.4, c.p.accent),
      wallWithWindow(wallTone(c.p.mid), 820, 210, 400, 330),
      c.soft(980, 420, 420, 0.35),
      rect(-100, 590, 1600, 300, wallTone(c.p.near)),
      path('M 820 590 L 1220 590 L 1100 760 L 600 760 Z', '#FFFFFF', { opacity: 0.16 }),
      rect(800, 532, 440, 18, c.p.near),
      figureAt(430, 598, 1.5, c.p.fore, 'staff'),
      person(650, 600, 1.6, c.p.fore, 'point'),
      bow(732, 416, 1.1, c.p.fore, ''),
    ],
  },

  // 14: "De distel die op de Libanon is, zond tot den ceder" - Joas' gelijkenis tegen Amazia
  '2-koningen-bijbelquiz-deel-14': {
    hue: 96,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, far: 'ridge', horizon: 470 }),
      cedar(1180, 476, 0.9, c.p.near, { opacity: 0.8 }),
      cedar(920, 520, 1.6, c.p.fore),
      thistle(520, 546, 1.35, c.p.fore, c.p.accent),
      thistle(400, 550, 0.8, c.p.fore, c.p.accent, { opacity: 0.85 }),
      fg(c, 696, 12),
    ],
  },

  // 15: Zacharia, Sallum, Menahem, Pekahja, Pekah - de kronen van Israel vallen de een na de ander
  '2-koningen-bijbelquiz-deel-15': {
    hue: 98,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 200, clouds: 3, far: 'none', ground: 'flat', horizon: 520 }),
      rect(470, 500, 468, 20, c.p.near),
      rect(510, 480, 388, 20, c.p.near),
      rect(550, 460, 308, 20, c.p.near),
      royalThrone(704, 462, 1.2, c.p.near),
      rotate(-20, 600, 446, crown(600, 446, 0.58, c.p.accent)),
      rotate(30, 812, 468, crown(812, 468, 0.58, c.p.accent)),
      rotate(-50, 450, 484, crown(450, 484, 0.58, c.p.accent)),
      rotate(70, 980, 506, crown(980, 506, 0.58, c.p.accent)),
      rotate(-96, 290, 524, crown(290, 524, 0.58, c.p.accent)),
      fg(c, 694, 12),
    ],
  },

  // 16: Koning Achaz zendt het voorbeeld van het altaar te Damaskus; het koperen altaar wordt opzij gezet
  '2-koningen-bijbelquiz-deel-16': {
    hue: 100,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 260, far: 'none', ground: 'flat', horizon: 512 }),
      solomonTemple(330, 512, 0.75, c.p.near, c.p.fore, { opacity: 0.85 }),
      rect(560, 512, 280, 16, c.p.near),
      altar(700, 512, 1.55, c.p.accent),
      smokeColumn(c.rand, 700, 360, 1.1, c.p.fore),
      altar(1060, 532, 0.85, c.p.near),
      person(920, 538, 1.4, c.p.fore, 'point'),
      scroll(1000, 420, 0.4, c.p.light),
      fg(c, 694, 12),
    ],
  },

  // 17: Samaria ingenomen; de koning van Assyrie voert Israel weg naar Halah, Habor en de steden der Meden
  '2-koningen-bijbelquiz-deel-17': {
    hue: 102,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1000, sunY: 230, sunR: 62, far: 'dunes', horizon: 476 }),
      path('M -40 500 C 60 400 160 360 300 356 C 440 360 520 420 600 500 Z', c.p.mid),
      citySkyline(c.rand, 300, 360, 0.7, c.p.near, 5),
      cityWall(300, 380, 0.7, c.p.near, 260),
      smokeColumn(c.rand, 280, 270, 1.4, c.p.fore),
      person(560, 538, 1.2, c.p.fore, 'walk'),
      person(680, 542, 1.25, c.p.fore, 'walk'),
      person(800, 540, 1.2, c.p.fore, 'walk'),
      person(920, 544, 1.15, c.p.fore, 'walk'),
      path('M 580 448 Q 640 470 700 450 Q 760 470 822 448 Q 880 470 940 452', 'none').replace('fill="none"', `fill="none" stroke="${c.p.accent}" stroke-width="6" stroke-linecap="round"`),
      person(1080, 540, 1.35, c.p.fore, 'walk'),
      spear(1124, 548, 1.0, c.p.fore),
      fg(c, 694, 14),
    ],
  },

  // 18: Hizkia vermaalt de koperen slang die Mozes gemaakt had, want de kinderen Israels rookten haar
  '2-koningen-bijbelquiz-deel-18': {
    hue: 104,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 230, far: 'ridge', horizon: 476 }),
      citySkyline(c.rand, 1140, 476, 0.7, c.p.far, 5, { opacity: 0.7 }),
      rotate(26, 720, 540, serpentPole(720, 540, 1.35, c.p.near, c.p.accent)),
      rubble(c.rand, 760, 548, 180, 1, c.p.near, 6),
      person(470, 544, 1.55, c.p.fore, 'raise'),
      rotate(-30, 440, 300, rect(436, 250, 10, 70, c.p.fore) + rect(416, 242, 50, 22, c.p.fore, { rx: 4 })),
      person(1010, 540, 1.1, c.p.fore, 'bow'),
      fg(c, 694, 14),
    ],
  },

  // 19: Hizkia nam de brieven van Sanherib, ging op in het huis des HEEREN en spreidde ze uit voor het aangezicht des HEEREN
  '2-koningen-bijbelquiz-deel-19': {
    hue: 106,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 240, sunY: 220, sunR: 46, far: 'dunes', ground: 'flat', horizon: 512 }),
      moon(240, 220, 30, c.p.light),
      ...[1080, 1190, 1290].map((tx) => campTent(tx, 476, 0.4, c.p.far, undefined, { opacity: 0.8 })),
      solomonTemple(860, 512, 0.9, c.p.near, c.p.light),
      c.soft(860, 440, 180, 0.45),
      shafts(860, 420, 160, 130, c.p.light, 3),
      scroll(650, 524, 0.95, c.p.accent),
      person(470, 542, 1.6, c.p.fore, 'kneel'),
      fg(c, 694, 12),
    ],
  },

  // 20: "Zie, Ik doe de schaduw ... tien graden achterwaarts wederkeren" - het teken aan de zonnewijzer van Achaz
  '2-koningen-bijbelquiz-deel-20': {
    hue: 108,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', ground: 'flat', horizon: 520 }),
      rays(c.rand, 300, 230, 260, c.p.accent, 14, { opacity: 0.18 }),
      c.soft(300, 230, 160, 0.5, c.p.accent),
      circle(300, 230, 44, c.p.accent),
      steps(640, 530, 1.0, c.p.near, 10),
      rect(1022, 266, 20, 84, c.p.fore),
      path('M 1022 350 L 1040 350 L 760 512 L 720 530 L 700 530 Z', c.p.fore, { opacity: 0.35 }),
      bed(380, 540, 1.05, c.p.near),
      lying(392, 496, 1.0, c.p.fore),
      person(560, 544, 1.35, c.p.fore, 'point'),
      fg(c, 694, 12),
    ],
  },

  // 21: Manasse bouwt altaren voor het ganse heir des hemels in de beide voorhoven van het huis des HEEREN
  '2-koningen-bijbelquiz-deel-21': {
    hue: 110,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 520, stars: 80 }),
      stars(c.rand, 30, c.p.light, 300),
      solomonTemple(1080, 520, 0.8, c.p.near, c.p.fore, { opacity: 0.85 }),
      idol(860, 528, 1.0, c.p.near),
      altar(420, 532, 1.0, c.p.near),
      fireBed(c.rand, 420, 456, 0.7, c.p.accent, 4),
      smokeColumn(c.rand, 420, 380, 1.2, c.p.light),
      altar(660, 526, 0.8, c.p.near),
      fireBed(c.rand, 660, 466, 0.55, c.p.accent, 3),
      smokeColumn(c.rand, 660, 400, 1.0, c.p.light),
      person(260, 540, 1.45, c.p.fore, 'raise'),
      fg(c, 694, 12),
    ],
  },

  // 22: "Ik heb het wetboek gevonden in het huis des HEEREN" - Safan leest het voor de koning, Josia scheurt zijn klederen
  '2-koningen-bijbelquiz-deel-22': {
    hue: 112,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      solomonTemple(1040, 512, 0.9, c.p.near, c.p.fore),
      scaffold(1040, 512, 320, 230, 1, c.p.fore, { opacity: 0.5 }),
      stoneBlock(800, 530, 0.9, c.p.near),
      stoneBlock(870, 534, 0.7, c.p.near, { opacity: 0.9 }),
      person(620, 536, 1.5, c.p.fore, 'carry'),
      scroll(620, 420, 0.8, c.p.accent),
      person(360, 542, 1.55, c.p.fore, 'bow'),
      crown(352, 452, 0.3, c.p.fore),
      fg(c, 694, 12),
    ],
  },

  // 23: Josia breekt het altaar te Bethel af en verbrandt het Asherabeeld - zoals de man Gods uit Juda had gezegd
  '2-koningen-bijbelquiz-deel-23': {
    hue: 114,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 360, sunR: 60, far: 'ridge', horizon: 476 }),
      rotate(-12, 560, 530, altar(560, 530, 1.3, c.p.near)),
      rubble(c.rand, 600, 540, 260, 1.2, c.p.near, 9),
      smokeColumn(c.rand, 860, 320, 1.4, c.p.fore),
      c.soft(860, 450, 150, 0.45, c.p.accent),
      rotate(-14, 860, 530, rect(852, 330, 16, 200, c.p.near)),
      fireBed(c.rand, 860, 534, 1.2, c.p.accent, 6),
      person(330, 540, 1.5, c.p.fore, 'point'),
      crown(330, 302, 0.3, c.p.fore),
      person(1080, 544, 1.2, c.p.fore, 'carry'),
      fg(c, 694, 14),
    ],
  },

  // 24: Nebukadnezar voert alle schatten van het huis des HEEREN weg naar Babel, met de koning en de werklieden
  '2-koningen-bijbelquiz-deel-24': {
    hue: 116,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 280, far: 'dunes', horizon: 474 }),
      ziggurat(1140, 474, 0.9, c.p.far, 4, { opacity: 0.7 }),
      cityWall(220, 520, 1.0, c.p.near, 260),
      trail(700, H, 1100, 476, 200, c.p.light, { opacity: 0.3 }),
      person(480, 540, 1.35, c.p.fore, 'carry'),
      goblet(480, 446, 1.1, c.p.accent),
      person(640, 536, 1.3, c.p.fore, 'carry'),
      jar(640, 456, 0.62, c.p.accent),
      person(800, 538, 1.25, c.p.fore, 'carry'),
      goblet(800, 450, 0.9, c.p.accent),
      person(950, 532, 1.2, c.p.fore, 'walk'),
      spear(994, 540, 0.9, c.p.fore),
      fg(c, 694, 14),
    ],
  },

  // 25: Nebuzaradan verbrandt het huis des HEEREN en breekt de muren van Jeruzalem af; het volk wordt weggevoerd
  '2-koningen-bijbelquiz-deel-25': {
    hue: 118,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 480 }),
      smokeColumn(c.rand, 760, 220, 2.2, c.p.light),
      c.soft(760, 380, 300, 0.45, c.p.accent),
      cityWall(760, 480, 1.3, c.p.near, 620),
      citySkyline(c.rand, 760, 400, 1.0, c.p.near, 7),
      fireBed(c.rand, 760, 350, 1.6, c.p.accent, 9),
      rubble(c.rand, 560, 492, 200, 1.3, c.p.near, 7),
      brokenColumn(360, 530, 1.1, c.p.fore),
      person(1000, 548, 1.15, c.p.fore, 'walk'),
      person(1110, 550, 1.1, c.p.fore, 'walk'),
      person(1220, 548, 1.2, c.p.fore, 'walk'),
      fg(c, 698, 12),
    ],
  },
};
