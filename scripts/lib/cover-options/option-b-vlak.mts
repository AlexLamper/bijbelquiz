/**
 * Option B - "Vlakke poster".
 *
 * Bold flat illustration, close crop: the object the chapter is about is
 * drawn big, in front of one large circle, on a field of at most four colours
 * per book group plus a cream highlight. No gradients, no haze - the depth
 * comes from overlap and from a darker side on each shape.
 */

import {
  H,
  W,
  at,
  band,
  basket,
  box,
  bushClump,
  bushFlames,
  bushFlamesFront,
  bun,
  circ,
  column,
  crescentMoon,
  crown,
  dove,
  ell,
  figure,
  fishShape,
  heart,
  hourglass,
  line,
  mix,
  mountain,
  openBook,
  p,
  quill,
  rng,
  sandals,
  sapling,
  seatedCrowd,
  seraph,
  smoke,
  star4,
  tablets,
  throne,
  tongsCoal,
  ark,
} from './shapes.mjs';
import type { Group, Sample } from './samples.mjs';

/** The whole scene sits this much higher so the subject stays inside the quiz page's 240px hero crop. */
const LIFT = -34;

type Pal = { bg: string; light: string; mid: string; deep: string; accent: string; cream: string };

export const PALETTES: Record<Group, Pal> = {
  evangelien: { bg: '#E3E9F5', light: '#C3D0EA', mid: '#35548C', deep: '#263E69', accent: '#E9B12E', cream: '#FFF8E8' },
  wet: { bg: '#FBEFD2', light: '#F2D696', mid: '#D9734F', deep: '#6B3A1C', accent: '#E9B12E', cream: '#FFF8E8' },
  poezie: { bg: '#E6EEE7', light: '#BCD1C0', mid: '#3F6B4F', deep: '#24412E', accent: '#E9B12E', cream: '#FFF8E8' },
  profeten: { bg: '#F7E6DD', light: '#EDC1AB', mid: '#B4502B', deep: '#6A2C15', accent: '#E9B12E', cream: '#FFF8E8' },
  brieven: { bg: '#ECE8DF', light: '#D7CFBF', mid: '#35548C', deep: '#263E69', accent: '#D9734F', cream: '#FFF8E8' },
  thema: { bg: '#E3E9F5', light: '#C3D0EA', mid: '#35548C', deep: '#263E69', accent: '#E9B12E', cream: '#FFF8E8' },
};

