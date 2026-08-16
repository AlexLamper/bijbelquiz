import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * One funnel event.
 *
 * First-party rather than a third-party SDK: the questions this has to answer
 * ("how many hosts reach game five", "which paywall trigger converts") are
 * joins against users and rooms, which an external analytics product cannot
 * do. It also keeps the Flutter app free of an extra SDK and its consent
 * plumbing - the app already has an authenticated HTTP client.
 *
 * Rows expire after 400 days. Long enough for a full year-over-year read,
 * short enough that the collection cannot grow without bound.
 */

export interface IAnalyticsEvent extends Document {
  name: string;
  /** Null for events fired before sign-in. */
  userId?: mongoose.Types.ObjectId | null;
  /** Stable per install/browser, so anonymous funnels still connect. */
  anonymousId?: string;
  platform: 'web' | 'ios' | 'android';
  props: Record<string, unknown>;
  /** Client clock. Never trusted for ordering; kept for drift diagnosis. */
  occurredAt?: Date;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    name: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    anonymousId: { type: String, index: true },
    platform: { type: String, enum: ['web', 'ios', 'android'], default: 'web', index: true },
    // Mixed on purpose: the property set differs per event and is validated at
    // the edge by `sanitizeProps`, not by a schema that would need editing for
    // every new event.
    props: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Every reporting query is "this event, over this window", so the compound
// index carries both and the single-field ones above cover the slices.
AnalyticsEventSchema.index({ name: 1, createdAt: -1 });
AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 });

const AnalyticsEvent: Model<IAnalyticsEvent> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;
