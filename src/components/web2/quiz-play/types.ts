/** What the quiz player gets from the server. */

export interface PlayAnswer {
  _id: string;
  text: string;
  isCorrect: boolean;
}

export interface PlayQuestion {
  _id: string;
  text: string;
  answers: PlayAnswer[];
  /** Whether the question has an explanation at all (also for free players). */
  hasExplanation: boolean;
  /** The explanation text: only filled in for Premium players. */
  explanation: string;
  bibleReference: string;
  refBook: string | null;
  refChapter: number | null;
}

export interface PlayQuiz {
  _id: string;
  slug: string;
  title: string;
  rewardXp: number;
  difficulty?: string;
  categoryTitle: string | null;
  /** Legacy flag, only reported on analytics. */
  isPremium: boolean;
  questions: PlayQuestion[];
}

export interface PlayViewer {
  isLoggedIn: boolean;
  /** Premium or admin: explanations are shown. */
  hasPremium: boolean;
}
