// Sticky CTA lišta na mobilu — objeví se, jakmile hero sekce zmizí z viewportu.

export function inicializujStickyCta(): void {
  const hero = document.getElementById('hero')
  const lista = document.getElementById('sticky-cta')
  if (!hero || !lista) return

  const pozorovatel = new IntersectionObserver(
    ([zaznam]) => {
      lista.classList.toggle('translate-y-full', zaznam.isIntersecting)
      lista.classList.toggle('translate-y-0', !zaznam.isIntersecting)
    },
    { threshold: 0 },
  )

  pozorovatel.observe(hero)
}
