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
    Divider,
    Grid,
    CardActionArea
} from '@mui/material'
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Devices as DevicesIcon,
    Notifications as AlertsIcon,
    ArrowBack as ArrowBackIcon,
    Business as BusinessIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon
} from '@mui/icons-material'
import { api } from '../../services/api'
import { useAppDispatch, useAppSelector } from '../../hooks/useApp'
import { setCurrentClient, fetchClients } from '../../store/slices/projectSlice'
import HikCentralConfig from '../../components/integrations/HikCentralConfig'
import { Router as RouterIcon } from '@mui/icons-material'

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
    const dispatch = useAppDispatch()
    const { currentClient, clients } = useAppSelector((state) => state.project)

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

    // Create dialog
    const [createDialog, setCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState({ name: '', description: '', status: 'active' })

    // Integration dialog
    const [integrationDialog, setIntegrationDialog] = useState(false)
    const [activeProjectForIntegration, setActiveProjectForIntegration] = useState<Project | null>(null)

    useEffect(() => {
        if (clients.length === 0) {
            dispatch(fetchClients())
        }
    }, [dispatch, clients.length])

    useEffect(() => {
        if (currentClient) {
            loadProjects()
        } else {
            setLoading(false)
        }
    }, [currentClient])

    const loadProjects = async () => {
        if (!currentClient) return
        setLoading(true)
        setError(null)
        try {
            const data = await api.getClientProjects(currentClient.id)
            setProjects(data)
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar projetos')
        } finally {
            setLoading(false)
        }
    }

    const handleClientSelect = (client: any) => {
        dispatch(setCurrentClient(client))
    }

    const handleCreateClick = () => {
        setCreateForm({ name: '', description: '', status: 'active' })
        setCreateDialog(true)
    }

    const handleCreateSave = async () => {
        if (!currentClient || !createForm.name) return
        setLoading(true)
        try {
            await api.createProject({
                ...createForm,
                client_id: currentClient.id
            })
            setCreateDialog(false)
            loadProjects()
        } catch (err: any) {
            setError(err.message || 'Erro ao criar projeto')
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
    const handleIntegrationClick = (project: Project) => {
        setActiveProjectForIntegration(project)
        setIntegrationDialog(true)
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

    // Client Selection View with Mini Cards
    if (!currentClient) {
        return (
            <Box sx={{ p: 4 }}>
                <Box mb={6} textAlign="center">
                    <Typography variant="h4" fontWeight={900} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                        Gerenciamento de Projetos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Selecione um cliente para visualizar e gerenciar seus projetos associados.
                    </Typography>
                </Box>

                <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 1000, mx: 'auto' }}>
                    {clients.map(client => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={client.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        transform: 'translateY(-2px)',
                                        boxShadow: theme.shadows[4]
                                    }
                                }}
                            >
                                <CardActionArea
                                    onClick={() => handleClientSelect(client)}
                                    sx={{ height: '100%', p: 2 }}
                                >
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: 'rgba(230, 0, 18, 0.05)',
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.main',
                                            border: '1px solid rgba(230, 0, 18, 0.1)'
                                        }}>
                                            <BusinessIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                {client.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Visualizar Projetos
                                            </Typography>
                                        </Box>
                                        <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                    </Box>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                    {clients.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box textAlign="center" py={8} bgcolor="rgba(0,0,0,0.02)" borderRadius={2} border="2px dashed" borderColor="divider">
                                <Typography color="text.secondary">Nenhum cliente cadastrado no sistema.</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Box>
        )
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
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BusinessIcon sx={{ color: 'white', fontSize: 18 }} />
                        </Box>
                        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px' }}>
                            {currentClient.name}
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Gerenciamento de projetos vinculados a este cliente.
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateClick}
                        sx={{
                            fontWeight: 700,
                            bgcolor: 'success.main',
                            '&:hover': { bgcolor: 'success.dark' }
                        }}
                    >
                        Adicionar Projeto
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => dispatch(setCurrentClient(null))}
                        sx={{
                            fontWeight: 700,
                            borderWidth: 2,
                            '&:hover': { borderWidth: 2 }
                        }}
                    >
                        Trocar Cliente
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Card sx={{ border: '2px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>PROJETO</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800 }}>DISPOSITIVOS</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800 }}>ALERTAS</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>ÚLTIMA ATIVIDADE</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>AÇÕES</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow key={project.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700}>
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
                                        <Chip
                                            label={getStatusLabel(project.status)}
                                            color={getStatusColor(project.status)}
                                            size="small"
                                            sx={{ fontWeight: 700, borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={<DevicesIcon fontSize="small" />}
                                            label={project.metrics?.devices || 0}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={<AlertsIcon fontSize="small" />}
                                            label={project.metrics?.alerts || 0}
                                            size="small"
                                            variant="outlined"
                                            color={(project.metrics?.alerts || 0) > 0 ? 'error' : 'default'}
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {project.metrics?.lastActivity
                                                ? new Date(project.metrics.lastActivity).toLocaleDateString('pt-BR')
                                                : 'Sem atividade'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar">
                                            <IconButton
                                                onClick={() => handleEditClick(project)}
                                                size="small"
                                                sx={{ color: 'primary.main' }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton
                                                onClick={() => handleDeleteClick(project)}
                                                size="small"
                                                sx={{ color: 'error.main' }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Integração HikCentral">
                                            <IconButton
                                                onClick={() => handleIntegrationClick(project)}
                                                size="small"
                                                sx={{ color: 'secondary.main' }}
                                            >
                                                <RouterIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {projects.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Box py={8}>
                                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                                Este cliente ainda não possui projetos.
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={handleCreateClick}
                                                sx={{ mt: 1, fontWeight: 700 }}
                                            >
                                                Criar Primeiro Projeto
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Dialogs remain functional and consistent */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Editar Projeto</DialogTitle>
                <DialogContent>
                    <Box mt={2} display="flex" flexDirection="column" gap={3}>
                        <TextField
                            label="Nome do Projeto"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            fullWidth
                            variant="outlined"
                        />
                        <TextField
                            label="Descrição"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEditDialog(false)} sx={{ fontWeight: 700 }}>Cancelar</Button>
                    <Button onClick={handleEditSave} variant="contained" sx={{ fontWeight: 700, px: 4 }}>Salvar</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteDialog}
                onClose={() => !deleting && setDeleteDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
                    <WarningIcon color="error" />
                    Confirmar Exclusão
                </DialogTitle>
                <DialogContent>
                    {deleteResult ? (
                        <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                            {deleteResult.message}
                        </Alert>
                    ) : (
                        <>
                            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700}>Ação Irreversível!</Typography>
                                <Typography variant="body2">
                                    Todos os dispositivos e dados de <strong>"{projectToDelete?.name}"</strong> serão apagados.
                                </Typography>
                            </Alert>

                            <Box mt={3}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Digite <strong>{projectToDelete?.name}</strong> para confirmar:
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Nome do projeto"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    disabled={deleting}
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    {!deleteResult && (
                        <>
                            <Button onClick={() => setDeleteDialog(false)} disabled={deleting} sx={{ fontWeight: 700 }}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleDeleteConfirm}
                                variant="contained"
                                color="error"
                                disabled={deleting || deleteConfirmation !== projectToDelete?.name}
                                startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                                sx={{ fontWeight: 700, px: 3 }}
                            >
                                {deleting ? 'Apagando...' : 'Confirmar Exclusão'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Create Project Dialog */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Novo Projeto</DialogTitle>
                <DialogContent>
                    <Box mt={2} display="flex" flexDirection="column" gap={3}>
                        <TextField
                            label="Nome do Projeto"
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            fullWidth
                            variant="outlined"
                            autoFocus
                        />
                        <TextField
                            label="Descrição"
                            value={createForm.description}
                            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCreateDialog(false)} sx={{ fontWeight: 700 }}>Cancelar</Button>
                    <Button
                        onClick={handleCreateSave}
                        variant="contained"
                        disabled={!createForm.name}
                        sx={{ fontWeight: 700, px: 4 }}
                    >
                        Criar Projeto
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Integration Dialog */}
            <Dialog
                open={integrationDialog}
                onClose={() => setIntegrationDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8f9fa', pb: 2 }}>
                    Integração de Projeto
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {activeProjectForIntegration && (
                        <HikCentralConfig
                            projectId={activeProjectForIntegration.id}
                            projectName={activeProjectForIntegration.name}
                            onClose={() => setIntegrationDialog(false)}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                    <Button onClick={() => setIntegrationDialog(false)} sx={{ fontWeight: 700 }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
