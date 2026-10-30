/**
 * Motifs drawn for the Psalmen 51-100 covers (`quiz-cover-scenes-psalmen-2.mts`)
 * that the shared primitives do not have: a lyre, a tear bottle, scales, a
 * stone altar, an archer, a shofar and trumpets, the ark of the covenant, a
 * wild boar, a prowling dog, broken weapons, a high crag, a cave, a clay jar,
 * a shepherd's crook, a cedar, a great vine, a swallow and its nest, a
 * curling wave, pillars of fire and cloud.
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, `y` is
 * the ground a motif stands on, `s = 1` is the natural size.
 */

import { at, broadWing, crown as aCrown, dove as aDove, heart as aHeart, hourglass as aHourglass, kneeler, sapling as aSapling, sheep as aSheep, throne as aThrone, figure, type Pose as AFigurePose } from './cover-options/shapes.mjs';
import { circle, ellipse, flame, ink, path, rect, rotate, tri } from './quiz-cover-primitives.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

type Opts = { opacity?: number };
const wrap = (g: string, o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g);

/** A round-capped stroke along a path. */
export function stroke(d: string, fill: string, w: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

/** A straight round-capped line. */
export function bar(x1: number, y1: number, x2: number, y2: number, w: number, fill: string, opacity = 1): string {
  return stroke(`M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}`, fill, w, opacity);
}

// ── wrappers around the option-A shapes ─────────────────────────────────────

/** A sheep facing right (or left with `flip`), light fleece and dark head; ~70 tall at s = 1. */
export function sheep(x: number, y: number, s: number, body: string, head: string, flip = false): string {
  return at(x, y, s, aSheep(body, ink(head)), { flip });
}

/** A heart, centred on (x, y); ~128 wide at s = 1. */
export function heart(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(at(x, y + 20 * s, s, aHeart(fill)), o);
}

/** An hourglass; ~186 tall at s = 1. */
export function hourglass(x: number, y: number, s: number, frame: string, glass: string, sand: string): string {
  return at(x, y - 16 * s, s, aHourglass(frame, glass, sand));
}

/** A young plant with leaves; ~100 tall at s = 1. */
export function sapling(x: number, y: number, s: number, stem: string, leaf: string): string {
  return at(x, y, s, aSapling(stem, leaf));
}

/** A throne on steps; ~250 tall at s = 1. */
export function throneA(x: number, y: number, s: number, fill: string, trim?: string): string {
  return at(x, y, s, aThrone(fill, trim));
}

/** A jewelled crown; ~120 tall, 160 wide at s = 1. `y` is its bottom edge. */
export function crownA(x: number, y: number, s: number, fill: string, jewel?: string): string {
  return at(x, y - 6 * s, s, aCrown(fill, jewel));
}

/** A dove in flight facing right, wing up; centred on (x, y), ~180 wide at s = 1. */
export function doveA(x: number, y: number, s: number, fill: string, flip = false): string {
  return at(x, y, s, aDove(fill), { flip });
}

/** A kneeling figure that can face left (`flip`) as well as right. Same size as `person(..., 'kneel')`. */
export function kneelA(x: number, y: number, s: number, fill: string, arms: 'pray' | 'forward' | 'up' | 'plant' = 'pray', flip = false): string {
  return at(x, y, s * 0.6, kneeler(ink(fill), arms), { flip });
}

/** A standing figure in any option-A pose (staff, bless, shield...). Same size as `person`. */
export function figureA(x: number, y: number, s: number, fill: string, pose: AFigurePose, staffFill?: string, flip = false): string {
  return at(x, y, s * (134 / 204), figure(ink(fill), pose, { staffFill }), { flip });
}

/** Two great wings spread over a point - shelter, "onder Zijn vleugelen". (x, y) is where they meet. */
export function wingCanopy(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    at(x - 14 * s, y, s, broadWing(fill, 210, 1.5), { rot: -66 }) + at(x + 14 * s, y, s, broadWing(fill, 210, 1.5), { rot: 66, flip: true }),
    o,
  );
}

// ── instruments ────────────────────────────────────────────────────────────

/** A lyre (kinnor): sound box, two curved arms, a yoke and strings; ~160 tall at s = 1. */
export function harp(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const g =
    path(`M ${X(-40)} ${Y(-8)} C ${X(-42)} ${Y(-42)} ${X(42)} ${Y(-42)} ${X(40)} ${Y(-8)} C ${X(30)} ${Y(4)} ${X(-30)} ${Y(4)} ${X(-40)} ${Y(-8)} Z`, fill) +
    stroke(`M ${X(-30)} ${Y(-30)} C ${X(-56)} ${Y(-70)} ${X(-30)} ${Y(-112)} ${X(-50)} ${Y(-156)}`, fill, 11 * s) +
    stroke(`M ${X(30)} ${Y(-30)} C ${X(56)} ${Y(-70)} ${X(30)} ${Y(-112)} ${X(52)} ${Y(-150)}`, fill, 11 * s) +
    stroke(`M ${X(-60)} ${Y(-146)} L ${X(62)} ${Y(-140)}`, fill, 10 * s) +
    [-18, -6, 6, 18].map((v) => stroke(`M ${X(v)} ${Y(-30)} L ${X(v * 1.4)} ${Y(-142)}`, fill, 3 * s, 0.85)).join('');
  return wrap(g, o);
}

/** A ram's horn (shofar) from the mouthpiece at (x, y), curving up and to the right; ~150 long at s = 1. `rot` turns it clockwise. */
export function shofar(x: number, y: number, s: number, fill: string, rot = 0, flip = false): string {
  const g =
    `<path d="M 0 -5 C 50 -6 96 -22 122 -70 C 128 -82 132 -96 132 -108 L 160 -100 C 156 -82 150 -66 140 -52 C 106 -4 50 10 0 6 Z" fill="${fill}"/>` +
    `<ellipse transform="rotate(16 146 -104)" cx="146" cy="-104" rx="15" ry="8" fill="${fill}"/>`;
  return at(x, y, s, g, { flip, rot });
}

