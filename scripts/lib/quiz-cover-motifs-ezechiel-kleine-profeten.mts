/**
 * Motifs for the Ezechiel, Zacharia and kleine-profeten covers that the
 * shared primitives do not have: the wheels and living creatures of Ezechiel
 * 1, a sword, a balance, a shofar, an eagle, a cedar, the Nile crocodile, a
 * boiling pot, the golden lampstand of Zacharia 4, an altar with horns, round
 * shields, bones, a camel, a net, a rock-cut facade, a smelting furnace, an
 * axe, a lantern, a lyre, the winged sun of Maleachi 4, a shepherd's crook, a
 * sickle and a few small things (a swaddled child, a closed gate, a clay
 * tile, a broken sword, a pile of weapons).
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouette shapes,
 * `(x, y, s, fill, o?) => string`, `y` is the ground the motif stands on
 * unless the doc comment says otherwise. Animals and people go through
 * `ink()` so a depth colour becomes the dark silhouette, as the primitives do.
 * Large dark shapes are written as raw paths so the primitives' hill/wall
 * colour mapping does not turn them into landform.
 */

import { circle, ellipse, ink, rect, rotate, tri } from './quiz-cover-primitives.mjs';
import { at, broadWing, figure, heart as aHeart, sheep as aSheep } from './cover-options/shapes.mjs';

type Opts = { opacity?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const wrap = (g: string, o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g);

/** A filled path with no colour mapping. */
export function raw(d: string, fill: string, opacity = 1): string {
  return `<path d="${d}" fill="${fill}"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

/** A round-capped stroke along a path. */
export function stroke(d: string, color: string, w: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${
    opacity !== 1 ? ` opacity="${opacity}"` : ''
  }/>`;
}

/** A straight round-capped stroke. */
export function bar(x1: number, y1: number, x2: number, y2: number, w: number, color: string, opacity = 1): string {
  return stroke(`M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}`, color, w, opacity);
}

/** Mirror a fragment about the vertical line through x. */
export function mirror(x: number, inner: string): string {
  return `<g transform="translate(${r1(2 * x)} 0) scale(-1 1)">${inner}</g>`;
}

/**
 * A tapered band along a cubic curve: thick (w0) at the start, thin (w1) at
 * the end. Horns, tails, branches.
 */
export function taper(
  p0: [number, number],
  c1: [number, number],
  c2: [number, number],
  p3: [number, number],
  w0: number,
  w1: number,
  fill: string,
  opacity = 1,
): string {
  const n = 18;
  const pts: [number, number][] = [];
  const nrm: [number, number][] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1];
    const dx = 3 * u * u * (c1[0] - p0[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p3[0] - c2[0]);
    const dy = 3 * u * u * (c1[1] - p0[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p3[1] - c2[1]);
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    pts.push([x, y]);
    nrm.push([(-dy / len) * w, (dx / len) * w]);
  }
  const left = pts.map(([x, y], i) => `${r1(x + nrm[i][0])} ${r1(y + nrm[i][1])}`);
  const right = pts.map(([x, y], i) => `${r1(x - nrm[i][0])} ${r1(y - nrm[i][1])}`).reverse();
  return raw(`M ${left.join(' L ')} L ${right.join(' L ')} Z`, fill, opacity);
}

// ── visions ─────────────────────────────────────────────────────────────────

/**
 * Ezechiel's wheel "als een rad in het midden van een rad", its rims full of
 * eyes. `y` is the ground under the rim; `r` the radius.
 */
export function wheelInWheel(x: number, y: number, r: number, fill: string, eyes: string, o?: Opts): string {
  const cy = y - r;
  const w = r * 0.11;
  const out = [
    `<circle cx="${r1(x)}" cy="${r1(cy)}" r="${r1(r)}" fill="none" stroke="${fill}" stroke-width="${r1(w)}"/>`,
    `<ellipse cx="${r1(x)}" cy="${r1(cy)}" rx="${r1(r * 0.4)}" ry="${r1(r * 0.97)}" fill="none" stroke="${fill}" stroke-width="${r1(w * 0.8)}"/>`,
    circle(x, cy, r * 0.15, fill),
  ];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * i) / 3 + Math.PI / 6;
    out.push(bar(x, cy, x + Math.cos(a) * r * 0.94, cy + Math.sin(a) * r * 0.94, w * 0.45, fill));
  }
  for (let i = 0; i < 14; i += 1) {
    const a = (Math.PI * 2 * i) / 14;
    out.push(circle(x + Math.cos(a) * r, cy + Math.sin(a) * r, w * 0.32, eyes));
  }
  return wrap(out.join(''), o);
}

/**
 * A cherub or living creature: a robed figure with two wings raised so their
 * tips meet above it and two wings lowered over the body (Ezechiel 1:11).
 */
export function livingCreature(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const k = s * (134 / 204);
  const wings =
    at(-8, -150, 1, broadWing(fill, 190, 1.15), { rot: -14 }) +
    at(8, -150, 1, broadWing(fill, 190, 1.15), { rot: 14, flip: true }) +
    at(-14, -132, 1, broadWing(fill, 140, 1.1), { rot: -128 }) +
    at(14, -132, 1, broadWing(fill, 140, 1.1), { rot: 128, flip: true });
  return wrap(at(x, y, k, wings + figure(fill, 'stand')), o);
}

/** A robed figure holding a staff on its right, as a shepherd or the measuring man. */
export function staffBearer(x: number, y: number, s: number, fill: string, staffFill?: string, o?: Opts): string {
  fill = ink(fill);
  const k = s * (134 / 204);
  return wrap(at(x, y, k, figure(fill, 'staff', { staffFill: staffFill ?? fill })), o);
}

/** A front-view robed figure in one of the extra A poses ('bless', 'reach', 'shield'). */
export function poser(x: number, y: number, s: number, fill: string, pose: 'bless' | 'reach' | 'shield' | 'carry', o?: Opts & { flip?: boolean }): string {
  fill = ink(fill);
  const k = s * (134 / 204);
  return wrap(at(x, y, k, figure(fill, pose), { flip: o?.flip }), o);
}

// ── weapons and tools ───────────────────────────────────────────────────────

/** A straight sword, point up; `y` is the bottom of the pommel. ~290s long. */
export function sword(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    circle(x, y - 6 * s, 10 * s, fill) +
    rect(x - 7 * s, y - 52 * s, 14 * s, 46 * s, fill, { rx: 4 * s }) +
    rect(x - 44 * s, y - 64 * s, 88 * s, 12 * s, fill, { rx: 6 * s }) +
    raw(
      `M ${r1(x - 13 * s)} ${r1(y - 64 * s)} L ${r1(x - 11 * s)} ${r1(y - 250 * s)} L ${r1(x)} ${r1(y - 292 * s)} L ${r1(x + 11 * s)} ${r1(y - 250 * s)} L ${r1(x + 13 * s)} ${r1(y - 64 * s)} Z`,
      fill,
    ) +
    raw(`M ${r1(x - 1.5 * s)} ${r1(y - 70 * s)} L ${r1(x - 1.5 * s)} ${r1(y - 250 * s)} L ${r1(x + 1.5 * s)} ${r1(y - 250 * s)} L ${r1(x + 1.5 * s)} ${r1(y - 70 * s)} Z`, '#FFFFFF', 0.45);
  return wrap(g, o);
}

