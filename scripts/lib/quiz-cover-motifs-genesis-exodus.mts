/**
 * Motifs for the Genesis and Exodus covers that the shared primitives do not
 * have: altars, the ark of the covenant, the lampstand, Noah's ark, the
 * rainbow, Jacob's ladder, camels, sheep, the tabernacle and its furniture,
 * the priest's garments and the small things the patriarch stories turn on
 * (a coat, a jar, a pot of stew, a seal ring, a wagon, a sack of grain).
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, `y` is
 * the ground a motif stands on, `s = 1` is a sensible size next to a
 * `person(..., 1)`. People, animals and the heavy objects pass their fill
 * through `ink`, so a depth colour (`c.p.near`) becomes the dark silhouette.
 */

import { at, figure, flame as aFlame, kneeler, mix, sheep as aSheep, type Pose as AFigurePose } from './cover-options/shapes.mjs';
import { circle, ellipse, ink, path, rect, rotate, tri } from './quiz-cover-primitives.mjs';

type Opts = { opacity?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const wrap = (g: string, o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g);

/** A round-capped stroke between two points. */
export function stroke(x1: number, y1: number, x2: number, y2: number, w: number, fill: string, o?: Opts): string {
  return wrap(
    `<path d="M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round"/>`,
    o,
  );
}

/** A round-capped stroke along any path. */
export function curve(d: string, w: number, fill: string, o?: Opts): string {
  return wrap(`<path d="${d}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`, o);
}

/** Mirror a fragment about the vertical line through `x` (people and animals face the other way). */
export function flipX(x: number, inner: string): string {
  return `<g transform="translate(${r1(2 * x)} 0) scale(-1 1)">${inner}</g>`;
}

// ── people ─────────────────────────────────────────────────────────────────

/** The option-A robed figure with the poses `person` does not expose (staff, bless, shield). */
export function robed(x: number, y: number, s: number, fill: string, pose: AFigurePose = 'stand', staffFill?: string, o?: Opts): string {
  const f = ink(fill);
  return wrap(at(x, y, s * (134 / 204), figure(f, pose, { staffFill: staffFill ?? f })), o);
}

/** A figure holding a long staff up high in the right hand (Moses over the sea, on the hill). `both` raises the left arm too. */
export function staffRaised(x: number, y: number, s: number, fill: string, staffFill: string, both = false, o?: Opts): string {
  const f = ink(fill);
  const sleeve = (d: string) => `<path d="${d}" fill="none" stroke="${f}" stroke-width="17" stroke-linecap="round"/>`;
  const inner =
    figure(f, 'stand').replace(/<path d="M -22 -148[^"]*"[^>]*\/>/, '').replace(/<path d="M 22 -148[^"]*"[^>]*\/>/, '') +
    `<path d="M 30 -60 L 74 -340" fill="none" stroke="${staffFill}" stroke-width="9" stroke-linecap="round"/>` +
    sleeve('M 20 -150 C 34 -170 44 -196 52 -222') +
    `<circle cx="53" cy="-226" r="8" fill="${f}"/>` +
    (both
      ? sleeve('M -20 -150 C -34 -170 -42 -192 -48 -220') + `<circle cx="-49" cy="-224" r="7.5" fill="${f}"/>`
      : sleeve('M -22 -148 C -30 -122 -32 -104 -31 -90'));
  return wrap(at(x, y, s * (134 / 204), inner), o);
}

/** Two figures in an embrace: heads together, one arm across the other's back. */
export function embrace(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const k = s * (134 / 204);
  const inner =
    at(-30, 0, 1, figure(f, 'stand'), { rot: 6 }) +
    at(30, 0, 0.97, figure(f, 'stand'), { rot: -6 }) +
    `<path d="M -16 -150 C 10 -150 40 -146 58 -128" fill="none" stroke="${f}" stroke-width="17" stroke-linecap="round"/>` +
    `<path d="M 16 -146 C -8 -140 -36 -136 -54 -120" fill="none" stroke="${f}" stroke-width="17" stroke-linecap="round"/>`;
  return wrap(at(x, y, k, inner), o);
}

/** Two figures locked in a wrestle: leaning into each other, feet planted wide, arms gripping. */
export function wrestle(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const sleeve = (d: string) => `<path d="${d}" fill="none" stroke="${f}" stroke-width="17" stroke-linecap="round"/>`;
  // The left one (Jacob) leans in and holds on; the right one stands, a hand on his hip.
  const inner =
    at(-92, 0, 1, figure(f, 'walk'), { rot: 18 }) +
    at(70, 0, 1, figure(f, 'stand'), { rot: -5, flip: true }) +
    sleeve('M -40 -140 C -6 -150 30 -140 58 -118') +
    sleeve('M -46 -118 C -10 -116 24 -104 52 -92') +
    sleeve('M 52 -140 C 30 -110 -10 -84 -40 -74');
  return wrap(at(x, y, s * (134 / 204), inner), o);
}

/** Stars in one part of the sky only (the night half of a sky). */
export function starField(rand: () => number, x0: number, x1: number, y0: number, y1: number, n: number, fill: string): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(circle(x0 + rand() * (x1 - x0), y0 + rand() * (y1 - y0), 1.4 + rand() * 2.4, fill, { opacity: r1(0.4 + rand() * 0.55) }));
  }
  return out.join('');
}

/** Kneeling with the arms raised (the A kneeler's 'up' pose), facing right. */
export function kneelUp(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(at(x, y, s * 0.6, kneeler(ink(fill), 'up')), o);
}

/** A swaddled baby: a wrapped bundle with a round head. */
export function bundle(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(ellipse(x, y, 22 * s, 11 * s, fill) + circle(x + 22 * s, y - 4 * s, 9 * s, fill), o);
}

/** The high priest in his garments: robe, turban, and the breastplate with twelve stones in `plate`. */
export function priest(x: number, y: number, s: number, fill: string, plate: string, pose: AFigurePose = 'stand', o?: Opts): string {
  const f = ink(fill);
  const stones: string[] = [];
  for (let r = 0; r < 4; r += 1) {
    for (let col = 0; col < 3; col += 1) stones.push(`<circle cx="${-12 + col * 12}" cy="${-128 + r * 11}" r="4.2" fill="#FFFFFF" opacity="0.55"/>`);
  }
  const inner =
    figure(f, pose) +
    // turban, a little taller than the hood
    `<ellipse cx="0" cy="-206" rx="21" ry="12" fill="${f}"/>` +
    `<rect x="-12" y="-214" width="24" height="7" rx="3" fill="${plate}"/>` +
    // ephod band and the breastplate
    `<rect x="-30" y="-92" width="60" height="9" rx="3" fill="${plate}" opacity="0.8"/>` +
    `<rect x="-21" y="-140" width="42" height="50" rx="5" fill="${plate}"/>` +
    stones.join('') +
    // bells and pomegranates along the hem
    [-34, -20, -6, 8, 22, 36].map((bx, i) => `<circle cx="${bx}" cy="-4" r="${i % 2 ? 4.5 : 5.5}" fill="${plate}"/>`).join('');
  return wrap(at(x, y, s * (134 / 204), inner), o);
}

/** A face shining after the mountain: short rays around a point (drawn behind the head). */
export function radiance(x: number, y: number, r: number, fill: string, n = 12, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    out.push(stroke(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(3, r * 0.07), fill));
  }
  return wrap(out.join(''), o ?? { opacity: 0.8 });
}

// ── animals ────────────────────────────────────────────────────────────────

/** A sheep (option-A shape) facing right; `flip` faces it left. Light body, dark head reads best. */
export function sheep(x: number, y: number, s: number, body: string, head: string, flip = false, o?: Opts): string {
  return wrap(at(x, y, s, aSheep(body, ink(head)), { flip }), o);
}

