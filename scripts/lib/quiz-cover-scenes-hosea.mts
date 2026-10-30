/**
 * Covers for the Hosea series, one scene per quiz. Each quiz covers one
 * chapter: `hosea-bijbelquiz-deel-<n>` is chapter n (1-14).
 *
 * Base hue 150, drifting two degrees per chapter (chapter 14 lands on 176).
 * The palette is the coral one of the prophets (see `quiz-cover-scene-kit.mts`).
 * Hosea speaks in pictures - a marriage, a door of hope, a silly dove, a calf,
 * the wind and the whirlwind, a child taught to walk, a lion and a leopard,
 * the dew and the lily - so each cover is the chapter's own picture.
 *
 * Chapters: Hosea trouwt Gomer, de kinderen Jizreël, Lo-Ruchama en Lo-Ammi,
 * de boog verbroken in het dal van Jizreël (1); het dal Achor tot een deur der
 * hoop (2); teruggekocht voor vijftien zilverlingen en anderhalve homer gerst
 * (3); mijn volk gaat verloren door gebrek aan kennis, offers op de toppen
 * der bergen (4); Efraïm gaat tot Assur, Ik zal als een leeuw zijn (5); komt,
 * laat ons wederkeren, Zijn uitgang is bereid als de dageraad, Hij komt als
 * de regen (6); Efraïm als een onnozele duif, Ik zal Mijn net over hen
 * uitspreiden (7); het kalf van Samaria, zij zaaien wind en maaien wervelwind
 * (8); als druiven in de woestijn, zwervers onder de heidenen (9); zaait in
 * gerechtigheid, braakt u een braakland (10); toen Israël een kind was, heb
 * Ik hem liefgehad, met touwen der liefde (11); Jakob worstelde met de Engel
 * (12); als een luipaard aan den weg, als kaf door een wervelwind (13); Ik
 * zal Israël zijn als de dauw, hij zal bloeien als de lelie (14).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  angel,
  bird,
  circle,
  cityWall,
  cloudBank,
  coin,
  crown,
  crowd,
  cypress,
  dove,
  ellipse,
  gateArch,
  grapes,
  ox,
  path,
  pyramids,
  rays,
  rect,
  shafts,
  smokeColumn,
  streaks,
  tablets,
  trail,
  tree,
  vineRow,
  wheat,
  witheredPlant,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import {
  archBow,
  campTent,
  fig,
  hornedAltar,
  kneel,
  leopard,
  lily,
  net,
  plough,
  prowlingLion,
  sack,
  seg,
  star4,
  stroke,
  table,
  throneSeat,
  whirlwind,
} from './quiz-cover-motifs-jeremia-hosea.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** An arrow lying on the ground from its fletching (x1, y1) to its head (x2, y2). */
function arrow(x1: number, y1: number, x2: number, y2: number, fill: string): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 + Math.cos(a) * 18;
  const hy = y2 + Math.sin(a) * 18;
  const nx = -Math.sin(a) * 8;
  const ny = Math.cos(a) * 8;
  return (
    seg(x1, y1, x2, y2, 3.6, fill) +
    path(`M ${r1(x2 + nx)} ${r1(y2 + ny)} L ${r1(hx)} ${r1(hy)} L ${r1(x2 - nx)} ${r1(y2 - ny)} Z`, fill) +
    seg(x1, y1, x1 - Math.cos(a) * 4 + nx * 1.4, y1 - Math.sin(a) * 4 + ny * 1.4 - 10, 3, fill) +
    seg(x1, y1, x1 - Math.cos(a) * 4 - nx * 1.4, y1 - Math.sin(a) * 4 - ny * 1.4 + 6, 3, fill)
  );
}

/** The light filling the opening of a `gateArch` of the same position and size. */
function doorLight(x: number, y: number, s: number, fill: string): string {
  return path(
    `M ${r1(x - 34 * s)} ${r1(y)} L ${r1(x - 34 * s)} ${r1(y - 76 * s)} A ${r1(34 * s)} ${r1(34 * s)} 0 0 1 ${r1(x + 34 * s)} ${r1(y - 76 * s)} L ${r1(x + 34 * s)} ${r1(y)} Z`,
    fill,
    { opacity: 0.85 },
  );
}

/** Seed or chaff flung in an arc from a hand: small specks thinning out along the curve. */
function scatter(rand: () => number, x0: number, y0: number, x1: number, y1: number, lift: number, fill: string, n = 26, k = 1): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = rand();
    const x = x0 + (x1 - x0) * t + (rand() - 0.5) * 30;
    const y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * lift + (rand() - 0.5) * 30;
    out.push(ellipse(x, y, 4.2 * k, 2.6 * k, fill, { opacity: r1(1 - t * 0.55) }));
  }
  return out.join('');
}

