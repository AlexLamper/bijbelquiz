/**
 * Extra motifs for the 1 Koningen, 2 Koningen and 1 Kronieken covers: the
 * temple and its furniture (altar, ark, bronze sea, pillars, cherubim,
 * showbread table), the instruments of the Levites (lyre, cymbals, horn),
 * arms (sword, spear, shield, bow, arrow), and the objects the Kings and
 * Chronicles stories turn on (raven, camel, golden calf, cedar, thistle,
 * idol, torn cloak, axe head, offering chest, Nehushtan, family tree, key).
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, `y` is
 * the ground a motif stands on unless the doc comment says "centre", and
 * `s = 1` is drawn in scene pixels. Paths are written once in local units
 * (origin at the foot, y up is negative) and placed with `xf`, which can
 * also mirror them.
 */

import { at, broadWing, figure, mix as mixHex, sheep as aSheep, type Pose as AFigurePose } from './cover-options/shapes.mjs';
import { circle, ellipse, ink, ox, person, rect, rotate, type Pose } from './quiz-cover-primitives.mjs';

type Opts = { opacity?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const op = (o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? ` opacity="${o.opacity}"` : '');
const wrap = (g: string, o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? `<g${op(o)}>${g}</g>` : g);

/**
 * Place a path written in local units (absolute commands only: M L H V C S Q T A Z)
 * at (x, y), scaled by s and optionally mirrored about x.
 */
export function xf(d: string, x: number, y: number, s: number, flip = false): string {
  const tok = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const out: string[] = [];
  const X = (v: string) => r1(x + (flip ? -Number(v) : Number(v)) * s);
  const Y = (v: string) => r1(y + Number(v) * s);
  let cmd = '';
  let i = 0;
  while (i < tok.length) {
    const t = tok[i];
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      out.push(t);
      i += 1;
      continue;
    }
    if (cmd === 'H') {
      out.push(String(X(t)));
      i += 1;
    } else if (cmd === 'V') {
      out.push(String(Y(t)));
      i += 1;
    } else if (cmd === 'A') {
      const [rx, ry, rot, large, sweep, ex, ey] = tok.slice(i, i + 7);
      const sw = flip ? 1 - Number(sweep) : Number(sweep);
      out.push(`${r1(Number(rx) * s)} ${r1(Number(ry) * s)} ${flip ? -Number(rot) : rot} ${large} ${sw} ${X(ex)} ${Y(ey)}`);
      i += 7;
    } else {
      out.push(`${X(t)} ${Y(tok[i + 1])}`);
      i += 2;
    }
  }
  return out.join(' ');
}

/** A raw path: no landform remapping, so an object stays the colour it is given at any size. */
function P(d: string, fill: string, o?: Opts): string {
  return `<path d="${d}" fill="${fill}"${op(o)}/>`;
}

/** A round-capped stroke along a world-space path. */
function S(d: string, stroke: string, w: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

/**
 * The colour a large wall drawn in `fill` gets in this scene (the kit maps
 * depth colours on big rectangles to a mid tone). Used so every part of a
 * building - cornices and steps too - shares the wall colour.
 */
export function wallTone(fill: string): string {
  return /fill="([^"]+)"/.exec(rect(0, 0, 400, 120, fill))?.[1] ?? fill;
}

/** A sheep facing right (or left with `flip`), light fleece and a dark head; ~70 tall at s = 1. */
export function sheep(x: number, y: number, s: number, body: string, head: string, flip = false, o?: Opts): string {
  return at(x, y, s, aSheep(body, ink(head)), { flip, opacity: o?.opacity });
}

/** Mirror a finished fragment about the vertical line x = cx. */
export function mirror(cx: number, inner: string): string {
  return `<g transform="translate(${r1(2 * cx)} 0) scale(-1 1)">${inner}</g>`;
}

/** `person` mirrored, so a kneeler or a pointing figure faces left. */
export function personLeft(x: number, y: number, s: number, fill: string, pose: Pose = 'stand', o?: Opts): string {
  return mirror(x, person(x, y, s, fill, pose, o));
}

/** The option-A figure in one of the poses `person` does not expose: 'staff', 'bless', 'shield'. */
export function figureAt(x: number, y: number, s: number, fill: string, pose: AFigurePose, flip = false, o?: Opts): string {
  const k = s * (134 / 204);
  return at(x, y, k, figure(ink(fill), pose), { flip, opacity: o?.opacity });
}

/** A figure lying on its back, head to the left - the sick or the dying on a bed. */
export function lying(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  return wrap(
    P(xf('M -70 0 C -72 -20 -50 -30 -10 -30 C 30 -30 56 -26 70 -16 C 78 -10 80 -4 78 0 Z', x, y, s), f) +
      circle(x - 86 * s, y - 18 * s, 15 * s, f),
    o,
  );
}

// ── temple and its furniture ───────────────────────────────────────────────

/** A stone altar with four horns; `tall` gives the narrow altar of incense. */
export function altar(x: number, y: number, s: number, fill: string, o?: Opts & { tall?: boolean }): string {
  const w = o?.tall ? 34 : 58;
  const h = o?.tall ? 104 : 64;
  const g =
    P(xf(`M ${-w} 0 L ${-w + 5} ${-h} L ${w - 5} ${-h} L ${w} 0 Z`, x, y, s), fill) +
    rect(x - (w + 4) * s, y - (h + 10) * s, (w + 4) * 2 * s, 12 * s, fill) +
    rect(x - (w + 3) * s, y - h * 0.5 * s, (w + 3) * 2 * s, 7 * s, fill) +
    P(xf(`M ${-w - 4} ${-h - 8} L ${-w - 4} ${-h - 24} Q ${-w + 2} ${-h - 30} ${-w + 8} ${-h - 20} L ${-w + 10} ${-h - 8} Z`, x, y, s), fill) +
    P(xf(`M ${-w - 4} ${-h - 8} L ${-w - 4} ${-h - 24} Q ${-w + 2} ${-h - 30} ${-w + 8} ${-h - 20} L ${-w + 10} ${-h - 8} Z`, x, y, s, true), fill) +
    P(xf(`M ${-w * 0.45} ${-h - 8} L ${-w * 0.45} ${-h - 18} Q ${-w * 0.45 + 5} ${-h - 23} ${-w * 0.45 + 9} ${-h - 15} L ${-w * 0.45 + 10} ${-h - 8} Z`, x, y, s), fill, { opacity: 0.8 }) +
    P(xf(`M ${-w * 0.45} ${-h - 8} L ${-w * 0.45} ${-h - 18} Q ${-w * 0.45 + 5} ${-h - 23} ${-w * 0.45 + 9} ${-h - 15} L ${-w * 0.45 + 10} ${-h - 8} Z`, x, y, s, true), fill, { opacity: 0.8 });
  return wrap(g, o);
}

