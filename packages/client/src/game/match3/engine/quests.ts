import type { LevelConfig } from './levels'

export type QuestColor =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'pink'
  | 'any'

export type QuestSpecialKind =
  | 'bomb'
  | 'rocket'
  | 'line'
  | 'any'

export type QuestType =
  | 'clearColor'
  | 'clearSpecialColor'
  | 'clearBlockers'
  | 'composite'

export type QuestReward = {
  flatScore?: number
  scoreMultiplier?: number
}

export type QuestConfig = {
  id: string
  title: string
  type: QuestType
  targetCount?: number
  color?: QuestColor
  specialKind?: QuestSpecialKind
  parts?: QuestConfig[]
  reward?: QuestReward
}

export type QuestRuntimeState = {
  id: string
  title: string
  type: QuestType
  progress: number
  target: number
  completed: boolean
  completedAtMove: number | null
  color?: QuestColor
  specialKind?: QuestSpecialKind
  parts?: QuestRuntimeState[]
  reward?: QuestReward
}

export type QuestProgress = {
  quests: QuestRuntimeState[]
  completedCount: number
  totalCount: number
  activeScoreMultiplier: number
  pendingFlatScoreReward: number
}

export type ResolveQuestDelta = {
  clearedByColor: Partial<
    Record<QuestColor, number>
  >
  clearedSpecialByColor: Partial<
    Record<QuestColor, number>
  >
  clearedSpecialByKind: Partial<
    Record<QuestSpecialKind, number>
  >
  clearedBlockers: number
}

export function sanitizeLevelQuests(
  level: LevelConfig
): QuestConfig[] {
  return Array.isArray(level.quests)
    ? level.quests.slice(0, 4)
    : []
}
