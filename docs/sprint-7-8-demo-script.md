# Сценарий демонстрации Cosmic Match — спринты 7 и 8 (командный зачёт)

Демонстрация по итогу спринтов **«VII. SSR, OAuth, лидерборд»** и **«VIII. Форум, темизация, Postgres»**.
Нумерация задач — по [README](../README.md) и [плану спринтов](https://github.com/users/kirillchistov/projects/5).

**Длительность:** ~12 минут (таблица «Пошаговый сценарий»).

**Подготовка к демо**

1. `docker compose up -d postgres` — Postgres на порту **5433** (см. `.env`).
2. `yarn db:migrate` — таблицы форума и тем UI.
3. Опционально: `yarn workspace server db:seed` — демо-тема форума.
4. `yarn dev` — клиент SSR **5173**, API **3000** (не открывать только Vite без прокси).
5. Браузер: **http://localhost:5173**; DevTools (Network, Console, Application → cookies).
6. Тестовый аккаунт Практикума: `testuser12345` / `Testuser12345`.
7. IDE: ветка с merge 7.x / 8.x; вкладки `entry-server.tsx`, `apiProxy.ts`, `forumRouter.ts`, `createApp.ts`.

**Порядок колонок в таблицах задач:** кратко функционал → ключевые файлы → что открыть в браузере.

**Ссылки на код** ведут из `docs/` в репозиторий (`../packages/...`).

---

## Спринт 7 — SSR, OAuth, лидерборд, Performance

| Задача | Уровень | Кратко: функционал | Код (файлы) | UI (`http://localhost:5173/...`) |
| :---: | :---: | --- | --- | --- |
| 7.0 | 0 | **Визуал игры:** доработки match-3 (иконки, эффекты, поле). | [`game/match3/engine/`](../packages/client/src/game/match3/engine/), [`match3-theme.pcss`](../packages/client/src/shared/styles/match3-theme.pcss) | [`/game/play`](http://localhost:5173/game/play) |
| 7.1 | 3 | **Express + SSR:** HTML с разметкой и стилями с сервера; health, статическая SSR-страница. | [`server/index.ts`](../packages/client/server/index.ts), [`server/static-page.ts`](../packages/client/server/static-page.ts) | View Source на [`/`](http://localhost:5173/); [`/health`](http://localhost:5173/health); [`/ssr-static`](http://localhost:5173/ssr-static) |
| 7.2 | 4 | **Redux + React Router на SSR:** `createStaticHandler`, prefetch `fetchData`, `window.APP_INITIAL_STATE`, guard на сервере. | [`entry-server.tsx`](../packages/client/src/entry-server.tsx), [`entry-server.utils.ts`](../packages/client/src/entry-server.utils.ts), [`entry-client.tsx`](../packages/client/src/entry-client.tsx), [`hoc/withAuthGuard.tsx`](../packages/client/src/hoc/withAuthGuard.tsx) | F5 на [`/forum`](http://localhost:5173/forum) — в HTML есть `APP_INITIAL_STATE`; без сессии → редирект на логин |
| 7.3 | 3 | **OAuth Яндекс:** `service_id`, redirect, callback, вход по коду. | [`shared/api/oauthApi.ts`](../packages/client/src/shared/api/oauthApi.ts), [`LoginPage.tsx`](../packages/client/src/pages/LoginPage.tsx), [`SignupPage.tsx`](../packages/client/src/pages/SignupPage.tsx), маршрут callback в [`routes.tsx`](../packages/client/src/routes.tsx) | [`/login`](http://localhost:5173/login) — кнопка «Войти через Яндекс»; при настроенном `VITE_YANDEX_OAUTH_*` — полный поток |
| 7.4 | 2 | **Лидерборд API:** данные с Практикума, Redux slice, маппинг в UI. | [`shared/api/leaderboardApi.ts`](../packages/client/src/shared/api/leaderboardApi.ts), [`leaderboardSlice.ts`](../packages/client/src/slices/leaderboardSlice.ts), [`LeaderboardPage.tsx`](../packages/client/src/pages/LeaderboardPage.tsx), [`docs/leaderboard-api.md`](leaderboard-api.md) | [`/leaderboard`](http://localhost:5173/leaderboard) — таблица после логина; Network → `/api/v2/leaderboard/all` |
| 7.5 | 2 | **Performance API:** `mark`/`measure` сессии, `PerformanceObserver` long tasks, логи в консоль. | [`utils/performanceMetrics.ts`](../packages/client/src/utils/performanceMetrics.ts), вызовы в [`GamePage.tsx`](../packages/client/src/pages/GamePage.tsx) | [`/game/play`](http://localhost:5173/game/play) → Console: `[Performance] Game session started` / длительность |
| 7.6 | 1 | **MEMORYLEAKS.md:** аудит подписок, таймеров, observers; план фиксов. | [`docs/MEMORYLEAKS.md`](MEMORYLEAKS.md) | Показ в IDE / кратко на слайде |

---

## Спринт 8 — Postgres, форум, темы, авторизация на бэкенде

| Задача | Уровень | Кратко: функционал | Код (файлы) | UI (`http://localhost:5173/...`) |
| :---: | :---: | --- | --- | --- |
| 8.1 | 2 | **Docker Postgres:** сервис `postgres`, volume, healthcheck, порт 5433 на хосте. | [`docker-compose.yml`](../docker-compose.yml), [`.env.sample`](../.env.sample), [`config/database.cjs`](../packages/server/config/database.cjs) | `docker compose ps postgres`; миграции в терминале |
| 8.2 | 5 | **API форума:** топики, дерево комментариев, CRUD, реакции, пагинация, модераторы. | [`routes/forumRouter.ts`](../packages/server/routes/forumRouter.ts), [`models/`](../packages/server/models/), миграция [`20260514120000-create-forum-tables.js`](../packages/server/migrations/20260514120000-create-forum-tables.js), [`docs/forum-api-spec.md`](forum-api-spec.md) | Network → `/api/forum/topics`, `/api/forum/topics/:id/comments` |
| 8.3 | 3 | **Темы (клиент):** `light-flat`, `light-3d`, `dark-neon`; Context, классы на `body`, localStorage. | [`contexts/LandingThemeContext.tsx`](../packages/client/src/contexts/LandingThemeContext.tsx), [`shared/styles/themes.pcss`](../packages/client/src/shared/styles/themes.pcss), [`Header/index.tsx`](../packages/client/src/components/Header/index.tsx) | [`/`](http://localhost:5173/) или [`/game`](http://localhost:5173/game) — переключатель тем в шапке |
| 8.4 | 3 | **Auth на бэкенде:** `requirePraktikumAuth`, проверка cookie → Практикум; **403** без сессии. | [`middleware/requirePraktikumAuth.ts`](../packages/server/middleware/requirePraktikumAuth.ts), [`resolvePraktikumUser.ts`](../packages/server/middleware/resolvePraktikumUser.ts), [`createApp.ts`](../packages/server/createApp.ts), [`docs/auth-middleware-backend.md`](auth-middleware-backend.md) | Инкогнито → fetch `/api/forum/topics` → **403**; с логином → **200** |
| 8.5 | 2 | **Реакции (клиент):** picker 🙂, чипы под комментарием, toggle в Redux. | [`components/forum/ForumCommentReactions.tsx`](../packages/client/src/components/forum/ForumCommentReactions.tsx), [`ForumTopicPage.tsx`](../packages/client/src/pages/ForumTopicPage.tsx), [`slices/forumSlice.ts`](../packages/client/src/slices/forumSlice.ts) | Топик форума → комментарий → кнопка реакции → меню эмодзи |
| 8.6 | 2 | **Реакции (бэкенд):** whitelist эмодзи, UNIQUE на (comment, user, emoji), агрегация GET. | [`routes/forumEmojiGuard.ts`](../packages/server/routes/forumEmojiGuard.ts), [`models/CommentReaction.ts`](../packages/server/models/CommentReaction.ts) | POST/DELETE `/api/forum/comments/:id/reactions` |
| 8.7 | 2 | **Тема (бэкенд):** `GET/PUT /api/ui/theme`, гость по cookie, пользователь в БД. | [`routes/uiThemeRouter.ts`](../packages/server/routes/uiThemeRouter.ts), миграция [`20260516130000-create-ui-theme-tables.js`](../packages/server/migrations/20260516130000-create-ui-theme-tables.js), [`hooks/useThemeServerSync.ts`](../packages/client/src/hooks/useThemeServerSync.ts) | Network → `/api/ui/theme` после смены темы |
| 8.8 | 5 | **Инфра форума:** same-origin `apiProxy`, env Docker, документация деплоя. | [`server/apiProxy.ts`](../packages/client/server/apiProxy.ts), [`docs/forum-server-infra.md`](forum-server-infra.md), [`docs/forum-api-client.md`](forum-api-client.md) | Схема в доке + один запрос через **5173** (прокси на 3000 и Практикум) |
| 8.9 | 3 | **Клиент форума:** `forumApi`, thunks, список с **Комментарии / Ответы**, топик, правки. | [`shared/api/forumApi.ts`](../packages/client/src/shared/api/forumApi.ts), [`ForumPage.tsx`](../packages/client/src/pages/ForumPage.tsx), [`ForumTopicPage.tsx`](../packages/client/src/pages/ForumTopicPage.tsx) | [`/forum`](http://localhost:5173/forum) → тема → комментарий + ответ + реакция |
| 8.10 | 0 | **Командный зачёт** — эта демонстрация. | README § Спринт 8 | — |

---

## Пошаговый сценарий (~12 минут)

Каждый блок: **кратко** → **код** → **UI**.

| Мин | Кратко | Код | UI |
| --- | --- | --- | --- |
| 0:00–0:45 | Вступление: команда, стек (React, Redux, Express SSR, Postgres, Docker), скоуп **7 + 8**, что было в 5–6 (база UI и игра). | [README](../README.md) | — |
| 0:45–2:15 | **7.1–7.2 SSR:** серверный HTML, гидратация, начальное состояние Redux, защита маршрутов на сервере. | [`entry-server.tsx`](../packages/client/src/entry-server.tsx), [`server/index.ts`](../packages/client/server/index.ts) | View Source [`/`](http://localhost:5173/) → `APP_INITIAL_STATE`; [`/health`](http://localhost:5173/health) |
| 2:15–3:00 | **7.3 OAuth:** кнопка Яндекс, прокси `/api/v2`, callback (при наличии env — коротко live). | [`oauthApi.ts`](../packages/client/src/shared/api/oauthApi.ts), [`LoginPage.tsx`](../packages/client/src/pages/LoginPage.tsx) | [`/login`](http://localhost:5173/login) |
| 3:00–3:45 | **7.4 Лидерборд:** реальные данные API, не мок. | [`leaderboardSlice.ts`](../packages/client/src/slices/leaderboardSlice.ts), [`LeaderboardPage.tsx`](../packages/client/src/pages/LeaderboardPage.tsx) | [`/leaderboard`](http://localhost:5173/leaderboard) |
| 3:45–4:15 | **7.5 Performance:** метрики сессии match-3 в консоли. | [`performanceMetrics.ts`](../packages/client/src/utils/performanceMetrics.ts) | [`/game/play`](http://localhost:5173/game/play) → Console |
| 4:15–4:30 | **7.6** Документ утечек памяти — культура качества. | [`MEMORYLEAKS.md`](MEMORYLEAKS.md) | IDE |
| 4:30–5:00 | **8.1** Postgres в Docker + миграции (один слайд/терминал). | [`docker-compose.yml`](../docker-compose.yml) | `docker compose ps` |
| 5:00–5:45 | **8.3 + 8.7 Темы:** три темы на клиенте, синк с сервером после логина. | [`LandingThemeContext.tsx`](../packages/client/src/contexts/LandingThemeContext.tsx), [`uiThemeRouter.ts`](../packages/server/routes/uiThemeRouter.ts) | Смена темы → Network `PUT /api/ui/theme` |
| 5:45–6:15 | **8.4 + 8.8** Прокси и auth: `/api/v2` → Практикум, `/api/forum` → Node; 403 без cookie. | [`apiProxy.ts`](../packages/client/server/apiProxy.ts), [`requirePraktikumAuth.ts`](../packages/server/middleware/requirePraktikumAuth.ts) | Инкогнито: `/api/forum/topics` → 403 |
| 6:15–8:30 | **8.2 + 8.9 + 8.5–8.6 Форум (главный блок):** список (**Комментарии** / **Ответы**), новая тема, комментарий, ответ, реакции (picker + чипы), правка своего. | [`ForumPage.tsx`](../packages/client/src/pages/ForumPage.tsx), [`ForumTopicPage.tsx`](../packages/client/src/pages/ForumTopicPage.tsx), [`forumRouter.ts`](../packages/server/routes/forumRouter.ts) | [`/forum`](http://localhost:5173/forum) → тема → комментарий → «Ответить» → 🙂 |
| 8:30–9:15 | **7.0** Коротко: визуал игры после доработок S7 (30 с). | [`match3/engine/renderer.ts`](../packages/client/src/game/match3/engine/renderer.ts) | [`/game`](http://localhost:5173/game) |
| 9:15–10:00 | **Тесты (smoke):** forum reactions e2e, slice-тест. | [`forumReactions.e2e.test.ts`](../packages/server/__tests__/forumReactions.e2e.test.ts), [`forumSlice.reactions.test.ts`](../packages/client/src/slices/forumSlice.reactions.test.ts) | Терминал: `yarn workspace server test`, `yarn workspace client test` |
| 10:00–12:00 | Итог: чеклист **7.0–7.6**, **8.1–8.9**; дорожная карта **9** (CSP, nginx, деплой). | [README](../README.md) § Спринт 9 | — |

---

## Сценарий «Форум» (шпаргалка для блока 6:15–8:30)

| Шаг | Действие | Ожидаемый результат |
| --- | --- | --- |
| 1 | Логин `testuser12345` | Сессия, cookie на origin **5173** |
| 2 | [`/forum`](http://localhost:5173/forum) | Список тем; колонки **Комментарии** (верхний уровень) и **Ответы** (вложенные) |
| 3 | «+ Новая тема» | POST → тема в списке |
| 4 | Открыть тему | Текст темы, блок комментариев |
| 5 | Комментарий + «Отправить» | Счётчик **Комментарии** +1 в списке |
| 6 | «Ответить» на комментарий, ответ | Вложенный блок; **Ответы** +1 |
| 7 | Кнопка 🙂 → выбрать эмодзи | Чип под комментарием; повторный клик снимает |
| 8 | Выйти / инкогнито → `/forum` | Редирект на логин или 403 на API |

---

## На что обратить внимание

- **Не открывать** приложение на `localhost:3000` — там только API; UI и прокси на **5173**.
- Перед демо: `docker compose up -d postgres`, иначе сервер пишет `ECONNREFUSED` к БД.
- **Ключевые блоки по времени:** SSR (7.1–7.2), форум live (8.2–8.9), темы (8.3–8.7).
- **7.3 OAuth** — если нет `VITE_YANDEX_OAUTH_SERVICE_ID`, показать кнопку и схему в коде, без полного redirect.
- **8.4** — достаточно Network: запрос к `/api/forum/topics` без cookie → `{ "reason": "Forbidden" }`.
- Чередовать спикеров по зонам ответственности (SSR / форум / темы / инфра).
- Финал — спринт **9**: безопасность, nginx, облако.

## Распределение ролей (пример)

| Участник | Блоки демо |
| --- | --- |
| Кирилл | Вступление, 7.1–7.2 SSR, 8.1 Docker, 8.2 API, итог |
| Артур | 7.0 визуал, 8.3 темы клиент |
| Анна | 7.3 OAuth, 8.7 темы бэкенд, 8.8 инфра |
| Сергей | 7.4 лидерборд, 8.4 auth middleware, 8.6 реакции бэкенд |
| Антон | 7.5 Performance, 8.9 клиент форума, тесты |
| Все | 8.5 реакции в UI, вопросы, чеклист 8.10 |
