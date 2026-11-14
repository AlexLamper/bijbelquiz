import type { Types } from 'mongoose';

import { connectDB, User } from '@/database';
import { isMailConfigured, sendAccountMail, type AccountMail } from '@/lib/auth/mail';
import { formatStripeAmount } from '@/lib/premium-offer';
import { isNlSite, getSiteConfig } from '@/config/site';
import { t } from '@/i18n';

/**
 * "Herinnering op dag 5": the mail the Premium page promises before a free
 * trial of the yearly plan turns into a paid year.
 *
 * Two triggers, one flag. Stripe's `customer.subscription.trial_will_end`
 * (three days before the end: day 5 of 7) sends it on time; the daily cron
 * `/api/cron/trial-reminder` catches anything the webhook missed. Both claim
 * `stripeTrialReminderSentFor = <subscription id>` atomically before sending,
 * so a trial gets one mail, and a failed send gives the claim back for the
 * next run.
 *
 * Nobody is reminded of a charge that will not happen: a trial that was
 * already cancelled, or has ended, gets no mail. Without SMTP the mail is only
 * logged and not marked as sent.
 */

export type TrialReminderResult = 'sent' | 'logged' | 'not_due' | 'already_sent' | 'failed';

export interface TrialReminderDeps {
  now?: Date;
  /** Sends the mail; defaults to the account mailer. Passing one counts as "SMTP configured". */
  send?: (mail: AccountMail) => Promise<void>;
  siteUrl?: string;
}

const longDate = new Intl.DateTimeFormat(t('bq.header.numberLocale'), { day: 'numeric', month: 'long', timeZone: isNlSite() ? 'Europe/Amsterdam' : undefined });

function siteUrlFrom(env: Record<string, string | undefined> = process.env): string {
  return (env.NEXTAUTH_URL || getSiteConfig().baseUrl).replace(/\/$/, '');
}

export function buildTrialReminderMail(input: {
  to: string;
  name?: string | null;
  trialEnd: Date;
  amountCents?: number | null;
  currency?: string | null;
  siteUrl: string;
}): AccountMail {
  const firstName = (input.name || '').trim().split(/\s+/)[0];
  const endLabel = longDate.format(input.trialEnd);
  const price = formatStripeAmount(input.amountCents ?? null, input.currency ?? null);
  const charge = price ? t('mail.trial.chargePrice', { price }) : t('mail.trial.chargeYear');
  const manageUrl = `${input.siteUrl}/premium`;

  const lines = [
    firstName ? t('mail.hello', { name: firstName }) : t('mail.helloPlain'),
    '',
    t('mail.trial.body', { end: endLabel, charge }),
    '',
    t('mail.trial.keep'),
    t('mail.trial.cancel', { end: endLabel, url: manageUrl }),
    '',
    t('mail.regards'),
    getSiteConfig().brand,
  ];

  return {
    to: input.to,
    subject: t('mail.trial.subject', { end: endLabel }),
    text: lines.join('\n'),
  };
}

interface ReminderUser {
  _id: Types.ObjectId;
  email?: string;
  name?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  stripeSubscriptionPlan?: string;
  stripeCancelAtPeriodEnd?: boolean;
  stripeTrialEnd?: Date | null;
  stripeTrialReminderAt?: Date | null;
  stripeTrialReminderSentFor?: string | null;
  stripePriceAmount?: number | null;
  stripePriceCurrency?: string | null;
}

const REMINDER_FIELDS =
  '_id email name stripeSubscriptionId stripeSubscriptionStatus stripeSubscriptionPlan stripeCancelAtPeriodEnd ' +
  'stripeTrialEnd stripeTrialReminderAt stripeTrialReminderSentFor stripePriceAmount stripePriceCurrency';

/** Send the reminder for this account's trial, if it is due and not sent yet. */
export async function sendTrialReminder(userId: string, deps: TrialReminderDeps = {}): Promise<TrialReminderResult> {
  await connectDB();
  const now = deps.now ?? new Date();
  const user = await User.findById(userId).select(REMINDER_FIELDS).lean<ReminderUser>();
  if (!user) return 'not_due';

  const subscriptionId = user.stripeSubscriptionId;
  const trialEnd = user.stripeTrialEnd ? new Date(user.stripeTrialEnd) : null;
  const due =
    Boolean(subscriptionId && user.email) &&
    user.stripeSubscriptionStatus === 'trialing' &&
    user.stripeSubscriptionPlan === 'yearly' &&
    !user.stripeCancelAtPeriodEnd &&
    Boolean(trialEnd && trialEnd.getTime() > now.getTime()) &&
    Boolean(user.stripeTrialReminderAt && new Date(user.stripeTrialReminderAt).getTime() <= now.getTime());

  if (!due) return 'not_due';
  if (user.stripeTrialReminderSentFor === subscriptionId) return 'already_sent';

  const mail = buildTrialReminderMail({
    to: user.email!,
    name: user.name,
    trialEnd: trialEnd!,
    amountCents: user.stripePriceAmount,
    currency: user.stripePriceCurrency,
    siteUrl: deps.siteUrl ?? siteUrlFrom(),
  });

  if (!deps.send && !isMailConfigured()) {
    console.warn(`[trial-reminder] SMTP is not configured; reminder not sent to user ${String(user._id)}.\n${mail.subject}\n\n${mail.text}`);
    return 'logged';
  }

  // Claim first: of two runs at the same moment, only one sends.
  const claimed = await User.updateOne(
    { _id: user._id, stripeSubscriptionId: subscriptionId, stripeTrialReminderSentFor: { $ne: subscriptionId } },
    { $set: { stripeTrialReminderSentFor: subscriptionId, stripeTrialReminderSentAt: now } },
  );
  if (claimed.modifiedCount !== 1) return 'already_sent';

  try {
    await (deps.send ?? sendAccountMail)(mail);
    return 'sent';
  } catch (error) {
    console.error('[trial-reminder] Sending failed; will retry on the next run', error);
    await User.updateOne(
      { _id: user._id, stripeTrialReminderSentFor: subscriptionId },
      { $set: { stripeTrialReminderSentFor: null, stripeTrialReminderSentAt: null } },
    );
    return 'failed';
  }
}

export interface TrialReminderRun {
  candidates: number;
  sent: number;
  logged: number;
  failed: number;
  skipped: number;
}

/** The daily sweep: every trialing yearly subscriber whose reminder is due and unsent. */
export async function runTrialReminders(deps: TrialReminderDeps = {}): Promise<TrialReminderRun> {
  await connectDB();
  const now = deps.now ?? new Date();

  const candidates = await User.find({
    stripeSubscriptionStatus: 'trialing',
    stripeSubscriptionPlan: 'yearly',
    stripeTrialReminderAt: { $lte: now },
    stripeTrialEnd: { $gt: now },
    stripeCancelAtPeriodEnd: { $ne: true },
    $expr: { $ne: ['$stripeTrialReminderSentFor', '$stripeSubscriptionId'] },
  })
    .select('_id')
    .limit(500)
    .lean();

  const run: TrialReminderRun = { candidates: candidates.length, sent: 0, logged: 0, failed: 0, skipped: 0 };

  for (const candidate of candidates) {
    const result = await sendTrialReminder(String(candidate._id), { ...deps, now });
    if (result === 'sent') run.sent += 1;
    else if (result === 'logged') run.logged += 1;
    else if (result === 'failed') run.failed += 1;
    else run.skipped += 1;
  }

  return run;
}
