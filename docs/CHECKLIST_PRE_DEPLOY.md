# 🚀 OnliOps - Checklist de Preparação para Produção

> **Objetivo:** Lista de verificações e alterações necessárias antes de fazer o deploy na VPS com `onliops.onlitec.com.br`

**Data de criação:** 21/12/2025  
**Status:** ⚠️ PENDENTE

---

## 📋 Resumo Executivo

Após análise da plataforma, foram identificados os seguintes pontos que precisam ser ajustados para produção:

| Categoria | Itens | Prioridade |
|-----------|-------|------------|
| 🔴 **Segurança** | 2 itens críticos | Alta |
| 🟠 **Configuração** | 3 itens | Média |
| 🟡 **Otimização** | 2 itens | Baixa |
| 🟢 **Limpeza** | 2 itens | Baixa |

---

## 🔴 1. SEGURANÇA (CRÍTICO)

### 1.1 ⚠️ Senhas armazenadas em texto plano

**Arquivo:** `server/import-api.cjs` (linha 90)

**Problema:** A autenticação compara senhas em texto plano, sem hash:
```javascript
if (user.password_hash !== password) {
```

**Solução:** Implementar bcrypt para hash de senhas

```bash
# No servidor, instalar bcrypt
cd /opt/calabasas/server
npm install bcrypt
```

**Alteração necessária em `server/import-api.cjs`:**
```javascript
// No início do arquivo, adicionar:
const bcrypt = require('bcrypt');

// Na função de login (linha 90), substituir:
// if (user.password_hash !== password) {
// por:
const isPasswordValid = await bcrypt.compare(password, user.password_hash);
if (!isPasswordValid) {

// Na função de registro, ao criar usuário:
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
// Usar hashedPassword em vez de password
```

**Migração de senhas existentes:**
```sql
-- Script para atualizar senhas existentes (executar após implementar bcrypt)
-- IMPORTANTE: Gere hashes reais para cada usuário
-- Exemplo de hash bcrypt para 'admin123': $2b$10$...
```

---

### 1.2 ⚠️ Credenciais hardcoded no código

**Arquivo:** `server/import-api.cjs` (linhas 46-51)

**Problema:** Credenciais de banco com valores padrão inseguros:
```javascript
const pool = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
    password: process.env.PGPASSWORD || 'Calabasas@2025!'  // ⚠️ INSEGURO
})
```

**Solução:** Remover valores padrão e exigir variáveis de ambiente:
```javascript
const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
})

// Validar que as variáveis existem
if (!process.env.PGPASSWORD) {
    console.error('FATAL: PGPASSWORD environment variable is required');
    process.exit(1);
}
```

---

## 🟠 2. CONFIGURAÇÃO

### 2.1 Arquivo .env.production

**Criar arquivo:** `.env.production` com todas as variáveis necessárias para produção

```bash
# ============================================
# OnliOps - Production Environment Variables
# URL: onliops.onlitec.com.br
# ============================================

# DATABASE (OBRIGATÓRIO)
POSTGRES_USER=onliops
POSTGRES_PASSWORD=<SENHA_FORTE_AQUI>
POSTGRES_DB=onliops
PGHOST=database
PGPORT=5432
PGUSER=onliops
PGPASSWORD=<MESMA_SENHA_FORTE>
PGDATABASE=onliops

# DATABASE_URL (para aplicações que pedem connection string)
DATABASE_URL=postgresql://onliops:<SENHA>@database:5432/onliops

# APPLICATION
NODE_ENV=production
PORT=3001

# AI SERVICES (escolher um)
AI_MODEL=phi3
# OPENAI_API_KEY=sk-xxx
# GROQ_API_KEY=gsk_xxx

# FRONTEND BUILD
VITE_API_URL=/api
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
```

---

### 2.2 Atualizar docker-compose.yml para produção

**Arquivo:** `docker-compose.yml`

**Alterações recomendadas:**

```yaml
services:
  frontend:
    ports:
      - "80:80"  # ✅ Já está correto
    # Adicionar healthcheck mais robusto
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  backend:
    # Adicionar restart policy
    restart: unless-stopped
    # Limitar recursos (opcional)
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  database:
    # Adicionar backup automático
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups  # Para scripts de backup
```

