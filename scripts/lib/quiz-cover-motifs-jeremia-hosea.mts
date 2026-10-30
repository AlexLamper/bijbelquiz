/**
 * Motifs for the Jeremia and Hosea cover series that the shared primitives do
 * not have: the almond rod and the seething pot, the shofar, the potter's
 * wheel, the yoke, the stocks, water jars and shards, a brazier, an idol on
 * its plinth, a stork and an eagle, a hind and a leopard, a net, a bow, a
 * sword and a round shield, the bronze temple pillars, a plough, a whirlwind,
 * a lily, and wrappers for the option-A figure poses the primitives' `person`
 * does not expose (staff, bless, shield, reach, kneeling with raised or
 * planting arms, bowed low, facing left).
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, no
 * filters, `y` is the ground a motif stands on, `s = 1` is the natural size.
 * People and animals go through `ink`, so a depth colour becomes the dark
 * silhouette colour exactly as it does for `person`.
 */

import {
  at,
  bowed,
  city as aCity,
  figure,
  fire as aFire,
  heart as aHeart,
  kneeler,
  quill as aQuill,
  sapling as aSapling,
  scrollShape,
  sheep as aSheep,
  star4 as aStar4,
  throne as aThrone,
  type Pose as APose,
} from './cover-options/shapes.mjs';
import { circle, ellipse, ink, path, rect, rotate, tri } from './quiz-cover-primitives.mjs';

