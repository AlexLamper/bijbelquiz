/**
 * Motifs for the Richteren, 1 Samuel and 2 Samuel cover series that the
 * shared primitives do not have: the ark of the covenant, an altar with
 * horns, a lyre, a sword, a spear, a round shield, a ram's horn, a jar, a
 * torch, Gideon's fleece, an ephod on its stand, an idol and a fallen one,
 * a jawbone, a honeycomb, a tambourine, Jael's peg and mallet, a cart, a
 * bow and arrows, a little robe, a flask of oil, a standing stone, a
 * plough, a spreading oak, a bier, a covered well, and `fig` - the option-A
 * figure with its full pose set and a flip, so people can face either way.
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, no
 * strokes except round-capped lines, `y` is the ground the motif stands on.
 * Each motif is drawn in its own local units and placed with `at`, so the
 * path data stays readable.
 */

import {
  at,
  bowed,
  box,
  bushClump,
  circ,
  ell,
  figure,
  kneeler,
  p,
  prostrate,
  sheep,
  sitter,
  star4,
  type Pose as APose,
} from './cover-options/shapes.mjs';
import { ink } from './quiz-cover-primitives.mjs';

type Opts = { opacity?: number };
type Place = Opts & { flip?: boolean; rot?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A round-capped line along a path, in local or canvas units. */
export function stroke(d: string, fill: string, w: number, o?: Opts): string {
  const op = o?.opacity !== undefined && o.opacity !== 1 ? ` opacity="${o.opacity}"` : '';
  return `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${op}/>`;
}

const place = (x: number, y: number, s: number, inner: string, o?: Place) =>
  at(x, y, s, inner, { flip: o?.flip, rot: o?.rot, opacity: o?.opacity });

const LIGHT = '#FFFFFF';
const faint = (k: number) => `opacity="${k}"`;

// ── people and animals ──────────────────────────────────────────────────────

export type FigPose = APose | 'kneel' | 'kneelUp' | 'kneelFwd' | 'plant' | 'weep' | 'fallen' | 'sit' | 'spread' | 'climb';

/** The hooded robe outline of the option-A figure, without arms. */
const BODY =
  'M -41 0 C -37 -24 -33 -50 -31 -84 C -29 -118 -29 -146 -26 -156 C -21 -164 -18 -170 -17 -184 ' +
  'C -17 -197 -10 -204 0 -204 C 10 -204 17 -197 17 -184 C 18 -170 21 -164 26 -156 ' +
  'C 29 -146 29 -118 31 -84 C 33 -50 37 -24 41 0 Z';

/**
 * A person, sized like `person()` (s = 1 is about 134 tall standing), with
 * every option-A pose and a `flip` to face left. Kneeling, bowing, weeping
 * and lying figures face right unless flipped. `spread` holds both arms out
 * level (Samson between the pillars); `climb` leans into a slope that
 * rises to the right, one hand reaching up it and one on the rock.
 */
export function fig(x: number, y: number, s: number, fill: string, pose: FigPose = 'stand', o: Place & { staffFill?: string } = {}): string {
  const f = ink(fill);
  const k = s * (134 / 204);
  let inner: string;
  let scale = k;
  switch (pose) {
    case 'kneel':
      inner = kneeler(f, 'pray');
      scale = s * 0.6;
      break;
    case 'kneelUp':
      inner = kneeler(f, 'up');
      scale = s * 0.6;
      break;
    case 'kneelFwd':
      inner = kneeler(f, 'forward');
      scale = s * 0.6;
      break;
    case 'plant':
      inner = kneeler(f, 'plant');
      scale = s * 0.6;
      break;
    case 'weep':
      inner = bowed(f);
      scale = s * 0.62;
      break;
    case 'fallen':
      inner = prostrate(f);
      scale = s * 0.72;
      break;
    case 'sit':
      inner = sitter(f, 0);
      scale = s * 0.95;
      break;
    case 'spread':
      inner =
        p(BODY, f) +
        stroke('M -20 -150 C -46 -150 -72 -150 -96 -146', f, 17) +
        stroke('M 20 -150 C 46 -150 72 -150 96 -146', f, 17) +
        circ(-100, -146, 7.5, f) +
        circ(100, -146, 7.5, f);
      break;
    case 'climb':
      inner =
        `<g transform="rotate(24)">${p(BODY, f)}` +
        stroke('M 20 -150 C 26 -180 30 -206 32 -232', f, 17) +
        circ(32, -236, 7.5, f) +
        stroke('M 18 -140 C 40 -132 58 -122 74 -112', f, 17) +
        circ(78, -110, 7.5, f) +
        '</g>';
      break;
    default:
      inner = figure(f, pose, { staffFill: o.staffFill ? ink(o.staffFill) : undefined });
  }
  return place(x, y, scale, inner, o);
}

/** A sheep, light fleece and dark head, facing right (flip for left); s = 1 is ~70 tall. */
export function sheepAt(x: number, y: number, s: number, body: string, head: string, o?: Place): string {
  return place(x, y, s, sheep(body, ink(head)), o);
}

/** A desert thorn bush - the bramble of Jotham's fable. */
export function thornBush(rand: () => number, x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, bushClump(ink(fill), undefined, rand), o);
}