/** A speckled sheep - Jacob's wages. */
export function spottedSheep(x: number, y: number, s: number, body: string, spots: string, flip = false, o?: Opts): string {
  const k = flip ? -1 : 1;
  const dots = [
    [-14, -46, 6],
    [6, -54, 5],
    [12, -34, 6.5],
    [-24, -32, 4.5],
    [-2, -36, 4],
  ]
    .map(([dx, dy, r]) => circle(x + k * dx * s, y + dy * s, r * s, ink(spots)))
    .join('');
  return wrap(sheep(x, y, s, body, spots, flip) + dots, o);
}

/** A camel walking, head to the left; `flip` sends it right. */
export function camel(x: number, y: number, s: number, fill: string, flip = false, o?: Opts): string {
  const f = ink(fill);
  const g =
    ellipse(x, y - 62 * s, 54 * s, 24 * s, f) +
    circle(x - 16 * s, y - 86 * s, 22 * s, f) +
    circle(x + 22 * s, y - 84 * s, 20 * s, f) +
    rect(x - 44 * s, y - 62 * s, 9 * s, 62 * s, f, { rx: 4 * s }) +
    rect(x - 24 * s, y - 62 * s, 9 * s, 62 * s, f, { rx: 4 * s }) +
    rect(x + 12 * s, y - 62 * s, 9 * s, 62 * s, f, { rx: 4 * s }) +
    rect(x + 34 * s, y - 62 * s, 9 * s, 62 * s, f, { rx: 4 * s }) +
    path(`M ${r1(x - 40 * s)} ${r1(y - 76 * s)} L ${r1(x - 54 * s)} ${r1(y - 66 * s)} L ${r1(x - 84 * s)} ${r1(y - 124 * s)} L ${r1(x - 70 * s)} ${r1(y - 130 * s)} Z`, f) +
    ellipse(x - 84 * s, y - 130 * s, 17 * s, 9 * s, f) +
    tri(x - 76 * s, y - 136 * s, x - 70 * s, y - 148 * s, x - 66 * s, y - 134 * s, f) +
    curve(`M ${r1(x + 50 * s)} ${r1(y - 66 * s)} q ${r1(16 * s)} ${r1(10 * s)} ${r1(8 * s)} ${r1(34 * s)}`, 4 * s, f);
  return wrap(flip ? flipX(x, g) : g, o);
}

/** A camel couched on the ground (legs folded), head up, facing left. */
export function camelResting(x: number, y: number, s: number, fill: string, flip = false, o?: Opts): string {
  const f = ink(fill);
  const g =
    path(`M ${r1(x - 60 * s)} ${r1(y)} C ${r1(x - 64 * s)} ${r1(y - 40 * s)} ${r1(x - 30 * s)} ${r1(y - 52 * s)} ${r1(x)} ${r1(y - 52 * s)} C ${r1(x + 40 * s)} ${r1(y - 52 * s)} ${r1(x + 66 * s)} ${r1(y - 34 * s)} ${r1(x + 62 * s)} ${r1(y)} Z`, f) +
    circle(x - 6 * s, y - 62 * s, 20 * s, f) +
    path(`M ${r1(x - 44 * s)} ${r1(y - 30 * s)} L ${r1(x - 58 * s)} ${r1(y - 20 * s)} L ${r1(x - 92 * s)} ${r1(y - 84 * s)} L ${r1(x - 76 * s)} ${r1(y - 90 * s)} Z`, f) +
    ellipse(x - 92 * s, y - 90 * s, 16 * s, 8 * s, f) +
    tri(x - 84 * s, y - 96 * s, x - 78 * s, y - 106 * s, x - 74 * s, y - 94 * s, f);
  return wrap(flip ? flipX(x, g) : g, o);
}

/** A cow facing left; `lean` draws one of Pharaoh's thin cows (narrow body, bony legs). */
export function cow(x: number, y: number, s: number, fill: string, lean = false, flip = false, o?: Opts): string {
  const f = ink(fill);
  const ry = lean ? 11 : 24;
  const by = y - (lean ? 52 : 44) * s;
  const lw = lean ? 4.5 : 8;
  const legTop = by + ry * 0.4 * s;
  const leg = (lx: number) => rect(x + lx * s, legTop, lw * s, y - legTop, f, { rx: 2 * s });
  const g =
    ellipse(x, by, 50 * s, ry * s, f) +
    leg(-38) +
    leg(-24) +
    leg(22) +
    leg(34) +
    path(`M ${r1(x - 40 * s)} ${r1(by - ry * 0.5 * s)} L ${r1(x - 66 * s)} ${r1(by - 18 * s)} L ${r1(x - 70 * s)} ${r1(by + 6 * s)} L ${r1(x - 40 * s)} ${r1(by + ry * 0.6 * s)} Z`, f) +
    ellipse(x - 74 * s, by - 6 * s, 12 * s, 14 * s, f) +
    curve(`M ${r1(x - 80 * s)} ${r1(by - 18 * s)} q ${r1(-8 * s)} ${r1(-8 * s)} ${r1(-4 * s)} ${r1(-16 * s)}`, 4 * s, f) +
    curve(`M ${r1(x - 68 * s)} ${r1(by - 18 * s)} q ${r1(8 * s)} ${r1(-8 * s)} ${r1(4 * s)} ${r1(-16 * s)}`, 4 * s, f) +
    curve(`M ${r1(x + 48 * s)} ${r1(by - 6 * s)} q ${r1(10 * s)} ${r1(14 * s)} ${r1(4 * s)} ${r1(36 * s)}`, 3.5 * s, f);
  return wrap(flip ? flipX(x, g) : g, o);
}

/** A young bull on a pedestal - the golden calf. `y` is the ground under the pedestal. */
export function goldenCalf(x: number, y: number, s: number, fill: string, plinth: string, o?: Opts): string {
  const top = y - 40 * s;
  const g =
    rect(x - 86 * s, y - 20 * s, 172 * s, 20 * s, plinth) +
    rect(x - 72 * s, top, 144 * s, 22 * s, plinth) +
    ellipse(x + 4 * s, top - 62 * s, 60 * s, 27 * s, fill) +
    rect(x - 38 * s, top - 58 * s, 11 * s, 58 * s, fill, { rx: 4 * s }) +
    rect(x - 18 * s, top - 58 * s, 11 * s, 58 * s, fill, { rx: 4 * s }) +
    rect(x + 22 * s, top - 58 * s, 11 * s, 58 * s, fill, { rx: 4 * s }) +
    rect(x + 42 * s, top - 58 * s, 11 * s, 58 * s, fill, { rx: 4 * s }) +
    path(`M ${r1(x - 40 * s)} ${r1(top - 78 * s)} L ${r1(x - 64 * s)} ${r1(top - 108 * s)} L ${r1(x - 84 * s)} ${r1(top - 96 * s)} L ${r1(x - 52 * s)} ${r1(top - 50 * s)} Z`, fill) +
    ellipse(x - 80 * s, top - 106 * s, 18 * s, 14 * s, fill) +
    curve(`M ${r1(x - 88 * s)} ${r1(top - 116 * s)} q ${r1(-12 * s)} ${r1(-6 * s)} ${r1(-8 * s)} ${r1(-22 * s)}`, 6 * s, fill) +
    curve(`M ${r1(x - 72 * s)} ${r1(top - 118 * s)} q ${r1(12 * s)} ${r1(-6 * s)} ${r1(8 * s)} ${r1(-22 * s)}`, 6 * s, fill) +
    curve(`M ${r1(x + 62 * s)} ${r1(top - 68 * s)} q ${r1(14 * s)} ${r1(18 * s)} ${r1(6 * s)} ${r1(48 * s)}`, 5 * s, fill);
  return wrap(g, o);
}

// ── things people hold or set down ─────────────────────────────────────────

