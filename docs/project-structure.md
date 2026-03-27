# CosMatch-3: Описание репозитория (Драфт на 23.03.2026)

## 1. Репозиторий
Монорепозиторий на основе шаблона Яндекс Практикум — SSR‑шаблон на Express + React + Redux Toolkit с лендингом, auth‑страницами (доступ после логина) и демо‑страницей игры.

### Точки входа
#### Сервер (backend + SSR): packages/server/src/index.ts
Поднимает Express‑приложение, проксирует API, отдаёт серверный рендер React через общий шаблон.
#### Клиентский SSR‑сервер: packages/client/server/index.(ts|js)
Запускается отдельно, в dev‑режиме работает через Vite middlewareMode, в prod — читает собранные dist/client и серверный бандл dist/server/entry-server.js, рендерит React и подмешивает в HTML helmet‑мета и initial state.

#### Клиентская точка входа:
- packages/client/src/entry-client.tsx — вход на клиенте, монтирует или гидрирует React‑приложение.

- packages/client/src/entry-server.tsx — вход на сервере, экспортирует render(req) для SSR (возвращает html, initialState, helmet, styleTags).

### Организация клиентского приложения
#### Маршруты и инициализация страниц:
- Конфиг маршрутов и тип PageInitArgs живут в packages/client/src/routes.ts.
- Каждая страница экспортирует:
-- React‑компонент (LandingPage, LoginPage, SignupPage, GamePage, ForumPage, LeaderboardPage, ProfilePage, FriendsPage, NotFound, Error500Page и т.д.),

-- функцию initXxxPage(args: PageInitArgs), которая возвращает Promise (часто Promise.all([...dispatch(thunk)])).

-- Хук usePage({ initPage }) вызывается в начале компонента страницы; он:

на сервере — дергает initPage до SSR, чтобы наполнить Redux store;

на клиенте — переиспользует уже гидрированный стейт или, при навигации, может триггерить ту же инициализацию.

#### Главный layout:
***  Header и Footer *** 
общие компоненты, подключаются на всех страницах.

- Для лендинга/демо страниц используется корневой контейнер .landing + темовые модификаторы (landing--light-flat, landing--light-3d, landing--dark-neon), которые переключаются через контекст LandingThemeContext и переключатель темы в Header.

*** Сборка страниц и shared‑UI ***
- Стили: packages/client/src/shared/styles/landing.pcss
- Описывает layout лендинга, hero, about/benefits, team, contact, auth‑карточки, extra‑секций, темизацию и адаптив.

*** UI‑компоненты: packages/client/src/shared/ui ***
Набор мелких компонентов, оборачивающих CSS‑классы:
- Button — обертка над .btn, варианты primary | outline | flat.
- LinkButton — такая же кнопка, но через react-router-dom/Link для внутренних переходов.
- Input, TextArea — обертки над стандартными полями, чтобы унифицировать внешний вид форм (auth/контакт/форум).
- Card — контейнер под .auth-card / .extra-card.
- FieldError — компактный вывод текста ошибки под полем формы.

*** Страницы: *** 

- LandingPage — лендинг с hero‑блоком, преимуществами, командой и контактной формой, собранный из секционных компонентов.
- LoginPage / SignupPage — auth‑страницы, используют Button, Input, FieldError, классическую сетку auth-form auth-form--grid и валидацию через утилиту authValidation.
- GamePage — отдельная страница с Canvas‑полем и панелью статуса; инициализируется своим хуком, но вписана в тот же layout (AuthPage/landing).
- Хук usePage и жизненный цикл страниц
- Тип PageInitArgs: содержит dispatch, state, иногда доп. сервисы (API‑клиент, router context);
- передаётся в initXxxPage, чтобы страница могла диспатчить асинхронные thunk’и до рендера.

usePage({ initPage }):
на сервере вызывается в ходе SSR (через роутер/entry‑server) и ждёт выполнения initPage;

на клиенте — при прямой загрузке страницы реинициализация не нужна (state уже есть в window.APP_INITIAL_STATE), при client‑side навигации можно повторно вызвать initPage (поведение зависит от реализации хука, но контракт уже соблюдён).

Этот паттерн позволяет каждой странице сама декларировать, какие данные ей нужны для первого рендера, и переиспользуется для всех роутов.

#### Работа с данными и Redux store
*** Настройка стора: ***
- Redux Toolkit: configureStore с наборами слайсов (userSlice, friendsSlice, и др.).
- Store создаётся на сервере для каждого запроса, заполняется данными через initPage, сериализуется и пробрасывается на клиент как window.APP_INITIAL_STATE; на клиенте configureStore поднимает тот же state.
- Слайсы и доступ к данным:
Пример:
userSlice — хранит данные текущего пользователя, экспортирует:
fetchUserThunk для загрузки /auth/user (или аналогичного эндпоинта), селектор selectUser.

friendsSlice — хранит список друзей, слайс для fetchFriendsThunk, selectFriends, selectIsLoadingFriends.

Страницы используют useSelector(selectXxx) и диспатчат thunk’и в initPage.

*** Пример шаблонной страницы (FriendsPage): ***
В компоненте:
читает friends, isLoading, user из стора;
рендерит список/состояние загрузки.
В initFriendsPage:
всегда диспатчит fetchFriendsThunk();
дополнительно дергает fetchUserThunk(), если selectUser(state) вернул null.

Та же схема потом переиспользуется для форума, лидерборда и демо‑профиля.

Такой подход развязывает UI, SSR и загрузку данных: страница описывает только свои зависимости через initPage, хук usePage следит за их вызовом, а store инициализируется одинаково и на сервере, и на клиенте.