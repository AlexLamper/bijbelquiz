/**
 * Covers for the 1 Samuel series, one scene per quiz. Each quiz covers one
 * chapter: `1-samuel-bijbelquiz-deel-<n>` is chapter n (1-31).
 *
 * Base hue 80, drifting two degrees per chapter (chapter 31 lands on 140).
 * See `quiz-cover-scene-kit.mts` for the house style; the motifs this series
 * adds live in `quiz-cover-motifs-richteren-samuel.mts`. The ark is drawn in
 * gold, so its chapters use a mood with the gold accent (dawn, dusk, warm).
 *
 * Chapters: Hanna bidt bij de tabernakel te Silo, Eli zit bij de deurpost
 * (1); Hanna brengt Samuël elk jaar een klein manteltje (2); "Spreek, HEERE,
 * want Uw knecht hoort" - de lamp Gods was nog niet uitgegaan (3); de
 * Filistijnen nemen de ark mee (4); Dagon ligt op zijn aangezicht voor de ark
 * (5); de ark keert terug op een nieuwe wagen met twee koeien (6);
 * Eben-Haëzer, "tot hiertoe heeft ons de HEERE geholpen", de donder (7);
 * "geef ons een koning" (8); Saul zoekt de ezelinnen, meisjes wijzen de weg
 * naar de ziener (9); Samuël zalft Saul met een oliefles (10); Saul komt
 * achter de runderen van het veld, Jabes roept om hulp (11); donder en regen
 * in de tarweoogst (12); Saul offert zelf te Gilgal (13); Jonathan klimt de
 * rots op naar de bezetting der Filistijnen (14); Saul scheurt de slip van
 * Samuëls mantel (15); David wordt gezalfd met de hoorn met olie (16); David
 * en Goliath (17); Jonathan geeft David zijn mantel en boog (18); Michal laat
 * David door het venster zakken (19); de pijlen voorbij de jongen (20); de
 * toonbroden te Nob (21); de spelonk van Adullam (22); Saul aan de ene kant
 * van de berg, David aan de andere, een bode met een tijding (23); David
 * snijdt de slip van Sauls mantel in de spelonk bij En-Gedi (24); Abigaïl
 * met haar gaven voor David (25); David neemt de spies en de waterfles bij
 * Sauls hoofd (26); Achis geeft David Ziklag (27); Saul bij de waarzegster te
 * Endor (28); de Filistijnse vorsten sturen David terug (29); Ziklag
 * verbrand, David sterkt zich in de HEERE (30); Saul valt op het gebergte
 * Gilboa, zijn kroon ligt op de grond (31).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import { mix } from './cover-options/shapes.mjs';
import {
  H,
  W,
  banner,
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
  goat,
  houseBlock,
  loaf,
  ox,
  path,
  rect,
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
  ark,
  arrow,
  basketLoad,
  blackTent,
  bolt,
  bow,
  cart,
  fallenIdol,
  fig,
  flask,
  horn,
  jar,
  mirror,
  plough,
  rag,
  robe,
  sanctuary,
  sheepAt,
  shield,
  sling,
  spear,
  standingStone,
  stroke,
  sword,
} from './quiz-cover-motifs-richteren-samuel.mjs';

const K = 134 / 204;

export const SAMUEL1_SCENES: Record<string, Scene> = {
  // 1: Hanna bidt in bitterheid van ziel voor het aangezicht des HEEREN; Eli zit op een stoel bij de post van de tempel
  '1-samuel-bijbelquiz-deel-1': {
    hue: 80,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 300, sunR: 54, far: 'ridge', horizon: 480 }),
      sanctuary(960, 524, 1.35, c.p.near, c.p.accent),
      c.soft(960, 470, 120, 0.35),
      rect(732, 486, 52, 10, c.p.fore, { rx: 3 }),
      rect(738, 494, 7, 30, c.p.fore),
      rect(771, 494, 7, 30, c.p.fore),
      fig(758, 488, 1.2, c.p.fore, 'sit'),
      fig(470, 536, 1.6, c.p.fore, 'kneel'),
      fg(c, 690, 12),
    ],
  },

  // 2: Samuël dient voor het aangezicht des HEEREN; zijn moeder maakt hem jaarlijks een klein manteltje
  '1-samuel-bijbelquiz-deel-2': {
    hue: 82,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 250, far: 'dunes', horizon: 482 }),
      sanctuary(1140, 516, 0.95, c.p.mid, c.p.mid),
      fig(380, 528, 1.25, c.p.near, 'staff'),
      fig(560, 532, 1.55, c.p.fore, 'reach'),
      robe(560 + 80 * 1.55 * K + 30, 532 - 103 * 1.55 * K + 92 * 0.78, 0.78, c.p.accent),
      fig(790, 534, 0.9, c.p.fore, 'reach', { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 3: de HEERE roept Samuël in de nacht, eer de lamp Gods uitging; "Spreek, want Uw knecht hoort"
  '1-samuel-bijbelquiz-deel-3': {
    hue: 84,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 516, stars: 40 }),
      columns(250, 516, 1.7, c.p.near, 2),
      columns(1160, 516, 1.7, c.p.near, 2),
      ark(1000, 516, 0.8, c.p.near),
      shafts(520, 90, 160, 330, c.p.light, 4),
      c.soft(700, 360, 190, 0.42),
      rect(694, 350, 11, 166, c.p.fore),
      rect(664, 508, 70, 8, c.p.fore, { rx: 3 }),
      path('M 668 352 Q 699 376 730 352 Z', c.p.fore),
      flame(699, 350, 1.15, c.p.accent),
      rect(400, 520, 220, 14, c.p.near, { rx: 6 }),
      fig(520, 524, 1.4, c.p.fore, 'sit'),
      fg(c, 700, 10),
    ],
  },

  // 4: Israël wordt verslagen bij Afek, de ark Gods wordt genomen en weggedragen door de Filistijnen
  '1-samuel-bijbelquiz-deel-4': {
    hue: 86,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 400, sunR: 54, clouds: 2, far: 'ridge', horizon: 480 }),
      smokeColumn(c.rand, 230, 480, 1.3, c.p.fore),
      fig(260, 512, 0.75, c.p.mid, 'walk', { flip: true, opacity: 0.8 }),
      fig(330, 516, 0.7, c.p.mid, 'fallen', { opacity: 0.7 }),
      fig(570, 532, 1.45, c.p.fore, 'walk'),
      fig(850, 532, 1.45, c.p.fore, 'walk'),
      ark(710, 532 - 150 * 1.45 * K + 36 * 1.05, 1.05, c.p.accent, { poles: true }),
      fig(1020, 526, 1.2, c.p.near, 'staff', { opacity: 0.9 }),
      fg(c, 690, 12),
    ],
  },

  // 5: in het huis van Dagon te Asdod: Dagon ligt op zijn aangezicht voor de ark, hoofd en handen afgehouwen
  '1-samuel-bijbelquiz-deel-5': {
    hue: 88,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'flat', horizon: 516 }),
      columns(270, 516, 1.75, c.p.near, 2),
      columns(1140, 516, 1.75, c.p.near, 2),
      c.soft(704, 400, 240, 0.4),
      rect(610, 474, 188, 42, c.p.near, { rx: 3 }),
      ark(704, 474, 1.2, c.p.accent),
      fallenIdol(690, 566, 1.65, c.p.fore),
      fg(c, 712, 10),
    ],
  },

  // 6: de ark komt terug op een nieuwe wagen, getrokken door twee zogende koeien; Beth-Semes maait de tarwe
  '1-samuel-bijbelquiz-deel-6': {
    hue: 90,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 240, far: 'dunes', horizon: 478 }),
      wheat(1040, 532, 0.8, c.p.crop, 7),
      wheat(1220, 528, 0.7, c.p.crop, 6),
      fig(1110, 528, 1.25, c.p.fore, 'raise'),
      fig(1250, 522, 1.05, c.p.near, 'raise', { opacity: 0.9 }),
      ox(450, 534, 0.9, c.p.near),
      ox(520, 544, 0.95, c.p.fore),
      cart(780, 546, 1.15, c.p.fore),
      ark(780, 546 - 66 * 1.15, 0.82, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 7: Samuël richt een steen op: Eben-Haëzer; de HEERE dondert over de Filistijnen
  '1-samuel-bijbelquiz-deel-7': {
    hue: 92,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'ridge', horizon: 482 }),
      bolt(1080, 170, 1.3, c.p.light, { opacity: 0.85 }),
      bolt(1210, 210, 0.9, c.p.light, { opacity: 0.7 }),
      fig(1060, 512, 0.7, c.p.mid, 'walk', { opacity: 0.75 }),
      fig(1140, 508, 0.62, c.p.mid, 'walk', { opacity: 0.65 }),
      fig(1210, 506, 0.55, c.p.mid, 'walk', { opacity: 0.6 }),
      standingStone(590, 540, 1.55, c.p.accent),
      fig(760, 540, 1.55, c.p.fore, 'raise'),
      fig(360, 536, 1.2, c.p.fore, 'kneel'),
      fig(250, 532, 1.05, c.p.near, 'kneel'),
      fg(c, 692, 12),
    ],
  },

  // 8: de oudsten komen tot Samuël te Rama: "Stel nu een koning over ons, om ons te richten, gelijk al de volken"
  '1-samuel-bijbelquiz-deel-8': {
    hue: 94,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 230, far: 'ridge', horizon: 478 }),
      c.soft(704, 420, 150, 0.4),
      throne(704, 528, 1.15, mix(c.a.figure, c.a.near, 0.44)),
      crown(704, 528 - 74 * 1.15 - 18, 0.52, c.p.accent),
      fig(440, 532, 1.4, c.p.fore, 'reach'),
      fig(320, 528, 1.25, c.p.fore, 'raise'),
      fig(210, 524, 1.1, c.p.near, 'staff'),
      fig(1000, 534, 1.55, c.p.fore, 'staff', { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 9: Saul zoekt de ezelinnen van zijn vader; jonge dochters die water gaan putten wijzen hem de weg naar de ziener
  '1-samuel-bijbelquiz-deel-9': {
    hue: 96,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 220, far: 'ridge', horizon: 476 }),
      path('M 960 500 C 1020 430 1100 400 1180 398 C 1260 402 1320 440 1380 500 Z', c.p.mid),
      citySkyline(c.rand, 1180, 404, 0.55, c.p.near, 4),
      donkey(250, 500, 0.5, c.p.mid, { opacity: 0.7 }),
      donkey(320, 504, 0.45, c.p.mid, { opacity: 0.6 }),
      well(870, 536, 0.95, c.p.near),
      fig(750, 536, 1.35, c.p.fore, 'reach', { flip: true }),
      jar(750, 536 - 204 * 1.35 * K + 6, 0.62, c.p.accent),
      fig(470, 538, 1.7, c.p.fore, 'walk'),
      fig(350, 534, 1.25, c.p.fore, 'staff'),
      fg(c, 690, 12),
    ],
  },

  // 10: Samuël neemt een oliefles, giet ze uit op Sauls hoofd en kust hem
  '1-samuel-bijbelquiz-deel-10': {
    hue: 98,
    mood: 'dawn',
    draw: (c) => {
      const sx = 760;
      const s = 1.55;
      const hx = sx - 77 * s * K;
      const hy = 540 - 161 * s * K;
      return [
        base(c, { sunX: 250, sunY: 330, sunR: 56, rays: true, far: 'dunes', horizon: 484 }),
        houseBlock(c.rand, 1180, 508, 0.85, c.p.mid, { opacity: 0.8 }),
        c.soft(620, 400, 150, 0.4),
        fig(600, 544, 1.5, c.p.fore, 'kneel'),
        fig(sx, 540, s, c.p.fore, 'bless', { flip: true }),
        flask(hx + 4, hy + 6, 0.95, c.p.accent, { rot: -128 }),
        circle(hx - 40, hy + 30, 4.5, c.p.accent),
        circle(hx - 46, hy + 44, 3.5, c.p.accent),
        fg(c, 692, 12),
      ];
    },
  },

  // 11: Saul komt achter de runderen uit het veld en hoort de tijding van Jabes in Gilead; het volk weent
  '1-samuel-bijbelquiz-deel-11': {
    hue: 100,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 350, sunR: 54, far: 'ridge', horizon: 480 }),
      mirror(840, ox(840, 534, 0.95, c.p.near)),
      mirror(910, ox(910, 544, 1.0, c.p.fore)),
      mirror(690, plough(690, 548, 1.25, c.p.accent)),
      fig(560, 546, 1.5, c.p.fore, 'walk'),
      fig(1120, 544, 1.35, c.p.fore, 'kneelFwd', { flip: true }),
      fig(1230, 536, 1.15, c.p.near, 'kneel', { flip: true }),
      fg(c, 694, 12),
    ],
  },

  // 12: Samuël roept tot de HEERE en Hij geeft donder en regen in de tarweoogst; het volk vreest zeer
  '1-samuel-bijbelquiz-deel-12': {
    hue: 102,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'ridge', horizon: 478 }),
      streaks(c.rand, 600, 160, 760, 360, c.p.light, 70, { opacity: 0.4 }),
      bolt(940, 150, 1.4, c.p.accent),
      wheat(800, 534, 0.95, c.p.crop, 8),
      wheat(1080, 530, 0.9, c.p.crop, 8),
      fig(940, 540, 1.25, c.p.fore, 'kneel', { flip: true }),
      fig(1220, 534, 1.1, c.p.fore, 'weep', { flip: true }),
      path('M 160 540 C 220 470 320 452 420 452 C 520 456 590 490 640 540 Z', c.p.mid),
      fig(410, 462, 1.5, c.p.fore, 'raise'),
      fg(c, 692, 12),
    ],
  },

  // 13: Saul wacht niet op Samuël en offert zelf het brandoffer te Gilgal; daar komt Samuël aan
  '1-samuel-bijbelquiz-deel-13': {
    hue: 104,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 390, sunR: 54, far: 'ridge', horizon: 482 }),
      tent(1150, 492, 0.5, c.p.far),
      tent(1240, 496, 0.45, c.p.far),
      tent(1060, 494, 0.42, c.p.far),
      smokeColumn(c.rand, 560, 380, 1.1, c.p.fore),
      altar(560, 538, 1.35, c.p.near),
      flame(560, 420, 1.45, c.p.accent),
      fig(380, 540, 1.55, c.p.fore, 'raise'),
      fig(900, 534, 1.4, c.p.fore, 'walk', { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 14: Jonathan klimt met zijn wapendrager op handen en voeten de rots op naar de bezetting der Filistijnen
  '1-samuel-bijbelquiz-deel-14': {
    hue: 106,
    mood: 'day',
    draw: (c) => {
      const back = mix(c.a.far, c.a.near, 0.45);
      const front = mix(c.a.near, c.a.figure, 0.3);
      return [
        base(c, { sunX: 230, sunY: 230, far: 'none', horizon: 510 }),
        `<path d="M -20 ${H} L -20 400 C 60 380 150 350 230 360 C 320 380 350 450 380 560 L 420 ${H} Z" fill="${back}"/>`,
        `<path d="M 520 ${H} L 600 560 C 650 440 720 330 830 300 C 930 278 1040 290 1140 300 C 1250 312 1330 320 1440 330 L 1440 ${H} Z" fill="${front}"/>`,
        tent(1000, 300, 0.55, c.p.near),
        tent(1110, 304, 0.5, c.p.near),
        fig(1200, 306, 0.6, c.p.fore, 'staff'),
        banner(910, 298, 0.85, c.p.fore, c.p.accent),
        fig(694, 432, 1.35, c.p.fore, 'climb'),
        fig(632, 520, 1.2, c.p.fore, 'climb'),
        fg(c, 720, 10),
      ];
    },
  },

  // 15: Samuël keert zich om te gaan, Saul grijpt de slip van zijn mantel en die scheurt: zo scheurt de HEERE het koninkrijk
  '1-samuel-bijbelquiz-deel-15': {
    hue: 108,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 390, sunR: 54, far: 'dunes', horizon: 482 }),
      sheepAt(230, 512, 0.75, c.p.light, c.p.near, { opacity: 0.9 }),
      sheepAt(300, 518, 0.8, c.p.light, c.p.near, { opacity: 0.9 }),
      sheepAt(370, 512, 0.7, c.p.light, c.p.near, { opacity: 0.85 }),
      ox(1180, 512, 0.6, c.p.mid, { opacity: 0.75 }),
      fig(800, 536, 1.6, c.p.fore, 'walk'),
      fig(560, 542, 1.5, c.p.fore, 'kneelFwd'),
      rag(560 + 70 * 0.9 + 30, 542 - 94 * 0.9 + 4, 1.25, c.p.accent, { rot: -6 }),
      fg(c, 692, 12),
    ],
  },

  // 16: Samuël neemt de hoorn met olie en zalft David in het midden van zijn broeders
  '1-samuel-bijbelquiz-deel-16': {
    hue: 110,
    mood: 'warm',
    draw: (c) => {
      const out = [base(c, { sunX: 250, sunY: 250, far: 'ridge', horizon: 480 })];
      for (let i = 0; i < 7; i += 1) out.push(fig(930 + i * 58, 530 - (i % 2) * 6, 1.15 - i * 0.03, c.p.near, 'stand', { opacity: 0.88 }));
      const s = 1.6;
      const hx = 720 - 77 * s * K;
      const hy = 538 - 161 * s * K;
      out.push(
        sheepAt(220, 540, 0.85, c.p.light, c.p.near),
        sheepAt(320, 548, 0.75, c.p.light, c.p.near),
        c.soft(560, 410, 150, 0.4),
        fig(560, 544, 1.3, c.p.fore, 'kneel'),
        fig(720, 538, s, c.p.fore, 'bless', { flip: true }),
        horn(hx - 30, hy + 18, 0.85, c.p.accent, { rot: 168 }),
        circle(hx - 58, hy + 56, 4, c.p.accent),
        fg(c, 692, 12),
      );
      return out;
    },
  },

  // 17: David met de slinger tegen de reus Goliath in het eikendal
  '1-samuel-bijbelquiz-deel-17': {
    hue: 112,
    mood: 'day',
    draw: (c) => {
      const gs = 2.0;
      const gk = gs * K;
      return [
        base(c, { sunX: 704, sunY: 220, sunR: 50, far: 'none', horizon: 490 }),
        path('M -20 520 C 80 440 200 420 320 430 C 420 440 470 480 520 520 Z', c.p.mid),
        path('M 900 520 C 980 450 1100 424 1220 426 C 1320 432 1380 460 1440 500 L 1440 520 Z', c.p.mid),
        crowd(c.rand, 220, 444, 0.4, c.p.mid, 7, 200),
        crowd(c.rand, 1180, 440, 0.4, c.p.mid, 7, 220),
        ellipse(700, 566, 120, 12, c.p.water, { opacity: 0.9 }),
        fig(1000, 546, gs, c.p.fore, 'staff'),
        spear(1000 + 54 * gk, 546, 1000 + 54 * gk, 546 - 240 * gk, 1.3, c.p.fore),
        path(`M ${1000 - 16 * gk} ${546 - 196 * gk} L ${1000} ${546 - 236 * gk} L ${1000 + 16 * gk} ${546 - 196 * gk} Z`, c.p.fore),
        shield(1000 - 36 * gk, 546 - 112 * gk, 1.35, c.p.near),
        fig(450, 548, 1.15, c.p.fore, 'raise'),
        sling(450 + 49 * 1.15 * K, 548 - 224 * 1.15 * K, 556, 318, 1.35, c.p.accent),
        stroke('M 466 318 A 80 44 0 0 1 572 290', c.p.light, 4, { opacity: 0.6 }),
        fg(c, 700, 12),
      ];
    },
  },

  // 18: Jonathan maakt een verbond met David en geeft hem zijn mantel, zijn zwaard, zijn boog en zijn gordel
  '1-samuel-bijbelquiz-deel-18': {
    hue: 114,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 210, sunR: 52, rays: true, far: 'ridge', horizon: 482 }),
      houseBlock(c.rand, 1200, 506, 0.8, c.p.mid, { opacity: 0.75 }),
      fig(560, 540, 1.6, c.p.fore, 'reach'),
      bow(560 + 80 * 1.6 * K + 2, 540 - 103 * 1.6 * K, 1.05, c.p.accent),
      fig(830, 540, 1.55, c.p.fore, 'reach', { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 19: Michal laat David door het venster neder, en hij vlucht en ontkomt
  '1-samuel-bijbelquiz-deel-19': {
    hue: 116,
    mood: 'night',
    draw: (c) => {
      const wall = mix(c.a.mid, c.a.figure, 0.32);
      return [
        base(c, { sun: 'moon', sunX: 300, sunY: 200, sunR: 40, far: 'dunes', ground: 'flat', horizon: 524 }),
        houseBlock(c.rand, 340, 524, 0.8, c.p.mid, { opacity: 0.7 }),
        `<rect x="740" y="210" width="460" height="314" fill="${wall}"/>`,
        `<rect x="728" y="200" width="484" height="16" fill="${wall}"/>`,
        rect(740, 300, 460, 3, c.p.light, { opacity: 0.12 }),
        rect(740, 420, 460, 3, c.p.light, { opacity: 0.12 }),
        c.soft(950, 320, 170, 0.45),
        rect(900, 270, 100, 90, c.p.accent),
        fig(952, 380, 0.6, c.p.fore, 'reach', { flip: true }),
        `<rect x="890" y="356" width="120" height="30" fill="${wall}"/>`,
        stroke('M 912 358 L 912 600', c.p.fore, 3),
        fig(912, 504, 1.1, c.p.fore, 'raise'),
        fg(c, 706, 10),
      ];
    },
  },

  // 20: Jonathan schiet de pijlen voorbij de jongen; David schuilt bij de steen Ezel
  '1-samuel-bijbelquiz-deel-20': {
    hue: 118,
    mood: 'day',
    draw: (c) => {
      const s = 1.55;
      const hx = 360 + 80 * s * K;
      const hy = 538 - 103 * s * K;
      return [
        base(c, { sunX: 1210, sunY: 230, far: 'dunes', horizon: 480 }),
        fig(1100, 540, 1.3, c.p.fore, 'kneel', { flip: true }),
        path('M 990 544 C 990 490 1040 462 1110 462 C 1190 466 1240 500 1250 544 Z', c.p.mid),
        fig(360, 538, s, c.p.fore, 'reach'),
        bow(hx + 4, hy, 1.0, c.p.fore),
        arrow(560, 360, 0.95, c.p.accent, { rot: -6 }),
        arrow(760, 330, 0.95, c.p.accent, { rot: 4 }),
        stroke('M 470 420 C 600 330 760 300 900 330', c.p.light, 3, { opacity: 0.5 }),
        fig(820, 540, 0.85, c.p.fore, 'walk'),
        fg(c, 692, 12),
      ];
    },
  },

  // 21: David te Nob: de priester Achimelech geeft hem het heilige brood, de toonbroden
  '1-samuel-bijbelquiz-deel-21': {
    hue: 120,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'flat', horizon: 516 }),
      sanctuary(704, 516, 1.6, c.p.mid, c.p.mid, { opacity: 0.6 }),
      c.soft(704, 420, 180, 0.4),
      rect(600, 446, 208, 12, c.p.fore, { rx: 3 }),
      rect(616, 458, 10, 58, c.p.fore),
      rect(782, 458, 10, 58, c.p.fore),
      loaf(650, 446, 0.8, c.p.accent),
      loaf(650, 430, 0.75, c.p.accent),
      loaf(650, 415, 0.7, c.p.accent),
      loaf(758, 446, 0.8, c.p.accent),
      loaf(758, 430, 0.75, c.p.accent),
      loaf(758, 415, 0.7, c.p.accent),
      fig(470, 520, 1.55, c.p.fore, 'reach'),
      fig(950, 520, 1.55, c.p.fore, 'bless', { flip: true }),
      fg(c, 694, 12),
    ],
  },

  // 22: David ontkomt in de spelonk van Adullam; allen die benauwd waren vergaderen zich tot hem
  '1-samuel-bijbelquiz-deel-22': {
    hue: 122,
    mood: 'dusk',
    draw: (c) => {
      const rock = mix(c.a.near, c.a.figure, 0.25);
      const hole = mix(c.a.figure, '#000000', 0.15);
      return [
        base(c, { sunX: 1180, sunY: 390, sunR: 54, far: 'ridge', horizon: 484 }),
        `<path d="M 80 ${H} L 120 470 C 180 330 330 270 480 280 C 620 292 720 380 760 520 L 780 ${H} Z" fill="${rock}"/>`,
        `<path d="M 340 540 C 340 450 380 400 440 398 C 510 400 550 450 550 540 Z" fill="${hole}"/>`,
        c.soft(445, 500, 120, 0.45),
        fireBed(c.rand, 445, 540, 0.55, c.p.accent, 4),
        fig(640, 542, 1.5, c.p.fore, 'raise'),
        fig(860, 538, 1.3, c.p.fore, 'walk', { flip: true }),
        fig(990, 532, 1.15, c.p.near, 'staff', { flip: true }),
        fig(1100, 526, 1.0, c.p.near, 'walk', { flip: true, opacity: 0.9 }),
        fig(1200, 520, 0.85, c.p.mid, 'walk', { flip: true, opacity: 0.85 }),
        fg(c, 694, 12),
      ];
    },
  },

  // 23: Saul gaat aan deze zijde van de berg, David aan gene zijde; dan komt een bode: de Filistijnen zijn ingevallen
  '1-samuel-bijbelquiz-deel-23': {
    hue: 124,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 220, far: 'none', horizon: 490 }),
      path('M 340 500 C 460 360 600 300 704 298 C 820 302 950 360 1080 500 Z', c.p.mid),
      fig(470, 430, 0.6, c.p.near, 'staff'),
      fig(510, 412, 0.58, c.p.near, 'staff'),
      fig(548, 394, 0.55, c.p.near, 'staff'),
      fig(880, 400, 0.55, c.p.near, 'walk'),
      fig(920, 420, 0.58, c.p.near, 'walk'),
      fig(960, 440, 0.6, c.p.near, 'walk'),
      fig(300, 546, 1.5, c.p.fore, 'staff'),
      fig(620, 548, 1.45, c.p.fore, 'walk', { flip: true }),
      scroll(620 - 46 * 1.45 * K - 14, 548 - 100 * 1.45 * K, 0.62, c.p.accent),
      fg(c, 696, 12),
    ],
  },

  // 24: in de spelonk bij En-Gedi snijdt David heimelijk een slip van Sauls mantel af
  '1-samuel-bijbelquiz-deel-24': {
    hue: 126,
    mood: 'dusk',
    draw: (c) => {
      const rock = mix(c.a.near, c.a.figure, 0.42);
      const s = 1.55;
      const hx = 380 + 77 * s * K;
      const hy = 640 - 161 * s * K;
      return [
        base(c, { sunX: 780, sunY: 320, sunR: 48, far: 'ridge', horizon: 488 }),
        goat(1000, 470, 0.5, c.p.mid, { opacity: 0.8 }),
        goat(1080, 444, 0.42, c.p.mid, { opacity: 0.7 }),
        fig(830, 528, 1.35, c.p.fore, 'sit'),
        `<path fill-rule="evenodd" fill="${rock}" d="M -40 -40 L ${W + 40} -40 L ${W + 40} ${H + 40} L -40 ${H + 40} Z M 300 ${H} C 320 560 380 400 520 300 C 640 220 900 210 1040 290 C 1160 360 1200 480 1210 560 C 1080 580 980 600 900 640 C 760 700 520 720 300 ${H} Z"/>`,
        fig(380, 640, s, c.p.fore, 'bless'),
        rag(hx + 34, hy, 1.3, c.p.accent, { rot: -10 }),
      ];
    },
  },

  // 25: Abigaïl komt David tegemoet met broden, wijn, rozijnen en vijgen op ezels, en buigt zich voor hem neer
  '1-samuel-bijbelquiz-deel-25': {
    hue: 128,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 250, far: 'ridge', horizon: 480 }),
      donkey(260, 530, 0.95, c.p.near),
      basketLoad(250, 530 - 60 * 0.95 * 1.3, 0.85, c.p.accent),
      donkey(450, 538, 1.1, c.p.near),
      basketLoad(440, 538 - 60 * 1.1 * 1.3, 1.0, c.p.accent),
      fig(640, 544, 1.45, c.p.fore, 'kneelFwd'),
      fig(860, 540, 1.6, c.p.fore, 'stand'),
      fig(990, 534, 1.3, c.p.near, 'staff'),
      fig(1100, 528, 1.15, c.p.near, 'staff', { opacity: 0.9 }),
      fg(c, 694, 12),
    ],
  },

  // 26: David neemt de spies en de waterfles van Sauls hoofdeinde, terwijl allen slapen
  '1-samuel-bijbelquiz-deel-26': {
    hue: 130,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1150, sunY: 190, sunR: 40, far: 'ridge', horizon: 484 }),
      fig(240, 516, 0.8, c.p.mid, 'fallen', { opacity: 0.8 }),
      fig(1180, 514, 0.75, c.p.mid, 'fallen', { flip: true, opacity: 0.75 }),
      fig(380, 528, 0.95, c.p.near, 'fallen', { opacity: 0.9 }),
      fig(580, 548, 1.5, c.p.fore, 'fallen'),
      spear(700, 556, 700, 368, 1.2, c.p.fore),
      jar(740, 550, 0.85, c.p.accent),
      fig(900, 546, 1.55, c.p.fore, 'reach', { flip: true }),
      fig(1030, 540, 1.35, c.p.fore, 'staff', { flip: true }),
      fg(c, 700, 10),
    ],
  },

  // 27: Achis, de koning van Gath, geeft David Ziklag; David woont met zijn mannen en huisgezinnen in het land der Filistijnen
  '1-samuel-bijbelquiz-deel-27': {
    hue: 132,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'dunes', horizon: 482 }),
      citySkyline(c.rand, 1150, 452, 0.75, c.p.near, 5),
      cityWall(1150, 520, 1.1, c.p.near, 340),
      throne(940, 528, 1.0, mix(c.a.figure, c.a.near, 0.3)),
      fig(940, 454, 1.35, c.p.fore, 'sit'),
      rotate(-58, 902, 420, scepter(902, 420, 0.95, c.p.accent)),
      fig(700, 540, 1.55, c.p.fore, 'stand'),
      fig(520, 534, 1.2, c.p.near, 'staff'),
      fig(410, 530, 1.05, c.p.near, 'carry', { opacity: 0.9 }),
      sheepAt(260, 534, 0.75, c.p.light, c.p.near),
      sheepAt(320, 540, 0.7, c.p.light, c.p.near),
      fg(c, 694, 12),
    ],
  },

  // 28: Saul gaat 's nachts vermomd naar de waarzegster te Endor; zij ziet een oud man opkomen, bedekt met een mantel
  '1-samuel-bijbelquiz-deel-28': {
    hue: 134,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 250, sunY: 190, sunR: 36, far: 'ridge', horizon: 488 }),
      houseBlock(c.rand, 1130, 524, 1.1, c.p.near),
      c.soft(740, 420, 200, 0.4, c.p.light),
      smokeColumn(c.rand, 740, 470, 1.0, c.p.light),
      fig(740, 486, 1.35, c.p.light, 'stand', { opacity: 0.5 }),
      fireBed(c.rand, 740, 540, 0.55, c.p.accent, 4),
      fig(500, 548, 1.45, c.p.fore, 'fallen'),
      fig(960, 540, 1.35, c.p.fore, 'raise'),
      fg(c, 700, 10),
    ],
  },

  // 29: de vorsten der Filistijnen willen David niet in de strijd; hij keert vroeg in de morgen terug
  '1-samuel-bijbelquiz-deel-29': {
    hue: 136,
    mood: 'dawn',
    draw: (c) => {
      const out = [base(c, { sunX: 250, sunY: 350, sunR: 54, rays: true, far: 'ridge', horizon: 482 })];
      for (let i = 0; i < 6; i += 1) {
        const x = 820 + i * 92;
        const y = 534 - i * 6;
        const s = 1.25 - i * 0.07;
        out.push(fig(x, y, s, i < 2 ? c.p.fore : c.p.near, 'staff', { opacity: i < 3 ? 1 : 0.85 }));
        out.push(spear(x + 54 * s * K, y, x + 54 * s * K, y - 236 * s * K, 0.8 * s, i < 2 ? c.p.fore : c.p.near));
      }
      out.push(banner(760, 536, 1.4, c.p.fore, c.p.accent));
      out.push(fig(520, 542, 1.55, c.p.fore, 'walk', { flip: true }));
      out.push(fig(400, 536, 1.25, c.p.near, 'walk', { flip: true }));
      out.push(fig(300, 530, 1.05, c.p.near, 'walk', { flip: true, opacity: 0.9 }));
      out.push(fg(c, 694, 12));
      return out;
    },
  },

  // 30: Ziklag met vuur verbrand; David sterkt zich in de HEERE zijn God
  '1-samuel-bijbelquiz-deel-30': {
    hue: 138,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 400, sunR: 54, far: 'dunes', horizon: 482 }),
      smokeColumn(c.rand, 960, 430, 1.6, c.p.fore),
      smokeColumn(c.rand, 1120, 440, 1.3, c.p.fore),
      rect(860, 430, 70, 100, c.p.near),
      rect(940, 470, 60, 60, c.p.near),
      rect(1020, 410, 50, 120, c.p.near),
      rect(1080, 456, 90, 74, c.p.near),
      rect(1180, 480, 60, 50, c.p.near),
      fireBed(c.rand, 1010, 534, 0.75, c.p.accent, 8),
      fig(620, 546, 1.6, c.p.fore, 'kneelUp'),
      fig(400, 544, 1.3, c.p.fore, 'kneel'),
      fig(270, 538, 1.1, c.p.near, 'kneelFwd'),
      fg(c, 696, 12),
    ],
  },

  // 31: Saul en zijn zonen vallen op het gebergte Gilboa; zijn kroon en zijn schild liggen op de grond
  '1-samuel-bijbelquiz-deel-31': {
    hue: 140,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 476 }),
      path('M -20 560 C 200 520 420 420 700 380 C 900 360 1100 380 1440 420 L 1440 560 Z', c.p.mid),
      fig(1050, 380, 0.55, c.p.mid, 'staff', { opacity: 0.8 }),
      fig(1110, 384, 0.5, c.p.mid, 'staff', { opacity: 0.7 }),
      fig(1170, 388, 0.5, c.p.mid, 'staff', { opacity: 0.65 }),
      sword(820, 410, 1.15, c.p.near, { rot: 172 }),
      spear(380, 556, 560, 470, 1.0, c.p.near),
      `<g transform="translate(640 548) scale(1.3 0.42)">${shield(0, 0, 1.0, c.p.near)}</g>`,
      rotate(-16, 700, 540, crown(700, 540 - 14 * 0.75, 0.75, c.p.accent)),
      c.soft(700, 500, 120, 0.25),
      fg(c, 692, 12),
    ],
  },
};
