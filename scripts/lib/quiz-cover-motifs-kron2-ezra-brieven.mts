/**
 * Extra motifs for the 2 Kronieken, Ezra, Nehemia and general-letter covers
 * (Jakobus, 1-2 Petrus, 1-3 Johannes, Judas): temple furniture (horned altar,
 * ark, bronze sea, pillars, lampstand, censer), temple and city building
 * (sanctuary, wall runs with breaches, gatehouse, pulpit, booth), instruments
 * (trumpet, lyre), arms (sword, shield, spear, arrow), and small things the
 * chapters turn on (yoke, chest, scales, jar, heap, crook, crucible, idol).
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, no
 * strokes for outlines, `y` is the ground a motif stands on. Every motif is
 * drawn in its own local units around (0, 0) and placed with `at`, so `s`
 * scales it and `flip` mirrors it. Colours are written exactly as passed: the
 * kit's light-style remapping of big depth-coloured shapes does not apply
 * here, so a scene picks its building tone itself (see `wallTone`).
 */

import type { C } from './quiz-cover-scene-kit.mjs';
import {
  at,
  bowed,
  figure,
  fire,
  flame,
  kneeler,
  mix,
  prostrate,
  scrollShape,
  sheep as aSheep,
  sitter,
  wing,
  type Pose as APose,
} from './cover-options/shapes.mjs';
import { ink } from './quiz-cover-primitives.mjs';

type O = { opacity?: number; flip?: boolean; rot?: number };

const n = (v: number) => (Math.round(v * 10) / 10).toString();
const opa = (op?: number) => (op !== undefined && op !== 1 ? ` opacity="${op}"` : '');
const P = (d: string, fill: string, op?: number) => `<path d="${d}" fill="${fill}"${opa(op)}/>`;
const R = (x: number, y: number, w: number, h: number, fill: string, rx = 0, op?: number) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''} fill="${fill}"${opa(op)}/>`;
const Ci = (x: number, y: number, r: number, fill: string, op?: number) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}"${opa(op)}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, op?: number) =>
  `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${opa(op)}/>`;
const S = (d: string, stroke: string, w: number, op?: number) =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"${opa(op)}/>`;
const mirror = (inner: string) => `<g transform="scale(-1 1)">${inner}</g>`;
const place = (x: number, y: number, s: number, inner: string, o: O = {}) => at(x, y, s, inner, { flip: o.flip, rot: o.rot, opacity: o.opacity });

/** The tone the kit gives large walls: a mid layer pulled toward the silhouette colour. */
export function wallTone(c: C, k = 0.32): string {
  return mix(c.a.mid, c.a.figure, k);
}

/** Mirror any canvas-space fragment about the vertical line through x (for primitives that only face one way). */
export function flipX(x: number, inner: string): string {
  return `<g transform="translate(${n(2 * x)} 0) scale(-1 1)">${inner}</g>`;
}

/** A three-layer fire (option A), base on `y`; ~120 tall, 100 wide at s = 1. */
export function blaze(x: number, y: number, s: number, outer: string, middle: string, core = '#FFFFFF', o: O = {}): string {
  return place(x, y, s, fire(120, 100, outer, middle, core), o);
}

/** A pillar of fire standing on `y` (Nehemia 9: "des nachts door een vuurkolom"); h tall, w wide, with a lighter core. */
export function fireColumn(x: number, y: number, h: number, w: number, outer: string, inner: string, o: O = {}): string {
  const side = (k: number, hh: number, phase: number) => {
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i <= 12; i += 1) {
      const t = i / 12;
      const wob = 0.86 + 0.18 * Math.sin(t * 15 + phase) - t * 0.35;
      left.push(`L ${n(-k * wob)} ${n(-hh * t)}`);
      right.unshift(`L ${n(k * (wob + 0.06 * Math.sin(t * 11)))} ${n(-hh * t)}`);
    }
    return `M 0 0 ${left.join(' ')} C ${n(-k * 0.4)} ${n(-hh * 1.04)} ${n(-k * 0.1)} ${n(-hh * 1.08)} 0 ${n(-hh * 1.14)} C ${n(k * 0.1)} ${n(-hh * 1.08)} ${n(k * 0.4)} ${n(-hh * 1.04)} ${n(k * 0.5)} ${n(-hh)} ${right.join(' ')} Z`;
  };
  const g = P(side(w / 2, h, 0), outer) + P(side(w / 4.2, h * 0.84, 1.3), inner) + P(side(w / 12, h * 0.6, 2.1), '#FFFFFF', 0.8);
  return place(x, y, 1, g, o);
}

/** An open scroll: the sheet between two rolls; ~208 wide, 146 tall, bottom on `y`. */
export function openScroll(x: number, y: number, s: number, paper: string, roll: string, lines?: string, o: O = {}): string {
  return place(x, y, s, scrollShape(paper, roll, lines), o);
}

