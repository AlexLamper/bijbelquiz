'use strict';
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/bq/Toast';

import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';
import PendingAttemptSync from '@/components/PendingAttemptSync';
import ThemeSync from '@/components/ThemeSync';

// Intl languages other than English run under a path prefix (/de); NextAuth's
// client must call /de/api/auth, not the English site's /api/auth. NL and
// English keep the default.
const intlLocale = process.env.NEXT_PUBLIC_SITE === 'intl' ? process.env.NEXT_PUBLIC_SITE_LOCALE : undefined;
const authBasePath = intlLocale && intlLocale !== 'en' ? `/${intlLocale}/api/auth` : undefined;

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider {...(authBasePath ? { basePath: authBasePath } : {})}>
        {/* Inside the session provider: it needs the account's saved theme. */}
        <ThemeSync />
        {/* Also inside it, and inside the theme provider: every visit is
            recorded with whether it was signed in and which theme it ran in. */}
        <AnalyticsTracker />
        {/* Quizzes played before signing in are written to the account the
            moment one appears, wherever the sign-in happened. */}
        <PendingAttemptSync />
        {children}
        <Toaster />
    </SessionProvider>
  );
}