/** An altar of twelve unhewn stones in three courses (5-4-3) - Elijah's altar on Carmel. */
export function stoneAltar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  const rows = [5, 4, 3];
  const sw = 36;
  const sh = 28;
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i += 1) {
      const cx = (i - (n - 1) / 2) * (sw + 3);
      out.push(rect(x + (cx - sw / 2) * s, y - (r + 1) * (sh + 2) * s, sw * s, sh * s, fill, { rx: 9 * s }));
    }
  });
  return wrap(out.join(''), o);
}

/** The ark of the covenant: the chest, the mercy seat with two cherubim, and the carrying poles. */
export function arkOfCovenant(x: number, y: number, s: number, fill: string, o?: Opts & { poles?: boolean }): string {
  const cherub = (flip: boolean) =>
    P(xf('M -66 -76 L -62 -96 C -60 -106 -50 -110 -44 -104 L -38 -76 Z', x, y, s, flip), fill) +
    circle(x + (flip ? 48 : -48) * s, y - 112 * s, 8 * s, fill) +
    P(xf('M -50 -100 C -46 -150 -14 -158 -4 -118 C -18 -128 -32 -122 -40 -96 Z', x, y, s, flip), fill);
  const g =
    rect(x - 68 * s, y - 70 * s, 136 * s, 58 * s, fill, { rx: 3 * s }) +
    rect(x - 64 * s, y - 14 * s, 12 * s, 14 * s, fill) +
    rect(x + 52 * s, y - 14 * s, 12 * s, 14 * s, fill) +
    rect(x - 74 * s, y - 80 * s, 148 * s, 11 * s, fill, { rx: 2 * s }) +
    rect(x - 68 * s, y - 48 * s, 136 * s, 5 * s, '#FFFFFF', { opacity: 0.22 }) +
    (o?.poles === false ? '' : rect(x - 150 * s, y - 34 * s, 300 * s, 7 * s, fill, { rx: 3 * s })) +
    cherub(false) +
    cherub(true);
  return wrap(g, o);
}

/** One of the bronze pillars Jachin and Boaz: base, shaft, a bowl capital hung with pomegranates. ~244 tall. */
export function bronzePillar(x: number, y: number, s: number, fill: string, capFill?: string, o?: Opts): string {
  const cap = capFill ?? fill;
  const pom: string[] = [];
  for (let i = 0; i < 5; i += 1) pom.push(circle(x + (-24 + i * 12) * s, y - 206 * s, 5.5 * s, cap));
  const g =
    rect(x - 26 * s, y - 14 * s, 52 * s, 14 * s, fill, { rx: 2 * s }) +
    rect(x - 15 * s, y - 194 * s, 30 * s, 182 * s, fill) +
    P(xf('M -32 -236 C -36 -214 -26 -198 -15 -192 L 15 -192 C 26 -198 36 -214 32 -236 Z', x, y, s), cap) +
    pom.join('') +
    rect(x - 36 * s, y - 244 * s, 72 * s, 10 * s, cap, { rx: 4 * s });
  return wrap(g, o);
}

/**
 * Solomon's temple from the front: the tall porch, the house behind it, the
 * side chambers, a door and the two free-standing pillars. ~420 wide, ~260 tall.
 */
export function solomonTemple(x: number, y: number, s: number, fill: string, doorFill: string, o?: Opts & { pillars?: boolean; pillarFill?: string }): string {
  const slits: string[] = [];
  for (const dx of [-112, -88, 82, 106]) slits.push(rect(x + dx * s, y - 176 * s, 7 * s, 34 * s, '#FFFFFF', { opacity: 0.35 }));
  const wall = wallTone(fill);
  const side = mixHex(wall, '#FFFFFF', 0.12);
  const g =
    rect(x - 206 * s, y - 112 * s, 412 * s, 112 * s, side) +
    rect(x - 212 * s, y - 120 * s, 424 * s, 9 * s, side) +
    rect(x - 132 * s, y - 196 * s, 264 * s, 196 * s, wall) +
    rect(x - 138 * s, y - 204 * s, 276 * s, 10 * s, wall) +
    slits.join('') +
    rect(x - 72 * s, y - 262 * s, 144 * s, 262 * s, mixHex(wall, '#000000', 0.06)) +
    rect(x - 80 * s, y - 272 * s, 160 * s, 12 * s, mixHex(wall, '#000000', 0.06)) +
    P(xf('M -28 0 L -28 -92 Q 0 -122 28 -92 L 28 0 Z', x, y, s), doorFill) +
    rect(x - 96 * s, y - 8 * s, 192 * s, 8 * s, wall) +
    rect(x - 80 * s, y - 16 * s, 160 * s, 9 * s, wall) +
    (o?.pillars === false
      ? ''
      : bronzePillar(x - 104 * s, y, 0.86 * s, o?.pillarFill ?? fill) + bronzePillar(x + 104 * s, y, 0.86 * s, o?.pillarFill ?? fill));
  return wrap(g, o);
}

/**
 * The bronze sea: a great round basin, its rim seen a little from above, on
 * twelve oxen (five seen) facing outward. ~360 wide, ~200 tall.
 */
