# Redux + Router SSR (план реализации для спринта)

Этот документ — **план и чеклист** по цепочке Redux + React Router на SSR. Он **не** описывает сетевую архитектуру (Практикум vs `packages/server`, порты, `VITE_APP_API_URL`): это единообразно разобрано в **[`project-structure.md`](./project-structure.md)** (раздел про HTTP и диаграммы). Текущая реализация data router + стора — в **[`project-redux-router-ssr.md`](./project-redux-router-ssr.md)**.

Цель задачи: при SSR на сервере создать Redux state для конкретного URL, передать его в HTML и корректно восстановить на клиенте как `preloadedState`.

Ограничения и контекст:

- **SSR-сервер** живёт только в пакете **`packages/client`** — каталог [`packages/client/server`](../packages/client/server) (исходник [`index.ts`](../packages/client/server/index.ts), в рантайме после `yarn build:ssr-server` используется собранный **`index.js`**). Это **не** тот же процесс, что JSON API в [`packages/server`](../packages/server).
- **Cookie и сеть:** в браузере cookie Практикума уходят и на **Практикум** (`BASE_URL`), и на **наш Node** (`SERVER_HOST` / `VITE_APP_API_URL`) при `credentials: 'include'`. При написании **`fetchData`** для SSR по-прежнему нельзя использовать `window` / `document`; если когда-нибудь понадобятся **серверные** запросы к нашему API из `fetchData`, нужно явно учитывать URL (`INTERNAL_SERVER_URL` / env), а не предполагать «тот же хост, что SSR».

---

## 1) Целевое поведение

После внедрения:

1. Сервер рендерит **ровно тот роут**, куда пришёл пользователь.
2. Для этого роута сервер выполняет нужную инициализацию данных (через `dispatch` или подготовку initial state).
3. Сервер берёт `store.getState()`, сериализует его и вкладывает в HTML.
4. Клиент поднимает store из этого состояния, без повторной «холодной» инициализации.

---

## 2) Что уже есть в проекте (важно не сломать)

На текущий момент в репозитории уже реализована почти вся требуемая схема:

- В `packages/client/src/entry-server.tsx`:
  - используется `createStaticHandler`, `createStaticRouter`, `StaticRouterProvider`;
  - серверный store создаётся через `configureStore({ reducer })`;
  - выполняется `fetchData` для совпавшего route;
  - возвращается `initialState: store.getState()`.
- В [`packages/client/server`](../packages/client/server) (SSR Express, см. [`index.ts`](../packages/client/server/index.ts)):
  - `initialState` сериализуется через `serialize-javascript`;
  - вставляется в HTML как `window.APP_INITIAL_STATE`.
- В `packages/client/src/store.ts`:
  - клиентский store стартует с `preloadedState: window.APP_INITIAL_STATE`.

Итого: задача по сути — не «изобрести заново», а закрепить контракт, закрыть пробелы, добавить проверяемость и документацию реализации.

---

## 3) Реализация по пунктам задачи

### 3.1. Загрузка данных для SSR

Контракт:

- каждый route должен иметь `fetchData` (даже если это `Promise.resolve()`),
- `fetchData` вызывается на сервере до `renderToString`.

Что сделать:

1. Проверить `routes` и гарантировать, что у каждого роута есть `fetchData`.
2. В `entry-server.tsx` оставляем текущий паттерн:
   - находим совпавший route,
   - вызываем `await fetchData({ dispatch, state, ctx })`.
3. Зафиксировать правило: в `fetchData` не использовать `window`, `document`, `localStorage`.

Почему:

- SSR выполняется в Node.js, браузерных API нет.

---

### 3.2. Сохранение Redux state на сервере

Контракт:

- состояние берётся только после всех `fetchData`.

Что сделать:

1. Оставить/закрепить в `entry-server.tsx`:
   - `initialState: store.getState()` после инициализации.
2. Типизировать возвращаемый объект рендера (`html`, `helmet`, `styleTags`, `initialState`) и не допускать `any`.

---

### 3.3. Передача состояния в HTML

Контракт:

- сериализация безопасная, через `serialize-javascript` с `isJSON: true`.

Что сделать:

1. В SSR-ветке `packages/client/server` оставить текущую вставку:
   - `<script>window.APP_INITIAL_STATE = ...</script>`.
2. Не заменять на «сырое `JSON.stringify` в шаблон» без экранирования.

---

### 3.4. Инициализация клиентского store

