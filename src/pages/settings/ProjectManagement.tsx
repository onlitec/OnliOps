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
    alpha,
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
import {
    Building2,
    Users,
    ChevronRight,
    FolderOpen
} from 'lucide-react'
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

    const clientGradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    ]

    const projectGradients = [
        'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
        'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
        'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)',
        'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
        'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)',
        'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    ]

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

                <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: 1200, mx: 'auto' }}>
                    {clients.map((client, index) => {
                        const gradient = clientGradients[index % clientGradients.length]
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={client.id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        border: '1px solid',
                                        borderColor: alpha(theme.palette.divider, 0.08),
                                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                                        backdropFilter: 'blur(12px)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-6px)',
                                            boxShadow: (theme) => `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                                            borderColor: alpha(theme.palette.primary.main, 0.3),
                                            '& .card-gradient': {
                                                height: 6,
                                            },
                                            '& .card-arrow': {
                                                opacity: 1,
                                                transform: 'translateX(0)',
                                            },
                                            '& .card-icon': {
                                                transform: 'scale(1.1) rotate(-5deg)',
                                            },
                                        }
                                    }}
                                    onClick={() => handleClientSelect(client)}
                                >
                                    {/* Gradient accent bar */}
                                    <Box className="card-gradient" sx={{
                                        height: 4,
                                        background: gradient,
                                        transition: 'height 0.3s ease',
                                    }} />
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Box display="flex" alignItems="center" gap={2.5}>
                                                <Box className="card-icon" sx={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: 3,
                                                    background: gradient,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'transform 0.3s ease',
                                                    boxShadow: `0 4px 14px ${alpha('#000', 0.15)}`,
                                                }}>
                                                    <Building2 size={26} color="#fff" strokeWidth={1.8} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="h6" fontWeight={700} sx={{
                                                        fontSize: '1.05rem',
                                                        letterSpacing: '-0.01em',
                                                        lineHeight: 1.3,
                                                    }}>
                                                        {client.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        mt: 0.3,
                                                        opacity: 0.7,
                                                    }}>
                                                        <Users size={12} /> Cliente
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box className="card-arrow" sx={{
                                                opacity: 0,
                                                transform: 'translateX(-8px)',
                                                transition: 'all 0.3s ease',
                                                color: 'text.secondary',
                                            }}>
                                                <ChevronRight size={22} />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )
                    })}
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

            <Grid container spacing={3}>
                {projects.map((project, index) => {
                    const gradient = projectGradients[index % projectGradients.length]
                    const statusColor = project.status === 'active' ? '#22c55e' : '#94a3b8'
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.divider, 0.08),
                                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                                    backdropFilter: 'blur(12px)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-6px)',
                                        boxShadow: (theme) => `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                                        borderColor: alpha(theme.palette.primary.main, 0.3),
                                        '& .card-gradient': { height: 6 },
                                        '& .project-actions': { opacity: 1, transform: 'translateY(0)' }
                                    }
                                }}
                            >
                                <Box className="card-gradient" sx={{
                                    height: 4,
                                    background: gradient,
                                    transition: 'height 0.3s ease',
                                }} />
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={2.5} mb={3}>
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 2.5,
                                            background: gradient,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: `0 4px 12px ${alpha('#000', 0.1)}`,
                                        }}>
                                            <FolderOpen size={24} color="#fff" />
                                        </Box>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Typography variant="h6" fontWeight={800} noWrap sx={{ letterSpacing: '-0.3px' }}>
                                                {project.name}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Chip
                                                    label={getStatusLabel(project.status)}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        bgcolor: alpha(statusColor, 0.1),
                                                        color: statusColor,
                                                        border: `1px solid ${alpha(statusColor, 0.2)}`
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Grid container spacing={2} mb={3}>
                                        <Grid size={{ xs: 6 }}>
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.divider, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Dispositivos</Typography>
                                                <Typography variant="subtitle1" fontWeight={700}>{project.metrics?.devices || 0}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.divider, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Alertas</Typography>
                                                <Typography variant="subtitle1" fontWeight={700} color={project.metrics?.alerts ? 'error.main' : 'inherit'}>
                                                    {project.metrics?.alerts || 0}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ mb: 2, opacity: 0.5 }} />

                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">
                                            {project.metrics?.lastActivity
                                                ? `Lido em ${new Date(project.metrics.lastActivity).toLocaleDateString('pt-BR')}`
                                                : 'Sem atividade'}
                                        </Typography>
                                        <Box className="project-actions" sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            opacity: { xs: 1, md: 0 },
                                            transform: { xs: 'none', md: 'translateY(10px)' },
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <Tooltip title="Editar">
                                                <IconButton size="small" onClick={() => handleEditClick(project)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Integração">
                                                <IconButton size="small" onClick={() => handleIntegrationClick(project)} sx={{ color: 'secondary.main', bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                                                    <RouterIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton size="small" onClick={() => handleDeleteClick(project)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )
                })}
                {projects.length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Box py={8} textAlign="center" bgcolor={alpha(theme.palette.divider, 0.02)} borderRadius={4} border="2px dashed" borderColor="divider">
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                Este cliente ainda não possui projetos.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateClick}
                                sx={{ mt: 1, fontWeight: 700, borderRadius: 2 }}
                            >
                                Criar Primeiro Projeto
                            </Button>
                        </Box>
                    </Grid>
                )}
            </Grid>

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
