import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

/**
 * `vite dev` neumí spustit Vercel serverless funkce z /api — ty běží
 * až přes `vercel dev` nebo po nasazení. Bez tohohle mocku by se formulář
 * v lokálním náhledu nikdy neodeslal (fetch na /api/lead by dostal 404).
 * Na produkční build ani na Vercel nasazení tohle nemá žádný vliv —
 * middleware běží jen uvnitř `vite dev` dev serveru.
 */
function mockLeadApiVDevu(): Plugin {
  return {
    name: 'mock-lead-api-pro-vyvoj',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/lead', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let telo = ''
        req.on('data', (chunk) => (telo += chunk))
        req.on('end', () => {
          console.log('[DEV MOCK] /api/lead přijal poptávku (reálně se nikam neodeslala):', telo)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({ ok: true, dev_mock: true }))
        })
      })
    },
  }
}

// Vícestránkový build: hlavní landing page + samostatné právní stránky.
export default defineConfig({
  plugins: [tailwindcss(), mockLeadApiVDevu()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gdpr: resolve(__dirname, 'gdpr.html'),
        cookies: resolve(__dirname, 'cookies.html'),
      },
    },
  },
})
