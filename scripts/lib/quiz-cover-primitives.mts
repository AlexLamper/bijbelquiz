/**
 * Flat-vector building blocks for the generated quiz covers.
 *
 * Every function returns an SVG fragment as a string. Shapes are solid
 * silhouettes with no strokes and no filters: librsvg (which is what sharp
 * rasterises with) renders those identically every run, and a silhouette
 * reads at the 300px a quiz tile actually gets far better than line art.
 *
 * Coordinate convention: y grows downward, and a motif's `y` is the ground it
 * stands on, not its top. That keeps a scene definition to "put a lion at
 * x=900 on the horizon" rather than arithmetic on every call.
 *
 * The one hard layout rule: the quiz start screen crops the cover to
 * `aspect-[21/6]`, roughly the middle 400px of the 792px canvas. Nothing that
 * carries meaning may sit outside y 200..590.
 */

export const W = 1408;
export const H = 792;

/** Middle band that survives the start-screen crop. */
export const SAFE_TOP = 200;
export const SAFE_BOTTOM = 590;

const r1 = (v: number) => Math.round(v * 10) / 10;

// ── colour ─────────────────────────────────────────────────────────────────

function hue2rgb(p: number, q: number, t: number): number {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}

/** HSL to hex. h in degrees, s and l in 0..1. */
export function hsl(h: number, s: number, l: number): string {
  const hh = (((h % 360) + 360) % 360) / 360;
  const ss = Math.min(1, Math.max(0, s));
  const ll = Math.min(1, Math.max(0, l));
  let r: number;
  let g: number;
  let b: number;
  if (ss === 0) {
    r = g = b = ll;
  } else {
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }
  const to = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// ── deterministic randomness ───────────────────────────────────────────────

/** mulberry32 - small, fast, and stable across Node versions. */
export function rngFor(seed: string): () => number {
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

// ── generic shape helpers ──────────────────────────────────────────────────

type Opts = { opacity?: number };

const op = (o?: Opts) => (o?.opacity !== undefined && o.opacity !== 1 ? ` opacity="${o.opacity}"` : '');

export const path = (d: string, fill: string, o?: Opts) => `<path d="${d}" fill="${fill}"${op(o)}/>`;

export const circle = (x: number, y: number, r: number, fill: string, o?: Opts) =>
  `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${fill}"${op(o)}/>`;

export const ellipse = (x: number, y: number, rx: number, ry: number, fill: string, o?: Opts) =>
  `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}"${op(o)}/>`;

export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  o?: Opts & { rx?: number },
) =>
  `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"${
    o?.rx ? ` rx="${r1(o.rx)}"` : ''
  } fill="${fill}"${op(o)}/>`;

export const tri = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  fill: string,
  o?: Opts,
) => path(`M ${r1(ax)} ${r1(ay)} L ${r1(bx)} ${r1(by)} L ${r1(cx)} ${r1(cy)} Z`, fill, o);

/** Rotate a fragment about a point - the only transform used anywhere. */
export const rotate = (deg: number, x: number, y: number, inner: string) =>
  `<g transform="rotate(${r1(deg)} ${r1(x)} ${r1(y)})">${inner}</g>`;

/** A tapered limb: thick at the shoulder, thin at the hand. */
function limb(x1: number, y1: number, x2: number, y2: number, w: number, fill: string): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * w;
  const ny = (dx / len) * w;
  return path(
    `M ${r1(x1 - nx)} ${r1(y1 - ny)} L ${r1(x1 + nx)} ${r1(y1 + ny)} ` +
      `L ${r1(x2 + nx * 0.45)} ${r1(y2 + ny * 0.45)} L ${r1(x2 - nx * 0.45)} ${r1(y2 - ny * 0.45)} Z`,
    fill,
  );
}

// ── terrain ────────────────────────────────────────────────────────────────

/** Jagged mountain range filled down to the canvas bottom. */
export function ridge(
  rand: () => number,
  y: number,
  amp: number,
  fill: string,
  o?: Opts & { steps?: number },
): string {
  const steps = o?.steps ?? 7;
  const step = (W + 160) / steps;
  let x = -80;
  let d = `M ${-80} ${r1(y + amp * 0.5)}`;
  for (let i = 0; i < steps; i += 1) {
    d += ` L ${r1(x + step * (0.28 + rand() * 0.44))} ${r1(y - amp * (0.4 + rand() * 0.9))}`;
    x += step;
    d += ` L ${r1(x)} ${r1(y + amp * (rand() * 0.45))}`;
  }
  d += ` L ${W + 80} ${H} L -80 ${H} Z`;
  return path(d, fill, o);
}

/** Smooth rolling band - hills, dunes, a swell of water. */
export function dunes(
  rand: () => number,
  y: number,
  amp: number,
  fill: string,
  o?: Opts & { segs?: number },
): string {
  const segs = o?.segs ?? 4;
  const step = (W + 160) / segs;
  let x = -80;
  let cy = y;
  let d = `M ${-80} ${r1(cy)}`;
  for (let i = 0; i < segs; i += 1) {
    const ny = y + (rand() - 0.5) * amp;
    d +=
      ` C ${r1(x + step * 0.35)} ${r1(cy - amp * (0.35 + rand() * 0.9))}` +
      ` ${r1(x + step * 0.68)} ${r1(ny + amp * (0.35 + rand() * 0.7))}` +
      ` ${r1(x + step)} ${r1(ny)}`;
    x += step;
    cy = ny;
  }
  d += ` L ${W + 80} ${H} L -80 ${H} Z`;
  return path(d, fill, o);
}

/** Flat water with a few crest lines above it. */
export function water(rand: () => number, y: number, fill: string, crest: string, rows = 4): string {
  const out = [path(`M -80 ${r1(y)} L ${W + 80} ${r1(y)} L ${W + 80} ${H} L -80 ${H} Z`, fill)];
  for (let i = 0; i < rows; i += 1) {
    const cy = y + 14 + i * 26 + rand() * 8;
    const x0 = -40 + rand() * 220;
    const len = 140 + rand() * 320;
    out.push(
      path(
        `M ${r1(x0)} ${r1(cy)} q ${r1(len * 0.25)} ${-7} ${r1(len * 0.5)} 0 q ${r1(len * 0.25)} 7 ${r1(len * 0.5)} 0`,
        'none',
      ).replace('fill="none"', `fill="none" stroke="${crest}" stroke-width="4" stroke-linecap="round" opacity="0.5"`),
    );
    const x1 = W - 380 - rand() * 260;
    out.push(
      path(
        `M ${r1(x1)} ${r1(cy + 12)} q 60 -7 120 0 q 60 7 120 0`,
        'none',
      ).replace('fill="none"', `fill="none" stroke="${crest}" stroke-width="4" stroke-linecap="round" opacity="0.38"`),
    );
  }
  return out.join('');
}

/** Storm swell: tall overlapping wave crests. */
export function swell(rand: () => number, y: number, fill: string, o?: Opts): string {
  let d = `M -80 ${r1(y + 40)}`;
  let x = -80;
  const step = (W + 160) / 5;
  for (let i = 0; i < 5; i += 1) {
    d +=
      ` C ${r1(x + step * 0.3)} ${r1(y - 60 - rand() * 50)}` +
      ` ${r1(x + step * 0.7)} ${r1(y - 40 - rand() * 60)}` +
      ` ${r1(x + step)} ${r1(y + 20 + rand() * 30)}`;
    x += step;
  }
  d += ` L ${W + 80} ${H} L -80 ${H} Z`;
  return path(d, fill, o);
}

/** A winding river receding to the horizon. */
export function river(y: number, fill: string, o?: Opts): string {
  return path(
    `M ${W * 0.42} ${r1(y)} C ${W * 0.46} ${r1(y + 60)} ${W * 0.3} ${r1(y + 90)} ${W * 0.26} ${H}` +
      ` L ${W * 0.62} ${H} C ${W * 0.58} ${r1(y + 90)} ${W * 0.52} ${r1(y + 55)} ${W * 0.5} ${r1(y)} Z`,
    fill,
    o,
  );
}

