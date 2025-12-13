# 🚀 Plano de Migração - Calabasas para Ambiente Local Ubuntu 22.04

## 📌 Objetivo
Configurar e executar a plataforma Calabasas localmente no Ubuntu 22.04 (IP: 172.20.120.28) para desenvolvimento e testes antes do deploy final no Vercel.

---

## 📊 Status Atual vs. Status Desejado

| Aspecto | Status Atual | Status Desejado |
|---------|--------------|-----------------|
| **Hosting** | Vercel (com erros) | Local Ubuntu 22.04 |
| **Database** | Supabase Cloud | PostgreSQL Local |
| **Auth** | Supabase Auth | PostgreSQL Local + Auth personalizado |
| **Web Server** | Vercel Edge | Nginx (172.20.120.28) |
| **Build** | Vercel CI/CD | Build local manual |
| **Ambiente** | Produção | Desenvolvimento |

---

## 🎯 FASE 1: PRÉ-REQUISITOS E INSTALAÇÃO (30-45 minutos)

### 1.1 Verificar Requisitos do Sistema

```bash
# Executar no terminal
cd /opt/calabasas

# Verificar versão do Ubuntu
lsb_release -a  # Deve ser 22.04

# Verificar espaço em disco (mínimo 10GB recomendado)
df -h /opt

# Verificar memória RAM (mínimo 4GB recomendado)
free -h

# Verificar IP local
ip addr show | grep 172.20.120.28
```

**✅ Checklist:**
- [ ] Ubuntu 22.04 confirmado
- [ ] Espaço em disco > 10GB
- [ ] RAM > 4GB
- [ ] IP 172.20.120.28 configurado

---

### 1.2 Instalar Dependências do Sistema

```bash
# Atualizar repositórios
sudo apt-get update

# Instalar Node.js 20.x (versão exigida pelo projeto)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # Deve ser v20.x.x
npm --version   # Deve ser >= 10.8.1

# Instalar build essentials
sudo apt-get install -y build-essential git curl wget

# Instalar PostgreSQL 14/15
sudo apt-get install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt-get install -y nginx

# Instalar openssl (para certificados SSL)
sudo apt-get install -y openssl
```

**✅ Checklist:**
- [ ] Node.js 20.x instalado
- [ ] npm >= 10.8.1 instalado
- [ ] PostgreSQL instalado
- [ ] Nginx instalado
- [ ] OpenSSL instalado

---

## 🗄️ FASE 2: CONFIGURAÇÃO DO POSTGRESQL (20-30 minutos)

### 2.1 Configuração Inicial do Banco de Dados

```bash
# Executar script de setup adaptado
cd /opt/calabasas

# Definir variáveis de ambiente
export PGPASSWORD="Calabasas@2025!"

# Executar setup do PostgreSQL
bash scripts/setup-postgres.sh \
  --db-name calabasas_local \
  --db-user calabasas_admin \
  --db-pass "$PGPASSWORD"
```

**O script irá:**
1. ✅ Criar usuário `calabasas_admin`
2. ✅ Criar banco `calabasas_local`
3. ✅ Habilitar extensão `uuid-ossp`
4. ✅ Configurar autenticação scram-sha-256
5. ✅ Reiniciar PostgreSQL

---

### 2.2 Configurar Acesso Remoto (Opcional, se necessário acessar de outra máquina)

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/$(psql -V | awk '{print $3}' | cut -d. -f1)/main/postgresql.conf

# Adicionar/modificar linha:
listen_addresses = '172.20.120.28,localhost'

# Editar pg_hba.conf
sudo nano /etc/postgresql/$(psql -V | awk '{print $3}' | cut -d. -f1)/main/pg_hba.conf

# Adicionar linha (para acesso da rede local):
host    calabasas_local    calabasas_admin    172.20.120.0/24    scram-sha-256

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

---

### 2.3 Aplicar Migrações do Banco de Dados

