/**
 * Covers for Exodus 11-40, one scene per quiz. Each quiz covers one chapter:
 * `exodus-bijbelquiz-deel-<n>` is chapter n. Chapters 1-10 (the slavery,
 * the basket in the reeds, the burning bush, the plagues) are in the core
 * table in `quiz-cover-scenes.mts`; this module carries on from there in the
 * same sand palette, from the last plague to the glory filling the
 * tabernacle.
 *
 * Base hue 42, two degrees per chapter (chapter 40 lands on 100). See
 * `quiz-cover-scene-kit.mts` for the house style; the tabernacle furniture,
 * the priest, the walls of the sea and the golden calf are in
 * `quiz-cover-motifs-genesis-exodus.mts`.
 *
 * Chapters: Moses leaves Pharaoh in anger, one plague more (11); the blood on
 * the doorposts at the Passover (12); the pillar of fire going before them
 * (13); through the sea on dry ground (14); Miriam's timbrel (15); manna and
 * quails (16); Moses' hands held up at Rephidim (17); Jethro's counsel, Moses
 * judging the people (18); Sinai in smoke and fire (19); the ten words (20);
 * the judges and the law (21); the neighbour's cloak returned before sunset
 * (22); the feasts and the firstfruits, the angel on the way (23); the altar
 * and the twelve pillars below the mountain (24); the ark and the mercy seat
 * (25); the tabernacle under its coverings of red rams' skins (26); the
 * bronze altar in the court (27); Aaron's garments and the breastplate (28);
 * the anointing of Aaron (29); the incense altar and the laver (30);
 * Bezalel and Oholiab at work (31); the golden calf (32); the tent of meeting
 * with the pillar of cloud at its door (33); Moses comes down with shining
 * face (34); the people's offerings (35); the curtains woven (36); the
 * lampstand (37); the laver from the women's mirrors (38); the finished
 * garments brought to Moses (39); the glory fills the tabernacle (40).
 */

import { mix } from './cover-options/shapes.mjs';
import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  banner,
  basket,
  bird,
  circle,
  cloudBank,
  coin,
  columns,
  crowd,
  crown,
  ellipse,
  fireBed,
  gateArch,
  goblet,
  houseBlock,
  ox,
  path,
  person,
  pyramids,
  ram,
  rays,
  rect,
  rotate,
  scroll,
  shafts,
  sheaf,
  shrub,
  smokeColumn,
  tablets,
  throne,
  trail,
  vineRow,
  wheat,
} from './quiz-cover-primitives.mjs';
import {
  anvil,
  arkOfCovenant,
  altar,
  bier,
  cloak,
  cloudPillar,
  coat,
  courtFence,
  curve,
  doorHouse,
  firePillar,
  flakes,
  flipX,
  goldenCalf,
  hornedAltar,
  incenseAltar,
  jar,
  laver,
  lightning,
  loom,
  menorah,
  nomadTent,
  oilHorn,
  priest,
  radiance,
  robed,
  scales,
  seaWall,
  sheep,
  showbreadTable,
  spear,
  staffRaised,
  standingStone,
  stroke,
  tabernacle,
  tambourine,
} from './quiz-cover-motifs-genesis-exodus.mjs';

/** A mountain massif across the middle of the frame (Sinai), drawn as one light layer. */
function mountain(x: number, y: number, w: number, h: number, fill: string): string {
  return path(
    `M ${x - w} ${y} C ${x - w * 0.62} ${y - h * 0.3} ${x - w * 0.34} ${y - h * 0.86} ${x - w * 0.08} ${y - h} ` +
      `C ${x + w * 0.06} ${y - h * 1.04} ${x + w * 0.2} ${y - h * 0.9} ${x + w * 0.34} ${y - h * 0.72} C ${x + w * 0.56} ${y - h * 0.44} ${x + w * 0.8} ${y - h * 0.16} ${x + w} ${y} Z`,
    fill,
  );
}

