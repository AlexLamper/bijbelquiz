/**
 * One composed scene per quiz.
 *
 * Each entry names the hue and mood the backdrop is built from and then places
 * motifs on it. The scene matches what that quiz actually asks about - the
 * chapter its questions cite - so Marcus Deel 12 is the widow's two coins and
 * Handelingen Deel 19 is the scrolls burning at Ephesus, not a generic
 * "New Testament" cover.
 *
 * Series share a base hue and drift a few degrees per part, so ten Ester
 * covers read as one set on the quiz grid while staying individually
 * recognisable.
 */

import {
  H,
  W,
  angel,
  banner,
  basket,
  bird,
  boat,
  brickWall,
  chainLinks,
  chariot,
  circle,
  cityWall,
  citySkyline,
  cloudBank,
  coin,
  colossus,
  columns,
  crescent,
  cross,
  crowd,
  crown,
  cypress,
  donkey,
  dove,
  dunes,
  ellipse,
  fireBed,
  fish,
  flame,
  forkedRoad,
  frog,
  gateArch,
  goat,
  goblet,
  grapes,
  halo,
  hand,
  horse,
  houseBlock,
  hsl,
  lamp,
  lion,
  loaf,
  locust,
  mat,
  ox,
  palm,
  path,
  person,
  prisonBars,
  pyramids,
  ram,
  rays,
  rect,
  reeds,
  ridge,
  ring,
  river,
  rngFor,
  rotate,
  roundStone,
  sandal,
  scepter,
  scroll,
  serpent,
  shafts,
  sheaf,
  sheet,
  ship,
  shrub,
  smokeColumn,
  stars,
  streaks,
  stump,
  sunDisc,
  swarm,
  swell,
  tablets,
  templeFront,
  tent,
  throne,
  tombMound,
  tongues,
  tower,
  trail,
  tree,
  tri,
  vineRow,
  water,
  well,
  wheat,
  window as windowFrame,
  witheredPlant,
  ziggurat,
} from './quiz-cover-primitives.mjs';

export type Mood = 'day' | 'dawn' | 'dusk' | 'night' | 'storm' | 'warm' | 'gold';

export type Palette = {
  sky: [string, string, string];
  glow: string;
  light: string;
  accent: string;
  accentDeep: string;
  far: string;
  mid: string;
  near: string;
  fore: string;
  water: string;
  crest: string;
  crop: string;
};

export type C = {
  rand: () => number;
  hue: number;
  mood: Mood;
  p: Palette;
  defs: string[];
  id: (name: string) => string;
  /** Soft radial light. A flat circle at low opacity shows its edge; this does not. */
  soft: (x: number, y: number, r: number, opacity?: number, color?: string) => string;
  /** Horizontal wash across the frame - weather rolling in, not a rectangle. */
  veil: (from: number, to: number, color: string, opacity: number) => string;
};

// [L, S] pairs. Saturation stays under 0.42 everywhere: the covers sit behind
// UI type, so they have to stay quiet.
const MOODS: Record<
  Mood,
  {
    sky: [number, number][];
    warm: number;
    far: [number, number];
    mid: [number, number];
    near: [number, number];
    fore: [number, number];
    glow: [number, number, number];
    light: [number, number, number];
    accent: [number, number, number];
    stars: number;
  }
> = {
  day: {
    sky: [[0.62, 0.26], [0.74, 0.22], [0.87, 0.16]],
    warm: 30,
    far: [0.58, 0.112],
    mid: [0.44, 0.136],
    near: [0.24, 0.161],
    fore: [0.15, 0.186],
    glow: [44, 0.4, 0.88],
    light: [44, 0.34, 0.9],
    accent: [22, 0.38, 0.58],
    stars: 0,
  },
  dawn: {
    sky: [[0.44, 0.28], [0.63, 0.28], [0.84, 0.32]],
    warm: 40,
    far: [0.52, 0.124],
    mid: [0.4, 0.149],
    near: [0.21, 0.174],
    fore: [0.13, 0.198],
    glow: [38, 0.48, 0.86],
    light: [40, 0.42, 0.88],
    accent: [18, 0.42, 0.6],
    stars: 14,
  },
  dusk: {
    sky: [[0.3, 0.3], [0.48, 0.3], [0.72, 0.36]],
    warm: 34,
    far: [0.44, 0.136],
    mid: [0.33, 0.161],
    near: [0.17, 0.186],
    fore: [0.1, 0.211],
    glow: [30, 0.5, 0.8],
    light: [36, 0.44, 0.84],
    accent: [16, 0.44, 0.56],
    stars: 26,
  },
  night: {
    sky: [[0.15, 0.32], [0.24, 0.3], [0.4, 0.24]],
    warm: 16,
    far: [0.3, 0.149],
    mid: [0.24, 0.161],
    near: [0.12, 0.174],
    fore: [0.07, 0.186],
    glow: [46, 0.3, 0.76],
    light: [46, 0.26, 0.86],
    accent: [38, 0.4, 0.62],
    stars: 70,
  },
  storm: {
    sky: [[0.31, 0.13], [0.44, 0.12], [0.6, 0.1]],
    warm: 12,
    far: [0.42, 0.08],
    mid: [0.33, 0.081],
    near: [0.19, 0.093],
    fore: [0.12, 0.112],
    glow: [44, 0.2, 0.76],
    light: [44, 0.18, 0.84],
    accent: [30, 0.3, 0.58],
    stars: 0,
  },
  warm: {
    sky: [[0.58, 0.3], [0.73, 0.3], [0.88, 0.26]],
    warm: 26,
    far: [0.6, 0.149],
    mid: [0.46, 0.174],
    near: [0.26, 0.198],
    fore: [0.16, 0.223],
    glow: [42, 0.46, 0.9],
    light: [42, 0.4, 0.92],
    accent: [20, 0.4, 0.56],
    stars: 0,
  },
  gold: {
    sky: [[0.42, 0.3], [0.6, 0.34], [0.82, 0.38]],
    warm: 44,
    far: [0.5, 0.149],
    mid: [0.38, 0.174],
    near: [0.2, 0.198],
    fore: [0.12, 0.211],
    glow: [40, 0.54, 0.86],
    light: [42, 0.46, 0.9],
    accent: [24, 0.46, 0.6],
    stars: 8,
  },
};

