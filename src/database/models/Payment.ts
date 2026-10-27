import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  provider: 'stripe' | 'revenuecat';
  // Every plan in `STRIPE_PLANS` (src/lib/stripe-plans.ts) lands here.
  planType?: 'lifetime' | 'monthly' | 'yearly' | 'group';
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  externalTransactionId?: string;
  amount: number;
  currency: string;
  /** `refunded`: the store or Stripe paid it back. */
  // `disputed`: Stripe chargeback open. `trial`: the EUR 0 first invoice of a
  // free trial (kept for the history, never revenue).
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed' | 'trial';
  // Stripe only (see src/lib/stripe-billing.ts). `environment` is shared with
  // RevenueCat: a Stripe test-mode payment is `sandbox`.
  /** One row per invoice for subscriptions: the first charge and every renewal. */
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCustomerId?: string;
  /** Stripe's `billing_reason`: subscription_create, subscription_cycle, subscription_update, ... */
  billingReason?: string;
  /** Cents paid back (refunds and lost disputes); the row keeps its original `amount`. */
  amountRefunded?: number;
  /** Stripe dispute status while / after a chargeback: needs_response, won, lost, ... */
  disputeStatus?: string;
  periodStart?: Date;
  periodEnd?: Date;
  paidAt?: Date;
  /**
   * `sandbox` for App Store / Play sandbox and Stripe test-mode payments;
   * revenue figures must leave those out. Rows from before this field have
   * none and are production.
   */
  environment?: 'sandbox' | 'production';
  // RevenueCat (app store) purchases only.
  /** `app_store` or `play_store`. */
  store?: string;
  productId?: string;
  originalTransactionId?: string;
  /** RevenueCat event that created the row: INITIAL_PURCHASE, RENEWAL, NON_RENEWING_PURCHASE. */
  eventType?: string;
  /** The same price in USD cents, as RevenueCat reports it. */
  priceUsdCents?: number;
  isTrialConversion?: boolean;
  purchasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['stripe', 'revenuecat'], default: 'stripe' },
  planType: { type: String, enum: ['lifetime', 'monthly', 'yearly', 'group'] },
  stripeSessionId: { type: String },
  stripeSubscriptionId: { type: String },
  externalTransactionId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'eur' },
  status: { type: String, required: true, default: 'pending' },
  store: { type: String },
  environment: { type: String, enum: ['sandbox', 'production'] },
  productId: { type: String },
  originalTransactionId: { type: String },
  eventType: { type: String },
  priceUsdCents: { type: Number },
  isTrialConversion: { type: Boolean },
  purchasedAt: { type: Date },
  refundedAt: { type: Date },
  stripeInvoiceId: { type: String },
  stripePaymentIntentId: { type: String, index: true },
  stripeChargeId: { type: String },
  stripeCustomerId: { type: String },
  billingReason: { type: String },
  amountRefunded: { type: Number },
  disputeStatus: { type: String },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  paidAt: { type: Date },
}, { timestamps: true });

// One row per Stripe invoice (renewals included). Partial for the same reason
// as the two indexes below.
PaymentSchema.index(
  { provider: 1, stripeInvoiceId: 1 },
  { unique: true, partialFilterExpression: { stripeInvoiceId: { $type: 'string' } }, name: 'provider_stripeInvoiceId_unique' },
);

// Partial, not sparse: `provider` is on every row, so a sparse compound index
// still indexes rows without the id as `null` and refuses the second one.
// New names, so they are created next to the old sparse indexes; drop
// `provider_1_stripeSessionId_1` and `provider_1_externalTransactionId_1` once
// in production (see docs/setup/betalingen-app.md).
PaymentSchema.index(
  { provider: 1, stripeSessionId: 1 },
  { unique: true, partialFilterExpression: { stripeSessionId: { $type: 'string' } }, name: 'provider_stripeSessionId_unique' },
);
PaymentSchema.index(
  { provider: 1, externalTransactionId: 1 },
  { unique: true, partialFilterExpression: { externalTransactionId: { $type: 'string' } }, name: 'provider_externalTransactionId_unique' },
);

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
