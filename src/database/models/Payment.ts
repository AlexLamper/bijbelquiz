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
  /**
   * `refunded`: the store or Stripe paid it back. `sandbox`: an App Store /
   * Play test purchase - recorded, never counted as revenue.
   */
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'sandbox';
  // RevenueCat (app store) purchases only.
  /** `app_store` or `play_store`. */
  store?: string;
  /** `SANDBOX` or `PRODUCTION`, as RevenueCat reports it. */
  environment?: 'SANDBOX' | 'PRODUCTION';
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
  environment: { type: String, enum: ['SANDBOX', 'PRODUCTION'] },
  productId: { type: String },
  originalTransactionId: { type: String },
  eventType: { type: String },
  priceUsdCents: { type: Number },
  isTrialConversion: { type: Boolean },
  purchasedAt: { type: Date },
  refundedAt: { type: Date },
}, { timestamps: true });

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