/** Shortest-path hue interpolation. */
function mixHue(a: number, b: number, t: number): number {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

/** Land hue family per mood, and how warm the sky gets toward the horizon. */
const LAND: Record<Mood, { anchor: number; warmth: number }> = {
  day: { anchor: 152, warmth: 0.55 },
  dawn: { anchor: 168, warmth: 0.8 },
  dusk: { anchor: 256, warmth: 0.85 },
  night: { anchor: 244, warmth: 0.3 },
  storm: { anchor: 202, warmth: 0.3 },
  warm: { anchor: 30, warmth: 0.7 },
  gold: { anchor: 42, warmth: 0.95 },
};

export function paletteFor(hue: number, mood: Mood): Palette {
  const m = MOODS[mood];
  const { anchor, warmth } = LAND[mood];
  const sky = m.sky.map((pair, i) =>
    hsl(mixHue(hue, 38, [0, 0.28, 0.62][i] * warmth), pair[1], pair[0]),
  ) as [string, string, string];

  // Land drifts a little with the scene hue so a series varies, but stays in
  // the mood's family - and is forced apart from the sky if the two are close.
  let land = anchor + ((((hue % 30) + 30) % 30) - 15) * 0.7;
  if (Math.abs(((land - hue + 540) % 360) - 180) < 42) land += 52;

  return {
    sky,
    glow: hsl(m.glow[0], m.glow[1], m.glow[2]),
    light: hsl(m.light[0], m.light[1], m.light[2]),
    accent: hsl(m.accent[0], m.accent[1], m.accent[2]),
    accentDeep: hsl(m.accent[0] - 6, m.accent[1] + 0.04, m.accent[2] - 0.16),
    far: hsl(land + 14, m.far[1], m.far[0]),
    mid: hsl(land + 6, m.mid[1], m.mid[0]),
    near: hsl(land - 5, m.near[1], m.near[0]),
    fore: hsl(land - 14, m.fore[1], m.fore[0]),
    water: hsl(mixHue(hue, 200, 0.5), m.mid[1] + 0.06, m.mid[0] + 0.08),
    crest: hsl(mixHue(hue, 200, 0.5) + 16, m.far[1], m.far[0] + 0.24),
    crop: hsl(mixHue(hue, 44, 0.88), 0.34, 0.52),
  };
}

// ── backdrop ───────────────────────────────────────────────────────────────

export type BaseOpts = {
  horizon?: number;
  far?: 'ridge' | 'dunes' | 'none';
  ground?: 'dunes' | 'water' | 'swell' | 'flat' | 'none';
  sun?: 'sun' | 'moon' | 'glow' | 'none';
  sunX?: number;
  sunY?: number;
  sunR?: number;
  rays?: boolean;
  stars?: number;
  clouds?: number;
};

export const GROUND = 468;

/** Sky, light source and the layers behind the motifs. */
export function base(c: C, o: BaseOpts = {}): string {
  const gy = o.horizon ?? GROUND;
  const skyId = c.id('sky');
  const glowId = c.id('glow');
  c.defs.push(
    `<linearGradient id="${skyId}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${c.p.sky[0]}"/>` +
      `<stop offset="0.55" stop-color="${c.p.sky[1]}"/>` +
      `<stop offset="1" stop-color="${c.p.sky[2]}"/></linearGradient>`,
    `<radialGradient id="${glowId}" cx="0.5" cy="0.5" r="0.5">` +
      `<stop offset="0" stop-color="${c.p.glow}" stop-opacity="0.75"/>` +
      `<stop offset="1" stop-color="${c.p.glow}" stop-opacity="0"/></radialGradient>`,
  );

  const out = [rect(0, 0, W, H, `url(#${skyId})`)];

  const sx = o.sunX ?? (c.rand() > 0.42 ? 880 + c.rand() * 300 : 190 + c.rand() * 260);
  const sy = o.sunY ?? 214 + c.rand() * 90;
  const sr = o.sunR ?? 58 + c.rand() * 34;

  if (o.stars ?? MOODS[c.mood].stars) out.push(stars(c.rand, o.stars ?? MOODS[c.mood].stars, c.p.light, Math.min(gy - 150, 330)));
  if (o.sun !== 'none') out.push(circle(sx, sy, sr * 4.4, `url(#${glowId})`));
  if (o.rays) out.push(rays(c.rand, sx, sy, 330, c.p.glow, 10, { opacity: 0.085 }));
  if (o.sun === 'sun' || o.sun === undefined) out.push(sunDisc(sx, sy, sr, c.p.light));
  if (o.sun === 'moon') out.push(crescent(sx, sy, sr * 0.72, c.p.light));

  if (o.clouds) {
    for (let i = 0; i < o.clouds; i += 1) {
      out.push(cloudBank(c.rand, 150 + c.rand() * (W - 300), 150 + c.rand() * 130, 0.7 + c.rand() * 0.6, c.p.light, { opacity: 0.16 }));
    }
  }

  if ((o.far ?? 'ridge') === 'ridge') out.push(ridge(c.rand, gy - 26, 132, c.p.far, { opacity: 0.85 }));
  else if (o.far === 'dunes') out.push(dunes(c.rand, gy - 34, 46, c.p.far, { opacity: 0.85 }));

  const ground = o.ground ?? 'dunes';
  if (ground === 'dunes') out.push(dunes(c.rand, gy, 30, c.p.mid));
  else if (ground === 'flat') out.push(rect(0, gy, W, H - gy, c.p.mid));
  else if (ground === 'water') out.push(water(c.rand, gy, c.p.water, c.p.crest, 4));
  else if (ground === 'swell') out.push(swell(c.rand, gy + 26, c.p.water));

  return out.join('');
}

/** The darkest band, drawn last so motifs sit inside the scene. */
export function fg(c: C, y = 676, amp = 26): string {
  return dunes(c.rand, y - 74, 20, c.p.near, { opacity: 0.85 }) + dunes(c.rand, y, amp, c.p.fore);
}

// ── scenes ─────────────────────────────────────────────────────────────────

export type Scene = { hue: number; mood: Mood; draw: (c: C) => string[] };

const G = GROUND;

export const SCENES: Record<string, Scene> = {
  // ── standalone ───────────────────────────────────────────────────────────
  genesis: {
    hue: 206,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'sun', sunX: 1050, sunY: 240, sunR: 88, rays: true, ground: 'water', far: 'ridge' }),
      boat(300, G + 34, 1.25, c.p.near, true),
      stars(c.rand, 30, c.p.light, 210),
      bird(880, 214, 1.5, c.p.light, { opacity: 0.5 }),
      bird(940, 246, 1.2, c.p.light, { opacity: 0.4 }),
      fg(c, 662, 26),
      cypress(150, 612, 1.05, c.p.fore),
    ],
  },
  'algemene-bijbelkennis': {
    hue: 212,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 236, sunR: 66, rays: true, far: 'ridge' }),
      templeFront(320, G, 0.78, c.p.near),
      tent(1090, G, 0.9, c.p.near),
      palm(960, G, 0.9, c.p.near),
      crowd(c.rand, 704, G + 12, 0.72, c.p.near, 5, 210),
      fg(c),
      scroll(210, 640, 1.0, c.p.fore),
    ],
  },
  'het-boek-spreuken': {
    hue: 40,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 250, sunR: 62, far: 'dunes', horizon: 452 }),
      cityWall(1080, 452, 0.85, c.p.far, 300, { opacity: 0.9 }),
      forkedRoad(640, 452, c.p.near, { opacity: 0.85 }),
      person(640, 600, 1.25, c.p.fore, 'stand'),
      cypress(1010, 470, 0.8, c.p.mid),
      fg(c, 700, 20),
    ],
  },
  prediker: {
    hue: 30,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1040, sunY: 300, sunR: 80, rays: true, far: 'ridge', ground: 'dunes' }),
      river(G, c.p.water, { opacity: 0.85 }),
      person(330, G + 26, 1.3, c.p.near, 'sit'),
      c.soft(1040, 300, 260, 0.22),
      fg(c, 678, 24),
    ],
  },

  // ── Daniel ───────────────────────────────────────────────────────────────
  'daniel-bijbelquiz-deel-1': {
    hue: 258,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'dunes' }),
      ziggurat(1090, G, 0.72, c.p.far, 4, { opacity: 0.7 }),
      columns(360, G, 0.8, c.p.near, 3),
      person(600, G, 1.1, c.p.near, 'stand'),
      person(690, G, 1.1, c.p.near, 'stand'),
      person(775, G, 1.1, c.p.near, 'stand'),
      person(860, G, 1.1, c.p.near, 'stand'),
      basket(690, G - 4, 0.9, c.p.accent),
      goblet(560, G, 1.0, c.p.accent),
      fg(c),
    ],
  },
  'daniel-bijbelquiz-deel-2': {
    hue: 262,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 300, far: 'none', ground: 'flat', horizon: 520 }),
      shafts(704, 60, 420, 460, c.p.glow, 5),
      colossus(704, 520, 1.0, c.p.near, c.p.accent),
      person(310, 520, 1.0, c.p.near, 'raise'),
      person(1110, 520, 1.0, c.p.near, 'bow'),
      fg(c, 682, 18),
    ],
  },
  'daniel-bijbelquiz-deel-3': {
    hue: 266,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 520, stars: 0 }),
      smokeColumn(c.rand, 704, 300, 1.8, c.p.light),
      path('M 360 520 L 360 348 Q 704 186 1048 348 L 1048 520 Z', c.p.near),
      path('M 508 520 L 508 386 Q 704 286 900 386 L 900 520 Z', c.p.accentDeep),
      c.soft(704, 440, 280, 0.55, c.p.accent),
      fireBed(c.rand, 704, 522, 2.2, c.p.accent, 6),
      person(590, 512, 1.05, c.p.fore, 'stand'),
      person(704, 512, 1.05, c.p.fore, 'stand'),
      person(818, 512, 1.05, c.p.fore, 'stand'),
      angel(704, 500, 0.85, c.p.light, { opacity: 0.5 }),
      fg(c, 692, 14),
    ],
  },
  'daniel-bijbelquiz-deel-4': {
    hue: 252,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 254, far: 'ridge' }),
      stump(800, G, 1.15, c.p.near),
      ox(430, G + 20, 0.95, c.p.near),
      person(300, G + 26, 1.0, c.p.fore, 'kneel'),
      shrub(1120, G + 10, 1.0, c.p.mid),
      fg(c),
    ],
  },
  'daniel-bijbelquiz-deel-5': {
    hue: 270,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 540, stars: 0 }),
      rect(0, 0, W, 540, c.p.mid, { opacity: 0.5 }),
      columns(210, 540, 1.0, c.p.near, 2),
      rect(430, 120, 560, 420, c.p.near, { opacity: 0.55 }),
      c.soft(760, 300, 190, 0.16),
      hand(760, 320, 1.5, c.p.light),
      goblet(300, 530, 1.3, c.p.accent),
      person(1130, 540, 1.15, c.p.fore, 'bow'),
      fg(c, 688, 14),
    ],
  },
  'daniel-bijbelquiz-deel-6': {
    hue: 256,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1090, sunY: 232, sunR: 62, far: 'none', ground: 'flat', horizon: 500 }),
      path(`M -40 500 L -40 90 C 150 130 210 260 260 500 Z`, c.p.mid),
      path(`M ${W + 40} 500 L ${W + 40} 90 C ${W - 150} 140 ${W - 220} 270 ${W - 270} 500 Z`, c.p.mid),
      c.soft(720, 350, 300, 0.3),
      lion(400, 506, 1.5, c.p.fore),
      lion(1040, 500, 1.35, c.p.fore, { opacity: 0.9 }),
      person(730, 506, 1.5, c.p.fore, 'kneel'),
      fg(c, 678, 14),
    ],
  },
  'daniel-bijbelquiz-deel-7': {
    hue: 248,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 210, far: 'none', ground: 'swell', horizon: 460 }),
      lion(250, 470, 0.95, c.p.near, { opacity: 0.9 }),
      ram(560, 468, 0.9, c.p.near, { opacity: 0.85 }),
      goat(880, 466, 0.9, c.p.near, { opacity: 0.8 }),
      ox(1180, 470, 0.85, c.p.near, { opacity: 0.75 }),
      swell(c.rand, 540, c.p.fore),
    ],
  },
  'daniel-bijbelquiz-deel-8': {
    hue: 244,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 244, rays: true, far: 'ridge' }),
      river(G, c.p.water, { opacity: 0.8 }),
      ram(430, G + 6, 1.15, c.p.near),
      goat(960, G + 6, 1.15, c.p.near),
      fg(c, 674, 22),
    ],
  },
  'daniel-bijbelquiz-deel-9': {
    hue: 240,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 250, rays: true, far: 'ridge' }),
      cityWall(1040, G - 6, 0.7, c.p.far, 280, { opacity: 0.55 }),
      person(430, G + 16, 1.35, c.p.near, 'kneel'),
      angel(880, G, 1.0, c.p.light, { opacity: 0.62 }),
      fg(c),
    ],
  },
  'daniel-bijbelquiz-deel-10': {
    hue: 236,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 880, sunY: 300, sunR: 110, far: 'none', ground: 'water', horizon: 470 }),
      shafts(880, 80, 300, 420, c.p.glow, 5),
      person(880, 470, 1.5, c.p.light, 'stand', { opacity: 0.9 }),
      person(430, 476, 1.25, c.p.fore, 'fallen'),
      reeds(c.rand, 210, 480, 1.0, c.p.fore, 8),
      fg(c, 686, 16),
    ],
  },
  'daniel-bijbelquiz-deel-11': {
    hue: 232,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 236, far: 'ridge' }),
      banner(300, G, 1.0, c.p.near, c.p.accent),
      banner(1108, G, 1.0, c.p.near, c.p.accentDeep),
      crowd(c.rand, 420, G + 10, 0.7, c.p.near, 5, 200),
      crowd(c.rand, 990, G + 10, 0.7, c.p.near, 5, 200),
      horse(704, G + 16, 0.8, c.p.mid, { opacity: 0.6 }),
      fg(c),
    ],
  },
  'daniel-bijbelquiz-deel-12': {
    hue: 268,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 110, far: 'ridge' }),
      angel(704, G, 1.5, c.p.light, { opacity: 0.85 }),
      c.soft(704, 300, 200, 0.12),
      person(330, G + 10, 0.9, c.p.near, 'raise'),
      person(1090, G + 10, 0.9, c.p.near, 'raise'),
      fg(c, 680, 18),
    ],
  },

  // ── Ester ────────────────────────────────────────────────────────────────
  'ester-bijbelquiz-deel-1': {
    hue: 322,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(220, 512, 1.1, c.p.near, 3),
      columns(1180, 512, 1.1, c.p.near, 2),
      rect(400, 440, 620, 22, c.p.near),
      goblet(500, 440, 1.2, c.p.accent),
      goblet(700, 440, 1.2, c.p.accent),
      goblet(900, 440, 1.2, c.p.accent),
      person(620, 512, 1.05, c.p.fore, 'sit'),
      person(830, 512, 1.05, c.p.fore, 'stand'),
      fg(c, 684, 16),
    ],
  },
  'ester-bijbelquiz-deel-2': {
    hue: 326,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 280, rays: true, far: 'none', ground: 'flat', horizon: 520 }),
      columns(250, 520, 1.0, c.p.near, 2),
      columns(1160, 520, 1.0, c.p.near, 2),
      person(704, 520, 1.5, c.p.near, 'stand'),
      crown(704, 336, 1.0, c.p.accent),
      crowd(c.rand, 480, 522, 0.62, c.p.mid, 3, 120),
      crowd(c.rand, 930, 522, 0.62, c.p.mid, 3, 120),
      fg(c, 686, 14),
    ],
  },
  'ester-bijbelquiz-deel-3': {
    hue: 316,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 380, sunY: 260, far: 'none', ground: 'flat', horizon: 516 }),
      throne(1060, 516, 0.9, c.p.near),
      person(1060, 516, 1.0, c.p.fore, 'sit'),
      person(560, 516, 1.35, c.p.near, 'point'),
      ring(430, 300, 1.5, c.p.accent),
      scroll(760, 420, 1.1, c.p.accentDeep),
      fg(c, 686, 14),
    ],
  },
  'ester-bijbelquiz-deel-4': {
    hue: 312,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 240, sunY: 262, far: 'none', ground: 'flat', horizon: 508 }),
      gateArch(980, 508, 1.15, c.p.near),
      person(440, 508, 1.35, c.p.fore, 'kneel'),
      person(700, 508, 1.1, c.p.near, 'walk'),
      smokeColumn(c.rand, 440, 400, 1.0, c.p.light),
      fg(c, 682, 16),
    ],
  },
  'ester-bijbelquiz-deel-5': {
    hue: 330,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 950, sunY: 290, rays: true, far: 'none', ground: 'flat', horizon: 516 }),
      throne(950, 516, 1.0, c.p.near),
      person(950, 516, 1.05, c.p.fore, 'sit'),
      scepter(870, 400, 1.2, c.p.accent),
      person(470, 516, 1.3, c.p.near, 'stand'),
      columns(180, 516, 0.9, c.p.near, 2),
      fg(c, 684, 14),
    ],
  },
  'ester-bijbelquiz-deel-6': {
    hue: 336,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'dunes', horizon: 480 }),
      citySkyline(c.rand, 1000, 480, 0.85, c.p.far, 6, { opacity: 0.7 }),
      horse(680, 480, 1.25, c.p.near),
      person(660, 424, 0.85, c.p.fore, 'stand'),
      person(430, 484, 1.0, c.p.near, 'walk'),
      crowd(c.rand, 1080, 486, 0.6, c.p.mid, 4, 160),
      fg(c, 674, 20),
    ],
  },
  'ester-bijbelquiz-deel-7': {
    hue: 318,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 270, far: 'none', ground: 'flat', horizon: 514 }),
      rect(360, 450, 690, 20, c.p.near),
      person(430, 514, 1.1, c.p.near, 'sit'),
      person(704, 514, 1.25, c.p.fore, 'raise'),
      person(990, 514, 1.1, c.p.near, 'bow'),
      goblet(590, 450, 1.0, c.p.accent),
      goblet(850, 450, 1.0, c.p.accent),
      fg(c, 684, 14),
    ],
  },
  'ester-bijbelquiz-deel-8': {
    hue: 342,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, rays: true, far: 'dunes' }),
      cityWall(200, G - 10, 0.75, c.p.far, 260, { opacity: 0.6 }),
      horse(560, G + 10, 1.15, c.p.near),
      horse(880, G + 4, 1.0, c.p.near, { opacity: 0.85 }),
      scroll(560, 370, 0.9, c.p.accent),
      fg(c, 672, 22),
    ],
  },
  'ester-bijbelquiz-deel-9': {
    hue: 348,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 250, rays: true, far: 'dunes', horizon: 480 }),
      citySkyline(c.rand, 300, 480, 0.7, c.p.far, 5, { opacity: 0.55 }),
      crowd(c.rand, 704, 486, 1.0, c.p.near, 9, 620),
      banner(1150, 486, 0.9, c.p.near, c.p.accent),
      fg(c, 678, 18),
    ],
  },
  'ester-bijbelquiz-deel-10': {
    hue: 306,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 276, rays: true, far: 'none', ground: 'flat', horizon: 518 }),
      throne(520, 518, 0.95, c.p.near),
      person(520, 518, 1.0, c.p.fore, 'sit'),
      person(880, 518, 1.3, c.p.near, 'stand'),
      crown(880, 356, 0.8, c.p.accent),
      columns(1230, 518, 0.9, c.p.near, 2),
      crowd(c.rand, 200, 520, 0.6, c.p.mid, 3, 130),
      fg(c, 686, 14),
    ],
  },

  // ── Exodus ───────────────────────────────────────────────────────────────
  'exodus-bijbelquiz-deel-1': {
    hue: 24,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 244, far: 'dunes', horizon: 476 }),
      pyramids(1080, 476, 1.0, c.p.far, { opacity: 0.6 }),
      brickWall(c.rand, 300, 476, 1.0, c.p.near, 4, 7),
      person(230, 480, 1.1, c.p.fore, 'carry'),
      person(880, 480, 1.15, c.p.near, 'bow'),
      person(980, 480, 1.15, c.p.near, 'carry'),
      fg(c, 668, 22),
    ],
  },
  'exodus-bijbelquiz-deel-2': {
    hue: 30,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 250, far: 'dunes', ground: 'water', horizon: 452 }),
      reeds(c.rand, 250, 500, 1.5, c.p.near, 9),
      reeds(c.rand, 1150, 508, 1.4, c.p.near, 8),
      basket(704, 496, 1.5, c.p.accent),
      person(900, 500, 1.25, c.p.fore, 'kneel'),
      fg(c, 688, 14),
    ],
  },
  'exodus-bijbelquiz-deel-3': {
    hue: 18,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 900, sunY: 330, sunR: 120, far: 'ridge' }),
      c.soft(900, 360, 150, 0.2),
      fireBed(c.rand, 900, G, 1.9, c.p.accent, 7),
      shrub(900, G, 1.4, c.p.accentDeep, { opacity: 0.5 }),
      person(470, G + 6, 1.35, c.p.fore, 'bow'),
      fg(c),
    ],
  },
  'exodus-bijbelquiz-deel-4': {
    hue: 34,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1050, sunY: 240, far: 'ridge' }),
      person(430, G, 1.4, c.p.near, 'point'),
      serpent(830, G - 6, 1.5, c.p.accentDeep),
      trail(704, H, 1000, G, 60, c.p.mid, { opacity: 0.5 }),
      fg(c),
    ],
  },
  'exodus-bijbelquiz-deel-5': {
    hue: 20,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 980, sunY: 268, far: 'none', ground: 'flat', horizon: 512 }),
      throne(1000, 512, 0.95, c.p.near),
      person(1000, 512, 1.0, c.p.fore, 'sit'),
      person(470, 512, 1.3, c.p.near, 'raise'),
      person(570, 512, 1.2, c.p.near, 'stand'),
      sheaf(210, 514, 1.0, c.p.crop),
      columns(1290, 512, 0.9, c.p.near, 1),
      fg(c, 684, 14),
    ],
  },
  'exodus-bijbelquiz-deel-6': {
    hue: 28,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 380, sunY: 250, far: 'dunes' }),
      person(360, G, 1.4, c.p.near, 'raise'),
      crowd(c.rand, 900, G + 6, 0.95, c.p.near, 7, 420),
      fg(c, 670, 22),
    ],
  },
  'exodus-bijbelquiz-deel-7': {
    hue: 12,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 250, far: 'dunes', ground: 'water', horizon: 462 }),
      rect(0, 462, W, H - 462, c.p.accentDeep, { opacity: 0.55 }),
      reeds(c.rand, 1180, 500, 1.2, c.p.fore, 7),
      person(400, 480, 1.35, c.p.near, 'point'),
      serpent(700, 486, 1.2, c.p.fore),
      fg(c, 690, 12),
    ],
  },
  'exodus-bijbelquiz-deel-8': {
    hue: 174,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 900, sunY: 240, far: 'dunes', horizon: 470 }),
      houseBlock(c.rand, 320, 470, 0.9, c.p.near),
      swarm(c.rand, 60, 300, W - 120, 300, 1.5, c.p.fore, 44, 'frog'),
      swarm(c.rand, 60, 180, W - 120, 200, 0.9, c.p.fore, 60, 'dot'),
      fg(c, 672, 20),
    ],
  },
  'exodus-bijbelquiz-deel-9': {
    hue: 200,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'dunes', horizon: 474 }),
      streaks(c.rand, 0, 60, W * 0.72, 420, c.p.light, 70, { opacity: 0.4 }),
      fireBed(c.rand, 300, 478, 1.2, c.p.accent, 5),
      houseBlock(c.rand, 1140, 474, 0.75, c.p.near, { opacity: 0.9 }),
      c.soft(1160, 300, 150, 0.16),
      fg(c, 672, 20),
    ],
  },
  'exodus-bijbelquiz-deel-10': {
    hue: 40,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 260, sunY: 250, sunR: 60, far: 'dunes', horizon: 480 }),
      c.veil(420, W, c.p.fore, 0.55),
      swarm(c.rand, 40, 130, W - 80, 340, 1.6, c.p.fore, 90, 'locust'),
      wheat(300, 484, 0.9, c.p.crop, 4),
      fg(c, 674, 20),
    ],
  },

  // ── Habakuk ──────────────────────────────────────────────────────────────
  'habakuk-bijbelquiz-deel-1': {
    hue: 196,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 340, sunY: 240, far: 'ridge' }),
      person(300, G, 1.4, c.p.near, 'raise'),
      horse(860, G + 12, 1.0, c.p.near, { opacity: 0.9 }),
      horse(1120, G + 6, 0.9, c.p.near, { opacity: 0.7 }),
      streaks(c.rand, 700, 120, 700, 240, c.p.light, 24, { opacity: 0.2 }),
      fg(c),
    ],
  },
  'habakuk-bijbelquiz-deel-2': {
    hue: 200,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 300, sunY: 234, sunR: 58, far: 'ridge' }),
      tower(950, G, 1.25, c.p.near),
      person(950, G - 190, 0.7, c.p.fore, 'stand'),
      tablets(430, G, 1.0, c.p.accent),
      fg(c, 676, 20),
    ],
  },
  'habakuk-bijbelquiz-deel-3': {
    hue: 190,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 96, rays: true, far: 'ridge' }),
      shafts(704, 60, 520, 400, c.p.glow, 7),
      tree(330, G, 1.0, c.p.near),
      person(1020, G, 1.3, c.p.fore, 'raise'),
      fg(c),
    ],
  },

  // ── Handelingen ──────────────────────────────────────────────────────────
  'handelingen-bijbelquiz-deel-1': {
    hue: 186,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, sunR: 100, rays: true, far: 'ridge' }),
      cloudBank(c.rand, 704, 258, 1.5, c.p.light, { opacity: 0.4 }),
      person(704, 300, 1.1, c.p.light, 'raise', { opacity: 0.85 }),
      crowd(c.rand, 704, G + 10, 0.95, c.p.near, 7, 420),
      fg(c),
    ],
  },
  'handelingen-bijbelquiz-deel-2': {
    hue: 189,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      shafts(704, 40, 480, 300, c.p.glow, 7),
      tongues(c.rand, 704, 320, 1.6, c.p.accent, 7),
      crowd(c.rand, 704, 512, 1.05, c.p.near, 8, 560),
      fg(c, 682, 16),
    ],
  },
  'handelingen-bijbelquiz-deel-3': {
    hue: 191,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 240, far: 'none', ground: 'flat', horizon: 508 }),
      templeFront(950, 508, 1.0, c.p.near, 5),
      person(430, 508, 1.3, c.p.fore, 'point'),
      person(560, 508, 1.2, c.p.fore, 'raise'),
      fg(c, 682, 16),
    ],
  },
  'handelingen-bijbelquiz-deel-4': {
    hue: 194,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(180, 512, 1.0, c.p.near, 2),
      columns(1230, 512, 1.0, c.p.near, 2),
      person(560, 512, 1.3, c.p.fore, 'stand'),
      person(660, 512, 1.3, c.p.fore, 'stand'),
      crowd(c.rand, 1000, 514, 0.8, c.p.near, 5, 250),
      fg(c, 684, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-5': {
    hue: 197,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1090, sunY: 236, sunR: 56, far: 'none', ground: 'flat', horizon: 506 }),
      prisonBars(560, 506, 1.25, c.p.near, true),
      angel(880, 506, 1.05, c.p.light, { opacity: 0.75 }),
      person(400, 506, 1.1, c.p.fore, 'walk'),
      fg(c, 682, 16),
    ],
  },
  'handelingen-bijbelquiz-deel-6': {
    hue: 200,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 244, far: 'none', ground: 'flat', horizon: 506 }),
      houseBlock(c.rand, 1080, 506, 0.85, c.p.near),
      crowd(c.rand, 600, 508, 1.0, c.p.near, 7, 420),
      basket(300, 508, 1.0, c.p.accent),
      fg(c, 680, 16),
    ],
  },
  'handelingen-bijbelquiz-deel-7': {
    hue: 202,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 500, sunY: 220, sunR: 100, far: 'dunes', horizon: 478 }),
      shafts(500, 40, 300, 340, c.p.glow, 5),
      cityWall(1130, 478, 0.8, c.p.far, 300, { opacity: 0.55 }),
      person(500, 482, 1.4, c.p.near, 'raise'),
      crowd(c.rand, 950, 484, 0.85, c.p.near, 5, 260),
      circle(830, 430, 13, c.p.fore),
      circle(880, 452, 10, c.p.fore),
      fg(c, 674, 20),
    ],
  },
  'handelingen-bijbelquiz-deel-8': {
    hue: 205,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, far: 'dunes' }),
      trail(200, H, 1000, G, 130, c.p.mid, { opacity: 0.55 }),
      chariot(760, G + 10, 1.15, c.p.near),
      person(560, G + 6, 1.2, c.p.fore, 'point'),
      horse(980, G + 10, 0.85, c.p.near, { opacity: 0.85 }),
      fg(c, 670, 22),
    ],
  },
  'handelingen-bijbelquiz-deel-9': {
    hue: 208,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 900, sunY: 250, sunR: 130, rays: true, far: 'dunes' }),
      c.soft(900, 260, 190, 0.24),
      trail(520, H, 950, G, 120, c.p.mid, { opacity: 0.5 }),
      person(560, G + 14, 1.4, c.p.fore, 'fallen'),
      person(360, G + 6, 1.0, c.p.near, 'stand'),
      fg(c),
    ],
  },
  'handelingen-bijbelquiz-deel-10': {
    hue: 210,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 500, sunY: 240, far: 'none', ground: 'flat', horizon: 520 }),
      rect(0, 430, W, 16, c.p.near),
      rect(120, 446, 240, 90, c.p.near, { opacity: 0.85 }),
      sheet(760, 300, 1.25, c.p.light, { opacity: 0.85 }),
      person(430, 430, 1.0, c.p.fore, 'raise'),
      person(1130, 520, 1.0, c.p.near, 'walk'),
      fg(c, 686, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-11': {
    hue: 213,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 244, far: 'dunes', horizon: 474 }),
      citySkyline(c.rand, 980, 474, 0.9, c.p.far, 6, { opacity: 0.65 }),
      crowd(c.rand, 480, 480, 1.0, c.p.near, 8, 480),
      fg(c, 672, 20),
    ],
  },
  'handelingen-bijbelquiz-deel-12': {
    hue: 216,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 260, sunY: 232, sunR: 54, far: 'none', ground: 'flat', horizon: 508 }),
      gateArch(950, 508, 1.2, c.p.near),
      c.soft(620, 380, 150, 0.16),
      angel(620, 508, 1.05, c.p.light, { opacity: 0.7 }),
      person(470, 508, 1.15, c.p.fore, 'stand'),
      chainLinks(400, 430, 1.1, c.p.fore),
      fg(c, 684, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-13': {
    hue: 218,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 248, rays: true, ground: 'water', far: 'dunes', horizon: 460 }),
      ship(560, 470, 1.15, c.p.near, c.p.light),
      person(200, 484, 1.05, c.p.fore, 'raise'),
      bird(1000, 220, 1.4, c.p.light, { opacity: 0.45 }),
      fg(c, 692, 12),
    ],
  },
  'handelingen-bijbelquiz-deel-14': {
    hue: 221,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 240, far: 'ridge' }),
      columns(1080, G, 0.95, c.p.near, 3),
      ox(600, G + 14, 1.05, c.p.near),
      person(370, G + 4, 1.25, c.p.fore, 'raise'),
      person(460, G + 4, 1.25, c.p.fore, 'raise'),
      crowd(c.rand, 880, G + 8, 0.7, c.p.mid, 4, 180),
      fg(c),
    ],
  },
  'handelingen-bijbelquiz-deel-15': {
    hue: 224,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, far: 'none', ground: 'flat', horizon: 514 }),
      columns(140, 514, 0.95, c.p.near, 2),
      columns(1270, 514, 0.95, c.p.near, 2),
      person(470, 514, 1.05, c.p.near, 'sit'),
      person(600, 514, 1.05, c.p.near, 'sit'),
      person(808, 514, 1.05, c.p.near, 'sit'),
      person(938, 514, 1.05, c.p.near, 'sit'),
      person(704, 514, 1.25, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-16': {
    hue: 226,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 60, far: 'none', ground: 'flat', horizon: 508 }),
      prisonBars(760, 508, 1.3, c.p.near, true),
      person(500, 508, 1.15, c.p.fore, 'raise'),
      person(600, 508, 1.15, c.p.fore, 'raise'),
      chainLinks(380, 440, 1.2, c.p.fore),
      c.soft(660, 400, 140, 0.12),
      fg(c, 682, 16),
    ],
  },
  'handelingen-bijbelquiz-deel-17': {
    hue: 229,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 240, far: 'ridge' }),
      dunes(c.rand, G - 60, 24, c.p.mid, { opacity: 0.8 }),
      columns(880, G - 60, 1.1, c.p.near, 4),
      person(430, G, 1.35, c.p.fore, 'point'),
      crowd(c.rand, 620, G + 6, 0.72, c.p.near, 4, 190),
      fg(c),
    ],
  },
  'handelingen-bijbelquiz-deel-18': {
    hue: 232,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 244, far: 'dunes', horizon: 478 }),
      tent(880, 478, 1.4, c.p.near),
      person(520, 482, 1.2, c.p.fore, 'sit'),
      person(640, 482, 1.1, c.p.fore, 'sit'),
      citySkyline(c.rand, 1180, 478, 0.6, c.p.far, 4, { opacity: 0.5 }),
      fg(c, 674, 20),
    ],
  },
  'handelingen-bijbelquiz-deel-19': {
    hue: 235,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 620, sunY: 360, sunR: 110, far: 'none', ground: 'flat', horizon: 506 }),
      houseBlock(c.rand, 1120, 506, 0.8, c.p.near),
      columns(180, 506, 0.9, c.p.near, 2),
      fireBed(c.rand, 620, 506, 2.0, c.p.accent, 7),
      scroll(560, 470, 0.8, c.p.fore),
      scroll(690, 480, 0.7, c.p.fore),
      crowd(c.rand, 900, 508, 0.72, c.p.fore, 4, 190),
      fg(c, 682, 16),
    ],
  },
  'handelingen-bijbelquiz-deel-20': {
    hue: 237,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 54, far: 'none', ground: 'flat', horizon: 556 }),
      rect(600, 96, W - 600, 460, c.p.near),
      rect(578, 74, W - 578, 28, c.p.mid),
      c.soft(930, 320, 250, 0.34),
      windowFrame(930, 396, 2.2, c.p.mid, c.p.glow),
      person(1210, 300, 0.9, c.p.fore, 'fallen'),
      lamp(330, 452, 2.2, c.p.near, c.p.accent),
      person(300, 556, 1.2, c.p.fore, 'stand'),
      person(438, 556, 1.1, c.p.fore, 'raise'),
      fg(c, 700, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-21': {
    hue: 240,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 246, far: 'none', ground: 'flat', horizon: 510 }),
      templeFront(1020, 510, 0.95, c.p.near, 5),
      crowd(c.rand, 560, 512, 1.05, c.p.near, 9, 430),
      person(560, 512, 1.3, c.p.fore, 'raise'),
      fg(c, 684, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-22': {
    hue: 243,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 242, far: 'none', ground: 'flat', horizon: 524 }),
      rect(860, 300, 420, 226, c.p.near),
      path(`M 640 524 L 860 524 L 860 380 L 760 380 Z`, c.p.near),
      person(830, 392, 1.15, c.p.fore, 'raise'),
      crowd(c.rand, 400, 526, 0.9, c.p.near, 7, 400),
      fg(c, 688, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-23': {
    hue: 245,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 250, sunY: 230, sunR: 52, far: 'ridge' }),
      trail(300, H, 1120, G, 140, c.p.mid, { opacity: 0.45 }),
      horse(760, G + 16, 1.0, c.p.near),
      crowd(c.rand, 520, G + 12, 0.8, c.p.near, 5, 240),
      fg(c, 678, 18),
    ],
  },
  'handelingen-bijbelquiz-deel-24': {
    hue: 248,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 950, sunY: 254, far: 'none', ground: 'flat', horizon: 514 }),
      throne(970, 514, 0.9, c.p.near),
      person(970, 514, 0.95, c.p.fore, 'sit'),
      person(470, 514, 1.3, c.p.near, 'stand'),
      columns(180, 514, 0.95, c.p.near, 2),
      chainLinks(390, 440, 1.0, c.p.fore),
      fg(c, 684, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-25': {
    hue: 251,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 262, rays: true, far: 'none', ground: 'flat', horizon: 516 }),
      throne(500, 516, 0.85, c.p.near),
      throne(900, 516, 0.85, c.p.near),
      person(500, 516, 0.9, c.p.fore, 'sit'),
      person(900, 516, 0.9, c.p.fore, 'sit'),
      person(704, 516, 1.25, c.p.near, 'raise'),
      fg(c, 686, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-26': {
    hue: 254,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 430, sunY: 250, far: 'none', ground: 'flat', horizon: 514 }),
      columns(1150, 514, 1.1, c.p.near, 3),
      throne(880, 514, 0.9, c.p.near),
      person(880, 514, 0.95, c.p.fore, 'sit'),
      person(430, 514, 1.35, c.p.near, 'point'),
      c.soft(430, 330, 130, 0.14),
      fg(c, 684, 14),
    ],
  },
  'handelingen-bijbelquiz-deel-27': {
    hue: 256,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'none', ground: 'swell', horizon: 430 }),
      streaks(c.rand, 0, 80, W, 300, c.p.light, 40, { opacity: 0.22 }),
      rotate(-16, 620, 440, ship(620, 452, 1.0, c.p.near, c.p.light)),
      swell(c.rand, 520, c.p.mid),
      person(1010, 546, 0.9, c.p.fore, 'fallen'),
      swell(c.rand, 600, c.p.fore),
    ],
  },
  'handelingen-bijbelquiz-deel-28': {
    hue: 259,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 252, far: 'dunes', ground: 'water', horizon: 440 }),
      dunes(c.rand, 486, 26, c.p.near),
      fireBed(c.rand, 620, 500, 1.5, c.p.accent, 5),
      person(470, 500, 1.25, c.p.fore, 'point'),
      serpent(560, 430, 0.9, c.p.fore),
      crowd(c.rand, 950, 502, 0.72, c.p.near, 4, 200),
      fg(c, 680, 16),
    ],
  },

  // ── Hooglied ─────────────────────────────────────────────────────────────
  'hooglied-deel-1': {
    hue: 338,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 250, rays: true, far: 'dunes', horizon: 470 }),
      vineRow(c.rand, 190, 476, 1.0, c.p.mid, 6),
      tree(1140, 474, 1.0, c.p.near),
      person(620, 478, 1.25, c.p.near, 'walk'),
      person(700, 478, 1.2, c.p.near, 'stand'),
      fg(c, 672, 20),
    ],
  },
  'hooglied-deel-2': {
    hue: 348,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 246, far: 'dunes', horizon: 468 }),
      cityWall(704, 468, 0.72, c.p.mid, 520, { opacity: 0.85 }),
      gateArch(704, 468, 0.85, c.p.near),
      tree(430, 472, 0.9, c.p.near),
      well(980, 472, 0.9, c.p.near),
      grapes(1160, 380, 1.0, c.p.accent),
      fg(c, 674, 20),
    ],
  },

  // ── Jesaja ───────────────────────────────────────────────────────────────
  'jesaja-bijbelquiz-deel-1': {
    hue: 226,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 236, sunR: 82, rays: true, far: 'ridge' }),
      ridge(c.rand, G - 90, 190, c.p.mid, { opacity: 0.7, steps: 3 }),
      cityWall(330, G, 0.75, c.p.near, 260),
      person(1010, G + 6, 1.35, c.p.fore, 'raise'),
      fg(c),
    ],
  },
  'jesaja-bijbelquiz-deel-2': {
    hue: 232,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 110, far: 'none', ground: 'flat', horizon: 516 }),
      shafts(704, 30, 460, 380, c.p.glow, 7),
      throne(704, 480, 1.05, c.p.near),
      angel(470, 516, 1.0, c.p.light, { opacity: 0.6 }),
      angel(940, 516, 1.0, c.p.light, { opacity: 0.6 }),
      flame(1090, 430, 0.7, c.p.accent),
      person(1090, 516, 1.15, c.p.fore, 'bow'),
      fg(c, 686, 14),
    ],
  },

  // ── Jona ─────────────────────────────────────────────────────────────────
  'jona-bijbelquiz-deel-1': {
    hue: 198,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'none', ground: 'swell', horizon: 420 }),
      streaks(c.rand, 0, 60, W, 300, c.p.light, 36, { opacity: 0.2 }),
      rotate(-14, 560, 430, boat(560, 440, 1.5, c.p.near, true)),
      person(880, 470, 1.0, c.p.fore, 'fallen'),
      swell(c.rand, 520, c.p.mid),
      swell(c.rand, 596, c.p.fore),
    ],
  },
  'jona-bijbelquiz-deel-2': {
    hue: 204,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 0, far: 'none', ground: 'none' }),
      swell(c.rand, 120, c.p.near),
      fish(704, 400, 2.5, c.p.mid),
      c.soft(668, 392, 130, 0.34),
      person(668, 440, 1.05, c.p.fore, 'kneel'),
      swell(c.rand, 660, c.p.fore),
    ],
  },
  'jona-bijbelquiz-deel-3': {
    hue: 190,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'dunes', horizon: 472 }),
      cityWall(940, 472, 1.0, c.p.far, 420, { opacity: 0.75 }),
      citySkyline(c.rand, 940, 400, 0.7, c.p.far, 5, { opacity: 0.5 }),
      person(400, 478, 1.4, c.p.fore, 'point'),
      crowd(c.rand, 700, 480, 0.8, c.p.near, 6, 300),
      fg(c, 672, 20),
    ],
  },
  'jona-bijbelquiz-deel-4': {
    hue: 36,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 980, sunY: 240, sunR: 92, rays: true, far: 'dunes', horizon: 466 }),
      cityWall(1180, 466, 0.6, c.p.far, 240, { opacity: 0.45 }),
      witheredPlant(560, 470, 1.5, c.p.near),
      person(430, 472, 1.25, c.p.fore, 'sit'),
      streaks(c.rand, 700, 200, 600, 180, c.p.accent, 14, { opacity: 0.18 }),
      fg(c, 672, 20),
    ],
  },

  // ── Marcus ───────────────────────────────────────────────────────────────
  'marcus-bijbelquiz-deel-1': {
    hue: 208,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 240, rays: true, ground: 'water', far: 'dunes', horizon: 452 }),
      person(560, 500, 1.3, c.p.near, 'stand'),
      person(680, 500, 1.3, c.p.near, 'raise'),
      dove(620, 300, 1.3, c.p.light, { opacity: 0.9 }),
      shafts(620, 60, 200, 230, c.p.glow, 3),
      reeds(c.rand, 200, 508, 1.1, c.p.fore, 7),
      fg(c, 690, 12),
    ],
  },
  'marcus-bijbelquiz-deel-2': {
    hue: 212,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'none', ground: 'flat', horizon: 516 }),
      rect(420, 330, 620, 190, c.p.near),
      rect(400, 314, 660, 20, c.p.mid),
      rect(600, 300, 250, 22, c.p.sky[2], { opacity: 0.9 }),
      mat(720, 380, 1.15, c.p.accent),
      person(560, 516, 1.1, c.p.fore, 'raise'),
      person(900, 516, 1.1, c.p.fore, 'raise'),
      fg(c, 686, 14),
    ],
  },
  'marcus-bijbelquiz-deel-3': {
    hue: 216,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 242, far: 'ridge' }),
      person(400, G, 1.4, c.p.fore, 'point'),
      crowd(c.rand, 860, G + 6, 0.95, c.p.near, 9, 480),
      fg(c),
    ],
  },
  'marcus-bijbelquiz-deel-4': {
    hue: 220,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1020, sunY: 240, clouds: 3, far: 'none', ground: 'swell', horizon: 440 }),
      boat(620, 466, 1.5, c.p.near, false),
      person(620, 452, 1.15, c.p.fore, 'raise'),
      swell(c.rand, 540, c.p.mid),
      swell(c.rand, 608, c.p.fore),
    ],
  },
  'marcus-bijbelquiz-deel-5': {
    hue: 224,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 246, far: 'ridge' }),
      tombMound(1010, G, 0.9, c.p.near, c.p.fore),
      person(700, G + 6, 1.35, c.p.fore, 'point'),
      person(560, G + 6, 1.1, c.p.near, 'kneel'),
      fg(c, 674, 20),
    ],
  },
  'marcus-bijbelquiz-deel-6': {
    hue: 228,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 248, rays: true, far: 'dunes', ground: 'water', horizon: 448 }),
      dunes(c.rand, 492, 22, c.p.mid),
      loaf(560, 500, 1.3, c.p.accent),
      loaf(640, 504, 1.1, c.p.accent),
      fish(760, 492, 0.7, c.p.accentDeep),
      person(430, 500, 1.25, c.p.fore, 'raise'),
      crowd(c.rand, 1000, 504, 0.8, c.p.near, 8, 380),
      fg(c, 680, 16),
    ],
  },
  'marcus-bijbelquiz-deel-7': {
    hue: 232,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 244, far: 'dunes', horizon: 474 }),
      houseBlock(c.rand, 1120, 474, 0.8, c.p.near, { opacity: 0.85 }),
      person(560, 480, 1.35, c.p.fore, 'point'),
      person(700, 480, 1.2, c.p.near, 'stand'),
      person(430, 482, 1.0, c.p.near, 'kneel'),
      fg(c, 674, 20),
    ],
  },
  'marcus-bijbelquiz-deel-8': {
    hue: 236,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1050, sunY: 246, far: 'ridge' }),
      trail(500, H, 1060, G, 130, c.p.mid, { opacity: 0.5 }),
      person(600, G + 20, 1.3, c.p.fore, 'walk'),
      person(700, G + 16, 1.2, c.p.fore, 'stand'),
      person(790, G + 12, 1.1, c.p.near, 'stand'),
      fg(c),
    ],
  },
  'marcus-bijbelquiz-deel-9': {
    hue: 240,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 280, sunR: 150, far: 'ridge', stars: 40 }),
      c.soft(704, 300, 210, 0.22),
      rays(c.rand, 704, 320, 380, c.p.glow, 14, { opacity: 0.18 }),
      person(704, G, 1.4, c.p.light, 'raise', { opacity: 0.95 }),
      person(560, G + 8, 1.0, c.p.near, 'stand'),
      person(850, G + 8, 1.0, c.p.near, 'stand'),
      person(430, G + 16, 0.95, c.p.fore, 'kneel'),
      fg(c, 678, 18),
    ],
  },
  'marcus-bijbelquiz-deel-10': {
    hue: 244,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 242, far: 'dunes' }),
      person(600, G + 6, 1.35, c.p.fore, 'carry'),
      person(700, G + 10, 0.62, c.p.near, 'stand'),
      person(760, G + 12, 0.56, c.p.near, 'raise'),
      person(500, G + 12, 0.6, c.p.near, 'stand'),
      person(1090, G + 4, 1.15, c.p.near, 'walk'),
      fg(c, 672, 20),
    ],
  },
  'marcus-bijbelquiz-deel-11': {
    hue: 248,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, rays: true, far: 'dunes', horizon: 476 }),
      cityWall(1120, 476, 0.75, c.p.far, 300, { opacity: 0.6 }),
      donkey(620, 482, 1.2, c.p.near),
      person(600, 430, 0.85, c.p.fore, 'stand'),
      palm(330, 482, 1.0, c.p.near),
      crowd(c.rand, 900, 484, 0.7, c.p.near, 5, 240),
      fg(c, 674, 20),
    ],
  },
  'marcus-bijbelquiz-deel-12': {
    hue: 252,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 248, far: 'none', ground: 'flat', horizon: 512 }),
      columns(1080, 512, 1.05, c.p.near, 3),
      rect(600, 400, 180, 112, c.p.near),
      person(500, 512, 1.2, c.p.fore, 'point'),
      coin(660, 350, 1.5, c.p.accent),
      coin(710, 372, 1.3, c.p.accent),
      fg(c, 684, 14),
    ],
  },
  'marcus-bijbelquiz-deel-13': {
    hue: 256,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 260, sunY: 250, far: 'none', ground: 'flat', horizon: 514 }),
      templeFront(880, 514, 1.15, c.p.near, 6),
      person(400, 514, 1.3, c.p.fore, 'point'),
      person(500, 514, 1.15, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },
  'marcus-bijbelquiz-deel-14': {
    hue: 260,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1090, sunY: 234, sunR: 56, far: 'ridge' }),
      rect(300, 424, 520, 18, c.p.near),
      goblet(430, 424, 1.15, c.p.accent),
      loaf(560, 424, 1.1, c.p.accent),
      person(360, G, 1.1, c.p.near, 'sit'),
      person(700, G, 1.1, c.p.near, 'sit'),
      cypress(1000, G + 6, 0.9, c.p.near),
      person(1090, G + 10, 1.1, c.p.fore, 'kneel'),
      fg(c, 676, 20),
    ],
  },
  'marcus-bijbelquiz-deel-15': {
    hue: 264,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 5, far: 'ridge' }),
      rect(0, 0, W, H, c.p.fore, { opacity: 0.3 }),
      cross(704, G, 1.15, c.p.fore),
      cross(490, G + 10, 0.8, c.p.near, { opacity: 0.8 }),
      cross(918, G + 10, 0.8, c.p.near, { opacity: 0.8 }),
      crowd(c.rand, 300, G + 16, 0.7, c.p.fore, 4, 180),
      fg(c, 676, 20),
    ],
  },
  'marcus-bijbelquiz-deel-16': {
    hue: 200,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1040, sunY: 244, sunR: 86, rays: true, far: 'ridge' }),
      tombMound(760, G, 1.1, c.p.near, c.p.light),
      roundStone(980, G, 1.0, c.p.near),
      person(430, G + 8, 1.2, c.p.fore, 'stand'),
      person(520, G + 8, 1.15, c.p.fore, 'raise'),
      fg(c, 674, 20),
    ],
  },

  // ── Ruth ─────────────────────────────────────────────────────────────────
  'ruth-bijbelquiz-deel-1': {
    hue: 44,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1050, sunY: 258, sunR: 88, rays: true, far: 'ridge' }),
      trail(560, H, 1040, G, 120, c.p.mid, { opacity: 0.5 }),
      person(640, G + 22, 1.3, c.p.fore, 'walk'),
      person(730, G + 18, 1.25, c.p.fore, 'stand'),
      cypress(250, G + 10, 1.0, c.p.near),
      fg(c),
    ],
  },
  'ruth-bijbelquiz-deel-2': {
    hue: 48,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 250, rays: true, far: 'dunes', horizon: 464 }),
      wheat(250, 500, 1.15, c.p.crop, 6),
      wheat(1140, 506, 1.2, c.p.crop, 6),
      person(620, 496, 1.25, c.p.fore, 'kneel'),
      sheaf(880, 500, 1.15, c.p.crop),
      person(980, 494, 1.1, c.p.near, 'stand'),
      fg(c, 678, 18),
    ],
  },
  'ruth-bijbelquiz-deel-3': {
    hue: 40,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1080, sunY: 236, sunR: 58, far: 'dunes', horizon: 470 }),
      sheaf(330, 476, 1.25, c.p.crop),
      sheaf(1030, 480, 1.15, c.p.crop),
      person(700, 478, 1.15, c.p.fore, 'sit'),
      person(620, 486, 1.0, c.p.fore, 'fallen'),
      fg(c, 678, 18),
    ],
  },
  'ruth-bijbelquiz-deel-4': {
    hue: 52,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 270, sunY: 244, far: 'dunes', horizon: 474 }),
      gateArch(950, 474, 1.15, c.p.near),
      crowd(c.rand, 620, 478, 0.85, c.p.near, 5, 260),
      sandal(430, 470, 1.5, c.p.accent),
      fg(c, 676, 20),
    ],
  },
  // ── anthology quizzes (mixed chapters) ───────────────────────────────────
  'algemene-bijbelkennis-deel-1': {
    hue: 218,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 244, sunR: 78, rays: true, far: 'ridge' }),
      cityWall(300, G - 8, 0.7, c.p.far, 260, { opacity: 0.6 }),
      boat(1120, G + 18, 0.9, c.p.near, true),
      tent(880, G + 4, 1.0, c.p.near),
      palm(1000, G + 4, 0.85, c.p.near),
      crowd(c.rand, 600, G + 10, 0.8, c.p.near, 5, 230),
      fg(c),
    ],
  },
  'koningen-profeten-en-apostelen': {
    hue: 286,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 262, rays: true, far: 'none', ground: 'flat', horizon: 516 }),
      columns(1130, 516, 1.05, c.p.near, 3),
      throne(300, 516, 0.85, c.p.near),
      person(300, 516, 0.9, c.p.fore, 'sit'),
      crown(300, 300, 0.9, c.p.accent),
      person(700, 516, 1.35, c.p.near, 'raise'),
      scroll(880, 420, 1.0, c.p.accent),
      fg(c, 690, 14),
    ],
  },
  'wonderen-en-gebeurtenissen': {
    hue: 196,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 246, sunR: 96, rays: true, far: 'none', ground: 'flat', horizon: 540 }),
      path('M -40 540 L -40 250 C 260 280 380 400 420 540 Z', c.p.water),
      path(`M ${W + 40} 540 L ${W + 40} 250 C ${W - 260} 280 ${W - 380} 400 ${W - 420} 540 Z`, c.p.water),
      shafts(704, 40, 300, 420, c.p.glow, 5),
      crowd(c.rand, 704, 544, 0.85, c.p.fore, 6, 280),
      fg(c, 692, 14),
    ],
  },
  'helden-en-martelaren': {
    hue: 268,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 260, sunY: 250, far: 'ridge' }),
      banner(1060, G, 1.15, c.p.near, c.p.accent),
      person(470, G, 1.4, c.p.fore, 'raise'),
      person(600, G + 6, 1.25, c.p.fore, 'stand'),
      person(720, G + 6, 1.2, c.p.fore, 'stand'),
      fireBed(c.rand, 900, G + 10, 1.1, c.p.accent, 4),
      fg(c),
    ],
  },
  'diepere-bijbelstudie': {
    hue: 232,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1090, sunY: 234, sunR: 56, far: 'ridge' }),
      rect(300, 452, 560, 20, c.p.near),
      c.soft(560, 400, 240, 0.3),
      scroll(560, 410, 1.5, c.p.light, { opacity: 0.9 }),
      lamp(830, 448, 1.4, c.p.near, c.p.accent),
      person(300, G + 14, 1.2, c.p.fore, 'sit'),
      fg(c, 690, 16),
    ],
  },
  hooglied: {
    hue: 344,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 252, rays: true, far: 'dunes', horizon: 470 }),
      vineRow(c.rand, 210, 476, 0.95, c.p.mid, 5),
      gateArch(1000, 474, 0.95, c.p.near),
      tree(760, 474, 1.0, c.p.near),
      grapes(560, 380, 1.1, c.p.crop),
      fg(c, 688, 18),
    ],
  },
};


