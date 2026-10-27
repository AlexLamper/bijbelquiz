import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { Button, Container } from '@/components/bq';
import { PlanPicker } from '@/components/web2/premium/PlanPicker';
import {
  BenefitList,
  CheckDisc,
  CrownIcon,
  DetailRows,
  FaqList,
  PremiumPreview,
  SectionHead,
} from '@/components/web2/premium/parts';
import { connectDB, Quiz, User } from '@/database';
import { readPaywallTrigger } from '@/lib/analytics/events';
import { authOptions } from '@/lib/auth';
import { FREE_QUIZ_LIMIT } from '@/lib/free-quiz-limit';
import { GROUP_LICENSE_SEATS } from '@/lib/group-license-constants';
import { readPremiumPageQuery, trialReminderDay } from '@/lib/premium-offer';
import { getPremiumPriceLabels, sellablePremiumPlans } from '@/lib/premium-prices';
import { trialDaysForPlan } from '@/lib/stripe-plans';
import { isPremiumUser, resolvePremiumMemberState, type PremiumMemberState } from './member-state';

export const metadata: Metadata = {
  title: 'Premium - Speel onbeperkt',
  description:
    'Speel alle bijbelquizzen zo vaak je wilt, lees de uitleg bij elk antwoord en kijk je antwoorden terug na elke quiz. Jaarlijks met 7 dagen gratis proberen.',
  alternates: { canonical: '/premium' },
  openGraph: {
    title: 'BijbelQuiz Premium',
    description: 'Alle quizzen, zo vaak je wilt. Uitleg bij elk antwoord. Je antwoorden terugkijken na elke quiz.',
    url: 'https://www.bijbelquiz.com/premium',
  },
};

export const dynamic = 'force-dynamic';

/** Quizzes a player can open: approved, or from before moderation existed. */
const PLAYABLE_QUIZ = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };

interface PremiumPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * W2 P-Premium, and its locked variant (`?vergrendeld=1&terug=<pad>`), the
 * wall a player hits on their fourth new quiz: same page, no way back, its own
 * title, and after paying the player returns to `terug`.
 *
 * Players who already have Premium - bought here, in the app, for life or via
 * a group licence - never see the plans: they see their membership instead.
 */
