# Planejamento: Sistema de Permissões e Controle de Acesso

**Documento:** 03 - Permissões e Segurança  
**Prioridade:** Alta  
**Fase:** 2  
**Tempo Estimado:** 16-24 horas

---

## 1. Objetivo

Implementar um sistema de permissões robusto que controle o acesso de usuários a clientes/projetos específicos, garantindo isolamento total de dados e segurança.

---

## 2. Modelo de Permissões

### 2.1 Arquitetura Escolhida: RBAC (Role-Based Access Control)

**Hierarquia:**
```
Platform Admin (Super User)
  └─ Acesso total a todos os clientes/projetos
  └─ Gerenciar usuários e permissões
  └─ Configurar integrações

Client Admin
  └─ Acesso a todos os projetos do cliente
  └─ Criar/editar projetos do cliente
  └─ Gerenciar usuários do cliente

Project Manager
  └─ Acesso total ao projeto específico
  └─ Gerenciar configurações do projeto
  └─ Visualizar/editar todos os recursos

Project Viewer
  └─ Acesso somente leitura ao projeto
  └─ Visualizar dispositivos, VLANs, topologia
  └─ Não pode editar
```

### 2.2 Tabelas de Banco de Dados

```sql
-- Tabela de Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL, -- Ex: {"devices": ["read", "write"], "vlans": ["read"]}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Permissões de Usuário
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NULL, -- NULL = platform admin
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NULL, -- NULL = acesso a todos os projetos do cliente
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id, client_id, project_id)
);

-- Índices
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_client ON user_permissions(client_id);
CREATE INDEX idx_user_permissions_project ON user_permissions(project_id);
```

### 2.3 Roles Padrão

```sql
-- Script de seed
INSERT INTO roles (name, description, permissions) VALUES
('platform_admin', 'Administrador da Plataforma', '{
    "clients": ["read", "write", "delete"],
    "projects": ["read", "write", "delete"],
    "users": ["read", "write", "delete"],
    "devices": ["read", "write", "delete"],
    "vlans": ["read", "write", "delete"],
    "topology": ["read", "write", "delete"],
    "settings": ["read", "write"],
    "integrations": ["read", "write"]
}'),
('client_admin', 'Administrador do Cliente', '{
    "projects": ["read", "write", "delete"],
    "users": ["read", "write"],
    "devices": ["read", "write", "delete"],
    "vlans": ["read", "write", "delete"],
    "topology": ["read", "write", "delete"],
    "settings": ["read", "write"]
}'),
('project_manager', 'Gerente do Projeto', '{
    "devices": ["read", "write", "delete"],
    "vlans": ["read", "write", "delete"],
    "topology": ["read", "write", "delete"],
    "settings": ["read", "write"]
}'),
('project_viewer', 'Visualizador do Projeto', '{
    "devices": ["read"],
    "vlans": ["read"],
    "topology": ["read"],
    "settings": ["read"]
}');
```

---

## 3. Backend - Middleware de Autorização

### 3.1 Middleware de Autenticação (Existente)

```javascript
// Verificar se usuário está autenticado
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' })
    }
    next()
}
```

### 3.2 Middleware de Autorização (NOVO)

```javascript
// server/middleware/authorization.js

const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.session.userId
            const projectId = req.projectId // Do middleware multi-tenant
            
            // Buscar permissões do usuário
            const { rows } = await pool.query(`
                SELECT r.permissions, up.client_id, up.project_id
                FROM user_permissions up
                JOIN roles r ON up.role_id = r.id
                WHERE up.user_id = $1
                AND (
                    up.client_id IS NULL -- Platform admin
                    OR up.project_id = $2 -- Acesso direto ao projeto
                    OR (up.client_id = (SELECT client_id FROM projects WHERE id = $2) AND up.project_id IS NULL) -- Acesso ao cliente
                )
            `, [userId, projectId])
            
            if (rows.length === 0) {
                return res.status(403).json({ error: 'Acesso negado' })
            }
            
            // Verificar se alguma role tem a permissão necessária
            const hasPermission = rows.some(row => {
                const permissions = row.permissions
                return permissions[resource] && permissions[resource].includes(action)
            })
            
            if (!hasPermission) {
                return res.status(403).json({ error: `Sem permissão para ${action} em ${resource}` })
            }
            
            next()
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }
}

module.exports = { checkPermission }
```

