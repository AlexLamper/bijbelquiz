/**
 * Covers for the 1 Thessalonicenzen series, one scene per quiz part.
 *
 * 1 Thessalonicenzen is Paulus' warmest pastoral letter - a young church that
 * turned from idols and received the word with joy under affliction, Paulus
 * as a nursing mother to them, Timotheus bringing back good news, the call to
 * sanctification, and the hope of the coming of the Lord with the dead in
 * Christ raised first.
 *
 * Base hue 340 (rose/red, distinct from the other Pauline letters), drifting
 * a few degrees per part. See `quiz-cover-scenes-2-korinthe.mts` for the
 * house style this module follows.
 */

import {
  circle,
  crowd,
  ellipse,
  person,
  rays,
  rect,
  shafts,
} from './quiz-cover-primitives.mjs';
import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

// ── motifs composed for this series ─────────────────────────────────────────

/** A mother figure bent low over a small child cradled at her side - the nursing mother. */
function nursingMother(x: number, y: number, s: number, fill: string): string {
  return (
    person(x, y, s * 1.1, fill, 'kneel') +
    ellipse(x + 40 * s, y - 8 * s, 16 * s, 24 * s, fill, { opacity: 0.9 }) +
    circle(x + 40 * s, y - 34 * s, 13 * s, fill, { opacity: 0.9 })
  );
}

/** A long straight trumpet, bell up - the bazuingeschal at the coming of the Lord. */
function trumpet(x: number, y: number, s: number, fill: string): string {
  const body = `<path d="M ${r1(x - 6 * s)} ${r1(y)} L ${r1(x + 4 * s)} ${r1(y - 6 * s)} L ${r1(x + 34 * s)} ${r1(y - 96 * s)} L ${r1(x + 18 * s)} ${r1(y - 96 * s)} L ${r1(x - 14 * s)} ${r1(y - 4 * s)} Z" fill="${fill}"/>`;
  const bell = ellipse(x + 26 * s, y - 100 * s, 16 * s, 8 * s, fill);
  return body + bell;
}

// ── scenes ──────────────────────────────────────────────────────────────────

export const THESS1_SCENES: Record<string, Scene> = {
  // 1: turned from idols to serve the living God, followers under affliction with joy of the Spirit
  '1-thessalonicenzen-bijbelquiz-deel-1': {
    hue: 340,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 236, far: 'ridge' }),
      crowd(c.rand, 620, G + 10, 0.95, c.p.near, 5, 280),
      person(760, G + 6, 1.25, c.p.fore, 'raise'),
      rays(c.rand, 760, 200, 260, c.p.glow, 8, { opacity: 0.1 }),
      fg(c, 676, 18),
    ],
  },
  // 2: Paulus as a nursing mother cherishing her own children, laboring night and day among them
  '1-thessalonicenzen-bijbelquiz-deel-2': {
    hue: 342,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 238, far: 'ridge' }),
      c.soft(660, 360, 110, 0.3),
      nursingMother(600, G + 8, 1.2, c.p.fore),
      person(880, G + 8, 1.1, c.p.near, 'stand'),
      fg(c, 676, 18),
    ],
  },
  // 3: Timotheus sent to establish them, returns with good news of their faith and love
  '1-thessalonicenzen-bijbelquiz-deel-3': {
    hue: 344,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 234, far: 'dunes' }),
      person(430, G + 10, 1.05, c.p.near, 'walk'),
      person(700, G + 6, 1.2, c.p.fore, 'point'),
      c.soft(700, 360, 110, 0.3),
      person(880, G + 8, 1.15, c.p.fore, 'raise'),
      fg(c, 676, 18),
    ],
  },
  // 4: sanctification, and the dead in Christ rising first at the shout and the trump of God
  '1-thessalonicenzen-bijbelquiz-deel-4': {
    hue: 346,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 190, sunR: 140, far: 'none', ground: 'flat', horizon: 512, stars: 60 }),
      c.soft(704, 210, 260, 0.34),
      shafts(704, 190, 260, 220, c.p.glow, 5),
      trumpet(624, 300, 1.0, c.p.light),
      person(500, 512, 1.15, c.p.fore, 'raise'),
      person(704, 512, 1.05, c.p.near, 'kneel'),
      person(900, 512, 1.15, c.p.fore, 'raise'),
      fg(c, 684, 14),
    ],
  },
  // 5: the day of the Lord as a thief in the night, the armor of light - faith, love, hope of salvation
  '1-thessalonicenzen-bijbelquiz-deel-5': {
    hue: 348,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1070, sunY: 210, far: 'ridge', horizon: 480, stars: 30 }),
      person(600, 486, 1.25, c.p.fore, 'stand'),
      rect(578, 340, 46, 130, c.p.light, { opacity: 0.22, rx: 20 }),
      c.soft(600, 360, 110, 0.3),
      person(760, 486, 1.05, c.p.near, 'walk'),
      fg(c, 680, 16),
    ],
  },
};
