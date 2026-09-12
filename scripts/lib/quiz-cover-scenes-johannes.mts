/**
 * Covers for the Johannes series, one scene per quiz part.
 *
 * Base hue 20, drifting two degrees per part (part 29 lands on 76).
 * See `quiz-cover-scenes.mts` for the house style and the core set this
 * module is merged into. Each scene is the one event of its chapter the
 * questions actually ask about; chapters that span two parts get two
 * different events.
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  angel,
  basket,
  boat,
  brickWall,
  circle,
  cityWall,
  citySkyline,
  cloudBank,
  columns,
  cross,
  crowd,
  cypress,
  donkey,
  dove,
  dunes,
  ellipse,
  fireBed,
  fish,
  flame,
  gateArch,
  goblet,
  grapes,
  houseBlock,
  lamp,
  loaf,
  palm,
  path,
  person,
  ram,
  rays,
  rect,
  reeds,
  roundStone,
  scroll,
  shafts,
  shrub,
  templeFront,
  tent,
  tombMound,
  trail,
  tree,
  tri,
  vineRow,
  water,
  well,
  wheat,
} from './quiz-cover-primitives.mjs';

/** A stone water jar standing on `y` - the Cana jars, the woman's pitcher. */
function jar(x: number, y: number, s: number, fill: string): string {
  return (
    path(
      `M ${x - 22 * s} ${y} Q ${x - 40 * s} ${y - 40 * s} ${x - 18 * s} ${y - 74 * s}` +
        ` L ${x + 18 * s} ${y - 74 * s} Q ${x + 40 * s} ${y - 40 * s} ${x + 22 * s} ${y} Z`,
      fill,
    ) + rect(x - 22 * s, y - 84 * s, 44 * s, 11 * s, fill, { rx: 3 * s })
  );
}

/** A tall torch: pole with a flame on top, for the arrest party. */
function torch(x: number, y: number, s: number, pole: string, fire: string): string {
  return rect(x - 3 * s, y - 120 * s, 6 * s, 120 * s, pole) + flame(x, y - 116 * s, s * 0.5, fire);
}

/** A shallow basin on the floor - the foot washing. */
function basin(x: number, y: number, s: number, fill: string, waterFill: string): string {
  return (
    path(`M ${x - 46 * s} ${y - 22 * s} L ${x + 46 * s} ${y - 22 * s} L ${x + 36 * s} ${y} L ${x - 36 * s} ${y} Z`, fill) +
    ellipse(x, y - 22 * s, 46 * s, 9 * s, fill) +
    ellipse(x, y - 22 * s, 36 * s, 6 * s, waterFill)
  );
}

/** A fishing net bulging with fish, hanging from a point. */
function net(x: number, y: number, s: number, meshFill: string, fishFill: string): string {
  const out = [
    path(
      `M ${x} ${y - 110 * s} C ${x - 90 * s} ${y - 60 * s} ${x - 96 * s} ${y + 6 * s} ${x} ${y + 10 * s}` +
        ` C ${x + 96 * s} ${y + 6 * s} ${x + 90 * s} ${y - 60 * s} ${x} ${y - 110 * s} Z`,
      meshFill,
      { opacity: 0.8 },
    ),
  ];
  const spots = [
    [-30, -50],
    [26, -40],
    [-8, -18],
    [36, -8],
    [-40, -4],
    [4, 4],
  ];
  for (const [dx, dy] of spots) {
    out.push(ellipse(x + dx * s, y + dy * s, 16 * s, 8 * s, fishFill, { opacity: 0.85 }));
  }
  return out.join('');
}