type Opts = { opacity?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const wrap = (g: string, o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g);

/** A round-capped stroke along any path. */
export function stroke(d: string, fill: string, w: number, o?: Opts): string {
  const opa = o?.opacity !== undefined && o.opacity !== 1 ? ` opacity="${o.opacity}"` : '';
  return `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${opa}/>`;
}

/** A straight round-capped stroke. */
export function seg(x1: number, y1: number, x2: number, y2: number, w: number, fill: string, o?: Opts): string {
  return stroke(`M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}`, fill, w, o);
}

type Pt = [number, number];

function qpt(p0: Pt, c: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}

/** A filled band along a quadratic curve that tapers from width w0 to w1 - horns, branches, ropes. */
export function taper(p0: Pt, c: Pt, p1: Pt, w0: number, w1: number, fill: string, o?: Opts): string {
  const n = 18;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const [x, y] = qpt(p0, c, p1, t);
    const dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
    const dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push([x - (dy / len) * w, y + (dx / len) * w]);
    right.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  const pts = [...left, ...right.reverse()];
  // Relative-free absolute path, so a wide band in a depth colour still reads as an object (not a hill).
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${r1(x)} ${r1(y)}`).join(' ') + ' Z';
  return `<path d="${d}" fill="${fill}"${o?.opacity !== undefined && o.opacity !== 1 ? ` opacity="${o.opacity}"` : ''}/>`;
}

// ── people ────────────────────────────────────────────────────────────────

/**
 * The option-A standing figure with every pose it has (`person` maps only a
 * few). Same size as `person`: s = 1 is 134px tall. `flip` faces it left.
 */
export function fig(
  x: number,
  y: number,
  s: number,
  fill: string,
  pose: APose = 'stand',
  o: { flip?: boolean; staffFill?: string; opacity?: number } = {},
): string {
  return at(x, y, s * (134 / 204), figure(ink(fill), pose, { staffFill: o.staffFill }), { flip: o.flip, opacity: o.opacity });
}

/** Kneeling, side view, facing right (left with `flip`); arms pray, forward, up or plant. Same size as `person(.., 'kneel')`. */
export function kneel(
  x: number,
  y: number,
  s: number,
  fill: string,
  arms: 'pray' | 'forward' | 'up' | 'plant' = 'pray',
  o: { flip?: boolean; opacity?: number } = {},
): string {
  return at(x, y, s * 0.6, kneeler(ink(fill), arms), { flip: o.flip, opacity: o.opacity });
}

/** Bowed low on the knees, face in the hands - grief, mourning. Facing right (left with `flip`). */
export function bowLow(x: number, y: number, s: number, fill: string, o: { flip?: boolean; opacity?: number } = {}): string {
  return at(x, y, s * 0.6, bowed(ink(fill)), { flip: o.flip, opacity: o.opacity });
}

// ── plants ────────────────────────────────────────────────────────────────

/** A five-petal blossom. */
function blossom(x: number, y: number, r: number, fill: string, heart?: string): string {
  const out: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    out.push(circle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.52, fill));
  }
  if (heart) out.push(circle(x, y, r * 0.32, heart));
  return out.join('');
}

/**
 * An almond rod in blossom - "Ik zie een amandelstok" (Jeremia 1:11). A cut
 * branch stuck upright in the ground, side twigs and a crown of blossom.
 */
export function almondRod(rand: () => number, x: number, y: number, s: number, wood: string, bloom: string, heart?: string): string {
  const w = ink(wood);
  const p0: Pt = [x, y];
  const c: Pt = [x - 10 * s, y - 120 * s];
  const p1: Pt = [x + 14 * s, y - 250 * s];
  const out = [taper(p0, c, p1, 14 * s, 5 * s, w)];
  const twigs: [number, number, number][] = [
    [0.42, -1, 58],
    [0.55, 1, 64],
    [0.7, -1, 52],
    [0.82, 1, 44],
    [0.92, -1, 30],
  ];
  const ends: Pt[] = [p1];
  for (const [t, dir, len] of twigs) {
    const [bx, by] = qpt(p0, c, p1, t);
    const ex = bx + dir * len * s;
    const ey = by - len * 0.75 * s;
    out.push(taper([bx, by], [bx + dir * len * 0.4 * s, by - len * 0.2 * s], [ex, ey], 6 * s, 2.5 * s, w));
    ends.push([ex, ey]);
  }
  for (const [ex, ey] of ends) {
    const n = 3 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i += 1) {
      out.push(blossom(ex + (rand() - 0.5) * 34 * s, ey + (rand() - 0.5) * 26 * s, (9 + rand() * 4) * s, bloom, heart));
    }
  }
  // A few blossoms along the rod itself.
  for (const t of [0.5, 0.62, 0.76, 0.88]) {
    const [bx, by] = qpt(p0, c, p1, t);
    out.push(blossom(bx + (rand() - 0.5) * 18 * s, by, (7 + rand() * 3) * s, bloom, heart));
  }
  return out.join('');
}

/** A young shoot with three leaves - the Branch (Spruit), a planted seedling. `s = 1` is ~100 tall. */
export function shoot(x: number, y: number, s: number, stem: string, leaf: string, o?: Opts): string {
  return at(x, y, s, aSapling(stem, leaf), { opacity: o?.opacity });
}

/** A lily: a stem, two blade leaves and a three-petal bloom. `s = 1` is ~125 tall. */
export function lily(x: number, y: number, s: number, stem: string, bloom: string): string {
  const by = y - 84 * s;
  return (
    stroke(`M ${r1(x)} ${r1(y)} Q ${r1(x + 6 * s)} ${r1(y - 44 * s)} ${r1(x)} ${r1(by)}`, stem, 4.5 * s) +
    path(`M ${r1(x)} ${r1(y)} C ${r1(x - 10 * s)} ${r1(y - 20 * s)} ${r1(x - 26 * s)} ${r1(y - 40 * s)} ${r1(x - 34 * s)} ${r1(y - 58 * s)} C ${r1(x - 20 * s)} ${r1(y - 44 * s)} ${r1(x - 6 * s)} ${r1(y - 28 * s)} ${r1(x)} ${r1(y - 12 * s)} Z`, stem) +
    path(`M ${r1(x + 2 * s)} ${r1(y)} C ${r1(x + 12 * s)} ${r1(y - 16 * s)} ${r1(x + 24 * s)} ${r1(y - 30 * s)} ${r1(x + 30 * s)} ${r1(y - 46 * s)} C ${r1(x + 18 * s)} ${r1(y - 34 * s)} ${r1(x + 8 * s)} ${r1(y - 24 * s)} ${r1(x + 2 * s)} ${r1(y - 12 * s)} Z`, stem) +
    path(`M ${r1(x)} ${r1(by)} C ${r1(x - 10 * s)} ${r1(by - 16 * s)} ${r1(x - 6 * s)} ${r1(by - 34 * s)} ${r1(x)} ${r1(by - 42 * s)} C ${r1(x + 6 * s)} ${r1(by - 34 * s)} ${r1(x + 10 * s)} ${r1(by - 16 * s)} ${r1(x)} ${r1(by)} Z`, bloom) +
    path(`M ${r1(x)} ${r1(by)} C ${r1(x - 16 * s)} ${r1(by - 6 * s)} ${r1(x - 28 * s)} ${r1(by - 20 * s)} ${r1(x - 34 * s)} ${r1(by - 30 * s)} C ${r1(x - 20 * s)} ${r1(by - 28 * s)} ${r1(x - 8 * s)} ${r1(by - 18 * s)} ${r1(x - 2 * s)} ${r1(by - 8 * s)} Z`, bloom) +
    path(`M ${r1(x)} ${r1(by)} C ${r1(x + 16 * s)} ${r1(by - 6 * s)} ${r1(x + 28 * s)} ${r1(by - 20 * s)} ${r1(x + 34 * s)} ${r1(by - 30 * s)} C ${r1(x + 20 * s)} ${r1(by - 28 * s)} ${r1(x + 8 * s)} ${r1(by - 18 * s)} ${r1(x + 2 * s)} ${r1(by - 8 * s)} Z`, bloom)
  );
}

/** A tree stump cut level, with a short root flare - the felled house of David. */
export function cutStump(x: number, y: number, s: number, fill: string): string {
  const f = ink(fill);
  return (
    path(
      `M ${r1(x - 54 * s)} ${r1(y)} C ${r1(x - 40 * s)} ${r1(y - 6 * s)} ${r1(x - 34 * s)} ${r1(y - 14 * s)} ${r1(x - 34 * s)} ${r1(y - 30 * s)} L ${r1(x - 36 * s)} ${r1(y - 76 * s)}` +
        ` L ${r1(x + 36 * s)} ${r1(y - 76 * s)} L ${r1(x + 34 * s)} ${r1(y - 30 * s)} C ${r1(x + 34 * s)} ${r1(y - 14 * s)} ${r1(x + 40 * s)} ${r1(y - 6 * s)} ${r1(x + 56 * s)} ${r1(y)} Z`,
      f,
    ) + ellipse(x, y - 76 * s, 36 * s, 10 * s, f)
  );
}

// ── vessels and objects ───────────────────────────────────────────────────

/** A clay water jar with two handles; `s = 1` is ~116 tall. */
export function jar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(
      `M ${r1(x - 12 * s)} ${r1(y)} C ${r1(x - 46 * s)} ${r1(y - 6 * s)} ${r1(x - 50 * s)} ${r1(y - 72 * s)} ${r1(x - 20 * s)} ${r1(y - 92 * s)}` +
        ` L ${r1(x - 13 * s)} ${r1(y - 106 * s)} L ${r1(x - 19 * s)} ${r1(y - 116 * s)} L ${r1(x + 19 * s)} ${r1(y - 116 * s)} L ${r1(x + 13 * s)} ${r1(y - 106 * s)}` +
        ` L ${r1(x + 20 * s)} ${r1(y - 92 * s)} C ${r1(x + 50 * s)} ${r1(y - 72 * s)} ${r1(x + 46 * s)} ${r1(y - 6 * s)} ${r1(x + 12 * s)} ${r1(y)} Z`,
      fill,
    ) +
    stroke(`M ${r1(x - 13 * s)} ${r1(y - 104 * s)} C ${r1(x - 40 * s)} ${r1(y - 108 * s)} ${r1(x - 42 * s)} ${r1(y - 86 * s)} ${r1(x - 30 * s)} ${r1(y - 78 * s)}`, fill, 5 * s) +
    stroke(`M ${r1(x + 13 * s)} ${r1(y - 104 * s)} C ${r1(x + 40 * s)} ${r1(y - 108 * s)} ${r1(x + 42 * s)} ${r1(y - 86 * s)} ${r1(x + 30 * s)} ${r1(y - 78 * s)}`, fill, 5 * s);
  return wrap(g, o);
}

/** The same jar lying on its side, mouth to the right - spilled, empty. */
export function jarFallen(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(rotate(-84, x, y - 30 * s, jar(x, y + 20 * s, s, fill)), o);
}

/** Potsherds scattered on the ground around (x, y). */
export function shards(rand: () => number, x: number, y: number, s: number, fill: string, n = 7, spread = 160): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + (rand() - 0.5) * spread * s;
    const py = y - rand() * 10 * s;
    const k = (0.6 + rand() * 0.7) * s;
    const a = (rand() - 0.5) * 120;
    out.push(
      rotate(
        a,
        px,
        py,
        path(`M ${r1(px - 16 * k)} ${r1(py)} Q ${r1(px - 10 * k)} ${r1(py - 20 * k)} ${r1(px + 6 * k)} ${r1(py - 22 * k)} L ${r1(px + 18 * k)} ${r1(py - 6 * k)} L ${r1(px + 4 * k)} ${r1(py + 2 * k)} Z`, fill),
      ),
    );
  }
  return out.join('');
}

/**
 * A seething pot on three short legs, tipped toward the viewer's right -
 * "een ziedende pot, en zijn voorste deel is van het noorden af" (Jeremia 1:13).
 */
export function cauldron(x: number, y: number, s: number, fill: string, tilt = 12): string {
  const f = ink(fill);
  const g =
    rect(x - 46 * s, y - 34 * s, 9 * s, 34 * s, f, { rx: 3 * s }) +
    rect(x + 37 * s, y - 34 * s, 9 * s, 34 * s, f, { rx: 3 * s }) +
    rect(x - 4 * s, y - 30 * s, 8 * s, 30 * s, f, { rx: 3 * s }) +
    path(
      `M ${r1(x - 74 * s)} ${r1(y - 120 * s)} L ${r1(x + 74 * s)} ${r1(y - 120 * s)} C ${r1(x + 84 * s)} ${r1(y - 66 * s)} ${r1(x + 52 * s)} ${r1(y - 26 * s)} ${r1(x)} ${r1(y - 24 * s)}` +
        ` C ${r1(x - 52 * s)} ${r1(y - 26 * s)} ${r1(x - 84 * s)} ${r1(y - 66 * s)} ${r1(x - 74 * s)} ${r1(y - 120 * s)} Z`,
      f,
    ) +
    rect(x - 84 * s, y - 134 * s, 168 * s, 16 * s, f, { rx: 7 * s }) +
    stroke(`M ${r1(x - 78 * s)} ${r1(y - 110 * s)} C ${r1(x - 104 * s)} ${r1(y - 110 * s)} ${r1(x - 104 * s)} ${r1(y - 80 * s)} ${r1(x - 76 * s)} ${r1(y - 80 * s)}`, f, 7 * s) +
    stroke(`M ${r1(x + 78 * s)} ${r1(y - 110 * s)} C ${r1(x + 104 * s)} ${r1(y - 110 * s)} ${r1(x + 104 * s)} ${r1(y - 80 * s)} ${r1(x + 76 * s)} ${r1(y - 80 * s)}`, f, 7 * s);
  return rotate(tilt, x, y, g);
}

/** A ram's horn trumpet: mouthpiece at (x, y), bell curving up and to the right. `flip` points it left. */
export function shofar(x: number, y: number, s: number, fill: string, flip = false, ring?: string): string {
  const d = flip ? -1 : 1;
  const p0: Pt = [x, y];
  const c: Pt = [x + d * 100 * s, y + 34 * s];
  const bell: Pt = [x + d * 150 * s, y - 74 * s];
  const out = [taper(p0, c, bell, 8 * s, 40 * s, fill), rotate(d * -20, bell[0], bell[1], ellipse(bell[0], bell[1], 22 * s, 10 * s, fill))];
  if (ring) {
    // Growth rings across the horn, so it reads as horn and not as a plain curve.
    for (const t of [0.34, 0.52, 0.68, 0.82]) {
      const [px, py] = qpt(p0, c, bell, t);
      const dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (bell[0] - c[0]);
      const dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (bell[1] - c[1]);
      const len = Math.hypot(dx, dy) || 1;
      const w = (8 + 32 * t) * s * 0.42;
      out.push(seg(px - (dy / len) * w, py + (dx / len) * w, px + (dy / len) * w, py - (dx / len) * w, 2.4 * s, ring, { opacity: 0.55 }));
    }
  }
  return out.join('');
}

/** A lion on the prowl, side view facing left, maned head up. `s = 1` is ~120 tall, ~230 long. */
export function prowlingLion(x: number, y: number, s: number, fill: string): string {
  const f = ink(fill);
  const mx = x - 74 * s;
  const my = y - 92 * s;
  const mane: string[] = [];
  const n = 22;
  for (let i = 0; i < n; i += 1) {
    const a = (Math.PI * 2 * i) / n;
    const rr = (i % 2 ? 36 : 46) * s;
    mane.push(`${i ? 'L' : 'M'} ${r1(mx + Math.cos(a) * rr)} ${r1(my + Math.sin(a) * rr * 0.95)}`);
  }
  return (
    stroke(`M ${r1(x + 66 * s)} ${r1(y - 74 * s)} C ${r1(x + 104 * s)} ${r1(y - 96 * s)} ${r1(x + 112 * s)} ${r1(y - 60 * s)} ${r1(x + 118 * s)} ${r1(y - 40 * s)}`, f, 7 * s) +
    ellipse(x + 120 * s, y - 36 * s, 9 * s, 12 * s, f) +
    seg(x + 50 * s, y - 60 * s, x + 64 * s, y - 4 * s, 15 * s, f) +
    seg(x + 30 * s, y - 60 * s, x + 22 * s, y - 4 * s, 15 * s, f) +
    seg(x - 36 * s, y - 60 * s, x - 52 * s, y - 4 * s, 15 * s, f) +
    seg(x - 56 * s, y - 60 * s, x - 40 * s, y - 4 * s, 15 * s, f) +
    ellipse(x, y - 70 * s, 72 * s, 27 * s, f) +
    path(mane.join(' ') + ' Z', f) +
    path(`M ${r1(mx - 18 * s)} ${r1(my - 14 * s)} C ${r1(mx - 44 * s)} ${r1(my - 14 * s)} ${r1(mx - 62 * s)} ${r1(my + 2 * s)} ${r1(mx - 58 * s)} ${r1(my + 16 * s)} L ${r1(mx - 30 * s)} ${r1(my + 26 * s)} L ${r1(mx - 10 * s)} ${r1(my + 16 * s)} Z`, f) +
    seg(x - 52 * s, y - 4 * s, x - 64 * s, y - 2 * s, 12 * s, f) +
    seg(x - 40 * s, y - 4 * s, x - 28 * s, y - 2 * s, 12 * s, f)
  );
}

/**
 * A wooden neck yoke seen from the front: a bowed beam with a pair of bows
 * hanging under it. (x, y) is the middle of the beam.
 */
export function yoke(x: number, y: number, s: number, fill: string): string {
  const beam = path(
    `M ${r1(x - 120 * s)} ${r1(y - 2 * s)} Q ${r1(x)} ${r1(y - 26 * s)} ${r1(x + 120 * s)} ${r1(y - 2 * s)} L ${r1(x + 120 * s)} ${r1(y + 14 * s)} Q ${r1(x)} ${r1(y - 8 * s)} ${r1(x - 120 * s)} ${r1(y + 14 * s)} Z`,
    fill,
  );
  return (
    beam +
    circle(x - 120 * s, y + 6 * s, 10 * s, fill) +
    circle(x + 120 * s, y + 6 * s, 10 * s, fill) +
    stroke(`M ${r1(x - 86 * s)} ${r1(y + 2 * s)} C ${r1(x - 88 * s)} ${r1(y + 58 * s)} ${r1(x - 44 * s)} ${r1(y + 58 * s)} ${r1(x - 46 * s)} ${r1(y - 4 * s)}`, fill, 7 * s) +
    stroke(`M ${r1(x + 86 * s)} ${r1(y + 2 * s)} C ${r1(x + 88 * s)} ${r1(y + 58 * s)} ${r1(x + 44 * s)} ${r1(y + 58 * s)} ${r1(x + 46 * s)} ${r1(y - 4 * s)}`, fill, 7 * s)
  );
}

/** The yoke snapped in two: the halves fall apart, each with a splintered end. (x, y) is where it broke. */
export function brokenYoke(x: number, y: number, s: number, fill: string, gap = 40): string {
  const half = (dir: number) => {
    const sx = x + dir * gap * 0.5 * s;
    return (
      path(
        `M ${r1(sx)} ${r1(y - 12 * s)} Q ${r1(sx + dir * 60 * s)} ${r1(y - 18 * s)} ${r1(sx + dir * 118 * s)} ${r1(y - 2 * s)} L ${r1(sx + dir * 118 * s)} ${r1(y + 14 * s)}` +
          ` Q ${r1(sx + dir * 60 * s)} ${r1(y)} ${r1(sx)} ${r1(y + 6 * s)} L ${r1(sx - dir * 10 * s)} ${r1(y + 2 * s)} L ${r1(sx + dir * 2 * s)} ${r1(y - 2 * s)} L ${r1(sx - dir * 12 * s)} ${r1(y - 8 * s)} Z`,
        fill,
      ) +
      circle(sx + dir * 118 * s, y + 6 * s, 10 * s, fill) +
      stroke(`M ${r1(sx + dir * 84 * s)} ${r1(y + 4 * s)} C ${r1(sx + dir * 86 * s)} ${r1(y + 58 * s)} ${r1(sx + dir * 42 * s)} ${r1(y + 58 * s)} ${r1(sx + dir * 44 * s)} ${r1(y)}`, fill, 7 * s)
    );
  };
  return rotate(-16, x - gap * 0.5 * s, y, half(-1)) + rotate(14, x + gap * 0.5 * s, y, half(1));
}

/** A chain of oval links from (x1, y1) to (x2, y2), links turning alternately flat and edge-on. */
export function chainAlong(x1: number, y1: number, x2: number, y2: number, s: number, fill: string, sag = 0): string {
  const out: string[] = [];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(2, Math.round(len / (22 * s)));
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag;
    if (i % 2) out.push(rotate(ang, x, y, rect(x - 13 * s, y - 2.5 * s, 26 * s, 5 * s, fill, { rx: 2.5 * s })));
    else out.push(rotate(ang, x, y, `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(13 * s)}" ry="${r1(8 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(4.5 * s)}"/>`));
  }
  return out.join('');
}

