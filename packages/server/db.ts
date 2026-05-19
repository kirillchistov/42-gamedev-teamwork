import { sequelize } from './sequelize'
import './models'

/**
 * Проверка соединения с PostgreSQL через Sequelize.
 */
export async function createClientAndConnect(): Promise<null> {
  try {
    await sequelize.authenticate()
    const [rows] = await sequelize.query(
      'SELECT NOW() AS now'
    )
    const row = Array.isArray(rows)
      ? rows[0]
      : null
    const nowVal =
      row &&
      typeof row === 'object' &&
      row !== null &&
      'now' in row
        ? (row as { now: unknown }).now
        : undefined
    console.log(
      '  ➜ 🎸 Connected to the database at:',
      nowVal
    )
    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

export { sequelize } from './sequelize'