/** A long straight trumpet from the mouthpiece at (x, y), pointing at `deg` (0 = right, -30 = up-right). */
export function trumpet(x: number, y: number, s: number, deg: number, fill: string): string {
  const g =
    rect(x, y - 4 * s, 170 * s, 8 * s, fill, { rx: 3 * s }) +
    path(`M ${r1(x + 160 * s)} ${r1(y - 4 * s)} L ${r1(x + 206 * s)} ${r1(y - 22 * s)} L ${r1(x + 206 * s)} ${r1(y + 22 * s)} L ${r1(x + 160 * s)} ${r1(y + 4 * s)} Z`, fill) +
    rect(x + 50 * s, y - 7 * s, 10 * s, 14 * s, fill, { rx: 3 * s }) +
    rect(x + 110 * s, y - 7 * s, 10 * s, 14 * s, fill, { rx: 3 * s }) +
    rect(x - 6 * s, y - 6 * s, 10 * s, 12 * s, fill, { rx: 4 * s });
  return rotate(deg, x, y, g);
}

/** A timbrel (hand drum) held up: a ring with a few jingles; centred on (x, y). */
export function timbrel(x: number, y: number, s: number, fill: string): string {
  return (
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(22 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(7 * s)}"/>` +
    circle(x, y, 18 * s, fill, { opacity: 0.45 }) +
    [0, 1, 2, 3].map((i) => circle(x + Math.cos((i * Math.PI) / 2 + 0.6) * 22 * s, y + Math.sin((i * Math.PI) / 2 + 0.6) * 22 * s, 5 * s, fill)).join('')
  );
}

// ── objects ────────────────────────────────────────────────────────────────

/** A clay tear bottle with a narrow neck; ~120 tall at s = 1. */
export function bottle(x: number, y: number, s: number, fill: string): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  return (
    path(
      `M ${X(-12)} ${Y(-96)} L ${X(-12)} ${Y(-80)} C ${X(-46)} ${Y(-70)} ${X(-52)} ${Y(-28)} ${X(-36)} ${Y(-8)} C ${X(-26)} ${Y(2)} ${X(26)} ${Y(2)} ${X(36)} ${Y(-8)}` +
        ` C ${X(52)} ${Y(-28)} ${X(46)} ${Y(-70)} ${X(12)} ${Y(-80)} L ${X(12)} ${Y(-96)} Z`,
      fill,
    ) +
    ellipse(x, y - 100 * s, 18 * s, 7 * s, fill) +
    stroke(`M ${X(-12)} ${Y(-88)} C ${X(-34)} ${Y(-90)} ${X(-38)} ${Y(-70)} ${X(-30)} ${Y(-62)}`, fill, 6 * s)
  );
}

/** One tear drop, point up, centred on (x, y). */
export function tear(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return path(
    `M ${r1(x)} ${r1(y - 16 * s)} C ${r1(x + 10 * s)} ${r1(y - 2 * s)} ${r1(x + 10 * s)} ${r1(y + 10 * s)} ${r1(x)} ${r1(y + 10 * s)} C ${r1(x - 10 * s)} ${r1(y + 10 * s)} ${r1(x - 10 * s)} ${r1(y - 2 * s)} ${r1(x)} ${r1(y - 16 * s)} Z`,
    fill,
    o,
  );
}

/** A pair of scales on a stand, beam level; ~230 tall, ~250 wide at s = 1. */
export function scales(x: number, y: number, s: number, fill: string): string {
  const pan = (px: number) =>
    stroke(`M ${r1(px)} ${r1(y - 196 * s)} L ${r1(px - 38 * s)} ${r1(y - 112 * s)} M ${r1(px)} ${r1(y - 196 * s)} L ${r1(px + 38 * s)} ${r1(y - 112 * s)}`, fill, 3.5 * s) +
    path(`M ${r1(px - 48 * s)} ${r1(y - 114 * s)} L ${r1(px + 48 * s)} ${r1(y - 114 * s)} C ${r1(px + 40 * s)} ${r1(y - 88 * s)} ${r1(px - 40 * s)} ${r1(y - 88 * s)} ${r1(px - 48 * s)} ${r1(y - 114 * s)} Z`, fill);
  return (
    path(`M ${r1(x - 52 * s)} ${r1(y)} L ${r1(x - 20 * s)} ${r1(y - 22 * s)} L ${r1(x + 20 * s)} ${r1(y - 22 * s)} L ${r1(x + 52 * s)} ${r1(y)} Z`, fill) +
    rect(x - 6 * s, y - 214 * s, 12 * s, 194 * s, fill, { rx: 4 * s }) +
    circle(x, y - 222 * s, 12 * s, fill) +
    rect(x - 120 * s, y - 206 * s, 240 * s, 10 * s, fill, { rx: 5 * s }) +
    pan(x - 112 * s) +
    pan(x + 112 * s)
  );
}

/** A stone altar of hewn blocks with four horns; ~90 tall at s = 1. */
export function altar(x: number, y: number, s: number, fill: string, joint?: string): string {
  const out = [
    rect(x - 56 * s, y - 70 * s, 112 * s, 70 * s, fill),
    rect(x - 64 * s, y - 82 * s, 128 * s, 14 * s, fill, { rx: 3 * s }),
    tri(x - 64 * s, y - 80 * s, x - 64 * s, y - 100 * s, x - 46 * s, y - 80 * s, fill),
    tri(x + 64 * s, y - 80 * s, x + 64 * s, y - 100 * s, x + 46 * s, y - 80 * s, fill),
  ];
  if (joint) {
    out.push(
      stroke(`M ${r1(x - 56 * s)} ${r1(y - 36 * s)} L ${r1(x + 56 * s)} ${r1(y - 36 * s)}`, joint, 3 * s, 0.5),
      stroke(`M ${r1(x - 10 * s)} ${r1(y - 70 * s)} L ${r1(x - 10 * s)} ${r1(y - 36 * s)} M ${r1(x + 22 * s)} ${r1(y - 36 * s)} L ${r1(x + 22 * s)} ${r1(y)}`, joint, 3 * s, 0.5),
    );
  }
  return out.join('');
}

