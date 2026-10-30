/**
 * Motifs for the Spreuken, Openbaring, Amos and Micha cover series that the
 * shared library (`quiz-cover-primitives.mts`) does not have: an ant, a
 * balance, a treasure chest, a jar, an eagle, a standing lion, a lampstand,
 * a harp, a horned altar, a shofar and a trumpet, a many-headed beast, a
 * plumb line, a key and a chain, a sickle, an anvil, a sword, a plowshare,
 * a smelting kiln, a thistle, a booth, a house front, a city gate, a golden
 * city, a bowl of apples and a sealed scroll.
 *
 * Same conventions as the primitives: flat silhouettes, no faces, `y` is the
 * ground a motif stands on (the centre for things in the air), `s = 1` is the
 * natural size. Every motif is drawn in its own local units and placed with
 * `at`, so the primitives' size rules (a wide shape in a depth colour becomes
 * a hill or a wall) never repaint it. Living things go through `ink`, so a
 * depth colour becomes the dark silhouette the way people and animals do.
 */

import { at, box, broadWing, circ, ell, figure, flame as aFlame, line, mix, p, sapling as aSapling, sheep as aSheep, star4 } from './cover-options/shapes.mjs';
import { ink } from './quiz-cover-primitives.mjs';
import type { C } from './quiz-cover-scene-kit.mjs';

type Opts = { opacity?: number };
type Place = Opts & { rot?: number; flip?: boolean };

const n = (v: number) => (Math.round(v * 10) / 10).toString();
const place = (x: number, y: number, s: number, inner: string, o?: Place) => at(x, y, s, inner, { opacity: o?.opacity, rot: o?.rot, flip: o?.flip });

// ── helpers ────────────────────────────────────────────────────────────────

/** Mirror a fragment about the vertical line through `x` (people only face one way). */
export function flipX(x: number, inner: string): string {
  return `<g transform="translate(${n(2 * x)} 0) scale(-1 1)">${inner}</g>`;
}

/** The mid tone the light style paints buildings in: `t` toward the silhouette colour. */
export function wallTone(c: C, t = 0.32): string {
  return mix(c.a.mid, c.a.figure, t);
}

/** A soft light tone for stone, ivory or silver against the darker layers. */
export function paleTone(c: C, t = 0.25): string {
  return mix('#FFFFFF', c.a.mid, t);
}

/** A round-capped stroke in scene coordinates. */
export function stroke(d: string, color: string, w: number, opacity = 1): string {
  return line(d, color, w, opacity !== 1 ? `opacity="${opacity}"` : '');
}

/** A four-pointed star (accent star, Pleiades, the morning star). */
export function star(x: number, y: number, r: number, fill: string, o?: Opts): string {
  return at(x, y, 1, star4(r, fill), { opacity: o?.opacity });
}

/** A sun disc cut off at `y`: the top half of a sun rising out of (or setting into) the sea. */
export function halfSun(c: C, x: number, y: number, r: number, fill: string): string {
  const id = c.id('half');
  c.defs.push(`<clipPath id="${id}"><rect x="${n(x - r - 2)}" y="${n(y - r - 2)}" width="${n(2 * r + 4)}" height="${n(r + 2)}"/></clipPath>`);
  return `<g clip-path="url(#${id})">${circ(x, y, r, fill)}</g>`;
}

/** A jagged bolt hanging down from (x, y). */
export function bolt(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return place(x, y, s, p('M 0 0 L -26 80 L -4 74 L -34 170 L 24 66 L 2 72 L 22 0 Z', fill), o);
}

// ── people ─────────────────────────────────────────────────────────────────

/** A standing figure holding a tall staff (shepherd, measuring reed); `staffFill` may be the accent. Same size as `person`. */
export function staffBearer(x: number, y: number, s: number, fill: string, staffFill?: string, o?: Place): string {
  const f = ink(fill);
  return place(x, y, s * (134 / 204), figure(f, 'staff', { staffFill: staffFill ?? f }), o);
}

// ── animals ────────────────────────────────────────────────────────────────

