// Meta Pixel (client-side) + Microsoft Clarity + volitelná Plausible analytika.
// Skripty se načtou až po udělení příslušného souhlasu (marketing / analytika).
// event_id se generuje na klientovi a posílá i na server (api/lead.ts) kvůli
// deduplikaci Pixel ↔ Conversions API.

import { ziskejSouhlas, naZmenuSouhlasu } from './consent'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
    clarity?: (...args: unknown[]) => void
  }
}

const PIXEL_ID = import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined
const PLAUSIBLE_DOMAIN = import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN as string | undefined
// Microsoft Clarity (heatmapy, nahrávky relací) — projekt „Jan frýd“ na clarity.microsoft.com.
const CLARITY_ID = (import.meta.env.PUBLIC_CLARITY_ID as string | undefined) || 'z39wylggfk'

let pixelNacten = false
let analytikaNactena = false
let clarityNactena = false
let viewContentOdeslan = false

function nactiMetaPixel(): void {
  if (pixelNacten || !PIXEL_ID) return
  pixelNacten = true

  /* eslint-disable */
  ;(function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return
    const n: any = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
    })
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const t = b.createElement(e) as HTMLScriptElement
    t.async = true
    t.src = v
    const s = b.getElementsByTagName(e)[0]
    s.parentNode?.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq?.('init', PIXEL_ID)
  window.fbq?.('track', 'PageView')
}

function nactiPlausible(): void {
  if (analytikaNactena || !PLAUSIBLE_DOMAIN) return
  analytikaNactena = true

  const skript = document.createElement('script')
  skript.defer = true
  skript.dataset.domain = PLAUSIBLE_DOMAIN
  skript.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(skript)
}

function nactiClarity(): void {
  if (clarityNactena || !CLARITY_ID) return
  clarityNactena = true

  /* eslint-disable */
  ;(function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] =
      c[a] ||
      function (...args: unknown[]) {
        ;(c[a].q = c[a].q || []).push(args)
      }
    const t = l.createElement(r) as HTMLScriptElement
    t.async = true
    t.src = 'https://www.clarity.ms/tag/' + i
    const y = l.getElementsByTagName(r)[0]
    y.parentNode?.insertBefore(t, y)
  })(window, document, 'clarity', 'script', CLARITY_ID)
  /* eslint-enable */

  // Skript se načítá až po analytickém souhlasu → potvrdit souhlas i Clarity (Consent API).
  window.clarity?.('consent')
}

/** Zavolat jednou při startu aplikace — zohlední už dřív uložený souhlas a poslouchá změny. */
export function inicializujAnalytiku(): void {
  const soucasny = ziskejSouhlas()
  if (soucasny?.marketing) nactiMetaPixel()
  if (soucasny?.analytika) {
    nactiPlausible()
    nactiClarity()
  }

  naZmenuSouhlasu((souhlas) => {
    if (souhlas.marketing) nactiMetaPixel()
    if (souhlas.analytika) {
      nactiPlausible()
      nactiClarity()
    }
  })
}

/** ViewContent — signál skutečného zájmu, posílá se jen jednou za návštěvu (první pohyb sliderem). */
export function trackViewContent(): void {
  if (viewContentOdeslan) return
  viewContentOdeslan = true
  window.fbq?.('track', 'ViewContent')
}

export function trackInitiateCheckout(): void {
  window.fbq?.('track', 'InitiateCheckout')
}

/** Vygeneruje event_id sdílený mezi Pixel Lead eventem a serverovým CAPI voláním. */
export function vygenerujEventId(): string {
  return crypto.randomUUID()
}

export function trackLead(eventId: string): void {
  window.fbq?.('track', 'Lead', {}, { eventID: eventId })
}
