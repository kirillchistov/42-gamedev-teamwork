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
nginx :443 (SSL, HTTP/2)          ← см. nginx-config.md
    │
    v
Docker: client (SSR) :9000→:80
    ├─ proxy /api/v2 → ya-praktikum.tech
    └─ proxy /api/forum, /friends → server :3000
              │
              v
         postgres :5432 (volume)
```

Порты **3000/9000** наружу не открываем — только **22** (SSH), **80**, **443**.

---

## Что используем (как в курсе)

| Компонент | Назначение |
|-----------|------------|
| **GitHub Actions** | Сборка образов ([autodeploy-action.md](autodeploy-action.md)) |
| **GHCR** | Хранение `client` и `server` |
| **Yandex Compute Cloud** | ВМ с Docker / Container Solution |
| **Docker Compose** | [`docker-compose.yml`](../docker-compose.yml) на ВМ |

Образы в репозитории: [`Dockerfile.client`](../Dockerfile.client), [`Dockerfile.server`](../Dockerfile.server).

---

## Шаг 1. Собрать образы (GitHub)

1. Включить workflow **build_and_push** (см. [autodeploy-action.md](autodeploy-action.md)).
2. После push в `main` → вкладка **Actions** → успешный run.
3. **Packages** → скопировать теги, например:
   - `ghcr.io/<github-user>/42-gamedev-teamwork/client:<commit-sha>`
   - `ghcr.io/<github-user>/42-gamedev-teamwork/server:<commit-sha>`

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

### Спецификация Docker Compose на ВМ

Возьмите [`docker-compose.yml`](../docker-compose.yml) и замените `build:` на **`image:`** с тегами из GHCR:

```yaml
services:
  client:
    container_name: cosmic-match-client
    image: ghcr.io/<owner>/42-gamedev-teamwork/client:<sha>
    restart: always
    ports:
      - "9000:80"
    environment:
      NODE_ENV: production
      INTERNAL_SERVER_URL: http://server:3000
      EXTERNAL_SERVER_URL: http://server:3000
      PRAKTIKUM_API_URL: https://ya-praktikum.tech

  server:
    container_name: cosmic-match-server
    image: ghcr.io/<owner>/42-gamedev-teamwork/server:<sha>
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      SERVER_PORT: "3000"
      POSTGRES_HOST: postgres
      POSTGRES_PORT: "5432"
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: <секрет>
      POSTGRES_DB: postgres

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: <секрет>
      POSTGRES_DB: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

  migrate:
    image: ghcr.io/<owner>/42-gamedev-teamwork/server:<sha>
    restart: "no"
    command: ["/app/packages/server/scripts/docker-migrate.sh"]
    environment:
      POSTGRES_HOST: postgres
      # … те же POSTGRES_*
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```

Порядок запуска: `postgres` → `migrate` → `server` → `client` (как в локальном compose).

**Проверка без домена:** `http://<публичный-IP>:9000` — клиент; `http://<IP>:3000/health` — API.

---

## Шаг 3. Nginx и HTTPS на ВМ

На хосте (не в контейнере client) установить nginx, конфиг — [nginx-config.md](nginx-config.md):

- `listen 443 ssl http2`
- `proxy_pass http://127.0.0.1:9000`
- редирект `80 → 443`
- `proxy_set_header X-Forwarded-Proto $scheme` (важно для cookie и OAuth)

Сертификат: **certbot** (`certbot --nginx -d ваш-домен`) или сертификат из Yandex Certificate Manager.

---

## Шаг 4. A-запись на домене (задача 9.7)

### Что сделать в DNS

У регистратора домена (или DNS-хостинга команды):

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| **A** | `@` или поддомен (`match`) | **Статический публичный IP** ВМ | 300–3600 |
| (опционально) **AAAA** | то же | IPv6 ВМ, если выдан | — |

Пример: домен `cosmic-match.example.com` → A → `89.xxx.xxx.xxx`.

Проверка: `dig +short cosmic-match.example.com` или `nslookup`.

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

- `42-gamedev` — имя команды / репозитория;
- `cosmic-match` — продукт;
- `42` — номер когорты (уточните у куратора).

**Второе письмо ментору** (отдельно от IP):

