/**
 * Shared motif library for the cover style options.
 *
 * Every motif is drawn in its own local unit space with the origin at the
 * point it stands on (bottom centre), and placed with `at(x, y, s, ...)`.
 * The shapes take their colours as arguments so the same lion, basket or
 * throne can be drawn as a soft silhouette (option A), a flat poster shape
 * (option B), a paper cut-out (option C) or an icon (option D).
 *
 * librsvg (sharp) renders all of this: paths, strokes with round caps,
 * gradients, transforms, and the blur/turbulence filters option C uses.
 */

export const W = 1408;
export const H = 792;

const n = (v: number) => (Math.round(v * 10) / 10).toString();

/** Place a fragment drawn in local coordinates. `flip` mirrors it horizontally. */
export function at(x: number, y: number, s: number, inner: string, o: { flip?: boolean; rot?: number; opacity?: number } = {}): string {
  const t = [`translate(${n(x)} ${n(y)})`];
  if (o.rot) t.push(`rotate(${n(o.rot)})`);
  t.push(o.flip ? `scale(${-s} ${s})` : `scale(${s})`);
  const op = o.opacity !== undefined && o.opacity !== 1 ? ` opacity="${o.opacity}"` : '';
  return `<g transform="${t.join(' ')}"${op}>${inner}</g>`;
}

