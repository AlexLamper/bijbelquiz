import { AnalyticsEvent, Quiz, User, UserProgress, connectDB } from '@/database';
import type { ICategory } from '@/database';

import { getInternalAccountCount, premiumUserFilter } from './internal-accounts';
import { ROUTE_GROUP_LABELS, SITE_ROUTES, type RouteGroup, type SiteRoute, routeLabel } from './routes';

/**
 * Everything the statistics page reads.
 *
 * Deliberately separate from `funnel.ts`. That file answers a small set of
 * money questions and is the thing to look at weekly; this one answers "what
 * is actually being used", which is a different job with a different shape -
 * broad, comparative, and mostly useful for deciding what to delete.
 *
 * Two rules run through all of it.
 *
 * Counting is done on *visits* wherever the question is "what share of
 * people", not on events, because one enthusiastic reloader would otherwise
 * outvote twenty visitors. `session_start` is the unit for that.
 *
 * Nothing here invents a denominator. A control's click rate is measured
 * against the visits that actually saw it, and a quiz's finish rate against
 * the times it was started - not against traffic, which would make every
 * number look like a failure and none of them comparable.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEZONE = 'Europe/Amsterdam';

export const WINDOW_CHOICES = [7, 30, 90, 365] as const;
export type WindowDays = (typeof WINDOW_CHOICES)[number];

export function readWindowDays(value: unknown): WindowDays {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return (WINDOW_CHOICES as readonly number[]).includes(parsed) ? (parsed as WindowDays) : 30;
}

function since(windowDays: number): Date {
  return new Date(Date.now() - windowDays * DAY_MS);
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/**
 * One identity per person, whichever half of it exists.
 *
 * Signed-in rows carry a user id, signed-out ones a browser-local random id,
 * and the same person usually produces both during a visit. Preferring the
 * account id means a visitor who signs in mid-session is counted once, not
 * twice - the anonymous half of their visit merges into the account.
 */
const VISITOR_KEY = {
  $ifNull: [{ $toString: '$userId' }, { $ifNull: ['$anonymousId', 'onbekend'] }],
};

function dayKey(field = '$createdAt') {
  return { $dateToString: { format: '%Y-%m-%d', date: field, timezone: TIMEZONE } };
}

// ───────────────────────────────────────────────────────────────────────────
// Overview
// ───────────────────────────────────────────────────────────────────────────

export interface OverviewReport {
  windowDays: number;
  events: number;
  pageViews: number;
  sessions: number;
  visitors: number;
  clicks: number;
  /** Share of visits that were signed in, 0-100. */
  signedInShare: number;
  pagesPerSession: number;
  totalUsers: number;
  newUsers: number;
  /** Paying accounts. Developer and app-reviewer accounts are not counted. */
  premiumUsers: number;
  premiumShare: number;
  /** How many premium accounts were left out as internal. */
  internalPremiumExcluded: number;
  /** Accounts that have played at all, and the share of all accounts. */
  activatedUsers: number;
  activationRate: number;
  activeDay: number;
  activeWeek: number;
  activeMonth: number;
  quizPlays: number;
  quizPlayers: number;
  avgScorePct: number;
  /** True once any automatic usage event has ever landed. */
  hasUsageData: boolean;
}

