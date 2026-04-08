import { Sun, Moon } from 'lucide-react'
import { useDarkMode } from '../lib/useDarkMode'

/**
 * Round icon button that flips between light and dark mode. Sits next to the
 * MCP & CLI button in the header on both mobile and desktop layouts.
 */
export function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
