# Planejamento: Dashboard Global e UI Context-Aware

**Documento:** 02 - UI Context-Aware  
**Prioridade:** Alta  
**Fase:** 1  
**Tempo Estimado:** 12-18 horas

---

## 1. Objetivo

Implementar um dashboard global que exibe cards de clientes/projetos e métricas da plataforma, além de tornar a sidebar e navegação context-aware (aparecem apenas quando um projeto está selecionado).

---

## 2. Requisitos Funcionais

### 2.1 Dashboard Global (`/`)

**Quando:** Usuário não tem projeto selecionado

**Deve exibir:**
1. **Grid de Cards de Projetos**
   - Card por projeto (não por cliente)
   - Informações do card:
     - Nome do Cliente (badge/tag)
     - Nome do Projeto (título)
     - Status (ativo/inativo/manutenção)
     - Métricas rápidas:
       - Total de dispositivos
       - Alertas ativos
       - Última atualização
     - Botão "Acessar"
   - Ordenação: alfabética ou por último acesso
   - Filtro por cliente
   - Busca por nome

2. **Métricas da Plataforma** (abaixo dos cards)
   - Cards de estatísticas:
     - Total de Clientes
     - Total de Projetos
     - Total de Dispositivos (todos)
     - Alertas Ativos (todos)
     - Uptime da Plataforma
   - Gráficos:
     - Dispositivos por projeto (top 10)
     - Alertas por severidade
     - Atividade recente (timeline)

3. **Ações Rápidas**
   - Botão "Novo Cliente"
   - Botão "Novo Projeto"
   - Link para Administração

### 2.2 Sidebar Contextual

**Comportamento:**

| Contexto | Sidebar Visível? | Itens Exibidos |
|----------|------------------|----------------|
| Sem projeto | ❌ Não | N/A |
| Com projeto | ✅ Sim | Dashboard, Dispositivos, VLANs, Topologia, Categorias, Configurações |

**Implementação:**
- Componente `MainLayout` verifica `currentProject` do Redux
- Se `null`: renderiza apenas header com logo e botão de admin
- Se definido: renderiza sidebar completa

### 2.3 Header Contextual

**Sem projeto selecionado:**
```
[Logo OnliOps]                    [Admin] [User Menu]
```

**Com projeto selecionado:**
```
[Logo] Cliente > Projeto [Sair]   [Admin] [User Menu]
```

### 2.4 Breadcrumbs

Adicionar breadcrumbs em todas as páginas com projeto:
```
Plataforma > Cliente X > Projeto Y > Dashboard
Plataforma > Cliente X > Projeto Y > Dispositivos > Câmeras
```

---

## 3. Estrutura de Componentes

### 3.1 Novos Componentes

```
src/pages/
├── GlobalDashboard.tsx          ← NOVO (dashboard principal)
└── ProjectDashboard.tsx         ← NOVO (dashboard do projeto)

src/components/dashboard/
├── ProjectGrid.tsx              ← NOVO (grid de cards)
├── ProjectCard.tsx              ← NOVO (card individual)
├── PlatformMetrics.tsx          ← NOVO (métricas globais)
└── PlatformCharts.tsx           ← NOVO (gráficos)

src/components/layout/
├── ContextualSidebar.tsx        ← NOVO (sidebar condicional)
├── ContextualHeader.tsx         ← NOVO (header condicional)
└── Breadcrumbs.tsx              ← NOVO (navegação)
```

### 3.2 Componentes a Modificar

```
src/components/MainLayout.tsx    ← Refatorar para usar componentes contextuais
src/App.tsx                      ← Atualizar rotas
src/pages/ClientList.tsx         ← Mover para /admin/clients
```

---

## 4. Estrutura de Rotas

### 4.1 Novas Rotas

```typescript
// Rotas globais (sem projeto)
/                                → GlobalDashboard
/admin                           → AdminPanel
/admin/clients                   → ClientList (atual)
/admin/users                     → UserManagement
/admin/integrations              → IntegrationsConfig

// Rotas de projeto (com contexto)
/p/:projectId/dashboard          → ProjectDashboard
/p/:projectId/devices/:category  → DeviceList
/p/:projectId/vlans              → VlanManager
/p/:projectId/topology           → Topology
/p/:projectId/settings           → Settings
/p/:projectId/settings/categories → CategoryManager
```

