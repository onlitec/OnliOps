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
    Alert,
    CircularProgress,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material'
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Devices as DevicesIcon,
    Notifications as AlertsIcon,
    Storage as VlanIcon
} from '@mui/icons-material'
import { api } from '../../services/api'

interface Project {
    id: string
    name: string
    description?: string
    status: string
    client_id?: string
    created_at?: string
    updated_at?: string
    metrics?: {
        devices: number
        alerts: number
        lastActivity?: string
    }
    client?: {
        id: string
        name: string
    }
}

export default function ProjectManagement() {
    const theme = useTheme()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [deleteResult, setDeleteResult] = useState<any>(null)

    // Edit dialog
    const [editDialog, setEditDialog] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [editForm, setEditForm] = useState({ name: '', description: '', status: 'active' })

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getProjectsSummary()
            setProjects(data)
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar projetos')
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (project: Project) => {
        setEditingProject(project)
        setEditForm({
            name: project.name,
            description: project.description || '',
            status: project.status || 'active'
        })
        setEditDialog(true)
    }

    const handleEditSave = async () => {
        if (!editingProject) return
        try {
            await api.updateProject(editingProject.id, editForm)
            setEditDialog(false)
            setEditingProject(null)
            loadProjects()
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar projeto')
        }
    }

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project)
        setDeleteConfirmation('')
        setDeleteResult(null)
        setDeleteDialog(true)
    }

    const handleDeleteConfirm = async () => {
        if (!projectToDelete || deleteConfirmation !== projectToDelete.name) return

        setDeleting(true)
        try {
            const result = await api.deleteProject(projectToDelete.id)
            setDeleteResult(result)
            // Refresh the list after a short delay to show the result
            setTimeout(() => {
                setDeleteDialog(false)
                setProjectToDelete(null)
                setDeleteResult(null)
                loadProjects()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir projeto')
            setDeleting(false)
        }
    }

    const getStatusColor = (status: string): "default" | "success" | "warning" | "error" => {
        const colors: Record<string, "default" | "success" | "warning" | "error"> = {
            active: 'success',
            inactive: 'default',
            maintenance: 'warning',
            archived: 'error'
        }
        return colors[status] || 'default'
    }

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            active: 'Ativo',
            inactive: 'Inativo',
            maintenance: 'Manutenção',
            archived: 'Arquivado'
        }
        return labels[status] || status
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
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Gerenciamento de Projetos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Administre os projetos (tenants) da plataforma. Cuidado ao excluir projetos - todos os dados serão removidos permanentemente.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Projeto</strong></TableCell>
                                    <TableCell><strong>Cliente</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell align="center"><strong>Dispositivos</strong></TableCell>
                                    <TableCell align="center"><strong>Alertas</strong></TableCell>
                                    <TableCell><strong>Última Atividade</strong></TableCell>
                                    <TableCell align="right"><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {project.name}
                                                </Typography>
                                                {project.description && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {project.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {project.client?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(project.status)}
                                                color={getStatusColor(project.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={<DevicesIcon fontSize="small" />}
                                                label={project.metrics?.devices || 0}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={<AlertsIcon fontSize="small" />}
                                                label={project.metrics?.alerts || 0}
                                                size="small"
                                                variant="outlined"
                                                color={(project.metrics?.alerts || 0) > 0 ? 'error' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {project.metrics?.lastActivity
                                                ? new Date(project.metrics.lastActivity).toLocaleDateString('pt-BR')
                                                : 'Nunca'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    onClick={() => handleEditClick(project)}
                                                    size="small"
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir Projeto">
                                                <IconButton
                                                    onClick={() => handleDeleteClick(project)}
                                                    size="small"
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {projects.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography color="text.secondary" py={4}>
                                                Nenhum projeto encontrado
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Projeto</DialogTitle>
                <DialogContent>
                    <Box mt={2} display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Nome do Projeto"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Descrição"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
                    <Button onClick={handleEditSave} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog}
                onClose={() => !deleting && setDeleteDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    Excluir Projeto
                </DialogTitle>
                <DialogContent>
                    {deleteResult ? (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {deleteResult.message}
                            </Typography>
                            <Typography variant="body2">
                                Dados removidos: {deleteResult.deleted.devices} dispositivos, {deleteResult.deleted.alerts} alertas, {deleteResult.deleted.vlans} VLANs
                            </Typography>
                        </Alert>
                    ) : (
                        <>
                            <Alert severity="error" sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Atenção: Esta ação é irreversível!
                                </Typography>
                                <Typography variant="body2">
                                    Ao excluir o projeto <strong>"{projectToDelete?.name}"</strong>, todos os dados relacionados serão removidos permanentemente:
                                </Typography>
                                <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                                    <li>Todos os dispositivos ({projectToDelete?.metrics?.devices || 0})</li>
                                    <li>Todos os alertas ({projectToDelete?.metrics?.alerts || 0})</li>
                                    <li>Todas as VLANs e conexões de topologia</li>
                                    <li>Todos os logs de auditoria</li>
                                    <li>Todas as permissões associadas</li>
                                </Box>
                            </Alert>

                            <Box mt={3}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Para confirmar, digite o nome do projeto: <strong>{projectToDelete?.name}</strong>
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder={projectToDelete?.name}
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    disabled={deleting}
                                    error={deleteConfirmation.length > 0 && deleteConfirmation !== projectToDelete?.name}
                                    helperText={
                                        deleteConfirmation.length > 0 && deleteConfirmation !== projectToDelete?.name
                                            ? 'O nome não confere'
                                            : ''
                                    }
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {!deleteResult && (
                        <>
                            <Button onClick={() => setDeleteDialog(false)} disabled={deleting}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleDeleteConfirm}
                                variant="contained"
                                color="error"
                                disabled={deleting || deleteConfirmation !== projectToDelete?.name}
                                startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                            >
                                {deleting ? 'Excluindo...' : 'Excluir Projeto'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    )
}
