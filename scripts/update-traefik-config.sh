#!/bin/bash
# ============================================
# Script para atualizar configuração do Traefik
# após deploy do OnliOps no Coolify
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[OnliOps] Atualizando configuração do Traefik...${NC}"

# Pegar o nome do container frontend mais recente
FRONTEND_CONTAINER=$(docker ps --filter "name=frontend-icww0c48c8k8cw0o4088scgk" --format "{{.Names}}" | head -1)

if [ -z "$FRONTEND_CONTAINER" ]; then
    echo -e "${RED}[ERRO] Container frontend não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Container frontend: $FRONTEND_CONTAINER${NC}"

# Pegar o IP do frontend na rede do compose
NETWORK_NAME="icww0c48c8k8cw0o4088scgk"
NEW_IP=$(docker inspect "$FRONTEND_CONTAINER" --format "{{range \$k, \$v := .NetworkSettings.Networks}}{{if eq \$k \"$NETWORK_NAME\"}}{{\$v.IPAddress}}{{end}}{{end}}")

if [ -z "$NEW_IP" ]; then
    echo -e "${RED}[ERRO] Não foi possível obter o IP do frontend!${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] IP do frontend: $NEW_IP${NC}"

# Conectar o frontend à rede traefik_proxy (se não estiver)
docker network connect traefik_proxy "$FRONTEND_CONTAINER" 2>/dev/null || true

# Atualizar a configuração dinâmica do Traefik
CONFIG_FILE="/data/coolify/proxy/dynamic/onliops.yml"

cat > "$CONFIG_FILE" << EOF
http:
  routers:
    onliops-http:
      rule: "Host(\`onliops.onlitec.com.br\`)"
      entryPoints:
        - http
      middlewares:
        - redirect-to-https
      service: onliops-service

    onliops-https:
      rule: "Host(\`onliops.onlitec.com.br\`)"
      entryPoints:
        - https
      middlewares:
        - gzip
      service: onliops-service
      tls:
        certResolver: letsencrypt

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
    gzip:
      compress: true

  services:
    onliops-service:
      loadBalancer:
        servers:
          - url: "http://${NEW_IP}:80"
EOF

echo -e "${GREEN}[OK] Configuração atualizada em $CONFIG_FILE${NC}"

# Verificar se o Traefik pode acessar
echo -e "${YELLOW}[OnliOps] Testando conexão...${NC}"
sleep 2
if curl -s -k --connect-timeout 5 https://onliops.onlitec.com.br | head -1 | grep -q "doctype"; then
    echo -e "${GREEN}[OK] Site acessível em https://onliops.onlitec.com.br${NC}"
else
    echo -e "${YELLOW}[AVISO] O site pode levar alguns segundos para responder${NC}"
fi

echo -e "${GREEN}[OnliOps] Configuração do Traefik atualizada com sucesso!${NC}"