```bash
# Definir variáveis de ambiente para migrações
export PGHOST=127.0.0.1
export PGPORT=5432
export PGUSER=calabasas_admin
export PGPASSWORD="Calabasas@2025!"
export PGDATABASE=calabasas_local

# Aplicar migrações
bash scripts/apply-migrations.sh
```

**Migrações que serão aplicadas (15 arquivos):**
1. `0000_local_supabase_compat.sql` - Compatibilidade Supabase
2. `0001_init_public_tables.sql` - Tabelas públicas
3. `0002_rls_policies.sql` - Políticas RLS
4. `001_initial_schema.sql` - Schema inicial
5. `002_rls_policies.sql` - Mais políticas
6. `003_sample_data.sql` - Dados de exemplo
7. `003_simulation_system_schema.sql` - Schema de simulação
8. `004_simulation_rls_policies.sql` - RLS simulação
9. `005_simulation_sample_data.sql` - Dados simulação
10. `006_auth_provider_logging.sql` - Logging auth
11. `007_performance_indexes.sql` - Índices
12. `008_frontend_metrics.sql` - Métricas frontend
13. `009_users_test_flag.sql` - Flag de teste
14. `010-015` - Ajustes de políticas RLS

---

### 2.4 Verificar Estrutura do Banco

```bash
# Conectar ao banco
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local

# Executar queries de verificação:
\dt public.*              -- Listar tabelas
\df auth.*                -- Listar funções auth
SELECT COUNT(*) FROM users;           -- Verificar usuários
SELECT COUNT(*) FROM vlans;           -- Verificar VLANs
SELECT COUNT(*) FROM network_devices; -- Verificar dispositivos
SELECT COUNT(*) FROM simulations;     -- Verificar simulações

# Sair
\q
```

**✅ Checklist:**
- [ ] Banco criado e acessível
- [ ] 15 migrações aplicadas sem erro
- [ ] Tabelas criadas (users, vlans, devices, simulations, etc.)
- [ ] Extensões habilitadas (uuid-ossp, pgcrypto)

---

## 🌐 FASE 3: CONFIGURAÇÃO DO NGINX (15-20 minutos)

### 3.1 Configurar Nginx para IP Local

```bash
# Executar script de setup do Nginx
cd /opt/calabasas

# Primeiro, fazer o build da aplicação
npm install --legacy-peer-deps
npm run build

# Verificar se dist/ foi criado
ls -lh dist/

# Configurar Nginx
sudo bash scripts/setup-nginx.sh \
  --server-name 172.20.120.28 \
  --site-root /opt/calabasas/dist
```

**O script irá:**
1. ✅ Instalar Nginx
2. ✅ Gerar certificado SSL autoassinado
3. ✅ Criar configuração em `/etc/nginx/sites-available/network_platform.conf`
4. ✅ Habilitar site em `sites-enabled`
5. ✅ Testar configuração (`nginx -t`)
6. ✅ Reiniciar Nginx

---

### 3.2 Configuração Nginx Personalizada (Já aplicada pelo script)

O arquivo `/etc/nginx/sites-available/network_platform.conf` terá:

```nginx
server {
  listen 80;
  server_name 172.20.120.28;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name 172.20.120.28;

  ssl_certificate     /etc/ssl/local/172.20.120.28.crt;
  ssl_certificate_key /etc/ssl/local/172.20.120.28.key;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  root /opt/calabasas/dist;
  index index.html;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

### 3.3 Verificar Status do Nginx

```bash
# Verificar status
sudo systemctl status nginx

# Testar configuração
sudo nginx -t

# Ver logs em tempo real
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Testar acesso HTTP (deve redirecionar para HTTPS)
curl -I http://172.20.120.28