export function bronzeSea(x: number, y: number, s: number, basin: string, inner: string, oxFill: string, o?: Opts): string {
  const f = ink(oxFill);
  const front =
    rect(x - 36 * s, y - 76 * s, 72 * s, 52 * s, f, { rx: 16 * s }) +
    rect(x - 30 * s, y - 30 * s, 13 * s, 30 * s, f, { rx: 5 * s }) +
    rect(x + 17 * s, y - 30 * s, 13 * s, 30 * s, f, { rx: 5 * s }) +
    ellipse(x, y - 46 * s, 18 * s, 26 * s, f) +
    S(xf('M -12 -66 C -28 -68 -38 -80 -34 -92', x, y, s), f, 7 * s) +
    S(xf('M 12 -66 C 28 -68 38 -80 34 -92', x, y, s), f, 7 * s);
  const side = ox(x - 150 * s, y, 0.95 * s, oxFill) + ox(x - 74 * s, y - 2 * s, 0.86 * s, oxFill, { opacity: 0.92 });
  const g =
    side +
    mirror(x, side) +
    P(xf('M -176 -176 C -176 -112 -112 -74 0 -74 C 112 -74 176 -112 176 -176 Z', x, y, s), basin) +
    ellipse(x, y - 176 * s, 184 * s, 22 * s, basin) +
    ellipse(x, y - 178 * s, 166 * s, 14 * s, inner) +
    P(xf('M -150 -136 C -110 -112 110 -112 150 -136', x, y, s), 'none').replace('fill="none"', `fill="none" stroke="#FFFFFF" stroke-width="${r1(4 * s)}" opacity="0.25"`) +
    front;
  return wrap(g, o);
}

/**
 * The two cherubim of the inner sanctuary standing side by side, wings
 * spread level: the inner wings meet over the middle, the outer ones reach out.
 */
export function cherubPair(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const k = s * (134 / 204);
  const one = (dx: number) =>
    at(
      x + dx * s,
      y,
      k,
      at(-6, -152, 1, broadWing(fill, 240, 1.25), { rot: -70 }) + at(6, -152, 1, broadWing(fill, 240, 1.25), { rot: 70, flip: true }) + figure(fill, 'stand'),
    );
  return wrap(one(-176) + one(176), o);
}

/** The table of showbread with two stacks of six loaves. */
export function showbreadTable(x: number, y: number, s: number, fill: string, bread: string, o?: Opts): string {
  const loaves: string[] = [];
  for (const sx of [-44, 44]) for (let i = 0; i < 6; i += 1) loaves.push(ellipse(x + sx * s, y - (84 + i * 10) * s, 30 * s, 7 * s, bread));
  const g =
    rect(x - 92 * s, y - 80 * s, 184 * s, 12 * s, fill, { rx: 3 * s }) +
    rect(x - 86 * s, y - 70 * s, 172 * s, 8 * s, fill) +
    rect(x - 80 * s, y - 64 * s, 10 * s, 64 * s, fill) +
    rect(x + 70 * s, y - 64 * s, 10 * s, 64 * s, fill) +
    loaves.join('');
  return wrap(g, o);
}

// ── instruments ────────────────────────────────────────────────────────────

/** A lyre (kinnor): sound box, two curved arms, a yoke and strings. ~180 tall. */
export function lyre(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const strings: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const bx = -22 + i * 9;
    const tx = -34 + i * 13.5;
    strings.push(S(`M ${r1(x + bx * s)} ${r1(y - 56 * s)} L ${r1(x + tx * s)} ${r1(y - (160 - i * 1.4) * s)}`, fill, 2.4 * s, 0.75));
  }
  const g =
    P(xf('M -40 0 C -50 -18 -48 -44 -36 -58 L 36 -58 C 48 -44 50 -18 40 0 Z', x, y, s), fill) +
    S(xf('M -30 -54 C -38 -80 -60 -110 -50 -146 C -46 -160 -40 -168 -46 -184', x, y, s), fill, 11 * s) +
    S(xf('M 30 -54 C 38 -80 60 -104 52 -142 C 48 -156 44 -166 50 -184', x, y, s), fill, 11 * s) +
    S(xf('M -54 -162 L 56 -170', x, y, s), fill, 9 * s) +
    strings.join('');
  return wrap(g, o);
}

/** A pair of cymbals held apart, centre between them. */
export function cymbals(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const one = (dx: number, rot: number) =>
    rotate(rot, x + dx * s, y, ellipse(x + dx * s, y, 10 * s, 34 * s, fill) + circle(x + dx * s + (dx < 0 ? -8 : 8) * s, y, 7 * s, fill));
  return wrap(one(-30, -14) + one(30, 14), o);
}

/** A ram's horn (shofar, or the horn of oil): mouthpiece at (x, y), curving up and right to the bell. */
export function horn(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    P(xf('M 0 -5 C 34 -8 62 -30 72 -72 L 102 -64 C 88 -12 46 12 0 6 Z', x, y, s), fill) +
    rotate(15, x + 87 * s, y - 68 * s, ellipse(x + 87 * s, y - 68 * s, 17 * s, 8 * s, fill));
  return wrap(g, o);
}

// ── arms ───────────────────────────────────────────────────────────────────

/** A sword, point up; (x, y) is the middle of the cross-guard. Blade ~160, grip below. */
export function sword(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    P(xf('M -7 -8 L -7 -150 L 0 -168 L 7 -150 L 7 -8 Z', x, y, s), fill) +
    rect(x - 28 * s, y - 10 * s, 56 * s, 10 * s, fill, { rx: 4 * s }) +
    rect(x - 5 * s, y, 10 * s, 30 * s, fill, { rx: 3 * s }) +
    circle(x, y + 34 * s, 8 * s, fill);
  return wrap(g, o);
}

/** A spear standing upright; y is its butt. ~250 tall. */
export function spear(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = rect(x - 3 * s, y - 222 * s, 6 * s, 222 * s, fill, { rx: 3 * s }) + P(xf('M 0 -252 L 10 -224 L 0 -214 L -10 -224 Z', x, y, s), fill);
  return wrap(g, o);
}