Контракт:

- клиент читает `window.APP_INITIAL_STATE` и использует как `preloadedState`.

Что сделать:

1. В `store.ts` сохранить текущий подход с `preloadedState`.
2. Добавить безопасный fallback:
   - если `window.APP_INITIAL_STATE` отсутствует (например, чистый SPA fallback), использовать `undefined`.
3. После инициализации очистить глобальную ссылку (опционально), чтобы уменьшить удержание памяти:
   - `delete window.APP_INITIAL_STATE` после создания store.

Примечание:

- Пункт 2 особенно полезен для окружений, где страница может быть отдана без SSR-вставки.

---

### 3.5. Рендер нужного URL через StaticRouter

Контракт:

- серверный рендер строится из URL запроса (`req.originalUrl`),
- React Router на сервере использует статический роутер.

Что сделать:

1. Сохранить использование `createFetchRequest(req)` + `query(fetchRequest)`.
2. Убедиться, что для «не найдено» корректно отдаётся 404/ошибка по договорённости проекта.
3. Не переводить эту часть на `BrowserRouter` или клиентские API.

---

## 4) План изменений по файлам

### `packages/client/src/entry-server.tsx`

- [ ] Нормализовать обработку совпавших роутов:
  - поддержать не только первый матч при необходимости загрузки данных;
  - не падать, если у роута отсутствует `fetchData` (временная совместимость).
- [ ] Зафиксировать тип `fetchData` в route-контракте.
- [ ] Логи ошибок инициализации сделать информативными (URL + имя route).

### `packages/client/src/store.ts`

- [ ] Добавить безопасный fallback при отсутствии `window.APP_INITIAL_STATE`.
- [ ] Опционально очищать глобальную переменную после старта store.

### `packages/client/server` (SSR Express)

- [ ] Проверить, что вставка `window.APP_INITIAL_STATE` всегда происходит в SSR-ветке `app.get('*')` в [`index.ts`](../packages/client/server/index.ts) (или в собранном `index.js` после `tsc`).
- [ ] Не трогать `serialize(..., { isJSON: true })`.

### `packages/client/src/routes.tsx` (+ init-функции страниц)

- [ ] Для каждого route обеспечить `fetchData`.
- [ ] Убедиться, что `fetchData` SSR-safe (без браузерных API).

---

## 5) Риски и как их снять

- **Гидратация не совпадает:** сервер/клиент рендерят разное дерево.
  - Решение: не использовать случайные данные (`Date.now()`, `Math.random()`) в первом рендере без стабилизации.
- **Двойная загрузка данных:** сервер уже инициализировал, клиент повторяет.
  - Решение: текущий `ssrSlice` + `usePage` оставить как механизм подавления повтора.
- **Падение SSR из-за `window` в `fetchData`:**
  - Решение: ревью init-функций страниц на SSR-safe код.

---

## 6) Чеклист приёмки

- [ ] Запрос на конкретный URL (`/`, `/game`, `/forum/...`) рендерит нужную страницу на сервере.
- [ ] В HTML есть `window.APP_INITIAL_STATE`.
- [ ] После гидратации клиентский store стартует с серверным state.
- [ ] Нет критичных hydration-ошибок в консоли.
- [ ] Для маршрутов с `fetchData` данные уже видны на первом HTML-ответе.
- [ ] Для маршрутов без серверной инициализации приложение не падает.

---

## 7) Минимальный smoke-test (ручной)

1. Запустить:

```bash
yarn workspace client dev
```

2. Открыть страницу и проверить source HTML:

- наличие скрипта `window.APP_INITIAL_STATE = ...`.

3. В DevTools:

- убедиться, что нет ошибок React hydration;
- сравнить срезы store после старта с ожидаемыми серверными данными.

4. Повторить для 2-3 разных URL, включая вложенный маршрут.

---

## 8) Дальнейшие улучшения (SSR + auth)

Уже сейчас: в браузере сессия Практикума используется для запросов к API Практикума и к **`packages/server`**; защита наших ручек — **`requirePraktikumAuth`** (см. [`project-structure.md`](./project-structure.md)).

Опционально на будущее:

- Явный **проброс cookie / токена** в `fetchData`, если понадобится дергать **наш** API **с Node SSR** (другой origin / `INTERNAL_SERVER_URL` — не путать с URL страницы в браузере).
- Ужесточение типов и e2e: SSR + защищённые маршруты + редиректы при 403.
