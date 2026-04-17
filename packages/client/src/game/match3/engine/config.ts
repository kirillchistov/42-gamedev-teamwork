/**
 * 6.1.2 Игровые настройки перед стартом:
 * Добавлены опции: GAME_DURATION_OPTIONS (3/5/10 минут)
 * GAME_THEME_OPTIONS (standard | space | math)
 * Добавлены палитры: TILE_COLORS_BY_THEME
 * 6.3.5 Добавлен выбор тематики фишек
 */

// Цвета на поле
export const TILE_COLORS: string[] = [
  '#6ed0ff', // Photon battery
  '#8f93a2', // Asteroid
  '#ff86ca', // Android
  '#ffd166', // Gem
  '#7af28f', // Comet
  '#b99cff', // Nebula crystal
]

// Количество разных типов фишек
export const COUNT_OF_TILE_TYPES =
  TILE_COLORS.length

// Размер поля (по умолчанию 8x8)
export const BOARD_SIZE = 8

export const BOARD_SIZE_OPTIONS = [
  8, 12, 16, 20,
] as const
export type BoardSizeOption =
  typeof BOARD_SIZE_OPTIONS[number]

// 8x8 стандарт. Если доска больше, вариантов фишек тоже будет больше
export const TILE_KINDS_BY_BOARD_SIZE: Record<
  BoardSizeOption,
  number
> = {
  8: COUNT_OF_TILE_TYPES,
  12: COUNT_OF_TILE_TYPES + 1,
  16: COUNT_OF_TILE_TYPES + 1,
  20: COUNT_OF_TILE_TYPES + 2,
}

export const GAME_DURATION_SEC = 3 * 60
export const PRESTART_COUNTDOWN_SEC = 5

export const GAME_DURATION_OPTIONS = [
  3 * 60,
  5 * 60,
  10 * 60,
] as const
export type GameDurationOption =
  typeof GAME_DURATION_OPTIONS[number]

export const GAME_THEME_OPTIONS = [
  'standard',
  'space',
  'math',
] as const
export type GameThemeOption =
  typeof GAME_THEME_OPTIONS[number]

export const GAME_ICON_THEME_OPTIONS = [
  'standard',
  'cosmic',
  'food',
] as const
export type GameIconThemeOption =
  typeof GAME_ICON_THEME_OPTIONS[number]

/** Полный VFX (частицы, вспышка, тряска) или упрощённый (только подсветка на поле). */
export const GAME_VFX_QUALITY_OPTIONS = [
  'full',
  'simple',
] as const
export type GameVfxQualityOption =
  typeof GAME_VFX_QUALITY_OPTIONS[number]

export const TILE_COLORS_BY_THEME: Record<
  GameThemeOption,
  string[]
> = {
  standard: [
    '#ff4d6d',
    '#ffd166',
    '#06d6a0',
    '#4cc9f0',
    '#b517ff',
    '#f72585',
    '#a8dadc',
    '#9b5de5',
  ],
  space: [
    '#6ed0ff',
    '#8f93a2',
    '#ff86ca',
    '#ffd166',
    '#7af28f',
    '#b99cff',
    '#7dd3fc',
    '#fda4af',
  ],
  math: [
    '#22c55e',
    '#0ea5e9',
    '#f59e0b',
    '#a855f7',
    '#ef4444',
    '#14b8a6',
    '#eab308',
    '#6366f1',
  ],
}

/**
 * Множитель длительности анимаций поля и слоя VFX.
 * 1.1 ≈ на ~10% медленнее относительно базовых значений.
 */
export const MATCH3_ANIM_TIME_MULT = 1.1

export function match3AnimMs(
  baseMs: number
): number {
  return Math.max(
    1,
    Math.round(baseMs * MATCH3_ANIM_TIME_MULT)
  )
}

// Другие настройки:
// export const ANIMATION_SPEED = 240;
// export const MATCH_MINIMUM = 3;