/** A round shield seen face-on; (x, y) is its centre. */
export function roundShield(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    circle(x, y, 34 * s, fill) +
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(27 * s)}" fill="none" stroke="#FFFFFF" stroke-width="${r1(2.5 * s)}" opacity="0.3"/>` +
    circle(x, y, 9 * s, '#FFFFFF', { opacity: 0.3 });
  return wrap(g, o);
}

/** An arrow pointing right, tip at (x, y). Rotate it for any other angle. */
export function arrow(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 120 * s, y - 2.5 * s, 108 * s, 5 * s, fill) +
    P(xf('M 0 0 L -22 -10 L -16 0 L -22 10 Z', x, y, s), fill) +
    P(xf('M -100 -2 L -124 -14 L -132 -14 L -114 -2 Z', x, y, s), fill) +
    P(xf('M -100 2 L -124 14 L -132 14 L -114 2 Z', x, y, s), fill);
  return wrap(g, o);
}

/** A bow drawn back with an arrow on the string, aiming right; (x, y) is the grip. Pass `arrowFill = ''` for a bare bow. */
export function bow(x: number, y: number, s: number, fill: string, arrowFill?: string, o?: Opts): string {
  const g =
    S(xf('M -4 -74 C 44 -46 44 46 -4 74', x, y, s), fill, 7 * s) +
    S(xf('M -4 -74 L -52 0 L -4 74', x, y, s), fill, 2 * s, 0.8) +
    (arrowFill === '' ? '' : arrow(x + 70 * s, y, 1 * s, arrowFill ?? fill));
  return wrap(g, o);
}

// ── animals, birds, plants ─────────────────────────────────────────────────

/** A raven in flight, facing left, wings up; (x, y) is the body centre. */
export function raven(x: number, y: number, s: number, fill: string, o?: Opts & { flip?: boolean }): string {
  const f = ink(fill);
  const fl = o?.flip ?? false;
  const g =
    P(xf('M 0 2 C 8 30 26 52 58 64 L 52 48 L 70 56 L 60 38 L 76 42 C 56 22 36 8 18 0 Z', x, y, s, fl), f, { opacity: 0.75 }) +
    P(xf('M -48 -4 C -32 -22 6 -22 30 -9 L 62 -16 L 53 0 L 64 14 L 28 10 C 4 20 -32 16 -48 -4 Z', x, y, s, fl), f) +
    circle(x + (fl ? 48 : -48) * s, y - 6 * s, 12 * s, f) +
    P(xf('M -58 -11 L -80 -4 L -58 2 Z', x, y, s, fl), f) +
    P(xf('M -14 -8 C -24 -40 -12 -76 18 -98 L 22 -84 L 34 -100 L 37 -84 L 51 -96 L 49 -78 L 63 -86 L 57 -66 C 46 -40 28 -18 14 -6 Z', x, y, s, fl), f);
  return wrap(g, o);
}

/** A camel walking left; optional pack in `load` on its back. ~150 tall. */
export function camel(x: number, y: number, s: number, fill: string, load?: string, o?: Opts): string {
  const f = ink(fill);
  const g =
    ellipse(x, y - 62 * s, 54 * s, 24 * s, f) +
    circle(x - 6 * s, y - 84 * s, 26 * s, f) +
    rect(x - 44 * s, y - 64 * s, 9 * s, 64 * s, f, { rx: 4 * s }) +
    rect(x - 26 * s, y - 64 * s, 9 * s, 64 * s, f, { rx: 4 * s }) +
    rect(x + 16 * s, y - 64 * s, 9 * s, 64 * s, f, { rx: 4 * s }) +
    rect(x + 36 * s, y - 64 * s, 9 * s, 64 * s, f, { rx: 4 * s }) +
    P(xf('M -40 -76 L -56 -64 L -86 -124 L -72 -132 Z', x, y, s), f) +
    ellipse(x - 88 * s, y - 132 * s, 17 * s, 9 * s, f) +
    P(xf('M -80 -138 L -74 -150 L -70 -136 Z', x, y, s), f) +
    S(xf('M 52 -68 C 66 -58 64 -40 60 -32', x, y, s), f, 4 * s) +
    (load ? rect(x - 34 * s, y - 128 * s, 60 * s, 30 * s, load, { rx: 8 * s }) + rect(x - 40 * s, y - 104 * s, 72 * s, 14 * s, load, { rx: 5 * s }) : '');
  return wrap(g, o);
}

/** A young bull standing on a plinth - Jeroboam's golden calf. */
export function goldenCalf(x: number, y: number, s: number, calfFill: string, plinthFill: string, o?: Opts): string {
  const b = -42;
  const g =
    rect(x - 74 * s, y - 34 * s, 148 * s, 34 * s, plinthFill) +
    rect(x - 82 * s, y - 44 * s, 164 * s, 12 * s, plinthFill, { rx: 3 * s }) +
    rect(x - 40 * s, y + (b - 40) * s, 10 * s, 40 * s, calfFill, { rx: 4 * s }) +
    rect(x - 22 * s, y + (b - 40) * s, 10 * s, 40 * s, calfFill, { rx: 4 * s }) +
    rect(x + 16 * s, y + (b - 40) * s, 10 * s, 40 * s, calfFill, { rx: 4 * s }) +
    rect(x + 34 * s, y + (b - 40) * s, 10 * s, 40 * s, calfFill, { rx: 4 * s }) +
    ellipse(x, y + (b - 52) * s, 54 * s, 24 * s, calfFill) +
    P(xf(`M -36 ${b - 62} L -62 ${b - 96} L -46 ${b - 104} L -24 ${b - 70} Z`, x, y, s), calfFill) +
    ellipse(x - 64 * s, y + (b - 100) * s, 18 * s, 12 * s, calfFill) +
    S(xf(`M -72 ${b - 108} C -82 ${b - 112} -84 ${b - 120} -80 ${b - 126}`, x, y, s), calfFill, 6 * s) +
    S(xf(`M -56 ${b - 108} C -48 ${b - 112} -46 ${b - 120} -50 ${b - 126}`, x, y, s), calfFill, 6 * s) +
    S(xf(`M 52 ${b - 60} C 66 ${b - 50} 64 ${b - 28} 60 ${b - 18}`, x, y, s), calfFill, 4 * s);
  return wrap(g, o);
}