/** A sword snapped in two, lying on the ground. */
export function brokenSword(x: number, y: number, s: number, fill: string, o?: Opts): string {
  // Lying on the ground, hilt to the left; the point lies a little apart, askew.
  const g =
    circle(x - 128 * s, y - 14 * s, 11 * s, fill) +
    rect(x - 122 * s, y - 21 * s, 52 * s, 14 * s, fill, { rx: 4 * s }) +
    rotate(-18, x - 66 * s, y - 14 * s, rect(x - 72 * s, y - 58 * s, 12 * s, 88 * s, fill, { rx: 6 * s })) +
    raw(`M ${r1(x - 62 * s)} ${r1(y - 27 * s)} L ${r1(x + 36 * s)} ${r1(y - 26 * s)} L ${r1(x + 28 * s)} ${r1(y - 16 * s)} L ${r1(x + 40 * s)} ${r1(y - 8 * s)} L ${r1(x + 30 * s)} ${r1(y - 2 * s)} L ${r1(x - 62 * s)} ${r1(y - 1 * s)} Z`, fill) +
    rotate(-9, x + 70 * s, y - 4 * s,
      raw(`M ${r1(x + 62 * s)} ${r1(y - 25 * s)} L ${r1(x + 172 * s)} ${r1(y - 20 * s)} L ${r1(x + 210 * s)} ${r1(y - 12 * s)} L ${r1(x + 172 * s)} ${r1(y - 3 * s)} L ${r1(x + 64 * s)} ${r1(y - 1 * s)} L ${r1(x + 72 * s)} ${r1(y - 10 * s)} Z`, fill)) +
    raw(`M ${r1(x - 56 * s)} ${r1(y - 15 * s)} L ${r1(x + 26 * s)} ${r1(y - 15 * s)} L ${r1(x + 26 * s)} ${r1(y - 12 * s)} L ${r1(x - 56 * s)} ${r1(y - 12 * s)} Z`, '#FFFFFF', 0.4);
  return wrap(g, o);
}

/** A balance on a post; `tilt` > 0 drops the right pan. */
export function scales(x: number, y: number, s: number, fill: string, tilt = 0, o?: Opts): string {
  const top = y - 190 * s;
  const half = 110 * s;
  const dy = Math.sin((tilt * Math.PI) / 180) * half;
  const pan = (px: number, py: number) =>
    bar(px, py, px - 34 * s, py + 74 * s, 3 * s, fill) +
    bar(px, py, px + 34 * s, py + 74 * s, 3 * s, fill) +
    raw(`M ${r1(px - 46 * s)} ${r1(py + 74 * s)} L ${r1(px + 46 * s)} ${r1(py + 74 * s)} Q ${r1(px)} ${r1(py + 104 * s)} ${r1(px - 46 * s)} ${r1(py + 74 * s)} Z`, fill);
  const g =
    raw(`M ${r1(x - 46 * s)} ${r1(y)} L ${r1(x + 46 * s)} ${r1(y)} L ${r1(x + 26 * s)} ${r1(y - 16 * s)} L ${r1(x - 26 * s)} ${r1(y - 16 * s)} Z`, fill) +
    rect(x - 6 * s, top, 12 * s, 190 * s, fill, { rx: 4 * s }) +
    circle(x, top - 4 * s, 11 * s, fill) +
    bar(x - half, top + 6 * s - dy, x + half, top + 6 * s + dy, 9 * s, fill) +
    pan(x - half, top + 6 * s - dy) +
    pan(x + half, top + 6 * s + dy);
  return wrap(g, o);
}

/** A ram's-horn trumpet, mouthpiece at (x, y), bell to the upper right. */
export function shofar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    taper([x, y], [x + 40 * s, y + 18 * s], [x + 110 * s, y + 10 * s], [x + 150 * s, y - 50 * s], 7 * s, 30 * s, fill) +
    ellipse(x + 152 * s, y - 54 * s, 18 * s, 9 * s, fill);
  return wrap(g, o);
}

/** A shepherd's crook, `y` the ground, leaning a little right. */
export function crook(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    bar(x, y, x + 14 * s, y - 210 * s, 7 * s, fill) +
    stroke(`M ${r1(x + 14 * s)} ${r1(y - 210 * s)} C ${r1(x + 18 * s)} ${r1(y - 246 * s)} ${r1(x + 60 * s)} ${r1(y - 246 * s)} ${r1(x + 58 * s)} ${r1(y - 214 * s)}`, fill, 7 * s);
  return wrap(g, o);
}

/** A sickle: curved blade and a short handle; `y` the end of the handle. */
export function sickle(x: number, y: number, s: number, fill: string, o?: Opts): string {
  // Handle upright, the blade a hook curving over to the left with its point turned down.
  const g =
    rect(x - 7 * s, y - 70 * s, 14 * s, 70 * s, fill, { rx: 6 * s }) +
    rect(x - 9 * s, y - 78 * s, 18 * s, 10 * s, fill, { rx: 3 * s }) +
    raw(
      `M ${r1(x - 6 * s)} ${r1(y - 74 * s)} C ${r1(x - 4 * s)} ${r1(y - 170 * s)} ${r1(x - 130 * s)} ${r1(y - 200 * s)} ${r1(x - 168 * s)} ${r1(y - 110 * s)}` +
        ` C ${r1(x - 124 * s)} ${r1(y - 168 * s)} ${r1(x - 24 * s)} ${r1(y - 156 * s)} ${r1(x + 6 * s)} ${r1(y - 74 * s)} Z`,
      fill,
    );
  return wrap(g, o);
}

/** An axe; `x, y` is the end of the handle, the head up and to the left. */
export function axe(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    bar(x, y, x - 80 * s, y - 110 * s, 9 * s, fill) +
    raw(
      `M ${r1(x - 70 * s)} ${r1(y - 112 * s)} L ${r1(x - 92 * s)} ${r1(y - 96 * s)} C ${r1(x - 112 * s)} ${r1(y - 112 * s)} ${r1(x - 126 * s)} ${r1(y - 132 * s)} ${r1(x - 124 * s)} ${r1(y - 150 * s)}` +
        ` C ${r1(x - 110 * s)} ${r1(y - 146 * s)} ${r1(x - 92 * s)} ${r1(y - 138 * s)} ${r1(x - 84 * s)} ${r1(y - 128 * s)} Z`,
      fill,
    );
  return wrap(g, o);
}

/** A round shield; (x, y) is its centre. */
export function shield(x: number, y: number, r: number, fill: string, boss?: string, o?: Opts): string {
  const g = circle(x, y, r, fill) + circle(x, y, r * 0.72, boss ?? fill, { opacity: boss ? 1 : 0.85 }) + circle(x, y, r * 0.2, fill);
  return wrap(g, o);
}

