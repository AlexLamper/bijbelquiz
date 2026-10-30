/**
 * Covers for the Jeremia series, one scene per quiz. Each quiz covers one
 * chapter: `jeremia-bijbelquiz-deel-<n>` is chapter n (1-52).
 *
 * Base hue 14, drifting two degrees per chapter (chapter 52 lands on 116).
 * The palette is the coral one of the prophets (see `quiz-cover-scene-kit.mts`).
 * Jeremia is a book of signs, so most covers show the sign itself: the almond
 * rod, the belt, the potter's wheel, the broken jar, the yoke, the figs, the
 * deed in the jar, the burnt scroll, the pit, the stone in the Euphrates.
 *
 * Chapters: de amandelstok en de ziedende pot (1); de springader des levenden
 * waters en de gebroken bakken (2); keert weder, gij afkerige kinderen (3);
 * blaast de bazuin, de leeuw uit zijn struikgewas (4); zoekt op haar straten
 * of gij een man vindt (5); het beleg, "Vrede, vrede" (6); de tempelrede in de
 * poort (7); de ooievaar kent haar tijden, de oogst is voorbij (8); de
 * klaagvrouwen (9); afgoden die gedragen moeten worden, de bliksem met de
 * regen (10); de groene olijfboom in brand, het makke lam (11); waarom is de
 * weg der goddelozen voorspoedig (12); de linnen gordel bij de Frath (13); de
 * droogte, vaten leeg teruggebracht (14); een koperen muur (15); vissers en
 * jagers (16); de boom bij het water en de heide in de woestijn (17); in het
 * huis van de pottenbakker (18); de aarden fles verbroken (19); in de stok,
 * een brandend vuur in mijn beenderen (20); de weg des levens en de weg des
 * doods (21); het huis van ceder, de kroon in het stof (22); de herder die de
 * kudde vergadert (23); twee korven vijgen (24); de beker van de wijn der
 * grimmigheid (25); Jeremia voor de vorsten (26); banden en jukken (27);
 * Hananja breekt het juk (28); de brief aan de ballingen (29); de stad op
 * haar heuvel herbouwd (30); het nieuwe verbond in het hart (31); de akker te
 * Anathoth, de koopbrief in een aarden vat (32); de Spruit der gerechtigheid
 * (33); de vrijgelatenen weer onderworpen (34); de Rechabieten weigeren de
 * wijn (35); Jojakim verbrandt de rol (36); in het gevangenhuis, een bol
 * brood per dag (37); in de kuil, opgetrokken met touwen (38); Jeruzalem
 * ingenomen en verbrand (39); Jeremia los van de ketenen (40); de moord te
 * Mizpa (41); blijft in dit land (42); stenen in het tichelwerk te Tachpanhes
 * (43); de koningin des hemels (44); het woord aan Baruch (45); Farao Necho
 * bij Karchemis (46); het zwaard des HEEREN tegen de Filistijnen (47); Moab
 * op zijn droesem, de vaten verbroken (48); Edom, nest als een arend (49);
 * een banier tegen Babel (50); Seraja werpt de rol in de Frath (51); de
 * koperen pilaren weggevoerd (52).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  banner,
  basket,
  boat,
  brickWall,
  chariot,
  circle,
  cityWall,
  citySkyline,
  cloudBank,
  coin,
  columns,
  crown,
  crowd,
  cypress,
  ellipse,
  fireBed,
  flame,
  gateArch,
  goblet,
  grapes,
  horse,
  houseBlock,
  lamp,
  loaf,
  palm,
  path,
  person,
  prisonBars,
  pyramids,
  rect,
  reeds,
  river,
  rotate,
  scroll,
  shafts,
  sheaf,
  shrub,
  smokeColumn,
  streaks,
  stump,
  templeFront,
  throne,
  tower,
  trail,
  tree,
  tri,
  vineRow,
  wheat,
  witheredPlant,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import {
  almondRod,
  brazier,
  bronzePillar,
  brokenYoke,
  campTent,
  cauldron,
  chainAlong,
  cutStump,
  eagle,
  fig,
  figHeap,
  fireOn,
  heartShape,
  hillCity,
  hind,
  hornedAltar,
  idol,
  jar,
  jarFallen,
  kneel,
  lamb,
  net,
  potterWheel,
  prowlingLion,
  quillPen,
  roundShield,
  seg,
  shards,
  shofar,
  shoot,
  star4,
  stocks,
  throneSeat,
  stork,
  stroke,
  sword,
  table,
  whirlwind,
  yoke,
} from './quiz-cover-motifs-jeremia-hosea.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

// ── small pieces composed for this series ───────────────────────────────────

/** Steam rising from a point: soft white puffs. */
function steam(rand: () => number, x: number, y: number, s: number, n = 6): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(ellipse(x + Math.sin(i * 1.3) * 18 * s + (rand() - 0.5) * 10 * s, y - i * 26 * s, (18 + i * 5) * s, (12 + i * 3) * s, '#FFFFFF', { opacity: r1(0.62 - i * 0.07) }));
  }
  return out.join('');
}

/** A jagged bolt from a point downward. */
function lightning(x: number, y: number, s: number, fill: string, o = 0.85): string {
  return path(
    `M ${r1(x)} ${r1(y)} L ${r1(x - 26 * s)} ${r1(y + 80 * s)} L ${r1(x - 4 * s)} ${r1(y + 74 * s)} L ${r1(x - 34 * s)} ${r1(y + 170 * s)}` +
      ` L ${r1(x + 24 * s)} ${r1(y + 66 * s)} L ${r1(x + 2 * s)} ${r1(y + 72 * s)} L ${r1(x + 22 * s)} ${r1(y)} Z`,
    fill,
    { opacity: o },
  );
}

/** A hewn cistern in the ground, its stone lip split by a crack - "gebroken bakken, die geen water houden". */
function brokenCistern(x: number, y: number, s: number, stone: string, hole: string, crack: string): string {
  return (
    ellipse(x, y, 120 * s, 32 * s, stone) +
    ellipse(x, y - 2 * s, 92 * s, 20 * s, hole) +
    path(`M ${r1(x - 20 * s)} ${r1(y - 34 * s)} L ${r1(x - 8 * s)} ${r1(y - 18 * s)} L ${r1(x - 22 * s)} ${r1(y - 4 * s)} L ${r1(x - 6 * s)} ${r1(y + 12 * s)} L ${r1(x - 16 * s)} ${r1(y + 34 * s)} L ${r1(x - 2 * s)} ${r1(y + 14 * s)} L ${r1(x - 12 * s)} ${r1(y - 4 * s)} L ${r1(x + 2 * s)} ${r1(y - 18 * s)} Z`, crack) +
    path(`M ${r1(x + 60 * s)} ${r1(y + 22 * s)} L ${r1(x + 70 * s)} ${r1(y + 8 * s)} L ${r1(x + 64 * s)} ${r1(y - 4 * s)} L ${r1(x + 76 * s)} ${r1(y + 10 * s)} Z`, crack)
  );
}

