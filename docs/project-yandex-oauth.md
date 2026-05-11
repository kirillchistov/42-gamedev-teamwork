# Авторизация через Yandex OAuth (план интеграции)

В репозитории сейчас реализованы **логин/регистрация по логину и паролю** через API ЯП ('/auth/signin', '/auth/signup', '/auth/user', '/auth/logout') — см. 'packages/client/src/slices/userSlice.ts' и 'packages/client/src/shared/api/userApi.ts`. OAuth Яндекса **ещё не подключён**; ниже — как добавить его, не ломая структуру.

Официальное описание OAuth API ЯП: [OpenAPI — OAuth](https://ya-praktikum.tech/api/v2/openapi/oauth).

---

## 0. Постановка задачи (как в проекте)

Добавить в проект авторизацию через Yandex OAuth.

Ожидаемое поведение:

1. Пользователь нажимает "Войти через Яндекс".
2. Происходит редирект на OAuth-страницу.
3. После успешной авторизации пользователь возвращается на страницу проекта по `redirect_uri`.

Критически важное условие:

- Чтобы редирект заработал, ваш `redirect_uri` должен быть добавлен в OAuth-настройки на стороне Практикума.
- Если URI еще не добавлен, отправьте руководителю ссылку с просьбой добавить ее.

Поддерживаемые локальные `redirect_uri` для теста:

- `http://localhost:3000` (**без** завершающего `/`, это важно)
- `http://localhost:5000`
- `http://localhost:9000`

Если нужен другой локальный порт:

- согласовать конкретный `redirect_uri` с руководителем и попросить добавить его в OAuth.

---

## 1. Что согласовать с ментором
- **Redirect URI** приложения OAuth на стороне Практикума должен **точно** совпадать с тем, что вы передаёте в запросах (включая порт и наличие/отсутствие завершающего '/').
- Для локальной разработки в типичном сценарии: **'http://localhost:3000'** (без слеша в конце), либо порты **5000**, **9000**, если так настроен клиент.
- Если у вас другой порт (например, из 'CLIENT_PORT' / 'PORT'), **напишите ментору** точную строку 'redirect_uri' для добавления в настройки OAuth.

## 2. Поток на высоком уровне

1. Пользователь нажимает «Войти через Яндекс» на '/login' (или отдельной кнопке).
2. Браузер перенаправляется на URL авторизации Яндекса / Praktikum (в зависимости от того, как описано в OpenAPI: часто это редирект на страницу OAuth с 'client_id', 'redirect_uri', 'response_type=code').
3. После успеха пользователь возвращается на **'redirect_uri'** с параметром **'code'** (и иногда 'state').
4. Фронт или небольшой backend обменивает **'code'** на сессию Практикума (cookie), согласно документации OAuth v2 в OpenAPI.
5. Дальше существующие вызовы **'/auth/user'** с 'credentials: 'include'' начинают видеть залогиненного пользователя так же, как после обычного signin.

Точные пути и поля тел запросов возьмите из актуального OpenAPI по ссылке выше (эндпоинты могут обновляться).

### 2.1 Минимальный рабочий сценарий для сдачи

1. В UI есть видимая кнопка "Войти через Яндекс".
2. При нажатии формируется OAuth-запрос с корректным 'redirect_uri'.
3. Колбэк-страница обрабатывает 'code' (и 'state', если используется).
4. Выполняется обмен 'code' на сессию по OpenAPI.
5. После успеха вызывается текущий поток профиля ('/auth/user') и пользователь считается авторизованным.
6. После ошибки показывается понятное сообщение и возможность повторить вход.

## 3. Куда встраивать в текущем клиенте

| Шаг | Файл / место |
|-----|----------------|
| Кнопка и редирект на OAuth | 'packages/client/src/pages/LoginPage.tsx' (и при желании 'SignupPage.tsx') |
| Обработка возврата с 'code' | Отдельный маршрут, например '/oauth/yandex/callback', в 'packages/client/src/routes.tsx' + страница-компонент, которая читает 'URLSearchParams', дергает API и делает 'navigate' |
| Общий базовый URL API | 'packages/client/src/constants.tsx' — 'BASE_URL = 'https://ya-praktikum.tech/api/v2'' |
| Запросы с cookie | как в 'userSlice': 'credentials: 'include'' к домену API, если сессия выставляется cookie с того же API-домена |

## 4. Врезка: маршрут колбэка (скелет)

Добавьте в конфигурацию роутов (рядом с остальными объектами в 'routes'):

```tsx
{
  path: '/oauth/yandex/callback',
  Component: YandexOAuthCallbackPage,
  fetchData: initYandexOAuthCallbackPage,
}
```

Пример страницы (новый файл, например 'packages/client/src/pages/YandexOAuthCallbackPage.tsx'):

```tsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BASE_URL } from '../constants'

export const YandexOAuthCallbackPage: React.FC = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = params.get('code')
    if (!code) {
      setError('Нет кода авторизации')
      return
    }
    // TODO: заменить URL и тело на актуальные из OpenAPI OAuth
    void fetch(`${BASE_URL}/oauth/yandex`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async res => {
        if (!res.ok) throw new Error(await res.text())
        navigate('/', { replace: true })
      })
      .catch(e => setError(String(e)))
  }, [navigate, params])

  if (error) return <p>{error}</p>
  return <p>Вход…</p>
}

export const initYandexOAuthCallbackPage = () =>
  Promise.resolve()
```

Важно: путь **'/oauth/yandex'** и формат JSON — **заглушка**; подставьте реальные значения из OpenAPI и требования CORS/cookie.

## 5. SSR и OAuth

После появления cookie сессии серверный 'fetchData' сможет подтягивать пользователя теми же thunk’ами, что и на клиенте, если запросы к API с сервера передают cookie (для этого может понадобиться **прокси** или серверный fetch с заголовком 'Cookie' из 'req' — отдельное архитектурное решение). Пока в проекте 'fetch' из thunk’ов идёт из браузера с 'credentials: 'include'', SSR для «только что залогиненных» данных ограничен — это нормально для первого этапа.

## 6. Чеклист перед сдачей

- [ ] Redirect URI отправлен ментору и добавлен в кабинете OAuth.
- [ ] Для локального запуска используется один из согласованных URI ('3000', '5000', '9000') без лишнего '/' в конце.
- [ ] Локально проверен полный цикл: кнопка → Яндекс → возврат → '/auth/user' отдаёт профиль.
- [ ] Обработаны ошибки (отказ, неверный 'code', истёкший state).
- [ ] Не сломан существующий логин/пароль (две опции входа могут сосуществовать).

---

## 7. Рекомендации по безопасности и качеству

- Использовать 'state' для защиты от CSRF в OAuth-цикле.
- Не логировать в консоль 'code' и другие чувствительные параметры в production.
- Делать четкий timeout/retry для колбэк-запроса.
- Добавить smoke-test сценарий вручную:
  - "новый пользователь",
  - "повторный вход",
  - "отказ в Яндексе",
  - "некорректный 'redirect_uri'".
