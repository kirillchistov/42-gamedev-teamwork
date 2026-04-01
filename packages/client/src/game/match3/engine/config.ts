// Цель: настройка игры
// Что можно менять: цвета, формулы, правила игры!

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

export const GAME_DURATION_SEC = 5 * 60
export const PRESTART_COUNTDOWN_SEC = 5

// Другие настройки:
// export const ANIMATION_SPEED = 240;
// export const MATCH_MINIMUM = 3;
