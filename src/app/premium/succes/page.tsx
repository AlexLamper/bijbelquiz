import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type Stripe from 'stripe';

import { Button, Container } from '@/components/bq';
import { DetailRows, PremiumPreview } from '@/components/web2/premium/parts';
import { connectDB, Payment, User } from '@/database';
import { authOptions } from '@/lib/auth';
import { formatStripeAmount, trialReminderDate } from '@/lib/premium-offer';
import { getPremiumPriceLabels } from '@/lib/premium-prices';
import { getPremiumSnapshot, updateUserPremiumFromStripe } from '@/lib/premium-state';
import stripe from '@/lib/stripe';
import { readReturnPath, readStripePlan, STRIPE_PLANS, type StripePlanId } from '@/lib/stripe-plans';
import SessionRefresher from './SessionRefresher';

export const metadata: Metadata = {
  title: 'Welkom bij Premium',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{ session_id?: string; next?: string }>;
}

const longDate = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' });
const shortDate = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' });

const PLAN_NAMES: Record<StripePlanId, string> = {
  yearly: 'Jaarlijks',
  monthly: 'Maandelijks',
  lifetime: 'Levenslang',
  group: 'Groepslicentie',
};

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

  // Verify the payment securely on the server
  if (session_id) {
    try {
      await connectDB();
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

      if (checkoutSession.metadata?.userId === session.user.id) {
        // Read through the shared plan table. Deciding "monthly or else
        // lifetime" here is what used to hand every yearly subscriber - and
        // every group licence buyer - permanent free access.
        const planType = readStripePlan(checkoutSession.metadata?.plan);
        const planConfig = STRIPE_PLANS[planType];

        const customerId = typeof checkoutSession.customer === 'string' ? checkoutSession.customer : undefined;
        const subscriptionId = typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : undefined;

        purchase = {
          plan: planType,
          isTrialing: false,
          trialDays: 0,
          trialEnd: null,
          trialStart: null,
          periodEnd: null,
          priceLabel: null,
          amountPaid: formatStripeAmount(checkoutSession.amount_total, checkoutSession.currency),
        };

        let subscriptionStatus: string | undefined;
        if (subscriptionId) {
          try {
            const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = subscription.status;
            purchase.isTrialing = subscription.status === 'trialing';
            if (typeof subscription.trial_end === 'number') purchase.trialEnd = new Date(subscription.trial_end * 1000);
            if (typeof subscription.trial_start === 'number') purchase.trialStart = new Date(subscription.trial_start * 1000);
            if (purchase.trialEnd && purchase.trialStart) {
              purchase.trialDays = Math.round((purchase.trialEnd.getTime() - purchase.trialStart.getTime()) / DAY_MS);
            }
            const item = subscription.items?.data?.[0];
            if (typeof item?.current_period_end === 'number') purchase.periodEnd = new Date(item.current_period_end * 1000);
            purchase.priceLabel = formatStripeAmount(item?.price?.unit_amount, item?.price?.currency);
          } catch (subscriptionError) {
            console.warn('Could not fetch subscription status on success page', subscriptionError);
          }
        }

        // A group licence is not a personal subscription: the webhook grants the
        // licence and its join code, and touching the buyer's own premium flags
        // here would leave them stuck on after the licence lapses.
        if (!planConfig.isGroup) {
          // Update DB immediately in case webhook is slow or missing. Route the
          // write through the same helper the webhook uses: setting `isPremium`
          // directly used to leave `premiumStripe` unset, so the two sources of
          // truth disagreed until some later Stripe event happened to repair it.
          await updateUserPremiumFromStripe(session.user.id, true, {
            hasLifetimePremium: planConfig.isLifetime,
            ...(customerId ? { stripeCustomerId: customerId } : {}),
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            ...(subscriptionStatus ? { stripeSubscriptionStatus: subscriptionStatus } : {}),
          });
        }

        await Payment.updateOne(
          { provider: 'stripe', stripeSessionId: checkoutSession.id },
          {
            $setOnInsert: {
              user: session.user.id,
              provider: 'stripe',
              planType,
              stripeSessionId: checkoutSession.id,
              stripeSubscriptionId: subscriptionId,
              amount: checkoutSession.amount_total || 0,
              currency: checkoutSession.currency || 'eur',
              status: 'completed',
            },
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  }

  // Without a verified checkout (opened later, or Stripe unreachable) the
  // account itself says whether Premium is on.
  let accountIsPremium = false;
  if (!purchase) {
    try {
      await connectDB();
      const user = await User.findById(session.user.id)
        .select('isPremium premiumStripe premiumStore storePremiumExpiresAt groupPremiumUntil hasLifetimePremium')
        .lean();
      accountIsPremium = Boolean(user && (getPremiumSnapshot(user).isPremium || user.hasLifetimePremium));
    } catch (error) {
      console.warn('Could not read premium state on success page', error);
    }
  }

  // Back to whatever the buyer was doing when they hit the wall.
  const continuePath = readReturnPath(next);
  const firstName = (session.user.name || '').trim().split(/\s+/)[0] || '';
  const named = (text: string) => (firstName ? `${text}, ${firstName}.` : `${text}.`);

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
                Naar je groep
              </Button>
            ) : (
              <>
                <Button href={continuePath} size="hero" block className="rounded-[12px]">
                  Ga verder waar je was
                </Button>
                <Button href="/premium" variant="secondary" size="xl" block className="text-base">
                  Beheer je lidmaatschap
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="m-0 mt-5 max-w-[560px] text-center text-[15px] font-semibold leading-[22px] text-ink-muted [&_a]:font-extrabold [&_a]:no-underline">
          Vragen over je abonnement? Kijk in de <Link href="/hulp">hulp</Link> of mail{' '}
          <a href="mailto:info@bijbelquiz.com">info@bijbelquiz.com</a>.
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
      ? { title: 'Premium is actief', text: named('Premium staat open'), rows: [] }
      : {
          title: 'Bedankt voor je bestelling',
          text: 'We verwerken je betaling. Zodra die binnen is, staat Premium vanzelf open.',
          rows: [],
        };
  }

  if (purchase.plan === 'group') {
    return {
      title: 'Je groepslicentie is actief',
      text: 'Je groepscode staat klaar. Deel hem met je groep, dan hebben ze meteen Premium.',
      rows: [
        { label: 'Licentie', value: 'Groepslicentie' },
        ...(purchase.periodEnd ? [{ label: 'Loopt tot', value: longDate.format(purchase.periodEnd) }] : []),
      ],
    };
  }

  const fallbackPrices = await getPremiumPriceLabels();

  if (purchase.plan === 'lifetime') {
    return {
      title: 'Welkom bij Premium',
      text: `${named('Premium staat open')} Je hebt levenslang Premium, zonder abonnement en zonder verlenging.`,
      rows: [
        { label: 'Abonnement', value: PLAN_NAMES.lifetime },
        { label: 'Betaald', value: `${purchase.amountPaid ?? fallbackPrices.lifetime} eenmalig` },
      ],
    };
  }

  const period = purchase.plan === 'yearly' ? 'per jaar' : 'per maand';
  const price = `${purchase.priceLabel ?? fallbackPrices[purchase.plan]} ${period}`;

  if (purchase.isTrialing) {
    const reminder = purchase.trialStart ? trialReminderDate(purchase.trialStart, purchase.trialDays) : null;
    const freeDays = purchase.trialDays > 0 ? `de eerste ${purchase.trialDays} dagen` : 'tijdens de proefperiode';
    return {
      title: 'Je proefperiode is gestart',
      text: `${named('Premium staat open')} Je betaalt ${freeDays} niets en kunt opzeggen wanneer je wilt.`,
      rows: [
        { label: 'Abonnement', value: PLAN_NAMES[purchase.plan] },
        ...(purchase.trialEnd ? [{ label: 'Gratis tot', value: longDate.format(purchase.trialEnd) }] : []),
        ...(reminder ? [{ label: 'Herinnering', value: shortDate.format(reminder) }] : []),
        { label: 'Daarna', value: price },
      ],
    };
  }

  return {
    title: 'Welkom bij Premium',
    text: `${named('Premium staat open')} Je kunt opzeggen wanneer je wilt.`,
    rows: [
      { label: 'Abonnement', value: PLAN_NAMES[purchase.plan] },
      ...(purchase.periodEnd ? [{ label: 'Volgende betaling', value: longDate.format(purchase.periodEnd) }] : []),
      { label: 'Bedrag', value: price },
    ],
  };
}
