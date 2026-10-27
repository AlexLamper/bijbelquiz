import mongoose from 'mongoose';

import { Payment, User, connectDB } from '@/database';
import { getInternalAccountIds } from '@/lib/analytics/internal-accounts';
import { classifyPayment, paymentDate, paymentUserId, type PaymentLike } from '@/lib/admin/revenue';

/**
 * Every payment row, paged, for the beheer payments table and
 * `/api/mobile/admin/payments`. Classification (counted or not, refunded,
 * test) follows `revenue.ts`, the same rules the totals use.
 */

export interface AdminPaymentRow {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  /** The account behind the payment was deleted (payments are kept for the books). */
  userDeleted: boolean;
  provider: string;
  store: string | null;
  planType: string;
  amountCents: number;
  currency: string;
  /** Stored status; `refunded` when fully paid back. */
  status: string;
  refundedCents: number;
  isTest: boolean;
  isInternal: boolean;
  isRenewal: boolean;
  /** Counts as revenue: real money, received, not test, not internal, above 0. */
  counted: boolean;
  createdAt: string | null;
}

export function toPaymentRow(payment: PaymentLike, internalIds: ReadonlySet<string>): AdminPaymentRow {
  const user = (payment.user && typeof payment.user === 'object' && 'email' in (payment.user as object)
    ? payment.user
    : null) as { name?: string; email?: string } | null;
  const row = classifyPayment(payment, internalIds);
  const at = paymentDate(payment);
  return {
    id: String(payment._id),
    userId: paymentUserId(payment),
    userName: user ? user.name || user.email || 'Naamloos' : 'Verwijderd account',
    userEmail: user?.email ?? '',
    userDeleted: !user,
    provider: String(payment.provider ?? 'stripe'),
    store: typeof payment.store === 'string' ? payment.store : null,
    planType: String(payment.planType ?? ''),
    amountCents: Math.max(0, Math.round(Number(payment.amount ?? 0))),
    currency: row.currency,
    status: row.displayStatus,
    refundedCents: row.verdict === 'paid' ? row.refundedCents : 0,
    isTest: row.isTest,
    isInternal: row.isInternal,
    isRenewal: row.isRenewal,
    counted: row.verdict === 'paid',
    createdAt: at ? at.toISOString() : null,
  };
}

export const PAYMENT_STATUSES = ['completed', 'failed', 'pending', 'refunded', 'disputed', 'trial'] as const;

export interface PaymentListQuery {
  q: string;
  provider: 'stripe' | 'revenuecat' | null;
  status: (typeof PAYMENT_STATUSES)[number] | null;
  page: number;
  pageSize: number;
}

export function readPaymentListQuery(input: URLSearchParams | Record<string, string | string[] | undefined>): PaymentListQuery {
  const get = (key: string) => {
    if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const provider = get('provider');
  const status = get('status');
  const page = Number.parseInt(get('page') ?? '', 10);
  const pageSize = Number.parseInt(get('pageSize') ?? '', 10);
  return {
    q: (get('q') ?? '').trim().slice(0, 100),
    provider: provider === 'stripe' || provider === 'revenuecat' ? provider : null,
    status: (PAYMENT_STATUSES as readonly string[]).includes(status ?? '') ? (status as PaymentListQuery['status']) : null,
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 100000) : 1,
    pageSize: Number.isFinite(pageSize) && pageSize >= 1 ? Math.min(pageSize, 100) : 25,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listAdminPayments(query: PaymentListQuery) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (query.provider) filter.provider = query.provider;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const pattern = new RegExp(escapeRegExp(query.q), 'i');
    const users = await User.find({ $or: [{ name: pattern }, { email: pattern }] })
      .select('_id')
      .limit(500)
      .lean<Array<{ _id: mongoose.Types.ObjectId }>>();
    filter.user = { $in: users.map((user) => user._id) };
  }

  const [internalIds, total, rows] = await Promise.all([
    getInternalAccountIds(),
    Payment.countDocuments(filter),
    Payment.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .populate('user', 'name email')
      .lean<PaymentLike[]>(),
  ]);
  const internal = new Set(internalIds.map(String));

  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    pages: Math.max(1, Math.ceil(total / query.pageSize)),
    payments: rows.map((row) => toPaymentRow(row, internal)),
  };
}
