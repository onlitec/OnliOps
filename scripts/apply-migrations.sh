#!/usr/bin/env bash
set -euo pipefail

PGHOST=${PGHOST:-127.0.0.1}
PGPORT=${PGPORT:-5432}
PGUSER=${PGUSER:-}
PGPASSWORD=${PGPASSWORD:-}
PGDATABASE=${PGDATABASE:-}

if [[ -z "$PGUSER" || -z "$PGPASSWORD" || -z "$PGDATABASE" ]]; then
  echo "Defina PGUSER, PGPASSWORD e PGDATABASE no ambiente"; exit 1
fi

export PGPASSWORD

MIG_DIR="supabase/migrations"
if [[ ! -d "$MIG_DIR" ]]; then
  echo "Diretório de migrações não encontrado: $MIG_DIR"; exit 1
fi

echo "Aplicando migrações em $PGDATABASE@${PGHOST}:${PGPORT}..."
for f in $(ls -1 "$MIG_DIR" | sort); do
  echo "-> $f"
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$MIG_DIR/$f"
done
echo "Migrações aplicadas com sucesso"

