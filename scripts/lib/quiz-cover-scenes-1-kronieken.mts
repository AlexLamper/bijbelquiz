/**
 * Covers for the 1 Kronieken series, one scene per quiz. Each quiz covers one
 * chapter: `1-kronieken-bijbelquiz-deel-<n>` is chapter n (1-29).
 *
 * Base hue 130, drifting two degrees per chapter. See
 * `quiz-cover-scene-kit.mts` for the house style and
 * `quiz-cover-motifs-koningen-kron1.mts` for the extra motifs. The
 * genealogies (1-9) and the lists of Levites, priests, singers, gatekeepers
 * and officers (23-27) each get one concrete symbol of the chapter instead
 * of a story scene.
 *
 * Chapters: de stamboom van Adam af (1); Juda: de leeuw en de scepter (2); de
 * zonen van David (3); het gebed van Jabez, "vermeerder mijn landpale" (4);
 * Ruben, Gad en half Manasse aan de overkant van de Jordaan (5); Levi: de
 * hogepriester bij het reukofferaltaar (6); de strijdbare helden van de stammen
 * opgeroepen (7); Benjamin: de boogschutters van Ulam (8); de poortiers met de
 * sleutel van Jeruzalem (9); Saul valt op het gebergte Gilboa (10); David giet
 * het water uit de put van Bethlehem uit (11); de helden komen tot David te
 * Hebron (12); de ark op de nieuwe wagen, Uza sterft (13); het geruis in de
 * toppen van de moerbeibomen (14); de Levieten dragen de ark op hun schouders
 * (15); Asaf met de cimbalen voor de ark in de tent (16); Nathans belofte: een
 * troon tot in eeuwigheid (17); de gouden schilden van Hadadezer (18); Joab en
 * Abisai tegen Ammon en Syrie (19); de kroon van Rabba op Davids hoofd (20);
 * de engel met het uitgetogen zwaard boven Jeruzalem (21); David bereidt
 * stenen en cederhout voor de tempel (22); de Levieten en de toonbroden (23);
 * het lot voor de vierentwintig priesterafdelingen (24); de zangers met
 * harpen, luiten en cimbalen (25); de schatkamers van het huis Gods (26); de
 * twaalf maandelijkse legerafdelingen (27); David geeft Salomo het voorbeeld
 * van de tempel (28); de vrijwillige gaven en Davids gebed (29).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
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
  gateArch,
  goblet,
  horse,
  houseBlock,
  lion,
  ox,
  path,
  person,
  rect,
  river,
  rotate,
  scepter,
  scroll,
  shafts,
  smokeColumn,
  streaks,
  tent,
  throne,
  tree,
  well,
  wheat,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  arkOfCovenant,
  bow,
  campTent,
  cart,
  cymbals,
  figureAt,
  horn,
  ingots,
  jar,
  key,
  lineageTree,
  logPile,
  lyre,
  moon,
  personLeft,
  pitcher,
  roundShield,
  royalThrone,
  sheep,
  showbreadTable,
  solomonTemple,
  spear,
  stoneBlock,
  sword,
  wallTone,
} from './quiz-cover-motifs-koningen-kron1.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A banner on a pole (the primitive's shape, bigger cloth). */
function standard(x: number, y: number, s: number, pole: string, cloth: string): string {
  return (
    rect(x - 3 * s, y - 200 * s, 6 * s, 200 * s, pole) +
    path(`M ${r1(x + 3 * s)} ${r1(y - 196 * s)} L ${r1(x + 92 * s)} ${r1(y - 182 * s)} L ${r1(x + 70 * s)} ${r1(y - 152 * s)} L ${r1(x + 92 * s)} ${r1(y - 122 * s)} L ${r1(x + 3 * s)} ${r1(y - 136 * s)} Z`, cloth)
  );
}

