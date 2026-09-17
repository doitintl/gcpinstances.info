import { describe, it, expect, afterEach } from 'vitest'
import { shouldTrack } from '../../src/lib/analytics'

/**
 * Preview deploys are served from the production hostname under /previews/pr-N/,
 * so this guard is the only thing keeping reviewer and local traffic out of the
 * real GA4 property. It is the reason the tag is loaded from code instead of
 * being pasted into index.html.
 */
describe('analytics tracking guard', () => {
  const real = window.location

  const at = (hostname: string, pathname: string) => {
    Object.defineProperty(window, 'location', {
      value: { ...real, hostname, pathname },
      writable: true,
      configurable: true,
    })
    return shouldTrack()
  }

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: real, writable: true, configurable: true })
  })

  it('tracks the production site', () => {
    expect(at('gcpinstances.doit.com', '/')).toBe(true)
    expect(at('gcpinstances.doit.com', '/cloudsql/')).toBe(true)
  })

  it('does not track preview deploys', () => {
    expect(at('gcpinstances.doit.com', '/previews/pr-269/')).toBe(false)
    expect(at('gcpinstances.doit.com', '/previews/pr-269/index.html')).toBe(false)
  })

  it('does not track local development', () => {
    expect(at('localhost', '/')).toBe(false)
    expect(at('127.0.0.1', '/')).toBe(false)
  })

  it('still tracks a path that merely contains the word', () => {
    expect(at('gcpinstances.doit.com', '/compute/previews-of-pricing')).toBe(true)
  })
})