/** A clay jar with two handles. */
export function jar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 10 * s)} ${r1(y)} C ${r1(x - 40 * s)} ${r1(y - 8 * s)} ${r1(x - 40 * s)} ${r1(y - 60 * s)} ${r1(x - 14 * s)} ${r1(y - 72 * s)} L ${r1(x - 12 * s)} ${r1(y - 86 * s)} L ${r1(x + 12 * s)} ${r1(y - 86 * s)} L ${r1(x + 14 * s)} ${r1(y - 72 * s)} C ${r1(x + 40 * s)} ${r1(y - 60 * s)} ${r1(x + 40 * s)} ${r1(y - 8 * s)} ${r1(x + 10 * s)} ${r1(y)} Z`, fill) +
    rect(x - 17 * s, y - 92 * s, 34 * s, 8 * s, fill, { rx: 3 * s }) +
    curve(`M ${r1(x - 14 * s)} ${r1(y - 78 * s)} C ${r1(x - 34 * s)} ${r1(y - 80 * s)} ${r1(x - 36 * s)} ${r1(y - 60 * s)} ${r1(x - 28 * s)} ${r1(y - 52 * s)}`, 5 * s, fill) +
    curve(`M ${r1(x + 14 * s)} ${r1(y - 78 * s)} C ${r1(x + 34 * s)} ${r1(y - 80 * s)} ${r1(x + 36 * s)} ${r1(y - 60 * s)} ${r1(x + 28 * s)} ${r1(y - 52 * s)}`, 5 * s, fill);
  return wrap(g, o);
}

/** A round cooking pot on three hearth stones - the red stew. */
export function pot(x: number, y: number, s: number, fill: string, stones: string, o?: Opts): string {
  const g =
    ellipse(x - 34 * s, y - 8 * s, 14 * s, 9 * s, stones) +
    ellipse(x + 34 * s, y - 8 * s, 14 * s, 9 * s, stones) +
    path(`M ${r1(x - 44 * s)} ${r1(y - 62 * s)} C ${r1(x - 48 * s)} ${r1(y - 18 * s)} ${r1(x - 20 * s)} ${r1(y - 10 * s)} ${r1(x)} ${r1(y - 10 * s)} C ${r1(x + 20 * s)} ${r1(y - 10 * s)} ${r1(x + 48 * s)} ${r1(y - 18 * s)} ${r1(x + 44 * s)} ${r1(y - 62 * s)} Z`, fill) +
    rect(x - 50 * s, y - 70 * s, 100 * s, 10 * s, fill, { rx: 4 * s }) +
    ellipse(x, y - 70 * s, 42 * s, 6 * s, mix(fill, '#FFFFFF', 0.25));
  return wrap(g, o);
}

/** A hunting bow, string on the left, belly to the right; drawn upright, rotate as needed. */
export function bow(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  return wrap(
    curve(`M ${r1(x)} ${r1(y - 60 * s)} Q ${r1(x + 44 * s)} ${r1(y)} ${r1(x)} ${r1(y + 60 * s)}`, 6 * s, f) +
      stroke(x, y - 60 * s, x, y + 60 * s, 1.8 * s, f),
    o,
  );
}

/** A long-sleeved tunic laid out flat, with bands across it - Joseph's coat. `y` is its hem. */
export function coat(x: number, y: number, s: number, fill: string, bands: string, o?: Opts): string {
  const g =
    path(
      `M ${r1(x - 46 * s)} ${r1(y)} L ${r1(x - 38 * s)} ${r1(y - 112 * s)} L ${r1(x - 96 * s)} ${r1(y - 70 * s)} L ${r1(x - 110 * s)} ${r1(y - 88 * s)} ` +
        `L ${r1(x - 44 * s)} ${r1(y - 150 * s)} L ${r1(x - 14 * s)} ${r1(y - 156 * s)} Q ${r1(x)} ${r1(y - 140 * s)} ${r1(x + 14 * s)} ${r1(y - 156 * s)} ` +
        `L ${r1(x + 44 * s)} ${r1(y - 150 * s)} L ${r1(x + 110 * s)} ${r1(y - 88 * s)} L ${r1(x + 96 * s)} ${r1(y - 70 * s)} L ${r1(x + 38 * s)} ${r1(y - 112 * s)} L ${r1(x + 46 * s)} ${r1(y)} Z`,
      fill,
    ) +
    [0.18, 0.4, 0.62].map((t) => rect(x - 44 * s, y - (150 * t + 8) * s, 88 * s, 10 * s, bands, { opacity: 0.85 })).join('') +
    rotate(-38, x - 70 * s, y - 112 * s, rect(x - 80 * s, y - 116 * s, 30 * s, 8 * s, bands, { opacity: 0.85 })) +
    rotate(38, x + 70 * s, y - 112 * s, rect(x + 50 * s, y - 116 * s, 30 * s, 8 * s, bands, { opacity: 0.85 }));
  return wrap(g, o);
}

/** A mantle hanging from one point, folds falling to a ragged hem - a garment left behind or handed over. */
export function cloak(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(
      `M ${r1(x - 10 * s)} ${r1(y - 110 * s)} C ${r1(x - 30 * s)} ${r1(y - 80 * s)} ${r1(x - 50 * s)} ${r1(y - 30 * s)} ${r1(x - 52 * s)} ${r1(y)} ` +
        `L ${r1(x - 30 * s)} ${r1(y - 10 * s)} L ${r1(x - 12 * s)} ${r1(y + 4 * s)} L ${r1(x + 8 * s)} ${r1(y - 8 * s)} L ${r1(x + 28 * s)} ${r1(y + 2 * s)} L ${r1(x + 48 * s)} ${r1(y - 6 * s)} ` +
        `C ${r1(x + 40 * s)} ${r1(y - 40 * s)} ${r1(x + 20 * s)} ${r1(y - 84 * s)} ${r1(x + 10 * s)} ${r1(y - 110 * s)} Z`,
      fill,
    ) +
    curve(`M ${r1(x - 4 * s)} ${r1(y - 96 * s)} C ${r1(x - 14 * s)} ${r1(y - 60 * s)} ${r1(x - 16 * s)} ${r1(y - 30 * s)} ${r1(x - 12 * s)} ${r1(y - 6 * s)}`, 3 * s, '#FFFFFF', { opacity: 0.3 }) +
    curve(`M ${r1(x + 4 * s)} ${r1(y - 96 * s)} C ${r1(x + 14 * s)} ${r1(y - 60 * s)} ${r1(x + 22 * s)} ${r1(y - 30 * s)} ${r1(x + 26 * s)} ${r1(y - 8 * s)}`, 3 * s, '#FFFFFF', { opacity: 0.3 });
  return wrap(g, o);
}

/** A grain sack, tied at the neck. */
export function sack(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 30 * s)} ${r1(y)} C ${r1(x - 42 * s)} ${r1(y - 40 * s)} ${r1(x - 28 * s)} ${r1(y - 62 * s)} ${r1(x - 10 * s)} ${r1(y - 66 * s)} L ${r1(x + 10 * s)} ${r1(y - 66 * s)} C ${r1(x + 28 * s)} ${r1(y - 62 * s)} ${r1(x + 42 * s)} ${r1(y - 40 * s)} ${r1(x + 30 * s)} ${r1(y)} Z`, fill) +
    path(`M ${r1(x - 10 * s)} ${r1(y - 66 * s)} L ${r1(x - 18 * s)} ${r1(y - 84 * s)} L ${r1(x + 18 * s)} ${r1(y - 84 * s)} L ${r1(x + 10 * s)} ${r1(y - 66 * s)} Z`, fill) +
    rect(x - 13 * s, y - 72 * s, 26 * s, 6 * s, mix(fill, '#000000', 0.25), { rx: 3 * s });
  return wrap(g, o);
}