/** A broad oak with one long low branch reaching right (flip for left); ~200 tall at s = 1. */
export function oak(x: number, y: number, s: number, fill: string, o?: Place): string {
  const f = ink(fill);
  const inner =
    p('M -26 0 C -14 -26 -12 -60 -22 -104 L -2 -110 C 4 -80 10 -58 14 -44 C 30 -74 64 -96 112 -104 L 118 -88 C 70 -78 36 -58 24 -26 C 22 -14 24 -6 30 0 Z', f) +
    stroke('M -14 -96 C -30 -120 -50 -128 -70 -130', f, 10) +
    ell(-60, -150, 56, 34, f) +
    ell(-6, -176, 66, 40, f) +
    ell(60, -158, 56, 34, f) +
    ell(-96, -126, 34, 20, f) +
    ell(132, -110, 46, 22, f) +
    ell(94, -124, 34, 20, f) +
    ell(10, -138, 76, 30, f);
  return place(x, y, s, inner, o);
}

/**
 * A row of low trained vines: short stocks on a wire under one long leafy
 * hedge. `n` stocks, 96 apart at s = 1, starting at x; ~110 tall. Grapes
 * hang best at (x + (i * 96 + 30) * s, y - 58 * s).
 */
export function vines(rand: () => number, x: number, y: number, s: number, fill: string, n = 3, o?: Place): string {
  const f = ink(fill);
  const end = (n - 1) * 96;
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = i * 96;
    out.push(p(`M ${px - 6} 0 C ${px - 2} -24 ${px - 9} -44 ${px - 4} -70 L ${px + 4} -70 C ${px + 2} -44 ${px + 8} -24 ${px + 6} 0 Z`, f));
  }
  for (let lx = -46; lx <= end + 46; lx += 15) {
    out.push(circ(r1(lx + (rand() - 0.5) * 6), r1(-84 - rand() * 18), r1(15 + rand() * 7), f));
  }
  out.push(box(-50, -86, end + 100, 22, f, 11));
  out.push(stroke(`M -60 -66 L ${end + 60} -66`, f, 3));
  return place(x, y, s, out.join(''), o);
}

/**
 * A black goat-hair tent: long and low on three poles, the front open; ~260
 * wide, ~90 tall at s = 1.
 */
export function blackTent(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    stroke('M -132 -58 L -168 0 M 128 -60 L 166 0', fill, 2.5) +
    p('M -132 0 L -124 -60 L -70 -86 L -20 -68 L 30 -90 L 82 -68 L 126 -60 L 134 0 Z', fill) +
    p('M -40 0 L -36 -58 L 36 -62 L 42 0 Z', LIGHT, faint(0.22)) +
    stroke('M -70 -86 L -70 0 M 30 -90 L 30 -60', LIGHT, 2.5, { opacity: 0.25 });
  return place(x, y, s, inner, o);
}