const SCENES: Record<string, (P: Pal, rand: () => number) => string[]> = {
  'exodus-bijbelquiz-deel-3': (P, rand) => [
    circ(704, 360, 300, P.cream),
    at(1060, 500, 1, mountain(380, 250, P.light)),
    box(0, 500, W, 420, P.light),
    band([[0, 610], [700, 596], [1408, 614]], mix(P.light, P.mid, 0.35)),
    at(720, 610, 1.85, bushFlames(P.mid, P.accent, P.cream)),
    at(720, 610, 1.85, bushClump(P.deep, undefined, rand)),
    at(720, 610, 1.85, bushFlamesFront(P.mid, P.accent)),
    at(330, 616, 1.45, figure(P.deep, 'shield')),
    line('M 224 620 L 272 330', P.deep, 10),
    at(450, 622, 2.2, sandals(P.deep)),
  ],

  'johannes-bijbelquiz-deel-6': (P, rand) => [
    circ(704, 330, 290, P.cream),
    box(0, 330, W, 110, P.light),
    ...[0, 1, 2].map((i) => line(`M ${120 + i * 160} ${360 + i * 24} L ${300 + i * 160} ${360 + i * 24} M ${960 + i * 90} ${372 + i * 22} L ${1120 + i * 90} ${372 + i * 22}`, P.cream, 6)),
    band([[0, 440], [400, 430], [900, 446], [1408, 432]], mix(P.light, P.mid, 0.3)),
    seatedCrowd(rand, -20, 1440, 470, 506, 2, mix(P.light, P.mid, 0.45), mix(P.light, P.mid, 0.35), 0.4, 0.5),
    band([[0, 520], [700, 510], [1408, 524]], P.light),
    // The basket, close up: five loaves heaped above the rim, two fish on top.
    ell(704, 672, 320, 24, mix(P.light, P.deep, 0.2)),
    at(612, 470, 1.8, bun(P.accent, P.cream, mix(P.accent, P.deep, 0.3))),
    at(796, 470, 1.8, bun(P.accent, P.cream, mix(P.accent, P.deep, 0.3))),
    at(704, 456, 1.9, bun(P.accent, P.cream, mix(P.accent, P.deep, 0.3))),
    at(652, 404, 1.7, bun(P.accent, P.cream, mix(P.accent, P.deep, 0.3))),
    at(758, 402, 1.7, bun(P.accent, P.cream, mix(P.accent, P.deep, 0.3))),
    at(640, 372, 1.8, fishShape(P.mid, P.cream), { rot: 10 }),
    at(770, 346, 1.8, fishShape(mix(P.mid, P.deep, 0.45), P.cream), { rot: -6 }),
    at(704, 672, 2.7, basket(P.deep, P.mid)),
  ],

  'prediker-bijbelquiz-deel-3': (P) => [
    // Day and night halves of one circle: a time for everything.
    `<clipPath id="half"><rect x="0" y="0" width="704" height="${H}"/></clipPath>`,
    circ(704, 380, 310, P.light),
    `<g clip-path="url(#half)">${circ(704, 380, 310, P.cream)}</g>`,
    at(500, 300, 1, circ(0, 0, 48, P.accent)),
    at(912, 290, 1, crescentMoon(42, P.cream, P.light)),
    at(960, 380, 1, star4(14, P.cream)),
    at(860, 410, 1, star4(10, P.cream)),
    box(0, 600, W, 320, P.mid),
    band([[0, 600], [700, 590], [1408, 604]], P.mid),
    at(704, 640, 2.4, hourglass(P.deep, mix(P.cream, P.light, 0.3), P.accent)),
    at(704, 602, 0.95, sapling(P.mid, P.mid)),
  ],

  'jesaja-bijbelquiz-deel-2': (P) => {
    const rays: string[] = [];
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      rays.push(p(`M 704 330 L ${704 + Math.cos(a - 0.07) * 1000} ${330 + Math.sin(a - 0.07) * 1000} L ${704 + Math.cos(a + 0.07) * 1000} ${330 + Math.sin(a + 0.07) * 1000} Z`, P.light, 'opacity="0.55"'));
    }
    return [
      ...rays,
      circ(704, 330, 210, P.cream),
      at(230, 120, 1.1, smoke(P.cream, 220)),
      at(1190, 110, 1.0, smoke(P.cream, 220)),
      box(0, 600, W, 320, mix(P.mid, P.light, 0.35)),
      ...[0, 1, 2].map((i) => box(0, 640 + i * 52, W, 4, P.light, 0, 'opacity="0.6"')),
      p('M 640 470 C 580 560 380 590 140 600 L 1268 600 C 1028 590 828 560 768 470 Z', P.light),
      at(704, 560, 1.05, throne(P.deep, P.accent)),
      at(380, 330, 0.95, seraph('#FFFFFF', P.accent, mix(P.cream, P.light, 0.6))),
      at(1028, 330, 0.95, seraph('#FFFFFF', P.accent, mix(P.cream, P.light, 0.6))),
      at(470, 520, 1.1, tongsCoal(P.deep, P.accent, P.cream), { rot: 4 }),
    ];
  },

  '1-korinthe-bijbelquiz-deel-13': (P) => [
    circ(704, 380, 300, P.cream),
    at(200, 600, 1.25, column(420, P.light)),
    at(1210, 600, 1.25, column(420, P.light)),
    box(0, 600, W, 320, P.light),
    // A letter, open on the table, sealed with a heart.
    at(704, 640, 1, p('M -300 0 L -260 -330 L 280 -300 L 300 0 Z', '#E9DFC8')),
    at(704, 620, 1, p('M -280 0 L -246 -320 L 266 -292 L 284 0 Z', '#FFFDF7')),
    ...[0, 1, 2, 3, 4, 5].map((i) => line(`M ${490 + i * 2} ${360 + i * 38} L ${880 - (i % 2) * 70} ${364 + i * 38}`, P.mid, 8, 'opacity="0.5"')),
    at(860, 612, 1.4, heart(P.accent)),
    at(860, 600, 0.6, heart(mix(P.accent, '#FFFFFF', 0.3))),
    at(470, 596, 1.7, quill(P.mid, P.cream), { rot: 12 }),
  ],

  'algemene-bijbelkennis': (P) => {
    const icons: [number, number, string][] = [
      [430, 300, at(0, 0, 0.55, ark(P.mid, P.light))],
      [560, 190, at(0, 0, 0.5, tablets(P.mid, P.cream))],
      [704, 150, star4(34, P.accent)],
      [850, 194, at(0, 0, 0.6, crown(P.accent))],
      [980, 300, at(0, 0, 0.55, dove(P.mid))],
    ];
    return [
      circ(704, 400, 300, P.cream),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = Math.PI * (1.08 + i * 0.14);
        return line(`M ${704 + Math.cos(a) * 120} ${470 + Math.sin(a) * 120} L ${704 + Math.cos(a) * 230} ${470 + Math.sin(a) * 230}`, P.accent, 10, 'opacity="0.8"');
      }),
      ...icons.map(([x, y, s]) => at(x, y + 40, 1, s)),
      box(0, 620, W, 320, P.light),
      at(704, 660, 2.0, openBook(P.deep, P.cream, P.mid, P.accent)),
    ];
  },
};

export const OPTION_B = {
  id: 'b-vlakke-poster',
  letter: 'B',
  name: 'Vlakke poster',
  render(sample: Sample): string {
    const draw = SCENES[sample.slug];
    if (!draw) throw new Error(`Option B has no scene for ${sample.slug}`);
    const P = PALETTES[sample.group];
    const body = draw(P, rng(`b:${sample.slug}`)).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${P.bg}"/><g transform="translate(0 ${LIFT})">${body}</g></svg>`;
  },
};
