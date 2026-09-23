/**
 * Covers for the Prediker series, one scene per quiz. Each quiz covers one
 * chapter: `prediker-bijbelquiz-deel-<n>` is chapter n (1-12).
 *
 * Base hue 30, the amber of the older `prediker` cover, drifting two degrees
 * per chapter (chapter 12 lands on 52). See `quiz-cover-scene-kit.mts` for
 * the house style. The older `prediker` cover stays in the core table; its
 * seated Prediker by the river under a setting sun comes back in chapter 1.
 *
 * Chapters: ijdelheid der ijdelheden, de zon gaat op en onder, de beken gaan
 * in de zee (1); de grote werken van de koning: huizen, wijngaarden, vijvers
 * (2); alles heeft een bestemde tijd (3); twee zijn beter dan een, een
 * drievoudig snoer (4); wees niet te snel met uw mond voor Gods aangezicht,
 * de slaap des arbeiders is zoet (5); rijkdom die een vreemde opeet (6); het
 * klaaghuis is beter dan het huis des maaltijds (7); neem des konings mond
 * waar, wijsheid verlicht het aangezicht (8); de kleine stad, belegerd en door
 * een arme wijze verlost (9); knechten op paarden, vorsten te voet, wie een
 * muur doorbreekt wordt door een slang gebeten (10); werp uw brood uit op het
 * water (11); gedenk uw Schepper, eer de kruik aan de springader breekt (12).
 */

import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  banner,
  basket,
  brickWall,
  circle,
  citySkyline,
  cityWall,
  cloudBank,
  coin,
  columns,
  crown,
  ellipse,
  fireBed,
  goblet,
  horse,
  houseBlock,
  lamp,
  loaf,
  path,
  person,
  rect,
  river,
  rotate,
  scepter,
  serpent,
  sheaf,
  streaks,
  templeFront,
  tent,
  throne,
  tombMound,
  tower,
  tree,
  vineRow,
  water,
  well,
  wheat,
  window as windowFrame,
} from './quiz-cover-primitives.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A round-capped stroke. */
function line(x1: number, y1: number, x2: number, y2: number, w: number, fill: string, opacity = 1): string {
  return (
    `<path d="M ${r1(x1)} ${r1(y1)} L ${r1(x2)} ${r1(y2)}" fill="none" stroke="${fill}" stroke-width="${r1(w)}"` +
    ` stroke-linecap="round"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`
  );
}

/**
 * The sun's day as a row of discs on an arc across the sky, faint at either
 * end - "de zon gaat op, en de zon gaat onder", and a time for everything.
 */
function sunArc(x0: number, x1: number, low: number, high: number, n: number, r: number, fill: string): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const y = low - (low - high) * Math.sin(Math.PI * t);
    out.push(circle(x, y, r * (0.7 + 0.3 * Math.sin(Math.PI * t)), fill, { opacity: r1(0.25 + 0.55 * Math.sin(Math.PI * t)) }));
  }
  return out.join('');
}

/** Three strands braided along a line: "een drievoudig snoer wordt niet haast gebroken". */
function cord(x0: number, x1: number, y: number, amp: number, w: number, fills: [string, string, string]): string {
  const out: string[] = [];
  for (let k = 0; k < 3; k += 1) {
    let d = '';
    for (let x = x0; x <= x1; x += 6) {
      const yy = y + amp * Math.sin(((x - x0) / 46) * Math.PI * 2 + (k * Math.PI * 2) / 3);
      d += `${d ? ' L' : 'M'} ${r1(x)} ${r1(yy)}`;
    }
    out.push(`<path d="${d}" fill="none" stroke="${fills[k]}" stroke-width="${r1(w)}" stroke-linecap="round"/>`);
  }
  return out.join('');
}

/** An earthen pitcher broken: the base still standing, two shards beside it. */
function brokenJar(x: number, y: number, s: number, fill: string): string {
  return (
    path(`M ${r1(x - 22 * s)} ${r1(y)} Q ${r1(x - 36 * s)} ${r1(y - 26 * s)} ${r1(x - 30 * s)} ${r1(y - 40 * s)} L ${r1(x - 10 * s)} ${r1(y - 28 * s)} L ${r1(x + 4 * s)} ${r1(y - 44 * s)} L ${r1(x + 32 * s)} ${r1(y - 34 * s)} Q ${r1(x + 36 * s)} ${r1(y - 18 * s)} ${r1(x + 22 * s)} ${r1(y)} Z`, fill) +
    rotate(-38, x + 60 * s, y - 8 * s, path(`M ${r1(x + 44 * s)} ${r1(y - 4 * s)} Q ${r1(x + 60 * s)} ${r1(y - 30 * s)} ${r1(x + 84 * s)} ${r1(y - 20 * s)} L ${r1(x + 76 * s)} ${r1(y)} Z`, fill)) +
    rotate(24, x - 62 * s, y - 6 * s, path(`M ${r1(x - 80 * s)} ${r1(y)} L ${r1(x - 72 * s)} ${r1(y - 22 * s)} L ${r1(x - 48 * s)} ${r1(y - 16 * s)} L ${r1(x - 50 * s)} ${r1(y)} Z`, fill))
  );
}