/** Shields, spears and bows heaped up - Ezechiel 39's weapons as firewood. */
export function weaponPile(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  out.push(bar(x - 150 * s, y - 6 * s, x + 90 * s, y - 120 * s, 6 * s, fill));
  out.push(bar(x + 150 * s, y - 4 * s, x - 70 * s, y - 130 * s, 6 * s, fill));
  out.push(bar(x - 30 * s, y, x + 40 * s, y - 150 * s, 6 * s, fill));
  out.push(tri(x + 90 * s, y - 120 * s, x + 104 * s, y - 138 * s, x + 80 * s, y - 132 * s, fill));
  out.push(tri(x - 70 * s, y - 130 * s, x - 86 * s, y - 146 * s, x - 60 * s, y - 142 * s, fill));
  out.push(stroke(`M ${r1(x - 120 * s)} ${r1(y - 20 * s)} Q ${r1(x - 60 * s)} ${r1(y - 120 * s)} ${r1(x + 20 * s)} ${r1(y - 70 * s)}`, fill, 6 * s));
  out.push(shield(x - 80 * s, y - 34 * s, 36 * s, fill));
  out.push(shield(x + 70 * s, y - 30 * s, 32 * s, fill));
  out.push(shield(x - 6 * s, y - 52 * s, 30 * s, fill));
  out.push(raw(`M ${r1(x - 170 * s)} ${r1(y)} Q ${r1(x)} ${r1(y - 40 * s)} ${r1(x + 170 * s)} ${r1(y)} Z`, fill));
  return wrap(out.join(''), o);
}

// ── animals ─────────────────────────────────────────────────────────────────

/** A great eagle in flight, wings spread, seen from below; (x, y) is the body centre. */
export function eagle(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const wingL =
    `M ${r1(x - 12 * s)} ${r1(y - 26 * s)} C ${r1(x - 80 * s)} ${r1(y - 86 * s)} ${r1(x - 170 * s)} ${r1(y - 112 * s)} ${r1(x - 244 * s)} ${r1(y - 96 * s)}` +
    ` L ${r1(x - 220 * s)} ${r1(y - 76 * s)} L ${r1(x - 240 * s)} ${r1(y - 62 * s)} L ${r1(x - 210 * s)} ${r1(y - 50 * s)} L ${r1(x - 228 * s)} ${r1(y - 32 * s)}` +
    ` L ${r1(x - 194 * s)} ${r1(y - 26 * s)} L ${r1(x - 204 * s)} ${r1(y - 6 * s)} L ${r1(x - 162 * s)} ${r1(y - 8 * s)} C ${r1(x - 110 * s)} ${r1(y + 2 * s)} ${r1(x - 50 * s)} ${r1(y + 14 * s)} ${r1(x - 12 * s)} ${r1(y + 20 * s)} Z`;
  const g =
    raw(wingL, fill) +
    mirror(x, raw(wingL, fill)) +
    ellipse(x, y, 22 * s, 46 * s, fill) +
    raw(`M ${r1(x - 16 * s)} ${r1(y + 34 * s)} L ${r1(x - 34 * s)} ${r1(y + 92 * s)} L ${r1(x)} ${r1(y + 84 * s)} L ${r1(x + 34 * s)} ${r1(y + 92 * s)} L ${r1(x + 16 * s)} ${r1(y + 34 * s)} Z`, fill) +
    circle(x, y - 54 * s, 16 * s, fill) +
    tri(x - 6 * s, y - 46 * s, x + 6 * s, y - 46 * s, x, y - 30 * s, fill);
  return wrap(g, o);
}

/** The great dragon in the Nile: a crocodile facing left, lying in the water; `y` the waterline. */
export function crocodile(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const out = [
    raw(
      `M ${r1(x - 180 * s)} ${r1(y - 10 * s)} L ${r1(x - 116 * s)} ${r1(y - 24 * s)} Q ${r1(x - 104 * s)} ${r1(y - 44 * s)} ${r1(x - 88 * s)} ${r1(y - 32 * s)}` +
        ` L ${r1(x - 64 * s)} ${r1(y - 34 * s)} C ${r1(x - 20 * s)} ${r1(y - 52 * s)} ${r1(x + 70 * s)} ${r1(y - 52 * s)} ${r1(x + 120 * s)} ${r1(y - 32 * s)}` +
        ` C ${r1(x + 160 * s)} ${r1(y - 20 * s)} ${r1(x + 200 * s)} ${r1(y - 14 * s)} ${r1(x + 236 * s)} ${r1(y - 4 * s)}` +
        ` C ${r1(x + 190 * s)} ${r1(y + 2 * s)} ${r1(x + 140 * s)} ${r1(y + 4 * s)} ${r1(x + 96 * s)} ${r1(y)} L ${r1(x - 180 * s)} ${r1(y)} Z`,
      fill,
    ),
  ];
  for (let i = 0; i < 9; i += 1) {
    const sx = x - 40 * s + i * 22 * s;
    const top = y - 48 * s + Math.abs(i - 3) * 2.2 * s + (i > 5 ? (i - 5) * 4 * s : 0);
    out.push(tri(sx - 7 * s, top + 6 * s, sx, top - 6 * s, sx + 7 * s, top + 6 * s, fill));
  }
  return wrap(out.join(''), o);
}

/** A camel; `lying` folds the legs under it (Rabba "een stal der kemelen"). Facing left. */
export function camel(x: number, y: number, s: number, fill: string, lying = false, o?: Opts): string {
  fill = ink(fill);
  const lift = lying ? 44 * s : 0;
  const out = [
    ellipse(x, y - 62 * s + lift, 56 * s, 24 * s, fill),
    circle(x + 4 * s, y - 84 * s + lift, 26 * s, fill),
    taper([x - 42 * s, y - 70 * s + lift], [x - 64 * s, y - 64 * s + lift], [x - 82 * s, y - 92 * s + lift], [x - 86 * s, y - 128 * s + lift], 22 * s, 12 * s, fill),
    ellipse(x - 96 * s, y - 130 * s + lift, 18 * s, 9 * s, fill),
    tri(x - 88 * s, y - 136 * s + lift, x - 82 * s, y - 150 * s + lift, x - 78 * s, y - 136 * s + lift, fill),
    stroke(`M ${r1(x + 54 * s)} ${r1(y - 66 * s + lift)} q ${r1(14 * s)} ${r1(10 * s)} ${r1(8 * s)} ${r1(32 * s)}`, fill, 4 * s),
  ];
  if (lying) {
    out.push(raw(`M ${r1(x - 60 * s)} ${r1(y)} L ${r1(x - 52 * s)} ${r1(y - 22 * s)} L ${r1(x + 56 * s)} ${r1(y - 22 * s)} L ${r1(x + 64 * s)} ${r1(y)} Z`, fill));
  } else {
    for (const dx of [-44, -24, 14, 36]) out.push(rect(x + dx * s, y - 64 * s, 9 * s, 64 * s, fill, { rx: 4 * s }));
  }
  return wrap(out.join(''), o);
}

/** A sheep from the A set, facing right (or left with `flip`). */
export function sheepAt(x: number, y: number, s: number, body: string, head: string, flip = false, o?: Opts): string {
  return wrap(at(x, y, s, aSheep(body, ink(head)), { flip }), o);
}

/** A lying lamb or sheep seen side-on, facing right: body and head only. */
export function lyingSheep(x: number, y: number, s: number, body: string, head: string, o?: Opts): string {
  head = ink(head);
  const g =
    circle(x - 16 * s, y - 20 * s, 18 * s, body) +
    circle(x + 12 * s, y - 22 * s, 18 * s, body) +
    circle(x - 2 * s, y - 32 * s, 16 * s, body) +
    ellipse(x, y - 8 * s, 40 * s, 10 * s, body) +
    raw(`M ${r1(x + 28 * s)} ${r1(y - 40 * s)} C ${r1(x + 46 * s)} ${r1(y - 44 * s)} ${r1(x + 52 * s)} ${r1(y - 28 * s)} ${r1(x + 48 * s)} ${r1(y - 18 * s)} C ${r1(x + 44 * s)} ${r1(y - 10 * s)} ${r1(x + 32 * s)} ${r1(y - 14 * s)} ${r1(x + 28 * s)} ${r1(y - 24 * s)} Z`, head);
  return wrap(g, o);
}

