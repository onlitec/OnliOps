# Planejamento: Integração com Sistema de Chamados (Ticketing)

**Documento:** 05 - Integração Ticketing System  
**Prioridade:** Média  
**Fase:** 4  
**Tempo Estimado:** 16-20 horas

---

## 1. Objetivo

Integrar a plataforma OnliOps com um sistema de chamados (ticketing system) para permitir abertura automática de tickets a partir de alertas, visualização de tickets relacionados a dispositivos, e gerenciamento de incidentes.

---

## 2. Escolha do Sistema de Chamados

### 2.1 Opções Avaliadas

| Sistema | Tipo | API | Complexidade | Recomendação |
|---------|------|-----|--------------|--------------|
| **osTicket** | Open Source | REST | Média | ⭐⭐⭐ Recomendado |
| **Zammad** | Open Source | REST | Baixa | ⭐⭐⭐⭐ Melhor opção |
| **GLPI** | Open Source | REST | Alta | ⭐⭐ Complexo |
| **Jira Service Desk** | Comercial | REST | Média | ⭐⭐⭐ Pago |
| **Freshdesk** | Comercial | REST | Baixa | ⭐⭐ Pago |

**Escolha:** **Zammad** (open source, API simples, interface moderna)

### 2.2 Justificativa

- ✅ Open source e gratuito
- ✅ API REST bem documentada
- ✅ Interface moderna e responsiva
- ✅ Suporte a multi-tenancy (organizações)
- ✅ Webhooks para notificações
- ✅ Fácil instalação via Docker

---

## 3. Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────┐
│                    OnliOps Platform                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Ticket Service (Node.js)                        │   │
│  │  - Criar ticket a partir de alerta               │   │
│  │  - Listar tickets de dispositivo                 │   │
│  │  - Atualizar status de ticket                    │   │
│  │  - Webhook handler (receber atualizações)        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ (REST API)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Zammad Server                         │
│  - Gerenciar tickets                                    │
│  - Organizações (clientes)                              │
│  - SLA tracking                                         │
│  - Notificações por email                               │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Instalação e Configuração do Zammad

### 4.1 Instalação via Docker

```bash
# Criar diretório de configuração
mkdir -p /opt/zammad
cd /opt/zammad

# docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3'

services:
  zammad-backup:
    image: postgres:13
    restart: always
    volumes:
      - zammad-postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: zammad
      POSTGRES_PASSWORD: zammad_password
      POSTGRES_DB: zammad

  zammad-memcached:
    image: memcached:1.6
    restart: always

  zammad-elasticsearch:
    image: elasticsearch:7.17.0
    restart: always
    environment:
      - discovery.type=single-node
    volumes:
      - zammad-elasticsearch:/usr/share/elasticsearch/data

  zammad-init:
    image: zammad/zammad-docker-compose:latest
    restart: on-failure
    depends_on:
      - zammad-backup
      - zammad-elasticsearch
    environment:
      POSTGRESQL_HOST: zammad-backup
      POSTGRESQL_USER: zammad
      POSTGRESQL_PASS: zammad_password
      ELASTICSEARCH_HOST: zammad-elasticsearch
      MEMCACHE_SERVERS: zammad-memcached:11211

  zammad-nginx:
    image: zammad/zammad-docker-compose:latest
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - zammad-init
    environment:
      NGINX_SERVER_NAME: zammad.local

  zammad-railsserver:
    image: zammad/zammad-docker-compose:latest
    restart: always
    depends_on:
      - zammad-init

  zammad-scheduler:
    image: zammad/zammad-docker-compose:latest
    restart: always
    depends_on:
      - zammad-init

  zammad-websocket:
    image: zammad/zammad-docker-compose:latest
    restart: always
    depends_on:
      - zammad-init

volumes:
  zammad-postgres:
  zammad-elasticsearch:
EOF

# Iniciar Zammad
docker-compose up -d

# Aguardar inicialização (pode levar alguns minutos)
sleep 60

# Acessar: http://172.20.120.28:8080
```

