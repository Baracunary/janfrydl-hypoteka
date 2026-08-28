// Lead formulář: honeypot, time-trap, validace, odeslání na /api/lead.
// Použitelné pro víc instancí formuláře na stránce (gate + závěrečný formulář),
// proto se pole hledají přes data-pole atributy uvnitř konkrétního <form>, ne přes globální ID.

import { validujJmeno, validujTelefon, validujEmail, normalizujTelefon } from './validace'
import { ziskejUtm, ziskejFbclid } from './utm'
import { trackInitiateCheckout, trackLead, vygenerujEventId } from './analytics'
import type { KalkulackaStav } from './kalkulacka'

const CAS_NACTENI = Date.now()
const MIN_CAS_PRED_ODESLANIM_MS = 3000

function pole<T extends HTMLElement = HTMLElement>(form: HTMLFormElement, nazev: string): T {
  const nalezeny = form.querySelector<T>(`[data-pole="${nazev}"]`)
  if (!nalezeny) throw new Error(`Pole [data-pole="${nazev}"] nebylo ve formuláři nalezeno.`)
  return nalezeny
}

function chybovyElement(form: HTMLFormElement, nazev: string): HTMLElement | null {
  return form.querySelector<HTMLElement>(`[data-chyba="${nazev}"]`)
}

function nastavChybu(form: HTMLFormElement, nazev: string, vstup: HTMLElement, zprava: string | null) {
  const chybaEl = chybovyElement(form, nazev)
  if (chybaEl) chybaEl.textContent = zprava ?? ''
  vstup.setAttribute('aria-invalid', String(Boolean(zprava)))
}

function sestavPayload(
  udaje: { jmeno: string; telefon: string; email: string; situace: string; souhlasCas: string },
  eventId: string,
  stav: KalkulackaStav,
) {
  const utm = ziskejUtm()
  return {
    jmeno: udaje.jmeno,
    telefon: udaje.telefon,
    email: udaje.email,
    situace: udaje.situace,
    souhlas: true,
    souhlas_cas: udaje.souhlasCas,
    event_id: eventId,
    kalkulacka: {
      rezim: stav.rezim,
      cena: stav.rezim === 'koupe' ? stav.cena : 0,
      vlastni_zdroje: stav.rezim === 'koupe' ? stav.vlastniZdroje : 0,
      uver: stav.uver,
      roky: stav.roky,
      fixace: stav.fixace,
      ltv: stav.ltv,
      splatka: stav.splatka,
      do36: stav.do36,
      ucel: stav.rezim === 'koupe' ? stav.ucel : '',
      ...(stav.refi
        ? {
            refi_soucasna_sazba: stav.refi.soucasnaSazba,
            refi_zbyvajici_doba: stav.refi.zbyvajiciDoba,
            refi_kdy_konci_fixace: stav.refi.kdyKonciFixace,
          }
        : {}),
    },
    utm,
    fbclid: ziskejFbclid(),
    url: window.location.href,
    user_agent: navigator.userAgent,
  }
}

export interface VolbyFormulare {
  ziskejStav: () => KalkulackaStav
  onUspech: (eventId: string) => void
}

