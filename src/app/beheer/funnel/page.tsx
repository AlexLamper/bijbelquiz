import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { getDayThirtyRetention, getFunnelReport, getRecentEvents } from '@/lib/analytics/funnel';
import { STUDIE_PROMO_CODE } from '@/lib/ecosystem-links';
import { MULTIPLAYER_FREE_ROOM_QUOTA } from '@/lib/premium-benefits';
import { AdminPageHeader } from '@/components/bq/AdminShell';
import {
  EmptyRow,
  Grid,
  HBarList,
  Meter,
  Mono,
  Note,
  Panel,
  SectionHeading,
  StatCard,
  TableCard,
  Td,
  Th,
  formatNumber,
  formatPct,
  formatShortDateTime,
} from '@/components/web2/beheer-2/parts';

export const metadata: Metadata = {
  title: 'Funnel - BijbelQuiz beheer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TRIGGER_LABELS: Record<string, string> = {
  host_quota_exhausted: 'Gratis spellen op',
  host_quota_warning: 'Waarschuwing bij spel 4-5',
  host_player_cap: 'Spelerslimiet bereikt',
  explanation_locked: 'Uitleg op slot',
  premium_quiz_locked: 'Premium quiz',
  review_locked: 'Terugkijken op slot',
  'gratis-limiet': 'Gratis quizzen op',
  direct: 'Rechtstreeks bezoek',
};

/** Where a BijbelStudie link sits, in words (see STUDIE_LINK_SURFACES). */
const SURFACE_LABELS: Record<string, string> = {
  explanation: 'Onder de uitleg in de quiz',
  result_primary: 'Hoofdknop op het resultaat',
  result_wrong_answers: 'Foute antwoorden op het resultaat',
  review: 'In de terugblik',
  interstitial: 'Popup na een quiz',
  interstitial_offer: 'Pro-link in de popup',
  quiz_intro: 'Hint onder de startknop',
  multiplayer_end: 'Einde van een spel samen',
  landing: 'Blok op de homepage',
  landing_cta: 'Slotregel van de homepage',
  dashboard: 'Blok op het dashboard',
  studie_page: 'Hoofdknop op de BijbelStudie-pagina',
  studie_page_offer: 'Pro-link op de BijbelStudie-pagina',
  quiz_list_empty: 'Zoeken zonder resultaat',
  help: 'Hulpcentrum',
  footer: 'Footer',
};

/**
 * The numbers the revenue plan says to run the business on, plus the
 * per-placement and per-trigger breakdowns underneath them.
 *
 * Deliberately a page and not a spreadsheet export: a number nobody looks at
 * changes nothing.
 */