# Testar acesso HTTPS (ignorar certificado autoassinado)
curl -k -I https://172.20.120.28
```

**✅ Checklist:**
- [ ] Nginx rodando sem erros
- [ ] Certificado SSL gerado
- [ ] HTTP redireciona para HTTPS
- [ ] HTTPS respondendo (mesmo com certificado inválido)
- [ ] Arquivos estáticos sendo servidos

---

## 🔧 FASE 4: CONFIGURAÇÃO DAS VARIÁVEIS DE AMBIENTE (10-15 minutos)

### 4.1 Criar Arquivo .env Local

```bash
cd /opt/calabasas

# Criar arquivo .env na raiz do projeto
cat > .env << 'EOF'
# ===========================================
# CALABASAS LOCAL DEVELOPMENT ENVIRONMENT
# ===========================================

# Database Configuration (PostgreSQL Local)
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=calabasas_admin
PGPASSWORD=Calabasas@2025!
PGDATABASE=calabasas_local

# Database URL (formato connection string)
DATABASE_URL=postgresql://calabasas_admin:Calabasas@2025!@127.0.0.1:5432/calabasas_local

# Supabase Configuration (Desabilitado - usando PostgreSQL local)
# IMPORTANTE: Como não temos Supabase Cloud, o sistema usará fallback local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=local-dev-key-not-required

# Application Configuration
NODE_ENV=development
VITE_APP_URL=https://172.20.120.28
VITE_API_URL=https://172.20.120.28/api

# Security
VITE_ENABLE_AUTH_LOGGING=true
VITE_ENABLE_MOCK_AUTH=false

# Network Configuration
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
VITE_ENABLE_SERVICE_WORKER=false
EOF

# Dar permissões adequadas
chmod 600 .env

# Verificar conteúdo
cat .env
```

---

### 4.2 Configurar Variáveis de Ambiente para Build

```bash
# Copiar .env para .env.local (Vite usa .env.local em dev)
cp .env .env.local

# Exportar variáveis para sessão atual
export $(cat .env | grep -v '^#' | xargs)

# Verificar variáveis carregadas
echo "PGDATABASE: $PGDATABASE"
echo "VITE_APP_URL: $VITE_APP_URL"
```

**✅ Checklist:**
- [ ] Arquivo `.env` criado
- [ ] Arquivo `.env.local` criado
- [ ] Variáveis de banco configuradas
- [ ] URLs locais configuradas
- [ ] Feature flags definidos

---

## 🔨 FASE 5: ADAPTAÇÃO DOS SCRIPTS (20-30 minutos)

### 5.1 Criar Script de Setup Completo

Criar arquivo `scripts/setup-local-dev.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  CALABASAS - Setup Desenvolvimento Local"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando no diretório correto
if [[ ! -f "package.json" ]]; then
  echo -e "${RED}❌ Execute este script da raiz do projeto (/opt/calabasas)${NC}"
  exit 1
fi

# Verificar se .env existe
if [[ ! -f ".env" ]]; then
  echo -e "${RED}❌ Arquivo .env não encontrado. Crie primeiro!${NC}"
  exit 1
fi

# Carregar variáveis
source .env

echo -e "${YELLOW}📦 Instalando dependências Node.js...${NC}"
npm install --legacy-peer-deps

echo -e "${YELLOW}🗄️  Configurando PostgreSQL...${NC}"
bash scripts/setup-postgres.sh \
  --db-name "$PGDATABASE" \
  --db-user "$PGUSER" \
  --db-pass "$PGPASSWORD"

echo -e "${YELLOW}📊 Aplicando migrações...${NC}"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
bash scripts/apply-migrations.sh

echo -e "${YELLOW}🔨 Compilando aplicação...${NC}"
npm run build

echo -e "${YELLOW}🌐 Configurando Nginx...${NC}"
sudo bash scripts/setup-nginx.sh \
  --server-name "$VITE_LOCAL_IP" \
  --site-root "$(pwd)/dist"

