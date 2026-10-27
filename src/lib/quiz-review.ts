export interface QuizReviewQuestion {
  questionId: string;
  questionText: string;
  selectedAnswerText: string | null;
  correctAnswerText: string;
  isCorrect: boolean;
  explanation?: string;
  bibleReference?: string;
}

type QuizQuestionInput = {
  _id: string;
  text: string;
  answers: Array<{ _id: string; text: string; isCorrect: boolean }>;
  explanation?: string;
  bibleReference?: string;
};

export function buildReviewQuestionsFromSelections(
  questions: QuizQuestionInput[],
  selectedAnswers: Record<number, number>
): QuizReviewQuestion[] {
  return questions.map((question, index) => {
    const answerIndex = selectedAnswers[index];
    const selectedAnswer =
      typeof answerIndex === 'number' ? question.answers[answerIndex] : undefined;
    const correctAnswer = question.answers.find((answer) => answer.isCorrect);
    const isCorrect = Boolean(selectedAnswer?.isCorrect);

    return {
      questionId: String(question._id),
      questionText: question.text || '',
      selectedAnswerText: selectedAnswer?.text ?? null,
      correctAnswerText: correctAnswer?.text || 'Onbekend',
      isCorrect,
      explanation: question.explanation || '',
      bibleReference: question.bibleReference || '',
    };
  });
}

export function getQuizReviewInsights(
  questions: QuizReviewQuestion[],
  score: number,
  totalQuestions: number,
  xpEarned: number
) {
  const answeredCount = questions.filter((question) => question.selectedAnswerText !== null).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const incorrectQuestions = questions.filter((question) => !question.isCorrect);
  const incorrectCount = incorrectQuestions.length;
  const consistentTopicRefs = Array.from(
    new Set(
      incorrectQuestions
        .map((question) => question.bibleReference?.trim())
        .filter((reference): reference is string => Boolean(reference))
    )
  ).slice(0, 6);

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Counted rather than read off the percentage. 13/15 rounds to 87% and lands
  // in the same tier as 15/15, but the advice for the first ("herhaal je fout
  // beantwoorde vragen") has nothing to point at in the second - there are no
  // wrong answers left to herhalen, and telling somebody to work towards being
  // foutloos when they already are reads as the app ignoring their result.
  const isPerfect = totalQuestions > 0 && incorrectCount === 0 && unansweredCount === 0;

  const performanceLabel = isPerfect
    ? 'Foutloos'
    : percentage >= 85
      ? 'Sterk resultaat'
      : percentage >= 65
        ? 'Goede basis'
        : 'Duidelijke groeikans';

  const recommendationText = isPerfect
    ? 'Elke vraag goed beantwoord. Een moeilijkere quiz of een volgend bijbelboek is nu de logische stap.'
    : percentage >= 85
      ? 'Je beheerst deze quiz goed. Herhaal vooral je fout beantwoorde vragen om volledig foutloos te worden.'
      : percentage >= 65
        ? 'Je zit op de goede weg. Focus op de fout beantwoorde vragen en vergelijk de uitleg met de bijbelverwijzingen.'
        : 'Neem tijd voor de uitleg per vraag en lees de genoemde bijbelgedeelten erbij. Daarna levert een herkansing meestal snel progressie op.';

  const xpEfficiency =
    totalQuestions > 0 ? Math.round((xpEarned / totalQuestions) * 10) / 10 : 0;

  return {
    percentage,
    answeredCount,
    unansweredCount,
    incorrectCount,
    consistentTopicRefs,
    performanceLabel,
    recommendationText,
    xpEfficiency,
  };
}

/** One answer as `submitQuizAttempt` stores it on the attempt. */
export interface StoredAttemptAnswer {
  questionId?: unknown;
  selectedAnswerId?: unknown;
  selectedAnswerIndex?: unknown;
  isCorrect?: unknown;
}

type StoredQuestionInput = {
  _id: unknown;
  text?: string;
  answers?: Array<{ _id?: unknown; text?: string; isCorrect?: boolean }>;
  explanation?: string;
  bibleReference?: string;
};

/**
 * The review of a saved attempt: each question of the quiz with what was
 * picked and what was right. Answers are matched by question id first and by
 * position for attempts written before ids were stored; the pick by answer id
 * first and by index after that.
 *
 * Reviewing answers is Premium: only call this for a Premium player, so the
 * questions, picks and explanations never reach a free client.
 */
export function buildReviewQuestionsFromAttempt(
  questions: StoredQuestionInput[],
  storedAnswers: StoredAttemptAnswer[] | null | undefined,
): QuizReviewQuestion[] {
  const answers = Array.isArray(storedAnswers) ? storedAnswers : [];
  const byQuestionId = new Map<string, StoredAttemptAnswer>();
  for (const answer of answers) {
    if (answer && answer.questionId != null) byQuestionId.set(String(answer.questionId), answer);
  }

  return questions.map((question, index) => {
    const questionId = String(question._id);
    const state = byQuestionId.get(questionId) ?? answers[index];
    const choices = Array.isArray(question.answers) ? question.answers : [];

    let selected: (typeof choices)[number] | null = null;
    if (state?.selectedAnswerId) {
      selected = choices.find((choice) => String(choice._id) === String(state.selectedAnswerId)) || null;
    }
    const selectedIndex =
      typeof state?.selectedAnswerIndex === 'number' && Number.isFinite(state.selectedAnswerIndex)
        ? Math.floor(state.selectedAnswerIndex)
        : null;
    if (!selected && selectedIndex !== null && choices[selectedIndex]) {
      selected = choices[selectedIndex];
    }

    const correct = choices.find((choice) => Boolean(choice.isCorrect));

    return {
      questionId,
      questionText: question.text || '',
      selectedAnswerText: selected?.text ?? null,
      correctAnswerText: correct?.text || 'Onbekend',
      isCorrect: Boolean(state?.isCorrect),
      explanation: question.explanation || '',
      bibleReference: question.bibleReference || '',
    };
  });
}
