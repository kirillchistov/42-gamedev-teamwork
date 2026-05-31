# Конфиг Nginx: HTTP/2 и SSL (9.2)

Reverse-proxy перед нашим приложением с **HTTPS** и **HTTP/2**.

Связанные задачи: [csp.md](csp.md) (9.1), [xss.md](xss.md) (9.4), [forum-server-infra.md](forum-server-infra.md) (Docker), деплой — [yacloud-deploy.md](yacloud-deploy.md), [autodeploy-action.md](autodeploy-action.md).

---

## Как поняли задачу

Сейчас в Docker и на dev пользователь ходит напрямую на Node:

- **клиент (SSR)** — HTML, статика, прокси '/api/v2', '/api/forum', … (['packages/client/server/apiProxy.ts'](../packages/client/server/apiProxy.ts));
- **сервер (API)** — форум, друзья, темы UI (['packages/server'](../packages/server)).

Для прода надо сделать так: снаружи поставить **nginx**, который:

1. Принимает **HTTPS** (порт 443) и расшифровывает трафик (**SSL/TLS**).
2. Отдаёт страницы по **HTTP/2** (быстрее мультиплексирование запросов).
3. Проксирует запросы **внутрь** на Node, не показывая порты 3000/9000 в интернет.

Итог решения задачи: есть рабочий и задокументированный конфиг nginx с 'listen 443 ssl http2' и 'proxy_pass' на наш клиент.

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

Пользователь видит один домен, например 'https://match.example.com'. Внутри nginx отдаёт всё на **один** upstream — SSR-клиент; тот уже проксирует API, как в dev.

---

## Что уже есть в проекте

| Компонент | Роль |
|-----------|------|
| ['docker-compose.yml'](../docker-compose.yml) | 'client', 'server', 'postgres', **'nginx'** (HTTPS + HTTP/2) |
| ['Dockerfile.client'](../Dockerfile.client) | Node SSR |
| ['packages/client/server/index.ts'](../packages/client/server/index.ts) | Express + Vite (dev) + CSP ([csp.md](csp.md)) |
| GitHub Pages | Статика + SW; nginx там **не** используется |

Задача 9.2 — **добавить слой nginx перед** Docker-стеком (или на ВМ в Яндекс.Облаке, [yacloud-deploy.md](yacloud-deploy.md)).

---

## Соответствие материалам

| Тема в ЯП | Как мы применяем |
|--------------|------------------------------|
| **Статика + 'try_files'** | У нас **SSR** (Express), не чистый SPA на диске. Снаружи — **'proxy_pass'** на client, а не 'root' + 'try_files $uri /index.html'. Исключение: если выносим статику на CDN/S3 — отдельный 'location' с 'expires' (см. раздел «кеширование» в ЯП). |
| **Прокси на Node** | Основной паттерн: 'proxy_set_header Host', 'X-Real-IP', 'X-Forwarded-For', 'X-Forwarded-Proto' — см. пример ниже (раздел «Настройка прокси»). |
| **Healthcheck** | Курс: 'location /ping' с JSON. У нас API: 'GET /health' на **server**; через nginx можно пробросить 'location /health' → upstream server или оставить проверку только внутри Docker healthcheck. |
| **Приоритет 'location'** | Сначала точные ('= /favicon.ico'), затем префиксы; наш конфиг — один 'location /' на SSR. |
| **Кеш** | **'index.html' и HTML от SSR не кешировать** ('Cache-Control: no-store' на upstream или в nginx). Для '*.js' / '*.css' с хешем в имени — можно 'expires 7d' отдельным 'location ~* \.(js|css)$' **после** выноса статики на nginx/CDN. |
| **gzip** | В блоке 'http' nginx (раздел nginx): 'gzip on; gzip_types …' — разгружает отдачу текстовых ответов **до** Node (опционально, не дублировать сжатие с CDN). |
| **SSL + include** | Сертификаты вынести в 'include snippets/ssl.conf'; 'listen [::]:443 ssl http2' (разделы "HTTPS" и "HTTP/2"). |
| **80 → 443** | 'return 301 https://$host$request_uri;' — обязательно для прод-домена (Разделы, «80 → 443»). |
| **HTTP/2** | Параметр 'http2' в 'listen 443 ssl http2' (раздел "HTTP/2"); требует TLS. |
| **Логи** | 'access_log' / 'error_log' в 'server' или глобально (раздел «Настройка логирования»). |
| **WebSocket** | Для Vite HMR в dev; на проде через nginx обычно не нужен. Если появится WS API — блок с 'Upgrade' / 'Connection' (раздел "прокси WS"). |
| **Балансировка** | 'upstream' — при нескольких репликах client; для учебной ВМ достаточно одного upstream. |

