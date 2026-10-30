/**
 * Covers for Psalmen 51-100, one scene per quiz. Each quiz covers one psalm:
 * `psalmen-bijbelquiz-deel-<n>` is Psalm n. The psalms are poetry, so each
 * cover draws the psalm's central image rather than a narrative moment.
 *
 * Base hue 140 for Psalm 51, two degrees per psalm (Psalm 100 lands on 238).
 * See `quiz-cover-scene-kit.mts` for the house style; the motifs this series
 * needed (lyre, tear bottle, scales, altar, shofar, ark, boar, ...) are in
 * `quiz-cover-motifs-psalmen-2.mts`.
 *
 * Psalms: Schep mij een rein hart (51); een groene olijfboom in Gods huis
 * (52); God ziet neer op de mensenkinderen (53); vrijwillig offer in de
 * woestijn van Zif (54); vleugels als een duif (55); leg mijn tranen in Uw
 * fles (56); in de spelonk, luit en harp wekken de dageraad (57); er is een
 * God die op aarde richt (58); de honden rondom de stad (59); een banier voor
 * wie U vrezen (60); leid mij op de rots die mij te hoog is (61); alleen in
 * God is mijn ziel stil (62); mijn ziel dorst naar U in een dor land (63); God
 * schiet hen met een pijl (64); Gij kroont het jaar, de dalen vol koren (65);
 * Hij veranderde de zee in het droge (66); Hij doe Zijn aangezicht over ons
 * lichten (67); de optocht met de ark naar het heiligdom (68); de wateren tot
 * aan de ziel (69); haast U tot mijn hulp (70); verlaat mij niet in de
 * ouderdom (71); koningen brengen geschenken aan de koning (72); totdat ik in
 * Gods heiligdom inging, op gladde plaatsen (73); het heiligdom in brand (74);
 * de beker in de hand des HEEREN (75); boog, schild en zwaard verbroken, paard
 * en wagen in slaap (76); Uw bliksemen verlichtten de wereld (77); manna,
 * hemels koren (78); Jeruzalem tot steenhopen, het zuchten der gevangenen
 * (79); de wijnstok uit Egypte en het wilde zwijn (80); blaast de bazuin op de
 * nieuwe maan (81); God staat in de vergadering der goden (82); de volken
 * rondom Gods volk (83); de zwaluw een nest bij Uw altaren (84); de waarheid
 * spruit uit de aarde (85); leer mij Uw weg (86); de HEERE bemint de poorten
 * Sions (87); de ondersten kuil, de duisternis is mijn bekende (88); zijn troon
 * als de zon, als de maan (89); leer ons onze dagen tellen (90); onder Zijn
 * vleugelen, Zijn waarheid een schild (91); de palmboom en de ceder (92);
 * machtiger dan de baren der zee (93); de HEERE mijn hoog vertrek (94); de
 * schapen Zijner hand knielen (95); de bomen des wouds juichen (96); de
 * bergen versmelten als was (97); met trompetten en bazuin (98); in de
 * wolkkolom sprak Hij tot hen (99); gaat in Zijn poorten met lof (100).
 */

import { at, bushClump, fire, mix, mountain } from './cover-options/shapes.mjs';
import { G, base, fg, type C, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  W,
  banner,
  basket,
  bird,
  brickWall,
  chariot,
  circle,
  cityWall,
  citySkyline,
  cloudBank,
  coin,
  columns,
  crescent,
  crowd,
  crown,
  ellipse,
  fireBed,
  gateArch,
  houseBlock,
  lamp,
  palm,
  path,
  person,
  rays,
  rect,
  river,
  rotate,
  serpent,
  shafts,
  sheaf,
  ship,
  smokeColumn,
  streaks,
  stump,
  templeFront,
  tent,
  tower,
  trail,
  tree,
  wheat,
  window as windowFrame,
  witheredPlant,
} from './quiz-cover-primitives.mjs';
import {
  altar,
  archer,
  arkOfCovenant,
  arrow,
  axe,
  bar,
  boar,
  bolt,
  bottle,
  brokenBow,
  camel,
  caveRock,
  cedar,
  cloudColumn,
  crag,
  crook,
  crownA,
  curlWave,
  dog,
  doveA,
  figureA,
  fireColumn,
  fissure,
  grapeBunch,
  greatVine,
  harp,
  heart,
  horseAsleep,
  hourglass,
  jar,
  kneelA,
  nest,
  pouringCup,
  sapling,
  scales,
  sheep,
  shield,
  shofar,
  stroke,
  swallow,
  sword,
  tear,
  throneA,
  timbrel,
  torch,
  trumpet,
  wingCanopy,
} from './quiz-cover-motifs-psalmen-2.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A smooth mound from x0 to x1 on `base`, its top at `top`. */
function mound(x0: number, x1: number, top: number, baseY: number, fill: string): string {
  const k = baseY - (baseY - top) / 0.75;
  return `<path d="M ${r1(x0)} ${r1(baseY)} C ${r1(x0 + (x1 - x0) * 0.25)} ${r1(k)} ${r1(x0 + (x1 - x0) * 0.75)} ${r1(k)} ${r1(x1)} ${r1(baseY)} Z" fill="${fill}"/>`;
}

/** Hill and rock colours derived from the scene's palette. */
const hillCol = (c: C, t = 0.4) => mix(c.a.mid, c.a.near, t);
const rockCol = (c: C, t = 0.28) => mix(c.a.near, c.a.figure, t);
const seaCol = (c: C) => mix(c.a.mid, c.a.far, 0.45);

/** Small flecks scattered in a box, in one colour. */
function flecks(rand: () => number, x0: number, y0: number, w: number, h: number, n: number, rx: number, fill: string, opacity = 1): string {
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const k = 0.6 + rand() * 0.6;
    out.push(ellipse(x0 + rand() * w, y0 + rand() * h, rx * k, rx * 0.7 * k, fill));
  }
  return opacity === 1 ? out.join('') : `<g opacity="${opacity}">${out.join('')}</g>`;
}

/*__BODY__*/
