# Деплой в Яндекс.Облако (задачи 9.6 и 9.7)

Решение для:

- **9.6** — выложить сервис в Яндекс.Облако;
- **9.7** — настроить A-запись на домене и согласовать OAuth под новый URL.

Связанные документы: [autodeploy-action.md](autodeploy-action.md), [nginx-config.md](nginx-config.md), [forum-server-infra.md](forum-server-infra.md), [project-yandex-oauth.md](project-yandex-oauth.md).

Официальная документация OAuth ЯП: [OpenAPI — OAuth](https://ya-praktikum.tech/api/v2/openapi/oauth).

---

## Архитектура на ВМ

```text
Интернет
    │
    ├─ DNS A-запись → статический публичный IP ВМ
    │
    v
nginx :443 (SSL, HTTP/2)          ← хост или сервис nginx в compose
    │   proxy_pass → client :9000 (хост) / client:80 (docker-сеть)
    v
Docker Compose (docker-compose.prod.yml):
  client (SSR) :9000→:80
    ├─ apiProxy /api/v2 → ya-praktikum.tech
    └─ apiProxy /api/forum, /friends, /user → server :3000
  migrate (одноразово) → postgres :5432 (volume pgdata)
```

Порты **3000**, **9000**, **5432** с интернета **не публикуем** — только **22** (SSH), **80**, **443**.

Локальная отладка compose: UI **http://localhost:9000**, опционально nginx **https://localhost:18443** — [forum-server-infra.md](forum-server-infra.md).

---

## Что используем (как в теории)

| Компонент | Назначение |
|-----------|------------|
| **GitHub Actions** | Сборка образов ([autodeploy-action.md](autodeploy-action.md)) |
| **GHCR** | Хранение 'client' и 'server' |
| **Yandex Compute Cloud** | ВМ с Docker / Container Solution |
| **Docker Compose** | ['docker-compose.yml'](../docker-compose.yml) на ВМ |

Образы в репозитории: ['Dockerfile.client'](../Dockerfile.client), ['Dockerfile.server'](../Dockerfile.server).

---

## Шаг 1. Собрать образы (GitHub)

1. Включить workflow **build_and_push** (см. [autodeploy-action.md](autodeploy-action.md)).
2. После push в 'main' → вкладка **Actions** → успешный run.
3. **Packages** → скопировать теги, например:
   - 'ghcr.io/<github-user>/42-gamedev-teamwork/client:<commit-sha>'
   - 'ghcr.io/<github-user>/42-gamedev-teamwork/server:<commit-sha>'

---

## Шаг 2. Создать ВМ в Яндекс.Облаке

В каталоге, выданном куратором: **Compute Cloud → Создать ВМ**.

| Параметр | Рекомендация |
|----------|----------------|
| Платформа | Intel Ice Lake |
| vCPU / RAM | 2 vCPU, 2 GB (минимум из курса) |
| Диск | 15–20 GB |
| Образ | **Container Solution** → вкладка **Docker Compose** |
| Публичный IP | **Статический** (обязательно для A-записи) |
| SSH | Ваш публичный ключ (+ ключи команды на уже созданной ВМ) |

### Docker Compose на ВМ

Используйте готовый [`docker-compose.prod.yml`](../docker-compose.prod.yml) (образы GHCR, без `build:`):

```bash
export CLIENT_IMAGE=ghcr.io/<owner>/42-gamedev-teamwork/client:<sha>
export SERVER_IMAGE=ghcr.io/<owner>/42-gamedev-teamwork/server:<sha>
# .env на ВМ: POSTGRES_PASSWORD, FORUM_MODERATOR_*, NGINX_* при необходимости
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Сервисы и порядок (как локально):

| Сервис | Порт на хосте (типично) | Заметка |
|--------|-------------------------|---------|
| postgres | не публикуется наружу | только docker-сеть |
| migrate | — | одноразовые миграции |
| server | 3000 (localhost / SG) | `/health`, `/api/forum` |
| client | **9000→80** | SSR + apiProxy |
| nginx | **80, 443** | TLS, см. certs в `deploy/nginx/certs/` |

Переменные `client`: `INTERNAL_SERVER_URL=http://server:3000`, `PRAKTIKUM_API_URL=https://ya-praktikum.tech` — уже в prod-compose.

Порядок: `postgres` (healthy) → `migrate` (success) → `server` (healthy) → `client` → `nginx`.

**Временная проверка без домена** (закройте порт 9000 в SG после отладки): `http://<публичный-IP>:9000`. API: `http://<IP>:3000/health` только с ВМ/SSH.

---

## Шаг 3. Nginx и HTTPS на ВМ

Два варианта (оба описаны в [nginx-config.md](nginx-config.md)):

1. **Сервис `nginx` в `docker-compose.prod.yml`** — монтируются `deploy/nginx/cosmic-match.docker.conf` и сертификаты в `deploy/nginx/certs/`. На ВМ в `.env`: `NGINX_HTTP_PORT=80`, `NGINX_HTTPS_PORT=443`.
2. **nginx на хосте ВМ** — `proxy_pass http://127.0.0.1:9000`, если client проброшен только на localhost.

Обязательно:

- `listen 443 ssl http2`
- `proxy_set_header X-Forwarded-Proto $scheme` (cookie, OAuth)
- редирект `80 → 443`

Сертификат: **certbot** или Yandex Certificate Manager → файлы в `deploy/nginx/certs/` (см. README в этой папке).

---

## Шаг 4. A-запись на домене (задача 9.7)

### Что сделать в DNS

У регистратора домена (или DNS-хостинга команды):

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| **A** | '@' или поддомен ('match') | **Статический публичный IP** ВМ | 300–3600 |
| (опционально) **AAAA** | то же | IPv6 ВМ, если выдан | — |

Пример: домен 'cosmic-match.example.com' → A → '89.xxx.xxx.xxx'.

Проверка: 'dig +short cosmic-match.example.com' или 'nslookup'.

### Сообщение ментору (обязательный формат)

Отправьте **статический** публичный IP в одной строке:

```text
<имя-команды>-<название-продукта>-<номер-когорты>: <ip>
```

**Пример для нашего проекта** (подставьте реальный IP и номер когорты):

```text
42-gamedev-cosmic-match-42: 89.123.45.67
```

Где:

- '42-gamedev' — имя команды / репозитория;
- 'cosmic-match' — продукт;
- '42' — номер когорты (уточните у куратора).

**Второе письмо ментору** (отдельно от IP):

> Просим настроить **A-запись** учебного домена проекта на IP '89.123.45.67'  
> (хост: 'https://cosmic-match.<домен-курса>/' или тот FQDN, который выдаёт курс).

Без A-записи от куратора/ментора домен на ваш IP не резолвится, даже если запись создана у регистратора.

### Security Groups / firewall в Облаке

Открыть входящие:

- **22** — SSH (ограничить по IP при возможности);
- **80** — HTTP (редирект + certbot);
- **443** — HTTPS.

Закрыть с интернета **3000**, **9000**, **5433**.

---

## Шаг 5. OAuth после смены URL (спринт 7 → прод)

На **новом** прод-URL OAuth **не заработает**, пока 'redirect_uri' не добавят в настройки Практикума.

### Поток (кратко, по [OpenAPI OAuth](https://ya-praktikum.tech/api/v2/openapi/oauth))

1. 'GET /oauth/yandex/service-id?redirect_uri=...' → 'service_id' (CLIENT_ID).
2. Редирект: 'https://oauth.yandex.ru/authorize?response_type=code&client_id=...&redirect_uri=...'
3. Возврат на 'redirect_uri?code=...'
4. 'POST /oauth/yandex' с 'code' → сессия (cookie).
5. 'GET /auth/user' с cookie.

### Что согласовать с ментором

1. **Добавить в OAuth** новый 'redirect_uri' **символ в символ** (схема, хост, порт, путь, **без лишнего '/'**).
2. Типичные значения для нашего клиента:
   - Прод: 'https://<ваш-FQDN>' или 'https://<ваш-FQDN>/oauth/yandex/callback' — **как реализовано в** ['oauthApi.ts'](../packages/client/src/shared/api/oauthApi.ts) и 'VITE_YANDEX_OAUTH_REDIRECT_URI' (см. ['.env.sample'](../.env.sample)).
3. Локально по-прежнему: 'http://localhost:9000' (без завершающего слеша) — [project-yandex-oauth.md](project-yandex-oauth.md).

### Что поменять в проекте после одобрения URI

| Место | Действие |
|-------|----------|
| '.env' на ВМ / secrets CI | 'VITE_YANDEX_OAUTH_REDIRECT_URI=https://<FQDN>' (тот же URI, что у ментора) |
| Пересборка образа **client** | 'VITE_*' вшиваются при build |
| Проверка | '/login' → «Войти через Яндекс» → возврат без ошибки 'redirect_uri' |

Шаблон письма ментору:

```text
Команда 42-gamedev, проект Cosmic Match.
Просим добавить в OAuth redirect_uri для прода:
https://<FQDN>
(или точный callback, если у нас /oauth/yandex/callback — указать из .env)
Старые localhost:9000 / :3000 оставляем для разработки.
```

---

## Обновление кода на ВМ

### Автодеплой (рекомендуется)

После push в 'main': workflow **Build and push** → **Deploy to Yandex Cloud VM**.  
Настройка: [autodeploy-action.md](autodeploy-action.md), первый запуск ВМ: [deploy/vm/README.md](../deploy/vm/README.md).

### Вручную (как в курсе)

В консоли Облака **Изменить ВМ → Docker Compose** → новые теги 'image:' (**обязательно другой '<sha>'**, не только 'latest').

Или по SSH:

```bash
cd /opt/cosmic-match
export CLIENT_IMAGE=ghcr.io/<owner>/<repo>/client:<sha>
export SERVER_IMAGE=ghcr.io/<owner>/<repo>/server:<sha>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Чеклист готовности 9.6 + 9.7

- [ ] ВМ создана, **статический IP** записан.
- [ ] 'docker ps' — 'cosmic-match-client', 'cosmic-match-server', 'postgres'.
- [ ] Nginx + HTTPS, HTTP/2 ([nginx-config.md](nginx-config.md)).
- [ ] Ментору отправлена строка '<команда>-<продукт>-<когорта>: <ip>'.
- [ ] Запрошена A-запись на домен; 'dig' резолвит IP ВМ.
- [ ] Ментору отправлен новый **OAuth redirect_uri**; в '.env' / CI обновлён 'VITE_YANDEX_OAUTH_REDIRECT_URI', client пересобран.
- [ ] Демо: логин, OAuth, игра, форум по 'https://<домен>/'.

---

## Полезные ссылки

- [Сеть в Yandex Cloud](https://cloud.yandex.ru/docs/compute/concepts/network)
- [Деплой в Облако (курс на Хабре)](https://habr.com/ru/company/yandex/blog/437816/)
- [autodeploy-action.md](autodeploy-action.md)
- [nginx-config.md](nginx-config.md)
- [project-yandex-oauth.md](project-yandex-oauth.md)
