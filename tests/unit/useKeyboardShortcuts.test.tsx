import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useRef } from 'react'
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts'

function TestComponent() {
  const ref = useRef<HTMLInputElement | null>(null)
  useKeyboardShortcuts(ref)
  return <input ref={ref} data-testid="search" placeholder="Search..." />
}

afterEach(cleanup)

describe('useKeyboardShortcuts', () => {
  it('pressing / focuses the search input when not already focused', () => {
    render(<TestComponent />)
    const input = screen.getByTestId('search')
    expect(document.activeElement).not.toBe(input)

    fireEvent.keyDown(document, { key: '/' })
    expect(document.activeElement).toBe(input)
  })

  it('pressing / does NOT focus search when an input is already focused', () => {
    render(
      <>
        <TestComponent />
        <input data-testid="other" />
      </>,
    )
    const otherInput = screen.getByTestId('other')
    const searchInput = screen.getByTestId('search')

    otherInput.focus()
    expect(document.activeElement).toBe(otherInput)

    // Fire keyDown on otherInput so e.target is the input element (bubbles to document)
    fireEvent.keyDown(otherInput, { key: '/' })
    // search should NOT have been focused because an input was already focused
    expect(document.activeElement).not.toBe(searchInput)
  })

  it('pressing Cmd+K focuses search input', () => {
    render(<TestComponent />)
    const input = screen.getByTestId('search')
    expect(document.activeElement).not.toBe(input)

    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(document.activeElement).toBe(input)
  })

  it('pressing Ctrl+K focuses search input', () => {
    render(<TestComponent />)
    const input = screen.getByTestId('search')

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(document.activeElement).toBe(input)
  })

  it('pressing Escape blurs the active element', () => {
    render(<TestComponent />)
    const input = screen.getByTestId('search')

    input.focus()
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.activeElement).not.toBe(input)
  })
})