/** A rock outcrop with a spring pouring from a cleft and running off toward the viewer. */
function springRock(x: number, y: number, s: number, rock: string, waterFill: string, foam: string): string {
  return (
    path(
      `M ${r1(x - 170 * s)} ${r1(y)} C ${r1(x - 160 * s)} ${r1(y - 90 * s)} ${r1(x - 110 * s)} ${r1(y - 170 * s)} ${r1(x - 30 * s)} ${r1(y - 190 * s)}` +
        ` C ${r1(x + 40 * s)} ${r1(y - 200 * s)} ${r1(x + 120 * s)} ${r1(y - 150 * s)} ${r1(x + 170 * s)} ${r1(y)} Z`,
      rock,
    ) +
    path(`M ${r1(x - 8 * s)} ${r1(y - 120 * s)} C ${r1(x + 4 * s)} ${r1(y - 80 * s)} ${r1(x + 6 * s)} ${r1(y - 40 * s)} ${r1(x + 20 * s)} ${r1(y)} L ${r1(x + 48 * s)} ${r1(y)} C ${r1(x + 30 * s)} ${r1(y - 40 * s)} ${r1(x + 22 * s)} ${r1(y - 80 * s)} ${r1(x + 12 * s)} ${r1(y - 120 * s)} Z`, waterFill) +
    ellipse(x + 2 * s, y - 122 * s, 16 * s, 8 * s, waterFill) +
    path(`M ${r1(x + 4 * s)} ${r1(y - 4 * s)} C ${r1(x + 60 * s)} ${r1(y + 30 * s)} ${r1(x + 40 * s)} ${r1(y + 90 * s)} ${r1(x + 120 * s)} ${r1(y + 220 * s)} L ${r1(x + 230 * s)} ${r1(y + 220 * s)} C ${r1(x + 140 * s)} ${r1(y + 90 * s)} ${r1(x + 130 * s)} ${r1(y + 30 * s)} ${r1(x + 70 * s)} ${r1(y - 4 * s)} Z`, waterFill) +
    stroke(`M ${r1(x + 14 * s)} ${r1(y - 110 * s)} C ${r1(x + 20 * s)} ${r1(y - 70 * s)} ${r1(x + 22 * s)} ${r1(y - 40 * s)} ${r1(x + 32 * s)} ${r1(y - 6 * s)}`, foam, 4 * s, { opacity: 0.7 }) +
    stroke(`M ${r1(x + 60 * s)} ${r1(y + 40 * s)} q ${r1(20 * s)} ${r1(-6 * s)} ${r1(40 * s)} 0`, foam, 4 * s, { opacity: 0.6 }) +
    stroke(`M ${r1(x + 90 * s)} ${r1(y + 110 * s)} q ${r1(24 * s)} ${r1(-6 * s)} ${r1(48 * s)} 0`, foam, 4 * s, { opacity: 0.6 })
  );
}

/** A linen belt (gordel) draped over a hand: two fringed ends hanging in loose waves. (x, y) is the hand. */
function hangingBelt(x: number, y: number, s: number, fill: string): string {
  const fringe = (fx: number, fy: number) => {
    const out: string[] = [];
    for (let i = -2; i <= 2; i += 1) out.push(seg(fx + i * 3.6 * s, fy, fx + i * 4.4 * s, fy + 16 * s, 2.4 * s, fill));
    return out.join('');
  };
  return (
    stroke(`M ${r1(x)} ${r1(y)} C ${r1(x - 26 * s)} ${r1(y + 26 * s)} ${r1(x - 6 * s)} ${r1(y + 56 * s)} ${r1(x - 22 * s)} ${r1(y + 92 * s)}`, fill, 15 * s) +
    stroke(`M ${r1(x + 2 * s)} ${r1(y)} C ${r1(x + 22 * s)} ${r1(y + 22 * s)} ${r1(x + 8 * s)} ${r1(y + 44 * s)} ${r1(x + 22 * s)} ${r1(y + 72 * s)}`, fill, 15 * s) +
    fringe(x - 22 * s, y + 96 * s) +
    fringe(x + 22 * s, y + 76 * s) +
    circle(x - 12 * s, y + 40 * s, 3 * s, '#FFFFFF', { opacity: 0.6 }) +
    circle(x + 14 * s, y + 30 * s, 2.5 * s, '#FFFFFF', { opacity: 0.6 }) +
    circle(x - 16 * s, y + 70 * s, 2.5 * s, '#FFFFFF', { opacity: 0.6 })
  );
}

/** Earth cracked by drought: a net of jagged pale lines over the ground. */
function cracks(rand: () => number, x0: number, x1: number, y0: number, y1: number, fill: string, n = 9): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    let x = x0 + rand() * (x1 - x0);
    let y = y0 + rand() * (y1 - y0);
    let d = `M ${r1(x)} ${r1(y)}`;
    for (let k = 0; k < 4; k += 1) {
      x += (rand() - 0.3) * 70;
      y += (rand() - 0.5) * 14;
      d += ` L ${r1(x)} ${r1(y)}`;
    }
    out.push(stroke(d, fill, 3, { opacity: 0.55 }));
  }
  return out.join('');
}

/** A spear held upright, its point up. */
function spear(x: number, y: number, h: number, fill: string): string {
  return seg(x, y, x, y - h, 4, fill) + tri(x - 7, y - h + 4, x, y - h - 22, x + 7, y - h + 4, fill);
}

