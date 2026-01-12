import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAnswer {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  text: string;
  answers: IAnswer[];
}

export interface IQuiz extends Document {
  title: string;
  slug: string;
  description?: string;
  categoryId: mongoose.Types.ObjectId; // Reference to Category
  difficulty: 'easy' | 'medium' | 'hard';
  isPremium: boolean;
  questions: IQuestion[];
  createdAt: Date;
}

const AnswerSchema = new Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  answers: [AnswerSchema],
});

const QuizSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  isPremium: { type: Boolean, default: false },
  questions: { type: [QuestionSchema], default: [] },
}, { timestamps: true });

const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

export default Quiz;
