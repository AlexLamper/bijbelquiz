'use strict';
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

import ThemeSync from '@/components/ThemeSync';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
        {/* Inside the session provider: it needs the account's saved theme. */}
        <ThemeSync />
        {children}
        <Toaster position="top-center" richColors />
    </SessionProvider>
  );
}