/** Curved motion lines: wind, a sound passing through treetops. */
function swish(x: number, y: number, w: number, stroke: string, width = 5, opacity = 0.8): string {
  return `<path d="M ${r1(x - w / 2)} ${r1(y)} Q ${r1(x)} ${r1(y - w * 0.12)} ${r1(x + w / 2)} ${r1(y)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
}

export const KRONIEKEN1_SCENES: Record<string, Scene> = {
  // 1: "Adam, Seth, Enos ..." - de geslachtslijst van Adam af, als een stamboom
  '1-kronieken-bijbelquiz-deel-1': {
    hue: 130,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 300, rays: true, far: 'dunes', horizon: 480 }),
      c.soft(704, 330, 300, 0.4),
      lineageTree(c.rand, 704, 552, 1.22, c.p.fore, c.p.accent, 4),
      fg(c, 698, 12),
    ],
  },

  // 2: Het geslacht van Juda tot David - "de scepter zal van Juda niet wijken": de leeuw van Juda
  '1-kronieken-bijbelquiz-deel-2': {
    hue: 132,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 260, far: 'ridge', horizon: 474 }),
      citySkyline(c.rand, 1120, 474, 0.6, c.p.far, 4, { opacity: 0.7 }),
      path('M 260 548 C 300 470 420 446 600 448 C 760 450 860 480 900 548 Z', c.p.mid),
      lion(540, 458, 2.2, c.p.fore),
      scepter(880, 500, 2.5, c.p.accent),
      sheep(1150, 520, 0.7, c.p.light, c.p.fore, true),
      sheep(1240, 530, 0.6, c.p.light, c.p.fore),
      fg(c, 696, 14),
    ],
  },

  // 3: De zonen van David die hem te Hebron en te Jeruzalem geboren zijn - de koninklijke lijn
  '1-kronieken-bijbelquiz-deel-3': {
    hue: 134,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'dunes', ground: 'flat', horizon: 512 }),
      citySkyline(c.rand, 1120, 512, 0.8, c.p.far, 6, { opacity: 0.6 }),
      throne(330, 526, 1.3, c.p.near),
      person(330, 492, 1.2, c.p.fore, 'sit'),
      crown(330, 366, 0.5, c.p.accent),
      person(560, 530, 1.4, c.p.fore, 'stand'),
      person(680, 532, 1.3, c.p.fore, 'stand'),
      person(790, 532, 1.2, c.p.fore, 'stand'),
      person(890, 534, 1.1, c.p.fore, 'stand'),
      person(980, 534, 1.0, c.p.fore, 'stand'),
      person(1060, 536, 0.9, c.p.fore, 'stand'),
      fg(c, 694, 12),
    ],
  },

  // 4: Jabez riep de God Israels aan: "Zo Gij mij rijkelijk zegent, en mijn landpale vermeerdert"
  '1-kronieken-bijbelquiz-deel-4': {
    hue: 136,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 300, rays: true, far: 'none', horizon: 470 }),
      path(`M 300 476 C 600 470 1000 464 ${W + 40} 470 L ${W + 40} 560 C 1000 540 700 530 300 520 Z`, c.p.accent, { opacity: 0.85 }),
      path(`M 640 530 C 900 520 1200 512 ${W + 40} 520 L ${W + 40} 600 C 1100 580 860 570 640 560 Z`, c.p.accent, { opacity: 0.7 }),
      sheep(900, 500, 0.55, c.p.light, c.p.fore),
      sheep(980, 506, 0.5, c.p.light, c.p.fore, true),
      sheep(1060, 498, 0.5, c.p.light, c.p.fore),
      path('M -40 560 C 100 470 260 440 420 450 C 540 458 600 500 640 560 Z', c.p.mid),
      person(360, 466, 1.5, c.p.fore, 'kneel'),
      fg(c, 698, 12),
    ],
  },

  // 5: Ruben, Gad en de halve stam Manasse aan de overzijde van de Jordaan, met hun vee - kemelen, schapen en ezels
  '1-kronieken-bijbelquiz-deel-5': {
    hue: 138,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 230, far: 'ridge', horizon: 470 }),
      river(470, c.p.water, { opacity: 0.85 }),
      campTent(880, 500, 0.8, c.p.near, c.p.fore),
      campTent(1120, 504, 0.9, c.p.near, c.p.fore),
      standard(780, 512, 0.95, c.p.fore, c.p.accent),
      standard(1000, 508, 0.85, c.p.fore, c.p.accent),
      standard(1250, 514, 0.95, c.p.fore, c.p.accent),
      sheep(900, 548, 0.8, c.p.light, c.p.fore),
      sheep(980, 556, 0.85, c.p.light, c.p.fore, true),
      sheep(1070, 550, 0.8, c.p.light, c.p.fore),
      donkey(1200, 560, 0.85, c.p.fore),
      person(260, 540, 1.35, c.p.fore, 'walk'),
      fg(c, 698, 12),
    ],
  },

  // 6: De zonen van Levi: Aaron en zijn zonen offerden op het reukaltaar - de hogepriester met de borstlap
  '1-kronieken-bijbelquiz-deel-6': {
    hue: 140,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'flat', horizon: 512 }),
      solomonTemple(1080, 512, 0.8, c.p.near, c.p.fore, { opacity: 0.75 }),
      smokeColumn(c.rand, 760, 360, 1.5, c.p.fore),
      c.soft(760, 400, 160, 0.4, c.p.accent),
      altar(760, 534, 1.35, c.p.accent, { tall: true }),
      person(560, 538, 1.65, c.p.fore, 'point'),
      path('M 536 342 C 536 312 584 312 584 342 Z', c.p.fore),
      crowd(c.rand, 300, 536, 0.85, c.p.near, 3, 140),
      fg(c, 694, 12),
    ],
  },

  // 7: De zonen van Issaschar, Benjamin, Naftali, Manasse, Efraim en Aser - strijdbare helden, geteld naar hun geslachten
  '1-kronieken-bijbelquiz-deel-7': {
    hue: 142,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 330, sunR: 60, far: 'ridge', horizon: 478 }),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => spear(720 + i * 64, 520 + (i % 2) * 6, 0.62, c.p.near)),
      crowd(c.rand, 940, 522, 0.78, c.p.near, 8, 480),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => spear(760 + i * 74, 552 + (i % 2) * 4, 0.8, c.p.fore)),
      crowd(c.rand, 960, 552, 0.95, c.p.fore, 7, 460),
      path('M -40 560 C 100 480 240 450 380 452 C 470 454 520 490 560 560 Z', c.p.mid),
      person(340, 470, 1.45, c.p.fore, 'stand'),
      rotate(-20, 350, 340, horn(350, 340, 0.9, c.p.accent)),
      fg(c, 698, 12),
    ],
  },

  // 8: Benjamin, het geslacht van Saul - "de zonen van Ulam waren dappere helden, die de boog spanden"
  '1-kronieken-bijbelquiz-deel-8': {
    hue: 144,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'ridge', horizon: 474 }),
      path('M 820 500 C 900 420 1000 390 1120 388 C 1240 390 1320 430 1420 500 Z', c.p.mid),
      citySkyline(c.rand, 1110, 392, 0.65, c.p.near, 5),
      person(480, 540, 1.6, c.p.fore, 'point'),
      bow(586, 404, 1.25, c.p.accent),
      person(760, 534, 1.15, c.p.near, 'stand', { opacity: 0.85 }),
      bow(804, 450, 0.8, c.p.near, '', { opacity: 0.85 }),
      person(280, 536, 1.2, c.p.near, 'stand', { opacity: 0.85 }),
      fg(c, 696, 14),
    ],
  },

  // 9: De eersten die weer in Jeruzalem woonden; de poortiers hadden de sleutel, om alle morgen te openen
  '1-kronieken-bijbelquiz-deel-9': {
    hue: 146,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 270, rays: true, far: 'dunes', ground: 'flat', horizon: 520 }),
      cityWall(700, 520, 1.5, c.p.near, 760),
      gateArch(700, 520, 1.3, c.p.near),
      path('M 654 520 L 654 422 A 46 46 0 0 1 746 422 L 746 520 Z', c.p.light, { opacity: 0.55 }),
      person(500, 538, 1.55, c.p.fore, 'point'),
      key(604, 433, 1.25, c.p.accent),
      person(900, 538, 1.2, c.p.fore, 'carry'),
      person(1010, 540, 1.1, c.p.fore, 'walk'),
      person(1110, 542, 1.0, c.p.fore, 'carry'),
      fg(c, 696, 12),
    ],
  },

  // 10: Saul en zijn zonen vallen op het gebergte Gilboa - zijn kroon en zijn wapenen op de berg
  '1-kronieken-bijbelquiz-deel-10': {
    hue: 148,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 240, clouds: 3, far: 'ridge', horizon: 470 }),
      path('M 160 560 C 300 430 460 380 640 376 C 820 380 960 440 1100 560 Z', c.p.mid),
      rotate(8, 700, 420, sword(700, 420, 1.2, c.p.fore)),
      roundShield(820, 440, 1.0, c.p.fore),
      rotate(-18, 560, 418, crown(560, 418, 0.7, c.p.accent)),
      rotate(-74, 400, 540, spear(400, 540, 0.8, c.p.fore)),
      crowd(c.rand, 1180, 524, 0.6, c.p.near, 5, 200),
      fg(c, 696, 14),
    ],
  },

  // 11: David wil het water uit de put van Bethlehem niet drinken, maar giet het uit voor de HEERE
  '1-kronieken-bijbelquiz-deel-11': {
    hue: 150,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 280, far: 'dunes', horizon: 476 }),
      citySkyline(c.rand, 260, 476, 0.6, c.p.far, 4, { opacity: 0.7 }),
      well(330, 530, 1.1, c.p.near),
      person(560, 540, 1.55, c.p.fore, 'carry'),
      rotate(100, 636, 440, jar(636, 480, 0.8, c.p.accent)),
      path('M 680 446 C 702 462 712 500 716 544', 'none').replace('fill="none"', `fill="none" stroke="${c.p.light}" stroke-width="8" stroke-linecap="round" opacity="0.9"`),
      person(860, 540, 1.3, c.p.fore, 'stand'),
      person(960, 544, 1.25, c.p.fore, 'stand'),
      person(1060, 540, 1.2, c.p.fore, 'stand'),
      spear(1100, 548, 0.9, c.p.fore),
      fg(c, 696, 14),
    ],
  },

  // 12: De helden komen tot David te Hebron, met volkomen hart, om David koning te maken over gans Israel
  '1-kronieken-bijbelquiz-deel-12': {
    hue: 152,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 240, sunY: 240, far: 'ridge', horizon: 474 }),
      path('M -40 540 C 80 450 200 420 330 420 C 440 422 520 470 580 540 Z', c.p.mid),
      campTent(330, 430, 0.9, c.p.near, c.p.fore),
      standard(440, 440, 1.0, c.p.fore, c.p.accent),
      donkey(1160, 536, 0.85, c.p.near),
      ...[0, 1, 2, 3, 4].map((i) => person(680 + i * 105, 540 + (i % 2) * 4, 1.25 - i * 0.04, c.p.fore, 'walk')),
      ...[0, 1, 2, 3, 4].map((i) => spear(718 + i * 105, 548 + (i % 2) * 4, 0.95 - i * 0.03, c.p.fore)),
      ...[0, 2, 4].map((i) => roundShield(670 + i * 105, 470, 0.85, c.p.near)),
      fg(c, 696, 14),
    ],
  },

  // 13: De ark Gods op een nieuwe wagen; de runderen struikelen en Uza strekt zijn hand uit en sterft
  '1-kronieken-bijbelquiz-deel-13': {
    hue: 154,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 220, clouds: 3, far: 'ridge', horizon: 476 }),
      ox(400, 540, 1.1, c.p.fore),
      ox(470, 548, 1.0, c.p.fore, { opacity: 0.9 }),
      cart(720, 544, 1.2, c.p.fore),
      arkOfCovenant(720, 470, 1.05, c.p.accent, { poles: false }),
      person(900, 556, 1.25, c.p.fore, 'fallen'),
      person(1130, 544, 1.3, c.p.fore, 'stand'),
      person(1230, 548, 1.2, c.p.fore, 'stand'),
      fg(c, 698, 14),
    ],
  },

  // 14: "Als gij een geruis zult horen op de toppen der moerbezienbomen, ga dan uit ten strijde; want God is voor uw aangezicht uitgegaan"
  '1-kronieken-bijbelquiz-deel-14': {
    hue: 156,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 300, sunR: 60, far: 'dunes', horizon: 476 }),
      tree(620, 520, 1.8, c.p.near),
      tree(860, 512, 2.0, c.p.fore),
      tree(1100, 520, 1.7, c.p.near),
      swish(640, 300, 200, c.p.accent, 7),
      swish(870, 270, 240, c.p.accent, 7),
      swish(1090, 310, 200, c.p.accent, 7),
      swish(760, 250, 160, c.p.accent, 5, 0.6),
      swish(990, 240, 160, c.p.accent, 5, 0.6),
      person(330, 544, 1.5, c.p.fore, 'point'),
      person(450, 548, 1.0, c.p.fore, 'bow'),
      spear(380, 552, 1.0, c.p.fore),
      fg(c, 698, 12),
    ],
  },

  // 15: "De kinderen der Levieten droegen de ark Gods op hun schouders, met de handbomen" - met zang en spel naar Jeruzalem
  '1-kronieken-bijbelquiz-deel-15': {
    hue: 158,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, rays: true, far: 'dunes', horizon: 476 }),
      cityWall(1200, 500, 0.9, c.p.near, 260),
      person(640, 546, 1.25, c.p.near, 'carry'),
      person(880, 546, 1.25, c.p.near, 'carry'),
      arkOfCovenant(720, 470, 1.0, c.p.accent),
      person(560, 550, 1.3, c.p.fore, 'carry'),
      person(800, 550, 1.3, c.p.fore, 'carry'),
      person(1060, 548, 1.4, c.p.fore, 'raise'),
      person(320, 548, 1.25, c.p.fore, 'raise'),
      cymbals(320, 334, 0.6, c.p.fore),
      fg(c, 698, 12),
    ],
  },

  // 16: Asaf liet zich horen met cimbalen voor de ark, in de tent die David gespannen had - de dankpsalm
  '1-kronieken-bijbelquiz-deel-16': {
    hue: 160,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1000, sunY: 280, far: 'dunes', ground: 'flat', horizon: 512 }),
      c.soft(980, 420, 220, 0.35),
      campTent(1000, 520, 2.1, c.p.near, c.p.fore),
      arkOfCovenant(1000, 530, 0.62, c.p.fore),
      person(560, 534, 1.6, c.p.fore, 'raise'),
      cymbals(560, 286, 1.0, c.p.accent),
      person(330, 536, 1.25, c.p.fore, 'stand'),
      lyre(390, 510, 0.55, c.p.fore),
      person(1260, 540, 1.1, c.p.fore, 'raise'),
      fg(c, 694, 12),
    ],
  },

  // 17: "Ik zal zijn troon bevestigen tot in eeuwigheid" - David zit 's nachts voor het aangezicht des HEEREN
  '1-kronieken-bijbelquiz-deel-17': {
    hue: 162,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 486, stars: 70 }),
      houseBlock(c.rand, 1150, 500, 1.1, c.p.near, { opacity: 0.85 }),
      path('M 520 500 C 600 430 680 410 780 408 C 880 410 940 440 1000 500 Z', c.p.mid),
      c.soft(770, 330, 220, 0.5),
      shafts(770, 80, 160, 300, c.p.light, 3),
      royalThrone(770, 412, 0.95, c.p.accent),
      person(400, 540, 1.55, c.p.fore, 'kneel'),
      figureAt(1000, 540, 1.3, c.p.fore, 'staff', true),
      fg(c, 696, 12),
    ],
  },

  // 18: David nam de gouden schilden van Hadadezers knechten en bracht ze naar Jeruzalem
  '1-kronieken-bijbelquiz-deel-18': {
    hue: 164,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 260, far: 'dunes', horizon: 474 }),
      cityWall(1150, 510, 1.1, c.p.near, 300),
      gateArch(1150, 510, 0.8, c.p.near),
      chariot(330, 512, 0.8, c.p.near, { opacity: 0.8 }),
      horse(220, 512, 0.75, c.p.near, { opacity: 0.8 }),
      person(560, 540, 1.4, c.p.fore, 'walk'),
      roundShield(586, 420, 1.3, c.p.accent),
      person(720, 542, 1.35, c.p.fore, 'walk'),
      roundShield(746, 424, 1.25, c.p.accent),
      person(880, 540, 1.3, c.p.fore, 'walk'),
      roundShield(906, 426, 1.2, c.p.accent),
      fg(c, 696, 14),
    ],
  },

  // 19: Joab zag dat de strijd tegen hem was van voren en van achteren: "Wees sterk, en laat ons ons sterk houden"
  '1-kronieken-bijbelquiz-deel-19': {
    hue: 166,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 700, sunY: 220, far: 'ridge', horizon: 472 }),
      path('M 960 500 C 1040 420 1140 392 1240 392 C 1340 394 1400 430 1460 500 Z', c.p.mid),
      citySkyline(c.rand, 1220, 396, 0.6, c.p.near, 4),
      crowd(c.rand, 1100, 506, 0.6, c.p.far, 6, 240),
      chariot(330, 508, 0.7, c.p.far),
      horse(240, 508, 0.6, c.p.far),
      chariot(470, 500, 0.6, c.p.far, { opacity: 0.8 }),
      person(640, 546, 1.55, c.p.fore, 'raise'),
      standard(700, 552, 1.05, c.p.fore, c.p.accent),
      person(800, 544, 1.35, c.p.fore, 'stand'),
      spear(840, 552, 1.0, c.p.fore),
      person(540, 548, 1.2, c.p.fore, 'stand'),
      fg(c, 698, 12),
    ],
  },

  // 20: David nam de kroon van hun koning - een talent gouds, met edelgesteente - en zij werd op Davids hoofd gezet
  '1-kronieken-bijbelquiz-deel-20': {
    hue: 168,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 270, far: 'dunes', horizon: 476 }),
      path('M 800 510 C 900 420 1000 390 1120 388 C 1240 390 1320 430 1420 510 Z', c.p.mid),
      cityWall(1120, 420, 0.85, c.p.near, 320),
      citySkyline(c.rand, 1120, 368, 0.6, c.p.near, 5),
      c.soft(640, 340, 160, 0.45),
      person(540, 546, 1.55, c.p.fore, 'stand'),
      person(760, 548, 1.45, c.p.fore, 'raise'),
      crown(670, 330, 0.95, c.p.accent),
      fg(c, 698, 12),
    ],
  },

  // 21: De engel des HEEREN stond tussen de aarde en de hemel, met een uitgetogen zwaard over Jeruzalem - de dorsvloer van Ornan
  '1-kronieken-bijbelquiz-deel-21': {
    hue: 170,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 760, sunY: 260, clouds: 3, far: 'none', horizon: 486 }),
      citySkyline(c.rand, 420, 486, 0.9, c.p.near, 6),
      cityWall(420, 500, 0.9, c.p.near, 420),
      c.soft(800, 300, 240, 0.6),
      angel(800, 420, 1.15, c.p.light, { opacity: 0.92 }),
      rotate(48, 860, 300, sword(860, 300, 1.15, c.p.accent)),
      ellipse(1060, 548, 170, 22, c.p.mid),
      ox(1080, 544, 0.8, c.p.fore),
      person(560, 556, 1.2, c.p.fore, 'fallen'),
      person(700, 558, 1.1, c.p.fore, 'fallen'),
      fg(c, 698, 12),
    ],
  },

  // 22: David bereidt in overvloed gehouwen stenen, ijzer, koper en cederhout voor het huis dat Salomo bouwen zal
  '1-kronieken-bijbelquiz-deel-22': {
    hue: 172,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'ridge', horizon: 474 }),
      logPile(1080, 540, 1.0, c.p.near, c.p.mid),
      stoneBlock(860, 516, 0.8, c.p.near),
      stoneBlock(940, 520, 0.7, c.p.near),
      stoneBlock(900, 480, 0.7, c.p.near),
      stoneBlock(640, 546, 1.4, c.p.accent),
      person(460, 548, 1.55, c.p.fore, 'point'),
      person(330, 550, 1.05, c.p.fore, 'stand'),
      crown(460, 324, 0.3, c.p.fore),
      fg(c, 698, 12),
    ],
  },

  // 23: De Levieten, van dertig jaren en daarboven: voor de toonbroden, en om alle morgen de HEERE te loven
  '1-kronieken-bijbelquiz-deel-23': {
    hue: 174,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 450, sunY: 250, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      solomonTemple(1060, 512, 0.85, c.p.near, c.p.fore),
      showbreadTable(570, 540, 1.25, c.p.fore, c.p.accent),
      person(300, 546, 1.35, c.p.fore, 'raise'),
      person(790, 546, 1.3, c.p.fore, 'raise'),
      person(1290, 548, 1.1, c.p.fore, 'raise'),
      fg(c, 696, 12),
    ],
  },

  // 24: De priesters verdeeld door het lot, Eleazars zonen en Ithamars zonen; Semaja de schrijver schreef ze op
  '1-kronieken-bijbelquiz-deel-24': {
    hue: 176,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'dunes', ground: 'flat', horizon: 512 }),
      rect(600, 470, 210, 12, c.p.near, { rx: 3 }),
      rect(612, 482, 10, 56, c.p.near),
      rect(788, 482, 10, 56, c.p.near),
      jar(705, 470, 1.05, c.p.accent),
      circle(690, 330, 11, c.p.accent),
      circle(728, 310, 11, c.p.accent),
      crowd(c.rand, 340, 540, 1.05, c.p.fore, 5, 300),
      crowd(c.rand, 1060, 542, 1.05, c.p.fore, 3, 180),
      person(900, 540, 1.0, c.p.fore, 'sit'),
      scroll(960, 500, 0.3, c.p.light),
      fg(c, 696, 12),
    ],
  },

  // 25: De zangers onder Asaf, Heman en Jeduthun, die profeteerden met harpen, met luiten en met cimbalen
  '1-kronieken-bijbelquiz-deel-25': {
    hue: 178,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      solomonTemple(1130, 512, 0.7, c.p.near, c.p.fore, { opacity: 0.7 }),
      lyre(640, 540, 1.4, c.p.accent),
      person(500, 546, 1.5, c.p.fore, 'carry'),
      person(820, 546, 1.35, c.p.fore, 'raise'),
      cymbals(820, 318, 0.6, c.p.fore),
      person(300, 548, 1.25, c.p.fore, 'stand'),
      lyre(350, 526, 0.55, c.p.fore),
      fg(c, 696, 12),
    ],
  },

  // 26: De poortiers bij het lot, en Ahia over de schatten van het huis Gods en de schatten der geheiligde dingen
  '1-kronieken-bijbelquiz-deel-26': {
    hue: 180,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      rect(470, 270, 470, 250, wallTone(c.p.near)),
      rect(456, 256, 498, 20, wallTone(c.p.near)),
      path('M 600 520 L 600 380 Q 705 320 810 380 L 810 520 Z', c.p.fore, { opacity: 0.75 }),
      goblet(650, 520, 1.1, c.p.accent),
      ingots(745, 520, 0.6, c.p.accent),
      coin(700, 470, 1.0, c.p.accent),
      coin(724, 478, 1.0, c.p.accent),
      jar(780, 470, 0.45, c.p.accent),
      figureAt(380, 546, 1.45, c.p.fore, 'staff'),
      figureAt(1040, 546, 1.45, c.p.fore, 'staff', true),
      fg(c, 696, 12),
    ],
  },

  // 27: De twaalf afdelingen die maand aan maand dienden, elk van vierentwintigduizend man
  '1-kronieken-bijbelquiz-deel-27': {
    hue: 182,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 482, stars: 50 }),
      ...Array.from({ length: 12 }, (_, i) => {
        const t = i / 11;
        const x = 200 + t * 1010;
        const y = 380 - Math.sin(Math.PI * t) * 190;
        return moon(x, y, 22, i === 5 ? c.p.accent : c.p.light);
      }),
      campTent(300, 512, 0.7, c.p.near, c.p.fore),
      campTent(1100, 516, 0.75, c.p.near, c.p.fore),
      ...[0, 1, 2, 3, 4, 5].map((i) => spear(500 + i * 80, 548 + (i % 2) * 4, 0.85, c.p.fore)),
      crowd(c.rand, 700, 548, 1.0, c.p.fore, 6, 420),
      fg(c, 698, 12),
    ],
  },

  // 28: David gaf zijn zoon Salomo het voorbeeld van het voorhuis, de huizen en de schatkamers - "Wees sterk en doe het"
  '1-kronieken-bijbelquiz-deel-28': {
    hue: 184,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 960, sunY: 280, far: 'dunes', ground: 'flat', horizon: 516 }),
      solomonTemple(960, 420, 0.95, c.p.light, c.p.light, { opacity: 0.4 }),
      throne(430, 532, 1.3, c.p.near),
      person(430, 498, 1.2, c.p.fore, 'sit'),
      crown(430, 372, 0.3, c.p.fore),
      scroll(620, 418, 0.7, c.p.accent),
      personLeft(780, 540, 1.45, c.p.fore, 'point'),
      crowd(c.rand, 1120, 544, 0.85, c.p.near, 5, 260),
      fg(c, 696, 12),
    ],
  },

  // 29: "Uw, o HEERE, is de grootheid" - de vorsten geven goud en zilver en edelgesteente gewillig; David looft God
  '1-kronieken-bijbelquiz-deel-29': {
    hue: 186,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 230, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      ingots(704, 534, 1.15, c.p.accent),
      goblet(600, 536, 1.0, c.p.accent),
      goblet(810, 536, 0.9, c.p.accent),
      coin(560, 510, 0.9, c.p.accent),
      coin(850, 514, 0.9, c.p.accent),
      person(420, 546, 1.6, c.p.fore, 'raise'),
      crown(420, 288, 0.32, c.p.fore),
      person(1000, 546, 1.1, c.p.fore, 'bow'),
      person(1120, 550, 1.05, c.p.fore, 'bow'),
      person(1240, 546, 1.1, c.p.fore, 'carry'),
      fg(c, 696, 12),
    ],
  },
};
