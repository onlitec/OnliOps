#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  ONLIOPS - Setup Desenvolvimento Local"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se está rodando no diretório correto
if [[ ! -f "package.json" ]]; then
  echo -e "${RED}❌ Execute este script da raiz do projeto (/opt/onliops)${NC}"
  exit 1
fi

# Verificar se .env existe
if [[ ! -f ".env" ]]; then
  echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Criando template...${NC}"
  cat > .env << 'EOF'
# Database Configuration (PostgreSQL Local)
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=onliops_admin
PGPASSWORD=OnliOps@2025!
PGDATABASE=onliops_local

# Database URL
DATABASE_URL=postgresql://onliops_admin:OnliOps@2025!@127.0.0.1:5432/onliops_local

# Supabase Configuration (Local Development)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=local-dev-key-not-required

# Application Configuration
NODE_ENV=development
VITE_APP_URL=https://172.20.120.28
VITE_API_URL=https://172.20.120.28/api
VITE_LOCAL_IP=172.20.120.28
VITE_LOCAL_PORT=443

# Feature Flags
VITE_ENABLE_SIMULATION_MODULE=true
VITE_ENABLE_NETWORK_MODULE=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_3D_VISUALIZATION=false

# Performance
VITE_POLLING_INTERVAL=30000
VITE_REQUEST_TIMEOUT=10000
EOF
  echo -e "${GREEN}✅ Arquivo .env criado. Por favor, revise as configurações.${NC}"
fi

# Carregar variáveis
source .env

echo -e "${BLUE}📦 Fase 1: Instalando dependências Node.js...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}   Node.js não encontrado. Instalando Node.js 20.x...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  
  # Verificar instalação
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Falha ao instalar Node.js. Instale manualmente!${NC}"
    echo "Execute: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
  fi
  echo -e "${GREEN}   ✅ Node.js instalado com sucesso${NC}"
fi

echo "   Node.js version: $(node --version)"
echo "   npm version: $(npm --version)"

if [[ ! -d "node_modules" ]]; then
  echo "   Instalando dependências (pode demorar)..."
  npm install --legacy-peer-deps
else
  echo "   ✅ Dependências já instaladas"
fi

echo ""
echo -e "${BLUE}🗄️  Fase 2: Configurando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}   PostgreSQL não encontrado. Instalando...${NC}"
  sudo apt-get update -y
  sudo apt-get install -y postgresql postgresql-contrib
fi

# Verificar se PostgreSQL está rodando
if ! sudo systemctl is-active --quiet postgresql; then
  echo "   Iniciando PostgreSQL..."
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
fi

echo "   Executando setup do banco de dados..."
bash scripts/setup-postgres.sh \
  --db-name "$PGDATABASE" \
  --db-user "$PGUSER" \
  --db-pass "$PGPASSWORD"

echo ""
echo -e "${BLUE}📊 Fase 3: Aplicando migrações...${NC}"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

if bash scripts/apply-migrations.sh; then
  echo -e "${GREEN}   ✅ Migrações aplicadas com sucesso${NC}"
else
  echo -e "${YELLOW}   ⚠️  Algumas migrações podem ter falhado (verificar logs)${NC}"
fi

echo ""
echo -e "${BLUE}👤 Fase 4: Criando usuário administrador...${NC}"
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" <<-EOSQL
INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@onliops.local',
  'Administrador',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

SELECT id, email, name, role FROM public.users WHERE email = 'admin@onliops.local';
EOSQL

echo ""
echo -e "${BLUE}📊 Fase 5: Inserindo dados de exemplo...${NC}"
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" <<-EOSQL
-- VLANs
INSERT INTO public.vlans (vlan_id, name, subnet, gateway, description) VALUES
(10, 'Management', '172.20.120.0/24', '172.20.120.1', 'Rede de gerenciamento'),
(20, 'CFTV', '172.20.121.0/24', '172.20.121.1', 'Rede de câmeras'),
(30, 'Access Control', '172.20.122.0/24', '172.20.122.1', 'Controle de acesso'),
(40, 'VoIP', '172.20.123.0/24', '172.20.123.1', 'Telefonia IP'),
(50, 'Guests', '172.20.124.0/24', '172.20.124.1', 'Rede de convidados')
ON CONFLICT (vlan_id) DO NOTHING;

-- Dispositivos
INSERT INTO public.network_devices (vlan_id, device_type, model, manufacturer, ip_address, hostname, location, status)
VALUES
(10, 'switch', 'SG350-28P', 'Cisco', '172.20.120.10', 'SW-CORE-01', 'Rack Principal', 'active'),
(20, 'nvr', 'NVR-16CH', 'Hikvision', '172.20.121.10', 'NVR-01', 'Sala de Segurança', 'active'),
(20, 'camera', 'DS-2CD2143G0-I', 'Hikvision', '172.20.121.101', 'CAM-PORTARIA', 'Portaria Principal', 'active'),
(30, 'controller', 'AC-5000L', 'Linear', '172.20.122.10', 'CTL-ACCESS-01', 'Sala de TI', 'active')
ON CONFLICT (ip_address) DO NOTHING;

SELECT 
  (SELECT COUNT(*) FROM vlans) as vlans,
  (SELECT COUNT(*) FROM network_devices) as devices,
  (SELECT COUNT(*) FROM users) as users;
EOSQL

echo ""
echo -e "${BLUE}🔨 Fase 6: Compilando aplicação...${NC}"
echo "   Limpando build anterior..."
rm -rf dist/

echo "   Executando build (pode demorar)..."
if npm run build; then
  echo -e "${GREEN}   ✅ Build concluído com sucesso${NC}"
  echo "   Tamanho do build: $(du -sh dist/ | cut -f1)"
else
  echo -e "${RED}   ❌ Build falhou${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}🌐 Fase 7: Configurando Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
  echo -e "${YELLOW}   Nginx não encontrado. Instalando...${NC}"
  sudo apt-get update -y
  sudo apt-get install -y nginx
fi

echo "   Configurando Nginx para $VITE_LOCAL_IP..."
sudo bash scripts/setup-nginx.sh \
  --server-name "$VITE_LOCAL_IP" \
  --site-root "$(pwd)/dist"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup completo!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Informações do Sistema:${NC}"
echo "   • Banco de dados: $PGDATABASE @ $PGHOST:$PGPORT"
echo "   • Usuário admin: admin@onliops.local"
echo "   • URL Produção: https://$VITE_LOCAL_IP"
echo "   • URL Desenvolvimento: http://localhost:5173"
echo ""
echo -e "${BLUE}🚀 Próximos passos:${NC}"
echo "   1. Acesse: ${YELLOW}https://$VITE_LOCAL_IP${NC}"
echo "   2. Aceite o certificado SSL autoassinado"
echo "   3. Faça login com: ${YELLOW}admin@onliops.local${NC}"
echo ""
echo "   ${BLUE}Para desenvolvimento com hot reload:${NC}"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "   ${BLUE}Para verificar saúde do sistema:${NC}"
echo "   ${YELLOW}bash scripts/health-check-local.sh${NC}"
echo ""
