// Dedikovaný handler pro squeeze formulář na /fixace.
// Sbírá jméno + telefon + email + kdy_konci_fixace + souhlas.
// Po úspěchu uloží kontakt do sessionStorage (pro předvyplnění na /fixace/video)
// a přesměruje na /fixace/video.

import { validujJmeno, validujTelefon, validujEmail, normalizujTelefon } from './validace'
import { ziskejUtm, ziskejFbclid } from './utm'
import { trackLead, vygenerujEventId } from './analytics'

const CAS_NACTENI = Date.now()
const MIN_CAS_MS = 3000

const KLIC_FIXACE_KONTAKT = 'jf_fixace_kontakt'

export interface FixaceKontakt {
  jmeno: string
  email: string
}

export function ulozFixaceKontakt(kontakt: FixaceKontakt): void {
  try {
    sessionStorage.setItem(KLIC_FIXACE_KONTAKT, JSON.stringify(kontakt))
  } catch {
    // sessionStorage nedostupný — nevadí, formulář na /fixace/video se jen nevyplní
  }
}

export function nactiFixaceKontakt(): FixaceKontakt | null {
  try {
    const ulozeny = sessionStorage.getItem(KLIC_FIXACE_KONTAKT)
    return ulozeny ? (JSON.parse(ulozeny) as FixaceKontakt) : null
  } catch {
    return null
  }
}

function pole<T extends HTMLElement = HTMLElement>(form: HTMLFormElement, nazev: string): T {
  const nalezeny = form.querySelector<T>(`[data-pole="${nazev}"]`)
  if (!nalezeny) throw new Error(`Pole [data-pole="${nazev}"] nebylo ve formuláři nalezeno.`)
  return nalezeny
}

function nastavChybu(form: HTMLFormElement, nazev: string, vstup: HTMLElement, zprava: string | null) {
  const chybaEl = form.querySelector<HTMLElement>(`[data-chyba="${nazev}"]`)
  if (chybaEl) chybaEl.textContent = zprava ?? ''
  vstup.setAttribute('aria-invalid', String(Boolean(zprava)))
}

export function inicializujFormularFixace(form: HTMLFormElement): void {
  const vstupJmeno = pole<HTMLInputElement>(form, 'jmeno')
  const vstupTelefon = pole<HTMLInputElement>(form, 'telefon')
  const vstupEmail = pole<HTMLInputElement>(form, 'email')
  const vstupKdyKonci = pole<HTMLSelectElement>(form, 'kdy_konci_fixace')
  const vstupSouhlas = pole<HTMLInputElement>(form, 'souhlas')
  const vstupHoneypot = pole<HTMLInputElement>(form, 'honeypot')
  const tlacitko = form.querySelector<HTMLButtonElement>('[data-role="btn-odeslat"]')
  if (!tlacitko) throw new Error('Tlačítko [data-role="btn-odeslat"] nebylo nalezeno.')
  const puvodniText = tlacitko.textContent!.trim()
  const chybaObecna = form.querySelector<HTMLElement>('[data-role="chyba-obecna"]')
  const opravaEmailu = form.querySelector<HTMLButtonElement>('[data-role="oprava-emailu"]')

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

    if (vstupHoneypot.value.trim() !== '') return
    if (Date.now() - CAS_NACTENI < MIN_CAS_MS) return

    const jmeno = validujJmeno(vstupJmeno.value)
    nastavChybu(form, 'jmeno', vstupJmeno, jmeno.platne ? null : jmeno.chyba!)

    const telefon = validujTelefon(vstupTelefon.value)
    nastavChybu(form, 'telefon', vstupTelefon, telefon.platne ? null : telefon.chyba!)

    const email = validujEmail(vstupEmail.value)
    nastavChybu(form, 'email', vstupEmail, !email.platne ? email.chyba! : email.chyba ?? null)

    const kdyVyplneno = vstupKdyKonci.value !== ''
    nastavChybu(form, 'kdy_konci_fixace', vstupKdyKonci, kdyVyplneno ? null : 'Vyberte prosím, kdy vám fixace končí.')

    const souhlasZaskrtnut = vstupSouhlas.checked
    nastavChybu(form, 'souhlas', vstupSouhlas, souhlasZaskrtnut ? null : 'Pro odeslání je potřeba souhlas se zpracováním údajů.')

    if (!jmeno.platne || !telefon.platne || !email.platne || !kdyVyplneno || !souhlasZaskrtnut) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    tlacitko.disabled = true
    tlacitko.textContent = 'Odesílám…'
    if (chybaObecna) chybaObecna.hidden = true

    const eventId = vygenerujEventId()
    const utm = ziskejUtm()

    const payload = {
      jmeno: vstupJmeno.value.trim(),
      telefon: normalizujTelefon(vstupTelefon.value)!,
      email: vstupEmail.value.trim(),
      situace: 'Končí mi fixace',
      typ: 'fixace',
      krok: 1,
      kdy_konci_fixace: vstupKdyKonci.value,
      souhlas: true,
      souhlas_cas: new Date().toISOString(),
      event_id: eventId,
      kalkulacka: {
        rezim: 'refinancovani',
        cena: 0,
        vlastni_zdroje: 0,
        uver: 0,
        roky: 0,
        fixace: 0,
        ltv: 0,
        splatka: 0,
        do36: false,
        ucel: '',
      },
      utm,
      fbclid: ziskejFbclid(),
      url: window.location.href,
      user_agent: navigator.userAgent,
    }

    try {
      const odpoved = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!odpoved.ok) throw new Error(`Server vrátil ${odpoved.status}`)

      trackLead(eventId)

      ulozFixaceKontakt({
        jmeno: payload.jmeno,
        email: payload.email,
      })

      window.location.href = '/fixace/video'
    } catch {
      tlacitko.disabled = false
      tlacitko.textContent = puvodniText
      if (chybaObecna) {
        chybaObecna.hidden = false
        chybaObecna.textContent =
          'Odeslání se teď nepovedlo. Zkuste to znovu nebo mi zavolejte na +420 731 444 770.'
      }
    }
  })
}
