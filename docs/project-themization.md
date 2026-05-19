# Темизация приложения (клиент + бэкенд)

Документ для команды: что уже сделано в монорепозитории, что осталось по ТЗ, и как согласовать работу с параллельной задачей по API форума (см. также [forum-api-spec.md](./forum-api-spec.md)).

---

## 1. Переключение тем (клиент)

### 1.1. Проектирование и планирование

**Макеты и визуальные темы**

- В продукте зафиксированы **три** варианта оформления лендинга и общих страниц: `light-flat`, `light-3d`, `dark-neon`. Это не «только светлая/тёмная», а две светлые плюс одна тёмная; переключатель «луна/солнце» на `/game` переводит между **тёмной** и **последней выбранной светлой** (flat или 3d).
- Цветовые токены и базовые стили темы лежат в [`packages/client/src/shared/styles/themes.pcss`](../packages/client/src/shared/styles/themes.pcss); дополнительные переопределения под секции — в [`base.pcss`](../packages/client/src/shared/styles/base.pcss), [`forum.pcss`](../packages/client/src/shared/styles/forum.pcss), [`match3-theme.pcss`](../packages/client/src/shared/styles/match3-theme.pcss), [`match3.pcss`](../packages/client/src/game/match3/match3.pcss) и т.д. (селекторы вида `.landing--dark-neon …`).

**Механизм переключения в UI**

- Глобальное состояние темы: React Context [`LandingThemeProvider`](../packages/client/src/contexts/LandingThemeContext.tsx), хук [`useLandingTheme()`](../packages/client/src/contexts/LandingThemeContext.tsx).
- Провайдер подключён в [`main.tsx`](../packages/client/src/main.tsx) и [`entry-server.tsx`](../packages/client/src/entry-server.tsx) — тема доступна и на CSR, и на SSR.
- На `document.body` вешается один из классов: `landing--light-flat` | `landing--light-3d` | `landing--dark-neon` (см. `LANDING_THEME_CLASS`). Страницы дополнительно дублируют класс на корневом контейнере (`landing landing--${theme}`), чтобы вложенные макеты были предсказуемы.
- Точки входа для пользователя: настройки/хедер (выбор конкретной светлой темы и т.д. — по макету продукта), отдельно описанное поведение **toggle** для игры (см. комментарий в начале `LandingThemeContext.tsx` про кнопку в [`Header`](../packages/client/src/components/Header/index.tsx) с `variant="game"`).

**Итог по планированию:** механизм и набор тем на клиенте **реализованы**; при появлении новых макетов достаточно расширить тип `LandingTheme`, ключи `localStorage` и блоки в `themes.pcss` + точечные оверлеи в модульных `*.pcss`.

### 1.2. Разработка CSS для каждой темы

| Задача по ТЗ | Статус в репозитории |
|--------------|----------------------|
| Стили светлой темы | **Да** — `light-flat`, `light-3d` в `themes.pcss` и связанных файлах |
| Стили тёмной темы | **Да** — `dark-neon` |
| Дополнительные темы | При необходимости — новый член `LandingTheme` + класс + блок в `themes.pcss` |

Рекомендация коллегам: не дублировать палитру в JS, если достаточно CSS; переменные (`:root` / модификаторы `.landing--*`) упростят сопровождение.

### 1.3. Реализация механизма переключения тем

**Логика на клиенте**

- Переключение **без перезагрузки страницы**: обновление состояния React + класс на `body` в [`useLayoutEffect`](../packages/client/src/contexts/LandingThemeContext.tsx) — пользователь видит смену темы сразу.
- **Сохранение локально:** ключи `localStorage`:
  - `cosmic-match.landing-theme.v1` — текущая тема;
  - `cosmic-match.last-light-theme.v1` — запоминание последней светлой (для `toggleColorMode`).

**Сохранение на сервере (done)**