export default async function FunnelPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const [report, retention, recent] = await Promise.all([
    getFunnelReport(30),
    getDayThirtyRetention(),
    getRecentEvents(25),
  ]);

  const hasEvents = report.paywall.shown > 0 || report.activation.quizzesCompleted > 0;
  const maxSurface = Math.max(1, ...report.handover.bySurface.map((row) => row.clicks));

  return (
    <>
      <AdminPageHeader
        title="Funnel"
        description={`Laatste ${report.windowDays} dagen. De hostcijfers tellen alle accounts, ook die van voor de meting, omdat die teller op het gebruikersdocument staat. De test- en reviewaccounts blijven buiten de retentiecijfers: ze hebben allemaal premium, dus anders bestaat die groep vooral uit onszelf.`}
      />

      {!hasEvents && (
        <Panel>
          <Note>
            Er zijn nog geen gebeurtenissen binnengekomen in dit venster. Dat is normaal vlak na een deploy: quizzen,
            gestarte spellen en paywalls schrijven zichzelf weg zodra ze gebeuren.
          </Note>
        </Panel>
      )}

      <Grid cols={4}>
        <StatCard
          label="Host-doorloop"
          value={formatPct(report.hosts.reachRate)}
          meta={`${formatNumber(report.hosts.reachedQuota)} van ${formatNumber(report.hosts.startedOne)} hosts haalden spel ${MULTIPLAYER_FREE_ROOM_QUOTA}`}
        />
        <StatCard
          label="Naar BijbelStudie"
          value={formatNumber(report.handover.clicks)}
          meta={`${formatPct(report.handover.perCompletion)} van ${formatNumber(report.activation.quizzesCompleted)} afgeronde quizzen`}
        />
        <StatCard
          label="Popup weggeklikt"
          value={formatNumber(report.handover.dismissals)}
          meta={`van ${formatNumber(report.handover.shown)} keer getoond na een quiz`}
        />
        <StatCard
          label="Retentie dag 30"
          value={`${formatPct(retention.free.rate)} / ${formatPct(retention.premium.rate)}`}
          meta={`gratis (${formatNumber(retention.free.cohort)}) / premium (${formatNumber(retention.premium.cohort)})`}
        />
      </Grid>

      <Grid cols={2}>
        {/* Which placement actually earns the click */}
        <div className="flex min-w-0 flex-col gap-4">
          <SectionHeading
            title="Doorstroom naar BijbelStudie"
            intro="Per plek waar de link staat. Een plek die na twee weken onderaan staat mag weg: hij kost aandacht die de plekken erboven beter gebruiken."
          />
          <TableCard
            caption="Per plek"
            minWidth={420}
            head={
              <>
                <Th>Plek</Th>
                <Th align="right">Kliks</Th>
                <Th align="right">Aandeel</Th>
              </>
            }
            footer={
              <p className="m-0 text-sm font-semibold leading-[22px] text-ink-muted">
                De code{' '}
                <span className="inline-flex h-6 items-center rounded-[6px] bg-chip px-2 align-[1px] font-mono text-[13px] font-bold text-ink">
                  {STUDIE_PROMO_CODE}
                </span>{' '}
                is {formatNumber(report.handover.codeCopies)} keer gekopieerd. Hoe vaak hij echt is gebruikt, staat bij de
                promotiecodes in de Stripe van BijbelStudie: BijbelStudie zelf houdt niet bij wie er vanaf BijbelQuiz komt.
              </p>
            }
          >
            {report.handover.bySurface.length === 0 ? (
              <EmptyRow columns={3}>Nog geen kliks in dit venster.</EmptyRow>
            ) : (
              report.handover.bySurface.map((row) => (
                <tr key={row.surface}>
                  <Td style={{ minWidth: 200 }}>
                    <span className="flex flex-col">
                      <span className="font-extrabold text-ink">{SURFACE_LABELS[row.surface] ?? row.surface}</span>
                      <Mono>{row.surface}</Mono>
                    </span>
                    <Meter value={row.clicks} max={maxSurface} />
                  </Td>
                  <Td align="right" numeric tone="strong">
                    {formatNumber(row.clicks)}
                  </Td>
                  <Td align="right" numeric>
                    {report.handover.clicks > 0 ? `${Math.round((row.clicks / report.handover.clicks) * 100)}%` : '-'}
                  </Td>
                </tr>
              ))
            )}
          </TableCard>
        </div>

        {/* Which trigger carries the revenue */}
        <div className="flex min-w-0 flex-col gap-4">
          <SectionHeading
            title="Per trigger"
            intro="Aankopen worden toegewezen aan de laatste paywall die dit account binnen twee uur zag."
          />
          <TableCard
            caption="Per trigger"
            minWidth={520}
            head={
              <>
                <Th>Trigger</Th>
                <Th align="right">Weergaven</Th>
                <Th align="right">Aankopen</Th>
                <Th align="right">Conversie</Th>
              </>
            }
          >
            {report.paywall.byTrigger.length === 0 ? (
              <EmptyRow columns={4}>Nog geen paywall-weergaven gemeten.</EmptyRow>
            ) : (
              report.paywall.byTrigger.map((row) => (
                <tr key={row.trigger}>
                  <Td valign="middle" style={{ minWidth: 200 }}>
                    <span className="flex flex-col">
                      <span className="font-extrabold text-ink">{TRIGGER_LABELS[row.trigger] ?? row.trigger}</span>
                      <Mono>{row.trigger}</Mono>
                    </span>
                  </Td>
                  <Td valign="middle" align="right" numeric>
                    {formatNumber(row.shown)}
                  </Td>
                  <Td valign="middle" align="right" numeric>
                    {formatNumber(row.purchases)}
                  </Td>
                  <Td valign="middle" align="right" numeric tone="strong">
                    {formatPct(row.conversionRate)}
                  </Td>
                </tr>
              ))
            )}
          </TableCard>
        </div>
      </Grid>

      {/* Trial and activation */}
      <Grid cols={2}>
        <section className="flex min-w-0 flex-col gap-1.5 rounded-[16px] border border-line bg-card px-5 pb-5 pt-[18px]">
          <h2 className="m-0 font-sans text-[17px] font-extrabold leading-6">Proefperiode</h2>
          <span className="text-[32px] font-extrabold leading-10 tabular-nums">{formatPct(report.trials.conversionRate)}</span>
          <Note>
            {formatNumber(report.trials.converted)} van {formatNumber(report.trials.started)} proefperiodes werden betaald.
            {report.trials.started === 0 && ' Nog geen proefperiodes gestart.'}
          </Note>
          <div className="mt-2.5">
            <HBarList
              label="Proefperiodes"
              labelColumn="70px"
              barHeight={12}
              rows={[
                { label: 'Gestart', value: report.trials.started },
                { label: 'Betaald', value: report.trials.converted },
              ]}
            />
          </div>
        </section>
        <section className="flex min-w-0 flex-col gap-1.5 rounded-[16px] border border-line bg-card px-5 pb-5 pt-[18px]">
          <h2 className="m-0 font-sans text-[17px] font-extrabold leading-6">Activatie</h2>
          <span className="text-[32px] font-extrabold leading-10 tabular-nums">
            {formatNumber(report.activation.firstQuizzesCompleted)}
          </span>
          <Note>
            accounts rondden hun eerste quiz af, op {formatNumber(report.activation.quizzesCompleted)} quizzen in totaal.
          </Note>
          <div className="mt-2.5">
            <HBarList
              label="Activatie"
              labelColumn="86px"
              barHeight={12}
              tone="green"
              rows={[
                { label: 'Afgerond', value: report.activation.quizzesCompleted },
                { label: 'Eerste quiz', value: report.activation.firstQuizzesCompleted },
              ]}
            />
          </div>
        </section>
      </Grid>

      {/* Raw tail, so it is obvious at a glance whether ingest is alive */}
      <TableCard
        title="Laatste gebeurtenissen"
        description="Nieuwste eerst. Zo zie je in één oogopslag of de meting nog binnenkomt."
        caption="Laatste gebeurtenissen"
        minWidth={720}
        head={
          <>
            <Th>Wanneer</Th>
            <Th>Event</Th>
            <Th>Platform</Th>
            <Th>Eigenschappen</Th>
          </>
        }
      >
        {recent.length === 0 ? (
          <EmptyRow columns={4}>Nog niets binnengekomen.</EmptyRow>
        ) : (
          recent.map((event) => (
            <tr key={String(event._id)}>
              <Td valign="middle" numeric tone="muted">
                {formatShortDateTime(event.createdAt)}
              </Td>
              <Td valign="middle" tone="strong" className="whitespace-nowrap">
                {event.name}
              </Td>
              <Td valign="middle">{event.platform}</Td>
              <Td valign="middle">
                <Mono className="block max-w-[420px] truncate text-[12.5px] [overflow-wrap:normal]">
                  {JSON.stringify(event.props ?? {})}
                </Mono>
              </Td>
            </tr>
          ))
        )}
      </TableCard>
    </>
  );
}