---

## Порты по умолчанию

| Сервис | Внутри Docker | На хосте ('.env') |
|--------|---------------|-------------------|
| SSR client | '80' в контейнере | 'CLIENT_PORT' → **9000** |
| API server | 'SERVER_PORT' → **3000** | **3000** |
| PostgreSQL | '5432' | **5433** (часто с хоста) |

Nginx снаружи слушает **80** (редирект на HTTPS) и **443**. В 'proxy_pass' указываем хост, где крутится client, например 'http://127.0.0.1:9000' или 'http://client:80' из той же docker-сети.

---

## SSL-сертификат

Варианты для учебного/демо прода:

1. **Let's Encrypt** + **certbot** на ВМ (бесплатно, автообновление).
2. **Сертификат облака** (Яндекс Certificate Manager / Load Balancer) — если TLS терминируется на балансировщике, nginx может быть за ним без своих сертификатов.
3. **Самоподписанный** — только для локальной проверки ('openssl'), браузер будет ругаться.

Типичные пути после certbot:

- '/etc/letsencrypt/live/ВАШ_ДОМЕН/fullchain.pem'
- '/etc/letsencrypt/live/ВАШ_ДОМЕН/privkey.pem'

---

## Пример конфига nginx

Файл на сервере, например '/etc/nginx/sites-available/cosmic-match.conf'  
или './deploy/nginx/cosmic-match.conf' в репозитории.  
Замените 'match.example.com', пути к сертификатам и порт upstream.

### Общие настройки (фрагмент 'http' в '/etc/nginx/nginx.conf')

По мотивам материалов ЯП  — сжатие и MIME (при необходимости):

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
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name match.example.com;

    # TLS (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/match.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/match.example.com/privkey.pem;

    # Современные настройки TLS (минимум для демо; в ЯП — отдельный include ssl)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=31536000" always;

    access_log /var/log/nginx/cosmic-match.access.log;
    error_log  /var/log/nginx/cosmic-match.error.log warn;

    # Лимит тела (форум, аватары) — аналог client_max_body_size в доках ЯП
    client_max_body_size 10m;

    # Опционально: healthcheck снаружи (в доках ЯП — location /ping)
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

        # Не кешировать HTML/SSR (в доках ЯП: index.html без кеша)
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }
}
```

### Почему один 'location /', а не два upstream

В нашем монорепо браузер ходит **same-origin** на клиент: '/api/v2', '/api/forum', '/friends' обрабатывает ['apiProxy.ts'](../packages/client/server/apiProxy.ts). Отдельный 'proxy_pass' на ':3000' снаружи **не обязателен**, если API не публикуют напрямую.

Отдельный upstream на 'server:3000' имеет смысл только если API выносят на поддомен 'api.match.example.com' — это отдельная схема, в текущем клиенте не требуется.

---

## HTTP/2 — как работает

- Включение: 'listen 443 ssl **http2**' (в nginx 1.25+ можно также 'http2 on;' в блоке 'server').
- Работает **поверх TLS**: снаружи браузер говорит HTTP/2, nginx расшифровывает SSL и к Node ходит по **HTTP/1.1** ('proxy_http_version 1.1') — это нормально.
- Проверка: DevTools → Network → колонка Protocol: 'h2'.

---

## CSP и заголовки безопасности (связь с 9.1)

Сейчас CSP на SSR выставляет Express (['csp.ts'](../packages/client/server/csp.ts)). Варианты на проде:

| Подход | Плюсы / минусы |
|--------|----------------|
| Оставить CSP только на Node | Проще; nginx только прокси, **не** дублировать политику |
| Добавить те же заголовки в nginx | Edge-контроль; нужно **синхронизировать** с [csp.md](csp.md), чтобы не было конфликтующей политики |

Рекомендация: на первом этапе nginx **не** переопределяет 'Content-Security-Policy', а пробрасывает ответ upstream как есть. При необходимости — 'proxy_hide_header' / 'add_header' только после сверки с 'cspPolicy.ts'.

Полезно добавить на nginx (если нет на Node):

```nginx
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
```

---

## nginx в Docker Compose

Сервис **`nginx`** уже в [`docker-compose.yml`](../docker-compose.yml):

- снаружи: `${NGINX_HTTP_PORT:-18080}` (редирект) и `${NGINX_HTTPS_PORT:-18443}` (HTTPS + HTTP/2);
- внутри: `proxy_pass` → `http://client:80`;
- конфиг: [`deploy/nginx/cosmic-match.docker.conf`](../deploy/nginx/cosmic-match.docker.conf);
- сертификаты: [`deploy/nginx/certs/`](../deploy/nginx/certs/README.md) (локально самоподписанные).