/** A clay oil lamp with a tall flame; ~110 tall with the flame, ~130 long. */
export function oilLamp(x: number, y: number, s: number, body: string, flameFill: string, o: O = {}): string {
  return place(x, y, s, P('M -56 -10 C -56 -34 30 -40 46 -24 L 74 -38 L 66 -20 C 60 -6 30 0 -20 0 C -40 0 -56 -2 -56 -10 Z', body) + at(70, -36, 0.62, flame(120, 60, flameFill)), o);
}

/** A camel walking left with its head raised (from the Matteus set), ~150 tall. */
export function camel(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const f = ink(fill);
  const g =
    E(0, -62, 54, 24, f) +
    Ci(-16, -86, 22, f) +
    Ci(22, -84, 20, f) +
    R(-44, -62, 9, 62, f, 4) +
    R(-24, -62, 9, 62, f, 4) +
    R(12, -62, 9, 62, f, 4) +
    R(34, -62, 9, 62, f, 4) +
    P('M -40 -76 L -54 -66 L -84 -124 L -70 -130 Z', f) +
    E(-84, -130, 17, 9, f) +
    P('M -76 -136 L -70 -148 L -66 -134 Z', f) +
    S('M 50 -66 q 16 10 8 34', f, 4);
  return place(x, y, s, g, o);
}

// ── people ─────────────────────────────────────────────────────────────────

export type FigPose = APose | 'kneel' | 'kneelUp' | 'kneelFwd' | 'kneelPlant' | 'bowed' | 'sit' | 'fallen';

const K = 134 / 204;

/**
 * A person at the kit's scale (s = 1 is ~134 px standing), with the option-A
 * poses `person` leaves out (bless, staff, reach, shield, kneeling with arms
 * up or forward, bowed with the face in the hands) and a mirror. Kneeling,
 * bowed and fallen figures face right unless flipped.
 */
export function fig(x: number, y: number, s: number, fill: string, pose: FigPose = 'stand', o: O & { staffFill?: string } = {}): string {
  const f = ink(fill);
  let k: number;
  let inner: string;
  if (pose === 'kneel' || pose === 'kneelUp' || pose === 'kneelFwd' || pose === 'kneelPlant') {
    k = s * 0.6;
    inner = kneeler(f, pose === 'kneelUp' ? 'up' : pose === 'kneelFwd' ? 'forward' : pose === 'kneelPlant' ? 'plant' : 'pray');
  } else if (pose === 'bowed') {
    k = s * 0.6;
    inner = bowed(f);
  } else if (pose === 'sit') {
    k = s * 0.95;
    inner = sitter(f, 0);
  } else if (pose === 'fallen') {
    k = s * 0.72;
    inner = prostrate(f);
  } else {
    k = s * K;
    inner = figure(f, pose, { staffFill: o.staffFill ? ink(o.staffFill) : undefined });
  }
  return place(x, y, k, inner, o);
}

/**
 * A standing figure with something drawn in its own local units (204 tall,
 * origin between the feet): the right hand of `reach` is at (80, -103), of
 * `bless` at (77, -161), of `shield` at the face (16, -184), and `carry`
 * holds both hands at the chest (0, -104).
 */
export function figWith(x: number, y: number, s: number, fill: string, pose: APose, item: string, o: O = {}): string {
  return place(x, y, s * K, figure(ink(fill), pose) + item, o);
}

/** Place a local fragment inside `figWith`'s units. */
export function held(x: number, y: number, s: number, inner: string, o: O = {}): string {
  return place(x, y, s, inner, o);
}

/** Someone blowing a long trumpet raised toward the sky. */
export function trumpeter(x: number, y: number, s: number, fill: string, horn: string, o: O = {}): string {
  return place(x, y, s * K, figure(ink(fill), 'shield') + at(14, -186, 1.05, trumpetLocal(horn), { rot: -36 }), o);
}

/** A Levite singer with a lyre held at the chest. */
export function lyrePlayer(x: number, y: number, s: number, fill: string, lyreFill: string, o: O = {}): string {
  return place(x, y, s * K, figure(ink(fill), 'carry') + at(10, -60, 0.78, lyreLocal(lyreFill)), o);
}

// ── temple furniture ───────────────────────────────────────────────────────

function altarLocal(fill: string, deep: string): string {
  return (
    R(-74, -14, 148, 14, fill, 2) +
    R(-62, -92, 124, 80, fill) +
    R(-62, -56, 124, 8, deep, 0, 0.45) +
    R(-68, -102, 136, 12, fill, 3) +
    P('M -68 -100 L -66 -126 Q -58 -114 -50 -100 Z', fill) +
    P('M 68 -100 L 66 -126 Q 58 -114 50 -100 Z', fill)
  );
}

/** The bronze altar of burnt offering with its four horns; ~126 tall at s = 1, top at y - 102 s. */
export function hornedAltar(x: number, y: number, s: number, fill: string, deep = fill, o: O = {}): string {
  return place(x, y, s, altarLocal(fill, deep), o);
}

