# Конфиг Nginx: HTTP/2 и SSL (задача 9.2)

Reverse-proxy перед нашим приложением с **HTTPS** и **HTTP/2**.

Связанные задачи: [csp.md](csp.md) (9.1), [xss.md](xss.md) (9.4), [forum-server-infra.md](forum-server-infra.md) (Docker), деплой — [yacloud-deploy.md](yacloud-deploy.md), [autodeploy-action.md](autodeploy-action.md).

Материалы курса (спринт 9): [NginX-courseware.txt](NginX-courseware.txt) — статика, прокси, SSL, HTTP/2, gzip, логи.

---

## Как поняли задачу

Сейчас в Docker и на dev пользователь ходит напрямую на Node:

- **клиент (SSR)** — HTML, статика, прокси `/api/v2`, `/api/forum`, … ([`packages/client/server/apiProxy.ts`](../packages/client/server/apiProxy.ts));
- **сервер (API)** — форум, друзья, темы UI ([`packages/server`](../packages/server)).

Для прода делают так: снаружи ставят **nginx**, который:

1. Принимает **HTTPS** (порт 443) и расшифровывает трафик (**SSL/TLS**).
2. Отдаёт страницы по **HTTP/2** (быстрее мультиплексирование запросов).
3. Проксирует запросы **внутрь** на Node, не показывая порты 3000/9000 в интернет.

Итог задачи: есть рабочий и задокументированный конфиг nginx с `listen 443 ssl http2` и `proxy_pass` на наш клиент.

---

## Схема (как должно быть)

```text
Браузер  --HTTPS (HTTP/2)-->  nginx :443
                                  |
                                  | proxy_pass
                                  v
                            Node SSR (client) :9000
                                  |
                    +-------------+-------------+
                    |                           |
              /api/v2 (Практикум)      /api/forum, /friends, …
                    |                           |
                    v                           v
            ya-praktikum.tech              Node API (server) :3000
                                                    |
                                                    v
                                              PostgreSQL
```

Пользователь видит один домен, например `https://match.example.com`. Внутри nginx отдаёт всё на **один** upstream — SSR-клиент; тот уже проксирует API, как в dev.

---

## Что уже есть в проекте

| Компонент | Роль |
|-----------|------|
| [`docker-compose.yml`](../docker-compose.yml) | `client` (SSR), `server` (API), `postgres` — **без** nginx |
| [`Dockerfile.client`](../Dockerfile.client) | Node SSR |
| [`packages/client/server/index.ts`](../packages/client/server/index.ts) | Express + Vite (dev) + CSP ([csp.md](csp.md)) |
| GitHub Pages | Статика + SW; nginx там **не** используется |

Задача 9.2 — **добавить слой nginx перед** Docker-стеком (или на ВМ в Яндекс.Облаке, [yacloud-deploy.md](yacloud-deploy.md)).

---

## Соответствие материалам курса (NginX-courseware)

| Тема в курсе | Как применяем в Cosmic Match |
|--------------|------------------------------|
| **Статика + `try_files`** | У нас **SSR** (Express), не чистый SPA на диске. Снаружи — **`proxy_pass`** на client, а не `root` + `try_files $uri /index.html`. Исключение: если вынесете статику на CDN/S3 — отдельный `location` с `expires` (курс, раздел «кеширование»). |
| **Прокси на Node** | Основной паттерн: `proxy_set_header Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` — см. пример ниже (курс, «Настройка прокси»). |
| **Healthcheck** | Курс: `location /ping` с JSON. У нас API: `GET /health` на **server**; через nginx можно пробросить `location /health` → upstream server или оставить проверку только внутри Docker healthcheck. |
| **Приоритет `location`** | Сначала точные (`= /favicon.ico`), затем префиксы; наш конфиг — один `location /` на SSR. |
| **Кеш** | **`index.html` и HTML от SSR не кешировать** (`Cache-Control: no-store` на upstream или в nginx). Для `*.js` / `*.css` с хешем в имени — можно `expires 7d` отдельным `location ~* \.(js|css)$` **после** выноса статики на nginx/CDN. |
| **gzip** | В блоке `http` nginx (курс): `gzip on; gzip_types …` — разгружает отдачу текстовых ответов **до** Node (опционально, не дублировать сжатие с CDN). |
| **SSL + include** | Сертификаты вынести в `include snippets/ssl.conf`; `listen [::]:443 ssl http2` (курс, HTTPS и HTTP/2). |
| **80 → 443** | `return 301 https://$host$request_uri;` — обязательно для прод-домена (курс, «80 → 443»). |
| **HTTP/2** | Параметр `http2` в `listen 443 ssl http2` (курс); требует TLS. |
| **Логи** | `access_log` / `error_log` в `server` или глобально (курс, «Настройка логирования»). |
| **WebSocket** | Для Vite HMR в dev; на проде через nginx обычно не нужен. Если появится WS API — блок с `Upgrade` / `Connection` (курс, прокси WS). |
| **Балансировка** | `upstream` — при нескольких репликах client; для учебной ВМ достаточно одного upstream. |

