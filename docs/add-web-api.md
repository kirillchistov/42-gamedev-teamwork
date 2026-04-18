# Дополнительный Web API (кроме Fullscreen)

В проекте **Fullscreen API** уже обёрнут и используется:

- `packages/client/src/utils/fullscreen.ts` — `enterFullscreen`, `exitFullscreen`, `toggleFullscreen`, `addFullscreenChangeListener` (с учётом Safari `webkit*`).
- `packages/client/src/components/Header/index.tsx` — кнопка полноэкранного режима на игре, подписка на `fullscreenchange` с очисткой в `useEffect`.

Задание: добавить **ещё один** API из списка. Ниже — рекомендация **Performance API** (измерение длительности кадров / навигации), с конкретными врезками под match-3.

Альтернативы из списка задания:

| API | Идея применения в Cosmic Match |
|-----|----------------------------------|
| **Geolocation** | Мало связано с геймплеем; можно показать «регион» в профиле или пасхалку (нужен явный запрос разрешения). |
| **Notifications** | Уведомление о конце таймера игры при свёрнутой вкладке (нужен `Notification.requestPermission()`). |
| **Performance** | Замеры FPS, длительности партии, `longtask` — полезно для отчёта и отладки производительности. |

Документация MDN: [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance).

---

## 1. Врезка: утилита замеров

Новый файл `packages/client/src/utils/performanceMetrics.ts`:

```ts
const marks = {
  match3SessionStart: 'match3:session:start',
  match3SessionEnd: 'match3:session:end',
} as const

export function markMatch3SessionStart() {
  if (
    typeof performance === 'undefined' ||
    typeof performance.mark !== 'function'
  ) {
    return
  }
  try {
    performance.mark(marks.match3SessionStart)
  } catch {
    /* ignore */
  }
}

export function measureMatch3SessionEnd(): number | null {
  if (
    typeof performance === 'undefined' ||
    typeof performance.mark !== 'function' ||
    typeof performance.measure !== 'function'
  ) {
    return null
  }
  try {
    performance.mark(marks.match3SessionEnd)
    performance.measure(
      'match3-session',
      marks.match3SessionStart,
      marks.match3SessionEnd
    )
    const entries =
      performance.getEntriesByName('match3-session')
    const last = entries[entries.length - 1]
    performance.clearMarks(marks.match3SessionStart)
    performance.clearMarks(marks.match3SessionEnd)
    performance.clearMeasures('match3-session')
    return last?.duration ?? null
  } catch {
    return null
  }
}
```

---

## 2. Врезка: вызов из игры

В **`packages/client/src/pages/GamePage.tsx`** (или в `Match3Screen.tsx`, где стартует «живая» партия):

1. При входе на игровой экран / старте сессии вызвать **`markMatch3SessionStart()`**.
2. В обработчике завершения партии (рядом с записью `LAST_RESULT_KEY` и навигацией) вызвать **`measureMatch3SessionEnd()`** и, например, добавить длительность в объект результата в `sessionStorage` или отправить в лидерборд как дополнительное поле в `data`.

Пример в конце обработчика (псевдокод места):

```ts
import {
  markMatch3SessionStart,
  measureMatch3SessionEnd,
} from '../utils/performanceMetrics'

// при старте партии:
markMatch3SessionStart()

// при onGameEnd / сохранении результата:
const sessionMs = measureMatch3SessionEnd()
if (sessionMs != null) {
  console.debug(
    '[Performance] match3 session ms:',
    sessionMs
  )
}
```

Точное место вставки найдите по **`onGameEnd`** в `GamePage.tsx` / `Match3Screen.tsx`.

---

## 3. Опционально: PerformanceObserver (long tasks)

Для отчёта о «долгих задачах» в главном потоке (подвисания):

```ts
export function observeLongTasks(
  onLong: (duration: number) => void
) {
  if (
    typeof PerformanceObserver === 'undefined'
  ) {
    return () => {}
  }
  try {
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.duration > 50)
          onLong(e.duration)
      }
    })
    obs.observe({
      type: 'longtask',
      buffered: true,
    })
    return () => obs.disconnect()
  } catch {
    return () => {}
  }
}
```

Подключайте в `GamePage` в `useEffect` с возвратом функции очистки **`disconnect`**, чтобы не оставлять подписку после ухода со страницы (см. также `MEMORYLEAKS.md`).

---

## 4. Критерий готовности

- Пользовательски заметная фича на базе выбранного API (не только `console.log`).
- Нет утечек: слушатели / observer отключаются при размонтировании.
- Краткий комментарий в коде или в PR: зачем API и где смотреть результат.
