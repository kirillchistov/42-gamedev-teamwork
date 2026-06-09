# Подключение Web API (задача 9.3)

> **Web API** — браузерные API (Notifications, Geolocation, Page Visibility, Vibration).  
> Обзор статуса — [project-web-api.md](./project-web-api.md).

## Статус в ветках

| Ветка | Код 9.3 (Notification, Geolocation, Page Visibility, Vibration) |
|-------|-------------------------------------------------------------------|
| `feature/9.3-add-webapi` | **есть** — полная реализация + тесты |
| `feature/9.8-final-demo` (текущая) | **нет** — в docs только план; нужен merge/cherry-pick с `9.3` |

Перенести код на текущую ветку:

```bash
git fetch origin
git checkout feature/9.8-final-demo   # или ваша рабочая ветка

git checkout origin/feature/9.3-add-webapi -- \
  packages/client/src/utils/notifications.ts \
  packages/client/src/utils/notifications.test.ts \
  packages/client/src/utils/geolocation.ts \
  packages/client/src/utils/geolocation.test.ts \
  packages/client/src/utils/pageVisibility.ts \
  packages/client/src/utils/pageVisibility.test.ts \
  packages/client/src/utils/vibration.ts \
  packages/client/src/utils/webApiStorage.ts \
  packages/client/src/hooks/useGameReturnNotification.ts \
  packages/client/src/hooks/usePageVisibilityPause.ts \
  packages/client/src/pages/GamePage.tsx \
  packages/client/src/pages/ProfilePage.tsx \
  packages/client/src/game/match3/Match3Screen.tsx

# CSP для Geolocation (если ещё geolocation=()):
# packages/client/server/csp.ts — Permissions-Policy: geolocation=(self)
```

После checkout — `yarn workspace client typecheck` и тесты из разделов ниже.

---

## Порядок внедрения

1. **Notification API**
2. **Geolocation API**
3. **Page Visibility API**
4. **Vibration API**

После каждой итерации: `yarn workspace client typecheck`.

---

## Уже сделано (не повторять в 9.3)

| Спринт | API | Где |
|--------|-----|-----|
| 6.6 | **Fullscreen** | `packages/client/src/utils/fullscreen.ts`, Header, `GamePage` |
| 7.5 | **Performance** | `performanceMetrics.ts`, `GamePage`, `Match3Screen` |
| — | **localStorage / sessionStorage** | настройки, прогресс, форум |
| — | **Speech Synthesis** | `HieroglyphCardOverlay.tsx` — не для 9.3 |

`visibilitychange` в `performanceMetrics.ts` паузит только longtask observer, **не** игровой таймер.

---

## Итерация 1 — Notification API

### Файлы

| Путь |
|------|
| `packages/client/src/utils/notifications.ts` |
| `packages/client/src/hooks/useGameReturnNotification.ts` |
| `packages/client/src/utils/notifications.test.ts` |
| `packages/client/src/pages/GamePage.tsx` |

### `notifications.ts` (util)

```typescript
export const NOTIFICATIONS_OPT_IN_KEY = 'match3:notifications-opt-in'
export const GAME_RETURN_REMIND_MS = 120_000

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && typeof Notification !== 'undefined'
}

export function readNotificationsOptIn(): boolean {
  try {
    return window.localStorage.getItem(NOTIFICATIONS_OPT_IN_KEY) === '1'
  } catch {
    return false
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function showGameReturnNotification(): boolean {
  if (Notification.permission !== 'granted') return false
  new Notification('Cosmic Match', {
    body: 'Партия ждёт — вернитесь в игру, когда будет удобно.',
    tag: 'cosmic-match-return',
  })
  return true
}
```

Полный файл — ~90 строк (см. ветку `feature/9.3-add-webapi`).

### `useGameReturnNotification.ts` (hook)

```typescript
import { useEffect } from 'react'
import {
  GAME_RETURN_REMIND_MS,
  getNotificationPermission,
  readNotificationsOptIn,
  showGameReturnNotification,
} from '../utils/notifications'

export function useGameReturnNotification(activeOnPage: boolean): void {
  useEffect(() => {
    if (!activeOnPage || !readNotificationsOptIn()) return
    if (getNotificationPermission() !== 'granted') return

    let timer: number | null = null
    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }
    }

    const onVisibility = () => {
      clearTimer()
      if (document.visibilityState !== 'hidden') return
      timer = window.setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          showGameReturnNotification()
        }
      }, GAME_RETURN_REMIND_MS)
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [activeOnPage])
}
```