### 4.2 Redirecionamentos

```typescript
// Rotas antigas → novas
/dashboard          → / (se sem projeto) ou /p/:projectId/dashboard
/devices/:category  → /p/:projectId/devices/:category
/vlans              → /p/:projectId/vlans
/topology           → /p/:projectId/topology
/settings           → /p/:projectId/settings
```

---

## 5. Backend - Novos Endpoints

### 5.1 Métricas da Plataforma

```javascript
// GET /api/platform/metrics
{
  "totalClients": 5,
  "totalProjects": 12,
  "totalDevices": 245,
  "activeAlerts": 8,
  "uptime": "99.8%",
  "lastUpdate": "2025-12-11T01:00:00Z"
}

// GET /api/platform/projects/summary
[
  {
    "id": "uuid",
    "name": "Projeto A",
    "client": { "id": "uuid", "name": "Cliente X" },
    "status": "active",
    "metrics": {
      "devices": 45,
      "alerts": 2,
      "lastActivity": "2025-12-11T00:30:00Z"
    }
  },
  ...
]

// GET /api/platform/charts/devices-by-project
{
  "labels": ["Projeto A", "Projeto B", ...],
  "data": [45, 32, ...]
}

// GET /api/platform/charts/alerts-by-severity
{
  "labels": ["Critical", "Warning", "Info"],
  "data": [3, 5, 12]
}
```

### 5.2 Implementação no Backend

**Arquivo:** `server/import-api.cjs`

```javascript
// Platform Metrics
app.get('/api/platform/metrics', async (req, res) => {
    try {
        const [clients, projects, devices, alerts] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM clients'),
            pool.query('SELECT COUNT(*) FROM projects'),
            pool.query('SELECT COUNT(*) FROM network_devices'),
            pool.query('SELECT COUNT(*) FROM alerts WHERE status = $1', ['active'])
        ])
        
        res.json({
            totalClients: parseInt(clients.rows[0].count),
            totalProjects: parseInt(projects.rows[0].count),
            totalDevices: parseInt(devices.rows[0].count),
            activeAlerts: parseInt(alerts.rows[0].count),
            uptime: "99.8%", // TODO: calcular real
            lastUpdate: new Date().toISOString()
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Projects Summary
app.get('/api/platform/projects/summary', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                p.id, p.name, p.status,
                c.id as client_id, c.name as client_name,
                COUNT(DISTINCT d.id) as device_count,
                COUNT(DISTINCT a.id) as alert_count,
                MAX(d.updated_at) as last_activity
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN network_devices d ON p.id = d.project_id
            LEFT JOIN alerts a ON p.id = a.project_id AND a.status = 'active'
            GROUP BY p.id, c.id
            ORDER BY p.name
        `)
        
        res.json(rows.map(r => ({
            id: r.id,
            name: r.name,
            client: { id: r.client_id, name: r.client_name },
            status: r.status,
            metrics: {
                devices: parseInt(r.device_count),
                alerts: parseInt(r.alert_count),
                lastActivity: r.last_activity
            }
        })))
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})
```

---

## 6. Frontend - Implementação Detalhada

### 6.1 GlobalDashboard Component

```typescript
// src/pages/GlobalDashboard.tsx
import { useEffect, useState } from 'react'
import { Container, Grid, Typography, Box, TextField, MenuItem } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { setCurrentProject } from '../store/slices/projectSlice'
import ProjectGrid from '../components/dashboard/ProjectGrid'
import PlatformMetrics from '../components/dashboard/PlatformMetrics'
import { api } from '../services/api'

