import type { LevelConfig } from './engine/levels'
import { MATCH3_LEVELS } from './engine/levels'

/**
 * Сектор маршрута — точка на карте прогресса.
 * Не путать с «квестами» (бонусные задачи внутри партии).
 */
export type RouteMapSector = {
  id: string
  order: number
  title: string
  tagline: string
  /** Пресет сложности (Новичок / Пилот / Асс). */
  levelId: LevelConfig['id']
  unlockAfterSectorId?: string
}

export const ROUTE_MAP_SECTORS: RouteMapSector[] = [
  {
    id: 'sector-alpha',
    order: 1,
    title: 'Сектор α',
    tagline: 'Разогрев — знакомство с полем',
    levelId: 'rookie',
  },
  {
    id: 'sector-beta',
    order: 2,
    title: 'Сектор β',
    tagline: 'Орбита — больше поля и меток',
    levelId: 'pilot',
    unlockAfterSectorId: 'sector-alpha',
  },
  {
    id: 'sector-gamma',
    order: 3,
    title: 'Сектор γ',
    tagline: 'Ядро — максимальная сложность',
    levelId: 'ace',
    unlockAfterSectorId: 'sector-beta',
  },
]

export const DEFAULT_ROUTE_SECTOR_ID =
  ROUTE_MAP_SECTORS[0]?.id ?? 'sector-alpha'

export function getRouteSectorById(
  sectorId: string
): RouteMapSector | undefined {
  return ROUTE_MAP_SECTORS.find(sector => sector.id === sectorId)
}

export function getRouteSectorByLevelId(
  levelId: string
): RouteMapSector | undefined {
  return ROUTE_MAP_SECTORS.find(sector => sector.levelId === levelId)
}

export function getLevelPresetForSector(sector: RouteMapSector): LevelConfig {
  return (
    MATCH3_LEVELS.find(level => level.id === sector.levelId) ?? MATCH3_LEVELS[0]
  )
}
