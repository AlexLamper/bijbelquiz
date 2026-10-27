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
  status: 'pending' | 'completed' | 'failed';
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
}, { timestamps: true });

PaymentSchema.index({ provider: 1, stripeSessionId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ provider: 1, externalTransactionId: 1 }, { unique: true, sparse: true });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
