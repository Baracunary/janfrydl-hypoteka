// Lead formulář: honeypot, time-trap, validace, odeslání na /api/lead.
// Použitelné pro víc instancí formuláře na stránce (gate + závěrečný formulář),
// proto se pole hledají přes data-pole atributy uvnitř konkrétního <form>, ne přes globální ID.

import { validujJmeno, validujTelefon, validujEmail, normalizujTelefon } from './validace'
import { ziskejUtm, ziskejFbclid } from './utm'
import { trackInitiateCheckout, trackLead, trackFormStart, vygenerujEventId } from './analytics'
import type { KalkulackaStav } from './kalkulacka'

const CAS_NACTENI = Date.now()
const MIN_CAS_PRED_ODESLANIM_MS = 3000

function pole<T extends HTMLElement = HTMLElement>(form: HTMLFormElement, nazev: string): T | null {
  return form.querySelector<T>(`[data-pole="${nazev}"]`)
}

function polePovinne<T extends HTMLElement = HTMLElement>(form: HTMLFormElement, nazev: string): T {
  const nalezeny = pole<T>(form, nazev)
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

function ltvPasmo(ltv: number): string {
  if (ltv <= 80) return 'do_80'
  if (ltv <= 90) return '80_90'
  return 'nad_90'
}

function uverPasmo(uver: number): string {
  if (uver < 3_000_000) return 'do_3M'
  if (uver <= 5_000_000) return '3_5M'
  return 'nad_5M'
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
    typ: 'koupe' as const,
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
      ltv_nad_limit: stav.ltvNadLimit,
      ltv_pasmo: ltvPasmo(stav.ltv),
      uver_pasmo: uverPasmo(stav.uver),
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
  const vstupJmeno = polePovinne<HTMLInputElement>(form, 'jmeno')
  const vstupTelefon = polePovinne<HTMLInputElement>(form, 'telefon')
  // Email je volitelný — pole nemusí být přítomno, nebo může být s required=false
  const vstupEmail = pole<HTMLInputElement>(form, 'email')
  // Situace může být hidden input s pevnou hodnotou nebo select — obojí funguje
  const vstupSituace = pole<HTMLInputElement | HTMLSelectElement>(form, 'situace')
  const vstupSouhlas = polePovinne<HTMLInputElement>(form, 'souhlas')
  const vstupHoneypot = polePovinne<HTMLInputElement>(form, 'honeypot')
  const tlacitkoOdeslat = form.querySelector<HTMLButtonElement>('[data-role="btn-odeslat"]')
  if (!tlacitkoOdeslat) throw new Error('Tlačítko [data-role="btn-odeslat"] nebylo ve formuláři nalezeno.')
  const puvodniTextTlacitka = tlacitkoOdeslat.textContent!.trim()
  const chybaObecna = form.querySelector<HTMLElement>('[data-role="chyba-obecna"]')
  const opravaEmailu = form.querySelector<HTMLButtonElement>('[data-role="oprava-emailu"]')

  // Sledovat první zadání do libovolného pole — form_start event (1× za session)
  const sledovanaPole = [vstupJmeno, vstupTelefon, vstupEmail].filter(Boolean) as HTMLInputElement[]
  sledovanaPole.forEach((vstup) => {
    vstup.addEventListener('input', () => trackFormStart(), { once: true })
  })

  // Našeptávač překlepu v doméně e-mailu — jen pokud pole existuje
  if (vstupEmail) {
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
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    if (vstupHoneypot.value.trim() !== '') return
    if (Date.now() - CAS_NACTENI < MIN_CAS_PRED_ODESLANIM_MS) return

    const jmeno = validujJmeno(vstupJmeno.value)
    nastavChybu(form, 'jmeno', vstupJmeno, jmeno.platne ? null : jmeno.chyba!)

    const telefon = validujTelefon(vstupTelefon.value)
    nastavChybu(form, 'telefon', vstupTelefon, telefon.platne ? null : telefon.chyba!)

    // Email je volitelný: validujeme jen pokud je zadán
    let emailOk = true
    if (vstupEmail) {
      const emailHodnota = vstupEmail.value.trim()
      if (emailHodnota !== '') {
        const email = validujEmail(emailHodnota)
        nastavChybu(form, 'email', vstupEmail, !email.platne ? email.chyba! : email.chyba ?? null)
        emailOk = email.platne
      } else {
        nastavChybu(form, 'email', vstupEmail, null)
      }
    }

    const situaceHodnota = vstupSituace?.value ?? 'Kupuji nemovitost'
    const situaceVyplnena = situaceHodnota !== ''
    if (vstupSituace && vstupSituace.tagName === 'SELECT') {
      nastavChybu(form, 'situace', vstupSituace, situaceVyplnena ? null : 'Vyberte prosím, co řešíte.')
    }

    const souhlasZaskrtnut = vstupSouhlas.checked
    nastavChybu(form, 'souhlas', vstupSouhlas, souhlasZaskrtnut ? null : 'Pro odeslání je potřeba souhlas se zpracováním údajů.')

    if (!jmeno.platne || !telefon.platne || !emailOk || !situaceVyplnena || !souhlasZaskrtnut) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    trackInitiateCheckout()

    tlacitkoOdeslat.disabled = true
    tlacitkoOdeslat.textContent = 'Odesílám…'
    if (chybaObecna) chybaObecna.hidden = true

    const eventId = vygenerujEventId()
    const stav = volby.ziskejStav()
    const payload = sestavPayload(
      {
        jmeno: vstupJmeno.value.trim(),
        telefon: normalizujTelefon(vstupTelefon.value)!,
        email: vstupEmail?.value.trim() ?? '',
        situace: situaceHodnota,
        souhlasCas: new Date().toISOString(),
      },
      eventId,
      stav,
    )

    try {
      const odpoved = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!odpoved.ok) throw new Error(`Server vrátil ${odpoved.status}`)

      trackLead(eventId, {
        ltv_pasmo: ltvPasmo(stav.ltv),
        uver_pasmo: uverPasmo(stav.uver),
        fixace: stav.fixace,
      })
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
