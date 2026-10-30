/**
 * Extra motifs for the Psalmen 1-50 covers (`quiz-cover-scenes-psalmen-1.mts`).
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouette shapes, no
 * strokes except round-capped lines, `(x, y, s, fill, ...)` with `y` the
 * ground a motif stands on (or, for floating things, its centre). Most are
 * drawn in a local unit space and placed with `at()` from the option-A shapes,
 * so they can be mirrored with `flip`.
 */

import {
  at,
  bowed,
  box,
  broadWing,
  circ,
  ell,
  figure,
  fire as aFire,
  hourglass as aHourglass,
  kneeler,
  line,
  openBook,
  p,
  sheaf as aSheaf,
  sheep as aSheep,
  star4 as aStar4,
  throne as aThrone,
  wheatStalk,
  type Pose as FigurePose,
} from './cover-options/shapes.mjs';
import { H, W, ink } from './quiz-cover-primitives.mjs';

type At = { flip?: boolean; rot?: number; opacity?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Scale that makes an option-A figure the same height as `person(..., s)`. */
const K = 134 / 204;

// ── people ─────────────────────────────────────────────────────────────────

/**
 * A standing figure with the option-A poses `person()` does not expose
 * (staff, bless, shield, reach), and mirroring. `crook` bends the top of the
 * staff into a shepherd's hook.
 */
export function fig(x: number, y: number, s: number, fill: string, pose: FigurePose = 'stand', o: At & { staffFill?: string; crook?: boolean } = {}): string {
  const f = ink(fill);
  const hook = pose === 'staff' && o.crook ? line('M 54 -236 C 52 -270 92 -274 92 -246', o.staffFill ?? f, 7) : '';
  return at(x, y, s * K, figure(f, pose, { staffFill: o.staffFill }) + hook, { flip: o.flip, opacity: o.opacity, rot: o.rot });
}

/** A shepherd, front view, carrying a lamb across the shoulders; the lamb's legs held at the chest. Same height as `person(..., s)`. */
export function shepherdWithLamb(x: number, y: number, s: number, fill: string, wool: string, woolDark: string, o: At = {}): string {
  const f = ink(fill);
  const lamb =
    ell(0, -160, 64, 22, wool) +
    circ(-62, -150, 21, wool) +
    circ(-40, -164, 21, wool) +
    circ(40, -164, 21, wool) +
    circ(62, -150, 21, wool) +
    circ(-48, -138, 19, wool) +
    circ(48, -138, 19, wool) +
    p('M 72 -170 C 96 -180 110 -162 104 -146 C 98 -134 82 -138 74 -150 Z', f) +
    ell(78, -172, 10, 4.5, f, 'transform="rotate(-20 78 -172)"');
  const legs =
    line('M -48 -136 L -14 -110', woolDark, 8) + line('M -56 -128 L -20 -102', woolDark, 8) + line('M 48 -136 L 14 -110', woolDark, 8) + line('M 56 -128 L 20 -102', woolDark, 8);
  return at(x, y, s * K, lamb + figure(f, 'carry') + legs, o);
}

/** Kneeling, side view, facing right (flip for left); arms 'pray' | 'forward' | 'up' | 'plant'. */
export function kneel(x: number, y: number, s: number, fill: string, arms: 'pray' | 'forward' | 'up' | 'plant' = 'pray', o: At = {}): string {
  return at(x, y, s * 0.6, kneeler(ink(fill), arms), o);
}

/** Bowed low, face hidden in the hands, facing right. */
export function bowedFig(x: number, y: number, s: number, fill: string, o: At = {}): string {
  return at(x, y, s * 0.6, bowed(ink(fill)), o);
}

/** Lying asleep on the side under a blanket on a mat, head on a pillow at the left; ~220 long at s = 1. */
export function sleeper(x: number, y: number, s: number, fill: string, pillow: string, o: At = {}): string {
  const f = ink(fill);
  return at(
    x,
    y,
    s,
    box(-116, -8, 246, 8, f, 3) +
      ell(-88, -18, 32, 12, pillow) +
      p('M -70 -8 L 116 -8 C 124 -14 122 -28 110 -32 C 94 -36 80 -36 70 -44 C 56 -60 30 -64 12 -52 C -2 -44 -22 -46 -36 -54 C -52 -62 -70 -54 -70 -34 Z', f) +
      circ(-84, -42, 17, f) +
      p('M -100 -44 C -102 -66 -66 -68 -66 -46 L -66 -30 L -98 -30 Z', f),
    o,
  );
}

/** Stooped walker facing right, a heavy bundle on the back, leaning on a stick; ~170 tall at s = 1. */
export function burdened(x: number, y: number, s: number, fill: string, load: string, o: At = {}): string {
  const f = ink(fill);
  return at(
    x,
    y,
    s,
    p('M -34 0 C -34 -40 -30 -76 -14 -104 C -2 -122 18 -130 36 -126 L 48 -114 C 42 -92 30 -66 26 -40 C 24 -20 28 -8 34 0 Z', f) +
      circ(50, -112, 15, f) +
      p('M 36 -124 C 40 -140 64 -138 64 -120 L 62 -104 L 40 -108 Z', f) +
      line('M 30 -100 C 46 -82 58 -70 70 -64', f, 13) +
      circ(72, -62, 7, f) +
      line('M 74 -84 L 84 0', f, 6) +
      p('M -64 -118 C -74 -150 -54 -180 -20 -182 C 10 -184 26 -162 20 -140 C 14 -120 -8 -108 -32 -106 C -48 -106 -60 -110 -64 -118 Z', load) +
      line('M 22 -128 C 8 -126 -4 -118 -10 -108', f, 6),
    o,
  );
}

// ── animals ────────────────────────────────────────────────────────────────

/** A sheep, facing right (flip for left); ~70 tall at s = 1. */
export function sheepAt(x: number, y: number, s: number, body: string, head: string, o: At = {}): string {
  return at(x, y, s, aSheep(body, ink(head)), o);
}

/** A hart with antlers, head raised, facing right; ~240 tall at s = 1. */
export function hart(x: number, y: number, s: number, fill: string, o: At = {}): string {
  const f = ink(fill);
  const leg = (d: string) => line(d, f, 8);
  const out = [
    p('M -60 -92 C -62 -112 -36 -122 0 -120 C 32 -120 54 -116 62 -100 C 66 -84 56 -70 34 -70 L -32 -70 C -52 -70 -60 -78 -60 -92 Z', f),
    leg('M -44 -78 L -50 -40 L -44 0'),
    leg('M -28 -76 L -24 -40 L -30 0'),
    leg('M 36 -76 L 42 -40 L 38 0'),
    leg('M 50 -78 L 54 -40 L 54 0'),
    ell(-62, -104, 9, 6, f),
  ];
  out.push(
    p('M 28 -110 C 40 -134 48 -154 54 -168 L 78 -160 C 72 -142 66 -120 62 -96 Z', f),
    p('M 54 -172 C 60 -184 78 -184 86 -174 L 104 -158 C 106 -152 100 -148 92 -150 L 72 -152 C 60 -154 52 -162 54 -172 Z', f),
    ell(52, -178, 11, 5, f, 'transform="rotate(-30 52 -178)"'),
    line('M 62 -180 C 58 -204 48 -220 34 -238', f, 5),
    line('M 56 -202 L 74 -214', f, 4),
    line('M 46 -220 L 56 -240', f, 4),
    line('M 70 -180 C 76 -204 88 -218 104 -230', f, 5),
    line('M 82 -206 L 102 -206', f, 4),
    line('M 92 -218 L 98 -238', f, 4),
  );
  return at(x, y, s, out.join(''), o);
}

/** A crouching, prowling lion facing right, lower than the lying lion; ~80 tall at s = 1. */
export function prowlingLion(x: number, y: number, s: number, fill: string, o: At = {}): string {
  const f = ink(fill);
  return at(
    x,
    y,
    s,
    p('M -110 -40 C -112 -66 -80 -78 -30 -76 C 20 -74 56 -70 72 -54 L 80 -30 L -100 -26 Z', f) +
      line('M -60 -34 L -72 0', f, 14) +
      line('M -36 -34 L -30 0', f, 13) +
      line('M 44 -40 L 58 0', f, 14) +
      line('M 26 -40 L 30 0', f, 13) +
      p('M -108 -50 C -138 -54 -150 -30 -136 -18', 'none', `stroke="${f}" stroke-width="7" stroke-linecap="round"`) +
      circ(-138, -16, 7, f) +
      p('M 56 -96 C 86 -110 118 -92 120 -62 C 122 -36 104 -14 78 -16 C 54 -18 40 -38 42 -62 C 42 -78 46 -90 56 -96 Z', f) +
      p('M 96 -72 C 112 -72 126 -62 128 -48 C 130 -36 122 -26 110 -26 L 96 -30 Z', f),
    o,
  );
}

// ── plants ─────────────────────────────────────────────────────────────────

/** A cedar of Lebanon: a straight trunk and wide flat tiers; ~260 tall at s = 1. `broken` snaps the crown off. */
export function cedar(x: number, y: number, s: number, fill: string, broken = false, o: At = {}): string {
  const f = ink(fill);
  const out = [p('M -12 0 L -8 -230 L 8 -230 L 12 0 Z', f)];
  const tiers = [
    [-70, 150],
    [-118, 128],
    [-162, 102],
    [-202, 76],
    [-236, 48],
  ];
  const tier = (ty: number, w: number) =>
    p(`M ${-w} ${ty} C ${-w * 0.7} ${ty - 30} ${w * 0.7} ${ty - 30} ${w} ${ty} C ${w * 0.5} ${ty + 12} ${-w * 0.5} ${ty + 12} ${-w} ${ty} Z`, f);
  if (!broken) {
    for (const [ty, w] of tiers) out.push(tier(ty, w));
    out.push(p('M -18 -244 L 0 -270 L 18 -244 Z', f));
    return at(x, y, s, out.join(''), o);
  }
  // Snapped above the second tier: the lower trunk stands, the crown breaks away and leans over.
  out[0] = p('M -12 0 L -9 -138 L -2 -150 L 4 -132 L 9 -146 L 12 0 Z', f);
  out.push(tier(-70, 150), tier(-118, 128));
  const crownPart = [p('M -9 -150 L -8 -230 L 8 -230 L 9 -146 Z', f), tier(-162, 102), tier(-202, 76), tier(-236, 48), p('M -18 -244 L 0 -270 L 18 -244 Z', f)].join('');
  out.push(`<g transform="rotate(34 4 -146)">${crownPart}</g>`);
  return at(x, y, s, out.join(''), o);
}

/** A fruit tree by water: broad crown, the fruit drawn separately. Crown centre ~ (x, y - 190s). */
export function fruitTree(x: number, y: number, s: number, fill: string, o: At = {}): string {
  const f = ink(fill);
  return at(
    x,
    y,
    s,
    p('M -26 0 C -14 -30 -16 -70 -40 -110 L -24 -118 C -10 -96 -4 -84 -2 -74 C 6 -96 22 -112 46 -126 L 58 -114 C 34 -96 22 -70 20 -40 C 20 -20 24 -8 32 0 Z', f) +
      ell(-90, -150, 66, 46, f) +
      ell(-30, -196, 80, 56, f) +
      ell(56, -192, 78, 54, f) +
      ell(108, -148, 62, 44, f) +
      ell(10, -150, 110, 50, f) +
      ell(-60, -228, 46, 30, f) +
      ell(40, -240, 50, 30, f),
    o,
  );
}

/** A patch of ripe wheat: leaning stalks between x0 and x1 standing on y. */
export function wheatField(rand: () => number, x0: number, x1: number, y: number, h: number, stem: string, grain: string, gap = 16): string {
  const out: string[] = [];
  for (let x = x0; x <= x1; x += gap * (0.7 + rand() * 0.6)) {
    out.push(at(x, y + rand() * 8, 1, wheatStalk(h * (0.8 + rand() * 0.35), stem, grain), { rot: (rand() - 0.5) * 16 }));
  }
  return out.join('');
}

/** A bound sheaf of wheat (option-A shape); ~200 tall at s = 1. */
export function sheafA(x: number, y: number, s: number, stem: string, grain: string, band: string): string {
  return at(x, y, s, aSheaf(stem, grain, band));
}

/** A spring welling up: a jet with arcs falling either side into a pool. `(x, y)` is the source. */
export function fountain(x: number, y: number, s: number, fill: string, light: string): string {
  const k = (v: number) => r1(v * s);
  const jet = (d: string, w: number) => `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${k(w)}" stroke-linecap="round"/>`;
  const out = [
    ell(x, y + 8 * s, 190 * s, 22 * s, fill),
    jet(`M ${x} ${y} C ${x - k(14)} ${y - k(150)} ${x - k(110)} ${y - k(150)} ${x - k(130)} ${y + k(4)}`, 12),
    jet(`M ${x} ${y} C ${x + k(14)} ${y - k(150)} ${x + k(110)} ${y - k(150)} ${x + k(130)} ${y + k(4)}`, 12),
    jet(`M ${x} ${y} C ${x - k(6)} ${y - k(110)} ${x - k(56)} ${y - k(120)} ${x - k(64)} ${y + k(4)}`, 9),
    jet(`M ${x} ${y} C ${x + k(6)} ${y - k(110)} ${x + k(56)} ${y - k(120)} ${x + k(64)} ${y + k(4)}`, 9),
    jet(`M ${x} ${y} L ${x} ${y - k(150)}`, 14),
    circ(x, y - 162 * s, 11 * s, fill),
  ];
  for (const [dx, dy, r] of [
    [-22, -176, 6],
    [20, -180, 5],
    [-150, -10, 6],
    [150, -14, 6],
    [-86, -40, 4],
    [90, -36, 4],
  ] as const)
    out.push(circ(x + dx * s, y + dy * s, r * s, fill));
  out.push(
    `<path d="M ${x - k(4)} ${y - k(20)} L ${x - k(4)} ${y - k(140)}" fill="none" stroke="${light}" stroke-width="${k(3.5)}" stroke-linecap="round" opacity="0.7"/>`,
    `<path d="M ${x - k(16)} ${y - k(70)} C ${x - k(40)} ${y - k(118)} ${x - k(84)} ${y - k(116)} ${x - k(104)} ${y - k(60)}" fill="none" stroke="${light}" stroke-width="${k(3.5)}" stroke-linecap="round" opacity="0.6"/>`,
  );
  return out.join('');
}

// ── objects ────────────────────────────────────────────────────────────────

/** A round shield seen face-on; `(x, y)` is its centre, radius 50s. */
export function shield(x: number, y: number, s: number, fill: string, trim: string): string {
  return (
    circ(x, y, 50 * s, fill) +
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(38 * s)}" fill="none" stroke="${trim}" stroke-width="${r1(5 * s)}" opacity="0.6"/>` +
    circ(x, y, 12 * s, trim)
  );
}

