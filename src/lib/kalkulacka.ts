// Orchestrace hypoteční kalkulačky: dva režimy (koupě / refinancování),
// živý přepočet bez tlačítka, LTV upozornění navázané na CTA.

import {
  vypocitejAnuitu,
  vypocitejLTV,
  limitLTV,
  nejnizsiSazba,
  vypocitejRozpetiSazeb,
  sazby,
  formatujKc,
  formatujCislo,
  formatujProcenta,
  type Fixace,
  type UcelUveru,
} from './hypoteka'
import { pripojSlider } from './slider'
import { trackViewContent, trackCalcStart, trackCalcResult } from './analytics'

// Nastav na true až bude /fixace funnel sloučen zpět do hlavní stránky.
const SHOW_FIXACE_MODE = false

export type Rezim = 'koupe' | 'refinancovani'

export interface KalkulackaStav {
  rezim: Rezim
  cena: number
  vlastniZdroje: number
  uver: number
  roky: number
  fixace: Fixace
  ltv: number
  splatka: number
  do36: boolean
  ucel: UcelUveru
  ltvNadLimit: boolean
  refi?: {
    soucasnaSazba: number
    zbyvajiciDoba: number
    kdyKonciFixace: string
  }
}

let aktualniStav: KalkulackaStav = {
  rezim: 'koupe',
  cena: 5_500_000,
  vlastniZdroje: 1_100_000,
  uver: 4_400_000,
  roky: 25,
  fixace: 3,
  ltv: 80,
  splatka: 0,
  do36: false,
  ucel: 'vlastni_bydleni',
  ltvNadLimit: false,
}

export function ziskejAktualniStav(): KalkulackaStav {
  return aktualniStav
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const nalezeny = document.getElementById(id)
  if (!nalezeny) throw new Error(`Element #${id} nebyl v DOM nalezen.`)
  return nalezeny as T
}

// Volitelná verze — vrátí null místo výjimky (pro elementy závislé na SHOW_FIXACE_MODE).
function elOpt<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}

let prvniInterakce = false
let calcResultTracked = false

function oznacInterakci() {
  if (!prvniInterakce) {
    prvniInterakce = true
    trackViewContent()
    trackCalcStart()
    window.dispatchEvent(new CustomEvent('jf:calc-interakce'))
  }
}

