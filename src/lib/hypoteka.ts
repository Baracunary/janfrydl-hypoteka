// Výpočtové jádro hypoteční kalkulačky — anuita, LTV, sazby, formátování.
// Čistě funkční modul bez závislosti na DOM, snadno testovatelný.

import sazbyData from '../data/sazby.json'

export type Fixace = 1 | 3 | 5
export type UcelUveru = 'vlastni_bydleni' | 'investice'

export interface Banka {
  nazev: string
  fix1: number | null
  fix3: number | null
  fix5: number | null
  ltv_max: number
}

export interface SazbyKonfigurace {
  aktualizovano: string
  zdroj: string
  prumerna_nabidkova_sazba: number
  prumerna_zdroj: string
  sazba_kterou_vyjednavam: number
  banky: Banka[]
}

export const sazby = sazbyData as SazbyKonfigurace

export interface VysledekAnuity {
  /** měsíční splátka, zaokrouhlená na celé koruny nahoru */
  splatka: number
  celkemZaplaceno: number
  uroky: number
}

/**
 * Anuitní splátka. i = 0 ošetřeno lineárním rozpočtem jistiny.
 */
export function vypocitejAnuitu(jistina: number, rocniSazbaProcent: number, roky: number): VysledekAnuity {
  const i = rocniSazbaProcent / 100 / 12
  const n = Math.round(roky * 12)

  const splatkaSurova = i === 0 ? jistina / n : (jistina * (i * (1 + i) ** n)) / ((1 + i) ** n - 1)

  const splatka = Math.ceil(splatkaSurova)
  const celkemZaplaceno = splatka * n
  const uroky = celkemZaplaceno - jistina

  return { splatka, celkemZaplaceno, uroky }
}

/** LTV v procentech: podíl výše úvěru na ceně nemovitosti. */
export function vypocitejLTV(cenaNemovitosti: number, vlastniZdroje: number): number {
  if (cenaNemovitosti <= 0) return 0
  const uver = cenaNemovitosti - vlastniZdroje
  return (uver / cenaNemovitosti) * 100
}

/** Limit LTV podle pravidel ČNB platných 2026. */
export function limitLTV(ucel: UcelUveru, mladsiNez36: boolean): number {
  if (ucel === 'investice') return 70
  return mladsiNez36 ? 90 : 80
}

/**
 * Minimální přirážka 5leté fixace nad 3letou (v procentních bodech).
 * Banky ji v datech ze sazebníků občas nedodržují — zde ji vynucujeme,
 * aby 5letá fixace nikdy nevycházela levněji (nebo jen zanedbatelně dráž) než 3letá.
 */
export const PRIRAZKA_FIXACE_5 = 0.5

/** Sazba banky pro danou fixaci, nebo null pokud ji banka nenabízí. */
function sazbaBankyProFixaci(banka: Banka, fixace: Fixace): number | null {
  if (fixace === 1) return banka.fix1
  if (fixace === 3) return banka.fix3
  if (banka.fix5 === null) return null
  if (banka.fix3 === null) return banka.fix5
  return Math.max(banka.fix5, banka.fix3 + PRIRAZKA_FIXACE_5)
}

/** Banky, které vyhoví danému LTV a nabízí zvolenou fixaci, seřazené od nejlevnější. */
export function bankyProLTV(banky: Banka[], fixace: Fixace, ltv: number, limit = 5): Array<{ nazev: string; sazba: number }> {
  return banky
    .map((b) => ({ nazev: b.nazev, sazba: sazbaBankyProFixaci(b, fixace), ltvMax: b.ltv_max }))
    .filter((b): b is { nazev: string; sazba: number; ltvMax: number } => b.sazba !== null && b.ltvMax >= ltv)
    .sort((a, b) => a.sazba - b.sazba)
    .slice(0, limit)
    .map(({ nazev, sazba }) => ({ nazev, sazba }))
}

/** Nejnižší dostupná sazba pro danou fixaci a LTV — použije se pro odhad v kroku 1. */
export function nejnizsiSazba(banky: Banka[], fixace: Fixace, ltv: number): number | null {
  const nejlevnejsi = bankyProLTV(banky, fixace, ltv, 1)
  return nejlevnejsi.length > 0 ? nejlevnejsi[0].sazba : null
}