> Просим настроить **A-запись** учебного домена проекта на IP `89.123.45.67`  
> (хост: `https://cosmic-match.<домен-курса>/` или тот FQDN, который выдаёт курс).

Без A-записи от куратора/ментора домен на ваш IP не резолвится, даже если запись создана у регистратора.

### Security Groups / firewall в Облаке

Открыть входящие:

- **22** — SSH (ограничить по IP при возможности);
- **80** — HTTP (редирект + certbot);
- **443** — HTTPS.

Закрыть с интернета **3000**, **9000**, **5433**.

---

## Шаг 5. OAuth после смены URL (спринт 7 → прод)

На **новом** прод-URL OAuth **не заработает**, пока `redirect_uri` не добавят в настройки Практикума.

### Поток (кратко, по [OpenAPI OAuth](https://ya-praktikum.tech/api/v2/openapi/oauth))

1. `GET /oauth/yandex/service-id?redirect_uri=...` → `service_id` (CLIENT_ID).
2. Редирект: `https://oauth.yandex.ru/authorize?response_type=code&client_id=...&redirect_uri=...`
3. Возврат на `redirect_uri?code=...`
4. `POST /oauth/yandex` с `code` → сессия (cookie).
5. `GET /auth/user` с cookie.

### Что согласовать с ментором

1. **Добавить в OAuth** новый `redirect_uri` **символ в символ** (схема, хост, порт, путь, **без лишнего `/`**).
2. Типичные значения для нашего клиента:
   - Прод: `https://<ваш-FQDN>` или `https://<ваш-FQDN>/oauth/yandex/callback` — **как реализовано в** [`oauthApi.ts`](../packages/client/src/shared/api/oauthApi.ts) и `VITE_YANDEX_OAUTH_REDIRECT_URI` (см. [`.env.sample`](../.env.sample)).
3. Локально по-прежнему: `http://localhost:9000` (без завершающего слеша) — [project-yandex-oauth.md](project-yandex-oauth.md).

### Что поменять в проекте после одобрения URI

| Место | Действие |
|-------|----------|
| `.env` на ВМ / secrets CI | `VITE_YANDEX_OAUTH_REDIRECT_URI=https://<FQDN>` (тот же URI, что у ментора) |
| Пересборка образа **client** | `VITE_*` вшиваются при build |
| Проверка | `/login` → «Войти через Яндекс» → возврат без ошибки `redirect_uri` |

Шаблон письма ментору:

```text
Команда 42-gamedev, проект Cosmic Match.
Просим добавить в OAuth redirect_uri для прода:
https://<FQDN>
(или точный callback, если у нас /oauth/yandex/callback — указать из .env)
Старые localhost:9000 / :3000 оставляем для разработки.
```

---

## Обновление кода на ВМ (без полного автодеплоя)

Как в курсе: в консоли Облака **Изменить ВМ → Docker Compose** → новые теги `image:` (**обязательно другой `<sha>`**, не только `latest`) → сохранить.

Или по SSH:

```bash
docker compose pull && docker compose up -d
```

---

## Чеклист готовности 9.6 + 9.7

- [ ] ВМ создана, **статический IP** записан.
- [ ] `docker ps` — `cosmic-match-client`, `cosmic-match-server`, `postgres`.
- [ ] Nginx + HTTPS, HTTP/2 ([nginx-config.md](nginx-config.md)).
- [ ] Ментору отправлена строка `<команда>-<продукт>-<когорта>: <ip>`.
- [ ] Запрошена A-запись на домен; `dig` резолвит IP ВМ.
- [ ] Ментору отправлен новый **OAuth redirect_uri**; в `.env` / CI обновлён `VITE_YANDEX_OAUTH_REDIRECT_URI`, client пересобран.
- [ ] Демо: логин, OAuth, игра, форум по `https://<домен>/`.

---

## Полезные ссылки

- [Сеть в Yandex Cloud](https://cloud.yandex.ru/docs/compute/concepts/network)
- [Деплой в Облако (курс на Хабре)](https://habr.com/ru/company/yandex/blog/437816/)
- [autodeploy-action.md](autodeploy-action.md)
- [nginx-config.md](nginx-config.md)
- [project-yandex-oauth.md](project-yandex-oauth.md)