/** A calf leaping, facing right (Maleachi 4:2 "huppelen als mestkalveren"). */
export function calf(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const g =
    ellipse(x, y - 56 * s, 40 * s, 19 * s, fill) +
    bar(x + 26 * s, y - 60 * s, x + 64 * s, y - 34 * s, 10 * s, fill) +
    bar(x + 18 * s, y - 56 * s, x + 46 * s, y - 24 * s, 10 * s, fill) +
    bar(x - 26 * s, y - 50 * s, x - 56 * s, y - 20 * s, 10 * s, fill) +
    bar(x - 18 * s, y - 50 * s, x - 34 * s, y - 14 * s, 10 * s, fill) +
    bar(x + 30 * s, y - 66 * s, x + 50 * s, y - 92 * s, 14 * s, fill) +
    ellipse(x + 62 * s, y - 96 * s, 17 * s, 11 * s, fill) +
    ellipse(x + 46 * s, y - 108 * s, 9 * s, 4 * s, fill) +
    stroke(`M ${r1(x - 38 * s)} ${r1(y - 62 * s)} q ${r1(-16 * s)} ${r1(-4 * s)} ${r1(-20 * s)} ${r1(-22 * s)}`, fill, 4 * s);
  return wrap(g, o);
}

/** A bone, centred at (x, y), rotated by `rot` degrees. */
export function bone(x: number, y: number, len: number, rot: number, fill: string, o?: Opts): string {
  const w = len * 0.14;
  const g =
    rect(x - len / 2, y - w / 2, len, w, fill, { rx: w / 2 }) +
    circle(x - len / 2, y - w * 0.55, w * 0.62, fill) +
    circle(x - len / 2, y + w * 0.55, w * 0.62, fill) +
    circle(x + len / 2, y - w * 0.55, w * 0.62, fill) +
    circle(x + len / 2, y + w * 0.55, w * 0.62, fill);
  return wrap(rotate(rot, x, y, g), o);
}

// ── plants ──────────────────────────────────────────────────────────────────

/** A cedar of Lebanon: a tall trunk and flat, layered tiers of branches. */
export function cedar(x: number, y: number, s: number, fill: string, o?: Opts & { tiers?: number }): string {
  fill = ink(fill);
  const all: [number, number, number][] = [
    [-96, 150, 0],
    [-158, 132, 18],
    [-214, 112, -14],
    [-262, 86, 12],
    [-302, 60, -6],
    [-334, 34, 0],
  ];
  // Fewer tiers: the top broken off (Ezechiel 17).
  const tiers = all.slice(0, o?.tiers ?? all.length);
  const topY = tiers[tiers.length - 1][0] + 4;
  const out = [raw(`M ${r1(x - 16 * s)} ${r1(y)} L ${r1(x - 9 * s)} ${r1(y + topY * s)} L ${r1(x + 9 * s)} ${r1(y + topY * s)} L ${r1(x + 16 * s)} ${r1(y)} Z`, fill)];
  for (const [dy, hw, shift] of tiers) {
    const cx = x + shift * s;
    const ty = y + dy * s;
    out.push(
      raw(
        `M ${r1(cx - hw * s)} ${r1(ty + 8 * s)} C ${r1(cx - hw * 0.8 * s)} ${r1(ty - 22 * s)} ${r1(cx - hw * 0.3 * s)} ${r1(ty - 30 * s)} ${r1(cx)} ${r1(ty - 30 * s)}` +
          ` C ${r1(cx + hw * 0.3 * s)} ${r1(ty - 30 * s)} ${r1(cx + hw * 0.8 * s)} ${r1(ty - 22 * s)} ${r1(cx + hw * s)} ${r1(ty + 8 * s)}` +
          ` C ${r1(cx + hw * 0.5 * s)} ${r1(ty + 18 * s)} ${r1(cx - hw * 0.5 * s)} ${r1(ty + 18 * s)} ${r1(cx - hw * s)} ${r1(ty + 8 * s)} Z`,
        fill,
      ),
    );
  }
  return wrap(out.join(''), o);
}

/** A vine stem and leaves, winding up from `y`; a few leaves, no fruit. */
export function vineStem(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  // A vine leaf: broad, with three pointed lobes.
  const leaf = (lx: number, ly: number, r: number, rot: number) =>
    rotate(
      rot,
      lx,
      ly,
      raw(
        `M ${r1(lx)} ${r1(ly)} C ${r1(lx - 14 * r)} ${r1(ly - 2 * r)} ${r1(lx - 26 * r)} ${r1(ly - 8 * r)} ${r1(lx - 30 * r)} ${r1(ly - 22 * r)} L ${r1(lx - 18 * r)} ${r1(ly - 24 * r)}` +
          ` C ${r1(lx - 22 * r)} ${r1(ly - 36 * r)} ${r1(lx - 12 * r)} ${r1(ly - 44 * r)} ${r1(lx)} ${r1(ly - 52 * r)} C ${r1(lx + 12 * r)} ${r1(ly - 44 * r)} ${r1(lx + 22 * r)} ${r1(ly - 36 * r)} ${r1(lx + 18 * r)} ${r1(ly - 24 * r)}` +
          ` L ${r1(lx + 30 * r)} ${r1(ly - 22 * r)} C ${r1(lx + 26 * r)} ${r1(ly - 8 * r)} ${r1(lx + 14 * r)} ${r1(ly - 2 * r)} ${r1(lx)} ${r1(ly)} Z`,
        fill,
      ),
    );
  const g =
    taper([x, y], [x - 20 * s, y - 60 * s], [x + 40 * s, y - 100 * s], [x + 10 * s, y - 170 * s], 16 * s, 6 * s, fill) +
    taper([x + 6 * s, y - 92 * s], [x + 40 * s, y - 110 * s], [x + 80 * s, y - 100 * s], [x + 110 * s, y - 120 * s], 8 * s, 3 * s, fill) +
    taper([x + 2 * s, y - 60 * s], [x - 30 * s, y - 80 * s], [x - 70 * s, y - 70 * s], [x - 100 * s, y - 96 * s], 8 * s, 3 * s, fill) +
    stroke(`M ${r1(x + 60 * s)} ${r1(y - 104 * s)} q ${r1(10 * s)} ${r1(-14 * s)} ${r1(22 * s)} ${r1(-8 * s)}`, fill, 2.5 * s) +
    leaf(x + 108 * s, y - 118 * s, s * 1.1, 40) +
    leaf(x - 98 * s, y - 94 * s, s * 1.1, -40) +
    leaf(x + 10 * s, y - 168 * s, s * 1.05, 6) +
    leaf(x + 50 * s, y - 104 * s, s * 0.85, 120) +
    leaf(x - 44 * s, y - 76 * s, s * 0.85, -120) +
    leaf(x + 24 * s, y - 130 * s, s * 0.8, 70) +
    leaf(x - 10 * s, y - 120 * s, s * 0.8, -70);
  return wrap(g, o);
}

// ── buildings and things ────────────────────────────────────────────────────

