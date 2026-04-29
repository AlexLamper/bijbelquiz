import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  image?: string;
  googleId?: string;
  isPremium: boolean;
  hasLifetimePremium: boolean;
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
  freeMultiplayerRoomCreated: boolean;
  role: 'user' | 'admin';
  nameUpdatedAt?: Date;
  onboarding?: {
    bibleReadingFrequency?: string;
    knowledgeLevel?: string;
    interests?: string[];
  };
  settings?: {
    themePreference?: 'light' | 'dark' | 'system';
    emailNotifications?: boolean;
    soundEffects?: boolean;
    showBibleReferences?: boolean;
    dailyReminder?: boolean;
    preferredDifficulty?: 'all' | 'easy' | 'medium' | 'hard';
    questionFontSize?: 'normal' | 'large';
  };
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String },
  image: { type: String },
  googleId: { type: String },
  isPremium: { type: Boolean, default: false },
  hasLifetimePremium: { type: Boolean, default: false },
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
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  nameUpdatedAt: { type: Date },
  onboarding: {
    bibleReadingFrequency: { type: String },
    knowledgeLevel: { type: String },
    interests: { type: [String], default: [] },
  },
  settings: {
    themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    emailNotifications: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true },
    showBibleReferences: { type: Boolean, default: true },
    dailyReminder: { type: Boolean, default: false },
    preferredDifficulty: { type: String, enum: ['all', 'easy', 'medium', 'hard'], default: 'all' },
    questionFontSize: { type: String, enum: ['normal', 'large'], default: 'normal' },
  },
}, { timestamps: true });

UserSchema.index({ xp: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
