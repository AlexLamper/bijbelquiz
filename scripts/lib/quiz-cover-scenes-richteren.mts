/**
 * Covers for the Richteren series, one scene per quiz. Each quiz covers one
 * chapter: `richteren-bijbelquiz-deel-<n>` is chapter n (1-21).
 *
 * Base hue 20, drifting two degrees per chapter (chapter 21 lands on 60).
 * See `quiz-cover-scene-kit.mts` for the house style; the motifs this series
 * adds live in `quiz-cover-motifs-richteren-samuel.mts`.
 *
 * Chapters: Juda trekt op tegen de Kanaänieten en hun ijzeren wagens (1);
 * de Engel des HEEREN bij Bochim, het volk weent (2); Ehud met het
 * tweesnijdend zwaard voor koning Eglon (3); Jaël, de tentpin en de hamer
 * (4); het lied van Debora, de sterren streden van hun loopbanen (5); Gideon
 * en het vacht op de dorsvloer (6); de driehonderd met bazuinen, kruiken en
 * fakkels (7); de gouden efod te Ofra (8); Jothams fabel van de bomen en de
 * doornenbos (9); Jaïr en zijn dertig zonen op dertig ezelsveulens (10);
 * Jeftha's dochter komt hem met trommelen tegemoet (11); "Sjibbolet" bij de
 * veren van de Jordaan (12); de Engel vaart op in de vlam van het altaar
 * (13); Simsons raadsel, honing uit het karkas van de leeuw (14); het
 * ezelskaakbeen (15); Simson tussen de pilaren van Dagons huis (16); Micha's
 * gesneden beeld en de Leviet (17); de Danieten nemen het beeld mee naar Laïs
 * (18); de Leviet in de avond op het plein van Gibea (19); de rook van Gibea
 * stijgt op (20); de dochters van Silo dansen in de wijngaarden (21).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  banner,
  chariot,
  circle,
  citySkyline,
  cityWall,
  columns,
  crown,
  crowd,
  donkey,
  ellipse,
  fireBed,
  flame,
  grapes,
  horse,
  houseBlock,
  lion,
  palm,
  path,
  rect,
  rotate,
  shafts,
  smokeColumn,
  swarm,
  tent,
  throne,
  tree,
  vineRow,
  wheat,
  window as windowFrame,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  blackTent,
  ephod,
  fig,
  fleece,
  honeycomb,
  horn,
  idol,
  jar,
  jawbone,
  oak,
  pegMallet,
  spear,
  star,
  sword,
  tambourine,
  thornBush,
  vines,
} from './quiz-cover-motifs-richteren-samuel.mjs';

export const RICHTEREN_SCENES: Record<string, Scene> = {
  // 1: Juda trekt als eerste op; de Kanaänitische stad op de heuvel en haar ijzeren wagens in het dal
  'richteren-bijbelquiz-deel-1': {
    hue: 20,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 220, far: 'ridge', horizon: 470 }),
      path('M 760 492 C 840 410 930 380 1050 376 C 1170 380 1250 412 1330 492 Z', c.p.mid),
      citySkyline(c.rand, 1050, 330, 0.62, c.p.near, 5),
      cityWall(1050, 386, 0.72, c.p.near, 260),
      horse(760, 516, 0.78, c.p.near),
      chariot(860, 516, 0.82, c.p.near),
      fig(230, 530, 1.05, c.p.near, 'walk'),
      fig(330, 526, 1.3, c.p.fore, 'walk'),
      banner(400, 530, 1.25, c.p.fore, c.p.accent),
      fig(470, 528, 1.25, c.p.fore, 'shield'),
      fg(c, 686, 14),
    ],
  },

  // 2: de Engel des HEEREN spreekt te Bochim, en het volk verheft zijn stem en weent
  'richteren-bijbelquiz-deel-2': {
    hue: 22,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 330, sunY: 200, clouds: 3, far: 'ridge', horizon: 480 }),
      shafts(340, 90, 200, 330, c.p.light, 5),
      path('M 150 530 C 200 446 280 420 360 418 C 440 420 500 450 560 530 Z', c.p.mid),
      angel(350, 426, 1.2, c.p.light, { opacity: 0.92 }),
      fig(640, 530, 1.3, c.p.fore, 'kneelFwd', { flip: true }),
      fig(760, 524, 1.3, c.p.fore, 'kneel', { flip: true }),
      fig(860, 530, 1.2, c.p.fore, 'weep', { flip: true }),
      fig(950, 520, 1.1, c.p.near, 'stand', { opacity: 0.85 }),
      altar(1140, 524, 1.0, c.p.near),
      smokeColumn(c.rand, 1140, 400, 0.9, c.p.fore),
      flame(1140, 438, 0.75, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 3: Ehud staat met het tweesnijdend zwaard aan zijn rechterdij voor de vette koning Eglon
  'richteren-bijbelquiz-deel-3': {
    hue: 24,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1000, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(300, 512, 1.5, c.p.near, 2),
      columns(1150, 512, 1.5, c.p.near, 2),
      throne(860, 512, 1.5, c.p.near),
      fig(860, 402, 1.85, c.p.fore, 'sit'),
      fig(560, 514, 1.55, c.p.fore, 'stand'),
      sword(594, 420, 0.85, c.p.accent, { rot: 138 }),
      fg(c, 686, 14),
    ],
  },

  // 4: Jaël bij haar tent, de tentpin en de hamer; Barak komt Sisera zoeken, diens wagen ligt verlaten
  'richteren-bijbelquiz-deel-4': {
    hue: 26,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 330, sunR: 60, far: 'ridge', horizon: 476 }),
      rotate(-12, 280, 500, chariot(280, 500, 0.75, c.p.mid)),
      blackTent(850, 526, 1.25, c.p.near),
      fig(1080, 526, 1.45, c.p.fore, 'reach', { flip: true }),
      pegMallet(930, 534, 1.8, c.p.accent),
      fig(560, 522, 1.4, c.p.fore, 'walk'),
      fig(440, 516, 1.05, c.p.near, 'walk', { opacity: 0.85 }),
      fg(c, 688, 14),
    ],
  },

  // 5: het lied van Debora onder haar palmboom: "van den hemel streden zij, de sterren", de beek Kison
  'richteren-bijbelquiz-deel-5': {
    hue: 28,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', ground: 'water', horizon: 500, stars: 70 }),
      c.soft(990, 210, 190, 0.32),
      star(990, 210, 54, c.p.accent),
      path(`M -20 548 C 200 506 500 504 660 522 C 720 530 740 600 760 ${H} L -20 ${H} Z`, c.p.mid),
      palm(300, 548, 1.5, c.p.near),
      fig(460, 550, 1.5, c.p.fore, 'raise'),
      fig(600, 554, 1.35, c.p.fore, 'staff'),
      rotate(22, 1010, 556, chariot(1010, 570, 1.1, c.p.near)),
      path(`M 860 566 C 960 552 1080 574 1200 560 L 1200 640 L 860 640 Z`, c.p.water, { opacity: 0.92 }),
      path('M 880 580 q 50 -10 100 0 q 50 10 100 0 M 960 606 q 50 -10 100 0', 'none').replace('fill="none"', 'fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.6"'),
      fg(c, 724, 12),
    ],
  },

  // 6: Gideon legt het vacht op de dorsvloer; 's morgens is het nat van de dauw
  'richteren-bijbelquiz-deel-6': {
    hue: 30,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 380, sunR: 58, rays: true, far: 'dunes', horizon: 482 }),
      oak(300, 524, 1.15, c.p.near),
      ellipse(780, 536, 230, 30, c.p.mid, { opacity: 0.55 }),
      fleece(790, 534, 1.4, c.p.accent),
      circle(720, 488, 5, c.p.light),
      circle(770, 476, 4, c.p.light),
      circle(842, 482, 5, c.p.light),
      circle(880, 494, 4, c.p.light),
      circle(700, 506, 3.5, c.p.light),
      fig(560, 540, 1.6, c.p.fore, 'kneel'),
      jar(648, 540, 0.7, c.p.near),
      fg(c, 692, 12),
    ],
  },

  // 7: de driehonderd breken de kruiken, heffen de fakkels en blazen de bazuinen boven het leger van Midian
  'richteren-bijbelquiz-deel-7': {
    hue: 32,
    mood: 'night',
    draw: (c) => {
      const out = [
        base(c, { sun: 'moon', sunX: 1160, sunY: 180, sunR: 40, far: 'ridge', horizon: 486 }),
      ];
      for (let i = 0; i < 9; i += 1) out.push(tent(760 + i * 66, 506 + (i % 2) * 8, 0.42, c.p.far));
      out.push(path(`M -20 580 C 120 470 300 430 480 444 C 600 456 660 520 690 ${H} L -20 ${H} Z`, c.p.mid));
      const men: [number, number, number][] = [[200, 492, 1.0], [330, 456, 1.25], [470, 458, 1.15]];
      for (const [x, y, s] of men) {
        const k = s * (134 / 204);
        out.push(fig(x, y, s, c.p.fore, 'raise'));
        out.push(flame(x + 49 * k, y - 222 * k, 0.5 * s, c.p.accent));
        out.push(horn(x - 52 * k, y - 236 * k, 0.45 * s, c.p.fore, { rot: -40 }));
      }
      out.push(jar(250, 500, 0.4, c.p.fore, { rot: 70 }));
      out.push(fg(c, 712, 12));
      return out;
    },
  },

  // 8: Gideon maakt een efod van de gouden oorringen en zet die te Ofra; geheel Israël hoereert hem na
  'richteren-bijbelquiz-deel-8': {
    hue: 34,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'dunes', horizon: 492 }),
      houseBlock(c.rand, 1200, 500, 0.75, c.p.mid, { opacity: 0.8 }),
      houseBlock(c.rand, 240, 504, 0.7, c.p.mid, { opacity: 0.75 }),
      c.soft(704, 400, 210, 0.4),
      ephod(704, 524, 1.4, c.p.accent, c.p.fore),
      fig(520, 528, 1.25, c.p.fore, 'kneelFwd'),
      fig(400, 532, 1.1, c.p.near, 'weep'),
      fig(890, 528, 1.25, c.p.fore, 'kneelFwd', { flip: true }),
      fig(1010, 532, 1.1, c.p.near, 'kneel', { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 9: Jotham roept vanaf de Gerizim de fabel: olijf, vijg en wijnstok weigeren, de doornenbos wordt koning
  'richteren-bijbelquiz-deel-9': {
    hue: 36,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'none', horizon: 484 }),
      path(`M -20 600 C 60 470 150 384 250 380 C 340 386 420 470 520 560 L 520 ${H} L -20 ${H} Z`, c.p.mid),
      fig(250, 388, 0.95, c.p.fore, 'raise'),
      tree(610, 528, 1.35, c.p.near),
      tree(800, 528, 1.15, c.p.near),
      vines(c.rand, 930, 530, 0.9, c.p.near, 1),
      thornBush(c.rand, 1130, 534, 0.78, c.p.near),
      c.soft(1130, 396, 110, 0.4),
      crown(1130, 404, 0.62, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 10: Jaïr de Gileadiet richt Israël; zijn dertig zonen rijden op dertig ezelsveulens naar hun dertig steden
  'richteren-bijbelquiz-deel-10': {
    hue: 38,
    mood: 'warm',
    draw: (c) => {
      const out = [
        base(c, { sunX: 290, sunY: 250, far: 'ridge', horizon: 470 }),
        citySkyline(c.rand, 1180, 474, 0.48, c.p.far, 4, { opacity: 0.8 }),
      ];
      const riders: [number, number, number][] = [[1080, 500, 0.7], [860, 512, 0.85], [600, 528, 1.05], [330, 540, 1.2]];
      for (const [x, y, s] of riders) {
        const k = s * 1.3;
        out.push(donkey(x, y, s, c.p.near));
        out.push(rect(x - 24 * k, y - 62 * k, 44 * k, 24 * k, c.p.accent, { rx: 5 * k }));
        out.push(fig(x - 2 * k, y - 50 * k, s * 0.85, c.p.fore, 'sit'));
      }
      out.push(fg(c, 690, 12));
      return out;
    },
  },

  // 11: Jeftha keert terug naar Mizpa, en zijn dochter gaat uit hem tegemoet met trommelen en reien
  'richteren-bijbelquiz-deel-11': {
    hue: 40,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 210, sunY: 330, sunR: 58, far: 'ridge', horizon: 476 }),
      houseBlock(c.rand, 1150, 516, 1.15, c.p.near),
      fig(1010, 512, 0.95, c.p.near, 'raise', { opacity: 0.8 }),
      fig(870, 520, 1.3, c.p.fore, 'raise'),
      tambourine(870 + 49 * 0.854, 520 - 226 * 0.854, 1.1, c.p.accent),
      fig(500, 524, 1.4, c.p.fore, 'carry'),
      fig(380, 516, 1.05, c.p.near, 'staff', { opacity: 0.85 }),
      fig(300, 512, 0.95, c.p.near, 'stand', { opacity: 0.75 }),
      fg(c, 688, 14),
    ],
  },

  // 12: de Gileadieten bezetten de veren van de Jordaan: "Zeg nu Sjibbolet" - een korenaar
  'richteren-bijbelquiz-deel-12': {
    hue: 42,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 230, far: 'dunes', ground: 'flat', horizon: 480 }),
      path(`M -20 548 C 300 528 600 566 900 548 C 1100 536 1300 552 ${W + 20} 548 L ${W + 20} 604 C 1100 594 800 614 500 600 C 300 592 100 604 -20 604 Z`, c.p.water),
      path('M 120 572 q 60 -8 120 0 M 700 580 q 70 -8 140 0 M 1040 566 q 60 -8 120 0', 'none').replace('fill="none"', 'fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.5"'),
      ellipse(660, 566, 22, 8, c.p.near),
      ellipse(740, 572, 18, 7, c.p.near),
      fig(520, 540, 1.4, c.p.fore, 'staff'),
      spear(520 + 54 * 0.92, 540, 520 + 54 * 0.92, 540 - 236 * 0.92, 1.0, c.p.fore),
      wheat(400, 552, 1.25, c.p.accent, 1),
      wheat(360, 556, 1.05, c.p.accent, 1),
      wheat(330, 560, 0.9, c.p.accent, 1),
      fig(880, 548, 1.3, c.p.fore, 'reach', { flip: true }),
      fg(c, 700, 12),
    ],
  },

  // 13: Manoach offert op de rots; de Engel des HEEREN vaart op in de vlam van het altaar
  'richteren-bijbelquiz-deel-13': {
    hue: 44,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 200, far: 'ridge', horizon: 486 }),
      path('M 520 540 C 560 470 630 452 704 452 C 780 454 850 470 890 540 Z', c.p.mid),
      altar(704, 460, 0.85, c.p.near),
      c.soft(704, 330, 200, 0.4),
      flame(704, 388, 2.1, c.p.accent),
      angel(704, 352, 0.82, c.p.light, { opacity: 0.88 }),
      fig(370, 544, 1.25, c.p.fore, 'fallen'),
      fig(1040, 544, 1.25, c.p.fore, 'fallen', { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 14: "Spijs ging uit van den eter, en zoetigheid van den sterke" - de bijen en de honing in het karkas van de leeuw
  'richteren-bijbelquiz-deel-14': {
    hue: 46,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'dunes', horizon: 478 }),
      vines(c.rand, 980, 506, 0.75, c.p.mid, 3, { opacity: 0.8 }),
      lion(720, 540, 1.8, c.p.fore),
      honeycomb(690, 470, 1.25, c.p.accent),
      swarm(c.rand, 560, 330, 300, 110, 1.1, c.p.fore, 30, 'dot'),
      fig(400, 538, 1.55, c.p.fore, 'reach'),
      fg(c, 690, 12),
    ],
  },

  // 15: met een vers ezelskaakbeen slaat Simson duizend man; Ramath-Lechi, de velden der Filistijnen branden
  'richteren-bijbelquiz-deel-15': {
    hue: 48,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'ridge', horizon: 476 }),
      smokeColumn(c.rand, 1120, 480, 1.5, c.p.fore),
      smokeColumn(c.rand, 1260, 486, 1.1, c.p.fore),
      path('M 420 548 C 500 470 610 452 704 452 C 810 454 910 480 990 548 Z', c.p.mid),
      fig(704, 460, 1.35, c.p.fore, 'raise'),
      jawbone(704 + 49 * 0.887 + 18, 460 - 224 * 0.887 - 6, 0.85, c.p.accent, { rot: -28 }),
      fig(1040, 520, 0.7, c.p.mid, 'walk', { flip: true, opacity: 0.8 }),
      fig(1110, 516, 0.6, c.p.mid, 'walk', { flip: true, opacity: 0.7 }),
      fig(1170, 514, 0.55, c.p.mid, 'walk', { flip: true, opacity: 0.6 }),
      fg(c, 690, 12),
    ],
  },

  // 16: Simson grijpt de twee middelste pilaren van Dagons huis; het dak vol Filistijnen
  'richteren-bijbelquiz-deel-16': {
    hue: 50,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'none', ground: 'flat', horizon: 524 }),
      rect(330, 262, 748, 30, c.p.near),
      crowd(c.rand, 704, 262, 0.42, c.p.mid, 14, 640),
      columns(400, 524, 2.3, c.p.near, 1),
      columns(1008, 524, 2.3, c.p.near, 1),
      rotate(-3, 612, 524, rect(596, 292, 32, 232, c.p.accent) + rect(588, 290, 48, 14, c.p.accent)),
      rotate(3, 796, 524, rect(780, 292, 32, 232, c.p.accent) + rect(772, 290, 48, 14, c.p.accent)),
      fig(704, 524, 1.32, c.p.fore, 'spread'),
      fg(c, 692, 12),
    ],
  },

  // 17: Micha laat van het zilver een gesneden beeld maken en neemt een jonge Leviet tot priester
  'richteren-bijbelquiz-deel-17': {
    hue: 52,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 260, far: 'ridge', horizon: 482 }),
      houseBlock(c.rand, 1060, 520, 1.2, c.p.near),
      c.soft(704, 420, 140, 0.4),
      idol(704, 528, 1.25, c.p.accent),
      fig(500, 530, 1.3, c.p.fore, 'kneelFwd'),
      fig(880, 528, 1.3, c.p.fore, 'staff', { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 18: de zeshonderd Danieten trekken naar Laïs en dragen Micha's beeld mee; Micha roept hen na
  'richteren-bijbelquiz-deel-18': {
    hue: 54,
    mood: 'day',
    draw: (c) => {
      const k = 1.2 * (134 / 204);
      return [
        base(c, { sunX: 250, sunY: 230, far: 'ridge', horizon: 472 }),
        citySkyline(c.rand, 1210, 476, 0.5, c.p.far, 4, { opacity: 0.8 }),
        fig(220, 520, 0.8, c.p.near, 'reach', { opacity: 0.85 }),
        fig(560, 528, 1.2, c.p.fore, 'walk'),
        fig(800, 528, 1.2, c.p.fore, 'walk'),
        rect(520, 528 - 150 * k, 320, 8, c.p.fore, { rx: 4 }),
        idol(680, 528 - 150 * k, 0.75, c.p.accent),
        fig(960, 524, 1.15, c.p.fore, 'staff'),
        spear(960 + 54 * 0.755, 524, 960 + 54 * 0.755, 524 - 236 * 0.755, 0.8, c.p.fore),
        fig(1090, 520, 1.05, c.p.near, 'staff', { opacity: 0.85 }),
        fig(420, 522, 1.05, c.p.near, 'staff', { opacity: 0.85 }),
        fg(c, 688, 14),
      ];
    },
  },

  // 19: de Leviet met zijn bijwijf en zijn ezel 's avonds op de straat van Gibea; de oude man komt van het veld
  'richteren-bijbelquiz-deel-19': {
    hue: 56,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 410, sunR: 56, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 290, 512, 1.15, c.p.near),
      houseBlock(c.rand, 1080, 512, 1.05, c.p.near),
      windowFrame(1080 - 30, 470, 0.55, c.p.near, c.p.accent),
      c.soft(1050, 440, 80, 0.4),
      donkey(560, 520, 1.0, c.p.near),
      fig(490, 524, 0.95, c.p.fore, 'sit'),
      fig(660, 520, 1.3, c.p.fore, 'stand'),
      fig(880, 520, 1.25, c.p.fore, 'staff', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 20: het teken van de rookwolk: Gibea staat in brand en Benjamin wendt zich om
  'richteren-bijbelquiz-deel-20': {
    hue: 58,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 2, far: 'ridge', horizon: 480 }),
      path('M 160 520 C 220 440 320 410 440 408 C 560 410 640 440 700 520 Z', c.p.mid),
      citySkyline(c.rand, 430, 380, 0.62, c.p.near, 5),
      cityWall(430, 420, 0.7, c.p.near, 240),
      smokeColumn(c.rand, 430, 330, 1.8, c.p.fore),
      smokeColumn(c.rand, 470, 300, 1.4, c.p.fore),
      fireBed(c.rand, 430, 372, 0.8, c.p.accent, 7),
      fig(880, 528, 1.3, c.p.fore, 'reach'),
      fig(1000, 524, 1.2, c.p.fore, 'shield'),
      fig(1110, 520, 1.1, c.p.near, 'staff', { opacity: 0.9 }),
      fg(c, 688, 14),
    ],
  },

  // 21: de dochters van Silo komen uit om te dansen; de Benjaminieten liggen op de loer in de wijngaarden
  'richteren-bijbelquiz-deel-21': {
    hue: 60,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 250, far: 'dunes', horizon: 478 }),
      tent(1180, 486, 0.7, c.p.far),
      fig(310, 528, 1.15, c.p.near, 'stand'),
      vines(c.rand, 190, 532, 1.45, c.p.near, 3),
      grapes(190 + 30 * 1.45, 532 - 60 * 1.45, 1.0, c.p.accent),
      grapes(190 + 126 * 1.45, 532 - 60 * 1.45, 0.9, c.p.accent),
      fig(720, 526, 1.25, c.p.fore, 'raise'),
      fig(860, 530, 1.15, c.p.fore, 'raise'),
      fig(990, 524, 1.2, c.p.fore, 'raise'),
      fg(c, 690, 12),
    ],
  },
};