export const JEREMIA_SCENES: Record<string, Scene> = {
  // 1: "Wat ziet gij, Jeremia? Een amandelstok" - the young prophet, the rod in blossom and the seething pot from the north
  'jeremia-bijbelquiz-deel-1': {
    hue: 14,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 236, sunR: 70, rays: true, far: 'ridge', horizon: 470 }),
      fireBed(c.rand, 1120, 526, 0.42, c.p.glow, 4),
      cauldron(1120, 522, 0.78, c.p.near, 12),
      steam(c.rand, 1140, 400, 1.0),
      fig(560, 530, 1.22, c.p.fore, 'reach'),
      almondRod(c.rand, 770, 534, 1.05, c.p.near, c.p.accent, c.p.light),
      fg(c, 684, 16),
    ],
  },

  // 2: "Mij, de Springader des levenden waters, hebben zij verlaten, om zichzelf bakken uit te houwen, gebroken bakken"
  'jeremia-bijbelquiz-deel-2': {
    hue: 16,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 236, far: 'dunes', horizon: 470 }),
      c.soft(330, 380, 210, 0.45),
      springRock(330, 500, 1.0, c.p.mid, c.p.water, c.p.light),
      brokenCistern(990, 528, 1.0, c.p.near, c.p.fore, c.p.light),
      jarFallen(830, 540, 0.62, c.p.accent),
      kneel(1180, 534, 1.25, c.p.fore, 'plant', { flip: true }),
      fig(700, 530, 1.25, c.p.fore, 'walk'),
      fg(c, 686, 14),
    ],
  },

  // 3: "Keert weder, gij afkerige kinderen" - leaving the bare heights and the idol under the green tree, home toward the lit door
  'jeremia-bijbelquiz-deel-3': {
    hue: 18,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 930, sunY: 250, sunR: 56, far: 'ridge', horizon: 470 }),
      path('M 660 534 C 800 470 960 386 1310 374 L 1310 534 Z', c.p.mid),
      tree(1080, 392, 1.0, c.p.near),
      idol(1190, 388, 0.32, c.p.near),
      houseBlock(c.rand, 330, 520, 1.15, c.p.near),
      rect(306, 456, 40, 64, c.p.accent),
      c.soft(326, 488, 110, 0.4, c.p.accent),
      fig(720, 532, 1.3, c.p.fore, 'walk', { flip: true }),
      fg(c, 686, 14),
    ],
  },

  // 4: "Blaast de bazuin in het land ... de leeuw komt op uit zijn struikgewas"
  'jeremia-bijbelquiz-deel-4': {
    hue: 20,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 470 }),
      streaks(c.rand, 760, 160, 520, 300, c.p.fore, 40, { opacity: 0.2 }),
      path('M 110 530 C 200 440 300 414 420 412 C 540 414 640 470 720 530 Z', c.p.mid),
      fig(400, 420, 1.2, c.p.fore, 'carry'),
      shofar(414, 290, 0.92, c.p.accent, false, c.p.light),
      shrub(1170, 530, 2.1, c.p.near),
      shrub(1270, 536, 1.6, c.p.near),
      prowlingLion(950, 548, 1.15, c.p.fore),
      fg(c, 686, 14),
    ],
  },

  // 5: "Gaat om door de straten van Jeruzalem ... of gij iemand vindt, die recht doet" - searching with a lamp by night
  'jeremia-bijbelquiz-deel-5': {
    hue: 22,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1180, sunY: 200, sunR: 46, far: 'none', ground: 'flat', horizon: 500 }),
      houseBlock(c.rand, 250, 520, 1.25, c.p.near),
      houseBlock(c.rand, 450, 506, 0.95, c.p.near, { opacity: 0.85 }),
      houseBlock(c.rand, 960, 506, 0.95, c.p.near, { opacity: 0.85 }),
      houseBlock(c.rand, 1170, 520, 1.25, c.p.near),
      trail(704, H, 704, 500, 150, '#FFFFFF', { opacity: 0.22 }),
      c.soft(790, 446, 150, 0.5, c.p.accent),
      fig(700, 548, 1.32, c.p.fore, 'reach'),
      lamp(776, 466, 0.8, c.p.fore, c.p.accent),
      flame(806, 462, 0.36, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 6: "Houwt bomen af, en werpt een wal op tegen Jeruzalem" - the siege mound, the army from the north under its banner
  'jeremia-bijbelquiz-deel-6': {
    hue: 24,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 230, far: 'dunes', horizon: 470 }),
      path('M 640 480 C 760 420 860 396 1000 392 C 1140 396 1220 420 1300 470 L 1300 520 L 640 520 Z', c.p.mid),
      citySkyline(c.rand, 980, 394, 0.75, c.p.near, 6),
      cityWall(980, 420, 0.82, c.p.near, 320),
      path('M 560 540 L 820 424 L 880 424 L 900 540 Z', c.p.near, { opacity: 0.75 }),
      stump(220, 540, 0.9, c.p.near),
      fig(380, 540, 1.15, c.p.fore, 'shield'),
      fig(500, 532, 1.05, c.p.fore, 'walk'),
      spear(560, 532, 200, c.p.fore),
      fig(280, 548, 1.25, c.p.fore, 'walk'),
      rect(434, 300, 6, 230, c.p.fore),
      path('M 440 302 L 540 318 L 516 346 L 540 374 L 440 360 Z', c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 7: "Het is des HEEREN tempel, des HEEREN tempel!" - Jeremia preaching in the gate of the house of the LORD
  'jeremia-bijbelquiz-deel-7': {
    hue: 26,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 920, sunY: 210, far: 'none', ground: 'flat', horizon: 510 }),
      c.soft(920, 300, 260, 0.35),
      templeFront(920, 512, 1.7, c.p.near, 6),
      rect(890, 410, 60, 86, c.p.accent),
      crowd(c.rand, 330, 540, 0.95, c.p.near, 5, 300),
      fig(620, 530, 1.35, c.p.fore, 'reach', { flip: true }),
      fg(c, 688, 14),
    ],
  },

  // 8: "Zelfs een ooievaar aan de hemel weet haar gezette tijden ... de oogst is voorbijgegaan, de zomer is ten einde"
  'jeremia-bijbelquiz-deel-8': {
    hue: 28,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 380, sunR: 64, far: 'dunes', horizon: 470 }),
      stork(560, 270, 0.95, c.p.near),
      stork(740, 312, 0.8, c.p.near, { opacity: 0.85 }),
      stork(400, 330, 0.7, c.p.near, { opacity: 0.75 }),
      wheat(980, 520, 0.36, c.p.crop, 9),
      wheat(1150, 524, 0.32, c.p.crop, 8),
      sheaf(1040, 540, 0.9, c.p.accent),
      person(330, 540, 1.3, c.p.fore, 'sit'),
      fg(c, 688, 14),
    ],
  },

  // 9: "Och, dat mijn hoofd water ware, en mijn oog een springader van tranen" - the wailing women before the ruined city
  'jeremia-bijbelquiz-deel-9': {
    hue: 30,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 300, sunY: 200, sunR: 42, far: 'ridge', horizon: 470 }),
      cloudBank(c.rand, 980, 190, 1.3, '#FFFFFF', { opacity: 0.32 }),
      streaks(c.rand, 820, 220, 360, 240, '#FFFFFF', 34, { opacity: 0.3 }),
      citySkyline(c.rand, 1000, 470, 0.85, c.p.far, 7),
      path('M 820 476 L 860 430 L 900 452 L 950 410 L 990 446 L 1040 420 L 1100 476 Z', c.p.mid),
      kneel(360, 540, 1.2, c.p.fore, 'up'),
      kneel(560, 536, 1.15, c.p.fore, 'pray', { flip: true }),
      fig(760, 540, 1.3, c.p.fore, 'raise'),
      lamp(470, 548, 0.8, c.p.fore, c.p.accent),
      c.soft(500, 540, 70, 0.5, c.p.accent),
      fg(c, 690, 12),
    ],
  },

  // 10: "Zij moeten gedragen worden, want zij kunnen niet gaan" - the idol on a pole, and the LORD's lightning and rain
  'jeremia-bijbelquiz-deel-10': {
    hue: 32,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 2, far: 'ridge', horizon: 470 }),
      cloudBank(c.rand, 1100, 170, 1.4, c.p.near, { opacity: 0.3 }),
      lightning(1060, 190, 1.1, '#FFFFFF'),
      lightning(1210, 220, 0.7, '#FFFFFF', 0.7),
      streaks(c.rand, 940, 220, 340, 260, c.p.fore, 36, { opacity: 0.22 }),
      fig(470, 534, 1.25, c.p.fore, 'walk'),
      fig(830, 534, 1.25, c.p.fore, 'walk'),
      rect(420, 404, 470, 9, c.p.fore, { rx: 4 }),
      idol(650, 404, 0.72, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 11: "Een groene olijfboom, schoon van schone vrucht ... Hij heeft een vuur daarover aangestoken" - and the lamb led to the slaughter
  'jeremia-bijbelquiz-deel-11': {
    hue: 34,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 300, sunR: 60, far: 'ridge', horizon: 470 }),
      citySkyline(c.rand, 1180, 470, 0.6, c.p.far, 4, { opacity: 0.8 }),
      smokeColumn(c.rand, 690, 300, 1.4, c.p.near),
      tree(680, 520, 1.7, c.p.near),
      fireBed(c.rand, 650, 382, 0.62, c.p.accent, 7),
      fireBed(c.rand, 700, 352, 0.5, c.p.accent, 4),
      lamb(1000, 540, 1.25, c.p.light, c.p.fore),
      fg(c, 688, 14),
    ],
  },

  // 12: "Waarom is de weg der goddelozen voorspoedig?" - the prophet asking beneath the wicked man's fruitful tree; horses beyond
  'jeremia-bijbelquiz-deel-12': {
    hue: 36,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 240, far: 'dunes', horizon: 470 }),
      houseBlock(c.rand, 230, 490, 1.0, c.p.near, { opacity: 0.85 }),
      horse(1040, 486, 0.62, c.p.near, { opacity: 0.8 }),
      horse(1170, 492, 0.7, c.p.near, { opacity: 0.85 }),
      tree(470, 530, 1.75, c.p.near),
      ...[
        [390, 412],
        [440, 384],
        [510, 392],
        [560, 420],
        [470, 428],
        [350, 440],
        [600, 446],
      ].map(([x, y]) => circle(x, y, 11, c.p.accent)),
      kneel(780, 540, 1.3, c.p.fore, 'up', { flip: true }),
      fg(c, 688, 14),
    ],
  },

  // 13: the linen belt hidden in a cleft of the rock by the Euphrates and dug up again, rotten
  'jeremia-bijbelquiz-deel-13': {
    hue: 38,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 300, sunR: 66, rays: true, far: 'dunes', ground: 'water', horizon: 452 }),
      palm(1180, 456, 0.9, c.p.far, { opacity: 0.8 }),
      palm(1260, 460, 0.7, c.p.far, { opacity: 0.7 }),
      path(`M 120 500 C 300 476 520 480 720 496 C 820 506 900 540 940 ${H} L 120 ${H} Z`, c.p.mid),
      path('M 160 520 C 170 420 220 360 300 350 C 380 342 430 400 450 520 Z', c.p.near),
      path('M 300 352 L 312 420 L 296 470 L 318 520 L 330 520 L 312 470 L 326 420 Z', c.p.light, { opacity: 0.45 }),
      fig(580, 540, 1.32, c.p.fore, 'reach', { flip: true }),
      hangingBelt(510, 452, 1.1, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 14: the great drought - the ground cracked, the servants back from the pits with empty vessels, the hind leaving her calf
  'jeremia-bijbelquiz-deel-14': {
    hue: 40,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 200, sunR: 90, rays: true, far: 'dunes', ground: 'flat', horizon: 482 }),
      cracks(c.rand, 200, 1240, 500, 600, c.p.near, 12),
      ellipse(1000, 530, 90, 20, c.p.near),
      ellipse(1000, 528, 66, 11, c.p.fore),
      witheredPlant(260, 520, 1.2, c.p.near),
      witheredPlant(1180, 520, 1.0, c.p.near),
      hind(1180, 520, 0.9, c.p.near, true),
      fig(560, 540, 1.3, c.p.fore, 'walk', { flip: true }),
      jar(560, 372, 0.62, c.p.accent),
      jarFallen(850, 548, 0.6, c.p.near),
      fg(c, 690, 12),
    ],
  },

  // 15: "Ik zal u tegen dit volk tot een vaste koperen muur maken; zij zullen tegen u strijden, maar u niet overwinnen"
  'jeremia-bijbelquiz-deel-15': {
    hue: 42,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 960, sunY: 220, clouds: 2, far: 'ridge', horizon: 470 }),
      shafts(960, 150, 160, 260, c.p.glow, 3),
      fig(940, 522, 1.35, c.p.fore, 'stand'),
      cityWall(820, 536, 1.0, c.p.accent, 300),
      crowd(c.rand, 380, 548, 1.0, c.p.near, 5, 300),
      spear(260, 548, 220, c.p.near),
      spear(430, 552, 230, c.p.near),
      spear(560, 548, 200, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 16: "Ik zal zenden tot vele vissers ... en daarna tot vele jagers" - nets on the water, a hunter in the clefts of the rocks
  'jeremia-bijbelquiz-deel-16': {
    hue: 44,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, far: 'ridge', ground: 'water', horizon: 450 }),
      boat(560, 500, 1.3, c.p.near, false),
      fig(520, 486, 0.95, c.p.fore, 'reach'),
      fig(620, 484, 0.9, c.p.fore, 'carry'),
      net(720, 486, 150, 70, 1.0, c.p.accent),
      path(`M 940 ${H} C 960 600 1000 500 1080 440 C 1150 400 1240 392 1320 400 L 1320 ${H} Z`, c.p.mid),
      ellipse(1190, 470, 26, 16, c.p.fore, { opacity: 0.6 }),
      fig(1110, 452, 1.0, c.p.fore, 'reach', { flip: true }),
      stroke('M 1030 330 Q 1000 390 1040 450', c.p.fore, 5),
      fg(c, 692, 12),
    ],
  },

  // 17: "Gezegend de man, die op den HEERE vertrouwt ... hij zal zijn als een boom, die aan het water geplant is" - and the heath in the desert
  'jeremia-bijbelquiz-deel-17': {
    hue: 46,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 236, far: 'dunes', horizon: 470 }),
      c.veil(120, 620, '#E8C27A', 0.18),
      cracks(c.rand, 130, 470, 500, 590, c.p.near, 6),
      witheredPlant(260, 540, 1.8, c.p.near),
      witheredPlant(380, 528, 1.1, c.p.near, { opacity: 0.8 }),
      river(476, c.p.water),
      ...[
        [600, 500, 40],
        [560, 540, 60],
        [520, 590, 80],
      ].map(([x, y, l]) => stroke(`M ${x} ${y} q ${l / 2} -8 ${l} 0`, '#FFFFFF', 4, { opacity: 0.75 })),
      reeds(c.rand, 760, 540, 0.9, c.p.near, 6),
      tree(900, 532, 2.0, c.p.near),
      ...[
        [810, 384],
        [866, 358],
        [944, 366],
        [1000, 398],
        [900, 404],
        [776, 424],
        [1036, 430],
      ].map(([x, y]) => circle(x, y, 11, c.p.accent)),
      fg(c, 690, 12),
    ],
  },

  // 18: "Daal af in des pottenbakkers huis" - the vessel marred in his hand, made again as it seemed good to him
  'jeremia-bijbelquiz-deel-18': {
    hue: 48,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 240, far: 'none', ground: 'flat', horizon: 510 }),
      rect(170, 300, 14, 236, c.p.near),
      rect(1210, 300, 14, 236, c.p.near),
      rect(150, 290, 1094, 18, c.p.near),
      jar(260, 530, 0.8, c.p.near),
      jar(330, 534, 0.62, c.p.near, { opacity: 0.85 }),
      jar(1120, 530, 0.72, c.p.near),
      potterWheel(730, 548, 1.3, c.p.near, c.p.accent),
      kneel(612, 548, 1.3, c.p.fore, 'forward'),
      fig(960, 540, 1.3, c.p.fore, 'stand'),
      fg(c, 692, 12),
    ],
  },

  // 19: "Breek dan de fles voor de ogen der mannen" - the earthen jar smashed in the valley of Hinnom, at the Potsherd Gate
  'jeremia-bijbelquiz-deel-19': {
    hue: 50,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 330, sunR: 60, far: 'ridge', horizon: 470 }),
      gateArch(300, 520, 1.25, c.p.near),
      rect(170, 404, 70, 116, c.p.near),
      crowd(c.rand, 1040, 530, 0.95, c.p.near, 4, 230),
      fig(660, 544, 1.32, c.p.fore, 'raise'),
      rotate(-14, 660, 330, jar(660, 356, 0.8, c.p.accent)),
      stroke('M 652 286 L 666 300 L 654 316 L 670 334', c.p.light, 3),
      shards(c.rand, 750, 556, 1.2, c.p.accent, 6, 200),
      fg(c, 690, 12),
    ],
  },

  // 20: Pashur sets Jeremia in the stocks at the gate of Benjamin - "Zijn woord werd in mijn hart als een brandend vuur"
  'jeremia-bijbelquiz-deel-20': {
    hue: 52,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1150, sunY: 210, sunR: 44, far: 'none', ground: 'flat', horizon: 510 }),
      gateArch(704, 512, 1.9, c.p.near),
      c.soft(704, 470, 170, 0.55, c.p.accent),
      person(704, 556, 1.7, c.p.fore, 'sit'),
      flame(704, 500, 0.72, c.p.accent),
      stocks(704, 562, 1.35, c.p.near),
      fg(c, 694, 12),
    ],
  },

  // 21: "Ik stel u voor den weg des levens en den weg des doods" - the road splits: the burning city, or out to the Chaldeans
  'jeremia-bijbelquiz-deel-21': {
    hue: 54,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, clouds: 2, far: 'ridge', horizon: 470 }),
      smokeColumn(c.rand, 360, 340, 1.4, c.p.fore),
      citySkyline(c.rand, 340, 420, 0.7, c.p.near, 5),
      cityWall(340, 452, 0.8, c.p.near, 300),
      fireBed(c.rand, 340, 404, 0.6, c.p.accent, 6),
      campTent(1020, 474, 0.8, c.p.near),
      campTent(1190, 480, 0.95, c.p.near),
      banner(1100, 478, 0.7, c.p.near, c.p.near),
      path(`M 600 ${H} L 808 ${H} L 730 520 L 678 520 Z`, '#FFFFFF', { opacity: 0.45 }),
      path('M 678 522 L 730 522 L 470 470 L 440 472 Z', '#FFFFFF', { opacity: 0.45 }),
      path('M 678 522 L 730 522 L 1000 478 L 968 476 Z', '#FFFFFF', { opacity: 0.45 }),
      fig(830, 560, 1.3, c.p.fore, 'bless'),
      fg(c, 696, 10),
    ],
  },

  // 22: "Wee dien, die zijn huis bouwt met ongerechtigheid" - the cedar palace; the crown of Judah's kings fallen in the dust
  'jeremia-bijbelquiz-deel-22': {
    hue: 56,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 230, far: 'dunes', ground: 'flat', horizon: 510 }),
      rect(560, 330, 440, 182, c.p.near),
      rect(540, 312, 480, 22, c.p.near),
      ...[600, 690, 780, 870, 960].map((x) => rect(x - 16, 372, 32, 64, c.p.light, { opacity: 0.4 })),
      columns(780, 512, 1.0, c.p.near, 5),
      cypress(470, 516, 1.3, c.p.near),
      cypress(400, 520, 1.05, c.p.near),
      fig(1120, 540, 1.25, c.p.fore, 'walk'),
      rotate(-22, 760, 556, crown(760, 556, 1.0, c.p.accent)),
      fg(c, 692, 12),
    ],
  },

  // 23: "Ik zal het overblijfsel Mijner schapen vergaderen ... en Ik zal herders over hen verwekken"
  'jeremia-bijbelquiz-deel-23': {
    hue: 58,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1140, sunY: 290, sunR: 66, rays: true, far: 'ridge', horizon: 470 }),
      lamb(1080, 476, 0.55, c.p.light, c.p.near, { flip: true }),
      lamb(1190, 470, 0.5, c.p.light, c.p.near, { flip: true, opacity: 0.85 }),
      lamb(960, 484, 0.6, c.p.light, c.p.near, { flip: true }),
      fig(560, 540, 1.35, c.p.fore, 'staff', { staffFill: c.p.accent }),
      lamb(700, 540, 0.95, c.p.light, c.p.fore, { flip: true }),
      lamb(400, 536, 0.85, c.p.light, c.p.fore),
      lamb(800, 528, 0.8, c.p.light, c.p.fore, { flip: true }),
      fg(c, 690, 12),
    ],
  },

  // 24: two baskets of figs before the temple - very good figs, and very bad figs that cannot be eaten
  'jeremia-bijbelquiz-deel-24': {
    hue: 60,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      templeFront(704, 500, 1.1, c.p.far, 6, { opacity: 0.85 }),
      basket(470, 548, 2.3, c.p.near),
      figHeap(c.rand, 470, 476, 2.0, c.p.accent, 12),
      basket(940, 548, 2.3, c.p.near),
      figHeap(c.rand, 940, 476, 2.0, c.p.mid, 12),
      fg(c, 694, 10),
    ],
  },

  // 25: "Neem dezen beker van den wijn der grimmigheid uit Mijn hand, en doe dien drinken al de volken"
  'jeremia-bijbelquiz-deel-25': {
    hue: 62,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'ridge', horizon: 470 }),
      whirlwind(1110, 470, 260, 0.9, c.p.near, { opacity: 0.6 }),
      c.soft(704, 400, 180, 0.4),
      rect(640, 500, 128, 40, c.p.near, { rx: 4 }),
      goblet(704, 502, 2.7, c.p.accent),
      crowd(c.rand, 360, 548, 1.0, c.p.near, 4, 230),
      kneel(980, 548, 1.2, c.p.fore, 'up', { flip: true }),
      fig(1080, 548, 1.15, c.p.near, 'walk', { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 26: "Deze man is des doods schuldig" - Jeremia before the princes in the entry of the new gate; Ahikam's hand was with him
  'jeremia-bijbelquiz-deel-26': {
    hue: 64,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, far: 'none', ground: 'flat', horizon: 512 }),
      gateArch(704, 512, 1.6, c.p.accent),
      rect(170, 470, 300, 42, c.p.near),
      person(230, 474, 0.95, c.p.fore, 'sit'),
      person(320, 474, 0.95, c.p.fore, 'sit'),
      person(410, 474, 0.95, c.p.fore, 'sit'),
      fig(704, 544, 1.38, c.p.fore, 'stand'),
      fig(808, 540, 1.25, c.p.fore, 'bless', { flip: true }),
      crowd(c.rand, 1110, 546, 1.0, c.p.near, 4, 220),
      fg(c, 692, 12),
    ],
  },

  // 27: "Maak u banden en jukken, en doe ze aan uw hals" - Jeremia wearing the yoke before the envoys of the kings
  'jeremia-bijbelquiz-deel-27': {
    hue: 66,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'ridge', horizon: 470 }),
      columns(250, 520, 1.2, c.p.near, 3),
      fig(620, 544, 1.4, c.p.fore, 'stand'),
      yoke(620, 404, 0.82, c.p.accent),
      crowd(c.rand, 1000, 540, 1.0, c.p.near, 5, 300),
      fg(c, 692, 12),
    ],
  },

  // 28: Hananja takes the yoke from Jeremia's neck and breaks it - "gij hebt houten jukken verbroken, maar ijzeren jukken gemaakt"
  'jeremia-bijbelquiz-deel-28': {
    hue: 68,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1100, sunY: 240, clouds: 2, far: 'none', ground: 'flat', horizon: 510 }),
      templeFront(300, 512, 1.15, c.p.near, 5),
      crowd(c.rand, 300, 540, 0.8, c.p.near, 4, 220),
      fig(660, 544, 1.38, c.p.fore, 'raise'),
      brokenYoke(660, 330, 0.72, c.p.accent, 70),
      fig(1010, 544, 1.3, c.p.fore, 'walk'),
      fg(c, 692, 12),
    ],
  },

  // 29: the letter to the exiles - "Bouwt huizen en woont, plant hoven ... Ik weet de gedachten die Ik over u denk"
  'jeremia-bijbelquiz-deel-29': {
    hue: 70,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 320, sunR: 60, far: 'dunes', horizon: 470 }),
      ziggurat(1100, 470, 1.3, c.p.far, 5, { opacity: 0.85 }),
      palm(880, 476, 0.9, c.p.near, { opacity: 0.9 }),
      rect(940, 430, 150, 106, c.p.near),
      rect(926, 418, 178, 14, c.p.near),
      fig(1170, 540, 1.2, c.p.fore, 'carry'),
      kneel(760, 544, 1.2, c.p.fore, 'plant'),
      shoot(830, 544, 0.62, c.p.near, c.p.near),
      fig(440, 544, 1.35, c.p.fore, 'reach'),
      scroll(530, 452, 0.42, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 30: "Ik zal de gevangenis der tenten Jakobs wenden ... de stad zal op haar hoop gebouwd worden"
  'jeremia-bijbelquiz-deel-30': {
    hue: 72,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 820, sunY: 230, sunR: 70, rays: true, far: 'ridge', horizon: 470 }),
      path('M 500 480 C 580 410 680 380 820 378 C 960 380 1060 410 1140 480 Z', c.p.mid),
      hillCity(c.rand, 820, 392, 0.9, 170, c.p.near, c.p.accent),
      trail(560, H, 780, 392, 80, '#FFFFFF', { opacity: 0.3 }),
      fig(560, 548, 1.3, c.p.fore, 'walk'),
      fig(420, 552, 1.15, c.p.fore, 'carry'),
      fig(300, 556, 1.0, c.p.fore, 'walk'),
      fg(c, 694, 10),
    ],
  },

  // 31: "Ik zal Mijn wet in hun binnenste geven, en zal die in hun hart schrijven" - under the sun, moon and stars of His ordinance
  'jeremia-bijbelquiz-deel-31': {
    hue: 74,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1160, sunY: 210, sunR: 44, stars: 70, far: 'ridge', horizon: 470 }),
      c.soft(704, 330, 220, 0.5),
      heartShape(704, 320, 0.95, c.p.accent),
      fig(560, 544, 1.35, c.p.fore, 'raise'),
      fig(860, 544, 1.3, c.p.fore, 'stand'),
      fig(760, 548, 0.85, c.p.fore, 'raise'),
      fg(c, 692, 12),
    ],
  },

  // 32: Jeremia buys the field at Anathoth during the siege; the sealed deed goes into an earthen vessel
  'jeremia-bijbelquiz-deel-32': {
    hue: 76,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 240, far: 'ridge', horizon: 470 }),
      path('M 60 530 C 180 450 360 412 500 416 C 600 420 680 470 740 530 Z', c.p.mid),
      wheat(260, 470, 0.32, c.p.crop, 7),
      wheat(400, 452, 0.3, c.p.crop, 7),
      wheat(520, 444, 0.28, c.p.crop, 5),
      rect(170, 444, 16, 30, c.p.near, { rx: 4 }),
      rect(580, 414, 16, 30, c.p.near, { rx: 4 }),
      fig(700, 544, 1.35, c.p.fore, 'reach'),
      jar(900, 552, 1.25, c.p.near),
      rotate(-80, 900, 390, scroll(900, 390, 0.5, c.p.accent)),
      coin(1050, 540, 0.9, c.p.near),
      coin(1080, 546, 0.9, c.p.near),
      coin(1064, 526, 0.9, c.p.near),
      fg(c, 692, 12),
    ],
  },

  // 33: "Ik zal David een Spruit der gerechtigheid doen uitspruiten" - a green shoot from the felled stump at sunrise
  'jeremia-bijbelquiz-deel-33': {
    hue: 78,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 196, sunR: 70, rays: true, far: 'dunes', horizon: 470 }),
      citySkyline(c.rand, 1120, 470, 0.7, c.p.far, 5, { opacity: 0.8 }),
      c.soft(704, 420, 160, 0.35),
      cutStump(704, 548, 1.6, c.p.near),
      shoot(704, 432, 1.45, c.p.accent, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 34: the slaves set free by covenant are taken back into bondage - "Ik roep u een vrijheid uit, zegt de HEERE, tot het zwaard"
  'jeremia-bijbelquiz-deel-34': {
    hue: 80,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 330, sunR: 60, far: 'ridge', horizon: 470 }),
      cityWall(260, 520, 1.0, c.p.near, 260),
      fig(440, 544, 1.35, c.p.fore, 'reach'),
      chainAlong(510, 456, 690, 474, 0.9, c.p.accent, 16),
      chainAlong(746, 474, 860, 480, 0.9, c.p.accent, 10),
      fig(720, 548, 1.2, c.p.fore, 'carry'),
      fig(890, 550, 1.1, c.p.fore, 'carry'),
      trail(1060, H, 1200, 470, 90, '#FFFFFF', { opacity: 0.25 }),
      fg(c, 694, 10),
    ],
  },

  // 35: the Rechabites, who live in tents, refuse the wine set before them - "Wij zullen geen wijn drinken"
  'jeremia-bijbelquiz-deel-35': {
    hue: 82,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 236, far: 'dunes', horizon: 470 }),
      campTent(1070, 496, 1.15, c.p.near, c.p.light),
      campTent(1214, 486, 0.66, c.p.near),
      table(640, 544, 260, 1.2, c.p.near),
      goblet(580, 470, 1.0, c.p.accent),
      goblet(650, 470, 1.0, c.p.accent),
      jar(720, 472, 0.55, c.p.accent),
      fig(880, 544, 1.35, c.p.fore, 'bless', { flip: true }),
      fig(380, 544, 1.25, c.p.fore, 'reach'),
      fg(c, 692, 12),
    ],
  },

  // 36: King Jojakim cuts the scroll with a penknife and casts it into the fire of the brazier in his winter house
  'jeremia-bijbelquiz-deel-36': {
    hue: 84,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 510 }),
      rect(150, 250, 1100, 18, c.p.near),
      columns(260, 512, 1.3, c.p.near, 2),
      c.soft(704, 420, 230, 0.55, c.p.accent),
      throne(1000, 520, 1.1, c.p.near),
      person(1000, 500, 1.15, c.p.fore, 'sit'),
      crown(1000, 372, 0.26, c.p.near),
      brazier(704, 548, 1.0, c.p.near),
      fireOn(704, 456, 0.62, c.p.accent, c.p.glow, c.p.light),
      rotate(30, 760, 410, rect(744, 392, 34, 22, c.p.light, { opacity: 0.85 })),
      rotate(-20, 650, 380, rect(636, 366, 28, 18, c.p.light, { opacity: 0.7 })),
      fig(450, 544, 1.3, c.p.fore, 'reach'),
      rect(520, 448, 70, 30, c.p.light, { rx: 4 }),
      fg(c, 692, 12),
    ],
  },

  // 37: Jeremia in the prison house; the king commands a loaf of bread daily out of the bakers' street
  'jeremia-bijbelquiz-deel-37': {
    hue: 86,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 200, far: 'none', ground: 'flat', horizon: 512 }),
      rect(300, 300, 808, 230, c.p.near),
      shafts(820, 300, 80, 230, c.p.glow, 2),
      person(660, 522, 1.25, c.p.fore, 'sit'),
      prisonBars(680, 524, 2.0, c.p.fore),
      rect(536, 524, 290, 14, c.p.fore),
      fig(940, 548, 1.35, c.p.fore, 'reach', { flip: true }),
      loaf(868, 462, 1.1, c.p.accent),
      fg(c, 694, 10),
    ],
  },

  // 38: Jeremia let down into the miry pit and drawn up again with cords and old rags by Ebed-melech
  'jeremia-bijbelquiz-deel-38': {
    hue: 88,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 236, far: 'ridge', horizon: 470 }),
      ellipse(704, 520, 300, 60, c.p.mid),
      ellipse(704, 512, 120, 30, c.p.fore),
      fig(704, 586, 1.2, c.p.fore, 'raise'),
      path('M 584 512 C 600 540 650 548 704 548 C 758 548 808 540 824 512 C 880 530 940 560 1004 580 L 1004 620 L 404 620 L 404 580 C 468 560 528 530 584 512 Z', c.p.mid),
      stroke('M 665 412 Q 560 430 486 452', c.p.accent, 5),
      stroke('M 743 412 Q 850 430 924 452', c.p.accent, 5),
      fig(440, 540, 1.3, c.p.fore, 'reach'),
      fig(968, 540, 1.3, c.p.fore, 'reach', { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 39: Jerusalem taken: the wall broken through, the city burnt, Zedekia fleeing by night
  'jeremia-bijbelquiz-deel-39': {
    hue: 90,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 470 }),
      smokeColumn(c.rand, 760, 330, 1.8, c.p.fore),
      c.soft(800, 380, 260, 0.45, c.p.accent),
      citySkyline(c.rand, 800, 430, 0.9, c.p.near, 7),
      cityWall(620, 470, 0.95, c.p.near, 260),
      cityWall(1010, 470, 0.95, c.p.near, 200),
      fireBed(c.rand, 780, 392, 0.75, c.p.accent, 9),
      path('M 760 470 L 790 410 L 820 440 L 846 404 L 880 470 Z', c.p.mid),
      fig(330, 544, 1.3, c.p.fore, 'walk', { flip: true }),
      fig(440, 548, 1.1, c.p.fore, 'walk', { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 40: Nebuzaradan loosens Jeremia's chains at Rama and sends him away with food and a gift; he goes to Gedalia at Mizpa
  'jeremia-bijbelquiz-deel-40': {
    hue: 92,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 280, sunR: 66, rays: true, far: 'ridge', horizon: 470 }),
      citySkyline(c.rand, 1120, 452, 0.55, c.p.far, 4),
      fig(380, 544, 1.25, c.p.fore, 'bless'),
      chainAlong(500, 556, 660, 552, 1.3, c.p.fore, -10),
      fig(800, 544, 1.35, c.p.fore, 'walk'),
      loaf(786, 340, 0.6, c.p.accent),
      loaf(816, 338, 0.55, c.p.accent),
      basket(800, 374, 1.2, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 41: Ismael rises up at the meal in Mizpa and slays Gedalia - the overturned cup, the fallen guest, the killer fleeing
  'jeremia-bijbelquiz-deel-41': {
    hue: 94,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 360, sunR: 56, far: 'dunes', horizon: 470 }),
      houseBlock(c.rand, 560, 520, 1.3, c.p.near),
      table(700, 548, 300, 1.2, c.p.near),
      loaf(620, 474, 0.8, c.p.near),
      rotate(-100, 770, 470, goblet(770, 470, 1.3, c.p.accent)),
      person(620, 556, 1.1, c.p.fore, 'fallen'),
      fig(1040, 544, 1.3, c.p.fore, 'walk'),
      rotate(30, 1100, 430, rect(1096, 330, 8, 100, c.p.fore)),
      fg(c, 692, 12),
    ],
  },

  // 42: "Indien gij in dit land zult blijven, zo zal Ik u bouwen ... en Ik zal u planten" - not down the road to Egypt
  'jeremia-bijbelquiz-deel-42': {
    hue: 96,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, far: 'dunes', horizon: 470 }),
      pyramids(1170, 470, 0.8, c.p.far, { opacity: 0.85 }),
      trail(860, H, 1120, 470, 120, '#FFFFFF', { opacity: 0.3 }),
      tree(230, 500, 1.05, c.p.near),
      tree(350, 490, 0.8, c.p.near, { opacity: 0.85 }),
      kneel(480, 548, 1.3, c.p.fore, 'plant'),
      shoot(548, 552, 0.95, c.p.accent, c.p.accent),
      crowd(c.rand, 900, 548, 1.0, c.p.near, 4, 200),
      fg(c, 692, 12),
    ],
  },

  // 43: at Tahpanhes Jeremia hides great stones in the brickwork before Pharaoh's house - Nebukadnezar will set his throne on them
  'jeremia-bijbelquiz-deel-43': {
    hue: 98,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 240, far: 'dunes', ground: 'flat', horizon: 500 }),
      columns(380, 500, 1.4, c.p.near, 4),
      rect(250, 340, 260, 24, c.p.near),
      palm(1150, 506, 1.0, c.p.near),
      brickWall(c.rand, 520, 552, 1.0, c.p.mid, 2, 12),
      throneSeat(806, 520, 0.56, c.p.accent, undefined, { opacity: 0.8 }),
      ellipse(770, 536, 40, 20, c.p.fore),
      ellipse(846, 540, 36, 18, c.p.fore),
      kneel(640, 552, 1.25, c.p.fore, 'plant'),
      fg(c, 694, 10),
    ],
  },

  // 44: the women in Egypt burn incense to the queen of heaven and bake cakes to her - Jeremia's last warning
  'jeremia-bijbelquiz-deel-44': {
    hue: 100,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 380, sunY: 210, sunR: 40, far: 'dunes', horizon: 470 }),
      star4(1000, 220, 34, '#FFFFFF'),
      c.soft(1000, 220, 90, 0.5),
      pyramids(1230, 470, 0.7, c.p.far, { opacity: 0.8 }),
      smokeColumn(c.rand, 720, 410, 1.0, c.p.light),
      hornedAltar(720, 540, 1.0, c.p.near),
      flame(720, 462, 0.5, c.p.accent),
      kneel(560, 548, 1.2, c.p.fore, 'up'),
      kneel(880, 548, 1.15, c.p.fore, 'up', { flip: true }),
      fig(300, 544, 1.3, c.p.fore, 'reach'),
      fg(c, 692, 12),
    ],
  },

  // 45: the word to Baruch, the scribe - "Zoekt gij voor u grote dingen? Zoekt ze niet"
  'jeremia-bijbelquiz-deel-45': {
    hue: 102,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 330, sunR: 56, far: 'none', ground: 'flat', horizon: 510 }),
      tower(1040, 512, 1.8, c.p.far, { opacity: 0.6 }),
      columns(300, 512, 1.1, c.p.near, 2),
      kneel(560, 548, 1.3, c.p.fore, 'forward'),
      table(720, 548, 190, 1.0, c.p.near),
      scroll(730, 474, 0.62, c.p.light),
      quillPen(616, 476, 0.55, c.p.accent),
      lamp(800, 486, 0.6, c.p.near, c.p.light),
      fg(c, 694, 10),
    ],
  },

  // 46: Pharaoh Necho's army broken at Carchemish by the Euphrates - "Maakt het schild en de rondas gereed"
  'jeremia-bijbelquiz-deel-46': {
    hue: 104,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'none', ground: 'water', horizon: 456 }),
      path(`M 107 520 C 400 490 900 486 1310 500 L 1310 ${H} L 107 ${H} Z`, c.p.mid),
      horse(500, 548, 1.4, c.p.fore),
      chariot(740, 548, 1.6, c.p.fore),
      person(764, 458, 1.05, c.p.fore, 'stand'),
      rotate(-40, 1110, 540, chariot(1110, 550, 1.05, c.p.near)),
      roundShield(960, 556, 1.05, c.p.accent, c.p.light),
      roundShield(1220, 560, 0.6, c.p.near),
      fg(c, 694, 10),
    ],
  },

  // 47: against the Philistines - waters rising out of the north; "O gij zwaard des HEEREN, hoe lang zult gij niet rusten?"
  'jeremia-bijbelquiz-deel-47': {
    hue: 106,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'none', ground: 'swell', horizon: 470 }),
      c.soft(640, 320, 220, 0.4),
      rotate(200, 640, 330, sword(640, 330 + 107, 1.4, c.p.accent)),
      path('M 960 480 L 1310 480 L 1310 560 L 900 560 Z', c.p.mid),
      citySkyline(c.rand, 1110, 482, 0.8, c.p.near, 5),
      cityWall(1110, 500, 0.8, c.p.near, 300),
      fg(c, 692, 12),
    ],
  },

  // 48: "Moab is gerust geweest van zijn jeugd af ... Ik zal zijn vaten ledig maken en hun flessen verbreken" - and Kemosh fallen
  'jeremia-bijbelquiz-deel-48': {
    hue: 108,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 340, sunR: 60, far: 'ridge', horizon: 470 }),
      vineRow(c.rand, 220, 506, 1.25, c.p.near, 3),
      grapes(230, 480, 0.7, c.p.near),
      grapes(308, 482, 0.7, c.p.near),
      grapes(386, 480, 0.7, c.p.near),
      rotate(84, 1060, 520, idol(1060, 520, 0.6, c.p.near)),
      jar(520, 548, 1.0, c.p.near),
      jarFallen(700, 556, 0.95, c.p.accent),
      shards(c.rand, 790, 556, 1.1, c.p.accent, 6, 120),
      fg(c, 692, 12),
    ],
  },

  // 49: Edom - "Al maakte gij uw nest zo hoog als een arend, Ik zal u vandaar nederstorten"
  'jeremia-bijbelquiz-deel-49': {
    hue: 110,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 230, far: 'dunes', horizon: 470 }),
      path('M 600 540 L 640 420 L 690 380 L 700 320 L 760 300 L 840 306 L 880 350 L 900 420 L 960 470 L 1000 540 Z', c.p.mid),
      rect(712, 420, 34, 56, c.p.near, { rx: 4 }),
      rect(800, 400, 30, 50, c.p.near, { rx: 4 }),
      rect(860, 460, 34, 60, c.p.near, { rx: 4 }),
      ellipse(790, 306, 50, 12, c.p.near),
      eagle(790, 300, 0.75, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 50: "Verkondigt het onder de heidenen, en heft een banier op ... Babel is ingenomen, Bel is beschaamd" - the flock goes out
  'jeremia-bijbelquiz-deel-50': {
    hue: 112,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 260, sunR: 66, rays: true, far: 'dunes', horizon: 470 }),
      ziggurat(1100, 476, 1.5, c.p.near, 5),
      path('M 1070 316 L 1090 360 L 1076 400 L 1100 476 L 1110 476 L 1088 400 L 1102 360 Z', c.p.light, { opacity: 0.5 }),
      path('M 107 520 C 220 460 360 430 500 440 L 500 540 L 107 540 Z', c.p.mid),
      banner(380, 448, 1.3, c.p.fore, c.p.accent),
      lamb(640, 540, 0.85, c.p.light, c.p.fore, { flip: true }),
      lamb(760, 532, 0.75, c.p.light, c.p.fore, { flip: true }),
      lamb(870, 522, 0.65, c.p.light, c.p.fore, { flip: true, opacity: 0.9 }),
      lamb(560, 548, 0.9, c.p.light, c.p.fore, { flip: true }),
      fg(c, 692, 12),
    ],
  },

  // 51: Seraja reads the scroll in Babylon, binds a stone to it and casts it into the Euphrates - "Alzo zal Babel zinken"
  'jeremia-bijbelquiz-deel-51': {
    hue: 114,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 236, far: 'none', ground: 'water', horizon: 456 }),
      ziggurat(1100, 458, 0.9, c.p.far, 4, { opacity: 0.75 }),
      cityWall(1100, 460, 0.6, c.p.far, 360, { opacity: 0.75 }),
      path(`M 107 520 C 260 500 420 504 520 530 C 560 560 580 640 600 ${H} L 107 ${H} Z`, c.p.mid),
      fig(400, 530, 1.35, c.p.fore, 'reach'),
      stroke('M 500 430 Q 640 330 760 400', '#FFFFFF', 3, { opacity: 0.5 }),
      rotate(-30, 800, 420, scroll(800, 420, 0.7, c.p.accent)),
      circle(840, 456, 22, c.p.fore),
      ellipse(830, 520, 70, 10, '#FFFFFF', { opacity: 0.55 }),
      ellipse(830, 520, 120, 18, '#FFFFFF', { opacity: 0.3 }),
      fg(c, 694, 10),
    ],
  },

  // 52: Jerusalem's end - the bronze pillars of the temple broken in pieces and the people carried away to Babylon
  'jeremia-bijbelquiz-deel-52': {
    hue: 116,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 340, sunR: 60, far: 'ridge', horizon: 470 }),
      smokeColumn(c.rand, 300, 340, 1.3, c.p.fore),
      bronzePillar(260, 530, 1.0, c.p.accent, true),
      bronzePillar(470, 530, 0.95, c.p.near),
      crowd(c.rand, 840, 540, 1.05, c.p.fore, 5, 320),
      spear(1080, 540, 210, c.p.fore),
      fig(1080, 540, 1.25, c.p.fore, 'walk'),
      fg(c, 692, 12),
    ],
  },
};
