import './style.css'
import { inject } from '@vercel/analytics'
import { inicializujUtm } from './lib/utm'
import { inicializujAnalytiku, trackStep2View, trackFormStart } from './lib/analytics'
import { inicializujKalkulacku, ziskejAktualniStav } from './lib/kalkulacka'
import { inicializujFormular } from './lib/formular'
import { inicializujStickyCta } from './lib/sticky-cta'
import { inicializujCookieListu } from './lib/cookie-lista'
import { inicializujAccordion } from './lib/accordion'
import { inicializujRecenzeCarousel } from './lib/recenze-carousel'
import { formatujKc, formatujProcenta, sazby } from './lib/hypoteka'

inject()
inicializujUtm()
inicializujAnalytiku()
inicializujKalkulacku()
inicializujRecenzeCarousel()
inicializujCookieListu()
inicializujStickyCta()
inicializujAccordion()

// Datum sazeb v poznámce pod kalkulačkou
const sazbyDatum = document.getElementById('sazby-datum')
if (sazbyDatum) {
  const [rok, mesic, den] = sazby.aktualizovano.split('-').map(Number)
  sazbyDatum.textContent = `${den}. ${mesic}. ${rok}`
}

// step2_view: jakmile se karta formuláře dostane do viewportu (IntersectionObserver)
const krok2El = document.getElementById('krok-2')
if (krok2El) {
  const observer = new IntersectionObserver(
    (zaznamy) => {
      if (zaznamy.some((z) => z.isIntersecting)) {
        trackStep2View()
        observer.disconnect()
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(krok2El)
}

// form_start: první input do libovolného formulářového pole na stránce
let formStartOdeslan = false
document.querySelectorAll<HTMLInputElement>('form input, form select').forEach((vstup) => {
  vstup.addEventListener(
    'input',
    () => {
      if (!formStartOdeslan) {
        formStartOdeslan = true
        trackFormStart()
      }
    },
    { once: true },
  )
})

// Teaser příručky — ukáž po prvním výpočtu
document.addEventListener(
  'jf:calc-interakce',
  () => {
    const teaser = document.getElementById('prirucka-teaser')
    if (teaser) teaser.hidden = false
  },
  { once: true },
)

// sticky CTA: po výpočtu přepnout popisek na "Chci porovnat banky"
// (logika zobrazení samotné lišty zůstává v sticky-cta.ts)
const stickyCta = document.getElementById('sticky-cta')
const stickyCtaBtn = document.getElementById('sticky-cta-btn')
let stickyPrepnuto = false

if (stickyCta && stickyCtaBtn) {
  // Sleduj první interakci s kalkulačkou — pak přepni text a cíl tlačítka
  document.addEventListener(
    'jf:calc-interakce',
    () => {
      if (stickyPrepnuto) return
      stickyPrepnuto = true
      stickyCtaBtn.textContent = 'Chci porovnat banky'
      stickyCtaBtn.setAttribute('href', '#krok-2')
    },
    { once: true },
  )

  // Skrýt sticky CTA když je formulář (krok-2) ve viewportu
  if (krok2El) {
    const stickyObserver = new IntersectionObserver(
      (zaznamy) => {
        const visible = zaznamy.some((z) => z.isIntersecting)
        stickyCta.style.display = visible ? 'none' : ''
      },
      { threshold: 0.2 },
    )
    stickyObserver.observe(krok2El)
  }
}

function zobrazDikyStav(): void {
  const stav = ziskejAktualniStav()

  const gateDikyShrnuti = document.getElementById('gate-diky-shrnuti')
  if (gateDikyShrnuti) {
    const castiShrnuti = [`Vaše orientační splátka: ${formatujKc(stav.splatka)} / měsíc`, `výše úvěru ${formatujKc(stav.uver)}`]
    if (stav.rezim === 'koupe') castiShrnuti.push(`LTV ${formatujProcenta(stav.ltv, 0)}`)
    gateDikyShrnuti.textContent = castiShrnuti.join(' · ') + '.'
  }

  document.getElementById('gate-form')?.setAttribute('hidden', '')
  document.getElementById('gate-diky')?.removeAttribute('hidden')
  document.getElementById('form-zaverecny')?.setAttribute('hidden', '')
  document.getElementById('form2-diky')?.removeAttribute('hidden')
  document.querySelectorAll<HTMLElement>('[data-cta-formular]').forEach((cta) => (cta.hidden = true))
}

const formGate = document.getElementById('gate-form') as HTMLFormElement | null
if (formGate) {
  inicializujFormular(formGate, {
    ziskejStav: ziskejAktualniStav,
    onUspech: () => zobrazDikyStav(),
  })
}

const formZaverecny = document.getElementById('form-zaverecny') as HTMLFormElement | null
if (formZaverecny) {
  inicializujFormular(formZaverecny, {
    ziskejStav: ziskejAktualniStav,
    onUspech: () => zobrazDikyStav(),
  })
}
