# 📱 Progressive Web App (PWA) - OnliOps

O OnliOps agora é um Progressive Web App (PWA) completo, permitindo instalação no dispositivo e uso offline.

## ✨ Funcionalidades

### 🔄 Atualização Automática
- O Service Worker atualiza automaticamente quando uma nova versão está disponível
- Notificações elegantes informam o usuário sobre novas versões
- Um clique para atualizar sem perder o estado atual

### 📲 Instalação
- Prompt de instalação aparece automaticamente em navegadores compatíveis
- Atalho na tela inicial do dispositivo
- Experiência de app nativo (sem barra de navegador)

### 🌐 Funcionamento Offline
- Cache inteligente de recursos estáticos
- Página offline elegante quando sem conexão
- Notificação automática quando offline/online
- Cache de API com NetworkFirst (5 min TTL)

### ⚡ Performance
- Cache de fontes Google (1 ano)
- Precaching de todos os assets
- Chunks otimizados para carregamento rápido

## 🛠️ Arquivos Criados/Modificados

### Configuração
- `vite.config.ts` - Plugin PWA com configurações completas

### Manifest & Ícones
- `public/icons/icon-192x192.svg` - Ícone 192x192
- `public/icons/icon-512x512.svg` - Ícone 512x512
- `public/icons/maskable-icon.svg` - Ícone maskable para Android
- `public/apple-touch-icon.svg` - Ícone para iOS

### Componentes React
- `src/components/PWAInstallPrompt.tsx` - Gerencia instalação, atualizações e status offline

### HTML
- `index.html` - Meta tags PWA, Open Graph, Twitter Cards
- `public/offline.html` - Página elegante para modo offline

## 📋 Manifest Features

```json
{
  "name": "OnliOps - Network Operations Platform",
  "short_name": "OnliOps",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0A0B0D",
  "background_color": "#0A0B0D",
  "categories": ["business", "productivity", "utilities"],
  "shortcuts": [
    { "name": "Dashboard", "url": "/dashboard" },
    { "name": "Monitoramento", "url": "/monitoring" },
    { "name": "Topologia", "url": "/topology" }
  ]
}
```

## 🔧 Configuração do Service Worker

### Estratégias de Cache

| Recurso | Estratégia | TTL |
|---------|------------|-----|
| Fontes Google | CacheFirst | 1 ano |
| Fontes Gstatic | CacheFirst | 1 ano |
| API `/api/*` | NetworkFirst | 5 min |
| Assets estáticos | Precache | Até próximo deploy |

## 🧪 Testando o PWA

### No Chrome DevTools
1. Abra DevTools (F12)
2. Vá para **Application** → **Manifest**
3. Verifique se todos os campos estão corretos
4. Em **Service Workers**, verifique se está ativo

### Lighthouse PWA Audit
1. DevTools → **Lighthouse**
2. Marque "Progressive Web App"
3. Clique "Analyze page load"

### Testando Instalação
1. Acesse a aplicação pelo celular ou Chrome desktop
2. Aguarde alguns segundos
3. Um banner de instalação deve aparecer
4. Ou use o ícone de instalação na barra de endereço

### Testando Offline
1. Instale o app
2. DevTools → **Network** → **Offline**
3. A página offline elegante deve aparecer

## 📝 Adicionando Screenshots (Opcional)

Para melhorar a experiência de instalação, adicione screenshots em:
- `public/screenshots/dashboard-wide.png` (1280x720)
- `public/screenshots/dashboard-mobile.png` (390x844)

## 🚀 Deploy

O PWA funciona automaticamente em produção. Certifique-se de:
1. HTTPS está ativo (obrigatório para PWA)
2. Os headers de cache estão corretos
3. O manifest está sendo servido corretamente

## 📖 Referências

- [Vite Plugin PWA](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
