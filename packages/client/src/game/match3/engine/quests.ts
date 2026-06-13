export type QuestColor = 'blue' | 'green' | 'yellow' | 'red' | 'pink' | 'any'

export type QuestSpecialKind = 'bomb' | 'rocket' | 'line' | 'any'

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
  clearedByColor: Partial<Record<QuestColor, number>>
  clearedSpecialByColor: Partial<Record<QuestColor, number>>
  clearedSpecialByKind: Partial<Record<QuestSpecialKind, number>>
  /** Ключ `${color}:${kind}` для фильтра по обоим параметрам. */
  clearedSpecialCombined: Partial<Record<string, number>>
  clearedBlockers: number
}

const QUEST_COLORS: QuestColor[] = [
  'blue',
  'green',
  'yellow',
  'red',
  'pink',
  'any',
]

const QUEST_TYPES: QuestType[] = [
  'clearColor',
  'clearSpecialColor',
  'clearBlockers',
  'composite',
]

const QUEST_SPECIAL_KINDS: QuestSpecialKind[] = [
  'bomb',
  'rocket',
  'line',
  'any',
]

const COLOR_LABELS: Record<QuestColor, string> = {
  any: 'любых',
  blue: 'синих',
  green: 'зелёных',
  yellow: 'жёлтых',
  red: 'красных',
  pink: 'розовых',
}

const SPECIAL_KIND_LABELS: Record<QuestSpecialKind, string> = {
  any: 'спецфишек',
  bomb: 'бомб',
  rocket: 'ракет',
  line: 'лазеров',
}

function clampTargetCount(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(999, Math.floor(n)))
}

