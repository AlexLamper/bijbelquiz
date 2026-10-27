/**
 * Revenue as the admin pages report it, read from the `Payment` collection.
 *
 * The rules, in one place so the web dashboard, the app's admin screen and the
 * tests agree:
 *
 * - Only money that was actually received counts: status `completed` (or the
 *   paid/refunded variants a provider may write). `pending` and `failed` rows
 *   are attempts, not revenue.
 * - Test money is left out: RevenueCat sandbox purchases and Stripe test-mode
 *   payments (`environment: 'sandbox' | 'test'`, `livemode: false`, or an
 *   `isTest`/`sandbox` flag), and payments by the internal developer and
 *   app-reviewer accounts (`internal-accounts.ts`).
 * - Refunds are subtracted: a `refundedAmount` (cents) on the row, or the
 *   whole amount when the row is marked `refunded` without one. "Netto" is
 *   gross minus refunds.
 * - Amounts are summed per currency, never converted. Euro is the headline;
 *   anything else is shown next to it.
 * - Rows with amount 0 are subscription state, not a payment, and are not
 *   counted as one. Older Stripe subscription events wrote such rows (and
 *   renewals were stored as EUR 0), so the history under-reports renewals;
 *   newer rows carry the real amount.
 *
 * Amounts are what the buyer paid, VAT included, before Stripe fees or the
 * App Store / Play Store commission.
 */

export type RevenueSource = 'stripe' | 'store';

export interface PaymentLike {
  _id?: unknown;
  user?: unknown;
  provider?: string | null;
  planType?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  createdAt?: Date | string | null;
  stripeSessionId?: string | null;
  environment?: string | null;
  livemode?: boolean | null;
  isTest?: boolean | null;
  sandbox?: boolean | null;
  isSandbox?: boolean | null;
  refundedAmount?: number | null;
  amountRefunded?: number | null;
  refundedCents?: number | null;
  refundedAt?: Date | string | null;
  kind?: string | null;
  type?: string | null;
  billingReason?: string | null;
  /** RevenueCat event type the row came from (`INITIAL_PURCHASE`, `RENEWAL`, ...). */
  eventType?: string | null;
  isRenewal?: boolean | null;
  /** When the buyer paid, if the provider says so; `createdAt` otherwise. */
  purchasedAt?: Date | string | null;
  paidAt?: Date | string | null;
  [key: string]: unknown;
}

export type PaymentVerdict = 'paid' | 'unpaid' | 'test' | 'internal' | 'zero';

export interface ClassifiedPayment {
  verdict: PaymentVerdict;
  source: RevenueSource;
  currency: string;
  grossCents: number;
  refundedCents: number;
  netCents: number;
  isRenewal: boolean;
  isTest: boolean;
  isInternal: boolean;
  /** Fully refunded. */
  isRefunded: boolean;
  /** The row's status as the admin should read it (`refunded` when fully refunded). */
  displayStatus: string;
}

const PAID_STATUSES = new Set(['completed', 'succeeded', 'paid', 'refunded', 'partially_refunded']);
const TEST_ENVIRONMENTS = new Set(['sandbox', 'test', 'testing', 'development', 'staging']);
const RENEWAL_KINDS = new Set(['renewal', 'renew', 'subscription_cycle', 'recurring']);

function cents(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  }
  return null;
}

/** The user id on a payment row, whether `user` is an id or a populated document. */
export function paymentUserId(payment: PaymentLike): string | null {
  const user = payment.user as { _id?: unknown } | string | null | undefined;
  if (!user) return null;
  if (typeof user === 'object' && '_id' in user && user._id) return String(user._id);
  return String(user);
}

export function isTestPayment(payment: PaymentLike): boolean {
  const environment = String(payment.environment ?? '').trim().toLowerCase();
  return (
    TEST_ENVIRONMENTS.has(environment) ||
    String(payment.status ?? '').trim().toLowerCase() === 'sandbox' ||
    payment.livemode === false ||
    payment.isTest === true ||
    payment.sandbox === true ||
    payment.isSandbox === true
  );
}

export function isRenewalPayment(payment: PaymentLike): boolean {
  if (payment.isRenewal === true) return true;
  return [payment.kind, payment.type, payment.billingReason, payment.eventType].some(
    (value) => typeof value === 'string' && RENEWAL_KINDS.has(value.trim().toLowerCase()),
  );
}

/**
 * Was money received for this row?
 *
 * One legacy exception: until the payment rework, a Stripe subscription
 * ending ran an upsert keyed on `stripeSubscriptionId + planType`, which also
 * matched the checkout's own row and overwrote its status with `failed`. A
 * checkout row (it has a `stripeSessionId`, and only `checkout.session.completed`
 * or the success page create those, always as `completed`) that now reads
 * `failed` was therefore paid, and is counted as such.
 */
function wasPaid(payment: PaymentLike): boolean {
  const status = String(payment.status ?? '').trim().toLowerCase();
  if (PAID_STATUSES.has(status)) return true;
  return (
    status === 'failed' &&
    (payment.provider ?? 'stripe') === 'stripe' &&
    typeof payment.stripeSessionId === 'string' &&
    payment.stripeSessionId.length > 0 &&
    cents(payment.amount) > 0
  );
}