/** An altar of stone with a horn at each corner; `y` the ground. */
export function altar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const top = y - 92 * s;
  // A horn: a short upright that curls outward at the tip.
  const horn = (hx: number, dir: number, k: number) =>
    raw(
      `M ${r1(hx - dir * 2 * s)} ${r1(top)} L ${r1(hx - dir * 2 * s)} ${r1(top - 18 * k * s)} Q ${r1(hx + dir * 2 * s)} ${r1(top - 30 * k * s)} ${r1(hx + dir * 16 * k * s)} ${r1(top - 26 * k * s)}` +
        ` Q ${r1(hx + dir * 12 * k * s)} ${r1(top - 14 * k * s)} ${r1(hx + dir * 16 * s)} ${r1(top)} Z`,
      fill,
    );
  const g =
    rect(x - 82 * s, y - 14 * s, 164 * s, 14 * s, fill) +
    rect(x - 70 * s, y - 84 * s, 140 * s, 72 * s, fill) +
    rect(x - 78 * s, top, 156 * s, 12 * s, fill) +
    horn(x - 76 * s, -1, 1) +
    horn(x + 76 * s, 1, 1) +
    `<g opacity="0.8">${horn(x - 40 * s, -1, 0.7)}${horn(x + 40 * s, 1, 0.7)}</g>` +
    rect(x - 70 * s, y - 52 * s, 140 * s, 5 * s, '#FFFFFF', { opacity: 0.18 });
  return wrap(g, o);
}

/** A domed smelting furnace with an arched mouth full of fire; `y` the ground. */
export function furnace(x: number, y: number, s: number, fill: string, glow: string, o?: Opts): string {
  const g =
    raw(
      `M ${r1(x - 120 * s)} ${r1(y)} C ${r1(x - 126 * s)} ${r1(y - 120 * s)} ${r1(x - 70 * s)} ${r1(y - 190 * s)} ${r1(x - 24 * s)} ${r1(y - 196 * s)}` +
        ` L ${r1(x - 24 * s)} ${r1(y - 250 * s)} L ${r1(x + 24 * s)} ${r1(y - 250 * s)} L ${r1(x + 24 * s)} ${r1(y - 196 * s)}` +
        ` C ${r1(x + 70 * s)} ${r1(y - 190 * s)} ${r1(x + 126 * s)} ${r1(y - 120 * s)} ${r1(x + 120 * s)} ${r1(y)} Z`,
      fill,
    ) +
    raw(`M ${r1(x - 50 * s)} ${r1(y)} L ${r1(x - 50 * s)} ${r1(y - 60 * s)} A ${r1(50 * s)} ${r1(50 * s)} 0 0 1 ${r1(x + 50 * s)} ${r1(y - 60 * s)} L ${r1(x + 50 * s)} ${r1(y)} Z`, glow);
  return wrap(g, o);
}

/** A three-legged cooking pot, the rim at about y - 150s. */
export function cauldron(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    bar(x - 60 * s, y - 50 * s, x - 76 * s, y, 9 * s, fill) +
    bar(x + 60 * s, y - 50 * s, x + 76 * s, y, 9 * s, fill) +
    bar(x, y - 50 * s, x, y - 2 * s, 9 * s, fill) +
    raw(
      `M ${r1(x - 96 * s)} ${r1(y - 140 * s)} L ${r1(x + 96 * s)} ${r1(y - 140 * s)} C ${r1(x + 104 * s)} ${r1(y - 70 * s)} ${r1(x + 60 * s)} ${r1(y - 40 * s)} ${r1(x)} ${r1(y - 40 * s)}` +
        ` C ${r1(x - 60 * s)} ${r1(y - 40 * s)} ${r1(x - 104 * s)} ${r1(y - 70 * s)} ${r1(x - 96 * s)} ${r1(y - 140 * s)} Z`,
      fill,
    ) +
    rect(x - 108 * s, y - 156 * s, 216 * s, 18 * s, fill, { rx: 9 * s }) +
    `<circle cx="${r1(x - 112 * s)}" cy="${r1(y - 124 * s)}" r="${r1(16 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(7 * s)}"/>` +
    `<circle cx="${r1(x + 112 * s)}" cy="${r1(y - 124 * s)}" r="${r1(16 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(7 * s)}"/>`;
  return wrap(g, o);
}

/**
 * The lampstand: a central shaft with three arms each side and seven lamps.
 * `bowl` adds Zacharia's bowl on top with its pipes to the lamps. Lamps get
 * small flames in `flameFill`.
 */
export function lampstand(x: number, y: number, s: number, fill: string, flameFill: string, bowl = false, o?: Opts): string {
  const top = y - 250 * s;
  const w = 9 * s;
  const out = [
    raw(`M ${r1(x - 54 * s)} ${r1(y)} L ${r1(x + 54 * s)} ${r1(y)} L ${r1(x + 18 * s)} ${r1(y - 26 * s)} L ${r1(x - 18 * s)} ${r1(y - 26 * s)} Z`, fill),
    rect(x - w * 0.7, top, w * 1.4, 250 * s - 20 * s, fill),
  ];
  const tips: number[] = [0];
  for (let i = 1; i <= 3; i += 1) {
    const R = 40 * i * s;
    out.push(stroke(`M ${r1(x - R)} ${r1(top)} A ${r1(R)} ${r1(R * 1.05)} 0 0 0 ${r1(x + R)} ${r1(top)}`, fill, w));
    tips.push(-R, R);
  }
  for (const dx of tips) {
    out.push(raw(`M ${r1(x + dx - 15 * s)} ${r1(top - 2 * s)} L ${r1(x + dx + 15 * s)} ${r1(top - 2 * s)} L ${r1(x + dx + 8 * s)} ${r1(top + 12 * s)} L ${r1(x + dx - 8 * s)} ${r1(top + 12 * s)} Z`, fill));
    out.push(raw(`M ${r1(x + dx)} ${r1(top - 40 * s)} C ${r1(x + dx + 13 * s)} ${r1(top - 24 * s)} ${r1(x + dx + 9 * s)} ${r1(top - 4 * s)} ${r1(x + dx)} ${r1(top - 4 * s)} C ${r1(x + dx - 9 * s)} ${r1(top - 4 * s)} ${r1(x + dx - 13 * s)} ${r1(top - 24 * s)} ${r1(x + dx)} ${r1(top - 40 * s)} Z`, flameFill));
  }
  if (bowl) {
    const by = top - 96 * s;
    for (const dx of tips) out.push(bar(x, by + 10 * s, x + dx, top - 44 * s, 2.6 * s, fill, 0.8));
    out.push(raw(`M ${r1(x - 40 * s)} ${r1(by - 8 * s)} L ${r1(x + 40 * s)} ${r1(by - 8 * s)} Q ${r1(x + 36 * s)} ${r1(by + 22 * s)} ${r1(x)} ${r1(by + 22 * s)} Q ${r1(x - 36 * s)} ${r1(by + 22 * s)} ${r1(x - 40 * s)} ${r1(by - 8 * s)} Z`, fill));
  }
  return wrap(out.join(''), o);
}

