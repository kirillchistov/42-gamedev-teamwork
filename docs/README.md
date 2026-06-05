# Документация Cosmic Match

Раздел описывает архитектуру монорепозитория, игровой движок match-3, интеграции спринтов **5–9** и эксплуатацию (Docker, nginx, облако, безопасность).

## Быстрый старт

1. Установите **Node**, **Yarn**, при необходимости **Docker**.
2. Из корня: `yarn bootstrap`
3. Разработка:
   - `yarn dev` — клиент (SSR) + API-сервер;
   - `yarn dev:client` — только `packages/client`;
   - `yarn dev:server` — только `packages/server`.
4. Локально UI обычно на **http://localhost:9000** (SSR Express, см. `CLIENT_PORT` в `.env.sample`), API — **http://localhost:3000**.
5. Полезное: `yarn test`, `yarn lint`, `yarn build`, `yarn format`.

Демо: [GitHub Pages](https://kirillchistov.github.io/42-gamedev-teamwork). На Pages демо-авторизация (фикс логин и пароль), не подключены Node API и Yandex Oauth, демо-профиль/лидерборд/форум.

## Работа с Docker
Все команды запускать из корня репозитория

### Обновление локальных Docker-образов
Весь стек (пересборка + перезапуск):
```bash
docker compose build && docker compose up -d
```

Быстрая сборка при поднятии:
```bash
docker compose up --build -d
```

Только клиент (после git pull):
```bash
docker compose build client && docker compose up -d client
```

Только server:
```bash
docker compose build server && docker compose up -d server
```

Если нужны образы с GHCR (на проде = ВМ в облаке):
```bash
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d
```
---

## Архитектура и HTTP

| Документ | Содержание |
| --- | --- |
| [`project-structure.md`](./project-structure.md) | Монорепо, два бэкенда, прокси, middleware, порты, Redux |
| [`http-apis-overview.svg`](./http-apis-overview.svg) | Диаграмма: браузер → SSR → apiProxy → Практикум / Node API / Postgres |
| [`client-api-sources.svg`](./client-api-sources.svg) | `BASE_URL` vs `SERVER_HOST` на клиенте |
| [`auth-flow.svg`](./auth-flow.svg) | Авторизация (логин, cookie, guard) |
| [`forum-flow.svg`](./forum-flow.svg) | Форум: UI → forumApi → Postgres |
| [`project-redux-router-ssr.md`](./project-redux-router-ssr.md) | SSR + Redux Toolkit + React Router data router |
| [`project-express.md`](./project-express.md) | Express SSR-клиент, Vite, smoke-проверки |

---

## Спринты 7–9 (ключевые темы)

| Спринт | Документы |
| --- | --- |
| **7** SSR, OAuth, лидерборд, Performance | [`project-redux-router-ssr.md`](./project-redux-router-ssr.md), [`project-yandex-oauth.md`](./project-yandex-oauth.md), [`leaderboard-api.md`](./leaderboard-api.md), [`MEMORYLEAKS.md`](./MEMORYLEAKS.md), [`project-web-api.md`](./project-web-api.md), [`sprint-7-8-demo-script.md`](./sprint-7-8-demo-script.md) |
| **8** Docker, форум, темы | [`forum-api-spec.md`](./forum-api-spec.md), [`forum-api-client.md`](./forum-api-client.md), [`forum-server-infra.md`](./forum-server-infra.md), [`project-themization.md`](./project-themization.md), [`auth-middleware-backend.md`](./auth-middleware-backend.md) |
| **9** Безопасность, деплой | [`csp.md`](./csp.md), [`xss.md`](./xss.md), [`nginx-config.md`](./nginx-config.md), [`autodeploy-action.md`](./autodeploy-action.md), [`yacloud-deploy.md`](./yacloud-deploy.md), [`s9-plan.md`](./s9-plan.md) |

---

## Игра

| Документ | Содержание |
| --- | --- |
| [`game-play.md`](./game-play.md) | Сценарий и механики |
| [`game-engine.md`](./game-engine.md) | Движок и runtime |
| [`game-design.md`](./game-design.md) | Геймдизайн |
| [`game-visuals.md`](./game-visuals.md) | Canvas, VFX, темы поля |
| [`game-quests.md`](./game-quests.md) | Квесты |
| [`project-roadmap.md`](./project-roadmap.md) | Дорожная карта визуала |

---

## Архив

- [`archive/forum-server-infra-merge-branches.md`](./archive/forum-server-infra-merge-branches.md) — слияние веток 8.3/8.4 в forum-infra (исторически).

## Прочее

- [`project-monetization.md`](./project-monetization.md) — концепт монетизации (заготовки UI).
- [`conventions.md`](./conventions.md) — соглашения по коду.
- [Backlog / Kanban](https://github.com/users/kirillchistov/projects/5) — задачи команды.

Статус спринтов в корневом [`README.md`](../README.md) (раздел «План спринтов»).
