# API лидерборда Практикума

Документация API: [OpenAPI — Leaderboard](https://ya-praktikum.tech/api/v2/openapi/leaderboard).

В проекте страница **`/leaderboard`** ([`LeaderboardPage.tsx`](../packages/client/src/pages/LeaderboardPage.tsx)) загружает таблицу через **`leaderboardSlice`** и **`leaderboardApi`**. После партии результат отправляется из [`GamePage.tsx`](../packages/client/src/pages/GamePage.tsx). Фильтр **«Друзья»** использует **`friendsSlice`** (наш API).

Спринт **7.4** — реализовано.

---

## 1. Уникальное поле рейтинга

В запросах к API используется **`ratingFieldName: 'CM42_score'`** ([`leaderboardApi.ts`](../packages/client/src/shared/api/leaderboardApi.ts)).

В теле записи (`data`) — поля команды, см. [`LeaderboardEntry`](../packages/client/src/shared/api/leaderboardConfig.ts):

| Поле | Назначение |
| --- | --- |
| `nickname` | Отображаемое имя |
| `CM42_score` | Текущий рейтинг (сортировка API) |
| `bestScore` | Рекорд одной игры |
| `bestScoreDate` | Дата рекорда (ISO `YYYY-MM-DD`) |

Константа `TEAM_NAME = 'cosmicMatch42_bestScore'` в конфиге — внутреннее имя команды; в API согласовано с ментором поле **`CM42_score`**.

---

## 2. Контракт API

### POST `/leaderboard` — отправить результат

```json
{
  "data": { "nickname": "...", "CM42_score": 1200, "bestScore": 5000, "bestScoreDate": "2026-05-19" },
  "ratingFieldName": "CM42_score"
}
```

### POST `/leaderboard/all` — таблица

```json
{
  "ratingFieldName": "CM42_score",
  "cursor": 0,
  "limit": 10
}
```

Запросы с **`credentials: 'include'`** (сессия Практикума). В браузере база — **`BASE_URL`** (`/api/v2` через прокси SSR), см. [`constants.tsx`](../packages/client/src/constants.tsx).

---

## 3. Файлы в репозитории

| Файл | Роль |
| --- | --- |
| [`leaderboardApi.ts`](../packages/client/src/shared/api/leaderboardApi.ts) | `fetchLeaderboardPage`, `submitLeaderboardScore` |
| [`leaderboardMapper.ts`](../packages/client/src/shared/api/leaderboardMapper.ts) | Маппинг строк API → `LeaderboardEntry` |
| [`leaderboardSlice.ts`](../packages/client/src/slices/leaderboardSlice.ts) | Redux: загрузка, ошибки |
| [`leaderboardDate.ts`](../packages/client/src/shared/api/leaderboardDate.ts) | Сравнение дат рекорда |
| [`LeaderboardPage.tsx`](../packages/client/src/pages/LeaderboardPage.tsx) | UI, сортировка, фильтр друзей |
| [`routes.tsx`](../packages/client/src/routes.tsx) | `fetchData: initLeaderboardPage` |

---

## 4. SSR

[`initLeaderboardPage`](../packages/client/src/pages/LeaderboardPage.tsx) в `fetchData`:

- `fetchLeaderboardThunk({ cursor: 0, limit: … })`
- `fetchFriendsThunk()` — для кнопки «Друзья»

Данные попадают в `window.APP_INITIAL_STATE` при первом заходе на `/leaderboard`. См. [`project-redux-router-ssr.md`](./project-redux-router-ssr.md).

---

## 5. Фильтр «Друзья»

1. `GET ${SERVER_HOST}/friends` (same-origin `/friends` через прокси).
2. `friend.name` сопоставляется с `entry.nickname`.
3. Фильтр **клиентский** — в API уходит полная выборка `limit`.
4. На **GitHub Pages** без Node-прокси `/friends` недоступен — фильтр только на полном стеке (`yarn dev`, Docker).

---

## 6. Сортировка в UI

Заголовки таблицы — кнопки. Ключи: `rank`, `nickname`, `CM42_score`, `bestScore`, `bestScoreDate`. Повторный клик переключает `asc` / `desc`. Колонка **#** пересчитывается после сортировки.

---

## 7. Чеклист

- [x] Уникальное `ratingFieldName` — `CM42_score`.
- [x] POST `/leaderboard` и `/leaderboard/all`.
- [x] Страница читает данные из Redux.
- [x] После игры — отправка результата (`GamePage`).
- [x] `initLeaderboardPage` вызывает `fetchFriendsThunk`.
- [x] Фильтр «Друзья» в UI.
- [x] Сортировка по колонкам.
