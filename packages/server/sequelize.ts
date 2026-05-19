import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'
import { resolvePostgresUser } from './utils/resolvePostgresUser'

/** Каталог packages/server (из `sequelize.ts` или из `dist/sequelize.js`). */
function resolveServerDir(): string {
  return path.basename(__dirname) === 'dist'
    ? path.resolve(__dirname, '..')
    : __dirname
}

/** Корень монорепы (рядом с lerna.json / yarn.lock). */
function resolveRepoRoot(): string {
  const twoUp = path.resolve(
    __dirname,
    '..',
    '..'
  )
  if (
    fs.existsSync(
      path.join(twoUp, 'lerna.json')
    ) ||
    fs.existsSync(path.join(twoUp, 'yarn.lock'))
  ) {
    return twoUp
  }
  const threeUp = path.resolve(
    __dirname,
    '..',
    '..',
    '..'
  )
  if (
    fs.existsSync(
      path.join(threeUp, 'lerna.json')
    ) ||
    fs.existsSync(path.join(threeUp, 'yarn.lock'))
  ) {
    return threeUp
  }
  return twoUp
}

const serverDir = resolveServerDir()
const repoRoot = resolveRepoRoot()

dotenv.config({
  path: path.join(serverDir, '.env'),
})
dotenv.config({
  path: path.join(repoRoot, '.env'),
  override: true,
})

const host =
  process.env.POSTGRES_HOST ?? 'localhost'
const port = Number(
  process.env.POSTGRES_PORT ?? 5432
)
const database =
  process.env.POSTGRES_DB ?? 'postgres'
const username = resolvePostgresUser()
const password =
  process.env.POSTGRES_PASSWORD ?? 'postgres'

export const sequelize = new Sequelize({
  database,
  username,
  password,
  host,
  port,
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
})
