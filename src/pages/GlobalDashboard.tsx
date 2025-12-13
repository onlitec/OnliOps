import { useEffect, useState } from 'react'
import {
    Box, Typography, TextField, MenuItem,
    Card, CardContent, CircularProgress, alpha, Grid
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { setCurrentProject, setCurrentClient } from '../store/slices/projectSlice'
import ProjectCard from '../components/dashboard/ProjectCard'
import PlatformMetrics from '../components/dashboard/PlatformMetrics'
import { api } from '../services/api'

interface Project {
    id: string
    name: string
    client_id?: string
    client: { id: string; name: string }
    status: string
    metrics: { devices: number; alerts: number; lastActivity: string }
}

interface Metrics {
    totalClients: number
    totalProjects: number
    totalDevices: number
    activeAlerts: number
    uptime: string
    lastUpdate: string
}

export default function GlobalDashboard() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [projects, setProjects] = useState<Project[]>([])
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ client: 'all', search: '' })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [projectsData, metricsData] = await Promise.all([
                api.getProjectsSummary(),
                api.getPlatformMetrics()
            ])
            setProjects(projectsData)
            setMetrics(metricsData)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectProject = (project: Project) => {
        const projectForRedux = {
            id: project.id,
            name: project.name,
            client_id: project.client.id,
            status: project.status,
            description: ''
        }
        dispatch(setCurrentProject(projectForRedux))
        dispatch(setCurrentClient({ id: project.client.id, name: project.client.name }))
        navigate(`/dashboard`)
    }

    const clients = [...new Map(projects.map(p => [p.client.id, p.client])).values()]

    const filteredProjects = projects.filter(p => {
        if (filter.client !== 'all' && p.client.id !== filter.client) return false
        if (filter.search && !p.name.toLowerCase().includes(filter.search.toLowerCase())) return false
        return true
    })

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress size={24} />
            </Box>
        )
    }

    return (
        <Box sx={{ px: 2, py: 2 }}>
            {/* Header - Compact */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight={600}>
                    Dashboard da Plataforma
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Selecione um projeto para acessar
                </Typography>
            </Box>

            {/* Platform Metrics - Top Row */}
            {metrics && (
                <Box sx={{ mb: 2 }}>
                    <PlatformMetrics data={metrics} />
                </Box>
            )}

            {/* Filters - Compact */}
            <Box
                sx={{
                    mb: 2,
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                    borderRadius: 1,
                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
            >
                <TextField
                    placeholder="Buscar projeto..."
                    size="small"
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    sx={{ minWidth: 200, flex: 1 }}
                />
                <TextField
                    select
                    size="small"
                    value={filter.client}
                    onChange={(e) => setFilter({ ...filter, client: e.target.value })}
                    sx={{ minWidth: 160 }}
                >
                    <MenuItem value="all">Todos Clientes</MenuItem>
                    {clients.map(client => (
                        <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Section Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                    Projetos ({filteredProjects.length})
                </Typography>
            </Box>

            {/* Projects Grid - Compact */}
            <Grid container spacing={1}>
                {filteredProjects.map(project => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project.id}>
                        <ProjectCard
                            project={project}
                            onSelect={() => handleSelectProject(project)}
                        />
                    </Grid>
                ))}
            </Grid>

            {filteredProjects.length === 0 && (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 4,
                        px: 2,
                        borderRadius: 1,
                        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.3),
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Nenhum projeto encontrado
                    </Typography>
                </Box>
            )}
        </Box>
    )
}
