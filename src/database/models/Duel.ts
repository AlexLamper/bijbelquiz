import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * A 1-tegen-1 duel, played in turns.
 *
 * Three rounds of three questions, each round on its own topic. Both players
 * get exactly the same questions, so the questions are copied into the duel
 * when it is made rather than looked up again later: an edited or deleted quiz
 * must not change a duel that is half played, and grading has to be against
 * what the player actually saw.
 *
 * The turn order lives in `lib/duels/rules.ts`. The denormalised `turn*`
 * fields here only exist so the list ("jouw beurt") and the random matcher can
 * be answered with an index instead of by loading every duel.
 */

export type DuelMode = 'friend' | 'random' | 'invite';
export type DuelStatus = 'open' | 'active' | 'finished';
export type DuelEndReason =
  | 'completed'
  | 'forfeit'
  | 'declined'
  | 'cancelled'
  | 'timeout'
  | 'expired';
export type DuelSide = 'challenger' | 'opponent';
export type DuelTopicKind = 'book' | 'category' | 'mixed';

export interface IDuelAnswerChoice {
  answerId: string;
  text: string;
  isCorrect: boolean;
}

export interface IDuelQuestion {
  quizId: mongoose.Types.ObjectId | null;
  questionId: string;
  text: string;
  answers: IDuelAnswerChoice[];
  explanation?: string | null;
  bibleReference?: string | null;
  /** XP for answering this one correctly, fixed when the duel was made. */
  xp: number;
}

export interface IDuelRound {
  topic: string;
  topicKind: DuelTopicKind;
  topicKey: string | null;
  questions: IDuelQuestion[];
}

export interface IDuelAnswer {
  round: number;
  question: number;
  answerId: string | null;
  correct: boolean;
  xp: number;
  answeredAt: Date;
}

export interface IDuel extends Document {
  mode: DuelMode;
  status: DuelStatus;
  endReason: DuelEndReason | null;
  challengerId: mongoose.Types.ObjectId;
  /** Null while a random or invite duel waits for somebody to join. */
  opponentId: mongoose.Types.ObjectId | null;
  /** Both ids once known; the listing query is a membership test on this. */
  participants: mongoose.Types.ObjectId[];
  /** Absent (never null) on non-invite duels, see the sparse index below. */
  inviteToken?: string;
  /**
   * Uniqueness guard while the duel runs: `pair:<id>:<id>` for a friend duel,
   * `random:<id>` for a random search still waiting. Removed when the duel
   * finishes (or the search is matched), so the index only covers live ones.
   */
  runningKey?: string;
  rounds: IDuelRound[];
  challengerAnswers: IDuelAnswer[];
  opponentAnswers: IDuelAnswer[];
  challengerScore: number;
  opponentScore: number;
  challengerXp: number;
  opponentXp: number;
  /** Position in the turn order (0-5), 6 when every round is played. */
  turnSlot: number;
  turnSide: DuelSide | null;
  /** Whose move it is. Null when finished or when waiting for a match. */
  turnUserId: mongoose.Types.ObjectId | null;
  winnerId: mongoose.Types.ObjectId | null;
  forfeitedBy: mongoose.Types.ObjectId | null;
  lastMoveAt: Date;
  /** After this moment without a move the duel is settled on the next read. */
  turnDeadline: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerChoiceSchema = new Schema<IDuelAnswerChoice>(
  {
    answerId: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
);

const QuestionSchema = new Schema<IDuelQuestion>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', default: null },
    questionId: { type: String, required: true },
    text: { type: String, required: true },
    answers: { type: [AnswerChoiceSchema], default: [] },
    explanation: { type: String, default: null },
    bibleReference: { type: String, default: null },
    xp: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const RoundSchema = new Schema<IDuelRound>(
  {
    topic: { type: String, required: true },
    topicKind: { type: String, enum: ['book', 'category', 'mixed'], default: 'mixed' },
    topicKey: { type: String, default: null },
    questions: { type: [QuestionSchema], default: [] },
  },
  { _id: false },
);

const DuelAnswerSchema = new Schema<IDuelAnswer>(
  {
    round: { type: Number, required: true, min: 0 },
    question: { type: Number, required: true, min: 0 },
    answerId: { type: String, default: null },
    correct: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    answeredAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const DuelSchema = new Schema<IDuel>(
  {
    mode: { type: String, enum: ['friend', 'random', 'invite'], required: true },
    status: { type: String, enum: ['open', 'active', 'finished'], required: true, default: 'open' },
    endReason: {
      type: String,
      enum: ['completed', 'forfeit', 'declined', 'cancelled', 'timeout', 'expired', null],
      default: null,
    },
    challengerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opponentId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    participants: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    // Sparse: only invite duels carry one. Never write null here - a sparse
    // index still indexes an explicit null, and the second friend duel would
    // then collide with the first.
    inviteToken: { type: String, unique: true, sparse: true },
    // Same rule: absent, never null. Two taps on "uitdagen" (or two players
    // challenging each other at once) would otherwise both pass the "already
    // running?" check and make two duels; the second insert fails here instead.
    runningKey: { type: String, unique: true, sparse: true },
    rounds: { type: [RoundSchema], default: [] },
    challengerAnswers: { type: [DuelAnswerSchema], default: [] },
    opponentAnswers: { type: [DuelAnswerSchema], default: [] },
    challengerScore: { type: Number, default: 0 },
    opponentScore: { type: Number, default: 0 },
    challengerXp: { type: Number, default: 0 },
    opponentXp: { type: Number, default: 0 },
    turnSlot: { type: Number, default: 0 },
    turnSide: { type: String, enum: ['challenger', 'opponent', null], default: 'challenger' },
    turnUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    forfeitedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lastMoveAt: { type: Date, default: () => new Date() },
    turnDeadline: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
  },
  // Two phones can answer, forfeit and join the same duel at once. Optimistic
  // concurrency makes the losing write fail loudly instead of silently
  // overwriting the other player's answer.
  { timestamps: true, optimisticConcurrency: true },
);

// The duels list: everything I am in, by state, newest first.
DuelSchema.index({ participants: 1, status: 1, updatedAt: -1 });
// "Jouw beurt" counts.
DuelSchema.index({ turnUserId: 1, status: 1 });
// The random matcher: the oldest open random duel somebody else started.
DuelSchema.index({ mode: 1, status: 1, opponentId: 1, turnSlot: -1, createdAt: 1 });

const Duel: Model<IDuel> =
  mongoose.models.Duel || mongoose.model<IDuel>('Duel', DuelSchema);

export default Duel;
