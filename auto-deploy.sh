#!/bin/bash

# ============================================
# OnliOps - Auto Deploy Script
# ============================================
# Executado quando há push no GitHub
# ============================================

set -e  # Exit on error

APP_DIR="/home/alfreire/docker/apps/onliops"
LOG_FILE="/home/alfreire/docker/apps/onliops/deploy.log"
BACKUP_DIR="/home/alfreire/docker/apps/onliops/backups"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================="
log "🚀 Iniciando Auto-Deploy do OnliOps"
log "========================================="

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Navegar para o diretório da aplicação
cd "$APP_DIR"

# Fazer backup do banco antes do deploy
log "📦 Criando backup do banco de dados..."
docker exec onliops-database pg_dump -U onliops onliops > \
    "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || \
    log "⚠️  Backup falhou (pode ser primeira execução)"

# Verificar se há mudanças no repositório
log "🔍 Verificando atualizações no GitHub..."
git fetch origin main

# Verificar se há commits novos
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    log "✅ Já está na versão mais recente"
    exit 0
fi

log "📥 Novas atualizações encontradas!"
log "   Local:  $LOCAL"
log "   Remote: $REMOTE"

# Fazer pull das mudanças
log "⬇️  Baixando atualizações..."

# Descartar alterações locais (servidor de produção - nunca deve ter mudanças locais)
log "🧹 Descartando alterações locais (produção deve refletir repositório remoto)..."
git checkout . 2>&1 || true
git clean -fd 2>&1 || true

# Forçar sincronização com repositório remoto
git reset --hard origin/main

# Verificar se houve mudanças nos arquivos Docker
DOCKER_CHANGED=false
if git diff --name-only $LOCAL $REMOTE | grep -qE 'Dockerfile|docker-compose.yml|package.json|package-lock.json'; then
    DOCKER_CHANGED=true
    log "🔧 Detectadas mudanças nos arquivos Docker/dependências"
fi

# Rebuild e restart dos containers
if [ "$DOCKER_CHANGED" = true ]; then
    log "🔨 Fazendo rebuild dos containers..."
    docker compose down
    docker compose up -d --build
else
    log "🔄 Reiniciando containers..."
    docker compose restart
fi

# Aguardar containers ficarem healthy
log "⏳ Aguardando containers ficarem prontos..."
sleep 10

# Verificar se está tudo rodando
if docker ps | grep -q "onliops-web.*healthy" && \
   docker ps | grep -q "onliops-api.*healthy"; then
    log "✅ Deploy concluído com sucesso!"
    log "🌐 Aplicação disponível em: https://onliops.onlitec.com.br"
else
    log "❌ Erro no deploy - containers não estão healthy"
    log "📋 Verificar logs: docker compose logs -f"
    exit 1
fi

# Limpar backups antigos (manter últimos 7 dias)
log "🧹 Limpando backups antigos..."
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true

log "========================================="
log "✅ Auto-Deploy finalizado"
log "========================================="