/** A clay jar with two handles; ~110 tall at s = 1. Tip it with `rotate`. */
export function jar(x: number, y: number, s: number, fill: string): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  return (
    path(`M ${X(-16)} ${Y(-92)} C ${X(-50)} ${Y(-80)} ${X(-46)} ${Y(-24)} ${X(-14)} ${Y(0)} L ${X(14)} ${Y(0)} C ${X(46)} ${Y(-24)} ${X(50)} ${Y(-80)} ${X(16)} ${Y(-92)} Z`, fill) +
    rect(x - 20 * s, y - 104 * s, 40 * s, 14 * s, fill, { rx: 5 * s }) +
    stroke(`M ${X(-18)} ${Y(-90)} C ${X(-44)} ${Y(-94)} ${X(-48)} ${Y(-70)} ${X(-34)} ${Y(-62)}`, fill, 6 * s) +
    stroke(`M ${X(18)} ${Y(-90)} C ${X(44)} ${Y(-94)} ${X(48)} ${Y(-70)} ${X(34)} ${Y(-62)}`, fill, 6 * s)
  );
}

/** A handheld torch: a stick whose top end is at (x, y), and a flame above it. */
export function torch(x: number, y: number, s: number, stick: string, fire: string): string {
  return rotate(10, x, y, rect(x - 4 * s, y, 8 * s, 90 * s, stick, { rx: 3 * s })) + flame(x, y + 6 * s, 0.85 * s, fire) + flame(x, y + 2 * s, 0.45 * s, '#FFFFFF', { opacity: 0.55 });
}

/** A shepherd's crook planted in the ground; ~200 tall at s = 1. */
export function crook(x: number, y: number, s: number, fill: string): string {
  return stroke(`M ${r1(x)} ${r1(y)} L ${r1(x)} ${r1(y - 170 * s)} C ${r1(x)} ${r1(y - 210 * s)} ${r1(x + 44 * s)} ${r1(y - 212 * s)} ${r1(x + 44 * s)} ${r1(y - 180 * s)} L ${r1(x + 40 * s)} ${r1(y - 168 * s)}`, fill, 9 * s);
}

/** A goblet tipped over, pouring: the cup at (x, y), stream falling to `toY`. */
export function pouringCup(x: number, y: number, s: number, deg: number, fill: string, streamTo: number): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const cup =
    path(`M ${X(-44)} ${Y(-60)} L ${X(44)} ${Y(-60)} C ${X(44)} ${Y(-20)} ${X(20)} ${Y(-6)} ${X(0)} ${Y(-6)} C ${X(-20)} ${Y(-6)} ${X(-44)} ${Y(-20)} ${X(-44)} ${Y(-60)} Z`, fill) +
    rect(x - 5 * s, y - 10 * s, 10 * s, 44 * s, fill) +
    ellipse(x, y + 34 * s, 30 * s, 8 * s, fill) +
    ellipse(x, y - 60 * s, 44 * s, 8 * s, fill);
  const lipX = x + Math.cos(((deg - 90) * Math.PI) / 180) * 60 * s + 44 * s * Math.cos((deg * Math.PI) / 180);
  const lipY = y + Math.sin(((deg - 90) * Math.PI) / 180) * 60 * s + 44 * s * Math.sin((deg * Math.PI) / 180);
  const stream = path(
    `M ${r1(lipX - 8 * s)} ${r1(lipY)} C ${r1(lipX + 20 * s)} ${r1(lipY + 40 * s)} ${r1(lipX + 26 * s)} ${r1((lipY + streamTo) / 2)} ${r1(lipX + 30 * s)} ${r1(streamTo)}` +
      ` L ${r1(lipX + 6 * s)} ${r1(streamTo)} C ${r1(lipX + 4 * s)} ${r1((lipY + streamTo) / 2)} ${r1(lipX)} ${r1(lipY + 40 * s)} ${r1(lipX - 8 * s)} ${r1(lipY)} Z`,
    fill,
    { opacity: 0.7 },
  );
  return stream + rotate(deg, x, y, cup);
}

// ── weapons ────────────────────────────────────────────────────────────────

/** An arrow from (x, y) pointing at `deg` (0 = right, 90 = down); `len` long. */
export function arrow(x: number, y: number, len: number, deg: number, s: number, fill: string): string {
  const g =
    rect(x, y - 2.5 * s, len, 5 * s, fill) +
    tri(x + len - 4 * s, y - 10 * s, x + len + 22 * s, y, x + len - 4 * s, y + 10 * s, fill) +
    tri(x, y - 2 * s, x - 14 * s, y - 12 * s, x + 14 * s, y - 2 * s, fill) +
    tri(x, y + 2 * s, x - 14 * s, y + 12 * s, x + 14 * s, y + 2 * s, fill);
  return rotate(deg, x, y, g);
}

/** A kneeling archer facing right with the bow drawn; same size as a kneeling `person`. */
export function archer(x: number, y: number, s: number, fill: string, flip = false): string {
  const f = ink(fill);
  const g =
    kneeler(f, 'forward') +
    stroke('M 64 -168 C 104 -134 104 -54 64 -20', f, 7) +
    stroke('M 64 -168 L 22 -96 L 64 -20', f, 2.5, 0.9) +
    stroke('M 22 -96 L 150 -96', f, 4) +
    `<path d="M 150 -106 L 172 -96 L 150 -86 Z" fill="${f}"/>`;
  return at(x, y, s * 0.6, g, { flip });
}

/** A round shield with a boss; `broken` splits it in two halves along a jagged crack. Centred on (x, y), radius 40 at s = 1. */
export function shield(x: number, y: number, s: number, fill: string, boss: string, broken = false): string {
  const r = 40 * s;
  if (!broken) return circle(x, y, r, fill) + circle(x, y, r * 0.78, boss, { opacity: 0.35 }) + circle(x, y, r * 0.22, fill);
  const zig = `L ${r1(x + 7 * s)} ${r1(y + r * 0.5)} L ${r1(x - 6 * s)} ${r1(y + 2 * s)} L ${r1(x + 7 * s)} ${r1(y - r * 0.48)} Z`;
  const left = `M ${r1(x)} ${r1(y - r)} A ${r1(r)} ${r1(r)} 0 0 0 ${r1(x)} ${r1(y + r)} ${zig}`;
  const right = `M ${r1(x)} ${r1(y - r)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(x)} ${r1(y + r)} ${zig}`;
  return (
    path(left, fill) +
    circle(x - r * 0.42, y, r * 0.5, boss, { opacity: 0.3 }) +
    `<g transform="translate(${r1(16 * s)} ${r1(10 * s)}) rotate(14 ${r1(x)} ${r1(y)})">${path(right, fill)}${circle(x + r * 0.42, y, r * 0.5, boss, { opacity: 0.3 })}</g>`
  );
}

