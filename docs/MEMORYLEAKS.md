# Утечки памяти и подписки в проекте

Файл для фиксации **реальных** случаев утечек (или рисков): что наблюдалось, почему это утечка, как исправлено. Шаблон можно дополнять по мере работы команды.

## 1. Что считать утечкой в SPA

- Подписки на **`window`** / **`document`** без снятия в cleanup `useEffect`.
- **`setInterval` / `setTimeout`** без `clearInterval` / `clearTimeout`.
- **`PerformanceObserver`**, **`MutationObserver`**, **`ResizeObserver`** без `disconnect()`.
- Удержание больших объектов в замыканиях обработчиков после ухода со страницы.
- Забытые подписки на стор (редко при RTK) или на кастомные event bus без отписки.

## 2. Хорошие паттерны уже в репозитории (референс)

Эти места **корректно** снимают слушатели — используйте как образец при новых эффектах.

### 2.1. `GamePage` — клавиша полноэкранного режима

```261:263:packages/client/src/pages/GamePage.tsx
    window.addEventListener('keydown', onKey)
    return () =>
      window.removeEventListener('keydown', onKey)
```

### 2.2. `GamePage` — кастомное событие смены фона арены

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

### 2.3. `withAuthGuard` — `storage` и арена

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

### 2.4. Fullscreen — обёртка с симметричным снятием

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

## 3. Журнал находок (заполняет команда)

| Дата | Модуль / файл | Симптом | Причина | Исправление |
|------|----------------|---------|---------|--------------|
| _пример_ | `GamePage.tsx` | Рост памяти при повторных заходах на `/game` | `addEventListener` без `return` cleanup | Добавлен `removeEventListener` в `useEffect` |
| | | | | |

---

## 4. Чеклист при code review

- [ ] Любой `addEventListener` в компоненте имеет пару в cleanup.
- [ ] Любой таймер очищается.
- [ ] Observers и подписки на canvas/WebGL снимаются при `destroy` / unmount (см. движок match-3 при изменениях).

Если новая фича использует **PerformanceObserver** (см. `add-web-api.md`), в той же задаче добавьте строку в таблицу раздела 3 с ссылкой на PR.
