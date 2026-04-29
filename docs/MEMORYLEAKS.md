# Утечки памяти и подписки в проекте

Документ фиксирует текущие риски утечек памяти в проекте (на момент 28.04.2026), статус по ним и план устранения.

Формат: проблема -> место в коде -> гипотеза -> действие -> как проверяем.

## 1. Что считаем утечкой в приложении

- Подписки на **'window'** / **'document'** без cleanup.
- **'setInterval' / 'setTimeout'** без явной очистки.
- Observer API (**'PerformanceObserver'**, **'MutationObserver'**, **'ResizeObserver'**) без 'disconnect()'.
- Незавершаемые async-цепочки, которые продолжают держать ссылки после unmount/destroy.
- Неконтролируемый рост коллекций в памяти/'localStorage', которые затем постоянно читаются в UI.

---

## 2. Реальные риски в текущей ветке

Ниже не "теория", а конкретные места, которые уже стоит закрыть.

### 2.1. 'logoutThunk': таймер из 'Promise.race' не очищается (P1)

```215:222:packages/client/src/slices/userSlice.ts
      await Promise.race([
        userApi.logout(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error('timeout'))
          }, AUTH_REQUEST_TIMEOUT_MS)
        }),
      ])
```

Почему риск:
- На каждый logout создается новый 'setTimeout', но id не сохраняется и не очищается.
- Даже если 'userApi.logout()' завершился быстро, timeout доживает до конца и удерживает замыкание.
- При частых logout/login это "тихая" утечка таймеров и лишняя нагрузка на event loop.

Что сделать:
- Вынести в утилиту 'withTimeout' с 'clearTimeout' в 'finally' (как уже сделано в 'fetchWithTimeout').

Минимальная врезка по месту ('packages/client/src/slices/userSlice.ts'):

```ts
// после fetchWithTimeout
function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  let timeoutId: number | null = null
  const timeoutPromise = new Promise<never>(
    (_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('timeout'))
      }, ms)
    }
  )
  return Promise.race([promise, timeoutPromise]).finally(
    () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  ) as Promise<T>
}
```

```ts
// logoutThunk целиком
export const logoutThunk = createAsyncThunk(
  'user/logout',
  async () => {
    try {
      await withTimeout(
        userApi.logout(),
        AUTH_REQUEST_TIMEOUT_MS
      )
    } catch {
      console.log(
        'сеть/таймаут: локально очищаем сессию'
      )
    }
  }
)
```

### 2.2. Неограниченный рост hero-chat в 'GamePage' + постоянная сериализация (P1)

```983:993:packages/client/src/pages/GamePage.tsx
  const handleSendHeroChatMessage = useCallback(
    (text: string) => {
      setHeroChatMessages(prev => [
        ...prev,
        {
          id: `hero-chat-${Date.now()}`,
          author: 'Вы',
          text,
          createdAt: new Date().toISOString(),
        },
      ])
```

```563:568:packages/client/src/pages/GamePage.tsx
      window.localStorage.setItem(
        `${HERO_CHAT_STORAGE_KEY_PREFIX}${activeCompanionId}`,
        JSON.stringify(heroChatMessages)
      )
```

Почему риск:
- Массив 'heroChatMessages' растет без лимита.
- Любое обновление сериализует весь массив в 'localStorage', что увеличивает пиковое потребление памяти и GC-pressure.
- На долгих игровых сессиях и активном чате это превращается в деградацию UI и рост heap.

Что сделать:
- Ограничить размер истории (например, последние 100 сообщений).
- Делать "санитизацию" при чтении из 'localStorage' (обрезка старого хвоста).

Минимальные врезки по месту ('packages/client/src/pages/GamePage.tsx'):

```ts
// Перед или после HERO_CHAT_STORAGE_KEY_PREFIX
const HERO_CHAT_MAX_MESSAGES = 100
```

```ts
// в readHeroChatMessages(...)
const parsed = JSON.parse(raw) as Array<{
  id: string
  author: string
  text: string
  createdAt: string
}>
if (!Array.isArray(parsed) || parsed.length === 0) {
  return buildDefaultHeroChatMessages(companionId)
}
return parsed.slice(-HERO_CHAT_MAX_MESSAGES)
```