---

### 2.3 Remover IPs locais hardcoded

**Arquivos afetados:**

| Arquivo | Linha | Valor atual | Ação |
|---------|-------|-------------|------|
| `.env` | 17-19 | `172.20.120.28` | Remover (usar apenas em dev) |
| `config/nginx-pwa.conf` | 3, 9, 11-12 | `172.20.120.28` | Substituir por domínio |

**Não alterar diretamente esses arquivos** - eles são para desenvolvimento local. Em produção, usar as configurações do Docker.

---

## 🟡 3. OTIMIZAÇÃO

### 3.1 Incrementar versão da aplicação

**Arquivo:** `index.html` (linha 50)

**Antes:**
```javascript
const APP_VERSION = '2.0.2';
```

**Depois:**
```javascript
const APP_VERSION = '3.0.0-prod';  // Novo release para produção
```

Isso forçará a limpeza de cache em todos os clientes.

---

### 3.2 Desabilitar devOptions do PWA em produção

**Arquivo:** `vite.config.ts` (linhas 164-166)

**Antes:**
```typescript
devOptions: {
  enabled: true
}
```

**Depois:**
```typescript
devOptions: {
  enabled: process.env.NODE_ENV === 'development'
}
```

---

## 🟢 4. LIMPEZA

### 4.1 Limpar logs e arquivos temporários

```bash
# Antes do deploy, executar:
rm -f server/import-api.log
rm -f import-api.log
rm -rf server/uploads/temp/*
```

### 4.2 Verificar .gitignore

Garantir que os seguintes arquivos NÃO sejam commitados:

```gitignore
# Já presentes (confirmar):
.env
.env.local
.env.production

# Adicionar se não existir:
*.log
server/uploads/
backups/
```

---

## ✅ 5. CHECKLIST FINAL

### Antes do Deploy

- [ ] **Segurança**
  - [ ] Implementar bcrypt para senhas
  - [ ] Remover credenciais padrão do código
  - [ ] Gerar senha forte para banco de dados

- [ ] **Configuração**
  - [ ] Criar `.env.production` com valores corretos
  - [ ] Verificar docker-compose.yml
  - [ ] Configurar DNS: `onliops.onlitec.com.br` → IP da VPS

- [ ] **Build**
  - [ ] Incrementar APP_VERSION no index.html
  - [ ] Executar `npm run build` localmente para testar
  - [ ] Commit de todas as alterações

- [ ] **Limpeza**
  - [ ] Remover arquivos de log
  - [ ] Verificar .gitignore

### Após o Deploy

- [ ] Testar login e registro
- [ ] Verificar conexão com banco de dados
- [ ] Testar upload de arquivos
- [ ] Verificar SSL (certificado válido)
- [ ] Testar importação de dispositivos
- [ ] Verificar logs: `docker compose logs -f`

---

## 📝 Comandos de Deploy

```bash
# 1. No servidor de desenvolvimento (commit)
git add .
git commit -m "chore: prepare for production deploy"
git push origin main

# 2. Na VPS
cd /opt/onliops
git pull origin main

# 3. Criar arquivo .env com senhas de produção
nano .env

# 4. Build e deploy
docker compose down
docker compose up -d --build

# 5. Verificar
docker compose ps
docker compose logs -f
curl https://onliops.onlitec.com.br/api/health
```

---

## 🔐 Senhas de Produção (GERAR NOVAS!)

⚠️ **NUNCA use as senhas de exemplo!**

**Gerar senhas fortes:**
```bash
# Senha para banco de dados (32 caracteres)
openssl rand -base64 32

# Exemplo de saída (NÃO USE ESTA):
# aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7=
```

**Template para o .env de produção:**
```bash
POSTGRES_PASSWORD=<GERAR_NOVA>
PGPASSWORD=<MESMA_DO_POSTGRES>
```

---

**Documento criado automaticamente pela análise da plataforma OnliOps**  
**Última atualização:** 21/12/2025