### 3.3 Aplicação nos Endpoints

```javascript
const { checkPermission } = require('./middleware/authorization')

// Exemplo: Listar dispositivos (requer permissão de leitura)
app.get('/api/network_devices', 
    requireAuth,
    checkPermission('devices', 'read'),
    async (req, res) => {
        // ... código existente
    }
)

// Exemplo: Criar dispositivo (requer permissão de escrita)
app.post('/api/network_devices',
    requireAuth,
    checkPermission('devices', 'write'),
    async (req, res) => {
        // ... código existente
    }
)

// Exemplo: Deletar dispositivo (requer permissão de delete)
app.delete('/api/network_devices/:id',
    requireAuth,
    checkPermission('devices', 'delete'),
    async (req, res) => {
        // ... código existente
    }
)
```

---

## 4. Backend - Endpoints de Gerenciamento

### 4.1 Roles

```javascript
// Listar roles
app.get('/api/roles', requireAuth, checkPermission('users', 'read'), async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM roles ORDER BY name')
    res.json(rows)
})

// Criar role (apenas platform admin)
app.post('/api/roles', requireAuth, checkPermission('users', 'write'), async (req, res) => {
    const { name, description, permissions } = req.body
    const { rows } = await pool.query(
        'INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *',
        [name, description, JSON.stringify(permissions)]
    )
    res.status(201).json(rows[0])
})
```

### 4.2 Permissões de Usuário

```javascript
// Listar permissões de um usuário
app.get('/api/users/:userId/permissions', requireAuth, async (req, res) => {
    const { userId } = req.params
    const { rows } = await pool.query(`
        SELECT 
            up.id, up.user_id, up.role_id, up.client_id, up.project_id,
            r.name as role_name,
            c.name as client_name,
            p.name as project_name
        FROM user_permissions up
        JOIN roles r ON up.role_id = r.id
        LEFT JOIN clients c ON up.client_id = c.id
        LEFT JOIN projects p ON up.project_id = p.id
        WHERE up.user_id = $1
    `, [userId])
    res.json(rows)
})

// Atribuir permissão a usuário
app.post('/api/users/:userId/permissions', requireAuth, checkPermission('users', 'write'), async (req, res) => {
    const { userId } = req.params
    const { roleId, clientId, projectId } = req.body
    
    const { rows } = await pool.query(
        `INSERT INTO user_permissions (user_id, role_id, client_id, project_id) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (user_id, role_id, client_id, project_id) DO NOTHING
         RETURNING *`,
        [userId, roleId, clientId || null, projectId || null]
    )
    res.status(201).json(rows[0])
})

// Remover permissão
app.delete('/api/users/:userId/permissions/:permissionId', requireAuth, checkPermission('users', 'write'), async (req, res) => {
    const { userId, permissionId } = req.params
    await pool.query('DELETE FROM user_permissions WHERE id = $1 AND user_id = $2', [permissionId, userId])
    res.status(204).send()
})
```

### 4.3 Endpoint de Verificação de Permissões

```javascript
// Verificar se usuário tem permissão específica
app.get('/api/auth/check-permission', requireAuth, async (req, res) => {
    const { resource, action, projectId } = req.query
    const userId = req.session.userId
    
    try {
        const { rows } = await pool.query(`
            SELECT r.permissions
            FROM user_permissions up
            JOIN roles r ON up.role_id = r.id
            WHERE up.user_id = $1
            AND (
                up.client_id IS NULL 
                OR up.project_id = $2
                OR (up.client_id = (SELECT client_id FROM projects WHERE id = $2) AND up.project_id IS NULL)
            )
        `, [userId, projectId])
        
        const hasPermission = rows.some(row => {
            const permissions = row.permissions
            return permissions[resource] && permissions[resource].includes(action)
        })
        
        res.json({ hasPermission })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})
```

---

## 5. Frontend - Gerenciamento de Permissões

### 5.1 Página de Gerenciamento de Usuários