/** A spear standing on its butt; ~310 tall at s = 1. */
export function spear(x: number, y: number, s: number, shaft: string, tip: string, o: At = {}): string {
  return at(x, y, s, box(-4, -268, 8, 268, ink(shaft), 3) + p('M -11 -262 L 0 -318 L 11 -262 L 0 -254 Z', tip), o);
}

/** A bow with its string; `(x, y)` is the middle of the grip, ~220 tall at s = 1. `broken` snaps it in two. */
export function bow(x: number, y: number, s: number, fill: string, broken = false, o: At = {}): string {
  const f = ink(fill);
  if (!broken) return at(x, y, s, line('M 0 -110 C 48 -70 48 70 0 110', f, 9) + line('M 0 -110 L 0 110', f, 2.5), o);
  return at(
    x,
    y,
    s,
    line('M 0 -110 C 30 -84 40 -50 38 -8', f, 9) + `<g transform="translate(40 40) rotate(38)">${line('M 0 0 C 0 44 -10 78 -38 102', f, 9)}</g>` + line('M 0 -110 L 6 -40', f, 2.5),
    o,
  );
}

/** A balance on a stand; `y` is the ground, ~250 tall and ~360 wide at s = 1. `tilt` lowers the right pan (degrees). */
export function scales(x: number, y: number, s: number, fill: string, tilt = 0, o: At = {}): string {
  const pan = (cx: number) =>
    line(`M ${cx} -216 L ${cx - 34} -124`, fill, 3) +
    line(`M ${cx} -216 L ${cx + 34} -124`, fill, 3) +
    p(`M ${cx - 56} -126 L ${cx + 56} -126 C ${cx + 48} -98 ${cx - 48} -98 ${cx - 56} -126 Z`, fill);
  const beam = `<g transform="rotate(${tilt} 0 -222)">${box(-140, -228, 280, 12, fill, 6)}${circ(-130, -216, 6, fill)}${circ(130, -216, 6, fill)}</g>`;
  const rad = (tilt * Math.PI) / 180;
  const dy = Math.sin(rad) * 130;
  return at(
    x,
    y,
    s,
    p('M -56 0 L -34 -24 L 34 -24 L 56 0 Z', fill) +
      box(-7, -236, 14, 216, fill, 4) +
      circ(0, -246, 12, fill) +
      beam +
      `<g transform="translate(0 ${r1(-dy)})">${pan(-130)}</g>` +
      `<g transform="translate(0 ${r1(dy)})">${pan(130)}</g>`,
    o,
  );
}