/** A straight sword lying flat, hilt at (x, y), blade to the right; `broken` snaps it in two. */
export function sword(x: number, y: number, s: number, fill: string, broken = false): string {
  const hilt = rect(x - 30 * s, y - 4 * s, 30 * s, 8 * s, fill, { rx: 3 * s }) + rect(x - 2 * s, y - 16 * s, 8 * s, 32 * s, fill, { rx: 3 * s }) + circle(x - 32 * s, y, 7 * s, fill);
  if (!broken) return hilt + path(`M ${r1(x + 6 * s)} ${r1(y - 6 * s)} L ${r1(x + 150 * s)} ${r1(y - 4 * s)} L ${r1(x + 170 * s)} ${r1(y)} L ${r1(x + 150 * s)} ${r1(y + 4 * s)} L ${r1(x + 6 * s)} ${r1(y + 6 * s)} Z`, fill);
  return (
    hilt +
    path(`M ${r1(x + 6 * s)} ${r1(y - 6 * s)} L ${r1(x + 80 * s)} ${r1(y - 5 * s)} L ${r1(x + 72 * s)} ${r1(y + 1 * s)} L ${r1(x + 82 * s)} ${r1(y + 5 * s)} L ${r1(x + 6 * s)} ${r1(y + 6 * s)} Z`, fill) +
    rotate(-18, x + 110 * s, y + 8 * s, path(`M ${r1(x + 96 * s)} ${r1(y + 2 * s)} L ${r1(x + 160 * s)} ${r1(y + 4 * s)} L ${r1(x + 180 * s)} ${r1(y + 8 * s)} L ${r1(x + 160 * s)} ${r1(y + 12 * s)} L ${r1(x + 92 * s)} ${r1(y + 13 * s)} L ${r1(x + 100 * s)} ${r1(y + 8 * s)} Z`, fill))
  );
}

/** A bow snapped in two, lying on the ground at (x, y). */
export function brokenBow(x: number, y: number, s: number, fill: string): string {
  return (
    stroke(`M ${r1(x - 90 * s)} ${r1(y - 6 * s)} C ${r1(x - 70 * s)} ${r1(y - 40 * s)} ${r1(x - 30 * s)} ${r1(y - 48 * s)} ${r1(x - 8 * s)} ${r1(y - 40 * s)}`, fill, 7 * s) +
    stroke(`M ${r1(x + 6 * s)} ${r1(y - 26 * s)} C ${r1(x + 30 * s)} ${r1(y - 30 * s)} ${r1(x + 70 * s)} ${r1(y - 20 * s)} ${r1(x + 92 * s)} ${r1(y - 2 * s)}`, fill, 7 * s) +
    stroke(`M ${r1(x - 90 * s)} ${r1(y - 6 * s)} C ${r1(x - 60 * s)} ${r1(y + 4 * s)} ${r1(x - 30 * s)} ${r1(y + 2 * s)} ${r1(x - 14 * s)} ${r1(y - 4 * s)}`, fill, 2 * s, 0.8)
  );
}

/** An axe with a long haft lying at an angle; head at (x, y). */
export function axe(x: number, y: number, s: number, deg: number, fill: string): string {
  const g =
    rect(x - 6 * s, y - 4 * s, 130 * s, 8 * s, fill, { rx: 4 * s }) +
    path(`M ${r1(x - 8 * s)} ${r1(y - 10 * s)} L ${r1(x - 30 * s)} ${r1(y - 34 * s)} C ${r1(x - 46 * s)} ${r1(y - 10 * s)} ${r1(x - 46 * s)} ${r1(y + 10 * s)} ${r1(x - 30 * s)} ${r1(y + 34 * s)} L ${r1(x - 8 * s)} ${r1(y + 10 * s)} Z`, fill);
  return rotate(deg, x, y, g);
}

// ── sacred objects ─────────────────────────────────────────────────────────

/** The ark of the covenant with the cherubim's wings over the mercy seat and the carrying poles; ~130 tall at s = 1. */
export function arkOfCovenant(x: number, y: number, s: number, fill: string, pole?: string): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const wing = (dir: 1 | -1) =>
    path(
      `M ${X(dir * 66)} ${Y(-70)} C ${X(dir * 70)} ${Y(-112)} ${X(dir * 40)} ${Y(-134)} ${X(dir * 6)} ${Y(-122)} C ${X(dir * 26)} ${Y(-112)} ${X(dir * 38)} ${Y(-100)} ${X(dir * 34)} ${Y(-88)}` +
        ` C ${X(dir * 44)} ${Y(-90)} ${X(dir * 46)} ${Y(-80)} ${X(dir * 42)} ${Y(-70)} Z`,
      fill,
    );
  return (
    rect(x - 84 * s, y - 64 * s, 168 * s, 56 * s, fill, { rx: 3 * s }) +
    rect(x - 90 * s, y - 72 * s, 180 * s, 10 * s, fill, { rx: 3 * s }) +
    rect(x - 80 * s, y - 10 * s, 16 * s, 10 * s, fill) +
    rect(x + 64 * s, y - 10 * s, 16 * s, 10 * s, fill) +
    ellipse(x - 64 * s, y - 70 * s, 14 * s, 10 * s, fill) +
    ellipse(x + 64 * s, y - 70 * s, 14 * s, 10 * s, fill) +
    wing(-1) +
    wing(1) +
    rect(x - 150 * s, y - 34 * s, 300 * s, 7 * s, pole ?? fill, { rx: 3 * s }) +
    rect(x - 84 * s, y - 50 * s, 168 * s, 4 * s, '#FFFFFF', { opacity: 0.35 })
  );
}

