import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import {
  WINDOW_CHOICES,
  getAcquisitionReport,
  getControlReport,
  getDailySeries,
  getDeviceReport,
  getEventBreakdown,
  getHourlyActivity,
  getOverview,
  getPageReport,
  getQuizReport,
  getThemeReport,
  getUserReport,
  readWindowDays,
  type DailyPoint,
} from '@/lib/analytics/insights';
import { ROUTE_GROUP_LABELS } from '@/lib/analytics/routes';
import { getAudienceStats } from '@/lib/admin/audience';
import { METHOD_KEYS, METHOD_LABELS, PLATFORM_KEYS, PLATFORM_LABELS as SIGNUP_PLATFORM_LABELS, type PlatformKey } from '@/lib/admin/platform-labels';
import { PREMIUM_SOURCES, PREMIUM_SOURCE_LABELS, type PremiumSource } from '@/lib/admin/grant-options';
import { PLATFORM_TONE, PlatformLegend, StackedWeekChart } from '@/components/web2/beheer-users/charts';
import { cn } from '@/lib/utils';
import { AdminPageHeader } from '@/components/bq/AdminShell';
import {
  ColumnChart,
  EmptyRow,
  Grid,
  HBarList,
  Meter,
  Mono,
  Note,
  Panel,
  Pct,
  RowTitle,
  SectionHeading,
  ShareBar,
  StackedLabel,
  StatCard,
  TableCard,
  Tag,
  Td,
  Th,
  ValueItem,
  ValueList,
  formatDate,
  formatDecimal,
  formatNumber,
  formatShare,
  formatWhole,
  type FillTone,
} from '@/components/web2/beheer-2/parts';

export const metadata: Metadata = {
  title: 'Statistieken - BijbelQuiz beheer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Telefoon',
  tablet: 'Tablet',
  desktop: 'Desktop',
  onbekend: 'Onbekend',
};

const PLATFORM_LABELS: Record<string, string> = {
  web: 'Website',
  ios: 'iOS-app',
  android: 'Android-app',
  onbekend: 'Onbekend',
};

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Paginaweergave',
  ui_click: 'Klik op knop of link',
  ui_seen: 'Knop in beeld',
  session_start: 'Bezoek gestart',
  theme_changed: 'Thema gewisseld',
  quiz_started: 'Quiz gestart',
  quiz_completed: 'Quiz afgerond',
  quiz_abandoned: 'Quiz afgebroken',
  room_started: 'Spel gestart',
  room_joined: 'Speler deed mee',
  room_invite_shared: 'Uitnodiging gedeeld',
  paywall_shown: 'Paywall getoond',
  paywall_dismissed: 'Paywall weggeklikt',
  purchase_completed: 'Aankoop',
  trial_started: 'Proefperiode gestart',
  trial_converted: 'Proefperiode omgezet',
  streak_broken: 'Streak verbroken',
};

const QUIZ_STATUS_LABELS: Record<string, string> = {
  pending: 'In afwachting',
  rejected: 'Afgewezen',
  draft: 'Concept',
};

const SECTIONS = [
  ['gebruikers', 'Gebruikers en herkomst'],
  ['verloop', 'Verloop'],
  ['paginas', "Pagina's"],
  ['knoppen', 'Knoppen en links'],
  ['thema', 'Licht of donker'],
  ['apparaten', 'Apparaten'],
  ['herkomst', 'Herkomst'],
  ['quizzen', 'Quizzen'],
  ['accounts', 'Accounts'],
  ['meting', 'Meting'],
] as const;

const FILL_CLASS: Record<FillTone, string> = {
  lapis: 'bg-lapis',
  gold: 'bg-gold',
  coral: 'bg-coral',
  green: 'bg-green',
  muted: 'bg-edge',
};

/** Rotates the first three non-zero rows through lapis, coral and grey. */
const SERIES_TONES: FillTone[] = ['lapis', 'coral', 'muted'];

interface PageProps {
  searchParams: Promise<{ dagen?: string }>;
}

/** "zo 25 okt" for the peak line under a daily chart. */
function dayWithWeekday(point: DailyPoint): string {
  const weekday = new Date(`${point.date}T12:00:00Z`)
    .toLocaleDateString('nl-NL', { weekday: 'short', timeZone: 'Europe/Amsterdam' })
    .replace('.', '');
  return `${weekday} ${point.label}`;
}

/** First, middle and last day under a daily chart. */
function dayLabels(points: DailyPoint[]): Array<[number, string]> {
  if (points.length === 0) return [];
  if (points.length === 1) return [[0, points[0].label]];
  const middle = Math.floor(points.length / 2);
  return [
    [0, points[0].label],
    [middle, points[middle].label],
    [points.length - 1, points[points.length - 1].label],
  ];
}

function DailyPanel({
  title,
  points,
  read,
  unit,
  tone = 'lapis',
}: {
  title: string;
  points: DailyPoint[];
  read: (point: DailyPoint) => number;
  unit: string;
  tone?: 'lapis' | 'green';
}) {
  const total = points.reduce((sum, point) => sum + read(point), 0);
  const peak = points.reduce<DailyPoint | null>((best, point) => (!best || read(point) > read(best) ? point : best), null);
  const peakValue = peak ? read(peak) : 0;
  return (
    <Panel
      title={title}
      meta={peak && peakValue > 0 ? `piek ${formatNumber(peakValue)} op ${dayWithWeekday(peak)} · totaal ${formatNumber(total)}` : `totaal ${formatNumber(total)}`}
    >
      <ColumnChart
        tone={tone}
        label={`${points.length} dagen, hoogste waarde ${formatNumber(peakValue)}`}
        points={points.map((point) => ({ value: read(point), title: `${point.label}: ${formatNumber(read(point))} ${unit}` }))}
        xLabels={dayLabels(points)}
      />
    </Panel>
  );
}

