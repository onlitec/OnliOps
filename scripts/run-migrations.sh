#!/bin/bash
# ============================================
# Script para executar migrations no PostgreSQL
# do OnliOps no Coolify
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[OnliOps] Executando migrations no banco de dados...${NC}"

# Pegar o nome do container database
DB_CONTAINER=$(docker ps --filter "name=database-icww0c48c8k8cw0o4088scgk" --format "{{.Names}}" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo -e "${RED}[ERRO] Container database não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Container database: $DB_CONTAINER${NC}"

# Configurações do banco
DB_USER="calabasas_admin"
DB_NAME="calabasas_local"

# Diretório das migrations
MIGRATIONS_DIR="/data/coolify/applications/icww0c48c8k8cw0o4088scgk/supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}[ERRO] Diretório de migrations não encontrado: $MIGRATIONS_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}[OnliOps] Verificando tabelas existentes...${NC}"
TABLES=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>&1)

if echo "$TABLES" | grep -q "Did not find any relations"; then
    echo -e "${YELLOW}[INFO] Nenhuma tabela encontrada. Executando migrations...${NC}"
    
    # Executar migrations principais em ordem
    MIGRATION_FILES=(
        "001_initial_schema.sql"
        "003_sample_data.sql"
    )
    
    for migration in "${MIGRATION_FILES[@]}"; do
        MIGRATION_PATH="$MIGRATIONS_DIR/$migration"
        if [ -f "$MIGRATION_PATH" ]; then
            echo -e "${YELLOW}[SQL] Executando: $migration${NC}"
            docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_PATH"
            echo -e "${GREEN}[OK] $migration executado${NC}"
        else
            echo -e "${YELLOW}[AVISO] Arquivo não encontrado: $migration${NC}"
        fi
    done
else
    echo -e "${GREEN}[OK] Tabelas já existem no banco${NC}"
    echo "$TABLES"
fi

# Verificar tabelas finais
echo -e "${YELLOW}[OnliOps] Tabelas no banco de dados:${NC}"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo -e "${GREEN}[OnliOps] Migrations executadas com sucesso!${NC}"