export function classifyPayment(payment: PaymentLike, internalIds: ReadonlySet<string>): ClassifiedPayment {
  const grossCents = Math.max(0, cents(payment.amount));
  const status = String(payment.status ?? '').trim().toLowerCase();
  const explicitRefund = firstNumber(payment.refundedAmount, payment.amountRefunded, payment.refundedCents);
  const refundedCents = Math.min(
    grossCents,
    Math.max(0, explicitRefund ?? (status === 'refunded' ? grossCents : 0)),
  );
  const isRefunded = grossCents > 0 && refundedCents >= grossCents;
  const userId = paymentUserId(payment);
  const isInternal = Boolean(userId && internalIds.has(userId));
  const isTest = isTestPayment(payment);
  const paid = wasPaid(payment);

  let verdict: PaymentVerdict;
  if (isTest) verdict = 'test';
  else if (!paid) verdict = 'unpaid';
  else if (isInternal) verdict = 'internal';
  else if (grossCents === 0) verdict = 'zero';
  else verdict = 'paid';

  const counted = verdict === 'paid';

  return {
    verdict,
    source: payment.provider === 'revenuecat' ? 'store' : 'stripe',
    currency: String(payment.currency || 'eur').trim().toLowerCase() || 'eur',
    grossCents: counted ? grossCents : 0,
    refundedCents: counted ? refundedCents : 0,
    netCents: counted ? grossCents - refundedCents : 0,
    isRenewal: isRenewalPayment(payment),
    isTest,
    isInternal,
    isRefunded,
    displayStatus: isRefunded ? 'refunded' : paid && status === 'failed' ? 'completed' : status || 'pending',
  };
}

export interface MoneyTotal {
  grossCents: number;
  refundedCents: number;
  netCents: number;
  /** Counted payments (paid, real money, amount above 0). */
  payments: number;
  renewals: number;
  refunds: number;
}

/** Totals per lower-case currency code. */
export type MoneyByCurrency = Record<string, MoneyTotal>;

export interface RevenueSummary {
  allTime: MoneyByCurrency;
  window: MoneyByCurrency;
  bySource: Record<RevenueSource, MoneyByCurrency>;
  windowBySource: Record<RevenueSource, MoneyByCurrency>;
  /** Rows left out, and why. */
  excluded: { test: number; internal: number; unpaid: number; zeroAmount: number };
}

function emptyTotal(): MoneyTotal {
  return { grossCents: 0, refundedCents: 0, netCents: 0, payments: 0, renewals: 0, refunds: 0 };
}

function add(map: MoneyByCurrency, row: ClassifiedPayment) {
  const total = (map[row.currency] ??= emptyTotal());
  total.grossCents += row.grossCents;
  total.refundedCents += row.refundedCents;
  total.netCents += row.netCents;
  total.payments += 1;
  if (row.isRenewal) total.renewals += 1;
  if (row.refundedCents > 0) total.refunds += 1;
}

/**
 * @param windowStart  Payments created at or after this moment make up `window`.
 */
export function summarizeRevenue(
  payments: PaymentLike[],
  { internalIds, windowStart }: { internalIds: ReadonlySet<string>; windowStart: Date },
): RevenueSummary {
  const summary: RevenueSummary = {
    allTime: {},
    window: {},
    bySource: { stripe: {}, store: {} },
    windowBySource: { stripe: {}, store: {} },
    excluded: { test: 0, internal: 0, unpaid: 0, zeroAmount: 0 },
  };

  for (const payment of payments) {
    const row = classifyPayment(payment, internalIds);
    if (row.verdict === 'test') summary.excluded.test += 1;
    else if (row.verdict === 'internal') summary.excluded.internal += 1;
    else if (row.verdict === 'unpaid') summary.excluded.unpaid += 1;
    else if (row.verdict === 'zero') summary.excluded.zeroAmount += 1;
    if (row.verdict !== 'paid') continue;

    add(summary.allTime, row);
    add(summary.bySource[row.source], row);

    const paidAt = paymentDate(payment);
    if (paidAt && paidAt >= windowStart) {
      add(summary.window, row);
      add(summary.windowBySource[row.source], row);
    }
  }

  return summary;
}

/** When the money came in: the provider's purchase time, else the row's creation. */
export function paymentDate(payment: PaymentLike): Date | null {
  for (const value of [payment.purchasedAt, payment.paidAt, payment.createdAt]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

/** The euro figure, or zeros. */
export function euro(map: MoneyByCurrency): MoneyTotal {
  return map.eur ?? emptyTotal();
}

/** Every currency except euro that has a non-zero net amount, biggest first. */
export function otherCurrencies(map: MoneyByCurrency): Array<{ currency: string; netCents: number }> {
  return Object.entries(map)
    .filter(([currency, total]) => currency !== 'eur' && total.payments > 0)
    .map(([currency, total]) => ({ currency, netCents: total.netCents }))
    .sort((a, b) => b.netCents - a.netCents);
}

/** `€ 12,34` / `US$ 4,99` from an integer number of cents (minor units). */
export function formatMoneyCents(amountCents: number, currency = 'eur'): string {
  const code = (currency || 'eur').toUpperCase();
  try {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: code }).format((amountCents || 0) / 100);
  } catch {
    return `${code} ${((amountCents || 0) / 100).toFixed(2).replace('.', ',')}`;
  }
}
