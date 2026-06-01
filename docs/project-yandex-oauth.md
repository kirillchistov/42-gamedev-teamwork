# Авторизация через Yandex OAuth

В проекте работают **два способа входа**:

1. **Логин и пароль** — API Практикума (`/auth/signin`, `/auth/signup`, `/auth/user`, `/auth/logout`): [`userSlice.ts`](../packages/client/src/slices/userSlice.ts), [`userApi.ts`](../packages/client/src/shared/api/userApi.ts).
2. **Яндекс OAuth** — спринт **7.3**: [`oauthApi.ts`](../packages/client/src/shared/api/oauthApi.ts), кнопка на [`LoginPage.tsx`](../packages/client/src/pages/LoginPage.tsx), колбэк [`YandexOAuthCallbackPage.tsx`](../packages/client/src/pages/YandexOAuthCallbackPage.tsx).

OpenAPI: [OAuth](https://ya-praktikum.tech/api/v2/openapi/oauth).

---

## 1. Поток

1. Пользователь нажимает **«Войти через Яндекс»** на `/login`.
2. Генерируется `state`, сохраняется в `sessionStorage` (`YANDEX_OAUTH_STATE_KEY`).
3. Редирект на `https://oauth.yandex.ru/authorize` с `client_id` (service_id), `redirect_uri`, `response_type=code`, `state`.
4. После успеха браузер возвращается на **`redirect_uri`** с `?code=…&state=…`.
5. [`YandexOAuthCallbackPage`](../packages/client/src/pages/YandexOAuthCallbackPage.tsx) обменивает `code` на сессию Практикума (cookie).
6. Дальше **`/auth/user`** с `credentials: 'include'` видит пользователя, как после обычного signin.

На корне **`/`** ([`LandingPage.tsx`](../packages/client/src/pages/LandingPage.tsx)): если в URL есть `code` и `state` совпадает с `sessionStorage` — редирект на `/oauth/yandex/callback`.

---

## 2. Redirect URI (критично)

Строка **`redirect_uri`** в запросах должна **точно** совпадать с записью в OAuth-настройках Практикума (порт, **без** лишнего `/` в конце).

Типичные локальные URI (whitelist ментора):

| URI | Когда использовать |
| --- | --- |
| `http://localhost:9000` | **`yarn dev:client`** — основной порт SSR (см. `CLIENT_PORT`) |
| `http://localhost:3000` | Если OAuth привязан к API-origin (редко для UI) |
| `http://localhost:5000` | Альтернатива из whitelist |

Переменные (`.env` / `.env.sample`):

- **`VITE_YANDEX_OAUTH_REDIRECT_URI`** — явный redirect (приоритет).
- Иначе **`buildYandexRedirectUri()`** в [`oauthApi.ts`](../packages/client/src/shared/api/oauthApi.ts) берёт `window.location.origin` + `BASE_URL` (без SSR-подстановки localhost в prod-бандл).

Другой порт — согласовать с ментором и добавить в кабинет OAuth.

**Production / облако:** redirect на домен ВМ или GitHub Pages — см. [`yacloud-deploy.md`](./yacloud-deploy.md).

---

## 3. Файлы

| Файл | Назначение |
| --- | --- |
| [`oauthApi.ts`](../packages/client/src/shared/api/oauthApi.ts) | `getYandexServiceId`, `buildYandexAuthorizeUrl`, `buildYandexRedirectUri`, обмен `code` |
| [`YandexOAuthCallbackPage.tsx`](../packages/client/src/pages/YandexOAuthCallbackPage.tsx) | Обработка `code`, ошибок, `navigate` после входа |
| [`routes.tsx`](../packages/client/src/routes.tsx) | Маршрут `/oauth/yandex/callback` |
| [`authLoginRedirect.ts`](../packages/client/src/shared/authLoginRedirect.ts) | Возврат на защищённый маршрут после логина (`markAuthLoginRedirect`) |

`service_id`: env **`VITE_YANDEX_OAUTH_SERVICE_ID`** или ответ API Практикума.

---

## 4. SSR и прокси

- В **браузере** OAuth и `/auth/*` идут на **`/api/v2`** через [`apiProxy.ts`](../packages/client/server/apiProxy.ts) (same-origin, cookie сохраняются).
- На **GitHub Pages** — Service Worker проксирует Практикум (см. корневой README).
- Сразу после OAuth первый HTML может не содержать профиль в `APP_INITIAL_STATE` — профиль подтягивается на клиенте через `fetchUserThunk` (нормально для колбэка).

---

## 5. Безопасность

- **`state`** — защита от CSRF; сверка на `/` и в колбэке.
- Не логировать `code` в production.
- Два входа (пароль + OAuth) **не конфликтуют** — общая cookie-сессия Практикума.

---

## 6. Чеклист

- [x] Кнопка «Войти через Яндекс» на `/login`.
- [x] Маршрут `/oauth/yandex/callback`.
- [x] `state` в `sessionStorage`.
- [x] Обработка ошибок OAuth на колбэке.
- [ ] Redirect URI production добавлен ментором (для демо на домене).
- [ ] Локальный smoke: `9000` → Яндекс → возврат → `/auth/user` OK.

---

## 7. Связанные документы

- HTTP и cookie: [`project-structure.md`](./project-structure.md), [`auth-flow.svg`](./auth-flow.svg).
- Деплой и A-запись: [`yacloud-deploy.md`](./yacloud-deploy.md).
