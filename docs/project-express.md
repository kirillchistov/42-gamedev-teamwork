# Мысли про Express и серверный рендеринг

Здесь описано **фактическое состояние** и гипотезы решения **с примерами кода** по задаче 7.1 Express SSR (включая статические страницы без Redux). 
Цель документа: решить задачу, не ломая текущую структуру.

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

Скрипты клиента:

- 'yarn dev' в scope 'client' (или 'yarn dev:client' из корня через Lerna) — dev + Vite 'middlewareMode'.
- 'yarn build' в 'client' — клиентский бандл + SSR-бандл ('vite build --ssr src/entry-server.tsx --outDir dist/server').
- 'yarn preview' в 'client' — production-режим: статика из 'dist/client' + импорт 'dist/server/entry-server.js'.

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

## 3. Важно про «страницы без Redux» в **текущем** коде

Сейчас `entry-server.tsx` **всегда** оборачивает дерево в `<Provider store={…}>` и использует данные из Redux (`configureStore`, `fetchData`, сериализация `initialState` в HTML).

Чтобы выполнить требование «статические React-страницы **без** Redux», не ломая остальную структуру, есть два пути:

1. **Формализованный (отдельный маленький пример)** — отдельный файл рендера только для демо-маршрута (см. раздел 5). Тогда нужно согласовать **тот же** React-узел на клиенте при гидратации (`main.tsx`), иначе будет рассинхрон.
2. **Аскетичный** — задание уже выполнено в существующей связке Express + `renderToString` + статика, а «без Redux» описать как **возможное упрощение** дерева в `render` для отдельных путей (ветвление по `req.path`). Это надо обсудить...

Ниже — врезки, которые можно добавить **без перестройки монорепозитория**.

---

## 4. Врезка: middleware обработки ошибок SSR

После регистрации маршрута `app.get('*', …)` в `packages/client/server/index.ts` имеет смысл добавить **Express error handler** (четыре аргумента `(err, req, res, next)`), чтобы в production не «висеть» на необработанном исключении и логировать причину.

Добавим **после** `app.get('*', async …)` и **до** `app.listen`:

```ts
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err)
    res.status(500).type('text/plain').send('SSR error')
  }
)
```

При необходимости в development можно отдавать текст стека (только для локальной отладки).

---

## 5. Врезка: пример «статической» страницы без Redux (по шаблону ЯП)

Ниже — **образец** отдельного модуля на только `react` и `react-dom/server`. Чтобы **`yarn dev` / `tsc --project tsconfig.server.json`** продолжали собирать сервер без расширения области `src/`, файл лучше положить **рядом с** `server/index.ts`, а не под `src/`: тогда он попадает в ту же компиляцию CommonJS, что и текущий SSR-сервер.

**Шаг A — расширение** `packages/client/tsconfig.server.json`:

- В `compilerOptions` добавим **`"jsx": "react-jsx"`**, иначе `tsc` не соберёт `.tsx` в каталоге `server/`.
- В массив `include` добавим файл компонента:

```json
"compilerOptions": {
  "ignoreDeprecations": "6.0",
  "composite": true,
  "target": "es2019",
  "module": "commonjs",
  "moduleResolution": "node",
  "allowSyntheticDefaultImports": true,
  "esModuleInterop": true,
  "skipLibCheck": true,
  "lib": ["es2019"],
  "types": ["node"],
  "jsx": "react-jsx"
},
"include": [
  "server/index.ts",
  "server/StaticHello.tsx",
  "server/**/*.d.ts"
]
```

(остальные поля `compilerOptions` оставим как в репозитории; в примере показаны только нужные для JSX строки.)

**Шаг B — файл** `packages/client/server/StaticHello.tsx`:

```tsx
import React from 'react'

export function StaticHello() {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <title>Static SSR demo</title>
      </head>
      <body>
        <div id="root">Привет с сервера (без Redux)</div>
      </body>
    </html>
  )
}
```

**Шаг C — врезка в** `packages/client/server/index.ts` (разместить **до** `app.get('*', …)`). Используется `React.createElement`, чтобы не переводить `index.ts` в `index.tsx`:

```ts
import React from 'react'
import ReactDOM from 'react-dom/server'
import { StaticHello } from './StaticHello'

app.get('/__ssr_static_demo', (_req, res) => {
  const html =
    '<!DOCTYPE html>' +
    ReactDOM.renderToString(
      React.createElement(StaticHello)
    )
  res.status(200).type('text/html').send(html)
})
```

Ограничения шаблона:

- Это **не** гидратация существующего `main.tsx`: отдельный HTML без того же дерева, что в `index.html`.
- Для выполнения задачи такой маршрут демонстрирует **`renderToString` + `res.send`/`type`** без Redux и без общего роутера.

Если нужна гидратация той же разметки, придётся добавить отдельный клиентский entry (второй `<script type="module">`) или условную ветку в `main.tsx` — это уже расширение за рамки «маленькой врезки».

---

## 6. Связка с `packages/server` (не путать с SSR)

`packages/server/index.ts` — это **другой** процесс Express (API). Проксирование API в SSR-процесс в репозитории **не обязательно**: клиент ходит на URL из `__EXTERNAL_SERVER_URL__` / `__INTERNAL_SERVER_URL__` (см. `packages/client/vite.config.ts` и скрипты `dev` в `packages/client/package.json`).

Если в задании требуется «один сервер отдаёт и HTML, и API», тогда отдельно добавляют, например, `app.use('/api', createProxyMiddleware({ target: 'http://localhost:3001' }))` в **SSR-сервер** — это уже изменение архитектуры; текущая структура это **не использует** намеренно.

---

## 7. Контрольный чеклист по заданию

| Требование | Где в проекте |
|------------|----------------|
| Express установлен | `packages/client/package.json`, `packages/server/package.json` |
| Файл сервера | `packages/client/server/index.ts` (+ компиляция через `tsconfig.server.json`) |
| `renderToString` | `packages/client/src/entry-server.tsx` |
| `res` + HTML | `packages/client/server/index.ts` (сборка из шаблона `index.html`) |
| Статика CSS/JS | dev: Vite middleware; prod: `express.static('dist/client')` |
| Запуск и проверка | `yarn dev` / `yarn build && yarn preview` в `packages/client` |

После добавления врезок из разделов 4–5 перезапускаем dev-сервер клиента и проверяем `/__ssr_static_demo` и основные маршруты приложения.