export function contextFor(slug: string, scene: Scene): C {
  const rand = rngFor(slug);
  let counter = 0;
  return {
    rand,
    hue: scene.hue,
    mood: scene.mood,
    p: paletteFor(scene.hue, scene.mood),
    defs: [],
    id: (name: string) => {
      counter += 1;
      return `${name}${counter}`;
    },
    soft(x, y, r, opacity = 0.3, color) {
      const gid = this.id('soft');
      this.defs.push(
        `<radialGradient id="${gid}" cx="0.5" cy="0.5" r="0.5">` +
          `<stop offset="0" stop-color="${color ?? this.p.glow}" stop-opacity="${opacity}"/>` +
          `<stop offset="0.55" stop-color="${color ?? this.p.glow}" stop-opacity="${opacity * 0.42}"/>` +
          `<stop offset="1" stop-color="${color ?? this.p.glow}" stop-opacity="0"/></radialGradient>`,
      );
      return circle(x, y, r, `url(#${gid})`);
    },
    veil(from, to, color, opacity) {
      const gid = this.id('veil');
      const a = Math.min(from, to) / W;
      const b = Math.max(from, to) / W;
      const flip = from > to;
      this.defs.push(
        `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">` +
          `<stop offset="${a.toFixed(3)}" stop-color="${color}" stop-opacity="${flip ? opacity : 0}"/>` +
          `<stop offset="${b.toFixed(3)}" stop-color="${color}" stop-opacity="${flip ? 0 : opacity}"/></linearGradient>`,
      );
      return rect(0, 0, W, H, `url(#${gid})`);
    },
  };
}

export function renderScene(slug: string): string {
  const scene = SCENES[slug];
  if (!scene) throw new Error(`No scene defined for "${slug}"`);
  const c = contextFor(slug, scene);
  const body = scene.draw(c).join('');
  const vg = c.id('vig');
  c.defs.push(
    `<linearGradient id="${vg}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${c.p.fore}" stop-opacity="0.16"/>` +
      `<stop offset="0.32" stop-color="${c.p.fore}" stop-opacity="0"/>` +
      `<stop offset="0.74" stop-color="${c.p.fore}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${c.p.fore}" stop-opacity="0.3"/></linearGradient>`,
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><clipPath id="frame"><rect width="${W}" height="${H}"/></clipPath>${c.defs.join('')}</defs>` +
    `<g clip-path="url(#frame)">${body}${rect(0, 0, W, H, `url(#${vg})`)}</g>` +
    `</svg>`
  );
}
