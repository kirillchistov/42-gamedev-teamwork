# Project Web API

> Здесь про браузерные Web API (Fullscreen, Storage, Performance, Notifications и т.д.).  
> Про сетевой API (`packages/server`, OAuth) — см. [project-structure.md](./project-structure.md).

---

## Статус по веткам (актуально)

| Ветка | 6.6 Fullscreen | 7.5 Performance | 9.3 (Geolocation) |
|-------|----------------|-----------------|-------------|
| `main` / `feature/9.8-final-demo` | да | да | **да** |
| `feature/9.3-add-webapi` | да | да | **да** |

---

## 1) Что уже реализовано в проекте 

### 1.1 Fullscreen API (6.6)

- `packages/client/src/utils/fullscreen.ts`
- `GamePage.tsx` (F), `Header`

### 1.2 localStorage / sessionStorage

Настройки игры, прогресс, форум, темы (`GamePage`, `gameCompanions`, `records` и др.).

### 1.3 Performance API (7.5)

- `packages/client/src/utils/performanceMetrics.ts`
- Замеры сессии, longtask observer, `match3:perf-history`
- `visibilitychange` в этом модуле — **только для метрик**, не пауза для игрока

### 1.4 Speech Synthesis

- `HieroglyphCardOverlay.tsx` — отдельно от 9.3

---

## 2) В рамках задачи 9.3 — ветка `feature/9.8-add-webapi`

4 API: **Notification → Geolocation → Page Visibility → Vibration**.

| API | Модуль | UI | localStorage / ключи |
|-----|--------|-----|----------------------|
| **Notifications** | `utils/notifications.ts`, `hooks/useGameReturnNotification.ts` | `GamePage` (настройки + `/game*`) | `match3:notifications-opt-in` |
| **Geolocation** | `utils/geolocation.ts` | `ProfilePage` | `profile:coarse-region` |
| **Page Visibility** | `utils/pageVisibility.ts`, `hooks/usePageVisibilityPause.ts` | `Match3Screen`, `GamePage` | `match3:pause-on-tab-hidden` |
| **Vibration** | `utils/vibration.ts` | `Match3Screen`, `GamePage` | `match3:vibration-enabled` |

См. diff — в [add-web-api.md](./add-web-api.md).

### 2.1 Notification API

```typescript
// utils/notifications.ts — показ после opt-in + granted
export function showGameReturnNotification(): boolean {
  if (Notification.permission !== 'granted') return false
  new Notification('Cosmic Match', {
    body: 'Партия ждёт — вернитесь в игру, когда будет удобно.',
    tag: 'cosmic-match-return',
  })
  return true
}

// hooks/useGameReturnNotification.ts — таймер 120 с при document.hidden
useGameReturnNotification(isOnGameSection && notificationsOptIn)
```

### 2.2 Geolocation API

```typescript
// Без разрешения — только Intl (часовой пояс)
export function getTimezoneRegion(): CoarseRegion { /* … */ }

// С разрешением — getCurrentPosition, координаты ±0.1°
export function resolveCoarseRegion({ useGeolocation: true })

// server/csp.ts
'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
```

### 2.3 Page Visibility API

```typescript
// utils/pageVisibility.ts
export function subscribePageVisibility(onChange: (hidden: boolean) => void): () => void

// hooks/usePageVisibilityPause.ts — при hidden + uiPhase === 'playing'
setIsPauseOpen(true)  // → overlay «Вкладка в фоне — игра на паузе»
// MATCH3_PERF_PAUSE_EVENT уходит через существующий useEffect(isPauseOpen)
```

### 2.4 Vibration API

```typescript
// utils/vibration.ts
navigator.vibrate([40, 30, 60])   // комбо chain >= 4
navigator.vibrate([80, 50, 80, 50, 120])  // победа

// Match3Screen — в onComboShake; GamePage — vibrateWinFeedback() при goalReached
```

### 2.5 Тесты (unit)

| Файл |
|------|
| `packages/client/src/utils/notifications.test.ts` |
| `packages/client/src/utils/geolocation.test.ts` |
| `packages/client/src/utils/pageVisibility.test.ts` |

```bash
yarn workspace client test src/utils/notifications.test.ts src/utils/geolocation.test.ts src/utils/pageVisibility.test.ts
```

---

## 3) API вне скоупа (на будущее)

| API | Польза |
|-----|--------|
| Network Information | Облегчённый режим на медленной сети |
| Clipboard | Копирование счёта |
| Push API | Нужен backend |

---

## 4) Definition of Done (9.3)

- [x] Код в целевой ветке (`feature/9.8-final-demo` и `feature/9.3-add-webapi`)
- [x] Отдельный util/хук на API (в ветке `9.3`)
- [x] Graceful fallback
- [x] Cleanup слушателей
- [x] Toggle / opt-in
- [x] Unit-тесты (в ветке `9.3`)
- [x] Документация с врезками кода — этот файл и [add-web-api.md](./add-web-api.md)

---

## Ссылки

- [add-web-api.md](./add-web-api.md)
- [s9-plan.md](./s9-plan.md)
- [csp.md](./csp.md)