- API **`GET` / `PUT` `/api/ui/theme`** в [`packages/server`](../packages/server) — роутер [`uiThemeRouter.ts`](../packages/server/routes/uiThemeRouter.ts), middleware [`attachPraktikumUser`](../packages/server/middleware/attachPraktikumUser.ts) (без обязательного 403 для гостя).
- Клиент: [`themeApi.ts`](../packages/client/src/shared/api/themeApi.ts), [`themeSync.ts`](../packages/client/src/utils/themeSync.ts), [`useThemeServerSync`](../packages/client/src/hooks/useThemeServerSync.ts) + [`ThemeServerSync`](../packages/client/src/components/ThemeServerSync.tsx) в [`main.tsx`](../packages/client/src/main.tsx).
- Поведение (Q1): при первом кадре — **`localStorage`**; после `selectUserIsAuthChecked` — если ключа темы не было, **GET** с сервера; затем **PUT** локального значения (локальное перетирает серверное); при смене темы — **debounce 400 ms** и **PUT**.
- Гость: cookie **`anonymous_session_id`** (`HttpOnly`, TTL 72 ч), таблицы `anonymous_sessions` / `user_ui_themes` — миграция [`20260516130000-create-ui-theme-tables.js`](../packages/server/migrations/20260516130000-create-ui-theme-tables.js).

**Независимость от match-3:** тема лендинга (`LandingTheme`) и оформление поля игры [`boardFieldTheme`](../packages/client/src/pages/GamePage.tsx) **не синхронизируются** (см. Q4 в §3): отдельные состояния и сценарии использования.

---

## 2. Переключение тем (бэкенд)

Этот блок описывает целевое решение под требования ТЗ и стек **PostgreSQL 12+**, **Sequelize**, **Docker Compose** (как в [docker-compose.yml](../docker-compose.yml) и обзоре в [forum-api-spec.md](./forum-api-spec.md)). Код форума (`Topic`, `Comment`, …) с темизацией **не связан** напрямую, но паттерны те же: Express, переменные `POSTGRES_*`, миграции Sequelize.

### 2.1. Модели и миграции

**Контекст репозитория:** в [`packages/server/models`](../packages/server/models/) сейчас нет сущности «пользователь приложения» — пользователь для форума идентифицируется через сессию Практикума (`req.praktikumUser` после middleware). Для темы в колонке **`praktikum_user_id` типа `TEXT`** хранится каноническое значение **`String(req.praktikumUser.id)`** (числовой id из ответа Практикума, без префиксов). Хелпер в коде: [`praktikumUserIdForDb`](../packages/server/middleware/praktikumUser.ts). Для гостя — отдельная ветка по cookie сессии.

**Рекомендуемая схема (две сущности, явные FK, без «лишних» подзапросов в чтении)**

1. Таблица **`anonymous_sessions`** (только для неавторизованных):
   - `id` — `UUID` PK, default `gen_random_uuid()`;
   - `created_at`, `updated_at` — `TIMESTAMPTZ`;
   - **Срок жизни сессии: 72 часа** с момента последней активности (обновлять `updated_at` на каждый успешный `GET/PUT /api/ui/theme` с валидной cookie). Сессии старше 72 ч от последнего `updated_at` считаются протухшими: не отдавать по ним тему (дефолт `light-flat`), при новом `PUT` — создать новую сессию и новую cookie.
   - при первом обращении к API темы без авторизации — создать строку, выставить клиенту cookie `anonymous_session_id` (UUID), `Max-Age`/`Expires` согласовать с 72 ч (или session cookie + проверка TTL только на сервере).
   - **Индексы:** `updated_at` — для пакетной очистки (`DELETE … WHERE updated_at < now() - interval '72 hours'` по cron/worker или редкому scheduled job); при росте таблицы — опционально `(updated_at)` BRIN не обязателен на старте.

2. Таблица **`user_ui_themes`** (или `theme_preferences`) — **одна строка на субъекта**:
   - `id` — serial/BIGSERIAL PK;
   - `theme` — `VARCHAR(32) NOT NULL` с `CHECK (theme IN ('light-flat','light-3d','dark-neon'))` (список расширяется вместе с клиентом);
   - **Ровно один из двух FK** (взаимоисключающие NULL — через `CHECK` в миграции):
     - `praktikum_user_id` `TEXT NULL` **UNIQUE** — когда пользователь авторизован; значение = `praktikumUserIdForDb(req.praktikumUser)`;
     - `anonymous_session_id` `UUID NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE` **UNIQUE**.
   - Ограничение уровня БД «ровно один субъект»: например  
     `CHECK ((praktikum_user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1)`.
   - Альтернатива без XOR в одной таблице — **две таблицы** `auth_user_themes` и `guest_user_themes` с FK только на нужный родитель; чтение тогда двумя простыми запросами по ветке.
   - `updated_at` — `TIMESTAMPTZ`;
   - **Индексы:** уникальный по `praktikum_user_id` где not null; уникальный по `anonymous_session_id` где not null (partial unique indexes в PostgreSQL).

