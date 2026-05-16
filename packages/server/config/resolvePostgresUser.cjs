/**
 * Для sequelize-cli (db:migrate). В рантайме сервера — utils/resolvePostgresUser.ts (в dist).
 * Логика должна совпадать с packages/server/utils/resolvePostgresUser.ts
 */
function resolvePostgresUser() {
  const fromEnv = process.env.POSTGRES_USER
  if (
    fromEnv != null &&
    String(fromEnv).trim() !== ''
  ) {
    return String(fromEnv).trim()
  }
  const useOs =
    process.env.POSTGRES_USE_OS_USER === '1' ||
    String(
      process.env.POSTGRES_USE_OS_USER || ''
    ).toLowerCase() === 'true'
  if (useOs) {
    return (
      process.env.USER ||
      process.env.USERNAME ||
      'postgres'
    )
  }
  return 'postgres'
}

module.exports = { resolvePostgresUser }
