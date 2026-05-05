# Утечки памяти и подписки в проекте

Документ про текущие риски утечек памяти в проекте (на момент 28.04.2026), статус по ним и план устранения.

Формат: проблема -> место в коде -> гипотеза -> действие -> как проверяем.

## 1. Что считаем утечкой в приложении

- Подписки на **'window'** / **'document'** без cleanup.
- **'setInterval' / 'setTimeout'** без явной очистки.
- Observer API (**'PerformanceObserver'**, **'MutationObserver'**, **'ResizeObserver'**) без 'disconnect()'.
- Незавершаемые async-цепочки, которые продолжают держать ссылки после unmount/destroy.
- Неконтролируемый рост коллекций в памяти/'localStorage', которые затем постоянно читаются в UI.

---

## 2. Реальные риски в текущей ветке

Ниже - найденные проблемные места в проекте.

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

Статус:
[x] Исправлено в [feature/7.4-liderboard-api](https://github.com/kirillchistov/42-gamedev-teamwork/issues/61)

### 2.2. Безлимитный рост hero-chat в 'GamePage' + постоянная сериализация (P1)

Почему риск:
- Массив 'heroChatMessages' растет без лимита.
- Любое обновление сериализует весь массив в 'localStorage', что увеличивает пиковое потребление памяти и GC-pressure.
- На долгих игровых сессиях и активном чате это превращается в деградацию UI и рост heap.

Что сделать:
- Ограничить размер истории (например, последние 100 сообщений).
- Делать "санитизацию" при чтении из 'localStorage' (обрезка старого хвоста).

Статус:
[x] Исправлено в рамках [feature/7.4-liderboard-api](https://github.com/kirillchistov/42-gamedev-teamwork/issues/61)

### 2.3. Async-хвосты движка после 'destroy()' без guard-флага (P2)

Почему риск:
- После 'destroy()' часть Promise-цепочек может завершиться позже и выполнить callback.
- Сейчас нет единого 'isDestroyed'-флага для раннего выхода из таких callback.
- Это не всегда "критическая" утечка, но создает риск висящих ссылок и фоновой работы на уже демонтированном экране.

Что сделать:
- Добавить 'let isDestroyed = false', выставлять 'true' в 'destroy()'.
- В '.then(...)' и async-ветках делать ранний 'if (isDestroyed) return'.

---

## 3. Что уже скорректировано в репозитории

Компоненты и страницы корректно снимают слушатели/таймеры - почти эталон для новых задач.

### 3.1. 'GamePage' — клавиша полноэкранного режима

```packages/client/src/pages/GamePage.tsx (261:263)
    window.addEventListener('keydown', onKey)
    return () =>
      window.removeEventListener('keydown', onKey)
```

### 3.2. 'GamePage' — кастомное событие смены фона арены

```packages/client/src/pages/GamePage.tsx (332:342)
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

```packages/client/src/hoc/withAuthGuard.tsx (41:70)
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

```packages/client/src/utils/fullscreen.ts (89:106)
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

## 4. Краткий roadmap улучшений

### Этап 1 (быстрые фиксы, 1 спринт)
- [x] Закрыть P1: очистка timeout в 'logoutThunk'. 
- [x] Ограничить историю hero-chat (state + 'localStorage') и добавить обрезку на чтении.
- Добавить строки в журнал находок (раздел 6) после мержа.

### Этап 2 (стабилизация движка)
- Ввести 'isDestroyed' guard в 'match3/engine/bootstrap.ts'.
- Проверить все '.then(...)'/async-хвосты после 'destroy()' и 'resetIdle()'.
- Зафиксировать минимальный набор smoke-тестов: 30+ переходов '/game/start -> /game/play -> /game/finish'.

### Этап 3 (контроль через Performance API)
- Подключить lightweight-метрики (см. раздел 5).
- Включить long-task мониторинг в dev-сборке.
- Раз в релиз сверять baseline: heap-trend, число listeners, количество long tasks.

---

## 5. Журнал находок (будет заполняться в следующих спринтах)

Дата -> Файл (Модуль) -> Симптом -> Причина -> Исправление -> Статус
|------|----------------|---------|---------|--------------|
- 29.04.2026 ->'userSlice.ts' ('logoutThunk') -> Лишние таймеры после logout -> 'Promise.race' с 'setTimeout' без 'clearTimeout' -> Вынести 'withTimeout' + очистка таймера в 'finally' -> in review
- 29.04.2026 -> 'GamePage.tsx' (hero chat) -> Рост heap и размер 'localStorage' при длительной игре -> Неограниченный массив сообщений + полная сериализация на каждый апдейт -> Лимит истории (например 100) + обрезка на чтении -> in review
- 29.04.2026 -> 'bootstrap.ts' (async callbacks) -> Возможные поздние callback после 'destroy' -> Нет guard-флага для асинхронных цепочек -> 'isDestroyed' + early return во всех '.then/await' хвостах -> open

---

## 6. "Хозяйке на заметку" или "checklist для code review"

- [ ] Любой 'addEventListener' имеет 'removeEventListener' в том же жизненном цикле.
- [ ] Любой 'setTimeout/setInterval' хранит id и очищается в cleanup/'finally'.
- [ ] Для async-цепочек после unmount есть guard ('aborted' / 'isDestroyed' / 'AbortController').
- [ ] Observer API всегда отключается ('disconnect') в cleanup.
- [ ] Для "длинных" игровых сценариев есть замер через 'Performance API' и запись результата в журнал (раздел 6).
