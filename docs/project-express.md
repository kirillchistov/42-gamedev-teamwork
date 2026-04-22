# Express SSR: формальные требования без перестройки монорепозитория

Здесь описано **фактическое состояние после до-настройки** по задаче Express SSR, включая формальный маршрут React SSR **без Redux**.
Цель: закрыть требования задачи, не ломая текущую структуру `packages/client` + `packages/server`.

## 1. Карта текущего проекта

| Роль | Пакет | Порт по умолчанию | Назначение |
|------|--------|-------------------|------------|
| API на Express | `packages/server` | `3001` (`SERVER_PORT`) | JSON-эндпоинты (`/friends`, `/user` и т.д.), БД |
| Клиент + SSR на Express | `packages/client` | `80` (`PORT`) или из окружения | Vite + React; в **dev** и **preview** поднимается **свой** Express из `packages/client/server/index.ts` |

SSR в этом проекте живет **не в `packages/server`**, а **в клиентском пакете**: серверный бандл лежит в `packages/client/dist/server/`, статика клиента — в `packages/client/dist/client/`. Видимо так и задумано: один процесс отдаёт HTML и ассеты SPA.

Зависимости для задания (Express, `react`, `react-dom`, Vite для dev-режима SSR) **уже перечислены** в `packages/client/package.json`. Отдельно ставить Express в корень репозитория вроде не требуется, чтобы не нарушать существующую схему.

**Менеджер пакетов:** в корневом `package.json` указан **Yarn 1** (`packageManager: "yarn@1.22.22"`). Установка из корня: `yarn`.

---

## 2. Что требуется в задании

### 2.1. Установка зависимостей

- **Node.js:** версия из `engines` корня — `>=15` (для Vite 4 и TypeScript 6 возможно лучше использовать актуальный LTS, например 20.x).
- **Пакеты:** из корня репозитория выполнить 'yarn' (подтянут workspace 'client' и 'server').

Дополнительно для SSR-клиента уже используются, среди прочего: 'express', 'vite', 'react', 'react-dom', 'cookie-parser', 'serialize-javascript' — см. 'packages/client/package.json'.

### 2.2. Основной сервер Express

Файл уже создан: **'packages/client/server/index.ts'**. Он компилируется в JS командой из скрипта 'dev' / 'build' клиента ('tsc --project tsconfig.server.json'), затем запускается 'node server/index.js' из каталога 'packages/client'.

Скрипты клиента (актуальные):

- `yarn dev` — компиляция `server/*.ts(x)` + запуск Express в `NODE_ENV=development` + Vite `middlewareMode`.
- `yarn build:ssr-server` — `tsc --project tsconfig.server.json`.
- `yarn build:client` — production-сборка клиентских ассетов.
- `yarn build:ssr-client` — SSR-бандл `src/entry-server.tsx` в `dist/server`.
- `yarn build` — полный production-набор для SSR.
- `yarn preview` / `yarn start:ssr` — запуск Express в `NODE_ENV=production`.

Маршрут «главной» здесь реализован как **catch-all** 'app.get('*', …)': любой URL отдаётся через один SSR-обработчик (подходит для SPA с роутингом на клиенте).

### 2.3–2.4. Серверный рендеринг и интеграция с Express

Точка рендера — **'packages/client/src/entry-server.tsx'**: экспортируется функция 'render(req)', внутри используется **'ReactDOM.renderToString'** (серверный API из 'react-dom/server').

Express подставляет результат в шаблон **'packages/client/index.html'** через плейсхолдеры '<!--ssr-outlet-->', '<!--ssr-helmet-->', '<!--ssr-styles-->', '<!--ssr-initial-state-->' и отвечает через `res.status(200).set({ 'Content-Type': 'text/html' }).end(html)`.

Итоговая цепочка (как в проекте):

