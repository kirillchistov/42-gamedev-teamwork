/**
 * Конфиг для sequelize-cli (db:migrate).
 * Сначала .env пакета server, затем корень монорепы с override: true,
 * чтобы правки в корневом .env всегда применялись при yarn db:migrate.
 *
 * __dirname здесь — packages/server/config; на два уровня вверх это packages/,
 * а не корень репозитория, поэтому repoRoot ищем вверх по дереву (lerna.json / yarn.lock).
 */
const fs = require('fs')
const path = require('path')

function resolveRepoRoot(startDir) {
  let dir = path.resolve(startDir)
  for (let i = 0; i < 10; i += 1) {
    if (
      fs.existsSync(path.join(dir, 'lerna.json')) ||
      fs.existsSync(path.join(dir, 'yarn.lock'))
    ) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }
  return path.resolve(startDir, '..', '..', '..')
}

const serverDir = path.resolve(__dirname, '..')
const repoRoot = resolveRepoRoot(__dirname)

require('dotenv').config({
  path: path.join(serverDir, '.env'),
})
// override: false — явные env (в т.ч. docker run -e) важнее файла .env в корне.
require('dotenv').config({
  path: path.join(repoRoot, '.env'),
  override: false,
})

const {
  resolvePostgresUser,
} = require('./resolvePostgresUser.cjs')

const base = {
  username: resolvePostgresUser(),
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  dialect: 'postgres',
  logging: false,
}

module.exports = {
  development: { ...base },
  test: {
    ...base,
    database:
      process.env.POSTGRES_DB_TEST ||
      process.env.POSTGRES_DB ||
      'postgres',
  },
  production: { ...base },
}
