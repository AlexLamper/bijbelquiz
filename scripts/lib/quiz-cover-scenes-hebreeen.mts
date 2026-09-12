/**
 * Covers for the Hebreeën series, one scene per quiz part.
 *
 * Base hue 42 (warm bronze/gold - the temple-and-priesthood family, kept
 * distinct from the cooler series before it), drifting two degrees per part
 * (part 13 lands on 66). See `quiz-cover-scenes.mts` for the house style and
 * the core set this module is merged into. Hebreeën is thick with concrete
 * images - the Son enthroned above angels, the anchor behind the veil,
 * Melchizedek's bread and wine, the torn curtain, the race before a cloud of
 * witnesses - and each scene draws the one image its chapter is actually
 * about.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  boat,
  chainLinks,
  circle,
  cityWall,
  cloudBank,
  columns,
  crown,
  cross,
  crowd,
  gateArch,
  goat,
  goblet,
  houseBlock,
  loaf,
  path,
  person,
  ram,
  rect,
  scroll,
  shafts,
  tablets,
  templeFront,
  tent,
  trail,
} from './quiz-cover-primitives.mjs';

/** A ship's anchor, ring at top and flukes curling out at the bottom - "een anker der ziel, vast en zeker". */
function anchor(x: number, y: number, s: number, fill: string): string {
  const ringR = 15 * s;
  const ringY = y - 150 * s;
  const shaftTop = ringY + ringR;
  const shaftBottom = y - 10 * s;
  const flukeL = path(
    `M ${x} ${shaftBottom} C ${x - 46 * s} ${shaftBottom + 6 * s} ${x - 50 * s} ${shaftBottom - 34 * s} ${
      x - 18 * s
    } ${shaftBottom - 30 * s}`,
    'none',
  ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${9 * s}" stroke-linecap="round"`);
  const flukeR = path(
    `M ${x} ${shaftBottom} C ${x + 46 * s} ${shaftBottom + 6 * s} ${x + 50 * s} ${shaftBottom - 34 * s} ${
      x + 18 * s
    } ${shaftBottom - 30 * s}`,
    'none',
  ).replace('fill="none"', `fill="none" stroke="${fill}" stroke-width="${9 * s}" stroke-linecap="round"`);
  return (
    `<circle cx="${x}" cy="${ringY}" r="${ringR}" fill="none" stroke="${fill}" stroke-width="${7 * s}"/>` +
    rect(x - 4 * s, shaftTop, 8 * s, shaftBottom - shaftTop, fill) +
    rect(x - 30 * s, ringY + ringR + 20 * s, 60 * s, 9 * s, fill) +
    flukeL +
    flukeR
  );
}

/** A double-edged sword standing on its point of balance - "scherpsnijdender dan enig tweesnijdend zwaard". */
function sword(x: number, y: number, s: number, fill: string): string {
  const guardY = y - 22 * s;
  const bladeLen = 128 * s;
  return (
    rect(x - 5 * s, y - 22 * s, 10 * s, 22 * s, fill) +
    circle(x, y - 2 * s, 7 * s, fill) +
    rect(x - 27 * s, guardY - 9 * s, 54 * s, 9 * s, fill) +
    path(
      `M ${x} ${guardY - 9 * s - bladeLen} L ${x - 13 * s} ${guardY - 9 * s - bladeLen * 0.34} L ${
        x - 7 * s
      } ${guardY - 9 * s} L ${x + 7 * s} ${guardY - 9 * s} L ${x + 13 * s} ${guardY - 9 * s - bladeLen * 0.34} Z`,
      fill,
    )
  );
}

/** An intact hanging curtain with vertical folds - the tabernacle's "voorhang". */
function veil(x: number, y: number, w: number, h: number, fill: string, opacity = 1): string {
  const segs = 5;
  const segW = w / segs;
  const out: string[] = [rect(x - w / 2 - 6, y - h - 10, w + 12, 14, fill, { opacity })];
  for (let i = 0; i < segs; i += 1) {
    out.push(
      rect(x - w / 2 + i * segW, y - h, segW - 2, h, fill, { opacity: opacity * (i % 2 ? 0.8 : 1) }),
    );
  }
  return out.join('');
}

/** The same curtain torn in two, ragged edges pulling apart down the middle - "het voorhang is gescheurd". */
function tornVeil(x: number, y: number, w: number, h: number, fill: string): string {
  const half = w / 2;
  const rail = rect(x - half - 6, y - h - 10, w + 12, 14, fill);
  const left = path(
    `M ${x - half} ${y - h} L ${x - half} ${y} L ${x - 34} ${y} L ${x - 14} ${y - h * 0.34} L ${
      x - 46
    } ${y - h * 0.62} L ${x - 18} ${y - h} Z`,
    fill,
  );
  const right = path(
    `M ${x + half} ${y - h} L ${x + half} ${y} L ${x + 34} ${y} L ${x + 14} ${y - h * 0.34} L ${
      x + 46
    } ${y - h * 0.62} L ${x + 18} ${y - h} Z`,
    fill,
  );
  return rail + left + right;
}

export const HEBREEEN_SCENES: Record<string, Scene> = {
  // 1: The Son superior to the angels - enthroned in the heavenly temple, crowned, angels in attendance
  'hebreeen-bijbelquiz-deel-1': {
    hue: 42,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 200, sunR: 100, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      templeFront(704, 512, 1.3, c.p.near, 7),
      shafts(704, 90, 260, 220, c.p.glow, 5),
      person(704, 486, 1.45, c.p.fore, 'raise'),
      crown(704, 300, 0.9, c.p.accent),
      angel(420, 514, 0.85, c.p.near, { opacity: 0.85 }),
      angel(988, 514, 0.8, c.p.near, { opacity: 0.8 }),
      fg(c, 686, 14),
    ],
  },

  // 2: So great a salvation not neglected - Christ crowned with glory, tasting death, breaking the bondage of the devil
  'hebreeen-bijbelquiz-deel-2': {
    hue: 44,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 246, far: 'ridge' }),
      cross(1080, G, 0.9, c.p.near, { opacity: 0.55 }),
      person(560, G + 6, 1.4, c.p.fore, 'raise'),
      crown(560, G - 150, 0.75, c.p.accent),
      chainLinks(760, G + 30, 0.9, c.p.near, { opacity: 0.8 }),
      person(900, G + 10, 1.05, c.p.near, 'kneel'),
      fg(c, 676, 20),
    ],
  },

  // 3: Moses versus Christ, the builder of the house - the wilderness generation that failed to enter the rest
  'hebreeen-bijbelquiz-deel-3': {
    hue: 46,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 238, far: 'dunes', horizon: 474 }),
      templeFront(1020, 480, 1.0, c.p.near, 5),
      person(420, 486, 1.3, c.p.fore, 'stand'),
      tablets(468, 486, 0.55, c.p.accent),
      crowd(c.rand, 720, 490, 0.8, c.p.near, 6, 300),
      fg(c, 674, 20),
    ],
  },

  // 4: The word of God, living and sharper than a two-edged sword - the rest still open to enter today
  'hebreeen-bijbelquiz-deel-4': {
    hue: 48,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 230, sunR: 90, rays: true, far: 'ridge' }),
      scroll(540, G, 0.9, c.p.accent),
      sword(760, G + 10, 1.0, c.p.fore),
      person(940, G + 14, 1.1, c.p.near, 'kneel'),
      fg(c, 676, 20),
    ],
  },

  // 5: Every high priest taken from among men - Christ offering up prayers and supplications, learning obedience
  'hebreeen-bijbelquiz-deel-5': {
    hue: 50,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 240, far: 'dunes' }),
      templeFront(1020, G, 1.0, c.p.near, 5),
      person(560, G + 8, 1.35, c.p.fore, 'kneel'),
      goblet(700, G, 0.8, c.p.accent),
      ram(890, G + 6, 0.55, c.p.near),
      fg(c, 674, 20),
    ],
  },

  // 6: The anchor of the soul, sure and steadfast, entering within the veil
  'hebreeen-bijbelquiz-deel-6': {
    hue: 52,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 236, sunR: 84, rays: true, far: 'none', ground: 'water', horizon: 480 }),
      columns(1010, 480, 1.0, c.p.near, 3),
      veil(1010, 478, 130, 132, c.p.accent, 0.92),
      anchor(660, 480, 1.0, c.p.fore),
      person(420, 486, 1.1, c.p.near, 'stand'),
      fg(c, 690, 12),
    ],
  },

  // 7: Melchizedek, without beginning of days, king of Salem, who brought out bread and wine and blessed Abraham
  'hebreeen-bijbelquiz-deel-7': {
    hue: 54,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 238, rays: true, far: 'dunes', horizon: 474 }),
      cityWall(1180, 480, 0.7, c.p.far, 220, { opacity: 0.55 }),
      gateArch(1000, 480, 1.0, c.p.near),
      person(760, 486, 1.3, c.p.fore, 'stand'),
      crown(760, 320, 0.6, c.p.accent),
      loaf(660, 486, 0.8, c.p.accent),
      goblet(710, 486, 0.8, c.p.accentDeep),
      person(500, 490, 1.1, c.p.near, 'kneel'),
      fg(c, 674, 20),
    ],
  },

  // 8: The new covenant - the earthly tabernacle only a shadow of the heavenly reality it points to
  'hebreeen-bijbelquiz-deel-8': {
    hue: 56,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 280, sunY: 246, far: 'none', ground: 'flat', horizon: 514 }),
      tent(1020, 514, 1.1, c.p.near, { opacity: 0.55 }),
      c.soft(560, 420, 170, 0.24),
      scroll(560, 486, 0.9, c.p.accent),
      person(720, 514, 1.3, c.p.fore, 'point'),
      fg(c, 686, 14),
    ],
  },

  // 9: The holy of holies - the blood of goats and calves against the once-for-all blood of Christ
  'hebreeen-bijbelquiz-deel-9': {
    hue: 58,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 130, far: 'none', ground: 'flat', horizon: 514, stars: 40 }),
      columns(300, 514, 1.0, c.p.near, 3),
      columns(1130, 514, 1.0, c.p.near, 3),
      veil(704, 512, 170, 150, c.p.near, 0.85),
      goblet(704, 486, 1.0, c.p.accentDeep),
      goat(540, 514, 0.55, c.p.near),
      ram(880, 514, 0.55, c.p.near),
      person(704, 514, 1.3, c.p.fore, 'raise'),
      fg(c, 686, 14),
    ],
  },

  // 10: One offering for sins forever - the veil of the temple torn from top to bottom
  'hebreeen-bijbelquiz-deel-10': {
    hue: 60,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 4, far: 'none', ground: 'flat', horizon: 514 }),
      columns(300, 514, 0.95, c.p.near, 3),
      columns(1130, 514, 0.95, c.p.near, 3),
      cross(704, 514, 0.75, c.p.fore, { opacity: 0.6 }),
      tornVeil(704, 514, 300, 300, c.p.accent),
      shafts(704, 120, 260, 260, c.p.glow, 5),
      fg(c, 686, 14),
    ],
  },

  // 11: The faith chapter - Noah's ark, Abraham and the ram, Israel crossing the sea, the cloud of witnesses looking on
  'hebreeen-bijbelquiz-deel-11': {
    hue: 62,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 220, sunR: 90, rays: true, far: 'none', ground: 'water', horizon: 470 }),
      boat(260, 460, 0.75, c.p.near, false, { opacity: 0.85 }),
      person(600, 472, 0.95, c.p.fore, 'raise'),
      ram(500, 474, 0.4, c.p.near),
      trail(700, H, 940, 470, 80, c.p.mid, { opacity: 0.5 }),
      person(920, 472, 1.0, c.p.fore, 'walk'),
      cloudBank(c.rand, 1140, 250, 1.0, c.p.light, { opacity: 0.26 }),
      crowd(c.rand, 1160, 484, 0.7, c.p.near, 4, 180),
      fg(c, 678, 18),
    ],
  },

  // 12: The great cloud of witnesses, Jesus the author and finisher of faith who endured the cross, chastening as of a father
  'hebreeen-bijbelquiz-deel-12': {
    hue: 64,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 232, sunR: 84, rays: true, far: 'ridge' }),
      crowd(c.rand, 380, G + 12, 0.75, c.p.near, 6, 260),
      trail(300, H, 1100, G, 120, c.p.mid, { opacity: 0.45 }),
      cross(1150, G - 10, 0.55, c.p.near, { opacity: 0.5 }),
      person(900, G + 6, 1.35, c.p.fore, 'raise'),
      person(560, G + 10, 1.0, c.p.near, 'kneel'),
      fg(c, 676, 20),
    ],
  },

  // 13: Hospitality that unknowingly entertains angels - Christ carrying his reproach outside the camp, outside the gate
  'hebreeen-bijbelquiz-deel-13': {
    hue: 66,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 246, far: 'dunes', horizon: 476 }),
      houseBlock(c.rand, 400, 480, 0.85, c.p.near, { opacity: 0.85 }),
      person(500, 486, 1.2, c.p.fore, 'point'),
      angel(600, 488, 0.75, c.p.near, { opacity: 0.75 }),
      cityWall(1040, 476, 0.75, c.p.far, 260, { opacity: 0.55 }),
      cross(1180, 476, 0.85, c.p.fore, { opacity: 0.8 }),
      person(1070, 476, 1.05, c.p.near, 'bow'),
      fg(c, 674, 20),
    ],
  },
};