/** A cedar of Lebanon: a stout trunk under flat, spreading tiers, offset left and right. ~230 tall. */
export function cedar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const tiers: [number, number, number][] = [
    [-66, 128, -16],
    [-104, 110, 22],
    [-140, 92, -18],
    [-176, 70, 16],
    [-206, 44, -4],
  ];
  const out = [P(xf('M -14 0 L -8 -150 L 8 -150 L 14 0 Z', x, y, s), f)];
  for (const [ty, w, dx] of tiers) {
    out.push(P(xf(`M ${dx - w} ${ty} C ${dx - w * 0.8} ${ty - 22} ${dx - w * 0.3} ${ty - 30} ${dx} ${ty - 28} C ${dx + w * 0.3} ${ty - 30} ${dx + w * 0.8} ${ty - 22} ${dx + w} ${ty} C ${dx + w * 0.4} ${ty + 10} ${dx - w * 0.4} ${ty + 10} ${dx - w} ${ty} Z`, x, y, s), f));
  }
  return wrap(out.join(''), o);
}

/** A thistle: spiny leaves, a bulb and a flower tuft. ~170 tall. */
export function thistle(x: number, y: number, s: number, stem: string, flower: string, o?: Opts): string {
  const leaf = (ly: number, flip: boolean) =>
    P(xf(`M 0 ${ly} L 18 ${ly - 14} L 22 ${ly - 6} L 38 ${ly - 20} L 40 ${ly - 10} L 58 ${ly - 22} L 52 ${ly - 4} C 36 ${ly + 4} 16 ${ly + 4} 0 ${ly} Z`, x, y, s, flip), stem);
  const tuft: string[] = [];
  for (let i = 0; i < 9; i += 1) {
    const a = (-150 + i * 15) * (Math.PI / 180);
    const tx = Math.cos(a) * 38;
    const ty = -150 + Math.sin(a) * 38;
    tuft.push(S(`M ${r1(x)} ${r1(y - 144 * s)} L ${r1(x + tx * s)} ${r1(y + ty * s)}`, flower, 6 * s));
  }
  const g =
    S(xf('M 0 0 C 4 -40 -4 -90 0 -128', x, y, s), stem, 7 * s) +
    leaf(-40, false) +
    leaf(-72, true) +
    leaf(-100, false) +
    tuft.join('') +
    P(xf('M -18 -130 C -22 -150 22 -150 18 -130 C 14 -118 -14 -118 -18 -130 Z', x, y, s), stem) +
    P(xf('M -14 -126 L -24 -132 M 14 -126 L 24 -132', x, y, s), stem);
  return wrap(g, o);
}

/** A grape arbour: two posts, a beam, leaves along the top and hanging clusters in `grape`. */
export function arbor(x: number, y: number, s: number, wood: string, leaf: string, grape: string, o?: Opts): string {
  const f = ink(wood);
  const lf = ink(leaf);
  const out = [rect(x - 130 * s, y - 170 * s, 12 * s, 170 * s, f), rect(x + 118 * s, y - 170 * s, 12 * s, 170 * s, f), rect(x - 150 * s, y - 178 * s, 300 * s, 10 * s, f)];
  for (let i = 0; i < 9; i += 1) out.push(ellipse(x + (-150 + i * 37) * s, y - (186 - (i % 2) * 8) * s, 32 * s, 18 * s, lf));
  for (const gx of [-80, 0, 80]) {
    for (let row = 0; row < 4; row += 1) {
      const n = 4 - row;
      for (let i = 0; i < n; i += 1) out.push(circle(x + (gx + (i - (n - 1) / 2) * 13) * s, y - (160 - row * 12) * s, 7.5 * s, grape));
    }
  }
  return wrap(out.join(''), o);
}

/** A single vine stock: a twisted stem, a leafy head and two hanging clusters in `grape`. ~120 tall. */
export function vine(x: number, y: number, s: number, wood: string, grape: string, o?: Opts): string {
  const f = ink(wood);
  const cluster = (cx: number, cy: number) => {
    const out: string[] = [];
    for (let row = 0; row < 4; row += 1) {
      const n = 4 - row;
      for (let i = 0; i < n; i += 1) out.push(circle(x + (cx + (i - (n - 1) / 2) * 11) * s, y + (cy + row * 10) * s, 6.5 * s, grape));
    }
    return out.join('');
  };
  const g =
    S(xf('M 0 0 C -8 -20 8 -40 -2 -64 C -6 -74 -2 -84 0 -90', x, y, s), f, 9 * s) +
    ellipse(x - 30 * s, y - 96 * s, 34 * s, 20 * s, f) +
    ellipse(x + 28 * s, y - 100 * s, 36 * s, 22 * s, f) +
    ellipse(x, y - 118 * s, 30 * s, 18 * s, f) +
    ellipse(x - 52 * s, y - 84 * s, 20 * s, 12 * s, f) +
    ellipse(x + 54 * s, y - 86 * s, 20 * s, 12 * s, f) +
    cluster(-34, -82) +
    cluster(32, -84);
  return wrap(g, o);
}

