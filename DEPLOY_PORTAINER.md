# 🚀 OnliOps - Guia de Deploy no Portainer

## URL de Produção
- **Domínio:** `https://onliops.onlitec.com.br`

---

## 📋 Pré-requisitos

1. **VPS com Ubuntu 22.04+**
2. **Docker e Docker Compose instalados**
3. **Portainer instalado e acessível**
4. **Domínio apontando para o IP do VPS** (DNS A Record)
5. **Portas 80 e 443 abertas no firewall**

---

## 🔧 Opções de Deploy

### Opção 1: Com Traefik (Recomendado)

Se você já tem Traefik configurado no Portainer:

1. **Certifique-se que a rede `traefik-public` existe:**
   ```bash
   docker network create traefik-public
   ```

2. **Use o arquivo:** `docker-compose.prod.yaml`

3. **No Portainer:**
   - Acesse **Stacks** → **Add Stack**
   - Nome: `onliops`
   - Build method: **Git Repository** ou **Upload**
   - Compose file: `docker-compose.prod.yaml`

---

### Opção 2: Standalone (Nginx + Certbot)

Se você NÃO tem Traefik:

1. **Use o arquivo:** `docker-compose.standalone.yaml`

2. **Gere o certificado SSL antes do deploy:**
   ```bash
   # Criar diretórios necessários
   mkdir -p /opt/certbot/www /opt/certbot/conf
   
   # Gerar certificado (modo dry-run primeiro)
   docker run -it --rm \
     -v /opt/certbot/conf:/etc/letsencrypt \
     -v /opt/certbot/www:/var/www/certbot \
     -p 80:80 \
     certbot/certbot certonly \
     --standalone \
     --email seu-email@onlitec.com.br \
     --agree-tos \
     --no-eff-email \
     -d onliops.onlitec.com.br
   ```

3. **Copie os certificados para o volume:**
   ```bash
   docker volume create onliops-certbot-data
   docker run --rm \
     -v /opt/certbot/conf:/source \
     -v onliops-certbot-data:/dest \
     alpine cp -r /source/. /dest/
   ```

---

## 🔐 Configuração de Variáveis de Ambiente

### No Portainer (Stacks → Environment variables):

```env
POSTGRES_USER=onliops
POSTGRES_PASSWORD=SuaSenhaForteAqui123!
POSTGRES_DB=onliops
AI_MODEL=phi3
```

### Variáveis Opcionais:
```env
OPENAI_API_KEY=sk-xxx
GROQ_API_KEY=gsk_xxx
OPENROUTER_API_KEY=xxx
```

> ⚠️ **IMPORTANTE:** Nunca use a senha padrão `changeme` em produção!

---

## 📦 Deploy via Portainer

### Método 1: Git Repository (Recomendado)

1. **Stacks** → **Add Stack**
2. **Name:** `onliops`
3. **Build method:** Git Repository
4. **Repository URL:** `https://github.com/onlitec/OnliOps.git`
5. **Repository reference:** `main`
6. **Compose path:** `docker-compose.prod.yaml`
7. Configure as **Environment variables**
8. Clique em **Deploy the stack**

### Método 2: Upload Manual

1. Clone o repositório localmente
2. **Stacks** → **Add Stack**
3. **Build method:** Upload
4. Faça upload do `docker-compose.prod.yaml`
5. Configure as variáveis de ambiente
6. Deploy

### Método 3: Web Editor

1. Copie o conteúdo do `docker-compose.prod.yaml`
2. Cole no **Web editor** do Portainer
3. Configure as variáveis
4. Deploy

---

## 🔄 Após o Deploy

### 1. Verificar se os containers estão rodando:
```bash
docker ps -a | grep onliops
```

### 2. Verificar logs:
```bash
docker logs onliops-api -f
docker logs onliops-web -f
docker logs onliops-database -f
```

### 3. Baixar modelo Ollama (primeira vez):
```bash
docker exec -it onliops-ollama ollama pull phi3
```

### 4. Verificar health check:
```bash
curl -s https://onliops.onlitec.com.br/api/health
```

---

## 🛠️ Manutenção

### Backup do Banco de Dados:
```bash
docker exec onliops-database pg_dump -U onliops onliops > backup_$(date +%Y%m%d).sql
```

### Restaurar Backup:
```bash
docker exec -i onliops-database psql -U onliops onliops < backup_YYYYMMDD.sql
```

### Atualizar a Stack:
1. No Portainer: **Stacks** → **onliops** → **Pull and redeploy**
2. Ou via CLI:
   ```bash
   cd /opt/calabasas
   git pull
   docker-compose -f docker-compose.prod.yaml up -d --build
   ```

### Renovar Certificado SSL (automático com Certbot):
```bash
docker exec onliops-certbot certbot renew
docker exec onliops-nginx nginx -s reload
```

---

## 🔍 Troubleshooting

### Container não inicia:
```bash
docker logs <container_name>
```

### Erro de conexão com banco:
```bash
docker exec -it onliops-database psql -U onliops -d onliops
```

### Frontend retorna 502:
1. Verifique se o backend está healthy
2. Verifique logs do nginx:
   ```bash
   docker logs onliops-nginx
   ```

### Certificado SSL não funciona:
```bash
# Verificar certificado
openssl s_client -connect onliops.onlitec.com.br:443 -servername onliops.onlitec.com.br
```

---

## 📊 Monitoramento

### Health Endpoints:
- Frontend: `https://onliops.onlitec.com.br/`
- API: `https://onliops.onlitec.com.br/api/health`

### Recursos do Container:
```bash
docker stats onliops-api onliops-web onliops-database onliops-ollama
```

---

## 📁 Estrutura de Arquivos de Produção

```
/opt/calabasas/
├── docker-compose.prod.yaml      # Com Traefik
├── docker-compose.standalone.yaml # Sem Traefik
├── .env.production               # Variáveis de ambiente
├── ops/nginx/
│   └── production.conf           # Config Nginx SSL
└── supabase/migrations/          # Migrações do banco
```

---

## ✅ Checklist Pré-Deploy

- [ ] DNS configurado (A record para IP do VPS)
- [ ] Portas 80 e 443 abertas
- [ ] Senha do PostgreSQL alterada
- [ ] Variáveis de ambiente configuradas
- [ ] Certificado SSL pronto (se usar standalone)
- [ ] Backup do banco anterior (se upgrade)
- [ ] Modelo Ollama baixado

---

**Suporte:** Em caso de problemas, verifique os logs dos containers e consulte a documentação.