// ── sacred objects ──────────────────────────────────────────────────────────

/**
 * The ark of the covenant: a gilded chest with the mercy seat on top and two
 * cherubim whose wings meet over it. `poles` adds the carrying staves.
 * ~132 wide and ~150 tall at s = 1; `y` is the ground under its feet.
 */
export function ark(x: number, y: number, s: number, fill: string, o?: Place & { poles?: boolean }): string {
  const wingL = p('M -48 -88 C -60 -126 -34 -150 -4 -130 C -20 -124 -32 -110 -36 -84 Z', fill);
  const bodyL = p('M -62 -71 C -64 -84 -58 -94 -48 -96 C -40 -94 -36 -84 -38 -71 Z', fill) + circ(-48, -103, 7, fill);
  const inner =
    box(-56, -8, 10, 8, fill) +
    box(46, -8, 10, 8, fill) +
    box(-60, -62, 120, 56, fill, 2) +
    box(-60, -54, 120, 4, LIGHT, 0, faint(0.3)) +
    box(-60, -20, 120, 4, LIGHT, 0, faint(0.3)) +
    box(-66, -72, 132, 11, fill, 2) +
    wingL +
    bodyL +
    `<g transform="scale(-1 1)">${wingL}${bodyL}</g>` +
    (o?.poles ? box(-122, -36, 244, 7, fill, 3.5) + box(-122, -36, 244, 2.5, LIGHT, 0, faint(0.25)) : '');
  return place(x, y, s, inner, o);
}

/** A stone altar with a horn at each corner; ~100 wide, ~100 tall at s = 1. */
export function altar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const j = (x0: number, y0: number, w: number, h: number) => box(x0, y0, w, h, LIGHT, 0, faint(0.2));
  const inner =
    box(-52, -12, 104, 12, fill, 2) +
    box(-40, -76, 80, 66, fill) +
    box(-48, -88, 96, 14, fill, 3) +
    p('M -48 -86 L -48 -104 L -32 -88 Z', fill) +
    p('M 48 -86 L 48 -104 L 32 -88 Z', fill) +
    j(-40, -54, 80, 3) +
    j(-40, -32, 80, 3) +
    j(-6, -74, 3, 20) +
    j(-24, -51, 3, 19) +
    j(14, -51, 3, 19) +
    j(-4, -29, 3, 17);
  return place(x, y, s, inner, o);
}

/** Gideon's golden ephod hung on a post; `stand` colours the post. ~176 tall at s = 1. */
export function ephod(x: number, y: number, s: number, fill: string, stand: string, o?: Place): string {
  const stones: string[] = [];
  for (let r = 0; r < 4; r += 1) for (let cI = 0; cI < 3; cI += 1) stones.push(circ(-10 + cI * 10, -138 + r * 9, 3.4, LIGHT, faint(0.55)));
  const inner =
    box(-4, -176, 8, 176, stand) +
    box(-26, -8, 52, 8, stand, 3) +
    box(-38, -178, 76, 7, stand, 3) +
    p('M -36 -166 L -22 -176 L -9 -162 L 9 -162 L 22 -176 L 36 -166 L 42 -72 C 22 -62 -22 -62 -42 -72 Z', fill) +
    box(-17, -148, 34, 40, LIGHT, 3, faint(0.24)) +
    stones.join('') +
    box(-40, -98, 80, 8, LIGHT, 0, faint(0.22)) +
    p('M -36 -72 L -30 -46 L -22 -70 Z', fill) +
    p('M 36 -72 L 30 -46 L 22 -70 Z', fill);
  return place(x, y, s, inner, o);
}

