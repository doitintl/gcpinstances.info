export function trackPageView(page: string): void {
  // Increment localStorage counter (visible in DevTools for local verification)
  const key = `pageview:${page}`
  const count = Number(localStorage.getItem(key) || 0) + 1
  localStorage.setItem(key, String(count))

  // Fire beacon to configurable endpoint (no-op if not set)
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT
  if (endpoint) {
    navigator.sendBeacon(endpoint, JSON.stringify({ page, ts: Date.now() }))
  }
}
