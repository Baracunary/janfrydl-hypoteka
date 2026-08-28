// Šipky pro rolování karuselu s recenzemi — nutné hlavně na desktopu s myší,
// kde vodorovný scroll gestem (touch/trackpad) není k dispozici.

export function inicializujRecenzeCarousel(): void {
  const tlacitkaPrev = document.querySelectorAll<HTMLButtonElement>('[data-carousel-prev]')
  const tlacitkaNext = document.querySelectorAll<HTMLButtonElement>('[data-carousel-next]')

  function posun(idKaruselu: string, smer: 1 | -1) {
    const carousel = document.getElementById(idKaruselu)
    if (!carousel) return
    const prvniKarta = carousel.querySelector<HTMLElement>('article')
    const mezera = 12 // odpovídá gap-3 v Tailwindu
    const krok = prvniKarta ? prvniKarta.offsetWidth + mezera : carousel.clientWidth * 0.8
    carousel.scrollBy({ left: smer * krok, behavior: 'smooth' })
  }

  for (const btn of tlacitkaPrev) {
    btn.addEventListener('click', () => posun(btn.dataset.carouselPrev!, -1))
  }
  for (const btn of tlacitkaNext) {
    btn.addEventListener('click', () => posun(btn.dataset.carouselNext!, 1))
  }
}
