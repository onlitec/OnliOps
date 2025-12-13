# Resumo Executivo: Planejamento Completo de Separação Multi-Tenant

**Data:** 2025-12-11  
**Versão:** 1.0  
**Autor:** OnliOps Development Team

---

## 📋 Visão Geral

Este documento consolida o planejamento completo para transformar a plataforma OnliOps em uma solução multi-tenant totalmente isolada, com dashboard global, navegação context-aware, sistema de permissões robusto e integrações com ferramentas de monitoramento e ticketing.

---

## 🎯 Objetivos Principais

1. **Dashboard Global:** Exibir cards de clientes/projetos com métricas resumidas
2. **Navegação Contextual:** Sidebar e recursos aparecem apenas quando projeto está selecionado
3. **Isolamento Total:** Cada projeto vê apenas seus próprios dados
4. **Permissões Granulares:** Sistema RBAC com controle de acesso por projeto
5. **Monitoramento:** Integração com Prometheus e Grafana
6. **Ticketing:** Integração com sistema de chamados (Zammad)

---

## 📚 Documentos de Planejamento

### 1. [Análise da Arquitetura Atual](file:///opt/calabasas/docs/planning/01_analise_arquitetura_atual.md)

**Conteúdo:**
- Estado atual da implementação multi-tenant
- Gaps identificados (banco de dados, backend, frontend)
- Análise de requisitos do usuário
- Arquitetura proposta
- Estimativas de esforço (72-102 horas)
- Fases de implementação

**Principais Descobertas:**
- ✅ Base multi-tenant sólida (tabelas, API, Redux)
- ❌ Dashboard não é context-aware
- ❌ Falta sistema de permissões
- ❌ Nenhuma integração externa implementada

---

### 2. [Planejamento: UI Context-Aware](file:///opt/calabasas/docs/planning/02_planejamento_ui_contextual.md)

**Prioridade:** Alta | **Fase:** 1 | **Tempo:** 12-18h

**Implementações:**
- **GlobalDashboard:** Página principal com cards de projetos e métricas da plataforma
- **ProjectCard:** Componente de card com métricas resumidas
- **ContextualSidebar:** Sidebar que aparece apenas com projeto selecionado
- **Breadcrumbs:** Navegação hierárquica (Plataforma > Cliente > Projeto > Página)
- **Novas Rotas:** `/` (global), `/p/:projectId/*` (projeto)

**Endpoints Backend:**
- `GET /api/platform/metrics` - Métricas globais
- `GET /api/platform/projects/summary` - Resumo de todos os projetos
- `GET /api/platform/charts/*` - Dados para gráficos

**Componentes Criados:**
- `GlobalDashboard.tsx`
- `ProjectGrid.tsx`
- `ProjectCard.tsx`
- `PlatformMetrics.tsx`
- `ContextualSidebar.tsx`
- `Breadcrumbs.tsx`

---

### 3. [Planejamento: Sistema de Permissões](file:///opt/calabasas/docs/planning/03_planejamento_permissoes.md)

**Prioridade:** Alta | **Fase:** 2 | **Tempo:** 16-24h

**Modelo RBAC:**
- **Platform Admin:** Acesso total
- **Client Admin:** Acesso a todos os projetos do cliente
- **Project Manager:** Acesso total ao projeto específico
- **Project Viewer:** Somente leitura

**Tabelas de Banco de Dados:**
```sql
roles (id, name, description, permissions)
user_permissions (id, user_id, role_id, client_id, project_id)
```

**Middleware de Autorização:**
```javascript
checkPermission(resource, action)
```

**Endpoints:**
- `GET /api/roles` - Listar roles
- `GET /api/users/:userId/permissions` - Permissões do usuário
- `POST /api/users/:userId/permissions` - Atribuir permissão
- `GET /api/auth/check-permission` - Verificar permissão

**Frontend:**
- Hook `usePermissions()`
- Componente `ProtectedAction`
- Página `UserManagement`

---

### 4. [Planejamento: Integração Prometheus/Grafana](file:///opt/calabasas/docs/planning/04_planejamento_integracao_prometheus_grafana.md)

**Prioridade:** Alta | **Fase:** 3 | **Tempo:** 12-16h