// ── sky ────────────────────────────────────────────────────────────────────

export function stars(rand: () => number, n: number, fill: string, maxY = 330): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = rand() * W;
    const y = 30 + rand() * (maxY - 30);
    const r = 1.4 + rand() * 2.6;
    out.push(circle(x, y, r, fill, { opacity: 0.3 + rand() * 0.55 }));
  }
  return out.join('');
}

export function sunDisc(x: number, y: number, r: number, fill: string, o?: Opts): string {
  return circle(x, y, r, fill, o);
}

export function halo(x: number, y: number, r: number, fill: string, rings = 3): string {
  const out: string[] = [];
  for (let i = 1; i <= rings; i += 1) {
    out.push(
      `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r + i * r * 0.42)}" fill="none" stroke="${fill}" stroke-width="${r1(
        3 - i * 0.5,
      )}" opacity="${r1(0.3 - i * 0.06)}"/>`,
    );
  }
  return out.join('');
}

export function crescent(x: number, y: number, r: number, fill: string): string {
  return path(
    `M ${r1(x)} ${r1(y - r)} A ${r1(r)} ${r1(r)} 0 1 0 ${r1(x)} ${r1(y + r)}` +
      ` A ${r1(r * 0.78)} ${r1(r * 0.78)} 0 1 1 ${r1(x)} ${r1(y - r)} Z`,
    fill,
  );
}

/** Radiating wedges - dawn light, glory, a burst from heaven. */
export function rays(rand: () => number, x: number, y: number, len: number, fill: string, n = 9, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = (Math.PI * 2 * i) / n + rand() * 0.12;
    const w = 0.028 + rand() * 0.035;
    const l = len * (0.55 + rand() * 0.65);
    out.push(
      path(
        `M ${r1(x)} ${r1(y)} L ${r1(x + Math.cos(a - w) * l)} ${r1(y + Math.sin(a - w) * l)}` +
          ` L ${r1(x + Math.cos(a + w) * l)} ${r1(y + Math.sin(a + w) * l)} Z`,
        fill,
      ),
    );
  }
  return `<g opacity="${o?.opacity ?? 0.1}">${out.join('')}</g>`;
}

/** Downward shafts of light from a point - used for visions and openings. */
export function shafts(x: number, y: number, spread: number, len: number, fill: string, n = 5): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const bx = x + (t - 0.5) * spread;
    const w = 16 + (1 - Math.abs(t - 0.5) * 2) * 26;
    out.push(
      path(
        `M ${r1(x - 8)} ${r1(y)} L ${r1(x + 8)} ${r1(y)} L ${r1(bx + w)} ${r1(y + len)} L ${r1(bx - w)} ${r1(y + len)} Z`,
        fill,
        { opacity: 0.45 + (1 - Math.abs(t - 0.5) * 2) * 0.4 },
      ),
    );
  }
  return `<g opacity="0.3">${out.join('')}</g>`;
}

export function cloudBank(rand: () => number, x: number, y: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  const n = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i += 1) {
    const cx = x + (i - n / 2) * 46 * s + rand() * 18 * s;
    const cy = y + (rand() - 0.5) * 20 * s;
    out.push(ellipse(cx, cy, (44 + rand() * 30) * s, (20 + rand() * 12) * s, fill));
  }
  out.push(ellipse(x, y + 12 * s, 150 * s, 22 * s, fill));
  return `<g opacity="${o?.opacity ?? 0.2}">${out.join('')}</g>`;
}

/** Slanted streaks: rain, hail, arrows, driving wind. */
export function streaks(
  rand: () => number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  fill: string,
  n = 40,
  o?: Opts,
): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = x0 + rand() * w;
    const y = y0 + rand() * h;
    const len = 22 + rand() * 30;
    out.push(
      path(`M ${r1(x)} ${r1(y)} L ${r1(x + 7)} ${r1(y)} L ${r1(x - 5)} ${r1(y + len)} L ${r1(x - 12)} ${r1(y + len)} Z`, fill, {
        opacity: 0.45 + rand() * 0.55,
      }),
    );
  }
  return `<g opacity="${o?.opacity ?? 0.4}">${out.join('')}</g>`;
}

/** Scattered small bodies: a plague swarm, a flock, a crowd seen from far off. */
export function swarm(
  rand: () => number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  s: number,
  fill: string,
  n: number,
  kind: 'dot' | 'locust' | 'frog' = 'dot',
): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = x0 + rand() * w;
    const y = y0 + rand() * h;
    const k = s * (0.6 + rand() * 0.8);
    if (kind === 'locust') out.push(locust(x, y, k, fill, { opacity: 0.45 + rand() * 0.5 }));
    else if (kind === 'frog') out.push(frog(x, y, k, fill, { opacity: 0.5 + rand() * 0.5 }));
    else out.push(circle(x, y, 3.4 * k, fill, { opacity: 0.3 + rand() * 0.5 }));
  }
  return out.join('');
}

// ── figures ────────────────────────────────────────────────────────────────

export type Pose = 'stand' | 'raise' | 'kneel' | 'walk' | 'bow' | 'sit' | 'point' | 'carry' | 'fallen';

/**
 * A minimalist robed figure. `y` is the ground under the feet, `s = 1` gives a
 * figure about 92px tall - roughly a twelfth of the canvas height.
 */
export function person(x: number, y: number, s: number, fill: string, pose: Pose = 'stand', o?: Opts): string {
  const h = 134 * s;
  const hr = 14 * s;
  const shoulder = y - h + hr * 1.75;
  const w = 22 * s;
  const parts: string[] = [];

  if (pose === 'fallen') {
    const g =
      ellipse(x, y - 9 * s, 42 * s, 12 * s, fill) +
      circle(x - 44 * s, y - 16 * s, hr, fill) +
      limb(x + 10 * s, y - 14 * s, x + 44 * s, y - 30 * s, 5 * s, fill);
    return o ? `<g${op(o)}>${g}</g>` : g;
  }

  if (pose === 'kneel') {
    const top = y - h * 0.68 + hr * 2;
    parts.push(
      path(
        `M ${r1(x - w * 1.5)} ${r1(y)} L ${r1(x - w * 0.75)} ${r1(top)} Q ${r1(x)} ${r1(top - 7 * s)} ${r1(
          x + w * 0.75,
        )} ${r1(top)} L ${r1(x + w * 1.35)} ${r1(y)} Z`,
        fill,
      ),
      circle(x, top - hr * 1.15, hr, fill),
      limb(x - w * 0.6, top + 8 * s, x - w * 1.1, top + 30 * s, 4.5 * s, fill),
    );
    return o ? `<g${op(o)}>${parts.join('')}</g>` : parts.join('');
  }

  if (pose === 'sit') {
    const top = y - h * 0.62;
    parts.push(
      path(`M ${r1(x - w)} ${r1(y - 22 * s)} L ${r1(x - w * 0.7)} ${r1(top)} L ${r1(x + w * 0.7)} ${r1(top)} L ${r1(x + w)} ${r1(y - 22 * s)} Z`, fill),
      rect(x - w, y - 26 * s, w * 2.3, 9 * s, fill),
      rect(x + w * 0.7, y - 24 * s, 9 * s, 24 * s, fill),
      circle(x, top - hr * 1.1, hr, fill),
    );
    return o ? `<g${op(o)}>${parts.join('')}</g>` : parts.join('');
  }

  // Common robe for the upright poses.
  const robe = path(
    `M ${r1(x - w)} ${r1(y)} L ${r1(x - w * 0.55)} ${r1(shoulder)} Q ${r1(x)} ${r1(shoulder - 6 * s)} ${r1(
      x + w * 0.55,
    )} ${r1(shoulder)} L ${r1(x + w)} ${r1(y)} Z`,
    fill,
  );
  parts.push(robe, circle(x, y - h + hr, hr, fill));

  if (pose === 'raise') {
    parts.push(
      limb(x - w * 0.5, shoulder + 4 * s, x - w * 1.5, y - h - 12 * s, 4.5 * s, fill),
      limb(x + w * 0.5, shoulder + 4 * s, x + w * 1.5, y - h - 12 * s, 4.5 * s, fill),
    );
  } else if (pose === 'point') {
    parts.push(limb(x + w * 0.5, shoulder + 6 * s, x + w * 2.4, shoulder - 6 * s, 4.5 * s, fill));
  } else if (pose === 'carry') {
    parts.push(
      limb(x - w * 0.5, shoulder + 6 * s, x - w * 1.8, shoulder + 16 * s, 4.5 * s, fill),
      limb(x + w * 0.5, shoulder + 6 * s, x + w * 1.8, shoulder + 16 * s, 4.5 * s, fill),
    );
  } else if (pose === 'walk') {
    parts.push(
      path(`M ${r1(x - w * 0.2)} ${r1(y)} L ${r1(x + w * 0.9)} ${r1(y - 6 * s)} L ${r1(x + w * 1.3)} ${r1(y)} Z`, fill),
      limb(x + w * 0.5, shoulder + 8 * s, x + w * 1.6, shoulder + 26 * s, 4 * s, fill),
    );
  }

  const g = parts.join('');
  if (pose === 'bow') return rotate(-22, x, y, o ? `<g${op(o)}>${g}</g>` : g);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** A row of figures at varying depth - reads as a gathering, not a queue. */
export function crowd(
  rand: () => number,
  x: number,
  y: number,
  s: number,
  fill: string,
  n: number,
  spread = 200,
): string {
  const out: string[] = [];
  const poses: Pose[] = ['stand', 'stand', 'raise', 'stand', 'bow', 'walk'];
  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const px = x + (t - 0.5) * spread + (rand() - 0.5) * 18;
    const depth = 0.78 + rand() * 0.34;
    out.push(person(px, y + (rand() - 0.5) * 10 * s, s * depth, fill, poses[Math.floor(rand() * poses.length)], {
      opacity: 0.72 + depth * 0.26 > 1 ? 1 : 0.72 + depth * 0.26,
    }));
  }
  return out.join('');
}