/** A family tree: a trunk that keeps dividing, each branch ending in a round node. */
export function lineageTree(rand: () => number, x: number, y: number, s: number, wood: string, node: string, depth = 4, o?: Opts): string {
  const out: string[] = [];
  const knots: string[] = [];
  const grow = (x0: number, y0: number, ang: number, len: number, w: number, d: number) => {
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    out.push(S(`M ${r1(x0)} ${r1(y0)} Q ${r1((x0 + x1) / 2 + Math.cos(ang + 1.2) * len * 0.08)} ${r1((y0 + y1) / 2)} ${r1(x1)} ${r1(y1)}`, wood, w));
    if (d === 0) {
      knots.push(circle(x1, y1, 11 * s, node));
      return;
    }
    knots.push(circle(x1, y1, (5 + d * 1.4) * s, wood));
    const n = d >= 3 ? 2 : 2 + (rand() < 0.35 ? 1 : 0);
    const spread = 0.5 + d * 0.06;
    for (let i = 0; i < n; i += 1) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      grow(x1, y1, ang + t * spread * 2 + (rand() - 0.5) * 0.15, len * (0.74 + rand() * 0.08), w * 0.7, d - 1);
    }
  };
  grow(x, y, -Math.PI / 2, 92 * s, 16 * s, depth);
  return wrap(out.join('') + knots.join(''), o);
}

// ── objects ────────────────────────────────────────────────────────────────

/** A two-handled storage jar. ~104 tall. */
export function jar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    P(xf('M -15 -94 L 15 -94 L 14 -84 C 40 -74 44 -30 26 -6 L 18 0 L -18 0 L -26 -6 C -44 -30 -40 -74 -14 -84 Z', x, y, s), fill) +
    rect(x - 20 * s, y - 104 * s, 40 * s, 11 * s, fill, { rx: 3 * s }) +
    S(xf('M -14 -86 C -32 -90 -38 -72 -28 -62', x, y, s), fill, 6 * s) +
    S(xf('M 14 -86 C 32 -90 38 -72 28 -62', x, y, s), fill, 6 * s);
  return wrap(g, o);
}

/** A small jug with a spout (right) and a handle (left). ~70 tall. */
export function pitcher(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    P(xf('M -13 -60 L 10 -60 L 24 -70 L 17 -55 C 30 -44 32 -18 20 -4 L 14 0 L -14 0 L -20 -4 C -32 -18 -30 -44 -13 -56 Z', x, y, s), fill) +
    S(xf('M -15 -52 C -34 -50 -34 -24 -22 -18', x, y, s), fill, 6 * s);
  return wrap(g, o);
}

/** Torn pieces of a garment scattered around (x, y); `n` pieces, ~30 px each. */
export function clothPieces(rand: () => number, x: number, y: number, s: number, fill: string, n = 12, spread = 160, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const cx = x + (rand() - 0.5) * spread * s;
    const cy = y + (rand() - 0.5) * spread * 0.45 * s;
    const w = (24 + rand() * 12) * s;
    const h = (18 + rand() * 10) * s;
    const d =
      `M ${r1(cx - w / 2)} ${r1(cy - h / 2 + rand() * 4 * s)} L ${r1(cx + w / 2)} ${r1(cy - h / 2)} ` +
      `L ${r1(cx + w / 2 - rand() * 6 * s)} ${r1(cy + h / 2)} L ${r1(cx - w / 2 + rand() * 6 * s)} ${r1(cy + h / 2 - rand() * 4 * s)} Z`;
    out.push(rotate((rand() - 0.5) * 70, cx, cy, P(d, fill)));
  }
  return wrap(out.join(''), o);
}

/** An iron axe head (no handle); (x, y) is its centre, the socket left and the curved edge right. */
export function axeHead(x: number, y: number, s: number, fill: string, eye: string, o?: Opts): string {
  const g =
    P(xf('M -44 -15 L -8 -15 C 8 -15 18 -32 36 -44 C 48 -22 48 22 36 44 C 18 32 8 15 -8 15 L -44 15 C -52 15 -52 -15 -44 -15 Z', x, y, s), fill) +
    ellipse(x - 26 * s, y, 8 * s, 10 * s, eye);
  return wrap(g, o);
}

/** Jehoiada's offering chest with a hole bored in its lid. */
export function offeringChest(x: number, y: number, s: number, fill: string, hole: string, o?: Opts): string {
  const g =
    rect(x - 62 * s, y - 70 * s, 124 * s, 70 * s, fill, { rx: 4 * s }) +
    P(xf('M -66 -68 Q 0 -96 66 -68 Z', x, y, s), fill) +
    rect(x - 66 * s, y - 74 * s, 132 * s, 8 * s, fill, { rx: 3 * s }) +
    rect(x - 40 * s, y - 66 * s, 8 * s, 66 * s, '#FFFFFF', { opacity: 0.2 }) +
    rect(x + 32 * s, y - 66 * s, 8 * s, 66 * s, '#FFFFFF', { opacity: 0.2 }) +
    ellipse(x, y - 84 * s, 12 * s, 4 * s, hole);
  return wrap(g, o);
}

/** A flight of `n` steps rising to the right; each step 40 wide and 18 high. */
export function steps(x: number, y: number, s: number, fill: string, n = 10, o?: Opts): string {
  let d = `M ${r1(x)} ${r1(y)}`;
  for (let i = 0; i < n; i += 1) d += ` L ${r1(x + i * 40 * s)} ${r1(y - (i + 1) * 18 * s)} L ${r1(x + (i + 1) * 40 * s)} ${r1(y - (i + 1) * 18 * s)}`;
  d += ` L ${r1(x + n * 40 * s)} ${r1(y)} Z`;
  return P(d, fill, o);
}

/** Nehushtan: the bronze serpent wound around a pole. ~240 tall. */
export function serpentPole(x: number, y: number, s: number, pole: string, snake: string, o?: Opts): string {
  const g =
    rect(x - 5 * s, y - 214 * s, 10 * s, 214 * s, pole, { rx: 3 * s }) +
    rect(x - 34 * s, y - 206 * s, 68 * s, 8 * s, pole, { rx: 3 * s }) +
    S(xf('M -4 -40 C 40 -54 40 -78 0 -92 C -40 -106 -40 -128 0 -142 C 40 -156 40 -178 4 -192 C -14 -200 -22 -210 -14 -222', x, y, s), snake, 13 * s) +
    ellipse(x - 8 * s, y - 228 * s, 16 * s, 10 * s, snake) +
    P(xf('M -22 -230 L -34 -236 L -30 -226 Z', x, y, s), snake);
  return wrap(g, o);
}