export default function GlobalDashboard() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [projects, setProjects] = useState([])
    const [metrics, setMetrics] = useState(null)
    const [filter, setFilter] = useState({ client: 'all', search: '' })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [projectsData, metricsData] = await Promise.all([
            api.getProjectsSummary(),
            api.getPlatformMetrics()
        ])
        setProjects(projectsData)
        setMetrics(metricsData)
    }

    const handleSelectProject = (project) => {
        dispatch(setCurrentProject(project))
        navigate(`/p/${project.id}/dashboard`)
    }

    const filteredProjects = projects.filter(p => {
        if (filter.client !== 'all' && p.client.id !== filter.client) return false
        if (filter.search && !p.name.toLowerCase().includes(filter.search.toLowerCase())) return false
        return true
    })

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Dashboard da Plataforma
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Selecione um projeto para acessar seus recursos
                </Typography>
            </Box>

            {/* Filtros */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    label="Buscar projeto"
                    size="small"
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    sx={{ flex: 1 }}
                />
                <TextField
                    select
                    label="Cliente"
                    size="small"
                    value={filter.client}
                    onChange={(e) => setFilter({ ...filter, client: e.target.value })}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="all">Todos</MenuItem>
                    {/* Listar clientes únicos */}
                </TextField>
            </Box>

            {/* Grid de Projetos */}
            <ProjectGrid 
                projects={filteredProjects} 
                onSelectProject={handleSelectProject}
            />

            {/* Métricas da Plataforma */}
            {metrics && (
                <Box sx={{ mt: 6 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Métricas da Plataforma
                    </Typography>
                    <PlatformMetrics data={metrics} />
                </Box>
            )}
        </Container>
    )
}
```

### 6.2 ProjectCard Component

```typescript
// src/components/dashboard/ProjectCard.tsx
import { Card, CardContent, CardActions, Typography, Box, Chip, Button } from '@mui/material'
import { Folder, AlertCircle, HardDrive, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProjectCardProps {
    project: {
        id: string
        name: string
        client: { name: string }
        status: string
        metrics: {
            devices: number
            alerts: number
            lastActivity: string
        }
    }
    onSelect: () => void
}

export default function ProjectCard({ project, onSelect }: ProjectCardProps) {
    const statusColor = {
        active: 'success',
        inactive: 'default',
        maintenance: 'warning'
    }

    return (
        <Card 
            variant="outlined" 
            sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 2
                }
            }}
        >
            <CardContent sx={{ flex: 1 }}>
                {/* Cliente Badge */}
                <Chip 
                    label={project.client.name} 
                    size="small" 
                    sx={{ mb: 2 }}
                />

                {/* Nome do Projeto */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Folder size={24} color="#1976d2" />
                    <Typography variant="h6" fontWeight="bold">
                        {project.name}
                    </Typography>
                </Box>

                {/* Métricas */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HardDrive size={16} color="#666" />
                        <Typography variant="body2" color="text.secondary">
                            {project.metrics.devices} dispositivos
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AlertCircle size={16} color={project.metrics.alerts > 0 ? '#f44336' : '#666'} />
                        <Typography variant="body2" color={project.metrics.alerts > 0 ? 'error' : 'text.secondary'}>
                            {project.metrics.alerts} alertas
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={16} color="#666" />
                        <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(project.metrics.lastActivity), { 
                                addSuffix: true, 
                                locale: ptBR 
                            })}
                        </Typography>
                    </Box>
                </Box>

                {/* Status */}
                <Box sx={{ mt: 2 }}>
                    <Chip 
                        label={project.status} 
                        size="small" 
                        color={statusColor[project.status]} 
                        variant="outlined"
                    />
                </Box>
            </CardContent>

            <CardActions>
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={onSelect}
                >
                    Acessar Projeto
                </Button>
            </CardActions>
        </Card>
    )
}
```

### 6.3 ContextualSidebar Component

```typescript
// src/components/layout/ContextualSidebar.tsx
import { useAppSelector } from '../../store/hooks'
import { Drawer, Box } from '@mui/material'
// ... imports

export default function ContextualSidebar() {
    const { currentProject } = useAppSelector(state => state.project)
    
    // Se não há projeto, não renderiza nada
    if (!currentProject) {
        return null
    }
    
    // Renderiza sidebar normal
    return (
        <Drawer variant="permanent" {...props}>
            {/* Conteúdo da sidebar */}
        </Drawer>
    )
}
```

---

## 7. Atualização do Redux

### 7.1 Adicionar ao projectSlice

```typescript
// src/store/slices/projectSlice.ts

export const fetchProjectsSummary = createAsyncThunk(
    'project/fetchProjectsSummary',
    async () => {
        return await api.getProjectsSummary()
    }
)

export const fetchPlatformMetrics = createAsyncThunk(
    'project/fetchPlatformMetrics',
    async () => {
        return await api.getPlatformMetrics()
    }
)