/** A tall column of fire; ~`h` tall. */
export function fireColumn(x: number, y: number, h: number, w: number, outer: string, core: string): string {
  const out: string[] = [];
  const steps = 6;
  for (let i = 0; i < steps; i += 1) {
    const yy = y - (i * h) / (steps + 1);
    const k = 1 - i * 0.07;
    out.push(at(x + (i % 2 ? 8 : -8), yy, 1, `<path d="M 0 ${-h * 0.34} C ${w * 0.5 * k} ${-h * 0.2} ${w * 0.56 * k} ${-h * 0.02} 0 0 C ${-w * 0.56 * k} ${-h * 0.02} ${-w * 0.5 * k} ${-h * 0.2} 0 ${-h * 0.34} Z" fill="${outer}"/>`));
  }
  out.push(rect(x - w * 0.34, y - h * 0.86, w * 0.68, h * 0.84, outer, { rx: w * 0.3 }));
  out.push(rect(x - w * 0.12, y - h * 0.8, w * 0.24, h * 0.76, core, { rx: w * 0.12, opacity: 0.55 }));
  out.push(flame(x, y - h * 0.82, (w / 50) * 1.1, outer));
  return out.join('');
}

/** A soft column of cloud standing on the ground, ~`h` tall. */
export function cloudColumn(rand: () => number, x: number, y: number, h: number, w: number, fill: string, opacity = 0.8): string {
  const out: string[] = [];
  const n = 12;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const ww = w * (0.5 + 0.25 * Math.sin(t * Math.PI) + t * 0.3);
    out.push(ellipse(x + (rand() - 0.5) * w * 0.25, y - t * h, ww * 0.55, w * 0.32, fill));
  }
  out.push(rect(x - w * 0.36, y - h, w * 0.72, h, fill, { rx: w * 0.3 }));
  return `<g opacity="${opacity}">${out.join('')}</g>`;
}

// ── animals ────────────────────────────────────────────────────────────────

/** A wild boar facing left, tusks and bristled back; ~90 tall, ~190 long at s = 1. */
export function boar(x: number, y: number, s: number, fill: string, flip = false): string {
  const f = ink(fill);
  const g =
    // body: high at the shoulder, falling to the rump
    `<path d="M -40 -42 C -42 -74 -12 -90 22 -84 C 56 -78 80 -62 82 -42 C 84 -24 72 -16 56 -16 L -22 -16 C -36 -18 -40 -28 -40 -42 Z" fill="${f}"/>` +
    // long head down to a flat snout
    `<path d="M -26 -76 C -50 -74 -72 -58 -94 -44 C -100 -40 -100 -30 -94 -26 C -70 -22 -48 -22 -26 -22 Z" fill="${f}"/>` +
    `<ellipse cx="-96" cy="-35" rx="5" ry="10" fill="${f}"/>` +
    `<path d="M -50 -66 L -44 -88 L -32 -70 Z" fill="${f}"/>` +
    `<path d="M -82 -28 C -88 -32 -90 -42 -84 -48" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>` +
    // bristled mane along the neck and shoulders only
    [-24, -12, 0, 12].map((v, i) => `<path d="M ${v - 5} ${-82 - (i === 0 ? -6 : 0)} L ${v + 1} ${-96 + i * 2} L ${v + 6} ${-83} Z" fill="${f}"/>`).join('') +
    [-30, -12, 46, 64].map((v) => `<rect x="${v - 5}" y="-26" width="10" height="26" rx="4" fill="${f}"/>`).join('') +
    `<path d="M 80 -50 C 92 -52 94 -40 88 -34" fill="none" stroke="${f}" stroke-width="3.5" stroke-linecap="round"/>`;
  return at(x, y, s, g, { flip });
}

/** A lean dog prowling to the right, head low; ~60 tall, ~130 long at s = 1. */
export function dog(x: number, y: number, s: number, fill: string, flip = false): string {
  const f = ink(fill);
  const leg = (x1: number, y1: number, x2: number, y2: number) => `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${f}" stroke-width="6" stroke-linecap="round"/>`;
  const g =
    `<path d="M -44 -44 C -40 -58 -10 -60 18 -56 C 34 -54 42 -48 46 -42 C 40 -32 24 -28 0 -30 C -20 -32 -40 -30 -44 -44 Z" fill="${f}"/>` +
    `<path d="M 34 -54 C 46 -52 54 -44 58 -36 L 76 -30 C 80 -26 78 -22 72 -22 L 54 -24 C 46 -26 38 -34 34 -44 Z" fill="${f}"/>` +
    `<path d="M 50 -44 L 54 -60 L 60 -42 Z" fill="${f}"/>` +
    leg(-34, -38, -42, 0) +
    leg(-26, -36, -20, 0) +
    leg(28, -40, 22, 0) +
    leg(36, -40, 44, 0) +
    `<path d="M -42 -48 C -60 -54 -66 -66 -64 -76" fill="none" stroke="${f}" stroke-width="5" stroke-linecap="round"/>`;
  return at(x, y, s, g, { flip });
}

/** A horse lying on its side, asleep - "wagen en paard zijn in diepe slaap gevallen". Facing left, ~60 tall, ~200 long. */
export function horseAsleep(x: number, y: number, s: number, fill: string, flip = false): string {
  const f = ink(fill);
  const g =
    `<path d="M -60 -6 C -66 -40 -30 -60 20 -58 C 62 -56 90 -40 92 -16 C 92 -6 86 0 76 0 L -50 0 C -58 0 -60 -2 -60 -6 Z" fill="${f}"/>` +
    `<path d="M -40 -44 C -64 -50 -90 -40 -104 -22 L -120 -10 C -124 -4 -118 2 -110 0 L -88 -6 C -72 -10 -56 -18 -44 -20 Z" fill="${f}"/>` +
    `<path d="M -50 -48 C -60 -60 -76 -58 -88 -46 L -70 -40 Z" fill="${f}"/>` +
    `<path d="M 30 -6 C 60 -2 90 4 120 2" fill="none" stroke="${f}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M 20 -2 C 46 6 72 10 104 12" fill="none" stroke="${f}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M 90 -26 C 110 -24 124 -14 132 -2" fill="none" stroke="${f}" stroke-width="8" stroke-linecap="round"/>`;
  return at(x, y, s, g, { flip });
}

