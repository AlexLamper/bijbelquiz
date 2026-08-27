import mongoose, { Document, Model, Schema } from 'mongoose';
import { ICategory } from './Category';
import { parseBibleReference } from '@/lib/bible-reference';
import { toBookCode } from '@/lib/book-canon';

export interface IAnswer {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  text: string;
  answers: IAnswer[];
  explanation?: string;
  bibleReference?: string;
  /**
   * `bibleReference` parsed and canonicalised, maintained by the pre-save hook
   * below.
   *
   * Without these, finding "questions about Johannes 20:1-18" means regex-ing
   * every question of every quiz on each request - O(all quizzes), no index.
   * With them it is an indexed $elemMatch. `refBook` is a canonical code rather
   * than the Dutch string because bijbelstudie spells several books differently
   * (Mattheus/Matteus, Lukas/Lucas), so a raw string join silently matches
   * nothing for those books.
   */
  refBook?: string | null;
  refChapter?: number | null;
  refVerse?: number | null;
  refVerseEnd?: number | null;
}

export interface IQuiz extends Document {
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  categoryId: mongoose.Types.ObjectId | ICategory; // Reference to Category
  rewardXp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isPremium: boolean;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy?: mongoose.Types.ObjectId;
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
  explanation: { type: String },
  bibleReference: { type: String },
  // Derived from bibleReference; see IQuestion above and the hook below.
  refBook: { type: String, default: null },
  refChapter: { type: Number, default: null },
  refVerse: { type: Number, default: null },
  refVerseEnd: { type: Number, default: null },
});

const QuizSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  imageUrl: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  rewardXp: { type: Number, default: 50, min: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  isPremium: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'approved' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  questions: { type: [QuestionSchema], default: [] },
}, { timestamps: true });

/**
 * Keeps the derived reference fields in step with `bibleReference`.
 *
 * An unparseable reference deliberately leaves `refBook` null: it then matches
 * nothing, which is the correct way to fail. Guessing would put questions about
 * one passage into a lesson about another.
 */
QuizSchema.pre('save', async function nextRefs() {
  const doc = this as unknown as IQuiz;
  for (const question of doc.questions ?? []) {
    const parsed = question.bibleReference ? parseBibleReference(question.bibleReference) : null;
    question.refBook = parsed ? toBookCode(parsed.book) : null;
    question.refChapter = parsed?.chapter ?? null;
    question.refVerse = parsed?.verse ?? null;
    question.refVerseEnd = parsed?.endVerse ?? null;
  }
});

// Supports the passage lookup in /api/service/study-questions.
QuizSchema.index({ 'questions.refBook': 1, 'questions.refChapter': 1 });

const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

export default Quiz;