/** A stone altar of rough unhewn blocks (Ezra 3); ~84 tall, top at y - 84 s. */
export function stoneAltar(x: number, y: number, s: number, fill: string, seam: string, o: O = {}): string {
  const g =
    P('M -70 0 L -66 -44 L -60 -84 L 60 -84 L 66 -44 L 70 0 Z', fill) +
    S('M -66 -44 L 66 -44 M -62 -66 L 62 -66 M -68 -22 L 68 -22', seam, 3, 0.5) +
    S('M -20 -84 L -22 -66 M 26 -66 L 24 -44 M -30 -44 L -32 -22 M 14 -22 L 16 0', seam, 3, 0.5);
  return place(x, y, s, g, o);
}

function arkLocal(fill: string, deep: string): string {
  // Each cherub: a small kneeling body at the end of the lid and one wing
  // stretched over the mercy seat, the two wing tips meeting in the middle.
  const cherub = R(-56, -80, 16, 24, fill, 6) + Ci(-48, -86, 8, fill) + at(-46, -76, 0.42, wing(fill, 200), { rot: 40 });
  return (
    R(-118, -30, 236, 7, deep, 3) +
    R(-56, -52, 112, 52, fill, 2) +
    R(-56, -38, 112, 5, deep, 0, 0.5) +
    R(-60, -60, 120, 9, fill, 2) +
    cherub +
    mirror(cherub)
  );
}

/** The ark of the covenant with its poles and the cherubim's wings over the mercy seat; ~110 tall, poles 236 wide. `y` is the chest's floor. */
export function arkOfCovenant(x: number, y: number, s: number, fill: string, deep = fill, o: O = {}): string {
  return place(x, y, s, arkLocal(fill, deep), o);
}

function oxSide(fill: string): string {
  return (
    E(0, -52, 50, 23, fill) +
    R(-40, -42, 11, 42, fill, 5) +
    R(-22, -42, 11, 42, fill, 5) +
    R(14, -42, 11, 42, fill, 5) +
    R(32, -42, 11, 42, fill, 5) +
    P('M -36 -70 L -60 -76 L -76 -60 L -64 -44 L -40 -42 Z', fill) +
    Ci(-72, -60, 12, fill) +
    S('M -72 -70 Q -84 -84 -70 -90', fill, 5) +
    S('M 48 -58 Q 58 -42 54 -26', fill, 4)
  );
}

/** The molten sea: a great basin with a lily brim, standing on oxen that face outward; ~160 tall, 280 wide. */
export function bronzeSea(x: number, y: number, s: number, basin: string, oxen: string, deep = basin, o: O = {}): string {
  const knops: string[] = [];
  for (let i = -5; i <= 5; i += 1) knops.push(Ci(i * 22, -126, 4.5, deep, 0.55));
  const ox = ink(oxen);
  const g =
    at(-74, 0, 1, oxSide(ox)) +
    at(74, 0, 1, oxSide(ox), { flip: true }) +
    E(0, -52, 34, 26, ox) +
    E(0, -36, 15, 22, ox) +
    S('M -14 -66 Q -30 -74 -26 -88 M 14 -66 Q 30 -74 26 -88', ox, 5) +
    R(-24, -42, 11, 42, ox, 5) +
    R(13, -42, 11, 42, ox, 5) +
    P('M -134 -150 L 134 -150 C 130 -118 104 -88 62 -80 L -62 -80 C -104 -88 -130 -118 -134 -150 Z', basin) +
    R(-142, -160, 284, 14, basin, 7) +
    R(-126, -140, 252, 5, deep, 0, 0.5) +
    knops.join('');
  return place(x, y, s, g, o);
}

/** One of the two bronze pillars, Jachin or Boaz: shaft, a bowl capital with lily-work and a row of pomegranates; ~300 tall. */
export function templePillar(x: number, y: number, s: number, fill: string, deep = fill, o: O = {}): string {
  const pom: string[] = [];
  for (let i = -3; i <= 3; i += 1) pom.push(Ci(i * 10, -240, 5.5, deep, 0.7));
  const g =
    R(-30, -16, 60, 16, fill, 2) +
    R(-22, -24, 44, 10, fill, 2) +
    R(-17, -232, 34, 212, fill) +
    R(-24, -238, 48, 9, fill, 2) +
    P('M -34 -238 C -46 -262 -36 -288 -20 -296 L 20 -296 C 36 -288 46 -262 34 -238 Z', fill) +
    pom.join('') +
    S('M -28 -262 Q 0 -250 28 -262 M -30 -278 Q 0 -266 30 -278', deep, 3, 0.55) +
    P('M -24 -296 C -30 -312 -14 -316 -10 -304 C -6 -322 6 -322 10 -304 C 14 -316 30 -312 24 -296 Z', fill);
  return place(x, y, s, g, o);
}

