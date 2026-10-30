/**
 * Covers for Psalmen 51-100, one scene per quiz. Each quiz covers one psalm:
 * `psalmen-bijbelquiz-deel-<n>` is Psalm n. The psalms are poetry, so each
 * cover draws the psalm's central image rather than a narrative moment.
 *
 * Base hue 140 for Psalm 51, two degrees per psalm (Psalm 100 lands on 238).
 * See `quiz-cover-scene-kit.mts` for the house style; the motifs this series
 * needed (lyre, tear bottle, scales, altar, shofar, ark, boar, ...) are in
 * `quiz-cover-motifs-psalmen-2.mts`.
 *
 * Psalms: Schep mij een rein hart (51); een groene olijfboom in Gods huis
 * (52); God ziet neer op de mensenkinderen (53); vrijwillig offer in de
 * woestijn van Zif (54); vleugels als een duif (55); leg mijn tranen in Uw
 * fles (56); in de spelonk, luit en harp wekken de dageraad (57); er is een
 * God die op aarde richt (58); de honden rondom de stad (59); een banier voor
 * wie U vrezen (60); leid mij op de rots die mij te hoog is (61); alleen in
 * God is mijn ziel stil (62); mijn ziel dorst naar U in een dor land (63); God
 * schiet hen met een pijl (64); Gij kroont het jaar, de dalen vol koren (65);
 * Hij veranderde de zee in het droge (66); Hij doe Zijn aangezicht over ons
 * lichten (67); de optocht met de ark naar het heiligdom (68); de wateren tot
 * aan de ziel (69); haast U tot mijn hulp (70); verlaat mij niet in de
 * ouderdom (71); koningen brengen geschenken aan de koning (72); totdat ik in
 * Gods heiligdom inging, op gladde plaatsen (73); het heiligdom in brand (74);
 * de beker in de hand des HEEREN (75); boog, schild en zwaard verbroken, paard
 * en wagen in slaap (76); Uw bliksemen verlichtten de wereld (77); manna,
 * hemels koren (78); Jeruzalem tot steenhopen, het zuchten der gevangenen
 * (79); de wijnstok uit Egypte en het wilde zwijn (80); blaast de bazuin op de
 * nieuwe maan (81); God staat in de vergadering der goden (82); de volken
 * rondom Gods volk (83); de zwaluw een nest bij Uw altaren (84); de waarheid
 * spruit uit de aarde (85); leer mij Uw weg (86); de HEERE bemint de poorten
 * Sions (87); de ondersten kuil, de duisternis is mijn bekende (88); zijn troon
 * als de zon, als de maan (89); leer ons onze dagen tellen (90); onder Zijn
 * vleugelen, Zijn waarheid een schild (91); de palmboom en de ceder (92);
 * machtiger dan de baren der zee (93); de HEERE mijn hoog vertrek (94); de
 * schapen Zijner hand knielen (95); de bomen des wouds juichen (96); de
 * bergen versmelten als was (97); met trompetten en bazuin (98); in de
 * wolkkolom sprak Hij tot hen (99); gaat in Zijn poorten met lof (100).
 */

import { at, bushClump, fire, mix, mountain } from './cover-options/shapes.mjs';
import { base, fg, type C, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  banner,
  basket,
  bird,
  brickWall,
  chariot,
  circle,
  cityWall,
  citySkyline,
  cloudBank,
  coin,
  columns,
  crescent,
  crowd,
  crown,
  ellipse,
  fireBed,
  gateArch,
  houseBlock,
  palm,
  path,
  person,
  rays,
  rect,
  river,
  rotate,
  serpent,
  shafts,
  sheaf,
  ship,
  smokeColumn,
  streaks,
  stump,
  templeFront,
  tent,
  tower,
  trail,
  tree,
  wheat,
  window as windowFrame,
  witheredPlant,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  archer,
  arkOfCovenant,
  arrow,
  bar,
  boar,
  bolt,
  bottle,
  brokenBow,
  camel,
  caveRock,
  cedar,
  cloudColumn,
  crook,
  crownA,
  curlWave,
  dog,
  doveA,
  figureA,
  fireColumn,
  fissure,
  grapeBunch,
  greatVine,
  harp,
  heart,
  horseAsleep,
  hourglass,
  jar,
  kneelA,
  nest,
  oilLamp,
  pillarRock,
  pouringCup,
  sapling,
  scales,
  sheep,
  shield,
  shofar,
  stroke,
  swallow,
  sword,
  tear,
  throneA,
  timbrel,
  torch,
  trumpet,
  tentWide,
  wingCanopy,
} from './quiz-cover-motifs-psalmen-2.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A smooth mound from x0 to x1 on `base`, its top at `top`. */
function mound(x0: number, x1: number, top: number, baseY: number, fill: string): string {
  const k = baseY - (baseY - top) / 0.75;
  return `<path d="M ${r1(x0)} ${r1(baseY)} C ${r1(x0 + (x1 - x0) * 0.25)} ${r1(k)} ${r1(x0 + (x1 - x0) * 0.75)} ${r1(k)} ${r1(x1)} ${r1(baseY)} Z" fill="${fill}"/>`;
}

/** Hill and rock colours derived from the scene's palette. */
const hillCol = (c: C, t = 0.4) => mix(c.a.mid, c.a.near, t);
const rockCol = (c: C, t = 0.28) => mix(c.a.near, c.a.figure, t);
const seaCol = (c: C) => mix(c.a.mid, c.a.far, 0.45);

/** Small flecks scattered in a box, in one colour. */
function flecks(rand: () => number, x0: number, y0: number, w: number, h: number, n: number, rx: number, fill: string, opacity = 1): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const k = 0.6 + rand() * 0.6;
    out.push(ellipse(x0 + rand() * w, y0 + rand() * h, rx * k, rx * 0.7 * k, fill));
  }
  return opacity === 1 ? out.join('') : `<g opacity="${opacity}">${out.join('')}</g>`;
}

/** A flow of molten rock running down a slope, ending in a round drop. */
function waxFlow(x0: number, y0: number, x1: number, y1: number, w: number, fill: string): string {
  return stroke(`M ${r1(x0)} ${r1(y0)} C ${r1(x0 + (x1 - x0) * 0.2)} ${r1(y0 + (y1 - y0) * 0.5)} ${r1(x1)} ${r1(y1 - (y1 - y0) * 0.3)} ${r1(x1)} ${r1(y1)}`, fill, w) + circle(x1, y1 + w * 0.2, w * 0.75, fill);
}

