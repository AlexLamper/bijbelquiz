'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

import { useUserSettings } from '@/lib/user-settings-client';
import { Tabs } from './Tabs';

type ThemeChoice = 'light' | 'dark' | 'system';

const ITEMS: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Licht' },
  { value: 'dark', label: 'Donker' },
  { value: 'system', label: 'Systeem' },
];

/**
 * "Licht / Donker / Systeem" as the compact segmented control from the
 * settings page. Applies through next-themes immediately and, for a signed-in
 * account, saves the choice so it follows them to the next device.
 */
export function ThemeToggle({ className, 'aria-labelledby': labelledBy }: { className?: string; 'aria-labelledby'?: string }) {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, saveSettings } = useUserSettings();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const value = (mounted ? theme : 'light') as ThemeChoice;

  return (
    <Tabs<ThemeChoice>
      items={ITEMS}
      value={ITEMS.some((item) => item.value === value) ? value : 'system'}
      variant="compact"
      aria-label={labelledBy ? undefined : 'Thema'}
      aria-labelledby={labelledBy}
      className={className}
      onChange={(next) => {
        setTheme(next);
        if (isAuthenticated) {
          void saveSettings({ themePreference: next }, { refreshSession: false });
        }
      }}
    />
  );
}
