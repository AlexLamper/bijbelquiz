import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AlertTriangle, ArrowRight, Check, CircleHelp, CreditCard, RefreshCw, Smartphone, X } from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { getPaymentsHealth, type CheckStatus, type HealthCheck } from '@/lib/payments-health';
import { formatEuroCents } from '@/lib/premium-stats';
import { Button } from '@/components/bq/Button';
import { AdminPageHeader } from '@/components/bq/AdminShell';
import {
  CardTitle,
  EmptyRow,
  HBarList,
  Mono,
  StatusChip,
  Table,
  TableCard,
  Td,
  Th,
  formatDateTime,
  formatNumber,
  formatPct,
  type ChipTone,
} from '@/components/web2/beheer-2/parts';

export const metadata: Metadata = {
  title: 'Betalingen - BijbelQuiz beheer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_META: Record<CheckStatus, { tile: string; Icon: typeof Check }> = {
  ok: { tile: 'bg-green-tint text-green-text', Icon: Check },
  warn: { tile: 'bg-gold-tint text-gold-text', Icon: AlertTriangle },
  fail: { tile: 'bg-coral-tint text-coral-text', Icon: X },
};

const OVERALL_TITLE: Record<CheckStatus, string> = {
  ok: 'Alles staat goed',
  warn: 'Werkt, maar er zijn aandachtspunten',
  fail: 'Er is iets kapot in de betaal-pijplijn',
};

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Maandelijks',
  yearly: 'Jaarlijks',
  lifetime: 'Levenslang',
  group: 'Groepslicentie',
};

const INTERVAL_LABELS: Record<string, string> = {
  month: '/ maand',
  year: '/ jaar',
  week: '/ week',
  day: '/ dag',
  eenmalig: 'eenmalig',
};

/** The 13px grey subheading inside a card ("Webhook-endpoints", "Prijzen"). */
function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="m-0 font-sans text-[13px] font-extrabold leading-[18px] text-ink-muted">{children}</h3>;
}

function CheckRow({ check }: { check: HealthCheck }) {
  const meta = STATUS_META[check.status];
  return (
    <li className="flex items-start gap-3 border-t border-line-soft py-3.5 first:border-t-0">
      <span aria-hidden="true" className={cn('flex size-[30px] shrink-0 items-center justify-center rounded-[9px]', meta.tile)}>
        <meta.Icon className="size-4" strokeWidth={2.4} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] font-extrabold leading-[22px]">{check.label}</span>
        <span className="text-sm font-semibold leading-5 text-ink-muted [overflow-wrap:anywhere]">{check.detail}</span>
        {check.action && (
          <span className="mt-1 flex items-start gap-1.5 text-sm font-bold leading-5 text-ink">
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-lapis" strokeWidth={2.4} aria-hidden="true" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{check.action}</span>
          </span>
        )}
      </span>
    </li>
  );
}

/** Label left, value right, hairline above: the RevenueCat rows. */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line-soft py-2.5">
      <span className="text-sm font-bold text-ink-soft">{label}</span>
      <span className="text-right text-sm font-bold text-ink tabular-nums">{children}</span>
    </div>
  );
}

function YesNo({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? Check : X;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[13px] font-bold', ok ? 'text-ink-soft' : 'text-coral-text')}>
      <Icon className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
      {label}
      <span className="sr-only">{ok ? ' gedekt' : ' niet gedekt'}</span>
    </span>
  );
}

function priceStatus(price: { priceId: string | null; error?: string; active: boolean | null }): [ChipTone, string] {
  if (!price.priceId) return ['grey', 'niet gezet'];
  if (price.error) return ['coral', 'onbekend bij Stripe'];
  return price.active ? ['green', 'actief'] : ['coral', 'inactief'];
}

