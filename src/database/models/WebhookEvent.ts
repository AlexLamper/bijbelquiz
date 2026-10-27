import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWebhookEvent extends Document {
  provider: 'stripe' | 'revenuecat';
  eventId: string;
  /**
   * Stripe events are claimed as `processing` and marked `processed` once
   * handled; a failed handler removes its claim so Stripe's retry runs again.
   * Rows without it (RevenueCat, older Stripe rows) count as processed.
   */
  status?: 'processing' | 'processed';
  /** Event type, e.g. `invoice.paid`, for debugging. */
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema: Schema = new Schema(
  {
    provider: { type: String, enum: ['stripe', 'revenuecat'], required: true },
    eventId: { type: String, required: true },
    status: { type: String, enum: ['processing', 'processed'] },
    type: { type: String },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent || mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
