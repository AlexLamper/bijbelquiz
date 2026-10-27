import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import { AdminPageHeader } from '@/components/bq/AdminShell';
import { Breadcrumbs } from '@/components/bq/Breadcrumbs';
import { Pill } from '@/components/bq/Pill';
import {
  CardTitle,
  EmptyRow,
  Grid,
  Note,
  StatCard,
  TableCard,
  Tag,
  Td,
  Th,
  formatDateTime,
  formatNumber,
} from '@/components/web2/beheer-2/parts';
import { formatAdminDate } from '@/components/web2/beheer/ui';
import { InfoRow, PlatformCell, PremiumCell, lastActiveLabel } from '@/components/web2/beheer-users/display';
import { GrantPremiumButton, RevokePremiumButton } from '@/components/web2/beheer-users/GrantPremium';
import { formatMoneyCents } from '@/lib/premium-stats';
import { GRANT_DURATION_LABELS, PREMIUM_SOURCE_LABELS, isGrantDuration } from '@/lib/admin/grant-options';
import { METHOD_LABELS, PLATFORM_LABELS } from '@/lib/admin/platform-labels';
import { getAdminUserDetail } from '@/lib/admin/users';

export const metadata: Metadata = {
  title: 'Gebruiker - Beheer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  monthly: 'Maandelijks',
  yearly: 'Jaarlijks',
  lifetime: 'Levenslang',
  group: 'Groepslicentie',
};

const PAYMENT_STATUS: Record<string, { label: string; tone: 'green' | 'coral' | 'grey' | 'gold' }> = {
  completed: { label: 'Voltooid', tone: 'green' },
  failed: { label: 'Mislukt', tone: 'coral' },
  pending: { label: 'In behandeling', tone: 'grey' },
  refunded: { label: 'Terugbetaald', tone: 'coral' },
  disputed: { label: 'Betwist', tone: 'gold' },
  trial: { label: 'Proefperiode', tone: 'grey' },
};

const STRIPE_STATUS: Record<string, string> = {
  trialing: 'proefperiode',
  active: 'actief',
  past_due: 'betaling achter',
  canceled: 'opgezegd',
  unpaid: 'onbetaald',
  incomplete: 'onvolledig',
  incomplete_expired: 'verlopen',
  paused: 'gepauzeerd',
};

const FREQUENCY: Record<string, string> = {
  daily: 'Dagelijks',
  weekly: 'Wekelijks',
  monthly: 'Maandelijks',
  rarely: 'Zelden',
  never: 'Nooit',
};

function SourceRow({ label, active, children }: { label: string; active: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line-soft py-3 first:border-t-0">
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] font-extrabold">{label}</span>
        {children && <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">{children}</span>}
      </span>
      <Pill tone={active ? 'green' : 'grey'} size="sm">
        {active ? 'Actief' : 'Niet actief'}
      </Pill>
    </div>
  );
}

