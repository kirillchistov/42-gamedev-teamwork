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
  quests: QuestConfig[] | undefined
): QuestConfig[] {
  return Array.isArray(quests)
    ? quests.slice(0, 4)
    : []
}

function toRuntimeQuest(
  quest: QuestConfig
): QuestRuntimeState {
  const target = Math.max(
    1,
    Math.min(999, quest.targetCount ?? 1)
  )
  return {
    id: quest.id,
    title: quest.title,
    type: quest.type,
    progress: 0,
    target,
    completed: false,
    completedAtMove: null,
    color: quest.color,
    specialKind: quest.specialKind,
    parts: Array.isArray(quest.parts)
      ? quest.parts
          .map(toRuntimeQuest)
          .slice(0, 4)
      : undefined,
    reward: quest.reward,
  }
}

export function createInitialQuestProgress(
  quests: QuestConfig[] | undefined
): QuestProgress {
  const runtime = sanitizeLevelQuests(quests).map(
    toRuntimeQuest
  )
  return {
    quests: runtime,
    completedCount: 0,
    totalCount: runtime.length,
    activeScoreMultiplier: 1,
    pendingFlatScoreReward: 0,
  }
}

function recomputeCounters(
  progress: QuestProgress
): void {
  progress.totalCount = progress.quests.length
  progress.completedCount =
    progress.quests.filter(
      q => q.completed
    ).length
  progress.activeScoreMultiplier = progress.quests
    .filter(q => q.completed)
    .reduce((acc, q) => {
      const m = q.reward?.scoreMultiplier
      if (!m || m <= 0) return acc
      return acc * m
    }, 1)
}

function questColorCount(
  delta: ResolveQuestDelta,
  color: QuestColor | undefined
): number {
  if (!color || color === 'any') {
    return Object.values(
      delta.clearedByColor
    ).reduce((acc, n) => acc + (n ?? 0), 0)
  }
  return delta.clearedByColor[color] ?? 0
}

export function applyQuestDelta(
  progress: QuestProgress,
  delta: ResolveQuestDelta,
  moveNumber: number
): void {
  for (const quest of progress.quests) {
    if (quest.completed) continue
    if (quest.type === 'clearColor') {
      quest.progress = Math.min(
        quest.target,
        quest.progress +
          questColorCount(delta, quest.color)
      )
    } else if (quest.type === 'clearBlockers') {
      quest.progress = Math.min(
        quest.target,
        quest.progress + delta.clearedBlockers
      )
    }
    if (quest.progress >= quest.target) {
      quest.completed = true
      quest.completedAtMove = moveNumber
      progress.pendingFlatScoreReward +=
        quest.reward?.flatScore ?? 0
    }
  }
  recomputeCounters(progress)
}

export function consumePendingFlatReward(
  progress: QuestProgress
): number {
  const reward = Math.max(
    0,
    Math.floor(progress.pendingFlatScoreReward)
  )
  progress.pendingFlatScoreReward = 0
  return reward
}
