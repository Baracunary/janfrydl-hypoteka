import type { Scena } from '../content/pruvodce-scenar'

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ─── Vizuály jednotlivých scén ────────────────────────────────────────────────

function vizualS0(): string {
  return `
    <div class="prehr-vizual-s0">
      <div class="prehr-calendar" aria-hidden="true">
        <div class="prehr-cal-header">
          <span class="prehr-cal-rok">2024</span>
        </div>
        <div class="prehr-cal-grid">
          ${Array.from({length: 30}, (_, i) => `<span class="prehr-cal-den${i < 3 ? ' prehr-cal-den-done' : ''}">${i+1}</span>`).join('')}
        </div>
      </div>
      <div class="prehr-castka-obal">
        <span class="prehr-castka-label">Rozdíl za dobu splácení</span>
        <span class="prehr-castka" aria-label="až 350 000 Kč">≈ 350 000 Kč</span>
        <span class="prehr-castka-pozn">Modelový výpočet: 0,5 p.&nbsp;b. u úvěru 4 mil. Kč na 25 let</span>
      </div>
    </div>`
}

function vizualS1(): string {
  return `
    <div class="prehr-vizual-s1">
      <div class="prehr-banky">
        <div class="prehr-banka prehr-banka-1">
          <span class="prehr-banka-label">Banka A</span>
          <span class="prehr-banka-sazba">5,29&nbsp;%</span>
          <span class="prehr-banka-splatka">24 800 Kč/m</span>
        </div>
        <div class="prehr-banka prehr-banka-2 prehr-banka-best">
          <span class="prehr-banka-label">Banka B</span>
          <span class="prehr-banka-sazba">4,79&nbsp;%</span>
          <span class="prehr-banka-splatka">23 600 Kč/m</span>
        </div>
        <div class="prehr-banka prehr-banka-3">
          <span class="prehr-banka-label">Banka C</span>
          <span class="prehr-banka-sazba">5,09&nbsp;%</span>
          <span class="prehr-banka-splatka">24 300 Kč/m</span>
        </div>
      </div>
      <div class="prehr-rozdil-badge">−1 200 Kč/měs.</div>
    </div>`
}

function vizualS2(): string {
  return `
    <div class="prehr-vizual-s2">
      <div class="prehr-sazba-hero">4,79 %</div>
      <ul class="prehr-poplatky">
        <li class="prehr-poplatek prehr-poplatek-1">+ poplatek za vedení účtu</li>
        <li class="prehr-poplatek prehr-poplatek-2">+ pojištění nemovitosti</li>
        <li class="prehr-poplatek prehr-poplatek-3">+ pojištění schopnosti splácet</li>
        <li class="prehr-poplatek prehr-poplatek-4 prehr-poplatek-real">Reálný náklad: vyšší</li>
      </ul>
    </div>`
}

function vizualS3(): string {
  return `
    <div class="prehr-vizual-s3">
      <div class="prehr-fixace-os">
        <div class="prehr-fixace-linka"></div>
        <div class="prehr-fixace-body">
          <div class="prehr-fixace-bod prehr-fbd-1">
            <span class="prehr-fbd-label">1 rok</span>
            <span class="prehr-fbd-sublabel">Nižší sazba<br>Časté riziko</span>
          </div>
          <div class="prehr-fixace-bod prehr-fbd-3">
            <span class="prehr-fbd-label">3 roky</span>
            <span class="prehr-fbd-sublabel">Rovnováha</span>
          </div>
          <div class="prehr-fixace-bod prehr-fbd-5">
            <span class="prehr-fbd-label">5 let</span>
            <span class="prehr-fbd-sublabel">Jistota<br>Vyšší sazba</span>
          </div>
        </div>
        <div class="prehr-fixace-cursor" aria-hidden="true">▲</div>
      </div>
      <p class="prehr-fixace-pozn">Záleží na vaší situaci, ne na akci banky.</p>
    </div>`
}

function vizualS4(): string {
  return `
    <div class="prehr-vizual-s4">
      <div class="prehr-kalendar">
        ${Array.from({length: 12}, (_, i) => {
          const isWindow = i >= 4 && i <= 6
          return `<div class="prehr-mesic${isWindow ? ' prehr-mesic-ok' : i < 4 ? '' : ' prehr-mesic-pozde'}">${['Led','Úno','Bře','Dub','Kvě','Čer','Čvc','Srp','Zář','Říj','Lis','Pro'][i]}</div>`
        }).join('')}
      </div>
      <div class="prehr-kal-legenda">
        <span class="prehr-kal-ok-dot"></span> Ideální okno (4–6 měsíců)
      </div>
    </div>`
}

