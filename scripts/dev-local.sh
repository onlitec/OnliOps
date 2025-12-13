#!/usr/bin/env bash
set -euo pipefail

# Carregar variáveis de ambiente
if [[ -f ".env" ]]; then
  source .env
else
  echo "❌ Arquivo .env não encontrado"
  exit 1
fi

echo "🚀 Iniciando servidor de desenvolvimento Calabasas..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📍 Modo: DESENVOLVIMENTO (Hot Reload)"
echo "  🌐 URL Local: http://localhost:5173"
echo "  🌍 URL Rede: http://$VITE_LOCAL_IP:5173"
echo "  🗄️  Database: $PGDATABASE @ $PGHOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Dicas:"
echo "   • Hot reload habilitado - mudanças aparecem automaticamente"
echo "   • Pressione Ctrl+C para parar"
echo "   • Para build de produção: npm run build"
echo ""

# Iniciar Vite dev server
npm run dev -- --host 0.0.0.0 --port 5173