/** An ant walking right, about 110 wide at s = 1; `carry` puts a grain in its jaws. */
export function ant(x: number, y: number, s: number, fill: string, carry?: string, o?: Place): string {
  const f = ink(fill);
  const leg = (d: string) => line(d, f, 4.5);
  const g =
    leg('M 10 -24 L 26 -44 L 42 0') +
    leg('M 2 -22 L 2 -46 L -10 0') +
    leg('M -6 -22 L -26 -46 L -52 0') +
    ell(-46, -30, 29, 18, f, 'transform="rotate(-14 -46 -30)"') +
    circ(-14, -27, 6, f) +
    ell(4, -29, 16, 10, f, 'transform="rotate(-10 4 -29)"') +
    circ(30, -35, 13, f) +
    p('M 38 -31 L 52 -25 L 40 -23 Z', f) +
    line('M 32 -46 C 38 -64 50 -72 62 -68', f, 3.6) +
    line('M 26 -47 C 26 -66 34 -78 46 -82', f, 3.6) +
    (carry ? ell(60, -32, 15, 10, carry, 'transform="rotate(-20 60 -32)"') : '');
  return place(x, y, s, g, o);
}

/** An eagle soaring, seen from below, centre at (x, y); 350 wide at s = 1. */
export function eagle(x: number, y: number, s: number, fill: string, o?: Place): string {
  const f = ink(fill);
  const wing = (k: number) =>
    p(
      `M ${8 * k} -16 C ${52 * k} -54 ${112 * k} -64 ${176 * k} -52 L ${164 * k} -42 L ${176 * k} -34 L ${154 * k} -26 L ${164 * k} -16 ` +
        `L ${138 * k} -12 L ${144 * k} -2 L ${112 * k} -6 C ${80 * k} 0 ${42 * k} 8 ${8 * k} 12 Z`,
      f,
    );
  const g = wing(1) + wing(-1) + p('M -12 26 L 12 26 L 28 64 L 0 56 L -28 64 Z', f) + ell(0, 4, 16, 32, f) + circ(0, -32, 13, f) + p('M -5 -24 L 5 -24 L 0 -12 Z', f);
  return place(x, y, s, g, o);
}

/** A lion standing (or roaring) facing right; about 250 long, 175 tall at s = 1. `mane` may be the accent. */
export function standingLion(x: number, y: number, s: number, body: string, mane?: string, o?: Place & { roar?: boolean }): string {
  const b = ink(body);
  const m = mane ?? b;
  const jaw = o?.roar
    ? p('M 98 -150 C 116 -156 134 -146 140 -132 L 120 -124 L 142 -112 C 136 -98 116 -94 100 -102 Z', b)
    : p('M 98 -150 C 116 -156 136 -146 140 -126 C 140 -108 118 -98 100 -104 Z', b);
  const g =
    line('M -88 -92 C -122 -104 -132 -66 -118 -46', b, 8) +
    ell(-118, -42, 9, 12, b) +
    box(-84, -78, 22, 78, b, 9) +
    box(-56, -74, 19, 74, b, 8) +
    box(34, -76, 19, 76, b, 8) +
    box(60, -80, 22, 80, b, 9) +
    p('M -96 -86 C -96 -126 -40 -132 10 -128 C 52 -126 86 -118 90 -90 C 92 -64 62 -56 10 -58 C -40 -60 -96 -54 -96 -86 Z', b) +
    circ(76, -128, 50, m) +
    circ(92, -158, 13, m) +
    circ(96, -128, 30, b) +
    jaw +
    circ(84, -160, 9, b);
  return place(x, y, s, g, o);
}

/** A lamb (or sheep) facing right, 70 tall at s = 1; the body is usually light, the head dark. */
export function lamb(x: number, y: number, s: number, body: string, head: string, o?: Place): string {
  return place(x, y, s, aSheep(body, ink(head)), o);
}

/**
 * A beast with several heads on long necks fanned over its back, facing
 * right; about 330 long at s = 1. `wings` makes it the dragon, `crowns`
 * puts a small diadem on every head.
 */
