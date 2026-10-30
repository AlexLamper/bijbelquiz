/**
 * Extra motifs for the Psalmen 101-150 covers (quiz-cover-scenes-psalmen-3.mts).
 *
 * Same conventions as quiz-cover-primitives.mts: flat silhouette shapes, no
 * filters, `(x, y, s, fill, o?) => string`, and `y` is the ground a motif
 * stands on (or, for things in the air, its centre). Living things go through
 * `ink()` so a depth colour becomes the dark silhouette colour.
 */

import { at, figure, flame as aFlame, kneeler, sitter, star4 as aStar4 } from './cover-options/shapes.mjs';
import { circle, ellipse, ink, path, rect, rotate, tri } from './quiz-cover-primitives.mjs';

type Opts = { opacity?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const wrap = (g: string, o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g);

/** A round-capped stroke along any path. */
export function stroke(d: string, fill: string, w: number, opacity = 1): string {
  return (
    `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"` +
    `${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`
  );
}

// ── music ──────────────────────────────────────────────────────────────────

/**
 * A standing harp: pillar on the left, a curved neck on top and the soundbox
 * slanting up to the right, strings between. `y` is the floor; ~185*s tall.
 */
export function harp(x: number, y: number, s: number, fill: string, o?: Opts & { strings?: string }): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const P0 = [-48, -178];
  const P1 = [4, -122];
  const P2 = [58, -158];
  const q = (t: number) => [
    (1 - t) ** 2 * P0[0] + 2 * t * (1 - t) * P1[0] + t * t * P2[0],
    (1 - t) ** 2 * P0[1] + 2 * t * (1 - t) * P1[1] + t * t * P2[1],
  ];
  const neckY = (xx: number) => {
    let best = q(0);
    for (let i = 0; i <= 80; i += 1) {
      const pt = q(i / 80);
      if (Math.abs(pt[0] - xx) < Math.abs(best[0] - xx)) best = pt;
    }
    return best[1];
  };
  const boxY = (xx: number) => -2 + ((xx + 29) / 86) * -154;
  const out: string[] = [];
  const sc = o?.strings ?? fill;
  for (let i = 0; i < 9; i += 1) {
    const sx = -22 + i * 8.6;
    out.push(stroke(`M ${X(sx)} ${Y(neckY(sx) + 3)} L ${X(sx)} ${Y(boxY(sx))}`, sc, 2.4 * s, 0.9));
  }
  out.push(
    path(`M ${X(-54)} ${Y(-176)} C ${X(-62)} ${Y(-120)} ${X(-52)} ${Y(-50)} ${X(-46)} ${Y(0)} L ${X(-32)} ${Y(0)} C ${X(-38)} ${Y(-50)} ${X(-46)} ${Y(-120)} ${X(-40)} ${Y(-174)} Z`, fill),
    stroke(`M ${X(P0[0])} ${Y(P0[1])} Q ${X(P1[0])} ${Y(P1[1])} ${X(P2[0])} ${Y(P2[1])}`, fill, 11 * s),
    circle(x - 50 * s, y - 184 * s, 10 * s, fill),
    path(`M ${X(-42)} ${Y(-1)} L ${X(-16)} ${Y(-1)} L ${X(66)} ${Y(-150)} L ${X(50)} ${Y(-160)} Z`, fill),
    ellipse(x - 30 * s, y - 2 * s, 24 * s, 6 * s, fill),
  );
  return wrap(out.join(''), o);
}

/** A ram's horn (shofar): mouthpiece at (x, y), curving up to a wide bell on the right; ~130*s long. */
export function shofar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const g =
    path(
      `M ${X(0)} ${Y(-4)} C ${X(36)} ${Y(-6)} ${X(74)} ${Y(-20)} ${X(100)} ${Y(-66)} ` +
        `C ${X(116)} ${Y(-74)} ${X(134)} ${Y(-58)} ${X(130)} ${Y(-38)} ` +
        `C ${X(96)} ${Y(-6)} ${X(52)} ${Y(8)} ${X(0)} ${Y(5)} Z`,
      fill,
    ) +
    ellipse(x + 115 * s, y - 52 * s, 9 * s, 17 * s, fill) +
    circle(x - 2 * s, y, 5 * s, fill);
  return wrap(g, o);
}

