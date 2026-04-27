/** Изменения и починка Sprint6 Chores
 * GitHub Pages: https://kirillchistov.github.io/42-gamedev-teamwork/
 **/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config()

function viteBaseFromEnv(): string {
  const raw =
    process.env.GITHUB_PAGES_BASE_URL?.trim()
  if (!raw || raw === '/') return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

// https://vitejs.dev/config/
const viteBase = viteBaseFromEnv()

export default defineConfig({
  base: viteBase,
  resolve: {
    alias: {
      '@match3-public': path.join(
        __dirname,
        'public'
      ),
      '@match3-icons': path.join(
        __dirname,
        'public/iconset'
      ),
    },
  },
  server: {
    port: Number(process.env.CLIENT_PORT) || 3000,
  },
  define: {
    __EXTERNAL_SERVER_URL__: JSON.stringify(
      process.env.EXTERNAL_SERVER_URL
    ),
    __INTERNAL_SERVER_URL__: JSON.stringify(
      process.env.INTERNAL_SERVER_URL
    ),
  },
  build: {
    outDir: path.join(__dirname, 'dist/client'),
  },
  ssr: {
    format: 'cjs',
  },
  plugins: [
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
})
