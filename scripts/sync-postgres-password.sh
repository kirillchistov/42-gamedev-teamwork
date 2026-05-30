#!/usr/bin/env bash
# Синхронизирует пароль роли postgres в volume с POSTGRES_PASSWORD,
# который docker compose подставит в server/migrate (не «меняли .env» — volume
# сам пароль не обновляет после первого docker compose up).
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/cosmic-match}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-cosmic-match-postgres}"

cd "$DEPLOY_PATH"

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "sync-postgres-password: container $POSTGRES_CONTAINER not found, skip"
  exit 0
fi

# Тот же пароль, что у server/migrate после `docker compose up` (не только source .env).
if [ -z "${CLIENT_IMAGE:-}" ] && docker inspect cosmic-match-client >/dev/null 2>&1; then
  CLIENT_IMAGE=$(docker inspect cosmic-match-client --format '{{.Config.Image}}')
fi
if [ -z "${SERVER_IMAGE:-}" ] && docker inspect cosmic-match-server >/dev/null 2>&1; then
  SERVER_IMAGE=$(docker inspect cosmic-match-server --format '{{.Config.Image}}')
fi

compose_pw=""
if [ -n "${CLIENT_IMAGE:-}" ] && [ -n "${SERVER_IMAGE:-}" ]; then
  compose_pw=$(
    docker compose -f "$COMPOSE_FILE" config 2>/dev/null \
      | awk -F': ' '/POSTGRES_PASSWORD:/ { gsub(/"/, "", $2); print $2; exit }'
  )
fi

if [ -z "$compose_pw" ] && [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  compose_pw=${POSTGRES_PASSWORD:-postgres}
fi

compose_pw=${compose_pw:-postgres}
role=${POSTGRES_USER:-postgres}
db=${POSTGRES_DB:-postgres}
escaped_pwd=$(printf '%s' "$compose_pw" | sed "s/'/''/g")

echo "==> Sync postgres role password with compose (volume unchanged)"
docker exec "$POSTGRES_CONTAINER" psql -U "$role" -d "$db" -v ON_ERROR_STOP=1 \
  -c "ALTER ROLE \"${role}\" PASSWORD '${escaped_pwd}';"

echo "==> Postgres password synced"