/** A tambourine (timbrel) held up, centre at (x, y): a drum ring, jingles round the rim and two ribbons. */
export function tambourine(x: number, y: number, s: number, frame: string, skin: string, o?: Opts): string {
  const out = [
    circle(x, y, 30 * s, skin, { opacity: 0.75 }),
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(32 * s)}" fill="none" stroke="${frame}" stroke-width="${r1(9 * s)}"/>`,
  ];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * 2 * i) / 6 + 0.3;
    out.push(ellipse(x + Math.cos(a) * 38 * s, y + Math.sin(a) * 38 * s, 7 * s, 5 * s, frame));
  }
  out.push(stroke(`M ${r1(x + 10 * s)} ${r1(y + 38 * s)} q ${r1(10 * s)} ${r1(26 * s)} ${r1(-4 * s)} ${r1(52 * s)}`, frame, 4 * s, 0.85));
  out.push(stroke(`M ${r1(x + 20 * s)} ${r1(y + 34 * s)} q ${r1(18 * s)} ${r1(22 * s)} ${r1(10 * s)} ${r1(46 * s)}`, frame, 4 * s, 0.7));
  return wrap(out.join(''), o);
}

/** A pair of cymbals, held apart, centre at (x, y). */
export function cymbals(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const one = (dx: number, rot: number) =>
    rotate(rot, x + dx, y, ellipse(x + dx, y, 30 * s, 9 * s, fill) + circle(x + dx, y - 8 * s, 7 * s, fill));
  return wrap(one(-34 * s, -24) + one(34 * s, 24), o);
}

// ── people ─────────────────────────────────────────────────────────────────

/** A pilgrim with a tall staff, front view; `flip` turns the staff to the left. ~134*s tall. */
export function pilgrim(x: number, y: number, s: number, fill: string, o?: Opts & { flip?: boolean }): string {
  const g = at(x, y, s * (134 / 204), figure(ink(fill), 'staff'), { flip: o?.flip });
  return wrap(g, o);
}

export type FigPose = 'stand' | 'raise' | 'walk' | 'reach' | 'carry' | 'staff' | 'bless' | 'kneel' | 'kneelUp' | 'kneelForward';

/**
 * A figure in a pose `person()` does not offer, or mirrored: `flip` turns a
 * reaching arm or a kneeling figure to face left. Same sizes as `person()`.
 */
export function figureAt(x: number, y: number, s: number, fill: string, pose: FigPose, o?: Opts & { flip?: boolean }): string {
  fill = ink(fill);
  const flip = o?.flip ?? false;
  let g: string;
  if (pose === 'kneel') g = at(x, y, s * 0.6, kneeler(fill, 'pray'), { flip });
  else if (pose === 'kneelUp') g = at(x, y, s * 0.6, kneeler(fill, 'up'), { flip });
  else if (pose === 'kneelForward') g = at(x, y, s * 0.6, kneeler(fill, 'forward'), { flip });
  else g = at(x, y, s * (134 / 204), figure(fill, pose), { flip });
  return wrap(g, o);
}

/** A mother sitting on a low stone with a small child on her lap, resting against her shoulder. ~135*s tall. */
export function motherAndChild(x: number, y: number, s: number, fill: string, o?: Opts & { child?: string }): string {
  fill = ink(fill);
  const kid = ink(o?.child ?? fill);
  const k = s * 1.25;
  const g =
    rect(x - 46 * k, y - 14 * k, 92 * k, 14 * k, fill, { rx: 6 * k }) +
    at(x, y - 10 * k, k, sitter(fill, 0)) +
    // the child: body in her lap, head against her right shoulder
    ellipse(x + 20 * k, y - 50 * k, 15 * k, 20 * k, kid) +
    circle(x + 22 * k, y - 80 * k, 12 * k, kid) +
    stroke(`M ${r1(x - 10 * k)} ${r1(y - 62 * k)} C ${r1(x + 6 * k)} ${r1(y - 40 * k)} ${r1(x + 30 * k)} ${r1(y - 36 * k)} ${r1(x + 38 * k)} ${r1(y - 54 * k)}`, fill, 10 * k);
  return wrap(g, o);
}

// ── animals ────────────────────────────────────────────────────────────────

/** An eagle soaring, wings spread, seen from below; centre (x, y), ~380*s wide. */
export function eagle(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const wingL =
    'M -8 -14 C -40 -42 -110 -54 -178 -36 L -190 -28 L -166 -22 L -186 -12 L -160 -10 L -176 1 L -148 -1 ' +
    'L -160 11 L -132 6 L -136 18 L -108 10 C -76 16 -40 20 -8 14 Z';
  const wingR = wingL.replace(/-?\d+(\.\d+)? -?\d+(\.\d+)?/g, (m) => {
    const [a, b] = m.split(' ').map(Number);
    return `${-a} ${b}`;
  });
  const inner =
    path(wingL, fill) +
    path(wingR, fill) +
    ellipse(0, 4, 16, 34, fill) +
    circle(0, -36, 13, fill) +
    tri(-5, -46, 0, -60, 5, -46, fill) +
    path('M -12 28 L -30 68 Q 0 78 30 68 L 12 28 Z', fill);
  return wrap(at(x, y, s, inner), o);
}