/** A hand lantern: ring, cap, glowing glass and base; `y` its base. */
export function lantern(x: number, y: number, s: number, frame: string, glow: string, o?: Opts): string {
  const g =
    `<circle cx="${r1(x)}" cy="${r1(y - 98 * s)}" r="${r1(9 * s)}" fill="none" stroke="${frame}" stroke-width="${r1(4 * s)}"/>` +
    raw(`M ${r1(x - 22 * s)} ${r1(y - 76 * s)} L ${r1(x)} ${r1(y - 90 * s)} L ${r1(x + 22 * s)} ${r1(y - 76 * s)} Z`, frame) +
    raw(`M ${r1(x - 18 * s)} ${r1(y - 74 * s)} L ${r1(x + 18 * s)} ${r1(y - 74 * s)} L ${r1(x + 22 * s)} ${r1(y - 12 * s)} L ${r1(x - 22 * s)} ${r1(y - 12 * s)} Z`, glow) +
    rect(x - 2 * s, y - 74 * s, 4 * s, 62 * s, frame) +
    rect(x - 26 * s, y - 14 * s, 52 * s, 14 * s, frame, { rx: 3 * s });
  return wrap(g, o);
}

/** A lyre: two curved arms, a yoke and strings; `y` the sound box bottom. */
export function lyre(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    raw(`M ${r1(x - 46 * s)} ${r1(y - 40 * s)} L ${r1(x + 46 * s)} ${r1(y - 40 * s)} Q ${r1(x + 44 * s)} ${r1(y)} ${r1(x)} ${r1(y)} Q ${r1(x - 44 * s)} ${r1(y)} ${r1(x - 46 * s)} ${r1(y - 40 * s)} Z`, fill) +
    taper([x - 36 * s, y - 34 * s], [x - 70 * s, y - 90 * s], [x - 20 * s, y - 120 * s], [x - 50 * s, y - 170 * s], 14 * s, 8 * s, fill) +
    taper([x + 36 * s, y - 34 * s], [x + 70 * s, y - 90 * s], [x + 20 * s, y - 120 * s], [x + 50 * s, y - 170 * s], 14 * s, 8 * s, fill) +
    bar(x - 60 * s, y - 160 * s, x + 60 * s, y - 160 * s, 9 * s, fill) +
    [-24, -12, 0, 12, 24].map((dx) => bar(x + dx * s, y - 36 * s, x + dx * 1.2 * s, y - 158 * s, 2.4 * s, fill, 0.85)).join('');
  return wrap(g, o);
}

/** "De Zon der gerechtigheid ... genezing onder Zijn vleugelen": a sun disc with two wide wings. (x, y) is the sun's centre. */
export function wingedSun(x: number, y: number, r: number, sunFill: string, wingFill: string, o?: Opts): string {
  const k = r / 60;
  const g =
    at(x - r * 0.7, y + r * 0.1, k, broadWing(wingFill, 210, 1.5), { rot: -78 }) +
    at(x + r * 0.7, y + r * 0.1, k, broadWing(wingFill, 210, 1.5), { rot: 78, flip: true }) +
    circle(x, y, r, sunFill);
  return wrap(g, o);
}

/** A swaddled newborn lying on the ground, facing right. */
export function infant(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    raw(
      `M ${r1(x - 44 * s)} ${r1(y - 8 * s)} C ${r1(x - 48 * s)} ${r1(y - 20 * s)} ${r1(x - 30 * s)} ${r1(y - 26 * s)} ${r1(x - 6 * s)} ${r1(y - 28 * s)}` +
        ` C ${r1(x + 14 * s)} ${r1(y - 30 * s)} ${r1(x + 26 * s)} ${r1(y - 28 * s)} ${r1(x + 26 * s)} ${r1(y - 14 * s)} L ${r1(x + 26 * s)} ${r1(y)} L ${r1(x - 30 * s)} ${r1(y)}` +
        ` C ${r1(x - 40 * s)} ${r1(y)} ${r1(x - 44 * s)} ${r1(y - 3 * s)} ${r1(x - 44 * s)} ${r1(y - 8 * s)} Z`,
      fill,
    ) +
    circle(x + 36 * s, y - 16 * s, 16 * s, fill) +
    raw(`M ${r1(x + 20 * s)} ${r1(y - 10 * s)} C ${r1(x + 16 * s)} ${r1(y - 36 * s)} ${r1(x + 44 * s)} ${r1(y - 40 * s)} ${r1(x + 52 * s)} ${r1(y - 24 * s)} L ${r1(x + 42 * s)} ${r1(y - 22 * s)} C ${r1(x + 36 * s)} ${r1(y - 30 * s)} ${r1(x + 26 * s)} ${r1(y - 26 * s)} ${r1(x + 26 * s)} ${r1(y - 12 * s)} Z`, fill) +
    bar(x - 26 * s, y - 22 * s, x - 22 * s, y - 3 * s, 2.6 * s, '#FFFFFF', 0.45) +
    bar(x - 8 * s, y - 25 * s, x - 4 * s, y - 3 * s, 2.6 * s, '#FFFFFF', 0.45) +
    bar(x + 10 * s, y - 26 * s, x + 12 * s, y - 3 * s, 2.6 * s, '#FFFFFF', 0.45);
  return wrap(g, o);
}

/** A gate tower whose arch is shut with two doors in `door`; `y` the ground. */
export function closedGate(x: number, y: number, s: number, wall: string, door: string, o?: Opts): string {
  const g =
    rect(x - 110 * s, y - 230 * s, 220 * s, 230 * s, wall) +
    [-110, -74, -38, -2, 34, 70].map((dx) => rect(x + dx * s, y - 252 * s, 22 * s, 24 * s, wall)).join('') +
    raw(`M ${r1(x - 56 * s)} ${r1(y)} L ${r1(x - 56 * s)} ${r1(y - 110 * s)} A ${r1(56 * s)} ${r1(56 * s)} 0 0 1 ${r1(x + 56 * s)} ${r1(y - 110 * s)} L ${r1(x + 56 * s)} ${r1(y)} Z`, door) +
    rect(x - 2 * s, y - 166 * s, 4 * s, 166 * s, wall, { opacity: 0.55 }) +
    [-40, -20, 20, 40].map((dx) => rect(x + dx * s - 1.5 * s, y - 150 * s + Math.abs(dx) * 0.6 * s, 3 * s, 140 * s, wall, { opacity: 0.3 })).join('') +
    rect(x - 50 * s, y - 70 * s, 100 * s, 6 * s, wall, { opacity: 0.45 });
  return wrap(g, o);
}

/** A rock-cut facade (Edom, Seir): columns, a broken pediment and a dark door. */
export function rockFacade(x: number, y: number, s: number, fill: string, door: string, o?: Opts): string {
  const out = [
    rect(x - 90 * s, y - 14 * s, 180 * s, 14 * s, fill),
    rect(x - 80 * s, y - 160 * s, 160 * s, 12 * s, fill),
    raw(`M ${r1(x - 84 * s)} ${r1(y - 172 * s)} L ${r1(x - 40 * s)} ${r1(y - 200 * s)} L ${r1(x - 40 * s)} ${r1(y - 172 * s)} Z`, fill),
    raw(`M ${r1(x + 84 * s)} ${r1(y - 172 * s)} L ${r1(x + 40 * s)} ${r1(y - 200 * s)} L ${r1(x + 40 * s)} ${r1(y - 172 * s)} Z`, fill),
    rect(x - 22 * s, y - 232 * s, 44 * s, 60 * s, fill),
    raw(`M ${r1(x - 30 * s)} ${r1(y - 232 * s)} L ${r1(x)} ${r1(y - 252 * s)} L ${r1(x + 30 * s)} ${r1(y - 232 * s)} Z`, fill),
    raw(`M ${r1(x - 22 * s)} ${r1(y - 14 * s)} L ${r1(x - 22 * s)} ${r1(y - 96 * s)} L ${r1(x + 22 * s)} ${r1(y - 96 * s)} L ${r1(x + 22 * s)} ${r1(y - 14 * s)} Z`, door),
  ];
  for (const dx of [-68, -44, 44, 68]) out.push(rect(x + dx * s - 6 * s, y - 148 * s, 12 * s, 134 * s, fill));
  return wrap(out.join(''), o);
}