export const p = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const line = (d: string, stroke: string, w: number, extra = '') =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
export const circ = (x: number, y: number, r: number, fill: string, extra = '') =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const ell = (x: number, y: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const box = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''} fill="${fill}"${extra ? ' ' + extra : ''}/>`;
export const grp = (inner: string, extra = '') => `<g${extra ? ' ' + extra : ''}>${inner}</g>`;

/** mulberry32, seeded from a string - same art every run. */
export function rng(seed: string): () => number {
  let a = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    a = Math.imul(a ^ seed.charCodeAt(i), 3432918353);
    a = (a << 13) | (a >>> 19);
  }
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mix two #rrggbb colours. t=0 gives a, t=1 gives b. */
export function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

// ── terrain ────────────────────────────────────────────────────────────────

/** A soft rolling band filled to the bottom of the canvas. */
export function hills(rand: () => number, y: number, amp: number, fill: string, segs = 3, extra = ''): string {
  const step = (W + 200) / segs;
  let x = -100;
  let cy = y + (rand() - 0.5) * amp;
  let d = `M -100 ${n(cy)}`;
  for (let i = 0; i < segs; i += 1) {
    const ny = y + (rand() - 0.5) * amp;
    d += ` C ${n(x + step * 0.4)} ${n(cy - amp * (0.2 + rand() * 0.6))} ${n(x + step * 0.6)} ${n(ny - amp * (0.1 + rand() * 0.5))} ${n(x + step)} ${n(ny)}`;
    x += step;
    cy = ny;
  }
  d += ` L ${W + 100} ${H + 120} L -100 ${H + 120} Z`;
  return p(d, fill, extra);
}

/** A hill described by explicit control points, for compositions that need the shape to be exact. */
export function band(points: [number, number][], fill: string, extra = ''): string {
  let d = `M -100 ${n(points[0][1])} L ${n(points[0][0])} ${n(points[0][1])}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${n(mx)} ${n(y0)} ${n(mx)} ${n(y1)} ${n(x1)} ${n(y1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${W + 100} ${n(last[1])} L ${W + 100} ${H + 120} L -100 ${H + 120} Z`;
  return p(d, fill, extra);
}

/** A mountain massif with a rounded summit; local width ~ 2*w, height h. */
export function mountain(w: number, h: number, fill: string, extra = ''): string {
  return p(
    `M ${-w} 0 C ${-w * 0.7} ${-h * 0.2} ${-w * 0.42} ${-h * 0.62} ${-w * 0.18} ${-h * 0.9} ` +
      `C ${-w * 0.08} ${-h * 1.02} ${w * 0.06} ${-h * 1.02} ${w * 0.14} ${-h * 0.92} ` +
      `C ${w * 0.3} ${-h * 0.72} ${w * 0.34} ${-h * 0.66} ${w * 0.46} ${-h * 0.6} ` +
      `C ${w * 0.66} ${-h * 0.42} ${w * 0.8} ${-h * 0.2} ${w} 0 Z`,
    fill,
    extra,
  );
}

// ── people ─────────────────────────────────────────────────────────────────

export type Pose = 'stand' | 'raise' | 'bless' | 'staff' | 'carry' | 'reach' | 'walk' | 'shield';

/**
 * A robed figure, ~204 units tall, front view. Head, head cloth and robe are
 * one continuous outline (a hooded silhouette, not a ball on a block); the
 * sleeves are thick round-capped strokes that merge into it. No faces: the
 * covers never show a face, and Christ is drawn the same way as everyone else.
 */
export function figure(fill: string, pose: Pose = 'stand', o: { hood?: boolean; staffFill?: string } = {}): string {
  const out: string[] = [];
  const sleeve = (d: string) => line(d, fill, 17);
  const hand = (x: number, y: number) => circ(x, y, 7.5, fill);
  if (o.hood === false) {
    out.push(
      p('M -41 0 C -37 -24 -33 -50 -31 -84 C -29 -120 -28 -146 -24 -154 C -18 -160 -10 -160 -7 -164 L 7 -164 C 10 -160 18 -160 24 -154 C 28 -146 29 -120 31 -84 C 33 -50 37 -24 41 0 Z', fill),
      circ(0, -180, 16, fill),
    );
  } else {
    out.push(
      p(
        'M -41 0 C -37 -24 -33 -50 -31 -84 C -29 -118 -29 -146 -26 -156 C -21 -164 -18 -170 -17 -184 ' +
          'C -17 -197 -10 -204 0 -204 C 10 -204 17 -197 17 -184 C 18 -170 21 -164 26 -156 ' +
          'C 29 -146 29 -118 31 -84 C 33 -50 37 -24 41 0 Z',
        fill,
      ),
    );
  }
  const restL = 'M -22 -148 C -30 -122 -32 -104 -31 -90';
  const restR = 'M 22 -148 C 30 -122 32 -104 31 -90';
  switch (pose) {
    case 'raise':
      out.push(sleeve('M -20 -150 C -34 -170 -42 -192 -48 -220'), sleeve('M 20 -150 C 34 -170 42 -192 48 -220'), hand(-49, -224), hand(49, -224));
      break;
    case 'bless':
      out.push(sleeve('M 20 -150 C 40 -146 56 -146 72 -158'), hand(77, -161), sleeve(restL));
      break;
    case 'shield':
      out.push(sleeve('M 20 -150 C 34 -150 30 -176 16 -184'), sleeve(restL));
      break;
    case 'staff':
      out.push(line('M 54 -240 L 54 0', o.staffFill ?? fill, 7));
      out.push(sleeve('M 20 -150 C 36 -136 44 -128 50 -128'), hand(53, -128), sleeve(restL));
      break;
    case 'carry':
      out.push(sleeve('M -20 -148 C -32 -122 -26 -106 -10 -104'), sleeve('M 20 -148 C 32 -122 26 -106 10 -104'));
      break;
    case 'reach':
      out.push(sleeve('M 20 -150 C 40 -134 58 -118 76 -106'), hand(80, -103), sleeve(restL));
      break;
    case 'walk':
      out.push(sleeve('M 20 -150 C 30 -126 36 -110 46 -100'), sleeve('M -20 -148 C -30 -126 -38 -110 -46 -100'));
      out.push(p('M 10 0 L 36 -6 L 50 0 Z', fill));
      break;
    default:
      out.push(sleeve(restL), sleeve(restR));
  }
  return out.join('');
}

/** Kneeling, side view, facing right; ~154 tall. Upright torso, thighs forward, shins on the ground. */
export function kneeler(fill: string, arms: 'pray' | 'forward' | 'up' | 'plant' = 'pray'): string {
  const out = [
    p(
      'M -46 0 L -42 -16 C -32 -22 -26 -32 -24 -52 C -24 -80 -22 -100 -18 -114 C -14 -122 -6 -125 2 -123 L 14 -120 ' +
        'C 22 -110 22 -86 18 -66 C 30 -60 48 -54 58 -40 C 64 -30 64 -10 60 0 Z',
      fill,
    ),
    circ(2, -139, 16, fill),
    p('M -14 -137 C -16 -159 18 -161 18 -141 C 18 -133 16 -127 12 -123 L -20 -112 Z', fill),
  ];
  const s = (d: string) => line(d, fill, 14);
  if (arms === 'pray') out.push(s('M 8 -114 C 22 -104 32 -110 38 -128'), circ(39, -132, 7, fill));
  if (arms === 'forward') out.push(s('M 8 -114 C 28 -100 46 -94 66 -94'), circ(70, -94, 7, fill));
  if (arms === 'up') out.push(s('M 8 -116 C 26 -126 40 -142 50 -162'), circ(52, -166, 7, fill));
  if (arms === 'plant') out.push(s('M 8 -112 C 30 -94 48 -64 62 -34'), circ(64, -28, 7, fill));
  return out.join('');
}

/** Bowed low on the knees, face hidden in the hands, facing right; ~110 tall. */
export function bowed(fill: string): string {
  return (
    p('M -60 0 C -64 -44 -50 -84 -18 -100 C 10 -112 44 -104 62 -82 C 72 -70 74 -56 70 -44 C 76 -28 74 -12 70 0 Z', fill) +
    p('M 52 -92 C 64 -108 88 -106 96 -88 C 102 -74 94 -56 78 -52 C 64 -50 54 -62 52 -76 Z', fill) +
    line('M 40 -70 C 62 -52 80 -46 94 -46', fill, 14)
  );
}

/** Lying face-down in awe, facing right; ~64 tall, ~150 long. */
export function prostrate(fill: string): string {
  return (
    p('M -78 0 C -80 -30 -56 -52 -20 -54 C 14 -56 38 -42 52 -26 L 60 0 Z', fill) +
    circ(62, -20, 15, fill) +
    line('M 40 -34 C 60 -16 78 -8 98 -6', fill, 13)
  );
}

/** Seated on the ground, front view; ~105 tall. */
export function sitter(fill: string, variant = 0): string {
  const out = [
    p('M -30 0 C -32 -36 -22 -70 0 -72 C 22 -70 32 -36 30 0 Z', fill),
    circ(0, -88, 13, fill),
  ];
  if (variant % 3 !== 2) out.push(p('M -14 -90 C -16 -108 16 -108 14 -90 L 18 -66 L -18 -66 Z', fill));
  return out.join('');
}

/** A group of seated people in rows, receding. Returns figures from back to front. */
export function seatedCrowd(rand: () => number, x0: number, x1: number, yBack: number, yFront: number, rows: number, fill: string, fillBack: string, sBack = 0.42, sFront = 0.7): string {
  const out: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    const t = rows === 1 ? 1 : r / (rows - 1);
    const y = yBack + (yFront - yBack) * t;
    const s = sBack + (sFront - sBack) * t;
    const gap = 62 * s * 1.25;
    const off = (r % 2) * gap * 0.5;
    const col = mix(fillBack, fill, t);
    for (let x = x0 + off; x < x1; x += gap * (0.9 + rand() * 0.5)) {
      if (rand() < 0.16) continue;
      out.push(at(x + (rand() - 0.5) * 6, y + (rand() - 0.5) * 4, s * (0.9 + rand() * 0.2), sitter(col, Math.floor(rand() * 3))));
    }
  }
  return out.join('');
}

// ── animals ────────────────────────────────────────────────────────────────

/** A sheep facing right; ~70 tall. */
export function sheep(body: string, head: string): string {
  return (
    box(-22, -26, 6, 26, head, 3) +
    box(12, -26, 6, 26, head, 3) +
    circ(-16, -40, 19, body) +
    circ(16, -40, 19, body) +
    circ(-2, -52, 19, body) +
    circ(0, -34, 20, body) +
    circ(-28, -44, 12, body) +
    p('M 26 -56 C 44 -60 50 -44 46 -34 C 42 -26 30 -30 26 -40 Z', head) +
    ell(30, -56, 8, 4, head, 'transform="rotate(-24 30 -56)"')
  );
}

/** A lion lying down, facing right; ~90 tall, ~210 long. */
export function lion(fill: string, mane: string): string {
  return (
    p('M -100 -6 C -104 -40 -70 -62 -20 -62 C 20 -62 50 -58 66 -44 L 74 0 L -96 0 Z', fill) +
    p('M -100 -20 C -128 -24 -138 -6 -124 2 C -116 6 -110 -2 -104 -8', 'none', `stroke="${fill}" stroke-width="7" stroke-linecap="round"`) +
    circ(-128, -2, 7, mane) +
    p('M 40 -96 C 70 -112 108 -96 112 -64 C 116 -36 100 -8 70 -6 C 44 -4 28 -24 28 -50 C 28 -70 30 -88 40 -96 Z', mane) +
    p('M 76 -76 C 92 -78 108 -68 110 -52 C 112 -38 104 -26 92 -24 L 76 -26 C 66 -36 64 -64 76 -76 Z', fill) +
    p('M 20 0 L 96 0 C 100 -8 96 -12 88 -12 L 30 -14 Z', fill)
  );
}

// ── plants ─────────────────────────────────────────────────────────────────

/**
 * A desert thorn bush: branching stems and an uneven crown of small leaf
 * clusters, ~150 tall, ~240 wide. `rand` keeps every bush its own shape.
 */
export function bushClump(fill: string, light?: string, rand: () => number = rng('bush')): string {
  const out = [
    line('M 0 0 C -4 -30 -30 -60 -70 -86', fill, 9),
    line('M 0 0 C 2 -40 -6 -80 -10 -118', fill, 10),
    line('M 0 0 C 8 -34 36 -64 78 -82', fill, 9),
    line('M -30 -56 C -50 -64 -70 -62 -96 -56', fill, 6),
    line('M 30 -52 C 54 -58 76 -56 100 -48', fill, 6),
    ell(0, -4, 34, 8, fill),
  ];
  // An uneven dome of small leaf clusters, denser at the centre.
  for (let i = 0; i < 46; i += 1) {
    const a = Math.PI * (0.04 + rand() * 0.92);
    const rr = Math.sqrt(rand());
    const x = -Math.cos(a) * 112 * rr;
    const y = -40 - Math.sin(a) * 92 * rr - (1 - rr) * 6;
    out.push(circ(x, y, 11 + rand() * 9, fill));
  }
  // A few thorny twigs breaking the outline.
  out.push(line('M -110 -70 L -128 -84 M 112 -60 L 132 -70 M -30 -146 L -38 -166 M 40 -140 L 50 -160', fill, 5));
  if (light) for (const [x, y] of [[-50, -110], [20, -136], [70, -96]] as const) out.push(ell(x, y, 14, 6, light, 'opacity="0.35"'));
  return out.join('');
}

/** Tongues of fire spread across a bush crown: back flames, so draw before the bush, then `bushFlamesFront`. */
export function bushFlames(outer: string, middle: string, core: string): string {
  const f = (x: number, y: number, h: number, w: number, lean: number) => at(x, y, 1, flame(h, w, outer, lean) + at(0, 0, 0.66, flame(h, w, middle, lean * 0.6)) + at(0, 0, 0.34, flame(h, w, core, 0)));
  return f(-62, -78, 120, 70, -12) + f(60, -76, 130, 72, 14) + f(0, -100, 190, 104, 4) + f(-30, -96, 140, 76, -6) + f(32, -96, 150, 78, 8);
}

export function bushFlamesFront(outer: string, middle: string): string {
  const f = (x: number, y: number, h: number, w: number, lean: number) => at(x, y, 1, flame(h, w, outer, lean) + at(0, 0, 0.6, flame(h, w, middle, lean)));
  return f(-86, -48, 60, 34, -6) + f(-20, -56, 74, 40, 4) + f(44, -46, 66, 36, 8) + f(92, -40, 52, 30, 6);
}

/** A flame, base at origin; height h, width w. */
export function flame(h: number, w: number, fill: string, lean = 0): string {
  return p(
    `M ${lean} ${-h} C ${w * 0.18 + lean * 0.6} ${-h * 0.74} ${w * 0.62} ${-h * 0.58} ${w * 0.5} ${-h * 0.26} ` +
      `C ${w * 0.42} ${-h * 0.02} ${w * 0.2} 0 0 0 C ${-w * 0.2} 0 ${-w * 0.42} ${-h * 0.02} ${-w * 0.5} ${-h * 0.26} ` +
      `C ${-w * 0.6} ${-h * 0.52} ${-w * 0.08 + lean * 0.4} ${-h * 0.62} ${lean} ${-h} Z`,
    fill,
  );
}

/** Three-layer fire: outer, middle, core. */
export function fire(h: number, w: number, outer: string, middle: string, core: string): string {
  return (
    at(-w * 0.36, 0, 0.72, flame(h, w * 0.9, outer, -14)) +
    at(w * 0.38, 0, 0.66, flame(h, w * 0.9, outer, 12)) +
    flame(h, w, outer, 4) +
    at(0, 0, 0.7, flame(h, w, middle, 2)) +
    at(0, 0, 0.38, flame(h, w, core, 0))
  );
}

export function wheatStalk(h: number, stem: string, grain: string): string {
  const out = [line(`M 0 0 C 2 ${-h * 0.4} -2 ${-h * 0.7} 0 ${-h}`, stem, 4)];
  for (let i = 0; i < 6; i += 1) {
    const y = -h + 10 + i * 13;
    out.push(ell(-7, y, 5, 10, grain, `transform="rotate(-28 -7 ${y})"`), ell(7, y, 5, 10, grain, `transform="rotate(28 7 ${y})"`));
  }
  out.push(ell(0, -h - 2, 4.5, 10, grain));
  return out.join('');
}

export function sheaf(stem: string, grain: string, band: string): string {
  const out: string[] = [];
  for (let i = -4; i <= 4; i += 1) {
    out.push(at(i * 4, 0, 1, wheatStalk(150 + (4 - Math.abs(i)) * 6, stem, grain), { rot: i * 6 }));
  }
  out.push(p('M -30 0 L -14 -70 L 14 -70 L 30 0 Z', stem));
  out.push(box(-18, -76, 36, 12, band, 4));
  return out.join('');
}

export function sapling(stem: string, leaf: string): string {
  return (
    line('M 0 0 C 0 -20 2 -40 0 -62', stem, 6) +
    p('M 0 -40 C -12 -56 -34 -58 -42 -48 C -30 -36 -14 -36 0 -40 Z', leaf) +
    p('M 0 -52 C 12 -70 34 -74 42 -62 C 30 -50 14 -48 0 -52 Z', leaf) +
    p('M 0 -62 C -6 -80 -2 -94 6 -100 C 12 -88 10 -72 0 -62 Z', leaf) +
    ell(0, 2, 34, 7, stem, 'opacity="0.35"')
  );
}

export function olive(trunk: string, crown: string): string {
  return (
    p('M -22 0 C -12 -18 -16 -40 -36 -66 L -22 -74 C -10 -60 -4 -50 -2 -42 C 4 -58 18 -70 38 -82 L 48 -72 C 28 -58 20 -40 18 -22 C 18 -12 22 -4 28 0 Z', trunk) +
    ell(-58, -96, 40, 26, crown) +
    ell(-20, -122, 48, 32, crown) +
    ell(30, -126, 50, 32, crown) +
    ell(66, -100, 40, 26, crown) +
    ell(4, -96, 60, 26, crown) +
    ell(-40, -140, 26, 16, crown) +
    ell(34, -150, 28, 16, crown)
  );
}

export function cypress(fill: string): string {
  return p('M 0 -200 C 24 -150 32 -80 26 -24 C 20 -4 -20 -4 -26 -24 C -32 -80 -24 -150 0 -200 Z', fill) + box(-4, -10, 8, 10, fill);
}

export function palm(trunk: string, leaves: string): string {
  const leaf = (rot: number, len: number) =>
    at(0, -180, 1, p(`M 0 0 C ${len * 0.3} -26 ${len * 0.72} -26 ${len} 8 C ${len * 0.66} -6 ${len * 0.3} -4 0 6 Z`, leaves), { rot });
  return (
    p('M -6 0 C -2 -60 6 -120 -2 -180 L 8 -180 C 16 -120 8 -60 8 0 Z', trunk) +
    leaf(-160, 90) + leaf(-130, 100) + leaf(-30, 100) + leaf(-4, 90) + leaf(-80, 70) + leaf(-200, 70)
  );
}

// ── buildings ──────────────────────────────────────────────────────────────

/** A classical column, base at origin; height h. */
export function column(h: number, fill: string, flute?: string): string {
  const out = [box(-24, -14, 48, 14, fill, 2), box(-18, -h + 20, 36, h - 34, fill), box(-28, -h, 56, 14, fill, 2), box(-22, -h + 12, 44, 10, fill)];
  if (flute) for (const fx of [-9, 0, 9]) out.push(box(fx - 1.5, -h + 26, 3, h - 46, flute, 1.5));
  return out.join('');
}

/** A temple front with pediment; width ~ 2*w, height h. */
export function temple(w: number, h: number, fill: string, cols = 6, gap?: string): string {
  const out = [p(`M ${-w - 10} ${-h + 34} L 0 ${-h - 30} L ${w + 10} ${-h + 34} Z`, fill), box(-w - 10, -h + 34, 2 * w + 20, 16, fill), box(-w - 16, -14, 2 * w + 32, 14, fill)];
  const step = (2 * w) / (cols - 1);
  for (let i = 0; i < cols; i += 1) out.push(box(-w + i * step - 9, -h + 50, 18, h - 64, fill));
  if (gap) out.push(box(-w + 9, -h + 52, 2 * w - 18, h - 66, gap, 0, 'opacity="0.0"'));
  return out.join('');
}

/** A walled hill city: wall, two towers, a few houses and a temple roof. */
export function city(rand: () => number, w: number, fill: string, accentRoof?: string): string {
  const out: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const x = -w + 30 + (i * (2 * w - 60)) / 6 + (rand() - 0.5) * 20;
    const hh = 40 + rand() * 46;
    out.push(box(x - 22, -60 - hh, 44, hh + 10, fill));
  }
  out.push(box(-w, -64, 2 * w, 64, fill));
  for (let x = -w; x < w - 10; x += 26) out.push(box(x, -76, 16, 14, fill));
  out.push(box(-w - 16, -110, 46, 110, fill), box(w - 30, -110, 46, 110, fill));
  out.push(p(`M ${-w - 22} -110 L ${-w + 7} -136 L ${-w + 36} -110 Z`, fill), p(`M ${w - 36} -110 L ${w - 7} -136 L ${w + 22} -110 Z`, fill));
  out.push(box(-50, -150, 100, 70, fill), p('M -62 -150 L 0 -184 L 62 -150 Z', accentRoof ?? fill));
  return out.join('');
}

export function house(fill: string, door?: string): string {
  return p('M -60 0 L -60 -64 L 0 -104 L 60 -64 L 60 0 Z', fill) + (door ? box(-14, -40, 28, 40, door, 14) : '');
}

export function ark(hull: string, cabin: string): string {
  return (
    p('M -130 -50 L 130 -50 C 120 -10 90 0 60 0 L -60 0 C -90 0 -120 -10 -130 -50 Z', hull) +
    box(-70, -96, 140, 46, cabin) +
    p('M -84 -96 L 0 -128 L 84 -96 Z', hull)
  );
}

// ── objects ────────────────────────────────────────────────────────────────

export function basket(fill: string, weave?: string): string {
  const out = [p('M -62 -56 L 62 -56 L 50 -6 C 30 4 -30 4 -50 -6 Z', fill), box(-68, -66, 136, 16, fill, 8)];
  if (weave) {
    out.push(line('M -56 -38 L 56 -38', weave, 4, 'opacity="0.55"'), line('M -52 -22 L 52 -22', weave, 4, 'opacity="0.55"'));
    for (const x of [-30, 0, 30]) out.push(line(`M ${x} -50 L ${x * 0.86} -6`, weave, 4, 'opacity="0.4"'));
  }
  return out.join('');
}

export function loaf(fill: string, score?: string): string {
  return (
    p('M -34 0 C -36 -30 -14 -36 0 -36 C 14 -36 36 -30 34 0 Z', fill) +
    (score ? line('M -14 -26 L -6 -14 M 2 -28 L 10 -16 M 16 -24 L 22 -14', score, 4, 'opacity="0.6"') : '')
  );
}

export function fishShape(fill: string, eye?: string): string {
  return (
    p('M -44 0 C -24 -24 18 -26 40 0 C 18 26 -24 24 -44 0 Z', fill) +
    p('M -40 0 L -66 -20 L -60 0 L -66 20 Z', fill) +
    p('M -6 -18 L 8 -30 L 14 -16 Z', fill) +
    (eye ? circ(24, -4, 4, eye) : '')
  );
}

/** Throne with steps; origin at the floor in front of the steps, ~230 tall. */
export function throne(fill: string, trim?: string): string {
  const out = [
    box(-150, -22, 300, 22, fill, 3),
    box(-120, -42, 240, 22, fill, 3),
    p('M -60 -42 L -60 -220 C -60 -256 60 -256 60 -220 L 60 -42 Z', fill),
    box(-84, -110, 168, 26, fill, 6),
    box(-84, -150, 22, 66, fill, 6),
    box(62, -150, 22, 66, fill, 6),
  ];
  if (trim) out.push(p('M -40 -120 L -40 -210 C -40 -234 40 -234 40 -210 L 40 -120 Z', trim, 'opacity="0.5"'));
  return out.join('');
}

/** One feathered wing, pointing up from the origin; `len` long, scalloped trailing edge. */
export function wing(fill: string, len = 200): string {
  const k = len / 200;
  const q = (v: number) => n(v * k);
  return p(
    `M 0 0 C ${q(14)} ${q(-40)} ${q(44)} ${q(-120)} ${q(30)} ${q(-200)} Q ${q(12)} ${q(-188)} ${q(10)} ${q(-170)} Q ${q(-6)} ${q(-162)} ${q(-3)} ${q(-142)} ` +
      `Q ${q(-18)} ${q(-132)} ${q(-13)} ${q(-110)} Q ${q(-26)} ${q(-98)} ${q(-19)} ${q(-76)} Q ${q(-28)} ${q(-58)} ${q(-17)} ${q(-38)} Q ${q(-14)} ${q(-14)} 0 0 Z`,
    fill,
  );
}

/** A six-winged seraph as an emblem; centre at origin. No face, only wings and a flame-like core. */
export function seraph(wingFill: string, coreFill: string, wingDeep?: string): string {
  const d = wingDeep ?? wingFill;
  // Right-hand wings are mirrored so the smooth leading edge is always on top.
  const pair = (rot: number, len: number, fill: string, dy: number, widen: number) =>
    at(0, dy, 1, broadWing(fill, len, widen), { rot: -rot }) + at(0, dy, 1, broadWing(fill, len, widen), { rot, flip: true });
  return (
    pair(128, 150, d, 18, 1.35) +
    pair(62, 210, wingFill, 0, 1.6) +
    pair(18, 170, d, -10, 1.25) +
    at(0, 44, 0.5, flame(150, 70, coreFill))
  );
}

export function smoke(fill: string, w = 200): string {
  const k = w / 200;
  return (
    ell(-60 * k, -30 * k, 60 * k, 34 * k, fill) + ell(20 * k, -44 * k, 70 * k, 42 * k, fill) + ell(80 * k, -24 * k, 50 * k, 28 * k, fill) + box(-110 * k, -30 * k, 230 * k, 30 * k, fill, 14 * k)
  );
}

/** Tongs holding a glowing coal; the tongs run from lower left to upper right. */
export function tongsCoal(metal: string, coal: string, glow?: string): string {
  return (
    line('M -90 60 L 10 -6', metal, 8) +
    line('M -84 70 L 18 8', metal, 8) +
    (glow ? circ(34, -2, 46, glow, 'opacity="0.35"') : '') +
    p('M 20 -20 L 44 -22 L 56 -2 L 46 18 L 22 20 L 12 0 Z', coal)
  );
}

export function heart(fill: string): string {
  return p('M 0 34 C -44 4 -64 -18 -64 -42 C -64 -66 -42 -78 -22 -74 C -10 -72 -3 -62 0 -54 C 3 -62 10 -72 22 -74 C 42 -78 64 -66 64 -42 C 64 -18 44 4 0 34 Z', fill);
}

export function crossShape(fill: string): string {
  return box(-10, -90, 20, 150, fill, 3) + box(-46, -56, 92, 20, fill, 3);
}

export function anchor(fill: string): string {
  return (
    line('M 0 -64 L 0 50', fill, 14) +
    line('M -30 -40 L 30 -40', fill, 12) +
    `<circle cx="0" cy="-78" r="14" fill="none" stroke="${fill}" stroke-width="10"/>` +
    line('M -56 18 C -50 50 -24 60 0 60 C 24 60 50 50 56 18', fill, 13) +
    p('M -70 26 L -56 4 L -42 28 Z', fill) +
    p('M 70 26 L 56 4 L 42 28 Z', fill)
  );
}

export function hourglass(frame: string, glass: string, sand: string): string {
  return (
    p('M -54 -170 L 54 -170 C 54 -120 12 -104 12 -85 C 12 -66 54 -50 54 0 L -54 0 C -54 -50 -12 -66 -12 -85 C -12 -104 -54 -120 -54 -170 Z', glass) +
    p('M -36 -136 L 36 -136 C 30 -116 10 -104 4 -92 L -4 -92 C -10 -104 -30 -116 -36 -136 Z', sand) +
    p('M -40 -2 C -36 -26 -12 -34 0 -36 C 12 -34 36 -26 40 -2 Z', sand) +
    line('M 0 -90 L 0 -38', sand, 3) +
    box(-70, -186, 140, 18, frame, 5) +
    box(-70, -2, 140, 18, frame, 5) +
    box(-66, -170, 10, 170, frame, 4) +
    box(56, -170, 10, 170, frame, 4)
  );
}

/** An open book seen from the front; origin at the centre of the spine bottom. ~300 wide. */
export function openBook(cover: string, page: string, text?: string, ribbon?: string): string {
  const out = [
    p('M 0 -4 C -50 -20 -110 -22 -158 -8 L -160 14 C -110 2 -50 4 0 18 C 50 4 110 2 160 14 L 158 -8 C 110 -22 50 -20 0 -4 Z', cover),
    p('M 0 0 C -44 -20 -100 -22 -148 -10 L -148 -150 C -100 -164 -44 -160 0 -138 Z', page),
    p('M 0 0 C 44 -20 100 -22 148 -10 L 148 -150 C 100 -164 44 -160 0 -138 Z', page),
  ];
  if (text) {
    for (let i = 0; i < 6; i += 1) {
      const y = -126 + i * 18;
      out.push(line(`M -126 ${y + 4} C -96 ${y - 4} -50 ${y - 4} -22 ${y + 8}`, text, 4, 'opacity="0.45"'));
      out.push(line(`M 22 ${y + 8} C 50 ${y - 4} 96 ${y - 4} 126 ${y + 4}`, text, 4, 'opacity="0.45"'));
    }
  }
  if (ribbon) out.push(p('M 4 -138 L 18 -138 L 20 40 L 11 30 L 2 40 Z', ribbon));
  return out.join('');
}

export function scrollShape(paper: string, roll: string, text?: string): string {
  const out = [box(-90, -120, 180, 120, paper, 4), box(-104, -134, 208, 22, roll, 11), box(-104, -10, 208, 22, roll, 11)];
  if (text) for (let i = 0; i < 4; i += 1) out.push(line(`M -66 ${-94 + i * 22} L ${50 - (i % 2) * 24} ${-94 + i * 22}`, text, 5, 'opacity="0.5"'));
  return out.join('');
}

/** A quill pen: feather vane with two notches, a light shaft and a nib; nib at the origin. */
export function quill(fill: string, shaft?: string): string {
  return (
    p('M 6 -12 C 14 -50 40 -110 100 -170 C 98 -150 90 -132 80 -118 L 90 -116 C 78 -96 66 -84 56 -76 L 64 -72 C 48 -50 30 -30 14 -16 Z', fill) +
    line('M 0 4 C 24 -40 56 -100 96 -160', shaft ?? fill, 3) +
    p('M -6 14 L 4 -6 L 12 -2 Z', shaft ?? fill)
  );
}

/** Four-pointed star. */
export function star4(r: number, fill: string): string {
  const k = r * 0.22;
  return p(`M 0 ${-r} C ${k} ${-k} ${k} ${-k} ${r} 0 C ${k} ${k} ${k} ${k} 0 ${r} C ${-k} ${k} ${-k} ${k} ${-r} 0 C ${-k} ${-k} ${-k} ${-k} 0 ${-r} Z`, fill);
}

/** Oil lamp with a flame; origin under the lamp. */
export function lamp(body: string, flameFill: string): string {
  return p('M -56 -10 C -56 -34 30 -40 46 -24 L 74 -38 L 66 -20 C 60 -6 30 0 -20 0 C -40 0 -56 -2 -56 -10 Z', body) + at(70, -40, 0.32, flame(120, 60, flameFill));
}

/** Sun as a disc with a soft halo; for flat use pass halo = null. */
export function sun(r: number, fill: string, halo?: string, haloOpacity = 0.35): string {
  return (halo ? circ(0, 0, r * 2.1, halo, `opacity="${haloOpacity * 0.5}"`) + circ(0, 0, r * 1.45, halo, `opacity="${haloOpacity}"`) : '') + circ(0, 0, r, fill);
}

/** Simple sandals pair. */
export function sandals(fill: string): string {
  return ell(-14, -5, 11, 5, fill) + ell(14, -4, 11, 5, fill) + line('M -20 -8 L -8 -10 M 8 -9 L 20 -7', fill, 3);
}

/** Sparse three-blade tufts along a ground line - a hint of grass, not a fence. */
export function grass(rand: () => number, x0: number, x1: number, y: number, fill: string, density = 90, h = 22): string {
  const out: string[] = [];
  for (let x = x0 + rand() * density; x < x1; x += density * (0.7 + rand() * 0.9)) {
    const hh = h * (0.7 + rand() * 0.6);
    const blade = (dx: number, lean: number, k: number) =>
      p(`M ${n(x + dx - 3)} ${n(y)} Q ${n(x + dx + lean * 0.3)} ${n(y - hh * k * 0.6)} ${n(x + dx + lean)} ${n(y - hh * k)} Q ${n(x + dx + lean * 0.2 + 2)} ${n(y - hh * k * 0.5)} ${n(x + dx + 3)} ${n(y)} Z`, fill);
    out.push(blade(-6, -9, 0.75), blade(0, 1, 1), blade(6, 9, 0.7));
  }
  return out.join('');
}

/** A distant bird pair as two flicks. */
export function birds(fill: string): string {
  return line('M -14 0 q 7 -8 14 0 q 7 -8 14 0', fill, 3) + line('M 30 -18 q 5 -6 10 0 q 5 -6 10 0', fill, 2.6);
}

export function crown(fill: string, jewel?: string): string {
  return (
    p('M -70 0 L -80 -84 L -40 -44 L 0 -100 L 40 -44 L 80 -84 L 70 0 Z', fill) +
    box(-74, -12, 148, 18, fill, 4) +
    circ(-80, -88, 10, fill) + circ(0, -106, 11, fill) + circ(80, -88, 10, fill) +
    (jewel ? circ(0, -40, 10, jewel) + circ(-40, -26, 7, jewel) + circ(40, -26, 7, jewel) : '')
  );
}

/** A dove in flight, facing right, centre at origin. */
export function dove(fill: string): string {
  return (
    p('M -70 6 C -40 -6 0 -6 30 -16 C 44 -22 56 -22 64 -12 L 78 -8 L 64 -2 C 56 14 30 22 0 20 C -24 18 -44 16 -70 6 Z', fill) +
    p('M -30 0 C -40 -40 -20 -86 30 -110 C 22 -76 22 -40 14 -8 Z', fill) +
    p('M -60 4 L -100 -14 L -92 8 L -102 24 Z', fill)
  );
}

/** Two stone tablets with rounded tops; origin bottom centre. */
export function tablets(fill: string, text?: string): string {
  const one = (x: number) =>
    p(`M ${x - 44} 0 L ${x - 44} -110 C ${x - 44} -146 ${x + 44} -146 ${x + 44} -110 L ${x + 44} 0 Z`, fill) +
    (text ? [0, 1, 2, 3].map((i) => line(`M ${x - 26} ${-96 + i * 22} L ${x + 26} ${-96 + i * 22}`, text, 6, 'opacity="0.6"')).join('') : '');
  return one(-48) + one(48);
}

export function crescentMoon(r: number, fill: string, cut: string): string {
  return circ(0, 0, r, fill) + circ(r * 0.42, -r * 0.24, r * 0.86, cut);
}

/** A round loaf seen a little from above: full oval with two score marks; centre at origin. */
export function bun(fill: string, score: string, shade?: string): string {
  return (
    (shade ? ell(0, 6, 44, 26, shade) : '') +
    ell(0, 0, 44, 28, fill) +
    line('M -20 -6 L -8 8 M 0 -12 L 12 4 M 16 -10 L 24 2', score, 5, 'opacity="0.7"')
  );
}

/** Just the front of a basket (no rim behind), to draw over what lies in it. */
export function basketFront(fill: string, weave?: string): string {
  return basket(fill, weave);
}

/** A broad wing (the feathered wing stretched sideways), for emblems where a narrow wing would read as a leaf. */
export function broadWing(fill: string, len = 200, widen = 1.7): string {
  return `<g transform="scale(${widen} 1)">${wing(fill, len)}</g>`;
}