**Arquitetura:**
```
OnliOps → Prometheus Exporter → Prometheus → Grafana
```

**Métricas Customizadas:**
- `onliops_devices_total` - Dispositivos por projeto
- `onliops_alerts_total` - Alertas por severidade
- `onliops_api_requests_total` - Requisições de API
- `onliops_api_latency_seconds` - Latência de API

**Dashboards Grafana:**
- **Platform Overview:** Métricas globais da plataforma
- **Project Dashboard:** Métricas específicas por projeto (com variável `$project`)

**Implementação:**
- Biblioteca `prom-client` para Node.js
- Endpoint `/metrics` para Prometheus scraping
- Configuração `prometheus.yml` com scrape interval de 15s
- Regras de alerta para alertas críticos e alta latência

**Frontend:**
- Componente `GrafanaDashboard` (embed via iframe)
- Página `Monitoring` com tabs

---

### 5. [Planejamento: Integração Ticketing](file:///opt/calabasas/docs/planning/05_planejamento_integracao_ticketing.md)

**Prioridade:** Média | **Fase:** 4 | **Tempo:** 16-20h

**Sistema Escolhido:** **Zammad** (open source, API REST, multi-tenant)

**Funcionalidades:**
- Criar ticket a partir de alerta
- Listar tickets do projeto
- Adicionar comentários
- Webhook para receber atualizações
- **Automação:** Criar ticket automaticamente para alertas críticos

**Tabela de Banco de Dados:**
```sql
tickets (id, zammad_ticket_id, project_id, alert_id, device_id, title, status, priority)
```

**Endpoints:**
- `POST /api/tickets/from-alert/:alertId` - Criar ticket de alerta
- `GET /api/tickets` - Listar tickets do projeto
- `POST /api/tickets/:id/comments` - Adicionar comentário
- `POST /api/webhooks/zammad` - Receber atualizações

**Frontend:**
- Página `Tickets`
- Componente `CreateTicketButton`

**Automação:**
- Trigger PostgreSQL para alertas críticos
- Listener Node.js via `pg_notify`
- Criação automática de ticket

---

## 🗓️ Roadmap de Implementação

### **Fase 1: UI Context-Aware** (Semana 1-2)
**Prioridade:** 🔴 Alta  
**Tempo:** 12-18 horas

- [ ] Criar `GlobalDashboard` com cards de projetos
- [ ] Implementar `ContextualSidebar` (aparece só com projeto)
- [ ] Adicionar breadcrumbs
- [ ] Criar endpoints de métricas da plataforma
- [ ] Atualizar rotas (`/` global, `/p/:projectId/*`)
- [ ] Testar navegação e contexto

**Entregável:** Dashboard global funcional com navegação context-aware

---

### **Fase 2: Sistema de Permissões** (Semana 2-3)
**Prioridade:** 🔴 Alta  
**Tempo:** 16-24 horas

- [ ] Criar tabelas `roles` e `user_permissions`
- [ ] Implementar middleware `checkPermission`
- [ ] Aplicar middleware em todos os endpoints
- [ ] Criar endpoints de gerenciamento de permissões
- [ ] Criar hook `usePermissions` e componente `ProtectedAction`
- [ ] Criar página `UserManagement`
- [ ] Testar isolamento e controle de acesso

**Entregável:** Sistema RBAC completo e funcional

---

### **Fase 3: Monitoramento** (Semana 3-4)
**Prioridade:** 🔴 Alta  
**Tempo:** 12-16 horas

- [ ] Instalar e configurar Prometheus
- [ ] Implementar Prometheus Exporter no Node.js
- [ ] Criar métricas customizadas
- [ ] Instalar e configurar Grafana
- [ ] Criar dashboards (global e por projeto)
- [ ] Configurar regras de alerta
- [ ] Criar página `Monitoring` no frontend
- [ ] Testar coleta e visualização de métricas

**Entregável:** Monitoramento em tempo real com Prometheus e Grafana

---

### **Fase 4: Ticketing** (Semana 4-5)
**Prioridade:** 🟡 Média  
**Tempo:** 16-20 horas