---

## Порты по умолчанию

| Сервис | Внутри Docker | На хосте (`.env`) |
|--------|---------------|-------------------|
| SSR client | `80` в контейнере | `CLIENT_PORT` → **9000** |
| API server | `SERVER_PORT` → **3000** | **3000** |
| PostgreSQL | `5432` | **5433** (часто с хоста) |

Nginx снаружи слушает **80** (редирект на HTTPS) и **443**. В `proxy_pass` указываем хост, где крутится client, например `http://127.0.0.1:9000` или `http://client:80` из той же docker-сети.

---

## SSL-сертификат

Варианты для учебного/демо прода:

1. **Let's Encrypt** + **certbot** на ВМ (бесплатно, автообновление).
2. **Сертификат облака** (Яндекс Certificate Manager / Load Balancer) — если TLS терминируется на балансировщике, nginx может быть за ним без своих сертификатов.
3. **Самоподписанный** — только для локальной проверки (`openssl`), браузер будет ругаться.

Типичные пути после certbot:

- `/etc/letsencrypt/live/ВАШ_ДОМЕН/fullchain.pem`
- `/etc/letsencrypt/live/ВАШ_ДОМЕН/privkey.pem`

---

## Пример конфига nginx

Файл на сервере, например `/etc/nginx/sites-available/cosmic-match.conf`  
или `./deploy/nginx/cosmic-match.conf` в репозитории.  
Замените `match.example.com`, пути к сертификатам и порт upstream.

### Общие настройки (фрагмент `http` в `/etc/nginx/nginx.conf`)

По материалам курса — сжатие и MIME (при необходимости):

```nginx
http {
    include       mime.types;
    default_type  application/octet-stream;

    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # map для WebSocket (если понадобится)
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    include /etc/nginx/sites-enabled/*.conf;
}
```

### Виртуальный хост (HTTPS + прокси)

```nginx
# Редирект HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name match.example.com;
    return 301 https://$host$request_uri;
}

# Основной HTTPS + HTTP/2
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name match.example.com;

    # TLS (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/match.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/match.example.com/privkey.pem;

    # Современные настройки TLS (минимум для демо; в курсе — отдельный include ssl)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=31536000" always;

    access_log /var/log/nginx/cosmic-match.access.log;
    error_log  /var/log/nginx/cosmic-match.error.log warn;

    # Лимит тела (форум, аватары) — аналог client_max_body_size в курсе
    client_max_body_size 10m;

    # Опционально: healthcheck снаружи (курс — location /ping)
    location = /ping {
        add_header Content-Type application/json;
        return 200 '{"status":"ok","service":"cosmic-match"}';
    }

    # Всё приложение — на SSR-клиент (он сам проксирует /api/v2 и Node API)
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket (Vite HMR только в dev; на проде обычно не нужен)
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # Не кешировать HTML/SSR (курс: index.html без кеша)
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }
}
```

### Почему один `location /`, а не два upstream

В нашем монорепо браузер ходит **same-origin** на клиент: `/api/v2`, `/api/forum`, `/friends` обрабатывает [`apiProxy.ts`](../packages/client/server/apiProxy.ts). Отдельный `proxy_pass` на `:3000` снаружи **не обязателен**, если API не публикуют напрямую.

Отдельный upstream на `server:3000` имеет смысл только если API выносят на поддомен `api.match.example.com` — это отдельная схема, в текущем клиенте не требуется.

