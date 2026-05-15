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

  const performanceLabel =
    percentage >= 85 ? 'Sterk resultaat' : percentage >= 65 ? 'Goede basis' : 'Duidelijke groeikans';

  const recommendationText =
    percentage >= 85
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