/** A carved idol on a plinth, one arm raised; ~160 tall at s = 1. */
export function idol(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    box(-28, -30, 56, 30, fill, 2) +
    box(-34, -38, 68, 10, fill, 2) +
    p('M -17 -38 L -12 -112 L 12 -112 L 17 -38 Z', fill) +
    circ(0, -124, 12, fill) +
    p('M -11 -130 L 0 -160 L 11 -130 Z', fill) +
    stroke('M 9 -106 L 28 -124 L 30 -146', fill, 7) +
    stroke('M -9 -106 L -22 -84', fill, 7) +
    box(-17, -80, 34, 4, LIGHT, 0, faint(0.25));
  return place(x, y, s, inner, o);
}

/** Dagon fallen on his face: the fish-tailed trunk on the floor, head and hands broken off. ~210 long at s = 1. */
export function fallenIdol(x: number, y: number, s: number, fill: string, o?: Place): string {
  const scales: string[] = [];
  for (let i = 0; i < 4; i += 1) scales.push(stroke(`M ${-64 + i * 16} -22 q 6 8 0 16`, LIGHT, 2.5, { opacity: 0.3 }));
  const inner =
    p('M -70 0 L -68 -28 L 34 -24 L 40 0 Z', fill) +
    p('M -68 -14 L -104 -40 L -94 -14 L -104 10 Z', fill) +
    p('M 34 -24 L 42 -20 L 40 -4 Z', fill) +
    scales.join('') +
    circ(84, -12, 12, fill) +
    p('M 72 -24 L 96 -24 L 84 -42 Z', fill) +
    `<g transform="rotate(-24 116 -6)">${box(104, -10, 22, 9, fill, 4)}</g>` +
    `<g transform="rotate(18 58 -4)">${box(50, -8, 18, 8, fill, 4)}</g>`;
  return place(x, y, s, inner, o);
}

/** A standing stone, rough-hewn - Eben-Haëzer; ~150 tall at s = 1. */
export function standingStone(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    p('M -36 0 L -40 -62 L -28 -128 L 0 -150 L 26 -138 L 38 -72 L 34 0 Z', fill) +
    stroke('M -6 -132 L 4 -96 L -8 -60', LIGHT, 3, { opacity: 0.22 }) +
    stroke('M 18 -40 L 26 -14', LIGHT, 3, { opacity: 0.18 }) +
    p('M -50 0 C -40 -10 40 -10 50 0 Z', fill);
  return place(x, y, s, inner, o);
}

// ── things people hold ──────────────────────────────────────────────────────

/** A kinnor lyre: sound box, two arms, a crossbar and five strings; ~154 tall at s = 1. */
export function lyre(x: number, y: number, s: number, fill: string, o?: Place): string {
  const strings: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const sx = -16 + i * 8;
    const top = -152 + ((sx + 54) / 104) * 14;
    strings.push(stroke(`M ${sx} -44 L ${sx} ${r1(top)}`, fill, 2));
  }
  const inner =
    p('M -34 0 L 34 0 L 28 -44 L -28 -44 Z', fill) +
    ell(0, -44, 28, 5, fill) +
    stroke('M -24 -40 C -40 -80 -58 -112 -44 -150', fill, 8) +
    stroke('M 24 -40 C 36 -80 50 -106 40 -142', fill, 8) +
    stroke('M -54 -152 L 50 -138', fill, 8) +
    strings.join('');
  return place(x, y, s, inner, o);
}

/** A straight sword, point up, the pommel at (x, y); ~154 long at s = 1. Rotate with `rot`. */
export function sword(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    circ(0, -5, 6, fill) + box(-3.5, -31, 7, 27, fill, 2) + box(-21, -37, 42, 7, fill, 3) + p('M -6 -36 L -6 -136 L 0 -154 L 6 -136 L 6 -36 Z', fill);
  return place(x, y, s, inner, o);
}