/**
 * A ram in mid-leap, facing left: legs stretched fore and aft, the head up
 * with a big curled horn. `y` is the ground under the leap; ~120*s tall.
 */
export function leapingRam(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const inner =
    ellipse(0, -70, 46, 24, fill) +
    circle(-22, -80, 20, fill) +
    circle(18, -78, 20, fill) +
    // forelegs reaching forward, hind legs pushing back
    stroke('M -30 -60 L -66 -44 L -86 -48', fill, 10) +
    stroke('M -20 -58 L -52 -36 L -72 -36', fill, 10) +
    stroke('M 30 -60 L 62 -36 L 88 -26', fill, 10) +
    stroke('M 20 -58 L 50 -30 L 74 -16', fill, 10) +
    // neck and head, raised
    path('M -34 -84 L -58 -116 L -44 -126 L -22 -92 Z', fill) +
    path('M -46 -134 C -62 -142 -82 -132 -86 -118 C -88 -108 -78 -104 -68 -108 L -46 -112 Z', fill) +
    // the curled horn
    `<path d="M -50 -132 C -30 -150 -8 -136 -14 -118 C -18 -106 -34 -106 -36 -118" fill="none" stroke="${fill}" stroke-width="9" stroke-linecap="round"/>` +
    // short tail
    stroke('M 44 -78 L 56 -86', fill, 8);
  return wrap(at(x, y, s, inner), o);
}

/** A small bird perched, facing left - a sparrow on the roof. `y` is the perch; ~44*s tall. */
export function perchedBird(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const inner =
    rotate(-14, 0, -20, ellipse(0, -20, 21, 13, fill)) +
    circle(-17, -33, 10.5, fill) +
    tri(-25, -36, -36, -31, -25, -28, fill) +
    path('M 14 -24 L 42 -12 L 38 -5 L 12 -13 Z', fill) +
    stroke('M -4 -9 L -6 0 M 5 -9 L 5 0', fill, 2.6);
  return wrap(at(x, y, s, inner), o);
}

/** A nest of young ravens on a branch fork, beaks open wide; `y` is the bottom of the nest. */
export function ravenNest(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const out: string[] = [];
  for (const [dx, dy, rot] of [
    [-24, -30, -24],
    [0, -38, 4],
    [24, -32, 28],
  ] as const) {
    const cx = x + dx * s;
    const cy = y + dy * s;
    out.push(
      ellipse(cx, cy + 10 * s, 10 * s, 14 * s, fill),
      circle(cx, cy - 4 * s, 8 * s, fill),
      rotate(rot, cx, cy - 8 * s, tri(cx - 6 * s, cy - 8 * s, cx, cy - 30 * s, cx + 1 * s, cy - 8 * s, fill) + tri(cx + 1 * s, cy - 8 * s, cx + 8 * s, cy - 28 * s, cx + 6 * s, cy - 6 * s, fill)),
    );
  }
  out.push(path(`M ${r1(x - 48 * s)} ${r1(y - 22 * s)} Q ${r1(x)} ${r1(y + 14 * s)} ${r1(x + 48 * s)} ${r1(y - 22 * s)} L ${r1(x + 40 * s)} ${r1(y - 8 * s)} Q ${r1(x)} ${r1(y + 8 * s)} ${r1(x - 40 * s)} ${r1(y - 8 * s)} Z`, fill));
  out.push(stroke(`M ${r1(x - 52 * s)} ${r1(y - 20 * s)} L ${r1(x - 62 * s)} ${r1(y - 30 * s)} M ${r1(x + 50 * s)} ${r1(y - 22 * s)} L ${r1(x + 64 * s)} ${r1(y - 28 * s)}`, fill, 3 * s));
  return wrap(out.join(''), o);
}

// ── fire, light, weather ───────────────────────────────────────────────────

/** The pillar of fire: one tall flame with a lighter core and low tongues at its foot. `y` is its foot. */
export function firePillar(x: number, y: number, h: number, w: number, outer: string, core: string, o?: Opts): string {
  const g =
    at(x - w * 0.32, y, 1, aFlame(h * 0.32, w * 0.6, outer, -10)) +
    at(x + w * 0.34, y, 1, aFlame(h * 0.36, w * 0.6, outer, 12)) +
    at(x, y, 1, aFlame(h, w, outer, 6)) +
    at(x, y, 1, aFlame(h * 0.72, w * 0.5, core, 4)) +
    at(x, y, 1, aFlame(h * 0.4, w * 0.3, '#FFFFFF', 0), { opacity: 0.55 });
  return wrap(g, o);
}

