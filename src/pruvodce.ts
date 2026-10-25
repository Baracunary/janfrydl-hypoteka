import './style.css'
import { SCENAR, CHYBY } from './content/pruvodce-scenar'
import { PrehravacPruvodce } from './lib/prehravac'
import { inicializujCookieListu } from './lib/cookie-lista'

inicializujCookieListu()

// ─── Přehrávač ────────────────────────────────────────────────────────────────
const prehravacEl = document.getElementById('pruvodce-prehravac')
if (prehravacEl) {
  const p = new PrehravacPruvodce(prehravacEl, SCENAR)
  p.mount()
}

// ─── Psaná verze 7 chyb ───────────────────────────────────────────────────────
const chybyObal = document.getElementById('pruvodce-chyby')
if (chybyObal) {
  chybyObal.innerHTML = CHYBY.map((s) => {
    const cislo = s.id.slice(1)
    return `
      <div class="pruvodce-chyba">
        <div class="pruvodce-chyba-cislo" aria-hidden="true">${cislo}</div>
        <div>
          <h3 class="pruvodce-chyba-nadpis">${s.title.replace(/^\d+\.\s*/, '')}</h3>
          <p class="pruvodce-chyba-vo">${s.vo}</p>
        </div>
      </div>`
  }).join('')
}

// ─── Checklist — přepínání záložek ────────────────────────────────────────────
function initChecklist(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-checklist-tab]')
  const panels = document.querySelectorAll<HTMLElement>('[data-checklist-panel]')

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-checklist-tab')!
      tabs.forEach((t) => {
        t.setAttribute('aria-selected', String(t.getAttribute('data-checklist-tab') === target))
      })
      panels.forEach((p) => {
        const show = p.getAttribute('data-checklist-panel') === target
        p.hidden = !show
      })
    })
  })

  // Checkboxy — uložit do localStorage (try/catch)
  const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-checklist-item]')
  const STORAGE_KEY = 'jf_checklist_stav'

  function nactiStav(): Record<string, boolean> {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
  }
  function ulozStav(stav: Record<string, boolean>): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stav)) } catch { /* noop */ }
  }

  const stav = nactiStav()
  checkboxes.forEach((cb) => {
    const id = cb.getAttribute('data-checklist-item')!
    if (stav[id] !== undefined) cb.checked = stav[id]
    cb.addEventListener('change', () => {
      const aktualni = nactiStav()
      aktualni[id] = cb.checked
      ulozStav(aktualni)
    })
  })
}

initChecklist()

// ─── Tisk ─────────────────────────────────────────────────────────────────────
const btnPdf = document.getElementById('btn-tisk')
if (btnPdf) {
  btnPdf.addEventListener('click', () => window.print())
}
