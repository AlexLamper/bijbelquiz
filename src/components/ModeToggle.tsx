"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useUserSettings } from "@/lib/user-settings-client"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const { isAuthenticated, saveSettings } = useUserSettings()

  const toggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark"

    // Flip immediately; the write is what makes the choice outlive this
    // browser. Without it `ThemeSync` would restore the stored preference on
    // the next navigation and the toggle would look broken.
    setTheme(next)

    if (isAuthenticated) {
      saveSettings({ themePreference: next }).catch(() => {
        // A failed write is not worth interrupting the page for: the theme is
        // already applied locally and will simply not follow to another device.
      })
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