/** A clay smelting kiln with a crucible of molten silver on top; ~200 tall at s = 1. */
export function furnace(x: number, y: number, s: number, clay: string, hole: string, melt: string, glow: string, o: At = {}): string {
  return at(
    x,
    y,
    s,
    p('M -120 0 C -122 -84 -78 -142 0 -142 C 78 -142 122 -84 120 0 Z', clay) +
      p('M -46 0 L -46 -40 C -46 -70 46 -70 46 -40 L 46 0 Z', hole) +
      at(0, -2, 0.62, aFire(96, 84, melt, glow, '#FFFFFF')) +
      p('M -52 -196 L 52 -196 L 40 -138 L -40 -138 Z', clay) +
      box(-58, -204, 116, 12, clay, 6) +
      ell(0, -202, 48, 8, melt),
    o,
  );
}

/**
 * Two broad wings spread from a point as a canopy - shelter, not a figure.
 * `(x, y)` is where they meet; `spread` is each wing's angle from upright
 * (about 100 makes them arch down over what is beneath).
 */
export function shelterWings(x: number, y: number, s: number, fill: string, spread = 100, o: At = {}): string {
  return at(
    x,
    y,
    s,
    at(0, 0, 1, broadWing(fill, 260, 1.5), { rot: -spread }) + at(0, 0, 1, broadWing(fill, 260, 1.5), { rot: spread, flip: true }),
    o,
  );
}

