/**
 * Option C - "Papierknipsel".
 *
 * The scene is built from five or six sheets of paper in tones of one colour
 * per book group, light at the back and dark at the front. Every sheet casts
 * a soft shadow on the one behind it, figures are cut out of the sheet they
 * stand on, and one piece is cut from gold paper. A fine paper grain lies
 * over the whole cover.
 */

import {
  H,
  W,
  at,
  band,
  basket,
  box,
  bun,
  bushClump,
  bushFlames,
  bushFlamesFront,
  circ,
  city,
  column,
  cypress,
  figure,
  flame,
  fishShape,
  heart,
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
  temple,
  throne,
  tongsCoal,
  ark,
} from './shapes.mjs';
import type { Group, Sample } from './samples.mjs';

/** The whole scene sits this much higher so the subject stays inside the quiz page's 240px hero crop. */
const LIFT = -34;

/** Six tones, back to front, plus the gold sheet. */
type Pal = { t: [string, string, string, string, string, string]; gold: string; light: string };

export const PALETTES: Record<Group, Pal> = {
  evangelien: { t: ['#E8EDF6', '#CFDAEE', '#AFC2E2', '#8AA4D0', '#5F7DB4', '#35548C'], gold: '#E9B12E', light: '#FFFFFF' },
  thema: { t: ['#ECEFF6', '#D5DEEF', '#B6C6E4', '#93AAD3', '#6582B7', '#35548C'], gold: '#E9B12E', light: '#FFFFFF' },
  wet: { t: ['#FBF2DC', '#F5E3B8', '#EDD093', '#E0B76E', '#C99549', '#9C6B2D'], gold: '#D9734F', light: '#FFF8EA' },
  poezie: { t: ['#ECF2EC', '#D2E1D5', '#B1CBB7', '#88AE91', '#5E8A69', '#3F6B4F'], gold: '#E9B12E', light: '#FFFFFF' },
  profeten: { t: ['#FBEFE8', '#F4D8CA', '#EBBCA5', '#DE9A7B', '#C87553', '#A3502F'], gold: '#E9B12E', light: '#FFF8F2' },
  brieven: { t: ['#EEF0F4', '#D8DDE6', '#B9C2D1', '#94A0B6', '#6B7893', '#45526D'], gold: '#D9734F', light: '#FFFFFF' },
};

const SHADOW =
  '<filter id="cut" x="-25%" y="-30%" width="150%" height="160%" color-interpolation-filters="sRGB">' +
  '<feGaussianBlur in="SourceAlpha" stdDeviation="11"/><feOffset dx="0" dy="6" result="b"/>' +
  '<feFlood flood-color="#2A1E10" flood-opacity="0.34"/><feComposite in2="b" operator="in" result="s"/>' +
  '<feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
  '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>' +
  '<feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.9 0"/></filter>';

/** One sheet: everything in it shares a colour and casts one shadow. */
const sheet = (color: string, ...parts: string[]) => `<g filter="url(#cut)" fill="${color}">${parts.join('')}</g>`;

/** The classic paper-cut sun: a disc in three stacked rings, each its own sheet. */
function sunRings(P: Pal, x: number, y: number, r: number): string {
  const [t0, t1] = P.t;
  return (
    sheet(mix(t0, '#FFFFFF', 0.35), circ(x, y, r * 2.5, mix(t0, '#FFFFFF', 0.35))) +
    sheet(mix(t0, '#FFFFFF', 0.6), circ(x, y, r * 1.85, mix(t0, '#FFFFFF', 0.6))) +
    sheet(mix(t1, '#FFFFFF', 0.85), circ(x, y, r * 1.3, mix(t1, '#FFFFFF', 0.85))) +
    sheet(P.light, circ(x, y, r, P.light))
  );
}