- [ ] Instalar Zammad via Docker
- [ ] Criar cliente Zammad no Node.js
- [ ] Criar tabela `tickets`
- [ ] Implementar endpoints de tickets
- [ ] Criar automação para alertas críticos
- [ ] Criar página `Tickets` no frontend
- [ ] Configurar webhook do Zammad
- [ ] Testar criação manual e automática de tickets

**Entregável:** Integração completa com sistema de chamados

---

## 📊 Estimativas Consolidadas

| Fase | Componente | Tempo Estimado | Prioridade |
|------|-----------|----------------|------------|
| 1 | UI Context-Aware | 12-18h | Alta |
| 2 | Sistema de Permissões | 16-24h | Alta |
| 3 | Monitoramento (Prometheus/Grafana) | 12-16h | Alta |
| 4 | Ticketing (Zammad) | 16-20h | Média |
| **TOTAL** | | **56-78 horas** | **~2-3 semanas** |

---

## 🎯 Critérios de Sucesso

### Fase 1 - UI Context-Aware
- ✅ Dashboard global exibe cards de todos os projetos
- ✅ Sidebar aparece apenas quando projeto está selecionado
- ✅ Breadcrumbs funcionam corretamente
- ✅ Métricas da plataforma são exibidas

### Fase 2 - Permissões
- ✅ Platform Admin tem acesso total
- ✅ Client Admin só acessa seus clientes
- ✅ Project Viewer não pode editar
- ✅ Isolamento entre projetos é garantido

### Fase 3 - Monitoramento
- ✅ Prometheus coleta métricas a cada 15s
- ✅ Dashboards Grafana funcionam
- ✅ Alertas são disparados corretamente
- ✅ Métricas por projeto são isoladas

### Fase 4 - Ticketing
- ✅ Tickets podem ser criados manualmente
- ✅ Tickets são criados automaticamente para alertas críticos
- ✅ Comentários funcionam
- ✅ Webhook atualiza status

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking changes em rotas | Média | Alto | Manter rotas antigas com redirect |
| Performance com muitos projetos | Baixa | Médio | Paginação e cache |
| Complexidade de permissões | Alta | Alto | Começar com RBAC simples |
| Integração Prometheus falhar | Média | Médio | Modo degradado sem métricas |
| Zammad não escalar | Baixa | Médio | Considerar alternativas |

---

## 🔧 Decisões Técnicas

### Confirmadas
- ✅ Sistema de Permissões: **RBAC** (simples e eficaz)
- ✅ Sistema de Ticketing: **Zammad** (open source, API REST)
- ✅ Monitoramento: **Prometheus + Grafana** (padrão da indústria)

### Pendentes de Validação
- ⏳ Armazenamento de métricas: PostgreSQL ou TimescaleDB?
- ⏳ Cache: Redis para métricas agregadas?
- ⏳ Autenticação Grafana: SSO ou API keys?

---

## 📁 Estrutura de Arquivos Criados

```
/opt/calabasas/docs/planning/
├── 01_analise_arquitetura_atual.md
├── 02_planejamento_ui_contextual.md
├── 03_planejamento_permissoes.md
├── 04_planejamento_integracao_prometheus_grafana.md
├── 05_planejamento_integracao_ticketing.md
└── 00_resumo_executivo.md (este arquivo)
```

---

## 🚀 Próximos Passos Imediatos

1. **Validar Planejamento:** Revisar documentos com stakeholders
2. **Priorizar Fases:** Confirmar ordem de implementação
3. **Alocar Recursos:** Definir equipe e timeline
4. **Iniciar Fase 1:** Começar implementação do Dashboard Global

---

## 📞 Contato e Suporte

Para dúvidas ou sugestões sobre este planejamento:
- **Email:** dev@onliops.local
- **Documentação:** `/opt/calabasas/docs/planning/`

---

**Conclusão:**

Este planejamento fornece um roadmap completo e detalhado para transformar a plataforma OnliOps em uma solução multi-tenant robusta, com isolamento total de dados, sistema de permissões granular e integrações com ferramentas essenciais de monitoramento e ticketing. A implementação está dividida em 4 fases bem definidas, com estimativas realistas e critérios de sucesso claros.

**Status:** ✅ Planejamento Completo - Pronto para Implementação
