# Как работает Cosmic Match (Final Demo Talk)

---

## 1. Архитектура проекта

Монорепозиторий на Yarn Workspaces с двумя пакетами:

- **`packages/client`** — React + TypeScript, Vite, SSR через собственный Express (`packages/client/server/`).
- **`packages/server`** — Express API (форум, профили, друзья), PostgreSQL, Sequelize миграции.

```
Internet
    │
    └─► nginx :443 (SSL/TLS, HTTP/2)
            │
            ├─► client :80  (SSR, React)
            │       └── apiProxy /api/v2   → ya-praktikum.tech
            │       └── apiProxy /api/forum, /friends, /user → server :3000
            │
            └─► server :3000  (REST API форума)
                    └── postgres :5432 (Docker volume pgdata)
```

В интернет открыты только **22** (SSH), **80** (redirect), **443** (HTTPS). Порты **3000**, **9000**, **5432** недоступны снаружи.

---

## 2. Стек и ключевые решения

| Слой | Технология | Почему |
|------|-----------|--------|
| UI | React 18, TypeScript | Типобезопасность, хуки, concurrent features |
| Стейт | Redux Toolkit | Slice-архитектура, RTK Query для API |
| Сборка | Vite | Быстрый HMR, ESM-нативный |
| SSR | Express + Vite SSR | SEO, первый FCP без FOUC |
| Стили | CSS Modules + PostCSS | Изоляция, переменные |
| Canvas | HTML5 Canvas API | Игровой рендеринг без внешних движков |
| БД | PostgreSQL + Sequelize | Реляционная модель форума/профилей |
| Контейнеры | Docker Compose | Паритет dev/prod окружений |
| CI/CD | GitHub Actions | Lint → Build → Deploy |
| Хостинг | Яндекс.Облако (ВМ) | Container Solution, статический IP |

---

## 3. Игра: Canvas и игровая логика

### Как устроен рендеринг

Весь игровой экран — один `<canvas>`-элемент. На каждый кадр вызывается `requestAnimationFrame`:

```
GameLoop
  ├── update(delta)   — физика, матч-3 логика, анимации
  └── render(ctx)     — очистка canvas + перерисовка всех слоёв
```

Слои рендера (снизу вверх):
1. Фон (сгенерированный или из спрайт-атласа)
2. Сетка клеток
3. Фишки (sprites из спрайт-атласа)
4. Бустеры, эффекты взрывов
5. HUD: счёт, ходы, цели

### Матч-3 механика

- **5 цветов** фишек: синий, зелёный, жёлтый, красный, розовый.
- Перемещение: **drag-and-drop** (touch + mouse) — фишка захватывается, перетаскивается с анимацией, затем матч-проверка.
- Клик-клик: первый клик выбирает фишку, второй — целевую клетку. Стрелка-траектория **убрана** (было в v8, реверт в v9 по требованиям).
- Матч засчитывается при 3+ совпадениях по горизонтали или вертикали.
- **Ходы**: 1 ход = 1 успешное действие (матч). Действия без матча ходом не считаются.
- **Размер фишки**: 80–90% клетки.

### Бустеры

| Бустер | Действие |
|--------|----------|
| Ракета | Уничтожает вертикальный ряд (выбранный игроком) |
| Лазерный луч | Уничтожает горизонтальный ряд |
| Метеорит | Уничтожает область 4×4 (1 ед. урона) — комбо ракеты + луча |

### Цели уровня

Цели отображаются как **N/Total** (например `0/1900`), без процентов. Максимум 4 цели на уровень. Автоподсчёт реализован в `GameEditor`.

Типы целей:

| Тип | Занимает ячеек |
|-----|---------------|
| Все фишки | 1 |
| Фишка определённого цвета | 1 |
| Блокер (ящик, etc.) | 1 (в цели) / 2 (фишка + ящик) |

### Игровой таймер и начало уровня

- Таймер/счётчик ходов запускается **с первого матча**, не с загрузки уровня — чтобы не штрафовать игрока за паузу перед стартом.
- После проигрыша — попап с предложением купить ходы/продолжить за рекламу (+30c / +5 ходов).