/** A spear from (x1, y1) at the butt to (x2, y2) where the head starts. */
export function spear(x1: number, y1: number, x2: number, y2: number, s: number, fill: string, o?: Opts): string {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const nx = -uy;
  const ny = ux;
  const tip = [x2 + ux * 34 * s, y2 + uy * 34 * s];
  const a = [x2 + ux * 10 * s + nx * 8 * s, y2 + uy * 10 * s + ny * 8 * s];
  const b = [x2 + ux * 10 * s - nx * 8 * s, y2 + uy * 10 * s - ny * 8 * s];
  const g =
    stroke(`M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}`, fill, 5 * s) +
    `<path d="M ${r1(x2)} ${r1(y2)} L ${r1(a[0])} ${r1(a[1])} L ${r1(tip[0])} ${r1(tip[1])} L ${r1(b[0])} ${r1(b[1])} Z" fill="${fill}"/>`;
  return o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g;
}

/** A round shield seen face on, centred on (x, y); radius 30 at s = 1. */
export function shield(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    circ(0, 0, 30, fill) +
    `<circle cx="0" cy="0" r="21" fill="none" stroke="${LIGHT}" stroke-width="3" opacity="0.3"/>` +
    circ(0, 0, 7, LIGHT, faint(0.3));
  return place(x, y, s, inner, o);
}

/** A ram's horn - the shofar, or the horn of anointing oil. Mouthpiece left, bell up-right, centred on (x, y); ~100 long. */
export function horn(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    p('M -50 2 C -20 3 14 -4 32 -32 L 52 -22 C 38 6 -14 14 -50 9 Z', fill) +
    stroke('M 34 -30 L 50 -22', LIGHT, 3, { opacity: 0.35 }) +
    stroke('M -30 4 L -28 11 M -6 3 L -3 11 M 16 -6 L 22 2', LIGHT, 2.5, { opacity: 0.25 });
  return place(x, y, s, inner, o);
}

/** An earthen jar with a handle; ~72 tall at s = 1. */
export function jar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    p('M -14 0 C -32 -8 -34 -44 -16 -56 L -11 -66 L 11 -66 L 16 -56 C 34 -44 32 -8 14 0 Z', fill) +
    box(-15, -73, 30, 8, fill, 3) +
    stroke('M 14 -62 C 34 -62 38 -40 24 -30', fill, 5) +
    stroke('M -22 -40 C -14 -36 14 -36 22 -40', LIGHT, 3, { opacity: 0.3 });
  return place(x, y, s, inner, o);
}

/** A flask of anointing oil; ~54 tall at s = 1. */
export function flask(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner = ell(0, -20, 18, 20, fill) + box(-5, -50, 10, 16, fill, 2) + box(-9, -55, 18, 6, fill, 3) + ell(-6, -26, 5, 8, LIGHT, faint(0.3));
  return place(x, y, s, inner, o);
}

/** A torch: a stick with a flame; (x, y) is the flame's base. */
export function torch(x: number, y: number, s: number, stick: string, fire: string, o?: Place): string {
  const flameD = 'M 0 -66 C 16 -48 24 -30 18 -12 C 14 -2 6 2 0 2 C -6 2 -14 -2 -18 -12 C -24 -30 -16 -48 0 -66 Z';
  const inner = box(-3.5, 0, 7, 84, stick, 3) + p(flameD, fire) + `<g transform="scale(0.5) translate(0 -6)">${p(flameD, LIGHT, faint(0.55))}</g>`;
  return place(x, y, s, inner, o);
}

