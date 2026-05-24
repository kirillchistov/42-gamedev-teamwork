# Утечки памяти и подписки в проекте
Актульность:  **19.05.2026**
Про риски утечек памяти в проекте, статус и план устранения.

Формат: проблема → в коде → гипотеза → действие → проверка.

## 1. Что считаем утечкой в приложении

- Подписки на 'window' / 'document' без cleanup.
- 'setInterval' / 'setTimeout' без явной очистки.
- Observer API ('PerformanceObserver', 'MutationObserver', 'ResizeObserver') без 'disconnect()'.
- Незавершаемые async-цепочки, которые продолжают держать ссылки после unmount/destroy.
- Неконтролируемый рост коллекций в памяти/'localStorage', которые затем постоянно читаются в UI.

---

## 2. Реальные риски, найденные в проекте

### 2.1. 'logoutThunk': таймер из 'Promise.race' не очищался

**Проблема:** на каждый logout создавался 'setTimeout' без 'clearTimeout', даже если 'userApi.logout()' завершался раньше.

**Как решили:** локальная утилита 'withTimeout' в 'userSlice.ts' снимает таймер в 'finally' (аналогично 'fetchWithTimeout').

```50:69:packages/client/src/slices/userSlice.ts
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
  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
    }
  }) as Promise<T>
}
```

Статус: **[x] исправлено в ['feature/7.4-leaderboard-api'  #61](https://github.com/kirillchistov/42-gamedev-teamwork/issues/61)**.

### 2.2. Безлимитный рост hero-chat в 'GamePage' + постоянная сериализация

**Проблема:** массив сообщений рос без лимита; каждый апдейт сериализовал весь массив в 'localStorage'.

**Как решили:** константа 'HERO_CHAT_MAX_MESSAGES = 100', обрезка при записи и чтении ('slice(-HERO_CHAT_MAX_MESSAGES)').

Статус: **[x] исправлено в [#61](https://github.com/kirillchistov/42-gamedev-teamwork/issues/61)**.

### 2.3. Async-хвосты движка после 'destroy()' без guard-флага

**Проблема:** после 'destroy()' цепочки 'resolveBoard().then(...)' могли ещё вызывать 'emitHud' / 'drawBoard'.

**Как решили:** флаг 'isDestroyed' в 'bootstrap.ts' — выставляется в 'destroy()', проверка в 'resolveBoard' и во всех '.then' после resolve.

Статус: **[x] исправлено (19.05.2026)**

### 2.4. Performance API: массив long task в консоли после паузы

**Симптом:** после снятия паузы — несколько '[Performance] ⚠️ Long task detected', в стеке 'installHook.js' (React DevTools).

**Причина (не утечка памяти):**

- 'buffered: true' у 'PerformanceObserver' отдавал long tasks с момента загрузки страницы при старте observer.
- После паузы — тяжёлый кадр React + canvas; DevTools перехватывает 'console' ('installHook.js').
- Порог long task в браузере — **>50 ms**; 54–106 ms после resume часто нормальны для match-3.

**Как решили ('performanceMetrics.ts'):**

- 'buffered: false'; игнор long tasks на паузе (overlay + 'visibilitychange' + событие 'match3:performance-pause').
- Grace **2.5 s** после resume — не логируем всплеск.
- Вместо 'console.warn' на каждую задачу — сводка 'Session summary' при unmount; детали только при 'VITE_PERF_VERBOSE=1' в dev.

Статус: **[x] исправлено (19.05.2026)**

---

## 3. Что уже исправлено

Компоненты и страницы корректно снимают слушатели/таймеры — эталон для новых задач.

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

### 3.5. 'performanceMetrics' — observer, пауза, сводка сессии

'startPerformanceMonitoring' — 'disconnect' при stop, пауза при overlay форума/вкладке, 'flushSummary' при unmount 'GamePage'.

Подробнее про long tasks и DevTools — **§2.4**.

---

## 4. Краткий roadmap улучшений

### Этап 1 (быстрые фиксы, спринт 7)

- [x] Закрыть P1: очистка timeout в 'logoutThunk'.
- [x] Ограничить историю hero-chat (state + 'localStorage') и обрезку на чтении.
- [x] Записи в журнал находок (раздел 5) обновлены по факту мержа.

### Этап 2 (стабилизация движка)

- [x] Ввести 'isDestroyed' guard в 'match3/engine/bootstrap.ts'.
- [x] Проверить '.then(...)' после 'resolveBoard' на 'destroy()'.
- [ ] Smoke: Много (30+) переходов по цепочке '/game/start' → '/game/play' → '/game/finish' без роста listeners/heap.

### Этап 3 (контроль через Performance API)

- [x] Long-task observer с cleanup ('performanceMetrics.ts').
- [x] Агрегированная сводка вместо warn на каждую задачу; пауза overlay; grace после resume.
- [ ] Раз в релиз сверять baseline: heap-trend, 'Session summary' (long tasks max/count) на '/game/play'.
- [ ] Писать дополнительно сводку в 'sessionStorage' для сравнения билдов.

---

## 5. Журнал находок

| Дата | Файл (модуль) | Симптом | Причина | Исправление | Статус |
| --- | --- | --- | --- | --- | --- |
| 29.04.2026 | 'userSlice.ts' ('logoutThunk') | Лишние таймеры после logout | 'Promise.race' + 'setTimeout' без 'clearTimeout' | 'withTimeout' + очистка в 'finally' | **fixed** |
| 29.04.2026 | 'GamePage.tsx' (hero chat) | Рост heap и 'localStorage' | Неограниченный массив + полная сериализация | 'HERO_CHAT_MAX_MESSAGES = 100', 'slice' на записи/чтении | **fixed** |
| 29.04.2026 | 'bootstrap.ts' (async callbacks) | Поздние callback после 'destroy' | Нет guard-флага | 'isDestroyed' + early return | **fixed** |
| 19.05.2026 | 'performanceMetrics.ts' | — | — | 'PerformanceObserver.disconnect' в cleanup | **fixed** (7.5) |
| 19.05.2026 | 'performanceMetrics.ts' + DevTools | Много warn long task после паузы; installHook.js в стеке | buffered + resume spike + React DevTools | buffered:false, пауза, grace, summary; verbose через VITE_PERF_VERBOSE | **fixed** |

---

## 6. Проверять на каждом ревью

- [ ] Любой 'addEventListener' имеет 'removeEventListener' в том же жизненном цикле.
- [ ] Любой 'setTimeout'/'setInterval' хранит id и очищается в cleanup/'finally'.
- [ ] Для async-цепочек после unmount есть guard ('aborted' / 'isDestroyed' / 'AbortController').
- [ ] Observer API всегда отключается ('disconnect') в cleanup.
- [ ] Для длинных игровых сценариев смотреть 'Session summary' в консоли или журнал (раздел 5); не считать единичные long task >50 ms после паузы багом без роста heap.
