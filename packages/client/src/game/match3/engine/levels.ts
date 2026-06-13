/**
 * 6.1.3 Модели уровней:
 * levels.ts - файл с конфигом уровней
 * LevelConfig с полями: id, title, description, goalType, goalValue,
 * boardSize, durationSec, tileKinds, theme
 * Пресеты: Новичок / Пилот / Асс
 * Хелперы: DEFAULT_MATCH3_LEVEL_ID, getMatch3LevelById
 */
import {
  type BoardSizeOption,
  type GameDurationOption,
  type GameThemeOption,
} from './config'
import type { QuestConfig } from './quests'

export type LevelGoalType = 'score'

export type LevelConfig = {
  id: string
  title: string
  description: string
  goalType: LevelGoalType
  goalValue: number
  boardSize: BoardSizeOption
  durationSec: GameDurationOption
  tileKinds: number
  theme: GameThemeOption
  /** Множитель ледяных клеток: rookie=1, pilot=2, ace=4 */
  iceMultiplier?: 1 | 2 | 4
  /** Количество целевых клеток для механики bomb-target. */
  targetCells?: number
  quests?: QuestConfig[]
}

export const MATCH3_LEVELS: LevelConfig[] = [
  {
    id: 'rookie',
    title: 'Новичок',
    description: 'Короткая партия для разогрева и знакомства с игрой.',
    goalType: 'score',
    goalValue: 1200,
    boardSize: 8,
    durationSec: 3 * 60,
    tileKinds: 6,
    theme: 'standard',
    iceMultiplier: 1,
    targetCells: undefined,
    quests: [
      {
        id: 'rookie-clear-any',
        title: 'Собрать 20 фишек',
        type: 'clearColor',
        color: 'any',
        targetCount: 20,
        reward: { flatScore: 120 },
      },
    ],
  },
  {
    id: 'pilot',
    title: 'Пилот',
    description: 'Средняя сложность: больше видов фишек и плотный темп.',
    goalType: 'score',
    goalValue: 2600,
    boardSize: 12,
    durationSec: 5 * 60,
    tileKinds: 7,
    theme: 'space',
    iceMultiplier: 2,
    targetCells: 4,
    quests: [
      {
        id: 'pilot-clear-green',
        title: 'Очистить 15 зелёных',
        type: 'clearColor',
        color: 'green',
        targetCount: 15,
        reward: { flatScore: 200 },
      },
      {
        id: 'pilot-blockers',
        title: 'Разрушить 3 блокера',
        type: 'clearBlockers',
        targetCount: 3,
        reward: { flatScore: 250, scoreMultiplier: 1.1 },
      },
      {
        id: 'pilot-special-bomb',
        title: 'Активировать 2 бомбы',
        type: 'clearSpecialColor',
        specialKind: 'bomb',
        targetCount: 2,
        reward: { flatScore: 180 },
      },
    ],
  },
  {
    id: 'ace',
    title: 'Асс',
    description: 'Сложный режим с большим полем и высоким порогом выигрыша.',
    goalType: 'score',
    goalValue: 5200,
    boardSize: 16,
    durationSec: 10 * 60,
    tileKinds: 8,
    theme: 'math',
    iceMultiplier: 4,
    targetCells: 8,
    quests: [
      {
        id: 'ace-composite',
        title: 'Комбо: 2 задачи',
        type: 'composite',
        parts: [
          {
            id: 'ace-part-red',
            title: 'Очистить 25 красных',
            type: 'clearColor',
            color: 'red',
            targetCount: 25,
          },
          {
            id: 'ace-part-blockers',
            title: 'Разрушить 5 блокеров',
            type: 'clearBlockers',
            targetCount: 5,
          },
        ],
        reward: { flatScore: 400, scoreMultiplier: 1.15 },
      },
      {
        id: 'ace-special-rocket',
        title: 'Активировать 3 ракеты',
        type: 'clearSpecialColor',
        specialKind: 'rocket',
        targetCount: 3,
        reward: { flatScore: 220 },
      },
    ],
  },
]

export const DEFAULT_MATCH3_LEVEL_ID = MATCH3_LEVELS[0]?.id ?? 'rookie'

export function getMatch3LevelById(levelId: string): LevelConfig {
  return MATCH3_LEVELS.find(level => level.id === levelId) ?? MATCH3_LEVELS[0]
}
