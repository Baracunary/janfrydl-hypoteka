// Meta Pixel (client-side), Clarity a volitelná Plausible analytika.
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
// Doplňte ID projektu v Clarity (Settings → Project ID) do env proměnné PUBLIC_CLARITY_PROJECT_ID
// nebo přímo sem jako fallback řetězec:
export const CLARITY_PROJECT_ID = import.meta.env.PUBLIC_CLARITY_PROJECT_ID as string | undefined

let pixelNacten = false
let analytikaNactena = false
let clarityNactena = false
let viewContentOdeslan = false
let calcStartOdeslan = false
let calcResultOdeslan = false
let step2ViewOdeslan = false
let formStartOdeslan = false

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

/** Načte Microsoft Clarity po souhlasu s analytikou. ID doplňte do PUBLIC_CLARITY_PROJECT_ID. */
export function nactiClarity(projectId: string | undefined = CLARITY_PROJECT_ID): void {
  if (clarityNactena || !projectId) return
  clarityNactena = true

  /* eslint-disable */
  ;(function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] = c[a] || function (...args: unknown[]) { (c[a].q = c[a].q || []).push(args) }
    const t = l.createElement(r) as HTMLScriptElement
    t.async = true
    t.src = `https://www.clarity.ms/tag/${i}`
    const y = l.getElementsByTagName(r)[0]
    y.parentNode?.insertBefore(t, y)
  })(window, document, 'clarity', 'script', projectId)
  /* eslint-enable */
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

// ─── Funnel events ─────────────────────────────────────────────────────────────

/** Původní ViewContent — první interakce s kalkulačkou (kompatibilita). */
export function trackViewContent(): void {
  if (viewContentOdeslan) return
  viewContentOdeslan = true
  window.fbq?.('track', 'ViewContent')
}

/** calc_start — první interakce s kalkulačkou (nový custom event, max 1× za session). */
export function trackCalcStart(): void {
  if (calcStartOdeslan) return
  calcStartOdeslan = true
  window.fbq?.('trackCustom', 'calc_start')
}

/** calc_result — výsledek zobrazen po první úpravě vstupů (max 1× za session). */
export function trackCalcResult(params: { ltv_pasmo: string; uver_pasmo: string; fixace: number }): void {
  if (calcResultOdeslan) return
  calcResultOdeslan = true
  window.fbq?.('trackCustom', 'calc_result', params)
}

/** step2_view — karta s formulářem se dostala do viewportu (IntersectionObserver v main.ts). */
export function trackStep2View(): void {
  if (step2ViewOdeslan) return
  step2ViewOdeslan = true
  window.fbq?.('trackCustom', 'step2_view')
}

/** form_start — první zadání do pole formuláře (max 1× za session). */
export function trackFormStart(): void {
  if (formStartOdeslan) return
  formStartOdeslan = true
  window.fbq?.('trackCustom', 'form_start')
}

export function trackInitiateCheckout(): void {
  window.fbq?.('track', 'InitiateCheckout')
}

/** Vygeneruje event_id sdílený mezi Pixel Lead eventem a serverovým CAPI voláním. */
export function vygenerujEventId(): string {
  return crypto.randomUUID()
}

/** Lead — standardní Meta event. Odesílat přesně jednou po úspěšném odeslání formuláře. */
export function trackLead(
  eventId: string,
  params?: { ltv_pasmo?: string; uver_pasmo?: string; fixace?: number },
): void {
  window.fbq?.('track', 'Lead', params ?? {}, { eventID: eventId })
}
