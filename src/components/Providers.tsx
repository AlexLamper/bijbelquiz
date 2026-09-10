'use strict';
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';
import PendingAttemptSync from '@/components/PendingAttemptSync';
import ThemeSync from '@/components/ThemeSync';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
        {/* Inside the session provider: it needs the account's saved theme. */}
        <ThemeSync />
        {/* Also inside it, and inside the theme provider: every visit is
            recorded with whether it was signed in and which theme it ran in. */}
        <AnalyticsTracker />
        {/* Quizzes played before signing in are written to the account the
            moment one appears, wherever the sign-in happened. */}
        <PendingAttemptSync />
        {children}
        <Toaster position="top-center" richColors />
    </SessionProvider>
  );
}