/** A scalloped paper cloud. */
function cloud(P: Pal, x: number, y: number, s: number): string {
  const c = mix(P.t[0], '#FFFFFF', 0.7);
  return sheet(
    c,
    at(x, y, s, circ(-60, 0, 34, c) + circ(-18, -22, 44, c) + circ(34, -12, 38, c) + circ(74, 4, 28, c) + box(-94, 0, 196, 30, c, 15)),
  );
}

/** Two stacked wave sheets at the bottom, so the foreground is layered too. */
function foreground(P: Pal, rand: () => number, flat = false): string {
  const [, , , , t4, t5] = P.t;
  if (flat) return sheet(mix(t4, t5, 0.45), box(-40, 700, W + 80, 220, mix(t4, t5, 0.45))) + sheet(t5, box(-40, 752, W + 80, 180, t5));
  const wave = (y: number, amp: number) => {
    let d = `M -40 ${y}`;
    for (let x = -40; x < W + 40; x += 240) d += ` q 60 ${-amp * (0.6 + rand() * 0.8)} 120 0 t 120 0`;
    return d + ` L ${W + 40} 900 L -40 900 Z`;
  };
  return sheet(mix(t4, t5, 0.45), p(wave(700, 22), mix(t4, t5, 0.45))) + sheet(t5, p(wave(752, 18), t5));
}

