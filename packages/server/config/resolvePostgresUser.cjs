/**
 * Единая логика имени пользователя БД для sequelize-cli и Sequelize в рантайме.
 * См. .env.sample — POSTGRES_USE_OS_USER для Homebrew на macOS.
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
