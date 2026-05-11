# Project Web API (Current State + Next Steps)

Здесь расскажем:
1. как сейчас в проекте подключены и используются Web API ('Fullscreen API', 'localStorage/sessionStorage');
2. как полезно добавить один из API из задания ('Geolocation', 'Performance', 'Notification');
3. какие дополнительные Web API логично внедрять дальше.

---

## 1) Текущее использование Web API

### 1.1 Fullscreen API

Реализация уже есть и обернута в отдельный util:

- 'packages/client/src/utils/fullscreen.ts'

Что сделано:

- единая обертка для:
  - 'enterFullscreen()'
  - 'exitFullscreen()'
  - 'toggleFullscreen()'
  - 'addFullscreenChangeListener()'
- учтен Safari-префикс:
  - 'webkitRequestFullscreen'
  - 'webkitExitFullscreen'
  - 'webkitfullscreenchange'
- fallback и безопасные 'try/catch'.

Где используется:

- 'GamePage.tsx' - горячая клавиша 'F' для toggle full screen;
- 'Header' - кнопка в UI + реакция на 'fullscreenchange'.

Итог: Fullscreen уже интегрирован правильно, кросс-браузерно и с cleanup подписок.

---

### 1.2 localStorage / sessionStorage

Использование сейчас широкое и практичное: настройки, прогресс, результаты, косметика.

Основные точки:

- 'GamePage.tsx'
  - 'match3:last-result'
  - 'match3:result-history'
  - 'match3:hero-chat:<companionId>'
  - 'match3:first-start-countdown-done'
  - 'match3:player-hints-mode'
- 'gameCompanions.ts'
  - активный герой
  - 'winsTotal'
  - 'lastShownBeatIndex'
- 'match3ArenaBackground.ts'
  - индекс фона
  - пользовательский URL фона
- 'systems/records.ts'
  - player daily records
- 'gameLandingGate.ts'
  - 'sessionStorage' для one-time показа '/game' после логина.

Хорошие текущие практики:

- все обращения завернуты в 'try/catch';
- есть guards на 'typeof window === 'undefined'';
- есть валидация URL/данных перед сохранением;
- отдельно хранятся state по сущностям (фон, чат, прогресс, рекорды).

---

## 2) Что добавить из задания (рекомендации)

Ниже - три варианта. Наиболее полезный для текущего этапа: **Performance API**.

### 2.1 Performance API (рекомендовано первым)

Зачем:

- match-3 уже насыщен визуальными эффектами;
- есть мобильный UX и fullscreen;
- нужны метрики до подключения backend-аналитики.

Минимальная полезная реализация:

1. Добавить util (например, 'utils/perf.ts') с:
   - 'performance.mark(...)'
   - 'performance.measure(...)'
   - 'PerformanceObserver' для 'longtask' (опционально).
2. Замерять:
   - время партии ('startPlay -> gameEnd');
   - средний frame-time в 'play' фазе;
   - число long tasks > 50ms.
3. Сохранять в localStorage последние 20 замеров:
   - 'match3:perf-history'.
4. Показать мини-блок в debug/настройках:
   - "avg frame ms", "long tasks", "session ms".

Польза:

- видно, где лаги;
- можно сравнивать эффекты 'full' vs 'simple' VFX;
- дает аргументы для оптимизации.

---

### 2.2 Notification API

Зачем:

- повышает ретеншн (мягкие напоминания);
- подходит под daily loops и "вернись в игру".

Минимальная реализация (без backend):

1. Отдельный переключатель в настройках:
   - "Разрешить уведомления".
2. При включении:
   - 'Notification.requestPermission()'.
3. Для 'granted':
   - локальный сценарий "напомнить через N часов" (когда вкладка неактивна и игрок ушел).
4. Тексты:
   - "Новая глава Истории героя готова";
   - "Дейли-квест обновлен";
   - "В клане ждут новые задания" (когда появится клановая механика).

Важно:

- не спамить;
- явно дать пользователю toggle в UI;
- хранить opt-in флаг в localStorage.

---

### 2.3 Geolocation API

Зачем:

- прямого влияния на core-loop нет, но можно добавить value в мета-слой.

Практичные сценарии:

- региональный бейдж в профиле/лидерборде (страна/часовой пояс);
- локальные события ("Ночной челлендж вашего региона");
- отображение "гео-кластера" игроков в клановом UI.

Ограничения:

- чувствительные данные;
- нужна максимально деликатная коммуникация и opt-in;
- не использовать точные координаты без явной необходимости.

На текущем этапе лучше отложить или сделать "coarse-only" (страна/таймзона).

---

## 3) Дополнительные Web API, которые стоит рассмотреть

### 3.1 Page Visibility API

Польза:

- корректно ставить игру на паузу, если вкладка скрыта;
- не тратить таймер/эффекты в фоне;
- база для честной time-mode логики.

### 3.2 Network Information API (best-effort)

Польза:

- на медленной сети понижать качество ассетов/эффектов;
- подсказывать "облегченный режим".

### 3.3 Vibration API (mobile, optional)

Польза:

- легкий haptic feedback для важных событий (win, combo);
- включать только через toggle.

### 3.4 Clipboard API

Польза:

- удобный share результата;
- copy invite-code клана.

---

## 4) Рекомендуемый порядок внедрения

1. **Performance API** (сразу дает инженерную пользу и метрики).
2. **Notification API** (retention + UX, если настроен opt-in).
3. **Page Visibility API** (техническая стабильность таймеров/паузы).
4. Geolocation - позже, после появления backend-аналитики и кланов.

---

## 5) Definition of Done для блока Web API

- есть отдельный util/модуль API;
- есть graceful fallback, если API не поддерживается;
- есть cleanup listeners/observers;
- есть пользовательский toggle, если API влияет на приватность/уведомления;
- изменения покрыты минимальными тестами и описаны в docs.

