import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { CheckCircle2, ChevronRight, KeyRound, Pencil, Plus, XCircle } from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { AdminPageHeader, Button } from '@/components/bq';
import { avatarToneFor, initialOf } from '@/components/bq/Avatar';
import {
  AdminPill,
  AdminSection,
  AdminSectionHead,
  ArrowLink,
  QuizStatusPill,
  adminIconButton,
  formatAdminDate,
} from '@/components/web2/beheer/ui';
import { cn } from '@/lib/utils';
import { GROUP_LICENSE_SEATS } from '@/lib/group-license';
import { getAdminOverview } from '@/lib/admin/overview';
import { formatEuroCents, formatMoneyCents } from '@/lib/premium-stats';
import { getPaymentsHealth } from '@/lib/payments-health';
import AdminGroupLicenseForm from './AdminGroupLicenseForm';
import AdminRefreshButton from './AdminRefreshButton';

export const metadata: Metadata = {
  title: 'Overzicht - Beheer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const AVATAR_TONE = {
  lapis: 'bg-lapis-tint text-lapis',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green-text',
  gold: 'bg-gold-tint text-gold-text',
  grey: 'bg-chip text-ink-soft',
} as const;

const PLAN_LABEL: Record<string, string> = {
  monthly: 'Maandelijks',
  yearly: 'Jaarlijks',
  annual: 'Jaarlijks',
  lifetime: 'Levenslang',
  group: 'Groepslicentie',
};

const PROVIDER_LABEL: Record<string, string> = {
  stripe: 'Stripe',
  revenuecat: 'RevenueCat',
};

const PAYMENT_STATUS: Record<string, { label: string; tone: 'green' | 'coral' | 'grey' | 'gold' }> = {
  completed: { label: 'Voltooid', tone: 'green' },
  failed: { label: 'Mislukt', tone: 'coral' },
  pending: { label: 'In behandeling', tone: 'grey' },
  refunded: { label: 'Terugbetaald', tone: 'coral' },
  disputed: { label: 'Betwist', tone: 'gold' },
  trial: { label: 'Proefperiode', tone: 'grey' },
  sandbox: { label: 'Test', tone: 'grey' },
};

const nl = new Intl.NumberFormat('nl-NL');
const pct = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });

