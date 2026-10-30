/**
 * Motifs for the Leviticus and Numeri covers that the shared primitives do
 * not have: the tabernacle and its court, the altar, the ark, the lampstand,
 * the table of showbread, censers, trumpets and the shofar, the priest's
 * garments, Aaron's budding rod, the bronze serpent, booths and so on.
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, `y` is
 * the ground a motif stands on, `s = 1` is the natural size. These draw with
 * the raw shape helpers, so a large altar or rock keeps the colour it is
 * given instead of being remapped to a light hill or wall tone.
 */

import { ink } from './quiz-cover-primitives.mjs';
import {
  at,
  box,
  broadWing,
  circ,
  ell,
  figure,
  flame as aFlame,
  kneeler,
  mix,
  p,
  prostrate,
  sheep as aSheep,
  sitter,
  type Pose as FigurePose,
} from './cover-options/shapes.mjs';

type Opts = { opacity?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const wrap = (g: string, o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g);

/** A round-capped stroke along a path. */
export function stroke(d: string, color: string, w: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${
    opacity !== 1 ? ` opacity="${opacity}"` : ''
  }/>`;
}

// ── people ─────────────────────────────────────────────────────────────────

/**
 * A robed figure with every pose of the option-A figure (including `staff`
 * and `bless`), optionally mirrored. Same size as `person` (s = 1 is 134px).
 */
export function fig(
  x: number,
  y: number,
  s: number,
  fill: string,
  pose: FigurePose = 'stand',
  o: { flip?: boolean; opacity?: number; staffFill?: string; hood?: boolean } = {},
): string {
  const k = s * (134 / 204);
  return at(x, y, k, figure(ink(fill), pose, { staffFill: o.staffFill ? ink(o.staffFill) : undefined, hood: o.hood }), {
    flip: o.flip,
    opacity: o.opacity,
  });
}

/** A kneeling figure (as `person(..., 'kneel' | 'bow')`), optionally facing left. */
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

/**
 * The high priest's dress over a standing figure drawn with the same x, y, s:
 * the breastplate with its twelve stones on the chest and the linen turban.
 */
export function priestGarb(x: number, y: number, s: number, plate: string | null, turban: string, o: { flip?: boolean } = {}): string {
  const k = s * (134 / 204);
  const parts: string[] = [];
  if (plate) {
    const deep = mix(plate, '#000000', 0.28);
    parts.push(box(-16, -146, 32, 38, plate, 3));
    for (let r = 0; r < 4; r += 1) for (let q = 0; q < 3; q += 1) parts.push(box(-11 + q * 8, -141 + r * 8.4, 6, 6.2, deep, 1.4));
    parts.push(box(-30, -102, 60, 7, plate, 3));
  }
  parts.push(box(-18, -206, 36, 17, turban, 7), ell(0, -204, 17, 7, turban));
  return at(x, y, k, parts.join(''), { flip: o.flip });
}

/** Lying face-down (as `person(..., 'fallen')`), optionally facing left. */
export function fallen(x: number, y: number, s: number, fill: string, o: { flip?: boolean; opacity?: number } = {}): string {
  return at(x, y, s * 0.72, prostrate(ink(fill)), { flip: o.flip, opacity: o.opacity });
}

/** Seated on the ground, front view (as `person(..., 'sit')`). */
export function seated(x: number, y: number, s: number, fill: string, o: { opacity?: number } = {}): string {
  return at(x, y, s * 0.95, sitter(ink(fill), 0), { opacity: o.opacity });
}

/** A mother holding a swaddled child against her shoulder. */
export function motherAndChild(x: number, y: number, s: number, fill: string, cloth: string, o: { flip?: boolean } = {}): string {
  const k = s * (134 / 204);
  const g =
    figure(ink(fill), 'carry') +
    `<g transform="rotate(-28 18 -124)">${ell(18, -124, 30, 14, cloth)}${circ(44, -126, 10, cloth)}</g>`;
  return at(x, y, k, g, { flip: o.flip });
}

/** An angel with the drawn sword, arm stretched out; faces right unless flipped. */
export function angelWithSword(x: number, y: number, s: number, fill: string, blade: string, o: { flip?: boolean } = {}): string {
  const k = s * (134 / 204);
  const f = ink(fill);
  const wings = at(-10, -150, 1, broadWing(f, 150, 1.3), { rot: -58 }) + at(10, -150, 1, broadWing(f, 150, 1.3), { rot: 58, flip: true });
  const sword = at(82, -104, 1, swordShape(blade), { rot: 38 });
  return at(x, y, k, wings + figure(f, 'reach') + sword, { flip: o.flip });
}

// ── tabernacle ─────────────────────────────────────────────────────────────

/**
 * The tent of meeting in three-quarter view: the entrance end with its five
 * pillars and screen on the left, the long side of gilded boards receding to
 * the right, the whole under a dark draped covering. About 230*s wide and
 * 100*s tall, centred on x. Best drawn behind `courtFence`.
 * Flip it with `flip` to put the entrance on the right.
 */
export function tabernacle(
  x: number,
  y: number,
  s: number,
  wall: string,
  cover: string,
  o: Opts & { screen?: string; flip?: boolean } = {},
): string {
  const ew = 64;
  const L = 166;
  const h = 66;
  const r = 30;
  const x0 = -(ew + L) / 2;
  const side = x0 + ew;
  const end = mix(wall, '#FFFFFF', 0.2);
  const screen = o.screen ?? mix(wall, cover, 0.35);
  const out: string[] = [];
  // Long side: the boards.
  out.push(box(side, -h, L, h, wall));
  for (let bx = side + 12; bx < side + L - 4; bx += 14) out.push(box(bx, -h + 18, 2.4, h - 18, mix(wall, '#FFFFFF', 0.28), 1));
  // Entrance end with its gable, screen and pillars.
  out.push(p(`M ${x0} 0 L ${x0} ${-h} L ${x0 + ew / 2} ${-h - r} L ${side} ${-h} L ${side} 0 Z`, end));
  out.push(box(x0 + 7, -h + 8, ew - 14, h - 8, screen));
  for (let i = 0; i < 5; i += 1) out.push(box(x0 + 5 + (i * (ew - 14)) / 4, -h + 4, 4, h - 4, cover));
  // The covering over the ridge, its hem hanging in scallops down the side.
  const ax = x0 + ew / 2;
  const ay = -h - r;
  const n = 8;
  let d = `M ${ax} ${ay - 4} L ${ax + L} ${ay - 4} L ${side + L + 4} ${-h} L ${side + L + 4} ${-h + 20}`;
  for (let i = n - 1; i >= 0; i -= 1) {
    const xa = side + ((i + 1) * (L + 4)) / n;
    const xb = side + (i * (L + 4)) / n;
    d += ` Q ${r1((xa + xb) / 2)} ${-h + 30} ${r1(xb)} ${-h + 20}`;
  }
  d += ` L ${side} ${-h} Z`;
  out.push(p(d, cover));
  // The covering's edge along the gable.
  out.push(p(`M ${x0 - 5} ${-h + 7} L ${ax} ${ay - 4} L ${side + 5} ${-h + 7} L ${side} ${-h + 1} L ${ax} ${ay + 5} L ${x0} ${-h + 1} Z`, cover));
  return at(x, y, s, out.join(''), { flip: o.flip, opacity: o.opacity });
}

/**
 * The court around the tabernacle: white linen hangings on posts, with the
 * embroidered gate screen in the middle when `gate` is given.
 */
export function courtFence(x: number, y: number, len: number, s: number, linen: string, post: string, gate?: string, o?: Opts): string {
  const h = 42 * s;
  const out = [box(x - len / 2, y - h, len, h, linen), box(x - len / 2, y - h, len, 3 * s, post, 1), box(x - len / 2, y - 3 * s, len, 3 * s, post, 1)];
  const step = 34 * s;
  const n = Math.max(2, Math.round(len / step));
  for (let i = 0; i <= n; i += 1) {
    const px = x - len / 2 + (i * len) / n;
    out.push(box(px - 3 * s, y - h - 6 * s, 6 * s, h + 6 * s, post), circ(px, y - h - 7 * s, 4 * s, post));
  }
  if (gate) {
    const gw = 76 * s;
    out.push(box(x - gw / 2, y - h + 2 * s, gw, h - 2 * s, gate));
    for (const gx of [-gw / 2, -gw / 6, gw / 6, gw / 2]) out.push(box(x + gx - 3 * s, y - h - 6 * s, 6 * s, h + 6 * s, post));
  }
  return wrap(out.join(''), o);
}

/** The bronze altar of burnt offering, front view, with its four horns. Its hearth is at y - 76*s. */
export function altar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const w = 62 * s;
  const lite = mix(fill, '#FFFFFF', 0.16);
  const horn = (hx: number, dir: number) =>
    p(`M ${r1(hx - 9 * s)} ${r1(y - 74 * s)} L ${r1(hx + 9 * s)} ${r1(y - 74 * s)} Q ${r1(hx + 6 * s * dir)} ${r1(y - 88 * s)} ${r1(hx + 10 * s * dir)} ${r1(y - 98 * s)} Q ${r1(hx - 6 * s * dir)} ${r1(y - 90 * s)} ${r1(hx - 9 * s)} ${r1(y - 74 * s)} Z`, fill);
  const g =
    box(x - w - 8 * s, y - 10 * s, 2 * w + 16 * s, 10 * s, fill, 2 * s) +
    box(x - w, y - 72 * s, 2 * w, 64 * s, fill) +
    box(x - w + 6 * s, y - 44 * s, 2 * w - 12 * s, 14 * s, lite) +
    box(x - w - 4 * s, y - 78 * s, 2 * w + 8 * s, 9 * s, fill, 2 * s) +
    horn(x - w + 4 * s, -1) +
    horn(x + w - 4 * s, 1) +
    horn(x - w * 0.36, -1) +
    horn(x + w * 0.36, 1);
  return wrap(g, o);
}

/** Fire on an altar's hearth, three layers; base at (x, y). */
export function altarFire(x: number, y: number, s: number, outer: string, middle: string, core: string): string {
  const f = (dx: number, h: number, w: number, lean: number, k: number) =>
    at(x + dx * s, y, s * k, aFlame(h, w, outer, lean) + at(0, 0, 0.68, aFlame(h, w, middle, lean * 0.6)) + at(0, 0, 0.36, aFlame(h, w, core, 0)));
  return f(-34, 70, 46, -8, 1) + f(34, 76, 46, 10, 1) + f(0, 120, 70, 4, 1) + f(-14, 86, 50, -4, 0.9) + f(16, 92, 52, 6, 0.9);
}

/** The golden altar of incense: narrow and tall, with horns; its top is at y - 92*s. */
export function incenseAltar(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const w = 22 * s;
  const horn = (hx: number, dir: number) =>
    p(`M ${r1(hx - 5 * s)} ${r1(y - 92 * s)} L ${r1(hx + 5 * s)} ${r1(y - 92 * s)} Q ${r1(hx + 3 * s * dir)} ${r1(y - 100 * s)} ${r1(hx + 6 * s * dir)} ${r1(y - 106 * s)} Q ${r1(hx - 4 * s * dir)} ${r1(y - 100 * s)} ${r1(hx - 5 * s)} ${r1(y - 92 * s)} Z`, fill);
  const g =
    box(x - w - 5 * s, y - 8 * s, 2 * w + 10 * s, 8 * s, fill, 2 * s) +
    box(x - w, y - 88 * s, 2 * w, 82 * s, fill) +
    box(x - w - 4 * s, y - 94 * s, 2 * w + 8 * s, 8 * s, fill, 2 * s) +
    horn(x - w + 3 * s, -1) +
    horn(x + w - 3 * s, 1);
  return wrap(g, o);
}

/**
 * The ark of the covenant with the mercy seat and the two cherubim, wings
 * stretched toward each other. `y` is the bottom of the chest; `poles` adds
 * the carrying poles, `poleLen` long.
 */
export function arkOfCovenant(x: number, y: number, s: number, fill: string, o: { poles?: string; poleLen?: number; opacity?: number } = {}): string {
  const lite = mix(fill, '#FFFFFF', 0.22);
  const cherub = (dir: number) => {
    const cx = x - dir * 30 * s;
    return (
      p(
        `M ${r1(cx - 12 * s)} ${r1(y - 62 * s)} C ${r1(cx - 12 * s)} ${r1(y - 76 * s)} ${r1(cx - 6 * s)} ${r1(y - 84 * s)} ${r1(cx + dir * 2 * s)} ${r1(y - 84 * s)}` +
          ` C ${r1(cx + dir * 10 * s)} ${r1(y - 82 * s)} ${r1(cx + 12 * s)} ${r1(y - 72 * s)} ${r1(cx + 12 * s)} ${r1(y - 62 * s)} Z`,
        fill,
      ) +
      circ(cx + dir * 6 * s, y - 90 * s, 7 * s, fill) +
      p(
        `M ${r1(cx - dir * 6 * s)} ${r1(y - 78 * s)} C ${r1(cx - dir * 20 * s)} ${r1(y - 110 * s)} ${r1(cx + dir * 8 * s)} ${r1(y - 132 * s)} ${r1(x - dir * 3 * s)} ${r1(y - 118 * s)}` +
          ` C ${r1(cx + dir * 14 * s)} ${r1(y - 112 * s)} ${r1(cx + dir * 4 * s)} ${r1(y - 96 * s)} ${r1(cx + dir * 4 * s)} ${r1(y - 80 * s)} Z`,
        fill,
      )
    );
  };
  const poleLen = o.poleLen ?? 150 * s;
  const g =
    (o.poles ? box(x - poleLen, y - 16 * s, poleLen * 2, 6 * s, o.poles, 3 * s) : '') +
    box(x - 50 * s, y - 52 * s, 100 * s, 52 * s, fill) +
    box(x - 44 * s, y - 44 * s, 88 * s, 36 * s, lite, 2 * s) +
    box(x - 54 * s, y - 60 * s, 108 * s, 9 * s, fill, 2 * s) +
    cherub(1) +
    cherub(-1) +
    (o.poles ? circ(x - 42 * s, y - 13 * s, 5 * s, fill) + circ(x + 42 * s, y - 13 * s, 5 * s, fill) : '');
  return wrap(g, o);
}

/** The seven-branched lampstand; flames on its seven lamps. The lamps sit at y - 150*s. */
export function menorah(x: number, y: number, s: number, fill: string, flameFill: string | null, o?: Opts): string {
  const top = y - 150 * s;
  const out = [
    p(`M ${r1(x - 34 * s)} ${r1(y)} L ${r1(x - 14 * s)} ${r1(y - 18 * s)} L ${r1(x + 14 * s)} ${r1(y - 18 * s)} L ${r1(x + 34 * s)} ${r1(y)} Z`, fill),
    box(x - 5 * s, top, 10 * s, 150 * s - 14 * s, fill),
  ];
  for (const r of [24, 46, 68]) {
    out.push(`<path d="M ${r1(x - r * s)} ${r1(top)} A ${r1(r * s)} ${r1(r * s)} 0 0 0 ${r1(x + r * s)} ${r1(top)}" fill="none" stroke="${fill}" stroke-width="${r1(8 * s)}"/>`);
  }
  for (const dx of [-68, -46, -24, 0, 24, 46, 68]) {
    out.push(p(`M ${r1(x + dx * s - 9 * s)} ${r1(top - 8 * s)} L ${r1(x + dx * s + 9 * s)} ${r1(top - 8 * s)} L ${r1(x + dx * s + 5 * s)} ${r1(top + 3 * s)} L ${r1(x + dx * s - 5 * s)} ${r1(top + 3 * s)} Z`, fill));
    if (flameFill) out.push(at(x + dx * s, top - 8 * s, s * 0.34, aFlame(70, 34, flameFill)));
  }
  return wrap(out.join(''), o);
}

/** The table of showbread with its two stacks of six loaves; top surface at y - 62*s. */
export function showbreadTable(x: number, y: number, s: number, fill: string, bread: string, o?: Opts): string {
  const out = [
    box(x - 62 * s, y - 64 * s, 124 * s, 9 * s, fill, 2 * s),
    box(x - 58 * s, y - 70 * s, 116 * s, 6 * s, fill),
    box(x - 54 * s, y - 56 * s, 8 * s, 56 * s, fill),
    box(x + 46 * s, y - 56 * s, 8 * s, 56 * s, fill),
    box(x - 54 * s, y - 24 * s, 108 * s, 6 * s, fill),
  ];
  const edge = mix(bread, '#000000', 0.22);
  for (const sx of [-28, 28]) {
    for (let i = 0; i < 6; i += 1) {
      const ly = y - 76 * s - i * 11 * s;
      out.push(ell(x + sx * s, ly + 1.5 * s, 24 * s, 6.5 * s, edge), ell(x + sx * s, ly, 23 * s, 6 * s, bread));
    }
  }
  return wrap(out.join(''), o);
}

/** A fire pan (censer) with a long handle and burning coals; `y` is the bottom of the pan. */
export function censer(x: number, y: number, s: number, fill: string, fire: string | null, o?: Opts & { smoke?: string }): string {
  const out = [
    stroke(`M ${r1(x + 26 * s)} ${r1(y - 18 * s)} L ${r1(x + 70 * s)} ${r1(y - 34 * s)}`, fill, 7 * s),
    circ(x + 72 * s, y - 35 * s, 6 * s, fill),
    p(`M ${r1(x - 36 * s)} ${r1(y - 26 * s)} C ${r1(x - 32 * s)} ${r1(y + 2 * s)} ${r1(x + 32 * s)} ${r1(y + 2 * s)} ${r1(x + 36 * s)} ${r1(y - 26 * s)} Z`, fill),
    box(x - 40 * s, y - 30 * s, 80 * s, 7 * s, fill, 3 * s),
  ];
  if (fire) {
    out.push(
      circ(x - 18 * s, y - 31 * s, 8 * s, fire),
      circ(x, y - 33 * s, 9 * s, fire),
      circ(x + 18 * s, y - 31 * s, 8 * s, fire),
      at(x, y - 32 * s, s * 0.6, aFlame(80, 46, fire)),
    );
  }
  if (o?.smoke) {
    for (let i = 0; i < 6; i += 1) {
      out.push(ell(x + Math.sin(i * 1.3) * 10 * s, y - 70 * s - i * 26 * s, (12 + i * 5) * s, (10 + i * 3) * s, o.smoke, `opacity="${r1(0.5 - i * 0.06)}"`));
    }
  }
  return wrap(out.join(''), o);
}

/** A ram's horn, mouthpiece at (x, y), bell curving up to the right; `rot` tilts it. */
export function shofar(x: number, y: number, s: number, fill: string, rot = 0): string {
  const g =
    p('M 0 -3 C 34 -6 70 -12 96 -38 C 104 -46 110 -58 112 -70 L 136 -60 C 130 -40 118 -24 102 -12 C 74 8 36 8 0 4 Z', fill) +
    p('M 112 -70 L 136 -60 L 140 -66 L 114 -78 Z', mix(fill, '#000000', 0.2)) +
    circ(0, 0, 5, fill);
  return at(x, y, s, g, { rot });
}

/** A long straight silver trumpet, mouthpiece at (x, y), pointing right and tilted by `rot`. */
export function trumpet(x: number, y: number, s: number, fill: string, rot = 0): string {
  const g = box(0, -3.5, 150, 7, fill, 3) + box(20, -6, 8, 12, fill, 2) + box(80, -6, 8, 12, fill, 2) + p('M 140 -4 L 176 -20 Q 180 0 176 20 L 140 4 Z', fill) + circ(-2, 0, 6, fill);
  return at(x, y, s, g, { rot });
}

/** A sword: hilt at (x, y), blade pointing up, tilted by `rot`. */
export function swordShape(fill: string): string {
  return p('M -5 -14 L -5 -128 L 0 -146 L 5 -128 L 5 -14 Z', fill) + box(-18, -18, 36, 7, fill, 3) + box(-3.5, -12, 7, 24, fill, 3) + circ(0, 15, 6, fill);
}

/** A spear: shaft from the ground up, leaf blade at the top. */
export function spear(x: number, y: number, s: number, fill: string, len = 250, rot = 0): string {
  const g = box(-2.6, -len, 5.2, len, fill, 2) + p(`M 0 ${-len - 36} C 9 ${-len - 22} 9 ${-len - 8} 4 ${-len} L -4 ${-len} C -9 ${-len - 8} -9 ${-len - 22} 0 ${-len - 36} Z`, fill);
  return at(x, y, s, g, { rot });
}

/** A shepherd's staff or rod, standing; `crook` curls the top. */
export function rod(x: number, y: number, s: number, fill: string, len = 200, crook = false, rot = 0): string {
  const g = stroke(`M 0 0 L 0 ${-len}${crook ? ' C 0 -' + (len + 30) + ' 26 -' + (len + 30) + ' 26 -' + (len + 8) : ''}`, fill, 6);
  return at(x, y, s, g, { rot });
}

/** Aaron's rod that budded: a staff with twigs, leaves, blossoms and almonds. */
export function buddingRod(x: number, y: number, s: number, wood: string, bloom: string, len = 220): string {
  const out = [stroke(`M 0 0 C 2 ${-len * 0.4} -3 ${-len * 0.7} 0 ${-len}`, wood, 8)];
  const twigs: [number, number, number][] = [
    [-0.5, -40, -1], [0.58, 44, 1], [0.7, -46, -1], [0.8, 40, 1], [0.92, -30, -1], [0.98, 26, 1],
  ];
  for (const [t, dx, dir] of twigs) {
    const ty = -len * Math.abs(t);
    out.push(stroke(`M 0 ${r1(ty)} Q ${r1(dx * 0.4)} ${r1(ty - 10)} ${r1(dx)} ${r1(ty - 26)}`, wood, 4.5));
    out.push(ell(dx * 0.5, ty - 6, 11, 4.5, wood, `transform="rotate(${dir * -28} ${r1(dx * 0.5)} ${r1(ty - 6)})"`));
    out.push(blossom(dx, ty - 28, 1, bloom));
  }
  for (const [bx, by, br] of [[0, -len - 6, 1.2], [-14, -len * 0.84, 0.9], [16, -len * 0.74, 0.9], [-10, -len * 0.62, 0.8], [12, -len * 0.5, 0.75]] as const) {
    out.push(blossom(bx, by, br, bloom));
  }
  for (const [ax, ay] of [[24, -len * 0.62], [-24, -len * 0.4], [20, -len * 0.3]] as const) out.push(ell(ax, ay, 6, 9, bloom));
  return at(x, y, s, out.join(''));
}

/** A five-petalled blossom. */
export function blossom(x: number, y: number, s: number, fill: string): string {
  const out: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    out.push(circ(x + Math.cos(a) * 7 * s, y + Math.sin(a) * 7 * s, 6 * s, fill));
  }
  out.push(circ(x, y, 4 * s, mix(fill, '#FFFFFF', 0.5)));
  return out.join('');
}

/** The bronze serpent on its pole: a tall pole, a crossbar and the serpent wound around it. */
export function bronzeSerpent(x: number, y: number, s: number, pole: string, snake: string): string {
  const top = y - 250 * s;
  let d = `M ${r1(x - 4 * s)} ${r1(y - 40 * s)}`;
  const turns = 5;
  for (let i = 0; i < turns; i += 1) {
    const y0 = y - 40 * s - i * 34 * s;
    const dir = i % 2 === 0 ? 1 : -1;
    d += ` C ${r1(x + dir * 30 * s)} ${r1(y0 - 6 * s)} ${r1(x + dir * 30 * s)} ${r1(y0 - 28 * s)} ${r1(x - dir * 4 * s)} ${r1(y0 - 34 * s)}`;
  }
  const yEnd = y - 40 * s - turns * 34 * s;
  d += ` C ${r1(x + 24 * s)} ${r1(yEnd - 14 * s)} ${r1(x + 40 * s)} ${r1(top + 6 * s)} ${r1(x + 50 * s)} ${r1(top + 22 * s)}`;
  return (
    box(x - 6 * s, top, 12 * s, 250 * s, pole, 3 * s) +
    box(x - 40 * s, top + 10 * s, 80 * s, 10 * s, pole, 4 * s) +
    stroke(d, snake, 13 * s) +
    ell(x + 54 * s, top + 28 * s, 13 * s, 9 * s, snake) +
    stroke(`M ${r1(x - 6 * s)} ${r1(y - 40 * s)} Q ${r1(x - 22 * s)} ${r1(y - 26 * s)} ${r1(x - 30 * s)} ${r1(y - 38 * s)}`, snake, 7 * s)
  );
}

/** A booth of leafy branches on poles (the feast of tabernacles). */
export function booth(rand: () => number, x: number, y: number, s: number, frame: string, leaves: string): string {
  const out = [
    box(x - 58 * s, y - 84 * s, 7 * s, 84 * s, frame),
    box(x + 51 * s, y - 84 * s, 7 * s, 84 * s, frame),
    box(x - 4 * s, y - 84 * s, 7 * s, 84 * s, frame),
    box(x - 64 * s, y - 88 * s, 128 * s, 7 * s, frame),
  ];
  for (let i = 0; i < 22; i += 1) {
    const lx = x - 70 * s + rand() * 140 * s;
    const ly = y - 92 * s - rand() * 18 * s;
    out.push(ell(lx, ly, (14 + rand() * 10) * s, (7 + rand() * 4) * s, leaves));
  }
  // Fronds hanging down the sides.
  for (const [fx, dir] of [[x - 64 * s, -1], [x + 64 * s, 1]] as const) {
    for (let k = 0; k < 3; k += 1) {
      out.push(stroke(`M ${r1(fx)} ${r1(y - 92 * s)} Q ${r1(fx + dir * (14 + k * 6) * s)} ${r1(y - (70 - k * 10) * s)} ${r1(fx + dir * (6 + k * 8) * s)} ${r1(y - (40 - k * 12) * s)}`, leaves, 6 * s));
    }
  }
  return out.join('');
}

/**
 * A wide, low desert tent of goat hair: three poles lifting the roof into
 * peaks, the front flap open, guy ropes pegged out. ~260*s wide, ~90*s tall.
 */
export function bedouinTent(x: number, y: number, s: number, fill: string, door?: string): string {
  const g =
    p('M -122 0 L -112 -46 L -78 -70 L -44 -62 L 0 -90 L 44 -62 L 78 -70 L 112 -46 L 122 0 Z', fill) +
    p('M -26 0 L -20 -52 L 0 -64 L 20 -52 L 26 0 Z', door ?? mix(fill, '#000000', 0.35)) +
    stroke('M -112 -46 L -150 0 M 112 -46 L 150 0 M -78 -70 L -130 0 M 78 -70 L 130 0', fill, 2.5) +
    box(-153, -4, 6, 6, fill, 2) +
    box(147, -4, 6, 6, fill, 2);
  return at(x, y, s, g);
}

/** A covered ox wagon (the leaders' gifts): wagon box, arched cover, two spoked wheels, the pole to the left. */
export function coveredWagon(x: number, y: number, s: number, body: string, cover: string): string {
  const wheel = (wx: number) => {
    const out = [`<circle cx="${r1(wx)}" cy="${r1(y - 26 * s)}" r="${r1(24 * s)}" fill="none" stroke="${body}" stroke-width="${r1(6 * s)}"/>`, circ(wx, y - 26 * s, 6 * s, body)];
    for (let i = 0; i < 4; i += 1) {
      const a = (Math.PI * i) / 4;
      out.push(stroke(`M ${r1(wx - Math.cos(a) * 22 * s)} ${r1(y - 26 * s - Math.sin(a) * 22 * s)} L ${r1(wx + Math.cos(a) * 22 * s)} ${r1(y - 26 * s + Math.sin(a) * 22 * s)}`, body, 3.4 * s));
    }
    return out.join('');
  };
  return (
    stroke(`M ${r1(x - 60 * s)} ${r1(y - 40 * s)} L ${r1(x - 130 * s)} ${r1(y - 52 * s)}`, body, 6 * s) +
    p(`M ${r1(x - 64 * s)} ${r1(y - 62 * s)} C ${r1(x - 64 * s)} ${r1(y - 128 * s)} ${r1(x + 64 * s)} ${r1(y - 128 * s)} ${r1(x + 64 * s)} ${r1(y - 62 * s)} Z`, cover) +
    box(x - 70 * s, y - 64 * s, 140 * s, 26 * s, body, 3 * s) +
    wheel(x - 38 * s) +
    wheel(x + 38 * s)
  );
}

/** A rock face with water bursting from a cleft and running into a pool. */
export function rockSpring(x: number, y: number, s: number, rock: string, water: string, o: { flip?: boolean } = {}): string {
  const shade = mix(rock, '#000000', 0.12);
  const g =
    p('M -150 0 L -142 -70 L -112 -138 L -62 -186 L -6 -200 L 50 -178 L 92 -132 L 120 -70 L 134 0 Z', rock) +
    p('M -62 -186 L -6 -200 L 50 -178 L 30 -150 L -20 -156 Z', mix(rock, '#FFFFFF', 0.12)) +
    p('M 60 -126 L 74 -116 L 66 -96 L 78 -80 L 62 -78 L 52 -100 Z', shade) +
    stroke('M 70 -100 C 120 -104 156 -82 170 -24 L 178 0', water, 20) +
    stroke('M 72 -94 C 108 -92 136 -70 146 -22', water, 9, 0.8) +
    circ(178, -12, 9, water) + circ(196, -8, 6, water) + circ(160, -6, 7, water) + circ(204, -20, 5, water) +
    ell(170, 2, 80, 10, water);
  return at(x, y, s, g, { flip: o.flip });
}

/** A jagged split in the ground opening toward the viewer. */
export function chasm(x: number, y: number, w: number, s: number, fill: string): string {
  const n = 9;
  // Upper edge left to right, lower edge right to left: wider in the middle.
  let d = `M ${r1(x - w / 2)} ${r1(y)}`;
  for (let i = 1; i <= n; i += 1) {
    const t = i / n;
    const px = x - w / 2 + t * w;
    d += ` L ${r1(px)} ${r1(y - Math.sin(Math.PI * t) * (i % 2 ? 16 : 6) * s)}`;
  }
  for (let i = n - 1; i >= 1; i -= 1) {
    const t = i / n;
    const px = x - w / 2 + t * w + (i % 2 ? 8 : -8) * s;
    d += ` L ${r1(px)} ${r1(y + Math.sin(Math.PI * t) * (i % 2 ? 30 : 46) * s)}`;
  }
  d += ' Z';
  return p(d, fill);
}

/** A column of fire standing on the ground, `h` tall. */
export function firePillar(x: number, y: number, h: number, w: number, outer: string, middle: string, core: string): string {
  return (
    at(x, y, 1, aFlame(h, w, outer, 6)) +
    at(x - w * 0.18, y, 1, aFlame(h * 0.62, w * 0.6, outer, -10)) +
    at(x + w * 0.2, y, 1, aFlame(h * 0.56, w * 0.6, outer, 12)) +
    at(x, y, 1, aFlame(h * 0.78, w * 0.66, middle, 4)) +
    at(x, y, 1, aFlame(h * 0.48, w * 0.36, core, 0))
  );
}

/** A pillar of cloud: a soft column of white puffs widening at the top. */
export function cloudPillar(rand: () => number, x: number, y: number, h: number, s: number, fill: string, opacity = 0.85): string {
  const out: string[] = [];
  const n = 12;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const cy = y - t * h;
    const rw = (26 + t * t * 40) * s;
    out.push(ell(x + (rand() - 0.5) * 18 * s, cy, rw, (20 + t * 10) * s, fill));
    if (t > 0.7) out.push(ell(x + (rand() - 0.5) * 80 * s, cy - 8 * s, rw * 0.8, 18 * s, fill));
  }
  return `<g opacity="${opacity}">${out.join('')}</g>`;
}

/** An upright boundary stone with a rounded top, slightly tilted. */
export function boundaryStone(x: number, y: number, s: number, fill: string): string {
  return (
    ell(x, y, 40 * s, 8 * s, mix(fill, '#000000', 0.15)) +
    `<g transform="rotate(4 ${r1(x)} ${r1(y)})">` +
    p(`M ${r1(x - 24 * s)} ${r1(y)} L ${r1(x - 27 * s)} ${r1(y - 78 * s)} C ${r1(x - 27 * s)} ${r1(y - 108 * s)} ${r1(x + 27 * s)} ${r1(y - 108 * s)} ${r1(x + 27 * s)} ${r1(y - 78 * s)} L ${r1(x + 24 * s)} ${r1(y)} Z`, fill) +
    `</g>`
  );
}

/** A balance with two pans. `tilt` (degrees) lowers the right pan. */
export function balance(x: number, y: number, s: number, frame: string, pans: string, tilt = 0): string {
  const a = (tilt * Math.PI) / 180;
  const by = y - 140 * s;
  const ends = [-1, 1].map((d) => [x + d * 78 * s * Math.cos(a), by + d * 78 * s * Math.sin(a)] as const);
  const out = [
    box(x - 34 * s, y - 10 * s, 68 * s, 10 * s, frame, 3 * s),
    box(x - 4 * s, by, 8 * s, 140 * s, frame),
    circ(x, by - 8 * s, 8 * s, frame),
    stroke(`M ${r1(ends[0][0])} ${r1(ends[0][1])} L ${r1(ends[1][0])} ${r1(ends[1][1])}`, frame, 7 * s),
  ];
  for (const [ex, ey] of ends) {
    const py = ey + 64 * s;
    out.push(stroke(`M ${r1(ex)} ${r1(ey)} L ${r1(ex - 26 * s)} ${r1(py)} M ${r1(ex)} ${r1(ey)} L ${r1(ex + 26 * s)} ${r1(py)}`, frame, 2.6 * s));
    out.push(p(`M ${r1(ex - 32 * s)} ${r1(py)} Q ${r1(ex)} ${r1(py + 22 * s)} ${r1(ex + 32 * s)} ${r1(py)} Z`, pans));
  }
  return out.join('');
}

/** A star with four long points and four short ones. */
export function bigStar(x: number, y: number, s: number, fill: string): string {
  const pt = (rot: number, len: number, w: number) =>
    `<g transform="rotate(${rot} ${r1(x)} ${r1(y)})">${p(`M ${r1(x - w * s)} ${r1(y)} L ${r1(x)} ${r1(y - len * s)} L ${r1(x + w * s)} ${r1(y)} Z`, fill)}</g>`;
  return pt(0, 70, 9) + pt(90, 70, 9) + pt(180, 70, 9) + pt(270, 70, 9) + pt(45, 30, 7) + pt(135, 30, 7) + pt(225, 30, 7) + pt(315, 30, 7) + circ(x, y, 11 * s, fill);
}

/** A horned idol seated on a pedestal, arms held out. */
export function idol(x: number, y: number, s: number, fill: string): string {
  return (
    box(x - 40 * s, y - 46 * s, 80 * s, 46 * s, fill, 2 * s) +
    box(x - 46 * s, y - 52 * s, 92 * s, 8 * s, fill, 2 * s) +
    p(`M ${r1(x - 30 * s)} ${r1(y - 52 * s)} C ${r1(x - 32 * s)} ${r1(y - 100 * s)} ${r1(x - 22 * s)} ${r1(y - 128 * s)} ${r1(x)} ${r1(y - 130 * s)} C ${r1(x + 22 * s)} ${r1(y - 128 * s)} ${r1(x + 32 * s)} ${r1(y - 100 * s)} ${r1(x + 30 * s)} ${r1(y - 52 * s)} Z`, fill) +
    ell(x, y - 146 * s, 16 * s, 18 * s, fill) +
    stroke(`M ${r1(x - 12 * s)} ${r1(y - 156 * s)} C ${r1(x - 30 * s)} ${r1(y - 160 * s)} ${r1(x - 36 * s)} ${r1(y - 176 * s)} ${r1(x - 30 * s)} ${r1(y - 190 * s)}`, fill, 6 * s) +
    stroke(`M ${r1(x + 12 * s)} ${r1(y - 156 * s)} C ${r1(x + 30 * s)} ${r1(y - 160 * s)} ${r1(x + 36 * s)} ${r1(y - 176 * s)} ${r1(x + 30 * s)} ${r1(y - 190 * s)}`, fill, 6 * s) +
    stroke(`M ${r1(x - 24 * s)} ${r1(y - 104 * s)} L ${r1(x - 58 * s)} ${r1(y - 84 * s)} M ${r1(x + 24 * s)} ${r1(y - 104 * s)} L ${r1(x + 58 * s)} ${r1(y - 84 * s)}`, fill, 11 * s)
  );
}

/**
 * A crescent moon, horns to the right: the outer edge a half circle, the
 * inner edge a flatter half ellipse.
 */
export function moon(x: number, y: number, r: number, fill: string): string {
  return p(`M ${r1(x)} ${r1(y - r)} A ${r1(r)} ${r1(r)} 0 0 0 ${r1(x)} ${r1(y + r)} A ${r1(r * 0.52)} ${r1(r)} 0 0 1 ${r1(x)} ${r1(y - r)} Z`, fill);
}

/** A sheep or lamb, facing right unless flipped. */
export function lamb(x: number, y: number, s: number, body: string, head?: string, o: { flip?: boolean; opacity?: number } = {}): string {
  return at(x, y, s, aSheep(ink(body), ink(head ?? body)), { flip: o.flip, opacity: o.opacity });
}

/** A bundle of gathered sticks, lying across the arms or on the ground. */
export function sticks(x: number, y: number, s: number, fill: string, rot = 0): string {
  const out: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const dy = (i - 3) * 5;
    const len = 110 + ((i * 37) % 30);
    out.push(stroke(`M ${-len / 2} ${dy} L ${len / 2} ${dy + ((i % 3) - 1) * 4}`, fill, 6));
  }
  out.push(box(-24, -22, 9, 44, mix(fill, '#000000', 0.25), 3), box(18, -22, 9, 44, mix(fill, '#000000', 0.25), 3));
  return at(x, y, s, out.join(''), { rot });
}

/** An earthen jar with a narrow neck. */
export function jar(x: number, y: number, s: number, fill: string): string {
  return (
    p(
      `M ${r1(x - 14 * s)} ${r1(y)} C ${r1(x - 30 * s)} ${r1(y - 14 * s)} ${r1(x - 30 * s)} ${r1(y - 46 * s)} ${r1(x - 13 * s)} ${r1(y - 58 * s)} L ${r1(x - 10 * s)} ${r1(y - 70 * s)}` +
        ` L ${r1(x + 10 * s)} ${r1(y - 70 * s)} L ${r1(x + 13 * s)} ${r1(y - 58 * s)} C ${r1(x + 30 * s)} ${r1(y - 46 * s)} ${r1(x + 30 * s)} ${r1(y - 14 * s)} ${r1(x + 14 * s)} ${r1(y)} Z`,
      fill,
    ) +
    box(x - 14 * s, y - 76 * s, 28 * s, 8 * s, fill, 3 * s) +
    stroke(`M ${r1(x + 12 * s)} ${r1(y - 64 * s)} C ${r1(x + 32 * s)} ${r1(y - 66 * s)} ${r1(x + 32 * s)} ${r1(y - 44 * s)} ${r1(x + 22 * s)} ${r1(y - 40 * s)}`, fill, 5 * s)
  );
}

/** A shallow dish with a heap in it (flour, grain); `y` is the dish's foot. */
export function dish(x: number, y: number, s: number, fill: string, heap?: string): string {
  return (
    (heap ? p(`M ${r1(x - 34 * s)} ${r1(y - 22 * s)} C ${r1(x - 20 * s)} ${r1(y - 52 * s)} ${r1(x + 20 * s)} ${r1(y - 52 * s)} ${r1(x + 34 * s)} ${r1(y - 22 * s)} Z`, heap) : '') +
    p(`M ${r1(x - 48 * s)} ${r1(y - 24 * s)} L ${r1(x + 48 * s)} ${r1(y - 24 * s)} C ${r1(x + 40 * s)} ${r1(y - 6 * s)} ${r1(x + 20 * s)} ${r1(y - 4 * s)} ${r1(x)} ${r1(y - 4 * s)} C ${r1(x - 20 * s)} ${r1(y - 4 * s)} ${r1(x - 40 * s)} ${r1(y - 6 * s)} ${r1(x - 48 * s)} ${r1(y - 24 * s)} Z`, fill) +
    box(x - 14 * s, y - 6 * s, 28 * s, 6 * s, fill, 2 * s)
  );
}

/** A curved sickle, handle at (x, y). */
export function sickle(x: number, y: number, s: number, fill: string, rot = 0): string {
  const g = box(-3.5, -4, 7, 30, fill, 3) + p('M -4 -4 C -10 -40 20 -64 52 -54 C 30 -52 8 -40 4 -4 Z', fill);
  return at(x, y, s, g, { rot });
}

/** Points sampled along a cubic curve - for a route drawn as a dotted line. */
export function dottedCurve(
  pts: [[number, number], [number, number], [number, number], [number, number]],
  n: number,
  r: number,
  fill: string,
  opacity = 1,
): string {
  const out: string[] = [];
  const [a, b, c, d] = pts;
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const u = 1 - t;
    const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0];
    const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1];
    out.push(circ(x, y, r * (0.7 + 0.3 * t), fill));
  }
  return `<g opacity="${opacity}">${out.join('')}</g>`;
}

/** A low stone wall with an opening: a sheepfold seen from the side. */
export function sheepfold(x: number, y: number, w: number, s: number, fill: string): string {
  const out: string[] = [];
  const gap = 46 * s;
  for (let row = 0; row < 3; row += 1) {
    const sy = y - (row + 1) * 14 * s;
    const off = row % 2 ? 12 * s : 0;
    for (let bx = x - w / 2 + off; bx < x + w / 2 - 10 * s; bx += 26 * s) {
      if (Math.abs(bx + 11 * s - x) < gap / 2) continue;
      out.push(box(bx, sy, 22 * s, 12 * s, fill, 5 * s));
    }
  }
  return out.join('');
}

/** A scroll lying open, held flat between its two rollers. */
export function openScroll(x: number, y: number, s: number, paper: string, roll: string, text?: string): string {
  const out = [box(x - 70 * s, y - 50 * s, 140 * s, 50 * s, paper, 2 * s), box(x - 84 * s, y - 56 * s, 18 * s, 62 * s, roll, 9 * s), box(x + 66 * s, y - 56 * s, 18 * s, 62 * s, roll, 9 * s)];
  if (text) for (let i = 0; i < 4; i += 1) out.push(box(x - 54 * s, y - 42 * s + i * 11 * s, (i % 2 ? 84 : 104) * s, 4 * s, text, 2 * s));
  return out.join('');
}
