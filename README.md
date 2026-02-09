# 🌐 OnliOps - Network Management & Simulation Platform

> Plataforma web híbrida para gerenciamento de rede, inventário de equipamentos e sistema de simulação avançado

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646cff)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Sobre o Projeto

O **OnliOps** é uma plataforma web completa que combina:

- 📦 **Inventário de Equipamentos:** Gestão completa de dispositivos de infraestrutura (CFTV, rede, acesso)
- 🔧 **Gerenciamento de Rede:** Controle de dispositivos IoT, VLANs, switches, câmeras e NVRs
- 🧪 **Sistema de Simulação:** Modelagem e análise de cenários complexos com visualização em tempo real
- 📊 **Analytics:** Dashboard com métricas, relatórios e insights
- 🔐 **Autenticação RBAC:** Sistema completo de permissões baseado em roles

## 🚀 Início Rápido

### Para Desenvolvimento Local (Ubuntu 22.04)

```bash
# 1. Clone o repositório
cd /opt/calabasas

# 2. Execute o setup automático (primeira vez)
bash scripts/setup-local-dev.sh

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse no navegador
# http://localhost:5173 (desenvolvimento)
# https://172.20.120.28 (produção via Nginx)
```

**📖 Documentação completa:** Ver [`INICIO_RAPIDO.md`](INICIO_RAPIDO.md)

## 📚 Documentação

