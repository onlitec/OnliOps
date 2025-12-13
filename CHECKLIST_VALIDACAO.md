# ✅ Checklist de Validação - Migração Local Calabasas

Use este checklist para garantir que todos os passos da migração foram executados corretamente.

---

## 📋 PRÉ-REQUISITOS

### Sistema Operacional
- [ ] Ubuntu 22.04 instalado e atualizado
- [ ] IP 172.20.120.46 configurado e ativo
- [ ] Acesso sudo disponível
- [ ] Conexão com internet estável
- [ ] Espaço em disco > 10GB disponível
- [ ] Memória RAM > 4GB

### Portas Disponíveis
- [ ] Porta 80 (HTTP) livre
- [ ] Porta 443 (HTTPS) livre
- [ ] Porta 5432 (PostgreSQL) livre
- [ ] Porta 5173 (Vite Dev) livre

Comando de verificação:
```bash
sudo ss -tulpn | grep -E ':80|:443|:5432|:5173'
```

---

## 🔧 FASE 1: INSTALAÇÃO DE DEPENDÊNCIAS

### Node.js
- [ ] Node.js 20.x instalado
- [ ] npm >= 10.8.1 instalado
- [ ] `node --version` retorna v20.x.x
- [ ] `npm --version` retorna >= 10.8.1

### PostgreSQL
- [ ] PostgreSQL instalado
- [ ] Serviço PostgreSQL rodando
- [ ] `sudo systemctl status postgresql` mostra "active (running)"
- [ ] `psql --version` retorna versão instalada

### Nginx
- [ ] Nginx instalado
- [ ] Serviço Nginx rodando
- [ ] `sudo systemctl status nginx` mostra "active (running)"
- [ ] `nginx -v` retorna versão instalada

### Outras Ferramentas
- [ ] Git instalado
- [ ] curl instalado
- [ ] OpenSSL instalado

---

## 🗄️ FASE 2: CONFIGURAÇÃO DO BANCO DE DADOS

### Criação do Banco
- [ ] Banco `calabasas_local` criado
- [ ] Usuário `calabasas_admin` criado
- [ ] Senha configurada corretamente
- [ ] Extensão `uuid-ossp` habilitada
- [ ] Autenticação scram-sha-256 configurada

Comando de verificação:
```bash
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local -c "SELECT 1"
```

### Migrações
- [ ] 15 arquivos de migração presentes em `supabase/migrations/`
- [ ] Todas as migrações aplicadas sem erro
- [ ] Tabelas criadas (>= 20 tabelas)

Comando de verificação:
```bash
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local -c "\dt public.*"
```

### Tabelas Principais
- [ ] Tabela `users` existe
- [ ] Tabela `vlans` existe
- [ ] Tabela `network_devices` existe
- [ ] Tabela `simulations` existe
- [ ] Tabela `simulation_runs` existe
- [ ] Tabela `alerts` existe
- [ ] Tabela `login_events` existe
- [ ] Função `auth.uid()` existe

### Dados de Exemplo
- [ ] Usuário admin criado (admin@calabasas.local)
- [ ] VLANs inseridas (>= 5)
- [ ] Dispositivos de rede inseridos (>= 4)
- [ ] Dados verificados com SELECT

Comando de verificação:
```bash
PGPASSWORD="Calabasas@2025!" psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local <<EOF
SELECT 
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM vlans) as vlans,
  (SELECT COUNT(*) FROM network_devices) as dispositivos;
EOF
```

---

## 🌐 FASE 3: CONFIGURAÇÃO DO NGINX

### Certificado SSL
- [ ] Certificado autoassinado gerado
- [ ] Arquivo `.crt` existe em `/etc/ssl/local/`
- [ ] Arquivo `.key` existe em `/etc/ssl/local/`

### Configuração
- [ ] Arquivo `network_platform.conf` criado em `/etc/nginx/sites-available/`
- [ ] Symlink criado em `/etc/nginx/sites-enabled/`
- [ ] Configuração testada com `sudo nginx -t`
- [ ] Nginx reiniciado sem erros

### Testes HTTP/HTTPS
- [ ] HTTP (80) redireciona para HTTPS (301/302)
- [ ] HTTPS (443) responde com 200 OK
- [ ] Página index.html é servida corretamente