/** A sheepskin fleece lying on the threshing floor; ~150 wide at s = 1. */
export function fleece(x: number, y: number, s: number, fill: string, o?: Place): string {
  const curls: string[] = [];
  for (let i = -5; i <= 5; i += 1) curls.push(circ(i * 12, -20 + Math.abs(i) * 1.2, 11 - Math.abs(i) * 0.4, fill));
  const inner =
    p('M -66 -4 L -86 6 L -60 6 Z', fill) +
    p('M 66 -4 L 88 6 L 60 6 Z', fill) +
    p('M -40 0 L -46 12 L -28 4 Z', fill) +
    p('M 40 0 L 48 12 L 30 4 Z', fill) +
    ell(0, -8, 70, 14, fill) +
    curls.join('') +
    stroke('M -40 -20 q 6 -6 12 0 M -6 -24 q 6 -6 12 0 M 28 -20 q 6 -6 12 0', LIGHT, 2.5, { opacity: 0.35 });
  return place(x, y, s, inner, o);
}

/** The jawbone of an ass: the curved bone with its row of teeth, centred on (x, y); ~130 long. */
export function jawbone(x: number, y: number, s: number, fill: string, o?: Place): string {
  const teeth: string[] = [];
  for (let tx = -22; tx <= 52; tx += 9) teeth.push(box(tx, -19, 6.5, 11, fill, 2));
  const inner =
    p('M -58 -46 C -66 -24 -66 -2 -52 10 C -30 22 20 20 52 16 C 66 14 70 2 62 -6 C 40 -12 0 -12 -28 -12 C -40 -16 -44 -28 -46 -46 Z', fill) +
    p('M -42 -14 L -30 -44 L -22 -12 Z', fill) +
    teeth.join('') +
    stroke('M -50 -2 C -30 8 20 8 50 6', LIGHT, 2.5, { opacity: 0.3 });
  return place(x, y, s, inner, o);
}

/** A honeycomb of seven cells with a drip, centred on (x, y); ~72 wide. */
export function honeycomb(x: number, y: number, s: number, fill: string, o?: Place): string {
  const hex = (cx: number, cy: number) => {
    const pts: string[] = [];
    for (let k = 0; k < 6; k += 1) {
      const a = ((60 * k + 30) * Math.PI) / 180;
      pts.push(`${r1(cx + Math.cos(a) * 12)} ${r1(cy + Math.sin(a) * 12)}`);
    }
    return p(`M ${pts.join(' L ')} Z`, fill);
  };
  const cells: [number, number][] = [[0, 0], [-22.5, 0], [22.5, 0], [-11.3, -19.5], [11.3, -19.5], [-11.3, 19.5], [11.3, 19.5]];
  const inner = cells.map(([a, b]) => hex(a, b)).join('') + p('M 8 30 C 12 40 14 46 10 50 C 6 52 4 48 6 42 Z', fill);
  return place(x, y, s, inner, o);
}

/** A tambourine with jingles, centred on (x, y); radius ~28. */
export function tambourine(x: number, y: number, s: number, fill: string, o?: Place): string {
  const jingles = [0, 90, 180, 270].map((d) => {
    const a = ((d + 45) * Math.PI) / 180;
    return circ(Math.cos(a) * 25, Math.sin(a) * 25, 6, fill);
  });
  const inner = circ(0, 0, 24, fill, faint(0.55)) + `<circle cx="0" cy="0" r="24" fill="none" stroke="${fill}" stroke-width="7"/>` + jingles.join('');
  return place(x, y, s, inner, o);
}

/** Jael's tent peg standing in the ground and the mallet beside it; ~90 tall. */
export function pegMallet(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    p('M -26 0 L -31 -66 L -17 -66 L -22 0 Z', fill) +
    box(-34, -74, 20, 9, fill, 3) +
    box(2, -24, 40, 24, fill, 5) +
    stroke('M 22 -24 L 40 -92', fill, 7);
  return place(x, y, s, inner, o);
}

