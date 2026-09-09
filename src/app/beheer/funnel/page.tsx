import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { getDayThirtyRetention, getFunnelReport, getRecentEvents } from '@/lib/analytics/funnel';
import { MULTIPLAYER_FREE_ROOM_QUOTA } from '@/lib/premium-benefits';

export const metadata: Metadata = {
  title: 'Funnel - BijbelQuiz beheer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * The four numbers the revenue plan says to run the business on, plus the
 * per-trigger breakdown underneath them.
 *
 * Deliberately a page and not a spreadsheet export: a number nobody looks at
 * changes nothing, and the whole point of shipping the event stream first was
 * to stop guessing which stage of the funnel is carrying the revenue.
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

  return (
    <div className="min-h-screen bg-paper pb-16 pt-8 lg:pt-10">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Beheercentrum</p>
            <h1 className="mt-3 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
              Funnel
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
              Laatste {report.windowDays} dagen. De hostcijfers tellen alle accounts, ook die van voor
              de meting, omdat die teller op het gebruikersdocument staat. De test- en reviewaccounts
              blijven buiten de retentiecijfers: ze hebben allemaal premium, dus anders bestaat die
              groep vooral uit onszelf.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/beheer/statistieken"
              className="inline-flex h-10 items-center rounded-md border border-rule bg-paper-raised px-4 text-sm text-ink hover:bg-paper-sunken"
            >
              Statistieken
            </Link>
            <Link
              href="/beheer"
              className="inline-flex h-10 items-center rounded-md border border-rule bg-paper-raised px-4 text-sm text-ink hover:bg-paper-sunken"
            >
              Terug naar beheer
            </Link>
          </div>
        </div>

        {!hasEvents && (
          <div className="mt-6 rounded-lg border border-lapis/35 bg-lapis-tint p-4">
            <p className="text-sm text-ink">
              Er zijn nog geen gebeurtenissen binnengekomen in dit venster. Dat is normaal vlak na een
              deploy: quizzen, gestarte spellen en paywalls schrijven zichzelf weg zodra ze gebeuren.
            </p>
          </div>
        )}

        {/* The four headline numbers */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-rule py-6 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-rule">
          <Figure
            label="Host-doorloop"
            value={`${report.hosts.reachRate}%`}
            meta={`${report.hosts.reachedQuota} van ${report.hosts.startedOne} hosts haalden spel ${MULTIPLAYER_FREE_ROOM_QUOTA}`}
          />
          <Figure
            label="Naar BijbelStudie"
            value={`${report.handover.clicks}`}
            meta={`${report.handover.perCompletion}% van ${report.activation.quizzesCompleted} afgeronde quizzen`}
          />
          <Figure
            label="Kaart weggeklikt"
            value={`${report.handover.dismissals}`}
            meta="post-quiz kaart gesloten zonder door te klikken"
          />
          <Figure
            label="Retentie dag 30"
            value={`${retention.free.rate}% / ${retention.premium.rate}%`}
            meta={`gratis (${retention.free.cohort}) / premium (${retention.premium.cohort})`}
          />
        </div>

        {/* Which placement actually earns the click */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-normal tracking-[-0.02em] text-ink">
            Doorstroom naar BijbelStudie
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Per plek waar de link staat. Een plek die na twee weken onderaan staat mag weg -
            hij kost aandacht die de plekken erboven beter gebruiken.
          </p>

          <div className="mt-5 overflow-x-auto rounded-lg border border-rule bg-paper-raised">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule-strong text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  <th className="px-4 py-3 text-left font-medium">Plek</th>
                  <th className="px-4 py-3 text-right font-medium">Kliks</th>
                  <th className="px-4 py-3 text-right font-medium">Aandeel</th>
                </tr>
              </thead>
              <tbody>
                {report.handover.bySurface.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-ink-muted">
                      Nog geen kliks in dit venster.
                    </td>
                  </tr>
                ) : (
                  report.handover.bySurface.map((row) => (
                    <tr key={row.surface} className="border-b border-rule last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs text-ink">{row.surface}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">{row.clicks}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                        {report.handover.clicks > 0
                          ? `${Math.round((row.clicks / report.handover.clicks) * 100)}%`
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Which trigger carries the revenue */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-normal tracking-[-0.02em] text-ink">Per trigger</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Aankopen worden toegewezen aan de laatste paywall die dit account binnen twee uur zag.
          </p>

          <div className="mt-5 overflow-x-auto rounded-lg border border-rule bg-paper-raised">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule-strong text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  <th className="px-4 py-3 text-left font-medium">Trigger</th>
                  <th className="px-4 py-3 text-right font-medium">Weergaven</th>
                  <th className="px-4 py-3 text-right font-medium">Aankopen</th>
                  <th className="px-4 py-3 text-right font-medium">Conversie</th>
                </tr>
              </thead>
              <tbody>
                {report.paywall.byTrigger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                      Nog geen paywall-weergaven gemeten.
                    </td>
                  </tr>
                ) : (
                  report.paywall.byTrigger.map((row) => (
                    <tr key={row.trigger} className="border-b border-rule last:border-b-0">
                      <td className="px-4 py-3 font-medium text-ink">{TRIGGER_LABELS[row.trigger] ?? row.trigger}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-soft">{row.shown}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-soft">{row.purchases}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{row.conversionRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trial and activation */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-rule bg-paper-raised p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Proefperiode</p>
            <p className="mt-3 font-display text-[30px] leading-none tabular-nums text-ink">
              {report.trials.conversionRate}%
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              {report.trials.converted} van {report.trials.started} proefperiodes werden betaald.
              {report.trials.started === 0 && ' Nog geen proefperiodes gestart.'}
            </p>
          </div>

          <div className="rounded-lg border border-rule bg-paper-raised p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Activatie</p>
            <p className="mt-3 font-display text-[30px] leading-none tabular-nums text-ink">
              {report.activation.firstQuizzesCompleted}
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              accounts rondden hun eerste quiz af, op {report.activation.quizzesCompleted} quizzen in totaal.
            </p>
          </div>
        </section>

        {/* Raw tail, so it is obvious at a glance whether ingest is alive */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-normal tracking-[-0.02em] text-ink">Laatste gebeurtenissen</h2>

          <div className="mt-5 overflow-x-auto rounded-lg border border-rule bg-paper-raised">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule-strong text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  <th className="px-4 py-3 text-left font-medium">Wanneer</th>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Platform</th>
                  <th className="px-4 py-3 text-left font-medium">Eigenschappen</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                      Nog niets binnengekomen.
                    </td>
                  </tr>
                ) : (
                  recent.map((event) => (
                    <tr key={String(event._id)} className="border-b border-rule last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-muted">
                        {new Date(event.createdAt).toLocaleString('nl-NL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{event.name}</td>
                      <td className="px-4 py-3 text-ink-soft">{event.platform}</td>
                      <td className="max-w-[360px] truncate px-4 py-3 font-mono text-xs text-ink-muted">
                        {JSON.stringify(event.props ?? {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}

const TRIGGER_LABELS: Record<string, string> = {
  host_quota_exhausted: 'Gratis spellen op',
  host_quota_warning: 'Waarschuwing bij spel 4-5',
  host_player_cap: 'Spelerslimiet bereikt',
  explanation_locked: 'Uitleg op slot',
  premium_quiz_locked: 'Premium quiz',
  direct: 'Rechtstreeks bezoek',
};

function Figure({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="md:px-6 md:first:pl-0 md:last:pr-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-[30px] leading-none tabular-nums text-ink">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{meta}</p>
    </div>
  );
}