/** A zigzag lightning bolt hanging down from (x, y); ~220*s long. */
export function lightning(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  return wrap(
    path(`M ${X(-6)} ${Y(0)} L ${X(34)} ${Y(0)} L ${X(10)} ${Y(78)} L ${X(42)} ${Y(78)} L ${X(-22)} ${Y(220)} L ${X(-6)} ${Y(110)} L ${X(-36)} ${Y(110)} Z`, fill),
    o,
  );
}

/**
 * A crescent moon, horns to the right, centre (x, y), radius r. (The shared
 * `crescent()` primitive draws nothing: its inner arc cannot span the chord.)
 */
export function moon(x: number, y: number, r: number, fill: string, o?: Opts): string {
  const d = 0.45 * r;
  const r2 = 0.85 * r;
  const xi = (d * d + r * r - r2 * r2) / (2 * d);
  const yi = Math.sqrt(r * r - xi * xi);
  return wrap(
    path(
      `M ${r1(x + xi)} ${r1(y - yi)} A ${r1(r)} ${r1(r)} 0 1 0 ${r1(x + xi)} ${r1(y + yi)} ` +
        `A ${r1(r2)} ${r1(r2)} 0 1 1 ${r1(x + xi)} ${r1(y - yi)} Z`,
      fill,
    ),
    o,
  );
}

/** A four-pointed star centred at (x, y), radius r. */
export function star(x: number, y: number, r: number, fill: string, o?: Opts): string {
  return wrap(at(x, y, 1, aStar4(r, fill)), o);
}

// ── things ─────────────────────────────────────────────────────────────────

/** The ark of the covenant with two cherubim on the lid, carried on poles; `y` is the bottom of the ark. */
export function arkOfCovenant(x: number, y: number, s: number, gold: string, pole: string, o?: Opts): string {
  const inner =
    rect(-72, -58, 144, 50, gold) +
    rect(-78, -66, 156, 10, gold) +
    rect(-66, -10, 14, 10, gold) +
    rect(52, -10, 14, 10, gold) +
    rect(-66, -46, 132, 4, '#FFFFFF', { opacity: 0.35 }) +
    rect(-66, -24, 132, 4, '#FFFFFF', { opacity: 0.35 }) +
    // the cherubim, kneeling face to face, wings arched over the lid
    path('M -56 -66 L -50 -92 L -36 -98 L -30 -66 Z', gold) +
    circle(-40, -104, 8, gold) +
    path('M -42 -96 C -50 -136 -14 -150 -2 -128 C -18 -126 -30 -114 -32 -94 Z', gold) +
    path('M 56 -66 L 50 -92 L 36 -98 L 30 -66 Z', gold) +
    circle(40, -104, 8, gold) +
    path('M 42 -96 C 50 -136 14 -150 2 -128 C 18 -126 30 -114 32 -94 Z', gold) +
    rect(-150, -34, 300, 8, ink(pole), { rx: 4 });
  return wrap(at(x, y, s, inner), o);
}

/** The golden altar of incense with its horns; `y` is the floor; ~112*s tall. */
export function incenseAltar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const inner =
    rect(-36, -12, 72, 12, fill) +
    rect(-27, -88, 54, 78, fill) +
    rect(-36, -98, 72, 12, fill) +
    tri(-36, -98, -36, -114, -22, -98, fill) +
    tri(36, -98, 36, -114, 22, -98, fill) +
    rect(-27, -70, 54, 5, '#FFFFFF', { opacity: 0.3 }) +
    rect(-27, -30, 54, 5, '#FFFFFF', { opacity: 0.3 });
  return wrap(at(x, y, s, inner), o);
}

/** Rising incense: three thin white curls going up from (x, y), `h` tall. */
export function incenseSmoke(x: number, y: number, h: number, fill: string, opacity = 0.75): string {
  const out: string[] = [];
  // Three wisps that leave the altar together and drift apart as they rise.
  for (const [drift, phase, w, op] of [
    [-0.22, 0, 9, 1],
    [0.18, 1.8, 7, 0.85],
    [0.02, 3.4, 5, 0.7],
  ] as const) {
    const pts: string[] = [];
    const n = 28;
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      const yy = y - h * t;
      const xx = x + drift * h * t + Math.sin(t * 7 + phase) * 16 * t;
      pts.push(`${r1(xx)} ${r1(yy)}`);
    }
    out.push(stroke(`M ${pts.join(' L ')}`, fill, w, r1(opacity * op * 100) / 100));
  }
  return out.join('');
}

