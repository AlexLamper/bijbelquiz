/**
 * Covers for the Micha series, one scene per quiz. Each quiz covers one
 * chapter: `micha-bijbelquiz-deel-<n>` is chapter n (1-7).
 *
 * Base hue 260, drifting two degrees per chapter (chapter 7 lands on 272).
 * See `quiz-cover-scene-kit.mts` for the house style; the extra motifs live
 * in `quiz-cover-motifs-spreuken-openbaring.mts`.
 *
 * Chapters: de bergen versmelten onder Hem als was voor het vuur, Samaria
 * tot een steenhoop (1); Ik zal Jakob vergaderen als schapen in de kooi, de
 * Doorbreker trekt voor hen uit (2); Sion zal als een akker geploegd worden
 * (3); zwaarden tot spaden, ieder onder zijn wijnstok en vijgenboom (4); en
 * gij, Bethlehem Efratha, uit u zal Mij voortkomen die een Heerser zal zijn
 * (5); wat eist de HEERE van u: recht doen, weldadigheid liefhebben en
 * ootmoedig wandelen met uw God (6); ik zal uitzien naar de HEERE, Hij zal al
 * hun zonden in de diepten der zee werpen (7).
 */

import { mix } from './cover-options/shapes.mjs';
import { H, citySkyline, ellipse, fireBed, flame, path, person, rect, ram, shafts, templeFront, trail, tree } from './quiz-cover-primitives.mjs';
import { base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  altar,
  anvil,
  halfSun,
  hammer,
  lamb,
  plough,
  plowshare,
  ruinedHouse,
  staffBearer,
  star,
  stroke,
  sword,
  wallTone,
} from './quiz-cover-motifs-spreuken-openbaring.mjs';