/** The ark of the covenant: chest, lid with two cherub wings, carrying poles. `y` is the height of the poles. */
export function arkOfCovenant(x: number, y: number, s: number, gold: string, deep: string, o: At = {}): string {
  return at(
    x,
    y,
    s,
    box(-200, -6, 400, 12, deep, 6) +
      box(-92, -80, 184, 82, gold, 4) +
      box(-70, -62, 140, 48, deep, 3, 'opacity="0.35"') +
      box(-100, -92, 200, 14, gold, 5) +
      p('M -88 -92 C -92 -130 -62 -160 -8 -168 C -36 -146 -46 -120 -48 -92 Z', gold) +
      p('M 88 -92 C 92 -130 62 -160 8 -168 C 36 -146 46 -120 48 -92 Z', gold) +
      circ(-70, -104, 13, gold) +
      circ(70, -104, 13, gold),
    o,
  );
}

/** A bronze wash basin on a stand; ~110 tall at s = 1. */
export function laver(x: number, y: number, s: number, fill: string, water: string, o: At = {}): string {
  return at(
    x,
    y,
    s,
    p('M -50 0 L -28 -20 L 28 -20 L 50 0 Z', fill) +
      box(-12, -76, 24, 60, fill, 4) +
      p('M -92 -104 L 92 -104 C 82 -70 44 -66 0 -66 C -44 -66 -82 -70 -92 -104 Z', fill) +
      ell(0, -104, 92, 12, fill) +
      ell(0, -106, 80, 7, water),
    o,
  );
}