### 4.2 Configuração Inicial

1. Acessar `http://172.20.120.28:8080`
2. Criar admin: `admin@onliops.local` / senha segura
3. Configurar organização padrão
4. Gerar API token:
   - Admin > Profile > Token Access
   - Create Token: "OnliOps Integration"
   - Copiar token

---

## 5. Backend - Integração com Zammad

### 5.1 Instalação de Dependências

```bash
npm install axios
```

### 5.2 Cliente Zammad

**Arquivo:** `server/integrations/zammad-client.js`

```javascript
const axios = require('axios')

class ZammadClient {
    constructor(baseUrl, apiToken) {
        this.baseUrl = baseUrl
        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': `Token token=${apiToken}`,
                'Content-Type': 'application/json'
            }
        })
    }

    // Criar ticket
    async createTicket({ title, body, customerId, priority = '2 normal', tags = [] }) {
        try {
            const response = await this.client.post('/api/v1/tickets', {
                title,
                group: 'Users', // Grupo padrão
                customer_id: customerId,
                article: {
                    subject: title,
                    body,
                    type: 'note',
                    internal: false
                },
                priority,
                tags
            })
            return response.data
        } catch (error) {
            console.error('Erro ao criar ticket:', error.response?.data || error.message)
            throw error
        }
    }

    // Listar tickets
    async listTickets(filters = {}) {
        try {
            const params = new URLSearchParams(filters)
            const response = await this.client.get(`/api/v1/tickets?${params}`)
            return response.data
        } catch (error) {
            console.error('Erro ao listar tickets:', error.response?.data || error.message)
            throw error
        }
    }

    // Obter ticket por ID
    async getTicket(ticketId) {
        try {
            const response = await this.client.get(`/api/v1/tickets/${ticketId}`)
            return response.data
        } catch (error) {
            console.error('Erro ao obter ticket:', error.response?.data || error.message)
            throw error
        }
    }

    // Atualizar ticket
    async updateTicket(ticketId, updates) {
        try {
            const response = await this.client.put(`/api/v1/tickets/${ticketId}`, updates)
            return response.data
        } catch (error) {
            console.error('Erro ao atualizar ticket:', error.response?.data || error.message)
            throw error
        }
    }

    // Adicionar comentário
    async addComment(ticketId, body, internal = false) {
        try {
            const response = await this.client.post(`/api/v1/ticket_articles`, {
                ticket_id: ticketId,
                body,
                type: 'note',
                internal
            })
            return response.data
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error.response?.data || error.message)
            throw error
        }
    }

    // Criar/obter cliente (organização)
    async getOrCreateCustomer(email, name, organizationName) {
        try {
            // Tentar buscar cliente existente
            const searchResponse = await this.client.get(`/api/v1/users/search?query=${email}`)
            if (searchResponse.data.length > 0) {
                return searchResponse.data[0]
            }

            // Criar novo cliente
            const response = await this.client.post('/api/v1/users', {
                email,
                firstname: name.split(' ')[0],
                lastname: name.split(' ').slice(1).join(' ') || 'User',
                organization: organizationName
            })
            return response.data
        } catch (error) {
            console.error('Erro ao criar/obter cliente:', error.response?.data || error.message)
            throw error
        }
    }
}

// Singleton
const zammadClient = new ZammadClient(
    process.env.ZAMMAD_URL || 'http://172.20.120.28:8080',
    process.env.ZAMMAD_API_TOKEN || 'YOUR_API_TOKEN_HERE'
)

module.exports = zammadClient
```

### 5.3 Tabela de Tickets no PostgreSQL

```sql
-- Tabela para armazenar referência de tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zammad_ticket_id INTEGER NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    device_id UUID REFERENCES network_devices(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- new, open, pending, closed
    priority VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_project ON tickets(project_id);
CREATE INDEX idx_tickets_alert ON tickets(alert_id);
CREATE INDEX idx_tickets_device ON tickets(device_id);
CREATE INDEX idx_tickets_zammad ON tickets(zammad_ticket_id);
```

