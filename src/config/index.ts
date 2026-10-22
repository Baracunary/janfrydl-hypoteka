// Centrální konfigurace webu — čísla a URL, která se mění nezávisle na designu.
// Jedna změna zde se projeví na celém webu.

export const bookingUrl = 'https://calendar.app.google/pX6djR7KPxPxVg9m8'

export const kontakt = {
  telefon: '+420731444770',
  telefonZobrazeny: '731 444 770',
  email: 'jan.frydl@4fin.cz',
  instagram: 'https://www.instagram.com/jan_frydl',
} as const

// Texty, které Jan musí doplnit nebo odsouhlasit. Označeny [DOPLNIT].
export const fixaceFunnel = {
  // Hero nadpis — číslo úspory doplnit po konzultaci s Janem.
  usporaRocne: '[DOPLNIT: např. „až 30 000 Kč"]',

  // Tři body z videa — tematické okruhy doplnit s Janem.
  tajemstvi: [
    '[DOPLNIT: 1. tajemství z videa — např. „Kdy přesně začít jednat (a proč 4 měsíce nestačí)"]',
    '[DOPLNIT: 2. tajemství z videa — např. „Jak výše LTV ovlivňuje sazbu, kterou dostanete"]',
    '[DOPLNIT: 3. tajemství z videa — např. „Délka fixace a mimořádné splátky: co vychází líp"]',
  ],

  // URL videa — vložit po nahrání (YouTube unlisted / Vimeo / Bunny).
  videoUrl: '[DOPLNIT: URL videa]',
} as const