echo -e "${GREEN}✅ Setup completo!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Acesse: https://$VITE_LOCAL_IP"
echo "  2. Aceite o certificado SSL autoassinado"
echo "  3. Para desenvolvimento com hot reload: npm run dev"
echo ""
```

Tornar executável:
```bash
chmod +x scripts/setup-local-dev.sh
```

---

### 5.2 Criar Script de Desenvolvimento com Hot Reload

Criar arquivo `scripts/dev-local.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Carregar variáveis
if [[ -f ".env" ]]; then
  source .env
fi

echo "🚀 Iniciando servidor de desenvolvimento..."
echo "   URL: http://localhost:5173"
echo "   Nginx: https://$VITE_LOCAL_IP"
echo ""
echo "Pressione Ctrl+C para parar"

# Iniciar Vite dev server
npm run dev -- --host 0.0.0.0 --port 5173
```

Tornar executável:
```bash
chmod +x scripts/dev-local.sh
```

---

### 5.3 Criar Script de Verificação de Saúde

Criar arquivo `scripts/health-check-local.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  CALABASAS - Health Check"
echo "========================================"

# Carregar variáveis
if [[ -f ".env" ]]; then
  source .env
fi

check_service() {
  local service=$1
  local name=$2
  
  if systemctl is-active --quiet "$service"; then
    echo -e "${GREEN}✅ $name está rodando${NC}"
    return 0
  else
    echo -e "${RED}❌ $name NÃO está rodando${NC}"
    return 1
  fi
}

check_port() {
  local port=$1
  local name=$2
  
  if ss -ltn | grep -q ":$port "; then
    echo -e "${GREEN}✅ $name escutando na porta $port${NC}"
    return 0
  else
    echo -e "${RED}❌ $name NÃO está escutando na porta $port${NC}"
    return 1
  fi
}

check_db_connection() {
  if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexão com PostgreSQL OK${NC}"
    return 0
  else
    echo -e "${RED}❌ Falha na conexão com PostgreSQL${NC}"
    return 1
  fi
}

check_http() {
  local url=$1
  local name=$2
  
  if curl -k -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ $name respondendo${NC}"
    return 0
  else
    echo -e "${RED}❌ $name NÃO está respondendo${NC}"
    return 1
  fi
}

echo ""
echo "🔍 Verificando serviços..."
check_service postgresql "PostgreSQL"
check_service nginx "Nginx"

echo ""
echo "🔌 Verificando portas..."
check_port 5432 "PostgreSQL"
check_port 80 "Nginx (HTTP)"
check_port 443 "Nginx (HTTPS)"

echo ""
echo "🗄️  Verificando banco de dados..."
check_db_connection

echo ""
echo "🌐 Verificando endpoints HTTP..."
check_http "http://$VITE_LOCAL_IP" "HTTP"
check_http "https://$VITE_LOCAL_IP" "HTTPS"

echo ""
echo "📊 Informações do banco:"
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM vlans) as total_vlans,
  (SELECT COUNT(*) FROM network_devices) as total_devices,
  (SELECT COUNT(*) FROM simulations) as total_simulations;
"

echo ""
echo "========================================"
```

Tornar executável:
```bash
chmod +x scripts/health-check-local.sh
```

---

## 🧪 FASE 6: TESTES DE CONECTIVIDADE (30-45 minutos)

### 6.1 Teste 1: Verificação do PostgreSQL

```bash
# Executar health check
bash scripts/health-check-local.sh

# Teste manual de conexão
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local

# Dentro do psql, executar:
\conninfo                          -- Info da conexão
\dt public.*                       -- Listar tabelas
SELECT version();                  -- Versão do PostgreSQL
SELECT COUNT(*) FROM users;        -- Contar usuários
\q
```

**Resultados Esperados:**
- ✅ Conexão estabelecida
- ✅ Tabelas criadas (>= 20 tabelas)
- ✅ Dados de exemplo presentes

---

### 6.2 Teste 2: Verificação do Nginx

```bash
# Testar configuração
sudo nginx -t

# Status do serviço
sudo systemctl status nginx

# Testar HTTP redirect
curl -I http://172.20.120.28

