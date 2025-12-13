#!/usr/bin/env bash
set -euo pipefail

SERVER_NAME=""
SITE_ROOT="/opt/calabasas/dist"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --server-name) SERVER_NAME="$2"; shift 2;;
    --site-root) SITE_ROOT="$2"; shift 2;;
    *) echo "Parâmetro desconhecido: $1"; exit 1;;
  esac
done

if [[ -z "$SERVER_NAME" ]]; then
  echo "Uso: $0 --server-name <domínio> [--site-root /opt/calabasas/dist]"; exit 1
fi

echo "Instalando Nginx..."
sudo apt-get update -y
sudo apt-get install -y nginx

SSL_DIR="/etc/ssl/local"
sudo mkdir -p "$SSL_DIR"
if [[ ! -f "$SSL_DIR/${SERVER_NAME}.crt" ]]; then
  echo "Gerando certificado autoassinado..."
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/${SERVER_NAME}.key" \
    -out "$SSL_DIR/${SERVER_NAME}.crt" \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=LocalDev/OU=IT/CN=${SERVER_NAME}"
fi

SITE_CONF="/etc/nginx/sites-available/network_platform.conf"
echo "Escrevendo configuração do site..."
sudo tee "$SITE_CONF" >/dev/null <<'EOF'
server {
  listen 80;
  server_name SERVER_NAME_PLACEHOLDER;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name SERVER_NAME_PLACEHOLDER;

  ssl_certificate     SSL_DIR_PLACEHOLDER/SERVER_NAME_PLACEHOLDER.crt;
  ssl_certificate_key SSL_DIR_PLACEHOLDER/SERVER_NAME_PLACEHOLDER.key;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  root SITE_ROOT_PLACEHOLDER;
  index index.html;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  location / {
    try_files URI_PLACEHOLDER URI_PLACEHOLDER/ /index.html;
  }
}
EOF

# Substituir placeholders
sudo sed -i "s|SERVER_NAME_PLACEHOLDER|${SERVER_NAME}|g" "$SITE_CONF"
sudo sed -i "s|SSL_DIR_PLACEHOLDER|${SSL_DIR}|g" "$SITE_CONF"
sudo sed -i "s|SITE_ROOT_PLACEHOLDER|${SITE_ROOT}|g" "$SITE_CONF"
sudo sed -i 's|URI_PLACEHOLDER|$uri|g' "$SITE_CONF"

sudo ln -sf "$SITE_CONF" /etc/nginx/sites-enabled/network_platform.conf
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
echo "Nginx configurado para ${SERVER_NAME} servindo ${SITE_ROOT}"