1. Прочитать 'index.html' (в dev — прогнать через 'vite.transformIndexHtml').
2. Динамически загрузить модуль рендера: в dev — `vite.ssrLoadModule('…/entry-server.tsx')`, в prod — `import('…/dist/server/entry-server.js')`.
3. Вызвать `render(req)`, собрать HTML, отправить клиенту.

### 2.5. Статика (CSS, JS)

- **Development:** `app.use(vite.middlewares)` — Vite сам отдаёт модули и HMR; статика из `public/` тоже обслуживается Vite.
- **Production:** `express.static(..., 'dist/client', { index: false })` — отдача собранных ассетов; `index: false`, чтобы запросы к путям приложения шли в SSR, а не в `index.html` как в файл.

### 2.6. Тестирование и отладка

Из каталога `packages/client`:

```bash
yarn dev
```

Открыть в браузере `http://localhost:3000` (или порт из `CLIENT_PORT` в `vite.config.ts`). В dev при ошибке SSR полезен стек, который Vite правит через `vite?.ssrFixStacktrace`.

Для production-сборки SSR:

```bash
yarn build && yarn preview
```

Параллельно API можно поднять из корня: `yarn dev:server` — Express из `packages/server` на `3001`. Переменные `EXTERNAL_SERVER_URL` / `INTERNAL_SERVER_URL` в скрипте клиента указывают клиенту, куда ходить за API.

---

## 3. Важно про «страницы без Redux» в текущем коде

`entry-server.tsx` **всегда** рендерит основное приложение через `<Provider store={…}>` и использует данные Redux (`configureStore`, `fetchData`, сериализация `initialState` в HTML).

Чтобы выполнить формальное требование «статические React-страницы **без** Redux», в сервер добавлен отдельный маршрут:

1. `/ssr-static` — отдельная React-страница, отрендеренная `ReactDOMServer.renderToString()` без роутера и без Redux.
2. Основной SSR (`app.get('*')`) остаётся как был: для полноценного приложения с Router + Redux.

Также в `server/index.ts` добавлены:

- `/health` для базовой проверки доступности сервера;
- централизованный `error handler`, чтобы SSR-ошибки не оставляли запрос «висящим».

---

## 4. Связка с `packages/server` (не путать с SSR)

`packages/server/index.ts` — это **другой** процесс Express (API). Проксирование API в SSR-процесс в репозитории **не обязательно**: клиент ходит на URL из `__EXTERNAL_SERVER_URL__` / `__INTERNAL_SERVER_URL__` (см. `packages/client/vite.config.ts` и скрипты `dev` в `packages/client/package.json`).

Если в задании требуется «один сервер отдаёт и HTML, и API», тогда отдельно добавляют, например, `app.use('/api', createProxyMiddleware({ target: 'http://localhost:3001' }))` в **SSR-сервер** — это уже изменение архитектуры; текущая структура это **не использует** намеренно.

---

## 5. Контрольный чеклист по заданию

| Требование | Где в проекте |
|------------|----------------|
| Express установлен | `packages/client/package.json`, `packages/server/package.json` |
| Файл сервера | `packages/client/server/index.ts` (+ компиляция через `tsconfig.server.json`) |
| `renderToString` | `packages/client/src/entry-server.tsx` |
| `res` + HTML | `packages/client/server/index.ts` (сборка из шаблона `index.html`) |
| React SSR без Redux | `GET /ssr-static` + `packages/client/server/static-page.tsx` |
| Статика CSS/JS | dev: Vite middleware; prod: `express.static('dist/client')` |
| Healthcheck | `GET /health` |
| Запуск и проверка | `yarn dev` / `yarn build && yarn preview` в `packages/client` |

## 6. Smoke-проверки

Из `packages/client`:

```bash
yarn dev
```

Проверки:

- `http://localhost:80/health` (или порт из `PORT`) возвращает JSON с `ok: true`;
- `http://localhost:80/ssr-static` возвращает HTML, созданный через `renderToString` без Redux;
- `http://localhost:80/` и клиентские маршруты продолжают работать через основной SSR.