/** A camel walking left; ~150 tall at s = 1. */
export function camel(x: number, y: number, s: number, fill: string, flip = false): string {
  const f = ink(fill);
  const g =
    `<ellipse cx="0" cy="-62" rx="54" ry="24" fill="${f}"/>` +
    `<circle cx="-12" cy="-84" r="22" fill="${f}"/>` +
    [-42, -22, 14, 34].map((v) => `<rect x="${v - 4.5}" y="-62" width="9" height="62" rx="4" fill="${f}"/>`).join('') +
    `<path d="M -40 -76 L -54 -66 L -84 -122 L -70 -128 Z" fill="${f}"/>` +
    `<ellipse cx="-86" cy="-128" rx="17" ry="9" fill="${f}"/>` +
    `<path d="M 52 -66 q 14 10 8 34" fill="none" stroke="${f}" stroke-width="4" stroke-linecap="round"/>`;
  return at(x, y, s, g, { flip });
}

/** A swallow in flight, forked tail, facing right; centred on (x, y). */
export function swallow(x: number, y: number, s: number, fill: string, flip = false): string {
  const f = ink(fill);
  const g =
    `<path d="M -26 0 C -10 -8 14 -8 26 -2 C 30 0 30 4 26 5 C 12 8 -10 8 -26 4 Z" fill="${f}"/>` +
    `<path d="M -4 -2 C -14 -22 -30 -34 -52 -38 C -36 -24 -24 -10 -16 2 Z" fill="${f}"/>` +
    `<path d="M 4 -2 C 0 -24 -6 -40 -18 -54 C -2 -46 10 -26 14 -4 Z" fill="${f}"/>` +
    `<path d="M -24 2 L -54 -6 L -34 6 L -52 16 Z" fill="${f}"/>`;
  return at(x, y, s, g, { flip });
}

/** A swallow's mud nest with three young peeping over the rim, beaks open; `y` is the bottom of the nest. */
export function nest(x: number, y: number, s: number, fill: string, young: string, beak = '#FFFFFF'): string {
  const chick = (cx: number, cy: number, r: number) =>
    circle(cx, cy, r * s, young) +
    path(`M ${r1(cx - 2 * s)} ${r1(cy - r * 0.6 * s)} L ${r1(cx - 9 * s)} ${r1(cy - (r + 12) * s)} L ${r1(cx + 1 * s)} ${r1(cy - (r + 4) * s)} L ${r1(cx + 9 * s)} ${r1(cy - (r + 12) * s)} L ${r1(cx + 4 * s)} ${r1(cy - r * 0.6 * s)} Z`, beak);
  const out = [
    chick(x - 20 * s, y - 30 * s, 10),
    chick(x + 20 * s, y - 30 * s, 10),
    chick(x, y - 34 * s, 11),
    path(`M ${r1(x - 46 * s)} ${r1(y - 30 * s)} C ${r1(x - 44 * s)} ${r1(y + 2 * s)} ${r1(x - 16 * s)} ${r1(y + 6 * s)} ${r1(x)} ${r1(y + 6 * s)} C ${r1(x + 16 * s)} ${r1(y + 6 * s)} ${r1(x + 44 * s)} ${r1(y + 2 * s)} ${r1(x + 46 * s)} ${r1(y - 30 * s)} Z`, fill),
  ];
  for (let i = 0; i < 3; i += 1) out.push(stroke(`M ${r1(x - 40 * s + i * 6 * s)} ${r1(y - 20 * s + i * 8 * s)} L ${r1(x + 40 * s - i * 6 * s)} ${r1(y - 18 * s + i * 8 * s)}`, '#FFFFFF', 2.5 * s, 0.35));
  return out.join('');
}

// ── plants ─────────────────────────────────────────────────────────────────

/** A cedar of Lebanon: a straight trunk and broad flat tiers; ~260 tall at s = 1. */
export function cedar(x: number, y: number, s: number, fill: string): string {
  const f = ink(fill);
  const out = [rect(x - 9 * s, y - 230 * s, 18 * s, 230 * s, f, { rx: 4 * s })];
  const tiers: [number, number, number][] = [
    [-70, 120, 22],
    [-118, 104, 20],
    [-162, 84, 18],
    [-202, 60, 16],
    [-236, 34, 14],
  ];
  tiers.forEach(([ty, w, h], i) => {
    const dx = (i % 2 ? 1 : -1) * 8 * s;
    out.push(path(`M ${r1(x - w * s + dx)} ${r1(y + ty * s)} C ${r1(x - w * 0.6 * s + dx)} ${r1(y + (ty - h * 1.6) * s)} ${r1(x + w * 0.6 * s + dx)} ${r1(y + (ty - h * 1.6) * s)} ${r1(x + w * s + dx)} ${r1(y + ty * s)} C ${r1(x + w * 0.5 * s + dx)} ${r1(y + (ty + h * 0.5) * s)} ${r1(x - w * 0.5 * s + dx)} ${r1(y + (ty + h * 0.5) * s)} ${r1(x - w * s + dx)} ${r1(y + ty * s)} Z`, f));
  });
  return out.join('');
}

/** A great spreading vine: twisted stock, long arms, leaves and hanging bunches. */
export function greatVine(rand: () => number, x: number, y: number, s: number, wood: string, leaf: string, fruit: string): string {
  const w = ink(wood);
  const l = ink(leaf);
  const out = [
    path(`M ${r1(x - 16 * s)} ${r1(y)} C ${r1(x - 4 * s)} ${r1(y - 60 * s)} ${r1(x - 26 * s)} ${r1(y - 110 * s)} ${r1(x - 4 * s)} ${r1(y - 160 * s)} L ${r1(x + 12 * s)} ${r1(y - 156 * s)} C ${r1(x - 4 * s)} ${r1(y - 110 * s)} ${r1(x + 18 * s)} ${r1(y - 60 * s)} ${r1(x + 16 * s)} ${r1(y)} Z`, w),
  ];
  const arms: [number, number, number, number][] = [
    [-300, -170, -150, -230],
    [300, -160, 140, -240],
    [-200, -250, -60, -240],
    [220, -250, 70, -250],
  ];
  for (const [ex, ey, cx, cy] of arms) out.push(stroke(`M ${r1(x)} ${r1(y - 150 * s)} Q ${r1(x + cx * s)} ${r1(y + cy * s)} ${r1(x + ex * s)} ${r1(y + ey * s)}`, w, 9 * s));
  const leaves: [number, number][] = [];
  for (const [ex, ey, cx, cy] of arms) {
    for (let i = 1; i <= 5; i += 1) {
      const t = i / 5.4;
      const px = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * cx + t * t * ex;
      const py = (1 - t) * (1 - t) * -150 + 2 * (1 - t) * t * cy + t * t * ey;
      leaves.push([x + px * s, y + py * s]);
    }
  }
  for (const [lx, ly] of leaves) {
    out.push(vineLeaf(lx + (rand() - 0.5) * 20 * s, ly - 8 * s + (rand() - 0.5) * 14 * s, (0.9 + rand() * 0.4) * s, l));
  }
  leaves.forEach(([lx, ly], i) => {
    if (i % 2 === 0) out.push(grapeBunch(lx + (rand() - 0.5) * 12 * s, ly + 6 * s, 1.05 * s, fruit));
  });
  return out.join('');
}

