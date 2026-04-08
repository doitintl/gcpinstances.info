import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'gcp-instances:theme'
type Theme = 'light' | 'dark'

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore (private mode, disabled storage, etc.)
  }
  // Fall back to the user's OS preference on first visit.
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

/**
 * Persisted light/dark theme toggle.
 *
 * Reads the saved preference from localStorage on mount, falling back to the
 * OS preference. Writes the active class onto `<html>` so Tailwind's
 * `dark:` variants apply, and persists every change.
 */
export function useDarkMode(): {
  theme: Theme
  isDark: boolean
  toggle: () => void
  setTheme: (t: Theme) => void
} {
  const [theme, setThemeState] = useState<Theme>(readInitial)

  useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  const toggle = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, isDark: theme === 'dark', toggle, setTheme: setThemeState }
}
