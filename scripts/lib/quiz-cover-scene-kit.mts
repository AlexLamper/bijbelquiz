/**
 * Everything a scene module needs that is not a motif: the palette, the
 * backdrop (`base`), the foreground bands (`fg`), the drawing context and the
 * SVG wrapper.
 *
 * STYLE: "Licht landschap" (option A from the cover-options round, see
 * scripts/lib/cover-options/option-a-licht.mts). A pale sky with a white sun,
 * four to five depth layers that get lighter toward the horizon, a white haze
 * over the horizon, dark silhouettes for the people and one gold or coral
 * accent on the key object. One palette per book group; the scene's `mood`
 * tints it (dawn, dusk, night, ...) so the parts of one series do not all
 * look the same.
 *
 * The scene files were written for an earlier dark-silhouette kit and still
 * speak its vocabulary (`c.p.near`, `c.p.fore`, `base(c, { far: 'ridge' })`).
 * This kit keeps that API and maps it onto the A look, so the 337 scenes keep
 * their subject and composition without being rewritten one by one.
 */

import { H, W, cloudBank, crescent, rect, rngFor, setHills, setInk, setTerrain, setWalls } from './quiz-cover-primitives.mjs';
import { at, band, box, circ, grass, hills, line, mix, mountain, p, sun as sunShape } from './cover-options/shapes.mjs';

export type Mood = 'day' | 'dawn' | 'dusk' | 'night' | 'storm' | 'warm' | 'gold';

export type Group = 'wet' | 'poezie' | 'profeten' | 'evangelien' | 'brieven' | 'thema';

/** The A palette of a book group: layer colours from sky to foreground, the silhouette colour and the accent. */
export type GroupPalette = {
  skyTop: string;
  skyLow: string;
  far: string;
  mid: string;
  near: string;
  ground: string;
  fore: string;
  figure: string;
  accent: string;
  accent2: string;
};

/** The colours a scene draws its motifs with (the old kit's names, A's colours). */
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
  group: Group;
  /** Motif colours. */
  p: Palette;
  /** The layer palette the backdrop is drawn from. */
  a: GroupPalette;
  defs: string[];
  id: (name: string) => string;
  /** Soft radial light. A flat circle at low opacity shows its edge; this does not. */
  soft: (x: number, y: number, r: number, opacity?: number, color?: string) => string;
  /** Horizontal wash across the frame - weather rolling in, not a rectangle. */
  veil: (from: number, to: number, color: string, opacity: number) => string;
};

// ── palettes ───────────────────────────────────────────────────────────────

const GOLD = '#E9B12E';
const CORAL = '#D9734F';

/** Lifted from the four 2.0 scene palettes, plus a stone one for the letters (same as option A). */
export const GROUP_PALETTES: Record<Group, GroupPalette> = {
  evangelien: { skyTop: '#D2DDF0', skyLow: '#F0F3F9', far: '#C9D5EB', mid: '#B4C4E0', near: '#9DB0D4', ground: '#8EA3CB', fore: '#7489B5', figure: '#2E3B57', accent: GOLD, accent2: '#F6E2A6' },
  wet: { skyTop: '#F5E4BA', skyLow: '#FCF5E4', far: '#F0DDAE', mid: '#E8CF98', near: '#DDBE7E', ground: '#D3B26E', fore: '#C29D57', figure: '#5A4320', accent: CORAL, accent2: GOLD },
  poezie: { skyTop: '#D9E6DB', skyLow: '#F1F5F0', far: '#C8D9CC', mid: '#B3CBB9', near: '#9DBBA3', ground: '#8CAE93', fore: '#73977B', figure: '#2E5A3E', accent: GOLD, accent2: '#F2D98F' },
  profeten: { skyTop: '#F3D8CB', skyLow: '#FBF0EA', far: '#EECDBE', mid: '#E6BBA7', near: '#D9A48B', ground: '#CF9479', fore: '#BD7C60', figure: '#6E3420', accent: GOLD, accent2: '#F6DE9C' },
  brieven: { skyTop: '#E2DED5', skyLow: '#F6F4EF', far: '#D9D3C7', mid: '#CBC3B3', near: '#BAAF9C', ground: '#AEA28C', fore: '#998C74', figure: '#263E69', accent: GOLD, accent2: '#F3DC9E' },
  thema: { skyTop: '#D9E2F1', skyLow: '#F6F1E4', far: '#CCD6EA', mid: '#B9C7E2', near: '#A3B5D7', ground: '#93A7CE', fore: '#7C92BD', figure: '#2E3B57', accent: GOLD, accent2: '#F6E2A6' },
};