Comandos de verificação:
```bash
curl -I http://172.20.120.46
curl -k -I https://172.20.120.46
```

### Logs
- [ ] Arquivo `access.log` sendo populado
- [ ] Arquivo `error.log` sem erros críticos

```bash
sudo tail -20 /var/log/nginx/access.log
sudo tail -20 /var/log/nginx/error.log
```

---

## 📦 FASE 4: APLICAÇÃO

### Dependências Node.js
- [ ] Arquivo `package.json` presente
- [ ] Pasta `node_modules/` criada
- [ ] Todas as dependências instaladas sem erro
- [ ] `npm list` não mostra erros críticos

### Build de Produção
- [ ] Build executado com `npm run build`
- [ ] Pasta `dist/` criada
- [ ] Arquivo `dist/index.html` existe
- [ ] Assets JS existem em `dist/assets/`
- [ ] Assets CSS existem em `dist/assets/`
- [ ] Tamanho do build razoável (< 10MB)

Comando de verificação:
```bash
ls -lh dist/
du -sh dist/
```

### Variáveis de Ambiente
- [ ] Arquivo `.env` criado
- [ ] Variável `PGHOST` configurada
- [ ] Variável `PGDATABASE` configurada
- [ ] Variável `PGUSER` configurada
- [ ] Variável `PGPASSWORD` configurada
- [ ] Variável `VITE_SUPABASE_URL` configurada
- [ ] Variável `VITE_SUPABASE_ANON_KEY` configurada
- [ ] Variável `VITE_LOCAL_IP` configurada

### Verificação de Tipos
- [ ] `npm run check` executa sem erros de tipo
- [ ] Nenhum erro TypeScript crítico

---

## 🧪 FASE 5: TESTES

### Health Check
- [ ] Script `health-check-local.sh` executável
- [ ] Todos os checks passam (✅)
- [ ] PostgreSQL detectado como rodando
- [ ] Nginx detectado como rodando
- [ ] Portas detectadas como escutando
- [ ] Conexão com banco bem-sucedida
- [ ] Endpoints HTTP/HTTPS respondendo

Comando:
```bash
bash scripts/health-check-local.sh
```

### Testes de Integração
- [ ] Script `test-integration-local.sh` executável
- [ ] Teste 1: PostgreSQL passou
- [ ] Teste 2: Nginx passou
- [ ] Teste 3: Build passou
- [ ] Teste 4: Configuração passou
- [ ] Teste 5: Queries SQL passaram
- [ ] Teste 6: Autenticação passou (ou alertado)

Comando:
```bash
bash scripts/test-integration-local.sh
```

### Testes Manuais
- [ ] Navegador acessa https://172.20.120.46
- [ ] Certificado SSL pode ser aceito
- [ ] Página de login carrega
- [ ] Console do navegador (F12) sem erros críticos
- [ ] Network tab mostra requisições corretas
- [ ] Assets carregam (CSS, JS, fontes)

---

## 🚀 FASE 6: DESENVOLVIMENTO

### Servidor de Desenvolvimento
- [ ] `npm run dev` inicia sem erro
- [ ] Servidor escuta em porta 5173
- [ ] Hot reload funciona
- [ ] http://localhost:5173 acessível
- [ ] Alterações em `src/` recarregam automaticamente

### Build de Produção
- [ ] `npm run build` completa sem erro
- [ ] Novo build gera `dist/` atualizado
- [ ] Nginx serve novo build após reinício

---

## 📊 FASE 7: VALIDAÇÃO FINAL

### Serviços do Sistema
- [ ] PostgreSQL habilitado na inicialização
- [ ] Nginx habilitado na inicialização
- [ ] Ambos reiniciam automaticamente após reboot

Comando:
```bash
sudo systemctl is-enabled postgresql
sudo systemctl is-enabled nginx
```

### Funcionalidades da Aplicação
- [ ] Página de login renderiza
- [ ] Formulário de login aceita input
- [ ] Botão "Entrar com Google" presente
- [ ] Mensagem de Supabase aparece (se não configurado)
- [ ] Não há crashes ao navegar

### Performance
- [ ] Build completo em < 2 minutos
- [ ] Página carrega em < 3 segundos
- [ ] Console sem memory leaks
- [ ] CPU usage normal (< 50% em idle)