/** A three-lobed vine leaf centred on (x, y). */
export function vineLeaf(x: number, y: number, s: number, fill: string): string {
  return (
    circle(x, y - 10 * s, 13 * s, fill) +
    circle(x - 13 * s, y + 2 * s, 11 * s, fill) +
    circle(x + 13 * s, y + 2 * s, 11 * s, fill) +
    circle(x, y + 6 * s, 10 * s, fill) +
    tri(x - 4 * s, y + 12 * s, x, y + 22 * s, x + 4 * s, y + 12 * s, fill)
  );
}

/** A pavilion tent seen from the front: one pole, sloping eaves, guy ropes and a dark open door; ~190 wide, ~95 tall at s = 1. */
export function tentWide(x: number, y: number, s: number, fill: string, door: string): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  return (
    stroke(`M ${X(-70)} ${Y(-36)} L ${X(-124)} ${Y(0)} M ${X(70)} ${Y(-36)} L ${X(124)} ${Y(0)}`, fill, 2.5 * s, 0.85) +
    path(`M ${X(-96)} ${Y(0)} L ${X(-70)} ${Y(-36)} L ${X(0)} ${Y(-86)} L ${X(70)} ${Y(-36)} L ${X(96)} ${Y(0)} Z`, fill) +
    path(`M ${X(-20)} ${Y(0)} L ${X(-3)} ${Y(-58)} L ${X(3)} ${Y(-58)} L ${X(20)} ${Y(0)} Z`, door) +
    stroke(`M ${X(0)} ${Y(-86)} L ${X(0)} ${Y(-100)}`, fill, 5 * s)
  );
}

/** A clay oil lamp with a tall flame at its spout; ~120 wide at s = 1, `y` under the lamp. */
export function oilLamp(x: number, y: number, s: number, body: string, flameFill: string): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  return (
    path(`M ${X(-56)} ${Y(-10)} C ${X(-56)} ${Y(-34)} ${X(30)} ${Y(-40)} ${X(46)} ${Y(-24)} L ${X(74)} ${Y(-38)} L ${X(66)} ${Y(-20)} C ${X(60)} ${Y(-6)} ${X(30)} ${Y(0)} ${X(-20)} ${Y(0)} C ${X(-40)} ${Y(0)} ${X(-56)} ${Y(-2)} ${X(-56)} ${Y(-10)} Z`, body) +
    ellipse(x - 10 * s, y - 30 * s, 14 * s, 5 * s, '#FFFFFF', { opacity: 0.4 }) +
    flame(x + 72 * s, y - 38 * s, 0.85 * s, flameFill) +
    flame(x + 72 * s, y - 40 * s, 0.42 * s, '#FFFFFF', { opacity: 0.6 })
  );
}

/** A sheer rock pillar standing out of the sea or plain: near-vertical sides with ledges, flat top. */
export function pillarRock(x: number, y: number, w: number, top: number, fill: string, ledge: string): string {
  const h = y - top;
  const P = (fx: number, fy: number) => `${r1(x + w * fx)} ${r1(y - h * fy)}`;
  const d =
    `M ${P(-0.5, 0)} L ${P(-0.44, 0.22)} L ${P(-0.38, 0.26)} L ${P(-0.36, 0.52)} L ${P(-0.31, 0.56)} L ${P(-0.3, 0.84)} L ${P(-0.26, 0.97)} L ${P(-0.12, 1)}` +
    ` L ${P(0.18, 1)} L ${P(0.28, 0.95)} L ${P(0.3, 0.7)} L ${P(0.35, 0.66)} L ${P(0.37, 0.4)} L ${P(0.43, 0.36)} L ${P(0.5, 0)} Z`;
  return (
    `<path d="${d}" fill="${fill}"/>` +
    stroke(`M ${P(-0.38, 0.26)} L ${P(-0.2, 0.28)} M ${P(-0.31, 0.56)} L ${P(-0.12, 0.58)} M ${P(0.35, 0.66)} L ${P(0.16, 0.68)} M ${P(0.43, 0.36)} L ${P(0.24, 0.38)}`, ledge, 4, 0.45) +
    stroke(`M ${P(-0.26, 0.97)} L ${P(-0.12, 1)} L ${P(0.18, 1)} L ${P(0.28, 0.95)}`, ledge, 4, 0.6)
  );
}

/** A hanging bunch of grapes, top at (x, y). */
export function grapeBunch(x: number, y: number, s: number, fill: string): string {
  const out: string[] = [];
  const rows = [4, 3, 3, 2, 1];
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i += 1) out.push(circle(x + (i - (n - 1) / 2) * 13 * s, y + r * 11 * s, 7.5 * s, fill));
  });
  return out.join('');
}

// ── landforms ──────────────────────────────────────────────────────────────

