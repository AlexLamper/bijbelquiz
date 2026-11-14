import type { Metadata } from 'next';
import { localizePath } from '@/config/routes';
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
import { parsePriceLabel, yearlyPricePerWeek } from '@/lib/premium-benefits';
import { readPremiumPageQuery, trialReminderDay } from '@/lib/premium-offer';
import { getPremiumPriceLabels, sellablePremiumPlans } from '@/lib/premium-prices';
import { trialDaysForPlan } from '@/lib/stripe-plans';
import { isMailConfigured } from '@/lib/auth/mail';
import { isPremiumUser, PREMIUM_MEMBER_FIELDS, resolvePremiumMemberState, type PremiumMemberState } from './member-state';
import { getSiteConfig } from '@/config/site';
import { t } from '@/i18n';
import { rich } from '@/i18n/rich';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.premium.title'),
    description:
    t('pages.premium.description'),
    alternates: { canonical: localizePath('/premium') },
    openGraph: {
      title: t('pages.premium.ogTitle'),
      description: t('pages.premium.ogDescription'),
      url: `${getSiteConfig().baseUrl}/premium`,
    },
  };
}

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
          .select(PREMIUM_MEMBER_FIELDS)
          .lean()
          .catch(() => null)
      : null,
    Quiz.countDocuments(PLAYABLE_QUIZ).catch(() => 0),
    getPremiumPriceLabels(),
  ]);

  // The database decides, not the session: the session flag lags a purchase.
  const member: PremiumMemberState | null = user && isPremiumUser(user) ? await resolvePremiumMemberState(user) : null;
  const trialDays = trialDaysForPlan('yearly', process.env.STRIPE_TRIAL_DAYS);
  // The reminder mail (src/lib/trial-reminder.ts) needs SMTP; without it the
  // page does not promise one.
  const trialReminder = isMailConfigured();
  const reminderDay = trialReminder ? trialReminderDay(trialDays) : null;
  const billing = Array.isArray(params.billing) ? params.billing[0] : params.billing;
  // The cheapest way in, as a week: the number the plan cards lead with too.
  const fromPerWeek = yearlyPricePerWeek(prices.yearly);
  const yearlyAmount = parsePriceLabel(prices.yearly);
  const underAEuro = yearlyAmount !== null && yearlyAmount / 52 < 1;

  const title = member
    ? t('pagesBody.premium.have')
    : query.locked
      ? (
          <>
            {t('pagesBody.premium.lockedA')}
            <br />
            {t('pagesBody.premium.lockedB')}
          </>
        )
      : (
          <>
            {t('pagesBody.premium.unlimitedA')}
            <br />
            {t('pagesBody.premium.unlimitedB')}
          </>
        );

  return (
    <div className="flex flex-col">
      <Container as="section" className="pt-14 max-m:pt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,500px)] items-center gap-x-16 gap-y-10 max-m:grid-cols-1">
          <div className="flex min-w-0 flex-col items-start gap-[22px]">
            <h1 className="m-0 max-w-[560px] text-[44px] leading-[52px] max-m:text-[32px] max-m:leading-[38px]">{title}</h1>
            {!member && fromPerWeek && (
              <p className="-mt-2 m-0 text-[22px] font-extrabold leading-7 text-lapis max-m:text-lg max-m:leading-6">
                {t('pagesBody.premium.from', { price: fromPerWeek })}
                <span className="block text-[15px] font-semibold leading-5 text-ink-muted">
                  {t('pagesBody.premium.perYearLine', { price: prices.yearly })}{underAEuro ? t('pagesBody.premium.underOne') : '.'}
                </span>
              </p>
            )}
            <PremiumPreview variant={member ? 'open' : 'locked'} />
            <BenefitList />
          </div>

          {member ? (
            <MemberCard member={member} returnPath={query.returnPath} billingError={billing === 'error' || billing === 'unavailable' ? billing : null} />
          ) : (
            <PlanPicker
              prices={prices}
              trialDays={trialDays}
              trialReminder={trialReminder}
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
            <SectionHead title={t('pagesBody.premium.freeOrPremium')} subtitle={t('pagesBody.premium.freeOrPremiumSub')} />
            <ComparisonTable quizCount={quizCount} />
          </div>
        </Container>
      )}

      <Container as="section" className="pb-20 pt-[88px] max-m:pt-12">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)] items-start gap-x-14 gap-y-8 max-m:grid-cols-1">
          <div className="flex flex-col items-start gap-4">
            <SectionHead title={t('pagesBody.premium.faq')} subtitle={t('pagesBody.premium.faqSub')} />
            <Link href="/hulp" className="flex items-center gap-1 text-base font-extrabold no-underline">
              {t('pagesBody.premium.moreHelp')}
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <FaqList
            items={[
              {
                question: t('pagesBody.premium.q1'),
                open: true,
                answer:
                  trialDays > 0
                    ? t('pagesBody.premium.a1', { days: trialDays, reminder: reminderDay ? t('pagesBody.premium.a1Reminder', { day: reminderDay }) : '' })
                    : t('pagesBody.premium.a1None'),
              },
              {
                question: t('pagesBody.premium.q2'),
                answer: t('pagesBody.premium.a2'),
              },
              {
                question: t('pagesBody.premium.q3'),
                answer: t('pagesBody.premium.a3'),
              },
              {
                question: t('pagesBody.premium.q4'),
                answer: t('pagesBody.premium.a4'),
              },
              {
                question: t('pagesBody.premium.q5'),
                answer: t('pagesBody.premium.a5', { price: prices.lifetime }),
              },
              {
                question: t('pagesBody.premium.q6'),
                answer: (
                  <>
                    {rich(t('pagesBody.premium.a6'), { link: <Link href="/groepslicentie">{t('pagesBody.premium.a6Link')}</Link>, seats: GROUP_LICENSE_SEATS })}
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
function MemberCard({
  member,
  returnPath,
  billingError,
}: {
  member: PremiumMemberState;
  returnPath: string | null;
  billingError: 'error' | 'unavailable' | null;
}) {
  return (
    <div className="box-border flex flex-col rounded-[20px] border border-line bg-card px-7 pb-[26px] pt-8 max-m:p-5">
      {billingError && (
        <p role="status" className="m-0 mb-4 rounded-[12px] bg-chip px-4 py-3 text-center text-[15px] font-bold text-ink-soft">
          {billingError === 'unavailable'
            ? t('account.settings.noSubscription', { email: getSiteConfig().supportEmail })
            : t('account.settings.portalError')}
        </p>
      )}
      <h2 className="m-0 text-[22px] leading-7">{t('pagesBody.premium.membership')}</h2>
      <p className="m-0 mt-1.5 text-[15px] font-semibold leading-[22px] text-ink-muted">{member.note}</p>
      <DetailRows rows={member.rows} className="mt-5" />
      <div className="mt-6 flex flex-col gap-3">
        <Button href={returnPath ?? '/quizzen'} size="hero" block>
          {returnPath ? t('pagesBody.premium.continue') : t('pagesBody.premium.toQuizzes')}
        </Button>
        {member.canManageInPortal && (
          <form action="/api/stripe/portal" method="POST">
            <input type="hidden" name="terug" value="/premium" />
            <Button type="submit" variant="secondary" size="xl" block>
              {t('pagesBody.premium.manage')}
            </Button>
          </form>
        )}
        {member.showGroupLink && (
          <Button href="/groepslicentie" variant="secondary" size="xl" block>
            {t('pagesBody.premium.toGroup')}
          </Button>
        )}
      </div>
    </div>
  );
}

const TABLE_CELL = 'px-6 py-4 align-middle max-m:px-2.5 max-m:py-3';

function ComparisonTable({ quizCount }: { quizCount: number }) {
  const rows: Array<{ label: string; free: string | true; premium: string | true }> = [
    { label: t('pagesBody.premium.rowQuizzes'), free: t('pagesBody.premium.freeQuizzes', { n: FREE_QUIZ_LIMIT }), premium: quizCount > 0 ? t('pagesBody.premium.allN', { n: quizCount }) : t('pagesBody.premium.all') },
    { label: t('pagesBody.premium.rowExplain'), free: t('pagesBody.premium.explainFree'), premium: t('pagesBody.premium.explainPremium') },
    { label: t('pagesBody.premium.rowReview'), free: t('pagesBody.premium.reviewFree'), premium: t('pagesBody.premium.reviewPremium') },
    { label: t('samen.start.title'), free: true, premium: true },
    { label: t('pagesBody.premium.rowXp'), free: true, premium: true },
  ];

  return (
    <div className="overflow-x-auto rounded-[16px] border border-line bg-card">
      <table className="w-full border-collapse font-sans">
        <caption className="sr-only">{t('pagesBody.premium.caption')}</caption>
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[30%]" />
          <col className="w-[36%]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={`${TABLE_CELL} border-b border-line text-left text-[13px] font-extrabold text-ink-muted`}>
              {t('pagesBody.premium.whatYouGet')}
            </th>
            <th scope="col" className={`${TABLE_CELL} border-b border-line text-left text-[15px] font-extrabold text-ink-soft`}>
              {t('premium.preview.free')}
            </th>
            <th scope="col" className={`${TABLE_CELL} border-b border-line text-left text-[15px] font-extrabold text-lapis`}>
              <span className="flex items-center gap-[7px]">
                <CrownIcon size={18} className="fill-gold stroke-gold-text" />
                {t('premium.preview.premium')}
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
                    <CheckDisc size={22} label={t('pagesBody.premium.yes')} />
                  ) : (
                    <span className="text-[15px] font-bold text-ink-soft">{row.free}</span>
                  )}
                </td>
                <td className={`${TABLE_CELL} ${line}`}>
                  {row.premium === true ? (
                    <CheckDisc size={22} label={t('pagesBody.premium.yes')} />
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
