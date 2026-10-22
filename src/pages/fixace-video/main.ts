import '../../style.css'
import { inject } from '@vercel/analytics'
import { inicializujUtm } from '../../lib/utm'
import { inicializujAnalytiku } from '../../lib/analytics'
import { inicializujCookieListu } from '../../lib/cookie-lista'
import { nactiFixaceKontakt } from '../../lib/formular-fixace'

inject()
inicializujUtm()
inicializujAnalytiku()
inicializujCookieListu()

// Sledování kliknutí na rezervační CTA (pro analytiku a Pixel)
document.querySelectorAll<HTMLElement>('[data-cta-rezervace]').forEach((cta) => {
  cta.addEventListener('click', () => {
    // Vlastní Pixel event pro klik na booking — odpaluje se jen po souhlasu s marketingovými cookies
    window.fbq?.('trackCustom', 'Lead_Qualified_Fixace', { typ: 'fixace' })
  })
})

// Předvyplnění jména z kroku 1 — pokud přišel přes formulář na /fixace
const kontakt = nactiFixaceKontakt()
if (kontakt?.jmeno) {
  const pozdrav = document.getElementById('pozdrav-jmeno')
  if (pozdrav) {
    pozdrav.textContent = `, ${kontakt.jmeno.split(' ')[0]}`
  }
}