/** A stone altar with horns at the corners; ~150 tall, 180 wide at s = 1. Put fire on top at y - 122s. */
export function altar(x: number, y: number, s: number, stone: string, seam: string, o: At = {}): string {
  return at(
    x,
    y,
    s,
    box(-84, -112, 168, 112, stone) +
      box(-96, -124, 192, 16, stone, 3) +
      p('M -96 -122 L -96 -152 L -70 -122 Z', stone) +
      p('M 96 -122 L 96 -152 L 70 -122 Z', stone) +
      line('M -84 -76 L 84 -76 M -84 -40 L 84 -40 M -30 -112 L -30 -76 M 36 -76 L 36 -40 M -40 -40 L -40 0 M 30 -40 L 30 0', seam, 4, 'opacity="0.35"'),
    o,
  );
}

/** Fire for an altar or a hearth (outer, middle, white core); base at (x, y), ~h tall. */
export function blaze(x: number, y: number, h: number, outer: string, middle: string): string {
  return at(x, y, 1, aFire(h, h * 0.8, outer, middle, '#FFFFFF'));
}

/** A ram's-horn trumpet, mouthpiece at (x, y), bell up and to the right; ~140 long at s = 1. */
export function shofar(x: number, y: number, s: number, fill: string, o: At = {}): string {
  return at(x, y, s, p('M 0 -6 C 50 -10 92 -26 114 -72 L 142 -82 L 130 -54 C 106 -4 52 8 0 6 Z', fill), o);
}

