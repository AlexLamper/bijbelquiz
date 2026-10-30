/**
 * Covers for Psalmen 101-150, one scene per quiz. Each quiz covers one psalm:
 * `psalmen-bijbelquiz-deel-<n>` is Psalm n.
 *
 * Base hue 120 at Psalm 101, two degrees per psalm (150 lands on 218). See
 * `quiz-cover-scene-kit.mts` for the house style; the harp, ark, menorah and
 * the other new motifs live in `quiz-cover-motifs-psalmen-3.mts`. Psalms are
 * poetry, so each cover draws the psalm's central image rather than a story.
 *
 * Psalms: de koning die oprecht wandelt in zijn huis (101); de eenzame mus op
 * het dak (102); uw jeugd vernieuwd als eens arends (103); de bronnen tussen de
 * bergen, zon en maan (104); de wolk en het vuur over het leger (105); het kalf
 * aan Horeb (106); de schepelingen in de storm (107); waakt op, luit en harp
 * (108); de arme, en de HEERE aan zijn rechterhand (109); zit aan Mijn
 * rechterhand, de scepter uit Sion (110); de werken en het verbond des HEEREN
 * (111); de rechtvaardige die uitdeelt, licht in de duisternis (112); van den
 * opgang der zon, een blijde moeder van kinderen (113); de zee vlood, de bergen
 * sprongen als rammen (114); de stomme afgoden (115); de beker der verlossingen
 * (116); looft den HEERE, alle volken (117); de verworpen steen als hoeksteen
 * (118); Uw woord is een lamp voor mijn voet (119); bij de tenten van Kedar
 * (120); ik hef mijn ogen op naar de bergen (121); in de poorten van Jeruzalem
 * (122); als de ogen der dienstmaagd op de hand harer vrouw (123); als een
 * vogel uit den strik (124); bergen rondom Jeruzalem (125); die met tranen
 * zaaien (126); zo de HEERE het huis niet bouwt (127); de wijnstok aan de zijde
 * van uw huis (128); ploegers op mijn rug (129); meer dan de wachters op den
 * morgen (130); als een gespeend kind bij zijn moeder (131); de ark naar Sion
 * (132); broeders die samenwonen, de olie op Aärons hoofd (133); de knechten in
 * het huis des HEEREN in de nachten (134); bliksemen met den regen (135); de
 * grote lichten (136); aan de rivieren van Babel (137); alle koningen der aarde
 * (138); vleugelen des dageraads (139); addergif en verborgen strikken (140);
 * mijn gebed als reukwerk (141); in de spelonk (142); als een dorstig land
 * (143); mijn Rots en mijn schild (144); aller ogen wachten op U (145); de
 * HEERE ontslaat de gevangenen (146); Hij telt de sterren, de jonge raven
 * (147); looft Hem, zon en maan en alle schepselen (148); de rei en de trommel
 * (149); looft Hem met bazuin, luit en harp (150).
 */

import { base, fg, haze, layer, type C, type Scene } from './quiz-cover-scene-kit.mjs';
import { at, broadWing, city, mix, mountain, sheep } from './cover-options/shapes.mjs';
import {
  H,
  W,
  bird,
  brickWall,
  chainLinks,
  circle,
  cityWall,
  citySkyline,
  cloudBank,
  colossus,
  columns,
  crowd,
  crown,
  donkey,
  dove,
  ellipse,
  fireBed,
  flame,
  gateArch,
  goat,
  goblet,
  houseBlock,
  lamp,
  lion,
  loaf,
  ox,
  path,
  person,
  prisonBars,
  ram,
  rays,
  rect,
  rotate,
  scepter,
  serpent,
  shafts,
  sheaf,
  ship,
  smokeColumn,
  streaks,
  swell,
  tablets,
  templeFront,
  tent,
  throne,
  trail,
  tree,
  wheat,
  window as windowFrame,
  witheredPlant,
  ziggurat,
} from './quiz-cover-primitives.mjs';
import {
  arkOfCovenant,
  bareTree,
  blackTent,
  brokenSnare,
  caveRock,
  cedar,
  cymbals,
  eagle,
  fieldFlower,
  figureAt,
  firePillar,
  groundNet,
  harp,
  hornOfOil,
  incenseAltar,
  incenseSmoke,
  leapingRam,
  lightning,
  menorah,
  moon,
  motherAndChild,
  perchedBird,
  pitcher,
  pilgrim,
  plough,
  ravenNest,
  roundShield,
  shofar,
  star,
  stroke,
  table,
  tambourine,
  wallVine,
  waterWall,
  willow,
} from './quiz-cover-motifs-psalmen-3.mjs';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A sun half risen above a flat horizon at y. */
function risingSun(x: number, y: number, r: number, fill: string): string {
  return path(`M ${r1(x - r)} ${r1(y)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(x + r)} ${r1(y)} Z`, fill);
}

/** The silhouette colour for shapes from the option-A library, which do not go through ink(). */
function dark(c: C): string {
  return mix(c.a.figure, c.a.near, 0.12);
}

/** Pale wool for the option-A sheep, which keeps a dark head. */
function wool(c: C): string {
  return mix(c.a.skyLow, c.a.far, 0.35);
}

/** Two wide wings of light spreading from the dawn sun - "de vleugelen des dageraads". */
function dawnWings(x: number, y: number, fill: string): string {
  return (
    at(x - 20, y - 20, 1, broadWing(fill, 300, 1.7), { rot: -66, opacity: 0.5 }) +
    at(x + 20, y - 20, 1, broadWing(fill, 300, 1.7), { rot: 66, flip: true, opacity: 0.5 })
  );
}

/** A mountain massif placed on the horizon, in a layer colour. */
function massif(x: number, y: number, w: number, h: number, fill: string): string {
  return at(x, y, 1, mountain(w, h, fill));
}

