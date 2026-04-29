# API лидерборда Практикума — подключение к проекту

Документация: [OpenAPI — Leaderboard](https://ya-praktikum.tech/api/v2/openapi/leaderboard) (и Swagger [Leaderboard](https://ya-praktikum.tech/api/v2/swagger/#/Leaderboard)).

В **`packages/client`** страница `/leaderboard` уже есть (`LeaderboardPage.tsx`), но данные сейчас **демо-массив** `DEMO_LEADERBOARD`, а `initLeaderboardPage` — заглушка `Promise.resolve()`. Ниже — как заменить это на реальное API, не ломая Redux/SSR-паттерн.

## 1. Контракт API (кратко)

### 1.1. Отправить результат игры

**POST** `/leaderboard` (полный URL: `https://ya-praktikum.tech/api/v2/leaderboard` при использовании того же `BASE_URL`, что в проекте).

Тело (логика из задания):

```json
{
  "data": {
    "myField": "lol",
    "otherField": 23
  },
  "ratingFieldName": "otherField"
}
```

- **`data`** — произвольный объект с полями игры (ник, счёт, уровень и т.д.).
- **`ratingFieldName`** — имя поля внутри `data`, по которому сравнивается результат. Меньшее значение не перезаписывает запись; **большее** — обновляет.

### 1.2. Получить таблицу лидеров

**POST** `/leaderboard/all`

```json
{
  "ratingFieldName": "otherField",
  "cursor": 0,
  "limit": 10
}
```

- **`ratingFieldName`** — то же поле сортировки, что и при отправке.
- **`cursor`** / **`limit`** — пагинация.

### 1.3. Уникальное имя поля рейтинга

API общий для всех команд: задайте **`ratingFieldName`** и поля внутри **`data`** так, чтобы они **уникально** отличали вашу игру (например, префикс команды в имени поля: `cosmicMatch42_bestScore` как ключ и такое же значение `ratingFieldName` — уточните у ментора соглашение по именованию).

---

## 2. Базовый URL в проекте

```12:14:packages/client/src/constants.tsx
export const BASE_URL =
  'https://ya-praktikum.tech/api/v2'
export const API_RESOURCES_URL = `${BASE_URL}/resources`
```

Запросы с cookie-сессией, как у авторизации: **`credentials: 'include'`** (если API принимает сессию так же, как `/auth/*`).

---

## 3. Рекомендуемая структура кода (врезки)

### 3.1. Константа уникального рейтинга

Новый файл, например `packages/client/src/shared/api/leaderboardConfig.ts`:

```ts
/** Уникально для команды / игры — не делить таблицу с другими проектами */
export const LEADERBOARD_RATING_FIELD =
  'cosmicMatch42_bestScore' as const

export type LeaderboardTeamData = {
  login: string
  displayName: string
  [LEADERBOARD_RATING_FIELD]: number
}
```

### 3.2. Тонкий API-слой

`packages/client/src/shared/api/leaderboardApi.ts`:

```ts
import { BASE_URL } from '../../constants'
import type { LeaderboardTeamData } from './leaderboardConfig'
import { LEADERBOARD_RATING_FIELD } from './leaderboardConfig'

export async function submitLeaderboardScore(
  data: LeaderboardTeamData
) {
  const res = await fetch(
    `${BASE_URL}/leaderboard`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        ratingFieldName: LEADERBOARD_RATING_FIELD,
      }),
    }
  )
  if (!res.ok) {
    throw new Error(
      await res.text().catch(() => res.statusText)
    )
  }
}

export type LeaderboardRow = Record<string, unknown>

export async function fetchLeaderboardPage(params: {
  cursor: number
  limit: number
}) {
  const res = await fetch(
    `${BASE_URL}/leaderboard/all`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ratingFieldName: LEADERBOARD_RATING_FIELD,
        cursor: params.cursor,
        limit: params.limit,
      }),
    }
  )
  if (!res.ok) {
    throw new Error(
      await res.text().catch(() => res.statusText)
    )
  }
  return res.json() as Promise<{
    leaders: LeaderboardRow[]
    cursor?: number
  }>
}
```

Тип ответа уточните по OpenAPI (имена полей `leaders` / `data` могут отличаться).

### 3.3. Redux (по аналогии с `friendsSlice`)

1. Добавьте `leaderboardSlice.ts` со статусами `loading / error / rows / cursor`.
2. Thunk **`fetchLeaderboardThunk`** вызывает `fetchLeaderboardPage`.
3. Thunk **`submitScoreThunk`** вызывает `submitLeaderboardScore` в конце партии.

Подключите редьюсер в `packages/client/src/store.ts` в `combineReducers`.

### 3.4. Задача 4.1 — «начать использовать API»

- Вызов **`fetchLeaderboardThunk`** из **`initLeaderboardPage`** (сервер + клиент через тот же `usePage`), раскомментировав и расширив паттерн, который уже был закомментирован для друзей:

```433:442:packages/client/src/pages/LeaderboardPage.tsx
// export const initLeaderboardPage = ({ dispatch, state }: PageInitArgs) => {
//   const queue: Array<Promise<unknown>> = [dispatch(fetchFriendsThunk())]
//   if (!selectUser(state)) {
//     queue.push(dispatch(fetchUserThunk()))
//   }
//   return Promise.all(queue)
// }

export const initLeaderboardPage = () =>
  Promise.resolve()
```

Целевая версия `initLeaderboardPage` должна возвращать `Promise.all([dispatch(fetchLeaderboardThunk(...)), ...])` по необходимости.

### 3.5. Задача 4.2 — подключить к компонентам

- **`LeaderboardPage.tsx`**: заменить `sortedEntries` на данные из селектора; сохранить UI сортировки/сетки, либо сортировать на сервере, если API отдаёт уже отсортированный список.
- **`GamePage.tsx`**: в обработчике окончания игры (там, где сейчас пишется результат в `localStorage` и `navigate('/leaderboard')`) после подсчёта финального счёта вызвать **`submitLeaderboardScore`** (или `dispatch(submitScoreThunk(...))`), не блокируя навигацию (можно `void` + toast при ошибке).

Ищите по файлу ключ **`LAST_RESULT_KEY`** и логику перехода на `/leaderboard` — это естественная точка для отправки рекорда.

---

## 4. SSR

Если лидерборд должен быть в HTML первого запроса, **`initLeaderboardPage`** в `routes.tsx` уже указан как **`fetchData`** для пути `/leaderboard` — достаточно, чтобы thunk использовал на сервере те же cookie, что пришли в `req` (при необходимости — серверный fetch с пробросом `Cookie`; иначе данные подтянутся на клиенте при первом монтировании).

---

## 5. Чеклист

- [ ] Согласовано уникальное имя `ratingFieldName` с ментором.
- [ ] Реализованы POST `/leaderboard` и `/leaderboard/all`.
- [ ] Страница лидерборда читает данные из Redux (или из RTK Query, если выберете его).
- [ ] После игры уходит запись результата; отображаются ошибки сети/401.