export function inicializujKalkulacku(): void {
  // --- Vyhledání všech DOM elementů napřed — pripojSlider() níže volá onZmena
  // synchronně už při inicializaci, takže prepocitej() musí mít vše připravené
  // dřív, než se poprvé zavolá (jinak by šlo o přístup k proměnné před inicializací). ---

  const tabKoupe = elOpt<HTMLButtonElement>('tab-koupe')
  const tabRefi = elOpt<HTMLButtonElement>('tab-refi')
  const panelKoupe = el('panel-koupe')
  const panelRefi = elOpt('panel-refi')
  const rezimTabs = elOpt('rezim-tabs')

  // Skrýt přepínač režimů, pokud je deaktivován fixace mode
  if (!SHOW_FIXACE_MODE && rezimTabs) {
    rezimTabs.hidden = true
  }

  const cenaSlider = el<HTMLInputElement>('cena-slider')
  const cenaInput = el<HTMLInputElement>('cena-input')
  const zdrojeSlider = el<HTMLInputElement>('zdroje-slider')
  const zdrojeInput = el<HTMLInputElement>('zdroje-input')
  const zdrojeProcenta = el('zdroje-procenta')
  const rokySlider = el<HTMLInputElement>('roky-slider')
  const rokyHodnota = el('roky-hodnota')
  const do36Toggle = el<HTMLInputElement>('do36-toggle')
  const ucelSelect = el<HTMLSelectElement>('ucel-select')
  const fixaceTlacitka = Array.from(document.querySelectorAll<HTMLButtonElement>('#fixace-group [data-fixace]'))

  // Refi elementy jsou volitelné — přítomny jen když SHOW_FIXACE_MODE=true
  const refiZbyvaSlider = elOpt<HTMLInputElement>('refi-zbyva-slider')
  const refiZbyvaInput = elOpt<HTMLInputElement>('refi-zbyva-input')
  const refiSazbaSlider = elOpt<HTMLInputElement>('refi-sazba-slider')
  const refiSazbaInput = elOpt<HTMLInputElement>('refi-sazba-input')
  const refiDobaSlider = elOpt<HTMLInputElement>('refi-doba-slider')
  const refiDobaHodnota = elOpt('refi-doba-hodnota')
  const refiFixaceKonciSelect = elOpt<HTMLSelectElement>('refi-fixace-konci-select')

  const vysledekSplatka = el('vysledek-splatka')
  const vysledekUver = el('vysledek-uver')
  const vysledekCelkem = el('vysledek-celkem')
  const vysledekUroky = el('vysledek-uroky')
  const vysledekSazbaInfo = el('vysledek-sazba-info')
  const radekLtv = el('radek-ltv')
  const radekRefi = elOpt('radek-refi')
  const ltvHodnota = el('ltv-hodnota')
  const ltvStav = el('ltv-stav')
  const ltvUpozorneni = el('ltv-upozorneni')
  const ltvUpozorneniText = el('ltv-upozorneni-text')
  const refiSplatkaSoucasna = elOpt('refi-splatka-soucasna')
  const refiRozdil = elOpt('refi-rozdil')
  const gateHookText = elOpt('gate-hook-text')
  // Řádek modelové úspory 0,5 p.b. — nový element v index.html
  const usporaText = elOpt('uspora-text')
  const radekUspora = elOpt('radek-uspora')

  let refiStav = {
    zbyvaDoplatit: 3_200_000,
    soucasnaSazba: 2.29,
    zbyvajiciDoba: 22,
    kdyKonciFixace: '3-6',
  }

  // Loss-aversion hák nad gate formulářem
  function aktualizujGateHook(jistina: number, fixace: Fixace, ltv: number, roky: number) {
    if (!gateHookText) return
    const rozpeti = jistina > 0 ? vypocitejRozpetiSazeb(sazby.banky, fixace, ltv, jistina, roky) : null
    gateHookText.textContent =
      rozpeti && rozpeti.rozdilZaFixaci > 0
        ? `Podle veřejných sazebníků je u úvěru ${formatujKc(jistina)} rozdíl mezi nejlevnější a nejdražší bankou až ${formatujKc(rozpeti.rozdilZaFixaci)} na úrocích za dobu ${fixace}leté fixace.`
        : `Rozdíly mezi bankami umí být i u stejné hypotéky překvapivě velké.`
  }

  // Modelová úspora při rozdílu 0,5 p.b. — zobrazí se pod výsledkem splátky
  function aktualizujUsporuRadek(jistina: number, sazba: number, roky: number, fixace: Fixace) {
    if (!usporaText || !radekUspora) return
    if (jistina <= 0) {
      radekUspora.hidden = true
      return
    }
    const sazbaVyssi = sazba + 0.5
    const { splatka: splatkaBase } = vypocitejAnuitu(jistina, sazba, roky)
    const { splatka: splatkaBanka } = vypocitejAnuitu(jistina, sazbaVyssi, roky)
    const rozdilMesicne = Math.round(splatkaBanka - splatkaBase)
    const rozdilZaFixaci = Math.round(rozdilMesicne * fixace * 12)
    radekUspora.hidden = false
    usporaText.textContent =
      `U běžné nabídky banky bývá sazba vyšší. Rozdíl 0,5 p. b. u vašeho úvěru dělá cca ${formatujKc(rozdilMesicne)} měsíčně a ${formatujKc(rozdilZaFixaci)} za celou fixaci. (modelový výpočet)`
  }

  // --- Přepočet + render výsledku ---
  function prepocitej() {
    if (aktualniStav.rezim === 'koupe') {
      const jistina = Math.max(0, aktualniStav.cena - aktualniStav.vlastniZdroje)
      const ltv = vypocitejLTV(aktualniStav.cena, aktualniStav.vlastniZdroje)
      const limit = limitLTV(aktualniStav.ucel, aktualniStav.do36)
      const sazba = nejnizsiSazba(sazby.banky, aktualniStav.fixace, ltv) ?? sazby.prumerna_nabidkova_sazba
      const { splatka, celkemZaplaceno, uroky } = vypocitejAnuitu(jistina, sazba, aktualniStav.roky)

      aktualniStav.uver = jistina
      aktualniStav.ltv = ltv
      aktualniStav.splatka = splatka

      vysledekSplatka.textContent = formatujCislo(splatka)
      vysledekUver.textContent = formatujKc(jistina)
      vysledekCelkem.textContent = formatujKc(celkemZaplaceno)
      vysledekUroky.textContent = formatujKc(uroky)
      vysledekSazbaInfo.textContent = `orientačně při sazbě ${formatujProcenta(sazba, 2)} p.a. (${aktualniStav.fixace}letá fixace)`

      radekLtv.hidden = false
      if (radekRefi) radekRefi.hidden = true

      ltvHodnota.textContent = formatujProcenta(ltv, 0)
      const vLimitu = ltv <= limit
      ltvStav.textContent = vLimitu ? `v limitu ČNB (max. ${limit} %)` : `nad limitem ČNB (max. ${limit} %)`
      ltvStav.dataset.stav = vLimitu ? 'ok' : 'warning'
      aktualniStav.ltvNadLimit = !vLimitu

      if (vLimitu) {
        ltvUpozorneni.hidden = true
      } else {
        ltvUpozorneni.hidden = false
        const pozadovanoProcent = Math.round(100 - limit)
        ltvUpozorneniText.textContent = `Nemáte ${pozadovanoProcent} % vlastních zdrojů? Nezoufejte, nemusí to být konec. Dejte mi vědět přes formulář níže a zkusíme to vymyslet jinak.`
      }

      aktualizujGateHook(jistina, aktualniStav.fixace, ltv, aktualniStav.roky)
      aktualizujUsporuRadek(jistina, sazba, aktualniStav.roky, aktualniStav.fixace)
    } else {
      const jistina = refiStav.zbyvaDoplatit
      const soucasna = vypocitejAnuitu(jistina, refiStav.soucasnaSazba, refiStav.zbyvajiciDoba)
      const noveSazba = nejnizsiSazba(sazby.banky, 3, 80) ?? sazby.prumerna_nabidkova_sazba
      const nova = vypocitejAnuitu(jistina, noveSazba, refiStav.zbyvajiciDoba)

      aktualniStav.uver = jistina
      aktualniStav.ltv = 0
      aktualniStav.splatka = nova.splatka
      aktualniStav.roky = refiStav.zbyvajiciDoba
      aktualniStav.fixace = 3
      aktualniStav.ltvNadLimit = false
      aktualniStav.refi = { ...refiStav }

      vysledekSplatka.textContent = formatujCislo(nova.splatka)
      vysledekUver.textContent = formatujKc(jistina)
      vysledekCelkem.textContent = formatujKc(nova.celkemZaplaceno)
      vysledekUroky.textContent = formatujKc(nova.uroky)
      vysledekSazbaInfo.textContent = `orientačně při sazbě ${formatujProcenta(noveSazba, 2)} p.a. (3letá fixace)`

      radekLtv.hidden = true
      if (radekRefi) radekRefi.hidden = false
      ltvUpozorneni.hidden = true

      if (refiSplatkaSoucasna)
        refiSplatkaSoucasna.textContent = `${formatujKc(soucasna.splatka)} / měsíc při současné sazbě ${formatujProcenta(refiStav.soucasnaSazba, 2)}`
      if (refiRozdil) {
        const rozdil = soucasna.splatka - nova.splatka
        refiRozdil.textContent =
          rozdil > 0
            ? `Nová sazba by mohla splátku snížit o ${formatujKc(rozdil)} / měsíc.`
            : `Nová tržní sazba je aktuálně vyšší, o ${formatujKc(Math.abs(rozdil))} / měsíc. Přesto se vyplatí srovnat všechny banky, ne jen tu vaši současnou.`
      }

      aktualizujGateHook(jistina, 3, 80, refiStav.zbyvajiciDoba)
      if (radekUspora) radekUspora.hidden = true
    }

    // calc_result: odeslat jednou po první uživatelské interakci
    if (prvniInterakce && !calcResultTracked) {
      calcResultTracked = true
      trackCalcResult({
        ltv_pasmo: aktualniStav.ltv <= 80 ? 'do_80' : aktualniStav.ltv <= 90 ? '80_90' : 'nad_90',
        uver_pasmo: aktualniStav.uver < 3_000_000 ? 'do_3M' : aktualniStav.uver <= 5_000_000 ? '3_5M' : 'nad_5M',
        fixace: aktualniStav.fixace,
      })
    }
  }

  // --- Přepínač režimů ---
  function nastavRezim(rezim: Rezim) {
    aktualniStav.rezim = rezim
    const jeKoupe = rezim === 'koupe'
    panelKoupe.hidden = !jeKoupe
    if (panelRefi) panelRefi.hidden = jeKoupe
    if (tabKoupe) tabKoupe.setAttribute('aria-selected', String(jeKoupe))
    if (tabRefi) tabRefi.setAttribute('aria-selected', String(!jeKoupe))
    prepocitej()
  }

  if (tabKoupe) tabKoupe.addEventListener('click', () => nastavRezim('koupe'))
  if (tabRefi) tabRefi.addEventListener('click', () => nastavRezim('refinancovani'))

  // --- Pole: koupě nemovitosti ---
  function maxZdroje(): number {
    return Math.max(0, Math.floor((aktualniStav.cena * 0.9) / 50_000) * 50_000)
  }

  function aktualizujZdrojeProcenta() {
    zdrojeProcenta.textContent = formatujProcenta((aktualniStav.vlastniZdroje / aktualniStav.cena) * 100, 0)
  }

  const ovladaniZdroje = pripojSlider({
    input: zdrojeSlider,
    vstupCislo: zdrojeInput,
    pocatecniHodnota: aktualniStav.vlastniZdroje,
    formatujValuetext: (v) => `${formatujCislo(v)} korun, ${formatujProcenta((v / aktualniStav.cena) * 100, 0)}`,
    onZmena: (v) => {
      aktualniStav.vlastniZdroje = v
      aktualizujZdrojeProcenta()
      oznacInterakci()
      prepocitej()
    },
  })

  pripojSlider({
    input: cenaSlider,
    vstupCislo: cenaInput,
    pocatecniHodnota: aktualniStav.cena,
    formatujValuetext: (v) => `${formatujCislo(v)} korun`,
    onZmena: (v) => {
      aktualniStav.cena = v
      const max = maxZdroje()
      ovladaniZdroje.nastavRozsah(0, max)
      if (aktualniStav.vlastniZdroje > max) aktualniStav.vlastniZdroje = max
      aktualizujZdrojeProcenta()
      oznacInterakci()
      prepocitej()
    },
  })
  ovladaniZdroje.nastavRozsah(0, maxZdroje())
  aktualizujZdrojeProcenta()

  pripojSlider({
    input: rokySlider,
    pocatecniHodnota: aktualniStav.roky,
    formatujValuetext: (v) => `${v} let`,
    onZmena: (v) => {
      aktualniStav.roky = v
      rokyHodnota.textContent = `${v} let`
      oznacInterakci()
      prepocitej()
    },
  })

  function nastavFixaci(fixace: Fixace) {
    aktualniStav.fixace = fixace
    for (const btn of fixaceTlacitka) {
      const jeAktivni = Number(btn.dataset.fixace) === fixace
      btn.setAttribute('aria-pressed', String(jeAktivni))
    }
    prepocitej()
  }
  for (const btn of fixaceTlacitka) {
    btn.addEventListener('click', () => {
      oznacInterakci()
      nastavFixaci(Number(btn.dataset.fixace) as Fixace)
    })
  }

  do36Toggle.addEventListener('change', () => {
    aktualniStav.do36 = do36Toggle.checked
    oznacInterakci()
    prepocitej()
  })

  ucelSelect.addEventListener('change', () => {
    aktualniStav.ucel = ucelSelect.value as UcelUveru
    oznacInterakci()
    prepocitej()
  })

  // --- Pole: refinancování (jen pokud jsou přítomna v DOM) ---
  if (refiZbyvaSlider && refiZbyvaInput) {
    pripojSlider({
      input: refiZbyvaSlider,
      vstupCislo: refiZbyvaInput,
      pocatecniHodnota: refiStav.zbyvaDoplatit,
      formatujValuetext: (v) => `${formatujCislo(v)} korun`,
      onZmena: (v) => {
        refiStav.zbyvaDoplatit = v
        oznacInterakci()
        prepocitej()
      },
    })
  }

  if (refiSazbaSlider && refiSazbaInput) {
    pripojSlider({
      input: refiSazbaSlider,
      vstupCislo: refiSazbaInput,
      pocatecniHodnota: refiStav.soucasnaSazba,
      formatujValuetext: (v) => formatujProcenta(v, 2),
      onZmena: (v) => {
        refiStav.soucasnaSazba = v
        oznacInterakci()
        prepocitej()
      },
    })
  }

  if (refiDobaSlider && refiDobaHodnota) {
    pripojSlider({
      input: refiDobaSlider,
      pocatecniHodnota: refiStav.zbyvajiciDoba,
      formatujValuetext: (v) => `${v} let`,
      onZmena: (v) => {
        refiStav.zbyvajiciDoba = v
        refiDobaHodnota.textContent = `${v} let`
        oznacInterakci()
        prepocitej()
      },
    })
  }

  if (refiFixaceKonciSelect) {
    refiFixaceKonciSelect.addEventListener('change', () => {
      refiStav.kdyKonciFixace = refiFixaceKonciSelect.value
      prepocitej()
    })
  }

  nastavRezim('koupe')
  nastavFixaci(3)
  prepocitej()
}