const SCENES: Record<string, (P: Pal, rand: () => number) => string[]> = {
  'exodus-bijbelquiz-deel-3': (P, rand) => {
    const [t0, t1, t2, t3, t4, t5] = P.t;
    return [
      box(0, 0, W, H, t0),
      sunRings(P, 1110, 190, 50),
      cloud(P, 560, 210, 1.0),
      sheet(t1, at(300, 476, 1, mountain(300, 150, t1)), at(900, 480, 1, mountain(430, 280, t1))),
      sheet(t2, band([[0, 486], [400, 474], [900, 494], [1408, 478]], t2), at(1020, 486, 0.6, sheep(t2, t2), { flip: true }), at(1110, 492, 0.66, sheep(t2, t2), { flip: true }), at(1196, 484, 0.54, sheep(t2, t2), { flip: true })),
      sheet(P.gold, at(700, 598, 1.12, bushFlames(P.gold, '#E9B12E', '#FFF1C8'))),
      sheet(t3, band([[0, 560], [500, 548], [1000, 566], [1408, 552]], t3)),
      sheet(t4, band([[0, 606], [500, 596], [1000, 612], [1408, 600]], t4)),
      sheet(t5, at(700, 604, 1.12, bushClump(t5, undefined, rand)), at(400, 610, 1.22, figure(t5, 'shield')), line('M 312 614 L 352 364', t5, 8), at(500, 612, 1.8, sandals(t5))),
      sheet(P.gold, at(700, 604, 1.12, bushFlamesFront(P.gold, '#E9B12E'))),
      foreground(P, rand),
    ];
  },

  'johannes-bijbelquiz-deel-6': (P, rand) => {
    const [t0, t1, t2, t3, t4, t5] = P.t;
    return [
      box(0, 0, W, H, t0),
      sunRings(P, 1090, 186, 50),
      cloud(P, 330, 200, 1.0),
      cloud(P, 640, 130, 0.7),
      sheet(t1, band([[0, 420], [500, 404], [1000, 426], [1408, 410]], t1)),
      sheet(mix(t0, '#FFFFFF', 0.5), box(-20, 440, W + 40, 60, mix(t0, '#FFFFFF', 0.5))),
      sheet(t2, band([[0, 480], [300, 492], [700, 520], [1100, 500], [1408, 488]], t2), seatedCrowd(rand, 800, 1440, 504, 560, 3, t2, t2, 0.36, 0.52)),
      sheet(t3, band([[0, 586], [500, 572], [1000, 590], [1408, 576]], t3)),
      sheet(t4, band([[0, 614], [400, 606], [900, 624], [1408, 612]], t4)),
      sheet(t5, at(420, 620, 1.18, figure(t5, 'bless')), at(552, 620, 0.72, figure(t5, 'stand', { hood: false }))),
      sheet(P.gold, at(660, 564, 0.62, bun(P.gold, mix(P.gold, '#FFFFFF', 0.5))), at(744, 564, 0.62, bun(P.gold, mix(P.gold, '#FFFFFF', 0.5))), at(702, 552, 0.66, bun(P.gold, mix(P.gold, '#FFFFFF', 0.5))), at(680, 530, 0.55, bun(P.gold, mix(P.gold, '#FFFFFF', 0.5))), at(726, 528, 0.55, bun(P.gold, mix(P.gold, '#FFFFFF', 0.5)))),
      sheet(P.light, at(668, 506, 0.6, fishShape(P.light, t4), { rot: 6 }), at(742, 500, 0.6, fishShape(P.light, t4), { rot: -6 })),
      sheet(t5, at(704, 632, 1.15, basket(t5, t3))),
      foreground(P, rand),
    ];
  },

  'prediker-bijbelquiz-deel-3': (P, rand) => {
    const [t0, t1, t2, t3, t4, t5] = P.t;
    const suns: [number, number, number][] = [[214, 384, 20], [420, 224, 26], [988, 224, 26], [1194, 384, 20]];
    return [
      box(0, 0, W, H, t0),
      line('M 170 470 C 300 120 1108 120 1238 470', P.light, 4, 'stroke-dasharray="2 18"'),
      sheet(P.light, ...suns.map(([x, y, r]) => circ(x, y, r, P.light))),
      sheet(mix(P.t[0], '#FFFFFF', 0.5), circ(704, 172, 96, mix(P.t[0], '#FFFFFF', 0.5))),
      sheet(mix(P.gold, '#FFFFFF', 0.6), circ(704, 172, 68, mix(P.gold, '#FFFFFF', 0.6))),
      sheet(P.gold, circ(704, 172, 46, P.gold)),
      sheet(t1, band([[0, 460], [500, 446], [1000, 466], [1408, 452]], t1)),
      sheet(t2, band([[0, 492], [704, 480], [1408, 494]], t2), at(704, 500, 1.05, olive(t2, t2))),
      sheet(mix(P.gold, t2, 0.45), p('M 760 520 C 960 508 1200 512 1440 520 L 1440 640 L 760 640 Z', mix(P.gold, t2, 0.45))),
      sheet(t3, band([[0, 560], [400, 552], [760, 566], [1408, 560]], t3)),
      sheet(mix(P.gold, t4, 0.25), at(1000, 600, 0.9, sheaf(mix(P.gold, t4, 0.25), mix(P.gold, '#FFFFFF', 0.2), mix(P.gold, t4, 0.5))), at(1130, 596, 0.82, sheaf(mix(P.gold, t4, 0.25), mix(P.gold, '#FFFFFF', 0.2), mix(P.gold, t4, 0.5)))),
      sheet(t4, band([[0, 612], [600, 604], [1408, 618]], t4)),
      sheet(t5, at(300, 616, 1.15, kneeler(t5, 'plant')), at(392, 616, 0.9, sapling(t5, t5))),
      foreground(P, rand),
    ];
  },

  'jesaja-bijbelquiz-deel-2': (P, rand) => {
    const [t0, t1, t2, t3, t4, t5] = P.t;
    return [
      box(0, 0, W, H, t0),
      sheet(P.light, circ(704, 340, 250, mix(P.light, t0, 0.2))),
      sheet(t1, at(240, 130, 1.1, smoke(t1, 220)), at(1170, 120, 1, smoke(t1, 220)), at(704, 60, 1.4, smoke(t1, 220))),
      sheet(P.light, at(430, 320, 0.84, seraph(P.light, P.light, P.light)), at(978, 320, 0.84, seraph(P.light, P.light, P.light))),
      sheet(P.gold, at(430, 320, 0.84, at(0, 44, 0.5, flame(150, 70, P.gold))), at(978, 320, 0.84, at(0, 44, 0.5, flame(150, 70, P.gold))), at(560, 440, 0.8, tongsCoal(P.gold, P.gold), { rot: 10 })),
      sheet(t2, at(170, 600, 1, column(470, t2)), at(1238, 600, 1, column(470, t2))),
      sheet(t3, p('M 660 470 C 600 560 380 590 120 620 L 1288 620 C 1028 590 808 560 748 470 Z', t3), at(704, 548, 0.95, throne(t3, mix(t1, '#FFFFFF', 0.3)))),
      sheet(t4, box(-20, 610, W + 40, 320, t4)),
      sheet(t5, at(330, 620, 1.25, kneeler(t5, 'pray'))),
      foreground(P, rand, true),
    ];
  },

  '1-korinthe-bijbelquiz-deel-13': (P, rand) => {
    const [t0, t1, t2, t3, t4, t5] = P.t;
    return [
      box(0, 0, W, H, t0),
      sunRings(P, 330, 250, 52),
      cloud(P, 900, 150, 0.9),
      sheet(t1, p('M 520 480 C 760 370 860 310 1010 306 C 1160 310 1300 370 1460 440 L 1460 520 L 520 520 Z', t1), at(1030, 310, 0.48, temple(150, 150, t1, 7))),
      sheet(t2, band([[0, 490], [500, 504], [1000, 486], [1408, 500]], t2), at(230, 530, 1.0, olive(t2, t2)), at(1220, 530, 0.9, cypress(t2)), at(1290, 534, 0.7, cypress(t2))),
      sheet(t3, band([[0, 566], [600, 558], [1408, 572]], t3)),
      sheet(t4, band([[0, 614], [700, 604], [1408, 618]], t4)),
      sheet(t5, at(640, 616, 1.15, kneeler(t5, 'forward')), at(798, 624, 1.15, figure(t5, 'reach'), { flip: true })),
      sheet(P.gold, at(714, 428, 0.4, heart(P.gold))),
      sheet(t5),
      foreground(P, rand),
    ];
  },

  'algemene-bijbelkennis': (P, rand) => {
    const [t0, t1, t2, t3, t4, t5] = P.t;
    return [
      box(0, 0, W, H, t0),
      sunRings(P, 1040, 200, 40),
      cloud(P, 520, 160, 0.9),
      sheet(P.gold, at(1180, 250, 1, star4(30, P.gold))),
      sheet(t1, at(250, 478, 1, mountain(300, 230, t1)), at(240, 260, 0.42, ark(t1, t1))),
      sheet(t2, band([[0, 480], [500, 490], [900, 462], [1408, 486]], t2), at(720, 480, 0.72, city(rand, 170, t2))),
      sheet(t3, band([[0, 550], [600, 540], [1000, 558], [1408, 542]], t3), at(1170, 570, 0.9, house(t3)), at(1030, 576, 1.0, palm(t3, t3)), at(1290, 572, 0.75, palm(t3, t3))),
      sheet(mix(t1, t2, 0.3), p('M 500 860 C 600 680 760 650 700 570 C 680 540 700 510 720 496 L 744 496 C 740 516 730 540 760 570 C 840 650 760 700 840 860 Z', mix(t1, t2, 0.3))),
      sheet(t4, band([[0, 630], [400, 622], [1000, 638], [1408, 626]], t4)),
      sheet(t5, at(470, 632, 0.95, figure(t5, 'staff')), at(560, 636, 0.8, figure(t5, 'walk'))),
      foreground(P, rand),
    ];
  },
};

export const OPTION_C = {
  id: 'c-papierknipsel',
  letter: 'C',
  name: 'Papierknipsel',
  render(sample: Sample): string {
    const draw = SCENES[sample.slug];
    if (!draw) throw new Error(`Option C has no scene for ${sample.slug}`);
    const P = PALETTES[sample.group];
    const body = draw(P, rng(`c:${sample.slug}`)).join('');
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${SHADOW}</defs><g transform="translate(0 ${LIFT})">${body}</g>` +
      `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.10" style="mix-blend-mode:multiply"/></svg>`
    );
  },
};