/** Stocks: two posts and a heavy beam with a figure's feet locked in it. (x, y) is the foot of the beam. */
export function stocks(x: number, y: number, s: number, fill: string, hole?: string): string {
  const f = ink(fill);
  return (
    rect(x - 92 * s, y - 70 * s, 14 * s, 70 * s, f, { rx: 3 * s }) +
    rect(x + 78 * s, y - 70 * s, 14 * s, 70 * s, f, { rx: 3 * s }) +
    rect(x - 104 * s, y - 78 * s, 38 * s, 10 * s, f, { rx: 3 * s }) +
    rect(x + 66 * s, y - 78 * s, 38 * s, 10 * s, f, { rx: 3 * s }) +
    rect(x - 96 * s, y - 52 * s, 192 * s, 30 * s, f, { rx: 4 * s }) +
    (hole ? circle(x - 30 * s, y - 37 * s, 7 * s, hole) + circle(x + 30 * s, y - 37 * s, 7 * s, hole) : '')
  );
}

/** A potter's wheel: kick wheel below, throwing head above, a vessel rising on it. */
export function potterWheel(x: number, y: number, s: number, wheelFill: string, clayFill: string): string {
  const f = ink(wheelFill);
  return (
    ellipse(x, y - 8 * s, 70 * s, 14 * s, f) +
    rect(x - 7 * s, y - 70 * s, 14 * s, 64 * s, f) +
    ellipse(x, y - 70 * s, 46 * s, 10 * s, f) +
    path(
      `M ${r1(x - 26 * s)} ${r1(y - 74 * s)} C ${r1(x - 46 * s)} ${r1(y - 100 * s)} ${r1(x - 40 * s)} ${r1(y - 130 * s)} ${r1(x - 14 * s)} ${r1(y - 146 * s)}` +
        ` L ${r1(x - 18 * s)} ${r1(y - 160 * s)} L ${r1(x + 18 * s)} ${r1(y - 160 * s)} L ${r1(x + 14 * s)} ${r1(y - 146 * s)}` +
        ` C ${r1(x + 40 * s)} ${r1(y - 130 * s)} ${r1(x + 46 * s)} ${r1(y - 100 * s)} ${r1(x + 26 * s)} ${r1(y - 74 * s)} Z`,
      clayFill,
    )
  );
}

