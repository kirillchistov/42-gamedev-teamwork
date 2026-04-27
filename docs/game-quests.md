# Game Quests (ТЗ)

## 1. Термины

- **Цель** — текущая цель по очкам (`goalScore`).
- **Квесты** — дополнительные условия уровня (до 4), влияющие на прогресс и награды.

Такой нейминг исключает конфликт между "Целью" и многосоставными задачами.

---

## 2. Контракт типов

### 2.1 `quests.ts` (новый файл)

```ts
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
  clearedByColor: Partial<Record<QuestColor, number>>
  clearedSpecialByColor: Partial<Record<QuestColor, number>>
  clearedSpecialByKind: Partial<Record<QuestSpecialKind, number>>
  clearedBlockers: number
}
```

### 2.2 Расширение `LevelConfig`

В `levels.ts`:

```ts
import type { QuestConfig } from './quests'

export type LevelConfig = {
  // ... existing fields
  quests?: QuestConfig[]
}
```

---

## 3. Ограничения и валидация

- `quests.length <= 4`
- для `composite`: `parts.length` в диапазоне `2..4`
- глубина вложенности `composite` не более 1
- `targetCount` в диапазоне `1..999`
- `reward.scoreMultiplier` в диапазоне `1.0..2.0`
- `reward.flatScore >= 0`

---

## 4. Runtime delta от resolve-pass

В `resolvePass.ts` вернуть агрегат по очищенным сущностям:

```ts
type ResolvePassResult = {
  matched: boolean
  nextChain: number
  questDelta: ResolveQuestDelta
}
```

Минимальный `questDelta`:

```ts
const questDelta: ResolveQuestDelta = {
  clearedByColor: {},
  clearedSpecialByColor: {},
  clearedSpecialByKind: {},
  clearedBlockers: 0,
}
```

---

## 5. Алгоритм подсчета квестов

После каждого `runOneResolvePass`:

1. `applyQuestDelta(questProgress, pass.questDelta, hud.moves)`
2. `flatReward = consumePendingFlatReward(questProgress)`
3. `hud.score += flatReward` (если > 0)
4. `hud.questProgress = questProgress`
5. `activeScoreMultiplier = recomputeMultiplier(questProgress)` используется в начислении очков следующих pass

Логика типов:

- `clearColor` -> `delta.clearedByColor[color]`
- `clearSpecialColor` -> по цвету/виду спецфишки
- `clearBlockers` -> `delta.clearedBlockers`
- `composite` -> completed, когда все `parts.completed === true`

---

## 6. Минимальный patch-план

### 6.1 `levels.ts`

- добавить типы через import из `quests.ts`
- добавить `quests?: QuestConfig` в `LevelConfig`
- в пресетах уровней добавить `quests: []` (или demo-квесты)

### 6.2 `bootstrap.ts`

- хранить `questProgress` в runtime
- инициализировать в `setLevel()` и `startPlay()`
- после каждого pass применять `questDelta`
- начислять pending flat reward
- поддержать `activeScoreMultiplier` в score pipeline
- прокидывать `hud.questProgress` в UI

### 6.3 `resolvePass.ts`

- считать `ResolveQuestDelta` на основе реально очищенных сущностей
- вернуть `questDelta` из pass

### 6.4 `GamePage.tsx`

- добавить состояние `quests`
- добавить UI редактирования квестов (до 4)
- пробросить `quests` в `appliedLevel`

### 6.5 `Match3Screen.tsx`

- добавить компактный HUD блок:
  - `Квесты: X/Y`
- в desktop: раскрываемый список прогресса
- в mobile: по умолчанию только `X/Y`, детали в раскрытии

---

## 7. Acceptance Criteria

1. В настройках можно создать до 4 квестов.
2. Квесты применяются к уровню текущей игры.
3. Прогресс квестов обновляется после каждого resolve pass.
4. За выполнение квеста начисляется награда.
5. HUD показывает суммарный и детальный прогресс квестов.
6. Без квестов игра работает как раньше.
7. Мобильный HUD не перегружен.
8. Режимы лимита `ходы/время` и цель по очкам работают корректно с квестами.

---

## 8. MVP и этапы

### MVP (этап 1)

- `clearColor`
- `clearBlockers`
- `flatScore` reward
- HUD: `Квесты X/Y` + простой прогресс

### Этап 2

- `clearSpecialColor`
- `scoreMultiplier`
- editor UI для composite

### Этап 3

- тонкая балансировка наград
- UX-polish мобильного прогресса
- расширенная аналитика по выполнению квестов
