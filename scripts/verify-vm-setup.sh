#!/usr/bin/env bash
# Проверка готовности ВМ к деплою Cosmic Match (запускать на сервере или через yc compute ssh).
# Пустой `docker ps` — норма, пока не выполнен deploy-on-vm.sh / GitHub Actions deploy.
set -uo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/cosmic-match}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

ok() { printf '  [OK] %s\n' "$*"; }
warn() { printf '  [!!] %s\n' "$*"; }
fail() { printf '  [XX] %s\n' "$*"; }

section() { printf '\n== %s ==\n' "$*"; }

section "Host"
hostname -f 2>/dev/null || hostname
whoami
if command -v curl >/dev/null 2>&1; then
  printf 'Public IPv4 (ifconfig.me): %s\n' "$(curl -fsS --max-time 3 https://ifconfig.me 2>/dev/null || echo '?')"
fi

section "Docker"
if command -v docker >/dev/null 2>&1; then
  ok "docker: $(docker --version 2>/dev/null | head -1)"
else
  fail "docker не установлен"
fi

if docker compose version >/dev/null 2>&1; then
  ok "compose: $(docker compose version 2>/dev/null | head -1)"
elif command -v docker-compose >/dev/null 2>&1; then
  warn "legacy docker-compose: $(docker-compose --version 2>/dev/null | head -1) — лучше plugin v2"
else
  fail "docker compose не найден"
fi

if systemctl is-active docker >/dev/null 2>&1; then
  ok "systemd: docker $(systemctl is-active docker)"
elif pgrep -x dockerd >/dev/null 2>&1; then
  ok "dockerd process running"
else
  warn "не удалось подтвердить, что dockerd запущен"
fi

if groups | grep -qw docker 2>/dev/null; then
  ok "пользователь $(whoami) в группе docker (sudo для docker не обязателен)"
else
  warn "пользователь $(whoami) не в группе docker — нужен sudo для docker"
fi

section "Deploy directory ($DEPLOY_PATH)"
if [ -d "$DEPLOY_PATH" ]; then
  ok "каталог существует"
  ls -la "$DEPLOY_PATH" 2>/dev/null | head -20 || true
else
  fail "нет $DEPLOY_PATH — создайте: sudo mkdir -p $DEPLOY_PATH && sudo chown \$USER:\$USER $DEPLOY_PATH"
fi

if [ -f "$DEPLOY_PATH/$COMPOSE_FILE" ]; then
  ok "$COMPOSE_FILE на месте"
else
  warn "нет $DEPLOY_PATH/$COMPOSE_FILE (скопирует GitHub Actions или git clone)"
fi

if [ -f "$DEPLOY_PATH/.env" ]; then
  ok ".env есть"
else
  warn "нет $DEPLOY_PATH/.env — скопируйте из .env.sample и задайте POSTGRES_PASSWORD"
fi

if [ -f "$DEPLOY_PATH/scripts/deploy-on-vm.sh" ]; then
  ok "scripts/deploy-on-vm.sh"
else
  warn "нет deploy-on-vm.sh (придёт с workflow deploy)"
fi

if [ -d "$DEPLOY_PATH/deploy/nginx" ]; then
  ok "deploy/nginx/"
  if [ -f "$DEPLOY_PATH/deploy/nginx/certs/fullchain.pem" ] 2>/dev/null ||
     [ -f "$DEPLOY_PATH/deploy/nginx/certs/cert.pem" ] 2>/dev/null; then
    ok "TLS-сертификаты в deploy/nginx/certs/"
  else
    warn "нет сертификатов в deploy/nginx/certs/ — nginx в compose не поднимется до certbot/самоподписанных"
  fi
else
  warn "нет deploy/nginx/ (нужен для prod nginx-контейнера)"
fi

section "Running containers"
if command -v docker >/dev/null 2>&1; then
  if docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null | tail -n +2 | grep -q .; then
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  else
    warn "контейнеров нет — запустите деплой (GH Actions или вручную pull/up)"
    docker ps -a --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | head -10 || true
  fi
fi

section "Expected prod containers (after deploy)"
for name in cosmic-match-postgres cosmic-match-server cosmic-match-client cosmic-match-nginx; do
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$name"; then
    ok "$name"
  else
    warn "не запущен: $name"
  fi
done

section "Listening ports (80, 443, 3000, 9000)"
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep -E ':(80|443|3000|9000)\s' || warn "порты 80/443/3000/9000 не слушаются"
elif command -v netstat >/dev/null 2>&1; then
  netstat -tln 2>/dev/null | grep -E ':(80|443|3000|9000)\s' || warn "порты не слушаются"
else
  warn "ss/netstat недоступны"
fi

section "Disk"
df -h / /var/lib/docker 2>/dev/null | tail -n +1

section "GHCR login (optional)"
if docker info 2>/dev/null | grep -q 'ghcr.io'; then
  ok "в docker config есть ghcr.io"
else
  warn "docker login ghcr.io не выполнен (нужен для приватных образов)"
fi

printf '\nГотово. См. deploy/vm/README.md и docs/yacloud-deploy.md\n'