export async function getOverview(windowDays: number): Promise<OverviewReport> {
  await connectDB();
  const from = since(windowDays);

  const [premiumFilter, internalPremiumExcluded] = await Promise.all([
    premiumUserFilter(),
    getInternalAccountCount(),
  ]);

  const [
    events,
    pageViews,
    sessions,
    clicks,
    visitorRows,
    signedInSessions,
    totalUsers,
    newUsers,
    premiumUsers,
    activatedUsers,
    activeDay,
    activeWeek,
    activeMonth,
    playRows,
    usageProbe,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({ createdAt: { $gte: from } }),
    AnalyticsEvent.countDocuments({ name: 'page_view', createdAt: { $gte: from } }),
    AnalyticsEvent.countDocuments({ name: 'session_start', createdAt: { $gte: from } }),
    AnalyticsEvent.countDocuments({ name: 'ui_click', createdAt: { $gte: from } }),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: VISITOR_KEY } },
      { $count: 'total' },
    ]),
    AnalyticsEvent.countDocuments({
      name: 'session_start',
      createdAt: { $gte: from },
      'props.signedIn': true,
    }),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: from } }),
    User.countDocuments(premiumFilter),
    User.countDocuments({ quizzesPlayed: { $gte: 1 } }),
    User.countDocuments({ lastPlayedAt: { $gte: since(1) } }),
    User.countDocuments({ lastPlayedAt: { $gte: since(7) } }),
    User.countDocuments({ lastPlayedAt: { $gte: since(30) } }),
    UserProgress.aggregate([
      { $match: { completedAt: { $gte: from } } },
      {
        $group: {
          _id: null,
          plays: { $sum: 1 },
          players: { $addToSet: '$userId' },
          scoreSum: { $sum: '$score' },
          questionSum: { $sum: '$totalQuestions' },
        },
      },
    ]),
    AnalyticsEvent.countDocuments({ name: { $in: ['page_view', 'session_start'] } }),
  ]);

  const play = playRows[0];
  const visitors = visitorRows[0]?.total ?? 0;

  return {
    windowDays,
    events,
    pageViews,
    sessions,
    visitors,
    clicks,
    signedInShare: pct(signedInSessions, sessions),
    pagesPerSession: sessions > 0 ? Math.round((pageViews / sessions) * 10) / 10 : 0,
    totalUsers,
    newUsers,
    premiumUsers,
    premiumShare: pct(premiumUsers, totalUsers),
    internalPremiumExcluded,
    activatedUsers,
    activationRate: pct(activatedUsers, totalUsers),
    activeDay,
    activeWeek,
    activeMonth,
    quizPlays: play?.plays ?? 0,
    quizPlayers: play?.players?.length ?? 0,
    avgScorePct: pct(play?.scoreSum ?? 0, play?.questionSum ?? 0),
    hasUsageData: usageProbe > 0,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Time of day and day by day
// ───────────────────────────────────────────────────────────────────────────

export interface DailyPoint {
  date: string;
  label: string;
  pageViews: number;
  sessions: number;
  quizzes: number;
  signups: number;
}

export async function getDailySeries(windowDays: number): Promise<DailyPoint[]> {
  await connectDB();
  const from = since(windowDays);

  const [eventRows, signupRows] = await Promise.all([
    AnalyticsEvent.aggregate([
      {
        $match: {
          name: { $in: ['page_view', 'session_start', 'quiz_completed'] },
          createdAt: { $gte: from },
        },
      },
      { $group: { _id: { day: dayKey(), name: '$name' }, count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: dayKey(), count: { $sum: 1 } } },
    ]),
  ]);

  const byDay = new Map<string, DailyPoint>();

  // Every day in the window gets a row, including the empty ones. A chart that
  // silently skips quiet days reads as a smooth line over a gap.
  for (let i = windowDays - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * DAY_MS);
    const key = date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    byDay.set(key, {
      date: key,
      label: date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: TIMEZONE }),
      pageViews: 0,
      sessions: 0,
      quizzes: 0,
      signups: 0,
    });
  }

  for (const row of eventRows) {
    const point = byDay.get(row._id.day);
    if (!point) continue;
    if (row._id.name === 'page_view') point.pageViews = row.count;
    if (row._id.name === 'session_start') point.sessions = row.count;
    if (row._id.name === 'quiz_completed') point.quizzes = row.count;
  }

  for (const row of signupRows) {
    const point = byDay.get(row._id);
    if (point) point.signups = row.count;
  }

  return [...byDay.values()];
}

export interface HourPoint {
  hour: number;
  events: number;
}

