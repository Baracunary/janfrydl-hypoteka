// Validace formulářových polí — jméno, telefon (normalizace na +420), e-mail (+ typo-check domény).

export interface VysledekValidace {
  platne: boolean
  chyba?: string
  /** Normalizovaná/opravená hodnota, pokud validátor umí opravit vstup. */
  navrh?: string
}

export function validujJmeno(jmeno: string): VysledekValidace {
  const ocistene = jmeno.trim()
  if (ocistene.length < 3) {
    return { platne: false, chyba: 'Zadejte prosím celé jméno a příjmení.' }
  }
  return { platne: true }
}

/**
 * Normalizuje české mobilní číslo na tvar +420XXXXXXXXX.
 * Akceptuje mezery, volitelnou předvolbu +420 / 00420 / 420, číslo začínající 6 nebo 7.
 */
export function normalizujTelefon(telefon: string): string | null {
  const cisliceOnly = telefon.replace(/[^\d+]/g, '')
  let bezPredvolby = cisliceOnly

  if (bezPredvolby.startsWith('+420')) bezPredvolby = bezPredvolby.slice(4)
  else if (bezPredvolby.startsWith('00420')) bezPredvolby = bezPredvolby.slice(5)
  else if (bezPredvolby.startsWith('420') && bezPredvolby.length === 12) bezPredvolby = bezPredvolby.slice(3)
  else if (bezPredvolby.startsWith('+')) return null

  if (!/^\d{9}$/.test(bezPredvolby)) return null
  if (!/^[67]/.test(bezPredvolby)) return null

  return `+420${bezPredvolby}`
}

export function validujTelefon(telefon: string): VysledekValidace {
  const normalizovany = normalizujTelefon(telefon)
  if (!normalizovany) {
    return { platne: false, chyba: 'Zadejte platné české mobilní číslo, např. 731 444 770.' }
  }
  return { platne: true, navrh: normalizovany }
}

const CASTE_DOMENY = [
  'gmail.com',
  'seznam.cz',
  'email.cz',
  'centrum.cz',
  'atlas.cz',
  'volny.cz',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'post.cz',
  'tiscali.cz',
  'yahoo.com',
]

/** Levenshteinova vzdálenost — pro odhad překlepu v doméně e-mailu. */
function levenshtein(a: string, b: string): number {
  const matice: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) matice[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cena = a[i - 1] === b[j - 1] ? 0 : 1
      matice[i][j] = Math.min(matice[i - 1][j] + 1, matice[i][j - 1] + 1, matice[i - 1][j - 1] + cena)
    }
  }
  return matice[a.length][b.length]
}

/** Najde nejbližší běžnou doménu, pokud se zadaná doména liší jen o malý překlep. */
export function navrhniOpravuDomeny(email: string): string | null {
  const zavinac = email.lastIndexOf('@')
  if (zavinac === -1) return null

  const domena = email.slice(zavinac + 1).toLowerCase()
  if (CASTE_DOMENY.includes(domena)) return null

  let nejlepsi: { domena: string; vzdalenost: number } | null = null
  for (const kandidat of CASTE_DOMENY) {
    const vzdalenost = levenshtein(domena, kandidat)
    if (vzdalenost > 0 && vzdalenost <= 2 && (!nejlepsi || vzdalenost < nejlepsi.vzdalenost)) {
      nejlepsi = { domena: kandidat, vzdalenost }
    }
  }

  return nejlepsi ? email.slice(0, zavinac + 1) + nejlepsi.domena : null
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validujEmail(email: string): VysledekValidace {
  const ocisteny = email.trim()
  if (!EMAIL_REGEX.test(ocisteny)) {
    return { platne: false, chyba: 'Zadejte prosím platnou e-mailovou adresu.' }
  }

  const navrh = navrhniOpravuDomeny(ocisteny)
  if (navrh) {
    return { platne: true, chyba: `Neměli jste na mysli ${navrh}?`, navrh }
  }

  return { platne: true }
}