```typescript
// src/pages/admin/UserManagement.tsx

import { useState, useEffect } from 'react'
import { 
    Container, Typography, Table, TableBody, TableCell, TableHead, TableRow,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material'
import { api } from '../../services/api'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [showPermissionDialog, setShowPermissionDialog] = useState(false)
    const [roles, setRoles] = useState([])
    const [clients, setClients] = useState([])
    const [projects, setProjects] = useState([])
    
    const [newPermission, setNewPermission] = useState({
        roleId: '',
        clientId: '',
        projectId: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [usersData, rolesData, clientsData] = await Promise.all([
            api.getUsers(),
            api.getRoles(),
            api.getClients()
        ])
        setUsers(usersData)
        setRoles(rolesData)
        setClients(clientsData)
    }

    const handleAddPermission = async () => {
        await api.addUserPermission(selectedUser.id, newPermission)
        // Recarregar permissões do usuário
        const permissions = await api.getUserPermissions(selectedUser.id)
        setSelectedUser({ ...selectedUser, permissions })
        setShowPermissionDialog(false)
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Gerenciamento de Usuários
            </Typography>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Permissões</TableCell>
                        <TableCell>Ações</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>{user.full_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                {user.permissions?.map(p => (
                                    <Chip 
                                        key={p.id} 
                                        label={`${p.role_name} - ${p.project_name || p.client_name || 'Plataforma'}`}
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                ))}
                            </TableCell>
                            <TableCell>
                                <Button 
                                    size="small" 
                                    onClick={() => {
                                        setSelectedUser(user)
                                        setShowPermissionDialog(true)
                                    }}
                                >
                                    Gerenciar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Dialog de Adicionar Permissão */}
            <Dialog open={showPermissionDialog} onClose={() => setShowPermissionDialog(false)}>
                <DialogTitle>Adicionar Permissão</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={newPermission.roleId}
                            onChange={(e) => setNewPermission({ ...newPermission, roleId: e.target.value })}
                        >
                            {roles.map(role => (
                                <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Cliente (opcional)</InputLabel>
                        <Select
                            value={newPermission.clientId}
                            onChange={(e) => setNewPermission({ ...newPermission, clientId: e.target.value })}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {clients.map(client => (
                                <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {newPermission.clientId && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Projeto (opcional)</InputLabel>
                            <Select
                                value={newPermission.projectId}
                                onChange={(e) => setNewPermission({ ...newPermission, projectId: e.target.value })}
                            >
                                <MenuItem value="">Todos do cliente</MenuItem>
                                {/* Filtrar projetos por cliente */}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPermissionDialog(false)}>Cancelar</Button>
                    <Button onClick={handleAddPermission} variant="contained">Adicionar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}
```

### 5.2 Hook de Permissões

```typescript
// src/hooks/usePermissions.ts

import { useEffect, useState } from 'react'
import { useAppSelector } from '../store/hooks'
import { api } from '../services/api'

export function usePermissions() {
    const { currentProject } = useAppSelector(state => state.project)
    const [permissions, setPermissions] = useState<Record<string, string[]>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPermissions()
    }, [currentProject])

    const loadPermissions = async () => {
        if (!currentProject) {
            setPermissions({})
            setLoading(false)
            return
        }

        try {
            // Buscar permissões do usuário para o projeto atual
            const userPermissions = await api.getUserPermissions()
            // Processar e armazenar
            setPermissions(userPermissions)
        } catch (error) {
            console.error('Erro ao carregar permissões:', error)
        } finally {
            setLoading(false)
        }
    }

    const can = (resource: string, action: string): boolean => {
        return permissions[resource]?.includes(action) || false
    }

    return { can, loading, permissions }
}
```

### 5.3 Componente de Proteção

```typescript
// src/components/auth/ProtectedAction.tsx

import { ReactNode } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { Tooltip } from '@mui/material'

interface ProtectedActionProps {
    resource: string
    action: string
    children: ReactNode
    fallback?: ReactNode
}

export default function ProtectedAction({ resource, action, children, fallback }: ProtectedActionProps) {
    const { can } = usePermissions()

    if (!can(resource, action)) {
        if (fallback) return <>{fallback}</>
        return (
            <Tooltip title="Você não tem permissão para esta ação">
                <span>{children}</span>
            </Tooltip>
        )
    }

    return <>{children}</>
}
```

