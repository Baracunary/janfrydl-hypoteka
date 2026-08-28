// POST /api/lead — přijme kontakt z formuláře a předá ho třemi kanály:
// 1) e-mail poradci, 2) webhook do Make/n8n (CRM), 3) Meta Conversions API (server-side Lead).
// E-mail a webhook běží souběžně a nezávisle na sobě — stačí, aby uspěl jeden z nich,
// aby lead reálně dorazil k Janovi; CAPI je jen doplňkové měření a nikdy nesmí request shodit.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'

interface KalkulackaPayload {
  rezim: string
  cena: number
  vlastni_zdroje: number
  uver: number
  roky: number
  fixace: number
  ltv: number
  splatka: number
  do36: boolean
  ucel: string
  [klic: string]: unknown
}

interface LeadPayload {
  jmeno: string
  telefon: string
  email: string
  situace: string
  souhlas: boolean
  souhlas_cas: string
  event_id?: string
  kalkulacka: KalkulackaPayload
  utm: { source: string; medium: string; campaign: string; content: string; term: string }
  fbclid: string
  url: string
  user_agent: string
}

function jePlatnyPayload(body: unknown): body is LeadPayload {
  if (!body || typeof body !== 'object') return false
  const p = body as Record<string, unknown>
  return (
    typeof p.jmeno === 'string' &&
    p.jmeno.trim().length >= 3 &&
    typeof p.telefon === 'string' &&
    /^\+420\d{9}$/.test(p.telefon) &&
    typeof p.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) &&
    typeof p.situace === 'string' &&
    p.situace.trim().length > 0 &&
    p.souhlas === true &&
    typeof p.kalkulacka === 'object' &&
    p.kalkulacka !== null
  )
}

function sha256(hodnota: string): string {
  return createHash('sha256').update(hodnota.trim().toLowerCase()).digest('hex')
}

function formatujKcServer(castka: number): string {
  return `${Math.round(castka).toLocaleString('cs-CZ').replace(/[  ]/g, ' ')} Kč`
}

async function posliEmail(lead: LeadPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const od = process.env.LEAD_EMAIL_FROM
  const komu = process.env.LEAD_EMAIL_TO || 'jan.frydl@4fin.cz'
  if (!apiKey || !od) {
    console.error('E-mail leadu nebyl odeslán — chybí RESEND_API_KEY nebo LEAD_EMAIL_FROM v env.')
    return false
  }

  const k = lead.kalkulacka
  const html = `
    <h2>Nová poptávka z kalkulačky</h2>
    <p><strong>${lead.jmeno}</strong><br/>
    Tel: <a href="tel:${lead.telefon}">${lead.telefon}</a><br/>
    E-mail: <a href="mailto:${lead.email}">${lead.email}</a><br/>
    Řeší: ${lead.situace}</p>
    <h3>Parametry z kalkulačky</h3>
    <ul>
      <li>Režim: ${k.rezim === 'koupe' ? 'Kupuje nemovitost' : 'Refinancování'}</li>
      ${k.cena ? `<li>Cena nemovitosti: ${formatujKcServer(k.cena)}</li>` : ''}
      ${k.vlastni_zdroje ? `<li>Vlastní zdroje: ${formatujKcServer(k.vlastni_zdroje)}</li>` : ''}
      <li>Výše úvěru: ${formatujKcServer(k.uver)}</li>
      <li>Doba splácení: ${k.roky} let</li>
      <li>Fixace: ${k.fixace} let</li>
      ${k.rezim === 'koupe' ? `<li>LTV: ${k.ltv.toFixed(0)} %</li>` : ''}
      <li>Orientační splátka: ${formatujKcServer(k.splatka)} / měsíc</li>
      ${k.rezim === 'koupe' ? `<li>Mladší 36 let: ${k.do36 ? 'ano' : 'ne'}</li>` : ''}
      ${k.ucel ? `<li>Účel: ${k.ucel === 'investice' ? 'investice (pronájem)' : 'vlastní bydlení'}</li>` : ''}
    </ul>
    <h3>Zdroj návštěvy</h3>
    <ul>
      <li>UTM zdroj: ${lead.utm.source || '—'} / ${lead.utm.medium || '—'} / ${lead.utm.campaign || '—'}</li>
      <li>fbclid: ${lead.fbclid || '—'}</li>
      <li>URL: ${lead.url}</li>
    </ul>
    <p style="color:#888;font-size:12px">Souhlas se zpracováním udělen: ${lead.souhlas_cas}</p>
  `

  try {
    const odpoved = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: od,
        to: [komu],
        reply_to: lead.email,
        subject: `Nová poptávka: ${lead.jmeno} — ${lead.situace}`,
        html,
      }),
    })
    return odpoved.ok
  } catch (chyba) {
    console.error('Odeslání e-mailu selhalo', chyba)
    return false
  }
}

async function posliWebhook(lead: LeadPayload): Promise<boolean> {
  const url = process.env.LEAD_WEBHOOK_URL
  if (!url) return false

  try {
    const odpoved = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    })
    return odpoved.ok
  } catch (chyba) {
    console.error('Odeslání webhooku selhalo', chyba)
    return false
  }
}

async function posliMetaCapi(lead: LeadPayload, req: VercelRequest): Promise<void> {
  const pixelId = process.env.PUBLIC_META_PIXEL_ID
  const token = process.env.META_CAPI_ACCESS_TOKEN
  if (!pixelId || !token) return

  const klientskeIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()

  const telo = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: lead.event_id,
        event_source_url: lead.url,
        action_source: 'website',
        user_data: {
          em: [sha256(lead.email)],
          ph: [sha256(lead.telefon.replace(/^\+/, ''))],
          client_ip_address: klientskeIp,
          client_user_agent: lead.user_agent,
          fbc: lead.fbclid ? `fb.1.${Date.now()}.${lead.fbclid}` : undefined,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  }

  try {
    await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telo),
    })
  } catch (chyba) {
    console.error('Odeslání Meta CAPI eventu selhalo', chyba)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ chyba: 'Metoda není podporována.' })
    return
  }

  if (!jePlatnyPayload(req.body)) {
    res.status(400).json({ chyba: 'Neplatná nebo neúplná data formuláře.' })
    return
  }

  const lead = req.body

  // Musíme počkat i na CAPI (i když jeho výsledek neovlivní odpověď klientovi) —
  // serverless funkce se po odeslání odpovědi může ukončit dřív, než by fetch doběhl.
  const [emailOk, webhookOk] = await Promise.all([posliEmail(lead), posliWebhook(lead), posliMetaCapi(lead, req)])

  if (!emailOk && !webhookOk) {
    res.status(502).json({ chyba: 'Lead se nepodařilo doručit. Zkuste to prosím znovu nebo zavolejte.' })
    return
  }

  res.status(200).json({ ok: true })
}