/** A clay tile with a city scratched into it (Ezechiel 4), seen at a slant; `y` its bottom edge. */
export function cityTile(x: number, y: number, s: number, fill: string, etch: string, o?: Opts): string {
  const g =
    raw(`M ${r1(x - 110 * s)} ${r1(y)} L ${r1(x + 110 * s)} ${r1(y)} L ${r1(x + 92 * s)} ${r1(y - 120 * s)} L ${r1(x - 92 * s)} ${r1(y - 120 * s)} Z`, fill) +
    raw(`M ${r1(x - 110 * s)} ${r1(y)} L ${r1(x + 110 * s)} ${r1(y)} L ${r1(x + 110 * s)} ${r1(y + 14 * s)} L ${r1(x - 110 * s)} ${r1(y + 14 * s)} Z`, fill, 0.8) +
    stroke(
      `M ${r1(x - 70 * s)} ${r1(y - 22 * s)} L ${r1(x - 70 * s)} ${r1(y - 62 * s)} L ${r1(x - 50 * s)} ${r1(y - 62 * s)} L ${r1(x - 50 * s)} ${r1(y - 50 * s)}` +
        ` L ${r1(x - 20 * s)} ${r1(y - 50 * s)} L ${r1(x - 20 * s)} ${r1(y - 84 * s)} L ${r1(x + 4 * s)} ${r1(y - 98 * s)} L ${r1(x + 28 * s)} ${r1(y - 84 * s)} L ${r1(x + 28 * s)} ${r1(y - 50 * s)}` +
        ` L ${r1(x + 50 * s)} ${r1(y - 50 * s)} L ${r1(x + 50 * s)} ${r1(y - 66 * s)} L ${r1(x + 70 * s)} ${r1(y - 66 * s)} L ${r1(x + 70 * s)} ${r1(y - 22 * s)} Z`,
      etch,
      4 * s,
    );
  return wrap(g, o);
}

/** A fishing net hung between two poles, sagging, with floats along the top line. */
export function hungNet(x: number, y: number, w: number, h: number, pole: string, mesh: string, o?: Opts): string {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const top = y - h;
  const out = [rect(x0 - 5, top - 30, 10, h + 30, pole), rect(x1 - 5, top - 30, 10, h + 30, pole)];
  const sag = (t: number) => top + Math.sin(Math.PI * t) * 30;
  const rows = 6;
  for (let r = 0; r <= rows; r += 1) {
    const k = r / rows;
    const yy0 = top + k * h * 0.86;
    out.push(stroke(`M ${r1(x0)} ${r1(yy0)} Q ${r1(x)} ${r1(yy0 + 60 - k * 20)} ${r1(x1)} ${r1(yy0)}`, mesh, 3, 0.85));
  }
  const cols = 12;
  for (let i = 0; i <= cols; i += 1) {
    const t = i / cols;
    const xx = x0 + t * w;
    out.push(stroke(`M ${r1(xx)} ${r1(sag(t))} L ${r1(xx + (t - 0.5) * 30)} ${r1(top + h * 0.86 + Math.sin(Math.PI * t) * 40)}`, mesh, 3, 0.85));
  }
  for (let i = 1; i < 8; i += 1) {
    const t = i / 8;
    out.push(circle(x0 + t * w, sag(t), 7, mesh));
  }
  return wrap(out.join(''), o);
}

/** A heart: Ezechiel 11 and 36. (x, y) is the bottom tip; `s = 1` is ~128 wide. */
export function heartAt(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(at(x, y - 34 * s, s, aHeart(fill)), o);
}

/** The heart of stone: a grey heart split by a crack. (x, y) is the bottom tip. */
export function stoneHeart(x: number, y: number, s: number, fill: string, crack: string, o?: Opts): string {
  const g =
    at(x, y - 34 * s, s, aHeart(fill)) +
    stroke(`M ${r1(x - 4 * s)} ${r1(y - 88 * s)} L ${r1(x + 8 * s)} ${r1(y - 62 * s)} L ${r1(x - 8 * s)} ${r1(y - 40 * s)} L ${r1(x + 6 * s)} ${r1(y - 18 * s)}`, crack, 5 * s);
  return wrap(g, o);
}

/** A cloth bundle tied at the top - an exile's baggage. (x, y) is its bottom. */
export function bundle(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    raw(`M ${r1(x - 40 * s)} ${r1(y)} C ${r1(x - 54 * s)} ${r1(y - 40 * s)} ${r1(x - 24 * s)} ${r1(y - 60 * s)} ${r1(x - 6 * s)} ${r1(y - 62 * s)} L ${r1(x + 6 * s)} ${r1(y - 62 * s)} C ${r1(x + 24 * s)} ${r1(y - 60 * s)} ${r1(x + 54 * s)} ${r1(y - 40 * s)} ${r1(x + 40 * s)} ${r1(y)} Z`, fill) +
    tri(x - 4 * s, y - 60 * s, x - 22 * s, y - 80 * s, x - 2 * s, y - 72 * s, fill) +
    tri(x + 4 * s, y - 60 * s, x + 22 * s, y - 82 * s, x + 2 * s, y - 72 * s, fill);
  return wrap(g, o);
}

/**
 * An open scroll held upright: the sheet between two rollers with knobs, a
 * few lines of writing. (x, y) is the bottom centre; ~250s wide, ~190s tall.
 */
export function openScroll(x: number, y: number, s: number, paper: string, roll: string, text?: string, o?: Opts): string {
  const out = [raw(`M ${r1(x - 100 * s)} ${r1(y - 160 * s)} L ${r1(x + 100 * s)} ${r1(y - 160 * s)} L ${r1(x + 100 * s)} ${r1(y - 20 * s)} L ${r1(x - 100 * s)} ${r1(y - 20 * s)} Z`, paper)];
  for (const dx of [-112, 112]) {
    out.push(rect(x + dx * s - 14 * s, y - 172 * s, 28 * s, 164 * s, roll, { rx: 12 * s }));
    out.push(rect(x + dx * s - 4 * s, y - 192 * s, 8 * s, 22 * s, roll, { rx: 3 * s }));
    out.push(rect(x + dx * s - 4 * s, y - 10 * s, 8 * s, 18 * s, roll, { rx: 3 * s }));
    out.push(circle(x + dx * s, y - 194 * s, 7 * s, roll));
    out.push(circle(x + dx * s, y + 10 * s, 7 * s, roll));
  }
  if (text) {
    for (let i = 0; i < 5; i += 1) {
      const ly = y - 138 * s + i * 24 * s;
      out.push(bar(x - 76 * s, ly, x + (i % 2 ? 44 : 70) * s, ly, 5 * s, text, 0.55));
    }
  }
  return wrap(out.join(''), o);
}