/** A shepherd's crook standing upright; rotate it to lay it down. ~190 tall. */
export function crook(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return wrap(S(xf('M 0 0 L 0 -164 C 0 -196 40 -196 40 -168', x, y, s), fill, 8 * s), o);
}

/** A large key; (x, y) is the centre of its ring, the bit to the right. */
export function key(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(22 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(10 * s)}"/>` +
    rect(x + 20 * s, y - 6 * s, 112 * s, 12 * s, fill, { rx: 4 * s }) +
    rect(x + 104 * s, y + 4 * s, 11 * s, 26 * s, fill) +
    rect(x + 121 * s, y + 4 * s, 11 * s, 18 * s, fill);
  return wrap(g, o);
}

/** A stack of gold ingots, 4-3-2-1. */
export function ingots(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  [4, 3, 2, 1].forEach((n, row) => {
    for (let i = 0; i < n; i += 1) {
      const cx = (i - (n - 1) / 2) * 48;
      out.push(P(xf(`M ${cx - 23} 0 L ${cx + 23} 0 L ${cx + 17} -15 L ${cx - 17} -15 Z`, x, y - row * 17 * s, s), fill));
    }
  });
  return wrap(out.join(''), o);
}

/** A couch with a raised head end at the left. */
export function bed(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 110 * s, y - 42 * s, 220 * s, 14 * s, fill, { rx: 4 * s }) +
    rect(x - 104 * s, y - 30 * s, 9 * s, 30 * s, fill) +
    rect(x + 95 * s, y - 30 * s, 9 * s, 30 * s, fill) +
    rect(x - 116 * s, y - 84 * s, 13 * s, 56 * s, fill, { rx: 5 * s });
  return wrap(g, o);
}

/** A new two-wheeled cart with its shaft to the left; the bed is at y - 62s. */
export function cart(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const f = ink(fill);
  const spokes: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * i) / 3;
    spokes.push(S(`M ${r1(x)} ${r1(y - 32 * s)} L ${r1(x + Math.cos(a) * 30 * s)} ${r1(y - 32 * s + Math.sin(a) * 30 * s)}`, f, 4 * s));
  }
  const g =
    rect(x - 96 * s, y - 66 * s, 192 * s, 14 * s, f, { rx: 3 * s }) +
    S(xf('M -96 -60 L -180 -54', x, y, s), f, 7 * s) +
    `<circle cx="${r1(x)}" cy="${r1(y - 32 * s)}" r="${r1(31 * s)}" fill="none" stroke="${f}" stroke-width="${r1(7 * s)}"/>` +
    spokes.join('') +
    circle(x, y - 32 * s, 7 * s, f);
  return wrap(g, o);
}

/** Scaffolding: poles, planks and a brace, w wide and h high, standing on y. */
export function scaffold(x: number, y: number, w: number, h: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  const cols = Math.max(2, Math.round(w / 90) + 1);
  for (let i = 0; i < cols; i += 1) {
    const px = x - w / 2 + (i * w) / (cols - 1);
    out.push(S(`M ${r1(px)} ${r1(y)} L ${r1(px)} ${r1(y - h)}`, fill, 6 * s));
  }
  for (let j = 1; j <= Math.floor(h / 70); j += 1) out.push(S(`M ${r1(x - w / 2 - 10)} ${r1(y - j * 70 * s)} L ${r1(x + w / 2 + 10)} ${r1(y - j * 70 * s)}`, fill, 7 * s));
  out.push(S(`M ${r1(x - w / 2)} ${r1(y)} L ${r1(x + w / 2)} ${r1(y - h * 0.8)}`, fill, 4 * s, 0.8));
  return wrap(out.join(''), o);
}

/** A hewn stone block, a little of its top face showing. */
export function stoneBlock(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = rect(x - 44 * s, y - 40 * s, 88 * s, 40 * s, fill, { rx: 3 * s }) + P(xf('M -44 -40 L -30 -52 L 54 -52 L 44 -40 Z', x, y, s), fill, { opacity: 0.75 }) + P(xf('M 44 0 L 44 -40 L 54 -52 L 54 -12 Z', x, y, s), fill, { opacity: 0.85 });
  return wrap(g, o);
}

/** A pile of felled logs, 3-2-1, their cut ends to the right in `end`. */
export function logPile(x: number, y: number, s: number, fill: string, end: string, o?: Opts): string {
  const out: string[] = [];
  [3, 2, 1].forEach((n, row) => {
    for (let i = 0; i < n; i += 1) {
      const cy = y - (13 + row * 22) * s;
      const ox0 = x + ((i - (n - 1) / 2) * 6 - 90) * s;
      const len = 190 * s;
      out.push(rect(ox0, cy - 12 * s - (i - (n - 1) / 2) * 0 * s, len, 24 * s, fill, { rx: 11 * s }));
      out.push(ellipse(ox0 + len - 6 * s, cy, 9 * s, 12 * s, end));
    }
  });
  return wrap(out.join(''), o);
}

/** Concentric ripples on water around (x, y). */
export function ripples(x: number, y: number, s: number, stroke: string, n = 4, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const rx = (46 + i * 34) * s;
    out.push(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(rx * 0.2)}" fill="none" stroke="${stroke}" stroke-width="${r1((5 - i * 0.7) * s)}" opacity="${r1(0.9 - i * 0.16)}"/>`);
  }
  return wrap(out.join(''), o);
}

