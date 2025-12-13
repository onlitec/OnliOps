#!/usr/bin/env bash
set -euo pipefail

DB_NAME=""
DB_USER=""
DB_PASS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --db-name)
      DB_NAME="${2-}"
      if [[ -z "$DB_NAME" || "$DB_NAME" == --* ]]; then echo "Faltando valor para --db-name"; exit 1; fi
      shift 2;;
    --db-name=*)
      DB_NAME="${1#*=}"
      shift;;
    --db-user)
      DB_USER="${2-}"
      if [[ -z "$DB_USER" || "$DB_USER" == --* ]]; then echo "Faltando valor para --db-user"; exit 1; fi
      shift 2;;
    --db-user=*)
      DB_USER="${1#*=}"
      shift;;
    --db-pass)
      tmp="${2-}"
      if [[ -z "$tmp" || "$tmp" == --* ]]; then
        DB_PASS="${PGPASSWORD:-}"
        shift 1
      else
        DB_PASS="$tmp"
        shift 2
      fi;;
    --db-pass=*)
      DB_PASS="${1#*=}"
      shift;;
    *) echo "Parâmetro desconhecido: $1"; exit 1;;
  esac
done

if [[ -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASS" ]]; then
  echo "Uso: $0 --db-name <nome> --db-user <usuario> --db-pass <senha>"
  echo "Também aceita formato com '=' e usa PGPASSWORD se --db-pass sem valor."
  exit 1
fi

echo "Instalando PostgreSQL..."
sudo apt-get update -y
sudo apt-get install -y postgresql postgresql-contrib

echo "Criando usuário e banco..."
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS'; END IF; END \$\$;"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
fi

echo "Habilitando extensão uuid-ossp..."
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

PG_HBA="/etc/postgresql/$(psql -V | awk '{print $3}' | cut -d. -f1)/main/pg_hba.conf"
echo "Ajustando $PG_HBA para autenticação segura (md5)..."
sudo sed -i "s/^local\s\+all\s\+all\s\+.*/local all all scram-sha-256/" "$PG_HBA" || true
sudo sed -i "s/^host\s\+all\s\+all\s\+127.0.0.1\/32\s\+.*/host all all 127.0.0.1\/32 scram-sha-256/" "$PG_HBA" || true
sudo sed -i "s/^host\s\+all\s\+all\s\+::1\/128\s\+.*/host all all ::1\/128 scram-sha-256/" "$PG_HBA" || true

echo "Reiniciando serviço PostgreSQL..."
sudo systemctl restart postgresql
sudo systemctl enable postgresql

echo "Teste de conexão..."
PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" >/dev/null
echo "PostgreSQL configurado com sucesso para $DB_USER@$DB_NAME"
