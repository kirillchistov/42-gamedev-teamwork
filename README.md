# Match-3 GameDev 42

Это браузерная 2D-игра "3 в ряд", разрабатываемая командой 42 в рамках учебного проекта ЯП Middle Frontend + React.

На космической арене (игровом поле) игрок перемещает соседние фишки, чтобы собрать три и более одного цвета по горизонтали или вертикали.

## Демо
- [Демо-фронт на GitHub pages](https://kirillchistov.github.io/42-gamedev-teamwork)

На Pages авторизация идёт через **Service Worker** (same-origin `/api/v2` → Практикум), иначе Safari на телефоне не сохраняет cookie сессии. После обновления деплоя — жёсткое обновление страницы; при сбое входа — очистить данные сайта.


## Видео-презентация
- [Спринты 5 и 6](https://www.loom.com/share/4dd7e2e383e34fce9ee22244edb2bb7b)
- [Спринты 7 и 8](https://disk.yandex.ru/i/oE5sNT-GRzXwuA)


### Как запускать?

1. Убедитесь что у вас установлен 'node' и 'docker'
2. Выполните команду 'yarn bootstrap' - это обязательный шаг, без него ничего работать не будет :)
3. Выполните команду 'yarn dev'
3. Выполните команду 'yarn dev --scope=client' чтобы запустить только клиент
4. Выполните команду 'yarn dev --scope=server' чтобы запустить только server


### Как добавить зависимости?
В этом проекте используется 'monorepo' на основе ['lerna'](https://github.com/lerna/lerna)

Чтобы добавить зависимость для клиента 
```yarn lerna add {your_dep} --scope client```

Для сервера
```yarn lerna add {your_dep} --scope server```

И для клиента и для сервера
```yarn lerna add {your_dep}```


Если вы хотите добавить dev зависимость, проделайте то же самое, но с флагом 'dev'
```yarn lerna add {your_dep} --dev --scope server```


### Тесты

Для клиента используется ['react-testing-library'](https://testing-library.com/docs/react-testing-library/intro/)

```yarn test```

### Линтинг

```yarn lint```

### Форматирование prettier

```yarn format```

### Production build

```yarn build```

И чтобы посмотреть что получилось:

'yarn preview --scope client'
'yarn preview --scope server'

## Хуки
В проекте используется [lefthook](https://github.com/evilmartians/lefthook)
Если очень-очень нужно пропустить проверки, используйте '--no-verify' (но не злоупотребляйте :)

## Ой, ничего не работает :(

Откройте issue, я приду :)

## Автодеплой статики на vercel
Зарегистрируйте аккаунт на [vercel](https://vercel.com/)
Следуйте [инструкции](https://vitejs.dev/guide/static-deploy.html#vercel-for-git)
В качестве 'root directory' укажите 'packages/client'

Все ваши PR будут автоматически деплоиться на vercel. URL вам предоставит деплоящий бот

## Production окружение в докере
Перед первым запуском выполните:

```bash
node init.js
yarn install
```

Проверьте '.env': для Docker Postgres нужен пользователь 'postgres', пароль из 'POSTGRES_PASSWORD', база 'postgres', 'POSTGRES_HOST=localhost' для миграций с хоста. Если порт '5432' занят локальным PostgreSQL, поменяйте 'POSTGRES_PORT' на свободный порт.

'docker compose up' запустит четыре сервиса:
1. 'postgres' — PostgreSQL.
2. 'migrate' — одноразовый запуск Sequelize-миграций после healthy Postgres.
3. 'server' — Node/Express API, стартует после успешных миграций.
4. 'client' — Node SSR-клиент, стартует после healthy API-сервера.

Клиент доступен на 'http://localhost:${CLIENT_PORT:-9000}', API — на 'http://localhost:${SERVER_PORT:-3000}'. Если нужно поднять только часть стека: 'docker compose up server' или 'docker compose up postgres'.

Подробнее режимы запуска (dev / Docker / параллельно): [docs/sprint-7-8-demo-script.md](docs/sprint-7-8-demo-script.md).

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

## [План спринтов](https://github.com/users/kirillchistov/projects/5)
**Спринт 5**
- [x] 5.1 Настроен монорепо (Все / L1)
- [x] 5.2 Отображение страниц (React Router + DOM) (Кирилл / L1)
- [x] 5.3.1 Сверстан лендинг проекта (Кирилл / L0)
- [x] 5.3.2 Сверстана страница игры после логина (Кирилл / L1)
- [x] 5.4 Сверстана error/404 (Кирилл / L0.5)
- [x] 5.5 Сверстана /error/500 (Кирилл / L0.5)
- [x] 5.6 Сверстана /login (Кирилл / L1)
- [x] 5.7 Реализована логика авторизации (Артур / L2)
- [x] 5.8 Сверстан /forum (Анна / L2)
- [x] 5.9 Реализована и добавлена валидация (Сергей / L2)
- [x] 5.10 Сверстана /signup (Кирилл / L1)
- [x] 5.11 Сверстана /leaderboard (Кирилл / L1)
- [x] 5.12 Сверстана /game/start (Кирилл / L2)
- [x] 5.13 Сверстана /profile (Антон / L2)
- [x] 5.14 Создан док с механикой игры (Артур + Кирилл / L2)
- [x] 5.15 Сверстан экран /game/finish (Кирилл / L1)
- [x] 5.16 Настроена обработка ошибок ErrorBoundary (Кирилл / L1)
- [x] 5.17 Создана механика игры на Canvas API (Все / L3)

**Спринт 6 (текущий): игровое ядро, авторизация**
- [x] 6.1 Реализована одна из заявленных игровых механик (Кирилл / L3)
- [x] 6.2 Реализованы состояния «Начало» и «Завершение игры» (Артур / L3)
- [x] 6.3 Проработана визуальная часть игры (Анна + Кирилл / L2)
- [x] 6.4 Добавлены Service Workers (Анна / L2)
- [x] 6.5 Авторизация проверяется через отдельный Hook / HOC (Сергей + Кирилл, / L1)
- [x] 6.6 Добавлен минимум один Web API (Кирилл / L1)
- [x] 6.7 Добавлено Redux-хранилище (Антон / L2)
- [x] 6.8 Написаны тесты на игровой движок + UI (Сергей / L2)
- [x] 6.9 Получен командный зачёт (все). Ура!

**Спринт 7 следующий (SSR, лидерборд)**
- [x] [7.0 Улучшена визуальная часть игры (Артур / L0)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/109)
- [x] [7.1 Настроен Express для SSR (Кирилл / L3)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/114)
- [x] [7.2 Настроены Redux и Router в SSR (Артур / L4)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/120)
- [x] [7.3 Добавлена OAuth-авторизация в проект (Анна / L3)](https://github.com/kirillchistov/42-gamedev-teamwork/issues/60)
- [x] [7.4 Добавлен API для лидерборда (Сергей / L2)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/119)
- [x] [7.5 Добавлен Performance API (Антон / L2)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/121)
- [x] [7.6 Добавлен MEMORYLEAKS.md (Кирилл / L1)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/118)

**Спринт 8 (докер, форум, темизация)**
- [x] [8.1 Настроить Docker для Postgres (Кирилл / L2)](https://github.com/kirillchistov/42-gamedev-teamwork/issues/64)
- [x] [8.2 Реализовать API для форума (Кирилл / L5)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/126)
- [x] [8.3 Переключение тем (клиент) (Артур / L3)](https://github.com/kirillchistov/42-gamedev-teamwork/issues/66)
- [x] [8.4 Проверка авторизации на бекэнде (Сергей / L3)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/129)
- [x] [8.5 Эмодзи (клиент) (Артур / L2)](https://github.com/kirillchistov/42-gamedev-teamwork/issues/68)
- [x] [8.6 Эмодзи (бэкенд) (Сергей / L2)](https://github.com/kirillchistov/42-gamedev-teamwork/issues/69)
- [x] [8.7 Переключение темы (бэкенд) (Анна / L2)](https://github.com/kirillchistov/42-gamedev-teamwork/issues/70)
- [x] [8.8 Серверная инфраструктура форума (Анна / L5)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/134)
- [x] [8.9 Поддержать API форума на клиенте (Антон / L3)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/133)
- [x] [8.10 Демо для командного зачёта (все / L0)](https://github.com/kirillchistov/42-gamedev-teamwork/pull/131)

**Спринт 9 (безопасность)**
- [ ] 9.0 Улучшить визуальную часть игры (Кирилл / L0)
- [x] 9.1 Добавить CSP (Кирилл / L4) — [docs/csp.md](docs/csp.md)
- [ ] 9.2 Написать конфиг nginx: HTTP2, SSL (Сергей / L4) 
- [ ] 9.3 Добавить ещё одно WEB API (Антон / L2)
- [x] 9.4 Добавить защиту от XSS (Кирилл / L2) — [docs/xss.md](docs/xss.md)
- [ ] 9.5 Настроить Action для автодеплоя (Артур / L4)
- [ ] 9.6 Выложить сервис в Яндекс.Облако (Анна / L4)
- [ ] 9.7 Настроить A-запись на домене (Анна / L2)
- [ ] 9.8 Финальное демо (Все / L0)

## Команда
- Антон (spiritual mentor)
- Анна (chief of cosmic beauty)
- Сергей (head of eternal wisdom)
- Артур (master of stellar magic)
- Антон (universal treasure keeper)
- Кирилл (humble team lead)
