/**
 * Option A - "Licht landschap".
 *
 * The approved 2.0 look (src/lib/quiz-scenes.json: pale sky, two soft hills,
 * a white sun, one dark silhouette and a gold accent), taken further: four to
 * five depth layers with atmospheric perspective, a haze over the horizon,
 * detailed silhouettes and exactly one accent colour on the object the
 * chapter is about. One palette per book group, all from the 2.0 scenes.
 */

import {
  H,
  W,
  ark,
  at,
  band,
  basket,
  birds,
  box,
  bushClump,
  bun,
  bushFlames,
  bushFlamesFront,
  circ,
  city,
  column,
  cypress,
  figure,
  fishShape,
  grass,
  heart,
  hills,
  house,
  kneeler,
  line,
  mix,
  mountain,
  olive,
  p,
  palm,
  rng,
  sandals,
  sapling,
  seatedCrowd,
  seraph,
  sheaf,
  sheep,
  smoke,
  star4,
  sun,
  temple,
  throne,
  tongsCoal,
  wheatStalk,
} from './shapes.mjs';
import type { Group, Sample } from './samples.mjs';

/** The whole scene sits this much higher so the subject stays inside the quiz page's 240px hero crop. */
const LIFT = -34;

type Pal = { skyTop: string; skyLow: string; far: string; mid: string; near: string; ground: string; fore: string; figure: string; accent: string; accent2: string; sun: string };

/** Lifted from the four 2.0 scene palettes, plus a stone one for the letters. */
export const PALETTES: Record<Group, Pal> = {
  evangelien: { skyTop: '#D2DDF0', skyLow: '#F0F3F9', far: '#C9D5EB', mid: '#B4C4E0', near: '#9DB0D4', ground: '#8EA3CB', fore: '#7489B5', figure: '#2E3B57', accent: '#E9B12E', accent2: '#F6E2A6', sun: '#FFFFFF' },
  wet: { skyTop: '#F5E4BA', skyLow: '#FCF5E4', far: '#F0DDAE', mid: '#E8CF98', near: '#DDBE7E', ground: '#D3B26E', fore: '#C29D57', figure: '#5A4320', accent: '#D9734F', accent2: '#E9B12E', sun: '#FFFFFF' },
  poezie: { skyTop: '#D9E6DB', skyLow: '#F1F5F0', far: '#C8D9CC', mid: '#B3CBB9', near: '#9DBBA3', ground: '#8CAE93', fore: '#73977B', figure: '#2E5A3E', accent: '#E9B12E', accent2: '#F2D98F', sun: '#FFFFFF' },
  profeten: { skyTop: '#F3D8CB', skyLow: '#FBF0EA', far: '#EECDBE', mid: '#E6BBA7', near: '#D9A48B', ground: '#CF9479', fore: '#BD7C60', figure: '#6E3420', accent: '#E9B12E', accent2: '#F6DE9C', sun: '#FFFFFF' },
  brieven: { skyTop: '#E2DED5', skyLow: '#F6F4EF', far: '#D9D3C7', mid: '#CBC3B3', near: '#BAAF9C', ground: '#AEA28C', fore: '#998C74', figure: '#263E69', accent: '#E9B12E', accent2: '#F3DC9E', sun: '#FFFFFF' },
  thema: { skyTop: '#D9E2F1', skyLow: '#F6F1E4', far: '#CCD6EA', mid: '#B9C7E2', near: '#A3B5D7', ground: '#93A7CE', fore: '#7C92BD', figure: '#2E3B57', accent: '#E9B12E', accent2: '#F6E2A6', sun: '#FFFFFF' },
};

type Ctx = { defs: string[]; id: (s: string) => string; rand: () => number; pal: Pal };

function ctx(sample: Sample): Ctx {
  let i = 0;
  return { defs: [], id: (s) => `${s}${(i += 1)}`, rand: rng(`a:${sample.slug}`), pal: PALETTES[sample.group] };
}