/** A hand drum (timbrel) seen face-on; `(x, y)` is its centre. */
export function timbrel(x: number, y: number, s: number, fill: string, skin: string): string {
  const out = [circ(x, y, 32 * s, skin, 'opacity="0.55"'), `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(32 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(9 * s)}"/>`];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * 2 * i) / 6 + 0.3;
    out.push(circ(x + Math.cos(a) * 32 * s, y + Math.sin(a) * 32 * s, 7 * s, fill));
  }
  return out.join('');
}

/** A lyre (kinnor): sound box, two curved arms, a yoke and five strings; ~170 tall at s = 1. */
export function lyre(x: number, y: number, s: number, fill: string, strings: string, o: At = {}): string {
  const out = [
    p('M -44 0 L 44 0 L 50 -54 L -50 -54 Z', fill),
    line('M -40 -50 C -62 -100 -50 -140 -34 -166', fill, 10),
    line('M 40 -50 C 62 -100 50 -140 34 -166', fill, 10),
    line('M -48 -150 L 48 -150', fill, 9),
  ];
  for (let i = 0; i < 5; i += 1) {
    const sx = -24 + i * 12;
    out.push(line(`M ${sx} -150 L ${sx} -50`, strings, 2.5));
  }
  return at(x, y, s, out.join(''), o);
}

/** A tall harp of ten strings: column, curved neck, slanted sound box; ~280 tall at s = 1. */
export function harp(x: number, y: number, s: number, fill: string, strings: string, o: At = {}): string {
  // Neck: a cubic from the top of the box to the top of the column.
  const P0 = [-84, -216];
  const P1 = [-40, -266];
  const P2 = [22, -252];
  const P3 = [82, -270];
  const bez = (t: number) => {
    const u = 1 - t;
    return [
      u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0],
      u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1],
    ];
  };
  const neckY = (x0: number) => {
    let best = bez(0);
    for (let i = 0; i <= 60; i += 1) {
      const q = bez(i / 60);
      if (Math.abs(q[0] - x0) < Math.abs(best[0] - x0)) best = q;
    }
    return best[1];
  };
  const out = [
    p('M 40 -4 L 86 0 L -64 -222 L -98 -212 Z', fill),
    line(`M ${P0[0]} ${P0[1]} C ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]} ${P3[0]} ${P3[1]}`, fill, 16),
    box(70, -274, 16, 274, fill, 4),
    circ(78, -282, 11, fill),
    box(26, -12, 76, 12, fill, 4),
  ];
  for (let i = 0; i < 10; i += 1) {
    const t = 0.08 + i * 0.09;
    const bx = 56 + (-76 - 56) * t;
    const by = -8 + (-206 + 8) * t;
    out.push(line(`M ${r1(bx)} ${r1(by)} L ${r1(bx)} ${r1(neckY(bx) + 8)}`, strings, 2.6));
  }
  return at(x, y, s, out.join(''), o);
}

/** A net laid over the ground as a low dome; `(cx, by)` is the middle of its base. */
export function netDome(cx: number, by: number, w: number, h: number, fill: string, sw = 3, gap = 24, opacity = 1): string {
  const a = w / 2;
  const inside = (x: number, y: number) => y <= by + 0.01 && ((x - cx) / a) ** 2 + ((y - by) / h) ** 2 <= 1;
  const segs: string[] = [];
  for (const dir of [1, -1]) {
    for (let k = -w - h * 1.4; k <= w + h * 1.4; k += gap) {
      let first: [number, number] | null = null;
      let last: [number, number] | null = null;
      for (let t = 0; t <= h; t += 2) {
        const yy = by - t;
        const xx = cx + k + dir * t * 1.3;
        if (inside(xx, yy)) {
          if (!first) first = [xx, yy];
          last = [xx, yy];
        }
      }
      if (first && last && Math.hypot(last[0] - first[0], last[1] - first[1]) > 6) segs.push(`M ${r1(first[0])} ${r1(first[1])} L ${r1(last[0])} ${r1(last[1])}`);
    }
  }
  return (
    `<g opacity="${opacity}">` +
    line(segs.join(' '), fill, sw) +
    line(`M ${r1(cx - a)} ${r1(by)} A ${r1(a)} ${r1(h)} 0 0 1 ${r1(cx + a)} ${r1(by)}`, fill, sw * 1.4) +
    `</g>`
  );
}