### 5.4 Endpoints de Tickets

**Arquivo:** `server/import-api.cjs` (adicionar)

```javascript
const zammadClient = require('./integrations/zammad-client')

// Criar ticket a partir de alerta
app.post('/api/tickets/from-alert/:alertId', requireAuth, checkPermission('tickets', 'write'), async (req, res) => {
    const { alertId } = req.params
    const { customMessage } = req.body

    try {
        // Buscar alerta
        const alertResult = await pool.query('SELECT * FROM alerts WHERE id = $1', [alertId])
        if (alertResult.rows.length === 0) {
            return res.status(404).json({ error: 'Alerta não encontrado' })
        }
        const alert = alertResult.rows[0]

        // Buscar projeto
        const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [alert.project_id])
        const project = projectResult.rows[0]

        // Criar cliente no Zammad (se não existir)
        const customer = await zammadClient.getOrCreateCustomer(
            'support@onliops.local',
            'OnliOps Support',
            project.name
        )

        // Criar ticket
        const ticketBody = `
Alerta: ${alert.title}
Severidade: ${alert.severity}
Descrição: ${alert.description}

${customMessage || ''}

---
Projeto: ${project.name}
Criado automaticamente pela plataforma OnliOps
        `.trim()

        const zammadTicket = await zammadClient.createTicket({
            title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            body: ticketBody,
            customerId: customer.id,
            priority: alert.severity === 'critical' ? '3 high' : '2 normal',
            tags: ['onliops', 'auto-created', alert.severity]
        })

        // Salvar referência no PostgreSQL
        const { rows } = await pool.query(
            `INSERT INTO tickets (zammad_ticket_id, project_id, alert_id, title, status, priority)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [zammadTicket.id, alert.project_id, alertId, zammadTicket.title, zammadTicket.state, zammadTicket.priority]
        )

        res.status(201).json({
            ticket: rows[0],
            zammadUrl: `${process.env.ZAMMAD_URL}/#ticket/zoom/${zammadTicket.id}`
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Listar tickets de um projeto
app.get('/api/tickets', requireAuth, checkPermission('tickets', 'read'), async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM tickets WHERE project_id = $1 ORDER BY created_at DESC',
            [req.projectId]
        )
        res.json(rows)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Obter detalhes de um ticket
app.get('/api/tickets/:id', requireAuth, checkPermission('tickets', 'read'), async (req, res) => {
    const { id } = req.params
    try {
        const { rows } = await pool.query('SELECT * FROM tickets WHERE id = $1', [id])
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado' })
        }

        const ticket = rows[0]
        
        // Buscar detalhes no Zammad
        const zammadTicket = await zammadClient.getTicket(ticket.zammad_ticket_id)

        res.json({
            ...ticket,
            zammad: zammadTicket
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Adicionar comentário a ticket
app.post('/api/tickets/:id/comments', requireAuth, checkPermission('tickets', 'write'), async (req, res) => {
    const { id } = req.params
    const { body } = req.body

    try {
        const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id])
        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket não encontrado' })
        }

        const ticket = ticketResult.rows[0]
        const comment = await zammadClient.addComment(ticket.zammad_ticket_id, body)

        res.status(201).json(comment)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Webhook para receber atualizações do Zammad
app.post('/api/webhooks/zammad', async (req, res) => {
    const { ticket } = req.body

    try {
        // Atualizar status no PostgreSQL
        await pool.query(
            'UPDATE tickets SET status = $1, updated_at = NOW() WHERE zammad_ticket_id = $2',
            [ticket.state, ticket.id]
        )

        res.status(200).json({ received: true })
    } catch (error) {
        console.error('Erro no webhook:', error)
        res.status(500).json({ error: error.message })
    }
})
```

---

## 6. Frontend - Interface de Tickets

### 6.1 Página de Tickets

```typescript
// src/pages/Tickets.tsx

import { useEffect, useState } from 'react'
import { 
    Container, Typography, Table, TableBody, TableCell, TableHead, TableRow,
    Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material'
import { ExternalLink, MessageSquare } from 'lucide-react'
import { api } from '../services/api'
import { useAppSelector } from '../store/hooks'

export default function Tickets() {
    const { currentProject } = useAppSelector(state => state.project)
    const [tickets, setTickets] = useState([])
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [showCommentDialog, setShowCommentDialog] = useState(false)
    const [comment, setComment] = useState('')

    useEffect(() => {
        loadTickets()
    }, [currentProject])

    const loadTickets = async () => {
        const data = await api.getTickets()
        setTickets(data)
    }

    const handleAddComment = async () => {
        await api.addTicketComment(selectedTicket.id, comment)
        setShowCommentDialog(false)
        setComment('')
        loadTickets()
    }

    const statusColor = {
        new: 'info',
        open: 'warning',
        pending: 'default',
        closed: 'success'
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Chamados
            </Typography>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Prioridade</TableCell>
                        <TableCell>Criado em</TableCell>
                        <TableCell>Ações</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tickets.map(ticket => (
                        <TableRow key={ticket.id}>
                            <TableCell>#{ticket.zammad_ticket_id}</TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={ticket.status} 
                                    size="small" 
                                    color={statusColor[ticket.status]}
                                />
                            </TableCell>
                            <TableCell>{ticket.priority}</TableCell>
                            <TableCell>{new Date(ticket.created_at).toLocaleString('pt-BR')}</TableCell>
                            <TableCell>
                                <Button 
                                    size="small" 
                                    startIcon={<MessageSquare size={16} />}
                                    onClick={() => {
                                        setSelectedTicket(ticket)
                                        setShowCommentDialog(true)
                                    }}
                                >
                                    Comentar
                                </Button>
                                <Button 
                                    size="small" 
                                    startIcon={<ExternalLink size={16} />}
                                    onClick={() => window.open(`http://172.20.120.28:8080/#ticket/zoom/${ticket.zammad_ticket_id}`, '_blank')}
                                >
                                    Abrir no Zammad
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Dialog de Comentário */}
            <Dialog open={showCommentDialog} onClose={() => setShowCommentDialog(false)}>
                <DialogTitle>Adicionar Comentário</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Comentário"
                        fullWidth
                        multiline
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCommentDialog(false)}>Cancelar</Button>
                    <Button onClick={handleAddComment} variant="contained">Adicionar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}
```

### 6.2 Botão de Criar Ticket a partir de Alerta

```typescript
// src/components/alerts/CreateTicketButton.tsx

import { useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import { Ticket } from 'lucide-react'
import { api } from '../../services/api'

interface CreateTicketButtonProps {
    alertId: string
    onSuccess?: () => void
}

export default function CreateTicketButton({ alertId, onSuccess }: CreateTicketButtonProps) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCreate = async () => {
        setLoading(true)
        try {
            await api.createTicketFromAlert(alertId, message)
            setOpen(false)
            setMessage('')
            onSuccess?.()
        } catch (error) {
            console.error('Erro ao criar ticket:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button 
                size="small" 
                startIcon={<Ticket size={16} />}
                onClick={() => setOpen(true)}
            >
                Criar Chamado
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Criar Chamado a partir do Alerta</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Mensagem adicional (opcional)"
                        fullWidth
                        multiline
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} variant="contained" disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Chamado'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
```

---

## 7. Automação de Tickets

### 7.1 Criar Ticket Automaticamente para Alertas Críticos

```javascript
// server/automation/auto-ticket.js

const pool = require('../db')
const zammadClient = require('../integrations/zammad-client')

async function createTicketForCriticalAlert(alert) {
    try {
        // Verificar se já existe ticket para este alerta
        const existingTicket = await pool.query(
            'SELECT * FROM tickets WHERE alert_id = $1',
            [alert.id]
        )
        
        if (existingTicket.rows.length > 0) {
            console.log(`Ticket já existe para alerta ${alert.id}`)
            return
        }

        // Buscar projeto
        const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [alert.project_id])
        const project = projectResult.rows[0]

        // Criar cliente
        const customer = await zammadClient.getOrCreateCustomer(
            'support@onliops.local',
            'OnliOps Support',
            project.name
        )

        // Criar ticket
        const ticketBody = `
ALERTA CRÍTICO DETECTADO AUTOMATICAMENTE

Título: ${alert.title}
Severidade: ${alert.severity}
Descrição: ${alert.description}

Este ticket foi criado automaticamente pela plataforma OnliOps.
Projeto: ${project.name}
        `.trim()

        const zammadTicket = await zammadClient.createTicket({
            title: `[AUTO] [CRITICAL] ${alert.title}`,
            body: ticketBody,
            customerId: customer.id,
            priority: '3 high',
            tags: ['onliops', 'auto-created', 'critical']
        })

        // Salvar no PostgreSQL
        await pool.query(
            `INSERT INTO tickets (zammad_ticket_id, project_id, alert_id, title, status, priority)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [zammadTicket.id, alert.project_id, alert.id, zammadTicket.title, zammadTicket.state, zammadTicket.priority]
        )

        console.log(`Ticket criado automaticamente para alerta ${alert.id}`)
    } catch (error) {
        console.error('Erro ao criar ticket automático:', error)
    }
}

module.exports = { createTicketForCriticalAlert }
```

### 7.2 Trigger no PostgreSQL

```sql
-- Função para criar ticket automático
CREATE OR REPLACE FUNCTION auto_create_ticket_for_critical_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Se alerta é crítico e está ativo
    IF NEW.severity = 'critical' AND NEW.status = 'active' THEN
        -- Notificar aplicação Node.js via NOTIFY
        PERFORM pg_notify('critical_alert', row_to_json(NEW)::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_auto_ticket
AFTER INSERT OR UPDATE ON alerts
FOR EACH ROW
EXECUTE FUNCTION auto_create_ticket_for_critical_alert();
```

### 7.3 Listener no Node.js

```javascript
// server/listeners/alert-listener.js

const { Client } = require('pg')
const { createTicketForCriticalAlert } = require('../automation/auto-ticket')

const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    database: 'calabasas_local',
    user: 'calabasas_admin',
    password: 'Calabasas@2025!'
})

client.connect()

client.query('LISTEN critical_alert')

client.on('notification', async (msg) => {
    if (msg.channel === 'critical_alert') {
        const alert = JSON.parse(msg.payload)
        console.log('Alerta crítico recebido:', alert)
        await createTicketForCriticalAlert(alert)
    }
})

console.log('Listener de alertas críticos iniciado')
```

---

## 8. Checklist de Implementação

### Zammad
- [ ] Instalar Zammad via Docker
- [ ] Configurar admin e organização
- [ ] Gerar API token
- [ ] Configurar webhook para OnliOps

### Backend
- [ ] Criar `zammad-client.js`
- [ ] Criar tabela `tickets`
- [ ] Criar endpoints de tickets
- [ ] Implementar webhook handler
- [ ] Criar automação de tickets críticos
- [ ] Criar listener de alertas
- [ ] Testar integração

### Frontend
- [ ] Criar página `Tickets`
- [ ] Criar componente `CreateTicketButton`
- [ ] Adicionar rota `/p/:projectId/tickets`
- [ ] Atualizar `api.ts` com métodos de tickets
- [ ] Testar criação e visualização de tickets

### Testes
- [ ] Testar criação manual de ticket
- [ ] Testar criação automática de ticket
- [ ] Testar webhook de atualização
- [ ] Testar comentários
- [ ] Testar isolamento por projeto

---

## 9. Considerações

1. **SLA:** Configurar SLAs no Zammad por prioridade
2. **Notificações:** Configurar emails para novos tickets
3. **Escalação:** Configurar regras de escalação automática
4. **Relatórios:** Usar API do Zammad para gerar relatórios

---

**Fim dos Planejamentos**
