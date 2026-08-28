import { describe, it, expect } from 'vitest'
import {
  vypocitejAnuitu,
  vypocitejLTV,
  limitLTV,
  bankyProLTV,
  nejnizsiSazba,
  vypocitejOrientacniUsporu,
  vypocitejRozpetiSazeb,
  formatujKc,
  formatujCislo,
  formatujProcenta,
} from './hypoteka'

describe('vypocitejAnuitu', () => {
  it('odpovídá referenční hodnotě z Hypoindexu (3,5 mil. Kč, 25 let, 5,42 % ≈ 21 327 Kč)', () => {
    const { splatka } = vypocitejAnuitu(3_500_000, 5.42, 25)
    expect(splatka).toBe(21_327)
  })

  it('celkem zaplaceno a úroky navazují na splátku', () => {
    const { splatka, celkemZaplaceno, uroky } = vypocitejAnuitu(3_500_000, 5.42, 25)
    expect(celkemZaplaceno).toBe(splatka * 25 * 12)
    expect(uroky).toBe(celkemZaplaceno - 3_500_000)
  })

  it('ošetřuje nulovou úrokovou sazbu (lineární splácení jistiny)', () => {
    const { splatka, uroky } = vypocitejAnuitu(1_200_000, 0, 10)
    expect(splatka).toBe(10_000)
    expect(uroky).toBe(0)
  })

  it('zaokrouhluje splátku na celé koruny nahoru', () => {
    const { splatka } = vypocitejAnuitu(1_000_000, 4.99, 20)
    expect(Number.isInteger(splatka)).toBe(true)
  })
})

describe('vypocitejLTV', () => {
  it('spočítá LTV jako podíl úvěru na ceně', () => {
    expect(vypocitejLTV(5_000_000, 1_000_000)).toBeCloseTo(80, 5)
  })

  it('vrátí 0 při nulové ceně (ochrana proti dělení nulou)', () => {
    expect(vypocitejLTV(0, 0)).toBe(0)
  })
})

describe('limitLTV', () => {
  it('vlastní bydlení, 36+ let: 80 %', () => {
    expect(limitLTV('vlastni_bydleni', false)).toBe(80)
  })
  it('vlastní bydlení, do 36 let: 90 %', () => {
    expect(limitLTV('vlastni_bydleni', true)).toBe(90)
  })
  it('investice: 70 % bez ohledu na věk', () => {
    expect(limitLTV('investice', true)).toBe(70)
    expect(limitLTV('investice', false)).toBe(70)
  })
})

describe('bankyProLTV a nejnizsiSazba', () => {
  it('vyfiltruje banky, které při 90% LTV neumožňují financování', () => {
    const vysledek = bankyProLTV(
      [
        { nazev: 'A', fix3: 5.0, fix1: null, fix5: null, ltv_max: 80 },
        { nazev: 'B', fix3: 5.2, fix1: null, fix5: null, ltv_max: 90 },
      ],
      3,
      90,
    )
    expect(vysledek).toEqual([{ nazev: 'B', sazba: 5.2 }])
  })

  it('seřadí banky od nejlevnější', () => {
    const vysledek = bankyProLTV(
      [
        { nazev: 'Dražší', fix3: 5.5, fix1: null, fix5: null, ltv_max: 80 },
        { nazev: 'Levnější', fix3: 4.8, fix1: null, fix5: null, ltv_max: 80 },
      ],
      3,
      80,
    )
    expect(vysledek[0].nazev).toBe('Levnější')
  })

  it('nejnizsiSazba vrátí null, když žádná banka nevyhoví', () => {
    expect(nejnizsiSazba([{ nazev: 'A', fix3: 5.0, fix1: null, fix5: null, ltv_max: 70 }], 3, 90)).toBeNull()
  })
})

describe('vypocitejOrientacniUsporu', () => {
  it('rozdíl mezi průměrnou a vyjednávanou sazbou je nezáporný (vyjednaná je vždy levnější)', () => {
    const { usporaMesicne, usporaZaFixaci } = vypocitejOrientacniUsporu(4_000_000, 25, 5)
    expect(usporaMesicne).toBeGreaterThan(0)
    expect(usporaZaFixaci).toBe(usporaMesicne * 60)
  })
})

describe('vypocitejRozpetiSazeb', () => {
  it('spočítá rozdíl mezi nejlevnější a nejdražší bankou pro dané LTV', () => {
    const banky = [
      { nazev: 'Levná', fix3: 4.5, fix1: null, fix5: null, ltv_max: 80 },
      { nazev: 'Drahá', fix3: 5.5, fix1: null, fix5: null, ltv_max: 80 },
    ]
    const vysledek = vypocitejRozpetiSazeb(banky, 3, 80, 4_000_000, 25)
    expect(vysledek).not.toBeNull()
    expect(vysledek!.nejnizsiSazba).toBe(4.5)
    expect(vysledek!.nejvyssiSazba).toBe(5.5)
    expect(vysledek!.rozdilMesicne).toBeGreaterThan(0)
    expect(vysledek!.rozdilZaFixaci).toBe(vysledek!.rozdilMesicne * 36)
  })

  it('vrátí null, když pro dané LTV vyhovuje míň než 2 banky', () => {
    const banky = [{ nazev: 'A', fix3: 5.0, fix1: null, fix5: null, ltv_max: 70 }]
    expect(vypocitejRozpetiSazeb(banky, 3, 90, 4_000_000, 25)).toBeNull()
  })
})

describe('formátování čísel v českém formátu', () => {
  it('formatujKc přidá mezery jako oddělovač tisíců a Kč', () => {
    expect(formatujKc(5500000)).toBe('5 500 000 Kč')
  })

  it('formatujCislo zaokrouhlí a oddělí tisíce mezerou', () => {
    expect(formatujCislo(21326.5)).toBe('21 327')
  })

  it('formatujProcenta použije desetinnou čárku', () => {
    expect(formatujProcenta(4.58)).toBe('4,6 %')
    expect(formatujProcenta(4.58, 2)).toBe('4,58 %')
  })
})
