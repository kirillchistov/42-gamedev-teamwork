/**
 * Синхронизация диаграммы: docs/project-architecture.svg — источник правды,
 * копия для Vite/public и презентации.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'docs/project-architecture.svg')

if (!fs.existsSync(source)) {
  console.error('missing', source)
  process.exit(1)
}

const svg = fs.readFileSync(source, 'utf8')
const targets = [
  path.join(root, 'packages/client/public/docs/project-architecture.svg'),
]

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, svg, 'utf8')
  console.log('synced', path.relative(root, target))
}
