import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  stripeSessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stripeSessionId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'eur' },
  status: { type: String, required: true, default: 'pending' },
}, { timestamps: true });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