**Почему не одна JSONB-колонка в `users`:** отдельной таблицы `users` в репо пока нет; JSONB допустим для «пакета настроек UI», но для ТЗ с **FK** и **JOIN** явная таблица предпочтительнее. Если позже появится `users` с `id` bigint — можно добавить `user_id BIGINT REFERENCES users(id) ON DELETE CASCADE` и миграцию переноса с `praktikum_user_id`.

**Sequelize:** модели [`AnonymousSession`](../packages/server/models/AnonymousSession.ts), [`UserUiTheme`](../packages/server/models/UserUiTheme.ts), миграция [`20260516130000-create-ui-theme-tables.js`](../packages/server/migrations/20260516130000-create-ui-theme-tables.js). Запуск: `yarn db:migrate` из корня монорепы.

### 2.2. API и контроллеры

Базовый префикс (пример): **`/api/ui/theme`** — публичные ручки (и гость, и авторизованный), **без** обязательного `requirePraktikumAuth`, иначе гость не сможет сохранить тему.

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/ui/theme` | Вернуть текущую тему. Логика на сервере: если есть валидная сессия Практикума — **JOIN** `user_ui_themes` по `praktikum_user_id`; иначе по cookie `anonymous_session_id` — **JOIN** к `anonymous_sessions` и теме; если строки нет — `200` с дефолтом `light-flat`. |
| `PUT` | `/api/ui/theme` | Установить тему. Body: `{ "theme": "light-flat" \| "light-3d" \| "dark-neon" }`. Валидация whitelist. Транзакция: upsert строки в `user_ui_themes` для текущего субъекта; для гостя при отсутствии cookie — создать `anonymous_sessions`, Set-Cookie. |

**Реализация чтения одним запросом (JOIN, не подзапросы):**

```sql
-- Псевдокод для авторизованного пользователя (параметр :pid)
SELECT t.theme
FROM user_ui_themes AS t
WHERE t.praktikum_user_id = :pid
LIMIT 1;
```

Для гостя:

```sql
SELECT t.theme
FROM user_ui_themes AS t
INNER JOIN anonymous_sessions AS s ON s.id = t.anonymous_session_id
WHERE s.id = :cookieUuid
LIMIT 1;
```

При необходимости «одним запросом» для обоих случаев на уровне приложения разумнее **два простых запроса** по ветке auth/guest, чем UNION ALL — так проще индексы и план.

**Коды ответов:** `400` при неверной теме; `401` не нужен, если гость допустим; при опциональной авторизации — `attachPraktikumUser` без жёсткого 403 (в отличие от `/api/forum/**` в [forum-api-spec.md](./forum-api-spec.md)).

### 2.3. Соответствие требованиям ТЗ (чеклист)

| Требование | Как закрыть |
|------------|-------------|
| PostgreSQL 12+, Sequelize, Docker | Уже используется в проекте; новые миграции + модели в том же пакете `server`. |
| Не менее двух тем на клиенте | Уже **три** темы на клиенте; на сервере — тот же whitelist в `CHECK` / валидации. |
| Хранение палитры | На клиенте — файлы CSS; на сервере достаточно **строки-ключа темы**, без JSONB (JSONB имеет смысл, если позже захотите хранить кастомные пресеты). |
| Гость и авторизованный | Две ветки идентификации + FK на `anonymous_sessions` или уникальный `praktikum_user_id`. |
| Мгновенное переключение без reload | Остаётся на клиенте (уже есть); сервер только персистит. |
| Индексы на полях | Уникальные индексы на ключах субъекта; при больших объёмах — `updated_at` для сессий. |
| Foreign Key | `user_ui_themes.anonymous_session_id → anonymous_sessions.id`. |
| Без лишних подзапросов, предпочитать JOIN | В выборках темы — прямое соединение с сессией/пользователем, как выше. |

### 2.4. Связь с параллельной задачей (форум)

- Форум в спецификации завязан на **обязательную** авторизацию и `403` без сессии Практикума.
- API темы намеренно **публичный** для гостя — это другое правило доступа; не смешивайте роуты с `/api/forum` без явного разделения middleware.
- Общее: один Postgres, один стиль миграций, один `createApp`, CORS и cookie — согласовать с владельцем инфраструктуры, чтобы cookie анонимной сессии не отбрасывались браузером (`SameSite`, `Secure` в production).

---

## 3. Вопросы к продукту и команде — зафиксированные ответы

Используйте этот раздел как единый контракт при реализации миграций, API и клиентской синхронизации.

| # | Вопрос | Ответ |
|---|--------|--------|
| Q1 | **Приоритет источника правды:** пользователь сменил тему локально офлайн, на сервере старое значение — при входе перезаписываем клиент с сервера или отправляем локальное на сервер? | **Отправляем локальное на сервер** (`PUT` с темой из `localStorage` после появления сессии). Сервер не должен перетирать UI значением GET при расхождении без явного решения «сбросить к серверу» в настройках (такого сценария нет). |
| Q2 | **Идентификатор Практикума** для колонки `praktikum_user_id`: тип и поле из `req.praktikumUser`? | Колонка **`TEXT`**. В коде API Практикума id приходит числом в [`PraktikumUser.id`](../packages/server/middleware/praktikumUser.ts); для БД используется **`String(id)`** — функция **`praktikumUserIdForDb(user)`** в том же файле (комментарий в коде для коллег). |
| Q3 | **Срок жизни гостевой сессии** и фоновая очистка? | **72 часа** с последней активности (`updated_at`). Протухшие сессии: не использовать для чтения темы; периодически удалять старые строки (`anonymous_sessions` и связанные `user_ui_themes` по `ON DELETE CASCADE`), чтобы таблица не росла бесконечно. |
| Q4 | Синхронизация с **`boardFieldTheme`** (match-3)? | **Не нужна.** Тема лендинга и тема поля игры — **независимые оси** (в т.ч. потому что светлая тема лендинга на игровом поле выглядит слабо; пользователь может выбирать разное). |

Дополнительно можно вынести константу `GUEST_SESSION_TTL_HOURS = 72` в общий модуль сервера и использовать в middleware/cron и в описании cookie `Max-Age`.

---

## 4. Проверка работы (локально, API, Docker)

### 4.1. Предусловия

1. Миграции применены (таблицы `anonymous_sessions`, `user_ui_themes`):

   ```bash
   yarn db:migrate
   ```

2. В `.env` (см. [`.env.sample`](../.env.sample)):

   - `VITE_APP_API_URL=http://localhost:3000` — клиент ходит на Node API с хоста;
   - `POSTGRES_HOST=localhost` — для `yarn db:migrate` **с хоста**;
   - в Docker у сервиса `server` в [docker-compose.yml](../docker-compose.yml) уже `POSTGRES_HOST=postgres`.

### 4.2. API без UI (curl)

**Гость (без логина Практикума):**

```bash
# дефолт
curl -s http://localhost:3000/api/ui/theme

# сохранить тему — в ответе Set-Cookie: anonymous_session_id=...
curl -s -c /tmp/theme-cookies.txt -X PUT http://localhost:3000/api/ui/theme \
  -H 'Content-Type: application/json' \
  -d '{"theme":"dark-neon"}'

# прочитать с той же cookie
curl -s -b /tmp/theme-cookies.txt http://localhost:3000/api/ui/theme
# ожидаем: {"theme":"dark-neon"}
```

**Невалидная тема → 400:**

```bash
curl -s -X PUT http://localhost:3000/api/ui/theme \
  -H 'Content-Type: application/json' \
  -d '{"theme":"neon"}'
```

**Автотесты:**

```bash
yarn workspace server test
# uiTheme.test.ts, landingThemes.test.ts
```

### 4.3. Локально: клиент + сервер

```bash
docker compose up -d postgres   # опционально, если нет локального PG
yarn db:migrate
yarn dev:server                 # :3000
yarn dev:client                 # обычно :5173
```

**В браузере (DevTools → Network):**

1. Открыть приложение, дождаться завершения проверки сессии (`fetchUserThunk`).
2. Сменить тему (хедер на `/game` — луна/солнце, или выбор flat/3d на лендинге).
3. Должен уйти **`PUT http://localhost:3000/api/ui/theme`** с `{"theme":"..."}` и **`credentials: include`**.
4. У гостя при первом PUT — cookie **`anonymous_session_id`** (Application → Cookies).

**localStorage** (сохраняется после F5):

- `cosmic-match.landing-theme.v1`
- `cosmic-match.last-light-theme.v1` — при светлой теме

**Сценарий Q1 (локальное → сервер):** сменили тему без сети → UI и `localStorage` обновились; после восстановления сети и перезагрузки — снова **PUT** с локальной темой.

**Авторизованный пользователь:** нужна сессия Практикума (логин / Яндекс). В БД появится строка с `praktikum_user_id`.

**Dev без Практикума** (только локальный server, `NODE_ENV !== production`):

```env
LOCAL_PRAKTIKUM_AUTH_BYPASS=1
```

### 4.4. Проверка в БД

```bash
docker exec -it cosmic-match-postgres psql -U postgres -d postgres -c \
  "SELECT theme, praktikum_user_id, anonymous_session_id FROM user_ui_themes;"
```

После гостевого PUT — заполнен `anonymous_session_id`; после логина и PUT — `praktikum_user_id`.

### 4.5. Docker Compose

```bash
node init.js                    # как в README, если ещё не делали
docker compose up -d postgres
yarn db:migrate                 # с хоста, POSTGRES_HOST=localhost в .env
docker compose build
docker compose up
```

| Сервис   | URL с хоста              |
|----------|--------------------------|
| Клиент   | http://localhost:5173    |
| API      | http://localhost:3000    |
| Postgres | localhost:5432           |

**Особенности Docker:**

1. **Миграции** в образ `server` **не входят** и при старте **не выполняются** — один раз `yarn db:migrate` с хоста к порту `5432`.
2. **`VITE_APP_API_URL`** подставляется при **сборке** клиента. Для портов по умолчанию подходит `http://localhost:3000` (fallback в [`constants.tsx`](../packages/client/src/constants.tsx)). При других портах — пересобрать client с нужным значением в `.env` на этапе `docker compose build`.
3. В контейнере `server` **`NODE_ENV=production`** → **`LOCAL_PRAKTIKUM_AUTH_BYPASS` не работает**. В Docker удобно проверять **гостевую** тему; ветку «авторизован + `praktikum_user_id`» — через реальный логин в браузере или локальный `yarn dev:server` с bypass.
4. Клиент (`5173`) и API (`3000`) — разные origin; нужны CORS + `credentials: 'include'` (в [`createApp.ts`](../packages/server/createApp.ts) настроено).

**API в Docker:**

```bash
curl -s http://localhost:3000/api/ui/theme
curl -s -c /tmp/c.txt -X PUT http://localhost:3000/api/ui/theme \
  -H 'Content-Type: application/json' -d '{"theme":"light-3d"}'
curl -s -b /tmp/c.txt http://localhost:3000/api/ui/theme
```

**UI в Docker:** тот же сценарий, что в §4.3, клиент по `http://localhost:5173`.

### 4.6. Критерии «всё работает»

| Сценарий | Ожидание |
|----------|----------|
| Гость, первый PUT | 200, cookie `anonymous_session_id`, тема в БД |
| Гость, GET с cookie | та же тема |
| Смена темы в UI | класс на `body` сразу; PUT с debounce ~400 ms |
| F5 | тема из `localStorage` |
| Логин + смена темы | PUT, строка с `praktikum_user_id` в БД |
| PUT `theme: "bad"` | 400 |

### 4.7. Типичные проблемы

| Симптом | Что проверить |
|---------|----------------|
| **500** на `/api/ui/theme` | `yarn db:migrate`; Postgres доступен (`docker compose ps`) |
| PUT не уходит из браузера | `VITE_APP_API_URL` в Network (хост запроса) |
| Cookie не ставится | ответ PUT → Set-Cookie; для `localhost` реже блокируется |
| Тема не уходит на сервер после логина | нет cookie Практикума; для dev — `LOCAL_PRAKTIKUM_AUTH_BYPASS` |