export function beast(
  x: number,
  y: number,
  s: number,
  fill: string,
  o?: Place & { heads?: number; wings?: boolean; crowns?: string; fan?: [number, number] },
): string {
  const f = ink(fill);
  const heads = o?.heads ?? 7;
  const [from, to] = o?.fan ?? [-122, -10];
  const out: string[] = [];
  if (o?.wings) {
    out.push(at(-40, -96, 1, broadWing(f, 170, 1.4), { rot: -40, opacity: 0.8 }), at(-6, -100, 1, broadWing(f, 150, 1.3), { rot: -8 }));
  }
  out.push(p('M -70 -90 C -140 -88 -190 -54 -246 -36 C -258 -32 -256 -24 -244 -25 C -188 -30 -136 -44 -70 -44 Z', f));
  out.push(box(-82, -60, 26, 60, f, 10), box(-42, -54, 22, 54, f, 10), box(34, -54, 22, 54, f, 10), box(70, -60, 26, 60, f, 10));
  out.push(ell(0, -76, 104, 48, f));
  for (let i = 0; i < heads; i += 1) {
    const t = heads === 1 ? 0.5 : i / (heads - 1);
    const deg = from + t * (to - from);
    const a = (deg * Math.PI) / 180;
    const R = 112 + (1 - Math.abs(t - 0.5) * 2) * 34;
    const hx = 60 + Math.cos(a) * R;
    const hy = -100 + Math.sin(a) * R;
    const mx = 60 + Math.cos(a) * R * 0.5 + 14;
    const my = -100 + Math.sin(a) * R * 0.5 - 4;
    out.push(line(`M 52 -96 Q ${n(mx)} ${n(my)} ${n(hx)} ${n(hy)}`, f, 16));
    const head =
      ell(6, 0, 19, 12, f) +
      p('M 14 -7 L 40 1 L 14 9 Z', f) +
      line('M -2 -9 L -10 -26 M 8 -10 L 6 -28', f, 4) +
      (o?.crowns ? p('M -14 -18 L -16 -36 L -7 -27 L 0 -40 L 7 -27 L 16 -36 L 14 -18 Z', o.crowns) : '');
    out.push(`<g transform="translate(${n(hx)} ${n(hy)}) rotate(${n(deg * 0.45 + 10)})">${head}</g>`);
  }
  return place(x, y, s, out.join(''), o);
}

// ── plants ─────────────────────────────────────────────────────────────────

/** A palm branch held up: stem and leaflets, 125 tall at s = 1. */
export function palmFrond(x: number, y: number, s: number, fill: string, o?: Place): string {
  const out = [line('M 0 0 C 2 -40 3 -80 0 -124', fill, 4.5)];
  for (let i = 0; i < 10; i += 1) {
    const t = i / 9;
    const py = -22 - t * 98;
    const len = 36 * (1 - t * 0.62);
    out.push(line(`M 1 ${n(py)} L ${n(-len)} ${n(py - len * 0.55)}`, fill, 3.8), line(`M 1 ${n(py)} L ${n(len)} ${n(py - len * 0.55)}`, fill, 3.8));
  }
  return place(x, y, s, out.join(''), o);
}

/** A thistle: spiny leaves and a flower head in `bloom`; 125 tall at s = 1. */
export function thistle(x: number, y: number, s: number, stem: string, bloom: string, o?: Place): string {
  const out = [
    line('M 0 0 C 3 -30 -3 -60 0 -88', stem, 5),
    p('M 0 -26 L -32 -44 L -17 -39 L -36 -60 L -8 -42 Z', stem),
    p('M 0 -48 L 30 -64 L 17 -58 L 34 -80 L 6 -62 Z', stem),
    ell(0, -94, 12, 11, stem),
  ];
  for (let i = -3; i <= 3; i += 1) {
    const a = (i * 16 * Math.PI) / 180;
    out.push(line(`M 0 -100 L ${n(Math.sin(a) * 26)} ${n(-100 - Math.cos(a) * 26)}`, bloom, 6));
  }
  return place(x, y, s, out.join(''), o);
}

/** A young tree tied to a straight stake. */
export function stakedSapling(x: number, y: number, s: number, plant: string, stake: string, o?: Place): string {
  const g = line('M 16 6 L 16 -150', stake, 6) + line('M 2 -50 L 16 -54 M 0 -96 L 16 -100', stake, 3) + at(0, 0, 1.45, aSapling(plant, plant));
  return place(x, y, s, g, o);
}

// ── objects ────────────────────────────────────────────────────────────────

