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
import { G, base, fg, type C, type Scene } from './quiz-cover-scene-kit.mjs';
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
  lamp,
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
  axe,
  bar,
  boar,
  bolt,
  bottle,
  brokenBow,
  camel,
  caveRock,
  cedar,
  cloudColumn,
  crag,
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

export const PSALMEN2_SCENES: Record<string, Scene> = {
  // 51: "Schep mij een rein hart, o God" - David kneels in the morning light, his crown laid aside
  'psalmen-bijbelquiz-deel-51': {
    hue: 140,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 300, sunR: 60, far: 'none', ground: 'flat', horizon: 500 }),
      houseBlock(c.rand, 290, 504, 1.5, c.p.near),
      palm(470, 508, 1.0, c.p.near, { opacity: 0.85 }),
      shafts(790, 110, 240, 420, c.p.glow, 5),
      c.soft(790, 300, 170, 0.55),
      heart(790, 300, 0.62, c.p.accent),
      kneelA(640, 530, 1.45, c.p.fore, 'up'),
      crown(540, 516, 0.3, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 52: "Maar ik ben als een groene olijfboom in het huis Gods" - the olive tree in fruit beside the temple; the boaster cut down
  'psalmen-bijbelquiz-deel-52': {
    hue: 142,
    mood: 'day',
    draw: (c) => {
      const olives: string[] = [];
      for (let i = 0; i < 18; i += 1) {
        const a = c.rand() * Math.PI * 2;
        const d = Math.sqrt(c.rand());
        olives.push(ellipse(566 + Math.cos(a) * d * 112, 380 + Math.sin(a) * d * 46, 7, 9, c.p.accent));
      }
      return [
        base(c, { sunX: 1200, sunY: 230, far: 'ridge', horizon: 470 }),
        templeFront(970, 482, 1.35, c.p.near, 6),
        stump(220, 536, 0.9, c.p.mid),
        tree(560, 526, 2.3, c.p.near),
        olives.join(''),
        person(770, 530, 1.15, c.p.fore, 'raise'),
        fg(c, 686, 14),
      ];
    },
  },

  // 53: "God heeft van den hemel neergezien op de mensenkinderen" - light through the clouds on the wandering crowd; salvation from Zion
  'psalmen-bijbelquiz-deel-53': {
    hue: 144,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 476 }),
      cloudBank(c.rand, 704, 150, 2.4, c.p.light, { opacity: 0.7 }),
      cloudBank(c.rand, 420, 196, 1.3, c.p.light, { opacity: 0.45 }),
      shafts(704, 170, 560, 360, c.p.glow, 7),
      mound(120, 500, 404, 490, hillCol(c, 0.2)),
      citySkyline(c.rand, 310, 412, 0.6, c.p.accent, 4),
      crowd(c.rand, 980, 500, 0.75, c.p.near, 7, 380),
      crowd(c.rand, 500, 508, 0.7, c.p.near, 3, 120),
      c.soft(704, 470, 130, 0.45),
      person(704, 534, 1.35, c.p.fore, 'kneel'),
      fg(c, 686, 14),
    ],
  },

  // 54: "Ik zal U vrijwillig offeren" - David's altar in the wilderness of Ziph, the Ziphites pointing him out on the far rocks
  'psalmen-bijbelquiz-deel-54': {
    hue: 146,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 250, far: 'ridge', horizon: 466 }),
      path('M 960 486 C 1000 410 1060 386 1130 388 C 1210 392 1260 430 1310 486 Z', rockCol(c, 0.12)),
      person(1090, 396, 0.6, c.p.near, 'point'),
      person(1160, 398, 0.55, c.p.near, 'stand'),
      person(1210, 404, 0.5, c.p.near, 'stand'),
      smokeColumn(c.rand, 810, 330, 1.2, c.p.mid),
      altar(810, 532, 1.2, c.p.near, c.p.light),
      c.soft(810, 380, 150, 0.45, c.p.accent),
      at(810, 436, 1, fire(130, 84, c.p.accent, c.a.accent2, '#FFF6E0')),
      kneelA(600, 534, 1.4, c.p.fore, 'pray'),
      fg(c, 686, 14),
    ],
  },

  // 55: "Och, dat mij iemand vleugels gave als ener duive! ik zou henenvliegen" - the dove flying from the city of strife to the desert
  'psalmen-bijbelquiz-deel-55': {
    hue: 148,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 300, sunR: 64, far: 'dunes', horizon: 470 }),
      smokeColumn(c.rand, 250, 380, 1.3, c.p.mid),
      citySkyline(c.rand, 300, 468, 1.0, c.p.near, 5),
      cityWall(300, 500, 1.1, c.p.near, 360),
      person(570, 530, 1.35, c.p.fore, 'point'),
      c.soft(880, 320, 150, 0.4),
      doveA(880, 330, 1.0, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 56: "Leg mijn tranen in Uw fles" - David kneeling outside Gath at night, his tears gathered in a bottle
  'psalmen-bijbelquiz-deel-56': {
    hue: 150,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 300, sunY: 210, sunR: 46, far: 'none', ground: 'flat', horizon: 492 }),
      citySkyline(c.rand, 1060, 494, 1.0, c.p.far, 6),
      cityWall(1060, 502, 1.0, c.p.near, 380),
      kneelA(530, 532, 1.45, c.p.fore, 'pray'),
      c.soft(730, 440, 140, 0.4, c.p.accent),
      tear(730, 318, 1.0, c.p.light, { opacity: 0.85 }),
      tear(732, 356, 0.85, c.p.light, { opacity: 0.85 }),
      tear(728, 390, 0.7, c.p.light, { opacity: 0.85 }),
      bottle(730, 534, 1.15, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 57: "Waak op, luit en harp, ik zal den dageraad opwekken" - David at the mouth of the cave with his harp as the sun comes up
  'psalmen-bijbelquiz-deel-57': {
    hue: 152,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 432, sunR: 70, rays: true, far: 'ridge', horizon: 470 }),
      caveRock(360, 542, 560, 300, rockCol(c, 0.22), mix(c.a.figure, c.a.near, 0.2)),
      person(720, 532, 1.35, c.p.fore, 'stand'),
      harp(790, 522, 0.82, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 58: "Waarlijk, er is een God die op aarde richt" - the scales of justice over the bench of unjust judges, the deaf adder at their feet
  'psalmen-bijbelquiz-deel-58': {
    hue: 154,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 190, far: 'ridge', horizon: 476, clouds: 2 }),
      streaks(c.rand, 120, 140, 1160, 300, c.p.fore, 40, { opacity: 0.16 }),
      c.soft(704, 320, 230, 0.55),
      rect(560, 500, 288, 26, c.p.near, { rx: 4 }),
      scales(704, 500, 1.0, c.p.accent),
      rect(190, 478, 300, 16, c.p.near, { rx: 4 }),
      person(250, 528, 1.05, c.p.fore, 'sit'),
      person(350, 528, 1.05, c.p.fore, 'sit'),
      person(450, 528, 1.05, c.p.fore, 'sit'),
      serpent(980, 540, 0.75, c.p.fore),
      fg(c, 686, 14),
    ],
  },

  // 59: "Zij keren des avonds weder, zij huilen als honden, en gaan rondom de stad" - dogs prowling round David's house, one window lit
  'psalmen-bijbelquiz-deel-59': {
    hue: 156,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1120, sunY: 200, sunR: 44, far: 'none', ground: 'flat', horizon: 500 }),
      cityWall(1060, 504, 1.0, c.p.near, 360),
      houseBlock(c.rand, 680, 506, 1.6, c.p.near),
      c.soft(640, 420, 130, 0.5, c.p.accent),
      windowFrame(640, 448, 0.6, c.p.near, c.p.accent),
      bar(660, 448, 668, 504, 3, c.p.fore, 0.8),
      dog(380, 540, 1.15, c.p.fore),
      dog(900, 534, 1.0, c.p.fore, true),
      dog(1080, 546, 1.05, c.p.fore, true),
      fg(c, 688, 14),
    ],
  },

  // 60: "Gij hebt dengenen die U vrezen een banier gegeven" - the banner raised on the hill over a cracked land
  'psalmen-bijbelquiz-deel-60': {
    hue: 158,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 250, far: 'ridge', horizon: 470 }),
      mound(400, 900, 452, 524, hillCol(c, 0.5)),
      crowd(c.rand, 1070, 500, 0.8, c.p.near, 8, 360),
      banner(668, 458, 1.5, c.p.fore, c.p.accent),
      person(616, 462, 1.15, c.p.fore, 'raise'),
      fissure(300, 560, 520, 528, 14, mix(c.a.figure, c.a.near, 0.3)),
      fg(c, 686, 14),
    ],
  },

  // 61: "Leid mij op den rots, die mij te hoog zou zijn ... ik zal in Uw tent verkeren" - calling from the end of the earth to the tent on the high rock
  'psalmen-bijbelquiz-deel-61': {
    hue: 160,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 250, far: 'none', ground: 'water', horizon: 466 }),
      crag(910, 524, 400, 334, rockCol(c, 0.25)),
      ellipse(910, 524, 220, 10, '#FFFFFF', { opacity: 0.4 }),
      c.soft(910, 300, 130, 0.45),
      tent(910, 336, 0.8, c.p.accent),
      path(`M -20 540 C 150 520 330 516 520 548 C 560 560 580 600 600 ${H} L -20 ${H} Z`, hillCol(c, 0.5)),
      person(360, 548, 1.4, c.p.fore, 'raise'),
      fg(c, 692, 12),
    ],
  },

  // 62: "Alleen in God is mijn ziel stil; Hij alleen is mijn rots" - sitting quiet on the rock above still water in the evening light
  'psalmen-bijbelquiz-deel-62': {
    hue: 162,
    mood: 'dusk',
    draw: (c) => {
      const rock = 'M 380 540 C 390 470 430 412 500 394 C 560 380 640 382 700 398 C 770 416 800 470 820 540 Z';
      return [
        base(c, { sunX: 1090, sunY: 390, sunR: 60, far: 'ridge', ground: 'water', horizon: 466 }),
        `<g transform="translate(0 1080) scale(1 -1)"><path d="${rock}" fill="${rockCol(c, 0.2)}" opacity="0.18"/></g>`,
        `<path d="${rock}" fill="${rockCol(c, 0.25)}"/>`,
        stroke('M 404 466 C 424 430 452 408 500 394 C 560 380 640 382 700 398 C 744 410 772 434 794 466', c.p.accent, 7),
        person(600, 392, 1.15, c.p.fore, 'sit'),
        fg(c, 694, 12),
      ];
    },
  },

  // 63: "Mijn ziel dorst naar U ... in een land, dor en mat, zonder water" - seeking God at dawn in the desert of Juda, the water jar empty
  'psalmen-bijbelquiz-deel-63': {
    hue: 164,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 330, sunR: 66, rays: true, far: 'dunes', horizon: 470 }),
      stroke('M 260 560 L 300 548 L 330 566 L 380 552 M 860 556 L 900 568 L 930 552 L 990 562', mix(c.a.near, c.a.figure, 0.35), 4, 0.6),
      witheredPlant(330, 534, 1.4, c.p.near),
      witheredPlant(1010, 522, 1.1, c.p.near),
      person(620, 532, 1.4, c.p.fore, 'raise'),
      rotate(90, 800, 492, jar(800, 544, 0.9, c.p.accent)),
      fg(c, 686, 14),
    ],
  },

  // 64: "Maar God zal hen met een pijl schieten" - the archer hidden in the bushes, and the arrow from heaven
  'psalmen-bijbelquiz-deel-64': {
    hue: 166,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'ridge', horizon: 470, clouds: 1 }),
      at(310, 540, 0.85, bushClump(mix(c.a.near, c.a.figure, 0.35), undefined, c.rand)),
      archer(420, 540, 1.4, c.p.fore),
      person(1010, 532, 1.3, c.p.fore, 'walk'),
      bar(980, 120, 820, 230, 6, '#FFFFFF', 0.5),
      arrow(820, 230, 150, 145, 1.5, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 65: "Gij kroont het jaar met Uw goedheid ... de dalen zijn bedekt met koren" - harvest fields along the full river of God
  'psalmen-bijbelquiz-deel-65': {
    hue: 168,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 230, rays: true, far: 'ridge', horizon: 462 }),
      cloudBank(c.rand, 330, 200, 1.0, c.p.light, { opacity: 0.6 }),
      streaks(c.rand, 220, 220, 240, 200, c.p.light, 24, { opacity: 0.4 }),
      river(462, c.p.water, { opacity: 0.9 }),
      sheep(860, 474, 0.42, c.p.light, c.p.near),
      sheep(910, 470, 0.38, c.p.light, c.p.near),
      sheep(955, 476, 0.42, c.p.light, c.p.near),
      wheat(270, 548, 0.95, c.p.accent, 6),
      wheat(420, 538, 0.75, c.p.accent, 5),
      wheat(980, 546, 0.85, c.p.accent, 6),
      sheaf(1150, 548, 1.0, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 66: "Hij heeft de zee veranderd in het droge; zij zijn te voet doorgegaan" - Israel walking between the walls of water toward the pillar of fire
  'psalmen-bijbelquiz-deel-66': {
    hue: 170,
    mood: 'day',
    draw: (c) => {
      const sea = seaCol(c);
      const lines = (pts: string[]) => pts.map((d) => stroke(d, '#FFFFFF', 4, 0.55)).join('');
      return [
        base(c, { sunX: 1170, sunY: 220, far: 'none', ground: 'flat', horizon: 470 }),
        trail(704, H, 704, 470, 170, '#FFFFFF', { opacity: 0.3 }),
        fireColumn(704, 476, 270, 64, c.p.accent, '#FFF6E0'),
        c.soft(704, 360, 150, 0.4, c.p.accent),
        crowd(c.rand, 704, 486, 0.45, c.p.near, 4, 70),
        person(670, 520, 0.85, c.p.fore, 'walk'),
        person(752, 532, 0.95, c.p.fore, 'walk'),
        `<path d="M -20 250 C 140 236 330 250 470 280 C 540 296 580 330 600 470 L 470 ${H} L -20 ${H} Z" fill="${sea}"/>`,
        `<path d="M ${W + 20} 250 C 1268 236 1078 250 938 280 C 868 296 828 330 808 470 L 938 ${H} L ${W + 20} ${H} Z" fill="${sea}"/>`,
        lines(['M 0 252 C 140 238 330 252 470 282 C 540 298 580 332 600 470', 'M 60 320 C 200 310 360 330 520 360', 'M 40 400 C 200 392 380 410 540 440']),
        lines([`M ${W} 252 C 1268 238 1078 252 938 282 C 868 298 828 332 808 470`, 'M 1350 320 C 1210 310 1050 330 890 360', 'M 1370 400 C 1210 392 1030 410 870 440']),
        fg(c, 690, 12),
      ];
    },
  },

  // 67: "God zij ons genadig ... Hij doe Zijn aangezicht over ons lichten" - the light over the blessing priest and the nations on either side
  'psalmen-bijbelquiz-deel-67': {
    hue: 172,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 476 }),
      rays(c.rand, 704, 230, 760, c.p.accent, 18, { opacity: 0.14 }),
      c.soft(704, 230, 240, 0.6),
      circle(704, 230, 52, c.p.accent),
      mound(470, 940, 476, 530, hillCol(c, 0.5)),
      person(704, 484, 1.2, c.p.fore, 'raise'),
      crowd(c.rand, 300, 526, 0.95, c.p.near, 6, 300),
      crowd(c.rand, 1110, 526, 0.95, c.p.near, 6, 300),
      fg(c, 686, 14),
    ],
  },

  // 68: "Dat God opsta ... de zangers gingen voor, in het midden de maagden met trommelen" - the ark carried up to the sanctuary
  'psalmen-bijbelquiz-deel-68': {
    hue: 174,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 220, far: 'dunes', horizon: 466 }),
      path('M 860 486 C 920 386 1000 344 1090 340 C 1180 344 1250 394 1320 486 Z', hillCol(c, 0.3)),
      templeFront(1090, 348, 0.6, c.p.near, 5),
      person(330, 526, 1.0, c.p.fore, 'raise'),
      timbrel(379, 374, 1.0, c.p.fore),
      person(560, 530, 1.2, c.p.fore, 'carry'),
      person(790, 530, 1.2, c.p.fore, 'carry'),
      arkOfCovenant(675, 440, 0.9, c.p.accent, c.p.fore),
      person(940, 524, 0.95, c.p.near, 'raise'),
      fg(c, 686, 14),
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
        c.soft(880, 200, 200, 0.6, c.p.accent),
        shafts(880, 190, 300, 320, c.p.accent, 4),
        person(660, 600, 1.55, c.p.fore, 'raise'),
        curlWave(360, 560, 420, 120, sea, '#FFFFFF'),
        curlWave(1060, 566, 440, 110, sea, '#FFFFFF', true),
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
      mound(240, 900, 418, 540, hillCol(c, 0.6)),
      c.soft(660, 290, 170, 0.55, c.p.accent),
      person(590, 424, 1.3, c.p.fore, 'point'),
      torch(660, 316, 1.0, c.p.fore, c.p.accent),
      crowd(c.rand, 1100, 504, 0.7, c.p.near, 5, 220),
      fg(c, 688, 14),
    ],
  },

  // 71: "Verlaat mij niet, als mijn kracht vergaat ... van mijn jeugd af" - the old man with his staff and a child beside him at sunset
  'psalmen-bijbelquiz-deel-71': {
    hue: 180,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 370, sunR: 64, far: 'ridge', horizon: 470 }),
      trail(860, H, 980, 470, 110, '#FFFFFF', { opacity: 0.3 }),
      tree(300, 524, 1.5, c.p.near),
      figureA(590, 534, 1.4, c.p.fore, 'staff', c.p.accent),
      person(730, 534, 0.78, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 72: "De koningen van Tharsis en de eilanden zullen geschenken aanbrengen" - kings kneeling with gifts before the king on his throne, ships at sea
  'psalmen-bijbelquiz-deel-72': {
    hue: 182,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'water', horizon: 450 }),
      ship(1160, 452, 0.5, c.p.near, c.p.light),
      ship(280, 448, 0.4, c.p.near, c.p.light, { opacity: 0.8 }),
      `<path d="M -20 494 C 300 486 1100 486 ${W + 20} 494 L ${W + 20} ${H} L -20 ${H} Z" fill="${hillCol(c, 0.3)}"/>`,
      c.soft(704, 360, 200, 0.5),
      throneA(704, 524, 0.82, rockCol(c, 0.12), c.p.light),
      person(704, 456, 0.95, c.p.fore, 'sit'),
      crownA(704, 366, 0.3, c.p.accent),
      kneelA(470, 534, 1.2, c.p.fore, 'forward'),
      basket(560, 540, 0.75, c.p.near),
      kneelA(940, 534, 1.2, c.p.fore, 'forward', true),
      coin(842, 532, 0.9, c.p.near),
      coin(866, 536, 0.9, c.p.near),
      fg(c, 688, 14),
    ],
  },

  // 73: "Totdat ik in Gods heiligdommen inging ... Gij zet hen op gladde plaatsen" - the sanctuary in light, the riches of the wicked sliding off the edge
  'psalmen-bijbelquiz-deel-73': {
    hue: 184,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1010, sunY: 300, far: 'dunes', horizon: 480 }),
      c.soft(1010, 380, 260, 0.55),
      templeFront(1010, 506, 1.35, c.p.near, 5),
      person(820, 532, 1.25, c.p.fore, 'walk'),
      `<path d="M -20 330 C 120 326 270 344 380 382 L 430 404 C 446 460 452 520 460 ${H} L -20 ${H} Z" fill="${rockCol(c, 0.12)}"/>`,
      rotate(16, 330, 386, houseBlock(c.rand, 280, 380, 0.75, c.p.near)),
      coin(450, 424, 1.1, c.p.accent),
      coin(486, 470, 1.0, c.p.accent),
      coin(470, 512, 1.1, c.p.accent),
      coin(512, 540, 0.9, c.p.accent),
      coin(430, 388, 1.0, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 74: "Zij hebben Uw heiligdommen in het vuur gesteld" - the burning, broken sanctuary, the axe left in front
  'psalmen-bijbelquiz-deel-74': {
    hue: 186,
    mood: 'storm',
    draw: (c) => {
      const col = c.p.near;
      const pillar = (x: number, h: number, cap: boolean) => rect(x - 14, 500 - h, 28, h, col) + (cap ? rect(x - 22, 500 - h - 12, 44, 14, col) : '');
      return [
        base(c, { sun: 'none', far: 'ridge', horizon: 480, clouds: 2 }),
        smokeColumn(c.rand, 640, 330, 2.2, c.p.mid),
        smokeColumn(c.rand, 820, 300, 1.8, c.p.mid),
        rect(380, 498, 650, 22, col, { rx: 3 }),
        pillar(440, 210, true),
        pillar(540, 120, false),
        pillar(640, 230, true),
        pillar(760, 84, false),
        pillar(860, 196, true),
        pillar(960, 140, false),
        rotate(-6, 600, 268, rect(410, 260, 250, 18, col)),
        c.soft(700, 460, 240, 0.5, c.p.accent),
        fireBed(c.rand, 700, 504, 1.15, c.p.accent, 10),
        rotate(8, 600, 552, rect(470, 534, 260, 26, col, { rx: 12 })),
        axe(330, 556, 1.1, -24, c.p.fore),
        fg(c, 686, 14),
      ];
    },
  },

  // 75: "In de hand des HEEREN is een beker ... de goddelozen der aarde zullen ze drinken" - the cup poured out between the pillars of the earth
  'psalmen-bijbelquiz-deel-75': {
    hue: 188,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 210, far: 'dunes', horizon: 482 }),
      columns(270, 526, 1.9, c.p.near, 2),
      columns(1140, 526, 1.9, c.p.near, 2),
      c.soft(704, 300, 190, 0.55),
      pouringCup(690, 300, 1.4, 50, c.p.accent, 520),
      person(560, 532, 1.2, c.p.fore, 'bow'),
      mound(800, 1020, 488, 524, hillCol(c, 0.5)),
      person(910, 496, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 76: "Aldaar heeft Hij verbroken de pijlen van den boog, het schild en het zwaard ... wagen en paard in diepen slaap" - broken weapons before Salem
  'psalmen-bijbelquiz-deel-76': {
    hue: 190,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 240, far: 'ridge', horizon: 470 }),
      mound(520, 940, 392, 486, hillCol(c, 0.3)),
      tent(730, 398, 0.7, c.p.near),
      rotate(-6, 300, 528, chariot(300, 528, 1.15, c.p.near)),
      horseAsleep(540, 544, 0.95, c.p.fore),
      shield(890, 498, 1.15, c.p.accent, c.p.light, true),
      sword(740, 546, 0.95, c.p.fore, true),
      brokenBow(1060, 550, 1.0, c.p.fore),
      arrow(960, 556, 90, -8, 1.0, c.p.fore),
      arrow(1120, 562, 80, 12, 1.0, c.p.fore),
      fg(c, 688, 14),
    ],
  },

  // 77: "Uw bliksemen verlichtten de wereld ... Uw weg was in de zee" - lying awake on the shore at night as the lightning lights the sea
  'psalmen-bijbelquiz-deel-77': {
    hue: 192,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'swell', horizon: 452, stars: 26 }),
      cloudBank(c.rand, 990, 170, 2.0, c.p.mid, { opacity: 0.4 }),
      c.soft(1000, 260, 240, 0.3, c.p.accent),
      bolt(950, 196, 240, 30, c.p.accent),
      bolt(1140, 206, 170, 22, c.p.accent, 0.8),
      path(`M 470 610 C 600 548 760 494 900 456 L 940 456 C 810 500 680 570 580 640 Z`, '#FFFFFF', { opacity: 0.3 }),
      `<path d="M -20 520 C 80 470 220 452 340 470 C 420 482 470 520 500 570 L 520 ${H} L -20 ${H} Z" fill="${rockCol(c, 0.2)}"/>`,
      person(290, 472, 1.3, c.p.fore, 'raise'),
    ],
  },

  // 78: "Hij regende het Man op hen om te eten, en gaf hun hemels koren" - manna falling on the camp in the wilderness
  'psalmen-bijbelquiz-deel-78': {
    hue: 194,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 220, far: 'ridge', horizon: 468 }),
      tent(250, 480, 0.8, c.p.near),
      tent(920, 478, 0.9, c.p.near),
      tent(1060, 482, 1.0, c.p.near),
      tent(1200, 476, 0.8, c.p.near),
      flecks(c.rand, 140, 140, 1140, 300, 70, 6, c.p.accent, 0.85),
      flecks(c.rand, 200, 512, 1000, 46, 46, 6, c.p.accent),
      kneelA(560, 536, 1.35, c.p.fore, 'plant'),
      person(760, 534, 1.25, c.p.fore, 'carry'),
      basket(760, 462, 0.8, c.p.near),
      fg(c, 686, 14),
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
        path('M 140 500 L 140 380 L 170 360 L 196 392 L 220 352 L 250 400 L 250 500 Z', col),
        path('M 290 500 L 290 420 L 318 404 L 340 430 L 372 410 L 400 440 L 400 500 Z', col),
        path('M 430 500 L 430 450 L 460 436 L 490 462 L 490 500 Z', col),
        ellipse(270, 506, 70, 18, col),
        ellipse(420, 510, 60, 14, col),
        bird(300, 280, 1.3, c.p.mid),
        bird(360, 250, 1.0, c.p.mid),
        bird(240, 240, 1.1, c.p.mid),
        person(640, 532, 1.15, c.p.fore, 'walk'),
        person(800, 534, 1.15, c.p.fore, 'walk'),
        person(960, 532, 1.1, c.p.fore, 'walk'),
        stroke('M 675 457 Q 720 486 765 459', c.p.accent, 6),
        stroke('M 835 459 Q 880 488 925 461', c.p.accent, 6),
        circle(675, 457, 7, c.p.accent),
        circle(765, 459, 7, c.p.accent),
        circle(835, 459, 7, c.p.accent),
        circle(925, 461, 7, c.p.accent),
        fg(c, 686, 14),
      ];
    },
  },

  // 80: "Gij hebt een wijnstok uit Egypte gebracht ... het wilde zwijn uit het woud heeft hem doorwroet" - the great vine, its wall broken, the boar
  'psalmen-bijbelquiz-deel-80': {
    hue: 198,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 300, far: 'ridge', horizon: 470 }),
      brickWall(c.rand, 150, 544, 1.1, c.p.near, 3, 3),
      ellipse(290, 544, 40, 10, c.p.near),
      rect(262, 528, 26, 13, c.p.near, { rx: 3 }),
      greatVine(c.rand, 640, 544, 1.0, c.p.fore, c.p.near, c.p.accent),
      boar(1040, 552, 0.95, c.p.fore),
      fg(c, 688, 14),
    ],
  },

  // 81: "Blaast de bazuin in de nieuwe maan, in de bestemde tijd, ten dage onzes feests" - the shofar blown on the hill at the new moon
  'psalmen-bijbelquiz-deel-81': {
    hue: 200,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1010, sunY: 220, sunR: 40, far: 'ridge', horizon: 484 }),
      mound(280, 820, 470, 540, hillCol(c, 0.6)),
      tent(1000, 524, 0.9, c.p.near),
      tent(1140, 528, 1.1, c.p.near),
      c.soft(1070, 470, 120, 0.3, c.p.accent),
      figureA(540, 478, 1.35, c.p.fore, 'shield'),
      shofar(552, 330, 0.85, c.p.accent),
      stroke('M 700 236 q 18 18 6 40 M 724 222 q 26 26 10 58', '#FFFFFF', 4, 0.55),
      fg(c, 688, 14),
    ],
  },

  // 82: "God staat in de vergadering Gods; Hij richt in het midden der goden" - the rulers on their thrones, the poor and the orphan in the light
  'psalmen-bijbelquiz-deel-82': {
    hue: 202,
    mood: 'gold',
    draw: (c) => {
      const seat = (x: number, y: number, s: number) =>
        throneA(x, y, 0.42 * s, rockCol(c, 0.1), c.p.light) + person(x, y - 18 * s, s, c.p.fore, 'sit') + crownA(x, y - 18 * s - 92 * s, 0.17 * s, c.p.accent);
      return [
        base(c, { sun: 'glow', sunX: 704, sunY: 150, far: 'none', ground: 'flat', horizon: 500 }),
        shafts(704, 110, 220, 430, c.p.glow, 5),
        c.soft(704, 420, 200, 0.5),
        seat(420, 506, 0.9),
        seat(990, 506, 0.9),
        seat(250, 532, 1.05),
        seat(1160, 532, 1.05),
        person(680, 534, 1.2, c.p.fore, 'stand'),
        person(752, 536, 0.72, c.p.fore, 'stand'),
        fg(c, 688, 14),
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
      mound(470, 940, 398, 500, hillCol(c, 0.5)),
      c.soft(704, 360, 170, 0.45),
      citySkyline(c.rand, 704, 372, 0.6, c.p.accent, 5),
      cityWall(704, 404, 0.75, c.p.accent, 240),
      tent(230, 520, 1.0, c.p.near),
      tent(380, 528, 0.85, c.p.near),
      tent(1040, 528, 0.85, c.p.near),
      tent(1180, 520, 1.0, c.p.near),
      banner(300, 530, 0.9, c.p.fore, c.p.mid),
      banner(450, 540, 0.75, c.p.fore, c.p.mid),
      banner(1100, 540, 0.75, c.p.fore, c.p.mid),
      banner(1250, 530, 0.9, c.p.fore, c.p.mid),
      fg(c, 686, 14),
    ],
  },

  // 84: "Ook heeft de mus een huis gevonden, en de zwaluw een nest ... bij Uw altaren" - swallows round the temple, a nest on the cornice
  'psalmen-bijbelquiz-deel-84': {
    hue: 206,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 220, far: 'dunes', ground: 'flat', horizon: 504 }),
      c.soft(704, 360, 220, 0.4),
      templeFront(704, 508, 1.75, c.p.near, 6),
      nest(578, 318, 0.95, c.p.accent, c.p.fore),
      swallow(470, 300, 1.0, c.p.fore),
      swallow(890, 262, 0.85, c.p.fore, true),
      swallow(980, 340, 0.7, c.p.fore),
      swallow(420, 390, 0.65, c.p.fore, true),
      person(330, 532, 1.2, c.p.fore, 'walk'),
      fg(c, 688, 14),
    ],
  },

  // 85: "De waarheid zal uit de aarde spruiten, en de gerechtigheid zal van den hemel nederzien" - a shoot rising in the light from heaven
  'psalmen-bijbelquiz-deel-85': {
    hue: 208,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', ground: 'flat', horizon: 486 }),
      shafts(704, 60, 320, 480, c.p.glow, 7),
      c.soft(704, 320, 260, 0.5),
      stroke('M 120 520 C 400 506 1000 506 1290 520 M 140 548 C 420 534 990 534 1270 548 M 160 580 C 440 566 970 566 1250 580', mix(c.a.near, c.a.figure, 0.2), 4, 0.45),
      sapling(704, 548, 2.3, c.p.fore, c.p.accent),
      kneelA(470, 540, 1.2, c.p.fore, 'plant'),
      fg(c, 688, 14),
    ],
  },

  // 86: "Leer mij, HEERE, Uw weg; ik zal in Uw waarheid wandelen" - walking the winding road with a lamp at dusk
  'psalmen-bijbelquiz-deel-86': {
    hue: 210,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 300, sunR: 60, far: 'ridge', horizon: 462 }),
      path(
        `M 520 ${H} C 580 680 760 640 740 590 C 720 540 600 530 640 500 C 680 476 780 470 830 462 L 850 462 C 800 474 716 488 690 506 C 660 530 790 548 800 592 C 810 646 700 700 780 ${H} Z`,
        '#FFFFFF',
        { opacity: 0.4 },
      ),
      person(650, 534, 1.35, c.p.fore, 'walk'),
      c.soft(706, 440, 90, 0.55, c.p.accent),
      lamp(704, 448, 1.4, c.p.accent, c.a.accent2),
      fg(c, 688, 14),
    ],
  },

  // 87: "De HEERE bemint de poorten Sions ... deze is aldaar geboren" - the nations streaming up to the gate of the city on the holy mountain
  'psalmen-bijbelquiz-deel-87': {
    hue: 212,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 230, far: 'none', ground: 'flat', horizon: 492 }),
      path('M 300 520 C 400 420 480 346 560 340 L 850 340 C 930 346 1010 420 1110 520 Z', hillCol(c, 0.3)),
      citySkyline(c.rand, 704, 316, 0.6, c.p.near, 5),
      cityWall(704, 344, 0.8, c.p.near, 300),
      gateArch(704, 344, 0.6, c.p.accent),
      trail(704, 560, 704, 346, 70, '#FFFFFF', { opacity: 0.35 }),
      crowd(c.rand, 330, 526, 0.85, c.p.near, 5, 220),
      person(970, 530, 1.05, c.p.fore, 'walk'),
      camel(1110, 534, 0.85, c.p.fore),
      fg(c, 688, 14),
    ],
  },

  // 88: "Gij hebt mij in den ondersten kuil gelegd, in duisternissen" - alone at the bottom of the pit at night; the first light of morning
  'psalmen-bijbelquiz-deel-88': {
    hue: 214,
    mood: 'night',
    draw: (c) => {
      const earth = mix(c.a.ground, c.a.figure, 0.2);
      return [
        base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 420, stars: 40 }),
        c.soft(1160, 420, 160, 0.5, c.p.accent),
        `<path d="M 1110 422 A 50 50 0 0 1 1210 422 Z" fill="${c.p.accent}"/>`,
        `<path d="M -20 430 L 580 430 C 590 500 586 560 596 ${H} L -20 ${H} Z" fill="${earth}"/>`,
        `<path d="M ${W + 20} 430 L 830 430 C 820 500 826 560 816 ${H} L ${W + 20} ${H} Z" fill="${earth}"/>`,
        `<path d="M 580 430 C 590 500 586 560 596 ${H} L 816 ${H} C 826 560 820 500 830 430 Z" fill="${mix(c.a.near, c.a.figure, 0.45)}"/>`,
        stroke('M 580 430 C 590 500 586 560 596 760 M 830 430 C 820 500 826 560 816 760', mix(c.a.figure, '#000000', 0.2), 6, 0.6),
        person(706, 590, 1.1, c.p.fore, 'sit'),
        stroke('M 120 470 L 200 476 M 300 520 L 420 512 M 980 480 L 1100 488 M 1180 540 L 1280 532', mix(c.a.ground, '#FFFFFF', 0.2), 3, 0.4),
      ];
    },
  },

  // 89: "Zijn troon zal zijn als de zon voor Mij; als de maan zal hij eeuwiglijk bevestigd worden" - David's throne between the sun and the moon
  'psalmen-bijbelquiz-deel-89': {
    hue: 216,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 290, sunY: 270, sunR: 60, far: 'ridge', horizon: 478 }),
      c.soft(1110, 240, 120, 0.4, '#FFFFFF'),
      crescent(1110, 240, 44, '#FFFFFF'),
      c.soft(704, 380, 230, 0.4),
      rect(540, 514, 328, 20, c.p.near, { rx: 3 }),
      rect(576, 496, 256, 20, c.p.near, { rx: 3 }),
      throneA(704, 498, 0.85, c.p.accent, c.p.light),
      fg(c, 688, 14),
    ],
  },

  // 90: "Leer ons alzo onze dagen tellen" - Moses on the mountain, the hourglass, the grass that withers by evening
  'psalmen-bijbelquiz-deel-90': {
    hue: 218,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 330, sunR: 60, far: 'ridge', horizon: 470 }),
      mound(160, 620, 470, 540, hillCol(c, 0.5)),
      figureA(390, 480, 1.35, c.p.fore, 'staff'),
      hourglass(800, 548, 1.12, c.p.near, mix(c.a.far, '#FFFFFF', 0.5), c.p.accent),
      witheredPlant(960, 548, 1.2, c.p.near),
      witheredPlant(1040, 540, 0.9, c.p.near),
      witheredPlant(640, 552, 1.0, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 91: "Hij zal u dekken met Zijn vlerken ... Zijn waarheid is een rondas en beukelaar" - resting under the great wings, the shield beside, the arrows fallen short
  'psalmen-bijbelquiz-deel-91': {
    hue: 220,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1190, sunY: 200, sunR: 40, far: 'ridge', horizon: 480 }),
      c.soft(704, 400, 260, 0.45),
      wingCanopy(704, 430, 1.15, c.p.light, { opacity: 0.75 }),
      person(680, 534, 1.25, c.p.fore, 'sit'),
      shield(790, 500, 1.05, c.p.accent, c.p.light),
      arrow(250, 520, 90, 10, 1.0, c.p.near),
      arrow(1120, 540, 90, 172, 1.0, c.p.near),
      arrow(1180, 512, 80, 160, 1.0, c.p.near),
      fg(c, 688, 14),
    ],
  },

  // 92: "De rechtvaardige zal groeien als een palmboom; hij zal wassen als een ceder op Libanon" - palm and cedar in the courts of the LORD
  'psalmen-bijbelquiz-deel-92': {
    hue: 222,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'ridge', horizon: 470 }),
      columns(720, 500, 1.2, c.p.near, 4, { opacity: 0.8 }),
      palm(470, 542, 1.75, c.p.near),
      grapeBunch(450, 376, 0.8, c.p.accent),
      grapeBunch(492, 372, 0.8, c.p.accent),
      cedar(960, 542, 1.05, c.p.near),
      fg(c, 688, 14),
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
        rays(c.rand, 704, 270, 620, '#FFFFFF', 14, { opacity: 0.22 }),
        c.soft(704, 280, 210, 0.55),
        crownA(704, 330, 0.8, c.p.accent, c.p.light),
        curlWave(320, 566, 540, 230, sea, '#FFFFFF'),
        curlWave(1090, 566, 540, 210, sea, '#FFFFFF', true),
        `<path d="M -20 540 C 260 520 500 560 704 536 C 900 514 1150 552 ${W + 20} 530 L ${W + 20} ${H} L -20 ${H} Z" fill="${mix(sea, c.a.figure, 0.1)}"/>`,
        stroke('M 160 566 C 300 550 460 580 600 560 M 820 556 C 960 540 1110 570 1260 552', '#FFFFFF', 4, 0.55),
      ];
    },
  },

  // 94: "Maar de HEERE is mij tot een hoog vertrek, en mijn God tot een rots mijner toevlucht" - the widow and orphan climbing to the tower on the rock
  'psalmen-bijbelquiz-deel-94': {
    hue: 226,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 290, sunR: 60, far: 'ridge', horizon: 470 }),
      crag(400, 546, 440, 384, rockCol(c, 0.22)),
      tower(400, 388, 0.8, c.p.near),
      c.soft(400, 360, 90, 0.5, c.p.accent),
      `<path d="M 386 388 L 386 366 A 14 14 0 0 1 414 366 L 414 388 Z" fill="${c.p.accent}"/>`,
      stroke('M 620 546 C 560 520 520 500 540 470 C 560 444 500 420 470 400', '#FFFFFF', 6, 0.4),
      person(760, 534, 1.25, c.p.fore, 'walk'),
      person(850, 536, 0.72, c.p.fore, 'walk'),
      person(960, 530, 1.1, c.p.near, 'walk'),
      fg(c, 686, 14),
    ],
  },

  // 95: "Komt, laat ons aanbidden en nederbukken ... wij zijn de schapen Zijner hand" - worshippers kneeling beside the flock and the shepherd's crook
  'psalmen-bijbelquiz-deel-95': {
    hue: 228,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 330, sunR: 60, far: 'ridge', horizon: 470 }),
      kneelA(320, 536, 1.35, c.p.fore, 'pray'),
      kneelA(450, 530, 1.15, c.p.fore, 'up'),
      kneelA(560, 524, 1.0, c.p.near, 'forward'),
      crook(706, 540, 1.0, c.p.accent),
      sheep(830, 534, 0.95, c.p.light, c.p.fore),
      sheep(940, 526, 0.85, c.p.light, c.p.fore),
      sheep(1030, 538, 0.9, c.p.light, c.p.fore),
      sheep(1120, 524, 0.75, c.p.light, c.p.fore),
      fg(c, 686, 14),
    ],
  },

  // 96: "Dan zullen al de bomen des wouds juichen voor het aangezicht des HEEREN, want Hij komt" - the forest swaying in blossom toward the rising light
  'psalmen-bijbelquiz-deel-96': {
    hue: 230,
    mood: 'day',
    draw: (c) => {
      const grove = ([x, s, deg]: [number, number, number]) => {
        const bloom: string[] = [];
        for (let i = 0; i < 12; i += 1) {
          const a = c.rand() * Math.PI * 2;
          const d = Math.sqrt(c.rand());
          bloom.push(circle(x + Math.cos(a) * d * 58 * s, 524 - 62 * s + Math.sin(a) * d * 24 * s, 5 * s, c.p.accent));
        }
        return rotate(deg, x, 524, tree(x, 524, s, c.p.near) + bloom.join(''));
      };
      return [
        base(c, { sunX: 704, sunY: 270, sunR: 64, rays: true, far: 'none', ground: 'flat', horizon: 480 }),
        grove([250, 1.45, -9]),
        grove([430, 1.75, -5]),
        grove([980, 1.75, 5]),
        grove([1160, 1.45, 9]),
        bird(640, 340, 1.4, c.p.near),
        bird(700, 310, 1.1, c.p.near),
        bird(770, 350, 1.2, c.p.near),
        bird(730, 380, 0.9, c.p.near),
        fg(c, 688, 14),
      ];
    },
  },

  // 97: "Wolken en donkerheid zijn rondom Hem ... een vuur gaat voor Zijn aangezicht heen ... de bergen versmelten als was" - fire at the foot of the melting mountains
  'psalmen-bijbelquiz-deel-97': {
    hue: 232,
    mood: 'gold',
    draw: (c) => {
      const m1 = rockCol(c, 0.15);
      const m2 = rockCol(c, 0.05);
      const drips = (pts: [number, number, number][], fill: string) => pts.map(([x, y, h]) => rect(x - 7, y, 14, h, fill, { rx: 7 })).join('');
      return [
        base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 486 }),
        cloudBank(c.rand, 704, 150, 2.8, c.p.mid, { opacity: 0.4 }),
        cloudBank(c.rand, 380, 200, 1.6, c.p.mid, { opacity: 0.35 }),
        bolt(560, 190, 180, 24, '#FFFFFF', 0.9),
        bolt(890, 176, 160, 20, '#FFFFFF', 0.8),
        at(940, 500, 1, mountain(320, 250, m2)),
        drips([[900, 290, 60], [960, 300, 44], [1020, 330, 70], [860, 330, 50], [1090, 380, 54]], mix(m2, '#FFFFFF', 0.3)),
        at(460, 504, 1, mountain(280, 210, m1)),
        drips([[430, 320, 54], [490, 330, 40], [380, 360, 66], [550, 370, 48]], mix(m1, '#FFFFFF', 0.3)),
        c.soft(704, 470, 300, 0.45, c.p.accent),
        fireBed(c.rand, 704, 524, 1.15, c.p.accent, 12),
        fg(c, 686, 14),
      ];
    },
  },

  // 98: "Zingt den HEERE een nieuw lied ... met trompetten en geklank der bazuin; de zee bruise" - trumpets blown on the shore of the sea
  'psalmen-bijbelquiz-deel-98': {
    hue: 234,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 240, far: 'ridge', ground: 'water', horizon: 466 }),
      curlWave(1010, 516, 300, 80, seaCol(c), '#FFFFFF', true),
      curlWave(1220, 522, 260, 64, seaCol(c), '#FFFFFF', true),
      `<path d="M -20 500 C 200 488 500 492 760 520 C 840 530 880 560 900 ${H} L -20 ${H} Z" fill="${hillCol(c, 0.4)}"/>`,
      figureA(300, 540, 1.3, c.p.fore, 'shield'),
      trumpet(314, 386, 1.0, -26, c.p.accent),
      figureA(620, 540, 1.25, c.p.fore, 'shield'),
      trumpet(634, 392, 0.95, -20, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 99: "In de wolkkolom sprak Hij tot hen" - Moses, Aaron and Samuel bowing before the pillar of cloud over the tabernacle
  'psalmen-bijbelquiz-deel-99': {
    hue: 236,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 150, far: 'ridge', horizon: 470 }),
      c.soft(704, 300, 260, 0.5),
      cloudColumn(c.rand, 704, 470, 340, 130, mix(c.a.far, '#FFFFFF', 0.55), 0.95),
      tent(704, 516, 1.6, c.p.accent),
      figureA(330, 534, 1.3, c.p.fore, 'staff'),
      kneelA(470, 536, 1.2, c.p.fore, 'pray'),
      kneelA(980, 536, 1.25, c.p.fore, 'forward', true),
      fg(c, 688, 14),
    ],
  },

  // 100: "Gaat in Zijn poorten met lof, in Zijn voorhoven met lofzang" - the joyful people and the sheep of His pasture coming to the gate
  'psalmen-bijbelquiz-deel-100': {
    hue: 238,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 230, far: 'dunes', ground: 'flat', horizon: 492 }),
      cityWall(704, 504, 1.3, c.p.near, 760),
      c.soft(704, 420, 140, 0.55),
      gateArch(704, 504, 1.45, c.p.accent),
      person(330, 534, 1.25, c.p.fore, 'raise'),
      person(470, 530, 1.1, c.p.fore, 'raise'),
      sheep(880, 536, 0.9, c.p.light, c.p.fore, true),
      sheep(990, 530, 0.85, c.p.light, c.p.fore, true),
      sheep(1100, 540, 0.9, c.p.light, c.p.fore, true),
      fg(c, 688, 14),
    ],
  },
};
