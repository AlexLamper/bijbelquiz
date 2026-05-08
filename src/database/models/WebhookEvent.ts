import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWebhookEvent extends Document {
  provider: 'stripe' | 'revenuecat';
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema: Schema = new Schema(
  {
    provider: { type: String, enum: ['stripe', 'revenuecat'], required: true },
    eventId: { type: String, required: true },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent || mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