/** A whirlwind: a funnel of loose rings, narrow at (x, y) and opening upward over `h`. */
export function whirlwind(x: number, y: number, h: number, s: number, stroke: string, o?: Opts): string {
  const out: string[] = [];
  const n = 12;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const cx = x + Math.sin(t * 4) * 18 * s;
    const cy = y - t * h;
    const rx = (8 + t * t * 120) * s;
    out.push(
      `<path d="M ${r1(cx - rx)} ${r1(cy)} A ${r1(rx)} ${r1(rx * 0.2 + 3)} 0 1 0 ${r1(cx + rx * 0.9)} ${r1(cy - rx * 0.08)}" fill="none" stroke="${stroke}" stroke-width="${r1((3 + t * 3) * s)}" stroke-linecap="round" opacity="${r1(0.3 + t * 0.4)}"/>`,
    );
  }
  return wrap(out.join(''), o);
}

/** A wide camp tent of goat hair on poles, ridged roof dipping between the poles. ~190 wide. */
export function campTent(x: number, y: number, s: number, fill: string, door?: string, o?: Opts): string {
  const g =
    P(xf('M -96 0 L -88 -56 Q -66 -46 -46 -72 Q -24 -52 0 -78 Q 24 -52 46 -72 Q 66 -46 88 -56 L 96 0 Z', x, y, s), fill) +
    P(xf('M -16 0 L -12 -46 L 12 -46 L 16 0 Z', x, y, s), door ?? fill, { opacity: door ? 1 : 0.4 }) +
    S(xf('M -104 2 L -88 -56', x, y, s), fill, 3 * s) +
    S(xf('M 104 2 L 88 -56', x, y, s), fill, 3 * s);
  return wrap(g, o);
}

/** A standing idol on a plinth, one arm raised with a club (a Baal or Asherah image). ~210 tall. */
export function idol(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 36 * s, y - 26 * s, 72 * s, 26 * s, fill) +
    P(xf('M -22 -26 L -18 -134 L 18 -134 L 22 -26 Z', x, y, s), fill) +
    circle(x, y - 150 * s, 16 * s, fill) +
    P(xf('M -14 -160 L -9 -200 L 9 -200 L 14 -160 Z', x, y, s), fill) +
    S(xf('M -16 -124 L -40 -96', x, y, s), fill, 10 * s) +
    S(xf('M 16 -124 L 40 -158', x, y, s), fill, 10 * s) +
    S(xf('M 40 -158 L 52 -196', x, y, s), fill, 8 * s) +
    circle(x + 53 * s, y - 199 * s, 9 * s, fill);
  return wrap(g, o);
}

/** A column broken off part-way, with a fallen drum beside it. */
export function brokenColumn(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 26 * s, y - 14 * s, 52 * s, 14 * s, fill, { rx: 2 * s }) +
    P(xf('M -16 -12 L -16 -120 L -6 -134 L 4 -118 L 10 -128 L 16 -112 L 16 -12 Z', x, y, s), fill) +
    rect(x + 30 * s, y - 30 * s, 64 * s, 30 * s, fill, { rx: 6 * s });
  return wrap(g, o);
}

/** Loose stones and blocks scattered along y. */
export function rubble(rand: () => number, x: number, y: number, w: number, s: number, fill: string, n = 9, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const cx = x - w / 2 + rand() * w;
    const bw = (16 + rand() * 30) * s;
    const bh = (10 + rand() * 18) * s;
    out.push(rotate((rand() - 0.5) * 40, cx, y - bh / 2, rect(cx - bw / 2, y - bh, bw, bh, fill, { rx: 3 * s })));
  }
  return wrap(out.join(''), o);
}

/** A long straight trumpet; mouthpiece at (x, y), bell to the right. */
export function trumpet(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = rect(x, y - 3.5 * s, 120 * s, 7 * s, fill, { rx: 3 * s }) + P(xf('M 110 -4 L 140 -18 L 140 18 L 110 4 Z', x, y, s), fill) + ellipse(x + 140 * s, y, 5 * s, 18 * s, fill);
  return wrap(g, o);
}

/** A cloak / mantle falling open; (x, y) is its collar. ~110 long. */
export function mantle(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    P(xf('M -28 0 C -12 -10 12 -10 28 0 C 34 24 42 56 52 104 C 38 98 28 108 14 100 C 2 110 -14 100 -26 108 C -38 100 -46 106 -52 100 C -44 64 -38 30 -28 0 Z', x, y, s), fill) +
    S(xf('M -6 6 C -8 40 -10 70 -14 96', x, y, s), '#FFFFFF', 3 * s, 0.22) +
    S(xf('M 12 8 C 16 40 20 70 26 94', x, y, s), '#FFFFFF', 3 * s, 0.22);
  return wrap(g, o);
}

/** A wall over the whole frame with a window cut out of it: the scene behind shows only through the opening. */
export function wallWithWindow(fill: string, wx: number, wy: number, ww: number, wh: number, o?: Opts): string {
  const W0 = -200;
  const W1 = 1700;
  const d =
    `M ${W0} -200 L ${W1} -200 L ${W1} 1100 L ${W0} 1100 Z ` +
    `M ${r1(wx)} ${r1(wy + wh)} L ${r1(wx)} ${r1(wy + ww * 0.3)} Q ${r1(wx + ww / 2)} ${r1(wy - ww * 0.12)} ${r1(wx + ww)} ${r1(wy + ww * 0.3)} L ${r1(wx + ww)} ${r1(wy + wh)} Z`;
  return `<path d="${d}" fill="${fill}" fill-rule="evenodd"${op(o)}/>`;
}

/** A pair of brass weights / silver talents: round loaves of metal. */
export function talents(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    ellipse(x - 30 * s, y - 14 * s, 34 * s, 14 * s, fill) +
    rect(x - 64 * s, y - 14 * s, 68 * s, 14 * s, fill) +
    ellipse(x - 30 * s, y - 28 * s, 34 * s, 12 * s, fill, { opacity: 0.85 }) +
    ellipse(x + 34 * s, y - 14 * s, 30 * s, 12 * s, fill) +
    rect(x + 4 * s, y - 14 * s, 60 * s, 14 * s, fill) +
    ellipse(x + 34 * s, y - 26 * s, 30 * s, 10 * s, fill, { opacity: 0.85 });
  return wrap(g, o);
}
