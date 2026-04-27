# Redux и React Router в SSR (реализация)

SSR выполняется в `packages/client` (Express + Vite), без изменения структуры монорепозитория.

## 1. Что реализовано

### 1.1. Рендер конкретного URL на сервере

- Используется data-router API React Router v6:
  - `createStaticHandler`
  - `createStaticRouter`
  - `StaticRouterProvider`
- URL запроса берётся из `req.originalUrl`, а для route matching используется `url.pathname`.

### 1.2. Загрузка данных перед SSR

- Для маршрутов введён явный контракт:
  - `AppRoute`
  - `PageInitFn`
- На сервере выполняется инициализация данных для **всех matched routes**, а не только первого.
- Вызов каждого `fetchData` получает:
  - `dispatch`
  - актуальный `state` через `store.getState()`
  - `ctx` (на будущее для cookie auth).

### 1.3. Сохранение и передача server state

- После инициализации сервер берёт `store.getState()`.
- Состояние сериализуется через `serialize-javascript` (`isJSON: true`) и вкладывается в HTML:
  - `window.APP_INITIAL_STATE = ...`.

### 1.4. Восстановление store на клиенте

- Добавлен фабричный метод `createAppStore(preloadedState?)`.
- Клиент читает `window.APP_INITIAL_STATE` и стартует store из него.
- После чтения глобальная переменная очищается (`delete window.APP_INITIAL_STATE`), чтобы не удерживать лишнюю ссылку в памяти.
- Если SSR state отсутствует, используется безопасный fallback `undefined`.

### 1.5. Клиентская навигация после SSR

- `usePage` сохраняет логику «не дублировать init после server render».
- Добавлена безопасная обработка async-ошибок инициализации на клиенте (чтобы не было unhandled promise rejection).

### 1.6. Обработка `Response` от роутера

- Если серверный роутер возвращает/бросает `Response` (redirect/error), Express корректно:
  - делает `res.redirect(...)` по `Location`,
  - или возвращает статус/тело ответа вместо падения в 500.

---

## 2. Соответствие требованиям задачи (2.1–2.5)

| Подпункт | Реализация |
|----------|------------|
| **2.1** Загрузка данных на сервере | `fetchData` вызывается в `entry-server.tsx` для matched routes через `dispatch`/`state`/`ctx` |
| **2.2** Сохранение состояния | `initialState: store.getState()` после SSR-инициализации |
| **2.3** Передача в HTML | `window.APP_INITIAL_STATE` вставляется в шаблон в `server/index.ts` |
| **2.4** Инициализация на клиенте | клиентский store создаётся с `preloadedState` из `window.APP_INITIAL_STATE` |
| **2.5** Рендер нужного URL | `createStaticHandler` + `createStaticRouter` + `StaticRouterProvider` по URL запроса |

---

## 3. Что проверять вручную

1. Запуск:

```bash
yarn workspace client dev
```

2. Проверка разных URL (`/`, `/game`, `/forum/:topicId`):

- отдаётся корректная SSR-страница;
- в HTML присутствует `window.APP_INITIAL_STATE`.

3. Проверка в DevTools:

- после гидратации состояние в Redux DevTools совпадает с серверным;
- нет критичных hydration-ошибок;
- нет unhandled promise ошибок от `initPage`.

4. Проверка redirect/error сценариев:

- если роутер вернул `Response` с `Location`, сервер делает redirect;
- если вернул `Response` с ошибкой, сервер отдаёт статус/тело, а не «глухой» 500.
