'use client';

import { QuizTile, type DashboardQuiz } from '@/components/editorial/QuizTile';

export type QuizItem = DashboardQuiz;

interface QuizCardProps {
  quiz: QuizItem;
  isPremiumUser?: boolean;
  /** Retained for call-site compatibility; the editorial plate is one shape. */
  layout?: 'card' | 'stack';
  darkPalette?: 'default' | 'neutral';
}

/**
 * The platform-wide quiz card. A thin adapter over the editorial plate so every
 * surface - dashboard, quiz index, landing - presents a quiz identically.
 */
export function QuizCard({ quiz, isPremiumUser }: QuizCardProps) {
  return <QuizTile quiz={quiz} isPremiumUser={isPremiumUser} />;
}

export default QuizCard;