function vizualS5(): string {
  return `
    <div class="prehr-vizual-s5">
      <div class="prehr-naklady-obal">
        <div class="prehr-naklady-centrum">
          <span class="prehr-naklady-label">Splátka</span>
          <span class="prehr-naklady-hodnota">23 600 Kč</span>
        </div>
        <div class="prehr-naklady-ikona prehr-ni-1" aria-label="Odhad nemovitosti">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          <span>Odhad</span>
        </div>
        <div class="prehr-naklady-ikona prehr-ni-2" aria-label="Pojištění">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>Pojištění</span>
        </div>
        <div class="prehr-naklady-ikona prehr-ni-3" aria-label="Katastr">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>Katastr</span>
        </div>
        <div class="prehr-naklady-ikona prehr-ni-4" aria-label="Rezerva">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Rezerva</span>
        </div>
      </div>
    </div>`
}

function vizualS6(): string {
  return `
    <div class="prehr-vizual-s6">
      <div class="prehr-karta">
        <div class="prehr-karta-top">
          <span class="prehr-karta-chip" aria-hidden="true"></span>
          <span class="prehr-karta-label">Kreditní karta</span>
        </div>
        <div class="prehr-karta-limit">Limit: <strong>50 000 Kč</strong> <span class="prehr-karta-note">(nevyužito)</span></div>
      </div>
      <div class="prehr-bonita-obal">
        <span class="prehr-bonita-label">Bonita v očích banky</span>
        <div class="prehr-bonita-bar" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
          <div class="prehr-bonita-fill"></div>
        </div>
        <span class="prehr-bonita-note">Nevyužité limity se počítají jako závazky</span>
      </div>
    </div>`
}

function vizualS7(): string {
  return `
    <div class="prehr-vizual-s7">
      <div class="prehr-dum-obal" aria-label="Dům financovaný z 80 % hypotékou">
        <svg class="prehr-dum-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="prehr-dum-clip">
              <polygon points="60,10 110,55 110,110 10,110 10,55"/>
            </clipPath>
          </defs>
          <rect class="prehr-dum-fill" x="0" y="110" width="120" height="0" clip-path="url(#prehr-dum-clip)"/>
          <polygon points="60,10 110,55 110,110 10,110 10,55" fill="none" stroke="currentColor" stroke-width="3"/>
          <polygon class="prehr-dum-strecha" points="60,5 115,52 5,52" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
        <div class="prehr-dum-pct">20 %</div>
      </div>
      <p class="prehr-dum-pozn">Vlastní zdroje: min. 20 % ceny nemovitosti</p>
    </div>`
}

function vizualS8(): string {
  const docs = ['Občanský průkaz', 'Potvrzení o příjmu', 'Výpisy z účtu', 'Přehled závazků', 'Smlouva o koupi']
  return `
    <div class="prehr-vizual-s8">
      <ul class="prehr-doklady">
        ${docs.map((d, i) => `
          <li class="prehr-dokl prehr-dokl-${i}" aria-label="${d}, splněno">
            <span class="prehr-dokl-check" aria-hidden="true">✓</span>
            <span>${d}</span>
          </li>`).join('')}
      </ul>
    </div>`
}

function vizualS9(): string {
  return `
    <div class="prehr-vizual-s9">
      <div class="prehr-logo-blok">
        <div class="prehr-logo-jmeno">Jan Frýdl</div>
        <div class="prehr-logo-titul">Nezávislé hypoteční poradenství</div>
      </div>
      <a href="/pruvodce#checklist" class="prehr-s9-btn">Stáhnout checklist dokumentů</a>
      <a href="https://calendar.app.google/pX6djR7KPxPxVg9m8" target="_blank" rel="noopener noreferrer" class="prehr-s9-btn prehr-s9-btn-sec">Rezervovat termín hovoru</a>
    </div>`
}

const VIZUALY: Record<string, () => string> = {
  s0: vizualS0, s1: vizualS1, s2: vizualS2, s3: vizualS3, s4: vizualS4,
  s5: vizualS5, s6: vizualS6, s7: vizualS7, s8: vizualS8, s9: vizualS9,
}

// ─── Analytika ────────────────────────────────────────────────────────────────

function trackGuideEvent(nazev: string, parametry?: Record<string, string | number>): void {
  const souhlas = (() => { try { const s = localStorage.getItem('jf_cookie_souhlas'); return s ? JSON.parse(s) : null } catch { return null } })()
  if (!souhlas?.analytika) return
  if (typeof (window as any).gtag === 'function') (window as any).gtag('event', nazev, parametry)
  if (typeof (window as any).fbq === 'function') (window as any).fbq('trackCustom', nazev, parametry)
}

// ─── Přehrávač ────────────────────────────────────────────────────────────────

