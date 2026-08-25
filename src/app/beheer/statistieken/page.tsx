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
} from '@/lib/analytics/insights';
import { ROUTE_GROUP_LABELS } from '@/lib/analytics/routes';
import { cn } from '@/lib/utils';

import {
  BarSeries,
  DataTable,
  EmptyRow,
  Figure,
  FigureRow,
  HourBars,
  Meter,
  Panel,
  Row,
  Section,
  ShareBar,
  Tag,
  Td,
  Th,
  formatDate,
  formatNumber,
} from './parts';

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

interface PageProps {
  searchParams: Promise<{ dagen?: string }>;
}

/**
 * Everything that is measured about how this product is used, on one page.
 *
 * The split with `/beheer/funnel` is intentional. That page answers five money
 * questions and is worth reading weekly. This one answers "what is actually
 * being used" - which pages, which quizzes, which buttons - and is worth
 * reading before deciding what to build, and especially before deciding what
 * to delete. It is deliberately long: the useful parts are the tables near the
 * bottom, not the headline numbers at the top.
 */
export default async function StatisticsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const params = await searchParams;
  const windowDays = readWindowDays(params?.dagen);

  const [
    overview,
    daily,
    hourly,
    pages,
    controls,
    theme,
    devices,
    acquisition,
    quizzes,
    users,
    events,
  ] = await Promise.all([
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

  return (
    <div className="min-h-screen bg-paper pb-20 pt-8 lg:pt-10">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-rule pb-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              Beheercentrum
            </p>
            <h1 className="mt-3 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
              Statistieken
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
              Wat er werkelijk gebruikt wordt: welke pagina&apos;s bezocht worden, welke knoppen
              ingedrukt worden, welke quizzen gespeeld worden, en in welk thema mensen zitten.
              Beheerpagina&apos;s tellen zelf niet mee in de knopcijfers
              {overview.internalPremiumExcluded > 0
                ? `, en de ${overview.internalPremiumExcluded} test- en reviewaccounts tellen niet mee als premium`
                : ''}
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Periode" className="flex gap-1.5">
              {WINDOW_CHOICES.map((choice) => (
                <Link
                  key={choice}
                  href={`/beheer/statistieken?dagen=${choice}`}
                  className={cn(
                    'inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors',
                    choice === windowDays
                      ? 'border-ink bg-ink text-ink-inverted'
                      : 'border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink',
                  )}
                >
                  {choice === 365 ? '1 jaar' : `${choice} dagen`}
                </Link>
              ))}
            </nav>

            <Link
              href="/beheer/funnel"
              className="inline-flex h-9 items-center rounded-md border border-rule bg-paper-raised px-3 text-sm text-ink hover:bg-paper-sunken"
            >
              Funnel
            </Link>
            <Link
              href="/beheer"
              className="inline-flex h-9 items-center rounded-md border border-rule bg-paper-raised px-3 text-sm text-ink hover:bg-paper-sunken"
            >
              Beheer
            </Link>
          </div>
        </header>

        {!overview.hasUsageData && (
          <div className="mt-6 rounded-lg border border-lapis/35 bg-lapis-tint p-4">
            <p className="text-sm leading-relaxed text-ink">
              Er zijn nog geen gebruiksgebeurtenissen binnengekomen. Dat is normaal vlak na een
              deploy: paginaweergaven, kliks en bezoeken schrijven zichzelf weg zodra iemand de site
              opent. De quiz- en accountcijfers hieronder komen uit de database en zijn wel meteen
              gevuld.
            </p>
          </div>
        )}

        {/* ── Headline ───────────────────────────────────────────────────── */}
        <div className="mt-8 space-y-6">
          <FigureRow>
            <Figure
              label="Bezoeken"
              value={formatNumber(overview.sessions)}
              meta={`${formatNumber(overview.visitors)} unieke bezoekers · ${overview.pagesPerSession} pagina's per bezoek`}
            />
            <Figure
              label="Paginaweergaven"
              value={formatNumber(overview.pageViews)}
              meta={`${formatNumber(overview.clicks)} kliks op knoppen en links`}
            />
            <Figure
              label="Quizzen gespeeld"
              value={formatNumber(overview.quizPlays)}
              meta={`door ${formatNumber(overview.quizPlayers)} spelers · gemiddeld ${overview.avgScorePct}% goed`}
            />
            <Figure
              label="Ingelogd"
              value={`${overview.signedInShare}%`}
              meta="van de bezoeken had een account"
            />
          </FigureRow>

          <FigureRow>
            <Figure
              label="Accounts"
              value={formatNumber(overview.totalUsers)}
              meta={`${formatNumber(overview.newUsers)} nieuw in deze periode`}
            />
            <Figure
              label="Premium"
              value={`${overview.premiumShare}%`}
              meta={`${formatNumber(overview.premiumUsers)} betalende accounts${
                overview.internalPremiumExcluded > 0
                  ? ` · ${overview.internalPremiumExcluded} testaccounts niet meegeteld`
                  : ''
              }`}
              tone={overview.premiumUsers > 0 ? 'positive' : 'neutral'}
            />
            <Figure
              label="Geactiveerd"
              value={`${overview.activationRate}%`}
              meta={`${formatNumber(overview.activatedUsers)} accounts speelden ooit een quiz`}
            />
            <Figure
              label="Actief"
              value={formatNumber(overview.activeMonth)}
              meta={`speelden deze maand · ${formatNumber(overview.activeWeek)} deze week · ${formatNumber(overview.activeDay)} vandaag`}
            />
          </FigureRow>
        </div>

        {/* ── Activity over time ─────────────────────────────────────────── */}
        <Section
          title="Verloop"
          intro="Elke grafiek heeft een eigen schaal die op nul begint. Ze naast elkaar leggen met één as zou de vergelijking onwaar maken, dus staan ze onder elkaar met dezelfde tijdlijn."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Paginaweergaven per dag">
              <BarSeries
                points={daily.map((point) => ({
                  label: point.label,
                  value: point.pageViews,
                  title: `${point.label}: ${formatNumber(point.pageViews)} weergaven`,
                }))}
              />
            </Panel>

            <Panel title="Bezoeken per dag">
              <BarSeries
                points={daily.map((point) => ({
                  label: point.label,
                  value: point.sessions,
                  title: `${point.label}: ${formatNumber(point.sessions)} bezoeken`,
                }))}
              />
            </Panel>

            <Panel title="Afgeronde quizzen per dag">
              <BarSeries
                accent={2}
                points={daily.map((point) => ({
                  label: point.label,
                  value: point.quizzes,
                  title: `${point.label}: ${formatNumber(point.quizzes)} afgerond`,
                }))}
              />
            </Panel>

            <Panel title="Nieuwe accounts per dag">
              <BarSeries
                accent={2}
                points={daily.map((point) => ({
                  label: point.label,
                  value: point.signups,
                  title: `${point.label}: ${formatNumber(point.signups)} registraties`,
                }))}
              />
            </Panel>
          </div>

          <div className="mt-5">
            <Panel title="Wanneer op de dag" meta="Europese tijd, Amsterdam">
              <HourBars points={hourly} />
            </Panel>
          </div>
        </Section>

        {/* ── Pages ──────────────────────────────────────────────────────── */}
        <Section
          title="Pagina's"
          intro="Geteld per routepatroon, niet per URL: alle quizpagina's samen vormen één regel, want de vraag is welk soort scherm het verkeer draagt. Instappen betekent: de eerste pagina van een bezoek."
        >
          <DataTable
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
                <Row key={row.path}>
                  <Td strong>
                    <span className="flex flex-wrap items-center gap-2">
                      {row.label ?? row.path}
                      {row.groupLabel && <Tag>{row.groupLabel}</Tag>}
                      {!row.known && <Tag tone="warning">Onbekend pad</Tag>}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">{row.path}</span>
                    <Meter value={row.views} max={maxPageViews} />
                  </Td>
                  <Td align="right" strong>
                    {formatNumber(row.views)}
                  </Td>
                  <Td align="right">{formatNumber(row.visitors)}</Td>
                  <Td align="right">{formatNumber(row.entries)}</Td>
                  <Td align="right">{formatNumber(row.clicks)}</Td>
                  <Td align="right">{row.share}%</Td>
                </Row>
              ))
            )}
          </DataTable>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Geen enkel bezoek" meta={`${pages.unused.length} routes`}>
              {pages.unused.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Elke pagina die de site heeft is in deze periode minstens één keer geopend.
                </p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Deze routes bestaan, maar niemand kwam er in de afgelopen {windowDays} dagen. Een
                    publieke pagina hiertussen is een vindbaarheidsprobleem; een pagina achter een
                    account is een kandidaat om weg te halen.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {pages.unused.map((route) => (
                      <li key={route.path} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-ink">{route.label}</span>
                        <span className="font-mono text-[11px] text-ink-muted">{route.path}</span>
                        <Tag tone={route.publicFacing ? 'warning' : 'neutral'}>
                          {route.publicFacing ? 'Publiek' : ROUTE_GROUP_LABELS[route.group]}
                        </Tag>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>

            <Panel title="Nauwelijks bezocht" meta={`${pages.lowTraffic.length} routes`}>
              {pages.lowTraffic.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Elke bezochte pagina haalt meer dan één bezoeker per week.
                </p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Minder dan één bezoeker per week. Nog niet dood, wel de moeite waard om te vragen
                    of de pagina goed genoeg vindbaar is.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {pages.lowTraffic.map((row) => (
                      <li key={row.path} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                        <span className="text-ink-soft">{row.label ?? row.path}</span>
                        <span className="tabular-nums text-ink-muted">
                          {formatNumber(row.visitors)} bezoekers
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>
        </Section>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <Section
          title="Knoppen en links"
          intro={`Elke knop en link wordt automatisch gemeten. "In beeld" telt de bezoeken waarin het element daadwerkelijk zichtbaar werd - dat is de eerlijke noemer, want iets wat altijd onder de vouw blijft is nooit aangeboden. Klikratio boven 100% betekent dat mensen er meer dan één keer per bezoek op drukken.`}
        >
          <DataTable
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
          >
            {controls.rows.length === 0 ? (
              <EmptyRow columns={6}>
                Nog geen kliks gemeten. Deze tabel vult zich zodra bezoekers de site gebruiken.
              </EmptyRow>
            ) : (
              controls.rows.slice(0, 60).map((row) => (
                <Row key={row.id}>
                  <Td strong>
                    <span className="flex flex-wrap items-center gap-2">
                      {row.label}
                      <Tag tone={row.kind === 'link' ? 'accent' : 'neutral'}>
                        {row.kind === 'link' ? 'Link' : 'Knop'}
                      </Tag>
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">{row.id}</span>
                    {row.paths.length > 0 && (
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        op {row.paths.join(', ')}
                      </span>
                    )}
                    <Meter value={row.clicks} max={maxClicks} />
                  </Td>
                  <Td align="right" strong>
                    {formatNumber(row.clicks)}
                  </Td>
                  <Td align="right">{formatNumber(row.clickers)}</Td>
                  <Td align="right">{formatNumber(row.impressions)}</Td>
                  <Td align="right">{row.impressions > 0 ? `${row.clickRate}%` : '—'}</Td>
                  <Td align="right" muted>
                    {formatDate(row.lastClickAt)}
                  </Td>
                </Row>
              ))
            )}
          </DataTable>

          {controls.rows.length > 60 && (
            <p className="mt-2 text-xs text-ink-muted">
              De 60 meest gebruikte elementen worden getoond, van {formatNumber(controls.rows.length)}{' '}
              gemeten in totaal.
            </p>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Nooit ingedrukt" meta={`${controls.dead.length} elementen`}>
              <p className="text-sm leading-relaxed text-ink-muted">
                Minstens {controls.deadThreshold} keer in beeld geweest en geen enkele keer gebruikt.
                Dit is de lijst om langs te lopen als je iets wilt weghalen.
              </p>
              {controls.dead.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Elk element dat vaak genoeg in beeld kwam is ook ingedrukt.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {controls.dead.slice(0, 20).map((row) => (
                    <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{row.label}</span>
                        <span className="block font-mono text-[11px] text-ink-muted">{row.id}</span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-vermilion">
                        {formatNumber(row.impressions)}× gezien, 0 kliks
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Bijna genegeerd" meta={`${controls.ignored.length} elementen`}>
              <p className="text-sm leading-relaxed text-ink-muted">
                Wel gebruikt, maar door minder dan één op de honderd bezoeken die het element zagen.
              </p>
              {controls.ignored.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">Geen elementen onder deze grens.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {controls.ignored.slice(0, 20).map((row) => (
                    <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{row.label}</span>
                        <span className="block font-mono text-[11px] text-ink-muted">{row.id}</span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-ink-muted">
                        {row.clickRate}% van {formatNumber(row.impressions)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </Section>

        {/* ── Theme ──────────────────────────────────────────────────────── */}
        <Section
          title="Licht of donker"
          intro="Gemeten per bezoek, niet per weergave, zodat iemand die twintig keer ververst niet twintig stemmen krijgt. Het thema dat mensen kozen kan afwijken van het thema waar ze in zaten: wie op 'systeem' staat, krijgt wat het apparaat zegt."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Waar bezoeken in draaiden">
              <ShareBar
                shares={[
                  { label: 'Licht', value: theme.sessions.light, accent: 1 },
                  { label: 'Donker', value: theme.sessions.dark, accent: 2 },
                ]}
                caption={`${theme.sessions.darkShare}% van de bezoeken zat in donkere modus.`}
              />
            </Panel>

            <Panel title="Wat mensen instelden">
              <ShareBar
                shares={[
                  { label: 'Licht gekozen', value: theme.setting.light, accent: 1 },
                  { label: 'Donker gekozen', value: theme.setting.dark, accent: 2 },
                  { label: 'Systeem laten kiezen', value: theme.setting.system, accent: 'muted' },
                ]}
                caption={`Wisselingen in deze periode: ${formatNumber(theme.switches.toDark)} naar donker, ${formatNumber(theme.switches.toLight)} terug naar licht.`}
              />
            </Panel>

            <Panel title="Voorkeur op accounts">
              <ShareBar
                shares={[
                  { label: 'Licht', value: theme.accounts.light, accent: 1 },
                  { label: 'Donker', value: theme.accounts.dark, accent: 2 },
                  { label: 'Systeem', value: theme.accounts.system, accent: 'muted' },
                ]}
                caption={`Opgeslagen op ${formatNumber(theme.accounts.total)} accounts. Dit is de instelling die meereist naar een ander apparaat.`}
              />
            </Panel>
          </div>

          {theme.byDevice.length > 0 && (
            <div className="mt-5">
              <DataTable
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
                  <Row key={row.device}>
                    <Td strong>{DEVICE_LABELS[row.device] ?? row.device}</Td>
                    <Td align="right">{formatNumber(row.light)}</Td>
                    <Td align="right">{formatNumber(row.dark)}</Td>
                    <Td align="right" strong>
                      {row.darkShare}%
                    </Td>
                  </Row>
                ))}
              </DataTable>
            </div>
          )}
        </Section>

        {/* ── Devices ────────────────────────────────────────────────────── */}
        <Section
          title="Apparaten"
          intro="Schermbreedte bepaalt hoeveel ruimte een pagina krijgt. De breedteverdeling hieronder is de reden om een scherm wel of niet op twee kolommen te zetten."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Soort apparaat">
              <ShareBar
                shares={devices.devices.map((row, index) => ({
                  label: DEVICE_LABELS[row.device] ?? row.device,
                  value: row.sessions,
                  accent: index === 0 ? 1 : index === 1 ? 2 : 'muted',
                }))}
              />
            </Panel>

            <Panel title="Platform" meta="alle gebeurtenissen">
              <ShareBar
                shares={devices.platforms.map((row, index) => ({
                  label: PLATFORM_LABELS[row.platform] ?? row.platform,
                  value: row.events,
                  accent: index === 0 ? 1 : index === 1 ? 2 : 'muted',
                }))}
                caption="Website en app schrijven naar dezelfde meting, dus dit is de echte verdeling tussen de twee."
              />
            </Panel>

            <Panel title="Schermbreedte">
              {devices.viewports.length === 0 ? (
                <p className="text-sm text-ink-muted">Nog geen bezoeken gemeten.</p>
              ) : (
                <ul className="space-y-2">
                  {devices.viewports.map((row) => (
                    <li key={row.bucket}>
                      <span className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-ink-soft">{row.bucket}</span>
                        <span className="tabular-nums text-ink">
                          {formatNumber(row.sessions)}
                          <span className="ml-2 text-ink-muted">{row.share}%</span>
                        </span>
                      </span>
                      <Meter value={row.sessions} max={Math.max(...devices.viewports.map((v) => v.sessions))} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </Section>

        {/* ── Acquisition ────────────────────────────────────────────────── */}
        <Section
          title="Waar bezoekers vandaan komen"
          intro="Alleen de host van de verwijzende site wordt bewaard, nooit het volledige adres. Rechtstreeks betekent: getypt, bladwijzer, app, of een verwijzer die door de browser verborgen wordt."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Verwijzers" meta={`${acquisition.directShare}% rechtstreeks`}>
              {acquisition.referrers.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Alle {formatNumber(acquisition.totalSessions)} bezoeken kwamen rechtstreeks binnen.
                </p>
              ) : (
                <ul className="space-y-2">
                  {acquisition.referrers.map((row) => (
                    <li key={row.host} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="truncate text-ink-soft">{row.host}</span>
                      <span className="shrink-0 tabular-nums text-ink">
                        {formatNumber(row.sessions)}
                        <span className="ml-2 text-ink-muted">{row.share}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Eerste pagina van een bezoek">
              {acquisition.entryPages.length === 0 ? (
                <p className="text-sm text-ink-muted">Nog geen bezoeken gemeten.</p>
              ) : (
                <ul className="space-y-2">
                  {acquisition.entryPages.map((row) => (
                    <li key={row.path} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="min-w-0 truncate text-ink-soft">{row.label ?? row.path}</span>
                      <span className="shrink-0 tabular-nums text-ink">
                        {formatNumber(row.sessions)}
                        <span className="ml-2 text-ink-muted">{row.share}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Campagnes" meta="utm-parameters">
              {acquisition.campaigns.length === 0 ? (
                <p className="text-sm leading-relaxed text-ink-muted">
                  Geen campagnes gemeten. Zet <span className="font-mono text-[11px]">?utm_source=</span>{' '}
                  achter een gedeelde link om te zien wat die oplevert.
                </p>
              ) : (
                <ul className="space-y-2">
                  {acquisition.campaigns.map((row) => (
                    <li
                      key={`${row.source}-${row.campaign}`}
                      className="flex items-baseline justify-between gap-4 text-sm"
                    >
                      <span className="min-w-0 truncate text-ink-soft">
                        {row.campaign} <span className="text-ink-muted">via {row.source}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink">{formatNumber(row.sessions)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </Section>

        {/* ── Quizzes ────────────────────────────────────────────────────── */}
        <Section
          title="Quizzen"
          intro="Gespeeld komt uit de opgeslagen resultaten en klopt ook voor de tijd vóór deze meting bestond. Geopend, gestart en afgebroken komen uit de gebeurtenissen en vullen zich vanaf nu. Afmaakratio is afgerond gedeeld door gestart."
        >
          <FigureRow>
            <Figure
              label="Quizzen totaal"
              value={formatNumber(quizzes.rows.length)}
              meta={`${formatNumber(quizzes.neverPlayed.length)} niet gespeeld in deze periode`}
            />
            <Figure
              label="Pogingen"
              value={formatNumber(quizzes.totalPlays)}
              meta={`over ${formatNumber(quizzes.rows.filter((row) => row.plays > 0).length)} verschillende quizzen`}
            />
            <Figure
              label="Populairste"
              value={quizzes.rows[0]?.plays ? formatNumber(quizzes.rows[0].plays) : '0'}
              meta={quizzes.rows[0]?.title ?? 'Nog geen pogingen'}
            />
            <Figure
              label="Categorieën"
              value={formatNumber(quizzes.byCategory.length)}
              meta={quizzes.byCategory[0] ? `meest gespeeld: ${quizzes.byCategory[0].category}` : ''}
            />
          </FigureRow>

          <div className="mt-6">
            <DataTable
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
                  <Row key={row.quizId}>
                    <Td strong>
                      <span className="flex flex-wrap items-center gap-2">
                        {row.title}
                        {row.isPremium && <Tag tone="accent">Premium</Tag>}
                        {row.status !== 'approved' && <Tag tone="warning">{row.status}</Tag>}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        {row.category} · {row.difficulty} · {row.questionCount} vragen
                      </span>
                      <Meter value={row.plays} max={maxQuizPlays} />
                    </Td>
                    <Td align="right">{formatNumber(row.views)}</Td>
                    <Td align="right">
                      {formatNumber(row.starts)}
                      {row.starts > 0 && (
                        <span className="ml-2 text-[11px] text-ink-muted">{row.finishRate}% af</span>
                      )}
                    </Td>
                    <Td align="right">{formatNumber(row.abandons)}</Td>
                    <Td align="right" strong>
                      {formatNumber(row.plays)}
                    </Td>
                    <Td align="right">{formatNumber(row.players)}</Td>
                    <Td align="right">{row.plays > 0 ? `${row.avgScorePct}%` : '—'}</Td>
                    <Td align="right" muted>
                      {formatDate(row.lastPlayedAt)}
                    </Td>
                  </Row>
                ))
              )}
            </DataTable>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Per categorie">
              <DataTable
                minWidth={0}
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
                    <Row key={row.category}>
                      <Td strong>{row.category}</Td>
                      <Td align="right">{formatNumber(row.quizzes)}</Td>
                      <Td align="right">{formatNumber(row.plays)}</Td>
                      <Td align="right">{row.plays > 0 ? `${row.avgScorePct}%` : '—'}</Td>
                    </Row>
                  ))
                )}
              </DataTable>
            </Panel>

            <Panel title="Niet gespeeld" meta={`${quizzes.neverPlayed.length} quizzen`}>
              {quizzes.neverPlayed.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Elke gepubliceerde quiz is in deze periode minstens één keer gespeeld.
                </p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Gepubliceerd, maar geen enkele poging in {windowDays} dagen. Als de quiz wél
                    geopend werd, ligt het aan het startscherm; werd hij niet eens geopend, dan is
                    het een vindbaarheidsprobleem.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {quizzes.neverPlayed.slice(0, 25).map((row) => (
                      <li
                        key={row.quizId}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{row.title}</span>
                          <span className="block text-[11px] text-ink-muted">{row.category}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-ink-muted">
                          {row.views > 0 ? `${formatNumber(row.views)}× geopend` : 'nooit geopend'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>

          {quizzes.byDifficulty.length > 0 && (
            <div className="mt-5">
              <Panel title="Per moeilijkheid">
                <ul className="grid gap-4 sm:grid-cols-3">
                  {quizzes.byDifficulty.map((row) => (
                    <li key={row.difficulty}>
                      <p className="text-sm font-medium text-ink">{row.difficulty}</p>
                      <p className="mt-1 text-sm tabular-nums text-ink-muted">
                        {formatNumber(row.plays)} pogingen · {formatNumber(row.quizzes)} quizzen ·
                        gemiddeld {row.avgScorePct}%
                      </p>
                      <Meter
                        value={row.plays}
                        max={Math.max(...quizzes.byDifficulty.map((d) => d.plays), 1)}
                      />
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </Section>

        {/* ── Accounts ───────────────────────────────────────────────────── */}
        <Section
          title="Accounts"
          intro="Gemeten op de gebruikersdocumenten zelf, dus deze cijfers gaan verder terug dan de gebeurtenissen."
        >
          <FigureRow>
            <Figure
              label="Nieuw geactiveerd"
              value={`${users.activatedNewShare}%`}
              meta={`${formatNumber(users.activatedNew)} van ${formatNumber(users.newInWindow)} nieuwe accounts speelde een quiz`}
            />
            <Figure
              label="Nooit gespeeld"
              value={formatNumber(users.neverPlayed)}
              meta="accounts zonder één afgeronde quiz"
              tone={users.neverPlayed > users.total / 2 ? 'warning' : 'neutral'}
            />
            <Figure
              label="Hosts"
              value={formatNumber(users.hosts)}
              meta="accounts die ooit een spel startten"
            />
            <Figure
              label="Gem. quizzen"
              value={String(users.avgQuizzesPlayed)}
              meta={`per account · ${formatNumber(users.streaks.withStreak)} lopende streaks, langste ooit ${formatNumber(users.streaks.longest)}`}
            />
          </FigureRow>

          {users.levels.length > 0 && (
            <div className="mt-6">
              <Panel title="Verdeling over niveaus">
                <ul className="space-y-2">
                  {users.levels.map((row) => (
                    <li key={row.level}>
                      <span className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-ink-soft">
                          Niveau {row.level}
                          {row.title ? ` · ${row.title}` : ''}
                        </span>
                        <span className="tabular-nums text-ink">{formatNumber(row.users)}</span>
                      </span>
                      <Meter value={row.users} max={Math.max(...users.levels.map((l) => l.users))} />
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </Section>

        {/* ── Ingest health ──────────────────────────────────────────────── */}
        <Section
          title="Meting zelf"
          intro="Elk gebeurtenistype met zijn volume. Een type dat op nul staat terwijl het dat niet zou moeten, betekent dat er ergens een meetpunt stuk is - en niet dat de functie niet gebruikt wordt."
        >
          <DataTable
            minWidth={520}
            head={
              <>
                <Th>Gebeurtenis</Th>
                <Th align="right">Aantal</Th>
                <Th align="right">Laatst gezien</Th>
              </>
            }
          >
            {events.length === 0 ? (
              <EmptyRow columns={3}>Nog niets binnengekomen in deze periode.</EmptyRow>
            ) : (
              events.map((row) => (
                <Row key={row.name}>
                  <Td strong>
                    {EVENT_LABELS[row.name] ?? row.name}
                    <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">{row.name}</span>
                  </Td>
                  <Td align="right" strong>
                    {formatNumber(row.count)}
                  </Td>
                  <Td align="right" muted>
                    {formatDate(row.lastAt)}
                  </Td>
                </Row>
              ))
            )}
          </DataTable>

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-muted">
            Gebeurtenissen worden 400 dagen bewaard en daarna automatisch opgeruimd. Er wordt geen
            volledig webadres, geen IP-adres en geen tekst die iemand intypt vastgelegd - alleen het
            routepatroon, het label van een knop, en de context van een bezoek.
          </p>
        </Section>
      </div>
    </div>
  );
}
