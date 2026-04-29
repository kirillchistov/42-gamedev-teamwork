# Redux и React Router в SSR (текущая реализация и чеклист задания)

Документ привязан к монорепозиторию: SSR выполняется в **`packages/client`** (Express + Vite), а не в `packages/server`.

## 1. Что уже сделано в проекте

### 1.1. Роутинг «как у пользователя» на сервере

На сервере используется **статический data router** React Router v6 (`createStaticHandler`, `createStaticRouter`, `StaticRouterProvider`), а не устаревший одиночный `StaticRouter`. Смысл тот же: запрос `req` превращается в `Request`, выполняется `query`, затем рендер с тем же набором маршрутов, что и на клиенте.

Ключевой файл: `packages/client/src/entry-server.tsx` — функция **`render(req)`** строит `fetchRequest` из Express-запроса, вызывает `query`, оборачивает приложение в `StaticRouterProvider`.

### 1.2. Redux на сервере

В `render` создаётся отдельный стор на запрос:

- `configureStore({ reducer })` — тот же `reducer`, что и на клиенте (`packages/client/src/store.ts`).
- Перед `renderToString` для совпавшего маршрута вызывается **`fetchData`** из конфигурации роута (см. `packages/client/src/routes.tsx`): туда передаются `dispatch`, `state`, `ctx` (в т.ч. `clientToken` из cookie — задел под авторизацию).
- После инициализации диспатчится `setPageHasBeenInitializedOnServer(true)` (`ssrSlice`), чтобы на клиенте **`usePage`** не дублировал загрузку после гидратации.

### 1.3. Сериализация и передача `initialState`

1. **`store.getState()`** после загрузки данных.
2. В шаблон `index.html` вставляется скрипт с **`window.APP_INITIAL_STATE`** через `serialize-javascript` (безопасная JSON-строка для вставки в HTML).

Фрагмент сервера:

```102:126:packages/client/server/index.ts
      const {
        html: appHtml,
        initialState,
        helmet,
        styleTags,
      } = await render(req)

      // Заменяю комментарий на сгенерированную HTML-строку
      const html = template
        .replace('<!--ssr-styles-->', styleTags)
        .replace(
          `<!--ssr-helmet-->`,
          `${helmet.meta.toString()} ${helmet.title.toString()} ${helmet.link.toString()}`
        )
        .replace(`<!--ssr-outlet-->`, appHtml)
        .replace(
          `<!--ssr-initial-state-->`,
          `<script>window.APP_INITIAL_STATE = ${serialize(
            initialState,
            {
              isJSON: true,
            }
          )}</script>`
        )
```

Плейсхолдер в HTML:

```17:18:packages/client/index.html
    <!--ssr-initial-state-->
    <div id="root"><!--ssr-outlet--></div>
```

### 1.4. Восстановление стора на клиенте

Глобальный тип и **`preloadedState`** при создании единственного клиентского стора:

```15:36:packages/client/src/store.ts
declare global {
  interface Window {
    APP_INITIAL_STATE: RootState
  }
}

export const store = configureStore({
  reducer,
  preloadedState:
    typeof window === 'undefined'
      ? undefined
      : window.APP_INITIAL_STATE,
})
```

На практике это эквивалент учебному **`createStore(reducer, preloadedState)`**: Redux Toolkit просто объединяет reducer и начальное состояние в одном вызове.

### 1.5. Клиентская навигация после SSR

`packages/client/src/hooks/usePage.ts` читает флаг из `ssrSlice`: если страница уже инициализирована на сервере, клиентский `initPage` **не** вызывается повторно при первом монтировании; иначе выполняется та же логика загрузки, что и при переходе по ссылкам внутри SPA.

---

## 2. Соответствие подпунктам задания (2.1–2.5)

| Подпункт | Реализация в репозитории |
|----------|-------------------------|
| **2.1** Загрузка данных на сервере | `fetchData` в `routes` + `await fetchData({ dispatch, state, ctx })` в `entry-server.tsx` |
| **2.2** Сохранение стейта на сервере | `initialState: store.getState()` в возврате `render` |
| **2.3** Передача в HTML | `serialize` → `window.APP_INITIAL_STATE` в `server/index.ts` |
| **2.4** Инициализация на клиенте | `preloadedState: window.APP_INITIAL_STATE` в `store.ts` |
| **2.5** Нужный URL | `createStaticHandler` / `StaticRouterProvider` по `req.originalUrl` |

---

## 3. Врезки при расширении (не ломая схему)

### 3.1. Новая страница с данными для SSR

1. В `routes.tsx` добавьте объект маршрута с `path`, `Component`, **`fetchData`**.
2. Реализуйте `fetchData` как `({ dispatch, ctx }) => dispatch(yourThunk(...))` или `Promise.all([...])`.
3. На странице вызовите **`usePage({ initPage: initYourPage })`** с той же `initYourPage`, что и в `fetchData` (копия логики для клиентской навигации).

### 3.2. Если задание формально требует именно `StaticRouter`

В React Router 6 для data routers рекомендуемый API — текущий (`StaticRouterProvider`). Если в курсе требуют классический пример с `StaticRouter` + `Routes`, его можно показать отдельно; для **этого** проекта менять data router на legacy не нужно — поведение «URL с сервера = тот же маршрут» уже обеспечено.

### 3.3. Авторизация по cookie «позже»

`createContext` в `entry-server.utils.ts` уже передаёт **`clientToken: req.cookies.token`**. Достаточно в `fetchData`/thunk использовать `ctx.clientToken` или `credentials: 'include'` к API Практикума, когда появится единая схема OAuth/cookie.

---

## 4. Проверка

1. `cd packages/client && yarn dev`
2. Откройте страницу с тяжёлым `fetchData` (например, форум) и в DevTools → Elements убедитесь, что в начале `<body>` есть скрипт с `window.APP_INITIAL_STATE`.
3. Сравните данные в Redux DevTools после гидратации с тем, что должен был отдать сервер (совпадение ключей слайсов).
