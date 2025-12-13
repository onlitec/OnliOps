# Setup local no Ubuntu 22.04

Este guia prepara o ambiente local com PostgreSQL, Nginx (proxy reverso com SSL), variáveis de ambiente, scripts de inicialização, monitoramento e backups. Ele foi desenhado para funcionar com este projeto (SPA React com Vite) e o esquema SQL já existente em `supabase/migrations`.

## Pré-requisitos
- Ubuntu 22.04 com acesso sudo
- Node.js 20 e npm 10 (verificar com `node -v` e `npm -v`)
- Porta `443` e `80` livres para Nginx e `5432` para PostgreSQL

## 1) Banco de dados PostgreSQL local
### Instalação
Execute:
```
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

### Criação de usuário e banco
Use o script:
```
bash scripts/setup-postgres.sh \
  --db-name network_platform \
  --db-user network_admin \
  --db-pass "SENHA_FORTE_AQUI"
```
O script:
- Cria usuário e banco específicos do projeto
- Habilita `uuid-ossp`
- Ajusta `pg_hba.conf` para autenticação `md5` (senha)
- Reinicia o serviço

### Aplicar migrações do projeto
```
PGHOST=127.0.0.1 PGPORT=5432 PGUSER=network_admin PGPASSWORD=SENHA_FORTE_AQUI PGDATABASE=network_platform \
bash scripts/apply-migrations.sh
```
O script aplica todos os arquivos em `supabase/migrations` em ordem.

## 2) Servidor Nginx como proxy reverso
### Instalação e configuração
```
bash scripts/setup-nginx.sh \
  --server-name local.project \
  --site-root /opt/calabasas/dist
```
O script:
- Instala Nginx
- Gera certificado SSL autoassinado em `/etc/ssl/local/`
- Cria `sites-available/network_platform.conf` com HTTP→HTTPS e servidor HTTPS
- Configura para servir estáticos de `/opt/calabasas/dist` com fallback para SPA (`index.html`)
- Ativa o site e reinicia Nginx

Se desejar usar o Vite Preview em desenvolvimento (porta 4173) em vez de estáticos, ajuste `ops/nginx/network_platform.conf` conforme comentários para `proxy_pass http://127.0.0.1:4173;`.

## 3) Outras tecnologias e variáveis de ambiente
### Dependências do projeto
Instale dependências e faça build:
```
npm install
npm run build
```

### Variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha os valores:
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: URL/chave do seu projeto Supabase
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: conexão local usada pelos scripts

> Observação importante: o app usa Supabase no cliente. O PostgreSQL local espelha o esquema via migrações e é útil para testes/relatórios. Para funcionamento 100% local sem Supabase, será necessário adicionar um backend REST e ajustar o frontend — isso não é coberto aqui.

## 4) Scripts de inicialização, monitoramento e backup
- Monitoramento básico:
  - `bash scripts/monitor/check-services.sh` — verifica status de `postgresql` e `nginx`, portas e HTTP 200
- Backup automático do banco:
  - Configure cron: `sudo crontab -e`
  - Adicione linha (backup diário às 02:00):
    ```
    0 2 * * * PGHOST=127.0.0.1 PGPORT=5432 PGUSER=network_admin PGPASSWORD=SENHA_FORTE_AQUI PGDATABASE=network_platform bash /opt/calabasas/scripts/backup-postgres.sh >> /var/log/network_platform_backup.log 2>&1
    ```

## 5) Testes de funcionamento local
### Serviços
- PostgreSQL: `sudo systemctl status postgresql` deve estar `active (running)`
- Nginx: `sudo systemctl status nginx` deve estar `active (running)`

### Comunicação entre componentes
- Frontend (build):
  - `npm run preview` → acesse `https://local.project/` (ou `http://localhost:4173` caso sem Nginx)
- Banco:
  - `psql -U network_admin -h 127.0.0.1 -d network_platform -c "SELECT 1;"`

### Persistência após reinício
- Habilite serviços:
```
sudo systemctl enable postgresql
sudo systemctl enable nginx
```

## 6) Manutenção
- Certificados: os autoassinados expiram em 365 dias (ajuste em `setup-nginx.sh`)
- Backups: verifique rotação em `/var/backups/network_platform/`
- Logs: `journalctl -u postgresql -u nginx` e `logs/service_status.log`

## 7) Segurança
- Use senhas fortes e restrinja acesso ao banco apenas a `127.0.0.1`
- Para SSL público, utilize Let’s Encrypt (`certbot`) em produção

## 8) Troubleshooting
- Porta 443 ocupada: `sudo lsof -i :443`
- Erro Nginx config: `sudo nginx -t`
- Falha migração: confira a ordem dos arquivos em `supabase/migrations`

