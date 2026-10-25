export interface Scena {
  id: string
  doba: number
  title: string
  vo: string
  audioStart?: number
}

export const SCENAR: Scena[] = [
  {
    id: 's0',
    doba: 5,
    title: 'Hypotéka na desítky let.',
    vo: 'Hypotéka je závazek na desítky let. Jedna chyba v sazbě může stát i stovky tisíc korun. Tady je sedm nejčastějších.',
    audioStart: 0,
  },
  {
    id: 's1',
    doba: 7,
    title: '1. Podepsat první nabídku',
    vo: 'Chyba číslo jedna: podepsat první nabídku. Banky se v sazbách liší a půl procentního bodu dělá u čtyř milionů na 25 let zhruba 1 200 korun měsíčně.',
    audioStart: 5,
  },
  {
    id: 's2',
    doba: 7,
    title: '2. Dívat se jen na sazbu',
    vo: 'Dvě: dívat se jen na sazbu. Rozhoduje celkový náklad, tedy poplatky, pojištění a produkty, které banka k nabídce přidá.',
    audioStart: 12,
  },
  {
    id: 's3',
    doba: 7,
    title: '3. Vybrat fixaci bez rozmyslu',
    vo: 'Tři: zvolit fixaci bez rozmyslu. Kratší i delší fixace má své riziko. Vybírá se podle vaší situace, ne podle toho, co je zrovna v akci.',
    audioStart: 19,
  },
  {
    id: 's4',
    doba: 7,
    title: '4. Nechat to na poslední chvíli',
    vo: 'Čtyři: řešit to na poslední chvíli. S bankou je dobré začít čtyři až šest měsíců před koncem fixace, ať máte čas na srovnání.',
    audioStart: 26,
  },
  {
    id: 's5',
    doba: 7,
    title: '5. Počítat jen splátku',
    vo: 'Pět: počítat jen splátku. Přidejte odhad, pojištění, vklad do katastru, stěhování a rezervu pro případ, že se změní sazby.',
    audioStart: 33,
  },
  {
    id: 's6',
    doba: 7,
    title: '6. Zapomenout na drobné závazky',
    vo: 'Šest: zapomenout na drobné závazky. I nevyužité kreditní karty a povolená přečerpání mohou snížit částku, kterou vám banka půjčí.',
    audioStart: 40,
  },
  {
    id: 's7',
    doba: 7,
    title: '7. Málo vlastních zdrojů',
    vo: 'Sedm: spoléhat na malou zálohu. Banky standardně chtějí aspoň dvacet procent ceny a jen za určitých podmínek, třeba u mladších 36 let, někdy méně. Aktuální limity vždy ověřte.',
    audioStart: 47,
  },
  {
    id: 's8',
    doba: 10,
    title: 'Co si připravit',
    vo: 'Pro rychlé vyřízení si připravte doklady totožnosti, potvrzení o příjmech, výpisy z účtu, přehled závazků a smlouvu o koupi. Kompletní seznam je pod videem.',
    audioStart: 54,
  },
  {
    id: 's9',
    doba: 5,
    title: 'Nepodepisujte naslepo.',
    vo: 'Nepodepisujte naslepo. Zavolám vám do 24 hodin a projdeme vaši situaci.',
    audioStart: 64,
  },
]

export const CHYBY = SCENAR.filter((s) => s.id.startsWith('s') && parseInt(s.id.slice(1)) >= 1 && parseInt(s.id.slice(1)) <= 7)
