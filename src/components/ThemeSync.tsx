'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

import { useUserSettings } from '@/lib/user-settings-client';

/**
 * Applies the account's saved theme.
 *
 * `next-themes` persists to localStorage, which only ever describes the browser
 * in front of you. Mounting this once at the root makes the stored preference
 * the thing that wins on load, so signing in on a new device carries the choice
 * across instead of falling back to whatever that browser last used.
 *
 * The effect keys on the preference value, so it re-applies only when the
 * account's setting actually changes — a local toggle is not fought until the
 * session reports a different value.
 */
export default function ThemeSync() {
  const { setTheme } = useTheme();
  const { settings, isAuthenticated } = useUserSettings();
  const preference = settings.themePreference;

  useEffect(() => {
    if (!isAuthenticated) return;
    setTheme(preference);
  }, [isAuthenticated, preference, setTheme]);

  return null;
}