# Testar HTTPS (aceitar certificado autoassinado)
curl -k -I https://172.20.120.28

# Testar arquivo específico
curl -k https://172.20.120.28/index.html | head -20

# Verificar logs
sudo tail -20 /var/log/nginx/access.log
sudo tail -20 /var/log/nginx/error.log
```

**Resultados Esperados:**
- ✅ HTTP redireciona para HTTPS (301)
- ✅ HTTPS retorna 200 OK
- ✅ index.html servido corretamente
- ✅ Sem erros nos logs

---

### 6.3 Teste 3: Build da Aplicação

```bash
# Limpar build anterior
rm -rf dist/

# Executar build
npm run build

# Verificar saída
ls -lh dist/
du -sh dist/

# Verificar estrutura
tree dist/ -L 2
```

**Resultados Esperados:**
- ✅ Build completo sem erros
- ✅ Pasta `dist/` criada
- ✅ Tamanho razoável (< 5MB típico)
- ✅ Arquivos HTML, JS, CSS presentes

---

### 6.4 Teste 4: Desenvolvimento com Hot Reload

```bash
# Terminal 1: Iniciar dev server
npm run dev -- --host 0.0.0.0 --port 5173

# Terminal 2: Testar acesso
curl http://localhost:5173

# No navegador:
# Abrir: http://localhost:5173
# Fazer alteração em src/App.tsx
# Verificar hot reload
```

**Resultados Esperados:**
- ✅ Servidor iniciado na porta 5173
- ✅ Hot reload funcionando
- ✅ Sem erros de compilação

---

### 6.5 Teste 5: Integração Frontend ↔ Backend

Criar arquivo de teste `scripts/test-integration.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

source .env

echo "🧪 Testando integração Frontend ↔ Backend ↔ Database"

# Teste 1: Database acessível
echo "1️⃣ Testando conexão com PostgreSQL..."
if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" > /dev/null 2>&1; then
  echo "   ✅ PostgreSQL acessível"
else
  echo "   ❌ PostgreSQL inacessível"
  exit 1
fi

# Teste 2: Nginx servindo arquivos
echo "2️⃣ Testando Nginx..."
if curl -k -s https://$VITE_LOCAL_IP | grep -q "root"; then
  echo "   ✅ Nginx servindo HTML"
else
  echo "   ❌ Nginx não está servindo corretamente"
  exit 1
fi