/** The seven-branched golden lampstand; ~150 tall, flames on top in `flameFill`. */
export function menorah(x: number, y: number, s: number, fill: string, flameFill: string, o: O = {}): string {
  const out = [P('M -34 0 L -20 -18 L 20 -18 L 34 0 Z', fill), R(-4, -136, 8, 120, fill, 3)];
  for (const r of [28, 54, 80]) out.push(S(`M ${-r} -134 C ${-r} ${-134 + r * 1.1} ${r} ${-134 + r * 1.1} ${r} -134`, fill, 7));
  for (const cx of [-80, -54, -28, 0, 28, 54, 80]) {
    out.push(R(cx - 7, -142, 14, 9, fill, 2));
    out.push(P(`M ${cx} -170 C ${cx + 7} -160 ${cx + 7} -150 ${cx} -146 C ${cx - 7} -150 ${cx - 7} -160 ${cx} -170 Z`, flameFill));
  }
  return place(x, y, s, out.join(''), o);
}

/** A censer held by its handle at the origin, the fire-pan forward and incense smoke rising; ~130 tall. */
export function censer(x: number, y: number, s: number, fill: string, smoke: string, o: O = {}): string {
  const g =
    S('M 0 0 L 58 -10', fill, 6) +
    P('M 50 -16 L 106 -16 C 104 2 52 2 50 -16 Z', fill) +
    E(78, -16, 28, 5, fill) +
    S('M 70 -24 C 58 -46 86 -60 72 -84 C 62 -100 80 -112 72 -128', smoke, 6, 0.75) +
    S('M 88 -24 C 98 -44 80 -58 94 -78 C 102 -92 92 -104 98 -114', smoke, 4.5, 0.6);
  return place(x, y, s, g, o);
}

// ── buildings ──────────────────────────────────────────────────────────────

/**
 * Solomon's house of the LORD seen from the front: the tall porch, the house
 * behind it and the lower side chambers; ~258 tall, 380 wide. `door` fills
 * the doorway (a glow, or the wall colour for a shut house).
 */
export function sanctuary(x: number, y: number, s: number, fill: string, door?: string, o: O = {}): string {
  // Flat roofs with a cornice, no battlements: a house of worship, not a fort.
  const out = [R(-190, -104, 380, 104, fill), R(-196, -112, 392, 10, fill, 2)];
  out.push(R(-132, -176, 264, 176, fill), R(-140, -186, 280, 12, fill, 2));
  out.push(R(-64, -250, 128, 250, fill), R(-74, -262, 148, 14, fill, 2), R(-58, -272, 116, 12, fill, 2));
  out.push(R(-70, -210, 140, 8, fill));
  if (door) out.push(P('M -26 0 L -26 -78 A 26 26 0 0 1 26 -78 L 26 0 Z', door));
  return place(x, y, s, out.join(''), o);
}

/** A gatehouse: two towers and an arched gateway; doors shut, swung open, or none (a dark breach). ~186 tall, 220 wide. */
export function gatehouse(
  x: number,
  y: number,
  s: number,
  fill: string,
  o: O & { doors?: string; open?: boolean; inside?: string; seam?: string } = {},
): string {
  const out = [
    P('M -112 0 L -112 -172 L -42 -172 L -42 -150 L 42 -150 L 42 -172 L 112 -172 L 112 0 L 42 0 L 42 -78 A 42 42 0 0 0 -42 -78 L -42 0 Z', fill),
  ];
  for (const bx of [-112, -88, -64, 46, 70, 94]) out.push(R(bx, -186, 16, 16, fill));
  out.push(R(-10, -164, 20, 14, fill));
  if (o.inside) out.push(P('M -42 0 L -42 -78 A 42 42 0 0 1 42 -78 L 42 0 Z', o.inside));
  if (o.doors && !o.open) {
    out.push(P('M -42 0 L -42 -78 A 42 42 0 0 1 42 -78 L 42 0 Z', o.doors));
    out.push(S('M 0 -118 L 0 0', o.seam ?? fill, 3, 0.6));
    out.push(S('M -42 -60 L 42 -60 M -42 -24 L 42 -24', o.seam ?? fill, 3, 0.4));
  }
  if (o.doors && o.open) {
    out.push(P('M -42 0 L -42 -100 L -70 -92 L -70 6 Z', o.doors));
    out.push(P('M 42 0 L 42 -100 L 70 -92 L 70 6 Z', o.doors));
  }
  return place(x, y, s, out.join(''), o);
}

/**
 * A run of city wall from x0 to x1 standing on `y`, `h` tall, with
 * battlements, faint stone courses, and optional breaches where the wall is
 * down to a heap of rubble. Drawn at canvas scale, not with `s`.
 */
