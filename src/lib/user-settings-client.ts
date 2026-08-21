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
 * That refresh is not free: `update()` flips `useSession().status` back to
 * `loading` for every consumer in the tree and costs two extra round trips
 * (a CSRF token, then a session POST that re-reads the user document). For a
 * preference the UI has already applied locally - the theme - pass
 * `refreshSession: false` and let the write settle in the background.
 *
 * Signed-out visitors get `DEFAULT_USER_SETTINGS` and saves are skipped -
 * callers can use the same code path for both.
 */
export interface SaveSettingsOptions {
  /**
   * Re-mint the session after the write. Defaults to `true`. Turn it off for a
   * setting whose effect is already visible without the session catching up.
   */
  refreshSession?: boolean;
}

export function useUserSettings() {
  const { data: session, status, update } = useSession();

  const isAuthenticated = Boolean(session?.user?.id);

  const settings = useMemo(
    () => normalizeUserSettings(session?.user?.settings),
    [session?.user?.settings]
  );

  const saveSettings = useCallback(
    async (
      patch: Partial<UserSettings>,
      { refreshSession = true }: SaveSettingsOptions = {}
    ): Promise<UserSettings> => {
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
      // `useUserSettings` picks the change up on the next render. Skipped when
      // the caller has already applied the change itself: the session then
      // carries a stale value until the next natural refetch, which is cheaper
      // than putting the whole tree through a loading state.
      if (refreshSession) {
        await update();
      }

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