```ts
// в handleSendHeroChatMessage
setHeroChatMessages(prev =>
  [
    ...prev,
    {
      id: `hero-chat-${Date.now()}`,
      author: 'Вы',
      text,
      createdAt: new Date().toISOString(),
    },
  ].slice(-HERO_CHAT_MAX_MESSAGES)
)
```

```ts
// в эффекте записи localStorage
const trimmed = heroChatMessages.slice(
  -HERO_CHAT_MAX_MESSAGES
)
window.localStorage.setItem(
  `${HERO_CHAT_STORAGE_KEY_PREFIX}${activeCompanionId}`,
  JSON.stringify(trimmed)
)
```

### 2.3. Async-хвосты движка после 'destroy()' без guard-флага (P2)

```1330:1333:packages/client/src/game/match3/engine/bootstrap.ts
    void preloadIconTheme(iconTheme).then(() => {
      if (phase === 'ended') return
      drawBoard()
    })
```

```1265:1268:packages/client/src/game/match3/engine/bootstrap.ts
    void resolveBoard().then(() => {
      emitHud()
      scheduleHint()
    })
```

Почему риск:
- После 'destroy()' часть Promise-цепочек может завершиться позже и выполнить callback.
- Сейчас нет единого 'isDestroyed'-флага для раннего выхода из таких callback.
- Это не всегда "критическая" утечка, но создает риск висящих ссылок и фоновой работы на уже демонтированном экране.

Что сделать:
- Добавить 'let isDestroyed = false', выставлять 'true' в 'destroy()'.
- В '.then(...)' и async-ветках делать ранний 'if (isDestroyed) return'.

---

## 3. Хорошие паттерны уже в репозитории (референс)

Эти места корректно снимают слушатели/таймеры - использовать как эталон при новых задачах.

### 3.1. 'GamePage' — клавиша полноэкранного режима

```261:263:packages/client/src/pages/GamePage.tsx
    window.addEventListener('keydown', onKey)
    return () =>
      window.removeEventListener('keydown', onKey)
```

### 3.2. 'GamePage' — кастомное событие смены фона арены

```332:342:packages/client/src/pages/GamePage.tsx
  useEffect(() => {
    const on = () => bumpFinishArenaBg()
    window.addEventListener(
      ARENA_BG_CHANGED_EVENT,
      on
    )
    return () =>
      window.removeEventListener(
        ARENA_BG_CHANGED_EVENT,
        on
      )
  }, [])
```

### 3.3. 'withAuthGuard' — 'storage' и арена

```41:70:packages/client/src/hoc/withAuthGuard.tsx
    useEffect(() => {
      const bump = () =>
        setArenaBgTick(n => n + 1)
      bump()
      const onStorage = (e: StorageEvent) => {
        if (
          e.key == null ||
          e.key.startsWith('match3:arena-bg')
        ) {
          bump()
        }
      }
      window.addEventListener(
        'storage',
        onStorage
      )
      window.addEventListener(
        ARENA_BG_CHANGED_EVENT,
        bump
      )
      return () => {
        window.removeEventListener(
          'storage',
          onStorage
        )
        window.removeEventListener(
          ARENA_BG_CHANGED_EVENT,
          bump
        )
      }
    }, [])
```

### 3.4. Fullscreen — обёртка с симметричным снятием

```89:106:packages/client/src/utils/fullscreen.ts
export function addFullscreenChangeListener(
  listener: () => void
): () => void {
  document.addEventListener(
    'fullscreenchange',
    listener
  )
  document.addEventListener(
    'webkitfullscreenchange',
    listener
  )
  return () => {
    document.removeEventListener(
      'fullscreenchange',
      listener
    )
    document.removeEventListener(
      'webkitfullscreenchange',
      listener
    )
  }
}
```

---

## 4. Краткий roadmap устранения

### Этап 1 (быстрые фиксы, 1 спринт)
- Закрыть P1: очистка timeout в 'logoutThunk'.
- Ограничить историю hero-chat (state + 'localStorage') и добавить обрезку на чтении.
- Добавить строки в журнал находок (раздел 6) после мержа.

