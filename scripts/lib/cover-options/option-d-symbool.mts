/**
 * Option D - "Symbool".
 *
 * One strong symbol for the chapter, drawn in two colours inside a white
 * medallion, on a tinted field per book group with a quiet ring pattern and
 * the chapter number set large in Fredoka, tone on tone. The whole series of
 * a book shares field and pattern; the symbol and the number tell the parts
 * apart.
 */

import {
  H,
  W,
  anchor,
  at,
  basket,
  bun,
  bushClump,
  bushFlames,
  bushFlamesFront,
  broadWing,
  line,
  throne,
  circ,
  crossShape,
  fishShape,
  heart,
  hourglass,
  mix,
  openBook,
  rng,
  sapling,
} from './shapes.mjs';
import type { Group, Sample } from './samples.mjs';

type Pal = { field: string; ring: string; deep: string; mid: string; accent: string; accent2: string };

export const PALETTES: Record<Group, Pal> = {
  evangelien: { field: '#E3E9F5', ring: '#C9D4EA', deep: '#263E69', mid: '#35548C', accent: '#E9B12E', accent2: '#F7D77E' },
  thema: { field: '#E3E9F5', ring: '#C9D4EA', deep: '#263E69', mid: '#35548C', accent: '#E9B12E', accent2: '#F7D77E' },
  wet: { field: '#F7EACB', ring: '#EBD6A2', deep: '#6B3A1C', mid: '#A8642F', accent: '#D9734F', accent2: '#E9B12E' },
  poezie: { field: '#E1EBE3', ring: '#C5D8CA', deep: '#24412E', mid: '#3F6B4F', accent: '#E9B12E', accent2: '#F7D77E' },
  profeten: { field: '#F5E2D8', ring: '#EAC8B7', deep: '#7A3219', mid: '#B4502B', accent: '#E9B12E', accent2: '#F7D77E' },
  brieven: { field: '#E6E8EE', ring: '#CDD2DE', deep: '#263E69', mid: '#35548C', accent: '#D9734F', accent2: '#F0A68A' },
};

/** Each symbol is drawn around (0, 0) and fits in a ~340 unit circle. */
const SYMBOLS: Record<string, (P: Pal, rand: () => number) => string> = {
  'exodus-bijbelquiz-deel-3': (P, rand) =>
    at(0, 120, 1.18, bushFlames(P.accent, P.accent2, '#FFF6DE')) + at(0, 120, 1.18, bushClump(P.deep, undefined, rand)) + at(0, 120, 1.18, bushFlamesFront(P.accent, P.accent2)),
  'johannes-bijbelquiz-deel-6': (P) =>
    at(-70, -10, 1.0, bun(P.accent, '#FFFFFF', mix(P.accent, P.deep, 0.3))) +
    at(70, -10, 1.0, bun(P.accent, '#FFFFFF', mix(P.accent, P.deep, 0.3))) +
    at(0, -24, 1.05, bun(P.accent, '#FFFFFF', mix(P.accent, P.deep, 0.3))) +
    at(-40, -56, 0.92, bun(P.accent, '#FFFFFF', mix(P.accent, P.deep, 0.3))) +
    at(40, -58, 0.92, bun(P.accent, '#FFFFFF', mix(P.accent, P.deep, 0.3))) +
    at(-52, -96, 1.0, fishShape(P.mid, '#FFFFFF'), { rot: 10 }) +
    at(52, -104, 1.0, fishShape(mix(P.mid, P.deep, 0.5), '#FFFFFF'), { rot: -10 }) +
    at(0, 120, 1.5, basket(P.deep, P.mid)),
  'prediker-bijbelquiz-deel-3': (P) => at(0, 150, 1.6, hourglass(P.deep, mix(P.field, '#FFFFFF', 0.4), P.accent)) + at(0, 124, 0.62, sapling(P.mid, P.mid)),
  'jesaja-bijbelquiz-deel-2': (P) => {
    const soft = mix(P.mid, '#FFFFFF', 0.55);
    const wings =
      at(-34, 0, 1, broadWing(soft, 190), { rot: -62 }) +
      at(34, 0, 1, broadWing(soft, 190), { rot: 62, flip: true }) +
      at(-30, 40, 1, broadWing(mix(soft, '#FFFFFF', 0.35), 140), { rot: -112 }) +
      at(30, 40, 1, broadWing(mix(soft, '#FFFFFF', 0.35), 140), { rot: 112, flip: true });
    const rays = [-50, -25, 0, 25, 50].map((a) => at(0, -60, 1, line('M 0 -110 L 0 -150', P.accent, 10), { rot: a })).join('');
    return at(0, 14, 0.88, rays + wings + at(0, 120, 0.82, throne(P.deep, P.accent)));
  },
  '1-korinthe-bijbelquiz-deel-13': (P) =>
    at(-120, 30, 0.8, crossShape(P.mid)) + at(120, 26, 0.82, anchor(P.mid)) + at(0, 40, 1.65, heart(P.accent)),
  'algemene-bijbelkennis': (P) => at(0, 80, 1.3, openBook(P.deep, '#FFFFFF', P.mid, P.accent)),
};

export const OPTION_D = {
  id: 'd-symbool',
  letter: 'D',
  name: 'Symbool',
  render(sample: Sample): string {
    const draw = SYMBOLS[sample.slug];
    if (!draw) throw new Error(`Option D has no symbol for ${sample.slug}`);
    const P = PALETTES[sample.group];
    const hasNumber = sample.chapter !== null;
    const cx = hasNumber ? 580 : 704;
    const cy = 396;
    const rings: string[] = [];
    for (let i = 0; i < 9; i += 1) {
      const r = 290 + i * 70;
      rings.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${P.ring}" stroke-width="3" opacity="${(0.95 - i * 0.09).toFixed(2)}"/>`);
    }
    const num = hasNumber
      ? `<text x="${cx + 330}" y="${cy + 150}" font-family="Fredoka" font-weight="600" font-size="420" letter-spacing="-12" fill="${P.mid}" opacity="0.16">${sample.chapter}</text>`
      : '';
    const shadow =
      '<filter id="lift" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="14"/><feOffset dy="10" result="b"/>' +
      `<feFlood flood-color="${P.deep}" flood-opacity="0.16"/><feComposite in2="b" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${shadow}</defs>` +
      `<rect width="${W}" height="${H}" fill="${P.field}"/>${rings.join('')}${num}` +
      `<g filter="url(#lift)">${circ(cx, cy, 224, '#FFFFFF')}</g>` +
      `<circle cx="${cx}" cy="${cy}" r="207" fill="none" stroke="${P.ring}" stroke-width="3"/>` +
      at(cx, cy, 0.97, draw(P, rng(`d:${sample.slug}`))) +
      `</svg>`
    );
  },
};
