# Planejamento: Integração Prometheus e Grafana

**Documento:** 04 - Integração Prometheus/Grafana  
**Prioridade:** Alta  
**Fase:** 3  
**Tempo Estimado:** 12-16 horas

---

## 1. Objetivo

Integrar a plataforma OnliOps com Prometheus (coleta de métricas) e Grafana (visualização), permitindo monitoramento em tempo real de dispositivos e da plataforma, com dashboards por projeto e globais.

---

## 2. Arquitetura de Monitoramento

```
┌─────────────────────────────────────────────────────────┐
│                    OnliOps Platform                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Prometheus Exporter (Node.js)                   │   │
│  │  - Métricas de dispositivos (por projeto)        │   │
│  │  - Métricas da plataforma                        │   │
│  │  - Métricas de API (requests, latência)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ (HTTP /metrics)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Prometheus Server                     │
│  - Scrape metrics a cada 15s                            │
│  - Armazenar time-series                                │
│  - Alertmanager (opcional)                              │
└─────────────────────────────────────────────────────────┘
                          │
                          │ (PromQL)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Grafana Server                        │
│  - Dashboards por projeto                               │
│  - Dashboard global da plataforma                       │
│  - Alertas visuais                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Prometheus Exporter

### 3.1 Instalação de Dependências

```bash
npm install prom-client
```

### 3.2 Implementação do Exporter

**Arquivo:** `server/prometheus-exporter.js`

```javascript
const promClient = require('prom-client')
const { Pool } = require('pg')

// Configurar registry
const register = new promClient.Registry()
promClient.collectDefaultMetrics({ register })

// Pool do PostgreSQL
const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'calabasas_local',
    user: 'calabasas_admin',
    password: 'Calabasas@2025!'
})

// === MÉTRICAS CUSTOMIZADAS ===

// Total de dispositivos por projeto
const devicesGauge = new promClient.Gauge({
    name: 'onliops_devices_total',
    help: 'Total de dispositivos por projeto',
    labelNames: ['project_id', 'project_name', 'client_name', 'status'],
    registers: [register]
})

// Total de alertas por projeto e severidade
const alertsGauge = new promClient.Gauge({
    name: 'onliops_alerts_total',
    help: 'Total de alertas por projeto e severidade',
    labelNames: ['project_id', 'project_name', 'severity', 'status'],
    registers: [register]
})

// Uptime de dispositivos
const deviceUptimeGauge = new promClient.Gauge({
    name: 'onliops_device_uptime_seconds',
    help: 'Uptime de dispositivos em segundos',
    labelNames: ['device_id', 'device_name', 'project_id'],
    registers: [register]
})

// Requisições de API
const apiRequestsCounter = new promClient.Counter({
    name: 'onliops_api_requests_total',
    help: 'Total de requisições de API',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
})

// Latência de API
const apiLatencyHistogram = new promClient.Histogram({
    name: 'onliops_api_latency_seconds',
    help: 'Latência de requisições de API',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [register]
})

// === COLETA DE MÉTRICAS ===

async function collectMetrics() {
    try {
        // Dispositivos por projeto
        const devicesResult = await pool.query(`
            SELECT 
                p.id as project_id,
                p.name as project_name,
                c.name as client_name,
                d.status,
                COUNT(d.id) as count
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN network_devices d ON p.id = d.project_id
            GROUP BY p.id, p.name, c.name, d.status
        `)
        
        devicesGauge.reset()
        devicesResult.rows.forEach(row => {
            devicesGauge.set({
                project_id: row.project_id,
                project_name: row.project_name,
                client_name: row.client_name,
                status: row.status || 'unknown'
            }, parseInt(row.count))
        })

        // Alertas por projeto
        const alertsResult = await pool.query(`
            SELECT 
                p.id as project_id,
                p.name as project_name,
                a.severity,
                a.status,
                COUNT(a.id) as count
            FROM projects p
            LEFT JOIN alerts a ON p.id = a.project_id
            GROUP BY p.id, p.name, a.severity, a.status
        `)
        
        alertsGauge.reset()
        alertsResult.rows.forEach(row => {
            alertsGauge.set({
                project_id: row.project_id,
                project_name: row.project_name,
                severity: row.severity || 'unknown',
                status: row.status || 'unknown'
            }, parseInt(row.count))
        })

        // TODO: Adicionar mais métricas conforme necessário
        
    } catch (error) {
        console.error('Erro ao coletar métricas:', error)
    }
}

// Coletar métricas a cada 30 segundos
setInterval(collectMetrics, 30000)
collectMetrics() // Executar imediatamente

// Exportar função para obter métricas
module.exports = {
    register,
    apiRequestsCounter,
    apiLatencyHistogram,
    collectMetrics
}
```

### 3.3 Endpoint de Métricas

**Arquivo:** `server/import-api.cjs` (adicionar)

```javascript
const { register, apiRequestsCounter, apiLatencyHistogram } = require('./prometheus-exporter')