### Segurança
- [ ] Arquivo `.env` com permissões 600
- [ ] Senha do PostgreSQL forte
- [ ] SSL/TLS configurado (mesmo autoassinado)
- [ ] RLS habilitado nas tabelas

---

## 📝 FASE 8: DOCUMENTAÇÃO

### Arquivos Criados
- [ ] `PLANO_MIGRACAO_LOCAL.md` presente
- [ ] `INICIO_RAPIDO.md` presente
- [ ] `RESUMO_EXECUTIVO.md` presente
- [ ] `.env.example` presente
- [ ] `README.md` atualizado

### Scripts Criados
- [ ] `scripts/setup-local-dev.sh` executável
- [ ] `scripts/health-check-local.sh` executável
- [ ] `scripts/dev-local.sh` executável
- [ ] `scripts/test-integration-local.sh` executável

---

## 🎯 CHECKLIST DE ACEITAÇÃO FINAL

### Critérios de Sucesso
- [ ] ✅ Todos os serviços rodando
- [ ] ✅ Banco de dados acessível e populado
- [ ] ✅ Nginx servindo aplicação
- [ ] ✅ Build de produção funcional
- [ ] ✅ Servidor de desenvolvimento funcional
- [ ] ✅ Health check 100% verde
- [ ] ✅ Testes de integração passando
- [ ] ✅ Aplicação acessível no navegador
- [ ] ✅ Console sem erros críticos
- [ ] ✅ Documentação completa

### Pronto para Desenvolvimento?
Se todos os itens acima estão marcados, o ambiente está **PRONTO** para:
- ✅ Desenvolvimento de novas funcionalidades
- ✅ Testes de integração com equipamentos
- ✅ Prototipagem rápida
- ✅ Debug e troubleshooting
- ✅ Preparação para deploy no Vercel

---

## 🐛 TROUBLESHOOTING CHECKLIST

Se algum check falhou, consulte:

### PostgreSQL não funciona
- [ ] Verificar logs: `sudo tail -50 /var/log/postgresql/postgresql-*-main.log`
- [ ] Verificar status: `sudo systemctl status postgresql`
- [ ] Tentar reiniciar: `sudo systemctl restart postgresql`
- [ ] Verificar pg_hba.conf
- [ ] Verificar senha do usuário

### Nginx não funciona
- [ ] Verificar logs: `sudo tail -50 /var/log/nginx/error.log`
- [ ] Testar config: `sudo nginx -t`
- [ ] Verificar permissões do `dist/`
- [ ] Tentar reiniciar: `sudo systemctl restart nginx`

### Build falha
- [ ] Limpar cache: `rm -rf node_modules dist`
- [ ] Reinstalar: `npm install --legacy-peer-deps`
- [ ] Verificar erros TypeScript: `npm run check`
- [ ] Verificar espaço em disco: `df -h`

### Aplicação não carrega
- [ ] Verificar console do navegador (F12)
- [ ] Verificar Network tab
- [ ] Verificar variáveis de ambiente
- [ ] Verificar se build foi feito
- [ ] Limpar cache do navegador

---

## 📈 PRÓXIMOS PASSOS

Após completar este checklist:

### Imediato
- [ ] Configurar Supabase Local ou Cloud
- [ ] Testar fluxo de autenticação completo
- [ ] Verificar todas as rotas da aplicação

### Curto Prazo (1 semana)
- [ ] Implementar funcionalidades faltantes
- [ ] Conectar com equipamentos de rede real
- [ ] Escrever testes unitários

### Médio Prazo (1 mês)
- [ ] Otimizar performance
- [ ] Implementar CI/CD
- [ ] Preparar para staging

### Longo Prazo (3 meses)
- [ ] Deploy no Vercel
- [ ] Monitoramento em produção
- [ ] Documentação de API

---

## ✅ ASSINATURA DE VALIDAÇÃO

**Data da Validação:** ___/___/_____  
**Validado por:** _______________________  
**Status:** [ ] APROVADO  [ ] PENDENTE  [ ] REPROVADO  

**Observações:**
```
___________________________________________________________
___________________________________________________________
___________________________________________________________
```

---

**Versão do Checklist:** 1.0  
**Data de Criação:** 27/11/2025  
**Projeto:** Calabasas Network Management Platform