/** A water skin, bulging, with its neck tied. */
export function waterSkin(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 34 * s)} ${r1(y - 4 * s)} C ${r1(x - 44 * s)} ${r1(y - 40 * s)} ${r1(x - 10 * s)} ${r1(y - 52 * s)} ${r1(x + 18 * s)} ${r1(y - 44 * s)} L ${r1(x + 34 * s)} ${r1(y - 60 * s)} L ${r1(x + 42 * s)} ${r1(y - 52 * s)} L ${r1(x + 30 * s)} ${r1(y - 34 * s)} C ${r1(x + 40 * s)} ${r1(y - 10 * s)} ${r1(x + 10 * s)} ${r1(y + 4 * s)} ${r1(x - 34 * s)} ${r1(y - 4 * s)} Z`, fill);
  return wrap(g, o);
}

/** A peeled rod: a straight stick with pale bands where the bark is stripped. */
export function peeledRod(x: number, y: number, h: number, s: number, fill: string, peel: string, lean = 0, o?: Opts): string {
  const out = [rect(x - 4 * s, y - h, 8 * s, h, fill, { rx: 3 * s })];
  for (let yy = y - h + 10 * s; yy < y - 12 * s; yy += 22 * s) out.push(rect(x - 4.5 * s, yy, 9 * s, 9 * s, peel, { rx: 2 * s }));
  return wrap(lean ? rotate(lean, x, y, out.join('')) : out.join(''), o);
}

/** A double-edged sword, point up. Rotate as needed. */
export function sword(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x)} ${r1(y - 140 * s)} L ${r1(x + 9 * s)} ${r1(y - 120 * s)} L ${r1(x + 8 * s)} ${r1(y - 36 * s)} L ${r1(x - 8 * s)} ${r1(y - 36 * s)} L ${r1(x - 9 * s)} ${r1(y - 120 * s)} Z`, fill) +
    rect(x - 26 * s, y - 38 * s, 52 * s, 9 * s, fill, { rx: 3 * s }) +
    rect(x - 5 * s, y - 30 * s, 10 * s, 24 * s, fill) +
    circle(x, y - 4 * s, 7 * s, fill);
  return wrap(g, o);
}

/** A spear, point up. */
export function spear(x: number, y: number, h: number, s: number, fill: string, o?: Opts): string {
  return wrap(stroke(x, y, x, y - h, 4 * s, fill) + path(`M ${r1(x)} ${r1(y - h - 26 * s)} L ${r1(x + 7 * s)} ${r1(y - h + 2 * s)} L ${r1(x - 7 * s)} ${r1(y - h + 2 * s)} Z`, fill), o);
}

/** A ram's horn trumpet: a tapering curve, narrow mouthpiece at (x, y), bell up and to the right. */
export function shofar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = path(
    `M ${r1(x)} ${r1(y)} C ${r1(x + 40 * s)} ${r1(y + 6 * s)} ${r1(x + 96 * s)} ${r1(y - 8 * s)} ${r1(x + 122 * s)} ${r1(y - 70 * s)} ` +
      `L ${r1(x + 150 * s)} ${r1(y - 58 * s)} C ${r1(x + 126 * s)} ${r1(y + 18 * s)} ${r1(x + 50 * s)} ${r1(y + 26 * s)} ${r1(x - 2 * s)} ${r1(y + 10 * s)} Z`,
    fill,
  ) + ellipse(x + 136 * s, y - 64 * s, 16 * s, 8 * s, fill);
  return wrap(g, o);
}

/** A hand drum with jingles, tilted. */
export function tambourine(x: number, y: number, s: number, fill: string, skin: string, o?: Opts): string {
  const out = [
    `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(34 * s)}" ry="${r1(30 * s)}" fill="${skin}"/>`,
    `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(34 * s)}" ry="${r1(30 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(9 * s)}"/>`,
  ];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * 2 * i) / 6 + 0.3;
    out.push(circle(x + Math.cos(a) * 34 * s, y + Math.sin(a) * 30 * s, 6.5 * s, fill));
  }
  return wrap(out.join(''), o);
}

/** A ram's horn of oil, tipped to pour: `x, y` is the tip; the stream is drawn by the caller. */
export function oilHorn(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    path(`M ${r1(x)} ${r1(y)} C ${r1(x + 10 * s)} ${r1(y - 30 * s)} ${r1(x + 40 * s)} ${r1(y - 52 * s)} ${r1(x + 84 * s)} ${r1(y - 46 * s)} L ${r1(x + 84 * s)} ${r1(y - 22 * s)} C ${r1(x + 50 * s)} ${r1(y - 26 * s)} ${r1(x + 22 * s)} ${r1(y - 12 * s)} ${r1(x + 8 * s)} ${r1(y + 4 * s)} Z`, fill) +
      ellipse(x + 84 * s, y - 34 * s, 7 * s, 12 * s, fill),
    o,
  );
}

/** A balance with two pans: the judge's scales. */
export function scales(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const pan = (px: number) =>
    stroke(px, y - 128 * s, px - 22 * s, y - 70 * s, 2 * s, fill) +
    stroke(px, y - 128 * s, px + 22 * s, y - 70 * s, 2 * s, fill) +
    path(`M ${r1(px - 30 * s)} ${r1(y - 72 * s)} Q ${r1(px)} ${r1(y - 46 * s)} ${r1(px + 30 * s)} ${r1(y - 72 * s)} Z`, fill);
  return wrap(
    rect(x - 26 * s, y - 10 * s, 52 * s, 10 * s, fill, { rx: 3 * s }) +
      rect(x - 4 * s, y - 150 * s, 8 * s, 142 * s, fill) +
      circle(x, y - 152 * s, 8 * s, fill) +
      rect(x - 76 * s, y - 136 * s, 152 * s, 7 * s, fill, { rx: 3 * s }) +
      pan(x - 70 * s) +
      pan(x + 70 * s),
    o,
  );
}

/** A signet ring on a cord - Judah's pledge. */
export function signet(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    curve(`M ${r1(x - 70 * s)} ${r1(y - 70 * s)} C ${r1(x - 40 * s)} ${r1(y - 10 * s)} ${r1(x - 10 * s)} ${r1(y - 40 * s)} ${r1(x)} ${r1(y - 26 * s)}`, 4 * s, fill) +
      `<circle cx="${r1(x + 4 * s)}" cy="${r1(y - 14 * s)}" r="${r1(12 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(6 * s)}"/>` +
      ellipse(x + 4 * s, y - 30 * s, 9 * s, 6 * s, fill),
    o,
  );
}

/** A jagged bolt from a point downward. */
export function lightning(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    path(
      `M ${r1(x)} ${r1(y)} L ${r1(x - 26 * s)} ${r1(y + 80 * s)} L ${r1(x - 4 * s)} ${r1(y + 74 * s)} L ${r1(x - 34 * s)} ${r1(y + 170 * s)}` +
        ` L ${r1(x + 24 * s)} ${r1(y + 66 * s)} L ${r1(x + 2 * s)} ${r1(y + 72 * s)} L ${r1(x + 22 * s)} ${r1(y)} Z`,
      fill,
    ),
    o,
  );
}

/** A torch: a short stick with a flame on top; `y` is the flame base. */
export function torch(x: number, y: number, s: number, stick: string, fire: string, o?: Opts): string {
  return wrap(rect(x - 3 * s, y, 6 * s, 70 * s, stick) + at(x, y + 4 * s, s * 0.5, aFlame(110, 52, fire)), o);
}

// ── furniture and buildings ────────────────────────────────────────────────

/** An altar of rough field stones with a flat top stone. */
export function altar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const joint = mix(f, '#FFFFFF', 0.28);
  const g =
    path(`M ${r1(x - 58 * s)} ${r1(y)} L ${r1(x - 50 * s)} ${r1(y - 56 * s)} L ${r1(x + 50 * s)} ${r1(y - 56 * s)} L ${r1(x + 58 * s)} ${r1(y)} Z`, f) +
    rect(x - 62 * s, y - 70 * s, 124 * s, 16 * s, f, { rx: 5 * s }) +
    stroke(x - 54 * s, y - 28 * s, x + 54 * s, y - 28 * s, 2.4 * s, joint) +
    stroke(x - 20 * s, y - 54 * s, x - 22 * s, y - 28 * s, 2.4 * s, joint) +
    stroke(x + 24 * s, y - 54 * s, x + 22 * s, y - 28 * s, 2.4 * s, joint) +
    stroke(x, y - 28 * s, x + 2 * s, y, 2.4 * s, joint) +
    stroke(x - 38 * s, y - 28 * s, x - 40 * s, y, 2.4 * s, joint) +
    stroke(x + 40 * s, y - 28 * s, x + 42 * s, y, 2.4 * s, joint);
  return wrap(g, o);
}