export const EXODUS_SCENES: Record<string, Scene> = {
  // 11: "Nog een plaag" - Moses goes out from Pharaoh in hot anger; the night of the last plague gathering over Egypt
  'exodus-bijbelquiz-deel-11': {
    hue: 42,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'dunes', horizon: 500 }),
      c.veil(560, W, c.p.fore, 0.6),
      pyramids(1140, 500, 1.0, c.p.far, { opacity: 0.7 }),
      columns(190, 512, 1.3, c.p.near, 2),
      throne(420, 512, 1.15, mix(c.a.near, c.a.figure, 0.45)),
      person(420, 512, 1.25, c.p.fore, 'sit'),
      crown(420, 376, 0.5, c.p.accent),
      robed(780, 524, 1.4, c.p.fore, 'staff'),
      person(900, 528, 1.2, c.p.fore, 'walk'),
      fg(c, 688, 14),
    ],
  },

  // 12: the Passover - the blood of the lamb on the two side posts and the lintel, a family ready to go, staff in hand
  'exodus-bijbelquiz-deel-12': {
    hue: 44,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1120, sunY: 210, sunR: 46, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 1180, 512, 0.75, c.p.near, { opacity: 0.8 }),
      doorHouse(620, 516, 1.45, mix(c.a.near, c.a.figure, 0.35), mix(c.p.glow, c.a.near, 0.25), c.p.accent),
      c.soft(620, 450, 150, 0.35),
      robed(380, 524, 1.35, c.p.fore, 'staff'),
      sheep(860, 528, 1.05, c.p.light, c.p.near, true),
      shrub(940, 530, 0.55, c.p.near),
      fg(c, 688, 14),
    ],
  },

  // 13: "De HEERE toog voor hen heen ... des nachts in een vuurkolom" - the pillar of fire going before the people out of Egypt
  'exodus-bijbelquiz-deel-13': {
    hue: 46,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 494 }),
      c.soft(980, 300, 280, 0.55),
      firePillar(980, 506, 380, 120, c.p.accent, c.p.glow),
      trail(300, H, 960, 504, 110, '#FFFFFF', { opacity: 0.3 }),
      crowd(c.rand, 470, 534, 1.0, c.p.near, 7, 380),
      bier(700, 448, 0.55, c.p.near),
      person(660, 530, 1.0, c.p.fore, 'carry'),
      person(745, 530, 1.0, c.p.fore, 'carry'),
      robed(840, 526, 1.3, c.p.fore, 'staff'),
      fg(c, 690, 14),
    ],
  },

  // 14: "De kinderen Israels gingen in het midden der zee op het droge" - the waters a wall to the right and to the left
  'exodus-bijbelquiz-deel-14': {
    hue: 48,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 300, sunR: 50, far: 'none', ground: 'flat', horizon: 500 }),
      trail(704, H, 704, 490, 220, '#FFFFFF', { opacity: 0.4 }),
      crowd(c.rand, 704, 498, 0.55, c.p.near, 6, 110),
      seaWall(60, 600, 210, 560, 'left', mix('#9DB6C6', c.a.near, 0.35), c.p.light),
      seaWall(808, 1350, 220, 560, 'right', mix('#9DB6C6', c.a.near, 0.35), c.p.light),
      crowd(c.rand, 704, 540, 0.85, c.p.fore, 4, 120),
      staffRaised(520, 600, 1.45, c.p.fore, c.p.accent),
      fg(c, 700, 12),
    ],
  },

  // 15: the song by the sea - Miriam the prophetess takes a timbrel, the women follow her with timbrels and dances
  'exodus-bijbelquiz-deel-15': {
    hue: 50,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1150, sunY: 240, far: 'none', ground: 'water', horizon: 470 }),
      circle(1060, 488, 22, 'none').replace('fill="none"', `fill="none" stroke="${c.p.mid}" stroke-width="6"`),
      path(`M -40 540 C 200 500 520 496 800 512 C 1000 524 1200 540 ${W + 40} 560 L ${W + 40} ${H} L -40 ${H} Z`, c.p.mid),
      person(620, 540, 1.4, c.p.fore, 'raise'),
      tambourine(670, 326, 1.0, c.p.accent, mix(c.p.accent, '#FFFFFF', 0.5)),
      person(470, 536, 1.2, c.p.fore, 'raise'),
      person(360, 538, 1.1, c.p.near, 'raise'),
      person(780, 540, 1.2, c.p.near, 'raise'),
      person(880, 544, 1.05, c.p.near, 'stand'),
      fg(c, 700, 12),
    ],
  },

  // 16: "Wat is dit?" - manna like white coriander seed on the ground in the morning; the quails come up at evening
  'exodus-bijbelquiz-deel-16': {
    hue: 52,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 270, far: 'dunes', horizon: 488 }),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => bird(820 + i * 60 + (i % 2) * 20, 200 + (i % 3) * 34, 1.3, c.p.fore, { opacity: 0.6 })),
      nomadTent(1100, 494, 0.55, c.p.mid),
      nomadTent(1260, 496, 0.45, c.p.mid),
      flakes(c.rand, 200, 1250, 520, 600, c.p.light, 90),
      person(440, 532, 1.2, c.p.fore, 'kneel'),
      basket(560, 536, 0.6, c.p.near),
      person(820, 532, 1.25, c.p.fore, 'bow'),
      person(1000, 534, 1.1, c.p.near, 'kneel'),
      jar(680, 540, 0.8, c.p.accent),
      fg(c, 700, 12),
    ],
  },

  // 17: at Rephidim Moses holds up the staff of God on the hilltop, Aaron and Hur stay up his hands; Israel prevails against Amalek
  'exodus-bijbelquiz-deel-17': {
    hue: 54,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 360, far: 'ridge', horizon: 500 }),
      path('M 380 520 C 460 430 560 380 680 372 C 800 366 900 410 980 520 Z', c.p.mid),
      ellipse(690, 384, 30, 12, c.p.near),
      staffRaised(690, 384, 1.25, c.p.fore, c.p.accent, true),
      person(638, 392, 0.95, c.p.fore, 'raise'),
      person(742, 392, 0.95, c.p.fore, 'raise'),
      ...[200, 250, 300].map((x) => spear(x, 540, 120, 0.9, c.p.near)),
      banner(330, 540, 0.8, c.p.near, c.p.mid),
      crowd(c.rand, 250, 544, 0.8, c.p.near, 5, 200),
      ...[1110, 1160, 1210].map((x) => spear(x, 538, 110, 0.85, c.p.mid)),
      crowd(c.rand, 1160, 540, 0.7, c.p.mid, 5, 200),
      fg(c, 700, 12),
    ],
  },

  // 18: Moses sits to judge the people from morning to evening; Jethro tells him to set able men over them
  'exodus-bijbelquiz-deel-18': {
    hue: 56,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'ridge', horizon: 490 }),
      rect(220, 380, 300, 12, c.p.near, { rx: 4 }),
      rect(230, 390, 8, 140, c.p.near),
      rect(500, 390, 8, 140, c.p.near),
      path('M 214 380 L 526 380 L 506 404 L 234 404 Z', mix(c.a.near, c.a.figure, 0.2), { opacity: 0.8 }),
      rect(320, 500, 90, 30, c.p.near, { rx: 6 }),
      person(365, 504, 1.15, c.p.fore, 'sit'),
      scroll(450, 476, 0.62, c.p.accent),
      flipX(230, robed(230, 532, 1.25, c.p.fore, 'reach')),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => person(580 + i * 92, 532 - i * 5, 1.15 - i * 0.07, i < 2 ? c.p.fore : c.p.near, i === 0 ? 'point' : 'stand', { opacity: 1 - i * 0.07 })),
      fg(c, 690, 14),
    ],
  },

  // 19: the mount Sinai altogether on a smoke, the LORD descending upon it in fire; thunder, lightning, the trumpet; the people at the bounds
  'exodus-bijbelquiz-deel-19': {
    hue: 58,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', horizon: 500 }),
      mountain(704, 510, 520, 300, mix(c.a.mid, c.a.near, 0.5)),
      cloudBank(c.rand, 704, 200, 2.2, c.p.fore, { opacity: 0.4 }),
      smokeColumn(c.rand, 690, 210, 2.6, c.p.fore),
      fireBed(c.rand, 700, 222, 1.1, c.p.accent, 6),
      lightning(470, 120, 0.9, c.p.light, { opacity: 0.85 }),
      lightning(980, 110, 0.7, c.p.light, { opacity: 0.75 }),
      ...Array.from({ length: 12 }, (_, i) => rect(200 + i * 92, 504, 6, 34, c.p.near)),
      rect(196, 510, 1020, 4, c.p.near),
      crowd(c.rand, 704, 560, 1.0, c.p.fore, 9, 820),
      fg(c, 700, 12),
    ],
  },

  // 20: the ten words spoken from the mountain - the two tables of stone; the people standing afar off
  'exodus-bijbelquiz-deel-20': {
    hue: 60,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 190, rays: true, far: 'none', horizon: 500 }),
      mountain(704, 510, 560, 280, mix(c.a.mid, c.a.near, 0.45)),
      shafts(704, 140, 260, 300, c.p.glow, 5),
      c.soft(704, 330, 200, 0.5),
      rect(560, 470, 288, 40, c.p.near, { rx: 10 }),
      tablets(704, 470, 1.8, c.p.accent),
      ...[0, 1, 2].map((r) => stroke(620, 380 + r * 22, 676, 380 + r * 22, 5, c.p.accentDeep, { opacity: 0.45 })),
      ...[0, 1, 2].map((r) => stroke(732, 380 + r * 22, 788, 380 + r * 22, 5, c.p.accentDeep, { opacity: 0.45 })),
      crowd(c.rand, 260, 540, 0.95, c.p.near, 4, 180),
      crowd(c.rand, 1150, 540, 0.95, c.p.near, 4, 180),
      fg(c, 700, 12),
    ],
  },

  // 21: "Dit zijn de rechten" - the judges at the gate weigh each case: the servant, the ox that gores, an eye for an eye
  'exodus-bijbelquiz-deel-21': {
    hue: 62,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'dunes', horizon: 494 }),
      gateArch(1060, 520, 1.5, c.p.near),
      person(940, 520, 1.0, c.p.near, 'sit'),
      person(1180, 520, 1.0, c.p.near, 'sit'),
      robed(704, 528, 1.35, c.p.fore, 'stand'),
      scales(704, 420, 1.0, c.p.accent),
      ox(470, 532, 0.9, c.p.near),
      person(300, 532, 1.2, c.p.fore, 'point'),
      fg(c, 690, 14),
    ],
  },

  // 22: "Indien gij uws naasten kleed te pand neemt, zo zult gij het hem wedergeven, eer de zon ondergaat"
  'exodus-bijbelquiz-deel-22': {
    hue: 64,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 440, sunR: 70, rays: true, far: 'dunes', horizon: 480 }),
      houseBlock(c.rand, 300, 500, 0.8, c.p.near, { opacity: 0.85 }),
      person(600, 530, 1.4, c.p.fore, 'point'),
      cloak(684, 506, 0.75, c.p.accent),
      flipX(820, person(820, 530, 1.25, c.p.fore, 'sit')),
      person(440, 532, 1.05, c.p.near, 'stand'),
      person(480, 534, 0.7, c.p.near, 'stand'),
      fg(c, 690, 14),
    ],
  },

  // 23: three feasts a year - the firstfruits of your labours brought in; "Zie, Ik zend een Engel voor uw aangezicht"
  'exodus-bijbelquiz-deel-23': {
    hue: 66,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 240, far: 'ridge', horizon: 490 }),
      trail(704, H, 1080, 492, 90, '#FFFFFF', { opacity: 0.3 }),
      c.soft(1080, 420, 110, 0.5),
      angel(1080, 494, 0.65, c.p.light, { opacity: 0.85 }),
      vineRow(c.rand, 220, 520, 0.95, c.p.near, 3),
      sheaf(860, 534, 0.95, c.p.crop),
      sheaf(960, 538, 0.85, c.p.crop),
      person(620, 534, 1.35, c.p.fore, 'carry'),
      basket(620, 420, 0.95, c.p.accent),
      circle(600, 392, 12, c.p.accent),
      circle(626, 386, 13, c.p.accent),
      circle(648, 394, 11, c.p.accent),
      wheat(450, 556, 0.8, c.p.crop, 5),
      fg(c, 692, 14),
    ],
  },

  // 24: Moses builds an altar under the mountain and twelve pillars for the twelve tribes; the cloud covers the mount
  'exodus-bijbelquiz-deel-24': {
    hue: 68,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 170, far: 'none', horizon: 500 }),
      mountain(704, 510, 560, 300, mix(c.a.mid, c.a.near, 0.45)),
      cloudBank(c.rand, 704, 230, 2.4, c.p.light, { opacity: 0.85 }),
      c.soft(704, 210, 220, 0.5),
      ...Array.from({ length: 12 }, (_, i) => {
        const t = i / 11;
        const x = 330 + t * 750;
        const lift = Math.sin(Math.PI * t) * 34;
        return standingStone(x, 540 - lift, 0.55 - Math.sin(Math.PI * t) * 0.12, c.p.near);
      }),
      altar(704, 548, 1.05, c.p.near),
      fireBed(c.rand, 704, 474, 0.85, c.p.accent, 5),
      smokeColumn(c.rand, 704, 440, 1.1, c.p.light),
      fg(c, 700, 12),
    ],
  },

  // 25: "Zij zullen een ark maken van sittimhout" - the ark, the mercy seat and the two cherubim, their wings spread over it
  'exodus-bijbelquiz-deel-25': {
    hue: 70,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 220, far: 'none', ground: 'flat', horizon: 520 }),
      rect(150, 230, 1110, 290, mix(c.a.mid, c.a.figure, 0.18), { opacity: 0.55 }),
      ...[200, 1210].map((x) => rect(x - 14, 230, 28, 290, c.p.near)),
      rect(150, 222, 1110, 16, c.p.near),
      shafts(704, 100, 260, 300, c.p.glow, 5),
      c.soft(704, 300, 220, 0.6),
      arkOfCovenant(704, 524, 1.75, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 26: the tabernacle - the boards overlaid with gold, the curtains, and over them the covering of rams' skins dyed red
  'exodus-bijbelquiz-deel-26': {
    hue: 72,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'ridge', horizon: 490 }),
      nomadTent(220, 500, 0.45, c.p.mid),
      nomadTent(1250, 504, 0.5, c.p.mid),
      tabernacle(704, 526, 1.5, mix(c.a.near, c.a.figure, 0.5), c.p.accent, mix(c.a.near, c.a.figure, 0.25)),
      person(420, 532, 1.2, c.p.fore, 'carry'),
      rotate(-6, 420, 434, rect(330, 428, 180, 12, c.p.near, { rx: 3 })),
      person(1010, 534, 1.15, c.p.fore, 'stand'),
      fg(c, 692, 14),
    ],
  },

  // 27: the altar of burnt offering of shittim wood overlaid with brass, with its horns; the court hung with fine linen
  'exodus-bijbelquiz-deel-27': {
    hue: 74,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'dunes', horizon: 490 }),
      courtFence(150, 1260, 500, 70, c.p.near, c.p.light),
      smokeColumn(c.rand, 640, 340, 1.6, c.p.light),
      hornedAltar(640, 534, 1.35, c.p.near),
      fireBed(c.rand, 640, 400, 1.1, c.p.accent, 6),
      priest(900, 534, 1.25, c.p.fore, c.p.mid),
      ram(1100, 534, 0.7, c.p.near),
      fg(c, 692, 14),
    ],
  },

  // 28: the holy garments for Aaron - the ephod, the robe with bells and pomegranates, the breastplate with twelve stones
  'exodus-bijbelquiz-deel-28': {
    hue: 76,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 240, far: 'none', ground: 'flat', horizon: 520 }),
      rect(330, 220, 748, 300, mix(c.a.mid, c.a.figure, 0.16), { opacity: 0.5 }),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(330 + i * 150, 220, 6, 300, c.p.near, { opacity: 0.3 })),
      rect(320, 210, 768, 14, c.p.near),
      columns(230, 520, 1.3, c.p.near, 2),
      columns(1180, 520, 1.3, c.p.near, 2),
      c.soft(704, 330, 220, 0.5),
      priest(704, 532, 2.3, c.p.fore, c.p.accent),
      fg(c, 692, 12),
    ],
  },

  // 29: Moses takes the anointing oil and pours it on Aaron's head; the ram of consecration
  'exodus-bijbelquiz-deel-29': {
    hue: 78,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 300, far: 'ridge', horizon: 494 }),
      robed(510, 532, 1.45, c.p.fore, 'bless'),
      flipX(650, oilHorn(650, 398, 1.0, c.p.accent)),
      curve('M 650 400 C 654 410 656 420 656 434', 6, c.p.accent),
      circle(656, 446, 4, c.p.accent),
      flipX(670, person(670, 536, 1.25, c.p.fore, 'kneel')),
      person(840, 534, 1.15, c.p.near, 'stand'),
      person(920, 536, 1.1, c.p.near, 'stand'),
      ram(1100, 536, 0.75, c.p.near),
      fg(c, 692, 14),
    ],
  },

  // 30: the golden altar of incense before the veil, its sweet smoke rising; the bronze laver for washing
  'exodus-bijbelquiz-deel-30': {
    hue: 80,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 520 }),
      rect(380, 240, 650, 280, mix(c.a.mid, c.a.figure, 0.22), { opacity: 0.5 }),
      ...[0, 1, 2, 3, 4].map((i) => rect(380 + i * 130, 240, 6, 280, c.p.near, { opacity: 0.35 })),
      rect(370, 230, 670, 14, c.p.near),
      c.soft(704, 320, 220, 0.5),
      curve('M 704 380 C 670 330 740 300 700 250 C 670 210 720 180 700 140', 16, c.p.light, { opacity: 0.6 }),
      curve('M 712 380 C 750 340 690 300 740 260 C 770 230 740 190 760 160', 10, c.p.light, { opacity: 0.45 }),
      incenseAltar(704, 528, 1.45, c.p.accent),
      laver(1120, 532, 1.05, c.p.near, c.p.water),
      person(300, 534, 1.25, c.p.fore, 'kneel'),
      fg(c, 692, 12),
    ],
  },

  // 31: Bezalel, filled with the Spirit of God, works the gold; Oholiab weaves; the sabbath a sign for ever
  'exodus-bijbelquiz-deel-31': {
    hue: 82,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'dunes', horizon: 494 }),
      loom(1000, 528, 1.05, c.p.near, mix(c.a.mid, c.a.near, 0.4)),
      person(1000, 534, 0.95, c.p.fore, 'sit'),
      anvil(620, 532, 1.3, c.p.near),
      rect(590, 452, 80, 10, c.p.accent, { rx: 4 }),
      goblet(700, 532, 1.0, c.p.accent),
      c.soft(640, 450, 90, 0.5),
      person(500, 534, 1.35, c.p.fore, 'raise'),
      stroke(542, 344, 590, 300, 7, c.p.fore),
      rect(578, 286, 34, 20, c.p.fore, { rx: 3 }),
      fg(c, 692, 14),
    ],
  },

  // 32: the golden calf on its pedestal, the people dancing round it; Moses comes down the mountain with the tables
  'exodus-bijbelquiz-deel-32': {
    hue: 84,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 280, far: 'none', horizon: 500 }),
      path(`M 900 510 C 980 400 1100 300 1220 270 C 1300 254 1360 280 ${W + 40} 300 L ${W + 40} 520 Z`, mix(c.a.mid, c.a.near, 0.45)),
      c.veil(1000, W, c.p.fore, 0.4),
      person(1110, 360, 0.8, c.p.fore, 'raise'),
      tablets(1110, 236, 0.42, c.p.light),
      goldenCalf(600, 536, 1.25, c.p.accent, c.p.near),
      c.soft(600, 400, 160, 0.35, c.p.accent),
      person(360, 536, 1.2, c.p.fore, 'raise'),
      person(450, 540, 1.05, c.p.near, 'raise'),
      person(800, 538, 1.15, c.p.fore, 'raise'),
      person(900, 542, 1.0, c.p.near, 'walk'),
      person(250, 540, 0.95, c.p.near, 'bow'),
      fg(c, 694, 12),
    ],
  },

  // 33: the tent of meeting pitched outside the camp, the pillar of cloud at its door; every man worships at his tent door
  'exodus-bijbelquiz-deel-33': {
    hue: 86,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'ridge', horizon: 490 }),
      cloudPillar(c.rand, 900, 496, 140, 150, c.p.light, { opacity: 0.85 }),
      nomadTent(1000, 510, 0.95, c.p.accent),
      robed(860, 516, 1.15, c.p.fore, 'staff'),
      nomadTent(330, 540, 0.75, c.p.near),
      person(470, 540, 1.1, c.p.fore, 'bow'),
      nomadTent(200, 520, 0.5, c.p.mid),
      person(600, 538, 1.0, c.p.near, 'bow'),
      fg(c, 694, 12),
    ],
  },

  // 34: Moses comes down from Sinai with the two new tables in his hand, the skin of his face shining
  'exodus-bijbelquiz-deel-34': {
    hue: 88,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1000, sunY: 160, far: 'none', horizon: 506 }),
      path(`M 420 516 C 560 420 760 290 960 220 C 1080 180 1220 200 ${W + 40} 240 L ${W + 40} 520 Z`, mix(c.a.mid, c.a.near, 0.4)),
      trail(820, 520, 960, 240, 30, '#FFFFFF', { opacity: 0.35 }),
      c.soft(820, 290, 140, 0.6),
      radiance(820, 296, 76, c.p.light, 14),
      person(820, 446, 1.45, c.p.fore, 'carry'),
      tablets(820, 424, 0.76, c.p.accent),
      flipX(380, person(380, 534, 1.2, c.p.fore, 'bow')),
      person(280, 534, 1.1, c.p.near, 'stand'),
      person(200, 536, 1.0, c.p.near, 'stand', { opacity: 0.85 }),
      fg(c, 692, 14),
    ],
  },

  // 35: "Een iegelijk, die gewillig van harte is" - the people bring gold, linen, skins and wood for the work
  'exodus-bijbelquiz-deel-35': {
    hue: 90,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 330, far: 'ridge', horizon: 494 }),
      path('M 560 536 C 590 470 650 444 704 444 C 758 444 818 470 848 536 Z', c.p.accent),
      ...[
        [640, 470],
        [700, 456],
        [760, 474],
      ].map(([x, y]) => goblet(x, y, 0.6, mix(c.p.accent, '#FFFFFF', 0.25))),
      coin(600, 520, 0.8, mix(c.p.accent, '#FFFFFF', 0.3)),
      coin(810, 516, 0.8, mix(c.p.accent, '#FFFFFF', 0.3)),
      robed(990, 534, 1.35, c.p.fore, 'bless'),
      person(420, 534, 1.2, c.p.fore, 'carry'),
      jar(420, 434, 0.6, c.p.near),
      person(300, 536, 1.1, c.p.near, 'carry'),
      rect(250, 446, 100, 16, c.p.near, { rx: 6 }),
      person(190, 538, 1.0, c.p.near, 'walk'),
      fg(c, 692, 14),
    ],
  },

  // 36: the curtains of fine twined linen, blue, purple and scarlet, with cherubim of cunning work; more than enough brought
  'exodus-bijbelquiz-deel-36': {
    hue: 92,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 236, far: 'dunes', horizon: 494 }),
      rect(240, 290, 920, 8, c.p.near, { rx: 4 }),
      rect(250, 298, 7, 236, c.p.near),
      rect(1143, 298, 7, 236, c.p.near),
      ...[0, 1, 2, 3].map((i) => rect(300 + i * 205, 300, 195, 170, c.p.accent, { opacity: 0.92 - (i % 2) * 0.08 })),
      ...[0, 1, 2, 3].map((i) =>
        path(
          `M ${402 + i * 205} 420 C ${380 + i * 205} 380 ${352 + i * 205} 360 ${330 + i * 205} 350 C ${360 + i * 205} 340 ${390 + i * 205} 360 ${402 + i * 205} 380 C ${414 + i * 205} 360 ${444 + i * 205} 340 ${474 + i * 205} 350 C ${452 + i * 205} 360 ${424 + i * 205} 380 ${402 + i * 205} 420 Z`,
          '#FFFFFF',
          { opacity: 0.4 },
        ),
      ),
      person(420, 536, 1.2, c.p.fore, 'raise'),
      person(800, 536, 1.25, c.p.fore, 'point'),
      person(1000, 538, 1.1, c.p.near, 'carry'),
      fg(c, 692, 14),
    ],
  },

  // 37: Bezalel makes the candlestick of pure gold, six branches and seven lamps; the table and the incense altar beside it
  'exodus-bijbelquiz-deel-37': {
    hue: 94,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 524 }),
      rect(150, 240, 1110, 284, mix(c.a.mid, c.a.figure, 0.16), { opacity: 0.5 }),
      rect(150, 230, 1110, 14, c.p.near),
      c.soft(704, 320, 260, 0.6),
      showbreadTable(320, 530, 1.1, c.p.near, c.p.mid),
      incenseAltar(1090, 530, 1.0, c.p.near),
      menorah(704, 532, 1.6, c.p.accent, c.p.light),
      fg(c, 694, 12),
    ],
  },

  // 38: the laver of brass made of the looking-glasses of the women; the altar of burnt offering; the court
  'exodus-bijbelquiz-deel-38': {
    hue: 96,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 236, far: 'dunes', horizon: 494 }),
      courtFence(150, 1260, 504, 66, c.p.near, c.p.light),
      hornedAltar(1080, 532, 0.95, c.p.near),
      laver(704, 534, 1.5, c.p.accent, mix(c.p.water, '#FFFFFF', 0.3)),
      person(480, 536, 1.25, c.p.fore, 'point'),
      circle(554, 432, 15, c.p.light),
      circle(554, 432, 10, mix(c.p.light, c.a.near, 0.3)),
      person(360, 538, 1.15, c.p.near, 'carry'),
      circle(360, 420, 14, c.p.light),
      person(250, 540, 1.05, c.p.near, 'stand'),
      fg(c, 692, 14),
    ],
  },

  // 39: the holy garments finished and all the work brought to Moses; he sees it is done as commanded, and blesses them
  'exodus-bijbelquiz-deel-39': {
    hue: 98,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 290, far: 'ridge', horizon: 494 }),
      rect(704, 340, 6, 194, c.p.near),
      rect(620, 340, 174, 8, c.p.near, { rx: 4 }),
      coat(707, 516, 0.95, c.p.accent, mix(c.p.accent, '#FFFFFF', 0.45)),
      rect(686, 384, 42, 46, mix(c.p.accent, c.a.figure, 0.3), { rx: 5 }),
      robed(400, 532, 1.4, c.p.fore, 'raise'),
      person(940, 534, 1.2, c.p.fore, 'carry'),
      jar(940, 438, 0.5, c.p.near),
      person(1060, 536, 1.1, c.p.near, 'carry'),
      menorah(1180, 540, 0.45, c.p.near),
      fg(c, 692, 14),
    ],
  },

  // 40: the tabernacle reared up; the cloud covers the tent and the glory of the LORD fills it, fire in the cloud by night
  'exodus-bijbelquiz-deel-40': {
    hue: 100,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 494 }),
      cloudPillar(c.rand, 704, 380, 120, 230, c.p.light, { opacity: 0.8 }),
      c.soft(704, 260, 220, 0.6, c.p.accent),
      firePillar(704, 380, 200, 90, c.p.accent, c.p.glow, { opacity: 0.9 }),
      courtFence(330, 1080, 520, 56, c.p.near, c.p.light, { opacity: 0.9 }),
      tabernacle(704, 506, 1.25, mix(c.a.near, c.a.figure, 0.5), mix(c.a.near, c.a.figure, 0.3), mix(c.a.near, c.a.figure, 0.15)),
      nomadTent(220, 540, 0.55, c.p.near),
      nomadTent(1200, 544, 0.6, c.p.near),
      person(330, 546, 1.0, c.p.fore, 'bow'),
      person(1080, 548, 1.0, c.p.fore, 'bow'),
      fg(c, 700, 12),
    ],
  },
};