/** A palm frond held up: a curved rib with leaflets; (x, y) is the end of the stem, `rot` tilts it. */
export function frond(x: number, y: number, s: number, fill: string, rot = 0, o?: Opts): string {
  const out = [taper([x, y], [x + 4 * s, y - 50 * s], [x + 16 * s, y - 100 * s], [x + 40 * s, y - 140 * s], 6 * s, 2 * s, fill)];
  for (let i = 0; i < 9; i += 1) {
    const t = 0.3 + i * 0.075;
    const px = x + 40 * s * t * t;
    const py = y - 140 * s * t;
    const len = (34 - i * 2) * s;
    out.push(bar(px, py, px - len, py + len * 0.35, 4 * s, fill));
    out.push(bar(px, py, px + len, py - len * 0.1, 4 * s, fill));
  }
  return wrap(rotate(rot, x, y, out.join('')), o);
}

/** A bare, stripped tree - Joel's fig tree "zijn takken zijn wit geworden". */
export function bareTree(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const g =
    taper([x, y], [x - 4 * s, y - 50 * s], [x + 6 * s, y - 90 * s], [x, y - 130 * s], 22 * s, 10 * s, fill) +
    taper([x - 2 * s, y - 80 * s], [x - 30 * s, y - 100 * s], [x - 60 * s, y - 130 * s], [x - 70 * s, y - 170 * s], 10 * s, 3 * s, fill) +
    taper([x + 2 * s, y - 96 * s], [x + 30 * s, y - 116 * s], [x + 66 * s, y - 136 * s], [x + 84 * s, y - 166 * s], 10 * s, 3 * s, fill) +
    taper([x, y - 126 * s], [x - 6 * s, y - 150 * s], [x + 8 * s, y - 180 * s], [x + 2 * s, y - 206 * s], 8 * s, 2.5 * s, fill) +
    taper([x - 40 * s, y - 120 * s], [x - 60 * s, y - 120 * s], [x - 90 * s, y - 110 * s], [x - 106 * s, y - 120 * s], 5 * s, 2 * s, fill) +
    taper([x + 44 * s, y - 124 * s], [x + 64 * s, y - 120 * s], [x + 90 * s, y - 112 * s], [x + 108 * s, y - 124 * s], 5 * s, 2 * s, fill);
  return wrap(g, o);
}

/** A jagged lightning bolt hanging from (x, y). */
export function bolt(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = raw(
    `M ${r1(x)} ${r1(y)} L ${r1(x - 30 * s)} ${r1(y + 86 * s)} L ${r1(x - 6 * s)} ${r1(y + 80 * s)} L ${r1(x - 36 * s)} ${r1(y + 180 * s)}` +
      ` L ${r1(x + 26 * s)} ${r1(y + 66 * s)} L ${r1(x + 2 * s)} ${r1(y + 72 * s)} L ${r1(x + 24 * s)} ${r1(y)} Z`,
    fill,
  );
  return wrap(g, o);
}

/** An eagle's nest of sticks on a ledge; (x, y) its bottom. */
export function nest(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const out = [raw(`M ${r1(x - 56 * s)} ${r1(y - 24 * s)} Q ${r1(x)} ${r1(y + 10 * s)} ${r1(x + 56 * s)} ${r1(y - 24 * s)} L ${r1(x + 44 * s)} ${r1(y)} L ${r1(x - 44 * s)} ${r1(y)} Z`, fill)];
  for (let i = 0; i < 6; i += 1) {
    const dx = (i - 2.5) * 18 * s;
    out.push(bar(x + dx - 20 * s, y - 20 * s - (i % 2) * 6 * s, x + dx + 26 * s, y - 8 * s + (i % 3) * 3 * s, 4 * s, fill));
  }
  return wrap(out.join(''), o);
}

/** A horse drawing a chariot, both facing left; `y` the ground. */
export function chariotTeam(x: number, y: number, s: number, fill: string, o?: Opts): string {
  fill = ink(fill);
  const k = s;
  const wheelX = x + 40 * k;
  const g =
    // horse in front, its body ending where the pole begins
    horseShape(x - 130 * k, y, 1.05 * k, fill) +
    bar(x - 90 * k, y - 66 * k, x + 10 * k, y - 50 * k, 6 * k, fill) +
    raw(`M ${r1(x)} ${r1(y - 40 * k)} L ${r1(x)} ${r1(y - 96 * k)} L ${r1(x + 70 * k)} ${r1(y - 96 * k)} L ${r1(x + 74 * k)} ${r1(y - 40 * k)} Z`, fill) +
    `<circle cx="${r1(wheelX)}" cy="${r1(y - 36 * k)}" r="${r1(34 * k)}" fill="none" stroke="${fill}" stroke-width="${r1(7 * k)}"/>` +
    circle(wheelX, y - 36 * k, 8 * k, fill) +
    [0, 1, 2, 3, 4, 5].map((i) => bar(wheelX, y - 36 * k, wheelX + Math.cos((Math.PI * i) / 3) * 32 * k, y - 36 * k + Math.sin((Math.PI * i) / 3) * 32 * k, 3.4 * k, fill)).join('');
  return wrap(g, o);
}

/** The primitives' horse, inlined so the chariot can share its colour without the ink map twice. */
function horseShape(x: number, y: number, scale: number, fill: string): string {
  const s = scale * 1.3;
  return (
    ellipse(x, y - 46 * s, 44 * s, 22 * s, fill) +
    bar(x - 30 * s, y - 44 * s, x - 38 * s, y, 7 * s, fill) +
    bar(x - 12 * s, y - 44 * s, x - 2 * s, y, 7 * s, fill) +
    bar(x + 22 * s, y - 44 * s, x + 14 * s, y, 7 * s, fill) +
    bar(x + 36 * s, y - 44 * s, x + 46 * s, y, 7 * s, fill) +
    taper([x - 30 * s, y - 52 * s], [x - 44 * s, y - 70 * s], [x - 54 * s, y - 80 * s], [x - 62 * s, y - 90 * s], 22 * s, 14 * s, fill) +
    raw(`M ${r1(x - 60 * s)} ${r1(y - 98 * s)} L ${r1(x - 80 * s)} ${r1(y - 84 * s)} L ${r1(x - 68 * s)} ${r1(y - 74 * s)} L ${r1(x - 52 * s)} ${r1(y - 82 * s)} Z`, fill) +
    tri(x - 58 * s, y - 96 * s, x - 54 * s, y - 108 * s, x - 50 * s, y - 94 * s, fill) +
    stroke(`M ${r1(x + 42 * s)} ${r1(y - 58 * s)} C ${r1(x + 64 * s)} ${r1(y - 52 * s)} ${r1(x + 62 * s)} ${r1(y - 24 * s)} ${r1(x + 54 * s)} ${r1(y - 12 * s)}`, fill, 7 * s)
  );
}

/** A tall water jar with a narrow neck. */
export function jar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = raw(
    `M ${r1(x - 18 * s)} ${r1(y)} C ${r1(x - 46 * s)} ${r1(y - 30 * s)} ${r1(x - 40 * s)} ${r1(y - 80 * s)} ${r1(x - 14 * s)} ${r1(y - 96 * s)} L ${r1(x - 14 * s)} ${r1(y - 112 * s)} L ${r1(x - 20 * s)} ${r1(y - 118 * s)}` +
      ` L ${r1(x + 20 * s)} ${r1(y - 118 * s)} L ${r1(x + 14 * s)} ${r1(y - 112 * s)} L ${r1(x + 14 * s)} ${r1(y - 96 * s)} C ${r1(x + 40 * s)} ${r1(y - 80 * s)} ${r1(x + 46 * s)} ${r1(y - 30 * s)} ${r1(x + 18 * s)} ${r1(y)} Z`,
    fill,
  );
  return wrap(g, o);
}
