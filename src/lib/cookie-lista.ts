// Cookie lišta — tři tlačítka (Jen nezbytné / Nastavit / Přijmout vše).
// Nesmí překrývat CTA na mobilu ani být fullscreen — viz layout v index.html.

import { ziskejSouhlas, ulozSouhlas } from './consent'

function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}

export function inicializujCookieListu(): void {
  const lista = el('cookie-lista')
  const panelNastaveni = el('cookie-nastaveni')
  if (!lista) return

  // Souhlas už byl dřív udělen — lištu vůbec nezobrazíme.
  if (ziskejSouhlas()) {
    lista.remove()
    return
  }

  el<HTMLButtonElement>('cookie-jen-nezbytne')?.addEventListener('click', () => {
    ulozSouhlas({ analytika: false, marketing: false })
    lista.remove()
  })

  el<HTMLButtonElement>('cookie-prijmout-vse')?.addEventListener('click', () => {
    ulozSouhlas({ analytika: true, marketing: true })
    lista.remove()
  })

  el<HTMLButtonElement>('cookie-nastavit')?.addEventListener('click', () => {
    panelNastaveni?.toggleAttribute('hidden')
  })

  el<HTMLButtonElement>('cookie-ulozit-nastaveni')?.addEventListener('click', () => {
    const analytika = el<HTMLInputElement>('cookie-analytika')?.checked ?? false
    const marketing = el<HTMLInputElement>('cookie-marketing')?.checked ?? false
    ulozSouhlas({ analytika, marketing })
    lista.remove()
  })
}
