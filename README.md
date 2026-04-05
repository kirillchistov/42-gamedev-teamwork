# Match-3 GameDev 42

Это браузерная 2D-игра "3 в ряд", разрабатываемая в команде в рамках учебного проекта ЯП Middle Frontend + React.

На космической арене (игровом поле) игрок перемещает соседние фишки, чтобы собрать три и более одного цвета по горизонтали или вертикали.

### Как запускать?

1. Убедитесь что у вас установлен `node` и `docker`
2. Выполните команду `yarn bootstrap` - это обязательный шаг, без него ничего работать не будет :)
3. Выполните команду `yarn dev`
3. Выполните команду `yarn dev --scope=client` чтобы запустить только клиент
4. Выполните команду `yarn dev --scope=server` чтобы запустить только server


### Как добавить зависимости?
В этом проекте используется `monorepo` на основе [`lerna`](https://github.com/lerna/lerna)

Чтобы добавить зависимость для клиента 
```yarn lerna add {your_dep} --scope client```

Для сервера
```yarn lerna add {your_dep} --scope server```

И для клиента и для сервера
```yarn lerna add {your_dep}```


Если вы хотите добавить dev зависимость, проделайте то же самое, но с флагом `dev`
```yarn lerna add {your_dep} --dev --scope server```


### Тесты

Для клиента используется [`react-testing-library`](https://testing-library.com/docs/react-testing-library/intro/)

```yarn test```

### Линтинг

```yarn lint```

### Форматирование prettier

```yarn format```

### Production build

```yarn build```

И чтобы посмотреть что получилось


`yarn preview --scope client`
`yarn preview --scope server`

## Хуки
В проекте используется [lefthook](https://github.com/evilmartians/lefthook)
Если очень-очень нужно пропустить проверки, используйте `--no-verify` (но не злоупотребляйте :)

## Ой, ничего не работает :(

Откройте issue, я приду :)

## Автодеплой статики на vercel
Зарегистрируйте аккаунт на [vercel](https://vercel.com/)
Следуйте [инструкции](https://vitejs.dev/guide/static-deploy.html#vercel-for-git)
В качестве `root directory` укажите `packages/client`

Все ваши PR будут автоматически деплоиться на vercel. URL вам предоставит деплоящий бот

## Production окружение в докере
Перед первым запуском выполните `node init.js`


`docker compose up` - запустит три сервиса
1. nginx, раздающий клиентскую статику (client)
2. node, ваш сервер (server)
3. postgres, вашу базу данных (postgres)

Если вам понадобится только один сервис, просто уточните какой в команде
`docker compose up {sevice_name}`, например `docker compose up server`

## Цели проекта

- Отработать навыки командной разработки.
- Реализовать простой realtime мультиплеер, используя React, Redux, Typescript, Canvas, WebSocket, PostgreSQL.
- Реализовать авторизацию, взаимодействие пользователей, систему безопасности.
- Собрать полный цикл: от прототипа до деплоя.

**Клиент**

- TypeScript и React
- PostCSS
- Vite/Webpack, Docker
- HTML5 Canvas 2D API
- Jest

**Сервер**

- Node.js
- Express (HTTP API)
- React SSR
- Redux (Toolkit)
- Nginx, Proxy, SSL
- ws (WebSocket-сервер)
- JWT (авторизация, позже)
- PostgreSQL, MongoDB

## Архитектура (высокоуровнево)
**Клиент:**
- Рендер игрового поля и сущностей через Canvas.
- Сбор ввода пользователя (клавиатура/мышь).
- Отправка инпута на сервер и отображение состояния игры.

**Сервер:**
- Авторитативная модель игры (позиции, очки, столкновения).
- Управление комнатами и матчами.
- Авторизация пользователей и разграничение ролей.

## План спринтов (драфт)
**Спринт 5**
- Настроен монорепозиторий (`client/` + `server/`).
- Клиент:
  - Сверстаны ключевые страницы.
  - Настроен роутинг
  - Реализован драфт игры
  - Реализована логика авторизации и валидации
  - Исправлены ошибки и настроен ErrorBoundary

**Спринт 6 (текущий): игровое ядро, авторизация**
- Настроен монорепозиторий (`client/` + `server/`).
- Клиент:
  - Сверстаны ключевые страницы.
  - Настроен роутинг
  - Реализован драфт игры
  - Реализована логика авторизации и валидации
  - Исправлены ошибки и настроен ErrorBoundary

**Спринт 7 (SSR, лидерборд)**

**Спринт 8 (форум, темизация)**

**Спринт 9 (безопасность)**

## Команда
- Антон (spiritual mentor)
- Анна (chief of cosmic beauty)
- Сергей (head of eternal wisdom)
- Артур (master of stellar magic)
- Антон (universal treasure keeper)
- Кирилл (humble team lead)