export const PSALMEN3_SCENES: Record<string, Scene> = {
  // 101: "Ik zal in het midden mijns huizes wandelen in oprechtheid mijns harten" - the king on the straight road to his house, every morning
  'psalmen-bijbelquiz-deel-101': {
    hue: 120,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 300, sunR: 70, rays: true, far: 'dunes', ground: 'flat', horizon: 500 }),
      trail(620, H, 860, 502, 150, '#FFFFFF', { opacity: 0.32 }),
      cityWall(860, 500, 1.1, c.p.near, 520),
      gateArch(860, 500, 1.3, c.p.near),
      person(1000, 502, 0.85, c.p.mid, 'stand'),
      person(1060, 504, 0.8, c.p.mid, 'stand'),
      person(560, 530, 1.5, c.p.fore, 'walk'),
      crown(560, 334, 0.42, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 102: "Ik waak, en ben als een eenzame mus op het dak" - the lonely sparrow on the housetop at night, the grass withered
  'psalmen-bijbelquiz-deel-102': {
    hue: 122,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 300, sunY: 210, sunR: 50, far: 'none', ground: 'flat', horizon: 500 }),
      moon(300, 210, 34, '#FFFFFF'),
      houseBlock(c.rand, 820, 500, 1.6, c.p.near),
      c.soft(760, 300, 120, 0.35, c.p.accent),
      perchedBird(760, 332, 2.0, c.p.accent),
      person(480, 524, 1.25, c.p.fore, 'sit'),
      witheredPlant(600, 526, 1.3, c.p.near),
      witheredPlant(1020, 520, 1.1, c.p.near),
      witheredPlant(1110, 524, 0.9, c.p.near),
      fg(c, 686, 14),
    ],
  },

  // 103: "Die uw jeugd vernieuwt gelijk eens arends" - the eagle over the mountains; man's days as a flower of the field
  'psalmen-bijbelquiz-deel-103': {
    hue: 124,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, sunR: 70, rays: true, far: 'ridge', horizon: 486 }),
      eagle(780, 330, 1.12, c.p.fore),
      fieldFlower(330, 556, 1.2, c.p.near, c.p.accent),
      fieldFlower(380, 548, 1.0, c.p.near, c.p.accent),
      fieldFlower(1040, 552, 1.15, c.p.near, c.p.accent),
      fieldFlower(1100, 560, 0.9, c.p.near, c.p.accent),
      fg(c, 684, 14),
    ],
  },

  // 104: "Gij zendt de bronnen in de dalen, zij lopen henen tussen de bergen" - the stream, the cedar with its birds, the wild goat, the sun that knows its going down
  'psalmen-bijbelquiz-deel-104': {
    hue: 126,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', horizon: 472 }),
      c.soft(704, 380, 260, 0.55),
      circle(704, 400, 44, c.p.accent),
      massif(380, 478, 360, 210, layer(c, mix(c.a.far, c.a.mid, 0.3))),
      massif(1050, 478, 380, 230, layer(c, mix(c.a.far, c.a.mid, 0.45))),
      moon(1140, 180, 30, '#FFFFFF'),
      path(`M 692 476 C 704 500 610 516 586 556 C 562 598 626 624 600 ${H} L 870 ${H} C 866 624 704 600 736 556 C 766 516 720 500 716 476 Z`, c.p.water),
      stroke('M 620 548 L 676 548 M 640 584 L 720 584 M 662 520 L 700 520', '#FFFFFF', 3.5, 0.75),
      cedar(300, 530, 1.25, c.p.near),
      bird(250, 260, 1.4, c.p.fore),
      bird(330, 236, 1.1, c.p.fore),
      donkey(880, 540, 0.9, c.p.near),
      path('M 1060 486 L 1100 410 L 1150 392 L 1200 420 L 1240 486 Z', c.p.mid),
      goat(1160, 396, 0.7, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 105: "Hij breidde een wolk uit tot een deksel, en het vuur om den nacht te verlichten" - the pillar of fire over the camp
  'psalmen-bijbelquiz-deel-105': {
    hue: 128,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', horizon: 480 }),
      c.soft(704, 340, 330, 0.55, c.p.accent),
      cloudBank(c.rand, 704, 170, 1.4, '#FFFFFF', { opacity: 0.45 }),
      firePillar(704, 478, 290, 120, c.p.accent, c.p.glow),
      tent(380, 496, 0.8, c.p.mid),
      tent(1030, 494, 0.8, c.p.mid),
      tent(260, 520, 1.2, c.p.near),
      tent(470, 526, 1.0, c.p.near),
      tent(940, 524, 1.05, c.p.near),
      tent(1150, 520, 1.2, c.p.near),
      person(570, 530, 1.0, c.p.fore, 'stand'),
      person(830, 532, 1.05, c.p.fore, 'raise'),
      fg(c, 688, 14),
    ],
  },

  // 106: "Zij maakten een kalf aan Horeb, en bogen zich voor een gegoten beeld" - the golden calf on its pedestal, the people dancing round it
  'psalmen-bijbelquiz-deel-106': {
    hue: 130,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 240, far: 'none', horizon: 486 }),
      massif(300, 490, 300, 260, layer(c, mix(c.a.far, c.a.mid, 0.4))),
      cloudBank(c.rand, 300, 250, 1.1, c.p.fore, { opacity: 0.3 }),
      smokeColumn(c.rand, 300, 300, 1.2, c.p.fore),
      rect(620, 470, 180, 26, c.p.near),
      rect(600, 494, 220, 22, c.p.near),
      ox(760, 472, 1.25, c.p.accent),
      person(500, 530, 1.2, c.p.fore, 'raise'),
      person(420, 526, 1.05, c.p.fore, 'walk'),
      person(920, 532, 1.2, c.p.fore, 'raise'),
      person(1010, 528, 1.05, c.p.fore, 'raise'),
      person(1100, 530, 0.95, c.p.fore, 'walk'),
      fg(c, 688, 14),
    ],
  },

  // 107: "Zij rijzen op naar den hemel, zij dalen neder in de afgronden" - the sailors in the storm cry to the LORD
  'psalmen-bijbelquiz-deel-107': {
    hue: 132,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 200, far: 'none', ground: 'swell', horizon: 470, clouds: 3 }),
      cloudBank(c.rand, 1050, 180, 1.6, c.p.fore, { opacity: 0.35 }),
      lightning(1080, 200, 0.95, '#FFFFFF', { opacity: 0.85 }),
      streaks(c.rand, 860, 200, 440, 260, c.p.fore, 40, { opacity: 0.22 }),
      swell(c.rand, 520, c.p.mid),
      rotate(-12, 704, 500, ship(704, 500, 1.35, c.p.near, c.p.accent) + person(650, 456, 0.5, c.p.fore, 'raise') + person(770, 456, 0.5, c.p.fore, 'raise')),
      swell(c.rand, 560, c.p.near),
      swell(c.rand, 640, c.p.fore),
    ],
  },

  // 108: "Waakt op, luit en harp! ik zal den dageraad opwekken" - the harp on the hill at sunrise
  'psalmen-bijbelquiz-deel-108': {
    hue: 134,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 420, sunR: 80, rays: true, far: 'ridge', horizon: 482 }),
      bird(560, 270, 1.4, c.p.fore),
      bird(620, 240, 1.0, c.p.fore),
      person(900, 524, 1.35, c.p.fore, 'sit'),
      harp(770, 528, 1.15, c.p.accent),
      fg(c, 686, 14),
    ],
  },

  // 109: "Ik ga henen als een schaduw, als die zich uitstrekt ... Hij staat aan de rechterhand des nooddruftigen" - the poor man kneeling, his accusers pointing
  'psalmen-bijbelquiz-deel-109': {
    hue: 136,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1200, sunY: 430, sunR: 60, far: 'dunes', ground: 'flat', horizon: 500 }),
      path('M 700 518 L 760 518 L 360 566 L 200 566 Z', c.p.fore, { opacity: 0.28 }),
      shafts(820, 140, 160, 360, c.p.glow, 5),
      person(260, 506, 1.0, c.p.mid, 'stand'),
      person(350, 512, 1.15, c.p.mid, 'point'),
      person(450, 514, 1.2, c.p.mid, 'point'),
      person(730, 520, 1.45, c.p.fore, 'kneel'),
      fg(c, 688, 14),
    ],
  },

  // 110: "Zit aan Mijn rechterhand ... De HEERE zal den scepter Uwer sterkte zenden uit Sion" - the throne on Zion and the scepter
  'psalmen-bijbelquiz-deel-110': {
    hue: 138,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 250, rays: true, far: 'ridge', horizon: 492 }),
      path('M 340 520 C 460 440 600 430 704 430 C 808 430 948 440 1068 520 Z', c.p.mid),
      c.soft(704, 330, 180, 0.5),
      throne(704, 436, 1.15, c.p.fore),
      rotate(16, 800, 440, scepter(800, 440, 1.25, c.p.accent)),
      person(440, 530, 1.05, c.p.fore, 'bow'),
      figureAt(980, 530, 1.05, c.p.fore, 'kneelForward', { flip: true }),
      fg(c, 688, 14),
    ],
  },

  // 111: "Hij heeft Zijn verbond in eeuwigheid geboden" - the tablets of the covenant before the gathering of the upright
  'psalmen-bijbelquiz-deel-111': {
    hue: 140,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 220, far: 'dunes', ground: 'flat', horizon: 500 }),
      shafts(704, 150, 240, 280, c.p.glow, 5),
      rect(600, 480, 208, 22, c.p.near),
      rect(624, 460, 160, 22, c.p.near),
      tablets(704, 460, 1.55, c.p.accent),
      crowd(c.rand, 360, 516, 1.05, c.p.near, 5, 300),
      crowd(c.rand, 1050, 516, 1.05, c.p.near, 5, 300),
      fg(c, 688, 14),
    ],
  },

  // 112: "Den oprechte gaat het licht op in de duisternis ... hij deelt uit, hij geeft den nooddruftigen" - bread given at the door at dusk
  'psalmen-bijbelquiz-deel-112': {
    hue: 142,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 410, sunR: 60, far: 'dunes', ground: 'flat', horizon: 500 }),
      houseBlock(c.rand, 400, 500, 1.4, c.p.near),
      windowFrame(400, 430, 0.6, c.p.near, c.p.glow),
      c.soft(400, 400, 120, 0.3),
      person(680, 520, 1.4, c.p.fore, 'point'),
      loaf(770, 428, 1.3, c.p.accent),
      person(860, 532, 1.25, c.p.fore, 'sit'),
      fg(c, 688, 14),
    ],
  },

  // 113: "Van den opgang der zon tot haar ondergang ... Die de onvruchtbare doet wonen als een blijde moeder van kinderen"
  'psalmen-bijbelquiz-deel-113': {
    hue: 144,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'dunes', ground: 'flat', horizon: 494 }),
      c.soft(1000, 470, 320, 0.6),
      rays(c.rand, 1000, 494, 520, '#FFFFFF', 13, { opacity: 0.22 }),
      risingSun(1000, 496, 78, c.p.accent),
      tent(240, 504, 1.1, c.p.mid),
      person(540, 524, 1.45, c.p.fore, 'carry'),
      person(430, 526, 0.72, c.p.fore, 'raise'),
      person(650, 528, 0.78, c.p.fore, 'walk'),
      person(730, 530, 0.62, c.p.fore, 'stand'),
      fg(c, 688, 14),
    ],
  },

  // 114: "De zee zag het en vlood ... de bergen sprongen als rammen, de heuvelen als lammeren"
  'psalmen-bijbelquiz-deel-114': {
    hue: 146,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 420, sunY: 170, sunR: 60, far: 'none', ground: 'flat', horizon: 492 }),
      path('M 720 500 C 820 400 960 360 1060 368 C 1160 376 1260 420 1380 500 Z', c.p.mid),
      path('M 1000 500 C 1080 440 1180 430 1250 440 C 1320 450 1380 470 1440 500 Z', mix(c.a.mid, c.a.near, 0.5)),
      leapingRam(1110, 392, 1.15, c.p.accent),
      leapingRam(880, 420, 0.68, c.p.accent),
      waterWall(60, 350, 520, 250, layer(c, mix(c.a.mid, c.a.near, 0.55)), 'right'),
      waterWall(500, 760, 520, 240, layer(c, mix(c.a.mid, c.a.near, 0.55)), 'left'),
      person(410, 520, 0.9, c.p.fore, 'walk'),
      person(462, 524, 0.75, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 115: "Hun afgoden zijn zilver en goud ... zij hebben ogen, maar zien niet" - the mute idol, and the people who trust in the God of heaven
  'psalmen-bijbelquiz-deel-115': {
    hue: 148,
    mood: 'warm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1040, sunY: 190, far: 'dunes', horizon: 482 }),
      shafts(1040, 120, 220, 340, c.p.glow, 5),
      rect(380, 500, 180, 22, c.p.near),
      colossus(470, 500, 0.92, c.p.accent, c.p.accent),
      figureAt(860, 528, 1.35, c.p.fore, 'kneelUp'),
      person(1000, 526, 1.25, c.p.fore, 'stand'),
      person(1090, 524, 0.8, c.p.fore, 'stand'),
      fg(c, 688, 14),
    ],
  },

  // 116: "Ik zal den beker der verlossingen opnemen, en den Naam des HEEREN aanroepen" - the cup lifted in the courts of the LORD's house
  'psalmen-bijbelquiz-deel-116': {
    hue: 150,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 380, sunY: 220, rays: true, far: 'none', ground: 'flat', horizon: 504 }),
      templeFront(1010, 504, 1.45, c.p.near, 6),
      c.soft(690, 290, 110, 0.5),
      person(640, 524, 1.5, c.p.fore, 'raise'),
      goblet(689, 300, 1.2, c.p.accent),
      fg(c, 688, 14),
    ],
  },

  // 117: "Looft den HEERE, alle gij heidenen; prijst Hem, alle gij volken" - all the nations around the curve of the earth
  'psalmen-bijbelquiz-deel-117': {
    hue: 152,
    mood: 'dawn',
    draw: (c) => {
      const R = 1100;
      const cx = 704;
      const cy = 500 + R;
      const people: [number, number, 'stand' | 'raise' | 'walk' | 'carry'][] = [
        [-21, 1.05, 'walk'],
        [-14, 1.15, 'raise'],
        [-7, 1.25, 'stand'],
        [7, 1.25, 'raise'],
        [14, 1.15, 'carry'],
        [21, 1.05, 'raise'],
      ];
      return [
        base(c, { sun: 'none', far: 'none', ground: 'none', stars: 16 }),
        c.soft(704, 500, 420, 0.65),
        rays(c.rand, 704, 500, 600, '#FFFFFF', 15, { opacity: 0.2 }),
        circle(704, 500, 62, c.p.accent),
        haze(c, 500, 120, 0.4),
        circle(cx, cy, R, layer(c, c.a.mid)),
        circle(cx, cy + 90, R, layer(c, c.a.near)),
        circle(cx, cy + 190, R, layer(c, c.a.ground)),
        ...people.map(([a, s, pose]) => {
          const rad = (a * Math.PI) / 180;
          const px = cx + R * Math.sin(rad);
          const py = cy - R * Math.cos(rad);
          return rotate(a, px, py, person(px, py + 6, s, c.p.fore, pose));
        }),
      ];
    },
  },

  // 118: "De steen, dien de bouwlieden verworpen hadden, is geworden tot een hoofd des hoeks" - the cornerstone set in the wall
  'psalmen-bijbelquiz-deel-118': {
    hue: 154,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 230, far: 'ridge', horizon: 488 }),
      brickWall(c.rand, 640, 512, 1.5, c.p.near, 6, 8),
      rect(560, 368, 80, 144, c.p.near),
      rect(556, 300, 92, 66, c.p.accent, { rx: 4 }),
      c.soft(602, 334, 110, 0.35),
      person(420, 526, 1.35, c.p.fore, 'point'),
      person(1060, 524, 1.2, c.p.fore, 'carry'),
      rect(1032, 340, 56, 26, c.p.near, { rx: 3 }),
      fg(c, 688, 14),
    ],
  },

  // 119: "Uw woord is een lamp voor mijn voet, en een licht voor mijn pad" - walking the night path by lamplight
  'psalmen-bijbelquiz-deel-119': {
    hue: 156,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 476 }),
      path(`M 470 ${H} C 560 650 820 610 770 548 C 730 506 820 486 900 478 L 930 478 C 860 492 800 510 830 548 C 890 616 740 660 860 ${H} Z`, '#FFFFFF', { opacity: 0.22 }),
      c.soft(800, 470, 240, 0.6, c.p.accent),
      ellipse(820, 548, 130, 20, '#FFFFFF', { opacity: 0.25 }),
      person(700, 548, 1.4, c.p.fore, 'point'),
      lamp(780, 452, 1.5, c.p.accent, '#FFFFFF'),
      fg(c, 690, 14),
    ],
  },

  // 120: "Wee mij, dat ik een vreemdeling ben in Mesech, dat ik woon bij de tenten van Kedar" - alone among the black tents, longing for peace
  'psalmen-bijbelquiz-deel-120': {
    hue: 158,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 380, sunR: 60, far: 'dunes', horizon: 482 }),
      citySkyline(c.rand, 1210, 482, 0.45, c.p.far, 4, { opacity: 0.5 }),
      blackTent(330, 512, 1.2, dark(c)),
      blackTent(170, 526, 0.8, dark(c)),
      blackTent(540, 522, 0.95, dark(c)),
      c.soft(690, 500, 120, 0.5, c.p.accent),
      fireBed(c.rand, 690, 536, 0.75, c.p.accent, 5),
      person(900, 530, 1.45, c.p.fore, 'stand'),
      fg(c, 690, 14),
    ],
  },

  // 121: "Ik hef mijn ogen op naar de bergen, vanwaar mijn hulp komen zal" - the pilgrim before the mountains; sun by day, moon by night
  'psalmen-bijbelquiz-deel-121': {
    hue: 160,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1000, sunY: 190, sunR: 60, far: 'none', horizon: 488 }),
      moon(330, 190, 30, '#FFFFFF'),
      massif(700, 494, 300, 200, layer(c, mix(c.a.far, c.a.skyLow, 0.2))),
      massif(1000, 494, 400, 300, layer(c, mix(c.a.far, c.a.mid, 0.5))),
      massif(1300, 494, 260, 220, layer(c, mix(c.a.far, c.a.mid, 0.3))),
      trail(470, H, 880, 492, 140, '#FFFFFF', { opacity: 0.3 }),
      pilgrim(420, 546, 1.5, c.p.fore),
      fg(c, 690, 14),
    ],
  },

  // 122: "Onze voeten staan in uw poorten, o Jeruzalem" - the pilgrims arrive at the gate, the temple above the wall
  'psalmen-bijbelquiz-deel-122': {
    hue: 162,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 230, far: 'ridge', horizon: 476 }),
      citySkyline(c.rand, 840, 430, 0.8, c.p.mid, 7),
      templeFront(940, 412, 0.72, c.p.accent, 5),
      cityWall(840, 494, 1.25, c.p.near, 620),
      gateArch(840, 494, 1.35, c.p.near),
      trail(470, H, 840, 496, 150, '#FFFFFF', { opacity: 0.3 }),
      pilgrim(420, 536, 1.35, c.p.fore),
      person(560, 528, 1.15, c.p.fore, 'walk'),
      person(320, 540, 0.75, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 123: "Gelijk de ogen der dienstmaagd zijn op de hand harer vrouw, alzo zijn onze ogen op den HEERE"
  'psalmen-bijbelquiz-deel-123': {
    hue: 164,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 150, far: 'none', ground: 'flat', horizon: 504 }),
      shafts(704, 80, 260, 380, c.p.glow, 5),
      columns(1010, 504, 1.35, c.p.near, 2),
      figureAt(560, 528, 1.4, c.p.fore, 'kneelForward'),
      pitcher(660, 530, 1.0, c.p.accent),
      figureAt(860, 526, 1.4, c.p.fore, 'reach', { flip: true }),
      fg(c, 688, 14),
    ],
  },

  // 124: "Onze ziel is ontkomen als een vogel uit den strik der vogelvangers; de strik is gebroken" - the bird flies free over the flood
  'psalmen-bijbelquiz-deel-124': {
    hue: 166,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1060, sunY: 200, far: 'none', ground: 'swell', horizon: 496, clouds: 2 }),
      swell(c.rand, 560, c.p.mid),
      path(`M -20 512 C 200 496 480 498 700 528 C 760 540 790 620 800 ${H} L -20 ${H} Z`, c.p.near),
      brokenSnare(420, 534, 1.6, c.p.fore),
      c.soft(820, 320, 140, 0.45),
      dove(820, 320, 2.1, c.p.accent),
    ],
  },

  // 125: "Rondom Jeruzalem zijn bergen; alzo is de HEERE rondom Zijn volk" - the city on Zion ringed by mountains
  'psalmen-bijbelquiz-deel-125': {
    hue: 168,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1180, sunY: 200, far: 'none', horizon: 494 }),
      massif(240, 500, 330, 250, layer(c, mix(c.a.far, c.a.mid, 0.45))),
      massif(1170, 500, 350, 260, layer(c, mix(c.a.far, c.a.mid, 0.5))),
      massif(480, 500, 220, 160, layer(c, c.a.far)),
      massif(930, 500, 230, 170, layer(c, c.a.far)),
      path('M 380 540 C 500 482 600 472 704 472 C 808 472 908 482 1028 540 Z', c.p.mid),
      at(704, 478, 1.15, city(c.rand, 150, c.p.near, c.p.accent)),
      fg(c, 690, 14),
    ],
  },

  // 126: "Die met tranen zaaien, zullen met gejuich maaien ... komt gewis met gejuich, dragende zijn schoven"
  'psalmen-bijbelquiz-deel-126': {
    hue: 170,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 260, far: 'dunes', horizon: 480 }),
      wheat(860, 506, 0.55, c.p.crop, 9),
      wheat(1060, 508, 0.5, c.p.crop, 8),
      person(330, 528, 1.1, c.p.mid, 'walk'),
      ...[0, 1, 2, 3, 4].map((i) => circle(390 + i * 18, 470 + (i % 2) * 14, 4, c.p.mid)),
      person(620, 532, 1.45, c.p.fore, 'carry'),
      rotate(16, 640, 470, sheaf(640, 470, 1.1, c.p.accent)),
      sheaf(860, 540, 0.95, c.p.accent),
      sheaf(960, 546, 0.82, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 127: "Zo de HEERE het huis niet bouwt, tevergeefs arbeiden deszelfs bouwlieden daaraan" - the house going up, the watchman on the wall
  'psalmen-bijbelquiz-deel-127': {
    hue: 172,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 300, sunY: 300, sunR: 70, far: 'ridge', horizon: 484 }),
      cityWall(1150, 488, 0.8, c.p.mid, 260),
      person(1250, 414, 0.5, c.p.fore, 'stand'),
      brickWall(c.rand, 560, 516, 1.35, c.p.near, 7, 4),
      brickWall(c.rand, 560 + 4 * 30 * 1.35, 516, 1.35, c.p.near, 4, 3),
      stroke('M 846 516 L 900 330 M 876 516 L 930 330 M 852 490 L 882 490 M 858 460 L 888 460 M 866 430 L 896 430 M 874 400 L 904 400 M 882 370 L 912 370', c.p.fore, 6),
      person(1000, 530, 1.4, c.p.fore, 'carry'),
      rect(972, 324, 58, 30, c.p.accent, { rx: 3 }),
      fg(c, 690, 14),
    ],
  },

  // 128: "Uw huisvrouw zal zijn als een vruchtbare wijnstok aan de zijden van uw huis; uw kinderen als olijfplanten rondom uw tafel"
  'psalmen-bijbelquiz-deel-128': {
    hue: 174,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 230, far: 'dunes', ground: 'flat', horizon: 500 }),
      houseBlock(c.rand, 330, 500, 1.4, c.p.near),
      wallVine(450, 500, 190, 1.15, c.p.fore, c.p.accent),
      table(800, 530, 250, 1.2, c.p.mid),
      loaf(760, 466, 0.7, c.p.mid),
      goblet(840, 466, 0.7, c.p.mid),
      person(620, 530, 1.35, c.p.fore, 'stand'),
      person(980, 530, 1.3, c.p.fore, 'stand'),
      person(1080, 532, 0.7, c.p.fore, 'raise'),
      person(1150, 534, 0.62, c.p.fore, 'stand'),
      tree(560, 560, 0.45, c.p.near),
      tree(1040, 566, 0.42, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 129: "Ploegers hebben op mijn rug geploegd, zij hebben hun voren lang getrokken"
  'psalmen-bijbelquiz-deel-129': {
    hue: 176,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1190, sunY: 410, sunR: 60, far: 'ridge', ground: 'flat', horizon: 488 }),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => stroke(`M ${-200 + i * 150} ${H} L ${1060 + i * 14} 490`, c.p.near, 4, 0.35)),
      ox(520, 534, 1.1, c.p.near),
      plough(700, 534, 1.2, c.p.accent),
      figureAt(850, 536, 1.3, c.p.fore, 'reach', { flip: true }),
      fg(c, 690, 14),
    ],
  },

  // 130: "Mijn ziel wacht op den Heere, meer dan de wachters op den morgen" - the watchman on the wall, the first light on the horizon
  'psalmen-bijbelquiz-deel-130': {
    hue: 178,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1150, sunY: 480, far: 'dunes', horizon: 484 }),
      star(1080, 300, 16, '#FFFFFF'),
      cityWall(520, 544, 1.0, c.p.near, 560),
      c.soft(840, 330, 110, 0.55, c.p.accent),
      person(800, 448, 1.15, c.p.fore, 'stand'),
      rect(838, 336, 6, 112, c.p.fore),
      flame(841, 342, 0.6, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 131: "Ik heb mijn ziel gestild als een gespeend kind bij zijn moeder" - mother and child, quiet on the hillside
  'psalmen-bijbelquiz-deel-131': {
    hue: 180,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1120, sunY: 250, far: 'ridge', horizon: 482 }),
      tree(900, 520, 1.5, c.p.near),
      motherAndChild(600, 532, 1.4, c.p.fore, { child: c.p.mid }),
      fieldFlower(430, 552, 0.8, c.p.near, c.p.accent),
      fieldFlower(470, 556, 0.65, c.p.near, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 132: "Sta op, HEERE, tot Uw rust, Gij en de ark Uwer sterkte" - the ark carried up to Zion
  'psalmen-bijbelquiz-deel-132': {
    hue: 182,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 220, far: 'ridge', horizon: 482 }),
      at(1130, 470, 0.6, city(c.rand, 160, c.p.mid)),
      c.soft(640, 380, 200, 0.4),
      person(470, 530, 1.25, c.p.fore, 'walk'),
      person(810, 530, 1.25, c.p.fore, 'walk'),
      arkOfCovenant(640, 452, 1.15, c.p.accent, c.p.fore),
      fg(c, 690, 14),
    ],
  },

  // 133: "Het is gelijk de kostelijke olie op het hoofd ... als de dauw van Hermon" - brothers together, the oil poured on Aaron's head
  'psalmen-bijbelquiz-deel-133': {
    hue: 184,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 260, sunY: 260, far: 'none', horizon: 486 }),
      massif(1060, 490, 380, 300, layer(c, mix(c.a.far, c.a.mid, 0.4))),
      path('M 960 220 C 990 196 1040 190 1080 204 L 1100 240 L 1070 232 L 1050 252 L 1020 236 L 990 256 L 970 240 Z', '#FFFFFF', { opacity: 0.85 }),
      c.soft(1060, 300, 200, 0.35),
      person(420, 528, 1.25, c.p.fore, 'stand'),
      person(520, 528, 1.3, c.p.fore, 'stand'),
      figureAt(650, 530, 1.35, c.p.fore, 'kneel'),
      person(800, 528, 1.4, c.p.fore, 'raise'),
      hornOfOil(668, 384, 0.78, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 134: "Ziet, looft den HEERE, alle gij knechten des HEEREN, gij die in des HEEREN huis staat in de nachten"
  'psalmen-bijbelquiz-deel-134': {
    hue: 186,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'flat', horizon: 504 }),
      templeFront(704, 504, 1.55, c.p.near, 6),
      c.soft(704, 420, 220, 0.5, c.p.accent),
      menorah(704, 500, 0.95, c.p.accent, '#FFFFFF'),
      person(430, 526, 1.3, c.p.fore, 'raise'),
      person(980, 526, 1.3, c.p.fore, 'raise'),
      fg(c, 690, 14),
    ],
  },

  // 135: "Die de dampen doet opklimmen van het einde der aarde; Die de bliksemen maakt met den regen" - and the fallen idol
  'psalmen-bijbelquiz-deel-135': {
    hue: 188,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'water', horizon: 470, clouds: 2 }),
      cloudBank(c.rand, 920, 220, 2.2, c.p.fore, { opacity: 0.38 }),
      streaks(c.rand, 700, 250, 560, 230, c.p.fore, 46, { opacity: 0.25 }),
      lightning(960, 250, 1.05, c.p.accent),
      path(`M -20 500 C 160 488 360 494 520 516 C 600 530 640 600 660 ${H} L -20 ${H} Z`, c.p.mid),
      rotate(-84, 330, 524, colossus(330, 524, 0.5, c.p.near, c.p.near)),
      person(500, 528, 1.25, c.p.fore, 'stand'),
    ],
  },

  // 136: "Die grote lichten gemaakt heeft ... de zon tot heerschappij des daags, de maan en de sterren tot heerschappijen des nachts"
  'psalmen-bijbelquiz-deel-136': {
    hue: 190,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 250, sunY: 430, sunR: 60, far: 'dunes', horizon: 484, stars: 26 }),
      c.soft(1100, 240, 170, 0.4, c.p.accent),
      moon(1100, 240, 58, c.p.accent),
      star(980, 170, 12, '#FFFFFF'),
      star(1230, 320, 9, '#FFFFFF'),
      star(890, 280, 8, '#FFFFFF'),
      path('M 380 540 C 520 470 760 460 960 540 Z', c.p.mid),
      pilgrim(640, 486, 1.25, c.p.fore),
      at(500, 512, 0.95, sheep(wool(c), dark(c))),
      at(790, 506, 1.0, sheep(wool(c), dark(c)), { flip: true }),
      at(880, 528, 0.9, sheep(wool(c), dark(c)), { flip: true }),
      fg(c, 690, 14),
    ],
  },

  // 137: "Aan de rivieren van Babel, daar zaten wij ... Aan de wilgen hingen wij onze harpen"
  'psalmen-bijbelquiz-deel-137': {
    hue: 192,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1180, sunY: 290, far: 'none', ground: 'flat', horizon: 486 }),
      ziggurat(1150, 488, 0.95, c.p.mid),
      willow(c.rand, 520, 540, 1.2, c.p.near),
      stroke('M 340 305 L 321 330 M 712 302 L 705 330', c.p.fore, 3),
      rotate(6, 321, 330, harp(352, 444, 0.62, c.p.accent)),
      rotate(-5, 705, 330, harp(735, 440, 0.6, c.p.accent)),
      person(820, 530, 1.15, c.p.fore, 'sit'),
      person(930, 534, 1.0, c.p.fore, 'sit'),
      person(1050, 536, 1.1, c.p.fore, 'bow'),
      path(`M -20 566 C 300 552 700 576 ${W + 20} 560 L ${W + 20} 616 C 900 630 400 616 -20 630 Z`, c.p.water),
      stroke('M 180 590 L 360 590 M 760 598 L 980 598 M 1100 584 L 1260 584', '#FFFFFF', 3.5, 0.6),
      fg(c, 700, 12),
    ],
  },

  // 138: "Alle koningen der aarde zullen U loven, o HEERE" - kings bow toward the temple, a crown laid down
  'psalmen-bijbelquiz-deel-138': {
    hue: 194,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 230, rays: true, far: 'none', ground: 'flat', horizon: 490 }),
      templeFront(704, 490, 1.25, c.p.near, 6),
      figureAt(400, 532, 1.35, c.p.fore, 'kneelForward'),
      crown(545, 506, 0.78, c.p.accent),
      figureAt(1010, 532, 1.35, c.p.fore, 'kneelForward', { flip: true }),
      person(1140, 528, 1.2, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 139: "Neem ik de vleugelen des dageraads, woonde ik aan het uiterste der zee, ook daar zou Uw hand mij geleiden"
  'psalmen-bijbelquiz-deel-139': {
    hue: 196,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sun: 'none', far: 'none', ground: 'water', horizon: 470 }),
      c.soft(900, 470, 380, 0.7),
      dawnWings(900, 470, '#FFFFFF'),
      risingSun(900, 472, 70, c.p.accent),
      path(`M -20 516 C 180 500 360 500 470 528 C 520 552 536 640 546 ${H} L -20 ${H} Z`, c.p.mid),
      person(330, 524, 1.45, c.p.fore, 'stand'),
    ],
  },

  // 140: "Zij scherpen hun tong als een slang; addergif is onder hun lippen ... zij hebben een net uitgespreid aan de zijde van het pad"
  'psalmen-bijbelquiz-deel-140': {
    hue: 198,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1160, sunY: 250, far: 'dunes', horizon: 482 }),
      trail(760, H, 1000, 484, 170, '#FFFFFF', { opacity: 0.3 }),
      groundNet(470, 560, 150, 24, c.p.near),
      serpent(420, 548, 1.3, c.p.accent),
      shafts(880, 130, 120, 330, c.p.glow, 4),
      c.soft(880, 360, 120, 0.4),
      person(880, 530, 1.4, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 141: "Laat mijn gebed als reukwerk voor Uw aangezicht bereid zijn, de opheffing mijner handen als het avondoffer"
  'psalmen-bijbelquiz-deel-141': {
    hue: 200,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 410, sunR: 60, far: 'ridge', ground: 'flat', horizon: 500 }),
      c.soft(700, 380, 160, 0.4, c.p.accent),
      incenseSmoke(700, 350, 200, '#FFFFFF', 0.55),
      incenseAltar(700, 524, 1.5, c.p.accent),
      figureAt(480, 530, 1.5, c.p.fore, 'kneelUp'),
      fg(c, 690, 14),
    ],
  },

  // 142: "Met mijn stem roep ik tot den HEERE" - David's prayer in the cave
  'psalmen-bijbelquiz-deel-142': {
    hue: 202,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'moon', sunX: 1180, sunY: 200, sunR: 40, far: 'none', horizon: 492 }),
      moon(1180, 200, 30, '#FFFFFF'),
      caveRock(620, 524, 1.25, c.p.mid, mix(c.a.near, c.a.figure, 0.45)),
      c.soft(640, 470, 130, 0.45, c.p.accent),
      figureAt(610, 526, 1.35, c.p.fore, 'kneelUp'),
      lamp(700, 520, 1.0, c.p.accent, '#FFFFFF'),
      fg(c, 692, 12),
    ],
  },

  // 143: "Ik breid mijn handen uit tot U; mijn ziel is als een dorstig land ... doe mij in den morgenstond Uw goedertierenheid horen"
  'psalmen-bijbelquiz-deel-143': {
    hue: 204,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1000, sunY: 410, sunR: 70, rays: true, far: 'none', ground: 'flat', horizon: 488 }),
      trail(760, H, 1000, 490, 160, '#FFFFFF', { opacity: 0.3 }),
      stroke('M 220 560 L 280 548 L 300 572 L 360 566 M 300 572 L 290 600 M 420 590 L 470 580 L 520 596 M 470 580 L 480 560 M 1120 570 L 1180 560 L 1220 580', c.p.near, 3, 0.6),
      bareTree(300, 530, 0.95, c.p.near),
      witheredPlant(420, 540, 1.3, c.p.near),
      witheredPlant(1180, 540, 1.1, c.p.near),
      figureAt(560, 532, 1.5, c.p.fore, 'kneelForward'),
      fg(c, 690, 14),
    ],
  },

  // 144: "Geloofd zij de HEERE, mijn Rots ... mijn Schild, en op Wien ik betrouw" - the warrior with his shield on the rock, the mountains smoking
  'psalmen-bijbelquiz-deel-144': {
    hue: 206,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1120, sunY: 220, far: 'none', horizon: 490, clouds: 2 }),
      massif(330, 494, 300, 220, layer(c, mix(c.a.far, c.a.mid, 0.45))),
      smokeColumn(c.rand, 330, 270, 1.6, c.p.fore),
      lightning(380, 110, 0.7, '#FFFFFF', { opacity: 0.85 }),
      path('M 560 530 L 610 452 L 700 432 L 790 446 L 870 530 Z', c.p.mid),
      stroke('M 760 290 L 690 450', c.p.fore, 6),
      person(720, 446, 1.2, c.p.fore, 'stand'),
      roundShield(700, 362, 0.72, c.p.accent),
      fg(c, 690, 14),
    ],
  },

  // 145: "Aller ogen wachten op U, en Gij geeft hun hun spijs te zijner tijd" - the creatures looking up, the field ripe
  'psalmen-bijbelquiz-deel-145': {
    hue: 208,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 190, rays: true, far: 'dunes', horizon: 482 }),
      shafts(704, 140, 280, 320, c.p.glow, 5),
      wheat(704, 520, 1.0, c.p.accent, 9),
      ox(400, 530, 0.95, c.p.near),
      at(260, 538, 0.95, sheep(wool(c), dark(c))),
      goat(1010, 530, 0.8, c.p.near),
      at(1160, 540, 0.9, sheep(wool(c), dark(c)), { flip: true }),
      bird(560, 300, 1.3, c.p.fore),
      bird(860, 280, 1.1, c.p.fore),
      bird(900, 320, 0.9, c.p.fore),
      fg(c, 690, 14),
    ],
  },

  // 146: "De HEERE maakt de gevangenen los" - the prison door open, the broken chain, the freed man walking into the morning
  'psalmen-bijbelquiz-deel-146': {
    hue: 210,
    mood: 'dawn',
    draw: (c) => [
      base(c, { sunX: 1130, sunY: 300, sunR: 70, rays: true, far: 'dunes', horizon: 492 }),
      rect(130, 300, 420, 220, c.p.near),
      rect(120, 284, 440, 20, c.p.near),
      prisonBars(400, 520, 1.5, c.p.fore, true),
      chainLinks(560, 522, 1.5, c.p.accent),
      person(800, 530, 1.45, c.p.fore, 'walk'),
      fg(c, 690, 14),
    ],
  },

  // 147: "Hij telt het getal der sterren; Hij noemt ze allen bij namen ... Die den jongen raven hun voeder geeft, als zij roepen"
  'psalmen-bijbelquiz-deel-147': {
    hue: 212,
    mood: 'night',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 482, stars: 60 }),
      star(390, 210, 30, c.p.accent),
      star(580, 300, 20, c.p.accent),
      star(720, 180, 24, c.p.accent),
      star(240, 320, 16, c.p.accent),
      star(840, 280, 15, c.p.accent),
      star(520, 160, 12, c.p.accent),
      cityWall(380, 488, 0.7, c.p.mid, 320),
      bareTree(1000, 530, 1.1, c.p.near),
      ravenNest(980, 260, 1.15, c.p.near),
      fg(c, 690, 14),
    ],
  },

  // 148: "Looft Hem, zon en maan ... gij bergen en alle heuvelen, fruitbomen en alle cederen, gedierte en alle vee ... jongelingen en ook maagden"
  'psalmen-bijbelquiz-deel-148': {
    hue: 214,
    mood: 'day',
    draw: (c) => [
      base(c, { sun: 'none', far: 'ridge', horizon: 486 }),
      c.soft(300, 220, 200, 0.55),
      circle(300, 220, 40, c.p.accent),
      moon(1160, 180, 28, '#FFFFFF'),
      star(1050, 220, 9, '#FFFFFF'),
      star(1260, 250, 7, '#FFFFFF'),
      cedar(520, 530, 1.0, c.p.near),
      tree(780, 526, 1.1, c.p.near),
      lion(660, 548, 1.0, c.p.near),
      ram(900, 546, 0.8, c.p.near),
      bird(700, 300, 1.2, c.p.fore),
      bird(760, 270, 0.9, c.p.fore),
      person(1030, 530, 1.25, c.p.fore, 'raise'),
      person(1120, 532, 1.0, c.p.fore, 'raise'),
      person(1190, 534, 0.7, c.p.fore, 'raise'),
      fg(c, 690, 14),
    ],
  },

  // 149: "Dat zij Zijn Naam prijzen met den rei; dat zij Hem psalmen zingen met de trommel en harp"
  'psalmen-bijbelquiz-deel-149': {
    hue: 216,
    mood: 'warm',
    draw: (c) => [
      base(c, { sunX: 1170, sunY: 250, far: 'dunes', horizon: 482 }),
      person(450, 530, 1.2, c.p.fore, 'raise'),
      person(600, 528, 1.45, c.p.fore, 'raise'),
      tambourine(650, 300, 1.15, c.p.accent, c.a.accent2),
      person(770, 532, 1.2, c.p.fore, 'walk'),
      person(880, 530, 1.25, c.p.fore, 'raise'),
      person(980, 534, 0.75, c.p.fore, 'raise'),
      fg(c, 690, 14),
    ],
  },

  // 150: "Looft Hem met geklank der bazuin; looft Hem met de luit en met de harp ... met welluidende cimbalen"
  'psalmen-bijbelquiz-deel-150': {
    hue: 218,
    mood: 'gold',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 704, sunY: 220, rays: true, far: 'none', ground: 'flat', horizon: 500 }),
      person(440, 526, 1.45, c.p.fore, 'stand'),
      shofar(452, 346, 1.55, c.p.accent),
      harp(820, 528, 0.95, c.p.near),
      person(930, 528, 1.2, c.p.fore, 'sit'),
      person(1090, 528, 1.3, c.p.fore, 'raise'),
      cymbals(1090, 332, 1.0, c.p.near),
      fg(c, 690, 14),
    ],
  },
};