### Этап 2 (стабилизация движка)
- Ввести 'isDestroyed' guard в 'match3/engine/bootstrap.ts'.
- Проверить все '.then(...)'/async-хвосты после 'destroy()' и 'resetIdle()'.
- Зафиксировать минимальный набор smoke-тестов: 30+ переходов '/game/start -> /game/play -> /game/finish'.

### Этап 3 (инструментальный контроль через Performance API)
- Подключить lightweight-метрики (см. раздел 5).
- Включить long-task мониторинг в dev-сборке.
- Раз в релиз сверять baseline: heap-trend, число listeners, количество long tasks.

---

## 5. Инструкция по подключению Performance API

Цель: не только "чинить", но и подтверждать, что фиксы реально убрали утечки/деградации.

### 5.1. Что измеряем
- Длительность игровой сессии (mark/measure).
- Long tasks ('PerformanceObserver', порог 50ms).
- Тренд heap в Chrome ('performance.memory.usedJSHeapSize', только где доступно).

### 5.2. Базовая утилита

Создать 'packages/client/src/utils/performanceMetrics.ts':

```ts
const marks = {
  gameStart: 'match3:session:start',
  gameEnd: 'match3:session:end',
} as const

export function markGameStart() {
  performance.mark(marks.gameStart)
}

export function markGameEndAndMeasure(): number | null {
  performance.mark(marks.gameEnd)
  performance.measure('match3-session', marks.gameStart, marks.gameEnd)
  const list = performance.getEntriesByName('match3-session')
  const last = list[list.length - 1]
  performance.clearMarks(marks.gameStart)
  performance.clearMarks(marks.gameEnd)
  performance.clearMeasures('match3-session')
  return last?.duration ?? null
}

export function observeLongTasks(onLongTask: (ms: number) => void) {
  if (typeof PerformanceObserver === 'undefined') return () => {}
  const obs = new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      if (e.duration > 50) onLongTask(e.duration)
    }
  })
  obs.observe({ type: 'longtask', buffered: true })
  return () => obs.disconnect()
}
```

### 5.3. Куда подключить в текущем приложении
- 'GamePage' / 'Match3Screen':
  - при старте партии: 'markGameStart()';
  - в 'onGameFinished': 'markGameEndAndMeasure()';
  - в 'useEffect': подписка 'observeLongTasks(...)' и cleanup через 'disconnect'.

### 5.4. Критерий "фикс успешен"
- После 20-30 циклов захода в игру heap не показывает устойчивого роста.
- Количество активных listeners после возврата на лендинг не растет от цикла к циклу.
- Long tasks не увеличиваются после фиксов P1/P2.

---

## 6. Журнал находок (заполняет команда)

| Дата | Модуль / файл | Симптом | Причина | Исправление | Статус |
|------|----------------|---------|---------|--------------|
| 2026-04-29 | 'userSlice.ts' ('logoutThunk') | Лишние таймеры после logout | 'Promise.race' с 'setTimeout' без 'clearTimeout' | Вынести 'withTimeout' + очистка таймера в 'finally' | open |
| 2026-04-29 | 'GamePage.tsx' (hero chat) | Рост heap и размер 'localStorage' при длительной игре | Неограниченный массив сообщений + полная сериализация на каждый апдейт | Лимит истории (например 100) + обрезка на чтении | open |
| 2026-04-29 | 'bootstrap.ts' (async callbacks) | Возможные поздние callback после 'destroy' | Нет guard-флага для асинхронных цепочек | 'isDestroyed' + early return во всех '.then/await' хвостах | open |

---

## 7. Чеклист при code review

- [ ] Любой 'addEventListener' имеет 'removeEventListener' в том же жизненном цикле.
- [ ] Любой 'setTimeout/setInterval' хранит id и очищается в cleanup/'finally'.
- [ ] Для async-цепочек после unmount есть guard ('aborted' / 'isDestroyed' / 'AbortController').
- [ ] Observer API всегда отключается ('disconnect') в cleanup.
- [ ] Для "длинных" игровых сценариев есть замер через 'Performance API' и запись результата в журнал (раздел 6).
