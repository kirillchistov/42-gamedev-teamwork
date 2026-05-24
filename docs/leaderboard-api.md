# API лидерборда Практикума — подключение к проекту

Документация: [OpenAPI — Leaderboard](https://ya-praktikum.tech/api/v2/openapi/leaderboard) (и Swagger [Leaderboard](https://ya-praktikum.tech/api/v2/swagger/#/Leaderboard)).

В **'packages/client'** страница '/leaderboard' ('LeaderboardPage.tsx') загружает таблицу через **'leaderboardSlice'** и API Практикума. Ниже — контракт API, врезки в код и **фильтр «только друзья»** через **'friendsSlice'**.

## 1. Контракт API (кратко)

### 1.1. Отправить результат игры

**POST** '/leaderboard' (полный URL: 'https://ya-praktikum.tech/api/v2/leaderboard' при использовании того же 'BASE_URL', что в проекте).

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

- **'data'** — произвольный объект с полями игры (ник, счёт, уровень и т.д.).
- **'ratingFieldName'** — имя поля внутри 'data', по которому сравнивается результат. Меньшее значение не перезаписывает запись; **большее** — обновляет.

### 1.2. Получить таблицу лидеров

**POST** '/leaderboard/all'

```json
{
  "ratingFieldName": "otherField",
  "cursor": 0,
  "limit": 10
}
```

- **'ratingFieldName'** — то же поле сортировки, что и при отправке.
- **'cursor'** / **'limit'** — пагинация.

### 1.3. Уникальное имя поля рейтинга

API общий для всех команд: задайте **'ratingFieldName'** и поля внутри **'data'** так, чтобы они **уникально** отличали вашу игру (например, префикс команды в имени поля: 'cosmicMatch42_bestScore' как ключ и такое же значение 'ratingFieldName' — уточните у ментора соглашение по именованию).

---

## 2. Базовый URL в проекте

```12:14:packages/client/src/constants.tsx
export const BASE_URL =
  'https://ya-praktikum.tech/api/v2'
export const API_RESOURCES_URL = '${BASE_URL}/resources'
```

Запросы с cookie-сессией, как у авторизации: **'credentials: 'include''** (если API принимает сессию так же, как '/auth/*').

---

## 3. Рекомендуемая структура кода (врезки)

### 3.1. Константа уникального рейтинга

Новый файл, например 'packages/client/src/shared/api/leaderboardConfig.ts':

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

'packages/client/src/shared/api/leaderboardApi.ts':

```ts
import { BASE_URL } from '../../constants'
import type { LeaderboardTeamData } from './leaderboardConfig'
import { LEADERBOARD_RATING_FIELD } from './leaderboardConfig'

export async function submitLeaderboardScore(
  data: LeaderboardTeamData
) {
  const res = await fetch(
    '${BASE_URL}/leaderboard',
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
    '${BASE_URL}/leaderboard/all',
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

Тип ответа уточните по OpenAPI (имена полей 'leaders' / 'data' могут отличаться).

### 3.3. Redux (по аналогии с 'friendsSlice')

1. Добавьте 'leaderboardSlice.ts' со статусами 'loading / error / rows / cursor'.
2. Thunk **'fetchLeaderboardThunk'** вызывает 'fetchLeaderboardPage'.
3. Thunk **'submitScoreThunk'** вызывает 'submitLeaderboardScore' в конце партии.

Подключите редьюсер в 'packages/client/src/store.ts' в 'combineReducers'.

### 3.4. Задача 4.1 — «начать использовать API»

- Вызов **'fetchLeaderboardThunk'** и **'fetchFriendsThunk'** из **'initLeaderboardPage'** — см. раздел 4.2 и актуальный код в 'LeaderboardPage.tsx'.

### 3.5. Задача 4.2 — подключить к компонентам

- **'LeaderboardPage.tsx'**: данные из 'leaderboardData' (селектор slice); клиентская сортировка по колонкам (# / игрок / рейтинг / рекорд / дата).
- **'GamePage.tsx'**: после партии — **'submitLeaderboardScore'** (см. 'LAST_RESULT_KEY' и переход на '/leaderboard').

---

## 4. Фильтр «только друзья» ('friendsSlice')

На странице уже есть кнопка **«Друзья»** и логика фильтрации; чтобы список друзей подгружался при открытии '/leaderboard', нужны шаги ниже.

### 4.1. Redux: 'friendsSlice'

Файл: 'packages/client/src/slices/friendsSlice.ts'

| Элемент | Назначение |
|--------|------------|
| 'fetchFriendsThunk' | 'GET ${SERVER_HOST}/friends' (прокси на Node или SSR) |
| 'selectFriends' | 'Friend[]' — '{ name, secondName, avatar }' |
| 'selectIsLoadingFriends' | индикатор загрузки |

Редьюсер подключён в 'store.ts' ('friends').

### 4.2. Загрузка при входе на страницу (SSR + клиент)

В **'initLeaderboardPage'** добавьте thunk друзей **рядом** с лидербордом:

```ts
export const initLeaderboardPage = ({
  dispatch,
  state,
}: PageInitArgs) => {
  const queue: Array<Promise<unknown>> = [
    dispatch(
      fetchLeaderboardThunk({ cursor: 0, limit: 10 })
    ),
    dispatch(fetchFriendsThunk()).catch(() => undefined),
  ]
  // при необходимости — fetchUserThunk, если user ещё не в state
  return Promise.all(queue)
}
```

Маршрут '/leaderboard' в 'routes.tsx' уже вызывает 'initLeaderboardPage' как 'fetchData' — после этого друзья будут в store и на SSR, и после гидрации.

### 4.3. UI на 'LeaderboardPage.tsx'

1. **Селекторы**

```ts
const friends = useSelector(selectFriends)
const isLoading = useSelector(selectIsLoadingFriends)
```

2. **Множество ников для фильтра**

```ts
const friendNicknames = useMemo(
  () => new Set(friends.map(f => f.name)),
  [friends]
)
```

Сопоставление: 'friend.name' ↔ 'entry.nickname' в 'LeaderboardEntry'. Если на бэкенде ник хранится иначе (логин / 'displayName'), измените маппер в 'leaderboardMapper.ts' или сравнение здесь.

3. **Локальный флаг**

```ts
const [showFriendsOnly, setShowFriendsOnly] = useState(false)
```

4. **Фильтр перед сортировкой** (в 'useMemo' для 'sortedEntries'):

```ts
let list = leaderboardTable
if (showFriendsOnly && friendNicknames.size > 0) {
  list = list.filter(entry =>
    friendNicknames.has(entry.nickname)
  )
}
// далее copy.sort(...) по выбранной колонке
```

5. **Кнопка в тулбаре**

```tsx
<Button
  variant={showFriendsOnly ? 'primary' : 'outline'}
  onClick={() => setShowFriendsOnly(v => !v)}
>
  Друзья
</Button>
```

Пока 'isLoading' — подпись «Загрузка списка друзей…». Если фильтр включён, а друзей нет — пустая таблица с текстом «Нет записей среди ваших друзей».

### 4.4. Проверка

1. Войти под пользователем с друзьями ('/friends' показывает список).
2. Открыть '/leaderboard' — без перезагрузки друзей кнопка «Друзья» должна отфильтровать строки.
3. В DevTools → Network: запрос 'GET …/friends' при первом заходе на лидерборд.
4. Отключить фильтр — снова полная таблица API.

### 4.5. Ограничения

- Фильтр **клиентский**: в API уходит полная выборка 'limit'; для больших таблиц понадобится серверная фильтрация или отдельный endpoint.
- Друзья без записи в лидерборде в таблице не появятся (это ожидаемо).
- На GitHub Pages без Node-прокси 'GET /friends' может быть недоступен — фильтр работает только на полном стеке (Docker / 'yarn dev').

---

## 5. Сортировка колонок (клиент)

В таблице и в режиме «Плитка» заголовки — кнопки сортировки:

| Колонка | Ключ 'SortKey' | Поведение по умолчанию при первом клике |
|--------|----------------|------------------------------------------|
| # | 'rank' | по убыванию рейтинга ('CM42_score', затем рекорд) |
| Игрок | 'nickname' | А→Я |
| Рейтинг | 'CM42_score' | по убыванию |
| Рекорд | 'bestScore' | по убыванию |
| Дата рекорда | 'bestScoreDate' | новые даты выше ('compareLeaderboardRecordDates' в 'leaderboardDate.ts') |

Повторный клик по той же колонке переключает 'asc' / 'desc'. Номер в колонке **#** пересчитывается после сортировки (1…N).

---

## 6. SSR

Если лидерборд должен быть в HTML первого запроса, **'initLeaderboardPage'** в 'routes.tsx' уже указан как **'fetchData'** для пути '/leaderboard' — достаточно, чтобы thunk использовал на сервере те же cookie, что пришли в 'req' (при необходимости — серверный fetch с пробросом 'Cookie'; иначе данные подтянутся на клиенте при первом монтировании).

---

## 7. Чеклист

- [ ] Согласовано уникальное имя 'ratingFieldName' с ментором.
- [ ] Реализованы POST '/leaderboard' и '/leaderboard/all'.
- [ ] Страница лидерборда читает данные из Redux.
- [ ] После игры уходит запись результата; отображаются ошибки сети/401.
- [ ] В 'initLeaderboardPage' вызывается 'fetchFriendsThunk'.
- [ ] Фильтр «Друзья» сопоставляет 'friends[].name' и 'entry.nickname'.
- [ ] Сортировка по всем колонкам таблицы работает в UI.
