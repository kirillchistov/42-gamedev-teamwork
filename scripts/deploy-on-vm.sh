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

echo "==> Pull images"
docker compose -f "$COMPOSE_FILE" pull

echo "==> Up stack"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Prune old images"
docker image prune -f

echo "==> Status"
docker compose -f "$COMPOSE_FILE" ps
