import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  image?: string;
  googleId?: string;
  appleId?: string;
  isPremium: boolean;
  premiumStripe: boolean;
  premiumStore: boolean;
  storePremiumExpiresAt?: Date | null;
  hasLifetimePremium: boolean;
  /**
   * Premium inherited from a group licence, valid until this moment.
   *
   * Denormalized from `GroupLicense` for the same reason
   * `storePremiumExpiresAt` is: `getPremiumSnapshot` is synchronous and called
   * on nearly every request, and a per-request licence lookup would be a query
   * on every page. Kept in step by the licence write paths; expiry needs no
   * job because it is a date comparison.
   */
  groupPremiumUntil?: Date | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  bestStreak: number;
  lastPlayedAt?: Date;
  badges: string[];
  quizzesPlayed: number;
  averageScore: number;
  /**
   * Legacy one-room-ever flag. Superseded by `multiplayerGamesHosted`, kept
   * only so existing accounts can be backfilled exactly once.
   */
  freeMultiplayerRoomCreated: boolean;
  /** Games this user has actually started as host; counts against the free quota. */
  multiplayerGamesHosted: number;
  /**
   * Calendar month the monthly hosting allowance was last spent in, as
   * `YYYY-MM` in Europe/Amsterdam. A key from a previous month means the
   * allowance has refilled, so no scheduled reset job exists.
   */
  multiplayerMonthlyPeriod?: string;
  /** Games hosted from the monthly allowance during `multiplayerMonthlyPeriod`. */
  multiplayerMonthlyGamesHosted?: number;
  role: 'user' | 'admin';
  nameUpdatedAt?: Date;
  /**
   * The player mascot, stored as catalogue ids rather than an image. Absent
   * until the user opens the customiser; `resolveAvatar` then derives a stable
   * one from their id so nobody is ever faceless. See `lib/avatar.ts`.
   */
  avatar?: {
    character?: string;
    color?: string;
    background?: string;
    accessory?: string;
  };
  onboarding?: {
    bibleReadingFrequency?: string;
    knowledgeLevel?: string;
    interests?: string[];
  };
  settings?: {
    themePreference?: 'light' | 'dark' | 'system';
    showBibleReferences?: boolean;
    preferredDifficulty?: 'all' | 'easy' | 'medium' | 'hard';
    questionFontSize?: 'normal' | 'large';
    questionTimerSeconds?: number;
    readPassageFirst?: boolean;
  };
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String },
  image: { type: String },
  googleId: { type: String },
  appleId: { type: String, unique: true, sparse: true, index: true },
  isPremium: { type: Boolean, default: false },
  premiumStripe: { type: Boolean, default: false },
  premiumStore: { type: Boolean, default: false },
  storePremiumExpiresAt: { type: Date, default: null },
  hasLifetimePremium: { type: Boolean, default: false },
  groupPremiumUntil: { type: Date, default: null },
  stripeCustomerId: { type: String, index: true },
  stripeSubscriptionId: { type: String, index: true },
  stripeSubscriptionStatus: { type: String },
  xp: { type: Number, default: 0, index: true },
  level: { type: Number, default: 1 },
  levelTitle: { type: String, default: 'Zoeker' },
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastPlayedAt: { type: Date },
  badges: { type: [String], default: [] },
  quizzesPlayed: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  freeMultiplayerRoomCreated: { type: Boolean, default: false },
  // Deliberately has no `default` fallback in application code: a missing
  // field means "never backfilled", which is how the legacy boolean is
  // migrated (see `lib/multiplayer/quota.ts`).
  multiplayerGamesHosted: { type: Number, default: 0 },
  // No defaults: "never spent a monthly game" and "spent one in a month that
  // has since passed" both have to read as a full allowance, which an absent
  // period key already expresses.
  multiplayerMonthlyPeriod: { type: String },
  multiplayerMonthlyGamesHosted: { type: Number },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  nameUpdatedAt: { type: Date },
  // No enum guard here on purpose: `normalizeAvatar` already rejects unknown
  // ids, and a schema enum would reject a part added in a newer release before
  // this deployment restarts.
  avatar: {
    character: { type: String },
    color: { type: String },
    background: { type: String },
    accessory: { type: String },
  },
  onboarding: {
    bibleReadingFrequency: { type: String },
    knowledgeLevel: { type: String },
    interests: { type: [String], default: [] },
  },
  // Only preferences the app actually reads live here. `emailNotifications`,
  // `soundEffects` and `dailyReminder` were removed: nothing consumed them, so
  // the settings page was offering switches that changed nothing. Existing
  // documents may still carry those keys; Mongoose ignores them on read.
  settings: {
    themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    showBibleReferences: { type: Boolean, default: true },
    preferredDifficulty: { type: String, enum: ['all', 'easy', 'medium', 'hard'], default: 'all' },
    questionFontSize: { type: String, enum: ['normal', 'large'], default: 'normal' },
    // Chosen on the quiz start screen and remembered from then on, so the
    // reader sets up how they want to study once rather than every quiz.
    questionTimerSeconds: { type: Number, enum: [0, 30, 60, 90], default: 0 },
    readPassageFirst: { type: Boolean, default: false },
  },
}, { timestamps: true });

UserSchema.index({ xp: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