export class PrehravacPruvodce {
  private container: HTMLElement
  private scenes: Scena[]
  private current = 0
  private playing = false
  private started = false
  private muted = true
  private rafId: number | null = null
  private sceneStart = 0
  private elapsed = 0
  private audio: HTMLAudioElement | null = null
  private holdTimer: ReturnType<typeof setTimeout> | null = null
  private paused = false
  private guideViewSent = false
  private completeSent = false

  constructor(container: HTMLElement, scenes: Scena[]) {
    this.container = container
    this.scenes = scenes
  }

  mount(): void {
    this.container.innerHTML = this.renderShell()
    this.bindEvents()
    this.renderScene(0)
    this.tryLoadAudio()
    trackGuideEvent('guide_view')
    this.guideViewSent = true
  }

  private renderShell(): string {
    const segs = this.scenes.map((_, i) =>
      `<div class="prehr-seg" data-seg="${i}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>`
    ).join('')

    return `
      <div class="prehr-root" role="region" aria-label="Průvodce hypotékou — animace">
        <div class="prehr-progress-bar">${segs}</div>
        <div class="prehr-scene-area" id="prehr-scene-area">
          <div class="prehr-spustit-overlay" id="prehr-spustit">
            <div class="prehr-spustit-inner">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              <span>Spustit</span>
            </div>
          </div>
          <div class="prehr-scene-content" id="prehr-scene-content"></div>
          <div class="prehr-caption" id="prehr-caption" aria-live="polite"></div>
          <div class="prehr-tap-left" id="prehr-tap-left" aria-label="Předchozí scéna"></div>
          <div class="prehr-tap-right" id="prehr-tap-right" aria-label="Další scéna"></div>
        </div>
        <div class="prehr-controls">
          <button type="button" class="prehr-ctrl-btn" id="prehr-btn-pp" aria-label="Přehrát">
            <svg id="prehr-icon-play" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg id="prehr-icon-pause" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>
          <button type="button" class="prehr-ctrl-btn" id="prehr-btn-mute" aria-label="Zapnout zvuk">
            <svg id="prehr-icon-mute" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2"/></svg>
            <svg id="prehr-icon-sound" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </button>
          <div class="prehr-scene-indicator" id="prehr-scene-indicator">1 / ${this.scenes.length}</div>
        </div>
      </div>`
  }