# Teste 3: Verificar se variáveis estão no build
echo "3️⃣ Verificando variáveis de ambiente no build..."
if grep -r "VITE_SUPABASE_URL" dist/assets/*.js 2>/dev/null; then
  echo "   ⚠️  Variáveis VITE_ encontradas no build (normal)"
else
  echo "   ℹ️  Variáveis não encontradas (podem estar ofuscadas)"
fi

# Teste 4: Endpoints da API (se existir backend)
echo "4️⃣ Testando endpoints..."
# Como não temos backend Node separado, pulamos
echo "   ℹ️  Backend integrado ao frontend (BaaS Supabase simulado)"

echo ""
echo "✅ Testes de integração concluídos!"
```

Tornar executável e executar:
```bash
chmod +x scripts/test-integration.sh
bash scripts/test-integration.sh
```

---

## 🎯 FASE 7: SEED DE DADOS E USUÁRIO ADMIN (15-20 minutos)

### 7.1 Criar Usuário Administrador

```bash
# Executar script de seed
cd /opt/calabasas

# Verificar se o script existe
cat scripts/seed-admin.ts

# Se necessário instalar ts-node
npm install -g ts-node typescript

# Executar seed (precisa adaptar para PostgreSQL local)
# Como o script usa Supabase, vamos criar manualmente

# Conectar ao banco
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local

-- Criar usuário admin (substituir 'seu-uuid-aqui' por UUID válido)
INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@calabasas.local',
  'Administrador',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verificar criação
SELECT id, email, name, role FROM public.users WHERE email = 'admin@calabasas.local';

-- Sair
\q
```

---

### 7.2 Criar Dados de Exemplo para Rede

```sql
-- Conectar ao banco
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local

-- Inserir VLANs de exemplo
INSERT INTO public.vlans (vlan_id, name, subnet, gateway, description) VALUES
(10, 'Management', '172.20.120.0/24', '172.20.120.1', 'Rede de gerenciamento'),
(20, 'CFTV', '172.20.121.0/24', '172.20.121.1', 'Rede de câmeras'),
(30, 'Access Control', '172.20.122.0/24', '172.20.122.1', 'Controle de acesso'),
(40, 'VoIP', '172.20.123.0/24', '172.20.123.1', 'Telefonia IP'),
(50, 'Guests', '172.20.124.0/24', '172.20.124.1', 'Rede de convidados')
ON CONFLICT (vlan_id) DO NOTHING;

-- Inserir dispositivos de exemplo
INSERT INTO public.network_devices (vlan_id, device_type, model, manufacturer, ip_address, hostname, location, status)
VALUES
(10, 'switch', 'SG350-28P', 'Cisco', '172.20.120.10', 'SW-CORE-01', 'Rack Principal', 'active'),
(20, 'nvr', 'NVR-16CH', 'Hikvision', '172.20.121.10', 'NVR-01', 'Sala de Segurança', 'active'),
(20, 'camera', 'DS-2CD2143G0-I', 'Hikvision', '172.20.121.101', 'CAM-PORTARIA', 'Portaria Principal', 'active'),
(30, 'controller', 'AC-5000L', 'Linear', '172.20.122.10', 'CTL-ACCESS-01', 'Sala de TI', 'active')
ON CONFLICT (ip_address) DO NOTHING;

-- Verificar dados
SELECT COUNT(*) FROM vlans;
SELECT COUNT(*) FROM network_devices;

\q
```

---

## 🚦 FASE 8: EXECUÇÃO E VALIDAÇÃO FINAL (20-30 minutos)

### 8.1 Executar Setup Completo

```bash
cd /opt/calabasas

# Executar script de setup completo
bash scripts/setup-local-dev.sh

# Aguardar conclusão (pode levar 10-15 minutos)
```

---

### 8.2 Iniciar Aplicação

**Opção 1: Produção (Nginx)**
```bash
# Build já foi feito no setup
# Acessar: https://172.20.120.28

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/access.log
```

**Opção 2: Desenvolvimento (Hot Reload)**
```bash
# Terminal 1: Servidor de desenvolvimento
npm run dev -- --host 0.0.0.0 --port 5173

# Acessar: http://localhost:5173 ou http://172.20.120.28:5173
```

---

### 8.3 Validação Completa

```bash
# Executar health check
bash scripts/health-check-local.sh

# Testar integração
bash scripts/test-integration.sh

# Verificar serviços
sudo systemctl status postgresql
sudo systemctl status nginx
```

---

### 8.4 Testes no Navegador

1. **Acessar a aplicação:**
   ```
   https://172.20.120.28
   ```

2. **Aceitar certificado SSL autoassinado:**
   - Chrome: Clicar em "Avançado" → "Continuar para 172.20.120.28"
   - Firefox: "Avançado" → "Aceitar o risco e continuar"

3. **Testar funcionalidades:**
   - [ ] Página de login carrega
   - [ ] Tentar login (deve mostrar erro se Supabase não estiver configurado)
   - [ ] Verificar console do navegador (F12)
   - [ ] Verificar Network tab (requisições)

4. **Verificar console do navegador:**
   ```javascript
   // Deve mostrar algo como:
   // "Supabase não configurado. Defina VITE_SUPABASE_URL..."
   ```

---

## 📋 FASE 9: RESOLUÇÃO DE PROBLEMAS CONHECIDOS

### 9.1 Problema: Supabase Não Configurado

**Sintoma:**
```
Alert: "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
```

**Soluções:**

**Opção A: Usar Supabase Local (Recomendado)**
```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase local
supabase init
supabase start

# Obter credenciais locais
supabase status

# Copiar API URL e anon key para .env
# Exemplo:
# API URL: http://localhost:54321
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Opção B: Usar Supabase Cloud (Gratuito)**
```bash
# 1. Criar conta em https://supabase.com
# 2. Criar novo projeto
# 3. Copiar Project URL e anon/public key
# 4. Atualizar .env:

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# 5. Rebuild
npm run build
```

**Opção C: Desabilitar Supabase (Usar PostgreSQL direto)**
```typescript
// Requer modificação em src/lib/supabase.ts
// Substituir cliente Supabase por cliente PostgreSQL nativo
// (Desenvolvimento necessário)
```

---

### 9.2 Problema: Erro de Permissão no PostgreSQL

**Sintoma:**
```
psql: error: connection to server at "127.0.0.1", port 5432 failed: 
FATAL:  password authentication failed for user "calabasas_admin"
```

**Solução:**
```bash
# Resetar senha do usuário
sudo -u postgres psql -c "ALTER USER calabasas_admin WITH PASSWORD 'Calabasas@2025!';"

# Verificar pg_hba.conf
sudo nano /etc/postgresql/$(psql -V | awk '{print $3}' | cut -d. -f1)/main/pg_hba.conf

# Deve conter:
# local   all             all                                     scram-sha-256
# host    all             all             127.0.0.1/32            scram-sha-256

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

---

### 9.3 Problema: Nginx 403 Forbidden

**Sintoma:**
```
403 Forbidden ao acessar https://172.20.120.28
```

**Solução:**
```bash
# Verificar permissões do diretório dist
sudo chown -R www-data:www-data /opt/calabasas/dist
sudo chmod -R 755 /opt/calabasas/dist

# Verificar configuração do Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar logs
sudo tail -50 /var/log/nginx/error.log
```

---

### 9.4 Problema: Build Falha (npm run build)

**Sintoma:**
```
Error: Build failed with errors
```

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json dist
npm cache clean --force
npm install --legacy-peer-deps

# Verificar erros de TypeScript
npm run check

# Build com logs detalhados
npm run build -- --debug
```

---

### 9.5 Problema: Hot Reload Não Funciona

**Sintoma:**
Alterações no código não refletem no navegador

**Solução:**
```bash
# Parar servidor (Ctrl+C)

# Iniciar com configurações específicas
npm run dev -- --host 0.0.0.0 --port 5173 --force

# Se ainda não funcionar, limpar cache do Vite
rm -rf node_modules/.vite
npm run dev
```

---

## 📊 CHECKLIST FINAL DE VALIDAÇÃO

### ✅ Infraestrutura
- [ ] Ubuntu 22.04 verificado
- [ ] Node.js 20.x instalado
- [ ] PostgreSQL rodando
- [ ] Nginx rodando
- [ ] Certificado SSL gerado

### ✅ Banco de Dados
- [ ] Banco `calabasas_local` criado
- [ ] Usuário `calabasas_admin` criado
- [ ] 15 migrações aplicadas
- [ ] Tabelas verificadas (>= 20)
- [ ] Dados de exemplo inseridos
- [ ] Usuário admin criado

### ✅ Aplicação
- [ ] Dependências instaladas (`node_modules/`)
- [ ] Build executado com sucesso (`dist/`)
- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Scripts adaptados e testados

### ✅ Nginx
- [ ] Configuração criada
- [ ] Site habilitado
- [ ] HTTP redireciona para HTTPS
- [ ] HTTPS respondendo
- [ ] Arquivos estáticos servidos

### ✅ Testes
- [ ] PostgreSQL acessível
- [ ] Nginx acessível
- [ ] Health check passou
- [ ] Integração testada
- [ ] Frontend carrega no navegador
- [ ] Console sem erros críticos

---

## 🎓 COMANDOS ÚTEIS PARA O DIA-A-DIA

### Desenvolvimento
```bash
# Iniciar dev server
npm run dev

# Build de produção
npm run build

# Verificar tipos TypeScript
npm run check

# Lint
npm run lint
```

### Banco de Dados
```bash
# Conectar ao banco
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local

# Backup
pg_dump -h 127.0.0.1 -U calabasas_admin calabasas_local > backup_$(date +%Y%m%d).sql

# Restore
psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local < backup_20250127.sql
```

### Nginx
```bash
# Reiniciar
sudo systemctl restart nginx

# Testar configuração
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoramento
```bash
# Health check
bash scripts/health-check-local.sh

# Verificar serviços
sudo systemctl status postgresql nginx

# Uso de recursos
htop
```

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Descrição | Tempo Estimado | Total Acumulado |
|------|-----------|----------------|-----------------|
| 1 | Pré-requisitos e Instalação | 30-45 min | 0:45 |
| 2 | Configuração PostgreSQL | 20-30 min | 1:15 |
| 3 | Configuração Nginx | 15-20 min | 1:35 |
| 4 | Variáveis de Ambiente | 10-15 min | 1:50 |
| 5 | Adaptação de Scripts | 20-30 min | 2:20 |
| 6 | Testes de Conectividade | 30-45 min | 3:05 |
| 7 | Seed de Dados | 15-20 min | 3:25 |
| 8 | Execução e Validação | 20-30 min | 3:55 |
| 9 | Resolução de Problemas | 0-60 min | 4:55 |

**⏱️ TEMPO TOTAL: 3-5 horas** (considerando possíveis problemas)

---

## 🚀 PRÓXIMOS PASSOS (Pós-Migração)

1. **Implementar Supabase Local ou Cloud**
   - Configurar autenticação real
   - Habilitar OAuth Google

2. **Conectar com Rede Real**
   - Integrar com switches via SSH/SNMP
   - Implementar descoberta automática de dispositivos
   - Sincronizar dados reais

3. **Desenvolver Funcionalidades**
   - Completar páginas faltantes
   - Implementar sistema de simulação
   - Criar dashboards analytics

4. **Preparar para Produção**
   - Configurar SSL válido (Let's Encrypt)
   - Otimizar performance
   - Implementar backup automático
   - Configurar monitoramento (Prometheus/Grafana)

5. **Deploy no Vercel**
   - Resolver erros originais
   - Migrar banco para Supabase Cloud
   - Configurar CI/CD
   - Testar em staging

---

## 📞 SUPORTE E DOCUMENTAÇÃO

### Documentos Relacionados
- `README.md` - Documentação principal do projeto


### Logs Importantes
- PostgreSQL: `/var/log/postgresql/postgresql-*-main.log`
- Nginx: `/var/log/nginx/access.log` e `/var/log/nginx/error.log`
- Aplicação: Console do navegador (F12)

### Comandos de Troubleshooting
```bash
# Ver todos os serviços
sudo systemctl list-units --type=service --state=running | grep -E 'postgres|nginx'

# Verificar portas em uso
sudo ss -tulpn | grep -E ':80|:443|:5432|:5173'

# Ver processos do Node
ps aux | grep node

# Monitorar recursos
htop
```

---

## ✅ CONCLUSÃO

Este plano fornece um roteiro completo para migrar a plataforma Calabasas para execução local no Ubuntu 22.04. Seguindo as fases sequencialmente, você terá um ambiente de desenvolvimento totalmente funcional para prototipar e testar antes do deploy final no Vercel.

**Principais Benefícios:**
- ✅ Ambiente controlado para desenvolvimento
- ✅ Testes sem custos de cloud
- ✅ Debug facilitado
- ✅ Prototipagem rápida
- ✅ Base sólida para produção

**Após conclusão, você poderá:**
- Desenvolver novas funcionalidades localmente
- Testar integração com equipamentos de rede
- Validar fluxos completos
- Resolver problemas antes do deploy
- Preparar migração definitiva para Vercel
