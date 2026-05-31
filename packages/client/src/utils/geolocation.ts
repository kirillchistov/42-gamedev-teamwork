/**
 * Geolocation API (грубо): часовой пояс без разрешения и опционально
 * приблизительные координаты после opt-in пользователя (для профиля).
 */

export const PROFILE_REGION_KEY = 'profile:coarse-region'

export type CoarseRegion = {
  label: string
  timezone: string
  source: 'intl' | 'geolocation'
  continent?: string
  countryCode?: string
  city?: string
  latitude?: number
  longitude?: number
}

export type GeolocationResolveResult =
  | { ok: true; region: CoarseRegion }
  | { ok: false; reason: string }

const REVERSE_GEO_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client'

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

function parseTimezoneId(timezone: string): {
  continent?: string
  city?: string
} {
  const slash = timezone.indexOf('/')
  if (slash === -1) {
    return {}
  }
  return {
    continent: timezone.slice(0, slash),
    city: timezone.slice(slash + 1).replace(/_/g, ' '),
  }
}

function countryCodeFromNavigator(): string | undefined {
  if (typeof navigator === 'undefined') {
    return undefined
  }
  try {
    const locale = new Intl.Locale(navigator.language)
    if (locale.region) {
      return locale.region.toUpperCase()
    }
  } catch {
    // noop
  }
  const match = navigator.language.match(/[-_]([A-Za-z]{2})\b/)
  return match ? match[1].toUpperCase() : undefined
}

export function formatRoundedCoords(lat: number, lng: number): string {
  const latR = Math.round(lat * 10) / 10
  const lngR = Math.round(lng * 10) / 10
  return `≈ ${latR}°, ${lngR}°`
}

function formatLocalTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatGmtOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(date)
  const raw = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
  return raw.replace(/^UTC/, 'GMT')
}

/** Вторая метка для Европы — смещение по Europe/Berlin (как CET±N в демо). */
function formatCetReferenceOffset(date: Date): string {
  return formatGmtOffset(date, 'Europe/Berlin').replace(/^GMT/, 'CET')
}

function formatOffsetParenthesis(
  date: Date,
  timeZone: string,
  continent?: string
): string {
  const local = formatGmtOffset(date, timeZone)
  if (continent === 'Europe') {
    const cet = formatCetReferenceOffset(date)
    if (cet !== local.replace(/^GMT/, 'CET')) {
      return `(${local}, ${cet})`
    }
  }
  return `(${local})`
}

/** Europe / RU / Moscow ≈ 55.8°, 37.7° · 12:03 (GMT+3, CET+2) */
export function formatCoarseRegionLine(
  region: CoarseRegion,
  at: Date = new Date()
): string {
  const placeParts = [region.continent, region.countryCode, region.city].filter(
    (p): p is string => Boolean(p)
  )

  let line =
    placeParts.length > 0
      ? placeParts.join(' / ')
      : region.timezone.replace(/_/g, ' ').replace(/\//g, ' / ')

  if (
    region.source === 'geolocation' &&
    region.latitude != null &&
    region.longitude != null
  ) {
    line += ` ${formatRoundedCoords(region.latitude, region.longitude)}`
  }

  const time = formatLocalTime(at, region.timezone)
  const offsets = formatOffsetParenthesis(at, region.timezone, region.continent)
  line += ` · ${time} ${offsets}`

  return line
}

function buildRegion(
  base: Omit<CoarseRegion, 'label'> & { label?: string }
): CoarseRegion {
  const region: CoarseRegion = {
    label: '',
    ...base,
  }
  region.label = base.label ?? formatCoarseRegionLine(region)
  return region
}

async function fetchReverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  continent?: string
  countryCode?: string
  city?: string
} | null> {
  if (typeof fetch === 'undefined') {
    return null
  }
  const url = `${REVERSE_GEO_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return null
    }
    const data = (await res.json()) as {
      continent?: string
      countryCode?: string
      city?: string
      locality?: string
    }
    return {
      continent: data.continent,
      countryCode: data.countryCode?.toUpperCase(),
      city: data.city || data.locality,
    }
  } catch {
    return null
  }
}

/** Часовой пояс браузера — без запроса координат. */
export function getTimezoneRegion(): CoarseRegion {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const { continent, city } = parseTimezoneId(timezone)
  return buildRegion({
    timezone,
    source: 'intl',
    continent,
    countryCode: countryCodeFromNavigator(),
    city,
  })
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
      return buildRegion({
        ...parsed,
        label: undefined,
      })
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
    const toStore = buildRegion({ ...region, label: undefined })
    window.localStorage.setItem(PROFILE_REGION_KEY, JSON.stringify(toStore))
  } catch {
    // noop
  }
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
        void (async () => {
          const { latitude, longitude } = pos.coords
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
          const fromTz = parseTimezoneId(timezone)
          const place = await fetchReverseGeocode(latitude, longitude)
          const region = buildRegion({
            timezone,
            source: 'geolocation',
            continent: place?.continent ?? fromTz.continent,
            countryCode: place?.countryCode ?? countryCodeFromNavigator(),
            city: place?.city ?? fromTz.city,
            latitude,
            longitude,
          })
          writeStoredCoarseRegion(region)
          resolve({ ok: true, region })
        })()
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
