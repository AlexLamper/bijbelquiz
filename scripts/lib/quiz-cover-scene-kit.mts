/**
 * Everything a scene module needs that is not a motif: the mood table, the
 * palette derived from a hue and a mood, the backdrop (`base`), the
 * foreground band (`fg`), the drawing context, and the SVG wrapper.
 *
 * Split out of `quiz-cover-scenes.mts` so a series can live in its own file
 * (`quiz-cover-scenes-matteus.mts`, ...) and import these without the two
 * files importing each other. The core scene table stays where it was.
 */

import {
  H,
  W,
  circle,
  cloudBank,
  crescent,
  dunes,
  hsl,
  rays,
  rect,
  ridge,
  rngFor,
  stars,
  sunDisc,
  swell,
  water,
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

export const G = GROUND;

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

/** The finished SVG for one scene. `renderScene` in the scene table looks the scene up; this takes it. */
export function renderSceneFor(slug: string, scene: Scene): string {
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