/** An open treasure chest heaped with gold, 130 wide at s = 1. */
export function treasureChest(x: number, y: number, s: number, wood: string, gold: string, o?: Place): string {
  const g =
    p('M -64 -64 L -78 -120 Q -14 -152 50 -128 L 64 -64 Z', wood) +
    ell(0, -66, 60, 16, gold) +
    circ(-28, -80, 12, gold) +
    circ(0, -88, 13, gold) +
    circ(26, -80, 12, gold) +
    circ(-10, -100, 10, gold) +
    circ(14, -102, 9, gold) +
    box(-66, -66, 132, 66, wood, 6) +
    box(-9, -54, 18, 20, gold, 3) +
    ell(90, -4, 13, 5, gold) +
    ell(112, -3, 10, 4, gold) +
    ell(-92, -4, 12, 5, gold);
  return place(x, y, s, g, o);
}

/** A clay water jar with a handle, 105 tall at s = 1. */
export function jar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g =
    p('M -16 0 C -40 -22 -42 -62 -20 -82 L -13 -96 L 13 -96 L 20 -82 C 42 -62 40 -22 16 0 Z', fill) +
    box(-19, -105, 38, 11, fill, 5) +
    line('M 15 -92 C 42 -92 44 -66 28 -56', fill, 7);
  return place(x, y, s, g, o);
}

/** A balance on a stand, 200 tall at s = 1. `tilt` (degrees) lowers the right pan. */
export function balance(x: number, y: number, s: number, frame: string, pans: string, tilt = 0, o?: Place): string {
  const a = (tilt * Math.PI) / 180;
  const pan = (side: number) => {
    const ex = side * 96 * Math.cos(a);
    const ey = -176 + side * 96 * Math.sin(a);
    const py = ey + 78;
    return (
      line(`M ${n(ex)} ${n(ey)} L ${n(ex - 34)} ${n(py)} M ${n(ex)} ${n(ey)} L ${n(ex + 34)} ${n(py)}`, frame, 2.8) +
      p(`M ${n(ex - 44)} ${n(py)} Q ${n(ex)} ${n(py + 36)} ${n(ex + 44)} ${n(py)} Z`, pans)
    );
  };
  const g =
    p('M -46 0 L 46 0 L 28 -16 L -28 -16 Z', frame) +
    box(-5, -180, 10, 166, frame) +
    `<g transform="rotate(${n(tilt)} 0 -176)">${box(-104, -181, 208, 10, frame, 4)}</g>` +
    circ(0, -192, 11, frame) +
    pan(-1) +
    pan(1);
  return place(x, y, s, g, o);
}

/** A wooden ard: handle, share in the furrow, beam reaching right to the yoke. */
export function plough(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g = line('M -64 -104 L -22 -8', fill, 8) + line('M -80 -106 L -52 -100', fill, 7) + line('M -38 -40 L 124 -76', fill, 8) + p('M -38 -16 L 30 -1 L -30 5 Z', fill);
  return place(x, y, s, g, o);
}

/** An anvil on a block, 118 tall at s = 1, horn to the left. */
export function anvil(x: number, y: number, s: number, fill: string, block?: string, o?: Place): string {
  const g =
    p('M -34 0 L -28 -44 L 28 -44 L 34 0 Z', block ?? fill) +
    p('M -40 -118 L 58 -118 L 58 -104 L 24 -96 L 20 -66 L 40 -52 L 40 -42 L -40 -42 L -40 -52 L -20 -66 L -22 -96 L -40 -104 Z', fill) +
    p('M -40 -118 L -40 -104 C -64 -106 -86 -110 -108 -116 C -86 -118 -64 -118 -40 -118 Z', fill);
  return place(x, y, s, g, o);
}

/** A sword lying point-right with the guard at (x, y); rotate with `rot`. 210 long at s = 1. */
export function sword(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g = circ(-34, 0, 8, fill) + box(-30, -4.5, 30, 9, fill, 3) + box(0, -18, 9, 36, fill, 3) + p('M 9 -7 L 150 -7 L 176 0 L 150 7 L 9 7 Z', fill);
  return place(x, y, s, g, o);
}

/** A smith's hammer with the grip end at (x, y), head up. */
export function hammer(x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, line('M 0 0 L 0 -92', fill, 8) + box(-26, -110, 52, 22, fill, 4), o);
}

