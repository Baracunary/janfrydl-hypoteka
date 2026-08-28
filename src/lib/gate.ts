// Odemčení druhého kroku kalkulačky po odeslání formuláře: osobní srovnání bank,
// orientační úspora proti průměrné nabídkové sazbě, doporučená délka fixace.

import { bankyProLTV, vypocitejOrientacniUsporu, sazby, formatujKc, formatujProcenta, type Fixace } from './hypoteka'
import type { KalkulackaStav } from './kalkulacka'

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const nalezeny = document.getElementById(id)
  if (!nalezeny) throw new Error(`Element #${id} nebyl v DOM nalezen.`)
  return nalezeny as T
}

/** Fixace s nejnižší dostupnou sazbou pro dané LTV — datově podložené doporučení. */
function doporucenaFixace(ltv: number): { fixace: Fixace; sazba: number } | null {
  const moznosti: Fixace[] = [1, 3, 5]
  let nejlepsi: { fixace: Fixace; sazba: number } | null = null

  for (const fixace of moznosti) {
    const banky = bankyProLTV(sazby.banky, fixace, ltv, 1)
    if (banky.length > 0 && (!nejlepsi || banky[0].sazba < nejlepsi.sazba)) {
      nejlepsi = { fixace, sazba: banky[0].sazba }
    }
  }
  return nejlepsi
}

export function odemkniSrovnani(stav: KalkulackaStav): void {
  const obalGate = el('gate-obal')
  const zamekOverlay = el('gate-zamek-overlay')
  const tabulkaTelo = el<HTMLTableSectionElement>('gate-tabulka-telo')
  const uspora = el('gate-uspora')
  const fixaceDoporuceni = el('gate-fixace-doporuceni')

  obalGate.classList.remove('gate-rozmazano')
  zamekOverlay.hidden = true

  const ltvProSrovnani = stav.rezim === 'koupe' ? stav.ltv : 80
  const fixaceProSrovnani = stav.rezim === 'koupe' ? stav.fixace : 3
  const banky = bankyProLTV(sazby.banky, fixaceProSrovnani, ltvProSrovnani, 5)

  tabulkaTelo.innerHTML =
    banky
      .map(
        (b, i) => `
        <tr class="${i === 0 ? 'bg-brand-primary-tint' : ''}">
          <td class="py-2 pr-4 font-medium">${b.nazev}${i === 0 ? ' <span class="text-brand-primary text-xs font-bold uppercase">nejlevnější</span>' : ''}</td>
          <td class="py-2 text-right tabular-nums">${formatujProcenta(b.sazba, 2)}</td>
        </tr>`,
      )
      .join('') || '<tr><td class="py-2 text-ui-muted" colspan="2">Pro zadané parametry si banky ověříme individuálně.</td></tr>'

  if (stav.uver > 0) {
    const roky = stav.rezim === 'koupe' ? stav.roky : (stav.refi?.zbyvajiciDoba ?? stav.roky)
    const fixaceRoky = fixaceProSrovnani
    const { usporaMesicne, usporaZaFixaci } = vypocitejOrientacniUsporu(stav.uver, roky, fixaceRoky)

    uspora.innerHTML =
      usporaMesicne > 0
        ? `Orientačně můžete oproti průměrné nabídkové sazbě (${formatujProcenta(sazby.prumerna_nabidkova_sazba, 2)}) ušetřit
           <strong class="text-accent-value-text">${formatujKc(usporaMesicne)} / měsíc</strong>,
           za ${fixaceRoky}letou fixaci orientačně <strong class="text-accent-value-text">${formatujKc(usporaZaFixaci)}</strong>.`
        : `Vaše parametry jsou už blízko nejlepším sazbám na trhu, přesto se vyplatí nechat si nabídky porovnat.`
  }

  const doporuceni = ltvProSrovnani ? doporucenaFixace(ltvProSrovnani) : null
  fixaceDoporuceni.textContent = doporuceni
    ? `Podle aktuálních sazeb pro vaše LTV vychází nejlépe ${doporuceni.fixace}letá fixace (${formatujProcenta(doporuceni.sazba, 2)} p.a.).`
    : `Délku fixace vám doporučím na míru podle vaší situace.`

  obalGate.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
