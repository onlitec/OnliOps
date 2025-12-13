#!/usr/bin/env bash
set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🧪 Testando Integração Frontend ↔ Backend ↔ Database"
echo ""

# Carregar variáveis
if [[ ! -f ".env" ]]; then
  echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
  exit 1
fi

source .env

PASSED=0
FAILED=0

run_test() {
  local test_name=$1
  local test_command=$2
  
  echo -n "🔍 $test_name... "
  
  if eval "$test_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Passou${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ Falhou${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo -e "${BLUE}═══ Teste 1: Conectividade PostgreSQL ═══${NC}"
run_test "Conexão com banco de dados" \
  "PGPASSWORD='$PGPASSWORD' psql -h '$PGHOST' -U '$PGUSER' -d '$PGDATABASE' -c 'SELECT 1'"

run_test "Tabela users existe" \
  "PGPASSWORD='$PGPASSWORD' psql -h '$PGHOST' -U '$PGUSER' -d '$PGDATABASE' -c 'SELECT COUNT(*) FROM users'"

run_test "Tabela vlans existe" \
  "PGPASSWORD='$PGPASSWORD' psql -h '$PGHOST' -U '$PGUSER' -d '$PGDATABASE' -c 'SELECT COUNT(*) FROM vlans'"

run_test "Tabela network_devices existe" \
  "PGPASSWORD='$PGPASSWORD' psql -h '$PGHOST' -U '$PGUSER' -d '$PGDATABASE' -c 'SELECT COUNT(*) FROM network_devices'"

run_test "Tabela simulations existe" \
  "PGPASSWORD='$PGPASSWORD' psql -h '$PGHOST' -U '$PGUSER' -d '$PGDATABASE' -c 'SELECT COUNT(*) FROM simulations'"

echo ""
echo -e "${BLUE}═══ Teste 2: Servidor Web (Nginx) ═══${NC}"
run_test "Nginx está rodando" \
  "systemctl is-active --quiet nginx"

run_test "Porta 80 (HTTP) escutando" \
  "ss -ltn | grep -q ':80 '"

run_test "Porta 443 (HTTPS) escutando" \
  "ss -ltn | grep -q ':443 '"

run_test "HTTP redireciona para HTTPS" \
  "curl -s -o /dev/null -w '%{http_code}' http://$VITE_LOCAL_IP | grep -q '301\|302'"

run_test "HTTPS responde" \
  "curl -k -s -o /dev/null -w '%{http_code}' https://$VITE_LOCAL_IP | grep -q '200'"

echo ""
echo -e "${BLUE}═══ Teste 3: Arquivos do Build ═══${NC}"
run_test "Diretório dist/ existe" \
  "test -d dist"

run_test "index.html existe" \
  "test -f dist/index.html"

run_test "Assets JS existem" \
  "test -n \"\$(find dist/assets -name '*.js' 2>/dev/null)\""

run_test "Assets CSS existem" \
  "test -n \"\$(find dist/assets -name '*.css' 2>/dev/null)\""

echo ""
echo -e "${BLUE}═══ Teste 4: Configuração da Aplicação ═══${NC}"
run_test "Arquivo .env existe" \
  "test -f .env"

run_test "node_modules instalado" \
  "test -d node_modules"

run_test "package.json válido" \
  "node -e \"require('./package.json')\""

echo ""
echo -e "${BLUE}═══ Teste 5: Consultas ao Banco ═══${NC}"

# Teste de query simples
echo -n "🔍 Query SELECT básica... "
if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
  -c "SELECT id, email, role FROM users LIMIT 1" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Passou${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ Falhou${NC}"
  FAILED=$((FAILED + 1))
fi

# Teste de JOIN
echo -n "🔍 Query com JOIN... "
if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
  -c "SELECT d.hostname, v.name FROM network_devices d JOIN vlans v ON d.vlan_id = v.vlan_id LIMIT 1" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Passou${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ Falhou${NC}"
  FAILED=$((FAILED + 1))
fi

# Teste de INSERT
echo -n "🔍 INSERT e DELETE... "
if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" <<-EOSQL > /dev/null 2>&1
  BEGIN;
  INSERT INTO alerts (alert_type, severity, title, description) 
  VALUES ('test', 'info', 'Teste de Integração', 'Este é um alerta de teste');
  DELETE FROM alerts WHERE title = 'Teste de Integração';
  COMMIT;
EOSQL
then
  echo -e "${GREEN}✅ Passou${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ Falhou${NC}"
  FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${BLUE}═══ Teste 6: Serviço de Autenticação ═══${NC}"

# Verificar se tabela login_events existe
echo -n "🔍 Tabela login_events... "
if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
  -c "SELECT COUNT(*) FROM login_events" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Existe${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Não existe (opcional)${NC}"
fi

# Verificar função auth.uid()
echo -n "🔍 Função auth.uid()... "
if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
  -c "SELECT auth.uid()" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Existe${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Não existe (pode causar problemas com RLS)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Resultado dos Testes:${NC}"
echo -e "   ${GREEN}✅ Passou: $PASSED${NC}"
echo -e "   ${RED}❌ Falhou: $FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $FAILED -eq 0 ]]; then
  echo ""
  echo -e "${GREEN}🎉 Todos os testes de integração passaram!${NC}"
  echo -e "${GREEN}   Sistema pronto para desenvolvimento${NC}"
  echo ""
  echo -e "${BLUE}📌 Próximos passos:${NC}"
  echo "   1. Inicie o servidor: ${YELLOW}npm run dev${NC}"
  echo "   2. Acesse: ${YELLOW}https://$VITE_LOCAL_IP${NC}"
  echo "   3. Verifique logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}⚠️  Alguns testes falharam!${NC}"
  echo -e "${YELLOW}   Verifique os itens marcados acima${NC}"
  echo ""
  echo -e "${BLUE}💡 Dicas de troubleshooting:${NC}"
  echo "   • Verifique se PostgreSQL está rodando: ${YELLOW}sudo systemctl status postgresql${NC}"
  echo "   • Verifique se Nginx está rodando: ${YELLOW}sudo systemctl status nginx${NC}"
  echo "   • Verifique logs do PostgreSQL: ${YELLOW}sudo tail -50 /var/log/postgresql/postgresql-*-main.log${NC}"
  echo "   • Execute health check: ${YELLOW}bash scripts/health-check-local.sh${NC}"
  exit 1
fi
