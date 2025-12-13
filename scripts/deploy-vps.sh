#!/bin/bash
# ============================================
# OnliOps - VPS Deployment Script
# ============================================
# Run this script on a fresh Ubuntu 22.04+ VPS
# Usage: curl -sSL https://raw.githubusercontent.com/onlitec/OnliOps/main/scripts/deploy-vps.sh | bash
# ============================================

set -e

echo "============================================"
echo "  OnliOps - VPS Deployment Script"
echo "============================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}[1/6] Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

# Install Docker
echo -e "${YELLOW}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker already installed"
fi

# Install Docker Compose (v2 plugin)
echo -e "${YELLOW}[3/6] Installing Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
else
    echo "Docker Compose already installed"
fi

# Create app directory
echo -e "${YELLOW}[4/6] Setting up application...${NC}"
APP_DIR="/opt/onliops"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
if [ ! -d ".git" ]; then
    git clone https://github.com/onlitec/OnliOps.git .
else
    git pull origin main
fi

# Create .env file if not exists
echo -e "${YELLOW}[5/6] Configuring environment...${NC}"
if [ ! -f ".env" ]; then
    cp .env.production.example .env
    
    # Generate secure password
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    sed -i "s/YOUR_SECURE_PASSWORD_HERE/$DB_PASSWORD/" .env
    
    echo -e "${GREEN}Environment file created!${NC}"
    echo -e "${YELLOW}Please edit /opt/onliops/.env to add your OpenAI API key (optional)${NC}"
else
    echo ".env file already exists"
fi

# Build and start containers
echo -e "${YELLOW}[6/6] Building and starting containers...${NC}"
docker compose up -d --build

# Wait for services
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check status
echo ""
echo "============================================"
echo -e "${GREEN}  Deployment Complete! 🚀${NC}"
echo "============================================"
echo ""
docker compose ps
echo ""
echo -e "${GREEN}Access the application at:${NC}"
echo "  http://$(curl -s ifconfig.me)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Set up SSL with: docker run -d certbot/certbot ..."
echo "  3. Edit /opt/onliops/.env if you need to change settings"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  docker compose logs -f    # View logs"
echo "  docker compose restart    # Restart services"
echo "  docker compose down       # Stop services"
echo ""
