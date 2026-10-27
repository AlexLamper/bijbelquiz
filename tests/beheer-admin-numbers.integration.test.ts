import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { AnalyticsEvent, Category, Payment, Quiz, User, UserProgress, WebhookEvent, connectDB } from '@/database';
import { getAdminOverview } from '@/lib/admin/overview';
import { classifyPayment, formatMoneyCents, paidPeriodCoversNow, summarizeRevenue } from '@/lib/admin/revenue';
import {
  amsterdamWindowDays,
  amsterdamWindowStart,
  startOfAmsterdamDay,
  startOfAmsterdamToday,
} from '@/lib/admin/time';
import { getDayThirtyRetention, getFunnelReport, NO_TRIGGER } from '@/lib/analytics/funnel';
import { getDailySeries, getOverview, getQuizReport, getUserReport } from '@/lib/analytics/insights';
import { resetInternalAccountCache } from '@/lib/analytics/internal-accounts';
import { getPaymentsHealth, stripeKeyMode } from '@/lib/payments-health';
import { getPremiumStats } from '@/lib/premium-stats';
import { formatAdminDate } from '@/components/web2/beheer/ui';

/**
 * The numbers on the admin pages (/beheer, /beheer/statistieken,
 * /beheer/betalingen, /beheer/funnel) against a seeded mongod.
 *
 * The seed is built so the known traps are all present at once: Premium from
 * five sources (and a lifetime buyer who also has the Stripe flag), test and
 * reviewer accounts (one in mixed case, plus a look-alike that is NOT one),
 * legacy EUR 0 subscription rows, a checkout whose status the old webhook
 * overwrote with `failed`, real renewals, partial and full refunds, sandbox
 * and Stripe test-mode money, a disputed and a failed payment, a payment of a
 * deleted account, a second currency, replays of the same quiz, a quiz from
 * before `status` existed, stale streaks, and events right around Amsterdam
 * midnight.
 */

let mongod: MongoMemoryServer;

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);
const todayStart = startOfAmsterdamToday(now);

const ids = {
  alice: new mongoose.Types.ObjectId(),
  bob: new mongoose.Types.ObjectId(),
  carol: new mongoose.Types.ObjectId(),
  dave: new mongoose.Types.ObjectId(),
  erin: new mongoose.Types.ObjectId(),
  frank: new mongoose.Types.ObjectId(),
  reviewer: new mongoose.Types.ObjectId(),
  dev: new mongoose.Types.ObjectId(),
  gina: new mongoose.Types.ObjectId(),
  lookalike: new mongoose.Types.ObjectId(),
  hank: new mongoose.Types.ObjectId(),
  ivy: new mongoose.Types.ObjectId(),
  gwen: new mongoose.Types.ObjectId(),
};

const quizIds = {
  q1: new mongoose.Types.ObjectId(),
  legacy: new mongoose.Types.ObjectId(),
  draft: new mongoose.Types.ObjectId(),
};

function user(id: mongoose.Types.ObjectId, email: string, extra: Record<string, unknown> = {}) {
  return {
    _id: id,
    email,
    name: email.split('@')[0],
    isPremium: false,
    premiumStripe: false,
    premiumStore: false,
    hasLifetimePremium: false,
    groupPremiumUntil: null,
    quizzesPlayed: 0,
    streak: 0,
    bestStreak: 0,
    level: 1,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    ...extra,
  };
}

function payment(extra: Record<string, unknown>) {
  return { provider: 'stripe', currency: 'eur', createdAt: now, updatedAt: now, ...extra };
}

function event(name: string, createdAt: Date, extra: Record<string, unknown> = {}) {
  return { name, platform: 'web', props: {}, userId: null, createdAt, ...extra };
}

