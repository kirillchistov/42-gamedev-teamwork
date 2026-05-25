import {
  getTimezoneRegion,
  PROFILE_REGION_KEY,
  writeStoredCoarseRegion,
  readStoredCoarseRegion,
} from './geolocation'

describe('geolocation utils', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('getTimezoneRegion returns label and timezone', () => {
    const region = getTimezoneRegion()
    expect(region.source).toBe('intl')
    expect(region.timezone.length).toBeGreaterThan(0)
    expect(region.label.length).toBeGreaterThan(0)
  })

  it('persists coarse region in localStorage', () => {
    const region = getTimezoneRegion()
    writeStoredCoarseRegion(region)
    expect(window.localStorage.getItem(PROFILE_REGION_KEY)).toBeTruthy()
    expect(readStoredCoarseRegion()?.timezone).toBe(region.timezone)
  })
})