export const PSALMEN2_SCENES: Record<string, Scene> = {
  // 51: "Schep mij een rein hart, o God" - David kneels in the morning light, his crown laid aside
  'psalmen-bijbelquiz-deel-51': {
    hue: 140,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 300, sunR: 60, far: 'none', ground: 'flat', horizon: 502 }),
      houseBlock(c.rand, 270, 506, 1.7, c.p.near),
      palm(470, 510, 1.1, c.p.near, { opacity: 0.85 }),
      shafts(820, 110, 260, 392, c.p.glow, 5),
      c.soft(820, 290, 190, 0.6),
      heart(820, 290, 0.85, c.p.accent),
      kneelA(620, 540, 1.9, c.p.fore, 'up'),
      crown(500, 528, 0.42, c.p.fore),
      fg(c, 688, 14),
    ],
  },

  // 52: "Maar ik ben als een groene olijfboom in het huis Gods" - the olive tree in fruit beside the temple; the boaster cut down
  'psalmen-bijbelquiz-deel-52': {
    hue: 142,
    mood: 'day',
    draw: (c) => {
      const k = 2.6 * 0.56;
      const olives: string[] = [];
      for (let i = 0; i < 22; i += 1) {
        const a = c.rand() * Math.PI * 2;
        const d = Math.sqrt(c.rand());
        olives.push(ellipse(546 + 4 * k + Math.cos(a) * d * 92 * k, 528 - 112 * k + Math.sin(a) * d * 40 * k, 8, 10, c.p.accent));
      }
      return [
        base(c, { sunX: 1210, sunY: 230, far: 'ridge', horizon: 470 }),
        templeFront(1010, 484, 1.35, c.p.near, 6),
        stump(200, 540, 1.1, c.p.mid),
        tree(546, 528, 2.6, c.p.near),
        olives.join(''),
        person(790, 534, 1.35, c.p.fore, 'raise'),
        fg(c, 686, 14),
      ];
    },
  },

  // 53: "God heeft van den hemel neergezien op de mensenkinderen" - light through the clouds on one who seeks Him among the wanderers; salvation from Zion
  'psalmen-bijbelquiz-deel-53': {
    hue: 144,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 476 }),
      cloudBank(c.rand, 704, 150, 2.4, c.p.light, { opacity: 0.7 }),
      cloudBank(c.rand, 420, 196, 1.3, c.p.light, { opacity: 0.45 }),
      shafts(704, 170, 460, 330, c.p.glow, 7),
      mound(110, 470, 398, 492, hillCol(c, 0.2)),
      citySkyline(c.rand, 290, 406, 0.75, c.p.accent, 4),
      crowd(c.rand, 440, 512, 0.8, c.p.near, 3, 110),
      crowd(c.rand, 1060, 506, 0.85, c.p.near, 6, 330),
      c.soft(704, 470, 150, 0.5),
      person(704, 540, 1.75, c.p.fore, 'kneel'),
      fg(c, 688, 14),
    ],
  },

  // 54: "Ik zal U vrijwillig offeren" - David's altar in the wilderness of Ziph, the Ziphites pointing him out on the far rocks
  'psalmen-bijbelquiz-deel-54': {
    hue: 146,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 240, sunY: 250, far: 'ridge', horizon: 466 }),
      path('M 980 486 C 1020 410 1080 386 1150 388 C 1220 392 1270 430 1320 486 Z', rockCol(c, 0.12)),
      person(1100, 396, 0.62, c.p.near, 'point'),
      person(1170, 398, 0.58, c.p.near, 'stand'),
      person(1220, 404, 0.52, c.p.near, 'stand'),
      smokeColumn(c.rand, 830, 300, 1.3, c.p.mid),
      altar(830, 538, 1.45, c.p.near, c.p.light),
      c.soft(830, 360, 170, 0.45, c.p.accent),
      at(830, 420, 1.15, fire(130, 84, c.p.accent, c.a.accent2, '#FFF6E0')),
      kneelA(570, 540, 1.8, c.p.fore, 'pray'),
      fg(c, 688, 14),
    ],
  },

  // 55: "Och, dat mij iemand vleugels gave als ener duive! ik zou henenvliegen" - the dove flying from the city of strife to the desert
  'psalmen-bijbelquiz-deel-55': {
    hue: 148,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 300, sunR: 64, far: 'dunes', horizon: 470 }),
      smokeColumn(c.rand, 250, 380, 1.3, c.p.mid),
      citySkyline(c.rand, 300, 468, 1.0, c.p.near, 5),
      cityWall(300, 500, 1.1, c.p.near, 360),
      person(570, 536, 1.65, c.p.fore, 'point'),
      c.soft(900, 320, 170, 0.45),
      doveA(900, 330, 1.3, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 56: "Leg mijn tranen in Uw fles" - David kneeling outside Gath at night, his tears gathered in a bottle
  'psalmen-bijbelquiz-deel-56': {
    hue: 150,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 290, sunY: 210, sunR: 46, far: 'none', ground: 'flat', horizon: 492 }),
      citySkyline(c.rand, 1110, 494, 0.9, c.p.far, 5),
      cityWall(1110, 502, 0.9, c.p.near, 320),
      kneelA(500, 540, 1.85, c.p.fore, 'pray'),
      c.soft(750, 430, 170, 0.45, c.p.accent),
      tear(750, 268, 1.5, c.p.light, { opacity: 0.9 }),
      tear(752, 318, 1.25, c.p.light, { opacity: 0.9 }),
      tear(748, 360, 1.0, c.p.light, { opacity: 0.9 }),
      bottle(750, 544, 1.55, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 57: "Waak op, luit en harp, ik zal den dageraad opwekken" - David at the mouth of the cave with his harp as the sun comes up
  'psalmen-bijbelquiz-deel-57': {
    hue: 152,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 432, sunR: 70, rays: true, far: 'ridge', horizon: 470 }),
      caveRock(350, 544, 560, 300, rockCol(c, 0.22), mix(c.a.figure, c.a.near, 0.2)),
      person(730, 540, 1.65, c.p.fore, 'stand'),
      harp(830, 530, 1.05, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 58: "Waarlijk, er is een God die op aarde richt" - the scales of justice over the bench of unjust judges, the deaf adder at their feet
  'psalmen-bijbelquiz-deel-58': {
    hue: 154,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 190, far: 'ridge', horizon: 476, clouds: 2 }),
      streaks(c.rand, 120, 140, 1160, 300, c.p.fore, 40, { opacity: 0.16 }),
      c.soft(704, 330, 240, 0.55),
      rect(550, 516, 308, 24, c.p.near, { rx: 4 }),
      scales(704, 518, 1.08, c.p.accent),
      rect(160, 474, 360, 18, c.p.near, { rx: 4 }),
      person(220, 536, 1.25, c.p.fore, 'sit'),
      person(340, 536, 1.25, c.p.fore, 'sit'),
      person(460, 536, 1.25, c.p.fore, 'sit'),
      serpent(960, 548, 0.95, c.p.fore),
      fg(c, 688, 14),
    ],
  },

  // 59: "Zij keren des avonds weder, zij huilen als honden, en gaan rondom de stad" - dogs prowling round David's house, one window lit
  'psalmen-bijbelquiz-deel-59': {
    hue: 156,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1130, sunY: 200, sunR: 44, far: 'none', ground: 'flat', horizon: 500 }),
      cityWall(1080, 504, 1.0, c.p.near, 340),
      houseBlock(c.rand, 680, 508, 1.75, c.p.near),
      c.soft(630, 410, 150, 0.55, c.p.accent),
      windowFrame(630, 452, 0.8, c.p.near, c.p.accent),
      bar(656, 452, 664, 508, 3.5, c.p.fore, 0.8),
      dog(360, 548, 1.4, c.p.fore),
      dog(940, 542, 1.25, c.p.fore, true),
      dog(1130, 554, 1.3, c.p.fore, true),
      fg(c, 690, 14),
    ],
  },

  // 60: "Gij hebt dengenen die U vrezen een banier gegeven" - the banner raised on the hill over a cracked land
  'psalmen-bijbelquiz-deel-60': {
    hue: 158,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 250, far: 'ridge', horizon: 470 }),
      mound(380, 920, 462, 528, hillCol(c, 0.5)),
      crowd(c.rand, 1080, 504, 0.9, c.p.near, 7, 340),
      banner(668, 468, 1.55, c.p.fore, c.p.accent),
      person(612, 472, 1.4, c.p.fore, 'raise'),
      fissure(250, 586, 560, 534, 22, mix(c.a.figure, c.a.near, 0.3)),
      fg(c, 688, 14),
    ],
  },

  // 61: "Leid mij op den rots, die mij te hoog zou zijn ... ik zal in Uw tent verkeren" - calling from the end of the earth to the tent on the high rock
  'psalmen-bijbelquiz-deel-61': {
    hue: 160,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 250, far: 'none', ground: 'water', horizon: 466 }),
      pillarRock(930, 530, 400, 362, rockCol(c, 0.25), '#FFFFFF'),
      ellipse(930, 530, 230, 9, '#FFFFFF', { opacity: 0.45 }),
      c.soft(932, 320, 150, 0.45),
      tentWide(932, 364, 0.84, c.p.accent, c.p.accentDeep),
      path(`M -20 540 C 150 520 330 516 520 548 C 560 560 580 600 600 ${H} L -20 ${H} Z`, hillCol(c, 0.5)),
      person(360, 552, 1.65, c.p.fore, 'raise'),
      fg(c, 694, 12),
    ],
  },

  // 62: "Alleen in God is mijn ziel stil; Hij alleen is mijn rots" - sitting quiet on the rock above still water in the evening light
  'psalmen-bijbelquiz-deel-62': {
    hue: 162,
    mood: 'dusk',
    draw: (c) => {
      const rock = 'M 350 548 L 372 500 L 412 474 L 432 432 L 486 406 L 540 400 L 582 386 L 650 388 L 702 402 L 744 422 L 774 454 L 804 482 L 838 548 Z';
      return [
        base(c, { sunX: 1100, sunY: 390, sunR: 60, far: 'ridge', ground: 'water', horizon: 466 }),
        `<g transform="translate(0 1096) scale(1 -1)"><path d="${rock}" fill="${rockCol(c, 0.2)}" opacity="0.18"/></g>`,
        `<path d="${rock}" fill="${rockCol(c, 0.25)}"/>`,
        stroke('M 432 432 L 486 406 L 540 400 L 582 386 L 650 388 L 702 402 L 744 422 L 774 454 L 804 482', c.p.accent, 7),
        stroke('M 412 500 L 470 492 M 640 470 L 720 476', mix(c.a.figure, c.a.near, 0.3), 4, 0.4),
        person(600, 392, 1.45, c.p.fore, 'sit'),
        fg(c, 696, 12),
      ];
    },
  },

  // 63: "Mijn ziel dorst naar U ... in een land, dor en mat, zonder water" - seeking God at dawn in the desert of Juda, the water jar empty
  'psalmen-bijbelquiz-deel-63': {
    hue: 164,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 330, sunR: 66, rays: true, far: 'dunes', horizon: 470 }),
      stroke('M 240 566 L 290 552 L 324 572 L 380 556 M 900 562 L 950 574 L 984 556 L 1050 568', mix(c.a.near, c.a.figure, 0.35), 4, 0.6),
      witheredPlant(320, 540, 1.6, c.p.near),
      witheredPlant(1030, 528, 1.2, c.p.near),
      person(610, 538, 1.7, c.p.fore, 'raise'),
      rotate(80, 830, 482, jar(830, 552, 1.35, c.p.accent)),
      fg(c, 688, 14),
    ],
  },

  // 64: "Maar God zal hen met een pijl schieten" - the archer hidden in the bushes, and the arrow from heaven
  'psalmen-bijbelquiz-deel-64': {
    hue: 166,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 250, far: 'ridge', horizon: 470, clouds: 1 }),
      at(300, 546, 1.0, bushClump(mix(c.a.near, c.a.figure, 0.35), undefined, c.rand)),
      archer(440, 546, 1.75, c.p.fore),
      person(1030, 540, 1.55, c.p.fore, 'walk'),
      bar(1000, 110, 840, 222, 7, '#FFFFFF', 0.5),
      arrow(840, 222, 170, 145, 2.0, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 65: "Gij kroont het jaar met Uw goedheid ... de dalen zijn bedekt met koren" - harvest fields along the full river of God
  'psalmen-bijbelquiz-deel-65': {
    hue: 168,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 230, rays: true, far: 'ridge', horizon: 462 }),
      cloudBank(c.rand, 330, 200, 1.0, c.p.light, { opacity: 0.6 }),
      streaks(c.rand, 220, 220, 240, 200, c.p.light, 24, { opacity: 0.4 }),
      river(462, c.p.water, { opacity: 0.9 }),
      sheep(850, 478, 0.6, c.p.light, c.p.near),
      sheep(920, 472, 0.55, c.p.light, c.p.near),
      sheep(985, 480, 0.6, c.p.light, c.p.near),
      wheat(270, 552, 1.05, c.p.accent, 6),
      wheat(430, 542, 0.8, c.p.accent, 5),
      wheat(990, 550, 0.95, c.p.accent, 6),
      sheaf(1160, 552, 1.1, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 66: "Hij heeft de zee veranderd in het droge; zij zijn te voet doorgegaan" - Israel walking between the walls of water toward the pillar of fire
  'psalmen-bijbelquiz-deel-66': {
    hue: 170,
    mood: 'day',
    draw: (c) => {
      const sea = mix(c.p.water, c.a.mid, 0.3);
      const face = mix(c.a.mid, c.a.near, 0.3);
      const mirror = (inner: string) => `<g transform="translate(${W} 0) scale(-1 1)">${inner}</g>`;
      const wall =
        `<path d="M -20 236 C 150 222 380 232 530 258 C 566 264 576 290 578 330 L 592 474 L 470 ${H} L -20 ${H} Z" fill="${sea}"/>` +
        `<path d="M 530 258 C 566 264 576 290 578 330 L 592 474 L 556 474 L 546 300 C 544 280 540 266 530 258 Z" fill="${face}" opacity="0.7"/>` +
        stroke('M -10 238 C 150 224 380 234 530 260 C 560 266 572 282 576 300', '#FFFFFF', 7, 0.9) +
        stroke('M 20 300 C 180 292 360 304 520 330 M 10 370 C 180 362 380 378 540 404 M 30 440 C 200 432 380 446 556 470', '#FFFFFF', 4, 0.5) +
        [[480, 248, 7], [430, 240, 5], [520, 250, 5], [360, 234, 4]].map(([x, y, r]) => circle(x, y - 10, r, '#FFFFFF', { opacity: 0.85 })).join('');
      return [
        base(c, { sunX: 1180, sunY: 220, far: 'none', ground: 'flat', horizon: 470 }),
        trail(704, H, 704, 470, 170, '#FFFFFF', { opacity: 0.3 }),
        c.soft(704, 360, 160, 0.45, c.p.accent),
        fireColumn(704, 476, 270, 64, c.p.accent, '#FFF6E0'),
        crowd(c.rand, 704, 488, 0.5, c.p.near, 4, 70),
        person(664, 526, 1.1, c.p.fore, 'walk'),
        person(752, 540, 1.2, c.p.fore, 'walk'),
        wall,
        mirror(wall),
        fg(c, 692, 12),
      ];
    },
  },

  // 67: "God zij ons genadig ... Hij doe Zijn aangezicht over ons lichten" - the light over the blessing priest and the nations on either side
  'psalmen-bijbelquiz-deel-67': {
    hue: 172,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 476 }),
      rays(c.rand, 704, 214, 760, c.p.accent, 18, { opacity: 0.14 }),
      c.soft(704, 214, 240, 0.6),
      circle(704, 214, 52, c.p.accent),
      mound(460, 950, 484, 538, hillCol(c, 0.5)),
      person(704, 494, 1.35, c.p.fore, 'raise'),
      crowd(c.rand, 290, 532, 1.05, c.p.near, 5, 290),
      crowd(c.rand, 1120, 532, 1.05, c.p.near, 5, 290),
      fg(c, 688, 14),
    ],
  },

  // 68: "Dat God opsta ... de zangers gingen voor, in het midden de maagden met trommelen" - the ark carried up to the sanctuary
  'psalmen-bijbelquiz-deel-68': {
    hue: 174,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 220, far: 'dunes', horizon: 466 }),
      path('M 880 486 C 940 386 1020 344 1110 340 C 1200 344 1260 394 1330 486 Z', hillCol(c, 0.3)),
      templeFront(1110, 348, 0.6, c.p.near, 5),
      person(310, 532, 1.15, c.p.fore, 'raise'),
      timbrel(347, 358, 1.15, c.p.fore),
      person(540, 534, 1.4, c.p.fore, 'carry'),
      person(810, 534, 1.4, c.p.fore, 'carry'),
      arkOfCovenant(675, 428, 1.05, c.p.accent, c.p.fore),
      person(980, 528, 1.05, c.p.near, 'raise'),
      fg(c, 688, 14),
    ],
  },

  // 69: "Verlos mij, o God, want de wateren zijn gekomen tot aan de ziel" - sinking in the deep waters, a break of light in the storm
  'psalmen-bijbelquiz-deel-69': {
    hue: 176,
    mood: 'storm',
    draw: (c) => {
      const sea = seaCol(c);
      return [
        base(c, { sun: 'none', far: 'none', ground: 'swell', horizon: 440, clouds: 2 }),
        cloudBank(c.rand, 600, 170, 2.6, c.p.mid, { opacity: 0.35 }),
        c.soft(900, 200, 210, 0.6, c.p.accent),
        shafts(900, 190, 300, 320, c.p.accent, 4),
        person(660, 624, 1.8, c.p.fore, 'raise'),
        curlWave(330, 560, 440, 130, sea, '#FFFFFF'),
        curlWave(1080, 566, 460, 120, sea, '#FFFFFF', true),
        `<path d="M -20 500 C 200 470 420 520 660 494 C 880 470 1100 510 ${W + 20} 488 L ${W + 20} ${H} L -20 ${H} Z" fill="${sea}"/>`,
        stroke('M 120 520 C 260 500 420 534 560 512 M 760 506 C 900 488 1060 520 1240 500', '#FFFFFF', 4, 0.6),
        `<path d="M -20 600 C 300 570 600 610 900 584 C 1100 568 1250 590 ${W + 20} 580 L ${W + 20} ${H} L -20 ${H} Z" fill="${mix(sea, c.a.figure, 0.12)}"/>`,
      ];
    },
  },

  // 70: "O God, haast U om mij te redden" - a torch raised on the hill in the night, the pursuers turning back
  'psalmen-bijbelquiz-deel-70': {
    hue: 178,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 486, stars: 50 }),
      mound(230, 910, 420, 544, hillCol(c, 0.6)),
      c.soft(668, 290, 190, 0.6, c.p.accent),
      person(580, 428, 1.55, c.p.fore, 'point'),
      torch(668, 318, 1.25, c.p.fore, c.p.accent),
      crowd(c.rand, 1110, 508, 0.8, c.p.near, 5, 230),
      fg(c, 690, 14),
    ],
  },

  // 71: "Verlaat mij niet, als mijn kracht vergaat ... van mijn jeugd af" - the old man with his staff and a child beside him at sunset
  'psalmen-bijbelquiz-deel-71': {
    hue: 180,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 370, sunR: 64, far: 'ridge', horizon: 470 }),
      trail(880, H, 990, 470, 120, '#FFFFFF', { opacity: 0.3 }),
      tree(270, 530, 1.7, c.p.near),
      figureA(590, 542, 1.65, c.p.fore, 'staff', c.p.accent),
      person(752, 542, 0.92, c.p.fore, 'stand'),
      fg(c, 690, 14),
    ],
  },

  // 72: "De koningen van Tharsis en de eilanden zullen geschenken aanbrengen" - kings kneeling with gifts before the king on his throne, ships at sea
  'psalmen-bijbelquiz-deel-72': {
    hue: 182,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'water', horizon: 450 }),
      ship(1170, 452, 0.5, c.p.near, c.p.light),
      ship(260, 448, 0.4, c.p.near, c.p.light, { opacity: 0.8 }),
      `<path d="M -20 494 C 300 486 1100 486 ${W + 20} 494 L ${W + 20} ${H} L -20 ${H} Z" fill="${hillCol(c, 0.3)}"/>`,
      c.soft(704, 360, 210, 0.5),
      throneA(704, 532, 0.95, rockCol(c, 0.12), c.p.light),
      person(704, 472, 1.1, c.p.fore, 'sit'),
      crownA(704, 370, 0.36, c.p.accent),
      kneelA(440, 544, 1.45, c.p.fore, 'forward'),
      basket(556, 548, 0.9, c.p.near),
      kneelA(968, 544, 1.45, c.p.fore, 'forward', true),
      coin(842, 538, 1.1, c.p.near),
      coin(870, 542, 1.1, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 73: "Totdat ik in Gods heiligdommen inging ... Gij zet hen op gladde plaatsen" - the sanctuary in light, the riches of the wicked sliding off the edge
  'psalmen-bijbelquiz-deel-73': {
    hue: 184,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1030, sunY: 300, far: 'dunes', horizon: 480 }),
      c.soft(1030, 380, 270, 0.55),
      templeFront(1040, 508, 1.4, c.p.near, 5),
      person(840, 538, 1.45, c.p.fore, 'walk'),
      `<path d="M -20 330 C 120 326 270 344 380 382 L 430 404 C 446 460 452 520 460 ${H} L -20 ${H} Z" fill="${rockCol(c, 0.12)}"/>`,
      rotate(16, 330, 386, houseBlock(c.rand, 280, 380, 0.8, c.p.near)),
      coin(452, 420, 1.5, c.p.accent),
      coin(494, 468, 1.4, c.p.accent),
      coin(474, 516, 1.5, c.p.accent),
      coin(526, 548, 1.3, c.p.accent),
      coin(424, 384, 1.3, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 74: "Zij hebben Uw heiligdommen in het vuur gesteld" - the burning, broken sanctuary, a mourner calling "Sta op, o God"
  'psalmen-bijbelquiz-deel-74': {
    hue: 186,
    mood: 'storm',
    draw: (c) => {
      const col = c.p.near;
      const pillar = (x: number, h: number, cap: boolean) =>
        rect(x - 15, 504 - h, 30, h, col) + (cap ? rect(x - 23, 504 - h - 12, 46, 14, col) : path(`M ${x - 15} ${504 - h} L ${x - 4} ${504 - h - 14} L ${x + 4} ${504 - h - 4} L ${x + 15} ${504 - h - 10} L ${x + 15} ${504 - h} Z`, col));
      return [
        base(c, { sun: 'none', far: 'ridge', horizon: 480, clouds: 2 }),
        smokeColumn(c.rand, 700, 330, 2.2, c.p.mid),
        smokeColumn(c.rand, 880, 300, 1.8, c.p.mid),
        rect(470, 502, 660, 22, col, { rx: 3 }),
        pillar(530, 220, true),
        pillar(630, 120, false),
        pillar(730, 236, true),
        pillar(840, 90, false),
        pillar(950, 200, true),
        pillar(1060, 150, false),
        c.soft(800, 460, 250, 0.5, c.p.accent),
        fireBed(c.rand, 800, 508, 1.2, c.p.accent, 10),
        rotate(-10, 690, 560, path('M 610 562 L 690 520 L 770 562 Z', col)),
        rotate(6, 960, 556, rect(870, 540, 190, 26, col, { rx: 12 })),
        kneelA(290, 548, 1.6, c.p.fore, 'up'),
        fg(c, 690, 14),
      ];
    },
  },

  // 75: "In de hand des HEEREN is een beker ... Hij vernedert dezen, en verhoogt genen" - the cup poured out between the pillars of the earth
  'psalmen-bijbelquiz-deel-75': {
    hue: 188,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'dunes', horizon: 482 }),
      columns(250, 530, 1.9, c.p.near, 2),
      columns(1160, 530, 1.9, c.p.near, 2),
      c.soft(690, 330, 200, 0.55),
      pouringCup(676, 344, 1.6, 50, c.p.accent, 532),
      person(530, 540, 1.45, c.p.fore, 'bow'),
      mound(800, 1040, 486, 528, hillCol(c, 0.5)),
      person(920, 496, 1.45, c.p.fore, 'stand'),
      fg(c, 690, 14),
    ],
  },

  // 76: "Aldaar heeft Hij verbroken de pijlen van den boog, het schild en het zwaard ... wagen en paard in diepen slaap" - broken weapons before Salem
  'psalmen-bijbelquiz-deel-76': {
    hue: 190,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'ridge', horizon: 470 }),
      mound(520, 960, 390, 486, hillCol(c, 0.3)),
      tent(740, 396, 0.75, c.p.near),
      rotate(-6, 220, 536, chariot(230, 536, 1.4, c.p.near)),
      horseAsleep(470, 552, 1.2, c.p.fore),
      sword(650, 566, 1.2, c.p.fore, true),
      shield(970, 500, 1.5, c.p.accent, c.p.light, true),
      brokenBow(1160, 556, 1.3, c.p.fore),
      arrow(880, 566, 100, -8, 1.1, c.p.fore),
      arrow(1060, 572, 90, 10, 1.1, c.p.fore),
      fg(c, 690, 14),
    ],
  },

  // 77: "Uw bliksemen verlichtten de wereld ... Uw weg was in de zee" - awake on the shore at night as the lightning lights the sea
  'psalmen-bijbelquiz-deel-77': {
    hue: 192,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'swell', horizon: 452, stars: 26 }),
      cloudBank(c.rand, 990, 170, 2.0, c.p.mid, { opacity: 0.4 }),
      c.soft(1000, 260, 240, 0.3, c.p.accent),
      bolt(950, 196, 250, 32, c.p.accent),
      bolt(1150, 206, 180, 22, c.p.accent, 0.8),
      path(`M 470 610 C 600 548 760 494 900 456 L 940 456 C 810 500 680 570 580 640 Z`, '#FFFFFF', { opacity: 0.3 }),
      `<path d="M -20 520 C 80 470 220 452 340 470 C 420 482 470 520 500 570 L 520 ${H} L -20 ${H} Z" fill="${rockCol(c, 0.2)}"/>`,
      person(290, 476, 1.6, c.p.fore, 'raise'),
    ],
  },

  // 78: "Hij regende het Man op hen om te eten, en gaf hun hemels koren" - manna falling on the camp in the wilderness
  'psalmen-bijbelquiz-deel-78': {
    hue: 194,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 220, far: 'ridge', horizon: 468 }),
      tent(240, 482, 0.85, c.p.near),
      tent(930, 480, 0.9, c.p.near),
      tent(1070, 484, 1.0, c.p.near),
      tent(1210, 478, 0.8, c.p.near),
      flecks(c.rand, 140, 140, 1140, 300, 74, 6.5, c.p.accent, 0.85),
      flecks(c.rand, 200, 518, 1000, 44, 50, 6.5, c.p.accent),
      kneelA(530, 546, 1.65, c.p.fore, 'plant'),
      person(770, 544, 1.5, c.p.fore, 'carry'),
      basket(770, 458, 0.95, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 79: "Zij hebben Jeruzalem tot steenhopen gemaakt ... laat het zuchten der gevangenen voor Uw aangezicht komen" - captives in chains leaving the ruins
  'psalmen-bijbelquiz-deel-79': {
    hue: 196,
    mood: 'night',
    draw: (c) => {
      const col = c.p.near;
      return [
        base(c, { sun: 'moon', sunX: 1150, sunY: 210, sunR: 44, far: 'dunes', horizon: 480 }),
        path('M 130 504 L 130 370 L 164 348 L 190 386 L 218 340 L 250 396 L 250 504 Z', col),
        path('M 284 504 L 284 414 L 316 396 L 340 426 L 374 404 L 404 438 L 404 504 Z', col),
        path('M 432 504 L 432 452 L 462 438 L 492 464 L 492 504 Z', col),
        ellipse(266, 510, 80, 20, col),
        ellipse(424, 514, 64, 15, col),
        bird(300, 280, 1.4, c.p.mid),
        bird(366, 248, 1.1, c.p.mid),
        bird(232, 238, 1.2, c.p.mid),
        person(620, 536, 1.35, c.p.fore, 'walk'),
        person(800, 538, 1.35, c.p.fore, 'walk'),
        person(980, 536, 1.3, c.p.fore, 'walk'),
        stroke('M 661 447 Q 710 478 759 449 M 841 449 Q 892 478 943 451', c.p.accent, 6.5),
        [[661, 447], [759, 449], [841, 449], [943, 451]].map(([x, y]) => circle(x, y, 8, c.p.accent)).join(''),
        fg(c, 690, 14),
      ];
    },
  },

  // 80: "Gij hebt een wijnstok uit Egypte gebracht ... het wilde zwijn uit het woud heeft hem doorwroet" - the great vine, its wall broken, the boar
  'psalmen-bijbelquiz-deel-80': {
    hue: 198,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 300, far: 'ridge', horizon: 470 }),
      brickWall(c.rand, 128, 550, 1.2, c.p.near, 3, 3),
      ellipse(270, 550, 44, 11, c.p.near),
      rect(250, 532, 28, 14, c.p.near, { rx: 3 }),
      greatVine(c.rand, 630, 550, 1.1, c.p.fore, c.p.near, c.p.accent),
      boar(1060, 558, 1.3, c.p.fore),
      fg(c, 690, 14),
    ],
  },

  // 81: "Blaast de bazuin in de nieuwe maan, in de bestemde tijd, ten dage onzes feests" - the shofar blown on the hill at the new moon
  'psalmen-bijbelquiz-deel-81': {
    hue: 200,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1030, sunY: 220, sunR: 40, far: 'ridge', horizon: 484 }),
      mound(260, 830, 476, 546, hillCol(c, 0.6)),
      tent(1010, 528, 0.95, c.p.near),
      tent(1150, 532, 1.15, c.p.near),
      c.soft(1080, 470, 130, 0.3, c.p.accent),
      figureA(540, 486, 1.6, c.p.fore, 'shield'),
      shofar(556, 304, 0.95, c.p.accent, 25),
      stroke('M 746 246 q 16 18 6 40 M 770 234 q 24 26 10 58', '#FFFFFF', 4, 0.55),
      fg(c, 690, 14),
    ],
  },

  // 82: "God staat in de vergadering Gods; Hij richt in het midden der goden" - the rulers on their thrones, the poor and the orphan in the light
  'psalmen-bijbelquiz-deel-82': {
    hue: 202,
    mood: 'gold',
    draw: (c) => {
      const seat = (x: number, y: number, s: number) =>
        throneA(x, y, 0.42 * s, rockCol(c, 0.1), c.p.light) + person(x, y - 18 * s, s, c.p.fore, 'sit') + crownA(x, y - 112 * s, 0.18 * s, c.p.accent);
      return [
        base(c, { sun: 'glow', sunX: 704, sunY: 150, far: 'none', ground: 'flat', horizon: 500 }),
        shafts(704, 110, 220, 400, c.p.glow, 5),
        c.soft(704, 420, 210, 0.55),
        seat(430, 512, 1.0),
        seat(980, 512, 1.0),
        seat(240, 540, 1.2),
        seat(1170, 540, 1.2),
        person(672, 542, 1.45, c.p.fore, 'stand'),
        person(764, 544, 0.85, c.p.fore, 'stand'),
        fg(c, 690, 14),
      ];
    },
  },

  // 83: "Zij hebben gezegd: Komt, en laat ons hen verdelgen" - the city of God's people on its hill, the tents and banners of the nations all around
  'psalmen-bijbelquiz-deel-83': {
    hue: 204,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 476, clouds: 2 }),
      streaks(c.rand, 100, 170, 1200, 300, c.p.fore, 40, { opacity: 0.15 }),
      mound(460, 950, 396, 502, hillCol(c, 0.5)),
      c.soft(704, 350, 180, 0.45),
      citySkyline(c.rand, 704, 370, 0.65, c.p.accent, 5),
      cityWall(704, 402, 0.8, c.p.accent, 250),
      tent(220, 526, 1.1, c.p.near),
      tent(380, 534, 0.9, c.p.near),
      tent(1030, 534, 0.9, c.p.near),
      tent(1190, 526, 1.1, c.p.near),
      banner(300, 536, 1.0, c.p.fore, c.p.mid),
      banner(456, 546, 0.8, c.p.fore, c.p.mid),
      banner(1100, 546, 0.8, c.p.fore, c.p.mid),
      banner(1250, 536, 1.0, c.p.fore, c.p.mid),
      fg(c, 690, 14),
    ],
  },

  // 84: "Ook heeft de mus een huis gevonden, en de zwaluw een nest ... bij Uw altaren" - swallows round the temple, a nest on the cornice
  'psalmen-bijbelquiz-deel-84': {
    hue: 206,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 220, far: 'dunes', ground: 'flat', horizon: 504 }),
      c.soft(704, 360, 230, 0.4),
      templeFront(704, 510, 1.8, c.p.near, 6),
      nest(586, 392, 1.5, c.p.accent, c.p.fore, c.a.accent2),
      swallow(470, 330, 1.25, c.p.fore),
      swallow(900, 258, 1.05, c.p.fore, true),
      swallow(1000, 340, 0.85, c.p.fore),
      swallow(400, 392, 0.8, c.p.fore, true),
      person(300, 540, 1.4, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 85: "De waarheid zal uit de aarde spruiten, en de gerechtigheid zal van den hemel nederzien" - a shoot rising in the light from heaven
  'psalmen-bijbelquiz-deel-85': {
    hue: 208,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', ground: 'flat', horizon: 486 }),
      shafts(704, 60, 320, 430, c.p.glow, 7),
      c.soft(704, 320, 270, 0.5),
      stroke('M 120 520 C 400 506 1000 506 1290 520 M 140 548 C 420 534 990 534 1270 548 M 160 580 C 440 566 970 566 1250 580', mix(c.a.near, c.a.figure, 0.2), 4, 0.45),
      sapling(704, 554, 2.65, c.p.fore, c.p.accent),
      kneelA(450, 546, 1.5, c.p.fore, 'plant'),
      fg(c, 690, 14),
    ],
  },

  // 86: "Leer mij, HEERE, Uw weg; ik zal in Uw waarheid wandelen" - walking the winding road with a lamp at dusk
  'psalmen-bijbelquiz-deel-86': {
    hue: 210,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1100, sunY: 300, sunR: 60, far: 'ridge', horizon: 462 }),
      path(
        `M 520 ${H} C 580 680 760 640 740 590 C 720 540 600 530 640 500 C 680 476 780 470 830 462 L 850 462 C 800 474 716 488 690 506 C 660 530 790 548 800 592 C 810 646 700 700 780 ${H} Z`,
        '#FFFFFF',
        { opacity: 0.4 },
      ),
      person(630, 542, 1.65, c.p.fore, 'walk'),
      c.soft(760, 400, 120, 0.6, c.p.accent),
      oilLamp(704, 450, 1.0, c.p.accent, c.a.accent2),
      fg(c, 690, 14),
    ],
  },

  // 87: "De HEERE bemint de poorten Sions ... deze is aldaar geboren" - the nations streaming up to the gate of the city on the holy mountain
  'psalmen-bijbelquiz-deel-87': {
    hue: 212,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 230, far: 'none', ground: 'flat', horizon: 492 }),
      path('M 300 520 C 400 420 480 346 560 340 L 850 340 C 930 346 1010 420 1110 520 Z', hillCol(c, 0.3)),
      citySkyline(c.rand, 704, 316, 0.6, c.p.near, 5),
      cityWall(704, 344, 0.8, c.p.near, 300),
      gateArch(704, 344, 0.62, c.p.accent),
      trail(704, 560, 704, 346, 70, '#FFFFFF', { opacity: 0.35 }),
      crowd(c.rand, 320, 532, 0.95, c.p.near, 5, 220),
      person(960, 538, 1.2, c.p.fore, 'walk'),
      camel(1110, 542, 1.0, c.p.fore),
      fg(c, 690, 14),
    ],
  },

  // 88: "Gij hebt mij in den ondersten kuil gelegd, in duisternissen" - alone at the bottom of the pit at night; the first light of morning
  'psalmen-bijbelquiz-deel-88': {
    hue: 214,
    mood: 'night',
    draw: (c) => {
      const earth = mix(c.a.ground, c.a.figure, 0.2);
      return [
        base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 362, stars: 40 }),
        c.soft(1170, 364, 170, 0.5, c.p.accent),
        `<path d="M 1124 366 A 46 46 0 0 1 1216 366 Z" fill="${c.p.accent}"/>`,
        `<path d="M -20 370 L ${W + 20} 370 L ${W + 20} ${H} L -20 ${H} Z" fill="${earth}"/>`,
        `<path d="M 566 370 L 580 392 L 572 420 L 588 456 L 580 500 L 596 548 Q 706 566 816 548 L 830 500 L 820 460 L 836 420 L 826 392 L 846 370 Z" fill="${mix(c.a.near, c.a.figure, 0.45)}"/>`,
        stroke('M 566 370 L 580 392 L 572 420 L 588 456 L 580 500 L 596 548 M 846 370 L 826 392 L 836 420 L 820 460 L 830 500 L 816 548', mix(c.a.figure, '#000000', 0.2), 6, 0.6),
        person(706, 552, 1.3, c.p.fore, 'sit'),
        stroke('M 120 420 L 220 426 M 300 470 L 440 462 M 960 430 L 1100 438 M 1160 490 L 1290 482 M 200 540 L 330 548 M 1000 560 L 1150 552', mix(c.a.ground, '#FFFFFF', 0.15), 4, 0.35),
        ellipse(500, 372, 26, 8, mix(c.a.figure, c.a.near, 0.3)),
        ellipse(900, 374, 34, 9, mix(c.a.figure, c.a.near, 0.3)),
      ];
    },
  },

  // 89: "Zijn troon zal zijn als de zon voor Mij; als de maan zal hij eeuwiglijk bevestigd worden" - David's throne between the sun and the moon
  'psalmen-bijbelquiz-deel-89': {
    hue: 216,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 270, sunR: 60, far: 'ridge', horizon: 478 }),
      c.soft(1120, 250, 160, 0.6, '#FFFFFF'),
      crescent(1120, 250, 56, '#FFFFFF'),
      c.soft(704, 380, 240, 0.45),
      rect(530, 524, 348, 22, c.p.near, { rx: 3 }),
      rect(570, 506, 268, 20, c.p.near, { rx: 3 }),
      throneA(704, 508, 0.88, c.p.accent, c.p.light),
      fg(c, 690, 14),
    ],
  },

  // 90: "Leer ons alzo onze dagen tellen" - Moses on the mountain, the hourglass, the grass that withers by evening
  'psalmen-bijbelquiz-deel-90': {
    hue: 218,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 330, sunR: 60, far: 'ridge', horizon: 470 }),
      mound(150, 640, 474, 544, hillCol(c, 0.5)),
      figureA(390, 486, 1.55, c.p.fore, 'staff'),
      hourglass(810, 554, 1.22, c.p.near, mix(c.a.far, '#FFFFFF', 0.5), c.p.accent),
      witheredPlant(980, 552, 1.35, c.p.near),
      witheredPlant(1070, 544, 1.0, c.p.near),
      witheredPlant(650, 556, 1.1, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 91: "Hij zal u dekken met Zijn vlerken ... Zijn waarheid is een rondas en beukelaar" - resting under the great wings, the shield beside, the arrows fallen short
  'psalmen-bijbelquiz-deel-91': {
    hue: 220,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1200, sunY: 200, sunR: 40, far: 'ridge', horizon: 480 }),
      c.soft(704, 400, 270, 0.45),
      wingCanopy(704, 436, 1.25, c.p.light, { opacity: 0.78 }),
      person(684, 544, 1.45, c.p.fore, 'sit'),
      shield(806, 506, 1.2, c.p.accent, c.p.light),
      arrow(240, 532, 100, 10, 1.1, c.p.near),
      arrow(1130, 548, 100, 172, 1.1, c.p.near),
      arrow(1190, 518, 90, 160, 1.1, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 92: "De rechtvaardige zal groeien als een palmboom; hij zal wassen als een ceder op Libanon" - palm and cedar in the courts of the LORD
  'psalmen-bijbelquiz-deel-92': {
    hue: 222,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 240, far: 'ridge', horizon: 470 }),
      columns(720, 506, 1.25, c.p.near, 4, { opacity: 0.8 }),
      palm(450, 550, 2.0, c.p.near),
      grapeBunch(428, 356, 1.0, c.p.accent),
      grapeBunch(474, 352, 1.0, c.p.accent),
      cedar(990, 550, 1.1, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 93: "De HEERE in de hoogte is geweldiger dan het bruisen van grote wateren" - the crown above the roaring waves
  'psalmen-bijbelquiz-deel-93': {
    hue: 224,
    mood: 'storm',
    draw: (c) => {
      const sea = seaCol(c);
      return [
        base(c, { sun: 'glow', sunX: 704, sunY: 240, far: 'none', ground: 'swell', horizon: 470, clouds: 2 }),
        rays(c.rand, 704, 280, 620, '#FFFFFF', 14, { opacity: 0.22 }),
        c.soft(704, 290, 220, 0.55),
        crownA(704, 344, 0.88, c.p.accent, c.p.light),
        curlWave(310, 576, 520, 200, sea, '#FFFFFF'),
        curlWave(1100, 576, 520, 190, sea, '#FFFFFF', true),
        `<path d="M -20 548 C 260 528 500 568 704 544 C 900 522 1150 560 ${W + 20} 538 L ${W + 20} ${H} L -20 ${H} Z" fill="${mix(sea, c.a.figure, 0.1)}"/>`,
        stroke('M 160 574 C 300 558 460 588 600 568 M 820 564 C 960 548 1110 578 1260 560', '#FFFFFF', 4, 0.55),
      ];
    },
  },

  // 94: "Maar de HEERE is mij tot een hoog vertrek, en mijn God tot een rots mijner toevlucht" - the widow, the orphan and the stranger coming to the tower on the rock
  'psalmen-bijbelquiz-deel-94': {
    hue: 226,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 270, far: 'ridge', horizon: 470 }),
      path('M 190 552 L 220 502 L 262 472 L 292 440 L 344 422 L 420 418 L 472 430 L 514 458 L 546 494 L 590 552 Z', rockCol(c, 0.22)),
      c.soft(410, 340, 150, 0.45),
      tower(410, 424, 0.95, c.p.accent),
      `<path d="M 398 424 L 398 400 A 12 12 0 0 1 422 400 L 422 424 Z" fill="${c.p.accentDeep}"/>`,
      stroke('M 640 552 C 590 530 560 510 570 486 C 580 462 520 444 476 432', '#FFFFFF', 7, 0.4),
      person(760, 542, 1.45, c.p.fore, 'walk'),
      person(864, 544, 0.85, c.p.fore, 'walk'),
      person(990, 540, 1.3, c.p.near, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 95: "Komt, laat ons aanbidden en nederbukken ... wij zijn de schapen Zijner hand" - worshippers kneeling beside the flock and the shepherd's crook
  'psalmen-bijbelquiz-deel-95': {
    hue: 228,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 330, sunR: 60, far: 'ridge', horizon: 470 }),
      kneelA(290, 546, 1.6, c.p.fore, 'pray'),
      kneelA(440, 540, 1.35, c.p.fore, 'up'),
      kneelA(566, 534, 1.12, c.p.near, 'forward'),
      crook(714, 548, 1.15, c.p.accent),
      sheep(846, 544, 1.1, c.p.light, c.p.fore),
      sheep(966, 536, 1.0, c.p.light, c.p.fore),
      sheep(1070, 548, 1.05, c.p.light, c.p.fore),
      sheep(1170, 534, 0.85, c.p.light, c.p.fore),
      fg(c, 690, 14),
    ],
  },

  // 96: "Dan zullen al de bomen des wouds juichen voor het aangezicht des HEEREN, want Hij komt" - the forest swaying in blossom toward the rising light
  'psalmen-bijbelquiz-deel-96': {
    hue: 230,
    mood: 'day',
    draw: (c) => {
      const grove = ([x, s, deg]: [number, number, number]) => {
        const bloom: string[] = [];
        for (let i = 0; i < 14; i += 1) {
          const a = c.rand() * Math.PI * 2;
          const d = Math.sqrt(c.rand());
          bloom.push(circle(x + Math.cos(a) * d * 58 * s, 528 - 62 * s + Math.sin(a) * d * 24 * s, 5.5 * s, c.p.accent));
        }
        return rotate(deg, x, 528, tree(x, 528, s, c.p.near) + bloom.join(''));
      };
      return [
        base(c, { sunX: 704, sunY: 270, sunR: 64, rays: true, far: 'none', ground: 'flat', horizon: 480 }),
        grove([240, 1.55, -9]),
        grove([430, 1.9, -5]),
        grove([980, 1.9, 5]),
        grove([1170, 1.55, 9]),
        bird(640, 350, 1.5, c.p.near),
        bird(704, 318, 1.2, c.p.near),
        bird(776, 360, 1.3, c.p.near),
        bird(736, 392, 1.0, c.p.near),
        fg(c, 690, 14),
      ];
    },
  },

  // 97: "Een vuur gaat voor Zijn aangezicht heen ... de bergen versmelten als was" - fire at the foot of the melting mountains under the dark cloud
  'psalmen-bijbelquiz-deel-97': {
    hue: 232,
    mood: 'gold',
    draw: (c) => {
      const m1 = rockCol(c, 0.15);
      const m2 = rockCol(c, 0.05);
      const w1 = mix(m1, '#FFFFFF', 0.45);
      const w2 = mix(m2, '#FFFFFF', 0.45);
      return [
        base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 486 }),
        cloudBank(c.rand, 704, 150, 2.8, c.p.mid, { opacity: 0.4 }),
        cloudBank(c.rand, 380, 200, 1.6, c.p.mid, { opacity: 0.35 }),
        bolt(560, 186, 170, 24, '#FFFFFF', 0.9),
        bolt(900, 172, 150, 20, '#FFFFFF', 0.8),
        at(950, 504, 1, mountain(320, 250, m2)),
        waxFlow(930, 262, 880, 360, 16, w2),
        waxFlow(950, 262, 1010, 340, 14, w2),
        waxFlow(980, 300, 1080, 400, 14, w2),
        at(450, 508, 1, mountain(280, 216, m1)),
        waxFlow(436, 300, 390, 380, 15, w1),
        waxFlow(456, 300, 510, 372, 13, w1),
        waxFlow(410, 330, 330, 420, 12, w1),
        c.soft(704, 470, 320, 0.5, c.p.accent),
        fireBed(c.rand, 704, 528, 1.25, c.p.accent, 13),
        fg(c, 690, 14),
      ];
    },
  },

  // 98: "Zingt den HEERE een nieuw lied ... met trompetten en geklank der bazuin; de zee bruise" - trumpets blown on the shore of the sea
  'psalmen-bijbelquiz-deel-98': {
    hue: 234,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 240, far: 'ridge', ground: 'water', horizon: 466 }),
      curlWave(1020, 520, 320, 90, seaCol(c), '#FFFFFF', true),
      curlWave(1230, 526, 260, 70, seaCol(c), '#FFFFFF', true),
      `<path d="M -20 500 C 200 488 500 492 780 520 C 860 530 900 560 920 ${H} L -20 ${H} Z" fill="${hillCol(c, 0.4)}"/>`,
      figureA(290, 546, 1.45, c.p.fore, 'shield'),
      trumpet(304, 378, 1.1, -24, c.p.accent),
      figureA(640, 546, 1.4, c.p.fore, 'shield'),
      trumpet(654, 384, 1.05, -18, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 99: "In de wolkkolom sprak Hij tot hen" - Moses, Aaron and Samuel bowing before the pillar of cloud over the tabernacle
  'psalmen-bijbelquiz-deel-99': {
    hue: 236,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 150, far: 'ridge', horizon: 470 }),
      c.soft(704, 300, 270, 0.5),
      cloudColumn(c.rand, 704, 470, 340, 130, mix(c.a.far, '#FFFFFF', 0.55), 0.95),
      tentWide(704, 524, 1.3, c.p.accent, c.p.accentDeep),
      figureA(310, 544, 1.5, c.p.fore, 'staff'),
      kneelA(460, 546, 1.4, c.p.fore, 'pray'),
      kneelA(1000, 546, 1.45, c.p.fore, 'forward', true),
      fg(c, 690, 14),
    ],
  },

  // 100: "Gaat in Zijn poorten met lof, in Zijn voorhoven met lofzang" - the joyful people and the sheep of His pasture coming to the gate
  'psalmen-bijbelquiz-deel-100': {
    hue: 238,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'dunes', ground: 'flat', horizon: 492 }),
      cityWall(704, 506, 1.3, c.p.near, 760),
      c.soft(704, 420, 150, 0.55),
      gateArch(704, 506, 1.45, c.p.accent),
      person(310, 540, 1.45, c.p.fore, 'raise'),
      person(460, 536, 1.3, c.p.fore, 'raise'),
      sheep(880, 544, 1.05, c.p.light, c.p.fore, true),
      sheep(996, 536, 1.0, c.p.light, c.p.fore, true),
      sheep(1110, 548, 1.05, c.p.light, c.p.fore, true),
      fg(c, 690, 14),
    ],
  },
};
