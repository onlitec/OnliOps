# 🚀 Guia Rápido de Início - Calabasas Local

## ⚡ Início Rápido (TL;DR)

```bash
cd /opt/calabasas

# 1. Executar setup completo (primeira vez)
bash scripts/setup-local-dev.sh

# 2. Verificar saúde do sistema
bash scripts/health-check-local.sh

# 3. Acessar aplicação
# Navegador: https://172.20.120.28
```

---

## 📋 Pré-Requisitos

Antes de começar, certifique-se de que:

- [ ] Ubuntu 22.04 instalado
- [ ] IP 172.20.120.28 configurado na máquina
- [ ] Acesso sudo disponível
- [ ] Conexão com internet (para downloads)
- [ ] Portas 80, 443, 5432 livres

---

## 🎯 Passos de Instalação

### 1️⃣ Instalação Inicial (Apenas uma vez)

```bash
# Navegar para o diretório do projeto
cd /opt/calabasas

# Executar script de setup completo
# Este script irá:
#   - Instalar Node.js, PostgreSQL, Nginx
#   - Criar banco de dados
#   - Aplicar migrações
#   - Compilar aplicação
#   - Configurar Nginx
bash scripts/setup-local-dev.sh
```

**⏱️ Tempo estimado:** 15-30 minutos

---

### 2️⃣ Verificação de Saúde

```bash
# Executar health check
bash scripts/health-check-local.sh
```

**Resultado esperado:** Todos os checks em verde ✅

---

### 3️⃣ Acessar a Aplicação

#### Opção A: Produção (Nginx - Recomendado para testes finais)
```
URL: https://172.20.120.28
```

#### Opção B: Desenvolvimento (Hot Reload - Recomendado para desenvolvimento)
```bash
# Terminal 1
bash scripts/dev-local.sh

# Ou diretamente:
npm run dev

# Acessar: http://localhost:5173
```

---

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento (hot reload)
npm run dev
# ou
bash scripts/dev-local.sh

# Build de produção
npm run build

# Verificar tipos TypeScript
npm run check

# Lint
npm run lint
```

### Manutenção do Sistema
```bash
# Health check completo
bash scripts/health-check-local.sh

# Testes de integração
bash scripts/test-integration-local.sh

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Banco de Dados
```bash
# Conectar ao banco
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local

# Dentro do psql:
\dt          # Listar tabelas
\d users     # Descrever tabela users
\q           # Sair

# Backup do banco
pg_dump -h 127.0.0.1 -U calabasas_admin calabasas_local > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local < backup_20250127.sql
```

---

## 🐛 Resolução de Problemas Comuns

### Problema 1: "Supabase não configurado"

**Solução Rápida:**
```bash
# Instalar Supabase Local
npm install -g supabase
supabase init
supabase start

# Copiar as credenciais para .env
supabase status
```

### Problema 2: Erro de permissão PostgreSQL

```bash
# Resetar senha
sudo -u postgres psql -c "ALTER USER calabasas_admin WITH PASSWORD 'Calabasas@2025!';"

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Problema 3: Nginx 403 Forbidden

```bash
# Corrigir permissões
sudo chown -R www-data:www-data /opt/calabasas/dist
sudo chmod -R 755 /opt/calabasas/dist

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema 4: Build falha

```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json dist
npm cache clean --force
npm install --legacy-peer-deps
npm run build
```

### Problema 5: Hot reload não funciona

```bash
# Parar servidor (Ctrl+C)
# Limpar cache
rm -rf node_modules/.vite

# Reiniciar
npm run dev -- --force
```

---

## 📊 Estrutura do Projeto

```
/opt/calabasas/
├── scripts/                    # Scripts de automação
│   ├── setup-local-dev.sh     # Setup completo (USE ESTE!)
│   ├── health-check-local.sh  # Verificação de saúde
│   ├── dev-local.sh           # Servidor dev
│   └── test-integration-local.sh # Testes
├── src/                       # Código fonte React
├── supabase/migrations/       # Migrações SQL
├── dist/                      # Build de produção
├── .env                       # Variáveis de ambiente
└── package.json              # Dependências
```

---

## 🔑 Credenciais Padrão

### Banco de Dados
```
Host: 127.0.0.1
Port: 5432
Database: calabasas_local
User: calabasas_admin
Password: Calabasas@2025!
```

### Aplicação
```
Usuário: admin@calabasas.local
Senha: (configure no Supabase ou via SQL)
```

---

## 🎓 Workflow de Desenvolvimento Diário

### Manhã (Iniciar trabalho)
```bash
cd /opt/calabasas

# Verificar saúde
bash scripts/health-check-local.sh

# Iniciar dev server
npm run dev

# Abrir navegador: http://localhost:5173
```

### Durante o dia (Desenvolvimento)
```bash
# Fazer alterações em src/
# Hot reload recarrega automaticamente

# Se necessário rebuild completo:
npm run build
```

### Fim do dia (Commit)
```bash
# Parar servidor (Ctrl+C)

# Verificar tipos
npm run check

# Lint
npm run lint

# Commit (se estiver usando git)
git add .
git commit -m "feat: sua mensagem"
```

---

## 📈 Próximos Passos (Pós-Setup)

1. **Configurar Supabase Local ou Cloud**
   - Para autenticação funcionar corretamente

2. **Implementar Funcionalidades**
   - Completar páginas faltantes
   - Conectar com equipamentos reais

3. **Testes**
   - Escrever testes unitários
   - Testes de integração

4. **Deploy no Vercel**
   - Resolver erros originais
   - Configurar variáveis de ambiente
   - Deploy em staging → produção

---

## 📞 Referências Importantes

- **Documentação Completa:** `PLANO_MIGRACAO_LOCAL.md`


---

## ✅ Checklist de Validação

Após executar o setup, verifique:

- [ ] PostgreSQL rodando (`sudo systemctl status postgresql`)
- [ ] Nginx rodando (`sudo systemctl status nginx`)
- [ ] Health check passou (`bash scripts/health-check-local.sh`)
- [ ] https://172.20.120.28 acessível no navegador
- [ ] Página de login carrega
- [ ] Console do navegador sem erros críticos (F12)
- [ ] Banco de dados tem dados (`psql -c "SELECT COUNT(*) FROM users"`)

---

## 🎯 Objetivos da Migração Local

✅ **Alcançados após setup:**
- Ambiente de desenvolvimento local funcional
- Banco de dados PostgreSQL configurado
- Nginx servindo aplicação
- Build de produção gerado
- Scripts de automação prontos

🎯 **Próximos objetivos:**
- Implementar autenticação real
- Conectar com rede real
- Desenvolver funcionalidades faltantes
- Preparar para deploy no Vercel

---

**Criado em:** 27/11/2025  
**Versão:** 1.0  
**Plataforma:** Ubuntu 22.04  
**Projeto:** Calabasas Network Management & Simulation Platform