before(async () => {
  for (const key of [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REVENUECAT_WEBHOOK_AUTHORIZATION',
    'REVENUECAT_SECRET_KEY',
    'REVENUECAT_REST_API_KEY',
  ]) {
    delete process.env[key];
  }

  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('bijbelquiz-beheer-test');
  await connectDB();
  await seed();
  resetInternalAccountCache();
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

async function seed() {
  // Raw inserts, so createdAt is exactly what the test says it is.
  await User.collection.insertMany([
    user(ids.alice, 'alice@test.local', {
      isPremium: true,
      premiumStripe: true,
      stripeSubscriptionStatus: 'active',
      quizzesPlayed: 3,
      streak: 3,
      lastPlayedAt: now,
    }),
    // Lifetime via Stripe: both flags on, counted once, as lifetime.
    user(ids.bob, 'bob@test.local', {
      isPremium: true,
      premiumStripe: true,
      hasLifetimePremium: true,
      quizzesPlayed: 1,
      streak: 5,
      lastPlayedAt: daysAgo(10),
    }),
    // Played one minute before Amsterdam midnight: within 24 hours, not "vandaag".
    user(ids.carol, 'carol@test.local', {
      isPremium: true,
      premiumStore: true,
      quizzesPlayed: 1,
      lastPlayedAt: new Date(todayStart.getTime() - 60 * 1000),
    }),
    // Group member: premium without the isPremium flag. Old enough for retention.
    user(ids.dave, 'dave@test.local', {
      groupPremiumUntil: daysAgo(-30),
      createdAt: daysAgo(60),
      lastPlayedAt: daysAgo(2),
      quizzesPlayed: 4,
    }),
    // Group licence that has lapsed.
    user(ids.erin, 'erin@test.local', { groupPremiumUntil: daysAgo(3), createdAt: daysAgo(60) }),
    // Premium set by hand.
    user(ids.frank, 'frank@test.local', { isPremium: true }),
    user(ids.reviewer, 'applereview@bijbelquiz.nl', { isPremium: true, premiumStore: true, createdAt: daysAgo(60), lastPlayedAt: now }),
    user(ids.dev, 'Aplamper06@Gmail.com', { isPremium: true }),
    user(ids.gina, 'gina@test.local', {
      stripeSubscriptionStatus: 'past_due',
      createdAt: daysAgo(60),
      lastPlayedAt: daysAgo(3),
      quizzesPlayed: 2,
    }),
    // Looks like a test address to an unescaped regex ("." matches "x"); is a customer.
    user(ids.lookalike, 'aplamper06@gmailxcom', { isPremium: true, premiumStripe: true }),
    user(ids.hank, 'hank@test.local'),
    user(ids.ivy, 'ivy@test.local'),
    user(ids.gwen, 'gwen@test.local'),
  ]);

  const category = await Category.create({ title: 'Evangeliën', slug: 'evangelien' });
  const question = (n: number) => ({
    text: `Vraag ${n}?`,
    answers: [
      { text: 'Ja', isCorrect: true },
      { text: 'Nee', isCorrect: false },
    ],
  });
  await Quiz.collection.insertMany([
    { _id: quizIds.q1, title: 'Quiz een', slug: 'quiz-een', status: 'approved', categoryId: category._id, difficulty: 'easy', questions: [question(1), question(2)], createdAt: daysAgo(5) },
    // From before `status` existed: live in the catalogue.
    { _id: quizIds.legacy, title: 'Oude quiz', slug: 'oude-quiz', categoryId: category._id, difficulty: 'medium', questions: [question(1)], createdAt: daysAgo(400) },
    { _id: quizIds.draft, title: 'Concept quiz', slug: 'concept-quiz', status: 'draft', categoryId: category._id, questions: [], createdAt: daysAgo(1) },
  ]);

  const attempt = (userId: mongoose.Types.ObjectId, quizId: mongoose.Types.ObjectId, score: number, total: number, completedAt: Date) => ({
    userId,
    quizId,
    score,
    totalQuestions: total,
    correctAnswers: score,
    wrongAnswers: total - score,
    answers: [],
    xpEarned: 0,
    completedAt,
  });
  await UserProgress.collection.insertMany([
    attempt(ids.alice, quizIds.q1, 8, 10, now),
    attempt(ids.alice, quizIds.q1, 8, 10, now), // a replay: an attempt, not a new player
    attempt(ids.bob, quizIds.q1, 5, 10, daysAgo(1)),
    attempt(ids.carol, quizIds.legacy, 10, 10, daysAgo(3)),
    attempt(ids.alice, quizIds.legacy, 10, 10, daysAgo(3)),
    attempt(ids.gina, quizIds.q1, 1, 10, daysAgo(40)), // outside 30 days
  ]);

  await Payment.collection.insertMany([
    // Legacy checkout row whose status the old subscription upsert overwrote: was paid.
    payment({ user: ids.alice, planType: 'monthly', amount: 599, status: 'failed', stripeSessionId: 'cs_legacy_alice', stripeSubscriptionId: 'sub_alice', createdAt: daysAgo(60) }),
    // Legacy EUR 0 subscription-state row: not a payment.
    payment({ user: ids.alice, planType: 'monthly', amount: 0, status: 'completed', stripeSubscriptionId: 'sub_alice', createdAt: daysAgo(59) }),
    // A real renewal (new write side).
    payment({ user: ids.alice, planType: 'monthly', amount: 599, status: 'completed', environment: 'production', billingReason: 'subscription_cycle', stripeInvoiceId: 'in_alice_2', stripeSubscriptionId: 'sub_alice', paidAt: daysAgo(2), periodEnd: daysAgo(-28), createdAt: daysAgo(2) }),
    // Lifetime with a partial refund.
    payment({ user: ids.bob, planType: 'lifetime', amount: 7499, amountRefunded: 2000, status: 'completed', environment: 'production', stripeSessionId: 'cs_bob', stripePaymentIntentId: 'pi_bob', paidAt: daysAgo(10), createdAt: daysAgo(10) }),
    // Store purchases: euro, a USD renewal, a sandbox one.
    payment({ user: ids.carol, provider: 'revenuecat', planType: 'monthly', amount: 499, status: 'completed', environment: 'production', eventType: 'INITIAL_PURCHASE', externalTransactionId: 'tx_carol_1', purchasedAt: daysAgo(5), createdAt: daysAgo(5) }),
    payment({ user: ids.carol, provider: 'revenuecat', planType: 'monthly', amount: 599, currency: 'usd', status: 'completed', environment: 'production', eventType: 'RENEWAL', externalTransactionId: 'tx_carol_2', purchasedAt: daysAgo(1), createdAt: daysAgo(1) }),
    payment({ user: ids.carol, provider: 'revenuecat', planType: 'yearly', amount: 999, status: 'sandbox', environment: 'sandbox', eventType: 'INITIAL_PURCHASE', externalTransactionId: 'tx_carol_sb', createdAt: daysAgo(1) }),
    // Stripe test mode.
    payment({ user: ids.frank, planType: 'monthly', amount: 599, status: 'completed', environment: 'sandbox', stripeInvoiceId: 'in_frank', createdAt: daysAgo(4) }),
    // The app reviewer's purchase.
    payment({ user: ids.reviewer, provider: 'revenuecat', planType: 'monthly', amount: 499, status: 'completed', environment: 'production', externalTransactionId: 'tx_reviewer', createdAt: daysAgo(6) }),
    // Fully refunded, legacy (no environment), older than 30 days.
    payment({ user: ids.erin, planType: 'monthly', amount: 599, status: 'refunded', stripeSessionId: 'cs_erin', createdAt: daysAgo(40) }),
    // A failed renewal and a disputed charge: no money.
    payment({ user: ids.gina, planType: 'monthly', amount: 599, status: 'failed', environment: 'production', billingReason: 'subscription_cycle', stripeInvoiceId: 'in_gina', createdAt: daysAgo(3) }),
    payment({ user: ids.lookalike, planType: 'monthly', amount: 599, status: 'disputed', environment: 'production', stripeInvoiceId: 'in_look', createdAt: daysAgo(8) }),
    // The account was deleted; the payment stays for the books.
    payment({ planType: 'monthly', amount: 399, status: 'completed', environment: 'production', stripeInvoiceId: 'in_deleted', createdAt: daysAgo(20) }),
    // Paid 50 days ago, monthly, no longer premium: the period ended, no gap.
    payment({ user: ids.hank, planType: 'monthly', amount: 599, status: 'completed', stripeSessionId: 'cs_hank', createdAt: daysAgo(50) }),
    // Paid yearly 100 days ago and not premium: a real gap.
    payment({ user: ids.ivy, planType: 'yearly', amount: 3999, status: 'completed', stripeSessionId: 'cs_ivy', createdAt: daysAgo(100) }),
    // A group licence buyer is not personally premium: no gap.
    payment({ user: ids.gwen, planType: 'group', amount: 9900, status: 'completed', environment: 'production', stripeInvoiceId: 'in_gwen', createdAt: daysAgo(45) }),
  ]);

  const windowStart7 = amsterdamWindowStart(7, now);
  await AnalyticsEvent.collection.insertMany([
    // Sessions: just after Amsterdam midnight today, and just before the 7-day window.
    event('session_start', new Date(todayStart.getTime() + 60 * 1000), { anonymousId: 'anon-1', props: { signedIn: false } }),
    event('session_start', new Date(windowStart7.getTime() - 60 * 1000), { anonymousId: 'anon-2', props: { signedIn: false } }),
    event('page_view', now, { userId: ids.alice, props: { path: '/' } }),
    // A server event without any id is nobody.
    event('checkout_started', now, { props: { plan: 'monthly' } }),
    event('checkout_started', daysAgo(1), { userId: ids.hank, props: { plan: 'monthly' } }),
    // Paywalls: two real triggers, one without trigger, two by the dev account, one too old.
    event('paywall_shown', daysAgo(1), { userId: ids.alice, props: { trigger: 'gratis-limiet' } }),
    event('paywall_shown', daysAgo(2), { userId: ids.gina, props: { trigger: 'gratis-limiet' } }),
    event('paywall_shown', daysAgo(2), { anonymousId: 'anon-1' }),
    event('paywall_shown', daysAgo(1), { userId: ids.dev, props: { trigger: 'gratis-limiet' } }),
    event('paywall_shown', daysAgo(1), { userId: ids.dev, props: { trigger: 'direct' } }),
    event('paywall_shown', daysAgo(40), { userId: ids.alice, props: { trigger: 'gratis-limiet' } }),
    event('purchase_completed', daysAgo(1), { userId: ids.alice, props: { plan: 'monthly', provider: 'stripe', trigger: 'gratis-limiet' } }),
    event('purchase_completed', daysAgo(5), { userId: ids.carol, platform: 'ios', props: { plan: 'yearly', provider: 'revenuecat', trigger: null } }),
    event('purchase_completed', daysAgo(1), { userId: ids.dev, props: { plan: 'monthly', provider: 'stripe', trigger: 'direct' } }),
    event('trial_started', daysAgo(1), { userId: ids.hank, props: { plan: 'monthly', provider: 'stripe' } }),
    // Completions: a first, a claimed web replay of a guest's first (not counted, but it is the first), and an app one.
    event('quiz_completed', now, { userId: ids.alice, props: { quizId: String(quizIds.q1), isFirst: false } }),
    event('quiz_completed', daysAgo(1), { userId: ids.bob, props: { quizId: String(quizIds.q1), isFirst: true } }),
    event('quiz_completed', daysAgo(1), { userId: ids.hank, props: { quizId: String(quizIds.q1), isFirst: true, claimed: true } }),
    event('quiz_completed', daysAgo(3), { userId: ids.carol, platform: 'ios', props: { quizId: String(quizIds.legacy), claimed: true } }),
  ]);

  await WebhookEvent.collection.insertMany([
    // A Stripe event that was claimed and never finished.
    { provider: 'stripe', eventId: 'evt_stuck', status: 'processing', type: 'invoice.paid', createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  ]);
}

describe('time windows', () => {
  test('Amsterdam midnight is DST-safe and a window ends today', () => {
    assert.equal(startOfAmsterdamDay('2026-10-25').toISOString(), '2026-10-24T22:00:00.000Z');
    assert.equal(startOfAmsterdamDay('2026-10-26').toISOString(), '2026-10-25T23:00:00.000Z');
    assert.equal(startOfAmsterdamDay('2026-03-30').toISOString(), '2026-03-29T22:00:00.000Z');
    const late = new Date('2026-10-26T23:30:00Z'); // 00:30 on the 27th in Amsterdam
    assert.equal(amsterdamWindowStart(1, late).toISOString(), '2026-10-26T23:00:00.000Z');
    assert.deepEqual(amsterdamWindowDays(3, late), ['2026-10-25', '2026-10-26', '2026-10-27']);
  });

  test('admin dates print the Amsterdam calendar day', () => {
    assert.equal(formatAdminDate('2026-10-26T23:30:00Z'), '27-10-2026');
    assert.equal(formatAdminDate(null), '');
  });

  test('restricted and placeholder Stripe keys', () => {
    assert.equal(stripeKeyMode('rk_live_abc'), 'live');
    assert.equal(stripeKeyMode('sk_test_abc'), 'test');
    assert.equal(stripeKeyMode('sk_test_dummy_key_for_build_purposes_only'), 'missing');
    assert.equal(stripeKeyMode(undefined), 'missing');
  });
});

describe('revenue rules', () => {
  const none = new Set<string>();

  test('money formats in its own currency', () => {
    assert.equal(formatMoneyCents(599, 'eur').replace(/\s/g, ' '), '€ 5,99');
    assert.match(formatMoneyCents(599, 'usd'), /5,99/);
    assert.match(formatMoneyCents(599, 'usd'), /US\$|USD/);
  });

  test('test money, refunds, disputes and legacy rows', () => {
    assert.equal(classifyPayment({ amount: 999, status: 'sandbox', environment: 'sandbox' }, none).verdict, 'test');
    assert.equal(classifyPayment({ amount: 599, status: 'completed', environment: 'SANDBOX' }, none).verdict, 'test');
    assert.equal(classifyPayment({ amount: 599, status: 'completed', livemode: false }, none).verdict, 'test');
    assert.equal(classifyPayment({ amount: 599, status: 'disputed' }, none).verdict, 'unpaid');
    assert.equal(classifyPayment({ amount: 0, status: 'trial' }, none).verdict, 'unpaid');
    assert.equal(classifyPayment({ amount: 0, status: 'completed' }, none).verdict, 'zero');
    const refunded = classifyPayment({ amount: 599, status: 'refunded' }, none);
    assert.deepEqual([refunded.verdict, refunded.netCents, refunded.displayStatus], ['paid', 0, 'refunded']);
    // The old overwrite: a checkout row on `failed` was paid ...
    assert.equal(classifyPayment({ amount: 599, status: 'failed', stripeSessionId: 'cs_1' }, none).verdict, 'paid');
    // ... but a new-era row that failed really failed.
    assert.equal(classifyPayment({ amount: 599, status: 'failed', stripeSessionId: 'cs_2', environment: 'production' }, none).verdict, 'unpaid');
  });

  test('one charge on two rows is counted once', () => {
    const summary = summarizeRevenue(
      [
        { amount: 599, status: 'completed', stripeSessionId: 'cs_x', stripePaymentIntentId: 'pi_x', createdAt: now },
        { amount: 599, status: 'completed', stripeInvoiceId: 'in_x', stripePaymentIntentId: 'pi_x', createdAt: now },
      ],
      { internalIds: none, windowStart: daysAgo(30) },
    );
    assert.equal(summary.allTime.eur.payments, 1);
    assert.equal(summary.allTime.eur.netCents, 599);
  });

  test('which paid periods still run', () => {
    assert.equal(paidPeriodCoversNow({ planType: 'lifetime', createdAt: daysAgo(900) }, now), true);
    assert.equal(paidPeriodCoversNow({ planType: 'group', createdAt: now }, now), false);
    assert.equal(paidPeriodCoversNow({ planType: 'monthly', createdAt: daysAgo(50) }, now), false);
    assert.equal(paidPeriodCoversNow({ planType: 'yearly', createdAt: daysAgo(100) }, now), true);
    assert.equal(paidPeriodCoversNow({ planType: 'monthly', createdAt: daysAgo(90), periodEnd: daysAgo(-3) }, now), true);
  });
});

describe('/beheer overview', () => {
  test('premium counts every source once and leaves internal accounts out', async () => {
    const stats = await getPremiumStats(now);
    assert.equal(stats.totalUsers, 13);
    assert.equal(stats.internalExcluded, 2); // the look-alike address is a customer
    assert.equal(stats.premiumUsers, 6); // alice, bob, carol, dave, frank, look-alike
    assert.deepEqual(stats.breakdown, { lifetime: 1, stripe: 2, store: 1, group: 1, other: 1 });
    const { stripe, store, lifetime, group, other } = stats.breakdown;
    assert.equal(stripe + store + lifetime + group + other, stats.premiumUsers);
    // Of the 11 real accounts.
    assert.equal(stats.premiumShare, 55);
    assert.equal(stats.premiumShareExact, 54.5);
  });

  test('revenue: real money only, net of refunds, per currency and source', async () => {
    const { revenue } = await getPremiumStats(now);
    // EUR received: 599 legacy + 599 renewal + 7499 lifetime + 499 store + 599 erin
    // + 399 deleted + 599 hank + 3999 ivy + 9900 group.
    assert.equal(revenue.grossCentsAllTime, 24692);
    assert.equal(revenue.refundedCentsAllTime, 2000 + 599);
    assert.equal(revenue.netCentsAllTime, 24692 - 2599);
    // Last 30 days: renewal 599, lifetime 7499 - 2000, store 499, deleted 399.
    assert.equal(revenue.grossCentsLast30d, 599 + 7499 + 499 + 399);
    assert.equal(revenue.netCentsLast30d, 599 + 5499 + 499 + 399);
    assert.equal(revenue.bySource.store.netCentsAllTime, 499);
    assert.equal(revenue.bySource.stripe.netCentsAllTime, 24692 - 2599 - 499);
    assert.equal(revenue.bySource.stripe.netCentsLast30d, 599 + 5499 + 399);
    assert.deepEqual(revenue.otherCurrenciesAllTime, [{ currency: 'usd', netCents: 599 }]);
    // 9 euro payments and the USD renewal; two renewals; two refunds.
    assert.equal(revenue.paymentsCompleted, 10);
    assert.equal(revenue.renewalsAllTime, 2);
    assert.equal(revenue.refundsAllTime, 2);
    assert.deepEqual(revenue.excluded, { test: 2, internal: 1, unpaid: 2, zeroAmount: 1 });
  });

  test('recent payments carry who, flags and the real currency', async () => {
    const { recentPayments } = await getPremiumStats(now);
    assert.equal(recentPayments.length, 15);
    const deleted = recentPayments.find((row) => row.userDeleted);
    assert.equal(deleted?.userName, 'Verwijderd account');
    const usd = recentPayments.find((row) => row.currency === 'usd');
    assert.equal(usd?.isRenewal, true);
    assert.equal(recentPayments.find((row) => row.userEmail === 'applereview@bijbelquiz.nl')?.isInternal, true);
    assert.equal(recentPayments.find((row) => row.amountCents === 999)?.isTest, true);
    assert.equal(recentPayments.find((row) => row.amountCents === 7499)?.refundedCents, 2000);
    // Paid-at time, not webhook time: the renewal sorts as two days ago.
    assert.equal(new Date(recentPayments.find((row) => row.isRenewal && row.currency === 'eur')!.createdAt).getTime(), daysAgo(2).getTime());
  });

  test('loader: counts, recent users and quizzes', async () => {
    const overview = await getAdminOverview(now);
    assert.equal(overview.totalUsers, 13);
    assert.equal(overview.totalQuizzes, 3);
    assert.equal(overview.pendingQuizzes, 0);
    const legacy = overview.recentQuizzes.find((quiz) => quiz.title === 'Oude quiz');
    assert.equal(legacy?.status, 'approved');
    const byEmail = new Map(overview.recentUsers.map((row) => [row.email, row]));
    assert.equal(overview.recentUsers.length, 10);
    assert.equal(byEmail.get('gwen@test.local')?.isPremium, false);
    const all = await User.find().select('email').lean();
    assert.equal(all.length, 13);
  });
});

describe('/beheer/statistieken', () => {
  test('overview: attempts vs players, premium share, active today, visitors', async () => {
    const overview = await getOverview(30);
    assert.equal(overview.quizPlays, 5); // replays count, the 40-day-old one does not
    assert.equal(overview.quizPlayers, 3);
    assert.equal(overview.avgScorePct, 82);
    assert.equal(overview.premiumUsers, 6);
    assert.equal(overview.premiumShare, 54.5);
    // Alice and the reviewer played today; Carol one minute before midnight.
    assert.equal(overview.activeDay, 2);
    // anon-1, anon-2, alice, bob, carol, gina, hank and the dev account; the
    // id-less server event is nobody.
    assert.equal(overview.visitors, 8);
  });

  test('a 7-day window is 7 Amsterdam days and the chart adds up to the headline', async () => {
    const [overview, daily] = await Promise.all([getOverview(7), getDailySeries(7)]);
    assert.equal(daily.length, 7);
    assert.equal(overview.sessions, 1); // the session one minute before the window is out
    assert.equal(daily.reduce((sum, point) => sum + point.sessions, 0), overview.sessions);
    assert.equal(daily.at(-1)?.sessions, 1);
  });

  test('quiz report: distinct players, legacy status, weighted averages', async () => {
    const report = await getQuizReport(30);
    assert.equal(report.totalPlays, 5);
    assert.equal(report.totalPlayers, 3); // not 2 + 2 per quiz
    const q1 = report.rows.find((row) => row.quizId === String(quizIds.q1))!;
    assert.deepEqual([q1.plays, q1.players, q1.avgScorePct], [3, 2, 70]);
    const legacy = report.rows.find((row) => row.quizId === String(quizIds.legacy))!;
    assert.equal(legacy.status, 'approved');
    assert.equal(report.neverPlayed.length, 0); // the draft is not published
    assert.equal(report.byCategory.length, 1);
    assert.equal(report.byCategory[0].avgScorePct, 82);
  });

  test('user report: only streaks that still run', async () => {
    const report = await getUserReport(30);
    assert.equal(report.streaks.withStreak, 1); // Alice; Bob's 5 is stale
    assert.equal(report.streaks.longest, 0);
    assert.equal(report.premium, 6);
  });
});

describe('/beheer/funnel', () => {
  test('paywall, purchases and triggers without the internal accounts', async () => {
    const report = await getFunnelReport(30, now);
    assert.equal(report.paywall.shown, 3);
    assert.equal(report.paywall.purchases, 2);
    assert.equal(report.paywall.conversionRate, 66.7);
    const byTrigger = new Map(report.paywall.byTrigger.map((row) => [row.trigger, row]));
    assert.deepEqual([byTrigger.get('gratis-limiet')?.shown, byTrigger.get('gratis-limiet')?.purchases], [2, 1]);
    assert.deepEqual([byTrigger.get('direct')?.shown, byTrigger.get('direct')?.purchases], [1, 0]);
    assert.equal(byTrigger.get(NO_TRIGGER)?.purchases, 1);
    assert.deepEqual([report.plans.monthly, report.plans.yearly], [1, 1]);
    assert.equal(report.trials.started, 1);
    // Claimed web completion not counted; the app's claimed one is.
    assert.equal(report.activation.quizzesCompleted, 3);
    assert.equal(report.activation.firstQuizzesCompleted, 2);
  });

  test('day-30 retention uses effective premium', async () => {
    const retention = await getDayThirtyRetention(now);
    // Free: erin (not retained), gina (retained). Premium: dave via his group.
    assert.deepEqual(retention.free, { cohort: 2, retained: 1, rate: 50 });
    assert.deepEqual(retention.premium, { cohort: 1, retained: 1, rate: 100 });
  });
});

describe('/beheer/betalingen', () => {
  test('missing keys are reported as not checked, and our own rows are shown', async () => {
    const report = await getPaymentsHealth({ deep: true, now });
    const byId = new Map(report.checks.map((check) => [check.id, check]));
    assert.equal(report.overall, 'fail');
    assert.equal(report.stripe.keyMode, 'missing');
    assert.equal(report.stripe.liveChecked, false);
    assert.equal(report.stripe.deepChecked, false);
    assert.equal(byId.get('stripe_secret_key')?.status, 'fail');
    assert.match(byId.get('stripe_secret_key')!.detail, /niet uitgevoerd/);
    assert.equal(byId.get('stripe_webhook_secret')?.status, 'fail');
    assert.equal(byId.get('rc_webhook_auth')?.status, 'fail');
    assert.equal(byId.get('rc_rest_key')?.status, 'fail');
    assert.equal(byId.has('stripe_webhook_endpoint'), false);
    assert.equal(report.recentAttemptsSource, 'payment');
    assert.equal(report.recentAttempts.length, 16);
  });

  test('failures, stuck webhooks and missing app webhooks', async () => {
    const report = await getPaymentsHealth({ deep: false, now });
    const byId = new Map(report.checks.map((check) => [check.id, check]));
    assert.deepEqual(report.failures30d, { failedPayments: 1, pastDueAccounts: 1, refunds: 1 });
    assert.equal(byId.get('payment_failures')?.status, 'warn');
    assert.equal(report.webhooksStored.stripeStuck, 1);
    assert.equal(byId.get('webhook_stuck')?.status, 'warn');
    assert.equal(byId.get('rc_webhook_freshness')?.status, 'fail');
  });

  test('paid without access: only running periods, never group buyers or refunds', async () => {
    const report = await getPaymentsHealth({ deep: false, now });
    assert.deepEqual(
      report.accessGaps.map((gap) => gap.email),
      ['ivy@test.local'],
    );
  });

  test('funnel: test accounts out, web checkouts against web outcomes', async () => {
    const { funnel30d } = await getPaymentsHealth({ deep: false, now });
    assert.deepEqual(funnel30d, {
      paywallShown: 3,
      checkoutStarted: 2,
      purchaseCompleted: 2,
      stripeCheckoutsCompleted: 2, // alice's purchase and hank's trial
      trialStarted: 1,
      trialConverted: 0,
    });
  });
});