/**
 * "Does the paying pipeline work": did someone click pay, did the payment go
 * through, did they get Premium. Checked live against Stripe and RevenueCat.
 */
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
  const attention = [...fails, ...warns];
  const funnel = report.funnel30d;

  return (
    <>
      <AdminPageHeader
        title="Betaal-pijplijn"
        description="Klikte iemand op betalen, ging de betaling door, kreeg diegene Premium. Live gecontroleerd tegen Stripe en RevenueCat."
        actions={
          <Button href="/beheer/betalingen" prefetch={false}>
            <RefreshCw className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
            Ververs
          </Button>
        }
      />

      {/* Overall verdict */}
      <section
        aria-label="Totaaloordeel"
        className="flex flex-wrap items-center gap-x-5 gap-y-3.5 rounded-[16px] border border-line bg-card px-5 py-[18px]"
      >
        <div className="flex min-w-0 flex-[1_1_420px] items-center gap-3.5">
          <span aria-hidden="true" className={cn('flex size-11 shrink-0 items-center justify-center rounded-[12px]', overall.tile)}>
            <overall.Icon className="size-[22px]" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-lg font-extrabold leading-6">{OVERALL_TITLE[report.overall]}</p>
            <p className="mb-0 mt-0.5 text-sm font-semibold leading-5 text-ink-muted tabular-nums">
              {fails.length} actie nodig · {warns.length} let op · {oks.length} ok · gecheckt {formatDateTime(report.generatedAt)}
            </p>
          </div>
        </div>
        <Button href="#handleiding" variant="secondary" className="px-4">
          <CircleHelp className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
          Wat moet ik doen?
        </Button>
      </section>

      {/* Checklist: fails and warnings first, passed checks folded away */}
      <section className="flex flex-col gap-1 rounded-[16px] border border-line bg-card px-5 pb-2 pt-[18px]">
        <CardTitle title="Controlelijst" description="Elke regel met een pijl vertelt precies wat je moet doen." />
        {attention.length > 0 ? (
          <ul className="m-0 list-none p-0">
            {attention.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </ul>
        ) : (
          <p className="my-0 py-3.5 text-sm font-bold text-green-text">Geen problemen gevonden in de configuratie.</p>
        )}
        {oks.length > 0 && (
          <details className="group border-t border-line-soft">
            <summary className="flex cursor-pointer items-center gap-1.5 py-3.5 text-sm font-extrabold text-lapis">
              <svg viewBox="0 0 10 10" className="size-2.5 transition-transform group-open:rotate-90" aria-hidden="true">
                <path d="M2 1l6 4-6 4z" fill="currentColor" />
              </svg>
              {oks.length} geslaagde checks tonen
            </summary>
            <ul className="m-0 list-none border-t border-line-soft p-0">
              {oks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-5 m:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* Stripe */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-line bg-card">
          <div className="flex flex-col gap-3.5 px-5 pb-1 pt-[18px]">
            <CardTitle
              icon={<CreditCard className="size-[18px]" strokeWidth={2.2} />}
              title="Stripe (web)"
              description={
                <>
                  Sleutel: <strong className="text-ink">{report.stripe.keyMode}</strong>
                  {report.stripe.keyWorks === true && ' · geaccepteerd'}
                  {report.stripe.keyWorks === false && ' · geweigerd'}
                  {report.stripe.accountCurrency && ` · valuta ${report.stripe.accountCurrency.toUpperCase()}`}
                </>
              }
            />
            <div className="flex flex-col gap-2">
              <SubHead>Webhook-endpoints</SubHead>
              {report.stripe.webhookEndpoints.length === 0 ? (
                <p className="m-0 text-sm font-bold text-coral-text">Geen enkel endpoint geconfigureerd in Stripe.</p>
              ) : (
                report.stripe.webhookEndpoints.map((endpoint) => (
                  <div key={endpoint.url} className="flex flex-col gap-2 rounded-[12px] border border-line px-3.5 py-3">
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusChip tone={endpoint.status === 'enabled' ? 'green' : 'coral'}>{endpoint.status}</StatusChip>
                      <Mono className="text-[13px] text-ink">{endpoint.url}</Mono>
                    </span>
                    <span className="flex flex-wrap gap-x-4 gap-y-1.5">
                      <YesNo ok={endpoint.coversCheckoutCompleted} label="checkout" />
                      <YesNo ok={endpoint.coversSubscription} label="abonnement" />
                    </span>
                  </div>
                ))
              )}
            </div>
            <SubHead>Prijzen</SubHead>
          </div>
          <Table
            caption="Prijzen"
            minWidth={360}
            head={
              <>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th align="right">Bedrag</Th>
              </>
            }
          >
            {report.stripe.prices.length === 0 && <EmptyRow columns={3}>Nog geen prijzen opgehaald bij Stripe.</EmptyRow>}
            {report.stripe.prices.map((price) => {
              const [tone, label] = priceStatus(price);
              return (
                <tr key={price.plan}>
                  <Td valign="middle">
                    <span className="font-extrabold text-ink">{PLAN_LABELS[price.plan] ?? price.plan}</span> <Mono>{price.plan}</Mono>
                  </Td>
                  <Td valign="middle">
                    <StatusChip tone={tone}>{label}</StatusChip>
                  </Td>
                  <Td valign="middle" align="right" numeric tone="strong">
                    {price.amountCents != null
                      ? `${formatEuroCents(price.amountCents)}${price.interval ? ` ${INTERVAL_LABELS[price.interval] ?? `/ ${price.interval}`}` : ''}`
                      : '-'}
                  </Td>
                </tr>
              );
            })}
          </Table>
          <div className="flex flex-col gap-4 border-t border-line-soft px-5 pb-5 pt-4">
            {report.stripe.sessions30d && (
              <div className="flex flex-col gap-2">
                <SubHead>Checkout-sessies (30 dagen)</SubHead>
                <div className="grid grid-cols-2 gap-3 m:grid-cols-5">
                  {(
                    [
                      ['aangemaakt', report.stripe.sessions30d.total],
                      ['voltooid', report.stripe.sessions30d.complete],
                      ['betaald', report.stripe.sessions30d.paid],
                      ['open', report.stripe.sessions30d.open],
                      ['verlopen', report.stripe.sessions30d.expired],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex min-w-0 flex-col">
                      <span className="text-xl font-extrabold leading-[26px] tabular-nums">{formatNumber(value)}</span>
                      <span className="text-[13px] font-semibold text-ink-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <SubHead>Recente Stripe-events</SubHead>
              {report.stripe.recentEventTypes.length === 0 ? (
                <p className="m-0 text-sm font-semibold text-ink-muted">geen</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {report.stripe.recentEventTypes.slice(0, 6).map((event) => (
                    <span
                      key={`${event.type}-${event.at}`}
                      className="inline-flex h-[26px] items-center rounded-[6px] bg-chip px-2 font-mono text-xs text-ink-soft"
                    >
                      {event.type}
                    </span>
                  ))}
                </div>
              )}
              <p className="m-0 text-[13px] font-semibold leading-[18px] text-ink-muted tabular-nums">
                Nieuwste checkout-bevestiging bij Stripe: {formatDateTime(report.stripe.newestCheckoutCompletedAt)} · nieuwste
                door ons opgeslagen: {formatDateTime(report.webhooksStored.stripeNewestAt)} ({formatNumber(report.webhooksStored.stripe)}{' '}
                totaal)
              </p>
            </div>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          {/* RevenueCat */}
          <section className="flex min-w-0 flex-col gap-2.5 rounded-[16px] border border-line bg-card px-5 pb-2.5 pt-[18px]">
            <CardTitle
              icon={<Smartphone className="size-[18px]" strokeWidth={2.2} />}
              title="RevenueCat / App Store (app)"
              description="In-app aankopen komen hier binnen."
            />
            <div>
              <InfoRow label="Webhook-autorisatie">
                {report.revenuecat.webhookAuthConfigured ? (
                  <StatusChip tone="green">gezet</StatusChip>
                ) : (
                  <StatusChip tone="coral">ontbreekt - app-aankopen geven geen premium</StatusChip>
                )}
              </InfoRow>
              <InfoRow label="REST-sleutel">
                <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                  <StatusChip tone={report.revenuecat.restKeyConfigured ? 'green' : 'coral'}>
                    {report.revenuecat.restKeyConfigured ? 'gezet' : 'ontbreekt'}
                  </StatusChip>
                  {report.revenuecat.restKeyWorks === true && <StatusChip tone="green">getest OK</StatusChip>}
                  {report.revenuecat.restKeyWorks === false && <StatusChip tone="coral">geweigerd door RevenueCat</StatusChip>}
                </span>
              </InfoRow>
              <InfoRow label="Opgeslagen app-webhooks">{formatNumber(report.revenuecat.webhookEventsStored)}</InfoRow>
              <InfoRow label="Nieuwste app-webhook">{formatDateTime(report.revenuecat.newestWebhookEventAt)}</InfoRow>
              {report.revenuecat.webhookEventsStored === 0 && (
                <p className="m-0 border-t border-line-soft py-2.5 text-sm font-bold leading-5 text-coral-text">
                  Nul opgeslagen app-webhooks. Als er in de app is gekocht, komt de webhook niet binnen. Zie stap 7-9.
                </p>
              )}
            </div>
          </section>

          {/* Funnel */}
          <section className="flex min-w-0 flex-col gap-3.5 rounded-[16px] border border-line bg-card px-5 pb-5 pt-[18px]">
            <CardTitle title="Funnel (30 dagen)" description="Van paywall gezien tot betaald." />
            <HBarList
              label="Funnel over 30 dagen"
              labelColumn="minmax(120px, 150px)"
              reserve={48}
              rows={[
                { label: 'Paywall gezien', value: funnel.paywallShown },
                { label: 'Op betalen geklikt', value: funnel.checkoutStarted },
                { label: 'Aankoop voltooid', value: funnel.purchaseCompleted },
                { label: 'Proef gestart', value: funnel.trialStarted },
                { label: 'Proef omgezet', value: funnel.trialConverted },
              ]}
            />
            {funnel.checkoutStarted > 0 && (
              <p className="m-0 text-sm font-bold leading-5 text-ink-soft tabular-nums">
                Afronding bij Stripe: {formatPct(Math.round((funnel.purchaseCompleted / funnel.checkoutStarted) * 100))} (
                {funnel.purchaseCompleted}/{funnel.checkoutStarted})
              </p>
            )}
          </section>

          {/* Access gaps */}
          <section className="flex min-w-0 flex-col gap-3.5 rounded-[16px] border border-line bg-card px-5 pb-5 pt-[18px]">
            <CardTitle
              title="Betaald zonder toegang"
              description="Accounts met een geslaagde betaling die toch niet premium zijn. Dit hoort altijd leeg te zijn."
            />
            {report.accessGaps.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[12px] border border-line px-4 py-3.5">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green text-white">
                  <Check className="size-4" strokeWidth={2.6} />
                </span>
                <span className="text-[15px] font-bold leading-[22px] text-green-text">Leeg. Iedereen die betaalde heeft Premium.</span>
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {report.accessGaps.map((gap) => (
                  <li key={gap.userId + gap.when} className="flex items-start gap-3 rounded-[12px] border border-coral-line px-4 py-3.5">
                    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coral-strong text-white">
                      <X className="size-4" strokeWidth={2.6} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[15px] font-extrabold leading-[22px] [overflow-wrap:anywhere]">
                        {gap.name} · {gap.email}
                      </span>
                      <span className="text-sm font-semibold leading-5 text-ink-soft">{gap.reason}</span>
                      <span className="text-[13px] font-semibold leading-[18px] text-ink-muted tabular-nums">{formatDateTime(gap.when)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Recent attempts */}
      <TableCard
        title="Recente betaalpogingen"
        description="Laatste checkout-sessies uit Stripe, naast onze status en de toegang nu."
        caption="Recente betaalpogingen"
        minWidth={960}
        head={
          <>
            <Th>Wanneer</Th>
            <Th>Wie</Th>
            <Th>Plan</Th>
            <Th align="right">Bedrag</Th>
            <Th>Stripe-sessie</Th>
            <Th>Betaling</Th>
            <Th>Onze status</Th>
            <Th>Toegang nu</Th>
          </>
        }
      >
        {report.recentAttempts.length === 0 ? (
          <EmptyRow columns={8}>Nog geen checkout-sessies bij Stripe.</EmptyRow>
        ) : (
          report.recentAttempts.map((attempt, index) => (
            <tr key={`${attempt.when}-${index}`}>
              <Td valign="middle" numeric tone="muted">
                {formatDateTime(attempt.when, false)}
              </Td>
              <Td valign="middle" tone="strong">
                {attempt.email}
              </Td>
              <Td valign="middle">
                <Mono className="text-[13px] text-ink-soft">{attempt.plan}</Mono>
              </Td>
              <Td valign="middle" align="right" numeric tone="strong">
                {formatEuroCents(attempt.amountCents)}
              </Td>
              <Td valign="middle">
                <Mono className="text-[13px] text-ink-soft">{attempt.stripeSessionStatus ?? '-'}</Mono>
              </Td>
              <Td valign="middle">
                <Mono className="text-[13px] text-ink-soft">{attempt.stripePaymentStatus ?? '-'}</Mono>
              </Td>
              <Td valign="middle">
                <Mono className="text-[13px] text-ink-soft">{attempt.ourPaymentStatus ?? '-'}</Mono>
              </Td>
              <Td valign="middle">
                {attempt.hasAccessNow ? (
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-green-text">
                    <Check className="size-[15px]" strokeWidth={2.6} aria-hidden="true" />
                    ja
                  </span>
                ) : (
                  'nee'
                )}
              </Td>
            </tr>
          ))
        )}
      </TableCard>

      {/* Where the full instructions live */}
      <section id="handleiding" className="flex scroll-mt-6 items-start gap-3.5 rounded-[16px] border border-line bg-card px-5 pb-5 pt-[18px]">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-lapis-tint text-lapis">
          <CircleHelp className="size-[18px]" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h2 className="m-0 font-sans text-[17px] font-extrabold leading-6">Wat moet ik doen?</h2>
          <p className="mb-0 mt-1 max-w-[80ch] text-[15px] font-semibold leading-[22px] text-ink-soft">
            De volledige stap-voor-stap handleiding staat in <Mono className="text-[13px] text-ink">docs/premium-setup-checklist.md</Mono>{' '}
            in de repo (lokaal, niet in git). Werk de regels in de controlelijst hierboven af in de volgorde waarin ze staan;
            elke regel verwijst naar het stapnummer in dat document. Kom daarna terug en druk op{' '}
            <strong className="text-ink">Ververs</strong>.
          </p>
        </div>
      </section>
    </>
  );
}