function clampFlatScore(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

function clampScoreMultiplier(value: unknown): number | undefined {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.max(1, Math.min(2, n))
}

function sanitizeReward(
  reward: QuestReward | undefined
): QuestReward | undefined {
  if (!reward) return undefined
  const flatScore = clampFlatScore(reward.flatScore)
  const scoreMultiplier = clampScoreMultiplier(reward.scoreMultiplier)
  const next: QuestReward = {}
  if (flatScore > 0) next.flatScore = flatScore
  if (scoreMultiplier !== undefined) {
    next.scoreMultiplier = scoreMultiplier
  }
  return Object.keys(next).length > 0 ? next : undefined
}

function sanitizeQuestPart(
  quest: QuestConfig,
  index: number
): QuestConfig | null {
  if (quest.type === 'composite') return null
  if (!QUEST_TYPES.includes(quest.type)) return null

  const targetCount = clampTargetCount(quest.targetCount)
  const title =
    typeof quest.title === 'string' && quest.title.trim().length > 0
      ? quest.title.trim()
      : buildQuestTitle({
          type: quest.type,
          color: quest.color,
          specialKind: quest.specialKind,
          targetCount,
        })

  const next: QuestConfig = {
    id:
      typeof quest.id === 'string' && quest.id.length > 0
        ? quest.id
        : `quest-part-${index}`,
    title,
    type: quest.type,
    targetCount,
  }

  if (quest.type === 'clearColor') {
    next.color = QUEST_COLORS.includes(quest.color ?? 'any')
      ? quest.color ?? 'any'
      : 'any'
  }

  if (quest.type === 'clearSpecialColor') {
    next.color = QUEST_COLORS.includes(quest.color ?? 'any')
      ? quest.color ?? 'any'
      : 'any'
    next.specialKind = QUEST_SPECIAL_KINDS.includes(quest.specialKind ?? 'any')
      ? quest.specialKind ?? 'any'
      : 'any'
  }

  return next
}

function sanitizeCompositeQuest(
  quest: QuestConfig,
  index: number
): QuestConfig | null {
  const rawParts = Array.isArray(quest.parts) ? quest.parts : []
  const parts = rawParts
    .map((part, partIndex) => sanitizeQuestPart(part, partIndex))
    .filter((part): part is QuestConfig => part !== null)
    .slice(0, 4)

  if (parts.length < 2) return null

  const title =
    typeof quest.title === 'string' && quest.title.trim().length > 0
      ? quest.title.trim()
      : buildQuestTitle({ type: 'composite', parts })

  return {
    id:
      typeof quest.id === 'string' && quest.id.length > 0
        ? quest.id
        : `quest-${index}`,
    title,
    type: 'composite',
    parts,
    reward: sanitizeReward(quest.reward),
  }
}

function sanitizeSingleQuest(
  quest: QuestConfig,
  index: number
): QuestConfig | null {
  if (quest.type === 'composite') {
    return sanitizeCompositeQuest(quest, index)
  }
  const part = sanitizeQuestPart(quest, index)
  if (!part) return null
  return {
    ...part,
    reward: sanitizeReward(quest.reward),
  }
}

export function sanitizeLevelQuests(
  quests: QuestConfig[] | undefined
): QuestConfig[] {
  if (!Array.isArray(quests)) return []
  return quests
    .map((quest, index) => sanitizeSingleQuest(quest, index))
    .filter((quest): quest is QuestConfig => quest !== null)
    .slice(0, 4)
}

export function buildQuestTitle(
  quest: Pick<
    QuestConfig,
    'type' | 'color' | 'specialKind' | 'targetCount' | 'parts'
  >
): string {
  const target = clampTargetCount(quest.targetCount)

  if (quest.type === 'clearColor') {
    if (!quest.color || quest.color === 'any') {
      return `Собрать ${target} фишек`
    }
    return `Очистить ${target} ${COLOR_LABELS[quest.color]}`
  }

  if (quest.type === 'clearBlockers') {
    return `Разрушить ${target} блокеров`
  }

  if (quest.type === 'clearSpecialColor') {
    const kind = quest.specialKind ?? 'any'
    const color = quest.color ?? 'any'
    if (kind !== 'any' && color !== 'any') {
      return `Активировать ${target} ${SPECIAL_KIND_LABELS[kind]} (${COLOR_LABELS[color]})`
    }
    if (kind !== 'any') {
      return `Активировать ${target} ${SPECIAL_KIND_LABELS[kind]}`
    }
    if (color !== 'any') {
      return `Активировать ${target} спецфишек (${COLOR_LABELS[color]})`
    }
    return `Активировать ${target} спецфишек`
  }

  const partsCount = quest.parts?.length ?? 2
  return `Комбо: ${partsCount} задачи`
}

export function activationToQuestSpecialKind(params: {
  type: 'line' | 'bomb'
  orientation?: 'row' | 'col'
}): Exclude<QuestSpecialKind, 'any'> {
  if (params.type === 'bomb') return 'bomb'
  if (params.orientation === 'col') return 'rocket'
  return 'line'
}

export function kindIndexToQuestColor(kindIndex: number): QuestColor {
  const palette: QuestColor[] = ['blue', 'green', 'yellow', 'red', 'pink']
  return palette[Math.abs(kindIndex) % palette.length] ?? 'blue'
}

function toRuntimeQuest(quest: QuestConfig): QuestRuntimeState {
  if (quest.type === 'composite' && quest.parts) {
    const parts = quest.parts.map(toRuntimeQuest)
    return {
      id: quest.id,
      title: quest.title,
      type: quest.type,
      progress: 0,
      target: parts.length,
      completed: false,
      completedAtMove: null,
      parts,
      reward: quest.reward,
    }
  }

  const target = clampTargetCount(quest.targetCount)
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
    reward: quest.reward,
  }
}

export function createInitialQuestProgress(
  quests: QuestConfig[] | undefined
): QuestProgress {
  const runtime = sanitizeLevelQuests(quests).map(toRuntimeQuest)
  return {
    quests: runtime,
    completedCount: 0,
    totalCount: runtime.length,
    activeScoreMultiplier: 1,
    pendingFlatScoreReward: 0,
  }
}

function recomputeCounters(progress: QuestProgress): void {
  progress.totalCount = progress.quests.length
  progress.completedCount = progress.quests.filter(q => q.completed).length
  progress.activeScoreMultiplier = progress.quests
    .filter(q => q.completed)
    .reduce((acc, q) => {
      const m = q.reward?.scoreMultiplier
      if (!m || m <= 0) return acc
      return acc * Math.min(2, m)
    }, 1)
}

