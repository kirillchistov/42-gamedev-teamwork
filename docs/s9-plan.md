# Спринт 9 — план (безопасность и деплой)

Спринт закрывает тему безопасности и выкладки в прод. Задачи из [README](../README.md), уровни сложности — как в прошлых спринтах.

## Цель спринта

Сделать приложение безопаснее (CSP, XSS), подготовить прод-инфраструктуру (nginx, SSL, облако, DNS) и провести финальное демо.

## Задачи

| № | Задача | Кто | Уровень | Суть |
|---|--------|-----|---------|------|
| 9.0 | Улучшить визуал игры | Кирилл | L0 | Полировка Canvas/UI без смены механик |
| 9.1 | CSP | Кирилл | L4 | Политика контента: заголовки на SSR, мета на GH Pages |
| 9.2 | nginx HTTP/2 + SSL | Сергей | L4 | Конфиг reverse-proxy перед Node |
| 9.3 | Ещё одно Web API | Антон | L2 | **Page Visibility** — пауза match-3 при скрытой вкладке; см. [add-web-api.md](add-web-api.md) |
| 9.4 | Защита от XSS | Кирилл | L2 | Plain-text валидация, безопасный вывод; см. [xss.md](xss.md) |
| 9.5 | GitHub Action автодеплоя | Артур | L4 | [autodeploy-action.md](autodeploy-action.md) — GHCR + опционально SSH deploy |
| 9.6 | Деплой в Яндекс.Облако | Анна | L4 | [yacloud-deploy.md](yacloud-deploy.md) — ВМ, Compose, nginx |
| 9.7 | A-запись домена | Кирилл | L2 | [yacloud-deploy.md](yacloud-deploy.md) § A-запись, OAuth redirect |
| 9.8 | Финальное демо | Все | L0 | Полный сценарий: auth, игра, форум, прод |

## Рекомендуемый порядок

1. **9.1 CSP** — база для 9.4; проще отлаживать до nginx.
2. **9.2 nginx** — терминация TLS и прокси на client:9000 и server:3000.
3. **9.4 XSS** — форум, профиль, пользовательский текст.
4. **9.5–9.7** — пайплайн и облако (можно параллельно 9.5 и 9.6).
5. **9.0, 9.3** — по остатку времени.
6. **9.8** — когда стенд стабилен.

## Зависимости от спринта 8

- Docker: postgres, migrate, server, client (SSR).
- Форум и темы — Node API; на GitHub Pages только статика (см. [sprint-7-8-demo-script.md](sprint-7-8-demo-script.md)).
- OAuth Яндекс — только на SSR/Docker; на Pages скрыты кнопки OAuth.

## 9.1 CSP (текущий фокус)

Требования и реализация: [csp.md](csp.md).

Кратко:

- SSR (Express): заголовок `Content-Security-Policy` на каждый HTML-ответ; nonce для inline `APP_INITIAL_STATE`.
- GitHub Pages: мета-тег CSP в `index.html` при сборке `VITE_STATIC_DEPLOY=gh-pages` (без SSR и без nonce).
- Разрешённые внешние источники: API Практикума, OAuth Яндекс, картинки (https, data), в dev — Vite HMR (ws, unsafe-eval).

## 9.4 XSS

Требования и реализация: [xss.md](xss.md).

Кратко:

- Валидация тем/комментариев на Node API и на клиенте перед отправкой.
- Вывод через `ForumPlainText` (React text nodes), без HTML.
- Заголовок `X-XSS-Protection` на SSR вместе с CSP ([csp.md](csp.md)).
- Реакции форума — белый список эмодзи (спринт 8).

## 9.2 nginx

См. [nginx-config.md](nginx-config.md) (HTTP/2, SSL, прокси).

## 9.8 — чеклист демо

- [ ] Вход (логин/пароль), OAuth на полном стеке
- [ ] Игра, лидерборд
- [ ] Форум: тема, комментарий, реакции
- [ ] Тема light/dark (сервер + клиент)
- [ ] CSP без ошибок в консоли на главных страницах
- [ ] XSS: отклонение `<script>` в теме/комментарии, обычный текст проходит
- [ ] Прод-URL или Docker compose up

## Ссылки

- [csp.md](csp.md) — политика 9.1
- [nginx-config.md](nginx-config.md) — 9.2
- [add-web-api.md](add-web-api.md), [project-web-api.md](project-web-api.md) — 9.3
- [xss.md](xss.md) — защита 9.4
- [autodeploy-action.md](autodeploy-action.md) — 9.5
- [yacloud-deploy.md](yacloud-deploy.md) — 9.6, 9.7 (облако, DNS, OAuth на прод)
- [forum-server-infra.md](forum-server-infra.md) — Docker и API
- [project-yandex-oauth.md](project-yandex-oauth.md) — OAuth (спринт 7)
- [auth-middleware-backend.md](auth-middleware-backend.md) — авторизация на бэкенде