/**
 * Everything known about one account: profile, where it came from and where
 * it is used, every Premium source with its dates, the grant history,
 * payments, recent quizzes, and the admin actions (Premium geven/intrekken).
 */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') redirect('/');

  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { user, premium, grantLog, platformHistory, payments, recentAttempts, counts } = detail;
  const now = new Date();
  const manual = premium.manual;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Gebruikers', href: '/beheer/gebruikers' }, { label: user.name }]} />
      <AdminPageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            {user.name}
            {user.isInternal && <Tag>Testaccount</Tag>}
            {user.role === 'admin' && <Tag tone="accent">Beheer</Tag>}
          </span>
        }
        description={<span className="[overflow-wrap:anywhere]">{user.email}</span>}
        actions={
          <>
            {manual.active && <RevokePremiumButton userId={user.id} userName={user.name} />}
            <GrantPremiumButton userId={user.id} userName={user.name} hasGrant={manual.active} label={manual.active ? 'Einddatum wijzigen' : 'Premium geven'} />
          </>
        }
      />

      <Grid cols={4} variant="stats">
        <StatCard label="Quizzen gespeeld" value={formatNumber(user.quizzesPlayed)} meta={`gemiddeld ${formatNumber(user.averageScore)}% goed`} />
        <StatCard label="XP" value={formatNumber(user.xp)} meta={`niveau ${user.level} · ${user.levelTitle}`} />
        <StatCard label="Reeks" value={formatNumber(user.streak)} meta={`langste ${formatNumber(user.bestStreak)} dagen`} />
        <StatCard
          label="Duels"
          value={formatNumber(counts.duels.total)}
          meta={`${formatNumber(counts.duels.won)} gewonnen · ${formatNumber(counts.duels.finished)} afgerond`}
        />
      </Grid>

      <Grid cols={2}>
        <section className="flex min-w-0 flex-col gap-2 rounded-[16px] border border-line bg-card px-5 pb-3 pt-[18px]">
          <CardTitle title="Premium" description="Elke bron telt los; Premium stopt pas als ze allemaal voorbij zijn." />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <PremiumCell premium={premium} />
          </div>
          <div className="flex flex-col">
            <SourceRow label="Website (Stripe)" active={premium.stripe.active}>
              {premium.stripe.status
                ? `${STRIPE_STATUS[premium.stripe.status] ?? premium.stripe.status}${premium.stripe.plan ? ` · ${PLAN_LABEL[premium.stripe.plan] ?? premium.stripe.plan}` : ''}${
                    premium.stripe.currentPeriodEnd
                      ? ` · ${premium.stripe.cancelAtPeriodEnd ? 'stopt' : 'verlengt'} ${formatAdminDate(premium.stripe.currentPeriodEnd)}`
                      : ''
                  }${premium.stripe.trialEnd ? ` · proef tot ${formatAdminDate(premium.stripe.trialEnd)}` : ''}`
                : 'Geen abonnement'}
            </SourceRow>
            <SourceRow label="App Store / Play" active={premium.store.active}>
              {premium.store.expiresAt ? `${premium.store.active ? 'loopt tot' : 'liep tot'} ${formatAdminDate(premium.store.expiresAt)}` : 'Geen aankoop in de app'}
            </SourceRow>
            <SourceRow label="Levenslang" active={premium.lifetime.active} />
            <SourceRow label="Groepslicentie" active={premium.group.active}>
              {premium.group.licenses.length > 0
                ? premium.group.licenses
                    .map((license) => `${license.name} (${license.role === 'owner' ? 'eigenaar' : 'lid'}${license.expiresAt ? `, tot ${formatAdminDate(license.expiresAt)}` : ''})`)
                    .join(', ')
                : premium.group.until
                  ? `liep tot ${formatAdminDate(premium.group.until)}`
                  : 'Geen groep'}
            </SourceRow>
            <SourceRow label="Gegeven door beheer" active={manual.active}>
              {manual.active
                ? manual.legacy
                  ? 'Met de hand aangezet, zonder einddatum (van voor de datering)'
                  : `${manual.until ? `tot ${formatAdminDate(manual.until)}` : 'zonder einddatum'}${manual.grantedBy ? ` · door ${manual.grantedBy.name || manual.grantedBy.email}` : ''}${
                      manual.note ? ` · "${manual.note}"` : ''
                    }`
                : manual.grantedAt
                  ? `laatst gegeven op ${formatAdminDate(manual.grantedAt)}`
                  : 'Nooit gegeven'}
            </SourceRow>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-2 rounded-[16px] border border-line bg-card px-5 pb-3 pt-[18px]">
          <CardTitle title="Account" />
          <div className="flex flex-col">
            <InfoRow label="Aangemeld">{formatDateTime(user.createdAt, false)}</InfoRow>
            <InfoRow label="Via">
              <PlatformCell platform={user.signupPlatform} derived={user.signupPlatformDerived} className="items-end" />
            </InfoRow>
            <InfoRow label="Inlogmethode">
              {METHOD_LABELS[user.signupMethod]}
              {[user.auth.password && 'wachtwoord', user.auth.google && 'Google', user.auth.apple && 'Apple'].filter(Boolean).length > 1 &&
                ` (gekoppeld: ${[user.auth.password && 'wachtwoord', user.auth.google && 'Google', user.auth.apple && 'Apple'].filter(Boolean).join(', ')})`}
            </InfoRow>
            <InfoRow label="Laatst actief">
              {lastActiveLabel(user.lastActiveAt, now)}
              {user.lastSeenPlatform && ` · ${PLATFORM_LABELS[user.lastSeenPlatform]}`}
            </InfoRow>
            <InfoRow label="Laatst gespeeld">{user.lastPlayedAt ? formatDateTime(user.lastPlayedAt, false) : 'nooit'}</InfoRow>
            <InfoRow label="Groepen">
              {formatNumber(counts.playerGroups.owned)} eigen · lid van {formatNumber(counts.playerGroups.member)}
            </InfoRow>
            <InfoRow label="Groepslicenties">
              {formatNumber(counts.groupLicenses.owned)} eigen · lid van {formatNumber(counts.groupLicenses.member)}
            </InfoRow>
            <InfoRow label="Samen spelen gehost">{formatNumber(user.multiplayerGamesHosted)}</InfoRow>
            {user.onboarding?.bibleReadingFrequency && (
              <InfoRow label="Leest in de Bijbel">{FREQUENCY[user.onboarding.bibleReadingFrequency] ?? user.onboarding.bibleReadingFrequency}</InfoRow>
            )}
            {user.badges.length > 0 && <InfoRow label="Badges">{formatNumber(user.badges.length)}</InfoRow>}
          </div>
        </section>
      </Grid>

      <TableCard
        title="Waar gebruikt"
        description="Uit de metingen van website en app (bewaard 400 dagen). Bezoeken zijn sessies: een websitebezoek of het openen van de app."
        caption="Platformgeschiedenis"
        minWidth={560}
        stack
        head={
          <>
            <Th>Platform</Th>
            <Th>Eerst</Th>
            <Th>Laatst</Th>
            <Th align="right">Bezoeken</Th>
            <Th align="right">Metingen</Th>
          </>
        }
      >
        {platformHistory.length === 0 ? (
          <EmptyRow columns={5}>Geen metingen voor dit account.</EmptyRow>
        ) : (
          platformHistory.map((row) => (
            <tr key={row.platform}>
              <Td tone="strong">{PLATFORM_LABELS[row.platform]}</Td>
              <Td numeric label="Eerst">
                {formatAdminDate(row.firstAt) || '-'}
              </Td>
              <Td numeric label="Laatst">
                {formatAdminDate(row.lastAt) || '-'}
              </Td>
              <Td align="right" numeric label="Bezoeken">
                {formatNumber(row.sessions)}
              </Td>
              <Td align="right" numeric label="Metingen">
                {formatNumber(row.events)}
              </Td>
            </tr>
          ))
        )}
      </TableCard>

      <TableCard
        title="Premium-geschiedenis"
        description="Elke keer dat beheer Premium gaf of introk, met wie en waarom."
        caption="Premium-geschiedenis"
        minWidth={640}
        stack
        head={
          <>
            <Th>Wanneer</Th>
            <Th>Actie</Th>
            <Th>Tot</Th>
            <Th>Door</Th>
            <Th>Notitie</Th>
          </>
        }
      >
        {grantLog.length === 0 ? (
          <EmptyRow columns={5}>Beheer heeft dit account nog nooit Premium gegeven.</EmptyRow>
        ) : (
          grantLog.map((entry, index) => (
            <tr key={`${entry.at}-${index}`}>
              <Td numeric tone="strong">
                {formatDateTime(entry.at, false)}
              </Td>
              <Td label="Actie">
                <Pill tone={entry.action === 'grant' ? 'gold' : 'grey'} size="sm">
                  {entry.action === 'grant'
                    ? `Gegeven${entry.duration && isGrantDuration(entry.duration) ? `: ${GRANT_DURATION_LABELS[entry.duration].toLowerCase()}` : ''}`
                    : 'Ingetrokken'}
                </Pill>
              </Td>
              <Td numeric label="Tot">
                {entry.action === 'grant' ? (entry.until ? formatAdminDate(entry.until) : 'geen einddatum') : '-'}
              </Td>
              <Td label="Door">{entry.by.name || entry.by.email || '-'}</Td>
              <Td label="Notitie" tone="muted">
                {entry.note || '-'}
              </Td>
            </tr>
          ))
        )}
      </TableCard>

      <TableCard
        title="Betalingen"
        description="Uit de Payment-collectie, nieuwste eerst."
        caption="Betalingen"
        minWidth={720}
        stack
        head={
          <>
            <Th>Datum</Th>
            <Th>Via</Th>
            <Th>Plan</Th>
            <Th>Status</Th>
            <Th align="right">Bedrag</Th>
          </>
        }
      >
        {payments.length === 0 ? (
          <EmptyRow columns={5}>Geen betalingen van dit account.</EmptyRow>
        ) : (
          payments.map((payment) => {
            const status = PAYMENT_STATUS[payment.status] ?? { label: payment.status || 'Onbekend', tone: 'grey' as const };
            return (
              <tr key={payment.id}>
                <Td numeric tone="strong">
                  {formatDateTime(payment.createdAt, false)}
                </Td>
                <Td label="Via">
                  {payment.provider === 'revenuecat'
                    ? payment.store === 'play_store'
                      ? 'Google Play'
                      : payment.store === 'app_store'
                        ? 'App Store'
                        : 'App'
                    : 'Stripe'}
                </Td>
                <Td label="Plan">
                  {PLAN_LABEL[payment.planType] ?? 'onbekend'}
                  {payment.isRenewal && <span className="text-ink-muted"> · verlenging</span>}
                </Td>
                <Td label="Status">
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Pill tone={status.tone} size="sm">
                      {status.label}
                    </Pill>
                    {payment.isTest && <Tag>Test</Tag>}
                  </span>
                </Td>
                <Td align="right" numeric tone="strong" label="Bedrag">
                  {formatMoneyCents(payment.amountCents, payment.currency)}
                  {payment.refundedCents > 0 && payment.refundedCents < payment.amountCents && (
                    <span className="block text-xs font-bold text-coral-text">{formatMoneyCents(payment.refundedCents, payment.currency)} terug</span>
                  )}
                </Td>
              </tr>
            );
          })
        )}
      </TableCard>

      <TableCard
        title="Laatste quizzen"
        description={`De nieuwste ${Math.min(20, counts.attempts)} van ${formatNumber(counts.attempts)} gespeelde quizzen.`}
        caption="Laatste quizzen"
        minWidth={560}
        stack
        head={
          <>
            <Th>Quiz</Th>
            <Th>Gespeeld</Th>
            <Th align="right">Score</Th>
            <Th align="right">XP</Th>
          </>
        }
      >
        {recentAttempts.length === 0 ? (
          <EmptyRow columns={4}>Nog geen quiz gespeeld.</EmptyRow>
        ) : (
          recentAttempts.map((attempt) => (
            <tr key={attempt.id}>
              <Td tone="strong">
                {attempt.quizId ? (
                  <Link href={`/beheer/quizzen/${attempt.quizId}/bewerken`} className="text-ink no-underline hover:text-lapis">
                    {attempt.quizTitle}
                  </Link>
                ) : (
                  attempt.quizTitle
                )}
              </Td>
              <Td numeric label="Gespeeld">
                {formatDateTime(attempt.completedAt, false)}
              </Td>
              <Td align="right" numeric label="Score">
                {attempt.score} / {attempt.totalQuestions}
              </Td>
              <Td align="right" numeric label="XP">
                {formatNumber(attempt.xpEarned)}
              </Td>
            </tr>
          ))
        )}
      </TableCard>

      {premium.stripe.customerId && (
        <Note>
          Stripe-klant <span className="font-mono text-xs">{premium.stripe.customerId}</span>
          {premium.stripe.subscriptionId && (
            <>
              {' '}
              · abonnement <span className="font-mono text-xs">{premium.stripe.subscriptionId}</span>
            </>
          )}
          {premium.source && ` · Premium nu via ${PREMIUM_SOURCE_LABELS[premium.source].toLowerCase()}`}
        </Note>
      )}
    </>
  );
}