/** The tabernacle's bronze altar: a square box with a horn at each corner and the grating band. */
export function hornedAltar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const horn = (hx: number, dir: number) => path(`M ${r1(hx - 10 * s)} ${r1(y - 98 * s)} L ${r1(hx + dir * 4 * s)} ${r1(y - 124 * s)} L ${r1(hx + 10 * s)} ${r1(y - 98 * s)} Z`, f);
  const g =
    rect(x - 70 * s, y - 12 * s, 140 * s, 12 * s, f, { rx: 3 * s }) +
    rect(x - 60 * s, y - 100 * s, 120 * s, 90 * s, f) +
    rect(x - 66 * s, y - 104 * s, 132 * s, 10 * s, f, { rx: 3 * s }) +
    horn(x - 58 * s, -1) +
    horn(x + 58 * s, 1) +
    rect(x - 60 * s, y - 62 * s, 120 * s, 14 * s, mix(f, '#FFFFFF', 0.25)) +
    [-40, -20, 0, 20, 40].map((dx) => rect(x + dx * s - 2 * s, y - 62 * s, 4 * s, 14 * s, f)).join('') +
    rect(x - 92 * s, y - 56 * s, 184 * s, 6 * s, f, { rx: 3 * s });
  return wrap(g, o);
}

/** The golden incense altar: tall and narrow, a crown moulding and four horns. */
export function incenseAltar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const horn = (hx: number, dir: number) => path(`M ${r1(hx - 7 * s)} ${r1(y - 124 * s)} L ${r1(hx + dir * 3 * s)} ${r1(y - 144 * s)} L ${r1(hx + 7 * s)} ${r1(y - 124 * s)} Z`, fill);
  const g =
    rect(x - 40 * s, y - 12 * s, 80 * s, 12 * s, fill, { rx: 3 * s }) +
    rect(x - 32 * s, y - 120 * s, 64 * s, 110 * s, fill) +
    rect(x - 40 * s, y - 128 * s, 80 * s, 12 * s, fill, { rx: 3 * s }) +
    horn(x - 33 * s, -1) +
    horn(x + 33 * s, 1) +
    rect(x - 32 * s, y - 104 * s, 64 * s, 6 * s, mix(fill, '#FFFFFF', 0.35)) +
    rect(x - 32 * s, y - 34 * s, 64 * s, 6 * s, mix(fill, '#FFFFFF', 0.35));
  return wrap(g, o);
}

/** The ark of the covenant: the chest on its poles and two cherubim facing each other over the mercy seat. */
export function arkOfCovenant(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const shade = mix(fill, '#000000', 0.18);
  const cherub = (dir: number) => {
    const cx = x + dir * 52 * s;
    return (
      // kneeling body
      path(`M ${r1(cx - 14 * s)} ${r1(y - 84 * s)} C ${r1(cx - 16 * s)} ${r1(y - 110 * s)} ${r1(cx + dir * 4 * s)} ${r1(y - 124 * s)} ${r1(cx + dir * 12 * s)} ${r1(y - 112 * s)} L ${r1(cx + 14 * s)} ${r1(y - 84 * s)} Z`, fill) +
      circle(cx + dir * 4 * s, y - 128 * s, 9 * s, fill) +
      // wing sweeping up and in, tips nearly meeting over the middle
      path(
        `M ${r1(cx - dir * 6 * s)} ${r1(y - 112 * s)} C ${r1(cx - dir * 20 * s)} ${r1(y - 150 * s)} ${r1(x + dir * 20 * s)} ${r1(y - 176 * s)} ${r1(x + dir * 6 * s)} ${r1(y - 168 * s)} ` +
          `C ${r1(x + dir * 22 * s)} ${r1(y - 150 * s)} ${r1(cx - dir * 4 * s)} ${r1(y - 124 * s)} ${r1(cx + dir * 8 * s)} ${r1(y - 104 * s)} Z`,
        fill,
      )
    );
  };
  const g =
    rect(x - 66 * s, y - 14 * s, 12 * s, 14 * s, fill) +
    rect(x + 54 * s, y - 14 * s, 12 * s, 14 * s, fill) +
    rect(x - 72 * s, y - 74 * s, 144 * s, 62 * s, fill, { rx: 3 * s }) +
    rect(x - 72 * s, y - 64 * s, 144 * s, 6 * s, shade) +
    rect(x - 72 * s, y - 26 * s, 144 * s, 6 * s, shade) +
    rect(x - 78 * s, y - 84 * s, 156 * s, 12 * s, fill, { rx: 3 * s }) +
    rect(x - 128 * s, y - 44 * s, 256 * s, 8 * s, shade, { rx: 4 * s }) +
    cherub(-1) +
    cherub(1);
  return wrap(g, o);
}

/** The seven-branched lampstand. `flameFill` lights the seven lamps. */
export function menorah(x: number, y: number, s: number, fill: string, flameFill?: string, o?: Opts): string {
  const top = y - 176 * s;
  const out = [
    path(`M ${r1(x - 44 * s)} ${r1(y)} L ${r1(x - 10 * s)} ${r1(y - 24 * s)} L ${r1(x + 10 * s)} ${r1(y - 24 * s)} L ${r1(x + 44 * s)} ${r1(y)} Z`, fill),
    rect(x - 6 * s, top, 12 * s, 176 * s - 20 * s, fill),
  ];
  for (const r of [30, 58, 86]) {
    out.push(curve(`M ${r1(x - r * s)} ${r1(top)} A ${r1(r * s)} ${r1(r * s)} 0 0 0 ${r1(x + r * s)} ${r1(top)}`, 9 * s, fill));
  }
  for (const dx of [-86, -58, -30, 0, 30, 58, 86]) {
    out.push(path(`M ${r1(x + dx * s - 10 * s)} ${r1(top - 10 * s)} L ${r1(x + dx * s + 10 * s)} ${r1(top - 10 * s)} L ${r1(x + dx * s + 5 * s)} ${r1(top + 4 * s)} L ${r1(x + dx * s - 5 * s)} ${r1(top + 4 * s)} Z`, fill));
    if (flameFill) out.push(at(x + dx * s, top - 10 * s, s * 0.22, aFlame(110, 52, flameFill)));
  }
  return wrap(out.join(''), o);
}

/** The bronze laver: a round basin on a footed stand. */
export function laver(x: number, y: number, s: number, fill: string, waterFill: string, o?: Opts): string {
  const g =
    ellipse(x, y - 4 * s, 40 * s, 8 * s, fill) +
    path(`M ${r1(x - 30 * s)} ${r1(y - 4 * s)} L ${r1(x - 10 * s)} ${r1(y - 44 * s)} L ${r1(x + 10 * s)} ${r1(y - 44 * s)} L ${r1(x + 30 * s)} ${r1(y - 4 * s)} Z`, fill) +
    rect(x - 9 * s, y - 70 * s, 18 * s, 30 * s, fill) +
    path(`M ${r1(x - 70 * s)} ${r1(y - 100 * s)} C ${r1(x - 66 * s)} ${r1(y - 66 * s)} ${r1(x - 30 * s)} ${r1(y - 62 * s)} ${r1(x)} ${r1(y - 62 * s)} C ${r1(x + 30 * s)} ${r1(y - 62 * s)} ${r1(x + 66 * s)} ${r1(y - 66 * s)} ${r1(x + 70 * s)} ${r1(y - 100 * s)} Z`, fill) +
    ellipse(x, y - 100 * s, 70 * s, 10 * s, waterFill);
  return wrap(g, o);
}

/** A table with loaves stacked on it - the table of showbread. */
export function showbreadTable(x: number, y: number, s: number, fill: string, bread: string, o?: Opts): string {
  const loaves: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    loaves.push(ellipse(x - 34 * s, y - 72 * s - i * 9 * s, 22 * s, 6 * s, bread), ellipse(x + 34 * s, y - 72 * s - i * 9 * s, 22 * s, 6 * s, bread));
  }
  return wrap(
    rect(x - 70 * s, y - 70 * s, 140 * s, 12 * s, fill, { rx: 3 * s }) +
      rect(x - 62 * s, y - 60 * s, 10 * s, 60 * s, fill) +
      rect(x + 52 * s, y - 60 * s, 10 * s, 60 * s, fill) +
      rect(x - 62 * s, y - 34 * s, 124 * s, 6 * s, fill) +
      loaves.join(''),
    o,
  );
}

