'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { readPendingAttempts, removePendingAttempt } from '@/lib/pending-attempts';

/**
 * Writes quiz attempts played without an account to the account that has
 * just appeared.
 *
 * Mounted once, inside the session provider, so it does not matter where the
 * sign-in happened: the result screen's own buttons, the navbar, a Google
 * round trip that lands on the dashboard. The moment the session resolves as
 * signed in, whatever was parked by `addPendingAttempt` is submitted through
 * the ordinary route and the page is refreshed so the dashboard and the quiz
 * index show the new attempt.
 *
 * Renders nothing.
 */
export default function PendingAttemptSync() {
  const { status, update } = useSession();
  const router = useRouter();
  // One claim at a time. Strict mode mounts twice, and `status` can flip
  // through `loading` and back during a session refresh; neither may submit
  // the same attempt again.
  const claiming = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || claiming.current) return;

    const pending = readPendingAttempts();
    if (pending.length === 0) return;

    claiming.current = true;

    (async () => {
      let saved = 0;
      let xpEarned = 0;
      let firstTitle = '';

      for (const attempt of pending) {
        try {
          const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: attempt.quizId,
              score: attempt.score,
              totalQuestions: attempt.totalQuestions,
              answers: attempt.answers,
              claimed: true,
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as { xpEarned?: unknown };
            saved += 1;
            if (typeof data.xpEarned === 'number') xpEarned += data.xpEarned;
            if (!firstTitle) firstTitle = attempt.quizTitle;
            removePendingAttempt(attempt.completedAt);
          } else if (response.status !== 401 && response.status < 500) {
            // The quiz is gone or the payload is malformed: retrying will not
            // help, so the attempt is dropped rather than resubmitted forever.
            removePendingAttempt(attempt.completedAt);
          }
          // A 401 or a 5xx leaves the attempt parked for the next visit.
        } catch {
          // Offline: same, it waits.
        }
      }

      if (saved > 0) {
        toast.success(
          saved === 1
            ? `Je score voor "${firstTitle}" is opgeslagen (+${xpEarned} XP)`
            : `${saved} quizzen opgeslagen (+${xpEarned} XP)`
        );

        // The XP in the navbar lives on the session token; the dashboard and
        // the quiz index are server-rendered from the attempts just written.
        try {
          await update();
        } catch {
          // A failed refresh only leaves the old XP figure in the navbar until
          // the next one.
        }
        router.refresh();
      }

      claiming.current = false;
    })();
  }, [status, update, router]);

  return null;
}