const BOOK_GROUP: Record<string, Group> = {
  genesis: 'wet', exodus: 'wet', ruth: 'wet', esther: 'wet',
  prediker: 'poezie', hooglied: 'poezie', klaagliederen: 'poezie', 'het-boek-spreuken': 'poezie', spreuken: 'poezie', psalmen: 'poezie',
  jesaja: 'profeten', daniel: 'profeten', jona: 'profeten', habakuk: 'profeten',
  matteus: 'evangelien', marcus: 'evangelien', lucas: 'evangelien', johannes: 'evangelien', handelingen: 'evangelien',
  romeinen: 'brieven', '1-korinthe': 'brieven', '2-korinthe': 'brieven', galaten: 'brieven', efeze: 'brieven',
  filippenzen: 'brieven', kolossenzen: 'brieven', '1-thessalonicenzen': 'brieven', '2-thessalonicenzen': 'brieven',
  '1-timotheus': 'brieven', '2-timotheus': 'brieven', titus: 'brieven', filemon: 'brieven', hebreeen: 'brieven',
};

/** The book a slug belongs to: `jesaja-bijbelquiz-deel-4` -> `jesaja`, `hooglied-deel-1` -> `hooglied`. */
export function bookOf(slug: string): string {
  return slug.replace(/-bijbelquiz-deel-\d+$/, '').replace(/-deel-\d+$/, '');
}

export function groupOf(slug: string): Group {
  return BOOK_GROUP[bookOf(slug)] ?? 'thema';
}

type Tint = { skyTop?: [string, number]; skyLow?: [string, number]; land?: [string, number]; figure?: [string, number] };

/**
 * Time of day as a tint over the group palette. Night stays a soft blue dusk,
 * not black: the covers sit behind UI type and must stay light.
 */
const MOOD_TINT: Record<Mood, Tint> = {
  day: {},
  dawn: { skyTop: ['#E2D2E8', 0.35], skyLow: ['#FBDCCB', 0.55], land: ['#F0C6B4', 0.1] },
  dusk: { skyTop: ['#BDB0D3', 0.42], skyLow: ['#F7CFAA', 0.6], land: ['#A38DAB', 0.16], figure: ['#2A2236', 0.18] },
  night: { skyTop: ['#55658F', 0.62], skyLow: ['#B8C1DC', 0.55], land: ['#6A76A0', 0.32], figure: ['#161C31', 0.3] },
  storm: { skyTop: ['#9AA1AC', 0.55], skyLow: ['#D9DCDF', 0.5], land: ['#959BA3', 0.3], figure: ['#22262E', 0.18] },
  warm: { skyTop: ['#F3DFBC', 0.3], skyLow: ['#FCEAD0', 0.35], land: ['#E4C496', 0.12] },
  gold: { skyTop: ['#F1D79C', 0.42], skyLow: ['#FFF0CC', 0.5], land: ['#E8C27A', 0.16] },
};

function tinted(base: GroupPalette, mood: Mood, group: Group): GroupPalette {
  const t = MOOD_TINT[mood];
  const tw = (c: string, k?: [string, number]) => (k ? mix(c, k[0], k[1]) : c);
  // A second accent per book, by mood: warm light gets the other brand accent,
  // so a long series is not one gold object after another.
  const swap = mood === 'dusk' || mood === 'warm' || mood === 'dawn';
  const accent = swap ? (group === 'wet' ? GOLD : CORAL) : base.accent;
  return {
    skyTop: tw(base.skyTop, t.skyTop),
    skyLow: tw(base.skyLow, t.skyLow),
    far: tw(base.far, t.land),
    mid: tw(base.mid, t.land),
    near: tw(base.near, t.land),
    ground: tw(base.ground, t.land),
    fore: tw(base.fore, t.land),
    figure: tw(base.figure, t.figure),
    accent,
    accent2: base.accent2,
  };
}

const GLOW: Record<Mood, string> = {
  day: '#FFF6E0', dawn: '#FFE7D2', dusk: '#FFE2C0', night: '#EEF1FF', storm: '#F4F4F0', warm: '#FFEFD2', gold: '#FFE9B8',
};

