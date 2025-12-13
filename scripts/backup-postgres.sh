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
BACKUP_DIR="/var/backups/network_platform"
sudo mkdir -p "$BACKUP_DIR"

STAMP=$(date +"%Y%m%d-%H%M%S")
FILE="$BACKUP_DIR/${PGDATABASE}-${STAMP}.sql.gz"

echo "Gerando backup: $FILE"
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" | gzip -9 | sudo tee "$FILE" >/dev/null

echo "Backup concluído: $FILE"

# Retenção: manter últimos 14
sudo ls -1t "$BACKUP_DIR" | tail -n +15 | xargs -r -I{} sudo rm -f "$BACKUP_DIR/{}"