export function angel(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const body = person(x, y, s, fill, 'stand');
  const top = y - 134 * s;
  const wing = (dir: number) =>
    path(
      `M ${r1(x + dir * 10 * s)} ${r1(top + 30 * s)} C ${r1(x + dir * 60 * s)} ${r1(top - 6 * s)} ${r1(
        x + dir * 78 * s,
      )} ${r1(top + 34 * s)} ${r1(x + dir * 52 * s)} ${r1(top + 78 * s)} C ${r1(x + dir * 44 * s)} ${r1(
        top + 52 * s,
      )} ${r1(x + dir * 26 * s)} ${r1(top + 44 * s)} ${r1(x + dir * 10 * s)} ${r1(top + 30 * s)} Z`,
      fill,
    );
  const g = wing(-1) + wing(1) + body;
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function dove(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    ellipse(x, y, 26 * s, 13 * s, fill) +
    circle(x + 24 * s, y - 8 * s, 8 * s, fill) +
    tri(x + 31 * s, y - 8 * s, x + 44 * s, y - 5 * s, x + 31 * s, y - 3 * s, fill) +
    path(
      `M ${r1(x - 2 * s)} ${r1(y - 6 * s)} C ${r1(x + 6 * s)} ${r1(y - 44 * s)} ${r1(x - 34 * s)} ${r1(
        y - 40 * s,
      )} ${r1(x - 24 * s)} ${r1(y - 2 * s)} Z`,
      fill,
    ) +
    tri(x - 24 * s, y - 2 * s, x - 52 * s, y + 10 * s, x - 22 * s, y + 8 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function bird(x: number, y: number, s: number, fill: string, o?: Opts): string {
  return path(
    `M ${r1(x - 14 * s)} ${r1(y)} q ${r1(7 * s)} ${r1(-9 * s)} ${r1(14 * s)} 0 q ${r1(7 * s)} ${r1(-9 * s)} ${r1(
      14 * s,
    )} 0`,
    'none',
    o,
  ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(3 * s)}" stroke-linecap="round"`);
}

// ── animals ────────────────────────────────────────────────────────────────

export function lion(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g =
    ellipse(x, y - 46 * s, 42 * s, 20 * s, fill) +
    path(`M ${r1(x - 30 * s)} ${r1(y - 52 * s)} L ${r1(x - 22 * s)} ${r1(y)} L ${r1(x - 34 * s)} ${r1(y)} Z`, fill) +
    path(`M ${r1(x - 14 * s)} ${r1(y - 52 * s)} L ${r1(x - 8 * s)} ${r1(y)} L ${r1(x - 20 * s)} ${r1(y)} Z`, fill) +
    path(`M ${r1(x + 20 * s)} ${r1(y - 52 * s)} L ${r1(x + 26 * s)} ${r1(y)} L ${r1(x + 14 * s)} ${r1(y)} Z`, fill) +
    path(`M ${r1(x + 34 * s)} ${r1(y - 52 * s)} L ${r1(x + 40 * s)} ${r1(y)} L ${r1(x + 28 * s)} ${r1(y)} Z`, fill) +
    limb(x - 34 * s, y - 54 * s, x - 54 * s, y - 78 * s, 11 * s, fill) +
    circle(x - 62 * s, y - 88 * s, 25 * s, fill) +
    ellipse(x - 78 * s, y - 84 * s, 15 * s, 11 * s, fill) +
    tri(x - 78 * s, y - 108 * s, x - 70 * s, y - 94 * s, x - 86 * s, y - 96 * s, fill) +
    tri(x - 50 * s, y - 110 * s, x - 42 * s, y - 96 * s, x - 58 * s, y - 98 * s, fill) +
    path(
      `M ${r1(x + 40 * s)} ${r1(y - 58 * s)} C ${r1(x + 74 * s)} ${r1(y - 70 * s)} ${r1(x + 78 * s)} ${r1(
        y - 26 * s,
      )} ${r1(x + 62 * s)} ${r1(y - 18 * s)}`,
      'none',
    ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(5 * s)}" stroke-linecap="round"`) +
    circle(x + 62 * s, y - 16 * s, 8 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

function quadruped(
  x: number,
  y: number,
  s: number,
  fill: string,
  cfg: { bodyRx: number; bodyRy: number; neck: number; headR: number; legW: number },
): string {
  const { bodyRx, bodyRy, neck, headR, legW } = cfg;
  return (
    ellipse(x, y - 34 * s, bodyRx * s, bodyRy * s, fill) +
    rect(x - bodyRx * 0.7 * s, y - 38 * s, legW * s, 38 * s, fill, { rx: legW * 0.5 * s }) +
    rect(x - bodyRx * 0.35 * s, y - 38 * s, legW * s, 38 * s, fill, { rx: legW * 0.5 * s }) +
    rect(x + bodyRx * 0.3 * s, y - 38 * s, legW * s, 38 * s, fill, { rx: legW * 0.5 * s }) +
    rect(x + bodyRx * 0.6 * s, y - 38 * s, legW * s, 38 * s, fill, { rx: legW * 0.5 * s }) +
    limb(x - bodyRx * 0.7 * s, y - 40 * s, x - (bodyRx + 14) * s, y - (40 + neck) * s, 8 * s, fill) +
    circle(x - (bodyRx + 16) * s, y - (42 + neck) * s, headR * s, fill)
  );
}

export function ram(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g =
    quadruped(x, y, s, fill, { bodyRx: 38, bodyRy: 21, neck: 14, headR: 12, legW: 8 }) +
    path(
      `M ${r1(x - 62 * s)} ${r1(y - 62 * s)} a ${r1(15 * s)} ${r1(15 * s)} 0 1 0 ${r1(-14 * s)} ${r1(14 * s)}`,
      'none',
    ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(6 * s)}" stroke-linecap="round"`);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function goat(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g =
    quadruped(x, y, s, fill, { bodyRx: 34, bodyRy: 18, neck: 18, headR: 11, legW: 7 }) +
    limb(x - 48 * s, y - 66 * s, x - 24 * s, y - 88 * s, 3.6 * s, fill) +
    limb(x - 54 * s, y - 66 * s, x - 32 * s, y - 92 * s, 3.6 * s, fill) +
    tri(x - 50 * s, y - 48 * s, x - 46 * s, y - 34 * s, x - 56 * s, y - 44 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function ox(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g =
    quadruped(x, y, s, fill, { bodyRx: 44, bodyRy: 24, neck: 8, headR: 14, legW: 9 }) +
    path(
      `M ${r1(x - 72 * s)} ${r1(y - 60 * s)} q ${r1(-14 * s)} ${r1(-12 * s)} ${r1(-4 * s)} ${r1(-20 * s)}`,
      'none',
    ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(5 * s)}" stroke-linecap="round"`) +
    path(
      `M ${r1(x - 48 * s)} ${r1(y - 60 * s)} q ${r1(14 * s)} ${r1(-12 * s)} ${r1(4 * s)} ${r1(-20 * s)}`,
      'none',
    ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(5 * s)}" stroke-linecap="round"`);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function horse(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g =
    ellipse(x, y - 46 * s, 44 * s, 22 * s, fill) +
    limb(x - 30 * s, y - 44 * s, x - 36 * s, y, 7 * s, fill) +
    limb(x - 12 * s, y - 44 * s, x - 4 * s, y, 7 * s, fill) +
    limb(x + 22 * s, y - 44 * s, x + 16 * s, y, 7 * s, fill) +
    limb(x + 36 * s, y - 44 * s, x + 42 * s, y, 7 * s, fill) +
    limb(x - 36 * s, y - 54 * s, x - 60 * s, y - 88 * s, 10 * s, fill) +
    path(
      `M ${r1(x - 60 * s)} ${r1(y - 96 * s)} L ${r1(x - 78 * s)} ${r1(y - 84 * s)} L ${r1(x - 66 * s)} ${r1(
        y - 74 * s,
      )} L ${r1(x - 52 * s)} ${r1(y - 80 * s)} Z`,
      fill,
    ) +
    path(
      `M ${r1(x - 52 * s)} ${r1(y - 98 * s)} C ${r1(x - 34 * s)} ${r1(y - 92 * s)} ${r1(x - 28 * s)} ${r1(
        y - 74 * s,
      )} ${r1(x - 26 * s)} ${r1(y - 62 * s)} L ${r1(x - 42 * s)} ${r1(y - 66 * s)} Z`,
      fill,
    ) +
    path(
      `M ${r1(x + 42 * s)} ${r1(y - 60 * s)} C ${r1(x + 70 * s)} ${r1(y - 52 * s)} ${r1(x + 66 * s)} ${r1(
        y - 20 * s,
      )} ${r1(x + 54 * s)} ${r1(y - 8 * s)}`,
      'none',
    ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(7 * s)}" stroke-linecap="round"`);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function donkey(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g =
    ellipse(x, y - 40 * s, 40 * s, 20 * s, fill) +
    limb(x - 26 * s, y - 38 * s, x - 30 * s, y, 6.5 * s, fill) +
    limb(x - 10 * s, y - 38 * s, x - 6 * s, y, 6.5 * s, fill) +
    limb(x + 18 * s, y - 38 * s, x + 14 * s, y, 6.5 * s, fill) +
    limb(x + 30 * s, y - 38 * s, x + 34 * s, y, 6.5 * s, fill) +
    limb(x - 32 * s, y - 48 * s, x - 52 * s, y - 74 * s, 9 * s, fill) +
    ellipse(x - 58 * s, y - 78 * s, 15 * s, 9 * s, fill) +
    ellipse(x - 52 * s, y - 92 * s, 4 * s, 11 * s, fill) +
    ellipse(x - 62 * s, y - 92 * s, 4 * s, 11 * s, fill) +
    path(`M ${r1(x + 38 * s)} ${r1(y - 52 * s)} q ${r1(16 * s)} ${r1(16 * s)} ${r1(4 * s)} ${r1(34 * s)}`, 'none').replace(
      'fill="none"',
      `fill="none" stroke="${fill}" stroke-width="${r1(5 * s)}" stroke-linecap="round"`,
    );
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function fish(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g =
    path(
      `M ${r1(x - 70 * s)} ${r1(y)} Q ${r1(x - 10 * s)} ${r1(y - 46 * s)} ${r1(x + 62 * s)} ${r1(y)} Q ${r1(
        x - 10 * s,
      )} ${r1(y + 46 * s)} ${r1(x - 70 * s)} ${r1(y)} Z`,
      fill,
    ) +
    path(
      `M ${r1(x - 66 * s)} ${r1(y)} L ${r1(x - 104 * s)} ${r1(y - 30 * s)} L ${r1(x - 96 * s)} ${r1(y)} L ${r1(
        x - 104 * s,
      )} ${r1(y + 30 * s)} Z`,
      fill,
    ) +
    tri(x - 14 * s, y - 16 * s, x + 14 * s, y - 54 * s, x + 24 * s, y - 12 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function serpent(x: number, y: number, scale: number, fill: string, o?: Opts): string {
  const s = scale * 1.3;
  const g = path(
    `M ${r1(x - 60 * s)} ${r1(y)} C ${r1(x - 30 * s)} ${r1(y - 46 * s)} ${r1(x + 6 * s)} ${r1(y + 30 * s)} ${r1(
      x + 34 * s,
    )} ${r1(y - 20 * s)} C ${r1(x + 48 * s)} ${r1(y - 44 * s)} ${r1(x + 62 * s)} ${r1(y - 48 * s)} ${r1(
      x + 72 * s,
    )} ${r1(y - 56 * s)}`,
    'none',
  ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(9 * s)}" stroke-linecap="round"`) +
    circle(x + 76 * s, y - 60 * s, 8 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function frog(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    ellipse(x, y - 6 * s, 13 * s, 9 * s, fill) +
    circle(x - 9 * s, y - 13 * s, 4 * s, fill) +
    circle(x + 9 * s, y - 13 * s, 4 * s, fill) +
    limb(x - 11 * s, y - 4 * s, x - 18 * s, y, 2.6 * s, fill) +
    limb(x + 11 * s, y - 4 * s, x + 18 * s, y, 2.6 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function locust(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    ellipse(x, y, 11 * s, 4.2 * s, fill) +
    path(`M ${r1(x - 6 * s)} ${r1(y - 2 * s)} q ${r1(10 * s)} ${r1(-11 * s)} ${r1(20 * s)} ${r1(-2 * s)} Z`, fill) +
    limb(x - 4 * s, y + 1 * s, x - 12 * s, y + 9 * s, 1.6 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

// ── plants ─────────────────────────────────────────────────────────────────

export function tree(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 5 * s, y - 46 * s, 10 * s, 46 * s, fill) +
    circle(x, y - 66 * s, 30 * s, fill) +
    circle(x - 26 * s, y - 52 * s, 20 * s, fill) +
    circle(x + 26 * s, y - 54 * s, 22 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function cypress(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = path(
    `M ${r1(x)} ${r1(y - 116 * s)} C ${r1(x + 20 * s)} ${r1(y - 70 * s)} ${r1(x + 15 * s)} ${r1(y - 12 * s)} ${r1(
      x + 7 * s,
    )} ${r1(y)} L ${r1(x - 7 * s)} ${r1(y)} C ${r1(x - 15 * s)} ${r1(y - 12 * s)} ${r1(x - 20 * s)} ${r1(
      y - 70 * s,
    )} ${r1(x)} ${r1(y - 116 * s)} Z`,
    fill,
  );
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function palm(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const parts = [
    path(
      `M ${r1(x - 5 * s)} ${r1(y)} C ${r1(x - 2 * s)} ${r1(y - 40 * s)} ${r1(x + 8 * s)} ${r1(y - 70 * s)} ${r1(
        x + 14 * s,
      )} ${r1(y - 92 * s)} L ${r1(x + 4 * s)} ${r1(y - 92 * s)} C ${r1(x - 2 * s)} ${r1(y - 70 * s)} ${r1(
        x - 10 * s,
      )} ${r1(y - 40 * s)} ${r1(x - 14 * s)} ${r1(y)} Z`,
      fill,
    ),
  ];
  const tipX = x + 9 * s;
  const tipY = y - 94 * s;
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI + (i / 5) * Math.PI;
    const ex = tipX + Math.cos(a) * 46 * s;
    const ey = tipY + Math.sin(a) * 30 * s + 14 * s;
    parts.push(
      path(
        `M ${r1(tipX)} ${r1(tipY)} Q ${r1((tipX + ex) / 2)} ${r1(Math.min(tipY, ey) - 20 * s)} ${r1(ex)} ${r1(ey)} Q ${r1(
          (tipX + ex) / 2,
        )} ${r1(Math.min(tipY, ey) - 6 * s)} ${r1(tipX)} ${r1(tipY)} Z`,
        fill,
      ),
    );
  }
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function vineRow(rand: () => number, x: number, y: number, s: number, fill: string, n = 5): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + i * 62 * s;
    out.push(
      rect(px - 3 * s, y - 34 * s, 6 * s, 34 * s, fill),
      path(
        `M ${r1(px - 26 * s)} ${r1(y - 34 * s)} q ${r1(26 * s)} ${r1(-18 * s)} ${r1(52 * s)} 0 q ${r1(-26 * s)} ${r1(
          16 * s,
        )} ${r1(-52 * s)} 0 Z`,
        fill,
      ),
      circle(px + (rand() - 0.5) * 20 * s, y - 24 * s, 5 * s, fill, { opacity: 0.8 }),
    );
  }
  return out.join('');
}

export function grapes(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  for (let row = 0; row < 4; row += 1) {
    const count = 4 - row;
    for (let i = 0; i < count; i += 1) {
      out.push(circle(x + (i - (count - 1) / 2) * 15 * s, y + row * 13 * s, 8 * s, fill));
    }
  }
  out.push(path(`M ${r1(x)} ${r1(y - 12 * s)} q ${r1(22 * s)} ${r1(-14 * s)} ${r1(30 * s)} ${r1(4 * s)} q ${r1(-20 * s)} ${r1(6 * s)} ${r1(-30 * s)} ${r1(-4 * s)} Z`, fill));
  const g = out.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function wheat(x: number, y: number, s: number, fill: string, n = 5, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + (i - (n - 1) / 2) * 22 * s;
    const lean = (i - (n - 1) / 2) * 4 * s;
    const topY = y - 104 * s;
    out.push(
      path(`M ${r1(px)} ${r1(y)} Q ${r1(px + lean)} ${r1(y - 54 * s)} ${r1(px + lean * 2)} ${r1(topY)}`, 'none').replace(
        'fill="none"',
        `fill="none" stroke="${fill}" stroke-width="${r1(3.6 * s)}" stroke-linecap="round"`,
      ),
    );
    const hx = px + lean * 2;
    for (let k = 0; k < 5; k += 1) {
      const gy = topY + k * 9 * s;
      out.push(
        ellipse(hx - 6 * s, gy, 5 * s, 7.5 * s, fill),
        ellipse(hx + 6 * s, gy, 5 * s, 7.5 * s, fill),
      );
    }
    out.push(ellipse(hx, topY - 9 * s, 4.5 * s, 10 * s, fill));
  }
  const g = out.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function sheaf(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const out: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const t = (i - 3) / 3;
    out.push(
      path(
        `M ${r1(x + t * 26 * s)} ${r1(y)} Q ${r1(x + t * 12 * s)} ${r1(y - 52 * s)} ${r1(x + t * 46 * s)} ${r1(
          y - 96 * s,
        )}`,
        'none',
      ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${r1(7 * s)}" stroke-linecap="round"`),
      ellipse(x + t * 46 * s, y - 102 * s, 6 * s, 12 * s, fill),
    );
  }
  out.push(rect(x - 26 * s, y - 56 * s, 52 * s, 12 * s, fill, { rx: 5 * s }));
  const g = out.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function reeds(rand: () => number, x: number, y: number, s: number, fill: string, n = 7): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + (i - n / 2) * 15 * s + rand() * 8 * s;
    const hgt = (52 + rand() * 46) * s;
    const lean = (rand() - 0.5) * 20 * s;
    out.push(
      path(`M ${r1(px)} ${r1(y)} Q ${r1(px + lean * 0.4)} ${r1(y - hgt * 0.6)} ${r1(px + lean)} ${r1(y - hgt)}`, 'none').replace(
        'fill="none"',
        `fill="none" stroke="${fill}" stroke-width="${r1(3.4 * s)}" stroke-linecap="round"`,
      ),
      ellipse(px + lean, y - hgt - 6 * s, 4 * s, 11 * s, fill),
    );
  }
  return out.join('');
}

export function shrub(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    circle(x, y - 20 * s, 20 * s, fill) + circle(x - 18 * s, y - 12 * s, 14 * s, fill) + circle(x + 18 * s, y - 13 * s, 15 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** A drooping, dried-out plant. */
export function witheredPlant(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x)} ${r1(y)} C ${r1(x + 4 * s)} ${r1(y - 34 * s)} ${r1(x + 14 * s)} ${r1(y - 44 * s)} ${r1(x + 24 * s)} ${r1(y - 46 * s)}`, 'none').replace(
      'fill="none"',
      `fill="none" stroke="${fill}" stroke-width="${r1(5 * s)}" stroke-linecap="round"`,
    ) +
    path(`M ${r1(x + 24 * s)} ${r1(y - 46 * s)} q ${r1(16 * s)} ${r1(2 * s)} ${r1(18 * s)} ${r1(18 * s)} q ${r1(-18 * s)} ${r1(2 * s)} ${r1(-18 * s)} ${r1(-18 * s)} Z`, fill) +
    path(`M ${r1(x + 6 * s)} ${r1(y - 30 * s)} q ${r1(-18 * s)} ${r1(4 * s)} ${r1(-20 * s)} ${r1(20 * s)} q ${r1(18 * s)} ${r1(0 * s)} ${r1(20 * s)} ${r1(-20 * s)} Z`, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

// ── fire, light ────────────────────────────────────────────────────────────

export function flame(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = path(
    `M ${r1(x)} ${r1(y - 74 * s)} C ${r1(x + 26 * s)} ${r1(y - 46 * s)} ${r1(x + 22 * s)} ${r1(y - 8 * s)} ${r1(
      x,
    )} ${r1(y)} C ${r1(x - 22 * s)} ${r1(y - 8 * s)} ${r1(x - 26 * s)} ${r1(y - 46 * s)} ${r1(x)} ${r1(y - 74 * s)} Z`,
    fill,
  );
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function fireBed(rand: () => number, x: number, y: number, s: number, fill: string, n = 7): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + (i - (n - 1) / 2) * 26 * s + (rand() - 0.5) * 14 * s;
    out.push(flame(px, y, s * (0.45 + rand() * 0.85), fill));
  }
  return out.join('');
}

/** Tongues of fire hovering above a point - Pentecost. */
export function tongues(rand: () => number, x: number, y: number, s: number, fill: string, n = 6): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + (i - (n - 1) / 2) * 52 * s + (rand() - 0.5) * 16 * s;
    out.push(flame(px, y - rand() * 18 * s, s * (0.4 + rand() * 0.3), fill));
  }
  return out.join('');
}

export function lamp(x: number, y: number, s: number, fill: string, flameFill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 22 * s)} ${r1(y)} q ${r1(22 * s)} ${r1(12 * s)} ${r1(44 * s)} 0 q ${r1(-6 * s)} ${r1(-14 * s)} ${r1(-44 * s)} 0 Z`, fill) +
    tri(x + 22 * s, y - 4 * s, x + 38 * s, y - 2 * s, x + 22 * s, y + 3 * s, fill) +
    flame(x + 36 * s, y - 4 * s, s * 0.22, flameFill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** Torch or column of smoke rising. */
export function smokeColumn(rand: () => number, x: number, y: number, s: number, fill: string): string {
  const out: string[] = [];
  for (let i = 0; i < 9; i += 1) {
    out.push(ellipse(x + (rand() - 0.5) * 30 * s, y - i * 22 * s, (18 + i * 6) * s, (14 + i * 3) * s, fill));
  }
  return `<g opacity="0.16">${out.join('')}</g>`;
}

// ── structures ─────────────────────────────────────────────────────────────

export function templeFront(x: number, y: number, s: number, fill: string, cols = 6, o?: Opts): string {
  const w = 26 * s * cols;
  const parts = [
    rect(x - w / 2 - 14 * s, y - 8 * s, w + 28 * s, 10 * s, fill),
    rect(x - w / 2 - 8 * s, y - 16 * s, w + 16 * s, 9 * s, fill),
  ];
  for (let i = 0; i < cols; i += 1) {
    const px = x - w / 2 + 13 * s + i * 26 * s;
    parts.push(rect(px - 6 * s, y - 92 * s, 12 * s, 76 * s, fill));
    parts.push(rect(px - 9 * s, y - 96 * s, 18 * s, 7 * s, fill));
  }
  parts.push(rect(x - w / 2 - 12 * s, y - 108 * s, w + 24 * s, 14 * s, fill));
  parts.push(tri(x - w / 2 - 16 * s, y - 108 * s, x, y - 150 * s, x + w / 2 + 16 * s, y - 108 * s, fill));
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function columns(x: number, y: number, s: number, fill: string, n = 3, o?: Opts): string {
  const parts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + (i - (n - 1) / 2) * 40 * s;
    parts.push(rect(px - 8 * s, y - 100 * s, 16 * s, 100 * s, fill), rect(px - 12 * s, y - 106 * s, 24 * s, 9 * s, fill), rect(px - 13 * s, y - 6 * s, 26 * s, 8 * s, fill));
  }
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function cityWall(x: number, y: number, s: number, fill: string, len = 320, o?: Opts): string {
  const parts = [rect(x - len / 2, y - 60 * s, len, 60 * s, fill)];
  const notches = Math.floor(len / (22 * s));
  for (let i = 0; i < notches; i += 1) {
    parts.push(rect(x - len / 2 + i * 22 * s, y - 74 * s, 13 * s, 15 * s, fill));
  }
  parts.push(rect(x - len / 2 - 16 * s, y - 96 * s, 32 * s, 96 * s, fill));
  parts.push(rect(x + len / 2 - 16 * s, y - 96 * s, 32 * s, 96 * s, fill));
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function citySkyline(rand: () => number, x: number, y: number, s: number, fill: string, n = 7, o?: Opts): string {
  const parts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const px = x + (i - (n - 1) / 2) * 52 * s;
    const hgt = (40 + rand() * 60) * s;
    parts.push(rect(px - 24 * s, y - hgt, 48 * s, hgt, fill));
    if (rand() > 0.55) parts.push(path(`M ${r1(px - 24 * s)} ${r1(y - hgt)} a ${r1(24 * s)} ${r1(20 * s)} 0 0 1 ${r1(48 * s)} 0 Z`, fill));
    else parts.push(rect(px - 28 * s, y - hgt - 7 * s, 56 * s, 8 * s, fill));
  }
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function tower(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 26 * s)} ${r1(y)} L ${r1(x - 18 * s)} ${r1(y - 130 * s)} L ${r1(x + 18 * s)} ${r1(y - 130 * s)} L ${r1(x + 26 * s)} ${r1(y)} Z`, fill) +
    rect(x - 26 * s, y - 146 * s, 52 * s, 18 * s, fill) +
    rect(x - 26 * s, y - 158 * s, 11 * s, 14 * s, fill) +
    rect(x - 5 * s, y - 158 * s, 11 * s, 14 * s, fill) +
    rect(x + 16 * s, y - 158 * s, 11 * s, 14 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function ziggurat(x: number, y: number, s: number, fill: string, tiers = 4, o?: Opts): string {
  const parts: string[] = [];
  for (let i = 0; i < tiers; i += 1) {
    const w = (200 - i * 40) * s;
    parts.push(rect(x - w / 2, y - (i + 1) * 32 * s, w, 32 * s, fill));
  }
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function gateArch(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = path(
    `M ${r1(x - 62 * s)} ${r1(y)} L ${r1(x - 62 * s)} ${r1(y - 76 * s)} A ${r1(62 * s)} ${r1(62 * s)} 0 0 1 ${r1(
      x + 62 * s,
    )} ${r1(y - 76 * s)} L ${r1(x + 62 * s)} ${r1(y)} L ${r1(x + 34 * s)} ${r1(y)} L ${r1(x + 34 * s)} ${r1(
      y - 76 * s,
    )} A ${r1(34 * s)} ${r1(34 * s)} 0 0 0 ${r1(x - 34 * s)} ${r1(y - 76 * s)} L ${r1(x - 34 * s)} ${r1(y)} Z`,
    fill,
  ) + rect(x - 74 * s, y - 152 * s, 148 * s, 16 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function tent(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    tri(x - 62 * s, y, x, y - 78 * s, x + 62 * s, y, fill) +
    path(`M ${r1(x - 12 * s)} ${r1(y)} L ${r1(x - 6 * s)} ${r1(y - 42 * s)} L ${r1(x + 6 * s)} ${r1(y - 42 * s)} L ${r1(x + 12 * s)} ${r1(y)} Z`, fill, { opacity: 0.35 });
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function pyramids(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    tri(x - 130 * s, y, x - 60 * s, y - 96 * s, x + 10 * s, y, fill) +
    tri(x - 20 * s, y, x + 44 * s, y - 74 * s, x + 108 * s, y, fill, { opacity: 0.82 });
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function brickWall(rand: () => number, x: number, y: number, s: number, fill: string, rows = 4, cols = 6): string {
  const out: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const off = r % 2 ? 14 * s : 0;
      out.push(rect(x + c * 30 * s + off, y - (r + 1) * 16 * s, 26 * s, 13 * s, fill, { opacity: 0.7 + rand() * 0.3 }));
    }
  }
  return out.join('');
}

export function throne(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 54 * s, y - 12 * s, 108 * s, 12 * s, fill) +
    rect(x - 44 * s, y - 24 * s, 88 * s, 12 * s, fill) +
    rect(x - 34 * s, y - 74 * s, 68 * s, 52 * s, fill) +
    path(`M ${r1(x - 34 * s)} ${r1(y - 74 * s)} L ${r1(x - 34 * s)} ${r1(y - 150 * s)} A ${r1(34 * s)} ${r1(34 * s)} 0 0 1 ${r1(x + 34 * s)} ${r1(y - 150 * s)} L ${r1(x + 34 * s)} ${r1(y - 74 * s)} Z`, fill) +
    rect(x - 50 * s, y - 92 * s, 16 * s, 20 * s, fill) +
    rect(x + 34 * s, y - 92 * s, 16 * s, 20 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function tombMound(x: number, y: number, s: number, rockFill: string, holeFill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 150 * s)} ${r1(y)} C ${r1(x - 120 * s)} ${r1(y - 130 * s)} ${r1(x + 120 * s)} ${r1(y - 130 * s)} ${r1(x + 150 * s)} ${r1(y)} Z`, rockFill) +
    path(`M ${r1(x - 40 * s)} ${r1(y)} L ${r1(x - 40 * s)} ${r1(y - 42 * s)} A ${r1(40 * s)} ${r1(40 * s)} 0 0 1 ${r1(x + 40 * s)} ${r1(y - 42 * s)} L ${r1(x + 40 * s)} ${r1(y)} Z`, holeFill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function roundStone(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = circle(x, y - 42 * s, 42 * s, fill) + circle(x, y - 42 * s, 30 * s, fill, { opacity: 0.55 });
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function prisonBars(x: number, y: number, s: number, fill: string, open = false, o?: Opts): string {
  const parts = [rect(x - 70 * s, y - 116 * s, 140 * s, 12 * s, fill), rect(x - 70 * s, y - 12 * s, 140 * s, 12 * s, fill)];
  for (let i = 0; i < 5; i += 1) {
    const px = x - 60 * s + i * 30 * s;
    if (open && i > 2) continue;
    parts.push(rect(px - 5 * s, y - 116 * s, 10 * s, 116 * s, fill));
  }
  if (open) parts.push(rotate(24, x + 24 * s, y - 116 * s, rect(x + 24 * s, y - 116 * s, 10 * s, 116 * s, fill) + rect(x + 24 * s, y - 116 * s, 60 * s, 10 * s, fill)));
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function window(x: number, y: number, s: number, frameFill: string, glowFill: string, o?: Opts): string {
  const g =
    rect(x - 40 * s, y - 70 * s, 80 * s, 70 * s, frameFill) +
    rect(x - 31 * s, y - 61 * s, 62 * s, 52 * s, glowFill) +
    rect(x - 48 * s, y - 78 * s, 96 * s, 10 * s, frameFill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function houseBlock(rand: () => number, x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 70 * s, y - 96 * s, 140 * s, 96 * s, fill) +
    rect(x - 82 * s, y - 106 * s, 164 * s, 12 * s, fill) +
    rect(x - 44 * s, y - 62 * s, 26 * s, 26 * s, fill, { opacity: 0.55 }) +
    rect(x + 18 * s, y - 62 * s, 26 * s, 26 * s, fill, { opacity: 0.55 }) +
    rect(x + 40 * s, y - 150 * s, 44 * s, 46 * s, fill, { opacity: 0.9 + rand() * 0.1 });
  return o ? `<g${op(o)}>${g}</g>` : g;
}

// ── vessels & vehicles ─────────────────────────────────────────────────────

export function ship(x: number, y: number, s: number, hull: string, sail: string, o?: Opts): string {
  const g =
    rect(x - 4 * s, y - 150 * s, 8 * s, 150 * s, hull) +
    path(`M ${r1(x + 4 * s)} ${r1(y - 144 * s)} L ${r1(x + 86 * s)} ${r1(y - 36 * s)} L ${r1(x + 4 * s)} ${r1(y - 36 * s)} Z`, sail) +
    path(`M ${r1(x - 4 * s)} ${r1(y - 130 * s)} L ${r1(x - 62 * s)} ${r1(y - 40 * s)} L ${r1(x - 4 * s)} ${r1(y - 40 * s)} Z`, sail, { opacity: 0.72 }) +
    path(`M ${r1(x - 108 * s)} ${r1(y - 34 * s)} L ${r1(x + 112 * s)} ${r1(y - 34 * s)} L ${r1(x + 78 * s)} ${r1(y + 6 * s)} L ${r1(x - 74 * s)} ${r1(y + 6 * s)} Z`, hull) +
    path(`M ${r1(x - 108 * s)} ${r1(y - 34 * s)} q ${r1(-16 * s)} ${r1(-6 * s)} ${r1(-10 * s)} ${r1(-24 * s)} q ${r1(14 * s)} ${r1(8 * s)} ${r1(10 * s)} ${r1(24 * s)} Z`, hull);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function boat(x: number, y: number, s: number, fill: string, withSail = true, o?: Opts): string {
  const parts = [
    path(`M ${r1(x - 64 * s)} ${r1(y - 16 * s)} L ${r1(x + 64 * s)} ${r1(y - 16 * s)} L ${r1(x + 44 * s)} ${r1(y + 8 * s)} L ${r1(x - 44 * s)} ${r1(y + 8 * s)} Z`, fill),
  ];
  if (withSail) {
    parts.push(rect(x - 2 * s, y - 96 * s, 5 * s, 82 * s, fill));
    parts.push(path(`M ${r1(x + 3 * s)} ${r1(y - 92 * s)} L ${r1(x + 52 * s)} ${r1(y - 20 * s)} L ${r1(x + 3 * s)} ${r1(y - 20 * s)} Z`, fill, { opacity: 0.85 }));
  }
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function chariot(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const wheel =
    `<circle cx="${r1(x + 6 * s)}" cy="${r1(y - 26 * s)}" r="${r1(26 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(6 * s)}"/>` +
    circle(x + 6 * s, y - 26 * s, 6 * s, fill);
  const spokes: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * i) / 3;
    spokes.push(
      `<line x1="${r1(x + 6 * s)}" y1="${r1(y - 26 * s)}" x2="${r1(x + 6 * s + Math.cos(a) * 24 * s)}" y2="${r1(
        y - 26 * s + Math.sin(a) * 24 * s,
      )}" stroke="${fill}" stroke-width="${r1(3 * s)}"/>`,
    );
  }
  const g =
    wheel +
    spokes.join('') +
    path(`M ${r1(x - 34 * s)} ${r1(y - 26 * s)} L ${r1(x - 34 * s)} ${r1(y - 66 * s)} L ${r1(x + 30 * s)} ${r1(y - 66 * s)} L ${r1(x + 30 * s)} ${r1(y - 26 * s)} Z`, fill) +
    rect(x - 96 * s, y - 46 * s, 66 * s, 6 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

// ── objects ────────────────────────────────────────────────────────────────

export function crown(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(
      `M ${r1(x - 46 * s)} ${r1(y)} L ${r1(x - 52 * s)} ${r1(y - 54 * s)} L ${r1(x - 24 * s)} ${r1(y - 24 * s)} L ${r1(
        x,
      )} ${r1(y - 62 * s)} L ${r1(x + 24 * s)} ${r1(y - 24 * s)} L ${r1(x + 52 * s)} ${r1(y - 54 * s)} L ${r1(
        x + 46 * s,
      )} ${r1(y)} Z`,
      fill,
    ) + rect(x - 48 * s, y, 96 * s, 14 * s, fill, { rx: 4 * s });
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function scepter(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = rect(x - 4 * s, y - 100 * s, 8 * s, 100 * s, fill, { rx: 4 * s }) + circle(x, y - 108 * s, 14 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function goblet(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 22 * s)} ${r1(y - 60 * s)} L ${r1(x + 22 * s)} ${r1(y - 60 * s)} L ${r1(x + 14 * s)} ${r1(y - 24 * s)} L ${r1(x - 14 * s)} ${r1(y - 24 * s)} Z`, fill) +
    rect(x - 3 * s, y - 26 * s, 6 * s, 20 * s, fill) +
    ellipse(x, y - 4 * s, 18 * s, 5 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function loaf(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = path(`M ${r1(x - 30 * s)} ${r1(y)} a ${r1(30 * s)} ${r1(22 * s)} 0 0 1 ${r1(60 * s)} 0 Z`, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function coin(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = circle(x, y, 15 * s, fill) + circle(x, y, 8 * s, fill, { opacity: 0.45 });
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function scroll(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 50 * s, y - 30 * s, 100 * s, 60 * s, fill, { opacity: 0.92 }) +
    ellipse(x - 50 * s, y, 11 * s, 34 * s, fill) +
    ellipse(x + 50 * s, y, 11 * s, 34 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function tablets(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const one = (dx: number) =>
    path(
      `M ${r1(x + dx - 30 * s)} ${r1(y)} L ${r1(x + dx - 30 * s)} ${r1(y - 62 * s)} A ${r1(30 * s)} ${r1(30 * s)} 0 0 1 ${r1(
        x + dx + 30 * s,
      )} ${r1(y - 62 * s)} L ${r1(x + dx + 30 * s)} ${r1(y)} Z`,
      fill,
    );
  const g = one(-32 * s) + one(32 * s);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function ring(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(26 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(
    9 * s,
  )}"${op(o)}/>` + circle(x, y - 30 * s, 9 * s, fill, o);
  return g;
}

export function chainLinks(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const parts: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    parts.push(
      `<ellipse cx="${r1(x + i * 22 * s)}" cy="${r1(y + i * 12 * s)}" rx="${r1(14 * s)}" ry="${r1(9 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(
        5 * s,
      )}" transform="rotate(${i % 2 ? 60 : 20} ${r1(x + i * 22 * s)} ${r1(y + i * 12 * s)})"/>`,
    );
  }
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function cross(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = rect(x - 9 * s, y - 190 * s, 18 * s, 190 * s, fill) + rect(x - 54 * s, y - 150 * s, 108 * s, 16 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function basket(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 34 * s)} ${r1(y - 30 * s)} L ${r1(x + 34 * s)} ${r1(y - 30 * s)} L ${r1(x + 24 * s)} ${r1(y)} L ${r1(x - 24 * s)} ${r1(y)} Z`, fill) +
    ellipse(x, y - 30 * s, 36 * s, 8 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** A cloth lowered by its four corners - Peter's vision. */
export function sheet(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g = path(
    `M ${r1(x - 110 * s)} ${r1(y - 90 * s)} Q ${r1(x)} ${r1(y - 130 * s)} ${r1(x + 110 * s)} ${r1(y - 90 * s)}` +
      ` Q ${r1(x + 76 * s)} ${r1(y + 34 * s)} ${r1(x)} ${r1(y + 12 * s)}` +
      ` Q ${r1(x - 76 * s)} ${r1(y + 34 * s)} ${r1(x - 110 * s)} ${r1(y - 90 * s)} Z`,
    fill,
  );
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** A carried mat / stretcher, seen at a slight angle. */
export function mat(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 70 * s)} ${r1(y)} L ${r1(x + 70 * s)} ${r1(y - 12 * s)} L ${r1(x + 70 * s)} ${r1(y + 2 * s)} L ${r1(x - 70 * s)} ${r1(y + 14 * s)} Z`, fill) +
    ellipse(x - 8 * s, y - 12 * s, 40 * s, 10 * s, fill, { opacity: 0.8 });
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function sandal(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    ellipse(x, y, 34 * s, 13 * s, fill) +
    path(`M ${r1(x - 16 * s)} ${r1(y - 4 * s)} q ${r1(16 * s)} ${r1(-18 * s)} ${r1(32 * s)} ${r1(0 * s)}`, 'none').replace(
      'fill="none"',
      `fill="none" stroke="${fill}" stroke-width="${r1(5 * s)}" stroke-linecap="round"`,
    );
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** An open hand, palm out - the writing on the wall, a blessing, a healing. */
export function hand(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const parts = [path(`M ${r1(x - 26 * s)} ${r1(y)} L ${r1(x - 26 * s)} ${r1(y - 40 * s)} q ${r1(26 * s)} ${r1(-12 * s)} ${r1(52 * s)} 0 L ${r1(x + 26 * s)} ${r1(y)} Z`, fill)];
  for (let i = 0; i < 4; i += 1) {
    parts.push(rect(x - 24 * s + i * 15 * s, y - 40 * s - (i === 0 || i === 3 ? 26 : 36) * s, 11 * s, (i === 0 || i === 3 ? 30 : 40) * s, fill, { rx: 5 * s }));
  }
  parts.push(rotate(-42, x - 26 * s, y - 18 * s, rect(x - 34 * s, y - 44 * s, 11 * s, 30 * s, fill, { rx: 5 * s })));
  const g = parts.join('');
  return o ? `<g${op(o)}>${g}</g>` : g;
}

export function banner(x: number, y: number, s: number, poleFill: string, clothFill: string, o?: Opts): string {
  const g =
    rect(x - 3 * s, y - 130 * s, 6 * s, 130 * s, poleFill) +
    path(`M ${r1(x + 3 * s)} ${r1(y - 126 * s)} L ${r1(x + 76 * s)} ${r1(y - 112 * s)} L ${r1(x + 58 * s)} ${r1(y - 88 * s)} L ${r1(x + 76 * s)} ${r1(y - 64 * s)} L ${r1(x + 3 * s)} ${r1(y - 78 * s)} Z`, clothFill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** A colossal standing statue - Nebuchadnezzar's dream. */
export function colossus(x: number, y: number, s: number, body: string, head: string, o?: Opts): string {
  const g =
    rect(x - 62 * s, y - 26 * s, 124 * s, 26 * s, body) +
    path(`M ${r1(x - 44 * s)} ${r1(y - 26 * s)} L ${r1(x - 30 * s)} ${r1(y - 120 * s)} L ${r1(x + 30 * s)} ${r1(y - 120 * s)} L ${r1(x + 44 * s)} ${r1(y - 26 * s)} Z`, body) +
    rect(x - 34 * s, y - 210 * s, 68 * s, 92 * s, body) +
    rect(x - 52 * s, y - 206 * s, 18 * s, 74 * s, body) +
    rect(x + 34 * s, y - 206 * s, 18 * s, 74 * s, body) +
    rect(x - 42 * s, y - 222 * s, 84 * s, 14 * s, head) +
    circle(x, y - 250 * s, 30 * s, head);
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** A tree stump with the felled trunk beside it. */
export function stump(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 26 * s)} ${r1(y)} L ${r1(x - 20 * s)} ${r1(y - 46 * s)} L ${r1(x + 20 * s)} ${r1(y - 46 * s)} L ${r1(x + 26 * s)} ${r1(y)} Z`, fill) +
    ellipse(x, y - 46 * s, 20 * s, 7 * s, fill, { opacity: 0.6 }) +
    rotate(-14, x + 40 * s, y - 10 * s, rect(x + 40 * s, y - 24 * s, 150 * s, 22 * s, fill, { rx: 10 * s }));
  return o ? `<g${op(o)}>${g}</g>` : g;
}

/** Two roads splitting at the foot of the frame. */
export function forkedRoad(x: number, y: number, fill: string, o?: Opts): string {
  const g =
    path(`M ${r1(x - 30)} ${H} L ${r1(x + 30)} ${H} L ${r1(x + 14)} ${r1(y)} L ${r1(x - 14)} ${r1(y)} Z`, fill, o) +
    path(`M ${r1(x - 14)} ${r1(y)} L ${r1(x + 14)} ${r1(y)} L ${r1(x + 150)} ${r1(y - 70)} L ${r1(x + 128)} ${r1(y - 80)} Z`, fill, o) +
    path(`M ${r1(x - 14)} ${r1(y)} L ${r1(x + 14)} ${r1(y)} L ${r1(x - 118)} ${r1(y - 78)} L ${r1(x - 140)} ${r1(y - 68)} Z`, fill, o);
  return g;
}

/** A rising or receding path used as a leading line. */
export function trail(x0: number, y0: number, x1: number, y1: number, w: number, fill: string, o?: Opts): string {
  return path(
    `M ${r1(x0 - w)} ${r1(y0)} L ${r1(x0 + w)} ${r1(y0)} L ${r1(x1 + w * 0.22)} ${r1(y1)} L ${r1(x1 - w * 0.22)} ${r1(y1)} Z`,
    fill,
    o,
  );
}

export function well(x: number, y: number, s: number, fill: string, o?: Opts): string {
  const g =
    rect(x - 40 * s, y - 34 * s, 80 * s, 34 * s, fill) +
    ellipse(x, y - 34 * s, 40 * s, 10 * s, fill) +
    rect(x - 34 * s, y - 100 * s, 7 * s, 66 * s, fill) +
    rect(x + 27 * s, y - 100 * s, 7 * s, 66 * s, fill) +
    rect(x - 40 * s, y - 108 * s, 80 * s, 9 * s, fill);
  return o ? `<g${op(o)}>${g}</g>` : g;
}