/** A bronze brazier on three legs, coals glowing in the bowl; the fire is drawn separately with `fireOn`. */
export function brazier(x: number, y: number, s: number, fill: string): string {
  const f = ink(fill);
  return (
    stroke(`M ${r1(x - 30 * s)} ${r1(y - 60 * s)} L ${r1(x - 46 * s)} ${r1(y)}`, f, 8 * s) +
    stroke(`M ${r1(x + 30 * s)} ${r1(y - 60 * s)} L ${r1(x + 46 * s)} ${r1(y)}`, f, 8 * s) +
    stroke(`M ${r1(x)} ${r1(y - 60 * s)} L ${r1(x)} ${r1(y)}`, f, 8 * s) +
    path(`M ${r1(x - 66 * s)} ${r1(y - 90 * s)} L ${r1(x + 66 * s)} ${r1(y - 90 * s)} C ${r1(x + 60 * s)} ${r1(y - 56 * s)} ${r1(x + 30 * s)} ${r1(y - 50 * s)} ${r1(x)} ${r1(y - 50 * s)} C ${r1(x - 30 * s)} ${r1(y - 50 * s)} ${r1(x - 60 * s)} ${r1(y - 56 * s)} ${r1(x - 66 * s)} ${r1(y - 90 * s)} Z`, f) +
    rect(x - 72 * s, y - 98 * s, 144 * s, 12 * s, f, { rx: 5 * s })
  );
}

