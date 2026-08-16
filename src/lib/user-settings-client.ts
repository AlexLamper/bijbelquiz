'use client';

import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';

import {
  DEFAULT_USER_SETTINGS,
  normalizeUserSettings,
  type UserSettings,
} from '@/lib/user-settings';

/**
 * Read/write access to the signed-in user's preferences.
 *
 * Values come off the NextAuth session rather than a fetch, so a component can
 * render the right thing on its first paint instead of flashing a default and
 * correcting itself. `saveSettings` refreshes the session afterwards, which is
 * what makes a change on the settings page show up in the quiz player without
 * a reload.
 *
 * Signed-out visitors get `DEFAULT_USER_SETTINGS` and saves are skipped —
 * callers can use the same code path for both.
 */
export function useUserSettings() {
  const { data: session, status, update } = useSession();

  const isAuthenticated = Boolean(session?.user?.id);

  const settings = useMemo(
    () => normalizeUserSettings(session?.user?.settings),
    [session?.user?.settings]
  );

  const saveSettings = useCallback(
    async (patch: Partial<UserSettings>): Promise<UserSettings> => {
      if (!isAuthenticated) {
        return { ...DEFAULT_USER_SETTINGS, ...patch };
      }

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: patch }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Kon instellingen niet opslaan');
      }

      // Re-mints the JWT from the user document, so every other consumer of
      // `useUserSettings` picks the change up on the next render.
      await update();

      return normalizeUserSettings(payload?.settings);
    },
    [isAuthenticated, update]
  );

  return {
    settings,
    isAuthenticated,
    isLoading: status === 'loading',
    saveSettings,
  };
}