export function wallRun(
  x0: number,
  x1: number,
  y: number,
  h: number,
  fill: string,
  o: { gaps?: [number, number][]; merlon?: number; courses?: string; opacity?: number } = {},
): string {
  const gaps = [...(o.gaps ?? [])].sort((a, b) => a[0] - b[0]);
  const segs: [number, number][] = [];
  let cur = x0;
  for (const [a, b] of gaps) {
    if (a > cur) segs.push([cur, a]);
    cur = b;
  }
  if (cur < x1) segs.push([cur, x1]);
  const m = o.merlon ?? 14;
  const out: string[] = [];
  for (const [a, b] of segs) {
    out.push(R(a, y - h, b - a, h, fill));
    if (m > 0) for (let px = a; px + m <= b; px += m * 1.8) out.push(R(px, y - h - m, m, m, fill));
    if (o.courses) for (let yy = y - h + 18; yy < y - 6; yy += 20) out.push(R(a, yy, b - a, 2.4, o.courses, 0, 0.3));
  }
  for (const [a, b] of gaps) {
    const w = b - a;
    out.push(
      P(
        `M ${n(a - 2)} ${n(y - h)} L ${n(a + w * 0.1)} ${n(y - h * 0.62)} L ${n(a + w * 0.2)} ${n(y - h * 0.7)} L ${n(a + w * 0.32)} ${n(y - h * 0.32)} ` +
          `L ${n(a + w * 0.5)} ${n(y - h * 0.24)} L ${n(a + w * 0.66)} ${n(y - h * 0.4)} L ${n(a + w * 0.8)} ${n(y - h * 0.56)} L ${n(a + w * 0.9)} ${n(y - h * 0.82)} ` +
          `L ${n(b + 2)} ${n(y - h)} L ${n(b + 2)} ${n(y)} L ${n(a - 2)} ${n(y)} Z`,
        fill,
      ),
    );
    for (let i = 0; i < 3; i += 1) {
      const bx = a + w * (0.2 + i * 0.28);
      out.push(R(bx, y + 4 + (i % 2) * 6, 18, 11, fill, 2));
    }
  }
  const g = out.join('');
  return o.opacity !== undefined ? `<g opacity="${o.opacity}">${g}</g>` : g;
}

/** Ezra's wooden pulpit: a raised platform on legs with a rail; a reader stands on y - 120 s. ~150 tall, 170 wide. */
export function pulpit(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const g =
    R(-84, -122, 168, 14, fill, 2) +
    R(-76, -110, 11, 110, fill) +
    R(65, -110, 11, 110, fill) +
    R(-20, -110, 9, 110, fill, 0, 0.7) +
    S('M -66 -100 L 64 -10 M 64 -100 L -66 -10', fill, 6, 0.55) +
    R(-84, -156, 6, 36, fill) +
    R(78, -156, 6, 36, fill) +
    R(-84, -158, 168, 6, fill, 2);
  return place(x, y, s, g, o);
}

/** A booth of leafy branches on four poles (Loofhuttenfeest); ~140 tall, 170 wide. */
export function booth(x: number, y: number, s: number, pole: string, leaf: string, o: O = {}): string {
  const out = [R(-78, -124, 7, 124, pole), R(70, -124, 7, 124, pole), R(-30, -118, 5, 118, pole, 0, 0.6), R(26, -118, 5, 118, pole, 0, 0.6)];
  const leaves = [-84, -62, -40, -18, 4, 26, 48, 70, 88];
  leaves.forEach((lx, i) => out.push(E(lx, -128 - (i % 3) * 5, 24, 13, leaf)));
  out.push(E(-6, -142, 60, 14, leaf));
  for (let i = 0; i < 5; i += 1) out.push(E(-84 + i * 4, -104 + i * 16, 10, 16, leaf, 0.85));
  return place(x, y, s, out.join(''), o);
}

// ── instruments, arms ──────────────────────────────────────────────────────

/** A long straight trumpet, mouthpiece at the origin, bell to the right; ~134 long. */
export function trumpetLocal(fill: string): string {
  return P('M 0 -4 L 102 -7 C 114 -9 124 -18 130 -26 L 135 -26 L 135 26 L 130 26 C 124 18 114 9 102 7 L 0 4 Z', fill);
}

export function trumpet(x: number, y: number, s: number, fill: string, o: O = {}): string {
  return place(x, y, s, trumpetLocal(fill), o);
}

/** A lyre (kinnor) standing on its sound box; ~124 tall. */
export function lyreLocal(fill: string): string {
  let strings = '';
  for (const sx of [-18, -6, 6, 18]) strings += S(`M ${sx} -14 L ${n(sx * 0.9)} -106`, fill, 2.6);
  return (
    S('M -34 -6 C -50 -40 -46 -86 -30 -118', fill, 9) +
    S('M 34 -6 C 50 -40 46 -86 30 -118', fill, 9) +
    S('M -40 -108 L 40 -108', fill, 8) +
    E(0, -10, 42, 14, fill) +
    strings
  );
}

export function lyre(x: number, y: number, s: number, fill: string, o: O = {}): string {
  return place(x, y, s, lyreLocal(fill), o);
}

