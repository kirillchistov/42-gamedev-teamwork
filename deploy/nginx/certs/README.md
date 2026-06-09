# Сертификаты для nginx в Docker (локально)

Контейнер `nginx` монтирует этот каталог в `/etc/nginx/ssl/`.

Перед первым `docker compose up` создайте самоподписанный сертификат:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deploy/nginx/certs/privkey.pem \
  -out deploy/nginx/certs/fullchain.pem \
  -subj "/CN=localhost"
```

Или выполните `./scripts/verify-nginx-local.sh` (шаг 1 сделает это автоматически).

Файлы `*.pem` в `.gitignore` — в репозиторий не коммитятся.

На прод-ВМ используйте Let's Encrypt (`/etc/letsencrypt/...`) и конфиг [`../cosmic-match.conf`](../cosmic-match.conf), не этот каталог.