/** A three-layer fire standing at (x, y): outer, middle and core colours. `s = 1` is ~150 tall. */
export function fireOn(x: number, y: number, s: number, outer: string, middle: string, core: string): string {
  return at(x, y, s, aFire(150, 110, outer, middle, core));
}

/** A rolled scroll seen open, rods top and bottom; (x, y) is the bottom rod. `s = 1` is ~146 tall, 208 wide. */
export function scrollOpen(x: number, y: number, s: number, paper: string, roll: string, text?: string, o?: { rot?: number }): string {
  return at(x, y, s, scrollShape(paper, roll, text), { rot: o?.rot });
}

/** A quill pen, nib at (x, y), feather up and to the right; `s = 1` is ~180 long. */
export function quillPen(x: number, y: number, s: number, fill: string, shaft?: string): string {
  return at(x, y, s, aQuill(fill, shaft));
}

/** A heart, centred at (x, y); `s = 1` is ~128 wide. */
export function heartShape(x: number, y: number, s: number, fill: string): string {
  return at(x, y + 22 * s, s, aHeart(fill));
}

/** A throne on two steps with arm rests and a rounded back; `s = 1` is ~250 tall, 300 wide at the steps. */
export function throneSeat(x: number, y: number, s: number, fill: string, trim?: string, o?: Opts): string {
  return at(x, y, s, aThrone(fill, trim), { opacity: o?.opacity });
}

/** A four-pointed star centred at (x, y). */
export function star4(x: number, y: number, r: number, fill: string): string {
  return at(x, y, 1, aStar4(r, fill));
}

/** A walled hill city with towers and a temple roof (the roof can carry the accent). `w` is the half-width. */
export function hillCity(rand: () => number, x: number, y: number, s: number, w: number, fill: string, roof?: string): string {
  return at(x, y, s, aCity(rand, w, fill, roof));
}

/** A sheep or lamb facing right (left with `flip`); `s = 1` is ~70 tall. */
export function lamb(x: number, y: number, s: number, body: string, head: string, o: { flip?: boolean; opacity?: number } = {}): string {
  return at(x, y, s, aSheep(body, ink(head)), { flip: o.flip, opacity: o.opacity });
}

/** Figs heaped in a mound above (x, y) - drawn on top of a basket rim. */
export function figHeap(rand: () => number, x: number, y: number, s: number, fill: string, n = 11, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = (i + 0.5) / n;
    const px = x + (t - 0.5) * 70 * s + (rand() - 0.5) * 8 * s;
    const py = y - Math.sin(t * Math.PI) * 26 * s - rand() * 6 * s;
    const k = (0.85 + rand() * 0.3) * s;
    out.push(
      path(
        `M ${r1(px)} ${r1(py - 16 * k)} C ${r1(px + 12 * k)} ${r1(py - 12 * k)} ${r1(px + 14 * k)} ${r1(py + 8 * k)} ${r1(px)} ${r1(py + 10 * k)}` +
          ` C ${r1(px - 14 * k)} ${r1(py + 8 * k)} ${r1(px - 12 * k)} ${r1(py - 12 * k)} ${r1(px)} ${r1(py - 16 * k)} Z`,
        fill,
      ),
    );
  }
  return wrap(out.join(''), o);
}

/** A grain sack tied at the neck; `s = 1` is ~90 tall. */
export function sack(x: number, y: number, s: number, fill: string): string {
  return (
    path(
      `M ${r1(x - 40 * s)} ${r1(y)} C ${r1(x - 52 * s)} ${r1(y - 40 * s)} ${r1(x - 40 * s)} ${r1(y - 66 * s)} ${r1(x - 14 * s)} ${r1(y - 72 * s)}` +
        ` L ${r1(x + 14 * s)} ${r1(y - 72 * s)} C ${r1(x + 40 * s)} ${r1(y - 66 * s)} ${r1(x + 52 * s)} ${r1(y - 40 * s)} ${r1(x + 40 * s)} ${r1(y)} Z`,
      fill,
    ) +
    path(`M ${r1(x - 14 * s)} ${r1(y - 70 * s)} L ${r1(x - 24 * s)} ${r1(y - 92 * s)} L ${r1(x + 24 * s)} ${r1(y - 92 * s)} L ${r1(x + 14 * s)} ${r1(y - 70 * s)} Z`, fill) +
    rect(x - 18 * s, y - 76 * s, 36 * s, 8 * s, fill, { rx: 4 * s })
  );
}

/** A low goat-hair tent on poles: a ridge with two peaks, sloping sides and a dark opening; `s = 1` is ~184 wide. */
export function campTent(x: number, y: number, s: number, fill: string, door?: string): string {
  return (
    seg(x - 84 * s, y - 50 * s, x - 112 * s, y, 2.4 * s, fill) +
    seg(x + 86 * s, y - 52 * s, x + 114 * s, y, 2.4 * s, fill) +
    path(
      `M ${r1(x - 92 * s)} ${r1(y)} L ${r1(x - 84 * s)} ${r1(y - 50 * s)} L ${r1(x - 40 * s)} ${r1(y - 74 * s)} L ${r1(x)} ${r1(y - 60 * s)}` +
        ` L ${r1(x + 42 * s)} ${r1(y - 78 * s)} L ${r1(x + 86 * s)} ${r1(y - 52 * s)} L ${r1(x + 94 * s)} ${r1(y)} Z`,
      fill,
    ) +
    seg(x - 40 * s, y - 74 * s, x - 40 * s, y - 86 * s, 3 * s, fill) +
    seg(x + 42 * s, y - 78 * s, x + 42 * s, y - 90 * s, 3 * s, fill) +
    (door ? path(`M ${r1(x - 18 * s)} ${r1(y)} L ${r1(x - 12 * s)} ${r1(y - 46 * s)} L ${r1(x + 16 * s)} ${r1(y - 46 * s)} L ${r1(x + 22 * s)} ${r1(y)} Z`, door, { opacity: 0.5 }) : '')
  );
}