export function inicializujFormular(form: HTMLFormElement, volby: VolbyFormulare): void {
  const vstupJmeno = pole<HTMLInputElement>(form, 'jmeno')
  const vstupTelefon = pole<HTMLInputElement>(form, 'telefon')
  const vstupEmail = pole<HTMLInputElement>(form, 'email')
  const vstupSituace = pole<HTMLSelectElement>(form, 'situace')
  const vstupSouhlas = pole<HTMLInputElement>(form, 'souhlas')
  const vstupHoneypot = pole<HTMLInputElement>(form, 'honeypot')
  const tlacitkoOdeslat = form.querySelector<HTMLButtonElement>('[data-role="btn-odeslat"]')
  if (!tlacitkoOdeslat) throw new Error('Tlačítko [data-role="btn-odeslat"] nebylo ve formuláři nalezeno.')
  // Gate a závěrečný formulář mají různý text tlačítka — při chybě se vrátí přesně na ten původní.
  const puvodniTextTlacitka = tlacitkoOdeslat.textContent!.trim()
  const chybaObecna = form.querySelector<HTMLElement>('[data-role="chyba-obecna"]')
  const opravaEmailu = form.querySelector<HTMLButtonElement>('[data-role="oprava-emailu"]')

  // Našeptávač překlepu v doméně e-mailu — reaguje hned po opuštění pole, ne až při odeslání.
  vstupEmail.addEventListener('blur', () => {
    if (vstupEmail.value.trim() === '') return
    const vysledek = validujEmail(vstupEmail.value)
    nastavChybu(form, 'email', vstupEmail, vysledek.platne ? (vysledek.chyba ?? null) : vysledek.chyba!)

    if (opravaEmailu) {
      if (vysledek.platne && vysledek.navrh) {
        opravaEmailu.hidden = false
        opravaEmailu.textContent = `Použít ${vysledek.navrh}`
        opravaEmailu.onclick = () => {
          vstupEmail.value = vysledek.navrh!
          nastavChybu(form, 'email', vstupEmail, null)
          opravaEmailu.hidden = true
        }
      } else {
        opravaEmailu.hidden = true
      }
    }
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Honeypot — bot pole vyplní, člověk ho nikdy nevidí. Tiše zahodíme, žádná chyba.
    if (vstupHoneypot.value.trim() !== '') return

    // Time-trap — rychlejší odeslání než 3 s od načtení je skoro jistě bot.
    if (Date.now() - CAS_NACTENI < MIN_CAS_PRED_ODESLANIM_MS) return

    const jmeno = validujJmeno(vstupJmeno.value)
    nastavChybu(form, 'jmeno', vstupJmeno, jmeno.platne ? null : jmeno.chyba!)

    const telefon = validujTelefon(vstupTelefon.value)
    nastavChybu(form, 'telefon', vstupTelefon, telefon.platne ? null : telefon.chyba!)

    const email = validujEmail(vstupEmail.value)
    // U e-mailu může být "chyba" jen návrh opravy překlepu — pole zůstává platné, jen upozorníme.
    nastavChybu(form, 'email', vstupEmail, !email.platne ? email.chyba! : email.chyba ?? null)

    const situaceVyplnena = vstupSituace.value !== ''
    nastavChybu(form, 'situace', vstupSituace, situaceVyplnena ? null : 'Vyberte prosím, co řešíte.')

    const souhlasZaskrtnut = vstupSouhlas.checked
    nastavChybu(form, 'souhlas', vstupSouhlas, souhlasZaskrtnut ? null : 'Pro odeslání je potřeba souhlas se zpracováním údajů.')

    if (!jmeno.platne || !telefon.platne || !email.platne || !situaceVyplnena || !souhlasZaskrtnut) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    trackInitiateCheckout()

    tlacitkoOdeslat.disabled = true
    tlacitkoOdeslat.textContent = 'Odesílám…'
    if (chybaObecna) chybaObecna.hidden = true

    const eventId = vygenerujEventId()
    const payload = sestavPayload(
      {
        jmeno: vstupJmeno.value.trim(),
        telefon: normalizujTelefon(vstupTelefon.value)!,
        email: vstupEmail.value.trim(),
        situace: vstupSituace.value,
        souhlasCas: new Date().toISOString(),
      },
      eventId,
      volby.ziskejStav(),
    )

    try {
      const odpoved = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!odpoved.ok) throw new Error(`Server vrátil ${odpoved.status}`)

      trackLead(eventId)
      volby.onUspech(eventId)
    } catch {
      tlacitkoOdeslat.disabled = false
      tlacitkoOdeslat.textContent = puvodniTextTlacitka
      if (chybaObecna) {
        chybaObecna.hidden = false
        chybaObecna.textContent =
          'Odeslání se teď nepovedlo, vaše údaje jsou ale v pořádku vyplněné. Zkuste to prosím znovu, nebo mi zatím rovnou zavolejte na +420 731 444 770.'
      }
    }
  })
}
