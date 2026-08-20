'use client';

import { useState } from 'react';

import QuizPlayer from '@/components/QuizPlayer';
import QuizPassageReader from '@/components/quiz/QuizPassageReader';
import QuizStartScreen, {
  type QuizLastResult,
  type QuizStartQuiz,
} from '@/components/quiz/QuizStartScreen';
import type { QuizPassage } from '@/lib/quiz-passage';

type Phase = 'overview' | 'passage' | 'playing';

interface QuizExperienceProps {
  /** The full quiz document, as the player needs it. */
  quiz: Parameters<typeof QuizPlayer>[0]['quiz'];
  overview: QuizStartQuiz;
  passage: QuizPassage | null;
  lastResult: QuizLastResult | null;
  /** Whether this reader has already been through the setup panel once. */
  setupSeen: boolean;
}

/**
 * The three states of opening a quiz: look at it, optionally read the chapter,
 * then answer.
 *
 * Held client-side rather than as three routes. A reader who chose "read the
 * chapter first" would otherwise navigate twice before the first question, and
 * the back button would land them in the middle of a quiz they had already
 * started.
 */
export default function QuizExperience({ quiz, overview, passage, lastResult, setupSeen }: QuizExperienceProps) {
  const [phase, setPhase] = useState<Phase>('overview');
  const [timerSeconds, setTimerSeconds] = useState(0);

  if (phase === 'passage' && passage) {
    return (
      <QuizPassageReader
        passage={passage}
        onBack={() => setPhase('overview')}
        onContinue={() => setPhase('playing')}
      />
    );
  }

  if (phase === 'playing') {
    return <QuizPlayer quiz={quiz} timerOverride={timerSeconds} />;
  }

  return (
    <QuizStartScreen
      quiz={overview}
      passage={passage}
      lastResult={lastResult}
      setupSeen={setupSeen}
      onStart={(choice) => {
        setTimerSeconds(choice.timerSeconds);
        setPhase(choice.readPassageFirst && passage ? 'passage' : 'playing');
      }}
    />
  );
}