/**
 * The tabernacle seen from the side: the gilded boards, the draped coverings
 * over them and the screen at the door. `boards` and `cover` are separate so
 * either can be the accent.
 */
export function tabernacle(x: number, y: number, s: number, boards: string, cover: string, door: string, o?: Opts): string {
  const w = 300 * s;
  const h = 110 * s;
  const out: string[] = [rect(x - w / 2, y - h, w, h, boards)];
  for (let bx = x - w / 2 + 20 * s; bx < x + w / 2 - 4 * s; bx += 20 * s) out.push(rect(bx - 1.5 * s, y - h, 3 * s, h, '#FFFFFF', { opacity: 0.22 }));
  // coverings: a low ridge, with a scalloped hem hanging over the boards
  let hem = `M ${r1(x - w / 2 - 16 * s)} ${r1(y - h + 30 * s)}`;
  const n = 10;
  for (let i = 0; i < n; i += 1) {
    const x0 = x - w / 2 - 16 * s + ((w + 32 * s) * i) / n;
    const x1 = x - w / 2 - 16 * s + ((w + 32 * s) * (i + 1)) / n;
    hem += ` Q ${r1((x0 + x1) / 2)} ${r1(y - h + 44 * s)} ${r1(x1)} ${r1(y - h + 30 * s)}`;
  }
  out.push(
    path(`${hem} L ${r1(x + w / 2 + 8 * s)} ${r1(y - h - 18 * s)} Q ${r1(x)} ${r1(y - h - 40 * s)} ${r1(x - w / 2 - 8 * s)} ${r1(y - h - 18 * s)} Z`, cover),
    // the door screen on the near end, between five pillars
    rect(x + w / 2 - 6 * s, y - h + 20 * s, 44 * s, h - 20 * s, door),
  );
  for (let i = 0; i < 3; i += 1) out.push(rect(x + w / 2 - 4 * s + i * 18 * s, y - h + 20 * s, 5 * s, h - 20 * s, boards));
  return wrap(out.join(''), o);
}

/** The court's linen hangings: a row of posts with white cloth between them. */
export function courtFence(x0: number, x1: number, y: number, h: number, post: string, cloth: string, o?: Opts): string {
  const out = [rect(x0, y - h, x1 - x0, h, cloth, { opacity: 0.9 })];
  for (let x = x0; x <= x1 + 1; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 46))) {
    out.push(rect(x - 3.5, y - h - 8, 7, h + 8, post), circle(x, y - h - 10, 5, post));
  }
  return wrap(out.join(''), o);
}

/** Noah's ark: a long hull with a roofed house on it, a door and a window. */
export function noahArk(x: number, y: number, s: number, hull: string, house: string, door?: string, o?: Opts): string {
  const h = ink(hull);
  const out = [
    path(`M ${r1(x - 170 * s)} ${r1(y - 66 * s)} L ${r1(x + 170 * s)} ${r1(y - 66 * s)} C ${r1(x + 156 * s)} ${r1(y - 14 * s)} ${r1(x + 120 * s)} ${r1(y)} ${r1(x + 80 * s)} ${r1(y)} L ${r1(x - 80 * s)} ${r1(y)} C ${r1(x - 120 * s)} ${r1(y)} ${r1(x - 156 * s)} ${r1(y - 14 * s)} ${r1(x - 170 * s)} ${r1(y - 66 * s)} Z`, h),
    rect(x - 104 * s, y - 124 * s, 208 * s, 60 * s, house),
    path(`M ${r1(x - 122 * s)} ${r1(y - 122 * s)} L ${r1(x)} ${r1(y - 164 * s)} L ${r1(x + 122 * s)} ${r1(y - 122 * s)} Z`, h),
    stroke(x - 160 * s, y - 44 * s, x + 160 * s, y - 44 * s, 3 * s, '#FFFFFF', { opacity: 0.2 }),
    stroke(x - 140 * s, y - 22 * s, x + 140 * s, y - 22 * s, 3 * s, '#FFFFFF', { opacity: 0.2 }),
    rect(x - 60 * s, y - 112 * s, 120 * s, 12 * s, h, { opacity: 0.5 }),
  ];
  if (door) out.push(rect(x + 30 * s, y - 104 * s, 30 * s, 40 * s, door, { rx: 2 * s }));
  return wrap(out.join(''), o);
}

/**
 * The ark half built, on blocks: the planked hull (in `planks`, the accent)
 * finished up to the gunwale, and above it only the bare posts and beams of
 * the house, with a ladder of scaffolding at the stern.
 */
export function arkFrame(x: number, y: number, s: number, frame: string, planks: string, o?: Opts): string {
  const f = ink(frame);
  const hullTop = y - 86 * s;
  const out = [
    // blocks it rests on
    rect(x - 110 * s, y - 14 * s, 30 * s, 14 * s, f),
    rect(x - 15 * s, y - 14 * s, 30 * s, 14 * s, f),
    rect(x + 80 * s, y - 14 * s, 30 * s, 14 * s, f),
    // hull: long, with the bow and stern swept up
    path(
      `M ${r1(x - 190 * s)} ${r1(hullTop - 20 * s)} L ${r1(x + 190 * s)} ${r1(hullTop - 20 * s)} C ${r1(x + 176 * s)} ${r1(y - 30 * s)} ${r1(x + 130 * s)} ${r1(y - 12 * s)} ${r1(x + 90 * s)} ${r1(y - 12 * s)} ` +
        `L ${r1(x - 90 * s)} ${r1(y - 12 * s)} C ${r1(x - 130 * s)} ${r1(y - 12 * s)} ${r1(x - 176 * s)} ${r1(y - 30 * s)} ${r1(x - 190 * s)} ${r1(hullTop - 20 * s)} Z`,
      planks,
    ),
  ];
  for (let i = 1; i <= 3; i += 1) out.push(stroke(x - (186 - i * 12) * s, hullTop - 20 * s + i * 20 * s, x + (186 - i * 12) * s, hullTop - 20 * s + i * 20 * s, 2.6 * s, '#FFFFFF', { opacity: 0.35 }));
  // gunwale
  out.push(rect(x - 196 * s, hullTop - 26 * s, 392 * s, 9 * s, f, { rx: 4 * s }));
  // posts and beams of the house still open to the sky
  const postTop = hullTop - 120 * s;
  for (let i = 0; i <= 8; i += 1) out.push(rect(x - 132 * s + i * 33 * s - 3.5 * s, postTop, 7 * s, 104 * s, f));
  out.push(
    rect(x - 140 * s, postTop - 4 * s, 280 * s, 8 * s, f, { rx: 3 * s }),
    stroke(x - 144 * s, postTop, x, postTop - 46 * s, 7 * s, f),
    stroke(x, postTop - 46 * s, x + 60 * s, postTop - 20 * s, 7 * s, f),
  );
  return wrap(out.join(''), o);
}

/** A nomad's tent of goat hair: long and low, three poles under a sagging roof, a lit opening. */
export function nomadTent(x: number, y: number, s: number, fill: string, opening?: string, o?: Opts): string {
  const f = ink(fill);
  const g =
    stroke(x - 128 * s, y, x - 104 * s, y - 44 * s, 1.8 * s, f) +
    stroke(x + 128 * s, y, x + 104 * s, y - 44 * s, 1.8 * s, f) +
    path(
      `M ${r1(x - 106 * s)} ${r1(y)} L ${r1(x - 112 * s)} ${r1(y - 46 * s)} L ${r1(x - 66 * s)} ${r1(y - 84 * s)} Q ${r1(x - 34 * s)} ${r1(y - 70 * s)} ${r1(x)} ${r1(y - 94 * s)} ` +
        `Q ${r1(x + 34 * s)} ${r1(y - 70 * s)} ${r1(x + 66 * s)} ${r1(y - 84 * s)} L ${r1(x + 112 * s)} ${r1(y - 46 * s)} L ${r1(x + 106 * s)} ${r1(y)} Z`,
      f,
    ) +
    path(`M ${r1(x - 34 * s)} ${r1(y)} L ${r1(x - 28 * s)} ${r1(y - 58 * s)} L ${r1(x + 22 * s)} ${r1(y - 62 * s)} L ${r1(x + 28 * s)} ${r1(y)} Z`, opening ?? '#FFFFFF', { opacity: opening ? 1 : 0.28 });
  return wrap(g, o);
}

