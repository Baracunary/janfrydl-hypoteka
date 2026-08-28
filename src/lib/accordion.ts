// FAQ accordion — přístupné přes native <details>/<summary>, JS jen doplňuje
// volitelné "zavřít ostatní při otevření" chování pro přehlednost na mobilu.

export function inicializujAccordion(): void {
  const polozky = document.querySelectorAll<HTMLDetailsElement>('[data-accordion] details')

  for (const polozka of polozky) {
    polozka.addEventListener('toggle', () => {
      if (!polozka.open) return
      for (const ostatni of polozky) {
        if (ostatni !== polozka) ostatni.open = false
      }
    })
  }
}
