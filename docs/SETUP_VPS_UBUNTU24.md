# 🚀 OnliOps - Guia de Setup em VPS Ubuntu 24.04

> **Objetivo:** Configurar a plataforma OnliOps em um servidor Ubuntu 24.04 LTS para produção com a URL `onliops.onlitec.com.br`

**Data de criação:** 21/12/2025  
**Versão:** 1.0.0

---

## 📋 Índice

1. [Requisitos do Servidor](#1-requisitos-do-servidor)
2. [Preparação Inicial do Servidor](#2-preparação-inicial-do-servidor)
3. [Instalação do Docker e Docker Compose](#3-instalação-do-docker-e-docker-compose)
4. [Configuração DNS](#4-configuração-dns)
5. [Clone do Repositório](#5-clone-do-repositório)
6. [Configuração das Variáveis de Ambiente](#6-configuração-das-variáveis-de-ambiente)
7. [Deploy com Docker Compose](#7-deploy-com-docker-compose)
8. [Configuração do Nginx Reverso com SSL](#8-configuração-do-nginx-reverso-com-ssl)
9. [Configuração do Firewall](#9-configuração-do-firewall)
10. [Verificação e Testes](#10-verificação-e-testes)
11. [Manutenção e Backup](#11-manutenção-e-backup)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Requisitos do Servidor

### Hardware Mínimo
| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **CPU** | 2 vCPUs | 4 vCPUs |
| **RAM** | 4 GB | 8 GB |
| **Disco** | 40 GB SSD | 80 GB SSD |
| **Rede** | 100 Mbps | 1 Gbps |

### Software
- **Sistema Operacional:** Ubuntu 24.04 LTS (Noble Numbat)
- **Docker:** 24.x ou superior
- **Docker Compose:** v2.x
- **Node.js:** 20.x (apenas para build local, não necessário em produção)

### Portas Necessárias
| Porta | Serviço | Descrição |
|-------|---------|-----------|
| 22 | SSH | Acesso remoto ao servidor |
| 80 | HTTP | Tráfego web (redirect para HTTPS) |
| 443 | HTTPS | Tráfego web seguro |

---

## 2. Preparação Inicial do Servidor

### 2.1 Conectar ao Servidor
```bash
ssh root@seu-ip-da-vps
```

### 2.2 Atualizar o Sistema
```bash
apt update && apt upgrade -y
```

### 2.3 Configurar Timezone
```bash
timedatectl set-timezone America/Sao_Paulo
```

### 2.4 Criar Usuário para a Aplicação (Opcional, recomendado)
```bash
# Criar usuário
adduser onliops

# Adicionar ao grupo sudo
usermod -aG sudo onliops

# Fazer login como o novo usuário
su - onliops
```

### 2.5 Instalar Dependências Básicas
```bash
sudo apt install -y \
    git \
    curl \
    wget \
    htop \
    nano \
    ufw \
    certbot \
    python3-certbot-nginx \
    nginx
```

---

## 3. Instalação do Docker e Docker Compose

### 3.1 Remover Versões Antigas (se existirem)
```bash
sudo apt remove docker docker-engine docker.io containerd runc -y 2>/dev/null || true
```

### 3.2 Instalar Docker usando Script Oficial
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 3.3 Adicionar Usuário ao Grupo Docker
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 3.4 Verificar Instalação
```bash
docker --version
docker compose version
```

### 3.5 Habilitar Docker na Inicialização
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 4. Configuração DNS

### 4.1 Configurar Registro DNS

No painel de controle do seu provedor de DNS (Cloudflare, Route53, etc.), crie um registro A:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | onliops.onlitec.com.br | `SEU_IP_DA_VPS` | Auto |

**Exemplo no Cloudflare:**
```
Tipo: A
Nome: onliops
Conteúdo: 203.0.113.50 (substituir pelo IP real)
Proxy: ON (laranja) ou OFF (cinza) - recomendado OFF inicialmente
```

### 4.2 Verificar Propagação DNS
```bash
# Aguardar alguns minutos e testar
dig onliops.onlitec.com.br +short
# ou
nslookup onliops.onlitec.com.br
```

---

## 5. Clone do Repositório

### 5.1 Criar Diretório para a Aplicação
```bash
sudo mkdir -p /opt/onliops
sudo chown $USER:$USER /opt/onliops
cd /opt/onliops
```

### 5.2 Clonar Repositório
```bash
git clone https://github.com/onlitec/OnliOps.git .
```

> **Nota:** Se o repositório for privado, configure uma chave SSH ou use um Personal Access Token:
> ```bash
> git clone https://<TOKEN>@github.com/onlitec/OnliOps.git .
> ```

---

## 6. Configuração das Variáveis de Ambiente

### 6.1 Criar Arquivo .env
```bash
cp .env.coolify.example .env
nano .env
```

### 6.2 Configurar Variáveis Obrigatórias
```bash
# ============================================
# OnliOps - Produção VPS
# ============================================

# ===========================================
# DATABASE (OBRIGATÓRIO)
# ===========================================
POSTGRES_USER=onliops
POSTGRES_PASSWORD=SuaSenhaSegura@2025!  # ALTERE ISSO!
POSTGRES_DB=onliops

# ===========================================
# AI SERVICES (Opcional - escolha um)
# ===========================================
# Ollama (local, incluído no docker-compose)
AI_MODEL=phi3

# OpenAI (alternativa)
# OPENAI_API_KEY=sk-sua-chave-aqui

# Groq (alternativa, rápido e barato)
# GROQ_API_KEY=gsk_sua-chave-aqui

# OpenRouter (alternativa, acesso a múltiplos modelos)
# OPENROUTER_API_KEY=sk-or-sua-chave-aqui

# ===========================================
# SUPABASE AUTH (Opcional - se usar autenticação Supabase)
# ===========================================
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 6.3 Gerar Senha Segura para o Banco
```bash
# Gerar senha aleatória de 32 caracteres
openssl rand -base64 32
```

---

## 7. Deploy com Docker Compose

### 7.1 Estrutura dos Containers

A plataforma usa os seguintes containers:

| Container | Imagem | Porta | Descrição |
|-----------|--------|-------|-----------|
| `onliops-database` | postgres:15-alpine | 5432 (interno) | Banco de dados PostgreSQL |
| `onliops-ollama` | ollama/ollama:latest | 11434 (interno) | Servidor de IA local |
| `onliops-api` | Build local | 3001 (interno) | Backend Node.js |
| `onliops-web` | Build local | 80 | Frontend React + Nginx |

### 7.2 Build e Deploy

#### Opção A: Build Local (Recomendado para primeira instalação)
```bash
# Build e iniciar todos os containers
docker compose up -d --build

# Verificar status
docker compose ps
```

#### Opção B: Usar Imagens do Docker Hub (Atualizações rápidas)
```bash
# Usar o compose com imagens pré-construídas
docker compose -f docker-compose.registry.yaml up -d

# Verificar status
docker compose ps
```

### 7.3 Verificar Logs
```bash
# Ver logs de todos os containers
docker compose logs -f

# Ver logs de um container específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database
```

### 7.4 Aguardar Inicialização Completa
```bash
# Verificar saúde dos containers
docker compose ps

# Testar se a API está respondendo
curl http://localhost/api/health
```

### 7.5 Baixar Modelo de IA (Se usando Ollama)
```bash
# Entrar no container Ollama e baixar o modelo
docker exec -it onliops-ollama ollama pull phi3

# Verificar modelos instalados
docker exec -it onliops-ollama ollama list
```

---

## 8. Configuração do Nginx Reverso com SSL

### 8.1 Remover Configuração Padrão do Nginx
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 8.2 Criar Configuração para OnliOps
```bash
sudo nano /etc/nginx/sites-available/onliops
```

Conteúdo:
```nginx
# ============================================
# OnliOps - Nginx Reverse Proxy Configuration
# URL: onliops.onlitec.com.br
# ============================================

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name onliops.onlitec.com.br;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name onliops.onlitec.com.br;

    # SSL Certificates (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/onliops.onlitec.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/onliops.onlitec.com.br/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
    gzip_comp_level 6;
    
    # Client Body Size (for file uploads)
    client_max_body_size 100M;
    
    # Proxy to Docker Container
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### 8.3 Configuração Temporária para Obter Certificado SSL

Antes de ativar SSL, crie uma configuração temporária:
```bash
sudo nano /etc/nginx/sites-available/onliops-temp
```

Conteúdo:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name onliops.onlitec.com.br;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 8.4 Ativar Configuração Temporária
```bash
sudo ln -s /etc/nginx/sites-available/onliops-temp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8.5 Obter Certificado SSL com Let's Encrypt
```bash
# Criar diretório para challenge
sudo mkdir -p /var/www/html

# Obter certificado
sudo certbot certonly --webroot -w /var/www/html -d onliops.onlitec.com.br --email seu-email@onlitec.com.br --agree-tos --non-interactive
```

### 8.6 Ativar Configuração HTTPS
```bash
# Remover config temporária
sudo rm /etc/nginx/sites-enabled/onliops-temp

# Ativar config completa
sudo ln -s /etc/nginx/sites-available/onliops /etc/nginx/sites-enabled/

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

### 8.7 Configurar Renovação Automática do SSL
```bash
# Testar renovação
sudo certbot renew --dry-run

# Adicionar ao cron (geralmente já configurado automaticamente)
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 9. Configuração do Firewall

### 9.1 Configurar UFW
```bash
# Resetar regras
sudo ufw reset

# Políticas padrão
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (IMPORTANTE: faça isso primeiro!)
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar status
sudo ufw status verbose
```

### 9.2 Regras Adicionais (Se necessário)
```bash
# Permitir acesso de IP específico ao PostgreSQL (para backups remotos)
# sudo ufw allow from SEU_IP_SEGURO to any port 5432

# Permitir range de IPs
# sudo ufw allow from 192.168.1.0/24
```

---

## 10. Verificação e Testes

### 10.1 Verificar Containers
```bash
# Status dos containers
docker compose ps

# Saúde dos containers
docker inspect --format='{{.State.Health.Status}}' onliops-database
docker inspect --format='{{.State.Health.Status}}' onliops-api
docker inspect --format='{{.State.Health.Status}}' onliops-web
```

### 10.2 Testar Endpoints
```bash
# Testar health check da API
curl -k https://onliops.onlitec.com.br/api/health

# Testar página inicial
curl -I https://onliops.onlitec.com.br
```

### 10.3 Verificar Logs
```bash
# Logs em tempo real
docker compose logs -f

# Logs do Nginx do host
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 10.4 Testar no Navegador
Acesse: `https://onliops.onlitec.com.br`

**Checklist de verificação:**
- [ ] Página carrega sem erros
- [ ] SSL válido (cadeado verde)
- [ ] Login funciona
- [ ] API responde (verificar DevTools > Network)
- [ ] Upload de arquivos funciona

---

## 11. Manutenção e Backup

### 11.1 Script de Backup do Banco de Dados
```bash
sudo nano /opt/onliops/scripts/backup-db.sh
```

Conteúdo:
```bash
#!/bin/bash
# ============================================
# OnliOps - Database Backup Script
# ============================================

BACKUP_DIR="/opt/onliops/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/onliops_backup_$DATE.sql.gz"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Realizar backup
docker exec onliops-database pg_dump -U onliops onliops | gzip > $BACKUP_FILE

# Manter apenas os últimos 30 backups
find $BACKUP_DIR -name "onliops_backup_*.sql.gz" -mtime +30 -delete

echo "Backup criado: $BACKUP_FILE"
```

```bash
# Tornar executável
chmod +x /opt/onliops/scripts/backup-db.sh

# Agendar backup diário (às 3h da manhã)
sudo crontab -e
# Adicionar:
0 3 * * * /opt/onliops/scripts/backup-db.sh >> /var/log/onliops-backup.log 2>&1
```

### 11.2 Atualizar a Aplicação
```bash
cd /opt/onliops

# Opção A: Build local
git pull origin main
docker compose down
docker compose up -d --build

# Opção B: Usar imagens do Docker Hub
docker compose -f docker-compose.registry.yaml pull
docker compose -f docker-compose.registry.yaml down
docker compose -f docker-compose.registry.yaml up -d
```

### 11.3 Limpar Recursos Docker
```bash
# Remover imagens não utilizadas
docker image prune -a

# Remover volumes órfãos (CUIDADO: pode remover dados!)
# docker volume prune

# Limpar tudo que não está em uso
docker system prune -a
```

### 11.4 Monitoramento de Recursos
```bash
# Ver uso de recursos dos containers
docker stats

# Ver uso de disco dos volumes
docker system df
```

---

## 12. Troubleshooting

### 12.1 Container não inicia

**Verificar logs:**
```bash
docker compose logs <nome-do-container>
```

**Problemas comuns:**
- **Database:** Verificar se a senha está correta no .env
- **Backend:** Verificar conexão com o database
- **Frontend:** Verificar se o backend está healthy

### 12.2 Erro 502 Bad Gateway

```bash
# Verificar se os containers estão rodando
docker compose ps

# Verificar logs do container
docker compose logs frontend

# Reiniciar containers
docker compose restart
```

### 12.3 Erro de SSL

```bash
# Verificar certificado
openssl s_client -connect onliops.onlitec.com.br:443 -servername onliops.onlitec.com.br

# Renovar certificado manualmente
sudo certbot renew --force-renewal

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 12.4 Banco de Dados não conecta

```bash
# Verificar se o container está rodando
docker ps | grep database

# Acessar o container do banco
docker exec -it onliops-database psql -U onliops -d onliops

# Verificar logs
docker compose logs database
```

### 12.5 Memória insuficiente (Ollama)

O Ollama pode consumir muita RAM. Se o servidor tem pouca memória:

```bash
# Usar modelo menor
docker exec -it onliops-ollama ollama pull tinyllama

# Atualizar .env
AI_MODEL=tinyllama

# Ou desativar Ollama e usar API externa
# Comentar o serviço ollama no docker-compose.yml
```

### 12.6 Reiniciar Tudo do Zero

```bash
cd /opt/onliops

# Parar e remover tudo
docker compose down -v

# Rebuild completo
docker compose up -d --build --force-recreate
```

---

## 📊 Resumo dos Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `docker compose up -d --build` | Iniciar/rebuild todos os containers |
| `docker compose down` | Parar todos os containers |
| `docker compose ps` | Ver status dos containers |
| `docker compose logs -f` | Ver logs em tempo real |
| `docker compose restart` | Reiniciar containers |
| `docker exec -it onliops-database psql -U onliops -d onliops` | Acessar banco de dados |
| `sudo certbot renew` | Renovar certificado SSL |
| `sudo systemctl restart nginx` | Reiniciar Nginx |

---

## 🔗 Links Úteis

- **Repositório:** https://github.com/onlitec/OnliOps
- **Docker Hub Backend:** https://hub.docker.com/r/onlitec/onliops-backend
- **Docker Hub Frontend:** https://hub.docker.com/r/onlitec/onliops-frontend
- **Let's Encrypt:** https://letsencrypt.org/
- **Documentação Docker:** https://docs.docker.com/

---

## ✅ Checklist Final de Deploy

- [ ] Servidor Ubuntu 24.04 atualizado
- [ ] Docker e Docker Compose instalados
- [ ] DNS configurado e propagado
- [ ] Repositório clonado em `/opt/onliops`
- [ ] Arquivo `.env` configurado com senhas seguras
- [ ] Containers rodando (`docker compose ps`)
- [ ] Certificado SSL instalado
- [ ] Firewall configurado (UFW)
- [ ] Backup automatizado
- [ ] Acesso HTTPS funcionando: https://onliops.onlitec.com.br

---

**Documento criado automaticamente pela análise da plataforma OnliOps**  
**Última atualização:** 21/12/2025