/** A two-wheeled farm cart going left, its bed at local y -66; ~250 long with the shaft. */
export function cart(x: number, y: number, s: number, fill: string, o?: Place): string {
  const spokes: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * i) / 3;
    spokes.push(stroke(`M 0 -28 L ${r1(Math.cos(a) * 26)} ${r1(-28 + Math.sin(a) * 26)}`, fill, 3.5));
  }
  const inner =
    `<circle cx="0" cy="-28" r="27" fill="none" stroke="${fill}" stroke-width="7"/>` +
    spokes.join('') +
    circ(0, -28, 7, fill) +
    box(-84, -66, 168, 12, fill, 2) +
    box(-84, -86, 7, 26, fill) +
    box(77, -86, 7, 26, fill) +
    box(-84, -88, 168, 6, fill, 2) +
    stroke('M -84 -58 L -168 -46', fill, 7);
  return place(x, y, s, inner, o);
}

/** A bow held upright, belly to the right, centred on (x, y); ~140 tall. */
export function bow(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner = stroke('M 0 -70 Q 48 0 0 70', fill, 7) + stroke('M 0 -70 L 0 70', fill, 2) + box(-3, -10, 9, 20, fill, 3);
  return place(x, y, s, inner, o);
}

/** An arrow pointing along `rot` degrees (0 = right), its tail at (x, y); ~116 long. */
export function arrow(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    box(0, -2, 96, 4, fill, 2) + p('M 92 -8 L 116 0 L 92 8 Z', fill) + p('M -2 0 L -12 -10 L 14 -10 L 22 0 Z', fill) + p('M -2 0 L -12 10 L 14 10 L 22 0 Z', fill);
  return place(x, y, s, inner, o);
}

/** A small coat - the little robe Hannah made, a royal mantle; ~108 wide, ~92 tall. */
export function robe(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    p('M -34 0 L -24 -62 L -50 -54 L -56 -74 L -18 -90 L -8 -84 L 8 -84 L 18 -90 L 56 -74 L 50 -54 L 24 -62 L 34 0 Z', fill) +
    stroke('M -30 -10 L 30 -10', LIGHT, 3, { opacity: 0.3 }) +
    stroke('M 0 -84 L 0 -40', LIGHT, 2.5, { opacity: 0.25 });
  return place(x, y, s, inner, o);
}

/** A torn-off strip of a robe with a ragged edge, centred on (x, y); ~60 long. */
export function rag(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    p('M -30 -12 L 26 -18 L 32 -4 L 24 2 L 30 8 L 20 12 L 26 18 L -28 14 C -34 4 -34 -4 -30 -12 Z', fill) +
    stroke('M -24 -4 L 20 -8', LIGHT, 2.5, { opacity: 0.3 });
  return place(x, y, s, inner, o);
}

/** A wooden ard plough behind oxen going left; share at local (30, 0); ~130 long. */
export function plough(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner = stroke('M -96 -44 L 14 -12', fill, 6) + p('M 4 -16 L 40 2 L 8 4 Z', fill) + stroke('M 16 -12 L 44 -74', fill, 6) + stroke('M 36 -70 L 52 -76', fill, 6);
  return place(x, y, s, inner, o);
}

/** A bier with a pall over it, carried at local y -40; ~170 long. */
export function bier(x: number, y: number, s: number, wood: string, cloth: string, o?: Place): string {
  const inner =
    box(-86, -38, 172, 6, wood, 3) +
    p('M -64 -38 C -60 -66 60 -66 64 -38 Z', cloth) +
    p('M -64 -38 L -60 -22 L 60 -22 L 64 -38 Z', cloth) +
    stroke('M -40 -46 L 40 -46', LIGHT, 3, { opacity: 0.3 });
  return place(x, y, s, inner, o);
}

/** A well mouth covered with a cloth and grain spread on it - Bahurim; ~110 wide. */
export function coveredWell(x: number, y: number, s: number, stone: string, grain: string, o?: Place): string {
  const kernels: string[] = [];
  for (let i = 0; i < 14; i += 1) {
    const kx = -34 + (i % 7) * 11 + (i > 6 ? 5 : 0);
    const ky = i > 6 ? -48 : -40;
    kernels.push(ell(kx, ky, 3.5, 2.2, LIGHT, faint(0.45)));
  }
  const inner =
    box(-48, -32, 96, 32, stone, 4) +
    box(-48, -18, 96, 3, LIGHT, 0, faint(0.2)) +
    p('M -56 -32 C -46 -42 46 -42 56 -32 L 52 -24 L -52 -24 Z', stone) +
    p('M -46 -34 C -30 -64 30 -64 46 -34 Z', grain) +
    kernels.join('');
  return place(x, y, s, inner, o);
}