/** A rainbow: concentric bands over (x, y). `colors` runs outside in. */
export function rainbow(x: number, y: number, r: number, w: number, colors: string[], opacity = 0.8): string {
  const out = colors.map((col, i) => {
    const rr = r - i * w;
    return `<path d="M ${r1(x - rr)} ${r1(y)} A ${r1(rr)} ${r1(rr)} 0 0 1 ${r1(x + rr)} ${r1(y)}" fill="none" stroke="${col}" stroke-width="${r1(w + 0.6)}"/>`;
  });
  return `<g opacity="${opacity}">${out.join('')}</g>`;
}

/** A ladder (a stairway) from (x0, y0) up to (x1, y1), narrowing toward the top. */
export function ladder(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, fill: string, rungs = 12, o?: Opts): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const side = (k: number) => `M ${r1(x0 + nx * w0 * k)} ${r1(y0 + ny * w0 * k)} L ${r1(x1 + nx * w1 * k)} ${r1(y1 + ny * w1 * k)}`;
  const out = [curve(side(-0.5), Math.max(4, w0 * 0.1), fill), curve(side(0.5), Math.max(4, w0 * 0.1), fill)];
  for (let i = 1; i < rungs; i += 1) {
    // rungs crowd together toward the top, as if receding
    const t = 1 - Math.pow(1 - i / rungs, 1.35);
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;
    const ww = w0 + (w1 - w0) * t;
    out.push(stroke(cx - nx * ww * 0.5, cy - ny * ww * 0.5, cx + nx * ww * 0.5, cy + ny * ww * 0.5, Math.max(3, ww * 0.07), fill));
  }
  return wrap(out.join(''), o);
}

/** A heap of field stones - Galeed, the witness heap. */
export function cairn(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const light = mix(f, '#FFFFFF', 0.18);
  const rows: [number, number, number][] = [
    [5, 26, 0],
    [4, 24, 34],
    [3, 22, 64],
    [2, 20, 90],
    [1, 18, 112],
  ];
  const out: string[] = [];
  rows.forEach(([n, r, lift], ri) => {
    for (let i = 0; i < n; i += 1) {
      const cx = x + (i - (n - 1) / 2) * r * 1.7 * s;
      out.push(ellipse(cx, y - lift * s - r * 0.6 * s, r * s, r * 0.72 * s, ri % 2 ? light : f));
    }
  });
  return wrap(out.join(''), o);
}

/** A standing stone, a pillar set up as a witness or on a grave. */
export function standingStone(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    path(
      `M ${r1(x - 24 * s)} ${r1(y)} L ${r1(x - 27 * s)} ${r1(y - 64 * s)} L ${r1(x - 20 * s)} ${r1(y - 124 * s)} L ${r1(x - 4 * s)} ${r1(y - 140 * s)} ` +
        `L ${r1(x + 16 * s)} ${r1(y - 132 * s)} L ${r1(x + 24 * s)} ${r1(y - 70 * s)} L ${r1(x + 22 * s)} ${r1(y)} Z`,
      fill,
    ) + path(`M ${r1(x + 6 * s)} ${r1(y - 134 * s)} L ${r1(x + 16 * s)} ${r1(y - 132 * s)} L ${r1(x + 24 * s)} ${r1(y - 70 * s)} L ${r1(x + 22 * s)} ${r1(y)} L ${r1(x + 10 * s)} ${r1(y)} L ${r1(x + 12 * s)} ${r1(y - 72 * s)} Z`, '#000000', { opacity: 0.12 }),
    o,
  );
}

/** An open cistern in the ground: a stone rim around a dark mouth. `y` is the ground at its front. */
export function pit(x: number, y: number, s: number, rim: string, hole: string, o?: Opts): string {
  return wrap(ellipse(x, y - 14 * s, 90 * s, 22 * s, rim) + ellipse(x, y - 16 * s, 66 * s, 13 * s, hole), o);
}

/** A two-wheeled wagon with a box, its tongue reaching forward (left). */
export function wagon(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const wheel = (wx: number) => {
    const spokes: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const a = (Math.PI * i) / 4;
      spokes.push(stroke(wx - Math.cos(a) * 26 * s, y - 30 * s - Math.sin(a) * 26 * s, wx + Math.cos(a) * 26 * s, y - 30 * s + Math.sin(a) * 26 * s, 3.2 * s, f));
    }
    return `<circle cx="${r1(wx)}" cy="${r1(y - 30 * s)}" r="${r1(28 * s)}" fill="none" stroke="${f}" stroke-width="${r1(6 * s)}"/>` + spokes.join('') + circle(wx, y - 30 * s, 6 * s, f);
  };
  return wrap(
    rect(x - 80 * s, y - 76 * s, 160 * s, 34 * s, f, { rx: 3 * s }) +
      rect(x - 84 * s, y - 80 * s, 168 * s, 8 * s, f, { rx: 3 * s }) +
      stroke(x - 80 * s, y - 50 * s, x - 150 * s, y - 40 * s, 6 * s, f) +
      wheel(x - 40 * s) +
      wheel(x + 40 * s),
    o,
  );
}

/** A domed Egyptian granary with a hatch at the top and a door at the foot. */
export function granary(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    path(`M ${r1(x - 46 * s)} ${r1(y)} L ${r1(x - 46 * s)} ${r1(y - 70 * s)} C ${r1(x - 46 * s)} ${r1(y - 136 * s)} ${r1(x + 46 * s)} ${r1(y - 136 * s)} ${r1(x + 46 * s)} ${r1(y - 70 * s)} L ${r1(x + 46 * s)} ${r1(y)} Z`, fill) +
      rect(x - 12 * s, y - 132 * s, 24 * s, 14 * s, fill, { rx: 3 * s }) +
      rect(x - 14 * s, y - 34 * s, 28 * s, 34 * s, mix(fill, '#000000', 0.25), { rx: 3 * s }),
    o,
  );
}

/** A coffin on a carrying bier: a long box with a rounded lid and two poles. */
export function bier(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    rect(x - 110 * s, y - 6 * s, 220 * s, 8 * s, fill, { rx: 4 * s }) +
      rect(x - 70 * s, y - 40 * s, 140 * s, 36 * s, fill, { rx: 4 * s }) +
      path(`M ${r1(x - 74 * s)} ${r1(y - 38 * s)} C ${r1(x - 60 * s)} ${r1(y - 62 * s)} ${r1(x + 60 * s)} ${r1(y - 62 * s)} ${r1(x + 74 * s)} ${r1(y - 38 * s)} Z`, fill),
    o,
  );
}

/** A bed (low couch) with a raised head end. */
export function bed(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    rect(x - 90 * s, y - 34 * s, 180 * s, 12 * s, fill, { rx: 4 * s }) +
      rect(x - 84 * s, y - 24 * s, 8 * s, 24 * s, fill) +
      rect(x + 76 * s, y - 24 * s, 8 * s, 24 * s, fill) +
      rect(x - 94 * s, y - 66 * s, 12 * s, 66 * s, fill, { rx: 4 * s }),
    o,
  );
}

/** A low table on two legs; the top sits at `y - 44 * s`. */
export function table(x: number, y: number, w: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    rect(x - w / 2, y - 44 * s, w, 12 * s, fill, { rx: 3 * s }) + rect(x - w / 2 + 16 * s, y - 32 * s, 10 * s, 32 * s, fill) + rect(x + w / 2 - 26 * s, y - 32 * s, 10 * s, 32 * s, fill),
    o,
  );
}

