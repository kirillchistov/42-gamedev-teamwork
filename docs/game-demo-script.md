# Сценарий демонстрации проекта Cosmic Match команды 42 для командного зачета 16.04.2026

Демонстрация по итогу спринтов **«V. Привет, React»** и **«VI. Redux-хранилище и ингредиенты»**.
Нумерация, описания и веса задач взяты из [Бэклога Яндекс Практикум](https://web-upskilling.yonote.ru/share/baza_znaniy_mf/doc/beklog-proekta-dSe71svkh8).

**Подготовка к демо:** собрать клиент (`packages/client`), поднять API по инструкции в корневом README, открыть IDE с проектом, браузер с DevTools (Application → Service Workers, Network → Offline). Подготовить заранее тестовый аккаунт для логина и профиля: testuser12345 / Testuser12345.

**Базовый URL UI в демо:** `http://localhost/` (клиентский SSR по умолчанию слушает порт **80** в [`packages/client/server/index.ts`](../packages/client/server/index.ts); если задан `PORT`, подставьте его в ссылки).

**Ссылки на код** в таблицах ведут из папки `docs/` в репозиторий (`../packages/...`, `../.github/...`).

**Порядок колонок в таблицах задач:** кратко функционал → ключевые файлы → что открыть в браузере.

---

## **5 спринт**

| Задача | Уровень | Кратко: функционал | Код (файлы) | UI (`http://localhost/...`) |
| :---: | :---: | --- | --- | --- |
| 5.1 | 1 | **Репозиторий из шаблона:** скрипты, CI, линтеры, версия Node. | [корневой `package.json`](../package.json), [`.github/workflows/checks.yml`](../.github/workflows/checks.yml), [корневой `README.md`](../README.md), ESLint/Jest в `packages/client` | Терминал, вкладка GitHub Actions |
| 5.2 | 1 | **React Router:** валидные маршруты с контентом, несуществующий путь → 404. | [`main.tsx`](../packages/client/src/main.tsx), [`routes.tsx`](../packages/client/src/routes.tsx), [`router/publicRoutePaths.ts`](../packages/client/src/router/publicRoutePaths.ts), [`pages/NotFound.tsx`](../packages/client/src/pages/NotFound.tsx) | Несуществующий путь, например [`/no-such-page`](http://localhost/no-such-page) → 404 |
| 5.3 | 1 | **Лендинг и навигация** после входа: описание игры, ссылки на форум, лидерборд, профиль, игру. | [`pages/LandingPage.tsx`](../packages/client/src/pages/LandingPage.tsx), [`pages/GamePage.tsx`](../packages/client/src/pages/GamePage.tsx), [`components/Landing/`](../packages/client/src/components/Landing/), [`components/Header/index.tsx`](../packages/client/src/components/Header/index.tsx) | [`/`](http://localhost/) (лендинг); после логина — [`/game`](http://localhost/game) |
| 5.4 | 0.5 | **Страница ошибки 400** (в проекте — общий космический экран ошибки с маршрутами 400/404). | [`pages/Error404Page.tsx`](../packages/client/src/pages/Error404Page.tsx), [`routes.tsx`](../packages/client/src/routes.tsx) (пути `/error400`, `/error/400`) | [`/error/400`](http://localhost/error/400) или [`/error400`](http://localhost/error400) |
| 5.5 | 0.5 | **Страница ошибки 500.** | [`pages/Error500Page.tsx`](../packages/client/src/pages/Error500Page.tsx), [`routes.tsx`](../packages/client/src/routes.tsx) | [`/error/500`](http://localhost/error/500) или [`/error500`](http://localhost/error500) |
| 5.6 | 1 | **Форма логина** (поля, кнопка). | [`pages/LoginPage.tsx`](../packages/client/src/pages/LoginPage.tsx), [`shared/styles/auth.pcss`](../packages/client/src/shared/styles/auth.pcss) | [`/sign-in`](http://localhost/sign-in) или [`/login`](http://localhost/login) |
| 5.7 | 2 | **Авторизация:** неавторизованный не попадает в закрытые разделы; ошибки логина. | [`slices/userSlice.ts`](../packages/client/src/slices/userSlice.ts), [`pages/LoginPage.tsx`](../packages/client/src/pages/LoginPage.tsx), [`components/ProtectedRoute/index.tsx`](../packages/client/src/components/ProtectedRoute/index.tsx), [`hooks/useAuthCheck.ts`](../packages/client/src/hooks/useAuthCheck.ts) | Неверный пароль → сообщение; успех → редирект; без сессии [`/profile`](http://localhost/profile) → логин |
| 5.8 | 2 | **Форум:** список тем, топик, комментарии, создание. | [`pages/ForumPage.tsx`](../packages/client/src/pages/ForumPage.tsx), [`pages/ForumTopicPage.tsx`](../packages/client/src/pages/ForumTopicPage.tsx), [`shared/styles/forum.pcss`](../packages/client/src/shared/styles/forum.pcss) | [`/forum`](http://localhost/forum), пример топика [`/forum/1`](http://localhost/forum/1) (если есть тема) |
| 5.9 | 2 | **Валидация форм** (auth-поля, blur/submit). | [`shared/validation/authValidation.ts`](../packages/client/src/shared/validation/authValidation.ts), [`hooks/useValidate.ts`](../packages/client/src/hooks/useValidate.ts), поля в [`SignupPage.tsx`](../packages/client/src/pages/SignupPage.tsx) / [`LoginPage.tsx`](../packages/client/src/pages/LoginPage.tsx) / [`ProfilePage.tsx`](../packages/client/src/pages/ProfilePage.tsx) | [`/signup`](http://localhost/signup), [`/sign-in`](http://localhost/sign-in), [`/profile`](http://localhost/profile) |
| 5.10 | 1 | **Регистрация** (имена, login, email, password, phone). | [`pages/SignupPage.tsx`](../packages/client/src/pages/SignupPage.tsx) | [`/signup`](http://localhost/signup) |
| 5.11 | 1 | **Лидерборд:** макет и мок-данные для авторизованного. | [`pages/LeaderboardPage.tsx`](../packages/client/src/pages/LeaderboardPage.tsx), [`shared/styles/leaderboard.pcss`](../packages/client/src/shared/styles/leaderboard.pcss) | [`/leaderboard`](http://localhost/leaderboard) |
| 5.12 | 2 | **Старт игры:** роут игры, отсчёт / лоадер / «Старт». | [`pages/GamePage.tsx`](../packages/client/src/pages/GamePage.tsx), [`game/match3/Match3Screen.tsx`](../packages/client/src/game/match3/Match3Screen.tsx) | [`/game/start`](http://localhost/game/start) или [`/game`](http://localhost/game) |
| 5.13 | 2 | **Профиль:** данные, аватар, смена пароля (API Практикума). | [`pages/ProfilePage.tsx`](../packages/client/src/pages/ProfilePage.tsx), [`shared/api/userApi.ts`](../packages/client/src/shared/api/userApi.ts), [`components/Avatar/index.tsx`](../packages/client/src/components/Avatar/index.tsx) | [`/profile`](http://localhost/profile) |
| 5.14 | 2 | **Документ механики игры.** | [`docs/README.md`](README.md), [`docs/game-play.md`](game-play.md) | Показ в репозитории / IDE |
| 5.15 | 1 | **Экран завершения:** результат, «Повторить», «В меню». | [`pages/GamePage.tsx`](../packages/client/src/pages/GamePage.tsx), [`game/match3/Match3Screen.tsx`](../packages/client/src/game/match3/Match3Screen.tsx), [`game/match3/engine/`](../packages/client/src/game/match3/engine/) | Довести партию до конца на [`/game/play`](http://localhost/game/play) |
| 5.16 | 1 | **ErrorBoundary:** при ошибке в поддереве — fallback, приложение не падает целиком. | [`components/ErrorBoundary/index.tsx`](../packages/client/src/components/ErrorBoundary/index.tsx), [`components/AppErrorFallback/index.tsx`](../packages/client/src/components/AppErrorFallback/index.tsx), обёртка в [`main.tsx`](../packages/client/src/main.tsx) | Показать fallback в коде / тест [`ErrorHandling.test.tsx`](../packages/client/src/components/ErrorHandling.test.tsx) |
| 5.17 | 3 | **Canvas:** цикл, ввод, отрисовка, игровая логика match-3. | [`game/match3/engine/renderer.ts`](../packages/client/src/game/match3/engine/renderer.ts), [`inputController.ts`](../packages/client/src/game/match3/engine/inputController.ts), [`sessionRuntime.ts`](../packages/client/src/game/match3/engine/sessionRuntime.ts), [`gameState.ts`](../packages/client/src/game/match3/engine/gameState.ts) | [`/game/play`](http://localhost/game/play) |

---

## **6 спринт**

| Задача | Уровень | Кратко: функционал | Код (файлы) | UI (`http://localhost/...`) |
| :---: | :---: | --- | --- | --- |
| 6.1 | 3 | **Игровая механика** из документа (интерактив). | [`game/match3/engine/`](../packages/client/src/game/match3/engine/) (match, swap, collapse и др.) | [`/game/play`](http://localhost/game/play) |
| 6.2 | 3 | **Состояния «Начало» и «Завершение»:** связка Canvas ↔ приложение. | [`pages/GamePage.tsx`](../packages/client/src/pages/GamePage.tsx), [`Match3Screen.tsx`](../packages/client/src/game/match3/Match3Screen.tsx), маршруты `/game/*` в [`routes.tsx`](../packages/client/src/routes.tsx) | Старт → игра → финиш на [`/game`](http://localhost/game) |
| 6.3 | 2 | **Визуал без заглушек:** иконки, темы, эффекты. | [`match3IconUrls.ts`](../packages/client/src/game/match3/engine/match3IconUrls.ts), [`public/iconset`](../packages/client/public/iconset), [`matchFx.ts`](../packages/client/src/game/match3/engine/matchFx.ts), [`shared/styles/match3-theme.pcss`](../packages/client/src/shared/styles/match3-theme.pcss) | [`/game/play`](http://localhost/game/play) |
| 6.4 | 2 | **Service Worker:** кеш, офлайн в т.ч. игра. | [`sw.ts`](../packages/client/src/sw.ts), [`vite.config.ts`](../packages/client/vite.config.ts) (PWA / `injectManifest`) | DevTools → Offline → перезагрузка, затем игра |
| 6.5 | 1 | **Проверка авторизации** (hook / HOC / guard). | [`hooks/useAuthCheck.ts`](../packages/client/src/hooks/useAuthCheck.ts), [`hoc/withAuthGuard.tsx`](../packages/client/src/hoc/withAuthGuard.tsx), [`components/ProtectedRoute/index.tsx`](../packages/client/src/components/ProtectedRoute/index.tsx), [`publicRoutePaths.ts`](../packages/client/src/router/publicRoutePaths.ts) | Инкогнито → [`/profile`](http://localhost/profile) → редирект на логин |
| 6.6 | 1 | **Web API** (например Fullscreen). | [`utils/fullscreen.ts`](../packages/client/src/utils/fullscreen.ts), [`pages/GamePage.tsx`](../packages/client/src/pages/GamePage.tsx) (горячая клавиша **F**) | [`/game/play`](http://localhost/game/play), нажать **F** |
| 6.7 | 2 | **Redux Toolkit:** стор, слайс пользователя, данные после логина. | [`store.ts`](../packages/client/src/store.ts), [`slices/userSlice.ts`](../packages/client/src/slices/userSlice.ts), [`main.tsx`](../packages/client/src/main.tsx) (`Provider`) | После логина — шапка / [`/profile`](http://localhost/profile); опционально Redux DevTools |
| 6.8 | 2 | **Тесты:** движок + UI. | `yarn test --scope=client`; [`GamePage.test.tsx`](../packages/client/src/pages/GamePage.test.tsx), [`game/match3/engine/*.test.ts`](../packages/client/src/game/match3/engine/), [`userSlice.test.ts`](../packages/client/src/slices/userSlice.test.ts) | Терминал |

---

## Пошаговый сценарий (~12–15 минут)

Каждый блок: **кратко** → **код** → **UI**.

| Мин | Кратко | Код | UI |
| --- | --- | --- | --- |
| 0:00–0:40 | Вступление: команда, стек, скоуп 5–6 спринтов, ссылка на бэклог. | — | — |
| 0:40–1:15 | **5.1** Инфра: CI, линтеры, `engines`, README. | [`package.json`](../package.json), [`.github/workflows/checks.yml`](../.github/workflows/checks.yml) | Терминал, Actions |
| 1:15–3:30 | **5.2–5.3, 5.4–5.5, 5.6–5.11** Роутинг, лендинг, страницы ошибок, логин/регистрация, валидация (короткий пример), форум, лидерборд; на одном маршруте **F5**. | [`main.tsx`](../packages/client/src/main.tsx), [`routes.tsx`](../packages/client/src/routes.tsx), страницы в [`pages/`](../packages/client/src/pages/), [`Header`](../packages/client/src/components/Header/index.tsx) | [`/`](http://localhost/), [`/sign-in`](http://localhost/sign-in), [`/signup`](http://localhost/signup), [`/error/404`](http://localhost/error/404), [`/forum`](http://localhost/forum), [`/leaderboard`](http://localhost/leaderboard) |
| 3:30–4:15 | **5.7 + 6.5** Защита маршрутов и сессия. | [`userSlice.ts`](../packages/client/src/slices/userSlice.ts), [`withAuthGuard.tsx`](../packages/client/src/hoc/withAuthGuard.tsx), [`useAuthCheck.ts`](../packages/client/src/hooks/useAuthCheck.ts), [`ProtectedRoute`](../packages/client/src/components/ProtectedRoute/index.tsx) | Инкогнито → [`/profile`](http://localhost/profile) |
| 4:15–5:00 | **5.13 + 6.7** Профиль и Redux. | [`ProfilePage.tsx`](../packages/client/src/pages/ProfilePage.tsx), [`userApi.ts`](../packages/client/src/shared/api/userApi.ts), [`store.ts`](../packages/client/src/store.ts) | [`/profile`](http://localhost/profile) |
| 5:00–7:00 | **5.12, 5.15, 5.17 + 6.1–6.3** Игра: старт, canvas, финиш, визуал. | [`GamePage.tsx`](../packages/client/src/pages/GamePage.tsx), [`Match3Screen.tsx`](../packages/client/src/game/match3/Match3Screen.tsx), [`engine/renderer.ts`](../packages/client/src/game/match3/engine/renderer.ts) и соседние модули | [`/game/start`](http://localhost/game/start) → [`/game/play`](http://localhost/game/play) |
| 7:00–7:40 | **6.6** Fullscreen (клавиша **F**). | [`fullscreen.ts`](../packages/client/src/utils/fullscreen.ts), [`GamePage.tsx`](../packages/client/src/pages/GamePage.tsx) | [`/game/play`](http://localhost/game/play) |
| 7:40–8:30 | **6.4** Service Worker и Offline. | [`sw.ts`](../packages/client/src/sw.ts), [`vite.config.ts`](../packages/client/vite.config.ts) | DevTools Offline + перезагрузка |
| 8:30–9:00 | **5.16** ErrorBoundary и fallback. | [`ErrorBoundary/index.tsx`](../packages/client/src/components/ErrorBoundary/index.tsx), [`AppErrorFallback`](../packages/client/src/components/AppErrorFallback/index.tsx), [`main.tsx`](../packages/client/src/main.tsx) | Код / тест |
| 9:00–9:40 | **5.14** Документация механики. | [`docs/README.md`](README.md), [`game-play.md`](game-play.md) | Репозиторий |
| 9:40–10:30 | **6.8** Тесты. | `*.test.ts(x)` в [`packages/client`](../packages/client/) | Терминал: `yarn test --scope=client` |
| 10:30–12:00 | Итог: чеклист **5.1–5.17**, **6.1–6.8**; дорожная карта (спринт 7: SSR, OAuth, лидерборд API). | [`docs/project-structure.md`](project-structure.md) | — |

---

## На что обратить внимание

- **5.5 и 6.5** можно показать одним блоком «сессия и защита роутов».
- **5.7, 5.12–5.17, 6.2, 6.4, 6.7, 6.8** — ключевые; на них выделить время.
- **5.8–5.11** — очень коротко (форум + лидерборд).
- **Распределение ролей** — чередование и коллаборации.
- **Дорожная карта** — визуально (слайд / доска).