/** A four-pointed star, centred on (x, y). */
export function star(x: number, y: number, r: number, fill: string, o?: Opts): string {
  return at(x, y, 1, star4(r, fill), { opacity: o?.opacity });
}

// ── places and helpers ──────────────────────────────────────────────────────

/**
 * The sanctuary at Shiloh: a courtyard screen on posts with the tent of
 * meeting behind it; `door` colours the gate curtain. ~300 wide, ~150 tall.
 */
export function sanctuary(x: number, y: number, s: number, fill: string, door: string, o?: Place): string {
  const posts: string[] = [];
  for (let px = -150; px <= 150; px += 30) posts.push(box(px - 3, -58, 6, 58, fill));
  const inner =
    box(-62, -122, 124, 80, fill) +
    p('M -70 -120 C -40 -134 40 -134 70 -120 L 66 -108 L -66 -108 Z', fill) +
    box(-62, -100, 124, 3, LIGHT, 0, faint(0.22)) +
    box(-150, -50, 300, 50, fill, 0, faint(0.88)) +
    posts.join('') +
    box(-38, -52, 76, 52, door);
  return place(x, y, s, inner, o);
}

/** A jagged lightning bolt hanging from (x, y); ~170 long at s = 1. */
export function bolt(x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, p('M 0 0 L -26 80 L -4 74 L -34 170 L 24 66 L 2 72 L 22 0 Z', fill), o);
}

/** Mirror a fragment about the vertical line x = cx - for the animals and carts that only face left. */
export function mirror(cx: number, inner: string): string {
  return `<g transform="translate(${r1(2 * cx)} 0) scale(-1 1)">${inner}</g>`;
}

/** A sling: two cords from the hand to a pouch with its stone. */
export function sling(hx: number, hy: number, px: number, py: number, s: number, fill: string): string {
  const mx = (hx + px) / 2;
  const my = (hy + py) / 2;
  const dx = px - hx;
  const dy = py - hy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 10 * s;
  const ny = (dx / len) * 10 * s;
  return (
    stroke(`M ${r1(hx)} ${r1(hy)} Q ${r1(mx + nx)} ${r1(my + ny)} ${r1(px)} ${r1(py)}`, fill, 3 * s) +
    stroke(`M ${r1(hx)} ${r1(hy)} Q ${r1(mx - nx)} ${r1(my - ny)} ${r1(px)} ${r1(py)}`, fill, 3 * s) +
    `<ellipse cx="${r1(px)}" cy="${r1(py)}" rx="${r1(15 * s)}" ry="${r1(10 * s)}" fill="${fill}"/>` +
    `<circle cx="${r1(px)}" cy="${r1(py - 2 * s)}" r="${r1(8 * s)}" fill="${LIGHT}" opacity="0.4"/>`
  );
}

/** Provisions slung over a donkey's back - two baskets and a bundle of loaves; `y` is the top of the back. ~70 wide. */
export function basketLoad(x: number, y: number, s: number, fill: string, o?: Place): string {
  const inner =
    box(-36, -4, 26, 40, fill, 7) +
    box(10, -4, 26, 40, fill, 7) +
    stroke('M -32 12 L -14 12 M 14 12 L 32 12', LIGHT, 2.5, { opacity: 0.35 }) +
    ell(0, -8, 34, 13, fill) +
    p('M -26 -14 C -24 -32 -6 -34 -4 -14 Z', fill) +
    p('M 2 -14 C 4 -34 24 -32 26 -14 Z', fill);
  return place(x, y, s, inner, o);
}
