# Análise da Arquitetura Multi-Tenant Atual

**Data:** 2025-12-11  
**Versão:** 1.0  
**Status:** Análise Completa

---

## 1. Estado Atual da Implementação

### 1.1 Banco de Dados

#### Estrutura Multi-Tenant Existente
```sql
-- Tabelas de hierarquia
clients (id, name, logo_url, created_at, updated_at)
projects (id, client_id, name, description, status, created_at, updated_at)

-- Tabelas com project_id
network_devices (id, ..., project_id)
vlans (vlan_id, ..., project_id)
alerts (id, ..., project_id)
simulations (id, ..., project_id)
device_connections (id, ..., project_id)
audit_logs (id, ..., project_id)

-- Tabelas globais (sem project_id)
users (id, email, password_hash, ...)
categories (slug, name, icon, ...)
settings (key, value, ...)
login_logs (id, user_id, ...)
```

#### Gaps Identificados
- ❌ **Falta relação users ↔ projects** (permissões)
- ❌ **Categories não são por projeto** (deveria ser?)
- ❌ **Settings globais** (alguns deveriam ser por projeto)
- ❌ **Falta tabela de métricas agregadas por projeto**

### 1.2 Backend API

#### Implementação Atual
- ✅ Middleware que injeta `req.projectId` via header `X-Project-ID`
- ✅ Endpoints de clientes/projetos (`/api/clients`, `/api/projects`)
- ✅ Filtragem por `project_id` em recursos (devices, vlans, topology, logs)
- ✅ Default project fallback

#### Gaps Identificados
- ❌ **Falta validação de permissões** (usuário pode acessar qualquer projeto)
- ❌ **Falta endpoints de métricas agregadas**
- ❌ **Falta endpoints de dashboard global**
- ❌ **Falta integração com sistemas externos** (Prometheus, Grafana, Ticketing)

### 1.3 Frontend

#### Implementação Atual
- ✅ Redux slice para gerenciar contexto de projeto (`projectSlice`)
- ✅ Página `ClientList` para seleção de cliente/projeto
- ✅ Header mostra projeto atual com botão "Alterar Projeto"
- ✅ API service injeta header `X-Project-ID`

#### Gaps Identificados
- ❌ **Dashboard principal não mostra cards de clientes/projetos**
- ❌ **Sidebar sempre visível** (deveria aparecer só com projeto selecionado)
- ❌ **Falta dashboard global com métricas da plataforma**
- ❌ **Falta indicador visual claro de contexto**
- ❌ **Navegação não é context-aware**

---

## 2. Análise de Requisitos do Usuário

### 2.1 Dashboard Principal (Sem Contexto)

**Requisitos:**
1. Exibir **cards de clientes/projetos** (grid de cards clicáveis)
2. Cada card deve mostrar:
   - Nome do cliente
   - Nome do projeto
   - Status
   - Métricas resumidas (dispositivos, alertas, etc.)
3. **Métricas da plataforma** (abaixo dos cards):
   - Total de clientes
   - Total de projetos
   - Total de dispositivos (todos os projetos)
   - Total de alertas ativos
   - Uptime da plataforma
   - Gráficos de uso

**Estado Atual:**
- ❌ Não implementado
- Rota `/` redireciona para `/clients`
- `ClientList` é uma lista simples, não um dashboard

### 2.2 Sidebar Contextual

**Requisitos:**
1. **Sem projeto selecionado:** Sidebar NÃO deve mostrar menu de recursos
2. **Com projeto selecionado:** Sidebar deve mostrar:
   - Dashboard (do projeto)
   - Dispositivos (categorias)
   - VLANs
   - Topologia
   - Categorias
   - Configurações (do projeto)

**Estado Atual:**
- ❌ Sidebar sempre visível com todos os itens
- Não há lógica condicional baseada em contexto

### 2.3 Navegação entre Contextos

**Requisitos:**
1. Botão/menu para **sair do projeto** e voltar ao dashboard global
2. Botão/menu para **trocar de projeto** sem sair
3. Breadcrumbs mostrando: `Plataforma > Cliente > Projeto > Página`

**Estado Atual:**
- ✅ Botão "Alterar Projeto" existe no header
- ❌ Não há breadcrumbs
- ❌ Não há menu dropdown para troca rápida

### 2.4 Integrações Externas

**Requisitos:**
1. **Sistema de Chamados (Ticketing):**
   - Criar tickets a partir de alertas
   - Visualizar tickets relacionados a dispositivos
   - Integração via API (ex: osTicket, Zammad, GLPI)

2. **Prometheus:**
   - Coletar métricas de dispositivos
   - Exportar métricas da plataforma
   - Configurar targets por projeto

3. **Grafana:**
   - Dashboards por projeto
   - Dashboards globais da plataforma
   - Autenticação SSO (opcional)

**Estado Atual:**
- ❌ Nenhuma integração implementada

---

## 3. Arquitetura Proposta

### 3.1 Hierarquia de Navegação

