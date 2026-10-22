import '../../style.css'
import { inject } from '@vercel/analytics'
import { inicializujUtm } from '../../lib/utm'
import { inicializujAnalytiku } from '../../lib/analytics'
import { inicializujFormularFixace } from '../../lib/formular-fixace'
import { inicializujCookieListu } from '../../lib/cookie-lista'

inject()
inicializujUtm()
inicializujAnalytiku()
inicializujCookieListu()

const form = document.getElementById('form-fixace') as HTMLFormElement | null
if (form) {
  inicializujFormularFixace(form)
}
