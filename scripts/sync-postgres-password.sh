#!/usr/bin/env bash
# Синхронизирует пароль роли postgres в volume с POSTGRES_PASSWORD из .env на ВМ.
# Нужно, если .env меняли после первого docker compose up (иначе migrate exit 1).
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/cosmic-match}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-cosmic-match-postgres}"

cd "$DEPLOY_PATH"

if [ ! -f .env ]; then
  echo "sync-postgres-password: no .env in $DEPLOY_PATH, skip"
  exit 0
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "sync-postgres-password: POSTGRES_PASSWORD empty, skip"
  exit 0
fi

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "sync-postgres-password: container $POSTGRES_CONTAINER not found, skip"
  exit 0
fi

role="${POSTGRES_USER:-postgres}"
escaped_pwd=$(printf '%s' "$POSTGRES_PASSWORD" | sed "s/'/''/g")

echo "==> Sync postgres role password with .env (volume unchanged)"
docker exec "$POSTGRES_CONTAINER" psql -U "$role" -d "${POSTGRES_DB:-postgres}" -v ON_ERROR_STOP=1 \
  -c "ALTER ROLE \"${role}\" PASSWORD '${escaped_pwd}';"

echo "==> Postgres password synced"