/** The seven-branched lampstand with its seven flames; `y` is the floor; ~190*s tall. */
export function menorah(x: number, y: number, s: number, fill: string, flameFill: string, o?: Opts): string {
  const top = -150;
  const out = [path('M -34 0 L 34 0 L 16 -18 L -16 -18 Z', fill), rect(-5, top, 10, 136, fill)];
  for (const r of [26, 52, 78]) {
    out.push(`<path d="M ${-r} ${top} A ${r} ${r} 0 0 0 ${r} ${top}" fill="none" stroke="${fill}" stroke-width="9"/>`);
  }
  for (const dx of [-78, -52, -26, 0, 26, 52, 78]) {
    out.push(path(`M ${dx - 9} ${top - 10} L ${dx + 9} ${top - 10} L ${dx + 5} ${top + 2} L ${dx - 5} ${top + 2} Z`, fill));
    out.push(at(dx, top - 10, 1, aFlame(30, 14, flameFill, 0)));
  }
  return wrap(at(x, y, s, out.join('')), o);
}

/** A round shield with a raised boss, centre (x, y), radius ~50*s. */
export function roundShield(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    circle(x, y, 50 * s, fill) +
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(38 * s)}" fill="none" stroke="#FFFFFF" stroke-width="${r1(4 * s)}" opacity="0.35"/>` +
    circle(x, y, 13 * s, '#FFFFFF', { opacity: 0.35 }) +
    circle(x, y, 9 * s, fill);
  return wrap(g, o);
}

/** A wooden plough: the beam runs left to the yoke, share in the ground, handle up to the right. `y` is the ground. */
export function plough(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const g =
    stroke(`M ${X(-150)} ${Y(-58)} Q ${X(-70)} ${Y(-44)} ${X(-4)} ${Y(-16)}`, fill, 8 * s) +
    path(`M ${X(12)} ${Y(-22)} L ${X(-30)} ${Y(2)} L ${X(16)} ${Y(2)} Z`, fill) +
    stroke(`M ${X(4)} ${Y(-6)} L ${X(48)} ${Y(-92)}`, fill, 8 * s) +
    stroke(`M ${X(40)} ${Y(-92)} L ${X(62)} ${Y(-88)}`, fill, 7 * s);
  return wrap(g, o);
}

/** A bird snare broken open on the ground: a sprung net hoop, its cord snapped. `y` is the ground. */
export function brokenSnare(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const out = [
    // the hoop lying flat, and the half that sprang up and snapped
    stroke(`M ${X(-90)} ${Y(0)} Q ${X(-46)} ${Y(-70)} ${X(0)} ${Y(0)}`, fill, 6 * s),
    stroke(`M ${X(6)} ${Y(0)} Q ${X(30)} ${Y(-58)} ${X(58)} ${Y(-64)}`, fill, 6 * s),
    stroke(`M ${X(74)} ${Y(-56)} Q ${X(96)} ${Y(-30)} ${X(98)} ${Y(0)}`, fill, 6 * s),
    // the net
    stroke(`M ${X(-76)} ${Y(-18)} L ${X(-20)} ${Y(-18)} M ${X(-64)} ${Y(-34)} L ${X(-30)} ${Y(-34)} M ${X(-66)} ${Y(-6)} L ${X(-54)} ${Y(-40)} M ${X(-46)} ${Y(-2)} L ${X(-46)} ${Y(-44)} M ${X(-26)} ${Y(-6)} L ${X(-38)} ${Y(-40)}`, fill, 2.6 * s, 0.8),
    stroke(`M ${X(18)} ${Y(-20)} L ${X(40)} ${Y(-50)} M ${X(26)} ${Y(-6)} L ${X(52)} ${Y(-44)} M ${X(14)} ${Y(-34)} L ${X(48)} ${Y(-30)}`, fill, 2.6 * s, 0.8),
    // the snapped cord and the peg
    stroke(`M ${X(0)} ${Y(0)} L ${X(0)} ${Y(-24)} M ${X(58)} ${Y(-64)} L ${X(64)} ${Y(-72)} L ${X(60)} ${Y(-78)} M ${X(74)} ${Y(-56)} L ${X(70)} ${Y(-66)} L ${X(76)} ${Y(-72)}`, fill, 3 * s),
    ellipse(x - 44 * s, y, 56 * s, 5 * s, fill, { opacity: 0.5 }),
  ];
  return wrap(out.join(''), o);
}

/** A ram's horn of oil, wide end up and to the right (where it is held), drops falling from its tip at (x, y). */
export function hornOfOil(x: number, y: number, s: number, fill: string, o?: Opts & { rot?: number }): string {
  const horn = rotate(o?.rot ?? -12, x, y, shofar(x, y, s, fill));
  const drops = [0, 1, 2].map((i) => circle(x - 2 * s, y + (22 + i * 24) * s, (6 - i) * s, fill, { opacity: 1 - i * 0.2 })).join('');
  return wrap(horn + drops, o);
}