```
┌─────────────────────────────────────────┐
│   DASHBOARD GLOBAL (sem contexto)       │
│   - Cards de Clientes/Projetos          │
│   - Métricas da Plataforma              │
│   - Sidebar: Apenas "Início" e "Admin"  │
└─────────────────────────────────────────┘
              │
              │ (Seleciona Projeto)
              ▼
┌─────────────────────────────────────────┐
│   DASHBOARD DO PROJETO (com contexto)   │
│   - Métricas do Projeto                 │
│   - Sidebar: Todos os recursos          │
│   - Header: Cliente > Projeto [Sair]    │
└─────────────────────────────────────────┘
```

### 3.2 Estrutura de Rotas

```
/                          → Dashboard Global (cards de projetos)
/admin                     → Administração da plataforma
/admin/users               → Gerenciar usuários
/admin/integrations        → Configurar integrações

/p/:projectId/dashboard    → Dashboard do projeto
/p/:projectId/devices/:cat → Dispositivos por categoria
/p/:projectId/vlans        → VLANs do projeto
/p/:projectId/topology     → Topologia do projeto
/p/:projectId/settings     → Configurações do projeto
/p/:projectId/tickets      → Chamados do projeto
```

### 3.3 Componentes de UI

```
GlobalDashboard
├── ProjectGrid (cards clicáveis)
│   └── ProjectCard (nome, métricas, status)
├── PlatformMetrics (totais, gráficos)
└── QuickActions (criar cliente, criar projeto)

ProjectDashboard
├── ProjectHeader (breadcrumbs, botão sair)
├── ProjectMetrics (métricas específicas)
├── RecentAlerts
├── DeviceStatus
└── QuickLinks
```

---

## 4. Gaps Críticos a Resolver

### 4.1 Banco de Dados

| Gap | Prioridade | Impacto |
|-----|-----------|---------|
| Tabela `user_project_permissions` | Alta | Segurança |
| Métricas agregadas por projeto | Média | Performance |
| Settings por projeto | Média | Flexibilidade |
| Histórico de métricas | Baixa | Analytics |

### 4.2 Backend

| Gap | Prioridade | Impacto |
|-----|-----------|---------|
| Sistema de permissões | Alta | Segurança |
| Endpoints de métricas | Alta | Dashboard |
| Integração Prometheus | Alta | Monitoramento |
| Integração Ticketing | Média | Operações |
| Integração Grafana | Média | Visualização |

### 4.3 Frontend

| Gap | Prioridade | Impacto |
|-----|-----------|---------|
| Dashboard Global | Alta | UX |
| Sidebar Contextual | Alta | UX |
| Breadcrumbs | Média | Navegação |
| Seletor de Projeto | Média | UX |
| Tela de Tickets | Média | Operações |

---

## 5. Estimativas de Esforço

### 5.1 Por Componente

| Componente | Complexidade | Tempo Estimado |
|-----------|--------------|----------------|
| Dashboard Global | Média | 8-12h |
| Sidebar Contextual | Baixa | 4-6h |
| Sistema de Permissões | Alta | 16-24h |
| Integração Prometheus | Alta | 12-16h |
| Integração Grafana | Média | 8-12h |
| Integração Ticketing | Alta | 16-20h |
| Métricas Agregadas | Média | 8-12h |

**Total Estimado:** 72-102 horas (~2-3 semanas)

### 5.2 Fases de Implementação

**Fase 1: UI Context-Aware (Prioridade Alta)**
- Dashboard Global
- Sidebar Contextual
- Breadcrumbs e Navegação

**Fase 2: Segurança e Permissões (Prioridade Alta)**
- Tabela de permissões
- Middleware de autorização
- UI de gerenciamento de usuários

**Fase 3: Monitoramento (Prioridade Alta)**
- Integração Prometheus
- Integração Grafana
- Métricas agregadas

**Fase 4: Operações (Prioridade Média)**
- Integração com sistema de chamados
- Automações e workflows

---

## 6. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking changes em rotas | Média | Alto | Manter rotas antigas com redirect |
| Performance com muitos projetos | Baixa | Médio | Paginação e cache |
| Complexidade de permissões | Alta | Alto | Começar com modelo simples (RBAC) |
| Integração Prometheus falhar | Média | Médio | Modo degradado sem métricas |

---

## 7. Decisões Técnicas Pendentes

1. **Sistema de Ticketing:** Qual ferramenta? (osTicket, Zammad, GLPI, custom?)
2. **Autenticação Grafana:** SSO ou API keys?
3. **Modelo de Permissões:** RBAC simples ou ACL granular?
4. **Métricas:** Armazenar no PostgreSQL ou usar TimescaleDB?
5. **Cache:** Redis para métricas agregadas?

---

## 8. Próximos Passos

1. ✅ Criar planejamentos detalhados por área
2. ⏳ Validar decisões técnicas com stakeholder
3. ⏳ Priorizar fases de implementação
4. ⏳ Iniciar Fase 1 (UI Context-Aware)

---

**Conclusão:**

A base multi-tenant está sólida, mas precisa de refinamentos significativos para atender aos requisitos de isolamento total e integrações externas. O foco inicial deve ser na experiência do usuário (Dashboard Global + Sidebar Contextual) seguido por segurança (permissões) e monitoramento (Prometheus/Grafana).