export const JOHANNES_SCENES: Record<string, Scene> = {
  // 1: John the Baptist, the voice in the wilderness, questioned at the Jordan
  'johannes-bijbelquiz-deel-1': {
    hue: 20,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1040, sunY: 232, sunR: 84, rays: true, far: 'dunes', ground: 'water', horizon: 470 }),
      dunes(c.rand, 512, 18, c.p.mid),
      person(560, 520, 1.35, c.p.fore, 'raise'),
      crowd(c.rand, 930, 522, 0.85, c.p.near, 4, 220),
      reeds(c.rand, 230, 526, 1.1, c.p.fore, 8),
      fg(c, 690, 12),
    ],
  },

  // 2: "Behold the Lamb of God" - John points, the dove descends, two disciples follow Jesus
  'johannes-bijbelquiz-deel-2': {
    hue: 22,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'ridge' }),
      trail(400, H, 1100, G, 120, c.p.mid, { opacity: 0.45 }),
      person(420, G + 8, 1.3, c.p.fore, 'point'),
      person(760, G + 4, 1.25, c.p.near, 'walk'),
      person(900, G + 8, 1.05, c.p.near, 'walk'),
      person(1000, G + 12, 0.95, c.p.near, 'walk'),
      dove(760, 250, 1.3, c.p.light, { opacity: 0.9 }),
      shafts(760, 70, 160, 170, c.p.glow, 3),
      fg(c, 676, 20),
    ],
  },

  // 3: The wedding at Cana - six stone jars filled with water
  'johannes-bijbelquiz-deel-3': {
    hue: 24,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 236, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      houseBlock(c.rand, 240, 512, 0.9, c.p.near, { opacity: 0.85 }),
      jar(560, 512, 1.0, c.p.accent),
      jar(640, 512, 1.0, c.p.accent),
      jar(720, 512, 1.0, c.p.accent),
      jar(800, 512, 1.0, c.p.accent),
      jar(880, 512, 1.0, c.p.accent),
      jar(960, 512, 1.0, c.p.accent),
      person(440, 512, 1.25, c.p.fore, 'point'),
      person(1090, 512, 1.15, c.p.fore, 'carry'),
      goblet(1170, 512, 0.9, c.p.accentDeep),
      fg(c, 686, 14),
    ],
  },

  // 4: Nicodemus comes to Jesus by night
  'johannes-bijbelquiz-deel-4': {
    hue: 26,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1080, sunY: 226, sunR: 60, far: 'none', ground: 'flat', horizon: 512, stars: 70 }),
      citySkyline(c.rand, 300, 512, 0.9, c.p.near, 5, { opacity: 0.8 }),
      c.soft(700, 470, 150, 0.28),
      lamp(700, 486, 1.4, c.p.near, c.p.accent),
      person(580, 512, 1.25, c.p.fore, 'sit'),
      person(830, 512, 1.25, c.p.fore, 'sit'),
      fg(c, 686, 14),
    ],
  },

  // 5: Jesus and the Samaritan woman at Jacob's well
  'johannes-bijbelquiz-deel-5': {
    hue: 28,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 238, far: 'dunes' }),
      tree(1120, G + 4, 1.3, c.p.near),
      well(700, G + 10, 1.25, c.p.near),
      person(560, G + 12, 1.2, c.p.fore, 'sit'),
      person(860, G + 8, 1.3, c.p.fore, 'carry'),
      jar(925, G - 90, 0.45, c.p.accent),
      fg(c, 674, 20),
    ],
  },

  // 6: "The fields are white for harvest" - the Samaritans come out to Jesus
  'johannes-bijbelquiz-deel-6': {
    hue: 30,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 244, rays: true, far: 'dunes', horizon: 474 }),
      citySkyline(c.rand, 1080, 474, 0.85, c.p.far, 6, { opacity: 0.6 }),
      person(420, 484, 1.35, c.p.fore, 'point'),
      crowd(c.rand, 940, 486, 0.85, c.p.near, 6, 300),
      wheat(230, 500, 1.1, c.p.crop, 6),
      wheat(640, 504, 0.9, c.p.crop, 5),
      fg(c, 674, 20),
    ],
  },

  // 7: Bethesda - the man takes up his mat and walks
  'johannes-bijbelquiz-deel-7': {
    hue: 32,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 240, far: 'none', ground: 'flat', horizon: 512 }),
      columns(300, 512, 1.0, c.p.near, 3),
      columns(1130, 512, 1.0, c.p.near, 3),
      rect(500, 486, 420, 26, c.p.near),
      rect(524, 494, 372, 18, c.p.water),
      person(600, 486, 1.25, c.p.fore, 'point'),
      person(820, 486, 1.25, c.p.fore, 'carry'),
      rect(778, 356, 84, 14, c.p.accent, { rx: 6 }),
      fg(c, 686, 14),
    ],
  },

  // 8: "The Scriptures testify of me" - Jesus teaching, John the burning lamp
  'johannes-bijbelquiz-deel-8': {
    hue: 34,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 280, sunY: 246, far: 'none', ground: 'flat', horizon: 514 }),
      templeFront(1000, 514, 1.05, c.p.near, 6),
      person(440, 514, 1.35, c.p.fore, 'point'),
      rect(600, 470, 200, 44, c.p.near),
      scroll(700, 448, 0.8, c.p.accent),
      lamp(560, 476, 1.1, c.p.fore, c.p.accent),
      crowd(c.rand, 1240, 516, 0.7, c.p.fore, 3, 120),
      fg(c, 686, 14),
    ],
  },

  // 9: Five loaves and two fish on the hillside
  'johannes-bijbelquiz-deel-9': {
    hue: 36,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 238, far: 'ridge', ground: 'water', horizon: 448 }),
      dunes(c.rand, 496, 24, c.p.mid),
      person(480, 506, 1.35, c.p.fore, 'raise'),
      person(620, 508, 0.85, c.p.near, 'carry'),
      basket(660, 508, 0.9, c.p.accent),
      loaf(720, 506, 0.9, c.p.accent),
      fish(800, 496, 0.5, c.p.accentDeep),
      crowd(c.rand, 1040, 508, 0.8, c.p.near, 8, 380),
      fg(c, 678, 18),
    ],
  },

  // 10: Many disciples turn back; the twelve stay ("to whom shall we go?")
  'johannes-bijbelquiz-deel-10': {
    hue: 38,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, far: 'ridge' }),
      trail(300, H, 1200, G, 130, c.p.mid, { opacity: 0.45 }),
      person(560, G + 6, 1.35, c.p.fore, 'stand'),
      person(440, G + 10, 1.05, c.p.fore, 'raise'),
      person(660, G + 12, 1.0, c.p.fore, 'stand'),
      person(1000, G + 6, 0.95, c.p.near, 'walk', { opacity: 0.85 }),
      person(1090, G + 4, 0.85, c.p.near, 'walk', { opacity: 0.75 }),
      person(1170, G + 2, 0.75, c.p.near, 'walk', { opacity: 0.65 }),
      fg(c, 676, 20),
    ],
  },

  // 11: The Feast of Tabernacles - booths outside Jerusalem, Jesus arriving quietly
  'johannes-bijbelquiz-deel-11': {
    hue: 40,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 240, far: 'dunes', horizon: 476 }),
      cityWall(1090, 476, 0.8, c.p.far, 340, { opacity: 0.6 }),
      tent(560, 484, 1.1, c.p.near),
      tent(760, 486, 0.9, c.p.near),
      palm(900, 486, 1.0, c.p.near),
      palm(380, 488, 0.85, c.p.near),
      person(1000, 488, 1.15, c.p.fore, 'walk'),
      crowd(c.rand, 1180, 490, 0.75, c.p.near, 4, 180),
      fg(c, 674, 20),
    ],
  },

  // 12: "If anyone thirsts, let him come to me" - the last day of the feast
  'johannes-bijbelquiz-deel-12': {
    hue: 42,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 232, sunR: 80, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      templeFront(704, 512, 1.15, c.p.near, 7),
      rect(0, 496, W, 16, c.p.near, { opacity: 0.9 }),
      person(704, 496, 1.4, c.p.fore, 'raise'),
      crowd(c.rand, 380, 514, 0.85, c.p.near, 5, 260),
      crowd(c.rand, 1030, 514, 0.85, c.p.near, 5, 260),
      fg(c, 686, 14),
    ],
  },

  // 13: The woman caught in adultery - Jesus writes on the ground, the accusers leave
  'johannes-bijbelquiz-deel-13': {
    hue: 44,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1090, sunY: 236, far: 'none', ground: 'flat', horizon: 514 }),
      columns(230, 514, 1.0, c.p.near, 3),
      person(620, 514, 1.25, c.p.fore, 'kneel'),
      person(760, 514, 1.3, c.p.fore, 'bow'),
      circle(520, 506, 11, c.p.near),
      circle(548, 509, 8, c.p.near),
      person(1010, 514, 1.0, c.p.near, 'walk', { opacity: 0.8 }),
      person(1100, 514, 0.9, c.p.near, 'walk', { opacity: 0.7 }),
      person(1180, 514, 0.8, c.p.near, 'walk', { opacity: 0.6 }),
      fg(c, 686, 14),
    ],
  },

  // 14: "Before Abraham was, I am" - they take up stones, Jesus walks out of the temple
  'johannes-bijbelquiz-deel-14': {
    hue: 46,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 280, sunY: 240, clouds: 3, far: 'none', ground: 'flat', horizon: 514 }),
      templeFront(1120, 514, 0.95, c.p.near, 5),
      crowd(c.rand, 800, 516, 1.0, c.p.fore, 6, 280),
      circle(600, 506, 12, c.p.near),
      circle(650, 508, 9, c.p.near),
      person(380, 514, 1.35, c.p.fore, 'walk'),
      fg(c, 686, 14),
    ],
  },

  // 15: The man born blind washes in the pool of Siloam
  'johannes-bijbelquiz-deel-15': {
    hue: 48,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 238, far: 'none', ground: 'flat', horizon: 508 }),
      brickWall(c.rand, 960, 508, 1.3, c.p.near, 4, 8),
      rect(360, 498, 480, 40, c.p.near),
      rect(380, 506, 440, 32, c.p.water),
      person(520, 498, 1.15, c.p.fore, 'kneel'),
      person(700, 498, 1.3, c.p.fore, 'point'),
      fg(c, 690, 12),
    ],
  },

  // 16: The Good Shepherd at the door of the sheepfold
  'johannes-bijbelquiz-deel-16': {
    hue: 50,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 244, far: 'dunes', horizon: 474 }),
      brickWall(c.rand, 740, 478, 1.4, c.p.near, 3, 7),
      brickWall(c.rand, 1180, 478, 1.4, c.p.near, 3, 5),
      person(1110, 480, 1.35, c.p.fore, 'stand'),
      rect(1066, 340, 6, 140, c.p.fore, { rx: 3 }),
      ram(520, 484, 0.55, c.p.near),
      ram(660, 490, 0.5, c.p.near),
      ram(800, 486, 0.55, c.p.near),
      ram(940, 490, 0.5, c.p.near),
      fg(c, 674, 20),
    ],
  },

  // 17: Martha meets Jesus on the road outside Bethany
  'johannes-bijbelquiz-deel-17': {
    hue: 52,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 246, far: 'ridge' }),
      houseBlock(c.rand, 1120, G + 2, 0.8, c.p.near, { opacity: 0.85 }),
      cypress(1000, G + 4, 0.9, c.p.near),
      trail(360, H, 1000, G, 120, c.p.mid, { opacity: 0.45 }),
      person(580, G + 8, 1.35, c.p.fore, 'stand'),
      person(720, G + 8, 1.2, c.p.fore, 'kneel'),
      crowd(c.rand, 380, G + 12, 0.8, c.p.near, 3, 150),
      fg(c, 676, 20),
    ],
  },

  // 18: Lazarus walks out of the tomb
  'johannes-bijbelquiz-deel-18': {
    hue: 54,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 280, sunY: 238, rays: true, far: 'ridge' }),
      tombMound(940, G, 1.1, c.p.near, c.p.fore),
      roundStone(1160, G, 0.95, c.p.near),
      person(940, G + 6, 1.15, c.p.light, 'stand', { opacity: 0.95 }),
      person(600, G + 8, 1.35, c.p.fore, 'raise'),
      person(470, G + 12, 1.05, c.p.near, 'kneel'),
      crowd(c.rand, 320, G + 14, 0.8, c.p.near, 3, 130),
      fg(c, 676, 20),
    ],
  },

  // 19: The entry into Jerusalem with palm branches
  'johannes-bijbelquiz-deel-19': {
    hue: 56,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 246, rays: true, far: 'dunes', horizon: 476 }),
      gateArch(1120, 476, 1.0, c.p.near),
      cityWall(1320, 476, 0.7, c.p.far, 200, { opacity: 0.6 }),
      donkey(640, 484, 1.2, c.p.near),
      person(620, 432, 0.85, c.p.fore, 'stand'),
      crowd(c.rand, 900, 486, 0.75, c.p.near, 5, 220),
      palm(380, 484, 1.0, c.p.near),
      palm(470, 488, 0.7, c.p.near),
      fg(c, 674, 20),
    ],
  },

  // 20: "Father, glorify your name" - the voice from heaven over the crowd
  'johannes-bijbelquiz-deel-20': {
    hue: 58,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 200, sunR: 120, clouds: 4, far: 'ridge' }),
      shafts(704, 80, 380, 330, c.p.glow, 5),
      person(704, G + 4, 1.4, c.p.fore, 'raise'),
      crowd(c.rand, 400, G + 12, 0.85, c.p.near, 5, 260),
      crowd(c.rand, 1010, G + 12, 0.85, c.p.near, 5, 260),
      wheat(230, G + 32, 0.9, c.p.crop, 4),
      fg(c, 676, 20),
    ],
  },

  // 21: Jesus washes the disciples' feet
  'johannes-bijbelquiz-deel-21': {
    hue: 60,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', stars: 50, far: 'none', ground: 'flat', horizon: 520 }),
      rect(820, 436, 400, 16, c.p.near),
      rect(846, 452, 12, 68, c.p.near),
      rect(1182, 452, 12, 68, c.p.near),
      goblet(920, 436, 0.9, c.p.accent),
      loaf(1040, 436, 0.9, c.p.accent),
      c.soft(330, 430, 170, 0.26),
      lamp(330, 452, 1.4, c.p.near, c.p.accent),
      person(560, 520, 1.25, c.p.fore, 'sit'),
      person(720, 520, 1.2, c.p.fore, 'kneel'),
      basin(628, 522, 0.85, c.p.near, c.p.water),
      fg(c, 688, 12),
    ],
  },

  // 22: "I am the way" - the road to the Father's house
  'johannes-bijbelquiz-deel-22': {
    hue: 62,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 222, sunR: 90, rays: true, far: 'ridge' }),
      citySkyline(c.rand, 980, G - 4, 0.9, c.p.far, 6, { opacity: 0.6 }),
      trail(420, H, 1000, G, 150, c.p.mid, { opacity: 0.55 }),
      person(480, G + 10, 1.35, c.p.fore, 'point'),
      person(340, G + 14, 1.0, c.p.near, 'stand'),
      person(400, G + 20, 0.9, c.p.near, 'stand'),
      fg(c, 676, 20),
    ],
  },

  // 23: The true vine - the vinedresser among the vines
  'johannes-bijbelquiz-deel-23': {
    hue: 64,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1070, sunY: 244, far: 'dunes', horizon: 474 }),
      vineRow(c.rand, 240, 480, 1.3, c.p.near, 5),
      vineRow(c.rand, 760, 484, 1.3, c.p.near, 5),
      grapes(700, 400, 1.2, c.p.accent),
      person(620, 486, 1.3, c.p.fore, 'point'),
      tree(1220, 480, 1.0, c.p.near),
      fg(c, 674, 20),
    ],
  },

  // 24: "Your sorrow will turn to joy" - the disciples grieving as dawn breaks
  'johannes-bijbelquiz-deel-24': {
    hue: 66,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 246, sunR: 92, rays: true, far: 'ridge' }),
      person(560, G + 6, 1.35, c.p.fore, 'raise'),
      person(400, G + 10, 1.05, c.p.near, 'bow'),
      person(700, G + 12, 1.05, c.p.near, 'kneel'),
      person(320, G + 14, 0.95, c.p.near, 'sit'),
      dove(880, 320, 1.1, c.p.light, { opacity: 0.85 }),
      fg(c, 676, 20),
    ],
  },

  // 25: The high-priestly prayer - Jesus lifts his eyes to heaven
  'johannes-bijbelquiz-deel-25': {
    hue: 68,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, sunR: 140, far: 'ridge', stars: 50 }),
      c.soft(704, 280, 220, 0.24),
      rays(c.rand, 704, 300, 260, c.p.glow, 12, { opacity: 0.11 }),
      person(704, G, 1.45, c.p.fore, 'raise'),
      crowd(c.rand, 380, G + 12, 0.8, c.p.near, 4, 200),
      crowd(c.rand, 1030, G + 12, 0.8, c.p.near, 4, 200),
      fg(c, 678, 18),
    ],
  },

  // 26: The arrest in the garden - torches, and the band falling to the ground
  'johannes-bijbelquiz-deel-26': {
    hue: 70,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 260, sunY: 230, sunR: 58, far: 'ridge', stars: 60 }),
      tree(1180, G + 4, 1.2, c.p.near),
      tree(1300, G + 10, 0.9, c.p.near),
      c.soft(980, 360, 180, 0.22),
      torch(900, G + 6, 1.0, c.p.near, c.p.accent),
      torch(1010, G + 8, 1.0, c.p.near, c.p.accent),
      torch(1090, G + 4, 0.9, c.p.near, c.p.accent),
      person(560, G + 6, 1.35, c.p.fore, 'stand'),
      person(780, G + 14, 1.1, c.p.fore, 'fallen'),
      person(940, G + 16, 1.0, c.p.fore, 'fallen'),
      person(1060, G + 10, 1.0, c.p.near, 'stand'),
      fg(c, 676, 20),
    ],
  },

  // 27: The crucifixion - Mary and the beloved disciple at the foot of the cross
  'johannes-bijbelquiz-deel-27': {
    hue: 72,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 5, far: 'ridge' }),
      rect(0, 0, W, H, c.p.fore, { opacity: 0.28 }),
      cross(704, G, 1.25, c.p.fore),
      cross(500, G + 14, 0.75, c.p.near, { opacity: 0.75 }),
      cross(910, G + 14, 0.75, c.p.near, { opacity: 0.75 }),
      person(630, G + 10, 1.05, c.p.fore, 'bow'),
      person(790, G + 10, 1.0, c.p.fore, 'stand'),
      person(1120, G + 8, 1.0, c.p.near, 'stand'),
      rect(1146, G - 190, 5, 200, c.p.near),
      fg(c, 676, 20),
    ],
  },

  // 28: The empty tomb - Mary Magdalene turns and sees the risen Jesus
  'johannes-bijbelquiz-deel-28': {
    hue: 74,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 236, sunR: 90, rays: true, far: 'ridge' }),
      tombMound(400, G, 1.05, c.p.near, c.p.light),
      angel(400, G + 2, 0.7, c.p.fore, { opacity: 0.8 }),
      roundStone(200, G, 0.95, c.p.near),
      person(640, G + 10, 1.15, c.p.fore, 'kneel'),
      person(820, G + 6, 1.35, c.p.fore, 'stand'),
      tree(1160, G + 6, 1.1, c.p.near),
      fg(c, 676, 20),
    ],
  },

  // 29: The net full of fish and the fire on the beach at Tiberias
  'johannes-bijbelquiz-deel-29': {
    hue: 76,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1060, sunY: 240, sunR: 84, rays: true, far: 'dunes', ground: 'water', horizon: 440 }),
      boat(940, 468, 1.3, c.p.near, false),
      person(910, 456, 0.9, c.p.fore, 'stand'),
      person(980, 456, 0.85, c.p.fore, 'raise'),
      dunes(c.rand, 520, 22, c.p.mid),
      net(720, 500, 1.0, c.p.near, c.p.accent),
      person(620, 528, 1.2, c.p.fore, 'carry'),
      person(360, 526, 1.3, c.p.fore, 'stand'),
      fireBed(c.rand, 470, 528, 1.0, c.p.accent, 5),
      fish(520, 520, 0.4, c.p.accentDeep),
      fg(c, 690, 12),
    ],
  },
};
