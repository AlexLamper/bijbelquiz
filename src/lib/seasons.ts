/**
 * Seasonal quiz packs.
 *
 * A hand-edited list, on purpose. There are three of these a year, they are
 * chosen by a person for reasons no rule captures, and a CMS for three rows is
 * more moving parts than the thing it manages. Editing this file and shipping
 * is the whole workflow.
 *
 * The dates are computed rather than typed, because Advent and Lent move every
 * year and a hardcoded table is a promise to forget it next December.
 *
 * What still needs a human: `categorySlug` (or `quizIds`) on each entry. Until
 * one is set the pack still shows its countdown, but with no quizzes behind
 * it, so the API returns an empty list and the cards stay hidden.
 */

export interface SeasonPack {
  slug: string;
  title: string;
  /** One line under the title on the card. */
  description: string;
  startsAt: Date;
  endsAt: Date;
  /** Preferred: the whole category is the pack. */
  categorySlug?: string;
  /** Or a hand-picked set, when no single category fits. */
  quizIds?: string[];
}

/**
 * Easter Sunday, Gregorian, by the Meeus/Jones/Butcher algorithm.
 *
 * Lent is defined backwards from Easter, so this is unavoidable if the dates
 * are to be right without a lookup table somebody has to maintain.
 */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** End of the given day, so a pack runs through its last date inclusive. */
function endOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

/**
 * The first Sunday of Advent: the fourth Sunday before 25 December.
 */
function adventStart(year: number): Date {
  const christmas = new Date(Date.UTC(year, 11, 25));
  // Sunday is 0, so this is how many days back the Sunday before Christmas is;
  // a Christmas that falls on a Sunday counts as that fourth Sunday itself.
  const daysSinceSunday = christmas.getUTCDay();
  const fourthSunday = addDays(christmas, -(daysSinceSunday === 0 ? 0 : daysSinceSunday));
  return addDays(fourthSunday, -21);
}

/**
 * Every pack that exists in the given year.
 *
 * Exported so the admin screen and the tests can see the whole calendar rather
 * than only whatever happens to be live today.
 */
export function seasonsForYear(year: number): SeasonPack[] {
  const easter = easterSunday(year);
  // Ash Wednesday: 46 days before Easter (40 fasting days, Sundays excluded).
  const ashWednesday = addDays(easter, -46);

  return [
    {
      slug: 'seizoensstart',
      title: 'Nieuw seizoen',
      description:
        'Het clubseizoen begint weer. Een pak vragen om samen mee te openen.',
      startsAt: new Date(Date.UTC(year, 8, 1)),
      endsAt: endOfDay(new Date(Date.UTC(year, 8, 30))),
      // TODO: tag the September quizzes in /beheer and set the slug here.
    },
    {
      slug: 'veertigdagentijd',
      title: 'Veertigdagentijd',
      description:
        'Van Aswoensdag tot Pasen: veertig dagen onderweg naar het paasverhaal.',
      startsAt: ashWednesday,
      endsAt: endOfDay(easter),
      // TODO: tag the Lent quizzes in /beheer and set the slug here.
    },
    {
      slug: 'advent',
      title: 'Advent',
      description: 'Vier weken aftellen naar Kerst, met een quiz per week.',
      startsAt: adventStart(year),
      endsAt: endOfDay(new Date(Date.UTC(year, 11, 25))),
      // TODO: tag the Advent quizzes in /beheer and set the slug here.
    },
  ];
}

/**
 * The pack that is live right now, or null.
 *
 * Checks last year's calendar as well, because Advent runs into a date range
 * that never crosses a year boundary today but would the moment somebody adds
 * a pack ending in January.
 */
export function currentSeason(now: Date = new Date()): SeasonPack | null {
  const year = now.getUTCFullYear();
  const candidates = [...seasonsForYear(year - 1), ...seasonsForYear(year)];

  const live = candidates.find(
    (season) => now >= season.startsAt && now <= season.endsAt,
  );

  return live ?? null;
}

/** Whole days left, rounded up, so the last day reads "nog 1 dag". */
export function daysRemaining(season: SeasonPack, now: Date = new Date()): number {
  const ms = season.endsAt.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
