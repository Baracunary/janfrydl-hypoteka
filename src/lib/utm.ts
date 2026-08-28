// Čtení UTM parametrů a fbclid z URL, uložení do sessionStorage, aby přežily
// scroll/reload v rámci session a šlo je přilepit k odeslanému leadu.

export interface UtmData {
  source: string
  medium: string
  campaign: string
  content: string
  term: string
}

const KLIC_UTM = 'jf_utm'
const KLIC_FBCLID = 'jf_fbclid'

function nactiZUrlAUloz(): void {
  const params = new URLSearchParams(window.location.search)
  const utm: UtmData = {
    source: params.get('utm_source') ?? '',
    medium: params.get('utm_medium') ?? '',
    campaign: params.get('utm_campaign') ?? '',
    content: params.get('utm_content') ?? '',
    term: params.get('utm_term') ?? '',
  }

  const maJakoukoliHodnotu = Object.values(utm).some((v) => v !== '')
  if (maJakoukoliHodnotu) {
    sessionStorage.setItem(KLIC_UTM, JSON.stringify(utm))
  }

  const fbclid = params.get('fbclid')
  if (fbclid) {
    sessionStorage.setItem(KLIC_FBCLID, fbclid)
  }
}

/** Zavolat jednou při načtení stránky (main.ts). */
export function inicializujUtm(): void {
  try {
    nactiZUrlAUloz()
  } catch {
    // sessionStorage nemusí být dostupný (privátní režim) — bez UTM to leadu neuškodí
  }
}

export function ziskejUtm(): UtmData {
  try {
    const ulozene = sessionStorage.getItem(KLIC_UTM)
    if (ulozene) return JSON.parse(ulozene) as UtmData
  } catch {
    // ignorováno
  }
  return { source: '', medium: '', campaign: '', content: '', term: '' }
}

export function ziskejFbclid(): string {
  try {
    return sessionStorage.getItem(KLIC_FBCLID) ?? ''
  } catch {
    return ''
  }
}
