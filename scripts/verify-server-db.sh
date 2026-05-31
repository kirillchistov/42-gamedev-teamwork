#!/usr/bin/env bash
# Проверка: server видит Postgres с POSTGRES_PASSWORD из compose/.env
set -euo pipefail

SERVER_CONTAINER="${SERVER_CONTAINER:-cosmic-match-server}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-12}"

for i in $(seq 1 "$MAX_ATTEMPTS"); do
  if docker exec "$SERVER_CONTAINER" node -e \
    "require('/app/packages/server/dist/sequelize.js').sequelize.authenticate().then(()=>process.exit(0)).catch(()=>process.exit(1))" \
    >/dev/null 2>&1; then
    echo "==> Server DB connection OK"
    exit 0
  fi
  echo "==> Waiting for server DB ($i/$MAX_ATTEMPTS)..."
  sleep 5
done

echo "ERROR: server cannot authenticate to Postgres (check POSTGRES_PASSWORD vs volume)" >&2
exit 1