/** A rough rock face with a cave mouth; `y` is the ground; ~2*w*s wide, h*s tall. */
export function caveRock(x: number, y: number, s: number, rock: string, hole: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const g =
    path(
      `M ${X(-300)} ${Y(0)} L ${X(-270)} ${Y(-90)} L ${X(-230)} ${Y(-120)} L ${X(-190)} ${Y(-200)} L ${X(-120)} ${Y(-236)} L ${X(-60)} ${Y(-226)} ` +
        `L ${X(10)} ${Y(-262)} L ${X(80)} ${Y(-232)} L ${X(140)} ${Y(-240)} L ${X(200)} ${Y(-180)} L ${X(250)} ${Y(-120)} L ${X(290)} ${Y(-40)} L ${X(320)} ${Y(0)} Z`,
      rock,
    ) +
    path(
      `M ${X(-96)} ${Y(0)} C ${X(-104)} ${Y(-60)} ${X(-84)} ${Y(-140)} ${X(-20)} ${Y(-150)} C ${X(40)} ${Y(-156)} ${X(84)} ${Y(-100)} ${X(92)} ${Y(-40)} L ${X(100)} ${Y(0)} Z`,
      hole,
    );
  return wrap(g, o);
}

/** A weeping willow: trunk, a few boughs and long hanging strands. `y` is the ground; ~230*s tall. */
export function willow(rand: () => number, x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const out = [
    path(`M ${X(-18)} ${Y(0)} C ${X(-10)} ${Y(-60)} ${X(-22)} ${Y(-110)} ${X(-8)} ${Y(-170)} L ${X(10)} ${Y(-170)} C ${X(6)} ${Y(-110)} ${X(16)} ${Y(-60)} ${X(22)} ${Y(0)} Z`, fill),
    stroke(`M ${X(0)} ${Y(-160)} Q ${X(-60)} ${Y(-210)} ${X(-150)} ${Y(-196)}`, fill, 9 * s),
    stroke(`M ${X(0)} ${Y(-160)} Q ${X(70)} ${Y(-214)} ${X(160)} ${Y(-198)}`, fill, 9 * s),
    stroke(`M ${X(-2)} ${Y(-166)} Q ${X(-10)} ${Y(-220)} ${X(-50)} ${Y(-240)}`, fill, 7 * s),
    stroke(`M ${X(2)} ${Y(-166)} Q ${X(20)} ${Y(-224)} ${X(64)} ${Y(-238)}`, fill, 7 * s),
  ];
  for (let i = 0; i < 34; i += 1) {
    const t = i / 33;
    const sx = -170 + t * 340 + (rand() - 0.5) * 12;
    const sy = -200 - Math.cos((sx / 170) * (Math.PI / 2)) * 44 + (rand() - 0.5) * 8;
    const len = 90 + rand() * 80 - Math.abs(sx) * 0.15;
    const sway = (sx > 0 ? 1 : -1) * (6 + rand() * 10);
    out.push(stroke(`M ${X(sx)} ${Y(sy)} Q ${X(sx + sway)} ${Y(sy + len * 0.5)} ${X(sx + sway * 0.6)} ${Y(sy + len)}`, fill, (3 + rand() * 2) * s, 0.9));
  }
  return wrap(out.join(''), o);
}

/**
 * A wall of the sea piled up like a breaking wave, its crest curling over the
 * dry path. `side` is the side the path is on ('right': the wall stands on the
 * left of the gap and curls right). `y` is the ground.
 */
export function waterWall(x0: number, x1: number, y: number, h: number, fill: string, side: 'left' | 'right', o?: Opts): string {
  const outer = side === 'right' ? x0 : x1;
  const dir = side === 'right' ? 1 : -1;
  const w = Math.abs(x1 - x0);
  const X = (f: number) => r1(outer + dir * w * f);
  const Y = (f: number) => r1(y - h * f);
  const crest = `M ${X(0.56)} ${Y(0.9)} C ${X(0.68)} ${Y(1.0)} ${X(0.9)} ${Y(1.04)} ${X(1.08)} ${Y(0.94)}`;
  const out = [
    path(
      `M ${X(-0.1)} ${Y(0)} C ${X(-0.04)} ${Y(0.3)} ${X(0.08)} ${Y(0.5)} ${X(0.2)} ${Y(0.62)} ` +
        `C ${X(0.32)} ${Y(0.74)} ${X(0.44)} ${Y(0.8)} ${X(0.56)} ${Y(0.9)} ` +
        `C ${X(0.68)} ${Y(1.0)} ${X(0.9)} ${Y(1.04)} ${X(1.08)} ${Y(0.94)} ` +
        `C ${X(1.14)} ${Y(0.88)} ${X(1.08)} ${Y(0.8)} ${X(1.0)} ${Y(0.84)} ` +
        `C ${X(0.95)} ${Y(0.7)} ${X(0.97)} ${Y(0.36)} ${X(1.02)} ${Y(0)} Z`,
      fill,
    ),
  ];
  for (const [f, a, len] of [
    [0.14, 0.08, 0.34],
    [0.14, 0.52, 0.36],
    [0.3, 0.2, 0.4],
    [0.3, 0.66, 0.26],
    [0.46, 0.1, 0.3],
    [0.46, 0.5, 0.36],
    [0.62, 0.34, 0.4],
    [0.76, 0.56, 0.3],
  ] as const) {
    const dl = dir * w * len;
    out.push(stroke(`M ${X(a)} ${Y(f)} q ${r1(dl / 4)} -7 ${r1(dl / 2)} 0 t ${r1(dl / 2)} 0`, '#FFFFFF', 4, 0.5));
  }
  out.push(stroke(crest, '#FFFFFF', 6, 0.85));
  return wrap(out.join(''), o);
}