/** A plowshare: socket on the left, broad blade to the point on the right. */
export function plowshare(x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, box(-78, -10, 32, 20, fill, 6) + p('M -50 -24 C -10 -24 30 -12 66 0 C 30 12 -10 24 -50 24 Z', fill), o);
}

/** A lampstand with a burning lamp on top, 170 tall at s = 1. */
export function lampstand(x: number, y: number, s: number, stand: string, fire: string, o?: Place): string {
  const g =
    p('M -28 0 L 28 0 L 12 -16 L -12 -16 Z', stand) +
    box(-4.5, -124, 9, 112, stand) +
    ell(0, -54, 11, 5, stand) +
    ell(0, -92, 10, 5, stand) +
    p('M -26 -126 Q 0 -102 26 -126 Z', stand) +
    at(0, -122, 1, aFlame(46, 26, fire));
  return place(x, y, s, g, o);
}

/** A standing harp, 140 tall at s = 1. */
export function harp(x: number, y: number, s: number, fill: string, o?: Place): string {
  const strings: string[] = [];
  for (let i = 1; i <= 5; i += 1) {
    const sx = -34 + i * 12;
    const yt = -128 + ((sx + 42) / 84) * 16 + 6;
    const yb = -112 + 112 * ((42 - sx) / 72) - 4;
    strings.push(line(`M ${n(sx)} ${n(yt)} L ${n(sx)} ${n(yb)}`, fill, 2.6));
  }
  const g =
    strings.join('') +
    p('M 34 -118 L 50 -108 L -20 4 L -40 0 Z', fill) +
    line('M -36 0 L -42 -128', fill, 8) +
    line('M -42 -128 C -26 -146 -6 -118 14 -120 C 30 -122 40 -130 46 -112', fill, 9);
  return place(x, y, s, g, o);
}

/** A horned altar, 128 tall at s = 1. */
export function altar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g =
    box(-62, -12, 124, 12, fill, 2) +
    box(-48, -94, 96, 84, fill) +
    box(-60, -106, 120, 14, fill, 3) +
    p('M -60 -104 L -60 -128 L -40 -104 Z', fill) +
    p('M 60 -104 L 60 -128 L 40 -104 Z', fill);
  return place(x, y, s, g, o);
}

/** A ram's-horn shofar, mouthpiece at (x, y), curving up to the bell on the right. */
export function shofar(x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, p('M 0 -4 C 50 -8 92 -32 108 -80 L 130 -72 C 112 -18 58 10 0 5 Z', fill), o);
}

/** A straight trumpet, mouthpiece at (x, y), bell to the right; rotate with `rot`. */
export function trumpet(x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, box(-8, -5, 10, 10, fill, 2) + p('M 0 -3.5 L 140 -6 C 152 -8 160 -18 168 -28 L 168 28 C 160 18 152 8 140 6 L 0 3.5 Z', fill), o);
}

/** A plumb line hanging from (x, yTop) with its bob at yBob. */
export function plumbLine(x: number, yTop: number, yBob: number, s: number, cord: string, bob: string, o?: Opts): string {
  const g = line(`M ${n(x)} ${n(yTop)} L ${n(x)} ${n(yBob)}`, cord, 3.4 * s) + at(x, yBob, s, box(-6, -6, 12, 9, bob, 2) + p('M -13 0 L 13 0 L 20 16 L 0 56 L -20 16 Z', bob));
  return o?.opacity !== undefined ? `<g opacity="${o.opacity}">${g}</g>` : g;
}

/** A key: the bow at (x, y), the bit to the right. */
export function key(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g = `<circle cx="0" cy="0" r="22" fill="none" stroke="${fill}" stroke-width="11"/>` + box(18, -6.5, 124, 13, fill, 4) + box(112, 4, 12, 28, fill, 2) + box(130, 4, 12, 20, fill, 2);
  return place(x, y, s, g, o);
}