### Врезка в `GamePage.tsx`

```typescript
import { useGameReturnNotification } from '../hooks/useGameReturnNotification'
import {
  getNotificationPermission,
  isNotificationSupported,
  readNotificationsOptIn,
  requestNotificationPermission,
  writeNotificationsOptIn,
} from '../utils/notifications'

// state
const [notificationsOptIn, setNotificationsOptIn] = useState(() =>
  readNotificationsOptIn()
)

const isOnGameSection =
  location.pathname === '/game/play' ||
  location.pathname === '/game/start' ||
  location.pathname === '/game'

useGameReturnNotification(isOnGameSection && notificationsOptIn)

// в панели настроек — select «Напоминания (уведомления)»:
// при включении → requestNotificationPermission(), при denied — сброс opt-in
```

### Проверка

```bash
yarn workspace client test src/utils/notifications.test.ts
```

---

## Итерация 2 — Geolocation API

### Файлы

| Путь |
|------|
| `packages/client/src/utils/geolocation.ts` |
| `packages/client/src/utils/geolocation.test.ts` |
| `packages/client/src/pages/ProfilePage.tsx` |
| `packages/client/server/csp.ts` — `geolocation=(self)` |

### `geolocation.ts` (ключевые части)

```typescript
export const PROFILE_REGION_KEY = 'profile:coarse-region'

export type CoarseRegion = {
  label: string
  timezone: string
  source: 'intl' | 'geolocation'
}

export function getTimezoneRegion(): CoarseRegion {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    label: timezone.replace(/_/g, ' '),
    timezone,
    source: 'intl',
  }
}

export function resolveCoarseRegion(options?: {
  useGeolocation?: boolean
}): Promise<GeolocationResolveResult> {
  if (!options?.useGeolocation) {
    const region = getTimezoneRegion()
    writeStoredCoarseRegion(region)
    return Promise.resolve({ ok: true, region })
  }
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const region: CoarseRegion = {
          label: `≈ ${Math.round(pos.coords.latitude * 10) / 10}°, …`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: 'geolocation',
        }
        writeStoredCoarseRegion(region)
        resolve({ ok: true, region })
      },
      err => resolve({ ok: false, reason: '…' }),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 }
    )
  })
}
```

### CSP (`csp.ts`)

```typescript
res.setHeader(
  'Permissions-Policy',
  'camera=(), microphone=(), geolocation=(self)'
)
```

### Врезка в `ProfilePage.tsx`

```typescript
import {
  getTimezoneRegion,
  isGeolocationSupported,
  readStoredCoarseRegion,
  resolveCoarseRegion,
} from '../utils/geolocation'

const handleDetectTimezone = () => {
  setCoarseRegion(getTimezoneRegion())
}

const handleDetectGeolocation = async () => {
  const result = await resolveCoarseRegion({ useGeolocation: true })
  if (result.ok) setCoarseRegion(result.region)
  else setRegionError(result.reason)
}

// UI: блок «Регион (приблизительно)» + кнопки «Часовой пояс» / «С геолокацией»
```

---

## Итерация 3 — Page Visibility API

### Файлы

| Путь |
|------|
| `packages/client/src/utils/pageVisibility.ts` |
| `packages/client/src/utils/webApiStorage.ts` |
| `packages/client/src/hooks/usePageVisibilityPause.ts` |
| `packages/client/src/utils/pageVisibility.test.ts` |
| `packages/client/src/game/match3/Match3Screen.tsx` |
| `packages/client/src/pages/GamePage.tsx` |

### `pageVisibility.ts`

```typescript
export function subscribePageVisibility(
  onChange: (hidden: boolean) => void
): () => void {
  if (typeof document === 'undefined' || !document.visibilityState) {
    return () => undefined
  }

  const handler = () => {
    onChange(document.visibilityState === 'hidden')
  }

  handler()
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}
```

### `webApiStorage.ts`

```typescript
export const PAUSE_ON_TAB_HIDDEN_KEY = 'match3:pause-on-tab-hidden'

export function readPauseOnTabHidden(): boolean {
  const raw = window.localStorage.getItem(PAUSE_ON_TAB_HIDDEN_KEY)
  return raw === null ? true : raw === '1'
}
```

### `usePageVisibilityPause.ts`