/** A plain table: top slab and two legs; `y` is the floor. */
export function table(x: number, y: number, w: number, s: number, fill: string): string {
  const f = ink(fill);
  return rect(x - w / 2, y - 62 * s, w, 12 * s, f, { rx: 3 * s }) + rect(x - w / 2 + 16 * s, y - 52 * s, 10 * s, 52 * s, f) + rect(x + w / 2 - 26 * s, y - 52 * s, 10 * s, 52 * s, f);
}

/** A stone altar with four horns; `s = 1` is ~84 tall. */
export function hornedAltar(x: number, y: number, s: number, fill: string): string {
  return (
    rect(x - 52 * s, y - 14 * s, 104 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x - 42 * s, y - 70 * s, 84 * s, 58 * s, fill) +
    rect(x - 50 * s, y - 80 * s, 100 * s, 12 * s, fill, { rx: 2 * s }) +
    tri(x - 50 * s, y - 80 * s, x - 50 * s, y - 98 * s, x - 34 * s, y - 80 * s, fill) +
    tri(x + 50 * s, y - 80 * s, x + 50 * s, y - 98 * s, x + 34 * s, y - 80 * s, fill)
  );
}

/** A bronze temple pillar (Jachin, Boaz): base, shaft, a bowl capital with a lily crown and a row of pomegranates. */
export function bronzePillar(x: number, y: number, s: number, fill: string, broken = false): string {
  const base = rect(x - 32 * s, y - 16 * s, 64 * s, 16 * s, fill, { rx: 3 * s });
  if (broken) {
    // The shaft snapped low; the upper part with its capital lies in the dust to the right.
    const stub = path(`M ${r1(x - 20 * s)} ${r1(y - 14 * s)} L ${r1(x - 20 * s)} ${r1(y - 118 * s)} L ${r1(x - 6 * s)} ${r1(y - 104 * s)} L ${r1(x + 6 * s)} ${r1(y - 128 * s)} L ${r1(x + 20 * s)} ${r1(y - 110 * s)} L ${r1(x + 20 * s)} ${r1(y - 14 * s)} Z`, fill);
    const cx = x + 196 * s;
    const cy = y - 30 * s;
    const top =
      path(`M ${r1(x + 44 * s)} ${r1(y)} L ${r1(x + 40 * s)} ${r1(y - 22 * s)} L ${r1(x + 54 * s)} ${r1(y - 30 * s)} L ${r1(x + 48 * s)} ${r1(y - 40 * s)} L ${r1(cx - 20 * s)} ${r1(y - 40 * s)} L ${r1(cx - 20 * s)} ${r1(y)} Z`, fill) +
      rotate(90, cx, cy, ellipse(cx, cy, 44 * s, 28 * s, fill) + capital(cx, cy - 10 * s, s, fill));
    return base + stub + top;
  }
  return base + rect(x - 20 * s, y - 240 * s, 40 * s, 226 * s, fill) + ellipse(x, y - 262 * s, 44 * s, 28 * s, fill) + capital(x, y - 272 * s, s, fill);
}

function capital(x: number, y: number, s: number, fill: string): string {
  const out = [rect(x - 46 * s, y - 6 * s, 92 * s, 10 * s, fill, { rx: 4 * s })];
  for (let i = 0; i < 5; i += 1) out.push(circle(x - 40 * s + i * 20 * s, y + 10 * s, 6 * s, fill));
  out.push(path(`M ${r1(x - 40 * s)} ${r1(y - 6 * s)} L ${r1(x - 46 * s)} ${r1(y - 34 * s)} L ${r1(x - 20 * s)} ${r1(y - 16 * s)} L ${r1(x)} ${r1(y - 40 * s)} L ${r1(x + 20 * s)} ${r1(y - 16 * s)} L ${r1(x + 46 * s)} ${r1(y - 34 * s)} L ${r1(x + 40 * s)} ${r1(y - 6 * s)} Z`, fill));
  return out.join('');
}

/** A stiff idol on a plinth: a tall cap, arms fixed to its sides - "zij zijn als een palmboom, maar spreken niet". `s = 1` is ~226 tall. */
export function idol(x: number, y: number, s: number, fill: string, plinth?: string): string {
  const pf = plinth ?? fill;
  return (
    rect(x - 44 * s, y - 32 * s, 88 * s, 32 * s, pf, { rx: 3 * s }) +
    rect(x - 52 * s, y - 42 * s, 104 * s, 12 * s, pf, { rx: 3 * s }) +
    path(`M ${r1(x - 28 * s)} ${r1(y - 42 * s)} L ${r1(x - 24 * s)} ${r1(y - 152 * s)} L ${r1(x + 24 * s)} ${r1(y - 152 * s)} L ${r1(x + 28 * s)} ${r1(y - 42 * s)} Z`, fill) +
    rect(x - 34 * s, y - 158 * s, 68 * s, 20 * s, fill, { rx: 8 * s }) +
    rect(x - 36 * s, y - 146 * s, 10 * s, 70 * s, fill, { rx: 5 * s }) +
    rect(x + 26 * s, y - 146 * s, 10 * s, 70 * s, fill, { rx: 5 * s }) +
    circle(x, y - 176 * s, 18 * s, fill) +
    path(`M ${r1(x - 17 * s)} ${r1(y - 184 * s)} L ${r1(x - 8 * s)} ${r1(y - 226 * s)} L ${r1(x + 8 * s)} ${r1(y - 226 * s)} L ${r1(x + 17 * s)} ${r1(y - 184 * s)} Z`, fill)
  );
}

/** A straight sword, point up; (x, y) is the pommel. `s = 1` is ~214 long. */
export function sword(x: number, y: number, s: number, fill: string): string {
  return (
    path(`M ${r1(x)} ${r1(y - 214 * s)} L ${r1(x + 11 * s)} ${r1(y - 190 * s)} L ${r1(x + 11 * s)} ${r1(y - 60 * s)} L ${r1(x - 11 * s)} ${r1(y - 60 * s)} L ${r1(x - 11 * s)} ${r1(y - 190 * s)} Z`, fill) +
    rect(x - 42 * s, y - 64 * s, 84 * s, 12 * s, fill, { rx: 5 * s }) +
    rect(x - 6 * s, y - 54 * s, 12 * s, 42 * s, fill, { rx: 3 * s }) +
    circle(x, y - 8 * s, 10 * s, fill)
  );
}