/**
 * Everything that is measured about how this product is used, on one page.
 *
 * The split with `/beheer/funnel` is intentional. That page answers the money
 * questions and is worth reading weekly. This one answers "what is actually
 * being used" - which pages, which quizzes, which buttons - and is worth
 * reading before deciding what to build, and especially what to delete.
 */
export default async function StatisticsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const params = await searchParams;
  const windowDays = readWindowDays(params?.dagen);

  const [audience, overview, daily, hourly, pages, controls, theme, devices, acquisition, quizzes, users, events] = await Promise.all([
    getAudienceStats(),
    getOverview(windowDays),
    getDailySeries(windowDays),
    getHourlyActivity(windowDays),
    getPageReport(windowDays),
    getControlReport(windowDays),
    getThemeReport(windowDays),
    getDeviceReport(windowDays),
    getAcquisitionReport(windowDays),
    getQuizReport(windowDays),
    getUserReport(windowDays),
    getEventBreakdown(windowDays),
  ]);

  const maxQuizPlays = Math.max(1, ...quizzes.rows.map((row) => row.plays));
  const maxPageViews = Math.max(1, ...pages.rows.map((row) => row.views));
  const maxClicks = Math.max(1, ...controls.rows.map((row) => row.clicks));
  const maxViewport = Math.max(1, ...devices.viewports.map((row) => row.sessions));
  const maxDifficulty = Math.max(1, ...quizzes.byDifficulty.map((row) => row.plays));
  const hourPeak = Math.max(0, ...hourly.map((point) => point.events));

  return (
    <>
      <AdminPageHeader
        title="Statistieken"
        description={
          <>
            Wat er werkelijk gebruikt wordt: welke pagina&apos;s bezocht worden, welke knoppen ingedrukt worden, welke
            quizzen gespeeld worden en in welk thema mensen zitten. Beheerpagina&apos;s tellen zelf niet mee in de
            knopcijfers
            {overview.internalPremiumExcluded > 0
              ? `, en de ${overview.internalPremiumExcluded} test- en reviewaccounts tellen niet mee als premium`
              : ''}
            .
          </>
        }
        actions={
          <nav aria-label="Periode" className="flex gap-1 rounded-[12px] bg-segment p-1">
            {WINDOW_CHOICES.map((choice) => {
              const active = choice === windowDays;
              return (
                <Link
                  key={choice}
                  href={`/beheer/statistieken?dagen=${choice}`}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'inline-flex h-9 items-center whitespace-nowrap rounded-[8px] px-3.5 text-sm no-underline',
                    active
                      ? 'bg-card font-extrabold text-ink shadow-[0_0_0_1px_var(--line)] hover:text-ink'
                      : 'font-bold text-ink-soft hover:text-ink',
                  )}
                >
                  {choice === 365 ? '1 jaar' : `${choice} dagen`}
                </Link>
              );
            })}
          </nav>
        }
      />

      <nav aria-label="Op deze pagina" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] m:mx-0 m:px-0">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border border-line bg-card px-3 text-[13px] font-bold text-ink-soft no-underline hover:border-input-line hover:text-ink"
          >
            {label}
          </a>
        ))}
      </nav>

      {!overview.hasUsageData && (
        <Panel>
          <Note>
            Er zijn nog geen gebruiksgebeurtenissen binnengekomen. Dat is normaal vlak na een deploy: paginaweergaven,
            kliks en bezoeken schrijven zichzelf weg zodra iemand de site opent. De quiz- en accountcijfers hieronder
            komen uit de database en zijn wel meteen gevuld.
          </Note>
        </Panel>
      )}

      {/* ── Headline ─────────────────────────────────────────────────────── */}
      <Grid cols={4} variant="stats">
        <StatCard
          label="Bezoeken"
          value={formatNumber(overview.sessions)}
          meta={`${formatNumber(overview.visitors)} unieke bezoekers · ${formatDecimal(overview.pagesPerSession)} pagina's per bezoek`}
        />
        <StatCard
          label="Paginaweergaven"
          value={formatNumber(overview.pageViews)}
          meta={`${formatNumber(overview.clicks)} kliks op knoppen en links`}
        />
        <StatCard
          label="Quizzen gespeeld"
          value={formatNumber(overview.quizPlays)}
          meta={`door ${formatNumber(overview.quizPlayers)} accounts (gasten niet) · gemiddeld ${formatShare(overview.avgScorePct)} goed`}
        />
        <StatCard label="Ingelogd" value={formatShare(overview.signedInShare)} meta="van de bezoeken had een account" />
        <StatCard
          label="Accounts"
          value={formatNumber(overview.totalUsers)}
          meta={`${formatNumber(overview.newUsers)} nieuw in deze periode`}
        />
        <StatCard
          label="Premium"
          value={formatShare(overview.premiumShare)}
          tone={overview.premiumUsers > 0 ? 'positive' : 'neutral'}
          meta={`${formatNumber(overview.premiumUsers)} accounts met Premium${
            overview.internalPremiumExcluded > 0 ? ` · ${overview.internalPremiumExcluded} testaccounts niet meegeteld` : ''
          }`}
        />
        <StatCard
          label="Geactiveerd"
          value={formatShare(overview.activationRate)}
          meta={`${formatNumber(overview.activatedUsers)} accounts speelden ooit een quiz`}
        />
        <StatCard
          label="Actief"
          value={formatNumber(overview.activeMonth)}
          meta={`speelden in 30 dagen · ${formatNumber(overview.activeWeek)} in 7 dagen · ${formatNumber(overview.activeDay)} vandaag`}
        />
      </Grid>

      {/* ── Accounts by platform ─────────────────────────────────────────── */}
      <SectionHeading
        id="gebruikers"
        title="Gebruikers en herkomst"
        intro={`Waar accounts zijn aangemaakt (website op computer of mobiel, iOS- of Android-app), wie er actief is en wie Premium heeft. Deze cijfers staan vast op vandaag, 7 en 30 dagen en volgen de periodekeuze bovenaan niet.${
          audience.derivedPlatforms > 0
            ? ` Bij ${formatNumber(audience.derivedPlatforms)} accounts van voor deze meting is het platform afgeleid uit hun eerste activiteit (of een aankoop in de app); is er niets bekend, dan staat het als Onbekend.`
            : ''
        }`}
      />
      <Grid cols={4} variant="stats">
        <StatCard
          label="Nieuwe accounts"
          value={formatNumber(audience.registrations.days30.total)}
          meta={`in 30 dagen · ${formatNumber(audience.registrations.days7.total)} in 7 dagen · ${formatNumber(audience.registrations.today.total)} vandaag`}
        />
        <StatCard
          label="Actieve accounts"
          value={formatNumber(audience.active.days7.total)}
          meta={`in 7 dagen · ${formatNumber(audience.active.days30.total)} in 30 dagen · ${formatNumber(audience.active.today.total)} vandaag`}
        />
        <StatCard
          label="Gratis naar Premium"
          value={formatShare(audience.premium.conversion.total.rate)}
          tone={audience.premium.conversion.total.premium > 0 ? 'positive' : 'neutral'}
          meta={`${formatShare(audience.premium.conversion.paid.rate)} betaalt zelf · nieuwe accounts (30 dagen) ${formatShare(audience.premium.conversion.newLast30d.rate)}`}
        />
        <StatCard
          label="Behoud"
          value={formatShare(audience.retention.total.rate)}
          meta={`van ${formatNumber(audience.retention.total.cohort)} accounts ouder dan 30 dagen was in de laatste 7 dagen actief`}
        />
      </Grid>
      <Panel
        title="Nieuwe accounts per week"
        meta={`laatste 12 weken · totaal ${formatNumber(audience.registrations.weekly.reduce((sum, week) => sum + week.total, 0))}`}
      >
        <StackedWeekChart
          weeks={audience.registrations.weekly}
          label={`Nieuwe accounts per week, 12 weken, per platform`}
        />
        <PlatformLegend
          keys={PLATFORM_KEYS.filter((key) => audience.registrations.weekly.some((week) => (week.byPlatform[key] ?? 0) > 0))}
          totals={audience.registrations.weekly.reduce<Partial<Record<PlatformKey, number>>>((acc, week) => {
            for (const [key, value] of Object.entries(week.byPlatform)) acc[key as PlatformKey] = (acc[key as PlatformKey] ?? 0) + (value ?? 0);
            return acc;
          }, {})}
        />
      </Panel>
      <TableCard
        title="Per platform"
        description="Aangemeld: het platform waarop het account is gemaakt. Actief: gespeeld, de app geopend of ingelogd op de site; wie op twee platforms actief was telt bij allebei. Premium, conversie en behoud tellen zonder testaccounts."
        caption="Accounts per platform"
        minWidth={980}
        stickyFirst
        head={
          <>
            <Th>Platform</Th>
            <Th align="right">Accounts</Th>
            <Th align="right">Nieuw 7 d</Th>
            <Th align="right">Nieuw 30 d</Th>
            <Th align="right">Actief vandaag</Th>
            <Th align="right">Actief 7 d</Th>
            <Th align="right">Actief 30 d</Th>
            <Th align="right">Premium</Th>
            <Th align="right">Conversie</Th>
            <Th align="right">Behoud</Th>
          </>
        }
      >
        {PLATFORM_KEYS.filter(
          (key) => (audience.registrations.allTime.byPlatform[key] ?? 0) > 0 || (audience.active.days30.byPlatform[key] ?? 0) > 0,
        ).map((key) => {
          const conversion = audience.premium.conversion.byPlatform[key];
          const retention = audience.retention.byPlatform[key];
          return (
            <tr key={key}>
              <Td tone="strong">
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-[2px]', FILL_CLASS[PLATFORM_TONE[key]])} />
                  {SIGNUP_PLATFORM_LABELS[key]}
                </span>
              </Td>
              <Td align="right" numeric tone="strong">{formatNumber(audience.registrations.allTime.byPlatform[key] ?? 0)}</Td>
              <Td align="right" numeric>{formatNumber(audience.registrations.days7.byPlatform[key] ?? 0)}</Td>
              <Td align="right" numeric>{formatNumber(audience.registrations.days30.byPlatform[key] ?? 0)}</Td>
              <Td align="right" numeric>{formatNumber(audience.active.today.byPlatform[key] ?? 0)}</Td>
              <Td align="right" numeric>{formatNumber(audience.active.days7.byPlatform[key] ?? 0)}</Td>
              <Td align="right" numeric>{formatNumber(audience.active.days30.byPlatform[key] ?? 0)}</Td>
              <Td align="right" numeric>{formatNumber(audience.premium.bySignupPlatform[key] ?? 0)}</Td>
              <Td align="right" numeric>{conversion && conversion.accounts > 0 ? formatShare(conversion.rate) : '-'}</Td>
              <Td align="right" numeric>{retention && retention.cohort > 0 ? formatShare(retention.rate) : '-'}</Td>
            </tr>
          );
        })}
        <tr className="[&>td]:border-t-line">
          <Td tone="strong">Totaal</Td>
          <Td align="right" numeric tone="strong">{formatNumber(audience.registrations.allTime.total)}</Td>
          <Td align="right" numeric tone="strong">{formatNumber(audience.registrations.days7.total)}</Td>
          <Td align="right" numeric tone="strong">{formatNumber(audience.registrations.days30.total)}</Td>
          <Td align="right" numeric tone="strong">{formatNumber(audience.active.today.total)}</Td>
          <Td align="right" numeric tone="strong">{formatNumber(audience.active.days7.total)}</Td>
          <Td align="right" numeric tone="strong">{formatNumber(audience.active.days30.total)}</Td>
          <Td align="right" numeric tone="strong">{formatNumber(audience.premium.total)}</Td>
          <Td align="right" numeric tone="strong">{formatShare(audience.premium.conversion.total.rate)}</Td>
          <Td align="right" numeric tone="strong">{audience.retention.total.cohort > 0 ? formatShare(audience.retention.total.rate) : '-'}</Td>
        </tr>
      </TableCard>
      <Grid cols={3}>
        <Panel title="Premium per bron" meta={`${formatNumber(audience.premium.total)} accounts`}>
          <ShareBar
            empty="Nog niemand met Premium."
            shares={PREMIUM_SOURCES.map((source: PremiumSource, index) => ({
              label: PREMIUM_SOURCE_LABELS[source],
              value: audience.premium.bySource[source],
              tone: (['gold', 'lapis', 'coral', 'green', 'muted'] as FillTone[])[index],
            }))}
            caption={`Elk account telt één keer, bij de eerste bron in deze volgorde.${
              audience.premium.grantsActive > 0
                ? ` ${formatNumber(audience.premium.grantsActive)} keer Premium van beheer actief${audience.premium.grantsExpiringIn7d > 0 ? `, ${formatNumber(audience.premium.grantsExpiringIn7d)} loopt binnen 7 dagen af` : ''}.`
                : ''
            }`}
          />
        </Panel>
        <Panel title="Inlogmethode bij aanmelden" meta={`${formatNumber(audience.totalUsers)} accounts`}>
          <ShareBar
            shares={METHOD_KEYS.map((key, index) => ({
              label: METHOD_LABELS[key],
              value: audience.byMethod[key] ?? 0,
              tone: (['lapis', 'coral', 'green', 'muted'] as FillTone[])[index],
            }))}
            caption="Bij oudere accounts afgeleid: met wachtwoord is e-mail, anders Google of Apple."
          />
        </Panel>
        <Panel title="Quizzen gespeeld: app of web" meta={`30 dagen · ${formatNumber(audience.quizPlays.days30.total)}`}>
          <ShareBar
            empty="Nog geen afgeronde quizzen gemeten."
            shares={[
              { label: 'Website', value: audience.quizPlays.days30.byPlatform.web ?? 0, tone: 'lapis' },
              { label: 'iOS-app', value: audience.quizPlays.days30.byPlatform.ios ?? 0, tone: 'coral' },
              { label: 'Android-app', value: audience.quizPlays.days30.byPlatform.android ?? 0, tone: 'green' },
            ]}
            caption={`Afgeronde quizzen uit de metingen van website en app, ook van gasten. 7 dagen: ${formatNumber(audience.quizPlays.days7.total)}.`}
          />
        </Panel>
      </Grid>

      {/* ── Activity over time ───────────────────────────────────────────── */}
      <SectionHeading
        id="verloop"
        title="Verloop"
        intro="Elke grafiek heeft een eigen schaal die op nul begint. Ze naast elkaar leggen met één as zou de vergelijking onwaar maken, dus staan ze onder elkaar met dezelfde tijdlijn. Een dag is een kalenderdag in Nederlandse tijd, en de periode is vandaag plus de dagen ervoor."
      />
      <Grid cols={2}>
        <DailyPanel title="Paginaweergaven per dag" points={daily} read={(p) => p.pageViews} unit="weergaven" />
        <DailyPanel title="Bezoeken per dag" points={daily} read={(p) => p.sessions} unit="bezoeken" />
        <DailyPanel title="Afgeronde quizzen, ook gasten" points={daily} read={(p) => p.quizzes} unit="afgerond" tone="green" />
        <DailyPanel title="Nieuwe accounts per dag" points={daily} read={(p) => p.signups} unit="registraties" tone="green" />
      </Grid>
      <Panel title="Wanneer op de dag" meta="Europese tijd, Amsterdam">
        <ColumnChart
          narrow
          height={110}
          label={`24 uur, drukste uur ${formatNumber(hourPeak)} weergaven`}
          points={hourly.map((point) => ({
            value: point.events,
            title: `${String(point.hour).padStart(2, '0')}:00: ${formatNumber(point.events)} weergaven`,
          }))}
          xLabels={[
            [0, '00u'],
            [6, '06u'],
            [12, '12u'],
            [18, '18u'],
            [23, '23u'],
          ]}
        />
      </Panel>

      {/* ── Pages ────────────────────────────────────────────────────────── */}
      <SectionHeading
        id="paginas"
        title="Pagina's"
        intro="Geteld per routepatroon, niet per URL: alle quizpagina's samen vormen één regel, want de vraag is welk soort scherm het verkeer draagt. Instappen betekent: de eerste pagina van een bezoek."
      />
      <TableCard
        caption="Pagina's"
        minWidth={720}
        head={
          <>
            <Th>Pagina</Th>
            <Th align="right">Weergaven</Th>
            <Th align="right">Bezoekers</Th>
            <Th align="right">Instappen</Th>
            <Th align="right">Kliks</Th>
            <Th align="right">Aandeel</Th>
          </>
        }
      >
        {pages.rows.length === 0 ? (
          <EmptyRow columns={6}>Nog geen paginaweergaven gemeten.</EmptyRow>
        ) : (
          pages.rows.map((row) => (
            <tr key={row.path}>
              <Td style={{ minWidth: 260 }}>
                <RowTitle
                  title={row.label ?? row.path}
                  mono={row.path}
                  tags={
                    <>
                      {row.groupLabel && <Tag>{row.groupLabel}</Tag>}
                      {!row.known && <Tag tone="warning">Onbekend pad</Tag>}
                    </>
                  }
                >
                  <Meter value={row.views} max={maxPageViews} />
                </RowTitle>
              </Td>
              <Td align="right" numeric tone="strong">
                {formatNumber(row.views)}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.visitors)}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.entries)}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.clicks)}
              </Td>
              <Td align="right" numeric>
                {formatWhole(row.share)}
              </Td>
            </tr>
          ))
        )}
      </TableCard>
      <Grid cols={2}>
        <Panel title="Geen enkel bezoek" meta={`${pages.unused.length} routes`}>
          {pages.unused.length === 0 ? (
            <Note>Elke pagina die de site heeft is in deze periode minstens één keer geopend.</Note>
          ) : (
            <>
              <Note>
                Deze routes bestaan, maar niemand kwam er in de afgelopen {windowDays} dagen. Een publieke pagina
                hiertussen is een vindbaarheidsprobleem; een pagina achter een account is een kandidaat om weg te halen.
              </Note>
              <ValueList>
                {pages.unused.map((route) => (
                  <ValueItem key={route.path} label={<StackedLabel title={route.label} sub={route.path} />}>
                    <Tag tone={route.publicFacing ? 'warning' : 'neutral'}>
                      {route.publicFacing ? 'Publiek' : ROUTE_GROUP_LABELS[route.group]}
                    </Tag>
                  </ValueItem>
                ))}
              </ValueList>
            </>
          )}
        </Panel>
        <Panel title="Nauwelijks bezocht" meta={`${pages.lowTraffic.length} routes`}>
          {pages.lowTraffic.length === 0 ? (
            <Note>Elke bezochte pagina haalt meer dan één bezoeker per week.</Note>
          ) : (
            <>
              <Note>
                Minder dan één bezoeker per week. Nog niet dood, wel de moeite waard om te vragen of de pagina goed
                genoeg vindbaar is.
              </Note>
              <ValueList>
                {pages.lowTraffic.map((row) => (
                  <ValueItem key={row.path} label={<span className="font-bold text-ink-soft">{row.label ?? row.path}</span>}>
                    <span className="font-semibold text-ink-muted">
                      {formatNumber(row.visitors)} {row.visitors === 1 ? 'bezoeker' : 'bezoekers'}
                    </span>
                  </ValueItem>
                ))}
              </ValueList>
            </>
          )}
        </Panel>
      </Grid>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <SectionHeading
        id="knoppen"
        title="Knoppen en links"
        intro={`Elke knop en link wordt automatisch gemeten. "In beeld" telt de bezoeken waarin het element echt zichtbaar werd: dat is de eerlijke noemer, want iets wat altijd onder de vouw blijft is nooit aangeboden. Een klikratio boven 100% betekent dat mensen er meer dan één keer per bezoek op drukken.`}
      />
      <TableCard
        caption="Knoppen en links"
        minWidth={760}
        head={
          <>
            <Th>Element</Th>
            <Th align="right">Kliks</Th>
            <Th align="right">Personen</Th>
            <Th align="right">In beeld</Th>
            <Th align="right">Klikratio</Th>
            <Th align="right">Laatst</Th>
          </>
        }
        footer={
          controls.rows.length > 60 ? (
            <Note>
              De 60 meest gebruikte elementen worden getoond, van {formatNumber(controls.rows.length)} gemeten in totaal.
            </Note>
          ) : undefined
        }
      >
        {controls.rows.length === 0 ? (
          <EmptyRow columns={6}>Nog geen kliks gemeten. Deze tabel vult zich zodra bezoekers de site gebruiken.</EmptyRow>
        ) : (
          controls.rows.slice(0, 60).map((row) => (
            <tr key={row.id}>
              <Td style={{ minWidth: 260 }}>
                <RowTitle
                  title={row.label}
                  mono={row.id}
                  tags={<Tag tone={row.kind === 'link' ? 'accent' : 'neutral'}>{row.kind === 'link' ? 'Link' : 'Knop'}</Tag>}
                  sub={
                    row.paths.length > 0 ? (
                      <span className="block text-xs font-semibold leading-4 text-ink-muted">op {row.paths.join(', ')}</span>
                    ) : undefined
                  }
                >
                  <Meter value={row.clicks} max={maxClicks} />
                </RowTitle>
              </Td>
              <Td align="right" numeric tone="strong">
                {formatNumber(row.clicks)}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.clickers)}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.impressions)}
              </Td>
              <Td align="right" numeric>
                {row.impressions > 0 ? formatWhole(row.clickRate) : '-'}
              </Td>
              <Td align="right" numeric tone="muted">
                {formatDate(row.lastClickAt)}
              </Td>
            </tr>
          ))
        )}
      </TableCard>
      <Grid cols={2}>
        <Panel title="Nooit ingedrukt" meta={`${controls.dead.length} elementen`}>
          <Note>
            Minstens {controls.deadThreshold} keer in beeld geweest en geen enkele keer gebruikt. Dit is de lijst om langs
            te lopen als je iets wilt weghalen.
          </Note>
          {controls.dead.length === 0 ? (
            <Note>Elk element dat vaak genoeg in beeld kwam is ook ingedrukt.</Note>
          ) : (
            <ValueList>
              {controls.dead.slice(0, 20).map((row) => (
                <ValueItem key={row.id} label={<StackedLabel title={row.label} sub={row.id} />}>
                  <span className="font-bold text-coral-text">{formatNumber(row.impressions)}× gezien, 0 kliks</span>
                </ValueItem>
              ))}
            </ValueList>
          )}
        </Panel>
        <Panel title="Bijna genegeerd" meta={`${controls.ignored.length} elementen`}>
          <Note>Wel gebruikt, maar door minder dan één op de honderd bezoeken die het element zagen.</Note>
          {controls.ignored.length === 0 ? (
            <Note>Geen elementen onder deze grens.</Note>
          ) : (
            <ValueList>
              {controls.ignored.slice(0, 20).map((row) => (
                <ValueItem key={row.id} label={<StackedLabel title={row.label} sub={row.id} />}>
                  <span className="font-semibold text-ink-muted">
                    {formatShare(row.clickRate)} van {formatNumber(row.impressions)}
                  </span>
                </ValueItem>
              ))}
            </ValueList>
          )}
        </Panel>
      </Grid>

      {/* ── Theme ────────────────────────────────────────────────────────── */}
      <SectionHeading
        id="thema"
        title="Licht of donker"
        intro="Gemeten per bezoek, niet per weergave, zodat iemand die twintig keer ververst niet twintig stemmen krijgt. Het thema dat mensen kozen kan afwijken van het thema waar ze in zaten: wie op 'systeem' staat, krijgt wat het apparaat zegt."
      />
      <Grid cols={3}>
        <Panel title="Waar bezoeken in draaiden">
          <ShareBar
            shares={[
              { label: 'Licht', value: theme.sessions.light, tone: 'lapis' },
              { label: 'Donker', value: theme.sessions.dark, tone: 'coral' },
            ]}
            caption={`${formatWhole(theme.sessions.darkShare)} van de bezoeken zat in donkere modus.`}
          />
        </Panel>
        <Panel title="Wat mensen instelden">
          <ShareBar
            shares={[
              { label: 'Licht gekozen', value: theme.setting.light, tone: 'lapis' },
              { label: 'Donker gekozen', value: theme.setting.dark, tone: 'coral' },
              { label: 'Systeem laten kiezen', value: theme.setting.system, tone: 'muted' },
            ]}
            caption={`Wisselingen in deze periode: ${formatNumber(theme.switches.toDark)} naar donker, ${formatNumber(theme.switches.toLight)} terug naar licht.`}
          />
        </Panel>
        <Panel title="Voorkeur op accounts">
          <ShareBar
            shares={[
              { label: 'Licht', value: theme.accounts.light, tone: 'lapis' },
              { label: 'Donker', value: theme.accounts.dark, tone: 'coral' },
              { label: 'Systeem', value: theme.accounts.system, tone: 'muted' },
            ]}
            caption={`Opgeslagen op ${formatNumber(theme.accounts.total)} accounts. Dit is de instelling die meereist naar een ander apparaat.`}
          />
        </Panel>
      </Grid>
      {theme.byDevice.length > 0 && (
        <TableCard
          title="Per apparaat"
          caption="Per apparaat"
          minWidth={480}
          head={
            <>
              <Th>Apparaat</Th>
              <Th align="right">Licht</Th>
              <Th align="right">Donker</Th>
              <Th align="right">Aandeel donker</Th>
            </>
          }
        >
          {theme.byDevice.map((row) => (
            <tr key={row.device}>
              <Td valign="middle" tone="strong">
                {DEVICE_LABELS[row.device] ?? row.device}
              </Td>
              <Td valign="middle" align="right" numeric>
                {formatNumber(row.light)}
              </Td>
              <Td valign="middle" align="right" numeric>
                {formatNumber(row.dark)}
              </Td>
              <Td valign="middle" align="right" numeric tone="strong">
                {formatWhole(row.darkShare)}
              </Td>
            </tr>
          ))}
        </TableCard>
      )}

      {/* ── Devices ──────────────────────────────────────────────────────── */}
      <SectionHeading
        id="apparaten"
        title="Apparaten"
        intro="Schermbreedte bepaalt hoeveel ruimte een pagina krijgt. De breedteverdeling hieronder is de reden om een scherm wel of niet op twee kolommen te zetten."
      />
      <Grid cols={3}>
        <Panel title="Soort apparaat">
          <ShareBar
            shares={devices.devices.map((row, index) => ({
              label: DEVICE_LABELS[row.device] ?? row.device,
              value: row.sessions,
              tone: SERIES_TONES[Math.min(index, 2)],
            }))}
            empty="Nog geen bezoeken gemeten."
          />
        </Panel>
        <Panel title="Platform" meta="alle gebeurtenissen">
          <ShareBar
            shares={devices.platforms.map((row, index) => ({
              label: PLATFORM_LABELS[row.platform] ?? row.platform,
              value: row.events,
              tone: SERIES_TONES[Math.min(index, 2)],
            }))}
            caption="Website en app schrijven naar dezelfde meting, dus dit is de echte verdeling tussen de twee."
          />
        </Panel>
        <Panel title="Schermbreedte">
          {devices.viewports.length === 0 ? (
            <Note>Nog geen bezoeken gemeten.</Note>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {devices.viewports.map((row) => (
                <li key={row.bucket}>
                  <span className="flex items-baseline justify-between gap-3 text-sm leading-5">
                    <span className="min-w-0 truncate font-bold text-ink-soft">{row.bucket}</span>
                    <span className="whitespace-nowrap font-extrabold tabular-nums">
                      {formatNumber(row.sessions)}
                      <Pct>{formatWhole(row.share)}</Pct>
                    </span>
                  </span>
                  <Meter value={row.sessions} max={maxViewport} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Grid>

      {/* ── Acquisition ──────────────────────────────────────────────────── */}
      <SectionHeading
        id="herkomst"
        title="Waar bezoekers vandaan komen"
        intro="Alleen de host van de verwijzende site wordt bewaard, nooit het volledige adres. Rechtstreeks betekent: getypt, bladwijzer, app, of een verwijzer die door de browser verborgen wordt."
      />
      <Grid cols={3}>
        <Panel title="Verwijzers" meta={`${formatWhole(acquisition.directShare)} rechtstreeks`}>
          {acquisition.referrers.length === 0 ? (
            <Note>Alle {formatNumber(acquisition.totalSessions)} bezoeken kwamen rechtstreeks binnen.</Note>
          ) : (
            <ValueList>
              {acquisition.referrers.map((row) => (
                <ValueItem key={row.host} label={<span className="block truncate font-bold text-ink-soft">{row.host}</span>}>
                  <span className="font-extrabold">{formatNumber(row.sessions)}</span>
                  <Pct>{formatWhole(row.share)}</Pct>
                </ValueItem>
              ))}
            </ValueList>
          )}
        </Panel>
        <Panel title="Eerste pagina van een bezoek">
          {acquisition.entryPages.length === 0 ? (
            <Note>Nog geen bezoeken gemeten.</Note>
          ) : (
            <ValueList>
              {acquisition.entryPages.map((row) => (
                <ValueItem
                  key={row.path}
                  label={<span className="block truncate font-bold text-ink-soft">{row.label ?? row.path}</span>}
                >
                  <span className="font-extrabold">{formatNumber(row.sessions)}</span>
                  <Pct>{formatWhole(row.share)}</Pct>
                </ValueItem>
              ))}
            </ValueList>
          )}
        </Panel>
        <Panel title="Campagnes" meta="utm-parameters">
          {acquisition.campaigns.length === 0 ? (
            <Note>
              Geen campagnes gemeten. Zet <Mono>?utm_source=</Mono> achter een gedeelde link om te zien wat die oplevert.
            </Note>
          ) : (
            <ValueList>
              {acquisition.campaigns.map((row) => (
                <ValueItem
                  key={`${row.source}-${row.campaign}`}
                  label={
                    <span className="font-bold text-ink-soft">
                      {row.campaign} <span className="font-semibold text-ink-muted">via {row.source}</span>
                    </span>
                  }
                >
                  <span className="font-extrabold">{formatNumber(row.sessions)}</span>
                </ValueItem>
              ))}
            </ValueList>
          )}
        </Panel>
      </Grid>

      {/* ── Quizzes ──────────────────────────────────────────────────────── */}
      <SectionHeading
        id="quizzen"
        title="Quizzen"
        intro="Gespeeld komt uit de opgeslagen resultaten van accounts en klopt ook voor de tijd voordat deze meting bestond; elke herhaling telt als een poging, gasten tellen niet mee. Geopend, gestart en afgebroken komen uit de gebeurtenissen. Afmaakratio is afgerond gedeeld door gestart."
      />
      <Grid cols={4}>
        <StatCard
          label="Quizzen totaal"
          value={formatNumber(quizzes.rows.length)}
          meta={`${formatNumber(quizzes.neverPlayed.length)} niet gespeeld in deze periode`}
        />
        <StatCard
          label="Pogingen"
          value={formatNumber(quizzes.totalPlays)}
          meta={`over ${formatNumber(quizzes.rows.filter((row) => row.plays > 0).length)} verschillende quizzen`}
        />
        <StatCard
          label="Populairste"
          value={quizzes.rows[0]?.plays ? formatNumber(quizzes.rows[0].plays) : '0'}
          meta={quizzes.rows[0]?.plays ? quizzes.rows[0].title : 'Nog geen pogingen'}
        />
        <StatCard
          label="Categorieën"
          value={formatNumber(quizzes.byCategory.length)}
          meta={quizzes.byCategory[0] ? `meest gespeeld: ${quizzes.byCategory[0].category}` : undefined}
        />
      </Grid>
      <TableCard
        title="Per quiz"
        caption="Per quiz"
        minWidth={900}
        head={
          <>
            <Th>Quiz</Th>
            <Th align="right">Geopend</Th>
            <Th align="right">Gestart</Th>
            <Th align="right">Afgebroken</Th>
            <Th align="right">Gespeeld</Th>
            <Th align="right">Spelers</Th>
            <Th align="right">Gem. score</Th>
            <Th align="right">Laatst</Th>
          </>
        }
      >
        {quizzes.rows.length === 0 ? (
          <EmptyRow columns={8}>Er staan nog geen quizzen in de database.</EmptyRow>
        ) : (
          quizzes.rows.map((row) => (
            <tr key={row.quizId}>
              <Td style={{ minWidth: 280 }}>
                <RowTitle
                  title={row.title}
                  tags={
                    <>
                      {row.isPremium && <Tag tone="gold">Premium</Tag>}
                      {row.status !== 'approved' && <Tag tone="accent">{QUIZ_STATUS_LABELS[row.status] ?? row.status}</Tag>}
                    </>
                  }
                  sub={
                    <span className="mt-0.5 block text-xs font-semibold leading-4 text-ink-muted">
                      {row.category} · {row.difficulty} · {row.questionCount} vragen
                    </span>
                  }
                >
                  <Meter value={row.plays} max={maxQuizPlays} tone="green" />
                </RowTitle>
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.views)}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.starts)}
                {row.starts > 0 && (
                  <span className="block text-xs leading-4 text-ink-muted">{formatWhole(row.finishRate)} af</span>
                )}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.abandons)}
              </Td>
              <Td align="right" numeric tone="strong">
                {formatNumber(row.plays)}
              </Td>
              <Td align="right" numeric>
                {formatNumber(row.players)}
              </Td>
              <Td align="right" numeric>
                {row.plays > 0 ? formatWhole(row.avgScorePct) : '-'}
              </Td>
              <Td align="right" numeric tone="muted">
                {formatDate(row.lastPlayedAt)}
              </Td>
            </tr>
          ))
        )}
      </TableCard>
      <Grid cols={2}>
        <TableCard
          title="Per categorie"
          caption="Per categorie"
          minWidth={360}
          head={
            <>
              <Th>Categorie</Th>
              <Th align="right">Quizzen</Th>
              <Th align="right">Pogingen</Th>
              <Th align="right">Gem. score</Th>
            </>
          }
        >
          {quizzes.byCategory.length === 0 ? (
            <EmptyRow columns={4}>Nog geen categorieën.</EmptyRow>
          ) : (
            quizzes.byCategory.map((row) => (
              <tr key={row.category}>
                <Td valign="middle" tone="strong">
                  {row.category}
                </Td>
                <Td valign="middle" align="right" numeric>
                  {formatNumber(row.quizzes)}
                </Td>
                <Td valign="middle" align="right" numeric>
                  {formatNumber(row.plays)}
                </Td>
                <Td valign="middle" align="right" numeric>
                  {row.plays > 0 ? formatWhole(row.avgScorePct) : '-'}
                </Td>
              </tr>
            ))
          )}
        </TableCard>
        <Panel title="Niet gespeeld" meta={`${quizzes.neverPlayed.length} quizzen`}>
          {quizzes.neverPlayed.length === 0 ? (
            <Note>Elke gepubliceerde quiz is in deze periode minstens één keer gespeeld.</Note>
          ) : (
            <>
              <Note>
                Gepubliceerd, maar geen enkele poging in {windowDays} dagen. Als de quiz wel geopend werd, ligt het aan het
                startscherm; werd hij niet eens geopend, dan is het een vindbaarheidsprobleem.
              </Note>
              <ValueList>
                {quizzes.neverPlayed.slice(0, 25).map((row) => (
                  <ValueItem key={row.quizId} label={<StackedLabel title={row.title} sub={row.category} mono={false} />}>
                    <span className="font-semibold text-ink-muted">
                      {row.views > 0 ? `${formatNumber(row.views)}× geopend` : 'nooit geopend'}
                    </span>
                  </ValueItem>
                ))}
              </ValueList>
            </>
          )}
        </Panel>
      </Grid>
      {quizzes.byDifficulty.length > 0 && (
        <Panel title="Per moeilijkheid">
          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 m:grid-cols-3">
            {quizzes.byDifficulty.map((row) => (
              <li key={row.difficulty} className="min-w-0">
                <span className="block text-[15px] font-extrabold">{row.difficulty}</span>
                <span className="mt-0.5 block text-[13px] font-semibold leading-[18px] text-ink-muted tabular-nums">
                  {formatNumber(row.plays)} pogingen · {formatNumber(row.quizzes)} quizzen · gemiddeld{' '}
                  {formatWhole(row.avgScorePct)}
                </span>
                <Meter value={row.plays} max={maxDifficulty} tone="green" />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── Accounts ─────────────────────────────────────────────────────── */}
      <SectionHeading
        id="accounts"
        title="Accounts"
        intro="Gemeten op de gebruikersdocumenten zelf, dus deze cijfers gaan verder terug dan de gebeurtenissen."
      />
      <Grid cols={4}>
        <StatCard
          label="Nieuw geactiveerd"
          value={formatShare(users.activatedNewShare)}
          meta={`${formatNumber(users.activatedNew)} van ${formatNumber(users.newInWindow)} nieuwe accounts speelde een quiz`}
        />
        <StatCard
          label="Nooit gespeeld"
          value={formatNumber(users.neverPlayed)}
          meta="accounts zonder één afgeronde quiz"
          tone={users.neverPlayed > users.total / 2 ? 'warning' : 'neutral'}
        />
        <StatCard label="Hosts" value={formatNumber(users.hosts)} meta="accounts die ooit een spel startten" />
        <StatCard
          label="Gem. quizzen"
          value={formatDecimal(users.avgQuizzesPlayed)}
          meta={`pogingen per account · ${formatNumber(users.streaks.withStreak)} lopende streaks, langste ooit ${formatNumber(users.streaks.longest)}`}
        />
      </Grid>
      {users.levels.length > 0 && (
        <Panel title="Verdeling over niveaus" meta={`${formatNumber(users.total)} accounts`}>
          <HBarList
            label="Accounts per niveau"
            labelColumn="minmax(120px, 190px)"
            rows={users.levels.map((row) => ({
              label: `Niveau ${row.level}${row.title ? ` · ${row.title}` : ''}`,
              value: row.users,
              title: `Niveau ${row.level}: ${formatNumber(row.users)} accounts`,
            }))}
          />
        </Panel>
      )}

      {/* ── Ingest health ────────────────────────────────────────────────── */}
      <SectionHeading
        id="meting"
        title="Meting zelf"
        intro="Elk gebeurtenistype met zijn volume. Een type dat op nul staat terwijl dat niet zou moeten, betekent dat er ergens een meetpunt stuk is, en niet dat de functie niet gebruikt wordt."
      />
      <TableCard
        caption="Gebeurtenissen"
        minWidth={520}
        head={
          <>
            <Th>Gebeurtenis</Th>
            <Th align="right">Aantal</Th>
            <Th align="right">Laatst gezien</Th>
          </>
        }
        footer={
          <Note>
            Gebeurtenissen worden 400 dagen bewaard en daarna automatisch opgeruimd. Er wordt geen volledig webadres, geen
            IP-adres en geen tekst die iemand intypt vastgelegd: alleen het routepatroon, het label van een knop en de
            context van een bezoek.
          </Note>
        }
      >
        {events.length === 0 ? (
          <EmptyRow columns={3}>Nog niets binnengekomen in deze periode.</EmptyRow>
        ) : (
          events.map((row) => (
            <tr key={row.name}>
              <Td valign="middle">
                <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span className="font-extrabold text-ink">{EVENT_LABELS[row.name] ?? row.name}</span>
                  <Mono>{row.name}</Mono>
                </span>
              </Td>
              <Td valign="middle" align="right" numeric tone="strong">
                {formatNumber(row.count)}
              </Td>
              <Td valign="middle" align="right" numeric tone="muted">
                {formatDate(row.lastAt)}
              </Td>
            </tr>
          ))
        )}
      </TableCard>
    </>
  );
}
