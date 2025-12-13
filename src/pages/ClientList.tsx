import React, { useEffect, useState } from 'react'
import {
    Box, Typography, Grid, Card, CardContent, CardActions,
    Button, Container, Dialog, DialogTitle, DialogContent,
    TextField, DialogActions, Collapse, IconButton, Chip
} from '@mui/material'
import { Plus, Folder, Briefcase, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchClients, fetchClientProjects, setCurrentProject } from '../store/slices/projectSlice'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function ClientList() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { clients, loading } = useAppSelector(state => state.project)

    const [expandedClient, setExpandedClient] = useState<string | null>(null)
    const [projectsMap, setProjectsMap] = useState<Record<string, any[]>>({})

    // Modal states
    const [showNewClient, setShowNewClient] = useState(false)
    const [showNewProject, setShowNewProject] = useState<string | null>(null) // clientId
    const [newItemName, setNewItemName] = useState('')
    const [newItemDesc, setNewItemDesc] = useState('')

    useEffect(() => {
        dispatch(fetchClients())
    }, [dispatch])

    const handleExpandClient = async (clientId: string) => {
        if (expandedClient === clientId) {
            setExpandedClient(null)
            return
        }
        setExpandedClient(clientId)
        if (!projectsMap[clientId]) {
            try {
                const projects = await api.getClientProjects(clientId)
                setProjectsMap(prev => ({ ...prev, [clientId]: projects }))
            } catch (err) {
                console.error("Failed to fetch projects", err)
            }
        }
    }

    const handleSelectProject = (project: any) => {
        dispatch(setCurrentProject(project))
        navigate('/dashboard')
    }

    const createClient = async () => {
        if (!newItemName) return
        try {
            await api.createClient({ name: newItemName })
            dispatch(fetchClients())
            setShowNewClient(false)
            setNewItemName('')
        } catch (err) {
            console.error(err)
        }
    }

    const createProject = async () => {
        if (!newItemName || !showNewProject) return
        try {
            await api.createProject({
                client_id: showNewProject,
                name: newItemName,
                description: newItemDesc
            })
            // Refresh projects for this client
            const projects = await api.getClientProjects(showNewProject)
            setProjectsMap(prev => ({ ...prev, [showNewProject]: projects }))
            setShowNewProject(null)
            setNewItemName('')
            setNewItemDesc('')
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Meus Clientes
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus />}
                    onClick={() => setShowNewClient(true)}
                >
                    Novo Cliente
                </Button>
            </Box>

            <Grid container spacing={3}>
                {clients.map(client => (
                    <Grid size={{ xs: 12 }} key={client.id}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ pb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            p: 1.5,
                                            borderRadius: '50%',
                                            bgcolor: 'primary.light',
                                            color: 'primary.main',
                                            display: 'flex'
                                        }}>
                                            <Briefcase size={24} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6">{client.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {client.id}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <IconButton onClick={() => handleExpandClient(client.id)}>
                                            {expandedClient === client.id ? <ChevronUp /> : <ChevronDown />}
                                        </IconButton>
                                    </Box>
                                </Box>
                            </CardContent>

                            <Collapse in={expandedClient === client.id} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">Projetos</Typography>
                                        <Button
                                            size="small"
                                            startIcon={<Plus size={16} />}
                                            onClick={() => setShowNewProject(client.id)}
                                        >
                                            Novo Projeto
                                        </Button>
                                    </Box>

                                    <Grid container spacing={2}>
                                        {projectsMap[client.id]?.map(project => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                                                <Card
                                                    variant="outlined"
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                                                    }}
                                                    onClick={() => handleSelectProject(project)}
                                                >
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <Folder size={18} color="#666" />
                                                            <Typography variant="subtitle1" fontWeight="medium">{project.name}</Typography>
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {project.description || 'Sem descrição'}
                                                        </Typography>
                                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                            <Chip
                                                                label={project.status}
                                                                size="small"
                                                                color={project.status === 'active' ? 'success' : 'default'}
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                        {(!projectsMap[client.id] || projectsMap[client.id].length === 0) && (
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                                    Nenhum projeto encontrado. Crie um para começar.
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>
                            </Collapse>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Create Client Modal */}
            <Dialog open={showNewClient} onClose={() => setShowNewClient(false)}>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nome do Cliente"
                        fullWidth
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowNewClient(false)}>Cancelar</Button>
                    <Button onClick={createClient} variant="contained">Criar</Button>
                </DialogActions>
            </Dialog>

            {/* Create Project Modal */}
            <Dialog open={!!showNewProject} onClose={() => setShowNewProject(null)}>
                <DialogTitle>Novo Projeto</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nome do Projeto"
                        fullWidth
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Descrição"
                        fullWidth
                        multiline
                        rows={3}
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowNewProject(null)}>Cancelar</Button>
                    <Button onClick={createProject} variant="contained">Criar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}
