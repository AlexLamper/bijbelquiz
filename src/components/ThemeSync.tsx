'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';

import { useUserSettings } from '@/lib/user-settings-client';

/**
 * Carries the account's saved theme onto this browser when a session appears.
 *
 * `next-themes` persists to localStorage, which only ever describes the browser
 * in front of you. Applying the stored preference once, as the session resolves,
 * makes signing in on a new device bring the choice along instead of inheriting
 * whatever that browser last used.
 *
 * Deliberately *once per signed-in account*, not on every value the session
 * reports. The session is refetched constantly - on window focus, after any
 * `update()` elsewhere in the app - and each refetch re-delivers a preference
 * that may pre-date a toggle made a moment ago in this tab. Re-applying it then
 * would yank the theme back and make the toggle look broken. A local flip owns
 * the browser from that point on; the write behind it is what carries the choice
 * to the next load, here or on another device.
 */
export default function ThemeSync() {
  const { setTheme } = useTheme();
  const { data: session } = useSession();
  const { settings, isAuthenticated } = useUserSettings();
  const preference = settings.themePreference;

  const userId = session?.user?.id;
  const appliedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      // Signing out releases the claim, so signing back in - as the same user or
      // another one - applies the stored preference again.
      appliedForUser.current = null;
      return;
    }

    if (appliedForUser.current === userId) return;

    appliedForUser.current = userId;
    setTheme(preference);
  }, [isAuthenticated, userId, preference, setTheme]);

  return null;
}