/** A weaving loom: two posts, a beam, and the cloth hanging from it. */
export function loom(x: number, y: number, s: number, frame: string, cloth: string, o?: Opts): string {
  const out = [
    rect(x - 70 * s, y - 170 * s, 9 * s, 170 * s, frame),
    rect(x + 61 * s, y - 170 * s, 9 * s, 170 * s, frame),
    rect(x - 80 * s, y - 178 * s, 160 * s, 10 * s, frame, { rx: 4 * s }),
    rect(x - 56 * s, y - 166 * s, 112 * s, 110 * s, cloth),
  ];
  for (let i = 0; i < 4; i += 1) out.push(rect(x - 56 * s, y - 150 * s + i * 24 * s, 112 * s, 5 * s, '#FFFFFF', { opacity: 0.35 }));
  for (let i = 0; i < 8; i += 1) out.push(stroke(x - 50 * s + i * 14 * s, y - 56 * s, x - 50 * s + i * 14 * s, y - 24 * s, 1.6 * s, frame), circle(x - 50 * s + i * 14 * s, y - 20 * s, 4 * s, frame));
  return wrap(out.join(''), o);
}

/** An anvil block with a hammer resting on it, raised; for a craftsman at work. */
export function anvil(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(
    path(`M ${r1(x - 46 * s)} ${r1(y - 52 * s)} L ${r1(x + 34 * s)} ${r1(y - 52 * s)} L ${r1(x + 56 * s)} ${r1(y - 44 * s)} L ${r1(x + 20 * s)} ${r1(y - 34 * s)} L ${r1(x + 14 * s)} ${r1(y - 14 * s)} L ${r1(x + 30 * s)} ${r1(y)} L ${r1(x - 30 * s)} ${r1(y)} L ${r1(x - 14 * s)} ${r1(y - 14 * s)} L ${r1(x - 20 * s)} ${r1(y - 38 * s)} Z`, fill),
    o,
  );
}

/** A column of cloud standing on the ground and swelling toward the top. */
export function cloudPillar(rand: () => number, x: number, yBottom: number, yTop: number, w: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  const n = 12;
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const y = yBottom - (yBottom - yTop) * t;
    const rx = w * (0.34 + 0.32 * t * t) * (0.9 + rand() * 0.25);
    out.push(ellipse(x + (rand() - 0.5) * w * 0.16, y, rx, rx * 0.62, fill));
  }
  out.push(ellipse(x - w * 0.36, yTop + 10, w * 0.4, w * 0.24, fill), ellipse(x + w * 0.36, yTop + 14, w * 0.38, w * 0.22, fill));
  return wrap(out.join(''), o);
}

/** A tall tongue-shaped column of fire, layered outer/inner. `y` is its foot. */
export function firePillar(x: number, y: number, h: number, w: number, outer: string, inner: string, o?: Opts): string {
  return wrap(at(x, y, 1, aFlame(h, w, outer, 6) + at(0, 0, 0.62, aFlame(h, w, inner, 3))), o);
}

/**
 * A wall of standing water, `side` 'left' or 'right' of the path through it.
 * The inner face is a wave about to break toward the path.
 */
export function seaWall(x0: number, x1: number, yTop: number, yBase: number, side: 'left' | 'right', fill: string, crest: string, o?: Opts): string {
  const inner = side === 'left' ? x1 : x0;
  const outer = side === 'left' ? x0 : x1;
  const k = side === 'left' ? 1 : -1;
  const d =
    `M ${r1(outer)} ${r1(yBase)} L ${r1(outer)} ${r1(yTop + 30)} ` +
    `C ${r1(outer + k * 120)} ${r1(yTop + 10)} ${r1(inner - k * 120)} ${r1(yTop - 10)} ${r1(inner - k * 30)} ${r1(yTop)} ` +
    `C ${r1(inner + k * 10)} ${r1(yTop - 4)} ${r1(inner + k * 30)} ${r1(yTop + 24)} ${r1(inner + k * 8)} ${r1(yTop + 44)} ` +
    `C ${r1(inner - k * 4)} ${r1(yTop + 30)} ${r1(inner - k * 10)} ${r1(yTop + 70)} ${r1(inner)} ${r1(yTop + 110)} ` +
    `C ${r1(inner + k * 6)} ${r1((yTop + yBase) / 2)} ${r1(inner - k * 10)} ${r1(yBase - 40)} ${r1(inner + k * 6)} ${r1(yBase)} Z`;
  const out = [`<path d="${d}" fill="${fill}"/>`];
  const span = Math.abs(x1 - x0);
  for (let i = 0; i < 6; i += 1) {
    const yy = yTop + 60 + i * ((yBase - yTop - 70) / 6);
    const xa = outer + k * span * 0.08;
    const xb = inner - k * span * (0.12 + (i % 2) * 0.1);
    out.push(curve(`M ${r1(xa)} ${r1(yy)} Q ${r1((xa + xb) / 2)} ${r1(yy - 12)} ${r1(xb)} ${r1(yy)}`, 4, crest, { opacity: 0.5 }));
  }
  out.push(curve(`M ${r1(outer)} ${r1(yTop + 30)} C ${r1(outer + k * 120)} ${r1(yTop + 10)} ${r1(inner - k * 120)} ${r1(yTop - 10)} ${r1(inner - k * 30)} ${r1(yTop)}`, 5, crest, { opacity: 0.7 }));
  return wrap(out.join(''), o);
}

/** Small white flakes scattered on the ground - manna. */
export function flakes(rand: () => number, x0: number, x1: number, y0: number, y1: number, fill: string, n = 60): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(ellipse(x0 + rand() * (x1 - x0), y0 + rand() * (y1 - y0), 4 + rand() * 3, 2.4 + rand() * 1.4, fill, { opacity: 0.6 + rand() * 0.4 }));
  }
  return out.join('');
}

/** A rock face with a narrow cleft in it - "Ik zal u in een kloof van de steenrots zetten". */
export function cleftRock(x: number, y: number, s: number, fill: string, cleft: string, o?: Opts): string {
  return wrap(
    path(`M ${r1(x - 150 * s)} ${r1(y)} C ${r1(x - 160 * s)} ${r1(y - 120 * s)} ${r1(x - 110 * s)} ${r1(y - 230 * s)} ${r1(x - 30 * s)} ${r1(y - 250 * s)} C ${r1(x + 40 * s)} ${r1(y - 262 * s)} ${r1(x + 130 * s)} ${r1(y - 200 * s)} ${r1(x + 160 * s)} ${r1(y - 90 * s)} L ${r1(x + 170 * s)} ${r1(y)} Z`, fill) +
      path(`M ${r1(x - 30 * s)} ${r1(y)} L ${r1(x - 20 * s)} ${r1(y - 110 * s)} L ${r1(x - 4 * s)} ${r1(y - 190 * s)} L ${r1(x + 12 * s)} ${r1(y - 120 * s)} L ${r1(x + 34 * s)} ${r1(y)} Z`, cleft),
    o,
  );
}

/** A Hebrew house front: a flat-roofed wall with the doorway's posts and lintel in `frame`. */
export function doorHouse(x: number, y: number, s: number, wall: string, doorway: string, frame: string, o?: Opts): string {
  return wrap(
    rect(x - 110 * s, y - 130 * s, 220 * s, 130 * s, wall) +
      rect(x - 118 * s, y - 140 * s, 236 * s, 14 * s, wall) +
      rect(x - 30 * s, y - 92 * s, 60 * s, 92 * s, doorway) +
      rect(x - 44 * s, y - 108 * s, 88 * s, 16 * s, frame, { rx: 2 * s }) +
      rect(x - 44 * s, y - 94 * s, 14 * s, 94 * s, frame) +
      rect(x + 30 * s, y - 94 * s, 14 * s, 94 * s, frame) +
      rect(x + 58 * s, y - 92 * s, 26 * s, 24 * s, doorway, { opacity: 0.6 }),
    o,
  );
}