export interface OrientacniUspora {
  splatkaPriPrumerneSazbe: number
  splatkaPriVyjednavaneSazbe: number
  usporaMesicne: number
  usporaZaFixaci: number
}

/**
 * Orientační úspora: rozdíl splátky při průměrné nabídkové sazbě z trhu
 * vs. sazbě, kterou poradce reálně vyjednává. Nikdy neprezentovat jako slib.
 */
export function vypocitejOrientacniUsporu(jistina: number, roky: number, fixaceRoky: Fixace): OrientacniUspora {
  const priPrumeru = vypocitejAnuitu(jistina, sazby.prumerna_nabidkova_sazba, roky)
  const priVyjednane = vypocitejAnuitu(jistina, sazby.sazba_kterou_vyjednavam, roky)
  const mesicuVeFixaci = fixaceRoky * 12

  return {
    splatkaPriPrumerneSazbe: priPrumeru.splatka,
    splatkaPriVyjednavaneSazbe: priVyjednane.splatka,
    usporaMesicne: priPrumeru.splatka - priVyjednane.splatka,
    usporaZaFixaci: (priPrumeru.splatka - priVyjednane.splatka) * mesicuVeFixaci,
  }
}

export interface RozpetiSazeb {
  nejnizsiSazba: number
  nejvyssiSazba: number
  rozdilMesicne: number
  rozdilZaFixaci: number
}

/**
 * Rozdíl mezi nejlevnější a nejdražší bankou z veřejných sazebníků pro dané
 * LTV a fixaci — reálná, ověřitelná čísla (ne slib úspory), použitelné jako
 * ukazatel toho, že "vybrat si banku naslepo" může vyjít výrazně dráž.
 * Vrací null, pokud pro dané LTV vyhovují míň než 2 banky (není co srovnávat).
 */
export function vypocitejRozpetiSazeb(banky: Banka[], fixace: Fixace, ltv: number, jistina: number, roky: number): RozpetiSazeb | null {
  const vyhovujici = bankyProLTV(banky, fixace, ltv, banky.length)
  if (vyhovujici.length < 2) return null

  const nejnizsi = vyhovujici[0].sazba
  const nejvyssi = vyhovujici[vyhovujici.length - 1].sazba
  const priNejnizsi = vypocitejAnuitu(jistina, nejnizsi, roky)
  const priNejvyssi = vypocitejAnuitu(jistina, nejvyssi, roky)
  const mesicuVeFixaci = fixace * 12

  return {
    nejnizsiSazba: nejnizsi,
    nejvyssiSazba: nejvyssi,
    rozdilMesicne: priNejvyssi.splatka - priNejnizsi.splatka,
    rozdilZaFixaci: (priNejvyssi.splatka - priNejnizsi.splatka) * mesicuVeFixaci,
  }
}

/** Formátování částky česky: mezera jako oddělovač tisíců, Kč za číslem. */
export function formatujKc(castka: number): string {
  return `${formatujCislo(castka)} Kč`
}

/** Formátování celého čísla česky (mezera jako oddělovač tisíců, bez desetin). */
export function formatujCislo(cislo: number): string {
  // toLocaleString vrací pro cs-CZ jako oddělovač tisíců NBSP/úzkou NBSP —
  // sjednotíme na běžnou mezeru kvůli kopírování textu a předvídatelnému renderu.
  return Math.round(cislo)
    .toLocaleString('cs-CZ')
    .replace(/[  ]/g, ' ')
}

/** Formátování procent česky (desetinná čárka). */
export function formatujProcenta(cislo: number, desetinnaMista = 1): string {
  return `${cislo.toLocaleString('cs-CZ', { minimumFractionDigits: desetinnaMista, maximumFractionDigits: desetinnaMista })} %`
}

/** Formátování velkých částek zkráceně (mil.) pro kompaktní zobrazení v kartách. */
export function formatujKcZkracene(castka: number): string {
  const miliony = castka / 1_000_000
  return `${miliony.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} mil. Kč`
}
