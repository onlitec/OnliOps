import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Tabs,
    Tab,
    Tooltip,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from '@mui/material'
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    Security as SecurityIcon,
    AdminPanelSettings as AdminIcon,
    Visibility as ViewerIcon,
    ManageAccounts as ManagerIcon
} from '@mui/icons-material'
import { api } from '../../services/api'

interface Role {
    id: string
    name: string
    description: string
    permissions: Record<string, string[]>
    created_at?: string
}

interface UserPermission {
    id: string
    user_id: string
    role_id: string
    role_name: string
    client_id?: string
    client_name?: string
    project_id?: string
    project_name?: string
    permissions: Record<string, string[]>
}

interface User {
    id: string
    email: string
    full_name?: string
    role: string
    created_at?: string
    last_login?: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [tabValue, setTabValue] = useState(0)
    const [error, setError] = useState<string | null>(null)

    // Edit User Dialog
    const [editDialog, setEditDialog] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({ full_name: '', role: 'user' })

    // User Permissions
    const [permissionsDialog, setPermissionsDialog] = useState(false)
    const [selectedUserPermissions, setSelectedUserPermissions] = useState<UserPermission[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [newPermission, setNewPermission] = useState({ roleId: '', clientId: '', projectId: '' })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [usersData, rolesData, clientsData, projectsData] = await Promise.all([
                api.getUsers(),
                api.getRoles(),
                api.getClients(),
                api.getProjectsSummary()
            ])
            setUsers(usersData)
            setRoles(rolesData)
            setClients(clientsData)
            setProjects(projectsData)
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: User) => {
        setSelectedUser(user)
        setFormData({ full_name: user.full_name || '', role: user.role || 'user' })
        setEditDialog(true)
    }