```typescript
export function usePageVisibilityPause({
  uiPhase,
  isPauseOpen,
  setIsPauseOpen,
  pauseOnTabHidden,
}: Options): boolean {
  const [pausedByVisibility, setPausedByVisibility] = useState(false)

  useEffect(() => {
    if (!pauseOnTabHidden) return
    return subscribePageVisibility(hidden => {
      if (uiPhase !== 'playing') return
      if (hidden) {
        setIsPauseOpen(true)
        setPausedByVisibility(true)
      } else {
        setPausedByVisibility(false)
      }
    })
  }, [uiPhase, setIsPauseOpen, pauseOnTabHidden])

  return pausedByVisibility
}
```

Пауза шлёт `MATCH3_PERF_PAUSE_EVENT` через уже существующий `useEffect` на `isPauseOpen` в `Match3Screen`.

### Врезка в `Match3Screen.tsx`

```typescript
import { usePageVisibilityPause } from '../../hooks/usePageVisibilityPause'

// props
vibrationEnabled?: boolean
pauseOnTabHidden?: boolean

const pausedByVisibility = usePageVisibilityPause({
  uiPhase,
  isPauseOpen,
  setIsPauseOpen,
  pauseOnTabHidden,
})

// overlay паузы:
<p className="match3__pause-title">
  {pausedByVisibility ? 'Вкладка в фоне — игра на паузе' : 'Игра на паузе'}
</p>
```

### Врезка в `GamePage.tsx`

```typescript
import { readPauseOnTabHidden, writePauseOnTabHidden } from '../utils/webApiStorage'

// settings select «Пауза при сворачивании вкладки»
// <Match3Screen pauseOnTabHidden={pauseOnTabHidden} … />
```

---

## Итерация 4 — Vibration API

### Файлы

| Путь |
|------|
| `packages/client/src/utils/vibration.ts` |
| `packages/client/src/game/match3/Match3Screen.tsx` |
| `packages/client/src/pages/GamePage.tsx` |

### `vibration.ts`

```typescript
export const VIBRATION_ENABLED_KEY = 'match3:vibration-enabled'
export const COMBO_VIBRATION_PATTERN = [40, 30, 60]

export function vibrateComboFeedback(): void {
  if (!readVibrationEnabled() || !('vibrate' in navigator)) return
  navigator.vibrate(COMBO_VIBRATION_PATTERN)
}

export function vibrateWinFeedback(): void {
  if (!readVibrationEnabled() || !('vibrate' in navigator)) return
  navigator.vibrate([80, 50, 80, 50, 120])
}
```

### Врезка в `Match3Screen.tsx`

```typescript
import { vibrateComboFeedback } from '../../utils/vibration'

const onComboShake = useCallback(
  (chain: number) => {
    if (chain < 3) return
    if (vibrationEnabled && chain >= 4) {
      vibrateComboFeedback()
    }
    // … существующая тряска доски
  },
  [vibrationEnabled]
)
```

### Врезка в `GamePage.tsx`

```typescript
import { vibrateWinFeedback, readVibrationEnabled, writeVibrationEnabled } from '../utils/vibration'

// в handleGameFinished при payload.reason === 'goalReached':
vibrateWinFeedback()

// settings: select «Вибрация (комбо / победа)»
// <Match3Screen vibrationEnabled={vibrationEnabled} … />
```

---

## Проверка всего 9.3

```bash
yarn workspace client typecheck
yarn workspace client test src/utils/notifications.test.ts src/utils/geolocation.test.ts src/utils/pageVisibility.test.ts
```

| API | Ручная проверка |
|-----|-----------------|
| Notification | Настройки → вкл → разрешить → `/game/play` → вкладка в фон 2+ мин |
| Geolocation | `/profile` → часовой пояс / с геолокацией |
| Page Visibility | `/game/play` → старт → другая вкладка → таймер стоит |
| Vibration | Мобильный браузер, комбо ≥4 и победа |

---

## Коммиты (предложения)

```
feat(client): Notification API — opt-in reminders on game routes
feat(client): Geolocation API — coarse region on profile
feat(client): Page Visibility API — pause match-3 when tab hidden
feat(client): Vibration API — haptic feedback on combo and win
```

Или один:

```
feat(client): sprint 9.3 Web APIs — notifications, geolocation, visibility, vibration
```

---

## Ссылки

- [project-web-api.md](./project-web-api.md)
- [s9-plan.md](./s9-plan.md)
- [MEMORYLEAKS.md](./MEMORYLEAKS.md)
