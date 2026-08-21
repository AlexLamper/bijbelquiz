"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useUserSettings } from "@/lib/user-settings-client"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const { isAuthenticated, saveSettings } = useUserSettings()

  const toggle = React.useCallback(() => {
    // `resolvedTheme` is undefined until next-themes has mounted; the class on
    // <html> is already correct at that point, so read it rather than guessing
    // and sending the first click the wrong way.
    const isDark =
      resolvedTheme === "dark" ||
      (resolvedTheme === undefined &&
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark"))

    const next = isDark ? "light" : "dark"

    // The flip is local and immediate. The write below only decides what this
    // account starts with next time, so it must not be awaited, and must not
    // refresh the session: `update()` would push every `useSession()` consumer
    // through a loading state and blank the account controls in the navbar for
    // the length of two round trips.
    setTheme(next)

    if (isAuthenticated) {
      saveSettings({ themePreference: next }, { refreshSession: false }).catch(() => {
        // A failed write is not worth interrupting the page for: the theme is
        // already applied locally and will simply not follow to another device.
      })
    }
  }, [isAuthenticated, resolvedTheme, saveSettings, setTheme])

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
