#!/usr/bin/env bash
# Локальная проверка nginx (SSL, HTTP/2, proxy_pass) для задачи 9.2.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CERT_DIR="deploy/nginx/certs"
HTTP_PORT="${NGINX_HTTP_PORT:-18080}"
HTTPS_PORT="${NGINX_HTTPS_PORT:-18443}"

echo "==> 1. Сертификат для localhost (самоподписанный)"
mkdir -p "$CERT_DIR"
if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=localhost"
  echo "    Создан $CERT_DIR/fullchain.pem"
else
  echo "    Уже есть $CERT_DIR/fullchain.pem"
fi

echo "==> 2. Docker Compose: postgres → migrate → server → client → nginx"
docker compose up -d postgres migrate server client nginx

echo "==> 3. Синтаксис конфига (nginx -t в сети compose, резолв client)"
docker compose exec -T nginx nginx -t

echo "==> 4. Ожидание healthy client / nginx"
sleep 12
docker compose ps

echo "==> 5. HTTP → HTTPS редирект"
curl -sI "http://127.0.0.1:${HTTP_PORT}/" | head -5

echo "==> 6. HTTPS /ping (HTTP/2 при поддержке curl)"
curl -skI --http2 "https://127.0.0.1:${HTTPS_PORT}/ping" | head -10

echo "==> 7. HTTPS прокси на приложение (корень)"
curl -skI --http2 "https://127.0.0.1:${HTTPS_PORT}/" | head -15

echo ""
echo "Готово. Откройте в браузере: https://localhost:${HTTPS_PORT}/"
echo "(самоподписанный сертификат — предупреждение нормально)"
echo "DevTools → Network → Protocol: h2"
