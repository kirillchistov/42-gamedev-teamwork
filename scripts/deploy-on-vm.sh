#!/usr/bin/env bash
# Выполняется на ВМ (из GitHub Actions по SSH): pull образов GHCR и перезапуск стека.
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/cosmic-match}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

: "${CLIENT_IMAGE:?CLIENT_IMAGE is required}"
: "${SERVER_IMAGE:?SERVER_IMAGE is required}"

cd "$DEPLOY_PATH"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing $DEPLOY_PATH/$COMPOSE_FILE — скопируйте репозиторий или compose-файл на ВМ."
  exit 1
fi

if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER:-${GITHUB_ACTOR:-github}}" --password-stdin
fi

export CLIENT_IMAGE SERVER_IMAGE

echo "==> Disk before deploy"
df -h / | tail -1

echo "==> Prune unused images (free disk before pull)"
docker image prune -a -f

echo "==> Pull images"
docker compose -f "$COMPOSE_FILE" pull

echo "==> Ensure postgres is up"
docker compose -f "$COMPOSE_FILE" up -d postgres
for _ in $(seq 1 30); do
  if docker inspect cosmic-match-postgres --format '{{.State.Health.Status}}' 2>/dev/null | grep -q healthy; then
    break
  fi
  sleep 2
done

if [ -f "$DEPLOY_PATH/scripts/sync-postgres-password.sh" ]; then
  bash "$DEPLOY_PATH/scripts/sync-postgres-password.sh"
elif [ -f "$(dirname "$0")/sync-postgres-password.sh" ]; then
  bash "$(dirname "$0")/sync-postgres-password.sh"
fi

echo "==> Up stack"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Recreate server (POSTGRES_* из .env после sync-postgres-password)"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate server

if [ -f "$DEPLOY_PATH/scripts/verify-server-db.sh" ]; then
  bash "$DEPLOY_PATH/scripts/verify-server-db.sh"
elif [ -f "$(dirname "$0")/verify-server-db.sh" ]; then
  bash "$(dirname "$0")/verify-server-db.sh"
fi

echo "==> Prune dangling layers"
docker image prune -f

echo "==> Disk after deploy"
df -h / | tail -1

echo "==> Status"
docker compose -f "$COMPOSE_FILE" ps