/** An elliptical arc of ellipse (cx, cy, rx, ry) from angle a0 to a1 (degrees, y down), as a stroked wall. */
function wallArc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, color: string, w: number): string {
  const pt = (a: number) => {
    const r = (a * Math.PI) / 180;
    return `${(cx + Math.cos(r) * rx).toFixed(1)} ${(cy + Math.sin(r) * ry).toFixed(1)}`;
  };
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `<path d="M ${pt(a0)} A ${rx} ${ry} 0 ${large} 1 ${pt(a1)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}

export const MICHA_SCENES: Record<string, Scene> = {
  // 1: "De bergen zullen onder Hem versmelten ... gelijk was voor het vuur" - and Samaria made a heap of stones
  'micha-bijbelquiz-deel-1': {
    hue: 260,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', clouds: 3, far: 'none', ground: 'dunes', horizon: 494 }),
      c.soft(704, 140, 280, 0.7, '#FFFFFF'),
      shafts(704, 40, 280, 300, '#FFFFFF', 5),
      path('M 360 504 C 470 420 600 300 704 290 C 812 300 940 420 1050 504 Z', c.p.mid),
      fireBed(c.rand, 704, 310, 0.6, c.p.accent, 5),
      stroke('M 690 304 C 670 350 640 380 626 430 C 616 466 604 490 598 506', c.p.accent, 12, 0.9),
      stroke('M 718 304 C 740 352 770 384 790 430 C 804 462 816 488 824 506', c.p.accent, 12, 0.9),
      stroke('M 704 310 C 702 380 700 440 704 506', c.p.accent, 9, 0.75),
      ruinedHouse(1120, 540, 0.95, wallTone(c, 0.4)),
      person(330, 540, 1.25, c.p.fore, 'bow'),
      fg(c, 694, 14),
    ],
  },

  // 2: "Ik zal hen bijeenzetten als schapen van Bozra ... De Doorbreker zal voor hun aangezicht optrekken"
  'micha-bijbelquiz-deel-2': {
    hue: 262,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 300, sunR: 56, far: 'ridge', ground: 'dunes', horizon: 482 }),
      wallArc(500, 528, 250, 50, 180, 360, wallTone(c), 22),
      lamb(380, 530, 0.8, c.p.light, c.p.near),
      lamb(460, 524, 0.75, c.p.light, c.p.near),
      lamb(540, 532, 0.8, c.p.light, c.p.near),
      lamb(430, 552, 0.85, c.p.light, c.p.near),
      lamb(520, 560, 0.8, c.p.light, c.p.near),
      wallArc(500, 528, 250, 50, 38, 180, wallTone(c), 22),
      lamb(760, 560, 0.85, c.p.light, c.p.near),
      lamb(850, 552, 0.8, c.p.light, c.p.near),
      staffBearer(980, 552, 1.4, c.p.fore, c.p.accent),
      fg(c, 696, 12),
    ],
  },

  // 3: "Daarom zal Sion om uwentwil als een akker geploegd worden, en Jeruzalem zal tot steenhopen worden"
  'micha-bijbelquiz-deel-3': {
    hue: 264,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1110, sunY: 380, sunR: 52, far: 'ridge', ground: 'flat', horizon: 500 }),
      path('M 560 510 C 640 440 760 414 880 414 C 1000 416 1080 450 1160 510 Z', c.p.mid),
      ruinedHouse(860, 430, 0.75, wallTone(c, 0.45)),
      rect(990, 380, 16, 46, wallTone(c, 0.45)),
      rect(720, 400, 14, 30, wallTone(c, 0.45)),
      tree(1050, 446, 0.6, c.p.near, { opacity: 0.8 }),
      tree(680, 448, 0.5, c.p.near, { opacity: 0.75 }),
      fg(c, 694, 12),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => stroke(`M ${420 + i * 70} 520 L ${-80 + i * 200} ${H}`, mix(c.a.ground, c.a.figure, 0.35), 6, 0.45)),
      plough(470, 576, 1.6, c.p.accent),
    ],
  },

  // 4: "Zij zullen hun zwaarden slaan tot spaden ... en een iegelijk zal zitten onder zijn wijnstok en onder zijn vijgeboom"
  'micha-bijbelquiz-deel-4': {
    hue: 266,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'ridge', ground: 'dunes', horizon: 490 }),
      path('M 880 500 C 940 430 1020 400 1100 400 C 1180 402 1240 440 1300 500 Z', c.p.mid),
      c.soft(1090, 360, 120, 0.5, '#FFFFFF'),
      templeFront(1090, 404, 0.65, c.p.near, 5),
      tree(250, 520, 1.25, c.p.near),
      person(250, 528, 0.85, c.p.fore, 'sit'),
      c.soft(690, 400, 120, 0.5, c.p.accent),
      anvil(690, 544, 1.15, c.p.near),
      plowshare(706, 392, 0.85, c.p.accent),
      sword(844, 520, 0.8, c.p.near, { rot: -72 }),
      sword(876, 524, 0.8, c.p.near, { rot: -80 }),
      sword(904, 522, 0.8, c.p.near, { rot: -66 }),
      person(510, 544, 1.35, c.p.fore, 'raise'),
      hammer(556, 352, 0.85, c.p.near, { rot: 38 }),
      fg(c, 694, 14),
    ],
  },

  // 5: "En gij, Bethlehem Efratha, zijt gij klein om te wezen onder de duizenden van Juda? uit u zal Mij voortkomen, die een Heerser zal zijn"
  'micha-bijbelquiz-deel-5': {
    hue: 268,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', ground: 'dunes', horizon: 482, stars: 40 }),
      path('M 560 524 C 640 446 760 416 880 418 C 1000 420 1090 456 1160 524 Z', c.p.mid),
      citySkyline(c.rand, 860, 436, 0.75, c.p.near, 6),
      c.soft(860, 268, 210, 0.55, c.p.accent),
      shafts(860, 280, 90, 150, c.p.glow, 3),
      star(860, 268, 50, c.p.accent),
      staffBearer(400, 540, 1.35, c.p.fore),
      lamb(500, 544, 0.8, c.p.light, c.p.near),
      lamb(570, 540, 0.72, c.p.light, c.p.near),
      lamb(290, 548, 0.78, c.p.light, c.p.near, { flip: true }),
      fg(c, 694, 14),
    ],
  },

  // 6: "Hij heeft u bekend gemaakt, o mens! wat goed is ... recht te doen, en weldadigheid lief te hebben, en ootmoediglijk te wandelen met uw God"
  'micha-bijbelquiz-deel-6': {
    hue: 270,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1010, sunY: 270, sunR: 60, rays: true, far: 'ridge', ground: 'dunes', horizon: 482 }),
      fg(c, 692, 14),
      trail(520, H + 10, 990, 484, 150, mix('#FFFFFF', c.a.mid, 0.2), { opacity: 0.65 }),
      altar(300, 540, 1.0, c.p.near),
      flame(300, 410, 0.9, c.p.accent),
      ram(430, 548, 0.7, c.p.near),
      person(848, 562, 1.25, c.p.fore, 'walk'),
    ],
  },

  // 7: "Wanneer ik in duisternis zit, zo is de HEERE mij een licht ... Hij zal al hun zonden in de diepten der zee werpen"
  'micha-bijbelquiz-deel-7': {
    hue: 272,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'water', horizon: 470, stars: 30 }),
      c.soft(900, 466, 360, 0.75, '#FFFFFF'),
      halfSun(c, 900, 472, 74, c.p.accent),
      ...[[900, 500, 90], [890, 530, 60], [910, 566, 40], [896, 604, 26]].map(([x, y, w]) => ellipse(x, y, w, 4, c.p.accent, { opacity: 0.7 })),
      `<ellipse cx="1130" cy="620" rx="70" ry="12" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.6"/>`,
      `<ellipse cx="1130" cy="620" rx="36" ry="6" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.7"/>`,
      path(`M -20 520 C 120 470 250 424 390 428 C 460 432 520 480 560 600 L 560 ${H} L -20 ${H} Z`, c.p.mid),
      person(370, 436, 1.25, c.p.fore, 'raise'),
    ],
  },
};