/** A spoked wheel; `broken` leaves the rim open and two spokes gone. */
function wheel(x: number, y: number, r: number, fill: string, broken = false): string {
  const w = r * 0.16;
  const out: string[] = [];
  if (broken) {
    const a0 = -0.3;
    const a1 = Math.PI * 1.45;
    out.push(
      `<path d="M ${r1(x + Math.cos(a0) * r)} ${r1(y + Math.sin(a0) * r)} A ${r1(r)} ${r1(r)} 0 1 1 ${r1(x + Math.cos(a1) * r)} ${r1(
        y + Math.sin(a1) * r,
      )}" fill="none" stroke="${fill}" stroke-width="${r1(w)}" stroke-linecap="round"/>`,
    );
  } else {
    out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="none" stroke="${fill}" stroke-width="${r1(w)}"/>`);
  }
  for (let i = 0; i < 8; i += 1) {
    if (broken && (i === 6 || i === 7)) continue;
    const a = (Math.PI * i) / 4;
    out.push(line(x, y, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, w * 0.6, fill));
  }
  out.push(circle(x, y, r * 0.18, fill));
  return out.join('');
}

/** An almond tree in blossom - "de amandelboom zal bloeien". */
function almondTree(rand: () => number, x: number, y: number, s: number, wood: string, bloom: string): string {
  const out = [
    path(
      `M ${r1(x - 10 * s)} ${r1(y)} C ${r1(x - 6 * s)} ${r1(y - 50 * s)} ${r1(x - 16 * s)} ${r1(y - 90 * s)} ${r1(x - 6 * s)} ${r1(y - 120 * s)}` +
        ` L ${r1(x + 6 * s)} ${r1(y - 120 * s)} C ${r1(x + 2 * s)} ${r1(y - 80 * s)} ${r1(x + 12 * s)} ${r1(y - 40 * s)} ${r1(x + 12 * s)} ${r1(y)} Z`,
      wood,
    ),
    line(x, y - 110 * s, x - 70 * s, y - 170 * s, 7 * s, wood),
    line(x, y - 112 * s, x + 76 * s, y - 160 * s, 7 * s, wood),
    line(x, y - 118 * s, x + 6 * s, y - 196 * s, 6 * s, wood),
    line(x - 36 * s, y - 140 * s, x - 90 * s, y - 136 * s, 4 * s, wood),
    line(x + 40 * s, y - 136 * s, x + 96 * s, y - 128 * s, 4 * s, wood),
  ];
  for (let i = 0; i < 70; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand());
    out.push(circle(x + Math.cos(a) * d * 110 * s, y - 160 * s + Math.sin(a) * d * 50 * s, (4 + rand() * 4) * s, bloom, { opacity: r1(0.55 + rand() * 0.45) }));
  }
  return out.join('');
}

export const PREDIKER_SCENES: Record<string, Scene> = {
  // 1: "IJdelheid der ijdelheden" - the sun rises and sets, the rivers run to the sea and the sea is not full
  'prediker-bijbelquiz-deel-1': {
    hue: 30,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 330, sunR: 70, rays: true, far: 'ridge', horizon: 470 }),
      sunArc(200, 1080, 360, 130, 9, 26, c.p.light),
      water(c.rand, 470, c.p.water, c.p.crest, 1),
      path(`M -20 486 C 300 470 520 500 760 486 C 1000 474 1200 490 ${W + 20} 480 L ${W + 20} ${H} L -20 ${H} Z`, c.p.mid),
      river(486, c.p.water, { opacity: 0.85 }),
      person(300, 516, 1.35, c.p.fore, 'sit'),
      c.soft(1080, 330, 260, 0.2),
      fg(c, 680, 22),
    ],
  },

  // 2: "Ik maakte mij grote werken" - the king over his houses, vineyards, gardens and pools, and it was all vanity
  'prediker-bijbelquiz-deel-2': {
    hue: 32,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 236, rays: true, far: 'dunes', horizon: 468 }),
      citySkyline(c.rand, 1040, 468, 1.0, c.p.far, 6, { opacity: 0.85 }),
      columns(880, 476, 0.95, c.p.near, 4),
      vineRow(c.rand, 470, 492, 0.85, c.p.mid, 6),
      tree(1220, 480, 1.1, c.p.near),
      tree(1310, 484, 0.9, c.p.near),
      ellipse(760, 540, 190, 22, c.p.water),
      ellipse(760, 536, 150, 12, c.p.crest, { opacity: 0.35 }),
      person(250, 520, 1.35, c.p.fore, 'sit'),
      crown(250, 368, 0.3, c.p.accent),
      coin(372, 514, 0.9, c.p.accent),
      coin(398, 518, 0.9, c.p.accent),
      coin(386, 498, 0.9, c.p.accent),
      fg(c, 680, 18),
    ],
  },

  // 3: "Alles heeft een bestemde tijd" - a time to plant and a time to reap, the sun's course over it all
  'prediker-bijbelquiz-deel-3': {
    hue: 34,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 470 }),
      sunArc(160, 1250, 380, 120, 11, 28, c.p.light),
      tombMound(704, 474, 0.45, c.p.far, c.p.near, { opacity: 0.7 }),
      person(300, 522, 1.3, c.p.fore, 'kneel'),
      wheat(420, 530, 0.32, c.p.crop, 5),
      wheat(500, 534, 0.28, c.p.crop, 4),
      wheat(940, 530, 0.95, c.p.crop, 6),
      sheaf(1100, 534, 0.95, c.p.crop),
      person(1230, 528, 1.25, c.p.fore, 'carry'),
      fg(c, 684, 16),
    ],
  },

  // 4: "Twee zijn beter dan een ... want indien zij vallen, de een richt zijn metgezel op" - and the threefold cord
  'prediker-bijbelquiz-deel-4': {
    hue: 36,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 270, sunR: 70, far: 'ridge', horizon: 474 }),
      person(1160, 500, 0.95, c.p.near, 'sit', { opacity: 0.7 }),
      c.soft(640, 470, 180, 0.22),
      person(560, 520, 1.35, c.p.fore, 'point'),
      person(690, 520, 1.3, c.p.fore, 'fallen'),
      cord(360, 1040, 572, 7, 6, [c.p.accent, c.p.crop, c.p.accentDeep]),
      fg(c, 690, 14),
    ],
  },

  // 5: "God is in den hemel, en gij zijt op de aarde; daarom zijn uw woorden weinig" - before the house of God; the labourer's sweet sleep
  'prediker-bijbelquiz-deel-5': {
    hue: 38,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 920, sunY: 150, far: 'dunes', ground: 'flat', horizon: 512 }),
      c.soft(920, 180, 240, 0.3),
      templeFront(920, 512, 1.4, c.p.near, 6),
      person(700, 512, 1.25, c.p.fore, 'kneel'),
      tree(250, 516, 1.25, c.p.near),
      person(330, 530, 1.0, c.p.fore, 'fallen'),
      fg(c, 686, 14),
    ],
  },

  // 6: "God geeft hem de macht niet om daarvan te eten, maar een vreemd man eet het" - the laden table, the owner turned away, his long shadow
  'prediker-bijbelquiz-deel-6': {
    hue: 40,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 180, sunY: 440, sunR: 60, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 1180, 512, 1.1, c.p.near, { opacity: 0.8 }),
      path('M 380 512 L 440 512 L 820 560 L 700 560 Z', c.p.fore, { opacity: 0.35 }),
      person(410, 512, 1.3, c.p.fore, 'sit'),
      rect(540, 446, 230, 12, c.p.near),
      rect(556, 458, 10, 54, c.p.near),
      rect(744, 458, 10, 54, c.p.near),
      loaf(590, 446, 0.8, c.p.accent),
      goblet(660, 446, 0.8, c.p.accent),
      coin(708, 436, 0.7, c.p.accent),
      coin(730, 438, 0.7, c.p.accent),
      person(940, 512, 1.25, c.p.fore, 'carry'),
      basket(940, 346, 0.7, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 7: "Het is beter te gaan in het klaaghuis, dan in het huis des maaltijds" - mourners at the grave, the feast's lit windows beyond
  'prediker-bijbelquiz-deel-7': {
    hue: 42,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 260, sunY: 200, sunR: 44, far: 'dunes', horizon: 480 }),
      houseBlock(c.rand, 1070, 482, 1.3, c.p.near),
      windowFrame(1030, 432, 0.5, c.p.near, c.p.accent),
      windowFrame(1110, 432, 0.5, c.p.near, c.p.accent),
      c.soft(1070, 420, 150, 0.22, c.p.accent),
      fireBed(c.rand, 1250, 500, 0.5, c.p.accent, 4),
      ellipse(1250, 470, 34, 20, c.p.near),
      tombMound(420, 510, 0.8, c.p.near, c.p.fore),
      lamp(500, 506, 0.9, c.p.near, c.p.light),
      person(300, 530, 1.25, c.p.fore, 'kneel'),
      person(566, 532, 1.2, c.p.fore, 'kneel'),
      person(640, 528, 1.1, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 8: "Waar het woord des konings is, daar is heerschappij" - the throne and the outstretched scepter; wisdom lights a man's face
  'prediker-bijbelquiz-deel-8': {
    hue: 44,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1040, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      columns(300, 512, 1.2, c.p.near, 3),
      columns(1180, 512, 1.2, c.p.near, 3, { opacity: 0.85 }),
      throne(520, 512, 1.15, c.p.near),
      crown(520, 356, 0.4, c.p.accent),
      rotate(38, 590, 470, scepter(590, 470, 0.9, c.p.accent)),
      person(760, 512, 1.2, c.p.fore, 'kneel'),
      c.soft(960, 370, 90, 0.5),
      person(960, 512, 1.3, c.p.fore, 'stand'),
      fg(c, 686, 14),
    ],
  },

  // 9: "Een kleine stad, en weinig mannen daarin; en er kwam een groot koning tegen haar" - the siege, and the poor wise man on the wall
  'prediker-bijbelquiz-deel-9': {
    hue: 46,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 250, sunR: 64, far: 'ridge', horizon: 480 }),
      path('M 400 486 C 480 400 560 372 704 368 C 848 372 928 400 1008 486 Z', c.p.mid),
      citySkyline(c.rand, 704, 360, 0.7, c.p.near, 5),
      cityWall(704, 392, 0.7, c.p.near, 260),
      person(704, 344, 0.55, c.p.fore, 'raise'),
      c.soft(704, 320, 70, 0.4),
      tower(470, 500, 0.9, c.p.fore),
      tower(950, 500, 0.85, c.p.fore),
      tent(200, 520, 0.9, c.p.near),
      tent(310, 530, 0.7, c.p.near, { opacity: 0.85 }),
      tent(1130, 524, 0.85, c.p.near),
      tent(1250, 530, 0.7, c.p.near, { opacity: 0.85 }),
      banner(1060, 540, 0.8, c.p.fore, c.p.accent),
      banner(360, 548, 0.7, c.p.fore, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 10: "Ik heb knechten gezien op paarden, en vorsten gaande als knechten" - and the serpent in the broken wall
  'prediker-bijbelquiz-deel-10': {
    hue: 48,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 230, sunY: 240, far: 'dunes', horizon: 470 }),
      horse(540, 520, 1.1, c.p.near),
      person(560, 458, 0.8, c.p.fore, 'sit'),
      person(800, 524, 1.2, c.p.fore, 'walk'),
      crown(800, 364, 0.3, c.p.accent),
      brickWall(c.rand, 1020, 522, 1.1, c.p.near, 4, 3),
      brickWall(c.rand, 1180, 522, 1.1, c.p.near, 2, 2),
      serpent(1130, 520, 0.55, c.p.fore),
      fg(c, 684, 16),
    ],
  },

  // 11: "Werp uw brood uit op het water, want gij zult het vinden na vele dagen" - and the clouds full of rain
  'prediker-bijbelquiz-deel-11': {
    hue: 50,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 220, sunR: 60, far: 'none', ground: 'water', horizon: 452 }),
      cloudBank(c.rand, 1080, 190, 1.2, c.p.fore, { opacity: 0.35 }),
      streaks(c.rand, 940, 210, 280, 230, c.p.fore, 34, { opacity: 0.22 }),
      path(`M -20 520 C 120 500 260 504 380 540 C 430 560 450 620 470 ${H} L -20 ${H} Z`, c.p.mid),
      person(250, 530, 1.35, c.p.fore, 'point'),
      loaf(520, 512, 1.3, c.p.accent),
      loaf(700, 494, 1.0, c.p.accent, { opacity: 0.9 }),
      loaf(860, 480, 0.7, c.p.accent, { opacity: 0.8 }),
      fg(c, 690, 14),
    ],
  },

  // 12: "Gedenk aan uw Schepper ... eer de kruik aan de springader verbroken worde" - the broken pitcher and wheel, the almond in blossom, the sun going down
  'prediker-bijbelquiz-deel-12': {
    hue: 52,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 410, sunR: 72, clouds: 2, far: 'ridge', horizon: 480 }),
      c.soft(704, 120, 260, 0.2),
      almondTree(c.rand, 250, 520, 1.25, c.p.near, c.p.light),
      well(704, 520, 1.3, c.p.near),
      brokenJar(640, 528, 0.6, c.p.accent),
      wheel(850, 476, 44, c.p.near, true),
      person(1000, 528, 1.2, c.p.fore, 'bow'),
      rect(944, 424, 6, 104, c.p.fore),
      fg(c, 686, 14),
    ],
  },
};