/** A tall water pitcher with one handle; `y` is the floor; ~84*s tall. */
export function pitcher(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const g =
    path(`M ${X(-14)} ${Y(0)} C ${X(-34)} ${Y(-20)} ${X(-34)} ${Y(-52)} ${X(-12)} ${Y(-64)} L ${X(-10)} ${Y(-78)} L ${X(-16)} ${Y(-84)} L ${X(16)} ${Y(-84)} L ${X(10)} ${Y(-78)} L ${X(12)} ${Y(-64)} C ${X(34)} ${Y(-52)} ${X(34)} ${Y(-20)} ${X(14)} ${Y(0)} Z`, fill) +
    stroke(`M ${X(12)} ${Y(-76)} C ${X(38)} ${Y(-76)} ${X(40)} ${Y(-50)} ${X(26)} ${Y(-40)}`, fill, 6 * s);
  return wrap(g, o);
}

/** A low table with a cloth edge; `y` is the floor, `w` its width. */
export function table(x: number, y: number, w: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - w / 2, y - 54 * s, w, 11 * s, fill, { rx: 3 * s }) +
    rect(x - w / 2 + 12 * s, y - 44 * s, 9 * s, 44 * s, fill) +
    rect(x + w / 2 - 21 * s, y - 44 * s, 9 * s, 44 * s, fill);
  return wrap(g, o);
}

/** A cedar of Lebanon: a straight trunk and flat, layered tiers of branches. `y` is the ground; ~240*s tall. */
export function cedar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const out = [path(`M ${r1(x - 12 * s)} ${r1(y)} L ${r1(x - 6 * s)} ${r1(y - 220 * s)} L ${r1(x + 6 * s)} ${r1(y - 220 * s)} L ${r1(x + 12 * s)} ${r1(y)} Z`, fill)];
  for (let i = 0; i < 5; i += 1) {
    const ty = y - (70 + i * 36) * s;
    const tw = (130 - i * 22) * s;
    const dx = (i % 2 ? 14 : -14) * s;
    out.push(path(`M ${r1(x + dx - tw)} ${r1(ty + 6 * s)} Q ${r1(x + dx)} ${r1(ty - 30 * s)} ${r1(x + dx + tw)} ${r1(ty + 6 * s)} Q ${r1(x + dx)} ${r1(ty + 18 * s)} ${r1(x + dx - tw)} ${r1(ty + 6 * s)} Z`, fill));
  }
  out.push(ellipse(x, y - 238 * s, 26 * s, 12 * s, fill));
  return wrap(out.join(''), o);
}

/** A bare tree with forked boughs; `y` is the ground, ~270*s tall. The top fork sits near (x - 18s, y - 250s). */
export function bareTree(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const g =
    path(`M ${X(-18)} ${Y(0)} C ${X(-10)} ${Y(-60)} ${X(-14)} ${Y(-120)} ${X(-6)} ${Y(-170)} L ${X(8)} ${Y(-170)} C ${X(8)} ${Y(-120)} ${X(12)} ${Y(-60)} ${X(20)} ${Y(0)} Z`, fill) +
    stroke(`M ${X(0)} ${Y(-150)} Q ${X(-50)} ${Y(-186)} ${X(-116)} ${Y(-214)}`, fill, 11 * s) +
    stroke(`M ${X(0)} ${Y(-158)} Q ${X(44)} ${Y(-206)} ${X(108)} ${Y(-230)}`, fill, 11 * s) +
    stroke(`M ${X(0)} ${Y(-166)} Q ${X(-4)} ${Y(-214)} ${X(-18)} ${Y(-252)}`, fill, 9 * s) +
    stroke(`M ${X(-62)} ${Y(-190)} L ${X(-92)} ${Y(-246)} M ${X(52)} ${Y(-200)} L ${X(74)} ${Y(-262)}`, fill, 6 * s) +
    stroke(`M ${X(-82)} ${Y(-202)} L ${X(-146)} ${Y(-200)} M ${X(80)} ${Y(-218)} L ${X(138)} ${Y(-206)} M ${X(-18)} ${Y(-252)} L ${X(-10)} ${Y(-282)}`, fill, 4 * s);
  return wrap(g, o);
}