### 5.4 Uso nos Componentes

```typescript
// Exemplo: Botão de criar dispositivo
<ProtectedAction resource="devices" action="write">
    <Button variant="contained" onClick={handleCreateDevice}>
        Novo Dispositivo
    </Button>
</ProtectedAction>

// Exemplo: Botão de deletar (desabilitado se sem permissão)
<ProtectedAction 
    resource="devices" 
    action="delete"
    fallback={
        <Button disabled>Deletar</Button>
    }
>
    <Button color="error" onClick={handleDelete}>
        Deletar
    </Button>
</ProtectedAction>
```

---

## 6. Migração de Dados

### 6.1 Script de Migração

```sql
-- scripts/migrations/017_add_permissions_system.sql

-- Criar tabelas
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id, client_id, project_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_client ON user_permissions(client_id);
CREATE INDEX idx_user_permissions_project ON user_permissions(project_id);

-- Inserir roles padrão
INSERT INTO roles (name, description, permissions) VALUES
('platform_admin', 'Administrador da Plataforma', '{"clients": ["read", "write", "delete"], "projects": ["read", "write", "delete"], "users": ["read", "write", "delete"], "devices": ["read", "write", "delete"], "vlans": ["read", "write", "delete"], "topology": ["read", "write", "delete"], "settings": ["read", "write"], "integrations": ["read", "write"]}'),
('client_admin', 'Administrador do Cliente', '{"projects": ["read", "write", "delete"], "users": ["read", "write"], "devices": ["read", "write", "delete"], "vlans": ["read", "write", "delete"], "topology": ["read", "write", "delete"], "settings": ["read", "write"]}'),
('project_manager', 'Gerente do Projeto', '{"devices": ["read", "write", "delete"], "vlans": ["read", "write", "delete"], "topology": ["read", "write", "delete"], "settings": ["read", "write"]}'),
('project_viewer', 'Visualizador do Projeto', '{"devices": ["read"], "vlans": ["read"], "topology": ["read"], "settings": ["read"]}')
ON CONFLICT (name) DO NOTHING;

-- Atribuir admin existente como platform_admin
DO $$
DECLARE
    admin_user_id UUID;
    platform_admin_role_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@calabasas.local' LIMIT 1;
    SELECT id INTO platform_admin_role_id FROM roles WHERE name = 'platform_admin' LIMIT 1;
    
    IF admin_user_id IS NOT NULL AND platform_admin_role_id IS NOT NULL THEN
        INSERT INTO user_permissions (user_id, role_id, client_id, project_id)
        VALUES (admin_user_id, platform_admin_role_id, NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
```

---

## 7. Checklist de Implementação

### Banco de Dados
- [ ] Criar tabela `roles`
- [ ] Criar tabela `user_permissions`
- [ ] Inserir roles padrão
- [ ] Atribuir admin como platform_admin
- [ ] Criar índices

### Backend
- [ ] Criar middleware `checkPermission`
- [ ] Aplicar middleware em todos os endpoints de recursos
- [ ] Criar endpoints de gerenciamento de roles
- [ ] Criar endpoints de gerenciamento de permissões
- [ ] Criar endpoint de verificação de permissões
- [ ] Testar autorização com diferentes roles

### Frontend
- [ ] Criar hook `usePermissions`
- [ ] Criar componente `ProtectedAction`
- [ ] Criar página `UserManagement`
- [ ] Atualizar `api.ts` com métodos de permissões
- [ ] Aplicar proteção em botões/ações sensíveis
- [ ] Testar UI com diferentes permissões

### Testes
- [ ] Testar acesso negado sem permissão
- [ ] Testar platform_admin tem acesso total
- [ ] Testar client_admin só acessa seus clientes
- [ ] Testar project_viewer não pode editar
- [ ] Testar isolamento entre projetos

---

## 8. Considerações de Segurança

1. **Validação no Backend:** Nunca confiar apenas no frontend
2. **Logs de Auditoria:** Registrar todas as mudanças de permissões
3. **Princípio do Menor Privilégio:** Usuários devem ter apenas as permissões necessárias
4. **Revisão Periódica:** Implementar processo de revisão de permissões

---

**Próximo Documento:** `04_planejamento_integracao_prometheus_grafana.md`