/** A jagged lightning bolt hanging down from (x, y); ~170 long at s = 1. */
export function bolt(x: number, y: number, s: number, fill: string, opacity = 1): string {
  return p(
    `M ${r1(x)} ${r1(y)} L ${r1(x - 30 * s)} ${r1(y + 86 * s)} L ${r1(x - 4 * s)} ${r1(y + 80 * s)} L ${r1(x - 40 * s)} ${r1(y + 186 * s)}` +
      ` L ${r1(x + 26 * s)} ${r1(y + 68 * s)} L ${r1(x + 2 * s)} ${r1(y + 74 * s)} L ${r1(x + 24 * s)} ${r1(y)} Z`,
    fill,
    opacity !== 1 ? `opacity="${opacity}"` : '',
  );
}

/** An hourglass; ~190 tall at s = 1. */
export function hourglass(x: number, y: number, s: number, frame: string, glass: string, sand: string, o: At = {}): string {
  return at(x, y, s, aHourglass(frame, glass, sand), o);
}

/** A four-pointed star centred on (x, y). */
export function star(x: number, y: number, r: number, fill: string, opacity = 1): string {
  return at(x, y, 1, aStar4(r, fill), { opacity });
}

/** The option-A throne with its steps; ~260 tall, 300 wide at s = 1. */
export function bigThrone(x: number, y: number, s: number, fill: string, trim?: string, o: At = {}): string {
  return at(x, y, s, aThrone(fill, trim), o);
}

/** An open book / unrolled law, seen from the front; ~300 wide at s = 1, `y` under the spine. */
export function lawBook(x: number, y: number, s: number, cover: string, page: string, text?: string, o: At = {}): string {
  return at(x, y, s, openBook(cover, page, text), o);
}

/** A tunic laid flat on the ground, sleeves out; ~150 wide at s = 1. */
export function robe(x: number, y: number, s: number, fill: string, o: At = {}): string {
  return at(x, y, s, p('M -76 -40 L -24 -54 L 24 -54 L 76 -40 L 70 -18 L 34 -26 L 42 0 L -42 0 L -34 -26 L -70 -18 Z', fill), o);
}

/** A low table with legs; `y` is the floor, `top` the table height. */
export function table(x: number, y: number, w: number, top: number, fill: string): string {
  return box(x - w / 2, y - top, w, 12, fill, 3) + box(x - w / 2 + 14, y - top + 10, 10, top - 10, fill) + box(x + w / 2 - 24, y - top + 10, 10, top - 10, fill);
}

/** A round loaf broken in two, seen a little from above; centre at (x, y). */
export function brokenLoaf(x: number, y: number, s: number, fill: string, score: string): string {
  return (
    at(x - 22 * s, y, s, p('M 0 -26 C -30 -26 -44 -10 -40 6 C -36 18 -10 20 4 16 L -4 4 L 6 -6 L -2 -16 Z', fill)) +
    at(x + 22 * s, y + 2 * s, s, p('M 0 -26 C 30 -26 44 -10 40 6 C 36 18 10 20 -4 16 L 4 4 L -6 -6 L 2 -16 Z', fill)) +
    line(`M ${r1(x + 26 * s)} ${r1(y - 14 * s)} L ${r1(x + 40 * s)} ${r1(y - 4 * s)}`, score, 4 * s, 'opacity="0.6"')
  );
}

/** A spoked chariot wheel; `(x, y)` is its hub. */
export function wheel(x: number, y: number, r: number, fill: string): string {
  const out = [`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="none" stroke="${fill}" stroke-width="${r1(r * 0.16)}"/>`, circ(x, y, r * 0.2, fill)];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * i) / 3 + 0.2;
    out.push(line(`M ${r1(x)} ${r1(y)} L ${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)}`, fill, r * 0.09));
  }
  return out.join('');
}