/** The motif palette: the old names, A's colours. People and key motifs are the dark silhouette colour. */
export function paletteFor(group: Group, mood: Mood): { p: Palette; a: GroupPalette } {
  const a = tinted(GROUP_PALETTES[group], mood, group);
  const p: Palette = {
    sky: [a.skyTop, mix(a.skyTop, a.skyLow, 0.5), a.skyLow],
    glow: GLOW[mood],
    light: '#FFFFFF',
    accent: a.accent,
    accentDeep: mix(a.accent, a.figure, 0.32),
    far: mix(a.far, a.figure, 0.28),
    mid: mix(a.near, a.figure, 0.3),
    near: mix(a.figure, a.near, 0.45),
    fore: a.figure,
    water: mix(a.far, '#FFFFFF', 0.3),
    crest: '#FFFFFF',
    crop: mix(a.accent2, a.mid, 0.3),
  };
  return { p, a };
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
export const G = GROUND;

function vgrad(c: C, top: string, bottom: string, a = 0, b = 1): string {
  const id = c.id('g');
  c.defs.push(`<linearGradient id="${id}" x1="0" y1="${a}" x2="0" y2="${b}"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`);
  return `url(#${id})`;
}

/** A layer with a gentle top-to-bottom shade, so flat bands read as ground. */
export function layer(c: C, color: string): string {
  return vgrad(c, mix(color, '#FFFFFF', 0.1), mix(color, '#000000', 0.04));
}

function glowDisc(c: C, x: number, y: number, r: number, color: string, opacity: number): string {
  const id = c.id('r');
  c.defs.push(
    `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="0.5" stop-color="${color}" stop-opacity="${opacity * 0.4}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
  );
  return circ(x, y, r, `url(#${id})`);
}

/** The white haze over a horizon: what makes the layers read as distance. */
export function haze(c: C, y: number, h = 110, opacity = 0.34): string {
  const id = c.id('h');
  c.defs.push(
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>` +
      `<stop offset="0.6" stop-color="#FFFFFF" stop-opacity="${opacity}"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>`,
  );
  return box(0, y - h, W, h * 1.4, `url(#${id})`);
}

/** Wavy points for a band: gentle, never a straight line. */
function wave(c: C, y: number, amp: number): [number, number][] {
  const pts: [number, number][] = [];
  const n = 4;
  for (let i = 0; i <= n; i += 1) pts.push([(W * i) / n, y + (c.rand() - 0.5) * amp]);
  return pts;
}

function sunRays(c: C, x: number, y: number, opacity: number): string {
  const out: string[] = [];
  const n = 13;
  const start = c.rand() * 10;
  for (let i = 0; i < n; i += 1) {
    const a = ((start + (i * 360) / n) * Math.PI) / 180;
    const w = 0.035;
    out.push(
      p(
        `M ${x} ${y} L ${(x + Math.cos(a - w) * 1000).toFixed(1)} ${(y + Math.sin(a - w) * 1000).toFixed(1)} L ${(x + Math.cos(a + w) * 1000).toFixed(1)} ${(y + Math.sin(a + w) * 1000).toFixed(1)} Z`,
        '#FFFFFF',
      ),
    );
  }
  return `<g opacity="${opacity}">${out.join('')}</g>`;
}

/** Sky, light source and the layers behind the motifs. */
export function base(c: C, o: BaseOpts = {}): string {
  const A = c.a;
  const gy = o.horizon ?? GROUND;
  const night = c.mood === 'night';

  const out = [box(0, 0, W, H, vgrad(c, A.skyTop, A.skyLow, 0, Math.min(0.92, (gy + 40) / H)))];

  const sx = o.sunX ?? (c.rand() > 0.42 ? 880 + c.rand() * 300 : 190 + c.rand() * 260);
  const sy = o.sunY ?? 214 + c.rand() * 90;
  // The A sun is small and white; the light is in its glow.
  const sr = Math.max(30, Math.min(60, (o.sunR ?? 58 + c.rand() * 34) * 0.66));

  const starCount = o.stars ?? (night ? 46 : c.mood === 'dusk' ? 10 : 0);
  if (starCount) {
    const st: string[] = [];
    for (let i = 0; i < starCount; i += 1) {
      const r = 1.2 + c.rand() * 2;
      st.push(circ(c.rand() * W, 30 + c.rand() * Math.min(gy - 200, 300), r, '#FFFFFF', `opacity="${(0.45 + c.rand() * 0.5).toFixed(2)}"`));
    }
    out.push(st.join(''));
  }

  const sunKind = o.sun ?? 'sun';
  if (sunKind !== 'none') out.push(glowDisc(c, sx, sy, sr * 4.6, night ? '#F2F4FF' : '#FFFFFF', night ? 0.4 : 0.6));
  if (sunKind !== 'none' && sunKind !== 'moon') out.push(glowDisc(c, sx, sy, sr * 2.4, c.p.glow, 0.7));
  if (o.rays) out.push(sunRays(c, sx, sy, night ? 0.1 : 0.17));
  if (sunKind === 'sun') out.push(at(sx, sy, 1, sunShape(sr, '#FFFFFF', '#FFFFFF', 0.22)));
  if (sunKind === 'moon') out.push(crescent(sx, sy, sr * 0.9, '#FFFFFF'));

  if (o.clouds) {
    for (let i = 0; i < o.clouds; i += 1) {
      out.push(cloudBank(c.rand, 150 + c.rand() * (W - 300), 140 + c.rand() * 120, 0.7 + c.rand() * 0.6, '#FFFFFF', { opacity: c.mood === 'storm' ? 0.42 : 0.5 }));
    }
  }

  const far = o.far ?? 'ridge';
  if (far === 'ridge') {
    out.push(hills(c.rand, gy - 70 - c.rand() * 30, 70, mix(A.far, A.skyLow, 0.42), 3));
    const left = c.rand() < 0.5;
    const mx = left ? 180 + c.rand() * 320 : 900 + c.rand() * 330;
    out.push(at(mx, gy + 6, 1, mountain(300 + c.rand() * 140, 150 + c.rand() * 90, layer(c, A.far))));
    if (c.rand() < 0.6) {
      const mx2 = left ? mx + 420 + c.rand() * 300 : mx - 420 - c.rand() * 300;
      out.push(at(mx2, gy + 6, 1, mountain(220 + c.rand() * 100, 90 + c.rand() * 60, layer(c, mix(A.far, A.mid, 0.35)))));
    }
  } else if (far === 'dunes') {
    out.push(hills(c.rand, gy - 40, 50, mix(A.far, A.skyLow, 0.25), 4));
  }

  const ground = o.ground ?? 'dunes';
  if (ground === 'water' || ground === 'swell') {
    out.push(haze(c, gy, 80));
    const top = mix(A.far, '#FFFFFF', 0.4);
    const bottom = mix(A.mid, '#FFFFFF', 0.12);
    out.push(box(0, gy - 4, W, H - gy + 4, vgrad(c, top, bottom)));
    const glints: string[] = [];
    const rows = ground === 'swell' ? 9 : 7;
    for (let i = 0; i < rows; i += 1) {
      const y = gy + 14 + i * ((H - gy) / rows) * 0.9;
      const x = c.rand() * W;
      const len = 80 + c.rand() * 200;
      if (ground === 'swell') {
        glints.push(line(`M ${(x - len).toFixed(0)} ${y.toFixed(0)} q ${(len / 2).toFixed(0)} -14 ${len.toFixed(0)} 0 t ${len.toFixed(0)} 0`, '#FFFFFF', 4, 'opacity="0.55"'));
      } else {
        glints.push(line(`M ${x.toFixed(0)} ${y.toFixed(0)} L ${(x + len).toFixed(0)} ${y.toFixed(0)}`, '#FFFFFF', 3.5, 'opacity="0.6"'));
      }
    }
    out.push(glints.join(''));
  } else if (ground !== 'none') {
    out.push(haze(c, gy));
    if (ground === 'flat') out.push(box(0, gy, W, H - gy, layer(c, A.mid)));
    else out.push(band(wave(c, gy, 16), layer(c, A.mid)));
    if (gy <= 486) {
      out.push(band(wave(c, gy + 78, 18), layer(c, A.near)));
      out.push(grass(c.rand, 0, W, gy + 84, mix(A.near, A.figure, 0.22), 40, 14));
    }
  }

  return out.join('');
}

/** The two foreground bands, drawn after the midground motifs so those sit inside the scene. */
export function fg(c: C, y = 676, amp = 26): string {
  const A = c.a;
  return (
    band(wave(c, y - 74, amp * 0.5), layer(c, A.ground)) +
    grass(c.rand, 0, W, y - 68, mix(A.ground, A.figure, 0.22), 60, 18) +
    band(wave(c, y, amp * 0.6), layer(c, mix(A.fore, A.figure, 0.06))) +
    grass(c.rand, 0, W, y + 6, mix(A.fore, A.figure, 0.3), 90, 20)
  );
}

// ── scenes ─────────────────────────────────────────────────────────────────

export type Scene = { hue: number; mood: Mood; draw: (c: C) => string[] };

export function contextFor(slug: string, scene: Scene): C {
  const rand = rngFor(slug);
  let counter = 0;
  const group = groupOf(slug);
  const { p: pal, a } = paletteFor(group, scene.mood);
  // People, animals, boats and trees drawn in a depth colour become the dark silhouette.
  setInk({
    [pal.near]: mix(a.figure, a.near, 0.08),
    [pal.mid]: mix(a.figure, a.near, 0.3),
    [pal.far]: mix(a.figure, a.far, 0.5),
  });
  setHills({
    [pal.near]: mix(a.near, a.ground, 0.55),
    [pal.mid]: mix(a.mid, a.near, 0.5),
    [pal.fore]: mix(a.ground, a.fore, 0.5),
  });
  setWalls({
    [pal.near]: mix(a.mid, a.figure, 0.32),
    [pal.fore]: mix(a.near, a.figure, 0.4),
    [pal.mid]: mix(a.mid, a.figure, 0.2),
  });
  setTerrain({
    [pal.far]: a.far,
    [pal.mid]: mix(a.near, '#FFFFFF', 0.06),
    [pal.near]: a.ground,
    [pal.fore]: mix(a.ground, a.fore, 0.6),
  });
  return {
    rand,
    hue: scene.hue,
    mood: scene.mood,
    group,
    p: pal,
    a,
    defs: [],
    id: (name: string) => {
      counter += 1;
      return `${name}${counter}`;
    },
    soft(x, y, r, opacity = 0.3, color) {
      const gid = this.id('soft');
      const col = color ?? this.p.glow;
      this.defs.push(
        `<radialGradient id="${gid}" cx="0.5" cy="0.5" r="0.5">` +
          `<stop offset="0" stop-color="${col}" stop-opacity="${opacity}"/>` +
          `<stop offset="0.55" stop-color="${col}" stop-opacity="${opacity * 0.42}"/>` +
          `<stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`,
      );
      return circ(x, y, r, `url(#${gid})`);
    },
    veil(from, to, color, opacity) {
      const gid = this.id('veil');
      // A dark veil (weather, judgement) is a grey wash in the light style, never a shadow.
      if (color === this.p.fore || color === this.p.near) {
        color = mix(this.a.near, this.a.figure, 0.3);
        opacity *= 0.6;
      }
      const lo = Math.min(from, to) / W;
      const hi = Math.max(from, to) / W;
      const flip = from > to;
      this.defs.push(
        `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">` +
          `<stop offset="${lo.toFixed(3)}" stop-color="${color}" stop-opacity="${flip ? opacity : 0}"/>` +
          `<stop offset="${hi.toFixed(3)}" stop-color="${color}" stop-opacity="${flip ? 0 : opacity}"/></linearGradient>`,
      );
      return rect(0, 0, W, H, `url(#${gid})`);
    },
  };
}

/**
 * The scenes were composed for small figures on a far horizon. The light
 * style wants the subject larger and nearer, so the whole scene is drawn
 * zoomed in about a point just below the horizon: the subject grows, the
 * empty foreground shrinks, and what sat in y 245..585 stays inside the quiz
 * page's header crop (its middle ~400px).
 */
export const ZOOM = { x: 704, y: 520, s: 1.18 };

/** The finished SVG for one scene. */
export function renderSceneFor(slug: string, scene: Scene): string {
  const c = contextFor(slug, scene);
  const z = ZOOM;
  const body = `<g transform="translate(${z.x} ${z.y}) scale(${z.s}) translate(${-z.x} ${-z.y})">${scene.draw(c).join('')}</g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><clipPath id="frame"><rect width="${W}" height="${H}"/></clipPath>${c.defs.join('')}</defs>` +
    `<g clip-path="url(#frame)">${body}</g>` +
    `</svg>`
  );
}