// Middleware para métricas de API
app.use((req, res, next) => {
    const start = Date.now()
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000
        
        apiRequestsCounter.inc({
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode
        })
        
        apiLatencyHistogram.observe({
            method: req.method,
            route: req.route?.path || req.path
        }, duration)
    })
    
    next()
})

// Endpoint de métricas (sem autenticação para Prometheus)
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
})
```

---

## 4. Configuração do Prometheus

### 4.1 Instalação

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install prometheus

# Ou via Docker
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /opt/calabasas/config/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 4.2 Configuração

**Arquivo:** `/opt/calabasas/config/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # OnliOps Platform
  - job_name: 'onliops'
    static_configs:
      - targets: ['172.20.120.28:3001']
        labels:
          environment: 'production'
          instance: 'onliops-main'

  # Node Exporter (métricas do servidor)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

# Alertmanager (opcional)
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

# Regras de alerta
rule_files:
  - '/etc/prometheus/alerts.yml'
```

### 4.3 Regras de Alerta

**Arquivo:** `/opt/calabasas/config/prometheus-alerts.yml`

```yaml
groups:
  - name: onliops_alerts
    interval: 30s
    rules:
      # Alerta se mais de 5 alertas críticos em um projeto
      - alert: HighCriticalAlerts
        expr: onliops_alerts_total{severity="critical",status="active"} > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Projeto {{ $labels.project_name }} tem muitos alertas críticos"
          description: "{{ $value }} alertas críticos ativos"

      # Alerta se mais de 50% dos dispositivos offline
      - alert: HighDeviceOfflineRate
        expr: |
          (onliops_devices_total{status="offline"} / 
           (onliops_devices_total{status="online"} + onliops_devices_total{status="offline"})) > 0.5
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Projeto {{ $labels.project_name }} com alta taxa de dispositivos offline"
          description: "Mais de 50% dos dispositivos estão offline"

      # Alerta se API com alta latência
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, onliops_api_latency_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API com alta latência"
          description: "P95 da latência está acima de 2 segundos"
```

---

## 5. Integração com Grafana

### 5.1 Instalação

```bash
# Ubuntu/Debian
sudo apt-get install grafana

# Ou via Docker
docker run -d \
  --name grafana \
  -p 3000:3000 \
  -v /opt/calabasas/config/grafana:/etc/grafana \
  grafana/grafana
```

### 5.2 Configuração do Data Source

**Via UI:**
1. Acessar Grafana: `http://172.20.120.28:3000`
2. Login: `admin` / `admin`
3. Configuration > Data Sources > Add data source
4. Selecionar Prometheus
5. URL: `http://172.20.120.28:9090`
6. Save & Test

**Via Provisioning:**

**Arquivo:** `/opt/calabasas/config/grafana/datasources/prometheus.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://172.20.120.28:9090
    isDefault: true
    editable: false
```

### 5.3 Dashboards

#### Dashboard Global da Plataforma

**Arquivo:** `/opt/calabasas/config/grafana/dashboards/platform-overview.json`

```json
{
  "dashboard": {
    "title": "OnliOps - Platform Overview",
    "panels": [
      {
        "title": "Total de Dispositivos",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(onliops_devices_total)"
          }
        ]
      },
      {
        "title": "Alertas Ativos",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(onliops_alerts_total{status=\"active\"})"
          }
        ]
      },
      {
        "title": "Dispositivos por Projeto",
        "type": "bargauge",
        "targets": [
          {
            "expr": "sum(onliops_devices_total) by (project_name)",
            "legendFormat": "{{ project_name }}"
          }
        ]
      },
      {
        "title": "Alertas por Severidade",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum(onliops_alerts_total{status=\"active\"}) by (severity)",
            "legendFormat": "{{ severity }}"
          }
        ]
      },
      {
        "title": "Latência de API (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(onliops_api_latency_seconds_bucket[5m]))",
            "legendFormat": "P95"
          }
        ]
      },
      {
        "title": "Requisições de API por Rota",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(onliops_api_requests_total[5m])",
            "legendFormat": "{{ method }} {{ route }}"
          }
        ]
      }
    ]
  }
}
```

#### Dashboard por Projeto

**Arquivo:** `/opt/calabasas/config/grafana/dashboards/project-dashboard.json`

```json
{
  "dashboard": {
    "title": "OnliOps - Project Dashboard",
    "templating": {
      "list": [
        {
          "name": "project",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(onliops_devices_total, project_name)"
        }
      ]
    },
    "panels": [
      {
        "title": "Dispositivos Online/Offline",
        "type": "stat",
        "targets": [
          {
            "expr": "onliops_devices_total{project_name=\"$project\",status=\"online\"}"
          },
          {
            "expr": "onliops_devices_total{project_name=\"$project\",status=\"offline\"}"
          }
        ]
      },
      {
        "title": "Alertas Ativos",
        "type": "table",
        "targets": [
          {
            "expr": "onliops_alerts_total{project_name=\"$project\",status=\"active\"}",
            "format": "table"
          }
        ]
      },
      {
        "title": "Histórico de Dispositivos",
        "type": "graph",
        "targets": [
          {
            "expr": "onliops_devices_total{project_name=\"$project\"}",
            "legendFormat": "{{ status }}"
          }
        ]
      }
    ]
  }
}
```

