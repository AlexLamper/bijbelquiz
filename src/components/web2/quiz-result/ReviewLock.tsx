'use client';

import { useEffect, useRef } from 'react';

import { track } from '@/lib/analytics/client';

import { AnswerListLocked } from './ResultView';

/**
 * The locked answer list for a free player, reporting the paywall it shows
 * (`review_locked`, as the app does) once per view.
 */
export default function ReviewLock({ score, total, quizSlug, guest }: { score: number; total: number; quizSlug: string; guest: boolean }) {
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    track('paywall_shown', { trigger: 'review_locked', surface: 'quiz_result', guest });
  }, [guest]);

  const premiumHref = `/premium?reden=review_locked&terug=${encodeURIComponent(`/quiz/${quizSlug}/beoordeling`)}`;
  return <AnswerListLocked score={score} total={total} premiumHref={premiumHref} />;
}
