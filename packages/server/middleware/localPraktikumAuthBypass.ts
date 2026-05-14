import type { PraktikumUser } from './praktikumUser'

const DEFAULT_BYPASS_USER_ID = 999_001
const DEFAULT_BYPASS_DISPLAY = 'e2e-local'

function truthyEnv(
  value: string | undefined
): boolean {
  const v = value?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

/**
 * Локальный обход запроса к Практикуму (e2e / ручная отладка без внешнего API).
 * В **production** всегда выключен, даже если переменная задана.
 */
export function isLocalPraktikumAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  return truthyEnv(
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS
  )
}

/** Пользователь, подставляемый при включённом обходе. */
export function getLocalBypassPraktikumUser(): PraktikumUser {
  const idRaw = Number(
    process.env.LOCAL_PRAKTIKUM_USER_ID
  )
  const id =
    Number.isFinite(idRaw) &&
    Number.isInteger(idRaw)
      ? idRaw
      : DEFAULT_BYPASS_USER_ID
  const displayRaw =
    process.env.LOCAL_PRAKTIKUM_USER_DISPLAY?.trim()
  const displayLabel =
    displayRaw && displayRaw.length > 0
      ? displayRaw
      : DEFAULT_BYPASS_DISPLAY
  return { id, displayLabel }
}