/** An upright sword, point up, pommel on `y`; ~150 tall. */
export function sword(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const g = P('M 0 -152 L 9 -130 L 9 -42 L -9 -42 L -9 -130 Z', fill) + R(-30, -44, 60, 10, fill, 4) + R(-5, -34, 10, 26, fill, 3) + Ci(0, -6, 8, fill);
  return place(x, y, s, g, o);
}

/** A round shield with a raised boss, resting on its rim at `y`; 88 across. */
export function shield(x: number, y: number, s: number, fill: string, boss = fill, o: O = {}): string {
  const g = Ci(0, -44, 44, fill) + Ci(0, -44, 31, boss, 0.35) + Ci(0, -44, 10, fill);
  return place(x, y, s, g, o);
}

/** A spear standing on its butt; ~262 tall. */
export function spear(x: number, y: number, s: number, fill: string, o: O = {}): string {
  return place(x, y, s, S('M 0 0 L 0 -232', fill, 5) + P('M 0 -262 L 8 -238 L 0 -228 L -8 -238 Z', fill), o);
}

/** An arrow pointing right, tail at the origin; ~132 long. */
export function arrow(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const g = S('M 0 0 L 116 0', fill, 4) + P('M 132 0 L 112 -9 L 117 0 L 112 9 Z', fill) + P('M -2 0 L -14 -10 L 12 -2 Z', fill) + P('M -2 0 L -14 10 L 12 2 Z', fill);
  return place(x, y, s, g, o);
}

// ── objects ────────────────────────────────────────────────────────────────

/** A wooden yoke lying on the ground: the beam and the two bows; `broken` snaps the beam. ~200 wide. */
export function yoke(x: number, y: number, s: number, fill: string, broken = false, o: O = {}): string {
  const half =
    P('M -106 -6 C -72 -18 -30 -20 -6 -18 L -6 0 C -30 -2 -72 0 -106 10 Z', fill) +
    Ci(-100, 2, 9, fill) +
    S('M -74 -4 C -74 40 -30 40 -30 -8', fill, 11);
  const g = broken
    ? at(-14, 12, 1, half, { rot: -10 }) + at(18, 18, 1, mirror(half), { rot: 14 })
    : half + mirror(half);
  return place(x, y - 30 * s, s, g, o);
}

/** A wooden chest with a hole bored in its lid (Joas's offering chest) or a plain lid; ~76 tall, 108 wide. */
export function chest(x: number, y: number, s: number, fill: string, deep: string, slot = true, o: O = {}): string {
  const g =
    R(-52, -56, 104, 56, fill, 3) +
    R(-52, -42, 104, 5, deep, 0, 0.45) +
    R(-52, -18, 104, 5, deep, 0, 0.45) +
    P('M -56 -54 L -56 -62 C -42 -80 42 -80 56 -62 L 56 -54 Z', fill) +
    (slot ? R(-14, -76, 28, 6, deep, 3) : R(-8, -50, 16, 14, deep, 3, 0.7));
  return place(x, y, s, g, o);
}

/** A balance: post, beam and two hanging pans; ~160 tall, 200 wide. `tilt` in degrees dips the right pan. */
export function scales(x: number, y: number, s: number, fill: string, tilt = 0, o: O = {}): string {
  const pan = (px: number) =>
    S(`M ${px} -148 L ${px - 18} -96 M ${px} -148 L ${px + 18} -96`, fill, 2.5) + P(`M ${px - 24} -96 L ${px + 24} -96 C ${px + 20} -80 ${px - 20} -80 ${px - 24} -96 Z`, fill);
  const beam = R(-84, -152, 168, 7, fill, 3) + pan(-76) + pan(76);
  const g = R(-32, -8, 64, 8, fill, 3) + R(-4, -156, 8, 150, fill, 3) + at(0, -150, 1, `<g transform="translate(0 150)">${beam}</g>`, { rot: tilt }) + Ci(0, -160, 8, fill);
  return place(x, y, s, g, o);
}

/** A storage jar (for oil, wine or grain); ~104 tall. */
export function jar(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const g =
    P('M -10 -96 L 10 -96 L 12 -84 C 36 -74 38 -40 24 -14 L 14 0 L -14 0 L -24 -14 C -38 -40 -36 -74 -12 -84 Z', fill) +
    R(-15, -104, 30, 8, fill, 3) +
    S('M -12 -88 C -30 -90 -30 -68 -22 -62', fill, 5) +
    S('M 12 -88 C 30 -90 30 -68 22 -62', fill, 5);
  return place(x, y, s, g, o);
}