/** A heavy chain from (x0, y0) to (x1, y1). */
export function chain(x0: number, y0: number, x1: number, y1: number, s: number, fill: string, o?: Opts): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.max(1, Math.round(len / (24 * s)));
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const out: string[] = [];
  for (let i = 0; i <= k; i += 1) {
    const cx = x0 + (dx * i) / k;
    const cy = y0 + (dy * i) / k;
    out.push(
      i % 2 === 0
        ? `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(16 * s)}" ry="${n(9 * s)}" fill="none" stroke="${fill}" stroke-width="${n(5.5 * s)}" transform="rotate(${n(deg)} ${n(cx)} ${n(cy)})"/>`
        : `<rect x="${n(cx - 15 * s)}" y="${n(cy - 3 * s)}" width="${n(30 * s)}" height="${n(6 * s)}" rx="${n(3 * s)}" fill="${fill}" transform="rotate(${n(deg)} ${n(cx)} ${n(cy)})"/>`,
    );
  }
  const g = out.join('');
  return o?.opacity !== undefined ? `<g opacity="${o.opacity}">${g}</g>` : g;
}

/** A sickle: the grip end at (x, y), the blade curving up and right. */
export function sickle(x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, box(-6, -56, 12, 56, fill, 5) + p('M -2 -52 C 6 -118 88 -144 124 -94 C 84 -120 30 -102 10 -50 Z', fill), o);
}

/** A shallow bowl (a vial of wrath, a wine bowl), 92 wide at s = 1. */
export function bowl(x: number, y: number, s: number, fill: string, o?: Place): string {
  return place(x, y, s, p('M -46 -22 L 46 -22 C 42 4 -42 4 -46 -22 Z', fill) + ell(0, -22, 46, 7, fill) + box(-14, -4, 28, 6, fill, 3), o);
}

/** A crucible with molten metal, 34 tall at s = 1. */
export function crucible(x: number, y: number, s: number, fill: string, molten: string, o?: Place): string {
  return place(x, y, s, p('M -28 -36 L 28 -36 L 19 0 L -19 0 Z', fill) + ell(0, -36, 28, 8, molten), o);
}

/** A rolled scroll sealed with seven seals, centred at (x, y), 180 wide at s = 1. */
export function sealedScroll(x: number, y: number, s: number, paper: string, seal: string, o?: Place): string {
  const out = [box(-80, -24, 160, 48, paper, 22), box(-94, -7, 16, 14, paper, 4), box(78, -7, 16, 14, paper, 4)];
  for (let i = 0; i < 7; i += 1) {
    const sx = -60 + i * 20;
    out.push(line(`M ${sx} 18 L ${sx} 34`, seal, 3), circ(sx, 38, 7, seal));
  }
  return place(x, y, s, out.join(''), o);
}

/** A silver bowl on a foot, heaped with apples. */
export function fruitBowl(x: number, y: number, s: number, bowlFill: string, fruit: string, o?: Place): string {
  const out: string[] = [];
  const apples: [number, number, number][] = [
    [-60, -86, 21], [-21, -92, 23], [21, -92, 23], [60, -86, 21],
    [-40, -122, 21], [0, -128, 22], [40, -122, 21], [-19, -156, 19], [19, -156, 19],
  ];
  for (const [ax, ay, r] of apples) out.push(circ(ax, ay, r, fruit), line(`M ${ax + 2} ${ay - r + 2} L ${ax + 6} ${ay - r - 8}`, bowlFill, 3));
  out.push(p('M -102 -80 L 102 -80 C 92 -34 -92 -34 -102 -80 Z', bowlFill), ell(0, -80, 102, 9, bowlFill), p('M -30 0 L 30 0 L 10 -44 L -10 -44 Z', bowlFill));
  return place(x, y, s, out.join(''), o);
}

// ── buildings ──────────────────────────────────────────────────────────────

/** A flat-roofed house front, 230 wide and 166 tall at s = 1, door on the right, window on the left. */
export function houseFront(x: number, y: number, s: number, wall: string, o?: Place & { door?: string; window?: string; lattice?: string }): string {
  const out = [box(-114, -152, 228, 152, wall), box(-124, -168, 248, 20, wall, 3)];
  out.push(p('M 34 0 L 34 -70 C 34 -100 86 -100 86 -70 L 86 0 Z', o?.door ?? mix(wall, '#000000', 0.25)));
  if (o?.window) {
    out.push(box(-82, -122, 64, 52, o.window, 3));
    if (o.lattice) out.push(line('M -82 -96 L -18 -96 M -61 -122 L -61 -70 M -39 -122 L -39 -70', o.lattice, 4));
  }
  return place(x, y, s, out.join(''), o);
}

