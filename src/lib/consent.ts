// Stav cookie souhlasu — tři úrovně dle cookie lišty (Jen nezbytné / Nastavit / Přijmout vše).
// Marketingové a analytické skripty se načítají výhradně po udělení příslušného souhlasu.

export interface Souhlas {
  analytika: boolean
  marketing: boolean
  /** ISO čas udělení souhlasu — pro auditní účely. */
  cas: string
}

const KLIC = 'jf_cookie_souhlas'
const UDALOST = 'jf:souhlas-zmenen'

export function ziskejSouhlas(): Souhlas | null {
  try {
    const ulozeny = localStorage.getItem(KLIC)
    return ulozeny ? (JSON.parse(ulozeny) as Souhlas) : null
  } catch {
    return null
  }
}

export function ulozSouhlas(souhlas: Omit<Souhlas, 'cas'>): void {
  const plny: Souhlas = { ...souhlas, cas: new Date().toISOString() }
  try {
    localStorage.setItem(KLIC, JSON.stringify(plny))
  } catch {
    // localStorage nedostupný — souhlas se zeptáme znovu příště, nic nerozbije
  }
  window.dispatchEvent(new CustomEvent<Souhlas>(UDALOST, { detail: plny }))
}

export function naZmenuSouhlasu(posluchac: (souhlas: Souhlas) => void): void {
  window.addEventListener(UDALOST, (e) => posluchac((e as CustomEvent<Souhlas>).detail))
}
