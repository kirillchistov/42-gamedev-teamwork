# Утечки памяти и подписки в проекте

**Актуальность:** 19.05.2026 (спринт **7.5**, задача **7.6**).

Про риски утечек памяти, статус исправлений и проверки при ревью.

Формат: проблема → в коде → гипотеза → действие → проверка.

---

## 1. Что считаем утечкой

- Подписки на `window` / `document` без cleanup.
- `setInterval` / `setTimeout` без `clearTimeout` / `clearInterval`.
- Observer API без `disconnect()`.
- Async-цепочки после `destroy()` / unmount, держащие ссылки на DOM/store.
- Неконтролируемый рост массивов и `localStorage`, читаемых в UI на каждом рендере.

---

## 2. Исправленные риски (спринт 7)

### 2.1. `logoutThunk`: таймер в `Promise.race`

**Было:** `setTimeout` без `clearTimeout` при быстром ответе `userApi.logout()`.

**Стало:** `withTimeout` в [`userSlice.ts`](../packages/client/src/slices/userSlice.ts) с очисткой в `finally`.

**Статус:** [x] исправлено ([#61](https://github.com/kirillchistov/42-gamedev-teamwork/issues/61)).

### 2.2. Hero-chat в `GamePage`

**Было:** неограниченный массив сообщений + полная сериализация в `localStorage` на каждый апдейт.

**Стало:** `HERO_CHAT_MAX_MESSAGES = 100`, обрезка при записи и чтении.

**Статус:** [x] исправлено ([#61](https://github.com/kirillchistov/42-gamedev-teamwork/issues/61)).

### 2.3. Async после `destroy()` в движке

**Было:** `resolveBoard().then(...)` вызывал `emitHud` / `drawBoard` после `destroy()`.

**Стало:** флаг `isDestroyed` в [`bootstrap.ts`](../packages/client/src/game/match3/engine/bootstrap.ts).

**Статус:** [x] исправлено (19.05.2026).

### 2.4. Performance API — long tasks

**Симптом:** всплеск `[Performance] Long task` после снятия паузы; в стеке `installHook.js` (React DevTools).

**Стало** ([`performanceMetrics.ts`](../packages/client/src/utils/performanceMetrics.ts)):

- `buffered: false` у `PerformanceObserver`;
- игнор на паузе (overlay, `visibilitychange`, `match3:performance-pause`);
- grace **2.5 s** после resume;
- сводка `Session summary` при unmount; детали при `VITE_PERF_VERBOSE=1` в dev.

**Статус:** [x] спринт **7.5** (19.05.2026).

---

## 3. Эталонные cleanup (для новых фич)

| Место | Паттерн |
| --- | --- |
| `GamePage` | `removeEventListener` для `keydown`, `ARENA_BG_CHANGED_EVENT` |
| `withAuthGuard` | `storage` + arena events с cleanup |
| `fullscreen.ts` | `addFullscreenChangeListener` возвращает отписку |
| `performanceMetrics` | `disconnect()` при stop |
| Презентация / модалки | `document.body.style.overflow` сбрасывается в `useEffect` cleanup |

---

## 4. Roadmap

### Этап 1 — быстрые фиксы (спринт 7)

- [x] `logoutThunk` timeout.
- [x] Лимит hero-chat.
- [x] `isDestroyed` в bootstrap.
- [x] Performance observer (7.5).

### Этап 2 — стабилизация движка

- [x] Guard в `resolveBoard` цепочках.
- [ ] Smoke: 30+ циклов `/game/start` → `/game/play` → `/game/finish` без роста listeners/heap.

### Этап 3 — мониторинг

- [x] Long-task observer + сводка сессии.
- [ ] Baseline раз в релиз: heap на `/game/play`, `Session summary`.
- [ ] Опционально: писать сводку в `sessionStorage` для сравнения билдов.

### Спринты 8–9 (контекст)

- **Форум / темы** — новые `useEffect` и запросы: проверять cleanup при размонтировании страниц.
- **CSP / XSS** — на утечки не влияют; не добавлять inline-скрипты с подписками без отписки.
- **Полноэкранная презентация на лендинге** — portal + `overflow: hidden` на `body` снимается при закрытии ([`ProjectPresentationCarousel.tsx`](../packages/client/src/components/ProjectPresentation/ProjectPresentationCarousel.tsx)).

---

## 5. Журнал находок

| Дата | Модуль | Симптом | Исправление | Статус |
| --- | --- | --- | --- | --- |
| 29.04.2026 | `userSlice` | Таймеры после logout | `withTimeout` | **fixed** |
| 29.04.2026 | `GamePage` hero-chat | Рост heap / LS | лимит 100 | **fixed** |
| 29.04.2026 | `bootstrap.ts` | Callback после destroy | `isDestroyed` | **fixed** |
| 19.05.2026 | `performanceMetrics` | Long task spam | pause, grace, summary | **fixed** (7.5) |

---

## 6. Чеклист на ревью

- [ ] Каждый `addEventListener` → `removeEventListener` в том же цикле.
- [ ] Каждый `setTimeout` / `setInterval` → очистка в cleanup / `finally`.
- [ ] Async после unmount — guard (`isDestroyed`, `AbortController`).
- [ ] Observer → `disconnect()` в cleanup.
- [ ] На `/game/play` смотреть `Session summary`; единичные long task >50 ms после паузы без роста heap — не баг.
