import {
  getNextSector,
  getRecommendedSectorId,
  isSectorCompleted,
  isSectorUnlocked,
  readRouteMapProgress,
  recordSectorWin,
  ROUTE_MAP_PROGRESS_KEY,
  type RouteMapProgress,
  writeRouteMapProgress,
} from './levelProgress'
import { getRouteSectorById } from './levelMap'

const alpha = getRouteSectorById('sector-alpha')!
const beta = getRouteSectorById('sector-beta')!
const gamma = getRouteSectorById('sector-gamma')!

function resetStorage() {
  window.localStorage.removeItem(ROUTE_MAP_PROGRESS_KEY)
}

describe('levelProgress', () => {
  beforeEach(() => {
    resetStorage()
  })

  test('first sector is unlocked by default', () => {
    const progress = readRouteMapProgress()
    expect(isSectorUnlocked(alpha, progress)).toBe(true)
    expect(isSectorUnlocked(beta, progress)).toBe(false)
    expect(isSectorUnlocked(gamma, progress)).toBe(false)
  })

  test('recordSectorWin unlocks next sector', () => {
    recordSectorWin('sector-alpha', 1500)
    const progress = readRouteMapProgress()
    expect(isSectorCompleted('sector-alpha', progress)).toBe(true)
    expect(isSectorUnlocked(beta, progress)).toBe(true)
    expect(isSectorUnlocked(gamma, progress)).toBe(false)
  })

  test('getRecommendedSectorId prefers last selected when all unlocked are done', () => {
    const progress: RouteMapProgress = {
      version: 1,
      completedSectorIds: ['sector-alpha', 'sector-beta', 'sector-gamma'],
      bestScoreBySector: {},
      lastSelectedSectorId: 'sector-beta',
    }
    writeRouteMapProgress(progress)
    expect(getRecommendedSectorId()).toBe('sector-beta')
  })

  test('getRecommendedSectorId points to first incomplete sector', () => {
    recordSectorWin('sector-alpha', 1200)
    expect(getRecommendedSectorId()).toBe('sector-beta')
  })

  test('getNextSector returns sequential sector', () => {
    expect(getNextSector('sector-alpha')?.id).toBe('sector-beta')
    expect(getNextSector('sector-gamma')).toBeUndefined()
  })
})