- **[RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)** - Visão geral e comandos principais
- **[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** - Guia de início rápido e referência diária
- **[PLANO_MIGRACAO_LOCAL.md](PLANO_MIGRACAO_LOCAL.md)** - Plano completo de migração local
- **[docs/GUIA_INVENTARIO.md](docs/GUIA_INVENTARIO.md)** - 📦 Guia completo do Módulo de Inventário
- **[CHANGELOG_INVENTARIO.md](CHANGELOG_INVENTARIO.md)** - Histórico de mudanças do Inventário
- **[.env.example](.env.example)** - Template de variáveis de ambiente

## 🏗️ Stack Tecnológico

### Frontend
- **Framework:** React 18.3.1 + TypeScript 5.8.3
- **Build Tool:** Vite 6.3.5
- **UI Library:** Material-UI 7.3.5
- **State Management:** Redux Toolkit 2.11.0
- **Roteamento:** React Router DOM 7.3.0
- **Estilização:** TailwindCSS 3.4.17 + Emotion
- **Gráficos:** Chart.js 4.5.1 + D3.js 7.9.0
- **3D Rendering:** Three.js 0.181.2

### Backend & Database
- **API principal:** Express.js (Node 20) com conexão direta ao PostgreSQL
- **BaaS opcional:** Supabase (PostgreSQL + Auth) — hoje usado principalmente como referência de schema e migrações
- **Database:** PostgreSQL 14+
- **Auth em produção local:** Endpoints próprios em `server/import-api.cjs` (login/registro + bcrypt), com Supabase Auth reservado para cenários futuros/alternativos

### DevOps
- **Hosting:** Vercel / Nginx (local)
- **Web Server:** Nginx
- **Package Manager:** npm 10.8.1
- **Node:** 20.x

## 🔧 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev          # Servidor de desenvolvimento (hot reload)
npm run build        # Build de produção
npm run preview      # Preview do build
npm run check        # Verificar tipos TypeScript
npm run lint         # Executar linter
```

### Automação (Ubuntu 22.04)
```bash
bash scripts/setup-local-dev.sh        # Setup completo automático
bash scripts/health-check-local.sh     # Verificar saúde do sistema
bash scripts/dev-local.sh              # Servidor dev com info
bash scripts/test-integration-local.sh # Testes de integração
```

### Banco de Dados
```bash
bash scripts/setup-postgres.sh         # Configurar PostgreSQL
bash scripts/apply-migrations.sh       # Aplicar migrações
bash scripts/backup-postgres.sh        # Backup do banco
```

### Nginx
```bash
bash scripts/setup-nginx.sh            # Configurar Nginx
bash scripts/monitor/check-services.sh # Monitorar serviços
```

## 📁 Estrutura do Projeto

```
/opt/calabasas/
├── src/
│   ├── components/      # Componentes React
│   │   ├── auth/       # Autenticação
│   │   ├── charts/     # Gráficos
│   │   ├── dashboard/  # Dashboard
│   │   └── inventory/  # 📦 Inventário (NOVO)
│   ├── pages/          # Páginas/rotas
│   │   └── Inventory.tsx  # Página de Inventário
│   ├── store/          # Redux Store
│   │   └── slices/     # 8 slices Redux
│   ├── services/       # Serviços (Auth, API)
│   ├── lib/            # Utilitários
│   └── hooks/          # Custom hooks
├── supabase/migrations/ # 17 migrações SQL (incluindo inventário)
├── scripts/            # Scripts de automação
│   └── verify-inventory.sh  # Verificação do inventário
├── dist/               # Build compilado
└── docs/               # Documentação
    └── GUIA_INVENTARIO.md  # Guia do Inventário
```

## 🔐 Sistema de Permissões (RBAC)

| Role | Permissões | Uso |
|------|-----------|-----|
| **admin** | Acesso total | Administrador |
| **simulation_admin** | CRUD simulações + analytics | Gestor |
| **simulation_analyst** | Criar/editar simulações | Analista |
| **simulation_viewer** | Visualizar apenas | Stakeholder |
| **security_operator** | Leitura limitada | Segurança |
| **technical_viewer** | Visualização técnica | Técnico |
| **guest** | Acesso básico | Convidado |

## 🗄️ Banco de Dados

### Tabelas Principais

**Rede:**
- `users` - Usuários e permissões
- `vlans` - Segmentação de rede
- `network_devices` - Dispositivos (câmeras, switches, etc) + campos de inventário
- `device_metrics` - Métricas em tempo real
- `device_connections` - Topologia de rede
- `alerts` - Sistema de alertas
- `maintenance_logs` - 📦 Histórico de manutenção (NOVO)

**Simulação:**
- `simulations` - Definições de simulação
- `simulation_runs` - Execuções
- `simulation_results` - Resultados
- `performance_metrics` - Métricas de performance
- `simulation_templates` - Biblioteca de templates
- `analytics_reports` - Relatórios

## 🔑 Configuração

### Variáveis de Ambiente

1. Copie o template:
```bash
cp .env.example .env
```

2. Edite `.env` com suas configurações:
```env
# Database
PGHOST=127.0.0.1
PGDATABASE=calabasas_local
PGUSER=calabasas_admin
PGPASSWORD=sua-senha-aqui

# Supabase
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-chave-aqui

# Application
VITE_LOCAL_IP=172.20.120.28
```

## 🧪 Testes

### Executar Testes
```bash
# Health check completo
bash scripts/health-check-local.sh

# Testes de integração
bash scripts/test-integration-local.sh

# Verificar conectividade
curl -k https://172.20.120.28
```

## 🐛 Troubleshooting

### Problemas Comuns

**1. Supabase não configurado**
```bash
npm install -g supabase
supabase init && supabase start
```

**2. Erro PostgreSQL**
```bash
sudo systemctl restart postgresql
```

**3. Nginx 403**
```bash
sudo chown -R www-data:www-data /opt/calabasas/dist
sudo systemctl restart nginx
```

**4. Build falha**
```bash
rm -rf node_modules dist
npm cache clean --force
npm install --legacy-peer-deps
```

**📖 Mais soluções:** Ver `PLANO_MIGRACAO_LOCAL.md` seção 9

## 📊 Status do Projeto

- ✅ Frontend React + TypeScript
- ✅ Sistema de autenticação RBAC
- ✅ Integração PostgreSQL + Supabase
- ✅ Dashboard com métricas
- ✅ Sistema de alertas
- ✅ Configuração Nginx
- ✅ Scripts de automação
- ✅ **Módulo de Inventário completo** 📦
- 🚧 Módulo de simulação (em desenvolvimento)
- 🚧 Integração com equipamentos reais
- 🚧 Analytics avançado

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Ver arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Desenvolvimento:** OnliOps Team
- **Infraestrutura:** Ubuntu 22.04 / Vercel
- **Database:** PostgreSQL + Supabase

## 📞 Suporte

- 📧 Email: suporte@onliops.local
- 📚 Docs: Ver pasta `docs/` e arquivos `.md` na raiz
- 🐛 Issues: Use o sistema de issues do repositório

---

**Última atualização:** 09/12/2025  
**Versão:** 1.1.0  
**Plataforma:** Ubuntu 22.04 (Local) / Vercel (Produção)
