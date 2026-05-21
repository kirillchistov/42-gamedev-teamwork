/** Изменения и починка Sprint6 Chores
 * GH Pages: https://kirillchistov.github.io/42-gamedev-teamwork/
 **/

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import dotenv from 'dotenv'
import path from 'path'
import { buildGhPagesCspMetaContent } from './server/cspPolicy'

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})
dotenv.config()

function viteBaseFromEnv(): string {
  const raw =
    process.env.GITHUB_PAGES_BASE_URL?.trim()
  if (!raw || raw === '/') return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

// https://vitejs.dev/config/
const viteBase = viteBaseFromEnv()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const viteAppApiUrl =
    env.VITE_APP_API_URL ??
    process.env.VITE_APP_API_URL ??
    ''
  const isGhPagesDeploy =
    (env.VITE_STATIC_DEPLOY ??
      process.env.VITE_STATIC_DEPLOY ??
      '') === 'gh-pages'

  return {
    base: viteBase,
    server: {
      port:
        Number(process.env.CLIENT_PORT) || 9000,
    },
    define: {
      __EXTERNAL_SERVER_URL__: JSON.stringify(
        process.env.EXTERNAL_SERVER_URL
      ),
      __INTERNAL_SERVER_URL__: JSON.stringify(
        process.env.INTERNAL_SERVER_URL
      ),
      'process.env.VITE_APP_API_URL':
        JSON.stringify(viteAppApiUrl),
      'process.env.VITE_STATIC_DEPLOY':
        JSON.stringify(
          env.VITE_STATIC_DEPLOY ??
            process.env.VITE_STATIC_DEPLOY ??
            ''
        ),
      'process.env.GITHUB_PAGES_BASE_URL':
        JSON.stringify(viteBase),
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
          return html.replace(
            '</head>',
            `    ${meta}\n  </head>`
          )
        },
      },
      {
        name: 'html-public-links-for-subpath',
        transformIndexHtml(html) {
          if (viteBase === '/' || viteBase === '')
            return html
          const prefix = viteBase.replace(
            /\/+$/,
            ''
          )
          return html
            .replace(
              /href="\/vite\.svg"/g,
              `href="${prefix}/vite.svg"`
            )
            .replace(
              /href="\/manifest\.json"/g,
              `href="${prefix}/manifest.json"`
            )
        },
      },
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        manifest: false,
        injectManifest: {
          globPatterns: [
            '**/*.{js,css,html,png,svg,ico,json}',
          ],
          globIgnores: ['iconset/**/*'],
          maximumFileSizeToCacheInBytes:
            5 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  }
})
