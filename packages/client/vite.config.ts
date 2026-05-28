/** Изменения и починка Sprint6 Chores
 * GH Pages: https://kirillchistov.github.io/42-gamedev-teamwork/
 **/

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { loadMonorepoEnvFromDir } from './server/loadEnv'
import { buildGhPagesCspMetaContent } from './server/cspPolicy'

loadMonorepoEnvFromDir(__dirname)

function viteBaseFromEnv(): string {
  const raw = process.env.GITHUB_PAGES_BASE_URL?.trim()
  if (!raw || raw === '/') return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

// https://vitejs.dev/config/
const viteBase = viteBaseFromEnv()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const viteStaticDeploy =
    env.VITE_STATIC_DEPLOY ?? process.env.VITE_STATIC_DEPLOY ?? ''
  const isGhPagesDeploy = viteStaticDeploy === 'gh-pages'

  return {
    base: viteBase,
    server: {
      port: Number(process.env.CLIENT_PORT) || 9000,
    },
    define: {
      __APP_BASE_URL__: JSON.stringify(viteBase),
      __EXTERNAL_SERVER_URL__: JSON.stringify(process.env.EXTERNAL_SERVER_URL),
      __INTERNAL_SERVER_URL__: JSON.stringify(process.env.INTERNAL_SERVER_URL),
      // Не define process.env.VITE_APP_API_URL — иначе URL с машины сборки
      // попадает в браузерный бандл (см. constants.tsx nodeEnv()).
      'process.env.VITE_STATIC_DEPLOY': JSON.stringify(viteStaticDeploy),
      'process.env.GITHUB_PAGES_BASE_URL': JSON.stringify(viteBase),
      __GH_PAGES_API_PROXY__: JSON.stringify(isGhPagesDeploy),
    },
    build: {
      outDir: path.join(__dirname, 'dist/client'),
    },
    ssr: {
      format: 'cjs',
    },
    plugins: [
      {
        name: 'gh-pages-csp-meta',
        transformIndexHtml(html) {
          if (!isGhPagesDeploy) return html
          const csp = buildGhPagesCspMetaContent()
          const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`
          return html.replace('</head>', `    ${meta}\n  </head>`)
        },
      },
      {
        name: 'html-public-links-for-subpath',
        transformIndexHtml(html) {
          const baseScript = `<script>globalThis.__APP_BASE_URL__=${JSON.stringify(
            viteBase
          )};</script>`
          const out = html.replace(/<head>/i, `<head>\n    ${baseScript}`)
          if (viteBase === '/' || viteBase === '') return out
          const prefix = viteBase.replace(/\/+$/, '')
          return out
            .replace(/href="\/vite\.svg"/g, `href="${prefix}/vite.svg"`)
            .replace(
              /href="\/manifest\.json"/g,
              `href="${prefix}/manifest.json"`
            )
        },
      },
      react(),
      VitePWA({
        // SW на IP с самоподписанным TLS не регистрируется; включить: VITE_ENABLE_SW=1 при сборке
        injectRegister: process.env.VITE_ENABLE_SW === '1' ? 'auto' : false,
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        manifest: false,
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
          globIgnores: ['iconset/**/*'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  }
})