---

## 4. SSR: как работает серверный рендеринг

При запросе от браузера:

```
Browser GET /game
    │
    ▼
Express (packages/client/server/index.ts)
    ├── generateNonce()          — случайный nonce на каждый запрос
    ├── applyCsp(nonce)          — заголовок Content-Security-Policy
    ├── renderApp(url, store)    — React → HTML-строка (Vite SSR)
    ├── injectReduxState(nonce)  — <script nonce="…">window.APP_INITIAL_STATE=…</script>
    └── sendHtml(200, html)
    │
    ▼
Browser: получает готовый HTML → гидратация → React берёт управление
```

**Зачем SSR**: первый paint без мигания, SEO-индексация, корректная мета-разметка для шейринга.

---

## 5. Безопасность: CSP и XSS

### Content-Security-Policy (задача 9.1)

CSP-заголовок отдаётся Express-middleware (`packages/client/server/csp.ts`).

Ключевые директивы:

| Директива | Значение в проде |
|-----------|-----------------|
| `default-src` | `'self'` |
| `script-src` | `'self'` + nonce (для inline Redux state) |
| `style-src` | `'self'` `'unsafe-inline'` (PostCSS) |
| `img-src` | `'self'` `data:` `blob:` `https:` |
| `connect-src` | `'self'` `https://ya-praktikum.tech` `https://oauth.yandex.ru` |
| `object-src` | `'none'` (плагины полностью запрещены) |

В dev-режиме добавляются `'unsafe-eval'` (Vite HMR) и `ws:` / `localhost:*`.

На **GitHub Pages** (статика без SSR) — `<meta http-equiv="Content-Security-Policy">` в `index.html`, без nonce, без `unsafe-eval`.

### Защита от XSS (задача 9.4)

XSS-защита — **дополнение** к CSP, не замена:

- Все пользовательские строки экранируются перед вставкой в DOM.
- Форумный контент санируется на сервере перед сохранением в БД.
- Inline-скрипты (Redux state) защищены nonce — без совпадения nonce браузер скрипт не выполнит.

---

## 6. Nginx: конфигурация на проде (задача 9.2)

nginx работает **отдельным контейнером** в `docker-compose.prod.yml` и принимает весь входящий трафик.

```nginx
# Редирект HTTP → HTTPS
server {
    listen 80;
    return 301 https://$host$request_uri;
}

# Основной HTTPS-сервер
server {
    listen 443 ssl http2;
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Проксирование на SSR-клиент
    location / {
        proxy_pass http://client:80;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Healthcheck nginx
    location /ping {
        return 200 'pong\n';
        add_header Content-Type text/plain;
    }
}
```

**Зачем nginx перед Node**:
- TLS-терминация (Node не держит сертификаты).
- HTTP/2 для параллельных запросов.
- Буферизация медленных клиентов, статика без SSR.
- `X-Forwarded-Proto` нужен для корректной работы OAuth cookie (secure flag) и редиректов.

Конфиги: `deploy/nginx/cosmic-match.docker.conf`. Сертификаты: `deploy/nginx/certs/` (certbot или Yandex Certificate Manager).

---

## 7. Деплой в Яндекс.Облако (задачи 9.6 + 9.7)

### Инфраструктура

- **ВМ**: Yandex Compute Cloud, Container Solution, 2 vCPU / 2 GB RAM, **статический публичный IP**.
- **Образы**: собираются в GitHub Actions → публикуются в GHCR (`ghcr.io/<owner>/42-gamedev-teamwork/client:<sha>` и `/server:<sha>`).
- **На ВМ**: `docker-compose.prod.yml` с образами из GHCR (без `build:`).

Порядок запуска сервисов:

```
postgres (healthy) → migrate (success) → server (healthy) → client → nginx
```

### Домен и OAuth (задача 9.7)

1. DNS A-запись у регистратора: `<домен>` → статический IP ВМ.
2. Ментору: `42-gamedev-cosmic-match-<когорта>: <IP>` (активация поддомена курса).
3. После одобрения: добавить `VITE_YANDEX_OAUTH_REDIRECT_URI=https://<FQDN>` в `.env` на ВМ и пересобрать образ client (переменная вшивается при `vite build`).

