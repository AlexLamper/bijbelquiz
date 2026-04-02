import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  image?: string;
  googleId?: string;
  isPremium: boolean;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  bestStreak: number;
  lastPlayedAt?: Date;
  badges: string[];
  quizzesPlayed: number;
  averageScore: number;
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String },
  image: { type: String },
  googleId: { type: String },
  isPremium: { type: Boolean, default: false },
  xp: { type: Number, default: 0, index: true },
  level: { type: Number, default: 1 },
  levelTitle: { type: String, default: 'Zoeker' },
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastPlayedAt: { type: Date },
  badges: { type: [String], default: [] },
  quizzesPlayed: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

UserSchema.index({ xp: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