---

## HTTP/2 — как работает

- Включение: `listen 443 ssl **http2**` (в nginx 1.25+ можно также `http2 on;` в блоке `server`).
- Работает **поверх TLS**: снаружи браузер говорит HTTP/2, nginx расшифровывает SSL и к Node ходит по **HTTP/1.1** (`proxy_http_version 1.1`) — это нормально.
- Проверка: DevTools → Network → колонка Protocol: `h2`.

---

## CSP и заголовки безопасности (связь с 9.1)

Сейчас CSP на SSR выставляет Express ([`csp.ts`](../packages/client/server/csp.ts)). Варианты на проде:

| Подход | Плюсы / минусы |
|--------|----------------|
| Оставить CSP только на Node | Проще; nginx только прокси, **не** дублировать политику |
| Добавить те же заголовки в nginx | Edge-контроль; нужно **синхронизировать** с [csp.md](csp.md), чтобы не было конфликтующей политики |

Рекомендация: на первом этапе nginx **не** переопределяет `Content-Security-Policy`, а пробрасывает ответ upstream как есть. При необходимости — `proxy_hide_header` / `add_header` только после сверки с `cspPolicy.ts`.

Полезно добавить на nginx (если нет на Node):

```nginx
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
```

---

## Вариант: nginx в Docker Compose

Отдельный сервис в [`docker-compose.yml`](../docker-compose.yml) (как идея):

```yaml
  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/nginx/cosmic-match.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      client:
        condition: service_started
```

В `proxy_pass` тогда: `http://client:80` (внутренняя сеть Compose), а порты 9000 на хост можно не публиковать.

---

## Пошаговый чеклист внедрения

1. Поднять стек: `docker compose up` — client и server healthy.
2. Установить nginx на ВМ (или добавить сервис в Compose).
3. Получить сертификат (certbot `--nginx` или DNS challenge).
4. Положить конфиг, `nginx -t`, `systemctl reload nginx`.
5. Открыть `https://домен/` — лендинг, логин, игра.
6. Проверить форум и OAuth (cookie, `X-Forwarded-Proto https`).
7. DevTools: Protocol `h2`, CSP без лишних ошибок ([csp.md](csp.md) § Проверка).

---

## Частые ошибки

| Симптом | Причина | Что сделать |
|---------|---------|-------------|
| Редирект на `http://` после логина | nginx не передаёт `X-Forwarded-Proto` | `proxy_set_header X-Forwarded-Proto $scheme;` |
| 502 Bad Gateway | client не слушает порт upstream | Проверить `CLIENT_PORT`, `docker compose ps` |
| OAuth/Yandex ломается | неверный redirect URI | В настройках OAuth указать **https** и тот же host, что в `server_name` |
| Две CSP в ответе | nginx + Express оба добавляют заголовок | Оставить CSP только на одном уровне |
| HTTP/2 не видно | заход по HTTP или старый nginx | Только `https://`, проверить `listen … http2` |

---

## Полезные ссылки

- Материалы курса в репозитории: [NginX-courseware.txt](NginX-courseware.txt)
- [Документация nginx: ngx_http_ssl_module](https://nginx.org/ru/docs/http/ngx_http_ssl_module.html)
- [Документация nginx: HTTP/2](https://nginx.org/ru/docs/http/ngx_http_v2_module.html)
- [Let's Encrypt + certbot](https://certbot.eff.org/)
- [Habr: CSP через nginx](https://habr.com/ru/company/nix/blog/271575/) — см. также [csp.md](csp.md)
- Пример gist с заголовками CSP: [ambroisemaupate](https://gist.github.com/ambroisemaupate/bce4b760405558f358ae)

---

## Критерий готовности задачи 9.2

- [ ] Описан и (по возможности) применён конфиг с **SSL** и **HTTP/2**.
- [ ] Снаружи доступен только **443** (80 → редирект на HTTPS).
- [ ] Запросы к приложению идут через **proxy** на SSR-клиент проекта.
- [ ] В README или demo-скрипте есть ссылка на этот файл и команда проверки.

Ответственный по бэклогу: **Сергей**, уровень **L4** ([README.md](../README.md) § Спринт 9).