```bash
# один раз — сертификат
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deploy/nginx/certs/privkey.pem \
  -out deploy/nginx/certs/fullchain.pem \
  -subj "/CN=localhost"

docker compose up -d
# https://localhost:18443/
```

Прямой доступ к SSR без TLS (отладка): `http://localhost:${CLIENT_PORT:-9000}`.

---

## Файлы в репозитории

| Файл | Назначение |
|------|------------|
| [`deploy/nginx/cosmic-match.conf`](../deploy/nginx/cosmic-match.conf) | Прод на ВМ: `listen 443 ssl http2`, Let's Encrypt, `proxy_pass` → `:9000` |
| [`deploy/nginx/cosmic-match.docker.conf`](../deploy/nginx/cosmic-match.docker.conf) | Локальная проверка в Docker → `client:80` |
| [`deploy/nginx/docker/nginx.conf`](../deploy/nginx/docker/nginx.conf) | `http` + `map` для WebSocket upgrade |
| [`docker-compose.yml`](../docker-compose.yml) | Сервис `nginx` в общем стеке |
| [`scripts/verify-nginx-local.sh`](../scripts/verify-nginx-local.sh) | Сертификат, `nginx -t`, curl HTTP/2 |

### Локальная проверка (macOS / Linux)

```bash
chmod +x scripts/verify-nginx-local.sh
./scripts/verify-nginx-local.sh
```

Порты по умолчанию: **18080** → редирект на **18443** (HTTPS; не 8080 — часто занят другим nginx на macOS). В DevTools на `https://localhost:18443` колонка Protocol должна быть **h2**.

Только синтаксис без поднятия стека:

```bash
./scripts/verify-nginx-local.sh   # шаги 1–2
# или вручную:
docker run --rm \
  -v "$PWD/deploy/nginx/docker/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$PWD/deploy/nginx/cosmic-match.docker.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$PWD/deploy/nginx/certs:/etc/nginx/ssl:ro" \
  nginx:1.27-alpine nginx -t
```

---

## Пошаговый чеклист внедрения

1. Поднять стек: `docker compose up` — client и server healthy.
2. Локально: `docker compose up -d` (включая nginx); на ВМ — nginx на хосте или тот же образ.
3. Получить сертификат (certbot `--nginx` или DNS challenge); на ВМ — [`deploy/nginx/cosmic-match.conf`](../deploy/nginx/cosmic-match.conf).
4. Положить конфиг, `nginx -t`, `systemctl reload nginx`.
5. Открыть 'https://домен/' — лендинг, логин, игра.
6. Проверить форум и OAuth (cookie, 'X-Forwarded-Proto https').
7. DevTools: Protocol 'h2', CSP без лишних ошибок ([csp.md](csp.md) § Проверка).

---

## Частые ошибки

| Симптом | Причина | Что сделать |
|---------|---------|-------------|
| Редирект на 'http://' после логина | nginx не передаёт 'X-Forwarded-Proto' | 'proxy_set_header X-Forwarded-Proto $scheme;' |
| 502 Bad Gateway | client не слушает порт upstream | Проверить 'CLIENT_PORT', 'docker compose ps' |
| OAuth/Yandex ломается | неверный redirect URI | В настройках OAuth указать **https** и тот же host, что в 'server_name' |
| Две CSP в ответе | nginx + Express оба добавляют заголовок | Оставить CSP только на одном уровне |
| HTTP/2 не видно | заход по HTTP или старый nginx | Только 'https://', проверить 'listen … http2' |

---

## Полезные ссылки

- [Материалы курса](https://practicum.yandex.ru/learn/middle-frontend-react/)
- [Документация nginx: ngx_http_ssl_module](https://nginx.org/ru/docs/http/ngx_http_ssl_module.html)
- [Документация nginx: HTTP/2](https://nginx.org/ru/docs/http/ngx_http_v2_module.html)
- [Let's Encrypt + certbot](https://certbot.eff.org/)
- [Habr: CSP через nginx](https://habr.com/ru/company/nix/blog/271575/) — см. также [csp.md](csp.md)
- Пример gist с заголовками CSP: [ambroisemaupate](https://gist.github.com/ambroisemaupate/bce4b760405558f358ae)

---

## Критерий готовности задачи 9.2

- [x] Конфиг в репозитории: `deploy/nginx/cosmic-match.conf` (**SSL** + **HTTP/2**).
- [x] nginx в `docker-compose.yml`; проверка: `scripts/verify-nginx-local.sh`.
- [ ] На прод-ВМ: только **443** снаружи (80 → редирект), certbot/Let's Encrypt.
- [ ] Запросы через **proxy** на SSR-клиент проверены на реальном домене (OAuth, форум).