/** A round shield with a rim and a boss, centred at (x, y). */
export function roundShield(x: number, y: number, s: number, fill: string, rim?: string): string {
  return (
    circle(x, y, 40 * s, fill) +
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(31 * s)}" fill="none" stroke="${rim ?? fill}" stroke-width="${r1(4 * s)}" opacity="0.55"/>` +
    circle(x, y, 10 * s, rim ?? fill, { opacity: 0.7 })
  );
}

/** An archer's bow lying on the ground, string down; `broken` snaps it in the middle. */
export function archBow(x: number, y: number, s: number, fill: string, broken = false): string {
  if (!broken) {
    return stroke(`M ${r1(x - 96 * s)} ${r1(y - 6 * s)} Q ${r1(x)} ${r1(y - 96 * s)} ${r1(x + 96 * s)} ${r1(y - 6 * s)}`, fill, 9 * s) + seg(x - 96 * s, y - 6 * s, x + 96 * s, y - 6 * s, 2.5 * s, fill);
  }
  return (
    stroke(`M ${r1(x - 110 * s)} ${r1(y - 4 * s)} Q ${r1(x - 56 * s)} ${r1(y - 70 * s)} ${r1(x - 12 * s)} ${r1(y - 52 * s)}`, fill, 9 * s) +
    stroke(`M ${r1(x + 4 * s)} ${r1(y - 24 * s)} Q ${r1(x + 56 * s)} ${r1(y - 54 * s)} ${r1(x + 110 * s)} ${r1(y - 4 * s)}`, fill, 9 * s) +
    stroke(`M ${r1(x - 110 * s)} ${r1(y - 4 * s)} Q ${r1(x - 40 * s)} ${r1(y + 8 * s)} ${r1(x - 20 * s)} ${r1(y + 2 * s)}`, fill, 2.5 * s) +
    stroke(`M ${r1(x + 110 * s)} ${r1(y - 4 * s)} Q ${r1(x + 50 * s)} ${r1(y + 6 * s)} ${r1(x + 30 * s)} ${r1(y)}`, fill, 2.5 * s)
  );
}

/**
 * A fishing net hung from its top edge (x - w/2 .. x + w/2 at y) and sagging
 * into a bag below; floats along the top.
 */
export function net(x: number, y: number, w: number, h: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  const tl: Pt = [x - w / 2, y];
  const tr: Pt = [x + w / 2, y];
  const bl: Pt = [x - w * 0.34, y + h * 0.72];
  const br: Pt = [x + w * 0.34, y + h * 0.72];
  const bc: Pt = [x, y + h * 1.18];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const rows = 6;
  const cols = 9;
  for (let i = 1; i <= rows; i += 1) {
    const t = i / rows;
    const l = lerp(tl, bl, t);
    const r = lerp(tr, br, t);
    const sag = h * 0.46 * t;
    out.push(stroke(`M ${r1(l[0])} ${r1(l[1])} Q ${r1((l[0] + r[0]) / 2)} ${r1((l[1] + r[1]) / 2 + sag)} ${r1(r[0])} ${r1(r[1])}`, fill, 3 * s));
  }
  for (let j = 0; j <= cols; j += 1) {
    const u = j / cols;
    const top = lerp(tl, tr, u);
    const bot = qpt(bl, bc, br, u);
    out.push(stroke(`M ${r1(top[0])} ${r1(top[1])} L ${r1(bot[0])} ${r1(bot[1])}`, fill, 3 * s));
  }
  out.push(stroke(`M ${r1(tl[0])} ${r1(tl[1])} L ${r1(tr[0])} ${r1(tr[1])}`, fill, 6 * s));
  for (let j = 0; j <= 6; j += 1) out.push(ellipse(tl[0] + (w * j) / 6, y, 9 * s, 6 * s, fill));
  return wrap(out.join(''), o);
}

/** A whirlwind: a leaning funnel of rings narrowing to the ground at (x, y); ~h tall. */
export function whirlwind(x: number, y: number, h: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  const n = 12;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const cy = y - t * h;
    const rx = (10 + t * t * 130) * s;
    const cx = x + Math.sin(t * 2.6) * 34 * s + t * 30 * s;
    out.push(
      `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(rx * 0.2)}" fill="none" stroke="${fill}" stroke-width="${r1((5 + t * 8) * s)}" opacity="${r1(0.35 + t * 0.5)}"/>`,
    );
  }
  return wrap(out.join(''), o);
}

/** A wooden ard plough pointing left: share in the ground at (x, y), beam reaching forward, handle back. */
export function plough(x: number, y: number, s: number, fill: string): string {
  const f = ink(fill);
  return (
    path(`M ${r1(x - 46 * s)} ${r1(y + 2 * s)} L ${r1(x - 4 * s)} ${r1(y - 22 * s)} L ${r1(x + 8 * s)} ${r1(y - 8 * s)} L ${r1(x - 8 * s)} ${r1(y + 4 * s)} Z`, f) +
    seg(x - 4 * s, y - 12 * s, x - 150 * s, y - 64 * s, 8 * s, f) +
    seg(x, y - 10 * s, x + 56 * s, y - 96 * s, 8 * s, f) +
    seg(x + 46 * s, y - 98 * s, x + 70 * s, y - 92 * s, 7 * s, f)
  );
}

// ── animals ───────────────────────────────────────────────────────────────

