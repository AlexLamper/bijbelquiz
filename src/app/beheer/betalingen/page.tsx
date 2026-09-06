import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { getPaymentsHealth, type CheckStatus, type HealthCheck } from '@/lib/payments-health';
import { formatEuroCents } from '@/lib/premium-stats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_META: Record<CheckStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: 'OK', className: 'text-positive', Icon: CheckCircle2 },
  warn: { label: 'Let op', className: 'text-lapis', Icon: AlertTriangle },
  fail: { label: 'Actie nodig', className: 'text-vermilion', Icon: XCircle },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('nl-NL');
}

function CheckRow({ check }: { check: HealthCheck }) {
  const meta = STATUS_META[check.status];
  return (
    <div className="flex gap-3 border-b border-rule py-3 last:border-0">
      <meta.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{check.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{check.detail}</p>
        {check.action && (
          <p className="mt-1 text-xs font-medium text-ink">→ {check.action}</p>
        )}
      </div>
    </div>
  );
}

export default async function PaymentsHealthPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const report = await getPaymentsHealth({ deep: true });
  const overall = STATUS_META[report.overall];

  const fails = report.checks.filter((c) => c.status === 'fail');
  const warns = report.checks.filter((c) => c.status === 'warn');
  const oks = report.checks.filter((c) => c.status === 'ok');

  return (
    <div className="min-h-screen bg-paper pb-16 pt-8 lg:pt-10">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Beheercentrum</p>
            <h1 className="mt-3 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
              Betaal-pijplijn
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Klikte iemand op betalen, ging de betaling door, kreeg diegene Premium. Live gecontroleerd tegen
              Stripe en RevenueCat.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken">
              <Link href="/beheer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Link>
            </Button>
            <Button asChild className="h-10 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft">
              <Link href="/beheer/betalingen">
                <RefreshCw className="mr-2 h-4 w-4" />
                Ververs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Overall banner */}
      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <overall.Icon className={`h-6 w-6 ${overall.className}`} />
              <div>
                <p className={`text-lg font-semibold ${overall.className}`}>
                  {report.overall === 'ok'
                    ? 'Alles staat goed'
                    : report.overall === 'warn'
                      ? 'Werkt, maar er zijn aandachtspunten'
                      : 'Er is iets kapot in de betaal-pijplijn'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fails.length} actie nodig · {warns.length} let op · {oks.length} ok · gecheckt {fmtDate(report.generatedAt)}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="h-9 rounded-md border-rule bg-paper-raised px-3 text-xs text-ink hover:bg-paper-sunken">
              <a href="/beheer/betalingen#handleiding">Wat moet ik doen?</a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Checks: fails + warns first, oks collapsed */}
      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-ink">Controlelijst</CardTitle>
            <CardDescription>Elke regel met &rarr; vertelt precies wat je moet doen.</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {[...fails, ...warns].map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
            {[...fails, ...warns].length === 0 && (
              <p className="py-3 text-sm text-positive">Geen problemen gevonden in de configuratie.</p>
            )}
            {oks.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
                  {oks.length} geslaagde checks tonen
                </summary>
                <div className="mt-2">
                  {oks.map((c) => (
                    <CheckRow key={c.id} check={c} />
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Stripe */}
          <Card className="border-rule py-0">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 text-ink">
                <CreditCard className="h-5 w-5 text-ink-soft" />
                Stripe (web)
              </CardTitle>
              <CardDescription>
                Sleutel: <strong>{report.stripe.keyMode}</strong>
                {report.stripe.keyWorks === true && ' · geaccepteerd'}
                {report.stripe.keyWorks === false && ' · geweigerd'}
                {report.stripe.accountCurrency && ` · valuta ${report.stripe.accountCurrency.toUpperCase()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-5 text-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Webhook-endpoints</p>
                {report.stripe.webhookEndpoints.length === 0 ? (
                  <p className="mt-1 text-xs text-vermilion">Geen enkel endpoint geconfigureerd in Stripe.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {report.stripe.webhookEndpoints.map((e) => (
                      <li key={e.url} className="text-xs text-muted-foreground">
                        <span className={e.status === 'enabled' ? 'text-positive' : 'text-vermilion'}>{e.status}</span>{' '}
                        · {e.url}{' '}
                        · checkout {e.coversCheckoutCompleted ? '✓' : '✗'} · abonnement {e.coversSubscription ? '✓' : '✗'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Prijzen</p>
                <table className="mt-1 w-full text-xs">
                  <tbody>
                    {report.stripe.prices.map((p) => (
                      <tr key={p.plan} className="border-b border-rule last:border-0">
                        <td className="py-1.5 pr-2 font-medium text-ink">{p.plan}</td>
                        <td className="py-1.5 pr-2 text-muted-foreground">
                          {p.priceId
                            ? p.error
                              ? <span className="text-vermilion">onbekend bij Stripe</span>
                              : p.active
                                ? <span className="text-positive">actief</span>
                                : <span className="text-vermilion">inactief</span>
                            : <span className="text-ink-muted">niet gezet</span>}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-ink">
                          {p.amountCents != null ? `${formatEuroCents(p.amountCents)} ${p.interval ? `/ ${p.interval}` : ''}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {report.stripe.sessions30d && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Checkout-sessies (30 dagen)</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {report.stripe.sessions30d.total} aangemaakt · {report.stripe.sessions30d.complete} voltooid ·{' '}
                    {report.stripe.sessions30d.paid} betaald · {report.stripe.sessions30d.open} open ·{' '}
                    {report.stripe.sessions30d.expired} verlopen
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Recente Stripe-events</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {report.stripe.recentEventTypes.length === 0
                    ? 'geen'
                    : report.stripe.recentEventTypes.slice(0, 6).map((e) => e.type).join(', ')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nieuwste checkout-bevestiging bij Stripe: {fmtDate(report.stripe.newestCheckoutCompletedAt)} ·
                  {' '}nieuwste door ons opgeslagen: {fmtDate(report.webhooksStored.stripeNewestAt)} ({report.webhooksStored.stripe} totaal)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RevenueCat */}
          <Card className="border-rule py-0">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 text-ink">
                <Smartphone className="h-5 w-5 text-ink-soft" />
                RevenueCat / App Store (app)
              </CardTitle>
              <CardDescription>In-app aankopen komen hier binnen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pb-5 text-xs text-muted-foreground">
              <p>
                Webhook-autorisatie:{' '}
                <span className={report.revenuecat.webhookAuthConfigured ? 'text-positive' : 'text-vermilion'}>
                  {report.revenuecat.webhookAuthConfigured ? 'gezet' : 'ONTBREEKT - app-aankopen geven geen premium'}
                </span>
              </p>
              <p>
                REST-sleutel:{' '}
                <span className={report.revenuecat.restKeyConfigured ? 'text-positive' : 'text-vermilion'}>
                  {report.revenuecat.restKeyConfigured ? 'gezet' : 'ONTBREEKT'}
                </span>
                {report.revenuecat.restKeyWorks === true && ' · getest OK'}
                {report.revenuecat.restKeyWorks === false && ' · geweigerd door RevenueCat'}
              </p>
              <p>
                Opgeslagen app-webhooks: {report.revenuecat.webhookEventsStored} · nieuwste{' '}
                {fmtDate(report.revenuecat.newestWebhookEventAt)}
              </p>
              {report.revenuecat.webhookEventsStored === 0 && (
                <p className="text-vermilion">
                  Nul opgeslagen app-webhooks. Als er in de app is gekocht, komt de webhook niet binnen. Zie stap 7-9.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Funnel */}
      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-ink">Funnel (30 dagen)</CardTitle>
            <CardDescription>Van paywall gezien tot betaald.</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                ['Paywall gezien', report.funnel30d.paywallShown],
                ['Op betalen geklikt', report.funnel30d.checkoutStarted],
                ['Aankoop voltooid', report.funnel30d.purchaseCompleted],
                ['Proef gestart', report.funnel30d.trialStarted],
                ['Proef omgezet', report.funnel30d.trialConverted],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-md border border-rule bg-paper-raised p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{value as number}</p>
                </div>
              ))}
            </div>
            {report.funnel30d.checkoutStarted > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Afronding bij Stripe:{' '}
                {Math.round((report.funnel30d.purchaseCompleted / report.funnel30d.checkoutStarted) * 100)}% (
                {report.funnel30d.purchaseCompleted}/{report.funnel30d.checkoutStarted})
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Access gaps */}
      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className={`text-ink ${report.accessGaps.length > 0 ? '' : ''}`}>
              Betaald zonder toegang
            </CardTitle>
            <CardDescription>
              Accounts met een geslaagde betaling die tóch niet premium zijn. Dit hoort altijd leeg te zijn.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {report.accessGaps.length === 0 ? (
              <p className="text-sm text-positive">Leeg. Iedereen die betaalde heeft Premium.</p>
            ) : (
              <div className="space-y-3">
                {report.accessGaps.map((g) => (
                  <div key={g.userId + g.when} className="rounded-md border border-vermilion/40 bg-vermilion-tint p-3">
                    <p className="text-sm font-medium text-ink">
                      {g.name} · {g.email}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{g.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{fmtDate(g.when)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent attempts */}
      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-ink">Recente betaalpogingen</CardTitle>
            <CardDescription>Laatste checkout-sessies uit Stripe, naast onze status en de toegang nu.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-5">
            {report.recentAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen checkout-sessies bij Stripe.</p>
            ) : (
              <table className="w-full min-w-[720px] text-xs">
                <thead>
                  <tr className="border-b border-rule text-left text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    <th className="py-2 pr-3">Wanneer</th>
                    <th className="py-2 pr-3">Wie</th>
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3">Bedrag</th>
                    <th className="py-2 pr-3">Stripe-sessie</th>
                    <th className="py-2 pr-3">Betaling</th>
                    <th className="py-2 pr-3">Onze status</th>
                    <th className="py-2">Toegang nu</th>
                  </tr>
                </thead>
                <tbody>
                  {report.recentAttempts.map((a, i) => (
                    <tr key={i} className="border-b border-rule last:border-0">
                      <td className="py-2 pr-3 text-muted-foreground">{fmtDate(a.when)}</td>
                      <td className="py-2 pr-3 text-ink">{a.email}</td>
                      <td className="py-2 pr-3">{a.plan}</td>
                      <td className="py-2 pr-3 tabular-nums">{formatEuroCents(a.amountCents)}</td>
                      <td className="py-2 pr-3">{a.stripeSessionStatus ?? '-'}</td>
                      <td className="py-2 pr-3">{a.stripePaymentStatus ?? '-'}</td>
                      <td className="py-2 pr-3">{a.ourPaymentStatus ?? '-'}</td>
                      <td className={`py-2 font-medium ${a.hasAccessNow ? 'text-positive' : 'text-vermilion'}`}>
                        {a.hasAccessNow ? 'ja' : 'nee'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Instructions pointer */}
      <section id="handleiding" className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-ink">Wat moet ik doen?</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 text-sm text-muted-foreground">
            <p>
              De volledige stap-voor-stap handleiding staat in{' '}
              <code>docs/premium-setup-checklist.md</code> in de repo (lokaal, niet in git). Werk de rode regels in de
              controlelijst hierboven af in de volgorde waarin ze staan; elke regel verwijst naar het stapnummer in dat
              document. Kom daarna terug en druk op <strong>Ververs</strong>.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