/** A low goat-hair tent of the desert (the tents of Kedar): a long ridge with three peaks and guy ropes. */
export function blackTent(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const X = (v: number) => r1(x + v * s);
  const Y = (v: number) => r1(y + v * s);
  const g =
    path(`M ${X(-112)} ${Y(0)} L ${X(-104)} ${Y(-50)} L ${X(-62)} ${Y(-66)} L ${X(-20)} ${Y(-52)} L ${X(18)} ${Y(-72)} L ${X(60)} ${Y(-54)} L ${X(102)} ${Y(-62)} L ${X(114)} ${Y(0)} Z`, fill) +
    path(`M ${X(-10)} ${Y(0)} L ${X(-6)} ${Y(-40)} L ${X(26)} ${Y(-40)} L ${X(30)} ${Y(0)} Z`, '#FFFFFF', { opacity: 0.22 }) +
    stroke(`M ${X(-104)} ${Y(-50)} L ${X(-146)} ${Y(0)} M ${X(102)} ${Y(-62)} L ${X(148)} ${Y(0)}`, fill, 2.5 * s, 0.8);
  return wrap(g, o);
}

/** A field flower: a stem, two leaves and a five-petalled bloom. `y` is the ground; ~56*s tall. */
export function fieldFlower(x: number, y: number, s: number, stem: string, bloom: string, o?: Opts): string {
  const out = [
    stroke(`M ${r1(x)} ${r1(y)} Q ${r1(x + 4 * s)} ${r1(y - 22 * s)} ${r1(x)} ${r1(y - 44 * s)}`, stem, 3 * s),
    path(`M ${r1(x)} ${r1(y - 14 * s)} q ${r1(14 * s)} ${r1(-4 * s)} ${r1(18 * s)} ${r1(-18 * s)} q ${r1(-14 * s)} ${r1(4 * s)} ${r1(-18 * s)} ${r1(18 * s)} Z`, stem),
  ];
  for (let i = 0; i < 5; i += 1) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    out.push(circle(x + Math.cos(a) * 8 * s, y - 48 * s + Math.sin(a) * 8 * s, 6.5 * s, bloom));
  }
  out.push(circle(x, y - 48 * s, 4 * s, '#FFFFFF', { opacity: 0.7 }));
  return wrap(out.join(''), o);
}

/** A fowler's net spread flat on the ground beside a path, seen at a low angle; centre (x, y). */
export function groundNet(x: number, y: number, rx: number, ry: number, fill: string, o?: Opts): string {
  const out = [`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="none" stroke="${fill}" stroke-width="4"/>`];
  for (let i = -4; i <= 4; i += 1) {
    const t = i / 5;
    const h = ry * Math.sqrt(1 - t * t);
    out.push(stroke(`M ${r1(x + t * rx - 6)} ${r1(y - h)} L ${r1(x + t * rx + 6)} ${r1(y + h)}`, fill, 2.4, 0.85));
  }
  for (const t of [-0.5, 0, 0.5]) {
    const w = rx * Math.sqrt(1 - t * t);
    out.push(stroke(`M ${r1(x - w)} ${r1(y + t * ry)} L ${r1(x + w)} ${r1(y + t * ry)}`, fill, 2.4, 0.85));
  }
  return wrap(out.join(''), o);
}

/** A climbing vine on a wall: a twisting stem, leaves and hanging clusters in `grape`. */
export function wallVine(x: number, y: number, h: number, s: number, leaf: string, grape: string, o?: Opts): string {
  const out = [stroke(`M ${r1(x)} ${r1(y)} C ${r1(x + 20 * s)} ${r1(y - h * 0.3)} ${r1(x - 20 * s)} ${r1(y - h * 0.6)} ${r1(x + 10 * s)} ${r1(y - h)}`, leaf, 6 * s)];
  for (let i = 0; i < 7; i += 1) {
    const t = 0.2 + i * 0.12;
    const lx = x + (i % 2 ? 18 : -18) * s;
    const ly = y - h * t;
    out.push(ellipse(lx, ly, 18 * s, 10 * s, leaf));
  }
  for (const [dx, t] of [
    [24, 0.36],
    [-22, 0.6],
    [26, 0.82],
  ] as const) {
    const gx = x + dx * s;
    const gy = y - h * t;
    for (let row = 0; row < 3; row += 1) {
      for (let k = 0; k < 3 - row; k += 1) out.push(circle(gx + (k - (2 - row) / 2) * 11 * s, gy + row * 10 * s, 6.5 * s, grape));
    }
  }
  return wrap(out.join(''), o);
}
