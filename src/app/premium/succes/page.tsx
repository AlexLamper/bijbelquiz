import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type Stripe from 'stripe';

import { Button, Container } from '@/components/bq';
import { DetailRows, PremiumPreview } from '@/components/web2/premium/parts';
import { connectDB, User } from '@/database';
import { isMailConfigured } from '@/lib/auth/mail';
import { authOptions } from '@/lib/auth';
import { formatStripeAmount, trialReminderDate } from '@/lib/premium-offer';
import { getPremiumPriceLabels } from '@/lib/premium-prices';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { applyCheckoutSession, readSubscription } from '@/lib/stripe-billing';
import stripe from '@/lib/stripe';
import { readReturnPath, readStripePlan, type StripePlanId } from '@/lib/stripe-plans';
import SessionRefresher from './SessionRefresher';
import { t } from '@/i18n';
import { isNlSite, getSiteConfig } from '@/config/site';
import { rich } from '@/i18n/rich';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.premium-succes.title'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface PageProps {
  searchParams: Promise<{ session_id?: string; next?: string }>;
}

const dateZone = () => (isNlSite() ? 'Europe/Amsterdam' : undefined);
const longDate = { format: (date: Date) => new Intl.DateTimeFormat(t('bq.header.numberLocale'), { day: 'numeric', month: 'long', year: 'numeric', timeZone: dateZone() }).format(date) };
const shortDate = { format: (date: Date) => new Intl.DateTimeFormat(t('bq.header.numberLocale'), { day: 'numeric', month: 'long', timeZone: dateZone() }).format(date) };

const planNames = (): Record<StripePlanId, string> => ({
  yearly: t('premium.yearly'),
  monthly: t('premium.monthly'),
  lifetime: t('pagesBody.success.lifetime'),
  group: t('premium.group.licence'),
});

const DAY_MS = 24 * 60 * 60 * 1000;

interface VerifiedPurchase {
  plan: StripePlanId;
  isTrialing: boolean;
  trialDays: number;
  trialEnd: Date | null;
  trialStart: Date | null;
  periodEnd: Date | null;
  /** "€39,99", from the price Stripe charges. */
  priceLabel: string | null;
  amountPaid: string | null;
}

/**
 * W3 P-PremiumSucces: where Stripe returns a buyer.
 *
 * The checkout is verified here on the server and the account upgraded at
 * once (the webhook does the same, idempotently), because the webhook can be
 * slow or missing. `SessionRefresher` then refreshes the JWT so the header
 * flips to Premium without a reload. "Ga verder waar je was" returns to the
 * page the buyer came from (`next`, a same-site path only), e.g. the quiz the
 * locked paywall interrupted.
 */
