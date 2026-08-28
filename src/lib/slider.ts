// Malý pomocník pro range input: drží ho v páru s číselným polem (pokud existuje),
// nastavuje český aria-valuetext a hlídá reduced-motion přátelský přechod čísla.

export interface PripojeniSlideru {
  nastavHodnotu: (hodnota: number) => void
  nastavRozsah: (min: number, max: number) => void
}

export interface VolbySlideru {
  input: HTMLInputElement
  vstupCislo?: HTMLInputElement | null
  pocatecniHodnota: number
  /** Text pro čtečky obrazovky, např. "5 500 000 korun". */
  formatujValuetext: (hodnota: number) => string
  /** Zavolá se při každé změně (drag i klávesnice) s validovanou hodnotou. */
  onZmena: (hodnota: number) => void
}

export function pripojSlider(volby: VolbySlideru): PripojeniSlideru {
  const { input, vstupCislo, formatujValuetext, onZmena } = volby

  function aplikuj(hodnota: number, zdroj: 'slider' | 'cislo') {
    const min = Number(input.min)
    const max = Number(input.max)
    const orezano = Math.min(max, Math.max(min, hodnota))

    if (zdroj === 'cislo') input.value = String(orezano)
    input.setAttribute('aria-valuetext', formatujValuetext(orezano))
    if (vstupCislo && zdroj === 'slider') vstupCislo.value = String(orezano)

    onZmena(orezano)
  }

  input.addEventListener('input', () => aplikuj(Number(input.value), 'slider'))

  if (vstupCislo) {
    vstupCislo.addEventListener('change', () => aplikuj(Number(vstupCislo.value), 'cislo'))
  }

  aplikuj(volby.pocatecniHodnota, 'slider')

  return {
    nastavHodnotu(hodnota) {
      input.value = String(hodnota)
      aplikuj(hodnota, 'slider')
    },
    nastavRozsah(min, max) {
      input.min = String(min)
      input.max = String(max)
      if (Number(input.value) > max) aplikuj(max, 'slider')
    },
  }
}
