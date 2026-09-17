/**
 * Page-view tracking.
 *
 * Two sinks, independent of each other:
 *
 *   Google Analytics 4        loaded on first use, skipped off production
 *   VITE_ANALYTICS_ENDPOINT   the existing beacon, left exactly as it was
 *
 * The tag is loaded from here rather than pasted into index.html so it can be
 * skipped on preview deploys and local dev — a script tag in the document would
 * load everywhere and mix reviewer traffic into the real property.
 *
 * The site was on Universal Analytics (UA-39701609-7) until Google shut UA down
 * in 2023. GA4 is not a drop-in: it wants a measurement ID from the property's
 * web stream, and a single-page app has to send page_view itself because there
 * is no document load between tabs.
 */

// The measurement ID is not a secret — it ships in the page source of every
// GA-instrumented site — so it lives here rather than in a build secret. Making
// it a secret would only mean analytics silently did nothing until someone
// remembered to set one. VITE_GA_MEASUREMENT_ID still overrides, for a fork or
// a staging property.
const DEFAULT_GA_ID = 'G-VW4VW6G68S'
const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || DEFAULT_GA_ID

/** Whether this page should report to the real property.
 *
 *  Preview deploys are served from the production hostname under
 *  /previews/pr-N/, so there is no host to distinguish them by — the path is
 *  the only signal. Without this, every PR preview and every local dev session
 *  would mix into the same property as real traffic. */
function shouldTrack(): boolean {
  if (typeof window === 'undefined') return false
  const { hostname, pathname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false
  if (pathname.startsWith('/previews/')) return false
  return true
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let gaReady = false

/** Inject gtag.js once, on the first tracked view rather than at module load.
 *
 *  Deferring it keeps the script off the critical path — the pricing table is
 *  what the page is for — and means a build without an ID never contacts
 *  Google at all. */
function ensureGa(): boolean {
  if (!GA_ID || !shouldTrack()) return false
  if (gaReady) return true
  if (typeof document === 'undefined') return false

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  // gtag pushes `arguments` itself — an arrow function with rest args would
  // change the shape dataLayer receives.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  // send_page_view is off because this is a single-page app: the automatic one
  // would fire only on the initial load and then never again, under-counting
  // every tab change. trackPageView below sends them explicitly.
  window.gtag('config', GA_ID, { send_page_view: false })

  gaReady = true
  return true
}

export function trackPageView(page: string): void {
  // Increment localStorage counter (visible in DevTools for local verification)
  const key = `pageview:${page}`
  const count = Number(localStorage.getItem(key) || 0) + 1
  localStorage.setItem(key, String(count))

  if (ensureGa()) {
    window.gtag!('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: page,
    })
  }

  // Fire beacon to configurable endpoint (no-op if not set)
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT
  if (endpoint) {
    navigator.sendBeacon(endpoint, JSON.stringify({ page, ts: Date.now() }))
  }
}

/** Report something the visitor did, rather than somewhere they went.
 *
 *  Nothing calls this yet; it exists so the next event does not arrive as
 *  another inline gtag call somewhere in a component. */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (ensureGa()) window.gtag!('event', name, params)
}