function vgrad(c: Ctx, top: string, bottom: string, a = 0, b = 1): string {
  const id = c.id('g');
  c.defs.push(`<linearGradient id="${id}" x1="0" y1="${a}" x2="0" y2="${b}"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`);
  return `url(#${id})`;
}

function glow(c: Ctx, x: number, y: number, r: number, color: string, opacity: number): string {
  const id = c.id('r');
  c.defs.push(
    `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="0.5" stop-color="${color}" stop-opacity="${opacity * 0.4}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
  );
  return circ(x, y, r, `url(#${id})`);
}

/** Sky, sun and a haze line: the part every scene shares. */
function sky(c: Ctx, sunX: number, sunY: number, sunR = 54): string {
  return (
    box(0, 0, W, H, vgrad(c, c.pal.skyTop, c.pal.skyLow, 0, 0.75)) +
    glow(c, sunX, sunY, sunR * 4, '#FFFFFF', 0.55) +
    at(sunX, sunY, 1, sun(sunR, c.pal.sun, '#FFFFFF', 0.22))
  );
}

function haze(c: Ctx, y: number, h = 120): string {
  const id = c.id('h');
  c.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.6" stop-color="#FFFFFF" stop-opacity="0.32"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>`);
  return box(0, y - h, W, h * 1.4, `url(#${id})`);
}

/** A darker foreground swell near the bottom edge: depth, and no empty band under the scene. */
function foot(c: Ctx, color: string): string {
  return band([[0, 706], [380, 694], [900, 716], [1408, 700]], layer(c, color)) + grass(c.rand, 0, W, 712, mix(color, c.pal.figure, 0.3), 120, 20);
}

/** A layer with a gentle top-to-bottom shade, so flat bands read as ground. */
function layer(c: Ctx, color: string): string {
  return vgrad(c, mix(color, '#FFFFFF', 0.1), mix(color, '#000000', 0.04));
}

const SCENES: Record<string, (c: Ctx) => string[]> = {
  // Exodus 3 - the bush that burns and is not consumed, Moses with his sandals off, the flock at Horeb.
  'exodus-bijbelquiz-deel-3': (c) => {
    const P = c.pal;
    return [
      sky(c, 1110, 196, 50),
      at(300, 470, 1, mountain(300, 150, P.far)),
      at(900, 476, 1, mountain(420, 270, layer(c, P.mid))),
      haze(c, 470),
      band([[0, 476], [400, 468], [900, 486], [1408, 470]], layer(c, P.near)),
      band([[0, 560], [500, 548], [1000, 566], [1408, 552]], layer(c, P.ground)),
      at(1010, 560, 0.62, sheep(mix(P.near, '#FFFFFF', 0.3), P.figure), { flip: true }),
      at(1100, 566, 0.7, sheep(mix(P.near, '#FFFFFF', 0.3), P.figure), { flip: true }),
      at(1190, 556, 0.56, sheep(mix(P.near, '#FFFFFF', 0.3), P.figure), { flip: true }),
      glow(c, 700, 430, 260, '#FFF3D6', 0.95),
      at(700, 598, 1.12, bushFlames(P.accent, P.accent2, '#FFF6DE')),
      at(700, 598, 1.12, bushClump(P.figure, undefined, c.rand)),
      at(700, 598, 1.12, bushFlamesFront(P.accent, P.accent2)),
      at(400, 608, 1.22, figure(P.figure, 'shield')),
      line('M 312 612 L 352 362', P.figure, 8),
      at(500, 612, 1.8, sandals(P.figure)),
      band([[0, 612], [500, 600], [1000, 620], [1408, 604]], layer(c, P.fore)),
      grass(c.rand, 0, W, 612, mix(P.fore, P.figure, 0.25)),
      foot(c, mix(P.fore, P.figure, 0.12)),
    ];
  },

  // Johannes 6 - the five loaves and two fish on the hillside by the sea of Galilee.
  'johannes-bijbelquiz-deel-6': (c) => {
    const P = c.pal;
    return [
      sky(c, 1090, 188, 50),
      hills(c.rand, 420, 40, P.far, 3),
      box(0, 436, W, 60, mix(P.far, '#FFFFFF', 0.35)),
      line('M 120 458 L 300 458 M 860 470 L 1080 470 M 520 482 L 640 482', '#FFFFFF', 4, 'opacity="0.7"'),
      haze(c, 450, 80),
      band([[0, 470], [300, 486], [700, 520], [1100, 500], [1408, 486]], layer(c, P.mid)),
      seatedCrowd(c.rand, 800, 1440, 512, 596, 3, mix(P.fore, P.near, 0.3), mix(P.mid, P.fore, 0.35), 0.34, 0.56),
      band([[0, 600], [400, 590], [900, 612], [1408, 600]], layer(c, P.near)),
      at(420, 612, 1.18, figure(P.figure, 'bless')),
      at(552, 612, 0.72, figure(P.figure, 'stand', { hood: false })),
      at(652, 548, 0.85, bun('#F7E4AE', P.accent)),
      at(756, 548, 0.85, bun('#F7E4AE', P.accent)),
      at(704, 540, 0.9, bun('#F7E4AE', P.accent)),
      at(676, 514, 0.78, bun('#F7E4AE', P.accent)),
      at(732, 512, 0.78, bun('#F7E4AE', P.accent)),
      at(672, 482, 0.72, fishShape('#FFFFFF', P.figure), { rot: 8 }),
      at(740, 478, 0.72, fishShape(mix(P.far, '#FFFFFF', 0.4), P.figure), { rot: -8 }),
      at(704, 630, 1.15, basket(P.accent, '#FFFFFF')),
      band([[0, 640], [500, 632], [1000, 646], [1408, 636]], layer(c, P.ground)),
      grass(c.rand, 0, W, 642, mix(P.ground, P.figure, 0.2)),
      foot(c, mix(P.fore, P.figure, 0.12)),
    ];
  },

  // Prediker 3 - "alles heeft een bestemde tijd": the sun's course over planting and reaping.
  'prediker-bijbelquiz-deel-3': (c) => {
    const P = c.pal;
    const arc: string[] = [];
    arc.push(line('M 170 470 C 300 120 1108 120 1238 470', '#FFFFFF', 4, 'stroke-dasharray="2 18" opacity="0.9"'));
    const pts: [number, number, number][] = [[214, 384, 20], [420, 224, 26], [704, 172, 44], [988, 224, 26], [1194, 384, 20]];
    for (const [x, y, r] of pts) arc.push(circ(x, y, r, r > 40 ? P.accent : '#FFFFFF', r > 40 ? '' : 'opacity="0.95"'));
    return [
      box(0, 0, W, H, vgrad(c, P.skyTop, P.skyLow, 0, 0.75)),
      glow(c, 704, 172, 220, '#FFF6D8', 0.8),
      ...arc,
      hills(c.rand, 460, 30, P.far, 3),
      haze(c, 470, 90),
      band([[0, 486], [704, 476], [1408, 488]], layer(c, P.mid)),
      // Furrows on the left, ripe field on the right.
      ...[0, 1, 2, 3].map((i) => line(`M ${-20} ${520 + i * 26} C 200 ${512 + i * 26} 420 ${516 + i * 26} 640 ${528 + i * 26}`, mix(P.mid, P.figure, 0.18), 5, 'opacity="0.7"')),
      p('M 760 500 C 960 490 1200 492 1440 500 L 1440 640 L 760 640 Z', mix(P.accent2, P.mid, 0.25)),
      ...Array.from({ length: 22 }, (_, i) => at(780 + i * 30 + (i % 2) * 8, 560 + (i % 3) * 8, 0.42, wheatStalk(120, '#C9A548', '#D8B65A'))),
      at(704, 498, 1.05, olive(P.figure, mix(P.figure, P.near, 0.35))),
      at(300, 608, 1.15, kneeler(P.figure, 'forward')),
      at(392, 606, 0.9, sapling(P.figure, P.figure)),
      at(1000, 616, 0.9, sheaf('#B38E3A', '#D8B65A', P.figure)),
      at(1130, 612, 0.82, sheaf('#B38E3A', '#D8B65A', P.figure)),
      band([[0, 616], [600, 608], [1408, 620]], layer(c, P.near)),
      grass(c.rand, 0, W, 622, mix(P.near, P.figure, 0.3)),
      foot(c, mix(P.fore, P.figure, 0.12)),
    ];
  },

  // Jesaja 6 - the throne, the train filling the temple, seraphim, smoke, and the coal for the prophet's lips.
  'jesaja-bijbelquiz-deel-2': (c) => {
    const P = c.pal;
    const rays: string[] = [];
    for (let i = 0; i < 13; i += 1) {
      const a = (-90 + (i - 6) * 13) * (Math.PI / 180);
      rays.push(p(`M 704 330 L ${704 + Math.cos(a - 0.04) * 900} ${330 + Math.sin(a - 0.04) * 900} L ${704 + Math.cos(a + 0.04) * 900} ${330 + Math.sin(a + 0.04) * 900} Z`, '#FFFFFF', 'opacity="0.2"'));
    }
    return [
      box(0, 0, W, H, vgrad(c, P.skyTop, P.skyLow, 0, 0.8)),
      glow(c, 704, 330, 460, '#FFF4DC', 0.95),
      ...rays,
      at(170, 600, 1, column(470, P.mid, mix(P.mid, '#FFFFFF', 0.25))),
      at(1238, 600, 1, column(470, P.mid, mix(P.mid, '#FFFFFF', 0.25))),
      at(330, 600, 0.85, column(400, P.far, mix(P.far, '#FFFFFF', 0.25))),
      at(1078, 600, 0.85, column(400, P.far, mix(P.far, '#FFFFFF', 0.25))),
      at(300, 150, 1.1, smoke('#FFFFFF', 220), { opacity: 0.55 }),
      at(1110, 140, 1, smoke('#FFFFFF', 220), { opacity: 0.5 }),
      // The train of His robe fills the temple.
      p('M 660 470 C 600 560 380 580 120 640 L 1288 640 C 1028 580 808 560 748 470 Z', mix(P.mid, '#FFFFFF', 0.2)),
      at(704, 540, 0.95, throne(mix(P.near, P.figure, 0.2), P.accent2)),
      at(440, 318, 0.86, seraph('#FFFFFF', P.accent, mix(P.skyLow, P.far, 0.6))),
      at(968, 318, 0.86, seraph('#FFFFFF', P.accent, mix(P.skyLow, P.far, 0.6))),
      at(560, 430, 0.8, tongsCoal(mix(P.figure, P.near, 0.3), P.accent, '#FFFFFF'), { rot: 10 }),
      box(0, 600, W, 320, layer(c, P.ground)),
      ...[-1500, -900, -450, -150, 150, 450, 900, 1500].map((dx) => line(`M ${704 + dx * 0.12} 600 L ${704 + dx} 800`, mix(P.ground, '#FFFFFF', 0.25), 3)),
      line('M 0 600 L 1408 600', mix(P.ground, '#FFFFFF', 0.35), 3),
      line('M 0 680 L 1408 680', mix(P.ground, '#FFFFFF', 0.18), 3),
      at(330, 606, 1.25, kneeler(P.figure, 'pray')),
    ];
  },

  // 1 Korinthe 13 - love bears all things: one helps another up, Corinth and its temple behind.
  '1-korinthe-bijbelquiz-deel-13': (c) => {
    const P = c.pal;
    return [
      sky(c, 330, 250, 58),
      glow(c, 330, 250, 300, '#FCEBC0', 0.6),
      box(0, 452, 620, 40, mix(P.far, '#FFFFFF', 0.4)),
      p('M 520 470 C 760 360 860 300 1010 296 C 1160 300 1300 360 1460 430 L 1460 520 L 520 520 Z', layer(c, P.far)),
      at(1030, 300, 0.48, temple(150, 150, mix(P.far, P.figure, 0.22), 7)),
      haze(c, 470, 90),
      band([[0, 480], [500, 494], [1000, 476], [1408, 490]], layer(c, P.mid)),
      at(230, 520, 1.0, olive(mix(P.near, P.figure, 0.35), mix(P.near, P.figure, 0.2))),
      at(1220, 520, 0.9, cypress(mix(P.near, P.figure, 0.25))),
      at(1290, 524, 0.7, cypress(mix(P.near, P.figure, 0.25))),
      band([[0, 560], [600, 552], [1408, 566]], layer(c, P.near)),
      glow(c, 712, 478, 110, '#FFE7A8', 0.9),
      at(640, 606, 1.15, kneeler(P.figure, 'forward')),
      at(798, 614, 1.15, figure(P.figure, 'reach'), { flip: true }),
      at(712, 420, 0.32, heart(P.accent)),
      band([[0, 616], [700, 606], [1408, 620]], layer(c, P.ground)),
      grass(c.rand, 0, W, 620, mix(P.ground, P.figure, 0.2)),
      foot(c, mix(P.fore, P.figure, 0.12)),
    ];
  },

  // Algemene bijbelkennis - one road through the whole Bible: the ark, Jerusalem, Bethlehem's star.
  'algemene-bijbelkennis': (c) => {
    const P = c.pal;
    return [
      sky(c, 1040, 200, 40),
      at(1180, 250, 1, star4(30, P.accent)),
      at(250, 468, 1, mountain(300, 230, layer(c, P.far))),
      at(240, 250, 0.42, ark(P.figure, mix(P.figure, P.far, 0.3))),
      haze(c, 470, 90),
      band([[0, 470], [500, 480], [900, 452], [1408, 476]], layer(c, P.mid)),
      at(720, 470, 0.72, city(c.rand, 170, mix(P.mid, P.figure, 0.45), P.accent)),
      band([[0, 540], [600, 530], [1000, 548], [1408, 532]], layer(c, P.near)),
      at(1170, 560, 0.9, house(P.figure, mix(P.accent, '#FFFFFF', 0.2))),
      at(1030, 566, 1.0, palm(P.figure, P.figure)),
      at(1290, 562, 0.75, palm(P.figure, P.figure)),
      // The road from the viewer up to the city.
      p('M 500 860 C 600 680 760 640 700 560 C 680 530 700 500 720 486 L 744 486 C 740 506 730 530 760 560 C 840 640 760 700 840 860 Z', mix(P.mid, '#FFFFFF', 0.45)),
      at(470, 610, 0.95, figure(P.figure, 'staff')),
      at(560, 614, 0.8, figure(P.figure, 'walk', { hood: true })),
      band([[0, 626], [400, 618], [1000, 634], [1408, 622]], layer(c, P.ground)),
      at(880, 260, 1.4, birds(mix(P.figure, P.skyTop, 0.4))),
      grass(c.rand, 0, 470, 630, mix(P.ground, P.figure, 0.2)),
      grass(c.rand, 860, W, 630, mix(P.ground, P.figure, 0.2)),
      foot(c, mix(P.fore, P.figure, 0.12)),
    ];
  },
};

export const OPTION_A = {
  id: 'a-licht-landschap',
  letter: 'A',
  name: 'Licht landschap',
  render(sample: Sample): string {
    const draw = SCENES[sample.slug];
    if (!draw) throw new Error(`Option A has no scene for ${sample.slug}`);
    const c = ctx(sample);
    const body = draw(c).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${c.defs.join('')}</defs><g transform="translate(0 ${LIFT})">${body}</g></svg>`;
  },
};

