# Защита от XSS (задача 9.4)

## Что и зачем

XSS (Cross-Site Scripting) — внедрение чужого HTML или JavaScript через пользовательский ввод. В нашем приложении основной риск — **форум** (темы, комментарии) и **локальный чат героев** на странице игры: текст сохраняется и показывается другим (форум) или снова отображается из `localStorage` (чат).

Защита строится в несколько слоёв: валидация на входе, безопасный вывод в React, заголовки безопасности и CSP (задача 9.1).

## Полезные источники

- [Межсайтовый скриптинг (Википедия)](https://ru.wikipedia.org/wiki/%D0%9C%D0%B5%D0%B6%D1%81%D0%B0%D0%B9%D1%82%D0%BE%D0%B2%D1%8B%D0%B9_%D1%81%D0%BA%D1%80%D0%B8%D0%BF%D1%82%D0%B8%D0%BD%D0%B3)
- [OWASP XSS Filter Evasion Cheat Sheet](https://owasp.org/www-community//xss-filter-evasion-cheatsheet)
- [Xakep: защита от XSS](https://habr.com/ru/company/xakep/blog/189210/)
- [CSP в проекте](csp.md)

## Где выводится пользовательский текст

| Место | Файлы | Хранение |
|-------|--------|----------|
| Заголовок и текст темы | `ForumPage.tsx`, `ForumTopicPage.tsx` | Postgres (`Topic`) |
| Комментарии | `ForumTopicPage.tsx` | Postgres (`Comment`) |
| Чат героев | `HeroChatPanel.tsx`, `GamePage.tsx` | `localStorage` (только у игрока) |
| Имя автора темы/комментария | из профиля Практикума | не из формы форума |

В клиенте **нет** `dangerouslySetInnerHTML` для пользовательского контента. Реакции на комментарии — только эмодзи из белого списка (`forumEmojiGuard.ts`).

## Слои защиты

### 1. Валидация plain text (сервер и клиент)

Общие правила в:

- `packages/server/utils/plainTextContent.ts` — обязательная проверка API форума
- `packages/client/src/shared/security/plainTextContent.ts` — те же правила до отправки формы

Что делаем с вводом:

- обрезаем пробелы, схлопываем пробелы в заголовке;
- удаляем управляющие символы (кроме перевода строки в тексте);
- **отклоняем** паттерны разметки: `<`, `>`, `javascript:`, `data:text/html`, обработчики вида `onerror=`;
- лимиты длины: заголовок ≤ 255, текст ≤ 100 000 (как в Sequelize-моделях).

API форума (`forumRouter.ts`) при `POST`/`PATCH` тем и комментариев возвращает `400` с полем `reason`, если проверка не прошла.

### 2. Безопасный вывод (React)

Компонент `ForumPlainText` рендерит строку как **дочерний текст** React (`{text}`), без разбора HTML. Для многострочного текста включён `white-space: pre-wrap` (класс `forum-plain-text--multiline` в `forum.pcss`).

Функция `escapeHtml` в клиентском модуле — для не-React контекстов (тесты, при необходимости SSR-вставок); в UI форума используется только React-эскейп.

### 3. React как фреймворк

По умолчанию React экранирует значения в JSX. Мы не рендерим пользовательский HTML и не используем `dangerouslySetInnerHTML` для форума и чата.

### 4. Заголовки HTTP (SSR)

В `packages/client/server/csp.ts` вместе с CSP задаются:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block` (устаревающий, но указан в курсе)
- `Referrer-Policy`, `Permissions-Policy`

Подробнее о CSP: [csp.md](csp.md).

### 5. Куки

Сессионные куки темы гостя на API: `httpOnly: true` (`packages/server/routes/uiTheme/guestSession.ts`). Токены OAuth/Практикума обрабатываются по их правилам на стороне провайдера.

### 6. Белый список для эмодзи-реакций

HTML в реакциях не разрешён: только символы из `FORUM_EMOJI_WHITELIST` (`forumEmojiGuard.ts`).

## Проверка вручную

1. `yarn dev`, войти в аккаунт, открыть `/forum`.
2. Создать тему с заголовком `test<script>alert(1)</script>` — должна быть ошибка на клиенте или `400` с API.
3. Комментарий с `<img src=x onerror=alert(1)>` — отклонение.
4. Обычный текст `Tom & Jerry` и эмодзи в комментарии — успех.
5. На `/game` в чате героев повторить пункт 2–4.
6. Network → документ SSR: есть заголовок `X-XSS-Protection`.

## Автотесты

```bash
yarn workspace server test plainTextContent
yarn workspace client test plainTextContent
```

## Что не входит в 9.4

- Санитизация rich HTML (у нас контент **только plain text**).
- XSS в сторонних скриптах OAuth (домены уже ограничены CSP).
- Полная защита на GitHub Pages без SSR-заголовков — там действует meta-CSP из сборки; форум на Pages отключён.

## Связь с другими задачами спринта 9

- **9.1 CSP** — ограничение исполнения чужих скриптов в браузере.
- **9.4 XSS** — не допускать опасный ввод и безопасно показывать текст.
- **9.2 nginx** — на проде пробросить те же заголовки с edge.
