# Planejamento de Deploy em Produção (Docker VPS)

Este documento descreve a arquitetura e os passos necessários para implantar a plataforma OnliOps em um ambiente de produção VPS utilizando Docker e Docker Compose.

## 1. Arquitetura da Solução

A aplicação será dividida em 3 containers principais orquestrados pelo Docker Compose:

### A. Serviço: `frontend` (React + Vite)
- **Base Image**: `nginx:alpine` (Leve e performático).
- **Processo de Build**: "Multi-stage build".
    1.  **Stage Build**: Imagem Node.js para compilar o projeto (`npm run build`).
    2.  **Stage Run**: Imagem Nginx para servir os arquivos estáticos gerados em `dist/`.
- **Configuração**: Arquivo `nginx.conf` customizado para lidar com rotas de SPA (React Router) e Proxy Reverso para a API.

### B. Serviço: `backend` (Node.js API)
- **Base Image**: `node:18-alpine`.
- **Contexto**: Pasta `./server`.
- **Otimização**: Instalação apenas de dependências de produção.
- **Persistência**: Volume para uploads (`/uploads`).

### C. Serviço: `database` (PostgreSQL)
- **Base Image**: `postgres:15-alpine`.
- **Persistência**: Volume Docker nomeado para garantir que os dados sobrevivam a reinicializações (`postgres_data`).
- **Backup**: Script de backup automático no host.

---

## 2. Estrutura de Arquivos Necessária

Precisaremos criar os seguintes arquivos na raiz do projeto:

1.  `Dockerfile.frontend`: Define como construir a imagem do React.
2.  `Dockerfile.backend`: Define como construir a imagem da API.
3.  `docker-compose.yml`: Define os serviços, redes e comunicação.
4.  `ops/nginx/prod.conf`: Configuração do Nginx para produção (gzip, cache, rotas).
5.  `.env.production`: Variáveis de ambiente específicas para o ambiente Docker.

## 3. Roteiro de Implementação

### Passo 1: Criar o Dockerfile do Backend
- Isolar o servidor.
- Copiar `package.json` e instalar deps.
- Expor porta 3001.

### Passo 2: Criar o Dockerfile do Frontend
- Buildar o app React (gerar HTML/CSS/JS estáticos).
- Copiar para a pasta do Nginx.
- Configurar o Nginx para redirecionar `/api` para o container do backend.

### Passo 3: Configurar o Docker Compose
- Definir serviço postgres (com senha via .env).
- Definir serviço backend (depende do postgres).
- Definir serviço frontend (depende do backend).
- Configurar restart policies (`always` ou `unless-stopped`).

### Passo 4: Migração de Dados
- Como exportar o banco local (`pg_dump`).
- Como importar no volume do Docker na VPS (`pg_restore` ou script de init).

### Passo 5: Deploy na VPS
1.  Provisionar VPS (Ubuntu 22.04/24.04 recomendado).
2.  Instalar Docker e Docker Compose.
3.  Clonar repositório.
4.  Configurar `.env`.
5.  Executar `docker compose up -d --build`.

## 4. Segurança e Domínio (Opcional)

Para acesso HTTPS (SSL) e domínio próprio (ex: `app.onliopps.com`), recomenda-se adicionar um container de Proxy Reverso na frente:
- **Nginx Proxy Manager** (Interface gráfica fácil).
- **Traefik** (Automático via labels).
- **Caddy** (SSL automático simples).

---

## 5. Próximos Passos (Imediato)

Deseja que eu comece a criar os arquivos de configuração (`Dockerfiles` e `docker-compose.yml`) agora para deixarmos o projeto pronto para o deploy?