    const handleSave = async () => {
        if (!selectedUser) return
        try {
            await api.updateUser(selectedUser.id, formData)
            setEditDialog(false)
            loadData()
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar usuário')
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return
        try {
            await api.deleteUser(userId)
            loadData()
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir usuário')
        }
    }

    const handleOpenPermissions = async (user: User) => {
        setSelectedUser(user)
        try {
            const permissions = await api.getUserPermissions(user.id)
            setSelectedUserPermissions(permissions)
            setNewPermission({ roleId: '', clientId: '', projectId: '' })
            setPermissionsDialog(true)
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar permissões')
        }
    }

    const handleAddPermission = async () => {
        if (!selectedUser || !newPermission.roleId) return
        try {
            await api.addUserPermission(selectedUser.id, {
                roleId: newPermission.roleId,
                clientId: newPermission.clientId || null,
                projectId: newPermission.projectId || null
            })
            const permissions = await api.getUserPermissions(selectedUser.id)
            setSelectedUserPermissions(permissions)
            setNewPermission({ roleId: '', clientId: '', projectId: '' })
        } catch (err: any) {
            setError(err.message || 'Erro ao adicionar permissão')
        }
    }

    const handleRemovePermission = async (permissionId: string) => {
        if (!selectedUser) return
        try {
            await api.deleteUserPermission(selectedUser.id, permissionId)
            const permissions = await api.getUserPermissions(selectedUser.id)
            setSelectedUserPermissions(permissions)
        } catch (err: any) {
            setError(err.message || 'Erro ao remover permissão')
        }
    }

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Administrador',
            user: 'Usuário',
            platform_admin: 'Admin Plataforma',
            client_admin: 'Admin Cliente',
            project_manager: 'Gerente de Projeto',
            project_viewer: 'Visualizador'
        }
        return labels[role] || role
    }

    const getRoleColor = (role: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        const colors: Record<string, any> = {
            admin: 'error',
            platform_admin: 'error',
            client_admin: 'warning',
            project_manager: 'info',
            project_viewer: 'default',
            user: 'default'
        }
        return colors[role] || 'default'
    }

    const getRoleIcon = (roleName: string) => {
        if (roleName.includes('admin') || roleName.includes('Admin')) return <AdminIcon fontSize="small" />
        if (roleName.includes('manager') || roleName.includes('Manager')) return <ManagerIcon fontSize="small" />
        if (roleName.includes('viewer') || roleName.includes('Viewer')) return <ViewerIcon fontSize="small" />
        return <SecurityIcon fontSize="small" />
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <div>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Gerenciamento de Usuários
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Administre usuários, permissões e níveis de acesso
                    </Typography>
                </div>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Usuários" />
                <Tab label="Níveis de Acesso (Roles)" />
            </Tabs>

            {/* Users Tab */}
            {tabValue === 0 && (
                <Card>
                    <CardContent>
                        <TableContainer component={Paper} elevation={0}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Nome</strong></TableCell>
                                        <TableCell><strong>Email</strong></TableCell>
                                        <TableCell><strong>Role Base</strong></TableCell>
                                        <TableCell><strong>Criado em</strong></TableCell>
                                        <TableCell><strong>Último Login</strong></TableCell>
                                        <TableCell align="right"><strong>Ações</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} hover>
                                            <TableCell>{user.full_name || '-'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getRoleLabel(user.role)}
                                                    color={getRoleColor(user.role)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Gerenciar Permissões">
                                                    <IconButton onClick={() => handleOpenPermissions(user)} size="small" color="info">
                                                        <SecurityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton onClick={() => handleEdit(user)} size="small" color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton onClick={() => handleDelete(user.id)} size="small" color="error">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Roles Tab */}
            {tabValue === 1 && (
                <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Os níveis de acesso definem quais ações um usuário pode executar. Cada role pode ser atribuído a um usuário
                        para acesso global, a um cliente específico, ou a um projeto específico.
                    </Alert>

                    {roles.map((role) => (
                        <Accordion key={role.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    {getRoleIcon(role.name)}
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {getRoleLabel(role.name)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {role.description}
                                        </Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="subtitle2" gutterBottom>Permissões:</Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {Object.entries(role.permissions || {}).map(([resource, actions]) => (
                                        <Chip
                                            key={resource}
                                            label={`${resource}: ${(actions as string[]).join(', ')}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {/* Edit User Dialog */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogContent>
                    <Box mt={2} display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Nome Completo"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role Base</InputLabel>
                            <Select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                label="Role Base"
                            >
                                <MenuItem value="user">Usuário</MenuItem>
                                <MenuItem value="admin">Administrador</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* Permissions Dialog */}
            <Dialog open={permissionsDialog} onClose={() => setPermissionsDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Gerenciar Permissões - {selectedUser?.full_name || selectedUser?.email}
                </DialogTitle>
                <DialogContent>
                    <Box mt={2}>
                        {/* Current Permissions */}
                        <Typography variant="subtitle2" gutterBottom>Permissões Atuais:</Typography>
                        {selectedUserPermissions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Nenhuma permissão atribuída
                            </Typography>
                        ) : (
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Escopo</TableCell>
                                            <TableCell align="right">Ação</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedUserPermissions.map((perm) => (
                                            <TableRow key={perm.id}>
                                                <TableCell>
                                                    <Chip
                                                        label={getRoleLabel(perm.role_name)}
                                                        size="small"
                                                        color={getRoleColor(perm.role_name)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {perm.project_name ? (
                                                        <Typography variant="body2">
                                                            Projeto: {perm.project_name}
                                                        </Typography>
                                                    ) : perm.client_name ? (
                                                        <Typography variant="body2">
                                                            Cliente: {perm.client_name}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="body2" fontWeight={600}>
                                                            Global (Toda Plataforma)
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemovePermission(perm.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Add New Permission */}
                        <Typography variant="subtitle2" gutterBottom>Adicionar Nova Permissão:</Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={newPermission.roleId}
                                    onChange={(e) => setNewPermission({ ...newPermission, roleId: e.target.value })}
                                    label="Role"
                                    size="small"
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role.id} value={role.id}>
                                            {getRoleLabel(role.name)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Cliente (opcional)</InputLabel>
                                <Select
                                    value={newPermission.clientId}
                                    onChange={(e) => setNewPermission({ ...newPermission, clientId: e.target.value, projectId: '' })}
                                    label="Cliente (opcional)"
                                    size="small"
                                >
                                    <MenuItem value="">Global</MenuItem>
                                    {clients.map((client) => (
                                        <MenuItem key={client.id} value={client.id}>
                                            {client.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Projeto (opcional)</InputLabel>
                                <Select
                                    value={newPermission.projectId}
                                    onChange={(e) => setNewPermission({ ...newPermission, projectId: e.target.value })}
                                    label="Projeto (opcional)"
                                    size="small"
                                >
                                    <MenuItem value="">Todos do Cliente</MenuItem>
                                    {projects
                                        .filter(p => !newPermission.clientId || p.client?.id === newPermission.clientId)
                                        .map((project) => (
                                            <MenuItem key={project.id} value={project.id}>
                                                {project.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                onClick={handleAddPermission}
                                disabled={!newPermission.roleId}
                                startIcon={<AddIcon />}
                            >
                                Adicionar
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPermissionsDialog(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