export default async function PremiumPage({ searchParams }: PremiumPageProps) {
  const params = await searchParams;
  const query = readPremiumPageQuery(params);
  const reden = Array.isArray(params.reden) ? params.reden[0] : params.reden;
  const trigger = reden ? readPaywallTrigger(reden) : query.locked ? 'gratis-limiet' : 'direct';

  const session = await getServerSession(authOptions);

  await connectDB();
  const [user, quizCount, prices] = await Promise.all([
    session?.user?.id
      ? User.findById(session.user.id)
          .select(
            'name email isPremium premiumStripe premiumStore storePremiumExpiresAt groupPremiumUntil hasLifetimePremium stripeCustomerId stripeSubscriptionId stripeSubscriptionStatus',
          )
          .lean()
          .catch(() => null)
      : null,
    Quiz.countDocuments(PLAYABLE_QUIZ).catch(() => 0),
    getPremiumPriceLabels(),
  ]);

  // The database decides, not the session: the session flag lags a purchase.
  const member: PremiumMemberState | null = user && isPremiumUser(user) ? await resolvePremiumMemberState(user) : null;
  const trialDays = trialDaysForPlan('yearly', process.env.STRIPE_TRIAL_DAYS);
  const reminderDay = trialReminderDay(trialDays);

  const title = member
    ? 'Je hebt Premium'
    : query.locked
      ? (
          <>
            Mooi gespeeld!
            <br />
            Speel verder met Premium
          </>
        )
      : (
          <>
            Speel onbeperkt
            <br />
            met Premium
          </>
        );

  return (
    <div className="flex flex-col">
      <Container as="section" className="pt-14 max-m:pt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,500px)] items-center gap-x-16 gap-y-10 max-m:grid-cols-1">
          <div className="flex min-w-0 flex-col items-start gap-[22px]">
            <h1 className="m-0 max-w-[560px] text-[44px] leading-[52px] max-m:text-[32px] max-m:leading-[38px]">{title}</h1>
            <PremiumPreview variant={member ? 'open' : 'locked'} />
            <BenefitList />
          </div>

          {member ? (
            <MemberCard member={member} returnPath={query.returnPath} />
          ) : (
            <PlanPicker
              prices={prices}
              trialDays={trialDays}
              sellable={sellablePremiumPlans()}
              initialPlan={query.plan}
              isLoggedIn={Boolean(session?.user?.id)}
              locked={query.locked}
              returnPath={query.returnPath}
              trigger={trigger}
              checkoutCancelled={query.checkoutCancelled}
            />
          )}
        </div>
      </Container>

      {!member && (
        <Container as="section" className="pt-[88px] max-m:pt-12">
          <div className="flex flex-col gap-6">
            <SectionHead title="Gratis of Premium" subtitle="Je account blijft altijd gratis. Premium zet alles open." />
            <ComparisonTable quizCount={quizCount} />
          </div>
        </Container>
      )}

      <Container as="section" className="pb-20 pt-[88px] max-m:pt-12">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)] items-start gap-x-14 gap-y-8 max-m:grid-cols-1">
          <div className="flex flex-col items-start gap-4">
            <SectionHead title="Vragen over Premium" subtitle="Over de proefperiode, opzeggen en betalen." />
            <Link href="/hulp" className="flex items-center gap-1 text-base font-extrabold no-underline">
              Meer in de hulp
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <FaqList
            items={[
              {
                question: 'Hoe werkt de proefperiode?',
                open: true,
                answer:
                  trialDays > 0
                    ? `Kies je Jaarlijks, dan betaal je de eerste ${trialDays} dagen niets.${
                        reminderDay ? ` Op dag ${reminderDay} krijg je een herinnering.` : ''
                      } Zeg je niet op, dan start je jaarabonnement na de ${trialDays} dagen.`
                    : 'Op dit moment is er geen proefperiode. Je betaalt vanaf de eerste dag en kunt opzeggen wanneer je wilt.',
              },
              {
                question: 'Hoe zeg ik op?',
                answer:
                  'Wanneer je wilt, via Profiel en dan Premium. Je houdt Premium tot het einde van de periode die je al betaald hebt. Betaal je via de app, dan zeg je op in de App Store of Google Play.',
              },
              {
                question: 'Wat als ik opzeg in de proefperiode?',
                answer: 'Dan betaal je niets en speel je gratis verder. Je XP, je reeks en je duels blijven bewaard.',
              },
              {
                question: 'Werkt Premium ook in de app?',
                answer: 'Ja. Premium hoort bij je account. Log in de app in met hetzelfde account en alles staat open.',
              },
              {
                question: 'Wat is levenslang Premium?',
                answer: `Je betaalt één keer ${prices.lifetime} en houdt Premium, zonder abonnement en zonder verlenging.`,
              },
              {
                question: 'Is er iets voor groepen?',
                answer: (
                  <>
                    Ja. Voor kerken, scholen en jeugdgroepen is er de <Link href="/groepslicentie">groepslicentie</Link>: Premium voor{' '}
                    {GROUP_LICENSE_SEATS} plekken onder één code.
                  </>
                ),
              },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}

/** The right-hand card for somebody who already has Premium. */
function MemberCard({ member, returnPath }: { member: PremiumMemberState; returnPath: string | null }) {
  return (
    <div className="box-border flex flex-col rounded-[20px] border border-line bg-card px-7 pb-[26px] pt-8 max-m:p-5">
      <h2 className="m-0 text-[22px] leading-7">Je lidmaatschap</h2>
      <p className="m-0 mt-1.5 text-[15px] font-semibold leading-[22px] text-ink-muted">{member.note}</p>
      <DetailRows rows={member.rows} className="mt-5" />
      <div className="mt-6 flex flex-col gap-3">
        <Button href={returnPath ?? '/quizzen'} size="hero" block>
          {returnPath ? 'Ga verder waar je was' : 'Naar de quizzen'}
        </Button>
        {member.canManageInPortal && (
          <form action="/api/stripe/portal" method="POST">
            <Button type="submit" variant="secondary" size="xl" block>
              Beheer je abonnement
            </Button>
          </form>
        )}
        {member.showGroupLink && (
          <Button href="/groepslicentie" variant="secondary" size="xl" block>
            Naar je groep
          </Button>
        )}
      </div>
    </div>
  );
}

const TABLE_CELL = 'px-6 py-4 align-middle max-m:px-2.5 max-m:py-3';

function ComparisonTable({ quizCount }: { quizCount: number }) {
  const rows: Array<{ label: string; free: string | true; premium: string | true }> = [
    { label: 'Quizzen', free: `${FREE_QUIZ_LIMIT} quizzen`, premium: quizCount > 0 ? `Alle ${quizCount} quizzen` : 'Alle quizzen' },
    { label: 'Uitleg bij elk antwoord', free: 'Alleen de bijbelverwijzing', premium: 'Bij elke vraag' },
    { label: 'Antwoorden terugkijken', free: 'Alleen je score', premium: 'Na elke quiz' },
    { label: 'Duels', free: true, premium: true },
    { label: 'Samen spelen', free: true, premium: true },
    { label: 'XP, reeks en ranglijst', free: true, premium: true },
  ];

  return (
    <div className="overflow-x-auto rounded-[16px] border border-line bg-card">
      <table className="w-full border-collapse font-sans">
        <caption className="sr-only">Verschil tussen gratis en Premium</caption>
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[30%]" />
          <col className="w-[36%]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={`${TABLE_CELL} border-b border-line text-left text-[13px] font-extrabold text-ink-muted`}>
              Wat je krijgt
            </th>
            <th scope="col" className={`${TABLE_CELL} border-b border-line text-left text-[15px] font-extrabold text-ink-soft`}>
              Gratis
            </th>
            <th scope="col" className={`${TABLE_CELL} border-b border-line text-left text-[15px] font-extrabold text-lapis`}>
              <span className="flex items-center gap-[7px]">
                <CrownIcon size={18} className="fill-gold stroke-gold-text" />
                Premium
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const line = index < rows.length - 1 ? 'border-b border-line-soft' : '';
            return (
              <tr key={row.label}>
                <th scope="row" className={`${TABLE_CELL} ${line} text-left text-[15px] font-extrabold text-ink`}>
                  {row.label}
                </th>
                <td className={`${TABLE_CELL} ${line}`}>
                  {row.free === true ? (
                    <CheckDisc size={22} label="Ja" />
                  ) : (
                    <span className="text-[15px] font-bold text-ink-soft">{row.free}</span>
                  )}
                </td>
                <td className={`${TABLE_CELL} ${line}`}>
                  {row.premium === true ? (
                    <CheckDisc size={22} label="Ja" />
                  ) : (
                    <span className="flex items-center gap-2.5 text-[15px] font-extrabold text-ink">
                      <span className="flex max-m:hidden">
                        <CheckDisc size={22} />
                      </span>
                      <span>{row.premium}</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