  private bindEvents(): void {
    const root = this.container.querySelector<HTMLElement>('.prehr-root')!
    const spustit = this.container.querySelector<HTMLElement>('#prehr-spustit')!
    const btnPP = this.container.querySelector<HTMLButtonElement>('#prehr-btn-pp')!
    const btnMute = this.container.querySelector<HTMLButtonElement>('#prehr-btn-mute')!
    const tapL = this.container.querySelector<HTMLElement>('#prehr-tap-left')!
    const tapR = this.container.querySelector<HTMLElement>('#prehr-tap-right')!

    spustit.addEventListener('click', () => this.start())
    btnPP.addEventListener('click', () => { if (this.started) this.togglePlay() })
    btnMute.addEventListener('click', () => this.toggleMute())
    tapL.addEventListener('click', () => { if (this.started) this.goTo(this.current - 1) })
    tapR.addEventListener('click', () => { if (this.started) this.goTo(this.current + 1) })

    if (!REDUCED_MOTION) {
      const onHoldStart = () => {
        if (!this.started) return
        this.holdTimer = setTimeout(() => { this.paused = true; this.stopTimer() }, 150)
      }
      const onHoldEnd = () => {
        if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null }
        if (this.paused) { this.paused = false; this.startTimer() }
      }
      root.addEventListener('pointerdown', onHoldStart)
      root.addEventListener('pointerup', onHoldEnd)
      root.addEventListener('pointercancel', onHoldEnd)
    }
  }

  private start(): void {
    const overlay = this.container.querySelector<HTMLElement>('#prehr-spustit')!
    overlay.style.display = 'none'
    this.started = true
    this.playing = true
    trackGuideEvent('animation_start')
    this.updatePlayPauseBtn()
    if (this.audio && !this.muted) this.audio.play().catch(() => {})
    if (!REDUCED_MOTION) this.startTimer()
  }

  private startTimer(): void {
    this.stopTimer()
    this.sceneStart = performance.now() - this.elapsed * 1000
    const tick = (now: number) => {
      if (!this.playing || this.paused) return
      const scenaDoba = this.scenes[this.current].doba
      this.elapsed = (now - this.sceneStart) / 1000
      const progress = Math.min(this.elapsed / scenaDoba, 1)
      this.updateProgressBar(this.current, progress)
      if (progress >= 1) {
        this.elapsed = 0
        const next = this.current + 1
        if (next < this.scenes.length) {
          this.goToInternal(next)
        } else {
          this.stopTimer()
          this.playing = false
          this.updatePlayPauseBtn()
          if (!this.completeSent) { trackGuideEvent('animation_complete'); this.completeSent = true }
          return
        }
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  private stopTimer(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null }
  }

  togglePlay(): void {
    if (!this.playing) {
      this.playing = true
      if (this.audio && !this.muted) this.audio.play().catch(() => {})
      if (!REDUCED_MOTION) this.startTimer()
    } else {
      this.playing = false
      this.stopTimer()
      if (this.audio) this.audio.pause()
    }
    this.updatePlayPauseBtn()
  }

  private toggleMute(): void {
    this.muted = !this.muted
    if (this.audio) this.audio.muted = this.muted
    const iconMute = this.container.querySelector<SVGElement>('#prehr-icon-mute')!
    const iconSound = this.container.querySelector<SVGElement>('#prehr-icon-sound')!
    const btn = this.container.querySelector<HTMLButtonElement>('#prehr-btn-mute')!
    iconMute.style.display = this.muted ? '' : 'none'
    iconSound.style.display = this.muted ? 'none' : ''
    btn.setAttribute('aria-label', this.muted ? 'Zapnout zvuk' : 'Vypnout zvuk')
  }

  private updatePlayPauseBtn(): void {
    const iconPlay = this.container.querySelector<SVGElement>('#prehr-icon-play')!
    const iconPause = this.container.querySelector<SVGElement>('#prehr-icon-pause')!
    const btn = this.container.querySelector<HTMLButtonElement>('#prehr-btn-pp')!
    iconPlay.style.display = this.playing ? 'none' : ''
    iconPause.style.display = this.playing ? '' : 'none'
    btn.setAttribute('aria-label', this.playing ? 'Pozastavit' : 'Přehrát')
  }

  goTo(index: number): void {
    const clamped = Math.max(0, Math.min(this.scenes.length - 1, index))
    this.elapsed = 0
    this.goToInternal(clamped)
    if (this.playing && !REDUCED_MOTION) this.startTimer()
  }

  private goToInternal(index: number): void {
    this.current = index
    this.elapsed = 0
    this.renderScene(index)
    this.updateProgressBar(index, 0)
    this.updateSceneIndicator()
    if (this.audio && !this.muted) {
      const audioStart = this.scenes[index].audioStart
      if (audioStart !== undefined) this.audio.currentTime = audioStart
    }
    trackGuideEvent('scene_view', { scene: index + 1 })
  }

  private renderScene(index: number): void {
    const scena = this.scenes[index]
    const content = this.container.querySelector<HTMLElement>('#prehr-scene-content')!
    const caption = this.container.querySelector<HTMLElement>('#prehr-caption')!

    const vizFn = VIZUALY[scena.id]
    content.innerHTML = `
      <div class="prehr-scene prehr-scene-${scena.id}${REDUCED_MOTION ? '' : ' prehr-scene-animated'}" aria-hidden="true">
        <div class="prehr-scene-title">${scena.title}</div>
        ${vizFn ? vizFn() : ''}
      </div>`
    caption.textContent = scena.vo
  }

  private updateProgressBar(activeIndex: number, progress: number): void {
    const segs = this.container.querySelectorAll<HTMLElement>('.prehr-seg')
    segs.forEach((seg, i) => {
      if (i < activeIndex) {
        seg.style.setProperty('--seg-progress', '100%')
        seg.classList.add('prehr-seg-done')
        seg.classList.remove('prehr-seg-active')
        seg.setAttribute('aria-valuenow', '100')
      } else if (i === activeIndex) {
        const pct = Math.round(progress * 100)
        seg.style.setProperty('--seg-progress', `${pct}%`)
        seg.classList.add('prehr-seg-active')
        seg.classList.remove('prehr-seg-done')
        seg.setAttribute('aria-valuenow', String(pct))
      } else {
        seg.style.setProperty('--seg-progress', '0%')
        seg.classList.remove('prehr-seg-done', 'prehr-seg-active')
        seg.setAttribute('aria-valuenow', '0')
      }
    })
  }

  private updateSceneIndicator(): void {
    const el = this.container.querySelector<HTMLElement>('#prehr-scene-indicator')
    if (el) el.textContent = `${this.current + 1} / ${this.scenes.length}`
  }

  private tryLoadAudio(): void {
    const audio = new Audio('/audio/pruvodce.mp3')
    audio.preload = 'none'
    audio.muted = true

    const onLoad = () => {
      this.audio = audio
      this.audio.muted = this.muted
    }
    audio.addEventListener('canplay', onLoad, { once: true })
    audio.addEventListener('error', () => { /* no audio, silent mode */ }, { once: true })
    audio.load()
  }
}