/** A tall rock rising steeply to a narrow flat top at `top`; base `w` wide at `y`. */
export function crag(x: number, y: number, w: number, top: number, fill: string): string {
  const h = y - top;
  return `<path d="M ${r1(x - w / 2)} ${r1(y)} C ${r1(x - w * 0.42)} ${r1(y - h * 0.3)} ${r1(x - w * 0.3)} ${r1(y - h * 0.5)} ${r1(x - w * 0.26)} ${r1(y - h * 0.72)} L ${r1(x - w * 0.2)} ${r1(y - h * 0.86)} L ${r1(x - w * 0.16)} ${r1(top + 4)} L ${r1(x + w * 0.15)} ${r1(top)} L ${r1(x + w * 0.2)} ${r1(y - h * 0.8)} C ${r1(x + w * 0.28)} ${r1(y - h * 0.62)} ${r1(x + w * 0.36)} ${r1(y - h * 0.4)} ${r1(x + w * 0.5)} ${r1(y)} Z" fill="${fill}"/>`;
}

/** A rugged rock mass with a dark cave mouth at its foot; ~`w` wide, ~`h` tall. */
export function caveRock(x: number, y: number, w: number, h: number, rock: string, hole: string): string {
  const k = w / 2;
  return (
    `<path d="M ${r1(x - k)} ${r1(y)} C ${r1(x - k * 0.9)} ${r1(y - h * 0.5)} ${r1(x - k * 0.6)} ${r1(y - h * 0.8)} ${r1(x - k * 0.3)} ${r1(y - h * 0.9)} L ${r1(x - k * 0.1)} ${r1(y - h)} C ${r1(x + k * 0.2)} ${r1(y - h * 1.02)} ${r1(x + k * 0.4)} ${r1(y - h * 0.86)} ${r1(x + k * 0.6)} ${r1(y - h * 0.7)} C ${r1(x + k * 0.8)} ${r1(y - h * 0.5)} ${r1(x + k * 0.92)} ${r1(y - h * 0.24)} ${r1(x + k)} ${r1(y)} Z" fill="${rock}"/>` +
    `<path d="M ${r1(x - k * 0.34)} ${r1(y)} C ${r1(x - k * 0.36)} ${r1(y - h * 0.34)} ${r1(x - k * 0.22)} ${r1(y - h * 0.56)} ${r1(x)} ${r1(y - h * 0.58)} C ${r1(x + k * 0.24)} ${r1(y - h * 0.56)} ${r1(x + k * 0.36)} ${r1(y - h * 0.32)} ${r1(x + k * 0.34)} ${r1(y)} Z" fill="${hole}"/>`
  );
}

/** A curling sea wave breaking toward the left; base at y, crest `h` high. */
export function curlWave(x: number, y: number, w: number, h: number, fill: string, crest: string, flip = false): string {
  const g =
    `<path d="M ${-w / 2} 0 C ${-w * 0.36} ${-h * 0.2} ${-w * 0.24} ${-h * 0.62} ${-w * 0.06} ${-h * 0.92} C ${w * 0.02} ${-h * 1.04} ${-w * 0.14} ${-h * 1.08} ${-w * 0.22} ${-h * 0.94}` +
    ` C ${-w * 0.2} ${-h * 1.12} ${w * 0.02} ${-h * 1.16} ${w * 0.12} ${-h * 1.0} C ${w * 0.24} ${-h * 0.76} ${w * 0.34} ${-h * 0.3} ${w / 2} 0 Z" fill="${fill}"/>` +
    // the lighter hollow under the lip
    `<path d="M ${-w * 0.2} ${-h * 0.9} C ${-w * 0.1} ${-h * 0.96} ${-w * 0.02} ${-h * 0.8} ${-w * 0.08} ${-h * 0.62} C ${-w * 0.16} ${-h * 0.4} ${-w * 0.3} ${-h * 0.2} ${-w * 0.42} ${-h * 0.04} C ${-w * 0.3} ${-h * 0.3} ${-w * 0.2} ${-h * 0.6} ${-w * 0.2} ${-h * 0.9} Z" fill="#FFFFFF" opacity="0.28"/>` +
    `<path d="M ${-w * 0.2} ${-h * 0.98} C ${-w * 0.16} ${-h * 1.1} ${w * 0.02} ${-h * 1.12} ${w * 0.1} ${-h * 0.98} C ${w * 0.2} ${-h * 0.76} ${w * 0.28} ${-h * 0.4} ${w * 0.4} ${-h * 0.1}" fill="none" stroke="${crest}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>` +
    `<path d="M ${w * 0.06} ${-h * 0.6} C ${w * 0.14} ${-h * 0.46} ${w * 0.2} ${-h * 0.3} ${w * 0.3} ${-h * 0.12}" fill="none" stroke="${crest}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>` +
    // spray off the crest
    [[-0.26, 1.08, 7], [-0.32, 1.0, 5], [-0.3, 1.16, 4], [-0.22, 1.2, 5], [-0.36, 0.92, 4]]
      .map(([fx, fy, r]) => `<circle cx="${r1(fx * w)}" cy="${r1(-fy * h)}" r="${r}" fill="${crest}" opacity="0.85"/>`)
      .join('');
  return at(x, y, 1, g, { flip });
}

/** A zigzag crack opened in the ground, running from (x0, y0) toward (x1, y1). */
export function fissure(x0: number, y0: number, x1: number, y1: number, w: number, fill: string): string {
  const n = 7;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t + (i % 2 ? 1 : -1) * 18 * (1 - t * 0.5);
    const y = y0 + (y1 - y0) * t;
    const ww = w * (1 - t) + 1;
    left.push(`${r1(x - ww)} ${r1(y)}`);
    right.unshift(`${r1(x + ww)} ${r1(y)}`);
  }
  return `<path d="M ${left.join(' L ')} L ${right.join(' L ')} Z" fill="${fill}"/>`;
}

/** A jagged lightning bolt from (x, y) downward, `len` long. */
export function bolt(x: number, y: number, len: number, w: number, fill: string, opacity = 1): string {
  const k = len / 170;
  return path(
    `M ${r1(x)} ${r1(y)} L ${r1(x - w)} ${r1(y + 80 * k)} L ${r1(x - w * 0.15)} ${r1(y + 74 * k)} L ${r1(x - w * 1.3)} ${r1(y + 170 * k)}` +
      ` L ${r1(x + w * 0.9)} ${r1(y + 64 * k)} L ${r1(x + w * 0.1)} ${r1(y + 70 * k)} L ${r1(x + w * 0.85)} ${r1(y)} Z`,
    fill,
    { opacity },
  );
}