---

## 6. Integração Frontend

### 6.1 Embed de Dashboards Grafana

```typescript
// src/components/monitoring/GrafanaDashboard.tsx

import { Box } from '@mui/material'
import { useAppSelector } from '../../store/hooks'

interface GrafanaDashboardProps {
    dashboardId: string
    height?: number
}

export default function GrafanaDashboard({ dashboardId, height = 600 }: GrafanaDashboardProps) {
    const { currentProject } = useAppSelector(state => state.project)
    
    const grafanaUrl = `http://172.20.120.28:3000/d/${dashboardId}?orgId=1&var-project=${currentProject?.name}&theme=light&kiosk`

    return (
        <Box sx={{ width: '100%', height }}>
            <iframe
                src={grafanaUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Grafana Dashboard"
            />
        </Box>
    )
}
```

### 6.2 Página de Monitoramento

```typescript
// src/pages/Monitoring.tsx

import { Container, Typography, Box, Tabs, Tab } from '@mui/material'
import { useState } from 'react'
import GrafanaDashboard from '../components/monitoring/GrafanaDashboard'

export default function Monitoring() {
    const [tab, setTab] = useState(0)

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Monitoramento
            </Typography>

            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="Visão Geral" />
                <Tab label="Dispositivos" />
                <Tab label="Alertas" />
                <Tab label="Performance" />
            </Tabs>

            <Box sx={{ mt: 3 }}>
                {tab === 0 && <GrafanaDashboard dashboardId="project-overview" />}
                {tab === 1 && <GrafanaDashboard dashboardId="devices-detail" />}
                {tab === 2 && <GrafanaDashboard dashboardId="alerts-detail" />}
                {tab === 3 && <GrafanaDashboard dashboardId="performance" />}
            </Box>
        </Container>
    )
}
```

---

## 7. Métricas Avançadas

### 7.1 Métricas de Dispositivos Específicos

```javascript
// Coletar métricas de dispositivos via SNMP/API
async function collectDeviceMetrics() {
    const devices = await pool.query('SELECT * FROM network_devices WHERE status = $1', ['online'])
    
    for (const device of devices.rows) {
        try {
            // Exemplo: Coletar CPU/Memória via SNMP
            const metrics = await snmpClient.get(device.ip_address, [
                '1.3.6.1.4.1.2021.11.9.0', // CPU
                '1.3.6.1.4.1.2021.4.6.0'   // Memória
            ])
            
            deviceCpuGauge.set({
                device_id: device.id,
                device_name: device.hostname,
                project_id: device.project_id
            }, metrics.cpu)
            
            deviceMemoryGauge.set({
                device_id: device.id,
                device_name: device.hostname,
                project_id: device.project_id
            }, metrics.memory)
            
        } catch (error) {
            console.error(`Erro ao coletar métricas de ${device.hostname}:`, error)
        }
    }
}
```

---

## 8. Checklist de Implementação

### Backend
- [ ] Instalar `prom-client`
- [ ] Criar `prometheus-exporter.js`
- [ ] Implementar métricas customizadas
- [ ] Adicionar endpoint `/metrics`
- [ ] Adicionar middleware de métricas de API
- [ ] Testar endpoint de métricas

### Prometheus
- [ ] Instalar Prometheus
- [ ] Configurar `prometheus.yml`
- [ ] Configurar regras de alerta
- [ ] Testar scraping de métricas
- [ ] Configurar Alertmanager (opcional)

### Grafana
- [ ] Instalar Grafana
- [ ] Configurar data source Prometheus
- [ ] Criar dashboard global
- [ ] Criar dashboard por projeto
- [ ] Configurar alertas visuais
- [ ] Testar dashboards

### Frontend
- [ ] Criar componente `GrafanaDashboard`
- [ ] Criar página `Monitoring`
- [ ] Adicionar rota `/p/:projectId/monitoring`
- [ ] Testar embed de dashboards

### Documentação
- [ ] Documentar métricas disponíveis
- [ ] Documentar configuração de alertas
- [ ] Criar guia de uso dos dashboards

---

## 9. Considerações de Performance

1. **Intervalo de Scrape:** 15s é adequado para a maioria dos casos
2. **Retenção:** Configurar retenção de 30 dias no Prometheus
3. **Agregação:** Usar recording rules para queries complexas
4. **Cache:** Implementar cache de métricas pesadas

---

**Próximo Documento:** `05_planejamento_integracao_ticketing.md`