/** A heap of grain or gifts with a few sheaf ends showing; ~84 tall, 200 wide. */
export function heap(x: number, y: number, s: number, fill: string, grain: string, o: O = {}): string {
  const out = [P('M -100 0 C -82 -42 -42 -80 0 -82 C 42 -80 82 -42 100 0 Z', fill)];
  for (let i = 0; i < 26; i += 1) {
    const t = (i * 0.618) % 1;
    const u = ((i * 0.381 + 0.13) * 1.7) % 1;
    const px = (t - 0.5) * 150 * (1 - u * 0.5);
    const py = -8 - u * 66;
    out.push(E(px, py, 4, 6.5, grain, 0.55));
  }
  return place(x, y, s, out.join(''), o);
}

/** A money bag tied at the neck; ~66 tall. */
export function moneyBag(x: number, y: number, s: number, fill: string, tie = fill, o: O = {}): string {
  const g = P('M -30 0 C -42 -30 -28 -50 -10 -54 L -16 -66 L 16 -66 L 10 -54 C 28 -50 42 -30 30 0 Z', fill) + R(-14, -60, 28, 6, tie, 3);
  return place(x, y, s, g, o);
}

/** A swaddled baby, lying; centre at the origin; ~64 long. */
export function swaddled(x: number, y: number, s: number, fill: string, o: O = {}): string {
  return place(x, y, s, E(4, 0, 28, 12, fill) + Ci(-26, -2, 10, fill), o);
}

/** A shepherd's crook standing on its foot; ~244 tall. */
export function crook(x: number, y: number, s: number, fill: string, o: O = {}): string {
  return place(x, y, s, S('M 0 0 L 0 -210 C 0 -246 44 -246 44 -212 L 42 -202', fill, 8), o);
}

/** A refiner's furnace: a stone kiln with fire in its mouth and a crucible of molten metal on top; ~150 tall. */
export function furnace(x: number, y: number, s: number, stone: string, fire: string, pot: string, metal: string, o: O = {}): string {
  const g =
    P('M -76 0 L -70 -72 C -64 -112 64 -112 70 -72 L 76 0 Z', stone) +
    P('M -28 0 L -28 -34 A 28 28 0 0 1 28 -34 L 28 0 Z', fire) +
    P('M -12 0 C -16 -20 -4 -30 0 -44 C 6 -28 16 -20 12 0 Z', mix(fire, '#FFFFFF', 0.5)) +
    P('M -44 -138 L 44 -138 L 34 -104 C 24 -96 -24 -96 -34 -104 Z', pot) +
    E(0, -138, 44, 9, metal) +
    R(-50, -104, 100, 8, stone, 3);
  return place(x, y, s, g, o);
}

/** A carved idol on a plinth, arms at its sides and a horned headdress; ~196 tall. */
export function idol(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const g =
    R(-38, -26, 76, 26, fill, 2) +
    P('M -22 -26 L -27 -124 L 27 -124 L 22 -26 Z', fill) +
    R(-36, -134, 72, 16, fill, 7) +
    R(-36, -128, 10, 64, fill, 5) +
    R(26, -128, 10, 64, fill, 5) +
    Ci(0, -152, 18, fill) +
    P('M -22 -162 L -30 -196 L -8 -168 L 0 -200 L 8 -168 L 30 -196 L 22 -162 Z', fill);
  return place(x, y, s, g, o);
}

/** A bull-calf image standing on a plinth (Jerobeam's calves at Bethel and Dan); ~150 tall. */
export function calfIdol(x: number, y: number, s: number, fill: string, plinth: string, o: O = {}): string {
  const body =
    E(0, -54, 52, 24, fill) +
    R(-40, -46, 11, 46, fill, 5) +
    R(-22, -46, 11, 46, fill, 5) +
    R(14, -46, 11, 46, fill, 5) +
    R(32, -46, 11, 46, fill, 5) +
    P('M -34 -70 L -56 -90 L -72 -80 L -66 -60 L -40 -48 Z', fill) +
    E(-70, -80, 13, 11, fill) +
    S('M -74 -88 Q -86 -100 -76 -108 M -64 -90 Q -60 -104 -50 -106', fill, 5) +
    S('M 50 -60 Q 60 -40 56 -24', fill, 4);
  const g = R(-70, -34, 140, 34, plinth, 3) + R(-60, -44, 120, 12, plinth, 3) + at(0, -44, 1, body);
  return place(x, y, s, g, o);
}

/** A cedar of Lebanon: a straight trunk with flat tiers of foliage; ~200 tall, 190 wide. */
export function cedar(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const f = ink(fill);
  const g =
    P('M -10 0 L -6 -168 L 6 -168 L 10 0 Z', f) +
    S('M 0 -64 L -70 -76 M 0 -100 L 60 -108 M 0 -132 L -46 -140', f, 6) +
    E(-14, -74, 92, 17, f) +
    E(18, -108, 78, 15, f) +
    E(-8, -140, 62, 14, f) +
    E(6, -168, 42, 12, f) +
    E(0, -190, 22, 10, f);
  return place(x, y, s, g, o);
}

