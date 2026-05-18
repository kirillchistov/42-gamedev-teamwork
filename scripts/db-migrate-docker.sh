#!/usr/bin/env bash
# Миграции через сеть контейнера postgres (обход конфликта с Homebrew PG на :5432).
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose up -d postgres
docker compose exec -T postgres pg_isready -U postgres -d postgres

docker compose run --rm --no-deps \
  -v "${PWD}:/repo" \
  -w /repo/packages/server \
  --network "container:cosmic-match-postgres" \
  -e POSTGRES_HOST=127.0.0.1 \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER="${POSTGRES_USER:-postgres}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}" \
  -e POSTGRES_DB="${POSTGRES_DB:-postgres}" \
  node:22-bookworm-slim \
  bash -lc '
    set -e
    if [ ! -d /repo/node_modules ]; then
      echo "Сначала выполните yarn в корне репозитория." >&2
      exit 1
    fi
    export PATH="/repo/node_modules/.bin:$PATH"
    sequelize-cli db:migrate --config config/database.cjs
  '