/** "+ US$ 4,99" for the amounts in currencies other than euro. */
function otherCurrencyNote(rows: Array<{ currency: string; netCents: number }>): string {
  return rows.map((row) => ` + ${formatMoneyCents(row.netCents, row.currency)}`).join('');
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  // `getPremiumStats` (inside `getAdminOverview`) counts every way an account
  // can be premium once (Stripe, store, lifetime, group licence, manual) and
  // leaves the internal test/reviewer accounts out; revenue follows the rules
  // in `lib/admin/revenue.ts`.
  const [overview, paymentsHealth] = await Promise.all([
    getAdminOverview(),
    // Shallow: config verdict only, no network-heavy Stripe list calls.
    getPaymentsHealth({ deep: false }).catch(() => null),
  ]);

  const { premium: premiumStats, totalUsers, totalQuizzes, pendingQuizzes, recentUsers, recentQuizzes } = overview;
  const internalExcluded = premiumStats.internalExcluded;
  const breakdown = premiumStats.breakdown;
  const revenue = premiumStats.revenue;

  const pipeline = paymentsHealth?.overall ?? 'warn';
  const pipelineFails = paymentsHealth?.checks.filter((check) => check.status === 'fail').length ?? 0;
  const excludedRows = revenue.excluded.test + revenue.excluded.internal;

  return (
    <>
      <AdminPageHeader
        title="Overzicht"
        description="Beheer je BijbelQuiz-platform."
        actions={
          <>
            <AdminRefreshButton />
            <Button href="/beheer/quizzen/aanmaken" size="md">
              <Plus className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
              Nieuwe quiz
            </Button>
          </>
        }
      />

      {/* Payment pipeline verdict: links to the full report. */}
      <Link
        href="/beheer/betalingen"
        className="flex items-center gap-3.5 rounded-[16px] border border-line bg-card px-[18px] py-3.5 text-ink no-underline transition-colors hover:border-input-line hover:text-ink"
      >
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-[12px]',
            pipeline === 'ok' ? 'bg-green-tint text-green-text' : pipeline === 'warn' ? 'bg-gold-tint text-gold-text' : 'bg-coral-tint text-coral-text',
          )}
          aria-hidden="true"
        >
          {pipeline === 'ok' ? (
            <CheckCircle2 className="size-5" strokeWidth={2.2} />
          ) : pipeline === 'warn' ? (
            <WarnIcon />
          ) : (
            <XCircle className="size-5" strokeWidth={2.2} />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-extrabold">Betaal-pijplijn</span>
            <AdminPill tone={pipeline === 'ok' ? 'green' : pipeline === 'warn' ? 'gold' : 'coral'}>
              {pipeline === 'ok' ? 'OK' : pipeline === 'warn' ? 'Let op' : `Actie nodig (${pipelineFails})`}
            </AdminPill>
          </span>
          <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">
            Klik, betaling en toegang, live gecheckt tegen Stripe en RevenueCat.
          </span>
        </span>
        <span className="hidden whitespace-nowrap text-sm font-extrabold text-lapis m:inline">Volledig rapport</span>
        <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
      </Link>

      <div className="grid grid-cols-1 gap-3 m:grid-cols-2 min-[1101px]:grid-cols-4">
        <StatCard label="Gebruikers" value={nl.format(totalUsers)} icon={<UsersIcon />} tone="lapis">
          <StatNote>Geregistreerde accounts</StatNote>
        </StatCard>
        <StatCard label="Premium" value={nl.format(premiumStats.premiumUsers)} icon={<CrownIcon />} tone="gold">
          <StatNote>
            {pct.format(premiumStats.premiumShareExact)}% van de accounts
            {internalExcluded > 0 && ` · ${internalExcluded} testaccounts niet meegeteld`}
          </StatNote>
          <span className="tabular text-xs font-bold leading-4 text-ink-muted">
            Stripe {breakdown.stripe} · Store {breakdown.store} · Levenslang {breakdown.lifetime} · Groep {breakdown.group}
            {breakdown.other > 0 && ` · Handmatig ${breakdown.other}`}
          </span>
        </StatCard>
        <StatCard label="Quizzen" value={nl.format(totalQuizzes)} icon={<BookIcon />} tone="lapis">
          <StatNote>Alle statussen samen</StatNote>
        </StatCard>
        <StatCard label="Wacht op goedkeuring" value={nl.format(pendingQuizzes)} icon={<InboxIcon />} tone="lapis">
          <ArrowLink href="/beheer/quizzen?status=pending">Beoordelen</ArrowLink>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 m:grid-cols-2">
        <AdminSection padding="list">
          <AdminSectionHead title="Recente gebruikers" description="Laatste 10 registraties" />
          {recentUsers.length > 0 ? (
            <ul className="m-0 list-none p-0">
              {recentUsers.map((user) => {
                const internal = user.isInternal;
                const premium = user.isPremium;
                const name = user.name;
                return (
                  <li key={user.id} className="flex min-h-[60px] items-center gap-3 border-t border-line-soft py-2.5 first:border-t-0">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold',
                        AVATAR_TONE[internal ? 'grey' : avatarToneFor(name)],
                      )}
                    >
                      {initialOf(name)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-bold leading-5">{name}</span>
                      <span className="truncate text-[13px] font-semibold leading-[18px] text-ink-muted">{user.email}</span>
                    </span>
                    {/* An internal account carries Premium on purpose, so it
                        gets its own label rather than the one that everywhere
                        else means "a customer". */}
                    {internal ? <AdminPill tone="grey">Testaccount</AdminPill> : premium && <AdminPill tone="gold">Premium</AdminPill>}
                    <span className="tabular whitespace-nowrap text-[13px] font-semibold text-ink-muted">{formatAdminDate(user.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm font-semibold text-ink-muted">Nog geen gebruikers.</p>
          )}
        </AdminSection>

        <AdminSection padding="list">
          <AdminSectionHead
            title="Recente quizzen"
            description="Laatste 10 aangemaakt"
            action={<ArrowLink href="/beheer/quizzen">Alle quizzen</ArrowLink>}
          />
          {recentQuizzes.length > 0 ? (
            <ul className="m-0 list-none p-0">
              {recentQuizzes.map((quiz) => (
                <li key={quiz.id} className="flex min-h-[60px] items-center gap-3 border-t border-line-soft py-2.5 first:border-t-0">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold leading-5">{quiz.title}</span>
                    <span className="truncate text-[13px] font-semibold leading-[18px] text-ink-muted">
                      {quiz.category || 'Geen categorie'} · {quiz.questionCount} vragen
                    </span>
                  </span>
                  <QuizStatusPill status={quiz.status} />
                  <Link
                    href={`/beheer/quizzen/${quiz.id}/bewerken`}
                    aria-label={`Bewerken: ${quiz.title}`}
                    title={`Bewerken: ${quiz.title}`}
                    className={adminIconButton}
                  >
                    <Pencil className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm font-semibold text-ink-muted">Nog geen quizzen.</p>
          )}
        </AdminSection>
      </div>

      <AdminSection padding="list" className="gap-4">
        <AdminSectionHead
          title="Premium en betalingen"
          description="Ontvangen betalingen uit de Payment-collectie: wat kopers betaalden, inclusief btw en vóór Stripe- of storekosten. Terugbetalingen gaan eraf; test- en sandboxbetalingen en testaccounts tellen niet mee. Oudere verlengingen staan als € 0 in de database en ontbreken in deze bedragen."
          action={<ArrowLink href="/beheer/betalingen">Betaal-pijplijn</ArrowLink>}
        />
        <div className="grid grid-cols-1 gap-3 m:grid-cols-3">
          <RevenueTile
            label="Netto omzet (30 dagen)"
            value={formatEuroCents(revenue.netCentsLast30d)}
            note={`Stripe ${formatEuroCents(revenue.bySource.stripe.netCentsLast30d)} · Store ${formatEuroCents(revenue.bySource.store.netCentsLast30d)}${otherCurrencyNote(revenue.otherCurrenciesLast30d)}`}
          />
          <RevenueTile
            label="Netto omzet (totaal)"
            value={formatEuroCents(revenue.netCentsAllTime)}
            note={`${revenue.refundedCentsAllTime > 0 ? `${formatEuroCents(revenue.refundedCentsAllTime)} terugbetaald` : 'Geen terugbetalingen'}${otherCurrencyNote(revenue.otherCurrenciesAllTime)}`}
          />
          <RevenueTile
            label="Betalingen ontvangen"
            value={nl.format(revenue.paymentsCompleted)}
            note={`${nl.format(revenue.renewalsAllTime)} verlengingen${excludedRows > 0 ? ` · ${nl.format(excludedRows)} test niet meegeteld` : ''}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="m-0 font-sans text-[15px] font-extrabold">Recente betalingen</h3>
          {premiumStats.recentPayments.length > 0 ? (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <caption className="sr-only">Recente betalingen</caption>
                <thead>
                  <tr className="text-left text-[13px] font-bold text-ink-muted">
                    <th scope="col" className="whitespace-nowrap border-b border-line py-2.5 pl-5 pr-4 font-bold">Wie</th>
                    <th scope="col" className="whitespace-nowrap border-b border-line px-4 py-2.5 font-bold">Via</th>
                    <th scope="col" className="whitespace-nowrap border-b border-line px-4 py-2.5 font-bold">Plan</th>
                    <th scope="col" className="whitespace-nowrap border-b border-line px-4 py-2.5 font-bold">Datum</th>
                    <th scope="col" className="whitespace-nowrap border-b border-line px-4 py-2.5 font-bold">Status</th>
                    <th scope="col" className="whitespace-nowrap border-b border-line py-2.5 pl-4 pr-5 text-right font-bold">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="text-sm leading-5">
                  {premiumStats.recentPayments.map((payment) => {
                    const status = PAYMENT_STATUS[payment.status] ?? { label: payment.status || 'Onbekend', tone: 'grey' as const };
                    const testBadge = payment.isInternal ? 'Testaccount' : payment.isTest ? 'Test' : null;
                    return (
                      <tr key={payment.id} className="[&>td]:border-t [&>td]:border-line-soft [&>td]:py-3 [&>td]:align-middle">
                        <td className="pl-5 pr-4 font-extrabold text-ink">
                          <span className="inline-flex flex-wrap items-center gap-1">
                            <span className={payment.userDeleted ? 'font-semibold text-ink-muted' : undefined}>{payment.userName}</span>
                            {testBadge && (
                              <AdminPill tone="grey" className="ml-1.5">
                                {testBadge}
                              </AdminPill>
                            )}
                          </span>
                        </td>
                        <td className="px-4 font-semibold text-ink-soft">{PROVIDER_LABEL[payment.provider] ?? payment.provider}</td>
                        <td className="px-4 font-semibold text-ink-soft">
                          {PLAN_LABEL[payment.planType] ?? 'onbekend'}
                          {payment.isRenewal && <span className="text-ink-muted"> · verlenging</span>}
                        </td>
                        <td className="tabular whitespace-nowrap px-4 font-semibold text-ink-soft">{formatAdminDate(payment.createdAt)}</td>
                        <td className="px-4">
                          <AdminPill tone={status.tone}>{status.label}</AdminPill>
                        </td>
                        <td className="tabular whitespace-nowrap pl-4 pr-5 text-right font-extrabold text-ink">
                          {formatMoneyCents(payment.amountCents, payment.currency)}
                          {payment.refundedCents > 0 && payment.refundedCents < payment.amountCents && (
                            <span className="block text-xs font-bold text-coral-text">
                              {formatMoneyCents(payment.refundedCents, payment.currency)} terug
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mb-3 mt-1 text-sm font-semibold leading-5 text-ink-muted">
              Nog geen betalingen vastgelegd. Als er wel is betaald maar hier niets staat, bereikt de Stripe- of RevenueCat-webhook de
              server niet (zie de controlelijst op <Link href="/beheer/betalingen">Betaal-pijplijn</Link>).
            </p>
          )}
        </div>
      </AdminSection>

      <AdminSection>
        <AdminSectionHead
          icon={<KeyRound className="size-[18px]" strokeWidth={2.2} />}
          title="Groepslicentie toekennen"
          description="Voor een licentie die op factuur is verkocht. De koper moet al een account hebben."
        />
        <AdminGroupLicenseForm defaultSeats={GROUP_LICENSE_SEATS} />
      </AdminSection>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  children,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'lapis' | 'gold';
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[16px] border border-line bg-card px-[18px] py-4">
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold leading-[18px] text-ink-muted">{label}</span>
        <span
          aria-hidden="true"
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-[9px]',
            tone === 'gold' ? 'bg-gold-tint text-gold-text' : 'bg-lapis-tint text-lapis',
          )}
        >
          {icon}
        </span>
      </span>
      <span className="tabular text-[28px] font-extrabold leading-[34px] tracking-[-0.01em] text-ink">{value}</span>
      {children}
    </div>
  );
}

function StatNote({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">{children}</span>;
}

function RevenueTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[12px] border border-line px-4 py-3.5">
      <span className="text-[13px] font-bold text-ink-muted">{label}</span>
      <span className="tabular text-2xl font-extrabold leading-[30px]">{value}</span>
      {note && <span className="tabular text-xs font-bold leading-4 text-ink-muted">{note}</span>}
    </div>
  );
}

/* Icons drawn as in P-Beheer (lucide has no exact match for these). */

function iconProps(size = 18) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

function WarnIcon() {
  return (
    <svg {...iconProps(20)}>
      <path d="M12 4.5L2.8 19.5h18.4z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true" className="fill-gold stroke-gold-text" strokeWidth={1.8} strokeLinejoin="round">
      <path d="M3 18L5 7l5 5 2-7 2 7 5-5 2 11z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    </svg>
  );
}
