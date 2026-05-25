#!/bin/sh
# Sequelize migrate внутри образа cosmic-match-server (без yarn workspace — exit 127 в slim).
set -eu
cd /app/packages/server
for cli in \
  /app/node_modules/.bin/sequelize-cli \
  /app/packages/server/node_modules/.bin/sequelize-cli; do
  if [ -x "$cli" ]; then
    exec "$cli" db:migrate --config config/database.cjs
  fi
done
echo "sequelize-cli not found under /app/node_modules" >&2
exit 127
