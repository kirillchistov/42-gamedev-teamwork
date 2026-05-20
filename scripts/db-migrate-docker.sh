#!/usr/bin/env bash
# Миграции через сеть контейнера postgres (обход конфликта с Homebrew PG на :5432).
set -euo pipefail
# 8.10 demo MCR (sprint_8):
# # Runs Sequelize migrations from an isolated container attached to the Postgres
# # container network. Useful when localhost:5432 is owned by another Postgres.
# set -euo pipefail

cd "$(dirname "$0")/.."

docker compose up -d postgres
docker compose exec -T postgres pg_isready \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-postgres}"

PG_CID="$(docker compose ps -q postgres)"
if [ -z "${PG_CID}" ]; then
  echo "Контейнер postgres не найден. Запустите: docker compose up -d postgres" >&2
  exit 1
fi

docker run --rm \
  -v "${PWD}:/repo" \
  -w /repo/packages/server \
  --network "container:${PG_CID}" \
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
    export PATH="/repo/packages/server/node_modules/.bin:/repo/node_modules/.bin:$PATH"
    npx sequelize-cli db:migrate --config config/database.cjs
  '

# 8.10 demo MCR (sprint_8 — docker compose run + фиксированное имя сети):
# docker compose run --rm --no-deps \
#   -v "${PWD}:/repo" \
#   -w /repo/packages/server \
#   --network "container:cosmic-match-postgres" \
#   ...
#   bash -lc '
#     set -euo pipefail
#     ...
#     export PATH="/repo/node_modules/.bin:$PATH"
#     sequelize-cli db:migrate --config config/database.cjs
#   '