/** A measuring cord laid over the ground through the given points, with a peg at each corner. */
export function cord(pts: [number, number][], fill: string, w = 5, peg?: string): string {
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${r1(x)} ${r1(y)}`).join(' ');
  const pegs = pts.map(([x, y]) => box(x - 4, y - 22, 8, 26, peg ?? fill, 2)).join('');
  return line(d, fill, w) + pegs;
}

/** Stacks of coins with a few loose ones; `(x, y)` is the ground under the middle stack. */
export function coinStacks(x: number, y: number, s: number, fill: string, edge: string): string {
  const coin = (cx: number, cy: number) => ell(cx, cy + 4 * s, 22 * s, 8 * s, edge) + ell(cx, cy, 22 * s, 8 * s, fill);
  const out: string[] = [];
  const stacks: [number, number][] = [
    [-52, 6],
    [0, 10],
    [50, 4],
  ];
  for (const [dx, n] of stacks) for (let i = 0; i < n; i += 1) out.push(coin(x + dx * s, y - 6 * s - i * 9 * s));
  for (const [dx, dy] of [
    [-100, 2],
    [96, 4],
    [130, 0],
    [-24, 10],
  ] as const)
    out.push(coin(x + dx * s, y + dy * s - 4 * s));
  return out.join('');
}

/** A dark cave mouth in a rock face; `(x, y)` is the middle of its floor. */
export function caveMouth(x: number, y: number, w: number, h: number, fill: string): string {
  return p(
    `M ${r1(x - w / 2)} ${r1(y)} C ${r1(x - w / 2)} ${r1(y - h * 0.8)} ${r1(x - w * 0.3)} ${r1(y - h)} ${r1(x)} ${r1(y - h)} C ${r1(x + w * 0.3)} ${r1(y - h)} ${r1(x + w / 2)} ${r1(y - h * 0.8)} ${r1(x + w / 2)} ${r1(y)} Z`,
    fill,
  );
}

/** A rock mass rising from the ground; `(x, y)` is the middle of its foot. A free shape, not mapped to a hill colour. */
export function rock(x: number, y: number, w: number, h: number, fill: string, lean = 0): string {
  const a = w / 2;
  return p(
    `M ${r1(x - a)} ${r1(y)} C ${r1(x - a * 0.96)} ${r1(y - h * 0.5)} ${r1(x - a * 0.7 + lean)} ${r1(y - h * 0.96)} ${r1(x - a * 0.2 + lean)} ${r1(y - h)}` +
      ` L ${r1(x + a * 0.24 + lean)} ${r1(y - h * 0.98)} C ${r1(x + a * 0.7 + lean)} ${r1(y - h * 0.9)} ${r1(x + a * 0.94)} ${r1(y - h * 0.5)} ${r1(x + a)} ${r1(y)} Z`,
    fill,
  );
}

/**
 * A road coming toward the viewer: wide at the bottom of the frame (centre
 * `cx`), narrowing toward the horizon (centre `cxFar`), swinging left and right. Returns the shape and a function
 * giving the road's centre x at a given y, to stand a figure on it.
 */
export function road(
  cx: number,
  cxFar: number,
  yNear: number,
  yFar: number,
  wNear: number,
  wFar: number,
  swing: number,
  turns: number,
  fill: string,
  opacity = 1,
): { shape: string; at: (y: number) => number } {
  const centre = (y: number) => {
    const t = (yNear - y) / (yNear - yFar);
    return cx + (cxFar - cx) * t + Math.sin(t * Math.PI * turns) * swing * (1 - t * 0.7);
  };
  const half = (y: number) => {
    const t = (yNear - y) / (yNear - yFar);
    return (wNear + (wFar - wNear) * Math.pow(t, 0.7)) / 2;
  };
  const left: string[] = [];
  const right: string[] = [];
  for (let y = yNear; y >= yFar - 0.01; y -= 6) {
    left.push(`${r1(centre(y) - half(y))} ${r1(y)}`);
    right.push(`${r1(centre(y) + half(y))} ${r1(y)}`);
  }
  const d = `M ${left.join(' L ')} L ${right.reverse().join(' L ')} Z`;
  return { shape: p(d, fill, opacity !== 1 ? `opacity="${opacity}"` : ''), at: centre };
}

/** Mirror any fragment about the vertical line x. */
export function mirror(x: number, inner: string): string {
  return `<g transform="translate(${r1(2 * x)} 0) scale(-1 1)">${inner}</g>`;
}

/** A flat wash over the whole frame (a darker sky, a dimmed night). */
export function wash(fill: string, opacity: number): string {
  return box(0, 0, W, H, fill, 0, `opacity="${opacity}"`);
}
