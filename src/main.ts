import './style.css'
import { inicializujUtm } from './lib/utm'
import { inicializujAnalytiku } from './lib/analytics'
import { inicializujKalkulacku, ziskejAktualniStav } from './lib/kalkulacka'
import { inicializujFormular } from './lib/formular'
import { inicializujStickyCta } from './lib/sticky-cta'
import { inicializujCookieListu } from './lib/cookie-lista'
import { inicializujAccordion } from './lib/accordion'
import { inicializujRecenzeCarousel } from './lib/recenze-carousel'
import { formatujKc, formatujProcenta, sazby } from './lib/hypoteka'

inicializujUtm()
inicializujAnalytiku()
inicializujKalkulacku()
inicializujRecenzeCarousel()
inicializujCookieListu()
inicializujStickyCta()
inicializujAccordion()

// Datum sazeb v poznámce pod kalkulačkou bereme přímo ze sazby.json, ať nezastará.
const sazbyDatum = document.getElementById('sazby-datum')
if (sazbyDatum) {
  const [rok, mesic, den] = sazby.aktualizovano.split('-').map(Number)
  sazbyDatum.textContent = `${den}. ${mesic}. ${rok}`
}

function zobrazDikyStav(): void {
  const stav = ziskejAktualniStav()

  const gateDikyShrnuti = document.getElementById('gate-diky-shrnuti')
  if (gateDikyShrnuti) {
    const castiShrnuti = [`Vaše orientační splátka: ${formatujKc(stav.splatka)} / měsíc`, `výše úvěru ${formatujKc(stav.uver)}`]
    if (stav.rezim === 'koupe') castiShrnuti.push(`LTV ${formatujProcenta(stav.ltv, 0)}`)
    gateDikyShrnuti.textContent = castiShrnuti.join(' · ') + '.'
  }

  // Pozor: skrýváme přímo <form>, ne obalující -obal div — gate-diky/form2-diky
  // jsou jeho sourozenci uvnitř téhož obalu, takže skrytí obalu by je skrylo taky.
  document.getElementById('gate-form')?.setAttribute('hidden', '')
  document.getElementById('gate-diky')?.removeAttribute('hidden')
  document.getElementById('form-zaverecny')?.setAttribute('hidden', '')
  document.getElementById('form2-diky')?.removeAttribute('hidden')
  // Prokliky na formulář po odeslání nedávají smysl — formuláře jsou skryté.
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
