import {
  formatCoarseRegionLine,
  formatRoundedCoords,
  getTimezoneRegion,
  PROFILE_REGION_KEY,
  writeStoredCoarseRegion,
  readStoredCoarseRegion,
} from './geolocation'

describe('geolocation utils', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('getTimezoneRegion returns structured region', () => {
    const region = getTimezoneRegion()
    expect(region.source).toBe('intl')
    expect(region.timezone.length).toBeGreaterThan(0)
    expect(region.label).toContain('·')
  })

  it('formatCoarseRegionLine builds compact demo line', () => {
    const at = new Date('2026-05-28T09:03:00.000Z')
    const line = formatCoarseRegionLine(
      {
        label: '',
        timezone: 'Europe/Moscow',
        source: 'geolocation',
        continent: 'Europe',
        countryCode: 'RU',
        city: 'Moscow',
        latitude: 55.7558,
        longitude: 37.6173,
      },
      at
    )
    expect(line).toMatch(/^Europe \/ RU \/ Moscow/)
    expect(line).toContain(formatRoundedCoords(55.7558, 37.6173))
    expect(line).toMatch(/· \d{2}:\d{2} \(GMT/)
  })

  it('persists coarse region in localStorage', () => {
    const region = getTimezoneRegion()
    writeStoredCoarseRegion(region)
    expect(window.localStorage.getItem(PROFILE_REGION_KEY)).toBeTruthy()
    expect(readStoredCoarseRegion()?.timezone).toBe(region.timezone)
  })
})