/** When people actually use this, in local time. Drives nothing; explains a lot. */
export async function getHourlyActivity(windowDays: number): Promise<HourPoint[]> {
  await connectDB();

  const rows = await AnalyticsEvent.aggregate([
    { $match: { name: 'page_view', createdAt: { $gte: since(windowDays) } } },
    { $group: { _id: { $hour: { date: '$createdAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
  ]);

  const counts = new Map<number, number>(rows.map((row) => [row._id as number, row.count as number]));
  return Array.from({ length: 24 }, (_, hour) => ({ hour, events: counts.get(hour) ?? 0 }));
}

// ───────────────────────────────────────────────────────────────────────────
// Pages
// ───────────────────────────────────────────────────────────────────────────

export interface PageRow {
  path: string;
  label: string | null;
  group: RouteGroup | null;
  groupLabel: string | null;
  views: number;
  visitors: number;
  entries: number;
  clicks: number;
  share: number;
  /** In the route inventory. False means an undocumented or stale URL. */
  known: boolean;
}

export interface PageReport {
  totalViews: number;
  rows: PageRow[];
  /** Routes that exist and had no visitors at all in the window. */
  unused: SiteRoute[];
  /** Routes with traffic, but under one visit a week. */
  lowTraffic: PageRow[];
  /** Measured paths that are not in the inventory. Usually a stale link. */
  unknown: PageRow[];
}

export async function getPageReport(windowDays: number): Promise<PageReport> {
  await connectDB();
  const from = since(windowDays);

  const [viewRows, clickRows] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { name: 'page_view', createdAt: { $gte: from } } },
      {
        $group: {
          _id: '$props.path',
          views: { $sum: 1 },
          entries: { $sum: { $cond: [{ $eq: ['$props.isEntry', true] }, 1, 0] } },
          visitors: { $addToSet: VISITOR_KEY },
        },
      },
      { $project: { views: 1, entries: 1, visitors: { $size: '$visitors' } } },
      { $sort: { views: -1 } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate([
      { $match: { name: 'ui_click', createdAt: { $gte: from } } },
      { $group: { _id: '$props.path', clicks: { $sum: 1 } } },
    ]),
  ]);

  const clicksByPath = new Map<string, number>(
    clickRows.map((row) => [String(row._id), row.clicks as number]),
  );

  const totalViews = viewRows.reduce((sum, row) => sum + (row.views as number), 0);
  const byPath = new Map<string, SiteRoute>(SITE_ROUTES.map((route) => [route.path, route]));

  const rows: PageRow[] = viewRows
    .filter((row) => typeof row._id === 'string' && row._id.length > 0)
    .map((row) => {
      const path = String(row._id);
      const route = byPath.get(path);
      return {
        path,
        label: route?.label ?? routeLabel(path),
        group: route?.group ?? null,
        groupLabel: route ? ROUTE_GROUP_LABELS[route.group] : null,
        views: row.views as number,
        visitors: row.visitors as number,
        entries: row.entries as number,
        clicks: clicksByPath.get(path) ?? 0,
        share: pct(row.views as number, totalViews),
        known: Boolean(route),
      };
    });

  const measured = new Set(rows.map((row) => row.path));
  const weeks = Math.max(1, windowDays / 7);

  return {
    totalViews,
    rows,
    unused: SITE_ROUTES.filter((route) => !measured.has(route.path)),
    lowTraffic: rows.filter((row) => row.visitors > 0 && row.visitors < weeks),
    unknown: rows.filter((row) => !row.known),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Controls
// ───────────────────────────────────────────────────────────────────────────

export interface ControlRow {
  id: string;
  label: string;
  kind: string;
  clicks: number;
  clickers: number;
  /** Visits in which this control came into view at least once. */
  impressions: number;
  /** Clicks per impression, 0-100. Above 100 is possible and means repeat use. */
  clickRate: number;
  /** Where it was pressed, most common first. */
  paths: string[];
  lastClickAt: Date | null;
}

export interface ControlReport {
  totalClicks: number;
  rows: ControlRow[];
  /**
   * Seen often enough to be a fair test, never pressed. This is the list to
   * read when deciding what can go.
   */
  dead: ControlRow[];
  /** Pressed, but by almost nobody relative to how often it is offered. */
  ignored: ControlRow[];
  /** How many visits it takes before "never pressed" counts as evidence. */
  deadThreshold: number;
}

export async function getControlReport(windowDays: number): Promise<ControlReport> {
  await connectDB();
  const from = since(windowDays);

  const [clickRows, seenRows] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { name: 'ui_click', createdAt: { $gte: from } } },
      {
        $group: {
          _id: '$props.id',
          clicks: { $sum: 1 },
          clickers: { $addToSet: VISITOR_KEY },
          label: { $last: '$props.label' },
          kind: { $last: '$props.kind' },
          paths: { $push: '$props.path' },
          lastClickAt: { $max: '$createdAt' },
        },
      },
      { $project: { clicks: 1, label: 1, kind: 1, paths: 1, lastClickAt: 1, clickers: { $size: '$clickers' } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate([
      { $match: { name: 'ui_seen', createdAt: { $gte: from } } },
      {
        $group: {
          _id: '$props.id',
          impressions: { $sum: 1 },
          label: { $last: '$props.label' },
          kind: { $last: '$props.kind' },
        },
      },
    ]).allowDiskUse(true),
  ]);

  const rows = new Map<string, ControlRow>();

  const ensure = (id: string, label: unknown, kind: unknown): ControlRow => {
    const existing = rows.get(id);
    if (existing) return existing;
    const created: ControlRow = {
      id,
      label: typeof label === 'string' && label ? label : id,
      kind: typeof kind === 'string' ? kind : 'button',
      clicks: 0,
      clickers: 0,
      impressions: 0,
      clickRate: 0,
      paths: [],
      lastClickAt: null,
    };
    rows.set(id, created);
    return created;
  };

  for (const row of seenRows) {
    if (typeof row._id !== 'string' || !row._id) continue;
    ensure(row._id, row.label, row.kind).impressions = row.impressions as number;
  }

  for (const row of clickRows) {
    if (typeof row._id !== 'string' || !row._id) continue;
    const entry = ensure(row._id, row.label, row.kind);
    entry.clicks = row.clicks as number;
    entry.clickers = row.clickers as number;
    entry.lastClickAt = (row.lastClickAt as Date) ?? null;
    if (typeof row.label === 'string' && row.label) entry.label = row.label;

    const tally = new Map<string, number>();
    for (const path of (row.paths as unknown[]) ?? []) {
      if (typeof path !== 'string') continue;
      tally.set(path, (tally.get(path) ?? 0) + 1);
    }
    entry.paths = [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([path]) => path);
  }

  const all = [...rows.values()];
  for (const row of all) {
    row.clickRate = pct(row.clicks, row.impressions);
  }
  all.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

  // Scaled to the window rather than fixed: five sightings is convincing over a
  // week and meaningless over a year.
  const deadThreshold = Math.max(5, Math.round(windowDays / 3));

  return {
    totalClicks: all.reduce((sum, row) => sum + row.clicks, 0),
    rows: all,
    dead: all
      .filter((row) => row.clicks === 0 && row.impressions >= deadThreshold)
      .sort((a, b) => b.impressions - a.impressions),
    ignored: all
      .filter((row) => row.clicks > 0 && row.impressions >= deadThreshold && row.clickRate < 1)
      .sort((a, b) => a.clickRate - b.clickRate),
    deadThreshold,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Theme
// ───────────────────────────────────────────────────────────────────────────

export interface ThemeReport {
  sessions: { light: number; dark: number; total: number; darkShare: number };
  /** What the visitor had *chosen*, as opposed to what they ended up looking at. */
  setting: { light: number; dark: number; system: number; unknown: number };
  switches: { toDark: number; toLight: number };
  accounts: { light: number; dark: number; system: number; total: number };
  byDevice: Array<{ device: string; light: number; dark: number; darkShare: number }>;
}

export async function getThemeReport(windowDays: number): Promise<ThemeReport> {
  await connectDB();
  const from = since(windowDays);

  const [themeRows, settingRows, switchRows, accountRows] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { name: 'session_start', createdAt: { $gte: from } } },
      { $group: { _id: { theme: '$props.theme', device: '$props.device' }, count: { $sum: 1 } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { name: 'session_start', createdAt: { $gte: from } } },
      { $group: { _id: '$props.themeSetting', count: { $sum: 1 } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { name: 'theme_changed', createdAt: { $gte: from } } },
      { $group: { _id: '$props.to', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $group: { _id: { $ifNull: ['$settings.themePreference', 'light'] }, count: { $sum: 1 } } },
    ]),
  ]);

  const sessions = { light: 0, dark: 0, total: 0, darkShare: 0 };
  const devices = new Map<string, { device: string; light: number; dark: number; darkShare: number }>();

  for (const row of themeRows) {
    const theme = String(row._id?.theme ?? '');
    const device = String(row._id?.device ?? 'onbekend');
    const count = row.count as number;

    sessions.total += count;
    if (theme === 'dark') sessions.dark += count;
    else if (theme === 'light') sessions.light += count;

    const entry = devices.get(device) ?? { device, light: 0, dark: 0, darkShare: 0 };
    if (theme === 'dark') entry.dark += count;
    else if (theme === 'light') entry.light += count;
    devices.set(device, entry);
  }

  sessions.darkShare = pct(sessions.dark, sessions.total);

  const byDevice = [...devices.values()]
    .map((entry) => ({ ...entry, darkShare: pct(entry.dark, entry.light + entry.dark) }))
    .sort((a, b) => b.light + b.dark - (a.light + a.dark));

  const readCounts = (rows: Array<{ _id: unknown; count: number }>) => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(String(row._id ?? 'unknown'), row.count);
    return map;
  };

  const settings = readCounts(settingRows as Array<{ _id: unknown; count: number }>);
  const switches = readCounts(switchRows as Array<{ _id: unknown; count: number }>);
  const accounts = readCounts(accountRows as Array<{ _id: unknown; count: number }>);

  return {
    sessions,
    setting: {
      light: settings.get('light') ?? 0,
      dark: settings.get('dark') ?? 0,
      system: settings.get('system') ?? 0,
      unknown: settings.get('unknown') ?? 0,
    },
    switches: { toDark: switches.get('dark') ?? 0, toLight: switches.get('light') ?? 0 },
    accounts: {
      light: accounts.get('light') ?? 0,
      dark: accounts.get('dark') ?? 0,
      system: accounts.get('system') ?? 0,
      total: [...accounts.values()].reduce((sum, n) => sum + n, 0),
    },
    byDevice,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Devices and acquisition
// ───────────────────────────────────────────────────────────────────────────

export interface DeviceReport {
  devices: Array<{ device: string; sessions: number; share: number }>;
  platforms: Array<{ platform: string; events: number; share: number }>;
  viewports: Array<{ bucket: string; sessions: number; share: number }>;
  languages: Array<{ language: string; sessions: number }>;
}

const VIEWPORT_BOUNDS = [0, 480, 640, 768, 1024, 1280, 1440, 1920, 100000];

const VIEWPORT_LABELS: Record<string, string> = {
  '0': 'tot 480px',
  '480': '480 - 639px',
  '640': '640 - 767px',
  '768': '768 - 1023px',
  '1024': '1024 - 1279px',
  '1280': '1280 - 1439px',
  '1440': '1440 - 1919px',
  '1920': '1920px en breder',
};

export async function getDeviceReport(windowDays: number): Promise<DeviceReport> {
  await connectDB();
  const from = since(windowDays);

  const [deviceRows, platformRows, viewportRows, languageRows] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { name: 'session_start', createdAt: { $gte: from } } },
      { $group: { _id: '$props.device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          name: 'session_start',
          createdAt: { $gte: from },
          'props.viewportWidth': { $type: 'number' },
        },
      },
      {
        $bucket: {
          groupBy: '$props.viewportWidth',
          boundaries: VIEWPORT_BOUNDS,
          default: 'anders',
          output: { count: { $sum: 1 } },
        },
      },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { name: 'session_start', createdAt: { $gte: from } } },
      { $group: { _id: '$props.language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const sessionTotal = deviceRows.reduce((sum, row) => sum + (row.count as number), 0);
  const eventTotal = platformRows.reduce((sum, row) => sum + (row.count as number), 0);
  const viewportTotal = viewportRows.reduce((sum, row) => sum + (row.count as number), 0);

  return {
    devices: deviceRows.map((row) => ({
      device: String(row._id ?? 'onbekend'),
      sessions: row.count as number,
      share: pct(row.count as number, sessionTotal),
    })),
    platforms: platformRows.map((row) => ({
      platform: String(row._id ?? 'onbekend'),
      events: row.count as number,
      share: pct(row.count as number, eventTotal),
    })),
    viewports: viewportRows.map((row) => ({
      bucket: VIEWPORT_LABELS[String(row._id)] ?? String(row._id),
      sessions: row.count as number,
      share: pct(row.count as number, viewportTotal),
    })),
    languages: languageRows
      .filter((row) => typeof row._id === 'string')
      .map((row) => ({ language: String(row._id), sessions: row.count as number })),
  };
}

export interface AcquisitionReport {
  referrers: Array<{ host: string; sessions: number; share: number }>;
  campaigns: Array<{ campaign: string; source: string; sessions: number }>;
  entryPages: Array<{ path: string; label: string | null; sessions: number; share: number }>;
  directSessions: number;
  directShare: number;
  totalSessions: number;
}

export async function getAcquisitionReport(windowDays: number): Promise<AcquisitionReport> {
  await connectDB();
  const from = since(windowDays);
  const match = { name: 'session_start', createdAt: { $gte: from } };

  const [referrerRows, campaignRows, entryRows, totalSessions] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { ...match, 'props.referrerHost': { $type: 'string' } } },
      { $group: { _id: '$props.referrerHost', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...match, 'props.utmSource': { $type: 'string' } } },
      {
        $group: {
          _id: { campaign: '$props.utmCampaign', source: '$props.utmSource' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: match },
      { $group: { _id: '$props.entryPath', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    AnalyticsEvent.countDocuments(match),
  ]);

  const referred = referrerRows.reduce((sum, row) => sum + (row.count as number), 0);
  const direct = Math.max(0, totalSessions - referred);

  return {
    referrers: referrerRows.map((row) => ({
      host: String(row._id),
      sessions: row.count as number,
      share: pct(row.count as number, totalSessions),
    })),
    campaigns: campaignRows.map((row) => ({
      campaign: String(row._id?.campaign ?? 'zonder naam'),
      source: String(row._id?.source ?? 'onbekend'),
      sessions: row.count as number,
    })),
    entryPages: entryRows
      .filter((row) => typeof row._id === 'string')
      .map((row) => ({
        path: String(row._id),
        label: routeLabel(String(row._id)),
        sessions: row.count as number,
        share: pct(row.count as number, totalSessions),
      })),
    directSessions: direct,
    directShare: pct(direct, totalSessions),
    totalSessions,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Quizzes
// ───────────────────────────────────────────────────────────────────────────

export interface QuizRow {
  quizId: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  isPremium: boolean;
  status: string;
  questionCount: number;
  /** Opens of the start screen, from page views on `/quiz/[id]`. */
  views: number;
  starts: number;
  completions: number;
  abandons: number;
  /** Completions per start, 0-100. */
  finishRate: number;
  /** Attempts recorded in `UserProgress`, which predates the event stream. */
  plays: number;
  players: number;
  avgScorePct: number;
  lastPlayedAt: Date | null;
}

export interface QuizReport {
  rows: QuizRow[];
  totalPlays: number;
  totalPlayers: number;
  /** Published quizzes with no attempt in the window. */
  neverPlayed: QuizRow[];
  byCategory: Array<{
    category: string;
    quizzes: number;
    plays: number;
    players: number;
    avgScorePct: number;
  }>;
  byDifficulty: Array<{ difficulty: string; quizzes: number; plays: number; avgScorePct: number }>;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Makkelijk',
  beginner: 'Makkelijk',
  medium: 'Gemiddeld',
  intermediate: 'Gemiddeld',
  hard: 'Moeilijk',
  advanced: 'Moeilijk',
};

export async function getQuizReport(windowDays: number): Promise<QuizReport> {
  await connectDB();
  const from = since(windowDays);

  const [quizzes, progressRows, eventRows, viewRows] = await Promise.all([
    Quiz.find()
      .populate('categoryId', 'title')
      .select('title slug difficulty isPremium status questions categoryId')
      .lean(),
    UserProgress.aggregate([
      { $match: { completedAt: { $gte: from } } },
      {
        $group: {
          _id: '$quizId',
          plays: { $sum: 1 },
          players: { $addToSet: '$userId' },
          scoreSum: { $sum: '$score' },
          questionSum: { $sum: '$totalQuestions' },
          lastPlayedAt: { $max: '$completedAt' },
        },
      },
      {
        $project: {
          plays: 1,
          scoreSum: 1,
          questionSum: 1,
          lastPlayedAt: 1,
          players: { $size: '$players' },
        },
      },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate([
      {
        $match: {
          name: { $in: ['quiz_started', 'quiz_completed', 'quiz_abandoned'] },
          createdAt: { $gte: from },
        },
      },
      { $group: { _id: { quizId: '$props.quizId', name: '$name' }, count: { $sum: 1 } } },
    ]),
    // `param` is whatever was in the URL, which is the slug for a shared link
    // and the raw id for anything that linked by id. Both are resolved below.
    AnalyticsEvent.aggregate([
      { $match: { name: 'page_view', 'props.path': '/quiz/[id]', createdAt: { $gte: from } } },
      { $group: { _id: '$props.param', count: { $sum: 1 } } },
    ]),
  ]);

  const progressById = new Map<string, (typeof progressRows)[number]>(
    progressRows.map((row) => [String(row._id), row]),
  );

  const eventCounts = new Map<string, { started: number; completed: number; abandoned: number }>();
  for (const row of eventRows) {
    const quizId = String(row._id?.quizId ?? '');
    if (!quizId) continue;
    const entry = eventCounts.get(quizId) ?? { started: 0, completed: 0, abandoned: 0 };
    if (row._id.name === 'quiz_started') entry.started = row.count as number;
    if (row._id.name === 'quiz_completed') entry.completed = row.count as number;
    if (row._id.name === 'quiz_abandoned') entry.abandoned = row.count as number;
    eventCounts.set(quizId, entry);
  }

  const viewsByParam = new Map<string, number>();
  for (const row of viewRows) {
    if (typeof row._id !== 'string') continue;
    viewsByParam.set(row._id, row.count as number);
  }

  const rows: QuizRow[] = quizzes.map((quiz) => {
    const quizId = String(quiz._id);
    const slug = quiz.slug ?? '';
    const progress = progressById.get(quizId);
    const events = eventCounts.get(quizId) ?? { started: 0, completed: 0, abandoned: 0 };
    const views = (viewsByParam.get(slug) ?? 0) + (viewsByParam.get(quizId) ?? 0);
    const difficulty = String(quiz.difficulty ?? 'medium').toLowerCase();

    return {
      quizId,
      title: quiz.title,
      slug,
      category: (quiz.categoryId as ICategory | undefined)?.title ?? 'Zonder categorie',
      difficulty: DIFFICULTY_LABELS[difficulty] ?? difficulty,
      isPremium: Boolean(quiz.isPremium),
      status: quiz.status ?? 'approved',
      questionCount: quiz.questions?.length ?? 0,
      views,
      starts: events.started,
      completions: events.completed,
      abandons: events.abandoned,
      finishRate: pct(events.completed, events.started),
      plays: progress?.plays ?? 0,
      players: progress?.players ?? 0,
      avgScorePct: pct(progress?.scoreSum ?? 0, progress?.questionSum ?? 0),
      lastPlayedAt: (progress?.lastPlayedAt as Date | undefined) ?? null,
    };
  });

  rows.sort((a, b) => b.plays - a.plays || b.views - a.views || a.title.localeCompare(b.title));

  const groupBy = <T extends string>(key: (row: QuizRow) => T) => {
    const map = new Map<T, { quizzes: number; plays: number; players: number; scoreSum: number; questionSum: number }>();
    for (const row of rows) {
      const bucket = map.get(key(row)) ?? { quizzes: 0, plays: 0, players: 0, scoreSum: 0, questionSum: 0 };
      bucket.quizzes += 1;
      bucket.plays += row.plays;
      bucket.players += row.players;
      // Recomputed from the per-quiz average rather than carried through: the
      // raw sums are per quiz and this only needs the weighted mean.
      bucket.scoreSum += (row.avgScorePct / 100) * row.plays;
      bucket.questionSum += row.plays;
      map.set(key(row), bucket);
    }
    return map;
  };

  const categories = groupBy((row) => row.category);
  const difficulties = groupBy((row) => row.difficulty);

  return {
    rows,
    totalPlays: rows.reduce((sum, row) => sum + row.plays, 0),
    totalPlayers: rows.reduce((sum, row) => sum + row.players, 0),
    neverPlayed: rows.filter((row) => row.plays === 0 && row.status === 'approved'),
    byCategory: [...categories.entries()]
      .map(([category, bucket]) => ({
        category,
        quizzes: bucket.quizzes,
        plays: bucket.plays,
        players: bucket.players,
        avgScorePct: pct(bucket.scoreSum, bucket.questionSum),
      }))
      .sort((a, b) => b.plays - a.plays),
    byDifficulty: [...difficulties.entries()]
      .map(([difficulty, bucket]) => ({
        difficulty,
        quizzes: bucket.quizzes,
        plays: bucket.plays,
        avgScorePct: pct(bucket.scoreSum, bucket.questionSum),
      }))
      .sort((a, b) => b.plays - a.plays),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Accounts
// ───────────────────────────────────────────────────────────────────────────

export interface UserReport {
  total: number;
  newInWindow: number;
  /** Paying accounts only; see `internal-accounts.ts`. */
  premium: number;
  premiumShare: number;
  internalPremiumExcluded: number;
  hosts: number;
  neverPlayed: number;
  avgQuizzesPlayed: number;
  levels: Array<{ level: number; title: string; users: number }>;
  streaks: { withStreak: number; longest: number };
  /** Signed up in the window and played at least once. */
  activatedNew: number;
  activatedNewShare: number;
}

export async function getUserReport(windowDays: number): Promise<UserReport> {
  await connectDB();
  const from = since(windowDays);

  const [premiumFilter, internalPremiumExcluded] = await Promise.all([
    premiumUserFilter(),
    getInternalAccountCount(),
  ]);

  const [total, newInWindow, premium, hosts, neverPlayed, activatedNew, aggregates, levelRows] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: from } }),
      User.countDocuments(premiumFilter),
      User.countDocuments({ multiplayerGamesHosted: { $gte: 1 } }),
      User.countDocuments({ $or: [{ quizzesPlayed: { $lte: 0 } }, { quizzesPlayed: { $exists: false } }] }),
      User.countDocuments({ createdAt: { $gte: from }, quizzesPlayed: { $gte: 1 } }),
      User.aggregate([
        {
          $group: {
            _id: null,
            avgQuizzes: { $avg: { $ifNull: ['$quizzesPlayed', 0] } },
            withStreak: { $sum: { $cond: [{ $gte: ['$streak', 1] }, 1, 0] } },
            longest: { $max: '$bestStreak' },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$level', 1] },
            title: { $last: '$levelTitle' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 20 },
      ]),
    ]);

  const stats = aggregates[0];

  return {
    total,
    newInWindow,
    premium,
    premiumShare: pct(premium, total),
    internalPremiumExcluded,
    hosts,
    neverPlayed,
    avgQuizzesPlayed: Math.round((stats?.avgQuizzes ?? 0) * 10) / 10,
    levels: levelRows.map((row) => ({
      level: row._id as number,
      title: (row.title as string) ?? '',
      users: row.count as number,
    })),
    streaks: { withStreak: stats?.withStreak ?? 0, longest: stats?.longest ?? 0 },
    activatedNew,
    activatedNewShare: pct(activatedNew, newInWindow),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Raw tail
// ───────────────────────────────────────────────────────────────────────────

export interface EventTypeRow {
  name: string;
  count: number;
  lastAt: Date | null;
}

/** Every event name with a volume, so a broken client is obvious at a glance. */
export async function getEventBreakdown(windowDays: number): Promise<EventTypeRow[]> {
  await connectDB();

  const rows = await AnalyticsEvent.aggregate([
    { $match: { createdAt: { $gte: since(windowDays) } } },
    { $group: { _id: '$name', count: { $sum: 1 }, lastAt: { $max: '$createdAt' } } },
    { $sort: { count: -1 } },
  ]);

  return rows.map((row) => ({
    name: String(row._id),
    count: row.count as number,
    lastAt: (row.lastAt as Date) ?? null,
  }));
}
