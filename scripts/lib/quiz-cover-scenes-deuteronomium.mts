/**
 * Covers for the Deuteronomium series, one scene per quiz. Each quiz covers
 * one chapter: `deuteronomium-bijbelquiz-deel-<n>` is chapter n (1-34).
 *
 * Base hue 60, drifting two degrees per chapter (chapter 34 lands on 126).
 * See `quiz-cover-scene-kit.mts` for the house style; motifs this book needs
 * beyond the shared primitives live in `quiz-cover-motifs-deut-jozua.mts`.
 *
 * Chapters: Kades-Barnea, de verspieders met de druiventros (1); de tocht om
 * het gebergte Seir (2); het ijzeren ledikant van Og (3); de berg die brandde
 * met vuur (4); de tien geboden (5); "Hoor, Israel", de woorden aan uw kinderen
 * (6); de afgoden met vuur verbrand (7); het goede land, eten, verzadigd zijn
 * en de HEERE loven (8); het gouden kalf en de verbroken tafelen (9); de ark
 * van sittimhout voor de nieuwe tafelen (10); Gerizim en Ebal, zegen en vloek
 * (11); het altaar op de plaats die de HEERE verkiest (12); de valse profeet
 * met een teken (13); reine dieren en de tienden (14); de vrijgelaten knecht
 * met geschenken (15); het loofhuttenfeest (16); de koning met een afschrift
 * van de wet (17); een Profeet als Mozes (18); de landpaal en de vrijsteden
 * (19); de vruchtbomen bij een beleg sparen (20); de oudsten wassen hun
 * handen bij de beek (21); het vogelnest op de weg (22); druiven eten in de
 * wijngaard van de naaste (23); de vergeten schoof voor wees en weduwe (24);
 * een volkomen weegschaal (25); de mand met eerstelingen (26); de gekalkte
 * stenen en het altaar op Ebal (27); zegen en vloek (28); allen staan voor de
 * HEERE in Moab (29); kies het leven (30); Jozua aangesteld bij de tent en de
 * wolkkolom (31); het lied van Mozes, de arend die zijn nest opwekt (32);
 * Mozes zegent de stammen (33); Mozes ziet het land vanaf de Nebo (34).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  banner,
  basket,
  chainLinks,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  colossus,
  columns,
  crowd,
  crown,
  cypress,
  donkey,
  dove,
  ellipse,
  fireBed,
  forkedRoad,
  goat,
  grapes,
  houseBlock,
  loaf,
  ox,
  palm,
  path,
  person,
  ram,
  rect,
  river,
  rotate,
  scroll,
  sheaf,
  shafts,
  smokeColumn,
  streaks,
  stump,
  swarm,
  tablets,
  tent,
  throne,
  trail,
  tree,
  vineRow,
  wheat,
  window as windowFrame,
  witheredPlant,
} from './quiz-cover-primitives.mjs';
import {
  arkOfCovenant,
  axe,
  bedstead,
  bigCluster,
  booth,
  cloudPillar,
  comet,
  deadTree,
  deer,
  eagle,
  figureA,
  fruitIn,
  hamlet,
  hornedAltar,
  jar,
  kneelA,
  moon,
  nest,
  scales,
  sheepA,
  stele,
  stoneAltar,
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

export const DEUTERONOMIUM_SCENES: Record<string, Scene> = {
  // 1: Kades-Barnea - two spies bring the great cluster from the land; the people will not go up to the walled cities
  'deuteronomium-bijbelquiz-deel-1': {
    hue: 60,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 236, far: 'dunes', horizon: 474 }),
      citySkyline(c.rand, 1090, 470, 0.75, c.p.far, 5, { opacity: 0.75 }),
      cityWall(1090, 476, 0.8, c.p.far, 300, { opacity: 0.7 }),
      crowd(c.rand, 270, 526, 0.85, c.p.near, 4, 170),
      person(560, 528, 1.3, c.p.fore, 'carry'),
      person(820, 528, 1.3, c.p.fore, 'carry'),
      rect(520, 396, 340, 9, c.p.fore, { rx: 4 }),
      bigCluster(690, 400, 1.15, c.p.accent),
      fg(c, 684, 16),
    ],
  },

  // 2: "Gij hebt dit gebergte lang genoeg omgetogen" - the column of Israel along the mountains of Seir, the banner ahead
  'deuteronomium-bijbelquiz-deel-2': {
    hue: 62,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 250, rays: true, far: 'ridge', horizon: 470 }),
      trail(1060, H, 420, 470, 150, c.p.light, { opacity: 0.35 }),
      person(560, 488, 0.7, c.p.near, 'walk', { opacity: 0.85 }),
      person(640, 496, 0.8, c.p.near, 'walk'),
      person(740, 508, 0.95, c.p.fore, 'walk'),
      donkey(900, 530, 1.0, c.p.near),
      ellipse(910, 462, 36, 20, c.p.mid),
      person(1110, 556, 1.35, c.p.fore, 'walk'),
      banner(1150, 556, 1.15, c.p.fore, c.p.accent),
      fg(c, 688, 12),
    ],
  },

  // 3: "Zijn ledikant was een ijzeren ledikant ... negen ellen zijn lengte" - Og's iron bed, a man beside it for scale
  'deuteronomium-bijbelquiz-deel-3': {
    hue: 64,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1130, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      cityWall(1120, 512, 0.9, c.p.mid, 320, { opacity: 0.6 }),
      bedstead(610, 524, 1.25, c.p.fore, c.p.near),
      crown(540, 396, 0.55, c.p.accent),
      person(990, 528, 1.25, c.p.fore, 'point'),
      fg(c, 686, 14),
    ],
  },

  // 4: "De berg brandde met vuur tot in het hart des hemels, duisternis, wolk en donkerheid" - the people at the foot of Horeb
  'deuteronomium-bijbelquiz-deel-4': {
    hue: 66,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 512 }),
      cloudBank(c.rand, 760, 190, 1.8, c.p.fore, { opacity: 0.45 }),
      path('M 330 516 C 470 430 610 320 720 278 C 760 262 800 264 840 282 C 960 340 1090 440 1220 516 Z', c.p.mid),
      c.soft(770, 260, 260, 0.5, c.p.accent),
      fireBed(c.rand, 772, 304, 1.9, c.p.accent, 6),
      crowd(c.rand, 704, 566, 1.0, c.p.fore, 10, 820),
      fg(c, 696, 10),
    ],
  },

  // 5: the ten words repeated - Moses holds up the two tablets of stone before the new generation
  'deuteronomium-bijbelquiz-deel-5': {
    hue: 68,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 110, rays: true, far: 'ridge', horizon: 478 }),
      ellipse(704, 548, 250, 70, c.p.near),
      c.soft(704, 300, 170, 0.4),
      figureA(704, 494, 1.35, c.p.fore, 'raise'),
      tablets(704, 312, 0.78, c.p.accent),
      crowd(c.rand, 290, 566, 0.9, c.p.near, 5, 300),
      crowd(c.rand, 1120, 566, 0.9, c.p.near, 5, 300),
      fg(c, 694, 10),
    ],
  },

  // 6: "Hoor, Israel ... deze woorden zult gij uw kinderen inscherpen" - father and child at the door, the words on the doorpost
  'deuteronomium-bijbelquiz-deel-6': {
    hue: 70,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 300, sunR: 60, far: 'dunes', horizon: 492 }),
      rect(290, 300, 380, 230, c.p.near),
      rect(272, 286, 416, 18, c.p.near),
      rect(420, 372, 100, 158, c.p.glow, { opacity: 0.85 }),
      rect(406, 362, 14, 168, c.p.fore),
      rect(520, 362, 14, 168, c.p.fore),
      rect(400, 352, 140, 14, c.p.fore),
      c.soft(470, 450, 120, 0.3),
      figureA(760, 532, 1.35, c.p.fore, 'reach'),
      scroll(890, 420, 0.82, c.p.accent),
      person(990, 534, 0.95, c.p.fore, 'sit'),
      fg(c, 688, 12),
    ],
  },

  // 7: "Hun gesneden beelden zult gij met vuur verbranden" - the pillars of the high place thrown down, the idols in the fire
  'deuteronomium-bijbelquiz-deel-7': {
    hue: 72,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1130, sunY: 220, sunR: 46, far: 'ridge', horizon: 480 }),
      moon(1130, 220, 32, c.p.light),
      ellipse(650, 548, 330, 74, c.p.mid),
      path('M 330 524 L 330 400 L 342 386 L 352 398 L 366 380 L 378 392 L 378 524 Z', c.p.near),
      rect(392, 494, 176, 32, c.p.near, { rx: 6 }),
      stump(250, 530, 1.1, c.p.near),
      smokeColumn(c.rand, 660, 420, 1.6, c.p.light),
      c.soft(660, 460, 190, 0.4, c.p.accent),
      fireBed(c.rand, 660, 510, 1.5, c.p.accent, 7),
      rect(616, 470, 22, 44, c.p.fore, { rx: 4 }),
      rect(686, 478, 24, 36, c.p.fore, { rx: 4 }),
      figureA(950, 536, 1.35, c.p.fore, 'reach', { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 8: "Als gij zult gegeten hebben en verzadigd zijn, zo zult gij den HEERE uw God loven voor dat goede land"
  'deuteronomium-bijbelquiz-deel-8': {
    hue: 74,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 236, far: 'dunes', horizon: 470 }),
      tree(1010, 500, 1.6, c.p.mid),
      tree(1220, 506, 1.9, c.p.near),
      wheat(200, 552, 1.15, c.p.crop, 5),
      wheat(330, 560, 1.25, c.p.crop, 4),
      kneelA(560, 560, 1.75, c.p.fore, 'pray'),
      ellipse(770, 562, 110, 14, c.p.light, { opacity: 0.7 }),
      loaf(740, 560, 2.1, c.p.accent),
      line(712, 534, 724, 518, 5, c.p.light, 0.7),
      line(734, 538, 748, 516, 5, c.p.light, 0.7),
      line(758, 536, 770, 520, 5, c.p.light, 0.7),
      loaf(822, 562, 1.3, c.p.accent),
      fg(c, 688, 12),
    ],
  },

  // 9: the golden calf on its pedestal; Moses with the two tablets lifted to break them before their eyes
  'deuteronomium-bijbelquiz-deel-9': {
    hue: 76,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1220, sunY: 300, sunR: 56, far: 'ridge', horizon: 476 }),
      c.soft(860, 420, 190, 0.35, c.p.accent),
      rect(770, 470, 170, 58, c.p.near, { rx: 3 }),
      rect(756, 462, 198, 12, c.p.near, { rx: 3 }),
      ox(870, 462, 1.05, c.p.accent),
      crowd(c.rand, 1150, 530, 0.85, c.p.near, 4, 200),
      figureA(400, 532, 1.4, c.p.fore, 'raise'),
      tablets(400, 336, 0.62, c.p.light),
      fg(c, 688, 12),
    ],
  },

  // 10: "Maak u een ark van hout" - Moses brings the new tablets to the ark of shittim wood below the mount
  'deuteronomium-bijbelquiz-deel-10': {
    hue: 78,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 236, rays: true, far: 'dunes', horizon: 472 }),
      path('M 110 480 C 230 386 320 300 410 278 C 460 268 510 296 550 334 C 630 404 710 452 800 480 Z', c.p.mid),
      c.soft(780, 420, 200, 0.3),
      arkOfCovenant(790, 536, 1.2, c.p.accent),
      kneelA(560, 540, 1.35, c.p.fore, 'forward'),
      tablets(626, 446, 0.42, c.p.light),
      person(1040, 538, 1.2, c.p.near, 'stand'),
      fg(c, 690, 12),
    ],
  },

  // 11: "Den zegen op den berg Gerizim, en den vloek op den berg Ebal" - a lit harvest on the one mount, cloud on the other
  'deuteronomium-bijbelquiz-deel-11': {
    hue: 80,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 380, sunY: 220, sunR: 64, far: 'none', horizon: 492 }),
      path('M 90 506 C 210 400 300 320 400 306 C 500 318 610 410 720 506 Z', c.p.mid),
      path('M 690 506 C 800 410 900 316 1010 304 C 1120 318 1220 410 1330 506 Z', c.p.near),
      c.veil(780, W, c.p.fore, 0.5),
      cloudBank(c.rand, 1010, 230, 1.25, c.p.fore, { opacity: 0.45 }),
      streaks(c.rand, 880, 250, 280, 170, c.p.fore, 24, { opacity: 0.22 }),
      deadTree(990, 316, 0.55, c.p.near),
      deadTree(1110, 360, 0.45, c.p.near),
      wheat(320, 404, 0.75, c.p.accent, 4),
      wheat(405, 374, 0.8, c.p.accent, 5),
      wheat(495, 410, 0.75, c.p.accent, 4),
      crowd(c.rand, 704, 566, 1.0, c.p.fore, 7, 380),
      fg(c, 696, 10),
    ],
  },

  // 12: "De plaats die de HEERE uw God verkiezen zal" - the one altar on its hill, offerings brought up to it
  'deuteronomium-bijbelquiz-deel-12': {
    hue: 82,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 760, sunY: 230, far: 'dunes', horizon: 470 }),
      ellipse(760, 520, 360, 108, c.p.mid),
      smokeColumn(c.rand, 760, 290, 1.4, c.p.light),
      hornedAltar(760, 428, 0.95, c.p.fore),
      fireBed(c.rand, 760, 330, 0.9, c.p.accent, 5),
      person(400, 548, 1.3, c.p.fore, 'carry'),
      ram(530, 550, 0.62, c.p.near),
      person(1090, 552, 1.25, c.p.fore, 'walk'),
      person(1200, 556, 1.05, c.p.near, 'carry'),
      fg(c, 690, 12),
    ],
  },

  // 13: "Als een profeet of dromer opstaat en geeft u een teken of wonder" - the dreamer points to a sign beside his idol
  'deuteronomium-bijbelquiz-deel-13': {
    hue: 84,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 476 }),
      c.soft(1000, 260, 150, 0.35, c.p.accent),
      comet(1000, 260, 0.9, c.p.accent),
      ellipse(820, 552, 190, 50, c.p.near),
      colossus(1080, 532, 0.46, c.p.near, c.p.near),
      rect(1040, 532, 80, 14, c.p.near),
      figureA(800, 514, 1.3, c.p.fore, 'raise'),
      crowd(c.rand, 350, 548, 0.95, c.p.fore, 5, 280),
      fg(c, 690, 12),
    ],
  },

  // 14: "Alle vee dat gespleten klauwen heeft en herkauwt" - the clean beasts, the tithe carried up in a basket
  'deuteronomium-bijbelquiz-deel-14': {
    hue: 86,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'ridge', horizon: 474 }),
      deer(400, 540, 1.15, c.p.fore),
      ox(680, 536, 0.95, c.p.near),
      sheepA(840, 538, 1.0, c.p.light, c.p.fore),
      person(1090, 548, 1.3, c.p.fore, 'carry'),
      wheat(1090, 360, 0.36, c.p.crop, 4),
      basket(1090, 380, 0.85, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 15: the year of release - the Hebrew servant goes out free at dawn with gifts from the flock, his chain broken behind him
  'deuteronomium-bijbelquiz-deel-15': {
    hue: 88,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 300, sunR: 70, rays: true, far: 'dunes', horizon: 476 }),
      trail(860, H, 1130, 476, 130, c.p.light, { opacity: 0.35 }),
      houseBlock(c.rand, 290, 520, 1.15, c.p.near),
      figureA(470, 540, 1.3, c.p.fore, 'bless'),
      person(840, 548, 1.35, c.p.fore, 'walk'),
      sheepA(980, 558, 0.9, c.p.light, c.p.fore),
      chainLinks(560, 556, 1.7, c.p.accent),
      rotate(-30, 700, 584, chainLinks(670, 584, 1.5, c.p.accent)),
      fg(c, 690, 12),
    ],
  },

  // 16: the feast of booths - a family in a booth of branches after the harvest, the grapes hung under its roof
  'deuteronomium-bijbelquiz-deel-16': {
    hue: 90,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 330, sunR: 60, far: 'dunes', horizon: 480 }),
      palm(400, 510, 1.3, c.p.near),
      booth(1180, 500, 0.55, c.p.near, c.p.mid, { opacity: 0.8 }),
      booth(770, 540, 1.3, c.p.fore, c.p.near),
      grapes(680, 338, 0.95, c.p.accent),
      grapes(860, 338, 0.9, c.p.accent),
      person(700, 540, 1.05, c.p.fore, 'sit'),
      person(810, 540, 1.0, c.p.fore, 'sit'),
      person(880, 540, 0.7, c.p.fore, 'sit'),
      fg(c, 690, 12),
    ],
  },

  // 17: the king "zal een afschrift van deze wet schrijven in een boek" and read in it all his days
  'deuteronomium-bijbelquiz-deel-17': {
    hue: 92,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 980, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(220, 512, 1.25, c.p.near, 2),
      columns(1200, 512, 1.25, c.p.near, 2),
      throne(540, 516, 1.4, c.p.near),
      person(540, 516, 1.4, c.p.fore, 'sit'),
      crown(540, 374, 0.32, c.p.fore),
      rect(720, 430, 14, 86, c.p.fore),
      rect(680, 424, 94, 12, c.p.fore, { rx: 3 }),
      scroll(727, 396, 1.15, c.p.accent),
      figureA(930, 518, 1.35, c.p.near, 'reach', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 18: "Een Profeet uit het midden van u, uit uw broederen, gelijk mij" - Moses points to the light rising beyond the people
  'deuteronomium-bijbelquiz-deel-18': {
    hue: 94,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 478 }),
      c.soft(1000, 440, 300, 0.5),
      shafts(1000, 120, 260, 360, c.p.glow, 5),
      circle(1000, 470, 58, c.p.accent),
      path('M 600 484 C 760 470 880 466 1000 472 C 1120 466 1240 472 1330 482 L 1330 520 L 600 520 Z', c.p.mid),
      person(1140, 484, 0.75, c.p.fore, 'stand'),
      crowd(c.rand, 700, 548, 0.9, c.p.near, 5, 280),
      figureA(340, 556, 1.4, c.p.fore, 'staff'),
      fg(c, 692, 12),
    ],
  },

  // 19: the cities of refuge - the man who killed unawares (the axe head flew off in the wood) flees along the road to the open gate
  'deuteronomium-bijbelquiz-deel-19': {
    hue: 96,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 236, far: 'ridge', horizon: 478 }),
      path('M 740 494 C 830 420 940 392 1060 390 C 1180 392 1260 420 1340 494 Z', c.p.mid),
      citySkyline(c.rand, 1060, 372, 0.7, c.p.near, 5),
      cityWall(1060, 424, 0.95, c.p.near, 330),
      c.soft(1060, 400, 110, 0.5, c.p.accent),
      path('M 1034 424 L 1034 394 A 26 26 0 0 1 1086 394 L 1086 424 Z', c.p.accent),
      trail(560, H, 1060, 426, 160, c.p.light, { opacity: 0.4 }),
      cypress(170, 536, 1.25, c.p.near),
      tree(290, 540, 1.6, c.p.near),
      cypress(400, 530, 0.95, c.p.near, { opacity: 0.85 }),
      stump(440, 566, 0.8, c.p.near),
      axe(430, 580, 0.55, c.p.fore, c.p.fore, { rot: -78 }),
      figureA(790, 566, 1.4, c.p.fore, 'walk'),
      fg(c, 698, 10),
    ],
  },

  // 20: "Gij zult haar geboomte niet verderven" - the fruit tree spared before the besieged city
  'deuteronomium-bijbelquiz-deel-20': {
    hue: 98,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1220, sunY: 290, sunR: 54, far: 'none', horizon: 476 }),
      path('M 640 486 C 720 404 830 372 960 368 C 1090 372 1200 404 1290 486 Z', c.p.mid),
      citySkyline(c.rand, 960, 372, 0.7, c.p.near, 6),
      cityWall(960, 396, 0.8, c.p.near, 320),
      tent(720, 520, 0.8, c.p.near),
      tent(1200, 526, 0.75, c.p.near),
      banner(800, 528, 0.75, c.p.near, c.p.mid),
      tree(370, 556, 2.3, c.p.fore),
      fruitIn(c.rand, 382, 416, 250, 70, 10, c.p.accent, 10),
      person(560, 556, 1.25, c.p.fore, 'stand'),
      fg(c, 692, 12),
    ],
  },

  // 21: "Alle oudsten dier stad zullen hun handen wassen over de vaars" - the elders at the stream in the valley
  'deuteronomium-bijbelquiz-deel-21': {
    hue: 100,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'ridge', horizon: 470 }),
      cityWall(1150, 472, 0.6, c.p.far, 220, { opacity: 0.7 }),
      river(470, c.p.water, { opacity: 0.9 }),
      line(620, 500, 680, 500, 4, c.p.light, 0.8),
      line(560, 540, 650, 540, 4, c.p.light, 0.8),
      line(660, 560, 760, 560, 4, c.p.light, 0.8),
      line(500, 600, 620, 600, 4, c.p.light, 0.8),
      line(640, 630, 760, 630, 4, c.p.light, 0.8),
      kneelA(430, 548, 1.35, c.p.fore, 'forward'),
      kneelA(900, 548, 1.3, c.p.fore, 'forward', { flip: true }),
      jar(560, 450, 0.8, c.p.accent, { rot: -62 }),
      ox(1120, 548, 0.75, c.p.near),
      fg(c, 692, 12),
    ],
  },

  // 22: "Wanneer een vogelnestje op den weg voor u voorkomt ... gij zult de moeder vrijlaten"
  'deuteronomium-bijbelquiz-deel-22': {
    hue: 102,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'dunes', horizon: 474 }),
      trail(560, H, 760, 474, 130, c.p.light, { opacity: 0.35 }),
      tree(1040, 520, 1.9, c.p.near),
      dove(860, 300, 1.5, c.p.fore),
      person(470, 556, 1.35, c.p.fore, 'point'),
      nest(690, 566, 1.35, c.p.fore, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 23: "Gij zult druiven eten naar uw lust, maar in uw vat zult gij niet doen" - picking by hand in the neighbour's vineyard
  'deuteronomium-bijbelquiz-deel-23': {
    hue: 104,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 230, far: 'ridge', horizon: 470 }),
      rect(980, 400, 8, 96, c.p.mid),
      rect(1240, 400, 8, 96, c.p.mid),
      rect(970, 396, 290, 8, c.p.mid, { rx: 4 }),
      ellipse(1030, 402, 50, 20, c.p.mid),
      ellipse(1110, 398, 56, 22, c.p.mid),
      ellipse(1190, 402, 50, 20, c.p.mid),
      grapes(1050, 416, 0.6, c.p.mid),
      grapes(1170, 416, 0.6, c.p.mid),
      rect(560, 330, 12, 230, c.p.fore),
      rect(900, 330, 12, 230, c.p.fore),
      rect(540, 324, 390, 12, c.p.fore, { rx: 5 }),
      ellipse(620, 332, 64, 26, c.p.near),
      ellipse(730, 326, 70, 28, c.p.near),
      ellipse(840, 332, 64, 26, c.p.near),
      grapes(620, 352, 1.2, c.p.accent),
      grapes(760, 350, 1.3, c.p.accent),
      grapes(866, 352, 1.1, c.p.accent),
      figureA(430, 560, 1.4, c.p.fore, 'reach'),
      basket(300, 560, 0.75, c.p.near),
      fg(c, 694, 10),
    ],
  },

  // 24: "Wanneer gij een garf op het veld vergeet ... zij zal voor den vreemdeling, voor den wees en voor de weduwe zijn"
  'deuteronomium-bijbelquiz-deel-24': {
    hue: 106,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 360, sunR: 60, far: 'dunes', horizon: 480 }),
      wheat(820, 500, 0.35, c.p.crop, 6),
      wheat(940, 500, 0.32, c.p.crop, 5),
      sheaf(1000, 512, 0.5, c.p.near, { opacity: 0.8 }),
      person(1090, 510, 0.85, c.p.near, 'carry'),
      kneelA(420, 556, 1.35, c.p.fore, 'plant'),
      person(300, 556, 0.85, c.p.fore, 'stand'),
      sheaf(680, 560, 1.4, c.p.accent),
      fg(c, 694, 10),
    ],
  },

  // 25: "Gij zult een volkomen en gerechten weegsteen hebben" - the balance on the market table, the ox treading the grain
  'deuteronomium-bijbelquiz-deel-25': {
    hue: 108,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1110, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      ox(1180, 506, 0.7, c.p.near, { opacity: 0.85 }),
      rect(500, 446, 420, 16, c.p.near, { rx: 4 }),
      rect(520, 462, 14, 50, c.p.near),
      rect(886, 462, 14, 50, c.p.near),
      scales(710, 446, 1.12, c.p.accent),
      rect(573, 336, 28, 18, c.p.accentDeep, { rx: 3 }),
      rect(818, 336, 26, 18, c.p.accentDeep, { rx: 3 }),
      person(390, 514, 1.3, c.p.fore, 'point'),
      person(1010, 514, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 26: "De priester zal de mand uit uw hand nemen, en zal ze nederzetten voor het altaar" - the firstfruits
  'deuteronomium-bijbelquiz-deel-26': {
    hue: 110,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 880, sunY: 240, rays: true, far: 'dunes', horizon: 480 }),
      hornedAltar(900, 536, 1.35, c.p.fore),
      ellipse(900, 354, 44, 22, c.p.light, { opacity: 0.7 }),
      ellipse(916, 310, 54, 26, c.p.light, { opacity: 0.55 }),
      ellipse(896, 262, 62, 30, c.p.light, { opacity: 0.4 }),
      figureA(1110, 540, 1.4, c.p.near, 'reach', { flip: true }),
      kneelA(470, 552, 1.75, c.p.fore, 'forward'),
      wheat(650, 410, 0.42, c.p.crop, 4),
      grapes(700, 400, 0.7, c.p.light),
      basket(668, 446, 1.55, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 27: "Gij zult u grote stenen oprichten, en zult ze met kalk bestrijken ... op den berg Ebal" - and the altar of whole stones
  'deuteronomium-bijbelquiz-deel-27': {
    hue: 112,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 260, sunY: 230, far: 'none', horizon: 490 }),
      path('M 380 500 C 520 400 640 320 790 306 C 940 320 1080 400 1250 500 Z', c.p.mid),
      cloudBank(c.rand, 800, 250, 1.3, c.p.fore, { opacity: 0.35 }),
      stele(586, 514, 1.0, c.p.near, { opacity: 0.6 }),
      stele(580, 510, 1.0, c.p.light),
      stele(676, 506, 1.12, c.p.near, { opacity: 0.6 }),
      stele(670, 502, 1.12, c.p.light),
      stele(766, 514, 0.95, c.p.near, { opacity: 0.6 }),
      stele(760, 510, 0.95, c.p.light),
      stoneAltar(c.rand, 960, 516, 0.75, c.p.near),
      fireBed(c.rand, 960, 446, 0.8, c.p.accent, 4),
      crowd(c.rand, 300, 566, 0.95, c.p.fore, 4, 220),
      crowd(c.rand, 1180, 566, 0.95, c.p.fore, 3, 180),
      fg(c, 696, 10),
    ],
  },

  // 28: "Gezegend zal zijn uw korf en uw baktrog" - the full basket under the sun, the curse as storm and locusts on the other side
  'deuteronomium-bijbelquiz-deel-28': {
    hue: 114,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 230, far: 'dunes', horizon: 474 }),
      c.veil(680, W, c.p.fore, 0.6),
      cloudBank(c.rand, 1060, 200, 1.4, c.p.fore, { opacity: 0.4 }),
      streaks(c.rand, 840, 210, 460, 270, c.p.fore, 30, { opacity: 0.25 }),
      swarm(c.rand, 880, 300, 380, 130, 0.9, c.p.fore, 26, 'locust'),
      witheredPlant(980, 540, 1.6, c.p.near),
      witheredPlant(1110, 548, 1.4, c.p.near),
      deadTree(1220, 530, 1.1, c.p.near),
      wheat(200, 548, 1.1, c.p.crop, 5),
      tree(380, 520, 1.9, c.p.near),
      grapes(574, 446, 1.0, c.p.fore),
      loaf(640, 498, 1.4, c.p.fore),
      grapes(684, 452, 0.85, c.p.fore),
      basket(620, 556, 2.0, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 29: "Gij staat heden allen voor het aangezicht des HEEREN" - Moses lifts the book of the covenant over the whole assembly
  'deuteronomium-bijbelquiz-deel-29': {
    hue: 116,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 300, sunR: 60, far: 'dunes', horizon: 478 }),
      crowd(c.rand, 500, 512, 0.75, c.p.near, 7, 560),
      crowd(c.rand, 470, 548, 1.0, c.p.fore, 6, 520),
      person(780, 556, 0.75, c.p.fore, 'stand'),
      ellipse(1040, 560, 210, 60, c.p.near),
      c.soft(1040, 340, 150, 0.35),
      figureA(1040, 516, 1.35, c.p.fore, 'raise'),
      scroll(1040, 300, 0.75, c.p.accent),
      fg(c, 694, 10),
    ],
  },

  // 30: "Ik heb u het leven en den dood voorgesteld ... kiest dan het leven" - the way to the fruitful tree, the other to the dead one
  'deuteronomium-bijbelquiz-deel-30': {
    hue: 118,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 330, sunY: 250, far: 'dunes', horizon: 478 }),
      c.veil(780, W, c.p.fore, 0.42),
      forkedRoad(704, 478, c.p.light),
      tree(420, 516, 2.1, c.p.near),
      fruitIn(c.rand, 432, 390, 220, 60, 10, c.p.accent, 9),
      deadTree(1020, 516, 1.35, c.p.near),
      person(704, 586, 1.35, c.p.fore, 'stand'),
      fg(c, 700, 8),
    ],
  },

  // 31: "Wees sterk en heb goeden moed" - Moses charges Joshua at the tent, the pillar of cloud standing at its door
  'deuteronomium-bijbelquiz-deel-31': {
    hue: 120,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 250, far: 'dunes', horizon: 480 }),
      tabernacle(920, 536, 1.0, c.p.near, c.p.light, c.p.accent),
      c.soft(650, 380, 200, 0.4),
      cloudPillar(650, 556, 0.74, c.p.light, { opacity: 0.95 }),
      figureA(340, 560, 1.45, c.p.fore, 'staff'),
      figureA(500, 560, 1.35, c.p.fore, 'stand'),
      fg(c, 692, 12),
    ],
  },

  // 32: "Gelijk een arend zijn nest opwekt ... zijn vleugelen uitbreidt" - the song of Moses
  'deuteronomium-bijbelquiz-deel-32': {
    hue: 122,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 260, rays: true, far: 'ridge', horizon: 488 }),
      path('M 90 620 L 150 420 L 220 350 L 300 362 L 360 420 L 430 620 Z', c.p.near),
      nest(250, 360, 0.75, c.p.fore, c.p.light),
      eagle(730, 330, 1.0, c.p.accent),
      eagle(1000, 260, 0.22, c.p.fore, { opacity: 0.7 }),
      figureA(1090, 540, 1.15, c.p.fore, 'raise'),
      fg(c, 694, 10),
    ],
  },

  // 33: "Dit nu is de zegen, waarmede Mozes ... de kinderen Israels gezegend heeft" - the tribes' tents and standards below him
  'deuteronomium-bijbelquiz-deel-33': {
    hue: 124,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, rays: true, far: 'dunes', horizon: 474 }),
      tent(700, 478, 0.55, c.p.mid),
      tent(890, 474, 0.5, c.p.mid),
      tent(1070, 478, 0.55, c.p.mid),
      tent(1240, 476, 0.5, c.p.mid),
      tent(620, 516, 0.8, c.p.near),
      tent(810, 512, 0.75, c.p.near),
      tent(1000, 516, 0.8, c.p.near),
      tent(1190, 514, 0.75, c.p.near),
      banner(660, 516, 0.85, c.p.fore, c.p.accent),
      banner(850, 512, 0.8, c.p.fore, c.p.accent),
      banner(1040, 516, 0.85, c.p.fore, c.p.accent),
      banner(1230, 514, 0.8, c.p.fore, c.p.accent),
      ellipse(320, 560, 210, 62, c.p.near),
      figureA(320, 514, 1.4, c.p.fore, 'bless'),
      fg(c, 692, 12),
    ],
  },

  // 34: Moses on the top of Pisgah sees all the land - Gilead, the plain, Jericho the city of palm trees - and dies there
  'deuteronomium-bijbelquiz-deel-34': {
    hue: 126,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 320, sunR: 60, far: 'ridge', horizon: 470 }),
      path('M 520 476 C 720 462 960 458 1330 466 L 1330 494 C 1000 486 760 490 520 498 Z', c.p.accent, { opacity: 0.7 }),
      path('M 520 500 C 760 494 1000 490 1330 498 L 1330 506 C 1000 500 760 504 520 510 Z', c.p.water),
      palm(980, 472, 0.55, c.p.mid),
      palm(1020, 470, 0.45, c.p.mid),
      citySkyline(c.rand, 1060, 468, 0.32, c.p.mid, 4),
      path(`M 40 ${H} L 120 470 C 170 420 270 400 360 404 C 440 410 500 470 560 ${H} Z`, c.p.mid),
      figureA(330, 412, 1.25, c.p.fore, 'staff'),
      fg(c, 700, 8),
    ],
  },
};

