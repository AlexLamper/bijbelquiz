import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * A licence bought once and shared with a group: a church, a school class, a
 * youth club.
 *
 * The consumer plans are priced per person, which is the wrong shape for a
 * youth leader who needs thirty people to have Premium on a Thursday evening.
 * One purchase, a join code, and everybody inside the seat count inherits
 * Premium for as long as the licence runs.
 *
 * Premium is inherited, not copied: `isPremium` on the member's user document
 * is left alone, so an expiring licence takes the access back with it and a
 * member who also pays personally keeps their own subscription either way.
 */

export interface IGroupLicense extends Document {
  /** Shown to members when they join, e.g. "Jeugdgroep De Ark". */
  name: string;
  /** The account that bought it. Always occupies a seat. */
  ownerId: mongoose.Types.ObjectId;
  /** Short, unambiguous, shared verbally in a room. */
  joinCode: string;
  seats: number;
  memberIds: mongoose.Types.ObjectId[];
  /** Null for a licence that has been granted manually and does not expire. */
  expiresAt: Date | null;
  status: 'active' | 'cancelled' | 'expired';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupLicenseSchema = new Schema<IGroupLicense>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joinCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    seats: { type: Number, required: true, min: 1, max: 500 },
    // Indexed because every premium check for a member starts as "is this user
    // in any active licence".
    memberIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [], index: true },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active', index: true },
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String, index: true },
  },
  { timestamps: true },
);

// The membership lookup on every premium resolution.
GroupLicenseSchema.index({ memberIds: 1, status: 1 });

const GroupLicense: Model<IGroupLicense> =
  mongoose.models.GroupLicense || mongoose.model<IGroupLicense>('GroupLicense', GroupLicenseSchema);

export default GroupLicense;