/** Cedar logs bound into a raft, floating; `y` is the waterline; ~70 tall, 240 long. */
export function logRaft(x: number, y: number, s: number, fill: string, deep: string, o: O = {}): string {
  const out: string[] = [];
  const rows = [
    { y: 6, l: -124, r: 124, d: 15 },
    { y: -20, l: -114, r: 110, d: 14 },
    { y: -44, l: -98, r: 92, d: 13 },
  ];
  for (const row of rows) {
    out.push(R(row.l, row.y - row.d, row.r - row.l, row.d * 2, fill, row.d));
    out.push(E(row.r - row.d * 0.5, row.y, row.d * 0.5, row.d * 0.86, deep, 0.45));
  }
  out.push(R(-66, -60, 9, 82, deep, 3, 0.75), R(54, -60, 9, 82, deep, 3, 0.75));
  return place(x, y, s, out.join(''), o);
}

/** A cooking pot on three short legs; ~72 tall. */
export function cookPot(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const g =
    S('M -26 -14 L -34 0 M 26 -14 L 34 0 M 0 -10 L 0 0', fill, 6) +
    P('M -44 -66 L 44 -66 C 48 -34 32 -10 0 -10 C -32 -10 -48 -34 -44 -66 Z', fill) +
    R(-50, -72, 100, 9, fill, 4);
  return place(x, y, s, g, o);
}

/** A lamb standing, facing right; ~70 tall (option-A sheep). */
export function lamb(x: number, y: number, s: number, body: string, head: string, o: O = {}): string {
  return place(x, y, s, aSheep(body, ink(head)), o);
}

/** A lion on the prowl, head low, facing left; ~110 tall, 230 long. */
export function prowlingLion(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const f = ink(fill);
  const g =
    P('M -60 -70 C -40 -86 40 -86 76 -72 C 92 -64 96 -44 88 -34 L -56 -36 C -66 -44 -68 -60 -60 -70 Z', f) +
    R(-52, -50, 14, 50, f, 6) +
    R(-30, -46, 13, 44, f, 6, 0.85) +
    R(56, -50, 14, 50, f, 6) +
    R(76, -46, 13, 46, f, 6, 0.85) +
    // A shaggy mane (a ring of tufts) and a squared muzzle pushed forward.
    P('M -40 -98 L -52 -112 L -64 -106 L -78 -118 L -88 -104 L -104 -110 L -106 -92 L -122 -86 L -112 -72 L -124 -58 L -108 -50 L -110 -32 L -92 -34 L -82 -20 L -70 -32 L -54 -26 L -48 -44 L -36 -50 Z', f) +
    P('M -104 -78 L -136 -72 C -142 -64 -140 -52 -132 -48 L -106 -46 Z', f) +
    P('M -88 -100 L -96 -114 L -80 -108 Z', f) +
    S('M 88 -60 C 120 -70 120 -100 136 -104', f, 7) +
    Ci(138, -106, 9, f);
  return place(x, y, s, g, o);
}

/** A bare, dead tree torn out with its roots in the air (Judas 12: "tweemaal gestorven en ontworteld"). Lies across ~220 px. */
export function uprootedTree(x: number, y: number, s: number, fill: string, o: O = {}): string {
  const f = ink(fill);
  const tree =
    P('M -12 0 L -6 -150 L 6 -150 L 12 0 Z', f) +
    S('M 0 -90 L -50 -140 M -30 -118 L -40 -160 M 0 -120 L 44 -176 M 22 -148 L 52 -150 M 0 -150 L -6 -200', f, 7) +
    S('M -8 4 L -46 30 M 0 6 L -10 46 M 8 4 L 40 34 M -20 18 L -56 12 M 18 18 L 54 14', f, 6);
  return place(x, y, s, at(0, 0, 1, tree, { rot: 72 }), o);
}

/** A falling star with its trail, head at the origin moving down-left. */
export function fallingStar(x: number, y: number, s: number, fill: string, o: O = {}): string {
  return place(x, y, s, P('M 0 -3 L 120 -48 L 122 -42 L 0 4 Z', fill, 0.55) + Ci(0, 0, 6, fill), o);
}

/** Wax seals hanging from a scroll: discs on short ribbons, tops on `y`. */
export function seals(x: number, y: number, s: number, ribbon: string, wax: string, count = 3, o: O = {}): string {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const sx = (i - (count - 1) / 2) * 46;
    out.push(S(`M ${sx} 0 L ${sx} 28`, ribbon, 4), Ci(sx, 40, 15, wax), Ci(sx, 40, 8, mix(wax, '#000000', 0.12), 0.6));
  }
  return place(x, y, s, out.join(''), o);
}

/** A runner's letter: a rolled scroll held up; ~60 long. */
export function letterRoll(x: number, y: number, s: number, fill: string, o: O = {}): string {
  return place(x, y, s, R(-30, -9, 60, 18, fill, 9) + E(-30, 0, 6, 11, mix(fill, '#000000', 0.12)) + E(30, 0, 6, 11, mix(fill, '#000000', 0.12)), o);
}