// Adicionar ao slice
const projectSlice = createSlice({
    // ...
    extraReducers: (builder) => {
        builder
            // ... existentes
            .addCase(fetchProjectsSummary.fulfilled, (state, action) => {
                state.projectsSummary = action.payload
            })
            .addCase(fetchPlatformMetrics.fulfilled, (state, action) => {
                state.platformMetrics = action.payload
            })
    }
})
```

---

## 8. Checklist de Implementação

### Backend
- [ ] Criar endpoint `/api/platform/metrics`
- [ ] Criar endpoint `/api/platform/projects/summary`
- [ ] Criar endpoint `/api/platform/charts/devices-by-project`
- [ ] Criar endpoint `/api/platform/charts/alerts-by-severity`
- [ ] Testar endpoints com dados reais

### Frontend - Componentes
- [ ] Criar `GlobalDashboard.tsx`
- [ ] Criar `ProjectGrid.tsx`
- [ ] Criar `ProjectCard.tsx`
- [ ] Criar `PlatformMetrics.tsx`
- [ ] Criar `PlatformCharts.tsx`
- [ ] Criar `ContextualSidebar.tsx`
- [ ] Criar `ContextualHeader.tsx`
- [ ] Criar `Breadcrumbs.tsx`

### Frontend - Integração
- [ ] Atualizar `api.ts` com novos métodos
- [ ] Atualizar `projectSlice.ts` com novos thunks
- [ ] Refatorar `MainLayout.tsx` para usar componentes contextuais
- [ ] Atualizar rotas em `App.tsx`
- [ ] Mover `ClientList.tsx` para `/admin/clients`

### Testes
- [ ] Testar navegação sem projeto selecionado
- [ ] Testar seleção de projeto
- [ ] Testar sidebar aparece/desaparece
- [ ] Testar breadcrumbs
- [ ] Testar filtros no dashboard global
- [ ] Testar métricas da plataforma

---

## 9. Wireframes

### Dashboard Global
```
┌─────────────────────────────────────────────────────────┐
│ [Logo OnliOps]                    [Admin] [User Menu]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Dashboard da Plataforma                                 │
│  Selecione um projeto para acessar seus recursos        │
│                                                          │
│  [Buscar...        ] [Cliente: Todos ▼]                 │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Cliente A│ │ Cliente A│ │ Cliente B│                │
│  │ Projeto 1│ │ Projeto 2│ │ Projeto 1│                │
│  │ 45 disp. │ │ 32 disp. │ │ 18 disp. │                │
│  │ 2 alerts │ │ 0 alerts │ │ 1 alert  │                │
│  │ [Acessar]│ │ [Acessar]│ │ [Acessar]│                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                          │
│  Métricas da Plataforma                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │5 Client.│ │12 Projet│ │245 Disp.│ │8 Alerts │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                          │
│  [Gráfico: Dispositivos por Projeto]                    │
│  [Gráfico: Alertas por Severidade]                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Dashboard do Projeto
```
┌─────────────────────────────────────────────────────────┐
│ [Logo] Cliente A > Projeto 1 [Sair] [Admin] [User Menu] │
├──────────┬──────────────────────────────────────────────┤
│          │ Plataforma > Cliente A > Projeto 1 > Dashboard│
│ Sidebar  │                                               │
│          │  Dashboard do Projeto 1                       │
│ ▶ Dashbd │                                               │
│ ▼ Disp.  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│   Câmeras│  │45 Disp. │ │2 Alerts │ │99% Up   │        │
│   DVRs   │  └─────────┘ └─────────┘ └─────────┘        │
│ ▶ VLANs  │                                               │
│ ▶ Topol. │  [Gráficos e métricas do projeto]            │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

---

## 10. Considerações de Performance

1. **Cache de métricas:** Implementar cache de 5 minutos para `/api/platform/metrics`
2. **Paginação:** Se houver >50 projetos, implementar paginação ou scroll infinito
3. **Lazy loading:** Carregar gráficos apenas quando visíveis
4. **Debounce:** Aplicar debounce de 300ms no campo de busca

---

## 11. Acessibilidade

- [ ] Garantir contraste adequado nos cards
- [ ] Adicionar `aria-labels` nos botões
- [ ] Suporte a navegação por teclado
- [ ] Anunciar mudanças de contexto para screen readers

---

**Próximo Documento:** `03_planejamento_permissoes.md`
