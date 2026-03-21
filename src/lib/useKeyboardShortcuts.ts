import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useKeyboardShortcuts(searchInputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      // Escape: blur active element
      if (e.key === 'Escape') {
        ;(document.activeElement as HTMLElement | null)?.blur()
        return
      }

      // / or Cmd+K / Ctrl+K: focus search input
      if (
        (e.key === '/' && !isInputFocused) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'k')
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchInputRef])
}
