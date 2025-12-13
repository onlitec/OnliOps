#!/usr/bin/env bash
set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  CALABASAS - Health Check"
echo "========================================"

# Carregar variáveis
if [[ -f ".env" ]]; then
  source .env
else
  echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
  exit 1
fi

ERRORS=0

check_service() {
  local service=$1
  local name=$2
  
  echo -n "🔍 $name... "
  if systemctl is-active --quiet "$service"; then
    echo -e "${GREEN}✅ Rodando${NC}"
    return 0
  else
    echo -e "${RED}❌ PARADO${NC}"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

check_port() {
  local port=$1
  local name=$2
  
  echo -n "🔌 $name (porta $port)... "
  if ss -ltn | grep -q ":$port "; then
    echo -e "${GREEN}✅ Escutando${NC}"
    return 0
  else
    echo -e "${RED}❌ Não escutando${NC}"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

check_db_connection() {
  echo -n "🗄️  Conexão PostgreSQL... "
  if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conectado${NC}"
    return 0
  else
    echo -e "${RED}❌ Falha na conexão${NC}"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

check_http() {
  local url=$1
  local name=$2
  
  echo -n "🌐 $name... "
  local status_code=$(curl -k -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  
  if [[ "$status_code" =~ ^(200|301|302)$ ]]; then
    echo -e "${GREEN}✅ Respondendo ($status_code)${NC}"
    return 0
  else
    echo -e "${RED}❌ Não respondendo ($status_code)${NC}"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

check_file_exists() {
  local file=$1
  local name=$2
  
  echo -n "📁 $name... "
  if [[ -f "$file" ]]; then
    echo -e "${GREEN}✅ Existe${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  Não encontrado${NC}"
    return 1
  fi
}

check_dir_exists() {
  local dir=$1
  local name=$2
  
  echo -n "📂 $name... "
  if [[ -d "$dir" ]]; then
    local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo -e "${GREEN}✅ Existe ($size)${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  Não encontrado${NC}"
    return 1
  fi
}

echo ""
echo -e "${BLUE}═══ Verificando Serviços ═══${NC}"
check_service postgresql "PostgreSQL"
check_service nginx "Nginx"

echo ""
echo -e "${BLUE}═══ Verificando Portas ═══${NC}"
check_port 5432 "PostgreSQL"
check_port 80 "Nginx (HTTP)"
check_port 443 "Nginx (HTTPS)"

echo ""
echo -e "${BLUE}═══ Verificando Banco de Dados ═══${NC}"
check_db_connection

if [[ $ERRORS -eq 0 ]]; then
  echo ""
  echo -e "${BLUE}═══ Estatísticas do Banco ═══${NC}"
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "
    SELECT 
      'Usuários' as tipo,
      COUNT(*)::text as total
    FROM users
    UNION ALL
    SELECT 'VLANs', COUNT(*)::text FROM vlans
    UNION ALL
    SELECT 'Dispositivos', COUNT(*)::text FROM network_devices
    UNION ALL
    SELECT 'Simulações', COUNT(*)::text FROM simulations
    UNION ALL
    SELECT 'Alertas', COUNT(*)::text FROM alerts;
  " 2>/dev/null || echo -e "${YELLOW}⚠️  Não foi possível obter estatísticas${NC}"
fi

echo ""
echo -e "${BLUE}═══ Verificando Endpoints HTTP ═══${NC}"
check_http "http://$VITE_LOCAL_IP" "HTTP (deve redirecionar)"
check_http "https://$VITE_LOCAL_IP" "HTTPS"

echo ""
echo -e "${BLUE}═══ Verificando Arquivos do Projeto ═══${NC}"
check_dir_exists "node_modules" "Dependências Node.js"
check_dir_exists "dist" "Build de produção"
check_file_exists ".env" "Variáveis de ambiente"
check_file_exists "package.json" "package.json"

echo ""
echo -e "${BLUE}═══ Informações do Sistema ═══${NC}"
echo "💻 OS: $(lsb_release -d | cut -f2)"
echo "🐳 Node: $(node --version)"
echo "📦 npm: $(npm --version)"
echo "🐘 PostgreSQL: $(psql --version | cut -d' ' -f3)"
echo "🌐 Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"

echo ""
echo "========================================"
if [[ $ERRORS -eq 0 ]]; then
  echo -e "${GREEN}✅ Todos os checks passaram!${NC}"
  echo -e "${GREEN}   Sistema funcionando corretamente${NC}"
  echo ""
  echo -e "${BLUE}🚀 Acesse a aplicação:${NC}"
  echo -e "   ${YELLOW}https://$VITE_LOCAL_IP${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS problema(s) encontrado(s)${NC}"
  echo -e "${YELLOW}   Verifique os itens marcados acima${NC}"
  exit 1
fi