export const HOSEA_SCENES: Record<string, Scene> = {
  // 1: Hosea takes Gomer to wife; their children Jizreël, Lo-Ruchama, Lo-Ammi - "Ik zal den boog van Israël verbreken in het dal van Jizreël"
  'hosea-bijbelquiz-deel-1': {
    hue: 150,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 236, far: 'ridge', horizon: 470 }),
      campTent(300, 500, 0.9, c.p.near, c.p.light),
      fig(480, 544, 1.38, c.p.fore, 'stand'),
      fig(600, 544, 1.26, c.p.fore, 'bless', { flip: true }),
      fig(720, 548, 0.82, c.p.fore, 'stand'),
      fig(800, 550, 0.7, c.p.fore, 'stand'),
      fig(870, 552, 0.56, c.p.fore, 'raise'),
      archBow(1080, 560, 1.4, c.p.accent, true),
      arrow(960, 572, 1180, 548, c.p.fore),
      arrow(1000, 584, 1200, 576, c.p.fore),
      fg(c, 694, 10),
    ],
  },

  // 2: "Ik zal haar lokken en zal haar voeren in de woestijn ... en het dal Achor tot een deur der hoop"
  'hosea-bijbelquiz-deel-2': {
    hue: 152,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 380, far: 'ridge', horizon: 470 }),
      path('M 107 520 C 200 400 320 340 460 330 C 520 330 560 420 600 520 Z', c.p.mid),
      path('M 808 520 C 850 420 890 330 950 330 C 1090 340 1210 400 1300 520 Z', c.p.mid),
      vineRow(c.rand, 900, 520, 0.9, c.p.near, 4),
      c.soft(704, 420, 200, 0.7),
      doorLight(704, 534, 1.55, '#FFFFFF'),
      gateArch(704, 534, 1.55, c.p.accent),
      trail(560, H, 704, 534, 70, '#FFFFFF', { opacity: 0.3 }),
      fig(500, 556, 1.3, c.p.fore, 'walk'),
      fg(c, 696, 10),
    ],
  },

  // 3: "Ik kocht haar mij voor vijftien zilverlingen, en een homer gerst, en een halven homer gerst"
  'hosea-bijbelquiz-deel-3': {
    hue: 154,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 236, far: 'dunes', ground: 'flat', horizon: 500 }),
      cityWall(1110, 504, 0.8, c.p.near, 300, { opacity: 0.85 }),
      fig(470, 544, 1.38, c.p.fore, 'reach'),
      table(640, 548, 180, 1.0, c.p.near),
      ...[
        [600, 474],
        [626, 476],
        [652, 474],
        [678, 476],
        [613, 458],
        [639, 458],
        [665, 458],
        [626, 442],
        [652, 442],
      ].map(([x, y]) => coin(x, y, 0.8, c.p.accent)),
      sack(760, 552, 0.95, c.p.near),
      sack(836, 556, 0.7, c.p.near),
      fig(960, 544, 1.28, c.p.fore, 'stand'),
      fg(c, 694, 10),
    ],
  },

  // 4: "Mijn volk is uitgeroeid, omdat het zonder kennis is" - the law left in the dust, sacrifices on the tops of the mountains
  'hosea-bijbelquiz-deel-4': {
    hue: 156,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 330, sunR: 60, far: 'ridge', horizon: 470 }),
      path('M 640 520 C 760 420 880 370 1000 368 C 1120 370 1220 410 1300 470 L 1300 520 Z', c.p.mid),
      tree(900, 384, 1.25, c.p.near),
      tree(1130, 380, 1.05, c.p.near),
      smokeColumn(c.rand, 1010, 300, 0.9, c.p.near),
      hornedAltar(1010, 378, 0.6, c.p.near),
      kneel(1070, 384, 0.7, c.p.fore, 'forward', { flip: true }),
      kneel(950, 384, 0.7, c.p.fore, 'forward'),
      fig(620, 540, 1.3, c.p.fore, 'walk'),
      `<g transform="rotate(-12 420 552)">${tablets(420, 552, 1.15, c.p.accent)}</g>`,
      fg(c, 692, 12),
    ],
  },

  // 5: "Als Efraïm zijn krankheid zag, toog hij naar Assur ... want Ik zal Efraïm als een felle leeuw zijn"
  'hosea-bijbelquiz-deel-5': {
    hue: 158,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 240, clouds: 2, far: 'dunes', horizon: 470 }),
      ziggurat(1160, 470, 1.15, c.p.far, 5, { opacity: 0.85 }),
      throneSeat(1000, 486, 0.32, c.p.near),
      crown(1000, 410, 0.42, c.p.accent),
      fig(780, 530, 1.15, c.p.fore, 'shield'),
      path('M 107 560 C 160 470 260 430 380 432 C 480 436 540 490 580 560 Z', c.p.mid),
      prowlingLion(400, 440, 1.0, c.p.fore),
      fg(c, 694, 10),
    ],
  },

  // 6: "Komt en laat ons wederkeren tot den HEERE ... Zijn uitgang is bereid als de dageraad, en Hij zal tot ons komen als een regen"
  'hosea-bijbelquiz-deel-6': {
    hue: 160,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 470 }),
      c.soft(920, 380, 280, 0.6),
      rays(c.rand, 920, 380, 700, '#FFFFFF', 14, { opacity: 0.11 }),
      circle(920, 380, 48, c.p.accent),
      cloudBank(c.rand, 440, 220, 1.3, '#FFFFFF', { opacity: 0.55 }),
      streaks(c.rand, 300, 240, 300, 220, '#FFFFFF', 30, { opacity: 0.55 }),
      wheat(330, 520, 0.34, c.p.crop, 6),
      wheat(470, 526, 0.3, c.p.crop, 6),
      trail(640, H, 860, 470, 90, '#FFFFFF', { opacity: 0.3 }),
      fig(700, 548, 1.3, c.p.fore, 'walk'),
      fig(590, 552, 1.15, c.p.fore, 'walk'),
      fg(c, 694, 10),
    ],
  },

  // 7: "Efraïm is geworden als een onnozele duif ... zij roepen Egypte aan, zij gaan naar Assur; Ik zal Mijn net over hen uitspreiden"
  'hosea-bijbelquiz-deel-7': {
    hue: 162,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 190, sunR: 60, far: 'dunes', horizon: 470 }),
      pyramids(280, 470, 1.0, c.p.far),
      ziggurat(1130, 470, 1.0, c.p.far, 4),
      net(704, 262, 330, 80, 1.0, c.p.accent),
      dove(690, 440, 1.8, c.p.fore),
      stroke('M 480 500 Q 560 430 620 440', '#FFFFFF', 3, { opacity: 0.6 }),
      stroke('M 920 500 Q 840 430 780 430', '#FFFFFF', 3, { opacity: 0.6 }),
      fg(c, 692, 12),
    ],
  },

  // 8: "Uw kalf, o Samaria, heeft u verstoten ... want zij zaaien wind, en zullen een wervelwind maaien"
  'hosea-bijbelquiz-deel-8': {
    hue: 164,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 2, far: 'ridge', horizon: 470 }),
      whirlwind(1010, 520, 320, 1.0, c.p.near, { opacity: 0.75 }),
      streaks(c.rand, 860, 240, 400, 260, c.p.fore, 30, { opacity: 0.18 }),
      rect(610, 470, 200, 70, c.p.near),
      rect(596, 460, 228, 14, c.p.near),
      ox(730, 462, 1.0, c.p.accent),
      fig(330, 544, 1.32, c.p.fore, 'reach'),
      scatter(c.rand, 400, 450, 560, 520, 40, c.p.near, 18),
      fg(c, 692, 12),
    ],
  },

  // 9: "Ik vond Israël als druiven in de woestijn ... zij zullen omzwervende zijn onder de heidenen"
  'hosea-bijbelquiz-deel-9': {
    hue: 166,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 360, sunR: 60, far: 'dunes', horizon: 470 }),
      bird(980, 300, 1.6, c.p.near),
      bird(1040, 270, 1.3, c.p.near),
      bird(1090, 310, 1.1, c.p.near),
      crowd(c.rand, 860, 520, 0.9, c.p.near, 5, 300),
      fig(620, 544, 1.25, c.p.fore, 'walk'),
      stroke('M 300 560 C 290 500 320 450 300 400 C 290 370 310 340 340 330', c.p.fore, 9),
      stroke('M 302 420 C 260 410 240 390 230 366', c.p.fore, 6),
      witheredPlant(220, 560, 1.0, c.p.near),
      grapes(350, 346, 1.35, c.p.accent),
      fg(c, 694, 10),
    ],
  },

  // 10: "Zaait u in gerechtigheid, maait naar weldadigheid, braakt u een braakland; want het is tijd om den HEERE te zoeken"
  'hosea-bijbelquiz-deel-10': {
    hue: 168,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, clouds: 1, far: 'ridge', horizon: 470 }),
      cloudBank(c.rand, 1080, 210, 1.2, '#FFFFFF', { opacity: 0.5 }),
      streaks(c.rand, 960, 230, 280, 220, '#FFFFFF', 26, { opacity: 0.5 }),
      ...[0, 1, 2, 3].map((i) => stroke(`M ${560 - i * 30} ${600 - i * 26} Q ${760} ${590 - i * 22} ${1060 + i * 30} ${600 - i * 24}`, c.p.near, 3, { opacity: 0.4 })),
      ox(320, 540, 1.05, c.p.near),
      plough(500, 544, 1.0, c.p.fore),
      fig(590, 544, 1.25, c.p.fore, 'reach', { flip: true }),
      fig(880, 544, 1.32, c.p.fore, 'reach'),
      scatter(c.rand, 950, 456, 1150, 540, 50, c.p.accent, 28, 1.3),
      fg(c, 694, 10),
    ],
  },

  // 11: "Toen Israël een kind was, toen heb Ik hem liefgehad, en heb Mijn zoon uit Egypte geroepen ... Ik trok hen met touwen der liefde"
  'hosea-bijbelquiz-deel-11': {
    hue: 170,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1040, sunY: 200, far: 'dunes', horizon: 470 }),
      pyramids(300, 470, 0.9, c.p.far, { opacity: 0.8 }),
      shafts(1040, 120, 220, 340, c.p.glow, 4),
      c.soft(1040, 230, 220, 0.8, '#FFFFFF'),
      stroke('M 1020 250 C 960 330 860 380 784 440', c.p.accent, 6),
      stroke('M 1060 256 C 1010 346 900 400 796 448', c.p.accent, 5, { opacity: 0.85 }),
      fig(720, 548, 1.08, c.p.fore, 'reach'),
      trail(540, H, 720, 548, 60, '#FFFFFF', { opacity: 0.25 }),
      fg(c, 694, 10),
    ],
  },

  // 12: Jakob "had macht met God; ja, hij had macht over den Engel, en overmocht; hij weende en smeekte Hem" - at Peniel until the day broke
  'hosea-bijbelquiz-deel-12': {
    hue: 172,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', ground: 'dunes', horizon: 470 }),
      c.soft(1120, 470, 260, 0.45),
      star4(1120, 360, 30, c.p.accent),
      c.soft(1120, 360, 70, 0.6, c.p.accent),
      c.soft(760, 380, 190, 0.35),
      angel(780, 548, 1.3, c.p.light, { opacity: 0.85 }),
      fig(640, 548, 1.32, c.p.fore, 'reach'),
      fg(c, 694, 10),
    ],
  },

  // 13: "Ik zal hun ... als een luipaard aan den weg loeren" - and they shall be as the chaff driven by the whirlwind from the floor
  'hosea-bijbelquiz-deel-13': {
    hue: 174,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 260, far: 'dunes', horizon: 470 }),
      streaks(c.rand, 500, 200, 800, 280, '#FFFFFF', 30, { opacity: 0.4 }),
      ellipse(420, 540, 140, 24, c.p.mid),
      fig(420, 538, 1.3, c.p.fore, 'raise'),
      scatter(c.rand, 450, 330, 860, 300, 40, c.p.accent, 34, 1.5),
      trail(1000, H, 1000, 470, 110, '#FFFFFF', { opacity: 0.25 }),
      path('M 960 540 C 980 470 1030 430 1110 426 C 1190 426 1250 470 1280 540 Z', c.p.mid),
      leopard(c.rand, 1110, 430, 1.3, c.p.fore, c.p.light),
      fg(c, 694, 10),
    ],
  },

  // 14: "Ik zal Israël zijn als de dauw; hij zal bloeien als de lelie ... Ik ben als een groene denneboom"
  'hosea-bijbelquiz-deel-14': {
    hue: 176,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 260, sunR: 64, rays: true, far: 'ridge', horizon: 470 }),
      tree(300, 520, 1.5, c.p.near),
      vineRow(c.rand, 960, 516, 1.1, c.p.near, 3),
      grapes(960, 494, 0.7, c.p.near),
      grapes(1028, 496, 0.7, c.p.near),
      grapes(1096, 494, 0.7, c.p.near),
      cypress(680, 540, 1.6, c.p.near),
      lily(560, 556, 1.0, c.p.near, c.p.accent),
      lily(800, 560, 1.1, c.p.near, c.p.accent),
      lily(880, 556, 0.8, c.p.near, c.p.accent),
      lily(480, 560, 0.75, c.p.near, c.p.accent),
      ...[
        [420, 520],
        [640, 500],
        [760, 470],
        [930, 540],
        [520, 470],
      ].map(([x, y]) => circle(x, y, 4, '#FFFFFF', { opacity: 0.85 })),
      fg(c, 696, 10),
    ],
  },
};
