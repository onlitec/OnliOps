import { useEffect, useState } from 'react'
import {
    Box, Typography, TextField, MenuItem,
    Card, CardContent, CircularProgress, alpha, Grid,
    Button, Alert
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectUserRole } from '../store/slices/authSlice'
import { setCurrentProject, setCurrentClient } from '../store/slices/projectSlice'
import ProjectCard from '../components/dashboard/ProjectCard'
import PlatformMetrics from '../components/dashboard/PlatformMetrics'
import ClientDetailedCard from '../components/dashboard/ClientDetailedCard'
import { api } from '../services/api'
import {
    Activity,
    Layers,
    Users,
    Monitor,
    HardDrive,
    Smartphone,
    Router as RouterIcon,
    Camera as CameraIcon,
    Shield,
    Server,
    Wifi,
    Cpu
} from 'lucide-react'

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
    const userRole = useAppSelector(selectUserRole)
    const isAdmin = userRole === 'admin'
    const [projects, setProjects] = useState<Project[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ client: 'all', search: '' })
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [projectsData, metricsData, usersData, clientsData] = await Promise.all([
                api.getProjectsSummary(),
                api.getPlatformMetrics(),
                api.getUsers(),
                api.getClients()
            ])
            setProjects(projectsData)
            setMetrics(metricsData)
            setUsers(usersData)
            setClients(clientsData)
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

    // Process clients - start with all clients, then merge project data
    const clientsData = clients.reduce((acc, client) => {
        acc[client.id] = {
            id: client.id,
            name: client.name,
            metrics: {
                projects: 0,
                devices: 0,
                onlineUsers: 0,
                alerts: 0
            },
            projects: [] as Project[]
        }
        return acc
    }, {} as Record<string, any>)

    // Now merge project data into clients
    projects.forEach(project => {
        const clientId = project.client.id
        if (clientsData[clientId]) {
            clientsData[clientId].metrics.projects += 1
            clientsData[clientId].metrics.devices += project.metrics.devices
            clientsData[clientId].metrics.alerts += project.metrics.alerts
            clientsData[clientId].projects.push(project)
        }
    })

    // Calculate online users per client
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000)
    users.forEach(user => {
        if (!user.last_login) return
        const lastLogin = new Date(user.last_login)
        if (lastLogin > thirtyMinsAgo) {
            // Logic to attribute online users to clients could go here
        }
    })

    // Simulated online users count for each client for demo purposes
    Object.values(clientsData).forEach((client: any) => {
        client.metrics.onlineUsers = Math.floor(Math.random() * 5) + 1
    })

    const clientsArray = Object.values(clientsData)
    const selectedClient = selectedClientId ? clientsData[selectedClientId] : null

    // Filtered clients list
    const filteredClients = clientsArray.filter((c: any) => {
        if (filter.client !== 'all' && c.id !== filter.client) return false
        if (filter.search && !c.name.toLowerCase().includes(filter.search.toLowerCase())) return false
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
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                }}>
                    Dashboard OnliOps
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gestão centralizada de clientes e infraestrutura
                </Typography>
            </Box>

            {/* Platform Metrics */}
            {metrics && (
                <Box sx={{ mb: 3 }}>
                    <PlatformMetrics data={metrics} />
                </Box>
            )}

            {/* Main Content Grid */}
            <Grid container spacing={3}>
                {/* Left Column: Client Cards */}
                <Grid size={{ xs: 12, md: selectedClientId ? 5 : 12 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="overline" fontWeight={700} color="text.secondary">
                            Seus Clientes ({filteredClients.length})
                        </Typography>
                        <Box display="flex" gap={1}>
                            <TextField
                                placeholder="Filtrar clientes..."
                                size="small"
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                sx={{
                                    width: selectedClientId ? 150 : 250,
                                    '& .MuiInputBase-root': { height: 32, fontSize: '0.8rem' }
                                }}
                            />
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        {filteredClients.map((client: any) => (
                            <Grid size={{ xs: 12, sm: selectedClientId ? 12 : 6, lg: selectedClientId ? 12 : 3 }} key={client.id}>
                                <ClientDetailedCard
                                    client={client}
                                    selected={selectedClientId === client.id}
                                    onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Right Column: Detailed View */}
                {selectedClient && (
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Box sx={{
                            p: 3,
                            borderRadius: 3,
                            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.4),
                            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            backdropFilter: 'blur(10px)',
                            height: '100%',
                            animation: 'fadeIn 0.4s ease-out'
                        }}>
                            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 1.5,
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    display: 'flex'
                                }}>
                                    <Activity size={24} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>{selectedClient.name}</Typography>
                                    <Typography variant="caption" color="primary.main" fontWeight={600}>VISÃO DETALHADA TÉCNICA</Typography>
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Sub-section: Projects */}
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Layers size={16} /> Projetos Ativos
                                    </Typography>
                                    <Grid container spacing={1.5}>
                                        {selectedClient.projects.map((p: Project) => (
                                            <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                                                <ProjectCard project={p} onSelect={() => handleSelectProject(p)} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>

                                {/* Sub-section: Device Distribution */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <HardDrive size={16} /> Tipos de Dispositivos
                                    </Typography>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: (theme) => alpha(theme.palette.divider, 0.03),
                                        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`
                                    }}>
                                        {[
                                            { icon: CameraIcon, label: 'Câmeras IP', count: Math.ceil(selectedClient.metrics.devices * 0.6), color: '#3b82f6' },
                                            { icon: RouterIcon, label: 'Switches/Routers', count: Math.ceil(selectedClient.metrics.devices * 0.2), color: '#10b981' },
                                            { icon: Server, label: 'Servidores/NVR', count: Math.ceil(selectedClient.metrics.devices * 0.1), color: '#f59e0b' },
                                            { icon: Cpu, label: 'Sensores IoT', count: Math.floor(selectedClient.metrics.devices * 0.1), color: '#6366f1' },
                                        ].map((item, idx) => (
                                            <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" mb={1.5} sx={{ '&:last-child': { mb: 0 } }}>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <item.icon size={14} color={item.color} />
                                                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight={700}>{item.count}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>

                                {/* Sub-section: Online Users */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Users size={16} /> Usuários Online
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                    }}>
                                        {users.slice(0, selectedClient.metrics.onlineUsers).map((u: any, idx: number) => (
                                            <Box key={idx} sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                                                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5
                                            }}>
                                                <Box sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: 'success.main',
                                                    boxShadow: (theme) => `0 0 8px ${theme.palette.success.main}`
                                                }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{u.role}</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                )}
            </Grid>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </Box>
    )
}
