/** Изменения и починка Sprint6 Chores
 * GitHub Pages: запуск подкаталоге /repo-name/
 **/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
export default defineConfig({
  base: viteBaseFromEnv(),
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
  plugins: [react()],
})