Проверка: `dig +short <домен>` → IP ВМ; `curl -skI https://<домен>/ping` → `pong`.

---

## 8. CI/CD: автодеплой (задача 9.5)

Четыре GitHub Actions workflow:

| Workflow | Файл | Триггер | Что делает |
|----------|------|---------|-----------|
| **Lint & Test** | `checks.yml` | PR + push main/dev | ESLint, typecheck, unit-тесты |
| **GitHub Pages** | `gh-pages.yml` | push main/dev/sprint_* | Собирает статику → Pages |
| **Build & Push** | `build_and_push.yaml` | push main/dev/sprint_9 | Docker build → GHCR |
| **Deploy** | `deploy.yml` | после Build (ветка `DEPLOY_BRANCH`) + `workflow_dispatch` | SSH → ВМ → `docker compose pull && up -d` |

**Ветка автодеплоя** задаётся через Repository Variable `DEPLOY_BRANCH` (Settings → Actions → Variables). По умолчанию — `main`.

Секреты для деплоя: `YC_VM_HOST`, `YC_VM_USER`, `YC_VM_SSH_KEY`, опционально `YC_DEPLOY_PATH`, `GHCR_TOKEN`/`GHCR_USER` для приватных пакетов.

**Полный цикл**: push → lint → build → push GHCR → SSH на ВМ → `scripts/deploy-on-vm.sh` → healthcheck → `docker compose ps`.

---

## 9. Новые Web API (спринт 9)

| API | Где используется |
|-----|-----------------|
| **Service Worker** | Кэширование ассетов, offline-заглушка (`worker-src: 'self'` в CSP) |
| **Canvas API** | Игровой рендеринг (основной, с v1) |
| **Drag & Drop / Pointer Events** | Перетаскивание фишек |
| **WebSocket** | (готовность к realtime-чату / уведомлениям) |
| **Fetch + AbortController** | Запросы к API с таймаутами |

В CSP явно разрешены: `worker-src 'self'`, `connect-src 'self' https://ya-praktikum.tech`.

---

## 10. Мета-меню и персонаж

Мета-меню — экран между сессиями, где видны взаимодействия с другими персонажами и общий прогресс.

Персонаж — **инопланетянин**. История (нарратив) написана с цепляющими тейками: персонаж завязан на 60% успеха игры, влияет на вовлечённость и рекламные конверсии. История отображается в мета-меню и онбординге.

---

## 11. Локальная разработка

```bash
# Установка зависимостей
yarn install

# Dev-режим (SSR client + server API)
yarn dev

# Сборка
yarn build

# Тесты + lint
yarn test
yarn lint

# Поднять полный docker-стек локально (с nginx на :18443)
docker compose -f docker-compose.prod.yml up -d
bash scripts/verify-nginx-local.sh

# Проверить готовность VM после деплоя
bash scripts/verify-vm-setup.sh
```

---

## 12. Чеклист к финальному демо

- [x] `https://<домен>/` — открывается, HTTPS, HTTP/2
- [x] `https://<домен>/ping` → `pong`
- [x] Логин через Яндекс OAuth работает без ошибки `redirect_uri`
- [x] Игровой экран: drag-and-drop фишек, матч засчитывается
- [x] Цели отображаются как `N/Total` (не проценты)
- [x] Бустеры: ракета (вертикаль), луч (горизонталь), метеорит (4×4)
- [x] Форум: создание топика, ответ
- [x] В DevTools: нет `Refused to load` / `violates CSP`
- [x] В DevTools: `Content-Security-Policy` заголовок присутствует
- [x] GitHub Actions: Build + Deploy прошли зелёными
- [x] `docker compose -f docker-compose.prod.yml ps` — все сервисы `Up`

---

*При изменении домена или ветки деплоя обновить: `VITE_YANDEX_OAUTH_REDIRECT_URI`, `DEPLOY_BRANCH`, `YC_VM_HOST`.*
