#!/bin/bash

# Script de Verificação do Módulo de Inventário OnliOps
# Este script verifica se todas as tabelas, colunas e dados estão corretos

echo "🔍 Verificando Módulo de Inventário OnliOps..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações do banco
DB_NAME="calabasas_local"
DB_USER="postgres"

# Função para executar query e verificar resultado
check_query() {
    local description=$1
    local query=$2
    local expected=$3
    
    result=$(sudo -u postgres psql -d $DB_NAME -t -c "$query" 2>/dev/null | xargs)
    
    if [ "$result" == "$expected" ]; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description (Esperado: $expected, Obtido: $result)"
        return 1
    fi
}

# Função para verificar se coluna existe
check_column() {
    local table=$1
    local column=$2
    
    result=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='$table' AND column_name='$column';" 2>/dev/null | xargs)
    
    if [ "$result" == "1" ]; then
        echo -e "${GREEN}✓${NC} Coluna $table.$column existe"
        return 0
    else
        echo -e "${RED}✗${NC} Coluna $table.$column NÃO existe"
        return 1
    fi
}

# Verificar se tabela existe
check_table() {
    local table=$1
    
    result=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null | xargs)
    
    if [ "$result" == "1" ]; then
        echo -e "${GREEN}✓${NC} Tabela $table existe"
        return 0
    else
        echo -e "${RED}✗${NC} Tabela $table NÃO existe"
        return 1
    fi
}

echo "📊 Verificando Estrutura do Banco de Dados..."
echo ""

# Verificar tabelas
check_table "network_devices"
check_table "maintenance_logs"
echo ""

# Verificar colunas novas em network_devices
echo "🔧 Verificando novas colunas em network_devices..."
check_column "network_devices" "serial_number"
check_column "network_devices" "firmware_version"
check_column "network_devices" "admin_username"
check_column "network_devices" "admin_password_enc"
check_column "network_devices" "photo_url"
check_column "network_devices" "install_date"
check_column "network_devices" "last_maintenance_date"
check_column "network_devices" "notes"
check_column "network_devices" "patch_panel"
check_column "network_devices" "patch_panel_port"
check_column "network_devices" "switch_port"
check_column "network_devices" "connected_nvr_id"
check_column "network_devices" "custom_fields"
echo ""

# Verificar colunas da tabela maintenance_logs
echo "📝 Verificando colunas em maintenance_logs..."
check_column "maintenance_logs" "id"
check_column "maintenance_logs" "device_id"
check_column "maintenance_logs" "technician_name"
check_column "maintenance_logs" "description"
check_column "maintenance_logs" "service_date"
check_column "maintenance_logs" "attachments_url"
echo ""

# Verificar índices
echo "📑 Verificando índices..."
check_query "Índice idx_network_devices_serial" \
    "SELECT COUNT(*) FROM pg_indexes WHERE indexname='idx_network_devices_serial';" \
    "1"
check_query "Índice idx_network_devices_nvr" \
    "SELECT COUNT(*) FROM pg_indexes WHERE indexname='idx_network_devices_nvr';" \
    "1"
check_query "Índice idx_maintenance_logs_device" \
    "SELECT COUNT(*) FROM pg_indexes WHERE indexname='idx_maintenance_logs_device';" \
    "1"
echo ""

# Verificar dados de exemplo
echo "📦 Verificando dados de exemplo..."
device_count=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM network_devices WHERE serial_number LIKE '%-2024';" 2>/dev/null | xargs)
echo -e "${YELLOW}ℹ${NC} Dispositivos de exemplo encontrados: $device_count"

nvr_count=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM network_devices WHERE device_type IN ('nvr', 'dvr');" 2>/dev/null | xargs)
echo -e "${YELLOW}ℹ${NC} NVRs/DVRs cadastrados: $nvr_count"

camera_count=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM network_devices WHERE device_type='camera';" 2>/dev/null | xargs)
echo -e "${YELLOW}ℹ${NC} Câmeras cadastradas: $camera_count"

connected_cameras=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM network_devices WHERE device_type='camera' AND connected_nvr_id IS NOT NULL;" 2>/dev/null | xargs)
echo -e "${YELLOW}ℹ${NC} Câmeras conectadas a NVRs: $connected_cameras"

maintenance_count=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM maintenance_logs;" 2>/dev/null | xargs)
echo -e "${YELLOW}ℹ${NC} Registros de manutenção: $maintenance_count"
echo ""

# Verificar tipos de dispositivos permitidos
echo "🔍 Verificando tipos de dispositivos..."
allowed_types=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_constraint WHERE conname='network_devices_device_type_check' AND consrc LIKE '%patch_panel%';" 2>/dev/null | xargs)
if [ "$allowed_types" == "1" ]; then
    echo -e "${GREEN}✓${NC} Constraint de device_type atualizada com novos tipos"
else
    echo -e "${RED}✗${NC} Constraint de device_type NÃO atualizada"
fi
echo ""

# Verificar arquivos do frontend
echo "📁 Verificando arquivos do frontend..."
files=(
    "src/pages/Inventory.tsx"
    "src/components/inventory/InventoryTable.tsx"
    "src/components/inventory/InventoryForm.tsx"
    "src/components/inventory/DeviceDetailsSheet.tsx"
)

for file in "${files[@]}"; do
    if [ -f "/opt/calabasas/$file" ]; then
        echo -e "${GREEN}✓${NC} $file existe"
    else
        echo -e "${RED}✗${NC} $file NÃO existe"
    fi
done
echo ""

# Verificar documentação
echo "📚 Verificando documentação..."
docs=(
    "docs/GUIA_INVENTARIO.md"
    "CHANGELOG_INVENTARIO.md"
)

for doc in "${docs[@]}"; do
    if [ -f "/opt/calabasas/$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc existe"
    else
        echo -e "${RED}✗${NC} $doc NÃO existe"
    fi
done
echo ""

# Verificar se o servidor está rodando
echo "🚀 Verificando servidor de desenvolvimento..."
if pgrep -f "vite" > /dev/null; then
    echo -e "${GREEN}✓${NC} Servidor Vite está rodando"
    port=$(lsof -ti:5173 2>/dev/null)
    if [ ! -z "$port" ]; then
        echo -e "${GREEN}✓${NC} Porta 5173 está aberta"
    fi
else
    echo -e "${YELLOW}⚠${NC} Servidor Vite NÃO está rodando"
fi
echo ""

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Verificação Concluída!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Resumo:"
echo "  • Dispositivos cadastrados: $device_count"
echo "  • Câmeras: $camera_count (conectadas: $connected_cameras)"
echo "  • NVRs/DVRs: $nvr_count"
echo "  • Manutenções registradas: $maintenance_count"
echo ""
echo "🌐 Acesse: http://localhost:5173/"
echo "📖 Guia do usuário: docs/GUIA_INVENTARIO.md"
echo ""
