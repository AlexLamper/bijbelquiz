/**
 * Covers for the 2 Timotheus series - only four parts, one per chapter.
 *
 * Base hue around 250-259, a deeper purple than 1 Timotheus (220-240) so the
 * two series stay distinguishable on the quiz grid. See
 * `quiz-cover-scene-kit.mts` for the house style. Chapters: het oprechte
 * geloof van Lois en Eunice, de gave Gods aangewakkerd door handoplegging (1);
 * een goed krijgsknecht van Jezus Christus - de soldaat, de atleet, de
 * landman (2); moeilijke tijden in de laatste dagen, de Schrift die de mens
 * Gods volmaakt toerust (3); de goede strijd gestreden, de loop geeindigd, de
 * kroon der rechtvaardigheid (4).
 */

import { G, base, fg, type Scene } from './quiz-cover-scene-kit.mjs';
import {
  H,
  crown,
  flame,
  hand,
  person,
  scroll,
  shafts,
} from './quiz-cover-primitives.mjs';

export const TIM2_SCENES: Record<string, Scene> = {
  // 1: het oprechte geloof van Lois en Eunice; de gave Gods aanwakkeren door handoplegging
  '2-timotheus-bijbelquiz-deel-1': {
    hue: 250,
    mood: 'dusk',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 300, sunY: 250, far: 'none', ground: 'flat', horizon: 512 }),
      person(560, 512, 1.05, c.p.near, 'sit', { opacity: 0.85 }),
      person(680, 512, 1.0, c.p.near, 'sit', { opacity: 0.72 }),
      hand(880, 420, 1.1, c.p.accent),
      person(880, 512, 1.35, c.p.fore, 'kneel'),
      flame(880, 400, 0.5, c.p.accentDeep, { opacity: 0.85 }),
      fg(c, 684, 14),
    ],
  },
  // 2: een goed krijgsknecht van Jezus Christus; de atleet strijdt naar de regelen, de landman arbeidt eerst
  '2-timotheus-bijbelquiz-deel-2': {
    hue: 254,
    mood: 'storm',
    draw: (c) => [
      base(c, { sun: 'glow', sunX: 1080, sunY: 250, clouds: 3, far: 'none', ground: 'flat', horizon: 512 }),
      person(704, 512, 1.4, c.p.fore, 'stand'),
      crown(704, 358, 0.55, c.p.accent, { opacity: 0.7 }),
      fg(c, 684, 14),
    ],
  },
  // 3: moeilijke tijden in de laatste dagen; de Schrift, door God ingegeven, maakt de mens Gods volmaakt toegerust
  '2-timotheus-bijbelquiz-deel-3': {
    hue: 257,
    mood: 'day',
    draw: (c) => [
      base(c, { sunX: 1080, sunY: 244, far: 'none', ground: 'flat', horizon: 512 }),
      shafts(760, 90, 130, 150, c.p.glow, 3),
      scroll(760, 420, 0.85, c.p.accent),
      person(560, 512, 1.3, c.p.fore, 'stand'),
      fg(c, 684, 14),
    ],
  },
  // 4: de goede strijd gestreden, de loop geeindigd, het geloof behouden - de kroon der rechtvaardigheid
  '2-timotheus-bijbelquiz-deel-4': {
    hue: 259,
    mood: 'gold',
    draw: (c) => [
      base(c, { sunX: 704, sunY: 232, sunR: 84, rays: true, far: 'none', ground: 'flat', horizon: 512 }),
      c.soft(704, 300, 200, 0.3),
      person(704, 512, 1.4, c.p.fore, 'raise'),
      crown(704, 350, 0.65, c.p.accent),
      fg(c, 684, 14),
    ],
  },
};