/** A stork in flight facing right: long neck and beak, trailing legs, broad wings up. */
export function stork(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const g =
    ellipse(x, y, 34 * s, 11 * s, f) +
    seg(x + 26 * s, y - 3 * s, x + 66 * s, y - 6 * s, 7 * s, f) +
    circle(x + 68 * s, y - 6 * s, 7 * s, f) +
    tri(x + 72 * s, y - 10 * s, x + 108 * s, y - 3 * s, x + 72 * s, y - 2 * s, f) +
    seg(x - 30 * s, y + 3 * s, x - 90 * s, y + 10 * s, 3.6 * s, f) +
    path(
      `M ${r1(x - 18 * s)} ${r1(y - 6 * s)} C ${r1(x - 30 * s)} ${r1(y - 40 * s)} ${r1(x - 48 * s)} ${r1(y - 68 * s)} ${r1(x - 62 * s)} ${r1(y - 88 * s)}` +
        ` L ${r1(x - 44 * s)} ${r1(y - 82 * s)} L ${r1(x - 40 * s)} ${r1(y - 94 * s)} L ${r1(x - 22 * s)} ${r1(y - 80 * s)} L ${r1(x - 14 * s)} ${r1(y - 90 * s)}` +
        ` L ${r1(x + 2 * s)} ${r1(y - 72 * s)} C ${r1(x + 8 * s)} ${r1(y - 44 * s)} ${r1(x + 14 * s)} ${r1(y - 22 * s)} ${r1(x + 14 * s)} ${r1(y - 6 * s)} Z`,
      f,
    ) +
    path(
      `M ${r1(x - 10 * s)} ${r1(y + 4 * s)} C ${r1(x - 20 * s)} ${r1(y + 26 * s)} ${r1(x - 34 * s)} ${r1(y + 40 * s)} ${r1(x - 46 * s)} ${r1(y + 50 * s)} L ${r1(x - 22 * s)} ${r1(y + 46 * s)} L ${r1(x + 10 * s)} ${r1(y + 6 * s)} Z`,
      f,
      { opacity: 0.8 },
    );
  return wrap(g, o);
}

/** An eagle perched with its wings raised, facing right; (x, y) is the perch under its talons. `s = 1` spans ~260. */
export function eagle(x: number, y: number, s: number, fill: string): string {
  const f = ink(fill);
  const wing = (d: number) =>
    path(
      [
        [8, -78],
        [40, -112],
        [82, -150],
        [128, -178],
        [114, -148],
        [134, -140],
        [106, -120],
        [124, -104],
        [94, -94],
        [104, -76],
        [72, -70],
        [48, -62],
        [16, -50],
      ]
        .map(([px, py], i) => `${i ? 'L' : 'M'} ${r1(x + d * px * s)} ${r1(y + py * s)}`)
        .join(' ') + ' Z',
      f,
    );
  return (
    wing(-1) +
    wing(1) +
    path(`M ${r1(x - 20 * s)} ${r1(y - 8 * s)} C ${r1(x - 30 * s)} ${r1(y - 52 * s)} ${r1(x - 16 * s)} ${r1(y - 88 * s)} ${r1(x + 4 * s)} ${r1(y - 94 * s)} C ${r1(x + 24 * s)} ${r1(y - 88 * s)} ${r1(x + 30 * s)} ${r1(y - 52 * s)} ${r1(x + 20 * s)} ${r1(y - 8 * s)} Z`, f) +
    path(`M ${r1(x - 12 * s)} ${r1(y - 14 * s)} L ${r1(x - 22 * s)} ${r1(y + 22 * s)} L ${r1(x + 22 * s)} ${r1(y + 22 * s)} L ${r1(x + 12 * s)} ${r1(y - 14 * s)} Z`, f) +
    circle(x + 10 * s, y - 102 * s, 14 * s, f) +
    path(`M ${r1(x + 20 * s)} ${r1(y - 110 * s)} Q ${r1(x + 40 * s)} ${r1(y - 108 * s)} ${r1(x + 36 * s)} ${r1(y - 90 * s)} L ${r1(x + 22 * s)} ${r1(y - 96 * s)} Z`, f) +
    seg(x - 8 * s, y - 10 * s, x - 10 * s, y, 5 * s, f) +
    seg(x + 8 * s, y - 10 * s, x + 10 * s, y, 5 * s, f)
  );
}

/** A hind (female deer) standing, facing right; `grazing` lowers the head. `s = 1` is ~124 tall. */
export function hind(x: number, y: number, s: number, fill: string, grazing = false): string {
  const f = ink(fill);
  const hx = grazing ? x + 62 * s : x + 60 * s;
  const hy = grazing ? y - 30 * s : y - 112 * s;
  const leg = (lx: number, back: number) => seg(lx, y - 56 * s, lx + back * s, y, 6 * s, f);
  return (
    leg(x - 28 * s, -6) +
    leg(x - 18 * s, 4) +
    leg(x + 22 * s, -4) +
    leg(x + 32 * s, 6) +
    ellipse(x, y - 64 * s, 44 * s, 17 * s, f) +
    seg(x + 30 * s, y - 70 * s, hx - 8 * s, hy + 8 * s, 13 * s, f) +
    rotate(grazing ? 60 : 24, hx, hy, ellipse(hx, hy, 16 * s, 8 * s, f)) +
    ellipse(hx - 8 * s, hy - 12 * s, 4 * s, 10 * s, f) +
    tri(x - 42 * s, y - 70 * s, x - 54 * s, y - 80 * s, x - 44 * s, y - 60 * s, f)
  );
}

/** A leopard stalking, head low, facing left; spots in a lighter colour. `s = 1` is ~200 long. */
export function leopard(rand: () => number, x: number, y: number, s: number, fill: string, spot: string): string {
  const f = ink(fill);
  const out = [
    stroke(`M ${r1(x + 58 * s)} ${r1(y - 46 * s)} Q ${r1(x + 112 * s)} ${r1(y - 40 * s)} ${r1(x + 112 * s)} ${r1(y - 80 * s)}`, f, 8 * s),
    seg(x - 40 * s, y - 40 * s, x - 52 * s, y, 9 * s, f),
    seg(x - 20 * s, y - 40 * s, x - 14 * s, y, 9 * s, f),
    seg(x + 34 * s, y - 40 * s, x + 26 * s, y, 9 * s, f),
    seg(x + 50 * s, y - 40 * s, x + 60 * s, y, 9 * s, f),
    ellipse(x, y - 48 * s, 64 * s, 20 * s, f),
    seg(x - 54 * s, y - 52 * s, x - 76 * s, y - 42 * s, 18 * s, f),
    ellipse(x - 86 * s, y - 40 * s, 17 * s, 13 * s, f),
    tri(x - 92 * s, y - 50 * s, x - 86 * s, y - 64 * s, x - 78 * s, y - 50 * s, f),
  ];
  for (let i = 0; i < 16; i += 1) {
    out.push(circle(x + (rand() - 0.5) * 100 * s, y - 48 * s + (rand() - 0.5) * 22 * s, (2.6 + rand() * 2) * s, spot, { opacity: 0.6 }));
  }
  return out.join('');
}