/** A city wall with a gate tower in the middle; the gateway is filled with `opening`. 1120 wide at s = 1. */
export function gateWall(x: number, y: number, s: number, wall: string, opening: string, o?: Place): string {
  const out = [box(-560, -130, 1120, 130, wall)];
  for (let cx = -556; cx < 556; cx += 34) if (Math.abs(cx + 10) > 150) out.push(box(cx, -150, 20, 22, wall));
  out.push(box(-140, -292, 280, 292, wall));
  for (let cx = -140; cx < 140; cx += 40) out.push(box(cx, -314, 24, 24, wall));
  out.push(p('M -66 0 L -66 -150 C -66 -224 66 -224 66 -150 L 66 0 Z', opening));
  return place(x, y, s, out.join(''), o);
}

/** A smelting kiln with a glowing mouth, 196 tall at s = 1. */
export function kiln(x: number, y: number, s: number, fill: string, fire: string, o?: Place): string {
  const g =
    box(-18, -198, 36, 52, fill, 3) +
    p('M -94 0 L -94 -72 C -94 -142 -44 -166 0 -166 C 44 -166 94 -142 94 -72 L 94 0 Z', fill) +
    p('M -44 0 L -44 -50 C -44 -84 44 -84 44 -50 L 44 0 Z', fire) +
    at(0, 2, 1, aFlame(60, 50, '#FFFFFF'), { opacity: 0.6 });
  return place(x, y, s, g, o);
}

/** A booth of posts and leafy branches - the hut of David raised up again. */
export function booth(x: number, y: number, s: number, wood: string, leaf: string, o?: Place): string {
  const out = [
    box(-58, -124, 8, 124, wood, 2, 'opacity="0.6"'),
    box(50, -124, 8, 124, wood, 2, 'opacity="0.6"'),
    box(-90, -132, 10, 132, wood, 3),
    box(80, -132, 10, 132, wood, 3),
    box(-104, -140, 208, 10, wood, 4),
  ];
  for (let i = 0; i < 10; i += 1) out.push(ell(-104 + i * 23, -146 - (i % 2) * 7, 22, 12, leaf));
  return place(x, y, s, out.join(''), o);
}

/** The new Jerusalem: a walled city of gold with three open gates, 470 wide at s = 1. */
export function goldenCity(x: number, y: number, s: number, fill: string, gate: string, o?: Place): string {
  const out: string[] = [];
  const tops: [number, number][] = [[-160, 168], [-104, 214], [-46, 252], [16, 232], [74, 262], [132, 206], [180, 160]];
  for (const [bx, h] of tops) out.push(box(bx - 25, -h, 50, h, fill, 3));
  out.push(p('M -72 -250 C -72 -294 -20 -294 -20 -250 Z', fill), p('M 48 -262 C 48 -300 100 -300 100 -262 Z', fill));
  out.push(box(-214, -118, 428, 118, fill));
  for (let cx = -214; cx < 210; cx += 30) out.push(box(cx, -134, 18, 18, fill));
  out.push(box(-240, -168, 54, 168, fill, 3), box(186, -168, 54, 168, fill, 3));
  for (const gx of [-110, 0, 110]) out.push(p(`M ${gx - 22} 0 L ${gx - 22} -56 C ${gx - 22} -86 ${gx + 22} -86 ${gx + 22} -56 L ${gx + 22} 0 Z`, gate));
  return place(x, y, s, out.join(''), o);
}

/** A rainbow arc of three soft bands, centred on (x, y). */
export function rainbow(x: number, y: number, r: number, w: number, color: string, opacity = 0.5): string {
  const arc = (rr: number, op: number, ww: number) =>
    `<path d="M ${n(x - rr)} ${n(y)} A ${n(rr)} ${n(rr)} 0 0 1 ${n(x + rr)} ${n(y)}" fill="none" stroke="${color}" stroke-width="${n(ww)}" opacity="${n(op)}"/>`;
  return arc(r + w * 1.2, opacity * 0.5, w * 0.7) + arc(r, opacity, w) + arc(r - w * 1.2, opacity * 0.7, w * 0.8);
}
