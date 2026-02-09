import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Container,
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    CircularProgress,
    Divider,
    Breadcrumbs,
    Link
} from '@mui/material'
import {
    Dashboard as DashboardIcon,
    Home as HomeIcon,
    NavigateNext
} from '@mui/icons-material'
import { api } from '../services/api'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { setCurrentClient, setCurrentProject, fetchClientProjects } from '../store/slices/projectSlice'
import Dashboard from '../components/dashboard/Dashboard'

export default function ClientDashboard() {
    const { clientId, projectId } = useParams<{ clientId: string, projectId: string }>()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const { clients, projects, loading } = useAppSelector((state) => state.project)
    const [selectedClient, setSelectedClient] = useState<any>(null)

    useEffect(() => {
        if (clientId) {
            // Find client in state or fetch if not available
            const client = clients.find(c => c.id === clientId)
            if (client) {
                setSelectedClient(client)
                dispatch(setCurrentClient(client))
                dispatch(fetchClientProjects(clientId))
            } else {
                // Fallback: fetch client projects will also help if we need to load clients
                dispatch(fetchClientProjects(clientId))
                api.getClients().then(data => {
                    const c = data.find((cl: any) => cl.id === clientId)
                    if (c) {
                        setSelectedClient(c)
                        dispatch(setCurrentClient(c))
                    }
                })
            }
        }
    }, [clientId, clients, dispatch])

    // Set current project based on URL or first project
    useEffect(() => {
        if (projects.length > 0) {
            if (projectId) {
                const project = projects.find(p => p.id === projectId)
                if (project) {
                    dispatch(setCurrentProject(project))
                }
            } else {
                // Default to first project if none selected
                dispatch(setCurrentProject(projects[0]))
                navigate(`/client/${clientId}/project/${projects[0].id}`, { replace: true })
            }
        }
    }, [projects, projectId, clientId, dispatch, navigate])

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        navigate(`/client/${clientId}/project/${newValue}`)
    }

    if (loading && !selectedClient) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!selectedClient && !loading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h5" color="error">Cliente não encontrado</Typography>
                <Link component="button" onClick={() => navigate('/')}>Voltar para Dashboard Global</Link>
            </Container>
        )
    }

    return (
        <Container maxWidth={false} sx={{ py: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
                    <Link
                        underline="hover"
                        sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Global
                    </Link>
                    <Typography
                        sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', fontWeight: 600 }}
                    >
                        {selectedClient?.name}
                    </Typography>
                </Breadcrumbs>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" fontWeight={800} color="primary.main">
                        {selectedClient?.name}
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="body1" color="text.secondary">
                        Gestão de Projetos e Infraestrutura
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}>
                <Tabs
                    value={projectId || (projects.length > 0 ? projects[0].id : false)}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        bgcolor: 'background.paper',
                        borderBottom: 1,
                        borderColor: 'divider',
                        minHeight: 48,
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            minHeight: 48,
                            fontSize: '0.9rem',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                color: 'primary.main',
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    {projects.map((project) => (
                        <Tab
                            key={project.id}
                            label={project.name}
                            value={project.id}
                            icon={<DashboardIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                        />
                    ))}
                    {projects.length === 0 && <Tab label="Nenhum Projeto Encontrado" disabled />}
                </Tabs>
            </Paper>

            {/* Content Area - Reuse existing Dashboard component which shows project details */}
            <Box sx={{ mt: 2 }}>
                {projectId ? (
                    <Dashboard />
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={24} sx={{ mb: 2 }} />
                        <Typography color="text.secondary">Carregando contexto do projeto...</Typography>
                    </Box>
                )}
            </Box>
        </Container>
    )
}