function questColorCount(
  delta: ResolveQuestDelta,
  color: QuestColor | undefined
): number {
  if (!color || color === 'any') {
    return Object.values(delta.clearedByColor).reduce(
      (acc, n) => acc + (n ?? 0),
      0
    )
  }
  return delta.clearedByColor[color] ?? 0
}

function questSpecialCount(
  delta: ResolveQuestDelta,
  color: QuestColor | undefined,
  specialKind: QuestSpecialKind | undefined
): number {
  const c = color ?? 'any'
  const k = specialKind ?? 'any'

  if (c !== 'any' && k !== 'any') {
    return delta.clearedSpecialCombined[`${c}:${k}`] ?? 0
  }
  if (k !== 'any') {
    return delta.clearedSpecialByKind[k] ?? 0
  }
  if (c !== 'any') {
    return delta.clearedSpecialByColor[c] ?? 0
  }
  return Object.values(delta.clearedSpecialByKind).reduce(
    (acc, n) => acc + (n ?? 0),
    0
  )
}

function completeQuest(
  quest: QuestRuntimeState,
  progress: QuestProgress,
  moveNumber: number
): void {
  quest.completed = true
  quest.completedAtMove = moveNumber
  progress.pendingFlatScoreReward += quest.reward?.flatScore ?? 0
}

function applyDeltaToQuest(
  quest: QuestRuntimeState,
  delta: ResolveQuestDelta,
  moveNumber: number,
  progress: QuestProgress
): void {
  if (quest.completed) return

  if (quest.type === 'composite' && quest.parts) {
    for (const part of quest.parts) {
      applyDeltaToQuest(part, delta, moveNumber, progress)
    }
    quest.progress = quest.parts.filter(part => part.completed).length
    quest.target = quest.parts.length
    if (quest.parts.every(part => part.completed)) {
      completeQuest(quest, progress, moveNumber)
    }
    return
  }

  if (quest.type === 'clearColor') {
    quest.progress = Math.min(
      quest.target,
      quest.progress + questColorCount(delta, quest.color)
    )
  } else if (quest.type === 'clearBlockers') {
    quest.progress = Math.min(
      quest.target,
      quest.progress + delta.clearedBlockers
    )
  } else if (quest.type === 'clearSpecialColor') {
    quest.progress = Math.min(
      quest.target,
      quest.progress + questSpecialCount(delta, quest.color, quest.specialKind)
    )
  }

  if (quest.progress >= quest.target) {
    completeQuest(quest, progress, moveNumber)
  }
}

export function applyQuestDelta(
  progress: QuestProgress,
  delta: ResolveQuestDelta,
  moveNumber: number
): void {
  for (const quest of progress.quests) {
    applyDeltaToQuest(quest, delta, moveNumber, progress)
  }
  recomputeCounters(progress)
}

export function consumePendingFlatReward(progress: QuestProgress): number {
  const reward = Math.max(0, Math.floor(progress.pendingFlatScoreReward))
  progress.pendingFlatScoreReward = 0
  return reward
}

export const QUEST_COLOR_OPTIONS = QUEST_COLORS.map(value => ({
  value,
  label:
    value === 'any' ? 'Любой' : value.charAt(0).toUpperCase() + value.slice(1),
}))

export const QUEST_TYPE_OPTIONS: Array<{
  value: QuestType
  label: string
}> = [
  { value: 'clearColor', label: 'Очистить цвет' },
  {
    value: 'clearSpecialColor',
    label: 'Активировать спецфишку',
  },
  {
    value: 'clearBlockers',
    label: 'Разрушить блокеры',
  },
  { value: 'composite', label: 'Комбо (несколько задач)' },
]

export const QUEST_SPECIAL_KIND_OPTIONS: Array<{
  value: QuestSpecialKind
  label: string
}> = [
  { value: 'any', label: 'Любая' },
  { value: 'bomb', label: 'Бомба' },
  { value: 'rocket', label: 'Ракета (столбец)' },
  { value: 'line', label: 'Лазер (строка)' },
]
