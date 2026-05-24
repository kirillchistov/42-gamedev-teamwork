/**
 * Единая логика имени пользователя БД (дублирует config/resolvePostgresUser.cjs).
 * См. .env.sample — POSTGRES_USE_OS_USER для Homebrew на macOS.
 */
export function resolvePostgresUser(): string {
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
