/**
 * Motifs for the Deuteronomium and Jozua covers that the shared primitives do
 * not have: the ark of the covenant, a horned altar and an altar of unhewn
 * stones, the shofar, a sword and a javelin, Og's iron bedstead, a cairn of
 * memorial stones, a standing stone, a nomad tent, an eagle, a deer, balance scales, a booth
 * of branches, a bird's nest, a water jar, an axe, the tabernacle in its
 * court, a pillar of cloud, a plough, a comet and a small hill town.
 *
 * Same conventions as `quiz-cover-primitives.mts`: flat silhouettes, `y` is
 * the ground the motif stands on, `(x, y, s, fill, o?) => string`. Shapes are
 * drawn in local coordinates and placed with `at`, and use the plain SVG
 * helpers from the option-A shapes so a wide shape in a depth colour is not
 * turned into a light hill or wall by the primitives' colour maps. Motifs that
 * are people, animals or trees pass their fill through `ink`, as the
 * primitives do.
 */

import { at, box, circ, ell, figure, kneeler, p, sheep as aSheep, type Pose as APose } from './cover-options/shapes.mjs';
import { ink } from './quiz-cover-primitives.mjs';

type Opts = { opacity?: number };
type Place = Opts & { flip?: boolean; rot?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A round-capped stroke in local coordinates. */
function stroke(d: string, color: string, w: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"${
    opacity !== 1 ? ` opacity="${opacity}"` : ''
  }/>`;
}

const place = (x: number, y: number, s: number, inner: string, o?: Place) =>
  at(x, y, s, inner, { flip: o?.flip, rot: o?.rot, opacity: o?.opacity });

// ── people & animals ────────────────────────────────────────────────────────

/**
 * The option-A robed figure with every pose it has, including the ones
 * `person` does not expose: 'staff' (Moses, the old Joshua), 'bless' (one arm
 * out over the people) and 'shield'. Same size as `person` (s = 1 is ~134px).
 * `flip` turns it to face left.
 */
export function figureA(
  x: number,
  y: number,
  s: number,
  fill: string,
  pose: APose = 'stand',
  o?: Place & { staffFill?: string },
): string {
  const f = ink(fill);
  return place(x, y, s * (134 / 204), figure(f, pose, { staffFill: o?.staffFill ? ink(o.staffFill) : undefined }), o);
}

/** Kneeling, side view, facing right (flip for left); the same figure as `person(..., 'kneel')`, with the arm pose free. */
export function kneelA(
  x: number,
  y: number,
  s: number,
  fill: string,
  arms: 'pray' | 'forward' | 'up' | 'plant' = 'pray',
  o?: Place,
): string {
  return place(x, y, s * 0.6, kneeler(ink(fill), arms), o);
}

/** A bare, dead tree: trunk and a few dry branches; ~170px tall at s = 1. */
export function deadTree(x: number, y: number, s: number, fill: string, o?: Place): string {
  const f = ink(fill);
  const g =
    p('M -12 0 C -8 -50 -10 -100 -6 -140 L 6 -140 C 8 -100 10 -50 14 0 Z', f) +
    stroke('M -4 -90 C -30 -110 -50 -130 -66 -160', f, 9) +
    stroke('M -40 -122 L -62 -126', f, 5) +
    stroke('M 2 -110 C 26 -126 44 -148 52 -176', f, 8) +
    stroke('M 34 -140 L 58 -142', f, 5) +
    stroke('M 0 -136 L -6 -172', f, 6);
  return place(x, y, s, g, o);
}

/** A sheep facing right (flip for left), ~70px tall at s = 1; light fleece, dark head and legs. */
export function sheepA(x: number, y: number, s: number, fleece: string, head: string, o?: Place): string {
  return place(x, y, s, aSheep(fleece, ink(head)), o);
}

/** A deer (hert) with antlers, facing left; ~150px tall at s = 1. */
export function deer(x: number, y: number, s: number, fill: string, o?: Place): string {
  const f = ink(fill);
  const g =
    stroke('M -36 -66 L -42 0', f, 8) +
    stroke('M -22 -64 L -16 0', f, 8) +
    stroke('M 28 -66 L 22 0', f, 8) +
    stroke('M 40 -68 L 48 0', f, 8) +
    ell(0, -76, 54, 23, f) +
    ell(50, -86, 9, 6, f) +
    p('M -40 -84 L -60 -132 L -44 -136 L -24 -88 Z', f) +
    ell(-60, -136, 17, 11, f) +
    p('M -66 -142 L -88 -128 L -72 -124 Z', f) +
    ell(-46, -150, 5, 11, f) +
    stroke('M -58 -144 C -62 -164 -72 -178 -84 -192', f, 5) +
    stroke('M -62 -160 L -48 -176', f, 4) +
    stroke('M -70 -174 L -62 -194', f, 4) +
    stroke('M -52 -146 C -48 -166 -40 -178 -28 -190', f, 5) +
    stroke('M -46 -164 L -30 -168', f, 4);
  return place(x, y, s, g, o);
}

/** An eagle soaring with its wings spread wide (wingspan ~430px at s = 1); centre of the body at (x, y). */
export function eagle(x: number, y: number, s: number, fill: string, o?: Place): string {
  const wing =
    'M -12 -26 C -60 -74 -136 -90 -216 -66 L -200 -54 L -220 -42 L -196 -36 L -212 -22 L -184 -20 L -196 -6 ' +
    'L -164 -8 L -170 8 L -136 0 L -130 16 L -96 4 C -64 12 -34 16 -12 20 Z';
  const g =
    p(wing, fill) +
    at(0, 0, 1, p(wing, fill), { flip: true }) +
    p('M -16 36 L 16 36 L 34 86 L 12 80 L 0 92 L -12 80 L -34 86 Z', fill) +
    ell(0, 2, 22, 46, fill) +
    circ(0, -52, 16, fill) +
    p('M 10 -60 L 34 -50 L 10 -44 Z', fill);
  return place(x, y, s, g, o);
}

// ── sacred objects ──────────────────────────────────────────────────────────

/**
 * The ark of the covenant: a chest with the mercy seat and two cherubim whose
 * wings meet over it. `y` is the bottom of the chest; ~160 wide and ~160 tall
 * at s = 1. With `poleFill` the carrying poles run out on both sides.
 */
export function arkOfCovenant(x: number, y: number, s: number, fill: string, poleFill?: string, o?: Place): string {
  // A kneeling cherub at each end of the mercy seat, facing in, one wing swept
  // forward and up so the two wing tips meet over the middle.
  const cherub =
    p('M -82 -92 L -78 -110 C -76 -124 -68 -130 -58 -128 L -48 -120 L -44 -104 L -36 -92 Z', fill) +
    circ(-46, -132, 9, fill) +
    p(
      'M -66 -118 C -84 -146 -78 -172 -56 -178 C -36 -182 -16 -168 -2 -150 L -16 -148 L -12 -140 L -28 -140 L -26 -132 L -44 -134 C -52 -132 -60 -126 -66 -118 Z',
      fill,
    );
  const g =
    (poleFill ? box(-160, -40, 320, 9, poleFill, 4.5) : '') +
    box(-74, -10, 12, 10, fill) +
    box(62, -10, 12, 10, fill) +
    box(-76, -84, 152, 76, fill, 4) +
    box(-70, -62, 140, 5, '#FFFFFF', 0, 'opacity="0.35"') +
    box(-70, -30, 140, 5, '#FFFFFF', 0, 'opacity="0.35"') +
    box(-84, -94, 168, 12, fill, 3) +
    cherub +
    at(0, 0, 1, cherub, { flip: true });
  return place(x, y, s, g, o);
}

/** A square altar with a horn at each corner (two seen), ~140 wide and ~120 tall at s = 1. */
export function hornedAltar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g =
    box(-60, -92, 120, 92, fill, 3) +
    box(-60, -52, 120, 6, '#FFFFFF', 0, 'opacity="0.28"') +
    box(-70, -104, 140, 14, fill, 3) +
    p('M -70 -102 L -72 -124 L -52 -102 Z', fill) +
    p('M 70 -102 L 72 -124 L 52 -102 Z', fill);
  return place(x, y, s, g, o);
}

/** An altar of unhewn stones, laid with gaps so the stones read; ~190 wide and ~96 tall at s = 1. */
export function stoneAltar(rand: () => number, x: number, y: number, s: number, fill: string, o?: Place): string {
  const out: string[] = [];
  const rows = [4, 4, 3];
  let yy = 0;
  rows.forEach((n, r) => {
    const h = 28 + rand() * 4;
    const total = 188 - r * 14;
    const w = total / n;
    for (let i = 0; i < n; i += 1) {
      const sx = -total / 2 + i * w + (r % 2 ? w * 0.12 : 0);
      const jw = (rand() - 0.5) * 8;
      out.push(box(sx + 2, yy - h, w - 4 + jw, h - 3, fill, 10));
    }
    yy -= h;
  });
  return place(x, y, s, out.join(''), o);
}

/** A tall standing stone, rounded at the top: a witness stone, ~70 wide and ~178 tall at s = 1. */
export function stele(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g = p('M -30 0 L -34 -120 Q -32 -172 0 -178 Q 32 -172 34 -120 L 30 0 Z', fill);
  return place(x, y, s, g, o);
}

/** One rough field stone: an irregular polygon around (cx, cy), flat underneath. */
function roughStone(rand: () => number, cx: number, cy: number, rx: number, ry: number, fill: string): string {
  const pts: string[] = [];
  const n = 8;
  const start = rand() * 0.6;
  for (let i = 0; i < n; i += 1) {
    const a = start + (i / n) * Math.PI * 2;
    const k = 0.82 + rand() * 0.24;
    const yy = Math.min(cy + Math.sin(a) * ry * k, cy + ry * 0.78);
    pts.push(`${r1(cx + Math.cos(a) * rx * k)} ${r1(yy)}`);
  }
  return p(`M ${pts.join(' L ')} Z`, fill);
}

/** A cairn of rough stones in rows (5, 4, 2, 1: twelve); ~240 wide and ~120 tall at s = 1. */
export function cairn(rand: () => number, x: number, y: number, s: number, fill: string, rows = [5, 4, 2, 1], o?: Place): string {
  const out: string[] = [];
  rows.forEach((n, r) => {
    const y0 = -r * 28;
    for (let i = 0; i < n; i += 1) {
      const cx = (i - (n - 1) / 2) * 48 + (rand() - 0.5) * 6;
      out.push(roughStone(rand, cx, y0 - 15, 24 + rand() * 4, 17 + rand() * 3, fill));
    }
  });
  return place(x, y, s, out.join(''), o);
}

/** A low, wide nomad tent of dark cloth on several poles, guy ropes out to the sides; ~390 wide, ~120 tall at s = 1. */
export function nomadTent(x: number, y: number, s: number, fill: string, door?: string, o?: Place): string {
  const g =
    stroke('M -150 -70 L -194 0', fill, 3) +
    stroke('M 156 -64 L 198 0', fill, 3) +
    p('M -164 0 L -150 -70 L -96 -96 L -40 -82 L 10 -120 L 64 -90 L 120 -102 L 156 -64 L 168 0 Z', fill) +
    (door ? p('M -34 0 L -24 -64 L 28 -70 L 38 0 Z', door) : '');
  return place(x, y, s, g, o);
}

/** A ram's-horn trumpet, mouthpiece at (x, y), curving up and out to the bell (~150 long at s = 1). */
export function shofar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const pts: [number, number][] = [];
  const n = 18;
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    // quadratic bezier P0 (0,0), P1 (112,22), P2 (150,-78)
    const px = 2 * (1 - t) * t * 112 + t * t * 150;
    const py = 2 * (1 - t) * t * 22 + t * t * -78;
    pts.push([px, py]);
  }
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= n; i += 1) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = 4 + 18 * Math.pow(i / n, 1.7);
    const nx = (-dy / len) * w;
    const ny = (dx / len) * w;
    left.push(`${r1(pts[i][0] + nx)} ${r1(pts[i][1] + ny)}`);
    right.unshift(`${r1(pts[i][0] - nx)} ${r1(pts[i][1] - ny)}`);
  }
  const end = pts[n];
  const g = p(`M ${left.join(' L ')} L ${right.join(' L ')} Z`, fill) + ell(end[0], end[1], 22, 11, fill, `transform="rotate(-18 ${r1(end[0])} ${r1(end[1])})"`);
  return place(x, y, s, g, o);
}

/** A sword pointing up; `y` is the pommel. ~56 wide, ~210 tall at s = 1. Rotate with `rot`. */
export function sword(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g =
    circ(0, -5, 8, fill) +
    box(-4.5, -38, 9, 34, fill, 3) +
    box(-28, -47, 56, 10, fill, 4) +
    p('M -8 -46 L -8 -186 L 0 -210 L 8 -186 L 8 -46 Z', fill);
  return place(x, y, s, g, o);
}

/** A javelin from (x1, y1) to its point at (x2, y2). */
export function javelin(x1: number, y1: number, x2: number, y2: number, w: number, shaft: string, head: string): string {
  const deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return stroke(`M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}`, shaft, w) + at(x2, y2, w / 6, p('M -6 -8 L 40 0 L -6 8 L 0 0 Z', head), { rot: deg });
}

/** Balance scales with two pans; ~300 wide and ~190 tall at s = 1. `tilt` lowers the left pan (degrees). */
export function scales(x: number, y: number, s: number, fill: string, tilt = 0, o?: Place): string {
  const pan = (side: 1 | -1) => {
    const bx = 112 * side;
    return (
      stroke(`M ${bx} -170 L ${bx - 36} -84`, fill, 3.5) +
      stroke(`M ${bx} -170 L ${bx + 36} -84`, fill, 3.5) +
      p(`M ${bx - 42} -86 L ${bx + 42} -86 Q ${bx + 36} -58 ${bx} -56 Q ${bx - 36} -58 ${bx - 42} -86 Z`, fill)
    );
  };
  const beam = box(-116, -176, 232, 9, fill, 4.5) + pan(-1) + pan(1);
  const g =
    p('M -46 0 L -30 -18 L 30 -18 L 46 0 Z', fill) +
    box(-5.5, -178, 11, 164, fill, 3) +
    `<g transform="rotate(${r1(-tilt)} 0 -172)">${beam}</g>` +
    circ(0, -178, 11, fill) +
    p('M 0 -200 L 9 -186 L -9 -186 Z', fill);
  return place(x, y, s, g, o);
}

/** A booth (loofhut) of poles with a roof of leafy branches, open in front; ~300 wide, ~200 tall at s = 1. */
export function booth(x: number, y: number, s: number, frame: string, leaves: string, o?: Place): string {
  const out = [
    box(-100, -150, 9, 150, frame, 0, 'opacity="0.6"'),
    box(92, -150, 9, 150, frame, 0, 'opacity="0.6"'),
    box(-136, -160, 11, 160, frame, 3),
    box(126, -160, 11, 160, frame, 3),
    box(-146, -168, 292, 11, frame, 4),
  ];
  for (let i = 0; i < 9; i += 1) {
    const lx = -140 + i * 35;
    out.push(ell(lx, -178 - (i % 2) * 8, 30, 17, leaves));
  }
  for (let i = 0; i < 6; i += 1) {
    const lx = -118 + i * 48;
    out.push(p(`M ${lx} -166 C ${lx - 10} -140 ${lx - 4} -122 ${lx + 4} -110 C ${lx + 10} -128 ${lx + 12} -146 ${lx + 8} -166 Z`, leaves));
  }
  return place(x, y, s, out.join(''), o);
}

/** A bird's nest with three eggs peeking over the rim; `y` is the bottom; ~130 wide at s = 1. */
export function nest(x: number, y: number, s: number, fill: string, egg: string, o?: Place): string {
  const g =
    ell(-26, -34, 14, 18, egg) +
    ell(0, -40, 14, 18, egg) +
    ell(26, -34, 14, 18, egg) +
    p('M -66 -34 Q -62 4 0 4 Q 62 4 66 -34 Q 0 -20 -66 -34 Z', fill) +
    stroke('M -70 -32 L -86 -40', fill, 4) +
    stroke('M 64 -30 L 84 -42', fill, 4) +
    stroke('M -48 -14 Q 0 -4 50 -16', '#FFFFFF', 3, 0.25);
  return place(x, y, s, g, o);
}

/** A two-handled water jar, ~100 tall at s = 1. */
export function jar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g =
    p('M -14 -100 L 14 -100 L 12 -86 C 34 -76 40 -40 30 -16 C 24 -4 12 0 0 0 C -12 0 -24 -4 -30 -16 C -40 -40 -34 -76 -12 -86 Z', fill) +
    box(-19, -106, 38, 9, fill, 3) +
    stroke('M -12 -88 C -36 -92 -38 -66 -26 -58', fill, 6) +
    stroke('M 12 -88 C 36 -92 38 -66 26 -58', fill, 6);
  return place(x, y, s, g, o);
}

/** A woodsman's axe: handle from (x, y) up, blade at the top facing left. ~170 tall at s = 1. Rotate with `rot`. */
export function axe(x: number, y: number, s: number, handle: string, blade: string, o?: Place): string {
  const g = box(-5, -160, 10, 160, handle, 5) + p('M -4 -168 L -48 -186 C -60 -164 -60 -134 -48 -114 L -4 -134 Z', blade);
  return place(x, y, s, g, o);
}

/** A plough: the share in the ground at (x, y), the beam running forward-left to the yoke, a handle back-up. */
export function plough(x: number, y: number, s: number, fill: string, o?: Place): string {
  const g =
    stroke('M 0 -22 L -150 -56', fill, 7) +
    stroke('M 0 -22 L 34 -88', fill, 7) +
    stroke('M 34 -88 L 50 -92', fill, 6) +
    p('M -10 -26 L 14 -26 L 4 4 Z', fill);
  return place(x, y, s, g, o);
}

/** Og's iron bedstead (Deut 3:11): head and foot boards, a long rail on legs, a cover on top; ~400 wide at s = 1. */
export function bedstead(x: number, y: number, s: number, frame: string, cover: string, o?: Place): string {
  const g =
    box(-184, -44, 16, 44, frame, 3) +
    box(150, -44, 16, 44, frame, 3) +
    box(-190, -70, 370, 28, frame, 5) +
    box(-170, -100, 330, 34, cover, 15) +
    ell(-136, -104, 30, 14, cover) +
    box(-204, -186, 32, 186, frame, 9) +
    circ(-188, -194, 14, frame) +
    box(166, -126, 28, 126, frame, 9) +
    circ(180, -134, 12, frame);
  return place(x, y, s, g, o);
}

/**
 * The tabernacle in its court: the tent of meeting (boards and curtains under
 * a draped roof) rising behind white linen hangings on dark posts, with the
 * gate curtain at the east end. ~470 wide and ~170 tall at s = 1. `o.tent`
 * colours the tent of meeting apart from the frame and posts.
 */
export function tabernacle(
  x: number,
  y: number,
  s: number,
  frame: string,
  linen: string,
  gate: string,
  o?: Place & { tent?: string },
): string {
  const t = o?.tent ?? frame;
  const out = [box(-30, -150, 236, 116, t, 3), p('M -42 -146 Q 88 -172 218 -146 L 218 -134 L -42 -134 Z', t)];
  for (let i = 0; i < 7; i += 1) out.push(box(-14 + i * 34, -134, 3, 96, '#FFFFFF', 0, 'opacity="0.2"'));
  out.push(box(-234, -54, 468, 50, linen, 2));
  for (let i = 0; i <= 16; i += 1) out.push(box(-236 + i * 29.25, -62, 6, 62, frame, 2));
  out.push(box(-150, -54, 96, 54, gate, 2));
  return place(x, y, s, out.join(''), o);
}

/** A pillar of cloud standing on the ground at (x, y), billowing at the top; ~380 tall at s = 1. */
export function cloudPillar(x: number, y: number, s: number, fill: string, o?: Place): string {
  const out = [p('M -44 0 C -50 -100 -40 -200 -50 -300 L 50 -300 C 40 -200 50 -100 44 0 Z', fill)];
  const puffs: [number, number, number][] = [
    [-56, -300, 42],
    [0, -326, 52],
    [56, -302, 42],
    [-30, -270, 38],
    [32, -268, 38],
    [-42, -214, 26],
    [44, -190, 26],
    [-44, -140, 24],
    [46, -96, 24],
    [-46, -50, 24],
    [42, -20, 22],
  ];
  for (const [px, py, r] of puffs) out.push(circ(px, py, r, fill));
  return place(x, y, s, out.join(''), o);
}

/**
 * A crescent moon, horns to the right. (The shared `crescent` closes with an
 * inner arc whose radius is under half the chord, which SVG scales up onto the
 * outer arc, so it draws nothing; this one uses a wider inner arc.)
 */
export function moon(x: number, y: number, r: number, fill: string, o?: Opts): string {
  const g = p(
    `M ${r1(x)} ${r1(y - r)} A ${r1(r)} ${r1(r)} 0 1 0 ${r1(x)} ${r1(y + r)} A ${r1(r * 1.3)} ${r1(r * 1.3)} 0 0 1 ${r1(x)} ${r1(y - r)} Z`,
    fill,
  );
  return o?.opacity !== undefined && o.opacity !== 1 ? `<g opacity="${o.opacity}">${g}</g>` : g;
}

/** A four-pointed star with a tapering tail trailing down-left: a sign in the sky. */
export function comet(x: number, y: number, s: number, fill: string, o?: Place): string {
  const k = 8;
  const star = `M 0 -40 C ${k} ${-k} ${k} ${-k} 40 0 C ${k} ${k} ${k} ${k} 0 40 C ${-k} ${k} ${-k} ${k} -40 0 C ${-k} ${-k} ${-k} ${-k} 0 -40 Z`;
  const g = p('M -4 -10 L -250 100 L -244 110 L 6 10 Z', fill, 'opacity="0.45"') + p('M -2 -6 L -170 50 L -168 56 L 2 6 Z', fill, 'opacity="0.6"') + p(star, fill) + circ(0, 0, 12, fill);
  return place(x, y, s, g, o);
}

/** A small hill town: a few flat-roofed houses inside a low wall, with an accent roof on the middle house. */
export function hamlet(rand: () => number, x: number, y: number, s: number, fill: string, roof?: string, o?: Place): string {
  const out: string[] = [];
  const xs = [-48, -16, 18, 50];
  xs.forEach((hx, i) => {
    const h = 34 + rand() * 26 + (i === 1 || i === 2 ? 12 : 0);
    out.push(box(hx - 17, -h, 34, h, fill, 2));
  });
  out.push(box(-70, -24, 140, 24, fill, 2));
  if (roof) out.push(p('M -32 -70 Q 0 -100 32 -70 Z', roof));
  return place(x, y, s, out.join(''), o);
}

/** Pomegranates or figs hanging in a tree crown: a few accent fruit around (x, y). */
export function fruitIn(rand: () => number, x: number, y: number, w: number, h: number, r: number, fill: string, n = 7): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const fx = x + (rand() - 0.5) * w;
    const fy = y + (rand() - 0.5) * h;
    out.push(circ(fx, fy, r, fill) + p(`M ${r1(fx - r * 0.35)} ${r1(fy - r * 0.9)} L ${r1(fx)} ${r1(fy - r * 1.35)} L ${r1(fx + r * 0.35)} ${r1(fy - r * 0.9)} Z`, fill));
  }
  return out.join('');
}

/** A grape cluster hanging from a pole carried between two bearers (Num 13 / Deut 1:24-25). Local, centred on the pole. */
export function bigCluster(x: number, y: number, s: number, fill: string, o?: Place): string {
  const out: string[] = [];
  const rows = [5, 5, 4, 4, 3, 2, 1];
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i += 1) out.push(circ((i - (n - 1) / 2) * 17, 16 + r * 14, 10, fill));
  });
  out.push(p('M -6 0 L 6 0 L 4 14 L -4 14 Z', fill), p('M 6 6 C 26 -6 46 2 48 18 C 30 24 16 18 6 6 Z', fill));
  return place(x, y, s, out.join(''), o);
}
