import mongoose, { Document, Model, Schema } from 'mongoose';
import { IQuiz } from './Quiz';

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId | IQuiz;
  score: number;
  totalQuestions: number;
  completedAt: Date;
}

const UserProgressSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
}, { timestamps: { createdAt: 'completedAt', updatedAt: false } });

// Compound index for getting all results for a user, sorted by date
UserProgressSchema.index({ userId: 1, completedAt: -1 });
// Index to check if a user has completed a specific quiz
UserProgressSchema.index({ userId: 1, quizId: 1 });

const UserProgress: Model<IUserProgress> = mongoose.models.UserProgress || mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);

export default UserProgress;
