# Redux и React Router в SSR

Документ описывает **текущую реализацию** SSR в **`packages/client`** (Express + Vite в [`packages/client/server`](../packages/client/server)). JSON API живёт в отдельном [`packages/server`](../packages/server) — см. **[`project-structure.md`](./project-structure.md)**.

Спринты **7.1–7.2** (Express SSR, Redux + Router на сервере) — **выполнены**.

---

## 1. Что сделано

### 1.1. Роутинг на сервере

Используется **data router** React Router v6: `createStaticHandler`, `createStaticRouter`, `StaticRouterProvider`. Запрос Express превращается в `Request`, выполняется `query`, рендер с тем же деревом маршрутов, что на клиенте.

Файл: [`packages/client/src/entry-server.tsx`](../packages/client/src/entry-server.tsx) — функция **`render(req)`**.

### 1.2. Redux на сервере

На каждый HTTP-запрос:

1. `configureStore({ reducer })` — тот же `reducer`, что в [`store.ts`](../packages/client/src/store.ts).
2. Для совпавшего маршрута вызывается **`fetchData`** из [`routes.tsx`](../packages/client/src/routes.tsx) с `{ dispatch, state, ctx }` (cookie/токен из `entry-server.utils`, если нужно).
3. `dispatch(setPageHasBeenInitializedOnServer(true))` — [`ssrSlice`](../packages/client/src/slices/ssrSlice.ts), чтобы [`usePage`](../packages/client/src/hooks/usePage.ts) не дублировал загрузку после гидратации.

### 1.3. Сериализация в HTML

После `fetchData`: `initialState = store.getState()` → в шаблон вставляется

```html
<script>window.APP_INITIAL_STATE = …</script>
```

через **`serialize-javascript`** (`isJSON: true`) в [`packages/client/server/index.ts`](../packages/client/server/index.ts). Плейсхолдер: `<!--ssr-initial-state-->` в [`packages/client/index.html`](../packages/client/index.html).

### 1.4. Клиент

[`store.ts`](../packages/client/src/store.ts) — `preloadedState: window.APP_INITIAL_STATE` (при отсутствии — `undefined`). После чтения глобаль можно очистить, чтобы не держать дубликат в памяти.

### 1.5. Прокси и cookie (спринт 7–8)

В **браузере** запросы к Практикуму (`/api/v2`) и к нашему API (`/api/forum`, `/friends`, `/user`) идут на **origin SSR** (порт клиента, по умолчанию **9000**) через [`apiProxy.ts`](../packages/client/server/apiProxy.ts) — `credentials: 'include'`.

В **Node** (`fetchData`) нет `window`; вызовы к **нашему** API с SSR-машины — на `VITE_APP_API_URL` / `INTERNAL_SERVER_URL` (см. `.env.sample`), не на URL страницы в браузере.

---

## 2. Соответствие заданию курса (2.1–2.5)

| Подпункт | Реализация |
| --- | --- |
| 2.1 Загрузка на сервере | `fetchData` в `routes` + `entry-server.tsx` |
| 2.2 Сохранение state | `store.getState()` после инициализации |
| 2.3 Передача в HTML | `serialize` → `window.APP_INITIAL_STATE` |
| 2.4 Клиент | `preloadedState` в `configureStore` |
| 2.5 URL | `createStaticHandler` по `req.originalUrl` |

---

## 3. Добавление страницы с SSR-данными

1. В `routes.tsx`: `path`, `Component`, **`fetchData`**.
2. `fetchData` = `({ dispatch, ctx }) => dispatch(yourThunk(...))` или `Promise.all([...])`.
3. На странице: **`usePage({ initPage: initYourPage })`** — та же логика, что в `fetchData`.
4. В `fetchData` **не использовать** `window`, `document`, `localStorage` без guard.

Примеры: [`initLeaderboardPage`](../packages/client/src/pages/LeaderboardPage.tsx), [`initForumPage`](../packages/client/src/pages/ForumPage.tsx).

---

## 4. Риски

| Риск | Митигация |
| --- | --- |
| Hydration mismatch | Не использовать `Date.now()` / `Math.random()` в первом рендере без стабилизации |
| Двойная загрузка | `ssrSlice` + `usePage` |
| Падение SSR из `window` в thunk | Ревью `init*Page` на SSR-safe код |
| Cookie только в браузере | Для SSR-запросов к Практикуму — явный проброс `Cookie` из `req`, если понадобится |

---

## 5. Чеклист приёмки (спринт 7)

- [x] Конкретный URL рендерит нужную страницу на сервере.
- [x] В HTML есть `window.APP_INITIAL_STATE`.
- [x] После гидратации store совпадает с серверным.
- [x] `fetchData` на защищённых маршрутах (форум, лидерборд) подключены.
- [ ] Периодический smoke: нет hydration errors на `/`, `/game`, `/forum`, `/leaderboard`.

---

## 6. Smoke-test

```bash
yarn dev:client   # или yarn dev
```

1. Открыть **http://localhost:9000/forum** (или другой маршрут с `fetchData`).
2. View Source — скрипт `window.APP_INITIAL_STATE`.
3. Redux DevTools — данные слайсов совпадают с ожидаемыми после первой отрисовки.
4. Консоль — без критичных hydration errors.

---

## 7. Связанные документы

- HTTP-слои: [`project-structure.md`](./project-structure.md), [`http-apis-overview.svg`](./http-apis-overview.svg).
- OAuth (колбэк после редиректа): [`project-yandex-oauth.md`](./project-yandex-oauth.md).
- Утечки / Performance observer: [`MEMORYLEAKS.md`](./MEMORYLEAKS.md).
