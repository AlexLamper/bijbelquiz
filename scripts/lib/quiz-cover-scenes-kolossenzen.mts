/**
 * Covers for the Kolossenzen series, one scene per quiz part.
 *
 * Kolossenzen is Paulus' letter against a false, angel-and-rule-bound
 * philosophy, answered with the supremacy of Christ: head of creation and of
 * the church, the mystery hidden in the saints, the old and new man, and a
 * household and prayer life shaped by him.
 *
 * Base hue 200 (a steel blue, distinct from the other Pauline letters),
 * drifting a few degrees per part. See `quiz-cover-scenes-2-korinthe.mts` for
 * the house style this module follows.
 */

import { columns, crown, person, rays, scroll } from './quiz-cover-primitives.mjs';
import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

// ── motifs composed for this series ─────────────────────────────────────────

/** A robe crumpled flat on the ground beside a robe held up on a raised arm - the old man taken off, the new put on. */
function garmentExchange(x: number, y: number, s: number, oldFill: string, newFill: string): string {
  const oldRobe =
    `<path d="M ${r1(x - 60 * s)} ${r1(y)} Q ${r1(x - 30 * s)} ${r1(y - 22 * s)} ${r1(x)} ${r1(y - 4 * s)} ` +
    `Q ${r1(x + 24 * s)} ${r1(y - 16 * s)} ${r1(x + 46 * s)} ${r1(y)} Q ${r1(x - 10 * s)} ${r1(y + 12 * s)} ${r1(x - 60 * s)} ${r1(y)} Z" fill="${oldFill}" opacity="0.6"/>`;
  const newRobe =
    `<path d="M ${r1(x + 92 * s)} ${r1(y - 132 * s)} L ${r1(x + 78 * s)} ${r1(y - 8 * s)} L ${r1(x + 118 * s)} ${r1(y - 8 * s)} ` +
    `L ${r1(x + 110 * s)} ${r1(y - 132 * s)} Q ${r1(x + 98 * s)} ${r1(y - 142 * s)} ${r1(x + 92 * s)} ${r1(y - 132 * s)} Z" fill="${newFill}"/>`;
  const arm = `<path d="M ${r1(x + 60 * s)} ${r1(y - 40 * s)} L ${r1(x + 100 * s)} ${r1(y - 128 * s)} L ${r1(x + 92 * s)} ${r1(y - 132 * s)} L ${r1(x + 50 * s)} ${r1(y - 44 * s)} Z" fill="${newFill}"/>`;
  return oldRobe + arm + newRobe;
}

/** A slender shoot rising from a buried root, with a few broad leaves - rooted and built up in him. */
function rootedShoot(x: number, y: number, s: number, fill: string): string {
  const stem = `<path d="M ${r1(x)} ${r1(y - 112 * s)} Q ${r1(x - 10 * s)} ${r1(y - 50 * s)} ${r1(x)} ${r1(y)}" fill="none" stroke="${fill}" stroke-width="${r1(7 * s)}" stroke-linecap="round"/>`;
  const leaf = (t: number, dir: number) => {
    const lx = x - 10 * s * (1 - t);
    const ly = y - 112 * s * t;
    return `<path d="M ${r1(lx)} ${r1(ly)} Q ${r1(lx + dir * 34 * s)} ${r1(ly - 6 * s)} ${r1(lx + dir * 4 * s)} ${r1(ly + 26 * s)} Q ${r1(lx - dir * 6 * s)} ${r1(ly + 6 * s)} ${r1(lx)} ${r1(ly)} Z" fill="${fill}"/>`;
  };
  const root = `<path d="M ${r1(x)} ${r1(y)} q ${r1(-26 * s)} ${r1(12 * s)} ${r1(-40 * s)} ${r1(32 * s)} M ${r1(x)} ${r1(y)} q ${r1(26 * s)} ${r1(12 * s)} ${r1(36 * s)} ${r1(34 * s)}" fill="none" stroke="${fill}" stroke-width="${r1(5 * s)}" stroke-linecap="round" opacity="0.55"/>`;
  return root + stem + leaf(0.3, 1) + leaf(0.55, -1) + leaf(0.85, 1);
}

// ── scenes ──────────────────────────────────────────────────────────────────

export const KOLOSSENZEN_SCENES: Record<string, Scene> = {
  // 1: the image of the invisible God, head of creation - all things created by and for him
  'kolossenzen-bijbelquiz-deel-1': {
    hue: 200,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 200, rays: true, far: 'ridge', horizon: 470 }),
      c.soft(704, 230, 260, 0.36),
      rays(c.rand, 704, 230, 360, c.p.glow, 14, { opacity: 0.14 }),
      crown(704, 234, 1.05, c.p.light, { opacity: 0.9 }),
      person(704, 486, 1.35, c.p.fore, 'raise'),
      person(500, G + 10, 1.05, c.p.near, 'kneel'),
      person(910, G + 10, 1.05, c.p.near, 'kneel'),
      fg(c, 680, 16),
    ],
  },
  // 2: hid in Christ - rooted and built up, the mystery of God made known
  'kolossenzen-bijbelquiz-deel-2': {
    hue: 202,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 236, far: 'ridge' }),
      rootedShoot(540, G + 4, 1.7, c.p.near),
      person(760, G + 6, 1.2, c.p.fore, 'kneel'),
      c.soft(920, G - 10, 130, 0.34),
      scroll(920, G + 6, 0.75, c.p.accent),
      fg(c, 676, 18),
    ],
  },
  // 3: put off the old man, put on the new - seek the things above
  'kolossenzen-bijbelquiz-deel-3': {
    hue: 204,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 232, far: 'none', ground: 'flat', horizon: 500 }),
      person(680, 486, 1.3, c.p.fore, 'raise'),
      rays(c.rand, 704, 200, 260, c.p.glow, 8, { opacity: 0.1 }),
      garmentExchange(750, 500, 1.0, c.p.near, c.p.accent),
      fg(c, 684, 14),
    ],
  },
  // 4: continue in prayer, wisdom toward outsiders, speech seasoned with salt
  'kolossenzen-bijbelquiz-deel-4': {
    hue: 206,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1000, sunY: 244, far: 'ridge', horizon: 480 }),
      columns(1060, G + 10, 0.85, c.p.near, 2, { opacity: 0.5 }),
      person(560, G + 8, 1.2, c.p.fore, 'kneel'),
      c.soft(560, 356, 120, 0.32),
      person(720, G + 6, 1.15, c.p.near, 'point'),
      person(820, G + 10, 1.05, c.p.near, 'stand'),
      fg(c, 680, 16),
    ],
  },
};
