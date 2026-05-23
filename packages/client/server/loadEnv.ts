// Единая загрузка .env для SSR-сервера и Vite (корень монорепо)
import dotenv from 'dotenv'
import path from 'path'

const repoRootEnv = path.resolve(__dirname, '../../../.env')

let loaded = false

// Идемпотентный корневой .env, затем локальный (packages/client/.env)
export function loadMonorepoEnv(): void {
  if (loaded) return
  dotenv.config({ path: repoRootEnv })
  dotenv.config()
  loaded = true
}

// Для vite.config (тот же корень от packages/client)
export function loadMonorepoEnvFromDir(moduleDirname: string): void {
  if (loaded) return
  const root = path.resolve(moduleDirname, '../../.env')
  dotenv.config({ path: root })
  dotenv.config()
  loaded = true
}

// Сброс только для тестов
export function resetEnvLoadForTests(): void {
  loaded = false
}