export default async function SuccessPage({ searchParams }: PageProps) {
  const { session_id, next } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    // Come back to this same confirmation after signing in, so the payment is
    // still verified and the way back is kept.
    const params = new URLSearchParams();
    if (session_id) params.set('session_id', session_id);
    if (next) params.set('next', next);
    const back = params.toString() ? `/premium/succes?${params.toString()}` : '/premium';
    redirect(`/inloggen?callbackUrl=${encodeURIComponent(back)}`);
  }

  let purchase: VerifiedPurchase | null = null;

  // Verify the payment on the server and open Premium at once; the webhook
  // does the same through the same function, so whichever is first wins and
  // the other changes nothing. Only a completed, paid (or free-trial) checkout
  // of this account counts: an open or unpaid session id opens nothing.
  if (session_id) {
    try {
      await connectDB();
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] });
      const settled =
        checkoutSession.status === 'complete' &&
        (checkoutSession.payment_status === 'paid' || checkoutSession.payment_status === 'no_payment_required');

      if (checkoutSession.metadata?.userId === session.user.id && settled) {
        await applyCheckoutSession(checkoutSession, { observedAt: new Date(), recordAnalytics: false });

        const subscription =
          checkoutSession.subscription && typeof checkoutSession.subscription === 'object'
            ? (checkoutSession.subscription as Stripe.Subscription)
            : null;
        const facts = subscription ? readSubscription(subscription) : null;
        // Read through the shared plan table (and the price, after a switch).
        const planType: StripePlanId = facts?.plan ?? readStripePlan(checkoutSession.metadata?.plan);
        const item = subscription?.items?.data?.[0];

        purchase = {
          plan: planType,
          isTrialing: facts?.status === 'trialing',
          trialDays:
            facts?.trialStart && facts.trialEnd
              ? Math.round((facts.trialEnd.getTime() - facts.trialStart.getTime()) / DAY_MS)
              : 0,
          trialEnd: facts?.trialEnd ?? null,
          trialStart: facts?.trialStart ?? null,
          periodEnd: facts?.currentPeriodEnd ?? null,
          priceLabel: formatStripeAmount(item?.price?.unit_amount, item?.price?.currency),
          amountPaid: formatStripeAmount(checkoutSession.amount_total, checkoutSession.currency),
        };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  }

  // Without a verified checkout (opened later, or Stripe unreachable) the
  // account itself says whether Premium is on.
  let accountIsPremium = false;
  if (!purchase) {
    try {
      await connectDB();
      const user = await User.findById(session.user.id)
        .select('isPremium premiumStripe premiumStore storePremiumExpiresAt groupPremiumUntil hasLifetimePremium premiumGranted premiumGrantedUntil')
        .lean();
      accountIsPremium = Boolean(user && getPremiumSnapshot(user).isPremium);
    } catch (error) {
      console.warn('Could not read premium state on success page', error);
    }
  }

  // Back to whatever the buyer was doing when they hit the wall.
  const continuePath = readReturnPath(next);
  const firstName = (session.user.name || '').trim().split(/\s+/)[0] || '';
  const named = (text: string) => (firstName ? t('pagesBody.success.named', { text, name: firstName }) : t('pagesBody.success.namedPlain', { text }));

  const content = await describe(purchase, accountIsPremium, named);
  const isGroup = purchase?.plan === 'group';

  return (
    <Container as="section" className="pb-20 pt-12 max-m:pt-6">
      <SessionRefresher />
      <div className="mx-auto flex max-w-[600px] flex-col items-center">
        <div className="box-border flex w-full flex-col items-center rounded-[20px] border border-line bg-card px-10 pb-8 pt-9 text-center max-m:p-5">
          {!isGroup && <PremiumPreview variant="open" />}
          <h1 className="m-0 mt-3.5 text-[40px] leading-[48px] max-m:text-[32px] max-m:leading-[38px]">{content.title}</h1>
          <p className="m-0 mt-3 max-w-[460px] text-[17px] font-semibold leading-[26px] text-ink-soft">{content.text}</p>
          {content.rows.length > 0 && <DetailRows rows={content.rows} className="mt-6 self-stretch" />}
          <div className="mt-6 flex flex-col gap-3 self-stretch">
            {isGroup ? (
              <Button href="/groepslicentie" size="hero" block className="rounded-[12px]">
                {t('pagesBody.premium.toGroup')}
              </Button>
            ) : (
              <>
                <Button href={continuePath} size="hero" block className="rounded-[12px]">
                  {t('pagesBody.premium.continue')}
                </Button>
                <Button href="/premium" variant="secondary" size="xl" block className="text-base">
                  {t('pagesBody.success.manageMembership')}
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="m-0 mt-5 max-w-[560px] text-center text-[15px] font-semibold leading-[22px] text-ink-muted [&_a]:font-extrabold [&_a]:no-underline">
          {rich(t('pagesBody.success.questions'), {
            help: <Link href="/hulp">{t('pagesBody.success.helpWord')}</Link>,
            email: <a href={`mailto:${getSiteConfig().supportEmail}`}>{getSiteConfig().supportEmail}</a>,
          })}
        </p>
      </div>
    </Container>
  );
}

async function describe(
  purchase: VerifiedPurchase | null,
  accountIsPremium: boolean,
  named: (text: string) => string,
): Promise<{ title: string; text: string; rows: Array<{ label: string; value: string }> }> {
  if (!purchase) {
    return accountIsPremium
      ? { title: t('pagesBody.success.active'), text: named(t('pagesBody.success.open')), rows: [] }
      : {
          title: t('pagesBody.success.thanks'),
          text: t('pagesBody.success.processing'),
          rows: [],
        };
  }

  if (purchase.plan === 'group') {
    return {
      title: t('pagesBody.success.groupTitle'),
      text: t('pagesBody.success.groupText'),
      rows: [
        { label: t('pagesBody.success.licence'), value: t('premium.group.licence') },
        ...(purchase.periodEnd ? [{ label: t('pagesBody.success.validUntil'), value: longDate.format(purchase.periodEnd) }] : []),
      ],
    };
  }

  const fallbackPrices = await getPremiumPriceLabels();

  if (purchase.plan === 'lifetime') {
    return {
      title: t('pagesBody.success.welcome'),
      text: `${named(t('pagesBody.success.open'))} ${t('pagesBody.success.lifetimeText')}`,
      rows: [
        { label: t('pagesBody.success.subscription'), value: planNames().lifetime },
        { label: t('pagesBody.success.paid'), value: t('premium.lifetimeOnce', { price: purchase.amountPaid ?? fallbackPrices.lifetime }) },
      ],
    };
  }

  const period = purchase.plan === 'yearly' ? t('premium.perYear') : t('premium.perMonth');
  const price = `${purchase.priceLabel ?? fallbackPrices[purchase.plan]} ${period}`;

  if (purchase.isTrialing) {
    // The reminder mail needs SMTP; without it no reminder is promised.
    const reminder = purchase.trialStart && isMailConfigured() ? trialReminderDate(purchase.trialStart, purchase.trialDays) : null;
    const freeDays = purchase.trialDays > 0 ? t('pagesBody.success.firstDays', { days: purchase.trialDays }) : t('pagesBody.success.duringTrial');
    return {
      title: t('pagesBody.success.trialTitle'),
      text: `${named(t('pagesBody.success.open'))} ${t('pagesBody.success.trialText', { freeDays })}`,
      rows: [
        { label: t('pagesBody.success.subscription'), value: planNames()[purchase.plan] },
        ...(purchase.trialEnd ? [{ label: t('pagesBody.success.freeUntil'), value: longDate.format(purchase.trialEnd) }] : []),
        ...(reminder ? [{ label: t('pagesBody.success.reminder'), value: shortDate.format(reminder) }] : []),
        { label: t('pagesBody.success.then'), value: price },
      ],
    };
  }

  return {
    title: t('pagesBody.success.welcome'),
    text: `${named(t('pagesBody.success.open'))} ${t('pagesBody.success.cancelAnytime')}`,
    rows: [
      { label: t('pagesBody.success.subscription'), value: planNames()[purchase.plan] },
      ...(purchase.periodEnd ? [{ label: t('pagesBody.success.nextPayment'), value: longDate.format(purchase.periodEnd) }] : []),
      { label: t('pagesBody.success.amount'), value: price },
    ],
  };
}
