/**
 * Geolocation API (грубо): часовой пояс без разрешения и опционально
 * приблизительные координаты после opt-in пользователя (для профиля).
 */

export const PROFILE_REGION_KEY = 'profile:coarse-region'

export type CoarseRegion = {
  label: string
  timezone: string
  source: 'intl' | 'geolocation'
}

export type GeolocationResolveResult =
  | { ok: true; region: CoarseRegion }
  | { ok: false; reason: string }

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/** Часовой пояс браузера — без запроса координат. */
export function getTimezoneRegion(): CoarseRegion {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    label: timezone.replace(/_/g, ' '),
    timezone,
    source: 'intl',
  }
}

export function readStoredCoarseRegion(): CoarseRegion | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_REGION_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as CoarseRegion
    if (
      typeof parsed.label === 'string' &&
      typeof parsed.timezone === 'string'
    ) {
      return parsed
    }
  } catch {
    // noop
  }
  return null
}

export function writeStoredCoarseRegion(region: CoarseRegion): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(PROFILE_REGION_KEY, JSON.stringify(region))
  } catch {
    // noop
  }
}

function formatRoundedCoords(lat: number, lng: number): string {
  const latR = Math.round(lat * 10) / 10
  const lngR = Math.round(lng * 10) / 10
  return `≈ ${latR}°, ${lngR}°`
}

export function resolveCoarseRegion(options?: {
  useGeolocation?: boolean
}): Promise<GeolocationResolveResult> {
  const useGeolocation = options?.useGeolocation ?? false

  if (!useGeolocation) {
    const region = getTimezoneRegion()
    writeStoredCoarseRegion(region)
    return Promise.resolve({ ok: true, region })
  }

  if (!isGeolocationSupported()) {
    const region = getTimezoneRegion()
    writeStoredCoarseRegion(region)
    return Promise.resolve({
      ok: true,
      region,
    })
  }

  const geo = window.navigator.geolocation

  return new Promise(resolve => {
    geo.getCurrentPosition(
      (pos: GeolocationPosition) => {
        const { latitude, longitude } = pos.coords
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const region: CoarseRegion = {
          label: `${formatRoundedCoords(
            latitude,
            longitude
          )} · ${timezone.replace(/_/g, ' ')}`,
          timezone,
          source: 'geolocation',
        }
        writeStoredCoarseRegion(region)
        resolve({ ok: true, region })
      },
      (err: GeolocationPositionError) => {
        const code = err?.code
        if (code === 1) {
          resolve({ ok: false, reason: 'Доступ к геолокации запрещён' })
          return
        }
        if (code === 2) {
          resolve({ ok: false, reason: 'Не удалось определить местоположение' })
          return
        }
        resolve({ ok: false, reason: 'Геолокация недоступна' })
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 12_000,
      }
    )
  })
}
