import {
  DEFAULT_ROUTE_SECTOR_ID,
  getRouteSectorById,
  ROUTE_MAP_SECTORS,
  type RouteMapSector,
} from './levelMap'

export const ROUTE_MAP_PROGRESS_KEY = 'match3:route-map-progress'
export const ROUTE_MAP_PROGRESS_EVENT = 'match3:route-map-progress-changed'

export type RouteMapProgress = {
  version: 1
  completedSectorIds: string[]
  bestScoreBySector: Record<string, number>
  lastSelectedSectorId?: string
}

const EMPTY_PROGRESS: RouteMapProgress = {
  version: 1,
  completedSectorIds: [],
  bestScoreBySector: {},
}

function normalizeProgress(raw: unknown): RouteMapProgress {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PROGRESS }
  const data = raw as Partial<RouteMapProgress>
  const completedSectorIds = Array.isArray(data.completedSectorIds)
    ? data.completedSectorIds.filter(
        (id): id is string => typeof id === 'string'
      )
    : []
  const bestScoreBySector =
    data.bestScoreBySector && typeof data.bestScoreBySector === 'object'
      ? Object.fromEntries(
          Object.entries(data.bestScoreBySector).filter(
            ([key, value]) =>
              typeof key === 'string' &&
              typeof value === 'number' &&
              Number.isFinite(value)
          )
        )
      : {}
  const lastSelectedSectorId =
    typeof data.lastSelectedSectorId === 'string'
      ? data.lastSelectedSectorId
      : undefined
  return {
    version: 1,
    completedSectorIds,
    bestScoreBySector,
    lastSelectedSectorId,
  }
}

export function readRouteMapProgress(): RouteMapProgress {
  if (typeof window === 'undefined') return { ...EMPTY_PROGRESS }
  try {
    const raw = window.localStorage.getItem(ROUTE_MAP_PROGRESS_KEY)
    if (!raw) return { ...EMPTY_PROGRESS }
    return normalizeProgress(JSON.parse(raw))
  } catch {
    return { ...EMPTY_PROGRESS }
  }
}

export function writeRouteMapProgress(progress: RouteMapProgress): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ROUTE_MAP_PROGRESS_KEY, JSON.stringify(progress))
  window.dispatchEvent(new Event(ROUTE_MAP_PROGRESS_EVENT))
}

export function isSectorCompleted(
  sectorId: string,
  progress: RouteMapProgress = readRouteMapProgress()
): boolean {
  return progress.completedSectorIds.includes(sectorId)
}

export function isSectorUnlocked(
  sector: RouteMapSector,
  progress: RouteMapProgress = readRouteMapProgress(),
  options?: { unlockAll?: boolean }
): boolean {
  if (options?.unlockAll) return true
  if (!sector.unlockAfterSectorId) return true
  return isSectorCompleted(sector.unlockAfterSectorId, progress)
}

export function getUnlockedSectors(
  progress: RouteMapProgress = readRouteMapProgress(),
  options?: { unlockAll?: boolean }
): RouteMapSector[] {
  return ROUTE_MAP_SECTORS.filter(sector =>
    isSectorUnlocked(sector, progress, options)
  )
}

export function getRecommendedSectorId(
  progress: RouteMapProgress = readRouteMapProgress(),
  options?: { unlockAll?: boolean }
): string {
  const unlocked = getUnlockedSectors(progress, options)
  const firstIncomplete = unlocked.find(
    sector => !isSectorCompleted(sector.id, progress)
  )
  if (firstIncomplete) return firstIncomplete.id

  const last = progress.lastSelectedSectorId
  if (
    last &&
    getRouteSectorById(last) &&
    isSectorUnlocked(getRouteSectorById(last)!, progress, options)
  ) {
    return last
  }

  return unlocked[unlocked.length - 1]?.id ?? DEFAULT_ROUTE_SECTOR_ID
}

export function getNextSector(sectorId: string): RouteMapSector | undefined {
  const current = getRouteSectorById(sectorId)
  if (!current) return undefined
  return ROUTE_MAP_SECTORS.find(sector => sector.order === current.order + 1)
}

export function recordSectorWin(
  sectorId: string,
  score: number,
  progress: RouteMapProgress = readRouteMapProgress()
): RouteMapProgress {
  const nextCompleted = progress.completedSectorIds.includes(sectorId)
    ? progress.completedSectorIds
    : [...progress.completedSectorIds, sectorId]
  const prevBest = progress.bestScoreBySector[sectorId] ?? 0
  const next: RouteMapProgress = {
    ...progress,
    completedSectorIds: nextCompleted,
    bestScoreBySector: {
      ...progress.bestScoreBySector,
      [sectorId]: Math.max(prevBest, Math.floor(score)),
    },
    lastSelectedSectorId: sectorId,
  }
  writeRouteMapProgress(next)
  return next
}

export function rememberSelectedSector(
  sectorId: string,
  progress: RouteMapProgress = readRouteMapProgress()
): RouteMapProgress {
  const next: RouteMapProgress = {
    ...progress,
    lastSelectedSectorId: sectorId,
  }
  writeRouteMapProgress(next)
  return next
}

export function getSectorUnlockHint(sector: RouteMapSector): string | null {
  if (!sector.unlockAfterSectorId) return null
  const required = getRouteSectorById(sector.unlockAfterSectorId)
  if (!required) return null
  return `Откройте ${required.title}: выполните цель сектора`
}
